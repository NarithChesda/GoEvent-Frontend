<template>
  <details
    class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
    :open="open"
    @toggle="onToggle"
  >
    <summary
      class="px-4 py-2.5 cursor-pointer select-none text-sm flex items-center justify-between hover:bg-slate-50 transition-colors"
    >
      <span class="font-medium text-slate-700 inline-flex items-center gap-2">
        <History class="w-4 h-4 text-slate-400" />
        {{ t('management.tickets.scan.recent.heading') }}
      </span>
      <span
        class="text-xs font-medium text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 tabular-nums"
      >
        {{ recent.length }}
      </span>
    </summary>
    <ul class="px-4 pb-3 pt-1 text-sm space-y-1.5 max-h-56 overflow-y-auto">
      <li
        v-if="recent.length === 0"
        class="text-slate-500 py-2 text-center text-xs"
      >
        {{ t('management.tickets.scan.recent.empty') }}
      </li>
      <li
        v-for="(entry, idx) in recent"
        :key="`${entry.scannedAt}-${idx}`"
        class="flex items-center gap-2 py-1"
      >
        <span
          class="w-2 h-2 rounded-full flex-shrink-0"
          :class="dotClass(entry.outcome)"
          aria-hidden="true"
        ></span>
        <span class="truncate flex-1 text-slate-700">{{ label(entry.outcome) }}</span>
        <span class="text-xs text-slate-400 flex-shrink-0 tabular-nums">{{ formatTime(entry.scannedAt) }}</span>
      </li>
    </ul>
  </details>
</template>

<script setup lang="ts">
import { History } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type {
  RecentScan,
  ScanOutcome,
} from '@/composables/tickets/useTicketCheckIn'

defineProps<{
  recent: RecentScan[]
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useAppLanguage()

function onToggle(event: Event) {
  const target = event.target as HTMLDetailsElement
  emit('update:open', target.open)
}

function dotClass(o: ScanOutcome): string {
  switch (o.kind) {
    case 'entry':
      return 'bg-emerald-500'
    case 'reentry':
      return 'bg-amber-400'
    case 'rejected':
    case 'wrong_event':
      return 'bg-red-500'
    case 'invalid':
    case 'network_error':
      return 'bg-slate-400'
  }
}

function label(o: ScanOutcome): string {
  if (o.kind === 'entry' || o.kind === 'reentry' || o.kind === 'wrong_event') {
    return o.ticket.attendee_name || o.ticket.attendee_email || o.ticket.check_in_code || '—'
  }
  if (o.kind === 'rejected' && o.ticket) {
    return o.ticket.attendee_name || o.ticket.attendee_email || '—'
  }
  return o.rawMessage
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
