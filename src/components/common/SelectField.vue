<template>
  <div>
    <!-- Trigger: styled like a standard form input -->
    <button
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      @click="openPicker"
      @keydown="onTriggerKeydown"
      :aria-label="title || placeholder"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      class="picker-trigger w-full flex items-center gap-2 px-3.5 py-2.5 text-sm border rounded-lg text-left focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed"
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

      <!-- Options panel: bottom sheet (mobile) / anchored popover (desktop) -->
      <Transition :name="isMobile ? 'picker-sheet' : 'picker-pop'">
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
                @keydown="onListKeydown"
              />
            </div>
          </div>

          <div
            ref="listRef"
            role="listbox"
            :aria-label="title || placeholder"
            :aria-activedescendant="activeId"
            :tabindex="searchable ? -1 : 0"
            class="overflow-y-auto overscroll-contain focus:outline-none"
            :class="isMobile ? 'py-1 max-h-[60vh]' : 'py-1 max-h-[20rem]'"
            @keydown="onListKeydown"
          >
            <p
              v-if="searchable && displayOptions.length === 0"
              class="px-4 py-6 text-sm text-slate-500 text-center"
            >
              {{ noResultsText }}
            </p>
            <button
              v-for="(option, index) in displayOptions"
              :id="`${listId}-opt-${index}`"
              :key="String(option.value)"
              type="button"
              role="option"
              :aria-selected="isSelected(option)"
              :data-active="index === activeIndex"
              tabindex="-1"
              @click="selectOption(option)"
              @mousemove="activeIndex = index"
              class="picker-option"
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
import { ref, computed, watch, nextTick, useId } from 'vue'
import { ChevronDown, Check, Search } from 'lucide-vue-next'
import { usePickerPanel } from '@/composables/usePickerPanel'
import { useSheetDrag } from '@/composables/useSheetDrag'

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

const listId = useId()
const searchRef = ref<HTMLInputElement>()
const listRef = ref<HTMLElement>()
const backdropRef = ref<HTMLElement>()
const query = ref('')
const activeIndex = ref(-1)

const {
  triggerRef,
  panelRef,
  isOpen,
  isMobile,
  panelStyle,
  open,
  close: closePicker,
  reposition,
} = usePickerPanel({
  matchTriggerWidth: 200,
  onOpen: () => {
    query.value = ''
  },
})

const { dragHandlers } = useSheetDrag(panelRef, closePicker, backdropRef)

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

const activeId = computed(() =>
  activeIndex.value >= 0 ? `${listId}-opt-${activeIndex.value}` : undefined,
)

// Filtering resizes the panel, so a popover anchored above the trigger would
// drift off its anchor (or off-screen) as results narrow.
watch(query, () => {
  activeIndex.value = displayOptions.value.length ? 0 : -1
  if (isOpen.value && !isMobile.value) reposition()
})

// Queried by attribute rather than by child index: with `searchable`, an empty
// result set renders a message row that would offset every index by one.
const scrollActiveIntoView = async () => {
  await nextTick()
  const row = listRef.value?.querySelector<HTMLElement>('[data-active="true"]')
  row?.scrollIntoView({ block: 'nearest' })
}

const selectOption = (option: SelectFieldOption) => {
  emit('update:modelValue', option.value)
  closePicker()
}

const moveActive = (delta: number) => {
  const count = displayOptions.value.length
  if (!count) return
  activeIndex.value = (activeIndex.value + delta + count) % count
  scrollActiveIntoView()
}

const onListKeydown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      moveActive(1)
      break
    case 'ArrowUp':
      e.preventDefault()
      moveActive(-1)
      break
    case 'Home':
      e.preventDefault()
      activeIndex.value = 0
      scrollActiveIntoView()
      break
    case 'End':
      e.preventDefault()
      activeIndex.value = displayOptions.value.length - 1
      scrollActiveIntoView()
      break
    case 'Enter':
      if (activeIndex.value >= 0) {
        e.preventDefault()
        selectOption(displayOptions.value[activeIndex.value])
      }
      break
    case 'Tab':
      // Nothing behind the backdrop is reachable, so Tab is a dismissal.
      closePicker()
      break
  }
}

// Arrow keys on a closed select open it, the way a native <select> does.
const onTriggerKeydown = (e: KeyboardEvent) => {
  if (isOpen.value || props.disabled) return
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    openPicker()
  }
}

const openPicker = async () => {
  if (props.disabled) return
  await open()

  // Start on the current value so the list opens where the user left it.
  activeIndex.value = displayOptions.value.findIndex(isSelected)
  await scrollActiveIntoView()

  // Desktop only: autofocusing on mobile throws up the keyboard over the sheet.
  if (isMobile.value) return
  if (props.searchable) searchRef.value?.focus()
  else listRef.value?.focus({ preventScroll: true })
}
</script>
