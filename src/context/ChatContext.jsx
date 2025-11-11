import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

const API = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL_PRODUCTION || "https://dreamcrm.onrender.com/api"
  : import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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

  // Load chats and messages from localStorage on mount
  useEffect(() => {
    if (user && user._id) {
      const storedChats = localStorage.getItem(`chats_${user._id}`);
      const storedMessages = localStorage.getItem(`messages_${user._id}`);
      
      if (storedChats) {
        try {
          const parsedChats = JSON.parse(storedChats);
          setChats(parsedChats);
        } catch (error) {
          console.error('Error loading chats:', error);
        }
      }
      
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          setMessages(parsedMessages);
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      }
    }
  }, [user]);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (user && user._id && chats.length > 0) {
      localStorage.setItem(`chats_${user._id}`, JSON.stringify(chats));
    }
  }, [chats, user]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (user && user._id && Object.keys(messages).length > 0) {
      localStorage.setItem(`messages_${user._id}`, JSON.stringify(messages));
    }
  }, [messages, user]);

  // Set user as online when they log in
  useEffect(() => {
    if (user && user._id) {
      // Add current user to online users list
      setOnlineUsers(prev => {
        // Check if user is already in the list
        if (!prev.some(u => u._id === user._id)) {
          return [...prev, {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            avatar: user.avatar || `/images/user/user-${(user._id.charCodeAt(0) % 4) + 1}.jpg`
          }];
        }
        return prev;
      });
      
      // In a real app, you would send a request to the server to mark user as online
      console.log(`User ${user.fullName} is now online`);
    }
  }, [user]);

  // Fetch all users from the API
  const fetchUsers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/users/dropdown`, { 
        withCredentials: true,
        timeout: 10000
      });
      const allUsers = response.data.users || [];
      
      // Filter out current user and format the data
      const filteredUsers = allUsers
        .filter(contact => contact._id !== user._id)
        .map(contact => ({
          _id: contact._id,
          fullName: contact.fullName,
          email: contact.email,
          avatar: contact.avatar || `/images/user/user-${(contact._id.charCodeAt(0) % 4) + 1}.jpg`
        }));
      
      setContacts(filteredUsers);
      
      // For demo purposes, mark some users as online
      // In a real app, you would fetch the actual online users from the server
      setOnlineUsers(prev => {
        const currentUser = prev.find(u => u._id === user._id);
        if (currentUser) {
          // Add current user and a few random contacts as online for demo
          const onlineContacts = filteredUsers.slice(0, Math.min(3, filteredUsers.length));
          return [currentUser, ...onlineContacts];
        }
        return filteredUsers.slice(0, Math.min(3, filteredUsers.length));
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const createChat = (participants, isGroup = false, groupName = '') => {
    const newChat = {
      id: Date.now().toString(),
      type: isGroup ? 'group' : 'user',
      name: isGroup ? groupName : participants.find(p => p._id !== user._id)?.fullName || 'Unknown',
      participants: isGroup ? [user] : [...participants, user],
      createdAt: new Date().toISOString(),
      lastMessage: null,
    };
    
    setChats(prev => [...prev, newChat]);
    return newChat;
  };

  const sendMessage = (chatId, text) => {
    if (!text.trim() || !user) return;
    
    const newMessage = {
      id: Date.now().toString(),
      chatId,
      sender: {
        _id: user._id,
        fullName: user.fullName,
        avatar: user.avatar || `/images/user/user-${(user._id.charCodeAt(0) % 4) + 1}.jpg`
      },
      text,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage]
    }));
    
    // Update last message in chat
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, lastMessage: { text, timestamp: newMessage.timestamp } }
        : chat
    ));
    
    // In a real app, you would send this message to the server
    console.log('Message sent:', newMessage);
  };

  const addParticipantToGroup = (chatId, participant) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { 
            ...chat, 
            participants: chat.participants.some(p => p._id === participant._id)
              ? chat.participants
              : [...chat.participants, participant]
          }
        : chat
    ));
  };

  const removeParticipantFromGroup = (chatId, participantId) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, participants: chat.participants.filter(p => p._id !== participantId) }
        : chat
    ));
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const openChat = (chat) => {
    setActiveChat(chat);
    setIsChatOpen(true);
    setShowContacts(false);
    setShowGroupParticipants(false);
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
  const setUserOffline = () => {
    if (user && user._id) {
      // Remove current user from online users list
      setOnlineUsers(prev => prev.filter(u => u._id !== user._id));
      
      // In a real app, you would send a request to the server to mark user as offline
      console.log(`User ${user.fullName} is now offline`);
    }
  };

  // Function to check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers.some(u => u._id === userId);
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
        toggleChat,
        openChat,
        closeChat,
        handleBack,
        createChat,
        sendMessage,
        addParticipantToGroup,
        removeParticipantFromGroup,
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