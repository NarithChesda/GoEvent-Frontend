<template>
  <div class="mb-4 sm:mb-5 laptop-sm:mb-5 laptop-md:mb-6 laptop-lg:mb-7 desktop:mb-6">
    <!-- Payment Section Header - First Payment Method Name + Type -->
    <div class="text-center laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
      <h2
        v-if="paymentMethods.length > 0"
        :class="[
          'leading-tight py-2 text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-semibold sm:mb-4 md:mb-6 capitalize',
          currentLanguage === 'kh' && 'khmer-text-fix',
        ]"
        :style="{
          fontFamily: primaryFont || currentFont,
          color: primaryColor,
        }"
      >
        {{ paymentSectionTitle }}
      </h2>
    </div>

    <!-- Payment Methods -->
    <div class="space-y-3">
      <div
        v-for="method in paymentMethods"
        :key="method.id"
        class="payment-method-section mb-3 last:mb-0"
      >
        <!-- Payment Method Card - Unified Design -->
        <div
          class="payment-card-container transition-all duration-300"
          :style="{
            backgroundColor: `${primaryColor}15`,
            boxShadow: `
              0 12px 36px -6px ${primaryColor}25,
              0 6px 24px -3px ${primaryColor}20,
              0 3px 12px -1px ${primaryColor}15,
              inset 0 1px 2px rgba(255, 255, 255, 0.12)
            `,
            border: `1px solid ${primaryColor}40`,
            backdropFilter: 'blur(16px)',
          }"
        >
          <!-- Collapsible Card Header - Always Visible -->
          <div
            class="payment-card-header cursor-pointer transition-all duration-300 hover:translateY(-1px)"
            @click="toggleCard(method)"
          >
            <div class="flex items-center justify-between p-4">
              <!-- Method Info -->
              <div class="flex items-center space-x-3">
                <div class="p-2 rounded-xl" :style="{ backgroundColor: `${primaryColor}08` }">
                  <svg
                    class="w-5 h-5"
                    :style="{ color: primaryColor }"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v2H4V6zm0 4h12v4H4v-4z"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    class="font-semibold text-sm sm:text-base"
                    :style="{
                      fontFamily: primaryFont || currentFont,
                      color: primaryColor,
                    }"
                  >
                    {{ capitalizeText(method.bank_name || method.name) }}
                  </h3>
                  <div
                    class="flex items-center space-x-2 text-xs mt-1"
                    :style="{ color: primaryColor, opacity: '0.7' }"
                  >
                    <span v-if="method.currency">{{ method.currency }}</span>
                  </div>
                </div>
              </div>

              <!-- Expand/Collapse Arrow -->
              <div
                class="transition-transform duration-300"
                :class="{ 'rotate-180': isCardExpanded(method) }"
              >
                <svg
                  class="w-5 h-5"
                  :style="{ color: primaryColor, opacity: '0.6' }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- Expandable Content -->
          <div
            class="payment-card-content overflow-hidden transition-all duration-500 ease-in-out"
            :class="isCardExpanded(method) ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'"
          >
            <div class="p-4 sm:p-6">
              <!-- Payment Method Card Content -->

              <!-- Single Row Payment Layout -->
              <div
                class="payment-row-container flex flex-col lg:flex-row items-start lg:items-center justify-center gap-4 lg:gap-6"
              >
                <!-- QR Code Section -->
                <div class="flex-shrink-0 text-center w-full lg:w-auto">
                  <!-- QR Code exists -->
                  <div v-if="method.qr_code_image" class="relative">
                    <!-- Seamless QR container with depth -->
                    <div
                      class="qr-simple-container relative p-4 transition-all duration-300 hover:scale-[1.02] group"
                      :style="{
                        backgroundColor: `${primaryColor}04`,
                      }"
                    >
                      <img
                        :src="getMediaUrl(method.qr_code_image)"
                        :alt="`QR Code for ${method.name}`"
                        class="w-32 h-32 lg:w-36 lg:h-36 mx-auto rounded-2xl shadow-md transition-all duration-300"
                        @error="onImageError"
                      />
                      <!-- Subtle scan line animation overlay -->
                      <div
                        class="absolute inset-4 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        :style="{
                          background: `linear-gradient(90deg, transparent 0%, ${primaryColor}20 50%, transparent 100%)`,
                          animation: 'scan-line 2s ease-in-out infinite',
                        }"
                      ></div>
                    </div>
                    <p
                      class="text-xs mt-1 font-medium tracking-wide"
                      :style="{ color: primaryColor, opacity: '0.8' }"
                    >
                      Scan to pay
                    </p>
                  </div>

                  <!-- QR Code Fallback -->
                  <div v-else class="relative">
                    <!-- Seamless fallback container -->
                    <div
                      class="qr-simple-container relative p-4"
                      :style="{
                        backgroundColor: `${primaryColor}04`,
                        border: `1px dashed ${primaryColor}20`,
                      }"
                    >
                      <div
                        class="w-32 h-32 lg:w-36 lg:h-36 mx-auto rounded-2xl flex items-center justify-center"
                        :style="{ backgroundColor: `${primaryColor}05` }"
                      >
                        <div class="text-center">
                          <svg
                            class="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-2"
                            :style="{ color: primaryColor, opacity: '0.4' }"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="1.5"
                              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 4h4m0 0V2m0 2h2m0 0V2m0 2v2M2 2h4m16 0h4M6 18H4m0 0v2m0-2h2m0 0v2m0-2h2m8 0v2m-2-2h2m0 0h2"
                            />
                          </svg>
                          <div
                            class="w-6 h-0.5 mx-auto rounded-full animate-pulse"
                            :style="{ backgroundColor: `${primaryColor}40` }"
                          ></div>
                        </div>
                      </div>
                    </div>
                    <p
                      class="text-xs mt-1 font-medium tracking-wide"
                      :style="{ color: primaryColor, opacity: '0.6' }"
                    >
                      QR coming soon
                    </p>
                  </div>
                </div>

                <!-- Payment Info Panel - Grouped Bank Info + Payment Button -->
                <div
                  v-if="hasVisibleBankInfo(method) || method.payment_url"
                  class="flex-shrink-0 w-full lg:w-auto lg:max-w-sm"
                >
                  <div
                    class="payment-info-simple p-4 backdrop-blur-md transition-all duration-200"
                    :style="{
                      backgroundColor: `${primaryColor}04`,
                    }"
                  >
                    <!-- Bank Info -->
                    <div v-if="hasVisibleBankInfo(method)" class="space-y-2 mb-4">
                      <div v-if="method.account_name" class="text-center lg:text-left">
                        <div
                          class="bank-info-pill inline-flex items-center px-3 py-1.5 backdrop-blur-sm font-medium text-sm min-h-[32px]"
                          :style="{
                            backgroundColor: `${primaryColor}08`,
                            color: primaryColor,
                            opacity: '0.9',
                            boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 6px ${primaryColor}12`,
                          }"
                        >
                          <svg
                            class="w-4 h-4 mr-2 flex-shrink-0"
                            :style="{ color: primaryColor }"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span class="truncate">{{ capitalizeText(method.account_name) }}</span>
                        </div>
                      </div>

                      <div v-if="method.account_number" class="text-center lg:text-left">
                        <div
                          class="bank-info-pill inline-flex items-center px-3 py-1.5 backdrop-blur-sm font-mono text-sm min-h-[32px] group cursor-pointer transition-all hover:shadow-lg"
                          :style="{
                            backgroundColor: `${primaryColor}10`,
                            color: primaryColor,
                            opacity: '0.9',
                            boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 6px ${primaryColor}12`,
                          }"
                          @click="copyToClipboard(method.account_number!)"
                          title="Click to copy full account number"
                        >
                          <svg
                            class="w-4 h-4 mr-2 flex-shrink-0"
                            :style="{ color: primaryColor }"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          <span class="truncate">•••• {{ method.account_number.slice(-4) }}</span>
                          <svg
                            class="w-4 h-4 ml-2 flex-shrink-0 transition-transform group-hover:scale-110"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <!-- Payment Button -->
                    <div v-if="method.payment_url" class="text-center lg:text-left">
                      <a
                        :href="method.payment_url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="payment-link-minimalist group inline-flex items-center justify-center w-full lg:w-auto"
                        :style="{
                          fontFamily: primaryFont || currentFont,
                          background: primaryColor,
                          color: '#ffffff',
                          boxShadow: `
                        0 8px 32px -4px ${primaryColor}50,
                        0 4px 16px -2px ${primaryColor}30,
                        inset 0 2px 4px rgba(255, 255, 255, 0.2),
                        inset 0 -1px 2px ${primaryColor}20
                      `,
                        }"
                      >
                        <span class="font-semibold">{{ capitalizeText(method.payment_type) }}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Description (if exists, keep minimal) -->
              <div v-if="method.description" class="text-center mt-4 px-2">
                <p
                  class="text-xs leading-relaxed"
                  :style="{
                    fontFamily: secondaryFont || currentFont,
                    color: primaryColor,
                    opacity: '0.6',
                  }"
                >
                  {{ method.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Payment Methods Message -->
    <div
      v-if="paymentMethods.length === 0"
      class="text-center py-8 sm:py-12 rounded-2xl"
      :style="{
        backgroundColor: `${primaryColor}08`,
        border: `1px solid ${primaryColor}20`,
      }"
    >
      <div
        class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        :style="{ backgroundColor: `${primaryColor}20` }"
      >
        <svg
          class="w-8 h-8"
          :style="{ color: primaryColor }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      </div>
      <p
        class="text-base font-medium"
        :style="{
          fontFamily: secondaryFont || currentFont,
          color: primaryColor,
          opacity: '0.8',
        }"
      >
        No payment methods available
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EventPaymentMethod } from '../../services/api'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  paymentMethods: EventPaymentMethod[]
  primaryColor: string
  secondaryColor?: string
  accentColor: string
  currentFont: string
  primaryFont: string
  secondaryFont: string
  getMediaUrl: (url: string) => string
  eventCategory?: string | number | null
  eventCategoryName?: string | null
  eventCategoryDetails?: {
    id: number
    name: string
    description: string
    color: string
    icon: string
  } | null
  eventTexts?: EventText[]
  currentLanguage?: string
}

const props = defineProps<Props>()

// Enhanced translation function that combines database content with frontend translations
const getTextContent = (textType: string, fallback = ''): string => {
  // First, try to get content from database (eventTexts)
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (text) => text.text_type === textType && text.language === props.currentLanguage,
    )
    if (text?.content) {
      return text.content
    }
  }

  // Fallback to frontend translation system
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'

  // Map text types to translation keys
  const keyMap: Record<
    string,
    keyof typeof import('../../utils/translations').rsvpTranslations.en
  > = {
    payment_wedding_gift: 'payment_wedding_gift',
    payment_birthday_gift: 'payment_birthday_gift',
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

// State
const expandedCards = ref<Set<string>>(new Set())

// Computed
const paymentSectionTitle = computed(() => {
  // Helper function to determine category for translation
  const getCategoryForTranslation = () => {
    // First, try category_details.name (most reliable)
    if (props.eventCategoryDetails?.name) {
      return props.eventCategoryDetails.name.toLowerCase()
    }

    // Second, try category_name string field
    if (props.eventCategoryName) {
      return props.eventCategoryName.toLowerCase()
    }

    // Third, try eventCategory as string
    if (props.eventCategory && typeof props.eventCategory === 'string') {
      return props.eventCategory.toLowerCase()
    }

    // Finally, try numeric category ID mapping (common category IDs)
    if (props.eventCategory && typeof props.eventCategory === 'number') {
      const numericCategory = props.eventCategory
      // Common category ID mappings based on typical database structure
      if (numericCategory === 1 || numericCategory === 7) return 'wedding'
      if (numericCategory === 2) return 'birthday'
    }

    return null
  }

  const categoryName = getCategoryForTranslation()

  // Handle specific category translations
  if (categoryName === 'wedding') {
    return getTextContent('payment_wedding_gift', 'Wedding Gift')
  }

  if (categoryName === 'birthday') {
    return getTextContent('payment_birthday_gift', 'Birthday Gift')
  }

  // For other recognized categories, create a generic gift translation
  // This allows for extensibility if more categories are added
  if (categoryName) {
    // Try to find a specific translation first, fallback to generic pattern
    const specificKey = `payment_${categoryName}_gift`
    const specificTranslation = getTextContent(specificKey, '')
    if (specificTranslation) {
      return specificTranslation
    }

    // Fallback to category name with "Gift" suffix
    const capitalizedCategory = categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
    return `${capitalizedCategory} Gift`
  }

  // Fallback to first payment method name + type (existing logic)
  if (props.paymentMethods.length > 0) {
    const firstMethod = props.paymentMethods[0]
    const paymentType =
      firstMethod.payment_type.charAt(0).toUpperCase() + firstMethod.payment_type.slice(1)
    return `${firstMethod.name} ${paymentType}`
  }

  // Final fallback
  return 'Payment'
})

// Methods
const isCardExpanded = (method: EventPaymentMethod): boolean => {
  return expandedCards.value.has(method.id.toString())
}

const toggleCard = (method: EventPaymentMethod) => {
  const id = method.id.toString()
  if (expandedCards.value.has(id)) {
    expandedCards.value.delete(id)
  } else {
    expandedCards.value.add(id)
  }
}

const hasVisibleBankInfo = (method: EventPaymentMethod): boolean => {
  return !!(method.bank_name || method.account_name || method.account_number)
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // Text copied successfully
  } catch {
    // Failed to copy - could show user feedback here
  }
}

const onImageError = () => {
  // QR code image failed to load - could set fallback here
}

const capitalizeText = (text: string | undefined): string => {
  if (!text) return ''
  return text.toUpperCase()
}
</script>

<style scoped>
/* Liquid Glass Container - Seamless unified surface */
.liquid-glass-container {
  border-radius: 2rem;
  overflow: hidden;
  backdrop-filter: blur(20px);
  position: relative;
}

.liquid-glass-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  pointer-events: none;
}

/* Payment method sections - No horizontal padding to match comment section */
.payment-method-section {
  position: relative;
}

.payment-method-section:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

/* QR Code simple container - Clean design */
.qr-simple-container {
  border-radius: 1.5rem;
  position: relative;
  overflow: hidden;
}

/* Payment info simple panel - Clean design */
.payment-info-simple {
  border-radius: 1.5rem;
  position: relative;
}

/* Legacy payment info glass panel */
.payment-info-glass {
  border-radius: 1.5rem;
  backdrop-filter: blur(16px);
  position: relative;
}

.payment-info-glass::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
  pointer-events: none;
}

/* Legacy bank info glass panel */
.bank-info-glass {
  border-radius: 1.5rem;
  backdrop-filter: blur(16px);
  position: relative;
}

.bank-info-glass::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
  pointer-events: none;
}

/* Bank info pills - Subtle embedded elements */
.bank-info-pill {
  border-radius: 1rem;
  backdrop-filter: blur(12px);
  transition: all 0.2s ease;
  position: relative;
}

.bank-info-pill:hover {
  transform: translateY(-1px);
}

/* Minimalist payment button */
.payment-link-minimalist {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(12px);
  min-height: 36px;
  position: relative;
  overflow: hidden;
}

.payment-link-minimalist::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  pointer-events: none;
}

.payment-link-minimalist:hover {
  transform: translateY(-1px);
  backdrop-filter: blur(16px);
}

.payment-link-minimalist:active {
  transform: translateY(0);
  transition: transform 0.1s ease;
}

/* Legacy liquid glass payment button */
.payment-link-liquid {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  border-radius: 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(16px);
  min-height: 52px;
  position: relative;
  overflow: hidden;
}

.payment-link-liquid::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  pointer-events: none;
}

.payment-link-liquid::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transition: left 0.5s ease;
  pointer-events: none;
}

.payment-link-liquid:hover::after {
  left: 100%;
}

.payment-link-liquid:hover {
  transform: translateY(-2px);
  backdrop-filter: blur(20px);
}

.payment-link-liquid:active {
  transform: translateY(-1px);
  transition: transform 0.1s ease;
}

/* Payment fallback - Consistent styling */
.payment-fallback {
  border-radius: 1rem;
  backdrop-filter: blur(8px);
}

/* Scan line animation for QR code */
@keyframes scan-line {
  0%,
  100% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    transform: translateX(0);
    opacity: 0.7;
  }
}

/* Payment row container - Single row layout */
.payment-row-container {
  padding: 0.5rem;
  align-items: center;
}

/* Glass content section - Legacy unified spacing */
.glass-content-section {
  padding: 0.5rem;
}

/* Mobile-first responsive design */
@media (max-width: 639px) {
  .payment-method-section {
    /* No padding - matches comment section */
  }

  .payment-row-container {
    padding: 0.5rem;
    gap: 1rem;
  }

  .qr-simple-container {
    padding: 1rem;
  }

  .payment-info-simple {
    padding: 0.75rem;
  }

  .payment-info-glass {
    padding: 0.75rem;
  }

  .bank-info-glass {
    padding: 0.75rem;
  }

  .payment-link-minimalist {
    padding: 0.5rem 0.875rem;
    font-size: 0.825rem;
    min-height: 34px;
  }

  .payment-link-liquid {
    padding: 0.875rem 1.5rem;
    font-size: 0.925rem;
    min-height: 48px;
  }
}

/* Tablet adjustments */
@media (min-width: 640px) and (max-width: 1023px) {
  .payment-method-section {
    /* No padding - matches comment section */
  }

  .payment-row-container {
    gap: 1.5rem;
  }

  .payment-info-simple {
    padding: 1rem;
  }

  .payment-info-glass {
    padding: 1rem;
  }

  .payment-link-minimalist {
    padding: 0.625rem 1rem;
    min-height: 38px;
  }

  .payment-link-liquid {
    padding: 1rem 1.75rem;
    min-height: 50px;
  }
}

/* Unified payment card container */
.payment-card-container {
  border-radius: 1.5rem;
  position: relative;
  overflow: hidden;
}

.payment-card-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
  pointer-events: none;
}

/* Payment card header - no separate styling */
.payment-card-header {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.payment-card-header:hover {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.payment-card-content {
  transition:
    max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease-in-out;
  will-change: max-height, opacity;
  transform-origin: top;
}

/* Small laptops 13-inch (1024px-1365px) - Use mobile view for collapse/expand states */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Payment card container - mobile sizing */
  .payment-card-container {
    border-radius: 1.5rem !important;
  }

  /* Card header - mobile padding (p-4) */
  .payment-card-header > .flex {
    padding: 1rem !important;
  }

  /* Expandable content - mobile padding (p-4) */
  .payment-card-content > div {
    padding: 1rem !important;
  }

  /* QR Code section - centered like mobile */
  .payment-row-container > div:first-child {
    text-align: center !important;
  }

  /* QR Code - mobile size */
  .qr-simple-container {
    padding: 1rem !important;
  }

  .qr-simple-container img,
  .qr-simple-container .w-32,
  .qr-simple-container .h-32 {
    width: 8rem !important; /* 128px - mobile size */
    height: 8rem !important;
  }

  /* Prevent large laptop sizing */
  .lg\:w-36,
  .lg\:h-36 {
    width: 8rem !important;
    height: 8rem !important;
  }

  /* Payment info - mobile sizing and center alignment */
  .payment-info-simple {
    padding: 0.75rem !important;
  }

  .payment-info-glass {
    padding: 0.75rem !important;
  }

  /* Bank info - center alignment like mobile */
  .payment-info-simple .space-y-2 > div {
    text-align: center !important;
  }

  /* Override lg:text-left to maintain center alignment */
  .lg\:text-left {
    text-align: center !important;
  }

  /* Bank info pills - mobile size */
  .bank-info-pill {
    padding: 0.375rem 0.75rem !important;
    font-size: 0.875rem !important;
    min-height: 32px !important;
  }

  .bank-info-pill svg.w-4 {
    width: 1rem !important;
    height: 1rem !important;
  }

  /* Payment button - mobile size and center alignment */
  .payment-link-minimalist {
    padding: 0.5rem 0.875rem !important;
    font-size: 0.825rem !important;
    min-height: 34px !important;
    width: 100% !important;
  }

  /* Override lg:w-auto for button */
  .payment-link-minimalist.lg\:w-auto {
    width: 100% !important;
  }

  .payment-link-liquid {
    padding: 0.875rem 1.5rem !important;
    font-size: 0.925rem !important;
    min-height: 48px !important;
  }

  /* Payment row - mobile layout (column, centered) */
  .payment-row-container {
    padding: 0.5rem !important;
    gap: 1rem !important;
    flex-direction: column !important;
    align-items: center !important;
  }

  /* Override lg:flex-row to keep column layout */
  .payment-row-container.lg\:flex-row {
    flex-direction: column !important;
  }

  /* Override lg:items-center to use start for consistency */
  .payment-row-container.lg\:items-center {
    align-items: stretch !important;
  }

  /* Force mobile full width layout */
  .payment-row-container > div {
    width: 100% !important;
    max-width: 100% !important;
  }

  /* Override lg:w-auto */
  .payment-row-container > .lg\:w-auto {
    width: 100% !important;
  }

  /* Override lg:max-w-sm */
  .lg\:max-w-sm {
    max-width: 100% !important;
  }

  /* Text sizing - mobile */
  .text-lg {
    font-size: 1rem !important;
  }

  .text-base {
    font-size: 0.875rem !important;
  }

  .text-sm {
    font-size: 0.875rem !important;
  }

  .text-xs {
    font-size: 0.75rem !important;
  }

  .text-xl {
    font-size: 1.125rem !important; /* 18px */
  }

  /* Icons - mobile size */
  svg.w-5 {
    width: 1.125rem !important;
    height: 1.125rem !important;
  }

  svg.w-4 {
    width: 1rem !important;
    height: 1rem !important;
  }

  svg.w-12,
  svg.lg\:w-16 {
    width: 3rem !important;
    height: 3rem !important;
  }
}

/* Desktop refinements (1024px+) - Base laptop styles */
@media (min-width: 1024px) {
  .payment-method-section {
    /* No padding - matches comment section */
  }

  .payment-row-container {
    padding: 0.75rem;
    gap: 2rem;
  }

  .payment-info-simple {
    padding: 1.25rem;
  }

  .payment-info-glass {
    padding: 1.25rem;
  }

  .payment-link-minimalist {
    padding: 0.75rem 1.25rem;
    min-height: 40px;
  }

  .glass-content-section {
    padding: 0.75rem;
  }
}

/* Enhanced Khmer font rendering */
.khmer-text-fix {
  line-height: 1.8 !important;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
}

/* Small laptops 13-inch (1024px-1365px) - Compact sizes */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Header text - match AgendaSection */
  h2 {
    font-size: 1.5rem !important; /* 24px - text-2xl */
  }
}

/* Medium laptops 14-15 inch (1366px+) */
@media (min-width: 1366px) {
  h2 {
    font-size: 1.875rem !important; /* 30px - text-3xl */
  }
}
</style>
