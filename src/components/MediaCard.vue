<template>
  <div
    :draggable="canEdit && draggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover.prevent
    @dragenter.prevent
    @drop="handleDrop"
    class="media-card bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 group"
    :class="[
      isDragging ? 'opacity-50 transform rotate-1 scale-105' : '',
      canEdit && draggable ? 'hover:scale-[1.02]' : '',
    ]"
  >
    <!-- Image Container -->
    <div class="relative aspect-square bg-gray-100 overflow-hidden">
      <img
        :src="media.image"
        :alt="media.caption || 'Event media'"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        @error="handleImageError"
      />

      <!-- Featured Badge -->
      <div v-if="media.is_featured" class="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
        <span
          class="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg"
        >
          <Star class="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
          <span class="hidden sm:inline">Featured</span>
        </span>
      </div>

      <!-- Drag Handle (only visible if can edit and draggable) -->
      <div
        v-if="canEdit && draggable"
        class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing p-0.5 sm:p-1 rounded-lg bg-black/50 backdrop-blur-sm"
      >
        <GripVertical class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
      </div>

      <!-- Actions Overlay -->
      <div
        v-if="canEdit"
        class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
      >
        <div class="flex items-center space-x-1.5 sm:space-x-2">
          <!-- Edit Button -->
          <button
            @click="$emit('edit', media)"
            class="p-1.5 sm:p-2 bg-white/90 hover:bg-white text-slate-700 hover:text-[#1e90ff] rounded-lg transition-colors duration-200"
            title="Edit media"
          >
            <Edit2 class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <!-- Featured Toggle Button -->
          <button
            @click="$emit('set-featured', media)"
            class="p-1.5 sm:p-2 bg-white/90 hover:bg-white rounded-lg transition-colors duration-200"
            :class="
              media.is_featured
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-slate-400 hover:text-yellow-500'
            "
            :title="media.is_featured ? 'Remove from featured' : 'Mark as featured'"
          >
            <Star class="w-3.5 h-3.5 sm:w-4 sm:h-4" :class="media.is_featured ? 'fill-current' : ''" />
          </button>

          <!-- Delete Button -->
          <button
            @click="$emit('delete', media)"
            class="p-1.5 sm:p-2 bg-white/90 hover:bg-white text-slate-400 hover:text-red-600 rounded-lg transition-colors duration-200"
            title="Delete media"
          >
            <Trash2 class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      <!-- Loading State for Broken Images -->
      <div v-if="imageError" class="absolute inset-0 bg-gray-100 flex items-center justify-center">
        <div class="text-center">
          <ImageIcon class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-1 sm:mb-2" />
          <p class="text-[10px] sm:text-xs text-gray-500">Failed to load image</p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-3 sm:p-4">
      <!-- Caption and Order -->
      <div class="flex items-start justify-between mb-1.5 sm:mb-2">
        <div class="flex-1 min-w-0">
          <h4 class="text-sm sm:text-base font-medium text-slate-900 truncate">
            {{ media.caption || 'Untitled Media' }}
          </h4>
        </div>
        <span
          class="ml-1.5 sm:ml-2 inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-slate-100 text-slate-700 shrink-0"
        >
          #{{ media.order }}
        </span>
      </div>

      <!-- Upload Date -->
      <div class="flex items-center text-[10px] sm:text-xs text-slate-500">
        <Calendar class="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
        {{ formatDate(media.created_at) }}
      </div>

      <!-- Featured Status (for non-edit mode) -->
      <div v-if="!canEdit && media.is_featured" class="mt-1.5 sm:mt-2">
        <span
          class="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
        >
          <Star class="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
          Featured
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Edit2, Trash2, Star, Calendar, ImageIcon, GripVertical } from 'lucide-vue-next'
import type { EventPhoto } from '../services/api'

interface Props {
  media: EventPhoto
  canEdit: boolean
  draggable?: boolean
}

interface Emits {
  edit: [media: EventPhoto]
  delete: [media: EventPhoto]
  'set-featured': [media: EventPhoto]
  'drag-start': [media: EventPhoto]
  'drag-end': [media: EventPhoto]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const imageError = ref(false)

// Drag state
const isDragging = ref(false)

// Methods
const handleImageError = () => {
  imageError.value = true
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

// Drag handlers
const handleDragStart = (event: DragEvent) => {
  if (!props.canEdit || !props.draggable) return

  isDragging.value = true
  emit('drag-start', props.media)

  // Set drag data
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.media.id.toString())
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  if (!props.canEdit || !props.draggable) return

  const draggedItemId = event.dataTransfer?.getData('text/plain')
  if (draggedItemId && parseInt(draggedItemId) !== props.media.id) {
    emit('drag-end', props.media)
  }

  isDragging.value = false
}

const handleDragEnd = () => {
  // Reset dragging state when drag operation ends
  isDragging.value = false
}
</script>

<style scoped>
.media-card {
  transition: all 0.2s ease;
}

.media-card:hover {
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>
