<template>
  <!-- Mobile Card -->
  <div
    v-if="variant === 'mobile'"
    class="event-card rounded-2xl overflow-hidden cursor-pointer"
    :style="{ '--accent': accent }"
    role="article"
    :aria-label="event.title"
    @click="$emit('click')"
  >
    <div class="py-3.5 pr-3.5 pl-4 flex gap-3">
      <!-- Event Details -->
      <div class="flex-1 min-w-0 flex flex-col gap-1">
        <!-- Time, category and how soon — same row as desktop -->
        <div class="flex items-center flex-wrap gap-x-2 gap-y-1">
          <span class="text-[13px] font-semibold text-slate-900 tabular-nums tracking-tight">
            {{ formatEventTime(event.start_date) }}
          </span>
          <span
            v-if="category"
            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold"
            :style="{ backgroundColor: withAlpha(accent, '14'), color: accent }"
          >
            <span class="w-1 h-1 rounded-full bg-current flex-shrink-0"></span>
            {{ translateEventCategory(category) }}
          </span>
          <span
            v-if="relativeWhen"
            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold"
            :class="relativeWhen.isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
          >
            <span
              v-if="relativeWhen.isLive"
              class="w-1.5 h-1.5 rounded-full bg-emerald-500 live-pulse"
            ></span>
            <Clock v-else class="w-2.5 h-2.5" />
            {{ relativeWhen.label }}
          </span>
        </div>

        <!-- Title -->
        <h3 class="text-[15.5px] font-semibold text-slate-900 leading-snug tracking-tight line-clamp-2">
          {{ event.title }}
        </h3>

        <!-- Location -->
        <div v-if="event.location || showMissingLocation" class="flex items-center gap-1.5 text-[12.5px] min-w-0">
          <template v-if="event.location">
            <MapPin class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span class="text-slate-600 truncate">{{ event.location }}</span>
          </template>
          <template v-else>
            <AlertTriangle class="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span class="text-amber-600">{{ t('events.card.locationMissing') }}</span>
          </template>
        </div>

        <!-- Presence: who's coming, what it costs. "How soon" now rides in the
             header row with the category, matching desktop. -->
        <div
          v-if="attendance || entryChip || byline"
          class="flex items-center flex-wrap gap-x-2 gap-y-1 mt-0.5"
        >
          <span v-if="attendance" class="text-[11.5px] text-slate-600">{{ attendance }}</span>
          <span
            v-if="entryChip"
            class="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold"
            :class="entryChipClass"
          >
            {{ entryChip.label }}
          </span>
          <span
            v-if="!attendance && !entryChip && byline"
            class="text-[11.5px] text-slate-500 truncate"
            >{{ byline }}</span
          >
        </div>

        <!-- Manage Button (only for events user can edit) -->
        <button
          v-if="showManageButton"
          @click.stop="$emit('manage')"
          class="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors self-start"
        >
          {{ t('events.manageEvent') }}
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Right Column: Cover + Like Button -->
      <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
        <!-- Event cover (square on mobile) -->
        <div class="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 cover-frame">
          <img
            :src="currentImageSrc"
            :alt="event.title"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
        </div>

        <!-- Like Button (Mobile) — stays below the cover; an 80px tile can't
             host a 40px touch target without swallowing the art. -->
        <button
          v-if="showLikeButton && event.privacy === 'public'"
          @click.stop="handleLikeClick"
          :disabled="isLikeLoading"
          class="flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200"
          :class="[
            isLiked
              ? 'text-rose-600 bg-rose-50'
              : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50/60'
          ]"
          :aria-label="isLiked ? t('events.drawer.unlike') : t('events.drawer.like')"
        >
          <Heart
            class="w-3.5 h-3.5 transition-transform duration-200"
            :class="[
              isLiked ? 'fill-current scale-110' : '',
              isLikeLoading ? 'animate-pulse' : ''
            ]"
          />
          <span v-if="likesCount > 0" class="text-[11.5px] font-semibold">{{ likesCount }}</span>
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
    :aria-label="event.title"
    @click="$emit('click')"
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
            :style="{ backgroundColor: withAlpha(accent, '14'), color: accent }"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
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
            <span class="text-amber-600">{{ t('events.card.locationMissing') }}</span>
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
          @click.stop="$emit('manage')"
          class="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors self-start"
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
            @error="handleImageError"
          />
        </div>

        <!-- Like Button (Desktop) -->
        <button
          v-if="showLikeButton && event.privacy === 'public'"
          @click.stop="handleLikeClick"
          :disabled="isLikeLoading"
          class="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all duration-200 hover:bg-white"
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

/** The category's identity colour — drives the rail and the category chip. */
const accent = computed(() => getEventAccent(props.event))

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
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow:
    inset 3px 0 0 0 var(--accent),
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 6px 16px -10px rgba(15, 23, 42, 0.25);
  transition:
    box-shadow 0.3s ease,
    border-color 0.3s ease,
    background-color 0.3s ease;
}

.event-card:hover {
  background: rgba(255, 255, 255, 0.96);
  border-color: rgba(203, 213, 225, 0.95);
  box-shadow:
    inset 3px 0 0 0 var(--accent),
    0 2px 4px rgba(15, 23, 42, 0.05),
    0 14px 28px -14px rgba(15, 23, 42, 0.32);
}

/* Keeps pale user-uploaded banners from bleeding into the card surface. */
.cover-frame {
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.07);
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
}
</style>
