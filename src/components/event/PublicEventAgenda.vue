<template>
  <div v-if="groupedItems && Object.keys(groupedItems).length > 0" class="space-y-2">
    <div
      v-for="(group, dateKey) in groupedItems"
      :key="dateKey"
      class="border rounded-xl overflow-hidden bg-white"
      :style="{ borderColor: 'var(--evt-ring)' }"
    >
      <!-- Date Group Header -->
      <button
        @click="toggleGroup(dateKey)"
        :aria-expanded="Boolean(expandedGroups[dateKey])"
        class="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-inset"
        :style="{ backgroundColor: 'var(--evt-wash)' }"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
            :style="{ backgroundColor: 'var(--evt-tint)', color: 'var(--evt-accent)' }"
          >
            <span class="text-[9px] font-semibold uppercase leading-none">{{
              getMonthAbbr(group.date)
            }}</span>
            <span class="text-sm font-bold leading-tight">{{ getDayOfMonth(group.date) }}</span>
          </div>
          <div class="text-left min-w-0">
            <p class="text-sm font-medium text-slate-900 truncate">{{ group.displayDate }}</p>
            <p class="text-xs text-slate-500">
              {{ t('events.drawer.agendaItems', { count: group.items.length }, group.items.length) }}
            </p>
          </div>
        </div>
        <ChevronDown
          class="w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0"
          :class="{ 'rotate-180': expandedGroups[dateKey] }"
        />
      </button>

      <!-- Agenda Items -->
      <Transition name="collapse">
        <div v-if="expandedGroups[dateKey]" class="grid grid-rows-[1fr]">
          <div class="min-h-0 overflow-hidden">
            <div class="divide-y divide-slate-100 border-t border-slate-100">
              <div
                v-for="item in group.items"
                :key="item.id"
                class="flex items-center justify-between gap-3 px-4 py-3"
              >
                <p class="text-sm font-medium text-slate-900 truncate">{{ item.title }}</p>
                <p
                  v-if="item.start_time_text || item.end_time_text"
                  class="text-sm text-slate-500 flex-shrink-0 tabular-nums"
                >
                  {{ formatAgendaTime(item) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { EventAgendaItem } from '@/services/api/types/event.types'
import { useEventDateFormatters } from '@/composables/event'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface AgendaGroup {
  date: string
  displayDate: string
  items: EventAgendaItem[]
}

interface Props {
  items: EventAgendaItem[]
  eventStartDate: string
}

const props = defineProps<Props>()

const { t } = useAppLanguage()
const { getMonthAbbr, getDayOfMonth, getFormattedDate, formatAgendaTime } =
  useEventDateFormatters()

const expandedGroups = ref<Record<string, boolean>>({})

const groupedItems = computed(() => {
  if (!props.items || props.items.length === 0) return {} as Record<string, AgendaGroup>

  const sorted = [...props.items].sort((a, b) => a.order - b.order)
  const groups: Record<string, AgendaGroup> = {}

  sorted.forEach((item) => {
    const dateKey = item.date_text || item.date || props.eventStartDate || 'unknown'
    const dateForDisplay = item.date || props.eventStartDate || new Date().toISOString()

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateForDisplay,
        displayDate: item.date_text || getFormattedDate(dateForDisplay),
        items: [],
      }
      // Auto-expand first group
      if (Object.keys(groups).length === 1 && expandedGroups.value[dateKey] === undefined) {
        expandedGroups.value[dateKey] = true
      }
    }
    groups[dateKey].items.push(item)
  })

  return groups
})

const toggleGroup = (dateKey: string) => {
  expandedGroups.value[dateKey] = !expandedGroups.value[dateKey]
}
</script>

<style scoped>
/* Design system §15 — grid-rows, never max-height. */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none;
  }
}
</style>
