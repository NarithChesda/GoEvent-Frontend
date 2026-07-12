# Modal Authentication System Integration Guide

This guide shows how to integrate the new modal-based authentication system into your Vue.js components. The system prevents page reloads and preserves all loaded resources while providing a seamless authentication experience.

## Overview

The modal authentication system consists of:
- `AuthModal.vue` - A comprehensive authentication modal supporting email/password and Google OAuth
- `useAuthModal.ts` - A composable for managing modal authentication state
- Updated `CommentSection.vue` - Example implementation in the showcase system

## Basic Integration

### 1. Simple Modal Integration

```vue
<template>
  <div>
    <!-- Your component content -->
    <button @click="openAuthModal" v-if="!isAuthenticated">
      Sign In to Continue
    </button>
    
    <!-- Auth Modal -->
    <AuthModal
      :is-visible="showAuthModal"
      @close="onAuthModalClose"
      @authenticated="onUserAuthenticated"
    />
  </div>
</template>

<script setup lang="ts">
import { useAuthModal } from '@/composables/useAuthModal'
import AuthModal from '@/components/AuthModal.vue'

const {
  showAuthModal,
  isAuthenticated,
  openAuthModal,
  onAuthModalClose,
  onUserAuthenticated
} = useAuthModal({
  onAuthenticated: () => {
    console.log('User successfully authenticated!')
    // Perform any post-authentication actions
  }
})
</script>
```

### 2. Protecting Actions with Authentication

```vue
<template>
  <div>
    <button @click="handleProtectedAction">
      Like Post
    </button>
    
    <AuthModal
      :is-visible="showAuthModal"
      @close="onAuthModalClose"
      @authenticated="onUserAuthenticated"
    />
  </div>
</template>

<script setup lang="ts">
import { useAuthModal } from '@/composables/useAuthModal'
import AuthModal from '@/components/AuthModal.vue'

const { showAuthModal, withAuth, onAuthModalClose, onUserAuthenticated } = useAuthModal()

// This action requires authentication
const likePost = () => {
  console.log('Liking post...')
  // Perform the like action
}

// Wrap the action with authentication requirement
const handleProtectedAction = () => {
  withAuth(likePost)
}
</script>
```

### 3. Advanced: Promise-based Authentication Flow

```vue
<script setup lang="ts">
import { useAuthModal } from '@/composables/useAuthModal'
import AuthModal from '@/components/AuthModal.vue'

const { showAuthModal, requireAuth, onAuthModalClose, onUserAuthenticated } = useAuthModal()

const handleCommentSubmission = async () => {
  const success = await requireAuth(async () => {
    // This will only execute after user authenticates
    const result = await submitComment()
    if (result.success) {
      console.log('Comment submitted successfully!')
    }
  })
  
  if (!success) {
    console.log('User cancelled authentication')
  }
}
</script>
```

## Integration Examples

### Event Showcase Comments (Actual Implementation)

The `CommentSection.vue` component shows a real-world implementation:

```vue
<!-- CommentSection.vue -->
<template>
  <div>
    <!-- Sign In Prompt for Unauthenticated Users -->
    <div v-if="!isUserAuthenticated">
      <button @click="handleSignInClick">
        Sign In to Comment
      </button>
    </div>
    
    <!-- Auth Modal -->
    <AuthModal
      :is-visible="showAuthModal"
      @close="onAuthModalClose"
      @authenticated="handleUserAuthenticated"
    />
  </div>
</template>

<script setup lang="ts">
import { useAuthModal } from '../../composables/useAuthModal'
import AuthModal from '../AuthModal.vue'

const {
  showAuthModal,
  openAuthModal,
  onAuthModalClose,
  onUserAuthenticated: handleUserAuthenticated,
} = useAuthModal({
  onAuthenticated: () => {
    // Scroll to comment form and highlight it
    nextTick(() => {
      scrollToCommentSection()
    })
  }
})

const handleSignInClick = () => {
  openAuthModal()
}

// In the comment submission method:
const submitComment = async () => {
  if (!authStore.isAuthenticated) {
    openAuthModal()
    return
  }
  // ... rest of comment submission logic
}
</script>
```

### Global Authentication Modal

For components that need to share authentication state:

```vue
<!-- App.vue or layout component -->
<template>
  <div>
    <!-- Your app content -->
    <router-view />
    
    <!-- Global Auth Modal -->
    <AuthModal
      :is-visible="isGlobalAuthModalVisible"
      @close="closeGlobalAuthModal"
      @authenticated="handleGlobalAuthenticated"
    />
  </div>
</template>

<script setup lang="ts">
import { useGlobalAuthModal } from '@/composables/useAuthModal'
import AuthModal from '@/components/AuthModal.vue'

const {
  isGlobalAuthModalVisible,
  closeGlobalAuthModal,
  handleGlobalAuthenticated
} = useGlobalAuthModal()
</script>
```

Then in any child component:

```vue
<script setup lang="ts">
import { useGlobalAuthModal } from '@/composables/useAuthModal'

const { showGlobalAuthModal } = useGlobalAuthModal()

const handleGlobalProtectedAction = () => {
  showGlobalAuthModal(() => {
    console.log('This runs after authentication!')
  })
}
</script>
```

## AuthModal Component Features

### Supported Authentication Methods
- Email/Password login
- Email/Password registration
- Google OAuth login
- Form validation with real-time feedback
- Error handling and display

### Props
```typescript
interface Props {
  isVisible: boolean
}
```

### Events
```typescript
interface Emits {
  close: []           // Modal closed
  authenticated: []   // User successfully authenticated
}
```

## useAuthModal Composable API

### Basic State
```typescript
const {
  showAuthModal,      // Ref<boolean> - Modal visibility
  isAuthenticated,    // ComputedRef<boolean> - Auth status
  user,              // ComputedRef<User | null> - Current user
} = useAuthModal()
```

### Methods
```typescript
openAuthModal()                    // Show the modal
closeAuthModal()                   // Hide the modal
withAuth(action: Function)         // Execute action if authenticated, else show modal
requireAuth(action: Function)      // Promise-based auth requirement
authRequired(fn: Function)         // Decorator to make any function require auth
protectAction(action: Function)    // HOF to protect actions
```

### Event Handlers (for templates)
```typescript
onAuthModalClose()                 // Modal close handler
onUserAuthenticated()             // Authentication success handler
```

## Best Practices

### 1. Preserve User Experience
Always provide feedback when authentication is required:

```vue
<button @click="handleProtectedAction" :disabled="isLoading">
  <Loader v-if="isLoading" />
  {{ isAuthenticated ? 'Submit' : 'Sign In to Submit' }}
</button>
```

### 2. Handle Loading States
Show loading indicators during authentication:

```vue
<script setup lang="ts">
const isLoading = ref(false)

const handleProtectedAction = async () => {
  isLoading.value = true
  try {
    await requireAuth(performAction)
  } finally {
    isLoading.value = false
  }
}
</script>
```

### 3. Provide Clear Messaging
Let users know why authentication is required:

```vue
<template>
  <div v-if="!isAuthenticated" class="auth-prompt">
    <p>Please sign in to continue with this action</p>
    <button @click="openAuthModal">Sign In</button>
  </div>
</template>
```

### 4. Handle Errors Gracefully
Always provide fallback behavior:

```vue
<script setup lang="ts">
const handleProtectedAction = () => {
  requireAuth(performAction).catch(error => {
    console.error('Action failed:', error)
    // Show error message to user
  })
}
</script>
```

## Migration from Redirect-based Authentication

### Before (Redirect-based)
```javascript
const handleSignIn = () => {
  router.push({
    path: '/signin',
    query: { redirect: route.fullPath }
  })
}
```

### After (Modal-based)
```javascript
const { openAuthModal } = useAuthModal({
  onAuthenticated: () => {
    // User is now authenticated, continue with original flow
  }
})

const handleSignIn = () => {
  openAuthModal()
}
```

## Benefits

1. **No Page Reloads**: All resources (videos, images, form data) are preserved
2. **Better UX**: Seamless authentication flow without navigation
3. **Consistent Design**: Modal matches the application's design system
4. **Flexible Integration**: Easy to add to any component
5. **TypeScript Support**: Full type safety and IntelliSense
6. **Error Handling**: Comprehensive error states and validation
7. **Multiple Auth Methods**: Supports both traditional and OAuth flows

## Testing the Implementation

1. Start the development server: `npm run dev`
2. Navigate to any event showcase page (e.g., `/events/:id/showcase`)
3. Try to leave a comment without being authenticated
4. The modal should appear instead of redirecting to the sign-in page
5. Complete authentication in the modal
6. The modal should close and you should be able to comment immediately
7. All page resources (videos, images) should remain loaded throughout the process

This modal authentication system provides a modern, user-friendly alternative to traditional redirect-based authentication flows while maintaining all existing functionality.