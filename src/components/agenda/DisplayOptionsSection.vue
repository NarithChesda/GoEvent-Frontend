<template>
  <div class="rounded-xl border border-slate-200 bg-white/70">
    <button
      type="button"
      class="w-full flex items-center justify-between px-4 py-3"
      @click="$emit('update:display-open', !displayOpen)"
      :aria-expanded="displayOpen ? 'true' : 'false'"
      aria-controls="display-section"
    >
      <div class="flex items-center gap-2">
        <Palette class="w-3.5 h-3.5 mr-1.5" />
        <span class="text-sm font-medium text-slate-700">Display Options</span>
      </div>
      <svg
        class="h-4 w-4 text-slate-500 transition-transform"
        :class="displayOpen ? 'rotate-180' : ''"
        viewBox="0 0 24 24"
        stroke="currentColor"
        fill="none"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
    <Transition name="collapse">
      <div v-show="displayOpen" id="display-section" class="px-4 pb-4 space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <!-- Color -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Theme Color</label>
            <div class="flex items-center gap-3">
              <input
                :value="color"
                @input="$emit('update:color', ($event.target as HTMLInputElement).value)"
                type="color"
                class="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer"
              />
              <input
                :value="color"
                @input="$emit('update:color', ($event.target as HTMLInputElement).value)"
                type="text"
                class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                placeholder="#3498db"
              />
            </div>
          </div>

          <!-- Icon Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Icon</label>
            <button
              type="button"
              @click="$emit('update:show-icon-picker', true)"
              class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200 flex items-center justify-between bg-white/90"
            >
              <div class="flex items-center gap-3">
                <div
                  v-if="selectedIcon"
                  class="w-7 h-7 flex items-center justify-center"
                  v-html="getSanitizedIconSvg(selectedIcon)"
                ></div>
                <Sparkles v-else class="w-5 h-5 text-slate-400" />
                <span class="text-slate-700">{{ selectedIcon?.name || 'Select an icon' }}</span>
              </div>
              <ChevronDown class="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        <!-- Featured Checkbox -->
        <div class="flex items-center gap-3">
          <input
            :checked="isFeatured"
            @change="$emit('update:is-featured', ($event.target as HTMLInputElement).checked)"
            type="checkbox"
            id="is_featured"
            class="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-200"
          />
          <label for="is_featured" class="text-sm font-medium text-slate-700">
            Mark as featured item
          </label>
        </div>

        <!-- Icon Picker Modal -->
        <div v-if="showIconPicker" class="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div class="flex items-center justify-between mb-4">
            <h5 class="font-medium text-slate-900">Select Icon</h5>
            <button
              type="button"
              @click="$emit('update:show-icon-picker', false)"
              class="text-slate-400 hover:text-slate-600"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto">
            <!-- No Icon Option -->
            <button
              type="button"
              @click="$emit('select-icon', null)"
              class="p-3 rounded-lg border-2 transition-all duration-200"
              :class="
                iconId === null
                  ? 'border-sky-500 bg-sky-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              "
            >
              <X class="w-6 h-6 mx-auto text-slate-400" />
              <p class="text-xs mt-1 text-slate-600">None</p>
            </button>

            <!-- Available Icons -->
            <button
              v-for="icon in availableIcons"
              :key="icon.id"
              type="button"
              @click="$emit('select-icon', icon.id)"
              class="p-3 rounded-lg border-2 transition-all duration-200"
              :class="
                iconId === icon.id
                  ? 'border-sky-500 bg-sky-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              "
              :title="icon.name"
            >
              <div class="w-6 h-6 mx-auto" v-html="getSanitizedIconSvg(icon)"></div>
              <p class="text-xs mt-1 text-slate-600 truncate">{{ icon.name }}</p>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { Palette, Sparkles, ChevronDown, X } from 'lucide-vue-next'
import type { AgendaIcon } from '@/services/api'
import { sanitizeSvg } from '@/utils/sanitize'

interface Props {
  color: string
  iconId: number | null
  isFeatured: boolean
  displayOpen: boolean
  showIconPicker: boolean
  availableIcons: AgendaIcon[]
  selectedIcon: AgendaIcon | undefined
}

interface Emits {
  'update:color': [value: string]
  'update:is-featured': [value: boolean]
  'update:display-open': [value: boolean]
  'update:show-icon-picker': [value: boolean]
  'select-icon': [iconId: number | null]
}

defineProps<Props>()
defineEmits<Emits>()

const getSanitizedIconSvg = (icon: AgendaIcon | null | undefined): string => {
  if (!icon || !icon.svg_code) {
    return ''
  }
  return sanitizeSvg(icon.svg_code)
}
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
