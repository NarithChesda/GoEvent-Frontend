<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]"
        :class="{ 'md:items-center items-end': showQRScanner }"
        @click="handleBackdropClick"
      >
        <div
          class="bg-white/95 backdrop-blur-sm border border-white/20 shadow-2xl w-full overflow-hidden relative"
          :class="showQRScanner ? 'h-full md:h-auto md:max-w-lg md:mx-4 md:rounded-3xl' : 'rounded-3xl max-w-lg mx-4'"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  <UserCheck class="w-4.5 h-4.5" />
                </div>
                <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Check-in Attendee</h2>
              </div>
              <button
                @click="handleClose"
                class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6">
            <!-- QR Scanner View (Mobile Only) -->
            <div v-if="showQRScanner" class="space-y-4">
              <QRCodeScanner
                @scan-success="handleQRScanSuccess"
                @scan-error="handleQRScanError"
                @close="showQRScanner = false"
              />
            </div>

            <!-- Manual Input View -->
            <div v-else class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2"
                  >Confirmation Code <span class="text-red-500">*</span></label
                >
                <div class="relative">
                  <input
                    ref="codeInput"
                    v-model="localCode"
                    type="text"
                    placeholder="Enter confirmation code..."
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                    :class="isMobile ? 'pr-12' : ''"
                    :disabled="isChecking"
                    @keyup.enter="handleSubmit"
                  />
                  <!-- Camera Icon Button (Shows on mobile or narrow screens) -->
                  <button
                    v-if="isMobile"
                    type="button"
                    @click.prevent="showQRScanner = true"
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-sky-600 transition-colors duration-200 rounded-lg hover:bg-slate-100 active:bg-slate-200"
                    :disabled="isChecking"
                    title="Scan QR Code"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      ></path>
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                    </svg>
                  </button>
                </div>
                <p class="text-xs text-slate-500 mt-2">
                  {{ isMobile ? 'Enter code or tap camera icon to scan QR' : 'Enter the attendee\'s confirmation code' }}
                </p>
              </div>

              <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  @click="handleClose"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  :disabled="isChecking"
                >
                  Cancel
                </button>
                <button
                  @click="handleSubmit"
                  class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  :disabled="!localCode.trim() || isChecking"
                >
                  <span
                    v-if="isChecking"
                    class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  <UserCheck v-else class="w-4 h-4 mr-2" />
                  {{ isChecking ? 'Checking in...' : 'Check In' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { UserCheck, X } from 'lucide-vue-next'
import QRCodeScanner from '../QRCodeScanner.vue'

// Props
const props = defineProps<{
  show: boolean
  isChecking?: boolean
}>()

// Emits
const emit = defineEmits<{
  'close': []
  'check-in': [code: string]
  'qr-scan-error': [error: string]
}>()

// Local state
const localCode = ref('')
const showQRScanner = ref(false)
const codeInput = ref<HTMLInputElement | null>(null)

// Mobile detection
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  ) || windowWidth.value < 768
})

// Update window width on resize
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// Watch for show changes to reset state and focus input
watch(() => props.show, (newVal) => {
  if (newVal) {
    localCode.value = ''
    showQRScanner.value = false
    // Focus input after modal opens
    nextTick(() => {
      codeInput.value?.focus()
    })
  }
})

// Methods
const handleClose = () => {
  localCode.value = ''
  showQRScanner.value = false
  emit('close')
}

const handleBackdropClick = () => {
  handleClose()
}

const handleSubmit = () => {
  if (localCode.value.trim() && !props.isChecking) {
    emit('check-in', localCode.value.trim())
  }
}

const handleQRScanSuccess = (code: string) => {
  localCode.value = code
  showQRScanner.value = false
  // Automatically submit after QR scan
  handleSubmit()
}

const handleQRScanError = (error: string) => {
  emit('qr-scan-error', error)
  showQRScanner.value = false
}

// Lifecycle
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})

// Expose method to set code externally (e.g., after successful scan)
defineExpose({
  setCode: (code: string) => {
    localCode.value = code
  },
  clearCode: () => {
    localCode.value = ''
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
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: all 0.3s ease;
  transform-origin: center;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}
</style>
