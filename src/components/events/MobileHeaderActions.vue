<template>
  <!--
    Search and (signed-out) language, the two global actions of a list page's
    mobile header. They sit at the end of PageHeaderRow's control cluster, which
    below the nav breakpoint means inside the mobile top bar — desktop keeps
    both in TopNavBar instead, so this is never rendered there.

    Geometry matches the filter chips (`w-10 h-10 rounded-full`) and so does
    their surface (`.lfc-surface--*`, main.css) and their press (`.lfc-press`).
    All three must stay matching: the four controls read as one group, and one
    odd size or fill out makes the cluster look assembled by accident. The
    hairline comes from the surface's inset shadow rather than a `border`, so
    the circle cannot change size when the fill does.
  -->
  <div ref="root" class="relative flex items-center gap-1.5">
    <button
      type="button"
      @click="openSearch"
      :aria-label="t('common.actions.search')"
      class="lfc-press flex items-center justify-center w-10 h-10 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ecc71]/40"
      :class="chipClass"
    >
      <Search class="w-5 h-5" />
    </button>

    <!-- Signed-out only, matching TopNavBar. Signed-in users switch from inside
         the tab bar's profile menu. -->
    <button
      v-if="!authStore.isAuthenticated"
      type="button"
      @click.stop="showLanguageMenu = !showLanguageMenu"
      aria-haspopup="menu"
      :aria-expanded="showLanguageMenu"
      :aria-label="t('common.language.label')"
      class="lfc-press flex items-center justify-center w-10 h-10 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ecc71]/40"
      :class="chipClass"
    >
      <Globe class="w-5 h-5" />
    </button>

    <Transition name="dropdown">
      <div
        v-if="showLanguageMenu"
        role="menu"
        class="glass-dropdown absolute right-0 top-full mt-2 rounded-xl overflow-hidden min-w-[8.75rem] z-[100]"
      >
        <button
          v-for="lang in availableLocales"
          :key="lang.code"
          type="button"
          role="menuitemradio"
          :aria-checked="locale === lang.code"
          @click="selectLanguage(lang.code)"
          class="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
          :class="
            locale === lang.code ? 'text-[#2ecc71] font-medium bg-[#2ecc71]/5' : 'text-slate-700'
          "
        >
          <span>{{ lang.flag }}</span>
          <span>{{ lang.name }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, Globe } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import { useHeaderTone } from '@/composables/useNavPageControls'
import type { AppLocale } from '@/i18n'

const props = defineProps<{
  /**
   * Palette only — never geometry, same contract as the filter chips. `nav`
   * drops the glass card for a bar, so the control reads as part of the chrome
   * instead of a card floating on it. Left unset it follows where the page
   * header currently lives — see useHeaderTone.
   */
  tone?: 'page' | 'nav'
}>()

const resolvedTone = useHeaderTone(() => props.tone)

const authStore = useAuthStore()
const { t, locale, setLocale, availableLocales } = useAppLanguage()
const { open: openSearch } = useGlobalSearch()

const root = ref<HTMLElement | null>(null)
const showLanguageMenu = ref(false)

// Same two surfaces the filter controls are built from, so the cluster really
// is one material rather than a chip beside two ghost buttons. It used to be
// the latter: on the mobile bar the filter pill carried an opaque fill and
// these carried none, which read as one control and two icons rather than as a
// row. Palette only, never geometry — the width, height and radius above are
// what keep the four the same object.
const chipClass = computed(() =>
  resolvedTone.value === 'nav'
    ? 'lfc-surface--nav text-slate-600 hover:text-slate-900'
    : 'lfc-surface--page text-slate-600 hover:text-slate-900'
)

const selectLanguage = (code: string) => {
  setLocale(code as AppLocale)
  showLanguageMenu.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (!showLanguageMenu.value) return
  if (root.value?.contains(event.target as Node)) return
  showLanguageMenu.value = false
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') showLanguageMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.glass-dropdown {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(46, 204, 113, 0.1),
    0 4px 12px rgba(30, 144, 255, 0.08);
}

/* Scales out of the button it belongs to rather than out of its own centre,
   and never from nothing — a menu that grows from zero reads as conjured, not
   as opened. Exits faster than it enters: the user has already decided. */
.glass-dropdown {
  transform-origin: top right;
}

.dropdown-enter-active {
  transition:
    opacity 180ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
}

.dropdown-leave-active {
  transition:
    opacity 120ms ease-out,
    transform 120ms ease-out;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .dropdown-enter-from,
  .dropdown-leave-to {
    transform: none;
  }
}
</style>
