<template>
  <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
    <div class="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
      <button
        type="button"
        class="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors flex-shrink-0"
        :aria-label="t('management.tickets.scan.actions.exit')"
        @click="emit('back')"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>

      <div class="min-w-0 flex-1">
        <p class="text-[10px] sm:text-[11px] uppercase tracking-wide text-white/80 leading-tight truncate">
          {{ t('management.tickets.scan.title') }}
        </p>
        <p class="text-sm sm:text-base font-semibold text-white truncate leading-tight">
          {{ eventTitle || '—' }}
        </p>
      </div>

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

      <button
        type="button"
        class="relative w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors flex-shrink-0"
        :aria-label="t('management.tickets.scan.actions.configureGates')"
        :title="t('management.tickets.scan.actions.configureGates')"
        @click="emit('openGateConfig')"
      >
        <Settings class="w-4 h-4 sm:w-5 sm:h-5" />
        <span
          v-if="gatesActive"
          class="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white/50"
          aria-hidden="true"
        ></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Settings, Volume2, VolumeX } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

defineProps<{
  eventTitle: string
  checkedIn: number
  total: number
  soundEnabled: boolean
  gatesActive: boolean
}>()

const emit = defineEmits<{
  back: []
  toggleSound: []
  openGateConfig: []
}>()

const { t } = useAppLanguage()
</script>
