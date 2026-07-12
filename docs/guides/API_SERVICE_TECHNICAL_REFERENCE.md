# API Service Technical Reference

## Table of Contents
- [SecureLogger](#securelogger)
- [Type Guards](#type-guards)
- [Request Deduplication](#request-deduplication)
- [Type Safety](#type-safety)
- [Constants](#constants)

## SecureLogger

A utility class for secure logging that automatically sanitizes sensitive data.

### Usage

```typescript
import { SecureLogger } from './SecureLogger' // Internal use only

// Debug logging (development only)
SecureLogger.debug('Context', { data: 'value' })

// Error logging (always logged)
SecureLogger.error('Context', error, { additionalData: 'value' })

// Warning logging (always logged)
SecureLogger.warn('Context', 'Warning message', { data: 'value' })
```

### Features

- **Automatic Sanitization:** Removes sensitive fields (token, password, Authorization)
- **Dev-Only Debug Logs:** Debug logs only appear in development mode
- **Truncation:** Long strings truncated to 200 characters
- **Nested Object Support:** Recursively sanitizes nested objects

### Sanitized Fields

The following field names are automatically redacted:
- token
- access
- refresh
- password
- Authorization / authorization

### Example Output

```typescript
// Input
SecureLogger.debug('API Request', {
  url: '/api/auth/login/',
  headers: {
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIs...',
    'Content-Type': 'application/json'
  },
  body: { password: 'secret123' }
})

// Output (in dev mode)
[API Debug] API Request: {
  url: '/api/auth/login/',
  headers: {
    Authorization: '[REDACTED]',
    'Content-Type': 'application/json'
  },
  body: { password: '[REDACTED]' }
}
```

## Type Guards

Type guards provide runtime type checking for safer error handling.

### isErrorData(data: unknown): data is ErrorData

Checks if response data matches the ErrorData interface.

```typescript
import { isErrorData } from '@/services/api'

const response = await fetch('/api/endpoint')
const data = await response.json()

if (isErrorData(data)) {
  // data is now typed as ErrorData
  console.log(data.detail)  // Type-safe
  console.log(data.message) // Type-safe
}
```

**Returns:** `true` if data has at least one of: `detail`, `message`, `code`, `errors`

### hasFieldErrors(data: unknown): data is Record<string, string[]>

Checks if response contains field-specific validation errors.

```typescript
import { hasFieldErrors } from '@/services/api'

if (hasFieldErrors(data)) {
  // data is Record<string, string[]>
  Object.entries(data).forEach(([field, errors]) => {
    console.log(`${field}: ${errors[0]}`)
  })
}
```

**Returns:** `true` if data is an object with string array values (and no `detail`/`message` fields)

### Example Error Handling

```typescript
async function handleApiError(response: Response) {
  const data = await response.json()

  if (response.status === 400 && hasFieldErrors(data)) {
    // Handle field-specific validation errors
    return Object.entries(data).map(([field, errors]) => ({
      field,
      error: errors[0]
    }))
  }

  if (isErrorData(data)) {
    // Handle general error responses
    return { message: data.detail || data.message || 'Unknown error' }
  }

  // Fallback for unexpected error formats
  return { message: 'An unexpected error occurred' }
}
```

## Request Deduplication

Automatically prevents duplicate concurrent GET requests.

### How It Works

1. Each GET request generates a unique key: `METHOD:URL:PARAMS`
2. Before making a request, checks if identical request is in-flight
3. If exists, returns existing Promise (no duplicate network call)
4. When request completes, removes from pending map

### Example

```typescript
// Scenario: Component mounted twice, both request same data

// First request
const promise1 = apiService.get('/api/events/123')

// Second request (before first completes)
const promise2 = apiService.get('/api/events/123')

// Result: Only 1 network request made
// Both promise1 and promise2 resolve to same response
console.log(promise1 === promise2) // true
```

### Benefits

- **Performance:** Eliminates redundant network requests
- **Server Load:** Reduces unnecessary API calls
- **Consistency:** All consumers get identical data
- **Automatic:** No code changes required

### Debugging

In development mode, deduplication logs to console:

```
[API Debug] Request Deduplication: {
  message: 'Reusing existing request',
  method: 'GET',
  endpoint: '/api/events/123'
}
```

### Limitations

- Only applies to GET requests (safe for POST/PUT/PATCH/DELETE)
- Deduplication key includes full URL with params
- No cross-tab deduplication (per-instance only)

## Type Safety

### QueryParams Type

Replaces generic `any` for query parameters.

```typescript
export type QueryParams = Record<string, string | number | boolean | null | undefined>
```

**Usage:**
```typescript
// ✅ Type-safe
const params: QueryParams = {
  search: 'event',
  page: 1,
  is_active: true,
  category: null
}

// ❌ Type error
const badParams: QueryParams = {
  callback: () => {} // Error: function not allowed
}
```

### Generic HTTP Methods

All HTTP methods now use proper generics:

```typescript
// GET request
const response = await apiService.get<Event>('/api/events/123')
// response: ApiResponse<Event>

// POST request with typed body
const response = await apiService.post<Event, CreateEventRequest>(
  '/api/events/',
  { title: 'New Event', ... }
)
// response: ApiResponse<Event>

// DELETE request
const response = await apiService.delete<void>('/api/events/123')
// response: ApiResponse<void>
```

### Filter Interface Extensions

All filter interfaces extend QueryParams:

```typescript
export interface EventFilters extends QueryParams {
  search?: string
  category?: number | string
  status?: string
  page?: number
}

// Usage: Type-safe and compatible with apiService.get()
const filters: EventFilters = {
  search: 'wedding',
  page: 1
}

const response = await apiService.get<PaginatedResponse<Event>>(
  '/api/events/',
  filters // ✅ Type-safe
)
```

## Constants

Centralized configuration constants.

### DEFAULT_REQUEST_TIMEOUT

Request timeout in milliseconds (default: 30 seconds).

```typescript
const DEFAULT_REQUEST_TIMEOUT = 30000
```

**Usage:**
```typescript
// Automatic: All requests use this timeout by default
await apiService.get('/api/events/')

// Override: Provide custom timeout
await apiService.get('/api/events/', undefined, {
  timeout: 60000 // 60 seconds
})
```

### USER_CACHE_DURATION

User details cache duration (default: 5 minutes).

```typescript
const USER_CACHE_DURATION = 5 * 60 * 1000
```

**Used by:** `userService.getUserDetails()` for caching user profile data.

### IS_DEV_MODE

Development mode flag for conditional logging.

```typescript
const IS_DEV_MODE = import.meta.env.DEV
```

**Usage:**
```typescript
if (IS_DEV_MODE) {
  SecureLogger.debug('Debug Info', { data: 'value' })
}
// Logs only appear in development, removed in production build
```

## Best Practices

### Error Handling

```typescript
// ✅ Good: Use type guards
const response = await apiService.get<Event>('/api/events/123')

if (!response.success) {
  if (response.errors && hasFieldErrors(response.errors)) {
    // Handle field errors
    Object.entries(response.errors).forEach(([field, errors]) => {
      showFieldError(field, errors[0])
    })
  } else {
    // Handle general error
    showToast(response.message || 'An error occurred')
  }
  return
}

// Use response.data safely (type-checked)
const event = response.data
```

### Type Safety

```typescript
// ✅ Good: Use specific types
interface MyFilters extends QueryParams {
  myField: string
}

const filters: MyFilters = { myField: 'value' }
await apiService.get('/api/endpoint/', filters)

// ❌ Bad: Avoid any
const filters: any = { myField: 'value' }
```

### Logging

```typescript
// ✅ Good: Use SecureLogger for internal API code
SecureLogger.error('Request Failed', error, {
  url: response.url,
  status: response.status
})

// ✅ Good: Use regular console for application code
console.log('Event loaded:', event.title)

// ❌ Bad: Don't log sensitive data directly
console.log('Auth token:', token) // Security risk!
```

## Migration from Old Code

No migration needed! All existing code continues to work:

```typescript
// Old code (still works)
await apiService.get('/api/events/')
await apiService.post('/api/events/', data)

// New code (better type safety)
await apiService.get<PaginatedResponse<Event>>('/api/events/')
await apiService.post<Event, CreateEventRequest>('/api/events/', data)
```

## Troubleshooting

### "Request deduplication not working"

Check that requests are truly identical:
- Same endpoint
- Same query parameters (order matters)
- Same request body (for future POST/PUT deduplication)

### "Type error with filter parameters"

Ensure your filter interface extends `QueryParams`:

```typescript
// ✅ Correct
interface MyFilters extends QueryParams {
  search?: string
}

// ❌ Incorrect
interface MyFilters {
  search?: string
}
```

### "Logs not appearing in development"

Verify `import.meta.env.DEV` is `true`:
```typescript
console.log('Dev mode:', import.meta.env.DEV)
```

---

**Last Updated:** 2025-10-31
**Version:** 1.0.0
**Maintainer:** Development Team
