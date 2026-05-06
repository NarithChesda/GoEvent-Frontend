<template>
  <Transition
    enter-active-class="transition-all duration-200"
    leave-active-class="transition-all duration-150"
    enter-from-class="opacity-0 translate-y-2"
    leave-to-class="opacity-0"
  >
    <div
      v-if="outcome"
      :class="['rounded-2xl shadow-md border overflow-hidden', containerClass]"
      role="status"
    >
      <div class="px-4 py-3 flex items-start gap-3">
        <component :is="iconComponent" class="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <p class="text-base font-bold uppercase tracking-wide leading-tight">
            {{ headline }}
          </p>
          <p
            v-if="attendee"
            class="text-sm font-medium truncate mt-0.5"
          >
            {{ attendee }}
          </p>
          <p
            v-if="subline"
            class="text-xs opacity-90 mt-0.5 break-words"
          >
            {{ subline }}
          </p>
          <span
            v-if="suspicious"
            class="mt-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-white/80 text-amber-900"
          >
            <ShieldAlert class="w-3.5 h-3.5" />
            {{ t('management.tickets.scan.suspicious.warning') }}
          </span>
          <span
            v-if="replayed"
            class="mt-2 ml-1 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/30"
          >
            {{ t('management.tickets.scan.outcomes.replayed') }}
          </span>
        </div>
        <button
          type="button"
          class="p-1 -mr-1 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
          :aria-label="t('management.tickets.scan.actions.scanNext')"
          @click="emit('dismiss')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { ScanOutcome } from '@/composables/tickets/useTicketCheckIn'

const props = defineProps<{
  outcome: ScanOutcome | null
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const { t } = useAppLanguage()

const containerClass = computed(() => {
  const o = props.outcome
  if (!o) return ''
  switch (o.kind) {
    case 'entry':
      return 'bg-emerald-500 border-emerald-400 text-white'
    case 'reentry':
      return 'bg-amber-400 border-amber-300 text-slate-900'
    case 'rejected':
    case 'wrong_event':
    case 'invalid':
    case 'network_error':
      return 'bg-red-500 border-red-400 text-white'
  }
})

const iconComponent = computed<Component>(() => {
  const o = props.outcome
  if (!o) return CheckCircle2
  switch (o.kind) {
    case 'entry':
      return CheckCircle2
    case 'reentry':
      return RefreshCw
    case 'rejected':
    case 'wrong_event':
      return XCircle
    case 'invalid':
    case 'network_error':
      return AlertCircle
  }
})

const headline = computed(() => {
  const o = props.outcome
  if (!o) return ''
  switch (o.kind) {
    case 'entry':
      return t('management.tickets.scan.outcomes.entry')
    case 'reentry':
      return `${t('management.tickets.scan.outcomes.reentry')} #${o.checkInCount}`
    case 'rejected':
      return o.reason === 'wrong_tier'
        ? t('management.tickets.scan.outcomes.wrongTier')
        : t('management.tickets.scan.outcomes.rejected')
    case 'wrong_event':
      return t('management.tickets.scan.outcomes.wrongEvent')
    case 'invalid':
    case 'network_error':
      return t('management.tickets.scan.outcomes.invalid')
  }
})

const attendee = computed(() => {
  const o = props.outcome
  if (!o) return ''
  if (o.kind === 'entry' || o.kind === 'reentry' || o.kind === 'wrong_event') {
    return o.ticket.attendee_name || o.ticket.attendee_email || ''
  }
  if (o.kind === 'rejected' && o.ticket) {
    return o.ticket.attendee_name || o.ticket.attendee_email || ''
  }
  return ''
})

const subline = computed(() => {
  const o = props.outcome
  if (!o) return ''
  switch (o.kind) {
    case 'entry':
    case 'reentry':
      return o.ticket.ticket_type?.name ?? ''
    case 'rejected':
      switch (o.reason) {
        case 'already_checked_in':
          return o.rawMessage || t('management.tickets.scan.outcomes.alreadyCheckedIn')
        case 'refunded':
          return t('management.tickets.scan.outcomes.refunded')
        case 'cancelled':
          return t('management.tickets.scan.outcomes.cancelled')
        case 'event_not_running':
          return t('management.tickets.scan.outcomes.eventNotRunning')
        case 'wrong_tier':
        default:
          return o.rawMessage
      }
    case 'wrong_event':
    case 'invalid':
    case 'network_error':
      return o.rawMessage
  }
})

const suspicious = computed(() => {
  const o = props.outcome
  if (!o) return false
  if (o.kind === 'entry' || o.kind === 'reentry' || o.kind === 'rejected') {
    return o.suspicious
  }
  return false
})

const replayed = computed(() => {
  const o = props.outcome
  if (!o) return false
  if (o.kind === 'entry' || o.kind === 'reentry') return o.replayed
  return false
})
</script>
