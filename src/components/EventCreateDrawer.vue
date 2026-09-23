<template>
  <Teleport to="body">
    <!-- `appear` on both: LandingView mounts this lazily with `isVisible`
         already true, and sign-in's return trip mounts EventsView with it true
         too. Without it the panel would pop in with no slide. -->
    <Transition name="drawer-backdrop" appear>
      <div
        v-if="isVisible"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="handleBackdropClick"
      />
    </Transition>

    <Transition name="drawer-panel" appear>
      <div
        v-if="isVisible"
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[36.25rem] lg:w-[40rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header: context, a way out, and where in the four steps you are. -->
        <div class="flex-shrink-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center gap-2 px-3 pt-2.5 pb-2">
            <button
              type="button"
              :disabled="isBusy"
              class="p-1.5 hover:bg-white/20 active:bg-white/30 disabled:opacity-40 disabled:pointer-events-none rounded-lg drawer-close flex-shrink-0"
              :title="t('common.actions.close')"
              :aria-label="t('common.actions.close')"
              @click="close"
            >
              <ArrowRight class="w-5 h-5 text-white" />
            </button>
            <h2 :id="titleId" class="text-base font-semibold text-white truncate">
              {{ t('events.createDrawer.title') }}
            </h2>
          </div>

          <!-- One segment per step, filled up to the current one. A segment
               fills from its left edge going forward and empties back towards
               it going back, so the bar moves the way the page does. -->
          <div
            class="flex gap-1.5 px-4 pb-3"
            role="progressbar"
            :aria-label="progressLabel"
            :aria-valuetext="progressLabel"
            aria-valuemin="1"
            :aria-valuemax="STEPS.length"
            :aria-valuenow="stepIndex + 1"
          >
            <span v-for="(id, index) in STEPS" :key="id" class="wizard-seg" aria-hidden="true">
              <span class="wizard-seg__fill" :class="{ 'is-filled': index <= stepIndex }" />
            </span>
          </div>
        </div>

        <!-- Body. `overflow-x-hidden` because a step slides in from 2rem off to
             the side, and a transformed child still counts as scrollable
             overflow — without it a horizontal scrollbar flashes per step. -->
        <div ref="bodyEl" class="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          <!-- One <form> across all four steps, submitted by the footer's
               primary button through its `form` attribute, so Enter in any
               field means "Continue" and the last step's Enter means Create. -->
          <form
            :id="formId"
            class="wizard-steps"
            :class="isBusy ? 'form-busy' : ''"
            :inert="isBusy"
            novalidate
            @submit.prevent="next"
          >
            <!-- Both steps share one grid cell while they cross, so the page
                 slides rather than stacking the next step under the last. -->
            <Transition :name="`wizard-${direction}`" @after-enter="onStepEntered">
              <div :key="step" class="wizard-step p-4 pb-6">
                <!-- 1 · What kind of event -->
                <template v-if="step === 'type'">
                  <div class="mb-5">
                    <h3 data-step-focus tabindex="-1" class="wizard-question">
                      {{ t('events.createDrawer.steps.type.title') }}
                    </h3>
                    <p class="wizard-hint">{{ t('events.createDrawer.steps.type.hint') }}</p>
                  </div>
                  <CreateEventCategoryStep
                    :state="categoryStepState"
                    :featured="tiers?.featured ?? []"
                    :others="tiers?.others ?? []"
                    :model-value="form.category"
                    @pick="pickCategory"
                    @retry="loadCategories"
                  />
                </template>

                <!-- 2 · Its name. The question is the input's label. -->
                <template v-else-if="step === 'name'">
                  <div class="mb-5">
                    <label :for="titleInputId" class="wizard-question block">
                      {{ t('events.createDrawer.steps.name.title') }}
                    </label>
                    <p :id="`${titleInputId}-hint`" class="wizard-hint">
                      {{ t('events.createDrawer.steps.name.hint') }}
                    </p>
                  </div>
                  <input
                    :id="titleInputId"
                    v-model="form.title"
                    data-step-focus
                    type="text"
                    autocomplete="off"
                    enterkeyhint="next"
                    maxlength="200"
                    :aria-describedby="`${titleInputId}-hint`"
                    :placeholder="titlePlaceholder"
                    class="w-full px-3.5 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  />
                </template>

                <!-- 3 · When -->
                <template v-else-if="step === 'when'">
                  <div class="mb-5">
                    <h3 data-step-focus tabindex="-1" class="wizard-question">
                      {{ t('events.createDrawer.steps.when.title') }}
                    </h3>
                  </div>
                  <div class="space-y-1.5">
                    <div class="list-group">
                      <DateTimeDisclosureRow
                        :label="t('events.createDrawer.fields.starts')"
                        :model-value="form.start_date"
                        :expanded="openDateRow === 'start'"
                        :quick-times="commonStartTimes"
                        @update:model-value="onStartDateChange"
                        @update:expanded="setDateRow('start', $event)"
                      />
                      <DateTimeDisclosureRow
                        v-model="form.end_date"
                        :label="t('events.createDrawer.fields.ends')"
                        :expanded="openDateRow === 'end'"
                        :min="form.start_date"
                        :error="!!dateError"
                        :quick-times="commonEndTimes"
                        @update:expanded="setDateRow('end', $event)"
                      />
                    </div>
                    <!-- One slot, two jobs: the duration confirms the pair reads
                         the way the organizer meant, and the error replaces it
                         when it does not. Neither moves anything below. -->
                    <p
                      class="px-1 text-xs"
                      :class="dateError ? 'text-red-600' : 'text-slate-500'"
                      :aria-live="dateError ? 'polite' : 'off'"
                    >
                      {{ dateError || durationLabel }}
                    </p>
                  </div>
                </template>

                <!-- 4 · Review and the settings that can wait -->
                <template v-else>
                  <div class="mb-5">
                    <h3 data-step-focus tabindex="-1" class="wizard-question">
                      {{ t('events.createDrawer.steps.details.title') }}
                    </h3>
                    <p class="wizard-hint">{{ t('events.createDrawer.steps.details.hint') }}</p>
                  </div>

                  <div class="space-y-5">
                    <!-- What is about to be created, one tap from changing it.
                         It also answers "is this still mine?" for someone who
                         comes back to this step from the sign-in page. -->
                    <div class="list-group">
                      <button
                        v-for="row in reviewRows"
                        :key="row.step"
                        type="button"
                        class="list-row"
                        @click="goTo(STEPS.indexOf(row.step))"
                      >
                        <span class="list-row__label flex-shrink-0">{{ row.label }}</span>
                        <span class="flex items-center gap-1.5 min-w-0">
                          <span class="list-row__value truncate text-slate-500">{{ row.value }}</span>
                          <ChevronRight class="w-4 h-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                        </span>
                      </button>
                    </div>

                    <!-- Who can see it -->
                    <div class="space-y-2">
                      <p class="block text-sm font-medium text-slate-700">
                        {{ t('events.createDrawer.fields.visibility') }}
                      </p>
                      <SegmentedField
                        :model-value="form.privacy"
                        :options="privacyOptions"
                        :aria-label="t('events.createDrawer.fields.visibility')"
                        @update:model-value="form.privacy = $event as 'public' | 'private'"
                      />
                      <p class="px-1 text-xs text-slate-500 leading-relaxed">
                        {{
                          isPublic
                            ? t('events.createDrawer.privacyToggle.publicDescription')
                            : t('events.createDrawer.privacyToggle.privateDescription')
                        }}
                      </p>
                    </div>

                    <!-- The description is public-facing copy, so it belongs to
                         the visibility choice that creates its audience. -->
                    <Transition name="drawer-reveal">
                      <div v-if="isPublic" class="grid grid-rows-[1fr]">
                        <div class="min-h-0 overflow-hidden">
                          <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">
                              {{ t('events.createDrawer.fields.aboutEvent') }}
                            </label>
                            <div
                              :ref="bindDescriptionEditor"
                              contenteditable="true"
                              role="textbox"
                              aria-multiline="true"
                              :aria-label="t('events.createDrawer.fields.aboutEvent')"
                              class="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white text-slate-800 leading-relaxed min-h-[8.75rem] max-h-[20rem] overflow-y-auto"
                              :data-placeholder="
                                form.description
                                  ? ''
                                  : t('events.createDrawer.fields.descriptionPlaceholder')
                              "
                              @input="handleDescriptionInput"
                              @blur="handleDescriptionInput"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </Transition>

                    <!-- Registration. One list that grows: the switch decides
                         whether the two rows under it exist at all. -->
                    <div class="list-group">
                      <button
                        type="button"
                        role="switch"
                        :aria-checked="form.registration_required"
                        class="list-row"
                        @click="form.registration_required = !form.registration_required"
                      >
                        <span class="list-row__text">
                          <span class="list-row__label">
                            {{ t('events.createDrawer.requireRegistration.label') }}
                          </span>
                          <span class="list-row__hint">
                            {{ t('events.createDrawer.requireRegistration.description') }}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          class="switch-track"
                          :class="form.registration_required ? 'is-on' : ''"
                        >
                          <span class="switch-knob" />
                        </span>
                      </button>

                      <Transition name="drawer-reveal">
                        <div v-if="form.registration_required" class="grid grid-rows-[1fr]">
                          <div class="min-h-0 overflow-hidden">
                            <DateTimeDisclosureRow
                              v-model="form.registration_deadline"
                              :label="t('events.createDrawer.fields.registrationDeadline')"
                              :expanded="openDateRow === 'deadline'"
                              :max="form.start_date"
                              clearable
                              :placeholder="t('events.createDrawer.fields.deadlinePlaceholder')"
                              @update:expanded="setDateRow('deadline', $event)"
                            />
                            <div class="list-row border-t border-slate-100">
                              <label :for="maxAttendeesId" class="list-row__label">
                                {{ t('events.createDrawer.fields.maxAttendees') }}
                              </label>
                              <input
                                :id="maxAttendeesId"
                                v-model.number="form.max_attendees"
                                type="number"
                                inputmode="numeric"
                                min="1"
                                class="list-input"
                                :placeholder="t('events.createDrawer.fields.maxAttendeesPlaceholder')"
                              />
                            </div>
                          </div>
                        </div>
                      </Transition>
                    </div>

                    <!-- Auto-fill answers the category question, so it only
                         exists once there is a category to fill from. -->
                    <div v-if="form.category !== null" class="list-group">
                      <button
                        type="button"
                        role="switch"
                        :aria-checked="form.auto_populate"
                        class="list-row"
                        @click="form.auto_populate = !form.auto_populate"
                      >
                        <span class="list-row__text">
                          <span class="list-row__label">
                            {{ t('events.createDrawer.autoPopulate.label') }}
                          </span>
                          <span class="list-row__hint">
                            {{ t('events.createDrawer.autoPopulate.description') }}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          class="switch-track"
                          :class="form.auto_populate ? 'is-on' : ''"
                        >
                          <span class="switch-knob" />
                        </span>
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </Transition>
          </form>
        </div>

        <!-- Footer. Back on the left and forward on the right — the wizard
             convention GuestRSVPSection already uses, and the direction the
             pages slide — rather than the create/edit drawers' primary-left. -->
        <div
          class="flex-shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
        >
          <!-- Said before the press, not after: Create is about to open a
               sign-in page, and the one worry that raises is answered here. -->
          <p
            v-if="isLastStep && !authStore.isAuthenticated"
            class="mb-3 flex items-start gap-2 text-xs text-slate-500 leading-relaxed"
          >
            <LogIn class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{{ t('events.createDrawer.signInNote') }}</span>
          </p>

          <div class="flex items-center justify-between gap-3">
            <button
              type="button"
              :disabled="isBusy"
              class="inline-flex items-center gap-1 px-3 py-2 min-h-[2.5rem] text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-[background-color,transform,opacity] duration-150 ease-out active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              @click="back"
            >
              <ChevronLeft v-if="stepIndex > 0" class="w-4 h-4 -ml-1" aria-hidden="true" />
              {{ stepIndex > 0 ? t('events.createDrawer.actions.back') : t('events.createDrawer.actions.cancel') }}
            </button>

            <!-- Every label the primary will ever show is stacked in one grid
                 cell, so it measures to the widest once and never changes size
                 — not between steps, and not while it works. The faces not on
                 show are hidden from assistive tech: stacked, all four would be
                 read out as the button's one name. -->
            <button
              type="submit"
              :form="formId"
              :disabled="isBusy || !canContinue"
              :class="[
                'action-btn',
                primaryFace === 'created' ? 'is-complete' : '',
                !isBusy && !canContinue ? 'is-unavailable' : '',
              ]"
              class="grid px-4 py-2 min-h-[2.5rem] bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md"
            >
              <span
                class="action-face"
                :data-on="primaryFace === 'continue'"
                :aria-hidden="primaryFace !== 'continue'"
              >
                <span>{{ t('events.createDrawer.actions.continue') }}</span>
                <ArrowRight class="w-4 h-4" aria-hidden="true" />
              </span>
              <span
                class="action-face"
                :data-on="primaryFace === 'create'"
                :aria-hidden="primaryFace !== 'create'"
              >
                <span>{{ t('events.createDrawer.actions.create') }}</span>
              </span>
              <span
                class="action-face"
                :data-on="primaryFace === 'creating'"
                :aria-hidden="primaryFace !== 'creating'"
              >
                <Loader class="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>{{ t('events.createDrawer.actions.creating') }}</span>
              </span>
              <span
                class="action-face"
                :data-on="primaryFace === 'created'"
                :aria-hidden="primaryFace !== 'created'"
                aria-live="polite"
              >
                <Check class="w-4 h-4" aria-hidden="true" />
                <span>{{ t('events.createDrawer.actions.created') }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Create an event, as four questions: what kind, what it's called, when, and
 * the settings that can wait. Nobody is asked to sign in first.
 *
 * The flow this serves: a visitor presses "Create your first event" on the
 * landing, answers the four steps, and presses Create. Signed in, the event is
 * created and they land in its Design Studio — with the template browser open
 * if the category has invitation designs, on the Showcase tab otherwise
 * (newEventLocation). Signed out, the form is saved as a draft and they go to
 * sign-in, which brings them back to `/events?createEvent=resume`; the wizard
 * reopens on its last step with their answers and creates the event without a
 * second press (the `resume` prop).
 *
 * So this component owns the whole create, not just the form: the request, the
 * draft, the sign-in detour and the hand-off to the new event. Its parents only
 * decide when it is open.
 */
import { computed, onUnmounted, reactive, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader,
  Lock,
  LogIn,
} from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '@/composables/useToast'
import { useActionConfirmation } from '@/composables/useActionConfirmation'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import { useDurationLabel } from '@/composables/useDurationLabel'
import { useFocusTrap } from '@/composables/useFocusTrap'
import {
  categoryHasDesigns,
  loadDesignCountsWithin,
  useDesignCategories,
} from '@/composables/event/useDesignCategories'
import { useAuthStore } from '@/stores/auth'
import DateTimeDisclosureRow from '@/components/common/DateTimeDisclosureRow.vue'
import SegmentedField, { type SegmentedOption } from '@/components/common/SegmentedField.vue'
import CreateEventCategoryStep from '@/components/events/CreateEventCategoryStep.vue'
import { formatDateTimeDisplay } from '@/components/common/dateTimeValue'
import {
  eventCategoriesService,
  eventsService,
  type Event as EventRecord,
  type EventCategory,
} from '@/services/api'
import eventDescriptionTemplates from '@/assets/event-description-templates.json'
import { sanitizeRichContent } from '@/utils/sanitize'
import { normalizeCategoryKey } from '@/utils/categoryKey'
import { SHOWCASE_CATEGORIES } from '@/utils/showcaseCategories'
import {
  CREATE_EVENT_RESUME_PATH,
  clearCreateEventDraft,
  createEventFormDefaults,
  findCreatedEventId,
  newEventLocation,
  readCreateEventDraft,
  saveCreateEventDraft,
  toCreateEventPayload,
  toLocalInputString,
  type CreateEventForm,
} from '@/utils/createEventForm'

const props = defineProps<{
  isVisible: boolean
  /**
   * Opened by sign-in's return trip: reopen on the last step with the saved
   * draft and create it straight away. The visitor already pressed Create —
   * before they were asked who they were — so asking again would be a toll.
   */
  resume?: boolean
}>()

const emit = defineEmits<{
  close: []
  /**
   * Only when an event was created but could not be opened (its id could not
   * be found): the host's list is where it now is, so the host refreshes it.
   */
  created: []
}>()

const { t, locale } = useAppLanguage()
const { showError } = useToast()
const { translateEventCategory } = useCategoryTranslation()
const router = useRouter()
const authStore = useAuthStore()

const uid = useId()
const titleId = `create-event-title-${uid}`
const formId = `create-event-form-${uid}`
const titleInputId = `create-event-name-${uid}`
const maxAttendeesId = `create-event-max-${uid}`

// Common start/end times for hosted events (weddings, birthdays, housewarmings,
// etc.) so a typical slot is one tap rather than a scroll of the wheel.
const commonStartTimes = [8, 10, 12, 14, 17, 18]
const commonEndTimes = [12, 14, 17, 19, 21, 22]

/* ── Steps ─────────────────────────────────────────────────────────────── */

const STEPS = ['type', 'name', 'when', 'details'] as const
type StepId = (typeof STEPS)[number]
const LAST_STEP = STEPS.length - 1

const stepIndex = ref(0)
const direction = ref<'forward' | 'back'>('forward')
const step = computed<StepId>(() => STEPS[stepIndex.value])
const isLastStep = computed(() => stepIndex.value === LAST_STEP)

const progressLabel = computed(() =>
  t('events.createDrawer.progress', { current: stepIndex.value + 1, total: STEPS.length }),
)

/* ── The form ──────────────────────────────────────────────────────────── */

const form = reactive<CreateEventForm>(createEventFormDefaults())

const isPublic = computed(() => form.privacy === 'public')

/**
 * A choice between two named things, not an on/off. As a switch this flipped
 * its own label between "Public Event" and "Private Event", so the off state
 * had no stable meaning.
 */
const privacyOptions = computed<SegmentedOption[]>(() => [
  { value: 'private', label: t('events.createDrawer.privacyOptions.private'), icon: Lock },
  { value: 'public', label: t('events.createDrawer.privacyOptions.public'), icon: Globe },
])

/* ── Categories, and which of them have designs ────────────────────────── */

const categories = ref<EventCategory[]>([])
const categoriesState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const designs = useDesignCategories()

/**
 * How long the first question waits on the design catalogue before drawing its
 * two tiers from the studio list instead. A late answer still decides where the
 * new event lands; it just doesn't reshuffle rows under someone's finger.
 */
const DESIGNS_RENDER_CAP_MS = 1500

const loadCategories = async () => {
  categoriesState.value = 'loading'
  try {
    const response = await eventCategoriesService.getCategories()
    if (response.success && response.data) {
      categories.value = (response.data.results || []).filter((c) => c.is_active !== false)
      categoriesState.value = 'ready'
      return
    }
  } catch {
    // Reported below.
  }
  categoriesState.value = 'error'
}

const showcaseRank = (category: EventCategory) => {
  const name = category.name.toLowerCase()
  const rank = SHOWCASE_CATEGORIES.findIndex((prefix) => name.startsWith(prefix))
  return rank === -1 ? SHOWCASE_CATEGORIES.length : rank
}

/** The two tiers, fixed the first time both answers are in. */
const tiers = ref<{ featured: EventCategory[]; others: EventCategory[] } | null>(null)

watch(
  [categoriesState, designs.settled],
  ([state, settled]) => {
    if (tiers.value || state !== 'ready' || !settled) return
    const counts = designs.counts.value
    const featured = categories.value.filter((category) => designs.hasDesigns(category))
    // Most designs first — the categories the product is richest in lead. The
    // sort is stable, so ties keep the API's order.
    featured.sort((a, b) =>
      counts
        ? (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)
        : showcaseRank(a) - showcaseRank(b),
    )
    tiers.value = {
      featured,
      others: categories.value.filter((category) => !featured.includes(category)),
    }
  },
  { immediate: true },
)

const categoryStepState = computed<'loading' | 'ready' | 'error'>(() => {
  if (categoriesState.value === 'error') return 'error'
  return tiers.value ? 'ready' : 'loading'
})

const selectedCategory = computed(
  () => categories.value.find((category) => category.id === form.category) ?? null,
)

const descriptionTemplates = eventDescriptionTemplates.templates as Record<
  string,
  { description: string }
>

/** Untouched, or still exactly some category's template — safe to replace. */
const descriptionIsReplaceable = (text: string) =>
  !text || Object.values(descriptionTemplates).some((entry) => entry.description === text)

/**
 * A category is an answer with consequences: it switches auto-fill on (the fill
 * comes from the category, so arriving off made the switch an offer to accept
 * twice) and seeds the description from its template. The description is only
 * replaced while it is still a template — never text the organizer wrote.
 */
const applyCategory = (id: number) => {
  form.category = id
  form.auto_populate = true
  if (!descriptionIsReplaceable(form.description)) return
  const category = categories.value.find((c) => c.id === id)
  form.description = (category && descriptionTemplates[category.name.toLowerCase()]?.description) || ''
  paintDescriptionEditor()
}

/**
 * Long enough for the tick to land under the finger that chose it, short
 * enough not to read as a wait.
 */
const PICK_ADVANCE_MS = 220
let advanceTimer: ReturnType<typeof setTimeout> | undefined

/** A tap on a category is the answer, so it moves the page on by itself. */
const pickCategory = (id: number) => {
  if (isBusy.value) return
  if (form.category !== id) applyCategory(id)
  clearTimeout(advanceTimer)
  advanceTimer = setTimeout(() => {
    if (step.value === 'type') next()
  }, PICK_ADVANCE_MS)
}

/** The example in the name field, matched to what they said they're planning. */
const titlePlaceholder = computed(() => {
  const key = selectedCategory.value ? normalizeCategoryKey(selectedCategory.value.name) : ''
  const kind = ['wedding', 'birthday', 'funeral', 'housewarming'].find((k) => key.startsWith(k))
  return t(`events.createDrawer.steps.name.placeholders.${kind ?? 'default'}`)
})

/* ── Dates ─────────────────────────────────────────────────────────────── */

/**
 * At most one date row shows its calendar. Two open calendars in one group is
 * two answers to a question the group asks once, and on a phone the second
 * pushes the first off the screen it was being read on.
 */
const openDateRow = ref<'start' | 'end' | 'deadline' | null>(null)
const setDateRow = (row: 'start' | 'end' | 'deadline', open: boolean) => {
  openDateRow.value = open ? row : null
}

const dateError = computed(() =>
  form.start_date && form.end_date && new Date(form.end_date) <= new Date(form.start_date)
    ? t('events.messages.endDateAfterStart')
    : '',
)

const durationLabel = useDurationLabel(
  () => form.start_date,
  () => form.end_date,
)

/** A new start carries the end with it, so the chosen duration survives. */
const onStartDateChange = (value: string) => {
  const oldStart = form.start_date
  const oldEnd = form.end_date
  form.start_date = value
  if (!value || !oldEnd) return

  const start = new Date(value)
  if (oldStart) {
    const duration = new Date(oldEnd).getTime() - new Date(oldStart).getTime()
    if (duration > 0) {
      form.end_date = toLocalInputString(new Date(start.getTime() + duration))
      return
    }
  }
  if (new Date(oldEnd) <= start) {
    form.end_date = toLocalInputString(new Date(start.getTime() + 2 * 60 * 60 * 1000))
  }
}

/* ── Review ────────────────────────────────────────────────────────────── */

const reviewRows = computed(() => [
  {
    step: 'type' as const,
    label: t('events.createDrawer.fields.category'),
    value: selectedCategory.value
      ? translateEventCategory(selectedCategory.value.name)
      : t('events.createDrawer.steps.details.noCategory'),
  },
  { step: 'name' as const, label: t('events.createDrawer.fields.eventTitle'), value: form.title },
  {
    step: 'when' as const,
    label: t('events.createDrawer.fields.starts'),
    value: formatDateTimeDisplay(form.start_date, locale.value === 'kh' ? 'km-KH' : 'en-US'),
  },
])

/* ── Description (rich text, public events only) ───────────────────────── */

let descriptionEditor: HTMLElement | null = null

const paintDescriptionEditor = () => {
  if (descriptionEditor) descriptionEditor.innerHTML = form.description
}

/**
 * The editor only exists on the last step of a public event, so it is painted
 * as it mounts. Vue calls a function ref on every re-render, and repainting on
 * each one would throw the caret back to the start mid-sentence — so it paints
 * only when the element is a new one.
 */
const bindDescriptionEditor = (el: unknown) => {
  const node = (el as HTMLElement | null) ?? null
  if (node && node !== descriptionEditor) node.innerHTML = form.description
  descriptionEditor = node
}

const handleDescriptionInput = (event: Event) => {
  form.description = sanitizeRichContent((event.target as HTMLElement).innerHTML, 10000)
}

/* ── Moving between steps ──────────────────────────────────────────────── */

const bodyEl = ref<HTMLElement>()
let whenVisited = false

const stepIsValid = (id: StepId): boolean => {
  switch (id) {
    // A failed category list must not wall the wizard off; the event can be
    // created without one, as it always could.
    case 'type':
      return form.category !== null || categoriesState.value === 'error'
    case 'name':
      return form.title.trim().length > 0
    case 'when':
      return !!form.start_date && !!form.end_date && !dateError.value
    default:
      return true
  }
}

const canContinue = computed(() => stepIsValid(step.value))

const goTo = (index: number) => {
  if (index === stepIndex.value || index < 0 || index > LAST_STEP) return
  clearTimeout(advanceTimer)
  direction.value = index > stepIndex.value ? 'forward' : 'back'
  openDateRow.value = null
  stepIndex.value = index
  if (bodyEl.value) bodyEl.value.scrollTop = 0

  // The date is the whole question on that page, so the first time it is
  // reached its calendar is already open.
  if (STEPS[index] === 'when' && !whenVisited) {
    whenVisited = true
    openDateRow.value = 'start'
  }
}

/** Move focus to the new step, so a screen reader hears its question. */
const onStepEntered = (el: Element) => {
  el.querySelector<HTMLElement>('[data-step-focus]')?.focus({ preventScroll: true })
}

const next = () => {
  if (isBusy.value || !canContinue.value) return
  if (isLastStep.value) {
    void submit()
    return
  }
  goTo(stepIndex.value + 1)
}

const back = () => {
  if (isBusy.value) return
  if (stepIndex.value === 0) close()
  else goTo(stepIndex.value - 1)
}

/* ── Creating ──────────────────────────────────────────────────────────── */

/** The tick needs ~280ms to arrive; past that, every millisecond delays the page it announces. */
const CREATED_HOLD_MS = 600
/** How long a create waits on the design catalogue to choose where it lands. */
const DESIGNS_WAIT_MS = 2500

const isSubmitting = ref(false)
const { confirmed: isComplete, confirm: holdConfirmation, reset: resetConfirmation } =
  useActionConfirmation(CREATED_HOLD_MS)
/**
 * Set once navigation away has begun. The confirmation's hold ends *before* its
 * follow-up runs, and the next route's chunk can take a moment to arrive — so
 * without this the button fell back to "Create" in between, pressable again.
 */
const leaving = ref<'event' | 'signin' | null>(null)
const isBusy = computed(() => isSubmitting.value || isComplete.value || leaving.value !== null)

const primaryFace = computed<'continue' | 'create' | 'creating' | 'created'>(() => {
  if (isComplete.value || leaving.value === 'event') return 'created'
  if (isSubmitting.value) return 'creating'
  return isLastStep.value ? 'create' : 'continue'
})

const createErrorMessage = (response: {
  message?: string
  errors?: Record<string, string[] | string>
}) => {
  if (response.errors && Object.keys(response.errors).length) {
    const details = Object.entries(response.errors)
      .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
      .join('; ')
    return `${t('events.messages.validationErrors')}: ${details}`
  }
  return response.message || t('events.messages.createError')
}

/**
 * The new event's id. The create response carries none today — see
 * findCreatedEventId — so it is looked up among the organizer's own events.
 * Should the backend start returning it, that is used and no lookup runs.
 * `null` only if the lookup itself fails; the event exists either way.
 */
const resolveCreatedEventId = async (created: Partial<EventRecord>): Promise<string | null> => {
  if (created.id) return created.id
  try {
    const mine = await eventsService.getMyEvents()
    if (!mine.success || !mine.data) return null
    return findCreatedEventId(
      { title: created.title ?? form.title, start_date: created.start_date },
      mine.data.organized ?? [],
    )
  } catch {
    return null
  }
}

const submit = async () => {
  if (isBusy.value) return

  // Every step is checked, not just this one: a draft brought back from storage
  // lands here directly. Except the first — the category is optional to the
  // API, and a resumed draft can arrive before the category list has.
  const invalid = STEPS.findIndex((id) => id !== 'type' && !stepIsValid(id))
  if (invalid !== -1) {
    goTo(invalid)
    return
  }

  if (!authStore.isAuthenticated) {
    saveCreateEventDraft({ ...form })
    leaving.value = 'signin'
    router
      .push({ path: '/signin', query: { redirect: CREATE_EVENT_RESUME_PATH } })
      .catch(() => {
        leaving.value = null
      })
    return
  }

  isSubmitting.value = true
  try {
    const [response, counts] = await Promise.all([
      eventsService.createEvent(toCreateEventPayload(form)),
      loadDesignCountsWithin(DESIGNS_WAIT_MS),
    ])

    if (response.success && response.data) {
      clearCreateEventDraft()
      const eventId = await resolveCreatedEventId(response.data)
      const category =
        form.category !== null ? { id: form.category, name: selectedCategory.value?.name } : null
      isSubmitting.value = false

      // No toast: the button says "Event created", and the page it opens is
      // the event.
      holdConfirmation(() => {
        leaving.value = 'event'
        if (eventId) {
          router.push(newEventLocation(eventId, categoryHasDesigns(category, counts))).catch(() => {
            leaving.value = null
          })
          return
        }
        // Created, but it could not be found to open. Never guess a URL: the
        // list is where it now is, so go there (or stay, if already there) and
        // let the host show it.
        emit('created')
        router.push('/events').finally(() => {
          leaving.value = null
          emit('close')
        })
      })
      return
    }

    showError(createErrorMessage(response))
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error creating event:', error)
    showError(t('events.messages.networkError'))
  }

  // Every failing path lands here: the drawer stays open with the answers
  // intact, so the error is something they can act on.
  isSubmitting.value = false
}

/* ── Opening and closing ───────────────────────────────────────────────── */

const panel = ref<HTMLElement>()
const { trapFocus } = useFocusTrap(panel)

/** Dismissing is a decision about this event, so the draft goes with it. */
const close = () => {
  if (isBusy.value) return
  clearCreateEventDraft()
  emit('close')
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) close()
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    // A disclosed calendar is the innermost thing on screen, so Escape closes
    // that first.
    if (openDateRow.value) {
      openDateRow.value = null
      return
    }
    close()
  } else if (e.key === 'Tab') trapFocus(e)
}

let scrollLocked = false
let focusTimer: ReturnType<typeof setTimeout> | undefined

const lockPage = () => {
  if (scrollLocked) return
  scrollLocked = true
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  document.body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
  document.addEventListener('keydown', handleKeydown)
}

const unlockPage = () => {
  if (!scrollLocked) return
  scrollLocked = false
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.removeEventListener('keydown', handleKeydown)
}

const open = () => {
  const draft = readCreateEventDraft()
  Object.assign(form, draft ?? createEventFormDefaults())

  resetConfirmation()
  isSubmitting.value = false
  leaving.value = null
  clearTimeout(advanceTimer)
  openDateRow.value = null
  direction.value = 'forward'
  // A draft only exists once every step has been answered, so it reopens where
  // it was left: on the last one, with the review list showing what is kept.
  stepIndex.value = draft ? LAST_STEP : 0
  whenVisited = !!draft

  if (categoriesState.value === 'idle' || categoriesState.value === 'error') loadCategories()
  void designs.load(DESIGNS_RENDER_CAP_MS)
  lockPage()

  if (props.resume && draft && authStore.isAuthenticated) {
    void submit()
  } else if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    // After the panel's slide, not during it. Touch skips this: focus there
    // would raise a keyboard over a page that has not arrived yet.
    focusTimer = setTimeout(() => {
      panel.value?.querySelector<HTMLElement>('[data-step-focus]')?.focus({ preventScroll: true })
    }, 400)
  }
}

watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      open()
    } else {
      clearTimeout(focusTimer)
      clearTimeout(advanceTimer)
      unlockPage()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  clearTimeout(focusTimer)
  clearTimeout(advanceTimer)
  unlockPage()
})
</script>

<style scoped src="./common/actionButton.css"></style>
<style scoped src="./common/groupedList.css"></style>

<style scoped>
/* The question each step asks. The section-title step of the type scale
   (DESIGN.md §3.2): it is the one thing on the page to read first. */
.wizard-question {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 700;
  color: rgb(15 23 42); /* slate-900 */
}

.wizard-question:focus {
  outline: none;
}

@media (min-width: 640px) {
  .wizard-question {
    font-size: 1.5rem;
    line-height: 2rem;
  }
}

.wizard-hint {
  margin-top: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.625;
  color: rgb(71 85 105); /* slate-600 */
}

/* Khmer stacks above and below the line; the Latin leading clips it. */
:lang(km) .wizard-question {
  line-height: 1.6;
}

:lang(km) .wizard-hint {
  line-height: 1.85;
}

/* ── Progress ── */
.wizard-seg {
  flex: 1 1 0;
  height: 0.25rem;
  border-radius: 9999px;
  background-color: rgb(255 255 255 / 0.3);
  overflow: hidden;
}

.wizard-seg__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background-color: #fff;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.38s cubic-bezier(0.32, 0.72, 0, 1);
}

.wizard-seg__fill.is-filled {
  transform: scaleX(1);
}

/* ── Steps ── */
.wizard-steps {
  display: grid;
}

.wizard-step {
  grid-area: 1 / 1;
  min-width: 0;
}

/*
  Forward, the next page arrives from the right and the last one leaves to the
  left; back is the mirror, so a page returns along the path it left by
  (apple-design §7). A short offset rather than a full-width slide — the eye
  reads direction from the first few pixels, and a full slide makes the drawer
  feel like it is scrolling. The outgoing page fades faster than it moves, and
  the incoming one starts fading in a beat late, so the two are never both
  readable at once; its slide starts on the press, so nothing waits.
*/
.wizard-forward-enter-active,
.wizard-back-enter-active {
  transition:
    transform 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.24s ease-out 0.05s;
}

.wizard-forward-leave-active,
.wizard-back-leave-active {
  transition:
    transform 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.14s ease-in;
  pointer-events: none;
}

.wizard-forward-enter-from,
.wizard-back-leave-to {
  opacity: 0;
  transform: translateX(2rem);
}

.wizard-forward-leave-to,
.wizard-back-enter-from {
  opacity: 0;
  transform: translateX(-2rem);
}

/* The form stays visible but stops accepting edits while the create is in
   flight, so nothing the user types can be silently dropped. */
.form-busy {
  pointer-events: none;
  opacity: 0.6;
  transition: opacity 0.2s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .wizard-forward-enter-active,
  .wizard-back-enter-active,
  .wizard-forward-leave-active,
  .wizard-back-leave-active {
    transition: opacity 0.15s linear;
  }

  .wizard-forward-enter-from,
  .wizard-back-leave-to,
  .wizard-forward-leave-to,
  .wizard-back-enter-from {
    transform: none;
  }

  .wizard-seg__fill {
    transition-duration: 0.01ms;
  }
}

/* Custom scrollbar for the step body */
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

/* Rich text editor */
[contenteditable='true'] {
  outline: none;
  white-space: pre-wrap;
  word-wrap: break-word;
}

[contenteditable='true']:empty:before {
  content: attr(data-placeholder);
  color: #94a3b8; /* slate-400 */
  pointer-events: none;
}

[contenteditable='true'] :deep(h3) {
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

[contenteditable='true'] :deep(p) {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

[contenteditable='true'] :deep(ul) {
  margin-left: 1.5rem;
  margin-bottom: 0.5rem;
  list-style-type: disc;
}

[contenteditable='true'] :deep(li) {
  margin-bottom: 0.25rem;
  line-height: 1.5;
}

[contenteditable='true'] :deep(strong) {
  font-weight: 600;
  color: #1e293b;
}

[contenteditable='true'] :deep(em) {
  font-style: italic;
  color: #64748b;
}
</style>
