import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.middleware';
import { uploadFile, getFiles, downloadFile, deleteFile, createFolder, getFolders, previewFile, getThumbnail, bulkDownloadFiles, bulkDeleteFiles, toggleFavorite, getFavoriteFiles, renameFile, getStorageStats } from '../controllers/file.controller';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure Multer for temp storage
const uploadDir = path.join(__dirname, '../../uploads_temp');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req: express.Request, file: any, cb: (error: Error | null, destination: string) => void) => {
        cb(null, uploadDir);
    },
    filename: (req: express.Request, file: any, cb: (error: Error | null, filename: string) => void) => {
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
router.get('/:id/thumbnail', protect, getThumbnail);
router.get('/:id/preview', protect, previewFile);
router.get('/:id/download', protect, downloadFile);
router.delete('/:id', protect, deleteFile);
router.post('/bulk-download', protect, bulkDownloadFiles);
router.post('/bulk-delete', protect, bulkDeleteFiles);
router.get('/storage', protect, getStorageStats);
router.patch('/:id/favorite', protect, toggleFavorite);
router.get('/favorites', protect, getFavoriteFiles);
router.put('/:id/rename', protect, renameFile);

export default router;
