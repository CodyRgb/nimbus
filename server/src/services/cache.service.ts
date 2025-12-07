import Redis from 'ioredis';

// Redis client instance
let redisClient: Redis | null = null;

// Initialize Redis connection
export const initRedis = (): Redis => {
    if (redisClient) return redisClient;

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        lazyConnect: true,
    });

    redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
        console.log('Redis connected successfully');
    });

    return redisClient;
};

// Get Redis client
export const getRedisClient = (): Redis | null => {
    return redisClient;
};

// Cache key generators
export const CacheKeys = {
    fileList: (userId: string, page: number, limit: number, folderId?: string) => 
        `files:list:${userId}:${folderId || 'root'}:${page}:${limit}`,
    
    fileMetadata: (fileId: string) => 
        `file:meta:${fileId}`,
    
    thumbnailUrl: (fileId: string) => 
        `file:thumb:${fileId}`,
    
    userFileCount: (userId: string) => 
        `user:filecount:${userId}`,
    
    folderList: (userId: string, parentId?: string) => 
        `folders:list:${userId}:${parentId || 'root'}`,
};

// Cache TTL (Time To Live) in seconds
export const CacheTTL = {
    fileList: 300,           // 5 minutes
    fileMetadata: 86400,     // 24 hours
    thumbnailUrl: 604800,    // 7 days
    userFileCount: 300,      // 5 minutes
    folderList: 600,         // 10 minutes
};

// Generic cache operations
export class CacheService {
    private redis: Redis | null;

    constructor() {
        this.redis = getRedisClient();
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.redis) return null;
        
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    async set(key: string, value: any, ttl?: number): Promise<boolean> {
        if (!this.redis) return false;
        
        try {
            const serialized = JSON.stringify(value);
            if (ttl) {
                await this.redis.setex(key, ttl, serialized);
            } else {
                await this.redis.set(key, serialized);
            }
            return true;
        } catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }

    async del(key: string | string[]): Promise<boolean> {
        if (!this.redis) return false;
        
        try {
            await this.redis.del(...(Array.isArray(key) ? key : [key]));
            return true;
        } catch (error) {
            console.error(`Cache delete error:`, error);
            return false;
        }
    }

    async invalidatePattern(pattern: string): Promise<boolean> {
        if (!this.redis) return false;
        
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
            return true;
        } catch (error) {
            console.error(`Cache pattern invalidation error:`, error);
            return false;
        }
    }

    async exists(key: string): Promise<boolean> {
        if (!this.redis) return false;
        
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`Cache exists check error:`, error);
            return false;
        }
    }

    // Increment counter (useful for tracking)
    async incr(key: string, ttl?: number): Promise<number> {
        if (!this.redis) return 0;
        
        try {
            const result = await this.redis.incr(key);
            if (ttl && result === 1) {
                await this.redis.expire(key, ttl);
            }
            return result;
        } catch (error) {
            console.error(`Cache increment error:`, error);
            return 0;
        }
    }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache invalidation helpers
export const invalidateUserCache = async (userId: string): Promise<void> => {
    await cacheService.invalidatePattern(`files:list:${userId}:*`);
    await cacheService.invalidatePattern(`folders:list:${userId}:*`);
    await cacheService.del(CacheKeys.userFileCount(userId));
};

export const invalidateFileCache = async (fileId: string, userId: string): Promise<void> => {
    await cacheService.del([
        CacheKeys.fileMetadata(fileId),
        CacheKeys.thumbnailUrl(fileId),
    ]);
    await invalidateUserCache(userId);
};