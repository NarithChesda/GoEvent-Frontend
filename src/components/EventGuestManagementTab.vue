
<template>
  <div class="space-y-6">
    <!-- Header with Sub-navigation -->
    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 overflow-hidden">
      <!-- Title Section -->
      <div class="px-6 py-4 border-b border-slate-200/80">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <Users class="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-900">Guest Management</h2>
              <p class="text-sm text-slate-500">Organize guests, send invitations, and track responses</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sub-navigation Tabs -->
      <div class="px-4 bg-slate-50/50">
        <div class="flex gap-2 overflow-x-auto scrollbar-hide py-3">
          <button
            v-for="tab in subTabs"
            :key="tab.id"
            @click="activeSubTab = tab.id"
            :class="[
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap',
              activeSubTab === tab.id
                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
            ]"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loadingPayments"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Checking template status...</span>
      </div>
    </div>

    <!-- No Template Selected -->
    <div
      v-else-if="!props.event?.event_template"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <Mail class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">No Template Selected</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        You need to select an event template before you can send invitations.
      </p>
      <button
        @click="redirectToTemplateTab"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm sm:text-base"
      >
        <Mail class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Select Template
      </button>
    </div>

    <!-- Template Payment Check -->
    <div
      v-else-if="!hasTemplatePayment"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <Lock class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">Template Payment Required</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        Your template {{ props.event.event_template_details?.name || 'Selected Template' }}
        requires payment before you can send invitations.
      </p>
      <button
        @click="redirectToPaymentTab"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm sm:text-base"
      >
        <CreditCard class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Complete Payment
      </button>
    </div>

    <!-- Content Area -->
    <div v-else class="min-h-[400px]">
      <!-- Guests View (renamed from Guest Groups View) -->
      <GuestGroupsView
        v-if="activeSubTab === 'guests'"
        :groups="groups"
        :loading-groups="loadingGroups"
        :page-size="PAGE_SIZE"
        :get-group-guests="getGroupGuests"
        :is-group-loading="isGroupLoading"
        :is-group-expanded="isGroupExpanded"
        :get-group-pagination="getGroupPagination"
        :get-all-guests-pagination="getAllGuestsPagination"
        :is-all-guests-loading="isAllGuestsLoading"
        :load-all-guests="loadAllGuests"
        @add-guest="showAddGuestModal = true"
        @toggle-group="handleGroupToggle"
        @edit-group="openEditGroupModal"
        @delete-group="openDeleteGroupModal"
        @copy-link="copyShowcaseLink"
        @mark-sent="handleMarkAsSent"
        @edit-guest="openEditGuestModal"
        @delete-guest="openDeleteGuestModal"
        @next-page="nextGroupPage"
        @previous-page="previousGroupPage"
        @search="handleGroupSearch"
        @next-all-page="nextAllGuestsPage"
        @previous-all-page="previousAllGuestsPage"
        @search-all="setAllGuestsSearchTerm"
        @bulk-mark-sent="handleBulkMarkSent"
        @bulk-delete="handleBulkDelete"
        @register-group-card="(groupId, el) => groupCardRefs.set(groupId, el)"
      />

      <!-- Guest Groups Management View (new) -->
      <GuestGroupsManagementView
        v-if="activeSubTab === 'groups'"
        ref="guestGroupsManagementViewRef"
        :groups="groups"
        :loading-groups="loadingGroups"
        @create-group="handleCreateGroupFromManagement"
        @update-group="handleUpdateGroupFromManagement"
        @delete-group="handleDeleteGroupFromManagement"
        @reload-groups="loadGroups"
      />

      <!-- Statistics View -->
      <GuestStatisticsView
        v-if="activeSubTab === 'statistics'"
        :guest-stats="guestStats"
        :loading-stats="loadingStats"
        :event-id="props.eventId"
        :groups="groups"
      />
    </div>

    <!-- Delete Guest Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      title="Delete Guest"
      :item-name="(deleteTargetGuest && deleteTargetGuest.name) || ''"
      :loading="deletingGuest"
      @confirm="confirmDeleteGuest"
      @cancel="cancelDeleteGuest"
    />

    <!-- Delete Group Modal -->
    <DeleteConfirmModal
      :show="showDeleteGroupModal"
      title="Delete Group"
      :item-name="(deleteTargetGroup && deleteTargetGroup.name) || ''"
      :loading="deletingGroup"
      :warning-message="`This will delete all ${deleteTargetGroup?.guest_count || 0} guests in this group!`"
      @confirm="confirmDeleteGroup"
      @cancel="cancelDeleteGroup"
    />

    <!-- Create Group Modal -->
    <CreateGroupModal
      :show="showCreateGroupModal"
      :is-creating="isCreatingGroup"
      @close="showCreateGroupModal = false"
      @create="handleCreateGroup"
    />

    <!-- Add Guest Modal -->
    <AddGuestModal
      :show="showAddGuestModal"
      :groups="groups"
      :is-adding="isAddingGuest"
      :is-importing="isImporting"
      :selected-file="selectedFile"
      :is-dragging="isDragging"
      @close="handleCloseAddGuestModal"
      @add-guest="handleAddGuest"
      @import="handleBulkImport"
      @download-template="downloadTemplate"
      @file-select="handleFileSelect"
      @file-drop="handleFileDrop"
      @drag-over="handleDragOver"
      @drag-leave="handleDragLeave"
    />

    <!-- Edit Guest Modal -->
    <EditGuestModal
      ref="editGuestModalRef"
      :show="showEditGuestModal"
      :guest="editTargetGuest"
      :groups="groups"
      :is-updating="isUpdatingGuest"
      @close="handleCloseEditGuestModal"
      @update-guest="handleUpdateGuest"
    />

    <!-- Edit Group Modal -->
    <EditGroupModal
      ref="editGroupModalRef"
      :show="showEditGroupModal"
      :group="editTargetGroup"
      :is-updating="isUpdatingGroup"
      @close="handleCloseEditGroupModal"
      @update-group="handleUpdateGroup"
    />

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 left-4 sm:left-auto z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center text-sm sm:text-base"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <AlertCircle v-else class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <span class="flex-1">{{ message.text }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  CheckCircle,
  Users,
  Lock,
  CreditCard,
  Mail,
  UserPlus,
  AlertCircle,
  BarChart3,
} from 'lucide-vue-next'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import { useGuestGroups } from '../composables/invitation/useGuestGroups'
import { useGuests } from '../composables/invitation/useGuests'
import { useBulkImport } from '../composables/invitation/useBulkImport'
import type { Event, EventGuest, GuestGroup } from '../services/api'
import { guestService } from '../services/api'
import { getGuestSSRMetaUrl } from '../utils/metaUtils'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import CreateGroupModal from './invitation/CreateGroupModal.vue'
import AddGuestModal from './invitation/AddGuestModal.vue'
import EditGuestModal from './invitation/EditGuestModal.vue'
import EditGroupModal from './invitation/EditGroupModal.vue'
import GuestGroupsView from './invitation/GuestGroupsView.vue'
import GuestGroupsManagementView from './invitation/GuestGroupsManagementView.vue'
import GuestStatisticsView from './invitation/GuestStatisticsView.vue'

// Props
const props = defineProps<{
  eventId: string
  event: Event
  canEdit: boolean
}>()

// Emits
const emit = defineEmits<{
  'tab-change': [tab: string]
}>()

// Use composables
const { isTemplateActivated, loadPayments, loadingPayments } = usePaymentTemplateIntegration(props.event)

// Initialize guest groups composable first
const {
  groups,
  loadingGroups,
  loadGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  toggleGroupExpansion,
  isGroupExpanded,
  incrementGroupGuestCount,
  decrementGroupGuestCount,
} = useGuestGroups(props.eventId)

// Create callback functions to connect composables reactively
/**
 * Handles changes to a group's guest count without making API calls.
 * This provides immediate UI feedback when guests are added/removed.
 */
const handleGroupCountChange = (groupId: number, delta: number) => {
  incrementGroupGuestCount(groupId, delta)
}

/**
 * Process items in batches to avoid overwhelming the server with too many concurrent requests.
 * Makes parallel requests within each batch, then processes batches sequentially.
 *
 * @param items - Items to process
 * @param processor - Async function to process each item
 * @param batchSize - Number of items to process concurrently per batch (default: 20)
 * @returns Array of results from Promise.allSettled for all items
 *
 * @example
 * const results = await processBatch(
 *   guestIds,
 *   id => guestService.markInvitationSent(eventId, id),
 *   20
 * )
 */
const processBatch = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 20
): Promise<Array<PromiseSettledResult<R>>> => {
  const allResults: Array<PromiseSettledResult<R>> = []

  // Split items into batches and process each batch
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const promises = batch.map(processor)
    const results = await Promise.allSettled(promises)
    allResults.push(...results)
  }

  return allResults
}

/**
 * Handles changes to overall guest statistics without making API calls.
 * This provides immediate UI feedback when guests are added/removed/updated.
 */
const handleStatsChange = (delta: number, statusChange?: { from?: string; to?: string }) => {
  const stats = guestStats.value
  if (!stats) return

  // Update total count
  stats.total_guests += delta

  // Handle status changes
  if (statusChange) {
    const { from, to } = statusChange

    // Handle deletions (to is undefined)
    if (from && !to) {
      if (from === 'not_sent') {
        stats.not_sent = Math.max(0, stats.not_sent - 1)
      } else if (from === 'sent') {
        stats.sent = Math.max(0, stats.sent - 1)
      } else if (from === 'viewed') {
        stats.viewed = Math.max(0, stats.viewed - 1)
      }
    }
    // Handle status transitions (existing code)
    else if (from && to) {
      if (from === 'not_sent' && to === 'sent') {
        stats.not_sent = Math.max(0, stats.not_sent - 1)
        stats.sent += 1
      } else if (from === 'sent' && to === 'viewed') {
        stats.sent = Math.max(0, stats.sent - 1)
        stats.viewed += 1
      }
    }
  } else if (delta > 0) {
    // New guest additions (no status change info)
    stats.not_sent += delta
  }
}

// Initialize guests composable with callbacks
const {
  guestStats,
  loadingStats,
  groupPagination,
  PAGE_SIZE,
  getGroupPagination,
  getGroupTotalPages,
  getGroupGuests,
  isGroupLoading,
  loadGuestsForGroup,
  loadGuestStats,
  createGuest,
  updateGuest,
  deleteGuest,
  markGuestAsSent,
  nextGroupPage,
  previousGroupPage,
  setGroupSearchTerm,
  // All Groups pagination
  loadAllGuests,
  getAllGuestsPagination,
  isAllGuestsLoading,
  nextAllGuestsPage,
  previousAllGuestsPage,
  setAllGuestsSearchTerm,
} = useGuests(props.eventId, handleGroupCountChange, handleStatsChange)

// Initialize bulk import composable with callbacks
const {
  selectedFile,
  isDragging,
  isImporting,
  handleFileSelect,
  handleFileDrop,
  handleDragOver,
  handleDragLeave,
  importGuests,
  downloadTemplate,
  resetImportState,
} = useBulkImport(props.eventId, handleGroupCountChange, handleStatsChange)

// Local state
const activeSubTab = ref('guests')
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const showAddGuestModal = ref(false)
const showCreateGroupModal = ref(false)
const isAddingGuest = ref(false)
const isCreatingGroup = ref(false)
const groupCardRefs = new Map<number, any>()

// Sub-tabs configuration
const subTabs = [
  { id: 'guests', label: 'Guests', icon: UserPlus },
  { id: 'groups', label: 'Guest Groups', icon: Users },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
]

// Edit guest modal state
const showEditGuestModal = ref(false)
const editTargetGuest = ref<EventGuest | null>(null)
const isUpdatingGuest = ref(false)
const editGuestModalRef = ref<InstanceType<typeof EditGuestModal> | null>(null)

// Guest Groups Management View ref
const guestGroupsManagementViewRef = ref<InstanceType<typeof GuestGroupsManagementView> | null>(null)

// Edit group modal state
const showEditGroupModal = ref(false)
const editTargetGroup = ref<GuestGroup | null>(null)
const isUpdatingGroup = ref(false)
const editGroupModalRef = ref<InstanceType<typeof EditGroupModal> | null>(null)

// Delete modal state
const showDeleteModal = ref(false)
const deletingGuest = ref(false)
const deleteTargetGuest = ref<EventGuest | null>(null)
const showDeleteGroupModal = ref(false)
const deleteTargetGroup = ref<GuestGroup | null>(null)
const deletingGroup = ref(false)

// Computed properties
const hasTemplatePayment = computed(() => {
  if (!props.event?.event_template) return false
  return isTemplateActivated.value
})


// Methods
const redirectToPaymentTab = () => {
  emit('tab-change', 'payment')
}

const redirectToTemplateTab = () => {
  emit('tab-change', 'template')
}

const handleGroupToggle = async (groupId: number) => {
  const wasExpanded = toggleGroupExpansion(groupId)
  // If the group was just expanded and has no guests loaded yet, load them
  if (wasExpanded && getGroupGuests(groupId).length === 0) {
    await loadGuestsForGroup(groupId, 1)
  }
}

const handleGroupSearch = (groupId: number, searchTerm: string) => {
  setGroupSearchTerm(groupId, searchTerm)
}

const handleCreateGroup = async (data: { name: string; description?: string; color: string }) => {
  isCreatingGroup.value = true

  const response = await createGroup({
    name: data.name,
    description: data.description,
    color: data.color,
    order: groups.value.length + 1,
  })

  if (response.success && response.data) {
    showMessage('success', `Group "${response.data.name}" created`)
    showCreateGroupModal.value = false
  } else {
    showMessage('error', response.message || 'Failed to create group')
  }

  isCreatingGroup.value = false
}

const handleAddGuest = async (name: string, groupId: number) => {
  isAddingGuest.value = true

  const response = await createGuest(name, groupId)

  if (response.success && response.data) {
    showMessage('success', `${response.data.name} added to guest list`)
    showAddGuestModal.value = false
    // Counts are now updated reactively via callbacks - no need for loadGuestStats() or loadGroups()
  } else {
    showMessage('error', response.message || 'Failed to add guest')
  }

  isAddingGuest.value = false
}

const handleBulkImport = async (groupId: number) => {
  const response = await importGuests(groupId)

  if (response.success && response.data) {
    const { created, skipped, skipped_guests } = response.data

    // Counts are now updated reactively via callbacks in useBulkImport
    // Just refresh the specific group's guest list to show the new guests
    const pagination = getGroupPagination(groupId)
    await loadGuestsForGroup(groupId, pagination.currentPage)

    // Also refresh "All Guests" view only if it has been loaded before
    const allGuestsPagination = getAllGuestsPagination()
    if (allGuestsPagination.hasLoaded) {
      await loadAllGuests(allGuestsPagination.currentPage, true)
    }

    // Show results
    if (skipped > 0) {
      showMessage(
        'success',
        `Imported ${created} guests. ${skipped} skipped: ${skipped_guests.map((g) => g.name).join(', ')}`,
      )
    } else {
      showMessage('success', `Successfully imported ${created} guests`)
    }

    showAddGuestModal.value = false
  } else {
    showMessage('error', response.message || 'Failed to import guests')
  }
}

const handleCloseAddGuestModal = () => {
  showAddGuestModal.value = false
  resetImportState()
}

const openEditGroupModal = (group: GuestGroup) => {
  editTargetGroup.value = group
  showEditGroupModal.value = true
}

const handleCloseEditGroupModal = () => {
  showEditGroupModal.value = false
  editTargetGroup.value = null
}

const handleUpdateGroup = async (groupId: number, data: any) => {
  if (!editTargetGroup.value) return

  isUpdatingGroup.value = true

  const response = await updateGroup(groupId, data)

  if (response.success && response.data) {
    showMessage('success', `Group "${response.data.name}" updated successfully`)
    showEditGroupModal.value = false
    editTargetGroup.value = null
    await loadGroups()
  } else {
    // Handle validation errors
    if (response.errors && typeof response.errors === 'object') {
      const hasFieldErrors = Object.keys(response.errors).some(key =>
        Array.isArray(response.errors![key])
      )

      if (hasFieldErrors && editGroupModalRef.value) {
        editGroupModalRef.value.setFieldErrors(response.errors as Record<string, string[]>)
      } else if (editGroupModalRef.value) {
        editGroupModalRef.value.setErrorMessage(response.message || 'Failed to update group')
      }
    } else if (editGroupModalRef.value) {
      editGroupModalRef.value.setErrorMessage(response.message || 'Failed to update group')
    }
    showMessage('error', response.message || 'Failed to update group')
  }

  isUpdatingGroup.value = false
}

const openDeleteGroupModal = (group: GuestGroup) => {
  deleteTargetGroup.value = group
  showDeleteGroupModal.value = true
}

const confirmDeleteGroup = async () => {
  if (!deleteTargetGroup.value) return

  deletingGroup.value = true
  const groupName = deleteTargetGroup.value.name
  const guestCount = deleteTargetGroup.value.guest_count

  const response = await deleteGroup(deleteTargetGroup.value.id)

  if (response.success) {
    showMessage('success', `Group "${groupName}" and ${guestCount} guest(s) deleted`)

    // Update stats reactively using callback
    if (guestCount > 0) {
      handleStatsChange(-guestCount)
    }
  } else {
    showMessage('error', response.message || 'Failed to delete group')
  }

  deletingGroup.value = false
  showDeleteGroupModal.value = false
  deleteTargetGroup.value = null
}

const cancelDeleteGroup = () => {
  if (deletingGroup.value) return
  showDeleteGroupModal.value = false
  deleteTargetGroup.value = null
}

const openDeleteGuestModal = (guest: EventGuest) => {
  deleteTargetGuest.value = guest
  showDeleteModal.value = true
}

const confirmDeleteGuest = async () => {
  if (!deleteTargetGuest.value) return
  const groupId = deleteTargetGuest.value.group

  deletingGuest.value = true

  const response = await deleteGuest(deleteTargetGuest.value.id, groupId)

  if (response.success) {
    showMessage('success', deleteTargetGuest.value.name + ' removed from guest list')
    // Counts are now updated reactively via callbacks - no need for loadGuestStats() or loadGroups()
  } else {
    showMessage('error', response.message || 'Failed to remove guest')
  }

  deletingGuest.value = false
  showDeleteModal.value = false
  deleteTargetGuest.value = null
}

const cancelDeleteGuest = () => {
  if (deletingGuest.value) return
  showDeleteModal.value = false
  deleteTargetGuest.value = null
}

const handleMarkAsSent = async (guest: EventGuest) => {
  const response = await markGuestAsSent(guest.id, guest.group)

  if (response.success) {
    showMessage('success', `${guest.name} marked as sent`)
  } else {
    showMessage('error', response.message || 'Failed to mark guest as sent')
  }
}

const openEditGuestModal = (guest: EventGuest) => {
  editTargetGuest.value = guest
  showEditGuestModal.value = true
}

const handleCloseEditGuestModal = () => {
  showEditGuestModal.value = false
  editTargetGuest.value = null
}

const handleUpdateGuest = async (guestId: number, data: any) => {
  if (!editTargetGuest.value) {
    return
  }

  const originalGroupId = editTargetGuest.value.group
  isUpdatingGuest.value = true

  const response = await updateGuest(guestId, originalGroupId, data)

  if (response.success && response.data) {
    showMessage('success', `${response.data.name} updated successfully`)
    showEditGuestModal.value = false
    editTargetGuest.value = null

    // Counts are now updated reactively via callbacks when group changes
    // No need for loadGuestStats() or loadGroups()
  } else {
    // Handle validation errors
    if (response.errors && typeof response.errors === 'object') {
      // Check if errors is in the field-specific format
      const hasFieldErrors = Object.keys(response.errors).some(key =>
        Array.isArray(response.errors![key])
      )

      if (hasFieldErrors && editGuestModalRef.value) {
        editGuestModalRef.value.setFieldErrors(response.errors as Record<string, string[]>)
      } else if (editGuestModalRef.value) {
        editGuestModalRef.value.setErrorMessage(response.message || 'Failed to update guest')
      }
    } else if (editGuestModalRef.value) {
      editGuestModalRef.value.setErrorMessage(response.message || 'Failed to update guest')
    }
    showMessage('error', response.message || 'Failed to update guest')
  }

  isUpdatingGuest.value = false
}

const getGuestShowcaseUrl = (guest: EventGuest, language: 'en' | 'kh' = 'kh') => {
  return getGuestSSRMetaUrl(props.eventId, guest.name, language)
}

const getDirectGuestShowcaseUrl = (guest: EventGuest, language: 'en' | 'kh' = 'kh') => {
  const showcaseUrl = `/events/${props.eventId}/showcase?guest_name=${encodeURIComponent(guest.name)}&lang=${language}`
  return `${window.location.origin}${showcaseUrl}`
}

const copyShowcaseLink = (guest: EventGuest, language: 'en' | 'kh') => {
  const fullUrl = getGuestShowcaseUrl(guest, language)
  navigator.clipboard
    .writeText(fullUrl)
    .then(() => {
      showMessage('success', `Showcase link (${language.toUpperCase()}) copied for ${guest.name}`)
    })
    .catch(() => {
      showMessage('error', 'Failed to copy link')
    })
}

const handleBulkMarkSent = async (groupId: number, selectedIds: number[]) => {
  if (selectedIds.length === 0) {
    showMessage('error', 'No guests selected')
    return
  }

  // Use bulk endpoint - single API call for all guests
  const response = await guestService.bulkMarkInvitationSent(props.eventId, selectedIds)

  if (response.success && response.data) {
    const count = response.data.count

    // Update stats for each successfully marked guest
    // Each guest transitions from 'not_sent' to 'sent'
    for (let i = 0; i < count; i++) {
      handleStatsChange(0, { from: 'not_sent', to: 'sent' })
    }

    showMessage('success', `Marked ${count} guest(s) as sent`)

    // Refresh lists
    const pagination = getGroupPagination(groupId)
    await loadGuestsForGroup(groupId, pagination.currentPage)

    const allGuestsPagination = getAllGuestsPagination()
    if (allGuestsPagination.hasLoaded) {
      await loadAllGuests(allGuestsPagination.currentPage, true)
    }
  } else {
    showMessage('error', response.message || 'Failed to mark guests as sent')
  }
}

const handleBulkDelete = async (groupId: number, selectedIds: number[]) => {
  if (selectedIds.length === 0) {
    showMessage('error', 'No guests selected')
    return
  }

  const confirmDelete = confirm(`Delete ${selectedIds.length} guest(s)?`)
  if (!confirmDelete) return

  // Get guest statuses BEFORE deletion for accurate stats tracking
  const pagination = getGroupPagination(groupId)
  const guestsToDelete = pagination.guests.filter(g => selectedIds.includes(g.id))

  // Count guests by status before deletion
  const statusCounts = {
    not_sent: 0,
    sent: 0,
    viewed: 0,
  }
  guestsToDelete.forEach(guest => {
    const status = guest.invitation_status || 'not_sent'
    if (status in statusCounts) {
      statusCounts[status as keyof typeof statusCounts]++
    } else {
      statusCounts.not_sent++ // fallback
    }
  })

  // Use bulk delete endpoint - single API call
  const response = await guestService.bulkDeleteGuests(props.eventId, selectedIds)

  if (response.success && response.data) {
    const count = response.data.count

    // Update group count
    handleGroupCountChange(groupId, -count)

    // Update stats based on actual guest statuses
    for (let i = 0; i < statusCounts.not_sent; i++) {
      handleStatsChange(-1, { from: 'not_sent', to: undefined })
    }
    for (let i = 0; i < statusCounts.sent; i++) {
      handleStatsChange(-1, { from: 'sent', to: undefined })
    }
    for (let i = 0; i < statusCounts.viewed; i++) {
      handleStatsChange(-1, { from: 'viewed', to: undefined })
    }

    showMessage('success', `Deleted ${count} guest(s)`)

    // Refresh lists
    const pagination = getGroupPagination(groupId)
    await loadGuestsForGroup(groupId, pagination.currentPage)

    const allGuestsPagination = getAllGuestsPagination()
    if (allGuestsPagination.hasLoaded) {
      await loadAllGuests(allGuestsPagination.currentPage, true)
    }
  } else {
    showMessage('error', response.message || 'Failed to delete guests')
  }
}

const handleCreateGroupFromManagement = async (data: { name: string; description?: string; color: string }) => {
  const response = await createGroup({
    name: data.name,
    description: data.description,
    color: data.color,
    order: groups.value.length + 1,
  })

  if (response.success && response.data) {
    showMessage('success', `Group "${response.data.name}" created`)
    await loadGroups()
  } else {
    showMessage('error', response.message || 'Failed to create group')
  }
}

const handleUpdateGroupFromManagement = async (groupId: number, data: { name: string; description?: string; color: string }) => {
  const response = await updateGroup(groupId, data)

  if (response.success && response.data) {
    showMessage('success', `Group "${response.data.name}" updated`)
    await loadGroups()
  } else {
    showMessage('error', response.message || 'Failed to update group')
  }
}

const handleDeleteGroupFromManagement = async (groupId: number) => {
  const response = await deleteGroup(groupId)

  if (response.success) {
    const group = groups.value.find(g => g.id === groupId)
    showMessage('success', `Group "${group?.name || ''}" deleted`)
    await loadGuestStats()
    await loadGroups()
  } else {
    showMessage('error', response.message || 'Failed to delete group')
  }
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Lifecycle
onMounted(() => {
  loadPayments()
})

// Watch for template payment status changes
watch(hasTemplatePayment, (isActivated) => {
  if (isActivated) {
    loadGroups()
    loadGuestStats()
  }
})

// Watch for subtab changes to refresh guest data when returning to guests tab
watch(activeSubTab, (newTab, oldTab) => {
  if (newTab === 'guests' && oldTab && oldTab !== 'guests') {
    // User returned to guests tab from another tab - reload guest data
    // This ensures pagination displays correctly after switching tabs
    const expandedGroups = Array.from(groupPagination.value.keys())
    expandedGroups.forEach(groupId => {
      const pagination = getGroupPagination(groupId)
      // Reload the current page for each expanded group
      loadGuestsForGroup(groupId, pagination.currentPage, true)
    })
  }
})

// Expose methods for parent component (Smart FAB) and sub-tab tracking
defineExpose({
  openAddGuestModal: () => {
    showAddGuestModal.value = true
  },
  openAddGroupModal: () => {
    guestGroupsManagementViewRef.value?.openAddGroupModal()
  },
  getActiveSubTab: () => activeSubTab.value,
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  overflow-x: auto;
  overflow-y: hidden;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
