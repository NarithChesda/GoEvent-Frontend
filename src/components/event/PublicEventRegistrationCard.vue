<template>
  <!-- Registered — the admission stub -->
  <div v-if="registrationRequired && isRegistered" class="ticket">
    <!-- Header. Painted from the category theme rather than a fixed emerald,
         so the stub belongs to the same panel as everything above it. -->
    <div
      class="px-4 py-3 flex items-center justify-between"
      :style="{ backgroundColor: 'var(--evt-accent)' }"
    >
      <div class="flex items-center gap-2 min-w-0">
        <Ticket class="w-4 h-4 text-white/80 flex-shrink-0" />
        <span class="text-xs font-semibold text-white/90 uppercase tracking-wider truncate">
          {{ t('events.drawer.registration.admission') }}
        </span>
      </div>
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <span
          v-if="isOngoing"
          class="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-white/20 text-white"
        >
          {{ t('events.drawer.registration.live') }}
        </span>
        <span
          v-else-if="timeUntilEvent"
          class="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-white/20 text-white"
        >
          {{ timeUntilEvent }}
        </span>
      </div>
    </div>

    <!-- Status row -->
    <div class="px-4 py-3 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: 'var(--evt-accent)' }"></div>
        <span class="text-sm font-semibold text-slate-800 truncate">
          {{ t('events.drawer.registration.registered') }}
        </span>
      </div>
      <span
        v-if="statusLabel"
        :class="statusBadgeClass"
        class="px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0"
      >
        {{ statusLabel }}
      </span>
    </div>

    <p
      v-if="isVirtual && virtualLink && !isOngoing"
      class="px-4 pb-3 -mt-1 text-xs text-slate-500 flex items-center gap-1"
    >
      <Video class="w-3 h-3 flex-shrink-0" />
      {{ t('events.drawer.registration.joinLinkPending') }}
    </p>

    <!-- Perforation. A dashed rule inset from both edges, with the stub below it
         carrying a different tone — that pair is what reads as "ticket". The old
         version painted two `#f8fafc` circles over the edges to fake a die-cut
         notch, which only vanished on a slate-50 page; on the drawer's white
         body they showed up as grey smudges. -->
    <div class="ticket-perforation" aria-hidden="true"></div>

    <!-- Stub -->
    <div class="px-4 py-3 bg-slate-50/60">
      <div v-if="confirmationCode" class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
            {{ t('events.drawer.registration.confirmationLabel') }}
          </p>
          <p class="text-base font-mono font-bold text-slate-800 tracking-widest truncate">
            {{ confirmationCode }}
          </p>
        </div>
        <button
          @click="emit('show-qr')"
          class="p-2.5 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          :style="{ backgroundColor: 'var(--evt-tint)', color: 'var(--evt-accent)' }"
          :title="t('events.drawer.registration.showQr')"
          :aria-label="t('events.drawer.registration.showQr')"
        >
          <QrCode class="w-6 h-6" />
        </button>
      </div>
      <p v-else class="text-center text-xs text-slate-400 py-2">
        {{ t('events.drawer.registration.confirmed') }}
      </p>

      <button
        @click="emit('cancel-registration')"
        :disabled="isCancelling"
        class="mt-3 w-full text-[11px] text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 rounded"
      >
        {{
          isCancelling
            ? t('events.drawer.registration.cancelling')
            : t('events.drawer.registration.cancel')
        }}
      </button>
    </div>
  </div>

  <!-- Not registered — context only. The button itself lives in the pinned
       action bar, so this card never competes with it. -->
  <div
    v-else-if="registrationRequired"
    class="rounded-2xl border bg-white p-4"
    :style="{ borderColor: 'var(--evt-ring)' }"
  >
    <p class="text-sm text-slate-600">{{ registrationMessage }}</p>

    <!-- Who is about to be registered. Worth showing precisely because the CTA
         is now elsewhere — this is the confirmation of identity that used to sit
         directly above the button. -->
    <div v-if="currentUser" class="flex items-center gap-3 mt-3 p-3 bg-slate-50 rounded-xl">
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0"
        :style="{ backgroundColor: 'var(--evt-tint)', color: 'var(--evt-accent)' }"
      >
        {{ userInitials }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-900 truncate">
          {{ currentUser.first_name || currentUser.username }}
        </p>
        <p class="text-xs text-slate-500 truncate">{{ currentUser.email }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { QrCode, Ticket, Video } from 'lucide-vue-next'
import { useEventDateFormatters } from '@/composables/event'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface User {
  first_name?: string
  username: string
  email: string
}

interface Props {
  registrationRequired: boolean
  isRegistered: boolean
  statusLabel: string
  statusBadgeClass: string
  timeUntilEvent: string | null
  isOngoing: boolean
  isVirtual: boolean
  virtualLink: string | null | undefined
  confirmationCode: string | null | undefined
  isCancelling: boolean
  registrationMessage: string
  currentUser: User | null
}

interface Emits {
  (e: 'show-qr'): void
  (e: 'cancel-registration'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useAppLanguage()
const { getInitials } = useEventDateFormatters()

const userInitials = computed(() => {
  if (!props.currentUser) return 'U'
  return getInitials(props.currentUser.first_name || props.currentUser.username || 'U')
})
</script>

<style scoped>
.ticket {
  position: relative;
  background: white;
  border: 1px solid var(--evt-ring);
  border-radius: 16px;
  overflow: hidden;
}

.ticket-perforation {
  position: relative;
  height: 1px;
  margin: 0 16px;
  border-top: 2px dashed #e2e8f0;
}
</style>
