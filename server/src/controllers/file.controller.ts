import { Request, Response } from 'express';
import File from '../models/File.model';
import Folder from '../models/Folder.model';
import { uploadFileToTelegram, downloadFileFromTelegram, deleteMessage, getUserClient, uploadFileToTelegramWithClient, downloadFileFromTelegramWithClient, deleteMessageWithClient } from '../services/telegram.service';
import { logger } from '../utils/logger';
import { generateAndUploadThumbnail, deleteThumbnailFromCloudinary } from '../services/cloudinary.service';
import { generateThumbnails, deleteThumbnails } from '../services/thumbnail.service';
import { cacheService, CacheKeys, CacheTTL, invalidateUserCache, invalidateFileCache } from '../services/cache.service';
import fs from 'fs';
import path from 'path';
import User from '../models/User.model';
import archiver from 'archiver';
import sharp from 'sharp';
import { Readable } from 'stream';
import crypto from 'crypto';

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

        const userId = req.user!._id;

        // Fetch user to get telegram session
        const user = await User.findById(userId).select('+telegramSession');

        if (!user || !user.telegramSession) {
            res.status(403).json({ message: 'Please connect your Telegram account to upload files.' });
            return;
        }

        const userClient = await getUserClient(user.telegramSession);
        const uploadedFiles = [];
        const failedFiles: { filename: string; error: string }[] = [];

        for (const file of files) {
            const { originalname, mimetype, size, path: tempPath, filename } = file;

            try {
                logger.info(`[Upload] Starting upload for ${originalname} (${(size / 1024 / 1024).toFixed(2)} MB)`);
                
                // Upload to Telegram (User) with automatic retry
                const telegramResult = await uploadFileToTelegramWithClient(userClient, tempPath, originalname, mimetype);

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
                    storageType: 'user',
                });

                uploadedFiles.push(newFile);

                // Generate cache key for deduplication
                const fileHash = crypto.createHash('sha256')
                    .update(`${userId}-${originalname}-${size}`)
                    .digest('hex');
                newFile.cacheKey = fileHash;

                // Generate and upload thumbnails asynchronously (don't wait for it)
                generateThumbnails(
                    newFile._id.toString(),
                    originalname,
                    mimetype,
                    telegramResult.messageId,
                    userClient
                ).then(thumbnails => {
                    if (thumbnails) {
                        newFile.thumbnailSmall = thumbnails.small;
                        newFile.thumbnailMedium = thumbnails.medium;
                        newFile.thumbnailLarge = thumbnails.large;
                        newFile.thumbnailUrl = thumbnails.medium; // Backward compatibility
                        newFile.dimensions = thumbnails.dimensions;
                        newFile.save();
                        
                        // Cache thumbnail URLs
                        cacheService.set(
                            CacheKeys.thumbnailUrl(newFile._id.toString()),
                            thumbnails,
                            CacheTTL.thumbnailUrl
                        );
                    }
                }).catch(err => {
                    console.error(`Thumbnail generation failed for ${originalname}:`, err);
                });

                // Clean up temp file
                fs.unlink(tempPath, (err) => {
                    if (err) console.error("Error deleting temp file:", err);
                });
            } catch (err: any) {
                logger.error(`[Upload] Failed to upload file ${originalname}:`, err.message);
                failedFiles.push({ 
                    filename: originalname, 
                    error: err.message || 'Upload failed' 
                });
                
                // Try to clean up temp file even if upload failed
                fs.unlink(tempPath, (e) => { 
                    if (e) logger.error(`[Upload] Failed to delete temp file ${tempPath}:`, e);
                });
            }
        }

        // Invalidate user's file list cache
        await invalidateUserCache(userId.toString());
        
        // Return results with success and failure information
        const response: any = {
            success: uploadedFiles.length > 0,
            uploaded: uploadedFiles,
            uploadedCount: uploadedFiles.length,
            totalCount: files.length,
        };

        if (failedFiles.length > 0) {
            response.failed = failedFiles;
            response.failedCount = failedFiles.length;
            response.message = `${uploadedFiles.length} file(s) uploaded successfully, ${failedFiles.length} failed`;
        }

        const statusCode = uploadedFiles.length > 0 ? 201 : 500;
        res.status(statusCode).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: (error as Error).message });
    }
};

export const createFolder = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, parentId } = req.body;
        const userId = req.user!._id;

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
        const folders = await Folder.find({ user: req.user!._id, parent: parentId }).sort({ name: 1 });
        res.json(folders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getFiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!._id.toString();
        const folderId = req.query.folderId as string || null;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        // Try to get from cache first
        const cacheKey = CacheKeys.fileList(userId, page, limit, folderId || undefined);
        const cachedData = await cacheService.get(cacheKey);
        
        if (cachedData) {
            res.setHeader('X-Cache-Status', 'HIT');
            res.json(cachedData);
            return;
        }

        let query: any = { user: req.user!._id };
        if (req.query.folderId !== undefined) {
            query.folder = req.query.folderId === 'root' ? null : req.query.folderId;
        }

        // Get total count for pagination
        const total = await File.countDocuments(query);
        
        // Get files with pagination
        const files = await File.find(query)
            .sort({ uploadedAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v')
            .lean();

        const response = {
            files,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            cache_hint: 'stale-while-revalidate=60',
        };

        // Cache the response
        await cacheService.set(cacheKey, response, CacheTTL.fileList);
        
        res.setHeader('X-Cache-Status', 'MISS');
        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getThumbnail = async (req: Request, res: Response): Promise<void> => {
    try {
        const fileId = req.params.id;
        const size = (req.query.size as string) || 'medium';

        // Check cache first
        const cacheKey = CacheKeys.thumbnailUrl(fileId);
        const cachedThumbnails = await cacheService.get(cacheKey);
        
        if (cachedThumbnails) {
            const cachedUrl = (cachedThumbnails as any)[size] || (cachedThumbnails as any).medium;
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
            res.setHeader('X-Cache-Status', 'HIT');
            res.json({ thumbnailUrl: cachedUrl, size });
            return;
        }

        const file = await File.findOne({ _id: fileId, user: req.user!._id });

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Return appropriate thumbnail size
        const thumbnails = {
            small: file.thumbnailSmall,
            medium: file.thumbnailMedium,
            large: file.thumbnailLarge,
        };

        const selectedThumbnail = thumbnails[size as keyof typeof thumbnails] || file.thumbnailUrl;

        if (selectedThumbnail) {
            // Cache the thumbnails
            await cacheService.set(cacheKey, thumbnails, CacheTTL.thumbnailUrl);
            
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
            res.setHeader('X-Cache-Status', 'MISS');
            res.json({ thumbnailUrl: selectedThumbnail, size });
            return;
        }

        // If no thumbnail exists, generate one on-demand
        const isImage = file.mimeType.startsWith('image/');
        const isVideo = file.mimeType.startsWith('video/');

        if (!isImage && !isVideo) {
            res.status(404).json({ message: 'No thumbnail available for this file type' });
            return;
        }

        // Generate thumbnail
        let userClient;
        if (file.storageType === 'user') {
            const user = await User.findById(req.user!._id).select('+telegramSession');
            if (!user || !user.telegramSession) {
                res.status(403).json({ message: 'Telegram connection required' });
                return;
            }
            userClient = await getUserClient(user.telegramSession);
        }

        const thumbnailUrl = await generateAndUploadThumbnail(
            file._id.toString(),
            file.originalName,
            file.mimeType,
            file.telegramMessageId,
            userClient
        );

        if (thumbnailUrl) {
            file.thumbnailUrl = thumbnailUrl;
            await file.save();
            res.json({ thumbnailUrl });
        } else {
            res.status(500).json({ message: 'Failed to generate thumbnail' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Thumbnail fetch failed' });
    }
};

export const previewFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = await File.findOne({ _id: req.params.id, user: req.user!._id });
        const quality = req.query.quality as string;

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        let chunks;
        if (file.storageType === 'user') {
            const user = await User.findById(req.user!._id).select('+telegramSession');
            if (!user || !user.telegramSession) {
                res.status(403).json({ message: 'Telegram connection required to preview this file.' });
                return;
            }
            const userClient = await getUserClient(user.telegramSession);
            chunks = await downloadFileFromTelegramWithClient(userClient, file.telegramMessageId);
        } else {
            chunks = await downloadFileFromTelegram(file.telegramMessageId);
        }

        // Handle low quality preview for images
        if (quality === 'low' && file.mimeType.startsWith('image/')) {
            // Create a readable stream from the async iterable chunks
            const readableStream = Readable.from(chunks);

            // Create sharp pipeline for resizing and compression
            const transform = sharp()
                .resize({ width: 800, withoutEnlargement: true }) // Reasonable preview size
                .jpeg({ quality: 60, mozjpeg: true }); // Lower quality for speed

            res.setHeader('Content-Disposition', `inline; filename="preview-${file.originalName}"`);
            res.setHeader('Content-Type', 'image/jpeg'); // We are converting to jpeg

            // Pipe: Source (Telegram) -> Sharp -> Response
            readableStream
                .pipe(transform)
                .on('error', (err) => {
                    console.error('Streaming resize error:', err);
                    // If headers aren't sent, we could try to send error, but usually too late
                    if (!res.headersSent) res.status(500).end();
                })
                .pipe(res);

            return;
        }

        // Default: Full quality stream
        res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Length', file.size);

        // chunks is an AsyncIterable<Buffer>
        for await (const chunk of chunks) {
            res.write(chunk);
        }
        res.end();

        // Update stats
        file.lastAccessed = new Date();
        await file.save();

    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Preview failed' });
        }
    }
};

export const downloadFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = await File.findOne({ _id: req.params.id, user: req.user!._id });

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        let chunks;
        if (file.storageType === 'user') {
            const user = await User.findById(req.user!._id).select('+telegramSession');
            if (!user || !user.telegramSession) {
                res.status(403).json({ message: 'Telegram connection required to download this file.' });
                return;
            }
            const userClient = await getUserClient(user.telegramSession);
            chunks = await downloadFileFromTelegramWithClient(userClient, file.telegramMessageId);
        } else {
            chunks = await downloadFileFromTelegram(file.telegramMessageId);
        }

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

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = await File.findOne({ _id: req.params.id, user: req.user!._id });

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        if (file.storageType === 'user') {
            // Requirement: "if user deletes from website, they can still access it from Telegram"
            // So we DO NOT delete from Telegram for user storage.
            // We only delete the reference in our DB.
        } else {
            // For legacy/bot files, we might want to delete, or keep them too.
            // Let's keep the existing behavior for bot files (delete) or maybe not?
            // The requirement specifically mentions "Saved Messages".
            // Let's assume bot files should be deleted to save space/cleanup.
            try {
                await deleteMessage(file.telegramMessageId);
            } catch (e) {
                console.error("Failed to delete message from bot channel", e);
            }
        }

        // Delete thumbnails from Cloudinary if exist
        const thumbnailUrls = {
            small: file.thumbnailSmall,
            medium: file.thumbnailMedium,
            large: file.thumbnailLarge,
        };
        
        if (thumbnailUrls.small || thumbnailUrls.medium || thumbnailUrls.large) {
            deleteThumbnails(thumbnailUrls).catch(err => {
                console.error("Failed to delete thumbnails from Cloudinary:", err);
            });
        }

        // Invalidate cache
        await invalidateFileCache(file._id.toString(), req.user!._id.toString());

        // Delete from DB
        await file.deleteOne();

        res.json({ message: 'File deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const bulkDownloadFiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fileIds } = req.body;

        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            res.status(400).json({ message: 'No file IDs provided' });
            return;
        }

        // Fetch all files and verify ownership
        const files = await File.find({ _id: { $in: fileIds }, user: req.user!._id });

        if (files.length === 0) {
            res.status(404).json({ message: 'No files found' });
            return;
        }

        // Get user for Telegram session if needed
        const user = await User.findById(req.user!._id).select('+telegramSession');

        // Create ZIP archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="files-${Date.now()}.zip"`);

        // Pipe archive to response
        archive.pipe(res);

        // Handle archive errors
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            res.status(500).json({ message: 'Failed to create archive' });
        });

        // Add each file to the archive
        for (const file of files) {
            try {
                let chunks;
                if (file.storageType === 'user') {
                    if (!user || !user.telegramSession) {
                        console.error(`Skipping file ${file.originalName}: No Telegram session`);
                        continue;
                    }
                    const userClient = await getUserClient(user.telegramSession);
                    chunks = await downloadFileFromTelegramWithClient(userClient, file.telegramMessageId);
                } else {
                    chunks = await downloadFileFromTelegram(file.telegramMessageId);
                }

                // Create a readable stream from the async iterable
                const { Readable } = await import('stream');
                const fileStream = Readable.from(chunks);

                // Add file to archive
                archive.append(fileStream, { name: file.originalName });

                // Update stats
                file.downloadCount += 1;
                file.lastAccessed = new Date();
                await file.save();
            } catch (err) {
                console.error(`Failed to add file ${file.originalName} to archive:`, err);
                // Continue with other files
            }
        }

        // Finalize the archive
        await archive.finalize();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Bulk download failed', error: (error as Error).message });
    }
};

export const bulkDeleteFiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fileIds } = req.body;

        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            res.status(400).json({ message: 'No file IDs provided' });
            return;
        }

        // Fetch all files and verify ownership
        const files = await File.find({ _id: { $in: fileIds }, user: req.user!._id });

        if (files.length === 0) {
            res.status(404).json({ message: 'No files found' });
            return;
        }

        const results = {
            success: [] as string[],
            failed: [] as { id: string; error: string }[]
        };

        // Delete each file
        for (const file of files) {
            try {
                if (file.storageType === 'user') {
                    // Don't delete from Telegram for user storage
                    // Only delete the reference in our DB
                } else {
                    // For bot files, delete from Telegram
                    try {
                        await deleteMessage(file.telegramMessageId);
                    } catch (e) {
                        console.error(`Failed to delete message from bot channel for file ${file._id}:`, e);
                    }
                }

                // Delete from DB
                await file.deleteOne();
                results.success.push(file._id.toString());
            } catch (err) {
                console.error(`Failed to delete file ${file._id}:`, err);
                results.failed.push({
                    id: file._id.toString(),
                    error: (err as Error).message
                });
            }
        }

        res.json({
            message: `Deleted ${results.success.length} of ${files.length} files`,
            results
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Bulk delete failed', error: (error as Error).message });
    }
};

export const toggleFavorite = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = await File.findOne({ _id: req.params.id, user: req.user!._id });

        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }

        // Toggle the favorite status
        file.isFavorite = !file.isFavorite;
        await file.save();

        res.json({
            message: file.isFavorite ? 'File added to favorites' : 'File removed from favorites',
            isFavorite: file.isFavorite
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to toggle favorite', error: (error as Error).message });
    }
};

export const getFavoriteFiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const files = await File.find({ user: req.user!._id, isFavorite: true }).sort({ uploadedAt: -1 });
        res.json(files);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch favorite files', error: (error as Error).message });
    }
};
