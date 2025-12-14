"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const album_controller_1 = require("../controllers/album.controller");
const router = express_1.default.Router();
router.route('/')
    .post(auth_middleware_1.protect, album_controller_1.createAlbum)
    .get(auth_middleware_1.protect, album_controller_1.getAlbums);
router.route('/:id')
    .get(auth_middleware_1.protect, album_controller_1.getAlbum)
    .put(auth_middleware_1.protect, album_controller_1.updateAlbum)
    .delete(auth_middleware_1.protect, album_controller_1.deleteAlbum);
router.route('/:albumId/files')
    .post(auth_middleware_1.protect, album_controller_1.addFilesToAlbum);
router.route('/:albumId/files/:fileId')
    .delete(auth_middleware_1.protect, album_controller_1.removeFileFromAlbum);
exports.default = router;
