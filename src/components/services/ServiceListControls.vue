<template>
  <!--
    The listings section's heading and its two controls: which services, then in
    what order. Deliberately a separate component from the grid so it survives
    every state the list can be in — inside the grid, filtering into a category
    with no listings would take the category filter away with the grid and leave
    the visitor stuck with no way back.

    `relative z-30` is what keeps the open dropdowns above the listing cards, and
    it is this row's own doing: the controls' drift-up needs a transform, and
    *any* transform — including `translate-y-0` — opens a stacking context, which
    caps the `z-[100]` on the menus inside at this element's level. With z-index
    auto that level is the same one the cards paint at, and they come later in
    the document, so each card would draw straight over an open menu. Stay under
    the bars (mobile z-40, desktop z-50) so this still scrolls beneath them.
  -->
  <div class="relative z-30 flex items-center justify-between gap-2 mb-4">
    <!-- Sentinel on the row's top edge: what the fixed bar's bottom edge meets
         first, which is the frame the hand-off has to happen on. -->
    <div ref="sentinel" aria-hidden="true" class="absolute inset-x-0 top-0 h-px"></div>

    <h2 class="min-w-0 truncate text-lg font-semibold text-slate-900">
      {{ heading }}
      <span v-if="count !== null" class="text-slate-400 font-normal text-sm ml-2">
        ({{ count }})
      </span>
    </h2>

    <!-- The page's copy of the controls. It steps aside — rather than unmounting
         — as the bar takes them in, so the row keeps its height and the heading
         beside it doesn't shift on the frame of the swap. -->
    <div
      class="flex-shrink-0 transition-all duration-200 ease-out"
      :class="isPinned ? 'invisible opacity-0 -translate-y-2' : 'visible opacity-100 translate-y-0'"
      :aria-hidden="isPinned"
    >
      <ServiceListFilters
        :categories="categories"
        :selected-category="selectedCategory"
        :sort-by="sortBy"
        :sort-options="sortOptions"
        @category-change="emit('category-change', $event)"
        @sort-change="emit('sort-change', $event)"
      />
    </div>
  </div>

  <!--
    Desktop: the nav absorbs the controls rather than a second bar appearing
    under it. They arrive at full size, in the same shape and the same column
    position this row had them in — `.nav-page-controls` in TopNavBar pins that
    slot to the content column's right edge, the exact pixels they left from —
    so the hand-off reads as the bar taking this control in.

    Only the palette changes with the surface (`tone="nav"`): up there the
    control's neighbours are the Events / Discover / Services links, so it wears
    their text size and weight at one flat legible tone, instead of the page
    row's ghost button. Same geometry either way — see listControlTrigger.

    Below the nav breakpoint the mobile bar is the one that absorbs them, and it
    holds the page's global actions too; ServicesView renders that copy so the
    two land in the bar in the right order. `pinned` is the shared signal both
    read — see useNavPageControls.

    `defer` lets the target resolve after this render pass — the nav mounts
    first today, but that ordering isn't something this component should have to
    depend on.
  -->
  <Teleport defer to="#nav-page-controls">
    <Transition name="absorb">
      <ServiceListFilters
        v-if="isPinned && isDesktopNav"
        tone="nav"
        :categories="categories"
        :selected-category="selectedCategory"
        :sort-by="sortBy"
        :sort-options="sortOptions"
        @category-change="emit('category-change', $event)"
        @sort-change="emit('sort-change', $event)"
      />
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'
import ServiceListFilters from './ServiceListFilters.vue'
import type { ServiceCategory, SortOption } from './types'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import { useNavPageControls } from '@/composables/useNavPageControls'
import { useHeaderPin } from '@/composables/useHeaderPin'

const { t } = useAppLanguage()
const { translateServiceCategory } = useCategoryTranslation()

const props = defineProps<{
  /** Result count, or null to omit it (nothing counted yet) */
  count: number | null
  categories: ServiceCategory[]
  selectedCategory: string
  sortBy: string
  sortOptions: SortOption[]
}>()

const emit = defineEmits<{
  'category-change': [categoryId: string]
  'sort-change': [sortValue: string]
}>()

const heading = computed(() => {
  const cat = props.categories.find((c) => c.id === props.selectedCategory)
  if (!cat || cat.id === 'all') return t('services.allServices')
  return t('services.categoryServices', { category: translateServiceCategory(cat.name) })
})

// This page has no PageHeaderRow — the featured-vendor hero is its header — so
// this row is what scrolls under the bar, and it owns the sentinel that says so.
const { sentinel, isPinned } = useHeaderPin()

const { isDesktopNav, setPinned, setAbsorbed } = useNavPageControls()

// `pinned` is what ServicesView's mobile bar copy reads; `absorbed` is the
// narrower signal that makes the desktop nav yield its clock and shortcut, which
// is what leaves room for these to keep the content column's right edge.
watch(
  [isPinned, isDesktopNav],
  ([pinned, desktop]) => {
    setPinned(pinned)
    setAbsorbed(pinned && desktop)
  },
  { immediate: true },
)

onUnmounted(() => {
  // Leaving the page must give the nav its clock and shortcut back.
  setPinned(false)
  setAbsorbed(false)
})
</script>
