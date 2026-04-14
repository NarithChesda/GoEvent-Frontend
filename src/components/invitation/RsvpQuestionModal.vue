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
          class="relative w-full md:max-w-xl bg-white md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] md:max-h-[calc(100vh-100px)] flex flex-col rounded-t-3xl md:rounded-b-3xl"
          @click.stop
        >
          <!-- Header -->
          <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
            <div class="flex items-center justify-between px-4 py-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center"
                >
                  <MessageSquareText class="w-5 h-5" />
                </div>
                <h2 class="text-lg font-semibold text-white">
                  {{
                    isEdit
                      ? t('management.guestGroupsView.rsvpQuestions.modal.editTitle')
                      : t('management.guestGroupsView.rsvpQuestions.modal.addTitle')
                  }}
                </h2>
              </div>
              <button
                type="button"
                class="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                :aria-label="t('management.guestGroupsView.rsvpQuestions.actions.cancel')"
                @click="handleClose"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto overscroll-contain">
            <form class="p-4 space-y-5 pb-6" @submit.prevent="handleSubmit">
              <!-- Type + required row -->
              <div class="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div class="sm:col-span-3">
                  <label
                    for="rsvpQuestionType"
                    class="block text-sm font-medium text-slate-700 mb-2"
                  >
                    {{ t('management.guestGroupsView.rsvpQuestions.modal.typeLabel') }}
                    <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      id="rsvpQuestionType"
                      v-model="formData.question_type"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                    >
                      <option value="text">
                        {{ t('management.guestGroupsView.rsvpQuestions.types.text') }}
                      </option>
                      <option value="long_text">
                        {{ t('management.guestGroupsView.rsvpQuestions.types.long_text') }}
                      </option>
                      <option value="yes_no">
                        {{ t('management.guestGroupsView.rsvpQuestions.types.yes_no') }}
                      </option>
                      <option value="single_choice">
                        {{ t('management.guestGroupsView.rsvpQuestions.types.single_choice') }}
                      </option>
                      <option value="multi_choice">
                        {{ t('management.guestGroupsView.rsvpQuestions.types.multi_choice') }}
                      </option>
                    </select>
                    <div
                      class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
                    >
                      <ChevronDown class="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                <div class="sm:col-span-2">
                  <label
                    class="block text-sm font-medium text-slate-700 mb-2"
                  >
                    {{ t('management.guestGroupsView.rsvpQuestions.modal.requiredLabel') }}
                  </label>
                  <label
                    class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-300 bg-white/90 cursor-pointer select-none hover:border-sky-300 transition-colors"
                  >
                    <input
                      v-model="formData.is_required"
                      type="checkbox"
                      class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-0"
                    />
                    <span class="text-sm text-slate-700">
                      {{ t('management.guestGroupsView.rsvpQuestions.requiredBadge') }}
                    </span>
                  </label>
                </div>
              </div>

              <p class="text-xs text-slate-500 -mt-1">
                {{ t('management.guestGroupsView.rsvpQuestions.modal.requiredHint') }}
              </p>

              <!-- Question text (paired EN + KH) -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.guestGroupsView.rsvpQuestions.modal.questionTextLabel') }}
                  <span class="text-red-500">*</span>
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span class="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                      {{ t('management.guestGroupsView.rsvpQuestions.modal.questionTextEnglish') }}
                    </span>
                    <input
                      v-model="formData.question_text"
                      type="text"
                      maxlength="300"
                      :placeholder="t('management.guestGroupsView.rsvpQuestions.modal.questionTextPlaceholder')"
                      class="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      :class="fieldErrors.questionText ? 'border-red-300' : 'border-slate-300'"
                    />
                  </div>
                  <div>
                    <span class="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                      {{ t('management.guestGroupsView.rsvpQuestions.modal.questionTextKhmer') }}
                    </span>
                    <input
                      v-model="formData.question_text_kh"
                      type="text"
                      maxlength="300"
                      :placeholder="t('management.guestGroupsView.rsvpQuestions.modal.questionTextKhmerPlaceholder')"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                    />
                  </div>
                </div>
                <p v-if="fieldErrors.questionText" class="mt-1 text-xs text-red-600">
                  {{ fieldErrors.questionText }}
                </p>
              </div>

              <!-- Choices (paired EN + KH) -->
              <div v-if="requiresChoices">
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.guestGroupsView.rsvpQuestions.modal.choicesLabel') }}
                  <span class="text-red-500">*</span>
                </label>
                <p class="text-xs text-slate-500 mb-2">
                  {{ t('management.guestGroupsView.rsvpQuestions.modal.choicesHint') }}
                </p>

                <div class="space-y-2">
                  <div
                    v-for="(row, idx) in formData.choiceRows"
                    :key="`choice-${idx}`"
                    class="flex items-center gap-2"
                  >
                    <span class="text-xs text-slate-400 tabular-nums w-5 text-right">
                      {{ idx + 1 }}.
                    </span>
                    <input
                      v-model="row.en"
                      type="text"
                      maxlength="120"
                      :placeholder="t('management.guestGroupsView.rsvpQuestions.modal.choiceEnglishPlaceholder')"
                      class="flex-1 min-w-0 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      :class="fieldErrors.choices ? 'border-red-300' : 'border-slate-300'"
                    />
                    <input
                      v-model="row.kh"
                      type="text"
                      maxlength="120"
                      :placeholder="t('management.guestGroupsView.rsvpQuestions.modal.choiceKhmerPlaceholder')"
                      class="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
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
                  class="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                  @click="addChoice"
                >
                  <Plus class="w-3.5 h-3.5" />
                  {{ t('management.guestGroupsView.rsvpQuestions.modal.addChoice') }}
                </button>

                <p v-if="fieldErrors.choices" class="mt-1 text-xs text-red-600">
                  {{ fieldErrors.choices }}
                </p>
              </div>

              <!-- Generic error -->
              <div v-if="errorMessage" class="rounded-lg bg-red-50 border border-red-200 p-3">
                <p class="text-sm text-red-800">{{ errorMessage }}</p>
              </div>
            </form>
          </div>

          <!-- Footer -->
          <div class="flex-shrink-0 border-t border-slate-200 bg-white">
            <div class="flex items-center justify-between gap-3 px-4 py-3">
              <button
                type="button"
                class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isSaving"
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
              <button
                type="button"
                class="px-5 py-2.5 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
                :disabled="isSaving"
                @click="handleClose"
              >
                {{ t('management.guestGroupsView.rsvpQuestions.actions.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessageSquareText, X, ChevronDown, Plus, Trash2 } from 'lucide-vue-next'
import type {
  CreateRsvpQuestionRequest,
  EventRsvpQuestion,
  EventRsvpQuestionType,
} from '../../services/api'

const { t } = useI18n()

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

const isEdit = computed(() => props.question !== null)

const requiresChoices = computed(
  () =>
    formData.question_type === 'single_choice' ||
    formData.question_type === 'multi_choice',
)

// Reset / hydrate whenever the modal opens with a new question
watch(
  () => props.show,
  (show) => {
    if (!show) return
    fieldErrors.value = {}
    errorMessage.value = ''

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
</style>
