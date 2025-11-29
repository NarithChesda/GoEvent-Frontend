<template>
  <div class="space-y-6 sm:space-y-8">
    <div
      v-for="(dateGroup, index) in dateGroups"
      :key="dateGroup.date"
      class="relative"
    >
      <!-- Mobile: Timeline with Date Header and Cards -->
      <div class="sm:hidden relative">
        <!-- Timeline line -->
        <div
          v-if="index < dateGroups.length - 1"
          class="absolute left-[3.5px] top-7 bottom-0 w-px bg-slate-200"
        ></div>

        <!-- Date Header with Dot (becomes pill when sticky) -->
        <div
          class="sticky top-[64px] z-10 mb-3 date-header-sticky inline-flex items-center gap-2"
        >
          <div class="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0"></div>
          <div class="inline-flex items-baseline gap-2">
            <span class="text-slate-900 font-semibold text-lg">{{
              dateGroup.monthDay
            }}</span>
            <span class="text-slate-400 text-base">{{ dateGroup.weekday }}</span>
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
            @click="$emit('event-click', event)"
            @manage="$emit('event-manage', event)"
          />
        </div>
      </div>

      <!-- Desktop: Original Timeline Layout -->
      <div class="hidden sm:flex gap-4">
        <!-- Left: Date Column (Sticky) -->
        <div class="w-24 flex-shrink-0">
          <div class="sticky top-20 lg:top-24 pt-1">
            <div class="text-slate-900 font-semibold text-lg">
              {{ dateGroup.monthDay }}
            </div>
            <div class="text-slate-400 text-base">{{ dateGroup.weekday }}</div>
          </div>
        </div>

        <!-- Middle: Timeline -->
        <div class="flex flex-col items-center flex-shrink-0 relative">
          <!-- Timeline dot (Sticky) -->
          <div class="sticky top-20 lg:top-24 z-10">
            <div class="w-2.5 h-2.5 rounded-full bg-slate-300 mt-2"></div>
          </div>
          <!-- Timeline line -->
          <div
            v-if="index < dateGroups.length - 1 || dateGroup.events.length > 1"
            class="absolute top-4 bottom-0 w-px bg-slate-200"
          ></div>
        </div>

        <!-- Right: Event Cards (Desktop) -->
        <div class="flex-1 space-y-4 pb-2">
          <EventCard
            v-for="event in dateGroup.events"
            :key="event.id"
            :event="event"
            variant="desktop"
            :show-manage-button="showManageButton && canManageEvent(event)"
            :show-missing-location="showMissingLocation"
            @click="$emit('event-click', event)"
            @manage="$emit('event-manage', event)"
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
  }>(),
  {
    showManageButton: false,
    showMissingLocation: false,
  }
)

defineEmits<{
  'event-click': [event: Event]
  'event-manage': [event: Event]
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
    background-color: rgb(255, 255, 255);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border-color: rgb(226, 232, 240);
  }
}
</style>
