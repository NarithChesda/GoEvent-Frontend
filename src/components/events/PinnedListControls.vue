<template>
  <!--
    The list filters, and — on desktop only — the copy the nav takes over.

    Below the nav breakpoint there is one copy and it never moves: PageHeaderRow
    has already put this whole row inside the mobile top bar, so the filters are
    in the chrome from the start and there is nothing to absorb. `isPinned` is
    only ever true on desktop, which is why this wrapper's hide and the teleport
    below are effectively desktop-only without saying so twice.
  -->
  <div
    class="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 transition-all duration-200 ease-out"
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

    The `absorb` motion itself is shared, in src/assets/main.css: the services
    list hands its controls up the same way, and a hand-off that eased
    differently there would read as a different interaction.
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

</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
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

// PageHeaderRow owns the sentinel; this component only decides what to do about
// it. `absorbed` is the narrower signal that tells the desktop nav to yield
// room for what it is about to hold, and it is set here rather than alongside
// `pinned` because a page can pin a header without having any filters to hand
// up — see useNavPageControls.
const { pinned: isPinned, setAbsorbed } = useNavPageControls()
watch(isPinned, setAbsorbed, { immediate: true })

onUnmounted(() => {
  // Leaving the page must give the nav its clock and shortcuts back.
  setAbsorbed(false)
})
</script>
