<template>
  <div>
    <!-- Trigger: styled like a standard form input -->
    <button
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      @click="openPicker"
      :aria-label="title || placeholder"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      class="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm border rounded-lg text-left focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed"
      :class="[
        error
          ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
          : 'border-slate-300 focus:ring-sky-200 focus:border-sky-400',
        disabled ? '' : 'bg-white',
      ]"
    >
      <span
        v-if="selectedOption?.color"
        class="w-3 h-3 rounded-full flex-shrink-0"
        :style="{ backgroundColor: selectedOption.color }"
        aria-hidden="true"
      />
      <span class="flex-1 min-w-0 truncate" :class="selectedOption ? 'text-slate-900' : 'text-slate-400'">
        {{ selectedOption?.label || placeholder }}
      </span>
      <ChevronDown
        class="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''"
        aria-hidden="true"
      />
    </button>

    <Teleport to="body">
      <!-- Backdrop: dimmed sheet backdrop on mobile, transparent click-away on desktop -->
      <Transition name="sf-fade">
        <div
          v-if="isOpen"
          class="fixed inset-0 z-[1000]"
          :class="isMobile ? 'bg-black/40 backdrop-blur-sm' : ''"
          @click="closePicker"
        />
      </Transition>

      <!-- Options panel: bottom sheet (mobile) / anchored popover (desktop) -->
      <Transition :name="isMobile ? 'sf-sheet' : 'sf-pop'">
        <div
          v-if="isOpen"
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          :aria-label="title || placeholder"
          class="fixed z-[1001] bg-white"
          :class="isMobile
            ? 'inset-x-0 bottom-0 rounded-t-3xl shadow-2xl pb-[max(env(safe-area-inset-bottom),0.75rem)]'
            : 'rounded-xl border border-slate-200 shadow-xl overflow-hidden'"
          :style="isMobile ? undefined : panelStyle"
          @click.stop
        >
          <!-- Sheet chrome (mobile only) -->
          <div v-if="isMobile" class="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-3" aria-hidden="true" />
          <h3
            v-if="isMobile && title"
            class="px-5 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >
            {{ title }}
          </h3>

          <!-- Search: opt-in, for lists long enough that scanning them is work -->
          <div v-if="searchable" class="px-3 pt-3 pb-2 border-b border-slate-100">
            <div class="relative">
              <Search
                class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref="searchRef"
                v-model="query"
                type="text"
                :placeholder="searchPlaceholder"
                class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                @click.stop
              />
            </div>
          </div>

          <div
            class="overflow-y-auto overscroll-contain"
            :class="isMobile ? 'py-1 max-h-[60vh]' : 'py-1 max-h-[20rem]'"
          >
            <p
              v-if="searchable && displayOptions.length === 0"
              class="px-4 py-6 text-sm text-slate-500 text-center"
            >
              {{ noResultsText }}
            </p>
            <button
              v-for="option in displayOptions"
              :key="String(option.value)"
              type="button"
              :aria-pressed="isSelected(option)"
              @click="selectOption(option)"
              class="option-row w-full flex items-center gap-3 transition-colors active:bg-slate-100"
              :class="isMobile ? 'px-5 py-3' : 'px-4 py-2.5'"
            >
              <span
                v-if="option.color"
                class="w-3 h-3 rounded-full flex-shrink-0"
                :style="{ backgroundColor: option.color }"
                aria-hidden="true"
              />
              <span class="flex-1 min-w-0 text-left">
                <span
                  class="block text-sm truncate"
                  :class="isSelected(option) ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'"
                >
                  {{ option.label }}
                </span>
                <span v-if="option.description" class="block text-xs text-slate-500 truncate">
                  {{ option.description }}
                </span>
              </span>
              <Check v-if="isSelected(option)" class="w-5 h-5 text-[#2ecc71] flex-shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { ChevronDown, Check, Search } from 'lucide-vue-next'

export interface SelectFieldOption {
  value: string | number
  label: string
  /** Optional leading color dot (e.g. category color) */
  color?: string
  /** Optional secondary line under the label (e.g. a city) */
  description?: string
  /** Extra text matched by search but not displayed (e.g. a romanized name) */
  keywords?: string
}

interface Props {
  modelValue: string | number | null
  options: SelectFieldOption[]
  placeholder: string
  /** Field name used for the dialog/sheet heading */
  title?: string
  /** Prepend a "none" option (emits '') labeled with the placeholder */
  allowEmpty?: boolean
  /** Render error styling on the trigger */
  error?: boolean
  disabled?: boolean
  /** Show a filter box above the options — for lists too long to scan */
  searchable?: boolean
  searchPlaceholder?: string
  noResultsText?: string
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const triggerRef = ref<HTMLButtonElement>()
const panelRef = ref<HTMLElement>()
const searchRef = ref<HTMLInputElement>()
const isOpen = ref(false)
const isMobile = ref(false)
const panelStyle = ref<Record<string, string>>({})
const query = ref('')

// Loose equality on purpose: form values may arrive as "3" while options carry 3
const sameValue = (a: string | number | null, b: string | number) => String(a ?? '') === String(b)

const matchesQuery = (option: SelectFieldOption, needle: string) =>
  `${option.label} ${option.description ?? ''} ${option.keywords ?? ''}`
    .toLowerCase()
    .includes(needle)

const displayOptions = computed<SelectFieldOption[]>(() => {
  const needle = props.searchable ? query.value.trim().toLowerCase() : ''
  const matched = needle
    ? props.options.filter((option) => matchesQuery(option, needle))
    : props.options
  // The "none" row is an action, not a result — never filter it away.
  return props.allowEmpty ? [{ value: '', label: props.placeholder }, ...matched] : matched
})

const selectedOption = computed(() => {
  if (props.modelValue === null || props.modelValue === '') return null
  return props.options.find((option) => sameValue(props.modelValue, option.value)) ?? null
})

const isSelected = (option: SelectFieldOption) =>
  option.value === '' ? !selectedOption.value : sameValue(props.modelValue, option.value)

// Filtering resizes the panel, so a popover anchored above the trigger would
// drift off its anchor (or off-screen) as results narrow.
watch(query, () => {
  if (isOpen.value && !isMobile.value) positionPanel()
})

const selectOption = (option: SelectFieldOption) => {
  emit('update:modelValue', option.value)
  closePicker()
}

// Capture-phase Escape so a parent drawer's own Escape handler doesn't also fire
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.stopPropagation()
    closePicker()
  }
}

const positionPanel = async () => {
  await nextTick()
  const trigger = triggerRef.value
  const panel = panelRef.value
  if (!trigger || !panel) return
  const rect = trigger.getBoundingClientRect()
  const width = Math.max(rect.width, 200)
  panel.style.width = `${width}px`
  const panelHeight = panel.offsetHeight
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
  let top = rect.bottom + 8
  let flipped = false
  if (top + panelHeight > window.innerHeight - 8) {
    top = Math.max(8, rect.top - panelHeight - 8)
    flipped = true
  }
  // Scale from the edge nearest the trigger (see DateTimePickerField).
  panelStyle.value = {
    width: `${width}px`,
    top: `${top}px`,
    left: `${left}px`,
    transformOrigin: flipped ? 'bottom left' : 'top left',
  }
}

const openPicker = async () => {
  if (props.disabled) return
  isMobile.value = window.matchMedia('(max-width: 639px)').matches
  query.value = ''
  isOpen.value = true
  document.addEventListener('keydown', handleKeydown, true)
  if (!isMobile.value) {
    await positionPanel()
    // Desktop only: autofocusing on mobile throws up the keyboard over the sheet.
    if (props.searchable) searchRef.value?.focus()
  }
}

const closePicker = () => {
  isOpen.value = false
  document.removeEventListener('keydown', handleKeydown, true)
}

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown, true)
})
</script>

<style scoped>
@media (hover: hover) and (pointer: fine) {
  .option-row:hover {
    background-color: rgb(248 250 252); /* slate-50 */
  }
}

.sf-fade-enter-active,
.sf-fade-leave-active {
  transition: opacity 0.25s ease-out;
}

.sf-fade-enter-from,
.sf-fade-leave-to {
  opacity: 0;
}

/* Mobile bottom sheet */
.sf-sheet-enter-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.sf-sheet-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.sf-sheet-enter-from,
.sf-sheet-leave-to {
  transform: translateY(100%);
}

/* Desktop popover */
.sf-pop-enter-active {
  transition:
    opacity 0.18s ease-out,
    transform 0.18s cubic-bezier(0.23, 1, 0.32, 1);
}

.sf-pop-leave-active {
  transition:
    opacity 0.13s ease-out,
    transform 0.13s ease-out;
}

.sf-pop-enter-from,
.sf-pop-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .sf-sheet-enter-active,
  .sf-sheet-leave-active,
  .sf-pop-enter-active,
  .sf-pop-leave-active,
  .sf-fade-enter-active,
  .sf-fade-leave-active {
    transition-duration: 0.01s;
  }
}
</style>
