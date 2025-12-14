"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const FileSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    folder: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Folder', default: null, index: true },
    albums: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Album' }],
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
    dateTaken: { type: Date, index: true },
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
exports.default = mongoose_1.default.models.File || mongoose_1.default.model('File', FileSchema);
