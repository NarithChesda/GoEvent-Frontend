<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
        @click="handleClose"
      />
    </Transition>

    <!-- Drawer panel -->
    <Transition name="slide-up">
      <div
        v-if="show"
        class="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center w-full md:w-auto z-[71]"
        @click.self="handleClose"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rsvp-question-modal-title"
          class="relative w-full md:max-w-xl bg-white md:rounded-3xl shadow-2xl ring-1 ring-slate-900/5 overflow-hidden max-h-[85vh] md:max-h-[calc(100vh-100px)] flex flex-col rounded-t-3xl md:rounded-b-3xl"
          @click.stop
        >
          <!-- Header (mirrors EditGuestModal: tinted accent backdrop + glow) -->
          <div class="relative flex-shrink-0 overflow-hidden border-b border-slate-100 bg-white z-10">
            <div
              class="absolute inset-0"
              :style="{ background: `linear-gradient(135deg, ${accentColor}24 0%, ${accentColor}0a 55%, transparent 100%)` }"
            ></div>
            <div
              class="absolute -top-12 -right-12 w-44 h-44 rounded-full opacity-25 blur-3xl pointer-events-none"
              :style="{ backgroundColor: accentColor }"
            ></div>

            <div class="relative px-5 pt-4 pb-4">
              <button
                type="button"
                class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-sm ring-1 ring-slate-900/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                :aria-label="t('management.guestGroupsView.rsvpQuestions.actions.cancel')"
                @click="handleClose"
              >
                <X class="w-4 h-4" />
              </button>

              <div class="flex items-start gap-3.5 pr-12">
                <div
                  class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-white select-none"
                  :style="{ backgroundColor: accentColor, boxShadow: `0 8px 20px -6px ${accentColor}99` }"
                >
                  <MessageSquareText class="w-5 h-5" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {{ t('management.guestGroupsView.rsvpQuestions.header') }}
                  </p>
                  <h2 id="rsvp-question-modal-title" class="text-lg font-bold text-slate-900 truncate leading-tight">
                    {{
                      isEdit
                        ? t('management.guestGroupsView.rsvpQuestions.modal.editTitle')
                        : t('management.guestGroupsView.rsvpQuestions.modal.addTitle')
                    }}
                  </h2>
                  <p class="text-xs text-slate-500 mt-0.5 truncate">
                    {{ t('management.guestGroupsView.rsvpQuestions.subtitle') }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto overscroll-contain">
            <form class="p-4 sm:p-5 space-y-6 pb-6" @submit.prevent="handleSubmit">
              <!-- Question type section -->
              <div class="space-y-3">
                <h3 class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <LayoutGrid class="w-3.5 h-3.5" />
                  {{ t('management.guestGroupsView.rsvpQuestions.modal.typeLabel') }}
                  <span class="text-red-500 normal-case">*</span>
                </h3>
                <div
                  class="grid grid-cols-2 sm:grid-cols-3 gap-2"
                  role="radiogroup"
                  :aria-label="t('management.guestGroupsView.rsvpQuestions.modal.typeLabel')"
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
                      <component :is="opt.icon" class="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span
                      class="text-xs font-semibold leading-snug"
                      :class="formData.question_type === opt.value ? 'text-emerald-900' : 'text-slate-700'"
                    >
                      {{ opt.label }}
                    </span>
                  </button>
                </div>
                <p class="text-xs text-slate-500">
                  {{ selectedTypeDescription }}
                </p>
              </div>

              <!-- Required toggle -->
              <div class="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-700">
                    {{ t('management.guestGroupsView.rsvpQuestions.modal.requiredLabel') }}
                  </p>
                  <p class="mt-0.5 text-xs text-slate-500">
                    {{ t('management.guestGroupsView.rsvpQuestions.modal.requiredHint') }}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  :aria-checked="formData.is_required"
                  :aria-label="t('management.guestGroupsView.rsvpQuestions.modal.requiredLabel')"
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

              <!-- Question text section (paired EN + KH) -->
              <div class="space-y-3">
                <h3 class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Languages class="w-3.5 h-3.5" />
                  {{ t('management.guestGroupsView.rsvpQuestions.modal.questionTextLabel') }}
                  <span class="text-red-500 normal-case">*</span>
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span class="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                      {{ t('management.guestGroupsView.rsvpQuestions.modal.questionTextEnglish') }}
                    </span>
                    <input
                      ref="questionInputRef"
                      v-model="formData.question_text"
                      type="text"
                      maxlength="300"
                      :placeholder="t('management.guestGroupsView.rsvpQuestions.modal.questionTextPlaceholder')"
                      class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-200 focus:bg-white transition-all"
                      :class="fieldErrors.questionText ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-transparent'"
                      :aria-invalid="fieldErrors.questionText ? 'true' : undefined"
                      :aria-describedby="fieldErrors.questionText ? 'rsvp-question-text-error' : undefined"
                    />
                  </div>
                  <div>
                    <span class="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                      {{ t('management.guestGroupsView.rsvpQuestions.modal.questionTextKhmer') }}
                    </span>
                    <input
                      v-model="formData.question_text_kh"
                      type="text"
                      maxlength="300"
                      :placeholder="t('management.guestGroupsView.rsvpQuestions.modal.questionTextKhmerPlaceholder')"
                      class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-200 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <p v-if="fieldErrors.questionText" id="rsvp-question-text-error" class="text-xs text-red-600">
                  {{ fieldErrors.questionText }}
                </p>
              </div>

              <!-- Choices section (paired EN + KH) -->
              <div v-if="requiresChoices" class="space-y-3">
                <h3 class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <List class="w-3.5 h-3.5" />
                  {{ t('management.guestGroupsView.rsvpQuestions.modal.choicesLabel') }}
                  <span class="text-red-500 normal-case">*</span>
                </h3>
                <p class="text-xs text-slate-500">
                  {{ t('management.guestGroupsView.rsvpQuestions.modal.choicesHint') }}
                </p>

                <div class="space-y-2">
                  <div
                    v-for="(row, idx) in formData.choiceRows"
                    :key="`choice-${idx}`"
                    class="flex items-center gap-2"
                  >
                    <span class="text-xs text-slate-400 tabular-nums w-5 text-right flex-shrink-0">
                      {{ idx + 1 }}.
                    </span>
                    <input
                      :id="`rsvp-choice-en-${idx}`"
                      v-model="row.en"
                      type="text"
                      maxlength="120"
                      :placeholder="t('management.guestGroupsView.rsvpQuestions.modal.choiceEnglishPlaceholder')"
                      class="flex-1 min-w-0 px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-200 focus:bg-white transition-all"
                      :class="fieldErrors.choices ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-transparent'"
                      :aria-invalid="fieldErrors.choices ? 'true' : undefined"
                      :aria-describedby="fieldErrors.choices ? 'rsvp-question-choices-error' : undefined"
                      @keydown.enter.prevent="handleChoiceEnter(idx, 'en')"
                    />
                    <input
                      :id="`rsvp-choice-kh-${idx}`"
                      v-model="row.kh"
                      type="text"
                      maxlength="120"
                      :placeholder="t('management.guestGroupsView.rsvpQuestions.modal.choiceKhmerPlaceholder')"
                      class="flex-1 min-w-0 px-3 py-2 text-sm bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-200 focus:bg-white transition-all"
                      @keydown.enter.prevent="handleChoiceEnter(idx, 'kh')"
                    />
                    <button
                      type="button"
                      class="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      :title="t('management.guestGroupsView.rsvpQuestions.modal.removeChoice')"
                      :aria-label="t('management.guestGroupsView.rsvpQuestions.modal.removeChoice')"
                      @click="removeChoice(idx)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  class="w-full flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-xs font-medium text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-700 transition-all"
                  @click="addChoice"
                >
                  <Plus class="w-3.5 h-3.5" />
                  {{ t('management.guestGroupsView.rsvpQuestions.modal.addChoice') }}
                </button>

                <p v-if="fieldErrors.choices" id="rsvp-question-choices-error" class="text-xs text-red-600">
                  {{ fieldErrors.choices }}
                </p>
              </div>

              <!-- Generic error -->
              <div v-if="errorMessage" class="rounded-xl bg-red-50 border border-red-200 p-3">
                <p class="text-sm text-red-800">{{ errorMessage }}</p>
              </div>
            </form>
          </div>

          <!-- Footer -->
          <div class="flex-shrink-0 border-t border-slate-100 bg-white pb-[env(safe-area-inset-bottom)]">
            <div class="flex items-center justify-end gap-3 px-5 py-3.5">
              <button
                type="button"
                class="px-5 py-2.5 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isSaving"
                @click="handleClose"
              >
                {{ t('management.guestGroupsView.rsvpQuestions.actions.cancel') }}
              </button>
              <button
                type="button"
                class="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isSaving || !canSave"
                @click="handleSubmit"
              >
                <span
                  v-if="isSaving"
                  class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
                />
                <span>
                  {{
                    isSaving
                      ? t('management.guestGroupsView.rsvpQuestions.actions.saving')
                      : t('management.guestGroupsView.rsvpQuestions.actions.save')
                  }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  MessageSquareText,
  X,
  Plus,
  Trash2,
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

// Brand emerald — fixed accent used by the header backdrop, matching the
// group-color treatment in EditGuestModal.
const accentColor = '#2ecc71'

interface Props {
  show: boolean
  question: EventRsvpQuestion | null
  isSaving: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [payload: CreateRsvpQuestionRequest]
}>()

interface ChoiceRow {
  en: string
  kh: string
}

interface ModalFormData {
  question_text: string
  question_text_kh: string
  question_type: EventRsvpQuestionType
  is_required: boolean
  choiceRows: ChoiceRow[]
}

const emptyForm = (): ModalFormData => ({
  question_text: '',
  question_text_kh: '',
  question_type: 'text',
  is_required: false,
  choiceRows: [
    { en: '', kh: '' },
    { en: '', kh: '' },
  ],
})

const formData = reactive<ModalFormData>(emptyForm())
const fieldErrors = ref<{ questionText?: string; choices?: string }>({})
const errorMessage = ref('')
const questionInputRef = ref<HTMLInputElement | null>(null)

const isEdit = computed(() => props.question !== null)

// Deeper validation (choices etc.) still runs on submit with messages;
// this only gates the obvious "nothing typed yet" state, matching
// EditGuestModal's disabled Update button.
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
  { value: 'text', label: t('management.guestGroupsView.rsvpQuestions.types.text'), icon: Type },
  { value: 'long_text', label: t('management.guestGroupsView.rsvpQuestions.types.long_text'), icon: AlignLeft },
  { value: 'yes_no', label: t('management.guestGroupsView.rsvpQuestions.types.yes_no'), icon: ToggleLeft },
  { value: 'single_choice', label: t('management.guestGroupsView.rsvpQuestions.types.single_choice'), icon: CircleDot },
  { value: 'multi_choice', label: t('management.guestGroupsView.rsvpQuestions.types.multi_choice'), icon: ListChecks },
])

const selectedTypeDescription = computed(() =>
  t(`management.guestGroupsView.rsvpQuestions.modal.typeDescriptions.${formData.question_type}`),
)

// Escape closes the modal (guarded against closing mid-save in handleClose)
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.show) {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// Reset / hydrate whenever the modal opens with a new question
watch(
  () => props.show,
  (show) => {
    // Lock background scroll while the modal is open (same pattern as AddGuestModal)
    document.body.style.overflow = show ? 'hidden' : ''
    if (!show) return
    fieldErrors.value = {}
    errorMessage.value = ''

    // Autofocus the question field on desktop only — on mobile the drawer
    // would immediately pop the keyboard over half the sheet.
    nextTick(() => {
      if (window.matchMedia('(min-width: 768px)').matches) {
        questionInputRef.value?.focus()
      }
    })

    const q = props.question
    if (q) {
      const khTranslation = q.translations?.find((t) => t.language === 'kh')
      const parentChoices = q.choices ?? []
      const khChoices = khTranslation?.choices ?? []
      formData.question_text = q.question_text
      formData.question_text_kh = khTranslation?.question_text ?? ''
      formData.question_type = q.question_type
      formData.is_required = q.is_required
      // Index-pair parent choices with kh choices, padding the shorter side.
      const paired: ChoiceRow[] = parentChoices.map((en, idx) => ({
        en,
        kh: khChoices[idx] ?? '',
      }))
      formData.choiceRows =
        paired.length > 0 ? paired : [{ en: '', kh: '' }, { en: '', kh: '' }]
    } else {
      Object.assign(formData, emptyForm())
    }
  },
  { immediate: true },
)

// When the type switches away from a choice-based type we don't need to
// drop the rows — keep them around in case the user toggles back. But if
// the user switches INTO a choice type and has none, seed two blank rows.
watch(
  () => formData.question_type,
  (next) => {
    if ((next === 'single_choice' || next === 'multi_choice') && formData.choiceRows.length === 0) {
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

// Enter inside a choice input appends a row (when on the last one) and
// moves focus down the same language column, instead of submitting the form.
const handleChoiceEnter = async (idx: number, lang: 'en' | 'kh') => {
  if (idx === formData.choiceRows.length - 1) {
    addChoice()
  }
  await nextTick()
  document.getElementById(`rsvp-choice-${lang}-${idx + 1}`)?.focus()
}

const removeChoice = (idx: number) => {
  formData.choiceRows.splice(idx, 1)
  if (formData.choiceRows.length === 0) {
    formData.choiceRows.push({ en: '', kh: '' })
  }
}

const handleClose = () => {
  if (props.isSaving) return
  emit('close')
}

const handleSubmit = () => {
  fieldErrors.value = {}
  errorMessage.value = ''

  const questionText = formData.question_text.trim()
  if (!questionText) {
    fieldErrors.value.questionText = t(
      'management.guestGroupsView.rsvpQuestions.modal.validation.questionRequired',
    )
    return
  }

  let cleanedChoices: string[] = []
  let cleanedKhChoices: string[] = []

  if (requiresChoices.value) {
    const nonEmpty = formData.choiceRows.filter((row) => row.en.trim().length > 0)
    if (nonEmpty.length === 0) {
      fieldErrors.value.choices = t(
        'management.guestGroupsView.rsvpQuestions.modal.validation.choicesRequired',
      )
      return
    }

    // Any row with a kh value but no en value is a malformed pair.
    const malformed = formData.choiceRows.some(
      (row) => row.kh.trim().length > 0 && row.en.trim().length === 0,
    )
    if (malformed) {
      fieldErrors.value.choices = t(
        'management.guestGroupsView.rsvpQuestions.modal.validation.choiceTextRequired',
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
  }

  if (requiresChoices.value) {
    payload.choices = cleanedChoices
  } else {
    // Clearing legacy choices when switching types server-side.
    payload.choices = []
  }

  // Build translations array: only send kh when at least one Khmer field
  // has content. We omit the array otherwise so a PATCH leaves existing
  // translations untouched per the backend contract.
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
    // Editing and no Khmer content — explicitly send an empty array so
    // the backend removes any stale translation the user may have cleared.
    payload.translations = []
  }

  emit('save', payload)
}

// Allow parent to surface errors back
const setErrorMessage = (msg: string) => {
  errorMessage.value = msg
}

defineExpose({ setErrorMessage })
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide-up drawer on mobile, scale-in on desktop */
.slide-up-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: all 0.3s ease;
  }
  .slide-up-enter-from,
  .slide-up-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(0);
  }
}

/* Respect users who opt out of motion */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: none;
  }
}

/* Custom scrollbar (matches EditGuestModal) */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
