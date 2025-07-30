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

2. **Authentication Flow**: Managed by Pinia auth store
   - JWT tokens stored in localStorage
   - Auth guards on protected routes
   - Auto-refresh token logic
   - Google OAuth integration support

3. **Component Design**: Card-based UI system
   - BaseCard as foundation component
   - Specialized cards: EventCard, MediaCard, HostCard, etc.
   - Modal components for CRUD operations
   - Tab-based organization for event details

4. **Event Management**: Core domain with rich features
   - UUID-based event IDs
   - Draft → Published → Completed/Cancelled lifecycle
   - Collaboration system with permission levels
   - Multi-language support for content
   - Media management (photos, videos, banners)

### Backend Integration
- Django REST API at `http://127.0.0.1:8000` (configurable)
- JWT authentication endpoints at `/api/auth/`
- Event endpoints at `/api/events/`
- Comprehensive documentation in `FRONTEND.md`

### Design System
- Comprehensive design guides in `/DESIGN_GUIDE/` directory
- Card-based component system
- Consistent color and typography systems
- Responsive patterns for mobile optimization