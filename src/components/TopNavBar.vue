<template>
  <!-- Desktop Top Navigation Bar -->
  <header
    class="hidden lg:flex fixed top-0 left-0 right-0 h-16 glass-nav border-b transition-colors duration-200 z-50"
    :class="isScrolled ? 'border-white/30 shadow-lg shadow-[#2ecc71]/5' : 'border-transparent'"
    role="navigation"
    aria-label="Main navigation"
  >
    <div class="w-full h-full relative">
      <!-- Logo (absolute left) -->
      <div class="absolute left-6 top-1/2 -translate-y-1/2">
        <button
          @click="handleLogoClick"
          class="flex items-center group"
          aria-label="Go to home page"
        >
          <img
            :src="IconSvg"
            alt="GoEvent Logo"
            class="h-6 w-auto transition-all duration-300 group-hover:scale-110"
          />
        </button>
      </div>

      <!-- Main Navigation (aligned with page content) -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <nav class="flex items-center">
          <RouterLink
            v-for="(item, index) in navigationItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center space-x-2 py-2 rounded-lg text-base font-medium transition-all duration-200"
            :class="[
              isActiveRoute(item.path)
                ? 'text-slate-900'
                : 'text-slate-400 hover:text-slate-700',
              index === 0 ? 'pr-4' : 'px-4'
            ]"
          >
            <component
              :is="item.icon"
              class="w-4 h-4"
              aria-hidden="true"
            />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>

      <!-- Right Section: Time, Actions, Profile (absolute right) -->
      <div class="absolute right-6 top-1/2 -translate-y-1/2 flex items-center space-x-4">
        <!-- Current Time -->
        <div class="text-sm text-slate-600 font-medium">
          {{ currentTime }}
        </div>

        <!-- Create Event Button (authenticated only) -->
        <RouterLink
          v-if="authStore.isAuthenticated"
          to="/events?createEvent=true"
          class="px-4 py-2 text-sm font-semibold text-slate-900 hover:text-slate-700 transition-colors"
        >
          Create Event
        </RouterLink>

        <!-- Search Button (authenticated only) -->
        <button
          v-if="authStore.isAuthenticated"
          @click="toggleSearch"
          class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-all duration-200"
          aria-label="Search"
        >
          <Search class="w-5 h-5" />
        </button>

        <!-- Notifications Button (authenticated only) -->
        <button
          v-if="authStore.isAuthenticated"
          class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 relative"
          aria-label="Notifications"
        >
          <Bell class="w-5 h-5" />
          <!-- Notification badge (hidden for now) -->
          <!-- <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> -->
        </button>

        <!-- Language Button -->
        <div class="relative">
          <button
            @click.stop="toggleLanguageMenu"
            class="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-all duration-200"
            aria-label="Change language"
          >
            <Globe class="w-5 h-5" />
          </button>

          <!-- Language Dropdown -->
          <Transition name="dropdown">
            <div
              v-if="showLanguageMenu"
              class="glass-dropdown absolute right-0 top-full mt-2 rounded-xl overflow-hidden min-w-[140px] z-[100]"
            >
              <button
                v-for="lang in languages"
                :key="lang.code"
                @click="selectLanguage(lang.code)"
                class="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                :class="currentLanguage === lang.code ? 'text-[#2ecc71] font-medium bg-[#2ecc71]/5' : 'text-slate-700'"
              >
                <span>{{ lang.flag }}</span>
                <span>{{ lang.name }}</span>
              </button>
            </div>
          </Transition>
        </div>

        <!-- Profile Button -->
        <div ref="userMenuRef" class="relative">
          <button
            v-if="authStore.isAuthenticated"
            @click.stop="userMenuOpen = !userMenuOpen"
            class="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/80 hover:ring-[#2ecc71]/50 transition-all duration-200"
            :aria-expanded="userMenuOpen"
            aria-label="User menu"
          >
            <img
              v-if="profilePictureUrl"
              :src="profilePictureUrl"
              :alt="sanitizedUserName"
              class="w-full h-full object-cover"
              @error="handleProfilePictureError"
            />
            <div
              v-else
              class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-bold text-sm"
              :aria-label="`${sanitizedUserName} avatar`"
            >
              {{ authStore.userInitials }}
            </div>
          </button>
          <RouterLink
            v-else
            :to="signinLink"
            class="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#2ecc71]/25 hover:scale-[1.02] transition-all duration-200"
            aria-label="Sign in"
          >
            <User class="w-4 h-4" />
            <span>Sign In</span>
          </RouterLink>

          <!-- User Dropdown Menu -->
          <Transition name="dropdown">
            <div
              v-if="userMenuOpen && authStore.isAuthenticated"
              class="glass-dropdown absolute right-0 top-full mt-2 rounded-2xl overflow-hidden z-[100] w-64"
              role="menu"
              aria-orientation="vertical"
            >
              <!-- User Info Header with Avatar -->
              <div class="px-5 py-4 border-b border-slate-100">
                <div class="flex items-center space-x-3">
                  <!-- Large Avatar -->
                  <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      v-if="profilePictureUrl"
                      :src="profilePictureUrl"
                      :alt="sanitizedUserName"
                      class="w-full h-full object-cover"
                    />
                    <div
                      v-else
                      class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-bold text-lg"
                    >
                      {{ authStore.userInitials }}
                    </div>
                  </div>
                  <!-- Name and Email -->
                  <div class="min-w-0">
                    <div class="font-semibold text-lg text-slate-900 truncate">
                      {{ sanitizedUserName }}
                    </div>
                    <div class="text-sm text-slate-400 truncate">{{ sanitizedUserEmail }}</div>
                  </div>
                </div>
              </div>

              <!-- Menu Items -->
              <div class="py-1">
                <RouterLink
                  to="/settings"
                  @click="userMenuOpen = false"
                  class="block px-5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  role="menuitem"
                >
                  Settings
                </RouterLink>
                <RouterLink
                  v-if="authStore.user?.is_partner"
                  to="/commission"
                  @click="userMenuOpen = false"
                  class="block px-5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  role="menuitem"
                >
                  Commission
                </RouterLink>
                <button
                  @click="handleLogout"
                  class="w-full text-left px-5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  role="menuitem"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>

  <!-- Global Search Modal -->
  <GlobalSearchModal />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import {
  Ticket,
  Compass,
  Sparkles,
  Search,
  Bell,
  User,
  Globe
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import IconSvg from '@/assets/icon.svg'
import { sanitizePlainText } from '@/utils/sanitize'
import GlobalSearchModal from './GlobalSearchModal.vue'
import { useGlobalSearch } from '@/composables/useGlobalSearch'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Global search
const { open: openSearch } = useGlobalSearch()

const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement>()
const currentTime = ref('')
const isScrolled = ref(false)

// Language state
const showLanguageMenu = ref(false)
const currentLanguage = ref('en')
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'km', name: 'ខ្មែរ', flag: '🇰🇭' },
]

// Navigation items matching the screenshot
const navigationItems = [
  { path: '/events', label: 'Events', icon: Ticket },
  { path: '/explore', label: 'Discover', icon: Compass },
  { path: '/services', label: 'Services', icon: Sparkles }
]

// Check if route is active
const isActiveRoute = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

// Profile picture state
const profilePictureUrl = computed(() => {
  if (!authStore.user?.profile_picture) return null
  return apiService.getProfilePictureUrl(authStore.user.profile_picture)
})

const handleProfilePictureError = () => {
  console.warn('Failed to load profile picture')
}

// Sanitized user data
const sanitizedUserName = computed(() => {
  const firstName = authStore.user?.first_name || ''
  const lastName = authStore.user?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()
  const name = fullName || authStore.user?.username || 'User'
  return sanitizePlainText(name, 100)
})

const sanitizedUserEmail = computed(() => {
  const email = authStore.user?.email || ''
  return sanitizePlainText(email, 100)
})

// Sign in link with redirect
const signinLink = computed(() => {
  const currentPath = route.fullPath
  if (currentPath === '/signin' || currentPath === '/signup') {
    return '/signin'
  }
  return `/signin?redirect=${encodeURIComponent(currentPath)}`
})

// Update current time
const updateTime = () => {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  }
  currentTime.value = now.toLocaleTimeString('en-US', options)
}

// Handle logo click
const handleLogoClick = () => {
  router.push('/events')
}

// Toggle search
const toggleSearch = () => {
  openSearch()
}

// Toggle language menu
const toggleLanguageMenu = () => {
  showLanguageMenu.value = !showLanguageMenu.value
  // Close user menu if open
  if (showLanguageMenu.value) {
    userMenuOpen.value = false
  }
}

// Select language
const selectLanguage = (code: string) => {
  currentLanguage.value = code
  showLanguageMenu.value = false
  // TODO: Implement actual language switching logic
}

// Handle logout
const handleLogout = async () => {
  try {
    await authStore.logout()
    userMenuOpen.value = false
    router.push('/events')
  } catch (error) {
    console.error('Logout failed:', error)
    userMenuOpen.value = false
    alert('Logout failed. Please try again.')
  }
}

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (!event.target || !(event.target instanceof Node)) {
    return
  }
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    userMenuOpen.value = false
  }
  // Close language menu if clicking outside
  const target = event.target as HTMLElement
  if (showLanguageMenu.value && !target.closest('[aria-label="Change language"]')) {
    showLanguageMenu.value = false
  }
}

// Close menu on Escape
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    userMenuOpen.value = false
    showLanguageMenu.value = false
  }
}

// Handle scroll to show/hide border
const handleScroll = () => {
  isScrolled.value = window.scrollY > 0
}

// Timer for updating time
let timeInterval: ReturnType<typeof setInterval>

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
  window.addEventListener('scroll', handleScroll)
  handleScroll() // Check initial scroll position
})

onUnmounted(() => {
  clearInterval(timeInterval)
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Glass navigation bar - blends with brand gradient background */
.glass-nav {
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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(46, 204, 113, 0.1),
    0 4px 12px rgba(30, 144, 255, 0.08);
}
</style>
