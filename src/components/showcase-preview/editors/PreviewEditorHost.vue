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
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, toRef } from 'vue'
import { useMediaUpload } from '@/composables/useMediaUpload'
import { useNotifications } from '@/composables/useNotifications'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { parsePreviewBridgeMessage } from '../bridge/previewBridge'
import type { EditIntent } from '../edit/editContext'
import { hostsService, type Event, type EventHost } from '@/services/api'
import GmapEmbedModal from './GmapEmbedModal.vue'
import EditHostDrawer from '@/components/EditHostDrawer.vue'
import UploadMediaDrawer from '@/components/UploadMediaDrawer.vue'

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

// --- Intent routing --------------------------------------------------------
const handleIntent = (intent: EditIntent) => {
  switch (intent.kind) {
    case 'eventLogo':
      logoInputRef.value?.click()
      break
    case 'gmapEmbed':
      gmapOpen.value = true
      break
    case 'hostImage':
      openHostEditor(intent.hostId)
      break
    case 'photos':
      photosOpen.value = true
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
