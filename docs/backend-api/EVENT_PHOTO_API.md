# Event Photo API Documentation

## Overview

The Event Photo API allows you to manage photo galleries for events. You can upload single or multiple photos, update captions and ordering, and retrieve photo lists.

**Base URL:** `/api/events/{event_id}/photos/`

**Authentication:** Required (JWT Bearer Token)

**Permissions:** Event organizer or collaborators with appropriate roles

---

## Endpoints

### 1. List Event Photos

Get all photos for a specific event.

**Endpoint:** `GET /api/events/{event_id}/photos/`

**Authentication:** Required

**Parameters:**

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| event_id | UUID | Path | Yes | The event ID |

**Response:** `200 OK`

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "image": "http://api.goevent.online/media/event_photos/photo1.webp",
      "caption": "Beautiful sunset at the venue",
      "order": 0,
      "is_featured": false,
      "created_at": "2025-10-02T10:30:00Z"
    },
    {
      "id": 2,
      "image": "http://api.goevent.online/media/event_photos/photo2.webp",
      "caption": "Team gathering",
      "order": 1,
      "is_featured": true,
      "created_at": "2025-10-02T10:31:00Z"
    }
  ]
}
```

**Example Request:**

```javascript
// JavaScript (Fetch API)
const response = await fetch(`/api/events/${eventId}/photos/`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const data = await response.json();
```

```bash
# cURL
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.goevent.online/api/events/{event_id}/photos/
```

---

### 2. Upload Single Photo

Upload a single photo to an event.

**Endpoint:** `POST /api/events/{event_id}/photos/`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| image | File | Yes | Image file (JPG, PNG, GIF, WebP, max 5MB) |
| caption | String | No | Photo caption (max 200 characters) |
| order | Integer | No | Display order (auto-assigned if not provided) |
| is_featured | Boolean | No | Mark as featured photo (default: false) |

**Response:** `201 Created`

```json
{
  "id": 3,
  "image": "/media/event_photos/photo3.webp",
  "caption": "Main stage setup",
  "order": 2,
  "is_featured": false,
  "created_at": "2025-10-02T10:35:00Z"
}
```

**Example Request:**

```javascript
// JavaScript (FormData)
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('caption', 'Main stage setup');
formData.append('is_featured', 'false');

const response = await fetch(`/api/events/${eventId}/photos/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});
const data = await response.json();
```

```bash
# cURL
curl -X POST https://api.goevent.online/api/events/{event_id}/photos/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@photo.jpg" \
  -F "caption=Main stage setup"
```

---

### 3. Bulk Upload Photos (NEW!)

Upload multiple photos at once (up to 50 photos per request).

**Endpoint:** `POST /api/events/{event_id}/photos/bulk-upload/`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| images | File[] | Yes | Array of image files (max 50 images) |
| captions | String[] | No | Array of captions (must match image count if provided) |

**Response:** `201 Created`

```json
{
  "status": "photos uploaded",
  "count": 3,
  "photos": [
    {
      "id": 4,
      "image": "/media/event_photos/photo4.webp",
      "caption": "Guest arrival",
      "order": 3,
      "is_featured": false,
      "created_at": "2025-10-02T10:40:00Z"
    },
    {
      "id": 5,
      "image": "/media/event_photos/photo5.webp",
      "caption": "Keynote speaker",
      "order": 4,
      "is_featured": false,
      "created_at": "2025-10-02T10:40:01Z"
    },
    {
      "id": 6,
      "image": "/media/event_photos/photo6.webp",
      "caption": "Networking session",
      "order": 5,
      "is_featured": false,
      "created_at": "2025-10-02T10:40:02Z"
    }
  ]
}
```

**Example Request:**

```javascript
// JavaScript (Multiple Files)
const formData = new FormData();

// Add multiple images
Array.from(fileInput.files).forEach(file => {
  formData.append('images', file);
});

// Add captions (optional)
const captions = ['Guest arrival', 'Keynote speaker', 'Networking session'];
captions.forEach(caption => {
  formData.append('captions', caption);
});

const response = await fetch(`/api/events/${eventId}/photos/bulk-upload/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});
const data = await response.json();
```

```bash
# cURL
curl -X POST https://api.goevent.online/api/events/{event_id}/photos/bulk-upload/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg" \
  -F "images=@photo3.jpg" \
  -F "captions=Guest arrival" \
  -F "captions=Keynote speaker" \
  -F "captions=Networking session"
```

**Validation:**

- Maximum 50 images per request
- If captions are provided, count must match image count
- Each image must be valid (JPG, PNG, GIF, WebP, max 5MB)

**Error Response:** `400 Bad Request`

```json
{
  "error": "Number of captions (2) must match number of images (3)"
}
```

---

### 4. Get Single Photo

Retrieve details of a specific photo.

**Endpoint:** `GET /api/events/{event_id}/photos/{photo_id}/`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "id": 1,
  "image": "http://api.goevent.online/media/event_photos/photo1.webp",
  "caption": "Beautiful sunset at the venue",
  "order": 0,
  "is_featured": false,
  "created_at": "2025-10-02T10:30:00Z"
}
```

---

### 5. Update Photo

Update photo caption, order, or featured status.

**Endpoint:** `PATCH /api/events/{event_id}/photos/{photo_id}/`

**Authentication:** Required

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "caption": "Updated caption",
  "is_featured": true,
  "order": 5
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "image": "http://api.goevent.online/media/event_photos/photo1.webp",
  "caption": "Updated caption",
  "order": 5,
  "is_featured": true,
  "created_at": "2025-10-02T10:30:00Z"
}
```

**Example Request:**

```javascript
// JavaScript
const response = await fetch(`/api/events/${eventId}/photos/${photoId}/`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    caption: 'Updated caption',
    is_featured: true
  })
});
```

---

### 6. Delete Photo

Delete a photo from the event gallery.

**Endpoint:** `DELETE /api/events/{event_id}/photos/{photo_id}/`

**Authentication:** Required

**Response:** `204 No Content`

**Example Request:**

```javascript
// JavaScript
await fetch(`/api/events/${eventId}/photos/${photoId}/`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

---

### 7. Reorder Single Photo

Update the order of a specific photo.

**Endpoint:** `PATCH /api/events/{event_id}/photos/{photo_id}/reorder/`

**Authentication:** Required

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "order": 3
}
```

**Response:** `200 OK`

```json
{
  "status": "order updated"
}
```

---

### 8. Bulk Reorder Photos

Update the order of multiple photos at once.

**Endpoint:** `PATCH /api/events/{event_id}/photos/bulk-reorder/`

**Authentication:** Required

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "updates": [
    { "id": 1, "order": 2 },
    { "id": 2, "order": 0 },
    { "id": 3, "order": 1 }
  ]
}
```

**Response:** `200 OK`

```json
{
  "status": "orders updated",
  "count": 3
}
```

**Example Request:**

```javascript
// JavaScript - Drag and drop reordering
const updateOrder = async (photoUpdates) => {
  const response = await fetch(`/api/events/${eventId}/photos/bulk-reorder/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      updates: photoUpdates
    })
  });
  return response.json();
};

// Usage example
const newOrder = [
  { id: 5, order: 0 },
  { id: 3, order: 1 },
  { id: 1, order: 2 }
];
await updateOrder(newOrder);
```

---

## Data Models

### Photo Object

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Unique photo ID |
| image | String (URL) | Full URL to the image file |
| caption | String | Photo caption (max 200 characters) |
| order | Integer | Display order (0-indexed) |
| is_featured | Boolean | Whether photo is featured |
| created_at | DateTime (ISO 8601) | Photo upload timestamp |

---

## Image Processing

All uploaded images are automatically optimized:

- **Format:** Converted to WebP for optimal file size
- **Gallery Photos:** Resized to max 1200x1200px at 90% quality
- **Target Size:** ~80-150KB per photo
- **Transparency:** Preserved for PNG images

**Supported Formats:**
- JPEG/JPG
- PNG (transparency preserved)
- GIF
- WebP

**File Size Limit:** 5MB per image

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "No images provided. Use \"images\" field for file uploads."
}
```

```json
{
  "error": "Maximum 50 images allowed per upload"
}
```

```json
{
  "error": "Number of captions (2) must match number of images (3)"
}
```

### 401 Unauthorized

```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden

```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found

```json
{
  "detail": "Not found."
}
```

---

## Common Use Cases

### 1. Upload Multiple Photos from Gallery Picker

```javascript
// React/Vue example
const handleBulkUpload = async (selectedFiles) => {
  const formData = new FormData();

  selectedFiles.forEach(file => {
    formData.append('images', file);
  });

  try {
    const response = await fetch(`/api/events/${eventId}/photos/bulk-upload/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');

    const result = await response.json();
    console.log(`Uploaded ${result.count} photos`);

    // Update UI with new photos
    setPhotos(prevPhotos => [...prevPhotos, ...result.photos]);
  } catch (error) {
    console.error('Upload error:', error);
  }
};
```

### 2. Drag and Drop Photo Reordering

```javascript
// After drag and drop
const handleReorder = async (reorderedPhotos) => {
  const updates = reorderedPhotos.map((photo, index) => ({
    id: photo.id,
    order: index
  }));

  const response = await fetch(`/api/events/${eventId}/photos/bulk-reorder/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ updates })
  });

  if (response.ok) {
    console.log('Photos reordered successfully');
  }
};
```

### 3. Set Featured Photo

```javascript
const setFeaturedPhoto = async (photoId) => {
  // First, unfeatured all photos (if only one can be featured)
  const currentPhotos = await fetchPhotos();
  const featuredPhoto = currentPhotos.find(p => p.is_featured);

  if (featuredPhoto && featuredPhoto.id !== photoId) {
    await fetch(`/api/events/${eventId}/photos/${featuredPhoto.id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_featured: false })
    });
  }

  // Set new featured photo
  await fetch(`/api/events/${eventId}/photos/${photoId}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ is_featured: true })
  });
};
```

### 4. Delete Multiple Photos

```javascript
const deletePhotos = async (photoIds) => {
  const deletePromises = photoIds.map(id =>
    fetch(`/api/events/${eventId}/photos/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
  );

  await Promise.all(deletePromises);
  console.log(`Deleted ${photoIds.length} photos`);
};
```

---

## Best Practices

1. **Bulk Upload for Multiple Photos**
   - Use `/bulk-upload/` endpoint when users select multiple files
   - Shows better UX with single progress indicator
   - More efficient than individual uploads

2. **Image Optimization**
   - Images are automatically converted to WebP
   - No need to pre-process images on frontend
   - Server handles resizing and optimization

3. **Order Management**
   - Use `bulk-reorder` for drag-and-drop functionality
   - Order is 0-indexed (first photo is order: 0)
   - Gaps in order numbers are acceptable

4. **Caption Validation**
   - Max 200 characters per caption
   - If using bulk upload with captions, ensure arrays match
   - Captions are optional

5. **Error Handling**
   - Always check response status codes
   - Handle network errors gracefully
   - Show user-friendly error messages

6. **Performance**
   - Implement pagination for large galleries
   - Use lazy loading for images
   - Consider thumbnail generation on frontend

---

## Rate Limiting

- **Bulk Upload:** Max 50 images per request
- **File Size:** Max 5MB per image
- **Concurrent Requests:** Follow API rate limits (check with backend team)

---

## Support

For questions or issues:
- Check the main API documentation
- Contact backend team
- Report issues at: https://github.com/anthropics/claude-code/issues

---

**Last Updated:** October 2, 2025
**API Version:** v1
