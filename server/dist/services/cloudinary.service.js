"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteThumbnailFromCloudinary = exports.generateAndUploadThumbnail = void 0;
const cloudinary_1 = require("cloudinary");
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const telegram_service_1 = require("./telegram.service");
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const THUMBNAIL_SIZE = 400;
const TEMP_DIR = path_1.default.join(__dirname, '../../temp');
// Ensure temp directory exists
if (!fs_1.default.existsSync(TEMP_DIR)) {
    fs_1.default.mkdirSync(TEMP_DIR, { recursive: true });
}
/**
 * Download file from Telegram and save to temp location
 */
const downloadToTemp = async (messageId, fileName, userClient) => {
    const tempPath = path_1.default.join(TEMP_DIR, `${Date.now()}_${fileName}`);
    const writeStream = fs_1.default.createWriteStream(tempPath);
    const chunks = userClient
        ? await (0, telegram_service_1.downloadFileFromTelegramWithClient)(userClient, messageId)
        : await (0, telegram_service_1.downloadFileFromTelegram)(messageId);
    for await (const chunk of chunks) {
        writeStream.write(chunk);
    }
    return new Promise((resolve, reject) => {
        writeStream.end(() => resolve(tempPath));
        writeStream.on('error', reject);
    });
};
/**
 * Generate thumbnail for image files
 */
const generateImageThumbnail = async (inputPath) => {
    return (0, sharp_1.default)(inputPath)
        .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'inside',
        withoutEnlargement: true,
    })
        .jpeg({ quality: 80 })
        .toBuffer();
};
/**
 * Generate thumbnail for video files (extract first frame)
 */
const generateVideoThumbnail = async (inputPath) => {
    const ffmpeg = require('fluent-ffmpeg');
    const thumbnailPath = path_1.default.join(TEMP_DIR, `thumb_${Date.now()}.jpg`);
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .screenshots({
            timestamps: ['1'],
            filename: path_1.default.basename(thumbnailPath),
            folder: TEMP_DIR,
            size: `${THUMBNAIL_SIZE}x${THUMBNAIL_SIZE}`,
        })
            .on('end', async () => {
            try {
                const buffer = await fs_1.default.promises.readFile(thumbnailPath);
                fs_1.default.unlinkSync(thumbnailPath);
                resolve(buffer);
            }
            catch (err) {
                reject(err);
            }
        })
            .on('error', reject);
    });
};
/**
 * Upload thumbnail to Cloudinary
 */
const uploadToCloudinary = async (buffer, fileId, fileName) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder: 'nimbus-thumbnails',
            public_id: fileId,
            resource_type: 'image',
            format: 'jpg',
            transformation: [
                { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE, crop: 'limit' },
                { quality: 'auto:good' },
            ],
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            else if (result) {
                resolve(result.secure_url);
            }
            else {
                reject(new Error('Upload failed without error'));
            }
        });
        uploadStream.end(buffer);
    });
};
/**
 * Main function to generate and upload thumbnail
 */
const generateAndUploadThumbnail = async (fileId, fileName, mimeType, messageId, userClient) => {
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');
    if (!isImage && !isVideo) {
        console.log(`Skipping thumbnail for non-media file: ${fileName}`);
        return null;
    }
    let tempFilePath = null;
    try {
        console.log(`Generating thumbnail for ${fileName}...`);
        // Download file from Telegram to temp location
        tempFilePath = await downloadToTemp(messageId, fileName, userClient);
        // Generate thumbnail based on file type
        let thumbnailBuffer;
        if (isImage) {
            thumbnailBuffer = await generateImageThumbnail(tempFilePath);
        }
        else {
            // For videos, we'll use sharp to create a placeholder for now
            // If ffmpeg is available, use generateVideoThumbnail
            try {
                thumbnailBuffer = await generateVideoThumbnail(tempFilePath);
            }
            catch (err) {
                console.log('FFmpeg not available, using placeholder for video thumbnail');
                // Create a simple placeholder
                thumbnailBuffer = await (0, sharp_1.default)({
                    create: {
                        width: THUMBNAIL_SIZE,
                        height: THUMBNAIL_SIZE,
                        channels: 3,
                        background: { r: 30, g: 30, b: 30 },
                    },
                })
                    .jpeg()
                    .toBuffer();
            }
        }
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(thumbnailBuffer, fileId, fileName);
        console.log(`Thumbnail uploaded successfully: ${cloudinaryUrl}`);
        return cloudinaryUrl;
    }
    catch (error) {
        console.error(`Failed to generate thumbnail for ${fileName}:`, error);
        return null;
    }
    finally {
        // Clean up temp file with retry for Windows EBUSY
        if (tempFilePath && fs_1.default.existsSync(tempFilePath)) {
            // Explicitly tell sharp to release cache if it's holding it
            sharp_1.default.cache(false);
            setTimeout(() => {
                fs_1.default.unlink(tempFilePath, (err) => {
                    if (err) {
                        console.error(`First cleanup attempt failed for ${tempFilePath}:`, err);
                        // Retry once after a longer delay
                        setTimeout(() => {
                            fs_1.default.unlink(tempFilePath, (retryErr) => {
                                if (retryErr)
                                    console.error(`Final cleanup attempt failed for ${tempFilePath}:`, retryErr);
                            });
                        }, 1000);
                    }
                });
            }, 100);
        }
    }
};
exports.generateAndUploadThumbnail = generateAndUploadThumbnail;
/**
 * Delete thumbnail from Cloudinary
 */
const deleteThumbnailFromCloudinary = async (fileId) => {
    try {
        await cloudinary_1.v2.uploader.destroy(`nimbus-thumbnails/${fileId}`);
        console.log(`Thumbnail deleted from Cloudinary: ${fileId}`);
    }
    catch (error) {
        console.error(`Failed to delete thumbnail from Cloudinary:`, error);
    }
};
exports.deleteThumbnailFromCloudinary = deleteThumbnailFromCloudinary;
exports.default = cloudinary_1.v2;
