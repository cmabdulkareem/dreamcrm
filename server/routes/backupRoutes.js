import express from 'express';
import multer from 'multer';
import path from 'path';
import { createBackup, listBackups, downloadBackup, deleteBackup, restoreBackup } from '../controller/backupController.js';
import verifyToken from '../middleware/verifyToken.js';
import { isManager, isOwner } from '../utils/roleHelpers.js';

const router = express.Router();

// Role-based access control middleware
const requireOwnerOrManager = (req, res, next) => {
    if (isOwner(req.user) || isManager(req.user)) {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Owners and Managers only." });
};

// Multer setup for restore file upload
const upload = multer({
    dest: 'uploads/temp/',
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.use(verifyToken);
router.use(requireOwnerOrManager);

router.post('/create', createBackup);
router.get('/list', listBackups);
router.get('/download/:filename', downloadBackup);
router.delete('/:filename', deleteBackup);
router.post('/restore', upload.single('backup'), restoreBackup);

export default router;
