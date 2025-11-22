import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
    user: mongoose.Types.ObjectId;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    telegramFileId: string;
    telegramMessageId: number;
    uploadedAt: Date;
    lastAccessed: Date;
    downloadCount: number;
}

const FileSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    telegramFileId: { type: String, required: true },
    telegramMessageId: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    lastAccessed: { type: Date, default: Date.now },
    downloadCount: { type: Number, default: 0 },
});

export default (mongoose.models.File as mongoose.Model<IFile>) || mongoose.model<IFile>('File', FileSchema);
