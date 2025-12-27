<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 z-[998]"
        @click="handleClose"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[480px] lg:w-[520px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden will-change-transform"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-emerald-500 to-green-600 z-10">
          <div class="flex items-center justify-between px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="handleClose"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <h2 class="text-base font-semibold text-white">
                Edit Donation
              </h2>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!-- General error banner -->
          <div
            v-if="submitError"
            class="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
          >
            <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-red-700">{{ submitError }}</p>
              <button
                type="button"
                @click="submitError = null"
                class="text-xs text-red-600 hover:text-red-700 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>

          <!-- Donation Info Card (read-only) -->
          <div v-if="donation" class="p-4">
            <div class="bg-slate-50 rounded-xl p-4 mb-4">
              <div class="flex items-start gap-3">
                <div
                  :class="[
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    donation.donation_type === 'cash' ? 'bg-emerald-100' : 'bg-purple-100'
                  ]"
                >
                  <DollarSign v-if="donation.donation_type === 'cash'" class="w-5 h-5 text-emerald-600" />
                  <Package v-else class="w-5 h-5 text-purple-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-slate-900">{{ donation.event_info?.title || 'Event' }}</h3>
                  <p class="text-lg font-bold text-slate-900 mt-1">{{ donation.donation_display }}</p>
                  <p class="text-sm text-slate-500 mt-1">{{ formatDate(donation.created_at) }}</p>
                </div>
              </div>
            </div>

            <!-- Form -->
            <form id="edit-donation-form" @submit.prevent="handleSubmit" class="space-y-4">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Update Details</h3>

              <!-- Amount (for cash donations) -->
              <div v-if="donation?.donation_type === 'cash'">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  Amount <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model.number="form.amount"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full px-3 py-2 pr-14 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white"
                    placeholder="0.00"
                    required
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                    {{ form.currency || 'USD' }}
                  </span>
                </div>
                <p v-if="errors.amount" class="mt-1.5 text-xs text-red-600">{{ errors.amount }}</p>
              </div>

              <!-- Donor Name -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  Donor Name <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.donor_name"
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white"
                  placeholder="Your name"
                  required
                />
                <p v-if="errors.donor_name" class="mt-1.5 text-xs text-red-600">{{ errors.donor_name }}</p>
              </div>

              <!-- Anonymous Toggle -->
              <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div class="flex-1">
                  <label class="text-sm font-medium text-slate-700">Show my name publicly</label>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ form.is_anonymous ? 'Your name will be hidden' : 'Your name will be visible to others' }}
                  </p>
                </div>
                <button
                  type="button"
                  @click="form.is_anonymous = !form.is_anonymous"
                  :class="[
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
                    form.is_anonymous ? 'bg-slate-300' : 'bg-emerald-500'
                  ]"
                >
                  <span
                    :class="[
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      form.is_anonymous ? 'translate-x-0' : 'translate-x-5'
                    ]"
                  />
                </button>
              </div>

              <!-- Contact Info -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <input
                    v-model="form.donor_email"
                    type="email"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    v-model="form.donor_phone"
                    type="tel"
                    class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <!-- Message -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  Message
                </label>
                <textarea
                  v-model="form.message"
                  rows="3"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 resize-none bg-white"
                  placeholder="Add a message..."
                ></textarea>
              </div>

              <!-- Receipt Image -->
              <div class="space-y-3 border-t border-slate-100 pt-4">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Receipt Image</h3>

                <!-- Current Receipt -->
                <div v-if="donation.receipt_image && !newReceiptFile" class="space-y-2">
                  <p class="text-sm text-slate-600">Current receipt:</p>
                  <div class="relative inline-block">
                    <img
                      :src="getMediaUrl(donation.receipt_image)"
                      alt="Current receipt"
                      class="max-h-40 rounded-lg border border-slate-200"
                    />
                    <button
                      type="button"
                      @click="showReplaceReceipt = true"
                      class="absolute bottom-2 right-2 px-2 py-1 bg-white/90 hover:bg-white text-xs font-medium text-slate-700 rounded-lg shadow transition-colors"
                    >
                      Replace
                    </button>
                  </div>
                </div>

                <!-- Upload New Receipt -->
                <div v-if="!donation.receipt_image || showReplaceReceipt">
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
                    <div v-if="newReceiptPreview" class="relative inline-block">
                      <img
                        :src="newReceiptPreview"
                        alt="New receipt preview"
                        class="max-h-32 rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        @click.stop="removeNewReceipt"
                        class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>

                    <!-- Upload Prompt -->
                    <div v-else class="py-2">
                      <Upload class="w-7 h-7 text-slate-400 mx-auto mb-1" />
                      <p class="text-xs text-slate-600">Click or drag to upload receipt</p>
                    </div>
                  </div>

                  <button
                    v-if="showReplaceReceipt && !newReceiptFile"
                    type="button"
                    @click="showReplaceReceipt = false"
                    class="mt-2 text-sm text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              type="submit"
              form="edit-donation-form"
              :disabled="isSubmitting || !isFormValid"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{ isSubmitting ? 'Saving...' : 'Save Changes' }}</span>
            </button>

            <button
              type="button"
              @click="handleClose"
              :disabled="isSubmitting"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Success/Error Toast -->
        <Transition name="slide-up">
          <div v-if="toastMessage" class="absolute bottom-16 left-4 right-4 z-10">
            <div
              :class="toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
              class="text-white px-3 py-2.5 rounded-lg shadow-lg flex items-center"
            >
              <CheckCircle v-if="toastMessage.type === 'success'" class="w-4 h-4 mr-2 flex-shrink-0" />
              <AlertCircle v-else class="w-4 h-4 mr-2 flex-shrink-0" />
              <span class="text-xs">{{ toastMessage.text }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import {
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Save,
  DollarSign,
  Package,
  Upload,
  X,
} from 'lucide-vue-next'
import { donationService, apiClient } from '@/services/api'
import type { UserDonation, UpdateDonationRequest } from '@/services/api/types/donation.types'

interface Props {
  modelValue: boolean
  donation?: UserDonation | null
}

const props = withDefaults(defineProps<Props>(), {
  donation: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'updated': [donation: UserDonation]
}>()

// Form state
const form = ref<UpdateDonationRequest & { currency?: string }>({
  donor_name: '',
  donor_email: '',
  donor_phone: '',
  message: '',
  amount: undefined,
  is_anonymous: false,
})

const errors = ref<Record<string, string>>({})
const submitError = ref<string | null>(null)
const isSubmitting = ref(false)
const toastMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Receipt upload state
const fileInput = ref<HTMLInputElement | null>(null)
const newReceiptFile = ref<File | null>(null)
const newReceiptPreview = ref<string | null>(null)
const isDragging = ref(false)
const showReplaceReceipt = ref(false)

// Computed
const isFormValid = computed(() => {
  const hasValidName = form.value.donor_name?.trim() !== ''
  // For cash donations, also require a valid amount
  if (props.donation?.donation_type === 'cash') {
    return hasValidName && form.value.amount !== undefined && form.value.amount > 0
  }
  return hasValidName
})

// Watch for donation changes to populate form
watch(
  () => props.donation,
  (newDonation) => {
    if (newDonation) {
      form.value = {
        donor_name: newDonation.donor_name,
        donor_email: newDonation.donor_email || '',
        donor_phone: newDonation.donor_phone || '',
        message: newDonation.message || '',
        amount: newDonation.amount ? parseFloat(newDonation.amount) : undefined,
        is_anonymous: newDonation.is_anonymous,
        currency: newDonation.currency,
      }
      // Reset receipt upload state
      newReceiptFile.value = null
      newReceiptPreview.value = null
      showReplaceReceipt.value = false
    }
  },
  { immediate: true }
)

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for drawer open/close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      // Clear errors when drawer opens
      errors.value = {}
      submitError.value = null

      // Prevent body scroll
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      // Defer body style resets until after transition completes (350ms)
      setTimeout(() => {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }, 350)
    }
  }
)

// Cleanup body styles if component unmounts while drawer is open
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

// Methods
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getMediaUrl = (mediaUrl: string | null | undefined): string | undefined => {
  if (!mediaUrl) return undefined
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl
  }
  return apiClient.getProfilePictureUrl(mediaUrl) || undefined
}

function handleClose() {
  if (isSubmitting.value) return
  emit('update:modelValue', false)
}

function showToast(type: 'success' | 'error', text: string) {
  toastMessage.value = { type, text }
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
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
    showToast('error', 'File size must be less than 10MB')
    return
  }

  newReceiptFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    newReceiptPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function removeNewReceipt() {
  newReceiptFile.value = null
  newReceiptPreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function handleSubmit() {
  if (!props.donation) return

  // Validate
  errors.value = {}
  submitError.value = null

  if (!form.value.donor_name?.trim()) {
    errors.value.donor_name = 'Donor name is required'
    return
  }

  // Validate amount for cash donations
  if (props.donation.donation_type === 'cash') {
    if (!form.value.amount || form.value.amount <= 0) {
      errors.value.amount = 'Please enter a valid amount'
      return
    }
  }

  isSubmitting.value = true

  try {
    // Prepare update data
    const updateData: UpdateDonationRequest = {
      donor_name: form.value.donor_name?.trim(),
      donor_email: form.value.donor_email?.trim() || undefined,
      donor_phone: form.value.donor_phone?.trim() || undefined,
      message: form.value.message?.trim() || undefined,
      is_anonymous: form.value.is_anonymous,
    }

    // Include amount for cash donations
    if (props.donation.donation_type === 'cash' && form.value.amount) {
      updateData.amount = form.value.amount
    }

    const response = await donationService.updateDonation(
      props.donation.event,
      props.donation.id,
      updateData,
      newReceiptFile.value || undefined
    )

    if (response.success && response.data) {
      showToast('success', 'Donation updated successfully')

      // Emit the updated donation with preserved event_info
      const updatedDonation: UserDonation = {
        ...response.data,
        event_info: props.donation.event_info
      }
      emit('updated', updatedDonation)

      // Close drawer after short delay
      setTimeout(() => {
        emit('update:modelValue', false)
      }, 1000)
    } else {
      submitError.value = response.message || 'Failed to update donation'
    }
  } catch (err) {
    console.error('Error updating donation:', err)
    submitError.value = 'An error occurred while updating the donation'
  } finally {
    isSubmitting.value = false
  }
}
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
  transform: translateY(100%) translateZ(0);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%) translateZ(0);
  }
}

/* Slide up transition for toast */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
