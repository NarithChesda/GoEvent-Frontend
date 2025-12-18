<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="handleClose"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="show"
        class="fixed bottom-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[580px] lg:w-[640px] md:max-w-[calc(100vw-32px)] max-h-[85vh] md:max-h-none bg-white rounded-t-3xl md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="handleClose"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-semibold text-white">Check-in Attendee</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <div class="p-4 space-y-5 pb-24">
            <!-- QR Scanner View -->
            <div v-if="showQRScanner" class="space-y-4">
              <QRCodeScanner
                @scan-success="handleQRScanSuccess"
                @scan-error="handleQRScanError"
                @close="showQRScanner = false"
              />
            </div>

            <!-- Manual Input View -->
            <div v-else class="space-y-5">
              <!-- Info Card -->
              <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-slate-600">
                <UserCheck class="w-4 h-4 inline-block mr-1.5 text-emerald-600" />
                Enter the attendee's confirmation code to check them in to the event.
              </div>

              <!-- Confirmation Code Input -->
              <div>
                <label for="confirmationCode" class="block text-sm font-medium text-slate-700 mb-2">
                  Confirmation Code <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    id="confirmationCode"
                    ref="codeInput"
                    v-model="localCode"
                    type="text"
                    placeholder="Enter confirmation code..."
                    :class="[
                      'w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200',
                      isMobile ? 'pr-12' : '',
                      'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-emerald-300'
                    ]"
                    :disabled="isChecking"
                    @keyup.enter="handleSubmit"
                  />
                  <!-- Camera Icon Button (Shows on mobile or narrow screens) -->
                  <button
                    v-if="isMobile"
                    type="button"
                    @click.prevent="showQRScanner = true"
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-emerald-600 transition-colors duration-200 rounded-lg hover:bg-slate-100 active:bg-slate-200"
                    :disabled="isChecking"
                    title="Scan QR Code"
                  >
                    <Camera class="w-5 h-5" />
                  </button>
                </div>
                <p class="text-xs text-slate-500 mt-2">
                  {{ isMobile ? 'Enter code or tap camera icon to scan QR' : 'Enter the attendee\'s confirmation code' }}
                </p>
              </div>

              <!-- QR Scan Button for Desktop -->
              <button
                v-if="!isMobile"
                type="button"
                @click="showQRScanner = true"
                class="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                <Camera class="w-4 h-4" />
                Scan QR Code
              </button>
            </div>
          </div>
        </div>

        <!-- Footer with Action Buttons -->
        <div v-if="!showQRScanner" class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              type="button"
              @click="handleSubmit"
              :disabled="!localCode.trim() || isChecking"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                v-if="isChecking"
                class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
              ></span>
              <UserCheck v-else class="w-4 h-4" />
              <span>{{ isChecking ? 'Checking in...' : 'Check In' }}</span>
            </button>

            <button
              type="button"
              @click="handleClose"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
              :disabled="isChecking"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { UserCheck, ArrowRight, Camera } from 'lucide-vue-next'
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

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for show changes to reset state and focus input
watch(() => props.show, (newVal) => {
  if (newVal) {
    localCode.value = ''
    showQRScanner.value = false
    // Lock body scroll when drawer opens
    const scrollbarWidth = getScrollbarWidth()
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    // Focus input after drawer opens
    nextTick(() => {
      codeInput.value?.focus()
    })
  } else {
    // Restore body scroll when drawer closes
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  }
})

// Methods
const handleClose = () => {
  localCode.value = ''
  showQRScanner.value = false
  emit('close')
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
  // Ensure body scroll is restored on unmount
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
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
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
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
