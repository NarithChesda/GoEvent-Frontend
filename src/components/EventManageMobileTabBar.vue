<template>
  <!-- Fixed position wrapper for stable mobile scrolling -->
  <div class="md:hidden fixed top-16 left-0 right-0 z-40 glass-manage-mobile-tabs tab-bar-container">
    <div class="relative">
      <!-- Left scroll fade -->
      <div
        class="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#f8fffe]/90 via-[#f8fffe]/50 to-transparent pointer-events-none z-10"
      ></div>

      <!-- Right scroll fade -->
      <div
        class="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#f0f9ff]/90 via-[#f0f9ff]/50 to-transparent pointer-events-none z-10"
      ></div>

      <!-- Scrollable tabs -->
      <div
        ref="tabContainer"
        class="flex overflow-x-auto scrollbar-hide px-2 py-1 gap-1"
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
import { ref, computed, watch, nextTick } from 'vue'
import type { TabConfig } from './EventNavigationTabs.vue'

interface Props {
  activeTab: string
  tabs: TabConfig[]
  canViewRegistration?: boolean
  canViewMedia?: boolean
  canViewCollaborators?: boolean
  canViewTemplate?: boolean
  canViewPayment?: boolean
  canViewGuestManagement?: boolean
  canViewAnalytics?: boolean
  canViewExpenses?: boolean
  canViewReview?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'tab-change': [tabId: string]
}>()

const tabContainer = ref<HTMLElement>()
const tabButtons = ref<HTMLElement[]>([])

const visibleTabs = computed(() => {
  return props.tabs.filter((tab) => {
    if (tab.id === 'registration' && !props.canViewRegistration) return false
    if (tab.id === 'media' && !props.canViewMedia) return false
    if (tab.id === 'collaborator' && !props.canViewCollaborators) return false
    if (tab.id === 'template' && !props.canViewTemplate) return false
    if (tab.id === 'payment' && !props.canViewPayment) return false
    if (tab.id === 'guest-management' && !props.canViewGuestManagement) return false
    if (tab.id === 'analytics' && !props.canViewAnalytics) return false
    if (tab.id === 'expenses' && !props.canViewExpenses) return false
    if (tab.id === 'review' && !props.canViewReview) return false
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

/* Glass mobile tabs effect - matches header for seamless connection */
.glass-manage-mobile-tabs {
  background: linear-gradient(
    135deg,
    rgba(248, 255, 254, 0.9) 0%,
    rgba(240, 253, 249, 0.9) 50%,
    rgba(240, 249, 255, 0.9) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  /* Bottom border for separation from content */
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}
</style>
