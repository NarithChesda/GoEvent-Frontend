# Event Showcase API Documentation

## Overview
The Event Showcase API endpoint provides a comprehensive public-facing view of an event, including all details, photos, multi-language content, and template assets. This endpoint is designed for displaying events to potential attendees without requiring authentication for public events.

## Endpoint Details

### URL
```
GET /api/events/{event_id}/showcase/
```

### Authentication
- **Public Events**: No authentication required
- **Private Events**: JWT Bearer token required
- **Unpublished Events**: Only accessible by organizer/collaborators with edit permissions

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `lang` | string | No | Language code for content filtering | `en`, `kh`, `fr`, `ja` |
| `guest_name` | string | No | Guest name for personalization (max 50 chars) | `John Doe` |

### Example Request
```bash
# Public event without authentication
curl -X GET "http://localhost:8000/api/events/123e4567-e89b-12d3-a456-426614174000/showcase/?lang=en&guest_name=John%20Doe"

# Private event with authentication
curl -X GET "http://localhost:8000/api/events/123e4567-e89b-12d3-a456-426614174000/showcase/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Response Structure

### Success Response (200 OK)
```json
{
  "event": {
    // Basic Event Information
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Annual Tech Conference 2025",
    "slug": "annual-tech-conference-2025",
    "description": "Join us for the biggest tech event of the year",
    "short_description": "The premier tech conference",
    
    // Date and Time
    "start_date": "2025-03-15T09:00:00Z",
    "end_date": "2025-03-17T18:00:00Z",
    "timezone": "America/New_York",
    
    // Location
    "location": "Convention Center, 123 Main St, New York, NY 10001",
    "virtual_link": "https://zoom.us/j/123456789",
    "is_virtual": false,
    "google_map_embed_link": "https://maps.google.com/embed?...",
    
    // Privacy and Status
    "privacy": "public",
    "status": "published",
    
    // Media Assets
    "banner_image": "http://example.com/media/event_banners/banner.jpg",
    "logo_one": "http://example.com/media/event_logos/logo1.png",
    "logo_two": "http://example.com/media/event_logos/logo2.png",
    "event_video": "http://example.com/media/event_videos/promo.mp4",
    "youtube_embed_link": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    
    // Organizer Information
    "organizer": 1,
    "organizer_details": {
      "id": 1,
      "username": "john_organizer",
      "email": "john@example.com",
      "profile_picture": "http://example.com/media/profiles/john.jpg",
      "bio": "Event organizer with 10 years experience",
      "phone": "+1234567890"
    },
    
    // Category
    "category": 1,
    "category_details": {
      "id": 1,
      "name": "Technology",
      "description": "Technology and innovation events",
      "icon": "http://example.com/media/icons/tech.svg"
    },
    
    // Registration Settings
    "max_attendees": 500,
    "registration_required": true,
    "registration_deadline": "2025-03-10T23:59:59Z",
    "registrations_count": 234,
    
    // Timestamps
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-15T14:30:00Z",
    
    // Event Status Flags
    "is_upcoming": true,
    "is_ongoing": false,
    "is_past": false,
    
    // Multi-language Content
    "hosts": [
      {
        "id": 1,
        "name": "Dr. Jane Smith",
        "parent_a_name": "",
        "parent_b_name": "",
        "title": "CEO, Tech Corp",
        "bio": "Leading expert in AI and machine learning",
        "profile_image": "http://example.com/media/host_profiles/jane.jpg",
        "email": "jane@techcorp.com",
        "linkedin_url": "https://linkedin.com/in/janesmith",
        "twitter_url": "https://twitter.com/janesmith",
        "website_url": "https://janesmith.com",
        "order": 0
      }
    ],
    
    "agenda_items": [
      {
        "id": 1,
        "title": "Opening Keynote",
        "description": "Welcome and introduction to the conference",
        "agenda_type": "keynote",
        "date": "2025-03-15",
        "date_text": "Day 1",
        "start_time_text": "9:00 AM",
        "end_time_text": "10:00 AM",
        "speaker": "Dr. Jane Smith",
        "location": "Main Hall",
        "virtual_link": "",
        "order": 0,
        "is_featured": true,
        "color": "#3498db",
        "icon": {
          "id": 1,
          "name": "microphone",
          "svg_code": "<svg>...</svg>"
        }
      }
    ],
    
    "event_texts": [
      {
        "id": 1,
        "text_type": "welcome_message",
        "language": "en",
        "title": "Welcome",
        "content": "Welcome to our annual tech conference!",
        "order": 0,
        "is_active": true
      }
    ],
    
    "available_languages": [
      {
        "id": 1,
        "language": "en",
        "language_display": "English"
      },
      {
        "id": 2,
        "language": "kh",
        "language_display": "Khmer"
      }
    ],
    
    // Photo Gallery
    "photos": [
      {
        "id": 1,
        "image": "http://example.com/media/event_photos/photo1.jpg",
        "caption": "Conference venue",
        "order": 0,
        "is_featured": true,
        "created_at": "2025-01-10T10:00:00Z"
      },
      {
        "id": 2,
        "image": "http://example.com/media/event_photos/photo2.jpg",
        "caption": "Networking area",
        "order": 1,
        "is_featured": false,
        "created_at": "2025-01-10T10:05:00Z"
      }
    ],
    
    // Template Assets (only if payment confirmed)
    "template_assets": {
      "id": 1,
      "name": "Premium Wedding Template",
      "package_plan": {
        "id": 1,
        "name": "Premium Plan",
        "price": "99.00",
        "commission": "10.00",
        "features": ["Custom colors", "Video backgrounds"],
        "is_active": true
      },
      "assets": {
        "open_envelope_button": "http://example.com/media/templates/envelope.png",
        "basic_decoration_photo": "http://example.com/media/templates/decoration.jpg",
        "basic_background_photo": "http://example.com/media/templates/bg.jpg",
        "standard_cover_video": "http://example.com/media/templates/cover.mp4",
        "standard_background_video": "http://example.com/media/templates/bg_video.mp4",
        "preview_image": "http://example.com/media/templates/preview.jpg",
        "youtube_preview_url": "https://youtube.com/watch?v=abc123"
      },
      "colors": [
        {
          "id": 1,
          "color_type": "primary",
          "hex_value": "#FF6B6B",
          "name": "Coral Red"
        },
        {
          "id": 2,
          "color_type": "secondary",
          "hex_value": "#4ECDC4",
          "name": "Teal"
        }
      ],
      "fonts": {
        "en": {
          "id": 1,
          "name": "Playfair Display",
          "file": "http://example.com/media/fonts/playfair.ttf",
          "style": "normal",
          "weight": "400"
        },
        "kh": {
          "id": 2,
          "name": "Khmer OS",
          "file": "http://example.com/media/fonts/khmer.ttf",
          "style": "normal",
          "weight": "400"
        }
      }
    },
    
    // Personalization
    "guest_name": "John Doe"
  },
  
  // Metadata
  "meta": {
    "language": "en",
    "guest_name": "John Doe",
    "template_enabled": true,
    "available_languages": [
      {
        "code": "en",
        "display": "English"
      },
      {
        "code": "kh",
        "display": "Khmer"
      }
    ]
  }
}
```

## Field Descriptions

### Core Event Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique event identifier |
| `title` | string | Event title |
| `slug` | string | URL-friendly event identifier |
| `description` | string | Full event description |
| `short_description` | string | Brief event summary (max 300 chars) |
| `start_date` | datetime | Event start date and time (ISO 8601) |
| `end_date` | datetime | Event end date and time (ISO 8601) |
| `timezone` | string | Event timezone (e.g., "America/New_York") |
| `location` | string | Physical event location |
| `virtual_link` | string | Virtual meeting URL (https only) |
| `is_virtual` | boolean | Whether event is virtual |
| `privacy` | string | "public" or "private" |
| `status` | string | "draft", "published", "cancelled", or "completed" |

### Media Fields

| Field | Type | Description |
|-------|------|-------------|
| `banner_image` | string | URL to event banner image |
| `logo_one` | string | URL to primary logo |
| `logo_two` | string | URL to secondary logo |
| `event_video` | string | URL to event promotional video |
| `google_map_embed_link` | string | Google Maps embed URL |
| `youtube_embed_link` | string | YouTube video embed URL |

### Related Objects

| Field | Type | Description |
|-------|------|-------------|
| `organizer_details` | object | Full organizer profile information |
| `category_details` | object | Event category with icon |
| `hosts` | array | Event hosts with multi-language support |
| `agenda_items` | array | Event schedule with translations |
| `event_texts` | array | Custom text blocks in selected language |
| `photos` | array | Event photo gallery |
| `template_assets` | object/null | Template media and styling (if enabled) |

### Computed Fields

| Field | Type | Description |
|-------|------|-------------|
| `is_upcoming` | boolean | Event hasn't started yet |
| `is_ongoing` | boolean | Event is currently happening |
| `is_past` | boolean | Event has ended |
| `registrations_count` | integer | Number of active registrations |
| `guest_name` | string/null | Personalized guest name |

## Error Responses

### 404 Not Found
```json
{
  "detail": "Event not found."
}
```

### 401 Unauthorized (Private Event)
```json
{
  "detail": "This event is private. Authentication required."
}
```

### 403 Forbidden (No Access to Private Event)
```json
{
  "detail": "You do not have permission to view this private event."
}
```

### 404 Not Found (Unpublished Event)
```json
{
  "detail": "Event is not available for public viewing."
}
```

## Language Support

The API supports the following language codes:
- `en` - English
- `kh` - Khmer
- `fr` - French
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese
- `th` - Thai
- `vi` - Vietnamese

When a language is specified:
1. Host names, titles, and bios are returned in the selected language
2. Agenda items are translated to the selected language
3. Event texts are filtered by the selected language
4. Template fonts are selected based on language

If a translation is not available for the requested language, the default (usually English) content is returned.

## Template Assets

Template assets are only included in the response when:
1. The event has a template assigned (`event_template` is not null)
2. The template is enabled (`event_template_enabled` is true)
3. There is a confirmed payment for the template

Template assets include:
- Media files (buttons, backgrounds, videos)
- Color schemes with hex values
- Language-specific fonts
- Package plan details

## Guest Personalization

When the `guest_name` parameter is provided:
1. The name is sanitized (dangerous characters removed, max 50 chars)
2. If the guest exists in the event's guest list, their view is tracked
3. The guest name is included in the response for frontend personalization

## Performance Optimization

The showcase endpoint is optimized with:
- `select_related` for one-to-one relationships
- `prefetch_related` for many-to-many and reverse foreign keys
- Single database query for all related data
- Efficient filtering of multi-language content

## Usage Examples

### Public Event Showcase
```javascript
// Fetch public event showcase
const response = await fetch('/api/events/123e4567-e89b-12d3-a456-426614174000/showcase/');
const data = await response.json();
console.log(data.event.title);
console.log(data.event.photos);
```

### Multi-language Support
```javascript
// Fetch event in Khmer language
const response = await fetch('/api/events/123e4567-e89b-12d3-a456-426614174000/showcase/?lang=kh');
const data = await response.json();
// Hosts and agenda will be in Khmer if translations exist
```

### Guest Personalization
```javascript
// Personalized showcase for a specific guest
const response = await fetch('/api/events/123e4567-e89b-12d3-a456-426614174000/showcase/?guest_name=John%20Doe');
const data = await response.json();
console.log(`Welcome, ${data.event.guest_name}!`);
```

## Notes

1. **Public Access**: The showcase endpoint is designed for public access. Public, published events can be viewed without authentication.

2. **Photo Gallery**: All event photos are included in the response, ordered by their `order` field and creation time.

3. **Template Preview**: Template information is shown for preview purposes even before payment, but template assets (media files) are only included after payment confirmation.

4. **Security**: All user inputs (guest_name, lang) are validated and sanitized to prevent XSS and injection attacks.

5. **Caching**: Consider implementing caching for public event showcases to improve performance, especially for popular events.