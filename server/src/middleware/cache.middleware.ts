import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import crypto from 'crypto';

/**
 * Generate ETag from response data
 */
const generateETag = (data: any): string => {
    return crypto
        .createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');
};

/**
 * Cache middleware for GET requests
 * Checks Redis cache and returns cached response if available
 */
export const cacheMiddleware = (keyGenerator: (req: Request) => string, ttl: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const cacheKey = keyGenerator(req);
        
        try {
            const cachedData = await cacheService.get(cacheKey);
            
            if (cachedData) {
                const etag = generateETag(cachedData);
                
                // Check if client has cached version
                if (req.headers['if-none-match'] === `"${etag}"`) {
                    res.status(304).end();
                    return;
                }

                // Return cached data with cache headers
                res.setHeader('ETag', `"${etag}"`);
                res.setHeader('Cache-Control', `private, must-revalidate, max-age=${ttl}`);
                res.setHeader('X-Cache-Status', 'HIT');
                res.json(cachedData);
                return;
            }

            // Cache miss - continue to route handler
            res.setHeader('X-Cache-Status', 'MISS');
            
            // Store original json method
            const originalJson = res.json.bind(res);
            
            // Override json method to cache response
            res.json = function(data: any) {
                const etag = generateETag(data);
                
                // Set cache headers
                res.setHeader('ETag', `"${etag}"`);
                res.setHeader('Cache-Control', `private, must-revalidate, max-age=${ttl}`);
                
                // Cache the response
                cacheService.set(cacheKey, data, ttl).catch(err => {
                    console.error('Failed to cache response:', err);
                });
                
                return originalJson(data);
            };
            
            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

/**
 * Middleware to set cache headers for static assets (thumbnails)
 */
export const staticCacheHeaders = (maxAge: number = 31536000) => {
    return (req: Request, res: Response, next: NextFunction) => {
        res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`);
        res.setHeader('Vary', 'Accept-Encoding');
        next();
    };
};

/**
 * Middleware to handle conditional requests (If-Modified-Since, If-None-Match)
 */
export const conditionalRequest = (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data: any) {
        const etag = generateETag(data);
        const lastModified = new Date().toUTCString();
        
        // Check If-None-Match (ETag)
        if (req.headers['if-none-match'] === `"${etag}"`) {
            res.status(304).end();
            return res;
        }
        
        // Set response headers
        res.setHeader('ETag', `"${etag}"`);
        res.setHeader('Last-Modified', lastModified);
        
        return originalJson(data);
    };
    
    next();
};