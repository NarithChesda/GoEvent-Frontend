<template>
  <div class="dress-code-section mb-4 sm:mb-5 laptop-sm:mb-5 laptop-md:mb-6 laptop-lg:mb-7 desktop:mb-6">
    <!-- Section Header -->
    <div class="section-header text-center laptop-sm:mb-3 laptop-md:mb-4 laptop-lg:mb-5 desktop:mb-8 laptop-sm:-mt-2 laptop-md:-mt-2 laptop-lg:-mt-3">
      <h2
        :style="{
          color: primaryColor,
          fontFamily: primaryFont || currentFont,
        }"
        class="leading-tight text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-regular sm:mb-4 md:mb-6 capitalize dress-code-header"
        :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
      >
        {{ sectionTitle }}
      </h2>
      <p
        v-if="sectionDescription"
        :style="{
          color: accentColor,
          fontFamily: secondaryFont || currentFont,
        }"
        class="text-sm sm:text-base opacity-80"
        :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
      >
        {{ sectionDescription }}
      </p>
    </div>

    <!-- Time Period Tabs -->
    <div
      v-if="timePeriodGroups.length > 1"
      class="time-period-tabs flex justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 flex-wrap"
    >
      <button
        v-for="(timePeriod, index) in timePeriodGroups"
        :key="timePeriod.time_period"
        @click="activeTimePeriod = index"
        :class="[
          'time-tab px-5 sm:px-7 py-2.5 sm:py-3 rounded-full transition-all duration-300',
          'text-sm sm:text-base font-semibold',
          activeTimePeriod === index ? 'tab-active' : 'tab-inactive',
        ]"
        :style="getTimePeriodTabStyle(index)"
      >
        {{ translateTimePeriod(timePeriod.time_period) }}
      </button>
    </div>

    <!-- Gender Cards - Vertical Stack -->
    <transition name="fade" mode="out-in">
      <div :key="activeTimePeriod" class="gender-cards-container">
        <div class="cards-vertical-stack">
          <div
            v-for="genderGroup in currentTimePeriodGenders"
            :key="genderGroup.gender"
            class="gender-card-wrapper"
          >
            <!-- Gender Card -->
            <div
              class="gender-card rounded-3xl overflow-hidden backdrop-blur-sm shadow-lg"
              :style="getGenderCardStyle(genderGroup)"
            >
              <!-- Gender Header -->
              <div class="gender-header py-2 sm:py-2.5 px-6 text-center" :style="getGenderHeaderStyle(genderGroup)">
                <h3
                  :style="{
                    fontFamily: primaryFont || currentFont,
                  }"
                  class="text-sm sm:text-base font-regular text-white gender-header-text"
                  :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
                >
                  {{ translateGender(genderGroup.gender) }}
                </h3>
              </div>

              <!-- Card Content -->
              <div class="card-body p-6 sm:p-8">
                <transition name="fade-scale" mode="out-in">
                  <div :key="genderGroup.activeIndex" class="dress-code-content">
                    <!-- Image or Color Display -->
                    <div class="image-wrapper mb-6 flex justify-center">
                      <div
                        v-if="getCurrentDressCode(genderGroup).image"
                        class="image-container w-full aspect-[3/4] max-w-xs rounded-2xl overflow-hidden shadow-md"
                        :style="{ backgroundColor: `${getCurrentDressCode(genderGroup).color}20` }"
                      >
                        <img
                          :src="getMediaUrl(getCurrentDressCode(genderGroup).image)"
                          :alt="getCurrentDressCode(genderGroup).dress_code_type_display"
                          class="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <!-- Color Display (if no image) -->
                      <div
                        v-else
                        class="color-display w-full aspect-[3/4] max-w-xs rounded-2xl flex items-center justify-center shadow-md"
                        :style="{ backgroundColor: getCurrentDressCode(genderGroup).color }"
                      >
                        <svg
                          class="w-24 h-24 sm:w-32 sm:h-32 text-white opacity-30"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    </div>

                    <!-- Dress Code Info -->
                    <div
                      class="dress-code-info text-center"
                      :class="{ 'mb-6': genderGroup.codes.length > 1 }"
                    >
                      <h4
                        :style="{
                          color: primaryColor,
                          fontFamily: primaryFont || currentFont,
                        }"
                        class="text-sm sm:text-base font-regular mb-3 dress-code-title"
                        :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
                      >
                        {{ getCurrentDressCode(genderGroup).title || translateDressCodeType(getCurrentDressCode(genderGroup).dress_code_type) }}
                      </h4>

                      <p
                        v-if="getCurrentDressCode(genderGroup).description"
                        :style="{
                          color: accentColor,
                          fontFamily: secondaryFont || currentFont,
                        }"
                        class="text-xs sm:text-sm opacity-80 leading-relaxed dress-code-description"
                        :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
                      >
                        {{ getCurrentDressCode(genderGroup).description }}
                      </p>
                    </div>

                    <!-- Color Circle Navigation -->
                    <div v-if="genderGroup.codes.length > 1" class="color-navigation flex justify-center gap-3">
                      <button
                        v-for="(code, index) in genderGroup.codes"
                        :key="code.id"
                        @click="selectDressCode(genderGroup, index)"
                        :class="[
                          'color-circle w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-300',
                          'border-2 shadow-md hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
                          genderGroup.activeIndex === index ? 'ring-2 ring-offset-2 scale-110' : 'opacity-60 hover:opacity-100',
                        ]"
                        :style="{
                          backgroundColor: code.color,
                          borderColor: genderGroup.activeIndex === index ? code.color : 'transparent',
                          ringColor: code.color,
                        }"
                        :aria-label="`View ${code.dress_code_type_display}`"
                      >
                        <!-- Active indicator -->
                        <span
                          v-if="genderGroup.activeIndex === index"
                          class="inline-block w-3 h-3 bg-white rounded-full"
                        ></span>
                      </button>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import type { DressCode } from '../../types/showcase'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'

interface Props {
  dressCodes: DressCode[]
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: any[]
  currentLanguage?: string
  getMediaUrl: (url: string) => string
}

const props = defineProps<Props>()

interface GenderGroup {
  gender: string
  gender_display: string
  codes: DressCode[]
  activeIndex: number
}

interface TimePeriodGroup {
  time_period: string
  time_period_display: string
  genderGroups: GenderGroup[]
}

const activeTimePeriod = ref(0)

// Get section title from event texts or use default
const sectionTitle = computed(() => {
  const titleText = props.eventTexts?.find(
    (t) => t.text_type === 'dress_code_header' && t.language === props.currentLanguage,
  )
  return titleText?.content || translateRSVP('dress_code_header', props.currentLanguage as SupportedLanguage)
})

// Get section description from event texts
const sectionDescription = computed(() => {
  const descText = props.eventTexts?.find(
    (t) => t.text_type === 'dress_code_description' && t.language === props.currentLanguage,
  )
  return descText?.content || translateRSVP('dress_code_description', props.currentLanguage as SupportedLanguage)
})

// Helper function to translate dress code type
const translateDressCodeType = (dressCodeType: string): string => {
  const typeMap: Record<string, keyof typeof import('../../utils/translations').rsvpTranslations.en> = {
    white_tie: 'dress_code_white_tie',
    black_tie: 'dress_code_black_tie',
    black_tie_optional: 'dress_code_black_tie_optional',
    formal: 'dress_code_formal',
    cocktail: 'dress_code_cocktail',
    semi_formal: 'dress_code_semi_formal',
    business_formal: 'dress_code_business_formal',
    business_casual: 'dress_code_business_casual',
    smart_casual: 'dress_code_smart_casual',
    casual: 'dress_code_casual',
    beach_formal: 'dress_code_beach_formal',
    beach_casual: 'dress_code_beach_casual',
    festive: 'dress_code_festive',
    traditional: 'dress_code_traditional',
    themed: 'dress_code_themed',
    custom: 'dress_code_custom',
  }
  const key = typeMap[dressCodeType]
  return key ? translateRSVP(key, props.currentLanguage as SupportedLanguage) : dressCodeType
}

// Helper function to translate time period
const translateTimePeriod = (timePeriod: string): string => {
  const periodMap: Record<string, keyof typeof import('../../utils/translations').rsvpTranslations.en> = {
    all_day: 'time_period_all_day',
    morning: 'time_period_morning',
    afternoon: 'time_period_afternoon',
    evening: 'time_period_evening',
    night: 'time_period_night',
  }
  const key = periodMap[timePeriod]
  return key ? translateRSVP(key, props.currentLanguage as SupportedLanguage) : timePeriod
}

// Helper function to translate gender
const translateGender = (gender: string): string => {
  const genderMap: Record<string, keyof typeof import('../../utils/translations').rsvpTranslations.en> = {
    all: 'gender_all',
    male: 'gender_male',
    female: 'gender_female',
  }
  const key = genderMap[gender]
  return key ? translateRSVP(key, props.currentLanguage as SupportedLanguage) : gender
}

// Group dress codes by time period, then by gender
const timePeriodGroups = computed<TimePeriodGroup[]>(() => {
  const timePeriodMap = new Map<string, TimePeriodGroup>()

  props.dressCodes
    .filter((dc) => dc.is_active)
    .sort((a, b) => a.order - b.order)
    .forEach((dc) => {
      // Create time period group if it doesn't exist
      if (!timePeriodMap.has(dc.time_period)) {
        timePeriodMap.set(dc.time_period, {
          time_period: dc.time_period,
          time_period_display: dc.time_period_display,
          genderGroups: [],
        })
      }

      const timePeriodGroup = timePeriodMap.get(dc.time_period)!

      // Find or create gender group within this time period
      let genderGroup = timePeriodGroup.genderGroups.find((g) => g.gender === dc.gender)
      if (!genderGroup) {
        genderGroup = reactive({
          gender: dc.gender,
          gender_display: dc.gender_display,
          codes: [],
          activeIndex: 0,
        })
        timePeriodGroup.genderGroups.push(genderGroup)
      }

      genderGroup.codes.push(dc)
    })

  return Array.from(timePeriodMap.values())
})

// Get gender groups for the current active time period
const currentTimePeriodGenders = computed(() => {
  if (timePeriodGroups.value.length === 0) return []
  return timePeriodGroups.value[activeTimePeriod.value]?.genderGroups || []
})

// Get current active dress code for a gender group
const getCurrentDressCode = (genderGroup: GenderGroup): DressCode => {
  return genderGroup.codes[genderGroup.activeIndex] || genderGroup.codes[0]
}

// Select a dress code within a gender group
const selectDressCode = (genderGroup: GenderGroup, index: number) => {
  genderGroup.activeIndex = index
}

// Style helpers
const getTimePeriodTabStyle = (index: number) => {
  const isActive = activeTimePeriod.value === index
  return {
    backgroundColor: isActive ? props.primaryColor : `${props.primaryColor}10`,
    color: isActive ? '#ffffff' : props.primaryColor,
    fontFamily: props.primaryFont || props.currentFont,
    transform: isActive ? 'scale(1.05)' : 'scale(1)',
    boxShadow: isActive ? `0 4px 12px ${props.primaryColor}30` : 'none',
  }
}

const getGenderCardStyle = (genderGroup: GenderGroup) => {
  const currentCode = getCurrentDressCode(genderGroup)
  return {
    backgroundColor: `${currentCode.color}05`,
    border: `2px solid ${currentCode.color}20`,
  }
}

const getGenderHeaderStyle = (genderGroup: GenderGroup) => {
  const currentCode = getCurrentDressCode(genderGroup)
  return {
    backgroundColor: currentCode.color,
  }
}
</script>

<style scoped>
.dress-code-section {
  width: 100%;
  max-width: 100%;
}

/* Enhanced Khmer font rendering */
.khmer-text-fix {
  line-height: 1.8 !important;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
  /* Safari-specific: Prevent breaking Khmer characters */
  word-break: keep-all !important;
  overflow-wrap: anywhere !important;
  hyphens: none !important;
  -webkit-hyphens: none !important;
}

.time-tab {
  cursor: pointer;
  border: none;
  outline: none;
  white-space: nowrap;
}

.time-tab:hover {
  transform: scale(1.05) !important;
}

.time-tab:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Vertical Stack Layout - Same for Mobile and Desktop */
.gender-cards-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.cards-vertical-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  width: 100%;
  max-width: 500px;
}

.gender-card-wrapper {
  width: 100%;
}

.gender-card {
  transition: all 0.4s ease;
}

.gender-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.image-container img {
  transition: transform 0.4s ease;
}

.gender-card:hover .image-container img {
  transform: scale(1.05);
}

.color-display {
  transition: transform 0.4s ease;
}

.gender-card:hover .color-display {
  transform: scale(1.02);
}

.color-circle {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.color-circle:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}

/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

/* Small laptops 13-inch (laptop-sm: 1024px) - Scaled to 77.625% (67.5% * 1.15) */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Header text - scaled to 77.625% from mobile md:text-3xl (1.875rem) */
  .dress-code-header {
    font-size: 1.45546875rem !important; /* 1.875rem * 0.77625 - increased by 15% */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.388125rem !important; /* 0.5rem * 0.77625 (py-2) */
    margin-bottom: 0.582rem !important; /* 0.75rem * 0.77625 from md:mb-6 - reduced by 50% */
  }

  /* Time period tabs - scaled to 77.625% from mobile */
  .time-period-tabs {
    margin-bottom: 1.164375rem !important; /* 1.5rem * 0.77625 - increased by 15% */
    gap: 0.58218750rem; /* 0.75rem * 0.77625 - increased by 15% */
  }

  .time-tab {
    padding: 0.48515625rem 0.97031250rem !important; /* 0.625rem * 0.77625, 1.25rem * 0.77625 - increased by 15% */
    border-radius: 0.58218750rem; /* 0.75rem * 0.77625 - increased by 15% */
    font-size: 0.67968750rem !important; /* 0.875rem * 0.77625 - increased by 15% */
  }

  /* Gender header text - scaled to 77.625% from mobile sm:text-base (1rem) */
  .gender-header-text {
    font-size: 0.77625rem !important; /* 1rem * 0.77625 */
  }

  /* Gender header padding - scaled to 77.625% */
  .gender-header {
    padding-top: 0.388125rem !important; /* 0.5rem * 0.77625 (py-2) */
    padding-bottom: 0.48515625rem !important; /* 0.625rem * 0.77625 (py-2.5) */
    padding-left: 1.164375rem !important; /* 1.5rem * 0.77625 (px-6) */
    padding-right: 1.164375rem !important; /* 1.5rem * 0.77625 (px-6) */
  }

  /* Card body padding - scaled to 77.625% */
  .card-body {
    padding: 1.164375rem !important; /* 1.5rem * 0.77625 (p-6) */
  }

  /* Dress code title - scaled to 77.625% from mobile sm:text-base (1rem) */
  .dress-code-title {
    font-size: 0.77625rem !important; /* 1rem * 0.77625 */
    margin-bottom: 0.582rem !important; /* 0.75rem * 0.77625 (mb-3) */
  }

  /* Dress code description - scaled to 77.625% from mobile sm:text-sm (0.875rem) */
  .dress-code-description {
    font-size: 0.67921875rem !important; /* 0.875rem * 0.77625 */
  }

  /* Dress code info margin - scaled to 77.625% - only when color navigation exists */
  .dress-code-info.mb-6 {
    margin-bottom: 1.164375rem !important; /* 1.5rem * 0.77625 (mb-6) */
  }
}

/* Medium laptops 14-15 inch (laptop-md: 1366px+) - Scaled to 86.25% (75% * 1.15) */
@media (min-width: 1366px) and (max-width: 1535px) {
  /* Header text - scaled to 86.25% from mobile md:text-3xl (1.875rem) */
  .dress-code-header {
    font-size: 1.61718750rem !important; /* 1.875rem * 0.8625 - increased by 15% */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.43125rem !important; /* 0.5rem * 0.8625 (py-2) */
    margin-bottom: 0.647rem !important; /* 0.75rem * 0.8625 from md:mb-6 - reduced by 50% */
  }

  /* Time period tabs - scaled to 86.25% from mobile */
  .time-period-tabs {
    margin-bottom: 1.29375rem !important; /* 1.5rem * 0.8625 - increased by 15% */
    gap: 0.64687500rem; /* 0.75rem * 0.8625 - increased by 15% */
  }

  .time-tab {
    padding: 0.53906250rem 1.07812500rem !important; /* 0.625rem * 0.8625, 1.25rem * 0.8625 - increased by 15% */
    border-radius: 0.64687500rem; /* 0.75rem * 0.8625 - increased by 15% */
    font-size: 0.75468750rem !important; /* 0.875rem * 0.8625 - increased by 15% */
  }

  /* Gender header text - scaled to 86.25% from mobile sm:text-base (1rem) */
  .gender-header-text {
    font-size: 0.8625rem !important; /* 1rem * 0.8625 */
  }

  /* Gender header padding - scaled to 86.25% */
  .gender-header {
    padding-top: 0.43125rem !important; /* 0.5rem * 0.8625 (py-2) */
    padding-bottom: 0.53906250rem !important; /* 0.625rem * 0.8625 (py-2.5) */
    padding-left: 1.29375rem !important; /* 1.5rem * 0.8625 (px-6) */
    padding-right: 1.29375rem !important; /* 1.5rem * 0.8625 (px-6) */
  }

  /* Card body padding - scaled to 86.25% */
  .card-body {
    padding: 1.29375rem !important; /* 1.5rem * 0.8625 (p-6) */
  }

  /* Dress code title - scaled to 86.25% from mobile sm:text-base (1rem) */
  .dress-code-title {
    font-size: 0.8625rem !important; /* 1rem * 0.8625 */
    margin-bottom: 0.647rem !important; /* 0.75rem * 0.8625 (mb-3) */
  }

  /* Dress code description - scaled to 86.25% from mobile sm:text-sm (0.875rem) */
  .dress-code-description {
    font-size: 0.75468750rem !important; /* 0.875rem * 0.8625 */
  }

  /* Dress code info margin - scaled to 86.25% - only when color navigation exists */
  .dress-code-info.mb-6 {
    margin-bottom: 1.29375rem !important; /* 1.5rem * 0.8625 (mb-6) */
  }
}

/* Desktop (1536px+) - Simple, clean desktop styles */
@media (min-width: 1536px) {
  .dress-code-header {
    font-size: 1.875rem !important; /* 30px - text-3xl */
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .time-period-tabs {
    gap: 0.5rem;
  }

  .time-tab {
    font-size: 0.875rem;
    padding: 0.625rem 1.25rem;
  }

  .cards-vertical-stack {
    gap: 1.5rem;
    max-width: 400px;
  }

  .gender-header {
    padding: 1rem 1.5rem;
  }

  .card-body {
    padding: 1.5rem;
  }

  .image-wrapper {
    margin-bottom: 1.5rem;
  }

  .dress-code-info.mb-6 {
    margin-bottom: 1.5rem;
  }

  .color-navigation {
    gap: 0.75rem;
  }

  .color-circle {
    width: 2.5rem;
    height: 2.5rem;
  }
}

/* Desktop - slightly larger max-width */
@media (min-width: 641px) {
  .cards-vertical-stack {
    gap: 2.5rem;
    max-width: 550px;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .gender-card,
  .time-tab,
  .image-container img,
  .color-display,
  .color-circle,
  .fade-enter-active,
  .fade-leave-active,
  .fade-scale-enter-active,
  .fade-scale-leave-active {
    transition: none;
  }

  .gender-card:hover {
    transform: none;
  }

  .time-tab:hover {
    transform: none !important;
  }

  .gender-card:hover .image-container img,
  .gender-card:hover .color-display {
    transform: none;
  }
}
</style>
