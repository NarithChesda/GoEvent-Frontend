<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && table" class="fixed inset-0 z-[70] overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-lg bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90 flex-shrink-0" :style="{ borderTopColor: table.color, borderTopWidth: '3px' }">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    :style="{ backgroundColor: `${table.color}20`, color: table.color }"
                  >
                    <Armchair class="w-5 h-5" />
                  </div>
                  <div class="min-w-0">
                    <h2 class="text-lg sm:text-xl font-semibold text-slate-900 truncate">{{ table.name }}</h2>
                    <p class="text-xs text-slate-500">
                      {{ table.occupied_seats }}/{{ table.capacity }} seats occupied
                      <span v-if="table.notes"> &middot; {{ table.notes }}</span>
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <button
                    v-if="canEdit"
                    @click="$emit('edit-table', table)"
                    class="p-2 text-slate-400 hover:text-[#1e90ff] hover:bg-[#E6F4FF] rounded-lg transition-colors"
                    title="Edit table"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    v-if="canEdit"
                    @click="$emit('delete-table', table)"
                    class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete table"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                  <button
                    @click="$emit('close')"
                    class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                    aria-label="Close"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-6 overflow-y-auto scrollbar-thin">
              <!-- Seated guests -->
              <div>
                <h3 class="text-sm font-semibold text-slate-700 mb-3">Seated Guests ({{ table.guests.length }})</h3>
                <div v-if="table.guests.length === 0" class="text-center py-8 text-sm text-slate-400 bg-slate-50/50 rounded-xl">
                  No guests seated at this table yet.
                </div>
                <div v-else class="space-y-2">
                  <div
                    v-for="guest in table.guests"
                    :key="guest.id"
                    class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-slate-800 break-words">{{ guest.name }}</p>
                      <p v-if="guest.plus_ones_count > 0" class="text-xs text-slate-400">
                        +{{ guest.plus_ones_count }} guest{{ guest.plus_ones_count === 1 ? '' : 's' }}
                      </p>
                    </div>
                    <input
                      v-if="canEdit"
                      :value="guest.seat_number"
                      @change="$emit('seat-number-change', guest.id, ($event.target as HTMLInputElement).value)"
                      type="text"
                      placeholder="Seat #"
                      class="w-20 flex-shrink-0 px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                    />
                    <span v-else-if="guest.seat_number" class="text-xs text-slate-500 flex-shrink-0">Seat {{ guest.seat_number }}</span>
                    <button
                      v-if="canEdit"
                      @click="$emit('unassign-guest', guest.id)"
                      class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0 transition-colors"
                      title="Remove from table"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Add guest -->
              <div v-if="canEdit" class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-700 mb-3">Add Guest to This Table</h3>
                <div class="relative mb-3">
                  <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    :value="search"
                    @input="$emit('search', ($event.target as HTMLInputElement).value)"
                    type="text"
                    placeholder="Search unassigned guests..."
                    class="w-full pl-8 pr-3 py-2 bg-slate-50/70 border-0 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                  />
                </div>

                <div class="space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin">
                  <div v-if="loadingUnassigned && unassignedGuests.length === 0" class="flex justify-center py-6">
                    <div class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div v-else-if="unassignedGuests.length === 0" class="text-center py-6 text-xs text-slate-400">
                    No unassigned guests found.
                  </div>
                  <div
                    v-for="guest in unassignedGuests"
                    :key="guest.id"
                    class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="text-sm text-slate-800 truncate">{{ guest.name }}</p>
                      <p v-if="(guest.plus_ones_count ?? 0) > 0" class="text-[11px] text-slate-400">
                        +{{ guest.plus_ones_count }}
                      </p>
                    </div>
                    <button
                      @click="$emit('assign-guest', guest.id)"
                      class="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      <Plus class="w-3 h-3" /> Add
                    </button>
                  </div>

                  <button
                    v-if="hasMoreUnassigned"
                    @click="$emit('load-more')"
                    :disabled="loadingUnassigned"
                    class="w-full text-xs text-center text-[#1e90ff] hover:text-[#1873cc] font-medium py-2 disabled:opacity-50"
                  >
                    {{ loadingUnassigned ? 'Loading...' : 'Load more' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Armchair, Pencil, Trash2, X, Search, Plus } from 'lucide-vue-next'
import type { EventTable, EventGuest } from '../../services/api'

defineProps<{
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
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
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
