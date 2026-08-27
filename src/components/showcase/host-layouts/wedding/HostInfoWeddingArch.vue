<template>
  <div class="arch-layout" :class="{ 'khmer-text': currentLanguage === 'kh' }">
    <WelcomeHeader
      v-if="showWelcomeHeaderText !== false"
      :message="welcomeMessage"
      default-message="Welcome to Our Event"
      :color="primaryColor"
      :font-family="primaryFont || currentFont"
      :current-language="currentLanguage"
      :animated="true"
      :base-delay="delays.welcome"
    />

    <!-- The couple, staged as a diagonal: first host high-left, second
         low-right, a drawn flourish in the gap between them. Unlike V2 — which
         absolutely-positions both cards inside a pinned full-viewport stage —
         these occupy real cells of a 2x2 grid in normal flow, so the column
         grows with the text instead of the two cards colliding once a name or
         a parent line wraps. -->
    <div class="arch-stage" :class="{ 'arch-stage--solo': couple.length === 1 }" :style="stageVars">
      <!-- The connecting flourish. It lives in the grid's own empty cell —
           column 2, row 1, beside the first portrait — rather than being
           stretched across the whole stage: an overlay positioned by
           percentages has to guess where each card's text ends, and lands on
           top of a photo the moment a name wraps to a second line. In a real
           cell, grid keeps it clear no matter how long the text runs.

           One stroke, following the same diagonal the portraits sit on. An
           S-curve or a curl at this size (≈55px) reads as a stray mark rather
           than an ornament — there is not enough room for the shape to
           announce itself, so the line has to say the one thing it means:
           these two are connected. -->
      <svg
        v-if="couple.length === 2"
        class="arch-thread"
        viewBox="0 0 60 90"
        fill="none"
        aria-hidden="true"
      >
        <path
          class="arch-thread-path"
          :class="{ 'is-animated': !prefersReducedMotion }"
          d="M 7 7 C 33 29 41 55 50 82"
          stroke="currentColor"
          stroke-width="1"
          stroke-linecap="round"
          pathLength="100"
          :style="{ animationDelay: `${delays.thread}s` }"
        />
        <circle
          class="arch-thread-dot"
          :class="{ 'is-animated': !prefersReducedMotion }"
          cx="50"
          cy="82"
          r="2.2"
          fill="currentColor"
          :style="{ animationDelay: `${delays.thread + 0.85}s` }"
        />
      </svg>

      <article
        v-for="(person, i) in couple"
        :key="person.key"
        class="arch-card"
        :class="i === 0 ? 'arch-card--a' : 'arch-card--b'"
      >
        <!-- Portrait first, then the caption block. The photo is the subject
             here and the role is its caption — the reverse of the portrait
             design, where the role is a column header introducing a person the
             reader hasn't seen yet. -->
        <EditableRegion
          :intent="{ kind: 'hostImage', hostId: person.key }"
          :label="person.photo ? undefined : addPhotoLabel"
        >
          <div
            class="arch-frame arch-in-photo"
            :style="{ animationDelay: cardDelay(i, 'photo') }"
          >
            <div class="arch-photo" :style="{ background: primaryColor }">
              <img v-if="person.photo" :src="person.photo" :alt="person.name" loading="lazy" />
              <span
                v-else
                class="arch-monogram"
                :style="{ fontFamily: primaryFont || currentFont }"
                >{{ person.initial }}</span
              >
            </div>
          </div>
        </EditableRegion>

        <InlineEditableText
          v-if="person.role"
          :value="person.role"
          :target="{ kind: 'host', hostId: person.key, field: 'title' }"
          :input-style="{ fontFamily: secondaryFont || currentFont, color: accentInk }"
        >
          <span
            :class="['arch-role arch-in-line', getKhmerClass(currentLanguage)]"
            :style="{
              fontFamily: secondaryFont || currentFont,
              animationDelay: cardDelay(i, 'role'),
            }"
            >{{ person.role }}</span
          >
        </InlineEditableText>

        <InlineEditableText
          :value="person.name"
          :target="{ kind: 'host', hostId: person.key, field: 'name' }"
          :input-style="{ fontFamily: primaryFont || currentFont, color: primaryColor }"
        >
          <h3
            :class="['arch-name arch-in-name', getKhmerClass(currentLanguage)]"
            :style="{
              fontFamily: primaryFont || secondaryFont || currentFont,
              animationDelay: cardDelay(i, 'name'),
            }"
          >
            {{ person.name }}
          </h3>
        </InlineEditableText>

        <!-- Each parent gets its own line. Joined on one line they wrap
             mid-name in the narrow column, which reads as a truncation. -->
        <p
          v-if="person.parents.length"
          :class="['arch-parents arch-in-line', getKhmerClass(currentLanguage)]"
          :style="{ animationDelay: cardDelay(i, 'parents') }"
        >
          <InlineEditableText
            v-for="parent in person.parents"
            :key="parent.field"
            :value="parent.value"
            :target="{ kind: 'host', hostId: person.key, field: parent.field }"
            :input-style="{ fontFamily: secondaryFont || currentFont, color: primaryColor }"
          >
            <span class="arch-parent" :style="{ fontFamily: secondaryFont || currentFont }">{{
              parent.value
            }}</span>
          </InlineEditableText>
        </p>
      </article>
    </div>

    <!-- Hosts beyond the couple: the same card at two-thirds scale, centred in
         a row rather than staged on the diagonal — the diagonal is a device for
         a pair and stops meaning anything with three or more. -->
    <div v-if="extras.length" class="arch-extras" :style="stageVars">
      <article
        v-for="(person, i) in extras"
        :key="person.key"
        class="arch-card arch-card--extra"
        :style="{ '--arch-extra-base': `${delays.extras + i * 0.12}s` }"
      >
        <EditableRegion :intent="{ kind: 'hostImage', hostId: person.key }">
          <div class="arch-frame arch-in-photo">
            <div class="arch-photo" :style="{ background: primaryColor }">
              <img v-if="person.photo" :src="person.photo" :alt="person.name" loading="lazy" />
              <span
                v-else
                class="arch-monogram"
                :style="{ fontFamily: primaryFont || currentFont }"
                >{{ person.initial }}</span
              >
            </div>
          </div>
        </EditableRegion>
        <span
          v-if="person.role"
          :class="['arch-role arch-in-line', getKhmerClass(currentLanguage)]"
          :style="{ fontFamily: secondaryFont || currentFont }"
          >{{ person.role }}</span
        >
        <h3
          :class="['arch-name arch-in-name', getKhmerClass(currentLanguage)]"
          :style="{ fontFamily: primaryFont || secondaryFont || currentFont }"
        >
          {{ person.name }}
        </h3>
        <p
          v-if="person.parents.length"
          :class="['arch-parents arch-in-line', getKhmerClass(currentLanguage)]"
        >
          <span
            v-for="parent in person.parents"
            :key="parent.field"
            class="arch-parent"
            :style="{ fontFamily: secondaryFont || currentFont }"
            >{{ parent.value }}</span
          >
        </p>
      </article>
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
  getMediaUrl,
  getKhmerClass,
  ANIMATION_CONSTANTS,
  getTextAnimationDuration,
} from '../shared'

const props = defineProps<HostInfoProps>()

// Only provided by the editable manage-page preview frame — undefined on the
// public showcase, so the "add photo" affordance can never reach guests.
const editIntentCtx = inject(EditIntentKey, undefined)
const { t: tApp } = useAppLanguage()

const addPhotoLabel = computed(() =>
  editIntentCtx ? tApp('management.showcasePreview.editors.addHostPhoto') : undefined,
)

const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP

/**
 * The thread draws itself with a stroke-dashoffset animation, which reduced
 * motion must not simply disable — an undrawn path at dashoffset 100 is an
 * invisible line, not a still one. Resolved once here so the template can
 * render the path already-drawn instead.
 */
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface ArchParent {
  field: 'parent_a_name' | 'parent_b_name'
  value: string
}

interface ArchPerson {
  key: number
  photo?: string
  role?: string
  name: string
  initial: string
  parents: ArchParent[]
}

const people = computed<ArchPerson[]>(() =>
  (props.hosts ?? []).slice(0, 5).map((host) => ({
    key: host.id,
    photo: host.profile_image ? getMediaUrl(host.profile_image) : undefined,
    role: host.title,
    name: host.name,
    initial: (host.name || '·').trim().charAt(0).toUpperCase(),
    parents: (
      [
        { field: 'parent_a_name' as const, value: host.parent_a_name },
        { field: 'parent_b_name' as const, value: host.parent_b_name },
      ] satisfies Array<{ field: ArchParent['field']; value?: string }>
    ).filter((p): p is ArchParent => Boolean(p.value)),
  })),
)

const couple = computed(() => people.value.slice(0, 2))
const extras = computed(() => people.value.slice(2))

/** The accent carries the one non-primary mark in this layout: the frame
 *  hairline, the thread and the role labels. Falls back to primary so a
 *  template that never set an accent still renders coherently. */
const accentInk = computed(() => props.accentColor || props.primaryColor)

const stageVars = computed<Record<string, string>>(() => ({
  '--arch-ink': props.primaryColor,
  '--arch-accent': accentInk.value,
}))

/**
 * Within one card the portrait lands first and its caption follows it in, so
 * the photo reads as the subject and the words as its caption. Ported from the
 * V2 story stage's lite tier, which stages the two cards 150ms apart for the
 * same reason.
 */
const CARD_STEP = { photo: 0, role: 0.16, name: 0.24, parents: 0.32 } as const

/** Animation delay for one part of card `i`, as a CSS time string. */
const cardDelay = (i: number, part: keyof typeof CARD_STEP): string =>
  `${(i === 0 ? delays.value.cardA : delays.value.cardB) + CARD_STEP[part]}s`

/**
 * Reveal order: welcome → left card → right card → the flourish between them.
 * The flourish goes last on purpose — it can only read as *connecting* two
 * things that are already on screen.
 */
const delays = computed(() => {
  let cursor = 0.1

  const welcome = cursor
  const welcomeText =
    props.showWelcomeHeaderText === false ? '' : props.welcomeMessage || 'Welcome to Our Event'
  if (welcomeText) cursor += getTextAnimationDuration(welcomeText) + ELEMENT_GAP

  const cardA = cursor
  cursor += 0.22
  const cardB = couple.value.length > 1 ? cursor : cardA
  cursor += 0.3

  // Clears the second card's last caption line (base + 0.32 + 0.42), so the
  // flourish is drawn between two settled portraits rather than chasing one
  // that is still arriving.
  const thread = cardB + 0.8
  const extrasDelay = Math.max(cursor, thread + 0.2)

  return { welcome, cardA, cardB, thread, extras: extrasDelay }
})
</script>

<style scoped>
@import '../shared/host-info-base.css';

/* ============================================================
   Arch design — the V2 couple-story composition brought into the
   V1 column: two arch-framed portraits on a diagonal, a drawn
   hairline running between them, and each host's label, name and
   parents stacked under their own frame.

   What it changes versus `standard`: standard splits one person
   across four full-width rows (their parents in row 2, their
   title in row 5, their name in row 6, their face in row 7), so
   the reader assembles each host by scanning columns. Here each
   host is one card, read top to bottom, and the pairing is
   carried by the composition instead of by row alignment.
   ============================================================ */
.arch-layout {
  /* How far the mat hairline stands off the photo. The outer cards sit flush
     against the stage edges, so the stage has to reserve exactly this much
     padding or .host-info-wrapper's overflow-x: hidden shaves the outer
     vertical of each frame clean off. One variable drives both, so they
     cannot drift apart at a breakpoint. */
  --arch-frame-outset: 6px;
  width: 100%;
  box-sizing: border-box;

  /* The intro's starting offsets sit below and right of where each element
     comes to rest, and the lowest of them is the last caption line of the
     second card — so for the length of the reveal this block is a few pixels
     taller than it ends up.

     That is enough to flash a scrollbar, because .host-info-wrapper sets
     overflow-x: hidden and leaves overflow-y alone: CSS forces a visible
     axis to auto when the other axis is not visible, so the wrapper is
     silently a scroll container. Measured mid-reveal it reports
     scrollHeight 654 against clientHeight 651, then 651/651 once settled.

     clip rather than hidden: hidden would make *this* element a scroll
     container too and move the same problem down a level, while clip cannot
     scroll by definition.

     Deliberately no overflow-clip-margin. It reads like the right way to
     keep the offset elements fully painted, but the expanded clip region
     counts toward the ancestor scroll area — adding 28px of it pinned the
     wrapper at 654/651 for the whole page instead of just the reveal,
     turning a flash into a permanent scrollbar. Clipping at the padding box
     costs nothing visible here: the only thing that crosses the edge is a
     caption line during the part of its travel where it is still nearly
     transparent. */
  overflow: clip;
}

/* Two columns, two rows, one card in each diagonal cell. The empty
   off-diagonal cells are what create the composition: the first portrait
   sits high-left with nothing beside it, the second low-right with nothing
   beside it, and the flourish occupies the top-right gap.

   Explicit rows rather than a margin-offset in a single row, because a
   percentage margin can only guess at the height of the text above it —
   one wrapped name and the "diagonal" turns into an overlap. Grid measures
   it. The interlock comes back as a bounded negative margin below. */
.arch-stage {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  align-items: start;
  justify-items: center;
  gap: 0 clamp(10px, 4vw, 24px);
  width: 100%;
  padding: 0.5rem var(--arch-frame-outset) 0.25rem;
  box-sizing: border-box;
  color: var(--arch-accent);
}

.arch-card--a {
  grid-column: 1;
  grid-row: 1;
}

.arch-card--b {
  grid-column: 2;
  grid-row: 2;
  /* Pulls the second portrait up beside the first card's caption so the pair
     interlocks instead of reading as two stacked rows. Bounded and small —
     the columns can never collide, so this only ever tightens the gap. */
  margin-top: -18%;
}

.arch-stage--solo {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto;
  max-width: 300px;
  margin-inline: auto;
}

.arch-stage--solo .arch-card--a {
  grid-column: 1;
  grid-row: 1;
}

/* Each caption hangs off its own portrait's outer edge — the first card
   reads out from the left margin, the second in from the right — so the two
   text blocks lean away from each other and reinforce the diagonal instead of
   floating centred inside it. Centring them is what made the earlier pass read
   as two unrelated columns. */
.arch-card {
  min-width: 0;
  width: 100%;
}

.arch-card--a,
.arch-card--a .arch-parents {
  text-align: left;
  align-items: flex-start;
}

.arch-card--b,
.arch-card--b .arch-parents {
  text-align: right;
  align-items: flex-end;
}

/* A lone host has no diagonal to reinforce, so it recentres. */
.arch-stage--solo .arch-card--a,
.arch-stage--solo .arch-card--a .arch-parents,
.arch-card--extra,
.arch-card--extra .arch-parents {
  text-align: center;
  align-items: center;
}

/* ---------- intro motion ----------
   The two portraits converge from opposite diagonals — the first from up and
   left, the second from down and right — which is the same axis the pair sits
   on and the flourish is later drawn along, so the motion states the layout
   rather than decorating it. Lifted from the V2 story stage's lite tier
   (`x: ∓36, y: ∓20, power2.out`), re-expressed as percentages of the card's
   own width so it scales with the column instead of being tuned per
   breakpoint.

   CSS animation rather than GSAP: this is predetermined, non-interruptible,
   fires once on mount, and has to stay smooth while the showcase is still
   pulling images — CSS runs off the main thread, and GSAP is deliberately
   confined to the lazy showcase-v2 chunk.

   These replace the shared `bounce-in-element`, which moved the whole card as
   one lump straight up from below: it ignored the diagonal entirely, and its
   overshoot made two portraits wobble on arrival. */
.arch-card--a {
  --arch-in-x: -8%;
  --arch-in-y: -5%;
}

.arch-card--b {
  --arch-in-x: 8%;
  --arch-in-y: 5%;
}

/* A lone host and the extras have no diagonal to travel along, so they rise
   straight in. Their delays come from the card instead of per-element inline
   styles, since there is no left/right sequence to stage. */
.arch-stage--solo .arch-card--a,
.arch-card--extra {
  --arch-in-x: 0%;
  --arch-in-y: 0%;
}

.arch-card--extra .arch-in-photo,
.arch-card--extra .arch-in-line,
.arch-card--extra .arch-in-name {
  animation-delay: var(--arch-extra-base, 0s);
}

.arch-in-photo {
  opacity: 0;
  animation: archPhotoIn 0.56s cubic-bezier(0.23, 1, 0.32, 1) both;
}

/* Never from scale(0) — a portrait that pops out of nothing reads as a glitch.
   0.96 is enough to feel like it settles into place and small enough that the
   mat hairline never visibly thickens on the way in. */
@keyframes archPhotoIn {
  from {
    opacity: 0;
    transform: translate3d(var(--arch-in-x, 0%), var(--arch-in-y, 0%), 0) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

/* The name is the payoff of the card, so it gets its own slightly longer rise
   from slightly further down than the label and parent lines around it. */
.arch-in-name {
  opacity: 0;
  animation: archNameIn 0.46s cubic-bezier(0.23, 1, 0.32, 1) both;
}

@keyframes archNameIn {
  from {
    opacity: 0;
    transform: translate3d(0, 12px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.arch-in-line {
  opacity: 0;
  animation: archLineIn 0.42s cubic-bezier(0.23, 1, 0.32, 1) both;
}

@keyframes archLineIn {
  from {
    opacity: 0;
    transform: translate3d(0, 7px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

/* ---------- arch photo frame ----------
   Two hairlines and the air between them: an outer line tracing the
   arch and an inner one riding on the photo, which is how a portrait
   is mounted on printed stationery. */
.arch-frame {
  position: relative;
  /* The outer hairline sits 6px outside the photo, so it eats most of a small
     bottom margin and closes almost against the caption. This is the gap
     measured from the line, not from the photo. */
  margin: 0 0 1rem;
}

.arch-frame::after {
  content: '';
  position: absolute;
  inset: calc(-1 * var(--arch-frame-outset));
  border: 1px solid color-mix(in srgb, var(--arch-accent) 70%, transparent);
  border-radius: 999px 999px 14px 14px;
  pointer-events: none;
}

.arch-photo {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 999px 999px 10px 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 26px rgba(62, 58, 54, 0.16);
}

.arch-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.arch-photo::after {
  content: '';
  position: absolute;
  inset: 7px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: inherit;
  pointer-events: none;
}

.arch-monogram {
  font-size: clamp(30px, 9vw, 52px);
  line-height: 1;
  color: rgba(255, 255, 255, 0.88);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
}

/* ---------- the thread ----------
   Same pathLength="100" + dashoffset draw the calendar's heart and the
   engraved info card's rules use, so every drawn line in the showcase
   reveals the same way. Solid, not dotted: a dotted stroke can't animate
   via dashoffset without marching its dots, and the mask workaround V2
   needs isn't worth it for a line this short. */
/* Sits in the empty top-right cell, pinned to its bottom-left corner —
   the point where the diagonal between the two portraits passes through. */
.arch-thread {
  grid-column: 2;
  grid-row: 1;
  align-self: end;
  justify-self: start;
  width: clamp(46px, 36%, 76px);
  height: auto;
  /* The bottom margin has to clear the second card's -18% interlock, or the
     card (z-index 1) crops the flourish and it reads as a stray mark rather
     than an ornament. Kept as one number so the two stay in step. */
  margin: 0 0 30% 2%;
  pointer-events: none;
  opacity: 0.6;
}

.arch-thread-path {
  stroke-dasharray: 100;
  stroke-dashoffset: 0;
  vector-effect: non-scaling-stroke;
}

.arch-thread-path.is-animated {
  stroke-dashoffset: 100;
  animation: archThreadDraw 1.2s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

@keyframes archThreadDraw {
  to {
    stroke-dashoffset: 0;
  }
}

/* The dot is where the flourish comes to rest, so it lands as the line
   finishes rather than sitting there waiting to be reached. */
.arch-thread-dot {
  opacity: 1;
  transform-box: fill-box;
  transform-origin: center;
}

/* Same curve the stroke above is drawn with. The dot is the end of that
   line, not a separate event — an overshoot here would make the terminal
   bounce off a stroke that decelerated smoothly into it, and at r=2.2 the
   overshoot is too small to read as anything but a wobble. Nor does it start
   from scale(0.4): a mark that small snapping open from near-nothing reads
   as a rendering glitch. */
.arch-thread-dot.is-animated {
  opacity: 0;
  animation: archDotIn 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

@keyframes archDotIn {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Cards sit above the flourish, so a long caption overlaps it rather than
   being crossed by it. */
.arch-card {
  position: relative;
  z-index: 1;
}

/* ---------- card text ---------- */
.arch-role {
  display: block;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  line-height: 1.3;
  margin-bottom: 0.15rem;
  color: var(--arch-accent);
}

.arch-name {
  font-size: clamp(0.95rem, 4.6vw, 1.35rem);
  font-weight: 500;
  line-height: 1.25;
  color: var(--arch-ink);
  overflow-wrap: break-word;
}

/* The description block the standard layout never had room for. Parents get
   real leading here rather than being crammed under the name — this is the
   spacing the V2 story card gets right and the row grid cannot. */
.arch-parents {
  margin-top: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.6875rem;
  line-height: 1.5;
  color: color-mix(in srgb, var(--arch-ink) 78%, transparent);
}

.arch-parent {
  display: block;
  overflow-wrap: break-word;
}

/* ---------- extras ---------- */
.arch-extras {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(12px, 5vw, 32px);
  margin-top: 1.25rem;
  padding-inline: var(--arch-frame-outset);
  color: var(--arch-accent);
}

.arch-card--extra {
  width: min(33%, 130px);
  margin-top: 0;
}

.arch-card--extra .arch-name {
  font-size: clamp(0.8rem, 3.4vw, 1rem);
}

/* ---------- Khmer ----------
   Khmer clusters break under heavy tracking and its glyphs sit lower in the
   em-box, so the role label gives its tracking back and every line relaxes.

   The `!important` on each line-height is not a shortcut past specificity — it
   is the only way to reach these. Every one of these elements also carries the
   global `.khmer-text-fix`, whose `line-height: 1.8 !important` (main.css) beats
   an ordinary declaration however specific the selector. Without it the three
   values below were dead code: all three rendered at 1.8, which is what left the
   name floating in ~28px of empty box above and ~32px below against 20px of
   type. 1.8 is a safe blanket for Khmer set anywhere; these are the values for
   Khmer set *here*, at these sizes, in a narrow column.

   The vertical padding/margin `.khmer-text-fix` adds are trimmed rather than
   removed — they are diacritic clip protection on Safari, which composites
   these onto their own layer (see the @supports block in main.css). main.css
   deliberately leaves both without `!important` so a component can do exactly
   this. The leading above already carries most of the guard. */
.khmer-text .arch-role,
.khmer-text .arch-name,
.khmer-text .arch-parents {
  padding-top: 0.12em;
  padding-bottom: 0.12em;
}

.khmer-text .arch-role {
  letter-spacing: 0.04em;
  font-size: 0.6875rem;
  line-height: 1.5 !important;
  margin-top: 0;
}

/* The name is the one line with air on both sides of it, so it is the one that
   gives its margins back entirely — the role above and the parents below each
   keep their own layout margin, which is what still separates the three. */
.khmer-text .arch-name {
  line-height: 1.45 !important;
  margin-top: 0;
  margin-bottom: 0;
}

.khmer-text .arch-parents {
  font-size: 0.75rem;
  line-height: 1.65 !important;
  margin-bottom: 0;
}

/* ---------- breakpoints ---------- */
@media (min-width: 640px) {
  .arch-stage {
    gap: 0 clamp(20px, 5vw, 44px);
    padding: 0.75rem 0 0.5rem;
  }

  .arch-role {
    font-size: 0.6875rem;
  }

  .arch-parents {
    font-size: 0.75rem;
  }
}

/* Laptops run the showcase card narrow, and the rest of the showcase steps
   its type down at these widths — match it rather than towering over the
   date and agenda blocks below. */
@media (min-width: 1024px) and (max-width: 1919px) {
  .arch-name {
    font-size: 0.95rem;
  }

  .arch-role {
    font-size: 0.5625rem;
  }

  .arch-parents {
    font-size: 0.625rem;
  }

  .arch-layout {
    --arch-frame-outset: 5px;
  }
}

@media (min-width: 1920px) {
  .arch-name {
    font-size: 1.5rem;
  }

  .arch-role {
    font-size: 0.75rem;
  }

  .arch-parents {
    font-size: 0.875rem;
  }
}

/* Very narrow phones: the two columns plus the gap leave each card under
   130px, where a 4:5 portrait stops reading as a face. Square them up and
   drop the diagonal offset so the pair stays side by side. */
@media (max-width: 359px) {
  .arch-photo {
    aspect-ratio: 1 / 1;
  }

  .arch-card--b {
    margin-top: 12%;
  }
}

@media (prefers-reduced-motion: reduce) {
  /* Everything arrives in place. The convergence is the one thing this design
     animates, and it is pure position — there is no opacity-only version of
     "these two travelled toward each other" worth keeping. */
  .arch-card,
  .arch-in-photo,
  .arch-in-name,
  .arch-in-line,
  .bounce-in-element {
    animation: none;
    opacity: 1;
    transform: none;
  }

  /* Reduced motion means a still line, not a missing one. */
  .arch-thread-path,
  .arch-thread-path.is-animated {
    animation: none;
    stroke-dashoffset: 0;
  }

  .arch-thread-dot,
  .arch-thread-dot.is-animated {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
