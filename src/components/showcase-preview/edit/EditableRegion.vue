<template>
  <!-- Editable mode: only when the preview frame provides the intent context -->
  <div
    v-if="ctx"
    v-bind="$attrs"
    class="editable-region edit-region-control"
    role="button"
    tabindex="0"
    :title="label"
    @click.stop.prevent="request"
    @keydown.enter.stop.prevent="request"
  >
    <slot />
    <span class="editable-region__badge" aria-hidden="true">✎ {{ label }}</span>
  </div>

  <!-- Production / read-only preview: bare slot, no wrapper element at all -->
  <slot v-else />
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { EditIntentKey, type EditIntent } from './editContext'

// Attrs (layout classes etc.) apply only to the active wrapper; the inert
// branch is a bare slot, so inherited attrs would be silently dropped there
// anyway — opting out keeps Vue from warning about it.
defineOptions({ inheritAttrs: false })

interface Props {
  /** Which parent-side editor a click should open (see PreviewEditorHost). */
  intent: EditIntent
  /** Optional label override; defaults to a per-kind translated string. */
  label?: string
}

const props = defineProps<Props>()

const ctx = inject(EditIntentKey, undefined)

// Only read when ctx exists (manage-page preview frames) — the public
// showcase renders the bare slot and never shows a label.
const { t } = useAppLanguage()

const DEFAULT_LABEL_KEYS: Record<EditIntent['kind'], string> = {
  eventLogo: 'management.showcasePreview.editors.replaceLogo',
  gmapEmbed: 'management.showcasePreview.editors.editMap',
  eventDate: 'management.showcasePreview.editors.changeEventDate',
  hostImage: 'management.showcasePreview.editors.changeHostPhoto',
  photos: 'management.showcasePreview.editors.managePhotos',
  agendaItem: 'management.showcasePreview.editors.editAgendaItem',
  agendaAdd: 'management.showcasePreview.editors.addAgendaItem',
  agendaDate: 'management.showcasePreview.editors.changeAgendaDate',
  agendaReorder: 'management.showcasePreview.editors.reorderAgendaItem',
  dressCodeItem: 'management.showcasePreview.editors.editDressCode',
  dressCodeAdd: 'management.showcasePreview.editors.addDressCode',
  youtubeEmbed: 'management.showcasePreview.editors.editVideo',
  paymentItem: 'management.showcasePreview.editors.editPaymentMethod',
  paymentAdd: 'management.showcasePreview.editors.addPaymentMethod',
  featuredPhoto: 'management.showcasePreview.editors.editFeaturedPhoto',
}

const label = computed(() => props.label || t(DEFAULT_LABEL_KEYS[props.intent.kind]))

const request = () => ctx?.requestEdit(props.intent)
</script>

<style scoped>
.editable-region {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  outline: 1.5px dashed transparent;
  outline-offset: 3px;
  transition: outline-color 0.15s ease;
}

.editable-region:hover,
.editable-region:focus-visible {
  outline-color: rgba(30, 144, 255, 0.65);
}

.editable-region__badge {
  position: absolute;
  /* Overridable so wrappers can steer the badge clear of other edit chrome
     (e.g. AgendaItem's reorder arrows at the card's top-right). */
  top: var(--edit-badge-top, 0.35rem);
  right: var(--edit-badge-right, 0.35rem);
  z-index: 5;
  display: none;
  align-items: center;
  gap: 0.25em;
  padding: 0.2rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  color: #1e90ff;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 9999px;
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.18);
  pointer-events: none;
}

.editable-region:hover .editable-region__badge,
.editable-region:focus-visible .editable-region__badge {
  display: inline-flex;
}
</style>
