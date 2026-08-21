<template>
  <div>
    <!-- Loading. Mirrors the form's own shape — heading, then rail-and-fields
         cards — rather than a lone spinner, so the layout doesn't jump when the
         profile lands. -->
    <div v-if="vendorState === 'loading'" class="animate-pulse" aria-hidden="true">
      <div class="h-6 w-44 rounded bg-slate-200"></div>
      <div class="mt-2.5 h-4 w-64 max-w-full rounded bg-slate-100"></div>

      <div class="mt-6 space-y-4 sm:space-y-5">
        <div v-for="n in 3" :key="n" :class="sectionCardClass">
          <div :class="paneClass">
            <div>
              <div class="h-4 w-28 rounded bg-slate-200"></div>
              <div class="mt-2 h-3 w-40 max-w-full rounded bg-slate-100"></div>
            </div>
            <div class="space-y-3">
              <div class="h-10 rounded-lg bg-slate-100"></div>
              <div class="h-10 rounded-lg bg-slate-100"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load failure. Only a *fetch* reaches this state; a rejected save keeps
         you in the form with a toast (see the watchers below). -->
    <div v-else-if="vendorState === 'error'" class="py-12 lg:py-16 px-4 text-center">
      <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <AlertTriangle class="w-8 h-8 text-red-600" aria-hidden="true" />
      </div>
      <h3 class="text-lg font-semibold text-slate-900 mb-2">
        {{ t('settings.vendor.errorTitle') }}
      </h3>
      <p class="text-sm text-slate-500 mb-6 max-w-md mx-auto">{{ loadError }}</p>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        @click="loadProfile(true)"
      >
        <RefreshCw class="w-4 h-4" aria-hidden="true" />
        {{ t('settings.vendor.tryAgain') }}
      </button>
    </div>

    <!-- Not a vendor yet ------------------------------------------------- -->
    <template v-else-if="vendorState === 'not_vendor'">
      <!--
        The pitch, which is this tab's empty state. It used to be a sky-to-indigo
        panel with a sky CTA — a second palette living inside a slate-and-brand
        app — and it wrapped each of its four benefits in an emerald disc, so the
        loudest marks on a page about becoming a vendor were four checkmarks.
        Now the panel is a brand tint (texture, not an object) and the one
        saturated thing on screen is the button that does the thing.
      -->
      <div
        v-if="!showForm"
        class="rounded-2xl border border-[#2ecc71]/15 bg-gradient-to-br from-[#2ecc71]/[0.06] to-[#1e90ff]/[0.06] p-6 sm:p-8"
      >
        <div class="flex items-start gap-4">
          <div
            class="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 flex items-center justify-center"
          >
            <Store class="w-6 h-6 sm:w-7 sm:h-7 text-[#2ecc71]" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h2 class="text-xl font-semibold text-slate-900">
              {{ t('settings.vendor.becomeTitle') }}
            </h2>
            <p class="mt-1.5 text-sm sm:text-base text-slate-600 leading-relaxed">
              {{ t('settings.vendor.becomeSubtitle') }}
            </p>
          </div>
        </div>

        <ul class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <li v-for="benefit in benefits" :key="benefit.title" class="flex items-start gap-2.5">
            <Check class="w-4 h-4 mt-0.5 flex-shrink-0 text-[#2ecc71]" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-900">{{ benefit.title }}</p>
              <p class="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {{ benefit.description }}
              </p>
            </div>
          </li>
        </ul>

        <button
          type="button"
          class="group mt-7 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg shadow-md shadow-[#2ecc71]/20 transition-all duration-200 hover:opacity-90 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          @click="showForm = true"
        >
          {{ t('settings.vendor.getStarted') }}
          <ArrowRight
            class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </div>

      <VendorProfileForm
        v-else
        mode="create"
        :form-data="vendorForm"
        :is-saving="isSaving"
        @submit="handleCreateProfile"
        @cancel="showForm = false"
      />
    </template>

    <!-- Existing vendor --------------------------------------------------- -->
    <VendorProfileForm
      v-else
      mode="edit"
      :form-data="vendorForm"
      :vendor-profile="vendorProfile"
      :is-saving="isSaving"
      :is-artwork-busy="isArtworkBusy"
      :logo-url="logoUrl"
      :cover-image-url="coverImageUrl"
      :verification-status="verificationStatus"
      @submit="handleUpdateProfile"
      @upload-logo="handleLogoUpload"
      @upload-cover="handleCoverUpload"
      @remove-logo="removeLogo"
      @remove-cover="removeCoverImage"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, ArrowRight, Check, RefreshCw, Store } from 'lucide-vue-next'
import { useVendorProfile, type VendorFormData } from '@/composables/settings/useVendorProfile'
import { useToast } from '@/composables/useToast'
import VendorProfileForm from './VendorProfileForm.vue'
import { paneClass, sectionCardClass } from './settingsFormChrome'

const { t } = useI18n()
const { showSuccess, showError } = useToast()

const {
  vendorProfile,
  vendorForm,
  vendorState,
  verificationStatus,
  isSaving,
  isArtworkBusy,
  error,
  loadError,
  successMessage,
  logoUrl,
  coverImageUrl,
  loadProfile,
  createProfile,
  updateProfile,
  uploadLogo,
  removeLogo,
  uploadCoverImage,
  removeCoverImage,
} = useVendorProfile()

const showForm = ref(false)

const benefits = computed(() => [
  {
    title: t('settings.vendor.benefits.createProfile'),
    description: t('settings.vendor.benefits.createProfileSub'),
  },
  {
    title: t('settings.vendor.benefits.listServices'),
    description: t('settings.vendor.benefits.listServicesSub'),
  },
  {
    title: t('settings.vendor.benefits.trackViews'),
    description: t('settings.vendor.benefits.trackViewsSub'),
  },
  {
    title: t('settings.vendor.benefits.getVerified'),
    description: t('settings.vendor.benefits.getVerifiedSub'),
  },
])

// The composable reports through its own message refs; funnel them into the one
// toast stack (§12) so a save confirmation is visible from wherever you are in
// the form rather than only from the top of it. The banners these replaced sat
// above a page-length form, which on a phone meant the answer to "did that work"
// scrolled off before you could reach the button that asked the question.
watch(successMessage, (message) => {
  if (!message) return
  showSuccess(message)
  successMessage.value = null
})
watch(error, (message) => {
  if (!message) return
  showError(message)
  error.value = null
})

// The form edits a copy and hands back the payload, so the shared form state is
// only ever written by a successful save.
const handleCreateProfile = async (payload: VendorFormData) => {
  const result = await createProfile(payload)
  if (result.success) showForm.value = false
}

const handleUpdateProfile = (payload: VendorFormData) => updateProfile(payload)

const handleLogoUpload = (file: File) => uploadLogo(file)
const handleCoverUpload = (file: File) => uploadCoverImage(file)
</script>
