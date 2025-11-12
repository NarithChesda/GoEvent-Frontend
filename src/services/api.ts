/**
 * BACKWARD COMPATIBILITY LAYER
 *
 * This file maintains backward compatibility with the original api.ts structure.
 * All existing imports will continue to work without any code changes.
 *
 * The actual implementation has been refactored into modular services:
 * - src/services/api/core/ - Core infrastructure (ApiClient, NetworkManager, Logger)
 * - src/services/api/types/ - Type definitions organized by domain
 * - src/services/api/modules/ - Service modules (events, agenda, guests, etc.)
 *
 * For new code, consider importing directly from the refactored modules:
 * import { eventsService } from '@/services/api/modules/events.service'
 * import type { Event } from '@/services/api/types'
 */

// ============================================================================
// CORE EXPORTS - Backward compatible with original api.ts
// ============================================================================

// Export the main API client (formerly ApiService)
export { apiClient as apiService } from './api/core/ApiClient'
export { apiClient } from './api/core/ApiClient'

// ============================================================================
// TYPE EXPORTS - All types from original api.ts
// ============================================================================

// Core API types
export type {
  QueryParams,
  ApiResponse,
  PaginatedResponse,
  RequestOptions,
  ErrorData,
} from './api/types/api.types'

export { isErrorData, hasFieldErrors } from './api/types/api.types'

// Event-related types
export type {
  EventCategory,
  Event,
  EventHost,
  HostTranslation,
  CreateHostRequest,
  BulkReorderHostsRequest,
  AgendaIcon,
  EventAgendaItem,
  AgendaTranslation,
  CreateAgendaRequest,
  BulkReorderRequest,
  EventPhoto,
  EventCollaborator,
  EventRegistrationDetail,
  EventFilters,
  EventRegistration,
  MyEventsResponse,
  EventText,
  CreateEventTextRequest,
  EventComment,
  CreateCommentRequest,
  CommentFilters,
} from './api/types/event.types'

// Template types
export type {
  EventTemplateFont,
  EventTemplateLanguageFont,
  EventTemplateColor,
  EventTemplatePackagePlan,
  EventTemplate,
  TemplateAssets,
  BrowseTemplatesResponse,
} from './api/types/template.types'

// Guest types
export type {
  GuestGroup,
  CreateGuestGroupRequest,
  GuestGroupStats,
  EventGuest,
  CreateGuestRequest,
  GuestListFilters,
  GuestStats,
} from './api/types/guest.types'

// Payment types
export type {
  EventPaymentMethod,
  CreatePaymentMethodRequest,
  BulkReorderPaymentMethodsRequest,
} from './api/types/payment.types'

// Expense types
export type {
  ExpenseCategory,
  CreateExpenseCategoryRequest,
  ExpenseBudget,
  CreateExpenseBudgetRequest,
  ExpenseRecord,
  CreateExpenseRecordRequest,
  ExpenseFilters,
  ExpenseSummary,
} from './api/types/expense.types'

// Core data types
export type {
  TeamMember,
  UserDetails,
} from './api/types/core-data.types'

// Dress code types
export type {
  EventDressCode,
  CreateDressCodeRequest,
  UpdateDressCodeRequest,
  BulkReorderDressCodesRequest,
  DressCodeFilters,
  DressCodeType,
  TimePeriod,
  Gender,
} from './api/types/dress-code.types'

export {
  DRESS_CODE_TYPE_LABELS,
  TIME_PERIOD_LABELS,
  GENDER_LABELS,
} from './api/types/dress-code.types'

// ============================================================================
// SERVICE EXPORTS - All services from original api.ts
// ============================================================================

// Events service
export { eventsService } from './api/modules/events.service'

// Agenda service
export { agendaService } from './api/modules/agenda.service'

// Event categories service
export { eventCategoriesService } from './api/modules/categories.service'

// Event texts service
export { eventTextsService } from './api/modules/texts.service'

// Media service
export { mediaService } from './api/modules/media.service'

// Hosts service
export { hostsService } from './api/modules/hosts.service'

// Event templates service
export { eventTemplateService } from './api/modules/templates.service'

// Guest services
export { guestService, guestGroupService } from './api/modules/guests.service'

// Comments service
export { commentsService } from './api/modules/comments.service'

// Payment methods service
export { paymentMethodsService } from './api/modules/payments.service'

// Core data services
export {
  coreDataService,
  teamMembersService,
  userService,
} from './api/modules/core-data.service'

// Expense tracking services
export {
  expenseCategoriesService,
  expenseBudgetsService,
  expensesService,
} from './api/modules/expenses.service'

// Dress code service
export { dressCodeService } from './api/modules/dress-code.service'

// ============================================================================
// NOTES FOR DEVELOPERS
// ============================================================================

/**
 * MIGRATION GUIDE:
 *
 * The API has been refactored into a modular structure. All existing code
 * continues to work without changes, but for new code consider:
 *
 * OLD WAY (still works):
 * ```ts
 * import { eventsService, type Event } from '@/services/api'
 * ```
 *
 * NEW WAY (recommended for new code):
 * ```ts
 * import { eventsService } from '@/services/api/modules/events.service'
 * import type { Event } from '@/services/api/types'
 * ```
 *
 * BENEFITS OF NEW STRUCTURE:
 * - Better code organization (15+ files instead of 1 massive file)
 * - Tree-shakeable imports (only import what you need)
 * - Easier to maintain and test
 * - Better IDE autocomplete and navigation
 * - Clear separation of concerns
 *
 * FILE STRUCTURE:
 * src/services/api/
 * ├── core/           # Core infrastructure
 * │   ├── ApiClient.ts
 * │   ├── NetworkManager.ts
 * │   └── SecureLogger.ts
 * ├── types/          # Type definitions
 * │   ├── api.types.ts
 * │   ├── event.types.ts
 * │   ├── guest.types.ts
 * │   ├── expense.types.ts
 * │   ├── payment.types.ts
 * │   ├── template.types.ts
 * │   └── core-data.types.ts
 * └── modules/        # Service modules
 *     ├── events.service.ts
 *     ├── agenda.service.ts
 *     ├── hosts.service.ts
 *     ├── media.service.ts
 *     ├── guests.service.ts
 *     ├── payments.service.ts
 *     ├── templates.service.ts
 *     ├── expenses.service.ts
 *     ├── comments.service.ts
 *     ├── categories.service.ts
 *     ├── texts.service.ts
 *     └── core-data.service.ts
 */
