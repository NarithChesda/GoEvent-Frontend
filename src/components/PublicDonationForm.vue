<template>
  <div class="space-y-4">
    <!-- Header with back button -->
    <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
      <button
        @click="$emit('back')"
        class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <ArrowLeft class="w-5 h-5 text-slate-600" />
      </button>
      <div>
        <h3 class="text-lg font-semibold text-slate-900">Make a Donation</h3>
        <p class="text-xs text-slate-500">Support this event</p>
      </div>
    </div>

    <!-- Success Message (Inline) -->
    <Transition name="slide-down">
      <div v-if="showSuccess" class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle class="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 class="text-sm font-semibold text-emerald-800">Thank You!</h4>
            <p class="text-xs text-emerald-600">Your donation has been submitted successfully.</p>
          </div>
        </div>
        <button
          @click="handleSuccessClose"
          class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Done
        </button>
      </div>
    </Transition>

    <!-- Form Content (hidden when success) -->
    <template v-if="!showSuccess">
      <!-- Progress Section -->
    <div v-if="progress" class="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-slate-700">Fundraising Progress</span>
        <span class="text-sm font-semibold text-emerald-600">
          {{ progress.percentage }}%
        </span>
      </div>
      <div class="w-full h-2.5 bg-emerald-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
          :style="{ width: `${Math.min(progress.percentage, 100)}%` }"
        ></div>
      </div>
      <div class="flex items-center justify-between mt-2 text-xs text-slate-600">
        <span>{{ formatCurrency(progress.total_raised, progress.currency) }} raised</span>
        <span v-if="progress.goal">
          Goal: {{ formatCurrency(progress.goal, progress.currency) }}
        </span>
      </div>
    </div>

    <!-- Donation Type Tabs -->
    <div class="flex bg-slate-100 rounded-xl p-1">
      <button
        @click="donationType = 'cash'"
        :class="[
          'flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all',
          donationType === 'cash'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        ]"
      >
        <div class="flex items-center justify-center gap-1.5">
          <Banknote class="w-4 h-4" />
          Cash
        </div>
      </button>
      <button
        v-if="itemCategories.length > 0"
        @click="donationType = 'item'"
        :class="[
          'flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all',
          donationType === 'item'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        ]"
      >
        <div class="flex items-center justify-center gap-1.5">
          <Package class="w-4 h-4" />
          Item
        </div>
      </button>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Cash Donation Fields -->
      <template v-if="donationType === 'cash'">
        <!-- Amount Selection -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            Donation Amount <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-3 gap-2 mb-2">
            <button
              v-for="preset in presetAmounts"
              :key="preset"
              type="button"
              @click="selectPresetAmount(preset)"
              :class="[
                'py-2 px-2 text-sm font-medium rounded-xl border-2 transition-all',
                form.amount === preset
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 hover:border-emerald-300 text-slate-700'
              ]"
            >
              {{ formatCurrency(preset, currency) }}
            </button>
          </div>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              {{ currency === 'USD' ? '$' : '៛' }}
            </span>
            <input
              v-model.number="form.amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="Custom amount"
              class="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              :class="{ 'border-red-300': errors.amount }"
            />
          </div>
          <p v-if="errors.amount" class="mt-1 text-xs text-red-600">{{ errors.amount }}</p>
        </div>

        <!-- Payment Method Selection -->
        <div v-if="paymentMethods.length > 0">
          <label class="block text-sm font-medium text-slate-700 mb-2">
            Payment Method
          </label>
          <div class="space-y-2">
            <button
              v-for="method in paymentMethods"
              :key="method.id"
              type="button"
              @click="selectPaymentMethod(method)"
              :class="[
                'w-full p-3 text-left rounded-xl border-2 transition-all',
                form.payment_method === method.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 hover:border-emerald-300'
              ]"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Building2 v-if="method.payment_method === 'bank_transfer'" class="w-4 h-4 text-slate-600" />
                  <QrCode v-else-if="method.payment_method === 'qr_code'" class="w-4 h-4 text-slate-600" />
                  <LinkIcon v-else class="w-4 h-4 text-slate-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-900">{{ method.name }}</p>
                  <p class="text-xs text-slate-500 truncate">
                    <template v-if="method.payment_method === 'bank_transfer'">
                      {{ method.bank_name }} - {{ method.account_number }}
                    </template>
                    <template v-else>
                      {{ formatPaymentMethod(method.payment_method) }}
                    </template>
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Selected Payment Method Details -->
        <div v-if="selectedPaymentMethod" class="bg-slate-50 rounded-xl p-4 space-y-3">
          <h4 class="text-sm font-medium text-slate-700">Payment Details</h4>

          <!-- Bank Transfer Details -->
          <div v-if="selectedPaymentMethod.payment_method === 'bank_transfer'" class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-500">Bank</span>
              <span class="font-medium text-slate-900">{{ selectedPaymentMethod.bank_name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Account Name</span>
              <span class="font-medium text-slate-900">{{ selectedPaymentMethod.account_name }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500">Account Number</span>
              <div class="flex items-center gap-2">
                <span class="font-mono font-medium text-slate-900">{{ selectedPaymentMethod.account_number }}</span>
                <button
                  type="button"
                  @click="copyAccountNumber"
                  class="p-1 hover:bg-slate-200 rounded transition-colors"
                  title="Copy account number"
                >
                  <Copy class="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>
          </div>

          <!-- QR Code -->
          <div v-if="selectedPaymentMethod.qr_code_image" class="flex justify-center pt-2">
            <img
              :src="getMediaUrl(selectedPaymentMethod.qr_code_image)"
              alt="Payment QR Code"
              class="w-36 h-36 rounded-lg border border-slate-200"
            />
          </div>

          <!-- Payment URL -->
          <div v-if="selectedPaymentMethod.payment_url" class="pt-2">
            <a
              :href="selectedPaymentMethod.payment_url"
              target="_blank"
              class="flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ExternalLink class="w-4 h-4" />
              Open Payment Link
            </a>
          </div>
        </div>
      </template>

      <!-- Item Donation Fields -->
      <template v-else>
        <!-- Item Category -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            Item Category <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <select
              v-model="form.item_category"
              class="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white appearance-none cursor-pointer transition-colors hover:border-slate-400"
              :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': errors.item_category }"
            >
              <option :value="undefined">Select a category</option>
              <option v-for="cat in itemCategories" :key="cat.id" :value="cat.id">
                {{ cat.name }} ({{ cat.unit }})
              </option>
            </select>
            <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <p v-if="errors.item_category" class="mt-1 text-xs text-red-600">{{ errors.item_category }}</p>
        </div>

        <!-- Item Name -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            Item Name
          </label>
          <input
            v-model="form.item_name"
            type="text"
            placeholder="e.g., Rice bags, School supplies"
            class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          />
        </div>

        <!-- Quantity & Unit -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              Quantity
            </label>
            <input
              v-model.number="form.item_quantity"
              type="number"
              min="1"
              placeholder="1"
              class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              Unit
            </label>
            <input
              v-model="form.item_unit"
              type="text"
              :placeholder="selectedCategory?.unit || 'pcs'"
              class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
          </div>
        </div>
      </template>

      <!-- Common Fields -->
      <!-- Donor Name -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">
          Your Name <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.donor_name"
          type="text"
          placeholder="Enter your name"
          class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          :class="{ 'border-red-300': errors.donor_name }"
        />
        <p v-if="errors.donor_name" class="mt-1 text-xs text-red-600">{{ errors.donor_name }}</p>
      </div>

      <!-- Contact Info (Collapsible) -->
      <div class="space-y-2">
        <button
          type="button"
          @click="showContactInfo = !showContactInfo"
          class="w-full flex items-center justify-between text-sm font-medium text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <span>Contact Information (Optional)</span>
          <ChevronDown
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'rotate-180': showContactInfo }"
          />
        </button>

        <Transition name="collapse">
          <div v-show="showContactInfo" class="space-y-3 pl-2 border-l-2 border-slate-200">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                v-model="form.donor_email"
                type="email"
                placeholder="your@email.com"
                class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input
                v-model="form.donor_phone"
                type="tel"
                placeholder="+1234567890"
                class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
          </div>
        </Transition>
      </div>

      <!-- Message -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">
          Message (optional)
        </label>
        <textarea
          v-model="form.message"
          rows="2"
          placeholder="Add a message..."
          class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
        ></textarea>
      </div>

      <!-- Receipt Upload -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">
          Upload Receipt {{ donationType === 'cash' ? '(recommended)' : '(optional)' }}
        </label>
        <div
          @click="triggerFileInput"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleFileDrop"
          :class="[
            'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
          ]"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />

          <!-- Preview -->
          <div v-if="receiptPreview" class="relative inline-block">
            <img
              :src="receiptPreview"
              alt="Receipt preview"
              class="max-h-28 rounded-lg mx-auto"
            />
            <button
              type="button"
              @click.stop="removeReceipt"
              class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Upload Prompt -->
          <div v-else class="py-2">
            <Upload class="w-7 h-7 text-slate-400 mx-auto mb-1" />
            <p class="text-xs text-slate-600">Click or drag to upload</p>
          </div>
        </div>
      </div>

      <!-- Anonymous Donation -->
      <label class="flex items-center gap-3 cursor-pointer">
        <input
          v-model="form.is_anonymous"
          type="checkbox"
          class="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
        />
        <span class="text-sm text-slate-700">Make this donation anonymous</span>
      </label>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin" />
        <Heart v-else class="w-5 h-5" />
        <span>{{ isSubmitting ? 'Processing...' : 'Submit Donation' }}</span>
      </button>

      <!-- Error Message -->
      <p v-if="submitError" class="text-sm text-red-600 text-center">
        {{ submitError }}
      </p>
    </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  ArrowLeft,
  Heart,
  Banknote,
  Package,
  Building2,
  QrCode,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Upload,
  Loader2,
  CheckCircle,
  ChevronDown,
  X,
} from 'lucide-vue-next'
import { donationService, paymentMethodsService } from '@/services/api'
import type {
  FundraisingProgress,
  DonationItemCategory,
  DonationCurrency,
  CreateCashDonationRequest,
  CreateItemDonationRequest,
} from '@/services/api/types/donation.types'
import type { EventPaymentMethod } from '@/services/api/types/payment.types'

interface Props {
  eventId: string
  currency?: DonationCurrency
}

const props = withDefaults(defineProps<Props>(), {
  currency: 'USD',
})

const emit = defineEmits<{
  back: []
  donated: []
}>()

// State
const donationType = ref<'cash' | 'item'>('cash')
const progress = ref<FundraisingProgress | null>(null)
const paymentMethods = ref<EventPaymentMethod[]>([])
const itemCategories = ref<DonationItemCategory[]>([])
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)
const showSuccess = ref(false)
const isDragging = ref(false)
const showContactInfo = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const receiptFile = ref<File | null>(null)
const receiptPreview = ref<string | null>(null)

// Form state
const form = ref({
  amount: undefined as number | undefined,
  payment_method: undefined as number | undefined,
  item_category: undefined as number | undefined,
  item_name: '',
  item_quantity: undefined as number | undefined,
  item_unit: '',
  estimated_value: undefined as number | undefined,
  donor_name: '',
  donor_email: '',
  donor_phone: '',
  message: '',
  is_anonymous: false,
})

const errors = ref<Record<string, string>>({})

// Preset amounts based on currency
const presetAmounts = computed(() => {
  if (props.currency === 'KHR') {
    return [10000, 50000, 100000]
  }
  return [10, 50, 100]
})

// Selected payment method
const selectedPaymentMethod = computed(() => {
  if (!form.value.payment_method) return null
  return paymentMethods.value.find(m => m.id === form.value.payment_method) || null
})

// Selected item category
const selectedCategory = computed(() => {
  if (!form.value.item_category) return null
  return itemCategories.value.find(c => c.id === form.value.item_category) || null
})

// Load data on mount
onMounted(async () => {
  await loadData()
})

// Methods
async function loadData() {
  try {
    const [progressRes, paymentRes, categoriesRes] = await Promise.all([
      donationService.getFundraisingProgress(props.eventId),
      paymentMethodsService.getPaymentMethods(props.eventId),
      donationService.getItemCategories(props.eventId, { is_active: true }),
    ])

    if (progressRes.success && progressRes.data) {
      progress.value = progressRes.data
    }

    if (paymentRes.success && paymentRes.data) {
      paymentMethods.value = paymentRes.data.results.filter(
        m => m.is_active && m.payment_type === 'donation'
      )
    }

    if (categoriesRes.success && categoriesRes.data) {
      itemCategories.value = categoriesRes.data.results
    }
  } catch (err) {
    console.error('Error loading donation data:', err)
  }
}

function selectPresetAmount(amount: number) {
  form.value.amount = amount
}

function selectPaymentMethod(method: EventPaymentMethod) {
  form.value.payment_method = method.id
}

function formatCurrency(amount: string | number, currency: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (currency === 'KHR') {
    return `៛${num.toLocaleString()}`
  }
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatPaymentMethod(method: string): string {
  switch (method) {
    case 'bank_transfer':
      return 'Bank Transfer'
    case 'qr_code':
      return 'QR Code Payment'
    case 'payment_url':
      return 'Online Payment'
    default:
      return method
  }
}

function getMediaUrl(mediaUrl: string | null | undefined): string | undefined {
  if (!mediaUrl) return undefined
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl
  }
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (mediaUrl.startsWith('/')) {
    return `${API_BASE_URL}${mediaUrl}`
  }
  return `${API_BASE_URL}/media/${mediaUrl}`
}

async function copyAccountNumber() {
  if (selectedPaymentMethod.value?.account_number) {
    try {
      await navigator.clipboard.writeText(selectedPaymentMethod.value.account_number)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

function handleFileDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

function processFile(file: File) {
  if (file.size > 10 * 1024 * 1024) {
    submitError.value = 'File size must be less than 10MB'
    return
  }

  receiptFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    receiptPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function removeReceipt() {
  receiptFile.value = null
  receiptPreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function validateForm(): boolean {
  errors.value = {}

  if (!form.value.donor_name?.trim()) {
    errors.value.donor_name = 'Please enter your name'
  }

  if (donationType.value === 'cash') {
    if (!form.value.amount || form.value.amount <= 0) {
      errors.value.amount = 'Please enter a valid donation amount'
    }
  } else {
    if (!form.value.item_category && !form.value.item_name?.trim()) {
      errors.value.item_category = 'Please select a category or enter item name'
    }
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true
  submitError.value = null

  try {
    let donationData: CreateCashDonationRequest | CreateItemDonationRequest

    if (donationType.value === 'cash') {
      donationData = {
        donation_type: 'cash',
        amount: form.value.amount!,
        currency: props.currency,
        donor_name: form.value.donor_name.trim(),
        donor_email: form.value.donor_email?.trim() || undefined,
        donor_phone: form.value.donor_phone?.trim() || undefined,
        payment_method: form.value.payment_method,
        message: form.value.message?.trim() || undefined,
        is_anonymous: form.value.is_anonymous,
      }
    } else {
      donationData = {
        donation_type: 'item',
        item_category: form.value.item_category,
        item_name: form.value.item_name?.trim() || undefined,
        item_quantity: form.value.item_quantity,
        item_unit: form.value.item_unit?.trim() || selectedCategory.value?.unit || undefined,
        estimated_value: form.value.estimated_value,
        donor_name: form.value.donor_name.trim(),
        donor_email: form.value.donor_email?.trim() || undefined,
        donor_phone: form.value.donor_phone?.trim() || undefined,
        message: form.value.message?.trim() || undefined,
        is_anonymous: form.value.is_anonymous,
      }
    }

    const response = await donationService.createDonation(
      props.eventId,
      donationData,
      receiptFile.value || undefined
    )

    if (response.success) {
      showSuccess.value = true
    } else {
      submitError.value = response.message || 'Failed to submit donation'
    }
  } catch (err) {
    console.error('Error submitting donation:', err)
    submitError.value = 'An error occurred. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

function handleSuccessClose() {
  showSuccess.value = false
  emit('donated')
  emit('back')
}
</script>

<style scoped>
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
  max-height: 200px;
}

/* Slide down transition for inline success message */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
