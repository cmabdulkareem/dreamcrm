import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the base directory for uploads.
 * If UPLOADS_DIR is set in .env, it uses that (e.g., /var/www/uploads).
 * Otherwise, it defaults to the 'uploads' folder in the server directory.
 */
export const getBaseUploadDir = () => {
    if (process.env.UPLOADS_DIR) {
        return process.env.UPLOADS_DIR;
    }
    // Default to server/uploads
    return path.join(__dirname, '../uploads');
};

/**
 * Get the absolute disk path for a specific subdirectory (e.g., 'banners', 'profiles').
 * @param {string} subDir 
 * @returns {string} Absolute path
 */
export const getUploadDir = (subDir = '') => {
    // Check for granular environment variables first
    if (subDir === 'banners' && process.env.BANNERS_UPLOAD_DIR) {
        return process.env.BANNERS_UPLOAD_DIR;
    }
    if (subDir === 'profiles' && process.env.PROFILES_UPLOAD_DIR) {
        return process.env.PROFILES_UPLOAD_DIR;
    }
    if (subDir === 'student_photos' && process.env.STUDENT_PHOTOS_UPLOAD_DIR) {
        return process.env.STUDENT_PHOTOS_UPLOAD_DIR;
    }

    const baseDir = getBaseUploadDir();
    const fullPath = subDir ? path.join(baseDir, subDir) : baseDir;

    // Ensure the directory exists
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }

    return fullPath;
};

/**
 * Get the relative URL path for storage in the database.
 * @param {string} subDir 
 * @param {string} filename 
 * @returns {string} /uploads/[subDir]/[filename]
 */
export const getUploadUrl = (subDir, filename) => {
    if (!filename) return null;
    let url = '/uploads';
    if (subDir) url += `/${subDir}`;
    url += `/${filename}`;
    return url;
};
