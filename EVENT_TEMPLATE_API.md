# Event Template API Documentation

This document provides comprehensive documentation for the Event Template system API endpoints, enabling organizers to browse, select, and showcase event templates with pricing integration.

## Overview

The Event Template system allows:
- **Organizers/Collaborators**: Browse available templates, view pricing, and select templates for their events
- **Public Users**: Access template assets for styled event showcase pages
- **Payment Integration**: Complete pricing information for payment processing

## Authentication

Most template operations require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### 1. Browse Available Templates

**Endpoint:** `GET /api/core-data/event-templates/browse_templates/`

**Authentication:** Required (Organizers/Collaborators only)

**Description:** Retrieve all available event templates with preview images and pricing information for selection.

**Response:**
```json
{
  "message": "Available event templates for selection",
  "templates": [
    {
      "id": 1,
      "name": "Premium Wedding Template",
      "package_plan": {
        "id": 1,
        "name": "Premium Plan",
        "price": "299.00",
        "commission": "15.00",
        "features": [
          "Custom color palette",
          "Premium fonts",
          "Video backgrounds",
          "Advanced animations"
        ],
        "category": {
          "id": 1,
          "name": "Wedding",
          "color": "#ff6b6b"
        }
      },
      "preview_image": "http://localhost:8000/media/event_templates/previews/premium_wedding.jpg",
      "template_colors": [
        {
          "id": 1,
          "hex_color_code": "#ff6b6b",
          "name": "Primary Red"
        },
        {
          "id": 2,
          "hex_color_code": "#4ecdc4",
          "name": "Accent Teal"
        }
      ],
      "template_fonts": [
        {
          "id": 1,
          "language": "en",
          "language_display": "English",
          "font": {
            "id": 1,
            "name": "Elegant Serif",
            "font_file": "http://localhost:8000/media/fonts/elegant_serif.ttf"
          }
        }
      ],
      "open_envelope_button": "http://localhost:8000/media/event_templates/open_envelope_button/button1.png",
      "basic_decoration_photo": "http://localhost:8000/media/event_templates/basic_decorations_photo/decor1.jpg",
      "basic_background_photo": "http://localhost:8000/media/event_templates/basic_background_photo/bg1.jpg",
      "standard_cover_video": "http://localhost:8000/media/event_templates/standard_cover_video/cover1.mp4",
      "standard_background_video": "http://localhost:8000/media/event_templates/standard_background_video/bg1.mp4",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:45:00Z"
    }
  ]
}
```

### 2. Select Template for Event

**Endpoint:** `POST /api/events/{event_id}/select_template/`

**Authentication:** Required (Event organizer or admin/editor collaborators only)

**Description:** Select an event template for a specific event and retrieve pricing information for payment processing.

**Request Body:**
```json
{
  "template_id": 1
}
```

**Response:**
```json
{
  "message": "Template selected successfully",
  "template": {
    "id": 1,
    "name": "Premium Wedding Template",
    "package_plan": {
      "id": 1,
      "name": "Premium Plan",
      "price": "299.00",
      "commission": "15.00",
      "features": [
        "Custom color palette",
        "Premium fonts", 
        "Video backgrounds",
        "Advanced animations"
      ]
    },
    "preview_image": "http://localhost:8000/media/event_templates/previews/premium_wedding.jpg",
    "template_colors": [...],
    "template_fonts": [...]
  },
  "pricing_info": {
    "plan_name": "Premium Plan",
    "price": "299.00",
    "commission": "15.00",
    "features": [
      "Custom color palette",
      "Premium fonts",
      "Video backgrounds", 
      "Advanced animations"
    ],
    "category": "Wedding"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing template_id
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Template not found or not available

### 3. Get Public Template Assets

**Endpoint:** `GET /api/core-data/event-templates/{template_id}/public_template_assets/`

**Authentication:** Not required (Public access)

**Description:** Retrieve template styling assets (colors, fonts, media) for public event showcase pages.

**Response:**
```json
{
  "template_data": {
    "id": 1,
    "name": "Premium Wedding Template",
    "colors": [
      {
        "id": 1,
        "hex_color_code": "#ff6b6b",
        "name": "Primary Red"
      },
      {
        "id": 2,
        "hex_color_code": "#4ecdc4",
        "name": "Accent Teal"
      }
    ],
    "fonts": [
      {
        "id": 1,
        "language": "en",
        "language_display": "English",
        "font": {
          "id": 1,
          "name": "Elegant Serif",
          "font_file": "http://localhost:8000/media/fonts/elegant_serif.ttf"
        }
      }
    ],
    "assets": {
      "open_envelope_button": "http://localhost:8000/media/event_templates/open_envelope_button/button1.png",
      "basic_decoration_photo": "http://localhost:8000/media/event_templates/basic_decorations_photo/decor1.jpg",
      "basic_background_photo": "http://localhost:8000/media/event_templates/basic_background_photo/bg1.jpg",
      "standard_cover_video": "http://localhost:8000/media/event_templates/standard_cover_video/cover1.mp4",
      "standard_background_video": "http://localhost:8000/media/event_templates/standard_background_video/bg1.mp4"
    }
  }
}
```

**Error Responses:**
- `404 Not Found`: Template not found

### 4. Get Event Template Info

**Endpoint:** `GET /api/events/{event_id}/template_info/`

**Authentication:** Required (View event permissions)

**Description:** Retrieve template info for event selected template.

**Response:**
```json
{
  "id": 1,
  "name": "Premium Wedding Template",
  "package_plan": {
    "id": 1,
    "name": "Premium Plan",
    "price": "299.00",
    "features": [...]
  },
  "template_colors": [...],
  "template_fonts": [...],
  "open_envelope_button": "http://localhost:8000/media/event_templates/open_envelope_button/button1.png",
  "basic_decoration_photo": "http://localhost:8000/media/event_templates/basic_decorations_photo/decor1.jpg",
  "basic_background_photo": "http://localhost:8000/media/event_templates/basic_background_photo/bg1.jpg",
  "standard_cover_video": "http://localhost:8000/media/event_templates/standard_cover_video/cover1.mp4",
  "standard_background_video": "http://localhost:8000/media/event_templates/standard_background_video/bg1.mp4"
}
```

**Error Responses:**
- `404 Not Found`: Event template is not enabled or not set for this event

## Event Detail Serializer Integration

When retrieving event details via `GET /api/events/{event_id}/`, the response includes complete template information in the `event_template_details` field when a template is enabled:

```json
{
  "id": "uuid-string",
  "title": "My Wedding Event",
  "event_template": 1,
  "event_template_enabled": true,
  "event_template_details": {
    "id": 1,
    "name": "Premium Wedding Template",
    "package_plan": {...},
    "template_colors": [...],
    "template_fonts": [...],
    "assets": {...}
  }
}
```

## Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

No specific rate limiting is currently implemented, but standard Django REST framework throttling may apply.

## CORS

CORS is enabled for frontend integration. All template endpoints support cross-origin requests from configured domains.