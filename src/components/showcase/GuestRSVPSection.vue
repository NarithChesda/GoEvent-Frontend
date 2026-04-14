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

    <!-- Form -->
    <form
      v-else-if="formState"
      class="rsvp-form"
      @submit.prevent="handleSubmit"
    >
      <!-- Status dropdown -->
      <div ref="statusDropdownRef" class="status-dropdown">
        <button
          type="button"
          class="dropdown-trigger"
          :class="{ open: isStatusDropdownOpen, filled: rsvpStatus !== 'pending' }"
          :style="{ fontFamily: secondaryFont || currentFont }"
          :aria-haspopup="'listbox'"
          :aria-expanded="isStatusDropdownOpen"
          @click="toggleStatusDropdown"
        >
          <span class="dropdown-chevron-spacer" aria-hidden="true"></span>
          <span
            class="dropdown-label"
            :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
          >{{ selectedStatusLabel }}</span>
          <svg
            class="dropdown-chevron"
            :class="{ open: isStatusDropdownOpen }"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 4.5l3 3 3-3"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <transition name="dropdown-fade">
          <ul
            v-if="isStatusDropdownOpen"
            class="dropdown-menu"
            role="listbox"
            :style="{ fontFamily: secondaryFont || currentFont }"
          >
            <li v-for="opt in statusOptions" :key="opt.value">
              <button
                type="button"
                class="dropdown-option"
                :class="{ selected: rsvpStatus === opt.value }"
                role="option"
                :aria-selected="rsvpStatus === opt.value"
                @click="selectStatus(opt.value)"
              >
                <span
                  :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
                >{{ opt.label }}</span>
                <svg
                  v-if="rsvpStatus === opt.value"
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8.5l3 3 7-7"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </li>
          </ul>
        </transition>
      </div>

      <!-- Plus-ones stepper: inline compact -->
      <div
        v-if="showAttendingExtras && formState.max_plus_ones > 0"
        class="inline-row"
      >
        <div class="inline-label-group">
          <span
            class="inline-label"
            :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
            :style="{ fontFamily: secondaryFont || currentFont }"
          >{{ plusOnesLabel }}</span>
          <span
            class="inline-hint"
            :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
            :style="{ fontFamily: secondaryFont || currentFont }"
          >{{ plusOnesHelperText }}</span>
        </div>
        <div class="stepper">
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
      </div>

      <!-- Plus-ones names (line input) -->
      <div
        v-if="showAttendingExtras && plusOnesCount > 0"
        class="field"
      >
        <input
          v-model="plusOnesNames"
          type="text"
          class="line-input"
          :placeholder="plusOnesNamesPlaceholder"
          :maxlength="300"
          :aria-label="plusOnesNamesLabel"
          :style="{ fontFamily: secondaryFont || currentFont }"
        />
      </div>

      <!-- Dynamic questions -->
      <div
        v-if="showAttendingExtras && localizedQuestions.length > 0"
        class="questions-list"
      >
        <div
          v-for="q in localizedQuestions"
          :key="q.id"
          class="question-item"
        >
          <label
            class="question-label"
            :class="[
              currentLanguage === 'kh' && 'khmer-text-fix',
              requiredMissingIds.has(q.id) && 'label-error',
            ]"
            :style="{ fontFamily: secondaryFont || currentFont }"
          >
            <span>{{ q.question_text }}</span>
            <span v-if="q.is_required" class="required-star" aria-hidden="true">*</span>
          </label>

          <!-- text -->
          <input
            v-if="q.question_type === 'text'"
            v-model="answers[q.id].answer_text"
            type="text"
            class="line-input"
            :placeholder="textPlaceholder"
            :maxlength="200"
            :style="{ fontFamily: secondaryFont || currentFont }"
          />

          <!-- long_text -->
          <textarea
            v-else-if="q.question_type === 'long_text'"
            v-model="answers[q.id].answer_text"
            class="line-textarea"
            :placeholder="longTextPlaceholder"
            :maxlength="2000"
            rows="2"
            :style="{ fontFamily: secondaryFont || currentFont }"
          />

          <!-- yes_no -->
          <div
            v-else-if="q.question_type === 'yes_no'"
            class="chips-row"
          >
            <button
              type="button"
              class="chip"
              :class="{ active: answers[q.id].answer_text === 'yes' }"
              :style="{
                fontFamily: secondaryFont || currentFont,
                color: answers[q.id].answer_text === 'yes' ? (backgroundColor || primaryColor) : 'white',
                background: answers[q.id].answer_text === 'yes' ? 'white' : 'transparent',
              }"
              @click="setYesNo(q.id, 'yes')"
            >{{ yesOptionText }}</button>
            <button
              type="button"
              class="chip"
              :class="{ active: answers[q.id].answer_text === 'no' }"
              :style="{
                fontFamily: secondaryFont || currentFont,
                color: answers[q.id].answer_text === 'no' ? (backgroundColor || primaryColor) : 'white',
                background: answers[q.id].answer_text === 'no' ? 'white' : 'transparent',
              }"
              @click="setYesNo(q.id, 'no')"
            >{{ noOptionText }}</button>
          </div>

          <!-- single_choice -->
          <div
            v-else-if="q.question_type === 'single_choice'"
            class="chips-wrap"
          >
            <button
              v-for="(display, idx) in q.displayChoices"
              :key="q.originalChoices[idx]"
              type="button"
              class="chip"
              :class="{ active: answers[q.id].answer_text === q.originalChoices[idx] }"
              :style="{
                fontFamily: secondaryFont || currentFont,
                color: answers[q.id].answer_text === q.originalChoices[idx] ? (backgroundColor || primaryColor) : 'white',
                background: answers[q.id].answer_text === q.originalChoices[idx] ? 'white' : 'transparent',
              }"
              @click="selectSingleChoice(q.id, q.originalChoices[idx])"
            >{{ display }}</button>
          </div>

          <!-- multi_choice -->
          <div
            v-else-if="q.question_type === 'multi_choice'"
            class="chips-wrap"
          >
            <button
              v-for="(display, idx) in q.displayChoices"
              :key="q.originalChoices[idx]"
              type="button"
              class="chip"
              :class="{ active: isChoiceSelected(q.id, q.originalChoices[idx]) }"
              :style="{
                fontFamily: secondaryFont || currentFont,
                color: isChoiceSelected(q.id, q.originalChoices[idx]) ? (backgroundColor || primaryColor) : 'white',
                background: isChoiceSelected(q.id, q.originalChoices[idx]) ? 'white' : 'transparent',
              }"
              @click="toggleMultiChoice(q.id, q.originalChoices[idx])"
            >{{ display }}</button>
          </div>
        </div>
      </div>

      <!-- Private note (line textarea) -->
      <div v-if="rsvpStatus !== 'pending'" class="field">
        <textarea
          v-model="privateNote"
          class="line-textarea"
          :placeholder="privateNotePlaceholder"
          :maxlength="500"
          rows="2"
          :aria-label="privateNoteLabel"
          :style="{ fontFamily: secondaryFont || currentFont }"
        />
      </div>

      <!-- Submit -->
      <button
        v-if="rsvpStatus !== 'pending'"
        type="submit"
        class="submit-btn"
        :disabled="isSubmitting"
        :style="{
          fontFamily: secondaryFont || currentFont,
          color: backgroundColor || primaryColor,
        }"
      >
        <div v-if="isSubmitting" class="spinner-inline"></div>
        <span v-else>{{ submitButtonLabel }}</span>
      </button>

      <!-- Status messages -->
      <div v-if="successMessage || errorMessage" class="rsvp-message">
        <span v-if="successMessage" class="message-text success">
          {{ successMessage }}
        </span>
        <span v-if="errorMessage" class="message-text error">
          {{ errorMessage }}
        </span>
      </div>

      <!-- Last-updated timestamp -->
      <div
        v-if="formState.rsvp_responded_at && !successMessage && !errorMessage"
        class="responded-at"
        :style="{ fontFamily: secondaryFont || currentFont }"
      >
        {{ respondedAtText }}
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

const isStatusDropdownOpen = ref(false)
const statusDropdownRef = ref<HTMLElement | null>(null)

let successTimeout: ReturnType<typeof setTimeout> | null = null

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

const showAttendingExtras = computed(
  () => rsvpStatus.value === 'attending' || rsvpStatus.value === 'maybe',
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

const selectedStatusLabel = computed(() => {
  if (rsvpStatus.value === 'pending') return statusPlaceholderText.value
  const opt = statusOptions.value.find((o) => o.value === rsvpStatus.value)
  return opt?.label || statusPlaceholderText.value
})

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

const submitButtonLabel = computed(() => {
  if (formState.value?.rsvp_responded_at) {
    return translateRSVP('rsvp_update_button', currentLang.value)
  }
  return translateRSVP('rsvp_submit_button', currentLang.value)
})

const respondedAtText = computed(() => {
  if (!formState.value?.rsvp_responded_at) return ''
  const template = translateRSVP('rsvp_responded_at', currentLang.value)
  const date = new Date(formState.value.rsvp_responded_at)
  const formatted = Number.isNaN(date.getTime())
    ? formState.value.rsvp_responded_at
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
  return template.replace('{date}', formatted)
})

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

// ---- Dropdown helpers ----------------------------------------------------
const toggleStatusDropdown = () => {
  isStatusDropdownOpen.value = !isStatusDropdownOpen.value
}

const closeStatusDropdown = () => {
  isStatusDropdownOpen.value = false
}

const selectStatus = (status: GuestRsvpStatus) => {
  rsvpStatus.value = status
  requiredMissingIds.value.clear()
  errorMessage.value = ''
  closeStatusDropdown()
}

const handleDocumentClick = (event: MouseEvent) => {
  if (!isStatusDropdownOpen.value) return
  const el = statusDropdownRef.value
  if (el && !el.contains(event.target as Node)) {
    closeStatusDropdown()
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isStatusDropdownOpen.value) {
    closeStatusDropdown()
  }
}

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
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleEscape)
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

/* Form */
.rsvp-form {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  align-items: stretch;
}

/* Status dropdown */
.status-dropdown {
  position: relative;
  display: flex;
  justify-content: center;
}

.dropdown-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.55rem;
  min-width: 10rem;
  max-width: 100%;
  padding: 0.5rem 0.95rem;
  background: transparent;
  color: white;
  border: 1.2px solid rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.dropdown-trigger:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.85);
}

.dropdown-trigger.open,
.dropdown-trigger.filled {
  border-color: white;
}

.dropdown-trigger.filled {
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-label {
  flex: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-chevron-spacer {
  width: 12px;
  flex-shrink: 0;
}

.dropdown-chevron {
  flex-shrink: 0;
  transition: transform 0.2s ease;
  opacity: 0.85;
}

.dropdown-chevron.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 50%;
  transform: translateX(-50%);
  min-width: 11rem;
  max-width: 14rem;
  list-style: none;
  margin: 0;
  padding: 0.25rem;
  background: rgba(20, 20, 20, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  z-index: 20;
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}

.dropdown-option {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  color: white;
  font-size: 0.78rem;
  text-align: left;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dropdown-option:hover {
  background: rgba(255, 255, 255, 0.12);
}

.dropdown-option.selected {
  background: rgba(255, 255, 255, 0.18);
  font-weight: 500;
}

/* Dropdown transition */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -4px);
}

/* Inline row (label + stepper) */
.inline-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.15rem 0.1rem;
}

.inline-label-group {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.inline-label {
  font-size: 0.78rem;
  font-weight: 500;
  color: white;
  line-height: 1.2;
}

.inline-hint {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.2;
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

/* Questions */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.question-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.question-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.74rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.01em;
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

/* Submit */
.submit-btn {
  align-self: center;
  min-width: 8.5rem;
  padding: 0.5rem 1.3rem;
  border-radius: 999px;
  background: white;
  border: none;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.7;
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

/* Mobile */
@media (max-width: 639px) {
  .dropdown-trigger {
    min-width: 9rem;
    font-size: 0.76rem;
    padding: 0.45rem 0.85rem;
  }

  .dropdown-option {
    font-size: 0.75rem;
    padding: 0.5rem 0.7rem;
  }

  .inline-row {
    gap: 0.5rem;
  }

  .chip {
    font-size: 0.7rem;
    padding: 0.3rem 0.7rem;
  }

  .submit-btn {
    width: 100%;
    min-width: 0;
  }
}

/* 13-inch laptops — align with the rest of EventInfo's tight scale */
@media (min-width: 1024px) and (max-width: 1365px) {
  .rsvp-form {
    gap: 0.5rem;
  }

  .rsvp-title {
    font-size: 0.66rem;
  }

  .dropdown-trigger {
    min-width: 7.5rem;
    padding: 0.35rem 0.7rem;
    font-size: 0.6rem;
    border-width: 1px;
  }

  .dropdown-menu {
    min-width: 8.5rem;
    padding: 0.2rem;
  }

  .dropdown-option {
    font-size: 0.6rem;
    padding: 0.35rem 0.55rem;
  }

  .inline-label {
    font-size: 0.6rem;
  }

  .inline-hint {
    font-size: 0.52rem;
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

  .question-label {
    font-size: 0.58rem;
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

  .submit-btn {
    min-width: 6.5rem;
    padding: 0.38rem 0.9rem;
    font-size: 0.62rem;
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
}
</style>
