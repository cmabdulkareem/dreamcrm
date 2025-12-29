import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import verifyToken from '../middleware/verifyToken.js';
import User from '../model/userModel.js';
import sharp from 'sharp';

const router = express.Router();

// Get absolute path for uploads directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const profilesUploadDir = path.join(__dirname, '../uploads/profiles');

// Ensure uploads directory exists
if (!fs.existsSync(profilesUploadDir)) {
  fs.mkdirSync(profilesUploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload profile image
router.post('/upload-avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const originalFilePath = req.file.path;
    const fileExt = path.extname(req.file.filename).toLowerCase();
    const baseFileName = path.basename(req.file.filename, fileExt);
    const compressedFileName = `compressed-${baseFileName}${fileExt}`;
    const compressedFilePath = path.join(profilesUploadDir, compressedFileName);

    // Get current user to check for old avatar
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      if (fs.existsSync(originalFilePath)) {
        fs.unlinkSync(originalFilePath);
      }
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old avatar file if it exists
    if (currentUser.avatar && currentUser.avatar.startsWith('/uploads/profiles/')) {
      try {
        const oldAvatarFileName = path.basename(currentUser.avatar);
        const oldAvatarPath = path.join(profilesUploadDir, oldAvatarFileName);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      } catch (deleteError) {
        console.error('Error deleting old avatar:', deleteError);
        // Don't fail the upload if old avatar deletion fails
      }
    }

    try {
      // Determine output format based on original file type
      const isPng = fileExt === '.png' || req.file.mimetype === 'image/png';
      const isWebP = fileExt === '.webp' || req.file.mimetype === 'image/webp';
      
      let sharpInstance = sharp(originalFilePath)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true });

      // Preserve format or convert appropriately
      if (isPng) {
        // For PNG, preserve transparency
        await sharpInstance.png({ quality: 80, compressionLevel: 9 }).toFile(compressedFilePath);
      } else if (isWebP) {
        // For WebP, preserve format
        await sharpInstance.webp({ quality: 80 }).toFile(compressedFilePath);
      } else {
        // For JPEG and others, convert to JPEG
        await sharpInstance.jpeg({ quality: 80 }).toFile(compressedFilePath);
      }

      // Remove the original uncompressed file
      if (fs.existsSync(originalFilePath)) {
        fs.unlinkSync(originalFilePath);
      }

      // Update user with new avatar path
      const avatarPath = `/uploads/profiles/${compressedFileName}`;
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { avatar: avatarPath },
        { new: true }
      );

      if (!user) {
        // Clean up uploaded file if user not found
        if (fs.existsSync(compressedFilePath)) {
          fs.unlinkSync(compressedFilePath);
        }
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ 
        message: 'Avatar uploaded and compressed successfully',
        avatar: avatarPath,
        user 
      });
    } catch (sharpError) {
      console.error('Error processing image with sharp:', sharpError);
      // If sharp fails, try to use original file
      const avatarPath = `/uploads/profiles/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { avatar: avatarPath },
        { new: true }
      );

      if (!user) {
        if (fs.existsSync(originalFilePath)) {
          fs.unlinkSync(originalFilePath);
        }
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({ 
        message: 'Avatar uploaded successfully (compression skipped)',
        avatar: avatarPath,
        user 
      });
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      message: 'Failed to upload avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
