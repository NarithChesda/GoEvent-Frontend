<template>
  <!-- One root carrying the contract every design reads (see contractStyle).
       The design owns the composition and its own arrival; this owns the two
       texts, their faces and finish, the inline edit, and when to arrive. -->
  <div ref="rootRef" class="gid" :class="`gid--${designType}`" :style="contractStyle">
    <component :is="designComponent" :revealed="revealed">
      <template #invite>
        <!-- The organizer's own words when they wrote some, else the same
             translated line the cover falls back to. Editable in the studio:
             it is the same `invite_text` record the cover reads, so a template
             that shows both says the same thing twice rather than two things. -->
        <InlineEditableText
          :value="inviteText"
          :target="INVITE_TARGET"
          :input-style="{ fontFamily: inviteFont, color: primaryColor }"
        >
          <p class="gid-invite" :class="{ 'gid-khmer': inviteIsKhmer }" :style="{ fontFamily: inviteFont }">
            {{ inviteText }}
          </p>
        </InlineEditableText>
      </template>

      <template #name>
        <!-- Word by word, each in its own ink span: a design may bring the
             words in one at a time, and a word that animates is its own
             stacking context, which a finish painted on the parent cannot
             reach (see text-effects.css). The space between words is a text
             node OUTSIDE the spans, so a long name still wraps. -->
        <p
          class="gid-name"
          :class="[fx('primary'), { 'gid-khmer': nameIsKhmer }]"
          :style="{ fontFamily: nameFont }"
        >
          <template v-for="(word, index) in nameWords" :key="`${currentLanguage}-${index}-${word}`">
            <span class="gid-word" :style="{ '--gid-i': index }"><span class="tfx-ink">{{ word }}</span></span>{{ index < nameWords.length - 1 ? ' ' : '' }}
          </template>
        </p>
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useTextEffect } from '@/composables/showcase/useTextEffects'
import { showcaseRevealObserverInit } from '@/composables/showcase/useScrollProgress'
import InlineEditableText from '@/components/showcase-preview/edit/InlineEditableText.vue'
import type { InlineEditTarget } from '@/components/showcase-preview/edit/editContext'
import type {
  GuestInviteDesignConfig,
  GuestInviteDesignType,
} from '@/services/api/types/template.types'
import { translateRSVP, type SupportedLanguage } from '@/utils/translations'
import { countGraphemes } from '@/utils/graphemes'

import GuestInviteInscribed from './guest-invite-designs/GuestInviteInscribed.vue'
import GuestInviteFormal from './guest-invite-designs/GuestInviteFormal.vue'
import GuestInvitePlaceCard from './guest-invite-designs/GuestInvitePlaceCard.vue'
import GuestInviteTag from './guest-invite-designs/GuestInviteTag.vue'

/**
 * The guest dedication on the invitation: the event's invite text and the name
 * of the guest this link was sent to, between the hosts and the date.
 *
 * The cover has carried both since the showcase began, as rows of its own. This
 * is NOT that block moved down a stage — it has none of the cover's frame
 * artwork, row geometry or marquee. It exists for templates whose cover doesn't
 * address anyone, so the invitation still says who it is for, in a composition
 * chosen per template (`template_assets.guest_invite_design`) the way the
 * agenda and the dress code choose theirs.
 *
 * The caller only mounts it when a design is chosen AND there is a guest name:
 * a public link has nobody to address, and "You're invited" to no one is a
 * greeting, not a dedication.
 */
interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  guestName: string
  eventTexts?: EventText[]
  currentLanguage?: string
  primaryColor: string
  accentColor?: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  /** The template's chosen composition. Unknown falls back to `inscribed`. */
  guestInviteDesign?: GuestInviteDesignConfig | null
}

const props = defineProps<Props>()

// Metallic lettering for the name, if the template struck its primary slot in
// one. The invite text is small secondary-slot copy and is never gilded.
const fx = useTextEffect()

const INVITE_TARGET: InlineEditTarget = {
  kind: 'eventText',
  textType: 'invite_text',
  field: 'content',
}

// ---------------------------------------------------------------------------
// Design selection
// ---------------------------------------------------------------------------

const DESIGNS = {
  inscribed: GuestInviteInscribed,
  formal: GuestInviteFormal,
  place_card: GuestInvitePlaceCard,
  tag: GuestInviteTag,
} as const

/**
 * `inscribed` for a value this build doesn't know — the partner switched the
 * block on, so it degrades to a design rather than to nothing. (Absent/null
 * never reaches here: the stage doesn't mount the section for it.)
 */
const designType = computed<GuestInviteDesignType>(() => {
  const type = props.guestInviteDesign?.type
  return type && type in DESIGNS ? type : 'inscribed'
})

const designComponent = computed(() => DESIGNS[designType.value])

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

const lang = computed(() => (props.currentLanguage as SupportedLanguage) || 'en')

/** Language-filtered for the reason CoverContentRows documents: a language
 *  switch MERGES the new language's texts over the old ones. */
const inviteText = computed(() => {
  const own = props.eventTexts?.find(
    (text) => text.text_type === 'invite_text' && text.language === props.currentLanguage,
  )?.content
  return own || translateRSVP('invite_text', lang.value)
})

const nameWords = computed(() => props.guestName.trim().split(/\s+/).filter(Boolean))

const KHMER_SCRIPT = /[ក-៿᧠-᧿]/

/**
 * Checked on the text, not on the language: a guest's name is written in
 * whatever script the organizer typed it in, whichever language the invitation
 * is being read in. Khmer runs are never tracked (spacing pulls subscripts off
 * their bases) and need the taller leading for the stacked marks.
 */
const nameIsKhmer = computed(() => KHMER_SCRIPT.test(props.guestName))
const inviteIsKhmer = computed(() => KHMER_SCRIPT.test(inviteText.value))

const nameFont = computed(() => props.primaryFont || props.currentFont)
const inviteFont = computed(() => props.secondaryFont || props.currentFont)

/**
 * How much of its design's size a name gets. Guest names on a Khmer invitation
 * are often a household — titles, two names, "and family" — and a design's
 * display size set for "Dara" would put that on four lines. Counted in
 * graphemes, since a Khmer cluster is several code units but one mark wide.
 */
const nameScale = computed(() => {
  const length = countGraphemes(props.guestName.trim())
  if (length > 40) return 0.72
  if (length > 24) return 0.84
  return 1
})

/** The CSS contract every design reads; documented at the top of the style block. */
const contractStyle = computed(() => ({
  '--gid-ink': props.primaryColor,
  '--gid-accent': props.accentColor || props.primaryColor,
  '--gid-name-scale': String(nameScale.value),
}))

// ---------------------------------------------------------------------------
// Arrival
// ---------------------------------------------------------------------------

/**
 * Flips once, when the block first scrolls into the card's scroller, and never
 * back: each design's arrival is a one-time gesture (a line drawn, a card set
 * upright, a tag swinging to rest), not something to replay on every pass.
 */
const revealed = ref(false)
const rootRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  const root = rootRef.value
  if (!root || typeof IntersectionObserver === 'undefined') {
    revealed.value = true
    return
  }
  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      revealed.value = true
      observer?.disconnect()
      observer = null
    }
  }, showcaseRevealObserverInit())
  observer.observe(root)
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})
</script>

<style scoped>
/* The contract. A design never reads a template colour or font directly:
 *
 *   --gid-ink         copy, rules and surfaces — the template's primary.
 *   --gid-accent      the one mark a design may spend it on (the tag's string).
 *   --gid-name-scale  1, or less for a long name; designs multiply their name
 *                     size by it.
 *   --gid-ease-out    the showcase's strong ease-out, declared here so designs
 *                     render identically inside a preview frame, which mounts
 *                     sections outside `.showcase-container`.
 *
 * Every surface a design draws is the ink mixed into transparency, never a
 * colour of its own: the block sits on whatever the template's card is, and a
 * pale surface under gold ink is the illegible pairing the liquid-glass work
 * measured at 2:1. */
.gid {
  --gid-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --gid-hairline: color-mix(in srgb, var(--gid-ink) 30%, transparent);

  width: 100%;
  color: var(--gid-ink);
  line-height: 1.3;
  text-align: center;
}

/* The two texts carry no size of their own: each design sets size, tracking
   and case on the wrapper it places them in, and they inherit it. */
.gid-invite,
.gid-name {
  margin: 0;
  font-weight: 400;
  overflow-wrap: break-word;
}

.gid-name {
  text-wrap: balance;
}

.gid-word {
  display: inline-block;
}

/* Declared on the element, so it beats whatever tracking, case or leading the
   design set on the wrapper it inherited from. */
.gid-khmer {
  letter-spacing: 0;
  text-transform: none;
  line-height: 1.75;
}
</style>
