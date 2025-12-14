"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessageWithClient = exports.downloadFileFromTelegramWithClient = exports.uploadFileToTelegramWithClient = exports.completeLogin = exports.sendLoginCode = exports.getUserClient = exports.deleteMessage = exports.getFileLink = exports.downloadFileFromTelegram = exports.uploadFileToTelegram = exports.connectTelegram = exports.client = void 0;
const telegram_1 = require("telegram");
const sessions_1 = require("telegram/sessions");
const telegram_2 = require("telegram");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";
const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const channelIdStr = process.env.TELEGRAM_CHANNEL_ID || "";
const SESSION_FILE_PATH = path_1.default.join(process.cwd(), "bot_session.txt");
// Helper to parse channel ID
const getChannelId = () => {
    if (/^-?\d+$/.test(channelIdStr)) {
        return BigInt(channelIdStr);
    }
    return channelIdStr;
};
const channelId = getChannelId();
if (!apiId || !apiHash || !botToken || !channelIdStr) {
    throw new Error("Missing Telegram credentials in .env file");
}
// Simple Queue for Rate Limiting (Equivalent to PQueue with concurrency 1 for auth, higher for generic)
class PromiseQueue {
    constructor(concurrency = 1) {
        this.queue = [];
        this.pendingPromise = false;
        this.concurrency = 1;
        this.running = 0;
        this.concurrency = concurrency;
    }
    add(generator) {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    resolve(await generator());
                }
                catch (error) {
                    reject(error);
                }
            });
            this.next();
        });
    }
    next() {
        if (this.running >= this.concurrency || this.queue.length === 0) {
            return;
        }
        const task = this.queue.shift();
        if (task) {
            this.running++;
            task().finally(() => {
                this.running--;
                this.next();
            });
        }
    }
}
// Queue for heavy operations
const requestQueue = new PromiseQueue(20); // 20 concurrent requests max
// Retry utility with exponential backoff
async function retryWithBackoff(operation, maxRetries = env_1.env.TELEGRAM_MAX_RETRIES, baseDelay = env_1.env.TELEGRAM_RETRY_DELAY, operationName = 'operation') {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                logger_1.logger.info(`[Telegram] Retry attempt ${attempt}/${maxRetries} for ${operationName}`);
            }
            return await operation();
        }
        catch (error) {
            lastError = error;
            // Don't retry on certain errors
            if (error.code === 406 || error.message?.includes('AUTH_KEY_DUPLICATED')) {
                logger_1.logger.error(`[Telegram] Non-retryable error for ${operationName}:`, error.message);
                throw error;
            }
            // Check if we should retry
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
                logger_1.logger.warn(`[Telegram] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    logger_1.logger.error(`[Telegram] ${operationName} failed after ${maxRetries + 1} attempts`);
    throw lastError;
}
// User Client Connection Pool
class UserClientPool {
    constructor() {
        this.clients = new Map();
        this.maxSize = env_1.env.TELEGRAM_CONNECTION_POOL_SIZE;
        // Cleanup idle connections every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanupIdleConnections(), 300000);
    }
    static getInstance() {
        if (!UserClientPool.instance) {
            UserClientPool.instance = new UserClientPool();
        }
        return UserClientPool.instance;
    }
    async getClient(session) {
        const sessionKey = session.substring(0, 20); // Use first 20 chars as key
        // Check if we have an active client
        const cached = this.clients.get(sessionKey);
        if (cached && cached.client.connected) {
            cached.lastUsed = Date.now();
            logger_1.logger.debug(`[Telegram] Reusing cached user client`);
            return cached.client;
        }
        // Create new client
        logger_1.logger.info(`[Telegram] Creating new user client connection`);
        const client = await this.createClient(session);
        // Add to pool (remove oldest if at capacity)
        if (this.clients.size >= this.maxSize) {
            this.removeOldestClient();
        }
        this.clients.set(sessionKey, { client, lastUsed: Date.now() });
        return client;
    }
    async createClient(session) {
        return retryWithBackoff(async () => {
            const stringSession = new sessions_1.StringSession(session);
            const userClient = new telegram_1.TelegramClient(stringSession, apiId, apiHash, {
                connectionRetries: env_1.env.TELEGRAM_CONNECTION_RETRIES,
                useWSS: env_1.env.TELEGRAM_USE_WSS_FALLBACK,
                timeout: env_1.env.TELEGRAM_CONNECTION_TIMEOUT,
                autoReconnect: true,
                floodSleepThreshold: 60,
                requestRetries: 3,
            });
            await userClient.connect();
            // Verify connection
            await userClient.getMe();
            logger_1.logger.info(`[Telegram] User client connected successfully`);
            return userClient;
        }, env_1.env.TELEGRAM_MAX_RETRIES, env_1.env.TELEGRAM_RETRY_DELAY, 'User client connection');
    }
    removeOldestClient() {
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [key, value] of this.clients.entries()) {
            if (value.lastUsed < oldestTime) {
                oldestTime = value.lastUsed;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            const client = this.clients.get(oldestKey);
            if (client) {
                client.client.disconnect().catch(() => { });
                this.clients.delete(oldestKey);
                logger_1.logger.debug(`[Telegram] Removed oldest client from pool`);
            }
        }
    }
    cleanupIdleConnections() {
        const now = Date.now();
        const maxIdleTime = 300000; // 5 minutes
        for (const [key, value] of this.clients.entries()) {
            if (now - value.lastUsed > maxIdleTime) {
                value.client.disconnect().catch(() => { });
                this.clients.delete(key);
                logger_1.logger.debug(`[Telegram] Cleaned up idle client connection`);
            }
        }
    }
    async disconnectAll() {
        for (const [key, value] of this.clients.entries()) {
            await value.client.disconnect().catch(() => { });
        }
        this.clients.clear();
        clearInterval(this.cleanupInterval);
    }
}
class TelegramService {
    constructor() {
        this.client = null;
        this.connecting = null;
        this.healthCheckInterval = null;
        this.reconnecting = false;
        this.startHealthCheck();
    }
    static getInstance() {
        if (!TelegramService.instance) {
            TelegramService.instance = new TelegramService();
        }
        return TelegramService.instance;
    }
    startHealthCheck() {
        // Periodic health check
        this.healthCheckInterval = setInterval(async () => {
            if (this.client && !this.reconnecting) {
                try {
                    if (!this.client.connected) {
                        logger_1.logger.warn('[Telegram] Health check failed: Client disconnected. Attempting reconnection...');
                        await this.reconnect();
                    }
                }
                catch (error) {
                    logger_1.logger.error('[Telegram] Health check error:', error);
                }
            }
        }, env_1.env.TELEGRAM_HEALTH_CHECK_INTERVAL);
    }
    async reconnect() {
        if (this.reconnecting) {
            logger_1.logger.debug('[Telegram] Reconnection already in progress');
            return;
        }
        this.reconnecting = true;
        try {
            logger_1.logger.info('[Telegram] Attempting to reconnect...');
            if (this.client) {
                try {
                    await this.client.disconnect();
                }
                catch (e) {
                    // Ignore disconnect errors
                }
            }
            this.client = null;
            await this.connect();
            logger_1.logger.info('[Telegram] Reconnection successful');
        }
        catch (error) {
            logger_1.logger.error('[Telegram] Reconnection failed:', error);
            throw error;
        }
        finally {
            this.reconnecting = false;
        }
    }
    async connect() {
        if (this.client?.connected) {
            return this.client;
        }
        if (this.connecting) {
            await this.connecting;
            if (this.client?.connected)
                return this.client;
        }
        this.connecting = (async () => {
            logger_1.logger.info("[Telegram] Initializing client connection...");
            let stringSession = new sessions_1.StringSession("");
            let sessionLoaded = false;
            // 1. Try to load existing session
            try {
                await promises_1.default.access(SESSION_FILE_PATH);
                const savedSession = await promises_1.default.readFile(SESSION_FILE_PATH, "utf-8");
                if (savedSession) {
                    stringSession = new sessions_1.StringSession(savedSession.trim());
                    sessionLoaded = true;
                    logger_1.logger.info("[Telegram] Loaded existing session from disk.");
                }
            }
            catch (err) {
                logger_1.logger.info("[Telegram] No existing session found. A new login will be performed.");
            }
            // 2. Initialize Client with enhanced options
            const client = new telegram_1.TelegramClient(stringSession, apiId, apiHash, {
                connectionRetries: env_1.env.TELEGRAM_CONNECTION_RETRIES,
                useWSS: env_1.env.TELEGRAM_USE_WSS_FALLBACK,
                timeout: env_1.env.TELEGRAM_CONNECTION_TIMEOUT,
                autoReconnect: true,
                floodSleepThreshold: 60,
                requestRetries: 3,
            });
            // 3. Connect/Login with retry
            try {
                await retryWithBackoff(async () => {
                    if (!sessionLoaded) {
                        await client.start({
                            botAuthToken: botToken,
                        });
                        // Save the new session
                        const sessionStr = client.session.save();
                        await promises_1.default.writeFile(SESSION_FILE_PATH, sessionStr);
                        logger_1.logger.info("[Telegram] New session created and saved to disk.");
                    }
                    else {
                        await client.connect();
                    }
                    // 4. Verify access
                    await client.getEntity(channelId);
                    logger_1.logger.info("[Telegram] Successfully connected and verified channel access!");
                }, env_1.env.TELEGRAM_MAX_RETRIES, env_1.env.TELEGRAM_RETRY_DELAY, 'Bot client connection');
                this.client = client;
            }
            catch (error) {
                logger_1.logger.error("[Telegram] Connection failed:", error);
                if (error.seconds) {
                    logger_1.logger.error(`[Telegram] FATAL: FloodWait detected. You must wait ${error.seconds} seconds before restarting.`);
                }
                if (error.code === 406 || error.message?.includes('AUTH_KEY_DUPLICATED')) {
                    logger_1.logger.error("[Telegram] Session invalid (AUTH_KEY_DUPLICATED). Deleting session file...");
                    try {
                        await promises_1.default.unlink(SESSION_FILE_PATH);
                        logger_1.logger.info("[Telegram] Session file deleted. Please restart the server.");
                    }
                    catch (unlinkErr) {
                        logger_1.logger.error("[Telegram] Failed to delete session file:", unlinkErr);
                    }
                }
                this.client = null;
                throw error;
            }
            finally {
                this.connecting = null;
            }
        })();
        await this.connecting;
        if (!this.client)
            throw new Error("Failed to initialize Telegram client");
        return this.client;
    }
    async ensureConnected() {
        if (!this.client || !this.client.connected) {
            logger_1.logger.warn('[Telegram] Client not connected, reconnecting...');
            await this.reconnect();
        }
        return this.client;
    }
    async disconnect() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        if (this.client) {
            await this.client.disconnect();
            this.client = null;
        }
    }
}
const connectTelegram = async () => {
    const service = TelegramService.getInstance();
    exports.client = await service.connect();
};
exports.connectTelegram = connectTelegram;
const uploadFileToTelegram = async (filePath, filename, mimeType) => {
    const service = TelegramService.getInstance();
    return retryWithBackoff(async () => {
        const activeClient = await service.ensureConnected();
        return requestQueue.add(async () => {
            logger_1.logger.info(`[Telegram] Uploading ${filename}...`);
            const result = await activeClient.sendFile(channelId, {
                file: filePath,
                forceDocument: true,
                attributes: [
                    new telegram_1.Api.DocumentAttributeFilename({ fileName: filename }),
                ],
                caption: `File: ${filename}\nMime: ${mimeType}`,
                workers: 3,
            });
            logger_1.logger.info(`[Telegram] Upload successful: ${filename}`);
            return {
                messageId: result.id,
                media: result.media,
            };
        });
    }, env_1.env.TELEGRAM_MAX_RETRIES, env_1.env.TELEGRAM_RETRY_DELAY, `Upload ${filename}`);
};
exports.uploadFileToTelegram = uploadFileToTelegram;
const downloadFileFromTelegram = async (messageId) => {
    const service = TelegramService.getInstance();
    return retryWithBackoff(async () => {
        const activeClient = await service.ensureConnected();
        logger_1.logger.info(`[Telegram] Downloading message ${messageId}...`);
        const messages = await activeClient.getMessages(channelId, { ids: [messageId] });
        if (!messages || messages.length === 0) {
            throw new Error("Message not found");
        }
        const message = messages[0];
        if (!message.media || message.media instanceof telegram_1.Api.MessageMediaEmpty) {
            throw new Error("Message does not contain any media");
        }
        return activeClient.iterDownload({
            file: message.media,
            requestSize: 512 * 1024,
        });
    }, env_1.env.TELEGRAM_MAX_RETRIES, env_1.env.TELEGRAM_RETRY_DELAY, `Download message ${messageId}`);
};
exports.downloadFileFromTelegram = downloadFileFromTelegram;
const getFileLink = async (messageId) => {
    return null;
};
exports.getFileLink = getFileLink;
const deleteMessage = async (messageId) => {
    const service = TelegramService.getInstance();
    return retryWithBackoff(async () => {
        const activeClient = await service.ensureConnected();
        await activeClient.deleteMessages(channelId, [messageId], { revoke: true });
        logger_1.logger.info(`[Telegram] Deleted message ${messageId}`);
    }, env_1.env.TELEGRAM_MAX_RETRIES, env_1.env.TELEGRAM_RETRY_DELAY, `Delete message ${messageId}`);
};
exports.deleteMessage = deleteMessage;
// --- User Client & Auth Helpers (Enhanced) ---
const getUserClient = async (session) => {
    const pool = UserClientPool.getInstance();
    return pool.getClient(session);
};
exports.getUserClient = getUserClient;
const sendLoginCode = async (phoneNumber) => {
    return retryWithBackoff(async () => {
        const tempClient = new telegram_1.TelegramClient(new sessions_1.StringSession(""), apiId, apiHash, {
            connectionRetries: env_1.env.TELEGRAM_CONNECTION_RETRIES,
        });
        await tempClient.connect();
        const { phoneCodeHash } = await tempClient.sendCode({
            apiId,
            apiHash,
        }, phoneNumber);
        const session = tempClient.session.save();
        return { phoneCodeHash, session };
    }, env_1.env.TELEGRAM_MAX_RETRIES, env_1.env.TELEGRAM_RETRY_DELAY, 'Send login code');
};
exports.sendLoginCode = sendLoginCode;
const completeLogin = async (phoneNumber, code, phoneCodeHash, session, userPassword) => {
    return retryWithBackoff(async () => {
        const stringSession = new sessions_1.StringSession(session);
        const tempClient = new telegram_1.TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: env_1.env.TELEGRAM_CONNECTION_RETRIES,
        });
        await tempClient.connect();
        try {
            await tempClient.invoke(new telegram_1.Api.auth.SignIn({
                phoneNumber,
                phoneCodeHash,
                phoneCode: code,
            }));
        }
        catch (e) {
            if (e.message.includes("SESSION_PASSWORD_NEEDED") && userPassword) {
                const passwordSrpResult = await tempClient.invoke(new telegram_1.Api.account.GetPassword());
                const passwordHash = await telegram_2.password.computeCheck(passwordSrpResult, userPassword);
                await tempClient.invoke(new telegram_1.Api.auth.CheckPassword({
                    password: passwordHash,
                }));
            }
            else {
                throw e;
            }
        }
        return tempClient.session.save();
    }, env_1.env.TELEGRAM_MAX_RETRIES, env_1.env.TELEGRAM_RETRY_DELAY, 'Complete login');
};
exports.completeLogin = completeLogin;
const uploadFileToTelegramWithClient = async (clientToUse, filePath, filename, mimeType) => {
    return retryWithBackoff(async () => {
        // Ensure client is connected
        if (!clientToUse.connected) {
            logger_1.logger.warn(`[Telegram] User client disconnected, reconnecting...`);
            await clientToUse.connect();
        }
        logger_1.logger.info(`[Telegram] Uploading ${filename} to Telegram (User)...`);
        const result = await clientToUse.sendFile("me", {
            file: filePath,
            forceDocument: true,
            attributes: [
                new telegram_1.Api.DocumentAttributeFilename({ fileName: filename }),
            ],
            caption: `File: ${filename}\nMime: ${mimeType}`,
            workers: 3,
        });
        logger_1.logger.info(`[Telegram] Upload successful (User): ${filename}`);
        return {
            messageId: result.id,
            media: result.media,
        };
    }, env_1.env.TELEGRAM_MAX_RETRIES, env_1.env.TELEGRAM_RETRY_DELAY, `Upload ${filename} (User)`);
};
exports.uploadFileToTelegramWithClient = uploadFileToTelegramWithClient;
const downloadFileFromTelegramWithClient = async (clientToUse, messageId) => {
    return retryWithBackoff(async () => {
        // Ensure client is connected
        if (!clientToUse.connected) {
            logger_1.logger.warn(`[Telegram] User client disconnected, reconnecting...`);
            await clientToUse.connect();
        }
        logger_1.logger.info(`[Telegram] Downloading message ${messageId} (User)...`);
        const messages = await clientToUse.getMessages("me", { ids: [messageId] });
        if (!messages || messages.length === 0) {
            throw new Error("Message not found");
        }
        const message = messages[0];
        if (!message.media || message.media instanceof telegram_1.Api.MessageMediaEmpty) {
            throw new Error("Message does not contain any media");
        }
        return clientToUse.iterDownload({
            file: message.media,
            requestSize: 512 * 1024,
        });
    }, env_1.env.TELEGRAM_MAX_RETRIES, env_1.env.TELEGRAM_RETRY_DELAY, `Download message ${messageId} (User)`);
};
exports.downloadFileFromTelegramWithClient = downloadFileFromTelegramWithClient;
const deleteMessageWithClient = async (clientToUse, messageId) => {
    return retryWithBackoff(async () => {
        // Ensure client is connected
        if (!clientToUse.connected) {
            logger_1.logger.warn(`[Telegram] User client disconnected, reconnecting...`);
            await clientToUse.connect();
        }
        await clientToUse.deleteMessages("me", [messageId], { revoke: true });
        logger_1.logger.info(`[Telegram] Deleted message ${messageId} (User)`);
    }, env_1.env.TELEGRAM_MAX_RETRIES, env_1.env.TELEGRAM_RETRY_DELAY, `Delete message ${messageId} (User)`);
};
exports.deleteMessageWithClient = deleteMessageWithClient;
