<template>
  <!--
    No MainLayout. Everything in the app shell — the top bar, the mobile tab
    bar, the contact FAB — belongs to a product this visitor has no account for,
    and the one thing they *could* do with it (sign in) is beside the point: the
    link is the credential. The same reasoning the public design catalogue used
    when it dropped the shell.
  -->
  <div class="min-h-screen bg-slate-50">
    <!-- Loading: the link is resolving. Nothing else can be drawn until it
         answers, because what the page is allowed to show depends on it. -->
    <div v-if="loadingContext" class="min-h-screen flex items-center justify-center p-6">
      <div class="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- The link did not open. One card, a different sentence per reason: an
         expired or revoked link means "ask for a new one", an unknown code
         almost always means a truncated paste. -->
    <div v-else-if="errorReason" class="min-h-screen flex items-center justify-center p-6">
      <div class="w-full max-w-md bg-white rounded-3xl ring-1 ring-slate-900/5 shadow-sm p-8 text-center">
        <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <LinkIcon class="w-7 h-7 text-slate-400" aria-hidden="true" />
        </div>
        <h1 class="text-lg font-bold text-slate-900">{{ t(errorCopy.title) }}</h1>
        <p class="mt-2 text-sm text-slate-600 leading-relaxed">{{ t(errorCopy.body) }}</p>
        <button
          v-if="errorReason === 'network'"
          type="button"
          @click="loadContext"
          class="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <RefreshCw class="w-4 h-4" />
          {{ t('management.sharedGuestList.retry') }}
        </button>
      </div>
    </div>

    <template v-else-if="context">
      <!-- Header. The event it belongs to, who sent it, and what the holder may
           do — in that order, because a link arriving in a chat thread has to
           identify itself before it is trusted. -->
      <header class="bg-white border-b border-slate-200">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div class="flex items-start gap-3 sm:gap-4">
            <img
              v-if="context.event.banner_image"
              :src="context.event.banner_image"
              alt=""
              class="hidden sm:block w-14 h-14 rounded-2xl object-cover flex-shrink-0 ring-1 ring-slate-900/5"
            />
            <div
              v-else
              class="hidden sm:flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2ecc71]/15 to-[#1e90ff]/15 items-center justify-center flex-shrink-0"
            >
              <CalendarDays class="w-6 h-6 text-[#2ecc71]" aria-hidden="true" />
            </div>

            <div class="min-w-0 flex-1">
              <h1 class="text-lg sm:text-xl font-bold text-slate-900 leading-tight truncate">
                {{ context.event.title }}
              </h1>
              <p class="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                {{ eventSubtitle }}
              </p>
            </div>

            <!-- Access, said plainly. The panel below already looks different
                 in each mode, but only someone who has seen both would know
                 that — this is the label that makes it legible on first sight. -->
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0"
              :class="canEdit ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'"
            >
              <component :is="canEdit ? Pencil : Eye" class="w-3 h-3" aria-hidden="true" />
              {{ canEdit
                ? t('management.sharedGuestList.badge.edit')
                : t('management.sharedGuestList.badge.view') }}
            </span>
          </div>

          <p class="mt-3 text-xs text-slate-500">
            {{ t('management.sharedGuestList.sharedBy', { name: context.shared_by.name }) }}
            <template v-if="context.expires_at">
              <span aria-hidden="true"> · </span>
              {{ t('management.sharedGuestList.expiresOn', { date: formatDate(context.expires_at) }) }}
            </template>
          </p>
        </div>
      </header>

      <main class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <GuestGroupsView
          ref="guestGroupsViewRef"
          :groups="groups"
          :loading-groups="loadingGroups"
          :page-size="PAGE_SIZE"
          :get-group-guests="getGroupGuests"
          :is-group-loading="isGroupLoading"
          :is-group-expanded="isGroupExpanded"
          :get-group-pagination="getGroupPagination"
          :all-guests-pagination="allGuestsPagination"
          :is-all-guests-loading="isAllGuestsLoading"
          :load-all-guests="loadAllGuests"
          :guest-stats="guestStats"
          :loading-stats="loadingStats"
          :rsvp-summary="null"
          :can-edit="canEdit"
          @add-guest="showAddGuestModal = true"
          @toggle-group="handleGroupToggle"
          @copy-link="copyShowcaseLink"
          @mark-sent="handleMarkAsSent"
          @edit-guest="openEditGuestModal"
          @delete-guest="openDeleteGuestModal"
          @update-guest-group="handleUpdateGuestGroup"
          @quick-add-guest="handleQuickAddGuest"
          @inline-create-group="handleCreateGroup"
          @inline-update-group="handleUpdateGroup"
          @inline-delete-group="handleDeleteGroup"
          @search="handleGroupSearch"
          @search-all="setAllGuestsSearchTerm"
          @load-more-all="loadMoreAllGuests"
          @load-more-group="loadMoreGroupGuests"
          @bulk-mark-sent="handleBulkMarkSent"
          @bulk-delete="handleBulkDelete"
        />

        <!-- The one piece of GoEvent branding on the page, at the end where a
             signature goes rather than in a bar at the top competing with the
             event's own name. -->
        <p class="mt-8 text-center text-xs text-slate-400">
          {{ t('management.sharedGuestList.poweredBy') }}
        </p>
      </main>

      <!-- Write affordances exist only on an edit link. Mounting them behind
           `canEdit` rather than hiding them means a view-only holder cannot
           reach one by any route, including a stale ref. -->
      <template v-if="canEdit">
        <DeleteConfirmModal
          :show="showDeleteModal"
          :title="t('management.guestManagementTab.deleteGuestTitle')"
          :item-name="deleteTargetGuest?.name || ''"
          :loading="deletingGuest"
          @confirm="confirmDeleteGuest"
          @cancel="cancelDeleteGuest"
        />

        <DeleteConfirmModal
          :show="showBulkDeleteModal"
          :title="t('management.guestManagementTab.bulkDeleteTitle')"
          :message="t('management.guestManagementTab.bulkDeleteMessage', { count: bulkDeleteGuestIds.length })"
          :loading="bulkDeletingGuests"
          @confirm="confirmBulkDelete"
          @cancel="cancelBulkDelete"
        />

        <AddGuestModal
          :show="showAddGuestModal"
          :groups="groups"
          :is-importing="isImporting"
          :is-parsing="isParsing"
          :selected-file="selectedFile"
          :is-dragging="isDragging"
          :file-preview="filePreview"
          :parse-error="parseError"
          :pending-group-id="pendingGroupId"
          :is-creating-group="isCreatingGroup"
          @close="handleCloseAddGuestModal"
          @import="handleBulkImport"
          @download-template="downloadTemplate"
          @file-select="handleFileSelect"
          @file-drop="handleFileDrop"
          @drag-over="handleDragOver"
          @drag-leave="handleDragLeave"
          @create-group="handleCreateGroupFromImport"
          @clear-preview="clearPreview"
          @group-change="handleImportGroupChange"
          @update-guest-name="(index, name, groupId) => updateGuestName(index, name, groupId ?? undefined)"
          @delete-guest="(index, groupId) => deleteGuestFromPreview(index, groupId ?? undefined)"
          @edit-group="handleEditGroupFromImport"
          @delete-group="handleDeleteGroupFromImport"
        />

        <EditGuestModal
          ref="editGuestModalRef"
          :show="showEditGuestModal"
          :guest="editTargetGuest"
          :groups="groups"
          :is-updating="isUpdatingGuest"
          :is-loading-answers="false"
          @close="showEditGuestModal = false"
          @update-guest="handleUpdateGuest"
          @mark-sent="handleMarkAsSent"
          @delete="handleDeleteFromEditModal"
          @copy-link="copyShowcaseLink"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CalendarDays, Eye, Link as LinkIcon, Pencil, RefreshCw } from 'lucide-vue-next'
import { useGuestManagementStore } from '@/stores/guestManagement'
import { useNotifications } from '@/composables/useNotifications'
import { useBulkImport } from '@/composables/invitation/useBulkImport'
import { sharedGuestListService } from '@/services/api'
import type {
  EventGuest,
  GuestGroup,
  GuestShareContext,
  GuestShareErrorReason,
  UpdateGuestRequest,
} from '@/services/api'
import { getGuestSSRMetaUrl } from '@/utils/metaUtils'
import GuestGroupsView from '@/components/invitation/GuestGroupsView.vue'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import AddGuestModal from '@/components/invitation/AddGuestModal.vue'
import EditGuestModal from '@/components/invitation/EditGuestModal.vue'

const route = useRoute()
const { t, locale } = useI18n()
const { success: notifySuccess, error: notifyError } = useNotifications()

const shareCode = String(route.params.code || '')

// ---------------------------------------------------------------------------
// The link
// ---------------------------------------------------------------------------

const context = ref<GuestShareContext | null>(null)
const loadingContext = ref(true)
const errorReason = ref<GuestShareErrorReason | null>(null)

const canEdit = computed(() => context.value?.permissions.can_edit_guests ?? false)

/**
 * The event id the guest endpoints are nominally scoped to.
 *
 * It never reaches the network on this page — the share transport discards it
 * and addresses everything by code — but the store's actions still take it, and
 * the showcase-link fallback below genuinely needs it.
 */
const eventId = computed(() => context.value?.event.id ?? '')

const ERROR_COPY: Record<GuestShareErrorReason, { title: string; body: string }> = {
  not_found: {
    title: 'management.sharedGuestList.error.notFound.title',
    body: 'management.sharedGuestList.error.notFound.body',
  },
  revoked: {
    title: 'management.sharedGuestList.error.revoked.title',
    body: 'management.sharedGuestList.error.revoked.body',
  },
  expired: {
    title: 'management.sharedGuestList.error.expired.title',
    body: 'management.sharedGuestList.error.expired.body',
  },
  network: {
    title: 'management.sharedGuestList.error.network.title',
    body: 'management.sharedGuestList.error.network.body',
  },
}

const errorCopy = computed(() => ERROR_COPY[errorReason.value ?? 'network'])

/**
 * HTTP status carries the reason: `404` unknown code, `403` revoked, `410`
 * expired. A response with no status never reached the server at all, which is
 * the one case worth offering a retry for.
 */
const reasonFromStatus = (status?: number): GuestShareErrorReason => {
  if (status === 404) return 'not_found'
  if (status === 403) return 'revoked'
  if (status === 410) return 'expired'
  return 'network'
}

const loadContext = async () => {
  loadingContext.value = true
  errorReason.value = null

  if (!shareCode) {
    errorReason.value = 'not_found'
    loadingContext.value = false
    return
  }

  const response = await sharedGuestListService.getContext(shareCode)

  if (response.success && response.data) {
    context.value = response.data
    document.title = t('management.sharedGuestList.documentTitle', {
      event: response.data.event.title,
    })
    await loadList()
  } else {
    errorReason.value = reasonFromStatus(response.status)
  }

  loadingContext.value = false
}

// ---------------------------------------------------------------------------
// The list, through the shared store
// ---------------------------------------------------------------------------

// The same store the organizer's manage screen uses. Only its transport
// differs, so every optimistic update, cache window and infinite-scroll page
// behaves identically for a link holder.
const store = useGuestManagementStore()

const groups = computed(() => store.groups)
const loadingGroups = computed(() => store.loadingGroups)
const guestStats = computed(() => store.stats)
const loadingStats = computed(() => store.loadingStats)
const allGuestsPagination = computed(() => store.allGuestsPagination)
const PAGE_SIZE = store.PAGE_SIZE

const getGroupPagination = (groupId: number) => store.getGroupPaginationState(groupId)
const getGroupGuests = (groupId: number) => store.getGroupPaginationState(groupId).guests
const isGroupLoading = (groupId: number) => store.getGroupPaginationState(groupId).loading
const isGroupExpanded = (groupId: number) => store.isGroupExpanded(groupId)
const isAllGuestsLoading = () => allGuestsPagination.value.loading

const loadAllGuests = (page: number, silent: boolean) =>
  store.loadAllGuests(eventId.value, page, silent)
const loadMoreAllGuests = () => store.loadMoreAllGuests(eventId.value)
const loadMoreGroupGuests = (groupId: number) => store.loadMoreGroupGuests(eventId.value, groupId)
const setAllGuestsSearchTerm = (term: string) =>
  store.setAllGuestsSearchTerm(eventId.value, term)

const loadList = async () => {
  store.useShareTransport(shareCode)
  await Promise.all([
    store.loadGroups(eventId.value),
    store.loadGuestStats(eventId.value),
    store.loadAllGuests(eventId.value, 1),
  ])
}

const guestGroupsViewRef = ref<InstanceType<typeof GuestGroupsView> | null>(null)

const showMessage = (type: 'success' | 'error', text: string) => {
  if (type === 'success') notifySuccess(text)
  else notifyError(text)
}

const handleGroupToggle = async (groupId: number) => {
  store.toggleGroupExpansion(groupId)
  if (getGroupGuests(groupId).length === 0) {
    await store.loadGuestsForGroup(eventId.value, groupId, 1)
  }
}

const handleGroupSearch = (groupId: number, term: string) =>
  store.setGroupSearchTerm(eventId.value, groupId, term)

// ---------------------------------------------------------------------------
// Copying an invitation link — the reason a view-only link exists at all
// ---------------------------------------------------------------------------

const copyShowcaseLink = (guest: EventGuest, language: 'en' | 'kh', silent = false) => {
  const announce = () => {
    if (silent) return
    showMessage(
      'success',
      t('management.guestManagementTab.toast.linkCopied', {
        lang: language.toUpperCase(),
        name: guest.name,
      }),
    )
  }

  const url = guest.short_url
    ? `${guest.short_url}?lang=${language}`
    : getGuestSSRMetaUrl(eventId.value, guest.name, language)

  navigator.clipboard
    .writeText(url)
    .then(announce)
    .catch(() => showMessage('error', t('management.guestManagementTab.toast.linkCopyFailed')))
}

// ---------------------------------------------------------------------------
// Writes (edit links only)
// ---------------------------------------------------------------------------

const showAddGuestModal = ref(false)
const showEditGuestModal = ref(false)
const editTargetGuest = ref<EventGuest | null>(null)
const isUpdatingGuest = ref(false)
const editGuestModalRef = ref<InstanceType<typeof EditGuestModal> | null>(null)

const showDeleteModal = ref(false)
const deletingGuest = ref(false)
const deleteTargetGuest = ref<EventGuest | null>(null)

const showBulkDeleteModal = ref(false)
const bulkDeletingGuests = ref(false)
const bulkDeleteGuestIds = ref<number[]>([])
const bulkDeleteGroupId = ref(0)

const isCreatingGroup = ref(false)
const pendingGroupId = ref<number | null>(null)

const handleQuickAddGuest = async (name: string, groupId: number) => {
  const response = await store.createGuest(eventId.value, name, groupId)
  if (!response.success) {
    showMessage('error', response.message || t('management.guestManagementTab.toast.guestAddFailed'))
  }
}

const openEditGuestModal = (guest: EventGuest) => {
  editTargetGuest.value = guest
  showEditGuestModal.value = true
}

const handleUpdateGuest = async (guestId: number, data: UpdateGuestRequest) => {
  const groupId = editTargetGuest.value?.group ?? 0
  isUpdatingGuest.value = true
  const response = await store.updateGuest(eventId.value, guestId, groupId, data)
  isUpdatingGuest.value = false

  if (response.success) {
    showMessage('success', t('management.guestManagementTab.toast.guestUpdated', { name: editTargetGuest.value?.name ?? '' }))
    showEditGuestModal.value = false
  } else {
    editGuestModalRef.value?.setErrorMessage(
      response.message || t('management.guestManagementTab.toast.guestUpdateFailed'),
    )
  }
}

const handleUpdateGuestGroup = async (guest: EventGuest, groupId: number) => {
  const response = await store.updateGuest(eventId.value, guest.id, guest.group, { group: groupId })
  if (!response.success) {
    showMessage(
      'error',
      response.message || t('management.guestManagementTab.toast.guestUpdateFailed'),
    )
  }
}

const openDeleteGuestModal = (guest: EventGuest) => {
  deleteTargetGuest.value = guest
  showDeleteModal.value = true
}

const confirmDeleteGuest = async () => {
  const guest = deleteTargetGuest.value
  if (!guest) return

  deletingGuest.value = true
  const response = await store.deleteGuest(eventId.value, guest.id, guest.group)
  deletingGuest.value = false
  showDeleteModal.value = false
  deleteTargetGuest.value = null

  if (!response.success) {
    showMessage(
      'error',
      response.message || t('management.guestManagementTab.toast.guestRemoveFailed'),
    )
  }
}

const cancelDeleteGuest = () => {
  if (deletingGuest.value) return
  showDeleteModal.value = false
  deleteTargetGuest.value = null
}

const handleDeleteFromEditModal = (guest: EventGuest) => {
  showEditGuestModal.value = false
  openDeleteGuestModal(guest)
}

const handleMarkAsSent = async (guest: EventGuest) => {
  const response = await store.markGuestAsSent(eventId.value, guest.id, guest.group)
  if (!response.success) {
    showMessage('error', response.message || t('management.guestManagementTab.toast.markSentFailed'))
  }
}

const handleBulkMarkSent = async (_groupId: number, selectedIds: number[]) => {
  if (selectedIds.length === 0) return
  const response = await store.bulkMarkGuestsAsSent(eventId.value, selectedIds)
  if (response.success && response.data) {
    showMessage(
      'success',
      t('management.guestManagementTab.toast.bulkMarkedSent', { count: response.data.count }),
    )
    guestGroupsViewRef.value?.clearSelection()
  } else {
    showMessage(
      'error',
      response.message || t('management.guestManagementTab.toast.bulkMarkSentFailed'),
    )
  }
}

const handleBulkDelete = (groupId: number, selectedIds: number[]) => {
  if (selectedIds.length === 0) return
  bulkDeleteGuestIds.value = selectedIds
  bulkDeleteGroupId.value = groupId
  showBulkDeleteModal.value = true
}

const confirmBulkDelete = async () => {
  const ids = bulkDeleteGuestIds.value
  const original = [...ids]

  bulkDeletingGuests.value = true
  const response = await store.bulkDeleteGuests(
    eventId.value,
    ids,
    bulkDeleteGroupId.value || undefined,
  )
  bulkDeletingGuests.value = false
  showBulkDeleteModal.value = false
  bulkDeleteGuestIds.value = []
  bulkDeleteGroupId.value = 0

  if (response.success && response.data) {
    showMessage(
      'success',
      t('management.guestManagementTab.toast.bulkDeleted', { count: response.data.count }),
    )
    guestGroupsViewRef.value?.clearSelection()
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.bulkDeleteFailed'))
    guestGroupsViewRef.value?.restoreSelection(original)
  }
}

const cancelBulkDelete = () => {
  if (bulkDeletingGuests.value) return
  showBulkDeleteModal.value = false
  bulkDeleteGuestIds.value = []
  bulkDeleteGroupId.value = 0
}

// ---- groups --------------------------------------------------------------

const handleCreateGroup = async (data: { name: string; description?: string; color: string }) => {
  const response = await store.createGroup(eventId.value, {
    ...data,
    order: groups.value.length + 1,
  })
  if (response.success && response.data) {
    showMessage(
      'success',
      t('management.guestManagementTab.toast.groupCreated', { name: response.data.name }),
    )
  } else {
    showMessage(
      'error',
      response.message || t('management.guestManagementTab.toast.groupCreateFailed'),
    )
  }
}

const handleUpdateGroup = async (
  groupId: number,
  data: { name: string; description?: string; color: string },
) => {
  const response = await store.updateGroup(eventId.value, groupId, data)
  if (!response.success) {
    showMessage(
      'error',
      response.message || t('management.guestManagementTab.toast.groupUpdateFailed'),
    )
  }
}

const handleDeleteGroup = async (groupId: number) => {
  const response = await store.deleteGroup(eventId.value, groupId)
  if (response.success) {
    await store.loadGuestStats(eventId.value)
  } else {
    showMessage(
      'error',
      response.message || t('management.guestManagementTab.toast.groupDeleteFailed'),
    )
  }
}

// ---- bulk import ---------------------------------------------------------

const getExistingGuestNamesForGroup = (groupId: number) =>
  store.getAllGuestNamesForGroup(eventId.value, groupId)

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
  downloadTemplate,
  resetImportState,
  clearPreview,
  revalidatePreviewForGroup,
  updateGuestName,
  deleteGuestFromPreview,
  // `eventId` is only read by the composable's own `importGuests`, which this
  // page does not use — the import goes through the store so it lands on the
  // share transport and refreshes the same pagination as every other write.
  // There is no event id to give it at setup time anyway: the link has not
  // resolved yet.
} = useBulkImport('', undefined, undefined, getExistingGuestNamesForGroup)

const handleCloseAddGuestModal = () => {
  showAddGuestModal.value = false
  pendingGroupId.value = null
  resetImportState()
}

const handleImportGroupChange = async (groupId: number) => {
  pendingGroupId.value = groupId
  await revalidatePreviewForGroup(groupId)
}

const handleCreateGroupFromImport = async (data: {
  name: string
  description?: string
  color: string
}) => {
  isCreatingGroup.value = true
  const response = await store.createGroup(eventId.value, {
    ...data,
    order: groups.value.length + 1,
  })
  isCreatingGroup.value = false

  if (response.success && response.data) {
    pendingGroupId.value = response.data.id
  } else {
    showMessage(
      'error',
      response.message || t('management.guestManagementTab.toast.groupCreateFailed'),
    )
  }
}

// The import modal carries its own inline group management, so these two must
// be wired even though the same jobs exist in the panel behind it — an
// unhandled emit here is a control that visibly accepts input and does nothing.
const handleEditGroupFromImport = async (group: GuestGroup) => {
  const response = await store.updateGroup(eventId.value, group.id, {
    name: group.name,
    description: group.description,
    color: group.color,
  })
  if (response.success && response.data) {
    showMessage(
      'success',
      t('management.guestManagementTab.toast.groupUpdated', { name: response.data.name }),
    )
  } else {
    showMessage(
      'error',
      response.message || t('management.guestManagementTab.toast.groupUpdateFailed'),
    )
  }
}

const handleDeleteGroupFromImport = async (group: GuestGroup) => {
  const response = await store.deleteGroup(eventId.value, group.id)
  if (response.success) {
    showMessage(
      'success',
      t('management.guestManagementTab.toast.groupDeleted', { name: group.name }),
    )
  } else {
    showMessage(
      'error',
      response.message || t('management.guestManagementTab.toast.groupDeleteFailed'),
    )
  }
}

const handleBulkImport = async (groupId: number) => {
  if (!selectedFile.value) return
  const response = await store.bulkImportGuests(eventId.value, groupId, selectedFile.value)

  if (response.success && response.data) {
    showMessage(
      'success',
      t('management.guestManagementTab.toast.imported', { count: response.data.created ?? 0 }),
    )
    handleCloseAddGuestModal()
  } else {
    showMessage('error', response.message || t('management.guestManagementTab.toast.importFailed'))
  }
}

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value === 'kh' ? 'km-KH' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const eventSubtitle = computed(() => {
  if (!context.value) return ''
  const parts = [formatDate(context.value.event.start_date)]
  if (context.value.event.location) parts.push(context.value.event.location)
  return parts.join(' · ')
})

onMounted(loadContext)

// The store is a singleton shared with the organizer's manage screen. Resetting
// puts the owner transport back along with the data, so no share code survives
// this page.
onUnmounted(() => {
  store.$reset()
})
</script>
