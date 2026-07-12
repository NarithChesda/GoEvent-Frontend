# Guest Group Mandatory Update

## Overview
**BREAKING CHANGE:** Guest groups are now **mandatory** for all guests. Users must create a group before adding any guests to an event.

## What Changed

### 1. Model Changes
**EventGuest Model** (`events/models.py:1009-1014`)

**Before:**
```python
group = models.ForeignKey(
    GuestGroup,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='guests',
    help_text="Guest group/category for organization"
)
```

**After:**
```python
group = models.ForeignKey(
    GuestGroup,
    on_delete=models.CASCADE,  # Changed from SET_NULL
    related_name='guests',      # null and blank removed
    help_text="Guest group/category for organization (required)"
)
```

**Key Changes:**
- `group` is now **required** (not nullable)
- `on_delete` changed to `CASCADE` - when a group is deleted, all its guests are also deleted
- Groups can no longer be empty

### 2. API Endpoint Changes

#### ❌ REMOVED: Bulk Import on Event Guests
```
POST /api/events/{event_id}/guests/bulk-import/  ❌ REMOVED
```

#### ✅ NEW: Bulk Import on Guest Groups
```
POST /api/events/{event_id}/guest-groups/{group_id}/bulk-import/
Content-Type: multipart/form-data

file: guests.xlsx
```

**Migration Path:**
- Old endpoint: `/api/events/123/guests/bulk-import/` (with optional group parameter)
- New endpoint: `/api/events/123/guest-groups/5/bulk-import/` (group is in URL)

### 3. Guest Creation Flow (BREAKING CHANGE)

#### Old Flow (No Longer Supported):
```bash
# ❌ This will now fail - group is required
POST /api/events/{event_id}/guests/
{
  "name": "John Doe"
}
```

#### New Flow (Required):
```bash
# Step 1: Create a group first
POST /api/events/{event_id}/guest-groups/
{
  "name": "VIP Guests",
  "color": "#FF5733",
  "order": 1
}

# Response:
{
  "id": 5,
  "name": "VIP Guests",
  "color": "#FF5733",
  "order": 1,
  "guest_count": 0
}

# Step 2: Add guests to the group
POST /api/events/{event_id}/guests/
{
  "name": "John Doe",
  "group": 5  # Required!
}
```

### 4. Bulk Import Changes

#### Old API (Deprecated):
```bash
POST /api/events/{event_id}/guests/bulk-import/
Content-Type: multipart/form-data

file: guests.xlsx
group: 5  # Optional parameter
```

#### New API (Current):
```bash
POST /api/events/{event_id}/guest-groups/{group_id}/bulk-import/
Content-Type: multipart/form-data

file: guests.xlsx
# Group is determined by URL, not form data
```

### 5. Serializer Updates

**EventGuestSerializer** now includes validation:
- `group` field is **required**
- Validates that the group belongs to the same event
- Returns error if group doesn't exist or belongs to different event

**EventGuestBulkImportSerializer**:
- Removed `group` field (no longer needed, inferred from URL)

## Migration Information

**Migration File:** `events/migrations/0025_guestgroup_eventguest_group_and_more.py`

**What the Migration Does:**
1. Creates `GuestGroup` table
2. Adds **required** `group` field to `EventGuest`
3. Creates indexes for performance
4. All existing guests were deleted before migration (as instructed)

**Data Loss:**
- All existing EventGuest records were deleted
- Fresh start with the new required group structure

## API Response Changes

### Guest List Response (Enhanced)

**Before:**
```json
{
  "id": 1,
  "name": "John Doe",
  "invitation_status": "not_sent",
  "group": null
}
```

**After:**
```json
{
  "id": 1,
  "name": "John Doe",
  "invitation_status": "not_sent",
  "group": 5,
  "group_details": {
    "id": 5,
    "name": "VIP Guests",
    "color": "#FF5733",
    "order": 1,
    "guest_count": 25
  }
}
```

### Bulk Import Response (Enhanced)

**New Response Format:**
```json
{
  "success": true,
  "message": "Successfully imported 50 guests to group \"VIP Guests\"",
  "created": 50,
  "skipped": 2,
  "errors_count": 0,
  "created_guests": [
    {
      "id": 101,
      "name": "John Doe",
      "group": "VIP Guests",
      "showcase_link": "/events/abc/showcase/?guest_name=John+Doe&lang=kh"
    }
  ],
  "skipped_guests": [
    {
      "name": "Jane Smith",
      "reason": "Already exists"
    }
  ],
  "errors": []
}
```

## Complete API Reference

### Guest Group Endpoints

```bash
# List all groups for an event
GET /api/events/{event_id}/guest-groups/

# Create a new group
POST /api/events/{event_id}/guest-groups/
{
  "name": "Family",
  "description": "Close family members",
  "color": "#00FF00",
  "order": 1
}

# Get group details
GET /api/events/{event_id}/guest-groups/{id}/

# Update group
PATCH /api/events/{event_id}/guest-groups/{id}/
{
  "name": "Updated Name",
  "color": "#FF0000"
}

# Delete group (WARNING: Deletes all guests in the group!)
DELETE /api/events/{event_id}/guest-groups/{id}/

# Get group statistics
GET /api/events/{event_id}/guest-groups/{id}/stats/
# Response: {"total": 25, "not_sent": 10, "sent": 12, "viewed": 3}

# Invite all guests in group
POST /api/events/{event_id}/guest-groups/{id}/invite-all/

# List guests in group
GET /api/events/{event_id}/guest-groups/{id}/guests/

# Bulk import guests to group
POST /api/events/{event_id}/guest-groups/{id}/bulk-import/
Content-Type: multipart/form-data
file: guests.xlsx
```

### Guest Endpoints

```bash
# List guests (with group filtering)
GET /api/events/{event_id}/guests/
GET /api/events/{event_id}/guests/?group=5
GET /api/events/{event_id}/guests/?invitation_status=not_sent

# Create guest (group REQUIRED)
POST /api/events/{event_id}/guests/
{
  "name": "John Doe",
  "group": 5  # Required!
}

# Update guest
PATCH /api/events/{event_id}/guests/{id}/
{
  "name": "John Updated",
  "group": 5
}

# Delete guest
DELETE /api/events/{event_id}/guests/{id}/

# Mark invitation sent
PATCH /api/events/{event_id}/guests/{id}/mark-sent/

# Mark showcase viewed
PATCH /api/events/{event_id}/guests/{id}/mark-viewed/

# Get guest statistics
GET /api/events/{event_id}/guests/stats/
```

## Error Handling

### Common Errors

**1. Creating Guest Without Group:**
```json
{
  "group": ["This field is required."]
}
```

**2. Invalid Group (Different Event):**
```json
{
  "group": ["The selected group does not belong to this event."]
}
```

**3. Bulk Import to Non-Existent Group:**
```
404 Not Found
{
  "detail": "Not found."
}
```

## Frontend Migration Guide

### Old Code (Deprecated):
```javascript
// ❌ This no longer works
const uploadGuests = async (eventId, file, groupId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (groupId) formData.append('group', groupId);

  await fetch(`/api/events/${eventId}/guests/bulk-import/`, {
    method: 'POST',
    body: formData
  });
};
```

### New Code (Required):
```javascript
// ✅ Required: Create group first, then upload to that group
const uploadGuests = async (eventId, groupId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  await fetch(`/api/events/${eventId}/guest-groups/${groupId}/bulk-import/`, {
    method: 'POST',
    body: formData
  });
};

// Usage:
const groupId = await createGroup(eventId, {
  name: "VIP Guests",
  color: "#FF5733"
});
await uploadGuests(eventId, groupId, file);
```

### Complete Guest Management Component:
```javascript
// 1. Fetch groups
const groups = await fetch(`/api/events/${eventId}/guest-groups/`);

// 2. Create new group if needed
const createGroup = async (name, color) => {
  const response = await fetch(`/api/events/${eventId}/guest-groups/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, color, order: 1 })
  });
  return response.json();
};

// 3. Upload guests to group
const uploadToGroup = async (groupId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `/api/events/${eventId}/guest-groups/${groupId}/bulk-import/`,
    { method: 'POST', body: formData }
  );
  return response.json();
};

// 4. Add single guest to group
const addGuest = async (name, groupId) => {
  const response = await fetch(`/api/events/${eventId}/guests/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, group: groupId })
  });
  return response.json();
};
```

## Best Practices

### 1. Always Create Groups First
```javascript
// ✅ Good
const group = await createGroup("VIP");
const guest = await createGuest("John", group.id);

// ❌ Bad - Will fail
const guest = await createGuest("John"); // Missing required group!
```

### 2. Provide Default Groups
```javascript
// Create default groups for new events
const defaultGroups = [
  { name: "General", color: "#3498db", order: 1 },
  { name: "VIP", color: "#e74c3c", order: 2 }
];

for (const groupData of defaultGroups) {
  await createGroup(groupData);
}
```

### 3. Handle Group Deletion Carefully
```javascript
// Warn users that deleting a group deletes all guests
const deleteGroup = async (groupId) => {
  const confirm = await showConfirmDialog(
    "Are you sure? This will delete all guests in this group!"
  );

  if (confirm) {
    await fetch(`/api/events/${eventId}/guest-groups/${groupId}/`, {
      method: 'DELETE'
    });
  }
};
```

### 4. Filter Guests by Group
```javascript
// Show guests from specific group
const groupGuests = await fetch(
  `/api/events/${eventId}/guests/?group=${groupId}`
);

// Show all unsent invitations in a group
const unsentInGroup = await fetch(
  `/api/events/${eventId}/guests/?group=${groupId}&invitation_status=not_sent`
);
```

## Database Schema

### Before:
```sql
CREATE TABLE eventguest (
    id INTEGER PRIMARY KEY,
    event_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    group_id INTEGER NULL,  -- Optional
    FOREIGN KEY (group_id) REFERENCES guestgroup(id) ON DELETE SET NULL
);
```

### After:
```sql
CREATE TABLE eventguest (
    id INTEGER PRIMARY KEY,
    event_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    group_id INTEGER NOT NULL,  -- Required!
    FOREIGN KEY (group_id) REFERENCES guestgroup(id) ON DELETE CASCADE
);
```

## Rollback Instructions

**If you need to rollback to optional groups:**

1. Rollback migration:
```bash
python manage.py migrate events 0024
```

2. Revert model changes in `events/models.py`
3. Revert serializer changes in `events/serializers.py`
4. Revert view changes in `events/views.py`
5. Revert URL changes in `events/urls.py`

**Note:** This will lose all guest data created after the migration!

## Testing Checklist

- [ ] Create a guest group for an event
- [ ] Try to create a guest without a group (should fail)
- [ ] Create a guest with a valid group (should succeed)
- [ ] Bulk import guests to a specific group
- [ ] Filter guests by group
- [ ] Invite all guests in a group
- [ ] Delete a group (verify guests are also deleted)
- [ ] Try to assign a guest to a group from a different event (should fail)
- [ ] View group statistics
- [ ] Update guest's group

## Summary of Changes

✅ **Added:**
- Mandatory group requirement for all guests
- Bulk import directly to guest groups
- Group validation in serializers
- Cascade delete (group deletion removes guests)

❌ **Removed:**
- Optional group field
- Bulk import on event-level guests endpoint
- `group` parameter in bulk import serializer

🔄 **Changed:**
- `group` field: optional → required
- `on_delete`: SET_NULL → CASCADE
- Bulk import location: `/guests/bulk-import/` → `/guest-groups/{id}/bulk-import/`
- All guests must belong to a group

## Support

For questions or issues:
1. Check error messages carefully
2. Ensure groups are created before adding guests
3. Verify group belongs to the correct event
4. Use the new bulk import endpoint URL format

---

**Migration Date:** 2025
**Migration File:** `events/migrations/0025_guestgroup_eventguest_group_and_more.py`
**Breaking Change:** YES - All existing guests deleted, groups now mandatory
