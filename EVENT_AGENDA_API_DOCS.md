# Event Agenda API Documentation

This document provides comprehensive documentation for the Event Agenda API endpoints, including the new icon selection feature.

## Table of Contents
- [Overview](#overview)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Icon Selection](#icon-selection)
- [Multi-language Support](#multi-language-support)
- [Permissions](#permissions)
- [Example Requests](#example-requests)

## Overview

The Event Agenda API allows you to manage agenda items for events, including:
- Creating and organizing agenda sessions, breaks, workshops, etc.
- Multi-language support for agenda content
- Custom icons for visual distinction
- Flexible date/time text formatting
- Bulk reordering of agenda items

### Base URL
```
http://localhost:8000/api/events/{event_id}/agenda/
```

## Data Models

### EventAgenda Model
```json
{
    "id": 1,
    "title": "Opening Keynote",
    "description": "Welcome address and conference overview",
    "agenda_type": "keynote",
    "date": "2024-03-15",
    "date_text": "Day 1",
    "start_time_text": "9:00 AM",
    "end_time_text": "10:00 AM",
    "speaker": "Dr. Jane Smith",
    "location": "Main Hall",
    "virtual_link": "https://zoom.us/j/123456789",
    "order": 1,
    "is_featured": true,
    "color": "#3498db",
    "icon": {
        "id": 1,
        "name": "Keynote",
        "svg_code": "<svg>...</svg>"
    },
    "translations": [
        {
            "language": "km",
            "title": "សុន្ទរកថាបើក",
            "description": "ការស្វាគមន៍ និងទិដ្ឋភាពទូទៅនៃសន្និសីទ",
            "date_text": "ថ្ងៃទី 1",
            "start_time_text": "9:00 ព្រឹក",
            "end_time_text": "10:00 ព្រឹក",
            "speaker": "បណ្ឌិត Jane Smith"
        }
    ]
}
```

### Agenda Types
- `session` - Regular session
- `break` - Coffee/lunch break
- `networking` - Networking session
- `keynote` - Keynote speech
- `workshop` - Workshop session
- `panel` - Panel discussion
- `other` - Other type

## API Endpoints

### 1. List Event Agenda Items
Get all agenda items for an event.

**Endpoint:** `GET /api/events/{event_id}/agenda/`

**Query Parameters:**
- `date` - Filter by specific date (YYYY-MM-DD)
- `agenda_type` - Filter by agenda type

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "title": "Opening Keynote",
        "description": "Welcome address",
        "agenda_type": "keynote",
        "date": "2024-03-15",
        "date_text": "Day 1",
        "start_time_text": "9:00 AM",
        "end_time_text": "10:00 AM",
        "speaker": "Dr. Jane Smith",
        "location": "Main Hall",
        "virtual_link": "",
        "order": 1,
        "is_featured": true,
        "color": "#3498db",
        "icon": {
            "id": 1,
            "name": "Keynote",
            "svg_code": "<svg>...</svg>"
        },
        "translations": []
    }
]
```

### 2. Create Agenda Item
Add a new agenda item to an event.

**Endpoint:** `POST /api/events/{event_id}/agenda/`

**Request Body:**
```json
{
    "title": "Coffee Break",
    "description": "Networking and refreshments",
    "agenda_type": "break",
    "date": "2024-03-15",
    "date_text": "Day 1",
    "start_time_text": "10:00 AM",
    "end_time_text": "10:30 AM",
    "location": "Lobby",
    "icon_id": 5,
    "order": 2,
    "color": "#e74c3c",
    "translations": [
        {
            "language": "km",
            "title": "សម្រាកផឹកកាហ្វេ",
            "description": "ការជួបជុំ និងអាហារសម្រន់",
            "start_time_text": "10:00 ព្រឹក",
            "end_time_text": "10:30 ព្រឹក"
        }
    ]
}
```

**Response (201 Created):**
Returns the created agenda item with all fields including the populated icon object.

### 3. Get Single Agenda Item
Retrieve a specific agenda item.

**Endpoint:** `GET /api/events/{event_id}/agenda/{agenda_id}/`

**Response (200 OK):**
Returns the complete agenda item object.

### 4. Update Agenda Item
Update an existing agenda item.

**Endpoint:** `PUT /api/events/{event_id}/agenda/{agenda_id}/`

**Request Body:**
Same as create, but all fields are optional. To update the icon:
```json
{
    "icon_id": 3
}
```

To remove the icon:
```json
{
    "icon_id": null
}
```

**Response (200 OK):**
Returns the updated agenda item.

### 5. Partial Update
Partially update an agenda item.

**Endpoint:** `PATCH /api/events/{event_id}/agenda/{agenda_id}/`

**Request Body:**
Only include fields to update:
```json
{
    "is_featured": true,
    "icon_id": 2
}
```

### 6. Delete Agenda Item
Remove an agenda item from the event.

**Endpoint:** `DELETE /api/events/{event_id}/agenda/{agenda_id}/`

**Response:** `204 No Content`

### 7. Bulk Reorder Agenda Items
Update the display order of multiple agenda items at once.

**Endpoint:** `PATCH /api/events/{event_id}/agenda/bulk_reorder/`

**Request Body:**
```json
{
    "updates": [
        {"id": 1, "order": 3},
        {"id": 2, "order": 1},
        {"id": 3, "order": 2}
    ]
}
```

**Response (200 OK):**
```json
{
    "message": "Updated 3 agenda items"
}
```

## Icon Selection

### Available Icons
To get a list of available icons, use the Core Data API:

**Endpoint:** `GET /api/core-data/icons/`

**Response:**
```json
[
    {
        "id": 1,
        "name": "Keynote",
        "svg_code": "<svg>...</svg>"
    },
    {
        "id": 2,
        "name": "Coffee",
        "svg_code": "<svg>...</svg>"
    },
    {
        "id": 3,
        "name": "Workshop",
        "svg_code": "<svg>...</svg>"
    }
]
```

### Setting an Icon
When creating or updating an agenda item, use the `icon_id` field:
```json
{
    "title": "Workshop Session",
    "icon_id": 3
}
```

The response will include the full icon object:
```json
{
    "title": "Workshop Session",
    "icon": {
        "id": 3,
        "name": "Workshop",
        "svg_code": "<svg>...</svg>"
    }
}
```

## Multi-language Support

### Adding Translations
Include translations in the `translations` array when creating or updating:
```json
{
    "title": "Panel Discussion",
    "translations": [
        {
            "language": "fr",
            "title": "Table Ronde",
            "description": "Discussion avec experts"
        },
        {
            "language": "ja",
            "title": "パネルディスカッション",
            "description": "専門家との討論"
        }
    ]
}
```

### Language Codes
- `en` - English
- `km` - Khmer
- `fr` - French
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese
- `th` - Thai
- `vi` - Vietnamese

## Permissions

### Permission Classes
- `IsEventAgendaEditor` - Controls access to agenda management

### Access Rules
1. **Event Organizer**: Full CRUD access
2. **Admin Collaborators**: Full CRUD access
3. **Editor Collaborators**: Create, update, delete
4. **Viewer Collaborators**: Read-only access
5. **Public Events**: Anyone can view agenda items
6. **Private Events**: Only invited users can view

## Example Requests

### Create a Featured Keynote with Icon
```bash
curl -X POST http://localhost:8000/api/events/123/agenda/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI in Healthcare",
    "description": "Exploring the future of medical AI",
    "agenda_type": "keynote",
    "date": "2024-03-15",
    "date_text": "Day 1 - Morning",
    "start_time_text": "11:00 AM",
    "end_time_text": "12:00 PM",
    "speaker": "Prof. John Doe",
    "location": "Conference Hall A",
    "icon_id": 1,
    "is_featured": true,
    "color": "#9b59b6",
    "order": 3
  }'
```

### Update Icon for Existing Agenda Item
```bash
curl -X PATCH http://localhost:8000/api/events/123/agenda/456/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "icon_id": 7
  }'
```

### Create Workshop with Multi-language Support
```bash
curl -X POST http://localhost:8000/api/events/123/agenda/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hands-on Machine Learning",
    "agenda_type": "workshop",
    "icon_id": 3,
    "translations": [
      {
        "language": "km",
        "title": "ការរៀនម៉ាស៊ីនដោយផ្ទាល់",
        "description": "សិក្ខាសាលាជាក់ស្តែង"
      },
      {
        "language": "zh",
        "title": "机器学习实践",
        "description": "实践研讨会"
      }
    ]
  }'
```

## Frontend Integration Tips

### Displaying Icons
The icon's `svg_code` can be directly embedded in your HTML:
```html
<div class="agenda-icon" v-html="agendaItem.icon.svg_code"></div>
```

### Icon Selection UI
```vue
<template>
  <select v-model="selectedIconId">
    <option :value="null">No Icon</option>
    <option v-for="icon in availableIcons" :key="icon.id" :value="icon.id">
      {{ icon.name }}
    </option>
  </select>
</template>

<script>
export default {
  data() {
    return {
      selectedIconId: null,
      availableIcons: []
    }
  },
  async mounted() {
    const response = await fetch('/api/core-data/icons/');
    this.availableIcons = await response.json();
  }
}
</script>
```

### Grouping by Date
```javascript
// Group agenda items by date
const groupedAgenda = agendaItems.reduce((groups, item) => {
  const date = item.date || 'Other';
  if (!groups[date]) {
    groups[date] = {
      date: date,
      dateText: item.date_text || date,
      items: []
    };
  }
  groups[date].items.push(item);
  return groups;
}, {});
```

## Error Handling

### Common Errors

**403 Forbidden:**
```json
{
    "detail": "You do not have permission to perform this action."
}
```

**400 Bad Request (Invalid Icon):**
```json
{
    "icon_id": ["Invalid pk \"999\" - object does not exist."]
}
```

**400 Bad Request (Missing Required Field):**
```json
{
    "title": ["This field is required."]
}
```