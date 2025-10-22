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
            <div class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 sm:space-x-3">
                  <div class="w-8 sm:w-9 md:w-10 h-8 sm:h-9 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Plus class="w-4 sm:w-4.5 md:w-5 h-4 sm:h-4.5 md:h-5" />
                  </div>
                  <h2 class="text-lg sm:text-xl md:text-2xl font-bold">Create New Event</h2>
                </div>
                <button
                  @click="$emit('close')"
                  class="w-7 sm:w-7.5 md:w-8 h-7 sm:h-7.5 md:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <X class="w-3.5 sm:w-3.5 md:w-4 h-3.5 sm:h-3.5 md:h-4" />
                </button>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <!-- Title -->
              <div>
                <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                  Event Title *
                </label>
                <input
                  v-model="form.title"
                  type="text"
                  required
                  placeholder="Enter event title"
                  class="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                />
              </div>

              <!-- Category -->
              <div>
                <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                  Event Category
                </label>
                <select
                  v-model="form.category"
                  class="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                >
                  <option value="">Select a category</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
                  Full Description *
                </label>
                <textarea
                  v-model="form.description"
                  required
                  rows="3"
                  placeholder="Detailed event description"
                  class="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                ></textarea>
              </div>

              <!-- Date and Time -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

              <!-- Action Buttons -->
              <div
                class="flex flex-row justify-end gap-2 sm:gap-3 md:gap-4 pt-4 sm:pt-5 md:pt-6 border-t border-gray-200"
              >
                <button
                  type="button"
                  @click="$emit('close')"
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
import { Plus, X, Loader } from 'lucide-vue-next'
import { getTimezonesByRegion, findTimezoneOption, getUserTimezone } from '../utils/timezones'
import { eventCategoriesService, type EventCategory } from '../services/api'

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
</style>
