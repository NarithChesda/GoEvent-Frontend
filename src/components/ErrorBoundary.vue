<template>
  <div v-if="hasError" class="error-boundary" :style="errorBoundaryStyle">
    <div class="error-boundary__content">
      <!-- Error Icon -->
      <div class="error-boundary__icon">
        <AlertCircle :size="48" />
      </div>

      <!-- Error Title -->
      <h2 class="error-boundary__title">
        {{ title || 'Something went wrong' }}
      </h2>

      <!-- Error Message -->
      <p v-if="showDetails && error" class="error-boundary__message">
        {{ error.message }}
      </p>

      <!-- Error Details (Development Mode) -->
      <details v-if="isDevelopment && error" class="error-boundary__details">
        <summary class="error-boundary__details-summary">Technical Details</summary>
        <pre class="error-boundary__stack">{{ error.stack }}</pre>
        <div v-if="errorInfo?.componentStack" class="error-boundary__component-stack">
          <h4>Component Stack:</h4>
          <pre>{{ errorInfo.componentStack }}</pre>
        </div>
      </details>

      <!-- Action Buttons -->
      <div class="error-boundary__actions">
        <button
          v-if="showRetry"
          @click="handleRetry"
          class="error-boundary__button error-boundary__button--primary"
          :disabled="isRetrying"
        >
          <RotateCcw v-if="!isRetrying" :size="16" />
          <div v-else class="error-boundary__spinner"></div>
          {{ isRetrying ? 'Retrying...' : 'Try Again' }}
        </button>

        <button
          v-if="showReload"
          @click="handleReload"
          class="error-boundary__button error-boundary__button--secondary"
        >
          <RefreshCw :size="16" />
          Reload Page
        </button>

        <button
          v-if="showReport"
          @click="handleReport"
          class="error-boundary__button error-boundary__button--outline"
        >
          <Bug :size="16" />
          Report Issue
        </button>
      </div>

      <!-- Fallback Content Slot -->
      <div v-if="$slots.fallback" class="error-boundary__fallback">
        <slot name="fallback" :error="error" :retry="handleRetry" />
      </div>
    </div>
  </div>

  <!-- Normal Content -->
  <div v-else>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, provide, inject, computed, nextTick } from 'vue'
import { AlertCircle, RotateCcw, RefreshCw, Bug } from 'lucide-vue-next'
import type { ErrorBoundaryState, ErrorInfo } from '../types/showcase'

interface Props {
  title?: string
  showDetails?: boolean
  showRetry?: boolean
  showReload?: boolean
  showReport?: boolean
  maxRetries?: number
  resetOnPropsChange?: boolean
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onRetry?: () => Promise<void> | void
  onReport?: (error: Error) => void
  customStyle?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
  showRetry: true,
  showReload: true,
  showReport: false,
  maxRetries: 3,
  resetOnPropsChange: true,
})

const emit = defineEmits<{
  error: [error: Error, errorInfo: ErrorInfo]
  retry: []
  report: [error: Error]
}>()

// State
const hasError = ref(false)
const error = ref<Error | null>(null)
const errorInfo = ref<ErrorInfo | null>(null)
const retryCount = ref(0)
const isRetrying = ref(false)

// Environment detection
const isDevelopment = computed(() => import.meta.env.DEV)

// Styling
const errorBoundaryStyle = computed(() => ({
  '--primary-color': '#dc2626',
  '--secondary-color': '#f87171',
  '--background-color': '#fef2f2',
  '--text-color': '#374151',
  '--border-color': '#fecaca',
  ...props.customStyle,
}))

// Error capture
onErrorCaptured((err: Error, instance, info: string) => {
  console.error('ErrorBoundary caught error:', err)
  console.error('Component instance:', instance)
  console.error('Error info:', info)

  const errorInfoObj: ErrorInfo = {
    componentStack: info,
    errorBoundary: 'ErrorBoundary',
  }

  hasError.value = true
  error.value = err
  errorInfo.value = errorInfoObj

  // Call error callback
  if (props.onError) {
    props.onError(err, errorInfoObj)
  }

  // Emit error event
  emit('error', err, errorInfoObj)

  // Log error for monitoring
  logError(err, errorInfoObj)

  // Prevent the error from propagating
  return false
})

// Provide error boundary context to child components
provide('errorBoundary', {
  reportError: (err: Error) => {
    if (!hasError.value) {
      const errorInfoObj: ErrorInfo = {
        componentStack: 'Manually reported error',
        errorBoundary: 'ErrorBoundary',
      }

      hasError.value = true
      error.value = err
      errorInfo.value = errorInfoObj

      emit('error', err, errorInfoObj)
      logError(err, errorInfoObj)
    }
  },
})

// Methods
const handleRetry = async () => {
  if (retryCount.value >= props.maxRetries) {
    console.warn(`Max retry attempts (${props.maxRetries}) reached`)
    return
  }

  isRetrying.value = true
  retryCount.value++

  try {
    // Call custom retry handler if provided
    if (props.onRetry) {
      await props.onRetry()
    }

    // Wait a moment for any async operations
    await nextTick()

    // Reset error state
    hasError.value = false
    error.value = null
    errorInfo.value = null

    emit('retry')

    console.log(`ErrorBoundary retry successful (attempt ${retryCount.value})`)
  } catch (retryError) {
    console.error('ErrorBoundary retry failed:', retryError)

    // If retry fails, show the retry error instead
    error.value = retryError as Error
    errorInfo.value = {
      componentStack: 'Error occurred during retry',
      errorBoundary: 'ErrorBoundary',
    }
  } finally {
    isRetrying.value = false
  }
}

const handleReload = () => {
  console.log('ErrorBoundary: Reloading page')
  window.location.reload()
}

const handleReport = () => {
  if (error.value) {
    if (props.onReport) {
      props.onReport(error.value)
    }
    emit('report', error.value)
    console.log('ErrorBoundary: Error reported', error.value)
  }
}

const logError = (err: Error, info: ErrorInfo) => {
  // Enhanced error logging
  const errorLog = {
    message: err.message,
    stack: err.stack,
    componentStack: info.componentStack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    retryCount: retryCount.value,
  }

  // Send to error tracking service in production
  if (!isDevelopment.value) {
    // Replace with your error tracking service
    console.error('Production Error:', errorLog)

    // Example: Send to external service
    // errorTrackingService.captureError(errorLog)
  }
}

// Reset error state when needed
const reset = () => {
  hasError.value = false
  error.value = null
  errorInfo.value = null
  retryCount.value = 0
  isRetrying.value = false
}

// Expose methods to parent
defineExpose({
  reset,
  hasError: () => hasError.value,
  getError: () => error.value,
  getRetryCount: () => retryCount.value,
})
</script>

<style scoped>
.error-boundary {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  color: var(--text-color);
}

.error-boundary__content {
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.error-boundary__icon {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.error-boundary__title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.error-boundary__message {
  font-size: 1rem;
  margin-bottom: 1.5rem;
  color: var(--text-color);
  opacity: 0.8;
}

.error-boundary__details {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.error-boundary__details-summary {
  padding: 1rem;
  cursor: pointer;
  font-weight: 500;
  color: var(--primary-color);
}

.error-boundary__details-summary:hover {
  background: rgba(0, 0, 0, 0.02);
}

.error-boundary__stack,
.error-boundary__component-stack pre {
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 1rem;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
}

.error-boundary__component-stack {
  border-top: 1px solid var(--border-color);
  padding: 1rem;
}

.error-boundary__component-stack h4 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-color);
  font-size: 0.875rem;
}

.error-boundary__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-boundary__button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
}

.error-boundary__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-boundary__button--primary {
  background-color: var(--primary-color);
  color: white;
}

.error-boundary__button--primary:hover:not(:disabled) {
  background-color: var(--secondary-color);
  transform: translateY(-1px);
}

.error-boundary__button--secondary {
  background-color: var(--text-color);
  color: white;
}

.error-boundary__button--secondary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.error-boundary__button--outline {
  background-color: transparent;
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.error-boundary__button--outline:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-1px);
}

.error-boundary__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-boundary__fallback {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Mobile responsive */
@media (max-width: 640px) {
  .error-boundary {
    padding: 1rem;
    min-height: 300px;
  }

  .error-boundary__title {
    font-size: 1.25rem;
  }

  .error-boundary__actions {
    flex-direction: column;
    align-items: center;
  }

  .error-boundary__button {
    width: 100%;
    max-width: 200px;
    justify-content: center;
  }
}
</style>
