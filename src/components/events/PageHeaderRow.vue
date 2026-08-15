<template>
  <!--
    A list page's header: its title, its list controls, and on mobile the
    search / language actions that go with them.

    There is one of these per page and one copy of it on screen. Below the nav
    breakpoint it teleports into the mobile top bar and becomes the bar's whole
    contents; at and above it, it renders in the page as the title row and the
    desktop nav absorbs only its controls once it scrolls away. `:disabled`
    moves the same instance rather than mounting a second one, so an open filter
    sheet survives a rotation and no state is kept in two places.

    Drop it in place of the page's own title row and pass the list controls
    through the default slot.
  -->
  <Teleport defer to="#mobile-page-header" :disabled="isDesktopNav">
    <!--
      `relative z-30` is what keeps the open dropdowns above the list, and it is
      this row's own doing: the controls' drift-up needs a transform, and *any*
      transform — including `translate-y-0` — opens a stacking context, which
      caps the `z-[100]` on the menus inside at this element's level. With
      z-index auto that level is the same one the event cards paint at, and they
      come later in the document, so each card drew straight over the open menu.
      Stay under the bars (mobile z-40, desktop z-50) so this still scrolls
      beneath them rather than across them.

      Margins are `lg:` only — below that this row is inside the bar, where the
      bar's own height does the spacing.
    -->
    <div
      class="relative z-30 flex w-full items-center justify-between gap-3 lg:gap-2 lg:mb-[clamp(1.25rem,3.5vh,2.5rem)]"
    >
      <!-- Sentinel on the row's top edge: what the desktop nav's bottom edge
           meets first, which is the frame the controls' hand-off has to happen
           on. Only observed on desktop — see below. -->
      <div ref="sentinel" aria-hidden="true" class="absolute inset-x-0 top-0 h-px"></div>

      <!-- Bar-sized in the bar, page-sized in the page. One heading either way,
           so the page keeps exactly one `h1`.

           The icon is the page's own tab icon, and it is `lg:hidden` because
           it only earns its place in the bar: there the title is one line of
           `text-base` doing the work of a page header, and the mark gives it
           something to read as. Beside a `text-4xl` page title it would just
           be decoration. Purely that — the title says the same thing — so it
           is `aria-hidden` and the heading text is unchanged. -->
      <h1
        class="flex-1 min-w-0 flex items-center gap-2 text-base font-semibold text-slate-900 lg:text-4xl lg:font-bold"
      >
        <component
          :is="icon"
          v-if="icon"
          class="lg:hidden w-5 h-5 flex-shrink-0 text-[#2ecc71]"
          aria-hidden="true"
        />
        <span class="truncate">{{ title }}</span>
      </h1>

      <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <slot />

        <!-- Desktop keeps search and language in TopNavBar. -->
        <MobileHeaderActions class="lg:hidden" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, type Component } from 'vue'
import MobileHeaderActions from './MobileHeaderActions.vue'
import { useNavPageControls } from '@/composables/useNavPageControls'

defineProps<{
  title: string
  /** The page's tab icon, shown before the title in the mobile bar only. */
  icon?: Component
}>()

const sentinel = ref<HTMLElement | null>(null)

const { isDesktopNav, setPinned } = useNavPageControls()

let observer: IntersectionObserver | null = null

// Desktop nav is 64px (h-16). The sentinel is judged against it so the swap
// lands on the exact frame the row's top edge passes under the nav's bottom
// edge — watching anything lower let the controls scroll all the way under the
// nav and only then reappear inside it, which reads as a second control showing
// up rather than this one being taken in.
const DESKTOP_NAV_HEIGHT = 64

const observeSentinel = () => {
  observer?.disconnect()
  observer = null

  // Nothing to observe on mobile: the row is already in the bar, so it never
  // scrolls out from under one.
  if (!isDesktopNav.value) {
    setPinned(false)
    return
  }
  if (!sentinel.value) return

  observer = new IntersectionObserver(
    ([entry]) => {
      // The root is shrunk by the nav's height, so the sentinel leaves it on the
      // frame the row's top edge passes under the nav. Only pin when it has gone
      // *above* the viewport — scrolling back down past the list's end must not
      // re-trigger it.
      setPinned(!entry.isIntersecting && entry.boundingClientRect.top < DESKTOP_NAV_HEIGHT)
    },
    { rootMargin: `-${DESKTOP_NAV_HEIGHT}px 0px 0px 0px`, threshold: 0 }
  )

  observer.observe(sentinel.value)
}

// Crossing the breakpoint moves this row between the bar and the page, so the
// observer has to be rebuilt against wherever the sentinel has just landed.
watch(isDesktopNav, () => observeSentinel(), { flush: 'post' })

onMounted(observeSentinel)

onUnmounted(() => {
  observer?.disconnect()
  // Leaving the page must give the nav its clock and shortcuts back.
  setPinned(false)
})
</script>
