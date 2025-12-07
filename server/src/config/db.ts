import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(env.MONGO_URI);
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Error: ${error.message}`);
        } else {
            logger.error('An unknown error occurred');
        }
        process.exit(1);
    }
};

export default connectDB;
