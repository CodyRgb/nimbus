# 🏗️ Architecture Diagrams & System Design

Visual representation of the face recognition system architecture, data flows, and design patterns.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Flow Diagrams](#data-flow-diagrams)
3. [Deployment Architecture](#deployment-architecture)
4. [Cache Strategy](#cache-strategy)
5. [Scaling Patterns](#scaling-patterns)
6. [Database Schema](#database-schema)
7. [API Architecture](#api-architecture)
8. [Error Handling Flow](#error-handling-flow)

---

## System Architecture

### High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     WEB BROWSER / CLIENT                        │
│                  (React/Next.js Frontend)                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/WebSocket
                               │ (JSON)
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
    ┌──────────────────────────┐  ┌────────────────────────────┐
    │  Nginx / Load Balancer   │  │  File Storage Service      │
    │  ├─ SSL/TLS              │  │  ├─ Cloudinary (photos)    │
    │  ├─ Compression          │  │  ├─ CDN                    │
    │  └─ Rate Limiting        │  │  └─ Public URLs            │
    └────────────┬─────────────┘  └────────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────────────────────────────────┐
    │              NODE.JS EXPRESS API (3001)                      │
    │                                                               │
    │  ┌────────────────────────────────────────────────────────┐  │
    │  │ Request Processing Layer                              │  │
    │  │ ├─ Authentication Middleware (JWT)                    │  │
    │  │ ├─ Authorization Middleware                           │  │
    │  │ ├─ Request Validation                                 │  │
    │  │ └─ Error Handling                                     │  │
    │  └────────────────────────────────────────────────────────┘  │
    │                                                               │
    │  ┌────────────────────────────────────────────────────────┐  │
    │  │ Route Handlers                                         │  │
    │  │ ├─ /api/files/* (file operations)                     │  │
    │  │ ├─ /api/face-recognition/* (face search)             │  │
    │  │ ├─ /api/albums/* (album management)                  │  │
    │  │ └─ /api/auth/* (authentication)                      │  │
    │  └────────────────────────────────────────────────────────┘  │
    │                                                               │
    │  ┌────────────────────────────────────────────────────────┐  │
    │  │ Service Layer                                          │  │
    │  │ ├─ FaceRecognitionService                             │  │
    │  │ ├─ FileService                                        │  │
    │  │ ├─ CacheService                                       │  │
    │  │ ├─ DatabaseService                                   │  │
    │  │ └─ AuthenticationService                             │  │
    │  └────────────────────────────────────────────────────────┘  │
    └────────────────────────────────────────────────────────────────┘
                    │              │              │
        ┌───────────┤              │              │
        │           └──────────────┼──────────────┘
        │                          │
        ▼                          ▼
    ┌─────────────────┐    ┌──────────────────────────────┐
    │  PYTHON SERVICE │    │  DATA LAYER                  │
    │  (Port 5000)    │    │  ├─ MongoDB (file metadata)  │
    │                 │    │  ├─ Redis (cache)            │
    │ ┌─────────────┐ │    │  └─ Cloudinary API           │
    │ │ Flask App   │ │    └──────────────────────────────┘
    │ │ ├─ Routing  │ │
    │ │ ├─ CORS     │ │
    │ │ └─ Error    │ │
    │ │   Handling  │ │
    │ └─────────────┘ │
    │                 │
    │ ┌─────────────┐ │
    │ │ ML Layer    │ │
    │ │ ├─ face_    │ │
    │ │ │ recognition
    │ │ ├─ dlib      │ │
    │ │ ├─ OpenCV    │ │
    │ │ └─ NumPy     │ │
    │ └─────────────┘ │
    │                 │
    │ ┌─────────────┐ │
    │ │ Endpoints   │ │
    │ │ ├─ /extract │ │
    │ │ ├─ /compare │ │
    │ │ ├─ /batch   │ │
    │ │ └─ /health  │ │
    │ └─────────────┘ │
    └─────────────────┘
```

### Component Interactions

```
User clicks "Find Faces" button
    ↓
┌─────────────────────────────────────────────┐
│ FaceSearchModal Component Opens             │
│ ├─ Shows loading spinner                    │
│ ├─ Displays original photo                  │
│ └─ Prepares request                         │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│ HTTP Request to Node.js API                 │
│ GET /api/face-recognition/search/:fileId   │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│ Node.js Route Handler                       │
│ ├─ Authenticate request (JWT)               │
│ ├─ Validate file ownership                  │
│ └─ Call FaceRecognitionService              │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│ FaceRecognitionService                      │
│ ├─ Check Redis for cached embedding        │
│ ├─ If not cached:                           │
│ │  ├─ Download file from Cloudinary        │
│ │  └─ Call Python service                  │
│ └─ Get user's all file embeddings          │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│ Python Flask Service                        │
│ ├─ /extract-faces (if not cached)           │
│ │  ├─ Load image                            │
│ │  ├─ Detect faces (dlib)                   │
│ │  ├─ Extract embeddings (128-dim vectors) │
│ │  └─ Return embeddings                    │
│ └─ Return to Node.js                        │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│ Cache Embeddings in Redis                   │
│ ├─ Store face embedding (1KB)               │
│ ├─ Set TTL (30 days)                        │
│ └─ Key: face:embedding:{fileId}             │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│ Compare Faces                               │
│ ├─ Call Python /compare-faces               │
│ ├─ Compare query embedding to all others    │
│ ├─ Calculate similarity scores              │
│ └─ Sort by similarity (descending)          │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│ Cache Results in Redis                      │
│ ├─ Store search results                     │
│ ├─ Set TTL (1 hour)                         │
│ └─ Key: face:search:{userId}:{fileId}       │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│ Return Response to Frontend                 │
│ ├─ Original photo metadata                  │
│ ├─ Matching photos with similarity %        │
│ ├─ Processing time metadata                 │
│ └─ HTTP 200 with JSON data                  │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│ FaceSearchModal Displays Results            │
│ ├─ Hide loading spinner                     │
│ ├─ Render results grid                      │
│ ├─ Show similarity scores                   │
│ └─ Allow user to click for full photo       │
└─────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Initial Face Extraction Flow

```
┌──────────────┐
│ Select Photo │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────┐
│ Check if embedding cached?  │
└──┬─────────────────┬────────┘
   │ YES             │ NO
   │                 │
   ▼                 ▼
┌──────────────┐  ┌─────────────────────┐
│ Use cached   │  │ Download from       │
│ embedding    │  │ Cloudinary          │
└──────┬───────┘  └────────┬────────────┘
       │                   │
       │                   ▼
       │           ┌──────────────────────┐
       │           │ Call Python Service  │
       │           │ POST /extract-faces  │
       │           └────────┬─────────────┘
       │                    │
       │                    ▼
       │           ┌──────────────────────┐
       │           │ Extract embeddings   │
       │           │ (128-dim vectors)    │
       │           └────────┬─────────────┘
       │                    │
       │                    ▼
       │           ┌──────────────────────┐
       │           │ Store in Redis cache │
       │           │ TTL: 30 days         │
       │           └────────┬─────────────┘
       │                    │
       └────────┬───────────┘
                │
                ▼
       ┌────────────────────┐
       │ Return embedding   │
       │ to service layer   │
       └────────────────────┘
```

### Face Comparison Flow

```
┌──────────────────────┐
│ Query embedding      │
│ (from above)         │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Get all user file embeddings     │
│ from MongoDB + Redis             │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Call Python /compare-faces       │
│ ├─ Query embedding               │
│ └─ All other embeddings          │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Python calculates:               │
│ ├─ Euclidean distance (0.0-1.0)  │
│ ├─ Similarity = 1 - distance     │
│ ├─ Apply threshold (0.6)         │
│ └─ Filter matches                │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Sort by similarity score         │
│ ├─ Highest first                 │
│ └─ Apply limit (top 20)          │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Enhance with file metadata       │
│ ├─ Get filenames                 │
│ ├─ Get URLs                      │
│ ├─ Get timestamps                │
│ └─ Get other details             │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Cache search results             │
│ ├─ TTL: 1 hour                   │
│ └─ Key: face:search:{uid}:{fid}  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Return to controller             │
│ ├─ Original photo info           │
│ ├─ Matching photos (sorted)      │
│ ├─ Similarity scores             │
│ └─ Metadata                      │
└──────────────────────────────────┘
```

---

## Deployment Architecture

### Single Server Deployment

```
┌──────────────────────────────────────────────────────┐
│                    PRODUCTION SERVER                 │
│                    (2 CPU, 4GB RAM)                  │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ Node.js Express API (Port 3001)             │   │
│  │ ├─ Uptime: Process manager (PM2)            │   │
│  │ ├─ Memory: ~180MB                           │   │
│  │ └─ CPU: ~5% average                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ Python Flask Service (Port 5000)            │   │
│  │ ├─ Uptime: Process manager (PM2)            │   │
│  │ ├─ Memory: ~150MB (working)                 │   │
│  │ └─ CPU: On-demand (face processing)         │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ Redis Cache (Port 6379)                     │   │
│  │ ├─ Uptime: Persistent                       │   │
│  │ ├─ Memory: ~100MB (with embeddings)         │   │
│  │ └─ Snapshots: Daily backups                 │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ MongoDB (Port 27017)                        │   │
│  │ ├─ Uptime: Persistent                       │   │
│  │ ├─ Memory: ~200MB (with indexes)            │   │
│  │ ├─ Data: File metadata + user data          │   │
│  │ └─ Backups: Hourly snapshots                │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ System Resources                            │   │
│  │ ├─ CPU: 2 cores (60% utilized)              │   │
│  │ ├─ RAM: 4GB (70% utilized)                  │   │
│  │ ├─ Disk: 100GB (logs, temp)                 │   │
│  │ └─ Network: 100Mbps                         │   │
│  └─────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘

Capacity: 100-500 concurrent users
Cost: ~$100-200/month
```

### Scaled Deployment (Load Balanced)

```
┌─────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER                            │
│                   (Nginx/HAProxy)                           │
│                   - SSL Termination                         │
│                   - Route Distribution                      │
│                   - Health Checks                           │
└────────────────────┬──────────────────┬────────────────────┘
                     │                  │
        ┌────────────┴──────┬───────────┴──────────┐
        │                   │                      │
        ▼                   ▼                      ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  NODE.JS API #1  │ │  NODE.JS API #2  │ │  NODE.JS API #3  │
│  Port: 3001      │ │  Port: 3001      │ │  Port: 3001      │
│  Memory: 180MB   │ │  Memory: 180MB   │ │  Memory: 180MB   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
        │                   │                      │
        └────────────┬──────┴───────────┬──────────┘
                     │                  │
                     ▼                  ▼
        ┌───────────────────────────────────────┐
        │    PYTHON SERVICE INSTANCES           │
        │    (3-5 worker processes)             │
        │                                       │
        │  Port 5000 - Instance 1               │
        │  Port 5001 - Instance 2               │
        │  Port 5002 - Instance 3               │
        │  Port 5003 - Instance 4               │
        │  Port 5004 - Instance 5               │
        │                                       │
        │  Round-robin distribution             │
        └──────────────┬─────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    ┌───────┐    ┌────────┐    ┌───────────┐
    │ Redis │    │MongoDB │    │CloudFlare │
    │ Cluster    │ Replica      │ CDN       │
    └───────┘    │   Set   │    └───────────┘
               └────────┘

Capacity: 1000-5000 concurrent users
Cost: ~$500-1000/month
Scalability: Linear (add more instances)
```

---

## Cache Strategy

### Multi-Level Caching

```
┌─────────────────────────────────────────────────────────────┐
│                  CACHING HIERARCHY                          │
└─────────────────────────────────────────────────────────────┘

Level 1: Browser Cache
├─ URL: Cloudinary CDN (static images)
├─ TTL: 30 days (max-age)
├─ Size: Unlimited
└─ Reduces: Bandwidth, latency

                ▼

Level 2: Redis Cache (Face Embeddings)
├─ Key: face:embedding:{fileId}
├─ TTL: 2,592,000 seconds (30 days)
├─ Size: ~1KB per embedding
├─ Hit Rate: 80-90%
└─ Reduces: Python processing time

                ▼

Level 3: Redis Cache (Search Results)
├─ Key: face:search:{userId}:{fileId}
├─ TTL: 3,600 seconds (1 hour)
├─ Size: ~5-50KB per search
├─ Hit Rate: 30-50%
└─ Reduces: Both embedding + comparison time

                ▼

Level 4: Database (MongoDB)
├─ File metadata (always there)
├─ No cache (primary source)
├─ Indexes: userId, mimeType
└─ Used for: Reference, recovery

                ▼

Level 5: Python Processing
├─ No cache (computation happens here)
├─ Input: Image file from Cloudinary
├─ Output: 128-dim embedding vector
└─ Used for: New embeddings only
```

### Cache Hit/Miss Scenarios

```
Scenario 1: User searches same photo twice
────────────────────────────────────────────
Search 1:
  ├─ Cache check: MISS ❌
  ├─ DB check: MISS ❌
  ├─ Python processing: YES ✅
  ├─ Store in cache: YES ✅
  └─ Time: 8-12 seconds ⏱️

Search 2 (within 1 hour):
  ├─ Cache check: HIT ✅ (search results cached)
  ├─ DB check: SKIPPED
  ├─ Python processing: SKIPPED
  └─ Time: <500ms ⚡

Search 3 (after 1 hour):
  ├─ Cache check: MISS (TTL expired)
  ├─ But embedding still cached (30 days)!
  ├─ Python processing: SKIPPED ✅
  ├─ Only comparison needed
  └─ Time: 1-2 seconds ⚡⚡

Scenario 2: User batch processes entire library
────────────────────────────────────────────────
Before:
  ├─ Each search: 8-12 seconds
  ├─ 100 photos: 13+ minutes to search all
  └─ Very slow ❌

After batch process:
  ├─ Run once: POST /batch-process (5 min)
  ├─ All embeddings cached (30 days)
  ├─ Each search: <2 seconds
  ├─ All photos searchable instantly
  └─ One-time investment, huge payoff ✅
```

---

## Scaling Patterns

### Horizontal Scaling

```
Current Load: 100 users

Architecture (Version 1):
┌──────────┐
│ Express  │ → Python → Redis → MongoDB
│ (1)      │
└──────────┘

Metrics:
├─ Response time: 2-8 seconds
├─ CPU: ~60%
├─ Memory: ~70%
├─ Capacity: 100-200 users
└─ Status: Good ✅

Growth to 500 users - Add more instances:
┌──────────┐
│ Express  │ ┐
│ (1)      │ ├─→ Python (2) → Redis → MongoDB
│          │ │
└──────────┘ │
             │
┌──────────┐ │
│ Express  │ ┤
│ (1)      │ │
│          │ │
└──────────┘ ┘

Then add Python:
┌──────────┐
│ Express  │ ┐
│ (2)      │ ├─→ Python (4) → Redis → MongoDB
│          │ │
└──────────┘ │
             │
┌──────────┐ │
│ Express  │ ├─→ (Each gets
│ (2)      │ │    distributed
│          │ │    load)
└──────────┘ ┘

Then upgrade cache:
Expression (2) → Python (4) → Redis Cluster → MongoDB Cluster
                                    │
                                    └─ Multiple nodes
                                       High availability
                                       2-3TB capacity
```

### Vertical Scaling

```
Current Server: 2 CPU, 4GB RAM ($100/month)

Bottleneck: Memory (70% usage)

Solution 1: Upgrade RAM
├─ New: 4 CPU, 8GB RAM ($200/month)
├─ Improvement: 2x memory, better caching
├─ Time: 1-2 hours downtime
└─ Cost: +$100/month

Solution 2: Add GPU (for CNN model)
├─ New: 2 CPU, 4GB RAM, Tesla T4 GPU
├─ Improvement: 5-10x faster face extraction
├─ Time: 1-2 hours downtime
└─ Cost: +$300/month but worth it!

Solution 3: Both
├─ New: 4 CPU, 8GB RAM, Tesla T4 GPU
├─ Improvement: 2x memory + 5-10x speed
├─ Capacity: 1000+ concurrent users
└─ Cost: +$400/month total
```

---

## Database Schema

### MongoDB Collections

```
// users collection
{
  _id: ObjectId,
  email: string,
  username: string,
  passwordHash: string,
  createdAt: Date,
  updatedAt: Date,
  totalStorage: number,
  usedStorage: number,
  subscriptionTier: string
}

// files collection
{
  _id: ObjectId,
  userId: ObjectId,
  fileName: string,
  originalName: string,
  mimeType: string,
  size: number,
  cloudinaryPublicId: string,
  cloudinaryUrl: string,
  
  // Face recognition fields
  faceDetected: boolean,
  facesCount: number,
  faceEmbedding: Buffer,  // 128-dim vector as binary
  faceMetadata: {
    extractedAt: Date,
    model: string,
    confidence: number,
    location: {
      top: number,
      right: number,
      bottom: number,
      left: number
    }
  },
  
  uploadedAt: Date,
  updatedAt: Date,
  deletedAt: Date
}

// albums collection
{
  _id: ObjectId,
  userId: ObjectId,
  name: string,
  description: string,
  coverImageId: ObjectId,
  files: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.files.createIndex({ "userId": 1, "uploadedAt": -1 })
db.files.createIndex({ "userId": 1, "faceDetected": 1 })
db.files.createIndex({ "faceEmbedding": 1 })
db.files.createIndex({ "mimeType": 1, "userId": 1 })
```

### Redis Keys

```
// Face embeddings (persistent)
face:embedding:{fileId}
├─ Value: Serialized 128-dim vector
├─ TTL: 2,592,000 seconds (30 days)
├─ Size: ~1KB
└─ Lookup time: <1ms

// Search results (cached)
face:search:{userId}:{fileId}
├─ Value: Array of matching files with similarity
├─ TTL: 3,600 seconds (1 hour)
├─ Size: ~5-50KB
└─ Lookup time: <5ms

// Search history (optional)
face:search:history:{userId}
├─ Value: List of recent searches
├─ TTL: 7 days
├─ Size: ~1KB
└─ For: Personalizing suggestions

// Face groups (future)
face:groups:{userId}
├─ Value: Grouped face IDs
├─ TTL: 86,400 seconds (24 hours)
├─ Size: ~10-100KB
└─ For: Face clustering

// Session data
session:{sessionId}
├─ Value: Session info
├─ TTL: 1,209,600 seconds (14 days)
├─ Size: ~1KB
└─ For: User authentication

// Rate limiting
ratelimit:{userId}:{endpoint}
├─ Value: Request count
├─ TTL: 3600 seconds (1 hour)
├─ Size: <100B
└─ For: API throttling
```

---

## API Architecture

### Request/Response Flow

```
┌─────────────────────────────────┐
│    CLIENT REQUEST               │
│                                 │
│  GET /api/face-recognition/     │
│      search/abc123              │
│                                 │
│  Headers:                       │
│  ├─ Authorization: Bearer JWT   │
│  ├─ Content-Type: application/json
│  └─ User-Agent: ...             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  MIDDLEWARE CHAIN               │
│                                 │
│  1. Body Parser                 │
│     Parse incoming JSON         │
│                                 │
│  2. Auth Middleware             │
│     Validate JWT token          │
│     Extract userId              │
│                                 │
│  3. Authorization Middleware    │
│     Check user permissions      │
│     Verify file ownership       │
│                                 │
│  4. Validation Middleware       │
│     Validate request params     │
│     Check types & formats       │
│                                 │
│  5. Request Logging             │
│     Log endpoint & user         │
│     Track metrics               │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  ROUTE HANDLER                  │
│  (searchSimilarFaces)           │
│                                 │
│  ├─ Extract params              │
│  ├─ Build query                 │
│  ├─ Call service                │
│  └─ Return response             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  SERVICE LAYER                  │
│  (FaceRecognitionService)       │
│                                 │
│  ├─ Check cache                 │
│  ├─ Call Python API if needed   │
│  ├─ Process results             │
│  ├─ Cache outcomes              │
│  └─ Return data                 │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  SUCCESS RESPONSE               │
│                                 │
│  HTTP 200 OK                    │
│                                 │
│  {                              │
│    "success": true,             │
│    "data": {                    │
│      "query": {...},            │
│      "matches": [...]           │
│    }                            │
│  }                              │
└─────────────────────────────────┘
```

### Error Handling Flow

```
Request enters error middleware
        │
        ▼
Error occurs?
├─ No: Continue ✅
│
└─ Yes: Catch in handler
        │
        ▼
Determine error type
├─ Validation Error (400)
│  ├─ Message: "Invalid file ID"
│  └─ Action: Return 400 response
│
├─ Authentication Error (401)
│  ├─ Message: "Invalid token"
│  └─ Action: Return 401 response
│
├─ Authorization Error (403)
│  ├─ Message: "Not your file"
│  └─ Action: Return 403 response
│
├─ Not Found (404)
│  ├─ Message: "File not found"
│  └─ Action: Return 404 response
│
├─ Service Error (503)
│  ├─ Message: "Python service offline"
│  ├─ Action: Return 503 response
│  └─ Fallback: Use cached result if available
│
└─ Server Error (500)
   ├─ Message: "Internal server error"
   ├─ Action: Log error
   ├─ Action: Alert team
   └─ Action: Return 500 response

Response logged
        │
        ▼
Send to client
        │
        ▼
Frontend displays error message
```

---

## Error Handling Flow

### Complete Error Handling Chain

```
┌──────────────────────────────────────┐
│  ERROR OCCURS IN SERVICE             │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  CATCH BLOCK IN SERVICE              │
│                                      │
│  try {                               │
│    // face recognition code          │
│  } catch (error) {                   │
│    // Handle it here                 │
│  }                                   │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  ERROR LOGGING                       │
│                                      │
│  logger.error({                      │
│    level: 'error',                   │
│    message: error.message,           │
│    stack: error.stack,               │
│    context: { userId, fileId },      │
│    timestamp: Date.now()             │
│  })                                  │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  ERROR CLASSIFICATION                │
│                                      │
│  if (error.type === 'VALIDATION')    │
│    → Handled error (client issue)    │
│                                      │
│  else if (error.type === 'SERVICE')  │
│    → Service unavailable             │
│                                      │
│  else                                │
│    → Unexpected error                │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  THROW CATCHASYNC WRAPPER            │
│                                      │
│  throw new AppError(                 │
│    message,                          │
│    statusCode                        │
│  )                                   │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  GLOBAL ERROR MIDDLEWARE             │
│                                      │
│  app.use((err, req, res, next) => {  │
│    res.status(err.statusCode)        │
│      .json({                         │
│        success: false,               │
│        error: err.message            │
│      })                              │
│  })                                  │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  SEND ERROR RESPONSE TO CLIENT       │
│                                      │
│  {                                   │
│    "success": false,                 │
│    "error": "Error message",         │
│    "statusCode": 500                 │
│  }                                   │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  FRONTEND DISPLAYS ERROR             │
│                                      │
│  "Failed to search faces: Error..."  │
│  [Retry] [Cancel]                    │
└──────────────────────────────────────┘
```

---

## Summary

This architecture provides:

✅ **Scalability** - Easy to add instances
✅ **Performance** - Multi-level caching
✅ **Reliability** - Redundancy & fallbacks
✅ **Maintainability** - Clear separation
✅ **Security** - Authentication & authorization
✅ **Monitoring** - Logging & metrics
✅ **Recovery** - Error handling & retries

All components designed for **production deployment** with high availability and performance! 🚀

