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
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[32.5rem] lg:w-[35rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <div class="flex items-center gap-2 min-w-0">
              <button
                @click="closeDrawer"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                :title="t('management.editEventTextDrawer.header.closeTitle')"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <div class="flex items-center gap-2 min-w-0">
                <component
                  v-if="slot"
                  :is="slot.icon"
                  class="w-4 h-4 text-white flex-shrink-0"
                  aria-hidden="true"
                />
                <h2 class="text-base font-semibold text-white truncate">
                  {{ slotLabel }}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <div class="p-4 space-y-4 pb-24">
            <!-- Where this text appears -->
            <div class="flex items-start gap-2 p-3 bg-sky-50 border border-sky-100 rounded-xl">
              <Info class="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p class="text-sm text-slate-600">{{ slotHint }}</p>
            </div>

            <!-- One seamless editor card per language -->
            <div
              v-for="lang in languages"
              :key="lang"
              class="rounded-xl border border-slate-200 bg-white transition-all focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100"
            >
              <!-- Card header: language + compact actions -->
              <div class="flex items-center justify-between gap-2 pl-4 pr-2 pt-2.5">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {{ getLanguageName(lang) }}
                  </span>
                  <span
                    v-if="entryFor(lang).id && !entryFor(lang).is_active && !isCleared(lang)"
                    class="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200"
                  >
                    {{ t('management.editEventTextDrawer.perLanguage.hiddenBadge') }}
                  </span>
                </div>
                <div class="flex items-center gap-0.5">
                  <button
                    v-if="lang !== 'en' && canCopyFromEnglish(lang)"
                    type="button"
                    @click="copyFromEnglish(lang)"
                    class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors"
                  >
                    <Copy class="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{{ t('management.editEventTextDrawer.perLanguage.copyFromEnglish') }}</span>
                  </button>
                  <button
                    v-if="entryFor(lang).id && !isCleared(lang)"
                    type="button"
                    role="switch"
                    :aria-checked="entryFor(lang).is_active"
                    @click="entryFor(lang).is_active = !entryFor(lang).is_active"
                    :title="t('management.editEventTextDrawer.perLanguage.visibleLabel')"
                    :aria-label="t('management.editEventTextDrawer.perLanguage.visibleLabel')"
                    class="p-1.5 rounded-lg transition-colors"
                    :class="entryFor(lang).is_active
                      ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      : 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'"
                  >
                    <Eye v-if="entryFor(lang).is_active" class="w-4 h-4" aria-hidden="true" />
                    <EyeOff v-else class="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    v-if="entryFor(lang).id && !isCleared(lang)"
                    type="button"
                    @click="clearEntry(lang)"
                    :aria-label="t('management.editEventTextDrawer.perLanguage.clearAriaLabel', { language: getLanguageName(lang) })"
                    class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 class="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <!-- Pending-removal notice -->
              <div v-if="isCleared(lang)" class="px-4 pb-3 pt-1.5">
                <div class="flex items-center justify-between gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p class="text-sm text-red-700">
                    {{ t('management.editEventTextDrawer.perLanguage.willBeRemoved') }}
                  </p>
                  <button
                    type="button"
                    @click="undoClear(lang)"
                    class="text-sm font-medium text-red-700 hover:text-red-800 underline flex-shrink-0"
                  >
                    {{ t('management.editEventTextDrawer.perLanguage.undo') }}
                  </button>
                </div>
              </div>

              <!-- Seamless fields: no inner borders, the card is the input -->
              <div
                v-else
                class="px-4 pb-2 pt-1 transition-opacity"
                :class="{ 'opacity-60': entryFor(lang).id && !entryFor(lang).is_active }"
              >
                <input
                  v-if="slot?.hasTitle"
                  :id="`text-title-${lang}`"
                  v-model="entryFor(lang).title"
                  type="text"
                  class="w-full p-0 py-1 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent border-0 focus:outline-none focus:ring-0"
                  :placeholder="t('management.editEventTextDrawer.fields.titlePlaceholder')"
                  :aria-label="t('management.editEventTextDrawer.fields.titlePlaceholder')"
                />
                <textarea
                  :id="`text-content-${lang}`"
                  v-model="entryFor(lang).content"
                  rows="3"
                  class="w-full p-0 py-1 text-sm text-slate-700 leading-relaxed placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none min-h-[72px] [field-sizing:content]"
                  :placeholder="t('management.editEventTextDrawer.fields.contentPlaceholder', { language: getLanguageName(lang) })"
                  :aria-label="t('management.editEventTextDrawer.fields.contentPlaceholder', { language: getLanguageName(lang) })"
                ></textarea>
                <div class="flex justify-end">
                  <span v-if="entryFor(lang).content" class="text-[11px] text-slate-400">
                    {{ t('management.editEventTextDrawer.fields.characters', { count: entryFor(lang).content.length }) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <div class="flex items-center justify-between">
            <button
              @click="saveChanges"
              :disabled="loading || !hasChanges"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader v-if="loading" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{ loading ? t('management.editEventTextDrawer.footer.saving') : t('management.editEventTextDrawer.footer.saveChanges') }}</span>
            </button>

            <button
              type="button"
              @click="closeDrawer"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
            >
              {{ t('management.editEventTextDrawer.footer.cancel') }}
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
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import {
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader,
  Save,
  Copy,
  Eye,
  EyeOff,
  Info,
  Trash2,
} from 'lucide-vue-next'
import { eventTextsService, type EventText, type ApiResponse } from '@/services/api'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { EVENT_TEXT_SLOTS } from '@/utils/eventTextSlots'

const { t } = useAppLanguage()

interface Props {
  modelValue: boolean
  eventId: string
  /** The text slot being edited (e.g. 'welcome_message') */
  textType: string | null
  /** Languages to offer fields for */
  languages: string[]
  existingTexts: EventText[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Per-language form entry for the active slot
interface TextEntry {
  id?: number
  title: string
  content: string
  is_active: boolean
  originalTitle: string
  originalContent: string
  originalActive: boolean
}

// State
const loading = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const entries = reactive<Record<string, TextEntry>>({})

// Computed
const slot = computed(() => EVENT_TEXT_SLOTS.find((s) => s.value === props.textType) || null)

const slotLabel = computed(() =>
  props.textType ? t(`management.eventTextTab.textTypes.${props.textType}`, props.textType) : '',
)

const slotHint = computed(() =>
  props.textType ? t(`management.eventTextTab.typeHints.${props.textType}`, '') : '',
)

const hasChanges = computed(() =>
  Object.values(entries).some(
    (entry) =>
      entry.title !== entry.originalTitle ||
      entry.content !== entry.originalContent ||
      entry.is_active !== entry.originalActive,
  ),
)

// Helpers
const getLanguageName = (code: string): string =>
  t(`management.eventTextTab.languages.${code}`, code.toUpperCase())

const entryFor = (lang: string): TextEntry => {
  if (!entries[lang]) {
    entries[lang] = {
      title: '',
      content: '',
      is_active: true,
      originalTitle: '',
      originalContent: '',
      originalActive: true,
    }
  }
  return entries[lang]
}

// An existing record with both fields emptied is deleted on save
const isCleared = (lang: string): boolean => {
  const entry = entries[lang]
  return !!(
    entry?.id &&
    !entry.title &&
    !entry.content &&
    (entry.originalTitle || entry.originalContent)
  )
}

const clearEntry = (lang: string) => {
  const entry = entryFor(lang)
  entry.title = ''
  entry.content = ''
}

const undoClear = (lang: string) => {
  const entry = entryFor(lang)
  entry.title = entry.originalTitle
  entry.content = entry.originalContent
}

const canCopyFromEnglish = (lang: string): boolean => {
  const en = entries['en']
  return !!(en && (en.title || en.content)) && !isCleared(lang)
}

const copyFromEnglish = (lang: string) => {
  const en = entries['en']
  if (!en) return
  const entry = entryFor(lang)
  entry.title = en.title
  entry.content = en.content
}

// Initialize form entries for the active slot from existing texts
const initializeEntries = () => {
  Object.keys(entries).forEach((key) => delete entries[key])

  props.languages.forEach((lang) => {
    const existing = props.existingTexts.find(
      (text) => text.text_type === props.textType && text.language === lang,
    )
    entries[lang] = {
      id: existing?.id,
      title: existing?.title || '',
      content: existing?.content || '',
      is_active: existing ? existing.is_active : true,
      originalTitle: existing?.title || '',
      originalContent: existing?.content || '',
      originalActive: existing ? existing.is_active : true,
    }
  })
}

// Show toast message
let messageTimer: ReturnType<typeof setTimeout> | undefined
const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = null
  }, 4000)
}

const closeDrawer = () => {
  emit('update:modelValue', false)
}

// Save changes for this slot only
const saveChanges = async () => {
  if (!props.textType) return

  loading.value = true

  try {
    const operations: Promise<ApiResponse<unknown>>[] = []

    for (const [lang, entry] of Object.entries(entries)) {
      const changed =
        entry.title !== entry.originalTitle ||
        entry.content !== entry.originalContent ||
        entry.is_active !== entry.originalActive

      if (!changed) continue

      if (entry.id) {
        if (!entry.title && !entry.content) {
          operations.push(eventTextsService.deleteEventText(props.eventId, entry.id))
        } else {
          const patchData: Record<string, string | boolean> = {}
          if (entry.title !== entry.originalTitle) patchData.title = entry.title
          if (entry.content !== entry.originalContent) patchData.content = entry.content
          if (entry.is_active !== entry.originalActive) patchData.is_active = entry.is_active
          operations.push(eventTextsService.patchEventText(props.eventId, entry.id, patchData))
        }
      } else if (entry.content) {
        operations.push(
          eventTextsService.createEventText(props.eventId, {
            text_type: props.textType,
            language: lang,
            title: entry.title,
            content: entry.content,
            is_active: true,
          }),
        )
      }
    }

    if (operations.length === 0) {
      showMessage('success', t('management.editEventTextDrawer.messages.noChanges'))
      return
    }

    const results = await Promise.all(operations)
    const failures = results.filter((r) => !r.success)

    if (failures.length > 0) {
      showMessage(
        'error',
        t('management.editEventTextDrawer.messages.operationsFailed', { count: failures.length }),
      )
    } else {
      showMessage('success', t('management.editEventTextDrawer.messages.savedSuccess'))
      emit('saved')
      setTimeout(() => {
        closeDrawer()
      }, 800)
    }
  } catch (error) {
    console.error('Error saving texts:', error)
    showMessage('error', t('management.editEventTextDrawer.messages.networkError'))
  } finally {
    loading.value = false
  }
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeDrawer()
}

// Watch for drawer open/close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      initializeEntries()
      message.value = null

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

onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.removeEventListener('keydown', handleKeydown)
  clearTimeout(messageTimer)
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
