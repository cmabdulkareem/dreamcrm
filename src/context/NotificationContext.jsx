import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import API from '../config/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [socket, setSocket] = useState(null);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('crm_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setHasUnread(parsed.some(n => !n.read));
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
  }, []);

  // Save notifications to localStorage and update hasUnread whenever they change
  useEffect(() => {
    // Keep hasUnread in sync with notifications
    setHasUnread(notifications.some(n => !n.read));

    // Save to localStorage
    if (notifications.length > 0) {
      localStorage.setItem('crm_notifications', JSON.stringify(notifications));
    } else {
      localStorage.removeItem('crm_notifications');
    }
  }, [notifications]);

  // Socket Connection
  useEffect(() => {
    if (!user) return;

    // API is like "http://localhost:3000/api", we need "http://localhost:3000"
    const socketUrl = API.replace('/api', '');
    const newSocket = io(socketUrl, {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      // Register user with roles and brands
      newSocket.emit('register', {
        userId: user._id || user.id,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
        roles: user.roles,
        assignedBrands: user.brands
      });
    });

    newSocket.on('notification', (data) => {
      addNotification(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
    // Only re-run if user ID changes to hold connection stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);


  const addNotification = (notification) => {
    // If notification comes from backend, it might have an ID.
    // Use it to deduplicate.
    const newId = notification.id || Date.now() + Math.random();

    setNotifications(prev => {
      // Deduplicate based on ID if present
      if (notification.id && prev.some(n => n.id === notification.id)) {
        return prev;
      }

      const newNotification = {
        id: newId,
        timestamp: new Date().toISOString(),
        read: false,
        ...notification,
      };
      const updated = [newNotification, ...prev].slice(0, 50); // Keep last 50
      return updated;
    });
    setHasUnread(true);
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    // hasUnread will be updated automatically by the useEffect
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // hasUnread will be updated automatically by the useEffect
  };

  const clearNotifications = () => {
    setNotifications([]);
    // hasUnread and localStorage will be updated automatically by the useEffect
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    // hasUnread and localStorage will be updated automatically by the useEffect
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} day ago`;
    return then.toLocaleDateString('en-IN');
  };

  // Toast notifications are always enabled now
  const areToastsEnabled = () => {
    return true; // Always enable toast notifications
  };

  // All notifications are always enabled
  const isNotificationEnabled = () => {
    return true; // Always enable notifications
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        hasUnread,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        deleteNotification,
        getTimeAgo,
        isNotificationEnabled,
        areToastsEnabled,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};