import fs from 'fs';
import path from 'path';
import multer from 'multer';
import Promotional from '../model/promotionalModel.js';
import { getUploadDir, getUploadUrl } from '../utils/uploadHelper.js';

// Setup multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determine subdirectory based on type
        const type = req.body.type || req.query.type || 'raw';
        let subDir = 'promotional/raw';
        if (type === 'image') subDir = 'promotional/images';
        else if (type === 'video') subDir = 'promotional/videos';

        const uploadDir = getUploadDir(subDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for videos/raw files
    }
}).single('file');

export const uploadPromotional = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: 'File upload error', error: err.message });
        }

        try {
            const { title, type } = req.body;

            const finalBrandId = req.headers['x-brand-id'] || null;

            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            if (!finalBrandId) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'Brand context is required. Please select a brand first.',
                });
            }

            if (!title || !type) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(400).json({ success: false, message: 'Title and type are required' });
            }

            const uploadedBy = req.user?._id || req.user?.id || req.user?.sub;

            if (!uploadedBy) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(401).json({ success: false, message: 'User context missing. Please re-login.' });
            }

            let subDir = 'promotional/raw';
            if (type === 'image') subDir = 'promotional/images';
            else if (type === 'video') subDir = 'promotional/videos';

            const fileUrl = getUploadUrl(subDir, req.file.filename);

            const promotionalData = {
                title,
                type,
                fileUrl,
                originalName: req.file.originalname,
                size: req.file.size,
                brandId: finalBrandId,
                uploadedBy: uploadedBy
            };


            const promotional = new Promotional(promotionalData);
            await promotional.save();
            await promotional.populate('uploadedBy', 'fullName');

            res.status(201).json({ success: true, message: 'File uploaded successfully', data: promotional });
        } catch (error) {
            console.error('SERVER ERROR: uploadPromotional failed');
            console.error('Error message:', error.message);

            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            if (error.name === 'ValidationError') {
                const errorDetails = {};
                for (let field in error.errors) {
                    errorDetails[field] = error.errors[field].message;
                }
                console.error('Validation Errors:', errorDetails);
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errorDetails
                });
            }

            res.status(500).json({ success: false, message: 'Internal server error: ' + error.message });
        }
    });
};

export const getPromotionals = async (req, res) => {
    try {
        const { type } = req.query;
        const brandId = req.user.brand;

        let query = { brandId };
        if (type && type !== 'all') {
            query.type = type;
        }

        const promotionals = await Promotional.find(query)
            .populate('uploadedBy', 'fullName')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: promotionals.length, data: promotionals });
    } catch (error) {
        console.error('Error fetching promotionals:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

export const deletePromotional = async (req, res) => {
    try {
        const { id } = req.params;
        const brandId = req.user.brand;

        const promotional = await Promotional.findOne({ _id: id, brandId });

        if (!promotional) {
            return res.status(404).json({ success: false, message: 'Promotional material not found' });
        }

        // Delete file from filesystem
        if (promotional.fileUrl) {
            const fileName = promotional.fileUrl.split('/').pop();
            let subDir = 'promotional/raw';
            if (promotional.type === 'image') subDir = 'promotional/images';
            else if (promotional.type === 'video') subDir = 'promotional/videos';

            const filePath = path.join(getUploadDir(subDir), fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Promotional.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Promotional material deleted successfully' });
    } catch (error) {
        console.error('Error deleting promotional file:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
