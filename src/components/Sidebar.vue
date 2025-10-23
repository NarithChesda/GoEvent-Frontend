<template>
  <div>
    <!-- Desktop Sidebar Only -->
    <aside
      :class="[
        'hidden lg:flex fixed top-0 left-0 h-full bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-r border-slate-200 shadow-xl z-50 transition-all duration-300 ease-in-out flex-col',
        isCollapsed ? 'w-24' : 'w-64'
      ]"
    >
      <!-- Logo Section -->
      <div class="flex items-center h-20 relative"
           :class="isCollapsed ? 'justify-center px-2' : 'justify-between px-4'">
        <button
          @click="handleLogoClick"
          class="flex items-center space-x-3 group"
          :class="isCollapsed ? 'justify-center' : 'px-3'"
        >
          <img
            :src="isCollapsed ? IconSvg : LogoPng"
            alt="GoEvent Logo"
            class="h-10 w-auto transition-all duration-300 group-hover:scale-110"
            :class="isCollapsed ? 'h-8' : ''"
          />

        </button>

        <!-- Collapse Toggle (Desktop) -->
        <button
          v-if="!isCollapsed"
          @click="toggleCollapse"
          class="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors ml-auto"
        >
          <ChevronLeft
            class="w-5 h-5 text-slate-600 transition-transform duration-300"
          />
        </button>

        <button
          v-else
          @click="toggleCollapse"
          class="hidden lg:flex items-center justify-center w-6 h-6 rounded-lg hover:bg-slate-100 transition-colors absolute right-1 top-1/2 -translate-y-1/2"
        >
          <ChevronLeft
            class="w-4 h-4 text-slate-600 transition-transform duration-300 rotate-180"
          />
        </button>

      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <template v-for="item in navigationItems" :key="item.path">
          <!-- Home button with scroll behavior -->
          <button
            v-if="item.path === '/home'"
            @click="handleHomeClick"
            class="w-full flex items-center px-3 py-3 rounded-xl text-slate-700 hover:text-[#1e90ff] hover:bg-[#E6F4FF] transition-all duration-200 group"
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
          </button>

          <!-- Other navigation items -->
          <RouterLink
            v-else
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
        </template>

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
      <div class="p-4">
        <!-- Authenticated User -->
        <template v-if="authStore.isAuthenticated">
          <div ref="userMenuRef" class="relative">
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
            <Transition name="slideRight">
              <div
                v-if="userMenuOpen"
                :class="[
                  'fixed bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-[100] min-w-[200px]',
                  isCollapsed
                    ? 'left-[6.5rem] bottom-4'
                    : 'left-[17rem] bottom-4'
                ]"
              >
                <RouterLink
                  to="/settings"
                  @click="userMenuOpen = false"
                  class="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff] transition-all duration-200"
                >
                  <User class="w-5 h-5" />
                  <span class="font-medium">Profile</span>
                </RouterLink>
                <RouterLink
                  to="/security"
                  @click="userMenuOpen = false"
                  class="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff] transition-all duration-200"
                >
                  <Lock class="w-5 h-5" />
                  <span class="font-medium">Security</span>
                </RouterLink>
                <RouterLink
                  v-if="authStore.user?.is_partner"
                  to="/commission"
                  @click="userMenuOpen = false"
                  class="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff] transition-all duration-200"
                >
                  <Wallet class="w-5 h-5" />
                  <span class="font-medium">Commission</span>
                </RouterLink>
                <div class="border-t border-slate-200"></div>
                <button
                  @click="handleLogout"
                  class="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 text-left"
                >
                  <LogOut class="w-5 h-5" />
                  <span class="font-medium">Logout</span>
                </button>
              </div>
            </Transition>
          </div>
        </template>

        <!-- Sign In -->
        <template v-else>
          <RouterLink
            :to="signinLink"
            class="flex items-center justify-center w-full px-3 py-3 text-center rounded-xl font-semibold text-slate-700 hover:text-[#1e90ff] hover:bg-[#E6F4FF] transition-all duration-200"
            :class="isCollapsed ? 'flex-col space-y-1' : 'space-x-2'"
          >
            <User class="flex-shrink-0" :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5'" />
            <span :class="isCollapsed ? 'text-xs' : 'text-sm'">Sign In</span>
          </RouterLink>
        </template>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import {
  Home,
  Info,
  Calendar,
  DollarSign,
  User,
  Lock,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronUp
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import { useSidebar } from '../composables/useSidebar'
import LogoPng from '@/assets/logo.png'
import IconSvg from '@/assets/icon.svg'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isCollapsed, toggleCollapse } = useSidebar()

const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement>()

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    userMenuOpen.value = false
  }
}

// Add and remove click listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Navigation items configuration
const navigationItems = [
  { path: '/home', label: 'Home', icon: Home },
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

const scrollToHero = () => {
  const heroSection = document.getElementById('hero')
  if (heroSection) {
    heroSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const navigateHome = async () => {
  if (router.currentRoute.value.path !== '/home') {
    await router.push('/home')
    await nextTick()
  }
  scrollToHero()
}

const handleLogoClick = () => {
  navigateHome()
}

const handleHomeClick = () => {
  navigateHome()
}

const scrollToPricing = async () => {
  const scroll = () => {
    const pricingSection = document.getElementById('pricing')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (router.currentRoute.value.path !== '/home') {
    await router.push('/home')
    await nextTick()
    // Wait for the home view to fully render
    setTimeout(scroll, 100)
  } else {
    scroll()
  }
}

const handleLogout = async () => {
  await authStore.logout()
  userMenuOpen.value = false
  router.push('/events')
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
.slideUp-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* SlideRight animation for collapsed state dropdown */
.slideRight-enter-active,
.slideRight-leave-active {
  transition: all 0.2s ease;
}

.slideRight-enter-from,
.slideRight-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* Custom gradient text */
.bg-clip-text {
  background-clip: text;
  -webkit-background-clip: text;
}
</style>
