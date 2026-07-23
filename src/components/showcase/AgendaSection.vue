<template>
  <component
    :is="layoutComponent"
    v-bind="$props"
  />

  <!-- Add-activity affordance — only inside the editable manage-page preview
       (editIntentCtx is never provided on the public showcase). Placed after
       the layout so every category variant gets it, including when the event
       has no agenda items yet and the layout renders nothing. -->
  <div v-if="editIntentCtx" class="add-agenda-row">
    <button
      type="button"
      class="edit-region-control add-agenda-btn"
      @click.stop.prevent="editIntentCtx.requestEdit({ kind: 'agendaAdd' })"
    >
      ＋ {{ tApp('management.showcasePreview.editors.addAgendaItem') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { useAppLanguage } from '@/composables/useAppLanguage'

// Import all layout variants
import AgendaWedding from './agenda-layouts/AgendaWedding.vue'
import AgendaBirthday from './agenda-layouts/AgendaBirthday.vue'
import AgendaFuneral from './agenda-layouts/AgendaFuneral.vue'
import AgendaDefault from './agenda-layouts/AgendaDefault.vue'

interface AgendaItemIcon {
  id: number
  name: string
  svg_code: string
}

interface AgendaItemData {
  id: number
  title: string
  description?: string
  color?: string
  date?: string
  start_time_text?: string
  end_time_text?: string
  order?: number
  icon?: AgendaItemIcon
}

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  agendaItems: AgendaItemData[]
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  eventType?: string  // NEW: Event category name for auto-detection
}

const props = defineProps<Props>()

// Only provided by the editable manage-page preview frame — undefined on the
// public showcase, so the add-activity row can never leak into production.
const editIntentCtx = inject(EditIntentKey, undefined)
const { t: tApp } = useAppLanguage()

/**
 * Layout selection strategy based on event type
 * Auto-detects from eventType prop, defaulting to AgendaDefault for unknown types
 */
const layoutComponent = computed(() => {
  const eventType = props.eventType?.toLowerCase() || 'default'

  // Map event types to layout components
  const layoutMap: Record<string, typeof AgendaDefault | typeof AgendaWedding | typeof AgendaBirthday | typeof AgendaFuneral> = {
    // Wedding events - Elegant timeline layout
    'wedding': AgendaWedding,

    // Birthday events - Fun card-based layout
    'birthday': AgendaBirthday,
    'birthday party': AgendaBirthday,

    // Funeral events
    'funeral': AgendaFuneral,

    // Corporate events (use default for now, can create custom later)
    'corporate': AgendaDefault,
    'corporate event': AgendaDefault,
    'conference': AgendaDefault,
    'seminar': AgendaDefault,
    'workshop': AgendaDefault,

    // Other event types use default
    'default': AgendaDefault,
  }

  const selectedLayout = layoutMap[eventType] || AgendaDefault

  // Return specific layout or default fallback
  return selectedLayout
})
</script>

<style scoped>
/* Manage-page preview edit chrome only — production renders none of this */
.add-agenda-row {
  display: flex;
  justify-content: center;
  margin: 0.25rem 0 1rem;
}

.add-agenda-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25em;
  width: 100%;
  max-width: 20rem;
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  color: #1e90ff;
  background: rgba(255, 255, 255, 0.85);
  border: 1.5px dashed rgba(30, 144, 255, 0.5);
  border-radius: 9999px;
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.12);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.add-agenda-btn:hover {
  border-color: rgba(30, 144, 255, 0.9);
  background: rgba(30, 144, 255, 0.08);
}
</style>
