"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTelegram = exports.connectTelegram = void 0;
const telegram_service_1 = require("../services/telegram.service");
const User_model_1 = __importDefault(require("../models/User.model"));
const connectTelegram = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            res.status(400).json({ message: 'Phone number is required' });
            return;
        }
        const { phoneCodeHash, session } = await (0, telegram_service_1.sendLoginCode)(phoneNumber);
        // We need to return phoneCodeHash and session to the frontend so they can be sent back with the code.
        // Session is needed because we need the same "client" context (or at least the session state) to complete the login.
        res.json({ message: 'Code sent', phoneCodeHash, session });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send code', error: error.message });
    }
};
exports.connectTelegram = connectTelegram;
const verifyTelegram = async (req, res) => {
    try {
        const { phoneNumber, code, phoneCodeHash, session, password } = req.body;
        const userId = req.user._id;
        if (!phoneNumber || !code || !phoneCodeHash || !session) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const finalSession = await (0, telegram_service_1.completeLogin)(phoneNumber, code, phoneCodeHash, session, password);
        // Save session to user
        await User_model_1.default.findByIdAndUpdate(userId, { telegramSession: finalSession });
        res.json({ message: 'Telegram connected successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Verification failed', error: error.message });
    }
};
exports.verifyTelegram = verifyTelegram;
