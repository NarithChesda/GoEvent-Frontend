<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
    <!-- Header (click to expand/collapse) -->
    <div>
      <div class="flex items-start justify-between gap-4">
        <button
          type="button"
          class="flex-1 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 rounded-lg"
          :aria-expanded="isExpanded"
          :aria-label="t('management.media.sectionToggle')"
          @click="toggleExpanded"
        >
          <div class="flex items-center gap-2">
            <h5 class="font-semibold text-slate-900">{{ t('management.paymentMethods.header.title') }}</h5>
            <span
              v-if="isPaymentLocked"
              class="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium"
            >
              <Lock class="w-3 h-3 mr-1" />
              {{ t('management.paymentMethods.header.lockedBadge') }}
            </span>
          </div>
          <p class="text-sm text-slate-600">{{ t('management.paymentMethods.header.subtitle') }}</p>
          <p v-if="isPaymentLocked" class="text-xs text-amber-700 mt-1">
            {{ t('management.paymentMethods.header.lockedDescription') }}
          </p>
        </button>

        <!-- Add, Lock, Info & Toggle Buttons -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- Add Pill -->
          <button
            v-if="canEditPayments && paymentMethods.length > 0"
            @click="showAddModal = true"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-full hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 transition-all"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>{{ t('management.paymentMethods.header.add') }}</span>
          </button>

          <!-- Info Button -->
          <button
            v-if="canEdit"
            @click="showLockHelpModal = true"
            class="p-2 text-slate-400 hover:text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            :title="t('management.paymentMethods.header.lockHelpTitle')"
          >
            <Info class="w-4 h-4" />
          </button>

          <!-- Lock/Unlock Button -->
          <button
            v-if="canEdit"
            @click="showLockConfirmModal = true"
            :disabled="isToggling"
            :class="[
              'flex items-center justify-center rounded-xl font-medium text-sm transition-all duration-200',
              'border-2 focus:outline-none focus:ring-2 focus:ring-offset-2',
              'p-2 sm:gap-2 sm:px-4 sm:py-2',
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
            <span class="hidden sm:inline">{{ isToggling ? t('management.paymentMethods.header.processing') : (isPaymentLocked ? t('management.paymentMethods.header.unlock') : t('management.paymentMethods.header.lock')) }}</span>
          </button>

          <button
            type="button"
            class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            :aria-expanded="isExpanded"
            :aria-label="t('management.media.sectionToggle')"
            :title="t('management.media.sectionToggle')"
            @click="toggleExpanded"
          >
            <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isExpanded }" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <Transition name="collapse">
    <div v-if="isExpanded" class="grid grid-rows-[1fr]">
    <div class="min-h-0 overflow-hidden">
    <div class="pt-6">
    <!-- Lock Error Message (shown above content) -->
    <div v-if="lockError" class="mb-4">
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div class="flex items-start space-x-3">
          <Lock class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-sm text-amber-900 font-semibold mb-2">{{ t('management.paymentMethods.lockError.title') }}</p>
            <p class="text-sm text-amber-800 mb-1">
              {{ t('management.paymentMethods.lockError.description') }}
            </p>
            <p class="text-xs text-amber-700">
              {{ t('management.paymentMethods.lockError.contact') }}
            </p>
            <button
              @click="lockError = null"
              class="text-amber-700 text-xs hover:text-amber-900 font-medium underline mt-3"
            >
              {{ t('management.paymentMethods.lockError.dismiss') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden animate-pulse">
      <div v-for="i in 3" :key="i" class="flex items-center gap-3 p-3 sm:p-4 min-h-[56px]">
        <div class="w-9 h-9 rounded-lg bg-slate-200 flex-shrink-0"></div>
        <div class="flex-1 min-w-0 space-y-2">
          <div class="h-3.5 bg-slate-200 rounded w-1/3"></div>
          <div class="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div class="w-4 h-4 bg-slate-200 rounded flex-shrink-0"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8 sm:py-12">
      <div class="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
        <AlertCircle class="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
      </div>
      <p class="text-sm sm:text-base text-slate-600 max-w-md mx-auto">{{ error }}</p>
      <button
        @click="loadPaymentMethods"
        class="mt-4 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
      >
        {{ t('management.paymentMethods.error.tryAgain') }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="paymentMethods.length === 0">
      <button
        type="button"
        :disabled="!canEditPayments"
        @click="showAddModal = true"
        :class="[
          'w-full border-2 border-dashed rounded-2xl p-8 transition-all duration-300 text-center',
          canEditPayments
            ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'
            : 'border-slate-300 bg-slate-50 cursor-default'
        ]"
      >
        <div class="flex flex-col items-center justify-center min-h-[120px]">
          <div :class="[
            'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300',
            canEditPayments ? 'bg-slate-200 group-hover:bg-emerald-100' : 'bg-slate-200'
          ]">
            <Plus v-if="canEditPayments" class="w-8 h-8 transition-colors text-slate-400 group-hover:text-emerald-600" />
            <CreditCard v-else class="w-8 h-8 text-slate-400" />
          </div>
          <p :class="[
            'font-semibold transition-colors',
            canEditPayments ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-600'
          ]">{{ t('management.paymentMethods.empty.title') }}</p>
          <p class="text-sm text-slate-500 mt-1">{{ t('management.paymentMethods.empty.description') }}</p>
          <p v-if="canEditPayments" class="text-xs text-slate-400 mt-1">{{ t('management.paymentMethods.empty.clickToAdd') }}</p>
        </div>
      </button>
    </div>

    <!-- Payment Methods Row List -->
    <div v-else>
      <div
        class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden"
        @dragover.prevent
        @drop="handleDrop"
      >
        <div
          v-for="(paymentMethod, index) in paymentMethods"
          :key="paymentMethod.id"
          :draggable="canEditPayments"
          @dragstart="handleDragStart($event, paymentMethod, index)"
          @dragend="handleDragEnd"
          @dragover="handleDragOver($event, index)"
          :class="[
            'flex items-center transition-colors duration-200',
            dragOverIndex === index ? 'bg-sky-50' : canEditPayments ? 'hover:bg-slate-50' : '',
            isDragging && draggedPaymentMethod?.id === paymentMethod.id ? 'opacity-50' : '',
          ]"
        >
          <!-- Row Main (opens edit drawer) -->
          <button
            type="button"
            :disabled="!canEditPayments"
            @click="editPaymentMethod(paymentMethod)"
            :class="[
              'flex-1 min-w-0 flex items-center gap-3 p-3 sm:p-4 min-h-[56px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-inset',
              canEditPayments ? 'active:bg-slate-100 cursor-pointer' : 'cursor-default',
              !paymentMethod.is_active ? 'opacity-60' : '',
            ]"
          >
            <!-- Method Icon -->
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="getPaymentMethodIconBg(paymentMethod.payment_method)"
            >
              <component
                :is="getPaymentMethodIcon(paymentMethod.payment_method)"
                class="w-4 h-4"
                :class="getPaymentMethodIconColor(paymentMethod.payment_method)"
              />
            </div>

            <!-- Details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-slate-900 truncate">{{ paymentMethod.name }}</p>
                <span
                  class="px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap flex-shrink-0"
                  :class="getPaymentTypeStyle(paymentMethod.payment_type)"
                >
                  {{ formatPaymentType(paymentMethod.payment_type) }}
                </span>
                <span
                  v-if="!paymentMethod.is_active"
                  class="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium whitespace-nowrap flex-shrink-0"
                >
                  {{ t('management.paymentMethods.card.inactive') }}
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-500 line-clamp-1 mt-0.5">
                {{ getRowPreview(paymentMethod) }}
              </p>
            </div>
          </button>

          <!-- Trailing Actions -->
          <div class="flex items-center gap-1 pr-3 sm:pr-4 flex-shrink-0">
            <!-- QR Code Preview -->
            <button
              v-if="paymentMethod.qr_code_image"
              @click.stop="showQRPreview(paymentMethod)"
              class="p-1.5 text-slate-400 hover:text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors duration-200"
              :title="t('management.paymentMethods.card.titleViewQr')"
            >
              <QrCode class="w-4 h-4" />
            </button>

            <!-- Payment URL -->
            <a
              v-if="paymentMethod.payment_method === 'bank_transfer' && paymentMethod.payment_url"
              :href="paymentMethod.payment_url"
              target="_blank"
              rel="noopener noreferrer"
              class="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200"
              :title="t('management.paymentMethods.card.titleOpenLink')"
              @click.stop
            >
              <ExternalLink class="w-4 h-4" />
            </a>

            <ChevronRight v-if="canEditPayments" class="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
    </div>
    </Transition>

    <!-- Modals -->
    <PaymentMethodModal
      :show="showAddModal || showEditModal"
      :event-id="eventId"
      :existing-payment-method="editingPaymentMethod || undefined"
      @close="closeModals"
      @saved="handlePaymentMethodSaved"
      @delete="handleDrawerDelete"
    />

    <!-- QR Code Preview Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showQRModal"
          class="fixed inset-0 z-[1000] overflow-y-auto"
          @click="showQRModal = false"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-6 max-w-md w-full" @click.stop>
              <div class="flex items-center justify-between mb-3 sm:mb-4">
                <h3 class="text-base sm:text-lg font-semibold text-slate-900">
                  {{ previewingPaymentMethod?.name }}
                </h3>
                <button
                  @click="showQRModal = false"
                  class="text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  <X class="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <div class="text-center">
                <img
                  v-if="previewingPaymentMethod?.qr_code_image"
                  :src="getMediaUrl(previewingPaymentMethod.qr_code_image)"
                  :alt="previewingPaymentMethod.name + ' QR Code'"
                  class="w-full max-w-sm mx-auto rounded-lg sm:rounded-xl border border-slate-200"
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
      :title="t('management.paymentMethods.deleteModal.title')"
      :item-name="deletingPaymentMethod?.name"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteModal = false"
    />

    <!-- Lock Feature Help Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showLockHelpModal"
          class="fixed inset-0 z-[1000] overflow-y-auto"
          @click="showLockHelpModal = false"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-6 max-w-lg w-full" @click.stop>
              <!-- Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                    <Lock class="w-5 h-5 text-sky-600" />
                  </div>
                  <h3 class="text-lg font-semibold text-slate-900">{{ t('management.paymentMethods.helpModal.title') }}</h3>
                </div>
                <button
                  @click="showLockHelpModal = false"
                  class="text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>

              <!-- Content -->
              <div class="space-y-4">
                <div class="bg-sky-50 border border-sky-200 rounded-xl p-4">
                  <p class="text-sm text-sky-900 mb-3">
                    {{ t('management.paymentMethods.helpModal.intro') }}
                  </p>

                  <div class="space-y-3">
                    <div>
                      <h4 class="text-sm font-semibold text-sky-900 mb-2">{{ t('management.paymentMethods.helpModal.whenLockedTitle') }}</h4>
                      <ul class="space-y-1.5 text-sm text-slate-600">
                        <li class="flex items-start gap-2">
                          <span class="text-sky-600 mt-0.5">•</span>
                          <span>{{ t('management.paymentMethods.helpModal.whenLocked.item1') }}</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-sky-600 mt-0.5">•</span>
                          <span>{{ t('management.paymentMethods.helpModal.whenLocked.item2') }}</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-sky-600 mt-0.5">•</span>
                          <span>{{ t('management.paymentMethods.helpModal.whenLocked.item3') }}</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-sky-600 mt-0.5">•</span>
                          <span>{{ t('management.paymentMethods.helpModal.whenLocked.item4') }}</span>
                        </li>
                      </ul>
                    </div>

                    <div class="pt-3 border-t border-sky-200">
                      <h4 class="text-sm font-semibold text-sky-900 mb-2 flex items-center gap-1.5">
                        <span>💡</span>
                        <span>{{ t('management.paymentMethods.helpModal.bestPracticesTitle') }}</span>
                      </h4>
                      <ul class="space-y-1.5 text-sm text-slate-600">
                        <li class="flex items-start gap-2">
                          <span class="text-sky-600 mt-0.5">•</span>
                          <span>{{ t('management.paymentMethods.helpModal.bestPractices.item1') }}</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-sky-600 mt-0.5">•</span>
                          <span>{{ t('management.paymentMethods.helpModal.bestPractices.item2') }}</span>
                        </li>
                        <li class="flex items-start gap-2">
                          <span class="text-sky-600 mt-0.5">•</span>
                          <span>{{ t('management.paymentMethods.helpModal.bestPractices.item3') }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- Close Button -->
                <div class="flex justify-end pt-2">
                  <button
                    @click="showLockHelpModal = false"
                    class="px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md transition-all duration-200"
                  >
                    {{ t('management.paymentMethods.helpModal.gotIt') }}
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
          class="fixed inset-0 z-[1000] overflow-y-auto"
          @click="showLockConfirmModal = false"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-6 max-w-md w-full" @click.stop>
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
                    {{ isPaymentLocked ? t('management.paymentMethods.lockConfirmModal.titleUnlock') : t('management.paymentMethods.lockConfirmModal.titleLock') }}
                  </h3>
                </div>
                <button
                  @click="showLockConfirmModal = false"
                  class="text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>

              <!-- Content -->
              <div class="mb-6">
                <p class="text-sm text-slate-600 mb-3">
                  {{ isPaymentLocked
                    ? t('management.paymentMethods.lockConfirmModal.descriptionUnlock')
                    : t('management.paymentMethods.lockConfirmModal.descriptionLock')
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
                      ? t('management.paymentMethods.lockConfirmModal.noteUnlock')
                      : t('management.paymentMethods.lockConfirmModal.noteLock')
                    }}
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 justify-end">
                <button
                  @click="showLockConfirmModal = false"
                  class="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  {{ t('management.paymentMethods.lockConfirmModal.cancel') }}
                </button>
                <button
                  @click="handleLockConfirm"
                  :disabled="isToggling"
                  :class="[
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
                    isPaymentLocked
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-slate-600 hover:bg-slate-700 text-white',
                    isToggling ? 'opacity-50 cursor-not-allowed' : ''
                  ]"
                >
                  {{ isToggling ? t('management.paymentMethods.lockConfirmModal.processing') : (isPaymentLocked ? t('management.paymentMethods.header.unlock') : t('management.paymentMethods.header.lock')) }}
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
  ChevronDown,
  ChevronRight,
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
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCollapsibleSection } from '@/composables/useCollapsibleSection'
import PaymentMethodModal from './PaymentMethodModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventId: string
  canEdit: boolean
  event?: Event
}

const { t } = useAppLanguage()
const { isExpanded, toggle: toggleExpanded } = useCollapsibleSection('payment')

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
      return 'bg-sky-100'
    case 'qr_code':
      return 'bg-purple-100'
    case 'payment_url':
      return 'bg-green-100'
    default:
      return 'bg-slate-100'
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
      return 'text-slate-600'
  }
}

const getPaymentTypeStyle = (type: string) => {
  switch (type) {
    case 'ticket_sales':
      return 'bg-emerald-100 text-emerald-800'
    case 'donation':
      return 'bg-green-100 text-green-800'
    case 'gift':
      return 'bg-purple-100 text-purple-800'
    case 'sponsorship':
      return 'bg-sky-100 text-sky-700'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

const formatPaymentType = (type: string) => {
  if (type === 'ticket_sales') return t('management.paymentMethods.modal.fields.typeTicketSales')
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const formatPaymentMethod = (method: string) => {
  switch (method) {
    case 'bank_transfer':
      return t('management.paymentMethods.methods.bankTransfer')
    case 'qr_code':
      return t('management.paymentMethods.methods.qrCode')
    case 'payment_url':
      return t('management.paymentMethods.methods.paymentUrl')
    default:
      return method
  }
}

const getRowPreview = (paymentMethod: EventPaymentMethod): string => {
  const parts: string[] = [formatPaymentMethod(paymentMethod.payment_method)]
  if (paymentMethod.currency) parts.push(paymentMethod.currency)

  if (paymentMethod.payment_method === 'bank_transfer') {
    if (paymentMethod.bank_name) parts.push(paymentMethod.bank_name)
    if (paymentMethod.account_name || paymentMethod.account_number) {
      parts.push([paymentMethod.account_name, paymentMethod.account_number].filter(Boolean).join(' – '))
    }
  } else if (paymentMethod.payment_method === 'payment_url' && paymentMethod.payment_url) {
    parts.push(paymentMethod.payment_url)
  }

  return parts.join(' · ')
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
      error.value = response.message || t('management.paymentMethods.error.loadFailed')
    }
  } catch (err) {
    console.error('Error loading payment methods:', err)
    error.value = t('management.paymentMethods.error.loadNetworkError')
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

      // Clear any previous errors
      lockError.value = null

      // Close the confirmation modal
      showLockConfirmModal.value = false
    } else {
      // Handle specific unlock permission error
      const errorMessage = response.message || `Failed to ${newLockState ? 'lock' : 'unlock'} payment methods`
      const lowerMessage = errorMessage.toLowerCase()

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
    error.value = t('management.paymentMethods.error.lockNetworkError')
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

// Delete initiated from the edit drawer header; parent owns the confirm modal
const handleDrawerDelete = () => {
  if (!editingPaymentMethod.value) return
  deletingPaymentMethod.value = editingPaymentMethod.value
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
      closeModals()
    } else {
      error.value = response.message || t('management.paymentMethods.error.deleteFailed')
    }
  } catch (err) {
    console.error('Error deleting payment method:', err)
    error.value = t('management.paymentMethods.error.deleteNetworkError')
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
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Collapse/expand via grid-template-rows 0fr↔1fr — tracks real content
   height so both directions ease evenly (no max-height dead time) */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none !important;
  }
}
</style>
