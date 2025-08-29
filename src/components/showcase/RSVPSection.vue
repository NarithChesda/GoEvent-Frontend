<template>
  <div id="rsvp" class="mb-4 sm:mb-6 laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
    <!-- RSVP Section Header - Matching MainContentStage Welcome Header -->
    <div class="text-center py- laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
      <h1
        class="leading-relaxed py-2 text-lg sm:text-xl md:text-2xl font-semibold sm:mb-4 md:mb-6 uppercase"
        :style="{
          fontFamily: primaryFont || currentFont,
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }"
      >
        {{ rsvpHeaderText }}
      </h1>
    </div>

    <!-- Liquid Glass RSVP Container - Enhanced with Agenda Card Styling -->
    <div class="liquid-glass-container" :style="{
      backgroundColor: `${primaryColor}15`,
      boxShadow: `
        0 12px 36px -6px ${primaryColor}25,
        0 6px 24px -3px ${primaryColor}20,
        0 3px 12px -1px ${primaryColor}15,
        inset 0 1px 2px rgba(255, 255, 255, 0.12)
      `,
      border: `1px solid ${primaryColor}40`
    }">
      <!-- Collapsible Header -->
      <div class="rsvp-header cursor-pointer transition-all duration-300 hover:translateY(-1px)" @click="toggleRSVP" :style="{
        padding: '1rem 1.25rem'
      }">
        <div class="rsvp-header-content" :class="{ 'rsvp-header-content--expanded': isExpanded }">
          <!-- Mobile/Collapsed Layout -->
          <div v-if="!isExpanded" class="flex items-center justify-between w-full">
            <!-- Left: RSVP Title & Status -->
            <div class="flex items-center space-x-3">
              <h2 class="text-lg font-semibold" :style="{
                color: primaryColor,
                fontFamily: primaryFont || currentFont
              }">
                RSVP
              </h2>

              <!-- Compact Status Indicator -->
              <div v-if="rsvpStatus" class="flex items-center space-x-2">
                <div v-if="rsvpStatus === 'coming'" class="status-indicator" :style="{
                  background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
                  color: primaryColor
                }">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span class="text-xs font-medium" :style="{ fontFamily: secondaryFont || currentFont }">{{ rsvpAttendingText }} ({{ totalAttendees }})</span>
                </div>
                <div v-else-if="rsvpStatus === 'not_coming'" class="status-indicator" :style="{
                  background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(107, 114, 128, 0.1))',
                  color: '#6b7280'
                }">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  <span class="text-xs font-medium" :style="{ fontFamily: secondaryFont || currentFont }">{{ rsvpCantAttendText }}</span>
                </div>
              </div>

              <!-- Event Date (collapsed only) -->
              <div class="text-sm font-medium opacity-75" :style="{
                color: primaryColor,
                fontFamily: secondaryFont || currentFont
              }">
                {{ formatEventDateCompact }}
              </div>

              <!-- Event Status Badge (desktop only, collapsed only) -->
              <div class="hidden md:flex items-center">
                <div v-if="eventStatus === 'upcoming'" class="status-badge-compact" :style="{
                  background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08)`,
                  color: primaryColor,
                  boxShadow: `0 2px 8px ${primaryColor}20`
                }">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="font-medium text-xs">{{ timeLeft.days }}{{ rsvpDaysText }} {{ timeLeft.hours }}{{ rsvpHoursText }}</span>
                </div>
                <div v-else-if="eventStatus === 'ongoing'" class="status-badge-compact" :style="{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08))',
                  color: '#10b981',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                }">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"/>
                  </svg>
                  <span class="font-medium text-xs">{{ rsvpStatusLiveText }}</span>
                </div>
                <div v-else-if="eventStatus === 'ended'" class="status-badge-compact" :style="{
                  background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.15), rgba(107, 114, 128, 0.08))',
                  color: '#6b7280',
                  boxShadow: '0 2px 8px rgba(107, 114, 128, 0.2)'
                }">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="font-medium text-xs">{{ rsvpStatusEndedText }}</span>
                </div>
              </div>
            </div>

            <!-- Right: Expand/Collapse Icon -->
            <div class="expand-icon" :style="{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              color: primaryColor
            }">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>

          <!-- Expanded/Centered Layout -->
          <div v-else class="expanded-header-layout">
            <div class="flex items-center justify-center">
              <h2 class="text-xl font-bold" :style="{
                color: primaryColor,
                fontFamily: primaryFont || currentFont
              }">
                RSVP
              </h2>
            </div>

            <!-- Collapse Icon (positioned absolutely) -->
            <div class="expand-icon expand-icon--centered" :style="{
              transform: 'rotate(180deg)',
              color: primaryColor
            }">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Collapsible Content -->
      <div class="rsvp-content overflow-hidden transition-all duration-500 ease-in-out" :class="isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'">
        <!-- Event Info Header -->
        <div class="rsvp-section-tight">
          <div class="py-2">
          <!-- Event Header - Two Row Layout -->
          <div class="text-center space-y-2">
            <!-- Row 1: Event Date -->
            <div class="text-sm" :style="{
              color: primaryColor,
              fontFamily: primaryFont || currentFont
            }">
              {{ formatEventDate }}
            </div>

            <!-- Row 2: Time & Status Badge Group (Centered) -->
            <div class="flex items-center justify-center gap-2">
              <div class="text-sm opacity-80" :style="{
                color: primaryColor,
                fontFamily: secondaryFont || currentFont
              }">
                {{ formatEventTime }}
              </div>

              <div v-if="eventStatus === 'upcoming'" class="status-badge-compact" :style="{
                background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08)`,
                color: primaryColor,
                boxShadow: `0 2px 8px ${primaryColor}20`
              }">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="font-medium text-xs">{{ timeLeft.days }}{{ rsvpDaysText }} {{ timeLeft.hours }}{{ rsvpHoursText }}</span>
              </div>
              <div v-else-if="eventStatus === 'ongoing'" class="status-badge-compact" :style="{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.08))',
                color: '#10b981',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
              }">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"/>
                </svg>
                <span class="font-medium text-xs">{{ rsvpStatusLiveText }}</span>
              </div>
              <div v-else-if="eventStatus === 'ended'" class="status-badge-compact" :style="{
                background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.15), rgba(107, 114, 128, 0.08))',
                color: '#6b7280',
                boxShadow: '0 2px 8px rgba(107, 114, 128, 0.2)'
              }">
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="font-medium text-xs">{{ rsvpStatusEndedText }}</span>
              </div>
            </div>
          </div>
          </div>
        </div>

        <!-- Main RSVP Actions -->
        <div class="rsvp-section-tight">
        <!-- Sign In Prompt for Unauthenticated Users -->
        <div v-if="eventStatus !== 'ended' && !isUserAuthenticated" class="text-center py-2">
          <p class="text-sm mb-3" :style="{
            color: primaryColor,
            opacity: 0.8,
            fontFamily: secondaryFont || currentFont
          }">
            {{ rsvpSignInText }}
          </p>
          <button
            @click="handleSignInClick"
            class="liquid-glass-button group"
            :style="{
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
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
              </svg>
              <span class="font-semibold" :style="{ fontFamily: secondaryFont || currentFont }">{{ rsvpSignInButtonText }}</span>
            </div>
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="eventStatus !== 'ended' && isUserAuthenticated && isLoading" class="text-center py-3">
          <div class="animate-spin rounded-full h-6 w-6 mx-auto mb-2" :style="{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor, border: '2px solid' }"></div>
          <p class="text-xs font-medium" :style="{ color: primaryColor, opacity: 0.7 }">{{ rsvpLoadingStatusText }}</p>
        </div>

        <!-- RSVP Toggle Buttons (Authenticated Users) -->
        <div v-else-if="eventStatus !== 'ended' && isUserAuthenticated" class="flex justify-center gap-3 py-2 px-3">
          <!-- Yes Button -->
          <button
            @click="setRSVPStatus('coming')"
            :disabled="isSubmitting"
            class="liquid-glass-btn flex-1 min-w-0"
            :class="{
              'liquid-glass-btn--active': rsvpStatus === 'coming',
              'liquid-glass-btn--disabled': isSubmitting
            }"
            :style="{
              background: rsvpStatus === 'coming'
                ? `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}30)`
                : `linear-gradient(135deg, ${primaryColor}12, ${primaryColor}08)`,
              backdropFilter: rsvpStatus === 'coming' ? 'blur(20px) saturate(180%)' : 'blur(16px) saturate(120%)',
              boxShadow: rsvpStatus === 'coming'
                ? `
                  0 8px 32px ${primaryColor}35,
                  0 4px 16px ${primaryColor}25,
                  inset 0 2px 4px rgba(255, 255, 255, 0.25),
                  inset 0 -2px 4px ${primaryColor}20
                `
                : `
                  0 4px 16px ${primaryColor}15,
                  0 2px 8px ${primaryColor}10,
                  inset 0 1px 2px rgba(255, 255, 255, 0.1),
                  inset 0 -1px 2px ${primaryColor}08
                `,
              color: rsvpStatus === 'coming' ? '#ffffff' : primaryColor,
              border: rsvpStatus === 'coming'
                ? `1px solid rgba(255, 255, 255, 0.3)`
                : `1px solid ${primaryColor}20`
            }"
          >
            <span v-if="!isSubmitting || rsvpStatus !== 'coming'" class="font-semibold text-center leading-tight" :style="{ fontFamily: secondaryFont || currentFont }">
              {{ rsvpStatus === 'coming' ? rsvpAttendingText : rsvpYesButtonText }}
            </span>
            <span v-else class="flex items-center justify-center font-semibold">
              <div class="animate-spin rounded-full h-4 w-4 mr-2" :style="{ borderColor: 'rgba(255, 255, 255, 0.3)', borderTopColor: '#ffffff', border: '2px solid' }"></div>
              <span class="text-center leading-tight">{{ rsvpRegisteringText }}</span>
            </span>
          </button>

          <!-- No Button -->
          <button
            @click="setRSVPStatus('not_coming')"
            :disabled="isSubmitting"
            class="liquid-glass-btn flex-1 min-w-0"
            :class="{
              'liquid-glass-btn--active': rsvpStatus === 'not_coming',
              'liquid-glass-btn--disabled': isSubmitting
            }"
            :style="{
              background: rsvpStatus === 'not_coming'
                ? `linear-gradient(135deg, ${primaryColor}35, ${primaryColor}25)`
                : `linear-gradient(135deg, ${primaryColor}12, ${primaryColor}08)`,
              backdropFilter: rsvpStatus === 'not_coming' ? 'blur(20px) saturate(180%)' : 'blur(16px) saturate(120%)',
              boxShadow: rsvpStatus === 'not_coming'
                ? `
                  0 8px 32px ${primaryColor}30,
                  0 4px 16px ${primaryColor}20,
                  inset 0 2px 4px rgba(255, 255, 255, 0.2),
                  inset 0 -2px 4px ${primaryColor}15
                `
                : `
                  0 4px 16px ${primaryColor}15,
                  0 2px 8px ${primaryColor}10,
                  inset 0 1px 2px rgba(255, 255, 255, 0.1),
                  inset 0 -1px 2px ${primaryColor}08
                `,
              color: rsvpStatus === 'not_coming' ? '#ffffff' : primaryColor,
              border: rsvpStatus === 'not_coming'
                ? `1px solid rgba(255, 255, 255, 0.25)`
                : `1px solid ${primaryColor}20`
            }"
          >
            <span v-if="!isSubmitting || rsvpStatus !== 'not_coming'" class="font-semibold text-center leading-tight" :style="{ fontFamily: secondaryFont || currentFont }">
              {{ rsvpStatus === 'not_coming' ? rsvpCantAttendText : rsvpNoButtonText }}
            </span>
            <span v-else class="flex items-center justify-center font-semibold">
              <div class="animate-spin rounded-full h-4 w-4 mr-2" :style="{ borderColor: 'rgba(255, 255, 255, 0.3)', borderTopColor: '#ffffff', border: '2px solid' }"></div>
              <span class="text-center leading-tight">{{ rsvpUpdatingText }}</span>
            </span>
          </button>
        </div>
        </div>

        <!-- Guest Management Section -->
        <div v-if="rsvpStatus === 'coming'" class="rsvp-section-tight" @mouseleave="handleGuestCounterLeave">
          <div class="guest-management-container" :style="{
            background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}04)`,
            boxShadow: `0 4px 16px ${primaryColor}15, inset 0 1px 2px rgba(255, 255, 255, 0.08)`
          }">
          <!-- Guest Counter -->
          <div class="glass-content-section py-2">
            <!-- Guest Counter Label (centered) -->
            <div class="text-center mb-3">
              <span class="text-sm" :style="{
                color: primaryColor,
                fontFamily: primaryFont || currentFont
              }">
                {{ rsvpAdditionalGuestsText }}
              </span>
            </div>

            <!-- Guest Counter Controls (centered, matching RSVP buttons) -->
            <div class="flex items-center justify-center gap-4 mb-2">
              <button
                @click="decreaseGuestCount"
                :disabled="additionalGuests <= 0 || isUpdatingGuestCount"
                class="counter-btn"
                :style="{
                  background: `linear-gradient(135deg, ${primaryColor}12, ${primaryColor}06)`,
                  color: primaryColor,
                  boxShadow: `0 4px 16px -2px ${primaryColor}15, inset 0 1px 2px rgba(255, 255, 255, 0.08)`,
                  opacity: additionalGuests <= 0 || isUpdatingGuestCount ? '0.4' : '1'
                }"
              >
                −
              </button>

              <div class="text-2xl font-bold min-w-[3ch] text-center flex items-center justify-center" :style="{ color: primaryColor }">
                <span v-if="!isUpdatingGuestCount">{{ additionalGuests }}</span>
                <div v-else class="animate-spin rounded-full h-6 w-6" :style="{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor, border: '3px solid' }"></div>
              </div>

              <button
                @click="increaseGuestCount"
                :disabled="additionalGuests >= 10 || isUpdatingGuestCount"
                class="counter-btn"
                :style="{
                  background: `linear-gradient(135deg, ${primaryColor}12, ${primaryColor}06)`,
                  color: primaryColor,
                  boxShadow: `0 4px 16px -2px ${primaryColor}15, inset 0 1px 2px rgba(255, 255, 255, 0.08)`,
                  opacity: additionalGuests >= 10 || isUpdatingGuestCount ? '0.4' : '1'
                }"
              >
                +
              </button>
            </div>

            <!-- Total Summary -->
            <div class="text-center">
              <div class="total-summary-glass p-3" :style="{
                backgroundColor: `${primaryColor}06`,
                boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.08)`
              }">
                <span class="text-xs" :style="{
                  color: primaryColor,
                  fontFamily: secondaryFont || currentFont
                }">
                  {{ rsvpTotalAttendingText }}: {{ totalAttendees }} {{ getPersonUnitForTemplate(totalAttendees) }}
                </span>
              </div>

              <!-- Unsaved Changes Indicator & Manual Save -->
              <div v-if="hasUnsavedGuestChanges" class="mt-3 space-y-2">
                <div class="flex items-center justify-center gap-3">
                  <span class="text-xs font-medium" :style="{ color: primaryColor, opacity: '0.7' }">
                    • {{ rsvpUnsavedChangesText }}
                  </span>
                  <button
                    @click="saveGuestCountChanges"
                    :disabled="isUpdatingGuestCount"
                    class="save-btn"
                    :style="{
                      background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08)`,
                      color: primaryColor,
                      boxShadow: `0 2px 8px ${primaryColor}20, inset 0 1px 2px rgba(255, 255, 255, 0.1)`
                    }"
                  >
                    {{ isUpdatingGuestCount ? rsvpSavingText : rsvpSaveNowText }}
                  </button>
                </div>
                <span class="text-xs opacity-60" :style="{ color: primaryColor }">
                  {{ rsvpAutoSaveText }} {{ Math.ceil((guestCountUpdateTimeout ? 2.5 : 0)) }}{{ rsvpSecondsText }}
                </span>
              </div>

              <!-- Confirmation Code -->
              <div v-if="confirmationCode && !hasUnsavedGuestChanges" class="mt-3">
                <div class="confirmation-code-glass p-2" :style="{
                  backgroundColor: `${primaryColor}04`,
                  boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.05)`
                }">
                  <span class="text-xs font-mono opacity-80" :style="{ color: primaryColor }">
                    {{ rsvpConfirmationText }} {{ confirmationCode }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <!-- Status Message -->
        <div v-if="rsvpStatus === 'not_coming' && !successMessage" class="rsvp-section-tight">
          <div class="text-center py-2">
            <div class="status-message-glass p-4" :style="{
              backgroundColor: `${primaryColor}06`,
              boxShadow: `0 4px 16px ${primaryColor}12, inset 0 1px 2px rgba(255, 255, 255, 0.08)`
            }">
              <span class="text-base font-semibold" :style="{
                color: primaryColor,
                opacity: 0.9,
                fontFamily: primaryFont || currentFont
              }">
                {{ rsvpThankYouText }}
              </span>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="rsvp-section-tight">
          <div class="text-center py-2">
            <div class="success-message-glass p-4" :style="{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
            }">
              <div class="flex items-center justify-center mb-2">
                <svg class="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <p class="text-emerald-800 font-semibold">{{ successMessage }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="rsvp-section-tight">
          <div class="text-center py-2">
            <div class="error-message-glass p-4" :style="{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
            }">
              <div class="flex items-center justify-center mb-2">
                <svg class="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-red-800 font-semibold">{{ errorMessage }}</p>
              </div>
              <button
                @click="errorMessage = ''"
                class="text-red-600 hover:text-red-800 text-sm mt-1 underline font-medium"
              >
                {{ rsvpDismissText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { eventsService, type EventRegistration } from '../../services/api'
import type { EventText } from '../../composables/useEventShowcase'
import {
  translateRSVP,
  formatDateLocalized,
  formatTimeLocalized,
  getPersonUnit,
  type SupportedLanguage
} from '../../utils/translations'

interface Props {
  eventId: string
  eventStartDate?: string
  eventEndDate?: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  isEventPast?: boolean
  eventTexts?: EventText[]
  currentLanguage?: string
  currentFont?: string
  primaryFont?: string
  secondaryFont?: string
}

const props = defineProps<Props>()

// Router and Auth
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// State
const rsvpStatus = ref<'coming' | 'not_coming' | null>(null)
const additionalGuests = ref(0)
// const showConfirmationMessage = ref(false) // Unused

// Collapsible state
const isExpanded = ref(false)

// API Registration State
const currentRegistration = ref<EventRegistration | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const isUpdatingGuestCount = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Guest count save management
let guestCountUpdateTimeout: ReturnType<typeof setTimeout> | null = null
const hasUnsavedGuestChanges = ref(false)
const savedGuestCount = ref(0) // Track last saved count

// Countdown Timer State
const timeLeft = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
})

let countdownInterval: ReturnType<typeof setInterval> | null = null

// Computed Properties
// const showRSVPSection = computed(() => {
//   // Show RSVP section if event hasn't ended
//   return eventStatus.value !== 'ended'
// }) // Unused

const isUserAuthenticated = computed(() => {
  return authStore.isAuthenticated
})

const eventStatus = computed(() => {
  if (!props.eventStartDate || !props.eventEndDate) {
    return 'upcoming' // Default to upcoming if dates not available
  }

  const now = new Date()
  const startDate = new Date(props.eventStartDate)
  const endDate = new Date(props.eventEndDate)

  if (now >= endDate) return 'ended'
  if (now >= startDate && now < endDate) return 'ongoing'
  return 'upcoming'
})

const totalAttendees = computed(() => {
  return rsvpStatus.value === 'coming' ? 1 + additionalGuests.value : 0
})

const confirmationCode = computed(() => {
  return currentRegistration.value?.confirmation_code || null
})

const formatEventDate = computed(() => {
  if (!props.eventStartDate) return 'Date TBD'

  try {
    const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
    return formatDateLocalized(props.eventStartDate, 'long', currentLang)
  } catch {
    return props.eventStartDate
  }
})

const formatEventTime = computed(() => {
  if (!props.eventStartDate) return 'Time TBD'

  try {
    const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
    return formatTimeLocalized(props.eventStartDate, currentLang)
  } catch {
    return 'Time TBD'
  }
})

const formatEventDateCompact = computed(() => {
  if (!props.eventStartDate) return 'Date TBD'

  try {
    const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
    return formatDateLocalized(props.eventStartDate, 'compact', currentLang)
  } catch {
    return props.eventStartDate
  }
})

// const countdownLabel = computed(() => {
//   if (eventStatus.value === 'ongoing') return 'Event in progress'
//   if (eventStatus.value === 'ended') return 'Event has ended'
//   return 'Time remaining'
// }) // Unused

// Enhanced translation function that combines database content with frontend translations
const getTextContent = (textType: string, fallback = ''): string => {
  // First, try to get content from database (eventTexts)
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(text =>
      text.text_type === textType && text.language === props.currentLanguage
    )
    if (text?.content) {
      return text.content
    }
  }

  // Fallback to frontend translation system
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'

  // Map text types to translation keys
  const keyMap: Record<string, keyof typeof import('../../utils/translations').rsvpTranslations.en> = {
    'rsvp_header': 'rsvp_header',
    'rsvp_yes_button': 'rsvp_yes_button',
    'rsvp_no_button': 'rsvp_no_button',
    'rsvp_attending': 'rsvp_attending',
    'rsvp_cant_attend': 'rsvp_cant_attend',
    'rsvp_sign_in': 'rsvp_sign_in',
    'rsvp_sign_in_button': 'rsvp_sign_in_button',
    'rsvp_additional_guests': 'rsvp_additional_guests',
    'rsvp_total_attending': 'rsvp_total_attending',
    'rsvp_person': 'rsvp_person',
    'rsvp_people': 'rsvp_people',
    'rsvp_thank_you': 'rsvp_thank_you',
    'rsvp_status_live': 'rsvp_status_live',
    'rsvp_status_ended': 'rsvp_status_ended',
    'rsvp_loading_status': 'rsvp_loading_status',
    'rsvp_registering': 'rsvp_registering',
    'rsvp_updating': 'rsvp_updating',
    'rsvp_saving': 'rsvp_saving',
    'rsvp_unsaved_changes': 'rsvp_unsaved_changes',
    'rsvp_save_now': 'rsvp_save_now',
    'rsvp_auto_save': 'rsvp_auto_save',
    'rsvp_seconds': 'rsvp_seconds',
    'rsvp_days': 'rsvp_days',
    'rsvp_hours': 'rsvp_hours',
    'rsvp_confirmation': 'rsvp_confirmation',
    'rsvp_dismiss': 'rsvp_dismiss'
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

// RSVP-related text content computed properties
const rsvpHeaderText = computed(() =>
  getTextContent('rsvp_header', 'Will you attend our wedding?')
)

const rsvpYesButtonText = computed(() =>
  getTextContent('rsvp_yes_button', 'Yes, I\'ll attend')
)

const rsvpNoButtonText = computed(() =>
  getTextContent('rsvp_no_button', 'Can\'t attend')
)

const rsvpAttendingText = computed(() =>
  getTextContent('rsvp_attending', 'Attending')
)

const rsvpCantAttendText = computed(() =>
  getTextContent('rsvp_cant_attend', 'Can\'t attend')
)

const rsvpSignInText = computed(() =>
  getTextContent('rsvp_sign_in', 'Please sign in to RSVP for this event')
)

const rsvpSignInButtonText = computed(() =>
  getTextContent('rsvp_sign_in_button', 'Sign In to RSVP')
)

const rsvpAdditionalGuestsText = computed(() =>
  getTextContent('rsvp_additional_guests', 'Additional guests')
)

const rsvpTotalAttendingText = computed(() =>
  getTextContent('rsvp_total_attending', 'Total attending')
)

// Note: rsvp_person and rsvp_people are now handled by getPersonUnitForTemplate function

const rsvpThankYouText = computed(() =>
  getTextContent('rsvp_thank_you', 'Thank you for your response')
)

// Status messages
const rsvpStatusLiveText = computed(() =>
  getTextContent('rsvp_status_live', 'Live')
)

const rsvpStatusEndedText = computed(() =>
  getTextContent('rsvp_status_ended', 'Ended')
)

// Loading states
const rsvpLoadingStatusText = computed(() =>
  getTextContent('rsvp_loading_status', 'Loading your RSVP status...')
)

const rsvpRegisteringText = computed(() =>
  getTextContent('rsvp_registering', 'Registering...')
)

const rsvpUpdatingText = computed(() =>
  getTextContent('rsvp_updating', 'Updating...')
)

// Guest management
const rsvpUnsavedChangesText = computed(() =>
  getTextContent('rsvp_unsaved_changes', 'Unsaved changes')
)

const rsvpSaveNowText = computed(() =>
  getTextContent('rsvp_save_now', 'Save now')
)

const rsvpSavingText = computed(() =>
  getTextContent('rsvp_saving', 'Saving...')
)

const rsvpAutoSaveText = computed(() =>
  getTextContent('rsvp_auto_save', 'Auto-saves in')
)

const rsvpSecondsText = computed(() =>
  getTextContent('rsvp_seconds', 's')
)

// System messages
const rsvpConfirmationText = computed(() =>
  getTextContent('rsvp_confirmation', 'Confirmation:')
)

// Error handling
const rsvpDismissText = computed(() =>
  getTextContent('rsvp_dismiss', 'Dismiss')
)

// Countdown format
const rsvpDaysText = computed(() =>
  getTextContent('rsvp_days', 'd')
)

const rsvpHoursText = computed(() =>
  getTextContent('rsvp_hours', 'h')
)

// Note: Success message templates are now handled directly in the functions using translateRSVP

// Expose translation utilities for template use
const getPersonUnitForTemplate = (count: number) => {
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  return getPersonUnit(count, currentLang)
}

// Collapsible methods
const toggleRSVP = () => {
  isExpanded.value = !isExpanded.value
}

// API Methods
const loadCurrentRegistration = async () => {
  if (!authStore.isAuthenticated || !props.eventId) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await eventsService.getMyRegistration(props.eventId)

    if (response.success && response.data) {
      currentRegistration.value = response.data
      // Update UI state based on registration
      rsvpStatus.value = 'coming'
      additionalGuests.value = response.data.guest_count || 0
      // Initialize saved state
      savedGuestCount.value = response.data.guest_count || 0
      hasUnsavedGuestChanges.value = false
    } else {
      // User is not registered
      currentRegistration.value = null
      rsvpStatus.value = null
      additionalGuests.value = 0
      savedGuestCount.value = 0
      hasUnsavedGuestChanges.value = false
    }
  } catch (error) {
    console.error('Error loading registration:', error)
    currentRegistration.value = null
    rsvpStatus.value = null
    additionalGuests.value = 0
    savedGuestCount.value = 0
    hasUnsavedGuestChanges.value = false
  } finally {
    isLoading.value = false
  }
}

const submitRSVP = async (status: 'coming' | 'not_coming') => {
  if (!authStore.isAuthenticated || !props.eventId) return

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (status === 'coming') {
      // Register or update registration
      const response = await eventsService.rsvpForEvent(props.eventId, {
        guest_count: additionalGuests.value,
        notes: ''
      })

      if (response.success && response.data) {
        currentRegistration.value = response.data
        rsvpStatus.value = 'coming'
        const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
        const unit = getPersonUnit(response.data.total_attendees, currentLang)
        successMessage.value = translateRSVP('rsvp_registration_success', currentLang, {
          count: response.data.total_attendees,
          unit: unit
        })

        // Show success message temporarily
        setTimeout(() => {
          successMessage.value = ''
        }, 5000)
      } else {
        errorMessage.value = response.message || 'Failed to register for event'
      }
    } else {
      // Unregister from event
      if (currentRegistration.value) {
        const response = await eventsService.unregisterFromEvent(props.eventId)

        if (response.success) {
          currentRegistration.value = null
          rsvpStatus.value = 'not_coming'
          additionalGuests.value = 0
          const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
          successMessage.value = translateRSVP('rsvp_unregister_success', currentLang)

          // Show success message temporarily
          setTimeout(() => {
            successMessage.value = ''
          }, 5000)
        } else {
          errorMessage.value = response.message || 'Failed to cancel registration'
        }
      } else {
        // User wasn't registered, just update UI
        rsvpStatus.value = 'not_coming'
        const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
        successMessage.value = translateRSVP('rsvp_thank_you_simple', currentLang)

        setTimeout(() => {
          successMessage.value = ''
        }, 3000)
      }
    }
  } catch (error) {
    console.error('RSVP error:', error)
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

// Methods
const updateCountdown = () => {
  if (!props.eventStartDate) {
    timeLeft.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return
  }

  const now = new Date()
  const targetDate = new Date(props.eventStartDate)
  const timeDifference = targetDate.getTime() - now.getTime()

  if (timeDifference <= 0) {
    // Event has started or passed
    timeLeft.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    if (countdownInterval) {
      window.clearInterval(countdownInterval)
      countdownInterval = null
    }
    return
  }

  const newTimeLeft = {
    days: Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((timeDifference % (1000 * 60)) / 1000)
  }

  timeLeft.value = newTimeLeft
}

const handleSignInClick = () => {
  // Store the current route with hash for RSVP section
  // Remove any existing hash first, then add the desired hash
  const currentPathWithoutHash = route.fullPath.split('#')[0]
  const currentPath = currentPathWithoutHash + '#rsvp'

  // Navigate to sign-in with redirect parameter
  router.push({
    path: '/signin',
    query: { redirect: currentPath }
  })
}

const setRSVPStatus = async (status: 'coming' | 'not_coming') => {
  // Check authentication for "attending" status (fallback, should not be needed with new UI)
  if (status === 'coming' && !authStore.isAuthenticated) {
    handleSignInClick()
    return
  }

  // Call API to save RSVP
  await submitRSVP(status)
}

const updateGuestCountInAPI = async () => {
  // Only update if user is registered and authenticated
  if (!currentRegistration.value || !authStore.isAuthenticated || isSubmitting.value) {
    return
  }

  isUpdatingGuestCount.value = true

  try {
    // Update registration with new guest count
    const response = await eventsService.rsvpForEvent(props.eventId, {
      guest_count: additionalGuests.value,
      notes: currentRegistration.value.notes || ''
    })

    if (response.success && response.data) {
      // Update the current registration data
      currentRegistration.value = response.data
      // Mark as saved
      savedGuestCount.value = additionalGuests.value
      hasUnsavedGuestChanges.value = false

      // Show brief success feedback
      const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
      const unit = getPersonUnit(response.data.total_attendees, currentLang)
      successMessage.value = translateRSVP('rsvp_guest_update_success', currentLang, {
        count: response.data.total_attendees,
        unit: unit
      })
      setTimeout(() => {
        successMessage.value = ''
      }, 2000)
    }
  } catch (error) {
    console.error('Error updating guest count:', error)
    // Show error for manual saves
    errorMessage.value = 'Failed to update guest count. Please try again.'
  } finally {
    isUpdatingGuestCount.value = false
  }
}

const saveGuestCountChanges = async () => {
  // Only save if there are actual changes
  if (!hasUnsavedGuestChanges.value || additionalGuests.value === savedGuestCount.value) {
    return
  }

  await updateGuestCountInAPI()
}

const debouncedUpdateGuestCount = () => {
  // Mark as having unsaved changes
  hasUnsavedGuestChanges.value = true

  // Clear existing timeout
  if (guestCountUpdateTimeout) {
    clearTimeout(guestCountUpdateTimeout)
  }

  // Set new timeout for debounced update (longer delay)
  guestCountUpdateTimeout = setTimeout(() => {
    saveGuestCountChanges()
  }, 2500) // Wait 2.5 seconds after last change
}

const increaseGuestCount = () => {
  if (additionalGuests.value < 10) { // Max 10 additional guests
    additionalGuests.value++
    // Debounced auto-save if user is already registered
    if (currentRegistration.value) {
      debouncedUpdateGuestCount()
    }
  }
}

const decreaseGuestCount = () => {
  if (additionalGuests.value > 0) {
    additionalGuests.value--
    // Debounced auto-save if user is already registered
    if (currentRegistration.value) {
      debouncedUpdateGuestCount()
    }
  }
}

// Smart save triggers
const handleGuestCounterLeave = () => {
  // Save when user moves mouse away from guest counter
  if (hasUnsavedGuestChanges.value && !isUpdatingGuestCount.value) {
    saveGuestCountChanges()
  }
}

// Save before page navigation/reload
const handleBeforeUnload = () => {
  if (hasUnsavedGuestChanges.value && !isUpdatingGuestCount.value) {
    // For synchronous save on page unload
    navigator.sendBeacon?.('/api/events/' + props.eventId + '/rsvp/', JSON.stringify({
      guest_count: additionalGuests.value,
      notes: currentRegistration.value?.notes || ''
    }))
  }
}

// const hexToRgb = (hex: string): string => {
//   // Remove # if present
//   hex = hex.replace('#', '')
//
//   // Parse hex to RGB
//   const r = parseInt(hex.substr(0, 2), 16)
//   const g = parseInt(hex.substr(2, 2), 16)
//   const b = parseInt(hex.substr(4, 2), 16)
//
//   return `${r}, ${g}, ${b}`
// } // Unused

// Watchers
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    // User logged in, load their registration status
    loadCurrentRegistration()
  } else {
    // User logged out, clear registration state
    currentRegistration.value = null
    rsvpStatus.value = null
    additionalGuests.value = 0
  }
})

// Lifecycle
onMounted(() => {
  // Initial countdown update
  updateCountdown()

  // Set up interval for upcoming events
  if (props.eventStartDate && eventStatus.value === 'upcoming') {
    countdownInterval = window.setInterval(() => {
      updateCountdown()
    }, 1000)
  }

  // Load current registration if user is authenticated
  if (authStore.isAuthenticated) {
    loadCurrentRegistration()
  }

  // Add beforeunload listener for unsaved changes
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  if (countdownInterval) {
    window.clearInterval(countdownInterval)
  }

  // Clear guest count update timeout
  if (guestCountUpdateTimeout) {
    clearTimeout(guestCountUpdateTimeout)
  }

  // Remove beforeunload listener
  window.removeEventListener('beforeunload', handleBeforeUnload)

  // Save any pending changes before component unmounts
  if (hasUnsavedGuestChanges.value && !isUpdatingGuestCount.value) {
    // Quick save attempt
    saveGuestCountChanges()
  }
})
</script>

<style scoped>
/* Liquid Glass Container - Enhanced unified surface with agenda card styling */
.liquid-glass-container {
  border-radius: 1.5rem;
  overflow: hidden;
  backdrop-filter: blur(16px);
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.liquid-glass-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
  pointer-events: none;
}

/* RSVP Header - Enhanced collapsible trigger */
.rsvp-header {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.rsvp-header:hover {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.rsvp-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

/* Status Indicator */
.status-indicator {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Expand/Collapse Icon */
.expand-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.7;
}

.rsvp-header:hover .expand-icon {
  opacity: 1;
}

/* Header Content Layouts */
.rsvp-header-content {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.rsvp-header-content--expanded {
  /* Additional styling for expanded state if needed */
}

/* Expanded Header Layout */
.expanded-header-layout {
  position: relative;
  text-align: center;
}

/* Centered expand icon for expanded state */
.expand-icon--centered {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%) rotate(180deg);
  opacity: 0.8;
}

.rsvp-header:hover .expand-icon--centered {
  opacity: 1;
}

/* Enhanced collapsible content - matching agenda section animation */
.rsvp-content {
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.3s ease-in-out;
  will-change: max-height, opacity;
  transform-origin: top;
}

/* RSVP Sections - Flowing divisions */
.rsvp-section {
  padding: 1.5rem 1rem;
  position: relative;
}

.rsvp-section:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

/* Tight RSVP sections for minimal spacing */
.rsvp-section-tight {
  padding: 0.5rem 1rem;
  position: relative;
}

.rsvp-section-tight:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
}

/* Compact RSVP sections for reduced spacing */
.rsvp-section-compact {
  padding: 0.75rem 1rem;
  position: relative;
}

.rsvp-section-compact:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
}

/* Status badge - compact version for top right */
.status-badge-compact {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  backdrop-filter: blur(12px);
  position: relative;
  white-space: nowrap;
}

.status-badge-compact::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  pointer-events: none;
}

/* Apple-inspired Liquid Glass Buttons */
.liquid-glass-btn {
  padding: 0.875rem 1rem;
  border-radius: 1.25rem;
  font-weight: 600;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid;
  min-height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  word-wrap: break-word;
  hyphens: auto;
}

/* Add subtle glass reflection */
.liquid-glass-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%);
  pointer-events: none;
  border-radius: inherit;
}

/* Active state - crisp and bright */
.liquid-glass-btn--active {
  transform: translateY(-1px);
}

/* Inactive state - softened with blur */
.liquid-glass-btn:not(.liquid-glass-btn--active) {
  opacity: 0.85;
}

/* Hover interactions with subtle glow */
.liquid-glass-btn:not(.liquid-glass-btn--disabled):hover {
  transform: translateY(-2px) scale(1.02);
  backdrop-filter: blur(20px) saturate(200%);
  -webkit-backdrop-filter: blur(20px) saturate(200%);
}

/* Active interactions with enhanced glow */
.liquid-glass-btn:not(.liquid-glass-btn--disabled):active {
  transform: translateY(0) scale(0.98);
  transition: transform 0.1s ease;
}

/* Disabled state with reduced opacity */
.liquid-glass-btn--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* Enhanced hover effect for active buttons */
.liquid-glass-btn--active:not(.liquid-glass-btn--disabled):hover {
  backdrop-filter: blur(24px) saturate(220%);
  -webkit-backdrop-filter: blur(24px) saturate(220%);
}

/* Compact RSVP Toggle Switch */
.rsvp-toggle-compact {
  display: flex;
  border-radius: 0.75rem;
  padding: 0.125rem;
  backdrop-filter: blur(10px);
  position: relative;
  width: 4.5rem;
}

.rsvp-toggle-compact::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  pointer-events: none;
}

.rsvp-toggle-option-compact {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.625rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  position: relative;
  min-height: 2rem;
  width: 2rem;
}

.rsvp-toggle-option-compact:hover {
  transform: translateY(-0.5px) scale(1.05);
}

.rsvp-toggle-option-compact:active {
  transform: translateY(0) scale(0.98);
  transition: transform 0.1s ease;
}

.rsvp-toggle-option-compact:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}



/* Guest management container */
.guest-management-container {
  border-radius: 1.5rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  position: relative;
  padding: 0.5rem;
}

.guest-management-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
  pointer-events: none;
}


/* Liquid glass buttons */
.liquid-glass-button {
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
  border: none;
  cursor: pointer;
}

.liquid-glass-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  pointer-events: none;
}

.liquid-glass-button::after {
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

.liquid-glass-button:hover::after {
  left: 100%;
}

.liquid-glass-button:hover {
  transform: translateY(-2px);
  backdrop-filter: blur(20px);
}

.liquid-glass-button:active {
  transform: translateY(-1px);
  transition: transform 0.1s ease;
}

/* Counter buttons */
.counter-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(12px);
  position: relative;
}

.counter-btn:hover {
  transform: translateY(-1px) scale(1.05);
}

.counter-btn:active {
  transform: translateY(0) scale(0.98);
}

/* Save button */
.save-btn {
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.save-btn:hover {
  transform: translateY(-1px);
}

/* Glass content sections */
.glass-content-section {
  padding: 0.5rem;
}

/* Status message containers */
.total-summary-glass,
.confirmation-code-glass,
.status-message-glass,
.success-message-glass,
.error-message-glass {
  border-radius: 1rem;
  backdrop-filter: blur(12px);
  position: relative;
}

.total-summary-glass::before,
.confirmation-code-glass::before,
.status-message-glass::before,
.success-message-glass::before,
.error-message-glass::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
  pointer-events: none;
}

/* Mobile-first responsive design */
@media (max-width: 639px) {
  .rsvp-section {
    padding: 1rem 0.75rem;
  }

  .rsvp-section-tight {
    padding: 0.375rem 0.75rem;
  }

  .rsvp-section-compact {
    padding: 0.5rem 0.75rem;
  }


  .liquid-glass-button {
    padding: 0.875rem 1.5rem;
    font-size: 0.925rem;
    min-height: 48px;
  }

  .counter-btn {
    width: 2.25rem;
    height: 2.25rem;
    font-size: 1.1rem;
  }

  .rsvp-toggle-compact {
    width: 4rem;
    padding: 0.1rem;
  }

  .rsvp-toggle-option-compact {
    padding: 0.375rem;
    min-height: 1.75rem;
    width: 1.75rem;
  }

  .liquid-glass-btn {
    padding: 0.75rem 0.875rem;
    font-size: 0.875rem;
    border-radius: 1rem;
    min-height: 3rem;
  }
}

/* Tablet adjustments */
@media (min-width: 640px) and (max-width: 1023px) {
  .rsvp-section {
    padding: 1.25rem 1rem;
  }

  .rsvp-section-tight {
    padding: 0.5rem 1rem;
  }

  .rsvp-section-compact {
    padding: 0.625rem 1rem;
  }

  .liquid-glass-button {
    padding: 1rem 1.75rem;
    min-height: 50px;
  }

  .liquid-glass-btn {
    padding: 0.875rem 1rem;
    min-height: 3.25rem;
  }
}

/* Desktop refinements */
@media (min-width: 1024px) {
  .rsvp-section {
    padding: 1.5rem 1.5rem;
  }

  .rsvp-section-tight {
    padding: 0.5rem 1.5rem;
  }

  .rsvp-section-compact {
    padding: 0.75rem 1.5rem;
  }

  .glass-content-section {
    padding: 0.75rem;
  }
}
</style>
