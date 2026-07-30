<template>
  <div>
    <!-- Embedded mode: EventTextTab-style section panel for the Showcase tab -->
    <div
      v-if="embedded"
      class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20"
    >
      <!-- Header (click to expand/collapse) -->
      <div class="flex items-start justify-between gap-3">
        <button
          type="button"
          class="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 rounded-lg"
          :aria-expanded="isExpanded"
          :aria-label="t('management.media.sectionToggle')"
          @click="toggleExpanded"
        >
          <h5 class="font-semibold text-slate-900">{{ t('management.agenda.title') }}</h5>
          <p class="text-sm text-slate-600">{{ t('management.agenda.subtitle') }}</p>
          <!-- Drag and Drop Hint (Desktop Only) -->
          <div
            v-if="canEdit && agendaItems.length > 0"
            class="hidden sm:flex items-center gap-1.5 mt-1.5 text-xs text-slate-400"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
            </svg>
            <span>{{ t('management.agenda.dragHint') }}</span>
          </div>
        </button>
        <div class="flex items-center gap-1 flex-shrink-0">
          <button
            v-if="canEdit"
            @click="openCreateDrawer"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-full hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 transition-all"
            :title="t('management.agenda.addBtn')"
          >
            <Plus class="w-3.5 h-3.5" aria-hidden="true" />
            <span>{{ t('management.agenda.addBtn') }}</span>
          </button>
          <button
            type="button"
            class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            :aria-expanded="isExpanded"
            :aria-label="t('management.media.sectionToggle')"
            :title="t('management.media.sectionToggle')"
            @click="toggleExpanded"
          >
            <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isExpanded }" aria-hidden="true" />
          </button>
        </div>
      </div>

      <Transition name="collapse">
      <div v-if="isExpanded" class="grid grid-rows-[1fr]">
      <div class="min-h-0 overflow-hidden">
      <div class="pt-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-5" aria-hidden="true">
        <div v-for="g in 2" :key="g" class="space-y-2">
          <div class="h-3 w-40 bg-slate-200 rounded animate-pulse"></div>
          <div class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            <div v-for="r in 2" :key="r" class="p-3 sm:p-4 flex items-center gap-3">
              <div class="w-16 flex-shrink-0 space-y-1.5">
                <div class="h-3 w-12 bg-slate-200 rounded animate-pulse"></div>
                <div class="h-2.5 w-10 bg-slate-100 rounded animate-pulse"></div>
              </div>
              <div class="flex-1 space-y-2">
                <div class="h-3 w-32 bg-slate-200 rounded animate-pulse"></div>
                <div class="h-3 w-48 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="agendaItems.length === 0"
        @click="canEdit ? openCreateDrawer() : undefined"
        class="border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300"
        :class="canEdit
          ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group'
          : 'border-slate-300 bg-slate-50'"
      >
        <Calendar
          class="w-8 h-8 text-slate-400 mx-auto mb-3"
          :class="{ 'group-hover:text-emerald-600 transition-colors': canEdit }"
        />
        <p class="font-semibold text-slate-600" :class="{ 'group-hover:text-slate-900 transition-colors': canEdit }">
          {{ t('management.agenda.empty.title') }}
        </p>
        <p class="text-sm text-slate-500 mt-1">{{ t('management.agenda.empty.description') }}</p>
      </div>

      <!-- Day Groups -->
      <div v-else class="space-y-5">
        <div v-for="day in groupedAgendaDays" :key="day.date" class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-0 truncate">
              {{ formatDayHeader(day.date) }}
              <span class="text-slate-400">· {{ day.items.length }}</span>
            </p>
            <div v-if="canEdit" class="flex items-center flex-shrink-0">
              <button
                @click="openEditDateGroupModal(day.date, day.items.length)"
                class="p-1.5 text-slate-400 hover:text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors"
                :title="t('management.agenda.dayActions.changeDate')"
                :aria-label="t('management.agenda.dayActions.changeDate')"
              >
                <Edit2 class="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                @click="openDeleteDateGroupModal(day.date, day.items.length)"
                class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                :title="t('management.agenda.dayActions.deleteAll')"
                :aria-label="t('management.agenda.dayActions.deleteAll')"
              >
                <Trash2 class="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            <button
              v-for="item in day.items"
              :key="item.id"
              type="button"
              :disabled="!canEdit"
              :draggable="canEdit"
              @click="editAgendaItem(item)"
              @dragstart="onRowDragStart($event, item)"
              @dragover.prevent="onRowDragOver($event)"
              @dragenter.prevent="onRowDragEnter(item)"
              @dragleave="onRowDragLeave($event, item)"
              @drop.prevent="onRowDrop(item)"
              @dragend="onRowDragEnd"
              class="w-full flex items-center gap-3 p-3 sm:p-4 min-h-[56px] text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-inset"
              :class="[
                canEdit ? 'hover:bg-slate-50 active:bg-slate-100' : 'cursor-default',
                draggedItem?.id === item.id ? 'opacity-50' : '',
                dragOverItemId === item.id ? 'bg-sky-50' : '',
              ]"
              :style="{ boxShadow: `inset 3px 0 0 0 ${withAlpha(itemAccentColor(item), '66')}` }"
            >
              <!-- Time -->
              <div class="flex-shrink-0 min-w-[64px]">
                <template v-if="localizedItemText(item).start_time_text">
                  <p class="text-xs sm:text-sm font-semibold text-slate-900 leading-tight whitespace-nowrap">
                    {{ localizedItemText(item).start_time_text }}
                  </p>
                  <p
                    v-if="localizedItemText(item).end_time_text"
                    class="text-[10px] sm:text-xs text-slate-500 leading-tight mt-0.5 whitespace-nowrap"
                  >
                    {{ localizedItemText(item).end_time_text }}
                  </p>
                </template>
                <Clock v-else class="w-4 h-4 text-slate-400" aria-hidden="true" />
              </div>

              <!-- Title + chips + preview -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="flex items-center gap-1.5 min-w-0">
                    <span class="text-sm font-medium text-slate-900 truncate">
                      {{ localizedItemText(item).title }}
                    </span>
                    <Star
                      v-if="item.is_featured"
                      class="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                  </span>
                  <span
                    v-if="agendaLanguages.length > 1"
                    class="flex items-center gap-1 flex-shrink-0"
                  >
                    <span
                      v-for="lang in agendaLanguages"
                      :key="lang"
                      class="text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase"
                      :class="itemLanguageChipClasses(item, lang)"
                    >
                      {{ lang }}
                    </span>
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1 min-w-0">
                  <span
                    class="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 leading-tight"
                    :style="typeBadgeStyle(item)"
                  >
                    {{ getAgendaTypeLabel(item.agenda_type) }}
                  </span>
                  <span
                    v-if="getItemPreview(item)"
                    class="text-xs sm:text-sm text-slate-500 line-clamp-1"
                  >
                    {{ getItemPreview(item) }}
                  </span>
                </div>
              </div>

              <ChevronRight
                v-if="canEdit"
                class="w-4 h-4 text-slate-400 flex-shrink-0"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>
      </div>
      </div>
      </div>
      </Transition>
    </div>

    <!-- Standalone tab mode -->
    <div v-else class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">{{ t('management.agenda.title') }}</h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">{{ t('management.agenda.subtitle') }}</p>
        <!-- Drag and Drop Hint (Desktop Only) -->
        <div v-if="canEdit && agendaItems.length > 0" class="hidden sm:flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
          <span>{{ t('management.agenda.dragHint') }}</span>
        </div>
      </div>
      <button
        v-if="canEdit"
        @click="openCreateDrawer"
        class="flex bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold p-2 sm:py-2 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 items-center justify-center"
        :title="t('management.agenda.addBtn')"
      >
        <Plus class="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
        <span class="hidden sm:inline">{{ t('management.agenda.addBtn') }}</span>
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">{{ t('management.agenda.loadingText') }}</span>
      </div>
    </div>

    <!-- Agenda Days -->
    <div v-else-if="groupedAgendaDays.length > 0" class="space-y-6">
      <div
        v-for="day in groupedAgendaDays"
        :key="day.date"
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden"
      >
        <!-- Date Header (Entire header is clickable) -->
        <div
          @click="toggleDay(day.date)"
          class="group/header bg-gradient-to-r from-emerald-600/5 to-sky-600/5 p-4 sm:p-6 border-b border-white/20 cursor-pointer hover:from-emerald-600/10 hover:to-sky-600/10 transition-all duration-200 select-none"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3 sm:space-x-4 flex-1">
              <!-- Date Icon (Calendar Page Style) -->
              <div
                v-if="!isUnscheduled(day.date)"
                class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0 shadow-md shadow-emerald-900/10 overflow-hidden ring-1 ring-black/5"
              >
                <!-- Month Header -->
                <div class="h-[38%] bg-gradient-to-r from-emerald-500 to-sky-500 flex items-center justify-center">
                  <span class="text-[7px] sm:text-[8px] font-bold text-white uppercase tracking-wider">{{ getMonthAbbr(day.date) }}</span>
                </div>
                <!-- Day Number -->
                <div class="h-[62%] bg-white flex items-center justify-center">
                  <span class="text-sm sm:text-lg font-bold text-slate-800 leading-none">{{ getDayOfMonth(day.date) }}</span>
                </div>
              </div>
              <div
                v-else
                class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 shadow-md shadow-slate-900/5 ring-1 ring-black/5"
              >
                <Calendar class="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
              </div>
              <div>
                <h3 class="text-base sm:text-xl font-bold text-slate-900">{{ formatDayHeader(day.date) }}</h3>
                <p class="text-xs sm:text-sm text-slate-600">{{ day.items.length }} {{ t('management.agenda.agendaItems') }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1 sm:gap-2">
              <!-- Edit/Delete buttons for date group -->
              <div
                v-if="canEdit"
                class="flex items-center gap-1 mr-2 opacity-0 group-hover/header:opacity-100 transition-opacity"
              >
                <button
                  @click.stop="openEditDateGroupModal(day.date, day.items.length)"
                  class="p-1.5 sm:p-2 text-slate-400 hover:text-[#1e90ff] hover:bg-[#E6F4FF] rounded-lg transition-colors"
                  title="Change date for all items"
                >
                  <Edit2 class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  @click.stop="openDeleteDateGroupModal(day.date, day.items.length)"
                  class="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete all items in this date"
                >
                  <Trash2 class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
              <div class="p-1 sm:p-2">
                <ChevronDown
                  class="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 transition-transform duration-300"
                  :class="{ 'rotate-180': expandedDays.includes(day.date) }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Agenda Items (with smooth collapse animation) -->
        <Transition
          name="collapse"
          @enter="onCollapseEnter"
          @after-enter="onCollapseAfterEnter"
          @leave="onCollapseLeave"
          @after-leave="onCollapseAfterLeave"
        >
          <div v-if="expandedDays.includes(day.date)" class="overflow-hidden">
            <div class="p-4 sm:p-6 pt-3 sm:pt-4 space-y-2 sm:space-y-3">
              <div ref="sortableContainer" class="space-y-2 sm:space-y-3" :data-date="day.date">
                <AgendaItemCard
                  v-for="item in day.items"
                  :key="item.id"
                  :item="item"
                  :can-edit="canEdit"
                  :draggable="canEdit"
                  @edit="editAgendaItem"
                  @delete="confirmDeleteItem"
                  @drag-start="handleDragStart"
                  @drag-end="handleDragEnd"
                  class="agenda-item"
                  :data-id="item.id"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!loading"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <Calendar class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">{{ t('management.agenda.empty.title') }}</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">{{ t('management.agenda.empty.description') }}</p>
      <button
        v-if="canEdit"
        @click="openCreateDrawer"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center mx-auto text-sm sm:text-base"
      >
        <Plus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        {{ t('management.agenda.empty.addBtn') }}
      </button>
    </div>

    <!-- Session Types Info -->
    <div
      class="bg-gradient-to-br from-emerald-50 to-sky-50 border border-[#87CEEB]/50 rounded-3xl p-4 sm:p-6"
    >
      <h3 class="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4 flex items-center">
        <Info class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] mr-1.5 sm:mr-2" />
        {{ t('management.agenda.sessionTypes.title') }}
      </h3>
      <ul class="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 list-none p-0 m-0">
        <li
          v-for="legend in legendItems"
          :key="legend.type"
          class="legend-entry border rounded-lg sm:rounded-xl p-2 sm:p-3"
          :style="legendCardStyle(legend.color)"
          role="listitem"
        >
          <div class="flex items-center justify-between gap-2 mb-0.5 sm:mb-1">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <span
                class="inline-flex h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ring-2 ring-white/80"
                :style="{ backgroundColor: legend.color || '#1e90ff' }"
                aria-hidden="true"
              ></span>
              <span class="text-xs sm:text-sm font-semibold text-slate-700">{{ legend.label }}</span>
            </div>
            <span
              v-if="legend.count"
              class="text-[9px] sm:text-[10px] text-slate-500 font-medium whitespace-nowrap"
            >
              {{ legend.count }} {{ legend.count === 1 ? t('management.agenda.count.item') : t('management.agenda.count.items') }}
            </span>
          </div>
          <p class="text-[10px] sm:text-xs text-slate-600 leading-snug">
            {{ legend.description }}
          </p>
        </li>
      </ul>
    </div>
    </div>

    <!-- Overlays shared by both modes -->
    <!-- Reordering Overlay -->
    <Transition name="fade">
      <div
        v-if="isReordering"
        class="fixed inset-0 bg-black/10 z-40 flex items-center justify-center pointer-events-none"
      >
        <div
          class="bg-white rounded-xl shadow-2xl p-5 flex items-center space-x-3 border-2 border-blue-400"
        >
          <div
            class="animate-spin w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full"
          ></div>
          <div class="flex flex-col">
            <span class="text-base font-semibold text-slate-900">{{ t('management.agenda.reordering') }}</span>
            <span class="text-xs text-slate-600">{{ t('management.agenda.pleaseWait') }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Unified Agenda Drawer (for both create and edit) -->
    <EditAgendaDrawer
      v-model="showAgendaDrawer"
      :event-id="eventId"
      :item="selectedItem || undefined"
      :existing-agenda-items="agendaItems"
      @created="handleAgendaCreated"
      @updated="handleAgendaUpdated"
      @delete="confirmDeleteItem"
    />

    <!-- Delete Confirmation Modal (Single Item) -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="isDeleting"
      :title="t('management.agenda.deleteModal.title')"
      :item-name="itemToDelete?.title || t('management.agenda.deleteModal.fallbackName')"
      :message="t('management.agenda.deleteModal.message')"
      @confirm="deleteAgendaItem"
      @cancel="closeDeleteModal"
    />

    <!-- Delete Date Group Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteDateGroupModal"
      :loading="isDeletingDateGroup"
      :title="t('management.agenda.deleteDateGroupModal.title')"
      :item-name="dateGroupToDelete ? t('management.agenda.deleteDateGroupModal.itemName', { count: dateGroupToDelete.itemCount, date: formatDayHeader(dateGroupToDelete.date) }) : ''"
      :message="t('management.agenda.deleteDateGroupModal.message')"
      @confirm="deleteDateGroup"
      @cancel="closeDeleteDateGroupModal"
    />

    <!-- Edit Date Group Modal -->
    <EditDateGroupModal
      :show="showEditDateGroupModal"
      v-model="newDateForGroup"
      :current-date-display="dateGroupToEdit ? formatDayHeader(dateGroupToEdit.date) : ''"
      :item-count="dateGroupToEdit?.itemCount || 0"
      :loading="isUpdatingDateGroup"
      @confirm="updateDateGroup"
      @cancel="closeEditDateGroupModal"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, toRef } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { Calendar, Plus, ChevronDown, ChevronRight, Clock, Star, Info, Edit2, Trash2 } from 'lucide-vue-next'
import { agendaService, type EventAgendaItem } from '../services/api'
import AgendaItemCard from './AgendaItemCard.vue'
import EditAgendaDrawer from './EditAgendaDrawer.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import EditDateGroupModal from './EditDateGroupModal.vue'
import { useDateGroupOperations } from '@/composables/useDateGroupOperations'
import { useToast } from '@/composables/useToast'
import { useCollapsibleSection } from '@/composables/useCollapsibleSection'
import { isUnscheduled, fromApiDate } from '@/constants/agenda'
import { sortEventTextLanguages } from '@/utils/eventTextSlots'

interface Props {
  eventId: string
  canEdit: boolean
  /** Render as an EventTextTab-style section panel inside the Showcase tab instead of a standalone page */
  embedded?: boolean
}

const props = defineProps<Props>()

const { t, locale } = useAppLanguage()
const { isExpanded, toggle: toggleExpanded } = useCollapsibleSection('agenda')

// State
const agendaItems = ref<EventAgendaItem[]>([])
const loading = ref(false)
const showAgendaDrawer = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const selectedItem = ref<EventAgendaItem | null>(null)
const itemToDelete = ref<EventAgendaItem | null>(null)
const expandedDays = ref<string[]>([])
const draggedItem = ref<EventAgendaItem | null>(null)
const isReordering = ref(false)

// Toast notifications
const toast = useToast()

// Date group operations (composable)
const {
  showEditDateGroupModal,
  dateGroupToEdit,
  newDateForGroup,
  isUpdatingDateGroup,
  openEditDateGroupModal,
  closeEditDateGroupModal,
  updateDateGroup,
  showDeleteDateGroupModal,
  dateGroupToDelete,
  isDeletingDateGroup,
  openDeleteDateGroupModal,
  closeDeleteDateGroupModal,
  deleteDateGroup,
} = useDateGroupOperations({
  eventId: toRef(props, 'eventId'),
  agendaItems,
  expandedDates: expandedDays,
  onSuccess: (message) => toast.showSuccess(message),
  onError: (message) => toast.showError(message),
})

interface LegendItem {
  type: string
  label: string
  description: string
  color: string
  count: number
}

const DEFAULT_LEGEND = computed<LegendItem[]>(() => [
  {
    type: 'keynote',
    label: t('management.agenda.sessionTypes.keynote.label'),
    description: t('management.agenda.sessionTypes.keynote.description'),
    color: '#1e90ff',
    count: 0,
  },
  {
    type: 'workshop',
    label: t('management.agenda.sessionTypes.workshop.label'),
    description: t('management.agenda.sessionTypes.workshop.description'),
    color: '#8B5CF6',
    count: 0,
  },
  {
    type: 'break',
    label: t('management.agenda.sessionTypes.break.label'),
    description: t('management.agenda.sessionTypes.break.description'),
    color: '#22c55e',
    count: 0,
  },
  {
    type: 'panel',
    label: t('management.agenda.sessionTypes.panel.label'),
    description: t('management.agenda.sessionTypes.panel.description'),
    color: '#f97316',
    count: 0,
  },
])

const normalizeHex = (color: string): string | null => {
  if (!color || !color.startsWith('#')) return null
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
  }
  if (color.length === 7 || color.length === 9) {
    return color.slice(0, 7)
  }
  return null
}

const withAlpha = (color: string, alphaHex = '24'): string => {
  const normalized = normalizeHex(color)
  if (normalized) {
    return `${normalized}${alphaHex}`
  }
  if (color && !color.startsWith('#')) {
    return color
  }
  return `#1e90ff${alphaHex}`
}

// Computed
const groupedAgendaDays = computed(() => {
  const grouped: { date: string; items: EventAgendaItem[] }[] = []
  const dateMap = new Map<string, EventAgendaItem[]>()

  agendaItems.value.forEach((item) => {
    const date = fromApiDate(item.date)
    if (!dateMap.has(date)) {
      dateMap.set(date, [])
    }
    dateMap.get(date)!.push(item)
  })

  // Sort dates and create grouped array
  Array.from(dateMap.entries())
    .sort((a, b) => {
      if (isUnscheduled(a[0])) return 1
      if (isUnscheduled(b[0])) return -1
      return new Date(a[0]).getTime() - new Date(b[0]).getTime()
    })
    .forEach(([date, items]) => {
      grouped.push({
        date,
        items: items.sort((a, b) => a.order - b.order),
      })
    })

  return grouped
})

const legendItems = computed<LegendItem[]>(() => {
  const byType = new Map<string, LegendItem>()

  agendaItems.value.forEach((item) => {
    if (!item) return
    const typeKey = (item.agenda_type || 'other').toLowerCase()
    const base =
      DEFAULT_LEGEND.value.find((entry) => entry.type === typeKey) ||
      {
        type: typeKey,
        label: item.agenda_type || t('management.agenda.sessionTypes.other.label'),
        description: t('management.agenda.sessionTypes.other.description'),
        color: '#64748b',
        count: 0,
      }
    const color = item.color?.trim() || base.color

    if (!byType.has(typeKey)) {
      byType.set(typeKey, { ...base, color, count: 1 })
    } else {
      const current = byType.get(typeKey)!
      current.count += 1
      if (!current.color && color) {
        current.color = color
      }
    }
  })

  if (byType.size === 0) {
    return DEFAULT_LEGEND.value.map((entry) => ({ ...entry }))
  }

  const ordered: LegendItem[] = []

  DEFAULT_LEGEND.value.forEach((entry) => {
    if (byType.has(entry.type)) {
      const value = byType.get(entry.type)!
      ordered.push({ ...entry, color: value.color, count: value.count })
      byType.delete(entry.type)
    }
  })

  byType.forEach((value) => ordered.push({ ...value }))

  return ordered
})

const legendCardStyle = (color: string) => {
  const fallback = color?.trim() || '#1e90ff'
  return {
    borderColor: withAlpha(fallback, '33'),
    background: `linear-gradient(135deg, ${withAlpha(fallback, '12')} 0%, ${withAlpha(fallback, '05')} 100%)`,
  }
}

// Methods
const loadAgenda = async () => {
  loading.value = true
  try {
    const response = await agendaService.getAgendaItems(props.eventId)
    if (response.success && response.data) {
      agendaItems.value = response.data.results || []
    } else {
      toast.showError(response.message || t('management.agenda.toast.loadError'))
    }
  } catch (error) {
    console.error('Error loading agenda:', error)
    toast.showError(t('management.agenda.toast.loadErrorGeneric'))
  } finally {
    loading.value = false
  }
}

const toggleDay = (date: string) => {
  const index = expandedDays.value.indexOf(date)
  if (index > -1) {
    expandedDays.value.splice(index, 1)
  } else {
    expandedDays.value.push(date)
  }
}

// Date formatting helpers for calendar icon
const getMonthAbbr = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

const getDayOfMonth = (dateStr: string): string => {
  return new Date(dateStr).getDate().toString()
}

const formatDayHeader = (date: string): string => {
  if (isUnscheduled(date)) {
    return t('management.agenda.unscheduled')
  }
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// --- Embedded (Showcase section) presentation helpers ---

// Resolve item text in the current app language, falling back to base fields
const localizedItemText = (item: EventAgendaItem) => {
  const tr = item.translations?.find((entry) => entry.language === locale.value)
  return {
    title: tr?.title || item.title,
    description: tr?.description || item.description,
    speaker: tr?.speaker || item.speaker,
    start_time_text: tr?.start_time_text || item.start_time_text,
    end_time_text: tr?.end_time_text || item.end_time_text,
  }
}

const itemAccentColor = (item: EventAgendaItem): string => {
  const own = item.color?.trim()
  if (own) return normalizeHex(own) || own
  const legend = DEFAULT_LEGEND.value.find(
    (entry) => entry.type === (item.agenda_type || '').toLowerCase(),
  )
  return legend?.color || '#64748b'
}

// Row-level drag & drop (mirrors AgendaItemCard's semantics: drop on a
// target row reorders the dragged item relative to it, including cross-date)
const dragOverItemId = ref<number | null>(null)

const onRowDragStart = (event: DragEvent, item: EventAgendaItem) => {
  if (!props.canEdit) return
  handleDragStart(item)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.id.toString())
  }
}

const onRowDragOver = (event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onRowDragEnter = (item: EventAgendaItem) => {
  if (draggedItem.value && draggedItem.value.id !== item.id) {
    dragOverItemId.value = item.id
  }
}

const onRowDragLeave = (event: DragEvent, item: EventAgendaItem) => {
  // Only reset when actually leaving the row (not entering a child element)
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const { clientX: x, clientY: y } = event
  if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
    if (dragOverItemId.value === item.id) {
      dragOverItemId.value = null
    }
  }
}

const onRowDrop = (item: EventAgendaItem) => {
  dragOverItemId.value = null
  handleDragEnd(item, item.date)
}

const onRowDragEnd = () => {
  dragOverItemId.value = null
  if (!isReordering.value) {
    draggedItem.value = null
  }
}

// Languages in play across all items: English (base fields) plus any translation languages
const agendaLanguages = computed(() => {
  const langs = new Set<string>(['en'])
  agendaItems.value.forEach((item) =>
    item.translations?.forEach((entry) => langs.add(entry.language)),
  )
  return sortEventTextLanguages([...langs])
})

const itemLanguageChipClasses = (item: EventAgendaItem, lang: string): string => {
  const filled =
    lang === 'en'
      ? !!item.title
      : item.translations?.some((entry) => entry.language === lang && entry.title)
  return filled
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-white text-slate-400 border-dashed border-slate-200'
}

const getAgendaTypeLabel = (type: string): string =>
  t(`management.agenda.sessionTypes.${(type || 'other').toLowerCase()}.label`, type || '')

const typeBadgeStyle = (item: EventAgendaItem) => {
  const accent = itemAccentColor(item)
  return {
    backgroundColor: withAlpha(accent, '14'),
    color: accent,
  }
}

// Preview line: speaker · location, else description (session type is shown as a badge)
const getItemPreview = (item: EventAgendaItem): string => {
  const localized = localizedItemText(item)
  const parts = [localized.speaker, item.location].filter(Boolean)
  if (parts.length > 0) return parts.join(' · ')
  return localized.description || ''
}

const editAgendaItem = (item: EventAgendaItem) => {
  selectedItem.value = item
  showAgendaDrawer.value = true
}

const openCreateDrawer = () => {
  selectedItem.value = null
  showAgendaDrawer.value = true
}

const confirmDeleteItem = (item: EventAgendaItem) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

const deleteAgendaItem = async () => {
  if (!itemToDelete.value) return

  isDeleting.value = true
  try {
    const response = await agendaService.deleteAgendaItem(props.eventId, itemToDelete.value.id)
    if (response.success) {
      toast.showSuccess(t('management.agenda.toast.deleteSuccess'))
      agendaItems.value = agendaItems.value.filter((item) => item.id !== itemToDelete.value!.id)
      closeDeleteModal()
    } else {
      toast.showError(response.message || t('management.agenda.toast.deleteFailed'))
    }
  } catch (error) {
    console.error('Error deleting agenda item:', error)
    toast.showError(t('management.agenda.toast.deleteErrorGeneric'))
  } finally {
    isDeleting.value = false
  }
}

const handleAgendaCreated = async (newItem: EventAgendaItem) => {
  // Reload agenda to get updated orders for all items after bulk reorder
  await loadAgenda()
  selectedItem.value = null
  // Ensure the day containing the new item is expanded
  const itemDate = newItem.date || 'unscheduled'
  if (!expandedDays.value.includes(itemDate)) {
    expandedDays.value.push(itemDate)
  }
}

const handleAgendaUpdated = async (updatedItem: EventAgendaItem) => {
  // Reload agenda to get updated orders for all items after bulk reorder
  await loadAgenda()
  selectedItem.value = null
  // Ensure the day containing the updated item is expanded
  const itemDate = updatedItem.date || 'unscheduled'
  if (!expandedDays.value.includes(itemDate)) {
    expandedDays.value.push(itemDate)
  }
}

// Drag and drop handlers
const handleDragStart = (item: EventAgendaItem) => {
  // Prevent starting a new drag while reorder is in progress
  if (isReordering.value) {
    return
  }
  draggedItem.value = item
}

const handleDragEnd = async (targetItem: EventAgendaItem | null, targetDate?: string | null) => {
  // Prevent concurrent reorder operations
  if (isReordering.value) {
    console.warn('Reorder operation already in progress')
    draggedItem.value = null
    return
  }

  if (!draggedItem.value || !targetItem || draggedItem.value.id === targetItem.id) {
    draggedItem.value = null
    return
  }

  if (!Array.isArray(agendaItems.value)) {
    draggedItem.value = null
    return
  }

  isReordering.value = true
  const originalItems = [...agendaItems.value]

  try {
    const isChangingDate = draggedItem.value.date !== targetItem.date
    const draggedIndex = agendaItems.value.findIndex((item) => item.id === draggedItem.value!.id)
    const targetIndex = agendaItems.value.findIndex((item) => item.id === targetItem.id)

    if (draggedIndex === -1 || targetIndex === -1) {
      return
    }

    const newItems = [...agendaItems.value]
    const [draggedItemData] = newItems.splice(draggedIndex, 1)

    if (isChangingDate && targetDate !== undefined) {
      draggedItemData.date = targetDate
      draggedItemData.date_text = ''
    }

    newItems.splice(targetIndex, 0, draggedItemData)

    const itemsByDate = new Map<string | null, EventAgendaItem[]>()
    newItems.forEach((item) => {
      const dateKey = item.date
      if (!itemsByDate.has(dateKey)) {
        itemsByDate.set(dateKey, [])
      }
      itemsByDate.get(dateKey)!.push(item)
    })

    const updatedItems: EventAgendaItem[] = []
    itemsByDate.forEach((items) => {
      items.forEach((item, index) => {
        item.order = index
        updatedItems.push(item)
      })
    })

    agendaItems.value = [...newItems]
    await nextTick()

    const updates = updatedItems.map((item) => ({
      id: item.id,
      order: item.order,
      date: item.date,
    }))

    const response = await agendaService.bulkReorderAgendaItems(props.eventId, { updates })

    if (!response.success) {
      agendaItems.value = originalItems
      await nextTick()
      toast.showError(response.message || 'Failed to reorder agenda items')
    } else {
      if (isChangingDate) {
        toast.showSuccess(t('management.agenda.toast.movedSuccess'))
      } else {
        toast.showSuccess(t('management.agenda.toast.reorderedSuccess'))
      }
    }
  } catch (err) {
    agendaItems.value = originalItems
    await nextTick()
    toast.showError(t('management.agenda.toast.reorderNetworkError'))
    console.error('Error reordering agenda items:', err)
  } finally {
    isReordering.value = false
    draggedItem.value = null
  }
}

// Collapse/Expand transition hooks for smooth animation
const onCollapseEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
  element.style.opacity = '0'
  // Force reflow
  void element.offsetHeight
  element.style.height = element.scrollHeight + 'px'
  element.style.opacity = '1'
}

const onCollapseAfterEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = 'auto'
}

const onCollapseLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = element.scrollHeight + 'px'
  // Force reflow
  void element.offsetHeight
  element.style.height = '0'
  element.style.opacity = '0'
}

const onCollapseAfterLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = 'auto'
  element.style.opacity = '1'
}

// Lifecycle
onMounted(() => {
  loadAgenda().then(() => {
    // Auto-expand first day after loading
    if (groupedAgendaDays.value.length > 0 && expandedDays.value.length === 0) {
      expandedDays.value.push(groupedAgendaDays.value[0].date)
    }
  })
})

// Expose method for parent component (Smart FAB)
defineExpose({
  openAddModal: () => {
    showAgendaDrawer.value = true
  }
})
</script>

<style scoped>
/* Collapse/Expand transition for agenda groups */
.collapse-enter-active,
.collapse-leave-active {
  transition: height 0.3s ease-out, opacity 0.25s ease-out;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  height: 0;
  opacity: 0;
}

.agenda-item {
  transition: transform 0.2s ease;
}

.agenda-item.dragging {
  transform: rotate(2deg) scale(1.02);
  z-index: 10;
}

.legend-entry {
  backdrop-filter: blur(8px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.legend-entry:hover,
.legend-entry:focus-within {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px -18px rgba(30, 144, 255, 0.28);
}

/* Fade transition for reordering overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
