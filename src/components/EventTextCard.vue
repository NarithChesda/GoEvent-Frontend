<template>
  <div
    class="event-text-card bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
  >
    <div class="flex items-start justify-between">
      <!-- Text Content -->
      <div class="flex-1 pr-4">
        <!-- Header with Language and Status -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-3">
            <!-- Language Badge -->
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {{ getLanguageName(text.language) }}
            </span>

            <!-- Status Badge -->
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                text.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600',
              ]"
            >
              {{ text.is_active ? 'Active' : 'Inactive' }}
            </span>

            <!-- Order Badge -->
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
            >
              Order: {{ text.order }}
            </span>
          </div>
        </div>

        <!-- Title -->
        <div v-if="text.title" class="mb-2">
          <h4 class="font-semibold text-slate-900 text-base leading-tight">
            {{ text.title }}
          </h4>
        </div>

        <!-- Content Preview -->
        <div class="mb-3">
          <p class="text-slate-700 text-sm leading-relaxed">
            {{ getContentPreview(text.content) }}
            <button
              v-if="text.content.length > 150"
              @click="showFullContent = !showFullContent"
              class="text-blue-600 hover:text-blue-700 font-medium ml-1"
            >
              {{ showFullContent ? 'Show less' : 'Show more' }}
            </button>
          </p>
        </div>

        <!-- Full Content (when expanded) -->
        <div v-if="showFullContent && text.content.length > 150" class="mb-3">
          <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p class="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {{ text.content }}
            </p>
          </div>
        </div>

        <!-- Metadata -->
        <div class="flex items-center justify-between text-xs text-slate-500">
          <div class="flex items-center space-x-4">
            <!-- Character Count -->
            <span class="flex items-center">
              <FileText class="w-3 h-3 mr-1" />
              {{ text.content.length }} characters
            </span>

            <!-- Created Date -->
            <span v-if="text.created_at" class="flex items-center">
              <Calendar class="w-3 h-3 mr-1" />
              {{ formatDate(text.created_at) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center space-x-2">
        <button
          @click="$emit('edit', text)"
          class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          title="Edit text"
        >
          <Edit2 class="w-4 h-4" />
        </button>

        <button
          @click="$emit('delete', text.id)"
          class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          title="Delete text"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Edit2, Trash2, FileText, Calendar } from 'lucide-vue-next'
import type { EventText } from '../services/api'

interface Props {
  text: EventText
}

interface Emits {
  edit: [text: EventText]
  delete: [textId: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const showFullContent = ref(false)

// Available languages mapping
const languageNames: Record<string, string> = {
  en: 'English',
  kh: 'Khmer',
  fr: 'French',
  ja: 'Japanese',
  ko: 'Korean',
  'zh-cn': 'Chinese (Simplified)',
  th: 'Thai',
  vn: 'Vietnamese',
}

// Methods
const getLanguageName = (code: string): string => {
  return languageNames[code] || code.toUpperCase()
}

const getContentPreview = (content: string): string => {
  if (showFullContent.value || content.length <= 150) {
    return content
  }
  return content.substring(0, 150) + '...'
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}
</script>

<style scoped>
/* Add any additional scoped styles if needed */
</style>
