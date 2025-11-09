import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import verifyToken from '../middleware/verifyToken.js';
import User from '../model/userModel.js';
import sharp from 'sharp';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
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

    // Compress the image using sharp
    const compressedFileName = `compressed-${req.file.filename}`;
    const compressedFilePath = path.join(req.file.destination, compressedFileName);
    
    await sharp(req.file.path)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true }) // Resize to max 800x800
      .jpeg({ quality: 80 }) // Compress to 80% quality
      .toFile(compressedFilePath);
    
    // Remove the original uncompressed file
    fs.unlinkSync(req.file.path);

    // Update user with new avatar path
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: `/uploads/profiles/${compressedFileName}` },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      message: 'Avatar uploaded and compressed successfully',
      avatar: `/uploads/profiles/${compressedFileName}`,
      user 
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

export default router;
