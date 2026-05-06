<template>
  <MainLayout :hide-mobile-tab-bar="true">
    <div class="min-h-screen bg-slate-50/50">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 pt-6 [padding-bottom:calc(env(safe-area-inset-bottom)+10rem)] lg:[padding-bottom:calc(env(safe-area-inset-bottom)+2rem)]">
        <!-- Back link -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4 px-2 py-1.5 -mx-2 rounded-lg hover:bg-slate-100/60 transition-colors"
          @click="goBack"
        >
          <ArrowLeft class="w-4 h-4" />
          {{ t('events.tickets.checkout.back') }}
        </button>

        <!-- Page header (canonical) -->
        <div class="mb-5 sm:mb-6">
          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
            {{ t('events.tickets.checkout.title') }}
          </h1>
          <p v-if="event" class="text-xs sm:text-sm text-slate-600 mt-1">
            {{ event.title }}
          </p>
        </div>

        <!-- Loading -->
        <div v-if="loadingMeta" class="flex items-center justify-center py-12">
          <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>

        <!-- Empty cart guard -->
        <div
          v-else-if="store.totalQuantity === 0 || store.eventId !== eventId"
          class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-8 sm:p-12 text-center"
        >
          <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingCart class="w-8 h-8 text-slate-400" />
          </div>
          <p class="text-sm text-slate-600 mb-4 max-w-sm mx-auto">
            {{ t('events.tickets.checkout.emptyCart') }}
          </p>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-200"
            @click="goBack"
          >
            {{ t('events.tickets.checkout.backToEvent') }}
          </button>
        </div>

        <div v-else class="space-y-4">
          <!-- Cart -->
          <section>
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {{ t('events.tickets.checkout.cartHeader') }}
            </h2>
            <ul class="bg-white/80 border border-slate-200/60 rounded-2xl divide-y divide-slate-100 overflow-hidden">
              <li
                v-for="item in store.items"
                :key="item.ticketTypeId"
                class="px-4 py-3 flex items-center justify-between gap-3"
              >
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-900 truncate">{{ item.name }}</p>
                  <p class="text-xs text-slate-500 tabular-nums mt-0.5">
                    {{ item.quantity }} × {{ formatCurrency(item.unitPrice, item.currency as CurrencyCode) }}
                  </p>
                </div>
                <p class="text-sm font-semibold text-slate-900 tabular-nums flex-shrink-0">
                  {{ formatCurrency(lineTotal(item), item.currency as CurrencyCode) }}
                </p>
              </li>
            </ul>
          </section>

          <!-- Buyer info -->
          <section>
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {{ t('events.tickets.checkout.buyerHeader') }}
            </h2>
            <div class="bg-white/80 border border-slate-200/60 rounded-2xl p-4 sm:p-5">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('events.tickets.checkout.buyerName') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="buyer.name"
                    type="text"
                    maxlength="120"
                    class="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                    :class="fieldErrors.buyerName ? 'border-red-300' : 'border-slate-300'"
                  />
                  <p v-if="fieldErrors.buyerName" class="mt-1 text-xs text-red-600">
                    {{ fieldErrors.buyerName }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('events.tickets.checkout.buyerEmail') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="buyer.email"
                    type="email"
                    maxlength="255"
                    class="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                    :class="fieldErrors.buyerEmail ? 'border-red-300' : 'border-slate-300'"
                  />
                  <p v-if="fieldErrors.buyerEmail" class="mt-1 text-xs text-red-600">
                    {{ fieldErrors.buyerEmail }}
                  </p>
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('events.tickets.checkout.buyerPhone') }}
                  </label>
                  <input
                    v-model="buyer.phone"
                    type="tel"
                    maxlength="40"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- Checkout questions -->
          <section v-if="questions.length > 0">
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {{ t('events.tickets.checkout.questionsHeader') }}
            </h2>
            <div class="bg-white/80 border border-slate-200/60 rounded-2xl p-4 sm:p-5 space-y-4">
              <div v-for="q in questions" :key="q.id">
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  {{ q.question_text }}
                  <span v-if="q.is_required" class="text-red-500">*</span>
                </label>
                <!-- Text -->
                <input
                  v-if="q.question_type === 'text'"
                  :value="answerText(q.id)"
                  @input="setAnswerText(q.id, ($event.target as HTMLInputElement).value)"
                  type="text"
                  maxlength="500"
                  class="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                  :class="fieldErrors.answers[q.id] ? 'border-red-300' : 'border-slate-300'"
                />
                <!-- Long text -->
                <textarea
                  v-else-if="q.question_type === 'long_text'"
                  :value="answerText(q.id)"
                  @input="setAnswerText(q.id, ($event.target as HTMLTextAreaElement).value)"
                  rows="3"
                  maxlength="2000"
                  class="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-y"
                  :class="fieldErrors.answers[q.id] ? 'border-red-300' : 'border-slate-300'"
                />
                <!-- Yes / no -->
                <div v-else-if="q.question_type === 'yes_no'" class="flex gap-2">
                  <button
                    type="button"
                    class="px-4 py-2 min-h-[44px] text-sm rounded-lg border transition-colors"
                    :class="
                      answerText(q.id) === 'yes'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    "
                    @click="setAnswerText(q.id, 'yes')"
                  >
                    {{ t('events.tickets.checkout.yes') }}
                  </button>
                  <button
                    type="button"
                    class="px-4 py-2 min-h-[44px] text-sm rounded-lg border transition-colors"
                    :class="
                      answerText(q.id) === 'no'
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    "
                    @click="setAnswerText(q.id, 'no')"
                  >
                    {{ t('events.tickets.checkout.no') }}
                  </button>
                </div>
                <!-- Single choice -->
                <div v-else-if="q.question_type === 'single_choice'" class="space-y-2">
                  <label
                    v-for="choice in q.choices"
                    :key="choice"
                    class="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 py-1.5"
                  >
                    <input
                      type="radio"
                      :name="`q-${q.id}`"
                      :value="choice"
                      :checked="answerText(q.id) === choice"
                      @change="setAnswerText(q.id, choice)"
                      class="w-4 h-4 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span>{{ choice }}</span>
                  </label>
                </div>
                <!-- Multi choice -->
                <div v-else-if="q.question_type === 'multi_choice'" class="space-y-2">
                  <label
                    v-for="choice in q.choices"
                    :key="choice"
                    class="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 py-1.5"
                  >
                    <input
                      type="checkbox"
                      :value="choice"
                      :checked="answerChoices(q.id).includes(choice)"
                      @change="toggleAnswerChoice(q.id, choice, ($event.target as HTMLInputElement).checked)"
                      class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span>{{ choice }}</span>
                  </label>
                </div>
                <p v-if="fieldErrors.answers[q.id]" class="mt-1 text-xs text-red-600">
                  {{ fieldErrors.answers[q.id] }}
                </p>
              </div>
            </div>
          </section>

          <!-- Promo code -->
          <section>
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {{ t('events.tickets.checkout.promoCode') }}
            </h2>
            <div class="bg-white/80 border border-slate-200/60 rounded-2xl p-4 sm:p-5">
              <div class="flex gap-2">
                <input
                  v-model="promoInput"
                  type="text"
                  maxlength="40"
                  :placeholder="t('events.tickets.checkout.promoPlaceholder')"
                  class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 uppercase tracking-wide"
                />
                <button
                  type="button"
                  class="px-4 py-2.5 min-h-[44px] text-sm font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="!promoInput.trim() || isValidatingPromo"
                  @click="validatePromo"
                >
                  {{ isValidatingPromo ? t('events.tickets.checkout.validating') : t('events.tickets.checkout.apply') }}
                </button>
              </div>
              <p v-if="promoError" class="mt-2 text-xs text-red-600">
                {{ promoError }}
              </p>
              <p v-if="promoApplied" class="mt-2 text-xs text-emerald-700">
                {{ t('events.tickets.checkout.promoApplied', { code: promoApplied.code, discount: formatCurrency(promoApplied.discount, cartCurrency!) }) }}
              </p>
            </div>
          </section>

          <!-- Totals -->
          <section>
            <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {{ t('events.tickets.checkout.totalLabel') }}
            </h2>
            <div class="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-4 sm:p-5 space-y-1.5 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-slate-600">{{ t('events.tickets.checkout.subtotalLabel') }}</span>
                <span class="text-slate-900 tabular-nums">
                  {{ formatCurrency(store.subtotal, cartCurrency!) }}
                </span>
              </div>
              <div v-if="promoApplied" class="flex items-center justify-between">
                <span class="text-slate-600">{{ t('events.tickets.checkout.discountLabel') }}</span>
                <span class="text-emerald-700 tabular-nums">
                  − {{ formatCurrency(promoApplied.discount, cartCurrency!) }}
                </span>
              </div>
              <div class="flex items-center justify-between text-base font-semibold pt-2 border-t border-slate-200">
                <span class="text-slate-900">{{ t('events.tickets.checkout.totalLabel') }}</span>
                <span class="text-slate-900 tabular-nums">
                  {{ formatCurrency(grandTotal, cartCurrency!) }}
                </span>
              </div>
            </div>
          </section>

          <!-- Generic error -->
          <div v-if="submitError" class="rounded-xl bg-red-50 border border-red-200 p-3">
            <p class="text-sm text-red-800">{{ submitError }}</p>
          </div>

          <!-- Submit -->
          <button
            type="button"
            class="w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:opacity-90 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            :disabled="isSubmitting"
            @click="submitOrder"
          >
            <span
              v-if="isSubmitting"
              class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
            />
            <span>
              {{ isSubmitting ? t('events.tickets.checkout.placingOrder') : t('events.tickets.checkout.placeOrder') }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ShoppingCart } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useAuthStore } from '@/stores/auth'
import { useTicketCheckoutStore, type TicketCartItem } from '@/stores/ticketCheckout'
import {
  checkoutQuestionsService,
  eventsService,
  promoCodesService,
  ticketOrdersService,
  type Event,
  type PromoValidationSuccess,
  type TicketAnswerSubmission,
  type TicketCheckoutQuestion,
  type CreateTicketOrderRequest,
} from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'

const { t } = useAppLanguage()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const store = useTicketCheckoutStore()

const eventId = String(route.params.id)
const event = ref<Event | null>(null)
const questions = ref<TicketCheckoutQuestion[]>([])
const loadingMeta = ref(true)

// ---- Form state ----------------------------------------------------------
const buyer = reactive({
  name: '',
  email: '',
  phone: '',
})

interface AnswerState { text: string; choices: string[] }
const answers = reactive<Record<number, AnswerState>>({})

// Helper accessors so the template can write/read answer fields without
// inline `as { text: string }` casts (vue-tsc rejected those in v-model).
const ensureAnswer = (id: number): AnswerState => {
  if (!answers[id]) {
    answers[id] = { text: '', choices: [] }
  }
  return answers[id]
}

const answerText = (id: number): string => answers[id]?.text ?? ''

const setAnswerText = (id: number, value: string) => {
  ensureAnswer(id).text = value
}

const answerChoices = (id: number): string[] => answers[id]?.choices ?? []

const toggleAnswerChoice = (id: number, choice: string, checked: boolean) => {
  const a = ensureAnswer(id)
  const idx = a.choices.indexOf(choice)
  if (checked && idx === -1) a.choices.push(choice)
  else if (!checked && idx !== -1) a.choices.splice(idx, 1)
}

const promoInput = ref('')
const isValidatingPromo = ref(false)
const promoError = ref('')
const promoApplied = ref<PromoValidationSuccess | null>(null)

const isSubmitting = ref(false)
const submitError = ref('')

const fieldErrors = reactive<{
  buyerName?: string
  buyerEmail?: string
  answers: Record<number, string>
}>({ answers: {} })

const cartCurrency = computed<CurrencyCode | null>(() => store.cartCurrency as CurrencyCode | null)

// ---- Derived totals -----------------------------------------------------
const lineTotal = (item: TicketCartItem): string => {
  const price = Number(item.unitPrice)
  if (!Number.isFinite(price)) return '0'
  const total = price * item.quantity
  return total.toFixed(item.currency === 'KHR' ? 0 : 2)
}

const grandTotal = computed<string>(() => {
  const subtotal = Number(store.subtotal)
  if (!Number.isFinite(subtotal)) return '0'
  const discount = promoApplied.value ? Number(promoApplied.value.discount) : 0
  const total = Math.max(0, subtotal - (Number.isFinite(discount) ? discount : 0))
  const currency = store.cartCurrency ?? 'USD'
  return total.toFixed(currency === 'KHR' ? 0 : 2)
})

// ---- Load ----------------------------------------------------------------
const ensureCheckoutQuestionDefaults = (qs: TicketCheckoutQuestion[]) => {
  for (const q of qs) {
    ensureAnswer(q.id)
  }
}

const loadMeta = async () => {
  loadingMeta.value = true
  try {
    // Run event + questions in parallel — neither blocks the other.
    const [eventRes, questionsRes] = await Promise.all([
      eventsService.getEvent(eventId),
      checkoutQuestionsService.listPublic(eventId),
    ])
    if (eventRes.success && eventRes.data) {
      event.value = eventRes.data
    }
    if (questionsRes.success && questionsRes.data) {
      // Filter to questions that apply to this cart's tiers (event-scoped or
      // tier-scoped matching one of the cart's tier IDs).
      const cartTierIds = new Set(store.items.map((i) => i.ticketTypeId))
      questions.value = questionsRes.data.filter(
        (q) => q.is_active && (q.ticket_type_id == null || cartTierIds.has(q.ticket_type_id)),
      )
      ensureCheckoutQuestionDefaults(questions.value)
    }
  } finally {
    loadingMeta.value = false
  }
}

onMounted(() => {
  // Prefill buyer info from the authenticated profile.
  const u = authStore.user
  if (u) {
    const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
    buyer.name = fullName || u.username || ''
    buyer.email = u.email || ''
  }
  loadMeta()
})

// ---- Promo code ----------------------------------------------------------
const validatePromo = async () => {
  const code = promoInput.value.trim()
  if (!code) return
  isValidatingPromo.value = true
  promoError.value = ''
  try {
    const response = await promoCodesService.validate(eventId, {
      code,
      items: store.items.map((it) => ({
        ticket_type_id: it.ticketTypeId,
        quantity: it.quantity,
      })),
    })
    if (response.success && response.data) {
      promoApplied.value = response.data
      store.setPromoCode(code)
    } else {
      promoApplied.value = null
      // Surface the field-specific error if present.
      const fieldErr = response.errors?.code?.[0]
      promoError.value = fieldErr || response.message || t('events.tickets.checkout.promoInvalid')
    }
  } catch {
    promoError.value = t('events.tickets.checkout.promoInvalid')
  } finally {
    isValidatingPromo.value = false
  }
}

// ---- Submit --------------------------------------------------------------
const validate = (): boolean => {
  let ok = true
  fieldErrors.buyerName = undefined
  fieldErrors.buyerEmail = undefined
  fieldErrors.answers = {}

  if (!buyer.name.trim()) {
    fieldErrors.buyerName = t('events.tickets.checkout.errors.nameRequired')
    ok = false
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim())
  if (!emailOk) {
    fieldErrors.buyerEmail = t('events.tickets.checkout.errors.emailRequired')
    ok = false
  }
  for (const q of questions.value) {
    if (!q.is_required) continue
    const a = answers[q.id]
    if (q.question_type === 'multi_choice') {
      if (!a || a.choices.length === 0) {
        fieldErrors.answers[q.id] = t('events.tickets.checkout.errors.answerRequired')
        ok = false
      }
    } else if (!a || !a.text.trim()) {
      fieldErrors.answers[q.id] = t('events.tickets.checkout.errors.answerRequired')
      ok = false
    }
  }
  return ok
}

const buildAnswerSubmissions = (): TicketAnswerSubmission[] => {
  const out: TicketAnswerSubmission[] = []
  for (const q of questions.value) {
    const a = answers[q.id]
    if (!a) continue
    if (q.question_type === 'multi_choice') {
      if (a.choices.length > 0) {
        out.push({ question_id: q.id, answer_choices: a.choices })
      }
    } else if (a.text.trim()) {
      out.push({ question_id: q.id, answer_text: a.text.trim() })
    }
  }
  return out
}

const submitOrder = async () => {
  submitError.value = ''
  if (!validate()) return
  if (store.items.length === 0) return

  isSubmitting.value = true
  try {
    const payload: CreateTicketOrderRequest = {
      items: store.items.map((it) => ({
        ticket_type_id: it.ticketTypeId,
        quantity: it.quantity,
      })),
      buyer_name: buyer.name.trim(),
      buyer_email: buyer.email.trim(),
      buyer_phone: buyer.phone.trim() || undefined,
      promo_code: promoApplied.value ? store.promoCode : undefined,
      answers: buildAnswerSubmissions(),
    }
    const response = await ticketOrdersService.create(eventId, payload)
    if (response.success && response.data) {
      const code = response.data.confirmation_code
      // Clear the cart now that the server owns the truth.
      store.clear()
      router.push({ name: 'my-ticket-order', params: { code } })
    } else {
      submitError.value =
        response.message || t('events.tickets.checkout.errors.submitFailed')
    }
  } catch {
    submitError.value = t('events.tickets.checkout.errors.submitFailed')
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push({ name: 'event-detail', params: { id: eventId } })
}
</script>
