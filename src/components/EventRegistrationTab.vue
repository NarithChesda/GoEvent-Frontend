<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
        {{ t('management.registrationTab.title') }}
      </h2>
      <p class="text-xs sm:text-sm text-slate-600 mt-1">{{ t('management.registrationTab.subtitle') }}</p>
    </div>

    <!-- Stats Card -->
    <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
      <RegistrationStatsCard
        :total-registrations="allCount"
        :checked-in-count="checkedInCount"
        :pending-count="pendingCount"
        :cancelled-count="cancelledCount"
        :total-attendees="totalAttendees"
        :loading="loading"
      />
    </div>

    <!-- Search and Filter Bar -->
    <RegistrationListHeader
      :search-query="searchQuery"
      :status-filter="statusFilter"
      :is-filter-dropdown-open="isFilterDropdownOpen"
      :loading="loading"
      :live-updates="liveUpdates"
      :last-updated="lastUpdated"
      :filtered-count="filteredRegistrations.length"
      :all-count="allCount"
      :checked-in-count="checkedInCount"
      :pending-count="pendingCount"
      :cancelled-count="cancelledCount"
      :can-edit="canEdit"
      @update:search-query="searchQuery = $event"
      @clear-search="clearSearch"
      @toggle-filter-dropdown="toggleFilterDropdown"
      @close-filter-dropdown="closeFilterDropdown"
      @select-status="selectStatusFilter"
      @refresh="loadRegistrations(true)"
      @toggle-live="toggleLiveUpdates()"
      @open-checkin="showCheckinModal = true"
    />

    <!-- Loading State (skeleton mirrors the registration rows) -->
    <div v-if="loading" class="animate-pulse space-y-2" aria-hidden="true">
      <div
        v-for="i in 3"
        :key="i"
        class="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3"
      >
        <div class="h-9 w-9 flex-shrink-0 rounded-full bg-slate-200"></div>
        <div class="min-w-0 flex-1 space-y-2">
          <div class="h-3 w-40 max-w-full rounded bg-slate-200"></div>
          <div class="h-3 w-24 rounded bg-slate-200"></div>
        </div>
        <div class="h-8 w-8 flex-shrink-0 rounded-xl bg-slate-200"></div>
      </div>
    </div>

    <!-- Registration List -->
    <div v-else-if="filteredRegistrations.length > 0" class="space-y-2">
      <RegistrationCard
        v-for="registration in filteredRegistrations"
        :key="registration.id"
        :registration="registration"
        :can-edit="canEdit"
        :is-checking="isRowChecking(registration.id)"
        @check-in="handleRowCheckin"
        @copy-code="copyToClipboard"
      />
    </div>

    <!-- Empty State -->
    <RegistrationEmptyState
      v-else-if="!loading"
      :has-active-filters="hasActiveFilters"
      @clear-filters="clearFilters"
    />

    <!-- Admin Check-in Modal -->
    <RegistrationCheckinModal
      :show="showCheckinModal"
      :is-checking="isChecking"
      @close="closeCheckinModal"
      @check-in="handleCheckin"
      @qr-scan-error="showMessage('error', $event)"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useNotifications } from '@/composables/useNotifications'
import type { EventRegistrationDetail } from '../services/api'

// Import composables
import { useRegistrations, useRegistrationFilters } from '../composables/registration'

// Import components
import {
  RegistrationCard,
  RegistrationListHeader,
  RegistrationCheckinModal,
  RegistrationEmptyState,
  RegistrationStatsCard,
} from './registration'

// Props
interface Props {
  eventId: string
  canEdit: boolean
  registrations?: EventRegistrationDetail[]
}

const props = defineProps<Props>()
const { t } = useAppLanguage()

// Use composables
const {
  registrations,
  loading,
  lastUpdated,
  liveUpdates,
  loadRegistrations,
  performCheckin,
  performRowCheckin,
  isRowChecking,
  setRegistrations,
  toggleLiveUpdates,
} = useRegistrations(props.eventId, {
  initialRegistrations: props.registrations,
})

const {
  searchQuery,
  statusFilter,
  isFilterDropdownOpen,
  checkedInCount,
  pendingCount,
  cancelledCount,
  allCount,
  filteredRegistrations,
  hasActiveFilters,
  selectStatusFilter,
  clearFilters,
  clearSearch,
  toggleFilterDropdown,
  closeFilterDropdown,
} = useRegistrationFilters(registrations)

// Computed
const totalAttendees = computed(() => {
  return registrations.value.reduce((sum, r) => sum + (r.total_attendees || 1), 0)
})

// Local state for modals
const showCheckinModal = ref(false)
const isChecking = ref(false)
const { success: notifySuccess, error: notifyError } = useNotifications()

// Methods
const handleCheckin = async (code: string) => {
  isChecking.value = true
  const result = await performCheckin(code)

  if (result.success) {
    showMessage('success', result.message)
    closeCheckinModal()
  } else {
    showMessage('error', result.message)
  }

  isChecking.value = false
}

const handleRowCheckin = async (registration: EventRegistrationDetail) => {
  const result = await performRowCheckin(registration)
  showMessage(result.success ? 'success' : 'error', result.message)
}

const closeCheckinModal = () => {
  showCheckinModal.value = false
}

const showMessage = (type: 'success' | 'error', text: string) => {
  if (type === 'success') {
    notifySuccess(text)
  } else {
    notifyError(text)
  }
}

const copyToClipboard = async (text: string) => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const el = document.createElement('textarea')
      el.value = String(text)
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    showMessage('success', t('management.registrationTab.toast.codeCopied'))
  } catch {
    showMessage('error', t('management.registrationTab.toast.copyFailed'))
  }
}

// Watch for prop changes
watch(
  () => props.registrations,
  (newRegistrations) => {
    if (newRegistrations) {
      setRegistrations(newRegistrations)
    }
  },
  { immediate: true },
)

// Lifecycle
onMounted(() => {
  loadRegistrations()
})

// Expose method for parent component (Smart FAB)
defineExpose({
  openCheckinModal: () => {
    showCheckinModal.value = true
  }
})
</script>
