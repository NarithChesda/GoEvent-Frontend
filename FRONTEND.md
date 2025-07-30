# FRONTEND.md - GoEvent Platform Frontend Integration Guide

This guide provides a comprehensive overview for frontend developers integrating with the GoEvent Django REST API. It covers authentication, API endpoints, data models, and specific frontend integration examples.

## 1. Project Overview & Key Features

The GoEvent platform is a Django REST API project offering robust event management capabilities. Key features relevant to frontend integration include:

- **Custom User Model**: Extended Django's user model with profile picture and bio fields.
- **JWT Authentication**: Token-based authentication using `djangorestframework-simplejwt`.
- **Google OAuth**: Social login integration with Google.
- **Profile Management**: Users can update their profile pictures and bio.
- **Django REST Framework**: Full API implementation.
- **CORS Support**: Cross-origin resource sharing is enabled for frontend integration.
- **Full Event Lifecycle**: Events can transition through Draft → Published → Completed/Cancelled states.
- **Collaboration System**: Invite collaborators with different permission levels.
- **Multi-language Support**: Content in multiple languages with translations across various models (e.g., event hosts, agenda items, core data).
- **Rich Media**: Support for photos, videos, and banners with automatic optimization.
- **Registration System**: User registration with guest count support.
- **Privacy Controls**: Public/Private events with granular access control.
- **Template System**: Pre-designed event templates for layouts and designs.
- **UUID-based Events**: Secure, non-sequential event IDs.
- **Mobile-Optimized**: Responsive design with image optimization.
- **SEO-Friendly**: Slugs, meta descriptions, and structured data for events.

## 2. Authentication

All API endpoints, especially write operations, require authentication using a JSON Web Token (JWT).

### JWT Authentication Flow

**Register a new user:**

```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "securepassword123",
    "password_confirm": "securepassword123"
  }'
```

**Login to obtain tokens:**

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

Upon successful login, the API will return access and refresh tokens.

**Access protected endpoints:** Include the access token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Example:**

```bash
curl -X GET http://127.0.0.1:8000/api/auth/profile/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Refresh JWT token:** `POST /api/auth/token/refresh/`

**Verify JWT token:** `POST /api/auth/token/verify/`

### Google OAuth

Social login integration is available via Google OAuth:

- `POST /api/auth/google/login/` - Google OAuth login.

## 3. API Endpoints

The GoEvent platform uses clean, RESTful URL structures.

### 3.1. Authentication & Profile Endpoints (Base URL: `/api/auth/`)

- **User Registration:** POST `/api/auth/register/`
- **User Login:** POST `/api/auth/login/`
- **User Logout:** POST `/api/auth/logout/`
- **Get User Profile:** GET `/api/auth/profile/`
- **Update User Profile:** PUT `/api/auth/profile/`
- **Get Current User Profile:** GET `/api/auth/profile/me/`
- **Change Password:** POST `/api/auth/change-password/`

### 3.2. Core Data Endpoints (Base URL: `/api/core-data/`)

#### Event Templates

- List: GET `/api/core-data/event-templates/`
- Detail: GET `/api/core-data/event-templates/{id}/`

#### Event Categories

- List: GET `/api/core-data/event-categories/`
- Detail: GET `/api/core-data/event-categories/{id}/`

#### Custom Fonts

- List: GET `/api/core-data/custom-fonts/`
- Detail: GET `/api/core-data/custom-fonts/{id}/`

#### Pricing Plans

- List: GET `/api/core-data/pricing-plans/`
- Detail: GET `/api/core-data/pricing-plans/{id}/`

#### Custom Icons

- List: GET `/api/core-data/custom-icons/`
- Detail: GET `/api/core-data/custom-icons/{id}/`

#### Team Members

- List: GET `/api/core-data/team-members/`
- Detail: GET `/api/core-data/team-members/{id}/`

### 3.3. Events Endpoints (Base URL: `/api/events/`)

#### Event Management

- List: GET `/api/events/` (Query: category, organizer, start\_date\_after, start\_date\_before, is\_virtual, status, privacy, search, ordering)
- Detail: GET `/api/events/{id}/`
- Create: POST `/api/events/`
- Update: PUT/PATCH `/api/events/{id}/`
- Delete: DELETE `/api/events/{id}/`

#### Event Photos

- List/Upload: GET/POST `/api/events/{event_id}/photos/`
- Update: PATCH `/api/events/{event_id}/photos/{photo_id}/`
- Reorder: PATCH `/api/events/{event_id}/photos/{photo_id}/reorder/`

#### Event Registration

- Register: POST `/api/events/{event_id}/register/`
- List: GET `/api/events/{event_id}/registrations/`

#### Event Rebates

- List: GET `/api/events/rebates/`
- Create: POST `/api/events/rebates/`

#### Collaboration Management

- Invite: POST `/api/events/{event_id}/invite-collaborator/`
- List: GET `/api/events/{event_id}/collaborators/`
- Accept Invite: POST `/api/events/collaborations/{collaboration_id}/accept/`

#### User's Events

- My Events: GET `/api/events/my/`
- Invites: GET `/api/events/collaboration-invites/`

### 3.4. Feedback Endpoints (Base URL: `/api/feedback/`)

#### Reviews API

- List/Create: GET/POST `/api/feedback/reviews/` (Query: `event`)
- RUD: GET/PUT/PATCH/DELETE `/api/feedback/reviews/{id}/`

#### Comments API

- List/Create: GET/POST `/api/feedback/comments/` (Query: `event`)
- RUD: GET/PUT/PATCH/DELETE `/api/feedback/comments/{id}/`

## 4. Permission Matrix

| Operation            | Public Events                                  | Private Events                                 | Notes                                              |
| -------------------- | ---------------------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| List Events          | ✅ Anyone                                       | ✅ Anyone                                       | Shows user's own/collaborated events.              |
| View Event           | ✅ Anyone                                       | 👥 Organizer, Collaborators, Registered        | Full details available.                            |
| Create Event         | 🔐 Authenticated                               | 🔐 Authenticated                               | User becomes organizer.                            |
| Edit Event           | 👑 Organizer + 📝 Collaborators (admin/editor) | 👑 Organizer + 📝 Collaborators (admin/editor) | Cannot edit `event_template_enabled` unless admin. |
| Delete Event         | 👑 Organizer Only                              | 👑 Organizer Only                              | Collaborators cannot delete.                       |
| Manage Photos        | 👑 Organizer + 📝 Collaborators (admin/editor) | 👑 Organizer + 📝 Collaborators (admin/editor) | Upload, edit, reorder.                             |
| View Registrations   | 👑 Organizer + 📝 Collaborators (admin/editor) | 👑 Organizer + 📝 Collaborators (admin/editor) | Privacy protected.                                 |
| Invite Collaborators | 👑 Organizer + 👥 Admin Collaborators          | 👑 Organizer + 👥 Admin Collaborators          | Admin collaborators can invite.                    |
| Manage Rebates       | 🏧 Admin Only                                  | 🏧 Admin Only                                  | Users can view their own.                          |

**Collaborator Roles**

- **admin**: Full edit access, can invite collaborators, view registrations. Cannot delete events or change ownership.
- **editor**: Can edit event content, manage photos, agenda, and hosts, and view registrations. Cannot invite collaborators or delete events.
- **viewer**: Read-only access to private event details and full event information. Cannot edit content, invite collaborators, or view registrations.

## 5. Frontend Integration Examples

### Event Listing Page

#### Basic Event Card Component

```jsx
// EventCard.jsx
const EventCard = ({ event }) => {
  const getStatusBadge = () => {
    if (event.is_ongoing) return <Badge color="green">Live Now</Badge>;
    if (event.is_upcoming) return <Badge color="blue">Upcoming</Badge>;
    if (event.is_past) return <Badge color="gray">Past</Badge>;
    return null;
  };

  const getCategoryColor = () => ({
    backgroundColor: event.category_color || '#007ACC',
    borderColor: event.category_color || '#007ACC'
  });

  return (
    <div className="event-card">
      <div className="event-banner">
        {event.banner_image && (
          <img src={event.banner_image} alt={event.title} />
        )}
        {getStatusBadge()}
      </div>
      <div className="event-content">
        <div className="event-category" style={getCategoryColor()}>
          {event.category_name}
        </div>
        <h3 className="event-title">{event.title}</h3>
        <p className="event-description">{event.short_description}</p>
        <div className="event-meta">
          <div className="event-date">
            📅 {new Date(event.start_date).toLocaleDateString()}
          </div>
          <div className="event-location">
            {event.is_virtual ? '💻 Virtual' : `📍 ${event.location}`}
          </div>
        </div>
        <div className="event-stats">
          <span>👥 {event.collaborators_count} collaborators</span>
          <span>🌻 {event.registrations_count} registered</span>
          {event.max_attendees && (
            <span>📊 {event.registrations_count}/{event.max_attendees}</span>
          )}
        </div>
        <div className="event-organizer">
          By {event.organizer_name}
        </div>
      </div>
    </div>
  );
};
```

#### Event Listing with Filters

```jsx
// EventListing.jsx
const EventListing = () => {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    is_virtual: null,
    status: 'published',
    start_date_after: null
  });
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          params.append(key, value);
        }
      });
      const response = await fetch(`/api/events/?${params}`);
      const data = await response.json();
      setEvents(data.results);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  return (
    <div className="event-listing">
      {/* Filter UI elements would go here, updating the 'filters' state */}
      {loading ? (
        <div>Loading events...</div>
      ) : (
        <div className="event-cards-container">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
```

