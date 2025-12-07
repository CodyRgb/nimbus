import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { downloadFileFromTelegram, downloadFileFromTelegramWithClient } from './telegram.service';
import { TelegramClient } from 'telegram';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const THUMBNAIL_SIZE = 400;
const TEMP_DIR = path.join(__dirname, '../../temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Download file from Telegram and save to temp location
 */
const downloadToTemp = async (
    messageId: number,
    fileName: string,
    userClient?: TelegramClient
): Promise<string> => {
    const tempPath = path.join(TEMP_DIR, `${Date.now()}_${fileName}`);
    const writeStream = fs.createWriteStream(tempPath);

    const chunks = userClient
        ? await downloadFileFromTelegramWithClient(userClient, messageId)
        : await downloadFileFromTelegram(messageId);

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
const generateImageThumbnail = async (inputPath: string): Promise<Buffer> => {
    return sharp(inputPath)
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
const generateVideoThumbnail = async (inputPath: string): Promise<Buffer> => {
    const ffmpeg = require('fluent-ffmpeg');
    const thumbnailPath = path.join(TEMP_DIR, `thumb_${Date.now()}.jpg`);

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .screenshots({
                timestamps: ['1'],
                filename: path.basename(thumbnailPath),
                folder: TEMP_DIR,
                size: `${THUMBNAIL_SIZE}x${THUMBNAIL_SIZE}`,
            })
            .on('end', async () => {
                try {
                    const buffer = await fs.promises.readFile(thumbnailPath);
                    fs.unlinkSync(thumbnailPath);
                    resolve(buffer);
                } catch (err) {
                    reject(err);
                }
            })
            .on('error', reject);
    });
};

/**
 * Upload thumbnail to Cloudinary
 */
const uploadToCloudinary = async (
    buffer: Buffer,
    fileId: string,
    fileName: string
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'nimbus-thumbnails',
                public_id: fileId,
                resource_type: 'image',
                format: 'jpg',
                transformation: [
                    { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE, crop: 'limit' },
                    { quality: 'auto:good' },
                ],
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else if (result) {
                    resolve(result.secure_url);
                } else {
                    reject(new Error('Upload failed without error'));
                }
            }
        );

        uploadStream.end(buffer);
    });
};

/**
 * Main function to generate and upload thumbnail
 */
export const generateAndUploadThumbnail = async (
    fileId: string,
    fileName: string,
    mimeType: string,
    messageId: number,
    userClient?: TelegramClient
): Promise<string | null> => {
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');

    if (!isImage && !isVideo) {
        console.log(`Skipping thumbnail for non-media file: ${fileName}`);
        return null;
    }

    let tempFilePath: string | null = null;

    try {
        console.log(`Generating thumbnail for ${fileName}...`);

        // Download file from Telegram to temp location
        tempFilePath = await downloadToTemp(messageId, fileName, userClient);

        // Generate thumbnail based on file type
        let thumbnailBuffer: Buffer;
        if (isImage) {
            thumbnailBuffer = await generateImageThumbnail(tempFilePath);
        } else {
            // For videos, we'll use sharp to create a placeholder for now
            // If ffmpeg is available, use generateVideoThumbnail
            try {
                thumbnailBuffer = await generateVideoThumbnail(tempFilePath);
            } catch (err) {
                console.log('FFmpeg not available, using placeholder for video thumbnail');
                // Create a simple placeholder
                thumbnailBuffer = await sharp({
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
    } catch (error) {
        console.error(`Failed to generate thumbnail for ${fileName}:`, error);
        return null;
    } finally {
        // Clean up temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
    }
};

/**
 * Delete thumbnail from Cloudinary
 */
export const deleteThumbnailFromCloudinary = async (fileId: string): Promise<void> => {
    try {
        await cloudinary.uploader.destroy(`nimbus-thumbnails/${fileId}`);
        console.log(`Thumbnail deleted from Cloudinary: ${fileId}`);
    } catch (error) {
        console.error(`Failed to delete thumbnail from Cloudinary:`, error);
    }
};

export default cloudinary;