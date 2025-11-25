<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[580px] lg:w-[640px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center justify-between px-4 py-4">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-3">
              <button
                @click="closeDrawer"
                class="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <X class="w-5 h-5 text-white" />
              </button>
              <h2 class="text-lg font-bold text-white">Edit Event</h2>
            </div>

            <!-- Right: Save button -->
            <button
              @click="handleSubmit"
              :disabled="isSubmitting"
              class="flex items-center gap-2 px-4 py-2 bg-white text-[#1e90ff] font-semibold rounded-xl hover:bg-white/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <Check v-else class="w-4 h-4" />
              <span>{{ isSubmitting ? 'Saving...' : 'Save' }}</span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!-- Loading State -->
          <div v-if="loading" class="p-6">
            <div class="animate-pulse space-y-6">
              <div class="h-10 bg-slate-200 rounded-xl"></div>
              <div class="h-24 bg-slate-200 rounded-xl"></div>
              <div class="h-10 bg-slate-200 rounded-xl"></div>
              <div class="grid grid-cols-2 gap-4">
                <div class="h-10 bg-slate-200 rounded-xl"></div>
                <div class="h-10 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="p-6 text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle class="w-8 h-8 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Unable to Load Event</h3>
            <p class="text-slate-600 mb-4">{{ error }}</p>
            <button
              @click="loadEvent"
              class="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>

          <!-- Edit Form -->
          <div v-else class="p-5 space-y-6 pb-24">
            <!-- Basic Information -->
            <div class="space-y-4">
              <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Basic Information</h3>

              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Event Title *</label>
                <input
                  v-model="form.title"
                  type="text"
                  required
                  placeholder="Enter event title"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all bg-white"
                />
              </div>

              <!-- Short Description -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
                <input
                  v-model="form.short_description"
                  type="text"
                  maxlength="300"
                  placeholder="Brief description for event cards"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all bg-white"
                />
                <p class="text-xs text-slate-500 mt-1">
                  {{ form.short_description?.length || 0 }}/300 characters
                </p>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Full Description *</label>
                <RichTextEditor
                  v-model="form.description"
                  placeholder="Detailed event description"
                  min-height="120px"
                />
              </div>

              <!-- Category -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <select
                  v-model="form.category"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                >
                  <option value="">Select a category</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Date and Time -->
            <div class="space-y-4 border-t border-slate-100 pt-6">
              <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Date & Time</h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">Start *</label>
                  <input
                    v-model="form.start_date"
                    type="datetime-local"
                    required
                    class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all bg-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-1.5">End *</label>
                  <input
                    v-model="form.end_date"
                    type="datetime-local"
                    required
                    class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all bg-white"
                  />
                </div>
              </div>

              <!-- Timezone -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Timezone</label>
                <select
                  v-model="form.timezone"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                >
                  <optgroup
                    v-for="(timezones, region) in timezonesByRegion"
                    :key="region"
                    :label="region"
                  >
                    <option
                      v-for="timezone in timezones"
                      :key="timezone.value"
                      :value="timezone.value"
                    >
                      {{ timezone.label }}
                    </option>
                  </optgroup>
                </select>
              </div>
            </div>

            <!-- Location -->
            <div class="space-y-4 border-t border-slate-100 pt-6">
              <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Location</h3>

              <!-- Virtual Event Toggle -->
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="form.is_virtual"
                  type="checkbox"
                  class="w-5 h-5 text-[#1e90ff] border-slate-300 rounded focus:ring-[#1e90ff]"
                />
                <span class="text-sm font-medium text-slate-700">This is a virtual event</span>
              </label>

              <!-- Location or Virtual Link -->
              <div v-if="!form.is_virtual">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Event Location</label>
                <textarea
                  v-model="form.location"
                  rows="2"
                  placeholder="Event location address"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all bg-white resize-none"
                ></textarea>
              </div>

              <div v-else>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Virtual Meeting Link</label>
                <input
                  v-model="form.virtual_link"
                  type="url"
                  placeholder="https://zoom.us/meeting/..."
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Success/Error Toast -->
        <Transition name="slide-up">
          <div v-if="message" class="absolute bottom-4 left-4 right-4 z-10">
            <div
              :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
              class="text-white px-4 py-3 rounded-xl shadow-lg flex items-center"
            >
              <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2 flex-shrink-0" />
              <AlertCircle v-else class="w-5 h-5 mr-2 flex-shrink-0" />
              <span class="text-sm">{{ message.text }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import {
  X,
  Check,
  Loader,
  AlertCircle,
  CheckCircle,
} from 'lucide-vue-next'
import RichTextEditor from './RichTextEditor.vue'
import {
  eventsService,
  eventCategoriesService,
  type Event,
  type EventCategory,
} from '../services/api'
import { getTimezonesByRegion, getUserTimezone } from '../utils/timezones'

interface Props {
  modelValue: boolean
  eventId: string | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', event: Event): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const event = ref<Event | null>(null)
const categories = ref<EventCategory[]>([])
const loading = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Timezone data
const timezonesByRegion = getTimezonesByRegion()

// Form data
const form = reactive({
  title: '',
  short_description: '',
  description: '',
  start_date: '',
  end_date: '',
  timezone: getUserTimezone(),
  location: '',
  virtual_link: '',
  is_virtual: false,
  privacy: 'public' as 'public' | 'private',
  status: 'published' as 'draft' | 'published' | 'cancelled' | 'completed',
  category: '' as string | number | null,
})

// Methods
const loadEvent = async () => {
  if (!props.eventId) return

  loading.value = true
  error.value = null

  try {
    const [eventResponse, categoriesResponse] = await Promise.all([
      eventsService.getEvent(props.eventId),
      eventCategoriesService.getCategories()
    ])

    if (eventResponse.success && eventResponse.data) {
      event.value = eventResponse.data
      populateForm(eventResponse.data)
    } else {
      error.value = eventResponse.message || 'Event not found'
    }

    if (categoriesResponse.success && categoriesResponse.data) {
      categories.value = categoriesResponse.data.results || []
    }
  } catch (err) {
    console.error('Error loading event:', err)
    error.value = 'Failed to load event details'
  } finally {
    loading.value = false
  }
}

const populateForm = (eventData: Event) => {
  form.title = eventData.title || ''
  form.short_description = eventData.short_description || ''
  form.description = eventData.description || ''
  form.start_date = eventData.start_date.slice(0, 16)
  form.end_date = eventData.end_date.slice(0, 16)
  form.timezone = eventData.timezone || getUserTimezone()
  form.location = eventData.location || ''
  form.virtual_link = eventData.virtual_link || ''
  form.is_virtual = eventData.is_virtual
  form.privacy = eventData.privacy
  form.status = eventData.status
  form.category = eventData.category ? eventData.category.toString() : ''
}

const handleSubmit = async () => {
  if (!event.value) return

  // Validation
  if (!form.title.trim()) {
    showMessage('error', 'Event title is required')
    return
  }

  if (!form.description.trim()) {
    showMessage('error', 'Event description is required')
    return
  }

  if (!form.start_date || !form.end_date) {
    showMessage('error', 'Start date and end date are required')
    return
  }

  if (new Date(form.end_date) <= new Date(form.start_date)) {
    showMessage('error', 'End date must be after start date')
    return
  }

  isSubmitting.value = true

  try {
    const updateData: Partial<Event> & { category?: number | null; location?: string; virtual_link?: string } = {
      title: form.title.trim(),
      short_description: form.short_description ? form.short_description.trim() : '',
      description: form.description.trim(),
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      timezone: form.timezone || 'UTC',
      is_virtual: form.is_virtual,
      privacy: form.privacy,
      status: form.status,
    }

    // Handle category
    if (form.category && form.category !== '') {
      updateData.category = parseInt(form.category.toString(), 10)
    } else {
      updateData.category = null
    }

    // Handle location and virtual_link
    if (form.is_virtual) {
      updateData.location = ''
      updateData.virtual_link = form.virtual_link ? form.virtual_link.trim() : ''
    } else {
      updateData.location = form.location ? form.location.trim() : ''
      updateData.virtual_link = ''
    }

    const response = await eventsService.patchEvent(event.value.id, updateData)

    if (response.success && response.data) {
      showMessage('success', 'Event updated successfully!')
      emit('updated', response.data)
      setTimeout(() => {
        closeDrawer()
      }, 1000)
    } else {
      showMessage('error', response.message || 'Failed to update event')
    }
  } catch (err) {
    console.error('Error updating event:', err)
    showMessage('error', 'An error occurred while updating the event')
  } finally {
    isSubmitting.value = false
  }
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 4000)
}

const closeDrawer = () => {
  emit('update:modelValue', false)
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for drawer open/close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.eventId) {
      loadEvent()
    }
    // Prevent body scroll when drawer is open
    if (isOpen) {
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }
)

// Watch for eventId changes
watch(
  () => props.eventId,
  (newId) => {
    if (newId && props.modelValue) {
      loadEvent()
    }
  }
)
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

/* Slide up transition for toast */
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
