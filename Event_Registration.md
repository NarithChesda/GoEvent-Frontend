# Event Registration API Documentation

## Overview

The GoEvent platform provides a comprehensive RSVP/Registration system that allows **public users** to register for **any event** regardless of privacy settings (public or private). The `registration_required` field in the Event model is intended for future ticket sales functionality - when `false`, it enables normal RSVP functionality.

## Key Findings

### Current Implementation Status
- ✅ **Public Access**: Users can register for both public and private events
- ✅ **RSVP System**: Complete registration management with guest count support
- ⚠️ **registration_required Field**: Currently not enforced in business logic - only appears in API responses
- ✅ **Guest Support**: Users can bring up to 10 additional guests per registration

## Event Registration Model Structure

```python
class EventRegistration(models.Model):
    # Core fields
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_registrations')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='registered')
    
    # Registration details
    registered_at = models.DateTimeField(auto_now_add=True)
    confirmation_code = models.CharField(max_length=50, unique=True, blank=True)
    guest_count = models.PositiveIntegerField(null=True, blank=True, max=10)
    
    # Check-in functionality
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Additional info
    notes = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
```

### Status Choices
- `registered` - Initial registration status
- `confirmed` - Confirmed attendance (organizer action)
- `checked_in` - Physically checked into event
- `cancelled` - Registration cancelled

## API Endpoints

### 1. User Registration/RSVP Endpoints

#### POST `/api/events/{event_id}/rsvp/`
**Primary registration endpoint for users**
- **Authentication**: Required
- **Permissions**: Any authenticated user
- **Privacy**: Works for both public AND private events
- **Purpose**: Register or update registration for event

**Request Body:**
```json
{
    "guest_count": 3,          // Optional: 0-10 additional guests
    "notes": "Dietary restrictions"  // Optional: user notes
}
```

**Response (201 Created / 200 OK):**
```json
{
    "message": "RSVP successful",
    "registration": {
        "id": 1,
        "event": "uuid-here",
        "user": 123,
        "status": "registered",
        "guest_count": 3,
        "notes": "Dietary restrictions",
        "confirmation_code": "ABC123DEF456",
        "registered_at": "2023-12-01T10:00:00Z",
        "total_attendees": 4  // 1 user + 3 guests
    }
}
```

**Business Logic:**
- Checks registration deadline (if set)
- Validates event capacity against max_attendees
- Creates new registration or updates existing one
- Cannot modify after check-in
- Auto-generates unique confirmation code

#### POST `/api/events/{event_id}/register/`
**Alias for RSVP endpoint (backward compatibility)**
- Same functionality as `/rsvp/` endpoint

#### POST `/api/events/{event_id}/unregister/`
**Cancel registration**
- **Authentication**: Required
- **Permissions**: User can only cancel their own registration
- **Action**: Sets status to 'cancelled' and cancelled_at timestamp

#### GET `/api/events/{event_id}/my-registration/`
**Get current user's registration status**
- **Authentication**: Required
- Returns 404 if user not registered

### 2. Event Management Endpoints

#### GET `/api/events/{event_id}/registrations/`
**List all event registrations (Organizer/Admin only)**
- **Authentication**: Required
- **Permissions**: Event organizer or admin/editor collaborators only
- **Returns**: Array of all registrations for the event

#### POST `/api/events/{event_id}/registrations/`
**Direct registration creation (Admin use)**
- **Authentication**: Required
- **Permissions**: IsEventRelated permission class
- **Purpose**: Allow organizers/admins to register users directly

### 3. Check-in System

#### POST `/api/events/{event_id}/checkin/`
**Check in registered users (Organizer/Staff)**
- **Purpose**: Mark attendees as checked-in
- **Permissions**: Event organizers and admin collaborators

#### POST `/api/events/{event_id}/self-checkin/`
**Self check-in for registered users**
- **Purpose**: Allow users to check themselves in
- **Validation**: Must be within check-in timing window

### 4. Nested Registration Management

#### GET/POST `/api/events/{event_id}/registrations/`
#### GET/PUT/PATCH/DELETE `/api/events/{event_id}/registrations/{registration_id}/`
**Full CRUD operations on registrations**
- **Permissions**: Uses IsEventRelated permission class
- **Organizers/Admins**: Full access to all registrations
- **Regular users**: Only access to their own registrations

## Permission Analysis

### Current Permission Behavior

1. **RSVP Access**: ✅ Any authenticated user can register for any event (public or private)
2. **Registration Viewing**: 
   - Organizers/Admin collaborators: See all registrations
   - Regular users: Only see their own registration
3. **Event Privacy**: Does NOT affect registration permissions
4. **registration_required Field**: Currently decorative - no business logic enforcement

### Permission Classes Used

- **RSVP endpoints**: No explicit permission class (uses default authentication)
- **Registration management**: `IsEventRelated` permission class
- **Admin endpoints**: Event organizer or admin/editor collaborator check

## Registration Required Field Analysis

### Current State
The `registration_required` boolean field on Event model:
- ✅ **Exists in model**: `models.BooleanField(default=False)`
- ✅ **Included in serializers**: All Event serializers include this field
- ✅ **Exposed in API**: Field appears in event detail responses
- ❌ **No business logic**: No code enforces this field's value

### Intended Purpose (Per Requirements)
- `registration_required = true`: For events selling tickets (future feature)
- `registration_required = false`: Normal RSVP system (current implementation)

### Recommendation
The field is correctly implemented for its intended future use. Current RSVP system works as expected for events with `registration_required = false`.

## Registration Flow

### For Public Events
1. User discovers event (any user)
2. User calls `/api/events/{id}/rsvp/` with optional guest count
3. System creates/updates registration
4. User receives confirmation code
5. User can check-in at event time

### For Private Events  
1. User discovers event through direct link/invitation
2. **Same flow as public events** - no additional restrictions
3. Privacy setting doesn't affect registration permissions

## Capacity Management

The system handles event capacity through:
- `max_attendees` field on Event model
- Registration validation counts total attendees (users + guests)
- Prevents over-registration when capacity limit set
- Calculation: `current_registrations + new_user + new_guests ≤ max_attendees`

## Guest Count Support

- Each registration can include 0-10 additional guests
- Total attendees = 1 (registered user) + guest_count
- Guest count validation via `validate_guest_count` validator
- Capacity calculations include all guests

## Error Handling

Common error scenarios:
- Registration deadline passed: `400 Bad Request`
- Event capacity exceeded: `400 Bad Request` with available spots
- Trying to modify checked-in registration: `400 Bad Request`
- User not registered (for unregister/my-registration): `404 Not Found`

## Conclusion

The Event Registration system is **fully functional** and allows public users to register for any event regardless of privacy settings. The `registration_required` field exists for future ticket sales functionality but doesn't currently restrict normal RSVP operations when set to `false`.

**Key Points:**
- ✅ Public users can register for both public and private events
- ✅ RSVP system works as normal event registration when `registration_required = false`  
- ✅ Comprehensive guest count support (up to 10 guests per registration)
- ✅ Complete registration lifecycle (register → confirm → check-in → cancel)
- ✅ Proper capacity management and deadline validation