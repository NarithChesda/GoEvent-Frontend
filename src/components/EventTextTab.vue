<template>
  <ShowcaseSectionRow
    :icon="Type"
    :title="t('management.eventTextTab.header.title')"
    :summary="summary"
    :filled="allTexts.length > 0"
    :expanded="isExpanded"
    @toggle="toggleExpanded"
  >
    <!-- Which languages this event is written in is a property of the whole
         section, so it belongs beside the section's name — not as a row of
         chrome above the list it governs. One control, one question: it lists
         every language and the checked ones are the active ones, so adding and
         removing are the same gesture instead of a pill row plus a separate
         "Add" menu. -->
    <template v-if="isExpanded && !loading && !error" #actions>
      <button
        ref="langTriggerEl"
        type="button"
        class="inline-flex items-center gap-1 pl-2 pr-1.5 py-1 rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 active:scale-[0.97] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        :aria-expanded="showLanguageMenu"
        aria-haspopup="menu"
        :title="t('management.eventTextTab.languagesBar.label')"
        @click="showLanguageMenu = !showLanguageMenu"
      >
        <Languages class="w-3 h-3 text-slate-400" aria-hidden="true" />
        <span class="uppercase tracking-wide">{{ languageTriggerLabel }}</span>
        <ChevronDown
          class="w-3 h-3 text-slate-400 transition-transform duration-200"
          :class="{ 'rotate-180': showLanguageMenu }"
          aria-hidden="true"
        />
      </button>

      <AnchoredMenu
        :open="showLanguageMenu"
        :anchor="langTriggerEl"
        align="end"
        :min-width="216"
        :aria-label="t('management.eventTextTab.languagesBar.menuAriaLabel')"
        @close="showLanguageMenu = false"
      >
        <p class="px-2.5 pt-1.5 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {{ t('management.eventTextTab.languagesBar.label') }}
        </p>
        <button
          v-for="lang in allLanguageOptions"
          :key="lang.code"
          type="button"
          role="menuitemcheckbox"
          :aria-checked="lang.active"
          :disabled="lang.locked"
          :title="lang.locked ? t('management.eventTextTab.languagesBar.lockedHint') : undefined"
          class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-[13px] font-medium transition-colors duration-150 disabled:cursor-default"
          :class="lang.active ? 'text-slate-900 hover:bg-slate-50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'"
          @click="toggleLanguage(lang)"
        >
          <span
            class="w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-colors duration-150"
            :class="lang.active
              ? (lang.locked ? 'bg-slate-300 border-slate-300' : 'bg-[#1e90ff] border-[#1e90ff]')
              : 'bg-white border-slate-300'"
          >
            <Check v-if="lang.active" class="w-3 h-3 text-white" aria-hidden="true" />
          </span>
          <span class="flex-1 truncate">{{ getLanguageName(lang.code) }}</span>
          <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{{ lang.code }}</span>
        </button>
      </AnchoredMenu>
    </template>

    <div>
    <!-- Loading State -->
    <div v-if="loading" class="space-y-5" aria-hidden="true">
      <div v-for="g in 2" :key="g" class="space-y-2">
        <div class="h-3 w-24 bg-slate-200 rounded animate-pulse"></div>
        <div class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          <div v-for="r in 3" :key="r" class="p-3 sm:p-4 flex items-center gap-3">
            <div class="w-8 h-8 bg-slate-200 rounded-lg animate-pulse flex-shrink-0"></div>
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
    <div v-else class="space-y-4">
      <!-- Slot Groups -->
      <div v-for="group in slotGroups" :key="group.key" class="space-y-2">
        <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {{ t(`management.eventTextTab.groups.${group.key}`) }}
        </p>
        <div class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          <button
            v-for="slot in group.slots"
            :key="slot.value"
            @click="openSlotEditor(slot.value)"
            :aria-label="t('management.eventTextTab.slot.openEditorAriaLabel', { type: getTextTypeLabel(slot.value) })"
            class="w-full flex items-center gap-2.5 p-2.5 sm:p-3 min-h-[46px] text-left hover:bg-slate-50 active:bg-slate-100 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-inset"
          >
            <!-- Icon -->
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border"
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
  </ShowcaseSectionRow>

  <!-- Per-slot Edit Drawer -->
    <EditEventTextDrawer
      v-model="showTextDrawer"
      :event-id="eventId"
      :text-type="activeSlot"
      :languages="activeLanguages"
      :existing-texts="allTexts"
      @saved="fetchTexts"
    />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { AlertCircle, Check, ChevronDown, ChevronRight, Languages, Type } from 'lucide-vue-next'
import ShowcaseSectionRow from './ShowcaseSectionRow.vue'
import AnchoredMenu from './common/AnchoredMenu.vue'
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
const langTriggerEl = ref<HTMLElement | null>(null)
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

/**
 * Every language, each carrying whether it is on and whether it may be turned
 * off. English and any language that already has saved texts are locked on —
 * unchecking those would mean deleting content, which is the drawer's job, not
 * this menu's. They still render checked (and greyed) rather than being hidden,
 * so the menu is a truthful picture of what the event is written in.
 */
const languageTriggerLabel = computed(() => {
  const codes = activeLanguages.value
  return codes.length <= 3 ? codes.join(' · ') : `${codes.slice(0, 2).join(' · ')} +${codes.length - 2}`
})

const allLanguageOptions = computed(() =>
  EVENT_TEXT_LANGUAGES.map((code) => {
    const active = activeLanguages.value.includes(code)
    return { code, active, locked: active && !canRemoveLanguage(code) }
  }),
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

// Counts rows, not slots: a slot written in three languages is three texts,
// which is what the list below shows and what the work actually was.
const summary = computed(() =>
  allTexts.value.length
    ? t('management.media.sectionSummary.texts', { count: allTexts.value.length }, allTexts.value.length)
    : t('management.media.sectionSummary.notSet'),
)

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

// Adding and removing are one gesture now. The menu stays open: picking
// languages is usually picking several, and closing after each would make the
// second one cost a second trip.
const toggleLanguage = (lang: { code: string; active: boolean; locked: boolean }) => {
  if (lang.locked) return
  if (lang.active) {
    addedLanguages.value = addedLanguages.value.filter((code) => code !== lang.code)
  } else if (!addedLanguages.value.includes(lang.code)) {
    addedLanguages.value.push(lang.code)
  }
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
</style>
