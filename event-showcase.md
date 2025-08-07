# Event Showcase API Documentation

## Overview

The Event Showcase API provides a public-facing endpoint for displaying event invitation pages with customizable templates, multi-language support, and guest personalization. This endpoint is designed for sharing event invitations with potential attendees.

## Endpoint

```
GET /api/events/{event_id}/showcase/
```

## Authentication

- **Public Events**: No authentication required
- **Private Events**: Requires authentication and proper permissions (organizer or collaborator)

## Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `lang` | string | Language code for content localization | `?lang=kh` |
| `guest_name` | string | Guest name for personalized invitation | `?guest_name=John%20Doe` |

### Supported Languages

- `en` - English
- `kh` - Khmer
- `fr` - French
- `ja` - Japanese
- `ko` - Korean
- `zh-cn` - Chinese (Simplified)
- `th` - Thai
- `vn` - Vietnamese

## Response Structure

### Success Response (200 OK)

```json
{
  "event": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Annual Tech Conference 2025",
    "slug": "annual-tech-conference-2025",
    "description": "Join us for the biggest tech event of the year",
    "short_description": "The biggest tech event of 2025",
    "start_date": "2025-03-15T09:00:00Z",
    "end_date": "2025-03-17T18:00:00Z",
    "timezone": "America/New_York",
    "location": "Convention Center, New York",
    "virtual_link": "https://zoom.us/j/123456789",
    "is_virtual": false,
    "privacy": "public",
    "status": "published",
    "banner_image": "https://example.com/media/event_banners/banner.jpg",
    "logo_one": "https://example.com/media/event_logos/logo1.png",
    "logo_two": "https://example.com/media/event_logos/logo2.png",
    "event_video": null,
    "google_map_embed_link": "https://maps.google.com/embed/...",
    "youtube_embed_link": "https://youtube.com/embed/abc123",
    "max_attendees": 500,
    "registration_required": true,
    "registration_deadline": "2025-03-10T23:59:59Z",
    "organizer": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "profile": {
        "full_name": "John Doe",
        "profile_picture": "https://example.com/media/profiles/john.jpg"
      }
    },
    "category": {
      "id": 1,
      "name": "Technology",
      "color": "#3498db",
      "icon": "fa-laptop"
    },
    "hosts": [
      {
        "id": 1,
        "name": "សុខ សំណាង",
        "title": "CEO",
        "bio": "មេដឹកនាំក្រុមហ៊ុន",
        "parent_a_name": "សុខ វិទ្យា",
        "parent_b_name": "លី សុភាព",
        "profile_image": "https://example.com/media/host_profiles/host1.jpg",
        "order": 0
      }
    ],
    "agenda_items": [
      {
        "id": 1,
        "title": "ពិធីបើកសម្ពោធ",
        "description": "ការចាប់ផ្តើមព្រឹត្តិការណ៍",
        "agenda_type": "session",
        "date": "2025-03-15",
        "date_text": "ថ្ងៃទី១",
        "start_time_text": "ម៉ោង ៩:០០ ព្រឹក",
        "end_time_text": "ម៉ោង ៩:៣០ ព្រឹក",
        "speaker": "សុខ សំណាង",
        "location": "Main Hall",
        "icon": {
          "id": 1,
          "name": "Opening",
          "svg_code": "<svg>...</svg>"
        },
        "order": 0,
        "is_featured": true,
        "color": "#e74c3c"
      }
    ],
    "event_texts": [
      {
        "id": 1,
        "text_type": "welcome_message",
        "language": "kh",
        "title": "សូមស្វាគមន៍",
        "content": "យើងសូមស្វាគមន៍លោកអ្នកទាំងអស់គ្នា",
        "order": 0
      }
    ],
    "template_assets": {
      "template": {
        "id": 1,
        "name": "Elegant Wedding Template",
        "preview_image": "https://example.com/media/templates/preview.jpg"
      },
      "assets": {
        "open_envelope_button": "https://example.com/media/templates/envelope.png",
        "basic_decoration_photo": "https://example.com/media/templates/decoration.png",
        "basic_background_photo": "https://example.com/media/templates/background.jpg",
        "standard_cover_video": "https://example.com/media/templates/cover.mp4",
        "standard_background_video": "https://example.com/media/templates/bg_video.mp4"
      },
      "colors": [
        {
          "id": 1,
          "hex_code": "#FFD700",
          "name": "Gold"
        },
        {
          "id": 2,
          "hex_code": "#FFFFFF",
          "name": "White"
        }
      ],
      "fonts": [
        {
          "id": 1,
          "language": "kh",
          "font_name": "Khmer OS Battambang",
          "font_file": "https://example.com/media/fonts/khmer_os.ttf"
        }
      ]
    },
    "guest_name": "John Doe",
    "languages": [
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
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-20T15:30:00Z"
  },
  "meta": {
    "language": "kh",
    "guest_name": "John Doe",
    "template_enabled": true,
    "payment_confirmed": true,
    "available_languages": ["en", "kh", "fr"]
  }
}
```

### Template Assets Structure

The `template_assets` field will only be included if:
1. Event has a template assigned (`event_template` is not null)
2. Template is enabled (`event_template_enabled` is true)
3. Payment for the template is confirmed (`Payment.status` is "confirmed")

If any of these conditions are not met, `template_assets` will be `null`.

### Language-Filtered Content

The following fields are filtered based on the `lang` query parameter:
- `hosts` - Returns host translations for the selected language
- `agenda_items` - Returns agenda translations for the selected language
- `event_texts` - Returns only texts in the selected language

If the requested language is not available, the API will fallback to:
1. English (if available)
2. The first available language

## Error Responses

### 404 Not Found
```json
{
  "detail": "Event not found."
}
```

### 403 Forbidden
```json
{
  "detail": "You don't have permission to view this private event."
}
```

### 400 Bad Request
```json
{
  "detail": "Invalid language code. Available languages: en, kh"
}
```

## Usage Examples

### Basic Showcase Request
```bash
curl -X GET https://api.example.com/api/events/550e8400-e29b-41d4-a716-446655440000/showcase/
```

### With Language Selection
```bash
curl -X GET https://api.example.com/api/events/550e8400-e29b-41d4-a716-446655440000/showcase/?lang=kh
```

### With Guest Personalization
```bash
curl -X GET https://api.example.com/api/events/550e8400-e29b-41d4-a716-446655440000/showcase/?guest_name=John%20Doe
```

### Combined Parameters
```bash
curl -X GET https://api.example.com/api/events/550e8400-e29b-41d4-a716-446655440000/showcase/?lang=kh&guest_name=សុខ%20សំណាង
```

## Frontend Integration Guide

### 1. Fetching Showcase Data
```javascript
async function getEventShowcase(eventId, language = 'en', guestName = '') {
  const params = new URLSearchParams();
  if (language) params.append('lang', language);
  if (guestName) params.append('guest_name', guestName);
  
  const response = await fetch(
    `/api/events/${eventId}/showcase/?${params.toString()}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}
```

### 2. Language Switcher Implementation
```javascript
// Get available languages from the response
const availableLanguages = showcaseData.meta.available_languages;

// Switch language
async function switchLanguage(newLang) {
  const data = await getEventShowcase(eventId, newLang, currentGuestName);
  updateUI(data);
}
```

### 3. Template Assets Usage
```javascript
// Check if template assets are available
if (showcaseData.event.template_assets) {
  const { assets, colors, fonts } = showcaseData.event.template_assets;
  
  // Use template background
  if (assets.basic_background_photo) {
    document.body.style.backgroundImage = `url(${assets.basic_background_photo})`;
  }
  
  // Apply template colors
  colors.forEach(color => {
    // Apply color scheme
    document.documentElement.style.setProperty(
      `--template-color-${color.id}`, 
      color.hex_code
    );
  });
  
  // Load custom fonts
  fonts.forEach(font => {
    if (font.language === currentLanguage) {
      const fontFace = new FontFace(font.font_name, `url(${font.font_file})`);
      fontFace.load().then(loadedFont => {
        document.fonts.add(loadedFont);
      });
    }
  });
}
```

### 4. Guest Name Personalization
```javascript
// Display personalized greeting
const guestName = showcaseData.meta.guest_name || 'Guest';
const welcomeMessage = `Welcome, ${guestName}!`;

// For invitation cards
const invitationText = `${guestName}, you're invited to ${showcaseData.event.title}`;
```

## Security Considerations

1. **Guest Name Validation**: The API sanitizes guest names to prevent XSS attacks:
   - Removes HTML tags and special characters
   - Limits length to 50 characters
   - Encodes for safe display

2. **Private Events**: Access control ensures private events are only viewable by:
   - Event organizer
   - Event collaborators
   - Authenticated users with proper permissions

3. **Template Assets**: Protected by payment verification to ensure only paid templates are accessible

## Performance Notes

- The API uses optimized queries with `select_related` and `prefetch_related`
- Language-specific content is filtered at the database level
- Template assets are cached for improved performance
- Large media files (videos) are served via CDN in production

## Rate Limiting

- Public endpoints: 100 requests per minute per IP
- Authenticated endpoints: 1000 requests per minute per user

## Changelog

### Version 1.0.0 (2025-01-20)
- Initial release of Event Showcase API
- Multi-language support
- Guest personalization
- Template assets with payment verification