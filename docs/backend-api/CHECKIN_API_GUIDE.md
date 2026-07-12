# Event Check-In API Guide

This guide covers the check-in functionality for event attendees, including APIs for organizers to check in attendees and for users to self-check-in.

---

## Overview

The check-in system allows event organizers and collaborators to track attendee arrival at events. It supports:

- **Staff check-in**: Organizers/collaborators check in attendees using confirmation codes
- **Self check-in**: Attendees check themselves in
- **Registration management**: View and manage all event registrations
- **Guest tracking**: Support for guests (up to 10 per registration)

---

## Registration Status Flow

Registrations progress through these statuses:

1. **`registered`** - Initial registration (can check in)
2. **`confirmed`** - Registration confirmed (can check in)
3. **`checked_in`** - Attendee has arrived at event
4. **`cancelled`** - Registration cancelled (cannot check in)

---

## Check-In Rules

Check-in is only allowed when:

- Registration status is `registered` or `confirmed`
- Current date is the event start date or later
- Current date is before or on the event end date
- Registration has not been cancelled

---

## API Endpoints

### 1. Staff Check-In (Organizer/Collaborator)

Check in an attendee using their confirmation code. Requires organizer or collaborator permissions (admin/editor role).

**Endpoint:**
```
POST /api/events/{event_id}/checkin/
```

**Permissions:**
- Event organizer
- Event collaborator with `admin` or `editor` role

**Request Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "confirmation_code": "ABC123DEF456"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Check-in successful",
  "registration": {
    "id": 1,
    "user": 28,
    "user_details": {
      "id": 28,
      "username": "john_doe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "profile_picture": "https://api.goevent.online/media/profile_pics/john.jpg"
    },
    "status": "checked_in",
    "registered_at": "2025-01-15T10:30:00Z",
    "confirmation_code": "ABC123DEF456",
    "guest_count": 2,
    "total_attendees": 3,
    "notes": "",
    "checked_in_at": "2025-01-20T09:15:00Z",
    "checked_in_by": 5,
    "checked_in_by_details": {
      "id": 5,
      "username": "event_staff",
      "email": "staff@example.com",
      "first_name": "Staff",
      "last_name": "Member",
      "profile_picture": null
    },
    "cancelled_at": null,
    "is_checked_in": true,
    "can_check_in": false,
    "attended_at": null
  }
}
```

**Error Responses:**

**403 Forbidden** - Not authorized:
```json
{
  "error": "Permission denied"
}
```

**400 Bad Request** - Missing confirmation code:
```json
{
  "error": "Confirmation code is required"
}
```

**404 Not Found** - Invalid confirmation code:
```json
{
  "error": "Invalid confirmation code"
}
```

**400 Bad Request** - Check-in not allowed (wrong time):
```json
{
  "error": "Check-in is only allowed on the event day or during the event period"
}
```

**400 Bad Request** - Already checked in or cancelled:
```json
{
  "error": "Check-in failed. User may not be eligible for check-in."
}
```

**Example cURL:**
```bash
curl -X POST https://api.goevent.online/api/events/550e8400-e29b-41d4-a716-446655440000/checkin/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "confirmation_code": "ABC123DEF456"
  }'
```

---

### 2. Self Check-In (Attendee)

Allow users to check themselves in without requiring a confirmation code. The system automatically identifies the user from their authentication token.

**Endpoint:**
```
POST /api/events/{event_id}/self-checkin/
```

**Permissions:**
- Authenticated user with valid registration for the event

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{}
```
*(No body required - user is identified from auth token)*

**Success Response (200 OK):**
```json
{
  "message": "Self check-in successful",
  "registration": {
    "id": 1,
    "user": 28,
    "user_details": {
      "id": 28,
      "username": "john_doe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "profile_picture": "https://api.goevent.online/media/profile_pics/john.jpg"
    },
    "status": "checked_in",
    "registered_at": "2025-01-15T10:30:00Z",
    "confirmation_code": "ABC123DEF456",
    "guest_count": 2,
    "total_attendees": 3,
    "notes": "",
    "checked_in_at": "2025-01-20T09:15:00Z",
    "checked_in_by": null,
    "checked_in_by_details": null,
    "cancelled_at": null,
    "is_checked_in": true,
    "can_check_in": false,
    "attended_at": null
  }
}
```

**Error Responses:**

**404 Not Found** - Not registered:
```json
{
  "error": "User is not registered for this event or registration is not valid"
}
```

**400 Bad Request** - Check-in not allowed:
```json
{
  "error": "Check-in is only allowed on the event day or during the event period"
}
```

**400 Bad Request** - Already checked in:
```json
{
  "error": "Self check-in failed. You may have already checked in or your registration is not valid."
}
```

**Example cURL:**
```bash
curl -X POST https://api.goevent.online/api/events/550e8400-e29b-41d4-a716-446655440000/self-checkin/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 3. View Event Registrations

Retrieve all registrations for an event, including check-in status. Organizers and collaborators see all registrations, while regular users only see their own.

**Endpoint:**
```
GET /api/events/{event_id}/registrations/
```

**Permissions:**
- Event organizer: See all registrations
- Event collaborator (admin/editor): See all registrations
- Regular users: See only their own registration

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "count": 45,
  "next": "https://api.goevent.online/api/events/550e8400-e29b-41d4-a716-446655440000/registrations/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": 28,
      "user_details": {
        "id": 28,
        "username": "john_doe",
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "profile_picture": "https://api.goevent.online/media/profile_pics/john.jpg"
      },
      "status": "checked_in",
      "registered_at": "2025-01-15T10:30:00Z",
      "confirmation_code": "ABC123DEF456",
      "guest_count": 2,
      "total_attendees": 3,
      "notes": "Dietary restriction: Vegetarian",
      "checked_in_at": "2025-01-20T09:15:00Z",
      "checked_in_by": 5,
      "checked_in_by_details": {
        "id": 5,
        "username": "event_staff",
        "first_name": "Staff",
        "last_name": "Member"
      },
      "cancelled_at": null,
      "is_checked_in": true,
      "can_check_in": false
    },
    {
      "id": 2,
      "user": 29,
      "user_details": {
        "id": 29,
        "username": "jane_smith",
        "email": "jane@example.com",
        "first_name": "Jane",
        "last_name": "Smith",
        "profile_picture": null
      },
      "status": "registered",
      "registered_at": "2025-01-16T14:20:00Z",
      "confirmation_code": "XYZ789GHI012",
      "guest_count": 0,
      "total_attendees": 1,
      "notes": "",
      "checked_in_at": null,
      "checked_in_by": null,
      "checked_in_by_details": null,
      "cancelled_at": null,
      "is_checked_in": false,
      "can_check_in": true
    }
  ]
}
```

**Query Parameters:**

- `page` - Page number for pagination
- `status` - Filter by status (`registered`, `confirmed`, `checked_in`, `cancelled`)

**Example cURL:**
```bash
# Get all registrations
curl -X GET https://api.goevent.online/api/events/550e8400-e29b-41d4-a716-446655440000/registrations/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get only checked-in attendees
curl -X GET "https://api.goevent.online/api/events/550e8400-e29b-41d4-a716-446655440000/registrations/?status=checked_in" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4. Get User's Own Registration

Retrieve the authenticated user's registration details for a specific event.

**Endpoint:**
```
GET /api/events/{event_id}/my-registration/
```

**Permissions:**
- Authenticated user

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "user": 28,
  "user_details": {
    "id": 28,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture": "https://api.goevent.online/media/profile_pics/john.jpg"
  },
  "status": "registered",
  "registered_at": "2025-01-15T10:30:00Z",
  "confirmation_code": "ABC123DEF456",
  "guest_count": 2,
  "total_attendees": 3,
  "notes": "",
  "checked_in_at": null,
  "checked_in_by": null,
  "checked_in_by_details": null,
  "cancelled_at": null,
  "is_checked_in": false,
  "can_check_in": true
}
```

**Error Responses:**

**404 Not Found** - Not registered:
```json
{
  "error": "Registration not found"
}
```

**Example cURL:**
```bash
curl -X GET https://api.goevent.online/api/events/550e8400-e29b-41d4-a716-446655440000/my-registration/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Registration Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Registration ID |
| `user` | Integer | User ID |
| `user_details` | Object | Full user profile (username, email, name, picture) |
| `status` | String | `registered`, `confirmed`, `checked_in`, or `cancelled` |
| `registered_at` | DateTime | When user registered |
| `confirmation_code` | String | 12-character unique code |
| `guest_count` | Integer | Number of additional guests (0-10) |
| `total_attendees` | Integer | User + guests (calculated field) |
| `notes` | String | Optional notes (dietary restrictions, etc.) |
| `checked_in_at` | DateTime | When check-in occurred (null if not checked in) |
| `checked_in_by` | Integer | User ID of staff who checked in (null for self check-in) |
| `checked_in_by_details` | Object | Staff member's profile details |
| `cancelled_at` | DateTime | When registration was cancelled |
| `is_checked_in` | Boolean | True if status is `checked_in` |
| `can_check_in` | Boolean | True if check-in is currently allowed |

---

## Common Use Cases

### 1. Event Staff Check-In Flow

```javascript
// 1. Scan QR code or get confirmation code from attendee
const confirmationCode = "ABC123DEF456";

// 2. Call check-in API
const response = await fetch(`/api/events/${eventId}/checkin/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    confirmation_code: confirmationCode
  })
});

// 3. Handle response
if (response.ok) {
  const data = await response.json();
  console.log(`Checked in: ${data.registration.user_details.first_name}`);
  console.log(`Total attendees: ${data.registration.total_attendees}`);
} else {
  const error = await response.json();
  console.error(error.error);
}
```

### 2. Attendee Self Check-In

```javascript
// User taps "I'm Here" button
const response = await fetch(`/api/events/${eventId}/self-checkin/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

if (response.ok) {
  const data = await response.json();
  showSuccess("You're checked in! Enjoy the event!");
} else {
  const error = await response.json();
  showError(error.error);
}
```

### 3. Check-In Dashboard

```javascript
// Get all registrations to show check-in status
const response = await fetch(`/api/events/${eventId}/registrations/`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const data = await response.json();

// Calculate stats
const stats = {
  total: data.count,
  checkedIn: data.results.filter(r => r.is_checked_in).length,
  pending: data.results.filter(r => r.can_check_in).length,
  cancelled: data.results.filter(r => r.status === 'cancelled').length,
  totalAttendees: data.results.reduce((sum, r) => sum + r.total_attendees, 0)
};

console.log(`Check-in progress: ${stats.checkedIn}/${stats.total}`);
```

### 4. Filter Checked-In Attendees

```javascript
// Get only checked-in attendees
const response = await fetch(
  `/api/events/${eventId}/registrations/?status=checked_in`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);

const data = await response.json();
const checkedInList = data.results.map(r => ({
  name: `${r.user_details.first_name} ${r.user_details.last_name}`,
  checkedInAt: r.checked_in_at,
  totalAttendees: r.total_attendees
}));
```

---

## Security & Permissions

### Staff Check-In Permissions

Only users with these roles can check in attendees:
- Event **organizer**
- Event **collaborators** with `admin` role
- Event **collaborators** with `editor` role

Viewers cannot check in attendees.

### Self Check-In Permissions

Any authenticated user with a valid registration can self-check-in.

### Viewing Registrations

- **Organizers/admins/editors**: See all registrations
- **Regular users**: See only their own registration
- **Unauthenticated users**: No access

---

## Best Practices

1. **QR Codes**: Generate QR codes containing confirmation codes for easy scanning
2. **Guest Count**: Always display `total_attendees` (not just `guest_count`) for accurate headcount
3. **Timing**: Check `can_check_in` field before showing check-in UI
4. **Error Handling**: Display user-friendly messages for common errors (wrong time, already checked in)
5. **Real-time Updates**: Refresh registration list after each check-in for accurate counts
6. **Offline Support**: Cache confirmation codes for offline check-in, sync when online

---

## Related APIs

- **Registration**: `POST /api/events/{event_id}/register/` - Register for an event
- **Unregister**: `POST /api/events/{event_id}/unregister/` - Cancel registration
- **My Events**: `GET /api/events/my-registered/` - List all events user is registered for

---

## Testing

```bash
# 1. Register for an event
curl -X POST http://localhost:8000/api/events/{event_id}/register/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"guest_count": 2, "notes": "Vegetarian meal please"}'

# 2. Get confirmation code
curl -X GET http://localhost:8000/api/events/{event_id}/my-registration/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. Staff check-in (use different token for staff)
curl -X POST http://localhost:8000/api/events/{event_id}/checkin/ \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirmation_code": "ABC123DEF456"}'

# 4. Or self check-in
curl -X POST http://localhost:8000/api/events/{event_id}/self-checkin/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 5. View all registrations (as organizer)
curl -X GET http://localhost:8000/api/events/{event_id}/registrations/ \
  -H "Authorization: Bearer $ORGANIZER_TOKEN"
```

---

## Notes

- Check-in timing is validated server-side - must be on event day or during event
- `checked_in_by` is automatically set to the staff member who performed check-in
- Self check-in sets `checked_in_by` to null
- Once checked in, status cannot be changed back to `registered`
- Guest count is immutable after check-in (can only be changed before)
- Maximum 10 guests per registration enforced at validation level
