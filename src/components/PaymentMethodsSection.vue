<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h5 class="font-semibold text-slate-900">Payment Methods</h5>
            <span
              v-if="isPaymentLocked"
              class="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium"
            >
              <Lock class="w-3 h-3 mr-1" />
              Locked
            </span>
          </div>
          <p class="text-sm text-slate-600">Add payment options for gifts, donations, and sponsorships</p>
          <p v-if="isPaymentLocked" class="text-xs text-amber-700 mt-1">
            Payment methods are currently locked. Only administrators can unlock to make changes.
          </p>
        </div>

        <!-- Lock/Unlock Button & Info Button -->
        <div class="flex items-center gap-2">
          <!-- Info Button -->
          <button
            v-if="canEdit"
            @click="showLockHelpModal = true"
            class="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Learn about the lock feature"
          >
            <Info class="w-4 h-4" />
          </button>

          <!-- Lock/Unlock Button -->
          <button
            v-if="canEdit"
            @click="showLockConfirmModal = true"
            :disabled="isToggling"
            :class="[
              'flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200',
              'border-2 focus:outline-none focus:ring-2 focus:ring-offset-2',
              isPaymentLocked
                ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-500'
                : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 focus:ring-slate-500',
              isToggling ? 'opacity-50 cursor-not-allowed' : ''
            ]"
          >
            <component
              :is="isToggling ? 'div' : (isPaymentLocked ? Lock : Unlock)"
              :class="[
                'w-4 h-4',
                isToggling ? 'animate-spin rounded-full border-2 border-current border-t-transparent' : ''
              ]"
            />
            <span>{{ isToggling ? 'Processing...' : (isPaymentLocked ? 'Unlock' : 'Lock') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Lock Error Message (shown above content) -->
    <div v-if="lockError" class="mb-4">
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div class="flex items-start space-x-3">
          <Lock class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm text-amber-900 font-semibold mb-2">Permission Denied</p>
            <p class="text-sm text-amber-800 mb-1">
              Only administrators can unlock payment methods.
            </p>
            <p class="text-xs text-amber-700">
              Please contact an administrator if you need to make changes to payment methods.
            </p>
            <button
              @click="lockError = null"
              class="text-amber-700 text-xs hover:text-amber-900 font-medium underline mt-3"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
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
        @click="canEditPayments ? showAddModal = true : null"
        :class="[
          'border-2 border-dashed rounded-2xl p-8 transition-all duration-300 text-center',
          canEditPayments
            ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group'
            : 'border-slate-300 bg-slate-50'
        ]"
      >
        <div class="flex flex-col items-center justify-center min-h-[120px]">
          <div :class="[
            'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300',
            canEditPayments ? 'bg-slate-200 group-hover:bg-emerald-100' : 'bg-slate-200'
          ]">
            <Plus v-if="canEditPayments" :class="[
              'w-8 h-8 transition-colors',
              'text-slate-400 group-hover:text-emerald-600'
            ]" />
            <CreditCard v-else class="w-8 h-8 text-slate-400" />
          </div>
          <p :class="[
            'font-semibold transition-colors',
            canEditPayments ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-600'
          ]">No payment methods added</p>
          <p class="text-sm text-slate-500 mt-1">Add payment options for gifts, donations, and sponsorships</p>
          <p v-if="canEditPayments" class="text-xs text-slate-400 mt-1">Click to add</p>
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
          :draggable="canEditPayments"
          @dragstart="handleDragStart($event, paymentMethod, index)"
          @dragend="handleDragEnd"
          @dragover="handleDragOver($event, index)"
          class="payment-method-card bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all duration-200"
          :class="{
            'cursor-grab': canEditPayments,
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
                <div v-if="canEditPayments" class="flex items-center text-gray-400 hover:text-gray-600">
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
            <div v-if="props.canEdit" class="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-4">
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
                class="text-slate-400 hover:text-purple-600 p-1.5 sm:p-2 rounded-lg hover:bg-purple-50 transition-colors duration-200"
                title="Open Payment Link"
                @click.stop
              >
                <ExternalLink class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </a>

              <!-- Edit Button -->
              <button
                @click="editPaymentMethod(paymentMethod)"
                :disabled="isPaymentLocked"
                :class="[
                  'p-1.5 sm:p-2 rounded-lg transition-colors duration-200',
                  isPaymentLocked
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-400 hover:text-[#1e90ff] hover:bg-[#E6F4FF]'
                ]"
                :title="isPaymentLocked ? 'Locked - Cannot edit' : 'Edit'"
              >
                <Edit class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <!-- Delete Button -->
              <button
                @click="confirmDeletePaymentMethod(paymentMethod)"
                :disabled="isPaymentLocked"
                :class="[
                  'p-1.5 sm:p-2 rounded-lg transition-colors duration-200',
                  isPaymentLocked
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                ]"
                :title="isPaymentLocked ? 'Locked - Cannot delete' : 'Delete'"
              >
                <Trash2 class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Add Another Payment Method Button -->
        <div
          v-if="canEditPayments"
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

    <!-- Lock Feature Help Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showLockHelpModal"
          class="fixed inset-0 z-50 overflow-y-auto"
          @click="showLockHelpModal = false"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full" @click.stop>
              <!-- Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Lock class="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 class="text-lg font-semibold text-slate-900">About the Lock Feature</h3>
                </div>
                <button
                  @click="showLockHelpModal = false"
                  class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>

              <!-- Content -->
              <div class="space-y-4">
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p class="text-sm text-blue-900 mb-3">
                    Use the lock feature to prevent accidental changes to payment methods and maintain control over sensitive financial information.
                  </p>

                  <div class="space-y-3">
                    <div>
                      <h4 class="text-sm font-semibold text-blue-900 mb-2">When Locked:</h4>
                      <ul class="space-y-1.5 text-sm text-blue-800">
                        <li class="flex items-start gap-2">
                          <span class="text-blue-600 mt-0.5">•</span>
                          <span>Collaborators cannot add, edit, or delete payment methods</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-blue-600 mt-0.5">•</span>
                          <span>Payment methods remain visible to all with access</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-blue-600 mt-0.5">•</span>
                          <span>Editing controls are disabled for non-administrators</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-blue-600 mt-0.5">•</span>
                          <span>Only event administrators can unlock to make changes</span>
                        </li>
                      </ul>
                    </div>

                    <div class="pt-3 border-t border-blue-200">
                      <h4 class="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
                        <span>💡</span>
                        <span>Best Practices:</span>
                      </h4>
                      <ul class="space-y-1.5 text-sm text-blue-800">
                        <li class="flex items-start gap-2">
                          <span class="text-blue-600 mt-0.5">•</span>
                          <span>Lock payment methods before sharing event access with collaborators</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-blue-600 mt-0.5">•</span>
                          <span>Review and finalize payment details before locking</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-blue-600 mt-0.5">•</span>
                          <span>Keep locked during event to prevent unwanted modifications</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- Close Button -->
                <div class="flex justify-end pt-2">
                  <button
                    @click="showLockHelpModal = false"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Lock/Unlock Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showLockConfirmModal"
          class="fixed inset-0 z-50 overflow-y-auto"
          @click="showLockConfirmModal = false"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full" @click.stop>
              <!-- Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      isPaymentLocked ? 'bg-amber-100' : 'bg-slate-100'
                    ]"
                  >
                    <component
                      :is="isPaymentLocked ? Unlock : Lock"
                      :class="[
                        'w-5 h-5',
                        isPaymentLocked ? 'text-amber-600' : 'text-slate-600'
                      ]"
                    />
                  </div>
                  <h3 class="text-lg font-semibold text-slate-900">
                    {{ isPaymentLocked ? 'Unlock Payment Methods?' : 'Lock Payment Methods?' }}
                  </h3>
                </div>
                <button
                  @click="showLockConfirmModal = false"
                  class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>

              <!-- Content -->
              <div class="mb-6">
                <p class="text-sm text-slate-600 mb-3">
                  {{ isPaymentLocked
                    ? 'Are you sure you want to unlock payment methods? This will allow collaborators to make changes.'
                    : 'Are you sure you want to lock payment methods? This will prevent collaborators from making changes.'
                  }}
                </p>
                <div
                  :class="[
                    'p-3 rounded-xl border',
                    isPaymentLocked
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  ]"
                >
                  <p class="text-xs text-slate-700">
                    {{ isPaymentLocked
                      ? 'Once unlocked, any collaborator with edit access can add, modify, or delete payment methods.'
                      : 'Once locked, only administrators will be able to unlock and make changes to payment methods.'
                    }}
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 justify-end">
                <button
                  @click="showLockConfirmModal = false"
                  class="px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  @click="handleLockConfirm"
                  :disabled="isToggling"
                  :class="[
                    'px-4 py-2 rounded-xl font-medium transition-colors duration-200',
                    isPaymentLocked
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-slate-600 hover:bg-slate-700 text-white',
                    isToggling ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                >
                  {{ isToggling ? 'Processing...' : (isPaymentLocked ? 'Unlock' : 'Lock') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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
  Lock,
  Unlock,
  Info,
} from 'lucide-vue-next'
import { paymentMethodsService, eventsService, type EventPaymentMethod, type Event } from '../services/api'
import PaymentMethodModal from './PaymentMethodModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventId: string
  canEdit: boolean
  event?: Event
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'event-updated': [event: Event]
}>()

// State
const loading = ref(false)
const error = ref<string | null>(null)
const lockError = ref<string | null>(null)
const paymentMethods = ref<EventPaymentMethod[]>([])
const isToggling = ref(false)
const localEvent = ref<Event | undefined>(props.event)

// Modal states
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingPaymentMethod = ref<EventPaymentMethod | null>(null)
const showQRModal = ref(false)
const previewingPaymentMethod = ref<EventPaymentMethod | undefined>(undefined)
const showDeleteModal = ref(false)
const deletingPaymentMethod = ref<EventPaymentMethod | null>(null)
const deleting = ref(false)
const showLockHelpModal = ref(false)
const showLockConfirmModal = ref(false)

// Drag and drop state
const isDragging = ref(false)
const dragOverIndex = ref<number | null>(null)
const draggedPaymentMethod = ref<EventPaymentMethod | null>(null)
const draggedIndex = ref<number | null>(null)

// Computed properties for lock functionality
const isPaymentLocked = computed(() => {
  return localEvent.value?.payment_lock ?? false
})

const canEditPayments = computed(() => {
  return props.canEdit && !isPaymentLocked.value
})

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

// Lock/Unlock confirmation handler
const handleLockConfirm = async () => {
  if (!props.eventId) return

  isToggling.value = true
  error.value = null
  lockError.value = null

  try {
    const newLockState = !isPaymentLocked.value
    const response = await eventsService.patchEvent(props.eventId, {
      payment_lock: newLockState
    })

    if (response.success && response.data) {
      localEvent.value = response.data
      emit('event-updated', response.data)

      // Show success message
      const message = newLockState ? 'Payment methods locked successfully' : 'Payment methods unlocked successfully'
      console.log(message)

      // Clear any previous errors
      lockError.value = null

      // Close the confirmation modal
      showLockConfirmModal.value = false
    } else {
      // Handle specific unlock permission error
      const errorMessage = response.message || `Failed to ${newLockState ? 'lock' : 'unlock'} payment methods`
      const lowerMessage = errorMessage.toLowerCase()

      // Debug logging
      console.log('Lock toggle failed:', {
        newLockState,
        errorMessage,
        response
      })

      // Check if this is an unlock permission error
      // Trying to unlock (newLockState = false) and getting permission-related error
      if (!newLockState && (
        lowerMessage.includes('superuser') ||
        lowerMessage.includes('only superusers') ||
        lowerMessage.includes('permission') ||
        lowerMessage.includes('not have permission') ||
        lowerMessage.includes('do not have permission') ||
        lowerMessage.includes('unauthorized') ||
        lowerMessage.includes('forbidden') ||
        lowerMessage.includes('invalid request')
      )) {
        // Show custom permission denied message
        lockError.value = 'unlock_permission_denied'
      } else {
        error.value = errorMessage
      }

      // Close the confirmation modal even on error
      showLockConfirmModal.value = false
    }
  } catch (err) {
    console.error('Error toggling payment lock:', err)
    error.value = 'Network error while updating payment lock'
    showLockConfirmModal.value = false
  } finally {
    isToggling.value = false
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
  if (!canEditPayments.value) return

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
  if (!canEditPayments.value || !isDragging.value) return

  event.preventDefault()
  dragOverIndex.value = index
}

const handleDrop = async (event: DragEvent) => {
  if (
    !canEditPayments.value ||
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

// Watch for event prop changes
watch(
  () => props.event,
  (newEvent) => {
    if (newEvent) {
      localEvent.value = newEvent
    }
  },
  { deep: true }
)

// Clear lock error when payment is unlocked (e.g., by a superuser)
watch(
  () => isPaymentLocked.value,
  (newLocked) => {
    if (!newLocked) {
      lockError.value = null
    }
  }
)

// Initialize
onMounted(() => {
  loadPaymentMethods()
})

// Expose method for parent component (Smart FAB via EventMediaTab)
defineExpose({
  openAddModal: () => {
    showAddModal.value = true
  }
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
