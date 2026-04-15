<template>
  <!-- Hide entire RSVP section once the event has ended -->
  <div v-if="eventStatus !== 'ended'" id="rsvp" class="rsvp-wrapper">
    <!-- RSVP Header -->
    <div class="rsvp-title">
      <span
        :class="['text-white', currentLanguage === 'kh' && 'khmer-text-fix']"
        :style="{ fontFamily: secondaryFont || currentFont }"
      >
        {{ rsvpHeaderText }}
      </span>
      <!-- Trailing checkmark in a circle — only on the completed state -->
      <span
        v-if="showCollapsedSummary"
        class="rsvp-title-check"
        aria-hidden="true"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            stroke-width="2.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>

    <!-- Missing invitation shortcode -->
    <div
      v-if="!guestShortcode"
      class="rsvp-placeholder"
      :style="{ fontFamily: secondaryFont || currentFont }"
    >
      {{ needInvitationLinkText }}
    </div>

    <!-- Loading -->
    <div v-else-if="isLoading" class="rsvp-loader">
      <div class="spinner-white"></div>
    </div>

    <!-- Load failed -->
    <div v-else-if="loadError" class="rsvp-error-state">
      <span
        class="message-text error"
        :style="{ fontFamily: secondaryFont || currentFont }"
      >
        {{ loadError }}
      </span>
      <button
        type="button"
        class="link-btn"
        :style="{ fontFamily: secondaryFont || currentFont }"
        @click="loadFormState"
      >
        {{ retryText }}
      </button>
    </div>

    <!-- Collapsed summary (after submit) — the header already reads as a
         thank-you, so the whole pill collapses down to a single edit
         button. Success toast still renders briefly right after a submit. -->
    <div
      v-else-if="formState && showCollapsedSummary"
      class="rsvp-summary"
    >
      <button
        type="button"
        class="edit-btn"
        :style="{ fontFamily: secondaryFont || currentFont }"
        @click="enterEditMode"
        :aria-label="editResponseText"
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M11 2l3 3-8.5 8.5H2.5V10.5L11 2z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>{{ editResponseText }}</span>
      </button>

      <div v-if="successMessage" class="rsvp-message">
        <span class="message-text success">{{ successMessage }}</span>
      </div>
    </div>

    <!-- Wizard form -->
    <form
      v-else-if="formState"
      class="rsvp-wizard"
      @submit.prevent="handleSubmit"
    >
      <!-- Progress bar (only when we have more than one step) -->
      <div v-if="steps.length > 1" class="wizard-progress">
        <div
          class="wizard-progress-fill"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>

      <!-- Step content with fade-slide transition -->
      <transition name="step-fade" mode="out-in">
        <div :key="currentStepIndex" class="wizard-step">
          <!-- STATUS -->
          <template v-if="currentStep?.kind === 'status'">
            <p
              class="step-prompt"
              :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
              :style="{ fontFamily: secondaryFont || currentFont }"
            >
              {{ statusPlaceholderText }}
            </p>
            <div class="status-options">
              <button
                v-for="opt in statusOptions"
                :key="opt.value"
                type="button"
                class="status-option"
                :class="{ active: rsvpStatus === opt.value }"
                :style="{
                  fontFamily: secondaryFont || currentFont,
                  color: rsvpStatus === opt.value ? (backgroundColor || primaryColor) : 'white',
                  background: rsvpStatus === opt.value ? 'white' : 'transparent',
                }"
                @click="selectStatus(opt.value)"
              >
                <span
                  :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
                >{{ opt.label }}</span>
              </button>
            </div>
          </template>

          <!-- PLUS-ONES (count + names combined) -->
          <template v-else-if="currentStep?.kind === 'plus_ones'">
            <p
              class="step-prompt"
              :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
              :style="{ fontFamily: secondaryFont || currentFont }"
            >
              {{ plusOnesLabel }}
            </p>
            <p
              class="step-hint"
              :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
              :style="{ fontFamily: secondaryFont || currentFont }"
            >
              {{ plusOnesHelperText }}
            </p>
            <div class="stepper stepper-center">
              <button
                type="button"
                class="stepper-btn"
                :disabled="plusOnesCount <= 0"
                :aria-label="'−'"
                @click="decrementPlusOnes"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6H10"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
              <span
                class="stepper-value"
                :style="{ fontFamily: secondaryFont || currentFont }"
              >{{ plusOnesCount }}</span>
              <button
                type="button"
                class="stepper-btn"
                :disabled="plusOnesCount >= formState.max_plus_ones"
                :aria-label="'+'"
                @click="incrementPlusOnes"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 2V10M2 6H10"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>
            <div v-if="plusOnesCount > 0" class="field">
              <input
                v-model="plusOnesNames"
                type="text"
                class="line-input line-input-center"
                :placeholder="plusOnesNamesPlaceholder"
                :maxlength="300"
                :aria-label="plusOnesNamesLabel"
                :style="{ fontFamily: secondaryFont || currentFont }"
              />
            </div>
          </template>

          <!-- QUESTION (one per step) -->
          <template v-else-if="currentStep?.kind === 'question' && currentQuestion">
            <p
              class="step-prompt"
              :class="[
                currentLanguage === 'kh' && 'khmer-text-fix',
                requiredMissingIds.has(currentQuestion.id) && 'label-error',
              ]"
              :style="{ fontFamily: secondaryFont || currentFont }"
            >
              <span>{{ currentQuestion.question_text }}</span>
              <span
                v-if="currentQuestion.is_required"
                class="required-star"
                aria-hidden="true"
              >*</span>
            </p>

            <!-- text -->
            <input
              v-if="currentQuestion.question_type === 'text'"
              v-model="answers[currentQuestion.id].answer_text"
              type="text"
              class="line-input line-input-center"
              :placeholder="textPlaceholder"
              :maxlength="200"
              :style="{ fontFamily: secondaryFont || currentFont }"
            />

            <!-- long_text -->
            <textarea
              v-else-if="currentQuestion.question_type === 'long_text'"
              v-model="answers[currentQuestion.id].answer_text"
              class="line-textarea line-input-center"
              :placeholder="longTextPlaceholder"
              :maxlength="2000"
              rows="3"
              :style="{ fontFamily: secondaryFont || currentFont }"
            />

            <!-- yes_no -->
            <div
              v-else-if="currentQuestion.question_type === 'yes_no'"
              class="chips-row chips-center"
            >
              <button
                type="button"
                class="chip"
                :class="{ active: answers[currentQuestion.id].answer_text === 'yes' }"
                :style="{
                  fontFamily: secondaryFont || currentFont,
                  color: answers[currentQuestion.id].answer_text === 'yes' ? (backgroundColor || primaryColor) : 'white',
                  background: answers[currentQuestion.id].answer_text === 'yes' ? 'white' : 'transparent',
                }"
                @click="setYesNo(currentQuestion.id, 'yes')"
              >{{ yesOptionText }}</button>
              <button
                type="button"
                class="chip"
                :class="{ active: answers[currentQuestion.id].answer_text === 'no' }"
                :style="{
                  fontFamily: secondaryFont || currentFont,
                  color: answers[currentQuestion.id].answer_text === 'no' ? (backgroundColor || primaryColor) : 'white',
                  background: answers[currentQuestion.id].answer_text === 'no' ? 'white' : 'transparent',
                }"
                @click="setYesNo(currentQuestion.id, 'no')"
              >{{ noOptionText }}</button>
            </div>

            <!-- single_choice -->
            <div
              v-else-if="currentQuestion.question_type === 'single_choice'"
              class="chips-wrap chips-center"
            >
              <button
                v-for="(display, idx) in currentQuestion.displayChoices"
                :key="currentQuestion.originalChoices[idx]"
                type="button"
                class="chip"
                :class="{ active: answers[currentQuestion.id].answer_text === currentQuestion.originalChoices[idx] }"
                :style="{
                  fontFamily: secondaryFont || currentFont,
                  color: answers[currentQuestion.id].answer_text === currentQuestion.originalChoices[idx] ? (backgroundColor || primaryColor) : 'white',
                  background: answers[currentQuestion.id].answer_text === currentQuestion.originalChoices[idx] ? 'white' : 'transparent',
                }"
                @click="selectSingleChoice(currentQuestion.id, currentQuestion.originalChoices[idx])"
              >{{ display }}</button>
            </div>

            <!-- multi_choice -->
            <div
              v-else-if="currentQuestion.question_type === 'multi_choice'"
              class="chips-wrap chips-center"
            >
              <button
                v-for="(display, idx) in currentQuestion.displayChoices"
                :key="currentQuestion.originalChoices[idx]"
                type="button"
                class="chip"
                :class="{ active: isChoiceSelected(currentQuestion.id, currentQuestion.originalChoices[idx]) }"
                :style="{
                  fontFamily: secondaryFont || currentFont,
                  color: isChoiceSelected(currentQuestion.id, currentQuestion.originalChoices[idx]) ? (backgroundColor || primaryColor) : 'white',
                  background: isChoiceSelected(currentQuestion.id, currentQuestion.originalChoices[idx]) ? 'white' : 'transparent',
                }"
                @click="toggleMultiChoice(currentQuestion.id, currentQuestion.originalChoices[idx])"
              >{{ display }}</button>
            </div>
          </template>

          <!-- PRIVATE NOTE -->
          <template v-else-if="currentStep?.kind === 'private_note'">
            <p
              class="step-prompt"
              :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
              :style="{ fontFamily: secondaryFont || currentFont }"
            >
              {{ privateNoteLabel }}
            </p>
            <textarea
              v-model="privateNote"
              class="line-textarea line-input-center"
              :placeholder="privateNotePlaceholder"
              :maxlength="500"
              rows="3"
              :aria-label="privateNoteLabel"
              :style="{ fontFamily: secondaryFont || currentFont }"
            />
          </template>
        </div>
      </transition>

      <!-- Status messages -->
      <div v-if="successMessage || errorMessage" class="rsvp-message">
        <span v-if="successMessage" class="message-text success">
          {{ successMessage }}
        </span>
        <span v-if="errorMessage" class="message-text error">
          {{ errorMessage }}
        </span>
      </div>

      <!-- Wizard navigation -->
      <div class="wizard-nav">
        <button
          v-if="!isFirstStep"
          type="button"
          class="nav-btn back"
          :style="{ fontFamily: secondaryFont || currentFont }"
          @click="goBack"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M7.5 2.5L3 6l4.5 3.5"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>{{ backText }}</span>
        </button>

        <button
          v-if="!isLastStep"
          type="button"
          class="nav-btn next"
          :disabled="!canProceed"
          :style="{
            fontFamily: secondaryFont || currentFont,
            color: backgroundColor || primaryColor,
          }"
          @click="goNext"
        >
          <span>{{ nextText }}</span>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M4.5 2.5L9 6l-4.5 3.5"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <button
          v-else
          type="submit"
          class="nav-btn submit"
          :disabled="!canProceed || isSubmitting"
          :style="{
            fontFamily: secondaryFont || currentFont,
            color: backgroundColor || primaryColor,
          }"
        >
          <div v-if="isSubmitting" class="spinner-inline"></div>
          <span v-else>{{ submitButtonLabel }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { guestRsvpService } from '../../services/api/modules/rsvp.service'
import type {
  EventRsvpQuestion,
  GuestRsvpAnswer,
  GuestRsvpFormState,
  GuestRsvpStatus,
  GuestRsvpSubmitRequest,
} from '../../services/api/types/rsvp.types'
import type { EventText } from '../../composables/useEventShowcase'
import {
  translateRSVP,
  type SupportedLanguage,
} from '../../utils/translations'

interface Props {
  eventId: string
  guestShortcode?: string | null
  guestName?: string
  eventStartDate?: string
  eventEndDate?: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  currentFont?: string
  primaryFont?: string
  secondaryFont?: string
  eventType?: string
}

const props = defineProps<Props>()

// ---- State ---------------------------------------------------------------
const formState = ref<GuestRsvpFormState | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const loadError = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const rsvpStatus = ref<GuestRsvpStatus>('pending')
const plusOnesCount = ref(0)
const plusOnesNames = ref('')
const privateNote = ref('')

type AnswerState = { answer_text: string; answer_choices: string[] }
const answers = reactive<Record<number, AnswerState>>({})
const requiredMissingIds = ref<Set<number>>(new Set())

// Drives the submit → collapsed-summary transition. After a successful
// submit (or on fresh page loads where the guest already responded), the
// form hides and a compact summary card takes its place. Clicking "Edit"
// flips this back to `true` so the guest can revise.
const isEditing = ref(false)

// ---- Wizard state --------------------------------------------------------
// The form is rendered as a step-by-step wizard: status → plus-ones →
// each custom question → private note. The active step list is recomputed
// from `rsvpStatus` + the current question list so irrelevant steps (plus
// ones when declining, questions when declining) are skipped.
const currentStepIndex = ref(0)
let successTimeout: ReturnType<typeof setTimeout> | null = null

type WizardStepKind = 'status' | 'plus_ones' | 'question' | 'private_note'
interface WizardStep {
  kind: WizardStepKind
  questionId?: number
}

// ---- Computed ------------------------------------------------------------
const eventStatus = computed(() => {
  if (!props.eventStartDate || !props.eventEndDate) return 'upcoming'
  const now = new Date()
  const startDate = new Date(props.eventStartDate)
  const endDate = new Date(props.eventEndDate)
  if (now >= endDate) return 'ended'
  if (now >= startDate && now < endDate) return 'ongoing'
  return 'upcoming'
})

// The guest has a recorded RSVP when the backend has stamped a response
// date. Used to decide whether to render the collapsed summary or the
// editable form. A `pending` status after a timestamp (shouldn't happen in
// normal flow) still counts as "not yet answered" and shows the form.
const hasSubmittedRsvp = computed(() => {
  return !!formState.value?.rsvp_responded_at && rsvpStatus.value !== 'pending'
})

// Show the collapsed summary when the guest has already answered AND is
// not actively editing. Clicking "Edit" toggles `isEditing` on.
const showCollapsedSummary = computed(
  () => hasSubmittedRsvp.value && !isEditing.value,
)

const currentLang = computed<SupportedLanguage>(
  () => (props.currentLanguage as SupportedLanguage) || 'en',
)

const getTextContent = (textType: string, fallback = ''): string => {
  if (props.eventTexts && props.currentLanguage) {
    const match = props.eventTexts.find(
      (t) => t.text_type === textType && t.language === props.currentLanguage,
    )
    if (match?.content) return match.content
  }
  return fallback
}

const rsvpHeaderText = computed(() => {
  // Once the guest has responded and is viewing the collapsed summary,
  // the "Will you be joining us?" question is no longer accurate — swap
  // it for a thank-you line. Returning to edit mode brings the question
  // header back so the form context is clear.
  if (showCollapsedSummary.value) {
    return translateRSVP('rsvp_thank_you', currentLang.value)
  }
  const eventType = props.eventType?.toLowerCase() || 'default'
  const headerKeyMap: Record<
    string,
    'rsvp_header' | 'rsvp_header_birthday' | 'rsvp_header_default'
  > = {
    wedding: 'rsvp_header',
    birthday: 'rsvp_header_birthday',
    'birthday party': 'rsvp_header_birthday',
    default: 'rsvp_header_default',
  }
  const key = headerKeyMap[eventType] || 'rsvp_header_default'
  return getTextContent(key, translateRSVP(key, currentLang.value))
})

const statusOptions = computed(() => [
  {
    value: 'attending' as GuestRsvpStatus,
    label: translateRSVP('rsvp_status_attending_label', currentLang.value),
  },
  {
    value: 'maybe' as GuestRsvpStatus,
    label: translateRSVP('rsvp_status_maybe_label', currentLang.value),
  },
  {
    value: 'not_attending' as GuestRsvpStatus,
    label: translateRSVP('rsvp_status_not_attending_label', currentLang.value),
  },
])

const statusPlaceholderText = computed(() =>
  translateRSVP('rsvp_status_placeholder', currentLang.value),
)

const plusOnesLabel = computed(() =>
  translateRSVP('rsvp_plus_ones_label', currentLang.value),
)

const plusOnesHelperText = computed(() => {
  const template = translateRSVP('rsvp_plus_ones_helper', currentLang.value)
  return template.replace('{max}', String(formState.value?.max_plus_ones ?? 0))
})

const plusOnesNamesLabel = computed(() =>
  translateRSVP('rsvp_plus_ones_names_label', currentLang.value),
)
const plusOnesNamesPlaceholder = computed(() =>
  translateRSVP('rsvp_plus_ones_names_placeholder', currentLang.value),
)
const privateNoteLabel = computed(() =>
  translateRSVP('rsvp_private_note_label', currentLang.value),
)
const privateNotePlaceholder = computed(() =>
  translateRSVP('rsvp_private_note_placeholder', currentLang.value),
)
const yesOptionText = computed(() =>
  translateRSVP('rsvp_yes_option', currentLang.value),
)
const noOptionText = computed(() =>
  translateRSVP('rsvp_no_option', currentLang.value),
)
const textPlaceholder = computed(() =>
  translateRSVP('rsvp_text_placeholder', currentLang.value),
)
const longTextPlaceholder = computed(() =>
  translateRSVP('rsvp_long_text_placeholder', currentLang.value),
)
const needInvitationLinkText = computed(() =>
  translateRSVP('rsvp_need_invitation_link', currentLang.value),
)
const retryText = computed(() => translateRSVP('rsvp_dismiss', currentLang.value))
const backText = computed(() => translateRSVP('rsvp_wizard_back', currentLang.value))
const nextText = computed(() => translateRSVP('rsvp_wizard_next', currentLang.value))

const submitButtonLabel = computed(() => {
  if (formState.value?.rsvp_responded_at) {
    return translateRSVP('rsvp_update_button', currentLang.value)
  }
  return translateRSVP('rsvp_submit_button', currentLang.value)
})

const editResponseText = computed(() =>
  translateRSVP('rsvp_edit_response', currentLang.value),
)

const enterEditMode = () => {
  isEditing.value = true
  currentStepIndex.value = 0
  errorMessage.value = ''
  successMessage.value = ''
}

interface LocalizedQuestion {
  id: number
  question_type: EventRsvpQuestion['question_type']
  question_text: string
  is_required: boolean
  displayChoices: string[]
  originalChoices: string[]
}

const localizedQuestions = computed<LocalizedQuestion[]>(() => {
  if (!formState.value) return []
  const lang = props.currentLanguage
  return [...formState.value.questions]
    .sort((a, b) => a.order - b.order)
    .map((q) => {
      const translation = q.translations?.find((t) => t.language === lang)
      const displayText = translation?.question_text || q.question_text
      const displayChoices =
        translation?.choices && translation.choices.length === q.choices.length
          ? translation.choices
          : q.choices
      return {
        id: q.id,
        question_type: q.question_type,
        question_text: displayText,
        is_required: q.is_required,
        displayChoices,
        originalChoices: q.choices,
      }
    })
})

// ---- Answer helpers ------------------------------------------------------
const ensureAnswerSlot = (questionId: number): AnswerState => {
  if (!answers[questionId]) {
    answers[questionId] = { answer_text: '', answer_choices: [] }
  }
  return answers[questionId]
}

const isChoiceSelected = (questionId: number, choice: string): boolean => {
  return ensureAnswerSlot(questionId).answer_choices.includes(choice)
}

const toggleMultiChoice = (questionId: number, choice: string) => {
  const slot = ensureAnswerSlot(questionId)
  const idx = slot.answer_choices.indexOf(choice)
  if (idx === -1) {
    slot.answer_choices.push(choice)
  } else {
    slot.answer_choices.splice(idx, 1)
  }
  requiredMissingIds.value.delete(questionId)
}

const selectSingleChoice = (questionId: number, choice: string) => {
  ensureAnswerSlot(questionId).answer_text = choice
  requiredMissingIds.value.delete(questionId)
}

const setYesNo = (questionId: number, value: 'yes' | 'no') => {
  ensureAnswerSlot(questionId).answer_text = value
  requiredMissingIds.value.delete(questionId)
}

const selectStatus = (status: GuestRsvpStatus) => {
  rsvpStatus.value = status
  requiredMissingIds.value.clear()
  errorMessage.value = ''
}

// ---- Wizard navigation ---------------------------------------------------
// The active step list is recomputed from rsvpStatus + question list so
// irrelevant steps are skipped. Declining ("not_attending") jumps straight
// from status to private-note; attending/maybe walks through plus-ones
// and each custom question.
const steps = computed<WizardStep[]>(() => {
  if (!formState.value) return []
  const out: WizardStep[] = [{ kind: 'status' }]
  if (rsvpStatus.value === 'pending') return out

  const attendingLike =
    rsvpStatus.value === 'attending' || rsvpStatus.value === 'maybe'

  if (attendingLike && formState.value.max_plus_ones > 0) {
    out.push({ kind: 'plus_ones' })
  }

  if (attendingLike) {
    for (const q of localizedQuestions.value) {
      out.push({ kind: 'question', questionId: q.id })
    }
  }

  out.push({ kind: 'private_note' })
  return out
})

const currentStep = computed<WizardStep | null>(
  () => steps.value[currentStepIndex.value] ?? null,
)

const currentQuestion = computed<LocalizedQuestion | null>(() => {
  if (currentStep.value?.kind !== 'question') return null
  const qid = currentStep.value.questionId
  return localizedQuestions.value.find((q) => q.id === qid) ?? null
})

const isFirstStep = computed(() => currentStepIndex.value === 0)
const isLastStep = computed(
  () => currentStepIndex.value >= steps.value.length - 1,
)

// Progress indicator fill: (current+1)/total, so step 1 shows some fill
// and the last step reads 100%.
const progressPercent = computed(() => {
  const total = steps.value.length
  if (total <= 1) return 100
  return Math.round(((currentStepIndex.value + 1) / total) * 100)
})

// Gate the Next/Submit button. Only the currently-visible step is
// validated — required questions block progression, everything else is
// free to skip forward.
const canProceed = computed(() => {
  const step = currentStep.value
  if (!step) return false
  switch (step.kind) {
    case 'status':
      return rsvpStatus.value !== 'pending'
    case 'plus_ones':
      return true
    case 'question': {
      const q = currentQuestion.value
      if (!q || !q.is_required) return true
      const slot = answers[q.id]
      if (!slot) return false
      if (q.question_type === 'multi_choice') {
        return slot.answer_choices.length > 0
      }
      return slot.answer_text.trim().length > 0
    }
    case 'private_note':
      return true
    default:
      return false
  }
})

const goNext = () => {
  if (!canProceed.value) {
    // Flag the required question visually if the user tried to skip it.
    if (
      currentStep.value?.kind === 'question' &&
      currentQuestion.value?.is_required
    ) {
      requiredMissingIds.value.add(currentQuestion.value.id)
    }
    return
  }
  if (isLastStep.value) return // submit button handles the last step
  currentStepIndex.value++
  errorMessage.value = ''
}

const goBack = () => {
  if (isFirstStep.value) return
  currentStepIndex.value--
  errorMessage.value = ''
}

// If the active step list shrinks (e.g. user flips from attending to
// not_attending on step 0), clamp the index so we never render past the
// end of the array.
watch(steps, (newSteps) => {
  if (currentStepIndex.value >= newSteps.length) {
    currentStepIndex.value = Math.max(0, newSteps.length - 1)
  }
})

const incrementPlusOnes = () => {
  if (!formState.value) return
  if (plusOnesCount.value < formState.value.max_plus_ones) {
    plusOnesCount.value++
  }
}

const decrementPlusOnes = () => {
  if (plusOnesCount.value > 0) {
    plusOnesCount.value--
    if (plusOnesCount.value === 0) {
      plusOnesNames.value = ''
    }
  }
}

// ---- Load + submit -------------------------------------------------------
const applyFormState = (state: GuestRsvpFormState) => {
  formState.value = state
  rsvpStatus.value = state.rsvp_status
  plusOnesCount.value = state.plus_ones_count ?? 0
  plusOnesNames.value = state.plus_ones_names ?? ''
  privateNote.value = state.private_note_to_host ?? ''

  for (const key of Object.keys(answers)) {
    delete answers[Number(key)]
  }
  for (const q of state.questions) {
    ensureAnswerSlot(q.id)
  }
  for (const a of state.answers) {
    const slot = ensureAnswerSlot(a.question_id)
    if (typeof a.answer_text === 'string') slot.answer_text = a.answer_text
    if (Array.isArray(a.answer_choices)) {
      slot.answer_choices = [...a.answer_choices]
    }
  }
  requiredMissingIds.value.clear()
  currentStepIndex.value = 0
}

const loadFormState = async () => {
  if (!props.guestShortcode || !props.eventId) return
  isLoading.value = true
  loadError.value = ''
  errorMessage.value = ''
  try {
    const response = await guestRsvpService.getGuestRsvp(
      props.eventId,
      props.guestShortcode,
    )
    if (response.success && response.data) {
      applyFormState(response.data)
    } else {
      loadError.value =
        response.message || translateRSVP('rsvp_load_failed', currentLang.value)
    }
  } catch {
    loadError.value = translateRSVP('rsvp_load_failed', currentLang.value)
  } finally {
    isLoading.value = false
  }
}

const collectAnswersForSubmit = (): GuestRsvpAnswer[] => {
  if (!formState.value) return []
  const payload: GuestRsvpAnswer[] = []
  for (const q of formState.value.questions) {
    const slot = answers[q.id]
    if (!slot) continue
    if (q.question_type === 'multi_choice') {
      if (slot.answer_choices.length > 0) {
        payload.push({ question_id: q.id, answer_choices: [...slot.answer_choices] })
      }
    } else {
      const trimmed = slot.answer_text.trim()
      if (trimmed.length > 0) {
        payload.push({
          question_id: q.id,
          answer_text:
            q.question_type === 'yes_no' ? trimmed.toLowerCase() : trimmed,
        })
      }
    }
  }
  return payload
}

const validateRequired = (): boolean => {
  if (!formState.value) return true
  if (rsvpStatus.value !== 'attending' && rsvpStatus.value !== 'maybe') {
    requiredMissingIds.value.clear()
    return true
  }
  const missing = new Set<number>()
  for (const q of formState.value.questions) {
    if (!q.is_required) continue
    const slot = answers[q.id]
    if (!slot) {
      missing.add(q.id)
      continue
    }
    if (q.question_type === 'multi_choice') {
      if (slot.answer_choices.length === 0) missing.add(q.id)
    } else if (slot.answer_text.trim().length === 0) {
      missing.add(q.id)
    }
  }
  requiredMissingIds.value = missing
  return missing.size === 0
}

const handleSubmit = async () => {
  if (!props.guestShortcode || !formState.value) return
  if (rsvpStatus.value === 'pending') return

  errorMessage.value = ''
  successMessage.value = ''

  if (!validateRequired()) {
    errorMessage.value = translateRSVP('rsvp_required_missing', currentLang.value)
    return
  }

  const clampedPlusOnes = Math.min(
    Math.max(0, plusOnesCount.value),
    formState.value.max_plus_ones,
  )

  const payload: GuestRsvpSubmitRequest = {
    guest_shortcode: props.guestShortcode,
    rsvp_status: rsvpStatus.value,
    plus_ones_count: clampedPlusOnes,
    plus_ones_names: clampedPlusOnes > 0 ? plusOnesNames.value.trim() : '',
    private_note_to_host: privateNote.value.trim(),
    answers: collectAnswersForSubmit(),
  }

  isSubmitting.value = true
  try {
    const response = await guestRsvpService.submitGuestRsvp(props.eventId, payload)
    if (response.success && response.data) {
      applyFormState(response.data)
      // Collapse the form into the minimal summary card. The guest can
      // reopen it via the "Edit response" button.
      isEditing.value = false
      successMessage.value = translateRSVP('rsvp_submit_success', currentLang.value)
      if (successTimeout) clearTimeout(successTimeout)
      successTimeout = setTimeout(() => {
        successMessage.value = ''
      }, 4000)
    } else {
      errorMessage.value =
        response.message || translateRSVP('rsvp_load_failed', currentLang.value)
    }
  } catch {
    errorMessage.value = translateRSVP('rsvp_load_failed', currentLang.value)
  } finally {
    isSubmitting.value = false
  }
}

// ---- Lifecycle -----------------------------------------------------------
watch(
  () => props.guestShortcode,
  (shortcode) => {
    if (shortcode) loadFormState()
  },
)

onMounted(() => {
  if (props.guestShortcode) loadFormState()
})

onBeforeUnmount(() => {
  if (successTimeout) clearTimeout(successTimeout)
})
</script>

<style scoped>
/* Wrapper + title */
.rsvp-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.rsvp-title {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.3;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
}

.rsvp-title-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: white;
  flex-shrink: 0;
  animation: check-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes check-pop {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.rsvp-placeholder {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  padding: 0.4rem 0.25rem;
  line-height: 1.45;
}

/* Loader + error */
.rsvp-loader {
  display: flex;
  justify-content: center;
  padding: 0.5rem;
}

.spinner-white {
  width: 1.1rem;
  height: 1.1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.spinner-inline {
  width: 0.95rem;
  height: 0.95rem;
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.rsvp-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem;
}

.link-btn {
  background: transparent;
  border: none;
  padding: 0.2rem 0.4rem;
  color: white;
  text-decoration: underline;
  text-underline-offset: 2px;
  font-size: 0.75rem;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s ease;
}

.link-btn:hover {
  opacity: 1;
}

/* Wizard container */
.rsvp-wizard {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  align-items: stretch;
}

/* Thin progress bar — hides entirely when there's only one step
   (guest hasn't picked a status yet). */
.wizard-progress {
  width: 100%;
  max-width: 14rem;
  height: 2px;
  margin: 0 auto 0.15rem;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  overflow: hidden;
}

.wizard-progress-fill {
  height: 100%;
  background: white;
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Step container — center everything within each step */
.wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  min-height: 4.5rem;
  text-align: center;
}

.step-prompt {
  font-size: 0.82rem;
  font-weight: 500;
  color: white;
  line-height: 1.35;
  max-width: 22rem;
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  justify-content: center;
  flex-wrap: wrap;
}

.step-hint {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.3;
  margin-top: -0.15rem;
}

/* Step transition */
.step-fade-enter-active,
.step-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

/* Status options — pill buttons for the first step */
.status-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.1rem;
}

.status-option {
  padding: 0.42rem 1rem;
  border-radius: 999px;
  border: 1.2px solid rgba(255, 255, 255, 0.5);
  font-size: 0.76rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.2s ease, color 0.15s ease,
    transform 0.12s ease;
  white-space: nowrap;
}

.status-option:hover:not(.active) {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.85);
}

.status-option.active {
  border-color: white;
}

.status-option:active {
  transform: scale(0.97);
}

/* Centered variants for step layouts */
.stepper-center {
  justify-content: center;
  margin-top: 0.2rem;
}

.chips-center {
  justify-content: center;
  margin-top: 0.1rem;
}

.line-input-center {
  text-align: center;
}

.line-input-center::placeholder {
  text-align: center;
}

/* Stepper */
.stepper {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.stepper-btn {
  width: 1.55rem;
  height: 1.55rem;
  border-radius: 50%;
  border: 1.2px solid rgba(255, 255, 255, 0.55);
  background: transparent;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, border-color 0.2s ease, transform 0.15s ease;
  flex-shrink: 0;
  padding: 0;
}

.stepper-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  border-color: white;
}

.stepper-btn:active:not(:disabled) {
  transform: scale(0.94);
}

.stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stepper-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
  min-width: 1.3rem;
  text-align: center;
}

/* Fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Line-style inputs (underline only, no fill) */
.line-input,
.line-textarea {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.35);
  padding: 0.4rem 0.15rem;
  color: white;
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.line-textarea {
  resize: vertical;
  min-height: 2.6rem;
  font-family: inherit;
  line-height: 1.4;
}

.line-input::placeholder,
.line-textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.line-input:focus,
.line-textarea:focus {
  border-bottom-color: white;
}

.label-error {
  color: #fecaca;
}

.required-star {
  color: #fca5a5;
  font-weight: 700;
}

/* Chip buttons (yes/no, single, multi) */
.chips-row {
  display: flex;
  gap: 0.4rem;
}

.chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.chip {
  padding: 0.32rem 0.78rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  font-size: 0.73rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.2s ease,
    transform 0.12s ease;
  white-space: nowrap;
}

.chip:hover:not(.active) {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.85);
}

.chip.active {
  border-color: white;
}

.chip:active {
  transform: scale(0.96);
}

/* Wizard navigation bar */
.wizard-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
  min-height: 2rem;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.42rem 0.95rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.2s ease, color 0.15s ease,
    transform 0.12s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  white-space: nowrap;
}

.nav-btn.back {
  margin-right: auto;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.nav-btn.back:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: white;
  color: white;
}

.nav-btn.next,
.nav-btn.submit {
  background: white;
  border: none;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  min-width: 5.5rem;
  justify-content: center;
}

.nav-btn.submit {
  min-width: 7rem;
}

.nav-btn.next:hover:not(:disabled),
.nav-btn.submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
}

.nav-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Messages */
.rsvp-message {
  display: flex;
  justify-content: center;
}

.message-text {
  font-size: 0.74rem;
  font-weight: 500;
  text-align: center;
}

.message-text.success {
  color: #86efac;
}

.message-text.error {
  color: #fca5a5;
}

.responded-at {
  text-align: center;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.65);
}

/* Collapsed summary (post-submit minimal state) — just the edit button.
   The section header already reads as a thank-you, so no status text,
   no metadata, no timestamp. */
.rsvp-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  animation: summary-fade-in 0.3s ease-out;
}

@keyframes summary-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.42rem 1rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.2s ease, color 0.2s ease,
    transform 0.12s ease;
}

.edit-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: white;
  color: white;
}

.edit-btn:active {
  transform: scale(0.96);
}

.edit-btn svg {
  opacity: 0.85;
}

/* Mobile */
@media (max-width: 639px) {
  .status-option {
    font-size: 0.72rem;
    padding: 0.4rem 0.85rem;
  }

  .chip {
    font-size: 0.7rem;
    padding: 0.3rem 0.7rem;
  }

  .nav-btn {
    font-size: 0.68rem;
    padding: 0.38rem 0.8rem;
  }

  .nav-btn.next,
  .nav-btn.submit {
    min-width: 5rem;
  }
}

/* 13-inch laptops — align with the rest of EventInfo's tight scale */
@media (min-width: 1024px) and (max-width: 1365px) {
  .rsvp-wizard {
    gap: 0.5rem;
  }

  .rsvp-title {
    font-size: 0.66rem;
    gap: 0.3rem;
  }

  .rsvp-title-check {
    width: 0.85rem;
    height: 0.85rem;
    border-width: 1px;
  }

  .rsvp-title-check svg {
    width: 8px;
    height: 8px;
  }

  .wizard-progress {
    max-width: 10rem;
    height: 1.5px;
  }

  .wizard-step {
    gap: 0.4rem;
    min-height: 3.5rem;
  }

  .step-prompt {
    font-size: 0.64rem;
  }

  .step-hint {
    font-size: 0.52rem;
  }

  .status-option {
    padding: 0.32rem 0.75rem;
    font-size: 0.58rem;
    border-width: 1px;
  }

  .stepper-btn {
    width: 1.25rem;
    height: 1.25rem;
    border-width: 1px;
  }

  .stepper-btn svg {
    width: 8px;
    height: 8px;
  }

  .stepper-value {
    font-size: 0.75rem;
    min-width: 1rem;
  }

  .line-input,
  .line-textarea {
    font-size: 0.6rem;
    padding: 0.3rem 0.1rem;
  }

  .chip {
    padding: 0.25rem 0.6rem;
    font-size: 0.56rem;
    border-width: 1px;
  }

  .nav-btn {
    padding: 0.3rem 0.75rem;
    font-size: 0.56rem;
  }

  .nav-btn.next,
  .nav-btn.submit {
    min-width: 4.5rem;
  }

  .nav-btn.back {
    border-width: 1px;
  }

  .nav-btn svg {
    width: 8px;
    height: 8px;
  }

  .spinner-inline {
    width: 0.75rem;
    height: 0.75rem;
    border-width: 1.5px;
  }

  .message-text {
    font-size: 0.58rem;
  }

  .responded-at {
    font-size: 0.54rem;
  }

  .rsvp-placeholder {
    font-size: 0.58rem;
  }

  .rsvp-summary {
    gap: 0.2rem;
  }

  .edit-btn {
    padding: 0.3rem 0.75rem;
    font-size: 0.56rem;
    border-width: 1px;
    gap: 0.25rem;
  }

  .edit-btn svg {
    width: 8px;
    height: 8px;
  }
}
</style>
