<template>
  <div
    :draggable="canEdit && draggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover.prevent
    @dragenter.prevent
    @drop="handleDrop"
    class="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200/60"
    :class="[
      item.is_featured ? 'ring-1 ring-blue-200 bg-blue-50/30' : '',
      isDragging ? 'opacity-60 transform rotate-1 scale-105 shadow-xl' : '',
      canEdit && draggable ? 'hover:scale-[1.01] hover:-translate-y-0.5' : '',
    ]"
  >
    <!-- Drag Handle -->
    <div
      v-if="canEdit"
      class="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-white/90 hover:bg-white shadow-sm"
    >
      <GripVertical class="w-3 h-3 text-slate-400" />
    </div>

    <!-- Modern Minimalist Horizontal Layout -->
    <div class="flex items-center gap-4 p-4">
      <!-- Icon Section -->
      <div class="flex-shrink-0">
        <div
          v-if="item.icon"
          class="w-10 h-10 rounded-lg flex items-center justify-center"
          :style="{ backgroundColor: (item.color || '#8B5CF6') + '15' }"
          v-html="item.icon.svg_code"
        ></div>
        <div v-else class="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100">
          <Clock class="w-5 h-5 text-slate-500" />
        </div>
      </div>

      <!-- Time Section -->
      <div class="flex-shrink-0 text-center min-w-[60px]">
        <div class="text-sm font-semibold text-slate-900">
          {{ item.start_time_text || 'TBD' }}
        </div>
        <div v-if="item.end_time_text" class="text-xs text-slate-500">
          {{ item.end_time_text }}
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 min-w-0">
        <!-- Title Row -->
        <div class="flex items-center gap-2 mb-1">
          <h3 class="text-sm font-semibold text-slate-900 truncate">
            {{ item.title }}
          </h3>
          <Star
            v-if="item.is_featured"
            class="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0"
          />
          <div
            class="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
            :style="{
              backgroundColor: (item.color || '#8B5CF6') + '10',
              color: item.color || '#8B5CF6',
            }"
          >
            {{ getAgendaTypeLabel(item.agenda_type) }}
          </div>
        </div>

        <!-- Details Row -->
        <div class="flex items-center gap-4 text-xs text-slate-600">
          <!-- Speaker -->
          <div v-if="item.speaker" class="flex items-center gap-1.5">
            <div
              class="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-medium"
              :style="{ backgroundColor: item.color || '#8B5CF6' }"
            >
              {{ getInitials(item.speaker) }}
            </div>
            <span class="font-medium truncate max-w-[120px]">{{ item.speaker }}</span>
          </div>

          <!-- Location -->
          <div v-if="item.location" class="flex items-center gap-1">
            <MapPin class="w-3 h-3 text-slate-400" />
            <span class="truncate max-w-[100px]">{{ item.location }}</span>
          </div>

          <!-- Virtual -->
          <div v-if="item.virtual_link" class="flex items-center gap-1">
            <Monitor class="w-3 h-3 text-green-500" />
            <span class="text-green-600">Virtual</span>
          </div>

          <!-- Languages -->
          <div
            v-if="item.translations && item.translations.length > 0"
            class="flex items-center gap-1"
          >
            <Languages class="w-3 h-3 text-slate-400" />
            <span>{{ item.translations.length }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div
        v-if="canEdit"
        class="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <button
          @click.stop="$emit('edit', item)"
          class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          title="Edit"
        >
          <Edit2 class="w-3.5 h-3.5" />
        </button>
        <button
          @click.stop="$emit('delete', item)"
          class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Delete"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Clock,
  MapPin,
  Monitor,
  Edit2,
  Trash2,
  GripVertical,
  Languages,
  Star,
} from 'lucide-vue-next'
import type { EventAgendaItem } from '../services/api'

interface Props {
  item: EventAgendaItem
  canEdit: boolean
  draggable?: boolean
}

interface Emits {
  edit: [item: EventAgendaItem]
  delete: [item: EventAgendaItem]
  dragStart: [item: EventAgendaItem]
  dragEnd: [item: EventAgendaItem | null]
}

const props = withDefaults(defineProps<Props>(), {
  draggable: true,
})

const emit = defineEmits<Emits>()

// Drag state
const isDragging = ref(false)

// Helper functions
const getAgendaTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    session: 'Session',
    break: 'Break',
    networking: 'Networking',
    keynote: 'Keynote',
    workshop: 'Workshop',
    panel: 'Panel Discussion',
    other: 'Other',
  }
  return labels[type] || type
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Drag handlers
const handleDragStart = (event: DragEvent) => {
  if (!props.canEdit || !props.draggable) return

  isDragging.value = true
  emit('dragStart', props.item)

  // Set drag data
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.item.id.toString())
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  if (!props.canEdit || !props.draggable) return

  const draggedItemId = event.dataTransfer?.getData('text/plain')
  if (draggedItemId && parseInt(draggedItemId) !== props.item.id) {
    emit('dragEnd', props.item)
  }

  isDragging.value = false
}

const handleDragEnd = () => {
  // Reset dragging state when drag operation ends
  isDragging.value = false

  // If the drop was successful, the handleDrop will have already emitted dragEnd
  // If the drop was unsuccessful (dropped outside valid target), we still need to reset
}
</script>

<style scoped>
.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
