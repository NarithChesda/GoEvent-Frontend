# Event Text API Documentation

## Overview

The Event Text API provides multi-language text content management for events. This API allows organizers and collaborators to create, manage, and organize various types of text content in multiple languages for their events.

## Base URL

All text endpoints are nested under events:
```
/api/events/{event_pk}/texts/
```

**Authentication**: JWT Bearer Token required (always)  
**Content-Type**: `application/json`

## Table of Contents

1. [Permission System](#permission-system)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Text Types](#text-types)
5. [Multi-Language Support](#multi-language-support)
6. [Usage Examples](#usage-examples)
7. [Testing Examples](#testing-examples)
8. [Best Practices](#best-practices)
9. [Error Handling](#error-handling)

## Permission System

The Event Text API uses the `IsEventRelated` permission class with the following access control:

### **Access Control Matrix**

| User Type | Public Event | Private Event |
|-----------|--------------|---------------|
| **Unauthenticated User** | ❌ 401 Unauthorized | ❌ 401 Unauthorized |
| **Event Organizer** | ✅ Full CRUD | ✅ Full CRUD |
| **Admin Collaborator** | ✅ Full CRUD | ✅ Full CRUD |
| **Editor Collaborator** | ✅ Full CRUD | ✅ Full CRUD |
| **Viewer Collaborator** | ✅ Read Only | ✅ Read Only |
| **Registered Attendee** | ❌ 403 Forbidden | ❌ 403 Forbidden |
| **Random Authenticated User** | ❌ 403 Forbidden | ❌ 403 Forbidden |

**Note**: Event Text is more restricted than agenda/hosts - it requires authentication and only allows access to organizers and collaborators.

## API Endpoints

### 1. List Event Texts

Retrieves all text content for an event, ordered by order field then text_type.

**Endpoint**: `GET /api/events/{event_pk}/texts/`

**Permissions**: Must be event organizer or collaborator

**Query Parameters**: None (automatic ordering by order, text_type, language)

**Response Example**:
```json
{
    "count": 3,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "text_type": "welcome_message",
            "language": "en",
            "title": "Welcome to Tech Conference 2025",
            "content": "We're thrilled to have you join us for this exciting event!",
            "order": 0,
            "is_active": true
        },
        {
            "id": 2,
            "text_type": "welcome_message",
            "language": "fr",
            "title": "Bienvenue à Tech Conference 2025",
            "content": "Nous sommes ravis de vous accueillir à cet événement passionnant!",
            "order": 0,
            "is_active": true
        },
        {
            "id": 3,
            "text_type": "instructions",
            "language": "en",
            "title": "Event Guidelines",
            "content": "Please arrive 30 minutes early for registration.",
            "order": 1,
            "is_active": true
        }
    ]
}
```

### 2. Create Event Text

Creates a new text content block for the event.

**Endpoint**: `POST /api/events/{event_pk}/texts/`

**Permissions**: Must be event organizer or admin/editor collaborator

**Request Body**:
```json
{
    "text_type": "instructions",
    "language": "en",
    "title": "Parking Information",
    "content": "Free parking is available in Lot B. Please display your event pass on the dashboard.",
    "order": 2,
    "is_active": true
}
```

**Response (201 Created)**:
```json
{
    "id": 4,
    "text_type": "instructions",
    "language": "en",
    "title": "Parking Information",
    "content": "Free parking is available in Lot B. Please display your event pass on the dashboard.",
    "order": 2,
    "is_active": true
}
```

**Validation Rules**:
- `text_type` and `language` are required
- `content` is required
- Combination of `event`, `text_type`, `language`, and `order` must be unique

### 3. Retrieve Specific Text

Get details of a single text content block.

**Endpoint**: `GET /api/events/{event_pk}/texts/{id}/`

**Permissions**: Must be event organizer or collaborator

**Response**: Single text object with same structure as list response

### 4. Update Event Text

Updates a text content block.

**Endpoint**: `PUT /api/events/{event_pk}/texts/{id}/` (full update)  
**Endpoint**: `PATCH /api/events/{event_pk}/texts/{id}/` (partial update)

**Permissions**: Must be event organizer or admin/editor collaborator

**PATCH Example** (updating content only):
```json
{
    "content": "Free parking is available in Lot B and C. VIP parking in Lot A."
}
```

**PUT Example** (full replacement):
```json
{
    "text_type": "instructions",
    "language": "en",
    "title": "Updated Parking Information",
    "content": "Free parking is available in Lot B and C. VIP parking in Lot A with valet service.",
    "order": 2,
    "is_active": true
}
```

### 5. Delete Event Text

Deletes a text content block.

**Endpoint**: `DELETE /api/events/{event_pk}/texts/{id}/`

**Permissions**: Must be event organizer or admin/editor collaborator

**Response**: 204 No Content

## Data Models

### EventText Model

| Field | Type | Description | Required | Default |
|-------|------|-------------|----------|---------| 
| id | integer | Unique identifier | Auto-generated | - |
| event | foreign key | Related event | Yes (set by API) | - |
| text_type | string(50) | Type of text content | Yes | - |
| language | string(10) | Language code | Yes | 'en' |
| title | string(200) | Optional title for the text block | No | "" |
| content | text | The actual text content | Yes | - |
| order | integer | Display order within same type | Yes | 0 |
| is_active | boolean | Whether text is active/visible | Yes | true |
| created_at | datetime | Creation timestamp | Auto-generated | - |
| updated_at | datetime | Last update timestamp | Auto-generated | - |

### Unique Constraint

The combination of `event`, `text_type`, `language`, and `order` must be unique. This allows:
- Multiple languages for the same text type
- Multiple text blocks of the same type in the same language (using different order values)

## Text Types

### Predefined Text Types

| Type | Display Name | Description | Use Case |
|------|--------------|-------------|----------|
| `description` | Description | Detailed event description | Main event description in multiple languages |
| `short_description` | Short Description | Brief event summary | Event cards, previews |
| `date_text` | Date Text | Human-readable date format | "3 days", "August 15-17" |
| `time_text` | Time Text | Human-readable time format | "9 AM - 5 PM PST" |
| `location_text` | Location Text | Venue/location details | "Main Hall, Building A" |
| `instructions` | Instructions | Event guidelines | Check-in process, rules |
| `welcome_message` | Welcome Message | Greeting for attendees | Landing page message |
| `thank_you_message` | Thank You Message | Post-event message | Confirmation pages |
| `custom` | Custom Text | Any other content | Flexible use |

### Usage Examples by Type

**Welcome Message**:
```json
{
    "text_type": "welcome_message",
    "language": "en",
    "title": "Welcome to Our Annual Conference",
    "content": "Dear attendees, we're delighted to welcome you to our 10th annual technology conference. This year promises to be our most exciting yet!",
    "order": 0
}
```

**Instructions**:
```json
{
    "text_type": "instructions",
    "language": "en",
    "title": "Check-in Process",
    "content": "1. Present your QR code at the registration desk\n2. Receive your badge and welcome kit\n3. Complimentary breakfast available until 9:30 AM",
    "order": 1
}
```

**Custom Text**:
```json
{
    "text_type": "custom",
    "language": "en",
    "title": "COVID-19 Safety Measures",
    "content": "Masks are optional but recommended in crowded areas. Hand sanitizer stations are available throughout the venue.",
    "order": 5
}
```

## Multi-Language Support

### Supported Languages

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

### Language Strategy

1. **No Fallback System**: Each language variant is independent
2. **Flexible Structure**: Can have different text types in different languages
3. **Order Independence**: Each language can have its own ordering

### Creating Multi-Language Content

```javascript
// Create welcome message in multiple languages
const languages = [
    {
        language: "en",
        title: "Welcome",
        content: "Welcome to our international conference!"
    },
    {
        language: "fr",
        title: "Bienvenue",
        content: "Bienvenue à notre conférence internationale!"
    },
    {
        language: "ja",
        title: "ようこそ",
        content: "国際会議へようこそ！"
    }
];

for (const lang of languages) {
    await fetch(`/api/events/${eventId}/texts/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text_type: "welcome_message",
            ...lang,
            order: 0
        })
    });
}
```

## Usage Examples

### 1. Setting Up Event Text Content

```javascript
// Complete event text setup
async function setupEventTexts(eventId, token) {
    const texts = [
        // English content
        {
            text_type: "welcome_message",
            language: "en",
            title: "Welcome to Tech Summit 2025",
            content: "Join us for three days of innovation and networking!",
            order: 0
        },
        {
            text_type: "instructions",
            language: "en",
            title: "Registration",
            content: "Check-in opens at 8:00 AM. Please have your confirmation ready.",
            order: 1
        },
        {
            text_type: "instructions",
            language: "en",
            title: "Venue Rules",
            content: "No photography during keynotes. Refreshments in the lobby.",
            order: 2
        },
        // French translations
        {
            text_type: "welcome_message",
            language: "fr",
            title: "Bienvenue au Tech Summit 2025",
            content: "Rejoignez-nous pour trois jours d'innovation et de réseautage!",
            order: 0
        }
    ];
    
    for (const text of texts) {
        await createEventText(eventId, text, token);
    }
}
```

### 2. Displaying Text by Type and Language

```javascript
// Get all text content for a specific type and language
async function getEventTextByType(eventId, textType, language, token) {
    const response = await fetch(
        `/api/events/${eventId}/texts/`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );
    
    const data = await response.json();
    
    // Filter by type and language
    return data.results.filter(
        text => text.text_type === textType && 
               text.language === language && 
               text.is_active
    ).sort((a, b) => a.order - b.order);
}

// Usage
const welcomeMessages = await getEventTextByType(
    eventId, 'welcome_message', 'en', token
);
```

### 3. Managing Text Ordering

```javascript
// Reorder instructions for better flow
async function reorderInstructions(eventId, token) {
    // Get all instruction texts
    const response = await fetch(`/api/events/${eventId}/texts/`);
    const data = await response.json();
    
    const instructions = data.results.filter(
        t => t.text_type === 'instructions' && t.language === 'en'
    );
    
    // Update order
    const updates = [
        { id: instructions[2].id, order: 0 }, // Move "Parking" to top
        { id: instructions[0].id, order: 1 }, // "Registration" second
        { id: instructions[1].id, order: 2 }  // "Venue Rules" last
    ];
    
    for (const update of updates) {
        await fetch(`/api/events/${eventId}/texts/${update.id}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ order: update.order })
        });
    }
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

**List all event texts**:
```bash
curl -X GET "http://localhost:8000/api/events/2345939d-ebe0-41f2-be1a-60fba67601b5/texts/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create welcome message**:
```bash
curl -X POST "http://localhost:8000/api/events/2345939d-ebe0-41f2-be1a-60fba67601b5/texts/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text_type": "welcome_message",
    "language": "en",
    "title": "Welcome to Our Event",
    "content": "We are excited to have you join us for this amazing experience!",
    "order": 0
}'
```

**Update text content**:
```bash
curl -X PATCH "http://localhost:8000/api/events/2345939d-ebe0-41f2-be1a-60fba67601b5/texts/1/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated: We are thrilled to welcome you!"}'
```

**Delete text**:
```bash
curl -X DELETE "http://localhost:8000/api/events/2345939d-ebe0-41f2-be1a-60fba67601b5/texts/1/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Permission Test Results

| Test Case | Expected | Result |
|-----------|----------|---------|
| Public event + No auth + GET | ❌ 401 | ✅ Correct |
| Public event + Organizer + GET | ✅ 200 | ✅ Correct |
| Public event + Organizer + POST | ✅ 201 | ✅ Correct |
| Public event + Editor collab + PATCH | ✅ 200 | ✅ Correct |
| Public event + Viewer collab + POST | ❌ 403 | ✅ Correct |
| Private event + No auth + GET | ❌ 401 | ✅ Correct |
| Private event + Random user + GET | ❌ 403 | ✅ Correct |

## Best Practices

### 1. Content Organization

- **Use appropriate text types**: Choose the most specific type for your content
- **Consistent ordering**: Use order field to maintain logical flow
- **Language completeness**: Aim to provide all critical content in all supported languages
- **Active/Inactive management**: Use is_active to hide content without deleting

### 2. Multi-Language Management

```javascript
// Helper to ensure language consistency
async function ensureLanguageConsistency(eventId, token) {
    const response = await fetch(`/api/events/${eventId}/texts/`);
    const data = await response.json();
    
    // Group by text_type and order
    const textGroups = {};
    data.results.forEach(text => {
        const key = `${text.text_type}-${text.order}`;
        if (!textGroups[key]) {
            textGroups[key] = {};
        }
        textGroups[key][text.language] = text;
    });
    
    // Check which languages are missing
    const requiredLanguages = ['en', 'fr', 'ja'];
    const missing = [];
    
    Object.entries(textGroups).forEach(([key, languages]) => {
        requiredLanguages.forEach(lang => {
            if (!languages[lang]) {
                const [type, order] = key.split('-');
                missing.push({ text_type: type, order: parseInt(order), language: lang });
            }
        });
    });
    
    return missing;
}
```

### 3. Content Templates

```javascript
// Create standard event text templates
const EVENT_TEXT_TEMPLATES = {
    conference: [
        {
            text_type: "welcome_message",
            title: "Welcome to {EVENT_NAME}",
            content: "We're excited to welcome you to our conference. Please check the agenda for session times and locations."
        },
        {
            text_type: "instructions",
            title: "WiFi Access",
            content: "Network: {EVENT_NAME}\nPassword: {WIFI_PASSWORD}"
        },
        {
            text_type: "instructions", 
            title: "Emergency Procedures",
            content: "In case of emergency, please follow venue staff instructions. Emergency exits are marked in green."
        }
    ],
    workshop: [
        {
            text_type: "instructions",
            title: "What to Bring",
            content: "Please bring your laptop and charger. Materials will be provided."
        },
        {
            text_type: "instructions",
            title: "Prerequisites",
            content: "Basic knowledge of {TOPIC} is recommended but not required."
        }
    ]
};
```

### 4. Performance Optimization

- **Batch operations**: Create multiple texts in sequence rather than parallel to avoid conflicts
- **Caching strategy**: Cache text content on frontend by language and type
- **Lazy loading**: Load text content only when needed (e.g., when user switches language)

## Error Handling

### Common Error Responses

**400 Bad Request** (Validation Error):
```json
{
    "text_type": ["This field is required."],
    "content": ["This field may not be blank."]
}
```

**400 Bad Request** (Uniqueness Violation):
```json
{
    "non_field_errors": [
        "The fields event, text_type, language, order must make a unique set."
    ]
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

**404 Not Found**:
```json
{
    "detail": "Not found."
}
```

### Error Handling Example

```javascript
async function createEventText(eventId, textData, token) {
    try {
        const response = await fetch(
            `/api/events/${eventId}/texts/`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(textData)
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            
            switch (response.status) {
                case 400:
                    // Handle validation errors
                    if (error.non_field_errors) {
                        console.error('Duplicate text entry:', error.non_field_errors[0]);
                        // Maybe update existing instead
                    } else {
                        Object.entries(error).forEach(([field, messages]) => {
                            console.error(`${field}: ${messages.join(', ')}`);
                        });
                    }
                    break;
                case 401:
                    // Redirect to login
                    window.location.href = '/login';
                    break;
                case 403:
                    alert('You do not have permission to add text content');
                    break;
                default:
                    console.error('Unexpected error:', error);
            }
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error('Network error:', error);
        return null;
    }
}
```

## Frontend Implementation Guide

### State Management

```typescript
interface EventText {
    id: number;
    text_type: string;
    language: string;
    title: string;
    content: string;
    order: number;
    is_active: boolean;
}

interface EventTextState {
    texts: EventText[];
    loading: boolean;
    error: string | null;
    filters: {
        text_type?: string;
        language?: string;
        is_active?: boolean;
    };
}
```

### Text Display Component

```javascript
function EventTextDisplay({ eventId, textType, language = 'en' }) {
    const [texts, setTexts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchEventTexts();
    }, [eventId, textType, language]);
    
    const fetchEventTexts = async () => {
        try {
            const response = await fetch(
                `/api/events/${eventId}/texts/`,
                {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    }
                }
            );
            
            const data = await response.json();
            
            // Filter and sort
            const filtered = data.results
                .filter(t => 
                    t.text_type === textType && 
                    t.language === language && 
                    t.is_active
                )
                .sort((a, b) => a.order - b.order);
            
            setTexts(filtered);
        } catch (error) {
            console.error('Failed to load texts:', error);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <div>Loading...</div>;
    
    return (
        <div className="event-texts">
            {texts.map(text => (
                <div key={text.id} className="text-block">
                    {text.title && <h3>{text.title}</h3>}
                    <div className="content">
                        {text.content.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
```

### Text Editor Component

```javascript
function EventTextEditor({ eventId, textType, language, existingText = null }) {
    const [formData, setFormData] = useState({
        text_type: textType,
        language: language,
        title: existingText?.title || '',
        content: existingText?.content || '',
        order: existingText?.order || 0,
        is_active: existingText?.is_active ?? true
    });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const method = existingText ? 'PATCH' : 'POST';
        const url = existingText 
            ? `/api/events/${eventId}/texts/${existingText.id}/`
            : `/api/events/${eventId}/texts/`;
        
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                // Handle success
                onSuccess();
            } else {
                // Handle errors
                const error = await response.json();
                handleApiError(error);
            }
        } catch (error) {
            console.error('Failed to save text:', error);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Title (optional)"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
            />
            
            <textarea
                placeholder="Content"
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                required
                rows={5}
            />
            
            <input
                type="number"
                placeholder="Order"
                value={formData.order}
                onChange={e => setFormData({...formData, order: parseInt(e.target.value)})}
                min={0}
            />
            
            <label>
                <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                />
                Active
            </label>
            
            <button type="submit">
                {existingText ? 'Update' : 'Create'} Text
            </button>
        </form>
    );
}
```

## Version History

- **v1.0** (2025-01-28): Initial release with multi-language support and comprehensive text type system