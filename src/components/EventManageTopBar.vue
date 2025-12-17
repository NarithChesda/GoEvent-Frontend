<template>
  <!-- Top Navigation Bar for Event Detail -->
  <header
    class="fixed top-0 left-0 right-0 z-50 h-16 glass-manage-header md:border-b md:border-slate-200/30 transition-all duration-300"
    :style="{ marginLeft: headerMarginLeft }"
  >
    <div class="flex items-center justify-between h-full px-4 sm:px-6">
      <!-- Left Section: Back Button + Host Avatar + Event Title -->
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <!-- Back to Events Button -->
        <button
          @click="goBackToEvents"
          class="flex-shrink-0 flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11 rounded-xl hover:bg-slate-50/80 transition-all duration-200"
          aria-label="Back to Events"
          title="Back to Events"
        >
          <ArrowLeft class="w-5 h-5 lg:w-5 lg:h-5 text-slate-600" />
        </button>

        <!-- Host Avatar (hidden on mobile) -->
        <div v-if="organizerAvatar || organizerName" class="hidden md:block flex-shrink-0">
          <div
            v-if="organizerAvatar && !avatarError"
            class="w-9 h-9 rounded-full overflow-hidden ring-1 ring-slate-200/50"
          >
            <img
              :src="organizerAvatar"
              :alt="organizerName || 'Organizer'"
              class="w-full h-full object-cover"
              @error="handleAvatarError"
            />
          </div>
          <div
            v-else
            class="w-9 h-9 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] ring-1 ring-slate-200/50 flex items-center justify-center"
          >
            <span class="text-white font-medium text-xs">
              {{ organizerInitials }}
            </span>
          </div>
        </div>

        <!-- Event Info -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2.5">
            <!-- Event Title -->
            <h1 class="text-base lg:text-lg font-semibold text-slate-900 truncate">
              {{ eventTitle || 'Event Details' }}
            </h1>
            <!-- Event Status Badge (hidden on mobile) -->
            <span
              v-if="eventStatus"
              :class="[
                'hidden md:inline-block flex-shrink-0 px-2.5 py-0.5 text-xs font-medium rounded-full',
                statusClasses
              ]"
            >
              {{ statusLabel }}
            </span>
          </div>
          <!-- Organizer name (hidden on mobile) -->
          <p v-if="organizerName" class="hidden md:block text-xs text-slate-500 truncate mt-0.5">
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
          class="topbar-outline-btn flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-lg transition-all duration-200"
          title="Preview showcase"
        >
          <Eye class="w-4 h-4" />
          <span class="hidden md:inline">Preview</span>
        </button>

        <!-- Publish Button (for public draft events) -->
        <button
          v-if="canEdit && eventId && eventPrivacy === 'public' && actualEventStatus === 'draft'"
          @click="publishEvent"
          class="topbar-outline-btn flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-lg transition-all duration-200"
          title="Publish event"
        >
          <Globe class="w-4 h-4" />
          <span class="hidden md:inline">Publish</span>
        </button>

        <!-- Edit Event Button -->
        <button
          v-if="canEdit && eventId"
          @click="editEvent"
          class="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] rounded-lg transition-all duration-200 shadow-sm"
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
import { Pencil, Eye, ArrowLeft, Globe } from 'lucide-vue-next'

interface Props {
  eventId?: string
  eventTitle?: string
  eventStatus?: 'upcoming' | 'ongoing' | 'past' | 'draft' | null
  eventPrivacy?: 'public' | 'private'
  /** The actual backend status of the event (draft, published, cancelled, completed) */
  actualEventStatus?: 'draft' | 'published' | 'cancelled' | 'completed'
  canEdit?: boolean
  organizerName?: string
  organizerAvatar?: string
}

const props = withDefaults(defineProps<Props>(), {
  eventId: '',
  eventTitle: '',
  eventStatus: null,
  eventPrivacy: 'private',
  actualEventStatus: 'draft',
  canEdit: false,
  organizerName: '',
  organizerAvatar: ''
})

const emit = defineEmits<{
  edit: []
  publish: []
}>()

// Avatar error state
const avatarError = ref(false)
const handleAvatarError = () => {
  avatarError.value = true
}

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

const publishEvent = () => {
  if (props.eventId) {
    emit('publish')
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

<style scoped>
/* Glass header effect - blends with brand gradient background */
.glass-manage-header {
  background: linear-gradient(
    135deg,
    rgba(248, 255, 254, 0.9) 0%,
    rgba(240, 253, 249, 0.9) 50%,
    rgba(240, 249, 255, 0.9) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* On mobile, add 1px overlap to prevent sub-pixel gap with tab bar */
@media (max-width: 767px) {
  .glass-manage-header {
    padding-bottom: 1px;
    margin-bottom: -1px;
  }
}

/* Thin outline button style */
.topbar-outline-btn {
  border: 1px solid rgba(203, 213, 225, 0.5);
}

.topbar-outline-btn:hover {
  border-color: rgba(203, 213, 225, 0.8);
}
</style>
