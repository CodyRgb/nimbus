import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { Api } from "telegram/tl";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
const apiHash = process.env.TELEGRAM_API_HASH || "";
const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const channelId = process.env.TELEGRAM_CHANNEL_ID || "";

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

    // Save session if needed (optional for bots as they can login with token)
    // console.log("Session:", client.session.save());

    isConnected = true;
    console.log("Connected to Telegram!");
};

export const uploadFileToTelegram = async (filePath: string, filename: string, mimeType: string) => {
    if (!isConnected) await connectTelegram();

    console.log(`Uploading ${filename} to Telegram...`);

    // CustomUploadFile allows uploading large files by chunks
    // gram.js handles this automatically with client.uploadFile or sendFile

    try {
        // Send the file to the channel
        // We use sendFile which handles uploading and sending in one go
        const result = await client.sendFile(channelId, {
            file: filePath,
            forceDocument: true,
            attributes: [
                new Api.DocumentAttributeFilename({ fileName: filename }),
            ],
            caption: `File: ${filename}\nMime: ${mimeType}`,
        });

        // Clean up local file
        // fs.unlinkSync(filePath); // Caller handles cleanup

        // Extract file_id and message_id
        // result is a Message object
        const messageId = result.id;

        // We need to get the file location to generate a file_id or just store the message_id
        // For downloading, we can use downloadMedia(message)

        // We'll return the message ID and the file object from Telegram
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

    // Get the message
    const messages = await client.getMessages(channelId, { ids: [messageId] });
    if (!messages || messages.length === 0) {
        throw new Error("Message not found");
    }

    const message = messages[0];

    // Download media
    // This returns a Buffer. For very large files, we might want to stream.
    // gram.js downloadMedia supports 'workers' and 'outputFile'.
    // If we want to stream to the response, we might need to download to a temp file first or use an iterator.
    // For now, let's return a buffer (might be memory intensive for huge files) 
    // or better, download to a temp file and return the path.

    // Let's try returning a buffer for now, but for production, streaming is better.
    // gram.js iterDownload could be used for streaming.

    // For this implementation, let's use iterDownload to get an async iterable
    if (!message.media || message.media instanceof Api.MessageMediaEmpty) {
        throw new Error("Message does not contain any media");
    }

    return client.iterDownload(message.media);
};

export const getFileLink = async (messageId: number) => {
    // This would require the file to be public or use a bot API link if available.
    // Since it's a private channel, we must proxy the download.
    return null;
};

export const deleteMessage = async (messageId: number) => {
    if (!isConnected) await connectTelegram();
    await client.deleteMessages(channelId, [messageId], { revoke: true });
};
