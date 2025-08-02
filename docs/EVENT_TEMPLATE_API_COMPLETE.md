# Event Template API Documentation

## Overview

The Event Template system in GoEvent provides a flexible template-based event creation system with customizable colors, fonts, and media assets. This documentation covers all template-related API endpoints, their usage, and integration patterns.

## Base URL

```
http://localhost:8000/api/core-data/
```

## Authentication

Most template endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Event Templates

### List Event Templates

**Endpoint:** `GET /event-templates/`

**Authentication:** Not required for basic listing

**Description:** Retrieve a paginated list of all available event templates.

**Parameters:**
- `page` (optional): Page number for pagination
- `search` (optional): Search templates by name or description

**Response:**
```json
{
  "count": 15,
  "next": "http://localhost:8000/api/core-data/event-templates/?page=2",
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Corporate Conference",
      "description": "Professional template for corporate events",
      "thumbnail": "/media/template_thumbnails/corporate.jpg",
      "category": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Business"
      },
      "pricing_plan": {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "name": "Premium",
        "price": 29.99
      },
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Template Details

**Endpoint:** `GET /event-templates/{id}/`

**Authentication:** Required

**Description:** Retrieve detailed information about a specific template including all associated assets.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Corporate Conference",
  "description": "Professional template for corporate events",
  "thumbnail": "/media/template_thumbnails/corporate.jpg",
  "banner_image": "/media/template_banners/corporate_banner.jpg",
  "category": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Business",
    "description": "Professional business events"
  },
  "pricing_plan": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Premium",
    "price": 29.99,
    "currency": "USD",
    "features": ["Custom branding", "Advanced analytics", "Priority support"]
  },
  "template_colors": [
    {
      "id": 1,
      "name": "Primary Blue",
      "hex_code": "#1e40af",
      "color_type": "primary"
    },
    {
      "id": 2,
      "name": "Secondary Gray",
      "hex_code": "#6b7280",
      "color_type": "secondary"
    }
  ],
  "template_fonts": [
    {
      "id": 1,
      "language": "en",
      "custom_font": {
        "id": 1,
        "name": "Roboto",
        "font_file": "/media/fonts/roboto.woff2",
        "font_type": "sans-serif"
      }
    }
  ],
  "button_decoration": "/media/template_assets/buttons/corporate_button.png",
  "decoration_image": "/media/template_assets/decorations/corporate_decoration.png",
  "background_video": "/media/template_videos/corporate_bg.mp4",
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z"
}
```

### Browse Templates (Authenticated)

**Endpoint:** `GET /event-templates/browse_templates/`

**Authentication:** Required

**Description:** Browse available templates with enhanced filtering options for authenticated users.

**Parameters:**
- `category` (optional): Filter by category ID
- `price_range` (optional): Filter by price range (e.g., "0-50")
- `is_premium` (optional): Filter premium templates (true/false)

**Response:**
```json
{
  "count": 12,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Corporate Conference",
      "description": "Professional template for corporate events",
      "thumbnail": "/media/template_thumbnails/corporate.jpg",
      "category_name": "Business",
      "pricing_plan_name": "Premium",
      "price": 29.99,
      "is_premium": true,
      "preview_url": "/templates/preview/550e8400-e29b-41d4-a716-446655440000/"
    }
  ]
}
```

### Public Template Assets

**Endpoint:** `GET /event-templates/public_template_assets/`

**Authentication:** Not required

**Description:** Get public template assets for showcase pages and previews.

**Response:**
```json
{
  "featured_templates": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Corporate Conference",
      "thumbnail": "/media/template_thumbnails/corporate.jpg",
      "category": "Business",
      "sample_preview": "/media/template_previews/corporate_sample.jpg"
    }
  ],
  "categories": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Business",
      "template_count": 8
    }
  ]
}
```

### Update Template (Admin Only)

**Endpoint:** `PUT /event-templates/{id}/`

**Authentication:** Required (Admin only)

**Description:** Update template information and settings.

**Request Body:**
```json
{
  "name": "Updated Corporate Conference",
  "description": "Updated professional template for corporate events",
  "is_active": true,
  "category": "123e4567-e89b-12d3-a456-426614174000",
  "pricing_plan": "123e4567-e89b-12d3-a456-426614174001"
}
```

**Response:** Updated template object (same structure as GET detail)

## Template Colors

### List Template Colors

**Endpoint:** `GET /template-colors/`

**Authentication:** Required

**Description:** Retrieve all template colors with filtering options.

**Parameters:**
- `template` (optional): Filter by template ID
- `color_type` (optional): Filter by color type (primary, secondary, accent)

**Response:**
```json
{
  "count": 25,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "template": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Corporate Conference"
      },
      "name": "Primary Blue",
      "hex_code": "#1e40af",
      "color_type": "primary",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Create Template Color (Admin Only)

**Endpoint:** `POST /template-colors/`

**Authentication:** Required (Admin only)

**Description:** Create a new template color.

**Request Body:**
```json
{
  "template": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Brand Primary",
  "hex_code": "#1e40af",
  "color_type": "primary"
}
```

**Response:**
```json
{
  "id": 26,
  "template": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Corporate Conference"
  },
  "name": "Brand Primary",
  "hex_code": "#1e40af",
  "color_type": "primary",
  "created_at": "2024-01-25T15:20:00Z"
}
```

### Delete Template Color (Admin Only)

**Endpoint:** `DELETE /template-colors/{id}/`

**Authentication:** Required (Admin only)

**Description:** Delete a template color.

**Response:** `204 No Content`

## Template Fonts

### List Template Fonts

**Endpoint:** `GET /template-fonts/`

**Authentication:** Required

**Description:** Retrieve template fonts with language-specific filtering.

**Parameters:**
- `template` (optional): Filter by template ID
- `language` (optional): Filter by language code (en, km, fr, ja, ko, zh, th, vi)

**Response:**
```json
{
  "count": 15,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "template": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Corporate Conference"
      },
      "language": "en",
      "language_display": "English",
      "custom_font": {
        "id": 1,
        "name": "Roboto",
        "font_file": "/media/fonts/2025/roboto-regular.woff2",
        "font_type": "sans-serif",
        "created_at": "2024-01-10T09:00:00Z"
      }
    }
  ]
}
```

## Custom Fonts

### List Custom Fonts

**Endpoint:** `GET /custom-fonts/`

**Authentication:** Required

**Description:** Retrieve all available custom fonts.

**Response:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Roboto",
      "font_file": "/media/fonts/2025/roboto-regular.woff2",
      "font_type": "sans-serif",
      "file_size": "45KB",
      "created_at": "2024-01-10T09:00:00Z"
    }
  ]
}
```

### Upload Custom Font (Admin Only)

**Endpoint:** `POST /custom-fonts/`

**Authentication:** Required (Admin only)

**Content-Type:** `multipart/form-data`

**Description:** Upload a new custom font file.

**Request Body:**
```
name: "New Font Name"
font_type: "sans-serif"
font_file: [font file - .woff, .woff2, .ttf, .otf]
```

**Response:**
```json
{
  "id": 11,
  "name": "New Font Name",
  "font_file": "/media/fonts/2025/new-font-name.woff2",
  "font_type": "sans-serif",
  "file_size": "52KB",
  "created_at": "2024-01-25T16:30:00Z"
}
```

## Pricing Plans

### List Pricing Plans

**Endpoint:** `GET /pricing-plans/`

**Authentication:** Required

**Description:** Retrieve all pricing plans with associated categories.

**Response:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "name": "Premium",
      "price": 29.99,
      "currency": "USD",
      "description": "Advanced features for professional events",
      "features": [
        "Custom branding",
        "Advanced analytics",
        "Priority support",
        "Unlimited templates"
      ],
      "category": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Business",
        "description": "Professional business events"
      },
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Custom Icons

### List Custom Icons

**Endpoint:** `GET /custom-icons/`

**Authentication:** Required

**Description:** Retrieve all custom SVG icons available for templates.

**Response:**
```json
{
  "count": 20,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Calendar Icon",
      "svg_content": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\">...</svg>",
      "category": "date-time",
      "tags": ["calendar", "date", "schedule"],
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

## Team Members

### List Team Members

**Endpoint:** `GET /team-members/`

**Authentication:** Required

**Description:** Retrieve team member information for about pages.

**Response:**
```json
{
  "count": 8,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "John Doe",
      "position": "Lead Developer",
      "bio": "Experienced full-stack developer with 8+ years in event management systems",
      "profile_picture": "/media/team_pictures/john_doe.jpg",
      "social_links": {
        "linkedin": "https://linkedin.com/in/johndoe",
        "github": "https://github.com/johndoe"
      },
      "is_active": true
    }
  ]
}
```

## Event Categories

### List Event Categories

**Endpoint:** `GET /event-categories/`

**Authentication:** Required

**Description:** Retrieve all event categories for template filtering.

**Response:**
```json
{
  "count": 12,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Business",
      "description": "Professional business events and conferences",
      "icon": "/media/category_icons/business.svg",
      "template_count": 8,
      "is_active": true
    }
  ]
}
```

## Error Responses

All endpoints follow consistent error response format:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "hex_code": ["Invalid hex color code format"]
  }
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

### 413 Payload Too Large
```json
{
  "error": "File too large",
  "details": "Maximum file size is 5MB"
}
```

## Integration Examples

### Frontend Template Browser

```javascript
// Fetch templates with filtering
const fetchTemplates = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/core-data/event-templates/browse_templates/?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Usage
const templates = await fetchTemplates({
  category: 'business',
  is_premium: 'false'
});
```

### Template Color Management

```javascript
// Create new template color
const createTemplateColor = async (colorData) => {
  const response = await fetch('/api/core-data/template-colors/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(colorData)
  });
  return response.json();
};

// Usage
const newColor = await createTemplateColor({
  template: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Brand Accent',
  hex_code: '#f59e0b',
  color_type: 'accent'
});
```

### Font Upload

```javascript
// Upload custom font
const uploadFont = async (fontFile, name, type) => {
  const formData = new FormData();
  formData.append('font_file', fontFile);
  formData.append('name', name);
  formData.append('font_type', type);

  const response = await fetch('/api/core-data/custom-fonts/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};
```

## Rate Limiting

Template endpoints have the following rate limits:
- **Read operations**: 100 requests per minute
- **Create operations**: 10 requests per minute  
- **File uploads**: 5 requests per minute

## Caching

Template data is cached for performance:
- **Template lists**: 15 minutes
- **Template details**: 30 minutes
- **Public assets**: 1 hour

Use `Cache-Control: no-cache` header to bypass cache when needed.

## Webhooks

Template-related webhook events:
- `template.created` - New template added
- `template.updated` - Template modified
- `template.activated` - Template activated
- `template.deactivated` - Template deactivated

## Best Practices

1. **Template Selection**: Always check `is_active` status before displaying templates
2. **Color Validation**: Validate hex codes on frontend before API submission
3. **Font Loading**: Preload custom fonts for better user experience
4. **Image Optimization**: Compress template images before upload
5. **Caching**: Implement client-side caching for frequently accessed templates
6. **Error Handling**: Always handle file upload errors gracefully
7. **Performance**: Use pagination for large template lists
8. **Security**: Never expose admin endpoints to regular users

## Support

For template API support, contact:
- **Documentation**: Check this guide first
- **Issues**: Report bugs via project repository
- **Feature Requests**: Submit enhancement requests through proper channels