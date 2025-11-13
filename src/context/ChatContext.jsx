import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

const API = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL_PRODUCTION || "https://dreamcrm.onrender.com/api"
  : import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Get Socket.IO server URL (same origin as API)
const getSocketUrl = () => {
  if (import.meta.env.PROD) {
    const prodUrl = import.meta.env.VITE_API_URL_PRODUCTION || "https://dreamcrm.onrender.com/api";
    return prodUrl.replace('/api', '');
  } else {
    const devUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    return devUrl.replace('/api', '');
  }
};
const SOCKET_URL = getSocketUrl();

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [showContacts, setShowContacts] = useState(false);
  const [showGroupParticipants, setShowGroupParticipants] = useState(false);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({}); // Track unread message counts per chat
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false); // Track if there are any unread messages
  const onlineStatusIntervalRef = useRef(null);
  const socketRef = useRef(null);
  
  // Normalize user ID - handle both 'id' and '_id' formats
  const userId = user ? (user._id || user.id) : null;

  // Fetch chats from server
  const fetchChats = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await axios.get(`${API}/chats`, {
        withCredentials: true,
        timeout: 10000
      });
      
      const serverChats = response.data.chats || [];
      
      // Format chats for frontend
      const formattedChats = serverChats.map(chat => ({
        id: chat._id || chat.id,
        type: chat.type,
        name: chat.name || (chat.participants?.find(p => (p._id || p.id) !== userId)?.fullName || 'Unknown'),
        participants: chat.participants || [],
        createdBy: chat.createdBy || null,
        createdAt: chat.createdAt,
        lastMessage: chat.lastMessage ? {
          text: chat.lastMessage.text,
          timestamp: chat.lastMessage.timestamp
        } : null
      }));
      
      setChats(formattedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }, [userId]);

  // Load chats from server on mount
  useEffect(() => {
    if (userId) {
      fetchChats();
    }
  }, [userId, fetchChats]);

  // Fetch all users from the API
  const fetchUsers = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch all users and online users in parallel
      const [usersResponse, onlineResponse] = await Promise.all([
        axios.get(`${API}/users/dropdown`, { 
          withCredentials: true,
          timeout: 10000
        }),
        axios.get(`${API}/users/online`, { 
          withCredentials: true,
          timeout: 10000
        }).catch(() => ({ data: { onlineUsers: [] } })) // Fallback if endpoint doesn't exist yet
      ]);
      
      const allUsers = usersResponse.data.users || [];
      const onlineUsersList = onlineResponse.data.onlineUsers || [];
      
      // Normalize user IDs - handle both 'id' and '_id' formats
      const normalizeUserId = (u) => u._id || u.id;
      
      // Filter out current user and format the data
      const filteredUsers = allUsers
        .filter(contact => normalizeUserId(contact) !== userId)
        .map(contact => {
          const contactId = normalizeUserId(contact);
          return {
            _id: contactId,
            fullName: contact.fullName,
            email: contact.email,
            avatar: contact.avatar || `/images/user/user-${(contactId.charCodeAt(0) % 4) + 1}.jpg`
          };
        });
      
      setContacts(filteredUsers);
      
      // Set online users from server response
      const formattedOnlineUsers = onlineUsersList
        .filter(u => normalizeUserId(u) !== userId)
        .map(u => {
          const uId = normalizeUserId(u);
          return {
            _id: uId,
            fullName: u.fullName,
            email: u.email,
            avatar: u.avatar || `/images/user/user-${(uId.charCodeAt(0) % 4) + 1}.jpg`
          };
        });
      
      setOnlineUsers(formattedOnlineUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initialize Socket.IO connection and set up real-time messaging
  useEffect(() => {
    if (!userId || !user) return;

    // Initialize Socket.IO connection
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Register user with socket server
    socket.on('connect', () => {
      socket.emit('register', {
        userId: userId,
        fullName: user.fullName || 'User'
      });
    });

    // Listen for new messages
    socket.on('newMessage', (messageData) => {
      const message = {
        id: messageData._id || messageData.id,
        chatId: messageData.chatId,
        sender: {
          _id: messageData.sender._id || messageData.sender.id,
          fullName: messageData.sender.fullName,
          // Use the avatar from messageData if available, otherwise generate default
          avatar: messageData.sender.avatar || `/images/user/user-${((messageData.sender._id || messageData.sender.id || '0').charCodeAt(0) % 4) + 1}.jpg`
        },
        text: messageData.text,
        timestamp: messageData.createdAt || new Date().toISOString(),
      };

      // Add message to state
      setMessages(prev => {
        const existingMessages = prev[message.chatId] || [];
        // Check if message already exists (avoid duplicates)
        if (existingMessages.some(m => m.id === message.id)) {
          return prev;
        }
      
        // Update unread count for this chat if it's not the current user's message
        const messageSenderId = message.sender._id || message.sender.id;
        if (userId && messageSenderId !== userId) {
          setUnreadCounts(prevUnread => ({
            ...prevUnread,
            [message.chatId]: (prevUnread[message.chatId] || 0) + 1
          }));
          setHasUnreadMessages(true);
        }
      
        return {
          ...prev,
          [message.chatId]: [...existingMessages, message]
        };
      });

      // Update chat's last message
      setChats(prev => prev.map(chat => 
        chat.id === message.chatId 
          ? { ...chat, lastMessage: { text: message.text, timestamp: message.timestamp } }
          : chat
      ));

      // If this chat is currently active, mark messages as read
      if (activeChat && activeChat.id === message.chatId) {
        axios.put(`${API}/chats/${message.chatId}/read`, {}, {
          withCredentials: true,
          timeout: 5000
        }).catch(() => {});
        
        // Reset unread count for this chat
        setUnreadCounts(prevUnread => ({
          ...prevUnread,
          [message.chatId]: 0
        }));
      }
    });

    // Listen for chat updates
    socket.on('chatUpdated', (chatData) => {
      // Handle chat deletion
      if (chatData.type === 'deleted') {
        // Remove deleted chat from chats list
        setChats(prev => prev.filter(chat => chat.id !== chatData.id));
        
        // If the deleted chat is currently active, close it
        if (activeChat && activeChat.id === chatData.id) {
          closeChat();
        }
        
        // Remove messages for deleted chat
        setMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[chatData.id];
          return newMessages;
        });
        
        return;
      }
      
      setChats(prev => {
        const existingChatIndex = prev.findIndex(c => c.id === chatData.id);
        if (existingChatIndex >= 0) {
          // Update existing chat
          return prev.map((c, idx) => 
            idx === existingChatIndex 
              ? { ...c, lastMessage: chatData.lastMessage, participants: chatData.participants || c.participants }
              : c
          );
        } else {
          // This shouldn't happen often, but refresh chats if needed
          fetchChats();
          return prev;
        }
      });
    });

    // Handle socket errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [userId, user, activeChat, fetchChats]);

  // Set user as online when they log in and maintain heartbeat
  useEffect(() => {
    if (userId) {
      // Mark user as online on server immediately
      const markUserOnline = async () => {
        try {
          await axios.post(`${API}/users/online`, {}, {
            withCredentials: true,
            timeout: 5000
          });
          
          // Fetch updated online users list
          fetchUsers();
        } catch (error) {
          console.error('Error marking user as online:', error);
        }
      };
      
      markUserOnline();
      
      // Set up heartbeat - update online status every 30 seconds to keep user online
      const heartbeatInterval = setInterval(async () => {
        try {
          await axios.post(`${API}/users/online`, {}, {
            withCredentials: true,
            timeout: 5000
          });
        } catch (error) {
          console.error('Error updating heartbeat:', error);
        }
      }, 30000); // Every 30 seconds
      
      // Set up periodic refresh of online users list (every 30 seconds)
      onlineStatusIntervalRef.current = setInterval(() => {
        fetchUsers();
      }, 30000);
      
      // Cleanup on unmount or user change
      return () => {
        clearInterval(heartbeatInterval);
        if (onlineStatusIntervalRef.current) {
          clearInterval(onlineStatusIntervalRef.current);
          onlineStatusIntervalRef.current = null;
        }
      };
    }
  }, [userId, fetchUsers]);

  const createChat = async (participants, isGroup = false, groupName = '') => {
    if (!userId) return null;
    
    try {
      if (isGroup) {
        // Create group chat with selected participants
        const participantIds = participants.map(p => p._id || p.id);
        const response = await axios.post(`${API}/chats/group`, {
          name: groupName,
          participantIds: participantIds
        }, {
          withCredentials: true,
          timeout: 10000
        });
        
        const serverChat = response.data.chat;
        const newChat = {
          id: serverChat._id || serverChat.id,
          type: 'group',
          name: serverChat.name,
          participants: serverChat.participants || [],
          createdBy: serverChat.createdBy || userId,
          createdAt: serverChat.createdAt,
          lastMessage: null
        };
        
        setChats(prev => [...prev, newChat]);
        return newChat;
      } else {
        // Get or create user chat
        const participantId = participants[0]?._id || participants[0]?.id;
        if (!participantId) return null;
        
        const response = await axios.post(`${API}/chats/get-or-create`, {
          participantId: participantId
        }, {
          withCredentials: true,
          timeout: 10000
        });
        
        const serverChat = response.data.chat;
        const newChat = {
          id: serverChat._id || serverChat.id,
          type: 'user',
          name: serverChat.participants?.find(p => (p._id || p.id) !== userId)?.fullName || 'Unknown',
          participants: serverChat.participants || [],
          createdBy: serverChat.createdBy || null,
          createdAt: serverChat.createdAt,
          lastMessage: serverChat.lastMessage ? {
            text: serverChat.lastMessage.text,
            timestamp: serverChat.lastMessage.timestamp
          } : null
        };
        
        // Check if chat already exists in list
        const existingChatIndex = chats.findIndex(c => c.id === newChat.id);
        if (existingChatIndex >= 0) {
          // Update existing chat
          setChats(prev => prev.map((c, idx) => idx === existingChatIndex ? newChat : c));
        } else {
          // Add new chat
          setChats(prev => [...prev, newChat]);
        }
        
        return newChat;
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  };

  // Fetch messages for a chat
  const fetchMessages = async (chatId) => {
    if (!chatId || !userId) return;
    
    try {
      const response = await axios.get(`${API}/chats/${chatId}/messages`, {
        withCredentials: true,
        timeout: 10000
      });
      
      const serverMessages = response.data.messages || [];
      
      // Format messages for frontend
      const formattedMessages = serverMessages.map(msg => ({
        id: msg._id || msg.id,
        chatId: chatId,
        sender: {
          _id: msg.sender._id || msg.sender.id,
          fullName: msg.sender.fullName,
          // Use the avatar from msg.sender if available, otherwise generate default
          avatar: msg.sender.avatar || `/images/user/user-${((msg.sender._id || msg.sender.id || '0').charCodeAt(0) % 4) + 1}.jpg`
        },
        text: msg.text,
        timestamp: msg.createdAt || new Date().toISOString(),
      }));
      
      setMessages(prev => ({
        ...prev,
        [chatId]: formattedMessages
      }));
      
      // Mark messages as read and reset unread count
      try {
        await axios.put(`${API}/chats/${chatId}/read`, {}, {
          withCredentials: true,
          timeout: 5000
        });
        
        // Reset unread count for this chat
        setUnreadCounts(prevUnread => ({
          ...prevUnread,
          [chatId]: 0
        }));
        
        // Check if there are still any unread messages
        const hasUnread = Object.values({ ...unreadCounts, [chatId]: 0 }).some(count => count > 0);
        setHasUnreadMessages(hasUnread);
      } catch (error) {
        // Ignore read status errors
      }
      
      // Scroll to bottom after fetching messages
      setTimeout(() => {
        const event = new CustomEvent('scrollToBottom');
        window.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (chatId, text) => {
    if (!text.trim() || !user || !userId) return;
    
    try {
      // Send message to server
      const response = await axios.post(`${API}/chats/message`, {
        chatId: chatId,
        text: text.trim()
      }, {
        withCredentials: true,
        timeout: 10000
      });
      
      const serverMessage = response.data.message;
      
      // Format message for frontend
      const newMessage = {
        id: serverMessage._id || serverMessage.id,
        chatId: chatId,
        sender: {
          _id: serverMessage.sender._id || serverMessage.sender.id,
          fullName: serverMessage.sender.fullName,
          avatar: serverMessage.sender.avatar || `/images/user/user-${((serverMessage.sender._id || serverMessage.sender.id).charCodeAt(0) % 4) + 1}.jpg`
        },
        text: serverMessage.text,
        timestamp: serverMessage.createdAt || new Date().toISOString(),
      };
      
      // Update messages in state
      setMessages(prev => {
        const currentMessages = prev[chatId] || [];
        // Limit to last 200 messages to prevent memory issues
        const updatedMessages = [...currentMessages, newMessage];
        if (updatedMessages.length > 200) {
          return {
            ...prev,
            [chatId]: updatedMessages.slice(-200)
          };
        }
        return {
          ...prev,
          [chatId]: updatedMessages
        };
      });
      
      // Update last message in chat
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, lastMessage: { text: newMessage.text, timestamp: newMessage.timestamp } }
          : chat
      ));
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        const event = new CustomEvent('scrollToBottom');
        window.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally show error to user
    }
  };
  
  // Add participant to group
  const addParticipantToGroup = async (chatId, participant) => {
    if (!chatId || !participant) return;
    
    try {
      // Make API call to add participant to group
      const response = await axios.post(`${API}/chats/${chatId}/participants`, {
        participantId: participant._id || participant.id
      }, {
        withCredentials: true,
        timeout: 10000
      });
      
      const updatedChat = response.data.chat;
      
      // Update chat in state
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              participants: updatedChat.participants || chat.participants,
              createdBy: updatedChat.createdBy || chat.createdBy
            }
          : chat
      ));
      
      // If this is the active chat, update it too
      if (activeChat && activeChat.id === chatId) {
        setActiveChat(prev => ({
          ...prev,
          participants: updatedChat.participants || prev.participants,
          createdBy: updatedChat.createdBy || prev.createdBy
        }));
      }
    } catch (error) {
      console.error('Error adding participant to group:', error);
      // Optionally show error to user
    }
  };

  // Remove participant from group
  const removeParticipantFromGroup = async (chatId, participantId) => {
    if (!chatId || !participantId) return;
    
    try {
      // Make API call to remove participant from group
      const response = await axios.delete(`${API}/chats/${chatId}/participants/${participantId}`, {
        withCredentials: true,
        timeout: 10000
      });
      
      const updatedChat = response.data.chat;
      
      // Update chat in state
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              participants: updatedChat.participants || chat.participants,
              createdBy: updatedChat.createdBy || chat.createdBy
            }
          : chat
      ));
      
      // If this is the active chat, update it too
      if (activeChat && activeChat.id === chatId) {
        setActiveChat(prev => ({
          ...prev,
          participants: updatedChat.participants || prev.participants,
          createdBy: updatedChat.createdBy || prev.createdBy
        }));
      }
    } catch (error) {
      console.error('Error removing participant from group:', error);
      // Optionally show error to user
    }
  };

  // Delete group chat
  const deleteGroupChat = async (chatId) => {
    if (!chatId) return;
    
    try {
      // Make API call to delete group chat
      const response = await axios.delete(`${API}/chats/group/${chatId}`, {
        withCredentials: true,
        timeout: 10000
      });
      
      // Remove chat from state
      setChats(prev => prev.filter(chat => chat && chat.id !== chatId));
      
      // If this is the active chat, close it
      if (activeChat && activeChat.id === chatId) {
        closeChat();
      }
      
      return response.data;
    } catch (error) {
      console.error('Error deleting group chat:', error);
      throw error;
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const openChat = async (chat) => {
    setActiveChat(chat);
    setIsChatOpen(true);
    setShowContacts(false);
    setShowGroupParticipants(false);
    
    // Fetch messages for this chat
    if (chat && chat.id) {
      await fetchMessages(chat.id);
    }
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setActiveChat(null);
    setShowContacts(false);
    setShowGroupParticipants(false);
  };

  // Handle back navigation
  const handleBack = () => {
    if (showContacts) {
      setShowContacts(false);
    } else if (showGroupParticipants) {
      setShowGroupParticipants(false);
    } else if (activeChat) {
      setActiveChat(null);
    } else {
      closeChat();
    }
  };

  // Function to mark user as offline
  const setUserOffline = useCallback(async () => {
    if (userId) {
      try {
        // Mark user as offline on server
        await axios.delete(`${API}/users/online`, {
          withCredentials: true,
          timeout: 5000
        });
        
        // Remove current user from online users list
        setOnlineUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
      } catch (error) {
        console.error('Error marking user as offline:', error);
        // Still remove from local state even if API call fails
        setOnlineUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
      }
    }
  }, [userId]);
  
  // Cleanup on page unload - try to mark offline, but rely on timeout if it fails
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Try to mark user as offline when page is being unloaded
      // Note: This is best-effort. If it fails, the server will auto-remove the user after timeout
      if (userId) {
        // Use sendBeacon for reliable delivery during page unload
        try {
          const blob = new Blob([JSON.stringify({ userId })], { type: 'application/json' });
          navigator.sendBeacon(`${API}/users/offline-beacon`, blob);
        } catch (error) {
          // If sendBeacon fails, the server timeout will handle it
          console.error('Error sending offline beacon:', error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Clean up intervals
      if (onlineStatusIntervalRef.current) {
        clearInterval(onlineStatusIntervalRef.current);
        onlineStatusIntervalRef.current = null;
      }
      // Try to mark offline when component unmounts (if user is still logged in)
      // This handles logout and navigation
      if (userId) {
        setUserOffline();
      }
    };
  }, [userId, setUserOffline]);

  // Function to check if a user is online
  const isUserOnline = (checkUserId) => {
    return onlineUsers.some(u => (u._id || u.id) === checkUserId);
  };

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        activeChat,
        showContacts,
        showGroupParticipants,
        chats,
        messages,
        onlineUsers,
        contacts,
        loading,
        unreadCounts, // Export unread counts
        hasUnreadMessages, // Export has unread messages flag
        toggleChat,
        openChat,
        closeChat,
        handleBack,
        createChat,
        sendMessage,
        fetchMessages,
        fetchChats,
        addParticipantToGroup,
        removeParticipantFromGroup,
        deleteGroupChat,
        fetchUsers,
        setShowContacts,
        setShowGroupParticipants,
        setUserOffline,
        isUserOnline,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};