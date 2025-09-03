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
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Plus class="w-5 h-5" />
                  </div>
                  <h2 class="text-2xl font-bold">Create New Event</h2>
                </div>
                <button
                  @click="$emit('close')"
                  class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="p-8 space-y-6">
              <!-- Title -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">
                  Event Title *
                </label>
                <input
                  v-model="form.title"
                  type="text"
                  required
                  placeholder="Enter event title"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                />
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">
                  Full Description *
                </label>
                <textarea
                  v-model="form.description"
                  required
                  rows="4"
                  placeholder="Detailed event description"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                ></textarea>
              </div>

              <!-- Date and Time -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    v-model="form.start_date"
                    type="datetime-local"
                    required
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    v-model="form.end_date"
                    type="datetime-local"
                    required
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  />
                </div>
              </div>

              <!-- Timezone -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">
                  Timezone
                </label>
                <select
                  v-model="form.timezone"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                >
                  <optgroup v-for="(timezones, region) in timezonesByRegion" :key="region" :label="region">
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

              <!-- Location -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">
                  Location
                </label>
                <input
                  v-model="form.location"
                  type="text"
                  placeholder="Event location address (optional)"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                />
              </div>

              <!-- Privacy Setting -->
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">
                  Event Privacy
                </label>
                <div class="flex space-x-4">
                  <label class="flex items-center">
                    <input
                      v-model="form.privacy"
                      type="radio"
                      value="public"
                      class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span class="ml-2 text-sm text-slate-700">Public</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      v-model="form.privacy"
                      type="radio"
                      value="private"
                      class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span class="ml-2 text-sm text-slate-700">Private</span>
                  </label>
                </div>
              </div>


              <!-- Action Buttons -->
              <div class="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  <Loader v-if="isSubmitting" class="w-5 h-5 mr-2 animate-spin" />
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
import { ref, reactive, watch } from 'vue'
import { Plus, X, Loader } from 'lucide-vue-next'
import { getTimezonesByRegion, findTimezoneOption, getUserTimezone } from '../utils/timezones'

// Types
interface EventFormData {
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  privacy: 'public' | 'private'
  timezone: string
  // Additional fields that will be added during submission
  short_description?: string
  is_virtual?: boolean
  virtual_link?: string
  max_attendees?: number | null
  registration_required?: boolean
  registration_deadline?: string | null
  category?: number | null
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
const isSubmitting = ref(false)

// Form data
const form = reactive<EventFormData>({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  location: '',
  privacy: 'public',
  timezone: getUserTimezone()
})

// Timezone data
const timezonesByRegion = getTimezonesByRegion()

// Methods
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
    privacy: 'public',
    timezone: getUserTimezone()
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
    
    // Create event data with proper formatting
    const eventData = {
      ...formData,
      start_date: startDate,
      end_date: endDate,
      // Set defaults for required fields
      short_description: formData.description.substring(0, 150) + (formData.description.length > 150 ? '...' : ''),
      is_virtual: false,
      virtual_link: '', // API expects empty string, not null
      max_attendees: null,
      registration_required: false,
      registration_deadline: null,
      category: null,
      banner_image: null,
      timezone: formData.timezone || getUserTimezone(),
      status: 'published'
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
watch(() => props.isVisible, (isVisible) => {
  if (isVisible) {
    // Reset form when modal opens
    resetForm()
    
    // Focus management
    setTimeout(() => {
      const firstInput = modalRef.value?.querySelector('input, textarea, select') as HTMLElement
      firstInput?.focus()
    }, 100)
  }
})

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

// Set defaults when component mounts
setDefaultDates()
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
</style>