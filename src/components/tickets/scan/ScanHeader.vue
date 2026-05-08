<template>
  <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
    <div class="flex items-center gap-1.5 px-3 py-2.5">
      <!-- Close — same shape/size as RegistrationCheckinModal so the two
           check-in flows have a single recognisable back affordance. -->
      <button
        type="button"
        class="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
        :aria-label="t('management.tickets.scan.actions.exit')"
        @click="emit('back')"
      >
        <ArrowRight class="w-5 h-5 text-white" />
      </button>

      <!-- Title — single bold line matching the modal's pattern. The event
           name is the load-bearing context here, the gradient + back arrow
           already telegraph that this is a scanner. -->
      <h2 class="flex-1 min-w-0 text-base font-semibold text-white truncate">
        {{ eventTitle || t('management.tickets.scan.title') }}
      </h2>

      <!--
        Offline / queue-pending pill. Tap to force a flush attempt. Hidden
        when the queue is empty AND we are online so the header stays calm in
        the common case.
      -->
      <button
        v-if="pendingCount > 0 || !isOnline"
        type="button"
        class="inline-flex items-center gap-1 h-8 px-2.5 rounded-full text-[11px] font-semibold leading-none transition-colors flex-shrink-0"
        :class="
          !isOnline
            ? 'bg-amber-400/95 text-amber-950 hover:bg-amber-300'
            : 'bg-white/15 text-white hover:bg-white/25'
        "
        :title="badgeTitle"
        :aria-label="badgeTitle"
        :disabled="isFlushing"
        @click="emit('flushQueue')"
      >
        <span
          v-if="isFlushing"
          class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
        ></span>
        <CloudOff v-else-if="!isOnline" class="w-3.5 h-3.5" />
        <Clock v-else class="w-3.5 h-3.5" />
        <span v-if="pendingCount > 0" class="tabular-nums">{{ pendingCount }}</span>
      </button>

      <!-- At-a-glance counter — primary KPI for door staff. items-center
           keeps both segments vertically centred inside the 32px pill;
           items-baseline drifts the smaller "/ total" below the cap-line. -->
      <div
        class="inline-flex items-center gap-1 h-8 px-2.5 rounded-full bg-white/15 text-white flex-shrink-0 leading-none"
        :title="t('management.tickets.scan.counter.checkedIn')"
      >
        <span class="text-sm font-bold tabular-nums">{{ checkedIn }}</span>
        <span class="text-[11px] opacity-80">/ {{ total }}</span>
      </div>

      <button
        type="button"
        class="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
        :aria-label="t('management.tickets.scan.actions.toggleSound')"
        :title="t('management.tickets.scan.actions.toggleSound')"
        @click="emit('toggleSound')"
      >
        <Volume2 v-if="soundEnabled" class="w-5 h-5 text-white" />
        <VolumeX v-else class="w-5 h-5 text-white opacity-60" />
      </button>

      <!--
        Gate config: tight icon button when no scope is active, expands to a
        chip showing the active tier (or "VIP +N") when scoping is on so the
        active gate is visible at a glance.
      -->
      <button
        type="button"
        class="inline-flex items-center text-white transition-all duration-200 flex-shrink-0"
        :class="[
          gatesActive
            ? 'gap-1.5 h-8 pl-2 pr-2.5 rounded-full bg-white/15 hover:bg-white/25'
            : 'p-1.5 rounded-lg hover:bg-white/20',
          gateConfigOpen ? 'ring-2 ring-white/40' : '',
        ]"
        :aria-label="t('management.tickets.scan.actions.configureGates')"
        :title="t('management.tickets.scan.actions.configureGates')"
        :aria-expanded="gateConfigOpen"
        @click="emit('toggleGateConfig')"
      >
        <Settings class="w-5 h-5 flex-shrink-0" />
        <span
          v-if="gatesActive && gateLabel"
          class="text-xs font-semibold whitespace-nowrap max-w-[88px] truncate leading-none"
        >
          {{ gateLabel }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, Clock, CloudOff, Settings, Volume2, VolumeX } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = defineProps<{
  eventTitle: string
  checkedIn: number
  total: number
  soundEnabled: boolean
  gatesActive: boolean
  gateLabel?: string
  gateConfigOpen: boolean
  /** Number of scans currently queued for offline batch sync. */
  pendingCount: number
  isOnline: boolean
  isFlushing: boolean
}>()

const emit = defineEmits<{
  back: []
  toggleSound: []
  toggleGateConfig: []
  flushQueue: []
}>()

const { t } = useAppLanguage()

const badgeTitle = computed(() => {
  if (!props.isOnline) {
    return t('management.tickets.scan.offline.banner')
  }
  if (props.isFlushing) {
    return t('management.tickets.scan.offline.syncing', { count: props.pendingCount })
  }
  return t('management.tickets.scan.offline.queued', { count: props.pendingCount })
})
</script>
