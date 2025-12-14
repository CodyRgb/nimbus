"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const telegram_controller_1 = require("../controllers/telegram.controller");
const router = (0, express_1.Router)();
router.post('/connect', auth_middleware_1.protect, telegram_controller_1.connectTelegram);
router.post('/verify', auth_middleware_1.protect, telegram_controller_1.verifyTelegram);
exports.default = router;
