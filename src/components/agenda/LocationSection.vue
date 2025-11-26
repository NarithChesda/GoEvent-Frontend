<template>
  <div class="rounded-xl border border-slate-200 bg-white/70">
    <button
      type="button"
      class="w-full flex items-center justify-between px-4 py-3"
      @click="$emit('update:location-open', !locationOpen)"
      :aria-expanded="locationOpen ? 'true' : 'false'"
      aria-controls="location-section"
    >
      <div class="flex items-center gap-2">
        <MapPin class="w-3.5 h-3.5 mr-1.5" />
        <span class="text-sm font-medium text-slate-700">Location</span>
        <span class="hidden sm:inline text-xs text-slate-500">{{ locationSummary }}</span>
      </div>
      <svg
        class="h-4 w-4 text-slate-500 transition-transform"
        :class="locationOpen ? 'rotate-180' : ''"
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
      <div v-show="locationOpen" id="location-section" class="px-4 pb-4 space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <!-- Physical Location -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Physical Location</label>
            <input
              :value="location"
              @input="$emit('update:location', ($event.target as HTMLInputElement).value)"
              type="text"
              class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
              placeholder="e.g., Conference Room A"
            />
          </div>

          <!-- Virtual Link -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Virtual Link</label>
            <input
              :value="virtualLink"
              @input="$emit('update:virtual-link', ($event.target as HTMLInputElement).value)"
              type="url"
              :class="[
                'w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white/90',
                urlError
                  ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                  : 'border-slate-300 focus:ring-sky-200 focus:border-sky-400',
              ]"
              placeholder="https://zoom.us/j/..."
            />
            <p v-if="urlError" class="mt-1 text-xs text-red-600">
              {{ urlError }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MapPin } from 'lucide-vue-next'

interface Props {
  location: string
  virtualLink: string
  locationOpen: boolean
  urlError?: string
}

interface Emits {
  'update:location': [value: string]
  'update:virtual-link': [value: string]
  'update:location-open': [value: boolean]
}

const props = defineProps<Props>()
defineEmits<Emits>()

const locationSummary = computed(() => {
  const items = [props.location, props.virtualLink]
  const count = items.filter((v) => v && String(v).trim() !== '').length
  return count > 0 ? `${count} ${count === 1 ? 'location' : 'locations'}` : 'No locations'
})
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
