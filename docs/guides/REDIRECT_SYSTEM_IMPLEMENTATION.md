# Event Showcase Redirect State Management System

## Overview

This document describes the implementation of a redirect state management system for the event showcase page that allows users to skip the cover stage and event video stage when returning to the page after certain actions (language change, login, RSVP, comments).

## Architecture

### 1. Core Components

#### `useShowcaseRedirect` Composable (`src/composables/useShowcaseRedirect.ts`)
- **Purpose**: Centralized redirect state management using localStorage
- **Features**:
  - Tracks user's viewing progress for each event
  - Supports multiple events with individual state tracking  
  - Automatic cleanup of expired states (24 hours)
  - Memory management with maximum storage limits
  - TypeScript support with full type safety

#### Enhanced `useEventShowcase` Composable
- **Purpose**: Integrates redirect logic with existing showcase functionality
- **New Features**:
  - Stage management (`cover` | `event_video` | `main_content`)
  - Redirect trigger handling for different user actions
  - Automatic stage initialization based on redirect state

#### Modified Components:
- **`CoverStage.vue`**: Respects redirect state to skip cover content
- **`MainContentStage.vue`**: Emits tracking events when viewed
- **`EventShowcaseRefactored.vue`**: Orchestrates redirect state initialization

### 2. State Management

#### Storage Format
```typescript
interface ShowcaseRedirectState {
  eventId: string
  hasSeenMainContent: boolean
  lastVisitStage: ShowcaseStage
  timestamp: number
}
```

#### Storage Key: `goevent_showcase_redirect_state`
```json
{
  "event-123": {
    "eventId": "event-123",
    "hasSeenMainContent": true,
    "lastVisitStage": "main_content", 
    "timestamp": 1725444000000
  },
  "event-456": {
    "eventId": "event-456",
    "hasSeenMainContent": false,
    "lastVisitStage": "cover",
    "timestamp": 1725440000000
  }
}
```

#### Configuration
- **State Expiry**: 24 hours
- **Maximum Stored Events**: 10
- **Storage Backend**: localStorage with fallback handling

### 3. User Flow Logic

#### First Visit
1. User visits `/events/:id/showcase`
2. No redirect state exists → Start from cover stage
3. User progresses: Cover → Event Video → Main Content
4. When main content is viewed → State saved with `hasSeenMainContent: true`

#### Subsequent Visits
1. User performs redirect action (language change, login, etc.)
2. System checks redirect state
3. If `hasSeenMainContent: true` → Skip to main content stage
4. If hash/query parameters present → Handle section scrolling

#### Redirect Triggers
```typescript
type RedirectTrigger = {
  source: 'language_change' | 'login' | 'rsvp' | 'comment' | 'manual'
  targetStage?: ShowcaseStage
  hash?: string
}
```

## Implementation Details

### 1. Stage Flow Management

```typescript
// Stage progression logic
const getInitialStage = (trigger?: RedirectTrigger): ShowcaseStage => {
  if (shouldSkipToMainContent(trigger)) {
    return 'main_content'
  }
  return 'cover' // Default for first-time visitors
}
```

### 2. Component Integration

#### CoverStage Component Updates
```vue
<template>
  <!-- Cover content only shown when not redirecting -->
  <div v-if="currentVideoPhase === 'none' && !shouldSkipToMainContent">
    <!-- Cover stage content -->
  </div>
  
  <!-- Main content shown when redirecting -->
  <div v-if="currentVideoPhase === 'background' || shouldSkipToMainContent">
    <slot name="main-content"></slot>
  </div>
</template>
```

#### MainContentStage Tracking
```typescript
onMounted(() => {
  nextTick(() => {
    initializeRevealAnimations()
    initializeScrollAnimations()
    
    // Track that main content has been viewed
    emit('mainContentViewed')
  })
})
```

### 3. URL Parameter Handling

The system handles various URL patterns for redirects:

- **Hash-based**: `#rsvp`, `#comment-section`
- **Query-based**: `?scrollTo=rsvp`, `?redirect=main`
- **Language changes**: `?lang=kh`

### 4. Memory and Performance Considerations

#### Storage Management
- Automatic cleanup of expired entries (24 hours)
- Maximum 10 events stored to prevent localStorage bloat
- Graceful fallback when localStorage is unavailable

#### Component Lifecycle
- State initialization on composable creation
- Cleanup on component unmount
- Efficient state updates with minimal re-renders

## Usage Examples

### Basic Usage in Component
```vue
<script setup>
import { useEventShowcase } from '@/composables/useEventShowcase'

const {
  currentShowcaseStage,
  shouldSkipToMainContent,
  hasSeenMainContent,
  markMainContentSeen
} = useEventShowcase()
</script>
```

### Handling Redirect Triggers
```typescript
// Language change
const changeLanguage = (newLanguage: string) => {
  const trigger = { source: 'language_change' }
  const targetStage = handleRedirectTrigger(trigger)
  // Component state updated automatically
}

// Login redirect
const handleLogin = () => {
  const trigger = { source: 'login', hash: '#rsvp' }
  handleRedirectTrigger(trigger)
  // User will skip to main content + scroll to RSVP
}
```

## Testing

### Test Scenarios Covered
1. **First Time Visit**: Should start from cover stage
2. **Language Change**: Should skip to main content
3. **Login Redirect to RSVP**: Skip to main content + scroll to RSVP
4. **Login Redirect to Comments**: Skip to main content + scroll to comments
5. **State Persistence**: State survives page reloads
6. **State Expiry**: Old states are automatically cleaned up

### Test Tools
- **Manual Testing**: `test-redirect-system.html` provides UI for testing scenarios
- **Browser Console**: Debug information available via `getDebugInfo()`
- **LocalStorage Inspector**: Direct inspection of state data

### Debug Information
```javascript
// In browser console
const debug = showcaseComposable.getDebugInfo()
console.log(debug)
// Output: { eventId, hasRedirectState, hasSeenMainContent, shouldSkipToMain, etc. }
```

## Error Handling

### Graceful Degradation
- **localStorage unavailable**: Falls back to session-only behavior
- **Corrupted state**: Automatically clears and reinitializes
- **Network issues**: Redirect logic works offline
- **Missing event data**: Safe defaults prevent crashes

### Validation
- **Event ID sanitization**: Removes dangerous characters
- **State structure validation**: Ensures data integrity
- **Timestamp validation**: Prevents invalid dates

## Browser Compatibility

- **Modern browsers**: Full functionality with localStorage
- **Legacy browsers**: Graceful degradation to session-only
- **Privacy mode**: Respects browser storage limitations
- **Cross-domain**: Isolated per domain for security

## Future Enhancements

### Potential Improvements
1. **Analytics Integration**: Track user flow patterns
2. **A/B Testing**: Support for different redirect strategies
3. **User Preferences**: Allow users to disable redirect behavior
4. **Advanced Triggers**: More granular redirect conditions
5. **Performance Metrics**: Track impact on user experience

## Security Considerations

### Data Protection
- **No sensitive data**: Only viewing state is stored
- **Domain isolation**: State is isolated per domain
- **XSS protection**: Input sanitization for event IDs
- **Storage quotas**: Respects browser storage limits

### Privacy
- **Local storage only**: No server-side tracking
- **Automatic expiry**: Data self-destructs after 24 hours  
- **User control**: Can be cleared via browser settings
- **No personal data**: Only anonymous usage patterns

## File Structure

```
src/
├── composables/
│   ├── useShowcaseRedirect.ts       # Core redirect logic
│   └── useEventShowcase.ts          # Enhanced with redirect support
├── components/showcase/
│   ├── CoverStage.vue               # Modified for redirect awareness
│   ├── MainContentStage.vue         # Tracking integration
│   └── ...
├── views/
│   └── EventShowcaseRefactored.vue  # Orchestration layer
└── ...

test-redirect-system.html             # Manual testing interface
REDIRECT_SYSTEM_IMPLEMENTATION.md     # This document
```

## Conclusion

The redirect state management system provides a seamless user experience by intelligently determining when to skip the showcase introduction stages. The implementation is robust, performant, and maintains backward compatibility while adding significant UX improvements for returning users.

Key benefits:
- ✅ Improved UX for returning users  
- ✅ Maintains immersive first-time experience
- ✅ Handles complex redirect scenarios
- ✅ Production-ready with error handling
- ✅ TypeScript support and type safety
- ✅ Comprehensive testing capabilities

The system successfully addresses all requirements while maintaining the existing sophisticated 3-stage loading architecture of the event showcase page.