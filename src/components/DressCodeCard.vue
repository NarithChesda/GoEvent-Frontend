<template>
  <article
    :class="[
      'group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300',
      canEdit && draggable ? 'cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300' : 'hover:shadow-md',
      isDragging ? 'opacity-50 scale-95' : '',
      !dressCode.is_active ? 'opacity-60' : '',
    ]"
    :draggable="canEdit && draggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover.prevent
    @drop="handleDrop"
  >
    <!-- Image Container - 16:10 aspect ratio for balance -->
    <div class="relative aspect-[16/10] bg-slate-100">
      <img
        v-if="dressCode.image"
        :src="dressCode.image"
        :alt="dressCode.title || dressCode.dress_code_type_display"
        class="h-full w-full object-cover"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center"
        :style="{ backgroundColor: dressCode.color || '#94a3b8' }"
      >
        <div class="flex flex-col items-center gap-2 text-white/80">
          <ImageIcon class="h-10 w-10" />
          <p class="text-xs font-medium uppercase tracking-wider">No Image</p>
        </div>
      </div>

      <!-- Subtle gradient overlay for better text readability -->
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent"></div>

      <!-- Status badges -->
      <div class="absolute top-3 left-3 flex items-center gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm"
        >
          <div
            class="h-2 w-2 rounded-full"
            :style="{ backgroundColor: dressCode.color || '#3498db' }"
          ></div>
          {{ dressCode.dress_code_type_display }}
        </span>

        <span
          v-if="!dressCode.is_active"
          class="inline-flex items-center rounded-lg bg-red-500/95 px-2.5 py-1 text-xs font-medium text-white shadow-sm backdrop-blur-sm"
        >
          Inactive
        </span>
      </div>

      <!-- Edit actions -->
      <div
        v-if="canEdit"
        class="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-white/95 p-1 shadow-sm backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      >
        <button
          v-if="draggable"
          class="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <GripVertical class="h-4 w-4" />
        </button>
        <button
          @click.stop="$emit('edit', dressCode)"
          class="rounded-md p-1.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
          title="Edit dress code"
          aria-label="Edit dress code"
        >
          <Edit class="h-4 w-4" />
        </button>
        <button
          @click.stop="$emit('delete', dressCode)"
          class="rounded-md p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Delete dress code"
          aria-label="Delete dress code"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex flex-col gap-3 p-5">
      <!-- Title -->
      <h3 class="text-base font-semibold text-slate-900 leading-snug">
        {{ dressCode.title || dressCode.dress_code_type_display }}
      </h3>

      <!-- Description -->
      <p v-if="dressCode.description" class="text-sm text-slate-600 leading-relaxed line-clamp-2">
        {{ dressCode.description }}
      </p>

      <!-- Meta info -->
      <div class="flex items-center gap-4 text-xs text-slate-500">
        <span class="inline-flex items-center gap-1.5">
          <Clock class="h-3.5 w-3.5" />
          {{ dressCode.time_period_display }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <Users class="h-3.5 w-3.5" />
          {{ dressCode.gender_display }}
        </span>
      </div>
    </div>
  </article>
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
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
