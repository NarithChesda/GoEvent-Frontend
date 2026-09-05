
<template>
  <div class="space-y-6">
    <!-- Header with Sub-navigation -->

    <!-- Loading State -->
    <div
      v-if="loadingPayments"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div class="flex items-center justify-center text-slate-600">
        <div class="w-6 h-6 sm:w-8 sm:h-8 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm">{{ t('management.guestManagementTab.checkingTemplate') }}</span>
      </div>
    </div>

    <!-- No Template Selected -->
    <div
      v-else-if="!props.event?.event_template"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <div
        class="w-24 h-24 rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 flex items-center justify-center mx-auto mb-4 sm:mb-6"
      >
        <Mail class="w-10 h-10 text-[#2ecc71]" aria-hidden="true" />
      </div>
      <h3 class="text-xl lg:text-2xl font-bold text-slate-900 mb-2">{{ t('management.guestManagementTab.noTemplate.title') }}</h3>
      <p class="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 max-w-md mx-auto">
        {{ t('management.guestManagementTab.noTemplate.description') }}
      </p>
      <button
        @click="redirectToTemplateTab"
        class="inline-flex items-center px-5 py-2.5 lg:px-6 lg:py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors duration-200"
      >
        <Mail class="w-4 h-4 mr-2" />
        {{ t('management.guestManagementTab.noTemplate.cta') }}
      </button>
    </div>

    <!-- Template Payment Check -->
    <div
      v-else-if="!hasTemplatePayment"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <div
        class="w-24 h-24 rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 flex items-center justify-center mx-auto mb-4 sm:mb-6"
      >
        <Lock class="w-10 h-10 text-[#2ecc71]" aria-hidden="true" />
      </div>
      <h3 class="text-xl lg:text-2xl font-bold text-slate-900 mb-2">{{ t('management.guestManagementTab.paymentRequired.title') }}</h3>
      <p class="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 max-w-md mx-auto">
        {{ t('management.guestManagementTab.paymentRequired.description', { name: props.event.event_template_details?.name || '' }) }}
      </p>
      <button
        @click="redirectToPaymentTab"
        class="inline-flex items-center px-5 py-2.5 lg:px-6 lg:py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors duration-200"
      >
        <CreditCard class="w-4 h-4 mr-2" />
        {{ t('management.guestManagementTab.paymentRequired.cta') }}
      </button>
    </div>

    <!-- Content Area -->
    <div v-else class="min-h-[25rem]">
      <!-- One header row for the whole tab: the title, the view choice, and
           sharing.

           This screen used to name itself three times over — an underlined tab
           reading "Guest List", then a `Guest Management` heading under it,
           then a sentence explaining what a guest list is. The tab bar and the
           heading were the same label in two type sizes, so the title is said
           once here and neither child view carries one any more.

           The view choice is a segmented control, not underlined tabs: two
           named alternatives is exactly what §6 of the design standard hands
           to a segmented control, and a recessed track with one raised cap
           shows both options as one object rather than as two links that
           happen to sit side by side.

           Sharing rides on this row rather than inside the guest panel: it is a
           fact about who may reach the whole list, not one more thing you can
           do to it. Only on the guest list — a share link does not carry
           seating. -->
      <div class="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <h2 class="text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl">
          {{ t('management.guestManagementTab.title') }}
        </h2>

        <div class="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <SegmentedField
            v-model="activeSubTab"
            :options="subTabs"
            class="min-w-0 flex-1 sm:flex-none"
            :aria-label="t('management.guestManagementTab.title')"
          />

          <button
            v-if="props.canEdit && activeSubTab === 'guests'"
            @click="openShareModal"
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center gap-1.5 rounded-xl text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:w-auto lg:px-3"
            :title="t('management.shareGuestList.openCta')"
            :aria-label="t('management.shareGuestList.openCta')"
          >
            <Link2 class="h-4 w-4" />
            <span class="hidden lg:inline">{{ t('management.shareGuestList.openCta') }}</span>
          </button>
        </div>
      </div>

      <!-- Guests View (renamed from Guest Groups View) -->
      <GuestGroupsView
        v-if="activeSubTab === 'guests'"
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
        :rsvp-summary="rsvpSummary"
        :event-id="props.eventId"
        @add-guest="showAddGuestModal = true"
        @toggle-group="handleGroupToggle"
        @copy-link="copyShowcaseLink"
        @mark-sent="handleMarkAsSent"
        @edit-guest="openEditGuestModal"
        @delete-guest="openDeleteGuestModal"
        @update-guest-group="handleInlineUpdateGuestGroup"
        @quick-add-guest="handleQuickAddGuest"
        @inline-create-group="handleInlineCreateGroup"
        @inline-update-group="handleInlineUpdateGroup"
        @inline-delete-group="handleInlineDeleteGroup"
        @search="handleGroupSearch"
        @search-all="setAllGuestsSearchTerm"
        @load-more-all="loadMoreAllGuests"
        @load-more-group="loadMoreGroupGuests"
        @bulk-mark-sent="handleBulkMarkSent"
        @bulk-delete="handleBulkDelete"
        @register-group-card="(groupId, el) => groupCardRefs.set(groupId, el)"
      />

      <!-- Table Seating View -->
      <SeatingTablesView
        v-else-if="activeSubTab === 'tables'"
        :event-id="props.eventId"
        :can-edit="props.canEdit"
        @message="showMessage"
      />
    </div>

    <!-- Delete Guest Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :title="t('management.guestManagementTab.deleteGuestTitle')"
      :item-name="(deleteTargetGuest && deleteTargetGuest.name) || ''"
      :loading="deletingGuest"
      @confirm="confirmDeleteGuest"
      @cancel="cancelDeleteGuest"
    />

    <!-- Bulk Delete Guests Modal -->
    <DeleteConfirmModal
      :show="showBulkDeleteModal"
      :title="t('management.guestManagementTab.bulkDeleteTitle')"
      :message="t('management.guestManagementTab.bulkDeleteMessage', { count: bulkDeleteGuestIds.length })"
      :loading="bulkDeletingGuests"
      @confirm="confirmBulkDelete"
      @cancel="cancelBulkDelete"
    />

    <!-- Add Guest Modal (bulk import only — single adds happen inline via the quick-add row) -->
    <AddGuestModal
      :show="showAddGuestModal"
      :groups="groups"
      :is-importing="isImporting"
      :is-parsing="isParsing"
      :selected-file="selectedFile"
      :is-dragging="isDragging"
      :file-preview="filePreview"
      :parse-error="parseError"
      :pending-group-id="pendingGuestGroupSelection"
      :is-creating-group="isCreatingGroup"
      @close="handleCloseAddGuestModal"
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

    <!-- Share Guest List -->
    <ShareGuestListModal
      :show="showShareModal"
      :shares="shares"
      :loading="loadingShares"
      :creating="creatingShare"
      :busy-share-id="busyShareId"
      :error-message="shareErrorMessage"
      @close="showShareModal = false"
      @create="handleCreateShare"
      @revoke="handleRevokeShare"
      @delete="handleDeleteShare"
      @copy-failed="showMessage('error', t('management.shareGuestList.toast.copyFailed'))"
    />

    <!-- Edit Guest Modal -->
    <EditGuestModal
      ref="editGuestModalRef"
      :show="showEditGuestModal"
      :guest="editTargetGuest"
      :groups="groups"
      :is-updating="isUpdatingGuest"
      :is-loading-answers="isLoadingEditTargetDetail"
      @close="handleCloseEditGuestModal"
      @update-guest="handleUpdateGuest"
      @mark-sent="handleMarkAsSent"
      @delete="handleDeleteFromEditModal"
      @copy-link="copyShowcaseLink"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Lock,
  CreditCard,
  Mail,
  UserPlus,
  Armchair,
  Link2,
} from 'lucide-vue-next'
import { useNotifications } from '@/composables/useNotifications'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import { useGuestManagementStore } from '../stores/guestManagement'
import { useBulkImport } from '../composables/invitation/useBulkImport'
import type {
  Event,
  EventGuest,
  GuestGroup,
  GuestRsvpSummary,
} from '../services/api'
import { guestService } from '../services/api'
import { getGuestSSRMetaUrl } from '../utils/metaUtils'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import AddGuestModal from './invitation/AddGuestModal.vue'
import EditGuestModal from './invitation/EditGuestModal.vue'
import GuestGroupsView from './invitation/GuestGroupsView.vue'
import SeatingTablesView from './invitation/SeatingTablesView.vue'
import SegmentedField, { type SegmentedOption } from './common/SegmentedField.vue'
import ShareGuestListModal from './invitation/ShareGuestListModal.vue'
import {
  useGuestListShares,
  resolveExpiry,
  type ShareExpiryPreset,
} from '../composables/invitation/useGuestListShares'
import type { GuestListShare, GuestShareAccess } from '../services/api'

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

const { t } = useI18n()

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

// RSVP summary — only feeds the per-status counts in the guest filter
// dropdown now; the RSVP stats themselves live in the Analytics tab.
const rsvpSummary = ref<GuestRsvpSummary | null>(null)

const loadRsvpSummary = async () => {
  const response = await guestService.getGuestsRsvpSummary(props.eventId)
  if (response.success && response.data) {
    rsvpSummary.value = response.data
  }
}

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
const { success: notifySuccess, error: notifyError } = useNotifications()
const showAddGuestModal = ref(false)
const isCreatingGroup = ref(false)
const pendingGuestGroupSelection = ref<number | null>(null)
const groupCardRefs = new Map<number, any>()

// Sub-tabs configuration — shaped for SegmentedField, which keys on `value`.
const subTabs = computed<SegmentedOption[]>(() => [
  { value: 'guests', label: t('management.seatingView.tabs.guestList'), icon: UserPlus },
  { value: 'tables', label: t('management.seatingView.tabs.tableSeating'), icon: Armchair },
])

// Guest groups view ref for controlling selection state
const guestGroupsViewRef = ref<InstanceType<typeof GuestGroupsView> | null>(null)

// Edit guest modal state
const showEditGuestModal = ref(false)
const editTargetGuest = ref<EventGuest | null>(null)
const isUpdatingGuest = ref(false)
const isLoadingEditTargetDetail = ref(false)
const editGuestModalRef = ref<InstanceType<typeof EditGuestModal> | null>(null)

// Delete modal state
const showDeleteModal = ref(false)
const deletingGuest = ref(false)
const deleteTargetGuest = ref<EventGuest | null>(null)

// ---------------------------------------------------------------------------
// Share links
// ---------------------------------------------------------------------------
// Loaded lazily on first open rather than with the tab: most sessions here are
// about the guest list itself and never touch sharing, and this is a request
// that would otherwise be paid on every visit.
const showShareModal = ref(false)
const {
  shares,
  loading: loadingShares,
  creating: creatingShare,
  busyShareId,
  errorMessage: shareErrorMessage,
  hasLoaded: hasLoadedShares,
  loadShares,
  createShare,
  revokeShare,
  deleteShare,
} = useGuestListShares(props.eventId)

const openShareModal = () => {
  showShareModal.value = true
  if (!hasLoadedShares.value) loadShares()
}

const handleCreateShare = async (
  access: GuestShareAccess,
  label: string,
  expiry: ShareExpiryPreset,
) => {
  const response = await createShare({
    access,
    label: label || undefined,
    expires_at: resolveExpiry(expiry),
  })

  if (response.success && response.data) {
    // The link is minted to be sent, so it goes to the clipboard in the same
    // gesture. The row it lands in stays copyable, so a clipboard failure here
    // is worth a sentence and not a rollback.
    try {
      await navigator.clipboard.writeText(response.data.url)
      showMessage('success', t('management.shareGuestList.toast.createdAndCopied'))
    } catch {
      showMessage('success', t('management.shareGuestList.toast.created'))
    }
  } else {
    showMessage('error', response.message || t('management.shareGuestList.toast.createFailed'))
  }
}

const handleRevokeShare = async (share: GuestListShare) => {
  const response = await revokeShare(share.id)
  if (response.success) {
    showMessage('success', t('management.shareGuestList.toast.revoked'))
  } else {
    showMessage('error', response.message || t('management.shareGuestList.toast.revokeFailed'))
  }
}

const handleDeleteShare = async (share: GuestListShare) => {
  const response = await deleteShare(share.id)
  if (!response.success) {
    showMessage('error', response.message || t('management.shareGuestList.toast.deleteFailed'))
  }
}

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

// Inline group management (filter-dropdown create/edit/delete in GuestGroupsView)
const handleInlineCreateGroup = async (data: { name: string; description?: string; color: string }) => {
  const response = await createGroup({
    name: data.name,
    description: data.description,
    color: data.color,
    order: groups.value.length + 1,
  })

  if (response.success && response.data) {
    showMessage('success', t('management.guestManagementTab.toast.groupCreated', { name: response.data.name }))
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.groupCreateFailed'))
  }
}

const handleInlineUpdateGroup = async (groupId: number, data: { name: string; description?: string; color: string }) => {
  const response = await updateGroup(groupId, data)

  if (response.success && response.data) {
    showMessage('success', t('management.guestManagementTab.toast.groupUpdated', { name: response.data.name }))
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.groupUpdateFailed'))
  }
}

const handleInlineDeleteGroup = async (groupId: number) => {
  const groupName = groups.value.find((g) => g.id === groupId)?.name ?? ''
  const response = await deleteGroup(groupId)

  if (response.success) {
    showMessage(
      'success',
      groupName
        ? t('management.guestManagementTab.toast.groupDeleted', { name: groupName })
        : t('management.guestManagementTab.toast.groupDeletedGeneric'),
    )
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.groupDeleteFailed'))
  }
}

// Inline guest edits (name / group reassignment directly in the row)
const handleInlineUpdateGuestGroup = async (guest: EventGuest, groupId: number) => {
  if (groupId === guest.group) return

  const response = await updateGuest(guest.id, guest.group, { group: groupId })

  if (response.success && response.data) {
    showMessage('success', t('management.guestManagementTab.toast.guestMoved', { name: response.data.group_details?.name ?? '' }))
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.guestMoveFailed'))
  }
}

// Quick-add row (fast single-guest capture without opening the Add Guest drawer)
//
// No success toast: the store unshifts the guest optimistically, so the row
// lands at the top of the list — directly under the quick-add row that was just
// typed into — before the request even returns. A bar announcing what is
// already on screen, one line below where the user is looking, is the same news
// twice. The failure path keeps its toast: a rollback removes the row again,
// and nothing left on screen would explain why.
const handleQuickAddGuest = async (name: string, groupId: number) => {
  const response = await createGuest(name, groupId)

  if (!response.success) {
    showMessage('error', response.message || t('management.guestManagementTab.toast.guestAddFailed'))
  }
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
        t('management.guestManagementTab.toast.importedWithSkipped', {
          created,
          skipped,
          names: skipped_guests.map((g) => g.name).join(', '),
        }),
      )
    } else {
      showMessage('success', t('management.guestManagementTab.toast.imported', { count: created }))
    }

    showAddGuestModal.value = false
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.importFailed'))
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
    showMessage('success', t('management.guestManagementTab.toast.groupCreated', { name: response.data.name }))
    // The AddGuestModal watches groups.length and will auto-select the new group
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.groupCreateFailed'))
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
    showMessage('success', t('management.guestManagementTab.toast.groupUpdated', { name: response.data.name }))
    await loadGroups()
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.groupUpdateFailed'))
  }
}

const handleDeleteGroupFromAddGuest = async (group: GuestGroup) => {
  const response = await deleteGroup(group.id)

  if (response.success) {
    showMessage('success', t('management.guestManagementTab.toast.groupDeleted', { name: group.name }))
    // Store handles stats updates internally
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.groupDeleteFailed'))
  }
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
    showMessage('success', t('management.guestManagementTab.toast.guestRemoved', { name: deleteTargetGuest.value.name }))
    // Counts are now updated reactively via callbacks - no need for loadGuestStats() or loadGroups()
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.guestRemoveFailed'))
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
    showMessage('success', t('management.guestManagementTab.toast.markedSent', { name: guest.name }))
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.markSentFailed'))
  }
}

const openEditGuestModal = async (guest: EventGuest) => {
  // Open the modal immediately with the lightweight list data so the user
  // doesn't see any click-to-open delay. The detail fetch runs in the
  // background and merges `rsvp_answers` in when it lands.
  editTargetGuest.value = guest
  showEditGuestModal.value = true

  if ((guest.rsvp_answered_count ?? 0) === 0) {
    // Nothing to fetch — the guest hasn't answered any questions.
    return
  }

  isLoadingEditTargetDetail.value = true
  try {
    const response = await guestService.getGuest(props.eventId, guest.id)
    // Guard against race: user might have closed the modal or opened a
    // different guest before this fetch resolved.
    if (
      response.success &&
      response.data &&
      showEditGuestModal.value &&
      editTargetGuest.value?.id === guest.id
    ) {
      editTargetGuest.value = response.data
    }
  } finally {
    isLoadingEditTargetDetail.value = false
  }
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
    showMessage('success', t('management.guestManagementTab.toast.guestUpdated', { name: response.data.name }))
    showEditGuestModal.value = false
    editTargetGuest.value = null

    // Counts are now updated reactively via callbacks when group changes
    // No need for loadGuestStats() or loadGroups()
    // Refresh RSVP summary in case the host overrode the response state.
    loadRsvpSummary()
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
        editGuestModalRef.value.setErrorMessage(response.message || t('management.guestManagementTab.toast.guestUpdateFailed'))
      }
    } else if (editGuestModalRef.value) {
      editGuestModalRef.value.setErrorMessage(response.message || t('management.guestManagementTab.toast.guestUpdateFailed'))
    }
    showMessage('error', response.message || t('management.guestManagementTab.toast.guestUpdateFailed'))
  }

  isUpdatingGuest.value = false
}

const handleDeleteFromEditModal = (guest: EventGuest) => {
  // Close the edit modal first
  showEditGuestModal.value = false
  // Then open the delete confirmation modal
  openDeleteGuestModal(guest)
}

const getGuestShowcaseUrl = (guest: EventGuest, language: 'en' | 'kh' = 'kh') => {
  return getGuestSSRMetaUrl(props.eventId, guest.name, language)
}

/**
 * Copy personalized shortlink for guest invitation
 *
 * Shortlinks (https://goevent.online/g/{code}) route through backend which:
 * - Detects social media bots and serves SSR meta tags
 * - Redirects real users to frontend showcase
 * - Tracks analytics (clicks, invitation status)
 *
 * `silent` comes from the guest row, whose copy control confirms in place —
 * a toast on top of that says the same thing twice, and copying a link is the
 * most repeated action on this screen. Failures always toast: an in-place tick
 * has no way to report one.
 */
const copyShowcaseLink = (guest: EventGuest, language: 'en' | 'kh', silent = false) => {
  const announceCopied = () => {
    if (silent) return
    showMessage('success', t('management.guestManagementTab.toast.linkCopied', { lang: language.toUpperCase(), name: guest.name }))
  }

  // Validate short_url availability
  if (!guest.short_url) {
    console.warn('[copyShowcaseLink] No short_url for guest, using fallback URL:', guest.id)
    const fallbackUrl = getGuestShowcaseUrl(guest, language)
    navigator.clipboard.writeText(fallbackUrl)
      .then(announceCopied)
      .catch(() => showMessage('error', t('management.guestManagementTab.toast.linkCopyFailed')))
    return
  }

  // Add language parameter to the short_url
  const fullShortLink = `${guest.short_url}?lang=${language}`

  navigator.clipboard
    .writeText(fullShortLink)
    .then(announceCopied)
    .catch((error) => {
      console.error('[copyShowcaseLink] Clipboard API failed:', error)
      showMessage('error', t('management.guestManagementTab.toast.linkCopyFailed'))
    })
}

const handleBulkMarkSent = async (groupId: number, selectedIds: number[]) => {
  if (selectedIds.length === 0) {
    showMessage('error', t('management.guestManagementTab.toast.noGuestsSelected'))
    return
  }

  // Use store's bulk mark sent - handles all state updates internally
  const response = await store.bulkMarkGuestsAsSent(props.eventId, selectedIds)

  if (response.success && response.data) {
    const count = response.data.count
    showMessage('success', t('management.guestManagementTab.toast.bulkMarkedSent', { count }))

    // Clear selection after successful operation
    guestGroupsViewRef.value?.clearSelection()
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.bulkMarkSentFailed'))
    // Selection remains intact so user can retry
  }
}

const handleBulkDelete = (groupId: number, selectedIds: number[]) => {
  if (selectedIds.length === 0) {
    showMessage('error', t('management.guestManagementTab.toast.noGuestsSelected'))
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
    showMessage('success', t('management.guestManagementTab.toast.bulkDeleted', { count }))

    // Clear selection after successful operation
    guestGroupsViewRef.value?.clearSelection()
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.bulkDeleteFailed'))

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
  if (type === 'success') {
    notifySuccess(text)
  } else {
    notifyError(text)
  }
}

// Lifecycle
onMounted(() => {
  // The store is a singleton and the shared guest-list page points it at a
  // share code. It resets on unmount, but claiming the organizer's own
  // transport here means a page that failed to unmount cleanly cannot leave
  // this screen reading somebody's share link.
  store.useOwnerTransport()
  loadPayments()
})

// Watch for template payment status changes
watch(hasTemplatePayment, (isActivated) => {
  if (isActivated) {
    loadGroups()
    loadGuestStats()
    loadRsvpSummary()
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
