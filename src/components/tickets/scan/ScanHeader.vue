<template>
  <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
    <div class="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
      <button
        type="button"
        class="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors flex-shrink-0"
        :aria-label="t('management.tickets.scan.actions.exit')"
        @click="emit('back')"
      >
        <ArrowRight class="w-5 h-5" />
      </button>

      <div class="min-w-0 flex-1">
        <p class="text-[10px] sm:text-[11px] uppercase tracking-wide text-white/80 leading-tight truncate">
          {{ t('management.tickets.scan.title') }}
        </p>
        <p class="text-sm sm:text-base font-semibold text-white truncate leading-tight">
          {{ eventTitle || '—' }}
        </p>
      </div>

      <!--
        Offline / queue-pending indicator. Tap to force a flush attempt.
        Hidden when there is nothing pending AND we are online.
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

      <div
        class="flex items-baseline gap-1 px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-white flex-shrink-0"
        :title="t('management.tickets.scan.counter.checkedIn')"
      >
        <span class="text-base sm:text-lg font-bold leading-none tabular-nums">{{ checkedIn }}</span>
        <span class="text-xs opacity-80">/ {{ total }}</span>
      </div>

      <button
        type="button"
        class="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors flex-shrink-0"
        :aria-label="t('management.tickets.scan.actions.toggleSound')"
        :title="t('management.tickets.scan.actions.toggleSound')"
        @click="emit('toggleSound')"
      >
        <Volume2 v-if="soundEnabled" class="w-4 h-4 sm:w-5 sm:h-5" />
        <VolumeX v-else class="w-4 h-4 sm:w-5 sm:h-5 opacity-60" />
      </button>

      <!--
        Smart gear pill: a 32px circle when no scope is active, expands to a
        chip showing the active tier (or count) when scoping is on. Replaces
        the old amber dot — the chip itself is the "active" signal so staff
        see *which* gate they are filtering, not just "something is on".
      -->
      <button
        type="button"
        class="inline-flex items-center text-white transition-all duration-200 flex-shrink-0"
        :class="[
          gatesActive
            ? 'gap-1.5 h-8 pl-2 pr-2.5 rounded-full bg-white/15 hover:bg-white/25'
            : 'w-8 h-8 rounded-full justify-center hover:bg-white/20',
          gateConfigOpen ? 'ring-2 ring-white/40' : '',
        ]"
        :aria-label="t('management.tickets.scan.actions.configureGates')"
        :title="t('management.tickets.scan.actions.configureGates')"
        :aria-expanded="gateConfigOpen"
        @click="emit('toggleGateConfig')"
      >
        <Settings class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
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
