<template>
  <div
    :draggable="canEdit && draggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    class="agenda-card group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200/60"
    :class="[
      item.is_featured ? 'ring-1 ring-[#87CEEB] bg-[#E6F4FF]/30' : '',
      isDragging ? 'opacity-60 transform rotate-1 scale-105 shadow-xl dragging' : '',
      isDraggedOver && !isDragging ? 'drop-target' : '',
      canEdit && draggable ? 'hover:scale-[1.01] hover:-translate-y-0.5' : '',
    ]"
    :style="cardStyles"
    role="group"
  >
    <!-- Drag Handle (Visible on mobile for touch, hover on desktop) -->
    <div
      v-if="canEdit"
      class="absolute top-2 right-2 z-20 sm:opacity-0 sm:group-hover:opacity-100 opacity-40 transition-all duration-200 cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-white/90 hover:bg-white shadow-sm touch-none"
    >
      <GripVertical class="w-3 h-3 sm:w-3 sm:h-3 text-slate-400" />
    </div>

    <!-- Modern Minimalist Horizontal Layout -->
    <div class="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 pl-4 sm:pl-5">
      <!-- Icon Section (Hidden on mobile) -->
      <div class="hidden sm:block flex-shrink-0">
        <div
          v-if="item.icon"
          class="w-10 h-10 rounded-lg flex items-center justify-center"
          :style="{ backgroundColor: iconBackgroundColor }"
          v-html="item.icon.svg_code"
        ></div>
        <div v-else class="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100">
          <Clock class="w-5 h-5 text-slate-500" />
        </div>
      </div>

      <!-- Time Section -->
      <div class="flex-shrink-0 text-left sm:text-center w-[68px] sm:w-auto sm:min-w-[68px]">
        <div class="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
          {{ item.start_time_text || 'TBD' }}
        </div>
        <div v-if="item.end_time_text" class="text-[10px] sm:text-xs text-slate-500">
          {{ item.end_time_text }}
        </div>
        <div
          v-if="item.agenda_type"
          class="sm:hidden mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
          :style="{ backgroundColor: badgeBackgroundColor, color: accentColor }"
        >
          {{ getAgendaTypeLabel(item.agenda_type) }}
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 min-w-0 space-y-1">
        <!-- Title Row -->
        <div class="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
          <h3 class="text-sm sm:text-base font-semibold text-slate-900 leading-snug line-clamp-2">
            {{ item.title }}
          </h3>
          <Star
            v-if="item.is_featured"
            class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500 flex-shrink-0"
          />
          <div
            class="hidden sm:block px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
            :style="{
              backgroundColor: badgeBackgroundColor,
              color: accentColor,
            }"
          >
            {{ getAgendaTypeLabel(item.agenda_type) }}
          </div>
        </div>

        <!-- Description -->
        <p
          v-if="item.description"
          class="text-xs sm:text-sm text-slate-600 leading-snug line-clamp-2"
        >
          {{ item.description }}
        </p>

        <!-- Details Row -->
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] sm:text-xs text-slate-600">
          <!-- Speaker -->
          <div v-if="item.speaker" class="flex items-center gap-1.5">
            <div
              class="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-medium"
              :style="{ backgroundColor: accentColor }"
            >
              {{ getInitials(item.speaker) }}
            </div>
            <span class="font-medium truncate max-w-[140px]" :title="item.speaker">{{ item.speaker }}</span>
          </div>

          <!-- Location -->
          <div v-if="item.location" class="flex items-center gap-1.5">
            <MapPin class="w-3 h-3 text-slate-400" />
            <span class="truncate max-w-[140px]" :title="item.location">{{ item.location }}</span>
          </div>

          <!-- Virtual -->
          <div v-if="item.virtual_link" class="flex items-center gap-1">
            <Monitor class="w-3 h-3 text-green-500" />
            <span class="text-green-600">Virtual</span>
          </div>

          <!-- Languages -->
          <div v-if="item.translations && item.translations.length > 0" class="flex items-center gap-1.5">
            <Languages class="w-3 h-3 text-slate-400" />
            <span>{{ item.translations.length }} {{ item.translations.length === 1 ? 'translation' : 'translations' }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div
        v-if="canEdit"
        class="flex-shrink-0 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
      >
        <button
          @click.stop="$emit('edit', item)"
          class="p-1 sm:p-1.5 text-slate-400 hover:text-[#1e90ff] hover:bg-[#E6F4FF] rounded-md transition-colors"
          title="Edit"
        >
          <Edit2 class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
        <button
          @click.stop="$emit('delete', item)"
          class="p-1 sm:p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Delete"
        >
          <Trash2 class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
const isDraggedOver = ref(false)
const touchStartY = ref(0)
const touchStartX = ref(0)
const touchMoveThreshold = 10 // pixels before considered a drag
let isTouchDragging = false

const normalizeHex = (color: string): string | null => {
  if (!color || !color.startsWith('#')) return null
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
  }
  if (color.length === 7 || color.length === 9) {
    return color.slice(0, 7)
  }
  return null
}

const withAlpha = (color: string, alphaHex = '24'): string => {
  const normalized = normalizeHex(color)
  if (normalized) {
    return `${normalized}${alphaHex}`
  }
  return color || '#1e90ff'
}

const accentColor = computed(() => props.item.color?.trim() || '#1e90ff')
const iconBackgroundColor = computed(() => withAlpha(accentColor.value, '1F'))
const badgeBackgroundColor = computed(() => withAlpha(accentColor.value, '1A'))
const cardStyles = computed(() => ({
  '--agenda-accent': accentColor.value,
  '--agenda-accent-soft': badgeBackgroundColor.value,
  boxShadow: props.item.is_featured ? `0 18px 32px -18px ${withAlpha(accentColor.value, '4D')}` : undefined,
}))

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

  const draggedItemId = event.dataTransfer?.getData('text/plain')
  if (draggedItemId && parseInt(draggedItemId) !== props.item.id) {
    emit('dragEnd', props.item)
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
      emit('dragStart', props.item)
    }

    // Prevent default to avoid scrolling while dragging
    event.preventDefault()

    // Update drop target highlight for touch
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY)
    const allCards = document.querySelectorAll('.agenda-card')

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
  const allCards = document.querySelectorAll('.agenda-card')
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

  // Find the closest agenda card element
  let dropTarget: HTMLElement | null = targetElement as HTMLElement
  while (dropTarget && !dropTarget.classList.contains('agenda-card')) {
    dropTarget = dropTarget.parentElement
  }

  if (dropTarget && dropTarget !== event.currentTarget) {
    // Find the item ID from the data attribute
    const itemId = dropTarget.closest('.agenda-item')?.getAttribute('data-id')
    if (itemId) {
      // Get the target item from parent component
      // We need to emit the dragEnd event with the target item
      // The parent will handle finding the actual item
      emit('dragEnd', { id: parseInt(itemId) } as EventAgendaItem)
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
.agenda-card.dragging {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Touch-friendly styles */
.touch-none {
  touch-action: none;
}

/* Drop target indicator */
.agenda-card.drop-target,
.agenda-card.touch-drop-target {
  position: relative;
  border-color: #1e90ff !important;
  background: linear-gradient(to right, rgba(30, 144, 255, 0.08), rgba(30, 144, 255, 0.02)) !important;
  transform: scale(1.02) translateY(-2px);
  box-shadow: 0 8px 24px -6px rgba(30, 144, 255, 0.4), 0 0 0 2px rgba(30, 144, 255, 0.2) !important;
}

/* Add animated indicator line for drop target */
.agenda-card.drop-target::after,
.agenda-card.touch-drop-target::after {
  content: '';
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(to right, #1e90ff, #2ecc71);
  border-radius: 9999px;
  animation: pulse-line 1.5s ease-in-out infinite;
}

@keyframes pulse-line {
  0%, 100% {
    opacity: 0.6;
    transform: scaleX(0.95);
  }
  50% {
    opacity: 1;
    transform: scaleX(1);
  }
}

.agenda-card::before {
  content: '';
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 0;
  width: 4px;
  border-radius: 9999px;
  background: var(--agenda-accent, #1e90ff);
  opacity: 0.85;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.agenda-card:hover::before,
.agenda-card:focus-within::before {
  transform: scaleY(1.05);
  opacity: 1;
}

.agenda-card:is(.dragging)::before {
  opacity: 0.9;
}

/* Enhanced left accent bar for drop target */
.agenda-card.drop-target::before,
.agenda-card.touch-drop-target::before {
  background: linear-gradient(to bottom, #1e90ff, #2ecc71);
  transform: scaleY(1.1);
  opacity: 1;
  width: 5px;
  animation: pulse-accent 1.5s ease-in-out infinite;
}

@keyframes pulse-accent {
  0%, 100% {
    transform: scaleY(1.05);
  }
  50% {
    transform: scaleY(1.15);
  }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
