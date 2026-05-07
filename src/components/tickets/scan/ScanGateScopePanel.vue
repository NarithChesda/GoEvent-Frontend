<template>
  <!--
    Inline disclosure panel for gate-tier scoping. Lives directly below the
    scan header — no teleport, no second backdrop. Each toggle auto-saves
    via @change so there is no Save/Cancel mental model for door staff.
  -->
  <div
    class="grid transition-[grid-template-rows] duration-200 ease-out"
    :class="open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    :aria-hidden="!open"
  >
    <div class="overflow-hidden">
      <div class="border-b border-slate-200 bg-white px-4 py-3">
        <div class="flex items-center justify-between gap-2 mb-2">
          <p class="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
            {{ t('management.tickets.scan.gateConfig.title') }}
          </p>
          <span
            v-if="hasSelection"
            class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium tabular-nums"
          >
            {{ t('management.tickets.scan.gateConfig.selectedCount', { count: allowedTierIds!.length }) }}
          </span>
        </div>

        <div class="max-h-64 overflow-y-auto -mx-1">
          <label
            class="flex items-center gap-3 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <input
              type="radio"
              :checked="!hasSelection"
              class="w-4 h-4 text-emerald-500 border-slate-300 focus:ring-emerald-500"
              @change="onSelectAll"
            />
            <span class="text-sm font-medium text-slate-900">
              {{ t('management.tickets.scan.gateConfig.allTiers') }}
            </span>
          </label>

          <hr v-if="tiers.length > 0" class="my-1.5 border-slate-100" />

          <label
            v-for="tier in tiers"
            :key="tier.id"
            class="flex items-center gap-3 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <input
              type="checkbox"
              :checked="allowedTierIds?.includes(tier.id) ?? false"
              class="w-4 h-4 rounded text-emerald-500 border-slate-300 focus:ring-emerald-500"
              @change="onToggle(tier.id)"
            />
            <span class="flex-1 text-sm text-slate-900 truncate">{{ tier.name }}</span>
            <span class="text-xs text-slate-500 tabular-nums flex-shrink-0">
              {{ tier.currency }} {{ tier.price }}
            </span>
          </label>

          <p
            v-if="tiers.length === 0"
            class="text-sm text-slate-500 py-4 text-center"
          >
            —
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { TicketType } from '@/services/api/types/ticket.types'

const props = defineProps<{
  open: boolean
  tiers: TicketType[]
  /** Empty array / null = "all tiers". */
  allowedTierIds: number[] | null
}>()

const emit = defineEmits<{
  /** Auto-save: parent persists immediately on every toggle. */
  change: [next: number[]]
}>()

const { t } = useAppLanguage()

const hasSelection = computed(() => (props.allowedTierIds?.length ?? 0) > 0)

function onSelectAll() {
  emit('change', [])
}

function onToggle(id: number) {
  const current = props.allowedTierIds ?? []
  const next = current.includes(id)
    ? current.filter((tierId) => tierId !== id)
    : [...current, id]
  emit('change', next)
}
</script>
