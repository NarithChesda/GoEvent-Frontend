<template>
  <!-- Manage-page preview only: a small labeled on/off chip pinned to a
       section's top-right corner, letting the organizer flip a display
       setting (RSVP / Comments / Countdown) without leaving the live
       preview. The label is always visible — no hover/long-press needed to
       discover what it does. Renders nothing when no edit-intent context
       exists (public showcase). The section itself always renders its
       normal content in preview regardless of on/off — only this chip
       reflects the real state. -->
  <button
    v-if="ctx"
    type="button"
    class="edit-region-control section-display-toggle"
    :class="{ 'is-off': !active }"
    role="switch"
    :aria-checked="active"
    :aria-label="hintText"
    @click.stop.prevent="ctx.requestEdit({ kind: 'displayToggle', field })"
  >
    <span class="section-display-toggle__label">{{ label }}</span>
    <span class="section-display-toggle__switch">
      <span class="section-display-toggle__thumb" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { EditIntentKey } from './editContext'

interface Props {
  field: 'rsvp_enabled' | 'comments_enabled' | 'countdown_enabled'
  active: boolean
  /** Display name of the section, e.g. "RSVP" — shown next to the switch. */
  label: string
}

const props = defineProps<Props>()

const ctx = inject(EditIntentKey, undefined)
const { t } = useAppLanguage()

// Fuller state description for assistive tech — the visible chip only shows
// the short label, since the switch position/color already conveys on/off.
const hintText = computed(() =>
  props.active
    ? t('management.showcasePreview.editors.displayToggleOnHint', { name: props.label })
    : t('management.showcasePreview.editors.displayToggleOffHint', { name: props.label }),
)
</script>

<style scoped>
.section-display-toggle {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem 0.25rem 0.625rem;
  border: none;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.18);
  cursor: pointer;
  transition: background 0.15s ease;
  /* Guaranteed clickable even if a future ancestor sets pointer-events: none
     for some other reason — this control must always stay reachable. */
  pointer-events: auto;
}

.section-display-toggle__label {
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1;
  color: rgb(15 23 42);
  white-space: nowrap;
}

.section-display-toggle.is-off .section-display-toggle__label {
  color: rgb(100 116 139);
}

.section-display-toggle__switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 1.75rem;
  height: 1rem;
  padding: 2px;
  flex-shrink: 0;
  border-radius: 9999px;
  background: #1e90ff;
  transition: background 0.15s ease;
}

.section-display-toggle.is-off .section-display-toggle__switch {
  background: rgba(148, 163, 184, 0.9);
}

.section-display-toggle__thumb {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
  background: white;
  transform: translateX(0.75rem);
  transition: transform 0.15s ease;
}

.section-display-toggle.is-off .section-display-toggle__thumb {
  transform: translateX(0);
}
</style>
