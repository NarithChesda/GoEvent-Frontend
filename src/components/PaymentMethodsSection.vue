<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h5 class="font-semibold text-slate-900 flex items-center">
          <CreditCard class="w-5 h-5 mr-2" />
          Payment Methods
        </h5>
        <p class="text-sm text-slate-600 mt-1">Manage payment options for gifts, donations, and sponsorships</p>
      </div>
      <button
        v-if="canEdit"
        @click="showAddModal = true"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center space-x-2"
      >
        <Plus class="w-4 h-4" />
        <span>Add Payment Method</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
      <div class="flex items-center space-x-2">
        <AlertCircle class="w-5 h-5 text-red-500" />
        <div class="flex-1">
          <p class="text-red-600 font-medium">{{ error }}</p>
          <button
            @click="loadPaymentMethods"
            class="text-red-600 text-sm hover:text-red-700 underline mt-1"
          >
            Try again
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="paymentMethods.length === 0" class="text-center py-12">
      <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CreditCard class="w-8 h-8 text-slate-400" />
      </div>
      <h3 class="text-lg font-medium text-slate-900 mb-2">No Payment Methods</h3>
      <p class="text-slate-600 mb-4">Add payment methods to allow guests to send gifts or make donations</p>
      <button
        v-if="canEdit"
        @click="showAddModal = true"
        class="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors duration-200"
      >
        <Plus class="w-4 h-4" />
        <span>Add First Payment Method</span>
      </button>
    </div>

    <!-- Payment Methods List -->
    <div v-else>
      <!-- Sortable Payment Methods -->
      <div
        class="space-y-4"
        @dragover.prevent
        @drop="handleDrop"
      >
        <div
          v-for="(paymentMethod, index) in paymentMethods"
          :key="paymentMethod.id"
          :draggable="canEdit"
          @dragstart="handleDragStart($event, paymentMethod, index)"
          @dragend="handleDragEnd"
          @dragover="handleDragOver($event, index)"
          class="payment-method-card bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
          :class="{
            'cursor-grab': canEdit,
            'cursor-grabbing': isDragging,
            'opacity-50': !paymentMethod.is_active,
            'drag-over': dragOverIndex === index
          }"
        >
          <div class="flex items-center justify-between">
            <!-- Payment Method Info -->
            <div class="flex-1">
              <div class="flex items-center space-x-3">
                <!-- Drag Handle -->
                <div v-if="canEdit" class="flex items-center text-gray-400 hover:text-gray-600">
                  <GripVertical class="w-4 h-4" />
                </div>

                <!-- Payment Method Icon -->
                <div class="w-10 h-10 rounded-full flex items-center justify-center"
                     :class="getPaymentMethodIconBg(paymentMethod.payment_method)">
                  <component 
                    :is="getPaymentMethodIcon(paymentMethod.payment_method)"
                    class="w-5 h-5"
                    :class="getPaymentMethodIconColor(paymentMethod.payment_method)"
                  />
                </div>

                <!-- Payment Method Details -->
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <h6 class="font-medium text-slate-900">{{ paymentMethod.name }}</h6>
                    <span 
                      class="px-2 py-1 rounded-full text-xs font-medium"
                      :class="getPaymentTypeStyle(paymentMethod.payment_type)"
                    >
                      {{ formatPaymentType(paymentMethod.payment_type) }}
                    </span>
                    <span v-if="!paymentMethod.is_active" class="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      Inactive
                    </span>
                  </div>
                  
                  <div class="text-sm text-slate-600 mt-1">
                    <span class="font-medium">{{ formatPaymentMethod(paymentMethod.payment_method) }}</span>
                    <span v-if="paymentMethod.currency" class="ml-2">• {{ paymentMethod.currency }}</span>
                  </div>

                  <!-- Method-specific details -->
                  <div v-if="paymentMethod.payment_method === 'bank_transfer'" class="space-y-1 mt-2">
                    <div class="text-xs text-slate-600">
                      <span class="font-medium">Bank:</span> {{ paymentMethod.bank_name }}
                    </div>
                    <div class="text-xs text-slate-600">
                      <span class="font-medium">Account:</span> {{ paymentMethod.account_name }} - {{ paymentMethod.account_number }}
                    </div>
                    
                    <!-- Access Methods -->
                    <div class="flex flex-wrap gap-2 mt-2">
                      <span v-if="paymentMethod.qr_code_image" 
                            class="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">
                        <QrCode class="w-3 h-3 mr-1" />
                        QR Code Available
                      </span>
                      <span v-if="paymentMethod.payment_url" 
                            class="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs">
                        <Link class="w-3 h-3 mr-1" />
                        Online Payment
                      </span>
                      <span v-if="!paymentMethod.qr_code_image && !paymentMethod.payment_url" 
                            class="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs">
                        <Building2 class="w-3 h-3 mr-1" />
                        Manual Transfer Only
                      </span>
                    </div>
                  </div>
                  <div v-else-if="paymentMethod.payment_method === 'payment_url'" class="text-xs text-slate-500 mt-1">
                    {{ paymentMethod.payment_url }}
                  </div>
                  <div v-else-if="paymentMethod.payment_method === 'qr_code'" class="text-xs text-slate-500 mt-1">
                    QR Code Payment
                  </div>
                  
                  <p v-if="paymentMethod.description" class="text-sm text-slate-600 mt-2">
                    {{ paymentMethod.description }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div v-if="canEdit" class="flex items-center space-x-2 ml-4">
              <!-- QR Code Preview - Show for bank transfer with QR or standalone QR code -->
              <button
                v-if="(paymentMethod.payment_method === 'bank_transfer' || paymentMethod.payment_method === 'qr_code') && paymentMethod.qr_code_image"
                @click="showQRPreview(paymentMethod)"
                class="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                title="View QR Code"
              >
                <QrCode class="w-4 h-4" />
              </button>
              
              <!-- Payment URL - Show external link for bank transfer with URL -->
              <a
                v-if="paymentMethod.payment_method === 'bank_transfer' && paymentMethod.payment_url"
                :href="paymentMethod.payment_url"
                target="_blank"
                class="text-slate-400 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors duration-200"
                title="Open Payment Link"
                @click.stop
              >
                <ExternalLink class="w-4 h-4" />
              </a>

              <!-- Edit Button -->
              <button
                @click="editPaymentMethod(paymentMethod)"
                class="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                title="Edit"
              >
                <Edit class="w-4 h-4" />
              </button>

              <!-- Delete Button -->
              <button
                @click="confirmDeletePaymentMethod(paymentMethod)"
                class="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                title="Delete"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
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
        <div v-if="showQRModal" class="fixed inset-0 z-50 overflow-y-auto" @click="showQRModal = false">
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div 
              class="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
              @click.stop
            >
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-slate-900">{{ previewingPaymentMethod?.name }}</h3>
                <button
                  @click="showQRModal = false"
                  class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>
              <div class="text-center">
                <img
                  v-if="previewingPaymentMethod?.qr_code_image"
                  :src="getMediaUrl(previewingPaymentMethod.qr_code_image)"
                  :alt="previewingPaymentMethod.name + ' QR Code'"
                  class="w-full max-w-sm mx-auto rounded-xl border border-gray-200"
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
  X
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
      return 'bg-blue-100'
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
      return 'text-blue-600'
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
      return 'bg-blue-100 text-blue-800'
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
    const index = paymentMethods.value.findIndex(pm => pm.id === paymentMethod.id)
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
      deletingPaymentMethod.value.id
    )
    
    if (response.success) {
      paymentMethods.value = paymentMethods.value.filter(
        pm => pm.id !== deletingPaymentMethod.value!.id
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
  if (!props.canEdit || !isDragging.value || draggedPaymentMethod.value === null || draggedIndex.value === null || dragOverIndex.value === null) return
  
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
    order: index
  }))
  
  // Update local state
  paymentMethods.value = newPaymentMethods.map((pm, index) => ({
    ...pm,
    order: index
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
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
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