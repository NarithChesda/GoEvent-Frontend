<template>
  <!-- Below two facts this is a row of near-empty boxes, so it stays away. -->
  <div
    v-if="tiles.length >= 2"
    class="grid gap-2 px-4 pt-4"
    :class="tiles.length === 2 ? 'grid-cols-2' : 'grid-cols-3'"
  >
    <div
      v-for="tile in tiles"
      :key="tile.key"
      class="rounded-2xl border bg-white px-3 py-2.5 min-w-0"
      :style="{ borderColor: 'var(--evt-ring)' }"
    >
      <p class="text-lg font-bold text-slate-900 leading-tight truncate">{{ tile.value }}</p>
      <p class="text-[11px] text-slate-500 leading-tight truncate">{{ tile.label }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The scale of the event, at a glance.
 *
 * Everything here is derived from fields the drawer already has loaded — no
 * extra request, and nothing invented: an event that carries no agenda, one
 * host and no capacity simply shows nothing, which is the common case for a
 * scraped listing and correctly so.
 */

import { computed } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  startDate: string
  endDate: string
  agendaCount: number
  hostCount: number
  maxAttendees: number | null
  registrationsCount: number
}

const props = defineProps<Props>()

const { t } = useAppLanguage()

interface Tile {
  key: string
  value: string
  label: string
}

/**
 * Calendar days spanned, inclusive — a conference running Fri 09:00 → Sun 17:00
 * is three days, not the 2.3 an hour-difference would give.
 */
const durationDays = computed(() => {
  const start = new Date(props.startDate)
  const end = new Date(props.endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0

  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  if (endDay < startDay) return 0

  return Math.round((endDay - startDay) / 86_400_000) + 1
})

/** Seats still open, when the organiser published a cap. */
const spotsLeft = computed(() => {
  if (!props.maxAttendees || props.maxAttendees <= 0) return 0
  return Math.max(props.maxAttendees - (props.registrationsCount || 0), 0)
})

/**
 * At most three, in the order a reader would ask them: how long, how much
 * programme, who is running it, is there still room.
 */
const tiles = computed<Tile[]>(() => {
  const all: Tile[] = []

  if (durationDays.value > 1) {
    all.push({
      key: 'days',
      value: String(durationDays.value),
      label: t('events.drawer.stats.days', durationDays.value),
    })
  }

  if (props.agendaCount > 0) {
    all.push({
      key: 'sessions',
      value: String(props.agendaCount),
      label: t('events.drawer.stats.sessions', props.agendaCount),
    })
  }

  if (props.hostCount > 1) {
    all.push({
      key: 'hosts',
      value: String(props.hostCount),
      label: t('events.drawer.stats.hosts', props.hostCount),
    })
  }

  if (spotsLeft.value > 0) {
    all.push({
      key: 'spots',
      value: String(spotsLeft.value),
      label: t('events.drawer.stats.spotsLeft', spotsLeft.value),
    })
  }

  return all.slice(0, 3)
})
</script>
