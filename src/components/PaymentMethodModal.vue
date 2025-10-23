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
            <!-- Header (neutral style) -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <CreditCard class="w-5 h-5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">
                    {{ isEditing ? 'Edit Payment Method' : 'Add Payment Method' }}
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
                  <h4 class="text-sm font-semibold text-slate-900 flex items-center">
                    <Info class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Basic Information
                  </h4>

                  <!-- Name -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Payment Method Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="formData.name"
                      type="text"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      placeholder="e.g., Wedding Gift Fund, ABA Bank Account"
                    />
                  </div>

                  <!-- Payment Type and Method -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Payment Type <span class="text-red-500">*</span>
                      </label>
                      <select
                        v-model="formData.payment_type"
                        required
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      >
                        <option value="">Select payment type</option>
                        <option value="donation">Donation</option>
                        <option value="gift">Gift</option>
                        <option value="sponsorship">Sponsorship</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Payment Method <span class="text-red-500">*</span>
                      </label>
                      <select
                        v-model="formData.payment_method"
                        required
                        @change="handlePaymentMethodChange"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      >
                        <option value="">Select payment method</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="qr_code">QR Code</option>
                        <option value="payment_url">Payment URL</option>
                      </select>
                    </div>
                  </div>

                  <!-- Currency and Status -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Currency
                      </label>
                      <select
                        v-model="formData.currency"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="KHR">KHR - Cambodian Riel</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                        <option value="THB">THB - Thai Baht</option>
                        <option value="VND">VND - Vietnamese Dong</option>
                      </select>
                    </div>

                    <div class="flex items-center space-x-3 sm:space-x-4 pt-6 sm:pt-8">
                      <label class="flex items-center">
                        <input
                          v-model="formData.is_active"
                          type="checkbox"
                          class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1e90ff] border-gray-300 rounded focus:ring-[#1e90ff]"
                        />
                        <span class="ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-slate-700">Active</span>
                      </label>
                    </div>
                  </div>

                  <!-- Description -->
                  <div>
                    <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                      Description
                    </label>
                    <textarea
                      v-model="formData.description"
                      rows="3"
                      class="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                      placeholder="Optional description or instructions for this payment method"
                    ></textarea>
                  </div>
                </div>

                <!-- Bank Transfer Details - Always show for bank transfer -->
                <div v-if="formData.payment_method === 'bank_transfer'" class="space-y-3 sm:space-y-4">
                  <h4 class="text-sm font-semibold text-slate-900 flex items-center">
                    <Building2 class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Bank Transfer Details
                  </h4>

                  <div class="grid grid-cols-1 gap-3 sm:gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Bank Name <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.bank_name"
                        type="text"
                        required
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        placeholder="e.g., ABA Bank, ACLEDA Bank"
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
                        placeholder="Account holder's name"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Account Number <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="formData.account_number"
                        type="text"
                        required
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        placeholder="Bank account number"
                      />
                    </div>
                  </div>
                </div>

                <!-- Payment Access Methods - Show all together for bank transfer -->
                <div v-if="formData.payment_method === 'bank_transfer'" class="space-y-3 sm:space-y-4">
                  <h4 class="text-sm font-semibold text-slate-900 flex items-center">
                    <CreditCard class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Payment Access Methods
                  </h4>
                  <p class="text-sm text-slate-600 mb-3">
                    Add multiple ways for users to access this bank account
                  </p>

                  <!-- QR Code Section -->
                  <div class="border border-slate-200 rounded-lg p-3">
                    <h5 class="text-sm font-medium text-slate-800 flex items-center mb-2">
                      <QrCode class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      QR Code for Bank Transfer
                    </h5>

                    <div class="space-y-3 sm:space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                          QR Code Image (Optional)
                        </label>
                        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
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
                            class="px-3.5 py-2.5 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors flex items-center space-x-2"
                          >
                            <Upload class="w-4 h-4" />
                            <span>{{ qrCodeFile ? 'Change QR Code' : 'Upload QR Code' }}</span>
                          </button>
                          <span v-if="qrCodeFile" class="text-sm text-slate-600 truncate">
                            {{ qrCodeFile.name }}
                          </span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1">
                          Upload a bank QR code for easy scanning (JPG, PNG, or GIF). Max size: 10MB
                        </p>
                      </div>

                      <!-- Preview -->
                      <div
                        v-if="qrCodePreview || (isEditing && existingPaymentMethod?.qr_code_image)"
                        class="mt-3"
                      >
                        <label class="block text-sm font-medium text-slate-700 mb-2"
                          >QR Code Preview:</label
                        >
                        <img
                          :src="qrCodePreview || getMediaUrl(existingPaymentMethod?.qr_code_image)"
                          alt="QR Code Preview"
                          class="w-48 h-48 object-contain border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Payment URL Section -->
                  <div class="border border-slate-200 rounded-lg p-3">
                    <h5 class="text-sm font-medium text-slate-800 flex items-center mb-2">
                      <Link class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Online Payment Link
                    </h5>

                    <div>
                      <label class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                        Payment URL (Optional)
                      </label>
                      <input
                        v-model="formData.payment_url"
                        type="url"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        placeholder="https://example.com/payment-link"
                      />
                      <p class="text-[10px] sm:text-xs text-slate-500 mt-1">
                        Online banking or payment gateway link (must be HTTPS)
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Simplified options for other payment methods -->
                <div v-if="formData.payment_method === 'qr_code'" class="space-y-3 sm:space-y-4">
                  <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p class="text-amber-800 text-sm">
                      <strong>Note:</strong> For bank transfer QR codes, please select "Bank
                      Transfer" as the payment method above.
                    </p>
                  </div>
                </div>

                <div v-if="formData.payment_method === 'payment_url'" class="space-y-3 sm:space-y-4">
                  <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p class="text-amber-800 text-sm">
                      <strong>Note:</strong> For online banking links, please select "Bank Transfer"
                      as the payment method above.
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
                  {{
                    loading
                      ? isEditing
                        ? 'Updating...'
                        : 'Creating...'
                      : isEditing
                        ? 'Update Payment Method'
                        : 'Create Payment Method'
                  }}
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
import { X, CreditCard, Info, Building2, QrCode, Link, Upload, AlertCircle } from 'lucide-vue-next'
import {
  paymentMethodsService,
  type EventPaymentMethod,
  type CreatePaymentMethodRequest,
} from '../services/api'

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
    return !!(formData.payment_url && formData.payment_url.startsWith('https://'))
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
