"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000').transform((val) => parseInt(val, 10)),
    // Database
    MONGO_URI: zod_1.z.string().min(1, 'MONGO_URI is required'),
    // Authentication
    JWT_SECRET: zod_1.z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    // Telegram
    TELEGRAM_API_ID: zod_1.z.string().min(1, 'TELEGRAM_API_ID is required'),
    TELEGRAM_API_HASH: zod_1.z.string().min(1, 'TELEGRAM_API_HASH is required'),
    TELEGRAM_BOT_TOKEN: zod_1.z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
    TELEGRAM_SESSION: zod_1.z.string().optional(),
    TELEGRAM_OWNER_ID: zod_1.z.string().optional(),
    TELEGRAM_CHANNEL_ID: zod_1.z.string().optional(),
    // Telegram Connection Settings
    TELEGRAM_MAX_RETRIES: zod_1.z.string().default('3').transform((val) => parseInt(val, 10)),
    TELEGRAM_RETRY_DELAY: zod_1.z.string().default('1000').transform((val) => parseInt(val, 10)),
    TELEGRAM_CONNECTION_RETRIES: zod_1.z.string().default('25').transform((val) => parseInt(val, 10)),
    TELEGRAM_CONNECTION_TIMEOUT: zod_1.z.string().default('600').transform((val) => parseInt(val, 10)),
    TELEGRAM_USE_WSS_FALLBACK: zod_1.z.string().default('true').transform((val) => val === 'true'),
    TELEGRAM_CONNECTION_POOL_SIZE: zod_1.z.string().default('5').transform((val) => parseInt(val, 10)),
    TELEGRAM_HEALTH_CHECK_INTERVAL: zod_1.z.string().default('60000').transform((val) => parseInt(val, 10)),
    // Redis
    REDIS_HOST: zod_1.z.string().default('localhost'),
    REDIS_PORT: zod_1.z.string().default('6379').transform((val) => parseInt(val, 10)),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    // Security
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
});
const parseEnv = () => {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
        process.exit(1);
    }
    return parsed.data;
};
exports.env = parseEnv();
