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

# Preview production build
npm run preview
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
- **Build Tool**: Vite 7.0
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4.1 with custom design system
- **State Management**: Pinia stores
- **Routing**: Vue Router 4 with authentication guards
- **Testing**: Vitest (unit), Playwright (e2e)
- **Icons**: Lucide Vue Next
- **Authentication**: JWT with Google OAuth integration
- **Additional**: DOMPurify for sanitization, Vue3 Google Login

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
- **Caching Strategy**: User service implements 5-minute memory cache for user details
- **Graceful Degradation**: APIs handle missing endpoints gracefully with fallback data

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

7. Event Showcase System: Public invitation pages

   - **Showcase Route**:  
   `/events/:id/showcase` - Public route for wedding invitations

   - **Component Architecture**: Refactored into 10+ specialized showcase components:
   - `CoverStage`, `EventVideoStage`, `MainContentStage` for different presentation phases  
   - `AgendaSection`, `PhotoGallery`, `HostInfo`, `EventInfo` for content sections  
   - `LoadingSpinner`, `ErrorDisplay` for state management  

   - **useEventShowcase Composable**: Centralized business logic for showcase functionality
   - Handles template color processing and SVG icon manipulation  
   - Manages video playbook, envelope opening animations  
   - Processes paginated API responses gracefully  

   - **Stage Loading & Preload Strategy**: Optimized staged experience  
   - **Stage 1 (Cover Stage)**:  
      - After all cover assets load, background-preload Stage 2 (`Event Video > Event Music`)  
      - Open Envelope button is **disabled until Stage 2 video finishes loading**, ensuring smooth playback  
   - **Stage 2 (Event Video Stage)**:  
      - While the video plays, background-preload Stage 3 content, prioritizing the standard background video  
   - **Stage 3 (Main Content Stage)**:  
      - Display event information, galleries, and agenda once background-preload is completed  

   - **Authentication Handling**: Public showcases work without authentication
   - Photos require authentication but showcase degrades gracefully without them  
   - Template assets and colors are publicly accessible  

   - **Template Integration**: Dynamic theming with template colors and fonts
   - SVG icon color processing via regex replacement to match template colors  
   - Custom font loading from template assets  
   - Glass morphism UI effects with backdrop filters  


8. **Guest Management System**
   - **Invitation Tab**: Comprehensive guest management with personalized showcase links
   - **Bulk Operations**: Send invitations, view personalized showcases
   - **Guest Showcase Links**: Each guest gets unique showcase URL with personalized data

9. **Comment System**: Interactive commenting on event showcases
   - **User-First Ordering**: Authenticated user's own comment always appears at top for easy editing/deletion
   - **Authentication Flow**: Seamless login redirect back to comment section with visual feedback
   - **Real-time Updates**: Comments display actual user info with profile pictures from backend `user_info`
   - **Visual Distinction**: User's own comment highlighted with theme colors and "You" badge
   - **Smooth Scrolling**: Automatic scroll to comment section after login with highlight animation

## Additional Development Guidelines

### Composables Architecture
The application leverages Vue 3 composables for shared business logic:
- `useEventShowcase` - Event showcase functionality with template processing
- `useNotifications` - Application-wide notification system
- `useNavbarScroll` - Navigation scroll behavior
- `useTypingAnimation` and `useDelayedTypingAnimation` - Text animations
- `useScrollAnimations` - Scroll-triggered animations
- `usePaymentTemplateIntegration` - Template payment workflow

### Component Organization
- **Base Components**: `BaseCard` serves as the foundation for all card-based UI
- **Modal Components**: Standardized CRUD modals following consistent patterns
- **Showcase Components**: Specialized `/showcase/` directory for invitation pages
- **Template Components**: `/template/` directory for template selection UI
- **Icon Components**: Custom icon components in `/icons/` directory

### Security Implementation
- **Route Guards**: Enhanced authentication checks with token validation
- **Secure Storage**: Custom `secureStorage` utility for token management
- **API Security**: Automatic auth header injection and error handling
- **Input Validation**: Client-side validation utilities in `utils/inputValidation.ts`

### Comment System Implementation
- **Backend Integration**: Comments use `user_info` structure with complete user data and profile pictures
- **Sorting Logic**: `sortCommentsWithUserFirst()` ensures user's own comment appears at top
- **Redirect Handling**: Login redirects use both hash (`#comment-section`) and query parameters (`scrollTo=comment-section`) for reliability
- **Visual Feedback**: Theme-consistent highlighting and smooth scrolling animations
- **URL Management**: Automatic cleanup of redirect parameters after successful navigation

### Performance Considerations
- **Lazy Loading**: Route-based code splitting for optimal bundle sizes
- **Image Optimization**: Proper media URL resolution and responsive images
- **Font Loading**: Dynamic font loading for template customization
- **Network Handling**: Offline detection and request retry mechanisms
- **Video Playback**: Showcase videos use staged preloading and support for various browser environments

### Video Playback Architecture
- **Multi-Stage Preloading**: Sequential preloading across 3 showcase stages
- **Browser Compatibility**: Handles autoplay restrictions in different browsers
- **In-App Browser Support**: Special considerations for Telegram, Facebook Messenger browsers
- **Fallback Mechanisms**: Graceful degradation when autoplay is blocked

### Event Showcase Stage Loading Strategy
Event Showcase pages use a sophisticated 3-stage loading system:

- **Stage 1 (Cover Stage)**: After loading all cover assets, background-preload Stage 2 content ("Event Video > Event Music"). The "Open Envelope" button remains disabled until Stage 2 video finishes loading to ensure smooth playback.

- **Stage 2 (Event Video Stage)**: While the video plays, background-preload Stage 3 content with the standard background video as top priority.

- **Stage 3 (Main Content Stage)**: Display event information, galleries, and agenda once background preload completes.

## Important Development Reminders

- **ALWAYS** prefer editing existing files over creating new ones
- **NEVER** create documentation files (*.md) or README files unless explicitly requested
- Run `npm run type-check` and `npm run lint` before committing changes
- Follow existing code conventions and patterns found in the codebase
- Check for existing libraries/utilities before adding new dependencies
- Use the card-based design system for UI components
- Implement proper permission checks for restricted functionality