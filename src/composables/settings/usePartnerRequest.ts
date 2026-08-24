/**
 * The account's standing application to become a shop partner.
 *
 * Only ever consulted from the gated half of the credits page — a partner has
 * nothing to apply for. It answers three questions the gated state has to
 * distinguish between and, before this existed, could not: have they asked, are
 * we still deciding, and did we say no.
 *
 * `404` is the ordinary answer for an account that has never applied, so it is
 * folded into "no request" rather than surfaced as an error. That is also what
 * comes back while the backend half of this is unbuilt
 * (docs/backend-api-requirements/partner-access-request.md) — the two are
 * indistinguishable over the wire and want the same screen, so nothing here has
 * to be un-picked when the endpoints land. The one place they must *not* be
 * conflated is the submit: a `404`/`405` on the POST means the feature is not
 * deployed, and telling someone their request failed when there was nowhere to
 * send it would have them retrying forever.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { partnerRequestsService } from '@/services/api'
import type { CreatePartnerRequestData, PartnerRequest } from '@/services/api'

export function usePartnerRequest() {
  const { t } = useI18n()

  const request = ref<PartnerRequest | null>(null)
  const isLoading = ref(false)
  const hasLoadedOnce = ref(false)
  const isSubmitting = ref(false)
  /** Field-level validation from the server, passed straight to the form. */
  const fieldErrors = ref<Record<string, string[]> | null>(null)

  const load = async (): Promise<void> => {
    isLoading.value = true

    try {
      const response = await partnerRequestsService.getMyRequest()

      if (response.success && response.data) {
        request.value = response.data
      } else if (response.status === 404) {
        // Never applied — the first-visit state, and the shape of a missing
        // endpoint too. Both mean: offer the form.
        request.value = null
      }
      // Anything else (offline, 500) leaves the last known answer in place
      // rather than pretending there is no request; the CTA it would otherwise
      // reveal leads to a guaranteed 400 for someone who already applied.
    } catch (err) {
      console.error('Error loading partner request:', err)
    } finally {
      isLoading.value = false
      hasLoadedOnce.value = true
    }
  }

  const submit = async (
    data: CreatePartnerRequestData,
  ): Promise<{ success: true } | { success: false; error: string }> => {
    isSubmitting.value = true
    fieldErrors.value = null

    try {
      const response = await partnerRequestsService.createRequest(data)

      if (response.success && response.data?.request) {
        request.value = response.data.request
        return { success: true }
      }

      // Nowhere to send it yet. Point at the humans instead of at a retry.
      if (response.status === 404 || response.status === 405) {
        return { success: false, error: t('settings.credits.request.messages.unavailable') }
      }

      if (response.status === 400 && response.errors) {
        fieldErrors.value = response.errors
      }

      return {
        success: false,
        error: response.message || t('settings.credits.request.messages.failed'),
      }
    } catch (err) {
      console.error('Error submitting partner request:', err)
      return { success: false, error: t('settings.credits.request.messages.failed') }
    } finally {
      isSubmitting.value = false
    }
  }

  const clearFieldErrors = (): void => {
    fieldErrors.value = null
  }

  return {
    request,
    isLoading,
    hasLoadedOnce,
    isSubmitting,
    fieldErrors,
    load,
    submit,
    clearFieldErrors,
  }
}
