import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
    user: mongoose.Types.ObjectId;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    telegramFileId: string;
    telegramUniqueId?: string;
    telegramMessageId: number;
    uploadedAt: Date;
    lastAccessed: Date;
    downloadCount: number;
    folder: mongoose.Types.ObjectId | null;
    albums: mongoose.Types.ObjectId[];
    storageType: 'bot' | 'user';
    isFavorite: boolean;
    thumbnailUrl?: string;
    thumbnailTelegramId?: string;
    thumbnailSmall?: string;
    thumbnailMedium?: string;
    thumbnailLarge?: string;
    dimensions?: { width: number; height: number };
    cacheKey?: string;
    etag: string;
}

const FileSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    folder: { type: Schema.Types.ObjectId, ref: 'Folder', default: null, index: true },
    albums: [{ type: Schema.Types.ObjectId, ref: 'Album' }],
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true, index: true },
    size: { type: Number, required: true },
    telegramFileId: { type: String, required: true, index: true },
    telegramUniqueId: { type: String, index: true },
    telegramMessageId: { type: Number, required: true },
    storageType: { type: String, enum: ['bot', 'user'], default: 'bot' },
    isFavorite: { type: Boolean, default: false, index: true },
    thumbnailUrl: { type: String, default: null },
    thumbnailTelegramId: { type: String },
    thumbnailSmall: { type: String },
    thumbnailMedium: { type: String },
    thumbnailLarge: { type: String },
    dimensions: {
        width: { type: Number },
        height: { type: Number }
    },
    cacheKey: { type: String, index: true },
    uploadedAt: { type: Date, default: Date.now, index: true },
    lastAccessed: { type: Date, default: Date.now, index: true },
    downloadCount: { type: Number, default: 0 },
});

// Generate ETag before saving
FileSchema.pre('save', function (next) {
    if (this.isModified()) {
        const crypto = require('crypto');
        this.etag = crypto
            .createHash('md5')
            .update(`${this._id}-${this.updatedAt || Date.now()}`)
            .digest('hex');
    }
    next();
});

export default (mongoose.models.File as mongoose.Model<IFile>) || mongoose.model<IFile>('File', FileSchema);
