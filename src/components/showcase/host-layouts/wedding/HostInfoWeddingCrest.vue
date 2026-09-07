<template>
  <div
    class="host-info-grid crest-layout"
    :class="{ 'khmer-text': currentLanguage === 'kh', 'has-ornament': coupleOrnament !== 'none' }"
    :style="rootVars"
  >
    <!-- 1. The crest. First, and sized by the template rather than by the
         breakpoint alone: on this design it is the only thing above the fold of
         the card, so how much room it claims is a composition decision the
         partner makes, not a constant. -->
    <div class="crest-logo">
      <EditableRegion :intent="{ kind: 'eventLogo' }">
        <HostLogo
          :key="`crest-logo-${currentLanguage}`"
          :logo-url="logoUrl"
          :sample-logo-one="sampleLogoOne"
          :primary-color="primaryColor"
          :scale="resolvedLogoScale"
          logo-row-class=""
          :animated="true"
          :animation-delay="delays.logo"
        />
      </EditableRegion>
    </div>

    <!-- 2. Who is inviting — the standard design's two parent rows, class for
         class. Type scale, leading and row rhythm all come from
         host-info-base.css rather than from a second ladder of this design's
         own, so the two designs cannot drift apart on a breakpoint. -->
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
              :base-delay="delays.parentALeft"
              :word-delay="WORD_DELAY"
              :key-prefix="`crest-parent-a-left-${currentLanguage}`"
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
              :base-delay="delays.parentARight"
              :word-delay="WORD_DELAY"
              :key-prefix="`crest-parent-a-right-${currentLanguage}`"
            />
          </InlineEditableText>
        </div>
      </div>
    </div>

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
              :base-delay="delays.parentBLeft"
              :word-delay="WORD_DELAY"
              :key-prefix="`crest-parent-b-left-${currentLanguage}`"
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
              :base-delay="delays.parentBRight"
              :word-delay="WORD_DELAY"
              :key-prefix="`crest-parent-b-right-${currentLanguage}`"
            />
          </InlineEditableText>
        </div>
      </div>
    </div>

    <!-- 3. The invitation itself, in the slot the welcome header occupies on
         every other design. This design has no welcome header: the sentence
         that invites people IS the headline here, and a greeting above it would
         be a second one saying less. It is the event's `description` text, and
         MainContentStage hands the info card below `undefined` for it while
         this design is active — the text moves up here, it is not duplicated. -->
    <div v-if="descriptionTitle || descriptionText" class="crest-invite">
      <InlineEditableText
        v-if="descriptionTitle"
        :value="descriptionTitle"
        :target="{ kind: 'eventText', textType: 'description', field: 'title' }"
        :input-style="{ fontFamily: primaryFont || currentFont, color: primaryColor }"
      >
        <h2
          :class="['crest-invite-title text-center', getKhmerClass(currentLanguage)]"
          :style="{ fontFamily: primaryFont || currentFont, color: primaryColor }"
        >
          <span
            v-for="(word, index) in splitToWords(descriptionTitle)"
            :key="`crest-invite-title-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${delays.inviteTitle + wordCascadeDelay(index)}s` }"
            >{{ word
            }}{{ index < splitToWords(descriptionTitle).length - 1 ? '\u00A0' : '' }}</span
          >
        </h2>
      </InlineEditableText>

      <InlineEditableText
        v-if="descriptionText"
        :value="descriptionText"
        :target="{ kind: 'eventText', textType: 'description', field: 'content' }"
        :multiline="true"
        :input-style="{ fontFamily: secondaryFont || currentFont, color: primaryColor }"
      >
        <p
          :class="['crest-invite-text text-center', getKhmerClass(currentLanguage)]"
          :style="{
            fontFamily: secondaryFont || currentFont,
            color: primaryColor,
            whiteSpace: 'pre-line',
          }"
        >
          <template
            v-for="(line, lineIndex) in descriptionLines"
            :key="`crest-invite-line-${currentLanguage}-${lineIndex}`"
          >
            <br v-if="lineIndex > 0" />
            <!-- The separator sits OUTSIDE the span, and is a real space rather
                 than the non-breaking space the shared helpers use. Both matter
                 here and nowhere else on this design: every `.bounce-word` is an
                 inline-block, so a space at the *end* of one is dropped by
                 white-space processing and the words run together — and a
                 non-breaking space between them would leave this paragraph, the
                 only long run of prose in the block, unable to wrap at all. -->
            <template
              v-for="(word, wordIndex) in line"
              :key="`crest-invite-${currentLanguage}-${lineIndex}-${wordIndex}`"
            >
              <span
                class="bounce-word"
                :style="{
                  animationDelay: `${delays.invite + wordCascadeDelay(getGlobalWordIndex(descriptionLines, lineIndex, wordIndex))}s`,
                }"
                >{{ word }}</span
              >{{ wordIndex < line.length - 1 ? ' ' : '' }}
            </template>
          </template>
        </p>
      </InlineEditableText>
    </div>

    <!-- 4. The couple, last. Title over name in each column, the shared centre
         motif between them — the same `couple_ornament` the grid designs draw
         beside their avatars, in the one place this design has for it. No
         avatars: this is the crest and the words, and a pair of circles under
         the names would re-open the question the composition just answered. -->
    <div v-if="hosts.length > 0" class="crest-couple" :class="{ 'is-solo': hosts.length < 2 }">
      <div class="crest-host">
        <InlineEditableText
          :value="leftHostTitle"
          :target="{ kind: 'host', hostId: hosts[0].id, field: 'title' }"
          :input-style="{ fontFamily: titleStyle.fontFamily, color: titleStyle.color }"
        >
          <p
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              getKhmerClass(currentLanguage),
            ]"
            :style="titleStyle"
          >
            <span
              v-for="(word, index) in splitToWords(leftHostTitle)"
              :key="`crest-title-left-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${delays.titleLeft + wordCascadeDelay(index)}s` }"
              >{{ word
              }}{{ index < splitToWords(leftHostTitle).length - 1 ? '\u00A0' : '' }}</span
            >
          </p>
        </InlineEditableText>

        <InlineEditableText
          :value="hosts[0].name"
          :target="{ kind: 'host', hostId: hosts[0].id, field: 'name' }"
          :input-style="{ fontFamily: nameStyle.fontFamily, color: nameStyle.color }"
        >
          <h3
            :class="['host-name-text font-regular leading-tight', getKhmerClass(currentLanguage)]"
            :style="nameStyle"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[0].name)"
              :key="`crest-name-left-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${delays.nameLeft + wordCascadeDelay(index)}s` }"
              >{{ word
              }}{{ index < splitToWords(hosts[0].name).length - 1 ? '\u00A0' : '' }}</span
            >
          </h3>
        </InlineEditableText>
      </div>

      <div v-if="hosts.length > 1" class="center-spacer center-spacer--ornament">
        <CoupleOrnamentMark
          v-if="coupleOrnament !== 'none'"
          :ornament="coupleOrnament"
          :color="accentColor || primaryColor"
          :animated="true"
          :animation-delay="delays.ornament"
        />
      </div>

      <div v-if="hosts.length > 1" class="crest-host">
        <InlineEditableText
          :value="rightHostTitle"
          :target="{ kind: 'host', hostId: hosts[1]?.id ?? 0, field: 'title' }"
          :input-style="{ fontFamily: titleStyle.fontFamily, color: titleStyle.color }"
        >
          <p
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              getKhmerClass(currentLanguage),
            ]"
            :style="titleStyle"
          >
            <span
              v-for="(word, index) in splitToWords(rightHostTitle)"
              :key="`crest-title-right-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${delays.titleRight + wordCascadeDelay(index)}s` }"
              >{{ word
              }}{{ index < splitToWords(rightHostTitle).length - 1 ? '\u00A0' : '' }}</span
            >
          </p>
        </InlineEditableText>

        <InlineEditableText
          :value="hosts[1]?.name"
          :target="{ kind: 'host', hostId: hosts[1]?.id ?? 0, field: 'name' }"
          :input-style="{ fontFamily: nameStyle.fontFamily, color: nameStyle.color }"
        >
          <h3
            :class="['host-name-text font-regular leading-tight', getKhmerClass(currentLanguage)]"
            :style="nameStyle"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[1]?.name)"
              :key="`crest-name-right-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${delays.nameRight + wordCascadeDelay(index)}s` }"
              >{{ word
              }}{{ index < splitToWords(hosts[1]?.name).length - 1 ? '\u00A0' : '' }}</span
            >
          </h3>
        </InlineEditableText>
      </div>
    </div>

    <!-- 5. The breakline, closing the block. A horizontal rule under the
         couple, not a divider between them — that position belongs to the
         centre motif above, and the two would only fight for it. Drawn from one
         of five styles, or from the partner's own artwork when they have
         attached some. -->
    <HostBreaklineMark
      class="crest-breakline"
      :breakline="dividerStyle"
      :image-src="resolvedBreaklineImage"
      :color="accentColor || primaryColor"
      :animated="true"
      :animation-delay="delays.breakline"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HostInfoProps } from '@/types/showcase'
import type { CoupleOrnament } from '@/services/api/types/template.types'
import InlineEditableText from '@/components/showcase-preview/edit/InlineEditableText.vue'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import CoupleOrnamentMark from '../shared/frames/CoupleOrnamentMark.vue'
import HostBreaklineMark from '../shared/frames/HostBreaklineMark.vue'
import {
  HostLogo,
  AutoFitText,
  getMediaUrl,
  splitToWords,
  splitToLines,
  getGlobalWordIndex,
  getKhmerClass,
  ANIMATION_CONSTANTS,
  wordCascadeDelay,
  getTextAnimationDuration,
} from '../shared'

/**
 * The `crest` host design — the Khmer wedding-card order, read top to bottom:
 * the crest, the parents who are inviting, the sentence that invites, the
 * couple either side of the shared centre motif, and a breakline closing the
 * block.
 *
 * Its own component rather than another branch of the wedding grid, for the
 * same reason `arch` is: the *order* is the design, and two of its blocks — an
 * invitation sentence where every other design puts a greeting, and a couple
 * that closes the block instead of opening it — exist nowhere in that grid.
 *
 * What it does NOT do is invent a second type scale. The root is a
 * `.host-info-grid` and the parents, titles and names use the standard design's
 * own classes out of host-info-base.css, so the two designs share one
 * responsive ladder and cannot drift apart on a breakpoint.
 */
const props = defineProps<HostInfoProps>()

const WORD_DELAY = ANIMATION_CONSTANTS.WORD_DELAY
const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP

const resolvedLogoScale = computed(() => props.logoScale ?? 100)
const coupleOrnament = computed<CoupleOrnament>(() => props.coupleOrnament ?? 'none')

/**
 * The uploaded breakline art, when there is any. `getMediaUrl` for the same
 * reason `HostLogo` calls it on `sample_logo_1`: template assets arrive as
 * paths relative to the API host, while an event's own media has already been
 * resolved upstream.
 */
const resolvedBreaklineImage = computed<string | null>(() =>
  props.dividerImage ? (getMediaUrl(props.dividerImage) ?? null) : null,
)

/**
 * The breakline's width, resolved here rather than in the mark itself: it is a
 * share of the HOST BLOCK, and only the block knows how wide that is. 100% on
 * the wire is half the block — a full-width rule reads as a section divider
 * rather than as the close of this one.
 *
 * `top_offset` is deliberately NOT here: it applies to every wedding design, so
 * HostInfoWedding sets it once on the wrapper all five share.
 */
const rootVars = computed(() => ({
  '--crest-bl-width': `${Math.min((props.dividerScale ?? 100) / 2, 100)}%`,
}))

// Row visibility, copied from the standard grid so the two designs agree about
// when a parent row exists at all: row B only appears for a host who has both
// parents, because with one name the A row has already shown it.
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

const descriptionLines = computed(() => splitToLines(props.descriptionText || ''))

const leftHostTitle = computed(
  () =>
    props.hosts[0]?.title ||
    (props.hosts.length === 2 ? 'Bridegroom' : props.hosts.length === 1 ? 'Host' : 'Host 1'),
)

const rightHostTitle = computed(() => props.hosts[1]?.title || 'Bride')

const titleStyle = computed(() => ({
  color: props.primaryColor,
  fontFamily: props.secondaryFont || props.currentFont,
  wordWrap: 'break-word' as const,
  hyphens: 'auto' as const,
}))

const nameStyle = computed(() => ({
  color: props.primaryColor,
  fontFamily: props.primaryFont || props.secondaryFont || props.currentFont,
}))

/**
 * The cascade follows the reading order exactly — crest, parents, the
 * invitation, then the couple, with the ornament and the breakline arriving
 * after the columns they join and close.
 *
 * Left and right start together within a row: they are read as a pair across
 * the gap, and staggering them makes the right one look like a late correction
 * to the left.
 */
const delays = computed(() => {
  let cursor = 0.1

  const logo = cursor
  cursor += 0.35

  const parentALeft = cursor
  const parentARight = cursor
  if (showParentARow.value) {
    cursor +=
      Math.max(
        getTextAnimationDuration(props.hosts[0]?.parent_a_name || props.hosts[0]?.parent_b_name),
        getTextAnimationDuration(props.hosts[1]?.parent_a_name || props.hosts[1]?.parent_b_name),
      ) + ELEMENT_GAP
  }

  const parentBLeft = cursor
  const parentBRight = cursor
  if (showParentBRow.value) {
    cursor +=
      Math.max(
        getTextAnimationDuration(props.hosts[0]?.parent_b_name),
        getTextAnimationDuration(props.hosts[1]?.parent_b_name),
      ) + ELEMENT_GAP
  }

  const inviteTitle = cursor
  if (props.descriptionTitle) {
    cursor += getTextAnimationDuration(props.descriptionTitle) + ELEMENT_GAP
  }

  const invite = cursor
  if (props.descriptionText) {
    cursor += getTextAnimationDuration(props.descriptionText) + ELEMENT_GAP
  }

  const titleLeft = cursor
  const titleRight = cursor
  cursor +=
    Math.max(
      getTextAnimationDuration(leftHostTitle.value),
      props.hosts.length > 1 ? getTextAnimationDuration(rightHostTitle.value) : 0,
    ) + ELEMENT_GAP

  const nameLeft = cursor
  const nameRight = cursor
  cursor +=
    Math.max(
      getTextAnimationDuration(props.hosts[0]?.name),
      props.hosts.length > 1 ? getTextAnimationDuration(props.hosts[1]?.name) : 0,
    ) * 0.5

  const ornament = cursor
  cursor += 0.2
  const breakline = cursor

  return {
    logo,
    parentALeft,
    parentARight,
    parentBLeft,
    parentBRight,
    inviteTitle,
    invite,
    titleLeft,
    titleRight,
    nameLeft,
    nameRight,
    ornament,
    breakline,
  }
})
</script>

<style scoped>
@import '../shared/host-info-base.css';

.crest-layout {
  /* One size for the motif, read by both the track that holds it and the
     drawing itself, so the two can never disagree — the same pair the standard
     grid publishes, kept identical on purpose. */
  --ornament-size: clamp(26px, 8vw, 46px);
  --ornament-track: calc(var(--ornament-size) + 0.7rem);
}

/* **Every** row's centre track widens, not just the one carrying the motif.
   Each row is its own `1fr auto 1fr` grid, so the `1fr` columns are only as
   wide as that row's centre track leaves them — widening one row alone gives
   the couple different column widths from the parents above, and the two stop
   being centred on the same axis.

   Specificity is deliberate: host-info-base.css pins this element with
   `.center-spacer` and again with `.khmer-text .center-spacer`, and the second
   is 0-3-0 once scoped. A single class loses to it and the track snaps back to
   a fixed width, silently squeezing the motif — which is a flex item and so
   shrinks rather than overflowing. `.crest-layout.has-ornament` matches that
   0-3-0 and wins on source order, since these rules come after the `@import`. */
.crest-layout.has-ornament .center-spacer {
  width: var(--ornament-track);
}

.center-spacer--ornament {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* The crest sets its own rhythm. HostLogo's default row padding is tuned for
   the grid designs, where the logo sits between two blocks of text; here it
   opens the card and needs less above it than below.

   Reached with :deep() through a wrapper of our own rather than by passing a
   class: the class would land on HostLogo's root, where it ties with that
   component's own `.logo-row` rule on specificity and the winner comes down to
   which style block the bundler emitted last. EditableRegion can't carry the
   wrapper either — it is fragment-rooted, so it has no element to put it on. */
.crest-logo :deep(.logo-row) {
  padding: 0.25rem 1rem 0.5rem;
}

/* ============================================
   The invitation
   ============================================ */
.crest-invite {
  width: 100%;
  padding: 0 clamp(0.5rem, 4vw, 1.5rem);
  margin: 0.35rem 0 0.15rem;
  box-sizing: border-box;
}

.crest-invite-title {
  font-size: 1.125rem;
  line-height: 1.35;
  margin-bottom: 0.3rem;
}

.crest-invite-text {
  font-size: 0.8125rem;
  line-height: 1.7;
  opacity: 0.92;
}

/* ============================================
   The couple
   ============================================ */
.crest-couple {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

/* A single host has no one to be joined to, so neither the motif nor a second
   column is rendered and the one column takes the whole width rather than
   sitting in a third of it with two empty tracks either side. */
.crest-couple.is-solo {
  grid-template-columns: 1fr;
}

.crest-host {
  min-width: 0;
  text-align: center;
  overflow: hidden;
  box-sizing: border-box;
}

/* ============================================
   The breakline
   ============================================ */
/* The mark is the grid item itself, with no wrapper of its own: it renders
   nothing at all on `none` with no artwork attached, and an empty wrapper would
   still be a grid item and still collect the grid's row gap.

   Only a margin and a custom property are set here, neither of which the mark
   declares — so this rule and the component's own `.host-breakline` never
   compete over a property, which they would otherwise do at equal specificity
   with the winner decided by bundler output order. */
.crest-breakline {
  margin: clamp(0.6rem, 2.5vw, 1.1rem) auto 0;
  /* The width the mark reads. Published from here rather than set inside it,
     because a horizontal rule is measured as a share of the block it closes —
     which is this block, not that component. */
  --hb-width: var(--crest-bl-width, 50%);
}

/* ============================================
   Khmer
   ============================================ */
/* Khmer sets its own leading on this design's two strings rather than
   inheriting the Latin one: coeng subscripts hang below the baseline and
   stacked vowels rise above it, so a line-height tuned for Latin clips them at
   both ends. Everything else here is a shared class and already carries the
   standard design's Khmer treatment. */
.khmer-text .crest-invite-title {
  line-height: 1.7;
}

.khmer-text .crest-invite-text {
  line-height: 2;
}

/* ============================================
   Responsive — the invitation only. Everything else follows
   host-info-base.css's ladder through the shared classes.
   ============================================ */
@media (min-width: 640px) {
  .crest-invite-title {
    font-size: 1.3125rem;
  }

  .crest-invite-text {
    font-size: 0.9375rem;
  }
}

@media (min-width: 768px) {
  .crest-invite-title {
    font-size: 1.5rem;
  }

  .crest-invite-text {
    font-size: 1.0625rem;
  }
}

/* The laptop step the shared ladder takes: the card is narrow relative to the
   viewport at these widths, so the type steps back down rather than up. */
@media (min-width: 1024px) and (max-width: 1919px) {
  .crest-invite-title {
    font-size: 0.85rem;
  }

  .crest-invite-text {
    font-size: 0.6rem;
  }
}

@media (min-width: 1920px) {
  .crest-invite-title {
    font-size: 1.625rem;
  }

  .crest-invite-text {
    font-size: 1rem;
  }
}
</style>
