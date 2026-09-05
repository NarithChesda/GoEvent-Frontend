<template>
  <div ref="rootRef" class="dtr">
    <button
      type="button"
      class="list-row"
      :aria-expanded="expanded"
      :aria-controls="panelId"
      @click="toggle"
    >
      <span class="list-row__label">{{ label }}</span>
      <span class="flex items-center gap-1.5 min-w-0">
        <span class="list-row__value truncate tabular-nums" :class="valueClass">
          {{ display || placeholder || t('common.dateTimePicker.placeholder') }}
        </span>
        <ChevronDown
          class="w-4 h-4 flex-shrink-0 transition-transform duration-200 ease-out"
          :class="expanded ? 'rotate-180 text-sky-500' : 'text-slate-400'"
          aria-hidden="true"
        />
      </span>
    </button>

    <Transition name="drawer-reveal" @after-enter="revealIntoView">
      <div v-if="expanded" class="grid grid-rows-[1fr]">
        <div class="min-h-0 overflow-hidden">
          <div :id="panelId" class="px-3 pb-3">
            <DateTimeCalendar
              :model-value="modelValue"
              :min="min"
              :max="max"
              :quick-times="quickTimes"
              @update:model-value="$emit('update:modelValue', $event)"
            />
            <div v-if="clearable && modelValue" class="flex justify-end pt-2">
              <button
                type="button"
                class="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-[background-color,transform] duration-150 ease-out active:scale-95"
                @click="$emit('update:modelValue', '')"
              >
                {{ t('common.dateTimePicker.clear') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import DateTimeCalendar from './DateTimeCalendar.vue'
import { formatDateTimeDisplay } from './dateTimeValue'

/**
 * A grouped-list row that discloses its own calendar in place.
 *
 * The alternative — and what this replaces inside the create drawer — is a
 * bottom sheet at `z-1001` opened from a drawer at `z-999`: a modal over a
 * modal, with its own scrim, its own dismissal and its own drag handle, for a
 * field the user is already looking at. Expanding in place keeps one surface,
 * one scroll container and one Escape target, and the value stays visible next
 * to its label the whole time it is being changed.
 *
 * Commits live, because there is nothing to cancel back to: the row *is* the
 * value. `expanded` is a v-model so a parent can keep sibling rows mutually
 * exclusive — two open calendars in one group is two answers to one question.
 */

interface Props {
  label: string
  /** `YYYY-MM-DDTHH:mm`, or empty when `clearable`. */
  modelValue: string
  expanded: boolean
  min?: string
  max?: string
  clearable?: boolean
  placeholder?: string
  error?: boolean
  /** Hour-of-day (0-23) one-tap presets. */
  quickTimes?: number[]
}

const props = withDefaults(defineProps<Props>(), { quickTimes: () => [] })

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:expanded', value: boolean): void
}>()

const { t, locale } = useAppLanguage()

const rootRef = ref<HTMLElement>()
const panelId = `dtr-${useId()}`

const display = computed(() =>
  formatDateTimeDisplay(props.modelValue, locale.value === 'kh' ? 'km-KH' : 'en-US'),
)

const valueClass = computed(() => {
  if (props.error) return 'text-red-600 font-medium'
  if (props.expanded) return 'text-sky-600 font-medium'
  return display.value ? 'text-slate-500' : 'text-slate-400'
})

const toggle = () => emit('update:expanded', !props.expanded)

/**
 * Run on `after-enter`, not on click: the reveal animates
 * `grid-template-rows` for 350ms, so a scroll measured before that finishes
 * is measuring the collapsed row and leaves the calendar under the fold.
 */
const revealIntoView = () => {
  rootRef.value?.scrollIntoView({
    block: 'nearest',
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}
</script>

<!-- Row anatomy is shared with the drawer's switch and field rows, so a group
     can stack all three under one border without them disagreeing. -->
<style scoped src="./groupedList.css"></style>
