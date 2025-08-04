# Event CRUD API Documentation

This document provides comprehensive documentation for the Event API CRUD operations in the GoEvent platform.

## Table of Contents

1. [Authentication](#authentication)
2. [Base URL](#base-url)
3. [Event Model Overview](#event-model-overview)
4. [CRUD Operations](#crud-operations)
   - [Create Event](#create-event)
   - [List Events](#list-events)
   - [Retrieve Event](#retrieve-event)
   - [Update Event](#update-event)
   - [Delete Event](#delete-event)
5. [Additional Event Actions](#additional-event-actions)
6. [Permissions](#permissions)
7. [Error Handling](#error-handling)
8. [Examples](#examples)

## Authentication

All write operations (CREATE, UPDATE, DELETE) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

To obtain a JWT token:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "your_password"}'
```

## Base URL

```
/api/events/
```

## Event Model Overview

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Unique event identifier |
| `title` | String | Yes | Event title (max 200 chars) |
| `slug` | String | Auto | Auto-generated URL slug |
| `description` | Text | Yes | Event description |
| `short_description` | String | No | Brief description (max 300 chars) |
| `start_date` | DateTime | Yes | Event start date and time |
| `end_date` | DateTime | Yes | Event end date and time |
| `timezone` | String | No | Timezone (default: UTC) |
| `location` | Text | No | Event location |
| `virtual_link` | URL | No | Virtual event link |
| `is_virtual` | Boolean | No | Is this a virtual event? |
| `privacy` | Choice | No | `public` or `private` (default: public) |
| `status` | Choice | No | `draft`, `published`, `cancelled`, `completed` |
| `organizer` | User | Auto | Event organizer (current user) |
| `referrer` | User | No | User who referred this event |
| `referrer_email` | Email | No | Email of referring user (write-only) |
| `category` | ForeignKey | No | Event category |
| `max_attendees` | Integer | No | Maximum number of attendees |
| `registration_required` | Boolean | No | Is registration required? |
| `registration_deadline` | DateTime | No | Registration deadline |

### Media Fields

| Field | Type | Description |
|-------|------|-------------|
| `banner_image` | ImageField | Event banner (auto-resized to 1200x800) |
| `logo_one` | ImageField | First logo |
| `logo_two` | ImageField | Second logo |
| `event_video` | FileField | Event video |
| `google_map_embed_link` | URL | Google Maps embed URL |
| `youtube_embed_link` | URL | YouTube video embed URL |

### Template Fields

| Field | Type | Description |
|-------|------|-------------|
| `event_template` | ForeignKey | Selected event template |
| `event_template_enabled` | Boolean | Template activation status (admin-only) |

## CRUD Operations

### Create Event

**Endpoint:** `POST /api/events/`

**Permission:** Authenticated users only

**Request Body:**
```json
{
  "title": "My Amazing Event",
  "description": "A detailed description of the event",
  "short_description": "Brief event summary",
  "start_date": "2025-08-15T10:00:00Z",
  "end_date": "2025-08-15T18:00:00Z",
  "timezone": "America/New_York",
  "location": "123 Main St, City, State",
  "virtual_link": "https://zoom.us/j/123456789",
  "is_virtual": false,
  "privacy": "public",
  "status": "published",
  "referrer_email": "referrer@example.com",
  "category": 1,
  "max_attendees": 100,
  "registration_required": true,
  "registration_deadline": "2025-08-14T23:59:59Z",
  "hosts_data": [
    {
      "name": "John Doe",
      "title": "Event Host",
      "bio": "Experienced event host",
      "email": "john@example.com",
      "order": 1
    }
  ],
  "agenda_data": [
    {
      "title": "Opening Ceremony",
      "description": "Welcome and introductions",
      "agenda_type": "keynote",
      "start_time_text": "10:00 AM",
      "end_time_text": "10:30 AM",
      "speaker": "Jane Smith",
      "order": 1
    }
  ],
  "event_texts_data": [
    {
      "text_type": "welcome_message",
      "language": "en",
      "title": "Welcome",
      "content": "Welcome to our amazing event!",
      "order": 1
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "My Amazing Event",
  "slug": "my-amazing-event",
  "organizer": 1,
  "created_at": "2025-08-03T10:00:00Z",
  // ... other fields
}
```

### List Events

**Endpoint:** `GET /api/events/`

**Permission:** Public (returns public events + authenticated user's events)

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | String | Search in title, description, location | `?search=conference` |
| `category` | String | Filter by category name | `?category=technology` |
| `organizer` | String | Filter by organizer username | `?organizer=johndoe` |
| `start_date_after` | DateTime | Events starting after date | `?start_date_after=2025-08-01T00:00:00Z` |
| `start_date_before` | DateTime | Events starting before date | `?start_date_before=2025-12-31T23:59:59Z` |
| `is_virtual` | Boolean | Filter virtual events | `?is_virtual=true` |
| `status` | Choice | Filter by status | `?status=published` |
| `privacy` | Choice | Filter by privacy | `?privacy=public` |
| `ordering` | String | Order results | `?ordering=-start_date` |
| `page` | Integer | Page number | `?page=2` |

**Response:** `200 OK`
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/events/?page=2",
  "previous": null,
  "results": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Tech Conference 2025",
      "slug": "tech-conference-2025",
      "short_description": "Annual technology conference",
      "start_date": "2025-08-15T09:00:00Z",
      "end_date": "2025-08-15T17:00:00Z",
      "location": "Convention Center",
      "is_virtual": false,
      "privacy": "public",
      "status": "published",
      "banner_image": "http://localhost:8000/media/event_banners/banner.jpg",
      "organizer": 1,
      "organizer_name": "johndoe",
      "category": 1,
      "category_name": "Technology",
      "category_color": "#3498db",
      "registration_required": true,
      "max_attendees": 200,
      "collaborators_count": 3,
      "registrations_count": 45,
      "created_at": "2025-08-01T10:00:00Z",
      "is_upcoming": true,
      "is_ongoing": false,
      "is_past": false
    }
  ]
}
```

### Retrieve Event

**Endpoint:** `GET /api/events/{event_id}/`

**Permission:** 
- Public events: Anyone
- Private events: Organizer, collaborators, registered users

**Response:** `200 OK`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Tech Conference 2025",
  "slug": "tech-conference-2025",
  "description": "Annual technology conference featuring the latest innovations",
  "short_description": "Annual technology conference",
  "start_date": "2025-08-15T09:00:00Z",
  "end_date": "2025-08-15T17:00:00Z",
  "timezone": "America/New_York",
  "location": "Convention Center, 123 Main St",
  "virtual_link": "",
  "is_virtual": false,
  "privacy": "public",
  "status": "published",
  "banner_image": "http://localhost:8000/media/event_banners/banner.jpg",
  "logo_one": null,
  "logo_two": null,
  "event_video": null,
  "google_map_embed_link": "",
  "youtube_embed_link": "",
  "organizer": 1,
  "organizer_details": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture": null
  },
  "referrer": 2,
  "referrer_details": {
    "id": 2,
    "username": "referrer",
    "email": "referrer@example.com",
    "first_name": "Jane",
    "last_name": "Smith"
  },
  "category": 1,
  "category_details": {
    "id": 1,
    "name": "Technology",
    "description": "Technology events",
    "color": "#3498db"
  },
  "max_attendees": 200,
  "registration_required": true,
  "registration_deadline": "2025-08-14T23:59:59Z",
  "created_at": "2025-08-01T10:00:00Z",
  "updated_at": "2025-08-02T15:30:00Z",
  "hosts": [
    {
      "id": 1,
      "name": "Dr. Jane Smith",
      "title": "Keynote Speaker",
      "bio": "Leading expert in AI and machine learning",
      "profile_image": null,
      "email": "jane@example.com",
      "linkedin_url": "https://linkedin.com/in/janesmith",
      "order": 1,
      "translations": []
    }
  ],
  "agenda_items": [
    {
      "id": 1,
      "title": "Opening Keynote",
      "description": "Welcome and industry overview",
      "agenda_type": "keynote",
      "date": "2025-08-15",
      "date_text": "Day 1",
      "start_time_text": "9:00 AM",
      "end_time_text": "10:00 AM",
      "speaker": "Dr. Jane Smith",
      "location": "Main Hall",
      "virtual_link": "",
      "order": 1,
      "is_featured": true,
      "color": "#e74c3c",
      "icon": null,
      "translations": []
    }
  ],
  "event_texts": [
    {
      "id": 1,
      "text_type": "welcome_message",
      "language": "en",
      "title": "Welcome",
      "content": "Welcome to our annual technology conference!",
      "order": 1,
      "is_active": true
    }
  ],
  "event_languages": [
    {
      "id": 1,
      "language": "en",
      "language_display": "English",
      "created_at": "2025-08-01T10:00:00Z"
    }
  ],
  "photos": [],
  "collaborators_details": [
    {
      "id": 1,
      "user": 3,
      "user_details": {
        "id": 3,
        "username": "collaborator",
        "email": "collab@example.com"
      },
      "role": "editor",
      "invited_by": 1,
      "invited_by_name": "johndoe",
      "invited_at": "2025-08-01T12:00:00Z",
      "is_accepted": true
    }
  ],
  "registrations_details": [
    {
      "id": 1,
      "user": 4,
      "user_details": {
        "id": 4,
        "username": "attendee",
        "email": "attendee@example.com"
      },
      "status": "registered",
      "registered_at": "2025-08-02T14:00:00Z",
      "guest_count": 2,
      "total_attendees": 3
    }
  ],
  "is_upcoming": true,
  "is_ongoing": false,
  "is_past": false,
  "collaborators_count": 1,
  "registrations_count": 1,
  "can_edit": true,
  "event_template": 1,
  "event_template_enabled": false,
  "event_template_details": {
    "id": 1,
    "name": "Modern Conference",
    "description": "Modern conference template"
  }
}
```

### Update Event

**Endpoint:** `PUT /api/events/{event_id}/` or `PATCH /api/events/{event_id}/`

**Permission:** Organizer or admin/editor collaborators

**Request Body (PATCH example):**
```json
{
  "title": "Updated Event Title",
  "description": "Updated description",
  "start_date": "2025-08-16T10:00:00Z",
  "referrer_email": "newreferrer@example.com"
}
```

**Response:** `200 OK`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Updated Event Title",
  "description": "Updated description",
  // ... other updated fields
}
```

### Delete Event

**Endpoint:** `DELETE /api/events/{event_id}/`

**Permission:** Organizer only

**Response:** `204 No Content`

## Additional Event Actions

### Get User's Events

**Endpoint:** `GET /api/events/my/`

Returns events organized by or collaborated on by the authenticated user.

### Get User's Registered Events

**Endpoint:** `GET /api/events/my-registered/`

Returns events the authenticated user has registered for.

### Event Registration

**Endpoint:** `POST /api/events/{event_id}/register/`

Register for an event (creates EventRegistration).

### Event Template Information

**Endpoint:** `GET /api/events/{event_id}/template-info/`

Get detailed template information for the event.

## Permissions

### Event Access Levels

1. **Public Events**: Anyone can view
2. **Private Events**: Only organizer, collaborators, and registered users can view

### Write Permissions

1. **Organizer**: Full CRUD access
2. **Admin Collaborators**: Can update event (no delete)
3. **Editor Collaborators**: Can update event (no delete)
4. **Viewer Collaborators**: Read-only access

### Special Fields

- `event_template_enabled`: Only admin users can modify
- `organizer`: Automatically set to current user on creation
- `slug`: Auto-generated from title, cannot be manually set

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "field_name": ["Error message describing the issue"]
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

### Validation Errors

**Date Validation:**
```json
{
  "non_field_errors": ["End date must be after start time."]
}
```

**Referrer Validation:**
```json
{
  "referrer_email": ["Referrer cannot be the same as the event organizer"]
}
```

**Registration Deadline:**
```json
{
  "non_field_errors": ["Registration deadline must be before event start date."]
}
```

## Examples

### Creating a Virtual Event with Referrer

```bash
curl -X POST http://localhost:8000/api/events/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Virtual Tech Meetup",
    "description": "Monthly virtual meetup for tech enthusiasts",
    "start_date": "2025-08-20T19:00:00Z",
    "end_date": "2025-08-20T21:00:00Z",
    "is_virtual": true,
    "virtual_link": "https://zoom.us/j/123456789",
    "privacy": "public",
    "status": "published",
    "referrer_email": "friend@techcommunity.com",
    "registration_required": true,
    "max_attendees": 50
  }'
```

### Searching for Events

```bash
# Search for technology events starting after today
curl "http://localhost:8000/api/events/?search=technology&start_date_after=2025-08-03T00:00:00Z&ordering=start_date"
```

### Updating Event Status

```bash
curl -X PATCH http://localhost:8000/api/events/123e4567-e89b-12d3-a456-426614174000/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published"
  }'
```

### Upload Event Banner

```bash
curl -X PATCH http://localhost:8000/api/events/123e4567-e89b-12d3-a456-426614174000/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "banner_image=@event_banner.jpg"
```

## Notes

1. **UUID Primary Keys**: All events use UUID for enhanced security
2. **Auto-generated Slugs**: Slugs are automatically created from titles with uniqueness handling
3. **Media Auto-resize**: Uploaded images are automatically resized for optimal performance
4. **Nested Data**: Use `hosts_data`, `agenda_data`, and `event_texts_data` for creating related objects
5. **Referrer System**: Support both direct user ID (`referrer`) and email lookup (`referrer_email`)
6. **Multi-language Support**: Events support multiple languages through related models
7. **Template System**: Events can use predefined templates with custom styling
8. **Collaboration**: Support for team collaboration with role-based permissions