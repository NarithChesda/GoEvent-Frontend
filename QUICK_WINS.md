# Quick Wins - Immediate Improvements

These are high-impact, low-risk changes you can make **right now** to improve the codebase.

## 1. Remove Duplicate Refresh Calls (5 minutes)

### Problem
The component refreshes lists AFTER the composable already did it.

### Fix
In `src/components/EventGuestManagementTab.vue`:

#### handleAddGuest (lines 529-552)
```typescript
// DELETE lines 538-546
const handleAddGuest = async (name: string, groupId: number) => {
  isAddingGuest.value = true

  const response = await createGuest(name, groupId)

  if (response.success && response.data) {
    showMessage('success', `${response.data.name} added to guest list`)
    showAddGuestModal.value = false

    // ❌ DELETE THESE LINES (composable already refreshed)
    // const pagination = getGroupPagination(groupId)
    // await loadGuestsForGroup(groupId, pagination.currentPage)
    // const allGuestsPagination = getAllGuestsPagination()
    // if (allGuestsPagination.hasLoaded) {
    //   await loadAllGuests(allGuestsPagination.currentPage, true)
    // }
  } else {
    showMessage('error', response.message || 'Failed to add guest')
  }

  isAddingGuest.value = false
}
```

#### handleBulkImport (lines 554-585)
```typescript
// DELETE lines 562-569
const handleBulkImport = async (groupId: number) => {
  const response = await importGuests(groupId)

  if (response.success && response.data) {
    const { created, skipped, skipped_guests } = response.data

    // ❌ DELETE THESE LINES (composable already refreshed)
    // const pagination = getGroupPagination(groupId)
    // await loadGuestsForGroup(groupId, pagination.currentPage)
    // const allGuestsPagination = getAllGuestsPagination()
    // if (allGuestsPagination.hasLoaded) {
    //   await loadAllGuests(allGuestsPagination.currentPage, true)
    // }

    // Show results...
  }
}
```

**Impact:** Reduces API calls by 50%, improves performance

---

## 2. Delete Unused Code (2 minutes)

### Problem
Dead code bloat

### Fix
In `src/components/EventGuestManagementTab.vue`, **delete lines 310-342**:

```typescript
// ❌ DELETE THIS ENTIRE FUNCTION (never used)
const processBatch = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 20
): Promise<Array<PromiseSettledResult<R>>> => {
  // ... entire function
}
```

**Impact:** Cleaner code, less confusion

---

## 3. Allow Multiple Group Expansion (10 minutes)

### Problem
Only one group can be open at a time (poor UX)

### Current Code
`src/composables/invitation/useGuestGroups.ts` lines 102-113:

```typescript
const toggleGroupExpansion = (groupId: number) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
    return false
  } else {
    // ❌ BAD: Clears all other groups
    expandedGroups.value.clear()
    expandedGroups.value.add(groupId)
    return true
  }
}
```

### Fix
```typescript
const toggleGroupExpansion = (groupId: number) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
    return false
  } else {
    // ✅ GOOD: Just add this group (allow multiple)
    expandedGroups.value.add(groupId)
    return true
  }
}
```

**Impact:** Better UX, users can compare multiple groups

---

## 4. Fix Auto-Expand on Group Creation (5 minutes)

### Problem
Creating a group collapses all others

### Current Code
`src/composables/invitation/useGuestGroups.ts` lines 46-48:

```typescript
// Auto-expand the new group (collapse all others first)
expandedGroups.value.clear()  // ❌ BAD
expandedGroups.value.add(response.data.id)
```

### Fix
```typescript
// Auto-expand the new group (keep others open)
expandedGroups.value.add(response.data.id)  // ✅ GOOD
```

**Impact:** Consistent with improvement #3

---

## 5. Document the Refresh Responsibility (3 minutes)

### Problem
Unclear who owns the refresh logic

### Fix
Add comment at top of `src/composables/invitation/useGuests.ts`:

```typescript
/**
 * Guest Management Composable
 *
 * IMPORTANT: This composable handles ALL data refreshes internally.
 * Components should NOT manually refresh after calling these actions:
 * - createGuest()
 * - updateGuest()
 * - deleteGuest()
 * - markGuestAsSent()
 *
 * All refresh logic is handled automatically with silent mode
 * to prevent loading flicker.
 */
```

**Impact:** Prevents future developers from re-introducing the bug

---

## Summary of Quick Wins

| # | Change | Time | Impact | Risk |
|---|--------|------|--------|------|
| 1 | Remove duplicate refresh calls | 5 min | High (50% fewer API calls) | Low |
| 2 | Delete `processBatch` function | 2 min | Medium (code clarity) | None |
| 3 | Allow multiple group expansion | 10 min | High (better UX) | Low |
| 4 | Fix auto-expand on create | 5 min | Medium (consistency) | Low |
| 5 | Document refresh responsibility | 3 min | High (prevent bugs) | None |
| **Total** | | **25 min** | | |

## Running Tests After Changes

```bash
# Type check
npm run type-check

# Build to ensure no runtime errors
npm run build-skip-typecheck

# Manual testing
npm run dev
# Test: Create group → Add guest → Check "All Guests" tab
```

## Next Steps (After Quick Wins)

1. Review the [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for long-term refactoring
2. Consider migrating to the Pinia store incrementally
3. Add unit tests for critical paths
4. Set up E2E tests for guest management flows

## Need Help?

Check the audit report for full architectural analysis.
