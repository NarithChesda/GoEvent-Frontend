<template>
  <div class="ticket-container">
    <article class="ticket">
      <!-- Main: gradient header + body with QR -->
      <div class="ticket-main">
        <!-- Gradient header strip -->
        <header class="ticket-header">
          <div class="flex items-center gap-2 min-w-0">
            <Ticket class="w-4 h-4 text-white/90 flex-shrink-0" />
            <span class="text-[11px] font-semibold uppercase tracking-wider text-white/90 truncate">
              {{ ticket.ticket_type.name }}
            </span>
          </div>
          <span
            :class="[
              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide flex-shrink-0',
              statusClasses,
            ]"
          >
            {{ statusLabel }}
          </span>
        </header>

        <!-- Body: QR code + check-in code -->
        <div class="ticket-body flex flex-col items-center text-center gap-3">
          <div
            class="relative w-44 h-44 sm:w-48 sm:h-48 bg-white rounded-2xl flex items-center justify-center p-3 ring-1 ring-slate-200"
          >
            <img
              v-if="qrDataUrl"
              :src="qrDataUrl"
              :alt="t('events.tickets.order.qrAlt')"
              class="w-full h-full object-contain"
            />
            <div
              v-else-if="qrError"
              class="text-xs text-slate-400 px-2 leading-relaxed"
            >
              {{ t('events.tickets.order.qrUnavailable') }}
            </div>
            <div
              v-else
              class="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"
            />
          </div>

          <div>
            <p class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              {{ t('events.tickets.order.checkInCodeLabel') }}
            </p>
            <p class="font-mono text-base sm:text-lg font-bold text-slate-900 tracking-[0.2em] tabular-nums px-3 py-1.5 inline-block rounded-lg bg-slate-50">
              {{ ticket.check_in_code }}
            </p>
          </div>
        </div>
      </div>

      <!-- Perforation between body and stub -->
      <div class="ticket-perforation" aria-hidden="true">
        <div class="perforation-line" />
      </div>

      <!-- Stub: attendee details -->
      <div class="ticket-stub">
        <p class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
          {{ t('events.tickets.order.attendeeLabel') }}
        </p>
        <p class="text-sm font-semibold text-slate-800 break-words leading-tight">
          {{ ticket.attendee_name }}
        </p>
        <p class="text-xs text-slate-500 break-all mt-0.5">
          {{ ticket.attendee_email }}
        </p>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Ticket } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { renderTicketQrDataUrl } from '@/utils/qrcode'
import type { Ticket as TicketType } from '@/services/api'

interface Props {
  ticket: TicketType
}

const props = defineProps<Props>()
const { t } = useAppLanguage()

const qrDataUrl = ref<string | null>(null)
const qrError = ref(false)

const renderQr = async (value: string) => {
  qrError.value = false
  qrDataUrl.value = null
  try {
    qrDataUrl.value = await renderTicketQrDataUrl(value, { width: 220 })
  } catch {
    qrError.value = true
  }
}

onMounted(() => {
  if (props.ticket.qr_code) renderQr(props.ticket.qr_code)
})

watch(
  () => props.ticket.qr_code,
  (next) => {
    if (next) renderQr(next)
  },
)

const statusLabel = computed(() => {
  return t(`events.tickets.order.ticketStatus.${props.ticket.status}`)
})

// Status pill on the gradient header — keep it light so the colour reads
// against the green→blue background.
const statusClasses = computed(() => {
  switch (props.ticket.status) {
    case 'valid':
      return 'bg-white/95 text-emerald-700'
    case 'used':
      return 'bg-white/95 text-sky-700'
    case 'refunded':
    case 'cancelled':
      return 'bg-white/95 text-rose-700'
    default:
      return 'bg-white/90 text-slate-700'
  }
})
</script>

<style scoped>
/* Ticket-style chrome — outer shadow via filter:drop-shadow so it traces
 * the actual silhouette (including the carved-out notches) rather than
 * getting clipped at a rectangular bounding box. */
.ticket-container {
  filter: drop-shadow(0 4px 6px rgb(0 0 0 / 0.07))
    drop-shadow(0 2px 4px rgb(0 0 0 / 0.05));
}

/* Real semicircular cutouts carved from the ticket shape via radial-gradient
 * masks composited with intersect. The page background shows through the
 * notches, so they read as crescents regardless of what's behind. */
.ticket {
  position: relative;
  background: white;
  border-radius: 16px;
  --notch-r: 9px;
  --notch-y: 70%;
  -webkit-mask:
    radial-gradient(circle var(--notch-r) at 0 var(--notch-y), transparent 98%, #000 100%),
    radial-gradient(circle var(--notch-r) at 100% var(--notch-y), transparent 98%, #000 100%);
  -webkit-mask-composite: source-in;
  mask:
    radial-gradient(circle var(--notch-r) at 0 var(--notch-y), transparent 98%, #000 100%),
    radial-gradient(circle var(--notch-r) at 100% var(--notch-y), transparent 98%, #000 100%);
  mask-composite: intersect;
}

/* Subtle vertical pinstripe — paper-like texture. The mask on the parent
 * also clips this overlay, so the texture follows the carved silhouette. */
.ticket::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 1px,
    rgb(0 0 0 / 0.012) 1px,
    rgb(0 0 0 / 0.012) 2px
  );
}

.ticket-main {
  position: relative;
}

.ticket-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(135deg, #2ecc71 0%, #1e90ff 100%);
  border-radius: 16px 16px 0 0;
}

.ticket-body {
  position: relative;
  padding: 1.25rem 1rem 1rem;
}

/* Dashed perforation aligned with the carved notches at 70% down. The
 * inset margins keep the dashes from overlapping the notch arcs. */
.ticket-perforation {
  position: relative;
  display: flex;
  align-items: center;
  height: 1px;
  margin: 0 0.875rem;
}

.perforation-line {
  flex: 1;
  height: 0;
  border-top: 2px dashed rgb(226 232 240); /* slate-200 */
}

.ticket-stub {
  position: relative;
  padding: 0.875rem 1rem 1rem;
  background: linear-gradient(180deg, rgb(250 250 250) 0%, white 100%);
  border-radius: 0 0 16px 16px;
}
</style>
