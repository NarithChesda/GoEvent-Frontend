# Events App Documentation

The `events` app is the core module of the GoEvent platform, providing comprehensive event management with collaboration features, multi-language support, and rich media capabilities.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Models](#models)
4. [API Endpoints](#api-endpoints)
5. [Authentication & Permissions](#authentication--permissions)
6. [Usage Examples](#usage-examples)
7. [Testing](#testing)
8. [Common Workflows](#common-workflows)

## Overview

The events app provides:
- **Event CRUD Operations**: Create, read, update, delete events
- **Event Discovery**: Public events list, search, and filtering
- **User Event Management**: Separate views for organized, collaborated, and registered events
- **Collaboration System**: Invite collaborators with different permission levels
- **Multi-language Support**: Content in multiple languages with translations
- **Rich Media**: Photos, videos, banners with automatic optimization
- **Registration System**: User registration with guest count support
- **Privacy Controls**: Public/Private events with granular access control
- **Template System**: Pre-designed event templates with customization

## Architecture

### Database Schema

```
Event (UUID Primary Key)
├── EventCollaborator (M2M through table)
├── EventHost (1:M)
│   └── EventHostTranslation (1:M)
├── EventAgenda (1:M)
│   └── EventAgendaTranslation (1:M)
├── EventText (1:M) - Multi-language content blocks
├── EventPhoto (1:M) - Ordered photo gallery
├── EventRegistration (1:M) - Attendee registrations
├── EventRebate (1:1) - Commission tracking
└── EventLanguage (1:M) - Available languages for event
```

### Key Features

- **UUID-based Events**: Secure, non-sequential event identifiers
- **Automatic Slug Generation**: SEO-friendly URLs from event titles
- **Image Optimization**: Automatic resizing for banners and photos
- **Timezone Support**: Events can specify their local timezone
- **Status Workflow**: Draft → Published → Completed/Cancelled
- **Real-time Calculations**: `is_upcoming`, `is_ongoing`, `is_past` properties

## Models

### Event Model

The main event model with comprehensive fields:

```python
class Event(models.Model):
    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic Information
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True)
    description = models.TextField()
    short_description = models.CharField(max_length=300, blank=True)
    
    # Event Timing
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Location
    location = models.TextField(blank=True)
    virtual_link = models.URLField(blank=True)
    is_virtual = models.BooleanField(default=False)
    
    # Privacy and Status
    privacy = models.CharField(max_length=10, choices=PRIVACY_CHOICES, default='public')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    
    # Relationships
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organized_events')
    category = models.ForeignKey(EventCategory, on_delete=models.SET_NULL, null=True, blank=True)
    referrer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='referred_events')
    
    # Registration Settings
    max_attendees = models.PositiveIntegerField(null=True, blank=True)
    registration_required = models.BooleanField(default=False)
    registration_deadline = models.DateTimeField(null=True, blank=True)
    
    # Media Fields
    banner_image = models.ImageField(upload_to='event_banners/', null=True, blank=True)
    logo_one = models.ImageField(upload_to='event_logos/', null=True, blank=True)
    logo_two = models.ImageField(upload_to='event_logos/', null=True, blank=True)
    event_video = models.FileField(upload_to='event_videos/', null=True, blank=True)
    google_map_embed_link = models.URLField(blank=True, null=True)
    youtube_embed_link = models.URLField(blank=True, null=True)
    
    # Template System
    event_template = models.ForeignKey(EventTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    event_template_enabled = models.BooleanField(default=False)
```

### EventCollaborator Model

Manages collaboration permissions:

```python
class EventCollaborator(models.Model):
    ROLE_CHOICES = [
        ('editor', 'Editor'),     # Can edit event content
        ('viewer', 'Viewer'),     # Read-only access
        ('admin', 'Admin'),       # Can edit + invite collaborators
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='editor')
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invited_collaborators')
    invited_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    is_accepted = models.BooleanField(default=True)
```

### EventRegistration Model

Tracks event attendees:

```python
class EventRegistration(models.Model):
    STATUS_CHOICES = [
        ('registered', 'Registered'),
        ('confirmed', 'Confirmed'),
        ('attended', 'Attended'),
        ('cancelled', 'Cancelled'),
    ]
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_registrations')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='registered')
    guest_count = models.PositiveIntegerField(null=True, blank=True, validators=[MaxValueValidator(20)])
    confirmation_code = models.CharField(max_length=50, unique=True, blank=True)
    notes = models.TextField(blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    attended_at = models.DateTimeField(null=True, blank=True)
    
    @property
    def total_attendees(self):
        """Total number including the user and guests"""
        return 1 + (self.guest_count or 0)
```

## API Endpoints

### Base URL
```
http://localhost:8000/api/events/
```

### Authentication
All write operations require JWT authentication:
```bash
curl -H "Authorization: Bearer <access_token>"
```

### 1. Event Discovery

#### List Public Events (No Auth Required)
```bash
GET /api/events/
```

Query Parameters:
- `category` - Filter by category name
- `organizer` - Filter by organizer username
- `start_date_after` - Events starting after date
- `start_date_before` - Events starting before date
- `is_virtual` - Boolean filter for virtual events
- `status` - Filter by status (draft, published, cancelled, completed)
- `privacy` - Filter by privacy (public, private)
- `search` - Search in title, description, location
- `ordering` - Sort by start_date, created_at, title

Example:
```bash
curl -X GET "http://localhost:8000/api/events/?category=Technology&is_virtual=true&ordering=-start_date"
```

Response:
```json
{
    "count": 4,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": "f39cbc3c-7e56-4643-bef6-7fac7d9cf73f",
            "title": "Tech Conference 2025",
            "slug": "tech-conference-2025",
            "short_description": "Annual technology conference",
            "start_date": "2025-08-19T08:34:35.145372Z",
            "end_date": "2025-08-20T08:34:35.145372Z",
            "location": "Convention Center",
            "is_virtual": false,
            "privacy": "public",
            "status": "published",
            "banner_image": null,
            "organizer": 1,
            "organizer_name": "admin",
            "category": 1,
            "category_name": "Technology",
            "category_color": "#3498db",
            "registration_required": true,
            "max_attendees": 100,
            "collaborators_count": 2,
            "registrations_count": 45,
            "created_at": "2025-07-22T08:34:35.145943Z",
            "is_upcoming": true,
            "is_ongoing": false,
            "is_past": false
        }
    ]
}
```

### 2. User's Events

#### My Events (Organized & Collaborated)
```bash
GET /api/events/my/
Authorization: Bearer <token>
```

Response:
```json
{
    "organized": [
        {
            "id": "event-uuid-1",
            "title": "My Conference",
            "privacy": "private",
            "status": "published",
            // ... other event fields
        }
    ],
    "collaborated": [
        {
            "id": "event-uuid-2",
            "title": "Team Workshop",
            "privacy": "private",
            "status": "draft",
            // ... other event fields
        }
    ]
}
```

#### My Registered Events
```bash
GET /api/events/my-registered/
Authorization: Bearer <token>
```

Response:
```json
[
    {
        "id": "event-uuid-3",
        "title": "Industry Summit",
        "start_date": "2025-09-15T09:00:00Z",
        "registration_required": true,
        // ... other event fields
    }
]
```

### 3. Event CRUD Operations

#### Create Event
```bash
POST /api/events/
Authorization: Bearer <token>
Content-Type: application/json

{
    "title": "New Tech Meetup",
    "description": "Monthly technology meetup for developers",
    "short_description": "Tech meetup for devs",
    "start_date": "2025-08-01T18:00:00Z",
    "end_date": "2025-08-01T21:00:00Z",
    "timezone": "America/New_York",
    "location": "Tech Hub, 123 Main St, NYC",
    "is_virtual": false,
    "privacy": "public",
    "status": "draft",
    "category": 1,
    "registration_required": true,
    "max_attendees": 50
}
```

Response (201 Created):
```json
{
    "title": "New Tech Meetup",
    "description": "Monthly technology meetup for developers",
    "short_description": "Tech meetup for devs",
    "start_date": "2025-08-01T18:00:00Z",
    "end_date": "2025-08-01T21:00:00Z",
    "timezone": "America/New_York",
    "location": "Tech Hub, 123 Main St, NYC",
    "virtual_link": "",
    "is_virtual": false,
    "privacy": "public",
    "status": "draft",
    "banner_image": null,
    "logo_one": null,
    "logo_two": null,
    "event_video": null,
    "google_map_embed_link": null,
    "youtube_embed_link": null,
    "category": 1,
    "max_attendees": 50,
    "registration_required": true,
    "registration_deadline": null,
    "event_template": null,
    "event_template_enabled": false
}
```

#### Get Event Details
```bash
GET /api/events/{event_id}/
Authorization: Bearer <token> (required for private events)
```

Response:
```json
{
    "id": "2345939d-ebe0-41f2-be1a-60fba67601b5",
    "title": "Annual Tech Summit",
    "slug": "annual-tech-summit",
    "description": "Full day technology summit with industry leaders",
    "short_description": "Tech summit with leaders",
    "start_date": "2025-07-22T08:34:35Z",
    "end_date": "2025-07-23T08:34:35Z",
    "timezone": "UTC",
    "location": "Convention Center, Main Hall",
    "virtual_link": "",
    "is_virtual": false,
    "privacy": "public",
    "status": "published",
    "banner_image": "http://localhost:8000/media/event_banners/summit.jpg",
    "organizer": 1,
    "organizer_details": {
        "id": 1,
        "email": "admin@goevent.com",
        "username": "admin",
        "first_name": "John",
        "last_name": "Doe",
        "profile_picture": "http://localhost:8000/media/profile_pictures/admin.jpg"
    },
    "category": 1,
    "category_details": {
        "id": 1,
        "name": "Technology",
        "description": "Tech conferences, workshops, and meetups",
        "color": "#3498db",
        "icon": "fas fa-laptop-code"
    },
    "hosts": [
        {
            "id": 1,
            "name": "Dr. Jane Smith",
            "title": "Keynote Speaker",
            "bio": "Industry expert in AI",
            "profile_image": null,
            "email": "jane@example.com",
            "order": 0,
            "translations": []
        }
    ],
    "agenda_items": [
        {
            "id": 1,
            "title": "Opening Keynote",
            "description": "Welcome and introduction",
            "agenda_type": "keynote",
            "date": null,
            "start_time_text": "09:00 AM",
            "end_time_text": "10:00 AM",
            "speaker": "Dr. Jane Smith",
            "location": "Main Hall",
            "order": 0,
            "is_featured": true,
            "color": "#3498db",
            "translations": []
        }
    ],
    "photos": [],
    "collaborators_details": [],
    "registrations_details": [
        {
            "id": 1,
            "user": 3,
            "user_details": {
                "id": 3,
                "username": "attendee1",
                "email": "attendee1@example.com"
            },
            "status": "registered",
            "guest_count": 2,
            "total_attendees": 3,
            "confirmation_code": "TECH-2025-ABC123"
        }
    ],
    "max_attendees": 100,
    "registration_required": true,
    "registration_deadline": null,
    "created_at": "2025-07-22T08:34:35.047306Z",
    "updated_at": "2025-07-27T11:13:40.784657Z",
    "is_upcoming": false,
    "is_ongoing": false,
    "is_past": true,
    "collaborators_count": 0,
    "registrations_count": 1,
    "can_edit": true,
    "event_template": null,
    "event_template_enabled": false
}
```

#### Update Event
```bash
PATCH /api/events/{event_id}/
Authorization: Bearer <token>
Content-Type: application/json

{
    "title": "Updated Tech Meetup",
    "status": "published",
    "max_attendees": 75
}
```

Response (200 OK): Returns updated event data

#### Delete Event
```bash
DELETE /api/events/{event_id}/
Authorization: Bearer <token>
```

Response: 204 No Content

### 4. Event Registration

#### Register for Event
```bash
POST /api/events/{event_id}/register/
Authorization: Bearer <token>
Content-Type: application/json

{
    "guest_count": 2,
    "notes": "Bringing 2 colleagues from my team"
}
```

Response (201 Created):
```json
{
    "id": 5,
    "user": 3,
    "user_details": {
        "id": 3,
        "username": "john_doe",
        "email": "john@example.com"
    },
    "status": "registered",
    "guest_count": 2,
    "total_attendees": 3,
    "confirmation_code": "EVT-ABC12345",
    "notes": "Bringing 2 colleagues from my team",
    "registered_at": "2025-07-27T10:30:00Z"
}
```

#### View Event Registrations (Organizer/Admin Only)
```bash
GET /api/events/{event_id}/registrations/
Authorization: Bearer <token>
```

### 5. Event Collaboration

#### Invite Collaborator
```bash
POST /api/events/{event_id}/invite-collaborator/
Authorization: Bearer <token>
Content-Type: application/json

{
    "user_email": "colleague@example.com",
    "role": "editor",
    "message": "Please help me manage this event"
}
```

#### List Collaborators
```bash
GET /api/events/{event_id}/collaborators/
Authorization: Bearer <token>
```

#### View Collaboration Invites
```bash
GET /api/events/collaboration-invites/
Authorization: Bearer <token>
```

#### Accept Collaboration Invite
```bash
POST /api/events/collaborations/{collaboration_id}/accept/
Authorization: Bearer <token>
```

### 6. Event Media

#### Upload Event Photo
```bash
POST /api/events/{event_id}/photos/
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <file>
caption: "Opening ceremony"
order: 1
is_featured: true
```

#### List Event Photos
```bash
GET /api/events/{event_id}/photos/
```

#### Reorder Photo
```bash
PATCH /api/events/{event_id}/photos/{photo_id}/reorder/
Authorization: Bearer <token>
Content-Type: application/json

{
    "order": 3
}
```

### 7. Event Components

#### Manage Hosts
```bash
# List hosts
GET /api/events/{event_id}/hosts/

# Add host
POST /api/events/{event_id}/hosts/
{
    "name": "Speaker Name",
    "title": "CEO",
    "bio": "Speaker biography",
    "email": "speaker@example.com"
}

# Update host
PATCH /api/events/{event_id}/hosts/{host_id}/

# Delete host
DELETE /api/events/{event_id}/hosts/{host_id}/
```

#### Manage Agenda
```bash
# List agenda items
GET /api/events/{event_id}/agenda/

# Add agenda item
POST /api/events/{event_id}/agenda/
{
    "title": "Lunch Break",
    "description": "Networking lunch",
    "agenda_type": "break",
    "start_time_text": "12:00 PM",
    "end_time_text": "1:00 PM",
    "order": 3
}
```

#### Manage Event Text Content
```bash
# List text content
GET /api/events/{event_id}/texts/

# Add text content
POST /api/events/{event_id}/texts/
{
    "text_type": "welcome_message",
    "language": "en",
    "title": "Welcome",
    "content": "Welcome to our annual conference!",
    "order": 1
}
```

## Authentication & Permissions

### Authentication Flow

1. **Login to get JWT token:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

Response:
```json
{
    "message": "Login successful",
    "user": { /* user details */ },
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

2. **Use access token in requests:**
```bash
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### Permission Matrix

| Operation | Public Events | Private Events | Requirements |
|-----------|---------------|----------------|--------------|
| **List Events** | ✅ Anyone | 🔐 Authenticated users see their own | None / JWT Token |
| **View Event** | ✅ Anyone | 👥 Organizer, Collaborators, Registered | JWT Token for private |
| **Create Event** | 🔐 Authenticated | 🔐 Authenticated | JWT Token |
| **Edit Event** | 👑 Organizer + 📝 Collaborators (admin/editor) | Same | JWT Token + Permission |
| **Delete Event** | 👑 Organizer Only | 👑 Organizer Only | JWT Token + Owner |
| **Register** | 🔐 Authenticated | 🔐 Authenticated + Access | JWT Token |
| **View Registrations** | 👑 Organizer + 📝 Collaborators | Same | JWT Token + Permission |

### Collaborator Roles

- **Admin**: Can edit event + invite collaborators
- **Editor**: Can edit event content only
- **Viewer**: Read-only access to private events

## Usage Examples

### Example 1: Create and Publish an Event

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "organizer@example.com", "password": "pass123"}' \
  | jq -r '.access')

# 2. Create event
EVENT_ID=$(curl -s -X POST http://localhost:8000/api/events/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Workshop",
    "description": "Learn Python basics",
    "short_description": "Python for beginners",
    "start_date": "2025-09-01T10:00:00Z",
    "end_date": "2025-09-01T17:00:00Z",
    "location": "Tech Center, Room 101",
    "privacy": "public",
    "status": "draft",
    "category": 1,
    "registration_required": true,
    "max_attendees": 30
  }' | jq -r '.id')

# 3. Add agenda
curl -X POST http://localhost:8000/api/events/$EVENT_ID/agenda/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Python",
    "start_time_text": "10:00 AM",
    "end_time_text": "12:00 PM"
  }'

# 4. Publish event
curl -X PATCH http://localhost:8000/api/events/$EVENT_ID/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "published"}'
```

### Example 2: Register for an Event

```bash
# Register with 2 guests
curl -X POST http://localhost:8000/api/events/$EVENT_ID/register/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "guest_count": 2,
    "notes": "Vegetarian meal preference"
  }'
```

### Example 3: Search and Filter Events

```bash
# Find virtual technology events in August
curl -X GET "http://localhost:8000/api/events/?category=Technology&is_virtual=true&start_date_after=2025-08-01&start_date_before=2025-08-31&ordering=start_date"

# Search events by keyword
curl -X GET "http://localhost:8000/api/events/?search=python&status=published"
```

## Testing

### Running Tests
```bash
python manage.py test events
```

### Test Coverage Areas
- Event CRUD operations
- Permission checks for private events
- Registration limits and deadlines
- Collaborator invitation workflow
- Multi-language content
- Image upload and resizing
- Search and filtering

### Sample Test Case
```python
class EventAPITestCase(APITestCase):
    def test_create_event_requires_auth(self):
        """Test that creating an event requires authentication"""
        url = reverse('events:events-list')
        data = {'title': 'Test Event'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 401)
    
    def test_public_events_visible_without_auth(self):
        """Test that public events are visible without authentication"""
        Event.objects.create(
            title='Public Event',
            organizer=self.user,
            privacy='public',
            status='published',
            start_date=timezone.now(),
            end_date=timezone.now()
        )
        response = self.client.get(reverse('events:events-list'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
```

## Common Workflows

### For Event Organizers

1. **Create Event** → Add details → Upload banner
2. **Add Components** → Hosts, Agenda, Text content
3. **Configure Registration** → Set limits, deadline
4. **Invite Collaborators** → Share management responsibilities
5. **Publish Event** → Make visible to attendees
6. **Monitor Registrations** → Track attendee count
7. **Update as Needed** → Keep information current

### For Attendees

1. **Browse Events** → Filter by category, date, location
2. **View Details** → Check agenda, hosts, location
3. **Register** → Add guest count if needed
4. **Receive Confirmation** → Get unique registration code
5. **Access Private Events** → If registered or invited

### For Collaborators

1. **Receive Invitation** → Check collaboration invites
2. **Accept Invite** → Join event management team
3. **Edit Event** → Based on assigned role (admin/editor)
4. **View Registrations** → If permitted by role

## Error Handling

Common error responses:

```json
// 400 Bad Request - Validation Error
{
    "title": ["This field is required."],
    "start_date": ["Start date must be in the future."]
}

// 401 Unauthorized
{
    "detail": "Authentication credentials were not provided."
}

// 403 Forbidden
{
    "detail": "You do not have permission to perform this action."
}

// 404 Not Found
{
    "detail": "Not found."
}

// 409 Conflict - Registration Error
{
    "error": "Event is fully booked"
}
```

## Best Practices

1. **Always specify timezone** when creating events
2. **Set registration limits** to manage capacity
3. **Use meaningful slugs** for SEO-friendly URLs
4. **Upload optimized images** (system auto-resizes)
5. **Test with different user roles** to verify permissions
6. **Handle pagination** for large event lists
7. **Cache frequently accessed** public event data

## Future Enhancements

- Recurring events support
- Ticketing and payment integration
- Email notifications for registrations
- Advanced analytics dashboard
- Mobile app API endpoints
- Webhooks for third-party integrations