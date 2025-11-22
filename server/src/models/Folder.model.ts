import mongoose, { Schema, Document } from 'mongoose';

export interface IFolder extends Document {
    user: mongoose.Types.ObjectId;
    name: string;
    parent: mongoose.Types.ObjectId | null;
    path: string[]; // Breadcrumb path names
    createdAt: Date;
}

const FolderSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    path: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
});

export default (mongoose.models.Folder as mongoose.Model<IFolder>) || mongoose.model<IFolder>('Folder', FolderSchema);
