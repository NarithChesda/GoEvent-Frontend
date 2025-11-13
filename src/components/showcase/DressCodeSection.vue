<template>
  <div class="dress-code-section">
    <!-- Section Header -->
    <div class="section-header mb-8 sm:mb-10 text-center">
      <h2
        :style="{
          color: primaryColor,
          fontFamily: primaryFont || currentFont,
        }"
        class="text-2xl sm:text-3xl laptop-sm:text-3xl laptop-md:text-4xl font-bold mb-2"
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
      >
        {{ sectionDescription }}
      </p>
    </div>

    <!-- Time Period Tabs -->
    <div
      v-if="timePeriodGroups.length > 1"
      class="time-period-tabs flex justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 flex-wrap"
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
        {{ timePeriod.time_period_display }}
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
              <div class="gender-header py-4 sm:py-5 px-6 text-center" :style="getGenderHeaderStyle(genderGroup)">
                <h3
                  :style="{
                    fontFamily: primaryFont || currentFont,
                  }"
                  class="text-xl sm:text-2xl font-bold text-white"
                >
                  {{ genderGroup.gender_display }}
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
                    <div class="dress-code-info text-center mb-6">
                      <h4
                        :style="{
                          color: primaryColor,
                          fontFamily: primaryFont || currentFont,
                        }"
                        class="text-lg sm:text-xl font-bold mb-3"
                      >
                        {{ getCurrentDressCode(genderGroup).title || getCurrentDressCode(genderGroup).dress_code_type_display }}
                      </h4>

                      <p
                        v-if="getCurrentDressCode(genderGroup).description"
                        :style="{
                          color: accentColor,
                          fontFamily: secondaryFont || currentFont,
                        }"
                        class="text-sm sm:text-base opacity-80 leading-relaxed"
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
  return titleText?.content || 'Dress Code Guide'
})

// Get section description from event texts
const sectionDescription = computed(() => {
  const descText = props.eventTexts?.find(
    (t) => t.text_type === 'dress_code_description' && t.language === props.currentLanguage,
  )
  return descText?.content || ''
})

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

  .dress-code-info {
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
