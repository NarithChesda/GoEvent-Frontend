<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && table" class="fixed inset-0 z-[70] overflow-y-auto">
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" @click="$emit('close')"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl ring-1 ring-slate-900/5 overflow-hidden flex flex-col max-h-[85vh]"
            @click.stop
          >
            <!-- Header -->
            <div class="relative flex-shrink-0 overflow-hidden border-b border-slate-100">
              <!-- Tinted backdrop derived from the table color -->
              <div class="absolute inset-0" :style="headerBackdropStyle"></div>
              <div
                class="absolute -top-12 -right-12 w-44 h-44 rounded-full opacity-25 blur-3xl pointer-events-none"
                :style="{ backgroundColor: table.color }"
              ></div>

              <div class="relative px-6 pt-5 pb-5">
                <!-- Top-right actions -->
                <div class="absolute top-4 right-4 flex items-center gap-1.5">
                  <button
                    v-if="canEdit"
                    @click="$emit('edit-table', table)"
                    class="w-8 h-8 rounded-full bg-white/80 backdrop-blur hover:bg-white text-slate-500 hover:text-[#1e90ff] flex items-center justify-center shadow-sm ring-1 ring-slate-900/5 transition-colors"
                    :title="t('management.seatingView.board.editTable')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    v-if="canEdit"
                    @click="$emit('delete-table', table)"
                    class="w-8 h-8 rounded-full bg-white/80 backdrop-blur hover:bg-white text-slate-500 hover:text-red-600 flex items-center justify-center shadow-sm ring-1 ring-slate-900/5 transition-colors"
                    :title="t('management.seatingView.board.deleteTable')"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="$emit('close')"
                    class="w-8 h-8 rounded-full bg-white/80 backdrop-blur hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center shadow-sm ring-1 ring-slate-900/5 transition-colors"
                    aria-label="Close"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>

                <div class="flex items-start gap-4 pr-28">
                  <div
                    class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
                    :style="{ backgroundColor: table.color, boxShadow: `0 8px 20px -6px ${table.color}99` }"
                  >
                    <Armchair class="w-6 h-6" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <h2 class="text-xl font-bold text-slate-900 truncate leading-tight">{{ table.name }}</h2>
                    <p v-if="table.notes" class="text-xs text-slate-500 mt-1 line-clamp-2">{{ table.notes }}</p>
                  </div>
                </div>

                <!-- Occupancy -->
                <div class="mt-4 flex items-center gap-3">
                  <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500" :style="occupancyBarStyle"></div>
                  </div>
                  <span
                    class="text-xs font-semibold tabular-nums flex-shrink-0"
                    :class="isOverCapacity ? 'text-red-600' : 'text-slate-600'"
                  >
                    {{ t('management.seatingView.detailModal.seatsOccupied', { occupied: table.occupied_seats, capacity: table.capacity }) }}
                  </span>
                  <span
                    v-if="isOverCapacity"
                    class="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-red-100 text-red-700"
                  >
                    {{ t('management.seatingView.detailModal.overCapacity') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-7">
              <!-- Seated guests -->
              <section>
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {{ t('management.seatingView.detailModal.seatedGuests') }}
                  </h3>
                  <span class="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 tabular-nums">
                    {{ table.guests.length }}
                  </span>
                </div>

                <div
                  v-if="table.guests.length === 0"
                  class="text-center py-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50"
                >
                  <Armchair class="w-7 h-7 mx-auto mb-2 text-slate-300" />
                  <p class="text-xs text-slate-400">{{ t('management.seatingView.detailModal.noneSeated') }}</p>
                </div>

                <TransitionGroup v-else tag="div" name="guest-list" class="space-y-2 relative">
                  <div
                    v-for="guest in table.guests"
                    :key="guest.id"
                    class="group flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all"
                  >
                    <div
                      class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 select-none"
                      :style="{ backgroundColor: `${table.color}1a`, color: table.color }"
                    >
                      {{ initials(guest.name) }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-slate-800 break-words">{{ guest.name }}</p>
                      <p v-if="guest.plus_ones_count > 0" class="text-[11px] text-slate-400">
                        {{ t('management.seatingView.pool.plusOnes', { count: guest.plus_ones_count }, guest.plus_ones_count) }}
                      </p>
                    </div>
                    <input
                      v-if="canEdit"
                      :value="guest.seat_number"
                      @change="$emit('seat-number-change', guest.id, ($event.target as HTMLInputElement).value)"
                      type="text"
                      :placeholder="t('management.seatingView.detailModal.seatPlaceholder')"
                      class="w-16 flex-shrink-0 px-2 py-1.5 text-xs font-medium text-center bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 focus:bg-white transition-all"
                    />
                    <span
                      v-else-if="guest.seat_number"
                      class="text-[11px] font-medium text-slate-500 bg-slate-100 rounded-full px-2.5 py-1 flex-shrink-0"
                    >
                      {{ t('management.seatingView.detailModal.seatLabel', { number: guest.seat_number }) }}
                    </span>
                    <button
                      v-if="canEdit"
                      @click="$emit('unassign-guest', guest.id)"
                      class="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full flex-shrink-0 transition-colors opacity-60 group-hover:opacity-100"
                      :title="t('management.seatingView.detailModal.removeFromTable')"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                </TransitionGroup>
              </section>

              <!-- Add guest -->
              <section v-if="canEdit">
                <h3 class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  {{ t('management.seatingView.detailModal.addGuestTitle') }}
                </h3>
                <div class="relative mb-3">
                  <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    :value="search"
                    @input="$emit('search', ($event.target as HTMLInputElement).value)"
                    type="text"
                    :placeholder="t('management.seatingView.detailModal.searchPlaceholder')"
                    class="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-200 focus:bg-white transition-all"
                  />
                </div>

                <div class="space-y-1 max-h-52 overflow-y-auto scrollbar-thin -mx-1 px-1">
                  <div v-if="loadingUnassigned && unassignedGuests.length === 0" class="flex justify-center py-6">
                    <div class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div v-else-if="unassignedGuests.length === 0" class="text-center py-6 text-xs text-slate-400">
                    {{ t('management.seatingView.detailModal.noneFound') }}
                  </div>
                  <div
                    v-for="guest in unassignedGuests"
                    :key="guest.id"
                    class="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div
                      class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0 select-none"
                    >
                      {{ initials(guest.name) }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm text-slate-800 truncate">{{ guest.name }}</p>
                      <p v-if="(guest.plus_ones_count ?? 0) > 0" class="text-[11px] text-slate-400">
                        {{ t('management.seatingView.pool.plusOnes', { count: guest.plus_ones_count }, guest.plus_ones_count ?? 0) }}
                      </p>
                    </div>
                    <button
                      @click="$emit('assign-guest', guest.id)"
                      class="flex-shrink-0 inline-flex items-center gap-1 pl-2.5 pr-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors"
                    >
                      <Plus class="w-3.5 h-3.5" /> {{ t('management.seatingView.detailModal.add') }}
                    </button>
                  </div>

                  <button
                    v-if="hasMoreUnassigned"
                    @click="$emit('load-more')"
                    :disabled="loadingUnassigned"
                    class="w-full text-xs text-center text-[#1e90ff] hover:text-[#1873cc] font-medium py-2 disabled:opacity-50"
                  >
                    {{ loadingUnassigned ? t('management.seatingView.pool.loading') : t('management.seatingView.pool.loadMore') }}
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Armchair, Pencil, Trash2, X, Search, Plus } from 'lucide-vue-next'
import type { EventTable, EventGuest } from '../../services/api'

const props = defineProps<{
  show: boolean
  table: EventTable | null
  canEdit: boolean
  unassignedGuests: EventGuest[]
  loadingUnassigned: boolean
  search: string
  hasMoreUnassigned: boolean
}>()

defineEmits<{
  close: []
  'edit-table': [table: EventTable]
  'delete-table': [table: EventTable]
  'seat-number-change': [guestId: number, value: string]
  'unassign-guest': [guestId: number]
  'assign-guest': [guestId: number]
  search: [value: string]
  'load-more': []
}>()

const { t } = useI18n()

const isOverCapacity = computed(
  () => !!props.table && props.table.occupied_seats > props.table.capacity,
)

const headerBackdropStyle = computed(() => {
  const color = props.table?.color || '#3498db'
  return {
    background: `linear-gradient(135deg, ${color}24 0%, ${color}0a 55%, transparent 100%)`,
  }
})

const occupancyBarStyle = computed(() => {
  const table = props.table
  if (!table) return {}
  const percent = Math.min(100, (table.occupied_seats / Math.max(table.capacity, 1)) * 100)
  return {
    width: `${percent}%`,
    backgroundColor: table.occupied_seats > table.capacity ? '#ef4444' : table.color,
  }
})

/** First letters of up to two name words, e.g. "Sok Dara" → "SD". */
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Row enter/leave when guests are seated or removed */
.guest-list-enter-active,
.guest-list-leave-active {
  transition: all 0.25s ease;
}

.guest-list-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.guest-list-leave-to {
  opacity: 0;
  transform: translateX(12px);
}

.guest-list-leave-active {
  position: absolute;
  width: 100%;
}

.guest-list-move {
  transition: transform 0.25s ease;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 5px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
</style>
