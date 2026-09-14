<template>
  <!--
    The app shell minus the two bars, the same trade `/partners` makes: the top
    bar and the tab pill belong to a product this page's audience does not have
    an account for, and what they cost is the first screen. The contact FAB
    stays — someone who would rather talk than type is exactly the person this
    link was sent to, and it is the one piece of chrome that serves them.
  -->
  <MainLayout hide-top-nav hide-mobile-tab-bar>
    <div class="min-h-screen pb-16">
      <!--
        Back to the argument, and the language — the same two controls, in the
        same order, as `/partners`' own header row. This page hides the chrome
        the app's language control lives in, so without a copy here a Khmer
        reader arriving from a shared link has no way to read the form.
      -->
      <header class="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-6 sm:px-6 sm:pt-8">
        <RouterLink
          to="/partners"
          class="group inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3.5 py-2 text-[0.8125rem] font-medium text-slate-700 backdrop-blur transition-[color,border-color,background-color,transform] duration-200 ease-out hover:border-slate-300 hover:bg-white hover:text-slate-900 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:text-sm"
        >
          <ArrowLeft
            class="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          {{ t('partners.apply.back') }}
        </RouterLink>

        <button
          type="button"
          class="ml-auto inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-xs font-semibold tracking-wide text-slate-700 backdrop-blur transition-[color,border-color,background-color,transform] duration-200 ease-out hover:border-slate-300 hover:bg-white hover:text-slate-900 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          :aria-label="switchLanguageLabel"
          @click="toggleLanguage"
        >
          {{ locale.toUpperCase() }}
        </button>
      </header>

      <main class="mx-auto max-w-2xl px-4 pt-8 sm:px-6 sm:pt-10">
        <!-- Resolving whether this account already has an application, or
             finishing one that was interrupted by the sign-in. -->
        <div v-if="stage === 'checking'" class="py-16 text-center">
          <div
            class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-transparent"
            aria-hidden="true"
          ></div>
          <p class="text-sm text-slate-500">
            {{ isSubmitting ? t('partners.apply.submitting') : t('partners.apply.checking') }}
          </p>
        </div>

        <!-- The form. What an anonymous visitor sees first, and what a
             signed-in account with nothing on file sees too. -->
        <template v-else-if="stage === 'form'">
          <p
            class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 ring-1 ring-slate-900/5"
          >
            <Store class="h-3.5 w-3.5" aria-hidden="true" />
            {{ t('partners.apply.eyebrow') }}
          </p>

          <h1 class="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {{ t('partners.apply.title') }}
          </h1>

          <p class="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            {{ t('partners.apply.intro') }}
          </p>

          <!-- Rejected but invited to try again: why we said no, above the form
               they are about to fill in for the second time. -->
          <p
            v-if="rejectionNote"
            class="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600"
          >
            {{ rejectionNote }}
          </p>

          <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <p
              v-if="draftRestored"
              class="mb-4 rounded-lg bg-sky-50 px-3 py-2 text-xs text-[#1e90ff]"
              role="status"
            >
              {{ t('partners.apply.resumed') }}
            </p>

            <PartnerRequestFields
              v-model="draft"
              :field-errors="fieldErrors"
              :local-errors="localErrors"
            />

            <p
              v-if="formError || submitError"
              class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
              role="alert"
            >
              {{ formError || submitError }}
            </p>

            <button
              type="button"
              :disabled="isSubmitting"
              class="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-[#27ae60] hover:to-[#1873cc] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              @click="handleSubmit"
            >
              <Loader v-if="isSubmitting" class="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>
                {{ isSubmitting ? t('partners.apply.submitting') : t('partners.apply.submit') }}
              </span>
            </button>

            <!--
              Said before the button, not after a surprise redirect. The whole
              point of this page is that the account comes second; a visitor who
              is not told that reads the jump to /signin as the form having
              thrown them out.
            -->
            <p v-if="!hasSession" class="mt-3 text-center text-xs leading-relaxed text-slate-500">
              {{ t('partners.apply.signInNote') }}
            </p>
          </div>
        </template>

        <!-- Everything else is one shape: a disc, a sentence, and at most one
             way onward. Four near-identical blocks would be four places to
             change the spacing. -->
        <div v-else class="py-12 text-center sm:py-16">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            :class="outcome.disc"
          >
            <component
              :is="outcome.icon"
              class="h-8 w-8"
              :class="outcome.tone"
              aria-hidden="true"
            />
          </div>
          <h1 class="mb-2 text-lg font-semibold text-slate-900">{{ outcome.title }}</h1>
          <p class="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
            {{ outcome.subtitle }}
          </p>

          <RouterLink
            v-if="outcome.cta"
            to="/credits"
            class="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          >
            {{ outcome.cta }}
            <ArrowRight class="h-4 w-4" aria-hidden="true" />
          </RouterLink>
        </div>
      </main>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
/**
 * `/partners/apply` — the partner application as a link you can send someone.
 *
 * WHY IT IS ITS OWN PAGE. The application already existed, inside `/credits`,
 * behind `requiresAuth`. So the only thing anyone could be sent was a sign-in
 * wall: register, verify, land on a credits page that refuses you, *then* find
 * the form. Every CTA on the public `/partners` page pointed there. This page is
 * that form with the wall moved to the end — fill it in, and the account is
 * asked for at the moment it becomes necessary, which is the moment there is
 * something to file the request against.
 *
 * THE ROUND TRIP. Pressing Send with no session writes the answers to
 * `partnerRequestDraft` with `pendingSubmit`, then leaves for
 * `/signin?redirect=/partners/apply`. Coming back, this page reads that flag and
 * finishes the submit itself. `pendingSubmit` is what separates "they were
 * typing" from "they pressed the button": a draft without it is only ever
 * restored into the form, never sent, because a visitor who signed in for some
 * other reason must not discover they have filed an application.
 *
 * It checks for an existing request before completing that submit. A second
 * application while one is `pending` is a guaranteed 400, and an account that
 * signed up minutes ago can still have one — they may have applied from the
 * drawer on another device, or been approved between the two halves of this
 * flow. Asking first costs one GET and turns a red error into the right screen.
 *
 * AUTH IS READ FROM STORAGE, NOT AWAITED. `App.vue` initialises the auth store
 * in its own `onMounted`, which Vue runs *after* this child's — so
 * `authStore.isAuthenticated` is still false here on a signed-in visitor's first
 * frame. `authService.isAuthenticated()` answers synchronously off the token in
 * storage, which is the question this page actually has ("is there a session on
 * this device"), and the computed re-evaluates when the store catches up.
 * Getting this wrong shows a signed-in partner the blank application form for a
 * frame before replacing it.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Check, Clock, Loader, Store } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import PartnerRequestFields from '@/components/settings/credits/PartnerRequestFields.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { usePartnerRequest } from '@/composables/settings/usePartnerRequest'
import { usePartnerRequestForm } from '@/composables/settings/usePartnerRequestForm'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth'
import {
  clearPartnerRequestDraft,
  readPartnerRequestDraft,
  savePartnerRequestDraft,
} from '@/utils/partnerRequestDraft'

const router = useRouter()
const authStore = useAuthStore()
const { t, locale, setLocale, availableLocales } = useAppLanguage()
const { draft, localErrors, formError, reset, validate, payload } = usePartnerRequestForm()
const {
  request: partnerRequest,
  isSubmitting,
  fieldErrors,
  load: loadRequest,
  submit: submitRequest,
} = usePartnerRequest()

type Stage = 'checking' | 'form' | 'sent' | 'pending' | 'rejected' | 'partner'

const stage = ref<Stage>('checking')
const submitError = ref<string | null>(null)
const draftRestored = ref(false)

/** See the auth note in the block comment above — storage, not the store. */
const hasSession = computed(() => authStore.isAuthenticated || authService.isAuthenticated())

const nextLocale = computed(() => {
  const options = availableLocales.value
  const i = options.findIndex((option) => option.code === locale.value)
  return options[(i + 1) % options.length]
})

const switchLanguageLabel = computed(() =>
  t('partners.switchLanguage', { lang: nextLocale.value.name }),
)

const toggleLanguage = () => setLocale(nextLocale.value.code)

/** Only a rejection carries a reason, and only when the reviewer wrote one. */
const rejectionNote = computed(() =>
  partnerRequest.value?.status === 'rejected' ? partnerRequest.value.review_note || null : null,
)

/**
 * The four non-form screens, as data.
 *
 * `pending` and `rejected` reuse the credits page's own wording rather than
 * restating it: the same fact deserves the same sentence wherever an applicant
 * meets it, and two copies drift.
 */
const outcome = computed(() => {
  switch (stage.value) {
    case 'sent':
      return {
        icon: Check,
        disc: 'bg-emerald-50',
        tone: 'text-emerald-600',
        title: t('partners.apply.sent.title'),
        subtitle: t('partners.apply.sent.subtitle'),
        cta: t('partners.apply.sent.cta'),
      }
    case 'partner':
      return {
        icon: Check,
        disc: 'bg-emerald-50',
        tone: 'text-emerald-600',
        title: t('partners.apply.partner.title'),
        subtitle: t('partners.apply.partner.subtitle'),
        cta: t('partners.apply.partner.cta'),
      }
    case 'rejected':
      return {
        icon: Store,
        disc: 'bg-slate-100',
        tone: 'text-slate-400',
        title: t('settings.credits.request.rejected.title'),
        subtitle:
          partnerRequest.value?.review_note || t('settings.credits.request.rejected.subtitle'),
        cta: null,
      }
    default:
      return {
        icon: Clock,
        disc: 'bg-amber-50',
        tone: 'text-amber-500',
        title: t('settings.credits.request.pending.title'),
        subtitle: t('settings.credits.request.pending.subtitle'),
        cta: null,
      }
  }
})

/**
 * Which screen the account's standing application puts us on.
 *
 * Gated on a status we recognise, not merely on a truthy object. `rejected` is
 * the fall-through of the three, and it is the one answer that must never be
 * given by accident — telling someone we turned them down when the endpoint
 * actually returned something unexpected is far worse than offering the form to
 * someone who already has one, which the server refuses cleanly. This endpoint
 * is also still pending on the backend (see partner-access-request.md), so
 * "answered with something that is not an application" is a live possibility
 * rather than a hypothetical.
 */
const stageForRequest = (): Stage => {
  const status = partnerRequest.value?.status
  if (status === 'pending') return 'pending'
  if (status === 'approved') return 'partner'
  if (status === 'rejected') return partnerRequest.value?.can_reapply ? 'form' : 'rejected'
  return 'form'
}

const send = async (): Promise<boolean> => {
  submitError.value = null
  const result = await submitRequest(payload())

  if (result.success) {
    clearPartnerRequestDraft()
    stage.value = 'sent'
    return true
  }

  submitError.value = result.error
  return false
}

const handleSubmit = async (): Promise<void> => {
  if (!validate()) return

  // No account yet: keep the answers, go and get one, come back and finish.
  if (!hasSession.value) {
    savePartnerRequestDraft(draft.value, true)
    router.push(`/signin?redirect=${encodeURIComponent('/partners/apply')}`)
    return
  }

  savePartnerRequestDraft(draft.value, false)
  await send()
}

onMounted(async () => {
  const stored = readPartnerRequestDraft()

  if (stored) {
    reset(stored.data)
    // Only worth mentioning where it is a surprise — after the sign-in trip the
    // form being full is the promise being kept, not a restored draft.
    draftRestored.value = !stored.pendingSubmit
  } else {
    reset({
      contact_phone: authStore.user?.phone_number ?? '',
      contact_telegram: authStore.user?.telegram_link ?? '',
    })
  }

  if (!hasSession.value) {
    stage.value = 'form'
    return
  }

  await loadRequest()

  // An approved application and the account flag are the same news; either one
  // arriving first is enough to stop offering the form.
  if (authStore.user?.is_partner) {
    stage.value = 'partner'
    clearPartnerRequestDraft()
    return
  }

  const resolved = stageForRequest()

  if (resolved === 'form' && stored?.pendingSubmit) {
    // They pressed Send before signing in. Finish it.
    if (await send()) return
    clearPartnerRequestDraft()
  }

  stage.value = resolved
})

// `is_partner` can land after mount — `initializeAuth` sets the user from
// storage first and only then refreshes the profile from the server.
watch(
  () => authStore.user?.is_partner,
  (isPartner) => {
    if (isPartner && stage.value !== 'sent') stage.value = 'partner'
  },
)
</script>
