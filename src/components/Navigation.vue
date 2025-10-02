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

        <!-- Mobile Spacer (replaces menu button) -->
        <div class="lg:hidden w-12"></div>
      </div>

    </div>
  </nav>

  <!-- Mobile Tab Bar (outside nav for independent positioning) -->
  <div class="lg:hidden fixed bottom-0 left-0 right-0 z-50">
    <div class="bg-white/95 backdrop-blur-sm border-t border-[#B0E0E6]/50 shadow-xl shadow-[#1e90ff]/10">
      <div class="flex items-center justify-around px-2 py-2">
        <!-- Home Tab -->
        <RouterLink
          to="/"
          class="flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-300 min-w-0 flex-1"
          :class="$route.path === '/' ? 'text-[#1e90ff] bg-[#E6F4FF]' : 'text-slate-600 hover:text-[#1e90ff] hover:bg-[#E6F4FF]/50'"
        >
          <Home class="w-5 h-5 flex-shrink-0" />
          <span class="text-xs font-medium truncate">Home</span>
        </RouterLink>

        <!-- About Tab -->
        <RouterLink
          to="/about"
          class="flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-300 min-w-0 flex-1"
          :class="$route.path === '/about' ? 'text-[#1e90ff] bg-[#E6F4FF]' : 'text-slate-600 hover:text-[#1e90ff] hover:bg-[#E6F4FF]/50'"
        >
          <Info class="w-5 h-5 flex-shrink-0" />
          <span class="text-xs font-medium truncate">About</span>
        </RouterLink>

        <!-- Events Tab -->
        <RouterLink
          to="/events"
          class="flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-300 min-w-0 flex-1"
          :class="$route.path === '/events' ? 'text-[#1e90ff] bg-[#E6F4FF]' : 'text-slate-600 hover:text-[#1e90ff] hover:bg-[#E6F4FF]/50'"
        >
          <Calendar class="w-5 h-5 flex-shrink-0" />
          <span class="text-xs font-medium truncate">Events</span>
        </RouterLink>

        <!-- Pricing Tab -->
        <button
          @click="scrollToPricing"
          class="flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-300 min-w-0 flex-1 text-slate-600 hover:text-[#1e90ff] hover:bg-[#E6F4FF]/50"
        >
          <DollarSign class="w-5 h-5 flex-shrink-0" />
          <span class="text-xs font-medium truncate">Pricing</span>
        </button>

        <!-- Profile Tab -->
        <div class="flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-300 min-w-0 flex-1">
          <template v-if="!authStore.isAuthenticated">
            <RouterLink
              :to="signinLink"
              class="flex flex-col items-center space-y-1 text-slate-600 hover:text-[#1e90ff] hover:bg-[#E6F4FF]/50 w-full rounded-xl p-1"
            >
              <User class="w-5 h-5 flex-shrink-0" />
              <span class="text-xs font-medium truncate">Sign In</span>
            </RouterLink>
          </template>
          <template v-else>
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="flex flex-col items-center space-y-1 text-slate-600 hover:text-[#1e90ff] hover:bg-[#E6F4FF]/50 w-full rounded-xl p-1"
              :class="userMenuOpen ? 'text-[#1e90ff] bg-[#E6F4FF]' : ''"
            >
              <div class="w-5 h-5 rounded-full overflow-hidden ring-1 ring-slate-300 flex-shrink-0">
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
                  class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-bold text-xs"
                >
                  {{ authStore.userInitials }}
                </div>
              </div>
              <span class="text-xs font-medium truncate">Profile</span>
            </button>
          </template>
        </div>
      </div>

      <!-- Mobile User Menu (when authenticated and menu is open) -->
      <Transition name="slideUp">
        <div
          v-if="userMenuOpen && authStore.isAuthenticated"
          class="border-t border-[#B0E0E6]/50 bg-white/95 backdrop-blur-sm"
        >
          <div class="px-4 py-4 space-y-3">
            <!-- User Info -->
            <div class="flex items-center space-x-3 px-3 py-2 bg-[#E6F4FF] rounded-xl">
              <div class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white">
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
                  class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-bold text-sm"
                >
                  {{ authStore.userInitials }}
                </div>
              </div>
              <div>
                <div class="font-semibold text-slate-900 text-sm">
                  {{ authStore.user?.first_name || authStore.user?.username }}
                </div>
                <div class="text-xs text-slate-500">{{ authStore.user?.email }}</div>
              </div>
            </div>

            <!-- Menu Items -->
            <div class="grid grid-cols-2 gap-2">
              <RouterLink
                to="/settings"
                @click="userMenuOpen = false"
                class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff] rounded-xl transition-all duration-200"
              >
                <Settings class="w-4 h-4" />
                <span class="text-sm font-medium">Settings</span>
              </RouterLink>

              <button
                @click="handleLogout(); userMenuOpen = false"
                class="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200"
              >
                <LogOut class="w-4 h-4" />
                <span class="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { ChevronDown, Settings, LogOut, Home, Info, Calendar, DollarSign, User } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import { useNavbarScroll } from '../composables/useNavbarScroll'
import LogoSvg from '@/assets/logo.svg'

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

/* SlideUp animations for mobile menu */
.slideUp-enter-active,
.slideUp-leave-active {
  transition: all 0.3s ease;
}

.slideUp-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.slideUp-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
