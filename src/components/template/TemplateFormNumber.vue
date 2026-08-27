<template>
  <div class="space-y-1">
    <div class="flex items-center justify-between gap-2">
      <label :for="fieldId" :class="[FIELD_LABEL, 'truncate']">{{ label }}</label>
      <div class="flex items-center gap-1 flex-shrink-0">
        <input
          :id="fieldId"
          type="number"
          :value="modelValue"
          :step="step"
          :class="FIELD_NUM"
          @input="onNumberInput"
        />
        <span v-if="unit" class="w-6 text-[0.625rem] font-medium text-slate-400">{{ unit }}</span>
      </div>
    </div>
    <!-- The slider is the point of this control: every value here feeds the live
         preview on the next debounce tick, so dragging reads as direct
         manipulation of the phone beside it. The number input stays for exact
         entry (and for values a saved template set outside the slider's range,
         which the slider pins to an end without rewriting). -->
    <input
      type="range"
      :value="clamped"
      :min="min"
      :max="max"
      :step="step"
      :aria-label="label"
      class="tpl-range"
      :style="{ '--tpl-range-fill': `${fillPercent}%` }"
      @input="onRangeInput"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { FIELD_LABEL, FIELD_NUM } from './templateUi'

const props = withDefaults(
  defineProps<{
    modelValue: number
    label: string
    min: number
    max: number
    step?: number
    /** Short suffix rendered beside the number box (%, vh, px…). */
    unit?: string
  }>(),
  { step: 1 },
)

const emit = defineEmits<{ 'update:modelValue': [number] }>()

const fieldId = useId()

const clamped = computed(() => Math.min(Math.max(props.modelValue ?? props.min, props.min), props.max))

const fillPercent = computed(() => {
  const span = props.max - props.min
  if (span <= 0) return 0
  return ((clamped.value - props.min) / span) * 100
})

const onRangeInput = (event: Event): void => {
  emit('update:modelValue', Number((event.target as HTMLInputElement).value))
}

const onNumberInput = (event: Event): void => {
  const raw = (event.target as HTMLInputElement).value
  // Emitting NaN while the field is mid-edit (empty, or just "-") would blank
  // the bound value and push a broken frame; leave the last good one instead.
  if (raw === '') return
  const value = Number(raw)
  if (Number.isNaN(value)) return
  emit('update:modelValue', value)
}
</script>

<style scoped>
.tpl-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 1rem;
  background: transparent;
  cursor: pointer;
}

.tpl-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 9999px;
  background:
    linear-gradient(to right, #2ecc71, #1e90ff) 0 / var(--tpl-range-fill, 0%) 100% no-repeat,
    rgb(226 232 240);
}

.tpl-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -5px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid #1e90ff;
  box-shadow: 0 1px 3px rgb(15 23 42 / 0.25);
  transition: transform 0.15s ease;
}

.tpl-range:active::-webkit-slider-thumb {
  transform: scale(1.15);
}

.tpl-range::-moz-range-track {
  height: 4px;
  border-radius: 9999px;
  background: rgb(226 232 240);
}

.tpl-range::-moz-range-progress {
  height: 4px;
  border-radius: 9999px;
  background: linear-gradient(to right, #2ecc71, #1e90ff);
}

.tpl-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid #1e90ff;
  box-shadow: 0 1px 3px rgb(15 23 42 / 0.25);
}

.tpl-range:focus-visible {
  outline: none;
}

.tpl-range:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 4px rgb(186 230 253 / 0.9);
}

.tpl-range:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 4px rgb(186 230 253 / 0.9);
}

@media (prefers-reduced-motion: reduce) {
  .tpl-range::-webkit-slider-thumb {
    transition: none;
  }
}
</style>
