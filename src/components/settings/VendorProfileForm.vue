<template>
  <div>
    <h2 class="text-xl font-semibold text-slate-900 mb-2">
      {{
        mode === 'create'
          ? t('settings.vendor.form.createTitle')
          : t('settings.vendor.form.editTitle')
      }}
    </h2>
    <p class="text-sm text-slate-500 mb-6">
      {{
        mode === 'create'
          ? t('settings.vendor.form.createSubtitle')
          : t('settings.vendor.form.editSubtitle')
      }}
    </p>

    <!--
      The same settings form the profile tab is built from: one card per group,
      split into a label rail and a field column, with the chrome imported rather
      than restated (see settingsFormChrome.ts).

      What this replaced was a two-column *page* layout — fields at 2/3 width, a
      sticky image column at 1/3 — used inside a tab that is already one column
      of a page, and it broke down twice: the image column vanished entirely in
      create mode, leaving the fields stranded at two-thirds of the width for no
      visible reason, and on a phone the images stacked below every field, so the
      first thing you would think to set about a business was the last thing you
      could reach.
    -->
    <form class="space-y-4 sm:space-y-5" @submit.prevent="onSubmit">
      <!-- Brand ----------------------------------------------------------- -->
      <!-- Edit mode only: both uploads PATCH an existing profile, so there is
           nothing to attach them to until the profile exists. -->
      <section v-if="mode === 'edit'" :class="sectionCardClass">
        <div :class="paneClass">
          <div>
            <h3 :class="paneTitleClass">{{ t('settings.vendor.form.sections.brand') }}</h3>
            <p :class="paneHintClass">{{ t('settings.vendor.form.sections.brandHint') }}</p>
          </div>

          <div>
            <!-- Logo, in the row grammar the profile tab gives an avatar: the
                 mark, then who it belongs to, then the labelled action. The name
                 and badges are a read-out of the form below, not a second place
                 to edit them — which is why the heading keeps up as you type in
                 the Business card. -->
            <div class="flex items-center gap-4 sm:gap-5">
              <div class="relative flex-shrink-0">
                <div
                  class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50"
                  :class="showLogo ? '' : imagePlaceholderClass"
                >
                  <img
                    v-if="showLogo"
                    :key="logoUrl!"
                    :src="logoUrl!"
                    alt=""
                    class="w-full h-full object-contain p-2"
                    @error="logoBroken = true"
                  />
                  <ImageIcon v-else class="w-7 h-7" aria-hidden="true" />
                </div>

                <button
                  type="button"
                  :disabled="isUploading"
                  :class="[imageActionDiscClass, 'absolute -bottom-1 -right-1']"
                  :aria-label="logoActionLabel"
                  :title="logoActionLabel"
                  @click="triggerLogoUpload"
                >
                  <Loader2 v-if="isUploading" class="w-4 h-4 animate-spin" />
                  <Upload v-else class="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                  <p class="truncate text-base sm:text-lg font-semibold text-slate-900">
                    {{ localForm.business_name?.trim() || '—' }}
                  </p>

                  <span v-if="verificationStatus" :class="[badgeClass, verificationBadgeTone]">
                    <component :is="verificationIcon" class="w-3 h-3" aria-hidden="true" />
                    {{ verificationLabel }}
                  </span>

                  <!-- Featured is a distinction, not a status, so it wears the
                       brand as a tint rather than as a filled pill — the save bar
                       is the one full-strength gradient on this screen. -->
                  <span
                    v-if="vendorProfile?.is_featured"
                    :class="[
                      badgeClass,
                      'bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10 text-slate-700 border-[#2ecc71]/20',
                    ]"
                    :title="featuredUntilText"
                  >
                    <Star class="w-3 h-3 text-[#2ecc71]" aria-hidden="true" />
                    {{ t('settings.vendor.form.featured') }}
                  </span>
                </div>

                <p class="truncate text-sm text-slate-500 mt-0.5">
                  {{ t('settings.vendor.form.listingCount', { n: listingCount }, listingCount) }}
                </p>
                <p class="text-xs text-slate-400 mt-1.5">
                  {{ t('settings.vendor.form.logoHint') }}
                </p>
              </div>

              <!-- The labelled twin of the disc. On a wide row the disc alone
                   leaves the right half of the card empty and makes the only way
                   to change a logo a 36px target; on a phone the disc is the
                   whole affordance and this drops out. -->
              <button
                type="button"
                :disabled="isUploading"
                :class="[imageActionClass, 'hidden sm:inline-flex']"
                @click="triggerLogoUpload"
              >
                <Loader2 v-if="isUploading" class="w-4 h-4 animate-spin" aria-hidden="true" />
                <Upload v-else class="w-4 h-4" aria-hidden="true" />
                {{ logoActionLabel }}
              </button>
            </div>

            <input
              ref="logoInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleLogoSelect"
            />

            <!-- Cover. Wide artwork, so it gets a row of its own rather than a
                 thumbnail too small to judge a crop by. -->
            <div class="mt-5 pt-5 border-t border-slate-100">
              <div class="flex items-center gap-3">
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-900">
                    {{ t('settings.vendor.form.coverImage') }}
                  </p>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ t('settings.vendor.form.coverHint') }}
                  </p>
                </div>

                <button
                  type="button"
                  :disabled="isUploading"
                  :class="imageActionClass"
                  :aria-label="coverActionLabel"
                  :title="coverActionLabel"
                  @click="triggerCoverUpload"
                >
                  <Loader2 v-if="isUploading" class="w-4 h-4 animate-spin" aria-hidden="true" />
                  <Upload v-else class="w-4 h-4" aria-hidden="true" />
                  <span class="hidden sm:inline">{{ coverActionLabel }}</span>
                </button>
              </div>

              <div
                class="mt-3 aspect-[3/1] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                :class="showCover ? '' : imagePlaceholderClass"
              >
                <img
                  v-if="showCover"
                  :key="coverImageUrl!"
                  :src="coverImageUrl!"
                  alt=""
                  class="w-full h-full object-cover"
                  @error="coverBroken = true"
                />
                <ImageIcon v-else class="w-8 h-8" aria-hidden="true" />
              </div>

              <input
                ref="coverInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleCoverSelect"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Business -------------------------------------------------------- -->
      <section :class="sectionCardClass">
        <div :class="paneClass">
          <div>
            <h3 :class="paneTitleClass">{{ t('settings.vendor.form.sections.business') }}</h3>
            <p :class="paneHintClass">{{ t('settings.vendor.form.sections.businessHint') }}</p>
          </div>

          <div class="space-y-3 sm:space-y-4">
            <div>
              <label :class="labelClass" for="vendor-business-name">
                {{ t('settings.vendor.form.businessName') }}
                <span class="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="vendor-business-name"
                v-model="localForm.business_name"
                type="text"
                required
                autocomplete="organization"
                :class="fieldClass"
                :placeholder="t('settings.vendor.form.businessNamePlaceholder')"
              />
            </div>

            <div>
              <label :class="labelClass" for="vendor-tagline">
                {{ t('settings.vendor.form.tagline') }}
              </label>
              <input
                id="vendor-tagline"
                v-model="localForm.short_tagline"
                type="text"
                maxlength="100"
                :class="fieldClass"
                :placeholder="t('settings.vendor.form.taglinePlaceholder')"
                aria-describedby="vendor-tagline-count"
              />
              <p id="vendor-tagline-count" :class="fieldHintClass">
                {{
                  t('settings.vendor.form.taglineCount', {
                    count: localForm.short_tagline?.length || 0,
                  })
                }}
              </p>
            </div>

            <div>
              <label :class="labelClass" for="vendor-description">
                {{ t('settings.vendor.form.description') }}
              </label>
              <textarea
                id="vendor-description"
                v-model="localForm.description"
                rows="4"
                :class="[fieldClass, 'resize-none']"
                :placeholder="t('settings.vendor.form.descriptionPlaceholder')"
              ></textarea>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact --------------------------------------------------------- -->
      <section :class="sectionCardClass">
        <div :class="paneClass">
          <div>
            <h3 :class="paneTitleClass">{{ t('settings.vendor.form.contactSection') }}</h3>
            <p :class="paneHintClass">{{ t('settings.vendor.form.sections.contactHint') }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label :class="labelClass" for="vendor-email">
                {{ t('settings.vendor.form.businessEmail') }}
              </label>
              <input
                id="vendor-email"
                v-model="localForm.email"
                type="email"
                inputmode="email"
                autocomplete="email"
                spellcheck="false"
                :class="fieldClass"
                :placeholder="t('settings.vendor.form.emailPlaceholder')"
              />
            </div>

            <div>
              <label :class="labelClass" for="vendor-phone">
                {{ t('settings.vendor.form.phone') }}
              </label>
              <input
                id="vendor-phone"
                v-model="localForm.phone"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                :class="fieldClass"
                :placeholder="t('settings.vendor.form.phonePlaceholder')"
              />
            </div>

            <div>
              <label :class="labelClass" for="vendor-telegram">
                {{ t('settings.vendor.form.telegramUsername') }}
              </label>
              <div class="relative">
                <span
                  class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                  aria-hidden="true"
                  >{{ '@' }}</span
                >
                <input
                  id="vendor-telegram"
                  v-model="localForm.telegram_username"
                  type="text"
                  spellcheck="false"
                  :class="prefixedFieldClass"
                  :placeholder="t('settings.vendor.form.telegramPlaceholder')"
                />
              </div>
            </div>

            <div>
              <label :class="labelClass" for="vendor-website">
                {{ t('settings.vendor.form.website') }}
              </label>
              <input
                id="vendor-website"
                v-model="localForm.website"
                type="url"
                inputmode="url"
                spellcheck="false"
                :class="fieldClass"
                :placeholder="t('settings.vendor.form.websitePlaceholder')"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Location -------------------------------------------------------- -->
      <section :class="sectionCardClass">
        <div :class="paneClass">
          <div>
            <h3 :class="paneTitleClass">{{ t('settings.vendor.form.locationSection') }}</h3>
            <p :class="paneHintClass">{{ t('settings.vendor.form.sections.locationHint') }}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div class="sm:col-span-2">
              <label :class="labelClass" for="vendor-address">
                {{ t('settings.vendor.form.address') }}
              </label>
              <input
                id="vendor-address"
                v-model="localForm.address"
                type="text"
                autocomplete="street-address"
                :class="fieldClass"
                :placeholder="t('settings.vendor.form.addressPlaceholder')"
              />
            </div>

            <div>
              <label :class="labelClass" for="vendor-city">
                {{ t('settings.vendor.form.city') }}
              </label>
              <input
                id="vendor-city"
                v-model="localForm.city"
                type="text"
                autocomplete="address-level2"
                :class="fieldClass"
                :placeholder="t('settings.vendor.form.cityPlaceholder')"
              />
            </div>

            <div>
              <label :class="labelClass" for="vendor-country">
                {{ t('settings.vendor.form.country') }}
              </label>
              <input
                id="vendor-country"
                v-model="localForm.country"
                type="text"
                autocomplete="country-name"
                :class="fieldClass"
                :placeholder="t('settings.vendor.form.countryPlaceholder')"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Editing answers to a dirty flag, the way the profile tab's bar does. A
           create flow keeps its bar out permanently: the way out of a form you
           opted into belongs beside the way through it, not as a stray × in the
           heading — that is drawer vocabulary, and this is not a drawer. -->
      <SettingsSaveBar
        :visible="mode === 'create' || isDirty || isSaving"
        :busy="isSaving"
        :can-save="canSave"
        :save-label="
          mode === 'create'
            ? t('settings.vendor.form.createProfile')
            : t('settings.vendor.form.saveChanges')
        "
        :busy-label="t('settings.vendor.form.saving')"
        :secondary-label="
          mode === 'create' ? t('settings.vendor.form.cancel') : t('settings.vendor.form.discard')
        "
        :message="mode === 'edit' ? t('settings.vendor.form.unsavedChanges') : undefined"
        @secondary="onSecondary"
      />
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, BadgeCheck, Clock, ImageIcon, Loader2, Star, Upload } from 'lucide-vue-next'
import type { VendorProfile } from '@/services/api/types'
import type { VendorFormData } from '@/composables/settings/useVendorProfile'
import SettingsSaveBar from './SettingsSaveBar.vue'
import {
  fieldClass,
  fieldHintClass,
  imageActionClass,
  imageActionDiscClass,
  imagePlaceholderClass,
  labelClass,
  paneClass,
  paneHintClass,
  paneTitleClass,
  prefixedFieldClass,
  sectionCardClass,
} from './settingsFormChrome'

interface Props {
  mode: 'create' | 'edit'
  formData: VendorFormData
  vendorProfile?: VendorProfile | null
  /** A form save is in flight. */
  isSaving: boolean
  /** Artwork is uploading — a separate thing, and only the image row shows it. */
  isUploading?: boolean
  logoUrl?: string | null
  coverImageUrl?: string | null
  verificationStatus?: 'unverified' | 'pending' | 'verified' | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [payload: VendorFormData]
  cancel: []
  'upload-logo': [file: File]
  'upload-cover': [file: File]
}>()

const { t } = useI18n()

// `formData` is the *saved* profile, in form shape — the parent rebuilds it from
// the server's response after every successful write. Editing happens in a copy
// of it, which flows one way: prop in, payload out on submit.
//
// It used to be a local ref that two deep watchers kept in step with the prop in
// both directions, a loop whose only job was to arrive back where it started. It
// also made "discard" impossible to express — resetting either side was
// immediately overwritten by the other — and it left no baseline to compare
// against, so the form could not tell whether anything had been typed at all.
// One-way, the prop *is* the baseline: dirtiness is a diff, and discarding is a
// re-copy.
const localForm = ref<VendorFormData>({ ...props.formData })
watch(
  () => props.formData,
  (saved) => (localForm.value = { ...saved }),
)

const logoInputRef = ref<HTMLInputElement | null>(null)
const coverInputRef = ref<HTMLInputElement | null>(null)

// Artwork the browser can't fetch falls back to the same empty frame as having
// none — a broken image element renders its alt text inside the box, which reads
// as a defect rather than as an upload that hasn't happened yet.
const logoBroken = ref(false)
const coverBroken = ref(false)
watch(
  () => props.logoUrl,
  () => (logoBroken.value = false),
)
watch(
  () => props.coverImageUrl,
  () => (coverBroken.value = false),
)

const showLogo = computed(() => !!props.logoUrl && !logoBroken.value)
const showCover = computed(() => !!props.coverImageUrl && !coverBroken.value)

const badgeClass =
  'inline-flex flex-shrink-0 items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide'

const VERIFICATION_TONES = {
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  unverified: 'bg-slate-100 text-slate-500 border-slate-200',
} as const

const VERIFICATION_ICONS = {
  verified: BadgeCheck,
  pending: Clock,
  unverified: AlertTriangle,
} as const

const verificationBadgeTone = computed(
  () => VERIFICATION_TONES[props.verificationStatus ?? 'unverified'],
)
const verificationIcon = computed(
  () => VERIFICATION_ICONS[props.verificationStatus ?? 'unverified'],
)
const verificationLabel = computed(() =>
  t(`settings.vendor.form.${props.verificationStatus ?? 'unverified'}`),
)

const listingCount = computed(() => props.vendorProfile?.listings_count ?? 0)

const featuredUntilText = computed(() => {
  if (!props.vendorProfile?.featured_until) return t('settings.vendor.form.featuredVendor')
  const date = new Date(props.vendorProfile.featured_until)
  return t('settings.vendor.form.featuredUntil', { date: date.toLocaleDateString() })
})

const logoActionLabel = computed(() =>
  props.logoUrl ? t('settings.vendor.form.replaceLogo') : t('settings.vendor.form.uploadLogo'),
)
const coverActionLabel = computed(() =>
  props.coverImageUrl
    ? t('settings.vendor.form.replaceCover')
    : t('settings.vendor.form.uploadCover'),
)

const TRACKED_FIELDS: (keyof VendorFormData)[] = [
  'business_name',
  'description',
  'short_tagline',
  'phone',
  'email',
  'website',
  'telegram_username',
  'address',
  'city',
  'country',
]

// Compared against the saved profile rather than a snapshot taken on mount: the
// profile is what a successful save writes to, so the bar drops back to "saved"
// on its own and there is no second copy of the truth to keep in step.
const isDirty = computed(() =>
  TRACKED_FIELDS.some(
    (field) => (localForm.value[field] ?? '').trim() !== (props.formData[field] ?? '').trim(),
  ),
)

const isFormValid = computed(() => (localForm.value.business_name ?? '').trim().length > 0)

const canSave = computed(
  () =>
    isFormValid.value &&
    !props.isSaving &&
    !props.isUploading &&
    (props.mode === 'create' || isDirty.value),
)

const triggerLogoUpload = () => logoInputRef.value?.click()
const triggerCoverUpload = () => coverInputRef.value?.click()

const takeFile = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  // Reset the input so re-picking the same file still fires a change event.
  target.value = ''
  return file
}

const handleLogoSelect = (event: Event) => {
  const file = takeFile(event)
  if (file) emit('upload-logo', file)
}

const handleCoverSelect = (event: Event) => {
  const file = takeFile(event)
  if (file) emit('upload-cover', file)
}

// One control, two intents: in a create flow it leaves the form, in an edit flow
// it throws the edit away. Discarding never needs the parent — the baseline is
// already here as a prop.
const onSecondary = () => {
  if (props.mode === 'create') emit('cancel')
  else localForm.value = { ...props.formData }
}

const onSubmit = () => {
  if (!canSave.value) return
  emit('submit', { ...localForm.value })
}
</script>
