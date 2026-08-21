<template>
  <!--
    The save bar, which exists only when there is something to save.

    In the profile tab it used to render permanently, so most of the time it was
    a floating bar whose whole message was that nothing had happened — chrome
    reporting its own idleness, parked above the tab pill. Gated on the caller's
    dirty state it becomes a response to an edit instead: the bottom of the
    screen is clear until you change something, and the bar arriving *is* the
    notice that you have. A create flow passes `visible` permanently true — there
    the form itself is the thing you opted into, and the way out belongs with the
    way forward.

    It is made of `.glass-pill` — the same surface as the settings tab bar and
    the mobile nav pill — and sized `w-fit` and centred to match, rather than
    built from the toast recipe (§12): a `rounded-2xl` card in one glass sitting
    12px above a `rounded-full` pill in another is two dialects of the same
    material touching, which is what reads as unfinished.

    `--fab-bottom` is the shared slot for anything floating at the bottom edge:
    0-relative on desktop, clearing the floating pill on touch. The settings page
    hides ContactUsFAB, which used to share this exact lane and forced the bar to
    pad its right side out of the way to stay tappable.
  -->
  <Transition name="save-bar">
    <div v-if="visible" class="sticky bottom-[var(--fab-bottom)] z-20 pt-1">
      <div
        class="glass-pill mx-auto flex w-fit max-w-full items-center gap-1.5 rounded-full border border-white/50 p-1.5"
        :class="message ? 'sm:pl-4' : ''"
      >
        <!-- Below `sm` the row only has width for the two controls, so the
             wording stays available to a screen reader rather than truncating to
             a single word. -->
        <p
          v-if="message"
          class="sr-only sm:not-sr-only sm:min-w-0 sm:truncate sm:text-sm sm:text-slate-600"
          aria-live="polite"
        >
          {{ message }}
        </p>

        <button
          v-if="secondaryLabel && !busy"
          type="button"
          class="h-10 flex-shrink-0 whitespace-nowrap rounded-full px-3.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-900/[0.06] active:bg-slate-900/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          @click="$emit('secondary')"
        >
          {{ secondaryLabel }}
        </button>

        <!-- A real submit button: it sits inside the caller's <form>, so Enter in
             a field and a click here go through the same handler. -->
        <button
          type="submit"
          :disabled="!canSave"
          class="inline-flex h-10 flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 text-sm font-semibold text-white shadow-md shadow-[#2ecc71]/20 transition-all duration-200 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        >
          <Loader2 v-if="busy" class="w-4 h-4 animate-spin" aria-hidden="true" />
          <Check v-else class="w-4 h-4" aria-hidden="true" />
          {{ busy ? busyLabel : saveLabel }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Check, Loader2 } from 'lucide-vue-next'

interface Props {
  /** Whether the bar is on screen at all — a dirty flag, or `true` in a create flow. */
  visible: boolean
  /** A request is in flight: the spinner runs and the secondary action stands down. */
  busy?: boolean
  /** Whether submitting would do anything right now. */
  canSave?: boolean
  saveLabel: string
  busyLabel: string
  /** Omit for a bar that only saves. */
  secondaryLabel?: string
  /** The line to the left of the controls, e.g. "Unsaved changes". */
  message?: string
}

withDefaults(defineProps<Props>(), {
  busy: false,
  canSave: true,
  secondaryLabel: undefined,
  message: undefined,
})

defineEmits<{ secondary: [] }>()
</script>

<style scoped>
/* The bar rises out of the bottom edge rather than fading in place — it belongs
   to the same family of floating chrome as the tab pill, and that chrome
   arrives from off-screen. */
.save-bar-enter-active {
  transition:
    transform 0.3s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.2s ease;
}

.save-bar-leave-active {
  transition:
    transform 0.2s cubic-bezier(0.4, 0, 0.6, 1),
    opacity 0.15s ease;
}

.save-bar-enter-from,
.save-bar-leave-to {
  opacity: 0;
  transform: translateY(0.75rem);
}

@media (prefers-reduced-motion: reduce) {
  .save-bar-enter-active,
  .save-bar-leave-active {
    transition: opacity 0.15s ease;
  }

  .save-bar-enter-from,
  .save-bar-leave-to {
    transform: none;
  }
}
</style>
