<template>
  <section>
    <!-- Section header + add action -->
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {{ t('management.rsvpAnalytics.questions.title') }}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          {{ t('management.rsvpAnalytics.questions.description') }}
        </p>
      </div>
      <button
        v-if="rows.length > 0"
        type="button"
        class="inline-flex min-h-[40px] flex-shrink-0 items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="isCreating"
        @click="startCreate"
      >
        <Plus class="h-3.5 w-3.5" />
        {{ t('management.rsvpQuestions.addButton') }}
      </button>
    </div>

    <!-- Action error (reorder/delete failures — save errors render inside the
         open editor instead) -->
    <div
      v-if="actionError"
      class="mb-3 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      role="alert"
    >
      <span class="min-w-0 break-words">{{ actionError }}</span>
      <button
        type="button"
        class="-m-1 flex-shrink-0 rounded-lg p-1 text-red-400 transition-colors hover:bg-red-100 hover:text-red-700"
        :aria-label="t('common.actions.close')"
        @click="actionError = null"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- Empty (hidden while the create editor is open — that card is the
         content now) -->
    <div
      v-if="rows.length === 0 && !isCreating"
      class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 p-6 text-center"
    >
      <MessageSquareText class="mx-auto mb-2 h-10 w-10 text-slate-300" />
      <p class="text-sm font-medium text-slate-600">
        {{ t('management.rsvpAnalytics.questions.emptyState.title') }}
      </p>
      <p class="mx-auto mt-1 max-w-md text-xs text-slate-400">
        {{ t('management.rsvpAnalytics.questions.emptyState.description') }}
      </p>
      <button
        type="button"
        class="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-90"
        @click="startCreate"
      >
        <Plus class="h-4 w-4" />
        {{ t('management.rsvpQuestions.addButton') }}
      </button>
    </div>

    <!-- Question list. One list for both authoring and results: the row body
         opens the editor in place, the chevron expands the breakdown. -->
    <div v-if="rows.length > 0" class="space-y-3">
      <template v-for="(row, idx) in rows" :key="row.question.id">
        <!-- Editing in place -->
        <RsvpQuestionForm
          v-if="editingId === row.question.id"
          ref="editFormRef"
          :question="row.question"
          :is-saving="isSaving"
          @save="handleSave"
          @cancel="closeEditor"
        />

        <!-- Delete confirm in place -->
        <div
          v-else-if="deletingId === row.question.id"
          class="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4"
        >
          <div class="flex items-center gap-2 text-red-700">
            <Trash2 class="h-4 w-4 flex-shrink-0" />
            <span class="text-sm font-semibold">
              {{ t('management.rsvpQuestions.deleteConfirm.title') }}
            </span>
          </div>
          <p class="break-words text-sm text-red-800">
            "<span class="font-semibold">{{ questionText(row) }}</span>"
          </p>
          <p class="rounded-md bg-red-100 px-2 py-1.5 text-xs text-red-600">
            {{ t('management.rsvpQuestions.deleteConfirm.body') }}
          </p>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
              :disabled="isDeleting"
              :title="t('management.rsvpQuestions.deleteConfirm.cancel')"
              :aria-label="t('management.rsvpQuestions.deleteConfirm.cancel')"
              @click="deletingId = null"
            >
              <X class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isDeleting"
              :title="t('management.rsvpQuestions.deleteConfirm.confirm')"
              :aria-label="t('management.rsvpQuestions.deleteConfirm.confirm')"
              @click="confirmDelete(row)"
            >
              <span
                v-if="isDeleting"
                class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              />
              <Trash2 v-else class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Normal row -->
        <article
          v-else
          class="rounded-2xl border bg-white transition-all duration-200"
          :class="
            isExpanded(row.question.id)
              ? 'border-slate-300 shadow-sm'
              : 'border-slate-200/80 hover:border-slate-300'
          "
        >
          <div class="flex items-start gap-1 p-2 sm:p-2.5">
            <!-- Body opens the editor — the question itself is the thing you
                 most often want to change. -->
            <button
              type="button"
              class="min-w-0 flex-1 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-200 sm:px-2.5"
              :aria-label="t('management.rsvpQuestions.actions.edit')"
              @click="startEdit(row)"
            >
              <p class="break-words text-sm font-semibold text-slate-900">
                <span class="mr-1.5 font-normal tabular-nums text-slate-300">Q{{ idx + 1 }}.</span>
                {{ questionText(row) }}
              </p>
              <span
                class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500"
              >
                <span>{{ getTypeLabel(row.question.question_type) }}</span>
                <span v-if="row.question.is_required" class="text-rose-600">
                  · {{ t('management.rsvpQuestions.requiredBadge') }}
                </span>
                <span>
                  ·
                  {{
                    t(
                      'management.rsvpAnalytics.questions.answersCount',
                      { count: row.totalAnswers },
                      row.totalAnswers,
                    )
                  }}
                </span>
              </span>
            </button>

            <!-- Row actions -->
            <div class="flex flex-shrink-0 items-center gap-0.5 pt-0.5">
              <button
                type="button"
                class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                :disabled="idx === 0 || isReordering"
                :title="t('management.rsvpQuestions.actions.moveUp')"
                :aria-label="t('management.rsvpQuestions.actions.moveUp')"
                @click="moveQuestion(idx, -1)"
              >
                <ArrowUp class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                :disabled="idx === rows.length - 1 || isReordering"
                :title="t('management.rsvpQuestions.actions.moveDown')"
                :aria-label="t('management.rsvpQuestions.actions.moveDown')"
                @click="moveQuestion(idx, 1)"
              >
                <ArrowDown class="h-4 w-4" />
              </button>
              <button
                type="button"
                class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                :title="t('management.rsvpQuestions.actions.delete')"
                :aria-label="t('management.rsvpQuestions.actions.delete')"
                @click="startDelete(row)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
              <!-- Results only exist once someone has answered, so the
                   expander only appears then. -->
              <button
                v-if="row.totalAnswers > 0"
                type="button"
                class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                :aria-expanded="isExpanded(row.question.id)"
                :title="t('management.rsvpAnalytics.questions.viewResults')"
                :aria-label="t('management.rsvpAnalytics.questions.viewResults')"
                @click="toggleQuestion(row.question.id)"
              >
                <ChevronDown
                  class="h-4 w-4 transition-transform duration-200"
                  :class="{ 'rotate-180': isExpanded(row.question.id) }"
                />
              </button>
            </div>
          </div>

          <!-- Results body — collapsed rows only render one when there are
               choice bars to preview. -->
          <div
            v-if="isExpanded(row.question.id) || hasCollapsedPreview(row)"
            class="px-4 pb-4 sm:px-5 sm:pb-5"
          >
            <!-- Drill status filter -->
            <div
              v-if="isExpanded(row.question.id) && row.totalAnswers > 0"
              class="mb-3 flex flex-wrap items-center gap-1.5"
              :title="t('management.rsvpAnalytics.drill.filterHint')"
            >
              <button
                v-for="option in drillFilterOptions"
                :key="option.key"
                type="button"
                class="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-200"
                :class="
                  drillFilter === option.value
                    ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                "
                @click="setDrillFilter(option.value)"
              >
                {{ option.label }}
              </button>
            </div>

            <!-- Choice breakdown: bars + inline guests when expanded -->
            <div
              v-if="row.breakdown && Object.keys(row.breakdown.breakdown ?? {}).length > 0"
              class="space-y-3.5"
            >
              <div v-for="bar in getVisibleBreakdown(row)" :key="bar.label">
                <div class="flex items-baseline justify-between gap-3">
                  <p
                    class="min-w-0 truncate text-xs font-medium text-slate-700"
                    :title="localizeChoice(row, bar.label)"
                  >
                    {{ localizeChoice(row, bar.label) }}
                  </p>
                  <p class="flex-shrink-0 text-xs tabular-nums">
                    <span class="font-semibold text-slate-900">{{ bar.count }}</span>
                    <span class="text-slate-400"> · {{ bar.percentOfTotal }}%</span>
                  </p>
                </div>
                <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-r-full bg-[#1e90ff] transition-all duration-500"
                    :style="{ width: `${Math.max(bar.percentOfTotal, 2)}%` }"
                  />
                </div>

                <!-- Inline guest chips for this bar -->
                <div
                  v-if="isExpanded(row.question.id) && getBucketGuests(bar.label).length > 0"
                  class="mt-2 flex flex-wrap gap-1"
                >
                  <span
                    v-for="guest in getVisibleBucketGuests(bar.label)"
                    :key="guest.id"
                    class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700"
                  >
                    <span
                      v-if="guest.group_color"
                      class="h-1 w-1 flex-shrink-0 rounded-full"
                      :style="{ backgroundColor: guest.group_color }"
                    />
                    {{ guest.name }}
                    <span v-if="(guest.plus_ones_count ?? 0) > 0" class="text-slate-400">
                      +{{ guest.plus_ones_count }}
                    </span>
                  </span>

                  <button
                    v-if="!isBucketExpanded(bar.label) && bucketRemainder(bar.label) > 0"
                    type="button"
                    class="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-200"
                    @click="toggleBucket(bar.label)"
                  >
                    +{{ bucketRemainder(bar.label) }} {{ t('management.rsvpAnalytics.chase.moreShort') }}
                  </button>
                  <button
                    v-else-if="
                      isBucketExpanded(bar.label) &&
                      getBucketGuests(bar.label).length > BUCKET_PREVIEW_COUNT
                    "
                    type="button"
                    class="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-200"
                    @click="toggleBucket(bar.label)"
                  >
                    {{ t('management.rsvpAnalytics.showLess') }}
                  </button>
                </div>
              </div>

              <!-- Collapsed rows cap the option list -->
              <p
                v-if="!isExpanded(row.question.id) && hiddenChoiceCount(row) > 0"
                class="text-[11px] text-slate-400"
              >
                {{
                  t(
                    'management.rsvpAnalytics.questions.moreOptions',
                    { count: hiddenChoiceCount(row) },
                    hiddenChoiceCount(row),
                  )
                }}
              </p>
            </div>

            <!-- Free-text drill-through -->
            <div v-else>
              <div v-if="drillData?.free_text_answers?.length" class="space-y-2">
                <div
                  v-for="entry in visibleFreeTextAnswers"
                  :key="entry.id"
                  class="rounded-lg bg-slate-50 p-3"
                >
                  <div class="mb-1 flex items-center justify-between gap-2">
                    <div class="flex min-w-0 items-center gap-1.5">
                      <span
                        v-if="entry.group_color"
                        class="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        :style="{ backgroundColor: entry.group_color }"
                      />
                      <p class="truncate text-xs font-semibold text-slate-900">
                        {{ entry.name }}
                      </p>
                      <span v-if="entry.group_name" class="truncate text-[10px] text-slate-400">
                        · {{ entry.group_name }}
                      </span>
                    </div>
                    <p class="flex-shrink-0 text-[10px] text-slate-400">
                      {{ formatRelativeDate(entry.updated_at) }}
                    </p>
                  </div>
                  <p class="whitespace-pre-line break-words text-sm text-slate-700">
                    {{ entry.answer_text }}
                  </p>
                </div>

                <button
                  v-if="!showAllFreeText && freeTextRemainder > 0"
                  type="button"
                  class="text-xs font-medium text-slate-500 transition-colors duration-200 hover:text-slate-900"
                  @click="showAllFreeText = true"
                >
                  {{
                    t('management.rsvpAnalytics.showAll', {
                      count: drillData.free_text_answers.length,
                    })
                  }}
                </button>
                <button
                  v-else-if="
                    showAllFreeText &&
                    drillData.free_text_answers.length > FREE_TEXT_PREVIEW_COUNT
                  "
                  type="button"
                  class="text-xs font-medium text-slate-500 transition-colors duration-200 hover:text-slate-900"
                  @click="showAllFreeText = false"
                >
                  {{ t('management.rsvpAnalytics.showLess') }}
                </button>
              </div>

              <div
                v-else-if="isExpanded(row.question.id) && !drillLoading && !drillError"
                class="rounded-lg bg-slate-50 p-3 text-center"
              >
                <p class="text-xs text-slate-400">
                  {{ t('management.rsvpAnalytics.drill.noFreeText') }}
                </p>
              </div>
            </div>

            <!-- Drill loading / error -->
            <div
              v-if="isExpanded(row.question.id) && drillLoading"
              class="mt-3 flex items-center justify-center py-3"
            >
              <div
                class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-emerald-600"
              />
              <span class="ml-2 text-xs text-slate-500">
                {{ t('management.rsvpAnalytics.drill.loading') }}
              </span>
            </div>
            <div
              v-else-if="isExpanded(row.question.id) && drillError"
              class="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
            >
              {{ drillError }}
            </div>

            <!-- Still-expected list -->
            <div
              v-if="
                isExpanded(row.question.id) &&
                drillData &&
                drillData.guests_without_answer.length > 0
              "
              class="mt-4 border-t border-dashed border-amber-200 pt-3"
            >
              <div class="mb-2 flex items-center justify-between">
                <p class="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                  {{ t('management.rsvpAnalytics.drill.missingTitle') }}
                </p>
                <span class="text-[10px] tabular-nums text-amber-700/70">
                  {{ drillData.guests_without_answer.length }}
                </span>
              </div>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="guest in visibleMissingGuests"
                  :key="guest.id"
                  class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800"
                >
                  <span
                    v-if="guest.group_color"
                    class="h-1 w-1 flex-shrink-0 rounded-full"
                    :style="{ backgroundColor: guest.group_color }"
                  />
                  {{ guest.name }}
                </span>

                <button
                  v-if="!showAllMissing && collapsedMissingRemainder > 0"
                  type="button"
                  class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100/60 px-2 py-0.5 text-[10px] font-medium text-amber-700 transition-colors duration-200 hover:bg-amber-100"
                  @click="showAllMissing = true"
                >
                  +{{ collapsedMissingRemainder }} {{ t('management.rsvpAnalytics.chase.moreShort') }}
                </button>
                <button
                  v-else-if="
                    showAllMissing &&
                    drillData.guests_without_answer.length > MISSING_PREVIEW_COUNT
                  "
                  type="button"
                  class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100/60 px-2 py-0.5 text-[10px] font-medium text-amber-700 transition-colors duration-200 hover:bg-amber-100"
                  @click="showAllMissing = false"
                >
                  {{ t('management.rsvpAnalytics.showLess') }}
                </button>
              </div>
              <p
                v-if="showAllMissing && drillData.guests_without_answer_truncated"
                class="mt-2 text-[10px] text-amber-700/70"
              >
                {{ t('management.rsvpAnalytics.drill.missingTruncated') }}
              </p>
            </div>
          </div>
        </article>
      </template>
    </div>

    <!-- Create editor, where the new question will land -->
    <RsvpQuestionForm
      v-if="isCreating"
      ref="createFormRef"
      :class="rows.length > 0 ? 'mt-3' : ''"
      :question="null"
      :is-saving="isSaving"
      @save="handleSave"
      @cancel="closeEditor"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  MessageSquareText,
  Plus,
  Trash2,
  X,
} from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import RsvpQuestionForm from './RsvpQuestionForm.vue'
import { rsvpQuestionsService } from '../../services/api'
import type {
  CreateRsvpQuestionRequest,
  EventRsvpQuestion,
  EventRsvpQuestionType,
  GuestRsvpQuestionBreakdown,
  GuestRsvpStatus,
  RsvpQuestionResponses,
} from '../../services/api'

const { t, locale } = useAppLanguage()

const props = defineProps<{
  eventId: string
  /** Authoring source of truth — ordered, with translations. */
  questions: EventRsvpQuestion[]
  /** Answer stats, keyed back to questions by id. May lag by one refresh. */
  breakdowns: GuestRsvpQuestionBreakdown[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

// ---- Rows ----------------------------------------------------------------
/**
 * One list drives both authoring and results. It's built from `questions`
 * (not `breakdowns`) so a freshly created question shows up immediately even
 * if the summary hasn't caught up yet.
 */
interface QuestionRow {
  question: EventRsvpQuestion
  breakdown: GuestRsvpQuestionBreakdown | null
  totalAnswers: number
}

const rows = computed<QuestionRow[]>(() => {
  const byId = new Map(props.breakdowns.map((b) => [b.question_id, b]))
  return [...props.questions]
    .sort((a, b) => a.order - b.order)
    .map((question) => {
      const breakdown = byId.get(question.id) ?? null
      return { question, breakdown, totalAnswers: breakdown?.total_answers ?? 0 }
    })
})

// ---- Localisation --------------------------------------------------------
const questionText = (row: QuestionRow): string => {
  const q = row.question
  if (locale.value === 'en') return q.question_text
  const match = q.translations?.find((tr) => tr.language === locale.value)
  return match?.question_text?.trim() || q.question_text
}

const localizeChoice = (row: QuestionRow, baseChoice: string): string => {
  const q = row.question
  if (locale.value === 'en' || !q.choices || !q.translations) return baseChoice
  const idx = q.choices.indexOf(baseChoice)
  if (idx === -1) return baseChoice
  const match = q.translations.find((tr) => tr.language === locale.value)
  return match?.choices?.[idx]?.trim() || baseChoice
}

const typeLabels: Record<EventRsvpQuestionType, string> = {
  text: 'text',
  long_text: 'long_text',
  yes_no: 'yes_no',
  single_choice: 'single_choice',
  multi_choice: 'multi_choice',
}

const getTypeLabel = (type: string) => {
  const key = typeLabels[type as EventRsvpQuestionType] ?? 'text'
  return t(`management.rsvpQuestions.types.${key}`)
}

// ---- Inline editor state -------------------------------------------------
const editingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
const isCreating = ref(false)

const isSaving = ref(false)
const isDeleting = ref(false)
const isReordering = ref(false)
const actionError = ref<string | null>(null)

// A `ref` inside `v-for` collects into an array; only one row is ever in
// edit mode, so this holds at most one entry.
const editFormRef = ref<InstanceType<typeof RsvpQuestionForm>[]>([])
const createFormRef = ref<InstanceType<typeof RsvpQuestionForm> | null>(null)

const closeEditor = () => {
  if (isSaving.value) return
  editingId.value = null
  isCreating.value = false
  deletingId.value = null
}

const startCreate = () => {
  closeEditor()
  isCreating.value = true
}

const startEdit = (row: QuestionRow) => {
  closeEditor()
  editingId.value = row.question.id
}

const startDelete = (row: QuestionRow) => {
  closeEditor()
  deletingId.value = row.question.id
}

/** Surface a server error inside whichever editor is currently open. */
const showEditorError = (msg: string) => {
  const form = isCreating.value ? createFormRef.value : editFormRef.value?.[0]
  form?.setErrorMessage(msg)
}

const handleSave = async (payload: CreateRsvpQuestionRequest) => {
  const editTarget = editingId.value
  isSaving.value = true
  actionError.value = null
  try {
    let response
    if (editTarget !== null) {
      response = await rsvpQuestionsService.updateQuestion(props.eventId, editTarget, payload)
    } else {
      // Append at the end by default.
      const last = rows.value[rows.value.length - 1]?.question
      response = await rsvpQuestionsService.createQuestion(props.eventId, {
        ...payload,
        order: last ? last.order + 1 : 0,
      })
    }

    if (response.success) {
      // Reset directly rather than via closeEditor(), which stands down
      // while isSaving is still true.
      editingId.value = null
      isCreating.value = false
      // Edited choices/labels invalidate any cached drill results.
      drillCache.clear()
      drillData.value = null
      emit('refresh')
      return
    }
    showEditorError(response.message || t('management.rsvpQuestions.modal.errorGeneric'))
  } catch {
    showEditorError(t('management.rsvpQuestions.modal.errorGeneric'))
  } finally {
    isSaving.value = false
  }
}

const moveQuestion = async (index: number, delta: -1 | 1) => {
  const next = index + delta
  if (next < 0 || next >= rows.value.length) return

  const reordered = rows.value.map((r) => r.question)
  const [moved] = reordered.splice(index, 1)
  reordered.splice(next, 0, moved)

  isReordering.value = true
  actionError.value = null
  try {
    const response = await rsvpQuestionsService.bulkReorderQuestions(props.eventId, {
      updates: reordered.map((q, i) => ({ id: q.id, order: i })),
    })
    if (response.success) {
      emit('refresh')
    } else {
      actionError.value =
        response.message || t('management.rsvpQuestions.modal.errorGeneric')
    }
  } catch {
    actionError.value = t('management.rsvpQuestions.modal.errorGeneric')
  } finally {
    isReordering.value = false
  }
}

const confirmDelete = async (row: QuestionRow) => {
  isDeleting.value = true
  actionError.value = null
  try {
    const response = await rsvpQuestionsService.deleteQuestion(props.eventId, row.question.id)
    if (response.success) {
      if (expandedQuestionId.value === row.question.id) {
        expandedQuestionId.value = null
        drillData.value = null
      }
      drillCache.clear()
      emit('refresh')
    } else {
      actionError.value =
        response.message || t('management.rsvpQuestions.modal.errorGeneric')
    }
  } catch {
    actionError.value = t('management.rsvpQuestions.modal.errorGeneric')
  } finally {
    isDeleting.value = false
    // Always dismiss the confirm — on failure it would otherwise cover the
    // error banner it just produced.
    deletingId.value = null
  }
}

// ---- Breakdown bars ------------------------------------------------------
interface BreakdownBar {
  label: string
  count: number
  percentOfTotal: number
}

const getSortedBreakdown = (row: QuestionRow): BreakdownBar[] => {
  const raw = row.breakdown?.breakdown
  if (!raw) return []
  const entries = Object.entries(raw)
  if (entries.length === 0) return []
  const total = row.totalAnswers || 1
  return entries
    .map(([label, count]) => ({
      label,
      count,
      percentOfTotal: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

// Collapsed rows only preview the top choice bars; expanding shows all.
const CHOICE_ROWS_PREVIEW_COUNT = 5

const getVisibleBreakdown = (row: QuestionRow): BreakdownBar[] => {
  const bars = getSortedBreakdown(row)
  return isExpanded(row.question.id) ? bars : bars.slice(0, CHOICE_ROWS_PREVIEW_COUNT)
}

const hiddenChoiceCount = (row: QuestionRow): number => {
  if (isExpanded(row.question.id)) return 0
  return Math.max(0, getSortedBreakdown(row).length - CHOICE_ROWS_PREVIEW_COUNT)
}

// A collapsed row only renders a body when there are choice bars to preview.
const hasCollapsedPreview = (row: QuestionRow): boolean =>
  row.totalAnswers > 0 && getSortedBreakdown(row).length > 0

// ---- Drill-through -------------------------------------------------------
// Expanding a question lazy-loads its drill-through. Results are cached by
// question id + status filter so re-expanding or re-filtering is free.
const expandedQuestionId = ref<number | null>(null)
const drillFilter = ref<GuestRsvpStatus | null>(null)
const drillLoading = ref(false)
const drillError = ref<string | null>(null)
const drillData = ref<RsvpQuestionResponses | null>(null)
const drillCache = new Map<string, RsvpQuestionResponses>()

const drillFilterOptions = computed<
  Array<{ key: string; value: GuestRsvpStatus | null; label: string }>
>(() => [
  { key: 'all', value: null, label: t('management.rsvpAnalytics.drill.filterAll') },
  { key: 'attending', value: 'attending', label: t('management.rsvpStatuses.going') },
  { key: 'maybe', value: 'maybe', label: t('management.rsvpStatuses.maybe') },
  { key: 'not_attending', value: 'not_attending', label: t('management.rsvpStatuses.declined') },
])

const isExpanded = (questionId: number) => expandedQuestionId.value === questionId

// Progressive disclosure for the "still expected to answer" list.
const MISSING_PREVIEW_COUNT = 8
const showAllMissing = ref(false)

const visibleMissingGuests = computed(() => {
  const guests = drillData.value?.guests_without_answer ?? []
  return showAllMissing.value ? guests : guests.slice(0, MISSING_PREVIEW_COUNT)
})

const collapsedMissingRemainder = computed(() => {
  const guests = drillData.value?.guests_without_answer ?? []
  return Math.max(0, guests.length - MISSING_PREVIEW_COUNT)
})

// Per-bucket guest chips collapse independently, keyed by answer label.
const BUCKET_PREVIEW_COUNT = 8
const expandedBuckets = ref(new Set<string>())

const isBucketExpanded = (label: string) => expandedBuckets.value.has(label)

const toggleBucket = (label: string) => {
  const next = new Set(expandedBuckets.value)
  if (next.has(label)) next.delete(label)
  else next.add(label)
  expandedBuckets.value = next
}

/**
 * Guests in a given choice bucket of the expanded question's drill-through.
 * Empty until drill data loads, or if the bucket isn't in `grouped_by_answer`.
 */
const getBucketGuests = (answerLabel: string) => {
  const buckets = drillData.value?.grouped_by_answer
  if (!buckets) return []
  return buckets.find((b) => b.answer === answerLabel)?.guests ?? []
}

const getVisibleBucketGuests = (label: string) => {
  const guests = getBucketGuests(label)
  return isBucketExpanded(label) ? guests : guests.slice(0, BUCKET_PREVIEW_COUNT)
}

const bucketRemainder = (label: string) =>
  Math.max(0, getBucketGuests(label).length - BUCKET_PREVIEW_COUNT)

// Free-text answers preview the most recent few, with a show-all toggle.
const FREE_TEXT_PREVIEW_COUNT = 5
const showAllFreeText = ref(false)

const visibleFreeTextAnswers = computed(() => {
  const answers = drillData.value?.free_text_answers ?? []
  return showAllFreeText.value ? answers : answers.slice(0, FREE_TEXT_PREVIEW_COUNT)
})

const freeTextRemainder = computed(() => {
  const answers = drillData.value?.free_text_answers ?? []
  return Math.max(0, answers.length - FREE_TEXT_PREVIEW_COUNT)
})

const loadDrill = async (questionId: number, filter: GuestRsvpStatus | null) => {
  drillError.value = null

  const cacheKey = `${questionId}|${filter ?? 'all'}`
  const cached = drillCache.get(cacheKey)
  if (cached) {
    drillData.value = cached
    return
  }

  drillData.value = null
  drillLoading.value = true
  try {
    const response = await rsvpQuestionsService.getQuestionResponses(
      props.eventId,
      questionId,
      filter ? { rsvp_status: filter } : undefined,
    )
    if (response.success && response.data) {
      drillCache.set(cacheKey, response.data)
      if (expandedQuestionId.value === questionId && drillFilter.value === filter) {
        drillData.value = response.data
      }
    } else {
      drillError.value = response.message || t('management.rsvpAnalytics.drill.loadError')
    }
  } catch {
    drillError.value = t('management.rsvpAnalytics.drill.loadError')
  } finally {
    drillLoading.value = false
  }
}

const toggleQuestion = (questionId: number) => {
  if (expandedQuestionId.value === questionId) {
    expandedQuestionId.value = null
    drillData.value = null
    drillError.value = null
    return
  }

  expandedQuestionId.value = questionId
  drillFilter.value = null
  showAllMissing.value = false
  showAllFreeText.value = false
  expandedBuckets.value = new Set()
  loadDrill(questionId, null)
}

const setDrillFilter = (filter: GuestRsvpStatus | null) => {
  if (drillFilter.value === filter) return
  drillFilter.value = filter
  showAllMissing.value = false
  showAllFreeText.value = false
  expandedBuckets.value = new Set()
  if (expandedQuestionId.value !== null) {
    loadDrill(expandedQuestionId.value, filter)
  }
}

const formatRelativeDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

// Saving/deleting invalidates cached drill results for the whole event.
watch(
  () => props.eventId,
  () => {
    drillCache.clear()
    expandedQuestionId.value = null
    drillFilter.value = null
    drillData.value = null
    closeEditor()
  },
)
</script>
