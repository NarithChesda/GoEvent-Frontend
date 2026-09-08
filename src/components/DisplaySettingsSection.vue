<template>
  <!-- Showcase display settings (RSVP / Comments / Countdown) as a Showcase-tab
       accordion card. The live preview already exposes these as per-section
       chips (see showcase-preview/edit/SectionDisplayToggle.vue), but those are
       only reachable inside the Design Studio preview — and the countdown chip
       disappears once the event has started. This card is the always-findable
       home for the same three fields, and the only one non-showcase categories
       (business, music, other) get, since they render no live preview. -->
  <ShowcaseSectionRow
    :icon="SlidersHorizontal"
    :title="t('management.displaySettings.title')"
    :summary="summary"
    filled
    :expanded="isExpanded"
    @toggle="toggle"
  >
    <div class="space-y-2">
      <!-- Each row saves on click — same immediate-patch behavior as the
           preview chips, so the two surfaces can't disagree about what's on. -->
      <button
        v-for="setting in SETTINGS"
        :key="setting.field"
        type="button"
        :disabled="!canEdit || saving === setting.field"
        class="w-full flex items-center justify-between gap-3 p-2.5 bg-white border border-slate-200 rounded-xl text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        role="switch"
        :aria-checked="isOn(setting.field)"
        @click="toggleField(setting.field)"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <component :is="setting.icon" class="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div class="min-w-0">
            <p class="text-[13px] font-medium text-slate-700 leading-snug">{{ t(setting.labelKey) }}</p>
            <p class="text-[11px] text-slate-500 leading-snug">{{ t(setting.descKey) }}</p>
          </div>
        </div>
        <div
          :class="[
            'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
            isOn(setting.field) ? 'bg-sky-500' : 'bg-slate-200'
          ]"
          aria-hidden="true"
        >
          <span
            class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
            :style="{ transform: isOn(setting.field) ? 'translateX(16px)' : 'translateX(0)' }"
          />
        </div>
      </button>
    </div>
  </ShowcaseSectionRow>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { UserCheck, MessageSquare, Timer, SlidersHorizontal } from 'lucide-vue-next'
import ShowcaseSectionRow from './ShowcaseSectionRow.vue'
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
const { showSuccess, showError } = useToast()
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

// "3 shown" reads the same way the showcase does — absent means on, so a fresh
// event honestly reports all three rather than none.
// Absent means on — matches how the showcase itself reads these (`!== false`).
const isOn = (field: DisplayField) => props.eventData?.[field] !== false

// "3 shown", so a fresh event reports what the showcase will actually render
// rather than nothing.
const summary = computed(() =>
  t('management.media.sectionSummary.shown', {
    count: SETTINGS.filter((entry) => isOn(entry.field)).length,
  }),
)

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

