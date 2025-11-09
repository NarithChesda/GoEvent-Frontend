<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isVisible" class="fixed inset-0 z-50 overflow-y-auto" @click="handleBackdropClick">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            ref="modalRef"
            class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Plus class="w-4.5 h-4.5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Create New Event</h2>
                </div>
                <button
                  @click="$emit('close')"
                  class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div class="space-y-5">
                <!-- Basic Information -->
                <div class="space-y-3">
                  <h4 class="text-sm font-semibold text-slate-900 flex items-center">
                    <Calendar class="w-4 h-4 mr-2 text-sky-500" />
                    Basic Information
                  </h4>

                  <div class="space-y-3">
                    <!-- Title -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Event Title <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="form.title"
                        type="text"
                        required
                        placeholder="Enter event title"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 text-slate-800 transition-colors"
                      />
                    </div>

                    <!-- Category -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Event Category
                      </label>
                      <select
                        v-model="form.category"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 text-slate-800 transition-colors appearance-none pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2224%22 height%3D%2224%22 viewBox%3D%220 0 24 24%22 fill%3D%22none%22 stroke%3D%22%23475569%22 stroke-width%3D%222%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%3E%3Cpolyline points%3D%226 9 12 15 18 9%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_0.75rem_center] bg-no-repeat cursor-pointer"
                      >
                        <option value="">Select a category</option>
                        <option v-for="category in categories" :key="category.id" :value="category.id">
                          {{ category.name }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Description -->
                <div class="space-y-3">
                  <h4 class="text-sm font-semibold text-slate-900 flex items-center">
                    <FileText class="w-4 h-4 mr-2 text-sky-500" />
                    Description
                  </h4>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Full Description <span class="text-red-500">*</span>
                    </label>
                    <div
                      contenteditable="true"
                      ref="descriptionEditor"
                      @input="handleDescriptionInput"
                      @blur="handleDescriptionBlur"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 text-slate-800 transition-colors min-h-[140px] max-h-[320px] overflow-y-auto"
                      :data-placeholder="form.description ? '' : 'Detailed event description'"
                    ></div>
                  </div>
                </div>

                <!-- Schedule -->
                <div class="space-y-3">
                  <h4 class="text-sm font-semibold text-slate-900 flex items-center">
                    <Clock class="w-4 h-4 mr-2 text-sky-500" />
                    Schedule
                  </h4>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Start Date &amp; Time <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="form.start_date"
                        type="datetime-local"
                        required
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 text-slate-800 transition-colors"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        End Date &amp; Time <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="form.end_date"
                        type="datetime-local"
                        required
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 text-slate-800 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Loader v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
                  {{ isSubmitting ? 'Creating...' : 'Create Event' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { Plus, X, Loader, Calendar, FileText, Clock } from 'lucide-vue-next'
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
const modalRef = ref<HTMLElement>()
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

// Watch for modal visibility to handle focus
watch(
  () => props.isVisible,
  (isVisible) => {
    if (isVisible) {
      // Reset form when modal opens
      resetForm()

      // Focus management
      setTimeout(() => {
        const firstInput = modalRef.value?.querySelector('input, textarea, select') as HTMLElement
        firstInput?.focus()
      }, 100)
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
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
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
