<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="true" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <CreditCard v-if="isEditing" class="w-4.5 h-4.5" />
                    <Plus v-else class="w-4.5 h-4.5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">
                    {{ isEditing ? 'Edit Payment' : 'Add Payment' }}
                  </h2>
                </div>
                <button
                  @click="$emit('close')"
                  class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="savePaymentMethod" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div class="space-y-5">
                <!-- Basic Information -->
                <div class="space-y-3 sm:space-y-4">
                  <!-- Name -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="formData.name"
                      type="text"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      placeholder="e.g., Wedding Gift Fund, ABA Bank"
                    />
                  </div>

                  <!-- Payment Type and Method -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Type <span class="text-red-500">*</span>
                      </label>
                      <div class="relative">
                        <select
                          v-model="formData.payment_type"
                          required
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                        >
                          <option value="">Select type</option>
                          <option value="donation">Donation</option>
                          <option value="gift">Gift</option>
                          <option value="sponsorship">Sponsorship</option>
                        </select>
                        <svg
                          class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none"
                          viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Method <span class="text-red-500">*</span>
                      </label>
                      <div class="relative">
                        <select
                          v-model="formData.payment_method"
                          required
                          @change="handlePaymentMethodChange"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                        >
                          <option value="">Select method</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="qr_code">QR Code</option>
                          <option value="payment_url">Payment URL</option>
                        </select>
                        <svg
                          class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none"
                          viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Currency, Status & Description - Collapsible -->
                <div class="rounded-xl border border-slate-200 bg-white/70">
                  <button
                    type="button"
                    class="w-full flex items-center justify-between px-4 py-3"
                    @click="optionsOpen = !optionsOpen"
                    :aria-expanded="optionsOpen ? 'true' : 'false'"
                  >
                    <span class="text-sm font-medium text-slate-700">Additional Options</span>
                    <svg
                      class="h-4 w-4 text-slate-500 transition-transform"
                      :class="optionsOpen ? 'rotate-180' : ''"
                      viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <Transition name="collapse">
                    <div v-show="optionsOpen" class="px-4 pb-4">
                      <div class="space-y-3 sm:space-y-4">
                        <!-- Currency and Status -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">
                              Currency
                            </label>
                            <div class="relative">
                              <select
                                v-model="formData.currency"
                                class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                              >
                                <option value="USD">USD - US Dollar</option>
                                <option value="KHR">KHR - Cambodian Riel</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="JPY">JPY - Japanese Yen</option>
                                <option value="THB">THB - Thai Baht</option>
                                <option value="VND">VND - Vietnamese Dong</option>
                              </select>
                              <svg
                                class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none"
                                viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                              >
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </div>
                          </div>

                          <div class="flex items-center pt-6 sm:pt-8">
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
                          <label class="block text-sm font-medium text-slate-700 mb-2">
                            Description
                          </label>
                          <textarea
                            v-model="formData.description"
                            rows="2"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
                            placeholder="Optional instructions"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Bank Transfer Details - Always show for bank transfer -->
                <div v-if="formData.payment_method === 'bank_transfer'" class="space-y-3 sm:space-y-4">
                  <h4 class="text-sm font-semibold text-slate-900">Bank Details</h4>

                  <!-- Row 1: Bank and Account Name -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Bank <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.bank_name"
                        type="text"
                        required
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        placeholder="e.g., ABA Bank, ACLEDA"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Account Name <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.account_name"
                        type="text"
                        required
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        placeholder="Account holder name"
                      />
                    </div>
                  </div>

                  <!-- Row 2: Account Number and Payment Link -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Account Number <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.account_number"
                        type="text"
                        required
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        placeholder="Account number"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Payment Link
                      </label>
                      <input
                        v-model="formData.payment_url"
                        type="text"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        placeholder="https://... or payway://..."
                      />
                    </div>
                  </div>
                </div>

                <!-- QR Code Section - Show for bank transfer -->
                <div v-if="formData.payment_method === 'bank_transfer'" class="space-y-3 sm:space-y-4">
                  <h4 class="text-sm font-semibold text-slate-900">QR Code</h4>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Upload Section -->
                    <div class="space-y-3">
                      <div>
                        <div class="flex flex-col gap-2">
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
                            class="px-3.5 py-2.5 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <Upload class="w-4 h-4" />
                            <span>{{ qrCodeFile ? 'Change QR Code' : 'Upload QR Code' }}</span>
                          </button>
                          <span v-if="qrCodeFile" class="text-sm text-slate-600 truncate">
                            {{ qrCodeFile.name }}
                          </span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1">
                          Optional. Max 10MB
                        </p>
                      </div>

                      <!-- Uploaded Preview -->
                      <div
                        v-if="qrCodePreview || (isEditing && existingPaymentMethod?.qr_code_image)"
                      >
                        <p class="text-xs font-medium text-slate-700 mb-2">Your QR Code:</p>
                        <div class="relative">
                          <img
                            :src="qrCodePreview || getMediaUrl(existingPaymentMethod?.qr_code_image)"
                            alt="Your QR Code"
                            class="w-full h-48 object-contain border border-slate-200 rounded-lg bg-white"
                          />
                          <button
                            v-if="qrCodeFile"
                            type="button"
                            @click="handleOpenCropper"
                            class="mt-2 w-full px-3 py-1.5 text-xs bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            <span>Crop QR Code</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Reference Image Section -->
                    <div class="space-y-2">
                      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p class="text-xs font-semibold text-blue-900 mb-2">Reference Example:</p>
                        <img
                          src="/images/qr-code-reference.png"
                          alt="QR Code Example"
                          class="w-full h-48 object-contain border-2 border-blue-300 rounded-lg bg-white mb-2"
                        />
                        <p class="text-xs text-blue-800 leading-relaxed">
                          <strong>Important:</strong> Upload only the QR code part (the square pattern). Crop out any text, logos, or surrounding content.
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

                <!-- Simplified options for other payment methods -->
                <div v-if="formData.payment_method === 'qr_code'" class="space-y-3 sm:space-y-4">
                  <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p class="text-amber-800 text-sm">
                      For bank QR codes, use "Bank Transfer" method instead.
                    </p>
                  </div>
                </div>

                <div v-if="formData.payment_method === 'payment_url'" class="space-y-3 sm:space-y-4">
                  <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p class="text-amber-800 text-sm">
                      For banking links, use "Bank Transfer" method instead.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Error Display -->
              <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3">
                <div class="flex items-center space-x-2">
                  <AlertCircle class="w-4 h-4 text-red-500" />
                  <p class="text-sm text-red-600 font-medium">{{ error }}</p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="loading || !isFormValid"
                  class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <span
                    v-if="loading"
                    class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  {{ loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update' : 'Create') }}
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
import { ref, reactive, computed, onMounted } from 'vue'
import { X, Upload, AlertCircle, CreditCard, Plus } from 'lucide-vue-next'
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
}

interface Emits {
  close: []
  saved: [paymentMethod: EventPaymentMethod]
}

const props = defineProps<Props>()
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

// Initialize form data for editing
onMounted(() => {
  if (isEditing.value && props.existingPaymentMethod) {
    const existing = props.existingPaymentMethod

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
  }
})
</script>

<style scoped>
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
  max-height: 1000px;
  opacity: 1;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Custom scrollbar for modal content */
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
