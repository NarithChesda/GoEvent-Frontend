<template>
  <div>
    <h2 class="text-xl font-semibold text-slate-900 mb-2">{{ t('settings.security.title') }}</h2>
    <p class="text-sm text-slate-500 mb-6">{{ t('settings.security.subtitle') }}</p>

    <!--
      The same settings form the profile and vendor tabs are built from: one card
      per group, split into a label rail and a field column, chrome imported
      rather than restated (see settingsFormChrome.ts).

      What this replaced was the one tab on the page that had never joined the
      system — a bare `max-w-2xl` stack with its own input recipe (a `blue-500`
      focus ring against everyone else's sky), six hand-drawn inline eye SVGs in
      a lucide-only codebase, its own success and error banners in a repo with
      exactly one toast stack, and its own dark submit button parked bottom-left
      where every sibling has the floating save bar.

      The split into two cards is not decoration. Proving who you are and
      choosing what to change to are two different acts, and the rail is where
      each one gets to say so — which also brings the strength meter up against
      the field it grades instead of stranding it below all three.
    -->
    <form class="space-y-4 sm:space-y-5" @submit.prevent="onSubmit">
      <!-- Identity ------------------------------------------------------- -->
      <section :class="sectionCardClass">
        <div :class="paneClass">
          <div>
            <h3 :class="paneTitleClass">{{ t('settings.security.sections.current') }}</h3>
            <p :class="paneHintClass">{{ t('settings.security.sections.currentHint') }}</p>
          </div>

          <div>
            <label :class="labelClass" for="security-current-password">
              {{ t('settings.security.currentPassword') }}
            </label>
            <div class="relative">
              <input
                id="security-current-password"
                v-model="passwordForm.old_password"
                :type="showPasswords.current ? 'text' : 'password'"
                autocomplete="current-password"
                spellcheck="false"
                :class="[trailingActionFieldClass, fieldErrors.old_password ? fieldErrorClass : '']"
                :aria-invalid="!!fieldErrors.old_password"
                :placeholder="t('settings.security.currentPasswordPlaceholder')"
              />
              <button
                type="button"
                :class="revealButtonClass"
                :aria-label="revealLabel(showPasswords.current)"
                :title="revealLabel(showPasswords.current)"
                @click="togglePasswordVisibility('current')"
              >
                <EyeOff v-if="showPasswords.current" class="w-4 h-4" aria-hidden="true" />
                <Eye v-else class="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p v-for="error in fieldErrors.old_password" :key="error" :class="fieldErrorTextClass">
              {{ error }}
            </p>
          </div>
        </div>
      </section>

      <!-- The new password ------------------------------------------------ -->
      <section :class="sectionCardClass">
        <div :class="paneClass">
          <div>
            <h3 :class="paneTitleClass">{{ t('settings.security.sections.new') }}</h3>
            <p :class="paneHintClass">{{ t('settings.security.sections.newHint') }}</p>
          </div>

          <div class="space-y-3 sm:space-y-4">
            <div>
              <label :class="labelClass" for="security-new-password">
                {{ t('settings.security.newPassword') }}
              </label>
              <div class="relative">
                <input
                  id="security-new-password"
                  v-model="passwordForm.new_password"
                  :type="showPasswords.new ? 'text' : 'password'"
                  autocomplete="new-password"
                  spellcheck="false"
                  :class="[
                    trailingActionFieldClass,
                    fieldErrors.new_password ? fieldErrorClass : '',
                  ]"
                  :aria-invalid="!!fieldErrors.new_password"
                  :placeholder="t('settings.security.newPasswordPlaceholder')"
                  aria-describedby="security-strength"
                />
                <button
                  type="button"
                  :class="revealButtonClass"
                  :aria-label="revealLabel(showPasswords.new)"
                  :title="revealLabel(showPasswords.new)"
                  @click="togglePasswordVisibility('new')"
                >
                  <EyeOff v-if="showPasswords.new" class="w-4 h-4" aria-hidden="true" />
                  <Eye v-else class="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <!--
                The meter, once there is something to measure.

                It used to be four things at once: five coloured dots, a word for
                the score, a second word repeating whether that score passed, a
                bulleted requirements list, and an orange callout restating the
                threshold a third time. Five saturated colours and three
                statements of one fact, on a screen whose only real emphasis is
                the save button.

                Now it is a bar and a line. The requirements are the hint text
                below, and they leave once they have been met — a list of things
                you have already done is not guidance.
              -->
              <div v-if="passwordForm.new_password" id="security-strength" class="mt-2.5">
                <div class="flex items-center gap-3">
                  <!-- Four segments for a 0–4 score: empty reads as nothing
                       earned yet, full as the top of the scale. -->
                  <div class="flex flex-1 gap-1" aria-hidden="true">
                    <span
                      v-for="segment in 4"
                      :key="segment"
                      class="h-1.5 flex-1 rounded-full transition-colors duration-300"
                      :class="passwordStrength >= segment ? passwordStrengthColor : 'bg-slate-200'"
                    ></span>
                  </div>
                  <span
                    class="flex-shrink-0 text-xs font-medium"
                    :class="passwordStrengthTextColor"
                    aria-live="polite"
                  >
                    {{ passwordStrengthText }}
                  </span>
                </div>

                <p v-if="!isPasswordStrongEnough && requirements" :class="fieldHintClass">
                  {{ requirements }}
                </p>
              </div>

              <p
                v-for="error in fieldErrors.new_password"
                :key="error"
                :class="fieldErrorTextClass"
              >
                {{ error }}
              </p>
            </div>

            <div>
              <label :class="labelClass" for="security-confirm-password">
                {{ t('settings.security.confirmNewPassword') }}
              </label>
              <div class="relative">
                <input
                  id="security-confirm-password"
                  v-model="passwordForm.new_password_confirm"
                  :type="showPasswords.confirm ? 'text' : 'password'"
                  autocomplete="new-password"
                  spellcheck="false"
                  :class="[
                    trailingActionFieldClass,
                    fieldErrors.new_password_confirm || showMismatch ? fieldErrorClass : '',
                  ]"
                  :aria-invalid="!!fieldErrors.new_password_confirm || showMismatch"
                  :placeholder="t('settings.security.confirmNewPasswordPlaceholder')"
                  @blur="confirmTouched = true"
                />
                <button
                  type="button"
                  :class="revealButtonClass"
                  :aria-label="revealLabel(showPasswords.confirm)"
                  :title="revealLabel(showPasswords.confirm)"
                  @click="togglePasswordVisibility('confirm')"
                >
                  <EyeOff v-if="showPasswords.confirm" class="w-4 h-4" aria-hidden="true" />
                  <Eye v-else class="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <!-- Said on blur rather than on every keystroke: a mismatch
                   warning that fires while you are still typing the word is
                   noise, and it is only ever true until the last character. The
                   composable already knew this and nothing had asked it. -->
              <p
                v-for="error in fieldErrors.new_password_confirm"
                :key="error"
                :class="fieldErrorTextClass"
              >
                {{ error }}
              </p>
              <p
                v-if="showMismatch && !fieldErrors.new_password_confirm"
                :class="fieldErrorTextClass"
              >
                {{ t('settings.security.messages.passwordsDoNotMatch') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- The bar answers to having started, the way the profile tab's answers
           to being dirty. There is no "unsaved changes" line: nothing here was
           saved before, so there is nothing to have lost. -->
      <SettingsSaveBar
        :visible="hasInput || isSubmitting"
        :busy="isSubmitting"
        :can-save="!!canSubmit"
        :save-label="t('settings.security.changePassword')"
        :busy-label="t('settings.security.changingPassword')"
        :secondary-label="t('settings.security.clear')"
        @secondary="onClear"
      />
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import { usePasswordChange } from '@/composables/settings/usePasswordChange'
import SettingsSaveBar from './SettingsSaveBar.vue'
import {
  fieldErrorClass,
  fieldErrorTextClass,
  fieldHintClass,
  labelClass,
  paneClass,
  paneHintClass,
  paneTitleClass,
  sectionCardClass,
  trailingActionFieldClass,
} from './settingsFormChrome'

const { t } = useI18n()
const { showSuccess, showError } = useToast()

const {
  passwordForm,
  passwordSuccessMessage,
  passwordErrorMessage,
  fieldErrors,
  showPasswords,
  isSubmitting,
  passwordStrengthData,
  passwordStrength,
  passwordStrengthText,
  passwordStrengthColor,
  passwordStrengthTextColor,
  passwordsMatch,
  isPasswordStrongEnough,
  canSubmit,
  togglePasswordVisibility,
  handlePasswordChange,
  resetForm,
} = usePasswordChange()

/**
 * The eye that reveals a password. One recipe, declared once — the version this
 * replaced restated its own positioning three times and gave the button no
 * accessible name at all, so a screen reader met three unlabelled buttons.
 * Sized to the 40px touch target the design system asks for.
 */
const revealButtonClass =
  'absolute right-0.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 transition-colors duration-200 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'

const revealLabel = (visible: boolean) =>
  visible ? t('settings.security.hidePassword') : t('settings.security.showPassword')

/** Joined into one line: four bullets for four short phrases was a list pretending to be structure. */
const requirements = computed(() => passwordStrengthData.value.feedback.join(' · '))

// Held back until the field has been left, so the warning describes a finished
// entry rather than an unfinished one.
const confirmTouched = ref(false)
const showMismatch = computed(
  () => confirmTouched.value && !!passwordForm.value.new_password_confirm && !passwordsMatch.value,
)
watch(
  () => passwordForm.value.new_password_confirm,
  () => {
    if (passwordsMatch.value) confirmTouched.value = false
  },
)

const hasInput = computed(
  () =>
    !!passwordForm.value.old_password ||
    !!passwordForm.value.new_password ||
    !!passwordForm.value.new_password_confirm,
)

// Funnelled into the one toast stack (§12), the way the profile tab funnels its
// own message refs, rather than the pair of bespoke banners that used to sit
// between the fields and the button and push both around as they appeared.
watch(passwordSuccessMessage, (message) => {
  if (!message) return
  showSuccess(message)
  passwordSuccessMessage.value = ''
  confirmTouched.value = false
})
watch(passwordErrorMessage, (message) => {
  if (!message) return
  showError(message)
  passwordErrorMessage.value = ''
})

const onClear = () => {
  resetForm()
  confirmTouched.value = false
}

const onSubmit = () => {
  if (!canSubmit.value) return
  void handlePasswordChange()
}
</script>
