import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import { useContext } from 'react';
import DraggableParticipant from './DraggableParticipant';
import GroupParticipants from './GroupParticipants';
import Badge from '../ui/badge/Badge'; // Import Badge component
import { ChatIcon } from '../../icons'; // Import ChatIcon
import { isAdmin } from '../../utils/roleHelpers'; // Add this import

const ChatWidget = () => {
  const { 
    isChatOpen, 
    activeChat, 
    showContacts, 
    showGroupParticipants,
    chats, 
    messages, 
    onlineUsers, 
    contacts, 
    loading,
    unreadCounts, // Import unread counts
    hasUnreadMessages, // Import has unread messages flag
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
    isUserOnline
  } = useChat();
  
  const { user } = useContext(AuthContext);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isSelectingParticipants, setIsSelectingParticipants] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  // Listen for scrollToBottom event from ChatContext
  useEffect(() => {
    const handleScrollToBottom = () => {
      scrollToBottom();
    };
    
    window.addEventListener('scrollToBottom', handleScrollToBottom);
    
    return () => {
      window.removeEventListener('scrollToBottom', handleScrollToBottom);
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && activeChat) {
      sendMessage(activeChat.id, newMessage);
      setNewMessage('');
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  };

  const handleStartChat = async (contact) => {
    // Normalize user IDs
    const userId = user ? (user._id || user.id) : null;
    const contactId = contact._id || contact.id;
    
    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.type === 'user' && 
      chat.participants.length === 2 && 
      chat.participants.some(p => (p._id || p.id) === contactId) &&
      chat.participants.some(p => (p._id || p.id) === userId)
    );
    
    if (existingChat) {
      openChat(existingChat);
    } else {
      // Create new chat (this will call the API)
      const newChat = await createChat([contact]);
      if (newChat) {
        openChat(newChat);
      }
    }
    
    setShowContacts(false);
  };

  const handleCreateGroupChat = async () => {
    // Check if user has admin privileges
    if (!isAdmin(user)) {
      alert('Only admins or owners can create group chats.');
      return;
    }
    
    // For group chats, we need to select participants first
    // Show contacts list to select participants
    setShowContacts(true);
    setIsSelectingParticipants(true);
    // We'll create the group after selecting participants
  };

  const handleSelectParticipant = (participant) => {
    // Toggle participant selection
    setSelectedParticipants(prev => {
      const isSelected = prev.some(p => p._id === participant._id);
      if (isSelected) {
        return prev.filter(p => p._id !== participant._id);
      } else {
        return [...prev, participant];
      }
    });
  };

  const handleCreateGroupWithParticipants = async () => {
    if (selectedParticipants.length === 0) {
      alert('Please select at least one participant');
      return;
    }
    
    const groupName = prompt('Enter group name:');
    if (groupName) {
      const newChat = await createChat(selectedParticipants, true, groupName);
      if (newChat) {
        openChat(newChat);
        setSelectedParticipants([]);
        setIsSelectingParticipants(false);
        setShowContacts(false);
      }
    }
  };

  const cancelParticipantSelection = () => {
    setSelectedParticipants([]);
    setIsSelectingParticipants(false);
  };

  const handleAddParticipant = (participant) => {
    if (activeChat && activeChat.type === 'group') {
      // Check if participant is already in the group
      if (!activeChat.participants.some(p => p._id === participant._id)) {
        addParticipantToGroup(activeChat.id, participant);
      }
    }
  };

  const handleRemoveParticipant = (participantId) => {
    if (activeChat && activeChat.type === 'group') {
      removeParticipantFromGroup(activeChat.id, participantId);
    }
  };

  const getChatDisplayName = (chat) => {
    if (!chat) return 'Unknown Chat';
    
    if (chat.type === 'group') {
      return chat.name || 'Unnamed Group';
    } else {
      const userId = user ? (user._id || user.id) : null;
      const otherParticipant = chat.participants?.find(p => (p._id || p.id) !== userId);
      return otherParticipant ? otherParticipant.fullName : 'Unknown User';
    }
  };

  const getChatDisplayAvatar = (chat) => {
    if (!chat) return '/images/user/user-01.jpg';
    
    if (chat.type === 'group') {
      return '/images/user/group-avatar.png';
    } else {
      const userId = user ? (user._id || user.id) : null;
      const otherParticipant = chat.participants?.find(p => (p._id || p.id) !== userId);
      // Use the avatar from the participant object if available
      return otherParticipant?.avatar || '/images/user/user-01.jpg';
    }
  };

  const isGroupChat = (chat) => {
    return chat && chat.type === 'group';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Don't render if user is not available
  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Header (always visible) */}
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-all"
        >
          <ChatIcon className="h-6 w-6" />
          {/* Show notification badge if there are unread messages */}
          {hasUnreadMessages && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500"></span>
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isChatOpen && (
        <div className="flex flex-col w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-t-lg">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="flex items-center">
                <img
                  src={getChatDisplayAvatar(activeChat)}
                  alt={getChatDisplayName(activeChat)}
                  className={`w-8 h-8 rounded-full ${isGroupChat(activeChat) ? 'border-2 border-blue-500' : ''}`}
                />
                <div className="ml-2">
                  <h3 className={`font-medium ${isGroupChat(activeChat) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-white'}`}>
                    {activeChat ? getChatDisplayName(activeChat) : 'Chat'}
                  </h3>
                  {isGroupChat(activeChat) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activeChat.participants?.length || 0} participants
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              {activeChat && activeChat.type === 'group' && !showContacts && !showGroupParticipants && (
                <button
                  onClick={() => setShowGroupParticipants(!showGroupParticipants)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </button>
              )}
              {!showContacts && !showGroupParticipants && (
                <button
                  onClick={() => {
                    setShowContacts(!showContacts);
                    if (!showContacts) {
                      fetchUsers();
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {showContacts ? (
              // Contacts List
              <div className="flex-1 overflow-y-auto">
                <div className="p-2">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                      {isSelectingParticipants ? 'Select Participants' : 'Online Users'}
                    </h4>
                    <div className="flex space-x-2">
                      {isSelectingParticipants && (
                        <>
                          <button
                            onClick={cancelParticipantSelection}
                            className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleCreateGroupWithParticipants}
                            disabled={selectedParticipants.length === 0}
                            className={`text-xs px-2 py-1 rounded ${selectedParticipants.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
                          >
                            Create Group ({selectedParticipants.length})
                          </button>
                        </>
                      )}
                      {!isSelectingParticipants && isAdmin(user) && ( // Only show for admins
                        <button
                          onClick={handleCreateGroupChat}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          New Group
                        </button>
                      )}
                    </div>
                  </div>
                  {loading ? (
                    <div className="flex justify-center items-center h-20">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (() => {
                    const userId = user ? (user._id || user.id) : null;
                    return onlineUsers.filter(contact => (contact._id || contact.id) !== userId).length === 0;
                  })() ? (
                    <div className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No other users online
                    </div>
                  ) : (
                    (() => {
                      const userId = user ? (user._id || user.id) : null;
                      return onlineUsers
                        .filter(contact => (contact._id || contact.id) !== userId) // Exclude current user from online list
                        .map((contact) => {
                          return (
                            <div
                              key={contact._id}
                              onClick={() => {
                                if (isSelectingParticipants) {
                                  handleSelectParticipant(contact);
                                } else {
                                  handleStartChat(contact);
                                }
                              }}
                              className={`flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer ${isSelectingParticipants && selectedParticipants.some(p => p._id === contact._id) ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                            >
                              <div className="relative">
                                <img
                                  src={contact.avatar || '/images/user/user-01.jpg'}
                                  alt={contact.fullName}
                                  className="w-10 h-10 rounded-full"
                                />
                                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800"></span>
                                {isSelectingParticipants && selectedParticipants.some(p => p._id === contact._id) && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-50 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.fullName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                              </div>
                            </div>
                          );
                        });
                    })()
                  )}
                </div>
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">All Contacts</h4>
                  {loading ? (
                    <div className="flex justify-center items-center h-20">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No contacts available
                    </div>
                  ) : (
                    contacts.map((contact) => {
                      const isOnline = isUserOnline(contact._id);
                      return (
                        <div
                          key={contact._id}
                          onClick={() => {
                            if (isSelectingParticipants) {
                              handleSelectParticipant(contact);
                            } else {
                              handleStartChat(contact);
                            }
                          }}
                          className={`flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer ${isSelectingParticipants && selectedParticipants.some(p => p._id === contact._id) ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                        >
                          <div className="relative">
                            <img
                              src={contact.avatar || '/images/user/user-01.jpg'}
                              alt={contact.fullName}
                              className="w-10 h-10 rounded-full"
                            />
                            {isOnline && (
                              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800"></span>
                            )}
                            {isSelectingParticipants && selectedParticipants.some(p => p._id === contact._id) && (
                              <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-50 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{contact.fullName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {isOnline ? 'Online' : 'Offline'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : showGroupParticipants && activeChat && activeChat.type === 'group' ? (
              // Group Participants
              <GroupParticipants
                chat={activeChat}
                participants={activeChat.participants}
                onAddParticipant={handleAddParticipant}
                onRemoveParticipant={handleRemoveParticipant}
                user={user} // Pass user to component
              />
            ) : activeChat ? (
              // Active Chat
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  {messages[activeChat.id]?.map((message) => {
                    const userId = user ? (user._id || user.id) : null;
                    const messageSenderId = message.sender._id || message.sender.id;
                    const isOwnMessage = messageSenderId === userId;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isOwnMessage && (
                          <img
                            src={message.sender.avatar || '/images/user/user-01.jpg'}
                            alt={message.sender.fullName}
                            className="w-8 h-8 rounded-full mr-2"
                          />
                        )}
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-blue-500 text-white rounded-br-none'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none'
                          }`}
                        >
                          {!isOwnMessage && (
                            <p className="text-xs font-medium">{message.sender.fullName}</p>
                          )}
                          <p>{message.text}</p>
                          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-gray-700 p-2">
                  <div className="flex">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // Chat List
              <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9 8s9 3.582 9 8z" />
                    </svg>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">No chats yet</p>
                    <button
                      onClick={() => {
                        setShowContacts(true);
                        fetchUsers();
                      }}
                      className="mt-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Start a conversation
                    </button>
                  </div>
                ) : (
                  chats.map((chat) => {
                    const unreadCount = unreadCounts[chat.id] || 0;
                    return (
                      <div
                        key={chat.id}
                        onClick={() => openChat(chat)}
                        className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700"
                      >
                        <div className="relative">
                          <img
                            src={getChatDisplayAvatar(chat)}
                            alt={getChatDisplayName(chat)}
                            className={`w-10 h-10 rounded-full ${isGroupChat(chat) ? 'border-2 border-blue-500' : ''}`}
                          />
                          {/* Show online status indicator for user chats */}
                          {chat && chat.type === 'user' && isUserOnline(chat.participants?.find(p => (p._id || p.id) !== (user?._id || user?.id))?._id) && (
                            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800"></span>
                          )}
                          {isGroupChat(chat) && unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 bg-blue-500 rounded-full text-white text-xs">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex justify-between">
                            <p className={`text-sm font-medium truncate ${isGroupChat(chat) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                              {getChatDisplayName(chat)}
                            </p>
                            <div className="flex items-center gap-1">
                              {chat?.lastMessage && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(chat.lastMessage.timestamp)}
                                </p>
                              )}
                              {/* Show unread message badge */}
                              {unreadCount > 0 && (
                                <Badge variant="solid" color="primary" size="sm">
                                  {unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            {chat?.lastMessage && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {chat.lastMessage.text}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;