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
      canEdit && draggable ? 'hover:scale-[1.01] hover:-translate-y-0.5' : ''
    ]"
  >
    <!-- Drag Handle -->
    <div 
      v-if="canEdit"
      class="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-white/90 hover:bg-white shadow-sm"
    >
      <GripVertical class="w-3 h-3 text-slate-400" />
    </div>

    <!-- Main Content Area -->
    <div class="p-4">
      <!-- Header Row: Time, Title, Featured -->
      <div class="flex items-start justify-between mb-3">
        <!-- Left Side: Time and Title -->
        <div class="flex-1 min-w-0 pr-3">
          <!-- Time Badge -->
          <div 
            class="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium mb-2"
            :style="{ 
              backgroundColor: (item.color || '#8B5CF6') + '15',
              color: item.color || '#8B5CF6'
            }"
          >
            <Clock class="w-3 h-3 mr-1" />
            <span>{{ item.start_time_text || 'TBD' }}</span>
            <span v-if="item.end_time_text" class="opacity-75 ml-1">- {{ item.end_time_text }}</span>
          </div>
          
          <!-- Title -->
          <h3 class="text-sm font-semibold text-slate-900 leading-tight mb-1">
            {{ item.title }}
          </h3>
          
          <!-- Type Badge -->
          <div 
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            :style="{ 
              backgroundColor: (item.color || '#8B5CF6') + '10',
              color: item.color || '#8B5CF6'
            }"
          >
            {{ getAgendaTypeLabel(item.agenda_type) }}
          </div>
        </div>

        <!-- Right Side: Icon and Featured -->
        <div class="flex items-start space-x-2 flex-shrink-0">
          <!-- Icon -->
          <div 
            v-if="item.icon" 
            class="w-8 h-8 rounded-lg p-1.5 flex items-center justify-center"
            :style="{ backgroundColor: (item.color || '#8B5CF6') + '15' }"
            v-html="item.icon.svg_code"
          ></div>
          
          <!-- Featured Star -->
          <div v-if="item.is_featured" class="flex items-center">
            <Star class="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </div>
        </div>
      </div>

      <!-- Description -->
      <p v-if="item.description" class="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
        {{ item.description }}
      </p>

      <!-- Speaker, Location, and Virtual in a balanced layout -->
      <div class="grid grid-cols-1 gap-2 mb-3">
        <!-- Speaker -->
        <div v-if="item.speaker" class="flex items-center space-x-2">
          <div 
            class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
            :style="{ backgroundColor: item.color || '#8B5CF6' }"
          >
            {{ getInitials(item.speaker) }}
          </div>
          <span class="text-xs text-slate-700 font-medium">{{ item.speaker }}</span>
        </div>

        <!-- Location -->
        <div v-if="item.location" class="flex items-center space-x-2 text-slate-600">
          <MapPin class="w-3 h-3" :style="{ color: item.color || '#8B5CF6' }" />
          <span class="text-xs">{{ item.location }}</span>
        </div>

        <!-- Virtual Link -->
        <div v-if="item.virtual_link" class="flex items-center space-x-2">
          <Monitor class="w-3 h-3 text-green-600" />
          <a 
            :href="item.virtual_link"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-blue-600 hover:text-blue-700 transition-colors"
            @click.stop
          >
            Join Virtual Meeting
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between pt-2 border-t border-slate-100">
        <!-- Translations and Date Text -->
        <div class="flex items-center space-x-3 text-xs text-slate-500">
          <div v-if="item.date_text">{{ item.date_text }}</div>
          <div v-if="item.translations && item.translations.length > 0" class="flex items-center space-x-1">
            <Languages class="w-3 h-3" />
            <span>{{ item.translations.length }} lang{{ item.translations.length !== 1 ? 's' : '' }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div v-if="canEdit" class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            @click.stop="$emit('edit', item)"
            class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Edit agenda item"
          >
            <Edit2 class="w-3 h-3" />
          </button>
          <button
            @click.stop="$emit('delete', item)"
            class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            title="Delete agenda item"
          >
            <Trash2 class="w-3 h-3" />
          </button>
        </div>
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
  ExternalLink, 
  Edit2, 
  Trash2, 
  GripVertical,
  Languages,
  Star
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
  draggable: true
})

const emit = defineEmits<Emits>()

// Drag state
const isDragging = ref(false)

// Helper functions
const getAgendaTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'session': 'Session',
    'break': 'Break',
    'networking': 'Networking',
    'keynote': 'Keynote',
    'workshop': 'Workshop',
    'panel': 'Panel Discussion',
    'other': 'Other'
  }
  return labels[type] || type
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
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

const handleDragEnd = (event: DragEvent) => {
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