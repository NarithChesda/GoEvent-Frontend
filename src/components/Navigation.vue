<template>
  <nav
    class="sticky top-0 z-50 transition-all duration-500 ease-out"
    :class="isScrolled 
      ? 'bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-xl shadow-blue-500/10' 
      : 'bg-transparent border-b border-transparent'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <!-- Logo -->
        <button @click="handleLogoClick" class="flex items-center space-x-3 group cursor-pointer">
          <div class="relative">
            <div
              class="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300"
            >
              <CalendarDays class="w-7 h-7 text-white" />
            </div>
            <div
              class="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div>
          </div>
          <span
            class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >GoEvent</span
          >
        </button>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center space-x-2">
          <RouterLink
            to="/"
            class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative group"
            :class="isScrolled 
              ? 'text-slate-800 hover:text-blue-600 hover:bg-white/70 hover:shadow-lg hover:shadow-blue-100/50' 
              : 'text-slate-900 hover:text-blue-900 hover:bg-white/40 hover:backdrop-blur-md hover:shadow-lg hover:shadow-white/25'"
            active-class="text-blue-600 bg-white/80 shadow-lg shadow-blue-100/50"
          >
            Home
            <div
              class="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full group-hover:left-0"
            ></div>
          </RouterLink>
          <RouterLink
            to="/about"
            class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative group"
            :class="isScrolled 
              ? 'text-slate-800 hover:text-blue-600 hover:bg-white/70 hover:shadow-lg hover:shadow-blue-100/50' 
              : 'text-slate-900 hover:text-blue-900 hover:bg-white/40 hover:backdrop-blur-md hover:shadow-lg hover:shadow-white/25'"
            active-class="text-blue-600 bg-white/80 shadow-lg shadow-blue-100/50"
          >
            About
            <div
              class="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full group-hover:left-0"
            ></div>
          </RouterLink>
          <RouterLink
            to="/events"
            class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative group"
            :class="isScrolled 
              ? 'text-slate-800 hover:text-blue-600 hover:bg-white/70 hover:shadow-lg hover:shadow-blue-100/50' 
              : 'text-slate-900 hover:text-blue-900 hover:bg-white/40 hover:backdrop-blur-md hover:shadow-lg hover:shadow-white/25'"
            active-class="text-blue-600 bg-white/80 shadow-lg shadow-blue-100/50"
          >
            Events
            <div
              class="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full group-hover:left-0"
            ></div>
          </RouterLink>
          <button
            @click="scrollToPricing"
            class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative group"
            :class="isScrolled 
              ? 'text-slate-800 hover:text-blue-600 hover:bg-white/70 hover:shadow-lg hover:shadow-blue-100/50' 
              : 'text-slate-900 hover:text-blue-900 hover:bg-white/40 hover:backdrop-blur-md hover:shadow-lg hover:shadow-white/25'"
          >
            Pricing
            <div
              class="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full group-hover:left-0"
            ></div>
          </button>
        </div>

        <!-- Desktop Auth Buttons / User Menu -->
        <div class="hidden lg:flex items-center space-x-4">
          <template v-if="!authStore.isAuthenticated">
            <RouterLink
              to="/signin"
              class="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
              :class="isScrolled 
                ? 'text-slate-800 hover:text-blue-600 hover:bg-white/70 hover:shadow-lg hover:shadow-blue-100/50' 
                : 'text-slate-900 hover:text-blue-900 hover:bg-white/40 hover:backdrop-blur-md hover:shadow-lg hover:shadow-white/25'"
            >
              Sign In
            </RouterLink>
            <RouterLink
              to="/signup"
              class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 hover:scale-105"
            >
              Get Started
            </RouterLink>
          </template>
          <template v-else>
            <div class="relative">
              <button
                @click="userMenuOpen = !userMenuOpen"
                @mouseenter="userMenuOpen = true"
                class="flex items-center space-x-3 p-2 rounded-xl hover:bg-blue-50 transition-all duration-300 group"
              >
                <div class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white group-hover:ring-blue-200 transition-all duration-300 group-hover:scale-105">
                  <img 
                    v-if="authStore.user?.profile_picture && apiService.getProfilePictureUrl(authStore.user.profile_picture)"
                    :src="apiService.getProfilePictureUrl(authStore.user.profile_picture) || ''" 
                    :alt="authStore.user.first_name || authStore.user.username"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    v-else
                    class="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm"
                  >
                    {{ authStore.userInitials }}
                  </div>
                </div>
                <ChevronDown
                  class="w-4 h-4 text-slate-600 group-hover:text-blue-600 transition-colors duration-300"
                  :class="{ 'rotate-180': userMenuOpen }"
                />
              </button>

              <!-- Dropdown Menu -->
              <Transition name="dropdown">
                <div
                  v-if="userMenuOpen"
                  @mouseleave="userMenuOpen = false"
                  class="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl shadow-blue-100/50 py-2 z-50"
                >
                  <!-- User Info -->
                  <div class="px-4 py-3 border-b border-blue-100/50">
                    <div class="flex items-center space-x-3">
                      <div class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-blue-100">
                        <img 
                          v-if="authStore.user?.profile_picture && apiService.getProfilePictureUrl(authStore.user.profile_picture)"
                          :src="apiService.getProfilePictureUrl(authStore.user.profile_picture) || ''" 
                          :alt="authStore.user.first_name || authStore.user.username"
                          class="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        <div
                          v-else
                          class="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold"
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
                      class="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                    >
                      <Settings class="w-5 h-5" />
                      <span class="font-medium">Settings</span>
                    </RouterLink>


                    <div class="border-t border-blue-100/50 my-1"></div>

                    <button
                      @click="handleLogout(); userMenuOpen = false"
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
            class="text-slate-700 hover:text-blue-600 p-3 rounded-xl transition-all duration-300 hover:bg-blue-50"
          >
            <Menu v-if="!mobileMenuOpen" class="w-6 h-6" />
            <X v-else class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Menu -->
      <div
        v-show="mobileMenuOpen"
        class="lg:hidden border-t border-blue-100/50 backdrop-blur-md"
        :class="{ 'animate-slideDown': mobileMenuOpen }"
      >
        <div class="px-4 pt-4 pb-6 space-y-2">
          <RouterLink
            to="/"
            @click="mobileMenuOpen = false"
            class="block text-slate-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300"
            active-class="text-blue-600 bg-blue-50"
          >
            Home
          </RouterLink>
          <RouterLink
            to="/about"
            @click="mobileMenuOpen = false"
            class="block text-slate-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300"
            active-class="text-blue-600 bg-blue-50"
          >
            About
          </RouterLink>
          <RouterLink
            to="/events"
            @click="mobileMenuOpen = false"
            class="block text-slate-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300"
            active-class="text-blue-600 bg-blue-50"
          >
            Events
          </RouterLink>
          <button
            @click="scrollToPricing(); mobileMenuOpen = false"
            class="block w-full text-left text-slate-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300"
          >
            Pricing
          </button>
        </div>
        <div class="px-4 pb-6 border-t border-blue-100/50 pt-4">
          <template v-if="!authStore.isAuthenticated">
            <div class="space-y-3">
              <RouterLink
                to="/signin"
                @click="mobileMenuOpen = false"
                class="block text-center text-slate-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300"
              >
                Sign In
              </RouterLink>
              <RouterLink
                to="/signup"
                @click="mobileMenuOpen = false"
                class="block text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl text-base font-bold transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 hover:scale-105"
              >
                Get Started
              </RouterLink>
            </div>
          </template>
          <template v-else>
            <div class="space-y-2">
              <!-- User Info -->
              <div class="flex items-center space-x-3 px-4 py-3 bg-blue-50 rounded-xl">
                <div class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white">
                  <img 
                    v-if="authStore.user?.profile_picture && apiService.getProfilePictureUrl(authStore.user.profile_picture)"
                    :src="apiService.getProfilePictureUrl(authStore.user.profile_picture) || ''" 
                    :alt="authStore.user.first_name || authStore.user.username"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div
                    v-else
                    class="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold"
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
                class="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-200"
              >
                <Settings class="w-5 h-5" />
                <span class="font-medium">Settings</span>
              </RouterLink>


              <button
                @click="handleLogout(); mobileMenuOpen = false"
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
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  CalendarDays,
  Menu,
  X,
  ChevronDown,
  Settings,
  LogOut,
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import { useNavbarScroll } from '../composables/useNavbarScroll'

const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)
const router = useRouter()
const authStore = useAuthStore()

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
