<template>
  <div class="qr-scanner-container">
    <!-- Scanner View -->
    <div v-if="!scannedCode" class="space-y-4">
      <div class="text-center mb-4">
        <h3 class="text-lg font-semibold text-slate-900 mb-2">Scan QR Code</h3>
        <p class="text-sm text-slate-600">Position the QR code within the frame</p>
      </div>

      <!-- QR Scanner Element -->
      <div id="qr-reader" class="rounded-xl overflow-hidden border-2 border-slate-200"></div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4">
        <div class="flex items-center space-x-2">
          <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0" />
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>

      <!-- Cancel Button -->
      <button
        @click="stopScanning"
        class="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200"
      >
        Cancel
      </button>
    </div>

    <!-- Success View -->
    <div v-else class="text-center space-y-4">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle class="w-8 h-8 text-green-600" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-slate-900 mb-2">QR Code Scanned</h3>
        <p class="text-sm text-slate-600 font-mono bg-slate-100 px-4 py-2 rounded-lg inline-block">
          {{ scannedCode }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle, AlertCircle } from 'lucide-vue-next'

const emit = defineEmits<{
  scanSuccess: [code: string]
  scanError: [error: string]
  close: []
}>()

// Constants
const SCAN_CONFIG = {
  FPS: 10,
  QR_BOX_SIZE: { width: 250, height: 250 },
  ASPECT_RATIO: 1.0,
  STOP_DELAY: 300,
  CLEANUP_DELAY: 100
} as const

const ERROR_MESSAGES = {
  NOT_ALLOWED: 'Camera access denied. Please allow camera access and try again.',
  NOT_FOUND: 'No camera found on this device.',
  NOT_READABLE: 'Camera is already in use by another application.',
  DEFAULT: 'Failed to start camera'
} as const

// State
const scannedCode = ref<string>('')
const error = ref<string>('')
const html5QrCode = ref<Html5Qrcode | null>(null)
const isStopping = ref(false)

// Helpers
const getErrorMessage = (err: any): string => {
  switch (err.name) {
    case 'NotAllowedError':
      return ERROR_MESSAGES.NOT_ALLOWED
    case 'NotFoundError':
      return ERROR_MESSAGES.NOT_FOUND
    case 'NotReadableError':
      return ERROR_MESSAGES.NOT_READABLE
    default:
      return ERROR_MESSAGES.DEFAULT
  }
}

const handleScanSuccess = (decodedText: string) => {
  // Only process first scan
  if (scannedCode.value) return

  scannedCode.value = decodedText
  emit('scanSuccess', decodedText)

  // Stop scanning after success with delay to show success state
  setTimeout(() => {
    stopScanning()
  }, SCAN_CONFIG.STOP_DELAY)
}

// Methods
const startScanning = async () => {
  try {
    error.value = ''
    html5QrCode.value = new Html5Qrcode('qr-reader')

    await html5QrCode.value.start(
      { facingMode: 'environment' },
      {
        fps: SCAN_CONFIG.FPS,
        qrbox: SCAN_CONFIG.QR_BOX_SIZE,
        aspectRatio: SCAN_CONFIG.ASPECT_RATIO,
      },
      handleScanSuccess,
      () => {
        // Error callback fires frequently during normal scanning, so we ignore it
        // Critical errors are caught in the catch block below
      }
    )
  } catch (err: any) {
    console.error('Error starting QR scanner:', err)
    const errorMsg = getErrorMessage(err)
    error.value = errorMsg
    emit('scanError', errorMsg)
  }
}

const stopScanning = async () => {
  // Prevent multiple simultaneous stop attempts
  if (isStopping.value) return

  isStopping.value = true

  try {
    if (html5QrCode.value) {
      const currentState = html5QrCode.value.getState()
      const SCANNING_STATE = 2
      const PAUSED_STATE = 3

      // Only stop if actively scanning or paused
      if (currentState === SCANNING_STATE || currentState === PAUSED_STATE) {
        await html5QrCode.value.stop()
        // Small delay to ensure stop completes before clearing
        await new Promise(resolve => setTimeout(resolve, SCAN_CONFIG.CLEANUP_DELAY))
      }

      html5QrCode.value.clear()
      html5QrCode.value = null
    }
  } catch (err: any) {
    // Log errors except for expected state transition errors
    if (!err?.message?.includes('transition')) {
      console.error('Error stopping scanner:', err)
    }
  } finally {
    isStopping.value = false
    emit('close')
  }
}

// Lifecycle
onMounted(() => {
  startScanning()
})

onUnmounted(() => {
  stopScanning()
})
</script>

<style scoped>
#qr-reader {
  width: 100%;
  max-width: 100%;
}

/* Override html5-qrcode default styles */
:deep(#qr-reader__dashboard_section_csr) {
  display: none !important;
}

:deep(#qr-reader__camera_selection) {
  margin-top: 10px;
}

:deep(video) {
  border-radius: 12px;
}
</style>
