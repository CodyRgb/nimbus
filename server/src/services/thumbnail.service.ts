import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { TelegramClient } from 'telegram';
import { v2 as cloudinary } from 'cloudinary';
import { downloadFileFromTelegramWithClient } from './telegram.service';
import ffmpeg from 'fluent-ffmpeg';

const TEMP_DIR = path.join(__dirname, '../../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Thumbnail size configurations
export const THUMBNAIL_SIZES = {
    small: { width: 150, height: 150, quality: 75 },
    medium: { width: 400, height: 400, quality: 80 },
    large: { width: 800, height: 800, quality: 85 },
};

interface ThumbnailResult {
    small?: string;
    medium?: string;
    large?: string;
    dimensions?: { width: number; height: number };
}

/**
 * Download file from Telegram to temp location
 */
const downloadToTemp = async (
    messageId: number,
    fileName: string,
    userClient: TelegramClient
): Promise<string> => {
    const tempPath = path.join(TEMP_DIR, `${Date.now()}_${fileName}`);
    const writeStream = fs.createWriteStream(tempPath);

    const chunks = await downloadFileFromTelegramWithClient(userClient, messageId);

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
const generateImageThumbnails = async (
    inputPath: string,
    baseFileName: string
): Promise<ThumbnailResult> => {
    const result: ThumbnailResult = {};

    try {
        // Get original dimensions
        const metadata = await sharp(inputPath).metadata();
        if (metadata.width && metadata.height) {
            result.dimensions = { width: metadata.width, height: metadata.height };
        }

        // Generate thumbnails in parallel
        const thumbnailPromises = Object.entries(THUMBNAIL_SIZES).map(
            async ([size, config]) => {
                const outputPath = path.join(
                    TEMP_DIR,
                    `${baseFileName}_${size}.webp`
                );

                await sharp(inputPath)
                    .resize(config.width, config.height, {
                        fit: 'cover',
                        position: 'center',
                    })
                    .webp({ quality: config.quality })
                    .toFile(outputPath);

                // Upload to Cloudinary
                const uploadResult = await cloudinary.uploader.upload(outputPath, {
                    folder: `thumbnails/${size}`,
                    format: 'webp',
                    resource_type: 'image',
                });

                // Clean up temp file
                fs.unlinkSync(outputPath);

                return { size, url: uploadResult.secure_url };
            }
        );

        const thumbnails = await Promise.all(thumbnailPromises);

        // Map results
        thumbnails.forEach(({ size, url }) => {
            if (size === 'small' || size === 'medium' || size === 'large') {
                result[size] = url;
            }
        });

        return result;
    } catch (error) {
        console.error('Error generating image thumbnails:', error);
        throw error;
    }
};

/**
 * Extract video thumbnail at specific timestamp
 */
const generateVideoThumbnail = async (
    inputPath: string,
    baseFileName: string
): Promise<ThumbnailResult> => {
    const result: ThumbnailResult = {};

    return new Promise((resolve, reject) => {
        const screenshotPath = path.join(TEMP_DIR, `${baseFileName}_frame.jpg`);

        ffmpeg(inputPath)
            .screenshots({
                timestamps: ['10%'],
                filename: `${baseFileName}_frame.jpg`,
                folder: TEMP_DIR,
                size: '800x?',
            })
            .on('end', async () => {
                try {
                    // Now generate thumbnails from the extracted frame
                    const thumbnails = await generateImageThumbnails(
                        screenshotPath,
                        baseFileName
                    );

                    // Get video dimensions
                    ffmpeg.ffprobe(inputPath, (err, metadata) => {
                        if (!err && metadata.streams) {
                            const videoStream = metadata.streams.find(
                                (s) => s.codec_type === 'video'
                            );
                            if (videoStream && videoStream.width && videoStream.height) {
                                thumbnails.dimensions = {
                                    width: videoStream.width,
                                    height: videoStream.height,
                                };
                            }
                        }
                    });

                    // Clean up temp frame
                    fs.unlinkSync(screenshotPath);

                    resolve(thumbnails);
                } catch (error) {
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
export const generateThumbnails = async (
    fileId: string,
    fileName: string,
    mimeType: string,
    messageId: number,
    userClient: TelegramClient
): Promise<ThumbnailResult | null> => {
    let tempPath: string | null = null;

    try {
        // Only process images and videos
        if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
            return null;
        }

        // Download file from Telegram
        tempPath = await downloadToTemp(messageId, fileName, userClient);

        const baseFileName = `file_${fileId}`;
        let thumbnails: ThumbnailResult;

        if (mimeType.startsWith('image/')) {
            thumbnails = await generateImageThumbnails(tempPath, baseFileName);
        } else if (mimeType.startsWith('video/')) {
            thumbnails = await generateVideoThumbnail(tempPath, baseFileName);
        } else {
            return null;
        }

        return thumbnails;
    } catch (error) {
        console.error(`Thumbnail generation failed for ${fileName}:`, error);
        return null;
    } finally {
        // Clean up temp file
        if (tempPath && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }
};

/**
 * Delete thumbnails from Cloudinary
 */
export const deleteThumbnails = async (
    thumbnailUrls: { small?: string; medium?: string; large?: string }
): Promise<void> => {
    const deletePromises = Object.values(thumbnailUrls)
        .filter((url) => url)
        .map((url) => {
            // Extract public_id from Cloudinary URL
            const matches = url!.match(/\/thumbnails\/[^/]+\/([^.]+)/);
            if (matches) {
                const publicId = `thumbnails/${matches[0].split('/').slice(-2).join('/')}`;
                return cloudinary.uploader.destroy(publicId);
            }
            return Promise.resolve();
        });

    await Promise.allSettled(deletePromises);
};