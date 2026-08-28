<template>
  <!-- Fixed position wrapper for stable mobile scrolling.
       Uses `lg:hidden` (not `md:hidden`) so it still appears on tablet
       portrait (768–1023px), where the desktop sidebar is not shown yet.
       Desktop sidebar breakpoint is `lg:flex` in EventNavigationTabs.vue,
       so these two must stay in sync or the 768–1023 range loses navigation
       entirely. -->
  <div
    ref="rootRef"
    class="lg:hidden fixed top-16 left-0 right-0 z-40 premium-chrome glass-manage-mobile-tabs tab-bar-container"
  >
    <div class="relative">
      <!-- Scrollable tabs. The ends fade out to show the row scrolls — done by
           masking the row itself rather than by laying a colour-matched
           gradient over each end, because the bar's fill is the page's own
           background (see `.premium-chrome`) and no flat hex can match it. -->
      <div
        ref="tabContainer"
        class="tabs-scroller flex overflow-x-auto scrollbar-hide px-2 py-1 gap-1"
        role="tablist"
        aria-label="Event detail sections"
      >
        <button
          v-for="(tab, index) in visibleTabs"
          :key="tab.id"
          ref="tabButtons"
          @click="selectTab(tab.id)"
          class="flex-shrink-0 flex items-center justify-center px-4 py-2 text-sm font-medium transition-all duration-200 min-h-[40px] relative"
          :class="activeTab === tab.id ? '' : 'active:scale-95'"
          :aria-current="activeTab === tab.id ? 'page' : undefined"
          :aria-label="`${tab.label}${activeTab === tab.id ? ' (current)' : ''}`"
          :aria-selected="activeTab === tab.id"
          role="tab"
          @keydown="handleKeyboard($event, index)"
        >
          <!-- Active indicator (bottom border) -->
          <div
            v-if="activeTab === tab.id"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-t-sm"
          ></div>
          <span
            class="whitespace-nowrap transition-colors duration-200"
            :class="activeTab === tab.id ? 'text-[#2ecc71] font-semibold' : 'text-slate-500'"
          >{{ tab.mobileLabel || tab.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { TabConfig } from './EventNavigationTabs.vue'

interface Props {
  activeTab: string
  tabs: TabConfig[]
  canViewRegistration?: boolean
  canViewMedia?: boolean
  canViewTemplate?: boolean
  canViewPayment?: boolean
  canViewGuestManagement?: boolean
  canViewAnalytics?: boolean
  canViewExpenses?: boolean
  canViewDonation?: boolean
  canViewTickets?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'tab-change': [tabId: string]
}>()

const tabContainer = ref<HTMLElement>()
const tabButtons = ref<HTMLElement[]>([])

// ---------------------------------------------------------------------------
// Published height.
//
// This bar is `position: fixed`, so everything that has to live under it needs
// to know where its bottom edge is: EventManageView's in-flow spacer, and the
// Design Studio's own sticky toolbar (which docks directly beneath it). Both
// used to hardcode `52px` — two independent guesses at a height nothing
// measured, and they were wrong, which left a band of page background between
// this bar and that toolbar with scrolling content visible through it.
//
// Measured once on mount and re-measured on resize (the tab row's own height can
// change with font metrics, a longer Khmer label wrapping, or the `lg:hidden`
// breakpoint being crossed), then published as a document-level custom property
// so every consumer derives from the same real number.
// ---------------------------------------------------------------------------
const TABBAR_HEIGHT_VAR = '--manage-tabbar-h'

const rootRef = ref<HTMLElement | null>(null)
let heightObserver: ResizeObserver | null = null

const publishHeight = () => {
  const height = rootRef.value?.offsetHeight
  // `lg:hidden` keeps this component mounted (display: none) on desktop, where
  // it measures 0. Ignore that rather than publishing a 0 no consumer wants —
  // above `lg` neither the spacer nor the studio toolbar exists anyway.
  if (!height) return
  document.documentElement.style.setProperty(TABBAR_HEIGHT_VAR, `${height}px`)
}

onMounted(() => {
  publishHeight()
  if (!rootRef.value) return
  heightObserver = new ResizeObserver(publishHeight)
  heightObserver.observe(rootRef.value)
})

onUnmounted(() => {
  heightObserver?.disconnect()
  heightObserver = null
  document.documentElement.style.removeProperty(TABBAR_HEIGHT_VAR)
})

const visibleTabs = computed(() => {
  return props.tabs.filter((tab) => {
    if (tab.id === 'registration' && !props.canViewRegistration) return false
    if (tab.id === 'design-studio' && !props.canViewMedia) return false
    if (tab.id === 'template-payment' && !props.canViewTemplate) return false
    if (tab.id === 'guest-management' && !props.canViewGuestManagement) return false
    if (tab.id === 'analytics' && !props.canViewAnalytics) return false
    if (tab.id === 'expenses' && !props.canViewExpenses) return false
    if (tab.id === 'donation' && !props.canViewDonation) return false
    if (tab.id === 'tickets' && !props.canViewTickets) return false
    return tab.visible !== false
  })
})

const selectTab = (tabId: string) => {
  emit('tab-change', tabId)
  scrollTabIntoView(tabId)
}

// Auto-scroll active tab into center view
const scrollTabIntoView = async (tabId: string) => {
  await nextTick()
  const container = tabContainer.value
  const index = visibleTabs.value.findIndex((t) => t.id === tabId)
  const button = tabButtons.value[index]

  if (container && button) {
    const containerWidth = container.clientWidth
    const buttonLeft = button.offsetLeft
    const buttonWidth = button.offsetWidth
    const scrollLeft = buttonLeft - containerWidth / 2 + buttonWidth / 2

    // Use 'auto' instead of 'smooth' to prevent conflicts with page scroll
    // This ensures the horizontal tab scroll doesn't interfere with vertical page scroll
    container.scrollTo({
      left: scrollLeft,
      behavior: 'auto',
    })
  }
}

// Watch for active tab changes (e.g., from URL changes)
watch(
  () => props.activeTab,
  (newTab) => {
    scrollTabIntoView(newTab)
  },
  { immediate: true }
)

// Keyboard navigation support
const handleKeyboard = (event: KeyboardEvent, index: number) => {
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      if (index > 0) selectTab(visibleTabs.value[index - 1].id)
      break
    case 'ArrowRight':
      event.preventDefault()
      if (index < visibleTabs.value.length - 1) selectTab(visibleTabs.value[index + 1].id)
      break
    case 'Home':
      event.preventDefault()
      selectTab(visibleTabs.value[0].id)
      break
    case 'End':
      event.preventDefault()
      selectTab(visibleTabs.value[visibleTabs.value.length - 1].id)
      break
  }
}
</script>

<style scoped>
/* Fixed positioning is more stable than sticky on mobile */
.tab-bar-container {
  /* Force GPU layer for smooth rendering */
  transform: translate3d(0, 0, 0);
  -webkit-transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Opaque rather than glass: this bar is fixed over a scrolling page, and at
   0.9 alpha the content passing behind it stayed legible *through* the tab
   labels — blur(20px) softens that content but doesn't stop it competing with
   the text on top of it.

   The fill comes from `.premium-chrome` (MainLayout), the page's own background
   stack sized to the viewport, so this bar and the header above it are two
   windows onto one continuous background instead of two flat gradients of their
   own. `--premium-chrome-top` is this bar's `top-16`. */
.glass-manage-mobile-tabs {
  --premium-chrome-top: 4rem;
  /* Bottom border for separation from content */
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}

/* 1.5rem is the row's own `px-2` plus the first button's `px-4`, i.e. exactly
   where the first label starts — so on a short tab list that doesn't overflow,
   the fade falls entirely on padding and nothing looks dimmed. */
.tabs-scroller {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 1.5rem,
    #000 calc(100% - 1.5rem),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 1.5rem,
    #000 calc(100% - 1.5rem),
    transparent 100%
  );
}
</style>
