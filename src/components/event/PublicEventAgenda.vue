<template>
  <div v-if="groupedItems && Object.keys(groupedItems).length > 0" class="space-y-2">
    <div
      v-for="(group, dateKey) in groupedItems"
      :key="dateKey"
      class="border border-slate-200 rounded-xl overflow-hidden"
    >
      <!-- Date Group Header -->
      <button
        @click="toggleGroup(dateKey)"
        class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-white rounded-lg flex flex-col items-center justify-center border border-slate-200"
          >
            <span class="text-[9px] font-semibold text-slate-500 uppercase leading-none">{{
              getMonthAbbr(group.date)
            }}</span>
            <span class="text-sm font-bold text-slate-900 leading-tight">{{
              getDayOfMonth(group.date)
            }}</span>
          </div>
          <div class="text-left">
            <p class="text-sm font-medium text-slate-900">{{ group.displayDate }}</p>
            <p class="text-xs text-slate-500">
              {{ group.items.length }} {{ group.items.length === 1 ? 'item' : 'items' }}
            </p>
          </div>
        </div>
        <ChevronDown
          class="w-5 h-5 text-slate-400 transition-transform duration-200"
          :class="{ 'rotate-180': expandedGroups[dateKey] }"
        />
      </button>

      <!-- Agenda Items -->
      <div v-show="expandedGroups[dateKey]" class="divide-y divide-slate-100 bg-white">
        <div
          v-for="item in group.items"
          :key="item.id"
          class="flex items-center justify-between gap-3 px-4 py-3"
        >
          <p class="text-sm font-medium text-slate-900 truncate">{{ item.title }}</p>
          <p v-if="item.start_time_text || item.end_time_text" class="text-sm text-slate-500 flex-shrink-0">
            {{ formatAgendaTime(item) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { EventAgendaItem } from '@/services/api/types/event.types'
import { useEventDateFormatters } from '@/composables/event'

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
