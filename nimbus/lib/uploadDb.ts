import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface PersistentUpload {
    id: string;
    file: File | Blob;
    name: string;
    size: number;
    mimeType: string;
    progress: number;
    status: 'queued' | 'uploading' | 'paused' | 'error' | 'completed';
    uploadedBytes: number;
    totalBytes: number;
    error?: string;
    createdAt: number;
    completedAt?: number;
}

interface UploadsDB extends DBSchema {
    uploadQueue: {
        key: string;
        value: PersistentUpload;
        indexes: {
            'by-status': string;
            'by-createdAt': number;
        };
    };
    recentCompleted: {
        key: string;
        value: {
            _id: string;
            originalName: string;
            size: number;
            mimeType: string;
            createdAt: string;
        };
        indexes: {
            'by-createdAt': string;
        };
    };
}

const DB_NAME = 'ciphervault-upload-manager';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<UploadsDB>> | null = null;

const getDB = async (): Promise<IDBPDatabase<UploadsDB>> => {
    if (!dbPromise) {
        dbPromise = openDB<UploadsDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('uploadQueue')) {
                    const store = db.createObjectStore('uploadQueue', { keyPath: 'id' });
                    store.createIndex('by-status', 'status');
                    store.createIndex('by-createdAt', 'createdAt');
                }
                if (!db.objectStoreNames.contains('recentCompleted')) {
                    const recentStore = db.createObjectStore('recentCompleted', { keyPath: '_id' });
                    recentStore.createIndex('by-createdAt', 'createdAt');
                }
            },
        });
    }
    return dbPromise;
};

export const uploadStorage = {
    async getAll(): Promise<PersistentUpload[]> {
        try {
            const db = await getDB();
            const all = await db.getAll('uploadQueue');
            return all.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
            console.error('Failed to get uploads from IndexedDB:', error);
            return [];
        }
    },

    async save(upload: PersistentUpload): Promise<void> {
        try {
            const db = await getDB();
            await db.put('uploadQueue', upload);
        } catch (error) {
            console.error('Failed to save upload to IndexedDB:', error);
        }
    },

    async saveMultiple(uploads: PersistentUpload[]): Promise<void> {
        try {
            const db = await getDB();
            const tx = db.transaction('uploadQueue', 'readwrite');
            for (const upload of uploads) {
                await tx.store.put(upload);
            }
            await tx.done;
        } catch (error) {
            console.error('Failed to save multiple uploads to IndexedDB:', error);
        }
    },

    async updateProgress(id: string, progress: number, uploadedBytes: number, totalBytes: number): Promise<void> {
        try {
            const db = await getDB();
            const existing = await db.get('uploadQueue', id);
            if (existing) {
                existing.progress = progress;
                existing.uploadedBytes = uploadedBytes;
                existing.totalBytes = totalBytes;
                await db.put('uploadQueue', existing);
            }
        } catch (error) {
            console.error('Failed to update progress in IndexedDB:', error);
        }
    },

    async updateStatus(id: string, status: PersistentUpload['status'], error?: string): Promise<void> {
        try {
            const db = await getDB();
            const existing = await db.get('uploadQueue', id);
            if (existing) {
                existing.status = status;
                if (error !== undefined) existing.error = error;
                if (status === 'completed') {
                    existing.completedAt = Date.now();
                    existing.progress = 100;
                    existing.uploadedBytes = existing.totalBytes;
                }
                await db.put('uploadQueue', existing);
            }
        } catch (err) {
            console.error('Failed to update status in IndexedDB:', err);
        }
    },

    async remove(id: string): Promise<void> {
        try {
            const db = await getDB();
            await db.delete('uploadQueue', id);
        } catch (error) {
            console.error('Failed to delete upload from IndexedDB:', error);
        }
    },

    async clearCompleted(): Promise<void> {
        try {
            const db = await getDB();
            const all = await db.getAll('uploadQueue');
            const completed = all.filter(u => u.status === 'completed');
            const tx = db.transaction('uploadQueue', 'readwrite');
            for (const item of completed) {
                await tx.store.delete(item.id);
            }
            await tx.done;
        } catch (error) {
            console.error('Failed to clear completed uploads from IndexedDB:', error);
        }
    },

    // Recent Completed Sync
    async saveRecentCompleted(files: Array<{ _id: string; originalName: string; size: number; mimeType: string; createdAt: string }>): Promise<void> {
        try {
            const db = await getDB();
            const tx = db.transaction('recentCompleted', 'readwrite');
            for (const file of files) {
                await tx.store.put(file);
            }
            await tx.done;
        } catch (error) {
            console.error('Failed to save recent files in IndexedDB:', error);
        }
    },

    async getRecentCompleted(): Promise<Array<{ _id: string; originalName: string; size: number; mimeType: string; createdAt: string }>> {
        try {
            const db = await getDB();
            const all = await db.getAll('recentCompleted');
            return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error('Failed to get recent completed from IndexedDB:', error);
            return [];
        }
    }
};
