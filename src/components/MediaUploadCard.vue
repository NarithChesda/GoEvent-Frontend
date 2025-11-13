<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h5 class="font-semibold text-slate-900">{{ title }}</h5>
        <p class="text-sm text-slate-600">{{ description }}</p>
      </div>

      <!-- File input (hidden) -->
      <input
        :ref="(el) => fileInputRef = el as HTMLInputElement"
        type="file"
        :accept="acceptTypes"
        @change="handleFileChange"
        class="hidden"
      />

      <!-- Options button when content exists -->
      <div v-if="canEdit && hasContent" class="relative">
        <button
          @click.stop="emit('toggle-dropdown')"
          :disabled="isUploading"
          class="text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-3 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MoreHorizontal class="w-5 h-5" />
        </button>

        <!-- Dropdown menu -->
        <div
          v-if="showDropdown"
          @click.stop
          class="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10 min-w-[120px]"
        >
          <button
            @click="triggerFileInput(); emit('close-dropdown')"
            :disabled="isUploading"
            class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload class="w-4 h-4" />
            <span>Replace</span>
          </button>
          <button
            @click="emit('remove'); emit('close-dropdown')"
            :disabled="isUploading"
            class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X class="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Content Display -->
    <slot v-if="hasContent" name="content" :media-url="mediaUrl">
      <!-- Default content display based on content type -->
      <div v-if="contentType === 'image'" class="relative group">
        <img
          :src="mediaUrl"
          :alt="title"
          :class="['w-full rounded-2xl', imageClass]"
        />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
          <p class="text-white font-medium">{{ title }}</p>
        </div>
      </div>

      <div v-else-if="contentType === 'video'" class="relative group">
        <video
          :src="mediaUrl"
          controls
          class="w-full h-48 object-cover rounded-2xl bg-black"
        >
          Your browser does not support the video tag.
        </video>
        <div class="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
          {{ title }}
        </div>
      </div>

      <div v-else-if="contentType === 'audio'" class="relative group">
        <audio
          :src="mediaUrl"
          controls
          class="w-full rounded-2xl bg-slate-50"
        >
          Your browser does not support the audio tag.
        </audio>
        <div class="mt-2 text-center">
          <p class="text-sm text-slate-600">{{ title }}</p>
        </div>
      </div>
    </slot>

    <!-- Empty State -->
    <div
      v-else
      @click="canEdit ? triggerFileInput() : null"
      :class="[
        'border-2 border-dashed rounded-2xl transition-all duration-300 text-center',
        emptyStatePadding,
        canEdit
          ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group'
          : 'border-slate-300 bg-slate-50'
      ]"
    >
      <slot name="empty-state">
        <div class="flex flex-col items-center justify-center min-h-[120px]">
          <div
            :class="[
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300',
              canEdit ? 'bg-slate-200 group-hover:bg-emerald-100' : 'bg-slate-200'
            ]"
          >
            <Plus
              v-if="canEdit"
              :class="[
                'w-8 h-8 transition-colors',
                'text-slate-400 group-hover:text-emerald-600'
              ]"
            />
            <component
              v-else
              :is="emptyIcon"
              class="w-8 h-8 text-slate-400"
            />
          </div>
          <p
            :class="[
              'font-semibold transition-colors',
              canEdit ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-600'
            ]"
          >
            {{ emptyStateText }}
          </p>
          <p v-if="emptyStateSubtext" class="text-sm text-slate-500 mt-1">
            {{ emptyStateSubtext }}
          </p>
          <p v-if="canEdit" class="text-xs text-slate-400 mt-1">Click to upload</p>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Component } from 'vue'
import { Upload, X, MoreHorizontal, Plus, ImageIcon, Play, Music } from 'lucide-vue-next'

interface Props {
  title: string
  description: string
  mediaUrl?: string
  canEdit: boolean
  isUploading?: boolean
  showDropdown?: boolean
  acceptTypes: string
  contentType: 'image' | 'video' | 'audio'
  emptyStateText: string
  emptyStateSubtext?: string
  imageClass?: string
  emptyStatePadding?: string
}

interface Emits {
  (e: 'upload', file: File): void
  (e: 'remove'): void
  (e: 'toggle-dropdown'): void
  (e: 'close-dropdown'): void
}

const props = withDefaults(defineProps<Props>(), {
  isUploading: false,
  showDropdown: false,
  imageClass: 'h-48 object-cover',
  emptyStatePadding: 'p-8'
})

const emit = defineEmits<Emits>()

// Local state
const fileInputRef = ref<HTMLInputElement | null>(null)

// Computed
const hasContent = computed(() => !!props.mediaUrl)

const emptyIcon = computed((): Component => {
  switch (props.contentType) {
    case 'image':
      return ImageIcon
    case 'video':
      return Play
    case 'audio':
      return Music
    default:
      return ImageIcon
  }
})

// Methods
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    emit('upload', file)
  }

  // Reset input to allow re-uploading the same file
  target.value = ''
}
</script>
