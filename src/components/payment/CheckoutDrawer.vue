<template>
  <Teleport to="body">
    <Transition name="drawer-backdrop">
      <div
        v-if="open"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="drawer-panel">
      <div
        v-if="open"
        ref="panel"
        class="checkout-drawer fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[32.5rem] laptop-sm:w-[35rem] laptop-md:w-[38.75rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        @click.stop
      >
        <!--
          The header is the only gradient object in the drawer (goevent-design
          §10 fixes it there), which is why the transfer instructions below use
          slate-900 for their one dark action rather than a second gradient.
        -->
        <header
          class="checkout-drawer__header flex-shrink-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
        >
          <div class="flex items-center gap-2 px-2 py-2.5 sm:px-3">
            <button
              type="button"
              class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg drawer-close hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              :title="t('common.actions.close')"
              :aria-label="t('common.actions.close')"
              @click="emit('close')"
            >
              <ArrowRight class="h-5 w-5 text-white" aria-hidden="true" />
            </button>
            <div class="min-w-0 flex-1">
              <p
                v-if="eyebrow"
                class="truncate text-[0.625rem] font-medium uppercase tracking-wide text-white/80"
              >
                {{ eyebrow }}
              </p>
              <h2 class="truncate text-base font-semibold leading-tight text-white">
                {{ title }}
              </h2>
            </div>
            <slot name="header-action" />
          </div>
        </header>

        <div class="checkout-drawer__body flex-1 overflow-y-auto overscroll-contain">
          <div class="space-y-4 p-4 laptop-sm:space-y-5 laptop-sm:p-5">
            <slot />
          </div>
        </div>

        <!--
          Anything the footer says stays next to the button that produced it —
          a validation error rendered at the end of the scroll body can sit off
          screen at exactly the moment the organizer presses submit again.
        -->
        <div
          v-if="$slots.footer"
          class="checkout-drawer__footer flex-shrink-0 border-t border-slate-200 bg-white px-4 pt-3"
        >
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * The shell both GoEvent checkouts are poured into — template activation and
 * the partner credit-pack order.
 *
 * They had each carried their own copy of the panel, the gradient header, the
 * scroll body, the footer and the four transitions, which is how one of them
 * ended up with Escape-to-close and `role="dialog"` and the other without. The
 * two purchases a partner makes should not be able to drift apart in chrome.
 *
 * Mobile is the constrained case and drives the layout: a full-height sheet
 * whose header clears the notch and whose footer clears the home indicator,
 * with the safe-area padding dropped again once the panel floats at `md`.
 */
import { nextTick, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRight } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  title: string
  /** Small line above the title — what is being paid for. */
  eyebrow?: string | null
}>()

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

const panel = ref<HTMLElement | null>(null)

/** Escape closes the drawer — §10, and the only exit on a keyboard. */
const onKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') emit('close')
}

const releaseScroll = (): void => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      document.addEventListener('keydown', onKeydown)
      // Lock the page behind, compensating for the scrollbar's own width so it
      // doesn't visibly shift as the drawer opens.
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
      // Move focus into the dialog so the first Tab lands on the close button
      // rather than continuing through the page underneath.
      await nextTick()
      panel.value?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      releaseScroll()
    }
  },
)

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  releaseScroll()
})
</script>

<style scoped>
/* Full-height sheet on a phone: the header meets the notch and the footer meets
   the home indicator. Once the panel floats away from the edges at `md`, both
   insets belong to the page again, not to the drawer. */
.checkout-drawer__header {
  padding-top: env(safe-area-inset-top, 0px);
}

.checkout-drawer__footer {
  padding-bottom: max(env(safe-area-inset-bottom, 0px), 0.75rem);
}

@media (min-width: 768px) {
  .checkout-drawer__header {
    padding-top: 0;
  }

  .checkout-drawer__footer {
    padding-bottom: 0.75rem;
  }}

/* Thin scrollbar on the one element that scrolls — §10. */
.checkout-drawer__body::-webkit-scrollbar {
  width: 6px;
}

.checkout-drawer__body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.checkout-drawer__body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}</style>
