<template>
  <ol class="activation-stepper" :aria-label="t('management.activation.stepper.label')">
    <li
      v-for="(step, index) in steps"
      :key="step.key"
      class="activation-stepper__step"
      :class="`is-${step.status}`"
      :aria-current="step.status === 'current' || step.status === 'waiting' ? 'step' : undefined"
    >
      <span class="activation-stepper__marker">
        <Check v-if="step.status === 'done'" class="w-3.5 h-3.5" />
        <Clock v-else-if="step.status === 'waiting'" class="w-3.5 h-3.5" />
        <span v-else>{{ index + 1 }}</span>
      </span>
      <span class="activation-stepper__text">
        <span class="activation-stepper__title">{{ t(`management.activation.stepper.${step.key}.title`) }}</span>
        <span class="activation-stepper__hint">{{ t(`management.activation.stepper.${step.key}.${step.status === 'waiting' ? 'waitingHint' : 'hint'}`) }}</span>
      </span>
      <span
        v-if="index < steps.length - 1"
        class="activation-stepper__connector"
        aria-hidden="true"
      />
    </li>
  </ol>
</template>

<script setup lang="ts">
/**
 * Template → payment → live, as three explicit steps.
 *
 * Exists to answer the one question the old Template & Payment tab left
 * unanswered: "I picked a template and it looks right in the studio, so why
 * can't my guests see it?" Making the sequence visible is cheaper than a
 * support conversation.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Clock } from 'lucide-vue-next'
import type { ActivationState } from '../../composables/useTemplateActivation'

interface Props {
  state: ActivationState
}

const props = defineProps<Props>()

const { t } = useI18n()

type StepStatus = 'done' | 'current' | 'waiting' | 'todo'

const STEP_KEYS = ['template', 'payment', 'live'] as const

/** One row per activation state — the whole component is this table. */
const STATUS_BY_STATE: Record<ActivationState, readonly [StepStatus, StepStatus, StepStatus]> = {
  'no-template': ['current', 'todo', 'todo'],
  unpaid: ['done', 'current', 'todo'],
  pending: ['done', 'done', 'waiting'],
  active: ['done', 'done', 'done'],
}

const steps = computed(() =>
  STEP_KEYS.map((key, index) => ({ key, status: STATUS_BY_STATE[props.state][index] })),
)
</script>

<style scoped>
.activation-stepper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.activation-stepper__step {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding-bottom: 0.875rem;
}

.activation-stepper__step:last-child {
  padding-bottom: 0;
}

.activation-stepper__marker {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  background: white;
  color: rgb(148 163 184);
  border: 1.5px solid rgb(226 232 240);
}

.activation-stepper__text {
  display: flex;
  flex-direction: column;
  gap: 0.0625rem;
  min-width: 0;
  padding-top: 0.0625rem;
}

.activation-stepper__title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(100 116 139);
}

.activation-stepper__hint {
  font-size: 0.75rem;
  color: rgb(148 163 184);
}

/* Thread joining the markers — drawn from each step's own marker down to the
   next, so it can be tinted per step (completed segments read as progress). */
.activation-stepper__connector {
  position: absolute;
  left: 0.6875rem;
  top: 1.5rem;
  bottom: 0.25rem;
  width: 2px;
  background: rgb(226 232 240);
}

.activation-stepper__step.is-done .activation-stepper__marker {
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  border-color: transparent;
  color: white;
}

.activation-stepper__step.is-done .activation-stepper__title {
  color: rgb(51 65 85);
}

.activation-stepper__step.is-done .activation-stepper__connector {
  background: linear-gradient(to bottom, #2ecc71, rgba(30, 144, 255, 0.35));
}

.activation-stepper__step.is-current .activation-stepper__marker {
  border-color: #1e90ff;
  color: #1873cc;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.12);
}

.activation-stepper__step.is-current .activation-stepper__title {
  color: rgb(15 23 42);
  font-weight: 700;
}

.activation-stepper__step.is-waiting .activation-stepper__marker {
  background: rgb(254 243 199);
  border-color: rgb(252 211 77);
  color: rgb(146 64 14);
}

.activation-stepper__step.is-waiting .activation-stepper__title {
  color: rgb(146 64 14);
  font-weight: 700;
}

/* Wide enough for a horizontal run: the three steps read as a left-to-right
   progress bar, with the connector rotating to a horizontal rule between
   markers. */
@media (min-width: 640px) {
  .activation-stepper {
    flex-direction: row;
    gap: 0;
  }

  .activation-stepper__step {
    flex: 1;
    align-items: flex-start;
    padding-bottom: 0;
    padding-right: 0.75rem;
  }

  .activation-stepper__step:last-child {
    flex: 0 1 auto;
    padding-right: 0;
  }

  /* Becomes a real flex item rather than staying absolutely positioned: it
     then fills whatever width is left after this step's own text, so the line
     always meets the next marker instead of needing the text's width guessed
     in advance. */
  .activation-stepper__connector {
    position: static;
    flex: 1 1 auto;
    min-width: 0.75rem;
    width: auto;
    height: 2px;
    margin: 0.6875rem 0.5rem 0 0.5rem;
  }

  .activation-stepper__text {
    flex: 0 1 auto;
  }

  .activation-stepper__step.is-done .activation-stepper__connector {
    background: linear-gradient(to right, #2ecc71, rgba(30, 144, 255, 0.35));
  }
}
</style>
