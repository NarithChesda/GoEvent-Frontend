<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          Event Invitations
        </h2>
        <p class="text-sm text-slate-600 mt-1">Manage invitations and track your guest list</p>
      </div>
    </div>

    <!-- Social Media Preview -->
    <SocialMediaPreview :event-data="event" />

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Send class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p v-if="loadingStats" class="text-2xl font-bold text-slate-900">...</p>
            <p v-else class="text-2xl font-bold text-slate-900">{{ sentInvitations }}</p>
            <p class="text-sm text-slate-600">Sent</p>
          </div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p v-if="loadingStats" class="text-2xl font-bold text-slate-900">...</p>
            <p v-else class="text-2xl font-bold text-slate-900">{{ acceptedInvitations }}</p>
            <p class="text-sm text-slate-600">Viewed</p>
          </div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Clock class="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p v-if="loadingStats" class="text-2xl font-bold text-slate-900">...</p>
            <p v-else class="text-2xl font-bold text-slate-900">{{ pendingInvitations }}</p>
            <p class="text-sm text-slate-600">Not Sent</p>
          </div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Users class="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p v-if="loadingStats" class="text-2xl font-bold text-slate-900">...</p>
            <p v-else class="text-2xl font-bold text-slate-900">{{ totalGuests }}</p>
            <p class="text-sm text-slate-600">Total Guests</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingPayments" class="text-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p class="text-slate-600">Checking template status...</p>
    </div>

    <!-- No Template Selected -->
    <div
      v-else-if="!props.event?.event_template"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12 text-center"
    >
      <Mail class="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-slate-900 mb-2">No Template Selected</h3>
      <p class="text-slate-600 mb-6 max-w-md mx-auto">
        You need to select an event template before you can send invitations.
      </p>
      <button
        @click="redirectToTemplateTab"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 inline-flex items-center"
      >
        <Mail class="w-4 h-4 mr-2" />
        Select Template
      </button>
    </div>

    <!-- Template Payment Check -->
    <div
      v-else-if="!hasTemplatePayment"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12 text-center"
    >
      <Lock class="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-slate-900 mb-2">Template Payment Required</h3>
      <p class="text-slate-600 mb-6 max-w-md mx-auto">
        Your template "{{ props.event.event_template_details?.name || 'Selected Template' }}"
        requires payment before you can send invitations.
      </p>
      <button
        @click="redirectToPaymentTab"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 inline-flex items-center"
      >
        <CreditCard class="w-4 h-4 mr-2" />
        Complete Payment
      </button>
    </div>

    <!-- Invitation Management Section -->
    <div v-else class="space-y-6">
      <!-- Guest List Management -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-slate-900 flex items-center">
            <Users class="w-5 h-5 text-blue-600 mr-2" />
            Guest List
          </h3>
          <div class="flex gap-2">
            <button
              @click="viewEventShowcase"
              class="bg-white/80 backdrop-blur-sm border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-semibold py-2 px-4 rounded-xl transition-all duration-200 inline-flex items-center"
            >
              <ExternalLink class="w-4 h-4 mr-2" />
              <span class="hidden sm:inline">View Showcase</span>
            </button>
            <button
              @click="sendInvitations"
              class="bg-white/80 backdrop-blur-sm border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-2 px-4 rounded-xl transition-all duration-200 inline-flex items-center"
            >
              <Send class="w-4 h-4 mr-2" />
              <span class="hidden sm:inline">Bulk Send</span>
            </button>
            <button
              @click="showAddGuestModal = true"
              class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 inline-flex items-center"
            >
              <UserPlus class="w-4 h-4 mr-2" />
              Add Guest
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="mb-4">
          <div class="relative">
            <input
              v-model="searchTerm"
              @input="handleSearch"
              type="text"
              placeholder="Search guests by name..."
              class="w-full px-4 py-2 pl-10 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-slate-900 placeholder-slate-400"
            />
            <svg
              class="absolute left-3 top-2.5 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <!-- Guest List Table -->
        <div v-if="loading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-slate-600 mt-2">Loading guest list...</p>
        </div>

        <div v-else-if="guests.length === 0" class="text-center py-12">
          <Users class="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p class="text-slate-500">No guests added yet</p>
          <p class="text-sm text-slate-400 mt-1">
            Click "Add Guest" to start building your guest list
          </p>
        </div>

        <div v-else class="overflow-hidden rounded-2xl">
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
                  class="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                >
                  Invited On
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
                class="hover:bg-slate-50/50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm"
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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {{ formatDate(guest.created_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      v-if="guest.invitation_status === 'not_sent'"
                      @click="sendIndividualInvitation(guest)"
                      class="text-blue-600 hover:text-blue-700"
                      title="Mark as Sent"
                    >
                      <Send class="w-4 h-4" />
                    </button>
                    <button
                      @click="viewGuestShowcase(guest)"
                      class="text-green-600 hover:text-green-700"
                      :title="'View personalized showcase'"
                    >
                      <ExternalLink class="w-4 h-4" />
                    </button>
                    <button
                      @click="copyShowcaseLink(guest)"
                      class="text-purple-600 hover:text-purple-700 relative group"
                      :title="`Copy sharing link for ${guest.name}`"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <button
                      @click="removeGuest(guest)"
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
      </div>
    </div>

    <!-- Add Guest Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAddGuestModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          @click="closeAddGuestModal"
        >
          <div
            class="bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <UserPlus class="w-5 h-5" />
                  </div>
                  <h2 class="text-2xl font-bold">Add Guest</h2>
                </div>
                <button
                  @click="closeAddGuestModal"
                  class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Content -->
            <form @submit.prevent="addGuest" class="p-8">
              <div class="mb-6">
                <label for="guestName" class="block text-sm font-medium text-slate-700 mb-2">
                  Guest Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="guestName"
                  v-model="newGuestName"
                  type="text"
                  required
                  placeholder="Enter guest's full name"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-slate-900 placeholder-slate-400"
                />
              </div>

              <div class="flex space-x-3">
                <button
                  type="button"
                  @click="closeAddGuestModal"
                  class="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="!newGuestName.trim() || isAddingGuest"
                  class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  <span v-if="isAddingGuest" class="inline-flex items-center">
                    <div
                      class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
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
      <div v-if="message" class="fixed bottom-8 right-8 z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
          <AlertCircle v-else class="w-5 h-5 mr-2" />
          {{ message.text }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Send,
  CheckCircle,
  Clock,
  Users,
  Lock,
  CreditCard,
  Mail,
  UserPlus,
  X,
  AlertCircle,
  Trash2,
  ExternalLink,
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

const sendInvitations = () => {
  showMessage('success', 'Bulk invitation sending will be available soon')
}

const sendIndividualInvitation = async (guest: EventGuest) => {
  try {
    const response = await guestService.markInvitationSent(props.eventId, guest.id)
    if (response.success && response.data) {
      // Update the guest in the list
      const index = guests.value.findIndex((g) => g.id === guest.id)
      if (index !== -1) {
        guests.value[index] = response.data
      }
      showMessage('success', `Invitation marked as sent to ${guest.name}`)
      // Refresh stats
      loadGuestStats()
    } else {
      showMessage('error', response.message || 'Failed to mark invitation as sent')
    }
  } catch (error) {
    console.error('Error marking invitation as sent:', error)
    showMessage('error', 'Failed to mark invitation as sent')
  }
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

const getGuestShowcaseUrl = (guest: EventGuest) => {
  // Use SSR meta URL for personalized guest invitations
  return getGuestSSRMetaUrl(props.eventId, guest.name, 'kh')
}

const getDirectGuestShowcaseUrl = (guest: EventGuest) => {
  // Direct URL for opening in browser (non-SSR)
  const showcaseUrl = `/events/${props.eventId}/showcase?guest_name=${encodeURIComponent(guest.name)}&lang=kh`
  return `${window.location.origin}${showcaseUrl}`
}

const viewGuestShowcase = (guest: EventGuest) => {
  // Use direct URL for viewing (non-SSR) so it opens immediately
  const fullUrl = getDirectGuestShowcaseUrl(guest)
  window.open(fullUrl, '_blank')
}

const copyShowcaseLink = (guest: EventGuest) => {
  const fullUrl = getGuestShowcaseUrl(guest)
  navigator.clipboard
    .writeText(fullUrl)
    .then(() => {
      showMessage('success', `Showcase link copied for ${guest.name}`)
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
