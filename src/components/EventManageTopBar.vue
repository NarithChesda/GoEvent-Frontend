<template>
  <!-- Top Navigation Bar for Event Detail -->
  <header
    class="fixed top-0 left-0 right-0 z-50 h-16 premium-chrome glass-manage-header md:border-b md:border-slate-200/30"
    :class="{ 'is-scrolled': isScrolled }"
    :style="{ marginLeft: headerMarginLeft }"
  >
    <!-- `relative` keeps this row above the glass highlight sheet the header
         paints on `::before` (a positioned pseudo would otherwise stack over
         non-positioned in-flow content and wash out the title). -->
    <div class="relative flex items-center justify-between h-full px-4 sm:px-6">
      <!-- Left Section: Back Button + Host Avatar + Event Title -->
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <!-- Back Button: returns to wherever this page was opened from, and
             only falls back to the events list on a cold entry. -->
        <button
          @click="goBack"
          class="flex-shrink-0 flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11 rounded-xl hover:bg-slate-50/80 transition-all duration-200"
          :aria-label="t('management.topBar.back')"
          :title="t('management.topBar.back')"
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
              {{ eventTitle || t('management.topBar.eventDetailsFallback') }}
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
            {{ t('management.topBar.organizedBy', { name: organizerName }) }}
          </p>
        </div>
      </div>

      <!-- Right Section: Actions -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Publish Button (for public draft events) -->
        <button
          v-if="canEdit && eventId && eventPrivacy === 'public' && actualEventStatus === 'draft'"
          @click="publishEvent"
          class="topbar-outline-btn flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-lg transition-all duration-200"
          :title="t('management.topBar.publishTitle')"
        >
          <Globe class="w-4 h-4" />
          <span class="hidden md:inline">{{ t('management.topBar.publishBtn') }}</span>
        </button>

        <!-- Edit Event Button -->
        <button
          v-if="canEdit && eventId"
          @click="editEvent"
          class="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] rounded-lg transition-all duration-200 shadow-sm"
        >
          <Pencil class="w-4 h-4" />
          <span class="hidden sm:inline">{{ t('management.topBar.editBtn') }}</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Spacer to prevent content from going under the fixed header -->
  <div class="h-16"></div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Pencil, ArrowLeft, Globe } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

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

const { t } = useAppLanguage()

const props = withDefaults(defineProps<Props>(), {
  eventId: '',
  eventTitle: '',
  eventStatus: null,
  eventPrivacy: 'private',
  actualEventStatus: 'draft',
  canEdit: false,
  organizerName: '',
  organizerAvatar: '',
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

// Drives the desktop glass treatment: the bar is transparent while the page is
// at rest and turns to glass once anything scrolls under it (same rule as
// TopNavBar on every other page).
const isScrolled = ref(false)
const handleScroll = () => {
  isScrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll() // Check initial scroll position
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
  window.removeEventListener('scroll', handleScroll)
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

// Status label with translation
const statusLabel = computed(() => {
  if (!props.eventStatus) return ''
  return t(`management.topBar.status.${props.eventStatus}`)
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

const router = useRouter()
const route = useRoute()

const isInternalPath = (path: unknown): path is string =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')

/**
 * Where this page was entered from, captured once at setup — before the user
 * can switch tabs and put one of the page's own history entries behind us.
 * `undefined` for a cold entry: a shared link, a new tab, an external referrer.
 */
const entryReferrer = (window.history.state as { back?: unknown } | null)?.back

/** A history entry belonging to this same manage page (another tab). */
const isSamePage = (path: string) => path.split('?')[0] === route.path

const goBack = () => {
  const previous = (window.history.state as { back?: unknown } | null)?.back

  // Straight back whenever the entry behind us is a different page: that's what
  // the arrow's shape promises, and it restores the caller's scroll position.
  if (isInternalPath(previous) && !isSamePage(previous)) {
    router.back()
    return
  }

  // Otherwise the entry behind us is this page on another tab, so back would
  // land the user right back here. Go to where the page was entered from
  // instead, falling back to the events list when that isn't known.
  router.push(
    isInternalPath(entryReferrer) && !isSamePage(entryReferrer) ? entryReferrer : '/events',
  )
}
</script>

<style scoped>
/* Below `lg`: opaque, matching EventManageMobileTabBar's own surface — that
   bar and the Design Studio's sticky toolbar sit directly under this one and
   are meant to read as one continuous header (hence the 1px overlap hack
   below), so they have to agree on transparency. At 0.9 alpha the page content
   scrolling behind this bar competed with the event title on top of it;
   blur(20px) blurred that content without stopping it.

   The fill itself comes from `.premium-chrome` (MainLayout), which paints the
   page's own background stack sized to the viewport: this bar sits in the top
   strip, which is where `premium-bg`'s brand bloom is strongest, so a private
   copy of the base gradient — what this used to carry — left the bar visibly
   paler than the page and drew a hard colour edge along its bottom lip. This
   one is at the very top, so it needs no `--premium-chrome-top` offset.

   From `lg` there is no tab bar under it — the header, the icon rail and the
   Design Studio panel are the only chrome, and each used to paint its own
   near-white fill over `premium-bg`. Three fills that can't match a gradient
   read as three mismatched panels, so from `lg` all three go transparent and
   the page's own background is the only one on screen (see the
   min-width:1024px block). */
.glass-manage-header {
  transition:
    margin-left 300ms ease,
    border-color 200ms ease,
    box-shadow 200ms ease,
    backdrop-filter 200ms ease,
    -webkit-backdrop-filter 200ms ease;
}

/* On mobile, add 1px overlap to prevent sub-pixel gap with tab bar */
@media (max-width: 767px) {
  .glass-manage-header {
    padding-bottom: 1px;
    margin-bottom: -1px;
  }
}

/*
  Desktop: the same liquid-glass treatment TopNavBar uses on every other page
  (.glass-nav) — transparent at rest so the page's wash and bloom run straight
  through the bar, turning to glass once content scrolls under it. The blur
  stays on permanently (over a smooth gradient it changes nothing at rest, so
  leaving it avoids a mid-scroll pop); the saturation cannot, because it filters
  the backdrop even under a fully transparent bar and would leave the top strip
  visibly greener than the page a pixel below it. It rides in on `is-scrolled`
  from an identity 100% instead.
*/
@media (min-width: 1024px) {
  .glass-manage-header {
    background: rgba(255, 255, 255, 0);
    border-bottom-color: transparent;
    backdrop-filter: blur(20px) saturate(100%);
    -webkit-backdrop-filter: blur(20px) saturate(100%);
  }

  .glass-manage-header.is-scrolled {
    border-bottom-color: rgba(226, 232, 240, 0.5);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    box-shadow: 0 10px 15px -3px rgba(46, 204, 113, 0.05);
  }

  /* Light catching the top face of the slab, thinning through the middle and
     picking up again at the bottom lip. A gradient can't be transitioned, so it
     lives on this sheet and its opacity fades instead. */
  .glass-manage-header::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 200ms ease;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.42) 0%,
      rgba(255, 255, 255, 0.2) 55%,
      rgba(255, 255, 255, 0.28) 100%
    );
  }

  .glass-manage-header.is-scrolled::before {
    opacity: 1;
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
