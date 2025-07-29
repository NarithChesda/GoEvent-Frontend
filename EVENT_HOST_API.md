# Event Host API Documentation

## Overview

The Event Host API provides comprehensive management of event hosts with multi-language support, drag-and-drop reordering, and detailed profile information. This API handles speaker and host profiles for events, including social media links, bio information, and translations.

## Base URL

All host endpoints are nested under events:
```
/api/events/{event_pk}/hosts/
```

**Authentication**: JWT Bearer Token required for private events and all modifications  
**Content-Type**: `application/json`

## Table of Contents

1. [Permission System](#permission-system)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Multi-Language Support](#multi-language-support)
5. [Drag-and-Drop Reordering](#drag-and-drop-reordering)
6. [Frontend Implementation Guide](#frontend-implementation-guide)
7. [Testing Examples](#testing-examples)
8. [Best Practices](#best-practices)
9. [Error Handling](#error-handling)

## Permission System

The Event Host API uses the `IsEventAgendaEditor` permission class with the following access control:

### **Read Access (GET)**
| User Type | Public Event | Private Event |
|-----------|--------------|---------------|
| **Unauthenticated User** | ✅ Allowed | ❌ 401 Unauthorized |
| **Event Organizer** | ✅ Allowed | ✅ Allowed |
| **Admin Collaborator** | ✅ Allowed | ✅ Allowed |
| **Editor Collaborator** | ✅ Allowed | ✅ Allowed |
| **Viewer Collaborator** | ✅ Allowed | ✅ Allowed |
| **Registered Attendee** | ✅ Allowed | ✅ Allowed |
| **Random Authenticated User** | ✅ Allowed | ❌ 403 Forbidden |

### **Write Access (POST/PUT/PATCH/DELETE)**
| User Type | Public Event | Private Event |
|-----------|--------------|---------------|
| **Unauthenticated User** | ❌ 401 Unauthorized | ❌ 401 Unauthorized |
| **Event Organizer** | ✅ Full CRUD | ✅ Full CRUD |
| **Admin Collaborator** | ✅ Full CRUD | ✅ Full CRUD |
| **Editor Collaborator** | ✅ Full CRUD | ✅ Full CRUD |
| **Viewer Collaborator** | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Registered Attendee** | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Random Authenticated User** | ❌ 403 Forbidden | ❌ 403 Forbidden |

## API Endpoints

### 1. List Event Hosts

Retrieves all hosts for an event, ordered by order field then name.

**Endpoint**: `GET /api/events/{event_pk}/hosts/`

**Permissions**: See permission matrix above

**Query Parameters**: None (automatic ordering by order, then name)

**Response Example** (Verified):
```json
{
    "count": 3,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 9,
            "name": "Prof. Michael Chen",
            "parent_a_name": "",
            "parent_b_name": "",
            "title": "Data Science Director",
            "bio": "Renowned researcher in big data analytics and cloud computing solutions.",
            "profile_image": null,
            "email": "m.chen@university.edu",
            "linkedin_url": "https://linkedin.com/in/michaelchen",
            "twitter_url": "",
            "website_url": "",
            "order": 0,
            "translations": [
                {
                    "id": 4,
                    "language": "fr",
                    "name": "Prof. Michael Chen",
                    "parent_a_name": "",
                    "parent_b_name": "",
                    "title": "Directeur de Science des Donnees",
                    "bio": "Chercheur renomme en analyse de donnees massives.",
                    "created_at": "2025-07-28T07:03:23.114882Z",
                    "updated_at": "2025-07-28T07:03:23.114882Z"
                },
                {
                    "id": 5,
                    "language": "ja",
                    "name": "Prof. Michael Chen",
                    "parent_a_name": "",
                    "parent_b_name": "",
                    "title": "Data Science Director",
                    "bio": "Big data analytics researcher",
                    "created_at": "2025-07-28T07:03:23.127958Z",
                    "updated_at": "2025-07-28T07:03:23.127958Z"
                }
            ]
        },
        {
            "id": 8,
            "name": "Dr. Jane Smith",
            "parent_a_name": "",
            "parent_b_name": "",
            "title": "Chief Technology Officer",
            "bio": "Leading expert in artificial intelligence and machine learning with over 15 years of experience.",
            "profile_image": null,
            "email": "jane.smith@tech.com",
            "linkedin_url": "https://linkedin.com/in/janesmith",
            "twitter_url": "https://twitter.com/janesmith_tech",
            "website_url": "https://janesmith-updated.tech",
            "order": 1,
            "translations": [
                {
                    "id": 3,
                    "language": "fr",
                    "name": "Dr. Jane Smith",
                    "parent_a_name": "",
                    "parent_b_name": "",
                    "title": "Directrice Technique",
                    "bio": "Experte de premier plan en intelligence artificielle et apprentissage automatique avec plus de 15 ans d'experience.",
                    "created_at": "2025-07-28T07:03:06.646309Z",
                    "updated_at": "2025-07-28T07:03:06.646309Z"
                }
            ]
        }
    ]
}
```

### 2. Create Event Host

Creates a new event host with optional translations.

**Endpoint**: `POST /api/events/{event_pk}/hosts/`

**Permissions**: Must be event organizer or admin/editor collaborator

**Request Body** (Verified):
```json
{
    "name": "Dr. Jane Smith",
    "parent_a_name": "",
    "parent_b_name": "",
    "title": "Chief Technology Officer",
    "bio": "Leading expert in artificial intelligence and machine learning with over 15 years of experience.",
    "email": "jane.smith@tech.com",
    "linkedin_url": "https://linkedin.com/in/janesmith",
    "twitter_url": "https://twitter.com/janesmith_tech",
    "website_url": "https://janesmith.tech",
    "order": 0,
    "translations": [
        {
            "language": "fr",
            "name": "Dr. Jane Smith",
            "title": "Directrice Technique",
            "bio": "Experte de premier plan en intelligence artificielle et apprentissage automatique avec plus de 15 ans d'experience."
        },
        {
            "language": "ja",
            "name": "Dr. Jane Smith",
            "title": "最高技術責任者",
            "bio": "15年以上の経験を持つAIと機械学習の第一人者"
        }
    ]
}
```

**Response (201 Created)**:
```json
{
    "id": 8,
    "name": "Dr. Jane Smith",
    "parent_a_name": "",
    "parent_b_name": "",
    "title": "Chief Technology Officer",
    "bio": "Leading expert in artificial intelligence and machine learning with over 15 years of experience.",
    "profile_image": null,
    "email": "jane.smith@tech.com",
    "linkedin_url": "https://linkedin.com/in/janesmith",
    "twitter_url": "https://twitter.com/janesmith_tech",
    "website_url": "https://janesmith.tech",
    "order": 0,
    "translations": [
        {
            "id": 3,
            "language": "fr",
            "name": "Dr. Jane Smith",
            "parent_a_name": "",
            "parent_b_name": "",
            "title": "Directrice Technique",
            "bio": "Experte de premier plan en intelligence artificielle et apprentissage automatique avec plus de 15 ans d'experience.",
            "created_at": "2025-07-28T07:03:06.646309Z",
            "updated_at": "2025-07-28T07:03:06.646309Z"
        }
    ]
}
```

**Error Responses**:
- `400 Bad Request`: Invalid data (e.g., missing required fields, invalid email format)
- `401 Unauthorized`: Authentication credentials not provided
- `403 Forbidden`: User does not have permission to add hosts
- `404 Not Found`: Event does not exist

### 3. Retrieve Specific Host

Get details of a single host with all translations.

**Endpoint**: `GET /api/events/{event_pk}/hosts/{id}/`

**Permissions**: Same as list permissions

**Response**: Single host object with same structure as list response

### 4. Update Event Host

Updates a host and its translations.

**Endpoint**: `PUT /api/events/{event_pk}/hosts/{id}/` (full update)  
**Endpoint**: `PATCH /api/events/{event_pk}/hosts/{id}/` (partial update)

**Permissions**: Must be event organizer or admin/editor collaborator

**Important Notes**:
- When `translations` array is provided, ALL existing translations are replaced
- To add a new translation without affecting others, first GET the host, add to the translations array, then PUT/PATCH
- Omitting `translations` in PATCH request preserves existing translations

**PATCH Example** (updating website only):
```json
{
    "website_url": "https://janesmith-updated.tech"
}
```

**PUT Example** (replacing all translations):
```json
{
    "name": "Dr. Jane Smith",
    "title": "Chief Technology Officer & AI Research Lead",
    "bio": "Leading expert in AI and ML with 15+ years of experience",
    "email": "jane.smith@tech.com",
    "linkedin_url": "https://linkedin.com/in/janesmith",
    "twitter_url": "https://twitter.com/janesmith_tech",
    "website_url": "https://janesmith-updated.tech",
    "order": 0,
    "translations": [
        {
            "language": "fr",
            "name": "Dr. Jane Smith",
            "title": "Directrice Technique et Responsable Recherche IA",
            "bio": "Experte en IA et ML avec 15+ ans d'experience"
        },
        {
            "language": "es",
            "name": "Dra. Jane Smith",
            "title": "Directora de Tecnología e Investigación de IA",
            "bio": "Experta líder en IA y ML con 15+ años de experiencia"
        }
    ]
}
```

### 5. Delete Event Host

Deletes a host and all its translations (cascade delete).

**Endpoint**: `DELETE /api/events/{event_pk}/hosts/{id}/`

**Permissions**: Must be event organizer or admin/editor collaborator

**Response**: 204 No Content

### 6. Bulk Reorder Event Hosts

Updates the order of multiple hosts in a single request. Optimized for drag-and-drop functionality.

**Endpoint**: `PATCH /api/events/{event_pk}/hosts/bulk-reorder/`

**Permissions**: Must be event organizer or admin/editor collaborator

**Request Body** (Verified):
```json
{
    "updates": [
        {"id": 9, "order": 0},
        {"id": 8, "order": 1},
        {"id": 6, "order": 2}
    ]
}
```

**Response**:
```json
{
    "status": "orders updated",
    "count": 3
}
```

**Validation**:
- All host IDs must belong to the specified event
- Returns 400 Bad Request if any ID is invalid
- Transaction ensures atomicity - either all updates succeed or none

## Data Models

### EventHost Model

| Field | Type | Description | Required | Default |
|-------|------|-------------|----------|---------|
| id | integer | Unique identifier | Auto-generated | - |
| name | string(100) | Host name (primary language) | Yes | - |
| parent_a_name | string(100) | First parent's name (if applicable) | No | "" |
| parent_b_name | string(100) | Second parent's name (if applicable) | No | "" |
| title | string(100) | Professional title/position | No | "" |
| bio | text | Biography/description | No | "" |
| profile_image | image | Profile photo (auto-resized to 400x400) | No | null |
| email | email | Contact email | No | "" |
| linkedin_url | url | LinkedIn profile URL | No | "" |
| twitter_url | url | Twitter profile URL | No | "" |
| website_url | url | Personal/company website | No | "" |
| order | integer | Display order | Yes | 0 |

### EventHostTranslation Model

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | integer | Unique identifier | Auto-generated |
| host | foreign key | Related host | Yes |
| language | string(10) | Language code | Yes |
| name | string(100) | Translated name | Yes |
| parent_a_name | string(100) | Translated first parent name | No |
| parent_b_name | string(100) | Translated second parent name | No |
| title | string(100) | Translated title | No |
| bio | text | Translated biography | No |

### Supported Languages (Verified)

| Code | Language |
|------|----------|
| en | English |
| kh | Khmer |
| fr | French |
| ja | Japanese |
| ko | Korean |
| zh-cn | Chinese (Simplified) |
| th | Thai |
| vn | Vietnamese |

**Note**: Use the exact language codes shown above. `km` (ISO 639-1) is not supported - use `kh` instead.

## Multi-Language Support

### Translation Strategy

1. **Primary Content**: Store default content in main model fields (usually English)
2. **Translations**: Store language variations in the translations array
3. **Fallback**: If translation missing, display primary content
4. **Atomic Creation**: Create host and all translations in single API call

### Managing Translations

**Creating host with translations**:
```javascript
const hostData = {
    name: "Dr. Sarah Johnson",
    title: "AI Research Director",
    bio: "Leading researcher in artificial intelligence",
    email: "sarah@university.edu",
    order: 0,
    translations: [
        {
            language: "fr",
            name: "Dr. Sarah Johnson",
            title: "Directrice de Recherche IA",
            bio: "Chercheuse leader en intelligence artificielle"
        },
        {
            language: "kh",
            name: "វេជ្ជបណ្ឌិត Sarah Johnson",
            title: "នាយកការស្រាវជ្រាវ AI",
            bio: "អ្នកស្រាវជ្រាវនាំមុខក្នុងការស្រាវជ្រាវបញ្ញាសិប្បនិម"
        }
    ]
};

const response = await fetch(`/api/events/${eventId}/hosts/`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(hostData)
});
```

**Adding translation to existing host**:
```javascript
// 1. Fetch current host
const host = await fetch(`/api/events/${eventId}/hosts/${hostId}/`);
const data = await host.json();

// 2. Add new translation
data.translations.push({
    language: "es",
    name: "Dra. Sarah Johnson",
    title: "Directora de Investigación de IA",
    bio: "Investigadora líder en inteligencia artificial"
});

// 3. Update host
await fetch(`/api/events/${eventId}/hosts/${hostId}/`, {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
});
```

### Image Handling

- **Profile Images**: Automatically resized to 400x400 pixels on upload
- **Supported Formats**: JPG, PNG, GIF, WebP
- **Storage**: Uploaded to `media/host_profiles/` directory
- **URL Format**: `http://domain.com/media/host_profiles/filename.jpg`

## Drag-and-Drop Reordering

### Implementation Flow

1. **Initial Load**: Fetch hosts (already sorted by order)
2. **Drag Start**: Store original positions
3. **Drag End**: Calculate new positions  
4. **Optimistic Update**: Update UI immediately
5. **API Call**: Send bulk update request
6. **Rollback**: On failure, restore original positions

### Frontend Example (React with @dnd-kit)

```javascript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

function HostManager({ eventId, token }) {
    const [hosts, setHosts] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        
        if (active.id !== over.id) {
            const oldIndex = hosts.findIndex(h => h.id === active.id);
            const newIndex = hosts.findIndex(h => h.id === over.id);
            
            // Optimistic update
            const newHosts = arrayMove(hosts, oldIndex, newIndex);
            setHosts(newHosts);
            
            // Prepare bulk update
            const updates = newHosts.map((host, index) => ({
                id: host.id,
                order: index
            }));
            
            try {
                setLoading(true);
                const response = await fetch(
                    `/api/events/${eventId}/hosts/bulk-reorder/`,
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
                setHosts(hosts);
                console.error('Failed to reorder:', error);
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
                items={hosts.map(host => host.id)}
                strategy={verticalListSortingStrategy}
            >
                {hosts.map(host => (
                    <SortableHostCard 
                        key={host.id} 
                        host={host}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ))}
            </SortableContext>
        </DndContext>
    );
}
```

## Testing Examples

### cURL Commands (Verified)

**Get JWT Token**:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@goevent.com", "password": "admin123"}'
```

**Get all hosts (Public Event - No Auth Required)**:
```bash
curl -X GET "http://localhost:8000/api/events/2345939d-ebe0-41f2-be1a-60fba67601b5/hosts/"
```

**Get all hosts (Private Event - Auth Required)**:
```bash
curl -X GET "http://localhost:8000/api/events/e4c29733-c545-41c9-a2fb-6a9d69dfc9f0/hosts/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create host with translations**:
```bash
curl -X POST "http://localhost:8000/api/events/2345939d-ebe0-41f2-be1a-60fba67601b5/hosts/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Jane Smith",
    "title": "Chief Technology Officer",
    "bio": "Leading expert in AI and ML with 15+ years of experience",
    "email": "jane.smith@tech.com",
    "linkedin_url": "https://linkedin.com/in/janesmith",
    "website_url": "https://janesmith.tech",
    "order": 0,
    "translations": [
        {
            "language": "fr",
            "name": "Dr. Jane Smith",
            "title": "Directrice Technique",
            "bio": "Experte en IA et ML avec 15+ ans dexperience"
        }
    ]
}'
```

**Update host**:
```bash
curl -X PATCH "http://localhost:8000/api/events/2345939d-ebe0-41f2-be1a-60fba67601b5/hosts/8/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"website_url": "https://janesmith-updated.tech"}'
```

**Delete host**:
```bash
curl -X DELETE "http://localhost:8000/api/events/2345939d-ebe0-41f2-be1a-60fba67601b5/hosts/1/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Bulk reorder hosts**:
```bash
curl -X PATCH "http://localhost:8000/api/events/2345939d-ebe0-41f2-be1a-60fba67601b5/hosts/bulk-reorder/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
        {"id": 9, "order": 0},
        {"id": 8, "order": 1},
        {"id": 6, "order": 2}
    ]
}'
```

### Permission Testing Results (Verified)

| Test Case | Expected | Actual | Status |
|-----------|----------|---------|---------|
| Public event + No auth + GET | ✅ 200 OK | ✅ 200 OK | ✅ Pass |
| Private event + No auth + GET | ❌ 401 | ❌ 401 | ✅ Pass |
| Public event + No auth + POST | ❌ 401 | ❌ 401 | ✅ Pass |
| Private event + Auth (organizer) + GET | ✅ 200 OK | ✅ 200 OK | ✅ Pass |
| Private event + Auth (organizer) + POST | ✅ 201 Created | ✅ 201 Created | ✅ Pass |
| Private event + Auth (organizer) + PATCH | ✅ 200 OK | ✅ 200 OK | ✅ Pass |
| Private event + Auth (organizer) + DELETE | ✅ 204 No Content | ✅ 204 No Content | ✅ Pass |
| Bulk reorder + Auth (organizer) | ✅ 200 OK | ✅ 200 OK | ✅ Pass |

## Frontend Implementation Guide

### State Structure (TypeScript)

```typescript
interface EventHost {
    id: number;
    name: string;
    parent_a_name: string;
    parent_b_name: string;
    title: string;
    bio: string;
    profile_image: string | null;
    email: string;
    linkedin_url: string;
    twitter_url: string;
    website_url: string;
    order: number;
    translations: HostTranslation[];
}

interface HostTranslation {
    id?: number;
    host?: number;
    language: string;
    name: string;
    parent_a_name: string;
    parent_b_name: string;
    title: string;
    bio: string;
    created_at?: string;
    updated_at?: string;
}
```

### Display Logic with Fallback

```javascript
function getLocalizedHostContent(host, userLanguage, fieldName) {
    // Find translation for user's language
    const translation = host.translations.find(
        t => t.language === userLanguage
    );
    
    // Return translated content or fallback to default
    return (translation && translation[fieldName]) || host[fieldName] || '';
}

// Usage
const name = getLocalizedHostContent(host, 'fr', 'name');
const title = getLocalizedHostContent(host, 'fr', 'title');
const bio = getLocalizedHostContent(host, 'fr', 'bio');
```

### Host Card Component

```javascript
function HostCard({ host, userLanguage = 'en', onEdit, onDelete }) {
    const localizedName = getLocalizedHostContent(host, userLanguage, 'name');
    const localizedTitle = getLocalizedHostContent(host, userLanguage, 'title');
    const localizedBio = getLocalizedHostContent(host, userLanguage, 'bio');

    return (
        <div className="host-card">
            {host.profile_image && (
                <img 
                    src={host.profile_image} 
                    alt={localizedName}
                    className="profile-image"
                />
            )}
            
            <div className="host-info">
                <h3>{localizedName}</h3>
                {localizedTitle && <p className="title">{localizedTitle}</p>}
                {localizedBio && <p className="bio">{localizedBio}</p>}
                
                <div className="social-links">
                    {host.email && (
                        <a href={`mailto:${host.email}`}>Email</a>
                    )}
                    {host.linkedin_url && (
                        <a href={host.linkedin_url} target="_blank">LinkedIn</a>
                    )}
                    {host.twitter_url && (
                        <a href={host.twitter_url} target="_blank">Twitter</a>
                    )}
                    {host.website_url && (
                        <a href={host.website_url} target="_blank">Website</a>
                    )}
                </div>
            </div>
            
            <div className="actions">
                <button onClick={() => onEdit(host)}>Edit</button>
                <button onClick={() => onDelete(host.id)}>Delete</button>
            </div>
        </div>
    );
}
```

### Form Validation

```javascript
function validateHostForm(hostData) {
    const errors = {};
    
    // Required fields
    if (!hostData.name?.trim()) {
        errors.name = 'Name is required';
    }
    
    // Email validation
    if (hostData.email && !/\S+@\S+\.\S+/.test(hostData.email)) {
        errors.email = 'Invalid email format';
    }
    
    // URL validation
    const urlFields = ['linkedin_url', 'twitter_url', 'website_url'];
    urlFields.forEach(field => {
        if (hostData[field] && !isValidUrl(hostData[field])) {
            errors[field] = 'Invalid URL format';
        }
    });
    
    // Translation validation
    if (hostData.translations) {
        hostData.translations.forEach((translation, index) => {
            if (!translation.name?.trim()) {
                errors[`translations[${index}].name`] = 'Translated name is required';
            }
        });
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}
```

## Best Practices

### 1. Performance Optimization

- **Prefetch translations**: Backend uses `prefetch_related('translations')`
- **Batch operations**: Use bulk reorder for multiple changes
- **Image optimization**: Profile images auto-resized to 400x400
- **Cache localized content**: Store user's language choice

### 2. User Experience

- **Visual feedback**: Show loading states during operations
- **Optimistic updates**: Update UI before API response
- **Error recovery**: Graceful fallbacks and rollbacks
- **Accessibility**: Alt text for profile images, keyboard navigation

### 3. Data Integrity

- **Unique constraints**: Enforced unique language per host
- **Order validation**: Ensure sequential ordering (0, 1, 2...)
- **Transaction safety**: Bulk updates in single transaction
- **Cascade deletes**: Translations deleted with host

### 4. Image Management

- **Automatic resizing**: Server resizes images to 400x400 on upload
- **Format support**: JPG, PNG, GIF, WebP accepted
- **Storage optimization**: Images stored in organized directory structure
- **Lazy loading**: Load profile images as needed in UI

## Error Handling

### Common Error Responses (Verified)

**400 Bad Request**
```json
{
    "email": ["Enter a valid email address."],
    "translations": [
        {"name": ["This field is required."]}
    ]
}
```

**401 Unauthorized**
```json
{
    "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden**
```json
{
    "detail": "You do not have permission to perform this action."
}
```

**404 Not Found**
```json
{
    "detail": "Not found."
}
```

### Error Handling Strategy

```javascript
async function handleHostApiCall(apiCall) {
    try {
        const response = await apiCall();
        
        if (!response.ok) {
            const error = await response.json();
            
            switch (response.status) {
                case 400:
                    // Validation error - show field errors
                    Object.keys(error).forEach(field => {
                        if (Array.isArray(error[field])) {
                            console.error(`${field}: ${error[field].join(', ')}`);
                        }
                    });
                    break;
                case 401:
                    // Redirect to login
                    window.location.href = '/login';
                    break;
                case 403:
                    // Permission denied
                    alert('You do not have permission to perform this action');
                    break;
                case 404:
                    // Not found
                    console.error('Host not found');
                    break;
                default:
                    console.error('API error:', error);
            }
            
            throw new Error(error.detail || 'API call failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Network error:', error);
        throw error;
    }
}
```

### Validation Rules

1. **Required Fields**: `name` (in both main record and translations)
2. **Field Lengths**: name (100 chars), title (100 chars), email (254 chars)
3. **Email Format**: Must be valid email address if provided
4. **URL Format**: Must be valid URLs if provided
5. **Language Codes**: Must match supported language choices
6. **Order Values**: Non-negative integers
7. **Image Files**: JPG, PNG, GIF, WebP formats only

### File Upload Handling

```javascript
async function uploadHostWithImage(hostData, imageFile) {
    const formData = new FormData();
    
    // Add host data
    Object.keys(hostData).forEach(key => {
        if (key !== 'translations' && key !== 'profile_image') {
            formData.append(key, hostData[key]);
        }
    });
    
    // Add translations as JSON
    if (hostData.translations) {
        formData.append('translations', JSON.stringify(hostData.translations));
    }
    
    // Add image file
    if (imageFile) {
        formData.append('profile_image', imageFile);
    }
    
    const response = await fetch(`/api/events/${eventId}/hosts/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type for FormData
        },
        body: formData
    });
    
    return response.json();
}
```

## Version History

- **v1.0** (2025-01-28): Initial release with multi-language support, drag-and-drop reordering, and profile image handling