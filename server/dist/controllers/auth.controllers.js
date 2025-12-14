"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = __importDefault(require("../models/User.model"));
// Generate JWT Token
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ message: 'Please add all fields' });
            return;
        }
        // Check if user exists
        const userExists = await User_model_1.default.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Create user
        const user = await User_model_1.default.create({
            name,
            email,
            password: hashedPassword,
        });
        if (user) {
            const token = generateToken(user.id);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                sameSite: 'strict',
                path: '/'
            });
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: token,
            });
        }
        else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.register = register;
// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check for user email
        const user = await User_model_1.default.findOne({ email });
        if (user && (await bcryptjs_1.default.compare(password, user.password))) {
            const token = generateToken(user.id);
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                sameSite: 'strict',
                path: '/'
            });
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: token,
                message: 'Logged in !!!'
            });
        }
        else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.login = login;
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    });
    res.status(200).json({ message: 'Logged out successfully' });
};
exports.logout = logout;
