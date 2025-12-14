"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const File_model_1 = __importDefault(require("../models/File.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
const cloudinary_service_1 = require("../services/cloudinary.service");
const telegram_service_1 = require("../services/telegram.service");
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || '';
async function migrateThumbnails() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        // Find all files without thumbnails that are images or videos
        const files = await File_model_1.default.find({
            thumbnailUrl: { $exists: false },
            $or: [
                { mimeType: { $regex: '^image/' } },
                { mimeType: { $regex: '^video/' } }
            ]
        }).populate('user');
        console.log(`Found ${files.length} files without thumbnails`);
        let processed = 0;
        let succeeded = 0;
        let failed = 0;
        for (const file of files) {
            processed++;
            console.log(`\n[${processed}/${files.length}] Processing: ${file.originalName}`);
            try {
                let userClient;
                // Get user client if file uses user storage
                if (file.storageType === 'user') {
                    const user = await User_model_1.default.findById(file.user).select('+telegramSession');
                    if (!user || !user.telegramSession) {
                        console.log(`  ⚠ Skipping - User session not available`);
                        failed++;
                        continue;
                    }
                    userClient = await (0, telegram_service_1.getUserClient)(user.telegramSession);
                }
                // Generate and upload thumbnail
                const thumbnailUrl = await (0, cloudinary_service_1.generateAndUploadThumbnail)(file._id.toString(), file.originalName, file.mimeType, file.telegramMessageId, userClient);
                if (thumbnailUrl) {
                    file.thumbnailUrl = thumbnailUrl;
                    await file.save();
                    console.log(`  ✓ Thumbnail generated: ${thumbnailUrl}`);
                    succeeded++;
                }
                else {
                    console.log(`  ✗ Failed to generate thumbnail`);
                    failed++;
                }
            }
            catch (error) {
                console.error(`  ✗ Error:`, error);
                failed++;
            }
            // Add a small delay to avoid overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('\n=== Migration Complete ===');
        console.log(`Total files: ${files.length}`);
        console.log(`Succeeded: ${succeeded}`);
        console.log(`Failed: ${failed}`);
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration failed:', error);
        await mongoose_1.default.disconnect();
        process.exit(1);
    }
}
migrateThumbnails();
