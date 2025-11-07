<template>
  <!-- Desktop Sidebar Only -->
  <aside
    :class="[
      'hidden lg:flex fixed top-0 left-0 h-full bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-r border-slate-200 shadow-xl z-50 transition-all duration-300 ease-in-out flex-col',
      isCollapsed ? 'w-24' : 'w-64'
    ]"
    role="navigation"
    aria-label="Main navigation"
  >
    <!-- Logo Section -->
    <div class="flex items-center h-20 relative"
         :class="isCollapsed ? 'justify-center px-2' : 'justify-between px-4'">
      <button
        @click="handleLogoClick"
        class="flex items-center space-x-3 group"
        :class="isCollapsed ? 'justify-center' : 'px-3'"
        aria-label="Go to home page"
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
        aria-label="Collapse sidebar"
      >
        <ChevronLeft
          class="w-5 h-5 text-slate-600 transition-transform duration-300"
        />
      </button>

      <button
        v-else
        @click="toggleCollapse"
        class="hidden lg:flex items-center justify-center w-6 h-6 rounded-lg hover:bg-slate-100 transition-colors absolute right-1 top-1/2 -translate-y-1/2"
        aria-label="Expand sidebar"
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
          class="w-full flex items-center px-3 py-3 rounded-xl text-slate-700 transition-all duration-200 group"
          :class="[
            isHomeActive ? 'font-semibold gradient-text' : 'hover:gradient-text',
            isCollapsed ? 'flex-col space-y-1' : 'space-x-3'
          ]"
          :aria-current="isHomeActive ? 'page' : undefined"
        >
          <component
            :is="item.icon"
            class="flex-shrink-0"
            :class="[
              isHomeActive ? 'gradient-text' : 'text-slate-500 group-hover:gradient-text',
              isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
            ]"
            aria-hidden="true"
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
          class="flex items-center px-3 py-3 rounded-xl text-slate-700 transition-all duration-200 group"
          :class="[
            $route.path === item.path ? 'font-semibold gradient-text' : 'hover:gradient-text',
            isCollapsed ? 'flex-col space-y-1' : 'space-x-3'
          ]"
          :aria-current="$route.path === item.path ? 'page' : undefined"
        >
          <component
            :is="item.icon"
            class="flex-shrink-0"
            :class="[
              $route.path === item.path ? 'gradient-text' : 'text-slate-500 group-hover:gradient-text',
              isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
            ]"
            aria-hidden="true"
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
        class="w-full flex items-center px-3 py-3 rounded-xl text-slate-700 transition-all duration-200 group"
        :class="[
          isPricingSectionVisible ? 'font-semibold gradient-text' : 'hover:gradient-text',
          isCollapsed ? 'flex-col space-y-1' : 'space-x-3'
        ]"
        :aria-current="isPricingSectionVisible ? 'page' : undefined"
      >
        <BadgeDollarSign
          class="flex-shrink-0"
          :class="[
            isPricingSectionVisible ? 'gradient-text' : 'text-slate-500 group-hover:gradient-text',
            isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
          ]"
          aria-hidden="true"
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
            @click.stop="userMenuOpen = !userMenuOpen"
            class="w-full flex items-center p-3 rounded-xl transition-all duration-200 hover:bg-slate-100/50"
            :class="isCollapsed ? 'flex-col space-y-2 justify-center' : 'space-x-3'"
            :aria-expanded="userMenuOpen"
            aria-label="User menu"
          >
            <div class="rounded-full overflow-hidden ring-2 ring-slate-200 flex-shrink-0"
                 :class="isCollapsed ? 'w-12 h-12' : 'w-10 h-10'">
              <img
                v-if="profilePictureUrl"
                :src="profilePictureUrl"
                :alt="sanitizedUserName"
                class="w-full h-full object-cover"
                @error="handleProfilePictureError"
              />
              <div
                v-else
                class="w-full h-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold"
                :aria-label="`${sanitizedUserName} avatar`"
              >
                {{ authStore.userInitials }}
              </div>
            </div>
            <div v-if="!isCollapsed" class="flex-1 text-left">
              <div class="font-semibold text-sm text-slate-900">
                {{ sanitizedUserName }}
              </div>
              <div class="text-xs text-slate-500">{{ sanitizedUserEmail }}</div>
            </div>
            <span v-if="isCollapsed" class="text-xs font-medium text-slate-700">Profile</span>
            <ChevronUp
              v-if="!isCollapsed"
              class="w-4 h-4 text-slate-600 transition-transform duration-300"
              :class="userMenuOpen ? '' : 'rotate-180'"
              aria-hidden="true"
            />
          </button>

          <!-- User Dropdown Menu -->
          <Transition name="slideRight">
            <div
              v-if="userMenuOpen"
              :style="dropdownPosition"
              class="fixed bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-[100] min-w-[200px]"
              role="menu"
              aria-orientation="vertical"
            >
              <RouterLink
                to="/settings"
                @click="userMenuOpen = false"
                class="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:gradient-text transition-all duration-200 group"
                role="menuitem"
              >
                <User class="w-5 h-5 group-hover:gradient-text" aria-hidden="true" />
                <span class="font-medium">Profile</span>
              </RouterLink>
              <RouterLink
                to="/security"
                @click="userMenuOpen = false"
                class="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:gradient-text transition-all duration-200 group"
                role="menuitem"
              >
                <Lock class="w-5 h-5 group-hover:gradient-text" aria-hidden="true" />
                <span class="font-medium">Security</span>
              </RouterLink>
              <RouterLink
                v-if="authStore.user?.is_partner"
                to="/commission"
                @click="userMenuOpen = false"
                class="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:gradient-text transition-all duration-200 group"
                role="menuitem"
              >
                <Wallet class="w-5 h-5 group-hover:gradient-text" aria-hidden="true" />
                <span class="font-medium">Commission</span>
              </RouterLink>
              <div class="border-t border-slate-200"></div>
              <button
                @click="handleLogout"
                class="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 text-left"
                role="menuitem"
              >
                <LogOut class="w-5 h-5" aria-hidden="true" />
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
          class="flex items-center justify-center w-full px-3 py-3 text-center rounded-xl font-semibold text-slate-700 hover:gradient-text transition-all duration-200 group"
          :class="isCollapsed ? 'flex-col space-y-1' : 'space-x-2'"
        >
          <User class="flex-shrink-0 group-hover:gradient-text" :class="isCollapsed ? 'w-6 h-6' : 'w-5 h-5'" aria-hidden="true" />
          <span :class="isCollapsed ? 'text-xs' : 'text-sm'">Sign In</span>
        </RouterLink>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import {
  House,
  CircleHelp,
  CalendarDays,
  BadgeDollarSign,
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
import { useLandingNavigation } from '../composables/useLandingNavigation'
import { usePricingObserver } from '../composables/usePricingObserver'
import { sanitizePlainText } from '@/utils/sanitize'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isCollapsed, toggleCollapse } = useSidebar()

const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement>()
const { navigateHome, scrollToPricing } = useLandingNavigation()

// Use the pricing observer composable
const { isPricingSectionVisible, initialize: initializePricingObserver } = usePricingObserver()

// Profile picture state
const profilePictureUrl = computed(() => {
  if (!authStore.user?.profile_picture) return null
  return apiService.getProfilePictureUrl(authStore.user.profile_picture)
})

const handleProfilePictureError = () => {
  // Image failed to load, component will automatically show initials fallback
  console.warn('Failed to load profile picture')
}

// Sanitized user data to prevent XSS
const sanitizedUserName = computed(() => {
  const name = authStore.user?.first_name || authStore.user?.username || 'User'
  return sanitizePlainText(name, 100)
})

const sanitizedUserEmail = computed(() => {
  const email = authStore.user?.email || ''
  return sanitizePlainText(email, 100)
})

// Computed property for home active state
// Home is active when on /home route AND pricing section is NOT visible
const isHomeActive = computed(() => {
  return route.path === '/home' && !isPricingSectionVisible.value
})

// Computed property for dropdown positioning
const dropdownPosition = computed(() => {
  const left = isCollapsed.value ? '6.5rem' : '17rem'
  return {
    left,
    bottom: '1rem'
  }
})

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  // Add null check for event.target for type safety
  if (!event.target || !(event.target instanceof Node)) {
    return
  }

  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    userMenuOpen.value = false
  }
}

// Close menu when pressing Escape key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && userMenuOpen.value) {
    userMenuOpen.value = false
  }
}

// Navigation items configuration
const navigationItems = [
  { path: '/home', label: 'Home', icon: House },
  { path: '/about', label: 'About', icon: CircleHelp },
  { path: '/events', label: 'Events', icon: CalendarDays }
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
  navigateHome()
}

const handleHomeClick = () => {
  navigateHome()
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    userMenuOpen.value = false
    router.push('/events')
  } catch (error) {
    console.error('Logout failed:', error)
    // Show user feedback on error instead of silently redirecting
    userMenuOpen.value = false
    alert('Logout failed. Please try again or contact support if the issue persists.')
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
  initializePricingObserver()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
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

/* Custom gradient text - uses Tailwind brand colors */
.gradient-text {
  background: linear-gradient(135deg, #2ecc71 0%, #1e90ff 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* For SVG icons - use blend color from gradient that matches visually */
.gradient-text :deep(svg) {
  color: #26ae88;
  stroke: currentColor;
}

/* Ensure lucide icons keep their structure intact */
.gradient-text :deep(svg) {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
