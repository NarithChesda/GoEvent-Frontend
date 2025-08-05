# Event Guest Management API Documentation

## Overview

The Event Guest Management system allows event organizers and collaborators to manage their guest lists, track invitation status, and monitor who has viewed their personalized event showcase pages. This system integrates seamlessly with the event showcase API to provide personalized invitations.

## Key Features

- **Simple Guest Management**: Add guests with just their names
- **Invitation Tracking**: Track invitation status (not sent, sent, viewed)
- **Personalized Showcase Links**: Auto-generate personalized URLs for each guest
- **View Tracking**: Automatically track when guests view their personalized showcase
- **Permission-Based Access**: Only organizers and collaborators can manage guest lists
- **Statistics**: Get comprehensive statistics about your guest list

## Authentication & Permissions

- **Required Authentication**: All guest management endpoints require authentication
- **Permission Levels**:
  - **Organizer**: Full access to guest management
  - **Collaborators** (admin/editor/viewer): Full access to guest management
  - **Public Users**: No access to guest management (but can view showcase if guest name matches)

## Base URL Structure

All guest management endpoints follow the pattern:
```
/api/events/{event_id}/guests/
```

## API Endpoints

### 1. List Event Guests

Get all guests for a specific event with optional filtering and search.

```http
GET /api/events/{event_id}/guests/
```

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search guests by name | `?search=John` |
| `invitation_status` | string | Filter by invitation status | `?invitation_status=sent` |
| `ordering` | string | Order results | `?ordering=name` or `?ordering=-created_at` |

#### Response (200 OK)

```json
{
  "count": 25,
  "next": "http://api.example.com/api/events/123/guests/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "John Doe",
      "invitation_status": "viewed",
      "invitation_status_display": "Viewed",
      "showcase_link": "/api/events/123/showcase/?guest_name=John%20Doe&lang=en",
      "created_at": "2025-01-20T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "invitation_status": "sent",
      "invitation_status_display": "Sent",
      "showcase_link": "/api/events/123/showcase/?guest_name=Jane%20Smith&lang=en",
      "created_at": "2025-01-20T09:30:00Z"
    }
  ]
}
```

### 2. Add Guest to Event

Add a new guest to the event's guest list.

```http
POST /api/events/{event_id}/guests/
```

#### Request Body

```json
{
  "name": "John Doe"
}
```

#### Response (201 Created)

```json
{
  "id": 1,
  "name": "John Doe",
  "invitation_status": "not_sent",
  "invitation_status_display": "Not Sent",
  "showcase_link": "/api/events/123/showcase/?guest_name=John%20Doe&lang=en",
  "added_by": 5,
  "added_by_details": {
    "id": 5,
    "username": "organizer",
    "email": "organizer@example.com",
    "profile": {
      "full_name": "Event Organizer",
      "profile_picture": "https://example.com/media/profiles/organizer.jpg"
    }
  },
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

### 3. Get Guest Details

Retrieve detailed information about a specific guest.

```http
GET /api/events/{event_id}/guests/{guest_id}/
```

#### Response (200 OK)

```json
{
  "id": 1,
  "name": "John Doe",
  "invitation_status": "viewed",
  "invitation_status_display": "Viewed",
  "showcase_link": "/api/events/123/showcase/?guest_name=John%20Doe&lang=en",
  "added_by": 5,
  "added_by_details": {
    "id": 5,
    "username": "organizer",
    "email": "organizer@example.com",
    "profile": {
      "full_name": "Event Organizer",
      "profile_picture": "https://example.com/media/profiles/organizer.jpg"
    }
  },
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:15:00Z"
}
```

### 4. Update Guest

Update guest information (currently only name can be updated).

```http
PATCH /api/events/{event_id}/guests/{guest_id}/
```

#### Request Body

```json
{
  "name": "John David Doe"
}
```

#### Response (200 OK)

```json
{
  "id": 1,
  "name": "John David Doe",
  "invitation_status": "viewed",
  "invitation_status_display": "Viewed",
  "showcase_link": "/api/events/123/showcase/?guest_name=John%20David%20Doe&lang=en",
  "added_by": 5,
  "added_by_details": {
    "id": 5,
    "username": "organizer",
    "email": "organizer@example.com",
    "profile": {
      "full_name": "Event Organizer"
    }
  },
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:30:00Z"
}
```

### 5. Delete Guest

Remove a guest from the event's guest list.

```http
DELETE /api/events/{event_id}/guests/{guest_id}/
```

#### Response (204 No Content)

No response body.

### 6. Mark Invitation as Sent

Mark a guest's invitation as sent.

```http
PATCH /api/events/{event_id}/guests/{guest_id}/mark-sent/
```

#### Response (200 OK)

```json
{
  "id": 1,
  "name": "John Doe",
  "invitation_status": "sent",
  "invitation_status_display": "Sent",
  "showcase_link": "/api/events/123/showcase/?guest_name=John%20Doe&lang=en",
  "added_by": 5,
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:45:00Z"
}
```

### 7. Mark Invitation as Viewed

Mark a guest's showcase page as viewed (usually done automatically when guest visits showcase).

```http
PATCH /api/events/{event_id}/guests/{guest_id}/mark-viewed/
```

#### Response (200 OK)

```json
{
  "id": 1,
  "name": "John Doe",
  "invitation_status": "viewed",
  "invitation_status_display": "Viewed",
  "showcase_link": "/api/events/123/showcase/?guest_name=John%20Doe&lang=en",
  "added_by": 5,
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T11:00:00Z"
}
```

### 8. Get Guest List Statistics

Get comprehensive statistics about the event's guest list.

```http
GET /api/events/{event_id}/guests/stats/
```

#### Response (200 OK)

```json
{
  "total_guests": 50,
  "not_sent": 15,
  "sent": 25,
  "viewed": 10
}
```

## Invitation Status Values

| Status | Description |
|--------|-------------|
| `not_sent` | Invitation has not been sent to the guest |
| `sent` | Invitation has been sent to the guest |
| `viewed` | Guest has viewed their personalized showcase page |

## Integration with Showcase API

The guest management system integrates seamlessly with the [Event Showcase API](./event-showcase.md):

1. **Personalized Links**: Each guest gets a personalized showcase URL
2. **Automatic Tracking**: When a guest visits their showcase URL, the system automatically marks them as "viewed"
3. **Guest Name Validation**: The showcase API validates guest names against the guest list for tracking

### Example Integration Flow

1. **Add Guest**: `POST /api/events/123/guests/` with `{"name": "John Doe"}`
2. **Send Invitation**: Share the auto-generated `showcase_link` with the guest
3. **Mark as Sent**: `PATCH /api/events/123/guests/1/mark-sent/`
4. **Guest Views**: When guest visits `/api/events/123/showcase/?guest_name=John%20Doe`, status automatically updates to "viewed"
5. **Track Progress**: Use `/api/events/123/guests/stats/` to monitor invitation progress

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
  "detail": "You do not have permission to manage guests for this event."
}
```

### 400 Bad Request
```json
{
  "name": ["This field is required."]
}
```

### 400 Bad Request (Duplicate Guest)
```json
{
  "non_field_errors": ["Guest with this name already exists for this event."]
}
```

## Frontend Integration Examples

### JavaScript/React Integration

```javascript
// Guest management service
class GuestService {
  constructor(apiBaseUrl, authToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
  }

  // Get all guests for an event
  async getGuests(eventId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${this.apiBaseUrl}/events/${eventId}/guests/?${queryString}`,
      {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  // Add a new guest
  async addGuest(eventId, guestName) {
    const response = await fetch(
      `${this.apiBaseUrl}/events/${eventId}/guests/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: guestName }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  // Mark invitation as sent
  async markInvitationSent(eventId, guestId) {
    const response = await fetch(
      `${this.apiBaseUrl}/events/${eventId}/guests/${guestId}/mark-sent/`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  // Get guest statistics
  async getGuestStats(eventId) {
    const response = await fetch(
      `${this.apiBaseUrl}/events/${eventId}/guests/stats/`,
      {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
}

// Usage example
const guestService = new GuestService('https://api.example.com/api', 'your-jwt-token');

// Load guest list
async function loadGuestList(eventId) {
  try {
    const guests = await guestService.getGuests(eventId, {
      ordering: 'name',
      search: 'John'
    });
    console.log('Guests:', guests.results);
  } catch (error) {
    console.error('Error loading guests:', error);
  }
}

// Add guest and mark as sent
async function addAndInviteGuest(eventId, guestName) {
  try {
    const newGuest = await guestService.addGuest(eventId, guestName);
    console.log('Guest added:', newGuest);
    
    // Mark as sent
    const updatedGuest = await guestService.markInvitationSent(eventId, newGuest.id);
    console.log('Invitation marked as sent:', updatedGuest);
    
    // Share the showcase link
    const showcaseUrl = `${window.location.origin}${newGuest.showcase_link}`;
    console.log('Share this URL with the guest:', showcaseUrl);
    
  } catch (error) {
    console.error('Error managing guest:', error);
  }
}
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const GuestManagement = ({ eventId, guestService }) => {
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({});
  const [newGuestName, setNewGuestName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [guestsData, statsData] = await Promise.all([
        guestService.getGuests(eventId, { search: searchTerm }),
        guestService.getGuestStats(eventId)
      ]);
      setGuests(guestsData.results);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;

    try {
      const newGuest = await guestService.addGuest(eventId, newGuestName.trim());
      setGuests([...guests, newGuest]);
      setNewGuestName('');
      loadData(); // Refresh stats
    } catch (error) {
      console.error('Error adding guest:', error);
    }
  };

  const handleMarkSent = async (guestId) => {
    try {
      const updatedGuest = await guestService.markInvitationSent(eventId, guestId);
      setGuests(guests.map(g => g.id === guestId ? updatedGuest : g));
      loadData(); // Refresh stats
    } catch (error) {
      console.error('Error marking as sent:', error);
    }
  };

  const copyShowcaseLink = (showcaseLink) => {
    const fullUrl = `${window.location.origin}${showcaseLink}`;
    navigator.clipboard.writeText(fullUrl);
    alert('Showcase link copied to clipboard!');
  };

  return (
    <div className="guest-management">
      <h2>Guest Management</h2>
      
      {/* Statistics */}
      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Guests</h3>
          <p>{stats.total_guests || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Not Sent</h3>
          <p>{stats.not_sent || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Sent</h3>
          <p>{stats.sent || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Viewed</h3>
          <p>{stats.viewed || 0}</p>
        </div>
      </div>

      {/* Add Guest Form */}
      <form onSubmit={handleAddGuest} className="add-guest-form">
        <input
          type="text"
          placeholder="Guest name"
          value={newGuestName}
          onChange={(e) => setNewGuestName(e.target.value)}
        />
        <button type="submit" disabled={!newGuestName.trim()}>
          Add Guest
        </button>
      </form>

      {/* Search */}
      <input
        type="text"
        placeholder="Search guests..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      {/* Guest List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="guest-list">
          {guests.map(guest => (
            <div key={guest.id} className="guest-item">
              <div className="guest-info">
                <h4>{guest.name}</h4>
                <span className={`status ${guest.invitation_status}`}>
                  {guest.invitation_status_display}
                </span>
              </div>
              <div className="guest-actions">
                {guest.invitation_status === 'not_sent' && (
                  <button onClick={() => handleMarkSent(guest.id)}>
                    Mark as Sent
                  </button>
                )}
                <button onClick={() => copyShowcaseLink(guest.showcase_link)}>
                  Copy Showcase Link
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuestManagement;
```

## Best Practices

### 1. Guest Name Management
- Use proper case formatting for guest names
- Validate guest names on the frontend before submission
- Handle duplicate names gracefully

### 2. Invitation Tracking
- Mark invitations as "sent" only after successfully sending
- Provide clear visual indicators for invitation status
- Use the statistics endpoint to track overall progress

### 3. Showcase Integration
- Always use the auto-generated `showcase_link` for consistency
- Consider adding language parameter to showcase links: `?lang=en&guest_name=John`
- Monitor guest engagement through the "viewed" status

### 4. Error Handling
- Implement proper error handling for network requests
- Provide user-friendly error messages
- Handle authentication errors gracefully

### 5. Performance
- Use pagination for large guest lists
- Implement search/filtering to help users find specific guests
- Consider caching guest statistics for better performance

## Rate Limiting

- **Authenticated endpoints**: 1000 requests per minute per user
- **Bulk operations**: Consider rate limiting when adding many guests

## Security Considerations

1. **Permission Validation**: All endpoints validate user permissions
2. **Guest Name Sanitization**: Guest names are sanitized to prevent XSS
3. **Event Access Control**: Users can only access guests for events they organize or collaborate on
4. **Input Validation**: All inputs are validated on both client and server side

## Changelog

### Version 1.0.0 (2025-01-20)
- Initial release of Guest Management API
- Basic CRUD operations for guests
- Invitation status tracking
- Integration with showcase API
- Statistics endpoint
- Search and filtering capabilities