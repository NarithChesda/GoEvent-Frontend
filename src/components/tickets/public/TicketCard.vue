<template>
  <article class="bg-white border border-slate-200 rounded-2xl overflow-hidden">
    <!-- Header strip with tier name -->
    <div class="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white">
      <p class="text-xs uppercase tracking-wider opacity-80">
        {{ t('events.tickets.order.ticketType') }}
      </p>
      <p class="text-base font-semibold">{{ ticket.ticket_type.name }}</p>
    </div>

    <!-- QR + codes -->
    <div class="p-4 flex flex-col items-center text-center gap-3">
      <div
        class="w-48 h-48 bg-slate-50 rounded-xl flex items-center justify-center"
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
        <p class="text-xs text-slate-500 mb-0.5">
          {{ t('events.tickets.order.checkInCodeLabel') }}
        </p>
        <p class="font-mono text-lg font-bold text-slate-900 tracking-widest tabular-nums">
          {{ ticket.check_in_code }}
        </p>
      </div>

      <div class="text-xs text-slate-500">
        <p class="font-medium text-slate-700">{{ ticket.attendee_name }}</p>
        <p>{{ ticket.attendee_email }}</p>
      </div>

      <!-- Status badge -->
      <span
        :class="[
          'px-2 py-0.5 rounded-full text-[11px] font-medium',
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
