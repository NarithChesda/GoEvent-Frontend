# Guest Management Refactoring - Migration Guide

## Overview

This guide documents the refactoring from composable-based state management with callbacks to a centralized Pinia store architecture.

## What Changed

### Before (Old Architecture)
```
EventGuestManagementTab
├── useGuestGroups(eventId)
├── useGuests(eventId, onGroupCountChange, onStatsChange) ← callbacks
├── useBulkImport(eventId, onGroupCountChange, onStatsChange) ← callbacks
└── Manual state synchronization via callbacks
```

**Problems:**
- Dual refresh pattern (component + composable both refresh)
- Callback hell for state synchronization
- Scattered state across multiple composables
- Prop drilling (12+ props to child components)
- Inconsistent error handling
- Hard to debug state issues

### After (New Architecture)
```
EventGuestManagementTab
└── useGuestManagementStore()
    ├── All state centralized
    ├── No callbacks needed
    ├── Single source of truth
    └── Reactive updates automatically
```

**Benefits:**
- ✅ Single source of truth
- ✅ No duplicate API calls
- ✅ No callbacks or prop drilling
- ✅ Easier testing and debugging
- ✅ Better TypeScript support
- ✅ DevTools integration
- ✅ Consistent error handling

## Migration Steps

### Step 1: Add Pinia Store (✅ COMPLETED)

Created `src/stores/guestManagement.ts` with:
- Centralized state management
- All guest and group operations
- Pagination state
- Statistics management
- Proper TypeScript typing

### Step 2: Update Components to Use Store

#### Option A: Gradual Migration (RECOMMENDED)

Keep old composables as thin wrappers around the store:

```typescript
// src/composables/invitation/useGuestGroups.ts
import { useGuestManagementStore } from '@/stores/guestManagement'
import { storeToRefs } from 'pinia'

export function useGuestGroups(eventId: string) {
  const store = useGuestManagementStore()
  const { groups, loadingGroups } = storeToRefs(store)

  return {
    groups,
    loadingGroups,
    loadGroups: () => store.loadGroups(eventId),
    createGroup: (data) => store.createGroup(eventId, data),
    updateGroup: (groupId, data) => store.updateGroup(eventId, groupId, data),
    deleteGroup: (groupId) => store.deleteGroup(eventId, groupId),
    toggleGroupExpansion: store.toggleGroupExpansion,
    isGroupExpanded: store.isGroupExpanded,
  }
}
```

This allows:
- Existing components continue to work
- Gradual refactoring
- Easy rollback if needed

#### Option B: Direct Store Usage (FUTURE)

Directly use store in components:

```vue
<script setup lang="ts">
import { useGuestManagementStore } from '@/stores/guestManagement'
import { storeToRefs } from 'pinia'

const props = defineProps<{ eventId: string }>()
const store = useGuestManagementStore()
const { groups, stats, loadingGroups } = storeToRefs(store)

onMounted(() => {
  store.loadGroups(props.eventId)
  store.loadGuestStats(props.eventId)
})
</script>
```

### Step 3: Remove Duplicate Refresh Calls

In `EventGuestManagementTab.vue`, remove manual refresh after store actions:

```typescript
// ❌ BEFORE (Double refresh)
const response = await createGuest(name, groupId)
await loadGuestsForGroup(groupId, pagination.currentPage)  // DELETE THIS
await loadAllGuests(allGuestsPagination.currentPage, true) // DELETE THIS

// ✅ AFTER (Store handles refresh)
const response = await store.createGuest(eventId, name, groupId)
// Store already refreshed everything internally
```

### Step 4: Simplify Props in GuestGroupsView

```vue
<!-- BEFORE: 12+ props -->
<GuestGroupsView
  :groups="groups"
  :loading-groups="loadingGroups"
  :page-size="PAGE_SIZE"
  :get-group-guests="getGroupGuests"
  ...10 more props
/>

<!-- AFTER: Just eventId -->
<GuestGroupsView :event-id="eventId" />
<!-- Component gets data from store internally -->
```

## API Reference

### Store Actions

#### Group Management
- `loadGroups(eventId)` - Load all groups
- `createGroup(eventId, data)` - Create new group
- `updateGroup(eventId, groupId, data)` - Update group
- `deleteGroup(eventId, groupId)` - Delete group (cascades guests)
- `toggleGroupExpansion(groupId)` - Toggle group expansion
- `isGroupExpanded(groupId)` - Check if group is expanded

#### Guest Management
- `loadGuestsForGroup(eventId, groupId, page, silent)` - Load guests for specific group
- `loadAllGuests(eventId, page, silent)` - Load all guests
- `loadGuestStats(eventId)` - Load statistics
- `createGuest(eventId, name, groupId)` - Create new guest
- `updateGuest(eventId, guestId, groupId, data)` - Update guest
- `deleteGuest(eventId, guestId, groupId)` - Delete guest
- `markGuestAsSent(eventId, guestId, groupId)` - Mark invitation sent
- `bulkMarkGuestsAsSent(eventId, guestIds)` - Bulk mark sent
- `bulkDeleteGuests(eventId, guestIds, groupId)` - Bulk delete
- `bulkImportGuests(eventId, groupId, file)` - Import from file

#### Pagination
- `nextGroupPage(eventId, groupId)` - Next page for group
- `previousGroupPage(eventId, groupId)` - Previous page for group
- `setGroupSearchTerm(eventId, groupId, term)` - Search within group
- `nextAllGuestsPage(eventId)` - Next page for all guests
- `previousAllGuestsPage(eventId)` - Previous page for all guests
- `setAllGuestsSearchTerm(eventId, term)` - Search all guests

### Store State

```typescript
const store = useGuestManagementStore()
const { groups, stats, loadingGroups, loadingStats, allGuestsPagination } = storeToRefs(store)

// Access pagination for specific group
const groupPag = store.getGroupPaginationState(groupId)
```

## Testing

### Unit Tests

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { useGuestManagementStore } from '@/stores/guestManagement'

describe('useGuestManagementStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should load groups', async () => {
    const store = useGuestManagementStore()
    await store.loadGroups('event-123')
    expect(store.groups.length).toBeGreaterThan(0)
  })

  it('should create guest and update counts', async () => {
    const store = useGuestManagementStore()
    await store.loadGroups('event-123')
    const initialCount = store.groups[0].guest_count

    await store.createGuest('event-123', 'John Doe', store.groups[0].id)

    expect(store.groups[0].guest_count).toBe(initialCount + 1)
  })
})
```

## Rollback Plan

If issues arise, rollback is easy:

1. Keep `src/stores/guestManagement.ts` but don't use it
2. Revert component changes
3. Old composables still work

## Performance Considerations

### Before
- Creating a guest: 3-4 API calls (create + 2-3 refreshes)
- Bulk operations: N+1 problem in some cases

### After
- Creating a guest: 1 API call + 2 silent refreshes (unavoidable)
- Bulk operations: 1 API call + coordinated refreshes
- Better: Store can intelligently batch updates

### Future Optimizations

1. **Optimistic Updates**
   ```typescript
   // Add guest to local state immediately
   // If API fails, roll back
   ```

2. **Request Deduplication**
   ```typescript
   // If loadAllGuests called multiple times, only make one request
   ```

3. **Caching**
   ```typescript
   // Cache guest lists for 30 seconds
   // Invalidate on mutations
   ```

## Migration Checklist

- [x] Create Pinia store
- [x] Type check passes
- [ ] Update useGuestGroups composable (wrapper)
- [ ] Update useGuests composable (wrapper)
- [ ] Update useBulkImport composable (wrapper)
- [ ] Update EventGuestManagementTab component
- [ ] Update GuestGroupsView component
- [ ] Remove duplicate refresh calls
- [ ] Remove unused code (processBatch function)
- [ ] Test all functionality
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Monitor for issues

## Breaking Changes

### For Internal Code Only
- Callback signatures changed (but wrappers maintain compatibility)
- `processBatch` function removed (was unused)
- `expandedGroups` now allows multiple (UX improvement)

### No Breaking Changes For
- Public API
- User-facing features
- Data persistence

## Questions?

Contact: Architecture team or check [CLAUDE.md](./CLAUDE.md) for project guidelines.
