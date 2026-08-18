<template>
  <div>
    <h2 class="text-xl font-semibold text-slate-900 mb-2">{{ t('settings.account.title') }}</h2>
    <p class="text-sm text-slate-500 mb-6">{{ t('settings.account.subtitle') }}</p>

    <!--
      A classic settings form, sized to the column the rest of the tabs use.
      Each section is one card split into a label rail and a field column
      (`lg:grid-cols-[15rem_1fr]`) — the standard wide-form arrangement, and the
      reason the page can run to the full `max-w-5xl` without either stranding a
      gutter beside it or stretching a single input across a whole desktop.
      Below `lg` the rail simply stacks above its fields.
    -->
    <form class="space-y-4 sm:space-y-5" @submit.prevent="onSubmit">
      <!-- Profile --------------------------------------------------------- -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
        <div :class="paneClass">
          <div>
            <h3 :class="paneTitleClass">{{ t('settings.account.sections.identity') }}</h3>
            <p :class="paneHintClass">{{ t('settings.account.sections.identityHint') }}</p>
          </div>

          <div>
            <div class="flex items-center gap-4 sm:gap-5">
              <!-- The avatar is written once and laid out responsively, rather
                   than duplicated for mobile and desktop as it used to be — two
                   copies meant two file inputs and two upload buttons to keep
                   in step. -->
              <div class="relative flex-shrink-0">
                <div
                  class="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-white shadow-md shadow-slate-900/5 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff]"
                >
                  <img
                    v-if="showPhoto"
                    :key="profilePictureUrl!"
                    :src="profilePictureUrl!"
                    alt=""
                    class="w-full h-full object-cover"
                    @error="photoBroken = true"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center text-white font-bold text-2xl sm:text-3xl select-none"
                    aria-hidden="true"
                  >
                    {{ initials }}
                  </div>
                </div>

                <button
                  type="button"
                  :disabled="uploadLoading"
                  class="absolute bottom-0 right-0 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm transition-all duration-200 hover:text-[#1e90ff] hover:border-sky-300 hover:shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  :aria-label="photoActionLabel"
                  :title="photoActionLabel"
                  @click="triggerFileUpload"
                >
                  <Loader2 v-if="uploadLoading" class="w-4 h-4 animate-spin" />
                  <Camera v-else class="w-4 h-4" />
                </button>
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 min-w-0">
                  <p class="truncate text-base sm:text-lg font-semibold text-slate-900">
                    {{ displayName }}
                  </p>
                  <!-- Partner status as a badge beside the name rather than the
                       old pulsing rainbow ring around the avatar: it says the
                       same thing, reads at a glance, and stops animating. -->
                  <span
                    v-if="isPartner"
                    class="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-[10px] font-semibold uppercase tracking-wide"
                  >
                    <BadgeCheck class="w-3 h-3" aria-hidden="true" />
                    {{ t('settings.account.partnerBadge') }}
                  </span>
                </div>
                <p class="truncate text-sm text-slate-500 mt-0.5">
                  {{ profileForm.email || '—' }}
                </p>
                <p class="text-xs text-slate-400 mt-1.5">
                  {{ t('settings.account.photoHint') }}
                </p>
              </div>

              <!-- The labelled twin of the camera disc. On a wide row the disc
                   alone leaves the right half of the card empty and makes the
                   only way to change a photo a 36px target; on a phone the disc
                   is the whole affordance and this drops out. -->
              <button
                type="button"
                :disabled="uploadLoading"
                class="hidden sm:inline-flex flex-shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg transition-colors duration-200 hover:bg-slate-200 active:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                @click="triggerFileUpload"
              >
                <Loader2 v-if="uploadLoading" class="w-4 h-4 animate-spin" aria-hidden="true" />
                <Camera v-else class="w-4 h-4" aria-hidden="true" />
                {{ photoActionLabel }}
              </button>
            </div>

            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileSelect"
            />

            <!-- Partner logo. Same row grammar as the avatar above it, one size
                 down, so the two read as related without competing. -->
            <div
              v-if="isPartner"
              class="mt-5 pt-5 border-t border-slate-100 flex items-center gap-4"
            >
              <div
                class="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
              >
                <img
                  v-if="showLogo"
                  :key="logoUrl!"
                  :src="logoUrl!"
                  alt=""
                  class="w-full h-full object-contain p-1.5"
                  @error="logoBroken = true"
                />
                <ImageIcon v-else class="w-5 h-5 text-slate-300" aria-hidden="true" />
              </div>

              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-900">
                  {{ t('settings.account.partnerLogoLabel') }}
                </p>
                <p class="text-xs text-slate-500 mt-0.5">{{ t('settings.account.logoHint') }}</p>
              </div>

              <button
                type="button"
                :disabled="logoUploadLoading"
                class="flex-shrink-0 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg transition-colors duration-200 hover:bg-slate-200 active:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                :aria-label="logoActionLabel"
                :title="logoActionLabel"
                @click="triggerLogoUpload"
              >
                <Loader2 v-if="logoUploadLoading" class="w-4 h-4 animate-spin" />
                <Upload v-else class="w-4 h-4" aria-hidden="true" />
                <span class="hidden sm:inline">{{ logoActionLabel }}</span>
              </button>

              <input
                ref="logoFileInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleLogoFileSelect"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Personal details ------------------------------------------------ -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
        <div :class="paneClass">
          <div>
            <h3 :class="paneTitleClass">{{ t('settings.account.sections.personal') }}</h3>
            <p :class="paneHintClass">{{ t('settings.account.sections.personalHint') }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label :class="labelClass" for="account-first-name">
                {{ t('settings.account.firstName') }}
              </label>
              <input
                id="account-first-name"
                v-model="profileForm.first_name"
                type="text"
                autocomplete="given-name"
                :class="fieldClass"
                :placeholder="t('settings.account.firstNamePlaceholder')"
              />
            </div>

            <div>
              <label :class="labelClass" for="account-last-name">
                {{ t('settings.account.lastName') }}
              </label>
              <input
                id="account-last-name"
                v-model="profileForm.last_name"
                type="text"
                autocomplete="family-name"
                :class="fieldClass"
                :placeholder="t('settings.account.lastNamePlaceholder')"
              />
            </div>

            <div>
              <label :class="labelClass" for="account-username">
                {{ t('settings.account.username') }}
              </label>
              <div class="relative">
                <span
                  class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                  aria-hidden="true"
                  >{{ '@' }}</span
                >
                <input
                  id="account-username"
                  v-model="profileForm.username"
                  type="text"
                  autocomplete="username"
                  spellcheck="false"
                  :class="prefixedFieldClass"
                  :placeholder="t('settings.account.usernamePlaceholder')"
                />
              </div>
            </div>

            <div class="sm:col-span-2">
              <label :class="labelClass" for="account-bio">{{ t('settings.account.bio') }}</label>
              <textarea
                id="account-bio"
                v-model="profileForm.bio"
                rows="3"
                :class="[fieldClass, 'resize-none']"
                :placeholder="t('settings.account.bioPlaceholder')"
              ></textarea>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact --------------------------------------------------------- -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
        <div :class="paneClass">
          <div>
            <h3 :class="paneTitleClass">{{ t('settings.account.sections.contact') }}</h3>
            <p :class="paneHintClass">{{ t('settings.account.sections.contactHint') }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label :class="labelClass" for="account-email">
                {{ t('settings.account.emailAddress') }}
              </label>
              <input
                id="account-email"
                v-model="profileForm.email"
                type="email"
                inputmode="email"
                autocomplete="email"
                spellcheck="false"
                :class="fieldClass"
                :placeholder="t('settings.account.emailPlaceholder')"
              />
            </div>

            <div>
              <label :class="labelClass" for="account-phone">
                {{ t('settings.account.phoneNumber') }}
              </label>
              <input
                id="account-phone"
                v-model="profileForm.phone_number"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                :class="fieldClass"
                :placeholder="t('settings.account.phonePlaceholder')"
              />
            </div>

            <!-- Telegram takes the whole row for a non-partner, who has no
                 payment link to sit beside it. -->
            <div :class="isPartner ? '' : 'sm:col-span-2'">
              <label :class="labelClass" for="account-telegram">
                {{ t('settings.account.telegramUrl') }}
              </label>
              <input
                id="account-telegram"
                v-model="profileForm.telegram_link"
                type="text"
                spellcheck="false"
                :class="fieldClass"
                :placeholder="t('settings.account.telegramPlaceholder')"
              />
            </div>

            <div v-if="isPartner">
              <label :class="labelClass" for="account-payment">
                {{ t('settings.account.paymentUrl') }}
              </label>
              <input
                id="account-payment"
                v-model="profileForm.payment_link"
                type="text"
                spellcheck="false"
                :class="fieldClass"
                :placeholder="t('settings.account.paymentPlaceholder')"
              />
            </div>
          </div>
        </div>
      </section>

      <!--
        The save bar. It is the last thing in the form, so it settles into place
        at the end of the page, but it is `sticky` — on a phone, where the form
        runs several screens long, it rides along above the tab bar instead of
        making you scroll to the bottom to commit an edit made at the top.
        `--fab-bottom` is the shared slot for anything floating at the bottom
        edge: 0-relative on desktop, clearing the floating pill on touch.

        That slot is also where ContactUsFAB sits, so below `xl` the bar's
        contents stop short of the FAB's lane (its `right-4` inset plus its
        `w-10`, plus a gap) instead of running under it — the save button was
        landing behind the FAB and losing both its label and its tap target.
        From `xl` the page's own gutter is wider than the FAB, so the padding
        goes back to normal.
      -->
      <div class="sticky bottom-[var(--fab-bottom)] z-20 pt-1">
        <div
          class="flex items-center gap-2 sm:gap-3 rounded-2xl border border-white/70 bg-white/85 backdrop-blur-xl pl-3 pr-[4.5rem] xl:pr-3 py-2.5 shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5"
        >
          <p class="flex min-w-0 flex-1 items-center gap-2 text-xs sm:text-sm" aria-live="polite">
            <span
              class="w-1.5 h-1.5 flex-shrink-0 rounded-full transition-colors duration-200"
              :class="isDirty ? 'bg-amber-400' : 'bg-emerald-400'"
              aria-hidden="true"
            ></span>
            <!-- Below `sm` the row only has width for the two controls, so the
                 wording drops to the dot and stays available to a screen
                 reader rather than truncating to a single letter. -->
            <span
              class="truncate sr-only sm:not-sr-only"
              :class="isDirty ? 'text-slate-600' : 'text-slate-400'"
            >
              {{ isDirty ? t('settings.account.unsavedChanges') : t('settings.account.allSaved') }}
            </span>
          </p>

          <Transition name="fade">
            <button
              v-if="isDirty && !isSubmitting"
              type="button"
              class="flex-shrink-0 px-3 py-2 text-sm font-medium text-slate-600 rounded-lg transition-colors duration-200 hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              @click="syncFormWithStore"
            >
              {{ t('settings.account.discard') }}
            </button>
          </Transition>

          <button
            type="submit"
            :disabled="!canSave"
            class="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg shadow-md shadow-[#2ecc71]/20 transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" aria-hidden="true" />
            <Check v-else class="w-4 h-4" aria-hidden="true" />
            {{ isSubmitting ? t('settings.account.saving') : t('settings.account.saveChanges') }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BadgeCheck, Camera, Check, ImageIcon, Loader2, Upload } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useProfileForm, type ProfileFormData } from '@/composables/settings/useProfileForm'
import { useProfilePictureUpload } from '@/composables/settings/useProfilePictureUpload'
import { useLogoUpload } from '@/composables/settings/useLogoUpload'

const { t } = useI18n()
const authStore = useAuthStore()
const { showSuccess, showError } = useToast()

// Section and field chrome live in constants so every card and every input in
// the form is literally the same string — the old markup restated the input
// classes seven times and had already drifted between copies.
const paneClass = 'grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10'
const paneTitleClass = 'text-sm font-semibold text-slate-900'
const paneHintClass = 'mt-1 text-xs text-slate-500 leading-relaxed'

const FIELD_BASE =
  'w-full pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-lg transition-colors duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400'
const fieldClass = `${FIELD_BASE} pl-3.5`
const prefixedFieldClass = `${FIELD_BASE} pl-8`
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5'

const {
  profileForm,
  successMessage,
  errorMessage,
  isSubmitting,
  isPartner,
  handleProfileUpdate,
  syncFormWithStore,
} = useProfileForm({ redirectOnUnauthenticated: false })

const {
  fileInput: fileInputRef,
  profilePictureUrl,
  uploadLoading,
  triggerFileUpload,
  handleFileSelect,
} = useProfilePictureUpload({
  onSuccess: () => showSuccess(t('settings.account.messages.photoUpdated')),
  onError: (message) => showError(message || t('settings.account.messages.updateFailed')),
})

const {
  logoFileInput: logoFileInputRef,
  logoUrl,
  logoUploadLoading,
  triggerLogoUpload,
  handleLogoFileSelect,
} = useLogoUpload({
  onSuccess: () => showSuccess(t('settings.account.messages.logoUpdated')),
  onError: (message) => showError(message || t('settings.account.messages.updateFailed')),
})

// An avatar the browser can't fetch is not an error worth interrupting anyone
// over — it falls back to the initials disc, the same as having no photo at
// all. The composables' own image handlers raise a toast and leave the broken
// `<img>` in place, which renders its alt text inside the circle.
const photoBroken = ref(false)
const logoBroken = ref(false)
watch(profilePictureUrl, () => (photoBroken.value = false))
watch(logoUrl, () => (logoBroken.value = false))

const showPhoto = computed(() => !!profilePictureUrl.value && !photoBroken.value)
const showLogo = computed(() => !!logoUrl.value && !logoBroken.value)

// The form composable still reports through its own message refs; funnel them
// into the one toast stack (§12) so a save confirmation is visible from
// wherever you are in the page rather than only from the top of it.
watch(successMessage, (message) => {
  if (!message) return
  showSuccess(message)
  successMessage.value = ''
})
watch(errorMessage, (message) => {
  if (!message) return
  showError(message)
  errorMessage.value = ''
})

const displayName = computed(() => {
  const full = [profileForm.value.first_name, profileForm.value.last_name]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
  return full || profileForm.value.username.trim() || profileForm.value.email.trim() || '—'
})

// Derived from the form, not the store, so the header keeps up with what is
// being typed instead of lagging a save behind it.
const initials = computed(() => {
  const first = profileForm.value.first_name.trim() || profileForm.value.username.trim()
  const last = profileForm.value.last_name.trim()
  const derived = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
  return derived || authStore.userInitials || 'U'
})

const photoActionLabel = computed(() =>
  profilePictureUrl.value ? t('settings.account.changePhoto') : t('settings.account.addPhoto'),
)
const logoActionLabel = computed(() =>
  logoUrl.value ? t('settings.account.replaceLogo') : t('settings.account.uploadLogo'),
)

const TRACKED_FIELDS: (keyof ProfileFormData)[] = [
  'first_name',
  'last_name',
  'email',
  'username',
  'bio',
  'phone_number',
  'telegram_link',
]

// Compared against the store rather than a snapshot taken on mount: the store is
// what a successful save writes to, so the bar drops back to "saved" on its own
// and there is no second copy of the truth to keep in step.
const isDirty = computed(() => {
  const user = authStore.user
  if (!user) return false

  const stored = user as unknown as Record<string, string | undefined>
  const fields = isPartner.value
    ? [...TRACKED_FIELDS, 'payment_link' as keyof ProfileFormData]
    : TRACKED_FIELDS

  return fields.some(
    (field) => (profileForm.value[field] ?? '').trim() !== (stored[field] ?? '').trim(),
  )
})

const canSave = computed(
  () => isDirty.value && !isSubmitting.value && !uploadLoading.value && !logoUploadLoading.value,
)

const onSubmit = () => {
  if (!canSave.value) return
  void handleProfileUpdate()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
