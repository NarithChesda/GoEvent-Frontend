<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[80] overflow-y-auto">
        <div class="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
                <button
                  @click="$emit('close')"
                  class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Close cropper"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Cropper Content -->
            <div class="p-6">
              <div v-if="imageSource" class="bg-slate-100 rounded-lg overflow-hidden" :style="{ height: cropperHeight }">
                <Cropper
                  ref="cropperRef"
                  :src="imageSource"
                  :stencil-props="stencilProps"
                  class="h-full w-full"
                  @error="handleCropperError"
                  @ready="handleCropperReady"
                />
              </div>
              <div v-else class="bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center" :style="{ height: cropperHeight }">
                <p class="text-slate-500">No image loaded</p>
              </div>

              <div v-if="errorMessage" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm text-red-600">{{ errorMessage }}</p>
              </div>

              <!-- Help text if provided -->
              <p v-if="helpText" class="mt-3 text-sm text-slate-600">
                {{ helpText }}
              </p>
            </div>

            <!-- Actions -->
            <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                @click="$emit('close')"
                class="px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="$emit('apply')"
                class="px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

interface Props {
  show: boolean
  imageSource: string | null
  title?: string
  aspectRatio?: number
  cropperHeight?: string
  helpText?: string
}

interface Emits {
  close: []
  apply: []
  'update:cropperRef': [ref: any]
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Crop Image',
  aspectRatio: 1,
  cropperHeight: '400px',
  helpText: '',
})

const emit = defineEmits<Emits>()

const cropperRef = ref<any>(null)
const errorMessage = ref<string>('')

const stencilProps = computed(() => ({
  aspectRatio: props.aspectRatio,
}))

const handleCropperError = (error: any) => {
  console.error('Cropper error:', error)
  errorMessage.value = 'Failed to load image. Please try again.'
}

const handleCropperReady = () => {
  console.log('Cropper ready')
  errorMessage.value = ''
}

// Emit cropper ref to parent when it's mounted
watch(
  cropperRef,
  (newRef) => {
    if (newRef) {
      emit('update:cropperRef', newRef)
    }
  },
  { immediate: true }
)

// Also emit on mount to ensure parent gets the ref
onMounted(() => {
  if (cropperRef.value) {
    emit('update:cropperRef', cropperRef.value)
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
