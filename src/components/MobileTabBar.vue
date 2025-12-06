<template>
  <!-- Mobile Tab Bar (fixed at bottom) -->
  <div
    class="lg:hidden fixed bottom-0 left-0 right-0 z-[70]"
    role="navigation"
    aria-label="Mobile navigation"
  >
    <!-- Mobile User Menu (positioned above tab bar) -->
    <Transition name="slideUp">
      <div
        v-if="userMenuOpen && authStore.isAuthenticated"
        ref="userMenuRef"
        class="absolute bottom-full left-0 right-0 glass-menu border-t border-white/30 z-[70]"
        role="menu"
        aria-orientation="vertical"
      >
        <div class="px-4 py-4 space-y-3">
          <!-- User Info -->
          <div class="flex items-center space-x-3 px-3 py-2 bg-[#E6F4FF] rounded-xl">
            <div class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white">
              <img
                v-if="profilePictureUrl && !profilePictureError"
                :src="profilePictureUrl"
                :alt="sanitizedUserName"
                class="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                @error="handleProfilePictureError"
              />
              <div
                v-else
                class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-bold text-sm"
                :aria-label="`${sanitizedUserName} avatar`"
              >
                {{ authStore.userInitials }}
              </div>
            </div>
            <div>
              <div class="font-semibold text-slate-900 text-sm">
                {{ sanitizedUserName }}
              </div>
              <div class="text-xs text-slate-500">{{ sanitizedUserEmail }}</div>
            </div>
          </div>

          <!-- Menu Items -->
          <div class="space-y-2">
            <RouterLink
              to="/settings"
              @click="userMenuOpen = false"
              class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200"
              role="menuitem"
            >
              <span class="text-sm font-medium">Settings</span>
            </RouterLink>

            <RouterLink
              v-if="authStore.user?.is_partner"
              to="/commission"
              @click="userMenuOpen = false"
              class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200"
              role="menuitem"
            >
              <span class="text-sm font-medium">Commission</span>
            </RouterLink>

            <button
              @click="handleLogout"
              class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200 w-full text-left"
              role="menuitem"
            >
              <span class="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <div class="glass-tab-bar border-t border-white/30">
      <div class="flex items-center justify-around px-2 py-1">
        <!-- Navigation items -->
        <RouterLink
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          class="flex flex-col items-center space-y-0.5 p-2 rounded-xl transition-all duration-300 min-w-0 flex-1 group"
          :class="isActiveRoute(item.path) ? 'text-[#2ecc71] font-semibold' : 'text-slate-600 hover:text-[#2ecc71]'"
          :aria-current="isActiveRoute(item.path) ? 'page' : undefined"
        >
          <component
            :is="item.icon"
            class="w-5 h-5 flex-shrink-0"
            :class="isActiveRoute(item.path) ? 'text-[#2ecc71]' : 'group-hover:text-[#2ecc71]'"
            aria-hidden="true"
          />
          <span class="text-xs font-medium truncate">{{ item.label }}</span>
        </RouterLink>

        <!-- Profile Tab -->
        <div class="flex flex-col items-center space-y-0.5 p-2 rounded-xl transition-all duration-300 min-w-0 flex-1">
          <template v-if="!authStore.isAuthenticated">
            <RouterLink
              to="/signin"
              class="flex flex-col items-center space-y-0.5 text-slate-600 hover:gradient-text w-full rounded-xl p-1 group"
              aria-label="Sign in to your account"
            >
              <User class="w-5 h-5 flex-shrink-0 group-hover:gradient-text" aria-hidden="true" />
              <span class="text-xs font-medium truncate">Sign In</span>
            </RouterLink>
          </template>
          <template v-else>
            <button
              @click.stop="userMenuOpen = !userMenuOpen"
              class="flex flex-col items-center space-y-0.5 w-full rounded-xl p-1 group"
              :class="userMenuOpen ? 'gradient-text font-semibold' : 'text-slate-600 hover:gradient-text'"
              :aria-expanded="userMenuOpen"
              aria-label="User menu"
            >
              <div class="w-5 h-5 rounded-full overflow-hidden ring-1 ring-slate-300 flex-shrink-0">
                <img
                  v-if="profilePictureUrl && !profilePictureError"
                  :src="profilePictureUrl"
                  :alt="sanitizedUserName"
                  class="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  @error="handleProfilePictureError"
                />
                <div
                  v-else
                  class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-bold text-xs"
                  :aria-label="`${sanitizedUserName} avatar`"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Ticket, Compass, Sparkles, User } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import { sanitizePlainText } from '@/utils/sanitize'

const userMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement>()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Navigation items configuration (matching top nav)
const navigationItems = [
  { path: '/events', label: 'Events', icon: Ticket },
  { path: '/explore', label: 'Discover', icon: Compass },
  { path: '/services', label: 'Services', icon: Sparkles }
]

// Check if route is active
const isActiveRoute = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

// Profile picture computed property
const profilePictureError = ref(false)
const profilePictureUrl = computed(() => {
  if (!authStore.user?.profile_picture) return null
  return apiService.getProfilePictureUrl(authStore.user.profile_picture)
})

const handleProfilePictureError = () => {
  profilePictureError.value = true
}

// Sanitized user data to prevent XSS
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

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
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

// Handle logout with error handling
const handleLogout = async () => {
  try {
    await authStore.logout()
    userMenuOpen.value = false
    router.push('/events')
  } catch (error) {
    console.error('Logout failed:', error)
    userMenuOpen.value = false
    alert('Logout failed. Please try again or contact support if the issue persists.')
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
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

/* Custom gradient text */
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

/* Glass tab bar effect - blends with brand gradient background */
.glass-tab-bar {
  background: linear-gradient(
    135deg,
    rgba(248, 255, 254, 0.9) 0%,
    rgba(240, 253, 249, 0.9) 50%,
    rgba(240, 249, 255, 0.9) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.03);
}

/* Glass menu effect */
.glass-menu {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 -8px 32px rgba(46, 204, 113, 0.1),
    0 -4px 12px rgba(30, 144, 255, 0.08);
}
</style>
