<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="handleClose"
      />
    </Transition>

    <!-- Drawer panel -->
    <Transition name="slide-up">
      <div
        v-if="show"
        class="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center w-full md:w-auto z-[999]"
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
                      ? t('management.tickets.questions.modal.editTitle')
                      : t('management.tickets.questions.modal.addTitle')
                  }}
                </h2>
              </div>
              <button
                type="button"
                class="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                :aria-label="t('management.tickets.questions.actions.cancel')"
                @click="handleClose"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto overscroll-contain">
            <form class="p-4 space-y-5 pb-6" @submit.prevent="handleSubmit">
              <!-- Type -->
              <div>
                <label
                  for="ticketQuestionType"
                  class="block text-sm font-medium text-slate-700 mb-2"
                >
                  {{ t('management.tickets.questions.modal.typeLabel') }}
                  <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <select
                    id="ticketQuestionType"
                    v-model="formData.question_type"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                  >
                    <option value="text">{{ t('management.tickets.questions.types.text') }}</option>
                    <option value="long_text">{{ t('management.tickets.questions.types.long_text') }}</option>
                    <option value="yes_no">{{ t('management.tickets.questions.types.yes_no') }}</option>
                    <option value="single_choice">{{ t('management.tickets.questions.types.single_choice') }}</option>
                    <option value="multi_choice">{{ t('management.tickets.questions.types.multi_choice') }}</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown class="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>

              <!-- Question text -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.tickets.questions.modal.questionLabel') }}
                  <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.question_text"
                  type="text"
                  maxlength="300"
                  :placeholder="t('management.tickets.questions.modal.questionPlaceholder')"
                  class="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                  :class="fieldErrors.questionText ? 'border-red-300' : 'border-slate-300'"
                />
                <p v-if="fieldErrors.questionText" class="mt-1 text-xs text-red-600">
                  {{ fieldErrors.questionText }}
                </p>
              </div>

              <!-- Scope (tier-specific or all tiers) -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.tickets.questions.modal.scopeLabel') }}
                </label>
                <div class="relative">
                  <select
                    v-model="scopeValue"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                  >
                    <option :value="null">
                      {{ t('management.tickets.questions.modal.scopeAllOption') }}
                    </option>
                    <option v-for="tier in tiers" :key="tier.id" :value="tier.id">
                      {{ tier.name }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown class="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>

              <!-- Toggles -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-300 bg-white/90 cursor-pointer select-none hover:border-sky-300 transition-colors"
                >
                  <input
                    v-model="formData.is_required"
                    type="checkbox"
                    class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-0"
                  />
                  <span class="text-sm text-slate-700">
                    {{ t('management.tickets.questions.modal.isRequiredLabel') }}
                  </span>
                </label>
                <label
                  class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-300 bg-white/90 cursor-pointer select-none hover:border-sky-300 transition-colors"
                >
                  <input
                    v-model="formData.is_active"
                    type="checkbox"
                    class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-0"
                  />
                  <span class="text-sm text-slate-700">
                    {{ t('management.tickets.questions.modal.isActiveLabel') }}
                  </span>
                </label>
              </div>

              <!-- Choices -->
              <div v-if="requiresChoices">
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.tickets.questions.modal.choicesLabel') }}
                  <span class="text-red-500">*</span>
                </label>
                <p class="text-xs text-slate-500 mb-2">
                  {{ t('management.tickets.questions.modal.choicesHint') }}
                </p>

                <div class="space-y-2">
                  <div
                    v-for="(_, idx) in formData.choices"
                    :key="`choice-${idx}`"
                    class="flex items-center gap-2"
                  >
                    <span class="text-xs text-slate-400 tabular-nums w-5 text-right">
                      {{ idx + 1 }}.
                    </span>
                    <input
                      v-model="formData.choices[idx]"
                      type="text"
                      maxlength="120"
                      class="flex-1 min-w-0 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      :class="fieldErrors.choices ? 'border-red-300' : 'border-slate-300'"
                    />
                    <button
                      type="button"
                      class="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      :title="t('management.tickets.questions.modal.removeChoice')"
                      :aria-label="t('management.tickets.questions.modal.removeChoice')"
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
                  {{ t('management.tickets.questions.modal.addChoice') }}
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
                      ? t('management.tickets.questions.actions.saving')
                      : t('management.tickets.questions.actions.save')
                  }}
                </span>
              </button>
              <button
                type="button"
                class="px-5 py-2.5 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
                :disabled="isSaving"
                @click="handleClose"
              >
                {{ t('management.tickets.questions.actions.cancel') }}
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
  CheckoutQuestionType,
  CreateCheckoutQuestionRequest,
  TicketCheckoutQuestion,
  TicketType,
  UpdateCheckoutQuestionRequest,
} from '@/services/api'

const { t } = useI18n()

interface Props {
  show: boolean
  question: TicketCheckoutQuestion | null
  tiers: TicketType[]
  isSaving: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [payload: CreateCheckoutQuestionRequest | UpdateCheckoutQuestionRequest]
}>()

interface FormData {
  question_text: string
  question_type: CheckoutQuestionType
  is_required: boolean
  is_active: boolean
  choices: string[]
  ticket_type_id: number | null
}

const emptyForm = (): FormData => ({
  question_text: '',
  question_type: 'text',
  is_required: false,
  is_active: true,
  choices: ['', ''],
  ticket_type_id: null,
})

const formData = reactive<FormData>(emptyForm())
const fieldErrors = ref<{ questionText?: string; choices?: string }>({})
const errorMessage = ref('')

const isEdit = computed(() => props.question !== null)

const requiresChoices = computed(
  () => formData.question_type === 'single_choice' || formData.question_type === 'multi_choice',
)

/**
 * Two-way scope binding. The select needs `null` for "All tiers" but
 * `formData.ticket_type_id` is already `number | null`, so this is mostly a
 * pass-through. Kept as a computed so future numeric coercion (e.g. when the
 * select coerces values to strings) lives in one place.
 */
const scopeValue = computed({
  get: () => formData.ticket_type_id,
  set: (next: number | null) => {
    formData.ticket_type_id = next === null ? null : Number(next)
  },
})

// Reset / hydrate whenever the modal opens with a new question
watch(
  () => props.show,
  (show) => {
    if (!show) return
    fieldErrors.value = {}
    errorMessage.value = ''

    const q = props.question
    if (q) {
      formData.question_text = q.question_text
      formData.question_type = q.question_type
      formData.is_required = q.is_required
      formData.is_active = q.is_active
      formData.ticket_type_id = q.ticket_type_id
      formData.choices = q.choices && q.choices.length > 0 ? [...q.choices] : ['', '']
    } else {
      Object.assign(formData, emptyForm())
    }
  },
  { immediate: true },
)

// Seed two blank choice rows the first time the user picks a choice-style type.
watch(
  () => formData.question_type,
  (next) => {
    if ((next === 'single_choice' || next === 'multi_choice') && formData.choices.length === 0) {
      formData.choices = ['', '']
    }
  },
)

const addChoice = () => {
  formData.choices.push('')
}

const removeChoice = (idx: number) => {
  formData.choices.splice(idx, 1)
  if (formData.choices.length === 0) {
    formData.choices.push('')
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
      'management.tickets.questions.modal.validation.questionRequired',
    )
    return
  }

  let cleanedChoices: string[] = []
  if (requiresChoices.value) {
    cleanedChoices = formData.choices.map((c) => c.trim()).filter((c) => c.length > 0)
    if (cleanedChoices.length === 0) {
      fieldErrors.value.choices = t(
        'management.tickets.questions.modal.validation.choicesRequired',
      )
      return
    }
  }

  const payload: CreateCheckoutQuestionRequest = {
    question_text: questionText,
    question_type: formData.question_type,
    is_required: formData.is_required,
    is_active: formData.is_active,
    ticket_type_id: formData.ticket_type_id,
    // Always send `choices`; the server clears the array when it switches to
    // a non-choice type so we mirror that behaviour client-side.
    choices: requiresChoices.value ? cleanedChoices : [],
  }

  emit('save', payload)
}

const setErrorMessage = (msg: string) => {
  errorMessage.value = msg
}

defineExpose({ setErrorMessage })
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
