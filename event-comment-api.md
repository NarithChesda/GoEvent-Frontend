# Event Comment API Documentation

This document provides comprehensive information about the Event Comment API endpoints in the GoEvent platform.

## Overview

The Event Comment API allows authenticated users to comment on events. Each user can submit only one comment per event due to the unique constraint. Comments support full CRUD operations with proper permission controls.

## Base URL

```
/api/feedback/comments/
```

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Getting a JWT Token

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "password": "your-password"}'
```

## Comment Model

### Fields

- `id` (integer): Unique comment identifier
- `event` (string): UUID of the event being commented on
- `user` (integer): ID of the user who created the comment
- `comment_text` (string): The comment content
- `created_at` (datetime): Timestamp when the comment was created

### Constraints

- **Unique Constraint**: One comment per user per event (`unique_together = ['event', 'user']`)
- **Required Fields**: `event`, `user`, `comment_text`

## API Endpoints

### 1. List All Comments

**Endpoint:** `GET /api/feedback/comments/`

**Description:** Retrieves a paginated list of all comments ordered by creation date (newest first).

**Query Parameters:**
- `event` (optional): Filter comments by event UUID
- `page` (optional): Page number for pagination
- `page_size` (optional): Number of results per page (default: 20)

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/feedback/comments/
```

**Example Response:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "comment_text": "This looks like an amazing event! Really excited to attend.",
      "created_at": "2025-08-08T17:06:13.549520Z",
      "event": "a8f10b86-6325-42be-afff-e9a353d9aa36",
      "user": 1
    }
  ]
}
```

### 2. Filter Comments by Event

**Endpoint:** `GET /api/feedback/comments/?event=<event_uuid>`

**Description:** Retrieves all comments for a specific event.

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/feedback/comments/?event=a8f10b86-6325-42be-afff-e9a353d9aa36"
```

**Example Response:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "comment_text": "Looking forward to this event!",
      "created_at": "2025-08-08T17:06:13.549520Z",
      "event": "a8f10b86-6325-42be-afff-e9a353d9aa36",
      "user": 1
    }
  ]
}
```

### 3. Create a New Comment

**Endpoint:** `POST /api/feedback/comments/`

**Description:** Creates a new comment for an event.

**Request Body:**
```json
{
  "event": "<event_uuid>",
  "user": <user_id>,
  "comment_text": "Your comment text here"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/feedback/comments/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "a8f10b86-6325-42be-afff-e9a353d9aa36",
    "user": 1,
    "comment_text": "This looks like an exciting event! Looking forward to attending."
  }'
```

**Success Response (201 Created):**
```json
{
  "id": 2,
  "comment_text": "This looks like an exciting event! Looking forward to attending.",
  "created_at": "2025-08-08T17:06:13.549520Z",
  "event": "a8f10b86-6325-42be-afff-e9a353d9aa36",
  "user": 1
}
```

**Error Responses:**

- **400 Bad Request** - Missing required fields:
```json
{
  "user": ["This field is required."],
  "event": ["This field is required."],
  "comment_text": ["This field is required."]
}
```

- **400 Bad Request** - Duplicate comment (unique constraint violation):
```json
{
  "non_field_errors": ["The fields event, user must make a unique set."]
}
```

- **401 Unauthorized** - Missing or invalid authentication:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 4. Retrieve a Specific Comment

**Endpoint:** `GET /api/feedback/comments/<comment_id>/`

**Description:** Retrieves a single comment by its ID.

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/feedback/comments/1/
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "comment_text": "This looks like an exciting event! Looking forward to attending.",
  "created_at": "2025-08-08T17:06:13.549520Z",
  "event": "a8f10b86-6325-42be-afff-e9a353d9aa36",
  "user": 1
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "No Comment matches the given query."
}
```

### 5. Update a Comment

**Endpoint:** `PUT /api/feedback/comments/<comment_id>/` or `PATCH /api/feedback/comments/<comment_id>/`

**Description:** Updates an existing comment. Only the comment owner can update their comment.

**Request Body (PATCH - partial update):**
```json
{
  "comment_text": "Updated comment text"
}
```

**Example Request:**
```bash
curl -X PATCH http://localhost:8000/api/feedback/comments/1/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "comment_text": "Updated comment: This looks like an amazing event! Really excited to attend."
  }'
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "comment_text": "Updated comment: This looks like an amazing event! Really excited to attend.",
  "created_at": "2025-08-08T17:06:13.549520Z",
  "event": "a8f10b86-6325-42be-afff-e9a353d9aa36",
  "user": 1
}
```

### 6. Delete a Comment

**Endpoint:** `DELETE /api/feedback/comments/<comment_id>/`

**Description:** Deletes a comment. Only the comment owner can delete their comment.

**Example Request:**
```bash
curl -X DELETE http://localhost:8000/api/feedback/comments/1/ \
  -H "Authorization: Bearer <token>"
```

**Success Response (204 No Content):** Empty response body

**Error Response (403 Forbidden):** If user is not the comment owner
**Error Response (404 Not Found):** If comment doesn't exist

## Testing the API

### Complete Testing Workflow

Here's a complete workflow to test the comment API:

1. **Get JWT Token:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@goevent.com", "password": "admin123"}'
```

2. **Get Available Events:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/events/?limit=3"
```

3. **Create a Comment:**
```bash
curl -X POST http://localhost:8000/api/feedback/comments/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "<event_uuid>",
    "user": <user_id>,
    "comment_text": "This looks like an exciting event!"
  }'
```

4. **List Comments for Event:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/feedback/comments/?event=<event_uuid>"
```

5. **Update Comment:**
```bash
curl -X PATCH http://localhost:8000/api/feedback/comments/<comment_id>/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"comment_text": "Updated comment text"}'
```

6. **Delete Comment:**
```bash
curl -X DELETE http://localhost:8000/api/feedback/comments/<comment_id>/ \
  -H "Authorization: Bearer <token>"
```

## Business Rules & Constraints

### User Restrictions
- **One Comment Per Event**: Each user can only submit one comment per event
- **Authentication Required**: All operations require valid JWT authentication
- **Owner Permissions**: Users can only update/delete their own comments

### Data Validation
- All fields (event, user, comment_text) are required for creation
- Event must be a valid UUID of an existing event
- User must be a valid user ID
- Comment text cannot be empty

### Response Format
- All responses follow standard REST patterns
- Timestamps are in ISO 8601 format (UTC)
- Pagination is applied to list endpoints with standard structure
- Error responses include descriptive messages

## Integration Notes

### Frontend Integration
- Store JWT token securely (localStorage/sessionStorage)
- Handle token expiration (60-minute lifetime)
- Implement proper error handling for validation errors
- Consider implementing optimistic updates for better UX

### Permission Considerations
- No explicit permission checks beyond authentication in current implementation
- Consider adding event-specific permissions (e.g., only registered users can comment)
- Consider moderation features for comment management

### Performance Considerations
- Comments are ordered by creation date (newest first)
- Consider implementing caching for frequently accessed event comments
- Database indexes exist on foreign keys (event, user)

## Related APIs

- **Events API**: `/api/events/` - For retrieving event information
- **Authentication API**: `/api/auth/` - For user authentication
- **Reviews API**: `/api/feedback/reviews/` - For event ratings and reviews

## Status

✅ **Fully Functional**: All CRUD operations tested and working
✅ **Authentication**: JWT authentication implemented and tested  
✅ **Validation**: Input validation and unique constraints working
✅ **Error Handling**: Proper error responses implemented
✅ **Documentation**: Complete API documentation available