<template>
  <div class="mb-4 sm:mb-5 laptop-sm:mb-5 laptop-md:mb-6 laptop-lg:mb-7 desktop:mb-6">
    <!-- Payment Section Header - First Payment Method Name + Type -->
    <h2 
      v-if="paymentMethods.length > 0"
      class="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 md:mb-5 text-center" 
      :style="{ 
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }"
    >
      {{ paymentMethods[0].name }} {{ paymentMethods[0].payment_type.charAt(0).toUpperCase() + paymentMethods[0].payment_type.slice(1) }}
    </h2>

    <!-- Liquid Glass Payment Container -->
    <div class="liquid-glass-container" :style="{ 
      backgroundColor: `${primaryColor}06`,
      boxShadow: `0 8px 32px -4px ${primaryColor}15, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
    }">
      <!-- Payment Methods -->
      <div v-for="method in paymentMethods" :key="method.id" class="payment-method-section mb-3">
        
        <!-- Collapsible Card Header - Always Visible -->
        <div 
          class="payment-card-header cursor-pointer transition-all duration-300 hover:scale-[1.01] rounded-2xl"
          :style="{
            background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}04)`,
            boxShadow: `0 2px 12px ${primaryColor}15`,
            backdropFilter: 'blur(12px)'
          }"
          @click="toggleCard(method)"
        >
          <div class="flex items-center justify-between p-3 sm:p-4">
            <!-- Method Info -->
            <div class="flex items-center space-x-4">
              <div class="p-3 rounded-2xl" :style="{ backgroundColor: `${primaryColor}15` }">
                <svg class="w-6 h-6" :style="{ color: primaryColor }" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v2H4V6zm0 4h12v4H4v-4z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-base sm:text-lg" 
                    :style="{ 
                      fontFamily: primaryFont || currentFont,
                      color: primaryColor
                    }">
                  {{ method.bank_name || method.name }}
                </h3>
                <div class="flex items-center space-x-2 text-sm mt-1" 
                     :style="{ color: primaryColor, opacity: '0.7' }">
                  <span v-if="method.currency">{{ method.currency }}</span>
                </div>
              </div>
            </div>
            
            <!-- Expand/Collapse Arrow -->
            <div class="transition-transform duration-300" :class="{ 'rotate-180': isCardExpanded(method) }">
              <svg class="w-6 h-6" :style="{ color: primaryColor, opacity: '0.7' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
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

          <!-- QR Code & Bank Info Section -->
          <div class="glass-content-section flex flex-col sm:flex-row items-start justify-center gap-6 mb-4">
            <!-- QR Code - Main Focal Point -->
            <div class="flex-shrink-0 text-center w-full sm:w-auto">
              <!-- QR Code exists -->
              <div v-if="method.qr_code_image" class="relative">
                <!-- Seamless QR container with depth -->
                <div class="qr-glass-container relative p-4 transition-all duration-300 hover:scale-[1.02] group"
                     :style="{ 
                       backgroundColor: `${primaryColor}08`,
                       boxShadow: `
                         0 12px 40px -8px ${primaryColor}25,
                         0 4px 16px -2px ${primaryColor}15,
                         inset 0 2px 4px rgba(255, 255, 255, 0.1),
                         inset 0 -1px 2px ${primaryColor}10
                       `
                     }">
                  <img 
                    :src="getMediaUrl(method.qr_code_image)" 
                    :alt="`QR Code for ${method.name}`"
                    class="w-36 h-36 sm:w-40 sm:h-40 mx-auto rounded-2xl shadow-md transition-all duration-300"
                    @error="onImageError"
                  />
                  <!-- Subtle scan line animation overlay -->
                  <div class="absolute inset-4 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                       :style="{ 
                         background: `linear-gradient(90deg, transparent 0%, ${primaryColor}20 50%, transparent 100%)`,
                         animation: 'scan-line 2s ease-in-out infinite'
                       }">
                  </div>
                </div>
                <p class="text-xs mt-3 font-medium tracking-wide" :style="{ color: primaryColor, opacity: '0.8' }">
                  Scan to pay instantly
                </p>
              </div>
              
              <!-- QR Code Fallback -->
              <div v-else class="relative">
                <!-- Seamless fallback container -->
                <div class="qr-glass-container relative p-4"
                     :style="{ 
                       backgroundColor: `${primaryColor}04`,
                       boxShadow: `
                         0 8px 24px -4px ${primaryColor}15,
                         inset 0 2px 4px rgba(255, 255, 255, 0.05),
                         inset 0 -1px 2px ${primaryColor}08
                       `,
                       border: `1px dashed ${primaryColor}20`
                     }">
                  <div class="w-36 h-36 sm:w-40 sm:h-40 mx-auto rounded-2xl flex items-center justify-center" 
                       :style="{ backgroundColor: `${primaryColor}05` }">
                    <div class="text-center">
                      <svg class="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2" :style="{ color: primaryColor, opacity: '0.4' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 4h4m0 0V2m0 2h2m0 0V2m0 2v2M2 2h4m16 0h4M6 18H4m0 0v2m0-2h2m0 0v2m0-2h2m8 0v2m-2-2h2m0 0h2"/>
                      </svg>
                      <div class="w-8 h-0.5 mx-auto rounded-full animate-pulse" :style="{ backgroundColor: `${primaryColor}40` }"></div>
                    </div>
                  </div>
                </div>
                <p class="text-sm mt-3 font-medium tracking-wide" :style="{ color: primaryColor, opacity: '0.6' }">
                  QR code coming soon
                </p>
              </div>
            </div>

            <!-- Bank Info - Integrated Panel -->
            <div v-if="hasVisibleBankInfo(method)" class="flex-shrink-0 w-full sm:w-auto sm:max-w-xs">
              <!-- Seamless bank info container -->
              <div class="bank-info-glass p-4 backdrop-blur-md transition-all duration-200"
                   :style="{ 
                     backgroundColor: `${primaryColor}06`, 
                     boxShadow: `
                       0 8px 32px -6px ${primaryColor}20,
                       0 2px 8px -1px ${primaryColor}10,
                       inset 0 1px 2px rgba(255, 255, 255, 0.08)
                     `
                   }">
                <div class="space-y-2">
                  <!-- Account Name -->
                  <div v-if="method.account_name" class="text-center sm:text-left">
                    <div class="bank-info-pill inline-flex items-center px-3 py-1.5 backdrop-blur-sm font-medium text-sm min-h-[32px]" 
                         :style="{ 
                           backgroundColor: `${primaryColor}08`, 
                           color: primaryColor,
                           opacity: '0.9',
                           boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 6px ${primaryColor}12`
                         }">
                      <svg class="w-4 h-4 mr-2 flex-shrink-0" :style="{ color: primaryColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      <span class="truncate">{{ method.account_name }}</span>
                    </div>
                  </div>

                  <!-- Account Number with improved copy UX -->
                  <div v-if="method.account_number" class="text-center sm:text-left">
                    <div class="bank-info-pill inline-flex items-center px-3 py-1.5 backdrop-blur-sm font-mono text-sm min-h-[32px] group cursor-pointer transition-all hover:shadow-lg" 
                         :style="{ 
                           backgroundColor: `${primaryColor}10`, 
                           color: primaryColor,
                           opacity: '0.9',
                           boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 6px ${primaryColor}12`
                         }"
                         @click="copyToClipboard(method.account_number!)"
                         title="Click to copy full account number">
                      <svg class="w-4 h-4 mr-2 flex-shrink-0" :style="{ color: primaryColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                      </svg>
                      <span class="truncate">•••• {{ method.account_number.slice(-4) }}</span>
                      <svg class="w-4 h-4 ml-2 flex-shrink-0 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Description (if exists, keep minimal) -->
          <div v-if="method.description" class="text-center mb-4 px-2">
            <p class="text-xs leading-relaxed" 
               :style="{ 
                 fontFamily: secondaryFont || currentFont,
                 color: primaryColor,
                 opacity: '0.6'
               }">
              {{ method.description }}
            </p>
          </div>

          <!-- Liquid Glass Payment Button -->
          <div class="text-center mt-4">
            <a 
              v-if="method.payment_url"
              :href="method.payment_url" 
              target="_blank" 
              rel="noopener noreferrer"
              class="payment-link-liquid group"
              :style="{ 
                fontFamily: primaryFont || currentFont,
                background: `linear-gradient(135deg, ${primaryColor}12, ${primaryColor}06)`,
                color: primaryColor,
                boxShadow: `
                  0 8px 32px -4px ${primaryColor}25,
                  0 4px 16px -2px ${primaryColor}15,
                  inset 0 2px 4px rgba(255, 255, 255, 0.1),
                  inset 0 -1px 2px ${primaryColor}10
                `
              }"
            >
              <div class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-2 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                <span class="font-semibold">Pay Directly</span>
                <svg class="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </div>
            </a>
            
            <!-- Liquid Glass Payment Fallback -->
            <div v-else class="payment-fallback inline-flex items-center px-4 py-2 text-sm font-medium opacity-50"
                 :style="{ 
                   backgroundColor: `${primaryColor}04`,
                   color: primaryColor,
                   border: `1px dashed ${primaryColor}20`,
                   boxShadow: `inset 0 1px 2px ${primaryColor}08`
                 }">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <span>Direct payment not available</span>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Payment Methods Message -->
    <div v-if="paymentMethods.length === 0" class="liquid-glass-container text-center py-8 sm:py-12" :style="{ 
      backgroundColor: `${primaryColor}04`,
      boxShadow: `0 8px 32px -4px ${primaryColor}10, inset 0 1px 0 rgba(255, 255, 255, 0.05)`
    }">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" :style="{ backgroundColor: `${primaryColor}20` }">
        <svg class="w-8 h-8" :style="{ color: primaryColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
        </svg>
      </div>
      <p class="text-base font-medium" :style="{ 
        fontFamily: secondaryFont || currentFont,
        color: primaryColor,
        opacity: '0.8'
      }">
        No payment methods available
      </p>
    </div>

    <!-- Section Endline -->
    <div class="flex justify-center mt-4">
      <div class="w-16 h-px opacity-30" :style="{ backgroundColor: primaryColor }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EventPaymentMethod } from '../../services/api'

interface Props {
  paymentMethods: EventPaymentMethod[]
  primaryColor: string
  secondaryColor?: string
  accentColor: string
  currentFont: string
  primaryFont: string
  secondaryFont: string
  getMediaUrl: (url: string) => string
}

const props = defineProps<Props>()

// State
const expandedCards = ref<Set<string>>(new Set())

// Computed
const paymentSectionTitle = computed(() => {
  const hasGifts = props.paymentMethods.some(m => m.payment_type === 'gift')
  const hasDonations = props.paymentMethods.some(m => m.payment_type === 'donation')
  const hasSponsorships = props.paymentMethods.some(m => m.payment_type === 'sponsorship')
  
  if (hasGifts && hasDonations) return 'Gifts & Donations'
  if (hasGifts) return 'Wedding Gifts'
  if (hasDonations) return 'Donations'
  if (hasSponsorships) return 'Sponsorships'
  return 'Support'
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
    // You could emit a success event here or show a toast
    console.log('Copied to clipboard:', text)
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

const onImageError = (event: Event) => {
  console.error('Failed to load QR code image:', event)
  // You could set a fallback or emit an error event
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

/* Payment method sections - Flowing divisions */
.payment-method-section {
  padding: 1.5rem 1rem;
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

/* QR Code glass container - Central focal point */
.qr-glass-container {
  border-radius: 2rem;
  backdrop-filter: blur(16px);
  position: relative;
  overflow: hidden;
}

.qr-glass-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  pointer-events: none;
}

/* Bank info glass panel - Integrated surface */
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

/* Liquid glass payment button */
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
  0%, 100% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    transform: translateX(0);
    opacity: 0.7;
  }
}

/* Glass content section - Unified spacing */
.glass-content-section {
  padding: 0.5rem;
}

/* Mobile-first responsive design */
@media (max-width: 639px) {
  .payment-method-section {
    padding: 1rem 0.75rem;
  }
  
  .qr-glass-container {
    padding: 1rem;
  }
  
  .bank-info-glass {
    padding: 0.75rem;
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
    padding: 1.25rem 1rem;
  }
  
  .payment-link-liquid {
    padding: 1rem 1.75rem;
    min-height: 50px;
  }
}

/* Collapsible card styles */
.payment-card-header {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.payment-card-header:hover {
  background: rgba(255, 255, 255, 0.08);
}

.payment-card-content {
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), 
              opacity 0.3s ease-in-out;
  will-change: max-height, opacity;
  transform-origin: top;
}

/* Desktop refinements */
@media (min-width: 1024px) {
  .payment-method-section {
    padding: 1.5rem 1.5rem;
  }
  
  .glass-content-section {
    padding: 0.75rem;
  }
}
</style>