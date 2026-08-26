<template>
  <div ref="rootRef" class="relative">
    <label v-if="label" :for="fieldId" :class="[FIELD_LABEL, 'mb-1']">{{ label }}</label>
    <div class="flex items-stretch gap-1">
      <!-- Colors accept any name (extras still count toward the positional
           fallbacks), so that variant stays a real text input. Font types are a
           closed backend enum, so that one is a picker with no free text. -->
      <input
        v-if="allowCustom"
        :id="fieldId"
        :value="modelValue"
        type="text"
        :maxlength="maxlength"
        :placeholder="placeholder"
        :class="[FIELD, 'flex-1 min-w-0']"
        @input="onInput"
        @focus="open = true"
        @keydown.esc="open = false"
      />
      <button
        v-else
        :id="fieldId"
        type="button"
        :class="[FIELD, 'flex-1 min-w-0 flex items-center text-left hover:bg-slate-200/70']"
        @click="open = !open"
      >
        <span class="truncate">{{ selectedLabel }}</span>
      </button>

      <button
        type="button"
        class="flex-shrink-0 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        :aria-expanded="open"
        :aria-label="t('management.templateSlots.field.toggle')"
        @click="open = !open"
      >
        <ChevronDown class="w-4 h-4 transition-transform" :class="{ 'rotate-180': open }" />
      </button>
    </div>

    <!-- Expands in flow rather than floating. An absolutely-positioned menu
         would be clipped here: this sits inside the form's own
         `overflow-y-auto` column, itself inside a slide-over inside a modal.
         Pushing the rows below it down costs nothing in a form that already
         scrolls, and sidesteps the clipping and z-index stacking entirely. -->
    <Transition name="collapse">
      <div v-if="open" class="grid grid-rows-[1fr]">
        <div class="min-h-0 overflow-hidden">
          <ul class="mt-1.5 bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
            <li v-for="option in filteredOptions" :key="option.value">
              <button
                type="button"
                class="w-full text-left px-3 py-2 hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-inset"
                @click="choose(option)"
              >
                <span class="flex items-center gap-2">
                  <code class="text-xs font-semibold text-slate-800">{{ option.value }}</code>

                  <span
                    v-if="isUsed(option)"
                    class="text-[0.625rem] font-semibold px-1.5 py-0.5 rounded border uppercase bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    {{ t('management.templateSlots.field.alreadySet') }}
                  </span>
                  <span
                    v-else-if="option.unused"
                    class="text-[0.625rem] font-semibold px-1.5 py-0.5 rounded border uppercase bg-amber-50 text-amber-600 border-amber-200"
                  >
                    {{ t('management.templateSlots.field.notRendered') }}
                  </span>

                  <Check v-if="isSelected(option)" class="w-3.5 h-3.5 text-sky-500 ml-auto flex-shrink-0" />
                </span>

                <span class="block text-xs text-slate-500 mt-0.5">{{ t(`${option.i18nBase}.description`) }}</span>
                <span v-if="hasFallback(option)" class="block text-[0.6875rem] text-slate-400 mt-0.5">
                  {{ t('management.templateSlots.field.fallbackPrefix') }} {{ t(`${option.i18nBase}.fallback`) }}
                </span>
              </button>
            </li>

            <!-- Free-typed name that matches no slot. Worth saying plainly:
                 it isn't an error, it just won't be looked up by name. -->
            <li v-if="allowCustom && filteredOptions.length === 0" class="px-3 py-2.5">
              <p class="text-xs text-slate-500">{{ t('management.templateSlots.field.customHint') }}</p>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, ChevronDown } from 'lucide-vue-next'
import type { TemplateSlotOption } from './templateSlots'
import { FIELD, FIELD_LABEL } from './templateUi'

interface Props {
  modelValue: string
  options: TemplateSlotOption[]
  /** Colors: any name is allowed. Font types: closed enum, picker only. */
  allowCustom?: boolean
  /** Slot values already defined on this template, to mark as taken. */
  usedValues?: string[]
  placeholder?: string
  maxlength?: number
  /** Visible label, rendered above the field and associated with it. */
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  allowCustom: false,
  usedValues: () => [],
  placeholder: '',
  maxlength: 50,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t, te } = useI18n()

const fieldId = useId()
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const normalized = (value: string) => value.trim().toLowerCase()

const selectedLabel = computed(() => {
  const match = props.options.find((option) => option.value === normalized(props.modelValue))
  return match ? t(`${match.i18nBase}.label`) : props.modelValue || props.placeholder
})

// Typing narrows the list; an exact match doesn't collapse it to one row, so the
// neighbouring slots stay readable while deciding.
const filteredOptions = computed(() => {
  if (!props.allowCustom) return props.options
  const query = normalized(props.modelValue)
  if (!query) return props.options
  return props.options.filter(
    (option) =>
      option.value.includes(query) || normalized(t(`${option.i18nBase}.label`)).includes(query),
  )
})

const isSelected = (option: TemplateSlotOption) => option.value === normalized(props.modelValue)

const isUsed = (option: TemplateSlotOption) =>
  !isSelected(option) && props.usedValues.some((value) => normalized(value) === option.value)

// Only some slots document a fallback; `te` avoids rendering a raw missing key.
const hasFallback = (option: TemplateSlotOption) => te(`${option.i18nBase}.fallback`)

function choose(option: TemplateSlotOption): void {
  emit('update:modelValue', option.value)
  open.value = false
}

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

// Click-outside. Bound only while open so there's no idle document listener per
// mounted field (the colors and fonts sections each mount one).
function onDocumentPointerDown(event: PointerEvent): void {
  if (!rootRef.value?.contains(event.target as Node)) open.value = false
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onDocumentPointerDown)
  else document.removeEventListener('pointerdown', onDocumentPointerDown)
})

onUnmounted(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none;
  }
}
</style>
