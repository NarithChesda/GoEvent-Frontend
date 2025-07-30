# Event Agenda API Documentation

## Overview

The Event Agenda API provides comprehensive management of agenda items for events with multi-language support, drag-and-drop reordering, and flexible scheduling options. This API handles complex event programs with multiple days, sessions, and languages while enforcing strict permission controls.

## Base URL

All agenda endpoints are nested under events:
```
/api/events/{event_pk}/agenda/
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

The Event Agenda API uses the `IsEventAgendaEditor` permission class with the following access control:

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

### 1. List Agenda Items

Retrieves all agenda items for an event, ordered by date and order field.

**Endpoint**: `GET /api/events/{event_pk}/agenda/`

**Permissions**: See permission matrix above

**Query Parameters**: None (automatic ordering by date, then order)

**Response Example** (Verified):
```json
{
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "title": "Opening Session 1",
            "description": "",
            "agenda_type": "session",
            "date": null,
            "date_text": "",
            "start_time_text": "09:00 AM",
            "end_time_text": "10:00 AM",
            "speaker": "",
            "location": "",
            "virtual_link": "",
            "order": 0,
            "is_featured": false,
            "color": "#3498db",
            "translations": []
        },
        {
            "id": 7,
            "title": "Coffee Break",
            "description": "Networking coffee break with refreshments",
            "agenda_type": "break",
            "date": "2025-07-21",
            "date_text": "Day 1",
            "start_time_text": "10:30 AM",
            "end_time_text": "11:00 AM",
            "speaker": "",
            "location": "Main Lobby",
            "virtual_link": "",
            "order": 1,
            "is_featured": false,
            "color": "#27ae60",
            "translations": []
        }
    ]
}
```

### 2. Create Agenda Item

Creates a new agenda item with optional translations.

**Endpoint**: `POST /api/events/{event_pk}/agenda/`

**Permissions**: Must be event organizer or admin/editor collaborator

**Request Body** (Verified):
```json
{
    "title": "Coffee Break",
    "description": "Networking coffee break with refreshments",
    "agenda_type": "break",
    "date": "2025-07-21",
    "date_text": "Day 1",
    "start_time_text": "10:30 AM",
    "end_time_text": "11:00 AM",
    "speaker": "",
    "location": "Main Lobby",
    "virtual_link": "",
    "order": 1,
    "is_featured": false,
    "color": "#27ae60",
    "translations": [
        {
            "language": "fr",
            "title": "Pause cafe",
            "description": "Pause cafe avec rafraichissements",
            "date_text": "Jour 1",
            "start_time_text": "10h30",
            "end_time_text": "11h00",
            "speaker": ""
        }
    ]
}
```

**Response (201 Created)**:
```json
{
    "id": 7,
    "title": "Coffee Break",
    "description": "Networking coffee break with refreshments",
    "agenda_type": "break",
    "date": "2025-07-21",
    "date_text": "Day 1",
    "start_time_text": "10:30 AM",
    "end_time_text": "11:00 AM",
    "speaker": "",
    "location": "Main Lobby",
    "virtual_link": "",
    "order": 1,
    "is_featured": false,
    "color": "#27ae60",
    "translations": [
        {
            "id": 1,
            "agenda": 7,
            "language": "fr",
            "title": "Pause cafe",
            "description": "Pause cafe avec rafraichissements",
            "date_text": "Jour 1",
            "start_time_text": "10h30",
            "end_time_text": "11h00",
            "speaker": "",
            "created_at": "2025-07-28T15:30:00Z",
            "updated_at": "2025-07-28T15:30:00Z"
        }
    ]
}
```

**Error Responses**:
- `400 Bad Request`: Invalid data (e.g., invalid agenda_type, missing required fields)
- `401 Unauthorized`: Authentication credentials not provided
- `403 Forbidden`: User does not have permission to add agenda items
- `404 Not Found`: Event does not exist

### 3. Retrieve Specific Agenda Item

Get details of a single agenda item with all translations.

**Endpoint**: `GET /api/events/{event_pk}/agenda/{id}/`

**Permissions**: Same as list permissions

**Response**: Single agenda item object with same structure as list response

### 4. Update Agenda Item

Updates an agenda item and its translations.

**Endpoint**: `PUT /api/events/{event_pk}/agenda/{id}/` (full update)  
**Endpoint**: `PATCH /api/events/{event_pk}/agenda/{id}/` (partial update)

**Permissions**: Must be event organizer or admin/editor collaborator

**Important Notes**:
- When `translations` array is provided, ALL existing translations are replaced
- To add a new translation without affecting others, first GET the item, add to the translations array, then PUT/PATCH
- Omitting `translations` in PATCH request preserves existing translations

**PATCH Example** (updating time only):
```json
{
    "end_time_text": "2:00 PM"
}
```

**PUT Example** (replacing all translations):
```json
{
    "title": "Extended Coffee Break",
    "description": "Extended networking coffee break with refreshments",
    "agenda_type": "break",
    "date": "2025-07-21",
    "date_text": "Day 1",
    "start_time_text": "10:30 AM",
    "end_time_text": "11:30 AM",
    "speaker": "",
    "location": "Main Lobby",
    "virtual_link": "",
    "order": 1,
    "is_featured": false,
    "color": "#27ae60",
    "translations": [
        {
            "language": "fr",
            "title": "Pause cafe prolongee",
            "description": "Pause cafe de reseautage prolongee",
            "date_text": "Jour 1",
            "start_time_text": "10h30",
            "end_time_text": "11h30",
            "speaker": ""
        }
    ]
}
```

### 5. Delete Agenda Item

Deletes an agenda item and all its translations (cascade delete).

**Endpoint**: `DELETE /api/events/{event_pk}/agenda/{id}/`

**Permissions**: Must be event organizer or admin/editor collaborator

**Response**: 204 No Content

### 6. Bulk Reorder Agenda Items

Updates the order of multiple agenda items in a single request. Optimized for drag-and-drop functionality.

**Endpoint**: `PATCH /api/events/{event_pk}/agenda/bulk-reorder/`

**Permissions**: Must be event organizer or admin/editor collaborator

**Request Body**:
```json
{
    "updates": [
        {"id": 7, "order": 0},
        {"id": 1, "order": 1},
        {"id": 8, "order": 2}
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
- All agenda item IDs must belong to the specified event
- Returns 400 Bad Request if any ID is invalid
- Transaction ensures atomicity - either all updates succeed or none

## Data Models

### EventAgenda Model

| Field | Type | Description | Required | Default |
|-------|------|-------------|----------|---------|
| id | integer | Unique identifier | Auto-generated | - |
| title | string(200) | Default title (primary language) | Yes | - |
| description | text | Default description | No | "" |
| agenda_type | string(20) | Type of agenda item | Yes | "session" |
| date | date | Date for grouping (YYYY-MM-DD) | No | null |
| date_text | string(100) | Display text for date | No | "" |
| start_time_text | string(50) | Display text for start time | No | "" |
| end_time_text | string(50) | Display text for end time | No | "" |
| speaker | string(100) | Speaker name(s) | No | "" |
| location | string(200) | Physical location | No | "" |
| virtual_link | url | Link for virtual attendance | No | "" |
| order | integer | Sort order within date | Yes | 0 |
| is_featured | boolean | Highlight this item | Yes | false |
| color | string(7) | Hex color for UI | Yes | "#3498db" |

### EventAgendaTranslation Model

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| id | integer | Unique identifier | Auto-generated |
| agenda | foreign key | Related agenda item | Yes |
| language | string(10) | Language code | Yes |
| title | string(200) | Translated title | Yes |
| description | text | Translated description | No |
| date_text | string(100) | Translated date display | No |
| start_time_text | string(50) | Translated start time | No |
| end_time_text | string(50) | Translated end time | No |
| speaker | string(100) | Translated speaker info | No |

### Agenda Types

| Value | Display Name | Use Case |
|-------|--------------|----------|
| session | Session | Regular presentation or talk |
| break | Break | Coffee break, lunch, etc. |
| networking | Networking | Dedicated networking time |
| keynote | Keynote | Keynote speech |
| workshop | Workshop | Hands-on or interactive session |
| panel | Panel Discussion | Multiple speakers discussion |
| other | Other | Any other type |

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
4. **Atomic Creation**: Create agenda item and all translations in single API call

### Managing Translations

**Creating item with translations**:
```javascript
const agendaData = {
    title: "Welcome Session",
    description: "Opening welcome session",
    agenda_type: "keynote",
    start_time_text: "9:00 AM",
    end_time_text: "10:00 AM",
    order: 0,
    translations: [
        {
            language: "fr",
            title: "Session de bienvenue",
            description: "Session d'ouverture de bienvenue"
        },
        {
            language: "kh",
            title: "សម័យស្វាគមន៍",
            description: "សម័យបើកស្វាគមន៍"
        }
    ]
};

const response = await fetch(`/api/events/${eventId}/agenda/`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(agendaData)
});
```

**Adding translation to existing item**:
```javascript
// 1. Fetch current item
const agenda = await fetch(`/api/events/${eventId}/agenda/${agendaId}/`);
const data = await agenda.json();

// 2. Add new translation
data.translations.push({
    language: "th",
    title: "เซสชันต้อนรับ",
    description: "เซสชันเปิดต้อนรับ"
});

// 3. Update item
await fetch(`/api/events/${eventId}/agenda/${agendaId}/`, {
    method: 'PUT',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
});
```

### Unicode Handling

- **API accepts UTF-8**: Full Unicode support for all languages
- **curl limitations**: When using curl with special characters, ensure proper encoding
- **Frontend**: Use proper Content-Type headers and JSON.stringify()

## Drag-and-Drop Reordering

### Implementation Flow

1. **Initial Load**: Fetch agenda items (already sorted by order)
2. **Drag Start**: Store original positions
3. **Drag End**: Calculate new positions
4. **Optimistic Update**: Update UI immediately
5. **API Call**: Send bulk update request
6. **Rollback**: On failure, restore original positions

### Frontend Example (React with @dnd-kit)

```javascript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

function AgendaManager({ eventId, token }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        
        if (active.id !== over.id) {
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);
            
            // Optimistic update
            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);
            
            // Prepare bulk update
            const updates = newItems.map((item, index) => ({
                id: item.id,
                order: index
            }));
            
            try {
                setLoading(true);
                const response = await fetch(
                    `/api/events/${eventId}/agenda/bulk-reorder/`,
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
                setItems(items);
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
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
            >
                {items.map(item => (
                    <SortableAgendaItem 
                        key={item.id} 
                        item={item}
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

**Get agenda items (Public Event - No Auth Required)**:
```bash
curl -X GET "http://localhost:8000/api/events/2345939d-ebe0-41f2-be1a-60fba67601b5/agenda/"
```

**Get agenda items (Private Event - Auth Required)**:
```bash
curl -X GET "http://localhost:8000/api/events/e4c29733-c545-41c9-a2fb-6a9d69dfc9f0/agenda/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create agenda item**:
```bash
curl -X POST "http://localhost:8000/api/events/2345939d-ebe0-41f2-be1a-60fba67601b5/agenda/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Coffee Break",
    "description": "Networking coffee break with refreshments",
    "agenda_type": "break",
    "date": "2025-07-21",
    "date_text": "Day 1",
    "start_time_text": "10:30 AM",
    "end_time_text": "11:00 AM",
    "location": "Main Lobby",
    "order": 1,
    "color": "#27ae60"
}'
```

**Bulk reorder**:
```bash
curl -X PATCH "http://localhost:8000/api/events/2345939d-ebe0-41f2-be1a-60fba67601b5/agenda/bulk-reorder/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
        {"id": 7, "order": 0},
        {"id": 1, "order": 1}
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

## Frontend Implementation Guide

### State Structure (TypeScript)

```typescript
interface AgendaItem {
    id: number;
    title: string;
    description: string;
    agenda_type: 'session' | 'break' | 'networking' | 'keynote' | 'workshop' | 'panel' | 'other';
    date: string | null;
    date_text: string;
    start_time_text: string;
    end_time_text: string;
    speaker: string;
    location: string;
    virtual_link: string;
    order: number;
    is_featured: boolean;
    color: string;
    translations: AgendaTranslation[];
}

interface AgendaTranslation {
    id?: number;
    agenda?: number;
    language: string;
    title: string;
    description: string;
    date_text: string;
    start_time_text: string;
    end_time_text: string;
    speaker: string;
    created_at?: string;
    updated_at?: string;
}
```

### Display Logic with Fallback

```javascript
function getLocalizedContent(agendaItem, userLanguage, fieldName) {
    // Find translation for user's language
    const translation = agendaItem.translations.find(
        t => t.language === userLanguage
    );
    
    // Return translated content or fallback to default
    return (translation && translation[fieldName]) || agendaItem[fieldName] || '';
}

// Usage
const title = getLocalizedContent(agendaItem, 'fr', 'title');
const description = getLocalizedContent(agendaItem, 'fr', 'description');
```

### Grouping by Date

```javascript
function groupAgendaByDate(agendaItems) {
    return agendaItems.reduce((groups, item) => {
        const date = item.date || 'unscheduled';
        if (!groups[date]) {
            groups[date] = {
                date: date,
                date_text: item.date_text || 'Unscheduled',
                items: []
            };
        }
        groups[date].items.push(item);
        return groups;
    }, {});
}

// Usage
const groupedAgenda = groupAgendaByDate(agendaItems);
Object.values(groupedAgenda).forEach(group => {
    console.log(`${group.date_text}: ${group.items.length} items`);
});
```

## Best Practices

### 1. Performance Optimization

- **Prefetch translations**: Backend uses `prefetch_related('translations')`
- **Batch operations**: Use bulk reorder for multiple changes
- **Lazy loading**: Load translations only when needed
- **Cache language preference**: Store user's language choice

### 2. User Experience

- **Visual feedback**: Show loading states during reorder
- **Optimistic updates**: Update UI before API response
- **Error recovery**: Graceful fallbacks and rollbacks
- **Accessibility**: Keyboard navigation for reordering

### 3. Data Integrity

- **Unique constraints**: Enforced unique language per agenda item
- **Order validation**: Ensure sequential ordering (0, 1, 2...)
- **Transaction safety**: Bulk updates in single transaction
- **Cascade deletes**: Translations deleted with agenda item

### 4. Security

- **Permission enforcement**: Strict access control per permission matrix
- **Input validation**: Server-side validation for all fields
- **SQL injection protection**: ORM-based queries
- **XSS protection**: Proper escaping in frontend display

## Error Handling

### Common Error Responses (Verified)

**400 Bad Request**
```json
{
    "agenda_type": ["\"invalid_type\" is not a valid choice."]
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
async function handleAgendaApiCall(apiCall) {
    try {
        const response = await apiCall();
        
        if (!response.ok) {
            const error = await response.json();
            
            switch (response.status) {
                case 400:
                    // Validation error - show field errors
                    Object.keys(error).forEach(field => {
                        console.error(`${field}: ${error[field].join(', ')}`);
                    });
                    break;
                case 401:
                    // Redirect to login
                    window.location.href = '/login';
                    break;
                case 403:
                    // Permission denied - show message
                    alert('You do not have permission to perform this action');
                    break;
                case 404:
                    // Not found - show 404 page
                    console.error('Resource not found');
                    break;
                default:
                    // Generic error
                    console.error('API error:', error);
            }
            
            throw new Error(error.detail || 'API call failed');
        }
        
        return await response.json();
    } catch (error) {
        // Network or parsing error
        console.error('Network error:', error);
        throw error;
    }
}
```

### Validation Rules

1. **Required Fields**: `title`, `agenda_type`
2. **Field Lengths**: title (200 chars), location (200 chars), speaker (100 chars)
3. **Valid Agenda Types**: session, break, networking, keynote, workshop, panel, other
4. **Color Format**: Hex color codes (#RRGGBB)
5. **Language Codes**: Must match supported language choices
6. **Order Values**: Non-negative integers

### Rate Limiting

- No explicit rate limiting implemented
- Consider implementing if experiencing abuse
- Use Django-ratelimit for production deployments

## Version History

- **v1.0** (2025-01-28): Initial release with multi-language support and bulk reordering
- **v1.1** (2025-01-28): Updated with verified permission system and tested examples