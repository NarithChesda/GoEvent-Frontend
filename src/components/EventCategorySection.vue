<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Category Header -->
    <div class="flex items-center justify-between px-4 sm:px-0">
      <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
        {{ categoryGroup.category?.name || 'Uncategorized' }}
      </h2>
      <div class="flex items-center gap-3 sm:gap-4">
        <span class="text-xs sm:text-sm text-slate-500">
          {{ categoryGroup.events.length }} {{ categoryGroup.events.length === 1 ? 'event' : 'events' }}
        </span>
        <!-- Navigation Arrows - Only show if content overflows (hidden on mobile) -->
        <div v-if="hasOverflow" class="hidden md:flex items-center gap-2">
          <button
            @click="handleScrollLeft"
            class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft class="w-4 h-4 text-slate-600" />
          </button>
          <button
            @click="handleScrollRight"
            class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight class="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>

    <!-- Horizontal scrolling container for all screen sizes -->
    <div
      :ref="setScrollContainerRef"
      class="flex overflow-x-auto gap-4 sm:gap-6 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
    >
      <EventCard
        v-for="event in categoryGroup.events"
        :key="event.id"
        :event="event"
        @click="handleEventClick(event)"
        @edit="handleEventEdit"
        @delete="handleEventDelete"
        class="cursor-pointer flex-none w-[calc(75vw-2.25rem)] sm:w-[calc(45vw-2rem)] md:w-[calc((100vw-8rem)/3-1.5rem)] lg:w-[calc((1280px-8rem)/3-1.5rem)] xl:w-[calc((1536px-8rem)/3-1.5rem)] max-w-[450px] min-w-[225px] snap-center mobile-card"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import EventCard from './EventCard.vue'
import type { Event, EventCategory } from '../services/api'

/**
 * EventCategorySection Component
 *
 * Reusable component for rendering a category section with horizontal scrolling events.
 * Eliminates template duplication across different view types.
 */

interface CategoryGroup {
  category: EventCategory | null
  events: Event[]
}

interface Props {
  /** Category group containing category info and events */
  categoryGroup: CategoryGroup
  /** Prefix for unique category ID (e.g., 'my-', 'registered-') */
  viewPrefix?: string
  /** Whether the category container has overflow */
  hasOverflow: boolean
}

interface Emits {
  (e: 'view-event', event: Event): void
  (e: 'edit-event', event: Event): void
  (e: 'delete-event', event: Event): void
  (e: 'scroll-left', categoryId: string | number): void
  (e: 'scroll-right', categoryId: string | number): void
  (e: 'set-scroll-ref', categoryId: string | number, el: unknown): void
}

const props = withDefaults(defineProps<Props>(), {
  viewPrefix: ''
})

const emit = defineEmits<Emits>()

/**
 * Get the full category ID with prefix
 */
const getCategoryId = (): string | number => {
  const baseId = props.categoryGroup.category?.id || 'uncategorized'
  return props.viewPrefix ? `${props.viewPrefix}${baseId}` : baseId
}

/**
 * Set scroll container ref via emit
 */
const setScrollContainerRef = (el: unknown) => {
  emit('set-scroll-ref', getCategoryId(), el)
}

/**
 * Handle scroll left button click
 */
const handleScrollLeft = () => {
  emit('scroll-left', getCategoryId())
}

/**
 * Handle scroll right button click
 */
const handleScrollRight = () => {
  emit('scroll-right', getCategoryId())
}

/**
 * Handle event card click
 */
const handleEventClick = (event: Event) => {
  emit('view-event', event)
}

/**
 * Handle event edit
 */
const handleEventEdit = (event: Event) => {
  emit('edit-event', event)
}

/**
 * Handle event delete
 */
const handleEventDelete = (event: Event) => {
  emit('delete-event', event)
}
</script>

<style scoped>
/* Hide scrollbar for horizontal scroll on mobile */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}

/* Mobile card styling */
@media (max-width: 767px) {
  /* Make edit/delete buttons visible on mobile cards */
  .mobile-card :deep(.group) .absolute.top-3.right-3 {
    opacity: 1 !important;
  }

  /* Adjust mobile card styling */
  .mobile-card {
    transform-origin: center;
    transition: transform 0.2s ease;
  }

  .mobile-card:active {
    transform: scale(0.98);
  }

  /* Improve touch targets on mobile */
  .mobile-card :deep(button) {
    min-width: 36px;
    min-height: 36px;
  }
}
</style>
