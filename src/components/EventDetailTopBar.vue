<template>
  <!-- Top Navigation Bar for Event Detail -->
  <header
    class="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] shadow-lg transition-all duration-300"
    :style="{ marginLeft: headerMarginLeft }"
  >
    <div class="flex items-center justify-between h-[72px] px-4">
      <!-- Left Section: Hamburger + Host Avatar + Event Title -->
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <!-- Hamburger Menu Button -->
        <button
          @click="toggleHomeSidebar"
          class="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl hover:bg-white/20 transition-colors"
          :aria-label="isHomeSidebarVisible ? 'Close main navigation' : 'Open main navigation'"
        >
          <X v-if="isHomeSidebarVisible" class="w-6 h-6 text-white" />
          <Menu v-else class="w-6 h-6 text-white" />
        </button>

        <!-- Host Avatar (hidden on mobile) -->
        <div v-if="organizerAvatar || organizerName" class="hidden md:block flex-shrink-0">
          <div
            v-if="organizerAvatar"
            class="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 shadow-md"
          >
            <img
              :src="organizerAvatar"
              :alt="organizerName || 'Organizer'"
              class="w-full h-full object-cover"
            />
          </div>
          <div
            v-else
            class="w-10 h-10 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center shadow-md"
          >
            <span class="text-white font-semibold text-sm">
              {{ organizerInitials }}
            </span>
          </div>
        </div>

        <!-- Event Info -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <!-- Event Title -->
            <h1 class="text-lg font-bold text-white truncate">
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
          <p v-if="organizerName" class="hidden md:block text-sm text-white/80 truncate">
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
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
          title="Preview showcase"
        >
          <Eye class="w-5 h-5" />
          <span class="hidden md:inline">Preview</span>
        </button>

        <!-- Edit Event Button -->
        <button
          v-if="canEdit && eventId"
          @click="editEvent"
          class="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#1e90ff] bg-white hover:bg-white/90 rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          <Pencil class="w-4 h-4" />
          <span class="hidden sm:inline">Edit</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Spacer to prevent content from going under the fixed header (matches sidebar header height) -->
  <div class="h-[72px]"></div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, type Ref } from 'vue'
import { Menu, X, Pencil, Eye } from 'lucide-vue-next'

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

// Inject the toggle function and state from MainLayout
const toggleHomeSidebarOverlay = inject<() => void>('toggleHomeSidebarOverlay', () => {})
const showHomeSidebarOverlay = inject<Ref<boolean>>('showHomeSidebarOverlay')
const isCollapsed = inject<Ref<boolean>>('isCollapsed')

const toggleHomeSidebar = () => {
  toggleHomeSidebarOverlay()
}

// Check if home sidebar is currently visible
const isHomeSidebarVisible = computed(() => {
  return showHomeSidebarOverlay?.value ?? false
})

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

  if (!isHomeSidebarVisible.value) {
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

// Status badge classes - white background variants for visibility on gradient
const statusClasses = computed(() => {
  switch (props.eventStatus) {
    case 'upcoming':
      return 'bg-white text-blue-600'
    case 'ongoing':
      return 'bg-white text-green-600'
    case 'past':
      return 'bg-white/80 text-slate-600'
    case 'draft':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-white/80 text-slate-600'
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
</script>
