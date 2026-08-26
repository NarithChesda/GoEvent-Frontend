<template>
  <Teleport to="body">
    <!--
      Single app-wide toast stack. Anchored top-center on mobile and top-right on
      desktop: the bottom-right corner belongs to the FAB stack and the mobile tab
      bar, so anchoring there buried toasts under the Telegram FAB.
    -->
    <div
      class="toast-host fixed z-[1100] flex flex-col items-stretch pointer-events-none left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-[26rem] top-[calc(env(safe-area-inset-top,0px)_+_4.5rem)] lg:left-auto lg:right-6 lg:translate-x-0 lg:w-[23rem] lg:top-20"
      role="region"
      :aria-label="t('common.notifications.title')"
      @focusin="pauseToasts"
      @focusout="resumeToasts"
    >
      <TransitionGroup name="toast" tag="div" class="relative flex flex-col gap-2">
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
          <div
            :role="toast.type === 'error' ? 'alert' : 'status'"
            :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
            aria-atomic="true"
            class="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-white/70 bg-white/85 px-3.5 py-3 shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5 backdrop-blur-xl"
          >
            <!-- Type accent: colored icon disc + matching hairline progress bar -->
            <span
              class="mt-px grid h-8 w-8 flex-shrink-0 place-items-center rounded-full"
              :class="STYLES[toast.type].disc"
            >
              <component :is="STYLES[toast.type].icon" class="h-[18px] w-[18px]" />
            </span>

            <div class="min-w-0 flex-1 py-0.5">
              <p class="text-sm font-semibold leading-snug text-slate-900 break-words">
                {{ toast.title }}
              </p>
              <p
                v-if="toast.description"
                class="mt-0.5 text-xs leading-relaxed text-slate-500 break-words"
              >
                {{ toast.description }}
              </p>
            </div>

            <!-- Repeat counter, so a hammered action shows "×3" instead of 3 toasts -->
            <span
              v-if="toast.count > 1"
              class="mt-1 flex-shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500"
            >
              ×{{ toast.count }}
            </span>

            <button
              v-if="toast.dismissible"
              type="button"
              class="-mr-1 mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              :aria-label="t('common.actions.close')"
              @click="dismissToast(toast.id)"
            >
              <X class="h-4 w-4" />
            </button>

            <div
              v-if="toast.duration > 0"
              class="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden"
              aria-hidden="true"
            >
              <div
                :key="`${toast.id}-${toast.count}`"
                class="toast-progress h-full w-full origin-left rounded-full"
                :class="STYLES[toast.type].bar"
                :style="{
                  animationDuration: `${toast.duration}ms`,
                  animationPlayState: isPaused ? 'paused' : 'running',
                }"
              ></div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, type Component } from 'vue'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useAppLanguage } from '../composables/useAppLanguage'
import { useToast, type Toast, type ToastType } from '../composables/useToast'

const { t } = useAppLanguage()
const { toasts, isPaused, dismissToast, pauseToasts, resumeToasts } = useToast()

const STYLES: Record<ToastType, { icon: Component; disc: string; bar: string }> = {
  success: { icon: CheckCircle, disc: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500/70' },
  error: { icon: AlertCircle, disc: 'bg-red-50 text-red-600', bar: 'bg-red-500/70' },
  warning: { icon: AlertTriangle, disc: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500/70' },
  info: { icon: Info, disc: 'bg-sky-50 text-sky-600', bar: 'bg-[#1e90ff]/70' },
}

// --- Swipe / drag to dismiss -------------------------------------------------
// The stack is top-anchored, so flicking a toast upward is the natural gesture.
// Dragging downward rubber-bands instead of moving 1:1.
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
  drag.value.offset = delta < 0 ? delta : delta * 0.2
}

const onPointerEnd = (): void => {
  if (!drag.value) return
  const { id, offset } = drag.value
  drag.value = null
  if (offset < -DISMISS_THRESHOLD) {
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
</script>

<style scoped>
.toast-item {
  /* Own the vertical gesture so a swipe dismisses instead of scrolling the page. */
  touch-action: none;
  will-change: transform, opacity;
  /* Springs back when a drag is released short of the dismiss threshold. */
  transition:
    transform 0.3s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.3s ease;
}

.toast-item--dragging {
  cursor: grabbing;
  /* Track the finger 1:1 while dragging. */
  transition: none;
}

.toast-progress {
  animation-name: toast-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Enter/leave: drop in from above, matching the top anchor. */
.toast-enter-active {
  transition:
    transform 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.28s ease;
}

.toast-leave-active {
  transition:
    transform 0.22s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.18s ease;
  /* Pull the leaving toast out of flow so the survivors glide up smoothly. */
  position: absolute;
  width: 100%;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-14px) scale(0.96);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.toast-move {
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
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

  .toast-progress {
    animation: none;
    transform: scaleX(1);
  }
}
</style>
