import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);

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

  const addNotification = (notification) => {
    // All notifications are always enabled now
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
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