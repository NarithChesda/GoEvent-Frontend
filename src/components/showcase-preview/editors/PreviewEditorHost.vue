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

  <YoutubeEmbedModal
    v-model="youtubeOpen"
    :event-id="eventId"
    :current-link="eventData?.youtube_embed_link"
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
    :event-category="eventCategory"
    :host="activeHost"
    :existing-hosts="hostList"
    @updated="onHostUpdated"
  />

  <!-- The gallery's own manager: what is already there (to arrange, to prune,
       to not upload twice) above the way to add more. -->
  <UploadMediaDrawer
    v-if="photosOpen"
    :event-id="eventId"
    :initial-photos="eventData?.photos"
    @close="photosOpen = false"
    @photos-changed="(photos) => emit('media-updated', photos)"
  />

  <FeaturedPhotoModal
    v-model="featuredPhotoOpen"
    :event-id="eventId"
    :initial-focus="featuredPhotoFocus"
    :stack-layout="featuredPhotoStackLayout"
    :initial-photo-id="featuredPhotoId"
    @saved="onFeaturedPhotoSaved"
    @upload-requested="onFeaturedPhotoUploadRequested"
  />

  <!-- A band is stored on its photo, so a save is a gallery change: reported
       the way the photos drawer reports one. -->
  <PhotoBandEditor
    v-model="photoBandOpen"
    :event-id="eventId"
    :photo-id="photoBandId"
    :swatches="blendSwatches"
    @preview="(photos) => emit('preview', photos)"
    @saved="(photos) => emit('media-updated', photos)"
    @upload-requested="photosOpen = true"
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

  <EditDressCodeDrawer
    v-model="dressCodeDrawerOpen"
    :event-id="eventId"
    :dress-code="activeDressCode"
    :max-order="Math.max(0, dressCodeItems.length - 1)"
    @saved="onDressCodeSaved"
    @delete="onDressCodeDeleteRequest"
  />

  <DeleteConfirmModal
    :show="!!dressCodeToDelete"
    :loading="dressCodeDeleteLoading"
    :title="t('management.dressCode.section.deleteModal.title')"
    :item-name="dressCodeToDelete?.title || dressCodeToDelete?.dress_code_type_display || t('management.dressCode.section.deleteModal.title')"
    @confirm="confirmDressCodeDelete"
    @cancel="dressCodeToDelete = null"
  />

  <PaymentMethodModal
    v-if="paymentModalOpen"
    :event-id="eventId"
    :existing-payment-method="activePaymentMethod"
    @close="paymentModalOpen = false"
    @saved="onPaymentSaved"
    @delete="onPaymentDeleteRequest"
  />

  <DeleteConfirmModal
    :show="!!paymentMethodToDelete"
    :loading="paymentDeleteLoading"
    :title="t('management.paymentMethods.deleteModal.title')"
    :item-name="paymentMethodToDelete?.name"
    @confirm="confirmPaymentDelete"
    @cancel="paymentMethodToDelete = null"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, toRef } from 'vue'
import { useMediaUpload } from '@/composables/useMediaUpload'
import { useNotifications } from '@/composables/useNotifications'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { parsePreviewBridgeMessage, type PhotoFieldPatch } from '../bridge/previewBridge'
import type { EditIntent } from '../edit/editContext'
import type { StackLayoutType } from '@/services/api/types/template.types'
import {
  agendaService,
  hostsService,
  dressCodeService,
  paymentMethodsService,
  eventsService,
  type Event,
  type EventPhoto,
  type EventAgendaItem,
  type EventHost,
  type EventDressCode,
  type EventPaymentMethod,
} from '@/services/api'
import { useDateGroupOperations } from '@/composables/useDateGroupOperations'
import { fromApiDate, isUnscheduled } from '@/constants/agenda'
import GmapEmbedModal from './GmapEmbedModal.vue'
import YoutubeEmbedModal from './YoutubeEmbedModal.vue'
import FeaturedPhotoModal from './FeaturedPhotoModal.vue'
import PhotoBandEditor from './PhotoBandEditor.vue'
import type { BlendSwatch } from '@/components/showcase/photo-band/photoBand'
import EditEventDateModal from './EditEventDateModal.vue'
import EditHostDrawer from '@/components/EditHostDrawer.vue'
import UploadMediaDrawer from '@/components/UploadMediaDrawer.vue'
import EditAgendaDrawer from '@/components/EditAgendaDrawer.vue'
import EditDressCodeDrawer from '@/components/EditDressCodeDrawer.vue'
import PaymentMethodModal from '@/components/PaymentMethodModal.vue'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import EditDateGroupModal from '@/components/EditDateGroupModal.vue'

interface Props {
  eventId: string
  /** The manage page's event record — needed by the logo uploader and the
   *  gmap modal for current values. */
  eventData?: Event
  /** The applied template's colours, offered as photo-band blend colours. */
  blendSwatches?: BlendSwatch[]
}

const props = withDefaults(defineProps<Props>(), { eventData: undefined, blendSwatches: () => [] })
const emit = defineEmits<{
  /** Draw these photos this way in the frames now — an editor's unsaved draft,
   *  or the stored values it is being put back to. Never saved by this. */
  preview: [photos: PhotoFieldPatch[]]
  /** A parent-side editor saved something. Carries the updated event when the
   *  save returns one (event-level fields); the tab refreshes the frames
   *  either way. */
  saved: [event?: Event]
  /** The photos drawer saved a change to the gallery — the whole list in its
   *  new order, so the manage page's copy (and the forms' grid) follow it, and
   *  the frames refresh while the drawer is still open over them. */
  'media-updated': [photos: EventPhoto[]]
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

// --- YouTube embed -----------------------------------------------------------
const youtubeOpen = ref(false)

// --- Event date --------------------------------------------------------------
const eventDateOpen = ref(false)

const onEventSaved = (updated: Event) => emit('saved', updated)

// --- Display toggles (RSVP / Comments / Countdown) --------------------------
// No modal needed — the preview posts the field to flip, we flip it against
// the parent's own copy of the event and patch it straight away.
const toggleDisplayField = async (
  field: 'rsvp_enabled' | 'comments_enabled' | 'countdown_enabled',
) => {
  const current = props.eventData?.[field] !== false
  const response = await eventsService.patchEvent(props.eventId, { [field]: !current })
  if (response.success && response.data) {
    emit('saved', response.data)
  } else {
    notifyError(
      t('management.showcasePreview.editors.displayToggleFailed'),
      response.message || undefined,
    )
  }
}

// --- Host image ------------------------------------------------------------
const hostDrawerOpen = ref(false)
const activeHost = ref<EventHost | undefined>(undefined)
const hostList = ref<EventHost[]>([])

// The drawer shows the parent-name rows only for categories that have them
// (wedding, birthday). Same expression the Hosts section is given in
// EventManageView — without it this drawer silently dropped them.
const eventCategory = computed(
  () => props.eventData?.category_details?.name || props.eventData?.category_name || '',
)

const openHostEditor = async (hostId: number) => {
  // The list is the drawer's position control (phone widths), the same list
  // the Hosts section hands it. Failing to get it only hides that control.
  const [response, list] = await Promise.all([
    hostsService.getHost(props.eventId, hostId),
    hostsService.getHosts(props.eventId),
  ])
  if (!response.success || !response.data) {
    notifyError(t('management.showcasePreview.editors.hostLoadFailed'))
    return
  }
  activeHost.value = response.data
  hostList.value = (list.success && list.data?.results) || []
  hostDrawerOpen.value = true
}

const onHostUpdated = () => {
  hostDrawerOpen.value = false
  emit('saved')
}

// --- Event photos ----------------------------------------------------------
// Every change is reported as it is saved (see the drawer's `photos-changed`),
// so there is nothing left to flush on close — the frames have already caught
// up by the time it goes.
const photosOpen = ref(false)

// --- Featured photo (transition stage) --------------------------------------
const featuredPhotoOpen = ref(false)
/** Which tab the picker opens on — the stage has one affordance for swapping
 *  the photo and another for re-framing its crop. */
const featuredPhotoFocus = ref<'choose' | 'crop'>('choose')
/** Set by the photo stack: frame every photograph it reveals, each in its own
 *  frame's shape, opening on the one that was tapped. */
const featuredPhotoStackLayout = ref<StackLayoutType | null>(null)
const featuredPhotoId = ref<number | null>(null)

const onFeaturedPhotoSaved = () => emit('saved')

// The picker has no photos to offer — hand off to the same upload drawer the
// photo-gallery section uses (it already closed itself before emitting this).
const onFeaturedPhotoUploadRequested = () => {
  photosOpen.value = true
}

// --- Photo band ----------------------------------------------------------------
// A panel without a scrim, so the frames stay on screen while it is open — the
// one editor that can be left open while another region is tapped, which is
// why routing any other intent closes it (see handleIntent).
const photoBandOpen = ref(false)
/** The band that was tapped (its photo); null when the add row asked for a new one. */
const photoBandId = ref<number | null>(null)

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

// --- Dress code (drawer + delete confirm) -----------------------------------
const dressCodeDrawerOpen = ref(false)
const activeDressCode = ref<EventDressCode | undefined>(undefined)
const dressCodeItems = ref<EventDressCode[]>([])
const dressCodeToDelete = ref<EventDressCode | null>(null)
const dressCodeDeleteLoading = ref(false)

/** Fetch the full dress code list fresh — the showcase's own copy isn't
 *  guaranteed to match the strict union types (dress_code_type/gender) the
 *  drawer's selects need, and the drawer's mobile position control needs an
 *  accurate sibling count/order. */
const loadDressCodes = async (): Promise<boolean> => {
  const response = await dressCodeService.getDressCodes(props.eventId, { ordering: 'order' })
  if (!response.success || !response.data) {
    notifyError(t('management.showcasePreview.editors.dressCodeLoadFailed'))
    return false
  }
  dressCodeItems.value = response.data.results
  return true
}

const openDressCodeEditor = async (dressCodeId?: number) => {
  if (!(await loadDressCodes())) return
  if (dressCodeId !== undefined) {
    const item = dressCodeItems.value.find((entry) => entry.id === dressCodeId)
    if (!item) {
      notifyError(t('management.showcasePreview.editors.dressCodeLoadFailed'))
      return
    }
    activeDressCode.value = item
  } else {
    activeDressCode.value = undefined
  }
  dressCodeDrawerOpen.value = true
}

// Persist a fully reordered list (mirrors the forms tab's own drag-reorder)
const persistDressCodeOrder = async (newList: EventDressCode[]) => {
  const updates = newList.map((item, order) => ({ id: item.id, order }))
  const response = await dressCodeService.bulkReorderDressCodes(props.eventId, { updates })
  if (!response.success) {
    notifyError(
      response.message || t('management.showcasePreview.editors.dressCodeLoadFailed'),
    )
  }
}

// Apply the position chosen in the drawer's mobile position control
const applyRequestedDressCodeOrder = async (item: EventDressCode, requestedOrder: number) => {
  const list = [...dressCodeItems.value].sort((a, b) => a.order - b.order)
  const from = list.findIndex((entry) => entry.id === item.id)
  if (from === -1) return
  const to = Math.min(Math.max(requestedOrder, 0), list.length - 1)
  if (from === to) return
  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)
  await persistDressCodeOrder(list)
}

const onDressCodeSaved = async (saved: EventDressCode, requestedOrder?: number) => {
  if (requestedOrder !== undefined) await applyRequestedDressCodeOrder(saved, requestedOrder)
  emit('saved')
}

// The drawer doesn't close itself before emitting `delete` — confirm here,
// then close the drawer once the delete actually succeeds.
const onDressCodeDeleteRequest = (dressCode: EventDressCode) => {
  dressCodeToDelete.value = dressCode
}

const confirmDressCodeDelete = async () => {
  if (!dressCodeToDelete.value) return
  dressCodeDeleteLoading.value = true
  const response = await dressCodeService.deleteDressCode(props.eventId, dressCodeToDelete.value.id)
  dressCodeDeleteLoading.value = false
  if (response.success) {
    dressCodeToDelete.value = null
    dressCodeDrawerOpen.value = false
    emit('saved')
  } else {
    notifyError(
      t('management.showcasePreview.editors.dressCodeDeleteFailed'),
      response.message || undefined,
    )
  }
}

// --- Payment method (drawer + delete confirm) -------------------------------
const paymentModalOpen = ref(false)
const activePaymentMethod = ref<EventPaymentMethod | undefined>(undefined)
const paymentMethodToDelete = ref<EventPaymentMethod | null>(null)
const paymentDeleteLoading = ref(false)

const openPaymentEditor = async (paymentMethodId?: number) => {
  if (paymentMethodId !== undefined) {
    const response = await paymentMethodsService.getPaymentMethod(props.eventId, paymentMethodId)
    if (!response.success || !response.data) {
      notifyError(t('management.showcasePreview.editors.paymentLoadFailed'))
      return
    }
    activePaymentMethod.value = response.data
  } else {
    activePaymentMethod.value = undefined
  }
  paymentModalOpen.value = true
}

const onPaymentSaved = () => {
  paymentModalOpen.value = false
  emit('saved')
}

// The modal doesn't tell us which record was deleted — it's whichever one is
// currently open.
const onPaymentDeleteRequest = () => {
  paymentMethodToDelete.value = activePaymentMethod.value ?? null
}

const confirmPaymentDelete = async () => {
  if (!paymentMethodToDelete.value) return
  paymentDeleteLoading.value = true
  const response = await paymentMethodsService.deletePaymentMethod(
    props.eventId,
    paymentMethodToDelete.value.id,
  )
  paymentDeleteLoading.value = false
  if (response.success) {
    paymentMethodToDelete.value = null
    paymentModalOpen.value = false
    emit('saved')
  } else {
    notifyError(
      t('management.showcasePreview.editors.paymentDeleteFailed'),
      response.message || undefined,
    )
  }
}

// --- Intent routing --------------------------------------------------------
const handleIntent = (intent: EditIntent) => {
  // Closing reverts the frames to the stored band, so two editors never draw
  // over each other's work.
  if (intent.kind !== 'photoBand') photoBandOpen.value = false

  switch (intent.kind) {
    case 'eventLogo':
      logoInputRef.value?.click()
      break
    case 'gmapEmbed':
      gmapOpen.value = true
      break
    case 'youtubeEmbed':
      youtubeOpen.value = true
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
    case 'featuredPhoto':
      featuredPhotoFocus.value = intent.focus ?? 'choose'
      featuredPhotoStackLayout.value = intent.stackLayout ?? null
      featuredPhotoId.value = intent.photoId ?? null
      featuredPhotoOpen.value = true
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
    case 'dressCodeItem':
      openDressCodeEditor(intent.dressCodeId)
      break
    case 'dressCodeAdd':
      openDressCodeEditor()
      break
    case 'paymentItem':
      openPaymentEditor(intent.paymentMethodId)
      break
    case 'paymentAdd':
      openPaymentEditor()
      break
    case 'displayToggle':
      toggleDisplayField(intent.field)
      break
    case 'photoBand':
      // Tapping another band while one is open switches to it: close first,
      // so the panel reverts the old draft and reopens on the tapped band.
      if (photoBandOpen.value && photoBandId.value !== (intent.photoId ?? null)) {
        photoBandOpen.value = false
        void nextTick(() => {
          photoBandId.value = intent.photoId ?? null
          photoBandOpen.value = true
        })
        break
      }
      photoBandId.value = intent.photoId ?? null
      photoBandOpen.value = true
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
