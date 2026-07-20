<template>
  <V2ChapterShell
    section-id="rsvp-section"
    :chapter-number="chapterNumber"
    :title="title"
    :current-language="currentLanguage"
  >
    <div ref="rootEl" class="v2-form-card">
      <!-- Past event: closing note -->
      <p v-if="isEventPast" class="v2-ended-note">{{ t('event_ended') }}</p>

      <!-- Not signed in: prototype-style gate -->
      <div v-else-if="!isAuthenticated" class="text-center py-4">
        <p class="v2-form-label mb-1" style="display: inline-block">{{ t('rsvp_question') }}</p>
        <p class="v2-form-hint mb-6">{{ rsvpHeaderText }}</p>
        <button type="button" class="v2-btn v2-btn--primary" @click="$emit('showAuthModal')">
          {{ t('rsvp_sign_in') }}
        </button>
      </div>

      <!-- Loading current registration -->
      <div v-else-if="loading" class="flex justify-center py-8">
        <span class="v2-spinner" aria-hidden="true"></span>
      </div>

      <!-- Success view (after submit, or when a response already exists) -->
      <div v-else-if="showSuccess" class="text-center py-3">
        <p class="v2-success-big">{{ t('rsvp_thanks_title') }}</p>
        <p class="v2-form-hint mb-3">
          {{ rsvpStatus === 'coming' ? t('rsvp_thanks_coming') : t('rsvp_thanks_declined') }}
        </p>
        <p v-if="rsvpStatus === 'coming' && totalAttendees > 0" class="v2-total-line mb-1">
          {{ totalAttendingLabel }}: <strong>{{ totalAttendees }}</strong>
        </p>
        <p v-if="confirmationCode" class="v2-confirm-chip">
          {{ t('confirmation_label') }} · <strong>{{ confirmationCode }}</strong>
        </p>
        <button type="button" class="v2-btn v2-btn--ghost mt-5" @click="showSuccess = false">
          {{ t('rsvp_change_response') }}
        </button>
      </div>

      <!-- RSVP form -->
      <div v-else>
        <p class="v2-form-label">{{ rsvpHeaderText }}</p>

        <div class="v2-radio-row" role="radiogroup" :aria-label="t('rsvp_question')">
          <button
            type="button"
            class="v2-radio-pill"
            :class="{ 'v2-radio-pill--on': choice === 'coming' }"
            :aria-pressed="choice === 'coming'"
            @click="choice = 'coming'"
          >
            {{ t('rsvp_accept') }}
          </button>
          <button
            type="button"
            class="v2-radio-pill"
            :class="{ 'v2-radio-pill--on': choice === 'not_coming' }"
            :aria-pressed="choice === 'not_coming'"
            @click="choice = 'not_coming'"
          >
            {{ t('rsvp_decline') }}
          </button>
        </div>

        <template v-if="choice === 'coming'">
          <label class="v2-form-label" for="v2-guest-count">{{ t('rsvp_additional_guests') }}</label>
          <div class="v2-select-wrap">
            <select id="v2-guest-count" v-model.number="additionalGuests" class="v2-input">
              <option v-for="n in [0, 1, 2, 3, 4, 5]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </template>

        <p v-if="errorMessage" class="v2-form-error" role="alert">{{ errorMessage }}</p>

        <button
          type="button"
          class="v2-btn v2-btn--primary w-full"
          :disabled="!choice || submitting"
          @click="submit"
        >
          {{ submitting ? t('sending') : t('send_rsvp') }}
        </button>
      </div>
    </div>
  </V2ChapterShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import V2ChapterShell from './V2ChapterShell.vue'
import { translateV2, type V2TranslationKey } from '../../../composables/showcase-v2/v2Translations'
import { translateRSVP, type SupportedLanguage } from '../../../utils/translations'
import { eventsService } from '../../../services/api'
import type { EventText } from '../../../composables/useEventShowcase'

interface RegistrationLike {
  status?: string
  guest_count?: number
  confirmation_code?: string
  total_attendees?: number
}

interface Props {
  chapterNumber: number
  title: string
  eventId: string
  isAuthenticated?: boolean
  isEventPast?: boolean
  eventTexts?: EventText[]
  currentLanguage?: string
}

const props = defineProps<Props>()

defineEmits<{ showAuthModal: [] }>()

const rootEl = ref<HTMLElement | null>(null)

const t = (key: V2TranslationKey) => translateV2(key, props.currentLanguage)
const lang = computed(() => (props.currentLanguage as SupportedLanguage) || 'en')

// Host-provided RSVP header text wins over the generic question
const rsvpHeaderText = computed(() => {
  const custom = props.eventTexts?.find(
    (x) => x.text_type === 'rsvp_header' && x.language === props.currentLanguage,
  )
  return custom?.content || translateRSVP('rsvp_header', lang.value)
})

const totalAttendingLabel = computed(() => translateRSVP('rsvp_total_attending', lang.value))

const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const showSuccess = ref(false)

const choice = ref<'coming' | 'not_coming' | null>(null)
const additionalGuests = ref(0)
const registration = ref<RegistrationLike | null>(null)

const rsvpStatus = computed<'coming' | 'not_coming' | null>(() => {
  const status = registration.value?.status
  if (!status) return null
  if (status === 'not_coming' || status === 'declined') return 'not_coming'
  return 'coming'
})

const totalAttendees = computed(
  () => registration.value?.total_attendees ?? 1 + (registration.value?.guest_count || 0),
)
const confirmationCode = computed(() => registration.value?.confirmation_code || null)

const loadRegistration = async () => {
  if (!props.isAuthenticated || !props.eventId) return
  loading.value = true
  try {
    const response = await eventsService.getMyRegistration(props.eventId)
    if (response.success && response.data) {
      registration.value = response.data as RegistrationLike
      choice.value = rsvpStatus.value
      additionalGuests.value = registration.value.guest_count || 0
      // Existing answer → open on the summary view
      if (rsvpStatus.value) showSuccess.value = true
    } else {
      registration.value = null
    }
  } catch {
    registration.value = null
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  if (!choice.value || submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    // Same contract as the V1 flow: decline = unregister, accept = rsvp
    const response =
      choice.value === 'not_coming'
        ? await eventsService.unregisterFromEvent(props.eventId)
        : await eventsService.rsvpForEvent(props.eventId, {
            guest_count: additionalGuests.value,
            notes: '',
            status: 'confirmed',
          })

    if (response.success) {
      // POST /rsvp/ wraps the record as { message, registration }; GET returns it bare
      const data = (response.data ?? {}) as RegistrationLike & { registration?: RegistrationLike }
      registration.value = data.registration || (choice.value === 'coming' ? data : null) || {
        status: choice.value,
        guest_count: choice.value === 'coming' ? additionalGuests.value : 0,
      }
      if (choice.value === 'not_coming') {
        registration.value = { ...registration.value, status: 'not_coming', guest_count: 0 }
      }
      showSuccess.value = true
    } else {
      errorMessage.value = response.message || 'Failed to update RSVP. Please try again.'
    }
  } catch {
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadRegistration)

watch(
  () => props.isAuthenticated,
  (authed) => {
    if (authed) loadRegistration()
  },
)
</script>

<style scoped src="./v2-forms.css"></style>
