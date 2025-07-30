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

    <div class="flex flex-col items-center text-center space-y-4">
      <!-- Profile Image -->
      <div class="relative">
        <div v-if="host.profile_image" class="w-20 h-20 rounded-full overflow-hidden">
          <img
            :src="getMediaUrl(host.profile_image)"
            :alt="host.name"
            class="w-full h-full object-cover"
          />
        </div>
        <div v-else class="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
          <User class="w-10 h-10 text-blue-600" />
        </div>
      </div>

      <!-- Host Information -->
      <div class="flex-1 min-w-0 space-y-2">
        <div>
          <h4 class="text-lg font-semibold text-slate-900 truncate">{{ host.name }}</h4>
          <p v-if="host.title" class="text-sm font-medium text-blue-600 truncate">{{ host.title }}</p>
        </div>
        
        <!-- Parents Names (if provided) -->
        <div v-if="host.parent_a_name || host.parent_b_name" class="text-xs text-slate-500">
          <span v-if="host.parent_a_name">{{ host.parent_a_name }}</span>
          <span v-if="host.parent_a_name && host.parent_b_name"> & </span>
          <span v-if="host.parent_b_name">{{ host.parent_b_name }}</span>
        </div>
        
        <!-- Bio -->
        <p v-if="host.bio" class="text-sm text-slate-600 line-clamp-3 leading-relaxed">
          {{ host.bio }}
        </p>
      </div>

      <!-- Social Links -->
      <div v-if="hasSocialLinks" class="flex items-center justify-center space-x-3 pt-2">
        <a 
          v-if="host.email"
          :href="`mailto:${host.email}`"
          class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          title="Email"
        >
          <Mail class="w-4 h-4" />
        </a>
        <a 
          v-if="host.linkedin_url"
          :href="host.linkedin_url"
          target="_blank"
          rel="noopener noreferrer"
          class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          title="LinkedIn"
        >
          <Linkedin class="w-4 h-4" />
        </a>
        <a 
          v-if="host.twitter_url"
          :href="host.twitter_url"
          target="_blank"
          rel="noopener noreferrer"
          class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          title="Twitter"
        >
          <Twitter class="w-4 h-4" />
        </a>
        <a 
          v-if="host.website_url"
          :href="host.website_url"
          target="_blank"
          rel="noopener noreferrer"
          class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          title="Website"
        >
          <ExternalLink class="w-4 h-4" />
        </a>
      </div>

      <!-- Translations indicator -->
      <div v-if="host.translations && host.translations.length > 0" class="flex items-center justify-center">
        <Languages class="w-4 h-4 text-slate-400 mr-1" />
        <span class="text-xs text-slate-500">
          {{ host.translations.length }} language{{ host.translations.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Action Buttons -->
      <div v-if="canEdit" class="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-2">
        <button
          @click.stop="$emit('edit', host)"
          class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
          title="Edit host"
        >
          <Edit2 class="w-4 h-4" />
        </button>
        <button
          @click.stop="$emit('delete', host)"
          class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          title="Delete host"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Hover effect background -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-purple-50/0 to-blue-50/0 group-hover:from-blue-50/40 group-hover:via-purple-50/20 group-hover:to-blue-50/40 rounded-2xl transition-all duration-300 -z-10 pointer-events-none"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  User, 
  Mail,
  ExternalLink, 
  Edit2, 
  Trash2, 
  GripVertical,
  Languages,
  Linkedin,
  Twitter
} from 'lucide-vue-next'
import { apiService, type EventHost } from '../services/api'

interface Props {
  host: EventHost
  canEdit: boolean
  draggable?: boolean
}

interface Emits {
  edit: [host: EventHost]
  delete: [host: EventHost]
  dragStart: [host: EventHost]
  dragEnd: [host: EventHost | null]
}

const props = withDefaults(defineProps<Props>(), {
  draggable: true
})

const emit = defineEmits<Emits>()

// Drag state
const isDragging = ref(false)

// Computed
const hasSocialLinks = computed(() => {
  return props.host.email || props.host.linkedin_url || props.host.twitter_url || props.host.website_url
})

// Utility method to get full URL for media
const getMediaUrl = (mediaUrl: string | null): string | null => {
  return apiService.getProfilePictureUrl(mediaUrl)
}

// Drag handlers
const handleDragStart = (event: DragEvent) => {
  if (!props.canEdit || !props.draggable) return
  
  isDragging.value = true
  emit('dragStart', props.host)
  
  // Set drag data
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.host.id.toString())
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  
  if (!props.canEdit || !props.draggable) return
  
  const draggedHostId = event.dataTransfer?.getData('text/plain')
  if (draggedHostId && parseInt(draggedHostId) !== props.host.id) {
    emit('dragEnd', props.host)
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

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
</style>