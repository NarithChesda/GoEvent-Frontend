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

    <PartnerRequestFields v-model="draft" :field-errors="fieldErrors" :local-errors="localErrors" />

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
 * Applying for a partner account, from inside the product.
 *
 * Poured into the same `CheckoutDrawer` shell as the credit-pack order it sits
 * one step before, because it is the first thing a shop does on this page and
 * the second is buying a pack — two consecutive steps that should not look like
 * two different products.
 *
 * The fields and their validation are shared with the public page at
 * `/partners/apply` (`PartnerRequestFields` + `usePartnerRequestForm`); what is
 * left here is the shell, the prefill and the footer. This drawer is the
 * signed-in half of one funnel — a visitor who has never had an account meets
 * the same form on that page, and files it before being asked to register.
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
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader } from 'lucide-vue-next'
import CheckoutDrawer from '@/components/payment/CheckoutDrawer.vue'
import PartnerRequestFields from './PartnerRequestFields.vue'
import { usePartnerRequestForm } from '@/composables/settings/usePartnerRequestForm'
import { useAuthStore } from '@/stores/auth'
import type { CreatePartnerRequestData } from '@/services/api'

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
const { draft, localErrors, formError, reset, validate, payload } = usePartnerRequestForm()

const handleSubmit = (): void => {
  if (!validate()) return
  emit('submit', payload())
}

watch(
  () => props.open,
  (isOpen) => {
    // What we already know about them — asked once, at signup, not again here.
    if (isOpen) {
      reset({
        contact_phone: authStore.user?.phone_number ?? '',
        contact_telegram: authStore.user?.telegram_link ?? '',
      })
    }
  },
  { immediate: true },
)
</script>
