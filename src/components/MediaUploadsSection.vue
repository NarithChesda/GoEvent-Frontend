<template>
  <div class="space-y-6" @click="dropdownManager.handleClickOutside">
    <!-- Banner Image -->
    <MediaUploadCard
      title="Event Banner"
      description="Main hero image for your event (1200x630px recommended - Facebook ratio)"
      :media-url="getMediaUrl(eventData?.banner_image)"
      :can-edit="canEdit"
      :is-uploading="mediaUpload.isUploading.value('banner_image')"
      :show-dropdown="dropdownManager.isOpen('banner')"
      accept-types="image/*"
      content-type="image"
      empty-state-text="No banner image uploaded"
      :enable-cropping="true"
      @upload="handleBannerFileSelect"
      @remove="confirmRemove('banner_image', 'Delete Banner Image', 'Event Banner')"
      @toggle-dropdown="dropdownManager.toggleDropdown('banner')"
      @close-dropdown="dropdownManager.closeAllDropdowns()"
      @crop="openBannerCropper"
    />

    <!-- Logos Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Primary Logo -->
      <MediaUploadCard
        title="Primary Logo"
        description="Main event or organization logo. For best results, use a transparent image (PNG, WebP)"
        :media-url="getMediaUrl(eventData?.logo_one)"
        :can-edit="canEdit"
        :is-uploading="mediaUpload.isUploading.value('logo_one')"
        :show-dropdown="dropdownManager.isOpen('logoOne')"
        accept-types="image/*"
        content-type="image"
        image-class="h-[100px] object-contain bg-slate-50 p-4"
        empty-state-text="No logo uploaded"
        @upload="(file) => handleUpload('logo_one', file, 'image')"
        @remove="confirmRemove('logo_one', 'Delete Primary Logo', 'Primary Logo')"
        @toggle-dropdown="dropdownManager.toggleDropdown('logoOne')"
        @close-dropdown="dropdownManager.closeAllDropdowns()"
      >
        <template #content="{ mediaUrl }">
          <div class="relative group">
            <div class="h-48 flex items-center justify-center bg-slate-50 rounded-2xl p-6">
              <img
                :src="mediaUrl"
                :alt="eventData?.title + ' primary logo'"
                class="max-w-full max-h-full object-contain"
              />
            </div>
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
              <p class="text-white font-medium">Primary Logo</p>
            </div>
          </div>
        </template>
        <template #empty-state>
          <div class="flex flex-col items-center justify-center min-h-[120px]">
            <div
              :class="[
                'w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300',
                canEdit ? 'bg-slate-200 group-hover:bg-emerald-100' : 'bg-slate-200'
              ]"
            >
              <Plus
                v-if="canEdit"
                :class="[
                  'w-6 h-6 transition-colors',
                  'text-slate-400 group-hover:text-emerald-600'
                ]"
              />
              <ImageIcon v-else class="w-6 h-6 text-slate-400" />
            </div>
            <p
              :class="[
                'text-sm font-semibold transition-colors',
                canEdit ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-600'
              ]"
            >
              No logo uploaded
            </p>
            <p v-if="canEdit" class="text-xs text-slate-400 mt-1">Click to upload</p>
          </div>
        </template>
      </MediaUploadCard>

      <!-- Secondary Logo -->
      <MediaUploadCard
        title="Secondary Logo"
        description="Displayed when showcase is in other languages (English, etc.). Use transparent image (PNG, WebP)"
        :media-url="getMediaUrl(eventData?.logo_two)"
        :can-edit="canEdit"
        :is-uploading="mediaUpload.isUploading.value('logo_two')"
        :show-dropdown="dropdownManager.isOpen('logoTwo')"
        accept-types="image/*"
        content-type="image"
        image-class="h-[100px] object-contain bg-slate-50 p-4"
        empty-state-text="No logo uploaded"
        @upload="(file) => handleUpload('logo_two', file, 'image')"
        @remove="confirmRemove('logo_two', 'Delete Secondary Logo', 'Secondary Logo')"
        @toggle-dropdown="dropdownManager.toggleDropdown('logoTwo')"
        @close-dropdown="dropdownManager.closeAllDropdowns()"
      >
        <template #content="{ mediaUrl }">
          <div class="relative group">
            <div class="h-48 flex items-center justify-center bg-slate-50 rounded-2xl p-6">
              <img
                :src="mediaUrl"
                :alt="eventData?.title + ' secondary logo'"
                class="max-w-full max-h-full object-contain"
              />
            </div>
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
              <p class="text-white font-medium">Secondary Logo</p>
            </div>
          </div>
        </template>
        <template #empty-state>
          <div class="flex flex-col items-center justify-center min-h-[120px]">
            <div
              :class="[
                'w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300',
                canEdit ? 'bg-slate-200 group-hover:bg-emerald-100' : 'bg-slate-200'
              ]"
            >
              <Plus
                v-if="canEdit"
                :class="[
                  'w-6 h-6 transition-colors',
                  'text-slate-400 group-hover:text-emerald-600'
                ]"
              />
              <ImageIcon v-else class="w-6 h-6 text-slate-400" />
            </div>
            <p
              :class="[
                'text-sm font-semibold transition-colors',
                canEdit ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-600'
              ]"
            >
              No logo uploaded
            </p>
            <p v-if="canEdit" class="text-xs text-slate-400 mt-1">Click to upload</p>
          </div>
        </template>
      </MediaUploadCard>
    </div>

    <!-- Event Video (only shown for Standard template when active) -->
    <MediaUploadCard
      v-if="shouldShowVideoSection"
      title="Event Video"
      description="Upload a promotional or highlight video (Max 10MB)"
      :media-url="getMediaUrl(eventData?.event_video)"
      :can-edit="canEdit"
      :is-uploading="mediaUpload.isUploading.value('event_video')"
      :show-dropdown="dropdownManager.isOpen('video')"
      accept-types="video/*"
      content-type="video"
      empty-state-text="No video uploaded"
      empty-state-subtext="Consider using YouTube embed for large files"
      @upload="(file) => handleUpload('event_video', file, 'video')"
      @remove="confirmRemove('event_video', 'Delete Event Video', 'Event Video')"
      @toggle-dropdown="dropdownManager.toggleDropdown('video')"
      @close-dropdown="dropdownManager.closeAllDropdowns()"
    />

    <!-- Event Music -->
    <MediaUploadCard
      title="Event Music"
      description="Upload background music or audio content (Max 10MB)"
      :media-url="getMediaUrl(eventData?.music)"
      :can-edit="canEdit"
      :is-uploading="mediaUpload.isUploading.value('music')"
      :show-dropdown="dropdownManager.isOpen('music')"
      accept-types="audio/*"
      content-type="audio"
      empty-state-text="No music uploaded"
      empty-state-subtext="Upload audio files for background music"
      @upload="(file) => handleUpload('music', file, 'audio')"
      @remove="confirmRemove('music', 'Delete Event Music', 'Event Music')"
      @toggle-dropdown="dropdownManager.toggleDropdown('music')"
      @close-dropdown="dropdownManager.closeAllDropdowns()"
    />

    <!-- Error Display -->
    <div v-if="mediaUpload.error.value" class="bg-red-50 border border-red-200 rounded-2xl p-4">
      <div class="flex items-center space-x-2">
        <AlertCircle class="w-5 h-5 text-red-500" />
        <p class="text-red-600 font-medium">{{ mediaUpload.error.value }}</p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="mediaUpload.deleting.value"
      :title="deleteModalData.title"
      :item-name="deleteModalData.itemName"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteModal = false"
    />

    <!-- Banner Image Cropper Modal -->
    <ImageCropperModal
      v-if="showBannerCropper"
      :show="showBannerCropper"
      :image-source="bannerCropperImage"
      title="Crop Banner Image"
      :aspect-ratio="BANNER_ASPECT_RATIO"
      cropper-height="450px"
      help-text="Adjust the crop area to frame your banner image (1200x630px ratio)"
      @close="closeBannerCropper"
      @apply="handleBannerCropApply"
      @update:cropper-ref="setBannerCropperRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, toRef, watch, computed, reactive } from 'vue'
import { AlertCircle, Plus, ImageIcon } from 'lucide-vue-next'
import type { Event } from '@/services/api'
import { useMediaUpload, type MediaFieldName, type MediaType } from '@/composables/useMediaUpload'
import { useDropdownManager } from '@/composables/useDropdownManager'
import { useMediaUrl } from '@/composables/useMediaUrl'
import { usePaymentTemplateIntegration } from '@/composables/usePaymentTemplateIntegration'
import MediaUploadCard from './MediaUploadCard.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import ImageCropperModal from './common/ImageCropperModal.vue'

interface Props {
  eventData?: Event
  canEdit: boolean
}

interface Emits {
  (e: 'updated', event: Event): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const eventDataRef = toRef(props, 'eventData')
const mediaUpload = useMediaUpload(eventDataRef, (event) => emit('updated', event))
const dropdownManager = useDropdownManager(['banner', 'logoOne', 'logoTwo', 'video', 'music'])
const { getMediaUrl } = useMediaUrl()

// Create a reactive proxy for the event data to use with payment integration
// This is needed because usePaymentTemplateIntegration expects a plain object
const reactiveEventData = reactive({
  id: '',
  event_template: null as number | null | undefined,
  event_template_details: undefined as Event['event_template_details']
})

// Sync reactive event data with props
watch(
  () => props.eventData,
  (newData) => {
    if (newData) {
      reactiveEventData.id = newData.id
      reactiveEventData.event_template = newData.event_template ?? undefined
      reactiveEventData.event_template_details = newData.event_template_details ?? undefined
    }
  },
  { immediate: true }
)

// Initialize payment template integration
const paymentIntegration = usePaymentTemplateIntegration(reactiveEventData as Event)

// Check if video section should be shown
// Video section is only shown for Standard template when it's active
const shouldShowVideoSection = computed(() => {
  if (!props.eventData?.event_template_details || !props.eventData.event_template) {
    return false
  }

  // Check if template package plan name contains "standard" (case-insensitive)
  // The template type is identified by package_plan.name, not template.name
  const packagePlanName = props.eventData.event_template_details.package_plan?.name?.toLowerCase() || ''
  const isStandardTemplate = packagePlanName.includes('standard')

  if (!isStandardTemplate) {
    return false
  }

  // Check if template is activated via payment (confirmed payment exists)
  return paymentIntegration.isTemplateActivated.value
})

// Delete modal state
const showDeleteModal = ref(false)
const deleteModalData = ref<{
  title: string
  itemName: string
  fieldToDelete: MediaFieldName | ''
}>({
  title: '',
  itemName: '',
  fieldToDelete: ''
})

// Cropper state for banner image
const showBannerCropper = ref(false)
const bannerCropperImage = ref<string | null>(null)
const bannerCropperRef = ref<any>(null)
const pendingBannerFile = ref<File | null>(null)

// Banner aspect ratio: 1200x630 = 1.9047619... ≈ 40/21
const BANNER_ASPECT_RATIO = 1200 / 630

/**
 * Open cropper for existing banner image
 */
const openBannerCropper = () => {
  const bannerUrl = getMediaUrl(props.eventData?.banner_image)
  if (bannerUrl) {
    bannerCropperImage.value = bannerUrl
    showBannerCropper.value = true
  }
}

/**
 * Handle banner file selection - open cropper instead of direct upload
 * Skip file size validation since we'll compress after cropping
 */
const handleBannerFileSelect = (file: File) => {
  // Only validate file type, not size (will be compressed after crop)
  if (!file.type.startsWith('image/')) {
    return
  }

  // Store the file and open cropper
  pendingBannerFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    bannerCropperImage.value = e.target?.result as string
    showBannerCropper.value = true
  }
  reader.readAsDataURL(file)
}

/**
 * Handle crop apply - resize to 1200x630 and compress
 */
const handleBannerCropApply = async () => {
  if (!bannerCropperRef.value) return

  const { canvas } = bannerCropperRef.value.getResult()
  if (!canvas) return

  // Create a new canvas with exact 1200x630 dimensions
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = 1200
  outputCanvas.height = 630
  const ctx = outputCanvas.getContext('2d')
  if (!ctx) return

  // Draw the cropped image scaled to 1200x630
  ctx.drawImage(canvas, 0, 0, 1200, 630)

  outputCanvas.toBlob(async (blob: Blob | null) => {
    if (!blob) return

    const fileName = pendingBannerFile.value?.name?.replace(/\.[^/.]+$/, '.jpg') || 'banner.jpg'
    const croppedFile = new File([blob], fileName, { type: 'image/jpeg' })

    showBannerCropper.value = false
    bannerCropperImage.value = null
    pendingBannerFile.value = null

    await mediaUpload.uploadMedia('banner_image', croppedFile)
  }, 'image/jpeg', 0.85)
}

/**
 * Close banner cropper
 */
const closeBannerCropper = () => {
  showBannerCropper.value = false
  bannerCropperImage.value = null
  pendingBannerFile.value = null
}

/**
 * Set banner cropper ref
 */
const setBannerCropperRef = (ref: any) => {
  bannerCropperRef.value = ref
}

/**
 * Handle file upload with validation
 */
const handleUpload = async (
  fieldName: MediaFieldName,
  file: File,
  mediaType: MediaType
) => {
  const validation = mediaUpload.validateFile(file, mediaType)

  if (validation.valid) {
    await mediaUpload.uploadMedia(fieldName, file)
  }
}

/**
 * Show delete confirmation modal
 */
const confirmRemove = (
  fieldName: MediaFieldName,
  title: string,
  itemName: string
) => {
  deleteModalData.value = {
    title,
    itemName,
    fieldToDelete: fieldName
  }
  showDeleteModal.value = true
}

/**
 * Handle delete confirmation
 */
const handleDeleteConfirm = async () => {
  if (deleteModalData.value.fieldToDelete) {
    const success = await mediaUpload.removeMedia(deleteModalData.value.fieldToDelete)
    if (success) {
      showDeleteModal.value = false
    }
  }
}

// Clear error when eventData changes
watch(() => props.eventData, () => {
  mediaUpload.clearError()
})

// Load payments when event data is available
watch(
  () => props.eventData?.id,
  (eventId) => {
    if (eventId && props.eventData?.event_template) {
      paymentIntegration.loadPayments()
    }
  },
  { immediate: true }
)
</script>
