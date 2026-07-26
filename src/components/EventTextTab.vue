<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
    <!-- Header (click to expand/collapse) -->
    <div class="flex items-start justify-between gap-3">
      <button
        type="button"
        class="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 rounded-lg"
        :aria-expanded="isExpanded"
        :aria-label="t('management.media.sectionToggle')"
        @click="toggleExpanded"
      >
        <h5 class="font-semibold text-slate-900">{{ t('management.eventTextTab.header.title') }}</h5>
        <p class="text-sm text-slate-600">{{ t('management.eventTextTab.header.subtitle') }}</p>
      </button>
      <button
        type="button"
        class="p-2 -mt-1 -mr-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        :aria-expanded="isExpanded"
        :aria-label="t('management.media.sectionToggle')"
        :title="t('management.media.sectionToggle')"
        @click="toggleExpanded"
      >
        <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isExpanded }" aria-hidden="true" />
      </button>
    </div>

    <Transition name="collapse">
    <div v-if="isExpanded" class="grid grid-rows-[1fr]">
    <div class="min-h-0 overflow-hidden">
    <div class="pt-6">
    <!-- Loading State -->
    <div v-if="loading" class="space-y-5" aria-hidden="true">
      <div v-for="g in 2" :key="g" class="space-y-2">
        <div class="h-3 w-24 bg-slate-200 rounded animate-pulse"></div>
        <div class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          <div v-for="r in 3" :key="r" class="p-3 sm:p-4 flex items-center gap-3">
            <div class="w-9 h-9 bg-slate-200 rounded-lg animate-pulse flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 w-32 bg-slate-200 rounded animate-pulse"></div>
              <div class="h-3 w-48 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error">
      <div class="bg-red-50 border border-red-200 rounded-2xl p-4">
        <div class="flex items-center space-x-2">
          <AlertCircle class="w-5 h-5 text-red-500" />
          <div class="flex-1">
            <p class="text-sm text-red-600 font-medium">{{ error }}</p>
            <button
              @click="fetchTexts"
              class="text-red-600 text-sm hover:text-red-700 underline mt-1"
            >
              {{ t('management.eventTextTab.error.tryAgain') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="space-y-5">
      <!-- Languages Bar -->
      <div class="flex items-center flex-wrap gap-2">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
          {{ t('management.eventTextTab.languagesBar.label') }}
        </span>
        <span
          v-for="lang in activeLanguages"
          :key="lang"
          class="inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-full"
        >
          {{ getLanguageName(lang) }}
          <button
            v-if="canRemoveLanguage(lang)"
            @click="removeLanguage(lang)"
            :aria-label="t('management.eventTextTab.languagesBar.removeAriaLabel', { language: getLanguageName(lang) })"
            class="p-1 -my-1 text-slate-400 hover:text-red-600 active:text-red-600 rounded-full transition-colors"
          >
            <X class="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <span v-else class="w-1"></span>
        </span>

        <!-- Add Language Dropdown -->
        <div v-if="languagesForAdd.length > 0" class="relative">
          <button
            @click="showLanguageMenu = !showLanguageMenu"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-full hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 transition-all"
          >
            <Plus class="w-3.5 h-3.5" aria-hidden="true" />
            {{ t('management.eventTextTab.languagesBar.add') }}
          </button>

          <div v-if="showLanguageMenu" class="fixed inset-0 z-[90]" @click="showLanguageMenu = false"></div>
          <Transition name="dropdown">
            <div
              v-if="showLanguageMenu"
              class="absolute top-full left-0 mt-2 min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-[320px] overflow-y-auto py-1"
              role="menu"
              :aria-label="t('management.eventTextTab.languagesBar.menuAriaLabel')"
            >
              <button
                v-for="lang in languagesForAdd"
                :key="lang"
                role="menuitem"
                @click="addLanguage(lang)"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200 text-left"
              >
                {{ getLanguageName(lang) }}
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Slot Groups -->
      <div v-for="group in slotGroups" :key="group.key" class="space-y-2">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {{ t(`management.eventTextTab.groups.${group.key}`) }}
        </p>
        <div class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          <button
            v-for="slot in group.slots"
            :key="slot.value"
            @click="openSlotEditor(slot.value)"
            :aria-label="t('management.eventTextTab.slot.openEditorAriaLabel', { type: getTextTypeLabel(slot.value) })"
            class="w-full flex items-center gap-3 p-3 sm:p-4 min-h-[56px] text-left hover:bg-slate-50 active:bg-slate-100 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-inset"
          >
            <!-- Icon -->
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border"
              :class="slotHasAnyContent(slot.value)
                ? 'bg-sky-50 border-sky-100'
                : 'bg-slate-50 border-slate-100'"
            >
              <component
                :is="slot.icon"
                class="w-4 h-4"
                :class="slotHasAnyContent(slot.value) ? 'text-[#1e90ff]' : 'text-slate-400'"
                aria-hidden="true"
              />
            </div>

            <!-- Name + chips + preview -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p
                  class="text-sm font-medium truncate"
                  :class="slotHasAnyContent(slot.value) ? 'text-slate-900' : 'text-slate-500'"
                >
                  {{ getTextTypeLabel(slot.value) }}
                </p>

                <!-- Language completion chips -->
                <div class="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                  <span
                    v-for="lang in activeLanguages"
                    :key="lang"
                    class="text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase"
                    :class="chipClasses(slot.value, lang)"
                    :title="chipTitle(slot.value, lang)"
                  >
                    {{ lang }}
                  </span>
                </div>
              </div>
              <p
                v-if="slotHasAnyContent(slot.value)"
                class="text-xs sm:text-sm text-slate-500 line-clamp-1 mt-0.5"
              >
                {{ getSlotPreview(slot.value) }}
              </p>
              <p v-else class="text-xs sm:text-sm text-slate-400 italic mt-0.5">
                {{ t('management.eventTextTab.slot.emptyPreview') }}
              </p>
            </div>

            <ChevronRight class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
    </div>
    </div>
    </div>
    </Transition>

    <!-- Per-slot Edit Drawer -->
    <EditEventTextDrawer
      v-model="showTextDrawer"
      :event-id="eventId"
      :text-type="activeSlot"
      :languages="activeLanguages"
      :existing-texts="allTexts"
      @saved="fetchTexts"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Plus, X, AlertCircle, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { eventTextsService, type EventText } from '../services/api'
import EditEventTextDrawer from './EditEventTextDrawer.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCollapsibleSection } from '@/composables/useCollapsibleSection'
import {
  EVENT_TEXT_SLOTS,
  EVENT_TEXT_SLOT_GROUPS,
  EVENT_TEXT_LANGUAGES,
  sortEventTextLanguages,
} from '@/utils/eventTextSlots'

interface Props {
  eventId: string
}

const props = defineProps<Props>()

const { t, locale } = useAppLanguage()
const { isExpanded, toggle: toggleExpanded } = useCollapsibleSection('texts')

// Track component mount state to prevent state updates after unmount
let isMounted = true
onUnmounted(() => {
  isMounted = false
})

// State
const loading = ref(true)
const error = ref<string | null>(null)
const allTexts = ref<EventText[]>([])
const showTextDrawer = ref(false)
const showLanguageMenu = ref(false)
const activeSlot = ref<string | null>(null)
// Languages added by the user this session that have no saved texts yet
const addedLanguages = ref<string[]>([])

// Computed: languages shown as columns — English always, plus any language
// with saved texts, plus manually added ones
const activeLanguages = computed(() => {
  const langs = new Set<string>(['en'])
  allTexts.value.forEach((text) => langs.add(text.language))
  addedLanguages.value.forEach((lang) => langs.add(lang))
  return sortEventTextLanguages([...langs])
})

const languagesForAdd = computed(() =>
  EVENT_TEXT_LANGUAGES.filter((code) => !activeLanguages.value.includes(code)),
)

// Slots organized by showcase location, keeping only non-empty groups
const slotGroups = computed(() =>
  EVENT_TEXT_SLOT_GROUPS.map((key) => ({
    key,
    slots: EVENT_TEXT_SLOTS.filter((s) => s.group === key),
  })).filter((g) => g.slots.length > 0),
)

// Helper functions
const getTextTypeLabel = (textType: string): string =>
  t(`management.eventTextTab.textTypes.${textType}`, textType)

const getLanguageName = (code: string): string =>
  t(`management.eventTextTab.languages.${code}`, code.toUpperCase())

const findText = (textType: string, lang: string): EventText | undefined =>
  allTexts.value.find((text) => text.text_type === textType && text.language === lang)

const slotHasAnyContent = (textType: string): boolean =>
  allTexts.value.some((text) => text.text_type === textType)

// Preview in the app language when available, falling back to English, then anything
const getSlotPreview = (textType: string): string => {
  const text =
    findText(textType, locale.value) ||
    findText(textType, 'en') ||
    allTexts.value.find((entry) => entry.text_type === textType)
  return text?.content || text?.title || ''
}

const chipClasses = (textType: string, lang: string): string => {
  const text = findText(textType, lang)
  if (!text) return 'bg-white text-slate-400 border-dashed border-slate-200'
  if (!text.is_active) return 'bg-amber-50 text-amber-600 border-amber-200'
  return 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

const chipTitle = (textType: string, lang: string): string => {
  const text = findText(textType, lang)
  const language = getLanguageName(lang)
  if (!text) return t('management.eventTextTab.slot.chipMissingTitle', { language })
  if (!text.is_active) return t('management.eventTextTab.slot.chipInactiveTitle', { language })
  return t('management.eventTextTab.slot.chipFilledTitle', { language })
}

const canRemoveLanguage = (lang: string): boolean =>
  lang !== 'en' && !allTexts.value.some((text) => text.language === lang)

// Methods
const fetchTexts = async () => {
  error.value = null

  try {
    const response = await eventTextsService.getEventTexts(props.eventId)

    if (!isMounted) return

    if (response.success && response.data) {
      if (response.data.results && Array.isArray(response.data.results)) {
        allTexts.value = response.data.results
      } else {
        allTexts.value = []
      }
    } else {
      error.value = response.message || t('management.eventTextTab.error.loadFailed')
    }
  } catch {
    if (!isMounted) return
    error.value = t('management.eventTextTab.error.loadNetworkError')
  } finally {
    if (isMounted) {
      loading.value = false
    }
  }
}

const addLanguage = (lang: string) => {
  if (!addedLanguages.value.includes(lang)) {
    addedLanguages.value.push(lang)
  }
  showLanguageMenu.value = false
}

const removeLanguage = (lang: string) => {
  addedLanguages.value = addedLanguages.value.filter((code) => code !== lang)
}

const openSlotEditor = (textType: string) => {
  activeSlot.value = textType
  showTextDrawer.value = true
}

// Drop session-added languages that got saved texts (they're now implicit)
watch(allTexts, (texts) => {
  addedLanguages.value = addedLanguages.value.filter(
    (lang) => !texts.some((text) => text.language === lang),
  )
})

// Lifecycle
onMounted(() => {
  fetchTexts()
})

// Expose method for parent component (Smart FAB): open the first unfilled
// slot so the FAB always lands somewhere actionable, else the first slot
defineExpose({
  openAddModal: () => {
    const firstEmpty = EVENT_TEXT_SLOTS.find((slot) => !slotHasAnyContent(slot.value))
    openSlotEditor((firstEmpty || EVENT_TEXT_SLOTS[0]).value)
  },
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Collapse/expand via grid-template-rows 0fr↔1fr — tracks real content
   height so both directions ease evenly (no max-height dead time) */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none !important;
  }
}
</style>
