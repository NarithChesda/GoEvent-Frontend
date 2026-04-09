<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[70] overflow-y-auto">
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
                    {{ isEditing ? t('management.dressCode.modal.titleEdit') : t('management.dressCode.modal.titleCreate') }}
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

              <!-- Dress Code Type and Custom Title in a row -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- Dress Code Type -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.dressCode.modal.fields.dressCodeType') }} <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      v-model="formData.dress_code_type"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                    >
                      <option value="">{{ t('management.dressCode.modal.fields.selectDressCodeType') }}</option>
                      <option v-for="(label, value) in translatedDressCodeTypes" :key="value" :value="value">
                        {{ label }}
                      </option>
                    </select>
                    <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <!-- Custom Title (Optional) -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.dressCode.modal.fields.customTitle') }} <span class="text-xs text-slate-500">({{ t('management.dressCode.modal.fields.customTitleOptional') }})</span>
                  </label>
                  <input
                    v-model="formData.title"
                    type="text"
                    maxlength="100"
                    :placeholder="t('management.dressCode.modal.fields.customTitlePlaceholder')"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                  />
                </div>
              </div>

              <!-- Time Period and Gender in a row -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- Time Period -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.dressCode.modal.fields.timePeriod') }} <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      v-model="formData.time_period"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                    >
                      <option value="">{{ t('management.dressCode.modal.fields.selectTimePeriod') }}</option>
                      <option v-for="(label, value) in translatedTimePeriods" :key="value" :value="value">
                        {{ label }}
                      </option>
                    </select>
                    <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <!-- Gender -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.dressCode.modal.fields.gender') }} <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      v-model="formData.gender"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                    >
                      <option value="">{{ t('management.dressCode.modal.fields.selectGender') }}</option>
                      <option v-for="(label, value) in translatedGenders" :key="value" :value="value">
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
                    <span class="text-sm font-medium text-slate-700">{{ t('management.dressCode.modal.description.label') }}</span>
                    <span class="hidden sm:inline text-xs text-slate-500">
                      {{ formData.description && formData.description.trim()
                        ? (formData.description.length > 60 ? formData.description.slice(0, 60) + '…' : formData.description)
                        : t('management.dressCode.modal.description.hint') }}
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
                      :placeholder="t('management.dressCode.modal.description.placeholder')"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
                    ></textarea>
                  </div>
                </Transition>
              </div>

              <!-- Display Options -->
              <div class="rounded-xl border border-slate-200 bg-white/70">
                <div class="px-4 py-3 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <Palette class="w-3.5 h-3.5 mr-1.5" />
                    <span class="text-sm font-medium text-slate-700">{{ t('management.dressCode.modal.displayOptions.label') }}</span>
                  </div>
                </div>
                <div class="px-4 pb-4 pt-3">
                  <!-- Theme Color and Active Status in a row -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Theme Color -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        {{ t('management.dressCode.modal.displayOptions.themeColor') }}
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
                          pattern="^#[0-9A-Fa-f]{6}$"
                          maxlength="7"
                          class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 font-mono"
                          title="Enter a hex color (e.g., #3498db)"
                        />
                      </div>
                      <p class="text-xs text-slate-500 mt-1.5">{{ t('management.dressCode.modal.displayOptions.themeColorHint') }}</p>
                    </div>

                    <!-- Active Status -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('management.dressCode.modal.displayOptions.activeStatus') }}</label>
                      <div class="flex items-center justify-between h-10">
                        <p class="text-xs text-slate-500">{{ t('management.dressCode.modal.displayOptions.activeStatusHint') }}</p>
                        <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            v-model="formData.is_active"
                            type="checkbox"
                            class="sr-only peer"
                          />
                          <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Reference Image -->
              <div class="rounded-xl border border-slate-200 bg-white/70">
                <div class="px-4 py-3 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <ImageIcon class="w-3.5 h-3.5 mr-1.5" />
                    <span class="text-sm font-medium text-slate-700">{{ t('management.dressCode.modal.referenceImage.label') }}</span>
                    <span class="hidden sm:inline text-xs text-slate-500">
                      {{ (isEditing && dressCode?.image && !shouldRemoveImage) || imagePreview ? t('management.dressCode.modal.referenceImage.attached') : t('management.dressCode.modal.referenceImage.optional') }}
                    </span>
                  </div>
                </div>
                <div class="px-4 pb-4 pt-3 space-y-3">
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
                    <p class="text-xs text-slate-500 mt-1.5">{{ t('management.dressCode.modal.referenceImage.currentImageHint') }}</p>
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
                    <p class="text-xs text-slate-500 mt-1.5">{{ t('management.dressCode.modal.referenceImage.newImagePreview') }}</p>
                  </div>

                  <!-- Upload Button -->
                  <div
                    @click="triggerFileInput"
                    class="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/50 transition-all group"
                  >
                    <Upload class="w-6 h-6 text-slate-400 group-hover:text-sky-600 mx-auto mb-2" />
                    <p class="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                      {{ t('management.dressCode.modal.referenceImage.uploadClick') }}
                    </p>
                    <p class="text-xs text-slate-400 mt-1">{{ t('management.dressCode.modal.referenceImage.uploadFormat') }}</p>
                  </div>
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    class="hidden"
                    @change="handleFileChange"
                  />
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  @click="handleClose"
                  :disabled="loading"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  {{ t('management.dressCode.modal.actions.cancel') }}
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
                  {{ loading ? (isEditing ? t('management.dressCode.modal.actions.updating') : t('management.dressCode.modal.actions.creating')) : (isEditing ? t('management.dressCode.modal.actions.update') : t('management.dressCode.modal.actions.create')) }}
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
import { useAppLanguage } from '@/composables/useAppLanguage'
import {
  dressCodeService,
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

const { t } = useAppLanguage()

const translatedDressCodeTypes = computed<Record<DressCodeType, string>>(() => ({
  white_tie: t('management.dressCode.modal.fields.types.white_tie'),
  black_tie: t('management.dressCode.modal.fields.types.black_tie'),
  black_tie_optional: t('management.dressCode.modal.fields.types.black_tie_optional'),
  formal: t('management.dressCode.modal.fields.types.formal'),
  cocktail: t('management.dressCode.modal.fields.types.cocktail'),
  semi_formal: t('management.dressCode.modal.fields.types.semi_formal'),
  business_formal: t('management.dressCode.modal.fields.types.business_formal'),
  business_casual: t('management.dressCode.modal.fields.types.business_casual'),
  smart_casual: t('management.dressCode.modal.fields.types.smart_casual'),
  casual: t('management.dressCode.modal.fields.types.casual'),
  beach_formal: t('management.dressCode.modal.fields.types.beach_formal'),
  beach_casual: t('management.dressCode.modal.fields.types.beach_casual'),
  festive: t('management.dressCode.modal.fields.types.festive'),
  traditional: t('management.dressCode.modal.fields.types.traditional'),
  themed: t('management.dressCode.modal.fields.types.themed'),
  custom: t('management.dressCode.modal.fields.types.custom'),
}))

const translatedTimePeriods = computed<Record<TimePeriod, string>>(() => ({
  all_day: t('management.dressCode.modal.fields.timePeriods.all_day'),
  morning: t('management.dressCode.modal.fields.timePeriods.morning'),
  afternoon: t('management.dressCode.modal.fields.timePeriods.afternoon'),
  evening: t('management.dressCode.modal.fields.timePeriods.evening'),
  night: t('management.dressCode.modal.fields.timePeriods.night'),
}))

const translatedGenders = computed<Record<Gender, string>>(() => ({
  all: t('management.dressCode.modal.fields.genders.all'),
  male: t('management.dressCode.modal.fields.genders.male'),
  female: t('management.dressCode.modal.fields.genders.female'),
}))

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
    error.value = t('management.dressCode.modal.errors.imageTooLarge')
    return
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    error.value = t('management.dressCode.modal.errors.invalidFormat')
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

// Ensure color is always in hex format
const normalizeColor = (color: string): string => {
  // Remove whitespace
  color = color.trim()

  // If it's already a valid hex, return it
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color.toLowerCase()
  }

  // If it's hex without #, add it
  if (/^[0-9A-Fa-f]{6}$/.test(color)) {
    return `#${color.toLowerCase()}`
  }

  // Default fallback
  return '#3498db'
}

// Watch color changes and normalize to hex
watch(
  () => formData.value.color,
  (newColor) => {
    if (newColor) {
      const normalized = normalizeColor(newColor)
      if (normalized !== newColor) {
        formData.value.color = normalized
      }
    }
  },
)

const handleClose = () => {
  if (!loading.value) {
    emit('close')
  }
}

const handleSubmit = async () => {
  error.value = null

  // Validation
  if (!formData.value.dress_code_type || !formData.value.time_period || !formData.value.gender) {
    error.value = t('management.dressCode.modal.errors.required')
    return
  }

  loading.value = true

  try {
    let response

    if (isEditing.value && props.dressCode) {
      // Update existing dress code
      // For updates, we need to handle empty strings explicitly to clear fields
      const updateData: any = {
        dress_code_type: formData.value.dress_code_type as DressCodeType,
        time_period: formData.value.time_period as TimePeriod,
        gender: formData.value.gender as Gender,
        is_active: formData.value.is_active,
      }

      // Handle optional text fields - send empty string to clear, omit if unchanged
      const titleTrimmed = formData.value.title.trim()
      const descriptionTrimmed = formData.value.description.trim()
      const colorTrimmed = formData.value.color.trim()

      // Always include these fields in updates to allow clearing them
      updateData.title = titleTrimmed || ''
      updateData.description = descriptionTrimmed || ''
      updateData.color = colorTrimmed || ''

      // Handle image updates
      if (shouldRemoveImage.value && !formData.value.image) {
        updateData.image = null // Explicitly remove image
      } else if (formData.value.image) {
        updateData.image = formData.value.image // Upload new image
      }
      // If neither, don't include image field (keep existing)

      response = await dressCodeService.updateDressCode(props.eventId, props.dressCode.id, updateData)
    } else {
      // Create new dress code
      const createData: CreateDressCodeRequest = {
        dress_code_type: formData.value.dress_code_type as DressCodeType,
        time_period: formData.value.time_period as TimePeriod,
        gender: formData.value.gender as Gender,
        title: formData.value.title.trim() || undefined,
        description: formData.value.description.trim() || undefined,
        color: formData.value.color.trim() || undefined,
        is_active: formData.value.is_active,
        image: formData.value.image,
      }
      response = await dressCodeService.createDressCode(props.eventId, createData)
    }

    if (response.success && response.data) {
      emit('success', response.data)
      emit('close')
    } else {
      error.value = response.message || t('management.dressCode.modal.errors.saveFailed')
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : t('management.dressCode.modal.errors.saveError')
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
