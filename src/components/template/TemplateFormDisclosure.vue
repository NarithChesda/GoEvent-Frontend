<template>
  <Transition name="tpl-collapse">
    <div v-if="open" class="grid grid-rows-[1fr]">
      <!-- The scrolling box. `min-h-0` is what lets the 1fr row actually
           collapse to 0fr: without it the row floors at its content height and
           the transition plays against a lower bound it never reaches. -->
      <div class="min-h-0 overflow-hidden">
        <div :class="contentClass">
          <slot />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * The editor's expand/collapse, as a component.
 *
 * This four-element nest — `Transition` › `grid-rows-[1fr]` › `min-h-0
 * overflow-hidden` › the spacing box — was written out six times in
 * PartnerTemplateForm, once per switch that reveals its own settings. Every
 * copy was identical apart from whether the inner box used `space-y-3` or
 * `space-y-4`, and reading any one of them meant stepping over three wrappers
 * that carry no meaning of their own to reach the controls that do.
 *
 * The animation is grid-template-rows, never max-height (DESIGN.md §15): a
 * max-height large enough for the tallest panel makes every shorter one sit
 * still for part of its own transition, and these panels vary from one row to
 * nine.
 */
withDefaults(
  defineProps<{
    open: boolean
    /**
     * Padding and spacing for the revealed box. A prop rather than a fixed
     * value because these panels open in two places: loose under a switch that
     * heads its own card, and inset under a row inside a bordered group, where
     * the content has to clear the group's edge itself.
     */
    contentClass?: string
  }>(),
  { contentClass: 'space-y-3 pt-1' },
)
</script>

<style scoped>
/*
  Named `tpl-collapse` rather than `collapse`: Vue mangles transition class
  names per component only for `@keyframes`, not for the `v-enter-active`
  family, so a second component defining `.collapse-enter-active` in the same
  modal would be competing for the same name.
*/
.tpl-collapse-enter-active,
.tpl-collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.tpl-collapse-enter-from,
.tpl-collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .tpl-collapse-enter-active,
  .tpl-collapse-leave-active {
    transition: none;
  }
}
</style>
