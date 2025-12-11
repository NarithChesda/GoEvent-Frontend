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
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] laptop-sm:w-[560px] laptop-md:w-[620px] desktop:w-[680px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="closeDrawer"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-semibold text-white">
                  {{ isEditMode ? 'Edit Agenda Item' : 'Add Agenda Item' }}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!-- General error banner -->
          <div
            v-if="generalError"
            class="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
          >
            <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-red-700">{{ generalError }}</p>
              <button
                type="button"
                @click="generalError = ''"
                class="text-xs text-red-600 hover:text-red-700 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="p-3 laptop-sm:p-4 space-y-4 laptop-sm:space-y-5 pb-24">
            <!-- Language Tabs Section -->
            <div>
              <LanguageTabs
                :active-tab="activeTab"
                :translations="formData.translations"
                :show-add-translation="showAddTranslation"
                :new-translation="newTranslation"
                :available-languages-for-add="availableLanguagesForAdd"
                :get-language-name="getLanguageName"
                @update:active-tab="activeTab = $event"
                @update:show-add-translation="showAddTranslation = $event"
                @update:new-translation="Object.assign(newTranslation, $event)"
                @add-translation="addTranslation"
                @remove-translation="removeTranslation"
                @focus-next-tab="focusNextTab"
                @focus-previous-tab="focusPreviousTab"
              />
            </div>

            <!-- Form Content -->
            <div class="space-y-4 laptop-sm:space-y-5">
              <!-- English Content (Default Language) -->
              <div
                v-if="activeTab === 'en'"
                role="tabpanel"
                id="tabpanel-en"
                aria-labelledby="tab-en"
                tabindex="0"
                class="space-y-4 laptop-sm:space-y-5"
              >
                <AgendaFormFields
                  v-model:title="formData.title"
                  v-model:start-time-text="formData.start_time_text"
                  v-model:end-time-text="formData.end_time_text"
                  v-model:description="formData.description"
                  v-model:speaker="formData.speaker"
                  v-model:description-open="descriptionOpen"
                  v-model:speaker-open="speakerOpen"
                  :field-errors="fieldErrors"
                />
              </div>

              <!-- Other Language Tabs Content -->
              <div
                v-for="(translation, index) in formData.translations"
                :key="translation.id || index"
                v-show="activeTab === translation.language"
                role="tabpanel"
                :id="'tabpanel-' + translation.language"
                :aria-labelledby="'tab-' + translation.language"
                tabindex="0"
                class="space-y-4 laptop-sm:space-y-5"
              >
                <AgendaFormFields
                  v-model:title="translation.title"
                  v-model:start-time-text="translation.start_time_text"
                  v-model:end-time-text="translation.end_time_text"
                  v-model:description="translation.description"
                  v-model:speaker="translation.speaker"
                  v-model:description-open="descriptionOpen"
                  v-model:speaker-open="speakerOpen"
                  :language-name="getLanguageName(translation.language)"
                />
              </div>
            </div>

            <!-- Schedule Section -->
            <ScheduleSection
              v-model:date="formData.date"
              v-model:agenda-type="formData.agenda_type"
              v-model:order="formData.order"
              :max-order="maxOrder"
            />

            <!-- Icon Selection (moved outside of Display Options for easy access) -->
            <IconSelectionDropdown
              :icon-id="formData.icon_id"
              :available-icons="availableIcons"
              :selected-icon="getSelectedIcon()"
              @select-icon="selectIcon"
            />

            <!-- Location Section -->
            <LocationSection
              v-model:location="formData.location"
              v-model:virtual-link="formData.virtual_link"
              v-model:location-open="locationOpen"
              :url-error="urlValidationError"
            />

            <!-- Display Options Section -->
            <DisplayOptionsSection
              v-model:color="formData.color"
              v-model:is-featured="formData.is_featured"
              v-model:display-open="displayOpen"
            />

            <!-- Delete Section (Mobile only, Edit mode only) -->
            <div v-if="isEditMode && item" class="sm:hidden border-t border-slate-100 pt-4">
              <button
                type="button"
                @click="handleDelete"
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-sm font-semibold rounded-lg transition-colors border border-red-200"
              >
                <Trash2 class="w-4 h-4" />
                <span>Delete Agenda Item</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              @click="handleSubmit"
              :disabled="loading || !formData.title"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader v-if="loading" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{
                loading
                  ? isEditMode
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditMode
                    ? 'Update Agenda'
                    : 'Create Agenda'
              }}</span>
            </button>

            <button
              type="button"
              @click="closeDrawer"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Success/Error Toast -->
        <Transition name="slide-up">
          <div v-if="message" class="absolute bottom-16 left-4 right-4 z-10">
            <div
              :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
              class="text-white px-3 py-2.5 rounded-lg shadow-lg flex items-center"
            >
              <CheckCircle v-if="message.type === 'success'" class="w-4 h-4 mr-2 flex-shrink-0" />
              <AlertCircle v-else class="w-4 h-4 mr-2 flex-shrink-0" />
              <span class="text-xs">{{ message.text }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, toRef } from 'vue'
import {
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader,
  Save,
  Trash2,
} from 'lucide-vue-next'
import type { EventAgendaItem, AgendaTranslation } from '@/services/api'

// Composables
import { useAgendaForm } from '@/composables/useAgendaForm'
import { useTranslations } from '@/composables/useTranslations'

// Child components
import LanguageTabs from './host/LanguageTabs.vue'
import AgendaFormFields from './agenda/AgendaFormFields.vue'
import ScheduleSection from './agenda/ScheduleSection.vue'
import LocationSection from './agenda/LocationSection.vue'
import DisplayOptionsSection from './agenda/DisplayOptionsSection.vue'
import IconSelectionDropdown from './agenda/IconSelectionDropdown.vue'

interface Props {
  modelValue: boolean
  eventId: string
  item?: EventAgendaItem
  existingAgendaItems?: EventAgendaItem[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', item: EventAgendaItem): void
  (e: 'created', item: EventAgendaItem): void
  (e: 'delete', item: EventAgendaItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Message state for toast notifications
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Use composables
const {
  formData,
  loading,
  isEditMode,
  availableIcons,
  maxOrder,
  fieldErrors,
  generalError,
  urlValidationError,
  fetchIcons,
  getSelectedIcon,
  createAgendaItem,
  updateAgendaItem,
  resetErrors,
  resetForm,
  initializeTranslationsForCreate,
} = useAgendaForm(props.eventId, props.item, props.existingAgendaItems)

const defaultTranslation: Omit<AgendaTranslation, 'id' | 'agenda' | 'created_at' | 'updated_at'> = {
  language: '',
  title: '',
  description: '',
  date_text: '',
  start_time_text: '',
  end_time_text: '',
  speaker: '',
}

const {
  activeTab,
  showAddTranslation,
  newTranslation,
  availableLanguagesForAdd,
  getLanguageName,
  addTranslation,
  removeTranslation,
  focusNextTab,
  focusPreviousTab,
} = useTranslations(toRef(formData, 'translations'), defaultTranslation)

// Local UI state
const descriptionOpen = ref(false)
const speakerOpen = ref(false)
const locationOpen = ref(false)
const displayOpen = ref(false)

// Select icon handler
const selectIcon = (iconId: number | null) => {
  formData.icon_id = iconId
}

// Show toast message
const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 4000)
}

// Close drawer
const closeDrawer = () => {
  emit('update:modelValue', false)
}

// Unified submit handler
const handleSubmit = async () => {
  const result = isEditMode.value ? await updateAgendaItem() : await createAgendaItem()

  if (result.success && result.data) {
    if (isEditMode.value) {
      emit('updated', result.data)
      showMessage('success', 'Agenda item updated successfully!')
    } else {
      emit('created', result.data)
      showMessage('success', 'Agenda item created successfully!')
    }
    setTimeout(() => {
      closeDrawer()
    }, 1000)
  } else {
    showMessage('error', result.message || 'An error occurred')
  }
}

// Handle delete (mobile only)
const handleDelete = () => {
  if (props.item) {
    emit('delete', props.item)
    closeDrawer()
  }
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for drawer open/close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      // Reset form with current item data when drawer opens
      resetForm(props.item, props.existingAgendaItems)
      // Reset UI state
      activeTab.value = 'en'
      descriptionOpen.value = false
      speakerOpen.value = false
      locationOpen.value = false
      displayOpen.value = false

      // Initialize translations for create mode
      if (!props.item) {
        initializeTranslationsForCreate()
      }

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

// Fetch icons and reset error states on mount
onMounted(() => {
  fetchIcons()
  resetErrors()
})

// Cleanup body styles if component unmounts while drawer is open
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
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

/* Custom scrollbar */
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
