<template>
  <div class="rsvp-section-tight">
    <!-- Sign In Prompt for Unauthenticated Users -->
    <div v-if="!isAuthenticated" class="text-center py-6">
      <p class="text-sm mb-4" :style="{ 
        color: primaryColor, 
        opacity: '0.85',
        fontFamily: secondaryFont || currentFont 
      }">
        {{ rsvpSigninPromptText }}
      </p>
      <button
        @click="onSignIn"
        class="rsvp-signin-button w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02]"
        :style="{
          background: `linear-gradient(135deg, ${primaryColor}CC, ${primaryColor}AA)`,
          color: '#ffffff',
          fontFamily: secondaryFont || currentFont,
          boxShadow: `0 8px 24px -4px ${primaryColor}30`
        }"
      >
        {{ rsvpSigninButtonText }}
      </button>
    </div>

    <!-- RSVP Toggle Buttons (Authenticated Users) -->
    <div v-else class="rsvp-buttons-container">
      <!-- Coming Button -->
      <button
        @click="() => onSetStatus('coming')"
        :disabled="isUpdatingRSVP"
        class="rsvp-button rsvp-button--coming"
        :class="{ 
          'rsvp-button--active': rsvpStatus === 'coming',
          'rsvp-button--loading': isUpdatingRSVP && rsvpStatus === 'coming'
        }"
        :style="{
          background: rsvpStatus === 'coming' 
            ? `linear-gradient(135deg, ${primaryColor}CC, ${primaryColor}AA)`
            : `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}15)`,
          color: rsvpStatus === 'coming' ? '#ffffff' : primaryColor,
          border: `2px solid ${rsvpStatus === 'coming' ? 'transparent' : primaryColor + '40'}`,
          fontFamily: secondaryFont || currentFont,
          boxShadow: rsvpStatus === 'coming' 
            ? `0 8px 24px -4px ${primaryColor}40, inset 0 1px 2px rgba(255, 255, 255, 0.2)`
            : `0 4px 12px -2px ${primaryColor}20, inset 0 1px 2px rgba(255, 255, 255, 0.1)`
        }"
      >
        <div class="rsvp-button-content">
          <div v-if="isUpdatingRSVP && rsvpStatus === 'coming'" class="flex items-center justify-center">
            <div class="loading-spinner mr-2"></div>
            {{ rsvpUpdatingText }}
          </div>
          <div v-else class="flex items-center justify-center">
            <Check v-if="rsvpStatus === 'coming'" class="w-5 h-5 mr-2" />
            <span>{{ rsvpComingText }}</span>
          </div>
        </div>
      </button>

      <!-- Not Coming Button -->
      <button
        @click="() => onSetStatus('not_coming')"
        :disabled="isUpdatingRSVP"
        class="rsvp-button rsvp-button--not-coming"
        :class="{ 
          'rsvp-button--active': rsvpStatus === 'not_coming',
          'rsvp-button--loading': isUpdatingRSVP && rsvpStatus === 'not_coming'
        }"
        :style="{
          background: rsvpStatus === 'not_coming' 
            ? `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}30)`
            : `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}10)`,
          color: rsvpStatus === 'not_coming' ? '#ffffff' : primaryColor,
          border: `2px solid ${rsvpStatus === 'not_coming' ? 'transparent' : primaryColor + '30'}`,
          fontFamily: secondaryFont || currentFont,
          opacity: rsvpStatus === 'not_coming' ? '1' : '0.85',
          boxShadow: rsvpStatus === 'not_coming' 
            ? `0 6px 18px -3px ${primaryColor}25, inset 0 1px 2px rgba(255, 255, 255, 0.15)`
            : `0 3px 9px -1px ${primaryColor}15, inset 0 1px 2px rgba(255, 255, 255, 0.08)`
        }"
      >
        <div class="rsvp-button-content">
          <div v-if="isUpdatingRSVP && rsvpStatus === 'not_coming'" class="flex items-center justify-center">
            <div class="loading-spinner mr-2"></div>
            {{ rsvpUpdatingText }}
          </div>
          <div v-else class="flex items-center justify-center">
            <X v-if="rsvpStatus === 'not_coming'" class="w-5 h-5 mr-2" />
            <span>{{ rsvpNotComingText }}</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, X } from 'lucide-vue-next'
import type { RSVPButtonsProps } from '../../../types/showcase'
import {
  translateRSVP,
  type SupportedLanguage
} from '../../../utils/translations'

const props = defineProps<RSVPButtonsProps>()

const emit = defineEmits<{
  setStatus: [status: 'coming' | 'not_coming']
  signIn: []
}>()

// Enhanced translation function
const getTextContent = (textType: string, fallback = ''): string => {
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(text =>
      text.text_type === textType && text.language === props.currentLanguage
    )
    if (text?.content) {
      return text.content
    }
  }

  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  const keyMap: Record<string, any> = {
    'rsvp_signin_prompt': 'rsvp_sign_in',
    'rsvp_signin_button': 'rsvp_sign_in_button',
    'rsvp_coming': 'rsvp_yes_button',
    'rsvp_not_coming': 'rsvp_no_button',
    'rsvp_updating': 'rsvp_updating',
    'rsvp_sign_in': 'rsvp_sign_in',
    'rsvp_sign_in_button': 'rsvp_sign_in_button',
    'rsvp_yes_button': 'rsvp_yes_button',
    'rsvp_no_button': 'rsvp_no_button'
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

const rsvpSigninPromptText = computed(() => getTextContent('rsvp_signin_prompt', 'Please sign in to RSVP for this event'))
const rsvpSigninButtonText = computed(() => getTextContent('rsvp_signin_button', 'Sign In to RSVP'))
const rsvpComingText = computed(() => getTextContent('rsvp_coming', "I'm Coming"))
const rsvpNotComingText = computed(() => getTextContent('rsvp_not_coming', "Can't Make It"))
const rsvpUpdatingText = computed(() => getTextContent('rsvp_updating', 'Updating...'))

const onSetStatus = (status: 'coming' | 'not_coming') => {
  emit('setStatus', status)
  props.onSetStatus(status)
}

const onSignIn = () => {
  emit('signIn')
  props.onSignIn()
}
</script>

<style scoped>
.rsvp-section-tight {
  padding: 0 1.25rem 1rem;
}

.rsvp-signin-button {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.rsvp-signin-button:hover {
  transform: translateY(-1px);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.rsvp-buttons-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.rsvp-button {
  padding: 0.875rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  min-height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rsvp-button:hover:not(:disabled) {
  transform: translateY(-1px);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.rsvp-button:active:not(:disabled) {
  transform: translateY(0);
}

.rsvp-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.rsvp-button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.rsvp-button--active {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .rsvp-buttons-container {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .rsvp-button {
    padding: 0.75rem 1.25rem;
    min-height: 3rem;
  }
}
</style>