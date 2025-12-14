"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conditionalRequest = exports.staticCacheHeaders = exports.cacheMiddleware = void 0;
const cache_service_1 = require("../services/cache.service");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate ETag from response data
 */
const generateETag = (data) => {
    return crypto_1.default
        .createHash('md5')
        .update(JSON.stringify(data))
        .digest('hex');
};
/**
 * Cache middleware for GET requests
 * Checks Redis cache and returns cached response if available
 */
const cacheMiddleware = (keyGenerator, ttl) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }
        const cacheKey = keyGenerator(req);
        try {
            const cachedData = await cache_service_1.cacheService.get(cacheKey);
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
            res.json = function (data) {
                const etag = generateETag(data);
                // Set cache headers
                res.setHeader('ETag', `"${etag}"`);
                res.setHeader('Cache-Control', `private, must-revalidate, max-age=${ttl}`);
                // Cache the response
                cache_service_1.cacheService.set(cacheKey, data, ttl).catch(err => {
                    console.error('Failed to cache response:', err);
                });
                return originalJson(data);
            };
            next();
        }
        catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};
exports.cacheMiddleware = cacheMiddleware;
/**
 * Middleware to set cache headers for static assets (thumbnails)
 */
const staticCacheHeaders = (maxAge = 31536000) => {
    return (req, res, next) => {
        res.setHeader('Cache-Control', `public, max-age=${maxAge}, immutable`);
        res.setHeader('Vary', 'Accept-Encoding');
        next();
    };
};
exports.staticCacheHeaders = staticCacheHeaders;
/**
 * Middleware to handle conditional requests (If-Modified-Since, If-None-Match)
 */
const conditionalRequest = (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (data) {
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
exports.conditionalRequest = conditionalRequest;
