<template>
  <div>
    <!-- Desktop Sidebar Only -->
    <aside
      :class="[
        'hidden lg:flex fixed top-0 left-0 h-full bg-white border-r border-slate-200 shadow-xl z-50 transition-all duration-300 ease-in-out flex-col',
        isCollapsed ? 'w-24' : 'w-64'
      ]"
    >
      <!-- Logo Section -->
      <div class="flex items-center justify-between h-20 px-4 border-b border-slate-200">
        <button
          @click="handleLogoClick"
          class="flex items-center space-x-3 group"
          :class="isCollapsed ? 'justify-center w-full' : ''"
        >
          <img
            :src="LogoSvg"
            alt="GoEvent Logo"
            class="h-10 w-auto transition-all duration-300 group-hover:scale-110"
            :class="isCollapsed ? 'h-8' : ''"
          />
          <span
            v-if="!isCollapsed"
            class="font-bold text-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] bg-clip-text text-transparent"
          >
            GoEvent
          </span>
        </button>

        <!-- Collapse Toggle (Desktop) -->
        <button
          @click="toggleCollapse"
          class="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft
            class="w-5 h-5 text-slate-600 transition-transform duration-300"
            :class="isCollapsed ? 'rotate-180' : ''"
          />
        </button>

      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center px-3 py-3 rounded-xl text-slate-700 hover:text-[#1e90ff] hover:bg-[#E6F4FF] transition-all duration-200 group"
          :class="[
            $route.path === item.path ? 'text-[#1e90ff] bg-[#E6F4FF] font-semibold' : '',
            isCollapsed ? 'flex-col space-y-1' : 'space-x-3'
          ]"
        >
          <component
            :is="item.icon"
            class="flex-shrink-0"
            :class="[
              $route.path === item.path ? 'text-[#1e90ff]' : 'text-slate-500 group-hover:text-[#1e90ff]',
              isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
            ]"
          />
          <span
            class="font-medium"
            :class="isCollapsed ? 'text-xs text-center' : 'text-sm'"
          >
            {{ item.label }}
          </span>
        </RouterLink>

        <!-- Pricing Button -->
        <button
          @click="scrollToPricing"
          class="w-full flex items-center px-3 py-3 rounded-xl text-slate-700 hover:text-[#1e90ff] hover:bg-[#E6F4FF] transition-all duration-200 group"
          :class="isCollapsed ? 'flex-col space-y-1' : 'space-x-3'"
        >
          <DollarSign
            class="flex-shrink-0 text-slate-500 group-hover:text-[#1e90ff]"
            :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5'"
          />
          <span
            class="font-medium"
            :class="isCollapsed ? 'text-xs text-center' : 'text-sm text-left'"
          >
            Pricing
          </span>
        </button>
      </nav>

      <!-- User Section -->
      <div class="border-t border-slate-200 p-4">
        <!-- Authenticated User -->
        <template v-if="authStore.isAuthenticated">
          <div class="relative">
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="w-full flex items-center p-3 rounded-xl hover:bg-[#E6F4FF] transition-all duration-200"
              :class="isCollapsed ? 'flex-col space-y-2 justify-center' : 'space-x-3'"
            >
              <div class="rounded-full overflow-hidden ring-2 ring-slate-200 flex-shrink-0"
                   :class="isCollapsed ? 'w-12 h-12' : 'w-10 h-10'">
                <img
                  v-if="authStore.user?.profile_picture && apiService.getProfilePictureUrl(authStore.user.profile_picture)"
                  :src="apiService.getProfilePictureUrl(authStore.user.profile_picture) || ''"
                  :alt="authStore.user.first_name || authStore.user.username"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-bold"
                >
                  {{ authStore.userInitials }}
                </div>
              </div>
              <div v-if="!isCollapsed" class="flex-1 text-left">
                <div class="font-semibold text-sm text-slate-900">
                  {{ authStore.user?.first_name || authStore.user?.username }}
                </div>
                <div class="text-xs text-slate-500">{{ authStore.user?.email }}</div>
              </div>
              <span v-if="isCollapsed" class="text-xs font-medium text-slate-700">Profile</span>
              <ChevronUp
                v-if="!isCollapsed"
                class="w-4 h-4 text-slate-600 transition-transform duration-300"
                :class="userMenuOpen ? '' : 'rotate-180'"
              />
            </button>

            <!-- User Dropdown Menu -->
            <Transition name="slideUp">
              <div
                v-if="userMenuOpen"
                class="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
              >
                <RouterLink
                  to="/settings"
                  @click="userMenuOpen = false"
                  class="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff] transition-all duration-200"
                  :class="isCollapsed ? 'justify-center' : ''"
                >
                  <Settings class="w-5 h-5" />
                  <span v-if="!isCollapsed" class="font-medium">Settings</span>
                </RouterLink>
                <button
                  @click="handleLogout"
                  class="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 text-left"
                  :class="isCollapsed ? 'justify-center' : ''"
                >
                  <LogOut class="w-5 h-5" />
                  <span v-if="!isCollapsed" class="font-medium">Logout</span>
                </button>
              </div>
            </Transition>
          </div>
        </template>

        <!-- Sign In / Get Started -->
        <template v-else>
          <div class="space-y-2">
            <RouterLink
              :to="signinLink"
              class="flex items-center justify-center w-full px-3 py-3 text-center rounded-xl font-semibold text-slate-700 hover:text-[#1e90ff] hover:bg-[#E6F4FF] transition-all duration-200"
              :class="isCollapsed ? 'flex-col space-y-1' : 'space-x-2'"
            >
              <User class="flex-shrink-0" :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5'" />
              <span :class="isCollapsed ? 'text-xs' : 'text-sm'">Sign In</span>
            </RouterLink>
            <RouterLink
              to="/signup"
              class="flex items-center justify-center w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white px-3 py-3 rounded-xl font-bold text-center transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30"
              :class="isCollapsed ? 'flex-col space-y-1' : 'space-x-2'"
            >
              <UserPlus class="flex-shrink-0" :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5'" />
              <span :class="isCollapsed ? 'text-xs' : 'text-sm'">Get Started</span>
            </RouterLink>
          </div>
        </template>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import {
  Home,
  Info,
  Calendar,
  DollarSign,
  User,
  UserPlus,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronUp
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import { useSidebar } from '../composables/useSidebar'
import LogoSvg from '@/assets/logo.svg'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isCollapsed, toggleCollapse } = useSidebar()

const userMenuOpen = ref(false)

// Navigation items configuration
const navigationItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/about', label: 'About', icon: Info },
  { path: '/events', label: 'Events', icon: Calendar }
]

// Computed property for signin link with redirect
const signinLink = computed(() => {
  const currentPath = route.fullPath
  if (currentPath === '/signin' || currentPath === '/signup') {
    return '/signin'
  }
  return `/signin?redirect=${encodeURIComponent(currentPath)}`
})

const handleLogoClick = () => {
  if (router.currentRoute.value.path !== '/') {
    router.push('/').then(() => {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const scrollToPricing = () => {
  if (router.currentRoute.value.path !== '/') {
    router.push('/').then(() => {
      setTimeout(() => {
        const pricingSection = document.getElementById('pricing')
        if (pricingSection) {
          pricingSection.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    })
  } else {
    const pricingSection = document.getElementById('pricing')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

const handleLogout = async () => {
  await authStore.logout()
  userMenuOpen.value = false
  router.push('/')
}
</script>

<style scoped>
/* Fade animation for overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-from {
  opacity: 0;
}

/* SlideUp animation for dropdown */
.slideUp-enter-active,
.slideUp-leave-active {
  transition: all 0.2s ease;
}

.slideUp-enter-from,
.slideUp-leave-from {
  opacity: 0;
  transform: translateY(10px);
}

/* Custom gradient text */
.bg-clip-text {
  background-clip: text;
  -webkit-background-clip: text;
}
</style>