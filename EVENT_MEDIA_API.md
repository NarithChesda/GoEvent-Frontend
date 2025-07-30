# Event Media API Documentation

## Overview

The Event Media API provides comprehensive media management for events, including images, videos, and embedded content. This API handles both direct media fields (banner, logos, videos) and gallery photos with drag-and-drop reordering capabilities.

## Media Types

### Direct Event Media Fields
- **Banner Image**: Main event banner/hero image
- **Logo One**: Primary event logo 
- **Logo Two**: Secondary logo (co-sponsor, partner)
- **Event Video**: Video file upload
- **Google Map Embed**: Google Maps iframe embed link
- **YouTube Embed**: YouTube video embed link

### Event Photo Gallery
- **Multiple Photos**: Ordered photo gallery with captions
- **Drag & Drop Reordering**: Bulk reorder functionality
- **Featured Photos**: Mark photos as featured

## Base URL

```
/api/events/{event_pk}/          # For direct media fields
/api/events/{event_pk}/photos/   # For photo gallery
```

**Authentication**: JWT Bearer Token required  
**Content-Type**: `multipart/form-data` for file uploads, `application/json` for other operations

## Table of Contents

1. [Permission System](#permission-system)
2. [Direct Media Fields API](#direct-media-fields-api)
3. [Event Photo Gallery API](#event-photo-gallery-api)
4. [Drag-and-Drop Reordering](#drag-and-drop-reordering)
5. [File Upload Guidelines](#file-upload-guidelines)
6. [Frontend Implementation](#frontend-implementation)
7. [Testing Examples](#testing-examples)
8. [Best Practices](#best-practices)
9. [Error Handling](#error-handling)

## Permission System

Event Media uses different permission classes based on the media type:

### **Direct Media Fields** (Event Model)
Uses `IsEventOwnerOrCollaborator` + `CanEditEventTemplateEnabled` permissions:

| User Type | Public Event | Private Event |
|-----------|--------------|---------------|
| **Unauthenticated User** | ❌ Read Only (via public view) | ❌ 401 Unauthorized |
| **Event Organizer** | ✅ Full CRUD | ✅ Full CRUD |
| **Admin Collaborator** | ✅ Full CRUD | ✅ Full CRUD |
| **Editor Collaborator** | ✅ Full CRUD | ✅ Full CRUD |
| **Viewer Collaborator** | ❌ Read Only | ❌ Read Only |
| **Registered Attendee** | ❌ Read Only | ❌ Read Only |

### **Event Photo Gallery** 
Uses `IsEventRelated` permission:

| User Type | Public Event | Private Event |
|-----------|--------------|---------------|
| **Unauthenticated User** | ❌ 401 Unauthorized | ❌ 401 Unauthorized |
| **Event Organizer** | ✅ Full CRUD | ✅ Full CRUD |
| **Admin Collaborator** | ✅ Full CRUD | ✅ Full CRUD |
| **Editor Collaborator** | ✅ Full CRUD | ✅ Full CRUD |
| **Viewer Collaborator** | ✅ Read Only | ✅ Read Only |

## Direct Media Fields API

### Data Model

| Field | Type | Description | Upload Path | Auto Resize |
|-------|------|-------------|-------------|-------------|
| banner_image | ImageField | Main event banner | event_banners/ | 1200x800 |
| logo_one | ImageField | Primary logo | event_logos/ | No |
| logo_two | ImageField | Secondary logo | event_logos/ | No |
| event_video | FileField | Video file | event_videos/ | No |
| google_map_embed_link | URLField | Google Maps embed URL | - | - |
| youtube_embed_link | URLField | YouTube embed URL | - | - |

### 1. Get Event Media

Retrieve all media fields as part of event details.

**Endpoint**: `GET /api/events/{event_pk}/`

**Response Extract**:
```json
{
    "id": "2345939d-ebe0-41f2-be1a-60fba67601b5",
    "title": "Tech Conference 2025",
    "banner_image": "http://localhost:8000/media/event_banners/banner_eXRYRVr.png",
    "logo_one": "http://localhost:8000/media/event_logos/logo-kh.png",
    "logo_two": "http://localhost:8000/media/event_logos/logo-en.png",
    "event_video": null,
    "google_map_embed_link": "https://maps.google.com/embed?test=123",
    "youtube_embed_link": "https://www.youtube.com/embed/dQw4w9WgXcQ"
}
```

### 2. Update Media Fields

Update one or more media fields.

**Endpoint**: `PATCH /api/events/{event_pk}/`

**Text/URL Fields** (JSON):
```bash
curl -X PATCH "http://localhost:8000/api/events/{event_pk}/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "google_map_embed_link": "https://maps.google.com/embed?pb=1234567890",
    "youtube_embed_link": "https://www.youtube.com/embed/VIDEO_ID"
  }'
```

**File Upload** (Form Data):
```bash
curl -X PATCH "http://localhost:8000/api/events/{event_pk}/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "banner_image=@/path/to/banner.jpg" \
  -F "logo_one=@/path/to/logo1.png"
```

**Mixed Update** (Form Data with JSON fields):
```bash
curl -X PATCH "http://localhost:8000/api/events/{event_pk}/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "banner_image=@/path/to/new-banner.jpg" \
  -F "google_map_embed_link=https://maps.google.com/embed?new=link"
```

### 3. Remove Media Fields

Set media fields to null by sending empty values.

**Remove Image Files**:
```json
{
    "banner_image": null,
    "logo_one": null,
    "event_video": null
}
```

**Remove URLs**:
```json
{
    "google_map_embed_link": "",
    "youtube_embed_link": ""
}
```

## Event Photo Gallery API

### Data Model

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | integer | Unique identifier | Auto-generated |
| event | foreign key | Related event | Yes (set by API) |
| image | ImageField | Photo file | Yes |
| caption | string(200) | Photo description | No |
| order | integer | Display order | Yes (default: 0) |
| is_featured | boolean | Featured photo flag | Yes (default: false) |
| created_at | datetime | Upload timestamp | Auto-generated |
| updated_at | datetime | Last update timestamp | Auto-generated |

### 1. List Event Photos

Get all photos for an event, ordered by order field then created_at.

**Endpoint**: `GET /api/events/{event_pk}/photos/`

**Permissions**: Must be authenticated (organizer or collaborator)

**Response**:
```json
{
    "count": 3,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "image": "http://localhost:8000/media/event_photos/conference_hall.jpg",
            "caption": "Main conference hall setup",
            "order": 0,
            "is_featured": true,
            "created_at": "2025-07-28T10:00:00Z",
            "updated_at": "2025-07-28T10:00:00Z"
        },
        {
            "id": 2,
            "image": "http://localhost:8000/media/event_photos/networking_area.jpg",
            "caption": "Networking and refreshment area",
            "order": 1,
            "is_featured": false,
            "created_at": "2025-07-28T10:05:00Z",
            "updated_at": "2025-07-28T10:05:00Z"
        },
        {
            "id": 3,
            "image": "http://localhost:8000/media/event_photos/speaker_stage.jpg",
            "caption": "Main stage with audiovisual setup",
            "order": 2,
            "is_featured": false,
            "created_at": "2025-07-28T10:10:00Z",
            "updated_at": "2025-07-28T10:10:00Z"
        }
    ]
}
```

### 2. Upload Event Photo

Add a new photo to the event gallery.

**Endpoint**: `POST /api/events/{event_pk}/photos/`

**Permissions**: Must be event organizer or admin/editor collaborator

**Request** (Form Data):
```bash
curl -X POST "http://localhost:8000/api/events/{event_pk}/photos/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/photo.jpg" \
  -F "caption=Beautiful venue exterior" \
  -F "order=0" \
  -F "is_featured=true"
```

**JavaScript Example**:
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('caption', 'Conference registration desk');
formData.append('order', 3);
formData.append('is_featured', false);

const response = await fetch(`/api/events/${eventId}/photos/`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type for FormData
    },
    body: formData
});
```

**Response (201 Created)**:
```json
{
    "id": 4,
    "image": "http://localhost:8000/media/event_photos/registration_desk.jpg",
    "caption": "Conference registration desk",
    "order": 3,
    "is_featured": false,
    "created_at": "2025-07-28T11:00:00Z",
    "updated_at": "2025-07-28T11:00:00Z"
}
```

### 3. Update Event Photo

Update photo metadata (caption, order, featured status). Cannot change image file.

**Endpoint**: `PATCH /api/events/{event_pk}/photos/{id}/`

**Request**:
```json
{
    "caption": "Updated: Main conference hall with new lighting",
    "is_featured": true,
    "order": 0
}
```

**Note**: To change the actual image file, delete the photo and create a new one.

### 4. Delete Event Photo

Remove a photo from the gallery.

**Endpoint**: `DELETE /api/events/{event_pk}/photos/{id}/`

**Response**: 204 No Content

### 5. Single Photo Reorder

Update the order of a single photo.

**Endpoint**: `PATCH /api/events/{event_pk}/photos/{id}/reorder/`

**Request**:
```json
{
    "order": 5
}
```

**Response**:
```json
{
    "status": "order updated"
}
```

## Drag-and-Drop Reordering

### Bulk Photo Reorder

Update the order of multiple photos in a single request - optimized for drag-and-drop UI.

**Endpoint**: `PATCH /api/events/{event_pk}/photos/bulk-reorder/`

**Permissions**: Must be event organizer or admin/editor collaborator

**Request**:
```json
{
    "updates": [
        {"id": 3, "order": 0},
        {"id": 1, "order": 1},
        {"id": 2, "order": 2},
        {"id": 4, "order": 3}
    ]
}
```

**Response**:
```json
{
    "status": "orders updated",
    "count": 4
}
```

**Validation**:
- All photo IDs must belong to the specified event
- Returns 400 Bad Request if any ID is invalid
- Atomic transaction - either all updates succeed or none

### Frontend Implementation

**React with @dnd-kit Example**:
```javascript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

function PhotoGalleryManager({ eventId, token }) {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        
        if (active.id !== over.id) {
            const oldIndex = photos.findIndex(p => p.id === active.id);
            const newIndex = photos.findIndex(p => p.id === over.id);
            
            // Optimistic update
            const newPhotos = arrayMove(photos, oldIndex, newIndex);
            setPhotos(newPhotos);
            
            // Prepare bulk update
            const updates = newPhotos.map((photo, index) => ({
                id: photo.id,
                order: index
            }));
            
            try {
                setLoading(true);
                const response = await fetch(
                    `/api/events/${eventId}/photos/bulk-reorder/`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ updates })
                    }
                );
                
                if (!response.ok) {
                    throw new Error('Reorder failed');
                }
            } catch (error) {
                // Rollback on failure
                setPhotos(photos);
                console.error('Failed to reorder photos:', error);
                alert('Failed to reorder photos. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <DndContext 
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext 
                items={photos.map(photo => photo.id)}
                strategy={verticalListSortingStrategy}
            >
                {photos.map(photo => (
                    <SortablePhotoCard 
                        key={photo.id} 
                        photo={photo}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        disabled={loading}
                    />
                ))}
            </SortableContext>
        </DndContext>
    );
}
```

## File Upload Guidelines

### Image Requirements

**Banner Image**:
- **Recommended Size**: 1200x800 pixels or higher
- **Aspect Ratio**: 3:2 (landscape)
- **Auto-resize**: Yes, to max 1200x800
- **Formats**: JPG, PNG, GIF, WebP
- **Max File Size**: 10MB

**Logos**:
- **Recommended**: Square (1:1) or horizontal (2:1) 
- **Minimum Size**: 200x200 pixels
- **Auto-resize**: No (use optimized files)
- **Formats**: PNG (for transparency), JPG, SVG
- **Max File Size**: 5MB

**Event Photos**:
- **Recommended Size**: 800x600 pixels or higher
- **Auto-resize**: No (upload optimized files)
- **Formats**: JPG, PNG, GIF, WebP
- **Max File Size**: 8MB per photo

**Event Video**:
- **Formats**: MP4, MOV, AVI, WebM
- **Max File Size**: 100MB
- **Recommendation**: Use YouTube/Vimeo embed for large videos

### Embed URL Guidelines

**Google Maps Embed**:
```html
<!-- Correct format -->
https://www.google.com/maps/embed?pb=!1m18!1m12...

<!-- From Google Maps -->
1. Search for location
2. Click "Share" → "Embed a map"  
3. Copy the src URL from iframe
```

**YouTube Embed**:
```html
<!-- Correct format -->
https://www.youtube.com/embed/VIDEO_ID

<!-- From YouTube -->
1. Click "Share" → "Embed"
2. Copy the src URL from iframe
```

### File Upload Examples

**Single File Upload**:
```javascript
async function uploadEventPhoto(eventId, file, caption, token) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('caption', caption);
    formData.append('order', 0);
    formData.append('is_featured', false);
    
    try {
        const response = await fetch(
            `/api/events/${eventId}/photos/`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            }
        );
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Photo upload error:', error);
        return null;
    }
}
```

**Multiple File Upload with Progress**:
```javascript
async function uploadMultiplePhotos(eventId, files, token, onProgress) {
    const uploads = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);
        formData.append('caption', `Photo ${i + 1}`);
        formData.append('order', i);
        
        try {
            const response = await fetch(
                `/api/events/${eventId}/photos/`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                }
            );
            
            if (response.ok) {
                const result = await response.json();
                uploads.push(result);
                onProgress?.(i + 1, files.length);
            } else {
                console.error(`Failed to upload ${file.name}`);
            }
        } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
        }
    }
    
    return uploads;
}
```

## Testing Examples

### cURL Commands

**Get JWT Token**:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "organizer@example.com", "password": "password123"}'
```

**Get Event Media**:
```bash
curl -X GET "http://localhost:8000/api/events/EVENT_ID/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update Media URLs**:
```bash
curl -X PATCH "http://localhost:8000/api/events/EVENT_ID/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "google_map_embed_link": "https://maps.google.com/embed?pb=12345",
    "youtube_embed_link": "https://www.youtube.com/embed/VIDEO_ID"
  }'
```

**Upload Banner Image**:
```bash
curl -X PATCH "http://localhost:8000/api/events/EVENT_ID/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "banner_image=@banner.jpg"
```

**List Event Photos**:
```bash
curl -X GET "http://localhost:8000/api/events/EVENT_ID/photos/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Upload Event Photo**:
```bash
curl -X POST "http://localhost:8000/api/events/EVENT_ID/photos/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@photo.jpg" \
  -F "caption=Conference venue" \
  -F "order=0" \
  -F "is_featured=true"
```

**Bulk Reorder Photos**:
```bash
curl -X PATCH "http://localhost:8000/api/events/EVENT_ID/photos/bulk-reorder/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      {"id": 3, "order": 0},
      {"id": 1, "order": 1},
      {"id": 2, "order": 2}
    ]
  }'
```

**Delete Photo**:
```bash
curl -X DELETE "http://localhost:8000/api/events/EVENT_ID/photos/PHOTO_ID/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Frontend Implementation

### Media Tab Component Structure

```javascript
function EventMediaTab({ eventId, eventData, onUpdate }) {
    const [activeSection, setActiveSection] = useState('basic');
    
    return (
        <div className="media-tab">
            <div className="media-nav">
                <button 
                    className={activeSection === 'basic' ? 'active' : ''}
                    onClick={() => setActiveSection('basic')}
                >
                    Basic Media
                </button>
                <button 
                    className={activeSection === 'gallery' ? 'active' : ''}
                    onClick={() => setActiveSection('gallery')}
                >
                    Photo Gallery
                </button>
                <button 
                    className={activeSection === 'embed' ? 'active' : ''}
                    onClick={() => setActiveSection('embed')}
                >
                    Embeds
                </button>
            </div>
            
            <div className="media-content">
                {activeSection === 'basic' && (
                    <BasicMediaSection 
                        eventData={eventData} 
                        onUpdate={onUpdate} 
                    />
                )}
                {activeSection === 'gallery' && (
                    <PhotoGallerySection 
                        eventId={eventId} 
                    />
                )}
                {activeSection === 'embed' && (
                    <EmbedSection 
                        eventData={eventData} 
                        onUpdate={onUpdate} 
                    />
                )}
            </div>
        </div>
    );
}
```

### Basic Media Section

```javascript
function BasicMediaSection({ eventData, onUpdate }) {
    const [uploading, setUploading] = useState({});
    
    const handleFileUpload = async (field, file) => {
        setUploading(prev => ({ ...prev, [field]: true }));
        
        const formData = new FormData();
        formData.append(field, file);
        
        try {
            const response = await fetch(
                `/api/events/${eventData.id}/`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    },
                    body: formData
                }
            );
            
            if (response.ok) {
                const updated = await response.json();
                onUpdate(updated);
            }
        } catch (error) {
            console.error(`Failed to upload ${field}:`, error);
        } finally {
            setUploading(prev => ({ ...prev, [field]: false }));
        }
    };
    
    return (
        <div className="basic-media">
            <MediaUploadField
                label="Event Banner"
                currentImage={eventData.banner_image}
                onUpload={(file) => handleFileUpload('banner_image', file)}
                uploading={uploading.banner_image}
                accept="image/*"
                recommendations="Recommended: 1200x800px, JPG/PNG"
            />
            
            <MediaUploadField
                label="Primary Logo"
                currentImage={eventData.logo_one}
                onUpload={(file) => handleFileUpload('logo_one', file)}
                uploading={uploading.logo_one}
                accept="image/*"
                recommendations="Recommended: Square format, PNG for transparency"
            />
            
            <MediaUploadField
                label="Secondary Logo"
                currentImage={eventData.logo_two}
                onUpload={(file) => handleFileUpload('logo_two', file)}
                uploading={uploading.logo_two}
                accept="image/*"
                recommendations="For sponsors, partners, or co-organizers"
            />
            
            <MediaUploadField
                label="Event Video"
                currentFile={eventData.event_video}
                onUpload={(file) => handleFileUpload('event_video', file)}
                uploading={uploading.event_video}
                accept="video/*"
                recommendations="Max 100MB. Consider YouTube embed for large files."
            />
        </div>
    );
}
```

### Photo Gallery Section

```javascript
function PhotoGallerySection({ eventId }) {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    useEffect(() => {
        fetchPhotos();
    }, [eventId]);
    
    const fetchPhotos = async () => {
        try {
            const response = await fetch(
                `/api/events/${eventId}/photos/`,
                {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    }
                }
            );
            
            const data = await response.json();
            setPhotos(data.results);
        } catch (error) {
            console.error('Failed to fetch photos:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handlePhotoUpload = async (files) => {
        setUploading(true);
        
        for (const file of files) {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('caption', file.name.replace(/\.[^/.]+$/, ''));
            formData.append('order', photos.length);
            
            try {
                const response = await fetch(
                    `/api/events/${eventId}/photos/`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${getToken()}`
                        },
                        body: formData
                    }
                );
                
                if (response.ok) {
                    const newPhoto = await response.json();
                    setPhotos(prev => [...prev, newPhoto]);
                }
            } catch (error) {
                console.error('Photo upload failed:', error);
            }
        }
        
        setUploading(false);
    };
    
    return (
        <div className="photo-gallery">
            <div className="upload-area">
                <FileDropZone
                    onFilesSelected={handlePhotoUpload}
                    accept="image/*"
                    multiple
                    disabled={uploading}
                >
                    {uploading ? 'Uploading...' : 'Drop photos here or click to browse'}
                </FileDropZone>
            </div>
            
            <PhotoGalleryManager
                eventId={eventId}
                photos={photos}
                onPhotosReordered={setPhotos}
                onPhotoUpdated={(updatedPhoto) => {
                    setPhotos(prev => prev.map(p => 
                        p.id === updatedPhoto.id ? updatedPhoto : p
                    ));
                }}
                onPhotoDeleted={(photoId) => {
                    setPhotos(prev => prev.filter(p => p.id !== photoId));
                }}
            />
        </div>
    );
}
```

### Embed Section

```javascript
function EmbedSection({ eventData, onUpdate }) {
    const [formData, setFormData] = useState({
        google_map_embed_link: eventData.google_map_embed_link || '',
        youtube_embed_link: eventData.youtube_embed_link || ''
    });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch(
                `/api/events/${eventData.id}/`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${getToken()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                }
            );
            
            if (response.ok) {
                const updated = await response.json();
                onUpdate(updated);
            }
        } catch (error) {
            console.error('Failed to update embeds:', error);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="embed-section">
            <div className="form-group">
                <label>Google Maps Embed URL</label>
                <input
                    type="url"
                    value={formData.google_map_embed_link}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        google_map_embed_link: e.target.value
                    }))}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                />
                <small>Get from Google Maps → Share → Embed a map</small>
                
                {formData.google_map_embed_link && (
                    <div className="preview">
                        <iframe
                            src={formData.google_map_embed_link}
                            width="100%"
                            height="200"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                        />
                    </div>
                )}
            </div>
            
            <div className="form-group">
                <label>YouTube Embed URL</label>
                <input
                    type="url"
                    value={formData.youtube_embed_link}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        youtube_embed_link: e.target.value
                    }))}
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                />
                <small>Get from YouTube → Share → Embed</small>
                
                {formData.youtube_embed_link && (
                    <div className="preview">
                        <iframe
                            src={formData.youtube_embed_link}
                            width="100%"
                            height="200"
                            frameBorder="0"
                            allowFullScreen
                        />
                    </div>
                )}
            </div>
            
            <button type="submit">Update Embeds</button>
        </form>
    );
}
```

## Best Practices

### 1. Image Optimization

**Before Upload**:
- Compress images using tools like TinyPNG or ImageOptim
- Use appropriate formats: JPG for photos, PNG for logos with transparency
- Resize images to recommended dimensions before upload

**Storage Management**:
- Regularly clean up unused media files
- Consider CDN for better performance
- Implement lazy loading for photo galleries

### 2. User Experience

**Upload Feedback**:
- Show upload progress for large files
- Display image previews before upload
- Provide clear error messages for failed uploads

**Drag & Drop**:
- Visual feedback during drag operations
- Smooth animations for reordering
- Optimistic updates with rollback on failure

### 3. Performance

**Loading Strategy**:
```javascript
// Lazy load photo gallery
const PhotoGallery = lazy(() => import('./PhotoGallery'));

// Use intersection observer for image loading
const LazyImage = ({ src, alt, ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef();
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        
        if (imgRef.current) {
            observer.observe(imgRef.current);
        }
        
        return () => observer.disconnect();
    }, []);
    
    return (
        <div ref={imgRef} {...props}>
            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={() => setIsLoaded(true)}
                    style={{
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.3s'
                    }}
                />
            )}
        </div>
    );
};
```

### 4. Security

**File Validation**:
```javascript
function validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPG, PNG, GIF, or WebP images.');
    }
    
    if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 10MB.');
    }
    
    return true;
}
```

## Error Handling

### Common Error Responses

**400 Bad Request** (File Upload):
```json
{
    "banner_image": ["Upload a valid image. The file you uploaded was either not an image or a corrupted image."],
    "youtube_embed_link": ["Enter a valid URL."]
}
```

**413 Request Entity Too Large**:
```json
{
    "detail": "Request entity too large. Maximum file size is 10MB."
}
```

**401 Unauthorized**:
```json
{
    "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden**:
```json
{
    "detail": "You do not have permission to perform this action."
}
```

### Error Handling Example

```javascript
async function handleMediaUpload(eventId, field, file, token) {
    try {
        // Validate file
        validateImageFile(file);
        
        const formData = new FormData();
        formData.append(field, file);
        
        const response = await fetch(
            `/api/events/${eventId}/`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            
            switch (response.status) {
                case 400:
                    // Show field-specific errors
                    Object.entries(error).forEach(([field, messages]) => {
                        if (Array.isArray(messages)) {
                            showError(`${field}: ${messages.join(', ')}`);
                        }
                    });
                    break;
                case 413:
                    showError('File too large. Please choose a smaller image.');
                    break;
                case 401:
                    redirectToLogin();
                    break;
                case 403:
                    showError('You do not have permission to upload media.');
                    break;
                default:
                    showError('Upload failed. Please try again.');
            }
            return null;
        }
        
        return await response.json();
    } catch (error) {
        if (error.message) {
            showError(error.message);
        } else {
            showError('Network error. Please check your connection and try again.');
        }
        return null;
    }
}

function showError(message) {
    // Your error display implementation
    console.error(message);
    // Show toast notification, modal, etc.
}
```

## Version History

- **v1.0** (2025-01-28): Initial release with comprehensive media management, photo gallery with drag-and-drop reordering, and embed support