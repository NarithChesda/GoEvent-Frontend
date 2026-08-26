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
        <InlineEditableText
          :value="hosts[0].name"
          :target="{ kind: 'host', hostId: hosts[0].id, field: 'name' }"
          :input-style="{ fontFamily: simpleNameStyle.fontFamily, color: simpleNameStyle.color }"
        >
          <h2
            v-if="hosts.length > 0"
            class="simple-name-text leading-tight"
            :style="simpleNameStyle"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[0].name)"
              :key="`simple-name-left-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${simpleAnimationDelays.nameLeft + wordCascadeDelay(index)}s` }"
              >{{ word }}{{ index < splitToWords(hosts[0].name).length - 1 ? ' ' : '' }}</span
            >
          </h2>
        </InlineEditableText>

        <div v-if="hosts.length > 1" class="simple-amp" :style="simpleNameStyle">
          <span class="bounce-word" :style="{ animationDelay: `${simpleAnimationDelays.amp}s` }"
            >&amp;</span
          >
        </div>

        <InlineEditableText
          v-if="hosts.length > 1"
          :value="hosts[1]?.name"
          :target="{ kind: 'host', hostId: hosts[1]?.id ?? 0, field: 'name' }"
          :input-style="{ fontFamily: simpleNameStyle.fontFamily, color: simpleNameStyle.color }"
        >
          <h2 class="simple-name-text leading-tight" :style="simpleNameStyle">
            <span
              v-for="(word, index) in splitToWords(hosts[1]?.name)"
              :key="`simple-name-right-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{
                animationDelay: `${simpleAnimationDelays.nameRight + wordCascadeDelay(index)}s`,
              }"
              >{{ word }}{{ index < splitToWords(hosts[1]?.name).length - 1 ? ' ' : '' }}</span
            >
          </h2>
        </InlineEditableText>
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
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              getKhmerClass(currentLanguage),
            ]"
          >
            <InlineEditableText
              :value="hosts[0].parent_a_name || hosts[0].parent_b_name"
              :target="{
                kind: 'host',
                hostId: hosts[0].id,
                field: hosts[0].parent_a_name ? 'parent_a_name' : 'parent_b_name',
              }"
              :input-style="{ fontFamily: primaryFont || currentFont, color: primaryColor }"
            >
              <AutoFitText
                :text="hosts[0].parent_a_name || hosts[0].parent_b_name || ''"
                :color="primaryColor"
                :font-family="primaryFont || currentFont"
                :base-delay="animationDelays.parentALeft"
                :word-delay="WORD_DELAY"
                :key-prefix="`parent-a-left-${currentLanguage}`"
              />
            </InlineEditableText>
          </div>
        </div>
        <div class="center-spacer"></div>
        <div class="host-parent-right">
          <div
            v-if="hosts.length > 1 && (hosts[1]?.parent_a_name || hosts[1]?.parent_b_name)"
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              getKhmerClass(currentLanguage),
            ]"
          >
            <InlineEditableText
              :value="hosts[1]?.parent_a_name || hosts[1]?.parent_b_name"
              :target="{
                kind: 'host',
                hostId: hosts[1]?.id ?? 0,
                field: hosts[1]?.parent_a_name ? 'parent_a_name' : 'parent_b_name',
              }"
              :input-style="{ fontFamily: primaryFont || currentFont, color: primaryColor }"
            >
              <AutoFitText
                :text="hosts[1]?.parent_a_name || hosts[1]?.parent_b_name || ''"
                :color="primaryColor"
                :font-family="primaryFont || currentFont"
                :base-delay="animationDelays.parentARight"
                :word-delay="WORD_DELAY"
                :key-prefix="`parent-a-right-${currentLanguage}`"
              />
            </InlineEditableText>
          </div>
        </div>
      </div>

      <!-- Row 3: Host Parent B Names -->
      <div v-if="showParentBRow" class="parent-row">
        <div class="host-parent-left">
          <div
            v-if="hosts[0].parent_b_name && hosts[0].parent_a_name"
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              getKhmerClass(currentLanguage),
            ]"
          >
            <InlineEditableText
              :value="hosts[0].parent_b_name"
              :target="{ kind: 'host', hostId: hosts[0].id, field: 'parent_b_name' }"
              :input-style="{ fontFamily: primaryFont || currentFont, color: primaryColor }"
            >
              <AutoFitText
                :text="hosts[0].parent_b_name || ''"
                :color="primaryColor"
                :font-family="primaryFont || currentFont"
                :base-delay="animationDelays.parentBLeft"
                :word-delay="WORD_DELAY"
                :key-prefix="`parent-b-left-${currentLanguage}`"
              />
            </InlineEditableText>
          </div>
        </div>
        <div class="center-spacer"></div>
        <div class="host-parent-right">
          <div
            v-if="hosts.length > 1 && hosts[1]?.parent_b_name && hosts[1]?.parent_a_name"
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              getKhmerClass(currentLanguage),
            ]"
          >
            <InlineEditableText
              :value="hosts[1]?.parent_b_name"
              :target="{ kind: 'host', hostId: hosts[1]?.id ?? 0, field: 'parent_b_name' }"
              :input-style="{ fontFamily: primaryFont || currentFont, color: primaryColor }"
            >
              <AutoFitText
                :text="hosts[1]?.parent_b_name || ''"
                :color="primaryColor"
                :font-family="primaryFont || currentFont"
                :base-delay="animationDelays.parentBRight"
                :word-delay="WORD_DELAY"
                :key-prefix="`parent-b-right-${currentLanguage}`"
              />
            </InlineEditableText>
          </div>
        </div>
      </div>

      <!-- Row 4: Logo -->
      <EditableRegion :intent="{ kind: 'eventLogo' }">
        <HostLogo
          :key="`logo-${currentLanguage}`"
          :logo-url="logoUrl"
          :sample-logo-one="sampleLogoOne"
          :primary-color="primaryColor"
          :animated="true"
          :animation-delay="animationDelays.logo"
        />
      </EditableRegion>

      <!-- Row 5: Host Titles -->
      <div v-if="hosts.length > 0" class="title-row">
        <div class="host-title-left">
          <InlineEditableText
            :value="leftHostTitle"
            :target="{ kind: 'host', hostId: hosts[0].id, field: 'title' }"
            :input-style="{ fontFamily: titleTextStyle.fontFamily, color: titleTextStyle.color }"
          >
            <p
              :class="[
                'parent-name-text leading-normal text-center opacity-90',
                getKhmerClass(currentLanguage),
              ]"
              :style="titleTextStyle"
            >
              <span
                v-for="(word, index) in splitToWords(leftHostTitle)"
                :key="`title-left-${currentLanguage}-${index}`"
                class="bounce-word"
                :style="{ animationDelay: `${animationDelays.titleLeft + wordCascadeDelay(index)}s` }"
                >{{ word
                }}{{ index < splitToWords(leftHostTitle).length - 1 ? '\u00A0' : '' }}</span
              >
            </p>
          </InlineEditableText>
        </div>
        <div class="center-spacer"></div>
        <div class="host-title-right">
          <InlineEditableText
            v-if="hosts.length > 1"
            :value="rightHostTitle"
            :target="{ kind: 'host', hostId: hosts[1]?.id ?? 0, field: 'title' }"
            :input-style="{ fontFamily: titleTextStyle.fontFamily, color: titleTextStyle.color }"
          >
            <p
              :class="[
                'parent-name-text leading-normal text-center opacity-90',
                getKhmerClass(currentLanguage),
              ]"
              :style="titleTextStyle"
            >
              <span
                v-for="(word, index) in splitToWords(rightHostTitle)"
                :key="`title-right-${currentLanguage}-${index}`"
                class="bounce-word"
                :style="{ animationDelay: `${animationDelays.titleRight + wordCascadeDelay(index)}s` }"
                >{{ word
                }}{{ index < splitToWords(rightHostTitle).length - 1 ? '\u00A0' : '' }}</span
              >
            </p>
          </InlineEditableText>
        </div>
      </div>

      <!-- Row 6: Host Names -->
      <div v-if="hosts.length > 0" class="name-row">
        <div class="host-name-left">
          <InlineEditableText
            :value="hosts[0].name"
            :target="{ kind: 'host', hostId: hosts[0].id, field: 'name' }"
            :input-style="{ fontFamily: nameTextStyle.fontFamily, color: nameTextStyle.color }"
          >
            <h3
              :class="['host-name-text font-regular leading-tight', getKhmerClass(currentLanguage)]"
              :style="nameTextStyle"
            >
              <span
                v-for="(word, index) in splitToWords(hosts[0].name)"
                :key="`name-left-${currentLanguage}-${index}`"
                class="bounce-word"
                :style="{ animationDelay: `${animationDelays.nameLeft + wordCascadeDelay(index)}s` }"
                >{{ word
                }}{{ index < splitToWords(hosts[0].name).length - 1 ? '\u00A0' : '' }}</span
              >
            </h3>
          </InlineEditableText>
        </div>
        <div class="center-spacer"></div>
        <div class="host-name-right">
          <InlineEditableText
            v-if="hosts.length > 1"
            :value="hosts[1]?.name"
            :target="{ kind: 'host', hostId: hosts[1]?.id ?? 0, field: 'name' }"
            :input-style="{ fontFamily: nameTextStyle.fontFamily, color: nameTextStyle.color }"
          >
            <h3
              :class="['host-name-text font-regular leading-tight', getKhmerClass(currentLanguage)]"
              :style="nameTextStyle"
            >
              <span
                v-for="(word, index) in splitToWords(hosts[1]?.name)"
                :key="`name-right-${currentLanguage}-${index}`"
                class="bounce-word"
                :style="{ animationDelay: `${animationDelays.nameRight + wordCascadeDelay(index)}s` }"
                >{{ word
                }}{{ index < splitToWords(hosts[1]?.name).length - 1 ? '\u00A0' : '' }}</span
              >
            </h3>
          </InlineEditableText>
        </div>
      </div>

      <!-- Row 7: Host Profile Pictures. In the preview editor a host with no
           photo yet still gets an (empty) avatar so the slot is visible and
           clickable — see showProfilePictures. -->
      <div v-if="showProfilePictures" class="profile-picture-row">
        <div class="host-profile-left">
          <EditableRegion
            :intent="{ kind: 'hostImage', hostId: hosts[0].id }"
            :label="hosts[0].profile_image ? undefined : addPhotoLabel"
          >
            <HostProfilePicture
              :key="`profile-left-${currentLanguage}`"
              :image-url="hosts[0].profile_image"
              :alt="`${hosts[0].name} profile`"
              :background-color="primaryColor"
              :animated="true"
              :animation-delay="animationDelays.profileLeft"
              :wrapper-class="hosts[0].profile_image ? '' : 'photo-placeholder'"
            />
          </EditableRegion>
        </div>
        <div class="center-spacer"></div>
        <div class="host-profile-right">
          <EditableRegion
            v-if="hosts.length > 1"
            :intent="{ kind: 'hostImage', hostId: hosts[1]?.id ?? 0 }"
            :label="hosts[1]?.profile_image ? undefined : addPhotoLabel"
          >
            <HostProfilePicture
              :key="`profile-right-${currentLanguage}`"
              :image-url="hosts[1]?.profile_image"
              :alt="`${hosts[1]?.name} profile`"
              :background-color="primaryColor"
              :animated="true"
              :animation-delay="animationDelays.profileRight"
              :wrapper-class="hosts[1]?.profile_image ? '' : 'photo-placeholder'"
            />
          </EditableRegion>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { HostInfoProps } from '@/types/showcase'
import { useAppLanguage } from '@/composables/useAppLanguage'
import InlineEditableText from '@/components/showcase-preview/edit/InlineEditableText.vue'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import {
  WelcomeHeader,
  HostLogo,
  HostProfilePicture,
  AutoFitText,
  splitToWords,
  getKhmerClass,
  ANIMATION_CONSTANTS,
  wordCascadeDelay,
  getTextAnimationDuration,
} from './shared'

const props = defineProps<HostInfoProps>()

// Only provided by the editable manage-page preview frame — undefined on the
// public showcase, so the empty avatar slots below can never reach guests.
const editIntentCtx = inject(EditIntentKey, undefined)
const { t: tApp } = useAppLanguage()

const addPhotoLabel = computed(() => tApp('management.showcasePreview.editors.addHostPhoto'))

const WORD_DELAY = ANIMATION_CONSTANTS.WORD_DELAY
const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP

// Computed visibility flags
const showParentARow = computed(
  () =>
    props.hosts.length > 0 &&
    (props.hosts[0].parent_a_name ||
      props.hosts[0].parent_b_name ||
      (props.hosts.length > 1 && (props.hosts[1]?.parent_a_name || props.hosts[1]?.parent_b_name))),
)

const showParentBRow = computed(
  () =>
    props.hosts.length > 0 &&
    ((props.hosts[0].parent_b_name && props.hosts[0].parent_a_name) ||
      (props.hosts.length > 1 && props.hosts[1]?.parent_b_name && props.hosts[1]?.parent_a_name)),
)

// The portrait row is a matched pair by design, so it stays two-hosts-only.
// What differs by context is the missing-photo case: guests only see the row
// once both portraits exist (one photo beside an empty circle reads as broken),
// while the preview editor always gets it so an organizer with no host photos
// yet can still see — and click — where they go.
const showProfilePictures = computed(() => {
  if (props.hosts.length !== 2) return false
  if (editIntentCtx) return true
  return !!(props.hosts[0].profile_image && props.hosts[1].profile_image)
})

// Host titles with defaults
const leftHostTitle = computed(
  () =>
    props.hosts[0]?.title ||
    (props.hosts.length === 2 ? 'Bridegroom' : props.hosts.length === 1 ? 'Host' : 'Host 1'),
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
    props.showWelcomeHeaderText === false
      ? undefined
      : props.welcomeMessage || 'Welcome to Our Event',
  )
  const parentALeft = getNextDelay(props.hosts[0]?.parent_a_name || props.hosts[0]?.parent_b_name)
  const parentARight = getNextDelay(
    props.hosts.length > 1 ? props.hosts[1]?.parent_a_name || props.hosts[1]?.parent_b_name : null,
  )
  const parentBLeft = getNextDelay(
    props.hosts[0]?.parent_b_name && props.hosts[0]?.parent_a_name
      ? props.hosts[0].parent_b_name
      : null,
  )
  const parentBRight = getNextDelay(
    props.hosts.length > 1 && props.hosts[1]?.parent_b_name && props.hosts[1]?.parent_a_name
      ? props.hosts[1].parent_b_name
      : null,
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

/* Preview editor only: the empty avatar standing in for a host photo that
   hasn't been uploaded yet. The dashed ring (preview accent, same language as
   EditableRegion's outline) marks it as a slot to fill rather than something
   guests already see. Reached with :deep() because the class lands on
   HostProfilePicture's inner fallback element, not its scoped root. */
.host-profile-left :deep(.photo-placeholder),
.host-profile-right :deep(.photo-placeholder) {
  outline: 1.5px dashed rgba(30, 144, 255, 0.6);
  outline-offset: 2px;
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
