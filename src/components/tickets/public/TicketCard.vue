<template>
  <article class="bg-white/80 border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
    <!-- Header strip with tier name (canonical gradient) -->
    <div class="px-4 py-3 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white">
      <p class="text-[10px] sm:text-[11px] uppercase tracking-wide text-white/80">
        {{ t('events.tickets.order.ticketType') }}
      </p>
      <p class="text-sm sm:text-base font-semibold leading-tight">{{ ticket.ticket_type.name }}</p>
    </div>

    <!-- QR + codes -->
    <div class="p-4 flex flex-col items-center text-center gap-3">
      <div
        class="w-44 h-44 sm:w-48 sm:h-48 bg-slate-50 rounded-2xl flex items-center justify-center p-2"
      >
        <img
          v-if="qrDataUrl"
          :src="qrDataUrl"
          :alt="t('events.tickets.order.qrAlt')"
          class="w-full h-full object-contain"
        />
        <div
          v-else-if="qrError"
          class="text-xs text-slate-400 px-2"
        >
          {{ t('events.tickets.order.qrUnavailable') }}
        </div>
        <div
          v-else
          class="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"
        />
      </div>

      <div>
        <p class="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">
          {{ t('events.tickets.order.checkInCodeLabel') }}
        </p>
        <p class="font-mono text-lg font-bold text-slate-900 tracking-widest tabular-nums">
          {{ ticket.check_in_code }}
        </p>
      </div>

      <div class="text-xs text-slate-500">
        <p class="font-medium text-slate-700 break-words">{{ ticket.attendee_name }}</p>
        <p class="break-all">{{ ticket.attendee_email }}</p>
      </div>

      <!-- Status badge (canonical palette) -->
      <span
        :class="[
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium',
          statusClasses,
        ]"
      >
        {{ statusLabel }}
      </span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { renderTicketQrDataUrl } from '@/utils/qrcode'
import type { Ticket } from '@/services/api'

interface Props {
  ticket: Ticket
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

const statusClasses = computed(() => {
  switch (props.ticket.status) {
    case 'valid':
      return 'bg-emerald-50 text-emerald-700'
    case 'used':
      return 'bg-sky-50 text-sky-700'
    case 'refunded':
    case 'cancelled':
      return 'bg-rose-50 text-rose-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
})
</script>
