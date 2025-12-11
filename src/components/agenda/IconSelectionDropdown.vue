<template>
  <div class="relative">
    <label class="block text-sm font-medium text-slate-700 mb-1.5">
      <span class="flex items-center gap-1.5">
        <Sparkles class="w-3.5 h-3.5" />
        Icon
      </span>
    </label>

    <!-- Dropdown trigger button -->
    <button
      ref="triggerRef"
      type="button"
      @click="toggleDropdown"
      class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200 flex items-center justify-between bg-white/90"
    >
      <div class="flex items-center gap-3">
        <div
          v-if="selectedIcon"
          class="w-6 h-6 flex items-center justify-center"
          v-html="getSanitizedIconSvg(selectedIcon)"
        ></div>
        <div v-else class="w-6 h-6 flex items-center justify-center">
          <X class="w-5 h-5 text-slate-400" />
        </div>
        <span class="text-slate-700">{{ selectedIcon?.name || 'No icon' }}</span>
      </div>
      <ChevronDown
        class="w-4 h-4 text-slate-400 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
      >
        <div class="max-h-64 overflow-y-auto">
          <!-- No Icon Option -->
          <button
            type="button"
            @click="handleSelectIcon(null)"
            class="w-full px-3 py-2 flex items-center gap-3 transition-colors duration-150"
            :class="
              iconId === null
                ? 'bg-sky-50 text-sky-700'
                : 'hover:bg-slate-50 text-slate-700'
            "
          >
            <div class="w-6 h-6 flex items-center justify-center">
              <X class="w-5 h-5 text-slate-400" />
            </div>
            <span class="text-sm">No icon</span>
            <Check v-if="iconId === null" class="w-4 h-4 ml-auto text-sky-600" />
          </button>

          <!-- Available Icons -->
          <button
            v-for="icon in availableIcons"
            :key="icon.id"
            type="button"
            @click="handleSelectIcon(icon.id)"
            class="w-full px-3 py-2 flex items-center gap-3 transition-colors duration-150"
            :class="
              iconId === icon.id
                ? 'bg-sky-50 text-sky-700'
                : 'hover:bg-slate-50 text-slate-700'
            "
          >
            <div class="w-6 h-6 flex items-center justify-center" v-html="getSanitizedIconSvg(icon)"></div>
            <span class="text-sm">{{ icon.name }}</span>
            <Check v-if="iconId === icon.id" class="w-4 h-4 ml-auto text-sky-600" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Sparkles, ChevronDown, X, Check } from 'lucide-vue-next'
import type { AgendaIcon } from '@/services/api'
import { sanitizeSvg } from '@/utils/sanitize'

interface Props {
  iconId: number | null
  availableIcons: AgendaIcon[]
  selectedIcon: AgendaIcon | undefined
}

interface Emits {
  'select-icon': [iconId: number | null]
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const handleSelectIcon = (iconId: number | null) => {
  emit('select-icon', iconId)
  isOpen.value = false
}

const getSanitizedIconSvg = (icon: AgendaIcon | null | undefined): string => {
  if (!icon || !icon.svg_code) {
    return ''
  }
  return sanitizeSvg(icon.svg_code)
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (
    triggerRef.value &&
    !triggerRef.value.contains(target) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(target)
  ) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Custom scrollbar for dropdown */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
