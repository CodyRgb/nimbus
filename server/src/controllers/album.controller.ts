import { Request, Response } from 'express';
import Album from '../models/Album.model';
import File from '../models/File.model';
import mongoose from 'mongoose';

// Create a new album
export const createAlbum = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const userId = (req as any).user.id;

        const album = await Album.create({
            user: userId,
            name,
            description
        });

        res.status(201).json(album);
    } catch (error) {
        console.error('Error creating album:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all albums for a user
export const getAlbums = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const albums = await Album.find({ user: userId }).sort({ createdAt: -1 });

        // Enhance albums with file count and cover image if not set
        const enhancedAlbums = await Promise.all(albums.map(async (album) => {
            const fileCount = await File.countDocuments({ albums: album._id });
            let coverImage = album.coverImage;

            if (!coverImage && fileCount > 0) {
                const firstFile = await File.findOne({ albums: album._id }).select('telegramFileId');
                if (firstFile) {
                    // This is a placeholder logic, ideally we serve a thumbnail URL
                    // For now, we might return null or handle it on frontend
                    coverImage = undefined;
                }
            }

            return {
                ...album.toObject(),
                fileCount,
                coverImage
            };
        }));

        res.json(enhancedAlbums);
    } catch (error) {
        console.error('Error fetching albums:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get a single album with its files
export const getAlbum = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const album = await Album.findOne({ _id: id, user: userId });

        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }

        const files = await File.find({ albums: id, user: userId }).sort({ uploadedAt: -1 });

        res.json({ album, files });
    } catch (error) {
        console.error('Error fetching album:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update album details
export const updateAlbum = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const userId = (req as any).user.id;

        const album = await Album.findOneAndUpdate(
            { _id: id, user: userId },
            { name, description },
            { new: true }
        );

        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }

        res.json(album);
    } catch (error) {
        console.error('Error updating album:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an album
export const deleteAlbum = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const album = await Album.findOneAndDelete({ _id: id, user: userId });

        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }

        // Remove album reference from files
        await File.updateMany(
            { albums: id },
            { $pull: { albums: id } }
        );

        res.json({ message: 'Album deleted successfully' });
    } catch (error) {
        console.error('Error deleting album:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add files to an album
export const addFilesToAlbum = async (req: Request, res: Response) => {
    try {
        const { albumId } = req.params;
        const { fileIds } = req.body; // Array of file IDs
        const userId = (req as any).user.id;

        const album = await Album.findOne({ _id: albumId, user: userId });
        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }

        await File.updateMany(
            { _id: { $in: fileIds }, user: userId },
            { $addToSet: { albums: albumId } }
        );

        res.json({ message: 'Files added to album successfully' });
    } catch (error) {
        console.error('Error adding files to album:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Remove file from album
export const removeFileFromAlbum = async (req: Request, res: Response) => {
    try {
        const { albumId, fileId } = req.params;
        const userId = (req as any).user.id;

        const album = await Album.findOne({ _id: albumId, user: userId });
        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }

        await File.updateOne(
            { _id: fileId, user: userId },
            { $pull: { albums: albumId } }
        );

        res.json({ message: 'File removed from album successfully' });
    } catch (error) {
        console.error('Error removing file from album:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
