<template>
  <div class="flex flex-col items-center space-y-4 py-4">
    <h4 class="font-semibold text-slate-900 self-start">Profile Picture</h4>

    <!-- Circular Avatar Preview -->
    <div class="relative">
      <div
        v-if="profilePicturePreview || (profileImage && profileImage !== '')"
        class="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-200 shadow-lg"
      >
        <img
          :src="profilePicturePreview || profileImage || ''"
          alt="Profile preview"
          class="w-full h-full object-cover"
        />
      </div>
      <div
        v-else
        class="w-32 h-32 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center shadow-lg"
      >
        <User class="w-12 h-12 text-slate-400" />
      </div>
    </div>

    <!-- Upload Controls -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="$emit('select-image', $event)"
      class="hidden"
    />
    <div class="flex flex-col items-center space-y-2">
      <div class="flex space-x-2">
        <button
          type="button"
          @click="$emit('trigger-upload')"
          :disabled="profilePictureUploading"
          class="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <Upload class="w-4 h-4" />
          <span>{{ profilePictureUploading ? 'Uploading...' : 'Upload Photo' }}</span>
        </button>
        <button
          v-if="profilePicturePreview || (profileImage && profileImage !== '')"
          type="button"
          @click="$emit('remove-image')"
          class="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors duration-200"
        >
          Remove
        </button>
      </div>
      <p class="text-xs text-slate-500 text-center">JPG, PNG, or WebP. Max 3MB.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { User, Upload } from 'lucide-vue-next'

interface Props {
  profilePicturePreview: string | null
  profileImage: string
  profilePictureUploading: boolean
  profilePictureInput?: HTMLInputElement
}

interface Emits {
  'trigger-upload': []
  'select-image': [event: Event]
  'remove-image': []
  'update:profilePictureInput': [el: HTMLInputElement | null]
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const fileInput = ref<HTMLInputElement>()

// Expose the file input ref to the parent
onMounted(() => {
  if (fileInput.value) {
    emit('update:profilePictureInput', fileInput.value)
  }
})
</script>
