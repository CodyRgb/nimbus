import { Request, Response } from 'express';
import File from '../models/File.model';
import { uploadFileToTelegram, downloadFileFromTelegram, deleteMessage } from '../services/telegram.service';
import fs from 'fs';
import path from 'path';

// Extend Request to include user (added by auth middleware)
interface AuthRequest extends Request {
    user?: any;
    file?: Express.Multer.File;
}

export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const { originalname, mimetype, size, path: tempPath, filename } = req.file;
        const userId = req.user._id;

        // Upload to Telegram
        const telegramResult = await uploadFileToTelegram(tempPath, originalname, mimetype);

        // Create DB record
        const newFile = await File.create({
            user: userId,
            filename: filename, // This might be the temp filename, maybe we want originalname?
            originalName: originalname,
            mimeType: mimetype,
            size: size,
            telegramFileId: 'N/A', // We might not get a persistent file_id easily without bot API, but we have message_id
            telegramMessageId: telegramResult.messageId,
        });

        // Clean up temp file
        fs.unlink(tempPath, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });

        res.status(201).json(newFile);
    } catch (error) {
        console.error(error);
        // Clean up temp file if it exists
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (e) => { });
        }
        res.status(500).json({ message: 'Server Error', error: (error as Error).message });
    }
};

export const getFiles = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const files = await File.find({ user: req.user._id }).sort({ uploadedAt: -1 });
        res.json(files);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const downloadFile = async (req: AuthRequest, res: Response): Promise<void> => {
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

export const deleteFile = async (req: AuthRequest, res: Response): Promise<void> => {
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
