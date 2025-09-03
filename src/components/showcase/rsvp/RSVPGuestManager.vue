<template>
  <div v-if="rsvpStatus === 'coming'" class="rsvp-section-tight" @mouseleave="onGuestCounterLeave">
    <!-- Guest Counter -->
    <div class="guest-counter-section">
      <!-- Guest Counter Label (centered) -->
      <div class="text-center mb-4">
        <h3 class="text-lg font-medium mb-2" :style="{
          color: primaryColor,
          fontFamily: primaryFont || currentFont
        }">
          {{ rsvpAdditionalGuestsText }}
        </h3>
      </div>

      <!-- Guest Counter Controls (centered, matching RSVP buttons) -->
      <div class="guest-counter-controls">
        <button
          @click="onDecreaseGuests"
          :disabled="additionalGuests <= 0 || isUpdatingGuestCount"
          class="guest-counter-btn guest-counter-btn--decrease"
          :style="{
            background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}10)`,
            color: primaryColor,
            border: `2px solid ${primaryColor}30`,
            opacity: additionalGuests <= 0 || isUpdatingGuestCount ? '0.4' : '1',
            fontFamily: secondaryFont || currentFont
          }"
        >
          <Minus class="w-5 h-5" />
        </button>

        <div class="guest-count-display" :style="{
          background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}15)`,
          color: primaryColor,
          border: `2px solid ${primaryColor}40`,
          fontFamily: primaryFont || currentFont
        }">
          <span v-if="!isUpdatingGuestCount">{{ additionalGuests }}</span>
          <div v-else class="loading-spinner"></div>
        </div>

        <button
          @click="onIncreaseGuests"
          :disabled="additionalGuests >= maxGuests || isUpdatingGuestCount"
          class="guest-counter-btn guest-counter-btn--increase"
          :style="{
            background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}15)`,
            color: primaryColor,
            border: `2px solid ${primaryColor}40`,
            opacity: additionalGuests >= maxGuests || isUpdatingGuestCount ? '0.4' : '1',
            fontFamily: secondaryFont || currentFont
          }"
        >
          <Plus class="w-5 h-5" />
        </button>
      </div>

      <!-- Guest Counter Helper Text -->
      <div class="text-center mt-3">
        <p class="text-xs" :style="{
          color: primaryColor,
          opacity: '0.7',
          fontFamily: secondaryFont || currentFont
        }">
          {{ guestCountHelperText }}
        </p>
      </div>
    </div>

    <!-- Payment Methods Section -->
    <div v-if="paymentMethods.length > 0" class="payment-methods-section mt-6">
      <h3 class="text-lg font-medium text-center mb-4" :style="{
        color: primaryColor,
        fontFamily: primaryFont || currentFont
      }">
        {{ paymentMethodsHeaderText }}
      </h3>

      <div class="payment-methods-grid">
        <div
          v-for="method in paymentMethods"
          :key="method.id"
          class="payment-method-card"
          :style="{
            background: `linear-gradient(135deg, ${primaryColor}12, ${primaryColor}08)`,
            border: `1px solid ${primaryColor}30`,
            color: primaryColor
          }"
        >
          <div class="payment-method-header">
            <h4 class="font-medium" :style="{ fontFamily: secondaryFont || currentFont }">
              {{ method.payment_method_display || method.payment_method }}
            </h4>
          </div>
          
          <div class="payment-method-details">
            <p class="text-sm mb-1" :style="{
              fontFamily: secondaryFont || currentFont,
              opacity: '0.9'
            }">
              {{ method.account_holder }}
            </p>
            <p class="text-sm font-mono" :style="{
              fontFamily: secondaryFont || currentFont,
              opacity: '0.8'
            }">
              {{ method.account_number }}
            </p>
          </div>

          <!-- QR Code if available -->
          <div v-if="method.qr_code" class="payment-qr-code mt-3 text-center">
            <img
              :src="getQRCodeUrl(method.qr_code)"
              :alt="`QR Code for ${method.payment_method_display || method.payment_method}`"
              class="qr-code-image"
            />
          </div>
        </div>
      </div>

      <div class="text-center mt-4">
        <p class="text-xs" :style="{
          color: primaryColor,
          opacity: '0.7',
          fontFamily: secondaryFont || currentFont
        }">
          {{ paymentInstructionsText }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'
import type { RSVPGuestManagerProps } from '../../../types/showcase'
import {
  translateRSVP,
  type SupportedLanguage
} from '../../../utils/translations'

const props = defineProps<RSVPGuestManagerProps>()

const emit = defineEmits<{
  increaseGuests: []
  decreaseGuests: []
  guestCounterLeave: []
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
    'rsvp_additional_guests': 'rsvp_additional_guests',
    'guest_count_helper': 'rsvp_additional_guests',
    'payment_methods_header': 'rsvp_total_attending',
    'payment_instructions': 'rsvp_thank_you'
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

const rsvpAdditionalGuestsText = computed(() => getTextContent('rsvp_additional_guests', 'Additional Guests'))
const guestCountHelperText = computed(() => 
  getTextContent('guest_count_helper', `You can bring up to ${props.maxGuests} additional guests`)
)
const paymentMethodsHeaderText = computed(() => getTextContent('payment_methods_header', 'Payment Information'))
const paymentInstructionsText = computed(() => getTextContent('payment_instructions', 'Please use any of the above payment methods'))

const onIncreaseGuests = () => {
  emit('increaseGuests')
  props.onIncreaseGuests()
}

const onDecreaseGuests = () => {
  emit('decreaseGuests')
  props.onDecreaseGuests()
}

const onGuestCounterLeave = () => {
  emit('guestCounterLeave')
  props.onGuestCounterLeave()
}

const getQRCodeUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  return url.startsWith('/') ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/media/${url}`
}
</script>

<style scoped>
.rsvp-section-tight {
  padding: 0 1.25rem 1rem;
}

.guest-counter-section {
  animation: slideInUp 0.4s ease-out;
}

.guest-counter-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.guest-counter-btn {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.guest-counter-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.guest-counter-btn:active:not(:disabled) {
  transform: translateY(0);
}

.guest-counter-btn:disabled {
  cursor: not-allowed;
}

.guest-count-display {
  width: 4rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.payment-methods-section {
  border-top: 1px solid currentColor;
  border-opacity: 0.1;
  padding-top: 1.5rem;
  animation: slideInUp 0.5s ease-out 0.1s both;
}

.payment-methods-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.payment-method-card {
  padding: 1rem;
  border-radius: 0.75rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.payment-method-card:hover {
  transform: translateY(-1px);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.payment-method-header {
  margin-bottom: 0.75rem;
}

.payment-method-details {
  margin-bottom: 0.5rem;
}

.qr-code-image {
  width: 120px;
  height: 120px;
  border-radius: 0.5rem;
  object-fit: contain;
  background-color: white;
  padding: 0.5rem;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Mobile responsive adjustments */
@media (max-width: 640px) {
  .guest-counter-controls {
    gap: 0.75rem;
  }
  
  .guest-counter-btn {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .guest-count-display {
    width: 3.5rem;
    height: 2.5rem;
    font-size: 1rem;
  }
  
  .payment-methods-grid {
    grid-template-columns: 1fr;
  }
}
</style>