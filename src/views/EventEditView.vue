<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">

    <!-- Loading State -->
    <div v-if="loading" class="pt-24 pb-16">
      <div class="max-w-4xl mx-auto px-6 lg:px-8">
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded mb-8"></div>
          <div
            class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8"
          >
            <div class="space-y-6">
              <div class="h-4 bg-gray-200 rounded"></div>
              <div class="h-12 bg-gray-200 rounded"></div>
              <div class="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Form -->
    <div v-else-if="event" class="pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-14 md:pb-16">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-6 sm:mb-8">
          <div class="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
            <button
              @click="$router.back()"
              class="p-1.5 sm:p-2 text-slate-500 hover:text-[#1e90ff] hover:bg-[#E6F4FF] rounded-lg transition-all duration-200"
            >
              <ArrowLeft class="w-5 sm:w-6 h-5 sm:h-6" />
            </button>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">Edit Event</h1>
          </div>
          <p class="text-sm sm:text-base text-slate-600">Update your event details and settings.</p>
        </div>

        <!-- Form -->
        <form
          @submit.prevent="handleSubmit"
          class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-7 md:space-y-8"
        >
          <!-- Basic Information -->
          <div class="space-y-4 sm:space-y-5 md:space-y-6">
            <h2 class="text-lg sm:text-xl font-semibold text-slate-900 border-b border-gray-200 pb-2 sm:pb-3">
              Basic Information
            </h2>

            <!-- Title -->
            <div>
              <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"> Event Title * </label>
              <input
                v-model="form.title"
                type="text"
                required
                placeholder="Enter event title"
                class="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
              />
            </div>

            <!-- Short Description -->
            <div>
              <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Short Description
              </label>
              <input
                v-model="form.short_description"
                type="text"
                maxlength="300"
                placeholder="Brief description for event cards"
                class="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
              />
              <p class="text-xs text-slate-500 mt-1">
                {{ form.short_description?.length || 0 }}/300 characters
              </p>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Full Description *
              </label>
              <RichTextEditor
                v-model="form.description"
                placeholder="Detailed event description"
                min-height="150px"
              />
            </div>

            <!-- Category -->
            <div>
              <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"> Category </label>
              <select
                v-model="form.category"
                class="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_0.5rem_center] bg-no-repeat pr-10"
              >
                <option value="">Select a category</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Date and Time -->
          <div class="space-y-4 sm:space-y-5 md:space-y-6">
            <h2 class="text-lg sm:text-xl font-semibold text-slate-900 border-b border-gray-200 pb-2 sm:pb-3">
              Date & Time
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div>
                <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                  Start Date & Time *
                </label>
                <input
                  v-model="form.start_date"
                  type="datetime-local"
                  required
                  class="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div>
                <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                  End Date & Time *
                </label>
                <input
                  v-model="form.end_date"
                  type="datetime-local"
                  required
                  class="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                />
              </div>
            </div>

            <!-- Timezone -->
            <div>
              <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"> Timezone </label>
              <select
                v-model="form.timezone"
                class="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_0.5rem_center] bg-no-repeat pr-10"
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
              <p class="text-xs text-slate-500 mt-1">
                Current selection: {{ getSelectedTimezoneLabel() }}
              </p>
            </div>
          </div>

          <!-- Location -->
          <div class="space-y-4 sm:space-y-5 md:space-y-6">
            <h2 class="text-lg sm:text-xl font-semibold text-slate-900 border-b border-gray-200 pb-2 sm:pb-3">
              Location
            </h2>

            <!-- Virtual Event Toggle -->
            <div class="flex items-center space-x-2 sm:space-x-3">
              <input
                v-model="form.is_virtual"
                type="checkbox"
                id="is_virtual"
                class="w-4 sm:w-5 h-4 sm:h-5 text-[#1e90ff] border-gray-300 rounded focus:ring-[#1e90ff]"
              />
              <label for="is_virtual" class="text-xs sm:text-sm font-medium text-slate-700">
                This is a virtual event
              </label>
            </div>

            <!-- Location or Virtual Link -->
            <div v-if="!form.is_virtual">
              <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Event Location
              </label>
              <textarea
                v-model="form.location"
                rows="3"
                placeholder="Event location address"
                class="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
              ></textarea>
            </div>

            <div v-else>
              <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Virtual Meeting Link
              </label>
              <input
                v-model="form.virtual_link"
                type="url"
                placeholder="https://zoom.us/meeting/..."
                class="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
              />
            </div>
          </div>

          <!-- Event Settings -->
          <div class="space-y-4 sm:space-y-5 md:space-y-6">
            <h2 class="text-lg sm:text-xl font-semibold text-slate-900 border-b border-gray-200 pb-2 sm:pb-3">
              Event Settings
            </h2>

            <!-- Status -->
            <div>
              <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                Event Status
              </label>
              <select
                v-model="form.status"
                class="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_0.5rem_center] bg-no-repeat pr-10"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <!-- Action Buttons -->
          <div
            class="flex flex-row justify-end gap-2 sm:gap-3 md:gap-4 pt-4 sm:pt-6 md:pt-8 border-t border-gray-200"
          >
            <button
              type="button"
              @click="$router.back()"
              class="flex-1 sm:flex-none px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 sm:flex-none px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg sm:rounded-xl font-bold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 sm:hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              <Loader v-if="isSubmitting" class="w-4 sm:w-4.5 md:w-5 h-4 sm:h-4.5 md:h-5 mr-1.5 sm:mr-2 animate-spin" />
              {{ isSubmitting ? 'Updating...' : 'Update Event' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="pt-24 pb-16">
      <div class="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12">
          <AlertTriangle class="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 class="text-2xl font-bold text-slate-900 mb-4">Event Not Found</h1>
          <p class="text-slate-600 mb-8">{{ error }}</p>
          <button
            @click="$router.push('/events')"
            class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 hover:scale-105"
          >
            Back to Events
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-28 lg:bottom-8 right-6 z-50">
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
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Loader, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-vue-next'
import MainLayout from '../components/MainLayout.vue'
import RichTextEditor from '../components/RichTextEditor.vue'
import {
  eventsService,
  eventCategoriesService,
  type Event,
  type EventCategory,
} from '../services/api'
import { getTimezonesByRegion, findTimezoneOption, getUserTimezone } from '../utils/timezones'

const route = useRoute()
const router = useRouter()

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
  category: '' as string | number | null, // HTML selects return strings
})

// Methods
const loadEvent = async () => {
  const eventId = route.params.id as string
  if (!eventId) {
    error.value = 'Invalid event ID'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await eventsService.getEvent(eventId)

    if (response.success && response.data) {
      event.value = response.data
      populateForm(response.data)
    } else {
      error.value = response.message || 'Event not found'
    }
  } catch (err) {
    console.error('Error loading event:', err)
    error.value = 'Failed to load event details'
  } finally {
    loading.value = false
  }
}

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

const populateForm = (eventData: Event) => {
  form.title = eventData.title || ''
  form.short_description = eventData.short_description || ''
  form.description = eventData.description || ''
  form.start_date = eventData.start_date.slice(0, 16) // Convert to datetime-local format
  form.end_date = eventData.end_date.slice(0, 16)
  form.timezone = eventData.timezone || getUserTimezone()
  form.location = eventData.location || ''
  form.virtual_link = eventData.virtual_link || ''
  form.is_virtual = eventData.is_virtual
  form.privacy = eventData.privacy
  form.status = eventData.status
  form.category = eventData.category ? eventData.category.toString() : '' // Convert to string for HTML select
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

  // Less strict validation - let API handle what's required
  // if (form.is_virtual && (!form.virtual_link || !form.virtual_link.trim())) {
  //   showMessage('error', 'Virtual meeting link is required for virtual events')
  //   return
  // }

  // if (!form.is_virtual && (!form.location || !form.location.trim())) {
  //   showMessage('error', 'Location is required for in-person events')
  //   return
  // }

  isSubmitting.value = true

  try {
    // Build update data object with proper type handling
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

    // Handle category - convert string to number or set to null
    if (form.category && form.category !== '') {
      updateData.category = parseInt(form.category.toString(), 10)
    } else {
      updateData.category = null
    }

    // Handle location and virtual_link - API requires location to not be null
    if (form.is_virtual) {
      // For virtual events, set location to empty string and include virtual_link
      updateData.location = ''
      updateData.virtual_link = form.virtual_link ? form.virtual_link.trim() : ''
    } else {
      // For in-person events, location is required and virtual_link should be empty
      updateData.location = form.location ? form.location.trim() : ''
      updateData.virtual_link = ''
    }

    if (import.meta.env.DEV) {
      console.log('Sending update data:', updateData)
      console.log('Original form data:', { ...form })
    }

    const response = await eventsService.patchEvent(event.value.id, updateData)

    if (response.success) {
      showMessage('success', 'Event updated successfully!')
      setTimeout(() => {
        router.push(`/events/${event.value!.id}`)
      }, 1500)
    } else {
      console.error('API Error Response:', response)
      showMessage('error', response.message || 'Failed to update event')
    }
  } catch (error) {
    console.error('Error updating event:', error)
    showMessage('error', 'An error occurred while updating the event')
  } finally {
    isSubmitting.value = false
  }
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Computed properties
const getSelectedTimezoneLabel = () => {
  const option = findTimezoneOption(form.timezone)
  return option ? option.label : form.timezone
}

// Lifecycle
onMounted(async () => {
  await Promise.all([loadEvent(), loadCategories()])
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
