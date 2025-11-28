<template>
  <!-- Fixed position wrapper for stable mobile scrolling -->
  <div class="md:hidden fixed top-[72px] left-0 right-0 z-40 bg-white border-b border-[#B0E0E6]/50 shadow-md tab-bar-container">
    <div class="relative">
      <!-- Left scroll fade -->
      <div
        class="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"
      ></div>

      <!-- Right scroll fade -->
      <div
        class="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"
      ></div>

      <!-- Scrollable tabs -->
      <div
        ref="tabContainer"
        class="flex overflow-x-auto scrollbar-hide px-2 py-2 gap-1.5"
        role="tablist"
        aria-label="Event detail sections"
      >
        <button
          v-for="(tab, index) in visibleTabs"
          :key="tab.id"
          ref="tabButtons"
          @click="selectTab(tab.id)"
          :class="[
            'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
            'min-w-[44px] min-h-[44px]',
            activeTab === tab.id
              ? 'bg-[#E6F4FF] text-[#1e90ff] shadow-lg'
              : 'text-slate-600 hover:bg-[#E6F4FF]/50 hover:text-[#1e90ff] active:scale-95',
          ]"
          :aria-current="activeTab === tab.id ? 'page' : undefined"
          :aria-label="`${tab.label}${activeTab === tab.id ? ' (current)' : ''}`"
          :aria-selected="activeTab === tab.id"
          role="tab"
          @keydown="handleKeyboard($event, index)"
        >
          <component :is="getIcon(tab.icon)" class="w-4 h-4 flex-shrink-0" />
          <span class="whitespace-nowrap">{{ tab.mobileLabel || tab.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import {
  Calendar,
  FileText,
  Users,
  UserPlus,
  ImageIcon,
  Monitor,
  CreditCard,
  Mail,
  Wallet,
  BarChart,
  Star,
} from 'lucide-vue-next'
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

const iconMap = {
  calendar: Calendar,
  'file-text': FileText,
  users: Users,
  'user-plus': UserPlus,
  image: ImageIcon,
  monitor: Monitor,
  'credit-card': CreditCard,
  'bar-chart': BarChart,
  wallet: Wallet,
  mail: Mail,
  star: Star,
} as const

const getIcon = (iconName: string) => {
  return iconMap[iconName as keyof typeof iconMap] || FileText
}

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
</style>
