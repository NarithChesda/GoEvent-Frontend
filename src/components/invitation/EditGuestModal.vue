<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-up">
      <div
        v-if="show"
        class="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center w-full md:w-auto z-[71]"
        @click.self="$emit('close')"
      >
        <div
          class="relative w-full md:max-w-md bg-white md:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] md:max-h-[calc(100vh-100px)] flex flex-col rounded-t-3xl md:rounded-b-3xl"
          @click.stop
        >
          <!-- Header -->
          <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
            <div class="flex items-center justify-between px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center">
                  <UserCog class="w-5 h-5" />
                </div>
                <h2 class="text-lg font-semibold text-white">Edit Guest</h2>
              </div>
              <button
                @click="$emit('close')"
                class="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Form Content -->
          <div class="flex-1 overflow-y-auto overscroll-contain">
            <form @submit.prevent="handleSubmit" class="p-4 space-y-5 pb-24">
              <!-- Group Selection -->
              <div>
                <label for="editGuestGroup" class="block text-sm font-medium text-slate-700 mb-2">
                  Select Group <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <select
                    id="editGuestGroup"
                    v-model="formData.group"
                    required
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                  >
                    <option :value="null" disabled>Choose a group...</option>
                    <option v-for="group in groups" :key="group.id" :value="group.id">
                      {{ group.name }} ({{ group.guest_count }} guests)
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown class="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>

              <!-- Guest Name -->
              <div>
                <label for="editGuestName" class="block text-sm font-medium text-slate-700 mb-2">
                  Guest Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="editGuestName"
                  v-model="formData.name"
                  type="text"
                  required
                  placeholder="Enter guest's full name"
                  class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                  :class="{ 'border-red-300 focus:ring-red-200 focus:border-red-400': fieldErrors.name }"
                />
                <p v-if="fieldErrors.name" class="mt-1 text-xs text-red-600">{{ fieldErrors.name }}</p>
              </div>

              <!-- Contact Information Section (Collapsible) -->
              <div class="space-y-3 pt-2">
                <button
                  type="button"
                  @click="isContactInfoExpanded = !isContactInfoExpanded"
                  class="w-full flex items-center justify-between text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-50"
                >
                  <div class="flex items-center gap-2">
                    <Mail class="w-4 h-4" />
                    <span>Contact Information</span>
                    <span class="text-xs text-slate-500">(Optional)</span>
                  </div>
                  <ChevronDown
                    class="w-4 h-4 transition-transform duration-200"
                    :class="{ 'rotate-180': isContactInfoExpanded }"
                  />
                </button>

                <Transition name="collapse">
                  <div v-show="isContactInfoExpanded" class="space-y-4 pl-6 border-l-2 border-slate-200">
                    <!-- Email -->
                    <div>
                      <label for="editGuestEmail" class="block text-sm font-medium text-slate-700 mb-2">
                        Email
                      </label>
                      <input
                        id="editGuestEmail"
                        v-model="formData.email"
                        type="email"
                        placeholder="guest@example.com"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        :class="{ 'border-red-300 focus:ring-red-200 focus:border-red-400': fieldErrors.email }"
                      />
                      <p v-if="fieldErrors.email" class="mt-1 text-xs text-red-600">{{ fieldErrors.email }}</p>
                    </div>

                    <!-- Phone Number -->
                    <div>
                      <label for="editGuestPhone" class="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        id="editGuestPhone"
                        v-model="formData.phone_number"
                        type="tel"
                        placeholder="+1234567890"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        :class="{ 'border-red-300 focus:ring-red-200 focus:border-red-400': fieldErrors.phone_number }"
                      />
                      <p v-if="fieldErrors.phone_number" class="mt-1 text-xs text-red-600">{{ fieldErrors.phone_number }}</p>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Cash Gift Section -->
              <div class="space-y-3 pt-2">
                <h3 class="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Coins class="w-4 h-4" />
                  Cash Gift Information
                </h3>

                <div class="grid grid-cols-2 gap-3">
                  <!-- Cash Gift Amount -->
                  <div>
                    <label for="editCashGiftAmount" class="block text-sm font-medium text-slate-700 mb-2">
                      Amount
                    </label>
                    <input
                      id="editCashGiftAmount"
                      v-model="formData.cash_gift_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      :class="{ 'border-red-300 focus:ring-red-200 focus:border-red-400': fieldErrors.cash_gift_amount }"
                    />
                    <p v-if="fieldErrors.cash_gift_amount" class="mt-1 text-xs text-red-600">{{ fieldErrors.cash_gift_amount }}</p>
                  </div>

                  <!-- Cash Gift Currency -->
                  <div>
                    <label for="editCashGiftCurrency" class="block text-sm font-medium text-slate-700 mb-2">
                      Currency
                    </label>
                    <div class="relative">
                      <select
                        id="editCashGiftCurrency"
                        v-model="formData.cash_gift_currency"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                        :class="{ 'border-red-300 focus:ring-red-200 focus:border-red-400': fieldErrors.cash_gift_currency }"
                      >
                        <option value="">Select...</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="KHR">KHR - Cambodian Riel</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                        <option value="CNY">CNY - Chinese Yuan</option>
                        <option value="THB">THB - Thai Baht</option>
                        <option value="VND">VND - Vietnamese Dong</option>
                        <option value="SGD">SGD - Singapore Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                      </select>
                      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown class="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                    <p v-if="fieldErrors.cash_gift_currency" class="mt-1 text-xs text-red-600">{{ fieldErrors.cash_gift_currency }}</p>
                  </div>
                </div>
              </div>

              <!-- Error Message -->
              <div v-if="errorMessage" class="rounded-lg bg-red-50 border border-red-200 p-3">
                <p class="text-sm text-red-800">{{ errorMessage }}</p>
              </div>

              <!-- Quick Actions Section (Mobile Only) -->
              <div class="md:hidden space-y-3 pt-2">
                <h3 class="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Link class="w-4 h-4" />
                  Quick Actions
                </h3>

                <div class="space-y-2">
                  <!-- Copy Link Buttons -->
                  <div class="flex gap-2">
                    <button
                      type="button"
                      @click="handleCopyLink('kh')"
                      :disabled="isUpdating"
                      class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Globe class="w-4 h-4" />
                      <span>Copy Link (KH)</span>
                    </button>
                    <button
                      type="button"
                      @click="handleCopyLink('en')"
                      :disabled="isUpdating"
                      class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Globe class="w-4 h-4" />
                      <span>Copy Link (EN)</span>
                    </button>
                  </div>

                  <!-- Mark as Sent Button -->
                  <button
                    v-if="guest && guest.invitation_status === 'not_sent'"
                    type="button"
                    @click="handleMarkSent"
                    :disabled="isUpdating"
                    class="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Send class="w-4 h-4" />
                    <span>Mark as Sent</span>
                  </button>

                  <!-- Delete Button -->
                  <button
                    v-if="guest"
                    type="button"
                    @click="handleDelete"
                    :disabled="isUpdating"
                    class="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 class="w-4 h-4" />
                    <span>Delete Guest</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <!-- Footer with Action Buttons -->
          <div class="flex-shrink-0 border-t border-slate-200 bg-white">
            <!-- Primary Actions -->
            <div class="flex items-center justify-between gap-3 px-4 py-3">
              <button
                @click="handleSubmit"
                :disabled="!isFormValid || isUpdating"
                class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  v-if="isUpdating"
                  class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
                ></span>
                <span>{{ isUpdating ? 'Updating...' : 'Update Guest' }}</span>
              </button>

              <button
                type="button"
                @click="$emit('close')"
                class="px-5 py-2.5 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
                :disabled="isUpdating"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { UserCog, X, Coins, ChevronDown, Mail, Send, Link, Trash2, Globe } from 'lucide-vue-next'
import type { EventGuest, GuestGroup } from '../../services/api'

// Props
const props = defineProps<{
  show: boolean
  guest: EventGuest | null
  groups: GuestGroup[]
  isUpdating: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
  'update-guest': [guestId: number, data: any]
  'mark-sent': [guest: EventGuest]
  'delete': [guest: EventGuest]
  'copy-link': [guest: EventGuest, language: 'en' | 'kh']
}>()

// Form data
interface FormData {
  name: string
  group: number | null
  email: string
  phone_number: string
  cash_gift_amount: string
  cash_gift_currency: string
}

const formData = ref<FormData>({
  name: '',
  group: null,
  email: '',
  phone_number: '',
  cash_gift_amount: '',
  cash_gift_currency: '',
})

const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})
const isContactInfoExpanded = ref(false)

// Quick action handlers for mobile
const handleCopyLink = (language: 'en' | 'kh') => {
  if (props.guest) {
    emit('copy-link', props.guest, language)
  }
}

const handleMarkSent = () => {
  if (props.guest) {
    emit('mark-sent', props.guest)
  }
}

const handleDelete = () => {
  if (props.guest) {
    emit('delete', props.guest)
  }
}

// Initialize form data when guest prop changes
watch(() => props.guest, (newGuest) => {
  if (newGuest) {
    formData.value = {
      name: newGuest.name || '',
      group: newGuest.group ?? null,
      email: newGuest.email || '',
      phone_number: newGuest.phone_number || '',
      cash_gift_amount: newGuest.cash_gift_amount || '',
      cash_gift_currency: newGuest.cash_gift_currency || '',
    }
    errorMessage.value = ''
    fieldErrors.value = {}
  }
}, { immediate: true })

// Reset form when modal is closed
watch(() => props.show, (newShow) => {
  if (!newShow) {
    errorMessage.value = ''
    fieldErrors.value = {}
  }
})

// Form validation
const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.group !== null
})

// Handle form submission
const handleSubmit = () => {
  if (!props.guest || !isFormValid.value) {
    return
  }

  // Clear previous errors
  errorMessage.value = ''
  fieldErrors.value = {}

  // Prepare update data - only include fields that have values
  const updateData: any = {
    name: formData.value.name.trim(),
    group: formData.value.group,
  }

  // Add optional fields if they have values
  if (formData.value.email && formData.value.email.trim()) {
    updateData.email = formData.value.email.trim()
  }

  if (formData.value.phone_number && formData.value.phone_number.trim()) {
    updateData.phone_number = formData.value.phone_number.trim()
  }

  if (formData.value.cash_gift_amount !== null && formData.value.cash_gift_amount !== undefined && formData.value.cash_gift_amount !== '') {
    updateData.cash_gift_amount = String(formData.value.cash_gift_amount)
  }

  if (formData.value.cash_gift_currency && formData.value.cash_gift_currency.trim()) {
    updateData.cash_gift_currency = formData.value.cash_gift_currency.trim()
  }

  emit('update-guest', props.guest.id, updateData)
}

// Expose method to set field errors from parent
const setFieldErrors = (errors: Record<string, string[]>) => {
  fieldErrors.value = {}
  Object.entries(errors).forEach(([field, messages]) => {
    if (messages && messages.length > 0) {
      fieldErrors.value[field] = messages[0]
    }
  })
}

const setErrorMessage = (message: string) => {
  errorMessage.value = message
}

// Expose methods for parent component
defineExpose({
  setFieldErrors,
  setErrorMessage,
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

/* Slide from bottom on mobile, scale on desktop */
.slide-up-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: all 0.3s ease;
  }

  .slide-up-enter-from,
  .slide-up-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(0);
  }
}

/* Collapse transition */
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

/* Dropdown transition for mobile link menu */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
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
