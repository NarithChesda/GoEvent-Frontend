<template>
  <!--
    Sentinel. Sits in normal flow immediately after the page header, so the
    moment it slides under the top nav we know the real controls are gone.
  -->
  <div ref="sentinel" aria-hidden="true" class="h-px w-full"></div>

  <!--
    The nav absorbs the controls rather than a second bar appearing under it.
    An earlier version stacked its own glass bar beneath the nav; even matched
    pixel for pixel it read as a two-line header and cost ~56px of list on
    every screen. Landing them inside the existing nav costs nothing.

    `defer` lets the target resolve after this render pass — the nav mounts
    first today, but that ordering isn't something this component should have
    to depend on.
  -->
  <Teleport defer to="#nav-page-controls">
    <Transition name="absorb">
      <div v-if="isPinned" class="flex items-center gap-1.5">
        <TimeFilterToggle
          compact
          :model-value="timeFilter"
          :options="timeOptions"
          @update:model-value="emit('update:timeFilter', $event)"
        />
        <CategoryFilter
          compact
          :model-value="category"
          :categories="categories"
          @update:model-value="emit('update:category', $event)"
        />
      </div>
    </Transition>
  </Teleport>

  <Teleport defer to="#nav-page-controls-mobile">
    <Transition name="absorb">
      <div v-if="isPinned" class="flex items-center gap-1">
        <TimeFilterToggle
          compact
          :model-value="timeFilter"
          :options="timeOptions"
          @update:model-value="emit('update:timeFilter', $event)"
        />
        <CategoryFilter
          compact
          :model-value="category"
          :categories="categories"
          @update:model-value="emit('update:category', $event)"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { EventCategory } from '@/services/api'
import TimeFilterToggle, { type FilterOption } from './TimeFilterToggle.vue'
import CategoryFilter from './CategoryFilter.vue'

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

let observer: IntersectionObserver | null = null

// Mobile top bar is 56px (h-14), desktop nav is 64px (h-16). The sentinel has
// to be judged against whichever is covering it, or the controls appear a
// moment early on one breakpoint and late on the other.
const desktopNav = window.matchMedia('(min-width: 1024px)')

const observeSentinel = () => {
  observer?.disconnect()
  if (!sentinel.value) return

  const navHeight = desktopNav.matches ? 64 : 56

  observer = new IntersectionObserver(
    ([entry]) => {
      // Only pin when the sentinel has passed *above* the viewport — scrolling
      // back down past the list's end must not re-trigger it.
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
})
</script>

<style scoped>
/* Settle in from just above, as though the page header handed them up. */
.absorb-enter-active,
.absorb-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s cubic-bezier(0.32, 0.72, 0, 1);
}

.absorb-enter-from,
.absorb-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .absorb-enter-active,
  .absorb-leave-active {
    transition: opacity 0.15s ease;
    transform: none;
  }
}
</style>
