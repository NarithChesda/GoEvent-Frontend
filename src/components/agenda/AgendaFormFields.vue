<template>
  <div class="space-y-4">
    <!-- Title -->
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-2">
        Title <span v-if="!languageName" class="text-red-500">*</span>
      </label>
      <input
        :value="title"
        @input="$emit('update:title', ($event.target as HTMLInputElement).value)"
        type="text"
        :required="!languageName"
        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
        :placeholder="languageName ? `Enter title in ${languageName}` : 'Enter agenda item title'"
      />
      <p v-if="fieldErrors?.title" class="mt-1 text-xs text-red-600">
        {{ fieldErrors.title }}
      </p>
    </div>

    <!-- Start Time and End Time -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          Start Time
        </label>
        <input
          :value="startTimeText"
          @input="$emit('update:start-time-text', ($event.target as HTMLInputElement).value)"
          type="text"
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
          :placeholder="languageName ? `Start time in ${languageName}` : 'e.g., 9:00 AM'"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          End Time
        </label>
        <input
          :value="endTimeText"
          @input="$emit('update:end-time-text', ($event.target as HTMLInputElement).value)"
          type="text"
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
          :placeholder="languageName ? `End time in ${languageName}` : 'e.g., 10:00 AM'"
        />
      </div>
    </div>

    <!-- Description (collapsible) -->
    <div class="rounded-xl border border-slate-200 bg-white/70">
      <button
        type="button"
        class="w-full flex items-center justify-between px-4 py-3"
        @click="$emit('update:description-open', !descriptionOpen)"
        :aria-expanded="descriptionOpen ? 'true' : 'false'"
        :aria-controls="descriptionSectionId"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-700">Description</span>
          <span class="hidden sm:inline text-xs text-slate-500">{{ descriptionSummary }}</span>
        </div>
        <svg
          class="h-4 w-4 text-slate-500 transition-transform"
          :class="descriptionOpen ? 'rotate-180' : ''"
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
        <div v-show="descriptionOpen" :id="descriptionSectionId" class="px-4 pb-4">
          <textarea
            :value="description"
            @input="$emit('update:description', ($event.target as HTMLTextAreaElement).value)"
            rows="3"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
            :placeholder="languageName ? `Description in ${languageName}` : 'Describe this agenda item'"
          ></textarea>
        </div>
      </Transition>
    </div>

    <!-- Speaker (collapsible) -->
    <div class="rounded-xl border border-slate-200 bg-white/70">
      <button
        type="button"
        class="w-full flex items-center justify-between px-4 py-3"
        @click="$emit('update:speaker-open', !speakerOpen)"
        :aria-expanded="speakerOpen ? 'true' : 'false'"
        :aria-controls="speakerSectionId"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-700">Speaker(s)</span>
          <span class="hidden sm:inline text-xs text-slate-500">{{ speakerSummary }}</span>
        </div>
        <svg
          class="h-4 w-4 text-slate-500 transition-transform"
          :class="speakerOpen ? 'rotate-180' : ''"
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
        <div v-show="speakerOpen" :id="speakerSectionId" class="px-4 pb-4">
          <input
            :value="speaker"
            @input="$emit('update:speaker', ($event.target as HTMLInputElement).value)"
            type="text"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
            :placeholder="languageName ? `Speaker name(s) in ${languageName}` : 'e.g., Dr. Jane Smith, CEO of TechCorp'"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  startTimeText: string
  endTimeText: string
  description: string
  speaker: string
  descriptionOpen: boolean
  speakerOpen: boolean
  languageName?: string
  fieldErrors?: Record<string, string>
}

interface Emits {
  'update:title': [value: string]
  'update:start-time-text': [value: string]
  'update:end-time-text': [value: string]
  'update:description': [value: string]
  'update:speaker': [value: string]
  'update:description-open': [value: boolean]
  'update:speaker-open': [value: boolean]
}

const props = defineProps<Props>()
defineEmits<Emits>()

const descriptionSectionId = computed(() =>
  props.languageName ? `description-section-${props.languageName}` : 'description-section',
)

const speakerSectionId = computed(() =>
  props.languageName ? `speaker-section-${props.languageName}` : 'speaker-section',
)

const descriptionSummary = computed(() => {
  const text = (props.description || '').trim()
  if (!text) return 'No description'
  return text.length > 60 ? text.slice(0, 60) + '...' : text
})

const speakerSummary = computed(() => {
  const text = (props.speaker || '').trim()
  if (!text) return 'No speaker'
  return text.length > 60 ? text.slice(0, 60) + '...' : text
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
