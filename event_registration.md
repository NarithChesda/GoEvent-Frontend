# Event Registration RSVP System Documentation

## Overview

The Event Registration RSVP system allows users to register for events, manage their attendance, and check in during the event. The system supports guest management (up to 10 guests per registration) and provides both self-service and admin-managed check-in functionality.

## Features

- **RSVP Registration**: Users can register for events with guest count
- **Guest Management**: Support for up to 10 guests per registration
- **Registration Updates**: Users can modify their registration details
- **Unregistration**: Users can cancel their registration
- **Self Check-in**: Users can check themselves in during event day
- **Admin Check-in**: Organizers/collaborators can check in attendees using confirmation codes
- **Capacity Management**: Automatic enforcement of event capacity limits
- **Registration Status Tracking**: Full status lifecycle tracking

## API Endpoints

### 1. RSVP for Event

**Endpoint:** `POST /api/events/{event_id}/rsvp/`

**Description:** Register for an event or update existing registration.

**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
    "guest_count": 2,
    "notes": "Looking forward to this event!"
}
```

**Success Response (201 Created for new / 200 OK for update):**
```json
{
    "message": "RSVP successful",
    "registration": {
        "id": 1,
        "user": 4,
        "user_details": {...},
        "status": "registered",
        "registered_at": "2025-07-29T07:44:12.111387Z",
        "confirmation_code": "DE5A163F-706",
        "guest_count": 2,
        "total_attendees": 3,
        "notes": "Looking forward to this event!",
        "checked_in_at": null,
        "checked_in_by": null,
        "checked_in_by_details": null,
        "cancelled_at": null,
        "is_checked_in": false,
        "can_check_in": true,
        "attended_at": null
    }
}
```

**Error Responses:**
- **400 Bad Request:** Registration deadline passed, capacity exceeded, invalid guest count
- **404 Not Found:** Event not found

**Business Rules:**
- Maximum 10 guests per registration
- Cannot exceed event capacity if set
- Can update existing registration if not checked in
- Cancelled registrations can be reactivated

### 2. Unregister from Event

**Endpoint:** `POST /api/events/{event_id}/unregister/`

**Description:** Cancel registration for an event.

**Authentication:** Required (JWT Bearer token)

**Success Response (200 OK):**
```json
{
    "message": "Registration cancelled successfully",
    "registration": {
        "id": 1,
        "status": "cancelled",
        "cancelled_at": "2025-07-29T07:44:33.421089Z",
        ...
    }
}
```

**Error Responses:**
- **404 Not Found:** User not registered for event
- **400 Bad Request:** Cannot unregister after check-in

### 3. Self Check-in

**Endpoint:** `POST /api/events/{event_id}/self-checkin/`

**Description:** User checks themselves into the event.

**Authentication:** Required (JWT Bearer token)

**Success Response (200 OK):**
```json
{
    "message": "Self check-in successful",
    "registration": {
        "id": 1,
        "status": "checked_in",
        "checked_in_at": "2025-07-29T07:45:05.927083Z",
        "checked_in_by": 4,
        "checked_in_by_details": {...},
        "is_checked_in": true,
        "can_check_in": false,
        ...
    }
}
```

**Error Responses:**
- **404 Not Found:** User not registered or registration not valid
- **400 Bad Request:** Check-in not allowed (wrong date/time)

**Business Rules:**
- Can only check in on event day or during event
- Cannot check in if registration is cancelled
- Self check-in tracks the user as the check-in performer

### 4. Admin Check-in

**Endpoint:** `POST /api/events/{event_id}/checkin/`

**Description:** Organizer or collaborator checks in an attendee using confirmation code.

**Authentication:** Required (JWT Bearer token)
**Permissions:** Event organizer or admin/editor collaborators only

**Request Body:**
```json
{
    "confirmation_code": "DE5A163F-706"
}
```

**Success Response (200 OK):**
```json
{
    "message": "Check-in successful",
    "registration": {
        "id": 1,
        "status": "checked_in",
        "checked_in_at": "2025-07-29T07:46:06.732080Z",
        "checked_in_by": 1,
        "checked_in_by_details": {...},
        ...
    }
}
```

**Error Responses:**
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Invalid confirmation code
- **400 Bad Request:** Check-in failed, confirmation code required

### 5. Get My Registration

**Endpoint:** `GET /api/events/{event_id}/my-registration/`

**Description:** Get current user's registration status for an event.

**Authentication:** Required (JWT Bearer token)

**Success Response (200 OK):**
```json
{
    "id": 1,
    "user": 4,
    "user_details": {...},
    "status": "registered",
    "confirmation_code": "DE5A163F-706",
    "guest_count": 2,
    "total_attendees": 3,
    "is_checked_in": false,
    "can_check_in": true,
    ...
}
```

**Error Responses:**
- **404 Not Found:** User not registered for event

## Registration Status Lifecycle

1. **registered** - Initial status when user RSVPs
2. **confirmed** - Optional intermediate status (future use)
3. **checked_in** - User has checked into the event
4. **cancelled** - Registration has been cancelled

## Usage Examples

### 1. Complete RSVP Flow

```bash
# 1. Get authentication token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# 2. RSVP for event with guests
curl -X POST "http://localhost:8000/api/events/{event_id}/rsvp/" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"guest_count": 2, "notes": "Excited to attend!"}'

# 3. Check registration status
curl -H "Authorization: Bearer {token}" \
  "http://localhost:8000/api/events/{event_id}/my-registration/"

# 4. Self check-in on event day
curl -X POST "http://localhost:8000/api/events/{event_id}/self-checkin/" \
  -H "Authorization: Bearer {token}"
```

### 2. Admin Check-in Flow

```bash
# Admin checks in attendee using confirmation code
curl -X POST "http://localhost:8000/api/events/{event_id}/checkin/" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"confirmation_code": "DE5A163F-706"}'
```

### 3. Unregister Flow

```bash
# Cancel registration
curl -X POST "http://localhost:8000/api/events/{event_id}/unregister/" \
  -H "Authorization: Bearer {token}"

# Re-register later (reactivates cancelled registration)
curl -X POST "http://localhost:8000/api/events/{event_id}/rsvp/" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"guest_count": 1}'
```

## Model Details

### EventRegistration Model

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| event | ForeignKey | Reference to Event |
| user | ForeignKey | Reference to User |
| status | CharField | Registration status (registered/confirmed/checked_in/cancelled) |
| registered_at | DateTimeField | When registration was created |
| confirmation_code | CharField | Unique code for check-in (auto-generated) |
| guest_count | PositiveIntegerField | Number of guests (0-10) |
| notes | TextField | Additional notes from user |
| checked_in_at | DateTimeField | When user checked in |
| checked_in_by | ForeignKey | Who performed the check-in |
| cancelled_at | DateTimeField | When registration was cancelled |

### Computed Properties

- `total_attendees`: User + guest count
- `is_checked_in`: Boolean check if status is checked_in
- `can_check_in`: Boolean check if eligible for check-in

### Validation Rules

1. **Guest Count**: Maximum 10 guests per registration
2. **Event Capacity**: Total attendees cannot exceed event max_attendees
3. **Check-in Timing**: Can only check in on event day or during event
4. **Status Transitions**: 
   - registered → checked_in ✓
   - registered → cancelled ✓
   - cancelled → registered ✓ (re-registration)
   - checked_in → cancelled ✗
   - checked_in → registered ✗

## Integration Notes

- Confirmation codes are automatically generated as UUIDs (12 characters)
- Check-in functionality respects event dates and times
- Admin permissions cascade to collaborators with admin/editor roles
- Capacity calculations include all non-cancelled registrations
- Registration updates preserve original registration timestamp