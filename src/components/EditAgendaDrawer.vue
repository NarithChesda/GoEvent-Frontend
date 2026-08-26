<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="drawer-backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="drawer-panel">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[32.5rem] laptop-sm:w-[35rem] laptop-md:w-[38.75rem] desktop:w-[42.5rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center justify-between px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2 min-w-0">
              <button
                @click="closeDrawer"
                class="p-1.5 hover:bg-white/20 rounded-lg drawer-close flex-shrink-0"
                :title="t('management.agendaDrawer.close')"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <h2 class="text-base font-semibold text-white truncate">
                {{ isEditMode ? t('management.agendaDrawer.titleEdit') : t('management.agendaDrawer.titleAdd') }}
              </h2>
            </div>
            <!-- Right: Delete (edit mode only) -->
            <button
              v-if="isEditMode && item"
              type="button"
              @click="handleDelete"
              :title="t('management.agendaDrawer.deleteBtn')"
              :aria-label="t('management.agendaDrawer.deleteBtn')"
              class="p-1.5 hover:bg-white/20 rounded-lg drawer-close flex-shrink-0"
            >
              <Trash2 class="w-5 h-5 text-white" aria-hidden="true" />
            </button>
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
                {{ t('management.agendaDrawer.dismiss') }}
              </button>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="p-3 laptop-sm:p-4 space-y-4 laptop-sm:space-y-5 pb-24">
            <!-- One seamless editor card per language (EditEventTextDrawer pattern) -->
            <div class="space-y-4">
              <div
                v-for="entry in languageEntries"
                :key="entry.lang"
                class="rounded-xl border border-slate-200 bg-white transition-all focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100"
              >
                <!-- Card header: language + compact actions -->
                <div class="flex items-center justify-between gap-2 pl-4 pr-2 pt-2.5">
                  <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {{ languageLabel(entry.lang) }}
                  </span>
                  <div class="flex items-center gap-0.5">
                    <button
                      v-if="!entry.isBase && canCopyFromEnglish"
                      type="button"
                      @click="copyFromEnglish(entry.model)"
                      class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors"
                    >
                      <Copy class="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{{ t('management.agendaDrawer.languages.copyFromEnglish') }}</span>
                    </button>
                    <button
                      v-if="!entry.isBase"
                      type="button"
                      @click="removeTranslation(entry.index)"
                      :aria-label="t('management.agendaDrawer.languages.removeAria', { language: languageLabel(entry.lang) })"
                      class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 class="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <!-- Seamless fields: the card is the input -->
                <div class="px-4 pb-2 pt-1 divide-y divide-slate-100">
                  <div class="py-1">
                    <input
                      v-model="entry.model.title"
                      type="text"
                      class="w-full p-0 py-1 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent border-0 focus:outline-none focus:ring-0"
                      :placeholder="entry.isBase
                        ? t('management.agendaDrawer.fields.titlePlaceholder')
                        : t('management.agendaDrawer.fields.titlePlaceholderLang', { lang: languageLabel(entry.lang) })"
                      :aria-label="t('management.agendaDrawer.fields.title')"
                    />
                    <p v-if="entry.isBase && fieldErrors?.title" class="text-xs text-red-600 pb-1">
                      {{ fieldErrors.title }}
                    </p>
                  </div>

                  <div class="py-1.5 flex items-center gap-2">
                    <Clock class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                    <input
                      v-model="entry.model.start_time_text"
                      type="text"
                      class="w-28 p-0 py-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0"
                      :placeholder="entry.isBase
                        ? t('management.agendaDrawer.fields.startTimePlaceholder')
                        : t('management.agendaDrawer.fields.startTimePlaceholderLang', { lang: languageLabel(entry.lang) })"
                      :aria-label="t('management.agendaDrawer.fields.startTime')"
                    />
                    <span class="text-slate-300 flex-shrink-0" aria-hidden="true">–</span>
                    <input
                      v-model="entry.model.end_time_text"
                      type="text"
                      class="flex-1 min-w-0 p-0 py-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0"
                      :placeholder="entry.isBase
                        ? t('management.agendaDrawer.fields.endTimePlaceholder')
                        : t('management.agendaDrawer.fields.endTimePlaceholderLang', { lang: languageLabel(entry.lang) })"
                      :aria-label="t('management.agendaDrawer.fields.endTime')"
                    />
                  </div>

                  <div class="py-1">
                    <textarea
                      v-model="entry.model.description"
                      rows="2"
                      class="w-full p-0 py-1 text-sm text-slate-700 leading-relaxed placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none min-h-[48px] [field-sizing:content]"
                      :placeholder="entry.isBase
                        ? t('management.agendaDrawer.fields.descriptionPlaceholder')
                        : t('management.agendaDrawer.fields.descriptionPlaceholderLang', { lang: languageLabel(entry.lang) })"
                      :aria-label="t('management.agendaDrawer.fields.description')"
                    ></textarea>
                  </div>

                  <div class="py-1.5 flex items-center gap-2">
                    <User class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                    <input
                      v-model="entry.model.speaker"
                      type="text"
                      class="flex-1 min-w-0 p-0 py-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0"
                      :placeholder="entry.isBase
                        ? t('management.agendaDrawer.fields.speakerPlaceholder')
                        : t('management.agendaDrawer.fields.speakerPlaceholderLang', { lang: languageLabel(entry.lang) })"
                      :aria-label="t('management.agendaDrawer.fields.speakers')"
                    />
                  </div>
                </div>
              </div>

              <!-- Add Language -->
              <div v-if="availableLanguagesForAdd.length > 0" class="relative">
                <button
                  type="button"
                  @click="showLanguageMenu = !showLanguageMenu"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-full hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 transition-all"
                >
                  <Plus class="w-3.5 h-3.5" aria-hidden="true" />
                  {{ t('management.agendaDrawer.languages.add') }}
                </button>

                <div v-if="showLanguageMenu" class="fixed inset-0 z-[90]" @click="showLanguageMenu = false"></div>
                <Transition name="dropdown">
                  <div
                    v-if="showLanguageMenu"
                    class="absolute top-full left-0 mt-2 min-w-[12.5rem] bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-[17.5rem] overflow-y-auto py-1"
                    role="menu"
                    :aria-label="t('management.agendaDrawer.languages.menuAria')"
                  >
                    <button
                      v-for="lang in availableLanguagesForAdd"
                      :key="lang.code"
                      type="button"
                      role="menuitem"
                      @click="addLanguage(lang.code)"
                      class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200 text-left"
                    >
                      {{ languageLabel(lang.code) }}
                    </button>
                  </div>
                </Transition>
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

          </form>
        </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <div class="flex items-center justify-between">
            <button
              @click="handleSubmit"
              :disabled="loading || !formData.title"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 drawer-action shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader v-if="loading" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{
                loading
                  ? isEditMode
                    ? t('management.agendaDrawer.updating')
                    : t('management.agendaDrawer.creating')
                  : isEditMode
                    ? t('management.agendaDrawer.updateBtn')
                    : t('management.agendaDrawer.createBtn')
              }}</span>
            </button>

            <button
              type="button"
              @click="closeDrawer"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
            >
              {{ t('common.actions.cancel') }}
            </button>
          </div>
        </div>

        <!-- Success/Error Toast -->
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, toRef } from 'vue'
import {
  ArrowRight,
  AlertCircle,
  Loader,
  Save,
  Trash2,
  Copy,
  Plus,
  Clock,
  User,
} from 'lucide-vue-next'
import type { EventAgendaItem, AgendaTranslation } from '@/services/api'

// Composables
import { useAgendaForm } from '@/composables/useAgendaForm'
import { useTranslations } from '@/composables/useTranslations'
import { useAppLanguage } from '@/composables/useAppLanguage'

// Child components
import ScheduleSection from './agenda/ScheduleSection.vue'
import LocationSection from './agenda/LocationSection.vue'
import DisplayOptionsSection from './agenda/DisplayOptionsSection.vue'
import IconSelectionDropdown from './agenda/IconSelectionDropdown.vue'
import { useToast } from '@/composables/useToast'

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
const { t } = useAppLanguage()

// Message state for toast notifications

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
  availableLanguagesForAdd,
  getLanguageName,
  removeTranslation,
} = useTranslations(toRef(formData, 'translations'), defaultTranslation)

// Local UI state
const locationOpen = ref(false)
const displayOpen = ref(false)
const showLanguageMenu = ref(false)

// --- Per-language editor cards (EditEventTextDrawer pattern) ---

// The translatable text fields shared by the base item and its translations
interface AgendaTextFields {
  title: string
  description: string
  speaker: string
  start_time_text: string
  end_time_text: string
}

// English (base fields) first, then one card per translation
const languageEntries = computed(() => [
  { lang: 'en', model: formData as AgendaTextFields, isBase: true, index: -1 },
  ...formData.translations.map((translation, index) => ({
    lang: translation.language,
    model: translation as AgendaTextFields,
    isBase: false,
    index,
  })),
])

// Prefer the showcase-texts localized language names, falling back to the
// composable's English names for languages without a locale entry
const languageLabel = (code: string): string =>
  t(`management.eventTextTab.languages.${code}`, getLanguageName(code))

const addLanguage = (code: string) => {
  if (!formData.translations.some((translation) => translation.language === code)) {
    formData.translations.push({ ...defaultTranslation, language: code })
  }
  showLanguageMenu.value = false
}

const canCopyFromEnglish = computed(
  () =>
    !!(
      formData.title ||
      formData.description ||
      formData.speaker ||
      formData.start_time_text ||
      formData.end_time_text
    ),
)

const copyFromEnglish = (model: AgendaTextFields) => {
  model.title = formData.title
  model.description = formData.description
  model.speaker = formData.speaker
  model.start_time_text = formData.start_time_text
  model.end_time_text = formData.end_time_text
}

// Select icon handler
const selectIcon = (iconId: number | null) => {
  formData.icon_id = iconId
}

// Show toast message
const { showToast } = useToast()

const showMessage = (type: 'success' | 'error', text: string) => {
  showToast(type, text)
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
      showMessage('success', t('management.agendaDrawer.toast.updateSuccess'))
    } else {
      emit('created', result.data)
      showMessage('success', t('management.agendaDrawer.toast.createSuccess'))
    }
    setTimeout(() => {
      closeDrawer()
    }, 1000)
  } else {
    showMessage('error', result.message || t('management.agendaDrawer.toast.error'))
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

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return
  if (showLanguageMenu.value) {
    showLanguageMenu.value = false
    return
  }
  closeDrawer()
}

// Watch for drawer open/close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      // Reset form with current item data when drawer opens
      resetForm(props.item, props.existingAgendaItems)
      // Reset UI state
      locationOpen.value = false
      displayOpen.value = false
      showLanguageMenu.value = false

      // Initialize translations for create mode
      if (!props.item) {
        initializeTranslationsForCreate()
      }

      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.removeEventListener('keydown', handleKeydown)
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
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>

/* Dropdown transition for the add-language menu */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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
}</style>
