<template>
  <!-- Top Navigation Bar for Event Detail -->
  <header
    class="fixed top-0 left-0 right-0 z-50 h-16 bg-gradient-to-r from-[#2ecc71]/10 via-white to-[#1e90ff]/10 backdrop-blur-sm border-b border-[#2ecc71]/20 transition-all duration-300"
    :style="{ marginLeft: headerMarginLeft }"
  >
    <div class="flex items-center justify-between h-full px-4 sm:px-6">
      <!-- Left Section: Back Button + Host Avatar + Event Title -->
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <!-- Back to Events Button -->
        <button
          @click="goBackToEvents"
          class="flex-shrink-0 flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Back to Events"
          title="Back to Events"
        >
          <ArrowLeft class="w-5 h-5 lg:w-6 lg:h-6 text-slate-700" />
        </button>

        <!-- Host Avatar (hidden on mobile) -->
        <div v-if="organizerAvatar || organizerName" class="hidden md:block flex-shrink-0">
          <div
            v-if="organizerAvatar"
            class="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm"
          >
            <img
              :src="organizerAvatar"
              :alt="organizerName || 'Organizer'"
              class="w-full h-full object-cover"
            />
          </div>
          <div
            v-else
            class="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center shadow-sm"
          >
            <span class="text-slate-700 font-semibold text-sm">
              {{ organizerInitials }}
            </span>
          </div>
        </div>

        <!-- Event Info -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <!-- Event Title -->
            <h1 class="text-lg font-bold text-slate-900 truncate">
              {{ eventTitle || 'Event Details' }}
            </h1>
            <!-- Event Status Badge (hidden on mobile) -->
            <span
              v-if="eventStatus"
              :class="[
                'hidden md:inline-block flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full',
                statusClasses
              ]"
            >
              {{ statusLabel }}
            </span>
          </div>
          <!-- Organizer name (hidden on mobile) -->
          <p v-if="organizerName" class="hidden md:block text-sm text-slate-600 truncate">
            by {{ organizerName }}
          </p>
        </div>
      </div>

      <!-- Right Section: Actions -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Preview Showcase Button -->
        <button
          v-if="canEdit && eventId"
          @click="previewShowcase"
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          title="Preview showcase"
        >
          <Eye class="w-5 h-5" />
          <span class="hidden md:inline">Preview</span>
        </button>

        <!-- Edit Event Button -->
        <button
          v-if="canEdit && eventId"
          @click="editEvent"
          class="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          <Pencil class="w-4 h-4" />
          <span class="hidden sm:inline">Edit</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Spacer to prevent content from going under the fixed header -->
  <div class="h-16"></div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { Pencil, Eye, ArrowLeft } from 'lucide-vue-next'

interface Props {
  eventId?: string
  eventTitle?: string
  eventStatus?: 'upcoming' | 'ongoing' | 'past' | 'draft' | null
  canEdit?: boolean
  organizerName?: string
  organizerAvatar?: string
}

const props = withDefaults(defineProps<Props>(), {
  eventId: '',
  eventTitle: '',
  eventStatus: null,
  canEdit: false,
  organizerName: '',
  organizerAvatar: ''
})

const emit = defineEmits<{
  edit: []
}>()

// Inject sidebar state from MainLayout (with default values to prevent warnings)
const showHomeSidebarOverlay = inject<Ref<boolean>>('showHomeSidebarOverlay', ref(false))
const isCollapsed = inject<Ref<boolean>>('isCollapsed', ref(false))

// Reactive window width for responsive margin calculation
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const isDesktop = computed(() => windowWidth.value >= 1024)

// Update window width on resize
const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

// Calculate header margin based on home sidebar state (only on desktop lg+)
const headerMarginLeft = computed(() => {
  // Only apply margin on lg screens and above
  if (!isDesktop.value) {
    return '0px'
  }

  if (!showHomeSidebarOverlay?.value) {
    return '0px'
  }

  // Home sidebar width: collapsed = 96px (w-24), expanded = 256px (w-64)
  const homeSidebarWidth = isCollapsed?.value ? 96 : 256
  return `${homeSidebarWidth}px`
})

// Get organizer initials for avatar fallback
const organizerInitials = computed(() => {
  if (!props.organizerName) return '?'
  const names = props.organizerName.split(' ')
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase()
  }
  return props.organizerName.substring(0, 2).toUpperCase()
})

// Status badge classes - colorful variants for light background
const statusClasses = computed(() => {
  switch (props.eventStatus) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-700'
    case 'ongoing':
      return 'bg-green-100 text-green-700'
    case 'past':
      return 'bg-slate-100 text-slate-600'
    case 'draft':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
})

// Status label with proper capitalization
const statusLabel = computed(() => {
  if (!props.eventStatus) return ''
  return props.eventStatus.charAt(0).toUpperCase() + props.eventStatus.slice(1)
})

// Actions
const editEvent = () => {
  if (props.eventId) {
    emit('edit')
  }
}

const previewShowcase = () => {
  if (props.eventId) {
    // Open showcase in new tab with guest name and language params
    const baseUrl = window.location.origin
    const url = new URL(`${baseUrl}/events/${props.eventId}/showcase`)
    url.searchParams.append('guest_name', 'ភ្ញៀវកិត្តិយស')
    url.searchParams.append('lang', 'kh')
    window.open(url.toString(), '_blank')
  }
}

const router = useRouter()

const goBackToEvents = () => {
  router.push('/events')
}
</script>
