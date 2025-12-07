# Thumbnail System with Cloudinary

## Overview

This system generates and stores persistent thumbnails for images and videos using Cloudinary. Thumbnails are generated once during upload and cached permanently, eliminating the need to download files from Telegram on every page refresh.

## How It Works

### Upload Flow
1. User uploads a file
2. File is uploaded to Telegram
3. Database record is created
4. **Thumbnail generation happens asynchronously**:
   - File is downloaded from Telegram
   - Thumbnail is generated (400x400, maintaining aspect ratio)
   - Thumbnail is uploaded to Cloudinary
   - Cloudinary URL is saved in database

### Display Flow
1. Frontend requests thumbnail via `/files/:id/thumbnail`
2. Backend returns Cloudinary URL (if available)
3. Frontend displays image directly from Cloudinary
4. **No blob URLs, no re-downloading on refresh**

## Key Features

- ✅ **Persistent thumbnails** - Survive page refreshes
- ✅ **Fast loading** - Served from Cloudinary CDN
- ✅ **Automatic generation** - Created during upload
- ✅ **On-demand fallback** - Generated if missing
- ✅ **Proper cleanup** - Deleted from Cloudinary when file is deleted

## API Endpoints

### Get Thumbnail
```
GET /api/files/:id/thumbnail
```

**Response:**
```json
{
  "thumbnailUrl": "https://res.cloudinary.com/..."
}
```

## Database Schema

### File Model
```typescript
{
  // ... existing fields
  thumbnailUrl?: string;  // Cloudinary URL for thumbnail
}
```

## Migration

To generate thumbnails for existing files:

```bash
npm run migrate:thumbnails
```

This script:
- Finds all files without thumbnails
- Generates thumbnails for images and videos
- Uploads to Cloudinary
- Updates database records

## Configuration

Required environment variables in `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Thumbnail Specifications

- **Size**: 400x400 pixels (max, maintains aspect ratio)
- **Format**: JPEG
- **Quality**: 80%
- **Storage**: Cloudinary folder `nimbus-thumbnails/`
- **Public ID**: File's MongoDB `_id`

## Video Thumbnails

For videos, the system attempts to:
1. Extract frame at 1 second using FFmpeg
2. Fallback to gray placeholder if FFmpeg unavailable

**Note**: FFmpeg must be installed on the server for video thumbnail extraction.

## Error Handling

- If thumbnail generation fails, file upload still succeeds
- Thumbnails can be generated on-demand via the thumbnail endpoint
- Frontend gracefully falls back to emoji icons if thumbnail unavailable

## Performance Benefits

**Before (Blob URLs):**
- Download full file from Telegram: ~2-10 seconds
- Create blob URL in browser
- Lost on page refresh
- Repeat for every refresh

**After (Cloudinary):**
- Thumbnail generated once: ~3-5 seconds (async)
- Served from CDN: ~100-300ms
- Persists forever
- No re-generation needed

## Cleanup

When a file is deleted:
1. Database record is removed
2. Thumbnail is deleted from Cloudinary
3. Telegram file is preserved (for user storage type)

## Future Improvements

- [ ] Batch thumbnail generation for bulk uploads
- [ ] Progressive image loading
- [ ] Multiple thumbnail sizes (small, medium, large)
- [ ] WebP format support for better compression
- [ ] Lazy thumbnail generation (only when viewed)