<template>
  <!-- `aria-label` is left to fall through onto this root rather than being
       declared as a prop: it is a real attribute here, and a prop of the same
       name would shadow it. -->
  <div
    class="seg"
    :class="iconOnlyOnMobile ? 'seg--icon-mobile' : ''"
    role="radiogroup"
    :style="{ '--seg-n': String(options.length), '--seg-i': String(activeIndex) }"
  >
    <span class="seg-thumb" aria-hidden="true" />
    <button
      v-for="(option, index) in options"
      :key="option.value"
      ref="optionEls"
      type="button"
      role="radio"
      :aria-checked="option.value === modelValue"
      :tabindex="index === activeIndex ? 0 : -1"
      class="seg-btn"
      :class="option.value === modelValue ? 'seg-btn--on' : ''"
      @click="$emit('update:modelValue', option.value)"
      @keydown="onKeydown"
    >
      <component :is="option.icon" v-if="option.icon" class="w-4 h-4" aria-hidden="true" />
      <span class="seg-label truncate">{{ option.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, type Component } from 'vue'

/**
 * A choice between two or three named things, where a switch would hide one of
 * them.
 *
 * Used for event visibility, which was a switch whose *label* flipped with its
 * state — so "off" had no stable meaning and the user could not tell what
 * turning it on would do without doing it. A choice that has two names should
 * show both.
 *
 * The selected segment is a white cap on a slate track, not the brand
 * gradient: a drawer already spends its one gradient on the header and its
 * primary action, and a third would make all three read as decoration
 * (goevent-taste §2).
 */

export interface SegmentedOption {
  value: string
  label: string
  icon?: Component
}

interface Props {
  modelValue: string
  options: SegmentedOption[]
  /**
   * Below `sm`, drop the labels and keep the icons — for a control that has to
   * share a row with a title on a phone and its own row's worth of words will
   * not fit. Every option must carry an `icon` for this to mean anything; the
   * label stays in the accessible name either way, so nothing is lost to a
   * screen reader.
   */
  iconOnlyOnMobile?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const optionEls = ref<HTMLButtonElement[]>([])

const activeIndex = computed(() => {
  const index = props.options.findIndex((option) => option.value === props.modelValue)
  return index < 0 ? 0 : index
})

/** Roving tabindex: the group is one tab stop, arrows move within it. */
const onKeydown = async (event: KeyboardEvent) => {
  const last = props.options.length - 1
  let next = activeIndex.value

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = activeIndex.value === last ? 0 : activeIndex.value + 1
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      next = activeIndex.value === 0 ? last : activeIndex.value - 1
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = last
      break
    default:
      return
  }

  event.preventDefault()
  emit('update:modelValue', props.options[next].value)
  await nextTick()
  optionEls.value[next]?.focus()
}
</script>

<style scoped>
.seg {
  position: relative;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  padding: 0.25rem;
  background-color: rgb(241 245 249); /* slate-100 */
  border-radius: 0.75rem;
}

.seg-thumb {
  position: absolute;
  top: 0.25rem;
  bottom: 0.25rem;
  left: 0.25rem;
  width: calc((100% - 0.5rem) / var(--seg-n));
  border-radius: 0.5rem;
  background-color: #fff;
  box-shadow:
    0 1px 2px rgb(15 23 42 / 0.1),
    0 1px 1px rgb(15 23 42 / 0.04);
  transform: translateX(calc(var(--seg-i) * 100%));
  /* Decelerating, no overshoot — the cap slides and lands (DESIGN.md §7). */
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.seg-btn {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  min-width: 0;
  min-height: 2.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(100 116 139); /* slate-500 */
  transition:
    color 0.2s ease-out,
    opacity 0.12s ease-out;
}

/* Icon-only below `sm`: the label is visually gone but still the button's
   accessible name, so this is `sr-only`, not `display: none`. The icon then
   sits alone in the padding it already had, which is what makes the cap
   square-ish rather than a wide pill with a glyph adrift in it. */
@media (max-width: 639.98px) {
  .seg--icon-mobile .seg-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .seg--icon-mobile .seg-btn {
    gap: 0;
  }
}

.seg-btn:hover {
  color: rgb(51 65 85); /* slate-700 */
}

.seg-btn:active {
  opacity: 0.7;
}

.seg-btn--on {
  color: rgb(15 23 42); /* slate-900 */
  font-weight: 600;
}

.seg-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgb(186 230 253); /* sky-200 */
}

@media (prefers-reduced-motion: reduce) {
  .seg-thumb {
    transition: none;
  }
}
</style>
