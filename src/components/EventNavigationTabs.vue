<template>
  <!-- Desktop Fixed Sidebar Navigation (Canva-style compact) -->
  <aside
    class="hidden lg:flex fixed top-16 h-[calc(100%-4rem)] bg-white/90 backdrop-blur-xl border-r border-slate-200/60 z-40 flex-col w-[88px] transition-all duration-300 ease-in-out"
    :style="{ left: sidebarLeftPosition }"
    role="navigation"
    aria-label="Event navigation"
  >
    <!-- Navigation Links -->
    <nav class="flex-1 py-2 overflow-y-auto">
      <button
        v-for="tab in visibleTabs"
        :key="tab.id"
        @click="$emit('tab-change', tab.id)"
        class="w-full flex flex-col items-center justify-center py-3.5 px-2 transition-all duration-200 group relative"
        :class="activeTab === tab.id
          ? 'text-[#2ecc71]'
          : 'text-slate-400 hover:text-slate-700'"
      >
        <!-- Active indicator (left border) -->
        <div
          v-if="activeTab === tab.id"
          class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-10 bg-gradient-to-b from-[#2ecc71] to-[#1e90ff] rounded-r-sm"
        ></div>
        <!-- Hover background -->
        <div
          class="absolute inset-x-2 inset-y-1 rounded-xl transition-colors duration-200"
          :class="activeTab === tab.id
            ? 'bg-gradient-to-r from-[#2ecc71]/8 to-[#1e90ff]/8'
            : 'group-hover:bg-slate-50/60'"
        ></div>
        <component
          :is="getIconComponent(tab.icon)"
          class="w-5 h-5 mb-1.5 transition-all duration-200 relative z-10"
          :class="activeTab === tab.id ? 'text-[#2ecc71]' : 'text-slate-400 group-hover:text-slate-600'"
          :stroke-width="activeTab === tab.id ? 2.5 : 2"
        />
        <span
          class="text-[10.5px] font-medium text-center leading-tight transition-colors duration-200 relative z-10"
          :class="activeTab === tab.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'"
        >
          {{ tab.mobileLabel || tab.label }}
        </span>
      </button>

    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue'
import {
  Calendar,
  FileText,
  Users,
  UserPlus,
  ImageIcon,
  Monitor,
  CreditCard,
  Wallet,
  BarChart,
  Star,
  Mic,
} from 'lucide-vue-next'

export interface TabConfig {
  id: string
  label: string
  icon: string
  visible?: boolean
  mobileLabel?: string
}

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
  canEdit?: boolean
}

interface Emits {
  'tab-change': [tabId: string]
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Inject sidebar state from MainLayout (with default values to prevent warnings)
const showHomeSidebarOverlay = inject<Ref<boolean>>('showHomeSidebarOverlay', ref(false))
const isCollapsed = inject<Ref<boolean>>('isCollapsed', ref(false))

// Check if home sidebar is currently visible
const isHomeSidebarVisible = computed(() => {
  return showHomeSidebarOverlay?.value ?? false
})

// Calculate left position based on home sidebar state
const sidebarLeftPosition = computed(() => {
  if (!isHomeSidebarVisible.value) {
    return '0px'
  }
  // Home sidebar width: collapsed = 96px (w-24), expanded = 256px (w-64)
  const homeSidebarWidth = isCollapsed?.value ? 96 : 256
  return `${homeSidebarWidth}px`
})

// Icon mapping function
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    calendar: Calendar,
    'file-text': FileText,
    users: Users,
    'user-plus': UserPlus,
    image: ImageIcon,
    monitor: Monitor,
    'credit-card': CreditCard,
    'bar-chart': BarChart,
    wallet: Wallet,
    star: Star,
    mic: Mic,
  }
  return iconMap[iconName] || FileText
}

const visibleTabs = computed(() => {
  return props.tabs.filter((tab) => {
    // Permission-based tab visibility
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
</script>

<style scoped>
/* Thin scrollbar styling */
nav::-webkit-scrollbar {
  width: 3px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

/* Firefox */
nav {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
}
</style>
