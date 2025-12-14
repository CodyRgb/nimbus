import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';



/**
 * Middleware to protect routes by verifying JWT tokens
 * Extracts token from Authorization header, verifies it, and attaches user to request
 */
export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    let token: string | undefined;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }

    try {
        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as { id: string };

        // Get user from token and exclude password
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            res.status(401).json({ message: 'Not authorized, user not found' });
            return;
        }

        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};
