<template>
  <div
    class="host-info-wrapper"
    :class="{ 'khmer-text': currentLanguage === 'kh' }"
    :style="blockOffsetVars"
  >
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

      <!-- Matched to the cover's host names (host_info_design.sync_cover_names):
           the same hosts, split and joined the way the cover's names block does
           it — its arrangement, its line under each name, its mark (the
           uploaded one included), its capitals, and the names' fonts and colour.
           The rules are the cover's own functions (coverDetails.ts) and the look
           arrives as the cover's own variables (`coverHostNames.vars`), so the
           expressions below are CoverDetailBlocks' expressions, not a copy of
           its decisions. Only the size and the entrance are this design's: the
           names run on its type ladder and bounce in word by word like the
           rest of the invitation. -->
      <!-- A wrapper, so the block's own spacing is not measured into anything
           the names are sized against: their size is a share of the STAGE
           (`--cover-stage-w`), which is what the cover sizes its names by. -->
      <div v-if="coverHostNames" class="synced-names-frame">
      <div
        class="synced-names"
        :class="`synced-names--${coverHostNames.details.hostArrangement}`"
        :style="syncedNamesStyle"
      >
        <template v-for="(host, index) in syncedHostLines" :key="host.id">
          <span
            v-if="index > 0"
            class="bounce-word synced-sep"
            :style="{ animationDelay: `${host.separatorDelay}s` }"
          >
            <HostSeparatorMark
              :kind="coverHostNames.details.separator"
              :image-url="coverHostNames.separatorImageUrl"
              :word="syncedJoinerWord"
              :color="syncedSeparatorColor"
              :icon-color="syncedSeparatorIconColor"
              :font-family="syncedNamesFont"
              :finish-class="fx(coverHostNames.namesSlot)"
              :capitals="takesCapitals(coverHostNames.details.capitals, syncedJoinerWord)"
              :scale="coverHostNames.details.separatorScale"
            />
          </span>
          <div class="synced-host">
            <!-- The whole name is the edit target even when it is drawn split
                 over two lines: the split is presentation, the record is one
                 field. -->
            <InlineEditableText
              :value="host.fullName"
              :target="{ kind: 'host', hostId: host.id, field: 'name' }"
              :input-style="{ fontFamily: syncedNamesFont }"
            >
              <h2
                class="synced-name"
                :class="[fx(coverHostNames.namesSlot), syncedRunClass(host.name)]"
                :style="{ fontFamily: syncedNamesFont }"
              >
                <span
                  v-for="(word, wordIndex) in host.words"
                  :key="`synced-name-${currentLanguage}-${host.id}-${wordIndex}`"
                  class="bounce-word"
                  :style="{ animationDelay: `${host.nameDelay + wordCascadeDelay(wordIndex)}s` }"
                  ><span class="tfx-ink">{{ word
                  }}{{ wordIndex < host.words.length - 1 ? ' ' : '' }}</span></span
                >
              </h2>
              <p
                v-if="host.subline && coverHostNames.details.hostSubline === 'surname'"
                class="synced-sub"
                :class="syncedRunClass(host.subline)"
                :style="{ fontFamily: syncedSublineFont }"
              >
                <span class="bounce-word" :style="{ animationDelay: `${host.sublineDelay}s` }">{{
                  host.subline
                }}</span>
              </p>
            </InlineEditableText>
            <InlineEditableText
              v-if="host.subline && coverHostNames.details.hostSubline === 'title'"
              :value="host.subline"
              :target="{ kind: 'host', hostId: host.id, field: 'title' }"
              :input-style="{ fontFamily: syncedSublineFont }"
            >
              <p
                class="synced-sub"
                :class="syncedRunClass(host.subline)"
                :style="{ fontFamily: syncedSublineFont }"
              >
                <span class="bounce-word" :style="{ animationDelay: `${host.sublineDelay}s` }">{{
                  host.subline
                }}</span>
              </p>
            </InlineEditableText>
          </div>
        </template>
      </div>
      </div>

      <div v-else :class="['simple-names', getKhmerClass(currentLanguage)]">
        <InlineEditableText
          :value="hosts[0].name"
          :target="{ kind: 'host', hostId: hosts[0].id, field: 'name' }"
          :input-style="{ fontFamily: simpleNameStyle.fontFamily, color: simpleNameStyle.color }"
        >
          <h2
            v-if="hosts.length > 0"
            class="simple-name-text leading-tight"
            :class="fx('primary')"
            :style="simpleNameStyle"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[0].name)"
              :key="`simple-name-left-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${simpleAnimationDelays.nameLeft + wordCascadeDelay(index)}s` }"
              ><span class="tfx-ink">{{ word }}{{ index < splitToWords(hosts[0].name).length - 1 ? ' ' : '' }}</span></span
            >
          </h2>
        </InlineEditableText>

        <div v-if="hosts.length > 1" class="simple-amp" :class="fx('primary')" :style="simpleNameStyle">
          <span class="bounce-word" :style="{ animationDelay: `${simpleAnimationDelays.amp}s` }"
            ><span class="tfx-ink">&amp;</span></span
          >
        </div>

        <InlineEditableText
          v-if="hosts.length > 1"
          :value="hosts[1]?.name"
          :target="{ kind: 'host', hostId: hosts[1]?.id ?? 0, field: 'name' }"
          :input-style="{ fontFamily: simpleNameStyle.fontFamily, color: simpleNameStyle.color }"
        >
          <h2 class="simple-name-text leading-tight" :class="fx('primary')" :style="simpleNameStyle">
            <span
              v-for="(word, index) in splitToWords(hosts[1]?.name)"
              :key="`simple-name-right-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{
                animationDelay: `${simpleAnimationDelays.nameRight + wordCascadeDelay(index)}s`,
              }"
              ><span class="tfx-ink">{{ word }}{{ index < splitToWords(hosts[1]?.name).length - 1 ? ' ' : '' }}</span></span
            >
          </h2>
        </InlineEditableText>
      </div>
    </div>

    <!-- Arch design: the V2 couple-story composition — two arch-framed
         portraits on a diagonal, each host's label / name / parents stacked
         under their own frame. Its own component, because it shares no rows
         with the grid below. -->
    <HostInfoWeddingArch v-else-if="isArchDesign" v-bind="props" />

    <!-- Crest design: the Khmer wedding-card order — crest, the two sets of
         parents, the invitation sentence, then the couple either side of a
         breakline. Its own component for the same reason arch is: it shares no
         rows with the grid below, and the order is the whole design. -->
    <HostInfoWeddingCrest v-else-if="isCrestDesign" v-bind="props" />

    <!-- Standard design (default): rich layout with parent names, logo, titles,
         host names and profile pictures arranged in a 7-row grid.

         The portrait design is these same seven rows with two of them swapped
         (see .is-portrait in <style>) rather than a second copy of this markup:
         title, then face, then name. -->
    <div
      v-else
      class="host-info-grid"
      :class="{
        'is-portrait': isPortraitDesign,
        'has-ornament': coupleOrnament !== 'none',
        'has-frame': frameStyle !== 'none',
        'has-frame-tall': frameStyle === 'laurel',
      }"
    >
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
                font-slot="primary"
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
                font-slot="primary"
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
                font-slot="primary"
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
                font-slot="primary"
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
          :scale="logoScale ?? 100"
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
            <HostTitleFrame
              :frame="frameStyle"
              :accent-color="accentColor"
              :primary-color="primaryColor"
            >
              <p
                :class="[
                  'parent-name-text leading-normal text-center opacity-90',
                  getKhmerClass(currentLanguage),
                  fx('secondary'),
                ]"
                :style="titleTextStyle"
              >
                <span
                  v-for="(word, index) in splitToWords(leftHostTitle)"
                  :key="`title-left-${currentLanguage}-${index}`"
                  class="bounce-word"
                  :style="{ animationDelay: `${animationDelays.titleLeft + wordCascadeDelay(index)}s` }"
                  ><span class="tfx-ink">{{ word
                  }}{{ index < splitToWords(leftHostTitle).length - 1 ? '\u00A0' : '' }}</span></span
                >
              </p>
            </HostTitleFrame>
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
            <HostTitleFrame
              :frame="frameStyle"
              :accent-color="accentColor"
              :primary-color="primaryColor"
            >
              <p
                :class="[
                  'parent-name-text leading-normal text-center opacity-90',
                  getKhmerClass(currentLanguage),
                  fx('secondary'),
                ]"
                :style="titleTextStyle"
              >
                <span
                  v-for="(word, index) in splitToWords(rightHostTitle)"
                  :key="`title-right-${currentLanguage}-${index}`"
                  class="bounce-word"
                  :style="{ animationDelay: `${animationDelays.titleRight + wordCascadeDelay(index)}s` }"
                  ><span class="tfx-ink">{{ word
                  }}{{ index < splitToWords(rightHostTitle).length - 1 ? '\u00A0' : '' }}</span></span
                >
              </p>
            </HostTitleFrame>
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
              :class="['host-name-text font-regular leading-tight', getKhmerClass(currentLanguage), fx('primary')]"
              :style="nameTextStyle"
            >
              <span
                v-for="(word, index) in splitToWords(hosts[0].name)"
                :key="`name-left-${currentLanguage}-${index}`"
                class="bounce-word"
                :style="{ animationDelay: `${animationDelays.nameLeft + wordCascadeDelay(index)}s` }"
                ><span class="tfx-ink">{{ word
                }}{{ index < splitToWords(hosts[0].name).length - 1 ? '\u00A0' : '' }}</span></span
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
              :class="['host-name-text font-regular leading-tight', getKhmerClass(currentLanguage), fx('primary')]"
              :style="nameTextStyle"
            >
              <span
                v-for="(word, index) in splitToWords(hosts[1]?.name)"
                :key="`name-right-${currentLanguage}-${index}`"
                class="bounce-word"
                :style="{ animationDelay: `${animationDelays.nameRight + wordCascadeDelay(index)}s` }"
                ><span class="tfx-ink">{{ word
                }}{{ index < splitToWords(hosts[1]?.name).length - 1 ? '\u00A0' : '' }}</span></span
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
            <HostAvatarFrame
              :frame="frameStyle"
              :accent-color="accentColor"
              :primary-color="primaryColor"
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
            </HostAvatarFrame>
          </EditableRegion>
        </div>
        <!-- The one row whose centre track carries something. The spacer exists
             in every row and has always been empty; the motif goes here because
             this is the row it belongs between — beside the faces, not beside
             the titles or the names. -->
        <div class="center-spacer center-spacer--ornament">
          <CoupleOrnamentMark
            v-if="coupleOrnament !== 'none'"
            :ornament="coupleOrnament"
            :color="accentColor || primaryColor"
            :animated="true"
            :animation-delay="animationDelays.profileLeft"
          />
        </div>
        <div class="host-profile-right">
          <EditableRegion
            v-if="hosts.length > 1"
            :intent="{ kind: 'hostImage', hostId: hosts[1]?.id ?? 0 }"
            :label="hosts[1]?.profile_image ? undefined : addPhotoLabel"
          >
            <HostAvatarFrame
              :frame="frameStyle"
              :accent-color="accentColor"
              :primary-color="primaryColor"
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
            </HostAvatarFrame>
          </EditableRegion>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { HostInfoProps } from '@/types/showcase'
import type { HostFrameStyle, CoupleOrnament } from '@/services/api/types/template.types'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useTextEffect, useTextEffectMarkInk } from '@/composables/showcase/useTextEffects'
import {
  COVER_FONT_SLOT_VARS,
  coverColorSourceValue,
} from '@/composables/showcase/useCoverStageLayout'
import HostSeparatorMark from '../cover/HostSeparatorMark.vue'
import {
  coverHostLines,
  hasKhmerScript,
  hostCountScale,
  hostJoinerWord,
  selectCoverHosts,
  takesCapitals,
} from '../cover/coverDetails'
import InlineEditableText from '@/components/showcase-preview/edit/InlineEditableText.vue'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { PreviewFrameKey } from '@/components/showcase-preview/previewContext'
import HostInfoWeddingArch from './wedding/HostInfoWeddingArch.vue'
import HostInfoWeddingCrest from './wedding/HostInfoWeddingCrest.vue'
import HostTitleFrame from './shared/frames/HostTitleFrame.vue'
import HostAvatarFrame from './shared/frames/HostAvatarFrame.vue'
import CoupleOrnamentMark from './shared/frames/CoupleOrnamentMark.vue'
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
// Present in every preview frame, editable or not. See previewContext.ts.
const previewCtx = inject(PreviewFrameKey, undefined)
const { t: tApp } = useAppLanguage()
// Metallic lettering per font slot. Names are primary, titles secondary.
const fx = useTextEffect()
const markInk = useTextEffectMarkInk()

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
// while any preview always gets it — an organizer with no host photos yet can
// still see (and, when editable, click) where they go, and a partner choosing a
// frame style can see the frame at all.
//
// Keyed off the preview context rather than the edit one. Those coincided until
// the partner-template preview arrived: it renders this frame with
// `canEdit: false`, so gating on `editIntentCtx` hid the whole row there — which
// took the avatar frames and the centre ornament with it, on every design.
const showProfilePictures = computed(() => {
  if (props.hosts.length !== 2) return false
  if (previewCtx || editIntentCtx) return true
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

// Active design. 'simple' renders the minimal welcome + script-names layout;
// 'arch' and 'crest' each hand off to their own component; 'portrait' is the
// standard grid with the portrait row moved between the titles and the names,
// so it stays here. Anything else falls back to the rich 'standard' grid below.
const isSimpleDesign = computed(() => props.designType === 'simple')
const isArchDesign = computed(() => props.designType === 'arch')
const isCrestDesign = computed(() => props.designType === 'crest')
const isPortraitDesign = computed(() => props.designType === 'portrait')

// Frame chrome and the centre motif, normalised once here so the template never
// has to reason about `undefined`. Both default to 'none', which is what every
// template that predates these fields has — so `standard` and `portrait` render
// exactly as they did before, and frames are opt-in rather than a new baseline.
const frameStyle = computed<HostFrameStyle>(() => props.frameStyle ?? 'none')
const coupleOrnament = computed<CoupleOrnament>(() => props.coupleOrnament ?? 'none')

/**
 * Where the host block starts, applied once here rather than inside each
 * design.
 *
 * This wrapper is the only element every wedding design shares — `arch` and
 * `crest` are components of their own, `simple` and the grid are branches of
 * this template — so one rule here is the whole feature, and putting it in each
 * design would be four copies that drift.
 *
 * Split across two properties because one cannot carry both directions:
 * **padding cannot be negative** (the declaration is simply dropped, so a
 * negative offset would silently do nothing), and a positive margin is
 * collapsible in a way the partner would experience as the control sometimes
 * working and sometimes not. So down is padding, up is margin, and exactly one
 * of the two is ever non-zero.
 */
const blockOffsetVars = computed(() => {
  const offset = props.topOffset ?? 0
  return {
    paddingTop: `${Math.max(offset, 0)}rem`,
    marginTop: `${Math.min(offset, 0)}rem`,
  }
})

// Script-name styling for the simple design — uses the primary (typically script)
// font and the theme accent color, matching the standard layout's host names.
const simpleNameStyle = computed(() => ({
  color: props.primaryColor,
  fontFamily: props.primaryFont || props.secondaryFont || props.currentFont,
}))

// When the simple design's names begin: after the welcome header, when there is
// one. Shared by its own names and by the cover-matched ones below.
const simpleNamesStart = computed(() => {
  const welcomeText =
    props.showWelcomeHeaderText === false
      ? ''
      : props.welcomeMessage || 'You Are Invited to Our Wedding'
  return welcomeText ? 0.1 + getTextAnimationDuration(welcomeText) + ELEMENT_GAP : 0.1
})

// Animation delays for the simple design: welcome → first name → ampersand →
// second name. Mirrors the standard layout's sequential cascade so the two
// designs feel consistent when switching templates.
const simpleAnimationDelays = computed(() => {
  let cursor = simpleNamesStart.value

  const nameLeft = cursor
  cursor += getTextAnimationDuration(props.hosts[0]?.name) + ELEMENT_GAP
  const amp = cursor
  if (props.hosts.length > 1) cursor += 0.2
  const nameRight = cursor

  return { nameLeft, amp, nameRight }
})

// ---------------------------------------------------------------------------
// The simple design matched to the cover's host names. Every value below is the
// one CoverDetailBlocks computes for the same names, from the same binding —
// the `var()`s resolve because `coverHostNames.vars` publishes the cover's slot
// and block variables on this block's root.
// ---------------------------------------------------------------------------
const syncedNamesFont = computed(
  () => `var(--cover-block-font, ${props.primaryFont || props.currentFont})`,
)

// Its own slot, else the reading face whatever the names are set in — a script
// caption under a script name is illegible. The cover's rule, verbatim.
const syncedSublineFont = computed(() => {
  const reading = props.secondaryFont || props.currentFont
  const slot = props.coverHostNames?.sublineStyle.fontType
  return slot ? `var(${COVER_FONT_SLOT_VARS[slot]}, ${reading})` : reading
})

const syncedSeparatorColor = computed(() => {
  const details = props.coverHostNames?.details
  const accent = props.accentColor || props.primaryColor
  return details
    ? coverColorSourceValue(details.separatorColorSource, details.separatorCustomColor, accent)
    : accent
})

const syncedSeparatorIconColor = computed(
  () => markInk(props.coverHostNames?.namesSlot) ?? syncedSeparatorColor.value,
)

const syncedJoinerWord = computed(() => hostJoinerWord(props.currentLanguage))

/**
 * Each host the cover would name, split the way it splits them, with this
 * design's cascade: a name's words bounce in, its small line follows it, and a
 * mark precedes every name after the first — the order the default names use
 * (name, ampersand, name), carried to any number of hosts.
 */
const syncedHostLines = computed(() => {
  const binding = props.coverHostNames
  if (!binding) return []
  let cursor = simpleNamesStart.value
  return selectCoverHosts(props.hosts, binding.details.hostCount).map((host, index) => {
    const lines = coverHostLines(host, binding.details.hostSubline)
    const separatorDelay = cursor
    if (index > 0) cursor += 0.2
    const nameDelay = cursor
    const nameDuration = getTextAnimationDuration(lines.name)
    const sublineDelay = nameDelay + nameDuration
    cursor += nameDuration + (lines.subline ? 0.15 : 0) + ELEMENT_GAP
    return {
      id: host.id,
      fullName: host.name,
      ...lines,
      words: splitToWords(lines.name),
      separatorDelay,
      nameDelay,
      sublineDelay,
    }
  })
})

const syncedNamesStyle = computed(() => ({
  ...props.coverHostNames?.vars,
  color: `var(--cover-block-color, ${props.primaryColor})`,
  '--synced-count-scale': `${hostCountScale(
    syncedHostLines.value.length,
    props.coverHostNames?.details.hostArrangement ?? 'stacked',
  )}`,
  // The names' own Size % rides in on `vars` as `--cover-font-scale`; the small
  // line's is separate, because it is a text of its own on the cover too.
  '--synced-sub-scale': `${props.coverHostNames?.sublineStyle.fontScale ?? 1}`,
}))

/**
 * Per run of text, as on the cover: spaced capitals when the template asks for
 * them and the run is not Khmer, and the taller leading Khmer needs when it is.
 * Per run rather than per block, because a Khmer showcase can still carry a
 * host whose name was typed in Latin letters.
 */
const syncedRunClass = (text: string | null): Record<string, boolean> => ({
  'synced-caps': !!text && takesCapitals(props.coverHostNames?.details.capitals ?? false, text),
  'synced-khmer': !!text && hasKhmerScript(text),
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

  // The portrait design renders the faces between the titles and the names, so
  // its cascade has to reveal them in that order too — reusing the standard
  // timings here would name each host before showing them, and leave the
  // portraits arriving last under text that has already settled.
  let profileLeft: number
  let profileRight: number
  let nameLeft: number
  let nameRight: number

  if (isPortraitDesign.value) {
    profileLeft = currentDelay
    currentDelay += 0.15
    profileRight = currentDelay
    currentDelay += 0.3
    nameLeft = getNextDelay(props.hosts[0]?.name)
    nameRight = getNextDelay(props.hosts.length > 1 ? props.hosts[1]?.name : null)
  } else {
    nameLeft = getNextDelay(props.hosts[0]?.name)
    nameRight = getNextDelay(props.hosts.length > 1 ? props.hosts[1]?.name : null)
    profileLeft = currentDelay
    currentDelay += 0.15
    profileRight = currentDelay
  }

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

/* One size for the motif, read by both the track that holds it and the drawing
   itself, so the two can never disagree. CoupleOrnamentMark carries the same
   value as its own fallback for use outside this grid. */
.host-info-grid {
  --ornament-size: clamp(26px, 8vw, 46px);
  --ornament-track: calc(var(--ornament-size) + 0.7rem);
}

/* **Every** row's centre track widens, not just the one carrying the motif.
   Each row is its own `1fr auto 1fr` grid, so the `1fr` columns are only as
   wide as that row's centre track leaves them — widening one row alone gives it
   different column widths from the others, and the title and name end up
   centred on a different axis than the avatar directly below them. Sharing one
   width keeps all four rows on one geometry, which is the only thing that keeps
   the block vertically aligned.

   Specificity is deliberate: host-info-base.css pins this element with
   `.center-spacer` and again with `.khmer-text .center-spacer`, and the second
   is 0-3-0 once scoped. A single class loses to it, the track snaps back to a
   fixed width, and the motif — a flex item — silently shrinks to fit rather
   than overflowing. Measured at 4.8px in Khmer while English rendered fine.
   `.host-info-grid.has-ornament` matches that 0-3-0 and wins on source order,
   since this file's rules come after the `@import`. */
.host-info-grid.has-ornament .center-spacer {
  width: var(--ornament-track);
}

.center-spacer--ornament {
  display: flex;
  align-items: center;
  justify-content: center;
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
   Portrait design — the standard seven rows, with the face moved
   between the title and the name.

   Why order and not a second template: the two designs differ by
   the position of one row out of seven. Forking the markup would
   duplicate ~190 lines of grid, editable regions and per-word
   animation bindings, and every later fix would have to be made
   twice. `order` moves the row and leaves one source of truth.
   nth-child still counts source order, so the parent-row spacing
   rules above are unaffected.
   ============================================================ */
.is-portrait .profile-picture-row {
  order: 1;
}

.is-portrait .name-row {
  order: 2;
}

/* The negative margins above are tuned for a title sitting directly over a
   name. In this order the face separates them, so both rows get their own
   air back. */
.is-portrait .profile-picture-row {
  margin-top: 0.35rem;
}

.is-portrait .name-row {
  margin-top: 0.35rem;
}

.khmer-text .is-portrait .name-row,
.khmer-text .is-portrait .profile-picture-row {
  margin-top: 0.25rem;
}

/* Khmer, portrait, framed avatar only: close the gap the frame opens under the
   portrait.

   `.avatar-frame` carries vertical padding so the row — which is
   `overflow: hidden` and exactly as tall as its content — doesn't clip the
   rings, tails and wreath. That padding is language-neutral and adds the same
   ~23px (or ~49px under laurel) either way, but Khmer starts ~9px wider to
   begin with, because `.khmer-text-fix` gives the name its own vertical padding
   on top of a 1.8 line-height. Unframed that lands at a comfortable ~17px;
   framed the two stack into 40px and the name reads as belonging to nothing.

   The pull is on the *name row*, never on the frame: a negative margin on the
   frame would shrink the profile row and clip the chrome straight back off. The
   two values track the two padding sizes, so what's left below the visible
   chrome is about the same ~18-20px in both cases — and in the unframed case
   too, which is the gap that already reads correctly. */
.khmer-text .is-portrait.has-frame .name-row {
  margin-top: -0.6rem;
}

.khmer-text .is-portrait.has-frame-tall .name-row {
  margin-top: -0.9rem;
}

/* Standard ends on the portraits, so they carry the block and run large. Here
   the name is the closer, and a 75% circle above it would outweigh it — step
   the portrait down, and give the name back the weight it now has to carry,
   so the eye lands on it last instead of sliding off the photo. */
.is-portrait .host-name-text {
  font-size: 1.0625em;
  font-weight: 500;
}

.is-portrait .host-profile-left :deep(.profile-picture-wrapper),
.is-portrait .host-profile-left :deep(.profile-picture-fallback),
.is-portrait .host-profile-right :deep(.profile-picture-wrapper),
.is-portrait .host-profile-right :deep(.profile-picture-fallback) {
  width: 62%;
}

@media (min-width: 1920px) {
  .is-portrait .host-profile-left :deep(.profile-picture-wrapper),
  .is-portrait .host-profile-left :deep(.profile-picture-fallback),
  .is-portrait .host-profile-right :deep(.profile-picture-wrapper),
  .is-portrait .host-profile-right :deep(.profile-picture-fallback) {
    width: 52%;
  }
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

/* ============================================================
   Simple design, matched to the cover's host names. The
   composition is the cover's (.cdb-hosts in CoverDetailBlocks);
   the size is this design's — the simple names' own ladder,
   stepping down as more names share the block, exactly as the
   cover's names do. Everything else is sized in em of the names,
   so the mark and the small line follow that one number.
   ============================================================ */
.synced-names-frame {
  width: 100%;
  margin-top: 0.75rem;
}

.synced-names {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  /* The cover's own expression for these names, against the same reference: the
     cover measures 6.4% of the STAGE's width (`6.4cqw` of `.cdb`), and
     `--cover-stage-w` is that stage, measured by MainContentStage. Sizing off
     this block instead drew them a card's-width smaller — the card is inset
     within the stage — which is what "the size is not synced" looked like.
     `100vw` only as the fallback: it is the stage on a phone, and is only
     reached before the first measurement. */
  font-size: calc(
    clamp(1rem, var(--cover-stage-w, 100vw) * 0.064, 3.2rem) * var(--cover-font-scale, 1) *
      var(--synced-count-scale, 1)
  );
}

.synced-names--stacked {
  flex-direction: column;
  row-gap: 0.18em;
}

/* Baseline, so the mark sits on the names' line rather than centred between a
   name and its small line underneath. */
.synced-names--inline {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.4em;
  row-gap: 0.2em;
}

/* A drawn motif's baseline is its bottom edge, which would stand it a full
   motif-height above the names' letters. */
.synced-names--inline :deep(.hsm-icon),
.synced-names--inline :deep(.hsm-image) {
  margin-bottom: -0.2em;
}

.synced-host {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  max-width: 100%;
}

.synced-name {
  margin: 0;
  font-size: 1em;
  font-weight: 400;
  line-height: 1.05;
  text-align: center;
  word-break: break-word;
}

/* Sized off the block, not in em of the name above it — the cover's rule, for
   the cover's reason: the two are set on their own, and an em-sized caption
   would grow every time the names did. It still steps down with the host count,
   alongside the names it captions, and carries the small line's own Size %. */
.synced-sub {
  margin: 0.3em 0 0;
  font-size: calc(
    clamp(0.6rem, var(--cover-stage-w, 100vw) * 0.023, 1.15rem) * var(--synced-sub-scale, 1) *
      var(--synced-count-scale, 1)
  );
  line-height: 1.35;
  text-align: center;
  opacity: 0.82;
}

/* Spaced capitals. Tracking also lands after the last letter, which pulls
   centred text off-centre by half of it; the start padding pays it back. */
.synced-caps {
  text-transform: uppercase;
  letter-spacing: var(--synced-track, 0.12em);
  padding-inline-start: var(--synced-track, 0.12em);
}

.synced-sub.synced-caps {
  --synced-track: 0.26em;
}

/* Coeng subscripts and stacked vowels need room a Latin line doesn't. */
.synced-name.synced-khmer {
  line-height: 1.35;
}

.synced-sub.synced-khmer {
  line-height: 1.7;
}

</style>
