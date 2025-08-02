<template>
  <div class="space-y-6">
    <!-- Error Display -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">{{ error }}</div>
          <div class="mt-3">
            <button @click="error = null" class="text-sm text-red-600 hover:text-red-500 font-medium">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Status Overview -->
    <div class="bg-white rounded-lg border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
      
      <!-- Current Package Info -->
      <div v-if="currentPayment" class="mb-4 p-4 bg-blue-50 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-medium text-blue-900">{{ currentPayment.plan_name }}</h4>
            <p class="text-sm text-blue-700">${{ currentPayment.amount }}</p>
            <p class="text-xs text-blue-600">{{ currentPayment.payment_reference }}</p>
          </div>
          <div class="text-right">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusBadgeClass(currentPayment.status)">
              {{ getStatusDisplay(currentPayment.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- No Package Selected -->
      <div v-else class="mb-4 p-4 bg-gray-50 rounded-lg">
        <p class="text-gray-600">No payment package selected</p>
      </div>
    </div>

    <!-- Template-Based Package Selection -->
    <div class="bg-white rounded-lg border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Packages</h3>
      
      <!-- No Template Selected State -->
      <div v-if="!hasSelectedTemplate" class="text-center py-8">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a4 4 0 014-4h2.5l2 2h5.5a2 2 0 012 2v11a4 4 0 01-4 4H7zM7 8h10"></path>
          </svg>
        </div>
        <h4 class="text-lg font-semibold text-gray-900 mb-2">Select a Template First</h4>
        <p class="text-gray-600 mb-6 max-w-md mx-auto">
          You need to select an event template before you can view payment packages. Templates determine the available pricing plans for your event.
        </p>
        <button
          @click="redirectToTemplateTab"
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a4 4 0 014-4h2.5l2 2h5.5a2 2 0 012 2v11a4 4 0 01-4 4H7zM7 8h10"></path>
          </svg>
          Select Template
        </button>
      </div>

      <!-- Template Selected - Show Template Pricing Info -->
      <div v-else-if="hasSelectedTemplate" class="space-y-4">
        <!-- Current Template Info -->
        <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h4 class="font-medium text-blue-900">Selected Template</h4>
              <p class="text-sm text-blue-700">{{ templateName }}</p>
            </div>
            <div class="text-right">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {{ event?.event_template_enabled ? 'Active' : 'Selected' }}
              </span>
            </div>
          </div>
          
          <!-- Template Package Plan Info -->
          <div v-if="templatePackageDetails" class="border-t border-blue-200 pt-3">
            <div class="flex items-center justify-between">
              <div>
                <h5 class="font-medium text-blue-900">{{ templatePackageDetails.name }}</h5>
                <p class="text-sm text-blue-600">{{ templatePackageDetails.description }}</p>
              </div>
              <div class="text-right">
                <span class="text-lg font-bold text-blue-900">${{ templatePackageDetails.price }}</span>
                <p class="text-xs text-blue-600">USD</p>
              </div>
            </div>
            
            <!-- Package Features -->
            <div v-if="templatePackageDetails.features && templatePackageDetails.features.length > 0" class="mt-3">
              <p class="text-xs font-medium text-blue-800 mb-2">Included Features:</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1">
                <div
                  v-for="feature in templatePackageDetails.features"
                  :key="feature"
                  class="flex items-center text-xs text-blue-700"
                >
                  <svg class="w-3 h-3 text-blue-500 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  {{ feature }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Methods -->
    <div v-if="hasSelectedTemplate && templatePackageDetails" class="bg-white rounded-lg border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
      
      <div v-if="loadingMethods" class="text-center py-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-sm text-gray-600 mt-2">Loading payment methods...</p>
      </div>

      <div v-else-if="paymentMethods.length > 0" class="space-y-4">
        <div
          v-for="method in paymentMethods"
          :key="method.id"
          class="border rounded-lg p-4 cursor-pointer transition-colors"
          :class="{
            'border-blue-500 bg-blue-50': selectedMethod?.id === method.id,
            'border-gray-200 hover:border-gray-300': selectedMethod?.id !== method.id
          }"
          @click="selectMethod(method)"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h4 class="font-medium text-gray-900">{{ method.name }}</h4>
                <input
                  type="radio"
                  :checked="selectedMethod?.id === method.id"
                  class="h-4 w-4 text-blue-600"
                  readonly
                />
              </div>
              <p class="text-sm text-gray-600">{{ method.payment_type_display }}</p>
              <div v-if="method.bank_name || method.account_number" class="mt-1 space-y-1">
                <p v-if="method.bank_name" class="text-sm text-gray-500">
                  <span class="font-medium">Bank:</span> {{ method.bank_name }}
                </p>
                <p v-if="method.account_number" class="text-sm text-gray-500">
                  <span class="font-medium">Account:</span> {{ method.account_number }}
                </p>
                <p v-if="method.account_name" class="text-sm text-gray-500">
                  <span class="font-medium">Account Name:</span> {{ method.account_name }}
                </p>
              </div>
            </div>
          </div>

          <!-- QR Code and Payment Link Section -->
          <div v-if="selectedMethod?.id === method.id && (method.qr_code_image || method.payment_link)" 
               class="mt-4 pt-4 border-t border-gray-200">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- QR Code -->
              <div v-if="method.qr_code_image" class="text-center">
                <h5 class="text-sm font-medium text-gray-700 mb-2">Scan QR Code</h5>
                <div class="inline-block p-2 bg-white rounded-lg border border-gray-200">
                  <img 
                    :src="method.qr_code_image" 
                    :alt="`QR Code for ${method.name}`"
                    class="w-32 h-32 object-contain mx-auto"
                    loading="lazy"
                    @error="handleImageError"
                  />
                </div>
                <p class="text-xs text-gray-500 mt-2">Scan with your banking app</p>
              </div>

              <!-- Payment Link -->
              <div v-if="method.payment_link" class="flex flex-col justify-center">
                <h5 class="text-sm font-medium text-gray-700 mb-2">Quick Payment</h5>
                <button
                  @click.stop="openPaymentLink(method.payment_link)"
                  class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                  Open Payment Link
                </button>
                <p class="text-xs text-gray-500 mt-2 text-center">Direct link to {{ method.name }} payment</p>
              </div>
            </div>

            <!-- Copy Payment Link -->
            <div v-if="method.payment_link" class="mt-3 pt-3 border-t border-gray-100">
              <div class="flex items-center space-x-2">
                <input
                  :value="method.payment_link"
                  readonly
                  class="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-600"
                />
                <button
                  @click.stop="copyPaymentLink(method.payment_link)"
                  class="text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1 border border-blue-200 rounded hover:border-blue-300 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Form -->
    <div v-if="hasSelectedTemplate && selectedMethod && templatePackageDetails" class="bg-white rounded-lg border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Submit Payment</h3>
      
      <form @submit.prevent="submitPaymentWithSync" class="space-y-4">
        <!-- Transaction Reference -->
        <div>
          <label for="transactionRef" class="block text-sm font-medium text-gray-700 mb-1">
            Transaction Reference
          </label>
          <input
            id="transactionRef"
            v-model="paymentForm.transaction_reference"
            type="text"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter transaction reference number"
          />
        </div>

        <!-- Payment Notes -->
        <div>
          <label for="paymentNotes" class="block text-sm font-medium text-gray-700 mb-1">
            Payment Notes (Optional)
          </label>
          <textarea
            id="paymentNotes"
            v-model="paymentForm.user_notes"
            rows="3"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any notes about your payment..."
          ></textarea>
        </div>

        <!-- Payment Proof Upload -->
        <div>
          <label for="paymentProof" class="block text-sm font-medium text-gray-700 mb-1">
            Payment Proof *
          </label>
          <input
            id="paymentProof"
            ref="fileInput"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
            @change="handleFileSelect"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">
            Accepted formats: PDF, JPG, PNG, GIF, WebP
          </p>
        </div>

        <!-- Submit Button -->
        <div class="flex items-center justify-between pt-4">
          <div>
            <p class="text-sm text-gray-600">
              Total Amount: <span class="font-semibold">${{ templatePackageDetails?.price || '0.00' }}</span>
            </p>
            <p class="text-xs text-gray-500">For {{ templateName }} - {{ templatePackageDetails?.name }}</p>
          </div>
          <button
            type="submit"
            :disabled="submittingPayment || !isFormValid"
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="submittingPayment">Submitting...</span>
            <span v-else>Submit Payment</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Existing Payments -->
    <div class="bg-white rounded-lg border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
      
      <div v-if="loadingPayments" class="text-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-2">Loading payment history...</p>
      </div>
      
      <div v-else-if="existingPayments.length === 0 && !loadingPayments" class="text-center py-8">
        <p class="text-gray-500">No payments found for this event.</p>
      </div>
      
      <div v-else-if="existingPayments.length > 0" class="space-y-4">
        <div
          v-for="payment in existingPayments"
          :key="payment.id"
          class="border rounded-lg p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <div>
              <h4 class="font-medium text-gray-900">{{ payment.plan_name }}</h4>
              <p class="text-sm text-gray-600">{{ payment.payment_reference }}</p>
            </div>
            <div class="text-right">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getStatusBadgeClass(payment.status)">
                {{ getStatusDisplay(payment.status) }}
              </span>
            </div>
          </div>
          
          <div class="text-sm text-gray-600 space-y-1">
            <p><strong>Amount:</strong> ${{ payment.amount }}</p>
            <p><strong>Method:</strong> {{ payment.payment_method_name }}</p>
            <p><strong>Created:</strong> {{ formatDate(payment.created_at) }}</p>
            <p><strong>Transaction Ref:</strong> {{ payment.transaction_reference }}</p>
            <p v-if="payment.template_name"><strong>Template:</strong> {{ payment.template_name }}</p>
          </div>

          <!-- Update Payment (if pending) -->
          <div v-if="payment.status === 'pending'" class="mt-4 pt-4 border-t">
            <button
              @click="startUpdatePayment(payment)"
              class="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Update Payment Details
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Payment Modal -->
    <div v-if="showUpdateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Update Payment</h3>
        
        <form @submit.prevent="updatePayment" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Transaction Reference
            </label>
            <input
              v-model="updateForm.transaction_reference"
              type="text"
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Payment Notes
            </label>
            <textarea
              v-model="updateForm.user_notes"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Payment Proof (Optional)
            </label>
            <input
              ref="updateFileInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
              @change="handleUpdateFileSelect"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div class="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="cancelUpdate"
              class="text-gray-600 hover:text-gray-700 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="updatingPayment"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <span v-if="updatingPayment">Updating...</span>
              <span v-else>Update Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch, nextTick } from 'vue'
import { apiService, type ApiResponse } from '../services/api'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import { useNotifications } from '../composables/useNotifications'

// Define emits
const emit = defineEmits<{
  'tab-change': [tabId: string]
}>()

// Proper TypeScript interfaces
interface Props {
  eventId: string
  canEdit?: boolean
  event?: Event
}

interface Event {
  id: string
  event_template?: number | null
  event_template_details?: {
    name: string
    package_plan: {
      id: number
      name: string
      description: string
      price: string
      features: string[]
    }
  } | null
  event_template_enabled?: boolean
}

interface PaymentMethod {
  readonly id: number
  readonly name: string
  readonly payment_type: string
  readonly payment_type_display: string
  readonly bank_name: string
  readonly account_number: string
  readonly account_name: string
  readonly qr_code_image: string | null
  readonly payment_link: string
  readonly currency: string
  readonly is_active: boolean
}

interface Payment {
  readonly id: string
  readonly payment_reference: string
  readonly user_email: string
  readonly event: string
  readonly event_title: string
  readonly template_name: string | null
  readonly plan_name: string
  readonly payment_method_name: string
  readonly amount: string
  readonly original_price: string
  readonly discount_amount: string
  readonly currency: string
  readonly status: 'pending' | 'confirmed' | 'failed' | 'cancelled' | 'refunded'
  readonly status_display: string
  readonly transaction_reference: string
  readonly created_at: string
  readonly is_confirmed: boolean
  readonly is_upgrade: boolean
  readonly payment_proof?: string
  readonly user_notes?: string
  readonly updated_at?: string
}

interface PaymentFormData {
  transaction_reference: string
  user_notes: string
  payment_proof: File | null
}

interface UpdateFormData {
  transaction_reference: string
  user_notes: string
  payment_proof: File | null
}

const props = defineProps<Props>()

// API service is imported as singleton

// Use composables
const {
  payments: existingPayments,
  loadingPayments,
  refreshPayments,
  loadPayments: loadExistingPayments
} = usePaymentTemplateIntegration(props.event as Event)

const { success: showSuccess, error: showError } = useNotifications()

// Local component state
const paymentMethods = ref<readonly PaymentMethod[]>([])
const selectedMethod = ref<PaymentMethod | null>(null)

// Loading states
const loadingMethods = ref(false)
const submittingPayment = ref(false)
const updatingPayment = ref(false)

// Error states
const error = ref<string | null>(null)

// Forms with proper typing
const paymentForm = ref<PaymentFormData>({
  transaction_reference: '',
  user_notes: '',
  payment_proof: null
})

const updateForm = ref<UpdateFormData>({
  transaction_reference: '',
  user_notes: '',
  payment_proof: null
})

// Update modal
const showUpdateModal = ref(false)
const paymentToUpdate = ref<Payment | null>(null)

// File inputs with proper refs
const fileInput = ref<HTMLInputElement | null>(null)
const updateFileInput = ref<HTMLInputElement | null>(null)

// AbortController for request cancellation
let abortController: AbortController | null = null

// Computed properties with proper typing and memoization
const currentPayment = computed(() => {
  return existingPayments.value.find(p => p.status === 'confirmed' || p.status === 'pending') || null
})

const hasSelectedTemplate = computed(() => {
  return Boolean(props.event?.event_template)
})

// Memoized getters to prevent unnecessary re-renders
const templateName = computed(() => {
  if (props.event?.event_template_details?.name) {
    return props.event.event_template_details.name
  }
  return props.event?.event_template ? `Template ID: ${props.event.event_template}` : ''
})

const templatePackageDetails = computed(() => {
  return props.event?.event_template_details?.package_plan || null
})

const isFormValid = computed(() => {
  return Boolean(
    selectedMethod.value &&
    paymentForm.value.transaction_reference.trim() &&
    paymentForm.value.payment_proof &&
    templatePackageDetails.value
  )
})

// Input sanitization helper
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, (match) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    }
    return entities[match] || match
  })
}

const redirectToTemplateTab = () => {
  emit('tab-change', 'template')
}

// Validation helpers
const validateTransactionReference = (ref: string): string | null => {
  const sanitized = sanitizeInput(ref)
  if (!sanitized || sanitized.length < 3) {
    return 'Transaction reference must be at least 3 characters long'
  }
  if (sanitized.length > 100) {
    return 'Transaction reference must be less than 100 characters'
  }
  if (!/^[a-zA-Z0-9\-_\s]+$/.test(sanitized)) {
    return 'Transaction reference can only contain letters, numbers, dashes, underscores, and spaces'
  }
  return null
}

const validateFile = (file: File): string | null => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  
  if (file.size > maxSize) {
    return 'File size must be less than 10MB'
  }
  
  if (!allowedTypes.includes(file.type)) {
    return 'File type not allowed. Please use JPG, PNG, GIF, WebP, or PDF files'
  }
  
  return null
}


const loadPaymentMethods = async (): Promise<void> => {
  if (loadingMethods.value) return
  
  // Cancel previous request if still pending
  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()
  
  loadingMethods.value = true
  error.value = null
  
  try {
    const response = await apiService.get<{ results: PaymentMethod[] }>('/api/payment/payment-methods/', undefined)
    
    if (response.success && response.data) {
      paymentMethods.value = Object.freeze(response.data.results || [])
    } else {
      throw new Error(response.message || 'Failed to load payment methods')
    }
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('Error loading payment methods:', err)
      error.value = 'Failed to load payment methods. Please try again.'
    }
  } finally {
    loadingMethods.value = false
    abortController = null
  }
}

// Enhanced payment submission with better state synchronization
const submitPaymentWithSync = async (): Promise<void> => {
  await submitPayment()
  
  // Force refresh the payment integration state after successful submission
  if (!error.value) {
    await refreshPayments()
  }
}


const selectMethod = (method: PaymentMethod): void => {
  selectedMethod.value = method
}

const openPaymentLink = (paymentLink: string): void => {
  if (!paymentLink || typeof paymentLink !== 'string') {
    console.warn('Invalid payment link provided')
    return
  }
  
  // Validate URL format for security
  try {
    const url = new URL(paymentLink)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      console.warn('Invalid protocol in payment link')
      return
    }
    window.open(paymentLink, '_blank', 'noopener,noreferrer')
  } catch (err) {
    console.error('Invalid payment link format:', err)
  }
}

const copyPaymentLink = async (paymentLink: string): Promise<void> => {
  if (!paymentLink || typeof paymentLink !== 'string') {
    console.warn('Invalid payment link provided')
    return
  }
  
  try {
    await navigator.clipboard.writeText(paymentLink)
    // TODO: Add proper toast notification instead of console.log
    console.log('Payment link copied to clipboard')
  } catch (err) {
    console.error('Failed to copy payment link:', err)
    // Secure fallback for older browsers
    try {
      const textArea = document.createElement('textarea')
      textArea.value = paymentLink
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      if (!successful) {
        throw new Error('Copy command failed')
      }
    } catch (fallbackErr) {
      console.error('Fallback copy also failed:', fallbackErr)
    }
  }
}

const handleImageError = (event: Event): void => {
  const img = event.target as HTMLImageElement
  if (img?.src) {
    console.error('Failed to load QR code image:', img.src)
    // Hide the broken image
    img.style.display = 'none'
  }
}

const handleFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null
  
  if (file) {
    const validationError = validateFile(file)
    if (validationError) {
      error.value = validationError
      target.value = '' // Clear the input
      return
    }
  }
  
  paymentForm.value.payment_proof = file
  error.value = null
}

const handleUpdateFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null
  
  if (file) {
    const validationError = validateFile(file)
    if (validationError) {
      error.value = validationError
      target.value = '' // Clear the input
      return
    }
  }
  
  updateForm.value.payment_proof = file
  error.value = null
}

const submitPayment = async (): Promise<void> => {
  if (submittingPayment.value) return
  
  // Validate form data
  const templatePackage = templatePackageDetails.value
  if (!isFormValid.value || !templatePackage) {
    error.value = 'Please fill in all required fields including payment proof.'
    return
  }
  
  // Validate transaction reference
  const transactionRefError = validateTransactionReference(paymentForm.value.transaction_reference)
  if (transactionRefError) {
    error.value = transactionRefError
    return
  }
  
  // Validate file
  if (paymentForm.value.payment_proof) {
    const fileError = validateFile(paymentForm.value.payment_proof)
    if (fileError) {
      error.value = fileError
      return
    }
  }

  submittingPayment.value = true
  error.value = null
  
  try {
    const formData = new FormData()
    
    // Sanitize and validate all form inputs
    formData.append('event', sanitizeInput(props.eventId))
    formData.append('pricing_plan', templatePackage.id.toString())
    formData.append('payment_method', selectedMethod.value!.id.toString())
    formData.append('amount', templatePackage.price)
    formData.append('original_price', templatePackage.price)
    formData.append('transaction_reference', sanitizeInput(paymentForm.value.transaction_reference))
    formData.append('user_notes', sanitizeInput(paymentForm.value.user_notes))
    formData.append('payment_proof', paymentForm.value.payment_proof!)
    
    // Include event_template if available
    if (props.event?.event_template) {
      formData.append('event_template', props.event.event_template.toString())
    }

    const response = await apiService.postFormData<Payment>('/api/payment/payments/', formData)
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to submit payment')
    }

    // Reset form securely
    paymentForm.value = {
      transaction_reference: '',
      user_notes: '',
      payment_proof: null
    }
    
    // Clear file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }

    // Refresh payments with composable
    await refreshPayments()
    
    showSuccess('Payment Submitted', 'Your payment has been submitted successfully and is pending review.')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error submitting payment. Please try again.'
    console.error('Error submitting payment:', err)
    error.value = errorMessage
    showError('Payment Failed', errorMessage)
  } finally {
    submittingPayment.value = false
  }
}

const startUpdatePayment = (payment: Payment) => {
  paymentToUpdate.value = payment
  updateForm.value = {
    transaction_reference: payment.transaction_reference,
    user_notes: payment.user_notes || '',
    payment_proof: null
  }
  showUpdateModal.value = true
}

const updatePayment = async (): Promise<void> => {
  if (!paymentToUpdate.value || updatingPayment.value) return

  // Validate transaction reference
  const transactionRefError = validateTransactionReference(updateForm.value.transaction_reference)
  if (transactionRefError) {
    error.value = transactionRefError
    return
  }
  
  // Validate file if provided
  if (updateForm.value.payment_proof) {
    const fileError = validateFile(updateForm.value.payment_proof)
    if (fileError) {
      error.value = fileError
      return
    }
  }

  updatingPayment.value = true
  error.value = null
  
  try {
    const formData = new FormData()
    formData.append('transaction_reference', sanitizeInput(updateForm.value.transaction_reference))
    formData.append('user_notes', sanitizeInput(updateForm.value.user_notes))
    
    if (updateForm.value.payment_proof) {
      formData.append('payment_proof', updateForm.value.payment_proof)
    }

    const response = await apiService.patchFormData<Payment>(
      `/api/payment/payments/${sanitizeInput(paymentToUpdate.value.id)}/`, 
      formData
    )
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update payment')
    }

    showUpdateModal.value = false
    paymentToUpdate.value = null
    await refreshPayments()
    
    showSuccess('Payment Updated', 'Your payment details have been updated successfully.')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error updating payment. Please try again.'
    console.error('Error updating payment:', err)
    error.value = errorMessage
    showError('Update Failed', errorMessage)
  } finally {
    updatingPayment.value = false
  }
}

const cancelUpdate = () => {
  showUpdateModal.value = false
  paymentToUpdate.value = null
  updateForm.value = {
    transaction_reference: '',
    user_notes: '',
    payment_proof: null
  }
  if (updateFileInput.value) {
    updateFileInput.value.value = ''
  }
}

const getStatusBadgeClass = (status?: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800'
    case 'refunded':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusDisplay = (status?: string) => {
  switch (status) {
    case 'pending':
      return 'Pending Review'
    case 'confirmed':
      return 'Confirmed'
    case 'failed':
      return 'Rejected'
    case 'cancelled':
      return 'Cancelled'
    case 'refunded':
      return 'Refunded'
    default:
      return 'Unknown'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Watchers for reactive updates
watch(
  () => hasSelectedTemplate.value,
  (newValue) => {
    if (newValue) {
      loadPaymentMethods()
    } else {
      paymentMethods.value = []
      selectedMethod.value = null
    }
  },
  { immediate: true }
)

watch(
  () => props.eventId,
  (newEventId, oldEventId) => {
    if (newEventId && newEventId !== oldEventId) {
      loadExistingPayments()
    }
  },
  { immediate: true }
)

// Cleanup function
onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})

// Lifecycle
onMounted(async () => {
  await nextTick() // Ensure DOM is ready
  await loadExistingPayments()
  
  if (hasSelectedTemplate.value) {
    await loadPaymentMethods()
  }
})
</script>