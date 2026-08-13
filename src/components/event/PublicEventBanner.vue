<template>
  <div class="relative">
    <!-- Banner Image. One ratio for every event type: fundraisers used to
         render 16/9, which re-cropped a banner the host had already framed
         against the 1.91:1 stencil.

         `overflow-hidden` is load-bearing: the motif below is deliberately bled
         past the right and bottom edges, and the scroll container above sets
         `overflow-y: auto`, which per spec computes `overflow-x` to `auto` too —
         so any horizontal bleed here turns into a page-wide scrollbar. -->
    <div class="relative w-full aspect-banner bg-slate-100 overflow-hidden">
      <img
        v-if="!fallbackError"
        :src="bannerSrc"
        :alt="title"
        class="w-full h-full object-cover"
        @error="emit('banner-error')"
      />
      <!-- Fallback when images fail -->
      <div
        v-else
        class="w-full h-full bg-gradient-to-br from-[#2ecc71]/10 to-[#1e90ff]/10 flex flex-col items-center justify-center"
      >
        <CalendarDays class="w-12 h-12 text-[#2ecc71]/40 mb-2" />
        <span class="text-sm text-slate-400">{{ categoryName || 'Event' }}</span>
      </div>

      <!-- Scrim. Painted from the category's own cover-art stops rather than
           the fixed near-black purple this used to carry, so a music event's
           hero settles into violet and a wedding's into rose. Deep enough at
           the base to hold a two-line title over a bright photo. -->
      <div class="absolute inset-0" :style="{ background: 'var(--evt-scrim)' }" aria-hidden="true"></div>

      <!-- Category motif. The same mark the generated cover art draws, at a few
           percent over the scrim — enough to give the hero a face on events that
           do have a photo, invisible enough never to compete with it. Dropped
           on quiet categories, where any decoration is the wrong note. -->
      <div
        v-if="!isQuiet"
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
           event's identity line, not decoration pinned to the corners. -->
      <div class="absolute bottom-0 left-0 right-0 p-5 pb-8">
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

        <!-- Clamped so a long title can't grow the block past the hero's fixed
             1.91:1 height and climb back into the header band. -->
        <h1
          class="text-2xl md:text-3xl font-bold text-white leading-tight mb-2 banner-title line-clamp-2"
        >
          {{ title }}
        </h1>
        <div class="flex items-center gap-2 text-white/90 text-sm">
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
        </div>
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
  /** Funerals and memorials — no motif, no pulse. */
  isQuiet?: boolean
  /** "In 9 days" / "Happening now", or null past the horizon. */
  relativeLabel?: string | null
  isLive?: boolean
}

interface Emits {
  (e: 'banner-error'): void
}

const props = withDefaults(defineProps<Props>(), {
  organizerImage: null,
  isQuiet: false,
  relativeLabel: null,
  isLive: false,
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
