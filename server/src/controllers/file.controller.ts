import { Request, Response } from 'express';
import File from '../models/File.model';
import Folder from '../models/Folder.model';
import { uploadFileToTelegram, downloadFileFromTelegram, deleteMessage } from '../services/telegram.service';
import fs from 'fs';
import path from 'path';

// Extend Request to include user (added by auth middleware)
// We can rely on declaration merging in auth.middleware.ts for 'user'
// For 'files', we can cast inside the function


export const uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            res.status(400).json({ message: 'No files uploaded' });
            return;
        }

        const userId = req.user._id;
        const uploadedFiles = [];

        for (const file of files) {
            const { originalname, mimetype, size, path: tempPath, filename } = file;

            try {
                // Upload to Telegram
                const telegramResult = await uploadFileToTelegram(tempPath, originalname, mimetype);

                // Create DB record
                const newFile = await File.create({
                    user: userId,
                    folder: null,
                    filename: filename,
                    originalName: originalname,
                    mimeType: mimetype,
                    size: size,
                    telegramFileId: 'N/A',
                    telegramMessageId: telegramResult.messageId,
                });

                uploadedFiles.push(newFile);

                // Clean up temp file
                fs.unlink(tempPath, (err) => {
                    if (err) console.error("Error deleting temp file:", err);
                });
            } catch (err) {
                console.error(`Failed to upload file ${originalname}:`, err);
                // Try to clean up temp file even if upload failed
                fs.unlink(tempPath, (e) => { });
            }
        }

        res.status(201).json(uploadedFiles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: (error as Error).message });
    }
};

export const createFolder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, parentId } = req.body;
        const userId = req.user._id;

        let path: string[] = [];
        if (parentId) {
            const parentFolder = await Folder.findOne({ _id: parentId, user: userId });
            if (!parentFolder) {
                res.status(404).json({ message: 'Parent folder not found' });
                return;
            }
            path = [...parentFolder.path, parentFolder.name];
        }

        const folder = await Folder.create({
            user: userId,
            name,
            parent: parentId || null,
            path
        });

        res.status(201).json(folder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getFolders = async (req: Request, res: Response): Promise<void> => {
    try {
        const parentId = req.params.parentId || null;
        const folders = await Folder.find({ user: req.user._id, parent: parentId }).sort({ name: 1 });
        res.json(folders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getFiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const folderId = req.query.folderId || null;
        // If folderId is provided, filter by it. If not, filter by root (folder: null)
        // However, current frontend might expect all files if no folderId is passed.
        // Let's support both: if query param exists, filter. If not, return all (legacy behavior) or root.
        // Given the requirement for folder navigation, we should probably filter by folder.
        // But for "Storage Overview" (stats), we might need all files.
        // Let's check if folderId is explicitly passed.

        let query: any = { user: req.user._id };
        if (req.query.folderId !== undefined) {
            query.folder = req.query.folderId === 'root' ? null : req.query.folderId;
        }
        // If no folderId param, return all files (for stats/search)

        const files = await File.find(query).sort({ uploadedAt: -1 });
        res.json(files);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const downloadFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = await File.findOne({ _id: req.params.id, user: req.user._id });

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Stream from Telegram
        const chunks = await downloadFileFromTelegram(file.telegramMessageId);

        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Length', file.size);

        // chunks is an AsyncIterable<Buffer>
        for await (const chunk of chunks) {
            res.write(chunk);
        }
        res.end();

        // Update stats
        file.downloadCount += 1;
        file.lastAccessed = new Date();
        await file.save();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Download failed' });
    }
};

export const previewFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const file = await File.findOne({ _id: req.params.id, user: req.user._id });

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Stream from Telegram
        const chunks = await downloadFileFromTelegram(file.telegramMessageId);

        // Set headers for inline preview (not download)
        res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Length', file.size);
        res.setHeader('Accept-Ranges', 'bytes');

        // Stream chunks to response
        for await (const chunk of chunks) {
            res.write(chunk);
        }
        res.end();

        // Update stats
        file.lastAccessed = new Date();
        await file.save();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Preview failed' });
    }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = await File.findOne({ _id: req.params.id, user: req.user._id });

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Delete from Telegram
        await deleteMessage(file.telegramMessageId);

        // Delete from DB
        await file.deleteOne();

        res.json({ message: 'File deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
