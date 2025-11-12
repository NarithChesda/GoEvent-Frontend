<template>
  <div
    :class="[
      'relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden transition-all duration-300 border border-white/20',
      canEdit && draggable ? 'cursor-move hover:shadow-xl' : '',
      isDragging ? 'opacity-50 scale-95' : 'hover:shadow-xl hover:-translate-y-1',
    ]"
    :draggable="canEdit && draggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover.prevent
    @drop="handleDrop"
  >
    <!-- Color Bar -->
    <div
      class="h-2"
      :style="{ backgroundColor: dressCode.color || '#3498db' }"
    ></div>

    <!-- Image Section -->
    <div v-if="dressCode.image" class="relative aspect-[4/3] overflow-hidden bg-slate-100">
      <img
        :src="dressCode.image"
        :alt="dressCode.title || dressCode.dress_code_type_display"
        class="w-full h-full object-cover"
      />
      <!-- Overlay with status badge -->
      <div v-if="!dressCode.is_active" class="absolute inset-0 bg-black/50 flex items-center justify-center">
        <span class="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          Inactive
        </span>
      </div>
    </div>

    <!-- Content Section -->
    <div class="p-4">
      <!-- Header with badges -->
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1">
          <h3 class="font-semibold text-slate-900 text-lg leading-tight">
            {{ dressCode.title || dressCode.dress_code_type_display }}
          </h3>
          <div class="flex flex-wrap gap-2 mt-2">
            <span class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
              <Clock class="w-3 h-3" />
              {{ dressCode.time_period_display }}
            </span>
            <span class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
              <Users class="w-3 h-3" />
              {{ dressCode.gender_display }}
            </span>
          </div>
        </div>
      </div>

      <!-- Description -->
      <p v-if="dressCode.description" class="text-sm text-slate-600 mt-2 line-clamp-3">
        {{ dressCode.description }}
      </p>

      <!-- No image placeholder -->
      <div v-if="!dressCode.image" class="mt-3 flex items-center justify-center bg-slate-50 rounded-xl p-4">
        <div class="text-center">
          <ImageIcon class="w-8 h-8 text-slate-300 mx-auto mb-1" />
          <p class="text-xs text-slate-400">No reference image</p>
        </div>
      </div>

      <!-- Actions (only visible on hover and when canEdit is true) -->
      <div
        v-if="canEdit"
        class="flex gap-2 mt-4 pt-3 border-t border-slate-200"
      >
        <button
          @click="$emit('edit', dressCode)"
          class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors duration-200 text-sm font-medium"
        >
          <Edit class="w-4 h-4" />
          Edit
        </button>
        <button
          @click="$emit('delete', dressCode)"
          class="flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors duration-200"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>

      <!-- Drag handle indicator -->
      <div
        v-if="canEdit && draggable"
        class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-sm"
      >
        <GripVertical class="w-4 h-4 text-slate-400" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Clock, Users, Edit, Trash2, ImageIcon, GripVertical } from 'lucide-vue-next'
import type { EventDressCode } from '../services/api'

interface Props {
  dressCode: EventDressCode
  canEdit: boolean
  draggable?: boolean
}

interface Emits {
  'edit': [dressCode: EventDressCode]
  'delete': [dressCode: EventDressCode]
  'drag-start': [dressCode: EventDressCode]
  'drag-end': [dressCode: EventDressCode | null]
}

const props = withDefaults(defineProps<Props>(), {
  draggable: true,
})

const emit = defineEmits<Emits>()

const isDragging = ref(false)

const handleDragStart = (event: DragEvent) => {
  if (!props.canEdit || !props.draggable) return
  isDragging.value = true
  emit('drag-start', props.dressCode)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.dressCode.id.toString())
  }
}

const handleDragEnd = () => {
  isDragging.value = false
  emit('drag-end', null)
}

const handleDrop = (event: DragEvent) => {
  if (!props.canEdit || !props.draggable) return
  event.preventDefault()
  emit('drag-end', props.dressCode)
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
