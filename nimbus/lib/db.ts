import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FileCache {
    id: string;
    data: any;
    timestamp: number;
    etag?: string;
}

interface CipherVaultDB extends DBSchema {
    fileList: {
        key: string;
        value: FileCache;
        indexes: { 'by-timestamp': number };
    };
    thumbnails: {
        key: string;
        value: { id: string; url: string; timestamp: number };
    };
}

let dbPromise: Promise<IDBPDatabase<CipherVaultDB>> | null = null;

const initDB = async (): Promise<IDBPDatabase<CipherVaultDB>> => {
    if (dbPromise) return dbPromise;

    dbPromise = openDB<CipherVaultDB>('ciphervault-cache', 1, {
        upgrade(db) {
            // File list cache store
            if (!db.objectStoreNames.contains('fileList')) {
                const fileStore = db.createObjectStore('fileList', { keyPath: 'id' });
                fileStore.createIndex('by-timestamp', 'timestamp');
            }

            // Thumbnail cache store
            if (!db.objectStoreNames.contains('thumbnails')) {
                db.createObjectStore('thumbnails', { keyPath: 'id' });
            }
        },
    });

    return dbPromise;
};

export const cacheDB = {
    async getFileList(key: string): Promise<any | null> {
        try {
            const db = await initDB();
            const cached = await db.get('fileList', key);

            if (!cached) return null;

            // Check if cache is stale (5 minutes)
            const isStale = Date.now() - cached.timestamp > 5 * 60 * 1000;
            
            return {
                data: cached.data,
                etag: cached.etag,
                isStale,
            };
        } catch (error) {
            console.error('IndexedDB get error:', error);
            return null;
        }
    },

    async setFileList(key: string, data: any, etag?: string): Promise<void> {
        try {
            const db = await initDB();
            await db.put('fileList', {
                id: key,
                data,
                timestamp: Date.now(),
                etag,
            });
        } catch (error) {
            console.error('IndexedDB set error:', error);
        }
    },

    async getThumbnail(fileId: string): Promise<string | null> {
        try {
            const db = await initDB();
            const cached = await db.get('thumbnails', fileId);

            if (!cached) return null;

            // Thumbnails are valid for 7 days
            const isExpired = Date.now() - cached.timestamp > 7 * 24 * 60 * 60 * 1000;
            
            return isExpired ? null : cached.url;
        } catch (error) {
            console.error('IndexedDB get thumbnail error:', error);
            return null;
        }
    },

    async setThumbnail(fileId: string, url: string): Promise<void> {
        try {
            const db = await initDB();
            await db.put('thumbnails', {
                id: fileId,
                url,
                timestamp: Date.now(),
            });
        } catch (error) {
            console.error('IndexedDB set thumbnail error:', error);
        }
    },

    async clearFileList(key?: string): Promise<void> {
        try {
            const db = await initDB();
            if (key) {
                await db.delete('fileList', key);
            } else {
                await db.clear('fileList');
            }
        } catch (error) {
            console.error('IndexedDB clear error:', error);
        }
    },

    async clearAllCache(): Promise<void> {
        try {
            const db = await initDB();
            await db.clear('fileList');
            await db.clear('thumbnails');
        } catch (error) {
            console.error('IndexedDB clear all error:', error);
        }
    },

    async cleanupOldEntries(): Promise<void> {
        try {
            const db = await initDB();
            const tx = db.transaction('fileList', 'readwrite');
            const store = tx.objectStore('fileList');
            const index = store.index('by-timestamp');

            // Delete entries older than 24 hours
            const cutoff = Date.now() - 24 * 60 * 60 * 1000;
            const oldEntries = await index.getAllKeys(IDBKeyRange.upperBound(cutoff));

            for (const key of oldEntries) {
                await store.delete(key);
            }

            await tx.done;
        } catch (error) {
            console.error('IndexedDB cleanup error:', error);
        }
    },
};