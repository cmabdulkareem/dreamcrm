import express from "express";
import {
  getOrCreateChat,
  getChats,
  getMessages,
  sendMessage,
  createGroupChat,
  markMessagesAsRead,
  addParticipantToGroup,
  removeParticipantFromGroup,
  deleteGroupChat,
  deleteChat,
  deleteMessage
} from '../controller/chatController.js';
import verifyToken from "../middleware/verifyToken.js";
import { applyBrandFilter } from "../middleware/brandMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);
// Apply brand filter to all routes
router.use(applyBrandFilter);

// Get or create a chat
router.post('/get-or-create', getOrCreateChat);

// Get all chats for current user
router.get('/', getChats);

// Get messages for a chat
router.get('/:chatId/messages', getMessages);

// Send a message
router.post('/message', sendMessage);

// Create a group chat
router.post('/group', createGroupChat);

// Delete a group chat
router.delete('/group/:chatId', deleteGroupChat);

// Add participant to group
router.post('/:chatId/participants', addParticipantToGroup);

// Remove participant from group
router.delete('/:chatId/participants/:participantId', removeParticipantFromGroup);

// Mark messages as read
router.put('/:chatId/read', markMessagesAsRead);

// Delete message (Owner only) - must be before /:chatId to avoid conflict
router.delete('/messages/:messageId', deleteMessage);

// Delete one-on-one chat (Owner only)
router.delete('/:chatId', deleteChat);

export default router;