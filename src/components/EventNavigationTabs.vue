<template>
  <div class="w-full md:w-56 lg:w-64 xl:w-72 flex-shrink-0">
    <!-- Mobile Horizontal Navigation -->
    <div class="md:hidden mb-6">
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-2">
        <div
          class="flex overflow-x-auto scrollbar-hide space-x-1"
          style="scrollbar-width: none; -ms-overflow-style: none"
        >
          <NavigationTab
            v-for="tab in visibleTabs"
            :key="tab.id"
            :tab="tab"
            :is-active="activeTab === tab.id"
            :is-mobile="true"
            @click="$emit('tab-change', tab.id)"
          />
        </div>
      </div>
    </div>

    <!-- Desktop Sidebar Navigation -->
    <div class="sticky top-24 hidden md:block">
      <!-- Title -->
      <div class="mb-8">
        <div class="flex items-center space-x-3">
          <div class="w-3 h-3 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-full"></div>
          <h2 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">
            Event Details
          </h2>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="space-y-1 px-4 md:px-5 lg:px-6">
        <NavigationTab
          v-for="tab in visibleTabs"
          :key="tab.id"
          :tab="tab"
          :is-active="activeTab === tab.id"
          :is-mobile="false"
          @click="$emit('tab-change', tab.id)"
        />
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NavigationTab from './NavigationTab.vue'

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
  canViewAttendees?: boolean
  canViewMedia?: boolean
  canViewCollaborators?: boolean
  canViewEventTexts?: boolean
  canViewTemplate?: boolean
  canViewPayment?: boolean
  canViewInvitation?: boolean
  canEdit?: boolean
}

interface Emits {
  'tab-change': [tabId: string]
}

const props = defineProps<Props>()
defineEmits<Emits>()

const visibleTabs = computed(() => {
  return props.tabs.filter((tab) => {
    // Permission-based tab visibility
    if (tab.id === 'attendees' && !props.canViewAttendees) return false
    if (tab.id === 'media' && !props.canViewMedia) return false
    if (tab.id === 'collaborator' && !props.canViewCollaborators) return false
    if (tab.id === 'event-texts' && !props.canViewEventTexts) return false
    if (tab.id === 'template' && !props.canViewTemplate) return false
    if (tab.id === 'payment' && !props.canViewPayment) return false
    if (tab.id === 'invitation' && !props.canViewInvitation) return false

    return tab.visible !== false
  })
})
</script>

<style scoped>
/* Mobile navigation scrolling */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
