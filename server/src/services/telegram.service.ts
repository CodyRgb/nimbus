import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import { password } from "telegram";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";
const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const channelIdStr = process.env.TELEGRAM_CHANNEL_ID || "";

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

// Initialize client
// We use a StringSession. If you want to persist the session, save the string.
// For bots, we can just login with the token each time or save the session.
const stringSession = new StringSession("");

export const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});

let isConnected = false;

export const connectTelegram = async () => {
    if (isConnected) return;

    console.log("Connecting to Telegram...");
    await client.start({
        botAuthToken: botToken,
    });

    // Ensure we can access the channel
    try {
        // Resolving the entity caches the access hash which is required for subsequent calls
        await client.getEntity(channelId as any);
        console.log("Successfully resolved Telegram channel!");
    } catch (error) {
        console.error("Error resolving Telegram channel:", error);
        console.error("Make sure the bot is an administrator in the channel and the CHANNEL_ID is correct.");
        // client.getDialogs() is not supported for bots, so we removed it.
    }

    // Save session if needed (optional for bots as they can login with token)
    // console.log("Session:", client.session.save());

    isConnected = true;
    console.log("Connected to Telegram!");
};

export const uploadFileToTelegram = async (filePath: string, filename: string, mimeType: string) => {
    if (!isConnected) await connectTelegram();

    console.log(`Uploading ${filename} to Telegram...`);

    try {
        // Send the file to the channel
        const result = await client.sendFile(channelId as any, {
            file: filePath,
            forceDocument: true,
            attributes: [
                new Api.DocumentAttributeFilename({ fileName: filename }),
            ],
            caption: `File: ${filename}\nMime: ${mimeType}`,
            workers: 3, // Parallel uploads
        });

        const messageId = result.id;

        return {
            messageId: messageId,
            media: result.media,
        };
    } catch (error) {
        console.error("Error uploading to Telegram:", error);
        throw error;
    }
};

export const downloadFileFromTelegram = async (messageId: number) => {
    if (!isConnected) await connectTelegram();

    console.log(`Downloading message ${messageId}...`);

    const messages = await client.getMessages(channelId as any, { ids: [messageId] });
    if (!messages || messages.length === 0) {
        throw new Error("Message not found");
    }

    const message = messages[0];

    if (!message.media || message.media instanceof Api.MessageMediaEmpty) {
        throw new Error("Message does not contain any media");
    }

    return client.iterDownload({
        file: message.media,
        requestSize: 512 * 1024,
    });
};

export const getFileLink = async (messageId: number) => {
    // This would require the file to be public or use a bot API link if available.
    // Since it's a private channel, we must proxy the download.
    return null;
};

export const deleteMessage = async (messageId: number) => {
    if (!isConnected) await connectTelegram();
    await client.deleteMessages(channelId as any, [messageId], { revoke: true });
};

// --- User Client & Auth ---

export const getUserClient = async (session: string) => {
    const stringSession = new StringSession(session);
    const userClient = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
        useWSS: false,
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
            // If 2FA is enabled, we need to use checkPassword
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
    try {
        const result = await clientToUse.sendFile("me", {
            file: filePath,
            forceDocument: true,
            attributes: [
                new Api.DocumentAttributeFilename({ fileName: filename }),
            ],
            caption: `File: ${filename}\nMime: ${mimeType}`,
            workers: 3, // Parallel uploads
        });

        return {
            messageId: result.id,
            media: result.media,
        };
    } catch (error) {
        console.error("Error uploading to Telegram (User):", error);
        throw error;
    }
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
    // We do NOT delete from Telegram as per requirements, but keeping this helper just in case needed later
    // or for cleanup of failed uploads.
    await clientToUse.deleteMessages("me", [messageId], { revoke: true });
};
