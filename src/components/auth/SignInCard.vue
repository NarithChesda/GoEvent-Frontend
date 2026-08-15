<template>
  <div
    class="auth-card relative w-full overflow-hidden rounded-3xl border border-white/60 shadow-xl shadow-slate-900/[0.06] ring-1 ring-slate-900/5 backdrop-blur-xl"
  >
    <!-- Close (modal usage) -->
    <button
      v-if="dismissible"
      type="button"
      @click="emit('close')"
      :aria-label="t('auth.signIn.close')"
      class="absolute right-3 top-3 z-10 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-900/5 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e90ff]/30"
    >
      <X class="h-5 w-5" />
    </button>

    <!-- Identity + providers -->
    <div class="px-5 py-6 sm:px-7 sm:py-7">
      <div
        class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-white/90 to-white/50 shadow-sm ring-1 ring-slate-900/[0.08]"
        aria-hidden="true"
      >
        <LogIn class="h-6 w-6 text-slate-700" />
      </div>

      <h2 class="mt-4 text-xl font-semibold tracking-tight text-slate-900 sm:text-[1.375rem]">
        {{ title || t('auth.signIn.welcomeTitle') }}
      </h2>
      <p class="mt-1 text-sm text-slate-500">
        {{ subtitle || t('auth.signIn.welcomeSubtitle') }}
      </p>

      <!-- Error -->
      <div
        v-if="errorMessage"
        role="alert"
        class="mt-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3"
      >
        <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
        <span class="text-sm text-red-700">{{ errorMessage }}</span>
      </div>

      <div class="mt-5">
        <!-- Telegram waiting state replaces the provider buttons -->
        <div
          class="telegram-pending-pulse rounded-2xl border border-slate-200/80 bg-white/70 p-4"
          v-if="telegramBotStatus === 'pending'"
        >
          <div class="flex items-center justify-center gap-2">
            <Loader2 class="h-5 w-5 animate-spin text-[#1e90ff]" />
            <span class="text-sm font-medium text-slate-800">
              {{ t('auth.telegramPending.waiting') }}
            </span>
          </div>

          <ol class="mt-3 space-y-1.5 rounded-xl bg-slate-50/80 p-3">
            <li class="flex gap-2 text-xs text-slate-600">
              <span class="text-slate-400">1.</span>{{ t('auth.telegramPending.step1') }}
            </li>
            <li class="flex gap-2 text-xs text-slate-600">
              <span class="text-slate-400">2.</span>{{ t('auth.telegramPending.step2') }}
            </li>
          </ol>

          <p v-if="telegramCountdown > 0" class="mt-2.5 text-center text-xs text-slate-500">
            {{ t('auth.telegramPending.expiresIn') }}
            <span class="font-mono font-medium text-slate-700">
              {{ formatCountdown(telegramCountdown) }}
            </span>
          </p>

          <div class="mt-3 flex items-center gap-2">
            <button
              type="button"
              @click="openTelegram"
              class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-slate-800"
            >
              <Send class="h-4 w-4" />
              {{ t('auth.telegramPending.open') }}
            </button>
            <button
              type="button"
              @click="resetTelegramBotLogin"
              class="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors duration-200 hover:bg-slate-900/5 hover:text-slate-700"
            >
              {{ t('auth.telegramPending.cancel') }}
            </button>
          </div>
        </div>

        <div v-else class="space-y-2.5">
          <button
            type="button"
            @click="handleTelegramBotLogin"
            :disabled="isTelegramBotLoading"
            :class="socialButtonClasses"
          >
            <Loader2 v-if="isTelegramBotLoading" class="h-5 w-5 animate-spin text-slate-400" />
            <!-- Telegram's own mark, so it reads as branded as the Google G beside it -->
            <svg v-else class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <linearGradient :id="telegramGradientId" x1="12" y1="0" x2="12" y2="24"
                  gradientUnits="userSpaceOnUse">
                  <stop stop-color="#2AABEE" />
                  <stop offset="1" stop-color="#229ED9" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="12" :fill="`url(#${telegramGradientId})`" />
              <path
                fill="#fff"
                d="M17.61 7.02c.24-.11.5.1.45.36l-1.83 8.63c-.13.6-.49.75-.99.47l-2.73-2.01-1.31 1.26c-.15.15-.27.27-.55.27l.2-2.79 5.08-4.59c.22-.2-.05-.31-.34-.11l-6.28 3.95-2.7-.84c-.59-.19-.6-.59.12-.87l10.88-4.2Z"
              />
            </svg>
            {{ isTelegramBotLoading ? t('auth.signIn.telegramOpening') : t('auth.signIn.telegram') }}
            <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {{ t('auth.signIn.recommended') }}
            </span>
          </button>

          <button
            v-if="shouldShowGoogleLogin"
            type="button"
            @click="handleGoogleLogin"
            :disabled="isGoogleLoading"
            :class="socialButtonClasses"
          >
            <Loader2 v-if="isGoogleLoading" class="h-5 w-5 animate-spin text-slate-400" />
            <svg v-else class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {{ isGoogleLoading ? t('auth.signIn.signingIn') : t('auth.signIn.google') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Email + password, kept out of the way until asked for -->
    <div class="border-t border-white/70 bg-white/40 px-5 py-4 sm:px-7">
      <button
        type="button"
        @click="toggleEmailSignIn"
        :aria-expanded="showEmailSignIn"
        :aria-controls="emailFormId"
        class="flex w-full items-center justify-between gap-2 rounded-lg py-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e90ff]/30"
      >
        <span class="flex items-center gap-2">
          <Mail class="h-4 w-4 text-slate-400" />
          {{ t('auth.signIn.withEmail') }}
        </span>
        <ChevronDown
          :class="[
            'h-4 w-4 text-slate-400 transition-transform duration-200',
            showEmailSignIn ? 'rotate-180' : '',
          ]"
        />
      </button>

      <Transition name="collapse">
        <div v-if="showEmailSignIn" :id="emailFormId" class="grid grid-rows-[1fr]">
          <div class="min-h-0 overflow-hidden">
            <form class="space-y-4 pt-4" @submit.prevent="handleSignIn">
              <!-- Email -->
              <div>
                <label :for="emailId" class="mb-1.5 block text-sm font-medium text-slate-700">
                  {{ t('auth.signIn.email') }}
                </label>
                <input
                  :id="emailId"
                  ref="emailInput"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  v-model="form.email"
                  :class="[
                    'w-full rounded-xl border bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2',
                    hasEmailError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : 'border-slate-200 focus:border-[#1e90ff]/50 focus:ring-[#1e90ff]/20',
                  ]"
                  :placeholder="t('auth.signIn.emailPlaceholder')"
                />
                <p v-for="error in emailErrors" :key="error" class="mt-1 text-xs text-red-600">
                  {{ error }}
                </p>
              </div>

              <!-- Password -->
              <div>
                <label :for="passwordId" class="mb-1.5 block text-sm font-medium text-slate-700">
                  {{ t('auth.signIn.password') }}
                </label>
                <div class="relative">
                  <input
                    :id="passwordId"
                    name="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    required
                    v-model="form.password"
                    :class="[
                      'w-full rounded-xl border bg-white/80 py-2.5 pl-3.5 pr-11 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2',
                      hasPasswordError
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                        : 'border-slate-200 focus:border-[#1e90ff]/50 focus:ring-[#1e90ff]/20',
                    ]"
                    :placeholder="t('auth.signIn.passwordPlaceholder')"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    :aria-label="
                      showPassword ? t('auth.signIn.hidePassword') : t('auth.signIn.showPassword')
                    "
                    class="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    <Eye v-if="!showPassword" class="h-5 w-5" />
                    <EyeOff v-else class="h-5 w-5" />
                  </button>
                </div>
                <p v-for="error in passwordErrors" :key="error" class="mt-1 text-xs text-red-600">
                  {{ error }}
                </p>
              </div>

              <button
                type="submit"
                :disabled="isEmailSubmitting || !isFormValid"
                class="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                <Loader2 v-if="isEmailSubmitting" class="h-4 w-4 animate-spin" />
                {{ isEmailSubmitting ? t('auth.signIn.signingIn') : t('auth.signIn.submit') }}
              </button>
            </form>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script lang="ts">
/** Which provider completed the sign-in — parents branch on it. */
export type SignInMethod = 'email' | 'google' | 'telegram-bot'
</script>

<script setup lang="ts">
/**
 * SignInCard
 *
 * The single sign-in surface for the whole app: email/password plus the
 * Telegram-bot and Google providers. It owns no chrome of its own beyond the
 * card, so it drops straight into a page ([SignInView.vue](src/views/SignInView.vue))
 * or into a modal overlay ([AuthModal.vue](src/components/AuthModal.vue)).
 *
 * The parent decides what "signed in" means — the card only reports which
 * provider completed, via the `authenticated` event.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, useId, useTemplateRef, watch } from 'vue'
import {
  AlertCircle,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  Mail,
  Send,
  X,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { googleTokenLogin } from 'vue3-google-login'
import { inputValidator, validationRules } from '@/utils/inputValidation'
import { isDesktopDevice, isNormalBrowser } from '@/utils/browserDetection'
import { useTelegramBotLogin } from '@/composables/useTelegramBotLogin'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  /** Overrides the default "Welcome to GoEvent" heading. */
  title?: string
  /** Overrides the default sub-heading. */
  subtitle?: string
  /** Renders the close button (modal usage). */
  dismissible?: boolean
  /**
   * Hide the Google button on phones/tablets. The showcase modal keeps this on
   * because the Google popup is unreliable inside mobile in-app browsers.
   */
  hideGoogleOnMobile?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  dismissible: false,
  hideGoogleOnMobile: false,
})

const emit = defineEmits<{
  authenticated: [method: SignInMethod]
  close: []
}>()

const { t } = useAppLanguage()
const authStore = useAuthStore()

// Unique ids so two cards on one page (e.g. page + modal) never collide
const uid = useId()
const emailId = `signin-email-${uid}`
const passwordId = `signin-password-${uid}`
const emailFormId = `signin-email-form-${uid}`
// SVG gradient ids are document-global, so scope it per instance
const telegramGradientId = `tg-mark-${uid}`

const form = ref({ email: '', password: '' })
const showPassword = ref(false)
const showEmailSignIn = ref(false)
const emailInput = useTemplateRef<HTMLInputElement>('emailInput')
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
const isEmailSubmitting = ref(false)
const isGoogleLoading = ref(false)
const isTelegramBotLoading = ref(false)

// Google's popup flow can't complete inside messaging-app browsers
const shouldShowGoogleLogin = computed(
  () => isNormalBrowser() && (!props.hideGoogleOnMobile || isDesktopDevice()),
)

const socialButtonClasses =
  'flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300/80 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e90ff]/30 disabled:cursor-not-allowed disabled:opacity-50'

// Real-time validation
const emailValidation = computed(() =>
  form.value.email ? inputValidator.validateEmail(form.value.email) : { isValid: true, errors: [] },
)

const passwordValidation = computed(() =>
  form.value.password
    ? inputValidator.validatePassword(form.value.password)
    : { isValid: true, errors: [] },
)

const emailErrors = computed(() => fieldErrors.value.email || emailValidation.value.errors)
const passwordErrors = computed(() => fieldErrors.value.password || passwordValidation.value.errors)
const hasEmailError = computed(() => emailErrors.value.length > 0)
const hasPasswordError = computed(() => passwordErrors.value.length > 0)

const isFormValid = computed(
  () =>
    emailValidation.value.isValid &&
    passwordValidation.value.isValid &&
    form.value.email.length > 0 &&
    form.value.password.length > 0,
)

/* ---------------------------------------------------------------- Telegram */

const {
  status: telegramBotStatus,
  error: telegramBotError,
  user: telegramBotUser,
  tokens: telegramBotTokens,
  hasPendingLogin,
  initiateLogin: initiateTelegramBotLogin,
  openTelegram,
  reset: resetTelegramBotLogin,
  resumePolling,
} = useTelegramBotLogin()

const telegramCountdown = ref(0)
let countdownInterval: ReturnType<typeof setInterval> | null = null

const stopCountdown = () => {
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = null
  telegramCountdown.value = 0
}

const startCountdown = (seconds: number) => {
  if (countdownInterval) clearInterval(countdownInterval)
  telegramCountdown.value = seconds
  countdownInterval = setInterval(() => {
    if (telegramCountdown.value > 0) {
      telegramCountdown.value--
    } else {
      stopCountdown()
    }
  }, 1000)
}

const formatCountdown = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleTelegramBotLogin = async () => {
  if (isTelegramBotLoading.value || telegramBotStatus.value === 'pending') return

  isTelegramBotLoading.value = true
  errorMessage.value = ''

  try {
    const tokenData = await initiateTelegramBotLogin()
    if (tokenData) {
      startCountdown(tokenData.expires_in)
      window.open(tokenData.deep_link, '_blank')
    }
  } catch (error) {
    console.error('Telegram bot login error:', error)
    errorMessage.value = t('auth.errors.telegramInitFailed')
  } finally {
    isTelegramBotLoading.value = false
  }
}

watch(telegramBotStatus, async (newStatus) => {
  if (newStatus === 'completed' && telegramBotUser.value && telegramBotTokens.value) {
    stopCountdown()

    const result = await authStore.telegramBotLogin(
      telegramBotUser.value,
      telegramBotTokens.value.access,
      telegramBotTokens.value.refresh,
    )

    if (result.success) {
      emit('authenticated', 'telegram-bot')
    } else {
      errorMessage.value = result.error || t('auth.errors.telegramFailed')
      resetTelegramBotLogin()
    }
  } else if (newStatus === 'expired') {
    stopCountdown()
    errorMessage.value = t('auth.errors.telegramExpired')
  } else if (newStatus === 'error' && telegramBotError.value) {
    stopCountdown()
    errorMessage.value = telegramBotError.value
  } else if (newStatus === 'idle') {
    stopCountdown()
  }
})

/**
 * A login started before the user left for Telegram survives in localStorage —
 * pick the polling back up when the card mounts (in-app browsers reload the
 * page when returning from Telegram).
 */
const resumePendingTelegramLogin = () => {
  if (telegramBotStatus.value === 'pending' || !hasPendingLogin.value) return
  const remainingSecs = resumePolling()
  if (remainingSecs > 0) startCountdown(remainingSecs)
}

/* ------------------------------------------------------------------- Email */

const toggleEmailSignIn = async () => {
  showEmailSignIn.value = !showEmailSignIn.value
  if (!showEmailSignIn.value) return
  await nextTick()
  // preventScroll matters: focusing a field that is still mid-expand makes the
  // browser scroll it into view, which fights the transition and reads as a jump
  emailInput.value?.focus({ preventScroll: true })
}

const handleSignIn = async () => {
  if (isEmailSubmitting.value) return

  errorMessage.value = ''
  fieldErrors.value = {}

  const clientId = navigator.userAgent + window.location.hostname
  if (inputValidator.isRateLimited(`signin_${clientId}`, 5, 15 * 60 * 1000)) {
    errorMessage.value = t('auth.errors.rateLimited')
    return
  }

  const validation = inputValidator.validateForm(form.value, {
    email: validationRules.email,
    password: validationRules.password,
  })

  if (!validation.isValid) {
    fieldErrors.value = validation.errors
    errorMessage.value = t('auth.errors.fixErrors')
    return
  }

  isEmailSubmitting.value = true

  try {
    const result = await authStore.login({
      email: validation.sanitizedData.email,
      password: validation.sanitizedData.password,
    })

    if (result.success) {
      inputValidator.clearRateLimit(`signin_${clientId}`)
      emit('authenticated', 'email')
    } else {
      errorMessage.value = result.error || t('auth.errors.loginFailed')
    }
  } catch (error) {
    console.error('Sign in error:', error)
    errorMessage.value = t('auth.errors.unexpected')
  } finally {
    isEmailSubmitting.value = false
  }
}

/* ------------------------------------------------------------------ Google */

const handleGoogleLogin = async () => {
  isGoogleLoading.value = true
  errorMessage.value = ''

  try {
    const response = await googleTokenLogin()

    if (response.access_token) {
      const result = await authStore.googleLogin(response.access_token)

      if (result.success) {
        emit('authenticated', 'google')
      } else {
        errorMessage.value = result.error || t('auth.errors.googleFailed')
        console.error('Backend error:', result)
      }
    }
  } catch (error) {
    console.error('Google login error:', error)
    const cancelled =
      error instanceof Error && error.message.includes('popup_closed_by_user')
    errorMessage.value = cancelled
      ? t('auth.errors.googleCancelled')
      : t('auth.errors.googleFailed')
  } finally {
    isGoogleLoading.value = false
  }
}

onMounted(resumePendingTelegramLogin)
onUnmounted(stopCountdown)
</script>

<style scoped>
/*
 * Glass surface. The page sits on a near-white wash, so 0.72 reads as glass;
 * over a dark overlay (AuthModal) the host raises --auth-card-alpha so the
 * card stays white instead of picking up the backdrop's grey.
 */
.auth-card {
  background-color: rgba(255, 255, 255, var(--auth-card-alpha, 0.78));
}

/*
 * Grid-rows collapse — eases evenly in both directions, unlike max-height.
 * `will-change` keeps the row track off the slow path, and the inner wrapper
 * carries the fade/slide so the content arrives with the box instead of being
 * squeezed out of a shrinking one.
 */
.collapse-enter-active,
.collapse-leave-active {
  will-change: grid-template-rows;
}

.collapse-enter-active {
  transition: grid-template-rows 0.42s cubic-bezier(0.32, 0.72, 0, 1);
}

.collapse-leave-active {
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.collapse-enter-active > *,
.collapse-leave-active > * {
  transition:
    opacity 0.28s ease,
    transform 0.42s cubic-bezier(0.32, 0.72, 0, 1);
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
}

.collapse-enter-from > *,
.collapse-leave-to > * {
  opacity: 0;
  transform: translateY(-6px);
}

/* Draws attention to the "check Telegram" step without moving layout */
.telegram-pending-pulse {
  animation: telegram-pulse 2s ease-in-out infinite;
}

@keyframes telegram-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(30, 144, 255, 0.22);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(30, 144, 255, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .telegram-pending-pulse {
    animation: none;
  }

  .collapse-enter-active,
  .collapse-leave-active,
  .collapse-enter-active > *,
  .collapse-leave-active > * {
    transition: none;
  }
}
</style>
