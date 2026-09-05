<template>
  <div class="space-y-4">
    <!-- No heading of its own: the tab header above already names this screen,
         and a second `Table Seating` title under a segment reading "Table
         Seating" was the same words twice. What is left of the header is the
         one action and the readout it acts on.

         The three stat tiles this replaces were icon chip + number + caption,
         which is the same shape the summary strip on the guest list uses for
         three *shares of one whole* — but seats filled, tables and unassigned
         are three unrelated magnitudes, so they read here as a plain sentence
         of values rather than as a chart pretending to be one. -->
    <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
      <dl class="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
        <!-- Value before label, so each pair reads as the phrase it is —
             "12 tables", not "tables 12". `dd` is source-ordered after its
             `dt`, so the visual order comes from `flex-row-reverse`, which
             leaves the definition list itself well-formed for a reader that
             ignores the styling. -->
        <div class="flex flex-row-reverse items-center gap-1.5">
          <dt class="text-slate-500">{{ t('management.seatingView.summary.tableLabel', tables.length) }}</dt>
          <dd class="font-semibold tabular-nums text-slate-900">{{ tables.length }}</dd>
          <Armchair class="h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" />
        </div>
        <div class="flex flex-row-reverse items-center gap-1.5">
          <dt class="text-slate-500">{{ t('management.seatingView.summary.seatsFilled') }}</dt>
          <dd class="font-semibold tabular-nums text-slate-900">
            {{ totalSeated }}<span class="font-medium text-slate-400">/{{ totalCapacity }}</span>
          </dd>
          <Users class="h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" />
        </div>
        <div class="flex flex-row-reverse items-center gap-1.5">
          <dt class="text-slate-500">{{ t('management.seatingView.summary.unassigned') }}</dt>
          <dd class="font-semibold tabular-nums text-slate-900">{{ unassignedPagination.count }}</dd>
          <UserX class="h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" />
        </div>
      </dl>

      <button
        v-if="canEdit"
        @click="openCreateTableModal"
        class="ml-auto inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-[#27ae60] hover:to-[#1873cc] hover:shadow-emerald-600/30 sm:px-4"
      >
        <Plus class="h-4 w-4" />
        <span class="hidden sm:inline">{{ t('management.seatingView.header.addTable') }}</span>
      </button>
    </div>

    <div class="flex flex-col lg:flex-row gap-6 items-start">
      <!-- Unassigned pool -->
      <div
        class="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-4 rounded-3xl bg-white shadow-sm transition-all"
        :class="isPoolDropTarget ? 'ring-2 ring-[#1e90ff]/60 shadow-lg' : 'ring-1 ring-slate-900/5'"
        @dragover.prevent="handlePoolDragOver"
        @dragleave="handlePoolDragLeave($event)"
        @drop.prevent="handleDropOnPool"
      >
        <div class="p-4 border-b border-slate-100">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2 min-w-0">
              <h3 class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">{{ t('management.seatingView.pool.title') }}</h3>
              <span class="text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 tabular-nums flex-shrink-0">{{ unassignedPagination.count }}</span>
            </div>
            <label class="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                :checked="isAllUnassignedSelected"
                @change="toggleSelectAllUnassigned"
                class="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded focus:ring-2 focus:ring-emerald-500/20"
              />
              {{ t('management.seatingView.pool.selectAll') }}
            </label>
          </div>
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              v-model="unassignedSearch"
              @input="handleSearchInput"
              type="text"
              :placeholder="t('management.seatingView.pool.searchPlaceholder')"
              class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-transparent rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-200 focus:bg-white transition-all"
            />
          </div>
        </div>

        <!-- Bulk assign toolbar -->
        <div v-if="selectedGuestIds.size > 0" class="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-medium text-emerald-800">{{ t('management.seatingView.pool.selectedCount', { count: selectedGuestIds.size }) }}</span>
            <div class="flex items-center gap-2">
              <select
                @change="handleBulkAssignSelect($event)"
                class="text-xs border border-emerald-200 rounded-lg px-2 py-1 bg-white text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">{{ t('management.seatingView.pool.assignTo') }}</option>
                <option v-for="tbl in tables" :key="tbl.id" :value="tbl.id">{{ tbl.name }}</option>
              </select>
              <button @click="clearSelection" class="text-xs text-slate-500 hover:text-slate-700">{{ t('management.seatingView.pool.clear') }}</button>
            </div>
          </div>
          <button
            v-if="isAllUnassignedSelected && unassignedPagination.hasMore && selectedGuestIds.size < unassignedPagination.count"
            @click="selectAllUnassigned"
            :disabled="selectingAll"
            class="text-xs font-medium text-[#1e90ff] hover:text-[#1873cc] disabled:opacity-50"
          >
            {{ selectingAll ? t('management.seatingView.pool.selecting') : t('management.seatingView.pool.selectAllCount', { count: unassignedPagination.count }) }}
          </button>
        </div>

        <div class="p-3 space-y-1.5 max-h-[30rem] overflow-y-auto scrollbar-thin">
          <div v-if="loadingUnassigned && unassignedGuests.length === 0" class="flex justify-center py-8">
            <div class="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <div v-else-if="unassignedGuests.length === 0" class="text-center py-8 text-xs text-slate-400">
            <PartyPopper class="w-8 h-8 mx-auto mb-2 text-slate-300" />
            {{ t('management.seatingView.pool.allSeated') }}
          </div>

          <div
            v-for="guest in unassignedGuests"
            :key="guest.id"
            :draggable="canEdit"
            @dragstart="handleGuestDragStart($event, guest.id)"
            @dragend="handleDragEnd"
            @click="canEdit && toggleGuestSelected(guest.id)"
            class="flex items-center gap-2.5 p-2 rounded-xl border transition-colors"
            :class="[
              canEdit ? 'cursor-grab active:cursor-grabbing' : '',
              selectedGuestIds.has(guest.id)
                ? 'border-emerald-300 bg-emerald-50/70'
                : 'border-transparent hover:border-slate-200 hover:bg-slate-50',
            ]"
          >
            <input
              type="checkbox"
              :checked="selectedGuestIds.has(guest.id)"
              @change="toggleGuestSelected(guest.id)"
              @click.stop
              class="w-4 h-4 flex-shrink-0 text-emerald-600 border-slate-300 rounded focus:ring-2 focus:ring-emerald-500/20"
            />
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 select-none transition-colors"
              :class="selectedGuestIds.has(guest.id) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
            >
              {{ initials(guest.name) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-slate-800 truncate">{{ guest.name }}</p>
              <p v-if="(guest.plus_ones_count ?? 0) > 0" class="text-[11px] text-slate-400">{{ t('management.seatingView.pool.plusOnes', { count: guest.plus_ones_count }, guest.plus_ones_count ?? 0) }}</p>
            </div>
          </div>

          <button
            v-if="unassignedPagination.hasMore"
            @click="loadMoreUnassigned"
            :disabled="loadingUnassigned"
            class="w-full text-xs text-center text-[#1e90ff] hover:text-[#1873cc] font-medium py-2 disabled:opacity-50"
          >
            {{ loadingUnassigned ? t('management.seatingView.pool.loading') : t('management.seatingView.pool.loadMore') }}
          </button>
        </div>
      </div>

      <!-- Tables board -->
      <div class="flex-1 min-w-0">
        <div v-if="loadingTables" class="flex justify-center items-center py-16">
          <div class="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div
          v-else-if="tables.length === 0"
          @click="canEdit && openCreateTableModal()"
          class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-3xl p-12 hover:bg-slate-100/50 hover:border-sky-400 transition-all duration-300"
          :class="canEdit ? 'cursor-pointer group' : ''"
        >
          <div class="flex flex-col items-center justify-center">
            <div class="w-16 h-16 bg-slate-200 group-hover:bg-sky-100 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
              <Armchair class="w-8 h-8 text-slate-400 group-hover:text-sky-600 transition-colors" />
            </div>
            <h4 class="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{{ t('management.seatingView.board.emptyTitle') }}</h4>
            <p class="text-sm text-slate-400 mt-1">{{ canEdit ? t('management.seatingView.board.emptyCreateHint') : t('management.seatingView.board.emptyReadOnly') }}</p>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="table in tables"
            :key="table.id"
            @click="openTableDetail(table)"
            class="rounded-3xl bg-white shadow-sm overflow-hidden flex flex-col transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
            :class="dragOverTableId === table.id ? 'ring-2 ring-[#1e90ff]/60 shadow-lg' : 'ring-1 ring-slate-900/5'"
            @dragover.prevent="handleTableDragOver(table.id)"
            @dragleave="handleTableDragLeave($event, table.id)"
            @drop.prevent="handleDropOnTable(table.id)"
          >
            <!-- Table header -->
            <div class="relative overflow-hidden border-b border-slate-100">
              <div class="absolute inset-0" :style="tableHeaderStyle(table)"></div>
              <div
                class="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-20 blur-2xl pointer-events-none"
                :style="{ backgroundColor: table.color }"
              ></div>
              <div class="relative p-4">
                <div class="flex items-start gap-3">
                  <div
                    class="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    :style="{ backgroundColor: table.color, boxShadow: `0 6px 16px -6px ${table.color}99` }"
                  >
                    <Armchair class="w-4 h-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <h4 class="font-semibold text-slate-900 truncate leading-tight">{{ table.name }}</h4>
                    <p v-if="table.notes" class="text-[11px] text-slate-500 mt-0.5 truncate">{{ table.notes }}</p>
                  </div>
                  <div v-if="canEdit" class="flex items-center gap-1 flex-shrink-0">
                    <button
                      @click.stop="openEditTableModal(table)"
                      class="w-7 h-7 rounded-full bg-white/80 backdrop-blur hover:bg-white text-slate-400 hover:text-[#1e90ff] flex items-center justify-center shadow-sm ring-1 ring-slate-900/5 transition-colors"
                      :title="t('management.seatingView.board.editTable')"
                    >
                      <Pencil class="w-3 h-3" />
                    </button>
                    <button
                      @click.stop="openDeleteTableModal(table)"
                      class="w-7 h-7 rounded-full bg-white/80 backdrop-blur hover:bg-white text-slate-400 hover:text-red-600 flex items-center justify-center shadow-sm ring-1 ring-slate-900/5 transition-colors"
                      :title="t('management.seatingView.board.deleteTable')"
                    >
                      <Trash2 class="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div class="mt-3 flex items-center gap-2">
                  <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500" :style="occupancyStyle(table)"></div>
                  </div>
                  <span
                    class="text-xs font-semibold tabular-nums flex-shrink-0"
                    :class="table.occupied_seats > table.capacity ? 'text-red-600' : 'text-slate-600'"
                  >
                    {{ table.occupied_seats }}/{{ table.capacity }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Seated guests -->
            <div class="p-3 space-y-1 min-h-[88px] flex-1">
              <button
                v-if="canEdit && selectedGuestIds.size > 0"
                @click.stop="assignSelectedToTable(table.id)"
                class="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-2 mb-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-300 rounded-xl transition-colors"
              >
                <Plus class="w-3.5 h-3.5" />
                {{ t('management.seatingView.board.seatHere', { count: selectedGuestIds.size }) }}
              </button>
              <div
                v-if="table.guests.length === 0 && selectedGuestIds.size === 0"
                class="text-center py-5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-400"
              >
                {{ t('management.seatingView.board.dropHere') }}
              </div>
              <div
                v-for="guest in table.guests"
                :key="guest.id"
                :draggable="canEdit"
                @dragstart="handleGuestDragStart($event, guest.id)"
                @dragend="handleDragEnd"
                class="group flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                :class="canEdit ? 'cursor-grab active:cursor-grabbing' : ''"
              >
                <div
                  class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 select-none"
                  :style="{ backgroundColor: `${table.color}1a`, color: table.color }"
                >
                  {{ initials(guest.name) }}
                </div>
                <div class="min-w-0 flex-1" :title="guest.name">
                  <p class="text-sm text-slate-800 truncate">{{ guest.name }}</p>
                  <p v-if="guest.plus_ones_count > 0" class="text-[11px] text-slate-400">+{{ guest.plus_ones_count }}</p>
                </div>
                <input
                  v-if="canEdit"
                  :value="guest.seat_number"
                  @change="handleSeatNumberChange(guest.id, ($event.target as HTMLInputElement).value)"
                  @click.stop
                  type="text"
                  :placeholder="t('management.seatingView.board.seatPlaceholder')"
                  class="w-12 flex-shrink-0 px-1.5 py-1 text-[11px] font-medium text-center bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 focus:bg-white transition-all"
                />
                <button
                  v-if="canEdit"
                  @click.stop="unassignGuest(guest.id)"
                  class="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full flex-shrink-0 transition-colors opacity-60 group-hover:opacity-100"
                  :title="t('management.seatingView.board.unassign')"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                v-if="table.guests.length > 0"
                @click.stop="openTableDetail(table)"
                class="w-full text-xs text-center text-[#1e90ff] hover:text-[#1873cc] font-medium py-1.5"
              >
                {{ t('management.seatingView.board.viewManage') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Form Modal -->
    <TableFormModal
      ref="tableFormModalRef"
      :show="showTableModal"
      :table="editingTable"
      :is-saving="isSavingTable"
      @close="showTableModal = false"
      @save="handleSaveTable"
    />

    <!-- Delete Table Modal -->
    <DeleteConfirmModal
      :show="showDeleteTableModal"
      :title="t('management.seatingView.deleteModal.title')"
      :item-name="tableToDelete?.name || ''"
      :loading="deletingTable"
      :warning-message="t('management.seatingView.deleteModal.warning')"
      @confirm="confirmDeleteTable"
      @cancel="showDeleteTableModal = false"
    />

    <!-- Table Detail Modal -->
    <TableDetailModal
      :show="detailTable !== null"
      :table="detailTable"
      :can-edit="canEdit"
      :unassigned-guests="unassignedGuests"
      :loading-unassigned="loadingUnassigned"
      :search="unassignedSearch"
      :has-more-unassigned="unassignedPagination.hasMore"
      @close="closeTableDetail"
      @edit-table="handleEditFromDetail"
      @delete-table="handleDeleteFromDetail"
      @seat-number-change="handleSeatNumberChange"
      @unassign-guest="unassignGuest"
      @assign-guest="(guestId) => assignGuestsToTable([guestId], detailTableId ?? null)"
      @search="handleDetailSearch"
      @load-more="loadMoreUnassigned"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Armchair,
  Users,
  UserX,
  Search,
  PartyPopper,
} from 'lucide-vue-next'
import {
  tablesService,
  guestService,
  type EventTable,
  type EventGuest,
  type CreateTableRequest,
  type UpdateTableRequest,
} from '../../services/api'
import TableFormModal from './TableFormModal.vue'
import TableDetailModal from './TableDetailModal.vue'
import DeleteConfirmModal from '../DeleteConfirmModal.vue'

const props = defineProps<{
  eventId: string
  canEdit: boolean
}>()

const emit = defineEmits<{
  message: [type: 'success' | 'error', text: string]
}>()

const { t } = useI18n()

// ---- Presentation helpers ---------------------------------------------------
/** Soft tinted gradient for a table card header, derived from the table color. */
const tableHeaderStyle = (table: EventTable) => ({
  background: `linear-gradient(135deg, ${table.color}24 0%, ${table.color}0a 55%, transparent 100%)`,
})

const occupancyStyle = (table: EventTable) => {
  const percent = Math.min(100, (table.occupied_seats / Math.max(table.capacity, 1)) * 100)
  return {
    width: `${percent}%`,
    backgroundColor: table.occupied_seats > table.capacity ? '#ef4444' : table.color,
  }
}

/** First letters of up to two name words, e.g. "Sok Dara" → "SD". */
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

// ---- Tables state ---------------------------------------------------------
const tables = ref<EventTable[]>([])
const loadingTables = ref(false)

const totalSeated = computed(() => tables.value.reduce((sum, tbl) => sum + tbl.occupied_seats, 0))
const totalCapacity = computed(() => tables.value.reduce((sum, tbl) => sum + tbl.capacity, 0))

const loadTables = async () => {
  loadingTables.value = true
  try {
    const response = await tablesService.getTables(props.eventId, { ordering: 'order', page_size: 100 })
    if (response.success && response.data) {
      tables.value = response.data.results
    }
  } finally {
    loadingTables.value = false
  }
}

// ---- Unassigned guest pool -------------------------------------------------
const UNASSIGNED_PAGE_SIZE = 30
const unassignedGuests = ref<EventGuest[]>([])
const loadingUnassigned = ref(false)
const unassignedSearch = ref('')
const unassignedPagination = ref({ page: 1, hasMore: false, count: 0 })
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

const loadUnassignedGuests = async (page = 1, append = false) => {
  loadingUnassigned.value = true
  try {
    const response = await guestService.getGuests(props.eventId, {
      unassigned: true,
      search: unassignedSearch.value || undefined,
      page,
      page_size: UNASSIGNED_PAGE_SIZE,
    })
    if (response.success && response.data) {
      unassignedGuests.value = append
        ? [...unassignedGuests.value, ...response.data.results]
        : response.data.results
      unassignedPagination.value = {
        page,
        hasMore: response.data.next !== null,
        count: response.data.count,
      }
    }
  } finally {
    loadingUnassigned.value = false
  }
}

const loadMoreUnassigned = () => {
  if (loadingUnassigned.value || !unassignedPagination.value.hasMore) return
  loadUnassignedGuests(unassignedPagination.value.page + 1, true)
}

const handleSearchInput = () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    selectedGuestIds.value.clear()
    loadUnassignedGuests(1, false)
  }, 300)
}

// ---- Multi-select -----------------------------------------------------------
const selectedGuestIds = ref<Set<number>>(new Set())
const selectingAll = ref(false)

const isAllUnassignedSelected = computed(
  () => unassignedGuests.value.length > 0 && unassignedGuests.value.every((g) => selectedGuestIds.value.has(g.id)),
)

const toggleGuestSelected = (guestId: number) => {
  if (selectedGuestIds.value.has(guestId)) {
    selectedGuestIds.value.delete(guestId)
  } else {
    selectedGuestIds.value.add(guestId)
  }
  // Force reactivity on Set mutation
  selectedGuestIds.value = new Set(selectedGuestIds.value)
}

const toggleSelectAllUnassigned = () => {
  if (isAllUnassignedSelected.value) {
    selectedGuestIds.value = new Set()
  } else {
    selectedGuestIds.value = new Set(unassignedGuests.value.map((g) => g.id))
  }
}

/**
 * Select every unassigned guest matching the current search, including pages
 * that haven't been loaded into the visible pool yet (Gmail-style "select all
 * N" after ticking the select-all checkbox).
 */
const selectAllUnassigned = async () => {
  if (selectingAll.value) return
  selectingAll.value = true
  try {
    const ids: number[] = []
    let page = 1
    while (true) {
      const response = await guestService.getGuests(props.eventId, {
        unassigned: true,
        search: unassignedSearch.value || undefined,
        page,
        page_size: 100,
      })
      if (!response.success || !response.data) break
      ids.push(...response.data.results.map((g) => g.id))
      if (!response.data.next) break
      page++
    }
    selectedGuestIds.value = new Set(ids)
  } finally {
    selectingAll.value = false
  }
}

const clearSelection = () => {
  selectedGuestIds.value = new Set()
}

// ---- Drag and drop ----------------------------------------------------------
const draggingGuestIds = ref<number[]>([])
const dragOverTableId = ref<number | null>(null)
const isPoolDropTarget = ref(false)

const handleGuestDragStart = (event: DragEvent, guestId: number) => {
  draggingGuestIds.value = selectedGuestIds.value.has(guestId) ? Array.from(selectedGuestIds.value) : [guestId]
  event.dataTransfer?.setData('text/plain', String(guestId))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

const handleDragEnd = () => {
  draggingGuestIds.value = []
  dragOverTableId.value = null
  isPoolDropTarget.value = false
}

const handleTableDragOver = (tableId: number) => {
  dragOverTableId.value = tableId
}

// dragleave also fires when the cursor moves onto a child element, which
// makes the drop highlight flicker. Only clear when truly leaving the card.
const isLeavingDropZone = (event: DragEvent) => {
  const current = event.currentTarget as HTMLElement | null
  const related = event.relatedTarget as Node | null
  return !current || !related || !current.contains(related)
}

const handleTableDragLeave = (event: DragEvent, tableId: number) => {
  if (!isLeavingDropZone(event)) return
  if (dragOverTableId.value === tableId) dragOverTableId.value = null
}

const handlePoolDragOver = () => {
  isPoolDropTarget.value = true
}

const handlePoolDragLeave = (event: DragEvent) => {
  if (!isLeavingDropZone(event)) return
  isPoolDropTarget.value = false
}

const assignGuestsToTable = async (guestIds: number[], tableId: number | null) => {
  if (guestIds.length === 0) return

  const response =
    guestIds.length === 1
      ? await guestService.updateGuest(props.eventId, guestIds[0], { table: tableId })
      : await guestService.bulkAssignTable(props.eventId, guestIds, tableId)

  if (response.success) {
    clearSelection()
    await Promise.all([loadTables(), loadUnassignedGuests(1, false)])

    const count = guestIds.length
    if (tableId === null) {
      emit('message', 'success', t('management.seatingView.messages.movedToUnassigned', { count }, count))
    } else {
      const target = tables.value.find((tbl) => tbl.id === tableId)
      if (target) {
        let message = t('management.seatingView.messages.seatedAt', { count, table: target.name }, count)
        if (target.occupied_seats > target.capacity) {
          message += t('management.seatingView.messages.overCapacitySuffix', {
            occupied: target.occupied_seats,
            capacity: target.capacity,
          })
        }
        emit('message', 'success', message)
      }
    }
  } else {
    emit('message', 'error', response.message || t('management.seatingView.messages.assignFailed'))
  }
}

const assignSelectedToTable = async (tableId: number) => {
  await assignGuestsToTable(Array.from(selectedGuestIds.value), tableId)
}

const handleDropOnTable = async (tableId: number) => {
  const ids = draggingGuestIds.value
  handleDragEnd()
  await assignGuestsToTable(ids, tableId)
}

const handleDropOnPool = async () => {
  const ids = draggingGuestIds.value
  handleDragEnd()
  await assignGuestsToTable(ids, null)
}

const unassignGuest = async (guestId: number) => {
  await assignGuestsToTable([guestId], null)
}

const handleBulkAssignSelect = async (event: Event) => {
  const select = event.target as HTMLSelectElement
  const tableId = select.value ? Number(select.value) : null
  select.value = ''
  if (tableId === null) return
  await assignGuestsToTable(Array.from(selectedGuestIds.value), tableId)
}

const handleSeatNumberChange = async (guestId: number, seatNumber: string) => {
  const response = await guestService.updateGuest(props.eventId, guestId, { seat_number: seatNumber })
  if (!response.success) {
    emit('message', 'error', response.message || t('management.seatingView.messages.seatNumberFailed'))
  }
  // Refresh so the input reflects the persisted value (or reverts on failure)
  await loadTables()
}

// ---- Table CRUD ---------------------------------------------------------
const showTableModal = ref(false)
const editingTable = ref<EventTable | null>(null)
const isSavingTable = ref(false)
const tableFormModalRef = ref<InstanceType<typeof TableFormModal> | null>(null)

const openCreateTableModal = () => {
  editingTable.value = null
  showTableModal.value = true
}

const openEditTableModal = (table: EventTable) => {
  editingTable.value = table
  showTableModal.value = true
}

const handleSaveTable = async (tableId: number | null, data: CreateTableRequest | UpdateTableRequest) => {
  isSavingTable.value = true
  try {
    const response = tableId
      ? await tablesService.updateTable(props.eventId, tableId, data)
      : await tablesService.createTable(props.eventId, data as CreateTableRequest)

    if (response.success && response.data) {
      emit(
        'message',
        'success',
        t(`management.seatingView.messages.${tableId ? 'tableUpdated' : 'tableCreated'}`, { name: response.data.name }),
      )
      showTableModal.value = false
      editingTable.value = null
      await loadTables()
    } else if (response.errors && tableFormModalRef.value) {
      tableFormModalRef.value.setFieldErrors(response.errors)
    } else if (tableFormModalRef.value) {
      tableFormModalRef.value.setErrorMessage(response.message || t('management.seatingView.messages.tableSaveFailed'))
    }
  } finally {
    isSavingTable.value = false
  }
}

const showDeleteTableModal = ref(false)
const tableToDelete = ref<EventTable | null>(null)
const deletingTable = ref(false)

const openDeleteTableModal = (table: EventTable) => {
  tableToDelete.value = table
  showDeleteTableModal.value = true
}

const confirmDeleteTable = async () => {
  if (!tableToDelete.value) return
  deletingTable.value = true
  const tableName = tableToDelete.value.name

  const response = await tablesService.deleteTable(props.eventId, tableToDelete.value.id)

  if (response.success) {
    emit('message', 'success', t('management.seatingView.messages.tableDeleted', { name: tableName }))
    await Promise.all([loadTables(), loadUnassignedGuests(1, false)])
  } else {
    emit('message', 'error', response.message || t('management.seatingView.messages.tableDeleteFailed'))
  }

  deletingTable.value = false
  showDeleteTableModal.value = false
  tableToDelete.value = null
}

// ---- Table detail modal ---------------------------------------------------
// Track just the id (not a snapshot) so the modal always reflects the latest
// `tables` data after assign/unassign/seat-number reloads.
const detailTableId = ref<number | null>(null)
const detailTable = computed(() => tables.value.find((tbl) => tbl.id === detailTableId.value) ?? null)

// The detail modal reuses the pool's unassigned list/search; remember the
// pool's search term so closing the modal restores what the user had typed.
let poolSearchBeforeDetail = ''

const openTableDetail = (table: EventTable) => {
  poolSearchBeforeDetail = unassignedSearch.value
  detailTableId.value = table.id
}

const closeTableDetail = () => {
  detailTableId.value = null
  if (unassignedSearch.value !== poolSearchBeforeDetail) {
    unassignedSearch.value = poolSearchBeforeDetail
    loadUnassignedGuests(1, false)
  }
}

const handleEditFromDetail = (table: EventTable) => {
  closeTableDetail()
  openEditTableModal(table)
}

const handleDeleteFromDetail = (table: EventTable) => {
  closeTableDetail()
  openDeleteTableModal(table)
}

const handleDetailSearch = (value: string) => {
  unassignedSearch.value = value
  handleSearchInput()
}

onMounted(() => {
  loadTables()
  loadUnassignedGuests(1, false)
})
</script>

<style scoped>
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
