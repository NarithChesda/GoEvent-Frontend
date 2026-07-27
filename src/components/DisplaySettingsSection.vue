<template>
  <!-- Showcase display settings (RSVP / Comments / Countdown) as a Showcase-tab
       accordion card. The live preview already exposes these as per-section
       chips (see showcase-preview/edit/SectionDisplayToggle.vue), but those are
       only reachable inside the Design Studio preview — and the countdown chip
       disappears once the event has started. This card is the always-findable
       home for the same three fields, and the only one non-showcase categories
       (business, music, other) get, since they render no live preview. -->
  <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
    <!-- Header (click to expand/collapse) -->
    <div class="flex items-start justify-between gap-3">
      <button
        type="button"
        class="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 rounded-lg"
        :aria-expanded="isExpanded"
        :aria-label="t('management.media.sectionToggle')"
        @click="toggle"
      >
        <h5 class="font-semibold text-slate-900">{{ t('management.displaySettings.title') }}</h5>
        <p class="text-sm text-slate-600">{{ t('management.displaySettings.description') }}</p>
      </button>
      <button
        type="button"
        class="p-2 -mt-1 -mr-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        :aria-expanded="isExpanded"
        :aria-label="t('management.media.sectionToggle')"
        :title="t('management.media.sectionToggle')"
        @click="toggle"
      >
        <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isExpanded }" aria-hidden="true" />
      </button>
    </div>

    <Transition name="collapse">
    <div v-if="isExpanded" class="grid grid-rows-[1fr]">
    <div class="min-h-0 overflow-hidden">
    <div class="space-y-3 pt-6">
      <!-- Each row saves on click — same immediate-patch behavior as the
           preview chips, so the two surfaces can't disagree about what's on. -->
      <button
        v-for="setting in SETTINGS"
        :key="setting.field"
        type="button"
        :disabled="!canEdit || saving === setting.field"
        class="w-full flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg text-left transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        role="switch"
        :aria-checked="isOn(setting.field)"
        @click="toggleField(setting.field)"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
            <component :is="setting.icon" class="w-4 h-4 text-sky-500" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-slate-700">{{ t(setting.labelKey) }}</p>
            <p class="text-xs text-slate-500">{{ t(setting.descKey) }}</p>
          </div>
        </div>
        <div
          :class="[
            'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
            isOn(setting.field) ? 'bg-sky-500' : 'bg-slate-200'
          ]"
          aria-hidden="true"
        >
          <span
            class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
            :style="{ transform: isOn(setting.field) ? 'translateX(20px)' : 'translateX(0)' }"
          />
        </div>
      </button>
    </div>
    </div>
    </div>
    </Transition>

    <!-- Toast Feedback -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-20 lg:bottom-4 right-6 z-50">
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UserCheck, MessageSquare, Timer, ChevronDown, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { eventsService, type Event } from '../services/api'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '../composables/useToast'
import { useCollapsibleSection } from '@/composables/useCollapsibleSection'

type DisplayField = 'rsvp_enabled' | 'comments_enabled' | 'countdown_enabled'

interface Props {
  eventData?: Event
  canEdit: boolean
}

interface Emits {
  updated: [event: Event]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useAppLanguage()
const { message, showSuccess, showError } = useToast()
const { isExpanded, toggle } = useCollapsibleSection('display-settings')

const SETTINGS: { field: DisplayField; icon: typeof UserCheck; labelKey: string; descKey: string }[] = [
  {
    field: 'rsvp_enabled',
    icon: UserCheck,
    labelKey: 'management.displaySettings.rsvpLabel',
    descKey: 'management.displaySettings.rsvpDesc',
  },
  {
    field: 'comments_enabled',
    icon: MessageSquare,
    labelKey: 'management.displaySettings.commentsLabel',
    descKey: 'management.displaySettings.commentsDesc',
  },
  {
    field: 'countdown_enabled',
    icon: Timer,
    labelKey: 'management.displaySettings.countdownLabel',
    descKey: 'management.displaySettings.countdownDesc',
  },
]

const saving = ref<DisplayField | null>(null)

// Absent means on — matches how the showcase itself reads these (`!== false`).
const isOn = (field: DisplayField) => props.eventData?.[field] !== false

const toggleField = async (field: DisplayField) => {
  if (!props.canEdit || !props.eventData || saving.value) return

  saving.value = field
  try {
    const response = await eventsService.patchEvent(props.eventData.id, { [field]: !isOn(field) })
    if (response.success && response.data) {
      // Parent owns the event object; the switch follows from the emitted copy.
      emit('updated', response.data)
      showSuccess(t('management.displaySettings.successMessage'))
    } else {
      showError(response.message || t('management.displaySettings.errorMessage'))
    }
  } catch {
    showError(t('management.displaySettings.networkErrorMessage'))
  } finally {
    saving.value = null
  }
}
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
