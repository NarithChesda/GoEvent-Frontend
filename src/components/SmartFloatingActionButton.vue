<template>
  <!-- Smart Floating Action Button -->
  <div v-if="shouldShowFab" class="fixed bottom-20 lg:bottom-4 right-6 z-[60]" @click.stop>
    <!-- Main FAB Button -->
    <button
      @click="handleFabClick"
      class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center h-14 w-14 hover:scale-110"
      :class="{ 'ring-4 ring-[#87CEEB]': showActionMenu }"
      :aria-label="fabAriaLabel"
    >
      <component :is="fabIcon" class="w-6 h-6" />
    </button>

    <!-- Event Action Menu (Only for About Tab) -->
    <EventActionMenu
      v-if="activeTab === 'about'"
      :is-open="showActionMenu"
      :can-delete="canDelete"
      :event-title="eventTitle"
      :event-id="eventId"
      @close="closeActionMenu"
      @edit="$emit('edit', eventId)"
      @delete="$emit('delete', eventId)"
      ref="actionMenuRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Plus,
  UserPlus,
  ImageIcon,
  FileText,
  Pencil,
  UserCheck,
  CreditCard,
  Users,
  Palette,
  Zap,
  Camera,
  Shirt,
} from 'lucide-vue-next'
import EventActionMenu from './EventActionMenu.vue'

interface Props {
  activeTab: string
  activeSubTab?: string
  guestManagementSubTab?: string
  expenseTrackingSubTab?: string
  canEdit: boolean
  canDelete: boolean
  eventTitle: string
  eventId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'add-agenda': []
  'add-host': []
  'add-photo': []
  'add-event-text': []
  'open-checkin': []
  'open-payment': []
  'invite-collaborator': []
  'browse-template': []
  'add-guest': []
  'add-group': []
  'quick-add': []
  'add-dress-code': []
  'edit': [eventId: string]
  'delete': [eventId: string]
}>()

const showActionMenu = ref(false)
const actionMenuRef = ref<InstanceType<typeof EventActionMenu> | null>(null)

// Determine if FAB should be visible
const shouldShowFab = computed(() => {
  // Only show if user can edit
  if (!props.canEdit) return false

  // Show for these tabs (including expenses summary)
  const validTabs = ['about', 'agenda', 'hosts', 'media', 'event-texts', 'attendees', 'payment', 'collaborator', 'template', 'guest-management', 'expenses']
  return validTabs.includes(props.activeTab)
})

// Determine FAB icon based on active tab and sub-tab
const fabIcon = computed(() => {
  // Handle media tab with sub-tabs
  if (props.activeTab === 'media') {
    switch (props.activeSubTab) {
      case 'gallery':
        return ImageIcon
      case 'payment':
        return CreditCard
      case 'dress-code':
        return Shirt
      default:
        return ImageIcon // Default to photo gallery
    }
  }

  // Handle guest-management tab with sub-tabs
  if (props.activeTab === 'guest-management') {
    switch (props.guestManagementSubTab) {
      case 'guests':
        return UserPlus
      case 'groups':
        return Users
      default:
        return UserPlus // Default to guests
    }
  }

  // Handle expenses tab with sub-tabs - use Zap for Quick Add consistency
  if (props.activeTab === 'expenses') {
    return Zap
  }

  // Handle other tabs
  switch (props.activeTab) {
    case 'agenda':
      return Plus
    case 'hosts':
      return UserPlus
    case 'event-texts':
      return FileText
    case 'attendees':
      return Camera
    case 'payment':
      return CreditCard
    case 'collaborator':
      return Users
    case 'template':
      return Palette
    case 'about':
    default:
      return Pencil
  }
})

// Determine FAB aria label
const fabAriaLabel = computed(() => {
  // Handle media tab with sub-tabs
  if (props.activeTab === 'media') {
    switch (props.activeSubTab) {
      case 'gallery':
        return 'Add photo'
      case 'payment':
        return 'Add payment method'
      case 'dress-code':
        return 'Add dress code'
      default:
        return 'Add photo'
    }
  }

  // Handle guest-management tab with sub-tabs
  if (props.activeTab === 'guest-management') {
    switch (props.guestManagementSubTab) {
      case 'guests':
        return 'Add guest'
      case 'groups':
        return 'Add guest group'
      default:
        return 'Add guest'
    }
  }

  // Handle expenses tab with sub-tabs - use Quick Add for consistency
  if (props.activeTab === 'expenses') {
    return 'Quick Add'
  }

  // Handle other tabs
  switch (props.activeTab) {
    case 'agenda':
      return 'Add agenda item'
    case 'hosts':
      return 'Add host'
    case 'event-texts':
      return 'Add event text'
    case 'attendees':
      return 'Check in attendee'
    case 'payment':
      return 'Make payment'
    case 'collaborator':
      return 'Invite collaborator'
    case 'template':
      return 'Browse templates'
    case 'about':
      return 'Edit event'
    default:
      return 'Action'
  }
})

// Handle FAB click based on active tab and sub-tab
const handleFabClick = () => {
  // Handle media tab with sub-tabs
  if (props.activeTab === 'media') {
    switch (props.activeSubTab) {
      case 'gallery':
        emit('add-photo')
        break
      case 'payment':
        emit('open-payment')
        break
      case 'dress-code':
        emit('add-dress-code')
        break
      default:
        emit('add-photo')
        break
    }
    return
  }

  // Handle guest-management tab with sub-tabs
  if (props.activeTab === 'guest-management') {
    switch (props.guestManagementSubTab) {
      case 'guests':
        emit('add-guest')
        break
      case 'groups':
        emit('add-group')
        break
      default:
        emit('add-guest')
        break
    }
    return
  }

  // Handle expenses tab - use Quick Add for all sub-tabs
  if (props.activeTab === 'expenses') {
    emit('quick-add')
    return
  }

  // Handle other tabs
  switch (props.activeTab) {
    case 'agenda':
      emit('add-agenda')
      break
    case 'hosts':
      emit('add-host')
      break
    case 'event-texts':
      emit('add-event-text')
      break
    case 'attendees':
      emit('open-checkin')
      break
    case 'payment':
      emit('open-payment')
      break
    case 'collaborator':
      emit('invite-collaborator')
      break
    case 'template':
      emit('browse-template')
      break
    case 'about':
      toggleActionMenu()
      break
  }
}

const toggleActionMenu = () => {
  showActionMenu.value = !showActionMenu.value
}

const closeActionMenu = () => {
  showActionMenu.value = false
}

// Expose method to reset deleting state
const resetDeleting = () => {
  actionMenuRef.value?.resetDeleting()
}

defineExpose({
  resetDeleting,
  closeActionMenu,
})
</script>

<style scoped>
/* Animations handled by Tailwind classes */
</style>
