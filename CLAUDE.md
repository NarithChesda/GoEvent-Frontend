# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GoEvent is a Vue 3 + TypeScript event management platform with a sophisticated event showcase system. The application features:
- Event creation, editing, and management with templates
- Multi-language support for event showcases
- Commission tracking system
- Real-time event check-ins and registrations
- Collaborative event management
- Advanced media handling (photos, videos, QR codes)
- Guest invitation system with tracking
- Payment method integration

## Common Development Commands

### Development & Build
```bash
npm run dev              # Start dev server on port 5173
npm run build            # Type-check + production build
npm run build-skip-typecheck  # Build without type checking (faster)
npm run build-cloudflare # Optimized build for Cloudflare Pages
npm run preview          # Preview production build on port 4173
```

### Testing & Quality
```bash
npm run test:unit        # Run Vitest unit tests
npm run test:e2e         # Run Playwright E2E tests
npm run type-check       # Run Vue TSC type checking
npm run type-check-noEmit # Type check without emitting files
npm run lint             # Run ESLint with auto-fix
npm run format           # Format code with Prettier
```

## Architecture Overview

### State Management
- **Pinia stores** ([src/stores/](src/stores/)):
  - `auth.ts`: Authentication state, login/logout, profile management, Google/Telegram OAuth
  - `guestManagement.ts`: Guest list state management with optimistic updates and local filtering
  - `counter.ts`: Example counter store
- Authentication uses JWT tokens stored in secure storage with automatic refresh
- Auth initialization happens in [App.vue](src/App.vue) on mount

### API Layer Architecture
- **Modular API architecture** - The API layer has been refactored into a modular structure:
  - **Core infrastructure** ([src/services/api/core/](src/services/api/core/)):
    - `ApiClient.ts`: Central HTTP client with automatic token injection, request deduplication, and retry logic
    - `NetworkManager.ts`: Network state monitoring and offline detection
    - `SecureLogger.ts`: Secure logging with sensitive data redaction
  - **Type definitions** ([src/services/api/types/](src/services/api/types/)): Domain-specific types organized by feature
  - **Service modules** ([src/services/api/modules/](src/services/api/modules/)): Specialized services for each domain

- **Backward compatibility layer** ([src/services/api.ts](src/services/api.ts)):
  - Re-exports all services and types for backward compatibility
  - Existing imports continue to work: `import { eventsService } from '@/services/api'`
  - New code can import directly from modules: `import { eventsService } from '@/services/api/modules/events.service'`

- **Service layer** exports from [api.ts](src/services/api.ts):
  - `eventsService`: Event CRUD, registrations, RSVP, check-ins
  - `agendaService`: Agenda item management with bulk reordering
  - `hostsService`: Event host management with profile images
  - `mediaService`: Photo uploads (single and bulk), reordering
  - `eventTextsService`: Multi-language event text content
  - `paymentMethodsService`: Payment method management (bank, QR, URL)
  - `guestService`, `guestGroupService`: Guest list and group management with invitation tracking
  - `commentsService`: Event comments and feedback
  - `eventTemplateService`: Template browsing and selection
  - `eventCategoriesService`: Event categories
  - `teamMembersService`, `userService`: Team member and user data
  - `coreDataService`: Core data like icons
  - `expenseCategoriesService`, `expenseBudgetsService`, `expensesService`: Expense tracking
  - `dressCodeService`: Dress code management for events
  - `reviewsService`: Event reviews and ratings

- **Additional services**:
  - [src/services/auth.ts](src/services/auth.ts): Authentication operations (login, register, OAuth)
  - [src/services/tokenManager.ts](src/services/tokenManager.ts): JWT token management with automatic refresh
  - [src/services/commission.ts](src/services/commission.ts): Commission tracking
  - [src/services/upload.ts](src/services/upload.ts): File upload utilities

- **Core API features**:
  - Automatic token injection and refresh via `tokenManager`
  - Network state management with offline detection
  - Request timeout handling (30s default)
  - Request deduplication to prevent duplicate concurrent requests
  - User-friendly error messages with field-specific validation errors
  - Support for JSON and FormData payloads
  - Public endpoints available via `apiClient.getPublic()` for unauthenticated access

### Routing & Navigation
- Vue Router with dynamic imports for code-splitting ([src/router/index.ts](src/router/index.ts))
- Route guards enforce authentication and validate tokens on sensitive routes
- Meta tags managed with `metaUtils` for SEO
- Special handling for showcase pages with meta tag reset

### Event Showcase System
The showcase system is a complex, multi-stage component system for displaying event invitations:

- **Main showcase** ([src/views/EventShowcaseRefactored.vue](src/views/EventShowcaseRefactored.vue)):
  - Uses composables for modular functionality
  - Multi-language support with language switching
  - Guest-specific personalization via URL params
  - Template-driven rendering with custom fonts and colors

- **Key composables** ([src/composables/showcase/](src/composables/showcase/)):
  - `useShowcaseStages.ts`: Stage progression logic
  - `useTemplateProcessor.ts`: Template asset processing
  - `useFontManager.ts`: Dynamic font loading
  - `useVideoResourceManager.ts`: Video preloading and memory management
  - `useCoverStageVideo.ts`: Cover video handling
  - `useShowcaseRedirect.ts`: Redirect logic for showcase navigation

- **Showcase components** ([src/components/showcase/](src/components/showcase/)):
  - Stage-specific components for different showcase phases
  - Photo modal for gallery viewing
  - RSVP forms and payment method displays
  - Error boundaries and loading states

### Component Organization
- **Feature-based structure**:
  - `components/settings/`: Settings page components
  - `components/settings/commission/`: Commission-specific components
  - `components/template/`: Template selection and management
  - `components/showcase/`: Event showcase components (stages, RSVP, payment, galleries)
  - `components/expense/`: Expense tracking components (budgets, categories, records)
  - `components/host/`: Host-related components
  - `components/agenda/`: Agenda item components
  - `components/invitation/`: Invitation management components
  - `components/common/`: Shared/common components
- Components use composition API with `<script setup>`
- TypeScript for type safety across all components

### Utilities & Helpers
- [src/utils/secureStorage.ts](src/utils/secureStorage.ts): Wrapper around localStorage with error handling
- [src/utils/sanitize.ts](src/utils/sanitize.ts): DOMPurify integration for XSS protection
- [src/utils/inputValidation.ts](src/utils/inputValidation.ts): Input validation utilities
- [src/utils/timezones.ts](src/utils/timezones.ts): Timezone handling
- [src/utils/translations.ts](src/utils/translations.ts): Translation utilities
- [src/utils/embedExtractor.ts](src/utils/embedExtractor.ts): Extract embed URLs from various formats
- [src/utils/performance.ts](src/utils/performance.ts): Performance monitoring utilities
- [src/utils/browserDetection.ts](src/utils/browserDetection.ts): Browser detection utilities
- [src/utils/budgetCalculations.ts](src/utils/budgetCalculations.ts): Budget and expense calculation utilities
- [src/utils/guestValidation.ts](src/utils/guestValidation.ts): Guest data validation utilities
- [src/utils/currency.ts](src/utils/currency.ts): Currency formatting utilities
- [src/utils/jwtUtils.ts](src/utils/jwtUtils.ts): JWT token parsing and validation

### Type Definitions
- [src/types/showcase.ts](src/types/showcase.ts): Comprehensive type definitions for showcase system
- API types organized by domain in [src/services/api/types/](src/services/api/types/):
  - `api.types.ts`: Core API types (ApiResponse, PaginatedResponse, QueryParams, ErrorData)
  - `event.types.ts`: Event, agenda, host, photo, collaborator, registration types
  - `guest.types.ts`: Guest, guest group, and invitation types
  - `expense.types.ts`: Budget, expense category, and expense record types
  - `payment.types.ts`: Payment method types
  - `template.types.ts`: Event template and asset types
  - `dress-code.types.ts`: Dress code types
  - `review.types.ts`: Event review types
- All components use proper TypeScript typing

## Important Development Notes

### Environment Variables
Required env vars (see [.env.example](.env.example)):
- `VITE_API_BASE_URL`: Backend API URL (default: http://127.0.0.1:8000)
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID
- `VITE_TELEGRAM_BOT_USERNAME`: Telegram bot username for login
- `VITE_GENERATE_SOURCEMAP`: Generate source maps (true/false)

### Authentication Flow
1. User authenticates via email/password, Google OAuth, or Telegram
2. Backend returns `{ tokens: { access, refresh }, user }`
3. Tokens stored in secure storage, user data in Pinia store
4. Access token auto-injected in API requests via `getAuthHeaders()`
5. Route guards validate tokens on protected routes
6. Token refresh handled automatically by `authService.ensureValidToken()`

### Backend Testing Credential
Email: admin@goevent.com
Password: 2025Password@admin

### API Response Format
All API responses follow this structure:
```typescript
{
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}
```

Field-specific errors come as: `{ "field_name": ["Error message"] }`

### Working with Events
- Events use string IDs (UUIDs from backend)
- Full event data includes nested relations: hosts, agenda, photos, collaborators, registrations
- Use `eventsService.getEvent(id)` for detailed event data
- Use `eventsService.getEvents(filters)` for paginated lists
- Event updates support both JSON and FormData (for file uploads)

### Media/File Uploads
- Use FormData for file uploads (images, videos, QR codes)
- API client has dedicated methods: `postFormData`, `putFormData`, `patchFormData`
- Media URLs returned by API may be relative - use `apiClient.getProfilePictureUrl()` for full URLs
- Bulk upload supported for photos (up to 50 per request)
- File validation handled by upload utilities in [src/services/upload.ts](src/services/upload.ts)

### Showcase System Development
- Showcase uses template-driven rendering with dynamic font/color loading
- Video resources are carefully managed to avoid memory leaks
- Multi-language support requires proper translation data structure
- Guest names can be passed via URL params for personalization
- Template assets cached using composables

### Commission System
- Commission data managed via [src/services/commission.ts](src/services/commission.ts)
- Pagination and filtering supported
- Bulk claim operations available
- Commission stats calculated server-side

### Expense Tracking System
- Three-tier expense tracking: Categories → Budgets → Expense Records
- Real-time budget calculations with spent/remaining amounts
- Quick add modal for rapid expense entry ([components/expense/QuickAddModal.vue](src/components/expense/QuickAddModal.vue))
- Budget calculations handled by [src/utils/budgetCalculations.ts](src/utils/budgetCalculations.ts)
- Services: `expenseCategoriesService`, `expenseBudgetsService`, `expensesService`

### Guest Management System
- Centralized guest state management via `guestManagement` Pinia store
- Optimistic UI updates for better UX during network operations
- Local filtering and searching for responsive guest list interactions
- Guest group organization with stats tracking
- Bulk operations supported (import, export, invitation sending)
- Validation utilities in [src/utils/guestValidation.ts](src/utils/guestValidation.ts)
- Services: `guestService`, `guestGroupService`

### Testing
- Unit tests use Vitest with Vue Test Utils
- E2E tests use Playwright
- Test files co-located with components (`.spec.ts` or `.test.ts`)

### Build Optimization
- Vite config optimized for Cloudflare Pages deployment
- Manual code splitting configured for vendor, UI, auth, and styles
- CSS code splitting enabled
- Small assets inlined as base64
- Production builds use esbuild minification

### Error Handling
- API layer provides user-friendly error messages
- Network state monitored with offline detection
- Components should use error boundaries for resilience
- Auth errors automatically clear invalid tokens

### Security Considerations
- All user input sanitized with DOMPurify before rendering
- XSS protection via input validation utilities
- CSRF protection via `X-Requested-With` header
- Sensitive routes validate tokens server-side
- Auth tokens stored in secure storage with proper cleanup

## Path Aliases
- `@/` maps to [src/](src/) directory (configured in [vite.config.ts](vite.config.ts))

## Styling
- Tailwind CSS with custom theme extensions ([tailwind.config.js](tailwind.config.js))
- Custom color palette (primary green/blue, extended purple)
- Custom breakpoints: 2xl (1536px), 3xl (1920px), 4xl (2560px)
- Custom font: Figtree, Kantumruy Pro
- Tailwind forms plugin included

## Important Implementation Patterns

### Composables
- Keep composables focused and single-purpose
- Export clear interfaces from composables
- Use composables for shared logic across components
- Composables can access stores but should remain testable

### Component Communication
- Props down, events up
- Use Pinia stores for global state
- Emit events with proper TypeScript types

### Performance
- Use dynamic imports for route-level code splitting
- Lazy load heavy components (media viewers, modals)
- Optimize images before upload when possible
- Use IntersectionObserver for lazy loading sections
- Monitor video memory usage in showcase system

### Accessibility
- Use semantic HTML elements
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers when possible
