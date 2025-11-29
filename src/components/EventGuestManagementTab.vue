
<template>
  <div class="space-y-6">
    <!-- Header with Sub-navigation -->

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
        ref="guestGroupsViewRef"
        :groups="groups"
        :loading-groups="loadingGroups"
        :page-size="PAGE_SIZE"
        :get-group-guests="getGroupGuests"
        :is-group-loading="isGroupLoading"
        :is-group-expanded="isGroupExpanded"
        :get-group-pagination="getGroupPagination"
        :all-guests-pagination="allGuestsPaginationValue"
        :is-all-guests-loading="isAllGuestsLoading"
        :load-all-guests="loadAllGuests"
        :guest-stats="guestStats"
        :loading-stats="loadingStats"
        @add-guest="showAddGuestModal = true"
        @toggle-group="handleGroupToggle"
        @edit-group="openEditGroupModal"
        @delete-group="openDeleteGroupModal"
        @copy-link="copyShowcaseLink"
        @mark-sent="handleMarkAsSent"
        @edit-guest="openEditGuestModal"
        @delete-guest="openDeleteGuestModal"
        @search="handleGroupSearch"
        @search-all="setAllGuestsSearchTerm"
        @load-more-all="loadMoreAllGuests"
        @load-more-group="loadMoreGroupGuests"
        @bulk-mark-sent="handleBulkMarkSent"
        @bulk-delete="handleBulkDelete"
        @register-group-card="(groupId, el) => groupCardRefs.set(groupId, el)"
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

    <!-- Bulk Delete Guests Modal -->
    <DeleteConfirmModal
      :show="showBulkDeleteModal"
      title="Delete Multiple Guests"
      :message="`Are you sure you want to delete ${bulkDeleteGuestIds.length} guest(s)?`"
      :loading="bulkDeletingGuests"
      @confirm="confirmBulkDelete"
      @cancel="cancelBulkDelete"
    />

    <!-- Create Group Modal -->
    <CreateGroupModal
      :show="showCreateGroupModal"
      :is-creating="isCreatingGroup"
      @close="handleCloseCreateGroupModal"
      @create="handleCreateGroup"
    />

    <!-- Add Guest Modal -->
    <AddGuestModal
      :show="showAddGuestModal"
      :groups="groups"
      :is-adding="isAddingGuest"
      :is-importing="isImporting"
      :is-parsing="isParsing"
      :selected-file="selectedFile"
      :is-dragging="isDragging"
      :file-preview="filePreview"
      :parse-error="parseError"
      :pending-group-id="pendingGuestGroupSelection"
      :is-creating-group="isCreatingGroup"
      @close="handleCloseAddGuestModal"
      @add-guest="handleAddGuest"
      @import="handleBulkImport"
      @download-template="downloadTemplate"
      @file-select="handleFileSelect"
      @file-drop="handleFileDrop"
      @drag-over="handleDragOver"
      @drag-leave="handleDragLeave"
      @create-group="handleCreateGroupFromAddGuest"
      @clear-preview="clearPreview"
      @group-change="handleImportGroupChange"
      @update-guest-name="handleUpdatePreviewGuestName"
      @delete-guest="handleDeletePreviewGuest"
      @edit-group="handleEditGroupFromAddGuest"
      @delete-group="handleDeleteGroupFromAddGuest"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  CheckCircle,
  Users,
  Lock,
  CreditCard,
  Mail,
  UserPlus,
  AlertCircle,
} from 'lucide-vue-next'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import { useGuestManagementStore } from '../stores/guestManagement'
import { useBulkImport } from '../composables/invitation/useBulkImport'
import type { Event, EventGuest, GuestGroup } from '../services/api'
import { getGuestSSRMetaUrl } from '../utils/metaUtils'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import CreateGroupModal from './invitation/CreateGroupModal.vue'
import AddGuestModal from './invitation/AddGuestModal.vue'
import EditGuestModal from './invitation/EditGuestModal.vue'
import EditGroupModal from './invitation/EditGroupModal.vue'
import GuestGroupsView from './invitation/GuestGroupsView.vue'

// Props
const props = defineProps<{
  eventId: string
  event: Event
  canEdit: boolean
}>()

// Emits
const emit = defineEmits<{
  'tab-change': [tab: string, action?: string]
}>()

// Use composables
const { isTemplateActivated, loadPayments, loadingPayments } = usePaymentTemplateIntegration(props.event)

// Use Pinia store for guest management (eliminates callback hell)
const store = useGuestManagementStore()

// Destructure store state and actions for template usage
const groups = computed(() => store.groups)
const loadingGroups = computed(() => store.loadingGroups)
const guestStats = computed(() => store.stats)
const loadingStats = computed(() => store.loadingStats)
const PAGE_SIZE = store.PAGE_SIZE

// Wrap allGuestsPagination in computed to maintain reactivity when passed as prop
// This ensures the child component receives reactive updates when the store's ref changes
const allGuestsPaginationValue = computed(() => store.allGuestsPagination)

// Store action wrappers that include eventId
const loadGroups = () => store.loadGroups(props.eventId)
const loadGuestStats = () => store.loadGuestStats(props.eventId)
const loadGuestsForGroup = (groupId: number, page?: number, silent?: boolean) =>
  store.loadGuestsForGroup(props.eventId, groupId, page, silent)
const loadAllGuests = (page?: number, silent?: boolean) =>
  store.loadAllGuests(props.eventId, page, silent)

// Group actions
const createGroup = (data: { name: string; description?: string; color: string; order: number }) =>
  store.createGroup(props.eventId, data)
const updateGroup = (groupId: number, data: Partial<{ name: string; description?: string; color: string }>) =>
  store.updateGroup(props.eventId, groupId, data)
const deleteGroup = (groupId: number) => store.deleteGroup(props.eventId, groupId)
const toggleGroupExpansion = (groupId: number) => store.toggleGroupExpansion(groupId)
const isGroupExpanded = (groupId: number) => store.isGroupExpanded(groupId)

// Guest actions
const createGuest = (name: string, groupId: number) => store.createGuest(props.eventId, name, groupId)
const updateGuest = (guestId: number, groupId: number, data: any) =>
  store.updateGuest(props.eventId, guestId, groupId, data)
const deleteGuest = (guestId: number, groupId: number) => store.deleteGuest(props.eventId, guestId, groupId)
const markGuestAsSent = (guestId: number, groupId: number) =>
  store.markGuestAsSent(props.eventId, guestId, groupId)

// Pagination helpers
const getGroupPagination = (groupId: number) => store.getGroupPaginationState(groupId)
const getGroupGuests = (groupId: number) => store.getGroupPaginationState(groupId).guests
const isGroupLoading = (groupId: number) => store.getGroupPaginationState(groupId).loading
const getAllGuestsPagination = () => allGuestsPaginationValue.value
const isAllGuestsLoading = () => allGuestsPaginationValue.value.loading

// Pagination actions
const setGroupSearchTerm = (groupId: number, searchTerm: string) =>
  store.setGroupSearchTerm(props.eventId, groupId, searchTerm)
const setAllGuestsSearchTerm = (searchTerm: string) => store.setAllGuestsSearchTerm(props.eventId, searchTerm)

// Infinite scroll actions
const loadMoreAllGuests = () => store.loadMoreAllGuests(props.eventId)
const loadMoreGroupGuests = (groupId: number) => store.loadMoreGroupGuests(props.eventId, groupId)

/**
 * Get existing guest names for a group (for duplicate checking during bulk import)
 * Fetches ALL guest names from the server, not just currently loaded pages
 */
const getExistingGuestNamesForGroup = async (groupId: number): Promise<string[]> => {
  return await store.getAllGuestNamesForGroup(props.eventId, groupId)
}

// Initialize bulk import composable (still used for file parsing, but no callbacks needed for state)
const {
  selectedFile,
  isDragging,
  isImporting,
  isParsing,
  filePreview,
  parseError,
  handleFileSelect,
  handleFileDrop,
  handleDragOver,
  handleDragLeave,
  importGuests,
  downloadTemplate,
  resetImportState,
  clearPreview,
  revalidatePreviewForGroup,
  updateGuestName,
  deleteGuestFromPreview,
} = useBulkImport(props.eventId, undefined, undefined, getExistingGuestNamesForGroup)

// Reset store state when component unmounts (switching events)
onUnmounted(() => {
  store.$reset()
})

// Local state
const activeSubTab = ref('guests')
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const showAddGuestModal = ref(false)
const showCreateGroupModal = ref(false)
const isAddingGuest = ref(false)
const isCreatingGroup = ref(false)
const pendingGuestGroupSelection = ref<number | null>(null)
const groupCardRefs = new Map<number, any>()

// Sub-tabs configuration
const subTabs = [
  { id: 'guests', label: 'Guest List', icon: UserPlus },
]

// Guest groups view ref for controlling selection state
const guestGroupsViewRef = ref<InstanceType<typeof GuestGroupsView> | null>(null)

// Edit guest modal state
const showEditGuestModal = ref(false)
const editTargetGuest = ref<EventGuest | null>(null)
const isUpdatingGuest = ref(false)
const editGuestModalRef = ref<InstanceType<typeof EditGuestModal> | null>(null)

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

// Bulk delete modal state
const showBulkDeleteModal = ref(false)
const bulkDeletingGuests = ref(false)
const bulkDeleteGuestIds = ref<number[]>([])
const bulkDeleteGroupId = ref<number>(0)

// Computed properties
const hasTemplatePayment = computed(() => {
  if (!props.event?.event_template) return false
  return isTemplateActivated.value
})


// Methods
const redirectToPaymentTab = async () => {
  emit('tab-change', 'template-payment', 'open-payment')
}

const redirectToTemplateTab = () => {
  emit('tab-change', 'template-payment')
}

const handleGroupToggle = async (groupId: number) => {
  toggleGroupExpansion(groupId)
  // Always load guests if none are loaded yet for this group
  // This ensures guests appear when selecting a group from the dropdown filter
  if (getGroupGuests(groupId).length === 0) {
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
    // Note: createGuest() already handles refreshing both group and all guests lists
  } else {
    showMessage('error', response.message || 'Failed to add guest')
  }

  isAddingGuest.value = false
}

const handleBulkImport = async (groupId: number) => {
  const response = await importGuests(groupId)

  if (response.success && response.data) {
    const { created, skipped, skipped_guests } = response.data

    // Reset and refresh guest lists for infinite scroll
    // Reset group pagination to page 1 and reload fresh data
    store.resetGroupPagination(groupId)
    await loadGuestsForGroup(groupId, 1, true)

    // Reset all guests pagination and reload fresh data
    store.resetAllGuestsPagination()
    await loadAllGuests(1, true)

    // Reload groups to get accurate counts from server
    await loadGroups()
    // Reload stats to sync with server
    await loadGuestStats()

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
  pendingGuestGroupSelection.value = null
}

/**
 * Handle group selection change in bulk import mode
 * Re-validates the preview against the new group's existing guests
 */
const handleImportGroupChange = async (groupId: number) => {
  // Re-validate the preview with the new group's existing guests
  // Note: revalidatePreviewForGroup now fetches ALL guests from the server,
  // so we don't need to pre-load the group's pagination
  await revalidatePreviewForGroup(groupId)
}

/**
 * Handle updating a guest name in the bulk import preview
 */
const handleUpdatePreviewGuestName = async (index: number, newName: string, groupId: number | null) => {
  await updateGuestName(index, newName, groupId ?? undefined)
}

/**
 * Handle deleting a guest from the bulk import preview
 */
const handleDeletePreviewGuest = async (index: number, groupId: number | null) => {
  await deleteGuestFromPreview(index, groupId ?? undefined)
}

const handleCreateGroupFromAddGuest = async (data: { name: string; description?: string; color: string }) => {
  isCreatingGroup.value = true

  const response = await createGroup({
    name: data.name,
    description: data.description,
    color: data.color,
    order: groups.value.length + 1,
  })

  if (response.success && response.data) {
    showMessage('success', `Group "${response.data.name}" created`)
    // The AddGuestModal watches groups.length and will auto-select the new group
  } else {
    showMessage('error', response.message || 'Failed to create group')
  }

  isCreatingGroup.value = false
}

const handleEditGroupFromAddGuest = async (group: GuestGroup) => {
  const response = await updateGroup(group.id, {
    name: group.name,
    description: group.description,
    color: group.color,
  })

  if (response.success && response.data) {
    showMessage('success', `Group "${response.data.name}" updated`)
    await loadGroups()
  } else {
    showMessage('error', response.message || 'Failed to update group')
  }
}

const handleDeleteGroupFromAddGuest = async (group: GuestGroup) => {
  const response = await deleteGroup(group.id)

  if (response.success) {
    showMessage('success', `Group "${group.name}" deleted`)
    // Store handles stats updates internally
  } else {
    showMessage('error', response.message || 'Failed to delete group')
  }
}

const handleCloseCreateGroupModal = () => {
  showCreateGroupModal.value = false
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
    // Store handles stats updates internally
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

/**
 * Copy personalized shortlink for guest invitation
 *
 * Shortlinks (/g/{code}) route through backend which:
 * - Detects social media bots and serves SSR meta tags
 * - Redirects real users to frontend showcase
 * - Tracks analytics (clicks, invitation status)
 */
const copyShowcaseLink = (guest: EventGuest, language: 'en' | 'kh') => {
  // Validate shortlink availability
  if (!guest.short_link) {
    console.warn('[copyShowcaseLink] No shortlink for guest, using fallback URL:', guest.id)
    const fallbackUrl = getGuestShowcaseUrl(guest, language)
    navigator.clipboard.writeText(fallbackUrl)
      .then(() => showMessage('success', `Showcase link (${language.toUpperCase()}) copied for ${guest.name}`))
      .catch(() => showMessage('error', 'Failed to copy link'))
    return
  }

  // Validate shortlink format
  if (!guest.short_link.startsWith('/g/')) {
    console.error('[copyShowcaseLink] Invalid shortlink format:', guest.short_link)
    showMessage('error', 'Invalid invitation link format')
    return
  }

  // Use environment-based API URL for all environments (dev, staging, production)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  const fullShortLink = `${API_BASE_URL}/api/events${guest.short_link}/?lang=${language}`

  navigator.clipboard
    .writeText(fullShortLink)
    .then(() => {
      showMessage('success', `Showcase link (${language.toUpperCase()}) copied for ${guest.name}`)
    })
    .catch((error) => {
      console.error('[copyShowcaseLink] Clipboard API failed:', error)
      showMessage('error', 'Failed to copy link. Please try again.')
    })
}

const handleBulkMarkSent = async (groupId: number, selectedIds: number[]) => {
  if (selectedIds.length === 0) {
    showMessage('error', 'No guests selected')
    return
  }

  // Use store's bulk mark sent - handles all state updates internally
  const response = await store.bulkMarkGuestsAsSent(props.eventId, selectedIds)

  if (response.success && response.data) {
    const count = response.data.count
    showMessage('success', `Marked ${count} guest(s) as sent`)

    // Clear selection after successful operation
    guestGroupsViewRef.value?.clearSelection()
  } else {
    showMessage('error', response.message || 'Failed to mark guests as sent')
    // Selection remains intact so user can retry
  }
}

const handleBulkDelete = (groupId: number, selectedIds: number[]) => {
  if (selectedIds.length === 0) {
    showMessage('error', 'No guests selected')
    return
  }

  // Store the data for confirmation
  bulkDeleteGuestIds.value = selectedIds
  bulkDeleteGroupId.value = groupId

  // Show the modal
  showBulkDeleteModal.value = true
}

const confirmBulkDelete = async () => {
  const groupId = bulkDeleteGroupId.value
  const selectedIds = bulkDeleteGuestIds.value

  // Store original selection before operation for potential rollback
  const originalSelection = [...selectedIds]

  bulkDeletingGuests.value = true

  // Use store's bulk delete - handles all state updates internally
  const response = await store.bulkDeleteGuests(props.eventId, selectedIds, groupId || undefined)

  if (response.success && response.data) {
    const count = response.data.count
    showMessage('success', `Deleted ${count} guest(s)`)

    // Clear selection after successful operation
    guestGroupsViewRef.value?.clearSelection()
  } else {
    showMessage('error', response.message || 'Failed to delete guests')

    // Restore selection on failure so user can retry
    guestGroupsViewRef.value?.restoreSelection(originalSelection)
  }

  bulkDeletingGuests.value = false
  showBulkDeleteModal.value = false
  bulkDeleteGuestIds.value = []
  bulkDeleteGroupId.value = 0
}

const cancelBulkDelete = () => {
  if (bulkDeletingGuests.value) return
  showBulkDeleteModal.value = false
  bulkDeleteGuestIds.value = []
  bulkDeleteGroupId.value = 0
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
    // Refresh all guests pagination to ensure data is current
    const allGuestsPag = allGuestsPaginationValue.value
    if (allGuestsPag.hasLoaded) {
      loadAllGuests(allGuestsPag.currentPage, true)
    }
  }
})

// Expose methods for parent component (Smart FAB) and sub-tab tracking
defineExpose({
  openAddGuestModal: () => {
    showAddGuestModal.value = true
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
