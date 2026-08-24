<template>
  <!-- Desktop Top Navigation Bar -->
  <header
    class="fixed top-0 left-0 right-0 h-16 border-b z-50"
    :class="[
      'glass-nav',
      // The minimal bar is the only chrome signed-out pages get, so it stays on phones too
      isMinimal ? 'flex' : 'hidden lg:flex',
      isScrolled ? 'is-scrolled' : '',
      isScrolled
        ? isMinimal
          ? 'border-white/50 shadow-lg shadow-slate-900/5'
          : 'border-white/30 shadow-lg shadow-[#2ecc71]/5'
        : 'border-transparent',
    ]"
    role="navigation"
    aria-label="Main navigation"
  >
    <div class="w-full h-full relative">
      <!-- Logo (absolute left) -->
      <div class="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2">
        <button
          @click="handleLogoClick"
          class="flex items-center group"
          aria-label="Go to home page"
        >
          <img
            :src="GLogoPng"
            alt="GoEvent Logo"
            class="h-7 w-auto max-w-none transition-all duration-300 group-hover:scale-110"
          />
        </button>
      </div>

      <!-- Main Navigation (aligned with page content) -->
      <div
        v-if="!isMinimal"
        class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center gap-2"
      >
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

        <!-- Page-level controls (list filters) teleport in here while the
             page's own header is scrolled out of view, so the nav absorbs them
             instead of a second bar appearing beneath it. It renders here, in
             the content column, but is pinned to that column's right edge from
             the style block rather than laid out by this row — the edge it has
             to land on is a property of the viewport, not of the nav links
             beside it. -->
        <div
          id="nav-page-controls"
          class="nav-page-controls flex items-center"
          :style="navUtilityWidth ? { '--nav-utility-width': `${navUtilityWidth}px` } : undefined"
        ></div>
      </div>

      <!-- Right Section: Time, Actions, Profile (absolute right) -->
      <div class="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
        <!-- The clock and the Create Event shortcut step aside while the bar is
             holding a page's filters: they are the two widest things here that
             nothing depends on mid-scroll, and the room they free is what lets
             the absorbed controls keep the page header's position. Both come
             straight back when the header scrolls into view again. -->
        <Transition name="nav-yield">
          <!-- The clock is desktop-only on the minimal bar; a phone has one of its own -->
          <div
            v-if="!pageControlsAbsorbed"
            class="items-center gap-3"
            :class="isMinimal ? 'hidden lg:flex' : 'flex'"
          >
            <!-- Current Time -->
            <div class="text-sm text-slate-500 font-medium tabular-nums whitespace-nowrap">
              {{ currentTime }}
            </div>

            <!-- Divider -->
            <div class="h-4 w-px bg-slate-200"></div>
          </div>
        </Transition>

        <!-- The same Discover nav item as the full bar, just moved to the right -->
        <RouterLink
          v-if="isMinimal && discoverItem"
          :to="discoverItem.path"
          class="flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200"
          :class="
            isActiveRoute(discoverItem.path)
              ? 'text-slate-900'
              : 'text-slate-400 hover:text-slate-700'
          "
        >
          <component :is="discoverItem.icon" class="w-4 h-4" aria-hidden="true" />
          <span>{{ discoverItem.label }}</span>
        </RouterLink>

        <!-- Create Event Button (authenticated only). The wrapper carries the
             collapse: the link's own `transition-all` would otherwise override
             it and leave the width snapping. -->
        <Transition name="nav-yield">
          <div v-if="authStore.isAuthenticated && !pageControlsAbsorbed && !isMinimal">
            <RouterLink
              to="/events?createEvent=true"
              class="block px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/60 rounded-lg transition-all duration-200 whitespace-nowrap"
            >
              {{ t('common.nav.createEvent') }}
            </RouterLink>
          </div>
        </Transition>

        <!--
          The fixed furniture, wrapped so it can be measured as one thing.
          Everything above yields while the bar is holding a page's filters;
          from here down is what stays on screen at every width, so it is what
          those filters have to stop short of. Its width is not a constant —
          signed out it is a Globe and a Sign In pill, signed in a search
          button, the bell and an avatar, and the pill's label is a different
          length in every locale — so it is measured rather than assumed, and
          the measurement is what the style block's floor is built from.
        -->
        <div v-if="!isMinimal" ref="navUtilityRef" class="flex items-center gap-3">
          <!-- Icon Button Group -->
          <div class="flex items-center gap-0.5">
            <!-- Search Button (authenticated only) -->
            <button
              v-if="authStore.isAuthenticated"
              @click="toggleSearch"
              class="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white/60 transition-all duration-200"
              aria-label="Search"
            >
              <Search class="w-[18px] h-[18px]" />
            </button>

            <!-- Notifications Bell (authenticated only) -->
            <NotificationBell v-if="authStore.isAuthenticated" variant="desktop" />

            <!-- Language Button — signed-out only. Signed-in users switch from
                 inside the profile menu, which they don't have out here. -->
            <div v-if="!authStore.isAuthenticated" class="relative">
              <button
                @click.stop="toggleLanguageMenu"
                class="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white/60 transition-all duration-200"
                aria-label="Change language"
              >
                <Globe class="w-[18px] h-[18px]" />
              </button>

              <!-- Language Dropdown -->
              <Transition name="dropdown">
                <div
                  v-if="showLanguageMenu"
                  class="glass-dropdown absolute right-0 top-full mt-2 rounded-xl overflow-hidden min-w-[8.75rem] z-[100]"
                >
                  <button
                    v-for="lang in availableLocales"
                    :key="lang.code"
                    @click="selectLanguage(lang.code)"
                    class="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                    :class="locale === lang.code ? 'text-[#2ecc71] font-medium bg-[#2ecc71]/5' : 'text-slate-700'"
                  >
                    <span>{{ lang.flag }}</span>
                    <span>{{ lang.name }}</span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Divider before Profile -->
          <div class="h-4 w-px bg-slate-200"></div>

          <!-- Profile Button -->
          <div ref="userMenuRef" class="relative">
            <button
              v-if="authStore.isAuthenticated"
              @click.stop="toggleUserMenu"
              class="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/80 hover:ring-[#2ecc71]/50 transition-all duration-200"
              :aria-expanded="userMenuOpen"
              aria-label="User menu"
            >
              <img
                v-if="profilePictureUrl && !profilePictureError"
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
              class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-medium hover:shadow-md hover:shadow-[#2ecc71]/20 transition-all duration-200"
              :aria-label="t('common.nav.signIn')"
            >
              <User class="w-3.5 h-3.5" />
              <span>{{ t('common.nav.signIn') }}</span>
            </RouterLink>

            <!-- User Dropdown Menu -->
            <Transition name="dropdown">
              <div
                v-if="userMenuOpen && authStore.isAuthenticated"
                class="glass-dropdown absolute right-0 top-full mt-2 rounded-2xl overflow-hidden z-[100] w-72"
                role="menu"
                aria-orientation="vertical"
              >
                <!--
                  User Info Header — the whole header copies the email. The
                  address is truncated here and there is nowhere else in the app
                  to read it off, so the header itself is the affordance and the
                  corner icon only signals it: a button nested inside a button
                  isn't valid markup, and one large target beats a 28px one.
                -->
                <button
                  type="button"
                  @click="copy(sanitizedUserEmail)"
                  class="group w-full flex items-center gap-3 px-5 py-4 border-b border-slate-100 text-left transition-colors duration-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-inset"
                  :aria-label="
                    copied
                      ? t('common.nav.emailCopied')
                      : `${t('common.nav.copyEmail')}: ${sanitizedUserEmail}`
                  "
                >
                  <!-- Large Avatar -->
                  <div class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      v-if="profilePictureUrl && !profilePictureError"
                      :src="profilePictureUrl"
                      :alt="sanitizedUserName"
                      class="w-full h-full object-cover"
                      @error="handleProfilePictureError"
                    />
                    <div
                      v-else
                      class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-bold text-lg"
                    >
                      {{ authStore.userInitials }}
                    </div>
                  </div>
                  <!-- Name and Email -->
                  <div class="min-w-0 flex-1">
                    <div class="font-semibold text-lg text-slate-900 truncate">
                      {{ sanitizedUserName }}
                    </div>
                    <!-- The email line doubles as the confirmation: it is the
                         thing that was copied, so the acknowledgement lands where
                         the eye already is. -->
                    <div
                      class="text-sm truncate transition-colors duration-200"
                      :class="copied ? 'text-emerald-600 font-medium' : 'text-slate-400'"
                    >
                      {{ copied ? t('common.nav.emailCopied') : sanitizedUserEmail }}
                    </div>
                  </div>
                  <span
                    class="self-start -mt-1 -mr-1.5 flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-200"
                    :class="
                      copied
                        ? 'text-emerald-600'
                        : 'text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
                    "
                    aria-hidden="true"
                  >
                    <Check v-if="copied" class="w-4 h-4" />
                    <Copy v-else class="w-4 h-4" />
                  </span>
                </button>

                <!-- Menu Items -->
                <div class="py-1">
                  <RouterLink
                    v-if="isVerifiedVendor"
                    to="/settings?tab=listings"
                    @click="closeUserMenu"
                    class="block px-5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    role="menuitem"
                  >
                    {{ t('common.nav.myListings') }}
                  </RouterLink>
                  <RouterLink
                    to="/settings"
                    @click="closeUserMenu"
                    class="block px-5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    role="menuitem"
                  >
                    {{ t('common.nav.settings') }}
                  </RouterLink>
                  <RouterLink
                    to="/settings?tab=tickets"
                    @click="closeUserMenu"
                    class="block px-5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    role="menuitem"
                  >
                    {{ t('common.nav.myTickets') }}
                  </RouterLink>
                  <!-- Shown to every signed-in account, not only partners.
                       The page has two halves: partners get their balance and
                       the wholesale catalogue, everyone else gets the form to
                       apply for a partner account. Gating this link on
                       `is_partner` — as it was, and on a vendor profile before
                       that — made the application unreachable by the only people
                       who need it. No wholesale pricing leaks: the catalogue
                       lives behind the API's own 403, not behind this link. -->
                  <RouterLink
                    to="/credits"
                    @click="closeUserMenu"
                    class="block px-5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    role="menuitem"
                  >
                    {{ t('common.nav.credits') }}
                  </RouterLink>
                  <!-- Language — a straight toggle, not a submenu. The menu stays
                       open so the label flips in place and confirms the switch. -->
                  <button
                    @click="toggleLanguage"
                    class="w-full flex items-center justify-between gap-3 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    role="menuitem"
                    :aria-label="`${t('common.language.label')}: ${currentLocaleOption.name}`"
                  >
                    <span>{{ t('common.language.label') }}: {{ locale.toUpperCase() }}</span>
                    <ArrowLeftRight class="w-4 h-4 text-slate-400" aria-hidden="true" />
                  </button>
                  <button
                    @click="handleLogout"
                    class="w-full text-left px-5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    role="menuitem"
                  >
                    {{ t('common.nav.signOut') }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Global Search Modal -->
  <GlobalSearchModal v-if="!isMinimal" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import {
  Ticket,
  Compass,
  Sparkles,
  Search,
  User,
  Globe,
  ArrowLeftRight,
  Copy,
  Check
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import GLogoPng from '@/assets/g-logo.png'
import { sanitizePlainText } from '@/utils/sanitize'
import GlobalSearchModal from './GlobalSearchModal.vue'
import NotificationBell from './notifications/NotificationBell.vue'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import { useVendorProfile } from '@/composables/settings/useVendorProfile'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useExclusiveMenu } from '@/composables/useExclusiveMenu'
import { useNavPageControls } from '@/composables/useNavPageControls'
import { useCopyToClipboard } from '@/composables/useCopyToClipboard'
import type { AppLocale } from '@/i18n'

interface Props {
  /**
   * `full` is the app bar. `minimal` is the signed-out variant used by
   * [SignInView.vue](src/views/SignInView.vue): logo, clock (desktop only) and
   * Discover, nothing else — and unlike the full bar it stays visible on phones,
   * since signed-out pages have no MobileTabBar under them.
   */
  variant?: 'full' | 'minimal'
}

const props = withDefaults(defineProps<Props>(), { variant: 'full' })
const isMinimal = computed(() => props.variant === 'minimal')

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Vendor profile for showing listings link
const { vendorState } = useVendorProfile({ autoLoad: true })
const isVerifiedVendor = computed(() => vendorState.value === 'verified')

// Global search
const { open: openSearch } = useGlobalSearch()

// True while a list page has handed its filters up to this bar
const { absorbed: pageControlsAbsorbed } = useNavPageControls()

// Copying the signed-in email out of the profile menu header.
const { copied, copy } = useCopyToClipboard()

// Menus share one app-wide "open" slot with the notification bell, so opening
// any one of them closes the others.
const {
  isOpen: userMenuOpen,
  close: closeUserMenu,
  toggle: toggleUserMenu,
} = useExclusiveMenu()
const {
  isOpen: showLanguageMenu,
  close: closeLanguageMenu,
  toggle: toggleLanguageMenu,
} = useExclusiveMenu()

const userMenuRef = ref<HTMLElement>()
const currentTime = ref('')
const isScrolled = ref(false)

// How much of the right edge the bar's fixed furniture occupies, in px, fed to
// the style block as `--nav-utility-width`. Absorbed page controls stop short of
// it (see the block for the geometry). Observed rather than derived from the
// class list: it changes with sign-in state, with the locale the Sign In pill is
// labelled in, and — silently, later — with any button added to that group.
const navUtilityRef = ref<HTMLElement>()
const navUtilityWidth = ref(0)
let utilityObserver: ResizeObserver | null = null

// Language state — backed by the i18n store
const { t, locale, setLocale, availableLocales, currentLocaleOption } = useAppLanguage()

// Navigation items — labels come from common.nav.* translations
const navigationItems = computed(() => [
  { path: '/events', label: t('common.nav.events'), icon: Ticket },
  { path: '/explore', label: t('common.nav.discover'), icon: Compass },
  { path: '/services', label: t('common.nav.services'), icon: Sparkles }
])

// The minimal bar shows this one item, right-aligned, rather than the full row
const discoverItem = computed(() =>
  navigationItems.value.find((item) => item.path === '/explore'),
)

// Check if route is active
const isActiveRoute = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

// Profile picture state
const profilePictureError = ref(false)
const profilePictureUrl = computed(() => {
  if (!authStore.user?.profile_picture) return null
  return apiService.getProfilePictureUrl(authStore.user.profile_picture)
})

const handleProfilePictureError = () => {
  profilePictureError.value = true
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

// Select language (signed-out dropdown)
const selectLanguage = (code: AppLocale) => {
  setLocale(code)
  closeLanguageMenu()
}

// Step to the next locale — used by the profile menu's one-click toggle.
// Cycles rather than flipping a pair so a third locale needs no change here.
const toggleLanguage = () => {
  const options = availableLocales.value
  if (options.length < 2) return
  const currentIndex = options.findIndex((opt) => opt.code === locale.value)
  setLocale(options[(currentIndex + 1) % options.length].code)
}

// Handle logout
const handleLogout = async () => {
  try {
    await authStore.logout()
    closeUserMenu()
    router.push('/events')
  } catch (error) {
    console.error('Logout failed:', error)
    closeUserMenu()
    alert('Logout failed. Please try again.')
  }
}

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (!event.target || !(event.target instanceof Node)) {
    return
  }
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    closeUserMenu()
  }
  // Close language menu if clicking outside
  const target = event.target as HTMLElement
  if (showLanguageMenu.value && !target.closest('[aria-label="Change language"]')) {
    closeLanguageMenu()
  }
}

// Close menu on Escape
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeUserMenu()
    closeLanguageMenu()
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

  // A ResizeObserver rather than a one-off measurement: the group is still
  // laying out with fallback fonts on the first frame, and the Khmer sign-in
  // label lands a good deal wider once Kantumruy Pro arrives.
  if (navUtilityRef.value && typeof ResizeObserver !== 'undefined') {
    utilityObserver = new ResizeObserver(([entry]) => {
      navUtilityWidth.value = entry.contentRect.width
    })
    utilityObserver.observe(navUtilityRef.value)
  }
})

onUnmounted(() => {
  clearInterval(timeInterval)
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('scroll', handleScroll)
  utilityObserver?.disconnect()
})
</script>

<style scoped>
/*
  Absorbed page controls sit at the right edge of the content column — the exact
  spot the page header had them — so the hand-off reads as the bar taking the
  control in rather than swapping it for something else.

  Pinned to that edge directly instead of being right-aligned inside the nav's
  flex row, because the edge is measured from the viewport: `50%` is half the
  fixed header, and `30rem` is the column's own half-width less its `px-8`
  gutter (`max-w-5xl` 64rem ÷ 2 − 2rem). So the first term *is* the page
  header's inner right edge, whatever the window width.

  The second term is the floor: the measured width of the bar's fixed furniture
  (`--nav-utility-width`, set from the script) plus its own 1.5rem inset from
  the edge and a 1.5rem gap. The controls stop there rather than sliding under
  the search button and the avatar. Only narrow windows ever reach the floor,
  and there the controls give up alignment by the few dozen pixels it takes to
  clear that group, staying about where the eye left them. The fallback covers
  the frame before the observer has reported and any environment without one.

  What is *not* here is a px breakpoint, and that is the point: the 13"–15"
  laptop scale-down in src/assets/main.css drops the root font to 75%, shrinking
  the column and the furniture together, and both terms above follow it for free
  — one in `rem`, the other measured. A breakpoint cannot see it. The previous
  `min-width: 1400px` guard sat *above* the scale-down's own 1200–1599px band,
  so every laptop in that band was denied an alignment it had ample room for (at
  a 12px root the column's edge clears the furniture from ~1000px up) and left
  the controls stranded beside the nav links.
*/
.nav-page-controls {
  position: absolute;
  top: 0;
  bottom: 0;
  right: max(calc(50% - 30rem), calc(var(--nav-utility-width, 11rem) + 3rem));
}

/* Same rule against the wider `2xl:max-w-6xl` column: 72rem ÷ 2 − 2rem. */
@media (min-width: 1536px) {
  .nav-page-controls {
    right: max(calc(50% - 34rem), calc(var(--nav-utility-width, 11rem) + 3rem));
  }
}

/*
  Collapse rather than fade in place: these live in a right-anchored flex row,
  so a plain fade would hold their width until the last frame and then snap
  everything sideways. The negative margin cancels the row's own gap-3 as the
  width goes to zero.
*/
.nav-yield-enter-active,
.nav-yield-leave-active {
  overflow: hidden;
  max-width: 14rem;
  transition:
    opacity 0.18s ease,
    max-width 0.28s cubic-bezier(0.32, 0.72, 0, 1),
    margin-right 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.nav-yield-enter-from,
.nav-yield-leave-to {
  opacity: 0;
  max-width: 0;
  margin-right: -0.75rem;
}

@media (prefers-reduced-motion: reduce) {
  .nav-yield-enter-active,
  .nav-yield-leave-active {
    transition: opacity 0.12s ease;
  }
}

/*
  Dropdown animation — kept identical to the notification bell's so every
  top-bar menu opens the same way. Transform + opacity only: `all` dragged the
  glass panel's backdrop blur and shadow into the transition, which is what
  made these feel heavy on open.
*/
.dropdown-enter-active {
  transition:
    opacity 0.16s ease-out,
    transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.dropdown-leave-active {
  transition:
    opacity 0.14s ease-in,
    transform 0.18s cubic-bezier(0.4, 0, 0.6, 1);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transform-origin: top right;
  will-change: transform, opacity;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: opacity 0.12s ease;
  }

  .dropdown-enter-from,
  .dropdown-leave-to {
    transform: none;
  }
}

/*
  Transparent while the page is at rest, liquid glass once something scrolls
  under it. Any fixed *opaque* fill sits lighter than the page's own wash and
  reads as a band with a hard bottom edge, and an exact match is impossible
  against a gradient: `premium-bg` now carries a brand bloom across its top
  edge, which is exactly the strip the bar covers. So the scrolled state stays
  translucent and lets the backdrop supply the colour — `saturate` pushes the
  wash and bloom back up to strength after the blur has averaged them out,
  which is what keeps the bar tinted with the page instead of flat white.

  The blur stays on permanently — over a smooth gradient it changes nothing at
  rest, so leaving it there avoids a mid-scroll pop. The saturation cannot: it
  filters the backdrop even under a fully transparent bar, so a permanent boost
  would leave the top strip visibly greener than the page a pixel below it and
  draw the very edge described above. It rides in on `is-scrolled` instead,
  from an identity 100%, which is also why the transition is spelled out here
  rather than left to Tailwind's `transition-colors`.

  The highlight is a gradient, and `background-image` cannot be transitioned,
  so it lives on a `::before` sheet whose opacity fades instead.

  (MobileTopBar's `.glass-header` is the same treatment.)
*/
.glass-nav {
  background: rgba(255, 255, 255, 0);
  backdrop-filter: blur(20px) saturate(100%);
  -webkit-backdrop-filter: blur(20px) saturate(100%);
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease,
    backdrop-filter 200ms ease,
    -webkit-backdrop-filter 200ms ease;
}

.glass-nav.is-scrolled {
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

/* Light catching the top face of the slab, thinning through the middle and
   picking up again at the bottom lip. */
.glass-nav::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms ease;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.42) 0%,
    rgba(255, 255, 255, 0.2) 55%,
    rgba(255, 255, 255, 0.28) 100%
  );
}

.glass-nav.is-scrolled::before {
  opacity: 1;
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
