<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="props.show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="props.show"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] laptop-sm:w-[560px] laptop-md:w-[620px] desktop:w-[680px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="$emit('close')"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-semibold text-white">
                  {{ isEditing ? 'Edit Payment Method' : 'Add Payment Method' }}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!-- Error Display -->
          <div
            v-if="error"
            class="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
          >
            <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-red-700">{{ error }}</p>
              <button
                type="button"
                @click="error = null"
                class="text-xs text-red-600 hover:text-red-700 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="savePaymentMethod" class="p-3 laptop-sm:p-4 space-y-4 laptop-sm:space-y-5 pb-24">
            <!-- Basic Information -->
            <div class="space-y-4">
              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  Name <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  placeholder="e.g., Wedding Gift Fund, ABA Bank"
                />
              </div>

              <!-- Payment Type and Method -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">
                    Type <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      v-model="formData.payment_type"
                      required
                      class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-8"
                    >
                      <option value="">Select</option>
                      <option value="donation">Donation</option>
                      <option value="gift">Gift</option>
                      <option value="sponsorship">Sponsorship</option>
                    </select>
                    <ChevronDown class="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">
                    Method <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      v-model="formData.payment_method"
                      required
                      @change="handlePaymentMethodChange"
                      class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-8"
                    >
                      <option value="">Select</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="qr_code">QR Code</option>
                      <option value="payment_url">Payment URL</option>
                    </select>
                    <ChevronDown class="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Additional Options - Collapsible -->
            <div class="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                @click="optionsOpen = !optionsOpen"
              >
                <span class="text-sm font-medium text-slate-700">Additional Options</span>
                <ChevronDown
                  class="w-4 h-4 text-slate-400 transition-transform"
                  :class="optionsOpen ? 'rotate-180' : ''"
                />
              </button>
              <Transition name="collapse">
                <div v-show="optionsOpen" class="px-4 pb-4 pt-3 border-t border-slate-200">
                  <div class="space-y-3">
                    <!-- Currency and Status -->
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1.5">
                          Currency
                        </label>
                        <div class="relative">
                          <select
                            v-model="formData.currency"
                            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-8"
                          >
                            <option value="USD">USD</option>
                            <option value="KHR">KHR</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="JPY">JPY</option>
                            <option value="THB">THB</option>
                            <option value="VND">VND</option>
                          </select>
                          <ChevronDown class="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div class="flex items-center pt-6">
                        <label class="flex items-center">
                          <input
                            v-model="formData.is_active"
                            type="checkbox"
                            class="w-4 h-4 text-[#1e90ff] border-gray-300 rounded focus:ring-[#1e90ff]"
                          />
                          <span class="ml-2 text-sm font-medium text-slate-700">Active</span>
                        </label>
                      </div>
                    </div>

                    <!-- Description -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-1.5">
                        Description
                      </label>
                      <textarea
                        v-model="formData.description"
                        rows="2"
                        class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white resize-none"
                        placeholder="Optional instructions"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Bank Transfer Details -->
            <div v-if="formData.payment_method === 'bank_transfer'" class="space-y-4">
              <h4 class="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Building2 class="w-4 h-4 text-[#1e90ff]" />
                Bank Details
              </h4>

              <!-- Bank and Account Name -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">
                    Bank <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.bank_name"
                    type="text"
                    required
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    placeholder="e.g., ABA Bank"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">
                    Account Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.account_name"
                    type="text"
                    required
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    placeholder="Account holder"
                  />
                </div>
              </div>

              <!-- Account Number and Payment Link -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">
                    Account Number <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.account_number"
                    type="text"
                    required
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    placeholder="Account number"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">
                    Payment Link
                  </label>
                  <input
                    v-model="formData.payment_url"
                    type="text"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <!-- QR Code Section -->
            <div v-if="formData.payment_method === 'bank_transfer'" class="space-y-3">
              <h4 class="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <QrCode class="w-4 h-4 text-[#1e90ff]" />
                QR Code
              </h4>

              <div class="grid grid-cols-2 gap-3">
                <!-- Upload Section -->
                <div class="space-y-2">
                  <input
                    ref="qrCodeInput"
                    type="file"
                    accept="image/*"
                    @change="handleQrCodeUpload($event)"
                    class="hidden"
                  />
                  <button
                    type="button"
                    @click="($refs.qrCodeInput as HTMLInputElement)?.click()"
                    class="w-full px-3 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload class="w-4 h-4" />
                    <span>{{ qrCodeFile ? 'Change' : 'Upload' }}</span>
                  </button>
                  <p class="text-xs text-slate-500 text-center">Optional. Max 10MB</p>

                  <!-- Uploaded Preview -->
                  <div
                    v-if="qrCodePreview || (isEditing && existingPaymentMethod?.qr_code_image)"
                    class="mt-2"
                  >
                    <img
                      :src="qrCodePreview || getMediaUrl(existingPaymentMethod?.qr_code_image)"
                      alt="Your QR Code"
                      class="w-full h-32 object-contain border border-slate-200 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      @click="qrCodeFile ? handleOpenCropper() : handleCropExistingImage()"
                      class="mt-1.5 w-full px-2 py-1 text-xs bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      <span>Crop</span>
                    </button>
                  </div>
                </div>

                <!-- Reference Image Section -->
                <div>
                  <div class="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <p class="text-xs font-semibold text-blue-900 mb-1.5">Reference:</p>
                    <img
                      src="/images/qr-code-reference.png"
                      alt="QR Code Example"
                      class="w-full h-32 object-contain border border-blue-300 rounded-lg bg-white"
                    />
                    <p class="text-[10px] text-blue-800 mt-1.5 leading-relaxed">
                      Upload only the QR code pattern. Crop out text/logos.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Image Cropper Modal -->
            <ImageCropperModal
              :show="showCropper"
              :image-source="cropperImage || ''"
              title="Crop QR Code"
              :aspect-ratio="1"
              help-text="Crop to include only the QR code pattern"
              @close="closeCropper"
              @apply="applyCrop"
              @update:cropper-ref="setCropperRef"
            />

            <!-- Info for other payment methods -->
            <div v-if="formData.payment_method === 'qr_code'" class="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p class="text-amber-800 text-sm">
                For bank QR codes, use "Bank Transfer" method instead.
              </p>
            </div>

            <div v-if="formData.payment_method === 'payment_url'" class="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p class="text-amber-800 text-sm">
                For banking links, use "Bank Transfer" method instead.
              </p>
            </div>
          </form>
        </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              @click="savePaymentMethod"
              :disabled="loading || !isFormValid"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader v-if="loading" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{ loading ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}</span>
            </button>

            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ArrowRight, Upload, AlertCircle, ChevronDown, Building2, QrCode, Save, Loader } from 'lucide-vue-next'
import {
  paymentMethodsService,
  type EventPaymentMethod,
  type CreatePaymentMethodRequest,
} from '../services/api'
import ImageCropperModal from './common/ImageCropperModal.vue'
import { useImageCropper } from '@/composables/useImageCropper'

interface Props {
  eventId: string
  existingPaymentMethod?: EventPaymentMethod
  show?: boolean
}

interface Emits {
  close: []
  saved: [paymentMethod: EventPaymentMethod]
}

const props = withDefaults(defineProps<Props>(), {
  show: true
})
const emit = defineEmits<Emits>()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const qrCodeFile = ref<File | null>(null)
const qrCodePreview = ref<string | null>(null)
const optionsOpen = ref(false)

// Image cropper composable
const { showCropper, cropperImage, openCropper, closeCropper, applyCrop: applyCropFn, setCropperRef } = useImageCropper()

// Computed
const isEditing = computed(() => !!props.existingPaymentMethod)

// Form data
const formData = reactive<CreatePaymentMethodRequest>({
  name: '',
  payment_type: 'gift',
  payment_method: 'bank_transfer',
  currency: 'USD',
  is_active: true,
  description: '',
  order: 0,
  // Bank transfer fields
  bank_name: '',
  account_name: '',
  account_number: '',
  // Payment URL fields
  payment_url: '',
})

// Computed form validation
const isFormValid = computed(() => {
  if (!formData.name || !formData.payment_type || !formData.payment_method) {
    return false
  }

  if (formData.payment_method === 'bank_transfer') {
    // Require bank details
    if (!formData.bank_name || !formData.account_name || !formData.account_number) {
      return false
    }
    // Bank transfer is valid even without QR code or payment URL (they're optional)
    return true
  }

  // For backward compatibility, keep the old validation for qr_code and payment_url
  if (formData.payment_method === 'qr_code') {
    return !!(qrCodeFile.value || (isEditing.value && props.existingPaymentMethod?.qr_code_image))
  }

  if (formData.payment_method === 'payment_url') {
    // Accept both HTTPS URLs and deep link URLs (custom protocols)
    const urlPattern = /^(https?:\/\/|[a-zA-Z][a-zA-Z0-9+.-]*:\/\/)/
    return !!(formData.payment_url && urlPattern.test(formData.payment_url))
  }

  return true
})

// Helper methods
const getMediaUrl = (mediaUrl: string | null | undefined): string | undefined => {
  if (!mediaUrl) return undefined

  // If it's already a full URL, return as is
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl
  }

  // If it's a relative URL, prepend the API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (mediaUrl.startsWith('/')) {
    return `${API_BASE_URL}${mediaUrl}`
  }

  // If it doesn't start with /, assume it needs /media/ prefix
  return `${API_BASE_URL}/media/${mediaUrl}`
}

const validateFile = (file: File): boolean => {
  error.value = null

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!validTypes.includes(file.type)) {
    error.value = 'Invalid file type. Please upload JPG, PNG, GIF, or WebP images.'
    return false
  }

  if (file.size > maxSize) {
    error.value = 'File too large. Maximum size is 10MB.'
    return false
  }

  return true
}

const handlePaymentMethodChange = () => {
  // Reset method-specific fields when payment method changes
  if (formData.payment_method !== 'bank_transfer') {
    formData.bank_name = ''
    formData.account_name = ''
    formData.account_number = ''
    // Also clear QR code and payment URL for non-bank transfer methods
    qrCodeFile.value = null
    qrCodePreview.value = null
    formData.payment_url = ''
  }

  // For backward compatibility with standalone qr_code and payment_url
  if (formData.payment_method === 'qr_code') {
    formData.bank_name = ''
    formData.account_name = ''
    formData.account_number = ''
    formData.payment_url = ''
  }

  if (formData.payment_method === 'payment_url') {
    formData.bank_name = ''
    formData.account_name = ''
    formData.account_number = ''
    qrCodeFile.value = null
    qrCodePreview.value = null
  }

  error.value = null
}

const handleQrCodeUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file && validateFile(file)) {
    qrCodeFile.value = file

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      qrCodePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Reset input
  target.value = ''
}

const handleOpenCropper = () => {
  if (qrCodePreview.value) {
    openCropper(qrCodePreview.value, qrCodeFile.value)
  }
}

const handleCropExistingImage = async () => {
  // Determine which image to crop: preview (if new image uploaded) or existing qr_code_image
  let imageUrl = qrCodePreview.value

  // If no preview, use the existing qr_code_image with full URL
  if (!imageUrl && props.existingPaymentMethod?.qr_code_image) {
    const fullUrl = getMediaUrl(props.existingPaymentMethod.qr_code_image)
    if (fullUrl) {
      imageUrl = fullUrl
    }
  }

  if (!imageUrl) return

  try {
    // Fetch the existing image as a blob
    const response = await fetch(imageUrl)
    const blob = await response.blob()

    // Create a File object from the blob
    const fileName = imageUrl.split('/').pop() || 'qr-code.png'
    const file = new File([blob], fileName, { type: blob.type })

    // Set the file and open cropper
    qrCodeFile.value = file
    openCropper(imageUrl, file)
  } catch (err) {
    console.error('Error loading image for cropping:', err)
    error.value = 'Failed to load image for cropping. Please try uploading a new image.'
  }
}

const applyCrop = async () => {
  // For QR codes, limit to max 800x800 PNG
  // This keeps them sharp while reducing file size significantly
  const result = await applyCropFn({
    outputFileName: qrCodeFile.value?.name || 'cropped-qr.png',
    outputFormat: 'image/png',
    outputQuality: 0.95,
    aspectRatio: 1,
    maxWidth: 800,
    maxHeight: 800,
  })

  if (result) {
    qrCodeFile.value = result.file
    qrCodePreview.value = result.preview
  }
}

const savePaymentMethod = async () => {
  if (!isFormValid.value) return

  loading.value = true
  error.value = null

  try {
    let response

    // For bank transfer with QR code, handle file upload
    if (formData.payment_method === 'bank_transfer' && qrCodeFile.value) {
      const formDataWithFile = new FormData()

      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formDataWithFile.append(key, value.toString())
        }
      })

      // Add QR code file
      formDataWithFile.append('qr_code_image', qrCodeFile.value)

      if (isEditing.value && props.existingPaymentMethod) {
        response = await paymentMethodsService.updatePaymentMethodWithFile(
          props.eventId,
          props.existingPaymentMethod.id,
          formDataWithFile,
        )
      } else {
        response = await paymentMethodsService.createPaymentMethodWithFile(
          props.eventId,
          formDataWithFile,
        )
      }
    }
    // Legacy support for standalone qr_code type
    else if (formData.payment_method === 'qr_code' && qrCodeFile.value) {
      const formDataWithFile = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        if (
          key !== 'bank_name' &&
          key !== 'account_name' &&
          key !== 'account_number' &&
          key !== 'payment_url' &&
          value !== null &&
          value !== undefined &&
          value !== ''
        ) {
          formDataWithFile.append(key, value.toString())
        }
      })

      formDataWithFile.append('qr_code_image', qrCodeFile.value)

      if (isEditing.value && props.existingPaymentMethod) {
        response = await paymentMethodsService.updatePaymentMethodWithFile(
          props.eventId,
          props.existingPaymentMethod.id,
          formDataWithFile,
        )
      } else {
        response = await paymentMethodsService.createPaymentMethodWithFile(
          props.eventId,
          formDataWithFile,
        )
      }
    } else {
      // Handle regular JSON update/create
      const requestData = { ...formData }

      // Clean up fields based on payment method (for legacy support)
      if (formData.payment_method !== 'bank_transfer') {
        delete requestData.bank_name
        delete requestData.account_name
        delete requestData.account_number
      }

      if (
        formData.payment_method !== 'payment_url' &&
        formData.payment_method !== 'bank_transfer'
      ) {
        delete requestData.payment_url
      }

      if (isEditing.value && props.existingPaymentMethod) {
        response = await paymentMethodsService.patchPaymentMethod(
          props.eventId,
          props.existingPaymentMethod.id,
          requestData,
        )
      } else {
        response = await paymentMethodsService.createPaymentMethod(props.eventId, requestData)
      }
    }

    if (response.success && response.data) {
      emit('saved', response.data)
    } else {
      error.value =
        response.message || `Failed to ${isEditing.value ? 'update' : 'create'} payment method`
    }
  } catch (err) {
    console.error('Error saving payment method:', err)
    error.value = 'Network error occurred while saving payment method'
  } finally {
    loading.value = false
  }
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for drawer open - lock body scroll
watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  },
  { immediate: true }
)

// Reset form to defaults
const resetForm = () => {
  Object.assign(formData, {
    name: '',
    payment_type: 'gift',
    payment_method: 'bank_transfer',
    currency: 'USD',
    is_active: true,
    description: '',
    order: 0,
    bank_name: '',
    account_name: '',
    account_number: '',
    payment_url: '',
  })
  qrCodeFile.value = null
  qrCodePreview.value = null
  error.value = null
  optionsOpen.value = false
}

// Initialize form data when drawer opens or existingPaymentMethod changes
watch(
  [() => props.show, () => props.existingPaymentMethod],
  ([isOpen, existing]) => {
    if (isOpen) {
      if (existing) {
        // Editing mode - populate form with existing data
        Object.assign(formData, {
          name: existing.name,
          payment_type: existing.payment_type,
          payment_method: existing.payment_method,
          currency: existing.currency || 'USD',
          is_active: existing.is_active,
          description: existing.description || '',
          order: existing.order,
          // Bank transfer fields
          bank_name: existing.bank_name || '',
          account_name: existing.account_name || '',
          account_number: existing.account_number || '',
          // Payment URL fields
          payment_url: existing.payment_url || '',
        })
        // Clear any previous upload state
        qrCodeFile.value = null
        qrCodePreview.value = null
        error.value = null
      } else {
        // Adding mode - reset form
        resetForm()
      }
    }
  },
  { immediate: true }
)

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}

/* Collapse transition */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 500px;
  opacity: 1;
}

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
}
</style>
