<template>
  <Teleport to="body">
    <!--
      Single app-wide toast stack.

      Desktop: bottom-right — the corner people expect a notification in — but
      *beside* the floating action column, never on top of it. `--toast-right`
      is that column's full lane width, published by MainLayout alongside the
      other bottom-chrome slots, so the stack shares the FAB's baseline and
      grows upward without ever covering a button. Anchoring in the corner
      itself is what drove this stack to the top of the screen originally; the
      fix was a lane, not a different corner.

      Mobile: top-centre, one bar at a time. The bottom of a phone viewport is
      entirely spoken for — the floating tab bar, then up to two FABs above it
      — so a bottom-anchored toast there would either sit ~200px off the edge
      or block the chrome. A single compact bar dropping from the top is the
      platform convention and costs one row of the screen.
    -->
    <div
      class="toast-host fixed z-[1100] flex flex-col pointer-events-none left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-[24rem] top-[calc(env(safe-area-inset-top,0px)_+_4.5rem)] lg:left-auto lg:translate-x-0 lg:top-auto lg:w-[20.5rem] lg:right-[var(--toast-right,6rem)] lg:bottom-[var(--fab-bottom,1rem)]"
      role="region"
      :aria-label="t('common.notifications.title')"
      @focusin="pauseToasts"
      @focusout="resumeToasts"
    >
      <TransitionGroup name="toast" tag="div" class="relative flex flex-col gap-2" @leave="onLeave">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item pointer-events-auto w-full"
          :class="{ 'toast-item--dragging': drag?.id === toast.id }"
          :style="dragStyle(toast.id)"
          @pointerenter="pauseToasts"
          @pointerleave="resumeToasts"
          @pointerdown="onPointerDown($event, toast)"
          @pointermove="onPointerMove"
          @pointerup="onPointerEnd"
          @pointercancel="onPointerEnd"
        >
          <!--
            A quiet glass row, not a status banner: the type reads from a small
            icon disc and nothing else. The full-bleed coloured countdown bar
            this replaced was the loudest thing on the page for a message that
            says "copied", and the only place in the app painting a saturated
            band edge to edge. Hover still pauses the timer — the bar was never
            the affordance, only its decoration.
          -->
          <div
            :role="toast.type === 'error' ? 'alert' : 'status'"
            :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
            aria-atomic="true"
            class="relative flex gap-2.5 overflow-hidden rounded-xl border border-white/70 bg-white/95 px-3 py-2.5 shadow-lg shadow-slate-900/[0.08] ring-1 ring-slate-900/[0.06] backdrop-blur-xl"
            :class="toast.description ? 'items-start' : 'items-center'"
          >
            <span
              class="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full"
              :class="STYLES[toast.type].disc"
            >
              <component :is="STYLES[toast.type].icon" class="h-3.5 w-3.5" />
            </span>

            <div class="min-w-0 flex-1">
              <p class="text-[13px] font-semibold leading-snug text-slate-900 line-clamp-2">
                {{ toast.title }}
              </p>
              <p
                v-if="toast.description"
                class="mt-0.5 text-xs leading-snug text-slate-500 line-clamp-2"
              >
                {{ toast.description }}
              </p>
            </div>

            <!-- Repeat counter, so a hammered action shows "×3" instead of 3 toasts -->
            <span
              v-if="toast.count > 1"
              class="flex-shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500"
              :class="toast.description ? 'mt-0.5' : ''"
            >
              ×{{ toast.count }}
            </span>

            <button
              v-if="toast.dismissible"
              type="button"
              class="relative -mr-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-md text-slate-400 transition-colors duration-150 after:absolute after:-inset-2 after:content-[''] hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              :class="toast.description ? 'mt-px' : ''"
              :aria-label="t('common.actions.close')"
              @click="dismissToast(toast.id)"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useAppLanguage } from '../composables/useAppLanguage'
import { useToast, type Toast, type ToastType } from '../composables/useToast'

const { t } = useAppLanguage()
const { toasts, dismissToast, pauseToasts, resumeToasts } = useToast()

// Status colours are DESIGN.md §2.3's, not a palette of the toast's own: green
// for success (the brand's `#2ecc71` sits in `green`, not `emerald`), red for
// failure, amber for warning, brand blue for info.
const STYLES: Record<ToastType, { icon: Component; disc: string }> = {
  success: { icon: CheckCircle, disc: 'bg-green-50 text-green-600' },
  error: { icon: AlertCircle, disc: 'bg-red-50 text-red-600' },
  warning: { icon: AlertTriangle, disc: 'bg-amber-50 text-amber-600' },
  info: { icon: Info, disc: 'bg-sky-50 text-[#1e90ff]' },
}

// --- Anchor ------------------------------------------------------------------
// The stack hangs from the top on a phone and rises from the bottom on a
// desktop, so "swipe it away" is a different direction on each. Everything that
// depends on the anchor reads this one flag; the enter/leave transforms mirror
// it in CSS at the same breakpoint.
const DESKTOP_QUERY = '(min-width: 1024px)'
const isBottomAnchored = ref(false)
let anchorQuery: MediaQueryList | null = null

const syncAnchor = (event: MediaQueryList | MediaQueryListEvent): void => {
  isBottomAnchored.value = event.matches
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  anchorQuery = window.matchMedia(DESKTOP_QUERY)
  syncAnchor(anchorQuery)
  anchorQuery.addEventListener('change', syncAnchor)
})

onBeforeUnmount(() => {
  anchorQuery?.removeEventListener('change', syncAnchor)
})

// --- Swipe / drag to dismiss -------------------------------------------------
// Dismissal always travels away from the anchored edge; dragging back towards
// it rubber-bands instead of moving 1:1.
const DISMISS_THRESHOLD = 56
const FADE_DISTANCE = 120

const drag = ref<{ id: string; startY: number; offset: number } | null>(null)

const onPointerDown = (event: PointerEvent, toast: Toast): void => {
  if (!toast.dismissible) return
  if (event.pointerType === 'mouse' && event.button !== 0) return
  // Let the dismiss button handle its own clicks.
  if ((event.target as HTMLElement).closest('button')) return

  drag.value = { id: toast.id, startY: event.clientY, offset: 0 }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

const onPointerMove = (event: PointerEvent): void => {
  if (!drag.value) return
  const delta = event.clientY - drag.value.startY
  const awayFromAnchor = isBottomAnchored.value ? delta > 0 : delta < 0
  drag.value.offset = awayFromAnchor ? delta : delta * 0.2
}

const onPointerEnd = (): void => {
  if (!drag.value) return
  const { id, offset } = drag.value
  drag.value = null
  const travelled = isBottomAnchored.value ? offset : -offset
  if (travelled > DISMISS_THRESHOLD) {
    dismissToast(id)
  }
}

const dragStyle = (id: string): Record<string, string> => {
  if (drag.value?.id !== id) return {}
  const { offset } = drag.value
  return {
    transform: `translateY(${offset}px)`,
    opacity: String(Math.max(1 - Math.abs(offset) / FADE_DISTANCE, 0.2)),
  }
}

/**
 * Pin a leaving toast to the spot it already occupies before it drops out of
 * flow, so the survivors can glide into the gap.
 *
 * `position: absolute` alone — the documented TransitionGroup recipe — sends a
 * flex child to the *container's* start rather than to its own laid-out
 * position, which is invisible only while the departing toast happens to be the
 * first one. Swipe the middle of a three-high desktop stack and it would jump
 * to the top before fading.
 */
const onLeave = (el: Element): void => {
  const node = el as HTMLElement
  const parent = node.offsetParent as HTMLElement | null
  if (!parent) return
  const rect = node.getBoundingClientRect()
  const parentRect = parent.getBoundingClientRect()
  node.style.top = `${rect.top - parentRect.top}px`
  node.style.width = `${rect.width}px`
}
</script>

<style scoped>
/* Strong ease-out — the built-in curve is too soft to read as deliberate. */
.toast-host {
  --toast-ease: cubic-bezier(0.32, 0.72, 0, 1);
}

.toast-item {
  /* Own the vertical gesture so a swipe dismisses instead of scrolling the page. */
  touch-action: none;
  will-change: transform, opacity;
  /* Springs back when a drag is released short of the dismiss threshold. */
  transition:
    transform 0.3s var(--toast-ease),
    opacity 0.3s ease;
}

.toast-item--dragging {
  cursor: grabbing;
  /* Track the finger 1:1 while dragging. */
  transition: none;
}

/* Enter/leave through the anchored edge, so a swipe-to-dismiss reads as the
   entrance reversed: down from the top on mobile, up from the bottom on desktop. */
.toast-enter-active {
  transition:
    transform 0.26s var(--toast-ease),
    opacity 0.2s ease-out;
}

.toast-leave-active {
  transition:
    transform 0.18s var(--toast-ease),
    opacity 0.14s ease-out;
  /* Pull the leaving toast out of flow so the survivors glide into the gap. */
  position: absolute;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.97);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

@media (min-width: 1024px) {
  .toast-enter-from {
    transform: translateY(12px) scale(0.97);
  }

  .toast-leave-to {
    transform: translateY(8px) scale(0.97);
  }
}

.toast-move {
  transition: transform 0.24s var(--toast-ease);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition-duration: 0.01ms;
  }

  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>
