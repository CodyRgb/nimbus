"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteThumbnails = exports.generateThumbnails = exports.THUMBNAIL_SIZES = void 0;
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cloudinary_1 = require("cloudinary");
const telegram_service_1 = require("./telegram.service");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const TEMP_DIR = path_1.default.join(__dirname, '../../temp');
// Ensure temp directory exists
if (!fs_1.default.existsSync(TEMP_DIR)) {
    fs_1.default.mkdirSync(TEMP_DIR, { recursive: true });
}
// Thumbnail size configurations
exports.THUMBNAIL_SIZES = {
    small: { width: 150, height: 150, quality: 75 },
    medium: { width: 400, height: 400, quality: 80 },
    large: { width: 800, height: 800, quality: 85 },
};
/**
 * Download file from Telegram to temp location
 */
const downloadToTemp = async (messageId, fileName, userClient) => {
    const tempPath = path_1.default.join(TEMP_DIR, `${Date.now()}_${fileName}`);
    const writeStream = fs_1.default.createWriteStream(tempPath);
    const chunks = await (0, telegram_service_1.downloadFileFromTelegramWithClient)(userClient, messageId);
    for await (const chunk of chunks) {
        writeStream.write(chunk);
    }
    return new Promise((resolve, reject) => {
        writeStream.end(() => resolve(tempPath));
        writeStream.on('error', reject);
    });
};
/**
 * Generate multiple thumbnail sizes for an image
 */
const generateImageThumbnails = async (inputPath, baseFileName) => {
    const result = {};
    try {
        // Get original dimensions
        const metadata = await (0, sharp_1.default)(inputPath).metadata();
        if (metadata.width && metadata.height) {
            result.dimensions = { width: metadata.width, height: metadata.height };
        }
        // Generate thumbnails in parallel
        const thumbnailPromises = Object.entries(exports.THUMBNAIL_SIZES).map(async ([size, config]) => {
            const outputPath = path_1.default.join(TEMP_DIR, `${baseFileName}_${size}.webp`);
            await (0, sharp_1.default)(inputPath)
                .resize(config.width, config.height, {
                fit: 'cover',
                position: 'center',
            })
                .webp({ quality: config.quality })
                .toFile(outputPath);
            // Upload to Cloudinary
            const uploadResult = await cloudinary_1.v2.uploader.upload(outputPath, {
                folder: `thumbnails/${size}`,
                format: 'webp',
                resource_type: 'image',
            });
            // Clean up temp file
            fs_1.default.unlinkSync(outputPath);
            return { size, url: uploadResult.secure_url };
        });
        const thumbnails = await Promise.all(thumbnailPromises);
        // Map results
        thumbnails.forEach(({ size, url }) => {
            if (size === 'small' || size === 'medium' || size === 'large') {
                result[size] = url;
            }
        });
        return result;
    }
    catch (error) {
        console.error('Error generating image thumbnails:', error);
        throw error;
    }
};
/**
 * Extract video thumbnail at specific timestamp
 */
const generateVideoThumbnail = async (inputPath, baseFileName) => {
    const result = {};
    return new Promise((resolve, reject) => {
        const screenshotPath = path_1.default.join(TEMP_DIR, `${baseFileName}_frame.jpg`);
        (0, fluent_ffmpeg_1.default)(inputPath)
            .screenshots({
            timestamps: ['10%'],
            filename: `${baseFileName}_frame.jpg`,
            folder: TEMP_DIR,
            size: '800x?',
        })
            .on('end', async () => {
            try {
                // Now generate thumbnails from the extracted frame
                const thumbnails = await generateImageThumbnails(screenshotPath, baseFileName);
                // Get video dimensions
                fluent_ffmpeg_1.default.ffprobe(inputPath, (err, metadata) => {
                    if (!err && metadata.streams) {
                        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
                        if (videoStream && videoStream.width && videoStream.height) {
                            thumbnails.dimensions = {
                                width: videoStream.width,
                                height: videoStream.height,
                            };
                        }
                    }
                });
                // Clean up temp frame
                fs_1.default.unlinkSync(screenshotPath);
                resolve(thumbnails);
            }
            catch (error) {
                reject(error);
            }
        })
            .on('error', (err) => {
            console.error('FFmpeg error:', err);
            reject(err);
        });
    });
};
/**
 * Main function to generate thumbnails for any file type
 */
const generateThumbnails = async (fileId, fileName, mimeType, messageId, userClient) => {
    let tempPath = null;
    try {
        // Only process images and videos
        if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
            return null;
        }
        // Download file from Telegram
        tempPath = await downloadToTemp(messageId, fileName, userClient);
        const baseFileName = `file_${fileId}`;
        let thumbnails;
        if (mimeType.startsWith('image/')) {
            thumbnails = await generateImageThumbnails(tempPath, baseFileName);
        }
        else if (mimeType.startsWith('video/')) {
            thumbnails = await generateVideoThumbnail(tempPath, baseFileName);
        }
        else {
            return null;
        }
        return thumbnails;
    }
    catch (error) {
        console.error(`Thumbnail generation failed for ${fileName}:`, error);
        return null;
    }
    finally {
        // Clean up temp file
        if (tempPath && fs_1.default.existsSync(tempPath)) {
            fs_1.default.unlinkSync(tempPath);
        }
    }
};
exports.generateThumbnails = generateThumbnails;
/**
 * Delete thumbnails from Cloudinary
 */
const deleteThumbnails = async (thumbnailUrls) => {
    const deletePromises = Object.values(thumbnailUrls)
        .filter((url) => url)
        .map((url) => {
        // Extract public_id from Cloudinary URL
        const matches = url.match(/\/thumbnails\/[^/]+\/([^.]+)/);
        if (matches) {
            const publicId = `thumbnails/${matches[0].split('/').slice(-2).join('/')}`;
            return cloudinary_1.v2.uploader.destroy(publicId);
        }
        return Promise.resolve();
    });
    await Promise.allSettled(deletePromises);
};
exports.deleteThumbnails = deleteThumbnails;
