<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="drawer-backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="drawer-panel">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[32.5rem] lg:w-[35rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center justify-between px-3 py-2.5">
            <div class="flex items-center gap-2 min-w-0">
              <button
                @click="closeDrawer"
                class="p-1.5 hover:bg-white/20 rounded-lg drawer-close flex-shrink-0"
                :title="t('management.dressCode.drawer.closeTitle')"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <div class="flex items-center gap-2 min-w-0">
                <Shirt class="w-4 h-4 text-white flex-shrink-0" aria-hidden="true" />
                <h2 class="text-base font-semibold text-white truncate">
                  {{ isEditing ? t('management.dressCode.modal.titleEdit') : t('management.dressCode.modal.titleCreate') }}
                </h2>
              </div>
            </div>
            <!-- Delete (edit mode only) -->
            <button
              v-if="isEditing && dressCode"
              type="button"
              @click="emit('delete', dressCode)"
              :title="t('management.dressCode.drawer.deleteBtn')"
              :aria-label="t('management.dressCode.drawer.deleteBtn')"
              class="p-1.5 hover:bg-white/20 rounded-lg drawer-close flex-shrink-0"
            >
              <Trash2 class="w-5 h-5 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <form id="dress-code-form" @submit.prevent="handleSubmit" class="p-4 space-y-5 pb-24">
            <!-- Error banner -->
            <Transition name="drawer-reveal">
              <div v-if="error" class="grid grid-rows-[1fr]">
                <div class="min-h-0 overflow-hidden">
                  <div class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p class="flex-1 text-sm text-red-700">{{ error }}</p>
                    <button
                      type="button"
                      @click="error = null"
                      class="flex-shrink-0 text-red-400 hover:text-red-600"
                      :aria-label="t('management.dressCode.drawer.dismissError')"
                    >
                      <X class="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Details -->
            <div class="space-y-3">
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('management.dressCode.drawer.detailsHeading') }}
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Dress Code Type -->
                <div>
                  <label for="dress-code-type" class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.dressCode.modal.fields.dressCodeType') }} *
                  </label>
                  <div class="relative">
                    <select
                      id="dress-code-type"
                      v-model="formData.dress_code_type"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-10"
                    >
                      <option value="">{{ t('management.dressCode.modal.fields.selectDressCodeType') }}</option>
                      <option v-for="(label, value) in translatedDressCodeTypes" :key="value" :value="value">
                        {{ label }}
                      </option>
                    </select>
                    <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  </div>
                </div>

                <!-- Custom Title -->
                <div>
                  <label for="dress-code-title" class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.dressCode.modal.fields.customTitle') }}
                    <span class="text-xs text-slate-500">({{ t('management.dressCode.modal.fields.customTitleOptional') }})</span>
                  </label>
                  <input
                    id="dress-code-title"
                    v-model="formData.title"
                    type="text"
                    maxlength="100"
                    :placeholder="t('management.dressCode.modal.fields.customTitlePlaceholder')"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <!-- Time Period -->
                <div>
                  <label for="dress-code-time" class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.dressCode.modal.fields.timePeriod') }} *
                  </label>
                  <div class="relative">
                    <select
                      id="dress-code-time"
                      v-model="formData.time_period"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-10"
                    >
                      <option value="">{{ t('management.dressCode.modal.fields.selectTimePeriod') }}</option>
                      <option v-for="(label, value) in translatedTimePeriods" :key="value" :value="value">
                        {{ label }}
                      </option>
                    </select>
                    <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  </div>
                </div>

                <!-- Gender -->
                <div>
                  <label for="dress-code-gender" class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.dressCode.modal.fields.gender') }} *
                  </label>
                  <div class="relative">
                    <select
                      id="dress-code-gender"
                      v-model="formData.gender"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-10"
                    >
                      <option value="">{{ t('management.dressCode.modal.fields.selectGender') }}</option>
                      <option v-for="(label, value) in translatedGenders" :key="value" :value="value">
                        {{ label }}
                      </option>
                    </select>
                    <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label for="dress-code-description" class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.dressCode.modal.description.label') }}
                  <span class="text-xs text-slate-500">({{ t('management.dressCode.modal.fields.customTitleOptional') }})</span>
                </label>
                <textarea
                  id="dress-code-description"
                  v-model="formData.description"
                  rows="3"
                  :placeholder="t('management.dressCode.modal.description.placeholder')"
                  class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white resize-none"
                ></textarea>
              </div>
            </div>

            <!-- Display Options -->
            <div class="space-y-3">
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('management.dressCode.modal.displayOptions.label') }}
              </p>

              <!-- Theme Color -->
              <div>
                <label for="dress-code-color" class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.dressCode.modal.displayOptions.themeColor') }}
                </label>
                <div class="flex items-center gap-3">
                  <input
                    v-model="formData.color"
                    type="color"
                    class="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer flex-shrink-0"
                    :aria-label="t('management.dressCode.modal.displayOptions.themeColor')"
                  />
                  <input
                    id="dress-code-color"
                    v-model="formData.color"
                    type="text"
                    placeholder="#3498db"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    maxlength="7"
                    class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white font-mono"
                  />
                </div>
                <p class="text-xs text-slate-500 mt-1.5">{{ t('management.dressCode.modal.displayOptions.themeColorHint') }}</p>
              </div>

              <!-- Active toggle row -->
              <div
                class="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                @click="formData.is_active = !formData.is_active"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                    <Eye class="w-4 h-4 text-sky-500" aria-hidden="true" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-700">{{ t('management.dressCode.modal.displayOptions.activeStatus') }}</p>
                    <p class="text-xs text-slate-500">{{ t('management.dressCode.modal.displayOptions.activeStatusHint') }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="formData.is_active"
                  :aria-label="t('management.dressCode.modal.displayOptions.activeStatus')"
                  @click.stop="formData.is_active = !formData.is_active"
                  class="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200"
                  :class="formData.is_active ? 'bg-sky-500' : 'bg-slate-200'"
                >
                  <span
                    class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5 ml-0.5"
                    :style="{ transform: formData.is_active ? 'translateX(20px)' : 'translateX(0)' }"
                  ></span>
                </button>
              </div>

              <!-- Mobile position control (edit mode only) -->
              <div v-if="isEditing && maxOrder > 0" class="sm:hidden">
                <label class="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
                  <ArrowUpDown class="w-3.5 h-3.5" aria-hidden="true" />
                  {{ t('management.dressCode.drawer.position.label') }}
                </label>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="formData.order = 0"
                    :disabled="formData.order <= 0"
                    class="p-2 rounded-lg border transition-all duration-150"
                    :class="formData.order <= 0
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 active:bg-slate-200'"
                    :title="t('management.dressCode.drawer.position.moveToFirst')"
                  >
                    <ChevronsUp class="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    @click="formData.order = Math.max(0, formData.order - 1)"
                    :disabled="formData.order <= 0"
                    class="p-2 rounded-lg border transition-all duration-150"
                    :class="formData.order <= 0
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 active:bg-slate-200'"
                    :title="t('management.dressCode.drawer.position.moveUp')"
                  >
                    <ChevronUp class="w-4 h-4" aria-hidden="true" />
                  </button>
                  <div class="flex-1 text-center">
                    <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-medium text-slate-700">
                      {{ formData.order + 1 }}
                      <span class="text-slate-400">{{ t('management.dressCode.drawer.position.of') }}</span>
                      {{ maxOrder + 1 }}
                    </span>
                  </div>
                  <button
                    type="button"
                    @click="formData.order = Math.min(maxOrder, formData.order + 1)"
                    :disabled="formData.order >= maxOrder"
                    class="p-2 rounded-lg border transition-all duration-150"
                    :class="formData.order >= maxOrder
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 active:bg-slate-200'"
                    :title="t('management.dressCode.drawer.position.moveDown')"
                  >
                    <ChevronDown class="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    @click="formData.order = maxOrder"
                    :disabled="formData.order >= maxOrder"
                    class="p-2 rounded-lg border transition-all duration-150"
                    :class="formData.order >= maxOrder
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 active:bg-slate-200'"
                    :title="t('management.dressCode.drawer.position.moveToLast')"
                  >
                    <ChevronsDown class="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Reference Image -->
            <div class="space-y-3">
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('management.dressCode.modal.referenceImage.label') }}
              </p>

              <!-- Current Image Preview (for editing) -->
              <div v-if="isEditing && dressCode?.image && !imagePreview && !shouldRemoveImage">
                <div class="relative inline-block">
                  <img
                    :src="dressCode.image"
                    :alt="t('management.dressCode.modal.referenceImage.label')"
                    class="h-32 w-auto rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    @click="removeCurrentImage"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    :aria-label="t('management.dressCode.drawer.removeImage')"
                  >
                    <X class="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
                <p class="text-xs text-slate-500 mt-1.5">{{ t('management.dressCode.modal.referenceImage.currentImageHint') }}</p>
              </div>

              <!-- New Image Preview -->
              <div v-if="imagePreview">
                <div class="relative inline-block">
                  <img
                    :src="imagePreview"
                    :alt="t('management.dressCode.modal.referenceImage.newImagePreview')"
                    class="h-32 w-auto rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    @click="removeImage"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    :aria-label="t('management.dressCode.drawer.removeImage')"
                  >
                    <X class="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
                <p class="text-xs text-slate-500 mt-1.5">{{ t('management.dressCode.modal.referenceImage.newImagePreview') }}</p>
              </div>

              <!-- Upload box -->
              <div
                @click="triggerFileInput"
                class="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-4 text-center cursor-pointer hover:border-emerald-400 hover:bg-slate-100/50 transition-all duration-300 group"
              >
                <Upload class="w-6 h-6 text-slate-400 group-hover:text-emerald-600 mx-auto mb-2 transition-colors" aria-hidden="true" />
                <p class="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
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
          </form>
        </div>

        <!-- Footer -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <div class="flex items-center justify-between">
            <button
              type="submit"
              form="dress-code-form"
              :disabled="loading || !formData.dress_code_type || !formData.time_period || !formData.gender"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 drawer-action shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader v-if="loading" class="w-4 h-4 animate-spin" aria-hidden="true" />
              <Save v-else class="w-4 h-4" aria-hidden="true" />
              <span>
                {{ loading
                  ? (isEditing ? t('management.dressCode.modal.actions.updating') : t('management.dressCode.modal.actions.creating'))
                  : (isEditing ? t('management.dressCode.modal.actions.update') : t('management.dressCode.modal.actions.create')) }}
              </span>
            </button>

            <button
              type="button"
              @click="closeDrawer"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
            >
              {{ t('management.dressCode.modal.actions.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  ArrowRight,
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Eye,
  Loader,
  Save,
  Shirt,
  Trash2,
  Upload,
  X,
} from 'lucide-vue-next'
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
  modelValue: boolean
  eventId: string
  /** Dress code being edited; null/undefined = create mode */
  dressCode?: EventDressCode | null
  /** Highest sibling order (count - 1), for the mobile position control */
  maxOrder?: number
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  /** Saved on the server; requestedOrder is set when the mobile position control changed the order */
  (e: 'saved', dressCode: EventDressCode, requestedOrder?: number): void
  (e: 'delete', dressCode: EventDressCode): void
}

const props = withDefaults(defineProps<Props>(), {
  dressCode: null,
  maxOrder: 0,
})
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
  order: number
  image?: File
}>({
  dress_code_type: '',
  time_period: '',
  gender: '',
  title: '',
  description: '',
  color: '#3498db',
  is_active: true,
  order: 0,
})

const fileInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const shouldRemoveImage = ref(false)

const resetForm = () => {
  formData.value = {
    dress_code_type: '',
    time_period: '',
    gender: '',
    title: '',
    description: '',
    color: '#3498db',
    is_active: true,
    order: 0,
  }
  imagePreview.value = null
  error.value = null
  shouldRemoveImage.value = false
  if (fileInput.value) fileInput.value.value = ''
}

const initializeForm = () => {
  if (props.dressCode) {
    formData.value = {
      dress_code_type: props.dressCode.dress_code_type,
      time_period: props.dressCode.time_period,
      gender: props.dressCode.gender,
      title: props.dressCode.title || '',
      description: props.dressCode.description || '',
      color: props.dressCode.color || '#3498db',
      is_active: props.dressCode.is_active,
      order: props.dressCode.order,
    }
    imagePreview.value = null
    shouldRemoveImage.value = false
    error.value = null
  } else {
    resetForm()
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    error.value = t('management.dressCode.modal.errors.imageTooLarge')
    return
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    error.value = t('management.dressCode.modal.errors.invalidFormat')
    return
  }

  formData.value.image = file
  shouldRemoveImage.value = false

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
  if (fileInput.value) fileInput.value.value = ''
}

const removeCurrentImage = () => {
  shouldRemoveImage.value = true
  imagePreview.value = null
}

// Ensure color is always in hex format
const normalizeColor = (color: string): string => {
  color = color.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color.toLowerCase()
  if (/^[0-9A-Fa-f]{6}$/.test(color)) return `#${color.toLowerCase()}`
  return '#3498db'
}

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

const closeDrawer = () => {
  if (!loading.value) {
    emit('update:modelValue', false)
  }
}

const handleSubmit = async () => {
  error.value = null

  if (!formData.value.dress_code_type || !formData.value.time_period || !formData.value.gender) {
    error.value = t('management.dressCode.modal.errors.required')
    return
  }

  loading.value = true

  try {
    let response

    if (isEditing.value && props.dressCode) {
      const updateData: Record<string, unknown> = {
        dress_code_type: formData.value.dress_code_type as DressCodeType,
        time_period: formData.value.time_period as TimePeriod,
        gender: formData.value.gender as Gender,
        is_active: formData.value.is_active,
        // Always include text fields so clearing them persists
        title: formData.value.title.trim(),
        description: formData.value.description.trim(),
        color: formData.value.color.trim(),
      }

      if (shouldRemoveImage.value && !formData.value.image) {
        updateData.image = null
      } else if (formData.value.image) {
        updateData.image = formData.value.image
      }

      response = await dressCodeService.updateDressCode(props.eventId, props.dressCode.id, updateData)
    } else {
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
      const orderChanged = isEditing.value && props.dressCode && formData.value.order !== props.dressCode.order
      emit('saved', response.data, orderChanged ? formData.value.order : undefined)
      emit('update:modelValue', false)
    } else {
      error.value = response.message || t('management.dressCode.modal.errors.saveFailed')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('management.dressCode.modal.errors.saveError')
  } finally {
    loading.value = false
  }
}

// Prevent layout shift when locking body scroll
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeDrawer()
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      initializeForm()

      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.removeEventListener('keydown', handleKeydown)
    }
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}</style>
