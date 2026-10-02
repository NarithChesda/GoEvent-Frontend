<template>
  <!--
    What a guest meets, as three pieces of the interface itself rather than a
    phone with three photographs in it: the link they are sent, the reply it
    asks for, the wish they leave. Read top to bottom they are the guest's own
    arc — it starts before the invitation is open and ends after it is
    answered — so all three are on screen at once, and there is no picker to
    press before the reader can see the second and third.

    THE LINK is the Design Studio's own link-preview card (EventBannerSection,
    the "how it looks when shared" card in the Showcase tab), drawn with the
    same anatomy and the same classes: photo, host, title, line. It stays the
    app's white because it arrives inside a chat app, not inside the design;
    the photograph is a real one, the couple a guest's preview actually showed.
    Its title is the shortlink's, guest name and all — that name is the claim
    the section's subtitle makes, so it is the one thing on the card worth
    reading.

    THE REPLY AND THE WISH are on the invitation, so they are in its paper and
    its ink rather than the app's slate — the two are what the guest sees, and
    a reply form in our own UI chrome would be a picture of a product the guest
    never meets. Their words are the showcase's own (`translateRSVP`), so a
    copy change to the real form changes this one too.

    One picture, not twelve controls: `role="img"` with a sentence that says
    what it shows, and nothing inside it is focusable. Nothing here is a real
    `<button>`, because nothing here does anything.
  -->
  <div class="moments" role="img" :aria-label="t('partners.product.cardsLabel')">
    <div class="moment moment--link">
      <div
        class="moment__card link-card overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        <img
          :src="LinkPhotoImg"
          alt=""
          width="400"
          height="210"
          class="block aspect-banner w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div class="border-t border-slate-100 p-4">
          <div class="mb-1 text-xs uppercase tracking-wide text-slate-500">{{ PUBLIC_HOST }}</div>
          <div class="mb-1 line-clamp-3 text-base font-semibold leading-snug text-slate-900">
            {{ t('partners.product.cards.linkTitle') }}
          </div>
          <div class="line-clamp-2 text-sm leading-snug text-slate-600">
            {{ t('partners.product.cards.linkDescription') }}
          </div>
        </div>
      </div>
    </div>

    <div class="moment moment--reply">
      <div class="moment__card inv-card px-4 pb-4 pt-5">
        <p class="inv-head text-balance text-center text-[0.9375rem] font-semibold leading-snug">
          {{ rsvp('rsvp_header') }}
        </p>
        <span class="inv-ornament" aria-hidden="true"></span>
        <ul class="mt-2">
          <li
            v-for="option in RSVP_OPTIONS"
            :key="option"
            class="inv-option flex items-center gap-2.5 text-sm leading-snug"
            :class="{ 'is-chosen': option === CHOSEN }"
          >
            <span class="inv-box">
              <Check v-if="option === CHOSEN" class="h-3 w-3" :stroke-width="3" />
            </span>
            {{ rsvp(option) }}
          </li>
        </ul>
        <span class="inv-send mt-3.5 text-[0.8125rem] font-semibold leading-snug">
          {{ rsvp('rsvp_submit_button') }}
        </span>
      </div>
    </div>

    <div class="moment moment--wish">
      <div class="moment__card inv-card relative px-4 pb-3.5 pt-4">
        <span class="inv-quote" aria-hidden="true">&ldquo;</span>
        <p class="inv-body ps-6 text-sm leading-relaxed">
          {{ t('partners.product.cards.wishBody') }}
        </p>
        <div class="inv-author mt-3 flex items-center gap-2.5 pt-3">
          <span class="inv-avatar">{{ wishInitial }}</span>
          <span class="inv-head min-w-0 truncate text-sm font-semibold leading-snug">
            {{ t('partners.product.cards.wishName') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { translateRSVP, type SupportedLanguage } from '@/utils/translations'
/*
  Cropped from the-opening.webp — the couple photograph in a real guest's
  link preview, at the 1200:630 ratio every banner surface uses. 400px wide,
  which is ~1.4x the card at its narrowest and soft on a retina phone; drop in
  the original banner export under the same name to sharpen it.
*/
import LinkPhotoImg from '@/assets/partners/link-photo.webp'

const { t, locale } = useAppLanguage()

/** The domain a shortlink is served from — what every guest's preview names,
 *  whatever host this page happens to be running on. */
const PUBLIC_HOST = 'goevent.online'

type RsvpKey = Parameters<typeof translateRSVP>[0]

/** The three answers the real form offers, in its order, with the first one
 *  ticked: the reply is one tap, and a tick is how a still picture says so. */
const RSVP_OPTIONS = [
  'rsvp_status_attending_label',
  'rsvp_status_maybe_label',
  'rsvp_status_not_attending_label',
] as const satisfies readonly RsvpKey[]
const CHOSEN: RsvpKey = 'rsvp_status_attending_label'

// Every app locale is a showcase language, so the cast only narrows.
const rsvp = (key: RsvpKey) => translateRSVP(key, locale.value as SupportedLanguage)

/** The wish card's avatar is the first letter of the name, as the real one is.
 *  `Array.from` so a Khmer name yields its first consonant, not half of it. */
const wishInitial = computed(() => Array.from(t('partners.product.cards.wishName'))[0] ?? '')
</script>

<style scoped>
/*
  ---------------------------------------------------------------------------
  The invitation's palette, not the app's
  ---------------------------------------------------------------------------
  Ivory paper and gold ink, sampled from the RSVP and wish captures these two
  cards replace (#faf7ed paper, #dea448 / #b59245 gold). They stand in for
  whatever template the partner picks, exactly as a template's own colours
  reach the showcase as data, so they are scoped to this picture and never
  leak into the page around it.

  The inks are the same gold taken darker until they read: the template's own
  #b59245 is 2.8:1 on this paper, which is a pale invitation and a failed
  sentence. `--inv-head` holds 4.7:1 and the body ink 6:1, so the cards keep
  the gold and lose none of the words.
*/
.moments {
  --inv-paper: #fbf8ef;
  --inv-gold: #c9a14a;
  --inv-head: #8a6a2b;
  --inv-ink: #7a5a22;
  --inv-rule: rgb(201 161 74 / 0.32);
  --inv-wash: rgb(201 161 74 / 0.12);

  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 23rem;
  margin-inline: auto;
  /*
    Room for the tilt. A card turned 2deg reaches past its own box at the
    corners, and while the cards are still gathering (below) they turn further;
    this keeps every corner inside the column so a 320px phone never scrolls
    sideways, and gives the front card's shadow somewhere to land.
  */
  padding: 0.5rem 0.5rem 1.75rem;
}

/*
  ---------------------------------------------------------------------------
  The float
  ---------------------------------------------------------------------------
  Three objects at three depths, in normal flow so the cluster's height is its
  content's — Khmer runs a line or two longer than English on every card, and
  an absolutely-placed layout would have to guess.

  They overlap by half a rem, which lands inside the padding of the card
  behind, so the layering reads without a word of either card being covered.
  They alternate sides in the guest's order, and the side each takes is the
  side of the plate that describes it: the link sits toward "On every
  invitation", the reply toward the replies the customer gets "Behind it".

  `rotate` and `translate` are the individual transform properties, so the
  scroll-driven gather below can animate both without overwriting the rest.
*/
.moment {
  position: relative;
}

.moment--link {
  z-index: 1;
  width: 90%;
  align-self: flex-start;
  rotate: -1.5deg;
}

.moment--reply {
  z-index: 2;
  width: 76%;
  align-self: flex-end;
  margin-top: -0.5rem;
  rotate: 2deg;
}

.moment--wish {
  z-index: 3;
  width: 84%;
  align-self: flex-start;
  margin-top: -0.5rem;
  margin-inline-start: 4%;
  rotate: -1deg;
}

/*
  Shadow grows with depth: nearer cards sit higher off the page and throw a
  longer, softer shadow, which is the whole of what makes three flat cards read
  as three things in front of one another. In `rem`, like the hero deck's, so
  it scales with the laptop root size rather than reading heavier there.
*/
.moment__card {
  box-shadow:
    0 var(--lift-y, 1.25rem) var(--lift-blur, 2.5rem) -1.25rem rgb(15 23 42 / 0.3),
    0 0.125rem 0.375rem rgb(15 23 42 / 0.06);
}

.moment--reply .moment__card {
  --lift-y: 1.5rem;
  --lift-blur: 2.75rem;
}

.moment--wish .moment__card {
  --lift-y: 1.75rem;
  --lift-blur: 3rem;
}

/* ---- The reply and the wish: a scrap of the invitation's paper ---------- */

.inv-card {
  border-radius: 1rem;
  border: 1px solid var(--inv-rule);
  background: var(--inv-paper);
  color: var(--inv-ink);
}

.inv-head {
  color: var(--inv-head);
}

/* The rule-and-diamond the templates put under a heading: two hairlines with
 * a small gold lozenge between them. */
.inv-ornament {
  position: relative;
  display: block;
  width: 3.5rem;
  height: 0.375rem;
  margin: 0.625rem auto 0;
  background: linear-gradient(var(--inv-rule), var(--inv-rule)) center / 100% 1px no-repeat;
}

.inv-ornament::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.375rem;
  height: 0.375rem;
  translate: -50% -50%;
  rotate: 45deg;
  background: var(--inv-gold);
  box-shadow: 0 0 0 0.1875rem var(--inv-paper);
}

/* One row per answer, ruled like the form's, the chosen one washed in gold. */
.inv-option {
  padding: 0.5rem 0.5rem;
  border-bottom: 1px solid var(--inv-rule);
}

.inv-option.is-chosen {
  border-radius: 0.5rem;
  border-bottom-color: transparent;
  background: var(--inv-wash);
  color: var(--inv-head);
  font-weight: 600;
}

.inv-box {
  display: flex;
  height: 1rem;
  width: 1rem;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  border: 1.5px solid var(--inv-gold);
  color: #fff;
}

.is-chosen .inv-box {
  border-color: transparent;
  background: var(--inv-gold);
}

/*
  The send button, as a mark on the paper rather than a control: a block of
  antique gold with the paper's own white on it. Taken dark enough (4.9:1 at
  its middle) that the label survives being looked at.
*/
.inv-send {
  display: flex;
  justify-content: center;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #9c7429, #87631f);
  color: #fffaf0;
}

.inv-quote {
  position: absolute;
  top: 0.5rem;
  left: 0.875rem;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  color: var(--inv-gold);
}

.inv-body {
  color: var(--inv-ink);
}

.inv-author {
  border-top: 1px solid var(--inv-rule);
}

.inv-avatar {
  display: flex;
  height: 1.75rem;
  width: 1.75rem;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--inv-gold);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
}

/*
  ---------------------------------------------------------------------------
  The gather — this section's scroll-driven beat
  ---------------------------------------------------------------------------
  The page's third scroll-driven object (see "Scroll-driven motion" at the end
  of PartnerProgramView's styles, which is where the other three live and where
  the reasoning for every rule here is set out once).

  The three cards come up the screen spread apart and turned a little further,
  and settle into the cluster as it reaches the middle of the screen. Near
  things move more: the front card travels four times as far as the back one,
  so the reader's own scroll is what shows them as three depths. Motion the
  reader causes, at the rate they cause it — nothing here moves on its own.

  Only a `from` keyframe, so each card animates to its own resting `translate`
  and `rotate`; a browser without scroll timelines, and a reader who asked for
  less motion, get that resting cluster and nothing else. Longhands only, and
  `linear`, for the reasons the page's own block gives.
*/
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .moments {
      view-timeline-name: --moments;
    }

    .moment {
      animation-name: momentGather;
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: --moments;
      animation-range: entry 0% cover 40%;
    }

    .moment--link {
      --gather-y: 1rem;
      --gather-r: -3deg;
    }

    .moment--reply {
      --gather-y: 2.75rem;
      --gather-r: 4deg;
    }

    .moment--wish {
      --gather-y: 4rem;
      --gather-r: -2.5deg;
    }
  }
}

@keyframes momentGather {
  from {
    translate: 0 var(--gather-y, 0);
    rotate: var(--gather-r, 0deg);
  }
}
</style>
