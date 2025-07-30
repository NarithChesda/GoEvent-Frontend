# Event Tab Permissions System

## Overview

The event detail page implements a comprehensive permission system that controls which tabs are visible and accessible to different types of users. This ensures sensitive event data is only available to authorized users.

## Permission Levels

### 🔓 **Public Access** (No Authentication Required)
- **About Tab**: Event description, date, location, basic information
- **Agenda Tab**: Event schedule and sessions
- **Hosts Tab**: Speaker and host information

### 🔒 **Restricted Access** (Organizer & Collaborators Only)
- **Attendees Tab**: List of registered attendees
- **Media Tab**: Event photos, videos, and media management
- **Collaborators Tab**: Team member management
- **Event Texts Tab**: Custom event text management
- **Template Tab**: Event template selection and customization

## Implementation Details

### Permission Logic

```javascript
// Main permission check - only organizers and collaborators
const canViewRestrictedTabs = computed(() => {
  if (!event.value || !authStore.isAuthenticated) return false
  return event.value.can_edit // Organizer or collaborator
})

// Individual tab permissions
const canViewAttendees = computed(() => canViewRestrictedTabs.value)
const canViewMedia = computed(() => canViewRestrictedTabs.value)
const canViewCollaborators = computed(() => canViewRestrictedTabs.value)
const canViewEventTexts = computed(() => canViewRestrictedTabs.value)
const canViewTemplate = computed(() => canViewRestrictedTabs.value)
```

### Tab Visibility Control

The `EventNavigationTabs` component filters tabs based on permissions:

```javascript
const visibleTabs = computed(() => {
  return props.tabs.filter(tab => {
    // Permission-based tab visibility
    if (tab.id === 'attendees' && !props.canViewAttendees) return false
    if (tab.id === 'media' && !props.canViewMedia) return false
    if (tab.id === 'collaborator' && !props.canViewCollaborators) return false
    if (tab.id === 'event-texts' && !props.canViewEventTexts) return false
    if (tab.id === 'template' && !props.canViewTemplate) return false
    
    return tab.visible !== false
  })
})
```

### Access Denied UI

When users try to access restricted tabs, they see a consistent access denied interface:

```vue
<div v-if="!canViewRestrictedTab" class="text-center py-12">
  <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
    <Lock class="w-8 h-8 text-slate-400" />
  </div>
  <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
  <p class="text-slate-600 max-w-md mx-auto">
    Only the event organizer and collaborators can view this content.
  </p>
</div>
```

## User Experience

### For Public Users
- **Visible Tabs**: About, Agenda, Hosts
- **Hidden Tabs**: Attendees, Media, Collaborators, Event Texts, Template
- **Experience**: Clean, focused view of public event information

### For Organizers & Collaborators
- **Visible Tabs**: All tabs (About, Agenda, Hosts, Attendees, Media, Collaborators, Event Texts, Template)
- **Experience**: Full access to event management features

### For Unauthenticated Users
- **Visible Tabs**: About, Agenda, Hosts
- **Behavior**: Same as public users, no login required for public content

## Security Benefits

1. **Data Protection**: Sensitive attendee information is protected
2. **Privacy Control**: Event organizers control who can see attendees
3. **Access Clarity**: Users clearly understand what they can and cannot access
4. **Consistent UX**: Uniform access denied messaging across all restricted tabs

## API Integration

The permission system integrates with the backend through the `can_edit` field in event data:

```javascript
// Event API response includes permission information
{
  "id": "event-uuid",
  "title": "My Event",
  "can_edit": true,    // Set by backend based on user's relationship to event
  "organizer": 123,    // Event creator user ID
  // ... other event data
}
```

## Testing

Use the provided test file `test-permission-system.html` to verify permission behavior:

1. **Role Switching**: Test different user roles (Organizer, Collaborator, Public, Guest)
2. **Tab Visibility**: Verify correct tabs are shown/hidden for each role
3. **Access Control**: Confirm restricted content shows access denied messages

### Test Scenarios

| User Role | Authenticated | Can Edit | Visible Tabs |
|-----------|---------------|----------|--------------|
| Organizer | ✅ | ✅ | All tabs |
| Collaborator | ✅ | ✅ | All tabs |
| Public User | ✅ | ❌ | About, Agenda, Hosts |
| Guest | ❌ | ❌ | About, Agenda, Hosts |

## Files Modified

1. **`EventDetailView.vue`**
   - Added comprehensive permission logic
   - Updated tab content with access control
   - Added consistent access denied UI

2. **`EventNavigationTabs.vue`**
   - Enhanced tab filtering based on permissions
   - Added new permission props interface

3. **`test-permission-system.html`**
   - Interactive testing tool for permission verification

## Future Enhancements

1. **Role-Based Permissions**: Different access levels for different collaborator roles
2. **Granular Controls**: Per-tab permission settings
3. **Audit Logging**: Track who accesses what content
4. **Admin Override**: Super admin access to all events

The permission system provides a secure, user-friendly way to control access to sensitive event information while maintaining an excellent user experience for all user types.