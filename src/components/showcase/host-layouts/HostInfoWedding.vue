<template>
  <div class="host-info-wrapper" :class="{ 'khmer-text': currentLanguage === 'kh' }">
    <!-- Simple design: a minimal invitation — the welcome header above large
         script host names stacked and joined by an ampersand. Driven by
         template_assets.host_info_design.type === 'simple'. -->
    <div v-if="isSimpleDesign" class="host-info-simple">
      <WelcomeHeader
        v-if="showWelcomeHeaderText !== false"
        :message="welcomeMessage"
        default-message="Welcome to Our Event"
        :color="primaryColor"
        :font-family="primaryFont || currentFont"
        :current-language="currentLanguage"
        :animated="true"
        :base-delay="0.1"
      />

      <div :class="['simple-names', getKhmerClass(currentLanguage)]">
        <h2
          v-if="hosts.length > 0"
          class="simple-name-text leading-tight"
          :style="simpleNameStyle"
        >
          <span
            v-for="(word, index) in splitToWords(hosts[0].name)"
            :key="`simple-name-left-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${simpleAnimationDelays.nameLeft + index * WORD_DELAY}s` }"
          >{{ word }}{{ index < splitToWords(hosts[0].name).length - 1 ? ' ' : '' }}</span>
        </h2>

        <div
          v-if="hosts.length > 1"
          class="simple-amp"
          :style="simpleNameStyle"
        >
          <span
            class="bounce-word"
            :style="{ animationDelay: `${simpleAnimationDelays.amp}s` }"
          >&amp;</span>
        </div>

        <h2
          v-if="hosts.length > 1"
          class="simple-name-text leading-tight"
          :style="simpleNameStyle"
        >
          <span
            v-for="(word, index) in splitToWords(hosts[1]?.name)"
            :key="`simple-name-right-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${simpleAnimationDelays.nameRight + index * WORD_DELAY}s` }"
          >{{ word }}{{ index < splitToWords(hosts[1]?.name).length - 1 ? ' ' : '' }}</span>
        </h2>
      </div>
    </div>

    <!-- Standard design (default): rich layout with parent names, logo, titles,
         host names and profile pictures arranged in a 7-row grid. -->
    <div v-else class="host-info-grid">
      <!-- Row 1: Welcome Header -->
      <WelcomeHeader
        v-if="showWelcomeHeaderText !== false"
        :message="welcomeMessage"
        default-message="Welcome to Our Event"
        :color="primaryColor"
        :font-family="primaryFont || currentFont"
        :current-language="currentLanguage"
        :animated="true"
        :base-delay="animationDelays.welcome"
      />

      <!-- Row 2: Host Parent A Names -->
      <div v-if="showParentARow" class="parent-row">
        <div class="host-parent-left">
          <div
            v-if="hosts[0].parent_a_name || hosts[0].parent_b_name"
            :class="['parent-name-text leading-normal text-center opacity-90', getKhmerClass(currentLanguage)]"
          >
            <AutoFitText
              :text="hosts[0].parent_a_name || hosts[0].parent_b_name || ''"
              :color="primaryColor"
              :font-family="primaryFont || currentFont"
              :base-delay="animationDelays.parentALeft"
              :word-delay="WORD_DELAY"
              :key-prefix="`parent-a-left-${currentLanguage}`"
            />
          </div>
        </div>
        <div class="center-spacer"></div>
        <div class="host-parent-right">
          <div
            v-if="hosts.length > 1 && (hosts[1]?.parent_a_name || hosts[1]?.parent_b_name)"
            :class="['parent-name-text leading-normal text-center opacity-90', getKhmerClass(currentLanguage)]"
          >
            <AutoFitText
              :text="hosts[1]?.parent_a_name || hosts[1]?.parent_b_name || ''"
              :color="primaryColor"
              :font-family="primaryFont || currentFont"
              :base-delay="animationDelays.parentARight"
              :word-delay="WORD_DELAY"
              :key-prefix="`parent-a-right-${currentLanguage}`"
            />
          </div>
        </div>
      </div>

      <!-- Row 3: Host Parent B Names -->
      <div v-if="showParentBRow" class="parent-row">
        <div class="host-parent-left">
          <div
            v-if="hosts[0].parent_b_name && hosts[0].parent_a_name"
            :class="['parent-name-text leading-normal text-center opacity-90', getKhmerClass(currentLanguage)]"
          >
            <AutoFitText
              :text="hosts[0].parent_b_name || ''"
              :color="primaryColor"
              :font-family="primaryFont || currentFont"
              :base-delay="animationDelays.parentBLeft"
              :word-delay="WORD_DELAY"
              :key-prefix="`parent-b-left-${currentLanguage}`"
            />
          </div>
        </div>
        <div class="center-spacer"></div>
        <div class="host-parent-right">
          <div
            v-if="hosts.length > 1 && hosts[1]?.parent_b_name && hosts[1]?.parent_a_name"
            :class="['parent-name-text leading-normal text-center opacity-90', getKhmerClass(currentLanguage)]"
          >
            <AutoFitText
              :text="hosts[1]?.parent_b_name || ''"
              :color="primaryColor"
              :font-family="primaryFont || currentFont"
              :base-delay="animationDelays.parentBRight"
              :word-delay="WORD_DELAY"
              :key-prefix="`parent-b-right-${currentLanguage}`"
            />
          </div>
        </div>
      </div>

      <!-- Row 4: Logo -->
      <HostLogo
        :key="`logo-${currentLanguage}`"
        :logo-url="logoUrl"
        :sample-logo-one="sampleLogoOne"
        :primary-color="primaryColor"
        :animated="true"
        :animation-delay="animationDelays.logo"
      />

      <!-- Row 5: Host Titles -->
      <div v-if="hosts.length > 0" class="title-row">
        <div class="host-title-left">
          <p
            :class="['parent-name-text leading-normal text-center opacity-90', getKhmerClass(currentLanguage)]"
            :style="titleTextStyle"
          >
            <span
              v-for="(word, index) in splitToWords(leftHostTitle)"
              :key="`title-left-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.titleLeft + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(leftHostTitle).length - 1 ? '\u00A0' : '' }}</span>
          </p>
        </div>
        <div class="center-spacer"></div>
        <div class="host-title-right">
          <p
            v-if="hosts.length > 1"
            :class="['parent-name-text leading-normal text-center opacity-90', getKhmerClass(currentLanguage)]"
            :style="titleTextStyle"
          >
            <span
              v-for="(word, index) in splitToWords(rightHostTitle)"
              :key="`title-right-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.titleRight + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(rightHostTitle).length - 1 ? '\u00A0' : '' }}</span>
          </p>
        </div>
      </div>

      <!-- Row 6: Host Names -->
      <div v-if="hosts.length > 0" class="name-row">
        <div class="host-name-left">
          <h3
            :class="['host-name-text font-regular leading-tight', getKhmerClass(currentLanguage)]"
            :style="nameTextStyle"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[0].name)"
              :key="`name-left-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.nameLeft + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(hosts[0].name).length - 1 ? '\u00A0' : '' }}</span>
          </h3>
        </div>
        <div class="center-spacer"></div>
        <div class="host-name-right">
          <h3
            v-if="hosts.length > 1"
            :class="['host-name-text font-regular leading-tight', getKhmerClass(currentLanguage)]"
            :style="nameTextStyle"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[1]?.name)"
              :key="`name-right-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.nameRight + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(hosts[1]?.name).length - 1 ? '\u00A0' : '' }}</span>
          </h3>
        </div>
      </div>

      <!-- Row 7: Host Profile Pictures -->
      <div v-if="showProfilePictures" class="profile-picture-row">
        <div class="host-profile-left">
          <HostProfilePicture
            :key="`profile-left-${currentLanguage}`"
            :image-url="hosts[0].profile_image"
            :alt="`${hosts[0].name} profile`"
            :background-color="primaryColor"
            :animated="true"
            :animation-delay="animationDelays.profileLeft"
          />
        </div>
        <div class="center-spacer"></div>
        <div class="host-profile-right">
          <HostProfilePicture
            v-if="hosts.length > 1"
            :key="`profile-right-${currentLanguage}`"
            :image-url="hosts[1]?.profile_image"
            :alt="`${hosts[1]?.name} profile`"
            :background-color="primaryColor"
            :animated="true"
            :animation-delay="animationDelays.profileRight"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HostInfoProps } from '@/types/showcase'
import {
  WelcomeHeader,
  HostLogo,
  HostProfilePicture,
  AutoFitText,
  splitToWords,
  getKhmerClass,
  ANIMATION_CONSTANTS,
  getTextAnimationDuration,
} from './shared'

const props = defineProps<HostInfoProps>()

const WORD_DELAY = ANIMATION_CONSTANTS.WORD_DELAY
const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP

// Computed visibility flags
const showParentARow = computed(() =>
  props.hosts.length > 0 &&
  (props.hosts[0].parent_a_name || props.hosts[0].parent_b_name ||
   (props.hosts.length > 1 && (props.hosts[1]?.parent_a_name || props.hosts[1]?.parent_b_name)))
)

const showParentBRow = computed(() =>
  props.hosts.length > 0 &&
  ((props.hosts[0].parent_b_name && props.hosts[0].parent_a_name) ||
   (props.hosts.length > 1 && props.hosts[1]?.parent_b_name && props.hosts[1]?.parent_a_name))
)

const showProfilePictures = computed(() =>
  props.hosts.length === 2 && props.hosts[0].profile_image && props.hosts[1].profile_image
)

// Host titles with defaults
const leftHostTitle = computed(() =>
  props.hosts[0]?.title || (props.hosts.length === 2 ? 'Bridegroom' : props.hosts.length === 1 ? 'Host' : 'Host 1')
)

const rightHostTitle = computed(() => props.hosts[1]?.title || 'Bride')

// Computed text styles
const titleTextStyle = computed(() => ({
  color: props.primaryColor,
  fontFamily: props.secondaryFont || props.currentFont,
  wordWrap: 'break-word' as const,
  hyphens: 'auto' as const,
}))

const nameTextStyle = computed(() => ({
  color: props.primaryColor,
  fontFamily: props.primaryFont || props.secondaryFont || props.currentFont,
}))

// Active design: 'simple' renders the minimal welcome + script-names layout;
// anything else falls back to the rich 'standard' grid below.
const isSimpleDesign = computed(() => props.designType === 'simple')

// Script-name styling for the simple design — uses the primary (typically script)
// font and the theme accent color, matching the standard layout's host names.
const simpleNameStyle = computed(() => ({
  color: props.primaryColor,
  fontFamily: props.primaryFont || props.secondaryFont || props.currentFont,
}))

// Animation delays for the simple design: welcome → first name → ampersand →
// second name. Mirrors the standard layout's sequential cascade so the two
// designs feel consistent when switching templates.
const simpleAnimationDelays = computed(() => {
  let cursor = 0.1
  const welcomeText =
    props.showWelcomeHeaderText === false
      ? ''
      : props.welcomeMessage || 'You Are Invited to Our Wedding'
  if (welcomeText) cursor += getTextAnimationDuration(welcomeText) + ELEMENT_GAP

  const nameLeft = cursor
  cursor += getTextAnimationDuration(props.hosts[0]?.name) + ELEMENT_GAP
  const amp = cursor
  if (props.hosts.length > 1) cursor += 0.2
  const nameRight = cursor

  return { nameLeft, amp, nameRight }
})

// Animation delays calculation
const animationDelays = computed(() => {
  let currentDelay = 0.1

  const getNextDelay = (text: string | null | undefined, skipIfEmpty = true): number => {
    if (skipIfEmpty && !text) return currentDelay
    const startDelay = currentDelay
    const duration = getTextAnimationDuration(text)
    currentDelay = startDelay + duration + ELEMENT_GAP
    return startDelay
  }

  const welcome = getNextDelay(
    props.showWelcomeHeaderText === false ? undefined : (props.welcomeMessage || 'Welcome to Our Event'),
  )
  const parentALeft = getNextDelay(props.hosts[0]?.parent_a_name || props.hosts[0]?.parent_b_name)
  const parentARight = getNextDelay(
    props.hosts.length > 1 ? (props.hosts[1]?.parent_a_name || props.hosts[1]?.parent_b_name) : null
  )
  const parentBLeft = getNextDelay(
    (props.hosts[0]?.parent_b_name && props.hosts[0]?.parent_a_name) ? props.hosts[0].parent_b_name : null
  )
  const parentBRight = getNextDelay(
    (props.hosts.length > 1 && props.hosts[1]?.parent_b_name && props.hosts[1]?.parent_a_name)
      ? props.hosts[1].parent_b_name : null
  )
  const logo = currentDelay
  currentDelay += 0.25
  const titleLeft = getNextDelay(leftHostTitle.value)
  const titleRight = getNextDelay(props.hosts.length > 1 ? rightHostTitle.value : null)
  const nameLeft = getNextDelay(props.hosts[0]?.name)
  const nameRight = getNextDelay(props.hosts.length > 1 ? props.hosts[1]?.name : null)
  const profileLeft = currentDelay
  currentDelay += 0.15
  const profileRight = currentDelay

  return {
    welcome,
    parentALeft,
    parentARight,
    parentBLeft,
    parentBRight,
    logo,
    titleLeft,
    titleRight,
    nameLeft,
    nameRight,
    profileLeft,
    profileRight,
  }
})
</script>

<style scoped>
@import './shared/host-info-base.css';

/* Wedding-specific: 7 rows grid */
.host-info-grid {
  grid-template-rows: auto auto auto auto auto auto auto;
}

/* Reduce spacing between parent rows */
.parent-row:nth-child(3) {
  margin-top: -0.25rem;
}

/* Reduce spacing between title and name rows */
.name-row {
  margin-top: -0.125rem;
}

/* ============================================================
   Simple design — minimal welcome header above large script
   host names stacked and joined by an ampersand. Sizing uses
   clamp() with a capped max so the names read as the hero on
   mobile while staying elegant (not oversized) on the wide
   desktop card. A laptop override keeps the compact look the
   rest of the showcase uses at those widths.
   ============================================================ */
.host-info-simple {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 1rem 0.5rem 1.5rem;
  box-sizing: border-box;
}

.simple-names {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 0.75rem;
  gap: 0.1rem;
}

.simple-name-text {
  font-size: clamp(2rem, 7vw, 3.25rem);
  line-height: 1.05;
  text-align: center;
  width: 100%;
  word-break: break-word;
}

.simple-amp {
  font-size: clamp(1.5rem, 5vw, 2.25rem);
  line-height: 1;
  text-align: center;
  opacity: 0.9;
  /* Equal space above and below so the '&' sits centered between the two names
     with room to breathe (the flex gap alone reads as too tight). */
  margin: 0.9rem 0;
}

/* Khmer clusters reserve space above for vowel signs ("heads") and below for
   subscript consonants ("tails"). With a Latin-tuned line box that reservation
   sits empty under a name that has no subscript, reading as a larger gap to the
   ampersand than the gap to a name that does use its tail. line-height only
   trims leading, not that intrinsic reservation, so tighten the box below 1 to
   let it hug the ink — the head/tail glyphs render past the box (nothing sets
   overflow:hidden here) so they are not clipped — and add a small gap so ink
   doesn't collide where names do carry heads/tails. Tune `line-height`/`gap`
   together if the spacing still reads uneven. */
.simple-names.khmer-text-fix {
  gap: 0.35rem;
}

.simple-names.khmer-text-fix .simple-name-text {
  line-height: 0.95;
}

/* Khmer clusters crowd the ampersand on both sides — host-2's vowel signs
   (heads) ride up toward the '&' from below, while host-1's subscripts (tails)
   hang toward it from above. Keep the space equal above and below (centered) but
   a touch larger than the Latin default to clear those heads/tails. */
.simple-names.khmer-text-fix .simple-amp {
  margin-top: 1.1rem;
  margin-bottom: 1.1rem;
}

/* Laptop (13") — match the compact scale the rest of the showcase uses here. */
@media (min-width: 1024px) and (max-width: 1365px) {
  .simple-name-text {
    font-size: 1.75rem;
  }

  .simple-amp {
    font-size: 1.25rem;
  }
}
</style>
