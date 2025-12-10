import Chat from '../model/chatModel.js';
import Message from '../model/messageModel.js';
import User from '../model/userModel.js';
import mongoose from 'mongoose';
import { emitMessageToUsers, emitChatUpdateToUsers } from '../realtime/socket.js';
import { isAdmin } from '../utils/roleHelpers.js';

// Get or create a chat between two users
// Get or create a chat between two users
export const getOrCreateChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.user.id;
    const { 'x-brand-id': brandId } = req.headers;

    if (!participantId) {
      return res.status(400).json({ message: "Participant ID is required" });
    }

    if (!brandId) {
      return res.status(400).json({ message: "Brand context is required to create a chat" });
    }

    if (participantId === currentUserId) {
      return res.status(400).json({ message: "Cannot create chat with yourself" });
    }

    // Check if chat already exists (use $all with ObjectIds)
    // Filter by brand as well
    let chat = await Chat.findOne({
      type: 'user',
      participants: { $all: [new mongoose.Types.ObjectId(currentUserId), new mongoose.Types.ObjectId(participantId)], $size: 2 },
      ...req.brandFilter
    }).populate('participants', 'fullName email avatar')
      .populate('lastMessage.sender', 'fullName email avatar');

    if (!chat) {
      // Check if user has owner privileges - only Owner can create new chats
      const userRoles = req.user.roles || [];
      const isOwnerUser = Array.isArray(userRoles) ? userRoles.includes('Owner') : userRoles === 'Owner';

      // Allow if brand context is valid
      // Note: Original logic restricted creation to Owner. keeping that check but also enforcing brand.
      if (!isOwnerUser) {
        return res.status(403).json({ message: "Access denied. Only the Owner can initiate new chats." });
      }

      // Verify participant exists
      const participant = await User.findById(participantId);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }

      // Create new chat
      chat = new Chat({
        type: 'user',
        participants: [currentUserId, participantId],
        createdBy: currentUserId,
        brand: brandId // Set the brand
      });

      await chat.save();
      await chat.populate('participants', 'fullName email avatar');
    }

    return res.status(200).json({ chat });
  } catch (error) {
    console.error("Error getting or creating chat:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all chats for current user
// Get all chats for current user
export const getChats = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Apply brand filter
    const query = {
      participants: currentUserId,
      ...req.brandFilter
    };

    const chats = await Chat.find(query)
      .populate('participants', 'fullName email avatar')
      .populate('lastMessage.sender', 'fullName email avatar')
      .sort({ updatedAt: -1 });

    return res.status(200).json({ chats });
  } catch (error) {
    console.error("Error getting chats:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get messages for a chat
// Get messages for a chat
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.id;

    // Verify user is a participant AND chat exists in current brand context
    const chat = await Chat.findOne({
      _id: chatId,
      ...req.brandFilter
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found or access denied" });
    }

    // Convert to string for comparison
    const participantIds = chat.participants.map(p => p.toString());
    if (!participantIds.includes(currentUserId.toString())) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ chat: chatId })
      // Populate sender with avatar field
      .populate('sender', 'fullName email avatar')
      .sort({ createdAt: 1 })
      .limit(200); // Increase limit to 200 messages

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Error getting messages:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;
    const currentUserId = req.user.id;

    if (!chatId || !text || !text.trim()) {
      return res.status(400).json({ message: "Chat ID and message text are required" });
    }

    // Verify chat exists and user is a participant AND chat exists in current brand context
    const chat = await Chat.findOne({
      _id: chatId,
      ...req.brandFilter
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found or access denied" });
    }

    // Convert to string for comparison
    const participantIds = chat.participants.map(p => p.toString());
    if (!participantIds.includes(currentUserId.toString())) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Create message
    const message = new Message({
      chat: chatId,
      sender: currentUserId,
      text: text.trim(),
      readBy: [{
        user: currentUserId,
        readAt: new Date()
      }]
    });

    await message.save();
    // Populate sender with avatar field
    await message.populate('sender', 'fullName email avatar');

    // Update chat's last message
    chat.lastMessage = {
      text: message.text,
      timestamp: message.createdAt,
      sender: currentUserId
    };
    await chat.save();

    // Get recipient user IDs (exclude sender)
    const recipientIds = chat.participants
      .map(p => p.toString())
      .filter(id => id !== currentUserId.toString());

    // Format message for Socket.IO
    const messageData = {
      _id: message._id.toString(),
      id: message._id.toString(),
      chatId: chatId.toString(),
      text: message.text,
      createdAt: message.createdAt,
      sender: {
        _id: message.sender._id.toString(),
        id: message.sender._id.toString(),
        fullName: message.sender.fullName,
        email: message.sender.email,
        // Include avatar in the sender data
        avatar: message.sender.avatar || null
      }
    };

    // Emit message to recipients via Socket.IO
    if (recipientIds.length > 0) {
      emitMessageToUsers(recipientIds, messageData);
    }

    // Emit chat update to all participants
    const chatUpdateData = {
      _id: chat._id.toString(),
      id: chat._id.toString(),
      type: chat.type,
      name: chat.name,
      lastMessage: {
        text: message.text,
        timestamp: message.createdAt
      }
    };
    emitChatUpdateToUsers(chat.participants.map(p => p.toString()), chatUpdateData);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Create a group chat
// Create a group chat
export const createGroupChat = async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    const currentUserId = req.user.id;
    const { 'x-brand-id': brandId } = req.headers;

    if (!brandId) {
      return res.status(400).json({ message: "Brand context is required to create a group chat" });
    }

    // Check if user has owner privileges
    const userRoles = req.user.roles || [];
    const isOwnerUser = Array.isArray(userRoles) ? userRoles.includes('Owner') : userRoles === 'Owner';

    if (!isOwnerUser) {
      return res.status(403).json({ message: "Access denied. Only the Owner can create group chats." });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Create participants array with at least the creator
    let participants = [currentUserId];

    // Add other participants if provided
    if (participantIds && Array.isArray(participantIds) && participantIds.length > 0) {
      // Verify all participants exist
      const allParticipantIds = [currentUserId, ...participantIds];
      const users = await User.find({ _id: { $in: allParticipantIds } });
      if (users.length !== allParticipantIds.length) {
        return res.status(404).json({ message: "One or more participants not found" });
      }
      participants = allParticipantIds;
    }

    // Create group chat
    const chat = new Chat({
      type: 'group',
      name: name.trim(),
      participants: participants,
      createdBy: currentUserId,
      brand: brandId // Set the brand
    });

    await chat.save();
    await chat.populate('participants', 'fullName email avatar');

    return res.status(201).json({ chat });
  } catch (error) {
    console.error("Error creating group chat:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Add participant to group
export const addParticipantToGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { participantId } = req.body;
    const currentUserId = req.user.id;

    if (!participantId) {
      return res.status(400).json({ message: "Participant ID is required" });
    }

    // Verify chat exists and is a group chat
    const chat = await Chat.findOne({
      _id: chatId,
      ...req.brandFilter
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found or access denied" });
    }

    if (chat.type !== 'group') {
      return res.status(400).json({ message: "Can only add participants to group chats" });
    }

    // Verify user is a participant (only participants can add others)
    const participantIds = chat.participants.map(p => p.toString());
    if (!participantIds.includes(currentUserId.toString())) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if participant is already in the group
    if (participantIds.includes(participantId)) {
      return res.status(400).json({ message: "Participant is already in the group" });
    }

    // Verify participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Add participant to group
    chat.participants.push(participantId);
    await chat.save();
    await chat.populate('participants', 'fullName email avatar');

    // Emit chat update to all participants
    const chatUpdateData = {
      _id: chat._id.toString(),
      id: chat._id.toString(),
      type: chat.type,
      name: chat.name,
      participants: chat.participants.map(p => ({
        _id: p._id.toString(),
        id: p._id.toString(),
        fullName: p.fullName,
        email: p.email,
        avatar: p.avatar || null
      }))
    };
    emitChatUpdateToUsers(chat.participants.map(p => p.toString()), chatUpdateData);

    return res.status(200).json({ chat });
  } catch (error) {
    console.error("Error adding participant to group:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Remove participant from group
export const removeParticipantFromGroup = async (req, res) => {
  try {
    const { chatId, participantId } = req.params;
    const currentUserId = req.user.id;

    // Verify chat exists and is a group chat
    const chat = await Chat.findOne({
      _id: chatId,
      ...req.brandFilter
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found or access denied" });
    }

    if (chat.type !== 'group') {
      return res.status(400).json({ message: "Can only remove participants from group chats" });
    }

    // Verify user is a participant (only participants can remove others)
    const participantIds = chat.participants.map(p => p.toString());
    if (!participantIds.includes(currentUserId.toString())) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Prevent removing the group creator (unless it's the creator themselves)
    if (participantId === chat.createdBy.toString() && currentUserId.toString() !== chat.createdBy.toString()) {
      return res.status(403).json({ message: "Cannot remove group creator" });
    }

    // Check if participant is in the group
    if (!participantIds.includes(participantId)) {
      return res.status(400).json({ message: "Participant is not in the group" });
    }

    // Remove participant from group
    chat.participants = chat.participants.filter(p => p.toString() !== participantId);
    await chat.save();
    await chat.populate('participants', 'fullName email avatar');

    // Emit chat update to all participants
    const chatUpdateData = {
      _id: chat._id.toString(),
      id: chat._id.toString(),
      type: chat.type,
      name: chat.name,
      participants: chat.participants.map(p => ({
        _id: p._id.toString(),
        id: p._id.toString(),
        fullName: p.fullName,
        email: p.email,
        avatar: p.avatar || null
      }))
    };
    emitChatUpdateToUsers(chat.participants.map(p => p.toString()), chatUpdateData);

    return res.status(200).json({ chat });
  } catch (error) {
    console.error("Error removing participant from group:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete group chat
export const deleteGroupChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.id;

    // Verify chat exists and is a group chat
    const chat = await Chat.findOne({
      _id: chatId,
      ...req.brandFilter
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found or access denied" });
    }

    if (chat.type !== 'group') {
      return res.status(400).json({ message: "Can only delete group chats" });
    }

    // Check if user has owner privileges
    const userRoles = req.user.roles || [];
    const isOwnerUser = Array.isArray(userRoles) ? userRoles.includes('Owner') : userRoles === 'Owner';

    if (!isOwnerUser) {
      return res.status(403).json({ message: "Access denied. Only the Owner can delete group chats." });
    }

    // Delete all messages in the group
    await Message.deleteMany({ chat: chatId });

    // Delete the group chat
    await Chat.findByIdAndDelete(chatId);

    // Emit chat deletion notification to all participants
    const chatDeleteData = {
      _id: chat._id.toString(),
      id: chat._id.toString(),
      type: 'deleted'
    };
    emitChatUpdateToUsers(chat.participants.map(p => p.toString()), chatDeleteData);

    return res.status(200).json({ message: "Group chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting group chat:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.id;

    // Verify user is a participant
    const chat = await Chat.findOne({
      _id: chatId,
      ...req.brandFilter
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found or access denied" });
    }

    // Convert to string for comparison
    const participantIds = chat.participants.map(p => p.toString());
    if (!participantIds.includes(currentUserId.toString())) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: currentUserId },
        'readBy.user': { $ne: currentUserId }
      },
      {
        $push: {
          readBy: {
            user: currentUserId,
            readAt: new Date()
          }
        }
      }
    );

    return res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a one-on-one chat (Owner only)
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const currentUserId = req.user.id;

    // Check if user has owner privileges
    const userRoles = req.user.roles || [];
    const isOwnerUser = Array.isArray(userRoles) ? userRoles.includes('Owner') : userRoles === 'Owner';

    if (!isOwnerUser) {
      return res.status(403).json({ message: "Access denied. Only the Owner can delete chats." });
    }

    // Verify chat exists and is a one-on-one chat
    const chat = await Chat.findOne({
      _id: chatId,
      ...req.brandFilter
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found or access denied" });
    }

    if (chat.type !== 'user') {
      return res.status(400).json({ message: "Can only delete one-on-one chats with this endpoint. Use deleteGroupChat for groups." });
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chat: chatId });

    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    return res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a single message (Owner only)
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    // Check if user has owner privileges
    const userRoles = req.user.roles || [];
    const isOwnerUser = Array.isArray(userRoles) ? userRoles.includes('Owner') : userRoles === 'Owner';

    if (!isOwnerUser) {
      return res.status(403).json({ message: "Access denied. Only the Owner can delete messages." });
    }

    // Find the message first to check brand access via chat
    const messageToCheck = await Message.findById(messageId);

    if (!messageToCheck) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Verify permission via chat brand
    const chat = await Chat.findOne({
      _id: messageToCheck.chat,
      ...req.brandFilter
    });

    if (!chat) {
      return res.status(403).json({ message: "Access denied. Message belongs to a different brand." });
    }

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};