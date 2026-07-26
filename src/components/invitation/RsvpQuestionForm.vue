<template>
  <!--
    Inline question editor. This used to be a modal stacked on top of the
    questions drawer; editing in place keeps the whole flow at one overlay
    deep. Mounts fresh per open (v-if + :key in the parent), so fields are
    seeded once at creation rather than watched — same contract as
    InlineGroupForm.
  -->
  <div
    class="rounded-2xl border border-emerald-200 bg-white p-3 shadow-sm ring-1 ring-emerald-100/70 sm:p-4"
  >
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between gap-2">
      <div class="flex min-w-0 items-center gap-2 text-emerald-700">
        <component :is="isEdit ? Edit2 : Plus" class="h-4 w-4 flex-shrink-0" />
        <span class="truncate text-sm font-semibold">
          {{
            isEdit
              ? t('management.rsvpQuestions.modal.editTitle')
              : t('management.rsvpQuestions.modal.addTitle')
          }}
        </span>
      </div>
      <button
        type="button"
        class="-m-1 flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        :disabled="isSaving"
        :title="t('management.rsvpQuestions.actions.cancel')"
        :aria-label="t('management.rsvpQuestions.actions.cancel')"
        @click="$emit('cancel')"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <!-- Question type -->
      <div class="space-y-2.5">
        <h3
          class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
        >
          <LayoutGrid class="h-3.5 w-3.5" />
          {{ t('management.rsvpQuestions.modal.typeLabel') }}
          <span class="normal-case text-red-500">*</span>
        </h3>
        <div
          class="grid grid-cols-2 gap-2 sm:grid-cols-3"
          role="radiogroup"
          :aria-label="t('management.rsvpQuestions.modal.typeLabel')"
        >
          <button
            v-for="opt in typeOptions"
            :key="opt.value"
            type="button"
            role="radio"
            :aria-checked="formData.question_type === opt.value"
            class="flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            :class="
              formData.question_type === opt.value
                ? 'border-emerald-400 bg-emerald-50/70 ring-1 ring-emerald-400'
                : 'border-transparent bg-slate-50 hover:bg-slate-100'
            "
            @click="formData.question_type = opt.value"
          >
            <span
              class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors"
              :class="
                formData.question_type === opt.value
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-white text-slate-500 shadow-sm ring-1 ring-slate-900/5'
              "
            >
              <component :is="opt.icon" class="h-4 w-4" aria-hidden="true" />
            </span>
            <span
              class="text-xs font-semibold leading-snug"
              :class="formData.question_type === opt.value ? 'text-emerald-900' : 'text-slate-700'"
            >
              {{ opt.label }}
            </span>
          </button>
        </div>
        <p class="text-xs text-slate-500">{{ selectedTypeDescription }}</p>
      </div>

      <!-- Required toggle -->
      <div
        class="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-700">
            {{ t('management.rsvpQuestions.modal.requiredLabel') }}
          </p>
          <p class="mt-0.5 text-xs text-slate-500">
            {{ t('management.rsvpQuestions.modal.requiredHint') }}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="formData.is_required"
          :aria-label="t('management.rsvpQuestions.modal.requiredLabel')"
          class="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          :class="formData.is_required ? 'bg-emerald-500' : 'bg-slate-200'"
          @click="formData.is_required = !formData.is_required"
        >
          <span
            class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
            :class="formData.is_required ? 'translate-x-5' : 'translate-x-0'"
          />
        </button>
      </div>

      <!-- Question text (paired EN + KH) -->
      <div class="space-y-2.5">
        <h3
          class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
        >
          <Languages class="h-3.5 w-3.5" />
          {{ t('management.rsvpQuestions.modal.questionTextLabel') }}
          <span class="normal-case text-red-500">*</span>
        </h3>
        <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <span
              class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400"
            >
              {{ t('management.rsvpQuestions.modal.questionTextEnglish') }}
            </span>
            <input
              ref="questionInputRef"
              v-model="formData.question_text"
              type="text"
              maxlength="300"
              :placeholder="t('management.rsvpQuestions.modal.questionTextPlaceholder')"
              class="w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm transition-all focus:border-emerald-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              :class="
                fieldErrors.questionText
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                  : 'border-transparent'
              "
              :aria-invalid="fieldErrors.questionText ? 'true' : undefined"
              :aria-describedby="fieldErrors.questionText ? 'rsvp-question-text-error' : undefined"
            />
          </div>
          <div>
            <span
              class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400"
            >
              {{ t('management.rsvpQuestions.modal.questionTextKhmer') }}
            </span>
            <input
              v-model="formData.question_text_kh"
              type="text"
              maxlength="300"
              :placeholder="t('management.rsvpQuestions.modal.questionTextKhmerPlaceholder')"
              class="w-full rounded-xl border border-transparent bg-slate-50 px-3.5 py-2.5 text-sm transition-all focus:border-emerald-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
        <p v-if="fieldErrors.questionText" id="rsvp-question-text-error" class="text-xs text-red-600">
          {{ fieldErrors.questionText }}
        </p>
      </div>

      <!-- Choices (paired EN + KH) -->
      <div v-if="requiresChoices" class="space-y-2.5">
        <h3
          class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
        >
          <List class="h-3.5 w-3.5" />
          {{ t('management.rsvpQuestions.modal.choicesLabel') }}
          <span class="normal-case text-red-500">*</span>
        </h3>
        <p class="text-xs text-slate-500">
          {{ t('management.rsvpQuestions.modal.choicesHint') }}
        </p>

        <div class="space-y-2">
          <div
            v-for="(row, idx) in formData.choiceRows"
            :key="`choice-${idx}`"
            class="flex items-center gap-2"
          >
            <span class="w-5 flex-shrink-0 text-right text-xs tabular-nums text-slate-400">
              {{ idx + 1 }}.
            </span>
            <input
              :id="`${uid}-choice-en-${idx}`"
              v-model="row.en"
              type="text"
              maxlength="120"
              :placeholder="t('management.rsvpQuestions.modal.choiceEnglishPlaceholder')"
              class="min-w-0 flex-1 rounded-xl border bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              :class="
                fieldErrors.choices
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                  : 'border-transparent'
              "
              :aria-invalid="fieldErrors.choices ? 'true' : undefined"
              :aria-describedby="fieldErrors.choices ? 'rsvp-question-choices-error' : undefined"
              @keydown.enter.prevent="handleChoiceEnter(idx, 'en')"
            />
            <input
              :id="`${uid}-choice-kh-${idx}`"
              v-model="row.kh"
              type="text"
              maxlength="120"
              :placeholder="t('management.rsvpQuestions.modal.choiceKhmerPlaceholder')"
              class="min-w-0 flex-1 rounded-xl border border-transparent bg-slate-50 px-3 py-2 text-sm transition-all focus:border-emerald-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              @keydown.enter.prevent="handleChoiceEnter(idx, 'kh')"
            />
            <button
              type="button"
              class="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              :title="t('management.rsvpQuestions.modal.removeChoice')"
              :aria-label="t('management.rsvpQuestions.modal.removeChoice')"
              @click="removeChoice(idx)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          type="button"
          class="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-500 transition-all hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-700"
          @click="addChoice"
        >
          <Plus class="h-3.5 w-3.5" />
          {{ t('management.rsvpQuestions.modal.addChoice') }}
        </button>

        <p v-if="fieldErrors.choices" id="rsvp-question-choices-error" class="text-xs text-red-600">
          {{ fieldErrors.choices }}
        </p>
      </div>

      <!-- Generic error -->
      <div v-if="errorMessage" class="rounded-xl border border-red-200 bg-red-50 p-3">
        <p class="text-sm text-red-800">{{ errorMessage }}</p>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          class="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isSaving"
          @click="$emit('cancel')"
        >
          {{ t('management.rsvpQuestions.actions.cancel') }}
        </button>
        <button
          type="submit"
          class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isSaving || !canSave"
        >
          <span
            v-if="isSaving"
            class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          />
          <span>
            {{
              isSaving
                ? t('management.rsvpQuestions.actions.saving')
                : t('management.rsvpQuestions.actions.save')
            }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Type,
  AlignLeft,
  ToggleLeft,
  CircleDot,
  ListChecks,
  LayoutGrid,
  Languages,
  List,
} from 'lucide-vue-next'
import type {
  CreateRsvpQuestionRequest,
  EventRsvpQuestion,
  EventRsvpQuestionType,
} from '../../services/api'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    question?: EventRsvpQuestion | null
    isSaving?: boolean
  }>(),
  { question: null, isSaving: false },
)

const emit = defineEmits<{
  /** Emitted only after local validation passes. */
  save: [payload: CreateRsvpQuestionRequest]
  cancel: []
}>()

interface ChoiceRow {
  en: string
  kh: string
}

interface QuestionFormData {
  question_text: string
  question_text_kh: string
  question_type: EventRsvpQuestionType
  is_required: boolean
  choiceRows: ChoiceRow[]
}

// Choice inputs need DOM ids for the Enter-to-next-row focus hop, and more
// than one of these forms can be mounted at a time.
const uid = useId()

const seedForm = (): QuestionFormData => {
  const q = props.question
  if (!q) {
    return {
      question_text: '',
      question_text_kh: '',
      question_type: 'text',
      is_required: false,
      choiceRows: [
        { en: '', kh: '' },
        { en: '', kh: '' },
      ],
    }
  }

  const khTranslation = q.translations?.find((tr) => tr.language === 'kh')
  const khChoices = khTranslation?.choices ?? []
  // Index-pair parent choices with kh choices, padding the shorter side.
  const paired: ChoiceRow[] = (q.choices ?? []).map((en, idx) => ({
    en,
    kh: khChoices[idx] ?? '',
  }))

  return {
    question_text: q.question_text,
    question_text_kh: khTranslation?.question_text ?? '',
    question_type: q.question_type,
    is_required: q.is_required,
    choiceRows: paired.length > 0 ? paired : [{ en: '', kh: '' }, { en: '', kh: '' }],
  }
}

const formData = reactive<QuestionFormData>(seedForm())
const fieldErrors = ref<{ questionText?: string; choices?: string }>({})
const errorMessage = ref('')
const questionInputRef = ref<HTMLInputElement | null>(null)

const isEdit = computed(() => props.question !== null)

// Deeper validation (choices etc.) runs on submit with messages; this only
// gates the obvious "nothing typed yet" state.
const canSave = computed(() => formData.question_text.trim().length > 0)

const requiresChoices = computed(
  () =>
    formData.question_type === 'single_choice' ||
    formData.question_type === 'multi_choice',
)

interface TypeOption {
  value: EventRsvpQuestionType
  label: string
  icon: typeof Type
}

const typeOptions = computed<TypeOption[]>(() => [
  { value: 'text', label: t('management.rsvpQuestions.types.text'), icon: Type },
  { value: 'long_text', label: t('management.rsvpQuestions.types.long_text'), icon: AlignLeft },
  { value: 'yes_no', label: t('management.rsvpQuestions.types.yes_no'), icon: ToggleLeft },
  { value: 'single_choice', label: t('management.rsvpQuestions.types.single_choice'), icon: CircleDot },
  { value: 'multi_choice', label: t('management.rsvpQuestions.types.multi_choice'), icon: ListChecks },
])

const selectedTypeDescription = computed(() =>
  t(`management.rsvpQuestions.modal.typeDescriptions.${formData.question_type}`),
)

onMounted(() => {
  // Autofocus on desktop only — on mobile this sits inside a sheet and the
  // keyboard would cover half of it on open.
  nextTick(() => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      questionInputRef.value?.focus()
    }
  })
})

// Switching INTO a choice type with no rows seeds two blanks. Rows are kept
// when switching away, in case the user toggles back.
watch(
  () => formData.question_type,
  (next) => {
    if (
      (next === 'single_choice' || next === 'multi_choice') &&
      formData.choiceRows.length === 0
    ) {
      formData.choiceRows = [
        { en: '', kh: '' },
        { en: '', kh: '' },
      ]
    }
  },
)

const addChoice = () => {
  formData.choiceRows.push({ en: '', kh: '' })
}

// Enter inside a choice input appends a row (when on the last one) and moves
// focus down the same language column, instead of submitting the form.
const handleChoiceEnter = async (idx: number, lang: 'en' | 'kh') => {
  if (idx === formData.choiceRows.length - 1) {
    addChoice()
  }
  await nextTick()
  document.getElementById(`${uid}-choice-${lang}-${idx + 1}`)?.focus()
}

const removeChoice = (idx: number) => {
  formData.choiceRows.splice(idx, 1)
  if (formData.choiceRows.length === 0) {
    formData.choiceRows.push({ en: '', kh: '' })
  }
}

const handleSubmit = () => {
  fieldErrors.value = {}
  errorMessage.value = ''

  const questionText = formData.question_text.trim()
  if (!questionText) {
    fieldErrors.value.questionText = t(
      'management.rsvpQuestions.modal.validation.questionRequired',
    )
    return
  }

  let cleanedChoices: string[] = []
  let cleanedKhChoices: string[] = []

  if (requiresChoices.value) {
    const nonEmpty = formData.choiceRows.filter((row) => row.en.trim().length > 0)
    if (nonEmpty.length === 0) {
      fieldErrors.value.choices = t(
        'management.rsvpQuestions.modal.validation.choicesRequired',
      )
      return
    }

    // Any row with a kh value but no en value is a malformed pair.
    const malformed = formData.choiceRows.some(
      (row) => row.kh.trim().length > 0 && row.en.trim().length === 0,
    )
    if (malformed) {
      fieldErrors.value.choices = t(
        'management.rsvpQuestions.modal.validation.choiceTextRequired',
      )
      return
    }

    cleanedChoices = nonEmpty.map((row) => row.en.trim())
    cleanedKhChoices = nonEmpty.map((row) => row.kh.trim())
  }

  const payload: CreateRsvpQuestionRequest = {
    question_text: questionText,
    question_type: formData.question_type,
    is_required: formData.is_required,
    // Clear legacy choices server-side when switching away from a choice type.
    choices: requiresChoices.value ? cleanedChoices : [],
  }

  // Only send kh when at least one Khmer field has content — omitting the
  // array leaves existing translations untouched on PATCH.
  const hasKhQuestion = formData.question_text_kh.trim().length > 0
  const hasAnyKhChoice = cleanedKhChoices.some((c) => c.length > 0)
  if (hasKhQuestion || hasAnyKhChoice) {
    payload.translations = [
      {
        language: 'kh',
        question_text: formData.question_text_kh.trim() || questionText,
        ...(requiresChoices.value ? { choices: cleanedKhChoices } : {}),
      },
    ]
  } else if (isEdit.value) {
    // Editing with no Khmer content — send an empty array so the backend
    // removes any stale translation the user just cleared.
    payload.translations = []
  }

  emit('save', payload)
}

// Lets the parent surface a server error inside this form.
const setErrorMessage = (msg: string) => {
  errorMessage.value = msg
}

defineExpose({ setErrorMessage })
</script>
