<template>
  <div
    ref="cardElement"
    :draggable="canEdit && isDesktop"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    class="agenda-card group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200/60"
    :class="[
      item.is_featured ? 'ring-1 ring-[#87CEEB] bg-[#E6F4FF]/30' : '',
      isDragging ? 'is-dragging' : '',
      isDraggedOver && !isDragging ? 'is-drag-over' : '',
    ]"
    :style="cardStyles"
    role="group"
  >
    <!-- Modern Minimalist Horizontal Layout -->
    <div class="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 pl-4 sm:pl-5">
      <!-- Icon Section (Hidden on mobile) -->
      <div class="hidden sm:block flex-shrink-0">
        <div
          v-if="item.icon"
          class="w-10 h-10 rounded-lg flex items-center justify-center"
          :style="{ backgroundColor: iconBackgroundColor }"
          v-html="sanitizedIconSvg"
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
        class="flex-shrink-0 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity relative z-30"
      >
        <button
          @click.stop="$emit('edit', item)"
          class="p-1 sm:p-1.5 text-slate-400 hover:text-[#1e90ff] hover:bg-[#E6F4FF] rounded-md transition-colors touch-manipulation"
          title="Edit"
        >
          <Edit2 class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
        <button
          @click.stop="$emit('delete', item)"
          class="p-1 sm:p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors touch-manipulation"
          title="Delete"
        >
          <Trash2 class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Clock,
  MapPin,
  Monitor,
  Edit2,
  Trash2,
  Languages,
  Star,
} from 'lucide-vue-next'
import type { EventAgendaItem } from '../services/api'
import { sanitizeSvg } from '@/utils/sanitize'

interface Props {
  item: EventAgendaItem
  canEdit: boolean
}

interface Emits {
  edit: [item: EventAgendaItem]
  delete: [item: EventAgendaItem]
  dragStart: [item: EventAgendaItem]
  dragEnd: [item: EventAgendaItem | null]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

// Desktop detection - only enable drag on screens >= 640px (sm breakpoint)
const isDesktop = ref(false)

const checkIsDesktop = () => {
  isDesktop.value = window.matchMedia('(min-width: 640px)').matches
}

onMounted(() => {
  checkIsDesktop()
  window.addEventListener('resize', checkIsDesktop)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkIsDesktop)

  // Cleanup drag preview if component is unmounted during drag
  if (dragPreviewElement.value && document.body.contains(dragPreviewElement.value)) {
    document.body.removeChild(dragPreviewElement.value)
    dragPreviewElement.value = null
  }
})

// Drag state
const isDragging = ref(false)
const isDraggedOver = ref(false)
const cardElement = ref<HTMLElement | null>(null)
const dragPreviewElement = ref<HTMLElement | null>(null)

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

/**
 * Sanitized SVG code for icon rendering
 * Prevents XSS attacks from malicious SVG content
 */
const sanitizedIconSvg = computed(() => {
  if (!props.item.icon || !props.item.icon.svg_code) {
    return ''
  }
  return sanitizeSvg(props.item.icon.svg_code)
})

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

/**
 * Creates a custom drag preview element with polished styling
 * Shows icon, title, and time in a compact format
 */
const createDragPreview = (): HTMLElement => {
  const preview = document.createElement('div')
  preview.className = 'drag-preview'
  preview.style.cssText = `
    position: absolute;
    top: -1000px;
    left: -1000px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 12px 16px;
    max-width: 320px;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 2px solid ${accentColor.value};
    z-index: 10000;
    pointer-events: none;
  `

  // Icon section
  if (props.item.icon?.svg_code) {
    const iconDiv = document.createElement('div')
    iconDiv.style.cssText = `
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background-color: ${iconBackgroundColor.value};
    `
    iconDiv.innerHTML = sanitizedIconSvg.value
    preview.appendChild(iconDiv)
  }

  // Content section
  const content = document.createElement('div')
  content.style.cssText = 'flex: 1; min-width: 0;'

  // Title
  const title = document.createElement('div')
  title.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
  `
  title.textContent = props.item.title
  content.appendChild(title)

  // Time
  const time = document.createElement('div')
  time.style.cssText = `
    font-size: 12px;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 4px;
  `
  time.textContent = props.item.start_time_text || 'TBD'
  content.appendChild(time)

  preview.appendChild(content)

  return preview
}

// Drag handlers (desktop only)
const handleDragStart = (event: DragEvent) => {
  if (!props.canEdit || !isDesktop.value) return

  isDragging.value = true
  emit('dragStart', props.item)

  // Set drag data
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.item.id.toString())

    // Create and set custom drag preview
    try {
      const preview = createDragPreview()
      document.body.appendChild(preview)
      dragPreviewElement.value = preview

      // Set the custom preview image
      event.dataTransfer.setDragImage(preview, preview.offsetWidth / 2, preview.offsetHeight / 2)

      // Remove the preview element after a short delay (after browser has captured it)
      setTimeout(() => {
        if (dragPreviewElement.value && document.body.contains(dragPreviewElement.value)) {
          document.body.removeChild(dragPreviewElement.value)
          dragPreviewElement.value = null
        }
      }, 0)
    } catch (error) {
      console.warn('Failed to create custom drag preview:', error)
    }
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (!props.canEdit || !isDesktop.value) return

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  if (!props.canEdit || !isDesktop.value || isDragging.value) return

  isDraggedOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  if (!props.canEdit || !isDesktop.value) return

  // Only reset if we're leaving the card completely
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY

  if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
    isDraggedOver.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  if (!props.canEdit || !isDesktop.value) return

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

  // Cleanup drag preview element if it still exists
  if (dragPreviewElement.value && document.body.contains(dragPreviewElement.value)) {
    document.body.removeChild(dragPreviewElement.value)
    dragPreviewElement.value = null
  }
}
</script>

<style scoped>
/* Drag cursor styles */
.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}

/* Left accent bar */
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

/* Dragging state - desktop only */
@media (min-width: 640px) {
  .agenda-card[draggable="true"] {
    cursor: grab;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .agenda-card[draggable="true"]:active {
    cursor: grabbing;
  }

  /* Being dragged - ghost effect on original */
  .agenda-card.is-dragging {
    opacity: 0.3;
    transform: scale(0.95) rotate(-1deg);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    border-color: #3b82f6;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Drop target highlight */
  .agenda-card.is-drag-over {
    border: 2px solid #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    transform: translateY(-2px);
    box-shadow:
      0 8px 16px -4px rgba(59, 130, 246, 0.25),
      0 4px 8px -2px rgba(59, 130, 246, 0.15),
      inset 0 0 0 1px rgba(59, 130, 246, 0.1);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .agenda-card.is-drag-over::before {
    opacity: 1;
    transform: scaleY(1.1);
    background: #3b82f6;
  }

  /* Insertion indicator - add a subtle top border highlight */
  .agenda-card.is-drag-over::after {
    content: '';
    position: absolute;
    top: -4px;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
    border-radius: 2px;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
    animation: pulse-border 1.5s ease-in-out infinite;
  }

  @keyframes pulse-border {
    0%, 100% {
      opacity: 1;
      transform: scaleX(1);
    }
    50% {
      opacity: 0.7;
      transform: scaleX(0.98);
    }
  }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
