<template>
  <div class="space-y-6 md:space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Template</h2>
        <p class="text-sm text-slate-600 mt-1">
          {{ isTemplateActivated ? 'Manage your event template and styling' : 'Select a template for your event' }}
        </p>
      </div>
      <div v-if="canEdit" class="flex items-center space-x-3">
        <button
          v-if="!showTemplateSelector && !isTemplateActivated"
          @click="openTemplateSelector"
          class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 flex items-center"
        >
          <Palette class="w-4 h-4 mr-2" />
          <span class="hidden sm:inline">Browse Templates</span>
          <span class="sm:hidden">Browse</span>
        </button>
        <button
          v-if="isTemplateActivated"
          @click="openTemplateSelector"
          class="bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl p-2 hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] shadow-lg"
          title="Change Template"
        >
          <Shuffle class="w-4 h-4 text-slate-600" />
        </button>
      </div>
    </div>

    <!-- Current Template Info - Show if template is enabled and has backend details -->
    <div v-if="event.event_template && isTemplateActivated && event.event_template_details" class="space-y-6">
      <!-- Template Overview Card -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
        <div class="relative">
          <!-- Preview Image -->
          <div v-if="event.event_template_details?.preview_image" class="relative h-64 overflow-hidden">
            <img 
              :src="event.event_template_details?.preview_image" 
              :alt="event.event_template_details?.name"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            <div class="absolute bottom-4 left-6 right-6">
              <h3 class="text-2xl font-bold text-white mb-2">{{ event.event_template_details?.name || 'Selected Template' }}</h3>
              <div class="flex items-center space-x-4">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
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
                <h3 class="text-lg font-semibold text-slate-900">{{ event.event_template_details?.name || 'Template' }}</h3>
                <p class="text-sm text-slate-600">{{ event.event_template_details?.package_plan.name || 'Plan' }}</p>
              </div>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
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
        <div v-if="event.event_template_details?.youtube_preview_url" class="p-6 border-t border-slate-200">
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
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden">
        <div class="relative">
          <!-- Preview Image -->
          <div v-if="selectedTemplateDetails.preview_image" class="relative h-64 overflow-hidden">
            <img 
              :src="selectedTemplateDetails.preview_image" 
              :alt="selectedTemplateDetails.name"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            <div class="absolute bottom-4 left-6 right-6">
              <h3 class="text-2xl font-bold text-white mb-2">{{ selectedTemplateDetails.name }}</h3>
              <div class="flex items-center space-x-4">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
                  <Package class="w-4 h-4 mr-1" />
                  {{ selectedTemplateDetails.package_plan.name }}
                </span>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white">
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
                <h3 class="text-lg font-semibold text-slate-900">{{ selectedTemplateDetails.name }}</h3>
                <p class="text-sm text-slate-600">{{ selectedTemplateDetails.package_plan.name }} • ${{ selectedTemplateDetails.package_plan.price }}</p>
              </div>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
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
        <div v-if="selectedTemplateDetails.youtube_preview_url" class="p-6 border-t border-slate-200">
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
    <div v-if="!event.event_template && !showTemplateSelector" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12 text-center">
      <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Palette class="w-10 h-10 text-slate-400" />
      </div>
      <h3 class="text-lg font-semibold text-slate-900 mb-2">No Template Selected</h3>
      <p class="text-slate-600 mb-6 max-w-md mx-auto">
        Choose a professional template to enhance your event's visual appeal and provide a better experience for your attendees.
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
    <div v-if="event.event_template && !isTemplateActivated && !selectedTemplateDetails" class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-6">
      <div class="flex items-start space-x-4">
        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Package class="w-6 h-6 text-blue-600" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-slate-900">Template Selected</h3>
          <p class="text-slate-600 mt-1">
            You have selected template ID {{ event.event_template }}. The template is ready to be activated.
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
import {
  Palette,
  Package,
  CheckCircle,
  Shuffle,
  Eye,
  AlertCircle,
  PlayCircle
} from 'lucide-vue-next'
import { 
  type Event, 
  type EventTemplate, 
  eventTemplateService,
  apiService
} from '../services/api'
import BrowseTemplateModal from './BrowseTemplateModal.vue'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import { useNotifications } from '../composables/useNotifications'

interface Payment {
  readonly id: string
  readonly payment_reference: string
  readonly user_email: string
  readonly event: string
  readonly event_title: string
  readonly template_name: string | null
  readonly plan_name: string
  readonly payment_method_name: string
  readonly amount: string
  readonly original_price: string
  readonly discount_amount: string
  readonly currency: string
  readonly status: 'pending' | 'confirmed' | 'failed' | 'cancelled' | 'refunded'
  readonly status_display: string
  readonly transaction_reference: string
  readonly created_at: string
  readonly is_confirmed: boolean
  readonly is_upgrade: boolean
  readonly payment_proof?: string
  readonly user_notes?: string
  readonly updated_at?: string
}

interface Props {
  event: Event
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'template-updated': [template: EventTemplate]
}>()

// API service is imported as singleton

// Use composables
const {
  payments: existingPayments,
  loadingPayments,
  isTemplateActivated,
  currentTemplateName,
  refreshPayments,
  loadPayments: loadExistingPayments
} = usePaymentTemplateIntegration(props.event)

const { success: showSuccess, error: showError } = useNotifications()

// Local component state
const showTemplateSelector = ref(false)
const selectedTemplateDetails = ref<EventTemplate | null>(null)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// AbortController for request cancellation
let abortController: AbortController | null = null

// Input sanitization helper
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>"'&]/g, (match) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    }
    return entities[match] || match
  })
}

// Template selection methods
const openTemplateSelector = () => {
  showTemplateSelector.value = true
}

const closeTemplateSelector = () => {
  showTemplateSelector.value = false
}

const handleTemplateSelected = async (template: EventTemplate): Promise<void> => {
  selectedTemplateDetails.value = template
  
  // Emit the template update to parent component
  emit('template-updated', template)
  
  // Refresh payment data to check activation status
  await refreshPayments()
  
  showMessage('success', 'Template selected successfully! You can now proceed with payment when ready.')
}

const loadSelectedTemplateDetails = async (): Promise<void> => {
  if (!props.event.event_template) {
    selectedTemplateDetails.value = null
    return
  }
  
  // Cancel previous request if still pending
  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()
  
  try {
    // Option 1: Use event_template_details if available (most efficient)
    if (props.event.event_template_details) {
      selectedTemplateDetails.value = props.event.event_template_details
      return
    }
    
    // Option 2: Use dedicated template-info API
    if (props.event.event_template) {
      const response = await eventTemplateService.getEventTemplateInfo(props.event.id)
      if (response.success && response.data) {
        selectedTemplateDetails.value = response.data
        return
      }
    }
    
    // Option 3: Fallback to browse templates
    const browseResponse = await eventTemplateService.browseTemplates()
    if (browseResponse.success && browseResponse.data) {
      const foundTemplate = browseResponse.data.templates.find((t: EventTemplate) => t.id === props.event.event_template)
      selectedTemplateDetails.value = foundTemplate || null
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Error loading template details:', error)
      selectedTemplateDetails.value = null
    }
  } finally {
    abortController = null
  }
}

// Load template details with better error handling
const loadTemplateDetailsWithRetry = async (retries = 2): Promise<void> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await loadSelectedTemplateDetails()
      return // Success, exit retry loop
    } catch (error) {
      console.warn(`Template details load attempt ${attempt + 1} failed:`, error)
      if (attempt === retries) {
        console.error('All template details load attempts failed')
        showError('Template Load Failed', 'Failed to load template details. Please refresh the page.')
        showMessage('error', 'Failed to load template details. Please refresh the page.')
      } else {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }
}


const showMessage = (type: 'success' | 'error', text: string): void => {
  // Use the new notification system
  const sanitizedText = sanitizeInput(text)
  
  if (type === 'success') {
    showSuccess('Template Updated', sanitizedText)
  } else {
    showError('Template Error', sanitizedText)
  }
  
  // Also update the local message for backward compatibility
  message.value = { type, text: sanitizedText }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Watchers to handle prop changes and state synchronization
// Enhanced watchers with better error handling
watch(
  () => props.event.event_template,
  async (newTemplateId, oldTemplateId) => {
    if (newTemplateId !== oldTemplateId) {
      await loadTemplateDetailsWithRetry()
      // Payment loading is handled automatically by the composable
    }
  },
  { immediate: true }
)

watch(
  () => props.event.event_template_details,
  (newDetails, oldDetails) => {
    if (newDetails && newDetails !== oldDetails) {
      selectedTemplateDetails.value = newDetails
    }
  },
  { immediate: true }
)

// Watch for event changes
watch(
  () => props.event.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await loadTemplateDetailsWithRetry()
      // Payment loading is handled automatically by the composable
    }
  }
)

// Cleanup function
onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})

// Lifecycle with improved initialization
onMounted(async () => {
  await nextTick() // Ensure DOM is ready
  
  // Load template details and payments concurrently
  await Promise.allSettled([
    loadTemplateDetailsWithRetry(),
    loadExistingPayments()
  ])
})
</script>

<style scoped>
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