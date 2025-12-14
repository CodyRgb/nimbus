"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFileFromAlbum = exports.addFilesToAlbum = exports.deleteAlbum = exports.updateAlbum = exports.getAlbum = exports.getAlbums = exports.createAlbum = void 0;
const Album_model_1 = __importDefault(require("../models/Album.model"));
const File_model_1 = __importDefault(require("../models/File.model"));
// Create a new album
const createAlbum = async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.user.id;
        const album = await Album_model_1.default.create({
            user: userId,
            name,
            description
        });
        res.status(201).json(album);
    }
    catch (error) {
        console.error('Error creating album:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.createAlbum = createAlbum;
// Get all albums for a user
const getAlbums = async (req, res) => {
    try {
        const userId = req.user.id;
        const albums = await Album_model_1.default.find({ user: userId }).sort({ createdAt: -1 });
        // Enhance albums with file count and cover image if not set
        const enhancedAlbums = await Promise.all(albums.map(async (album) => {
            const fileCount = await File_model_1.default.countDocuments({ albums: album._id });
            let coverImage = album.coverImage;
            if (!coverImage && fileCount > 0) {
                const firstFile = await File_model_1.default.findOne({ albums: album._id }).select('telegramFileId');
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
    }
    catch (error) {
        console.error('Error fetching albums:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAlbums = getAlbums;
// Get a single album with its files
const getAlbum = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const album = await Album_model_1.default.findOne({ _id: id, user: userId });
        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }
        const files = await File_model_1.default.find({ albums: id, user: userId }).sort({ uploadedAt: -1 });
        res.json({ album, files });
    }
    catch (error) {
        console.error('Error fetching album:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAlbum = getAlbum;
// Update album details
const updateAlbum = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const userId = req.user.id;
        const album = await Album_model_1.default.findOneAndUpdate({ _id: id, user: userId }, { name, description }, { new: true });
        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }
        res.json(album);
    }
    catch (error) {
        console.error('Error updating album:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateAlbum = updateAlbum;
// Delete an album
const deleteAlbum = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const album = await Album_model_1.default.findOneAndDelete({ _id: id, user: userId });
        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }
        // Remove album reference from files
        await File_model_1.default.updateMany({ albums: id }, { $pull: { albums: id } });
        res.json({ message: 'Album deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting album:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteAlbum = deleteAlbum;
// Add files to an album
const addFilesToAlbum = async (req, res) => {
    try {
        const { albumId } = req.params;
        const { fileIds } = req.body; // Array of file IDs
        const userId = req.user.id;
        const album = await Album_model_1.default.findOne({ _id: albumId, user: userId });
        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }
        await File_model_1.default.updateMany({ _id: { $in: fileIds }, user: userId }, { $addToSet: { albums: albumId } });
        res.json({ message: 'Files added to album successfully' });
    }
    catch (error) {
        console.error('Error adding files to album:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.addFilesToAlbum = addFilesToAlbum;
// Remove file from album
const removeFileFromAlbum = async (req, res) => {
    try {
        const { albumId, fileId } = req.params;
        const userId = req.user.id;
        const album = await Album_model_1.default.findOne({ _id: albumId, user: userId });
        if (!album) {
            return res.status(404).json({ message: 'Album not found' });
        }
        await File_model_1.default.updateOne({ _id: fileId, user: userId }, { $pull: { albums: albumId } });
        res.json({ message: 'File removed from album successfully' });
    }
    catch (error) {
        console.error('Error removing file from album:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.removeFileFromAlbum = removeFileFromAlbum;
