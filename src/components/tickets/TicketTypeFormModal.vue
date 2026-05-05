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
          class="relative w-full md:max-w-2xl bg-white md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] md:max-h-[calc(100vh-100px)] flex flex-col rounded-t-3xl md:rounded-b-3xl"
          @click.stop
        >
          <!-- Header -->
          <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
            <div class="flex items-center justify-between px-4 py-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center"
                >
                  <Ticket class="w-5 h-5" />
                </div>
                <h2 class="text-lg font-semibold text-white">
                  {{
                    isEdit
                      ? t('management.tickets.tiers.modal.editTitle')
                      : t('management.tickets.tiers.modal.addTitle')
                  }}
                </h2>
              </div>
              <button
                type="button"
                class="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                :aria-label="t('management.tickets.tiers.actions.cancel')"
                @click="handleClose"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto overscroll-contain">
            <form class="p-4 space-y-5 pb-6" @submit.prevent="handleSubmit">
              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.tickets.tiers.modal.nameLabel') }}
                  <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.name"
                  type="text"
                  maxlength="120"
                  :placeholder="t('management.tickets.tiers.modal.namePlaceholder')"
                  class="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                  :class="fieldErrors.name ? 'border-red-300' : 'border-slate-300'"
                />
                <p v-if="fieldErrors.name" class="mt-1 text-xs text-red-600">
                  {{ fieldErrors.name }}
                </p>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.tickets.tiers.modal.descriptionLabel') }}
                </label>
                <textarea
                  v-model="formData.description"
                  rows="2"
                  maxlength="500"
                  :placeholder="t('management.tickets.tiers.modal.descriptionPlaceholder')"
                  class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-y"
                />
              </div>

              <!-- Price + Currency -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.tickets.tiers.modal.priceLabel') }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.price"
                    type="text"
                    inputmode="decimal"
                    placeholder="0.00"
                    class="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 tabular-nums"
                    :class="fieldErrors.price ? 'border-red-300' : 'border-slate-300'"
                  />
                  <p v-if="fieldErrors.price" class="mt-1 text-xs text-red-600">
                    {{ fieldErrors.price }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.tickets.tiers.modal.currencyLabel') }}
                  </label>
                  <div class="relative">
                    <select
                      v-model="formData.currency"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                    >
                      <option value="USD">USD</option>
                      <option value="KHR">KHR</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown class="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quantity + Max per order -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.tickets.tiers.modal.quantityLabel') }}
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model.number="formData.quantity_total"
                    type="number"
                    min="1"
                    class="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 tabular-nums"
                    :class="fieldErrors.quantity ? 'border-red-300' : 'border-slate-300'"
                  />
                  <p class="mt-1 text-xs text-slate-500">
                    {{ t('management.tickets.tiers.modal.quantityHint') }}
                  </p>
                  <p v-if="fieldErrors.quantity" class="mt-1 text-xs text-red-600">
                    {{ fieldErrors.quantity }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.tickets.tiers.modal.maxPerOrderLabel') }}
                  </label>
                  <input
                    v-model.number="formData.max_per_order"
                    type="number"
                    min="1"
                    class="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 tabular-nums"
                    :class="fieldErrors.maxPerOrder ? 'border-red-300' : 'border-slate-300'"
                  />
                  <p v-if="fieldErrors.maxPerOrder" class="mt-1 text-xs text-red-600">
                    {{ fieldErrors.maxPerOrder }}
                  </p>
                </div>
              </div>

              <!-- Sale window -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.tickets.tiers.modal.saleStartLabel') }}
                  </label>
                  <input
                    v-model="formData.sale_start"
                    type="datetime-local"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    {{ t('management.tickets.tiers.modal.saleEndLabel') }}
                  </label>
                  <input
                    v-model="formData.sale_end"
                    type="datetime-local"
                    class="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                    :class="fieldErrors.saleWindow ? 'border-red-300' : 'border-slate-300'"
                  />
                </div>
              </div>
              <p class="text-xs text-slate-500 -mt-3">
                {{ t('management.tickets.tiers.modal.saleWindowHint') }}
              </p>
              <p v-if="fieldErrors.saleWindow" class="-mt-3 text-xs text-red-600">
                {{ fieldErrors.saleWindow }}
              </p>

              <!-- Toggles -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-300 bg-white/90 cursor-pointer select-none hover:border-sky-300 transition-colors"
                >
                  <input
                    v-model="formData.is_active"
                    type="checkbox"
                    class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-0"
                  />
                  <span class="text-sm text-slate-700">
                    {{ t('management.tickets.tiers.modal.isActiveLabel') }}
                  </span>
                </label>
                <label
                  class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-300 bg-white/90 cursor-pointer select-none hover:border-sky-300 transition-colors"
                >
                  <input
                    v-model="formData.allow_reentry"
                    type="checkbox"
                    class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-0"
                  />
                  <span class="text-sm text-slate-700">
                    {{ t('management.tickets.tiers.modal.allowReentryLabel') }}
                  </span>
                </label>
              </div>
              <p class="text-xs text-slate-500 -mt-3">
                {{ t('management.tickets.tiers.modal.allowReentryHint') }}
              </p>

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
                      ? t('management.tickets.tiers.actions.saving')
                      : t('management.tickets.tiers.actions.save')
                  }}
                </span>
              </button>
              <button
                type="button"
                class="px-5 py-2.5 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
                :disabled="isSaving"
                @click="handleClose"
              >
                {{ t('management.tickets.tiers.actions.cancel') }}
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
import { Ticket, X, ChevronDown } from 'lucide-vue-next'
import type {
  CreateTicketTypeRequest,
  TicketCurrency,
  TicketType,
  UpdateTicketTypeRequest,
} from '@/services/api'

const { t } = useI18n()

interface Props {
  show: boolean
  tier: TicketType | null
  isSaving: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [payload: CreateTicketTypeRequest | UpdateTicketTypeRequest]
}>()

interface FormData {
  name: string
  description: string
  price: string
  currency: TicketCurrency
  quantity_total: number
  max_per_order: number
  sale_start: string
  sale_end: string
  is_active: boolean
  allow_reentry: boolean
}

const emptyForm = (): FormData => ({
  name: '',
  description: '',
  price: '0.00',
  currency: 'USD',
  quantity_total: 100,
  max_per_order: 10,
  sale_start: '',
  sale_end: '',
  is_active: true,
  allow_reentry: false,
})

const formData = reactive<FormData>(emptyForm())
const fieldErrors = ref<{
  name?: string
  price?: string
  quantity?: string
  maxPerOrder?: string
  saleWindow?: string
}>({})
const errorMessage = ref('')

const isEdit = computed(() => props.tier !== null)

/**
 * Convert an ISO timestamp from the backend to the `<input type="datetime-local">`
 * value format ("YYYY-MM-DDTHH:mm"). Strips seconds and timezone — the input is
 * naïve local-time, and the backend re-serializes whatever we send with the
 * event's timezone.
 */
const isoToLocalInput = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

/** Reverse of isoToLocalInput — returns a UTC ISO string or null if blank. */
const localInputToIso = (value: string): string | null => {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

// Reset / hydrate whenever the modal opens with a different tier
watch(
  () => props.show,
  (show) => {
    if (!show) return
    fieldErrors.value = {}
    errorMessage.value = ''
    const tier = props.tier
    if (tier) {
      formData.name = tier.name
      formData.description = tier.description
      formData.price = tier.price
      formData.currency = tier.currency
      formData.quantity_total = tier.quantity_total
      formData.max_per_order = tier.max_per_order
      formData.sale_start = isoToLocalInput(tier.sale_start)
      formData.sale_end = isoToLocalInput(tier.sale_end)
      formData.is_active = tier.is_active
      formData.allow_reentry = tier.allow_reentry
    } else {
      Object.assign(formData, emptyForm())
    }
  },
  { immediate: true },
)

const handleClose = () => {
  if (props.isSaving) return
  emit('close')
}

const handleSubmit = () => {
  fieldErrors.value = {}
  errorMessage.value = ''

  const name = formData.name.trim()
  if (!name) {
    fieldErrors.value.name = t('management.tickets.tiers.modal.validation.nameRequired')
    return
  }

  const priceNum = Number(formData.price)
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    fieldErrors.value.price = t('management.tickets.tiers.modal.validation.priceInvalid')
    return
  }

  if (!Number.isInteger(formData.quantity_total) || formData.quantity_total < 1) {
    fieldErrors.value.quantity = t('management.tickets.tiers.modal.validation.quantityInvalid')
    return
  }

  if (!Number.isInteger(formData.max_per_order) || formData.max_per_order < 1) {
    fieldErrors.value.maxPerOrder = t('management.tickets.tiers.modal.validation.maxPerOrderInvalid')
    return
  }

  const startIso = localInputToIso(formData.sale_start)
  const endIso = localInputToIso(formData.sale_end)
  if (startIso && endIso && new Date(startIso).getTime() >= new Date(endIso).getTime()) {
    fieldErrors.value.saleWindow = t('management.tickets.tiers.modal.validation.saleWindowInvalid')
    return
  }

  const payload: CreateTicketTypeRequest = {
    name,
    description: formData.description.trim(),
    // Send price as a string with two decimals so the DRF DecimalField parser
    // round-trips cleanly without floating-point surprises.
    price: priceNum.toFixed(formData.currency === 'KHR' ? 0 : 2),
    currency: formData.currency,
    quantity_total: formData.quantity_total,
    max_per_order: formData.max_per_order,
    sale_start: startIso,
    sale_end: endIso,
    is_active: formData.is_active,
    allow_reentry: formData.allow_reentry,
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
