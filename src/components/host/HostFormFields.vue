<template>
  <div class="space-y-3">
    <!-- Title and Name -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          Title/Position
        </label>
        <input
          :value="title"
          @input="$emit('update:title', ($event.target as HTMLInputElement).value)"
          type="text"
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
          :placeholder="languageName ? `Enter title in ${languageName}` : 'e.g., Chief Technology Officer'"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          Name <span class="text-red-500">*</span>
        </label>
        <input
          :value="name"
          @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
          type="text"
          :required="!languageName"
          :aria-invalid="fieldErrors?.name ? 'true' : 'false'"
          :aria-describedby="fieldErrors?.name ? 'name-error' : undefined"
          :class="[
            'w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2',
            fieldErrors?.name
              ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
              : 'border-slate-300 focus:ring-sky-200 focus:border-sky-400',
            'bg-white/90'
          ]"
          :placeholder="languageName ? `Enter name in ${languageName}` : 'Enter host name'"
        />
        <div v-if="fieldErrors?.name" id="name-error" role="alert" class="mt-1">
          <p v-for="error in fieldErrors.name" :key="error" class="text-xs text-red-600">
            {{ error }}
          </p>
        </div>
      </div>
    </div>

    <!-- Parent Names -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          Parent A Name
        </label>
        <input
          :value="parentAName"
          @input="$emit('update:parent-a-name', ($event.target as HTMLInputElement).value)"
          type="text"
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
          :placeholder="languageName ? `First parent's name in ${languageName}` : 'First parent\\'s name'"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          Parent B Name
        </label>
        <input
          :value="parentBName"
          @input="$emit('update:parent-b-name', ($event.target as HTMLInputElement).value)"
          type="text"
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
          :placeholder="languageName ? `Second parent's name in ${languageName}` : 'Second parent\\'s name'"
        />
      </div>
    </div>

    <!-- Biography (collapsible) -->
    <div class="rounded-xl border border-slate-200 bg-white/70">
      <button
        type="button"
        class="w-full flex items-center justify-between px-4 py-3"
        @click="$emit('update:bio-open', !bioOpen)"
        :aria-expanded="bioOpen ? 'true' : 'false'"
        :aria-controls="languageName ? `bio-section-${languageName}` : 'bio-section'"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-700">Biography</span>
          <span class="hidden sm:inline text-xs text-slate-500">{{ bioSummary }}</span>
        </div>
        <svg
          class="h-4 w-4 text-slate-500 transition-transform"
          :class="bioOpen ? 'rotate-180' : ''"
          viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <Transition name="collapse">
        <div v-show="bioOpen" :id="languageName ? `bio-section-${languageName}` : 'bio-section'" class="px-4 pb-4">
          <textarea
            :value="bio"
            @input="$emit('update:bio', ($event.target as HTMLTextAreaElement).value)"
            rows="4"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
            :placeholder="languageName ? `Enter biography in ${languageName}` : 'Brief biography or description'"
          ></textarea>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  name: string
  parentAName: string
  parentBName: string
  bio: string
  bioOpen: boolean
  languageName?: string
  fieldErrors?: Record<string, string[]>
}

interface Emits {
  'update:title': [value: string]
  'update:name': [value: string]
  'update:parent-a-name': [value: string]
  'update:parent-b-name': [value: string]
  'update:bio': [value: string]
  'update:bio-open': [value: boolean]
}

const props = defineProps<Props>()
defineEmits<Emits>()

const bioSummary = computed(() => {
  const text = (props.bio || '').trim()
  if (!text) return 'No bio'
  return text.length > 60 ? text.slice(0, 60) + '…' : text
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
