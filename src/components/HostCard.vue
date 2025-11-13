<template>
  <div
    :draggable="canEdit && draggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @touchstart.passive="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend.passive="handleTouchEnd"
    class="host-card group relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 sm:p-6 shadow-xl hover:shadow-2xl transition-all duration-200"
    :class="[
      isDragging ? 'opacity-75 transform rotate-1 scale-[1.01] dragging' : '',
      isDraggedOver && !isDragging ? 'drop-target' : '',
      canEdit && draggable ? 'hover:scale-[1.01] cursor-grab active:cursor-grabbing' : '',
    ]"
  >
    <!-- Admin toolbar -->
    <div v-if="canEdit" class="absolute top-2 left-2 right-2 flex items-center justify-between">
      <div v-if="canEdit && draggable" class="inline-flex items-center gap-1 text-slate-400 text-xs px-1.5 py-1 rounded-md bg-white/70 border border-slate-200">
        <GripVertical class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Drag</span>
      </div>
      <div class="ml-auto inline-flex items-center gap-1">
        <button
          v-if="canEdit"
          @click.stop="$emit('edit', host)"
          class="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
          title="Edit host"
          aria-label="Edit host"
        >
          <Edit2 class="w-4 h-4" />
        </button>
        <button
          v-if="canEdit"
          @click.stop="$emit('delete', host)"
          class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete host"
          aria-label="Delete host"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="flex flex-col items-center text-center gap-3 sm:gap-4">
      <!-- Profile Image / Initials -->
      <div class="relative">
        <div v-if="host.profile_image" class="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-2 ring-sky-100 overflow-hidden">
          <img
            :src="getMediaUrl(host.profile_image) || undefined"
            :alt="host.name"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div
          v-else
          class="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 ring-2 ring-sky-100 flex items-center justify-center"
        >
          <span class="text-lg sm:text-xl font-semibold text-sky-700">{{ initials }}</span>
        </div>
      </div>

      <!-- Host Information -->
      <div class="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
        <div>
          <h4 class="text-base sm:text-lg font-semibold text-slate-900 truncate">{{ host.name }}</h4>
          <p v-if="host.title" class="text-xs sm:text-sm font-medium text-sky-700 truncate">
            {{ host.title }}
          </p>
        </div>

        <!-- Parents Names (if provided) -->
        <div v-if="host.parent_a_name || host.parent_b_name" class="text-[11px] sm:text-xs text-slate-500">
          <span v-if="host.parent_a_name">{{ host.parent_a_name }}</span>
          <span v-if="host.parent_a_name && host.parent_b_name"> & </span>
          <span v-if="host.parent_b_name">{{ host.parent_b_name }}</span>
        </div>

        <!-- Bio -->
        <div v-if="host.bio" class="space-y-1">
          <p :class="['text-xs sm:text-sm text-slate-600 leading-relaxed', expanded ? '' : 'line-clamp-4']">
            {{ host.bio }}
          </p>
          <button
            v-if="showReadMore"
            @click="expanded = !expanded"
            class="text-xs text-sky-700 hover:underline"
            :aria-expanded="expanded ? 'true' : 'false'"
            type="button"
          >
            {{ expanded ? 'Show less' : 'Read more' }}
          </button>
        </div>
      </div>

      <!-- Social Links -->
      <div v-if="hasSocialLinks" class="flex items-center justify-center gap-2 pt-1">
        <a
          v-if="host.email"
          :href="`mailto:${host.email}`"
          class="p-2 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors duration-200"
          title="Email"
          aria-label="Email"
        >
          <Mail class="w-4 h-4" />
        </a>
        <a
          v-if="host.linkedin_url"
          :href="host.linkedin_url"
          target="_blank"
          rel="noopener noreferrer"
          class="p-2 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors duration-200"
          title="LinkedIn"
          aria-label="LinkedIn"
        >
          <Linkedin class="w-4 h-4" />
        </a>
        <a
          v-if="host.twitter_url"
          :href="host.twitter_url"
          target="_blank"
          rel="noopener noreferrer"
          class="p-2 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors duration-200"
          title="Twitter"
          aria-label="Twitter"
        >
          <Twitter class="w-4 h-4" />
        </a>
        <a
          v-if="host.website_url"
          :href="host.website_url"
          target="_blank"
          rel="noopener noreferrer"
          class="p-2 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors duration-200"
          title="Website"
          aria-label="Website"
        >
          <ExternalLink class="w-4 h-4" />
        </a>
      </div>

      <!-- Translations indicator -->
      <div
        v-if="host.translations && host.translations.length > 0"
        class="flex items-center justify-center"
      >
        <Languages class="w-4 h-4 text-slate-400 mr-1" />
        <span class="text-xs text-slate-500">
          {{ host.translations.length }} language{{ host.translations.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- Hover effect background -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-emerald-50/0 via-sky-50/0 to-emerald-50/0 group-hover:from-emerald-50/40 group-hover:via-sky-50/20 group-hover:to-emerald-50/40 rounded-2xl transition-all duration-300 -z-10 pointer-events-none"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Mail,
  ExternalLink,
  Edit2,
  Trash2,
  GripVertical,
  Languages,
  Linkedin,
  Twitter,
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
  draggable: true,
})

const emit = defineEmits<Emits>()

// Drag state
const isDragging = ref(false)
const isDraggedOver = ref(false)
const expanded = ref(false)
const touchStartY = ref(0)
const touchStartX = ref(0)
const touchMoveThreshold = 10 // pixels before considered a drag
let isTouchDragging = false

// Computed
const hasSocialLinks = computed(() => {
  return (
    props.host.email || props.host.linkedin_url || props.host.twitter_url || props.host.website_url
  )
})

const initials = computed(() => {
  const name = (props.host.name || '').trim()
  if (!name) return ' '
  const parts = name.split(/\s+/)
  const first = parts[0]?.[0] || ''
  const second = parts[1]?.[0] || ''
  return (first + second).toUpperCase()
})

const showReadMore = computed(() => {
  return props.host.bio && props.host.bio.length > 200
})

// Utility method to get full URL for media
const getMediaUrl = (mediaUrl: string | null | undefined): string | null => {
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

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (!props.canEdit || !props.draggable) return

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  if (!props.canEdit || !props.draggable || isDragging.value) return

  isDraggedOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  if (!props.canEdit || !props.draggable) return

  // Only reset if we're leaving the card completely (not just entering a child element)
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY

  if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
    isDraggedOver.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  if (!props.canEdit || !props.draggable) return

  isDraggedOver.value = false

  const draggedHostId = event.dataTransfer?.getData('text/plain')
  if (draggedHostId && parseInt(draggedHostId) !== props.host.id) {
    emit('dragEnd', props.host)
  }

  isDragging.value = false
}

const handleDragEnd = () => {
  // Reset dragging state when drag operation ends
  isDragging.value = false
  isDraggedOver.value = false

  // If the drop was successful, the handleDrop will have already emitted dragEnd
  // If the drop was unsuccessful (dropped outside valid target), we still need to reset
}

// Touch handlers for mobile devices
const handleTouchStart = (event: TouchEvent) => {
  if (!props.canEdit || !props.draggable) return

  const touch = event.touches[0]
  touchStartY.value = touch.clientY
  touchStartX.value = touch.clientX
  isTouchDragging = false
}

const handleTouchMove = (event: TouchEvent) => {
  if (!props.canEdit || !props.draggable) return

  const touch = event.touches[0]
  const deltaY = Math.abs(touch.clientY - touchStartY.value)
  const deltaX = Math.abs(touch.clientX - touchStartX.value)

  // Check if movement exceeds threshold
  if (deltaY > touchMoveThreshold || deltaX > touchMoveThreshold) {
    if (!isTouchDragging) {
      isTouchDragging = true
      isDragging.value = true
      emit('dragStart', props.host)
    }

    // Prevent default to avoid scrolling while dragging
    event.preventDefault()

    // Update drop target highlight for touch
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY)
    const allCards = document.querySelectorAll('.host-card')

    allCards.forEach((card) => {
      if (card !== event.currentTarget && card.contains(targetElement)) {
        card.classList.add('touch-drop-target')
      } else {
        card.classList.remove('touch-drop-target')
      }
    })
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  // Clean up all touch drop target highlights
  const allCards = document.querySelectorAll('.host-card')
  allCards.forEach((card) => {
    card.classList.remove('touch-drop-target')
  })

  if (!props.canEdit || !props.draggable || !isTouchDragging) {
    isTouchDragging = false
    isDragging.value = false
    return
  }

  event.preventDefault()

  const touch = event.changedTouches[0]
  const targetElement = document.elementFromPoint(touch.clientX, touch.clientY)

  // Find the closest host card element
  let dropTarget: HTMLElement | null = targetElement as HTMLElement
  while (dropTarget && !dropTarget.classList.contains('host-card')) {
    dropTarget = dropTarget.parentElement
  }

  if (dropTarget && dropTarget !== event.currentTarget) {
    // Find the host ID from the data attribute
    const hostId = dropTarget.closest('.host-item')?.getAttribute('data-id')
    if (hostId) {
      // Get the target host from parent component
      // We need to emit the dragEnd event with the target host
      // The parent will handle finding the actual host
      emit('dragEnd', { id: parseInt(hostId) } as EventHost)
    }
  }

  isDragging.value = false
  isTouchDragging = false
}
</script>

<style scoped>
.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}

/* Prevent text selection during dragging */
.host-card.dragging {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Drop target indicator */
.host-card.drop-target,
.host-card.touch-drop-target {
  position: relative;
  border: 2px solid #1e90ff;
  background: linear-gradient(135deg, rgba(30, 144, 255, 0.1), rgba(46, 204, 113, 0.05)) !important;
  transform: scale(1.03) translateY(-3px);
  box-shadow: 0 12px 32px -8px rgba(30, 144, 255, 0.5), 0 0 0 3px rgba(30, 144, 255, 0.2) !important;
}

/* Add animated border for drop target */
.host-card.drop-target::before,
.host-card.touch-drop-target::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 1rem;
  padding: 3px;
  background: linear-gradient(45deg, #1e90ff, #2ecc71, #1e90ff);
  background-size: 200% 200%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: border-rotate 2s linear infinite;
  pointer-events: none;
  z-index: -1;
}

@keyframes border-rotate {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Add animated top indicator */
.host-card.drop-target::after,
.host-card.touch-drop-target::after {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 4px;
  background: linear-gradient(to right, transparent, #1e90ff, #2ecc71, #1e90ff, transparent);
  border-radius: 9999px;
  animation: pulse-top 1.5s ease-in-out infinite;
}

@keyframes pulse-top {
  0%, 100% {
    opacity: 0.6;
    transform: translateX(-50%) scaleX(0.9);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) scaleX(1);
  }
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
