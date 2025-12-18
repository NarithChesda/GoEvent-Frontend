<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
        Event Registration
      </h2>
      <p class="text-xs sm:text-sm text-slate-600 mt-1">Manage registrations and check-ins</p>
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

    <!-- Loading State -->
    <div
      v-if="loading"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Loading registrations...</span>
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

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-20 lg:bottom-8 right-4 sm:right-8 left-4 sm:left-auto z-[100]">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center text-sm sm:text-base"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <AlertCircle v-else class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <span class="flex-1">{{ message.text }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { CheckCircle, AlertCircle } from 'lucide-vue-next'
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

// Local state for modals and messages
const showCheckinModal = ref(false)
const isChecking = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

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
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
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
    showMessage('success', 'Confirmation code copied')
  } catch (e) {
    showMessage('error', 'Failed to copy code')
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

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
