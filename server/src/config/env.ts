import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),

    // Database
    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

    // Authentication
    JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),
    JWT_EXPIRES_IN: z.string().default('7d'),

    // Telegram
    TELEGRAM_API_ID: z.string().min(1, 'TELEGRAM_API_ID is required'),
    TELEGRAM_API_HASH: z.string().min(1, 'TELEGRAM_API_HASH is required'),
    TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
    TELEGRAM_SESSION: z.string().optional(),
    TELEGRAM_OWNER_ID: z.string().optional(),
    TELEGRAM_CHANNEL_ID: z.string().optional(),
    
    // Telegram Connection Settings
    TELEGRAM_MAX_RETRIES: z.string().default('3').transform((val) => parseInt(val, 10)),
    TELEGRAM_RETRY_DELAY: z.string().default('1000').transform((val) => parseInt(val, 10)),
    TELEGRAM_CONNECTION_RETRIES: z.string().default('25').transform((val) => parseInt(val, 10)),
    TELEGRAM_CONNECTION_TIMEOUT: z.string().default('600').transform((val) => parseInt(val, 10)),
    TELEGRAM_USE_WSS_FALLBACK: z.string().default('true').transform((val) => val === 'true'),
    TELEGRAM_CONNECTION_POOL_SIZE: z.string().default('5').transform((val) => parseInt(val, 10)),
    TELEGRAM_HEALTH_CHECK_INTERVAL: z.string().default('60000').transform((val) => parseInt(val, 10)),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().default('6379').transform((val) => parseInt(val, 10)),
    REDIS_PASSWORD: z.string().optional(),

    // Security
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const parseEnv = () => {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
        process.exit(1);
    }

    return parsed.data;
};

export const env = parseEnv();
