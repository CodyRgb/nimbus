import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { password } from "telegram";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";


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

class TelegramService {
    private static instance: TelegramService;
    public client: TelegramClient | null = null;
    private connecting: Promise<void> | null = null;

    private constructor() { }

    public static getInstance(): TelegramService {
        if (!TelegramService.instance) {
            TelegramService.instance = new TelegramService();
        }
        return TelegramService.instance;
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
            console.log("[Telegram] Initializing client connection...");

            let stringSession = new StringSession("");
            let sessionLoaded = false;

            // 1. Try to load existing session
            try {
                // Check if file exists
                await fs.access(SESSION_FILE_PATH);
                const savedSession = await fs.readFile(SESSION_FILE_PATH, "utf-8");
                if (savedSession) {
                    stringSession = new StringSession(savedSession.trim());
                    sessionLoaded = true;
                    console.log("[Telegram] Loaded existing session from disk.");
                }
            } catch (err) {
                console.log("[Telegram] No existing session found. A new login will be performed.");
            }

            // 2. Initialize Client
            const client = new TelegramClient(stringSession, apiId, apiHash, {
                connectionRetries: 5,
                useWSS: false,
                timeout: 900,
            });

            // 3. Connect/Login
            try {
                if (!sessionLoaded) {
                    await client.start({
                        botAuthToken: botToken,
                    });
                    // Save the new session
                    const sessionStr = (client.session as any).save();
                    await fs.writeFile(SESSION_FILE_PATH, sessionStr);
                    console.log("[Telegram] New session created and saved to disk.");
                } else {
                    await client.connect();
                }

                // 4. Verify access
                await client.getEntity(channelId as any);
                console.log("[Telegram] Successfully connected and verified channel access!");

                this.client = client;
                // Update the exported client variable for compatibility
                // (Note: Exports are live bindings, but we can't re-assign a const exported by other means easily without 'let')
                // We'll manage strictly through this service for internal ops.

            } catch (error: any) {
                console.error("[Telegram] Connection failed:", error);

                if (error.seconds) {
                    console.error(`[Telegram] FATAL: FloodWait detected. You must wait ${error.seconds} seconds before restarting.`);
                }

                if (error.code === 406 || error.message.includes('AUTH_KEY_DUPLICATED')) {
                    console.error("[Telegram] Session invalid (AUTH_KEY_DUPLICATED). Deleting session file and retrying...");
                    try {
                        await fs.unlink(SESSION_FILE_PATH);
                        console.log("[Telegram] Session file deleted.");
                        // We could recursively call connect() here, but for safety in this strict startup phase,
                        // let's just clear the client and let the next attempt (or restart) handle it.
                        // Ideally, we should retry immediately.
                    } catch (unlinkErr) {
                        console.error("[Telegram] Failed to delete session file:", unlinkErr);
                    }
                }

                this.client = null; // Ensure we retry next time
                throw error;
            } finally {
                this.connecting = null;
            }
        })();

        await this.connecting;
        if (!this.client) throw new Error("Failed to initialize Telegram client");
        return this.client;
    }
}

// --- Public API (Backwards Compatible) ---

// We export a 'client' but it might be null initially.
// For consumers that use it directly, we'll try to provide the singleton's client if available,
// but honestly, direct usage of 'client' before connection is unsafe.
// We'll initialize it as a new client just to satisfy the type, but it won't be connected until connectTelegram is called.
// Actually, to fully fix the issue, we should NOT export a standalone unmanaged client.
// We will export the client from the singleton once connected.
// But to keep 'export const client' valid, we'll make it a Proxy or just a separate instance that
// we try not to use.
// BETTER APPROACH: Export 'client' as a variable that gets assigned.
export let client: TelegramClient;

export const connectTelegram = async () => {
    const service = TelegramService.getInstance();
    client = await service.connect(); // Assign to exported variable
};

export const uploadFileToTelegram = async (filePath: string, filename: string, mimeType: string) => {
    const service = TelegramService.getInstance();
    const activeClient = await service.connect(); // Ensure connected

    // Use queue to prevent flooding
    return requestQueue.add(async () => {
        console.log(`[Telegram] Uploading ${filename}...`);
        const result = await activeClient.sendFile(channelId as any, {
            file: filePath,
            forceDocument: true,
            attributes: [
                new Api.DocumentAttributeFilename({ fileName: filename }),
            ],
            caption: `File: ${filename}\nMime: ${mimeType}`,
            workers: 3,
        });
        return {
            messageId: result.id,
            media: result.media,
        };
    });
};

export const downloadFileFromTelegram = async (messageId: number) => {
    const service = TelegramService.getInstance();
    const activeClient = await service.connect();

    console.log(`[Telegram] Downloading message ${messageId}...`);
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
};

export const getFileLink = async (messageId: number) => {
    return null;
};

export const deleteMessage = async (messageId: number) => {
    const service = TelegramService.getInstance();
    const activeClient = await service.connect();
    await activeClient.deleteMessages(channelId as any, [messageId], { revoke: true });
};

// --- User Client & Auth Helpers (Preserved) ---

export const getUserClient = async (session: string) => {
    const stringSession = new StringSession(session);
    const userClient = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 15,
        useWSS: false,
        timeout: 900,
    });
    await userClient.connect();
    return userClient;
};

export const sendLoginCode = async (phoneNumber: string) => {
    const tempClient = new TelegramClient(new StringSession(""), apiId, apiHash, {
        connectionRetries: 5,
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
};

export const completeLogin = async (phoneNumber: string, code: string, phoneCodeHash: string, session: string, userPassword?: string) => {
    const stringSession = new StringSession(session);
    const tempClient = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
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
};

export const uploadFileToTelegramWithClient = async (clientToUse: TelegramClient, filePath: string, filename: string, mimeType: string) => {
    console.log(`Uploading ${filename} to Telegram (User)...`);
    // Note: We don't queue user client uploads globally, but we could if needed.
    // For now, keeping original logic but wrapped in try/catch for retries if desired.
    // Simplifying to direct call for now to match original behavior but reusing the p-queue logic might be complex with different clients.

    // Original logic had retries. Let's keep it simple and consistent with the robust bot implementation.
    // But since this is a specific client instance passed in, we just use it.

    const result = await clientToUse.sendFile("me", {
        file: filePath,
        forceDocument: true,
        attributes: [
            new Api.DocumentAttributeFilename({ fileName: filename }),
        ],
        caption: `File: ${filename}\nMime: ${mimeType}`,
        workers: 3,
    });

    return {
        messageId: result.id,
        media: result.media,
    };
};

export const downloadFileFromTelegramWithClient = async (clientToUse: TelegramClient, messageId: number) => {
    console.log(`Downloading message ${messageId} (User)...`);
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
};

export const deleteMessageWithClient = async (clientToUse: TelegramClient, messageId: number) => {
    await clientToUse.deleteMessages("me", [messageId], { revoke: true });
};
