<template>
  <div class="space-y-6 md:space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          Event Template
        </h2>
        <p class="text-sm text-slate-600 mt-1">
          {{ headerDescription }}
        </p>
      </div>
      <div v-if="canEdit" class="flex items-center space-x-3">
        <button
          @click="openTemplateSelector"
          class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 flex items-center"
        >
          <Palette class="w-4 h-4 mr-2" />
          Browse Templates
        </button>
      </div>
    </div>

    <!-- Current Template Info - Show if template is enabled and has backend details -->
    <div
      v-if="event.event_template && isTemplateActivated && event.event_template_details"
      class="space-y-6"
    >
      <!-- Template Overview Card -->
      <div
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden"
      >
        <div class="relative">
          <!-- Preview Image -->
          <div
            v-if="event.event_template_details?.preview_image"
            class="relative h-64 overflow-hidden"
          >
            <img
              :src="event.event_template_details?.preview_image"
              :alt="event.event_template_details?.name"
              class="w-full h-full object-cover"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
            ></div>
            <div class="absolute bottom-4 left-6 right-6">
              <h3 class="text-2xl font-bold text-white mb-2">
                {{ event.event_template_details?.name || 'Selected Template' }}
              </h3>
              <div class="flex items-center space-x-4">
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white"
                >
                  <Package class="w-4 h-4 mr-1" />
                  {{ event.event_template_details?.package_plan.name || 'Template Plan' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-slate-900">
                  {{ event.event_template_details?.name || 'Template' }}
                </h3>
                <p class="text-sm text-slate-600">
                  {{ event.event_template_details?.package_plan.name || 'Plan' }}
                </p>
              </div>
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
              >
                <CheckCircle class="w-4 h-4 mr-1" />
                Active
              </span>
            </div>

            <!-- Features -->
            <div v-if="event.event_template_details?.package_plan.features" class="space-y-2">
              <h4 class="font-medium text-slate-900">Included Features:</h4>
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <li
                  v-for="feature in event.event_template_details.package_plan.features"
                  :key="feature"
                  class="flex items-center text-sm text-slate-600"
                >
                  <CheckCircle class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  {{ feature }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- YouTube Preview -->
        <div
          v-if="event.event_template_details?.youtube_preview_url"
          class="p-6 border-t border-slate-200"
        >
          <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
            <PlayCircle class="w-5 h-5 mr-2 text-red-600" />
            Video Preview
          </h4>
          <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div class="aspect-video">
              <iframe
                :src="event.event_template_details.youtube_preview_url"
                class="w-full h-full"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
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
        <div class="relative">
          <!-- Preview Image -->
          <div v-if="selectedTemplateDetails.preview_image" class="relative h-64 overflow-hidden">
            <img
              :src="selectedTemplateDetails.preview_image"
              :alt="selectedTemplateDetails.name"
              class="w-full h-full object-cover"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
            ></div>
            <div class="absolute bottom-4 left-6 right-6">
              <h3 class="text-2xl font-bold text-white mb-2">{{ selectedTemplateDetails.name }}</h3>
              <div class="flex items-center space-x-4">
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white"
                >
                  <Package class="w-4 h-4 mr-1" />
                  {{ selectedTemplateDetails.package_plan.name }}
                </span>
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white"
                >
                  <Eye class="w-4 h-4 mr-1" />
                  Preview
                </span>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-slate-900">
                  {{ selectedTemplateDetails.name }}
                </h3>
                <p class="text-sm text-slate-600">
                  {{ selectedTemplateDetails.package_plan.name }} • ${{
                    selectedTemplateDetails.package_plan.price
                  }}
                </p>
              </div>
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
              >
                <Eye class="w-4 h-4 mr-1" />
                Preview
              </span>
            </div>

            <!-- Features -->
            <div v-if="selectedTemplateDetails.package_plan.features" class="space-y-2">
              <h4 class="font-medium text-slate-900">Included Features:</h4>
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <li
                  v-for="feature in selectedTemplateDetails.package_plan.features"
                  :key="feature"
                  class="flex items-center text-sm text-slate-600"
                >
                  <CheckCircle class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  {{ feature }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- YouTube Preview -->
        <div
          v-if="selectedTemplateDetails.youtube_preview_url"
          class="p-6 border-t border-slate-200"
        >
          <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
            <PlayCircle class="w-5 h-5 mr-2 text-red-600" />
            Video Preview
          </h4>
          <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div class="aspect-video">
              <iframe
                :src="selectedTemplateDetails.youtube_preview_url"
                class="w-full h-full"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Template Selected State -->
    <div
      v-if="!event.event_template && !showTemplateSelector"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12 text-center"
    >
      <div
        class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <Palette class="w-10 h-10 text-slate-400" />
      </div>
      <h3 class="text-lg font-semibold text-slate-900 mb-2">No Template Selected</h3>
      <p class="text-slate-600 mb-6 max-w-md mx-auto">
        Choose a professional template to enhance your event's visual appeal and provide a better
        experience for your attendees.
      </p>
      <button
        v-if="canEdit"
        @click="openTemplateSelector"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 flex items-center mx-auto"
      >
        <Palette class="w-5 h-5 mr-2" />
        Browse Templates
      </button>
    </div>

    <!-- Template Selected But Not Enabled State -->
    <div
      v-if="event.event_template && !isTemplateActivated && !selectedTemplateDetails"
      class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-6"
    >
      <div class="flex items-start space-x-4">
        <div
          class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <Package class="w-6 h-6 text-blue-600" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-slate-900">Template Selected</h3>
          <p class="text-slate-600 mt-1">
            You have selected template ID {{ event.event_template }}. The template is ready to be
            activated.
          </p>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-8 right-8 z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
          <AlertCircle v-else class="w-5 h-5 mr-2" />
          {{ message.text }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue'
import { Palette, CheckCircle, AlertCircle, Package, Eye, PlayCircle } from 'lucide-vue-next'
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
    showMessage(
      'success',
      'Template selected successfully! You can now proceed with payment when ready.',
    )
  } catch (error) {
    console.error('Error handling template selection:', error)
    showMessage('error', 'Failed to process template selection. Please try again.')
  }
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
</script>

<style scoped>
/* Button Styles */
.btn-gradient {
  @apply bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
         text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 
         hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30;
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
