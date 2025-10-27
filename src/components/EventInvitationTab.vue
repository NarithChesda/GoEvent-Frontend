
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
        Your template {{ props.event.event_template_details?.name || 'Selected Template' }}
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
      <!-- Guest Groups Header and Stats -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
        <div class="flex flex-col gap-3 sm:gap-2 mb-3 sm:mb-4">
          <div class="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
            <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center">
              <Users class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] mr-1.5 sm:mr-2" />
              Guest Groups
            </h3>
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
              <button
                @click="showCreateGroupModal = true"
                class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-2 px-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg inline-flex items-center text-xs sm:text-sm"
              >
                <UserPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                <span class="hidden sm:inline">Create Group</span>
                <span class="sm:hidden">Group</span>
              </button>
              <button
                @click="showAddGuestModal = true"
                class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-xs sm:text-sm"
              >
                <UserPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                <span class="hidden sm:inline">Add Guest</span>
                <span class="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Guest Groups Display -->
        <div v-if="loadingGroups" class="text-center py-6 sm:py-8">
          <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:h-8 border-b-2 border-[#1e90ff] mx-auto"></div>
          <p class="text-xs sm:text-sm text-slate-600 mt-2">Loading guest groups...</p>
        </div>

        <div v-else-if="groups.length === 0" class="text-center py-8 sm:py-12">
          <Users class="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
          <p class="text-sm sm:text-base text-slate-500">No guest groups yet</p>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">
            Create a group before adding guests
          </p>
        </div>

        <!-- Group List -->
        <div v-else class="space-y-3">
          <GuestGroupCard
            v-for="group in groups"
            :key="group.id"
            :group="group"
            :guests="getGroupGuests(group.id)"
            :loading="isGroupLoading(group.id)"
            :is-expanded="isGroupExpanded(group.id)"
            :current-page="getGroupPagination(group.id).currentPage"
            :total-count="getGroupPagination(group.id).totalCount"
            :page-size="PAGE_SIZE"
            :search-term="getGroupPagination(group.id).searchTerm"
            @toggle="handleGroupToggle(group.id)"
            @delete="openDeleteGroupModal"
            @copy-link="copyShowcaseLink"
            @mark-sent="handleMarkAsSent"
            @delete-guest="openDeleteGuestModal"
            @next-page="nextGroupPage(group.id)"
            @previous-page="previousGroupPage(group.id)"
            @search="(searchTerm) => handleGroupSearch(group.id, searchTerm)"
          />
        </div>
      </div>
    </div>

    <!-- Delete Guest Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      title="Delete Guest"
      :item-name="(deleteTargetGuest && deleteTargetGuest.name) || ''"
      :loading="deletingGuest"
      @confirm="confirmDeleteGuest"
      @cancel="cancelDeleteGuest"
    />

    <!-- Delete Group Modal -->
    <DeleteConfirmModal
      :show="showDeleteGroupModal"
      title="Delete Group"
      :item-name="(deleteTargetGroup && deleteTargetGroup.name) || ''"
      :loading="deletingGroup"
      :warning-message="`This will delete all ${deleteTargetGroup?.guest_count || 0} guests in this group!`"
      @confirm="confirmDeleteGroup"
      @cancel="cancelDeleteGroup"
    />

    <!-- Create Group Modal -->
    <CreateGroupModal
      :show="showCreateGroupModal"
      :is-creating="isCreatingGroup"
      @close="showCreateGroupModal = false"
      @create="handleCreateGroup"
    />

    <!-- Add Guest Modal -->
    <AddGuestModal
      :show="showAddGuestModal"
      :groups="groups"
      :is-adding="isAddingGuest"
      :is-importing="isImporting"
      :selected-file="selectedFile"
      :is-dragging="isDragging"
      @close="handleCloseAddGuestModal"
      @add-guest="handleAddGuest"
      @import="handleBulkImport"
      @download-template="downloadTemplate"
      @file-select="handleFileSelect"
      @file-drop="handleFileDrop"
      @drag-over="handleDragOver"
      @drag-leave="handleDragLeave"
    />

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
  AlertCircle,
} from 'lucide-vue-next'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import { useGuestGroups } from '../composables/invitation/useGuestGroups'
import { useGuests } from '../composables/invitation/useGuests'
import { useBulkImport } from '../composables/invitation/useBulkImport'
import type { Event, EventGuest, GuestGroup } from '../services/api'
import { getGuestSSRMetaUrl } from '../utils/metaUtils'
import SocialMediaPreview from './SocialMediaPreview.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import GuestGroupCard from './invitation/GuestGroupCard.vue'
import CreateGroupModal from './invitation/CreateGroupModal.vue'
import AddGuestModal from './invitation/AddGuestModal.vue'

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

// Use composables
const { isTemplateActivated, loadPayments, loadingPayments } = usePaymentTemplateIntegration(props.event)

const {
  groups,
  loadingGroups,
  loadGroups,
  createGroup,
  deleteGroup,
  toggleGroupExpansion,
  isGroupExpanded,
} = useGuestGroups(props.eventId)

const {
  guestStats,
  loadingStats,
  PAGE_SIZE,
  getGroupPagination,
  getGroupTotalPages,
  getGroupGuests,
  isGroupLoading,
  loadGuestsForGroup,
  loadGuestStats,
  createGuest,
  deleteGuest,
  markGuestAsSent,
  nextGroupPage,
  previousGroupPage,
  setGroupSearchTerm,
} = useGuests(props.eventId)

const {
  selectedFile,
  isDragging,
  isImporting,
  handleFileSelect,
  handleFileDrop,
  handleDragOver,
  handleDragLeave,
  importGuests,
  downloadTemplate,
  resetImportState,
} = useBulkImport(props.eventId)

// Local state
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const showAddGuestModal = ref(false)
const showCreateGroupModal = ref(false)
const isAddingGuest = ref(false)
const isCreatingGroup = ref(false)

// Delete modal state
const showDeleteModal = ref(false)
const deletingGuest = ref(false)
const deleteTargetGuest = ref<EventGuest | null>(null)
const showDeleteGroupModal = ref(false)
const deleteTargetGroup = ref<GuestGroup | null>(null)
const deletingGroup = ref(false)

// Computed properties
const hasTemplatePayment = computed(() => {
  if (!props.event?.event_template) return false
  return isTemplateActivated.value
})

const acceptedInvitations = computed(() => guestStats.value?.viewed || 0)
const totalGuests = computed(() => guestStats.value?.total_guests || 0)

// Methods
const redirectToPaymentTab = () => {
  emit('tab-change', 'payment')
}

const redirectToTemplateTab = () => {
  emit('tab-change', 'template')
}

const handleGroupToggle = async (groupId: number) => {
  const wasExpanded = toggleGroupExpansion(groupId)
  // If the group was just expanded and has no guests loaded yet, load them
  if (wasExpanded && getGroupGuests(groupId).length === 0) {
    await loadGuestsForGroup(groupId, 1)
  }
}

const handleGroupSearch = (groupId: number, searchTerm: string) => {
  setGroupSearchTerm(groupId, searchTerm)
}

const handleCreateGroup = async (data: { name: string; description?: string; color: string }) => {
  isCreatingGroup.value = true

  const response = await createGroup({
    name: data.name,
    description: data.description,
    color: data.color,
    order: groups.value.length + 1,
  })

  if (response.success && response.data) {
    showMessage('success', `Group "${response.data.name}" created`)
    showCreateGroupModal.value = false
  } else {
    showMessage('error', response.message || 'Failed to create group')
  }

  isCreatingGroup.value = false
}

const handleAddGuest = async (name: string, groupId: number) => {
  isAddingGuest.value = true

  const response = await createGuest(name, groupId)

  if (response.success && response.data) {
    showMessage('success', `${response.data.name} added to guest list`)
    showAddGuestModal.value = false
    // Refresh stats and groups
    await loadGuestStats()
    await loadGroups()
  } else {
    showMessage('error', response.message || 'Failed to add guest')
  }

  isAddingGuest.value = false
}

const handleBulkImport = async (groupId: number) => {
  const response = await importGuests(groupId)

  if (response.success && response.data) {
    const { created, skipped, skipped_guests } = response.data

    // Refresh stats and groups
    await loadGuestStats()
    await loadGroups()

    // Refresh the group's guest list if it's currently loaded
    const pagination = getGroupPagination(groupId)
    await loadGuestsForGroup(groupId, pagination.currentPage)

    // Show results
    if (skipped > 0) {
      showMessage(
        'success',
        `Imported ${created} guests. ${skipped} skipped: ${skipped_guests.map((g) => g.name).join(', ')}`,
      )
    } else {
      showMessage('success', `Successfully imported ${created} guests`)
    }

    showAddGuestModal.value = false
  } else {
    showMessage('error', response.message || 'Failed to import guests')
  }
}

const handleCloseAddGuestModal = () => {
  showAddGuestModal.value = false
  resetImportState()
}

const openDeleteGroupModal = (group: GuestGroup) => {
  deleteTargetGroup.value = group
  showDeleteGroupModal.value = true
}

const confirmDeleteGroup = async () => {
  if (!deleteTargetGroup.value) return

  deletingGroup.value = true

  const response = await deleteGroup(deleteTargetGroup.value.id)

  if (response.success) {
    showMessage(
      'success',
      `Group "${deleteTargetGroup.value.name}" and all its guests have been deleted`,
    )
    await loadGuestStats()
  } else {
    showMessage('error', response.message || 'Failed to delete group')
  }

  deletingGroup.value = false
  showDeleteGroupModal.value = false
  deleteTargetGroup.value = null
}

const cancelDeleteGroup = () => {
  if (deletingGroup.value) return
  showDeleteGroupModal.value = false
  deleteTargetGroup.value = null
}

const openDeleteGuestModal = (guest: EventGuest) => {
  deleteTargetGuest.value = guest
  showDeleteModal.value = true
}

const confirmDeleteGuest = async () => {
  if (!deleteTargetGuest.value) return
  const groupId = deleteTargetGuest.value.group

  deletingGuest.value = true

  const response = await deleteGuest(deleteTargetGuest.value.id, groupId)

  if (response.success) {
    showMessage('success', deleteTargetGuest.value.name + ' removed from guest list')
    await loadGuestStats()
    await loadGroups()
  } else {
    showMessage('error', response.message || 'Failed to remove guest')
  }

  deletingGuest.value = false
  showDeleteModal.value = false
  deleteTargetGuest.value = null
}

const cancelDeleteGuest = () => {
  if (deletingGuest.value) return
  showDeleteModal.value = false
  deleteTargetGuest.value = null
}

const handleMarkAsSent = async (guest: EventGuest) => {
  const response = await markGuestAsSent(guest.id, guest.group)

  if (response.success) {
    showMessage('success', `${guest.name} marked as sent`)
  } else {
    showMessage('error', response.message || 'Failed to mark guest as sent')
  }
}

const getGuestShowcaseUrl = (guest: EventGuest, language: 'en' | 'kh' = 'kh') => {
  return getGuestSSRMetaUrl(props.eventId, guest.name, language)
}

const getDirectGuestShowcaseUrl = (guest: EventGuest, language: 'en' | 'kh' = 'kh') => {
  const showcaseUrl = `/events/${props.eventId}/showcase?guest_name=${encodeURIComponent(guest.name)}&lang=${language}`
  return `${window.location.origin}${showcaseUrl}`
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

// Lifecycle
onMounted(() => {
  loadPayments()
})

// Watch for template payment status changes
watch(hasTemplatePayment, (isActivated) => {
  if (isActivated) {
    loadGroups()
    loadGuestStats()
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
