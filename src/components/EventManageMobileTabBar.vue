<template>
  <!--
    The manage page's own floating pill, in the band the app's MobileTabBar
    occupies everywhere else. That bar is hidden on this page: Events / Explore
    / Services lead away from the event, and the back arrow in the header
    already does that job. What an organizer moves between here is the event's
    own sections, which used to be a scrolling text strip pinned under the
    header — out of thumb reach, and a second header row on every tab.

    Same shape and same geometry as MobileTabBar (h-10 row, p-1.5, 1px border),
    because MainLayout's `--nav-inset` and the FAB slots above it are that
    pill's measurements. EventManageView sets `has-custom-bottom-bar`, which is
    what keeps them. Change the row height, the padding or the border and the
    3.375rem in MainLayout has to change with them.

    Every section is in the pill — none is behind a menu. That is up to eight
    of them, which is more than a phone has room for once one carries its
    label, so the pill has two modes (see `labelled`): the active tab carries
    its label while the longest one would fit, and past that every tab is an
    icon in an equal share of the width.

    Only the pill takes taps; the wrapper is click-through.
  -->
  <nav
    class="lg:hidden fixed inset-x-0 bottom-0 z-[70] pointer-events-none"
    :aria-label="t('management.mobileNav.label')"
  >
    <div class="relative pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <!-- The pill. `w-fit` so it hugs its content: its width changes with the
           active tab's label. -->
      <div
        class="pointer-events-auto mx-auto w-fit max-w-[calc(100vw-1.5rem)] glass-pill rounded-full border border-white/50 p-1.5"
      >
        <!-- No padding on the row, so a tab's offset within it is also the
             indicator's offset. `--tab-count` sizes the icon-only slots. -->
        <div
          ref="rowRef"
          class="relative flex items-center gap-0.5"
          :style="{ '--tab-count': visibleTabs.length }"
        >
          <!-- One gradient that travels between the tabs, measured off
               `aria-current="page"` (useTravellingIndicator, shared with
               MobileTabBar and the desktop bar). Hidden while the active section
               is not in the pill at all — the Design Studio, when it is reached
               from the page's FAB instead. -->
          <span
            v-show="indicator.visible"
            class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] shadow-md shadow-[#2ecc71]/25 pointer-events-none will-change-transform"
            :style="{ width: `${indicator.w}px`, transform: `translateX(${indicator.x}px)` }"
            aria-hidden="true"
          ></span>

          <button
            v-for="tab in visibleTabs"
            :key="tab.id"
            type="button"
            class="relative flex items-center h-10 rounded-full transition-[color,padding] duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95"
            :class="[
              labelled ? (isActive(tab.id) ? 'pl-3 pr-3.5' : 'px-2.5') : 'tab--fit justify-center',
              isActive(tab.id) ? 'text-white' : 'text-slate-500 hover:text-slate-700',
            ]"
            :aria-current="isActive(tab.id) ? 'page' : undefined"
            :aria-label="tab.mobileLabel || tab.label"
            @click="emit('tab-change', tab.id)"
          >
            <component
              :is="eventTabIcon(tab.icon)"
              class="w-5 h-5 flex-shrink-0"
              aria-hidden="true"
            />
            <!-- The label opens through a grid column, and fades in late and out
                 early, for the reasons MobileTabBar gives: the gradient can only
                 lag the layout it chases, so text that arrived with the layout
                 would sit outside it for half the move. Rendered in both modes,
                 because its natural width is what decides the mode. -->
            <span
              class="grid transition-[grid-template-columns,margin] duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
              :class="
                labelled && isActive(tab.id) ? 'grid-cols-[1fr] ml-1.5' : 'grid-cols-[0fr] ml-0'
              "
            >
              <span
                :ref="(el) => setLabelEl(tab.id, el)"
                class="overflow-hidden whitespace-nowrap max-w-[7rem] text-sm font-semibold transition-opacity"
                :class="
                  labelled && isActive(tab.id)
                    ? 'opacity-100 duration-200 delay-200'
                    : 'opacity-0 duration-100 delay-0'
                "
                >{{ tab.mobileLabel || tab.label }}</span
              >
            </span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { TabConfig } from './EventNavigationTabs.vue'
import { eventTabIcon } from './eventTabIcons'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useTravellingIndicator } from '@/composables/useTravellingIndicator'

interface Props {
  activeTab: string
  tabs: TabConfig[]
  canViewRegistration?: boolean
  canViewMedia?: boolean
  canViewTemplate?: boolean
  canViewPayment?: boolean
  canViewGuestManagement?: boolean
  canViewAnalytics?: boolean
  canViewExpenses?: boolean
  canViewDonation?: boolean
  canViewTickets?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'tab-change': [tabId: string]
}>()

const { t, locale } = useAppLanguage()

const visibleTabs = computed(() => {
  return props.tabs.filter((tab) => {
    if (tab.id === 'registration' && !props.canViewRegistration) return false
    if (tab.id === 'design-studio' && !props.canViewMedia) return false
    if (tab.id === 'template-payment' && !props.canViewTemplate) return false
    if (tab.id === 'guest-management' && !props.canViewGuestManagement) return false
    if (tab.id === 'analytics' && !props.canViewAnalytics) return false
    if (tab.id === 'expenses' && !props.canViewExpenses) return false
    if (tab.id === 'donation' && !props.canViewDonation) return false
    if (tab.id === 'tickets' && !props.canViewTickets) return false
    return tab.visible !== false
  })
})

// ---------------------------------------------------------------------------
// The travelling gradient. No `key`: unlike the app's nav bars this instance
// survives every section change (they are a query param, not a route), so it
// always has a real position to animate from.
// ---------------------------------------------------------------------------
const rowRef = ref<HTMLElement | null>(null)
const { indicator, isActive, settle } = useTravellingIndicator({
  row: rowRef,
  path: computed(() => props.activeTab),
})

// ---------------------------------------------------------------------------
// Labelled or icon-only.
//
// Labelled is the better pill — it says where you are — but it costs a label's
// width on top of an icon per section, and with six to eight sections that
// only fits on a wide phone, and in Khmer on fewer still. So it is measured:
// the pill carries the active label only while the *longest* label would fit
// beside every other tab's icon. Deciding on the longest rather than on the
// active one keeps the mode fixed while the organizer moves between sections;
// it only changes with the viewport, the locale or the set of sections.
//
// Otherwise every tab is icon-only (`.tab--fit`), in an equal share of the
// width capped at the 40px a labelled pill's icons get.
//
// The geometry below is the template's own classes in rem — the pill's p-1.5
// and 1px border, gap-0.5, px-2.5 around a w-5 icon, and the active tab's
// pl-3 / ml-1.5 / pr-3.5 — so a change to those classes means a change here.
// ---------------------------------------------------------------------------
const labelEls = new Map<string, HTMLElement>()
const labelWidths = ref<Record<string, number>>({})
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 0)
const rootFontPx = ref(16)

const setLabelEl = (id: string, el: unknown) => {
  if (el instanceof HTMLElement) labelEls.set(id, el)
  else labelEls.delete(id)
}

/**
 * The labels' natural widths. Each one is clipped to nothing while its tab is
 * inactive, but `scrollWidth` still reports the text inside it. A pill hidden
 * by its breakpoint measures 0 everywhere; that is not a width, so it is kept
 * out rather than letting every label look as if it fits.
 */
const measure = () => {
  viewportWidth.value = window.innerWidth
  rootFontPx.value = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const widths: Record<string, number> = {}
  for (const [id, el] of labelEls) {
    if (el.scrollWidth) widths[id] = el.scrollWidth
  }
  labelWidths.value = widths
}

const labelled = computed(() => {
  const tabs = visibleTabs.value
  if (!tabs.length) return false
  const widths = tabs.map((tab) => labelWidths.value[tab.id])
  if (widths.some((w) => w === undefined)) return false

  const rem = rootFontPx.value
  const longest = Math.min(Math.max(...(widths as number[])), 7 * rem)
  const n = tabs.length
  const pill = 0.75 * rem + 2
  const gaps = (n - 1) * 0.125 * rem
  const icons = (n - 1) * 2.5 * rem
  const active = 3.25 * rem + longest
  return pill + gaps + icons + active <= viewportWidth.value - 1.5 * rem
})

// A relabel or a different set of sections changes the answer; so does the
// webfont arriving, since the first measure may be of the fallback face. The
// indicator only needs placing again, never travelling: nothing navigated.
watch(locale, () =>
  nextTick(() => {
    measure()
    nextTick(settle)
  }),
)
watch(
  () => visibleTabs.value.map((tab) => tab.id).join(),
  () => nextTick(measure),
)

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
  document.fonts?.ready.then(measure)
})

onUnmounted(() => {
  window.removeEventListener('resize', measure)
})
</script>

<style scoped>
/*
  Icon-only slot: an equal share of the pill's widest possible row — the
  viewport less the pill's 0.75rem outer gutters, its p-1.5 and border, and the
  row's gaps — capped at the 40px a labelled pill gives each icon. Only a
  narrow phone with every section switched on ever takes the share rather than
  the cap. Width, not flex, so the pill can still hug its content.
*/
.tab--fit {
  width: min(
    2.5rem,
    calc((100vw - 1.5rem - 0.75rem - 2px - (var(--tab-count) - 1) * 0.125rem) / var(--tab-count))
  );
  padding-inline: 0;
}

@media (prefers-reduced-motion: reduce) {
  .glass-pill * {
    transition-duration: 0.01ms !important;
  }
}
</style>
