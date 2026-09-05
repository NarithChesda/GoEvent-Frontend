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
            <div class="flex items-center gap-2 min-w-0">
              <button
                :disabled="isBusy"
                class="p-1.5 hover:bg-white/20 active:bg-white/30 disabled:opacity-40 disabled:pointer-events-none rounded-lg drawer-close flex-shrink-0"
                :title="t('common.actions.close')"
                @click="$emit('close')"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <h2 class="text-base font-semibold text-white truncate">
                {{ t('events.createDrawer.title') }}
              </h2>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <form
            class="p-4 space-y-5 pb-6"
            :class="isBusy ? 'form-busy' : ''"
            :inert="isBusy"
            @submit.prevent="handleSubmit"
          >
            <!--
              No section eyebrows anywhere in this form.

              There were three ("Basic Information", "Date and Time", "Access")
              over groups of two fields each, which is the failure
              goevent-taste §4 describes: an eyebrow separates a region a user
              navigates *to*, and nobody scrolls back to a two-field group.
              The grouped lists and the space between them do the separating,
              and every row already names itself.
            -->

            <!-- What it is -->
            <div class="space-y-3">
              <div>
                <label for="event-title" class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('events.createDrawer.fields.eventTitle') }} *
                </label>
                <input
                  id="event-title"
                  ref="titleInput"
                  v-model="form.title"
                  type="text"
                  required
                  :placeholder="t('events.createDrawer.fields.titlePlaceholder')"
                  class="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('events.createDrawer.fields.category') }}
                </label>
                <SelectField
                  :model-value="form.category ?? ''"
                  :options="categoryOptions"
                  allow-empty
                  :placeholder="t('events.createDrawer.fields.categoryPlaceholder')"
                  :title="t('events.createDrawer.fields.category')"
                  @update:model-value="form.category = $event"
                />
              </div>

              <!-- Auto-populate belongs to the category, so it appears under it
                   and only once one is chosen. -->
              <Transition name="drawer-reveal">
                <div v-if="hasCategory" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <div class="list-group">
                      <button
                        type="button"
                        role="switch"
                        :aria-checked="form.auto_populate"
                        class="list-row"
                        @click="form.auto_populate = !form.auto_populate"
                      >
                        <span class="list-row__text">
                          <span class="list-row__label">
                            {{ t('events.createDrawer.autoPopulate.label') }}
                          </span>
                          <span class="list-row__hint">
                            {{ t('events.createDrawer.autoPopulate.description') }}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          class="switch-track"
                          :class="form.auto_populate ? 'is-on' : ''"
                        >
                          <span class="switch-knob" />
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- When -->
            <div class="space-y-1.5">
              <div class="list-group">
                <DateTimeDisclosureRow
                  :label="t('events.createDrawer.fields.starts')"
                  :model-value="form.start_date"
                  :expanded="openDateRow === 'start'"
                  :quick-times="commonStartTimes"
                  @update:model-value="onStartDateChange"
                  @update:expanded="setDateRow('start', $event)"
                />
                <DateTimeDisclosureRow
                  v-model="form.end_date"
                  :label="t('events.createDrawer.fields.ends')"
                  :expanded="openDateRow === 'end'"
                  :min="form.start_date"
                  :error="!!dateError"
                  :quick-times="commonEndTimes"
                  @update:expanded="setDateRow('end', $event)"
                />
              </div>
              <!-- One slot, two jobs: the duration confirms the pair reads the
                   way the organizer meant, and the error replaces it when it
                   does not. Neither ever moves the rows below. -->
              <p
                class="px-1 text-xs"
                :class="dateError ? 'text-red-600' : 'text-slate-500'"
                :aria-live="dateError ? 'polite' : 'off'"
              >
                {{ dateError || durationLabel }}
              </p>
            </div>

            <!-- Who can see it -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-slate-700">
                {{ t('events.createDrawer.fields.visibility') }}
              </label>
              <SegmentedField
                :model-value="form.privacy"
                :options="privacyOptions"
                :aria-label="t('events.createDrawer.fields.visibility')"
                @update:model-value="form.privacy = $event as 'public' | 'private'"
              />
              <p class="px-1 text-xs text-slate-500 leading-relaxed">
                {{
                  isPublic
                    ? t('events.createDrawer.privacyToggle.publicDescription')
                    : t('events.createDrawer.privacyToggle.privateDescription')
                }}
              </p>
            </div>

            <!-- The description is public-facing copy, so it belongs to the
                 visibility choice that creates the audience for it — not to
                 the registration group it used to sit in. -->
            <Transition name="drawer-reveal">
              <div v-if="isPublic" class="grid grid-rows-[1fr]">
                <div class="min-h-0 overflow-hidden">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      {{ t('events.createDrawer.fields.aboutEvent') }}
                    </label>
                    <div
                      ref="descriptionEditor"
                      contenteditable="true"
                      role="textbox"
                      aria-multiline="true"
                      :aria-label="t('events.createDrawer.fields.aboutEvent')"
                      class="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white text-slate-800 leading-relaxed min-h-[8.75rem] max-h-[20rem] overflow-y-auto"
                      :data-placeholder="
                        form.description ? '' : t('events.createDrawer.fields.descriptionPlaceholder')
                      "
                      @input="handleDescriptionInput"
                      @blur="handleDescriptionBlur"
                    ></div>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Registration. One list that grows: the switch decides whether
                 the two rows under it exist at all, so they live inside the
                 same border rather than in a second group below it. -->
            <div class="list-group">
              <button
                type="button"
                role="switch"
                :aria-checked="form.registration_required"
                class="list-row"
                @click="form.registration_required = !form.registration_required"
              >
                <span class="list-row__text">
                  <span class="list-row__label">
                    {{ t('events.createDrawer.requireRegistration.label') }}
                  </span>
                  <span class="list-row__hint">
                    {{ t('events.createDrawer.requireRegistration.description') }}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  class="switch-track"
                  :class="form.registration_required ? 'is-on' : ''"
                >
                  <span class="switch-knob" />
                </span>
              </button>

              <Transition name="drawer-reveal">
                <div v-if="form.registration_required" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <DateTimeDisclosureRow
                      v-model="form.registration_deadline"
                      :label="t('events.createDrawer.fields.registrationDeadline')"
                      :expanded="openDateRow === 'deadline'"
                      :max="form.start_date"
                      clearable
                      :placeholder="t('events.createDrawer.fields.deadlinePlaceholder')"
                      @update:expanded="setDateRow('deadline', $event)"
                    />
                    <div class="list-row border-t border-slate-100">
                      <label for="max-attendees" class="list-row__label">
                        {{ t('events.createDrawer.fields.maxAttendees') }}
                      </label>
                      <input
                        id="max-attendees"
                        v-model.number="form.max_attendees"
                        type="number"
                        inputmode="numeric"
                        min="1"
                        class="list-input"
                        :placeholder="t('events.createDrawer.fields.maxAttendeesPlaceholder')"
                      />
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </form>
        </div>

        <!-- Footer with Action Buttons -->
        <div
          class="flex-shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
        >
          <div class="flex items-center justify-between">
            <!-- The three states are stacked in one grid cell, so the button's
                 width is the widest of them and never jumps as they swap. -->
            <button
              :disabled="isBusy"
              :class="['action-btn', isComplete ? 'is-complete' : '']"
              class="grid px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md"
              @click="handleSubmit"
            >
              <span class="action-face" :data-on="!isSubmitting && !isComplete">
                <Save class="w-4 h-4" />
                <span>{{ t('events.createDrawer.actions.create') }}</span>
              </span>
              <span class="action-face" :data-on="isSubmitting">
                <Loader class="w-4 h-4 animate-spin" />
                <span>{{ t('events.createDrawer.actions.creating') }}</span>
              </span>
              <span class="action-face" :data-on="isComplete" aria-live="polite">
                <Check class="w-4 h-4" />
                <span>{{ t('events.createDrawer.actions.created') }}</span>
              </span>
            </button>

            <button
              type="button"
              :disabled="isBusy"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-[background-color,transform,opacity] duration-150 ease-out active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              @click="$emit('close')"
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
import { ref, computed, reactive, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ArrowRight, Loader, Save, Check, Globe, Lock } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '@/composables/useToast'
import { useActionConfirmation } from '@/composables/useActionConfirmation'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import { useDurationLabel } from '@/composables/useDurationLabel'
import { useFocusTrap } from '@/composables/useFocusTrap'
import DateTimeDisclosureRow from '@/components/common/DateTimeDisclosureRow.vue'
import SegmentedField, { type SegmentedOption } from '@/components/common/SegmentedField.vue'
import SelectField, { type SelectFieldOption } from '@/components/common/SelectField.vue'

const { t } = useAppLanguage()
const { showError } = useToast()
const { translateEventCategory } = useCategoryTranslation()

// Common start/end times for hosted events (weddings, birthdays, housewarmings,
// etc.) so a typical slot is one tap rather than a scroll of the wheel.
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
// Held on screen after a successful create, long enough to be seen: the face
// swap alone costs ~280ms, so a shorter hold would close on a tick that never
// finished arriving.
const { confirmed: isComplete, confirm: holdConfirmation, reset: resetConfirmation } =
  useActionConfirmation(900)
const isBusy = computed(() => isSubmitting.value || isComplete.value)
const categories = ref<EventCategory[]>([])

/**
 * At most one date row shows its calendar. Two open calendars in one group is
 * two answers to a question the group asks once, and on a phone the second one
 * pushes the first off the screen it was being read on.
 */
const openDateRow = ref<'start' | 'end' | 'deadline' | null>(null)
const setDateRow = (row: 'start' | 'end' | 'deadline', open: boolean) => {
  openDateRow.value = open ? row : null
}

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

const isPublic = computed(() => form.privacy === 'public')
const hasCategory = computed(() => !!form.category && form.category !== '')

/**
 * A choice between two named things, not an on/off. As a switch this flipped
 * its own label between "Public Event" and "Private Event", so the off state
 * had no stable meaning and the only way to learn what turning it on did was
 * to turn it on.
 */
const privacyOptions = computed<SegmentedOption[]>(() => [
  { value: 'private', label: t('events.createDrawer.privacyOptions.private'), icon: Lock },
  { value: 'public', label: t('events.createDrawer.privacyOptions.public'), icon: Globe },
])

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

// How long the event runs, in the slot the error would otherwise occupy.
const durationLabel = useDurationLabel(
  () => form.start_date,
  () => form.end_date,
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
  openDateRow.value = null
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
      categoryValue =
        typeof formData.category === 'string'
          ? parseInt(formData.category, 10)
          : formData.category
    }

    // Handle registration deadline - convert to ISO or null
    let registrationDeadline: string | null = null
    if (formData.registration_required && formData.registration_deadline) {
      registrationDeadline = new Date(formData.registration_deadline).toISOString()
    }

    // Handle max attendees - keep as number or null
    const maxAttendees =
      formData.registration_required && formData.max_attendees ? formData.max_attendees : null

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

  holdConfirmation(() => emit('close'))
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Keep Tab inside the drawer — without this the user tabs straight out into the
// page behind the backdrop, which they can neither see nor click.
const { trapFocus } = useFocusTrap(panel)

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    // A disclosed calendar is the innermost thing on screen, so Escape closes
    // that first — the drawer is not what the user is looking at yet.
    if (openDateRow.value) {
      openDateRow.value = null
      return
    }
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
      resetConfirmation()
      isSubmitting.value = false

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

/**
 * The editor only exists while the event is public, so a description written
 * by the category template before that has nowhere to be painted. Without this
 * the box mounted empty over a `form.description` that was already populated —
 * and then submitted text the organizer had never seen, or silently wiped it
 * on the first keystroke.
 */
watch(isPublic, async (visible) => {
  if (!visible) return
  await nextTick()
  updateDescriptionEditor()
})

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
        (cat) => cat.id === (typeof newCategory === 'string' ? parseInt(newCategory) : newCategory),
      )

      if (selectedCategory) {
        const categoryName = selectedCategory.name.toLowerCase()
        const templates = eventDescriptionTemplates.templates as Record<
          string,
          { description: string }
        >

        // Check if there's a template for this category
        if (templates[categoryName]) {
          form.description = templates[categoryName].description
          updateDescriptionEditor()
        }
      }
    }
  },
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
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped src="./common/actionButton.css"></style>
<style scoped src="./common/groupedList.css"></style>

<style scoped>
/* The form stays visible but stops accepting edits while the create is in
   flight, so nothing the user types can be silently dropped. */
.form-busy {
  pointer-events: none;
  opacity: 0.6;
  transition: opacity 0.2s ease-out;
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
[contenteditable='true'] {
  outline: none;
  white-space: pre-wrap;
  word-wrap: break-word;
}

[contenteditable='true']:empty:before {
  content: attr(data-placeholder);
  color: #94a3b8; /* slate-400 */
  pointer-events: none;
}

/* Rich text content styling */
[contenteditable='true'] :deep(h3) {
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

[contenteditable='true'] :deep(p) {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

[contenteditable='true'] :deep(ul) {
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
  list-style-type: disc;
}

[contenteditable='true'] :deep(li) {
  margin-bottom: 0.25rem;
  line-height: 1.5;
}

[contenteditable='true'] :deep(strong) {
  font-weight: 600;
  color: #1e293b;
}

[contenteditable='true'] :deep(em) {
  font-style: italic;
  color: #64748b;
}
</style>
