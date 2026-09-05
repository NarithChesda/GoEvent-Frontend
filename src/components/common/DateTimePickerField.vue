<template>
  <div>
    <!-- Trigger: styled like a standard form input -->
    <button
      ref="triggerRef"
      type="button"
      :aria-label="title || t('common.dateTimePicker.placeholder')"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      class="picker-trigger w-full flex items-center gap-2 px-3.5 py-2.5 text-base sm:text-sm border rounded-lg bg-white text-left focus:outline-none focus:ring-2"
      :class="
        error
          ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
          : 'border-slate-300 focus:ring-sky-200 focus:border-sky-400'
      "
      @click="openPicker"
    >
      <Calendar class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
      <span
        class="flex-1 min-w-0 truncate"
        :class="displayValue ? 'text-slate-900' : 'text-slate-400'"
      >
        {{ displayValue || placeholder || t('common.dateTimePicker.placeholder') }}
      </span>
      <ChevronDown
        class="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ease-out"
        :class="isOpen ? 'rotate-180' : ''"
        aria-hidden="true"
      />
    </button>

    <Teleport to="body">
      <!-- Backdrop: dimmed sheet backdrop on mobile, transparent click-away on desktop -->
      <Transition name="picker-fade">
        <div
          v-if="isOpen"
          ref="backdropRef"
          class="fixed inset-0 z-[1000]"
          :class="isMobile ? 'bg-black/40 backdrop-blur-sm' : ''"
          @click="closePicker"
        />
      </Transition>

      <!-- Picker panel: bottom sheet (mobile) / anchored popover (desktop) -->
      <Transition :name="isMobile ? 'picker-sheet' : 'picker-pop'">
        <div
          v-if="isOpen"
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          :aria-label="title || t('common.dateTimePicker.placeholder')"
          class="fixed z-[1001] bg-white"
          :class="
            isMobile
              ? 'inset-x-0 bottom-0 rounded-t-3xl shadow-2xl pb-[max(env(safe-area-inset-bottom),0.75rem)]'
              : 'w-[20rem] rounded-xl border border-slate-200 shadow-xl'
          "
          :style="isMobile ? undefined : panelStyle"
          @click.stop
        >
          <!-- Sheet chrome (mobile only) — also the drag surface -->
          <div v-if="isMobile" class="picker-sheet-grip pt-3" v-bind="dragHandlers">
            <div class="w-10 h-1 rounded-full bg-slate-300 mx-auto" aria-hidden="true" />
            <h3
              v-if="title"
              class="px-5 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              {{ title }}
            </h3>
          </div>

          <div
            class="px-4 pt-2 pb-3 sm:p-3"
            :class="{ 'max-h-[75vh] overflow-y-auto overscroll-contain': isMobile }"
          >
            <DateTimeCalendar
              v-model="draft"
              :min="min"
              :max="max"
              :quick-times="quickTimes"
            />

            <!-- Footer actions -->
            <div class="flex items-center justify-between gap-2 mt-3">
              <button
                v-if="clearable && modelValue"
                type="button"
                class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-[background-color,transform] duration-150 ease-out active:scale-95"
                @click="clearValue"
              >
                {{ t('common.dateTimePicker.clear') }}
              </button>
              <span v-else />
              <button
                type="button"
                class="px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-[opacity,transform] duration-150 ease-out active:scale-95 shadow-md"
                @click="confirmValue"
              >
                {{ t('common.dateTimePicker.done') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Calendar, ChevronDown } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { usePickerPanel } from '@/composables/usePickerPanel'
import { useSheetDrag } from '@/composables/useSheetDrag'
import DateTimeCalendar from './DateTimeCalendar.vue'
import { formatDateTime, parseDateTime, seedDateTime } from './dateTimeValue'

interface Props {
  /** datetime-local formatted value: YYYY-MM-DDTHH:mm (or empty) */
  modelValue: string
  /** Field name used for the dialog/sheet heading */
  title?: string
  placeholder?: string
  /** Minimum selectable date (datetime-local format, date part enforced) */
  min?: string
  /** Maximum selectable date (datetime-local format, date part enforced) */
  max?: string
  /** Show a Clear action for optional fields */
  clearable?: boolean
  /** Render error styling on the trigger */
  error?: boolean
  /** Hour-of-day (0-23) one-tap presets shown above the time wheel */
  quickTimes?: number[]
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), { quickTimes: () => [] })
const emit = defineEmits<Emits>()

const { t, locale } = useAppLanguage()

const backdropRef = ref<HTMLElement>()

/** Edited in the panel, committed only on Done. */
const draft = ref('')

const {
  triggerRef,
  panelRef,
  isOpen,
  isMobile,
  panelStyle,
  open: openPicker,
  close: closePicker,
} = usePickerPanel({
  // Seed from the committed value every time, so reopening after a cancel
  // starts from what the field actually shows.
  onOpen: () => {
    draft.value = formatDateTime(seedDateTime(props.modelValue, props.min, props.max))
  },
})

const { dragHandlers } = useSheetDrag(panelRef, closePicker, backdropRef)

const intlLocale = computed(() => (locale.value === 'kh' ? 'km-KH' : 'en-US'))

const displayValue = computed(() => {
  const parsed = parseDateTime(props.modelValue)
  if (!parsed) return ''
  return new Intl.DateTimeFormat(intlLocale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(parsed.y, parsed.mo, parsed.d, parsed.h, parsed.mi))
})

const confirmValue = () => {
  emit('update:modelValue', draft.value)
  closePicker()
}

const clearValue = () => {
  emit('update:modelValue', '')
  closePicker()
}
</script>
