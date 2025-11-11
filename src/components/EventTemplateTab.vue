<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          Event Template
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">
          {{ headerDescription }}
        </p>
      </div>
      <button
        v-if="canEdit"
        @click="openTemplateSelector"
        class="hidden sm:flex bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center text-sm sm:text-base"
      >
        <Palette class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        <span class="hidden sm:inline">Browse Templates</span>
      </button>
    </div>

    <!-- Current Template Info - Show if template is enabled and has backend details -->
    <div
      v-if="event.event_template && isTemplateActivated && event.event_template_details"
      class="space-y-6"
    >
      <!-- Template Overview Card - Horizontal Layout -->
      <div
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden"
      >
        <div class="flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
          <!-- Left: Portrait Preview Image Card -->
          <div class="flex-shrink-0 w-full lg:w-80">
            <div
              v-if="event.event_template_details?.preview_image"
              class="relative bg-slate-100 rounded-2xl overflow-hidden shadow-lg"
              style="aspect-ratio: 9/16"
            >
              <img
                :src="event.event_template_details?.preview_image"
                :alt="event.event_template_details?.name"
                class="w-full h-full object-cover"
              />
              <div
                class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
              ></div>
              <div class="absolute bottom-3 left-3 right-3">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white"
                >
                  <Package class="w-3.5 h-3.5 mr-1.5" />
                  {{ event.event_template_details?.package_plan.name || 'Template Plan' }}
                </span>
              </div>
            </div>
            <div
              v-else
              class="bg-slate-100 rounded-2xl flex items-center justify-center"
              style="aspect-ratio: 9/16"
            >
              <Palette class="w-12 h-12 text-slate-400" />
            </div>
          </div>

          <!-- Right: Template Details -->
          <div class="flex-1 flex flex-col">
            <!-- Header -->
            <div class="mb-4">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h3 class="text-xl sm:text-2xl font-bold text-slate-900">
                    {{ event.event_template_details?.name || 'Template' }}
                  </h3>
                  <p class="text-sm sm:text-base text-slate-600 mt-1">
                    {{ event.event_template_details?.package_plan.name || 'Plan' }}
                  </p>
                </div>
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 flex-shrink-0"
                >
                  <CheckCircle class="w-4 h-4 mr-1.5" />
                  Active
                </span>
              </div>
            </div>

            <!-- Features -->
            <div v-if="event.event_template_details?.package_plan.features" class="flex-1">
              <h4 class="text-base font-semibold text-slate-900 mb-3">Included Features:</h4>
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                <li
                  v-for="feature in event.event_template_details.package_plan.features"
                  :key="feature"
                  class="flex items-start text-sm text-slate-600"
                >
                  <CheckCircle class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{{ feature }}</span>
                </li>
              </ul>

              <!-- Preview Button -->
              <div v-if="event.event_template_details?.youtube_preview_url" class="pt-4 border-t border-slate-200">
                <button
                  @click="openYoutubePreview(event.event_template_details.youtube_preview_url)"
                  class="w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center justify-center"
                >
                  <PlayCircle class="w-5 h-5 mr-2" />
                  Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Browse Template Modal -->
    <BrowseTemplateModal
      :is-open="showTemplateSelector"
      :event-id="event.id"
      :event-category="event.category || undefined"
      @close="closeTemplateSelector"
      @template-selected="handleTemplateSelected"
    />

    <!-- Selected Template Preview (when template is selected but not enabled) -->
    <div v-if="selectedTemplateDetails && !isTemplateActivated" class="space-y-6">
      <div
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden"
      >
        <div class="flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
          <!-- Left: Portrait Preview Image Card -->
          <div class="flex-shrink-0 w-full lg:w-80">
            <div
              v-if="selectedTemplateDetails.preview_image"
              class="relative bg-slate-100 rounded-2xl overflow-hidden shadow-lg"
              style="aspect-ratio: 9/16"
            >
              <img
                :src="selectedTemplateDetails.preview_image"
                :alt="selectedTemplateDetails.name"
                class="w-full h-full object-cover"
              />
              <div
                class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
              ></div>
              <div class="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white"
                >
                  <Package class="w-3.5 h-3.5 mr-1.5" />
                  {{ selectedTemplateDetails.package_plan.name }}
                </span>
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white"
                >
                  <Eye class="w-3.5 h-3.5 mr-1.5" />
                  Preview
                </span>
              </div>
            </div>
            <div
              v-else
              class="bg-slate-100 rounded-2xl flex items-center justify-center"
              style="aspect-ratio: 9/16"
            >
              <Palette class="w-12 h-12 text-slate-400" />
            </div>
          </div>

          <!-- Right: Template Details -->
          <div class="flex-1 flex flex-col">
            <!-- Header -->
            <div class="mb-4">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h3 class="text-xl sm:text-2xl font-bold text-slate-900">
                    {{ selectedTemplateDetails.name }}
                  </h3>
                  <p class="text-sm sm:text-base text-slate-600 mt-1">
                    {{ selectedTemplateDetails.package_plan.name }} • ${{
                      selectedTemplateDetails.package_plan.price
                    }}
                  </p>
                </div>
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 flex-shrink-0"
                >
                  <Eye class="w-4 h-4 mr-1.5" />
                  Preview
                </span>
              </div>
            </div>

            <!-- Features -->
            <div v-if="selectedTemplateDetails.package_plan.features" class="flex-1">
              <h4 class="text-base font-semibold text-slate-900 mb-3">Included Features:</h4>
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                <li
                  v-for="feature in selectedTemplateDetails.package_plan.features"
                  :key="feature"
                  class="flex items-start text-sm text-slate-600"
                >
                  <CheckCircle class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{{ feature }}</span>
                </li>
              </ul>

              <!-- Payment Action Buttons -->
              <div class="pt-4 border-t border-slate-200 space-y-3">
                <div class="flex gap-2">
                  <button
                    v-if="selectedTemplateDetails.youtube_preview_url"
                    @click="openYoutubePreview(selectedTemplateDetails.youtube_preview_url)"
                    class="flex-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center justify-center"
                  >
                    <PlayCircle class="w-5 h-5 mr-2" />
                    Preview
                  </button>
                  <button
                    @click="navigateToPayment"
                    class="flex-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center justify-center"
                  >
                    <CreditCard class="w-5 h-5 mr-2" />
                    Make Payment
                  </button>
                </div>
                <p class="text-xs text-slate-500 text-center">
                  Complete payment to activate this template
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Template Selected State -->
    <div
      v-if="!event.event_template && !showTemplateSelector"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <div
        class="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
      >
        <Palette class="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
      </div>
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">No Template Selected</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        Choose a professional template to enhance your event's visual appeal and provide a better
        experience for your attendees.
      </p>
      <button
        v-if="canEdit"
        @click="openTemplateSelector"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center mx-auto text-sm sm:text-base"
      >
        <Palette class="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
        Browse Templates
      </button>
    </div>

    <!-- Template Selected But Not Enabled State -->
    <div
      v-if="event.event_template && !isTemplateActivated && !selectedTemplateDetails"
      class="bg-gradient-to-r from-[#E6F4FF] to-indigo-50 border border-[#87CEEB] rounded-3xl p-4 sm:p-6"
    >
      <div class="flex items-start space-x-3 sm:space-x-4">
        <div
          class="w-10 h-10 sm:w-12 sm:h-12 bg-[#B0E0E6] rounded-full flex items-center justify-center flex-shrink-0"
        >
          <Package class="w-5 h-5 sm:w-6 sm:h-6 text-[#1e90ff]" />
        </div>
        <div class="flex-1">
          <h3 class="text-base sm:text-lg font-semibold text-slate-900">Template Selected</h3>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">
            You have selected template ID {{ event.event_template }}. The template is ready to be
            activated.
          </p>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 max-w-[calc(100vw-2rem)] sm:max-w-md">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-4 py-3 sm:px-6 sm:py-4 rounded-xl shadow-lg flex items-center text-sm sm:text-base"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <AlertCircle v-else class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <span class="break-words">{{ message.text }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue'
import { Palette, CheckCircle, AlertCircle, Package, Eye, PlayCircle, CreditCard } from 'lucide-vue-next'
import { type Event, type EventTemplate, eventTemplateService } from '../services/api'
import BrowseTemplateModal from './BrowseTemplateModal.vue'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import { useNotifications } from '../composables/useNotifications'
import { useTemplateLoader } from '../composables/useTemplateLoader'

// Types
type TemplateStatus = 'active' | 'preview' | 'selected'

interface Props {
  event: Event
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'template-updated': [template: EventTemplate]
  'tab-change': [tab: string, options?: { openPaymentModal?: boolean }]
}>()

// Composables
const {
  isTemplateActivated,
  refreshPayments,
  loadPayments: loadExistingPayments,
} = usePaymentTemplateIntegration(props.event)

const { success: showSuccess, error: showError } = useNotifications()

const { selectedTemplateDetails, loadTemplateDetails, clearTemplate, setTemplateDetails } =
  useTemplateLoader()

// Local state
const showTemplateSelector = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Computed properties
const headerDescription = computed((): string =>
  isTemplateActivated.value
    ? 'Manage your event template and styling'
    : 'Select a template for your event',
)

const shouldShowBrowseButton = computed((): boolean => !showTemplateSelector.value)

const activeTemplateData = computed((): EventTemplate | null => {
  if (!isTemplateActivated.value || !props.event.event_template_details) {
    return null
  }
  return props.event.event_template_details
})

const previewTemplateData = computed((): EventTemplate | null => {
  if (isTemplateActivated.value || !selectedTemplateDetails.value) {
    return null
  }
  return selectedTemplateDetails.value
})

const showEmptyState = computed(
  (): boolean => !props.event.event_template && !showTemplateSelector.value,
)

const showSelectedState = computed((): boolean =>
  Boolean(
    props.event.event_template && !isTemplateActivated.value && !selectedTemplateDetails.value,
  ),
)

// Type guard to ensure template ID is a string
const templateIdAsString = computed((): string => {
  const id = props.event.event_template
  return typeof id === 'string' ? id : String(id || '')
})

// Helper functions
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, (match) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    }
    return entities[match] || match
  })
}

const showMessage = (type: 'success' | 'error', text: string): void => {
  const sanitizedText = sanitizeInput(text)

  if (type === 'success') {
    showSuccess('Template Updated', sanitizedText)
  } else {
    showError('Template Error', sanitizedText)
  }

  // Local message for backward compatibility
  message.value = { type, text: sanitizedText }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Template management methods
const openTemplateSelector = (): void => {
  showTemplateSelector.value = true
}

const closeTemplateSelector = (): void => {
  showTemplateSelector.value = false
}

const handleTemplateSelected = async (template: EventTemplate): Promise<void> => {
  try {
    setTemplateDetails(template)
    emit('template-updated', template)
    await refreshPayments()
    // Note: Success notification already shown by BrowseTemplateModal
  } catch (error) {
    console.error('Error handling template selection:', error)
    showMessage('error', 'Failed to process template selection. Please try again.')
  }
}

const navigateToPayment = (): void => {
  // Emit with a flag to indicate we want to open the payment modal
  emit('tab-change', 'payment', { openPaymentModal: true })
}

const openYoutubePreview = (url: string): void => {
  if (!url) return

  // Extract video ID from embed URL or regular YouTube URL
  let videoUrl = url

  // If it's an embed URL, convert to regular watch URL
  if (url.includes('youtube.com/embed/')) {
    const videoId = url.split('embed/')[1]?.split('?')[0]
    if (videoId) {
      videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    }
  }

  window.open(videoUrl, '_blank', 'noopener,noreferrer')
}

const initializeTemplateData = async (): Promise<void> => {
  if (!props.event.event_template) {
    clearTemplate()
    return
  }

  try {
    await loadTemplateDetails({
      templateId: templateIdAsString.value,
      eventId: props.event.id,
      existingDetails: props.event.event_template_details,
    })
  } catch (error) {
    console.error('Error initializing template data:', error)
    showMessage('error', 'Failed to load template details. Please refresh the page.')
  }
}

// Watchers
watch(
  () => ({ templateId: props.event.event_template, eventId: props.event.id }),
  async (newData, oldData) => {
    if (newData.templateId !== oldData?.templateId || newData.eventId !== oldData?.eventId) {
      await initializeTemplateData()
    }
  },
  { immediate: true },
)

watch(
  () => props.event.event_template_details,
  (newDetails) => {
    if (newDetails && isTemplateActivated.value) {
      setTemplateDetails(newDetails)
    }
  },
  { immediate: true },
)

// Lifecycle
onMounted(async () => {
  await nextTick()

  // Initialize data concurrently
  await Promise.allSettled([initializeTemplateData(), loadExistingPayments()])
})

onUnmounted(() => {
  clearTemplate()
})

// Expose methods for parent component (Smart FAB)
defineExpose({
  openBrowseTemplates: () => {
    openTemplateSelector()
  }
})
</script>

<style scoped>
/* Button Styles */
.btn-gradient {
  @apply bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc]
         text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200
         hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30;
}

/* Transition Animations */
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
