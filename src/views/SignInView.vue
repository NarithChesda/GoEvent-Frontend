<template>
  <div class="relative min-h-screen">
    <!-- Cool neutral wash, scoped to sign-in — see the note on .signin-bg below -->
    <div class="fixed inset-0 -z-10 signin-bg"></div>

    <!-- The app's own bar, in its signed-out variant -->
    <TopNavBar variant="minimal" />

    <!--
      Anchored to the top rather than vertically centered: centering would slide
      the whole card upward as the email section expands, so the row you just
      clicked moves out from under the cursor.
    -->
    <main class="flex min-h-screen justify-center px-4 pb-16 pt-[18vh] sm:px-6 sm:pt-[20vh]">
      <div class="w-full max-w-[26rem]">
        <SignInCard @authenticated="handleRedirectAfterLogin" />

        <p class="mt-5 text-center text-xs text-slate-400">
          {{ t('auth.signIn.termsPrefix') }}
          <a href="/terms" class="font-medium text-slate-500 hover:text-slate-700">
            {{ t('auth.signIn.termsOfService') }}
          </a>
          {{ t('auth.signIn.and') }}
          <a href="/privacy" class="font-medium text-slate-500 hover:text-slate-700">
            {{ t('auth.signIn.privacyPolicy') }}
          </a>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import TopNavBar from '@/components/TopNavBar.vue'
import SignInCard from '@/components/auth/SignInCard.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const router = useRouter()
const route = useRoute()
const { t } = useAppLanguage()

const handleRedirectAfterLogin = () => {
  const redirectPath = route.query.redirect as string
  if (redirectPath) {
    router.replace(redirectPath)
  } else {
    router.push('/events')
  }
}
</script>

<style scoped>
/*
 * Sign-in keeps its own background rather than MainLayout's `premium-bg`:
 * one cool neutral wash instead of two competing mint/ice tints, with a pair
 * of very faint brand blooms so the page still reads as GoEvent. Deliberately
 * scoped here — the rest of the app is unchanged.
 */
.signin-bg {
  background:
    radial-gradient(60rem 40rem at 50% 34%, rgba(46, 204, 113, 0.06), transparent 70%),
    radial-gradient(52rem 36rem at 82% 84%, rgba(30, 144, 255, 0.05), transparent 70%),
    linear-gradient(160deg, #f4f7fa 0%, #e8eef5 55%, #f0f4f8 100%);
}
</style>
