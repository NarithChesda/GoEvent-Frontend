<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-[1000] overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-6 w-full max-w-lg" @click.stop>
            <div class="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 class="text-base font-semibold text-slate-900">
                  {{ t('management.showcasePreview.editors.featuredPhotoTitle') }}
                </h3>
                <p class="text-xs sm:text-sm text-slate-500 mt-1">
                  {{ t('management.showcasePreview.editors.featuredPhotoDescription') }}
                </p>
              </div>
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                :aria-label="t('management.showcasePreview.editors.cancel')"
                @click="close"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-12 text-slate-400">
              <Loader class="w-6 h-6 animate-spin" />
            </div>

            <!-- Error -->
            <div
              v-else-if="error"
              class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
            >
              {{ error }}
            </div>

            <!-- Empty: no photos uploaded yet -->
            <div
              v-else-if="photos.length === 0"
              class="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-slate-200"
            >
              <ImagePlus class="w-8 h-8 mx-auto mb-3 text-slate-400" />
              <p class="text-sm font-medium text-slate-700">
                {{ t('management.showcasePreview.editors.featuredPhotoEmpty') }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                {{ t('management.showcasePreview.editors.featuredPhotoUploadPrompt') }}
              </p>
              <button
                type="button"
                class="mt-4 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md transition-all duration-200"
                @click="requestUpload"
              >
                {{ t('management.showcasePreview.editors.featuredPhotoUploadButton') }}
              </button>
            </div>

            <!-- Grid picker -->
            <div v-else class="grid grid-cols-3 gap-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
              <button
                v-for="photo in photos"
                :key="photo.id"
                type="button"
                class="relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-wait"
                :class="photo.is_featured ? 'border-[#1e90ff]' : 'border-transparent hover:border-slate-300'"
                :disabled="updatingId !== null"
                @click="toggleFeatured(photo)"
              >
                <img :src="photo.image" :alt="photo.caption || ''" class="w-full h-full object-cover" />
                <span
                  v-if="photo.is_featured"
                  class="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#1e90ff] text-white shadow"
                >
                  <Star class="w-3 h-3 fill-current" />
                </span>
                <span
                  v-if="updatingId === photo.id"
                  class="absolute inset-0 flex items-center justify-center bg-black/30"
                >
                  <Loader class="w-4 h-4 text-white animate-spin" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Star, ImagePlus, Loader } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { mediaService, type EventPhoto } from '@/services/api'

interface Props {
  modelValue: boolean
  eventId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
  /** No photos to pick from — let the parent open the upload drawer instead. */
  uploadRequested: []
}>()

const { t } = useAppLanguage()

const loading = ref(false)
const error = ref<string | null>(null)
const photos = ref<EventPhoto[]>([])
const updatingId = ref<number | null>(null)

const loadPhotos = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await mediaService.getEventMedia(props.eventId)
    if (response.success && response.data) {
      photos.value = response.data.results
    } else {
      error.value = t('management.showcasePreview.editors.featuredPhotoLoadFailed')
    }
  } catch {
    error.value = t('management.showcasePreview.editors.featuredPhotoLoadFailed')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) loadPhotos()
  },
)

const close = () => emit('update:modelValue', false)

const requestUpload = () => {
  close()
  emit('uploadRequested')
}

// Single-select: picking a photo features it and un-features whichever one
// was featured before; clicking the already-featured photo clears it.
const toggleFeatured = async (photo: EventPhoto) => {
  if (updatingId.value !== null) return
  const makeFeatured = !photo.is_featured
  const previousFeatured = photos.value.find((p) => p.is_featured && p.id !== photo.id)

  updatingId.value = photo.id
  try {
    if (makeFeatured && previousFeatured) {
      await mediaService.updateEventMedia(props.eventId, previousFeatured.id, { is_featured: false })
    }
    const response = await mediaService.updateEventMedia(props.eventId, photo.id, {
      is_featured: makeFeatured,
    })
    if (response.success && response.data) {
      photos.value = photos.value.map((p) => {
        if (p.id === photo.id) return response.data as EventPhoto
        if (makeFeatured && previousFeatured && p.id === previousFeatured.id) {
          return { ...p, is_featured: false }
        }
        return p
      })
      emit('saved')
    } else {
      error.value = t('management.showcasePreview.editors.featuredPhotoUpdateFailed')
    }
  } catch {
    error.value = t('management.showcasePreview.editors.featuredPhotoUpdateFailed')
  } finally {
    updatingId.value = null
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active > div:last-child > div,
.modal-leave-active > div:last-child > div {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child > div,
.modal-leave-to > div:last-child > div {
  transform: scale(0.95);
}
</style>
