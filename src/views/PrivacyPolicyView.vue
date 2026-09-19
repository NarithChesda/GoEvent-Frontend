<template>
  <MainLayout>
    <div class="min-h-screen">
      <section class="py-6 sm:py-8 lg:py-10">
        <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <header
            class="mb-8 max-w-[42rem] sm:mb-10 lg:ml-[calc(13rem+3rem)] xl:ml-[calc(13rem+4rem)]"
          >
            <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
              {{ t('common.legal.privacy.title') }}
            </h1>
            <p class="mt-2 text-xs text-slate-500 sm:text-sm">
              {{ t('common.legal.lastUpdated', { date: lastUpdated }) }}
            </p>
            <p
              v-if="isTranslationMissing"
              class="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
            >
              {{ t('common.legal.englishOnly') }}
            </p>
          </header>

          <LegalDocument
            :content="PRIVACY_POLICY_EN"
            lang="en"
            :labels="{ contents: t('common.legal.contents'), summary: t('common.legal.summary') }"
          >
            <template #after-contact>
              <a
                :href="TELEGRAM_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              >
                <Send class="h-4 w-4" aria-hidden="true" />
                {{ t('common.legal.privacy.contactCta') }}
              </a>
            </template>
          </LegalDocument>
        </div>
      </section>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
/**
 * The Privacy Policy, at `/privacy`.
 *
 * Public, and a stable URL on purpose: the sign-up form links to it, Google's
 * OAuth consent screen and Meta's ad account both require one, and the site's
 * footers point `Privacy Policy` and `Cookie Policy` (→ `#cookies`) here.
 *
 * The page chrome follows the app's language; the policy text is English only
 * until a reviewed Khmer translation exists (see privacyPolicyContent.ts), and
 * says so to a reader in any other language rather than silently switching.
 */
import { computed } from 'vue'
import { Send } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import LegalDocument from '@/components/legal/LegalDocument.vue'
import { PRIVACY_POLICY_EN } from '@/components/legal/privacyPolicyContent'
import { useAppLanguage } from '@/composables/useAppLanguage'

const TELEGRAM_URL = 'https://t.me/goeventkh'

const { t, locale } = useAppLanguage()

const isTranslationMissing = computed(() => locale.value !== 'en')

/** In the reader's language — the date is page chrome, not policy text. */
const lastUpdated = computed(() => {
  const [year, month, day] = PRIVACY_POLICY_EN.lastUpdated.split('-').map(Number)
  return new Intl.DateTimeFormat(locale.value === 'kh' ? 'km-KH' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
})
</script>
