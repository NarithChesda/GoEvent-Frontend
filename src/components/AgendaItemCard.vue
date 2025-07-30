<template>
  <div
    :draggable="canEdit && draggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover.prevent
    @dragenter.prevent
    @drop="handleDrop"
    class="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer"
    :class="[
      item.is_featured ? 'ring-2 ring-purple-200' : '',
      isDragging ? 'opacity-50 transform rotate-2 scale-105' : '',
      canEdit && draggable ? 'hover:scale-[1.02]' : ''
    ]"
  >
    <!-- Drag Handle (only visible if can edit) -->
    <div 
      v-if="canEdit"
      class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-slate-100"
    >
      <GripVertical class="w-4 h-4 text-slate-400" />
    </div>

    <!-- Top accent bar (colored by agenda type) -->
    <div 
      class="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
      :style="{ backgroundColor: item.color || '#8B5CF6' }"
    ></div>

    <div class="flex items-start space-x-4">
      <!-- Time Column -->
      <div class="flex-shrink-0 text-center min-w-[80px]">
        <div 
          class="text-sm font-bold mb-1"
          :style="{ color: item.color || '#8B5CF6' }"
        >
          {{ item.start_time_text || 'TBD' }}
        </div>
        <div v-if="item.end_time_text" class="text-xs text-slate-500">
          {{ item.end_time_text }}
        </div>
      </div>
      
      <!-- Content Column -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center space-x-2 min-w-0 flex-1">
            <h4 class="text-lg font-semibold text-slate-900 truncate">{{ item.title }}</h4>
            
            <!-- Featured Badge -->
            <span
              v-if="item.is_featured"
              class="px-2 py-1 text-xs font-bold bg-purple-100 text-purple-700 rounded-full flex-shrink-0"
            >
              Featured
            </span>
            
            <!-- Agenda Type Badge -->
            <span
              class="px-3 py-1 text-xs font-medium rounded-full bg-white/80 text-slate-600 capitalize flex-shrink-0"
              :style="{ 
                backgroundColor: (item.color || '#8B5CF6') + '15', 
                color: item.color || '#8B5CF6' 
              }"
            >
              {{ item.agenda_type }}
            </span>
          </div>

          <!-- Action Buttons -->
          <div v-if="canEdit" class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
            <button
              @click.stop="$emit('edit', item)"
              class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="Edit agenda item"
            >
              <Edit2 class="w-4 h-4" />
            </button>
            <button
              @click.stop="$emit('delete', item)"
              class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Delete agenda item"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <!-- Description -->
        <p v-if="item.description" class="text-slate-600 mb-3 leading-relaxed">
          {{ item.description }}
        </p>
        
        <!-- Metadata Row -->
        <div class="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <!-- Speaker -->
          <span v-if="item.speaker" class="flex items-center">
            <User class="w-4 h-4 mr-1 flex-shrink-0" />
            <span class="truncate">{{ item.speaker }}</span>
          </span>
          
          <!-- Location -->
          <span v-if="item.location" class="flex items-center">
            <MapPin class="w-4 h-4 mr-1 flex-shrink-0" />
            <span class="truncate">{{ item.location }}</span>
          </span>
          
          <!-- Virtual Link -->
          <a 
            v-if="item.virtual_link" 
            :href="item.virtual_link"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center text-blue-600 hover:text-blue-700 transition-colors duration-200"
            @click.stop
          >
            <Monitor class="w-4 h-4 mr-1 flex-shrink-0" />
            <span>Join Virtual</span>
            <ExternalLink class="w-3 h-3 ml-1" />
          </a>
        </div>

        <!-- Translations indicator -->
        <div v-if="item.translations && item.translations.length > 0" class="flex items-center mt-3">
          <Languages class="w-4 h-4 text-slate-400 mr-1" />
          <span class="text-xs text-slate-500">
            Available in {{ item.translations.length }} language{{ item.translations.length !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Hover effect background -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-purple-50/0 to-blue-50/0 group-hover:from-blue-50/40 group-hover:via-purple-50/20 group-hover:to-blue-50/40 rounded-2xl transition-all duration-300 -z-10 pointer-events-none"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  User, 
  MapPin, 
  Monitor, 
  ExternalLink, 
  Edit2, 
  Trash2, 
  GripVertical,
  Languages
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
</style>