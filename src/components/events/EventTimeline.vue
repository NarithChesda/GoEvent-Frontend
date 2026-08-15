<template>
  <div class="space-y-6 sm:space-y-8">
    <div
      v-for="dateGroup in dateGroups"
      :key="dateGroup.date"
      class="date-group relative"
    >
      <!-- Mobile: Timeline with Date Header and Cards -->
      <div class="sm:hidden relative">
        <!-- Timeline line (always visible) -->
        <div
          class="timeline-spine absolute left-[3px] w-0.5 bg-gradient-to-b from-[#2ecc71]/55 to-[#1e90ff]/40"
        ></div>

        <!-- Date Header with Dot (becomes pill when sticky). Rests 8px below
             the mobile top bar, which grows by the status-bar inset when the
             app is installed. -->
        <div
          class="sticky top-[calc(env(safe-area-inset-top,0px)+64px)] z-10 mb-3 date-header-sticky inline-flex items-center gap-2"
        >
          <div class="w-2 h-2 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] flex-shrink-0 ring-2 ring-white"></div>
          <div class="inline-flex items-baseline gap-2">
            <span class="text-slate-800 font-semibold text-lg">{{
              dateGroup.monthDay
            }}</span>
            <span class="text-slate-500 text-base">{{ dateGroup.weekday }}</span>
          </div>
        </div>

        <!-- Mobile Event Cards -->
        <div class="space-y-3 ml-5">
          <EventCard
            v-for="event in dateGroup.events"
            :key="`mobile-${event.id}`"
            :event="event"
            variant="mobile"
            :show-manage-button="showManageButton && canManageEvent(event)"
            :show-missing-location="showMissingLocation"
            :show-like-button="showLikeButton"
            @click="$emit('event-click', event)"
            @manage="$emit('event-manage', event)"
            @login-required="$emit('login-required')"
            @like-changed="(isLiked, likesCount) => $emit('like-changed', event.id, isLiked, likesCount)"
          />
        </div>
      </div>

      <!-- Desktop: Original Timeline Layout -->
      <div class="hidden sm:flex gap-4">
        <!-- Left: Date Column (Sticky) -->
        <div class="w-24 flex-shrink-0">
          <div class="sticky top-20 lg:top-24 pt-1">
            <div class="text-slate-800 font-semibold text-lg">
              {{ dateGroup.monthDay }}
            </div>
            <div class="text-slate-500 text-base">{{ dateGroup.weekday }}</div>
          </div>
        </div>

        <!-- Middle: Timeline. The spine used to be a 1px hairline at 30% alpha
             with a flat dot, which read as an accident rather than structure. -->
        <div class="flex flex-col items-center flex-shrink-0 relative">
          <!-- Timeline bead (Sticky) -->
          <div class="sticky top-20 lg:top-24 z-10">
            <div
              class="w-2.5 h-2.5 rounded-full bg-white mt-2 ring-[3px] ring-[#2ecc71] shadow-sm shadow-[#2ecc71]/30"
            ></div>
          </div>
          <!-- Timeline line: always show for all date groups -->
          <div
            class="timeline-spine absolute w-0.5 bg-gradient-to-b from-[#2ecc71]/55 to-[#1e90ff]/40"
          ></div>
        </div>

        <!-- Right: Event Cards (Desktop).
             `min-w-0` is load-bearing, not tidiness. `flex-1` leaves
             `min-width: auto`, so this column's minimum size is its
             *min-content* width — and a card's min-content includes the
             location line at full length, because `truncate` sets
             `white-space: nowrap`, which leaves the string no break
             opportunities. `min-w-0` on the card's body lets it shrink during
             layout but does not remove that string from this column's
             intrinsic size. The result was that one event with a long venue
             string ("The Lane Ground and Conference Hall, One Park, No. 58
             Street R8, …") pushed its whole date group ~47px wider than every
             other group, which is exactly how much that line overshot the
             available width. Capping the floor here makes the column take its
             flex share, and the ellipsis finally does its job. -->
        <div class="flex-1 min-w-0 space-y-4 pb-2">
          <EventCard
            v-for="event in dateGroup.events"
            :key="event.id"
            :event="event"
            variant="desktop"
            :show-manage-button="showManageButton && canManageEvent(event)"
            :show-missing-location="showMissingLocation"
            :show-like-button="showLikeButton"
            @click="$emit('event-click', event)"
            @manage="$emit('event-manage', event)"
            @login-required="$emit('login-required')"
            @like-changed="(isLiked, likesCount) => $emit('like-changed', event.id, isLiked, likesCount)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event } from '@/services/api'
import type { DateGroup } from '@/composables/useEventFormatters'
import EventCard from './EventCard.vue'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(
  defineProps<{
    dateGroups: DateGroup[]
    showManageButton?: boolean
    showMissingLocation?: boolean
    showLikeButton?: boolean
  }>(),
  {
    showManageButton: false,
    showMissingLocation: false,
    showLikeButton: true,
  }
)

defineEmits<{
  'event-click': [event: Event]
  'event-manage': [event: Event]
  'login-required': []
  'like-changed': [eventId: string, isLiked: boolean, likesCount: number]
}>()

const authStore = useAuthStore()

const canManageEvent = (event: Event): boolean => {
  if (!props.showManageButton) return false
  return (
    event.can_edit === true ||
    (authStore.user?.id !== undefined && event.organizer === authStore.user.id)
  )
}
</script>

<style scoped>
/* Timeline spine.
   Dashes are cut out of the brand gradient with a mask rather than drawn with
   `border-style: dashed`, which would force the line down to a single flat
   color. The spine also overshoots its own date group by exactly the stack gap
   (`space-y-6` / `sm:space-y-8`) so the thread runs unbroken from one date to
   the next instead of restarting under every header. */
.timeline-spine {
  top: 0;
  bottom: -1.5rem;
  -webkit-mask-image: repeating-linear-gradient(
    to bottom,
    #000 0 0.375rem,
    transparent 0.375rem 0.6875rem
  );
  mask-image: repeating-linear-gradient(
    to bottom,
    #000 0 0.375rem,
    transparent 0.375rem 0.6875rem
  );
}

@media (min-width: 640px) {
  .timeline-spine {
    bottom: -2rem;
  }
}

/* Ends are anchored to the beads: start at the first one and stop at the last
   card instead of dangling into empty space. Both offsets are that bead's
   center — half the date header's 1.75rem line box on mobile, `mt-2` plus half
   of `h-2.5` on desktop — in rem rather than px, because the root font drops to
   75% on laptop viewports (see the root-scale block in src/assets/main.css) and
   the beads move with it. Same reason the dash pattern above is in rem. */
.date-group:first-child .timeline-spine {
  top: 0.875rem;
}

@media (min-width: 640px) {
  .date-group:first-child .timeline-spine {
    top: 0.8125rem;
  }
}

.date-group:last-child .timeline-spine {
  bottom: 0;
}

/* Date header sticky pill effect - covers bullet and text */
@media (max-width: 639px) {
  .date-header-sticky {
    width: fit-content;
    padding: 4px 24px 4px 14px;
    margin: -4px -24px -4px -14px;
    border-radius: 9999px;
    border: 1px solid transparent;
    background-color: transparent;
    /* Prevent sticky scroll shake - force GPU compositing */
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    /* Contain layout to prevent repaints */
    contain: layout style;
  }

  .date-header-sticky.is-stuck {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow:
      0 2px 8px rgba(46, 204, 113, 0.1),
      0 1px 3px rgba(30, 144, 255, 0.08);
    border-color: rgba(46, 204, 113, 0.2);
  }
}
</style>
