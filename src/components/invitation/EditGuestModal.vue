<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
        @click="handleClose"
      />
    </Transition>

    <!--
      Guest detail.

      Rebuilt on the grouped inset list the design skill prescribes, so the
      sheet that opens over the new guest list speaks the list's own language:
      hairline-divided rows inside one bordered group, the label on the left
      and the value on the right, and the group's border drawn once instead of
      a rounded box around every field.

      What went: a header tinted with the guest's group colour and lit by a
      blurred blob behind it, an `EDIT GUEST` eyebrow above a name that was
      already the largest thing on screen, and five uppercase section headings
      over a form of nine fields. The name is the title; the sections that
      survive each head a group you scroll between.
    -->
    <Transition name="slide-up">
      <div
        v-if="show"
        class="fixed inset-x-0 bottom-0 z-[71] w-full md:inset-0 md:flex md:w-auto md:items-center md:justify-center"
        @click.self="handleClose"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-guest-modal-title"
          class="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 md:max-h-[calc(100vh-100px)] md:max-w-md md:rounded-3xl"
          @click.stop
        >
          <!-- Header -->
          <div class="z-10 flex flex-shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-5 py-4">
            <div
              class="flex h-10 w-10 flex-shrink-0 select-none items-center justify-center rounded-full text-xs font-bold"
              :style="{ backgroundColor: `${accentColor}1a`, color: accentColor }"
              aria-hidden="true"
            >
              {{ guestInitials || '?' }}
            </div>
            <div class="min-w-0 flex-1">
              <h2 id="edit-guest-modal-title" class="truncate text-base font-semibold leading-tight text-slate-900">
                {{ guest?.name }}
              </h2>
              <p v-if="guest?.group_details" class="mt-0.5 truncate text-xs text-slate-500">
                {{ guest.group_details.name }}
              </p>
            </div>
            <button
              @click="handleClose"
              class="-mr-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              :aria-label="t('management.guestGroupsView.editGuestModal.close')"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <!-- Form Content -->
          <div class="flex-1 overflow-y-auto overscroll-contain">
            <form @submit.prevent="handleSubmit" class="space-y-5 p-4">
              <!-- Who this is. No section heading: it is the subject of the
                   sheet, and the title bar above already named it. -->
              <div>
                <div class="list-group">
                  <div class="list-row">
                    <label class="list-row__label flex-shrink-0" for="editGuestGroup">
                      {{ t('management.guestGroupsView.editGuestModal.group.selectLabel') }}
                    </label>
                    <div class="list-select">
                      <select id="editGuestGroup" v-model="formData.group" required class="list-select__control">
                        <option :value="null" disabled>{{ t('management.guestGroupsView.editGuestModal.group.choosePlaceholder') }}</option>
                        <option v-for="group in groups" :key="group.id" :value="group.id">
                          {{ group.name }} ({{ group.guest_count }} {{ t('management.guestGroupsView.editGuestModal.group.guestsSuffix') }})
                        </option>
                      </select>
                      <ChevronDown class="list-select__chevron" aria-hidden="true" />
                    </div>
                  </div>

                  <div class="list-row">
                    <label class="list-row__label flex-shrink-0" for="editGuestName">
                      {{ t('management.guestGroupsView.editGuestModal.guestName.label') }}
                    </label>
                    <input
                      id="editGuestName"
                      ref="nameInputRef"
                      v-model="formData.name"
                      type="text"
                      required
                      :placeholder="t('management.guestGroupsView.editGuestModal.guestName.placeholder')"
                      class="list-input"
                      :aria-invalid="fieldErrors.name ? 'true' : undefined"
                      :aria-describedby="fieldErrors.name ? 'edit-guest-name-error' : undefined"
                    />
                  </div>
                </div>
                <p v-if="fieldErrors.name" id="edit-guest-name-error" class="mt-1.5 px-3 text-xs text-red-600">{{ fieldErrors.name }}</p>
              </div>

              <!-- Contact. The disclosure row is the section's heading, so it
                   gets no separate eyebrow over it. -->
              <div>
                <div class="list-group">
                  <button
                    type="button"
                    @click="isContactInfoExpanded = !isContactInfoExpanded"
                    :aria-expanded="isContactInfoExpanded"
                    class="list-row"
                  >
                    <span class="list-row__text">
                      <span class="list-row__label">{{ t('management.guestGroupsView.editGuestModal.contactInfo.title') }}</span>
                      <span class="list-row__hint">{{ contactSummary }}</span>
                    </span>
                    <ChevronDown
                      class="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200"
                      :class="{ 'rotate-180': isContactInfoExpanded }"
                    />
                  </button>

                  <Transition name="collapse">
                    <div v-show="isContactInfoExpanded" class="grid grid-rows-[1fr]">
                      <div class="min-h-0 overflow-hidden">
                        <div class="list-row">
                          <label class="list-row__label flex-shrink-0" for="editGuestEmail">
                            {{ t('management.guestGroupsView.editGuestModal.contactInfo.emailLabel') }}
                          </label>
                          <input
                            id="editGuestEmail"
                            v-model="formData.email"
                            type="email"
                            :placeholder="t('management.guestGroupsView.editGuestModal.contactInfo.emailPlaceholder')"
                            class="list-input"
                            :aria-invalid="fieldErrors.email ? 'true' : undefined"
                            :aria-describedby="fieldErrors.email ? 'edit-guest-email-error' : undefined"
                          />
                        </div>
                        <div class="list-row">
                          <label class="list-row__label flex-shrink-0" for="editGuestPhone">
                            {{ t('management.guestGroupsView.editGuestModal.contactInfo.phoneLabel') }}
                          </label>
                          <input
                            id="editGuestPhone"
                            v-model="formData.phone_number"
                            type="tel"
                            placeholder="+1234567890"
                            class="list-input"
                            :aria-invalid="fieldErrors.phone_number ? 'true' : undefined"
                            :aria-describedby="fieldErrors.phone_number ? 'edit-guest-phone-error' : undefined"
                          />
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>
                <p v-if="fieldErrors.email" id="edit-guest-email-error" class="mt-1.5 px-3 text-xs text-red-600">{{ fieldErrors.email }}</p>
                <p v-if="fieldErrors.phone_number" id="edit-guest-phone-error" class="mt-1.5 px-3 text-xs text-red-600">{{ fieldErrors.phone_number }}</p>
              </div>

              <!-- RSVP -->
              <section>
                <h3 class="mb-2 flex items-baseline gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {{ t('management.guestGroupsView.editGuestModal.rsvp.title') }}
                  <span
                    v-if="guest?.rsvp_responded_at"
                    class="text-[11px] font-normal normal-case tracking-normal text-slate-400"
                  >
                    {{ t('management.guestGroupsView.editGuestModal.rsvp.updatedAt', { date: formatRespondedAt(guest.rsvp_responded_at) }) }}
                  </span>
                </h3>

                <div class="list-group">
                  <div class="list-row">
                    <label class="list-row__label flex-shrink-0" for="editRsvpStatus">
                      {{ t('management.guestGroupsView.editGuestModal.rsvp.statusLabel') }}
                    </label>
                    <div class="list-select">
                      <select id="editRsvpStatus" v-model="formData.rsvp_status" class="list-select__control">
                        <option value="pending">{{ t('management.guestGroupsView.editGuestModal.rsvp.statusOptions.pending') }}</option>
                        <option value="attending">{{ t('management.guestGroupsView.editGuestModal.rsvp.statusOptions.attending') }}</option>
                        <option value="maybe">{{ t('management.guestGroupsView.editGuestModal.rsvp.statusOptions.maybe') }}</option>
                        <option value="not_attending">{{ t('management.guestGroupsView.editGuestModal.rsvp.statusOptions.notAttending') }}</option>
                      </select>
                      <ChevronDown class="list-select__chevron" aria-hidden="true" />
                    </div>
                  </div>

                  <div class="list-row">
                    <label class="list-row__label flex-shrink-0" for="editMaxPlusOnes">
                      {{ t('management.guestGroupsView.editGuestModal.rsvp.maxPlusOnesLabel') }}
                    </label>
                    <input
                      id="editMaxPlusOnes"
                      v-model.number="formData.max_plus_ones"
                      type="number"
                      min="0"
                      step="1"
                      class="list-input"
                    />
                  </div>

                  <!-- What the guest themselves said. Read-only, so it sits in
                       the same group as rows rather than in a tinted box: it
                       is more of this record, not an aside about it. -->
                  <div v-if="(guest?.plus_ones_count ?? 0) > 0" class="list-row">
                    <span class="list-row__label flex-shrink-0">
                      {{ t('management.guestGroupsView.editGuestModal.rsvp.bringingLabel') }}
                    </span>
                    <span class="list-row__value min-w-0 truncate text-right text-slate-900">
                      {{ guest?.plus_ones_count }}<template v-if="guest?.plus_ones_names"> — {{ guest.plus_ones_names }}</template>
                    </span>
                  </div>
                  <div v-if="guest?.private_note_to_host" class="list-row items-start">
                    <span class="list-row__label flex-shrink-0">
                      {{ t('management.guestGroupsView.editGuestModal.rsvp.privateNoteLabel') }}
                    </span>
                    <span class="list-row__value min-w-0 text-right italic text-slate-600">
                      “{{ guest.private_note_to_host }}”
                    </span>
                  </div>
                </div>

                <!-- Per-question answers (shown whenever the guest has at least one) -->
                <template v-if="showAnswersSection">
                  <h4 class="mb-2 mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {{ t('management.guestGroupsView.editGuestModal.rsvp.answersTitle') }}
                  </h4>

                  <div v-if="isLoadingAnswers && !guest?.rsvp_answers" class="list-group">
                    <div class="list-row gap-2">
                      <span class="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" aria-hidden="true"></span>
                      <span class="list-row__hint">{{ t('management.guestGroupsView.editGuestModal.rsvp.answersLoading') }}</span>
                    </div>
                  </div>

                  <div v-else-if="(guest?.rsvp_answers?.length ?? 0) === 0" class="list-group">
                    <p class="list-row list-row__hint">{{ t('management.guestGroupsView.editGuestModal.rsvp.answersEmpty') }}</p>
                  </div>

                  <div v-else class="list-group">
                    <div v-for="answer in sortedAnswers" :key="answer.question_id" class="space-y-1 px-3 py-2.5">
                      <p class="break-words text-xs text-slate-500">{{ answer.question_text }}</p>

                      <p
                        v-if="(answer.question_type === 'text' || answer.question_type === 'long_text') && answer.answer_text.trim()"
                        class="whitespace-pre-wrap break-words text-sm text-slate-900"
                      >
                        {{ answer.answer_text }}
                      </p>

                      <!-- Chips only where the answer is a choice from a set —
                           a free-text reply is prose and reads as prose. -->
                      <div v-else-if="answer.question_type === 'yes_no' && answer.answer_text" class="flex flex-wrap gap-1.5">
                        <span
                          class="rounded-full px-2 py-0.5 text-xs font-medium"
                          :class="answer.answer_text.toLowerCase() === 'yes' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                        >
                          {{
                            answer.answer_text.toLowerCase() === 'yes'
                              ? t('management.rsvpQuestions.types.yes_no').split(' / ')[0]
                              : t('management.rsvpQuestions.types.yes_no').split(' / ')[1]
                          }}
                        </span>
                      </div>

                      <div v-else-if="answer.question_type === 'single_choice' && answer.answer_text" class="flex flex-wrap gap-1.5">
                        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{{ answer.answer_text }}</span>
                      </div>

                      <div
                        v-else-if="answer.question_type === 'multi_choice' && (answer.answer_choices?.length ?? 0) > 0"
                        class="flex flex-wrap gap-1.5"
                      >
                        <span
                          v-for="choice in answer.answer_choices"
                          :key="choice"
                          class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                        >
                          {{ choice }}
                        </span>
                      </div>

                      <p v-else class="text-sm text-slate-400">{{ t('management.guestGroupsView.editGuestModal.rsvp.answerMissing') }}</p>
                    </div>
                  </div>
                </template>
              </section>

              <!-- Cash gift -->
              <section>
                <h3 class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {{ t('management.guestGroupsView.editGuestModal.cashGift.title') }}
                </h3>

                <div class="list-group">
                  <div class="list-row">
                    <label class="list-row__label flex-shrink-0" for="editCashGiftAmount">
                      {{ t('management.guestGroupsView.editGuestModal.cashGift.amountLabel') }}
                    </label>
                    <input
                      id="editCashGiftAmount"
                      v-model="formData.cash_gift_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      class="list-input"
                      :aria-invalid="fieldErrors.cash_gift_amount ? 'true' : undefined"
                      :aria-describedby="fieldErrors.cash_gift_amount ? 'edit-guest-cash-amount-error' : undefined"
                    />
                  </div>

                  <div class="list-row">
                    <label class="list-row__label flex-shrink-0" for="editCashGiftCurrency">
                      {{ t('management.guestGroupsView.editGuestModal.cashGift.currencyLabel') }}
                    </label>
                    <div class="list-select">
                      <select
                        id="editCashGiftCurrency"
                        v-model="formData.cash_gift_currency"
                        class="list-select__control"
                        :aria-invalid="fieldErrors.cash_gift_currency ? 'true' : undefined"
                        :aria-describedby="fieldErrors.cash_gift_currency ? 'edit-guest-cash-currency-error' : undefined"
                      >
                        <option value="">{{ t('management.guestGroupsView.editGuestModal.cashGift.currencyPlaceholder') }}</option>
                        <option v-for="code in CURRENCIES" :key="code.value" :value="code.value">{{ code.label }}</option>
                      </select>
                      <ChevronDown class="list-select__chevron" aria-hidden="true" />
                    </div>
                  </div>
                </div>
                <p v-if="fieldErrors.cash_gift_amount" id="edit-guest-cash-amount-error" class="mt-1.5 px-3 text-xs text-red-600">{{ fieldErrors.cash_gift_amount }}</p>
                <p v-if="fieldErrors.cash_gift_currency" id="edit-guest-cash-currency-error" class="mt-1.5 px-3 text-xs text-red-600">{{ fieldErrors.cash_gift_currency }}</p>
              </section>

              <!-- Error Message -->
              <div v-if="errorMessage" class="rounded-xl border border-red-200 bg-red-50 p-3">
                <p class="text-sm text-red-800">{{ errorMessage }}</p>
              </div>

              <!-- Quick actions, phone only — the row on a wide screen carries
                   these in its ⋯ menu, which a phone's row does not show. -->
              <section class="md:hidden">
                <h3 class="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {{ t('management.guestGroupsView.editGuestModal.quickActions.title') }}
                </h3>

                <div class="list-group">
                  <button type="button" @click="handleCopyLink('kh')" :disabled="isUpdating" class="list-row disabled:opacity-50">
                    <span class="list-row__label">{{ t('management.guestGroupsView.editGuestModal.quickActions.copyLinkKh') }}</span>
                    <Globe class="h-4 w-4 flex-shrink-0 text-slate-400" />
                  </button>
                  <button type="button" @click="handleCopyLink('en')" :disabled="isUpdating" class="list-row disabled:opacity-50">
                    <span class="list-row__label">{{ t('management.guestGroupsView.editGuestModal.quickActions.copyLinkEn') }}</span>
                    <Globe class="h-4 w-4 flex-shrink-0 text-slate-400" />
                  </button>
                  <button
                    v-if="guest && guest.invitation_status === 'not_sent'"
                    type="button"
                    @click="handleMarkSent"
                    :disabled="isUpdating"
                    class="list-row disabled:opacity-50"
                  >
                    <span class="list-row__label text-emerald-700">{{ t('management.guestGroupsView.editGuestModal.quickActions.markAsSent') }}</span>
                    <Send class="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  </button>
                  <button v-if="guest" type="button" @click="handleDelete" :disabled="isUpdating" class="list-row disabled:opacity-50">
                    <span class="list-row__label text-red-600">{{ t('management.guestGroupsView.editGuestModal.quickActions.deleteGuest') }}</span>
                    <Trash2 class="h-4 w-4 flex-shrink-0 text-red-500" />
                  </button>
                </div>
              </section>
            </form>
          </div>

          <!-- Footer with Action Buttons -->
          <div class="flex-shrink-0 border-t border-slate-100 bg-white pb-[env(safe-area-inset-bottom)]">
            <div class="flex items-center justify-end gap-3 px-5 py-3.5">
              <button
                type="button"
                @click="handleClose"
                class="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="isUpdating"
              >
                {{ t('management.guestGroupsView.editGuestModal.actions.cancel') }}
              </button>

              <button
                @click="handleSubmit"
                :disabled="!isFormValid || isUpdating"
                class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-[#27ae60] hover:to-[#1873cc] hover:shadow-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span
                  v-if="isUpdating"
                  class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                ></span>
                <span>{{ isUpdating ? t('management.guestGroupsView.editGuestModal.actions.updating') : t('management.guestGroupsView.editGuestModal.actions.updateGuest') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, ChevronDown, Send, Trash2, Globe } from 'lucide-vue-next'
import type { EventGuest, GuestGroup, GuestRsvpStatusValue } from '../../services/api'

const { t } = useI18n()

// Props
const props = withDefaults(
  defineProps<{
    show: boolean
    guest: EventGuest | null
    groups: GuestGroup[]
    isUpdating: boolean
    /** True while the parent fetches the guest detail with `rsvp_answers`. */
    isLoadingAnswers?: boolean
  }>(),
  { isLoadingAnswers: false },
)

// Emits
const emit = defineEmits<{
  close: []
  'update-guest': [guestId: number, data: any]
  'mark-sent': [guest: EventGuest]
  'delete': [guest: EventGuest]
  'copy-link': [guest: EventGuest, language: 'en' | 'kh']
}>()

// Form data
interface FormData {
  name: string
  group: number | null
  email: string
  phone_number: string
  cash_gift_amount: string
  cash_gift_currency: string
  rsvp_status: GuestRsvpStatusValue
  max_plus_ones: number
}

const formData = ref<FormData>({
  name: '',
  group: null,
  email: '',
  phone_number: '',
  cash_gift_amount: '',
  cash_gift_currency: '',
  rsvp_status: 'pending',
  max_plus_ones: 0,
})

const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})
const isContactInfoExpanded = ref(false)
const nameInputRef = ref<HTMLInputElement | null>(null)

// Guarded close — ignore backdrop clicks / Escape while an update is in flight
const handleClose = () => {
  if (props.isUpdating) return
  emit('close')
}

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

/** Tints the avatar, exactly as the guest's row in the list behind does. */
const accentColor = computed(() => props.guest?.group_details?.color || '#1e90ff')

/** First letters of up to two name words, e.g. "Sok Dara" → "SD". */
const guestInitials = computed(() =>
  (props.guest?.name ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase(),
)

// Quick action handlers for mobile
const handleCopyLink = (language: 'en' | 'kh') => {
  if (props.guest) {
    emit('copy-link', props.guest, language)
  }
}

const handleMarkSent = () => {
  if (props.guest) {
    emit('mark-sent', props.guest)
  }
}

const handleDelete = () => {
  if (props.guest) {
    emit('delete', props.guest)
  }
}

// Initialize form data when guest prop changes
watch(() => props.guest, (newGuest) => {
  if (newGuest) {
    formData.value = {
      name: newGuest.name || '',
      group: newGuest.group ?? null,
      email: newGuest.email || '',
      phone_number: newGuest.phone_number || '',
      cash_gift_amount: newGuest.cash_gift_amount || '',
      cash_gift_currency: newGuest.cash_gift_currency || '',
      rsvp_status: newGuest.rsvp_status ?? 'pending',
      max_plus_ones: newGuest.max_plus_ones ?? 0,
    }
    errorMessage.value = ''
    fieldErrors.value = {}
  }
}, { immediate: true })

/**
 * What the collapsed contact group is hiding, said on its own row.
 *
 * A disclosure that only says "Contact information (Optional)" makes you open
 * it to find out whether there is anything in there. This is what a grouped
 * list puts in the trailing half of a row that discloses.
 */
const contactSummary = computed(() => {
  const filled = [props.guest?.email, props.guest?.phone_number].filter((v) => v?.trim())
  return filled.length > 0
    ? filled.join(' · ')
    : t('management.guestGroupsView.editGuestModal.contactInfo.optional')
})

/** Currency options, one place rather than eleven `<option>`s in the template. */
const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'KHR', label: 'KHR - Cambodian Riel' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'THB', label: 'THB - Thai Baht' },
  { value: 'VND', label: 'VND - Vietnamese Dong' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
]

// Show the Answers panel whenever the list endpoint told us the guest has
// answered at least one question, OR the detail endpoint has already
// hydrated the array. Covers both the "show loader while fetching" and
// the "already loaded" cases.
const showAnswersSection = computed(() => {
  if (!props.guest) return false
  if ((props.guest.rsvp_answered_count ?? 0) > 0) return true
  return (props.guest.rsvp_answers?.length ?? 0) > 0
})

// Preserve the host's authored question order.
const sortedAnswers = computed(() => {
  const answers = props.guest?.rsvp_answers ?? []
  return [...answers].sort((a, b) => a.question_order - b.question_order)
})

const formatRespondedAt = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Reset form when modal is closed; lock background scroll while open
watch(() => props.show, (newShow) => {
  document.body.style.overflow = newShow ? 'hidden' : ''
  if (!newShow) {
    errorMessage.value = ''
    fieldErrors.value = {}
    return
  }

  // Autofocus the name field on desktop only — on mobile the drawer
  // would immediately pop the keyboard over half the sheet.
  nextTick(() => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      nameInputRef.value?.focus()
    }
  })
})

// Form validation
const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.group !== null
})

// Handle form submission
const handleSubmit = () => {
  if (!props.guest || !isFormValid.value) {
    return
  }

  // Clear previous errors
  errorMessage.value = ''
  fieldErrors.value = {}

  // Prepare update data - only include fields that have values
  const updateData: any = {
    name: formData.value.name.trim(),
    group: formData.value.group,
  }

  // Add optional fields if they have values
  if (formData.value.email && formData.value.email.trim()) {
    updateData.email = formData.value.email.trim()
  }

  if (formData.value.phone_number && formData.value.phone_number.trim()) {
    updateData.phone_number = formData.value.phone_number.trim()
  }

  if (formData.value.cash_gift_amount !== null && formData.value.cash_gift_amount !== undefined && formData.value.cash_gift_amount !== '') {
    updateData.cash_gift_amount = String(formData.value.cash_gift_amount)
  }

  if (formData.value.cash_gift_currency && formData.value.cash_gift_currency.trim()) {
    updateData.cash_gift_currency = formData.value.cash_gift_currency.trim()
  }

  // Only include RSVP fields when the host actually changed them so we
  // don't accidentally clobber a guest's recent self-update.
  if (formData.value.rsvp_status !== (props.guest.rsvp_status ?? 'pending')) {
    updateData.rsvp_status = formData.value.rsvp_status
  }

  const originalMaxPlusOnes = props.guest.max_plus_ones ?? 0
  const nextMaxPlusOnes = Number.isFinite(formData.value.max_plus_ones)
    ? Math.max(0, Math.floor(formData.value.max_plus_ones))
    : originalMaxPlusOnes
  if (nextMaxPlusOnes !== originalMaxPlusOnes) {
    updateData.max_plus_ones = nextMaxPlusOnes
  }

  emit('update-guest', props.guest.id, updateData)
}

// Expose method to set field errors from parent
const setFieldErrors = (errors: Record<string, string[]>) => {
  fieldErrors.value = {}
  Object.entries(errors).forEach(([field, messages]) => {
    if (messages && messages.length > 0) {
      fieldErrors.value[field] = messages[0]
    }
  })
}

const setErrorMessage = (message: string) => {
  errorMessage.value = message
}

// Expose methods for parent component
defineExpose({
  setFieldErrors,
  setErrorMessage,
})
</script>

<!-- The shared row anatomy. Imported as a separate scoped block, which is what
     keeps every selector reachable — Vue compiles one scoped copy per
     component (see the sheet's own header comment in groupedList.css). -->
<style scoped src="../common/groupedList.css"></style>

<style scoped>
/*
  A `<select>` in the trailing half of a row.

  `groupedList.css` covers text inputs (`.list-input`) but not selects: a
  select needs its native chevron suppressed and one of our own drawn, and it
  cannot be given `text-align: right` reliably across engines — so the control
  is sized to its content and the wrapper is what pushes it to the trailing
  edge. Same type, colour and focus behaviour as `.list-input` otherwise.
*/
.list-select {
  position: relative;
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  justify-content: flex-end;
}

.list-select__control {
  min-width: 0;
  max-width: 100%;
  padding: 0 1.25rem 0 0;
  border: 0;
  background: transparent;
  font-size: 1rem;
  color: rgb(15 23 42); /* slate-900 */
  text-align: right;
  text-overflow: ellipsis;
  appearance: none;
  cursor: pointer;
}

.list-select__control:focus {
  outline: none;
}

.list-select__chevron {
  pointer-events: none;
  position: absolute;
  right: 0;
  height: 1rem;
  width: 1rem;
  color: rgb(148 163 184); /* slate-400 */
}

/* The row carries the ring, matching `.list-row:has(.list-input:focus)`. */
.list-row:has(.list-select__control:focus-visible) {
  box-shadow: inset 0 0 0 2px rgb(186 230 253); /* sky-200 */
}

@media (min-width: 640px) {
  .list-select__control {
    font-size: 0.875rem;
  }
}
</style>

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

/* Slide from bottom on mobile, scale on desktop */
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
  .slide-up-leave-active,
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none;
  }
}

/* Collapse transition — grid-template-rows 0fr↔1fr tracks real content
   height so both directions ease evenly (DESIGN.md §7) */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none;
  }
}

/* Dropdown transition for mobile link menu */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Custom scrollbar */
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
