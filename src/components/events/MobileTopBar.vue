<template>
  <header
    class="lg:hidden fixed top-0 left-0 right-0 h-14 glass-header border-b z-40 gpu-layer"
    :class="isScrolled ? 'is-scrolled border-white/30 shadow-sm' : 'border-transparent'"
  >
    <!-- `relative` keeps this row above the glass sheet `.glass-header::before`
         lays over the bar — an absolutely-positioned pseudo paints on top of
         non-positioned in-flow siblings. -->
    <div class="relative h-full px-4 flex items-center justify-between">
      <!-- Logo -->
      <button
        @click="handleLogoClick"
        class="flex items-center"
        aria-label="Go to home page"
      >
        <img :src="IconSvg" alt="GoEvent Logo" class="h-5 w-auto" />
      </button>

      <!-- Right Actions -->
      <div class="flex items-center gap-1">
        <!-- Page-level controls (list filters) teleport in here while the
             page's own header is scrolled out of view. -->
        <div id="nav-page-controls-mobile" class="flex items-center gap-1"></div>

        <!-- Search Button -->
        <button
          @click="$emit('search')"
          class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
          aria-label="Search"
        >
          <Search class="w-5 h-5" />
        </button>

        <!-- Notifications Bell (authenticated only) -->
        <NotificationBell v-if="authStore.isAuthenticated" variant="mobile" />

        <!-- Language Button -->
        <button
          @click="toggleLanguageMenu"
          class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 relative"
          aria-label="Change language"
        >
          <Globe class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Language Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="showLanguageMenu"
        class="glass-dropdown absolute right-4 top-full mt-1 rounded-xl overflow-hidden min-w-[8.75rem]"
      >
        <button
          v-for="lang in languages"
          :key="lang.code"
          @click="selectLanguage(lang.code)"
          class="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
          :class="
            currentLanguage === lang.code
              ? 'text-[#2ecc71] font-medium bg-[#2ecc71]/5'
              : 'text-slate-700'
          "
        >
          <span>{{ lang.flag }}</span>
          <span>{{ lang.name }}</span>
        </button>
      </div>
    </Transition>
  </header>

  <!-- Spacer -->
  <div class="lg:hidden h-14"></div>
</template>

<script setup lang="ts">
import { Search, Globe } from 'lucide-vue-next'
import IconSvg from '@/assets/icon.svg'
import { useMobileTopBar } from '@/composables/useMobileTopBar'
import { useAuthStore } from '@/stores/auth'
import NotificationBell from '@/components/notifications/NotificationBell.vue'

const authStore = useAuthStore()

defineEmits<{
  search: []
}>()

const {
  isScrolled,
  showLanguageMenu,
  currentLanguage,
  languages,
  handleLogoClick,
  toggleLanguageMenu,
  selectLanguage,
} = useMobileTopBar()
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Force GPU compositing for smooth scrolling */
.gpu-layer {
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  perspective: 1000px;
  -webkit-perspective: 1000px;
}

/* Transparent at rest, liquid glass once the page scrolls under it — the same
   treatment as TopNavBar's `.glass-nav`, where the reasoning is written out. */
.glass-header {
  background: rgba(255, 255, 255, 0);
  backdrop-filter: blur(20px) saturate(100%);
  -webkit-backdrop-filter: blur(20px) saturate(100%);
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease,
    backdrop-filter 200ms ease,
    -webkit-backdrop-filter 200ms ease;
}

.glass-header.is-scrolled {
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.glass-header::before {
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

.glass-header.is-scrolled::before {
  opacity: 1;
}

/* Glass dropdown effect */
.glass-dropdown {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(46, 204, 113, 0.1),
    0 4px 12px rgba(30, 144, 255, 0.08);
}
</style>
