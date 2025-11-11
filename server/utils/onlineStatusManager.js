// In-memory store for online users
// Maps userId -> { userId, lastSeen, userData }
const onlineUsers = new Map();

// Timeout in milliseconds - users are considered offline if they haven't updated in 90 seconds
// This gives a buffer for network delays and ensures users are marked offline if they close the browser
const OFFLINE_TIMEOUT = 90000; // 90 seconds

// Clean up offline users periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, userData] of onlineUsers.entries()) {
    if (now - userData.lastSeen > OFFLINE_TIMEOUT) {
      onlineUsers.delete(userId);
    }
  }
}, 30000); // Clean up every 30 seconds

/**
 * Mark a user as online
 * @param {string} userId - User ID (will be converted to string)
 * @param {object} userData - User data (fullName, email, avatar, etc.)
 */
export const markUserOnline = (userId, userData) => {
  // Ensure userId is a string (MongoDB ObjectIds are automatically converted in JSON)
  const userIdStr = String(userId);
  onlineUsers.set(userIdStr, {
    userId: userIdStr,
    lastSeen: Date.now(),
    ...userData
  });
};

/**
 * Mark a user as offline
 * @param {string} userId - User ID (will be converted to string)
 */
export const markUserOffline = (userId) => {
  const userIdStr = String(userId);
  onlineUsers.delete(userIdStr);
};

/**
 * Get all online users
 * @returns {Array} Array of online user objects
 */
export const getOnlineUsers = () => {
  const now = Date.now();
  const onlineUsersList = [];
  
  for (const [userId, userData] of onlineUsers.entries()) {
    // Only include users who are still considered online
    if (now - userData.lastSeen <= OFFLINE_TIMEOUT) {
      onlineUsersList.push({
        _id: userData.userId,
        fullName: userData.fullName,
        email: userData.email,
        avatar: userData.avatar,
        lastSeen: userData.lastSeen
      });
    } else {
      // Remove stale entries
      onlineUsers.delete(userId);
    }
  }
  
  return onlineUsersList;
};

/**
 * Check if a user is online
 * @param {string} userId - User ID (will be converted to string)
 * @returns {boolean} True if user is online
 */
export const isUserOnline = (userId) => {
  const userIdStr = String(userId);
  const userData = onlineUsers.get(userIdStr);
  if (!userData) return false;
  
  const now = Date.now();
  if (now - userData.lastSeen > OFFLINE_TIMEOUT) {
    onlineUsers.delete(userIdStr);
    return false;
  }
  
  return true;
};

/**
 * Update user's last seen timestamp
 * @param {string} userId - User ID (will be converted to string)
 */
export const updateLastSeen = (userId) => {
  const userIdStr = String(userId);
  const userData = onlineUsers.get(userIdStr);
  if (userData) {
    userData.lastSeen = Date.now();
  }
};

