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
        <!-- Color -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Theme Color</label>
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
              class="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
              placeholder="#3498db"
            />
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
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { Palette } from 'lucide-vue-next'

interface Props {
  color: string
  isFeatured: boolean
  displayOpen: boolean
}

interface Emits {
  'update:color': [value: string]
  'update:is-featured': [value: boolean]
  'update:display-open': [value: boolean]
}

defineProps<Props>()
defineEmits<Emits>()
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
