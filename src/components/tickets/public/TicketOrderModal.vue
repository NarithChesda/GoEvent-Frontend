<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-[1000] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
          aria-hidden="true"
          @click="emit('close')"
        />

        <!-- Bottom sheet on a phone, centred card from `sm` up. -->
        <div class="relative flex min-h-full items-end sm:items-center justify-center sm:p-4">
          <!--
            The frame carries the shadow because the panel carries the notch
            mask, and a filter on a masked element is clipped along with it —
            the same split the stub card uses. Opening a stub should look like
            the stub itself grew, so the modal wears the same silhouette.
          -->
          <div class="ticket-modal-frame w-full sm:max-w-xl" @click.stop>
            <div
              class="ticket-modal flex flex-col w-full max-h-[92vh] sm:max-h-[88vh] bg-white overflow-hidden"
            >
              <!--
                A slim head above the tear: on a phone it reads as a sheet grab
                bar, on desktop as a title bar. It deliberately holds no copy —
                the sheet below names its own event, states its own status and
                prints its own code, and every one of those repeated up here read
                as a doubling rather than a hierarchy. Its height is fixed
                because the notch mask is cut against it.
              -->
              <header
                class="relative flex-shrink-0 flex items-center justify-end h-12 sm:h-14 px-3 sm:px-4"
              >
                <div
                  class="sm:hidden absolute left-1/2 top-3 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-200"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  class="flex-shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  :aria-label="t('common.actions.close')"
                  @click="emit('close')"
                >
                  <X class="w-5 h-5" />
                </button>
              </header>

              <!-- The tear, sitting exactly where the notches are cut -->
              <div class="ticket-modal-tear flex-shrink-0" aria-hidden="true" />

              <!--
                No padding of its own: the panel draws a single edge-to-edge
                ticket sheet, which is what lets its status band and its footer
                run the full width of the phone instead of floating as cards.
                The slate ground shows only in the home-indicator gutter, where
                it continues the sheet's own footer tone.
              -->
              <div
                class="flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 pb-[env(safe-area-inset-bottom)]"
              >
                <TicketOrderDetailPanel :code="code" :fallback-title="title" embedded />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { X } from 'lucide-vue-next'
import TicketOrderDetailPanel from '@/components/tickets/public/TicketOrderDetailPanel.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = defineProps<{
  show: boolean
  /** Confirmation code of the order to load. */
  code: string
  /** Known event title, so the sheet names its event before the fetch resolves. */
  title?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useAppLanguage()

const onKeydown = (e: KeyboardEvent) => {
  // The refund modal stacks above this one and owns Escape while it is open.
  if (e.key === 'Escape' && !document.querySelector('[data-refund-modal]')) {
    emit('close')
  }
}

watch(
  () => props.show,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown)
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/*
  Ticket silhouette, scaled up from TicketOrderStubCard: the notches are cut at
  `--head-h` from the top, which is where the header ends and the tear is drawn.
*/
.ticket-modal-frame {
  --notch-r: 10px;
  /* h-14 on the head row. Only read by the notch mask, which is itself only
     applied from `sm` up — the shorter `h-12` head below that needs no match,
     since the tear there is a flow element that follows the head whatever
     its height. */
  --head-h: 3.5rem;
  filter: drop-shadow(0 20px 40px rgb(15 23 42 / 0.22)) drop-shadow(0 4px 10px rgb(15 23 42 / 0.12));
}

.ticket-modal {
  border-radius: 1.5rem 1.5rem 0 0;
}

/*
  Notches only once the panel has ground on either side of it. As a full-bleed
  phone sheet its edges are the screen's edges, and a semicircle bitten out of
  those reads as a rendering fault rather than a perforation — the dashed tear
  alone carries the idea there.
*/
@media (min-width: 640px) {
  .ticket-modal {
    border-radius: 1.5rem;
    -webkit-mask:
      radial-gradient(circle var(--notch-r) at 0 var(--head-h), transparent 98%, #000 100%),
      radial-gradient(circle var(--notch-r) at 100% var(--head-h), transparent 98%, #000 100%);
    -webkit-mask-composite: source-in;
    mask:
      radial-gradient(circle var(--notch-r) at 0 var(--head-h), transparent 98%, #000 100%),
      radial-gradient(circle var(--notch-r) at 100% var(--head-h), transparent 98%, #000 100%);
    mask-composite: intersect;
  }
}

.ticket-modal-tear {
  height: 0;
  margin: 0 1rem;
  border-top: 2px dashed rgb(226 232 240); /* slate-200 */
}

/* Modal motion per the design system: fade the overlay, settle the panel. */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .ticket-modal-frame,
.modal-leave-active .ticket-modal-frame {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .ticket-modal-frame,
.modal-leave-to .ticket-modal-frame {
  transform: translateY(24px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active .ticket-modal-frame,
  .modal-leave-active .ticket-modal-frame {
    transition: none;
  }

  .modal-enter-from .ticket-modal-frame,
  .modal-leave-to .ticket-modal-frame {
    transform: none;
  }
}
</style>
