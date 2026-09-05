<template>
  <!--
    A floating pill rather than a bar welded to the bottom edge: the page runs
    to the bottom of the screen behind it and the navigation reads as an object
    on top of the content, not as a border around it.

    That shape only has room for five labels if it spans the full width, which
    would put the bar back — so only the tab you are on carries its label, and
    it opens to make room for it. The other four are icons, which is also what
    lets the pill hug its content and leave real air at both edges.

    The wrapper is click-through; only the pill and the open menu take taps.

    The band this occupies — the pill's height plus the gap below it — is
    published as `--nav-inset` in MainLayout, and everything else fixed to the
    bottom of the screen positions off that. Changing the row height, the
    padding or the border below means changing the 3.375rem there to match —
    all three are in it.
  -->
  <div
    class="lg:hidden fixed inset-x-0 bottom-0 z-[70] pointer-events-none"
    role="navigation"
    aria-label="Mobile navigation"
  >
    <div class="relative pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <!-- Mobile User Menu (a card above the pill, inset to match it) -->
      <Transition name="slideUp">
        <div
          v-if="userMenuOpen && authStore.isAuthenticated"
          ref="userMenuRef"
          class="pointer-events-auto absolute bottom-full left-3 right-3 mb-3 glass-menu border border-white/40 rounded-3xl overflow-hidden"
          role="menu"
          aria-orientation="vertical"
        >
          <div class="px-4 py-4 space-y-3">
            <!--
              User Info — the whole card copies the email. The address is
              truncated and unselectable inside a menu that closes on the next
              tap outside it, so tapping the card is the only practical way to
              get at it. The corner icon is the affordance, not a second target:
              a button inside a button isn't valid markup, and one large tap
              area is easier to hit than a 28px one.
            -->
            <button
              type="button"
              @click="copy(sanitizedUserEmail)"
              class="group w-full flex items-center gap-3 px-3 py-2 bg-[#E6F4FF] rounded-xl text-left transition-colors duration-200 hover:bg-[#d9edff] active:bg-[#cfe7ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              :aria-label="
                copied
                  ? t('common.nav.emailCopied')
                  : `${t('common.nav.copyEmail')}: ${sanitizedUserEmail}`
              "
            >
              <div class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white flex-shrink-0">
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
              <div class="min-w-0 flex-1">
                <div class="font-semibold text-slate-900 text-sm truncate">
                  {{ sanitizedUserName }}
                </div>
                <!-- The email line doubles as the confirmation: it is the thing
                     that was copied, so the acknowledgement lands where the eye
                     already is. -->
                <div
                  class="text-xs truncate transition-colors duration-200"
                  :class="copied ? 'text-emerald-600 font-medium' : 'text-slate-500'"
                >
                  {{ copied ? t('common.nav.emailCopied') : sanitizedUserEmail }}
                </div>
              </div>
              <span
                class="self-start -mt-0.5 -mr-1 flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-200"
                :class="
                  copied
                    ? 'text-emerald-600'
                    : 'text-slate-400 group-hover:bg-white/70 group-hover:text-slate-600 group-active:bg-white'
                "
                aria-hidden="true"
              >
                <Check v-if="copied" class="w-4 h-4" />
                <Copy v-else class="w-4 h-4" />
              </span>
            </button>

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

              <!-- Shown to every signed-in account, not only partners. The page
                   has two halves: partners get their balance and the wholesale
                   catalogue, everyone else gets the form to apply for a partner
                   account. Gating this link on `is_partner` — as it was, and on
                   a vendor profile before that — made the application
                   unreachable by the only people who need it. No wholesale
                   pricing leaks: the catalogue lives behind the API's own 403,
                   not behind this link. -->
              <RouterLink
                to="/credits"
                @click="closeUserMenu"
                class="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-all duration-200"
                role="menuitem"
              >
                <span class="text-sm font-medium">{{ t('common.nav.credits') }}</span>
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

      <!-- The pill. `w-fit` so it hugs whatever is in it — the width changes
           with the active tab's label, and a fixed width would leave the
           shorter ones padded out and off-centre. -->
      <div
        class="pointer-events-auto mx-auto w-fit max-w-[calc(100vw-1.5rem)] glass-pill rounded-full border border-white/50 p-1.5"
      >
        <!-- The row carries no padding of its own so a tab's offset within it
             is also the indicator's offset — no constant to keep in step. -->
        <div ref="rowRef" class="relative flex items-center gap-0.5">
          <!--
            One gradient pill that travels, rather than each tab painting and
            un-painting its own. A background-image can't be interpolated, so
            the per-tab version could only pop the fill on and then slide the
            width out from under it; moving a single element means the fill is
            never redrawn at all, just relocated.

            Its geometry is measured, not declared — the width depends on the
            active label, which depends on the locale and the loaded webfont.
            See `glide` for how it tracks a target that is itself still moving.
          -->
          <span
            v-show="indicator.visible"
            class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] shadow-md shadow-[#2ecc71]/25 pointer-events-none will-change-transform"
            :style="{ width: `${indicator.w}px`, transform: `translateX(${indicator.x}px)` }"
            aria-hidden="true"
          ></span>

          <!-- Navigation items. The active one carries its label; the rest are
               icons. Width opens through a grid column rather than max-width so
               the open and close ease identically. -->
          <RouterLink
            v-for="item in navigationItems"
            :key="item.path"
            :to="item.path"
            class="relative flex items-center h-10 rounded-full transition-[color,padding] duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95"
            :class="
              isActiveRoute(item.path)
                ? 'text-white pl-3 pr-3.5'
                : 'px-2.5 text-slate-500 hover:text-slate-700'
            "
            :aria-current="isActiveRoute(item.path) ? 'page' : undefined"
            :aria-label="item.label"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span
              class="grid transition-[grid-template-columns,margin] duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
              :class="isActiveRoute(item.path) ? 'grid-cols-[1fr] ml-1.5' : 'grid-cols-[0fr] ml-0'"
            >
              <!--
                Held back until the pill is most of the way here. The travelling
                pill can only lag the layout it is chasing, so a label that
                appeared with the layout would spend the first half of the move
                sitting outside it. Leaving is quicker and undelayed for the
                same reason from the other side: the outgoing text has to be
                gone before the pill arrives over it, or it reads as being
                painted out rather than having left.

                Clipped rather than ellipsised — the column opens from zero, so
                an ellipsis would show through most of the reveal. The cap is
                what keeps a long label (Khmer runs longer than English) from
                pushing the pill into its `max-w`.
              -->
              <span
                class="overflow-hidden whitespace-nowrap max-w-[7rem] text-sm font-semibold transition-opacity"
                :class="
                  isActiveRoute(item.path)
                    ? 'opacity-100 duration-200 delay-200'
                    : 'opacity-0 duration-100 delay-0'
                "
                >{{ item.label }}</span
              >
            </span>
          </RouterLink>

          <!-- Notifications (authenticated only) — the bell used to sit in
               MobileTopBar; on phones it belongs with the rest of the
               navigation. It owns its own trigger and bottom sheet. -->
          <NotificationBell v-if="authStore.isAuthenticated" variant="mobile" />

          <!-- Profile -->
          <RouterLink
            v-if="!authStore.isAuthenticated"
            to="/signin"
            class="relative flex items-center gap-1.5 h-10 px-3.5 rounded-full text-slate-600 hover:text-slate-800 transition-colors duration-200 active:scale-95"
          >
            <User class="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <span class="text-sm font-semibold whitespace-nowrap">{{
              t('common.nav.signIn')
            }}</span>
          </RouterLink>
          <button
            v-else
            type="button"
            @click.stop="toggleUserMenu"
            class="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300 active:scale-95"
            :class="userMenuOpen ? 'bg-slate-900/[0.06]' : ''"
            :aria-expanded="userMenuOpen"
            :aria-label="t('common.nav.profile')"
          >
            <span
              class="w-7 h-7 rounded-full overflow-hidden ring-2 transition-colors duration-300"
              :class="userMenuOpen ? 'ring-[#2ecc71]' : 'ring-white/80'"
            >
              <img
                v-if="profilePictureUrl && !profilePictureError"
                :src="profilePictureUrl"
                :alt="sanitizedUserName"
                class="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                @error="handleProfilePictureError"
              />
              <span
                v-else
                class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-bold text-xs"
              >
                {{ authStore.userInitials }}
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Ticket, Compass, Sparkles, User, ArrowLeftRight, Copy, Check } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { apiService } from '../services/api'
import { sanitizePlainText } from '@/utils/sanitize'
import NotificationBell from './notifications/NotificationBell.vue'
import { useVendorProfile } from '@/composables/settings/useVendorProfile'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useExclusiveMenu } from '@/composables/useExclusiveMenu'
import { useCopyToClipboard } from '@/composables/useCopyToClipboard'
import { useTravellingIndicator } from '@/composables/useTravellingIndicator'

// Copying the signed-in email out of the profile card.
const { copied, copy } = useCopyToClipboard()

// Shares the app-wide "one open menu" slot with the notification sheet next
// door, so opening either closes the other.
const { isOpen: userMenuOpen, close: closeUserMenu, toggle: toggleUserMenu } = useExclusiveMenu()

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
  { path: '/services', label: t('common.nav.services'), icon: Sparkles },
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
/* ------------------------------------------------------------------ *
 * Which tab reads as active, and the gradient that travels to it
 *
 * Both live in `useTravellingIndicator`, shared with the desktop bar so
 * the two can never disagree about how a selection moves. It carries the
 * cross-instance memory this bar needs (the nav chrome is rebuilt on
 * every navigation, so there is nothing to animate *from* unless the
 * outgoing tab is remembered outside the component), the every-frame
 * re-measure the tabs' own relayout demands, and — new here — a
 * critically damped spring in place of the fixed 380ms eased tween.
 *
 * The spring is what makes a redirect mid-flight work: tapping a third
 * tab while the gradient is still crossing to the second used to restart
 * the tween, dropping its speed to zero on one frame. Now the target
 * simply moves and the existing velocity carries through.
 *
 * It also removes the constant that had to be kept in step with the
 * tabs' CSS transition by hand — the spring converges on whatever the
 * layout settles to, whenever it settles.
 * ------------------------------------------------------------------ */

const rowRef = ref<HTMLElement | null>(null)
const {
  indicator,
  isActive: isActiveRoute,
  settle,
} = useTravellingIndicator({
  key: 'mobile-tab-bar',
  row: rowRef,
  path: computed(() => route.path),
})

// A locale swap relabels every tab, so the gradient repositions — it does not
// travel: nothing navigated.
watch(locale, () => nextTick(settle))

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

// Lifecycle hooks. The indicator's own mount work — the arrived-from frame, the
// webfont remeasure and the row's ResizeObserver — lives in the composable.
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
/*
  The menu grows out of the button that opened it and collapses back into it —
  the profile avatar at the pill's trailing edge — rather than sliding in from
  a direction nothing pointed at. `transform-origin` is what carries that; the
  slight scale is what makes it read as arriving from there rather than merely
  passing through.

  `all` is gone: it dragged the card's backdrop blur, its border and its
  two-part shadow into every frame of the transition, which is what made this
  feel heavy to open. Transform and opacity only, on the drawer easing pair
  from DESIGN.md §7 — spring-like on the way in, quicker and flatter out.
*/
.slideUp-enter-active {
  transform-origin: bottom right;
  transition:
    opacity 0.18s ease-out,
    transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
}

.slideUp-leave-active {
  transform-origin: bottom right;
  transition:
    opacity 0.16s ease-in,
    transform 0.2s cubic-bezier(0.4, 0, 0.6, 1);
}

.slideUp-enter-from,
.slideUp-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

/* The floating pill's surface now lives in main.css as `.glass-pill`, so the
   save bar that rides above it is made of the same material. Only the pill's
   own children are tuned here. */

@media (prefers-reduced-motion: reduce) {
  .glass-pill * {
    transition-duration: 0.01ms !important;
  }

  .slideUp-enter-from,
  .slideUp-leave-to {
    transform: none;
  }
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
