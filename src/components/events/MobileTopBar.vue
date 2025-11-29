<template>
  <header
    class="lg:hidden fixed top-0 left-0 right-0 h-14 glass-header border-b z-40 gpu-layer"
    :class="isScrolled ? 'border-white/30 shadow-sm' : 'border-transparent'"
  >
    <div class="h-full px-4 flex items-center justify-between">
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
        <!-- Search Button -->
        <button
          @click="$emit('search')"
          class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
          aria-label="Search"
        >
          <Search class="w-5 h-5" />
        </button>

        <!-- Notifications Button -->
        <button
          class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 relative"
          aria-label="Notifications"
        >
          <Bell class="w-5 h-5" />
        </button>

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
        class="glass-dropdown absolute right-4 top-full mt-1 rounded-xl overflow-hidden min-w-[140px]"
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
import { Search, Bell, Globe } from 'lucide-vue-next'
import IconSvg from '@/assets/icon.svg'
import { useMobileTopBar } from '@/composables/useMobileTopBar'

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

/* Glass header effect - blends with brand gradient background */
.glass-header {
  background: linear-gradient(
    135deg,
    rgba(248, 255, 254, 0.85) 0%,
    rgba(240, 253, 249, 0.85) 50%,
    rgba(240, 249, 255, 0.85) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
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
