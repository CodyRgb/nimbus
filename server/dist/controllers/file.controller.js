"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStorageStats = exports.renameFile = exports.getFavoriteFiles = exports.toggleFavorite = exports.bulkDeleteFiles = exports.bulkDownloadFiles = exports.deleteFile = exports.downloadFile = exports.previewFile = exports.getThumbnail = exports.getFiles = exports.getFolders = exports.createFolder = exports.uploadFile = void 0;
const File_model_1 = __importDefault(require("../models/File.model"));
const Folder_model_1 = __importDefault(require("../models/Folder.model"));
const telegram_service_1 = require("../services/telegram.service");
const logger_1 = require("../utils/logger");
const cloudinary_service_1 = require("../services/cloudinary.service");
const thumbnail_service_1 = require("../services/thumbnail.service");
const cache_service_1 = require("../services/cache.service");
const fs_1 = __importDefault(require("fs"));
const User_model_1 = __importDefault(require("../models/User.model"));
const archiver_1 = __importDefault(require("archiver"));
const sharp_1 = __importDefault(require("sharp"));
const stream_1 = require("stream");
const crypto_1 = __importDefault(require("crypto"));
const exif_parser_1 = __importDefault(require("exif-parser"));
// Extend Request to include user (added by auth middleware)
// We can rely on declaration merging in auth.middleware.ts for 'user'
// For 'files', we can cast inside the function
const uploadFile = async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ message: 'No files uploaded' });
            return;
        }
        const userId = req.user._id;
        // Fetch user to get telegram session
        const user = await User_model_1.default.findById(userId).select('+telegramSession');
        if (!user || !user.telegramSession) {
            res.status(403).json({ message: 'Please connect your Telegram account to upload files.' });
            return;
        }
        const userClient = await (0, telegram_service_1.getUserClient)(user.telegramSession);
        const uploadedFiles = [];
        const failedFiles = [];
        for (const file of files) {
            const { originalname, mimetype, size, path: tempPath, filename } = file;
            try {
                logger_1.logger.info(`[Upload] Starting upload for ${originalname} (${(size / 1024 / 1024).toFixed(2)} MB)`);
                // Upload to Telegram (User) with automatic retry
                const telegramResult = await (0, telegram_service_1.uploadFileToTelegramWithClient)(userClient, tempPath, originalname, mimetype);
                // Extract date taken from EXIF metadata for images
                let dateTaken;
                if (mimetype.startsWith('image/')) {
                    try {
                        const fileBuffer = fs_1.default.readFileSync(tempPath);
                        const parser = exif_parser_1.default.create(fileBuffer);
                        const result = parser.parse();
                        // Try to get the date from EXIF tags
                        if (result.tags?.DateTimeOriginal) {
                            dateTaken = new Date(result.tags.DateTimeOriginal * 1000); // Convert Unix timestamp to Date
                        }
                        else if (result.tags?.CreateDate) {
                            dateTaken = new Date(result.tags.CreateDate * 1000);
                        }
                        if (dateTaken && !isNaN(dateTaken.getTime())) {
                            logger_1.logger.info(`[Upload] Extracted date taken: ${dateTaken.toISOString()} for ${originalname}`);
                        }
                    }
                    catch (exifError) {
                        // Not all images have EXIF data, this is expected
                        logger_1.logger.debug(`[Upload] No EXIF data found for ${originalname}`);
                    }
                }
                // Create DB record
                const newFile = await File_model_1.default.create({
                    user: userId,
                    folder: null,
                    filename: filename,
                    originalName: originalname,
                    mimeType: mimetype,
                    size: size,
                    telegramFileId: 'N/A',
                    telegramMessageId: telegramResult.messageId,
                    storageType: 'user',
                    dateTaken: dateTaken,
                });
                uploadedFiles.push(newFile);
                // Generate cache key for deduplication
                const fileHash = crypto_1.default.createHash('sha256')
                    .update(`${userId}-${originalname}-${size}`)
                    .digest('hex');
                newFile.cacheKey = fileHash;
                // Generate and upload thumbnails asynchronously (don't wait for it)
                (0, thumbnail_service_1.generateThumbnails)(newFile._id.toString(), originalname, mimetype, telegramResult.messageId, userClient).then(thumbnails => {
                    if (thumbnails) {
                        newFile.thumbnailSmall = thumbnails.small;
                        newFile.thumbnailMedium = thumbnails.medium;
                        newFile.thumbnailLarge = thumbnails.large;
                        newFile.thumbnailUrl = thumbnails.medium; // Backward compatibility
                        newFile.dimensions = thumbnails.dimensions;
                        newFile.save();
                        // Cache thumbnail URLs
                        cache_service_1.cacheService.set(cache_service_1.CacheKeys.thumbnailUrl(newFile._id.toString()), thumbnails, cache_service_1.CacheTTL.thumbnailUrl);
                    }
                }).catch(err => {
                    console.error(`Thumbnail generation failed for ${originalname}:`, err);
                });
                // Clean up temp file
                fs_1.default.unlink(tempPath, (err) => {
                    if (err)
                        console.error("Error deleting temp file:", err);
                });
            }
            catch (err) {
                logger_1.logger.error(`[Upload] Failed to upload file ${originalname}:`, err.message);
                failedFiles.push({
                    filename: originalname,
                    error: err.message || 'Upload failed'
                });
                // Try to clean up temp file even if upload failed
                fs_1.default.unlink(tempPath, (e) => {
                    if (e)
                        logger_1.logger.error(`[Upload] Failed to delete temp file ${tempPath}:`, e);
                });
            }
        }
        // Invalidate user's file list cache
        await (0, cache_service_1.invalidateUserCache)(userId.toString());
        // Return results with success and failure information
        const response = {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
exports.uploadFile = uploadFile;
const createFolder = async (req, res) => {
    try {
        const { name, parentId } = req.body;
        const userId = req.user._id;
        let path = [];
        if (parentId) {
            const parentFolder = await Folder_model_1.default.findOne({ _id: parentId, user: userId });
            if (!parentFolder) {
                res.status(404).json({ message: 'Parent folder not found' });
                return;
            }
            path = [...parentFolder.path, parentFolder.name];
        }
        const folder = await Folder_model_1.default.create({
            user: userId,
            name,
            parent: parentId || null,
            path
        });
        res.status(201).json(folder);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.createFolder = createFolder;
const getFolders = async (req, res) => {
    try {
        const parentId = req.params.parentId || null;
        const folders = await Folder_model_1.default.find({ user: req.user._id, parent: parentId }).sort({ name: 1 });
        res.json(folders);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getFolders = getFolders;
const getFiles = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const folderId = req.query.folderId || null;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        // Try to get from cache first
        const cacheKey = cache_service_1.CacheKeys.fileList(userId, page, limit, folderId || undefined);
        const cachedData = await cache_service_1.cacheService.get(cacheKey);
        if (cachedData) {
            res.setHeader('X-Cache-Status', 'HIT');
            res.json(cachedData);
            return;
        }
        let query = { user: req.user._id };
        if (req.query.folderId !== undefined) {
            query.folder = req.query.folderId === 'root' ? null : req.query.folderId;
        }
        // Get total count for pagination
        const total = await File_model_1.default.countDocuments(query);
        // Get files with pagination
        const files = await File_model_1.default.find(query)
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
        await cache_service_1.cacheService.set(cacheKey, response, cache_service_1.CacheTTL.fileList);
        res.setHeader('X-Cache-Status', 'MISS');
        res.json(response);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getFiles = getFiles;
const getThumbnail = async (req, res) => {
    try {
        const fileId = req.params.id;
        const size = req.query.size || 'medium';
        // Check cache first
        const cacheKey = cache_service_1.CacheKeys.thumbnailUrl(fileId);
        const cachedThumbnails = await cache_service_1.cacheService.get(cacheKey);
        if (cachedThumbnails) {
            const cachedUrl = cachedThumbnails[size] || cachedThumbnails.medium;
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
            res.setHeader('X-Cache-Status', 'HIT');
            res.json({ thumbnailUrl: cachedUrl, size });
            return;
        }
        const file = await File_model_1.default.findOne({ _id: fileId, user: req.user._id });
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
        const selectedThumbnail = thumbnails[size] || file.thumbnailUrl;
        if (selectedThumbnail) {
            // Cache the thumbnails
            await cache_service_1.cacheService.set(cacheKey, thumbnails, cache_service_1.CacheTTL.thumbnailUrl);
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
            const user = await User_model_1.default.findById(req.user._id).select('+telegramSession');
            if (!user || !user.telegramSession) {
                res.status(403).json({ message: 'Telegram connection required' });
                return;
            }
            userClient = await (0, telegram_service_1.getUserClient)(user.telegramSession);
        }
        const thumbnailUrl = await (0, cloudinary_service_1.generateAndUploadThumbnail)(file._id.toString(), file.originalName, file.mimeType, file.telegramMessageId, userClient);
        if (thumbnailUrl) {
            file.thumbnailUrl = thumbnailUrl;
            await file.save();
            res.json({ thumbnailUrl });
        }
        else {
            res.status(500).json({ message: 'Failed to generate thumbnail' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Thumbnail fetch failed' });
    }
};
exports.getThumbnail = getThumbnail;
const previewFile = async (req, res) => {
    try {
        const file = await File_model_1.default.findOne({ _id: req.params.id, user: req.user._id });
        const quality = req.query.quality;
        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }
        let chunks;
        if (file.storageType === 'user') {
            const user = await User_model_1.default.findById(req.user._id).select('+telegramSession');
            if (!user || !user.telegramSession) {
                res.status(403).json({ message: 'Telegram connection required to preview this file.' });
                return;
            }
            const userClient = await (0, telegram_service_1.getUserClient)(user.telegramSession);
            chunks = await (0, telegram_service_1.downloadFileFromTelegramWithClient)(userClient, file.telegramMessageId);
        }
        else {
            chunks = await (0, telegram_service_1.downloadFileFromTelegram)(file.telegramMessageId);
        }
        // Handle low quality preview for images
        if (quality === 'low' && file.mimeType.startsWith('image/')) {
            // Create a readable stream from the async iterable chunks
            const readableStream = stream_1.Readable.from(chunks);
            // Create sharp pipeline for resizing and compression
            const transform = (0, sharp_1.default)()
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
                if (!res.headersSent)
                    res.status(500).end();
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
    }
    catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Preview failed' });
        }
    }
};
exports.previewFile = previewFile;
const downloadFile = async (req, res) => {
    try {
        const file = await File_model_1.default.findOne({ _id: req.params.id, user: req.user._id });
        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }
        let chunks;
        if (file.storageType === 'user') {
            const user = await User_model_1.default.findById(req.user._id).select('+telegramSession');
            if (!user || !user.telegramSession) {
                res.status(403).json({ message: 'Telegram connection required to download this file.' });
                return;
            }
            const userClient = await (0, telegram_service_1.getUserClient)(user.telegramSession);
            chunks = await (0, telegram_service_1.downloadFileFromTelegramWithClient)(userClient, file.telegramMessageId);
        }
        else {
            chunks = await (0, telegram_service_1.downloadFileFromTelegram)(file.telegramMessageId);
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Download failed' });
    }
};
exports.downloadFile = downloadFile;
const deleteFile = async (req, res) => {
    try {
        const file = await File_model_1.default.findOne({ _id: req.params.id, user: req.user._id });
        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }
        if (file.storageType === 'user') {
            // Requirement: "if user deletes from website, they can still access it from Telegram"
            // So we DO NOT delete from Telegram for user storage.
            // We only delete the reference in our DB.
        }
        else {
            // For legacy/bot files, we might want to delete, or keep them too.
            // Let's keep the existing behavior for bot files (delete) or maybe not?
            // The requirement specifically mentions "Saved Messages".
            // Let's assume bot files should be deleted to save space/cleanup.
            try {
                await (0, telegram_service_1.deleteMessage)(file.telegramMessageId);
            }
            catch (e) {
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
            (0, thumbnail_service_1.deleteThumbnails)(thumbnailUrls).catch(err => {
                console.error("Failed to delete thumbnails from Cloudinary:", err);
            });
        }
        // Invalidate cache
        await (0, cache_service_1.invalidateFileCache)(file._id.toString(), req.user._id.toString());
        // Delete from DB
        await file.deleteOne();
        res.json({ message: 'File deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.deleteFile = deleteFile;
const bulkDownloadFiles = async (req, res) => {
    try {
        const { fileIds } = req.body;
        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            res.status(400).json({ message: 'No file IDs provided' });
            return;
        }
        // Fetch all files and verify ownership
        const files = await File_model_1.default.find({ _id: { $in: fileIds }, user: req.user._id });
        if (files.length === 0) {
            res.status(404).json({ message: 'No files found' });
            return;
        }
        // Get user for Telegram session if needed
        const user = await User_model_1.default.findById(req.user._id).select('+telegramSession');
        // Create ZIP archive
        const archive = (0, archiver_1.default)('zip', {
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
                    const userClient = await (0, telegram_service_1.getUserClient)(user.telegramSession);
                    chunks = await (0, telegram_service_1.downloadFileFromTelegramWithClient)(userClient, file.telegramMessageId);
                }
                else {
                    chunks = await (0, telegram_service_1.downloadFileFromTelegram)(file.telegramMessageId);
                }
                // Create a readable stream from the async iterable
                const { Readable } = await Promise.resolve().then(() => __importStar(require('stream')));
                const fileStream = Readable.from(chunks);
                // Add file to archive
                archive.append(fileStream, { name: file.originalName });
                // Update stats
                file.downloadCount += 1;
                file.lastAccessed = new Date();
                await file.save();
            }
            catch (err) {
                console.error(`Failed to add file ${file.originalName} to archive:`, err);
                // Continue with other files
            }
        }
        // Finalize the archive
        await archive.finalize();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Bulk download failed', error: error.message });
    }
};
exports.bulkDownloadFiles = bulkDownloadFiles;
const bulkDeleteFiles = async (req, res) => {
    try {
        const { fileIds } = req.body;
        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            res.status(400).json({ message: 'No file IDs provided' });
            return;
        }
        // Fetch all files and verify ownership
        const files = await File_model_1.default.find({ _id: { $in: fileIds }, user: req.user._id });
        if (files.length === 0) {
            res.status(404).json({ message: 'No files found' });
            return;
        }
        const results = {
            success: [],
            failed: []
        };
        // Delete each file
        for (const file of files) {
            try {
                if (file.storageType === 'user') {
                    // Don't delete from Telegram for user storage
                    // Only delete the reference in our DB
                }
                else {
                    // For bot files, delete from Telegram
                    try {
                        await (0, telegram_service_1.deleteMessage)(file.telegramMessageId);
                    }
                    catch (e) {
                        console.error(`Failed to delete message from bot channel for file ${file._id}:`, e);
                    }
                }
                // Delete from DB
                await file.deleteOne();
                results.success.push(file._id.toString());
            }
            catch (err) {
                console.error(`Failed to delete file ${file._id}:`, err);
                results.failed.push({
                    id: file._id.toString(),
                    error: err.message
                });
            }
        }
        res.json({
            message: `Deleted ${results.success.length} of ${files.length} files`,
            results
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Bulk delete failed', error: error.message });
    }
};
exports.bulkDeleteFiles = bulkDeleteFiles;
const toggleFavorite = async (req, res) => {
    try {
        const file = await File_model_1.default.findOne({ _id: req.params.id, user: req.user._id });
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to toggle favorite', error: error.message });
    }
};
exports.toggleFavorite = toggleFavorite;
const getFavoriteFiles = async (req, res) => {
    try {
        const files = await File_model_1.default.find({ user: req.user._id, isFavorite: true }).sort({ uploadedAt: -1 });
        res.json(files);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch favorite files', error: error.message });
    }
};
exports.getFavoriteFiles = getFavoriteFiles;
const renameFile = async (req, res) => {
    try {
        const { newName } = req.body;
        // Validation
        if (!newName || typeof newName !== 'string') {
            res.status(400).json({ message: 'New name is required' });
            return;
        }
        const trimmedName = newName.trim();
        if (trimmedName.length === 0) {
            res.status(400).json({ message: 'File name cannot be empty' });
            return;
        }
        if (trimmedName.length > 255) {
            res.status(400).json({ message: 'File name is too long (max 255 characters)' });
            return;
        }
        const file = await File_model_1.default.findOne({ _id: req.params.id, user: req.user._id });
        if (!file) {
            res.status(404).json({ message: 'File not found' });
            return;
        }
        // Update the file name
        file.originalName = trimmedName;
        await file.save();
        // Invalidate cache
        await (0, cache_service_1.invalidateFileCache)(file._id.toString(), req.user._id.toString());
        res.json({
            message: 'File renamed successfully',
            file: file
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to rename file', error: error.message });
    }
};
exports.renameFile = renameFile;
const getStorageStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const files = await File_model_1.default.find({ user: userId });
        let totalUsed = 0;
        const categoryStats = {
            images: 0,
            documents: 0,
            videos: 0,
            other: 0
        };
        files.forEach(file => {
            totalUsed += file.size;
            const mimeType = file.mimeType.toLowerCase();
            if (mimeType.startsWith('image/')) {
                categoryStats.images += file.size;
            }
            else if (mimeType.startsWith('video/')) {
                categoryStats.videos += file.size;
            }
            else if (mimeType.includes('pdf') ||
                mimeType.includes('document') ||
                mimeType.includes('text') ||
                mimeType.includes('word') ||
                mimeType.includes('excel') ||
                mimeType.includes('sheet')) {
                categoryStats.documents += file.size;
            }
            else {
                categoryStats.other += file.size;
            }
        });
        res.json({
            totalUsed,
            categoryStats
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getStorageStats = getStorageStats;
