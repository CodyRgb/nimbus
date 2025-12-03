import mongoose, { Schema, Document } from 'mongoose';

export interface IAlbum extends Document {
    user: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    coverImage?: string; // URL or File ID
    createdAt: Date;
    updatedAt: Date;
}

const AlbumSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    coverImage: { type: String },
}, { timestamps: true });

export default (mongoose.models.Album as mongoose.Model<IAlbum>) || mongoose.model<IAlbum>('Album', AlbumSchema);
