<template>
  <!-- Mobile Tab Bar (fixed at bottom) -->
  <div class="lg:hidden fixed bottom-0 left-0 right-0 z-50">
    <!-- Mobile User Menu (positioned above tab bar) -->
    <Transition name="slideUp">
      <div
        v-if="userMenuOpen && authStore.isAuthenticated"
        class="absolute bottom-full left-0 right-0 border-t border-[#B0E0E6]/50 bg-white/95 backdrop-blur-sm shadow-lg"
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
          <div class="space-y-2">
            <RouterLink
              to="/settings"
              @click="userMenuOpen = false"
              class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff] rounded-xl transition-all duration-200"
            >
              <User class="w-4 h-4" />
              <span class="text-sm font-medium">Profile</span>
            </RouterLink>

            <RouterLink
              to="/security"
              @click="userMenuOpen = false"
              class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff] rounded-xl transition-all duration-200"
            >
              <Lock class="w-4 h-4" />
              <span class="text-sm font-medium">Security</span>
            </RouterLink>

            <RouterLink
              to="/commission"
              @click="userMenuOpen = false"
              class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff] rounded-xl transition-all duration-200"
            >
              <Wallet class="w-4 h-4" />
              <span class="text-sm font-medium">Commission</span>
            </RouterLink>

            <div class="border-t border-slate-200 pt-2">
              <button
                @click="authStore.logout(); userMenuOpen = false"
                class="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 w-full"
              >
                <LogOut class="w-4 h-4" />
                <span class="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <div class="bg-white/95 backdrop-blur-sm border-t border-[#B0E0E6]/50 shadow-xl shadow-[#1e90ff]/10">
      <div class="flex items-center justify-around px-2 py-2">
        <template v-for="item in navigationItems" :key="item.path">
          <!-- Special handling for home to ensure scroll to hero -->
          <button
            v-if="item.path === '/home'"
            @click="handleHomeClick"
            class="flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-300 min-w-0 flex-1"
            :class="$route.path === item.path ? 'text-[#1e90ff] bg-[#E6F4FF]' : 'text-slate-600 hover:text-[#1e90ff] hover:bg-[#E6F4FF]/50'"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span class="text-xs font-medium truncate">{{ item.label }}</span>
          </button>
          <!-- Other navigation items -->
          <RouterLink
            v-else
            :to="item.path"
            class="flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-300 min-w-0 flex-1"
            :class="$route.path === item.path ? 'text-[#1e90ff] bg-[#E6F4FF]' : 'text-slate-600 hover:text-[#1e90ff] hover:bg-[#E6F4FF]/50'"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span class="text-xs font-medium truncate">{{ item.label }}</span>
          </RouterLink>
        </template>

        <!-- Pricing Button -->
        <button
          @click="handlePricingClick"
          class="flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-300 min-w-0 flex-1 text-slate-600 hover:text-[#1e90ff] hover:bg-[#E6F4FF]/50"
        >
          <DollarSign class="w-5 h-5 flex-shrink-0" />
          <span class="text-xs font-medium truncate">Pricing</span>
        </button>

        <!-- Profile Tab -->
        <div class="flex flex-col items-center space-y-1 p-3 rounded-xl transition-all duration-300 min-w-0 flex-1">
          <template v-if="!authStore.isAuthenticated">
            <RouterLink
              to="/signin"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Lock, Wallet, LogOut, Home, Info, Calendar, DollarSign, User } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'

const userMenuOpen = ref(false)
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Navigation items configuration (same as Sidebar)
const navigationItems = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/about', label: 'About', icon: Info },
  { path: '/events', label: 'Events', icon: Calendar }
]

// Handle home click to scroll to hero section
const handleHomeClick = async () => {
  // If already on home page, scroll to hero
  if (route.path === '/home') {
    const heroElement = document.getElementById('hero')
    if (heroElement) {
      heroElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } else {
    // Navigate to home page first
    await router.push('/home')
    // Wait a bit for the page to render, then scroll to hero
    setTimeout(() => {
      const heroElement = document.getElementById('hero')
      if (heroElement) {
        heroElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 100)
  }
}

// Handle pricing click to scroll to pricing section on home page
const handlePricingClick = async () => {
  // Navigate to home if not already there
  if (route.path !== '/home') {
    await router.push('/home')
  }

  // Wait a bit for the page to render, then scroll to pricing
  setTimeout(() => {
    const pricingElement = document.getElementById('pricing')
    if (pricingElement) {
      pricingElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, 100)
}
</script>

<style scoped>
/* SlideUp animations for mobile menu (slides down from above) */
.slideUp-enter-active,
.slideUp-leave-active {
  transition: all 0.3s ease;
}

.slideUp-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slideUp-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
