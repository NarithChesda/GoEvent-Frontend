<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="onClose"
      />
    </Transition>

    <!-- Drawer Panel — matches the QuickAddModal style guide: full-height on
         mobile (not a bottom sheet), white chrome, and the same responsive
         width steps used across other drawers in the platform. -->
    <Transition name="slide-right">
      <div
        v-if="show"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] laptop-sm:w-[560px] laptop-md:w-[620px] desktop:w-[680px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <!-- Loading -->
        <div v-if="isLoading" class="flex-1 flex items-center justify-center p-12">
          <div class="text-center">
            <div class="w-10 h-10 mx-auto mb-3 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p class="text-sm text-slate-500">{{ t('management.tickets.scan.title') }}…</p>
          </div>
        </div>

        <!-- Load error -->
        <div v-else-if="loadError" class="flex-1 flex items-center justify-center p-6">
          <div class="text-center max-w-sm">
            <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle class="w-6 h-6 text-red-600" />
            </div>
            <p class="text-sm text-slate-700 mb-5">{{ loadError }}</p>
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md"
              @click="onClose"
            >
              {{ t('management.tickets.scan.actions.exit') }}
            </button>
          </div>
        </div>

        <!-- Permission denied -->
        <div v-else-if="!canScan" class="flex-1 flex items-center justify-center p-6">
          <div class="text-center max-w-sm">
            <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Lock class="w-7 h-7 text-slate-400" />
            </div>
            <h2 class="text-lg font-semibold text-slate-900 mb-2">
              {{ t('management.tickets.accessRestricted.title') }}
            </h2>
            <p class="text-sm text-slate-600 mb-6">
              {{ t('management.tickets.scan.access.restricted') }}
            </p>
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md"
              @click="onClose"
            >
              {{ t('management.tickets.scan.actions.exit') }}
            </button>
          </div>
        </div>

        <!-- Scanner UI -->
        <template v-else>
          <ScanHeader
            :event-title="event?.title ?? ''"
            :checked-in="checkedInCount"
            :total="totalIssued"
            :sound-enabled="feedback.soundEnabled.value"
            :gates-active="(allowedTierIds?.length ?? 0) > 0"
            :gate-label="gateLabel"
            :gate-config-open="showGateConfig"
            :pending-count="queue.pendingCount.value"
            :is-online="queue.isOnline.value"
            :is-flushing="queue.isFlushing.value"
            @back="onClose"
            @toggle-sound="feedback.toggleSound()"
            @toggle-gate-config="showGateConfig = !showGateConfig"
            @flush-queue="() => queue.flush()"
          />

          <ScanGateScopePanel
            :open="showGateConfig"
            :tiers="tiers"
            :allowed-tier-ids="allowedTierIds"
            @change="onGateScopeChange"
          />

          <main class="flex-1 overflow-y-auto overscroll-contain bg-slate-50 px-3 sm:px-4 py-3 sm:py-4 space-y-3">
            <ScanCaptureArea
              ref="captureRef"
              v-model:mode="mode"
              :disabled="checkIn.isScanning.value"
              @qr-scan="onCameraScan"
              @qr-error="onCameraError"
              @manual-submit="onManualSubmit"
            />

            <ScanOutcomeBanner
              :outcome="checkIn.lastOutcome.value"
              @dismiss="rearm"
            />

            <ScanActionRow
              :can-rearm="checkIn.lastOutcome.value !== null"
              :can-undo="undoer.canUndo.value"
              :undo-seconds-left="undoSecondsLeft"
              :is-undoing="undoer.isUndoing.value"
              @rearm="rearm"
              @undo="onUndo"
            />

            <ScanRecentList
              v-model:open="recentOpen"
              :recent="checkIn.recent.value"
            />
          </main>
        </template>

        <!-- Toast — anchored to drawer, not viewport, so it doesn't fight
             with toasts the parent page may be showing. -->
        <Transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-150"
          enter-from-class="opacity-0 -translate-y-2"
          leave-to-class="opacity-0"
        >
          <div
            v-if="toast"
            class="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium shadow-lg z-[1000]"
            :class="toast.kind === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'"
          >
            {{ toast.text }}
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { AlertCircle, Lock } from 'lucide-vue-next'

import ScanHeader from './ScanHeader.vue'
import ScanCaptureArea from './ScanCaptureArea.vue'
import ScanOutcomeBanner from './ScanOutcomeBanner.vue'
import ScanActionRow from './ScanActionRow.vue'
import ScanRecentList from './ScanRecentList.vue'
import ScanGateScopePanel from './ScanGateScopePanel.vue'

import { useAppLanguage } from '@/composables/useAppLanguage'
import { eventsService } from '@/services/api/modules/events.service'
import { ticketTypesService } from '@/services/api/modules/ticket-types.service'
import { ticketAnalyticsService } from '@/services/api/modules/ticket-analytics.service'
import { useTicketCheckIn, type ScanOutcome } from '@/composables/tickets/useTicketCheckIn'
import { useScanQueue } from '@/composables/tickets/useScanQueue'
import { useUndoCheckIn } from '@/composables/tickets/useUndoCheckIn'
import { useScanFeedback, type FeedbackKind } from '@/composables/tickets/useScanFeedback'
import type { Event } from '@/services/api/types'
import type {
  TicketAnalytics,
  TicketType,
} from '@/services/api/types/ticket.types'

// ------------------------------------------------------------------ const
const ANALYTICS_POLL_MS = 30_000
const DEVICE_ID_KEY = 'scan:device-id'
const gatesKeyFor = (eventId: string) => `scan:gates:${eventId}`

// ------------------------------------------------------------------ props
interface Props {
  show: boolean
  eventId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  close: []
}>()

const { t } = useAppLanguage()

// ------------------------------------------------------------- device id
function loadOrCreateDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY)
    if (existing) return existing
  } catch {
    // localStorage may be unavailable.
  }
  const fresh = `scanner-${Math.random().toString(16).slice(2, 10)}`
  try {
    window.localStorage.setItem(DEVICE_ID_KEY, fresh)
  } catch {
    // ignore
  }
  return fresh
}
const deviceId = ref(loadOrCreateDeviceId())

// --------------------------------------------------------- gate scoping
const allowedTierIds = ref<number[] | null>(null)
const showGateConfig = ref(false)

function loadGateConfig() {
  try {
    const raw = window.localStorage.getItem(gatesKeyFor(props.eventId))
    if (!raw) {
      allowedTierIds.value = null
      return
    }
    const parsed: unknown = JSON.parse(raw)
    allowedTierIds.value = Array.isArray(parsed) && parsed.length > 0
      ? (parsed as number[])
      : null
  } catch {
    allowedTierIds.value = null
  }
}

// Auto-save: every toggle in ScanGateScopePanel emits the new tier list,
// which we persist immediately. The panel itself stays open so staff can
// add/remove more tiers without re-tapping the gear.
function onGateScopeChange(next: number[]) {
  if (next.length === 0) {
    allowedTierIds.value = null
    try { window.localStorage.removeItem(gatesKeyFor(props.eventId)) } catch { /* ignore */ }
    return
  }
  allowedTierIds.value = [...next]
  try {
    window.localStorage.setItem(gatesKeyFor(props.eventId), JSON.stringify(allowedTierIds.value))
  } catch {
    // ignore
  }
}

// Compact label for the header chip. Single-tier shows the name (e.g. "VIP"),
// multi-tier shows "VIP +N" so the active scope is visible at a glance —
// the full list lives inside the inline panel.
const gateLabel = computed(() => {
  const ids = allowedTierIds.value ?? []
  if (ids.length === 0) return ''
  const first = tiers.value.find((tier) => tier.id === ids[0])
  if (!first) return String(ids.length)
  if (ids.length === 1) return first.name
  return `${first.name} +${ids.length - 1}`
})

// ----------------------------------------------------------- composables
const eventIdRef = computed(() => props.eventId)

// Offline queue: scans pre-enqueue here before the live request fires, the
// flusher drains via batchSync when connectivity is back. Once a flush
// confirms a row, refresh analytics so the live counter picks up the entry.
const queue = useScanQueue({
  eventId: eventIdRef,
  onResultProcessed: () => {
    void loadAnalytics()
  },
})

const checkIn = useTicketCheckIn({
  eventId: eventIdRef,
  deviceId,
  allowedTierIds,
  queue,
})

const undoer = useUndoCheckIn(() => deviceId.value)
const feedback = useScanFeedback()

// ------------------------------------------------------------------ event
const event = ref<Event | null>(null)
const isLoadingEvent = ref(false)
const loadError = ref<string | null>(null)
const tiers = ref<TicketType[]>([])
const analytics = ref<TicketAnalytics | null>(null)

const canScan = computed(() => Boolean(event.value?.can_edit))
const isLoading = computed(() => isLoadingEvent.value)
const totalIssued = computed(() => analytics.value?.summary.tickets_issued ?? 0)
const checkedInCount = computed(() => analytics.value?.summary.tickets_used ?? 0)

async function loadEvent() {
  isLoadingEvent.value = true
  loadError.value = null
  const response = await eventsService.getEvent(props.eventId)
  if (!response.success || !response.data) {
    loadError.value = response.message ?? 'Could not load event.'
    isLoadingEvent.value = false
    return
  }
  event.value = response.data
  isLoadingEvent.value = false
}

async function loadTiers() {
  if (!canScan.value) return
  const response = await ticketTypesService.list(props.eventId)
  if (response.success && Array.isArray(response.data)) {
    tiers.value = response.data
  }
}

async function loadAnalytics() {
  if (!canScan.value) return
  const response = await ticketAnalyticsService.getAnalytics(props.eventId)
  if (response.success && response.data) {
    analytics.value = response.data
  }
}

let analyticsTimer: number | null = null
function startAnalyticsPolling() {
  stopAnalyticsPolling()
  analyticsTimer = window.setInterval(() => {
    void loadAnalytics()
  }, ANALYTICS_POLL_MS)
}
function stopAnalyticsPolling() {
  if (analyticsTimer !== null) {
    window.clearInterval(analyticsTimer)
    analyticsTimer = null
  }
}

// -------------------------------------------------------------- scan flow
type Mode = 'qr' | 'manual'
const mode = ref<Mode>('qr')
const recentOpen = ref(false)
const captureRef = ref<InstanceType<typeof ScanCaptureArea> | null>(null)

interface ToastState { kind: 'info' | 'error'; text: string }
const toast = ref<ToastState | null>(null)
let toastTimer: number | null = null
function showToast(kind: ToastState['kind'], text: string) {
  toast.value = { kind, text }
  if (toastTimer !== null) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.value = null }, 2400)
}

function feedbackKindFor(outcome: ScanOutcome): FeedbackKind {
  switch (outcome.kind) {
    case 'entry':
      return 'entry'
    case 'reentry':
      return 'reentry'
    // Treat 'queued' as a positive "let them in" feedback — the door
    // keeps moving and the audit trail catches up later.
    case 'queued':
      return 'entry'
    case 'rejected':
    case 'wrong_event':
      return 'rejected'
    case 'invalid':
    case 'network_error':
      return 'invalid'
  }
}

async function runScan(code: string, source: 'qr' | 'manual') {
  const outcome = await checkIn.scan(code, source)
  feedback.trigger(feedbackKindFor(outcome))

  if (outcome.kind === 'entry' && analytics.value) {
    analytics.value = {
      ...analytics.value,
      summary: {
        ...analytics.value.summary,
        tickets_used: analytics.value.summary.tickets_used + 1,
      },
    }
  }

  if (outcome.kind === 'entry') {
    undoer.record({
      code,
      ticket: outcome.ticket,
      scannedAt: Date.now(),
    })
  }

  void loadAnalytics()
}

async function onCameraScan(code: string) {
  if (checkIn.isScanning.value) return
  await runScan(code, 'qr')
}

function onCameraError(message: string) {
  showToast('error', message || t('management.tickets.scan.errors.scanFailed'))
}

async function onManualSubmit(code: string) {
  if (checkIn.isScanning.value) return
  await runScan(code, 'manual')
}

function rearm() {
  checkIn.clearLast()
  if (mode.value === 'manual') {
    captureRef.value?.focus()
  }
}

async function onUndo() {
  const result = await undoer.undo()
  if (result.kind === 'success') {
    showToast('info', t('management.tickets.scan.undo.success'))
    if (analytics.value) {
      analytics.value = {
        ...analytics.value,
        summary: {
          ...analytics.value.summary,
          tickets_used: Math.max(0, analytics.value.summary.tickets_used - 1),
        },
      }
    }
    void loadAnalytics()
  } else if (result.kind === 'expired') {
    showToast('error', t('management.tickets.scan.undo.expired'))
  } else if (result.kind === 'error') {
    showToast('error', result.rawMessage)
  }
}

const undoSecondsLeft = computed(() => Math.ceil(undoer.remainingMs.value / 1000))

// -------------------------------------------------------- close handlers
function onClose() {
  emit('update:show', false)
  emit('close')
}

// ----------------------------------------------------------- body scroll
function getScrollbarWidth(): number {
  return window.innerWidth - document.documentElement.clientWidth
}

function lockBodyScroll() {
  const scrollbarWidth = getScrollbarWidth()
  document.body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`
  }
}
function unlockBodyScroll() {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
}

// -------------------------------------------------------- visibility lifecycle
// Each time the drawer opens we (re)load event + analytics + tiers and
// start polling. On close we tear everything down so the camera's getUserMedia
// stream is released and the analytics interval stops.
watch(
  () => props.show,
  async (isOpen) => {
    if (isOpen) {
      lockBodyScroll()
      loadGateConfig()
      // Reset transient UI state on each open so a previous shift's banner
      // doesn't reappear.
      checkIn.clearLast()
      undoer.clear()
      mode.value = 'qr'
      // Re-read the queue from storage in case rows were enqueued from a
      // previous shift on the same device, and start the auto-flush loop.
      queue.refresh()
      queue.startAutoFlush()
      await loadEvent()
      if (canScan.value) {
        await Promise.all([loadTiers(), loadAnalytics()])
        startAnalyticsPolling()
      }
    } else {
      unlockBodyScroll()
      stopAnalyticsPolling()
      queue.stopAutoFlush()
      showGateConfig.value = false
      if (toastTimer !== null) {
        window.clearTimeout(toastTimer)
        toast.value = null
      }
    }
  },
  { immediate: true },
)

// Refresh analytics when the page regains visibility — staff might have
// scanned on another device while the drawer was backgrounded.
function onVisibilityChange() {
  if (props.show && !document.hidden && canScan.value) void loadAnalytics()
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', onVisibilityChange)
}

onUnmounted(() => {
  unlockBodyScroll()
  stopAnalyticsPolling()
  if (toastTimer !== null) window.clearTimeout(toastTimer)
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
})
</script>

<style scoped>
/* Match the registration-modal + order-review-drawer transitions. */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
