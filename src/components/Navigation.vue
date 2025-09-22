<template>
  <nav
    class="sticky top-0 z-50 transition-all duration-500 ease-out"
    :class="
      isScrolled
        ? 'bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-xl shadow-[#1e90ff]/10'
        : 'bg-transparent border-b border-transparent'
    "
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <!-- Logo -->
        <button @click="handleLogoClick" class="flex items-center space-x-3 group cursor-pointer">
          <img
            :src="LogoSvg"
            alt="GoEvent Logo"
            class="h-32 w-auto transition-all duration-300 group-hover:scale-110"
          />

        </button>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center space-x-2">
          <RouterLink
            to="/"
            class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative group"
            :class="
              isScrolled
                ? 'text-slate-800 hover:text-[#1e90ff] hover:bg-white/70 hover:shadow-lg hover:shadow-[#B0E0E6]/50'
                : 'text-slate-900 hover:text-[#1873cc] hover:bg-white/40 hover:backdrop-blur-md hover:shadow-lg hover:shadow-white/25'
            "
            active-class="text-[#1e90ff] bg-white/80 shadow-lg shadow-[#B0E0E6]/50"
          >
            Home
            <div
              class="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] transition-all duration-300 group-hover:w-full group-hover:left-0"
            ></div>
          </RouterLink>
          <RouterLink
            to="/about"
            class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative group"
            :class="
              isScrolled
                ? 'text-slate-800 hover:text-[#1e90ff] hover:bg-white/70 hover:shadow-lg hover:shadow-[#B0E0E6]/50'
                : 'text-slate-900 hover:text-[#1873cc] hover:bg-white/40 hover:backdrop-blur-md hover:shadow-lg hover:shadow-white/25'
            "
            active-class="text-[#1e90ff] bg-white/80 shadow-lg shadow-[#B0E0E6]/50"
          >
            About
            <div
              class="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] transition-all duration-300 group-hover:w-full group-hover:left-0"
            ></div>
          </RouterLink>
          <RouterLink
            to="/events"
            class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative group"
            :class="
              isScrolled
                ? 'text-slate-800 hover:text-[#1e90ff] hover:bg-white/70 hover:shadow-lg hover:shadow-[#B0E0E6]/50'
                : 'text-slate-900 hover:text-[#1873cc] hover:bg-white/40 hover:backdrop-blur-md hover:shadow-lg hover:shadow-white/25'
            "
            active-class="text-[#1e90ff] bg-white/80 shadow-lg shadow-[#B0E0E6]/50"
          >
            Events
            <div
              class="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] transition-all duration-300 group-hover:w-full group-hover:left-0"
            ></div>
          </RouterLink>
          <button
            @click="scrollToPricing"
            class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative group"
            :class="
              isScrolled
                ? 'text-slate-800 hover:text-[#1e90ff] hover:bg-white/70 hover:shadow-lg hover:shadow-[#B0E0E6]/50'
                : 'text-slate-900 hover:text-[#1873cc] hover:bg-white/40 hover:backdrop-blur-md hover:shadow-lg hover:shadow-white/25'
            "
          >
            Pricing
            <div
              class="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] transition-all duration-300 group-hover:w-full group-hover:left-0"
            ></div>
          </button>
        </div>

        <!-- Desktop Auth Buttons / User Menu -->
        <div class="hidden lg:flex items-center space-x-4">
          <template v-if="!authStore.isAuthenticated">
            <RouterLink
              :to="signinLink"
              class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
              :class="
                isScrolled
                  ? 'text-slate-800 hover:text-[#1e90ff] hover:bg-white/70 hover:shadow-lg hover:shadow-[#B0E0E6]/50'
                  : 'text-slate-900 hover:text-[#1873cc] hover:bg-white/40 hover:backdrop-blur-md hover:shadow-lg hover:shadow-white/25'
              "
            >
              Sign In
            </RouterLink>
            <RouterLink
              to="/signup"
              class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 hover:scale-105"
            >
              Get Started
            </RouterLink>
          </template>
          <template v-else>
            <div class="relative">
              <button
                @click="userMenuOpen = !userMenuOpen"
                @mouseenter="userMenuOpen = true"
                class="flex items-center space-x-3 p-2 rounded-xl hover:bg-[#E6F4FF] transition-all duration-300 group"
              >
                <div
                  class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white group-hover:ring-[#87CEEB] transition-all duration-300 group-hover:scale-105"
                >
                  <img
                    v-if="
                      authStore.user?.profile_picture &&
                      apiService.getProfilePictureUrl(authStore.user.profile_picture)
                    "
                    :src="apiService.getProfilePictureUrl(authStore.user.profile_picture) || ''"
                    :alt="authStore.user.first_name || authStore.user.username"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    v-else
                    class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-bold text-sm"
                  >
                    {{ authStore.userInitials }}
                  </div>
                </div>
                <ChevronDown
                  class="w-4 h-4 text-slate-600 group-hover:text-[#1e90ff] transition-colors duration-300"
                  :class="{ 'rotate-180': userMenuOpen }"
                />
              </button>

              <!-- Dropdown Menu -->
              <Transition name="dropdown">
                <div
                  v-if="userMenuOpen"
                  @mouseleave="userMenuOpen = false"
                  class="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl shadow-[#B0E0E6]/50 py-2 z-50"
                >
                  <!-- User Info -->
                  <div class="px-4 py-3 border-b border-[#B0E0E6]/50">
                    <div class="flex items-center space-x-3">
                      <div class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#B0E0E6]">
                        <img
                          v-if="
                            authStore.user?.profile_picture &&
                            apiService.getProfilePictureUrl(authStore.user.profile_picture)
                          "
                          :src="
                            apiService.getProfilePictureUrl(authStore.user.profile_picture) || ''
                          "
                          :alt="authStore.user.first_name || authStore.user.username"
                          class="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div
                          v-else
                          class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-bold"
                        >
                          {{ authStore.userInitials }}
                        </div>
                      </div>
                      <div>
                        <div class="font-semibold text-slate-900">
                          {{ authStore.user?.first_name || authStore.user?.username }}
                        </div>
                        <div class="text-sm text-slate-500">{{ authStore.user?.email }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Menu Items -->
                  <div class="py-1">
                    <RouterLink
                      to="/settings"
                      @click="userMenuOpen = false"
                      class="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff] transition-all duration-200"
                    >
                      <Settings class="w-5 h-5" />
                      <span class="font-medium">Settings</span>
                    </RouterLink>

                    <div class="border-t border-[#B0E0E6]/50 my-1"></div>

                    <button
                      @click="
                        handleLogout();
                        userMenuOpen = false
                      "
                      class="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 w-full text-left"
                    >
                      <LogOut class="w-5 h-5" />
                      <span class="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </template>
        </div>

        <!-- Mobile menu button -->
        <div class="lg:hidden">
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="text-slate-700 hover:text-[#1e90ff] p-3 rounded-xl transition-all duration-300 hover:bg-[#E6F4FF]"
          >
            <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Menu -->
      <div
        v-show="mobileMenuOpen"
        class="lg:hidden border-t border-[#B0E0E6]/50 backdrop-blur-md"
        :class="{ 'animate-slideDown': mobileMenuOpen }"
      >
        <div class="px-4 pt-4 pb-6 space-y-2">
          <RouterLink
            to="/"
            @click="mobileMenuOpen = false"
            class="block text-slate-700 hover:text-[#1e90ff] hover:bg-[#E6F4FF] px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300"
            active-class="text-[#1e90ff] bg-[#E6F4FF]"
          >
            Home
          </RouterLink>
          <RouterLink
            to="/about"
            @click="mobileMenuOpen = false"
            class="block text-slate-700 hover:text-[#1e90ff] hover:bg-[#E6F4FF] px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300"
            active-class="text-[#1e90ff] bg-[#E6F4FF]"
          >
            About
          </RouterLink>
          <RouterLink
            to="/events"
            @click="mobileMenuOpen = false"
            class="block text-slate-700 hover:text-[#1e90ff] hover:bg-[#E6F4FF] px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300"
            active-class="text-[#1e90ff] bg-[#E6F4FF]"
          >
            Events
          </RouterLink>
          <button
            @click="
              scrollToPricing();
              mobileMenuOpen = false
            "
            class="block w-full text-left text-slate-700 hover:text-[#1e90ff] hover:bg-[#E6F4FF] px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300"
          >
            Pricing
          </button>
        </div>
        <div class="px-4 pb-6 border-t border-[#B0E0E6]/50 pt-4">
          <template v-if="!authStore.isAuthenticated">
            <div class="space-y-3">
              <RouterLink
                :to="signinLink"
                @click="mobileMenuOpen = false"
                class="block text-center text-slate-700 hover:text-[#1e90ff] hover:bg-[#E6F4FF] px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300"
              >
                Sign In
              </RouterLink>
              <RouterLink
                to="/signup"
                @click="mobileMenuOpen = false"
                class="block text-center bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white px-6 py-4 rounded-xl text-base font-bold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 hover:scale-105"
              >
                Get Started
              </RouterLink>
            </div>
          </template>
          <template v-else>
            <div class="space-y-2">
              <!-- User Info -->
              <div class="flex items-center space-x-3 px-4 py-3 bg-[#E6F4FF] rounded-xl">
                <div class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white">
                  <img
                    v-if="
                      authStore.user?.profile_picture &&
                      apiService.getProfilePictureUrl(authStore.user.profile_picture)
                    "
                    :src="apiService.getProfilePictureUrl(authStore.user.profile_picture) || ''"
                    :alt="authStore.user.first_name || authStore.user.username"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    v-else
                    class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-bold"
                  >
                    {{ authStore.userInitials }}
                  </div>
                </div>
                <div>
                  <div class="font-semibold text-slate-900">
                    {{ authStore.user?.first_name || authStore.user?.username }}
                  </div>
                  <div class="text-sm text-slate-500">{{ authStore.user?.email }}</div>
                </div>
              </div>

              <!-- Menu Items -->
              <RouterLink
                to="/settings"
                @click="mobileMenuOpen = false"
                class="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff] rounded-xl transition-all duration-200"
              >
                <Settings class="w-5 h-5" />
                <span class="font-medium">Settings</span>
              </RouterLink>

              <button
                @click="
                  handleLogout();
                  mobileMenuOpen = false
                "
                class="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 w-full text-left"
              >
                <LogOut class="w-5 h-5" />
                <span class="font-medium">Logout</span>
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { Menu, X, ChevronDown, Settings, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import { useNavbarScroll } from '../composables/useNavbarScroll'
import LogoSvg from '@/assets/logo.svg'

const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Computed property for signin link with redirect
const signinLink = computed(() => {
  const currentPath = route.fullPath
  // Don't redirect if already on signin or signup pages
  if (currentPath === '/signin' || currentPath === '/signup') {
    return '/signin'
  }
  return `/signin?redirect=${encodeURIComponent(currentPath)}`
})

// Scroll detection for seamless navbar
const { isScrolled } = useNavbarScroll()

const handleLogoClick = () => {
  // If we're not on home page, navigate to home first
  if (router.currentRoute.value.path !== '/') {
    router.push('/').then(() => {
      // Wait for navigation to complete, then scroll to hero
      setTimeout(() => {
        // Scroll to the very top to show hero section properly
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    })
  } else {
    // Already on home page, scroll to the very top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const scrollToPricing = () => {
  // If we're not on home page, navigate to home first
  if (router.currentRoute.value.path !== '/') {
    router.push('/').then(() => {
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const pricingSection = document.getElementById('pricing')
        if (pricingSection) {
          pricingSection.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    })
  } else {
    // Already on home page, just scroll
    const pricingSection = document.getElementById('pricing')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.animate-slideDown {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom gradient text */
.bg-clip-text {
  background-clip: text;
  -webkit-background-clip: text;
}

/* Dropdown animations */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}
</style>
