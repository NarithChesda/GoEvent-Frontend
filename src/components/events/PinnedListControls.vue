<template>
  <!--
    Owns *both* copies of the list filters — the pair that sits in the page
    header and the pair the top bar takes over — because the hand-off only
    reads as absorption if the two are swapped on the same frame. Drop this
    straight into the page's title row in place of the controls themselves.

    The header copy leaves the moment the bar's bottom edge reaches its top
    edge, drifting up as it goes, while the bar's copy rises into place. An
    earlier version watched a sentinel placed after the whole header block, so
    the swap landed a header-margin late — the controls scrolled all the way
    under the bar and only then reappeared inside it, which reads as a second
    control showing up rather than this one being taken in.
  -->
  <div class="relative flex-shrink-0">
    <!-- Sentinel pinned to the group's top edge, and kept out of the fading
         wrapper so its geometry is never in question. It is what the top bar's
         bottom edge meets first, which is the frame the swap has to happen on. -->
    <div ref="sentinel" aria-hidden="true" class="absolute inset-x-0 top-0 h-px"></div>

    <div
      class="flex items-center gap-1.5 sm:gap-2 transition-all duration-200 ease-out"
      :class="isPinned ? 'invisible opacity-0 -translate-y-2' : 'visible opacity-100 translate-y-0'"
      :aria-hidden="isPinned"
    >
      <TimeFilterToggle
        :model-value="timeFilter"
        :options="timeOptions"
        @update:model-value="emit('update:timeFilter', $event)"
      />
      <CategoryFilter
        :model-value="category"
        :categories="categories"
        @update:model-value="emit('update:category', $event)"
      />
    </div>
  </div>

  <!--
    The nav absorbs the controls rather than a second bar appearing under it.
    An earlier version stacked its own glass bar beneath the nav; even matched
    pixel for pixel it read as a two-line header and cost ~56px of list on
    every screen. Landing them inside the existing nav costs nothing.

    They arrive at full size, in the same shape and the same column position
    the page header had them in — only repainted for the bar (`tone="nav"`).
    Shrinking them to icons instead broke the illusion: it read as a different
    control appearing somewhere else, not as the bar taking this one in.

    `defer` lets the target resolve after this render pass — the nav mounts
    first today, but that ordering isn't something this component should have
    to depend on.
  -->
  <Teleport defer to="#nav-page-controls">
    <Transition name="absorb">
      <div v-if="isPinned" class="flex items-center gap-1.5 sm:gap-2">
        <TimeFilterToggle
          tone="nav"
          :model-value="timeFilter"
          :options="timeOptions"
          @update:model-value="emit('update:timeFilter', $event)"
        />
        <CategoryFilter
          tone="nav"
          :model-value="category"
          :categories="categories"
          @update:model-value="emit('update:category', $event)"
        />
      </div>
    </Transition>
  </Teleport>

  <!--
    The mobile bar is 56px tall and already carries search, notifications and
    language, so the labelled pills genuinely do not fit there; below `sm` the
    page header shows the same round chips anyway, so only the fill changes.
  -->
  <Teleport defer to="#nav-page-controls-mobile">
    <Transition name="absorb">
      <div v-if="isPinned" class="flex items-center gap-1">
        <TimeFilterToggle
          compact
          tone="nav"
          :model-value="timeFilter"
          :options="timeOptions"
          @update:model-value="emit('update:timeFilter', $event)"
        />
        <CategoryFilter
          compact
          tone="nav"
          :model-value="category"
          :categories="categories"
          @update:model-value="emit('update:category', $event)"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { EventCategory } from '@/services/api'
import TimeFilterToggle, { type FilterOption } from './TimeFilterToggle.vue'
import CategoryFilter from './CategoryFilter.vue'
import { useNavPageControls } from '@/composables/useNavPageControls'

defineProps<{
  timeFilter: string
  timeOptions: FilterOption[]
  category: string
  categories: EventCategory[]
}>()

const emit = defineEmits<{
  'update:timeFilter': [value: string]
  'update:category': [value: string]
}>()

const sentinel = ref<HTMLElement | null>(null)
const isPinned = ref(false)

// Tells the nav to yield room for what it is about to hold — see
// useNavPageControls.
const { setAbsorbed } = useNavPageControls()
watch(isPinned, setAbsorbed)

let observer: IntersectionObserver | null = null

// Mobile top bar is 56px (h-14), desktop nav is 64px (h-16). The sentinel has
// to be judged against whichever is about to cover it, or the swap lands early
// on one breakpoint and late on the other.
const desktopNav = window.matchMedia('(min-width: 1024px)')

const observeSentinel = () => {
  observer?.disconnect()
  if (!sentinel.value) return

  const navHeight = desktopNav.matches ? 64 : 56

  observer = new IntersectionObserver(
    ([entry]) => {
      // The root is shrunk by the bar's height, so the sentinel leaves it on
      // the exact frame the controls' top edge passes under the bar's bottom
      // edge. Only pin when it has gone *above* the viewport — scrolling back
      // down past the list's end must not re-trigger it.
      isPinned.value = !entry.isIntersecting && entry.boundingClientRect.top < navHeight
    },
    { rootMargin: `-${navHeight}px 0px 0px 0px`, threshold: 0 }
  )

  observer.observe(sentinel.value)
}

const handleBreakpointChange = () => observeSentinel()

onMounted(() => {
  observeSentinel()
  desktopNav.addEventListener('change', handleBreakpointChange)
})

onUnmounted(() => {
  observer?.disconnect()
  desktopNav.removeEventListener('change', handleBreakpointChange)
  // Leaving the page must give the nav its clock and shortcuts back.
  setAbsorbed(false)
})
</script>

<style scoped>
/*
  Rise into the bar from the edge the header copy is leaving through, rather
  than dropping in from above it — the two are ~50px apart and cross-fade over
  the same fifth of a second, so the pair reads as one control being drawn up
  into the chrome.
*/
.absorb-enter-active,
.absorb-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.26s cubic-bezier(0.32, 0.72, 0, 1);
}

.absorb-enter-from,
.absorb-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (prefers-reduced-motion: reduce) {
  .absorb-enter-active,
  .absorb-leave-active {
    transition: opacity 0.15s ease;
    transform: none;
  }
}
</style>
