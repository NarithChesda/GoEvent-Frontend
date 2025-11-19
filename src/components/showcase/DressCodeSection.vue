<template>
  <div class="dress-code-section mb-4 sm:mb-5 laptop-sm:mb-5 laptop-md:mb-6 laptop-lg:mb-7 desktop:mb-6">
    <!-- Section Header -->
    <div class="section-header text-center mb-6 sm:mb-8 laptop-sm:mb-3 laptop-md:mb-4 laptop-lg:mb-5 desktop:mb-4 laptop-sm:-mt-2 laptop-md:-mt-2 laptop-lg:-mt-3">
      <h2
        :style="{
          color: primaryColor,
          fontFamily: primaryFont || currentFont,
        }"
        class="leading-tight text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-regular mb-3 sm:mb-4 md:mb-6 laptop-sm:mb-2 laptop-md:mb-2 desktop:mb-2 capitalize dress-code-header"
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
        class="text-sm sm:text-base md:text-lg opacity-80"
        :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
      >
        {{ sectionDescription }}
      </p>
    </div>

    <!-- Time Period Tabs -->
    <div
      class="time-period-tabs flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-4 laptop-sm:mb-4 laptop-md:mb-4 desktop:mb-4 flex-wrap"
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

    <!-- Main Content -->
    <transition name="fade" mode="out-in">
      <div :key="activeTimePeriod" class="dress-code-content w-full">
        <!-- Row 1: Image Preview (Full Width) -->
        <div class="image-section w-full p-1 sm:p-2 mb-4">
          <transition name="fade-scale" mode="out-in">
            <div :key="activeGender" class="dress-code-image">
              <div class="image-wrapper flex justify-center">
                <div
                  v-if="getCurrentDressCodeForActiveGender().image"
                  class="image-container w-full aspect-square max-w-xs rounded-2xl overflow-hidden shadow-md"
                  :style="{ backgroundColor: `${getCurrentDressCodeForActiveGender().color}20` }"
                >
                  <img
                    :src="getMediaUrl(getCurrentDressCodeForActiveGender().image || '')"
                    :alt="getCurrentDressCodeForActiveGender().dress_code_type_display"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <!-- Color Display (if no image) -->
                <div
                  v-else
                  class="color-display w-full aspect-square max-w-xs rounded-2xl flex items-center justify-center shadow-md"
                  :style="{ backgroundColor: getCurrentDressCodeForActiveGender().color }"
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
            </div>
          </transition>
        </div>

        <!-- Row 2: Gender Tabs -->
        <div class="gender-tabs-section w-full p-1 sm:p-2 flex items-center justify-center mb-4 laptop-sm:mb-1 laptop-md:mb-1 desktop:mb-1">
          <div class="gender-tabs flex gap-2 flex-nowrap justify-center">
            <button
              v-for="(genderGroup, index) in currentTimePeriodGenders"
              :key="genderGroup.gender"
              @click="activeGender = index"
              :class="[
                'gender-tab px-5 py-2.5 rounded-full transition-all duration-300',
                'text-sm sm:text-base font-semibold text-center flex-shrink-0',
                activeGender === index ? 'tab-active' : 'tab-inactive',
              ]"
              :style="getGenderTabStyle(index)"
            >
              {{ translateGender(genderGroup.gender) }}
            </button>
          </div>
        </div>

        <!-- Row 3: Title and Description -->
        <transition name="fade-scale" mode="out-in">
          <div :key="`${activeGender}-${getActiveGenderGroup().activeIndex}`" class="dress-code-info-section px-4 sm:px-6 py-1 text-center">
            <h4
              :style="{
                color: primaryColor,
                fontFamily: primaryFont || currentFont,
              }"
              class="text-lg sm:text-xl font-regular mb-1 dress-code-title"
              :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
            >
              {{ getCurrentDressCodeForActiveGender().title || translateDressCodeType(getCurrentDressCodeForActiveGender().dress_code_type) }}
            </h4>

            <p
              v-if="getCurrentDressCodeForActiveGender().description"
              :style="{
                color: accentColor,
                fontFamily: secondaryFont || currentFont,
              }"
              class="text-sm sm:text-base opacity-80 leading-relaxed dress-code-description mb-0"
              :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
            >
              {{ getCurrentDressCodeForActiveGender().description }}
            </p>
          </div>
        </transition>

        <!-- Row 4: Color Circle Navigation -->
        <transition name="fade-scale" mode="out-in">
          <div
            v-if="getActiveGenderGroup().codes.length > 0"
            :key="`colors-${activeGender}`"
            class="color-navigation-section px-4 sm:px-6 py-1 pb-2 flex justify-center"
          >
            <div class="color-navigation flex gap-3">
              <button
                v-for="(code, index) in getActiveGenderGroup().codes"
                :key="code.id"
                @click="selectDressCode(getActiveGenderGroup(), index)"
                :class="[
                  'color-circle w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-300',
                  'border-2 shadow-md hover:scale-110 focus:outline-none',
                  getActiveGenderGroup().activeIndex === index ? 'scale-110' : 'opacity-60 hover:opacity-100',
                ]"
                :style="{
                  backgroundColor: code.color,
                  borderColor: getActiveGenderGroup().activeIndex === index ? primaryColor : 'transparent',
                }"
                :aria-label="`View ${code.dress_code_type_display}`"
              >
                <!-- Active indicator -->
                <span
                  v-if="getActiveGenderGroup().activeIndex === index"
                  class="inline-block w-3 h-3 rounded-full"
                  :style="{ backgroundColor: primaryColor }"
                ></span>
              </button>
            </div>
          </div>
        </transition>
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
const activeGender = ref(0)

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

// Helper function to get time period sort order
const getTimePeriodOrder = (timePeriod: string): number => {
  const order: Record<string, number> = {
    all_day: 0,
    morning: 1,
    afternoon: 2,
    evening: 3,
    night: 4,
  }
  return order[timePeriod] ?? 999
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

  // Sort time periods by chronological order
  return Array.from(timePeriodMap.values()).sort(
    (a, b) => getTimePeriodOrder(a.time_period) - getTimePeriodOrder(b.time_period)
  )
})

// Get gender groups for the current active time period
const currentTimePeriodGenders = computed(() => {
  if (timePeriodGroups.value.length === 0) return []
  return timePeriodGroups.value[activeTimePeriod.value]?.genderGroups || []
})

// Get active gender group
const getActiveGenderGroup = (): GenderGroup => {
  if (currentTimePeriodGenders.value.length === 0) {
    return {
      gender: 'all',
      gender_display: 'All',
      codes: [],
      activeIndex: 0,
    }
  }
  return currentTimePeriodGenders.value[activeGender.value] || currentTimePeriodGenders.value[0]
}

// Get current dress code for active gender
const getCurrentDressCodeForActiveGender = (): DressCode => {
  const genderGroup = getActiveGenderGroup()
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

const getGenderTabStyle = (index: number) => {
  const isActive = activeGender.value === index
  return {
    backgroundColor: isActive ? props.primaryColor : `${props.primaryColor}10`,
    color: isActive ? '#ffffff' : props.primaryColor,
    fontFamily: props.primaryFont || props.currentFont,
    transform: isActive ? 'scale(1.05)' : 'scale(1)',
    boxShadow: isActive ? `0 4px 12px ${props.primaryColor}30` : 'none',
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

/* Reduce extra spacing for Khmer in gender header */
.gender-header .khmer-text-fix {
  line-height: 1.4 !important;
  padding-top: 0.1em !important;
  padding-bottom: 0.1em !important;
  margin-top: 0;
  margin-bottom: 0;
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

/* Main Content Layout */
.dress-code-content {
  transition: all 0.4s ease;
}

/* Gender Tabs */
.gender-tab {
  cursor: pointer;
  border: none;
  outline: none;
  white-space: nowrap;
}

.gender-tab:hover {
  transform: scale(1.05) !important;
}

.gender-tab:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.image-container img {
  transition: transform 0.4s ease;
}

.image-container:hover img {
  transform: scale(1.05);
}

.color-display {
  transition: transform 0.4s ease;
}

.color-display:hover {
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

/* Small laptops 13-inch (laptop-sm: 1024px) - Scaled to 67.5% matching AgendaWedding exactly */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Header text - scaled to 67.5% from mobile md:text-3xl (1.875rem) */
  .dress-code-header {
    font-size: 1.265625rem !important; /* 1.875rem * 0.675 - exact mobile ratio matching AgendaWedding */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.3375rem !important; /* 0.5rem * 0.675 (py-2) */
  }

  /* Section description - scaled to 67.5% from mobile md:text-lg (1.125rem) */
  .section-header p {
    font-size: 0.759375rem !important; /* 1.125rem * 0.675 */
  }

  /* Time period tabs - compact mobile sizing like AgendaWedding */
  .time-period-tabs {
    gap: 0.5rem; /* Match mobile gap */
  }

  .time-tab {
    padding: 0.625rem 1.25rem !important; /* Compact mobile sizing */
    font-size: 0.75rem !important; /* Compact font size */
    line-height: 1.2 !important; /* Match AgendaWedding tab-date */
  }

  /* Gender tabs - compact mobile sizing like AgendaWedding */
  .gender-tab {
    padding: 0.625rem 1.25rem !important; /* Compact mobile sizing */
    font-size: 0.75rem !important; /* Compact font size */
    line-height: 1.2 !important; /* Match AgendaWedding tab-date */
  }

  /* Color circles - reduce by 50% on laptop */
  .color-circle {
    width: 1.25rem !important; /* 50% of 2.5rem (w-10) */
    height: 1.25rem !important; /* 50% of 2.5rem (h-10) */
  }

  .color-circle span {
    width: 0.375rem !important; /* 50% of 0.75rem (w-3) */
    height: 0.375rem !important; /* 50% of 0.75rem (h-3) */
  }

  .color-navigation {
    gap: 0.375rem !important; /* 50% of 0.75rem (gap-3) */
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

/* Medium laptops 14-15 inch (laptop-md: 1366px+) - Scaled to 75% matching AgendaWedding exactly */
@media (min-width: 1366px) and (max-width: 1535px) {
  /* Header text - scaled to 75% from mobile md:text-3xl (1.875rem) */
  .dress-code-header {
    font-size: 1.40625rem !important; /* 1.875rem * 0.75 - exact mobile ratio matching AgendaWedding */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.375rem !important; /* 0.5rem * 0.75 (py-2) */
  }

  /* Section description - scaled to 75% from mobile md:text-lg (1.125rem) */
  .section-header p {
    font-size: 0.84375rem !important; /* 1.125rem * 0.75 */
  }

  /* Time period tabs - mobile sizing with larger gap like AgendaWedding sm breakpoint */
  .time-period-tabs {
    gap: 0.75rem; /* 640px+ gap */
  }

  .time-tab {
    padding: 0.75rem 1.75rem !important; /* 640px+ sizing */
    font-size: 1rem !important; /* 640px+ font size */
  }

  /* Gender tabs - mobile sizing with larger gap like AgendaWedding sm breakpoint */
  .gender-tab {
    padding: 0.625rem 1.25rem !important; /* Maintain base mobile sizing */
    font-size: 1rem !important; /* 640px+ font size */
  }

  /* Color circles - reduce by 50% on laptop */
  .color-circle {
    width: 1.5rem !important; /* 50% of 3rem (sm:w-12) */
    height: 1.5rem !important; /* 50% of 3rem (sm:h-12) */
  }

  .color-circle span {
    width: 0.375rem !important; /* 50% of 0.75rem (w-3) */
    height: 0.375rem !important; /* 50% of 0.75rem (h-3) */
  }

  .color-navigation {
    gap: 0.375rem !important; /* 50% of 0.75rem (gap-3) */
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

  .gender-tab {
    font-size: 0.875rem;
  }

  .color-navigation {
    gap: 0.75rem;
  }

  .color-circle {
    width: 2.5rem;
    height: 2.5rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .dress-code-content,
  .time-tab,
  .gender-tab,
  .image-container img,
  .color-display,
  .color-circle,
  .fade-enter-active,
  .fade-leave-active,
  .fade-scale-enter-active,
  .fade-scale-leave-active {
    transition: none;
  }

  .time-tab:hover,
  .gender-tab:hover {
    transform: none !important;
  }

  .image-container:hover img,
  .color-display:hover {
    transform: none;
  }
}
</style>
