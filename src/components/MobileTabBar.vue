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
              v-if="isVerifiedVendor"
              to="/settings?tab=listings"
              @click="closeUserMenu"
              class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200"
              role="menuitem"
            >
              <span class="text-sm font-medium">{{ t('common.nav.myListings') }}</span>
            </RouterLink>

            <RouterLink
              to="/settings"
              @click="closeUserMenu"
              class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200"
              role="menuitem"
            >
              <span class="text-sm font-medium">{{ t('common.nav.settings') }}</span>
            </RouterLink>

            <RouterLink
              to="/settings?tab=tickets"
              @click="closeUserMenu"
              class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200"
              role="menuitem"
            >
              <span class="text-sm font-medium">{{ t('common.nav.myTickets') }}</span>
            </RouterLink>

            <RouterLink
              v-if="authStore.user?.is_partner"
              to="/commission"
              @click="closeUserMenu"
              class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200"
              role="menuitem"
            >
              <span class="text-sm font-medium">{{ t('common.nav.commission') }}</span>
            </RouterLink>

            <!-- Language — a straight toggle, not a submenu, same as the
                 desktop profile menu. The menu stays open so the label flips
                 in place and confirms the switch. -->
            <button
              @click="toggleLanguage"
              class="flex items-center justify-between gap-3 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200 w-full text-left"
              role="menuitem"
              :aria-label="`${t('common.language.label')}: ${currentLocaleOption.name}`"
            >
              <span class="text-sm font-medium">
                {{ t('common.language.label') }}: {{ locale.toUpperCase() }}
              </span>
              <ArrowLeftRight class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
            </button>

            <button
              @click="handleLogout"
              class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200 w-full text-left"
              role="menuitem"
            >
              <span class="text-sm font-medium">{{ t('common.nav.signOut') }}</span>
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

        <!-- Notifications Tab (authenticated only) — the bell used to sit in
             MobileTopBar; on phones it belongs with the rest of the navigation.
             The wrapper owns the tab slot so it lines up with its siblings; the
             bell owns the trigger and its bottom sheet. -->
        <div
          v-if="authStore.isAuthenticated"
          class="flex flex-col items-center space-y-0.5 p-2 rounded-xl transition-all duration-300 min-w-0 flex-1"
        >
          <NotificationBell variant="mobile" class="w-full min-w-0" />
        </div>

        <!-- Profile Tab -->
        <div class="flex flex-col items-center space-y-0.5 p-2 rounded-xl transition-all duration-300 min-w-0 flex-1">
          <template v-if="!authStore.isAuthenticated">
            <RouterLink
              to="/signin"
              class="flex flex-col items-center space-y-0.5 text-slate-600 hover:gradient-text w-full rounded-xl p-1 group"
              aria-label="Sign in to your account"
            >
              <User class="w-5 h-5 flex-shrink-0 group-hover:gradient-text" aria-hidden="true" />
              <span class="text-xs font-medium truncate">{{ t('common.nav.signIn') }}</span>
            </RouterLink>
          </template>
          <template v-else>
            <button
              @click.stop="toggleUserMenu"
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
              <span class="text-xs font-medium truncate">{{ t('common.nav.profile') }}</span>
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
import { Ticket, Compass, Sparkles, User, ArrowLeftRight } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import { sanitizePlainText } from '@/utils/sanitize'
import NotificationBell from './notifications/NotificationBell.vue'
import { useVendorProfile } from '@/composables/settings/useVendorProfile'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useExclusiveMenu } from '@/composables/useExclusiveMenu'

// Shares the app-wide "one open menu" slot with the notification sheet next
// door, so opening either closes the other.
const {
  isOpen: userMenuOpen,
  close: closeUserMenu,
  toggle: toggleUserMenu,
} = useExclusiveMenu()

const userMenuRef = ref<HTMLElement>()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Language state — backed by the i18n store
const { t, locale, setLocale, availableLocales, currentLocaleOption } = useAppLanguage()

// Vendor profile for showing listings link
const { vendorState } = useVendorProfile({ autoLoad: true })
const isVerifiedVendor = computed(() => vendorState.value === 'verified')

// Navigation items configuration (matching top nav)
const navigationItems = computed(() => [
  { path: '/events', label: t('common.nav.events'), icon: Ticket },
  { path: '/explore', label: t('common.nav.discover'), icon: Compass },
  { path: '/services', label: t('common.nav.services'), icon: Sparkles }
])

// Step to the next locale — the profile menu's one-click toggle, same as
// TopNavBar's. Cycles rather than flipping a pair so a third locale needs no
// change here.
const toggleLanguage = () => {
  const options = availableLocales.value
  if (options.length < 2) return
  const currentIndex = options.findIndex((opt) => opt.code === locale.value)
  setLocale(options[(currentIndex + 1) % options.length].code)
}

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
    closeUserMenu()
  }
}

// Close menu when pressing Escape key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && userMenuOpen.value) {
    closeUserMenu()
  }
}

// Handle logout with error handling
const handleLogout = async () => {
  try {
    await authStore.logout()
    closeUserMenu()
    router.push('/events')
  } catch (error) {
    console.error('Logout failed:', error)
    closeUserMenu()
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
