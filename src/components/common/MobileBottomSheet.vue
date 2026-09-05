<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div
        v-if="show"
        class="sm:hidden fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm"
        @click="$emit('close')"
      />
    </Transition>
    <Transition name="sheet-slide">
      <div
        v-if="show"
        ref="panelRef"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        class="sm:hidden fixed inset-x-0 bottom-0 z-[999] bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      >
        <!-- Drag-to-close area: handle + title, kept out of the scrollable
             body so the gesture doesn't fight list scrolling -->
        <div
          class="flex-shrink-0 touch-none"
          @touchstart.passive="onDragStart"
          @touchmove.passive="onDragMove"
          @touchend="onDragEnd"
          @touchcancel="onDragEnd"
        >
          <div class="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-3" aria-hidden="true" />
          <!-- Two title tones, because a sheet is titled by two different
               kinds of thing. A picker is headed by what it filters — a label,
               and labels are set as micro-headings. A sheet about one record is
               headed by that record's *name*, and a name set in tracked
               uppercase grey reads as a category rather than as the person you
               just pressed. -->
          <h3
            v-if="title"
            class="px-5 pt-4 pb-1"
            :class="prominentTitle
              ? 'text-base font-semibold text-slate-900'
              : 'text-xs font-semibold uppercase tracking-wider text-slate-500'"
          >
            {{ title }}
          </h3>
        </div>

        <div class="flex-1 overflow-y-auto overscroll-contain">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{
  show: boolean
  title?: string
  /** Set the title as a name rather than as a category label. */
  prominentTitle?: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const panelRef = ref<HTMLElement | null>(null)

// --- Swipe-down-to-close (same gesture as the notifications sheet) ---
const CLOSE_DISTANCE_PX = 120
const CLOSE_VELOCITY_PX_PER_MS = 0.5
let dragging = false
let dragStartY = 0
let dragOffset = 0
let dragStartedAt = 0

function onDragStart(event: TouchEvent) {
  dragging = true
  dragStartY = event.touches[0].clientY
  dragOffset = 0
  dragStartedAt = Date.now()
  if (panelRef.value) panelRef.value.style.transition = 'none'
}

function onDragMove(event: TouchEvent) {
  if (!dragging) return
  dragOffset = Math.max(0, event.touches[0].clientY - dragStartY)
  if (panelRef.value) panelRef.value.style.transform = `translateY(${dragOffset}px)`
}

function onDragEnd() {
  if (!dragging) return
  dragging = false

  const elapsedMs = Math.max(Date.now() - dragStartedAt, 1)
  const velocity = dragOffset / elapsedMs
  const shouldClose = dragOffset > CLOSE_DISTANCE_PX || velocity > CLOSE_VELOCITY_PX_PER_MS

  const panel = panelRef.value
  if (!panel) {
    if (shouldClose) emit('close')
    return
  }

  panel.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1)'
  if (shouldClose) {
    panel.style.transform = 'translateY(100%)'
    const handleTransitionEnd = () => {
      panel.removeEventListener('transitionend', handleTransitionEnd)
      emit('close')
    }
    panel.addEventListener('transitionend', handleTransitionEnd)
  } else {
    panel.style.transform = ''
  }
}

// --- Body scroll lock (mobile viewports only — the same `show` state may
// drive a desktop dropdown that must not lock the page) ---
const isMobileViewport = () => window.matchMedia('(max-width: 639px)').matches

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.show,
  (show) => {
    if (show) {
      if (isMobileViewport()) document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscape)
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.25s ease;
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sheet-slide-enter-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.sheet-slide-enter-from,
.sheet-slide-leave-to {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .sheet-slide-enter-active,
  .sheet-slide-leave-active,
  .sheet-fade-enter-active,
  .sheet-fade-leave-active {
    transition: none;
  }
}
</style>
