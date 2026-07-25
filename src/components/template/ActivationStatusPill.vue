<template>
  <div class="activation-pill" :class="`activation-pill--${state}`">
    <!-- Status half: what guests can (or can't) see right now. -->
    <span class="activation-pill__status">
      <span v-if="state === 'active'" class="activation-pill__live-dot" aria-hidden="true" />
      <component v-else :is="stateIcon" class="w-3.5 h-3.5 flex-shrink-0" />
      <span class="activation-pill__label">{{ t(`management.activation.pill.${state}`) }}</span>
    </span>

    <!-- Action half: only where there's something to do about it. -->
    <button
      v-if="state === 'unpaid' && canEdit"
      type="button"
      class="activation-pill__cta"
      @click="emit('activate')"
    >
      <Sparkles class="w-3.5 h-3.5 flex-shrink-0" />
      <span>
        {{ t('management.activation.pill.activateCta') }}
        <template v-if="price"> · {{ formatCurrency(price, 'USD') }}</template>
      </span>
    </button>

    <button
      v-else-if="state === 'pending' || state === 'active'"
      type="button"
      class="activation-pill__link"
      @click="emit('view-payment')"
    >
      {{ t(state === 'pending' ? 'management.activation.pill.viewPayment' : 'management.activation.pill.viewReceipt') }}
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * The Design Studio's activation status line.
 *
 * The studio renders an unpaid template's preview from the *public* template
 * assets (the showcase endpoint withholds the real ones until payment clears),
 * so without this the organizer sees a finished invitation and has no way to
 * know guests still see nothing. It doubles as the buy button: the moment of
 * "this looks great" is where the activate CTA belongs, not one tab away.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckCircle2, Clock, Eye, Palette, Sparkles } from 'lucide-vue-next'
import { formatCurrency } from '../../utils/currency'
import type { ActivationState } from '../../composables/useTemplateActivation'

interface Props {
  state: ActivationState
  /** Template price, shown on the activate CTA so the cost is never a surprise. */
  price?: string | null
  canEdit?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Open the payment checkout. */
  activate: []
  /** Jump to the activation tab's payment record. */
  'view-payment': []
}>()

const { t } = useI18n()

const stateIcon = computed(() => {
  switch (props.state) {
    case 'no-template':
      return Palette
    case 'unpaid':
      return Eye
    case 'pending':
      return Clock
    default:
      return CheckCircle2
  }
})
</script>

<style scoped>
/* Same translucent-glass pill language as the layout switch and language
   toggle it sits beside (see ShowcasePreviewTab's header), tinted per state so
   "preview only" reads as a warning without becoming a full-width banner that
   would steal vertical space from the frames. */
.activation-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  /* Height comes from the host toolbar's shared token so this lines up exactly
     with the view-controls pill and Templates button beside it; the fallback
     covers any other host. */
  height: var(--studio-control-h, 2.25rem);
  padding: 0 0.25rem 0 0.75rem;
  flex-shrink: 0;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid transparent;
  min-width: 0;
}

.activation-pill__status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
}

.activation-pill__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- no template --------------------------------------------------------- */
/* No inner button in this state, so it needs its own trailing padding. */
.activation-pill--no-template {
  color: rgb(71 85 105);
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.5);
  padding-right: 0.875rem;
}

/* --- unpaid: the warning state ------------------------------------------- */
.activation-pill--unpaid {
  color: rgb(146 64 14);
  background: rgba(254, 243, 199, 0.85);
  border-color: rgba(252, 211, 77, 0.6);
}

/* --- pending ------------------------------------------------------------- */
.activation-pill--pending {
  color: rgb(146 64 14);
  background: rgba(254, 243, 199, 0.7);
  border-color: rgba(252, 211, 77, 0.45);
}

/* --- active -------------------------------------------------------------- */
.activation-pill--active {
  color: rgb(4 108 78);
  background: rgba(209, 250, 229, 0.75);
  border-color: rgba(110, 231, 183, 0.6);
}

.activation-pill__live-dot {
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 9999px;
  background: rgb(16 185 129);
  flex-shrink: 0;
  animation: activation-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes activation-pulse {
  50% {
    opacity: 0.4;
  }
}

@media (prefers-reduced-motion: reduce) {
  .activation-pill__live-dot {
    animation: none;
  }
}

/* The remedy, inside the warning it resolves — so problem and fix are one
   object rather than two adjacent controls.

   Solid amber, deliberately not the brand gradient: the Templates button sits
   ~8px away in the studio toolbar and is that row's primary action, and two
   gradient buttons that close together read as two competing primaries with no
   hierarchy. Amber also keeps this visually part of its own warning pill. */
.activation-pill__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
  height: 1.75rem;
  padding: 0 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  background: rgb(180 83 9);
  box-shadow: 0 2px 4px -1px rgba(120, 53, 15, 0.35);
  transition: all 0.2s ease;
}

.activation-pill__cta:hover {
  background: rgb(146 64 14);
  box-shadow: 0 4px 8px -2px rgba(120, 53, 15, 0.45);
}

.activation-pill__link {
  flex-shrink: 0;
  padding: 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
  opacity: 0.75;
  white-space: nowrap;
  transition: opacity 0.2s ease;
}

.activation-pill__link:hover {
  opacity: 1;
}

/* Tight header rows: drop to the icon/dot plus the CTA. The full wording stays
   available as the activation tab's stepper, which has room for it. Same
   breakpoint as the studio toolbar's Templates button label, so the whole row
   collapses to icons together rather than one control at a time. */
@media (max-width: 640px) {
  .activation-pill__label,
  .activation-pill__link {
    display: none;
  }

  /* Nothing left to say and nowhere to say it — the Templates button beside it
     is the whole message in this state. */
  .activation-pill--no-template {
    display: none;
  }

  /* These two lose their trailing link, leaving only the status icon — even the
     padding back up so the pill doesn't sit off-centre inside itself. */
  .activation-pill--pending,
  .activation-pill--active {
    padding-right: 0.75rem;
  }
}
</style>
