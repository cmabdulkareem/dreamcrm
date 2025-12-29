import API from "../config/api";

/**
 * Get the full URL for an image path
 * Handles both relative paths and absolute URLs
 * @param {string} imagePath - The image path from the database
 * @returns {string} Full URL to the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Extract the base URL (without /api) to construct the correct image URL
  const baseUrl = API.replace('/api', '');
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${cleanPath}`;
};

/**
 * Get avatar URL with fallback to default avatar
 * @param {string} avatarPath - The avatar path from the database
 * @param {string} defaultAvatar - Default avatar path (optional)
 * @returns {string} Full URL to the avatar or default
 */
export const getAvatarUrl = (avatarPath, defaultAvatar = "/images/user/user-01.jpg") => {
  if (!avatarPath) return defaultAvatar;
  
  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  // Extract the base URL (without /api)
  const baseUrl = API.replace('/api', '');
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  
  return `${baseUrl}${cleanPath}`;
};

