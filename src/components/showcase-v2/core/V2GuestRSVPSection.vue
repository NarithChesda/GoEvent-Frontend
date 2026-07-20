<template>
  <V2ChapterShell
    section-id="rsvp-section"
    :chapter-number="chapterNumber"
    :title="title"
    :current-language="currentLanguage"
  >
    <div class="v2-form-card">
      <!-- No invitation credential: invite-only note -->
      <p v-if="!guestShortcode" class="v2-gr-note">{{ t('invite_only_comment') }}</p>

      <!-- Loading form state -->
      <div v-else-if="loading" class="flex justify-center py-8">
        <span class="v2-spinner" aria-hidden="true"></span>
      </div>

      <!-- Load failed -->
      <div v-else-if="loadError" class="gr-error-state">
        <p class="v2-form-error gr-msg" role="alert">{{ loadError }}</p>
        <button type="button" class="v2-btn v2-btn--ghost" @click="load">
          {{ tr('rsvp_dismiss') }}
        </button>
      </div>

      <!-- Collapsed summary (after submit) — seat ticket is the hero of the
           completed state, with the edit button stacked beneath it -->
      <div v-else-if="formState && showCollapsedSummary" class="gr-summary">
        <p class="v2-success-big">{{ t('rsvp_thanks_title') }}</p>
        <p class="v2-form-hint">
          {{ attendingLike ? t('rsvp_thanks_coming') : t('rsvp_thanks_declined') }}
        </p>

        <div v-if="showTableTicket && formState.table" class="gr-seat-ticket">
          <!-- With no seat number the lone stat collapses to a single inline
               "label value" line instead of a stranded stacked column -->
          <div class="gr-seat-stat" :class="{ 'gr-seat-stat--inline': !seatNumberDisplay }">
            <span class="gr-seat-label">{{ tr('rsvp_table_label') }}</span>
            <span class="gr-seat-value">{{ formState.table.name }}</span>
          </div>
          <template v-if="seatNumberDisplay">
            <span class="gr-seat-divider" aria-hidden="true"></span>
            <div class="gr-seat-stat">
              <span class="gr-seat-label">{{ tr('rsvp_seat_label') }}</span>
              <span class="gr-seat-value">{{ seatNumberDisplay }}</span>
            </div>
          </template>
        </div>

        <button
          type="button"
          class="v2-btn v2-btn--ghost"
          :aria-label="tr('rsvp_edit_response')"
          @click="enterEditMode"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M11 2l3 3-8.5 8.5H2.5V10.5L11 2z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>{{ tr('rsvp_edit_response') }}</span>
        </button>

        <p v-if="successMessage" class="gr-success-msg">{{ successMessage }}</p>
      </div>

      <!-- Wizard form: status → plus-ones → each question → private note -->
      <form v-else-if="formState" class="gr-wizard" @submit.prevent="handleSubmit">
        <p v-if="formState.guest_name" class="gr-greeting">
          {{ t('dear_guest') }} <strong>{{ formState.guest_name }}</strong>
        </p>

        <!-- Progress bar (only when we have more than one step) -->
        <div v-if="steps.length > 1" class="gr-progress">
          <div class="gr-progress-fill" :style="{ width: `${progressPercent}%` }" />
        </div>

        <!-- Step content with fade-slide transition -->
        <transition name="gr-step" mode="out-in">
          <div :key="currentStepIndex" class="gr-step">
            <!-- STATUS -->
            <template v-if="currentStep?.kind === 'status'">
              <p class="gr-prompt">{{ t('rsvp_question') }}</p>
              <div class="gr-options" role="radiogroup" :aria-label="t('rsvp_question')">
                <button
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  type="button"
                  class="v2-radio-pill gr-pill"
                  :class="{ 'v2-radio-pill--on': rsvpStatus === opt.value }"
                  :aria-pressed="rsvpStatus === opt.value"
                  @click="selectStatus(opt.value)"
                >
                  {{ opt.label }}
                </button>
              </div>
            </template>

            <!-- PLUS-ONES (count + names combined) -->
            <template v-else-if="currentStep?.kind === 'plus_ones'">
              <p class="gr-prompt">{{ tr('rsvp_plus_ones_label') }}</p>
              <p class="gr-hint">{{ plusOnesHelperText }}</p>
              <div class="gr-stepper">
                <button
                  type="button"
                  class="gr-stepper-btn"
                  :disabled="plusOnesCount <= 0"
                  aria-label="−"
                  @click="decrementPlusOnes"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6H10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                </button>
                <span class="gr-stepper-value">{{ plusOnesCount }}</span>
                <button
                  type="button"
                  class="gr-stepper-btn"
                  :disabled="plusOnesCount >= formState.max_plus_ones"
                  aria-label="+"
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
              <input
                v-if="plusOnesCount > 0"
                v-model="plusOnesNames"
                type="text"
                class="gr-line-input"
                :placeholder="tr('rsvp_plus_ones_names_placeholder')"
                :maxlength="300"
                :aria-label="tr('rsvp_plus_ones_names_label')"
              />
            </template>

            <!-- QUESTION (one per step) -->
            <template v-else-if="currentStep?.kind === 'question' && currentQuestion">
              <p
                class="gr-prompt"
                :class="{ 'gr-prompt--error': requiredMissingIds.has(currentQuestion.id) }"
              >
                <span>{{ currentQuestion.displayText }}</span>
                <span v-if="currentQuestion.is_required" class="gr-required-star" aria-hidden="true"
                  >*</span
                >
              </p>

              <!-- text -->
              <input
                v-if="currentQuestion.question_type === 'text'"
                v-model="answerSlot(currentQuestion.id).answer_text"
                type="text"
                class="gr-line-input"
                :placeholder="tr('rsvp_text_placeholder')"
                :maxlength="200"
              />

              <!-- long_text -->
              <textarea
                v-else-if="currentQuestion.question_type === 'long_text'"
                v-model="answerSlot(currentQuestion.id).answer_text"
                class="gr-line-textarea"
                :placeholder="tr('rsvp_long_text_placeholder')"
                :maxlength="2000"
                rows="3"
              ></textarea>

              <!-- yes_no -->
              <div v-else-if="currentQuestion.question_type === 'yes_no'" class="gr-options">
                <button
                  type="button"
                  class="v2-radio-pill gr-pill"
                  :class="{ 'v2-radio-pill--on': answerSlot(currentQuestion.id).answer_text === 'yes' }"
                  :aria-pressed="answerSlot(currentQuestion.id).answer_text === 'yes'"
                  @click="setYesNo(currentQuestion.id, 'yes')"
                >
                  {{ t('yes') }}
                </button>
                <button
                  type="button"
                  class="v2-radio-pill gr-pill"
                  :class="{ 'v2-radio-pill--on': answerSlot(currentQuestion.id).answer_text === 'no' }"
                  :aria-pressed="answerSlot(currentQuestion.id).answer_text === 'no'"
                  @click="setYesNo(currentQuestion.id, 'no')"
                >
                  {{ t('no') }}
                </button>
              </div>

              <!-- single_choice -->
              <div v-else-if="currentQuestion.question_type === 'single_choice'" class="gr-options">
                <button
                  v-for="(choice, idx) in currentQuestion.displayChoices"
                  :key="currentQuestion.originalChoices[idx]"
                  type="button"
                  class="v2-radio-pill gr-pill"
                  :class="{
                    'v2-radio-pill--on':
                      answerSlot(currentQuestion.id).answer_text ===
                      currentQuestion.originalChoices[idx],
                  }"
                  :aria-pressed="
                    answerSlot(currentQuestion.id).answer_text ===
                    currentQuestion.originalChoices[idx]
                  "
                  @click="selectSingleChoice(currentQuestion.id, currentQuestion.originalChoices[idx])"
                >
                  {{ choice }}
                </button>
              </div>

              <!-- multi_choice -->
              <div v-else-if="currentQuestion.question_type === 'multi_choice'" class="gr-options">
                <button
                  v-for="(choice, idx) in currentQuestion.displayChoices"
                  :key="currentQuestion.originalChoices[idx]"
                  type="button"
                  class="v2-radio-pill gr-pill"
                  :class="{
                    'v2-radio-pill--on': isChoiceSelected(
                      currentQuestion.id,
                      currentQuestion.originalChoices[idx],
                    ),
                  }"
                  :aria-pressed="
                    isChoiceSelected(currentQuestion.id, currentQuestion.originalChoices[idx])
                  "
                  @click="toggleChoice(currentQuestion.id, currentQuestion.originalChoices[idx])"
                >
                  {{ choice }}
                </button>
              </div>
            </template>

            <!-- PRIVATE NOTE -->
            <template v-else-if="currentStep?.kind === 'private_note'">
              <p class="gr-prompt">{{ t('private_note') }}</p>
              <textarea
                v-model="privateNote"
                class="gr-line-textarea"
                :placeholder="t('note_optional')"
                :maxlength="500"
                rows="3"
                :aria-label="t('private_note')"
              ></textarea>
            </template>
          </div>
        </transition>

        <p v-if="errorMessage" class="v2-form-error gr-msg" role="alert">{{ errorMessage }}</p>

        <!-- Wizard navigation -->
        <div class="gr-nav">
          <button
            v-if="!isFirstStep"
            type="button"
            class="v2-btn v2-btn--ghost gr-nav-back"
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
            <span>{{ tr('rsvp_wizard_back') }}</span>
          </button>

          <button
            v-if="!isLastStep"
            type="button"
            class="v2-btn v2-btn--primary gr-nav-main"
            :disabled="!canProceed"
            @click="goNext"
          >
            <span>{{ tr('rsvp_wizard_next') }}</span>
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
            class="v2-btn v2-btn--primary gr-nav-main"
            :disabled="!canProceed || submitting"
          >
            <span v-if="submitting" class="gr-spinner-inline" aria-hidden="true"></span>
            <span v-else>{{ submitButtonLabel }}</span>
          </button>
        </div>
      </form>
    </div>
  </V2ChapterShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import V2ChapterShell from './V2ChapterShell.vue'
import { translateV2, type V2TranslationKey } from '../../../composables/showcase-v2/v2Translations'
import { guestRsvpService } from '../../../services/api'
import type {
  GuestRsvpAnswer,
  GuestRsvpFormState,
  GuestRsvpStatus,
} from '../../../services/api/types/rsvp.types'
import {
  translateRSVP,
  toKhmerNumerals,
  type SupportedLanguage,
} from '../../../utils/translations'

interface Props {
  chapterNumber: number
  title: string
  eventId: string
  guestShortcode?: string | null
  currentLanguage?: string
}

const props = defineProps<Props>()

const t = (key: V2TranslationKey) => translateV2(key, props.currentLanguage)
const currentLang = computed<SupportedLanguage>(
  () => (props.currentLanguage as SupportedLanguage) || 'en',
)
const tr = (key: Parameters<typeof translateRSVP>[0]) => translateRSVP(key, currentLang.value)

// ---- State ---------------------------------------------------------------
const loading = ref(false)
const submitting = ref(false)
const loadError = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const formState = ref<GuestRsvpFormState | null>(null)
const rsvpStatus = ref<GuestRsvpStatus>('pending')
const plusOnesCount = ref(0)
const plusOnesNames = ref('')
const privateNote = ref('')
const requiredMissingIds = ref<Set<number>>(new Set())

// Drives the submit → collapsed-summary transition; "Edit response" flips
// this back on so the guest can revise.
const isEditing = ref(false)

type AnswerState = { answer_text: string; answer_choices: string[] }
const answers = reactive<Record<number, AnswerState>>({})

const answerSlot = (questionId: number): AnswerState => {
  if (!answers[questionId]) {
    answers[questionId] = { answer_text: '', answer_choices: [] }
  }
  return answers[questionId]
}

const isChoiceSelected = (questionId: number, choice: string) =>
  answerSlot(questionId).answer_choices.includes(choice)

const toggleChoice = (questionId: number, choice: string) => {
  const slot = answerSlot(questionId)
  const idx = slot.answer_choices.indexOf(choice)
  if (idx === -1) slot.answer_choices.push(choice)
  else slot.answer_choices.splice(idx, 1)
  requiredMissingIds.value.delete(questionId)
}

// ---- Wizard state --------------------------------------------------------
// Step-by-step wizard: status → plus-ones → each custom question → private
// note. Irrelevant steps (plus-ones/questions when declining) are skipped.
const currentStepIndex = ref(0)
let successTimeout: ReturnType<typeof setTimeout> | null = null
let autoAdvanceTimeout: ReturnType<typeof setTimeout> | null = null

type WizardStepKind = 'status' | 'plus_ones' | 'question' | 'private_note'
interface WizardStep {
  kind: WizardStepKind
  questionId?: number
}

// ---- Computed ------------------------------------------------------------
const hasSubmittedRsvp = computed(
  () => !!formState.value?.rsvp_responded_at && rsvpStatus.value !== 'pending',
)

const showCollapsedSummary = computed(() => hasSubmittedRsvp.value && !isEditing.value)

const attendingLike = computed(
  () => rsvpStatus.value === 'attending' || rsvpStatus.value === 'maybe',
)

const statusOptions = computed(() => [
  { value: 'attending' as GuestRsvpStatus, label: t('rsvp_accept') },
  { value: 'maybe' as GuestRsvpStatus, label: tr('rsvp_status_maybe_label') },
  { value: 'not_attending' as GuestRsvpStatus, label: t('rsvp_decline') },
])

const plusOnesHelperText = computed(() =>
  tr('rsvp_plus_ones_helper').replace('{max}', String(formState.value?.max_plus_ones ?? 0)),
)

const submitButtonLabel = computed(() =>
  formState.value?.rsvp_responded_at ? tr('rsvp_update_button') : tr('rsvp_submit_button'),
)

// Seat ticket — visible for attending/maybe responses only; declined guests
// don't need their seat assignment.
const showTableTicket = computed(() => !!formState.value?.table && attendingLike.value)

const seatNumberDisplay = computed(() => {
  const seat = formState.value?.table?.seat_number
  if (!seat) return ''
  return currentLang.value === 'kh' ? toKhmerNumerals(seat) : String(seat)
})

const enterEditMode = () => {
  isEditing.value = true
  currentStepIndex.value = 0
  errorMessage.value = ''
  successMessage.value = ''
}

// Localized question text + choices: translation choices pair with the base
// `choices` array BY INDEX; submitted values are always the original choices
const localizedQuestions = computed(() => {
  const lang = props.currentLanguage || 'en'
  return [...(formState.value?.questions ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((q) => {
      const translation = q.translations?.find((x) => x.language === lang)
      const displayChoices =
        translation?.choices && translation.choices.length === q.choices.length
          ? translation.choices
          : q.choices
      return {
        ...q,
        displayText: translation?.question_text || q.question_text,
        displayChoices,
        originalChoices: q.choices,
      }
    })
})

// ---- Wizard navigation ---------------------------------------------------
const steps = computed<WizardStep[]>(() => {
  if (!formState.value) return []
  const out: WizardStep[] = [{ kind: 'status' }]
  if (rsvpStatus.value === 'pending') return out

  if (attendingLike.value && formState.value.max_plus_ones > 0) {
    out.push({ kind: 'plus_ones' })
  }

  if (attendingLike.value) {
    for (const q of localizedQuestions.value) {
      out.push({ kind: 'question', questionId: q.id })
    }
  }

  out.push({ kind: 'private_note' })
  return out
})

const currentStep = computed<WizardStep | null>(() => steps.value[currentStepIndex.value] ?? null)

const currentQuestion = computed(() => {
  if (currentStep.value?.kind !== 'question') return null
  const qid = currentStep.value.questionId
  return localizedQuestions.value.find((q) => q.id === qid) ?? null
})

const isFirstStep = computed(() => currentStepIndex.value === 0)
const isLastStep = computed(() => currentStepIndex.value >= steps.value.length - 1)

const progressPercent = computed(() => {
  const total = steps.value.length
  if (total <= 1) return 100
  return Math.round(((currentStepIndex.value + 1) / total) * 100)
})

// Gate the Next/Submit button — only the currently-visible step is validated
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
      if (q.question_type === 'multi_choice') return slot.answer_choices.length > 0
      return slot.answer_text.trim().length > 0
    }
    case 'private_note':
      return true
    default:
      return false
  }
})

// Auto-advance after single-tap selections (status, yes/no, single choice)
// so the guest doesn't need an extra "Next" tap. Short delay keeps the
// active state visible before the step transition; manual navigation
// cancels any pending advance so taps never double-skip.
const queueAutoAdvance = () => {
  if (autoAdvanceTimeout) clearTimeout(autoAdvanceTimeout)
  autoAdvanceTimeout = setTimeout(() => {
    autoAdvanceTimeout = null
    if (!isLastStep.value && canProceed.value) {
      currentStepIndex.value++
      errorMessage.value = ''
    }
  }, 350)
}

const cancelAutoAdvance = () => {
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout)
    autoAdvanceTimeout = null
  }
}

const selectStatus = (status: GuestRsvpStatus) => {
  rsvpStatus.value = status
  requiredMissingIds.value.clear()
  errorMessage.value = ''
  queueAutoAdvance()
}

const setYesNo = (questionId: number, value: 'yes' | 'no') => {
  answerSlot(questionId).answer_text = value
  requiredMissingIds.value.delete(questionId)
  queueAutoAdvance()
}

const selectSingleChoice = (questionId: number, choice: string) => {
  answerSlot(questionId).answer_text = choice
  requiredMissingIds.value.delete(questionId)
  queueAutoAdvance()
}

const goNext = () => {
  cancelAutoAdvance()
  if (!canProceed.value) {
    if (currentStep.value?.kind === 'question' && currentQuestion.value?.is_required) {
      requiredMissingIds.value.add(currentQuestion.value.id)
    }
    return
  }
  if (isLastStep.value) return // submit button handles the last step
  currentStepIndex.value++
  errorMessage.value = ''
}

const goBack = () => {
  cancelAutoAdvance()
  if (isFirstStep.value) return
  currentStepIndex.value--
  errorMessage.value = ''
}

// If the active step list shrinks (e.g. user flips from attending to
// not_attending on step 0), clamp the index so we never render past the end.
watch(steps, (newSteps) => {
  if (currentStepIndex.value >= newSteps.length) {
    currentStepIndex.value = Math.max(0, newSteps.length - 1)
  }
})

const incrementPlusOnes = () => {
  if (!formState.value) return
  if (plusOnesCount.value < formState.value.max_plus_ones) plusOnesCount.value++
}

const decrementPlusOnes = () => {
  if (plusOnesCount.value > 0) {
    plusOnesCount.value--
    if (plusOnesCount.value === 0) plusOnesNames.value = ''
  }
}

// ---- Load + submit -------------------------------------------------------
const applyFormState = (state: GuestRsvpFormState) => {
  formState.value = state
  rsvpStatus.value = state.rsvp_status
  plusOnesCount.value = state.plus_ones_count || 0
  plusOnesNames.value = state.plus_ones_names || ''
  privateNote.value = state.private_note_to_host || ''

  for (const key of Object.keys(answers)) {
    delete answers[Number(key)]
  }
  for (const q of state.questions) answerSlot(q.id)
  for (const a of state.answers ?? []) {
    const slot = answerSlot(a.question_id)
    if (typeof a.answer_text === 'string') slot.answer_text = a.answer_text
    if (Array.isArray(a.answer_choices)) slot.answer_choices = [...a.answer_choices]
  }
  requiredMissingIds.value.clear()
  currentStepIndex.value = 0
}

const load = async () => {
  if (!props.guestShortcode) return
  loading.value = true
  loadError.value = ''
  errorMessage.value = ''
  try {
    const response = await guestRsvpService.getGuestRsvp(props.eventId, props.guestShortcode)
    if (response.success && response.data) {
      applyFormState(response.data)
    } else {
      loadError.value = response.message || tr('rsvp_load_failed')
    }
  } catch {
    loadError.value = tr('rsvp_load_failed')
  } finally {
    loading.value = false
  }
}

const buildAnswersPayload = (): GuestRsvpAnswer[] => {
  const payload: GuestRsvpAnswer[] = []
  for (const q of localizedQuestions.value) {
    const slot = answerSlot(q.id)
    if (q.question_type === 'multi_choice') {
      if (slot.answer_choices.length > 0) {
        payload.push({ question_id: q.id, answer_choices: [...slot.answer_choices] })
      }
    } else {
      const trimmed = slot.answer_text.trim()
      if (trimmed) {
        payload.push({
          question_id: q.id,
          answer_text: q.question_type === 'yes_no' ? trimmed.toLowerCase() : trimmed,
        })
      }
    }
  }
  return payload
}

const validateRequired = (): boolean => {
  if (!attendingLike.value) {
    requiredMissingIds.value.clear()
    return true
  }
  const missing = new Set<number>()
  for (const q of localizedQuestions.value) {
    if (!q.is_required) continue
    const slot = answerSlot(q.id)
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
  if (!props.guestShortcode || !formState.value || submitting.value) return
  if (rsvpStatus.value === 'pending') return

  errorMessage.value = ''
  successMessage.value = ''

  if (!validateRequired()) {
    errorMessage.value = tr('rsvp_required_missing')
    return
  }

  const clampedPlusOnes = attendingLike.value
    ? Math.min(Math.max(0, plusOnesCount.value), formState.value.max_plus_ones)
    : 0

  submitting.value = true
  try {
    const response = await guestRsvpService.submitGuestRsvp(props.eventId, {
      guest_shortcode: props.guestShortcode,
      rsvp_status: rsvpStatus.value,
      plus_ones_count: clampedPlusOnes,
      plus_ones_names: clampedPlusOnes > 0 ? plusOnesNames.value.trim() : '',
      private_note_to_host: privateNote.value.trim(),
      answers: attendingLike.value ? buildAnswersPayload() : [],
    })
    if (response.success && response.data) {
      applyFormState(response.data)
      // Collapse into the summary; the guest can reopen via "Edit response"
      isEditing.value = false
      successMessage.value = tr('rsvp_submit_success')
      if (successTimeout) clearTimeout(successTimeout)
      successTimeout = setTimeout(() => {
        successMessage.value = ''
      }, 4000)
    } else {
      errorMessage.value = response.message || tr('rsvp_load_failed')
    }
  } catch {
    errorMessage.value = tr('rsvp_load_failed')
  } finally {
    submitting.value = false
  }
}

// ---- Lifecycle -----------------------------------------------------------
watch(
  () => props.guestShortcode,
  (shortcode) => {
    if (shortcode) load()
  },
)

onMounted(() => {
  if (props.guestShortcode) load()
})

onBeforeUnmount(() => {
  if (successTimeout) clearTimeout(successTimeout)
  cancelAutoAdvance()
})
</script>

<style scoped src="./v2-forms.css"></style>

<style scoped>
.gr-greeting {
  font-family: var(--v2-display);
  font-style: italic;
  font-size: 18px;
  color: var(--v2-blush-deep);
  text-align: center;
  margin-bottom: 4px;
}

.gr-note,
.v2-gr-note {
  font-family: var(--v2-display);
  font-style: italic;
  font-size: 16px;
  text-align: center;
  color: var(--v2-sage-deep);
  padding: 8px 0;
}

/* ---- Wizard -------------------------------------------------------------- */
.gr-wizard {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: stretch;
}

.gr-progress {
  width: 100%;
  max-width: 220px;
  height: 3px;
  margin: 0 auto;
  background: rgba(168, 181, 160, 0.3);
  border-radius: 999px;
  overflow: hidden;
}

.gr-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--v2-gold), var(--v2-blush-deep));
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.gr-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-height: 96px;
  text-align: center;
}

.gr-prompt {
  font-family: var(--v2-body);
  font-size: 15px;
  color: var(--v2-charcoal);
  line-height: 1.4;
  max-width: 24rem;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}

.gr-prompt--error {
  color: #b4544f;
}

.gr-hint {
  font-size: 13px;
  color: var(--v2-ink-soft);
  line-height: 1.3;
  margin-top: -6px;
}

.gr-required-star {
  color: #b4544f;
  font-weight: 700;
}

/* Step transition */
.gr-step-enter-active,
.gr-step-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.gr-step-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.gr-step-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

/* Option pills — centered wrap row; pills size to their content instead of
   stretching (v2-radio-pill defaults to flex: 1) */
.gr-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.gr-pill {
  flex: none;
  padding: 8px 20px;
}

/* Stepper */
.gr-stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.gr-stepper-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #d9d2c7;
  background: #fff;
  color: var(--v2-charcoal);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color 0.2s ease,
    transform 0.15s ease;
  flex-shrink: 0;
  padding: 0;
}

.gr-stepper-btn:hover:not(:disabled) {
  border-color: var(--v2-blush);
}

.gr-stepper-btn:active:not(:disabled) {
  transform: scale(0.94);
}

.gr-stepper-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.gr-stepper-value {
  font-family: var(--v2-display);
  font-size: 20px;
  color: var(--v2-charcoal);
  min-width: 24px;
  text-align: center;
}

/* Line-style inputs (underline only, no fill) — centered, V2 palette */
.gr-line-input,
.gr-line-textarea {
  width: 100%;
  max-width: 24rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid #d9d2c7;
  padding: 8px 4px;
  color: var(--v2-charcoal);
  font-family: var(--v2-body);
  font-size: 15px;
  text-align: center;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.gr-line-textarea {
  resize: vertical;
  min-height: 52px;
  line-height: 1.5;
}

.gr-line-input::placeholder,
.gr-line-textarea::placeholder {
  color: var(--v2-ink-soft);
  text-align: center;
}

.gr-line-input:focus,
.gr-line-textarea:focus {
  border-bottom-color: var(--v2-blush);
}

/* Navigation */
.gr-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-height: 44px;
}

.gr-nav-back {
  margin-right: auto;
}

.gr-nav-main {
  min-width: 120px;
}

.gr-msg {
  margin: 0;
  text-align: center;
}

.gr-spinner-inline {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--v2-ivory);
  border-radius: 999px;
  animation: v2-spin 0.8s linear infinite;
}

/* ---- Collapsed summary --------------------------------------------------- */
.gr-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  padding: 8px 0 4px;
  animation: gr-summary-fade 0.3s ease-out;
}

@keyframes gr-summary-fade {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.gr-summary .v2-success-big,
.gr-summary .v2-form-hint {
  margin: 0;
}

/* Seat info — hero of the completed state. Open typography with a single
   hairline divider between the two stats; no box so it doesn't double-frame
   inside the form card. */
.gr-seat-ticket {
  display: inline-flex;
  align-items: stretch;
  gap: 26px;
  padding: 4px 0;
}

.gr-seat-divider {
  width: 1px;
  align-self: stretch;
  background: rgba(168, 181, 160, 0.5);
  flex-shrink: 0;
}

.gr-seat-stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  text-align: center;
  min-width: 72px;
}

/* Table-only layout: label and value on one baseline-aligned line */
.gr-seat-stat--inline {
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  min-width: 0;
}

.gr-seat-label {
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--v2-sage-deep);
  line-height: 1.2;
  white-space: nowrap;
}

.gr-seat-value {
  font-family: var(--v2-display);
  font-size: 24px;
  color: var(--v2-charcoal);
  line-height: 1.2;
  word-break: break-word;
}

.gr-success-msg {
  font-size: 13px;
  color: var(--v2-sage-deep);
  margin: -4px 0 0;
}

.gr-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

@media (prefers-reduced-motion: reduce) {
  .gr-step-enter-active,
  .gr-step-leave-active,
  .gr-progress-fill {
    transition: none;
  }

  .gr-summary {
    animation: none;
  }
}
</style>
