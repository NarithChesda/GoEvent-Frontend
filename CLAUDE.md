# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Lint code (with auto-fix)
npm run lint

# Format code
npm run format

# Run unit tests
npm run test:unit

# Run e2e tests
npm run test:e2e
```

### Testing Commands
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run specific e2e test file
npm run test:e2e -- tests/example.spec.ts

# Run e2e tests in debug mode
npm run test:e2e -- --debug

# Run e2e tests on specific browser
npm run test:e2e -- --project=chromium
```

## Architecture Overview

### Technology Stack
- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Routing**: Vue Router
- **Testing**: Vitest (unit), Playwright (e2e)
- **Icons**: Lucide Vue

### Project Structure
- `/src/views/` - Page-level components (Home, Events, EventDetail, SignIn, etc.)
- `/src/components/` - Reusable UI components following a card-based design system
- `/src/stores/` - Pinia stores (auth store for authentication state)
- `/src/services/` - API service layer (api.ts, auth.ts, upload.ts)
- `/src/router/` - Vue Router configuration with auth guards
- `/src/composables/` - Vue composables for shared logic

### Key Architectural Patterns

1. **API Communication**: Centralized through `ApiService` class in `src/services/api.ts`
   - JWT authentication with Bearer tokens
   - Automatic error handling and response parsing
   - Base URL from environment variable `VITE_API_BASE_URL`
   - Standardized `ApiResponse<T>` interface for all responses
   - Built-in pagination support with `PaginatedResponse<T>`

2. **Authentication Flow**: Managed by Pinia auth store
   - JWT tokens stored in localStorage
   - Auth guards on protected routes
   - Auto-refresh token logic
   - Google OAuth integration support

3. **Component Design**: Card-based UI system
   - BaseCard as foundation component
   - Specialized cards: EventCard, MediaCard, HostCard, etc.
   - Modal components for CRUD operations
   - Tab-based organization with permission-controlled visibility

4. **Event Management**: Core domain with rich features
   - UUID-based event IDs for security
   - Draft → Published → Completed/Cancelled lifecycle
   - Collaboration system with permission levels (organizer/collaborator)
   - Multi-language support for content
   - Media management (photos, videos, banners)
   - Template system with payment workflow integration

5. **Permission System**: Comprehensive tab-level access control
   - **Public tabs**: About, Agenda, Hosts (accessible to all users)
   - **Restricted tabs**: Attendees, Media, Collaborators, Event Texts, Template (organizer/collaborator only)
   - Computed properties for permission checks: `canViewRestrictedTabs`, `canViewAttendees`, etc.
   - Consistent access denied UI with lock icons and clear messaging

6. **Template System**: Advanced template management
   - Multi-API strategy: `browse_templates`, `public_template_assets`, `template_info`
   - Template selection without immediate payment requirement
   - Preview mode for selected templates before activation
   - Category-based template filtering
   - Payment workflow integration (selection → payment → admin enablement)

### Backend Integration
- Django REST API at `http://127.0.0.1:8000` (configurable via `VITE_API_BASE_URL`)
- JWT authentication endpoints at `/api/auth/`
- Event endpoints at `/api/events/`
- Template endpoints at `/api/core-data/event-templates/`
- Comprehensive API documentation in `FRONTEND.md`, `EVENT_TEMPLATE_API.md`, and other API docs

### Design System
- Comprehensive design guides in `/DESIGN_GUIDE/` directory
- Card-based component system with consistent styling
- Tailwind CSS configuration with custom utilities
- Responsive patterns optimized for mobile
- Lucide Vue icons throughout the application

## Key Implementation Notes

### Event Detail Architecture
The `EventDetailView` component uses a sophisticated tab system:
- **Tab Configuration**: Centralized in `navigationTabs` array with icon and label definitions
- **Permission Integration**: Each tab filtered based on user permissions via `EventNavigationTabs` component
- **Lazy Loading**: Tab content components only rendered when active
- **State Management**: Reactive permission checks using computed properties

### API Service Patterns
- All API calls return standardized `ApiResponse<T>` objects
- Automatic authentication header injection
- Error handling with user-friendly messages
- File upload utilities for media management
- Profile picture URL resolution for relative/absolute paths

### Component Communication
- Parent-child communication via props and events
- Reactive state updates using Vue's reactivity system
- Event-driven updates for complex state changes (e.g., template selection)
- Centralized error and success messaging

### Template System Workflow
1. Browse available templates (with category filtering)
2. Select template (stored locally for preview)
3. Payment processing (when user is ready)
4. Admin enablement (backend process)
5. Template activation (full feature access)

Always run `npm run type-check` and `npm run lint` before committing changes to ensure code quality and TypeScript compliance.