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

                <!-- Auto Populate (shown when category is selected) -->
                <Transition name="slide-fade">
                  <div
                    v-if="form.category && form.category !== ''"
                    @click="form.auto_populate = !form.auto_populate"
                    class="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div class="flex items-center gap-3">
                      <div class="p-2 bg-white rounded-lg shadow-sm">
                        <Sparkles class="w-4 h-4 text-sky-500" />
                      </div>
                      <div>
                        <p class="text-sm font-medium text-slate-700">Auto-populate event data</p>
                        <p class="text-xs text-slate-500">Fill in hosts, agenda & texts from category template</p>
                      </div>
                    </div>
                    <div
                      role="switch"
                      :aria-checked="form.auto_populate"
                      :class="[
                        'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                        form.auto_populate ? 'bg-sky-500' : 'bg-slate-200'
                      ]"
                    >
                      <span
                        class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                        :style="{ transform: form.auto_populate ? 'translateX(20px)' : 'translateX(0)' }"
                      />
                    </div>
                  </div>
                </Transition>

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

              <!-- Privacy Settings -->
              <div class="space-y-3">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Privacy</h3>

                <div
                  @click="form.privacy = form.privacy === 'public' ? 'private' : 'public'"
                  class="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-white rounded-lg shadow-sm">
                      <component :is="form.privacy === 'public' ? Globe : Lock" class="w-4 h-4 text-sky-500" />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-slate-700">{{ form.privacy === 'public' ? 'Public Event' : 'Private Event' }}</p>
                      <p class="text-xs text-slate-500">{{ form.privacy === 'public' ? 'Anyone can view and register' : 'Only invited guests can access' }}</p>
                    </div>
                  </div>
                  <div
                    role="switch"
                    :aria-checked="form.privacy === 'public'"
                    :class="[
                      'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                      form.privacy === 'public' ? 'bg-sky-500' : 'bg-slate-200'
                    ]"
                  >
                    <span
                      class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                      :style="{ transform: form.privacy === 'public' ? 'translateX(20px)' : 'translateX(0)' }"
                    />
                  </div>
                </div>

                <!-- Full Description (public events only) -->
                <Transition name="slide-fade">
                  <div v-if="form.privacy === 'public'">
                    <label class="block text-sm font-medium text-slate-700 mb-2">About Event</label>
                    <div
                      contenteditable="true"
                      ref="descriptionEditor"
                      @input="handleDescriptionInput"
                      @blur="handleDescriptionBlur"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white text-slate-800 min-h-[140px] max-h-[320px] overflow-y-auto"
                      :data-placeholder="form.description ? '' : 'Detailed event description'"
                    ></div>
                  </div>
                </Transition>
              </div>

              <!-- Registration Settings -->
              <div class="space-y-3">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registration</h3>

                <!-- Require Registration Toggle -->
                <div
                  @click="form.registration_required = !form.registration_required"
                  class="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-white rounded-lg shadow-sm">
                      <ClipboardList class="w-4 h-4 text-sky-500" />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-slate-700">Require Registration</p>
                      <p class="text-xs text-slate-500">Attendees must register to join</p>
                    </div>
                  </div>
                  <div
                    role="switch"
                    :aria-checked="form.registration_required"
                    :class="[
                      'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                      form.registration_required ? 'bg-sky-500' : 'bg-slate-200'
                    ]"
                  >
                    <span
                      class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                      :style="{ transform: form.registration_required ? 'translateX(20px)' : 'translateX(0)' }"
                    />
                  </div>
                </div>

                <!-- Registration Details (shown when registration is required) -->
                <Transition name="slide-fade">
                  <div v-if="form.registration_required" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <!-- Registration Deadline -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">Registration Deadline</label>
                      <input
                        v-model="form.registration_deadline"
                        type="datetime-local"
                        :max="form.start_date"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                        placeholder="Optional deadline"
                      />
                      <p class="text-xs text-slate-500 mt-1">Leave empty for no deadline</p>
                    </div>

                    <!-- Max Attendees -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">Max Attendees</label>
                      <input
                        v-model.number="form.max_attendees"
                        type="number"
                        min="1"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                        placeholder="Unlimited"
                      />
                      <p class="text-xs text-slate-500 mt-1">Leave empty for unlimited</p>
                    </div>
                  </div>
                </Transition>
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
import { ArrowRight, Loader, ChevronDown, Save, ClipboardList, Globe, Lock, Sparkles } from 'lucide-vue-next'
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
  // Registration fields
  registration_required: boolean
  registration_deadline: string
  max_attendees: number | null
  // Auto populate
  auto_populate: boolean
  // Additional fields that will be added during submission
  short_description?: string
  is_virtual?: boolean
  virtual_link?: string
  banner_image?: string | null
  status?: string
}

interface EventSubmitData extends Omit<EventFormData, 'registration_deadline' | 'category'> {
  registration_deadline: string | null
  category: number | null
}

interface Props {
  isVisible: boolean
}

interface Emits {
  close: []
  submit: [formData: EventSubmitData]
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
  registration_required: false,
  registration_deadline: '',
  max_attendees: null,
  auto_populate: false,
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
    registration_required: false,
    registration_deadline: '',
    max_attendees: null,
    auto_populate: false,
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

    // Handle registration deadline - convert to ISO or null
    let registrationDeadline: string | null = null
    if (formData.registration_required && formData.registration_deadline) {
      registrationDeadline = new Date(formData.registration_deadline).toISOString()
    }

    // Handle max attendees - keep as number or null
    const maxAttendees = formData.registration_required && formData.max_attendees
      ? formData.max_attendees
      : null

    // Create event data with proper formatting
    const eventData = {
      ...formData,
      start_date: startDate,
      end_date: endDate,
      // Set defaults for required fields
      short_description: '',
      is_virtual: false,
      virtual_link: '', // API expects empty string, not null
      registration_required: formData.registration_required,
      registration_deadline: registrationDeadline,
      max_attendees: maxAttendees,
      category: categoryValue,
      banner_image: null,
      timezone: formData.timezone || getUserTimezone(),
      auto_populate: formData.auto_populate,
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

/* Slide fade transition for registration details */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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
