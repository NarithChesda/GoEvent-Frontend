<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
    <!-- Header -->
    <div class="mb-6">
      <h5 class="font-semibold text-slate-900">Payment Methods</h5>
      <p class="text-sm text-slate-600">Add payment options for gifts, donations, and sponsorships</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading">
      <div class="flex justify-center py-6 sm:py-8">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error">
      <div class="bg-red-50 border border-red-200 rounded-2xl p-4">
        <div class="flex items-center space-x-2">
          <AlertCircle class="w-5 h-5 text-red-500" />
          <div class="flex-1">
            <p class="text-sm text-red-600 font-medium">{{ error }}</p>
            <button
              @click="loadPaymentMethods"
              class="text-red-600 text-sm hover:text-red-700 underline mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="paymentMethods.length === 0">
      <div
        @click="canEdit ? showAddModal = true : null"
        :class="[
          'border-2 border-dashed rounded-2xl p-8 transition-all duration-300 text-center',
          canEdit
            ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group'
            : 'border-slate-300 bg-slate-50'
        ]"
      >
        <div class="flex flex-col items-center justify-center min-h-[120px]">
          <div :class="[
            'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300',
            canEdit ? 'bg-slate-200 group-hover:bg-emerald-100' : 'bg-slate-200'
          ]">
            <Plus v-if="canEdit" :class="[
              'w-8 h-8 transition-colors',
              'text-slate-400 group-hover:text-emerald-600'
            ]" />
            <CreditCard v-else class="w-8 h-8 text-slate-400" />
          </div>
          <p :class="[
            'font-semibold transition-colors',
            canEdit ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-600'
          ]">No payment methods added</p>
          <p class="text-sm text-slate-500 mt-1">Add payment options for gifts, donations, and sponsorships</p>
          <p v-if="canEdit" class="text-xs text-slate-400 mt-1">Click to add</p>
        </div>
      </div>
    </div>

    <!-- Payment Methods List -->
    <div v-else>
      <!-- Sortable Payment Methods -->
      <div class="space-y-3 sm:space-y-4" @dragover.prevent @drop="handleDrop">
        <div
          v-for="(paymentMethod, index) in paymentMethods"
          :key="paymentMethod.id"
          :draggable="canEdit"
          @dragstart="handleDragStart($event, paymentMethod, index)"
          @dragend="handleDragEnd"
          @dragover="handleDragOver($event, index)"
          class="payment-method-card bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all duration-200"
          :class="{
            'cursor-grab': canEdit,
            'cursor-grabbing': isDragging,
            'opacity-50': !paymentMethod.is_active,
            'drag-over': dragOverIndex === index,
          }"
        >
          <div class="flex items-center justify-between">
            <!-- Payment Method Info -->
            <div class="flex-1">
              <div class="flex items-center space-x-2 sm:space-x-3">
                <!-- Drag Handle -->
                <div v-if="canEdit" class="flex items-center text-gray-400 hover:text-gray-600">
                  <GripVertical class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>

                <!-- Payment Method Icon -->
                <div
                  class="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="getPaymentMethodIconBg(paymentMethod.payment_method)"
                >
                  <component
                    :is="getPaymentMethodIcon(paymentMethod.payment_method)"
                    class="w-4 h-4 sm:w-5 sm:h-5"
                    :class="getPaymentMethodIconColor(paymentMethod.payment_method)"
                  />
                </div>

                <!-- Payment Method Details -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
                    <h6 class="text-sm sm:text-base font-medium text-slate-900 truncate">{{ paymentMethod.name }}</h6>
                    <span
                      class="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap"
                      :class="getPaymentTypeStyle(paymentMethod.payment_type)"
                    >
                      {{ formatPaymentType(paymentMethod.payment_type) }}
                    </span>
                    <span
                      v-if="!paymentMethod.is_active"
                      class="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap"
                    >
                      Inactive
                    </span>
                  </div>

                  <div class="text-xs sm:text-sm text-slate-600 mt-1">
                    <span class="font-medium">{{
                      formatPaymentMethod(paymentMethod.payment_method)
                    }}</span>
                    <span v-if="paymentMethod.currency" class="ml-1 sm:ml-2"
                      >• {{ paymentMethod.currency }}</span
                    >
                  </div>

                  <!-- Method-specific details -->
                  <div
                    v-if="paymentMethod.payment_method === 'bank_transfer'"
                    class="space-y-1 mt-1.5 sm:mt-2"
                  >
                    <div class="text-[10px] sm:text-xs text-slate-600">
                      <span class="font-medium">Bank:</span> {{ paymentMethod.bank_name }}
                    </div>
                    <div class="text-[10px] sm:text-xs text-slate-600">
                      <span class="font-medium">Account:</span> {{ paymentMethod.account_name }} -
                      {{ paymentMethod.account_number }}
                    </div>

                    <!-- Access Methods -->
                    <div class="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                      <span
                        v-if="paymentMethod.qr_code_image"
                        class="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 bg-[#E6F4FF] text-[#1873cc] rounded-lg text-[10px] sm:text-xs"
                      >
                        <QrCode class="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                        QR Code Available
                      </span>
                      <span
                        v-if="paymentMethod.payment_url"
                        class="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] sm:text-xs"
                      >
                        <Link class="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                        Online Payment
                      </span>
                      <span
                        v-if="!paymentMethod.qr_code_image && !paymentMethod.payment_url"
                        class="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-50 text-gray-600 rounded-lg text-[10px] sm:text-xs"
                      >
                        <Building2 class="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                        Manual Transfer Only
                      </span>
                    </div>
                  </div>
                  <div
                    v-else-if="paymentMethod.payment_method === 'payment_url'"
                    class="text-[10px] sm:text-xs text-slate-500 mt-1 truncate"
                  >
                    {{ paymentMethod.payment_url }}
                  </div>
                  <div
                    v-else-if="paymentMethod.payment_method === 'qr_code'"
                    class="text-[10px] sm:text-xs text-slate-500 mt-1"
                  >
                    QR Code Payment
                  </div>

                  <p v-if="paymentMethod.description" class="text-xs sm:text-sm text-slate-600 mt-1.5 sm:mt-2">
                    {{ paymentMethod.description }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div v-if="canEdit" class="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-4">
              <!-- QR Code Preview - Show for bank transfer with QR or standalone QR code -->
              <button
                v-if="
                  (paymentMethod.payment_method === 'bank_transfer' ||
                    paymentMethod.payment_method === 'qr_code') &&
                  paymentMethod.qr_code_image
                "
                @click="showQRPreview(paymentMethod)"
                class="text-slate-400 hover:text-[#1e90ff] p-1.5 sm:p-2 rounded-lg hover:bg-[#E6F4FF] transition-colors duration-200"
                title="View QR Code"
              >
                <QrCode class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <!-- Payment URL - Show external link for bank transfer with URL -->
              <a
                v-if="paymentMethod.payment_method === 'bank_transfer' && paymentMethod.payment_url"
                :href="paymentMethod.payment_url"
                target="_blank"
                class="text-slate-400 hover:text-purple-600 p-1.5 sm:p-2 rounded-lg hover:bg-purple-50 transition-colors duration-200"
                title="Open Payment Link"
                @click.stop
              >
                <ExternalLink class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>

              <!-- Edit Button -->
              <button
                @click="editPaymentMethod(paymentMethod)"
                class="text-slate-400 hover:text-[#1e90ff] p-1.5 sm:p-2 rounded-lg hover:bg-[#E6F4FF] transition-colors duration-200"
                title="Edit"
              >
                <Edit class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <!-- Delete Button -->
              <button
                @click="confirmDeletePaymentMethod(paymentMethod)"
                class="text-slate-400 hover:text-red-600 p-1.5 sm:p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                title="Delete"
              >
                <Trash2 class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Add Another Payment Method Button -->
        <div
          v-if="canEdit"
          @click="showAddModal = true"
          class="border-2 border-dashed rounded-2xl p-6 transition-all duration-300 text-center border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group"
        >
          <div class="flex flex-col items-center justify-center">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 bg-slate-200 group-hover:bg-emerald-100">
              <Plus class="w-6 h-6 transition-colors text-slate-400 group-hover:text-emerald-600" />
            </div>
            <p class="text-sm font-semibold transition-colors text-slate-600 group-hover:text-slate-900">Add Another Payment Method</p>
            <p class="text-xs text-slate-400 mt-1">Click to add</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <PaymentMethodModal
      v-if="showAddModal || showEditModal"
      :event-id="eventId"
      :existing-payment-method="editingPaymentMethod || undefined"
      @close="closeModals"
      @saved="handlePaymentMethodSaved"
    />

    <!-- QR Code Preview Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showQRModal"
          class="fixed inset-0 z-50 overflow-y-auto"
          @click="showQRModal = false"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 max-w-md w-full" @click.stop>
              <div class="flex items-center justify-between mb-3 sm:mb-4">
                <h3 class="text-base sm:text-lg font-semibold text-slate-900">
                  {{ previewingPaymentMethod?.name }}
                </h3>
                <button
                  @click="showQRModal = false"
                  class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X class="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <div class="text-center">
                <img
                  v-if="previewingPaymentMethod?.qr_code_image"
                  :src="getMediaUrl(previewingPaymentMethod.qr_code_image)"
                  :alt="previewingPaymentMethod.name + ' QR Code'"
                  class="w-full max-w-sm mx-auto rounded-lg sm:rounded-xl border border-gray-200"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="deleting"
      :title="'Delete Payment Method'"
      :item-name="deletingPaymentMethod?.name"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  CreditCard,
  Plus,
  AlertCircle,
  GripVertical,
  Edit,
  Trash2,
  QrCode,
  Building2,
  Link,
  ExternalLink,
  X,
} from 'lucide-vue-next'
import { paymentMethodsService, type EventPaymentMethod } from '../services/api'
import PaymentMethodModal from './PaymentMethodModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const paymentMethods = ref<EventPaymentMethod[]>([])

// Modal states
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingPaymentMethod = ref<EventPaymentMethod | null>(null)
const showQRModal = ref(false)
const previewingPaymentMethod = ref<EventPaymentMethod | undefined>(undefined)
const showDeleteModal = ref(false)
const deletingPaymentMethod = ref<EventPaymentMethod | null>(null)
const deleting = ref(false)

// Drag and drop state
const isDragging = ref(false)
const dragOverIndex = ref<number | null>(null)
const draggedPaymentMethod = ref<EventPaymentMethod | null>(null)
const draggedIndex = ref<number | null>(null)

// Helper methods
const getMediaUrl = (mediaUrl: string | null | undefined): string | undefined => {
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

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'bank_transfer':
      return Building2
    case 'qr_code':
      return QrCode
    case 'payment_url':
      return Link
    default:
      return CreditCard
  }
}

const getPaymentMethodIconBg = (method: string) => {
  switch (method) {
    case 'bank_transfer':
      return 'bg-[#B0E0E6]'
    case 'qr_code':
      return 'bg-purple-100'
    case 'payment_url':
      return 'bg-green-100'
    default:
      return 'bg-gray-100'
  }
}

const getPaymentMethodIconColor = (method: string) => {
  switch (method) {
    case 'bank_transfer':
      return 'text-[#1e90ff]'
    case 'qr_code':
      return 'text-purple-600'
    case 'payment_url':
      return 'text-green-600'
    default:
      return 'text-gray-600'
  }
}

const getPaymentTypeStyle = (type: string) => {
  switch (type) {
    case 'donation':
      return 'bg-green-100 text-green-800'
    case 'gift':
      return 'bg-purple-100 text-purple-800'
    case 'sponsorship':
      return 'bg-[#B0E0E6] text-[#1873cc]'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatPaymentType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const formatPaymentMethod = (method: string) => {
  switch (method) {
    case 'bank_transfer':
      return 'Bank Transfer'
    case 'qr_code':
      return 'QR Code'
    case 'payment_url':
      return 'Payment URL'
    default:
      return method
  }
}

// API methods
const loadPaymentMethods = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await paymentMethodsService.getPaymentMethods(props.eventId)
    if (response.success && response.data) {
      paymentMethods.value = response.data.results.sort((a, b) => a.order - b.order)
    } else {
      error.value = response.message || 'Failed to load payment methods'
    }
  } catch (err) {
    console.error('Error loading payment methods:', err)
    error.value = 'Network error while loading payment methods'
  } finally {
    loading.value = false
  }
}

// Modal handlers
const closeModals = () => {
  showAddModal.value = false
  showEditModal.value = false
  editingPaymentMethod.value = null
}

const editPaymentMethod = (paymentMethod: EventPaymentMethod) => {
  editingPaymentMethod.value = paymentMethod
  showEditModal.value = true
}

const showQRPreview = (paymentMethod: EventPaymentMethod) => {
  previewingPaymentMethod.value = paymentMethod
  showQRModal.value = true
}

const confirmDeletePaymentMethod = (paymentMethod: EventPaymentMethod) => {
  deletingPaymentMethod.value = paymentMethod
  showDeleteModal.value = true
}

const handlePaymentMethodSaved = (paymentMethod: EventPaymentMethod) => {
  if (editingPaymentMethod.value) {
    // Update existing payment method
    const index = paymentMethods.value.findIndex((pm) => pm.id === paymentMethod.id)
    if (index !== -1) {
      paymentMethods.value[index] = paymentMethod
    }
  } else {
    // Add new payment method
    paymentMethods.value.push(paymentMethod)
  }

  // Sort by order
  paymentMethods.value.sort((a, b) => a.order - b.order)

  closeModals()
}

const handleDeleteConfirm = async () => {
  if (!deletingPaymentMethod.value) return

  deleting.value = true

  try {
    const response = await paymentMethodsService.deletePaymentMethod(
      props.eventId,
      deletingPaymentMethod.value.id,
    )

    if (response.success) {
      paymentMethods.value = paymentMethods.value.filter(
        (pm) => pm.id !== deletingPaymentMethod.value!.id,
      )
      showDeleteModal.value = false
      deletingPaymentMethod.value = null
    } else {
      error.value = response.message || 'Failed to delete payment method'
    }
  } catch (err) {
    console.error('Error deleting payment method:', err)
    error.value = 'Network error while deleting payment method'
  } finally {
    deleting.value = false
  }
}

// Drag and drop handlers
const handleDragStart = (event: DragEvent, paymentMethod: EventPaymentMethod, index: number) => {
  if (!props.canEdit) return

  isDragging.value = true
  draggedPaymentMethod.value = paymentMethod
  draggedIndex.value = index

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleDragEnd = () => {
  isDragging.value = false
  dragOverIndex.value = null
  draggedPaymentMethod.value = null
  draggedIndex.value = null
}

const handleDragOver = (event: DragEvent, index: number) => {
  if (!props.canEdit || !isDragging.value) return

  event.preventDefault()
  dragOverIndex.value = index
}

const handleDrop = async (event: DragEvent) => {
  if (
    !props.canEdit ||
    !isDragging.value ||
    draggedPaymentMethod.value === null ||
    draggedIndex.value === null ||
    dragOverIndex.value === null
  )
    return

  event.preventDefault()

  const draggedItem = draggedPaymentMethod.value
  const fromIndex = draggedIndex.value
  const toIndex = dragOverIndex.value

  if (fromIndex === toIndex) return

  // Update local state immediately
  const newPaymentMethods = [...paymentMethods.value]
  newPaymentMethods.splice(fromIndex, 1)
  newPaymentMethods.splice(toIndex, 0, draggedItem)

  // Update order values
  const updates = newPaymentMethods.map((pm, index) => ({
    id: pm.id,
    order: index,
  }))

  // Update local state
  paymentMethods.value = newPaymentMethods.map((pm, index) => ({
    ...pm,
    order: index,
  }))

  // Update on server
  try {
    await paymentMethodsService.bulkReorderPaymentMethods(props.eventId, { updates })
  } catch (err) {
    console.error('Error reordering payment methods:', err)
    // Reload on error to sync with server
    loadPaymentMethods()
  }

  handleDragEnd()
}

// Initialize
onMounted(() => {
  loadPaymentMethods()
})
</script>

<style scoped>
.payment-method-card {
  transition: all 0.2s ease;
}

.payment-method-card.drag-over {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.payment-method-card:hover:not(.drag-over) {
  border-color: #e2e8f0;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
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
</style>
