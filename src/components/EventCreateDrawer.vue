<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="drawer-backdrop">
      <div
        v-if="isVisible"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="handleBackdropClick"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="drawer-panel">
      <div
        v-if="isVisible"
        ref="panel"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[36.25rem] lg:w-[40rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2 min-w-0">
              <button
                :disabled="isBusy"
                @click="$emit('close')"
                class="p-1.5 hover:bg-white/20 active:bg-white/30 disabled:opacity-40 disabled:pointer-events-none rounded-lg drawer-close flex-shrink-0"
                :title="t('common.actions.close')"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <h2 class="text-base font-semibold text-white truncate">{{ t('events.createDrawer.title') }}</h2>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <form
            @submit.prevent="handleSubmit"
            class="p-4 space-y-5 pb-6"
            :class="isBusy ? 'form-busy' : ''"
            :inert="isBusy"
          >
            <div class="space-y-5">
              <!-- Basic Information -->
              <div class="space-y-3">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('events.createDrawer.sections.basicInfo') }}</h3>

                <!-- Title and Category Row -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Title -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('events.createDrawer.fields.eventTitle') }} *</label>
                    <input
                      ref="titleInput"
                      v-model="form.title"
                      type="text"
                      required
                      :placeholder="t('events.createDrawer.fields.titlePlaceholder')"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    />
                  </div>

                  <!-- Category -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('events.createDrawer.fields.category') }}</label>
                    <SelectField
                      :model-value="form.category ?? ''"
                      @update:model-value="form.category = $event"
                      :options="categoryOptions"
                      allow-empty
                      :placeholder="t('events.createDrawer.fields.categoryPlaceholder')"
                      :title="t('events.createDrawer.fields.category')"
                    />
                  </div>
                </div>

                <!-- Auto Populate (shown when category is selected) -->
                <Transition name="drawer-reveal">
                  <div v-if="form.category && form.category !== ''" class="grid grid-rows-[1fr]">
                    <div class="min-h-0 overflow-hidden">
                      <button
                        type="button"
                        role="switch"
                        :aria-checked="form.auto_populate"
                        @click="form.auto_populate = !form.auto_populate"
                        class="toggle-row rounded-lg bg-slate-50"
                      >
                        <div class="flex items-center gap-3">
                          <div class="p-2 bg-white rounded-lg shadow-sm">
                            <Sparkles class="w-4 h-4 text-sky-500" />
                          </div>
                          <div>
                            <p class="text-sm font-medium text-slate-700">{{ t('events.createDrawer.autoPopulate.label') }}</p>
                            <p class="text-xs text-slate-500">{{ t('events.createDrawer.autoPopulate.description') }}</p>
                          </div>
                        </div>
                        <div aria-hidden="true" :class="['switch-track', form.auto_populate ? 'bg-sky-500' : 'bg-slate-200']">
                          <span class="switch-knob" :style="{ transform: form.auto_populate ? 'translateX(20px)' : 'translateX(0)' }" />
                        </div>
                      </button>
                    </div>
                  </div>
                </Transition>

              </div>

              <!-- Date and Time -->
              <div class="space-y-3">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('events.createDrawer.sections.dateTime') }}</h3>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('events.createDrawer.fields.startDateTime') }} *</label>
                    <DateTimePickerField
                      :model-value="form.start_date"
                      @update:model-value="onStartDateChange"
                      :title="t('events.createDrawer.fields.startDateTime')"
                      :quick-times="commonStartTimes"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('events.createDrawer.fields.endDateTime') }} *</label>
                    <DateTimePickerField
                      v-model="form.end_date"
                      :min="form.start_date"
                      :error="!!dateError"
                      :title="t('events.createDrawer.fields.endDateTime')"
                      :quick-times="commonEndTimes"
                    />
                    <Transition name="drawer-reveal">
                      <div v-if="dateError" class="grid grid-rows-[1fr]">
                        <div class="min-h-0 overflow-hidden">
                          <p class="text-xs sm:text-sm text-red-600 pt-1">{{ dateError }}</p>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>

              <!-- Access: privacy + registration read as one group of switches -->
              <div class="space-y-3">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ t('events.createDrawer.sections.access') }}</h3>

                <div class="rounded-lg bg-slate-50 divide-y divide-slate-200/70 overflow-hidden">
                  <!-- Privacy Toggle -->
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="form.privacy === 'public'"
                    @click="form.privacy = form.privacy === 'public' ? 'private' : 'public'"
                    class="toggle-row"
                  >
                    <div class="flex items-center gap-3">
                      <div class="p-2 bg-white rounded-lg shadow-sm">
                        <component :is="form.privacy === 'public' ? Globe : Lock" class="w-4 h-4 text-sky-500" />
                      </div>
                      <div>
                        <p class="text-sm font-medium text-slate-700">{{ form.privacy === 'public' ? t('events.createDrawer.privacyToggle.publicLabel') : t('events.createDrawer.privacyToggle.privateLabel') }}</p>
                        <p class="text-xs text-slate-500">{{ form.privacy === 'public' ? t('events.createDrawer.privacyToggle.publicDescription') : t('events.createDrawer.privacyToggle.privateDescription') }}</p>
                      </div>
                    </div>
                    <div aria-hidden="true" :class="['switch-track', form.privacy === 'public' ? 'bg-sky-500' : 'bg-slate-200']">
                      <span class="switch-knob" :style="{ transform: form.privacy === 'public' ? 'translateX(20px)' : 'translateX(0)' }" />
                    </div>
                  </button>

                  <!-- Require Registration Toggle -->
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="form.registration_required"
                    @click="form.registration_required = !form.registration_required"
                    class="toggle-row"
                  >
                    <div class="flex items-center gap-3">
                      <div class="p-2 bg-white rounded-lg shadow-sm">
                        <ClipboardList class="w-4 h-4 text-sky-500" />
                      </div>
                      <div>
                        <p class="text-sm font-medium text-slate-700">{{ t('events.createDrawer.requireRegistration.label') }}</p>
                        <p class="text-xs text-slate-500">{{ t('events.createDrawer.requireRegistration.description') }}</p>
                      </div>
                    </div>
                    <div aria-hidden="true" :class="['switch-track', form.registration_required ? 'bg-sky-500' : 'bg-slate-200']">
                      <span class="switch-knob" :style="{ transform: form.registration_required ? 'translateX(20px)' : 'translateX(0)' }" />
                    </div>
                  </button>
                </div>

                <!-- Registration Details (shown when registration is required) -->
                <Transition name="drawer-reveal">
                  <div v-if="form.registration_required" class="grid grid-rows-[1fr]">
                    <div class="min-h-0 overflow-hidden">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <!-- Registration Deadline -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('events.createDrawer.fields.registrationDeadline') }}</label>
                          <DateTimePickerField
                            v-model="form.registration_deadline"
                            :max="form.start_date"
                            clearable
                            :title="t('events.createDrawer.fields.registrationDeadline')"
                            :placeholder="t('events.createDrawer.fields.deadlinePlaceholder')"
                          />
                          <p class="text-xs text-slate-500 mt-1">{{ t('events.createDrawer.fields.deadlineHint') }}</p>
                        </div>

                        <!-- Max Attendees -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('events.createDrawer.fields.maxAttendees') }}</label>
                          <input
                            v-model.number="form.max_attendees"
                            type="number"
                            min="1"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                            :placeholder="t('events.createDrawer.fields.maxAttendeesPlaceholder')"
                          />
                          <p class="text-xs text-slate-500 mt-1">{{ t('events.createDrawer.fields.maxAttendeesHint') }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>

                <!-- Full Description (public events only) -->
                <Transition name="drawer-reveal">
                  <div v-if="form.privacy === 'public'" class="grid grid-rows-[1fr]">
                    <div class="min-h-0 overflow-hidden">
                      <div class="pt-1">
                        <label class="block text-sm font-medium text-slate-700 mb-2">{{ t('events.createDrawer.fields.aboutEvent') }}</label>
                        <div
                          contenteditable="true"
                          ref="descriptionEditor"
                          @input="handleDescriptionInput"
                          @blur="handleDescriptionBlur"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white text-slate-800 min-h-[8.75rem] max-h-[20rem] overflow-y-auto"
                          :data-placeholder="form.description ? '' : t('events.createDrawer.fields.descriptionPlaceholder')"
                        ></div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <div class="flex items-center justify-between">
            <!-- The three states are stacked in one grid cell, so the button's
                 width is the widest of them and never jumps as they swap. -->
            <button
              @click="handleSubmit"
              :disabled="isBusy"
              :class="['submit-btn', isComplete ? 'is-complete' : '']"
              class="grid px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg rounded-lg hover:opacity-90 shadow-md disabled:cursor-not-allowed"
            >
              <span class="submit-face" :data-on="!isSubmitting && !isComplete">
                <Save class="w-4 h-4" />
                <span>{{ t('events.createDrawer.actions.create') }}</span>
              </span>
              <span class="submit-face" :data-on="isSubmitting">
                <Loader class="w-4 h-4 animate-spin" />
                <span>{{ t('events.createDrawer.actions.creating') }}</span>
              </span>
              <span class="submit-face" :data-on="isComplete" aria-live="polite">
                <Check class="w-4 h-4" />
                <span>{{ t('events.createDrawer.actions.created') }}</span>
              </span>
            </button>

            <button
              type="button"
              :disabled="isBusy"
              @click="$emit('close')"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-[background-color,transform,opacity] duration-150 ease-out active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            >
              {{ t('events.createDrawer.actions.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import { ArrowRight, Loader, Save, Check, ClipboardList, Globe, Lock, Sparkles } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '@/composables/useToast'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import DateTimePickerField from '@/components/common/DateTimePickerField.vue'
import SelectField, { type SelectFieldOption } from '@/components/common/SelectField.vue'

const { t } = useAppLanguage()
const { showError } = useToast()
const { translateEventCategory } = useCategoryTranslation()

// Common start/end times for hosted events (weddings, birthdays, housewarmings, etc.)
// so users can pick a typical slot instead of scrolling the hour/minute selects.
const commonStartTimes = [8, 10, 12, 14, 17, 18]
const commonEndTimes = [12, 14, 17, 19, 21, 22]
import { getUserTimezone } from '../utils/timezones'
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
  /**
   * The parent performs the create and calls `done(ok)` when it settles.
   * The drawer owns the press -> working -> confirmed choreography; the parent
   * only owns the request, so it must not close this drawer itself.
   */
  submit: [formData: EventSubmitData, done: (ok: boolean) => void]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Refs
const descriptionEditor = ref<HTMLElement>()
const panel = ref<HTMLElement>()
const titleInput = ref<HTMLInputElement>()
const isSubmitting = ref(false)
// Held on screen after a successful create, long enough to be seen.
const isComplete = ref(false)
const isBusy = computed(() => isSubmitting.value || isComplete.value)
// The confirmation is the point of the beat, so it outlasts a glance.
const SUCCESS_HOLD_MS = 620
let successTimer: number | undefined
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

// Category options for the select field
const categoryOptions = computed<SelectFieldOption[]>(() =>
  categories.value.map((category) => ({
    value: category.id,
    label: translateEventCategory(category.name),
    color: category.color || '#3B82F6',
  })),
)

// Live validation: end date must be after start date
const dateError = computed(() =>
  form.start_date && form.end_date && new Date(form.end_date) <= new Date(form.start_date)
    ? t('events.messages.endDateAfterStart')
    : '',
)

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
  if (isBusy.value) return
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
  if (isBusy.value) return

  // Validate before submitting; button sits outside the <form>, so native
  // required validation never runs
  if (!form.title.trim()) {
    showError(t('common.errors.validation'))
    return
  }
  if (!form.start_date || !form.end_date || dateError.value) {
    showError(t('events.messages.endDateAfterStart'))
    return
  }

  isSubmitting.value = true

  try {
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

    // Hand off and wait. Closing here — as this did — meant the drawer was gone
    // before the event existed: the spinner never rendered, a failure arrived as
    // a toast over a form that had already been wiped, and there was no moment
    // that read as "created".
    emit('submit', eventData, onSubmitSettled)
  } catch (error) {
    console.error('Error creating event:', error)
    showError(t('events.messages.createFailed'))
    isSubmitting.value = false
  }
}

const onSubmitSettled = (ok: boolean) => {
  isSubmitting.value = false
  // Failure keeps the drawer open with the form intact; the parent has toasted
  // the reason, and the user is one edit away from retrying.
  if (!ok) return

  isComplete.value = true
  successTimer = window.setTimeout(() => {
    successTimer = undefined
    emit('close')
  }, SUCCESS_HOLD_MS)
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])'

// Keep Tab inside the drawer — without this the user tabs straight out into the
// page behind the backdrop, which they can neither see nor click.
const trapFocus = (e: KeyboardEvent) => {
  if (!panel.value) return
  const items = Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null,
  )
  if (!items.length) return

  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement as HTMLElement | null

  if (e.shiftKey && (active === first || !panel.value.contains(active))) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (!isBusy.value) emit('close')
  } else if (e.key === 'Tab') trapFocus(e)
}

// Watch for drawer visibility
watch(
  () => props.isVisible,
  (isVisible) => {
    if (isVisible) {
      // Reset form when drawer opens
      resetForm()
      if (successTimer) window.clearTimeout(successTimer)
      successTimer = undefined
      isSubmitting.value = false
      isComplete.value = false

      // Prevent body scroll when drawer is open
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
      document.addEventListener('keydown', handleKeydown)

      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        window.setTimeout(() => titleInput.value?.focus(), 400)
      }
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.removeEventListener('keydown', handleKeydown)
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

// Format a Date as a local datetime-local string (toISOString would shift to UTC)
const toLocalInputString = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Set default start date to now + 1 hour
const setDefaultDates = () => {
  const now = new Date()
  const startDate = new Date(now.getTime() + 60 * 60 * 1000) // +1 hour
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // +2 hours from start

  form.start_date = toLocalInputString(startDate)
  form.end_date = toLocalInputString(endDate)
}

// When the user picks a new start, shift the end to preserve the chosen duration
const onStartDateChange = (value: string) => {
  const oldStart = form.start_date
  const oldEnd = form.end_date
  form.start_date = value
  if (!value || !oldEnd) return

  const start = new Date(value)
  if (oldStart) {
    const duration = new Date(oldEnd).getTime() - new Date(oldStart).getTime()
    if (duration > 0) {
      form.end_date = toLocalInputString(new Date(start.getTime() + duration))
      return
    }
  }
  if (new Date(oldEnd) <= start) {
    form.end_date = toLocalInputString(new Date(start.getTime() + 2 * 60 * 60 * 1000))
  }
}

// Load categories when component mounts
onMounted(() => {
  loadCategories()
  setDefaultDates()
})

onUnmounted(() => {
  if (successTimer) window.clearTimeout(successTimer)
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* Three-state submit button: idle -> working -> confirmed.
   All three faces occupy the same grid cell, so the button sizes to the widest
   of them once and never resizes as they swap. */
.submit-btn {
  transition:
    opacity 0.15s ease-out,
    transform 0.15s ease-out,
    filter 0.2s ease-out;
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.submit-btn:disabled {
  cursor: not-allowed;
}

/* Working reads as held, not broken — it is still the same live control. */
.submit-btn:disabled:not(.is-complete) {
  opacity: 0.75;
}

.submit-face {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  /* Blur bridges the two faces so the swap reads as one label transforming
     rather than two labels overlapping. */
  filter: blur(3px);
  opacity: 0;
  transform: scale(0.96);
  transition:
    opacity 0.18s ease-out,
    filter 0.18s ease-out,
    transform 0.18s cubic-bezier(0.23, 1, 0.32, 1);
  pointer-events: none;
}

.submit-face[data-on='true'] {
  filter: blur(0);
  opacity: 1;
  transform: scale(1);
}

/* The form stays visible but stops accepting edits while the create is in
   flight, so nothing the user types can be silently dropped. */
.form-busy {
  pointer-events: none;
  opacity: 0.6;
  transition: opacity 0.2s ease-out;
}

/* Shared switch-row anatomy (privacy, registration, auto-populate) */
.toggle-row {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  text-align: left;
  transition:
    background-color 0.2s ease,
    transform 0.15s cubic-bezier(0.23, 1, 0.32, 1);
}

.toggle-row:hover {
  background-color: rgb(241 245 249 / 0.7);
}

.toggle-row:active {
  transform: scale(0.99);
}

.toggle-row:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgb(186 230 253);
}

.switch-track {
  position: relative;
  display: inline-flex;
  height: 1.5rem;
  width: 2.75rem;
  flex-shrink: 0;
  border: 2px solid transparent;
  border-radius: 9999px;
  transition: background-color 0.2s ease;
}

.switch-knob {
  pointer-events: none;
  display: inline-block;
  height: 1.25rem;
  width: 1.25rem;
  border-radius: 9999px;
  background-color: #fff;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  /* Strong ease-out: the knob should land, not coast. */
  transition: transform 0.22s cubic-bezier(0.23, 1, 0.32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .switch-knob,
  .toggle-row {
    transition-duration: 0.01ms;
  }

  .toggle-row:active {
    transform: none;
  }

  .submit-btn:active:not(:disabled) {
    transform: none;
  }

  .submit-face {
    transition-duration: 0.01ms;
    filter: none;
    transform: none;
  }

  .submit-face[data-on='true'] {
    filter: none;
    transform: none;
  }}

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
}</style>
