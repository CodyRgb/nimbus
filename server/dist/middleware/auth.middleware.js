"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
/**
 * Middleware to protect routes by verifying JWT tokens
 * Extracts token from Authorization header, verifies it, and attaches user to request
 */
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
    try {
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Get user from token and exclude password
        req.user = await User_model_1.default.findById(decoded.id).select('-password');
        if (!req.user) {
            res.status(401).json({ message: 'Not authorized, user not found' });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};
exports.protect = protect;
