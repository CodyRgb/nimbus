import mongoose from 'mongoose';
import dotenv from 'dotenv';
import File from '../models/File.model';
import User from '../models/User.model';
import { generateAndUploadThumbnail } from '../services/cloudinary.service';
import { getUserClient } from '../services/telegram.service';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

async function migrateThumbnails() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all files without thumbnails that are images or videos
        const files = await File.find({
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
                    const user = await User.findById(file.user).select('+telegramSession');
                    if (!user || !user.telegramSession) {
                        console.log(`  ⚠ Skipping - User session not available`);
                        failed++;
                        continue;
                    }
                    userClient = await getUserClient(user.telegramSession);
                }

                // Generate and upload thumbnail
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
                    console.log(`  ✓ Thumbnail generated: ${thumbnailUrl}`);
                    succeeded++;
                } else {
                    console.log(`  ✗ Failed to generate thumbnail`);
                    failed++;
                }
            } catch (error) {
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

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

migrateThumbnails();