<template>
  <CheckoutDrawer
    :open="open"
    :title="t('settings.credits.request.drawer.title')"
    :eyebrow="t('settings.credits.title')"
    @close="emit('close')"
  >
    <p class="text-sm leading-relaxed text-slate-600">
      {{ t('settings.credits.request.drawer.intro') }}
    </p>

    <!--
      Five fields on one screen, so no uppercase section headings: an eyebrow
      earns its space when the reader has to navigate back to a group, and there
      is nothing to navigate here.
    -->
    <div class="space-y-4">
      <div>
        <label for="partnerBusinessName" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('settings.credits.request.fields.businessName') }} *
        </label>
        <input
          id="partnerBusinessName"
          v-model="businessName"
          type="text"
          maxlength="120"
          autocomplete="organization"
          :placeholder="t('settings.credits.request.fields.businessNamePlaceholder')"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
          :class="inputClass('business_name')"
          :aria-invalid="Boolean(errorFor('business_name'))"
        />
        <p v-if="errorFor('business_name')" class="mt-1 text-xs text-red-600">
          {{ errorFor('business_name') }}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label for="partnerPhone" class="mb-2 block text-sm font-medium text-slate-700">
            {{ t('settings.credits.request.fields.phone') }} *
          </label>
          <input
            id="partnerPhone"
            v-model="contactPhone"
            type="tel"
            maxlength="32"
            autocomplete="tel"
            class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
            :class="inputClass('contact_phone')"
            :aria-invalid="Boolean(errorFor('contact_phone'))"
          />
          <p v-if="errorFor('contact_phone')" class="mt-1 text-xs text-red-600">
            {{ errorFor('contact_phone') }}
          </p>
        </div>

        <div>
          <label for="partnerTelegram" class="mb-2 block text-sm font-medium text-slate-700">
            {{ t('settings.credits.request.fields.telegram') }}
          </label>
          <input
            id="partnerTelegram"
            v-model="contactTelegram"
            type="text"
            maxlength="120"
            :placeholder="t('settings.credits.request.fields.telegramPlaceholder')"
            class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
            :class="inputClass('contact_telegram')"
          />
          <p v-if="errorFor('contact_telegram')" class="mt-1 text-xs text-red-600">
            {{ errorFor('contact_telegram') }}
          </p>
        </div>
      </div>

      <div>
        <label for="partnerVolume" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('settings.credits.request.fields.volume') }}
        </label>
        <div class="relative">
          <select
            id="partnerVolume"
            v-model="expectedVolume"
            class="w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2"
            :class="inputClass('expected_monthly_events')"
          >
            <option value="">
              {{ t('settings.credits.request.fields.volumeOptions.unspecified') }}
            </option>
            <option v-for="option in volumeOptions" :key="option" :value="option">
              {{ t(`settings.credits.request.fields.volumeOptions.${option}`) }}
            </option>
          </select>
          <ChevronDown
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
        <p class="mt-1 text-xs text-slate-500">
          {{ t('settings.credits.request.fields.volumeHint') }}
        </p>
      </div>

      <div>
        <label for="partnerMessage" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('settings.credits.request.fields.message') }}
        </label>
        <textarea
          id="partnerMessage"
          v-model="message"
          rows="4"
          maxlength="1000"
          :placeholder="t('settings.credits.request.fields.messagePlaceholder')"
          class="w-full resize-none rounded-lg border bg-white px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2"
          :class="inputClass('message')"
        ></textarea>
        <p v-if="errorFor('message')" class="mt-1 text-xs text-red-600">
          {{ errorFor('message') }}
        </p>
      </div>
    </div>

    <template #footer>
      <p
        v-if="formError"
        class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
        role="alert"
      >
        {{ formError }}
      </p>
      <button
        type="button"
        :disabled="submitting"
        class="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50"
        @click="handleSubmit"
      >
        <Loader v-if="submitting" class="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>
          {{
            submitting
              ? t('settings.credits.request.drawer.submitting')
              : t('settings.credits.request.drawer.submit')
          }}
        </span>
      </button>
    </template>
  </CheckoutDrawer>
</template>

<script setup lang="ts">
/**
 * Applying for a partner account.
 *
 * Poured into the same `CheckoutDrawer` shell as the credit-pack order it sits
 * one step before, because it is the first thing a shop does on this page and
 * the second is buying a pack — two consecutive steps that should not look like
 * two different products.
 *
 * It makes no API call of its own: the tab owns `usePartnerRequest` so the gated
 * state and the form can never disagree about whether an application is open.
 * Server-side validation comes back through `fieldErrors` and renders under the
 * field that caused it, rather than as one opaque banner.
 *
 * There is no success screen here. The page behind the drawer becomes the
 * "under review" state the moment this succeeds, and saying it twice would leave
 * the reader looking for the difference between the two.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, Loader } from 'lucide-vue-next'
import CheckoutDrawer from '@/components/payment/CheckoutDrawer.vue'
import { useAuthStore } from '@/stores/auth'
import type { CreatePartnerRequestData, PartnerRequestVolume } from '@/services/api'

const props = defineProps<{
  open: boolean
  submitting?: boolean
  /** Field-level errors from the server, keyed by field name. */
  fieldErrors?: Record<string, string[]> | null
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: CreatePartnerRequestData]
}>()

const { t } = useI18n()
const authStore = useAuthStore()

const volumeOptions: PartnerRequestVolume[] = ['1_5', '6_20', '21_50', '50_plus']

const businessName = ref('')
const contactPhone = ref('')
const contactTelegram = ref('')
const expectedVolume = ref<PartnerRequestVolume | ''>('')
const message = ref('')
/** Client-side validation only — server errors arrive via the prop. */
const localErrors = ref<Record<string, string>>({})
const formError = ref<string | null>(null)

const errorFor = (field: string): string | null =>
  localErrors.value[field] ?? props.fieldErrors?.[field]?.[0] ?? null

const inputClass = (field: string): string =>
  errorFor(field)
    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
    : 'border-slate-300 focus:border-sky-400 focus:ring-sky-200'

/** What we already know about them — asked once, at signup, not again here. */
const prefill = computed(() => ({
  phone: authStore.user?.phone_number ?? '',
  telegram: authStore.user?.telegram_link ?? '',
}))

const handleSubmit = (): void => {
  formError.value = null
  const errors: Record<string, string> = {}

  if (!businessName.value.trim()) {
    errors.business_name = t('settings.credits.request.validation.businessNameRequired')
  }
  if (!contactPhone.value.trim()) {
    errors.contact_phone = t('settings.credits.request.validation.phoneRequired')
  }

  localErrors.value = errors
  if (Object.keys(errors).length) {
    formError.value = t('settings.credits.request.validation.fixFields')
    return
  }

  emit('submit', {
    business_name: businessName.value.trim(),
    contact_phone: contactPhone.value.trim(),
    contact_telegram: contactTelegram.value.trim() || undefined,
    expected_monthly_events: expectedVolume.value || undefined,
    message: message.value.trim() || undefined,
  })
}

const reset = (): void => {
  businessName.value = ''
  contactPhone.value = prefill.value.phone
  contactTelegram.value = prefill.value.telegram
  expectedVolume.value = ''
  message.value = ''
  localErrors.value = {}
  formError.value = null
}

// Editing a field clears only its own complaint, so correcting one problem
// doesn't wipe the list of the others still waiting.
watch([businessName, contactPhone], () => {
  if (businessName.value.trim()) delete localErrors.value.business_name
  if (contactPhone.value.trim()) delete localErrors.value.contact_phone
  if (!Object.keys(localErrors.value).length) formError.value = null
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) reset()
  },
  { immediate: true },
)
</script>
