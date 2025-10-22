<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          Event Invitations
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">Manage invitations and track your guest list</p>
      </div>
    </div>

    <!-- Social Media Preview -->
    <SocialMediaPreview :event-data="event" />
    <!-- Loading State -->
    <div
      v-if="loadingPayments"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Checking template status...</span>
      </div>
    </div>

    <!-- No Template Selected -->
    <div
      v-else-if="!props.event?.event_template"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <Mail class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">No Template Selected</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        You need to select an event template before you can send invitations.
      </p>
      <button
        @click="redirectToTemplateTab"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm sm:text-base"
      >
        <Mail class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Select Template
      </button>
    </div>

    <!-- Template Payment Check -->
    <div
      v-else-if="!hasTemplatePayment"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <Lock class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">Template Payment Required</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        Your template "{{ props.event.event_template_details?.name || 'Selected Template' }}"
        requires payment before you can send invitations.
      </p>
      <button
        @click="redirectToPaymentTab"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm sm:text-base"
      >
        <CreditCard class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Complete Payment
      </button>
    </div>

    <!-- Invitation Management Section -->
    <div v-else class="space-y-6">
      <!-- Guest List Management -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
        <div class="flex flex-col gap-3 sm:gap-2 mb-3 sm:mb-4">
          <div class="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
            <div class="flex items-center gap-3 min-w-0">
              <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center">
                <Users class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] mr-1.5 sm:mr-2" />
                Guest List
              </h3>
              <div class="relative w-60 sm:w-64 md:w-72">
                <input
                  v-model="searchTerm"
                  @input="handleSearch"
                  type="text"
                  placeholder="Search guests..."
                  class="w-full pr-3 pl-8 py-2 rounded-lg border border-slate-200 focus:border-[#1e90ff] focus:ring-2 focus:ring-[#1e90ff]/20 text-sm text-slate-900 placeholder-slate-400"
                />
                <svg class="absolute left-2 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-auto flex items-center gap-2">
              <span class="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-1 text-xs">
                <CheckCircle class="w-3 h-3 mr-1 text-green-600" />
                <span>{{ loadingStats ? '...' : acceptedInvitations }}</span>
                <span class="ml-1 hidden md:inline">Viewed</span>
              </span>
              <span class="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-1 text-xs">
                <Users class="w-3 h-3 mr-1 text-slate-600" />
                <span>{{ loadingStats ? '...' : totalGuests }}</span>
                <span class="ml-1 hidden md:inline">Total</span>
              </span>
              <button @click="showAddGuestModal = true" class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-xs sm:text-sm">
                <UserPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                <span class="hidden sm:inline">Add Guest</span>
                <span class="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
        <!-- Guest List Table -->
        <div v-if="loading" class="text-center py-6 sm:py-8">
          <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff] mx-auto"></div>
          <p class="text-xs sm:text-sm text-slate-600 mt-2">Loading guest list...</p>
        </div>

        <div v-else-if="guests.length === 0" class="text-center py-8 sm:py-12">
          <Users class="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
          <p class="text-sm sm:text-base text-slate-500">No guests added yet</p>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">
            Click "Add Guest" to start building your guest list
          </p>
        </div>

        <!-- Desktop Table View -->
        <div v-else class="hidden md:block overflow-hidden rounded-2xl">
          <table class="min-w-full">
            <thead>
              <tr class="bg-slate-50/50">
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                >
                  Guest Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white/50 divide-y divide-slate-100">
              <tr
                v-for="guest in guests"
                :key="guest.id"
                class="hover:bg-slate-50/50 transition-colors cursor-pointer" @click="viewGuestShowcase(guest)"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      class="w-8 h-8 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-semibold text-sm"
                    >
                      {{ getInitials(guest.name) }}
                    </div>
                    <span class="ml-3 text-sm font-medium text-slate-900">{{ guest.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    :class="getStatusClass(guest.invitation_status)"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full mr-1.5"
                      :class="getStatusDotClass(guest.invitation_status)"
                    ></span>
                    {{ getStatusDisplay(guest) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button @click.stop="copyShowcaseLink(guest, 'en')" class="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" :title="`Copy EN link for ${guest.name}`">EN</button>
                    <button @click.stop="copyShowcaseLink(guest, 'kh')" class="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" :title="`Copy KH link for ${guest.name}`">KH</button>
                    <button
                      @click.stop="removeGuest(guest)"
                      class="text-red-600 hover:text-red-700"
                      title="Remove Guest"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div v-if="!loading && guests.length > 0" class="md:hidden space-y-2">
          <div
            v-for="guest in guests"
            :key="guest.id"
            class="bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer" @click="viewGuestShowcase(guest)">
            <!-- Single Row Layout -->
            <div class="flex items-center gap-2">
              <!-- Avatar -->
              <div
                class="w-8 h-8 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
              >
                {{ getInitials(guest.name) }}
              </div>

              <!-- Guest Info -->
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-slate-900 truncate leading-tight">{{ guest.name }}</p>
              </div>

              <!-- Status Badge -->
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                :class="getStatusClass(guest.invitation_status)"
              >
                <span
                  class="w-1 h-1 rounded-full mr-1"
                  :class="getStatusDotClass(guest.invitation_status)"
                ></span>
                <span class="hidden xs:inline">{{ getStatusDisplay(guest) }}</span>
              </span>

              <!-- Action Buttons -->
              <div class="flex items-center gap-1 flex-shrink-0">
                <button @click.stop="copyShowcaseLink(guest, 'en')" class="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" :title="`Copy EN link for ${guest.name}`">EN</button>
                    <button @click.stop="copyShowcaseLink(guest, 'kh')" class="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" :title="`Copy KH link for ${guest.name}`">KH</button>
                <button
                  @click.stop="removeGuest(guest)"
                  class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove Guest"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Guest Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAddGuestModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          @click="closeAddGuestModal"
        >
          <div
            class="bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 py-4 sm:px-8 sm:py-6 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 sm:space-x-3">
                  <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <UserPlus class="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h2 class="text-xl sm:text-2xl font-bold">Add Guest</h2>
                </div>
                <button
                  @click="closeAddGuestModal"
                  class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            <!-- Content -->
            <form @submit.prevent="addGuest" class="p-4 sm:p-8">
              <div class="mb-4 sm:mb-6">
                <label for="guestName" class="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                  Guest Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="guestName"
                  v-model="newGuestName"
                  type="text"
                  required
                  placeholder="Enter guest's full name"
                  class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-slate-200 focus:border-[#1e90ff] focus:ring-2 focus:ring-[#1e90ff]/20 transition-all duration-200 text-sm sm:text-base text-slate-900 placeholder-slate-400"
                />
              </div>

              <div class="flex space-x-2 sm:space-x-3">
                <button
                  type="button"
                  @click="closeAddGuestModal"
                  class="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-colors duration-200 font-semibold text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="!newGuestName.trim() || isAddingGuest"
                  class="flex-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-[1.02] text-sm sm:text-base"
                >
                  <span v-if="isAddingGuest" class="inline-flex items-center justify-center">
                    <div
                      class="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-white mr-1.5 sm:mr-2"
                    ></div>
                    Adding...
                  </span>
                  <span v-else>Add Guest</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 left-4 sm:left-auto z-50">
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
import { ref, computed, onMounted, watch } from 'vue'
import {
  CheckCircle,
  Users,
  Lock,
  CreditCard,
  Mail,
  UserPlus,
  X,
  AlertCircle,
  Trash2,
} from 'lucide-vue-next'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import { guestService, type EventGuest, type GuestStats, type Event } from '../services/api'
import { getGuestSSRMetaUrl } from '../utils/metaUtils'
import SocialMediaPreview from './SocialMediaPreview.vue'

// Props
const props = defineProps<{
  eventId: string
  event: Event
  canEdit: boolean
}>()

// Emits
const emit = defineEmits<{
  'tab-change': [tab: string]
}>()

// State
const loading = ref(false)
const showAddGuestModal = ref(false)
const newGuestName = ref('')
const isAddingGuest = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const searchTerm = ref('')
const loadingStats = ref(false)

// Guest data from API
const guests = ref<EventGuest[]>([])
const guestStats = ref<GuestStats | null>(null)

// Use payment template integration composable
const { isTemplateActivated, loadPayments, loadingPayments } = usePaymentTemplateIntegration(
  props.event,
)

// Computed properties
const hasTemplatePayment = computed(() => {
  // Check if template is selected first
  if (!props.event?.event_template) return false

  // Use the same logic as template tab - check if template is activated
  return isTemplateActivated.value
})

const sentInvitations = computed(() => {
  return guestStats.value?.sent || 0
})

const acceptedInvitations = computed(() => {
  return guestStats.value?.viewed || 0
})

const pendingInvitations = computed(() => {
  return guestStats.value?.not_sent || 0
})

const totalGuests = computed(() => {
  return guestStats.value?.total_guests || 0
})

// Methods
const redirectToPaymentTab = () => {
  emit('tab-change', 'payment')
}

const redirectToTemplateTab = () => {
  emit('tab-change', 'template')
}

const viewEventShowcase = () => {
  const showcaseUrl = `/events/${props.eventId}/showcase`
  window.open(showcaseUrl, '_blank')
}

const addGuest = async () => {
  if (!newGuestName.value.trim()) return

  isAddingGuest.value = true

  try {
    const response = await guestService.createGuest(props.eventId, {
      name: newGuestName.value.trim(),
    })

    if (response.success && response.data) {
      guests.value.unshift(response.data) // Add to beginning of list
      showMessage('success', `${response.data.name} added to guest list`)
      newGuestName.value = ''
      closeAddGuestModal()
      // Refresh stats
      loadGuestStats()
    } else {
      showMessage('error', response.message || 'Failed to add guest')
    }
  } catch (error) {
    console.error('Error adding guest:', error)
    showMessage('error', 'Failed to add guest')
  } finally {
    isAddingGuest.value = false
  }
}

const removeGuest = async (guest: EventGuest) => {
  if (confirm(`Remove ${guest.name} from the guest list?`)) {
    try {
      const response = await guestService.deleteGuest(props.eventId, guest.id)
      if (response.success) {
        guests.value = guests.value.filter((g) => g.id !== guest.id)
        showMessage('success', `${guest.name} removed from guest list`)
        // Refresh stats
        loadGuestStats()
      } else {
        showMessage('error', response.message || 'Failed to remove guest')
      }
    } catch (error) {
      console.error('Error removing guest:', error)
      showMessage('error', 'Failed to remove guest')
    }
  }
}

const closeAddGuestModal = () => {
  showAddGuestModal.value = false
  newGuestName.value = ''
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'viewed':
      return 'bg-green-100 text-green-800'
    case 'sent':
      return 'bg-orange-100 text-orange-800'
    case 'not_sent':
      return 'bg-slate-100 text-slate-800'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

const getStatusDotClass = (status: string) => {
  switch (status) {
    case 'viewed':
      return 'bg-green-500'
    case 'sent':
      return 'bg-orange-500'
    case 'not_sent':
      return 'bg-slate-400'
    default:
      return 'bg-slate-400'
  }
}

const getStatusDisplay = (guest: EventGuest) => {
  return guest.invitation_status_display || guest.invitation_status
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getGuestShowcaseUrl = (guest: EventGuest, language: 'en' | 'kh' = 'kh') => {
  // Use SSR meta URL for personalized guest invitations
  return getGuestSSRMetaUrl(props.eventId, guest.name, language)
}

const getDirectGuestShowcaseUrl = (guest: EventGuest, language: 'en' | 'kh' = 'kh') => {
  // Direct URL for opening in browser (non-SSR)
  const showcaseUrl = `/events/${props.eventId}/showcase?guest_name=${encodeURIComponent(guest.name)}&lang=${language}`
  return `${window.location.origin}${showcaseUrl}`
}

const viewGuestShowcase = (guest: EventGuest) => {
  // Use direct URL for viewing (non-SSR) so it opens immediately
  const fullUrl = getDirectGuestShowcaseUrl(guest, 'kh')
  window.open(fullUrl, '_blank')
}

const copyShowcaseLink = (guest: EventGuest, language: 'en' | 'kh') => {
  const fullUrl = getGuestShowcaseUrl(guest, language)
  navigator.clipboard
    .writeText(fullUrl)
    .then(() => {
      showMessage('success', `Showcase link (${language.toUpperCase()}) copied for ${guest.name}`)
    })
    .catch(() => {
      showMessage('error', 'Failed to copy link')
    })
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const loadGuests = async () => {
  loading.value = true
  try {
    const response = await guestService.getGuests(props.eventId, {
      search: searchTerm.value,
      ordering: 'name',
    })

    if (response.success && response.data) {
      guests.value = response.data.results
    } else {
      showMessage('error', response.message || 'Failed to load guests')
    }
  } catch (error) {
    console.error('Error loading guests:', error)
    showMessage('error', 'Failed to load guest list')
  } finally {
    loading.value = false
  }
}

const loadGuestStats = async () => {
  loadingStats.value = true
  try {
    const response = await guestService.getGuestStats(props.eventId)
    if (response.success && response.data) {
      guestStats.value = response.data
    }
  } catch (error) {
    console.error('Error loading guest stats:', error)
  } finally {
    loadingStats.value = false
  }
}

// Watch for search term changes
let searchTimeout: ReturnType<typeof setTimeout>
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadGuests()
  }, 300)
}

// Lifecycle
onMounted(() => {
  // Load payments to check template activation status
  loadPayments()
})

// Watch for template payment status changes
watch(hasTemplatePayment, (isActivated) => {
  if (isActivated) {
    loadGuests()
    loadGuestStats()
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

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



























