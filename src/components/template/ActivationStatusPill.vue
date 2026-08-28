<template>
  <div class="activation-pill" :class="`activation-pill--${state}`">
    <!-- Status half: what guests can (or can't) see right now. -->
    <span class="activation-pill__status">
      <span v-if="state === 'active'" class="activation-pill__live-dot" aria-hidden="true" />
      <component v-else :is="stateIcon" class="activation-pill__icon w-3.5 h-3.5 flex-shrink-0" />
      <!-- Two labels, one shown at a time (see the ≤640px block): the phone
           toolbar has room for "Live", not for "Live for guests". Rendering
           both and swapping in CSS keeps the swap free of a resize listener. -->
      <span class="activation-pill__label">{{ t(`management.activation.pill.${state}`) }}</span>
      <span class="activation-pill__label-short">{{ t(`management.activation.pill.short.${state}`) }}</span>
    </span>

    <!-- Action half: only where there's something to do about it. -->
    <button
      v-if="state === 'unpaid' && canEdit"
      type="button"
      class="activation-pill__cta"
      @click="emit('activate')"
    >
      <Sparkles class="w-3.5 h-3.5 flex-shrink-0" />
      <span class="activation-pill__cta-label">
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

.activation-pill__label,
.activation-pill__label-short {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activation-pill__label-short {
  display: none;
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
  min-width: 0;
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

/* Truncates rather than pushing the toolbar's actions off a narrow screen — a
   three-digit price is the only realistic way this row runs out of room. */
.activation-pill__cta-label {
  overflow: hidden;
  text-overflow: ellipsis;
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

/* Phone: this is a badge, not a sentence.
   In the studio's mobile toolbar it shares ~358px with Templates and Preview,
   and it is the one control there that reports rather than does — so it gives
   up its wording first. The short label keeps it a status indicator (a bare
   dot reports nothing); the trailing link goes because the Activation tab is
   one tap away in the tab bar directly above. */
@media (max-width: 640px) {
  .activation-pill__label,
  .activation-pill__link {
    display: none;
  }

  .activation-pill__label-short {
    display: inline;
  }

  /* The icon goes with the wording it was decorating: "In review" in amber
     needs no clock beside it, and those ~20px are the difference between this
     row fitting a 360px phone and not. The live dot is a separate element and
     stays — it is the signal, not decoration. */
  .activation-pill__icon {
    display: none;
  }

  /* Nothing left to say and nowhere to say it — the Templates button beside it
     is the whole message in this state. */
  .activation-pill--no-template {
    display: none;
  }

  /* Unpaid is the one state carrying an action, and here the action *is* the
     message: an amber "Activate · $15" says "not live yet" on its own, while
     "Preview only" beside it says the same thing twice and costs ~90px in the
     row's widest state — the state that used to push Preview off the end. */
  .activation-pill--unpaid .activation-pill__status {
    display: none;
  }

  .activation-pill--unpaid {
    padding-left: 0.25rem;
  }

  /* These two lose their trailing link — even the padding back up so the pill
     doesn't sit off-centre inside itself. */
  .activation-pill--pending,
  .activation-pill--active {
    padding-right: 0.75rem;
  }
}
</style>
