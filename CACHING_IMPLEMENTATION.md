# Telegram Cloud Storage - Caching & Performance Optimization

## Overview

This document describes the complete caching and performance optimization strategy implemented for the Nimbus cloud storage application. The system uses a multi-layer caching approach to minimize Telegram API calls, reduce latency, and improve user experience.

## Architecture

### Multi-Layer Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHING LAYERS                            │
├─────────────────────────────────────────────────────────────┤
│ L1: Browser Cache (Service Worker + HTTP Cache)             │
│     ├─ Thumbnails: 7 days, immutable                        │
│     ├─ File metadata: SWR with stale-while-revalidate       │
│     └─ IndexedDB: Offline file list cache                   │
├─────────────────────────────────────────────────────────────┤
│ L2: CDN/Edge Cache (Optional - Cloudflare/Vercel)          │
│     └─ Static thumbnails: Cache-Control: max-age=604800     │
├─────────────────────────────────────────────────────────────┤
│ L3: Backend Memory Cache (Redis)                            │
│     ├─ Telegram file metadata: 24h TTL                      │
│     ├─ Thumbnail URLs: 7 days TTL                           │
│     └─ User file lists: 5min TTL, invalidate on change      │
├─────────────────────────────────────────────────────────────┤
│ L4: Database Cache (MongoDB)                                │
│     ├─ File documents with thumbnail paths                  │
│     ├─ Telegram file_id + unique_id mapping                 │
│     └─ Indexed queries for fast retrieval                   │
├─────────────────────────────────────────────────────────────┤
│ L5: Telegram Cloud (Source of Truth)                        │
│     └─ Original files stored permanently                    │
└─────────────────────────────────────────────────────────────┘
```

## Backend Implementation

### 1. Redis Cache Service

**Location:** `server/src/services/cache.service.ts`

**Features:**
- Singleton Redis client with connection pooling
- Automatic retry strategy with exponential backoff
- Type-safe cache operations
- Pattern-based cache invalidation
- TTL management for different data types

**Cache Keys:**
```typescript
files:list:{userId}:{folderId}:{page}:{limit}  // File lists
file:meta:{fileId}                              // File metadata
file:thumb:{fileId}                             // Thumbnail URLs
user:filecount:{userId}                         // User statistics
folders:list:{userId}:{parentId}                // Folder structure
```

**TTL Configuration:**
- File lists: 5 minutes
- File metadata: 24 hours
- Thumbnail URLs: 7 days
- User file count: 5 minutes
- Folder lists: 10 minutes

### 2. Enhanced File Model

**Location:** `server/src/models/File.model.ts`

**New Fields:**
```typescript
{
  telegramUniqueId: string,      // Permanent Telegram file identifier
  thumbnailSmall: string,         // 150x150 WebP thumbnail
  thumbnailMedium: string,        // 400x400 WebP thumbnail
  thumbnailLarge: string,         // 800x800 WebP thumbnail
  thumbnailTelegramId: string,    // Telegram thumbnail file_id
  dimensions: {                   // Original dimensions
    width: number,
    height: number
  },
  cacheKey: string,               // SHA256 hash for deduplication
  etag: string                    // For HTTP caching
}
```

**Indexes:**
- `user` + `folder` (compound index for fast queries)
- `mimeType` (for filtering by type)
- `telegramFileId` (for Telegram lookups)
- `cacheKey` (for deduplication)
- `lastAccessed` (for LRU cleanup)

### 3. Thumbnail Generation Service

**Location:** `server/src/services/thumbnail.service.ts`

**Features:**
- Multi-size thumbnail generation (small, medium, large)
- WebP format with optimized quality settings
- Video thumbnail extraction using FFmpeg
- Parallel processing for faster generation
- Automatic upload to Cloudinary
- Dimension extraction and storage

**Thumbnail Sizes:**
```typescript
{
  small: { width: 150, height: 150, quality: 75 },   // Grid view
  medium: { width: 400, height: 400, quality: 80 },  // Preview
  large: { width: 800, height: 800, quality: 85 }    // Full preview
}
```

### 4. Cache Middleware

**Location:** `server/src/middleware/cache.middleware.ts`

**Features:**
- Automatic ETag generation
- Conditional request handling (If-None-Match)
- 304 Not Modified responses
- Cache-Control headers
- X-Cache-Status headers for debugging

**Usage:**
```typescript
router.get('/files', 
  protect, 
  cacheMiddleware(
    (req) => CacheKeys.fileList(req.user._id, page, limit),
    CacheTTL.fileList
  ),
  getFiles
);
```

### 5. Optimized File Controller

**Location:** `server/src/controllers/file.controller.ts`

**Optimizations:**
- Cache-first file list retrieval
- Pagination support
- ETag-based conditional responses
- Automatic cache invalidation on mutations
- Parallel thumbnail generation
- Deduplication using cache keys

## Frontend Implementation

### 1. IndexedDB Cache

**Location:** `nimbus/lib/db.ts`

**Features:**
- Persistent client-side storage
- File list caching with timestamps
- Thumbnail URL caching
- Automatic cleanup of old entries
- Stale-while-revalidate pattern

**Storage Structure:**
```typescript
{
  fileList: {
    id: string,           // Cache key
    data: any,            // File list data
    timestamp: number,    // Cache time
    etag: string          // For validation
  },
  thumbnails: {
    id: string,           // File ID
    url: string,          // Thumbnail URL
    timestamp: number     // Cache time
  }
}
```

### 2. SWR Data Fetching

**Location:** `nimbus/lib/hooks/useFiles.ts`

**Features:**
- Automatic revalidation
- Stale-while-revalidate pattern
- ETag-based conditional requests
- IndexedDB fallback on errors
- Optimistic updates
- Prefetching support

**Configuration:**
```typescript
{
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000,        // 1 minute
  focusThrottleInterval: 300000,  // 5 minutes
  keepPreviousData: true
}
```

### 3. Optimized Thumbnail Component

**Location:** `nimbus/app/components/FileThumbnail.tsx`

**Features:**
- Lazy loading with Intersection Observer
- IndexedDB cache check before API call
- Multiple thumbnail sizes
- Skeleton loading states
- Next.js Image optimization
- Progressive loading

## Performance Best Practices

### Telegram API Optimization

| Aspect | Recommendation | Implementation |
|--------|---------------|----------------|
| **Chunk Size** | 512KB - 1MB | Configured in upload service |
| **Parallelism** | Max 3 concurrent uploads | Rate limiter in controller |
| **Rate Limits** | 20 uploads/min | Exponential backoff |
| **Thumbnail Format** | WebP (75-85 quality) | Sharp configuration |
| **Deduplication** | SHA256 hash check | Before upload |
| **Video Thumbnails** | Extract at 10% duration | FFmpeg configuration |

### HTTP Cache Headers

**Thumbnails (Immutable):**
```http
Cache-Control: public, max-age=31536000, immutable
Vary: Accept-Encoding
```

**File Lists (Revalidate):**
```http
Cache-Control: private, must-revalidate, max-age=300
ETag: "5f3a2b1c"
```

**Downloads (No Cache):**
```http
Cache-Control: private, no-cache
Content-Disposition: attachment
```

## Cache Invalidation

### Automatic Invalidation

| Event | Action | Scope |
|-------|--------|-------|
| File Upload | Invalidate user's file list | User-specific |
| File Delete | Remove from all caches | File + User |
| File Update | Update ETag + invalidate | File-specific |
| Bulk Delete | Batch invalidation | User-specific |
| User Logout | Clear client caches | Client-only |

### Manual Invalidation

```typescript
// Invalidate user's entire cache
await invalidateUserCache(userId);

// Invalidate specific file
await invalidateFileCache(fileId, userId);

// Clear client-side cache
await cacheDB.clearAllCache();
```

## Setup Instructions

### Backend Setup

1. **Install Redis:**
```bash
# Windows (using Chocolatey)
choco install redis-64

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

2. **Configure Environment:**
```env
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. **Install Dependencies:**
```bash
cd server
npm install ioredis compression etag
```

### Frontend Setup

1. **Install Dependencies:**
```bash
cd nimbus
npm install swr idb
```

2. **No additional configuration needed** - caching works automatically!

## Monitoring & Debugging

### Cache Status Headers

Check response headers for cache status:
```http
X-Cache-Status: HIT    # Served from cache
X-Cache-Status: MISS   # Fetched from source
```

### Redis Monitoring

```bash
# Connect to Redis CLI
redis-cli

# Monitor cache keys
KEYS files:*
KEYS file:*

# Check TTL
TTL files:list:userId:root:1:50

# View cache size
DBSIZE
```

### IndexedDB Inspection

1. Open Chrome DevTools
2. Go to Application → Storage → IndexedDB
3. Inspect `nimbus-cache` database

## Performance Metrics

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| File List Load | ~2-3s | ~100-300ms | **90% faster** |
| Thumbnail Load | ~500ms | ~50ms (cached) | **90% faster** |
| Repeat Visits | Full reload | Instant | **100% faster** |
| Telegram API Calls | Every request | Once per TTL | **95% reduction** |
| Bandwidth Usage | Full files | Thumbnails only | **80% reduction** |

## Troubleshooting

### Redis Connection Issues

If Redis is not available, the system will:
1. Log a warning
2. Continue without caching
3. Fetch directly from MongoDB

### Cache Inconsistency

If data seems stale:
```typescript
// Force refresh from client
const { refresh } = useFiles();
refresh();

// Or clear cache
await cacheDB.clearAllCache();
```

### Thumbnail Generation Failures

Thumbnails are generated asynchronously. If generation fails:
1. File is still accessible
2. Fallback icon is shown
3. Error is logged for debugging
4. Retry on next access

## Future Enhancements

1. **Service Worker:** Offline support and background sync
2. **CDN Integration:** Cloudflare/Vercel Edge caching
3. **WebSocket:** Real-time cache invalidation
4. **Compression:** Brotli compression for API responses
5. **Prefetching:** Predictive prefetching based on user behavior
6. **Analytics:** Cache hit/miss rate tracking

## Conclusion

This caching implementation provides a robust, multi-layer caching strategy that significantly improves performance while maintaining data consistency. The system is designed to gracefully degrade if any caching layer fails, ensuring reliability.