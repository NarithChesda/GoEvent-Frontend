<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header (neutral style) -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Shirt class="w-4.5 h-4.5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">
                    {{ isEditing ? 'Edit Dress Code' : 'Create Dress Code' }}
                  </h2>
                </div>
                <button
                  @click="handleClose"
                  class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <!-- Error Banner -->
              <Transition name="slide-down">
                <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <div class="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <svg class="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-red-800">{{ error }}</p>
                  </div>
                  <button
                    type="button"
                    @click="error = null"
                    class="flex-shrink-0 text-red-400 hover:text-red-600"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </Transition>

              <!-- Dress Code Type -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  Dress Code Type <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <select
                    v-model="formData.dress_code_type"
                    required
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                  >
                    <option value="">Select dress code type</option>
                    <option v-for="(label, value) in DRESS_CODE_TYPE_LABELS" :key="value" :value="value">
                      {{ label }}
                    </option>
                  </select>
                  <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <!-- Title (Optional) -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  Custom Title <span class="text-xs text-slate-500">(Optional)</span>
                </label>
                <input
                  v-model="formData.title"
                  type="text"
                  maxlength="100"
                  placeholder="e.g., Ceremony Attire, Reception Dress Code"
                  class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                />
                <p class="text-xs text-slate-500 mt-1.5">Leave empty to use the dress code type name</p>
              </div>

              <!-- Time Period and Gender in a row -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- Time Period -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    Time Period <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      v-model="formData.time_period"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                    >
                      <option value="">Select time period</option>
                      <option v-for="(label, value) in TIME_PERIOD_LABELS" :key="value" :value="value">
                        {{ label }}
                      </option>
                    </select>
                    <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <!-- Gender -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    Gender <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      v-model="formData.gender"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                    >
                      <option value="">Select gender</option>
                      <option v-for="(label, value) in GENDER_LABELS" :key="value" :value="value">
                        {{ label }}
                      </option>
                    </select>
                    <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <!-- Description (collapsible) -->
              <div class="rounded-xl border border-slate-200 bg-white/70">
                <button
                  type="button"
                  class="w-full flex items-center justify-between px-4 py-3"
                  @click="descriptionOpen = !descriptionOpen"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-slate-700">Description</span>
                    <span class="hidden sm:inline text-xs text-slate-500">
                      {{ formData.description && formData.description.trim()
                        ? (formData.description.length > 60 ? formData.description.slice(0, 60) + '…' : formData.description)
                        : 'Optional guidelines' }}
                    </span>
                  </div>
                  <svg
                    class="h-4 w-4 text-slate-500 transition-transform"
                    :class="descriptionOpen ? 'rotate-180' : ''"
                    viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <Transition name="collapse">
                  <div v-show="descriptionOpen" class="px-4 pb-4">
                    <textarea
                      v-model="formData.description"
                      rows="3"
                      placeholder="Detailed dress code instructions and guidelines..."
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
                    ></textarea>
                  </div>
                </Transition>
              </div>

              <!-- Display Options (collapsible) -->
              <div class="rounded-xl border border-slate-200 bg-white/70">
                <button
                  type="button"
                  class="w-full flex items-center justify-between px-4 py-3"
                  @click="displayOpen = !displayOpen"
                >
                  <div class="flex items-center gap-2">
                    <Palette class="w-3.5 h-3.5 mr-1.5" />
                    <span class="text-sm font-medium text-slate-700">Display Options</span>
                  </div>
                  <svg
                    class="h-4 w-4 text-slate-500 transition-transform"
                    :class="displayOpen ? 'rotate-180' : ''"
                    viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <Transition name="collapse">
                  <div v-show="displayOpen" class="px-4 pb-4 space-y-3">
                    <!-- Color -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Theme Color
                      </label>
                      <div class="flex items-center gap-3">
                        <input
                          v-model="formData.color"
                          type="color"
                          class="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer"
                        />
                        <input
                          v-model="formData.color"
                          type="text"
                          placeholder="#3498db"
                          maxlength="7"
                          class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        />
                      </div>
                      <p class="text-xs text-slate-500 mt-1.5">Color will be used for visual indicators</p>
                    </div>

                    <!-- Active Status -->
                    <div class="flex items-center justify-between py-2">
                      <div>
                        <label class="block text-sm font-medium text-slate-700">Active Status</label>
                        <p class="text-xs text-slate-500 mt-0.5">Inactive dress codes won't be shown to guests</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input
                          v-model="formData.is_active"
                          type="checkbox"
                          class="sr-only peer"
                        />
                        <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Image Upload (collapsible) -->
              <div class="rounded-xl border border-slate-200 bg-white/70">
                <button
                  type="button"
                  class="w-full flex items-center justify-between px-4 py-3"
                  @click="imageOpen = !imageOpen"
                >
                  <div class="flex items-center gap-2">
                    <ImageIcon class="w-3.5 h-3.5 mr-1.5" />
                    <span class="text-sm font-medium text-slate-700">Reference Image</span>
                    <span class="hidden sm:inline text-xs text-slate-500">
                      {{ (isEditing && dressCode?.image && !shouldRemoveImage) || imagePreview ? 'Image attached' : 'Optional' }}
                    </span>
                  </div>
                  <svg
                    class="h-4 w-4 text-slate-500 transition-transform"
                    :class="imageOpen ? 'rotate-180' : ''"
                    viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <Transition name="collapse">
                  <div v-show="imageOpen" class="px-4 pb-4 space-y-3">
                    <!-- Current Image Preview (for editing) -->
                    <div v-if="isEditing && dressCode?.image && !imagePreview && !shouldRemoveImage">
                      <div class="relative inline-block">
                        <img
                          :src="dressCode.image"
                          alt="Current dress code image"
                          class="h-24 w-auto rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          @click="removeCurrentImage"
                          class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X class="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p class="text-xs text-slate-500 mt-1.5">Current image (click X to remove)</p>
                    </div>

                    <!-- New Image Preview -->
                    <div v-if="imagePreview">
                      <div class="relative inline-block">
                        <img
                          :src="imagePreview"
                          alt="Preview"
                          class="h-24 w-auto rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          @click="removeImage"
                          class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X class="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p class="text-xs text-slate-500 mt-1.5">New image preview</p>
                    </div>

                    <!-- Upload Button -->
                    <div
                      @click="triggerFileInput"
                      class="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/50 transition-all group"
                    >
                      <Upload class="w-6 h-6 text-slate-400 group-hover:text-sky-600 mx-auto mb-2" />
                      <p class="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                        Click to upload image
                      </p>
                      <p class="text-xs text-slate-400 mt-1">JPG, PNG, GIF, WebP (Max 5MB)</p>
                    </div>
                    <input
                      ref="fileInput"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      class="hidden"
                      @change="handleFileChange"
                    />
                  </div>
                </Transition>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  @click="handleClose"
                  :disabled="loading"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="loading || !formData.dress_code_type || !formData.time_period || !formData.gender"
                  class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <span
                    v-if="loading"
                    class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  {{ loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Dress Code' : 'Create Dress Code') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, Upload, Shirt, ChevronDown, Palette, ImageIcon } from 'lucide-vue-next'
import {
  dressCodeService,
  DRESS_CODE_TYPE_LABELS,
  TIME_PERIOD_LABELS,
  GENDER_LABELS,
  type EventDressCode,
  type CreateDressCodeRequest,
  type DressCodeType,
  type TimePeriod,
  type Gender,
} from '../services/api'

interface Props {
  show: boolean
  eventId: string
  dressCode?: EventDressCode | null
}

interface Emits {
  'close': []
  'success': [dressCode: EventDressCode]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isEditing = computed(() => !!props.dressCode)

const formData = ref<{
  dress_code_type: DressCodeType | ''
  time_period: TimePeriod | ''
  gender: Gender | ''
  title: string
  description: string
  color: string
  is_active: boolean
  image?: File
}>({
  dress_code_type: '',
  time_period: '',
  gender: '',
  title: '',
  description: '',
  color: '#3498db',
  is_active: true,
})

const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const shouldRemoveImage = ref(false)

// Collapsible sections state
const descriptionOpen = ref(false)
const displayOpen = ref(false)
const imageOpen = ref(false)

// Helper function to reset form (must be defined before watches)
const resetForm = () => {
  formData.value = {
    dress_code_type: '',
    time_period: '',
    gender: '',
    title: '',
    description: '',
    color: '#3498db',
    is_active: true,
  }
  imagePreview.value = null
  error.value = null
  shouldRemoveImage.value = false
  descriptionOpen.value = false
  displayOpen.value = false
  imageOpen.value = false
}

// Watch for prop changes to populate form
watch(
  () => props.dressCode,
  (newDressCode) => {
    if (newDressCode) {
      formData.value = {
        dress_code_type: newDressCode.dress_code_type,
        time_period: newDressCode.time_period,
        gender: newDressCode.gender,
        title: newDressCode.title || '',
        description: newDressCode.description || '',
        color: newDressCode.color || '#3498db',
        is_active: newDressCode.is_active,
      }
      imagePreview.value = null
      shouldRemoveImage.value = false
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

// Reset form when modal is closed
watch(
  () => props.show,
  (newShow) => {
    if (!newShow) {
      setTimeout(resetForm, 300)
    }
  },
)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Image size must be under 5MB'
    return
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    error.value = 'Invalid image format. Allowed: JPG, PNG, GIF, WebP'
    return
  }

  formData.value.image = file
  shouldRemoveImage.value = false

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  error.value = null
}

const removeImage = () => {
  formData.value.image = undefined
  imagePreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const removeCurrentImage = () => {
  shouldRemoveImage.value = true
  imagePreview.value = null
}

const handleClose = () => {
  if (!loading.value) {
    emit('close')
  }
}

const handleSubmit = async () => {
  error.value = null

  // Validation
  if (!formData.value.dress_code_type || !formData.value.time_period || !formData.value.gender) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true

  try {
    const requestData: CreateDressCodeRequest = {
      dress_code_type: formData.value.dress_code_type as DressCodeType,
      time_period: formData.value.time_period as TimePeriod,
      gender: formData.value.gender as Gender,
      title: formData.value.title || undefined,
      description: formData.value.description || undefined,
      color: formData.value.color || undefined,
      is_active: formData.value.is_active,
      image: formData.value.image,
    }

    let response

    if (isEditing.value && props.dressCode) {
      // Update existing dress code
      // If user clicked remove on current image, send null to remove it
      if (shouldRemoveImage.value && !formData.value.image) {
        (requestData as any).image = null
      }
      response = await dressCodeService.updateDressCode(props.eventId, props.dressCode.id, requestData as any)
    } else {
      // Create new dress code
      response = await dressCodeService.createDressCode(props.eventId, requestData)
    }

    if (response.success && response.data) {
      emit('success', response.data)
      emit('close')
    } else {
      error.value = response.message || 'Failed to save dress code'
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving the dress code'
    error.value = errorMessage
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
