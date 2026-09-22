<template>
  <!-- The names-and-details composition: the hosts' names with the mark between
       them, the date, and the venue.

       A layer of its own over the whole stage rather than more rows inside
       CoverContentRows: these blocks are placed by their own box in BOTH layout
       modes, and in `rows` mode that component's root is the stacking container
       — a box positioned inside it would be measured from the container, not
       from the stage every coordinate here is written against.

       `pointer-events: none` on the layer, `auto` on each block: the layer sits
       over CoverContentRows, and a transparent sheet across the whole stage
       would swallow the header's and invite line's own click-to-edit in the
       preview. A tap on a block still bubbles to the cover's open-envelope
       handler, exactly as a tap on the guest name does. -->
  <div class="cdb">
    <!-- Hosts -->
    <div
      v-if="hostsShown"
      class="cdb-block"
      :class="enterClass"
      :style="[elementStyles.hosts, enterDelay(200)]"
    >
      <div
        class="cdb-hosts"
        :class="`cdb-hosts--${details.hostArrangement}`"
        :style="hostsStyle"
      >
        <template v-for="(host, index) in hostLines" :key="host.id">
          <HostSeparatorMark
            v-if="index > 0"
            :kind="details.separator"
            :image-url="separatorImageUrl"
            :word="joinerWord"
            :color="separatorColor"
            :icon-color="separatorIconColor"
            :font-family="namesFont"
            :finish-class="fx(fontSlot('hosts'))"
            :capitals="takesCapitals(details.capitals, joinerWord)"
            :scale="details.separatorScale"
          />
          <div class="cdb-host">
            <!-- The whole name is the edit target even when it is drawn split
                 over two lines: the split is presentation, the record is one
                 field. -->
            <InlineEditableText
              :value="host.fullName"
              :target="{ kind: 'host', hostId: host.id, field: 'name' }"
              :input-style="{ fontFamily: namesFont }"
            >
              <p
                class="cdb-name"
                :class="[fx(fontSlot('hosts')), runClass(host.name)]"
                :style="{ fontFamily: namesFont }"
              ><span class="tfx-ink">{{ host.name }}</span></p>
              <p
                v-if="host.subline && details.hostSubline === 'surname'"
                class="cdb-sub"
                :class="runClass(host.subline)"
                :style="{ fontFamily: sublineFont }"
              >{{ host.subline }}</p>
            </InlineEditableText>
            <InlineEditableText
              v-if="host.subline && details.hostSubline === 'title'"
              :value="host.subline"
              :target="{ kind: 'host', hostId: host.id, field: 'title' }"
              :input-style="{ fontFamily: sublineFont }"
            >
              <p
                class="cdb-sub"
                :class="runClass(host.subline)"
                :style="{ fontFamily: sublineFont }"
              >{{ host.subline }}</p>
            </InlineEditableText>
          </div>
        </template>
      </div>
    </div>

    <!-- Date -->
    <div
      v-if="dateShown"
      class="cdb-block"
      :class="enterClass"
      :style="[elementStyles.date, enterDelay(400)]"
    >
      <!-- Written text is edited where it is written; a date derived from the
           event's start opens the date editor, since that is what it reads. -->
      <InlineEditableText
        v-if="dateIsWritten"
        :value="dateLine"
        :target="{ kind: 'eventText', textType: 'date_text', field: 'content' }"
        :input-style="{ fontFamily: dateFont, color: dateColor }"
      >
        <p
          class="cdb-date cdb-date--prose"
          :class="[fx(fontSlot('date')), runClass(dateLine)]"
          :style="{ fontFamily: dateFont, color: dateColor }"
        ><span class="tfx-ink">{{ dateLine }}</span></p>
      </InlineEditableText>
      <EditableRegion v-else :intent="{ kind: 'eventDate' }">
        <p
          class="cdb-date"
          :class="[
            fx(fontSlot('date')),
            details.dateFormat === 'numeric' ? 'cdb-date--numeric' : ['cdb-date--prose', runClass(dateLine)],
          ]"
          :style="{ fontFamily: dateFont, color: dateColor }"
        ><span class="tfx-ink">{{ dateLine }}</span></p>
      </EditableRegion>
    </div>

    <!-- Venue -->
    <div
      v-if="locationShown"
      class="cdb-block"
      :class="enterClass"
      :style="[elementStyles.location, enterDelay(600)]"
    >
      <div class="cdb-location" :style="{ fontFamily: locationFont, color: locationColor }">
        <InlineEditableText
          v-if="timeLine"
          :value="timeLine"
          :target="{ kind: 'eventText', textType: 'time_text', field: 'content' }"
          :input-style="{ fontFamily: locationFont, color: locationColor }"
        >
          <p class="cdb-line" :class="runClass(timeLine)">{{ timeLine }}</p>
        </InlineEditableText>
        <InlineEditableText
          v-if="placeLine"
          :value="placeLine"
          :target="{ kind: 'eventText', textType: 'location_text', field: 'content' }"
          :input-style="{ fontFamily: locationFont, color: locationColor }"
          multiline
        >
          <p class="cdb-line cdb-line--place" :class="runClass(placeLine)">{{ placeLine }}</p>
        </InlineEditableText>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InlineEditableText from '@/components/showcase-preview/edit/InlineEditableText.vue'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import {
  COVER_ELEMENT_DEFAULT_FONT_SLOTS,
  COVER_FONT_SLOT_VARS,
  coverColorSourceValue,
} from '@/composables/showcase/useCoverStageLayout'
import { useTextEffect, useTextEffectMarkInk } from '@/composables/showcase/useTextEffects'
import type { CoverDetailElementId, CoverFontSlot } from '@/services/api/types/template.types'
import HostSeparatorMark from './HostSeparatorMark.vue'
import {
  coverHostLines,
  eventClock,
  findCoverText,
  formatCoverDate,
  formatCoverTime,
  hasKhmerScript,
  hostCountScale,
  hostJoinerWord,
  selectCoverHosts,
  takesCapitals,
  type CoverDetailBlocksBinding,
} from './coverDetails'

interface Props extends CoverDetailBlocksBinding {
  /** Rise in on mount — the decoration cover. Door leaves draw them still. */
  showAnimations?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  eventDetails: null,
  eventTexts: () => [],
  currentLanguage: 'en',
  separatorImageUrl: null,
  showAnimations: false,
})

const fx = useTextEffect()
const markInk = useTextEffectMarkInk()

const fontSlot = (id: CoverDetailElementId): CoverFontSlot =>
  props.elementFontSlots?.[id] ?? COVER_ELEMENT_DEFAULT_FONT_SLOTS[id]

// ---------------------------------------------------------------------------
// Type. Each block's font and colour follow the same contract as the four
// original blocks: `--cover-block-font` / `--cover-block-color` exist only when
// the partner picked a slot, and every rule spells its own default as the
// var()'s fallback — so an untouched block renders exactly as designed here.
// ---------------------------------------------------------------------------
const bodyFont = computed(() => props.primaryFont || props.currentFont)
const readingFont = computed(() => props.secondaryFont || props.currentFont)

const namesFont = computed(() => `var(--cover-block-font, ${bodyFont.value})`)
const dateFont = computed(() => `var(--cover-block-font, ${bodyFont.value})`)
const locationFont = computed(() => `var(--cover-block-font, ${readingFont.value})`)
// Its own slot, else the reading face whatever the names are set in: the small
// line is a caption to the name, and a script caption under a script name is
// illegible. Reached through the stage's slot variable, since the block's own
// --cover-block-font belongs to the names.
const sublineFont = computed(() => {
  const slot = props.sublineStyle?.fontType
  return slot ? `var(${COVER_FONT_SLOT_VARS[slot]}, ${readingFont.value})` : readingFont.value
})

const accent = computed(() => props.accentColor || props.primaryColor)
// The date is the one accent-coloured line in the reference card, so it
// defaults to the palette's accent slot rather than the cover's text colour.
const dateColor = computed(
  () => `var(--cover-block-color, var(--tpl-color-accent, ${accent.value}))`,
)
const namesColor = computed(() => `var(--cover-block-color, ${props.primaryColor})`)
const locationColor = computed(() => `var(--cover-block-color, ${props.primaryColor})`)

const separatorColor = computed(() =>
  coverColorSourceValue(
    props.details.separatorColorSource,
    props.details.separatorCustomColor,
    accent.value,
  ),
)
const separatorIconColor = computed(() => markInk(fontSlot('hosts')) ?? separatorColor.value)

/**
 * Per run of text: spaced capitals when the template asks for them and the run
 * is not Khmer, and the taller leading Khmer's subscripts need when it is.
 * Decided per run rather than per block, because a Khmer showcase can still
 * carry a host whose name was typed in Latin letters.
 */
const runClass = (text: string | null): Record<string, boolean> => ({
  'cdb-caps': !!text && takesCapitals(props.details.capitals, text),
  'cdb-khmer': !!text && hasKhmerScript(text),
})

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
const hosts = computed(() =>
  selectCoverHosts(props.eventDetails?.hosts, props.details.hostCount),
)

const hostLines = computed(() =>
  hosts.value.map((host) => ({
    id: host.id,
    fullName: host.name,
    ...coverHostLines(host, props.details.hostSubline),
  })),
)

const hostsStyle = computed(() => ({
  color: namesColor.value,
  '--cdb-count-scale': `${hostCountScale(hosts.value.length, props.details.hostArrangement)}`,
  '--cdb-sub-scale': `${props.sublineStyle?.fontScale ?? 1}`,
}))

const joinerWord = computed(() => hostJoinerWord(props.currentLanguage))

const texts = (textType: string): string | null =>
  findCoverText(props.eventTexts, textType, props.currentLanguage)

const clock = computed(() =>
  eventClock(props.eventDetails?.startDate, props.eventDetails?.timezone),
)

/** `text` with nothing written falls back to the numeric date, not to nothing. */
const writtenDate = computed(() => (props.details.dateFormat === 'text' ? texts('date_text') : null))
const dateIsWritten = computed(() => !!writtenDate.value)

const dateLine = computed(() => {
  if (writtenDate.value) return writtenDate.value
  if (!clock.value) return ''
  const format = props.details.dateFormat === 'long' ? 'long' : 'numeric'
  return formatCoverDate(clock.value, format, props.currentLanguage)
})

// The organizer's own words first ("Reception from 5 PM" says more than the
// start time can), the start time only when they wrote none.
const timeLine = computed(() => {
  if (!props.details.showTime) return ''
  return texts('time_text') ?? (clock.value ? formatCoverTime(clock.value, props.currentLanguage) : '')
})

const placeLine = computed(() => texts('location_text') ?? props.eventDetails?.location?.trim() ?? '')

const hostsShown = computed(() => props.visible.hosts && hostLines.value.length > 0)
const dateShown = computed(() => props.visible.date && !!dateLine.value)
const locationShown = computed(() => props.visible.location && !!(timeLine.value || placeLine.value))

// ---------------------------------------------------------------------------
// Entrance. The same rise the cover's own rows make, on the same beat, so the
// composition arrives as one gesture with the header above it: names, then the
// date, then the venue, 200ms apart — the rows' own spacing.
// ---------------------------------------------------------------------------
const enterClass = computed(() => (props.showAnimations ? 'cdb-enter' : ''))
const enterDelay = (ms: number): Record<string, string> =>
  props.showAnimations ? { animationDelay: `${ms}ms` } : {}
</script>

<style scoped>
.cdb {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* Type below is measured in cqw — a share of the STAGE's width, which is what
     the composition is proportioned against. vh would size the names off the
     screen's height, and on a phone taller than 9:16 they would outgrow a stage
     that is narrower than its height implies. This layer is always exactly the
     stage (the decoration cover's copy layer, or a door leaf's full-stage
     content), so it is the container to measure from. */
  container-type: size;
}

/* left/top/width/height come from coverElementStyle, already resolved to a
   top-left corner — never a translate, which the entrance keyframes would
   overwrite. */
.cdb-block {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: visible;
  pointer-events: auto;
}

.cdb p {
  margin: 0;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

/* ---------------------------------------------------------------- Hosts */
.cdb-hosts {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: calc(
    clamp(1rem, 6.4cqw, 3.2rem) * var(--cover-font-scale, 1) * var(--cdb-count-scale, 1)
  );
}

.cdb-hosts--stacked {
  flex-direction: column;
  row-gap: 0.12em;
}

/* Baseline, so the & sits on the names' line rather than centred between a name
   and its small line underneath. */
.cdb-hosts--inline {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.4em;
  row-gap: 0.2em;
}

/* A drawn motif's baseline is its bottom edge, which would stand it a full
   motif-height above the names' letters. */
.cdb-hosts--inline :deep(.hsm-icon),
.cdb-hosts--inline :deep(.hsm-image) {
  margin-bottom: -0.2em;
}

.cdb-host {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  max-width: 100%;
}

.cdb-name {
  font-size: 1em;
  line-height: 1.12;
  text-wrap: balance;
  overflow-wrap: break-word;
}

/* Sized off the stage, not in em of the name above it: the two are set on their
   own, and an em-sized caption would grow every time the names did. It still
   steps down with the host count, alongside the names it captions. */
.cdb-sub {
  font-size: calc(
    clamp(0.6rem, 2.3cqw, 1.15rem) * var(--cdb-sub-scale, 1) * var(--cdb-count-scale, 1)
  );
  line-height: 1.35;
  margin-top: 0.3em;
  opacity: 0.82;
}

/* ----------------------------------------------------------------- Date */
.cdb-date {
  font-size: calc(clamp(0.95rem, 6cqw, 3rem) * var(--cover-font-scale, 1));
  line-height: 1.15;
  text-wrap: balance;
}

/* Lining figures and wide tracking — the numerals are the ornament here. */
.cdb-date--numeric {
  font-variant-numeric: lining-nums;
  letter-spacing: 0.2em;
  padding-inline-start: 0.2em;
  white-space: nowrap;
}

/* A date spelled out is three times the length of the numerals, so it steps
   down to stay one line on a phone. */
.cdb-date--prose {
  font-size: calc(clamp(0.8rem, 3.4cqw, 1.7rem) * var(--cover-font-scale, 1));
  line-height: 1.3;
}

/* ---------------------------------------------------------------- Venue */
.cdb-location {
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 0.25em;
  width: 100%;
  font-size: calc(clamp(0.66rem, 2.7cqw, 1.2rem) * var(--cover-font-scale, 1));
  line-height: 1.55;
}

/* Organizers write their venue over two or three lines; keep their breaks. */
.cdb-line--place {
  white-space: pre-line;
  text-wrap: balance;
}

/* ------------------------------------------------------ Shared run rules */
/* Spaced capitals. Tracking also lands after the last letter, which pulls
   centred text off-centre by half of it; the start padding pays it back. */
.cdb-caps {
  text-transform: uppercase;
  letter-spacing: var(--cdb-track, 0.16em);
  padding-inline-start: var(--cdb-track, 0.16em);
}

.cdb-sub.cdb-caps {
  --cdb-track: 0.26em;
}

.cdb-line.cdb-caps,
.cdb-date--prose.cdb-caps {
  --cdb-track: 0.18em;
}

/* Coeng subscripts and stacked vowels need the room a Latin line doesn't. */
.cdb-name.cdb-khmer {
  line-height: 1.5;
}

.cdb-sub.cdb-khmer,
.cdb-line.cdb-khmer,
.cdb-date--prose.cdb-khmer {
  line-height: 1.7;
}

/* -------------------------------------------------------------- Entrance */
/* The rows' own rise — distance, duration and curve — so the names arrive with
   the header as one gesture. `both`, so a block waiting out its delay is not
   drawn at full strength first and then snapped to transparent. */
.cdb-enter {
  animation: cdbEnter 1s ease-out both;
}

@keyframes cdbEnter {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* Reduced motion keeps the arrival and drops the travel. */
@media (prefers-reduced-motion: reduce) {
  .cdb-enter {
    animation-name: cdbFade;
    animation-duration: 0.4s;
  }

  @keyframes cdbFade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}
</style>
