import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
    createAlbum,
    getAlbums,
    getAlbum,
    updateAlbum,
    deleteAlbum,
    addFilesToAlbum,
    removeFileFromAlbum
} from '../controllers/album.controller';

const router = express.Router();

router.route('/')
    .post(protect, createAlbum)
    .get(protect, getAlbums);

router.route('/:id')
    .get(protect, getAlbum)
    .put(protect, updateAlbum)
    .delete(protect, deleteAlbum);

router.route('/:albumId/files')
    .post(protect, addFilesToAlbum);

router.route('/:albumId/files/:fileId')
    .delete(protect, removeFileFromAlbum);

export default router;
