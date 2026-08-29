<template>
  <div
    ref="rootRef"
    class="tpl-seg"
    :class="[`tpl-seg--${tone}`, `tpl-seg--${size}`, { 'tpl-seg--fluid': fluid }]"
    role="group"
    :aria-label="ariaLabel"
  >
    <!-- One travelling element, not a background per button: `background-image`
         can't be interpolated, so a gradient applied per-tab would pop between
         states instead of sliding (§5, same reasoning as MobileTabBar). -->
    <span
      v-show="thumb.width > 0"
      aria-hidden="true"
      class="tpl-seg__thumb"
      :style="{ transform: `translateX(${thumb.left}px)`, width: `${thumb.width}px` }"
    />
    <button
      v-for="option in options"
      :key="option.value"
      :ref="(el) => setButtonRef(option.value, el)"
      type="button"
      class="tpl-seg__item"
      :class="{ 'is-active': option.value === modelValue }"
      :aria-pressed="option.value === modelValue"
      :disabled="option.disabled"
      @click="select(option.value)"
    >
      <component :is="option.icon" v-if="option.icon" class="tpl-seg__icon" aria-hidden="true" />
      <span class="truncate">{{ option.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { LucideIcon } from 'lucide-vue-next'

export interface TemplateSegmentedOption {
  value: string
  label: string
  icon?: LucideIcon
  disabled?: boolean
}

/**
 * The modal's one view switcher.
 *
 * Browse/Mine, the editor's Edit/Preview pane toggle and the preview's stage +
 * language pickers were four separate controls with three different active
 * states (brand gradient with a sliding thumb, a `bg-slate-900` fill that
 * snapped, and a gradient fill that snapped). They all answer the same question
 * — which of these views am I looking at — so they now look and move the same.
 *
 * The thumb is measured rather than assumed to be `100% / n`: the stage picker's
 * labels ("Cover", "Event Video", "Main Content") are wildly different widths,
 * and the old equal-split maths only worked because every other call site
 * happened to have two equal segments.
 */
const props = withDefaults(
  defineProps<{
    modelValue: string
    options: TemplateSegmentedOption[]
    ariaLabel?: string
    /** `solid` on white chrome, `glass` over artwork (the preview column). */
    tone?: 'solid' | 'glass'
    size?: 'sm' | 'md'
    /** Stretch to fill the row and share width evenly (mobile tab rows). */
    fluid?: boolean
  }>(),
  { tone: 'solid', size: 'md', fluid: false },
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const rootRef = ref<HTMLElement | null>(null)
const thumb = ref({ left: 0, width: 0 })

/**
 * The buttons, keyed by the option they belong to — deliberately NOT the array
 * that a `ref="..."` inside `v-for` produces.
 *
 * Vue only ever pushes to that array on mount and splices on unmount, so it
 * holds MOUNT order rather than list order (its own docs say the order isn't
 * guaranteed). A list that is merely RE-ORDERED — same keys, nothing mounted or
 * unmounted — leaves it stale, and measuring `array[activeIndex]` then sizes the
 * thumb to whichever button happened to sit at that index when the control first
 * rendered.
 *
 * Not hypothetical: the preview pane's language switcher appears as soon as the
 * template's own fonts name two languages, and re-orders a moment later when the
 * frame reports the event's `available_languages` (PartnerTemplatePreview's
 * `previewLanguages` builds its Set from that list first). The thumb stayed
 * under the previously-active segment — a brand-gradient pill wearing a slate
 * label — while the segment that really was active kept its white text and
 * vanished against the control's near-white ground.
 *
 * Keying by value takes the index out of the middle of it entirely.
 */
const buttonEls = new Map<string, HTMLButtonElement>()

const setButtonRef = (value: string, el: Element | ComponentPublicInstance | null): void => {
  if (el instanceof HTMLButtonElement) buttonEls.set(value, el)
  else buttonEls.delete(value)
}

const measure = (): void => {
  const el = buttonEls.get(props.modelValue)
  if (!el || !rootRef.value) {
    thumb.value = { left: 0, width: 0 }
    return
  }
  thumb.value = { left: el.offsetLeft, width: el.offsetWidth }
}

const select = (value: string): void => {
  if (value === props.modelValue) return
  emit('update:modelValue', value)
}

let observer: ResizeObserver | null = null

onMounted(() => {
  void nextTick(measure)
  if (typeof ResizeObserver !== 'undefined' && rootRef.value) {
    observer = new ResizeObserver(measure)
    observer.observe(rootRef.value)
  }
})

onBeforeUnmount(() => observer?.disconnect())

// Labels are translated, so a language change resizes the segments under the
// thumb; re-measuring on the option list covers that as well as selection.
watch([() => props.modelValue, () => props.options], () => void nextTick(measure), { deep: true })
</script>

<style scoped>
.tpl-seg {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  gap: 0.125rem;
  padding: 0.25rem;
  border-radius: 9999px;
}

.tpl-seg--fluid {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
}

.tpl-seg--solid {
  background: rgb(241 245 249);
}

/* Over artwork, where an opaque slate fill would read as a hole in the image. */
.tpl-seg--glass {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.tpl-seg__thumb {
  position: absolute;
  top: 0.25rem;
  bottom: 0.25rem;
  left: 0;
  border-radius: 9999px;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  box-shadow: 0 4px 6px -1px rgba(46, 204, 113, 0.25);
  /* Named properties, and the same strong ease-out the modal opens with. The
     thumb chases the pointer, so it leads fast and settles. */
  transition:
    transform 0.2s cubic-bezier(0.23, 1, 0.32, 1),
    width 0.2s cubic-bezier(0.23, 1, 0.32, 1);
}

.tpl-seg__item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  min-width: 0;
  border-radius: 9999px;
  font-weight: 600;
  color: rgb(71 85 105);
  white-space: nowrap;
  transition:
    color 0.2s ease-out,
    transform 0.15s ease-out;
}

.tpl-seg--fluid .tpl-seg__item {
  flex: 1 1 0;
}

.tpl-seg--md .tpl-seg__item {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  line-height: 1.25rem;
}

.tpl-seg--sm .tpl-seg__item {
  padding: 0.25rem 0.625rem;
  font-size: 0.6875rem;
  line-height: 1.25rem;
}

.tpl-seg__item:active:not(.is-active) {
  transform: scale(0.97);
}

.tpl-seg__item.is-active {
  color: #fff;
}

.tpl-seg__item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tpl-seg__item:focus-visible {
  outline: 2px solid rgb(14 165 233);
  outline-offset: -2px;
}

.tpl-seg__icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

/* Touch devices fire :hover on tap and leave it stuck (§17). */
@media (hover: hover) and (pointer: fine) {
  .tpl-seg__item:not(.is-active):hover {
    color: rgb(15 23 42);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tpl-seg__thumb,
  .tpl-seg__item {
    transition: none;
  }
}
</style>
