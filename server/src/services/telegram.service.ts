import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { password } from "telegram";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { env } from "../config/env";
import { logger } from "../utils/logger";


const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";
const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const channelIdStr = process.env.TELEGRAM_CHANNEL_ID || "";
const SESSION_FILE_PATH = path.join(process.cwd(), "bot_session.txt");

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
    private queue: (() => Promise<any>)[] = [];
    private pendingPromise: boolean = false;
    private concurrency: number = 1;
    private running: number = 0;

    constructor(concurrency: number = 1) {
        this.concurrency = concurrency;
    }

    add<T>(generator: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    resolve(await generator());
                } catch (error) {
                    reject(error);
                }
            });
            this.next();
        });
    }

    private next() {
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
async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = env.TELEGRAM_MAX_RETRIES,
    baseDelay: number = env.TELEGRAM_RETRY_DELAY,
    operationName: string = 'operation'
): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                logger.info(`[Telegram] Retry attempt ${attempt}/${maxRetries} for ${operationName}`);
            }
            return await operation();
        } catch (error: any) {
            lastError = error;
            
            // Don't retry on certain errors
            if (error.code === 406 || error.message?.includes('AUTH_KEY_DUPLICATED')) {
                logger.error(`[Telegram] Non-retryable error for ${operationName}:`, error.message);
                throw error;
            }
            
            // Check if we should retry
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
                logger.warn(`[Telegram] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    logger.error(`[Telegram] ${operationName} failed after ${maxRetries + 1} attempts`);
    throw lastError;
}

// User Client Connection Pool
class UserClientPool {
    private static instance: UserClientPool;
    private clients: Map<string, { client: TelegramClient; lastUsed: number }> = new Map();
    private maxSize: number = env.TELEGRAM_CONNECTION_POOL_SIZE;
    private cleanupInterval: NodeJS.Timeout;

    private constructor() {
        // Cleanup idle connections every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanupIdleConnections(), 300000);
    }

    public static getInstance(): UserClientPool {
        if (!UserClientPool.instance) {
            UserClientPool.instance = new UserClientPool();
        }
        return UserClientPool.instance;
    }

    async getClient(session: string): Promise<TelegramClient> {
        const sessionKey = session.substring(0, 20); // Use first 20 chars as key
        
        // Check if we have an active client
        const cached = this.clients.get(sessionKey);
        if (cached && cached.client.connected) {
            cached.lastUsed = Date.now();
            logger.debug(`[Telegram] Reusing cached user client`);
            return cached.client;
        }

        // Create new client
        logger.info(`[Telegram] Creating new user client connection`);
        const client = await this.createClient(session);
        
        // Add to pool (remove oldest if at capacity)
        if (this.clients.size >= this.maxSize) {
            this.removeOldestClient();
        }
        
        this.clients.set(sessionKey, { client, lastUsed: Date.now() });
        return client;
    }

    private async createClient(session: string): Promise<TelegramClient> {
        return retryWithBackoff(async () => {
            const stringSession = new StringSession(session);
            const userClient = new TelegramClient(stringSession, apiId, apiHash, {
                connectionRetries: env.TELEGRAM_CONNECTION_RETRIES,
                useWSS: env.TELEGRAM_USE_WSS_FALLBACK,
                timeout: env.TELEGRAM_CONNECTION_TIMEOUT,
                autoReconnect: true,
                floodSleepThreshold: 60,
                requestRetries: 3,
            });
            
            await userClient.connect();
            
            // Verify connection
            await userClient.getMe();
            
            logger.info(`[Telegram] User client connected successfully`);
            return userClient;
        }, env.TELEGRAM_MAX_RETRIES, env.TELEGRAM_RETRY_DELAY, 'User client connection');
    }

    private removeOldestClient() {
        let oldestKey: string | null = null;
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
                client.client.disconnect().catch(() => {});
                this.clients.delete(oldestKey);
                logger.debug(`[Telegram] Removed oldest client from pool`);
            }
        }
    }

    private cleanupIdleConnections() {
        const now = Date.now();
        const maxIdleTime = 300000; // 5 minutes
        
        for (const [key, value] of this.clients.entries()) {
            if (now - value.lastUsed > maxIdleTime) {
                value.client.disconnect().catch(() => {});
                this.clients.delete(key);
                logger.debug(`[Telegram] Cleaned up idle client connection`);
            }
        }
    }

    async disconnectAll() {
        for (const [key, value] of this.clients.entries()) {
            await value.client.disconnect().catch(() => {});
        }
        this.clients.clear();
        clearInterval(this.cleanupInterval);
    }
}

class TelegramService {
    private static instance: TelegramService;
    public client: TelegramClient | null = null;
    private connecting: Promise<void> | null = null;
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private reconnecting: boolean = false;

    private constructor() {
        this.startHealthCheck();
    }

    public static getInstance(): TelegramService {
        if (!TelegramService.instance) {
            TelegramService.instance = new TelegramService();
        }
        return TelegramService.instance;
    }

    private startHealthCheck() {
        // Periodic health check
        this.healthCheckInterval = setInterval(async () => {
            if (this.client && !this.reconnecting) {
                try {
                    if (!this.client.connected) {
                        logger.warn('[Telegram] Health check failed: Client disconnected. Attempting reconnection...');
                        await this.reconnect();
                    }
                } catch (error) {
                    logger.error('[Telegram] Health check error:', error);
                }
            }
        }, env.TELEGRAM_HEALTH_CHECK_INTERVAL);
    }

    private async reconnect() {
        if (this.reconnecting) {
            logger.debug('[Telegram] Reconnection already in progress');
            return;
        }

        this.reconnecting = true;
        try {
            logger.info('[Telegram] Attempting to reconnect...');
            
            if (this.client) {
                try {
                    await this.client.disconnect();
                } catch (e) {
                    // Ignore disconnect errors
                }
            }

            this.client = null;
            await this.connect();
            
            logger.info('[Telegram] Reconnection successful');
        } catch (error) {
            logger.error('[Telegram] Reconnection failed:', error);
            throw error;
        } finally {
            this.reconnecting = false;
        }
    }

    public async connect(): Promise<TelegramClient> {
        if (this.client?.connected) {
            return this.client;
        }

        if (this.connecting) {
            await this.connecting;
            if (this.client?.connected) return this.client;
        }

        this.connecting = (async () => {
            logger.info("[Telegram] Initializing client connection...");

            let stringSession = new StringSession("");
            let sessionLoaded = false;

            // 1. Try to load existing session
            try {
                await fs.access(SESSION_FILE_PATH);
                const savedSession = await fs.readFile(SESSION_FILE_PATH, "utf-8");
                if (savedSession) {
                    stringSession = new StringSession(savedSession.trim());
                    sessionLoaded = true;
                    logger.info("[Telegram] Loaded existing session from disk.");
                }
            } catch (err) {
                logger.info("[Telegram] No existing session found. A new login will be performed.");
            }

            // 2. Initialize Client with enhanced options
            const client = new TelegramClient(stringSession, apiId, apiHash, {
                connectionRetries: env.TELEGRAM_CONNECTION_RETRIES,
                useWSS: env.TELEGRAM_USE_WSS_FALLBACK,
                timeout: env.TELEGRAM_CONNECTION_TIMEOUT,
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
                        const sessionStr = (client.session as any).save();
                        await fs.writeFile(SESSION_FILE_PATH, sessionStr);
                        logger.info("[Telegram] New session created and saved to disk.");
                    } else {
                        await client.connect();
                    }

                    // 4. Verify access
                    await client.getEntity(channelId as any);
                    logger.info("[Telegram] Successfully connected and verified channel access!");
                }, env.TELEGRAM_MAX_RETRIES, env.TELEGRAM_RETRY_DELAY, 'Bot client connection');

                this.client = client;

            } catch (error: any) {
                logger.error("[Telegram] Connection failed:", error);

                if (error.seconds) {
                    logger.error(`[Telegram] FATAL: FloodWait detected. You must wait ${error.seconds} seconds before restarting.`);
                }

                if (error.code === 406 || error.message?.includes('AUTH_KEY_DUPLICATED')) {
                    logger.error("[Telegram] Session invalid (AUTH_KEY_DUPLICATED). Deleting session file...");
                    try {
                        await fs.unlink(SESSION_FILE_PATH);
                        logger.info("[Telegram] Session file deleted. Please restart the server.");
                    } catch (unlinkErr) {
                        logger.error("[Telegram] Failed to delete session file:", unlinkErr);
                    }
                }

                this.client = null;
                throw error;
            } finally {
                this.connecting = null;
            }
        })();

        await this.connecting;
        if (!this.client) throw new Error("Failed to initialize Telegram client");
        return this.client;
    }

    public async ensureConnected(): Promise<TelegramClient> {
        if (!this.client || !this.client.connected) {
            logger.warn('[Telegram] Client not connected, reconnecting...');
            await this.reconnect();
        }
        return this.client!;
    }

    public async disconnect() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        if (this.client) {
            await this.client.disconnect();
            this.client = null;
        }
    }
}

// --- Public API (Backwards Compatible) ---

export let client: TelegramClient;

export const connectTelegram = async () => {
    const service = TelegramService.getInstance();
    client = await service.connect();
};

export const uploadFileToTelegram = async (filePath: string, filename: string, mimeType: string) => {
    const service = TelegramService.getInstance();
    
    return retryWithBackoff(async () => {
        const activeClient = await service.ensureConnected();
        
        return requestQueue.add(async () => {
            logger.info(`[Telegram] Uploading ${filename}...`);
            const result = await activeClient.sendFile(channelId as any, {
                file: filePath,
                forceDocument: true,
                attributes: [
                    new Api.DocumentAttributeFilename({ fileName: filename }),
                ],
                caption: `File: ${filename}\nMime: ${mimeType}`,
                workers: 3,
            });
            logger.info(`[Telegram] Upload successful: ${filename}`);
            return {
                messageId: result.id,
                media: result.media,
            };
        });
    }, env.TELEGRAM_MAX_RETRIES, env.TELEGRAM_RETRY_DELAY, `Upload ${filename}`);
};

export const downloadFileFromTelegram = async (messageId: number) => {
    const service = TelegramService.getInstance();
    
    return retryWithBackoff(async () => {
        const activeClient = await service.ensureConnected();
        
        logger.info(`[Telegram] Downloading message ${messageId}...`);
        const messages = await activeClient.getMessages(channelId as any, { ids: [messageId] });

        if (!messages || messages.length === 0) {
            throw new Error("Message not found");
        }

        const message = messages[0];
        if (!message.media || message.media instanceof Api.MessageMediaEmpty) {
            throw new Error("Message does not contain any media");
        }

        return activeClient.iterDownload({
            file: message.media,
            requestSize: 512 * 1024,
        });
    }, env.TELEGRAM_MAX_RETRIES, env.TELEGRAM_RETRY_DELAY, `Download message ${messageId}`);
};

export const getFileLink = async (messageId: number) => {
    return null;
};

export const deleteMessage = async (messageId: number) => {
    const service = TelegramService.getInstance();
    
    return retryWithBackoff(async () => {
        const activeClient = await service.ensureConnected();
        await activeClient.deleteMessages(channelId as any, [messageId], { revoke: true });
        logger.info(`[Telegram] Deleted message ${messageId}`);
    }, env.TELEGRAM_MAX_RETRIES, env.TELEGRAM_RETRY_DELAY, `Delete message ${messageId}`);
};

// --- User Client & Auth Helpers (Enhanced) ---

export const getUserClient = async (session: string) => {
    const pool = UserClientPool.getInstance();
    return pool.getClient(session);
};

export const sendLoginCode = async (phoneNumber: string) => {
    return retryWithBackoff(async () => {
        const tempClient = new TelegramClient(new StringSession(""), apiId, apiHash, {
            connectionRetries: env.TELEGRAM_CONNECTION_RETRIES,
        });
        await tempClient.connect();

        const { phoneCodeHash } = await tempClient.sendCode(
            {
                apiId,
                apiHash,
            },
            phoneNumber
        );

        const session = tempClient.session.save();
        return { phoneCodeHash, session };
    }, env.TELEGRAM_MAX_RETRIES, env.TELEGRAM_RETRY_DELAY, 'Send login code');
};

export const completeLogin = async (phoneNumber: string, code: string, phoneCodeHash: string, session: string, userPassword?: string) => {
    return retryWithBackoff(async () => {
        const stringSession = new StringSession(session);
        const tempClient = new TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: env.TELEGRAM_CONNECTION_RETRIES,
        });
        await tempClient.connect();

        try {
            await tempClient.invoke(
                new Api.auth.SignIn({
                    phoneNumber,
                    phoneCodeHash,
                    phoneCode: code,
                })
            );
        } catch (e: any) {
            if (e.message.includes("SESSION_PASSWORD_NEEDED") && userPassword) {
                const passwordSrpResult = await tempClient.invoke(
                    new Api.account.GetPassword()
                );
                const passwordHash = await password.computeCheck(passwordSrpResult, userPassword);
                await tempClient.invoke(
                    new Api.auth.CheckPassword({
                        password: passwordHash,
                    })
                );
            } else {
                throw e;
            }
        }

        return tempClient.session.save();
    }, env.TELEGRAM_MAX_RETRIES, env.TELEGRAM_RETRY_DELAY, 'Complete login');
};

export const uploadFileToTelegramWithClient = async (clientToUse: TelegramClient, filePath: string, filename: string, mimeType: string) => {
    return retryWithBackoff(async () => {
        // Ensure client is connected
        if (!clientToUse.connected) {
            logger.warn(`[Telegram] User client disconnected, reconnecting...`);
            await clientToUse.connect();
        }

        logger.info(`[Telegram] Uploading ${filename} to Telegram (User)...`);
        
        const result = await clientToUse.sendFile("me", {
            file: filePath,
            forceDocument: true,
            attributes: [
                new Api.DocumentAttributeFilename({ fileName: filename }),
            ],
            caption: `File: ${filename}\nMime: ${mimeType}`,
            workers: 3,
        });

        logger.info(`[Telegram] Upload successful (User): ${filename}`);
        return {
            messageId: result.id,
            media: result.media,
        };
    }, env.TELEGRAM_MAX_RETRIES, env.TELEGRAM_RETRY_DELAY, `Upload ${filename} (User)`);
};

export const downloadFileFromTelegramWithClient = async (clientToUse: TelegramClient, messageId: number) => {
    return retryWithBackoff(async () => {
        // Ensure client is connected
        if (!clientToUse.connected) {
            logger.warn(`[Telegram] User client disconnected, reconnecting...`);
            await clientToUse.connect();
        }

        logger.info(`[Telegram] Downloading message ${messageId} (User)...`);
        const messages = await clientToUse.getMessages("me", { ids: [messageId] });
        
        if (!messages || messages.length === 0) {
            throw new Error("Message not found");
        }
        
        const message = messages[0];
        if (!message.media || message.media instanceof Api.MessageMediaEmpty) {
            throw new Error("Message does not contain any media");
        }
        
        return clientToUse.iterDownload({
            file: message.media,
            requestSize: 512 * 1024,
        });
    }, env.TELEGRAM_MAX_RETRIES, env.TELEGRAM_RETRY_DELAY, `Download message ${messageId} (User)`);
};

export const deleteMessageWithClient = async (clientToUse: TelegramClient, messageId: number) => {
    return retryWithBackoff(async () => {
        // Ensure client is connected
        if (!clientToUse.connected) {
            logger.warn(`[Telegram] User client disconnected, reconnecting...`);
            await clientToUse.connect();
        }

        await clientToUse.deleteMessages("me", [messageId], { revoke: true });
        logger.info(`[Telegram] Deleted message ${messageId} (User)`);
    }, env.TELEGRAM_MAX_RETRIES, env.TELEGRAM_RETRY_DELAY, `Delete message ${messageId} (User)`);
};