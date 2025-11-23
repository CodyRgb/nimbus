import { Request, Response } from 'express';
import { sendLoginCode, completeLogin } from '../services/telegram.service';
import User from '../models/User.model';

export const connectTelegram = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            res.status(400).json({ message: 'Phone number is required' });
            return;
        }

        const { phoneCodeHash, session } = await sendLoginCode(phoneNumber);

        // We need to return phoneCodeHash and session to the frontend so they can be sent back with the code.
        // Session is needed because we need the same "client" context (or at least the session state) to complete the login.
        res.json({ message: 'Code sent', phoneCodeHash, session });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send code', error: (error as Error).message });
    }
};

export const verifyTelegram = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phoneNumber, code, phoneCodeHash, session, password } = req.body;
        const userId = req.user._id;

        if (!phoneNumber || !code || !phoneCodeHash || !session) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }

        const finalSession = await completeLogin(phoneNumber, code, phoneCodeHash, session, password);

        // Save session to user
        await User.findByIdAndUpdate(userId, { telegramSession: finalSession });

        res.json({ message: 'Telegram connected successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Verification failed', error: (error as Error).message });
    }
};
