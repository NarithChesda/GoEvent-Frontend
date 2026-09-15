<template>
  <!-- Mobile Card.
       Two regions, not five stacked rows: the body answers when / what / where
       beside the cover, and a hairline footer running the card's full width
       holds who it is and the one thing you can do to it. The manage button
       used to sit on a row of its own under the text column, which left the
       column under the 80px cover empty and made the card ~20px taller than
       its content; spanning the footer across both columns is what reclaims
       that dead corner. Chips became text — three differently-shaped pills in
       one 200px row wrapped into ragged blocks in Khmer and set the smallest
       type in the card at 10.5px, below what Khmer can carry. -->
  <div
    v-if="variant === 'mobile'"
    class="event-card rounded-2xl overflow-hidden cursor-pointer"
    :style="{ '--accent': accent }"
    role="article"
    tabindex="0"
    :aria-label="event.title"
    @click="$emit('click')"
    @keydown.enter.self="$emit('click')"
    @touchstart.passive="noop"
  >
    <div class="flex items-start gap-3 pt-3.5 pr-3.5 pl-4" :class="hasMobileFooter ? '' : 'pb-3.5'">
      <div class="flex-1 min-w-0 flex flex-col gap-1">
        <!-- When: the clock, then how soon. One sentence of ink, so a wrap in
             Khmer breaks like text instead of dropping a pill onto a new line. -->
        <p class="flex flex-wrap items-center gap-x-1.5 text-[13px] leading-normal">
          <span class="font-semibold text-slate-900 tabular-nums">
            {{ formatEventTime(event.start_date) }}
          </span>
          <span
            v-if="relativeWhen"
            class="inline-flex items-center gap-1.5"
            :class="relativeWhen.isLive ? 'font-medium text-emerald-700' : 'text-slate-500'"
          >
            <span
              v-if="relativeWhen.isLive"
              class="w-1.5 h-1.5 rounded-full bg-emerald-500 live-pulse"
              aria-hidden="true"
            ></span>
            <span v-else class="text-slate-300" aria-hidden="true">·</span>
            {{ relativeWhen.label }}
          </span>
        </p>

        <!-- Title -->
        <h3 class="text-base font-semibold text-slate-900 leading-snug tracking-tight line-clamp-2">
          {{ event.title }}
        </h3>

        <!-- Location. `leading-relaxed` because `truncate` clips to the line
             box, and a Khmer coeng hangs below a Latin one. -->
        <p
          v-if="event.location || showMissingLocation"
          class="flex items-center gap-1.5 text-[13px] leading-relaxed min-w-0"
        >
          <template v-if="event.location">
            <MapPin class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
            <span class="text-slate-600 truncate">{{ event.location }}</span>
          </template>
          <template v-else>
            <AlertTriangle class="w-3.5 h-3.5 text-amber-500 flex-shrink-0" aria-hidden="true" />
            <span class="font-medium text-amber-700">{{ t('events.card.locationMissing') }}</span>
          </template>
        </p>
      </div>

      <!-- Event cover (square on mobile) -->
      <div class="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 cover-frame flex-shrink-0">
        <img
          :src="currentImageSrc"
          :alt="event.title"
          class="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          @error="handleImageError"
        />
      </div>
    </div>

    <!-- Footer: who, then the action. The hairline is inset to the content
         edges, the way a grouped list divides rows, rather than ruling the
         card in two. -->
    <div
      v-if="hasMobileFooter"
      class="mt-3 ml-4 mr-3.5 pt-1.5 pb-2 min-h-[40px] flex items-center gap-3 border-t border-slate-200/60"
    >
      <!-- One truncating line. The category leads because "Wedding · By Bo,
           Tun" reads as a phrase; its hue lands in the dot, where colour costs
           no legibility, and the label takes the muted accent. -->
      <p class="flex-1 min-w-0 truncate text-xs leading-relaxed text-slate-500">
        <template v-if="category">
          <span
            class="inline-block w-1.5 h-1.5 mr-1.5 -mt-px rounded-full align-middle"
            :style="{ backgroundColor: accent }"
            aria-hidden="true"
          ></span>
          <span class="font-medium" :style="{ color: categoryInk }">{{
            translateEventCategory(category)
          }}</span>
        </template>
        <template v-for="(part, index) in footerParts" :key="index">
          <span v-if="category || index > 0" class="mx-1.5 text-slate-300" aria-hidden="true">·</span>
          <span :class="part.tone">{{ part.label }}</span>
        </template>
      </p>

      <div v-if="showLike || showManageButton" class="flex items-center gap-1 flex-shrink-0">
        <!-- Like. No resting fill: the glyph aligns with the cover's edge
             above it (`last:-mr-2` gives back the padding), and the tint only
             exists while the finger is down. -->
        <button
          v-if="showLike"
          type="button"
          @click.stop="handleLikeClick"
          :disabled="isLikeLoading"
          class="tap-extend h-8 px-2 last:-mr-2 inline-flex items-center gap-1 rounded-full transition-[color,background-color,transform] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
          :class="isLiked ? 'text-rose-600 active:bg-rose-50' : 'text-slate-500 active:bg-slate-100'"
          :aria-label="isLiked ? t('events.drawer.unlike') : t('events.drawer.like')"
        >
          <Heart
            class="w-4 h-4 transition-transform duration-200"
            :class="[isLiked ? 'fill-current scale-110' : '', isLikeLoading ? 'animate-pulse' : '']"
            aria-hidden="true"
          />
          <span v-if="likesCount > 0" class="text-xs font-semibold tabular-nums">{{ likesCount }}</span>
        </button>

        <!-- Manage. "Manage" rather than "Manage Event": inside an event's own
             card the noun is the card, and the short verb is what keeps this
             from wrapping in Khmer. The accessible name keeps the title, so a
             screen reader moving down a list of them hears which event. -->
        <button
          v-if="showManageButton"
          type="button"
          @click.stop="$emit('manage')"
          class="tap-extend h-8 pl-3 pr-2 inline-flex items-center gap-0.5 rounded-lg bg-slate-100 text-[13px] font-medium text-slate-700 transition-[background-color,transform] duration-150 hover:bg-slate-200/70 active:bg-slate-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
          :aria-label="`${t('events.manageEvent')}: ${event.title}`"
        >
          {{ t('events.card.manage') }}
          <ChevronRight class="w-4 h-4 text-slate-400" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>

  <!-- Desktop Card -->
  <div
    v-else
    class="event-card rounded-2xl overflow-hidden cursor-pointer group"
    :style="{ '--accent': accent }"
    role="article"
    tabindex="0"
    :aria-label="event.title"
    @click="$emit('click')"
    @keydown.enter.self="$emit('click')"
    @touchstart.passive="noop"
  >
    <div class="py-4 pr-4 pl-5 sm:py-[18px] sm:pr-[18px] sm:pl-[21px] flex gap-4 sm:gap-[18px]">
      <!-- Event Details -->
      <div class="flex-1 min-w-0 flex flex-col gap-[7px]">
        <!-- Time, category and how soon -->
        <div class="flex items-center flex-wrap gap-x-2.5 gap-y-1.5">
          <span class="text-sm font-semibold text-slate-900 tabular-nums tracking-tight">
            {{ formatEventTime(event.start_date) }}
            <span v-if="timeRangeSuffix" class="font-normal text-slate-500">{{ timeRangeSuffix }}</span>
          </span>
          <span
            v-if="category"
            class="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11.5px] font-semibold"
            :style="categoryChipStyle"
          >
            <span
              class="w-1.5 h-1.5 rounded-full flex-shrink-0"
              :style="{ backgroundColor: accent }"
            ></span>
            {{ translateEventCategory(category) }}
          </span>
          <span
            v-if="relativeWhen"
            class="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11.5px] font-semibold"
            :class="relativeWhen.isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
          >
            <span
              v-if="relativeWhen.isLive"
              class="w-1.5 h-1.5 rounded-full bg-emerald-500 live-pulse"
            ></span>
            <Clock v-else class="w-3 h-3" />
            {{ relativeWhen.label }}
          </span>
        </div>

        <!-- Title -->
        <h3 class="text-[18.5px] font-semibold text-slate-900 leading-snug tracking-tight line-clamp-2">
          {{ event.title }}
        </h3>

        <!-- Location -->
        <div v-if="event.location || showMissingLocation" class="flex items-center gap-[7px] text-[13.5px] min-w-0">
          <template v-if="event.location">
            <MapPin class="w-[15px] h-[15px] text-slate-500 flex-shrink-0" />
            <span class="text-slate-600 truncate">{{ event.location }}</span>
          </template>
          <template v-else>
            <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span class="text-amber-700">{{ t('events.card.locationMissing') }}</span>
          </template>
        </div>

        <!-- Presence row. Falls through hosts → organiser → attendance → entry,
             so it renders something on every event instead of leaving the
             bottom half of the card blank. -->
        <div v-if="hasPresence" class="flex items-center flex-wrap gap-x-2 gap-y-1 text-[13px] text-slate-600 mt-px">
          <span v-if="hosts.length > 0" class="flex -space-x-1.5 flex-shrink-0">
            <span
              v-for="(host, idx) in hosts.slice(0, 3)"
              :key="idx"
              class="w-[22px] h-[22px] rounded-full border-2 border-white overflow-hidden bg-slate-200 flex items-center justify-center"
            >
              <img
                v-if="host.image"
                :src="host.image"
                :alt="host.name"
                class="w-full h-full object-cover"
              />
              <span
                v-else
                class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white text-[9.5px] font-bold"
              >
                {{ host.name.charAt(0).toUpperCase() }}
              </span>
            </span>
          </span>
          <span v-if="byline" class="truncate">{{ byline }}</span>
          <template v-if="attendance">
            <span v-if="byline" class="text-slate-300" aria-hidden="true">·</span>
            <span>{{ attendance }}</span>
          </template>
          <template v-if="entryChip">
            <span v-if="byline || attendance" class="text-slate-300" aria-hidden="true">·</span>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-md text-[11.5px] font-semibold border"
              :class="entryChipClass"
            >
              {{ entryChip.label }}
            </span>
          </template>
        </div>

        <!-- Manage Button (only for events user can edit) -->
        <button
          v-if="showManageButton"
          type="button"
          @click.stop="$emit('manage')"
          class="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
        >
          {{ t('events.manageEvent') }}
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Right Column: Cover with the like chip riding on it -->
      <div class="relative flex-shrink-0">
        <div class="w-52 h-32 rounded-xl overflow-hidden bg-slate-100 cover-frame">
          <img
            :src="currentImageSrc"
            :alt="event.title"
            class="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            @error="handleImageError"
          />
        </div>

        <!-- Like Button (Desktop) -->
        <button
          v-if="showLike"
          type="button"
          @click.stop="handleLikeClick"
          :disabled="isLikeLoading"
          class="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
          :class="isLiked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-500'"
          :aria-label="isLiked ? t('events.drawer.unlike') : t('events.drawer.like')"
        >
          <Heart
            class="w-3.5 h-3.5 transition-transform duration-200"
            :class="[
              isLiked ? 'fill-current scale-110' : '',
              isLikeLoading ? 'animate-pulse' : ''
            ]"
          />
          <span v-if="likesCount > 0" class="text-xs font-semibold">{{ likesCount }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  MapPin,
  ArrowRight,
  AlertTriangle,
  ChevronRight,
  Heart,
  Clock,
} from 'lucide-vue-next'
import type { Event } from '@/services/api'
import {
  formatEventTime,
  formatEventTimeRange,
  formatRelativeWhen,
  getAttendanceLabel,
  getBylineLabel,
  getEntryChip,
  getEventAccent,
  getEventThumbnail,
  getEventThumbnailMobile,
  getEventHosts,
  getEventCategory,
  getEventFallbackImage,
  withAlpha,
} from '@/composables/useEventFormatters'
import { mutedAccent } from '@/utils/eventCoverPlaceholder'
import { useEventLike } from '@/composables/useEventLike'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { translateEventCategory } = useCategoryTranslation()
const { t } = useAppLanguage()

const props = withDefaults(
  defineProps<{
    event: Event
    variant?: 'mobile' | 'desktop'
    showManageButton?: boolean
    showMissingLocation?: boolean
    showLikeButton?: boolean
  }>(),
  {
    variant: 'desktop',
    showManageButton: false,
    showMissingLocation: false,
    showLikeButton: true,
  }
)

const emit = defineEmits<{
  click: []
  manage: []
  'login-required': []
  'like-changed': [isLiked: boolean, likesCount: number]
}>()

// Like functionality
const { isLiked, likesCount, isLoading: isLikeLoading, toggleLike, updateState } = useEventLike(
  props.event.id,
  props.event.is_liked ?? false,
  props.event.likes_count ?? 0,
  {
    onLoginRequired: () => emit('login-required'),
    onSuccess: (liked, count) => emit('like-changed', liked, count),
  }
)

// Watch for external event data changes
watch(
  () => ({ isLiked: props.event.is_liked, likesCount: props.event.likes_count }),
  ({ isLiked, likesCount }) => {
    updateState(isLiked ?? false, likesCount ?? 0)
  }
)

const handleLikeClick = async (e: MouseEvent) => {
  e.stopPropagation()
  await toggleLike()
}

/**
 * iOS Safari only applies `:active` to an element that has a touch listener on
 * it or an ancestor, and nothing in the app registers one. Without this the
 * card's press state — and its buttons' — never rendered on an iPhone: the
 * feedback existed in CSS and the only confirmation a tap landed was the next
 * screen arriving. A passive no-op costs nothing and blocks no scroll.
 */
const noop = () => {}

// A failed banner falls back to generated cover art, which is an inline data
// URI and so cannot itself fail to load — one stage is all this needs.
const primaryImageError = ref(false)

const handleImageError = () => {
  primaryImageError.value = true
}

// Use optimized thumbnails based on variant (mobile uses square crop, desktop uses landscape)
const imageUrl = computed(() =>
  props.variant === 'mobile'
    ? getEventThumbnailMobile(props.event)
    : getEventThumbnail(props.event)
)

// Fallback image URL (generated category cover art)
const fallbackImageUrl = computed(() => getEventFallbackImage(props.event))

// Current image source - primary first, then fallback
const currentImageSrc = computed(() => {
  if (!primaryImageError.value) {
    return imageUrl.value
  }
  return fallbackImageUrl.value
})

const hosts = computed(() => getEventHosts(props.event))
const category = computed(() => getEventCategory(props.event))

/** Likes are only offered on public events. */
const showLike = computed(() => props.showLikeButton && props.event.privacy === 'public')

/** The category's identity colour — drives the rail and the category chip. */
const accent = computed(() => getEventAccent(props.event))

/** The accent quietened for small type — see `mutedAccent`. */
const categoryInk = computed(() => mutedAccent(accent.value))

/**
 * The category chip: the accent as a whisper of a fill, the accent at full
 * strength in the 4px dot, and a *muted* accent in the label.
 *
 * It used to set the raw accent as both the text colour and a 8% wash of
 * itself. At 10.5px semibold that made the chip the heaviest ink in the card —
 * louder than the 15.5px title above it — and on a list it stacked into a
 * column of warning labels. Identity still has to land, so the hue stays; it
 * just moves into the one mark that is pure colour and nothing else, where a
 * saturated hue costs no legibility. See `mutedAccent`.
 */
const categoryChipStyle = computed(() => ({
  backgroundColor: withAlpha(accent.value, '12'),
  color: categoryInk.value,
}))

const relativeWhen = computed(() => formatRelativeWhen(props.event))
const attendance = computed(() => getAttendanceLabel(props.event))
const entryChip = computed(() => getEntryChip(props.event))
const byline = computed(() => getBylineLabel(props.event))
const hasPresence = computed(
  () => Boolean(byline.value || attendance.value || entryChip.value) || hosts.value.length > 0
)

const entryChipClass = computed(() =>
  entryChip.value?.tone === 'price'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-sky-50 text-sky-700 border-sky-200'
)

/**
 * What follows the category in the mobile footer: the entry condition and
 * attendance when the event has them, otherwise the byline — the same priority
 * the mobile presence row always had. A list, so separators are drawn once
 * between parts instead of being guessed at per slot.
 *
 * Entry comes before attendance because the line truncates from the end, and
 * what gets cut should be the social proof, not the price. In the other order a
 * narrow phone rendered "24 going · From $10…" — the one fact that changes
 * whether you go, half-shown.
 */
const footerParts = computed(() => {
  const parts: Array<{ label: string; tone: string }> = []
  if (entryChip.value) {
    parts.push({
      label: entryChip.value.label,
      tone: entryChip.value.tone === 'price' ? 'font-medium text-amber-700' : 'font-medium text-sky-700',
    })
  }
  if (attendance.value) parts.push({ label: attendance.value, tone: '' })
  if (parts.length === 0 && byline.value) parts.push({ label: byline.value, tone: '' })
  return parts
})

const hasMobileFooter = computed(
  () => Boolean(category.value) || footerParts.value.length > 0 || showLike.value || props.showManageButton
)

/** Only the trailing half of the range — the start time is rendered separately. */
const timeRangeSuffix = computed(() => {
  const range = formatEventTimeRange(props.event.start_date, props.event.end_date)
  const start = formatEventTime(props.event.start_date)
  return range === start ? '' : range.slice(start.length)
})
</script>

<style scoped>
/*
 * The card was a near-invisible glass panel: white/70 on a near-white page with
 * a 5%-alpha shadow, which left a list of them reading as floating text. It now
 * carries a real edge, and the category accent rides its left side as a rail —
 * the cheapest way to give a column of cards colour rhythm.
 *
 * It stays translucent — the 12% of `premium-bg` showing through is what lets
 * a card near the top of the page pick up the brand bloom — but it carries
 * **no `backdrop-filter`**, and must not regain one. Blur is a material effect
 * for chrome that content passes *under*: the top bar, the tab pill, the
 * sticky date pill. A card sits *on* the ground, and the only thing behind it
 * is `premium-bg`'s gradient, which has no detail for a blur to soften — the
 * output of `blur(20px)` over a smooth gradient is that same gradient. So the
 * effect was invisible while costing a backdrop-root snapshot *per card*, and
 * a list is twenty to thirty of them. That is what made a tab switch hitch:
 * mounting the list promoted thirty compositing layers in one frame, and every
 * subsequent scroll re-sampled all of them.
 */
.event-card {
  position: relative;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 6px 16px -10px rgba(15, 23, 42, 0.25);
  transition:
    box-shadow 0.3s ease,
    border-color 0.3s ease,
    background-color 0.3s ease,
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
  /* The card draws its own press state; the grey tap flash is a second one,
     painted as a sharp rectangle over a rounded card. `manipulation` drops the
     double-tap-zoom wait from the input path. */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.event-card:focus-visible {
  outline: 2px solid rgba(14, 165, 233, 0.5);
  outline-offset: 2px;
}

/*
  The whole card is the tap target, and until now nothing about it moved when
  you pressed it — on a phone, where there is no hover to fall back on, the only
  confirmation that the tap landed was the next screen arriving. A row this size
  needs very little: 0.99 is about 3px across a phone's width, enough to read as
  the card taking the press without the text appearing to jump.
*/
.event-card:active {
  transform: scale(0.99);
  transition-duration: 80ms;
}

/*
  `:active` also matches every ancestor of the pressed element, so pressing
  Manage or the heart squeezed the whole card too — feedback for an action the
  finger did not take. The pressed button answers for itself. Written as an
  override rather than folded into the rule above so a browser without `:has()`
  keeps the card's own press and merely loses this refinement.
*/
.event-card:has(button:active) {
  transform: none;
}

/*
  Grows a 32px control to a 40px hit area without growing what it draws — the
  footer's buttons are sized to sit quietly in a row of 12px text, and the
  DESIGN.md touch floor is about the finger, not the pixels.
*/
.tap-extend {
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.tap-extend::after {
  content: '';
  position: absolute;
  inset: -4px;
}

/*
  The accent rail, and it *falls away* down the card rather than ruling a solid
  bar beside it.

  It was `inset 3px 0 0 0 var(--accent)` — the full-chroma accent at a constant
  alpha for the card's whole height. On one card that is a bookmark; on a list
  of fifteen it is fifteen saturated stripes down the left margin of a page
  whose wash is a pale mint, and the eye reads them as status flags rather than
  as identity. A gradient spends the hue where the card starts — beside the
  time and the category chip, which is what it is naming — and lets it go by
  the time it reaches the footer, so the same colour costs about a third of the
  ink and the column gets rhythm instead of stripes.

  A pseudo-element rather than a shadow because `box-shadow` takes a colour and
  not a gradient. It costs no compositing layer (no filter, no blur — see the
  note above about why this card carries neither) and `overflow: hidden` on the
  card clips it to the same radius the inset shadow followed. It is also the
  only thing here that must not respond to the pointer.
*/
.event-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--accent) 85%, transparent) 0%,
    color-mix(in srgb, var(--accent) 34%, transparent) 62%,
    color-mix(in srgb, var(--accent) 6%, transparent) 100%
  );
}

/*
  Gated on a real pointer. A touch device fires `:hover` on tap and then leaves
  it stuck until something else is tapped, so on a phone this lit one card in
  the list and kept it lit — which reads as a selection the list does not have.
*/
@media (hover: hover) and (pointer: fine) {
  .event-card:hover {
    background: rgba(255, 255, 255, 0.96);
    border-color: rgba(203, 213, 225, 0.95);
    box-shadow:
      0 2px 4px rgba(15, 23, 42, 0.05),
      0 14px 28px -14px rgba(15, 23, 42, 0.32);
  }
}

/* Keeps pale user-uploaded banners from bleeding into the card surface. */
.cover-frame {
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.07);
}

/* A long press on the cover opened iOS's save-image sheet in the middle of
   what was meant as a tap on the card. */
.cover-frame img {
  -webkit-touch-callout: none;
  user-select: none;
}

.live-pulse {
  animation: live-pulse 1.8s ease-in-out infinite;
}

@keyframes live-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.45;
    transform: scale(0.8);
  }
}

@media (prefers-reduced-motion: reduce) {
  .live-pulse {
    animation: none;
  }
  .event-card {
    transition: none;
  }
  .event-card:active {
    transform: none;
  }
}
</style>
