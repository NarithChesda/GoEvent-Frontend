<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 mb-2">
      {{ t('settings.notifications.title') }}
    </h2>
    <p class="text-sm text-gray-500 mb-6">
      {{ t('settings.notifications.subtitle') }}
    </p>

    <!-- Loading -->
    <div
      v-if="store.loadingPreferences && !store.preferences"
      class="flex items-center justify-center py-12 text-slate-400"
    >
      <Loader2 class="w-5 h-5 animate-spin mr-2" />
      <span class="text-sm">{{ t('common.actions.loading') }}</span>
    </div>

    <!-- Error (initial load) -->
    <div
      v-else-if="store.preferencesError && !store.preferences"
      class="flex flex-col items-center justify-center py-12 text-center"
    >
      <AlertCircle class="w-8 h-8 text-red-500 mb-2" />
      <div class="text-sm text-slate-700 mb-3">{{ store.preferencesError }}</div>
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium text-white bg-[#1e90ff] hover:bg-[#1873cc] rounded-lg transition-colors"
        @click="loadPreferences"
      >
        {{ t('common.actions.retry') }}
      </button>
    </div>

    <!-- Form -->
    <div v-else-if="store.preferences" class="space-y-8">
      <!-- Toast -->
      <div
        v-if="successMessage"
        class="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
        role="status"
      >
        <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
        <span>{{ successMessage }}</span>
      </div>
      <div
        v-if="errorMessage"
        class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
        role="alert"
      >
        <AlertCircle class="w-4 h-4 flex-shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Channels (master switches) -->
      <section>
        <h3 class="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
          {{ t('settings.notifications.channels.title') }}
        </h3>
        <div class="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
          <ToggleRow
            :label="t('settings.notifications.channels.inApp.label')"
            :description="t('settings.notifications.channels.inApp.description')"
            :model-value="store.preferences.in_app_enabled"
            :disabled="store.savingPreferences"
            @update:model-value="(v) => save({ in_app_enabled: v })"
          />
          <ToggleRow
            :label="t('settings.notifications.channels.telegram.label')"
            :description="t('settings.notifications.channels.telegram.description')"
            :model-value="store.preferences.telegram_enabled"
            :disabled="store.savingPreferences"
            @update:model-value="(v) => save({ telegram_enabled: v })"
          />
        </div>
        <p
          v-if="store.preferences.telegram_enabled"
          class="mt-2 text-xs text-slate-500 flex items-start gap-1.5"
        >
          <Info class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{{ t('settings.notifications.channels.telegram.hint') }}</span>
        </p>
      </section>

      <!-- Per-type toggles -->
      <section>
        <h3 class="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
          {{ t('settings.notifications.types.title') }}
        </h3>
        <div class="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
          <ToggleRow
            v-for="row in typeRows"
            :key="row.field"
            :label="row.label"
            :description="row.description"
            :model-value="(store.preferences as any)[row.field]"
            :disabled="store.savingPreferences"
            @update:model-value="(v: boolean) => save({ [row.field]: v })"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-vue-next'
import { useNotificationsStore } from '@/stores/notifications'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { UpdateNotificationPreferencesRequest } from '@/services/api'
import ToggleRow from './ToggleRow.vue'

const store = useNotificationsStore()
const { t } = useAppLanguage()

const successMessage = ref('')
const errorMessage = ref('')

interface TypeRow {
  field: keyof UpdateNotificationPreferencesRequest
  label: string
  description: string
}

const typeRows = computed<TypeRow[]>(() => [
  {
    field: 'notify_event_registration',
    label: t('settings.notifications.types.eventRegistration.label'),
    description: t('settings.notifications.types.eventRegistration.description'),
  },
  {
    field: 'notify_rsvp_response',
    label: t('settings.notifications.types.rsvpResponse.label'),
    description: t('settings.notifications.types.rsvpResponse.description'),
  },
  {
    field: 'notify_event_comment',
    label: t('settings.notifications.types.eventComment.label'),
    description: t('settings.notifications.types.eventComment.description'),
  },
  {
    field: 'notify_collaborator_invite',
    label: t('settings.notifications.types.collaboratorInvite.label'),
    description: t('settings.notifications.types.collaboratorInvite.description'),
  },
  {
    field: 'notify_collaborator_added',
    label: t('settings.notifications.types.collaboratorAdded.label'),
    description: t('settings.notifications.types.collaboratorAdded.description'),
  },
  {
    field: 'notify_payment_status',
    label: t('settings.notifications.types.paymentStatus.label'),
    description: t('settings.notifications.types.paymentStatus.description'),
  },
  {
    field: 'notify_event_reminder',
    label: t('settings.notifications.types.eventReminder.label'),
    description: t('settings.notifications.types.eventReminder.description'),
  },
  {
    field: 'notify_check_in',
    label: t('settings.notifications.types.checkIn.label'),
    description: t('settings.notifications.types.checkIn.description'),
  },
  {
    field: 'notify_guest_cash_gift',
    label: t('settings.notifications.types.guestCashGift.label'),
    description: t('settings.notifications.types.guestCashGift.description'),
  },
])

async function loadPreferences() {
  await store.fetchPreferences(true)
}

async function save(patch: UpdateNotificationPreferencesRequest) {
  successMessage.value = ''
  errorMessage.value = ''
  const ok = await store.updatePreferences(patch)
  if (ok) {
    successMessage.value = t('settings.notifications.messages.saved')
    setTimeout(() => (successMessage.value = ''), 2500)
  } else {
    errorMessage.value =
      store.preferencesError || t('settings.notifications.messages.saveFailed')
  }
}

watch(
  () => store.preferencesError,
  (err) => {
    if (err && store.preferences) {
      errorMessage.value = err
    }
  },
)

onMounted(() => {
  store.fetchPreferences()
})
</script>
