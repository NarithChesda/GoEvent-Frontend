<template>
  <div>
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
          <span class="activation-stepper__short">{{ t(`management.activation.stepper.${step.key}.short`) }}</span>
          <span class="activation-stepper__hint">{{ t(`management.activation.stepper.${step.key}.${step.status === 'waiting' ? 'waitingHint' : 'hint'}`) }}</span>
        </span>
        <span
          v-if="index < steps.length - 1"
          class="activation-stepper__connector"
          aria-hidden="true"
        />
      </li>
    </ol>

    <!-- Narrow screens only: the row above is markers + one-word labels, so the
         step that actually needs explaining says its piece here instead of
         every step trying to fit a hint under a ~100px column. -->
    <p class="activation-stepper__active-hint">{{ activeHint }}</p>
  </div>
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

/** The one hint worth the vertical space on a phone: whatever the organizer is
 *  waiting on or has to do next — or, once everything is done, what "done"
 *  means. */
const activeHint = computed(() => {
  const step = steps.value.find((s) => s.status === 'current' || s.status === 'waiting')
  if (!step) {
    const last = steps.value[steps.value.length - 1]
    return t(`management.activation.stepper.${last.key}.hint`)
  }
  return t(
    `management.activation.stepper.${step.key}.${step.status === 'waiting' ? 'waitingHint' : 'hint'}`,
  )
})
</script>

<style scoped>
/* Phone layout: the three steps read as a horizontal progress track — markers
   in a row with one-word labels underneath, and a single hint line below for
   the step that's actually in play. The full vertical list (a title *and* a
   hint per step) cost ~200px of a phone screen before the organizer saw the
   template they came here to activate. */
.activation-stepper {
  display: flex;
  align-items: flex-start;
}

.activation-stepper__step {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  text-align: center;
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
  align-items: center;
  gap: 0.0625rem;
  min-width: 0;
}

/* Full titles and per-step hints belong to the wide layout; the phone row
   carries the one-word label instead. */
.activation-stepper__title,
.activation-stepper__hint {
  display: none;
}

.activation-stepper__short {
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.25;
  color: rgb(100 116 139);
}

.activation-stepper__active-hint {
  margin-top: 0.625rem;
  font-size: 0.75rem;
  line-height: 1.4;
  text-align: center;
  color: rgb(100 116 139);
}

/* Thread joining the markers — drawn from each marker to the next, so it can
   be tinted per step (completed segments read as progress). Reaching past this
   step's own right edge (`-50%`) lands it on the next marker's centre, since
   every step is the same width. */
.activation-stepper__connector {
  position: absolute;
  top: 0.6875rem;
  left: calc(50% + 1.125rem);
  right: calc(-50% + 1.125rem);
  height: 2px;
  background: rgb(226 232 240);
}

.activation-stepper__step.is-done .activation-stepper__marker {
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  border-color: transparent;
  color: white;
}

.activation-stepper__step.is-done .activation-stepper__title,
.activation-stepper__step.is-done .activation-stepper__short {
  color: rgb(51 65 85);
}

.activation-stepper__step.is-done .activation-stepper__connector {
  background: linear-gradient(to right, #2ecc71, rgba(30, 144, 255, 0.35));
}

.activation-stepper__step.is-current .activation-stepper__marker {
  border-color: #1e90ff;
  color: #1873cc;
  box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.12);
}

.activation-stepper__step.is-current .activation-stepper__title,
.activation-stepper__step.is-current .activation-stepper__short {
  color: rgb(15 23 42);
  font-weight: 700;
}

.activation-stepper__step.is-waiting .activation-stepper__marker {
  background: rgb(254 243 199);
  border-color: rgb(252 211 77);
  color: rgb(146 64 14);
}

.activation-stepper__step.is-waiting .activation-stepper__title,
.activation-stepper__step.is-waiting .activation-stepper__short {
  color: rgb(146 64 14);
  font-weight: 700;
}

/* Wide enough for each step to carry its own title and hint: markers move
   beside their text and the connector becomes a rule between the pairs. */
@media (min-width: 640px) {
  .activation-stepper__step {
    flex-direction: row;
    align-items: flex-start;
    gap: 0.75rem;
    text-align: left;
    padding-right: 0.75rem;
  }

  .activation-stepper__step:last-child {
    flex: 0 1 auto;
    padding-right: 0;
  }

  .activation-stepper__title {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: rgb(100 116 139);
  }

  .activation-stepper__hint {
    display: block;
    font-size: 0.75rem;
    color: rgb(148 163 184);
  }

  .activation-stepper__short,
  .activation-stepper__active-hint {
    display: none;
  }

  .activation-stepper__text {
    flex: 0 1 auto;
    align-items: flex-start;
    padding-top: 0.0625rem;
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
}
</style>
