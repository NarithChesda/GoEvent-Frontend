<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="isVisible"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="handleBackdropClick"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="isVisible"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[580px] lg:w-[640px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="$emit('close')"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <h2 class="text-base font-semibold text-white">Create New Event</h2>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <form @submit.prevent="handleSubmit" class="p-4 space-y-5 pb-24">
            <div class="space-y-5">
              <!-- Basic Information -->
              <div class="space-y-3">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Basic Information</h3>

                <!-- Title and Category Row -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Title -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Event Title *</label>
                    <input
                      v-model="form.title"
                      type="text"
                      required
                      placeholder="Enter event title"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    />
                  </div>

                  <!-- Category -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <div class="relative">
                      <select
                        v-model="form.category"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white appearance-none pr-10"
                      >
                        <option value="">Select a category</option>
                        <option v-for="category in categories" :key="category.id" :value="category.id">
                          {{ category.name }}
                        </option>
                      </select>
                      <ChevronDown class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Full Description *</label>
                  <div
                    contenteditable="true"
                    ref="descriptionEditor"
                    @input="handleDescriptionInput"
                    @blur="handleDescriptionBlur"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white text-slate-800 min-h-[140px] max-h-[320px] overflow-y-auto"
                    :data-placeholder="form.description ? '' : 'Detailed event description'"
                  ></div>
                </div>
              </div>

              <!-- Date and Time -->
              <div class="space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Start Date & Time *</label>
                    <input
                      v-model="form.start_date"
                      type="datetime-local"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">End Date & Time *</label>
                    <input
                      v-model="form.end_date"
                      type="datetime-local"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              @click="handleSubmit"
              :disabled="isSubmitting"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{ isSubmitting ? 'Creating...' : 'Create Event' }}</span>
            </button>

            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
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
import { ref, reactive, watch, onMounted } from 'vue'
import { ArrowRight, Loader, ChevronDown, Save } from 'lucide-vue-next'
import { getTimezonesByRegion, findTimezoneOption, getUserTimezone } from '../utils/timezones'
import { eventCategoriesService, type EventCategory } from '../services/api'
import eventDescriptionTemplates from '../assets/event-description-templates.json'
import { sanitizeRichContent } from '@/utils/sanitize'

// Types
interface EventFormData {
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  privacy: 'public' | 'private'
  timezone: string
  category?: number | string | null
  // Additional fields that will be added during submission
  short_description?: string
  is_virtual?: boolean
  virtual_link?: string
  max_attendees?: number | null
  registration_required?: boolean
  registration_deadline?: string | null
  banner_image?: string | null
  status?: string
}

interface Props {
  isVisible: boolean
}

interface Emits {
  close: []
  submit: [formData: EventFormData]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Refs
const descriptionEditor = ref<HTMLElement>()
const isSubmitting = ref(false)
const categories = ref<EventCategory[]>([])

// Form data
const form = reactive<EventFormData>({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  location: '',
  privacy: 'private',
  timezone: getUserTimezone(),
  category: '',
})

// Timezone data
const timezonesByRegion = getTimezonesByRegion()

// Methods
const loadCategories = async () => {
  try {
    const response = await eventCategoriesService.getCategories()
    if (response.success && response.data) {
      categories.value = response.data.results || []
    }
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

// Handle description input from contenteditable div
const handleDescriptionInput = (event: Event) => {
  const target = event.target as HTMLElement
  // Sanitize innerHTML to prevent XSS attacks
  form.description = sanitizeRichContent(target.innerHTML, 10000)
}

// Handle description blur to ensure content is saved
const handleDescriptionBlur = (event: Event) => {
  const target = event.target as HTMLElement
  // Sanitize innerHTML to prevent XSS attacks
  form.description = sanitizeRichContent(target.innerHTML, 10000)
}

// Update the description editor content when form.description changes
const updateDescriptionEditor = () => {
  if (descriptionEditor.value) {
    descriptionEditor.value.innerHTML = form.description
  }
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

const resetForm = () => {
  Object.assign(form, {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    privacy: 'private',
    timezone: getUserTimezone(),
    category: '',
  })
  // Reset default dates
  setDefaultDates()
}

const handleSubmit = async () => {
  isSubmitting.value = true

  try {
    // Validate end date is after start date
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      alert('End date must be after start date')
      return
    }

    // Create form data copy for submission
    const formData = { ...form }

    // Convert datetime-local format to ISO format for API
    const startDate = new Date(formData.start_date).toISOString()
    const endDate = new Date(formData.end_date).toISOString()

    // Handle category - convert string to number or set to null
    let categoryValue: number | null = null
    if (formData.category && formData.category !== '') {
      categoryValue = typeof formData.category === 'string'
        ? parseInt(formData.category, 10)
        : formData.category
    }

    // Create event data with proper formatting
    const eventData = {
      ...formData,
      start_date: startDate,
      end_date: endDate,
      // Set defaults for required fields
      short_description:
        formData.description.substring(0, 150) + (formData.description.length > 150 ? '...' : ''),
      is_virtual: false,
      virtual_link: '', // API expects empty string, not null
      max_attendees: null,
      registration_required: false,
      registration_deadline: null,
      category: categoryValue,
      banner_image: null,
      timezone: formData.timezone || getUserTimezone(),
      status: 'published',
    }

    emit('submit', eventData)
    resetForm()
    emit('close')
  } catch (error) {
    console.error('Error creating event:', error)
    alert('Failed to create event. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for drawer visibility
watch(
  () => props.isVisible,
  (isVisible) => {
    if (isVisible) {
      // Reset form when drawer opens
      resetForm()
    }
    // Prevent body scroll when drawer is open
    if (isVisible) {
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  },
)

// Watch for category changes to auto-fill description
watch(
  () => form.category,
  (newCategory, oldCategory) => {
    // Only proceed if category actually changed
    if (newCategory === oldCategory) return

    // Clear description when switching categories
    if (oldCategory !== undefined && oldCategory !== '') {
      form.description = ''
      updateDescriptionEditor()
    }

    // Auto-fill description if category has a template
    if (newCategory && newCategory !== '') {
      const selectedCategory = categories.value.find(
        cat => cat.id === (typeof newCategory === 'string' ? parseInt(newCategory) : newCategory)
      )

      if (selectedCategory) {
        const categoryName = selectedCategory.name.toLowerCase()
        const templates = eventDescriptionTemplates.templates as Record<string, { description: string }>

        // Check if there's a template for this category
        if (templates[categoryName]) {
          form.description = templates[categoryName].description
          updateDescriptionEditor()
        }
      }
    }
  }
)

// Set default start date to now + 1 hour
const setDefaultDates = () => {
  const now = new Date()
  const startDate = new Date(now.getTime() + 60 * 60 * 1000) // +1 hour
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // +2 hours from start

  form.start_date = startDate.toISOString().slice(0, 16)
  form.end_date = endDate.toISOString().slice(0, 16)
}

// Computed properties
const getSelectedTimezoneLabel = () => {
  const option = findTimezoneOption(form.timezone)
  return option ? option.label : form.timezone
}

// Load categories when component mounts
onMounted(() => {
  loadCategories()
  setDefaultDates()
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

/* Custom scrollbar for modal content */
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

/* Rich text editor styling */
[contenteditable="true"] {
  outline: none;
  white-space: pre-wrap;
  word-wrap: break-word;
}

[contenteditable="true"]:empty:before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
}

/* Rich text content styling */
[contenteditable="true"] :deep(h3) {
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

[contenteditable="true"] :deep(p) {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

[contenteditable="true"] :deep(ul) {
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
  list-style-type: disc;
}

[contenteditable="true"] :deep(li) {
  margin-bottom: 0.25rem;
  line-height: 1.5;
}

[contenteditable="true"] :deep(strong) {
  font-weight: 600;
  color: #1e293b;
}

[contenteditable="true"] :deep(em) {
  font-style: italic;
  color: #64748b;
}
</style>
