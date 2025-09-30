<template>
  <div class="w-full md:w-56 lg:w-64 xl:w-72 flex-shrink-0">
    <!-- Mobile Hamburger Menu -->
    <div class="md:hidden mb-6">
      <!-- Hamburger Button - Only shown when menu is closed -->
      <button
        v-if="!isMobileMenuOpen"
        @click="toggleMobileMenu"
        class="fixed top-4 right-4 z-[60] bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-lg p-3.5 transition-all duration-300"
        aria-label="Open event menu"
        aria-expanded="false"
        aria-controls="mobile-menu-panel"
      >
        <Menu class="w-6 h-6" aria-hidden="true" />
      </button>

      <!-- Mobile Menu Overlay -->
      <Transition name="fade">
        <div
          v-if="isMobileMenuOpen"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]"
          @click="closeMobileMenu"
          aria-hidden="true"
        ></div>
      </Transition>

      <!-- Mobile Menu Panel -->
      <Transition name="slide-in">
        <div
          v-if="isMobileMenuOpen"
          id="mobile-menu-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Event navigation menu"
          class="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-[55] overflow-y-auto"
        >
          <!-- Menu Header with integrated close button -->
          <div class="sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] p-4 shadow-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-white rounded-full"></div>
                <h2 class="text-lg font-bold text-white">Event Details</h2>
              </div>
              <button
                @click="closeMobileMenu"
                class="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close menu"
              >
                <X class="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          <!-- Menu Items -->
          <nav class="p-4 space-y-2">
            <NavigationTab
              v-for="tab in visibleTabs"
              :key="tab.id"
              :tab="tab"
              :is-active="activeTab === tab.id"
              :is-mobile="false"
              @click="handleTabClick(tab.id)"
            />
          </nav>

          <!-- Scroll indicator -->
          <div
            class="sticky bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"
            aria-hidden="true"
          ></div>
        </div>
      </Transition>
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
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { Menu, X } from 'lucide-vue-next'
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
const emit = defineEmits<Emits>()

// Mobile menu state
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleTabClick = (tabId: string) => {
  emit('tab-change', tabId)
  closeMobileMenu()
}

// Body scroll lock when menu is open
watch(isMobileMenuOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// Escape key handler
const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  // Cleanup: restore body scroll
  document.body.style.overflow = ''
})

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

/* Fade transition for overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide-in transition for menu panel */
.slide-in-enter-active,
.slide-in-leave-active {
  transition: transform 0.3s ease;
}

.slide-in-enter-from,
.slide-in-leave-to {
  transform: translateX(100%);
}
</style>
