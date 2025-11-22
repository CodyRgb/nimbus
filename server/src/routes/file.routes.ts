import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.middleware';
import { uploadFile, getFiles, downloadFile, deleteFile } from '../controllers/file.controller';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure Multer for temp storage
const uploadDir = path.join(__dirname, '../../uploads_temp');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Keep original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit for now (multer limit)
});

router.post('/upload', protect, upload.array('files'), uploadFile);
router.post('/folders', protect, createFolder);
router.get('/folders', protect, getFolders);
router.get('/folders/:parentId', protect, getFolders);
router.get('/', protect, getFiles);
router.get('/:id/download', protect, downloadFile);
router.get('/:id/preview', protect, previewFile);
router.delete('/:id', protect, deleteFile);

export default router;
