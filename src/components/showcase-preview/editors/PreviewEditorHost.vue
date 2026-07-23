<template>
  <!-- Invisible switchboard: listens for edit intents posted by the preview
       frames (see previewBridge.ts) and opens the matching FULL-SIZE editor
       here in the manage page — the same components the forms tab uses — so
       nothing has to render inside the tiny scaled iframes. -->
  <input
    ref="logoInputRef"
    type="file"
    accept="image/jpeg,image/png,image/gif,image/webp"
    class="hidden"
    @change="onLogoFileChosen"
  />

  <GmapEmbedModal
    v-model="gmapOpen"
    :event-id="eventId"
    :current-link="eventData?.google_map_embed_link"
    @saved="onEventSaved"
  />

  <EditEventDateModal
    v-model="eventDateOpen"
    :event-id="eventId"
    :start-date="eventData?.start_date"
    :end-date="eventData?.end_date"
    @saved="onEventSaved"
  />

  <EditHostDrawer
    v-model="hostDrawerOpen"
    :event-id="eventId"
    :host="activeHost"
    @updated="onHostUpdated"
  />

  <UploadMediaDrawer
    v-if="photosOpen"
    :event-id="eventId"
    @close="closePhotos"
    @uploaded="onPhotoUploaded"
  />

  <EditAgendaDrawer
    v-model="agendaDrawerOpen"
    :event-id="eventId"
    :item="activeAgendaItem"
    :existing-agenda-items="agendaItems"
    @created="onAgendaSaved"
    @updated="onAgendaSaved"
    @delete="onAgendaDeleteRequest"
  />

  <DeleteConfirmModal
    :show="!!agendaItemToDelete"
    :loading="agendaDeleteLoading"
    :title="t('management.agenda.deleteModal.title')"
    :item-name="agendaItemToDelete?.title || t('management.agenda.deleteModal.fallbackName')"
    :message="t('management.agenda.deleteModal.message')"
    @confirm="confirmAgendaDelete"
    @cancel="agendaItemToDelete = null"
  />

  <EditDateGroupModal
    :show="showEditDateGroupModal"
    v-model="newDateForGroup"
    :current-date-display="dateGroupToEdit ? formatGroupDate(dateGroupToEdit.date) : ''"
    :item-count="dateGroupToEdit?.itemCount || 0"
    :loading="isUpdatingDateGroup"
    @confirm="updateDateGroup"
    @cancel="closeEditDateGroupModal"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, toRef } from 'vue'
import { useMediaUpload } from '@/composables/useMediaUpload'
import { useNotifications } from '@/composables/useNotifications'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { parsePreviewBridgeMessage } from '../bridge/previewBridge'
import type { EditIntent } from '../edit/editContext'
import {
  agendaService,
  hostsService,
  type Event,
  type EventAgendaItem,
  type EventHost,
} from '@/services/api'
import { useDateGroupOperations } from '@/composables/useDateGroupOperations'
import { fromApiDate, isUnscheduled } from '@/constants/agenda'
import GmapEmbedModal from './GmapEmbedModal.vue'
import EditEventDateModal from './EditEventDateModal.vue'
import EditHostDrawer from '@/components/EditHostDrawer.vue'
import UploadMediaDrawer from '@/components/UploadMediaDrawer.vue'
import EditAgendaDrawer from '@/components/EditAgendaDrawer.vue'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import EditDateGroupModal from '@/components/EditDateGroupModal.vue'

interface Props {
  eventId: string
  /** The manage page's event record — needed by the logo uploader and the
   *  gmap modal for current values. */
  eventData?: Event
}

const props = defineProps<Props>()
const emit = defineEmits<{
  /** A parent-side editor saved something. Carries the updated event when the
   *  save returns one (event-level fields); the tab refreshes the frames
   *  either way. */
  saved: [event?: Event]
}>()

const { t } = useAppLanguage()
const { error: notifyError } = useNotifications()

// --- Logo replace ----------------------------------------------------------
const logoInputRef = ref<HTMLInputElement | null>(null)

const mediaUpload = useMediaUpload(toRef(props, 'eventData'), (updated) => emit('saved', updated))

const onLogoFileChosen = async (event: globalThis.Event) => {
  const ok = await mediaUpload.handleFileUpload(event, 'logo_one', 'image')
  if (!ok && mediaUpload.error.value) {
    notifyError(t('management.showcasePreview.editors.logoUploadFailed'), mediaUpload.error.value)
  }
}

// --- Google Maps embed -----------------------------------------------------
const gmapOpen = ref(false)

// --- Event date --------------------------------------------------------------
const eventDateOpen = ref(false)

const onEventSaved = (updated: Event) => emit('saved', updated)

// --- Host image ------------------------------------------------------------
const hostDrawerOpen = ref(false)
const activeHost = ref<EventHost | undefined>(undefined)

const openHostEditor = async (hostId: number) => {
  const response = await hostsService.getHost(props.eventId, hostId)
  if (!response.success || !response.data) {
    notifyError(t('management.showcasePreview.editors.hostLoadFailed'))
    return
  }
  activeHost.value = response.data
  hostDrawerOpen.value = true
}

const onHostUpdated = () => {
  hostDrawerOpen.value = false
  emit('saved')
}

// --- Event photos ----------------------------------------------------------
const photosOpen = ref(false)
const photosDirty = ref(false)

const onPhotoUploaded = () => {
  photosDirty.value = true
}

const closePhotos = () => {
  photosOpen.value = false
  if (photosDirty.value) {
    photosDirty.value = false
    emit('saved')
  }
}

// --- Agenda (item drawer + delete confirm + day-group date modal) ----------
const agendaDrawerOpen = ref(false)
const activeAgendaItem = ref<EventAgendaItem | undefined>(undefined)
const agendaItems = ref<EventAgendaItem[]>([])
const agendaItemToDelete = ref<EventAgendaItem | null>(null)
const agendaDeleteLoading = ref(false)

/** Fetch the full agenda list fresh (the showcase's localized copy lacks
 *  translations) — the drawer needs it for create-mode auto-fill and order. */
const loadAgendaItems = async (): Promise<boolean> => {
  const response = await agendaService.getAgendaItems(props.eventId)
  if (!response.success || !response.data) {
    notifyError(t('management.showcasePreview.editors.agendaLoadFailed'))
    return false
  }
  agendaItems.value = response.data.results
  return true
}

const openAgendaEditor = async (agendaId?: number) => {
  if (!(await loadAgendaItems())) return
  if (agendaId !== undefined) {
    const item = agendaItems.value.find((entry) => entry.id === agendaId)
    if (!item) {
      notifyError(t('management.showcasePreview.editors.agendaLoadFailed'))
      return
    }
    activeAgendaItem.value = item
  } else {
    activeAgendaItem.value = undefined
  }
  agendaDrawerOpen.value = true
}

const onAgendaSaved = () => emit('saved')

// The drawer closes itself before emitting `delete`; confirm here, then save.
const onAgendaDeleteRequest = (item: EventAgendaItem) => {
  agendaItemToDelete.value = item
}

const confirmAgendaDelete = async () => {
  if (!agendaItemToDelete.value) return
  agendaDeleteLoading.value = true
  const response = await agendaService.deleteAgendaItem(
    props.eventId,
    agendaItemToDelete.value.id,
  )
  agendaDeleteLoading.value = false
  if (response.success) {
    agendaItemToDelete.value = null
    emit('saved')
  } else {
    notifyError(
      t('management.showcasePreview.editors.agendaDeleteFailed'),
      response.message || undefined,
    )
  }
}

/** Move an item one step up/down within its day. Mirrors the forms tab's
 *  drag-reorder convention: the day's items are renumbered 0..n-1 and saved
 *  via bulkReorderAgendaItems with { id, order, date }. */
const reorderAgendaItem = async (agendaId: number, direction: 'up' | 'down') => {
  if (!(await loadAgendaItems())) return
  const item = agendaItems.value.find((entry) => entry.id === agendaId)
  if (!item) {
    notifyError(t('management.showcasePreview.editors.agendaLoadFailed'))
    return
  }
  const dayKey = item.date ?? null
  const siblings = agendaItems.value
    .filter((entry) => (entry.date ?? null) === dayKey)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
  const index = siblings.findIndex((entry) => entry.id === agendaId)
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= siblings.length) return
  ;[siblings[index], siblings[target]] = [siblings[target], siblings[index]]
  const updates = siblings.map((entry, order) => ({ id: entry.id, order, date: entry.date }))
  const response = await agendaService.bulkReorderAgendaItems(props.eventId, { updates })
  if (response.success) {
    emit('saved')
  } else {
    notifyError(
      t('management.showcasePreview.editors.agendaReorderFailed'),
      response.message || undefined,
    )
  }
}

const {
  showEditDateGroupModal,
  dateGroupToEdit,
  newDateForGroup,
  isUpdatingDateGroup,
  openEditDateGroupModal,
  closeEditDateGroupModal,
  updateDateGroup,
} = useDateGroupOperations({
  eventId: toRef(props, 'eventId'),
  agendaItems,
  onSuccess: () => emit('saved'),
  onError: (message) => notifyError(message),
})

const formatGroupDate = (date: string): string => {
  if (isUnscheduled(date)) return t('management.agenda.unscheduled')
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// --- Intent routing --------------------------------------------------------
const handleIntent = (intent: EditIntent) => {
  switch (intent.kind) {
    case 'eventLogo':
      logoInputRef.value?.click()
      break
    case 'gmapEmbed':
      gmapOpen.value = true
      break
    case 'eventDate':
      eventDateOpen.value = true
      break
    case 'hostImage':
      openHostEditor(intent.hostId)
      break
    case 'photos':
      photosOpen.value = true
      break
    case 'agendaItem':
      openAgendaEditor(intent.agendaId)
      break
    case 'agendaAdd':
      openAgendaEditor()
      break
    case 'agendaDate':
      openEditDateGroupModal(fromApiDate(intent.date), intent.itemCount)
      break
    case 'agendaReorder':
      reorderAgendaItem(intent.agendaId, intent.direction)
      break
  }
}

const onWindowMessage = (msg: MessageEvent) => {
  const parsed = parsePreviewBridgeMessage(msg)
  if (parsed?.type === 'edit-intent') handleIntent(parsed.intent)
}

onMounted(() => window.addEventListener('message', onWindowMessage))
onUnmounted(() => window.removeEventListener('message', onWindowMessage))
</script>
