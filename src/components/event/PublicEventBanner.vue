<template>
  <!-- The hero is a single-cell grid: the artwork covers it absolutely, the copy
       sits in the cell, and a pseudo-element holds the 1.91:1 banner stencil as a
       *floor*. So the box is exactly the banner ratio whenever the copy fits, and
       grows by only the few pixels it needs when it doesn't — which is the common
       case on a phone, where the chips, a wrapped title and the organizer line
       together run taller than 204px. The copy used to be `absolute bottom-0`
       inside a fixed-ratio box, so on a narrow screen it simply climbed out of the
       hero and collided with the drawer's floating header controls.

       `overflow-hidden` is load-bearing: the motif below is deliberately bled
       past the right and bottom edges, and the scroll container above sets
       `overflow-y: auto`, which per spec computes `overflow-x` to `auto` too —
       so any horizontal bleed here turns into a page-wide scrollbar. -->
  <div class="hero relative w-full bg-slate-100 overflow-hidden">
    <img
      v-if="!fallbackError"
      :src="bannerSrc"
      :alt="title"
      class="absolute inset-0 w-full h-full object-cover"
      @error="emit('banner-error')"
    />
    <!-- Fallback when images fail -->
    <div
      v-else
      class="absolute inset-0 bg-gradient-to-br from-[#2ecc71]/10 to-[#1e90ff]/10 flex flex-col items-center justify-center"
    >
      <CalendarDays class="w-12 h-12 text-[#2ecc71]/40 mb-2" />
      <span class="text-sm text-slate-400">{{ categoryName || 'Event' }}</span>
    </div>

    <!-- Scrim. Painted from the category's own cover-art stops rather than
         the fixed near-black purple this used to carry, so a music event's
         hero settles into violet and a wedding's into rose. Deep enough at
         the base to hold a two-line title over a bright photo. -->
    <div class="absolute inset-0" :style="{ background: 'var(--evt-scrim)' }" aria-hidden="true"></div>

    <!-- Category motif, at a few percent over the scrim — enough to give the
         hero a face on events that do have a photo, invisible enough never to
         compete with it. Dropped on quiet categories, where any decoration is
         the wrong note, and on generated covers, which draw this very mark
         full-bleed already: watermarking it a second time just printed the
         category icon twice in one frame. -->
    <div
      v-if="!isQuiet && !hasGeneratedCover"
      class="absolute -bottom-6 -right-6 w-40 h-40 opacity-[0.07] pointer-events-none"
      :style="{
        maskImage: `url('${motif}')`,
        WebkitMaskImage: `url('${motif}')`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        backgroundColor: '#ffffff',
      }"
      aria-hidden="true"
    ></div>

    <!-- Metadata, title & organizer.

         The category and countdown chips used to sit in the hero's top
         corners, which is the same band the drawer's floating header controls
         occupy — the close button clipped the category and the header icons
         covered the countdown. They belong with the title anyway: this is the
         event's identity line, not decoration pinned to the corners.

         The top padding is the header row's own height, so the chips clear the
         controls whatever the hero ends up measuring. The bottom padding has to
         clear the quick-facts card, which is lifted 28px (`-mt-7`) onto the
         hero's edge — anything under ~1.75rem leaves the organizer line touching
         the card, or tucked behind it. -->
    <div class="hero-copy relative px-4 pt-16 pb-12 sm:px-5 sm:pt-14 sm:pb-14">
      <div class="flex flex-wrap items-center gap-2 mb-2.5">
        <span
          v-if="isFundraising"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-emerald-700 shadow-lg"
        >
          <Heart class="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
          {{ t('events.drawer.fundraiser') }}
        </span>
        <span
          v-else-if="categoryName"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.16] backdrop-blur-md border border-white/25 rounded-full text-xs font-semibold text-white max-w-full"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0"></span>
          <span class="truncate">{{ categoryName }}</span>
        </span>

        <span
          v-if="relativeLabel"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border"
          :class="
            isLive
              ? 'bg-emerald-500/90 border-emerald-300/40 text-white'
              : 'bg-white/[0.16] border-white/25 text-white'
          "
        >
          <span v-if="isLive" class="w-1.5 h-1.5 rounded-full bg-white live-pulse"></span>
          <Clock v-else class="w-3.5 h-3.5" />
          {{ relativeLabel }}
        </span>
      </div>

      <!-- Three lines on a phone, where a title that fits one desktop line
           routinely wraps to three; the hero grows to hold them rather than
           truncating an event's name in the one place it has to be complete. -->
      <h1
        class="text-2xl md:text-3xl font-bold text-white leading-tight mb-2 banner-title line-clamp-3 sm:line-clamp-2"
      >
        {{ title }}
      </h1>
      <!-- Byline. Attendance rides here rather than in the quick-facts card:
           "who's behind it" and "is anyone else going" are one question, and
           the card's third row was carrying a 48px icon column for four words. -->
      <div class="flex items-center gap-2 text-white/90 text-sm min-w-0">
        <!-- Real avatar when the organizer has one. This always drew initials
             before, even for organizers whose picture was already loaded. -->
        <div
          class="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden flex-shrink-0"
        >
          <img
            v-if="organizerImage && !avatarError"
            :src="organizerImage"
            :alt="organizerName"
            class="w-full h-full object-cover"
            @error="avatarError = true"
          />
          <span v-else class="text-xs font-medium">{{ organizerInitials }}</span>
        </div>
        <span class="truncate">{{ t('events.drawer.byOrganizer', { name: organizerName }) }}</span>
        <template v-if="attendanceLabel">
          <span class="text-white/50 flex-shrink-0" aria-hidden="true">·</span>
          <span class="flex-shrink-0 font-medium">{{ attendanceLabel }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CalendarDays, Heart, Clock } from 'lucide-vue-next'
import { useEventDateFormatters } from '@/composables/event'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  bannerSrc: string
  fallbackError: boolean
  title: string
  categoryName: string | null
  isFundraising: boolean
  organizerName: string
  /** Resolved avatar URL, when the organizer has one. */
  organizerImage?: string | null
  /** The category mark as a data URI, from `useEventTheme`. */
  motif: string
  /** Whether `bannerSrc` is the generated category cover rather than a photo. */
  hasGeneratedCover?: boolean
  /** Funerals and memorials — no motif, no pulse. */
  isQuiet?: boolean
  /** "In 9 days" / "Happening now", or null past the horizon. */
  relativeLabel?: string | null
  isLive?: boolean
  /** "240 going" / "12 interested", or null when the event has neither. */
  attendanceLabel?: string | null
}

interface Emits {
  (e: 'banner-error'): void
}

const props = withDefaults(defineProps<Props>(), {
  organizerImage: null,
  hasGeneratedCover: false,
  isQuiet: false,
  relativeLabel: null,
  isLive: false,
  attendanceLabel: null,
})
const emit = defineEmits<Emits>()

const { t } = useAppLanguage()
const { getInitials } = useEventDateFormatters()

const organizerInitials = computed(() => getInitials(props.organizerName))

// Prev/next swaps the event under this component without remounting it, so a
// broken avatar on one event must not stick to the next one.
const avatarError = ref(false)
watch(
  () => props.organizerImage,
  () => {
    avatarError.value = false
  }
)
</script>

<style scoped>
/* Ratio floor. `::before` and the copy share one grid cell, so the row resolves
   to whichever is taller — the 1.91:1 banner stencil (`aspect-banner`, the Open
   Graph crop every surface renders `banner_image` at) or the copy itself. The
   artwork is absolutely positioned and takes no part in the sizing, so it simply
   covers whatever height wins. */
.hero {
  display: grid;
}

.hero::before {
  content: '';
  grid-area: 1 / 1;
  width: 100%;
  aspect-ratio: 1200 / 630;
}

.hero-copy {
  grid-area: 1 / 1;
  align-self: end;
}

/* Carries the headline over the brightest part of any banner the scrim leaves. */
.banner-title {
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.45);
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
}
</style>
