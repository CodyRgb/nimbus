"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const file_controller_1 = require("../controllers/file.controller");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
// Configure Multer for temp storage
const uploadDir = path_1.default.join(__dirname, '../../uploads_temp');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Keep original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit for now (multer limit)
});
router.post('/upload', auth_middleware_1.protect, upload.array('files'), file_controller_1.uploadFile);
router.post('/folders', auth_middleware_1.protect, file_controller_1.createFolder);
router.get('/folders', auth_middleware_1.protect, file_controller_1.getFolders);
router.get('/folders/:parentId', auth_middleware_1.protect, file_controller_1.getFolders);
router.get('/', auth_middleware_1.protect, file_controller_1.getFiles);
router.get('/:id/thumbnail', auth_middleware_1.protect, file_controller_1.getThumbnail);
router.get('/:id/preview', auth_middleware_1.protect, file_controller_1.previewFile);
router.get('/:id/download', auth_middleware_1.protect, file_controller_1.downloadFile);
router.delete('/:id', auth_middleware_1.protect, file_controller_1.deleteFile);
router.post('/bulk-download', auth_middleware_1.protect, file_controller_1.bulkDownloadFiles);
router.post('/bulk-delete', auth_middleware_1.protect, file_controller_1.bulkDeleteFiles);
router.get('/storage', auth_middleware_1.protect, file_controller_1.getStorageStats);
router.patch('/:id/favorite', auth_middleware_1.protect, file_controller_1.toggleFavorite);
router.get('/favorites', auth_middleware_1.protect, file_controller_1.getFavoriteFiles);
router.put('/:id/rename', auth_middleware_1.protect, file_controller_1.renameFile);
exports.default = router;
