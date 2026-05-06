<template>
  <MainLayout :hide-mobile-tab-bar="true">
    <div class="min-h-screen bg-slate-50/50">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 pt-6 [padding-bottom:calc(env(safe-area-inset-bottom)+10rem)] lg:[padding-bottom:calc(env(safe-area-inset-bottom)+2rem)]">
        <!-- Back link -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4"
          @click="goBack"
        >
          <ArrowLeft class="w-4 h-4" />
          {{ t('events.tickets.checkout.back') }}
        </button>

        <h1 class="text-2xl font-bold text-slate-900 mb-1">
          {{ t('events.tickets.checkout.title') }}
        </h1>
        <p v-if="event" class="text-sm text-slate-600 mb-6">
          {{ event.title }}
        </p>

        <!-- Loading -->
        <div v-if="loadingMeta" class="flex items-center justify-center py-12">
          <div class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>

        <!-- Empty cart guard -->
        <div
          v-else-if="store.totalQuantity === 0 || store.eventId !== eventId"
          class="bg-white border border-slate-200 rounded-xl p-6 text-center"
        >
          <p class="text-sm text-slate-600 mb-4">
            {{ t('events.tickets.checkout.emptyCart') }}
          </p>
          <button
            type="button"
            class="text-sm text-emerald-700 font-medium hover:text-emerald-800"
            @click="goBack"
          >
            {{ t('events.tickets.checkout.backToEvent') }}
          </button>
        </div>

        <div v-else class="space-y-5">
          <!-- Cart -->
          <section class="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100">
              <h2 class="text-sm font-semibold text-slate-900">
                {{ t('events.tickets.checkout.cartHeader') }}
              </h2>
            </div>
            <ul class="divide-y divide-slate-100">
              <li
                v-for="item in store.items"
                :key="item.ticketTypeId"
                class="px-4 py-3 flex items-center justify-between gap-3"
              >
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-900 truncate">{{ item.name }}</p>
                  <p class="text-xs text-slate-500 tabular-nums">
                    {{ item.quantity }} × {{ formatCurrency(item.unitPrice, item.currency as CurrencyCode) }}
                  </p>
                </div>
                <p class="text-sm font-semibold text-slate-900 tabular-nums">
                  {{ formatCurrency(lineTotal(item), item.currency as CurrencyCode) }}
                </p>
              </li>
            </ul>
          </section>

          <!-- Buyer info -->
          <section class="bg-white border border-slate-200 rounded-xl p-4">
            <h2 class="text-sm font-semibold text-slate-900 mb-3">
              {{ t('events.tickets.checkout.buyerHeader') }}
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">
                  {{ t('events.tickets.checkout.buyerName') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="buyer.name"
                  type="text"
                  maxlength="120"
                  class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                  :class="fieldErrors.buyerName ? 'border-red-300' : 'border-slate-300'"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">
                  {{ t('events.tickets.checkout.buyerEmail') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="buyer.email"
                  type="email"
                  maxlength="255"
                  class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                  :class="fieldErrors.buyerEmail ? 'border-red-300' : 'border-slate-300'"
                />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-medium text-slate-700 mb-1">
                  {{ t('events.tickets.checkout.buyerPhone') }}
                </label>
                <input
                  v-model="buyer.phone"
                  type="tel"
                  maxlength="40"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                />
              </div>
            </div>
          </section>

          <!-- Checkout questions -->
          <section
            v-if="questions.length > 0"
            class="bg-white border border-slate-200 rounded-xl p-4 space-y-4"
          >
            <h2 class="text-sm font-semibold text-slate-900">
              {{ t('events.tickets.checkout.questionsHeader') }}
            </h2>
            <div v-for="q in questions" :key="q.id">
              <label class="block text-xs font-medium text-slate-700 mb-1">
                {{ q.question_text }}
                <span v-if="q.is_required" class="text-red-500">*</span>
              </label>
              <!-- Text -->
              <input
                v-if="q.question_type === 'text'"
                v-model="(answers[q.id] as { text: string }).text"
                type="text"
                maxlength="500"
                class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                :class="fieldErrors.answers[q.id] ? 'border-red-300' : 'border-slate-300'"
              />
              <!-- Long text -->
              <textarea
                v-else-if="q.question_type === 'long_text'"
                v-model="(answers[q.id] as { text: string }).text"
                rows="3"
                maxlength="2000"
                class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 resize-y"
                :class="fieldErrors.answers[q.id] ? 'border-red-300' : 'border-slate-300'"
              />
              <!-- Yes / no -->
              <div v-else-if="q.question_type === 'yes_no'" class="flex gap-2">
                <button
                  type="button"
                  class="px-4 py-1.5 text-sm rounded-lg border transition-colors"
                  :class="
                    (answers[q.id] as { text: string }).text === 'yes'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  "
                  @click="(answers[q.id] as { text: string }).text = 'yes'"
                >
                  {{ t('events.tickets.checkout.yes') }}
                </button>
                <button
                  type="button"
                  class="px-4 py-1.5 text-sm rounded-lg border transition-colors"
                  :class="
                    (answers[q.id] as { text: string }).text === 'no'
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  "
                  @click="(answers[q.id] as { text: string }).text = 'no'"
                >
                  {{ t('events.tickets.checkout.no') }}
                </button>
              </div>
              <!-- Single choice -->
              <div v-else-if="q.question_type === 'single_choice'" class="space-y-1.5">
                <label
                  v-for="choice in q.choices"
                  :key="choice"
                  class="flex items-center gap-2 cursor-pointer text-sm text-slate-700"
                >
                  <input
                    type="radio"
                    :name="`q-${q.id}`"
                    :value="choice"
                    v-model="(answers[q.id] as { text: string }).text"
                    class="w-4 h-4 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span>{{ choice }}</span>
                </label>
              </div>
              <!-- Multi choice -->
              <div v-else-if="q.question_type === 'multi_choice'" class="space-y-1.5">
                <label
                  v-for="choice in q.choices"
                  :key="choice"
                  class="flex items-center gap-2 cursor-pointer text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    :value="choice"
                    v-model="(answers[q.id] as { choices: string[] }).choices"
                    class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span>{{ choice }}</span>
                </label>
              </div>
              <p v-if="fieldErrors.answers[q.id]" class="mt-1 text-xs text-red-600">
                {{ fieldErrors.answers[q.id] }}
              </p>
            </div>
          </section>

          <!-- Promo code -->
          <section class="bg-white border border-slate-200 rounded-xl p-4">
            <label class="block text-xs font-medium text-slate-700 mb-1">
              {{ t('events.tickets.checkout.promoCode') }}
            </label>
            <div class="flex gap-2">
              <input
                v-model="promoInput"
                type="text"
                maxlength="40"
                :placeholder="t('events.tickets.checkout.promoPlaceholder')"
                class="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 uppercase tracking-wide"
              />
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
                :disabled="!promoInput.trim() || isValidatingPromo"
                @click="validatePromo"
              >
                {{ isValidatingPromo ? t('events.tickets.checkout.validating') : t('events.tickets.checkout.apply') }}
              </button>
            </div>
            <p v-if="promoError" class="mt-1 text-xs text-red-600">
              {{ promoError }}
            </p>
            <p v-if="promoApplied" class="mt-1 text-xs text-emerald-700">
              {{ t('events.tickets.checkout.promoApplied', { code: promoApplied.code, discount: formatCurrency(promoApplied.discount, cartCurrency!) }) }}
            </p>
          </section>

          <!-- Totals -->
          <section class="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-600">{{ t('events.tickets.checkout.subtotalLabel') }}</span>
              <span class="text-slate-900 tabular-nums">
                {{ formatCurrency(store.subtotal, cartCurrency!) }}
              </span>
            </div>
            <div v-if="promoApplied" class="flex items-center justify-between text-sm">
              <span class="text-slate-600">{{ t('events.tickets.checkout.discountLabel') }}</span>
              <span class="text-emerald-700 tabular-nums">
                − {{ formatCurrency(promoApplied.discount, cartCurrency!) }}
              </span>
            </div>
            <div class="flex items-center justify-between text-base font-semibold pt-2 border-t border-slate-100">
              <span class="text-slate-900">{{ t('events.tickets.checkout.totalLabel') }}</span>
              <span class="text-slate-900 tabular-nums">
                {{ formatCurrency(grandTotal, cartCurrency!) }}
              </span>
            </div>
          </section>

          <!-- Generic error -->
          <div v-if="submitError" class="rounded-lg bg-red-50 border border-red-200 p-3">
            <p class="text-sm text-red-800">{{ submitError }}</p>
          </div>

          <!-- Submit -->
          <button
            type="button"
            class="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
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
import { ArrowLeft } from 'lucide-vue-next'
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
    if (!answers[q.id]) {
      answers[q.id] = { text: '', choices: [] }
    }
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
