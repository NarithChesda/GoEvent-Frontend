
<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          Guest Management
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">Organize guests, send invitations, and track responses</p>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loadingPayments"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Checking template status...</span>
      </div>
    </div>

    <!-- No Template Selected -->
    <div
      v-else-if="!props.event?.event_template"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <Mail class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">No Template Selected</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        You need to select an event template before you can send invitations.
      </p>
      <button
        @click="redirectToTemplateTab"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm sm:text-base"
      >
        <Mail class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Select Template
      </button>
    </div>

    <!-- Template Payment Check -->
    <div
      v-else-if="!hasTemplatePayment"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <Lock class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">Template Payment Required</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        Your template {{ props.event.event_template_details?.name || 'Selected Template' }}
        requires payment before you can send invitations.
      </p>
      <button
        @click="redirectToPaymentTab"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm sm:text-base"
      >
        <CreditCard class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Complete Payment
      </button>
    </div>

    <!-- Invitation Management Section -->
    <div v-else class="space-y-6">
      <!-- Guest Groups Section -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center">
            <Users class="w-5 h-5 text-[#1e90ff] mr-2" />
            Guest Groups
          </h3>
          <div class="flex items-center gap-2">
            <button
              @click="showCreateGroupModal = true"
              class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg inline-flex items-center text-sm"
            >
              <UserPlus class="w-4 h-4 mr-1.5 sm:mr-2" />
              <span class="hidden sm:inline">Create Group</span>
              <span class="sm:hidden">Group</span>
            </button>
            <button
              @click="showAddGuestModal = true"
              class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm"
            >
              <UserPlus class="w-4 h-4 mr-1.5 sm:mr-2" />
              <span class="hidden sm:inline">Add Guest</span>
              <span class="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        <!-- Guest Groups Display -->
        <div v-if="loadingGroups" class="text-center py-6 sm:py-8">
          <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:h-8 border-b-2 border-[#1e90ff] mx-auto"></div>
          <p class="text-xs sm:text-sm text-slate-600 mt-2">Loading guest groups...</p>
        </div>

        <div v-else-if="groups.length === 0" class="text-center py-8 sm:py-12">
          <Users class="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
          <p class="text-sm sm:text-base text-slate-500">No guest groups yet</p>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">
            Create a group before adding guests
          </p>
        </div>

        <!-- Group List -->
        <div v-else class="space-y-3">
          <GuestGroupCard
            v-for="group in groups"
            :key="group.id"
            :ref="el => groupCardRefs.set(group.id, el)"
            :group="group"
            :guests="getGroupGuests(group.id)"
            :loading="isGroupLoading(group.id)"
            :is-expanded="isGroupExpanded(group.id)"
            :current-page="getGroupPagination(group.id).currentPage"
            :total-count="getGroupPagination(group.id).totalCount"
            :page-size="PAGE_SIZE"
            :search-term="getGroupPagination(group.id).searchTerm"
            @toggle="handleGroupToggle(group.id)"
            @edit="openEditGroupModal"
            @delete="openDeleteGroupModal"
            @copy-link="copyShowcaseLink"
            @mark-sent="handleMarkAsSent"
            @edit-guest="openEditGuestModal"
            @delete-guest="openDeleteGuestModal"
            @next-page="nextGroupPage(group.id)"
            @previous-page="previousGroupPage(group.id)"
            @search="(searchTerm) => handleGroupSearch(group.id, searchTerm)"
            @bulk-mark-sent="handleBulkMarkSent(group.id)"
            @bulk-delete="handleBulkDelete(group.id)"
          />
        </div>
      </div>

      <!-- Enhanced Stats Dashboard -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
        <!-- Header -->
        <div class="mb-4 sm:mb-6">
          <h3 class="text-base sm:text-lg font-bold text-slate-900">Statistics</h3>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">Track and manage your invitations</p>
        </div>

        <!-- Primary Stats Grid (No Scroll) -->
        <div class="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <!-- Total Guests (Emphasis) -->
          <div
            class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-5 shadow-lg"
            role="region"
            aria-label="Total guests count"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <Users class="w-5 h-5 sm:w-6 sm:h-6 text-white/90" aria-hidden="true" />
                  <p class="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">Total Guests</p>
                </div>
                <div class="text-3xl sm:text-4xl font-bold text-white mb-1" aria-live="polite">
                  {{ loadingStats ? '—' : totalGuests }}
                </div>
                <!-- Mini progress indicator -->
                <div class="flex items-center gap-2 text-white/80 text-xs sm:text-sm">
                  <div class="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-white/40 rounded-full transition-all duration-500"
                      :style="{ width: sentPercentage + '%' }"
                      role="progressbar"
                      :aria-valuenow="sentPercentage"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      :aria-label="`${sentPercentage}% invitations sent`"
                    ></div>
                  </div>
                  <span class="font-medium whitespace-nowrap">{{ sentPercentage }}% sent</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Secondary Stats Grid - 3 columns -->
          <div class="grid grid-cols-3 gap-2 sm:gap-3">
            <!-- Sent Invitations -->
            <div
              class="bg-white border-2 border-sky-200 rounded-xl p-3 sm:p-4"
              role="region"
              aria-label="Sent invitations count"
            >
              <Send class="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 mb-1 sm:mb-2" aria-hidden="true" />
              <div class="text-lg sm:text-2xl font-bold text-slate-900 mb-0.5" aria-live="polite">
                {{ loadingStats ? '—' : sentInvitations }}
              </div>
              <p class="text-[10px] sm:text-sm font-medium text-slate-700 leading-tight">Sent</p>
              <p class="text-[9px] sm:text-xs text-sky-600 mt-0.5 sm:mt-1">{{ loadingStats ? '—' : sentPercentage }}%</p>
            </div>

            <!-- Viewed Invitations -->
            <div
              class="bg-white border-2 border-green-200 rounded-xl p-3 sm:p-4"
              role="region"
              aria-label="Viewed invitations count"
            >
              <Eye class="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mb-1 sm:mb-2" aria-hidden="true" />
              <div class="text-lg sm:text-2xl font-bold text-slate-900 mb-0.5" aria-live="polite">
                {{ loadingStats ? '—' : acceptedInvitations }}
              </div>
              <p class="text-[10px] sm:text-sm font-medium text-slate-700 leading-tight">Viewed</p>
              <p class="text-[9px] sm:text-xs text-green-600 mt-0.5 sm:mt-1">{{ loadingStats ? '—' : viewRate }}%</p>
            </div>

            <!-- Pending Invitations -->
            <div
              class="bg-white border-2 border-slate-200 rounded-xl p-3 sm:p-4"
              role="region"
              aria-label="Pending invitations count"
            >
              <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 mb-1 sm:mb-2" aria-hidden="true" />
              <div class="text-lg sm:text-2xl font-bold text-slate-900 mb-0.5" aria-live="polite">
                {{ loadingStats ? '—' : pendingInvitations }}
              </div>
              <p class="text-[10px] sm:text-sm font-medium text-slate-700 leading-tight">Pending</p>
              <p class="text-[9px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1 opacity-0">—</p>
            </div>
          </div>
        </div>

        <!-- Cash Gifts Section (Collapsible on Mobile) -->
        <div v-if="cashGiftStats.length > 0" class="border-t border-slate-200 pt-4 sm:pt-6">
          <button
            @click="showCashGifts = !showCashGifts"
            class="w-full flex items-center justify-between mb-3 sm:mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2 -m-2"
            :aria-expanded="showCashGifts"
            aria-controls="cash-gifts-section"
            type="button"
          >
            <div class="flex items-center gap-2">
              <DollarSign class="w-5 h-5 text-emerald-600" aria-hidden="true" />
              <h4 class="text-sm sm:text-base font-bold text-slate-900">Cash Gifts</h4>
              <span class="text-xs text-slate-600">({{ totalCashGiftGuests }} guests)</span>
            </div>
            <ChevronDown
              class="w-5 h-5 text-slate-400 transition-transform"
              :class="{ 'rotate-180': showCashGifts }"
              aria-hidden="true"
            />
          </button>

          <Transition name="expand">
            <div v-if="showCashGifts" id="cash-gifts-section" class="space-y-3">
              <div
                v-for="cashStat in cashGiftStats"
                :key="cashStat.currency"
                class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4"
                role="region"
                :aria-label="`${cashStat.currency} cash gifts total`"
              >
                <div class="flex items-start justify-between">
                  <div>
                    <div class="text-lg sm:text-xl font-bold text-emerald-900 mb-1">
                      {{ loadingStats ? '—' : cashStat.total.toLocaleString() }} {{ cashStat.currency }}
                    </div>
                    <p class="text-xs sm:text-sm text-emerald-700">
                      From {{ cashStat.count }} guest{{ cashStat.count !== 1 ? 's' : '' }}
                    </p>
                  </div>
                  <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <span class="text-xs sm:text-sm font-bold text-white">{{ cashStat.currency }}</span>
                  </div>
                </div>
              </div>

              <!-- Cash Gift Progress -->
              <div class="bg-slate-50 rounded-lg p-3">
                <div class="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <span class="font-medium text-slate-700">Gift Participation</span>
                  <span class="text-slate-600">{{ totalCashGiftGuests }}/{{ totalGuests }}</span>
                </div>
                <div class="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    class="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                    :style="{ width: cashGiftPercentage + '%' }"
                    role="progressbar"
                    :aria-valuenow="cashGiftPercentage"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="`${cashGiftPercentage}% guests contributed cash gifts`"
                  ></div>
                </div>
                <p class="text-xs text-slate-600 mt-2">{{ cashGiftPercentage }}% participation rate</p>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Detailed Engagement Breakdown (Collapsible) -->
        <div v-if="!loadingStats && totalGuests > 0" class="border-t border-slate-200 pt-4 sm:pt-6 mt-4 sm:mt-6">
          <button
            @click="showDetailedBreakdown = !showDetailedBreakdown"
            class="w-full flex items-center justify-between mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2 -m-2"
            :aria-expanded="showDetailedBreakdown"
            aria-controls="detailed-breakdown-section"
            type="button"
          >
            <h4 class="text-sm sm:text-base font-semibold text-slate-700">Detailed Breakdown</h4>
            <ChevronDown
              class="w-5 h-5 text-slate-400 transition-transform"
              :class="{ 'rotate-180': showDetailedBreakdown }"
              aria-hidden="true"
            />
          </button>

          <Transition name="expand">
            <div v-if="showDetailedBreakdown" id="detailed-breakdown-section" class="space-y-3">
              <!-- Invitation Status -->
              <div class="bg-slate-50 rounded-lg p-3 sm:p-4">
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="font-medium text-slate-700">Invitation Status</span>
                  <span class="text-slate-600">{{ sentInvitations }}/{{ totalGuests }} sent</span>
                </div>
                <div class="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                  <div
                    class="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all duration-500"
                    :style="{ width: sentPercentage + '%' }"
                    role="progressbar"
                    :aria-valuenow="sentPercentage"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="`${sentPercentage}% invitations sent`"
                  ></div>
                </div>
                <div class="flex flex-wrap items-center gap-3 text-xs">
                  <div class="flex items-center gap-1.5">
                    <div class="w-3 h-3 rounded-full bg-sky-500"></div>
                    <span class="text-slate-600">Sent: {{ sentInvitations }} ({{ sentPercentage }}%)</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="w-3 h-3 rounded-full bg-slate-300"></div>
                    <span class="text-slate-600">Pending: {{ pendingInvitations }} ({{ pendingPercentage }}%)</span>
                  </div>
                </div>
              </div>

              <!-- View Rate -->
              <div class="bg-slate-50 rounded-lg p-3 sm:p-4">
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="font-medium text-slate-700">View Engagement</span>
                  <span class="text-slate-600">{{ acceptedInvitations }}/{{ sentInvitations }} viewed</span>
                </div>
                <div class="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                  <div
                    class="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                    :style="{ width: viewedPercentage + '%' }"
                    role="progressbar"
                    :aria-valuenow="viewedPercentage"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="`${viewedPercentage}% of sent invitations viewed`"
                  ></div>
                </div>
                <div class="flex flex-wrap items-center gap-3 text-xs">
                  <div class="flex items-center gap-1.5">
                    <div class="w-3 h-3 rounded-full bg-green-500"></div>
                    <span class="text-slate-600">Viewed: {{ acceptedInvitations }} ({{ viewRate }}% rate)</span>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Cash Gift Analytics -->
      <CashGiftAnalytics
        v-if="groups.length > 0"
        ref="cashGiftAnalyticsRef"
        :event-id="props.eventId"
        :groups="groups"
      />
    </div>

    <!-- Delete Guest Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      title="Delete Guest"
      :item-name="(deleteTargetGuest && deleteTargetGuest.name) || ''"
      :loading="deletingGuest"
      @confirm="confirmDeleteGuest"
      @cancel="cancelDeleteGuest"
    />

    <!-- Delete Group Modal -->
    <DeleteConfirmModal
      :show="showDeleteGroupModal"
      title="Delete Group"
      :item-name="(deleteTargetGroup && deleteTargetGroup.name) || ''"
      :loading="deletingGroup"
      :warning-message="`This will delete all ${deleteTargetGroup?.guest_count || 0} guests in this group!`"
      @confirm="confirmDeleteGroup"
      @cancel="cancelDeleteGroup"
    />

    <!-- Create Group Modal -->
    <CreateGroupModal
      :show="showCreateGroupModal"
      :is-creating="isCreatingGroup"
      @close="showCreateGroupModal = false"
      @create="handleCreateGroup"
    />

    <!-- Add Guest Modal -->
    <AddGuestModal
      :show="showAddGuestModal"
      :groups="groups"
      :is-adding="isAddingGuest"
      :is-importing="isImporting"
      :selected-file="selectedFile"
      :is-dragging="isDragging"
      @close="handleCloseAddGuestModal"
      @add-guest="handleAddGuest"
      @import="handleBulkImport"
      @download-template="downloadTemplate"
      @file-select="handleFileSelect"
      @file-drop="handleFileDrop"
      @drag-over="handleDragOver"
      @drag-leave="handleDragLeave"
    />

    <!-- Edit Guest Modal -->
    <EditGuestModal
      ref="editGuestModalRef"
      :show="showEditGuestModal"
      :guest="editTargetGuest"
      :groups="groups"
      :is-updating="isUpdatingGuest"
      @close="handleCloseEditGuestModal"
      @update-guest="handleUpdateGuest"
    />

    <!-- Edit Group Modal -->
    <EditGroupModal
      ref="editGroupModalRef"
      :show="showEditGroupModal"
      :group="editTargetGroup"
      :is-updating="isUpdatingGroup"
      @close="handleCloseEditGroupModal"
      @update-group="handleUpdateGroup"
    />

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 left-4 sm:left-auto z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center text-sm sm:text-base"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <AlertCircle v-else class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <span class="flex-1">{{ message.text }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  CheckCircle,
  Users,
  Lock,
  CreditCard,
  Mail,
  UserPlus,
  AlertCircle,
  Send,
  Eye,
  Clock,
  DollarSign,
  ChevronDown,
} from 'lucide-vue-next'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import { useGuestGroups } from '../composables/invitation/useGuestGroups'
import { useGuests } from '../composables/invitation/useGuests'
import { useBulkImport } from '../composables/invitation/useBulkImport'
import type { Event, EventGuest, GuestGroup } from '../services/api'
import { guestService } from '../services/api'
import { getGuestSSRMetaUrl } from '../utils/metaUtils'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import GuestGroupCard from './invitation/GuestGroupCard.vue'
import CreateGroupModal from './invitation/CreateGroupModal.vue'
import AddGuestModal from './invitation/AddGuestModal.vue'
import EditGuestModal from './invitation/EditGuestModal.vue'
import EditGroupModal from './invitation/EditGroupModal.vue'
import CashGiftAnalytics from './invitation/CashGiftAnalytics.vue'

// Props
const props = defineProps<{
  eventId: string
  event: Event
  canEdit: boolean
}>()

// Emits
const emit = defineEmits<{
  'tab-change': [tab: string]
}>()

// Use composables
const { isTemplateActivated, loadPayments, loadingPayments } = usePaymentTemplateIntegration(props.event)

const {
  groups,
  loadingGroups,
  loadGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  toggleGroupExpansion,
  isGroupExpanded,
} = useGuestGroups(props.eventId)

const {
  guestStats,
  loadingStats,
  PAGE_SIZE,
  getGroupPagination,
  getGroupTotalPages,
  getGroupGuests,
  isGroupLoading,
  loadGuestsForGroup,
  loadGuestStats,
  createGuest,
  updateGuest,
  deleteGuest,
  markGuestAsSent,
  nextGroupPage,
  previousGroupPage,
  setGroupSearchTerm,
} = useGuests(props.eventId)

const {
  selectedFile,
  isDragging,
  isImporting,
  handleFileSelect,
  handleFileDrop,
  handleDragOver,
  handleDragLeave,
  importGuests,
  downloadTemplate,
  resetImportState,
} = useBulkImport(props.eventId)

// Local state
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const showAddGuestModal = ref(false)
const showCreateGroupModal = ref(false)
const isAddingGuest = ref(false)
const isCreatingGroup = ref(false)
const groupCardRefs = new Map<number, any>()
const showCashGifts = ref(true) // Default open on mobile
const showDetailedBreakdown = ref(false) // Default collapsed

// Edit guest modal state
const showEditGuestModal = ref(false)
const editTargetGuest = ref<EventGuest | null>(null)
const isUpdatingGuest = ref(false)
const editGuestModalRef = ref<InstanceType<typeof EditGuestModal> | null>(null)

// Edit group modal state
const showEditGroupModal = ref(false)
const editTargetGroup = ref<GuestGroup | null>(null)
const isUpdatingGroup = ref(false)
const editGroupModalRef = ref<InstanceType<typeof EditGroupModal> | null>(null)

// Cash gift analytics ref
const cashGiftAnalyticsRef = ref<InstanceType<typeof CashGiftAnalytics> | null>(null)

// Delete modal state
const showDeleteModal = ref(false)
const deletingGuest = ref(false)
const deleteTargetGuest = ref<EventGuest | null>(null)
const showDeleteGroupModal = ref(false)
const deleteTargetGroup = ref<GuestGroup | null>(null)
const deletingGroup = ref(false)

// Computed properties
const hasTemplatePayment = computed(() => {
  if (!props.event?.event_template) return false
  return isTemplateActivated.value
})

const acceptedInvitations = computed(() => guestStats.value?.viewed || 0)
const totalGuests = computed(() => guestStats.value?.total_guests || 0)
const sentInvitations = computed(() => guestStats.value?.sent || 0)
const pendingInvitations = computed(() => {
  const total = totalGuests.value
  const sent = sentInvitations.value
  return Math.max(0, total - sent)
})

const sentPercentage = computed(() => {
  const total = totalGuests.value
  if (total === 0) return 0
  return Math.round((sentInvitations.value / total) * 100)
})

const viewedPercentage = computed(() => {
  const total = totalGuests.value
  if (total === 0) return 0
  return Math.round((acceptedInvitations.value / total) * 100)
})

const pendingPercentage = computed(() => {
  const total = totalGuests.value
  if (total === 0) return 0
  return Math.round((pendingInvitations.value / total) * 100)
})

const viewRate = computed(() => {
  const sent = sentInvitations.value
  if (sent === 0) return 0
  return Math.round((acceptedInvitations.value / sent) * 100)
})

// Cash gift stats computed properties - get from CashGiftAnalytics component
const cashGiftStats = computed(() => {
  if (!cashGiftAnalyticsRef.value?.currencyBreakdown) {
    return []
  }
  return cashGiftAnalyticsRef.value.currencyBreakdown.map(item => ({
    currency: item.code,
    total: item.total,
    count: item.count,
  }))
})

// Total cash gift guests and percentage
const totalCashGiftGuests = computed(() => {
  return cashGiftStats.value.reduce((sum, stat) => sum + stat.count, 0)
})

const cashGiftPercentage = computed(() => {
  const total = totalGuests.value
  if (total === 0) return 0
  return Math.round((totalCashGiftGuests.value / total) * 100)
})

// Methods
const redirectToPaymentTab = () => {
  emit('tab-change', 'payment')
}

const redirectToTemplateTab = () => {
  emit('tab-change', 'template')
}

const handleGroupToggle = async (groupId: number) => {
  const wasExpanded = toggleGroupExpansion(groupId)
  // If the group was just expanded and has no guests loaded yet, load them
  if (wasExpanded && getGroupGuests(groupId).length === 0) {
    await loadGuestsForGroup(groupId, 1)
  }
}

const handleGroupSearch = (groupId: number, searchTerm: string) => {
  setGroupSearchTerm(groupId, searchTerm)
}

const handleCreateGroup = async (data: { name: string; description?: string; color: string }) => {
  isCreatingGroup.value = true

  const response = await createGroup({
    name: data.name,
    description: data.description,
    color: data.color,
    order: groups.value.length + 1,
  })

  if (response.success && response.data) {
    showMessage('success', `Group "${response.data.name}" created`)
    showCreateGroupModal.value = false
  } else {
    showMessage('error', response.message || 'Failed to create group')
  }

  isCreatingGroup.value = false
}

const handleAddGuest = async (name: string, groupId: number) => {
  isAddingGuest.value = true

  const response = await createGuest(name, groupId)

  if (response.success && response.data) {
    showMessage('success', `${response.data.name} added to guest list`)
    showAddGuestModal.value = false
    // Refresh stats and groups
    await loadGuestStats()
    await loadGroups()

    // Refresh cash gift analytics (in case guest has default gift)
    if (cashGiftAnalyticsRef.value) {
      await cashGiftAnalyticsRef.value.refresh()
    }
  } else {
    showMessage('error', response.message || 'Failed to add guest')
  }

  isAddingGuest.value = false
}

const handleBulkImport = async (groupId: number) => {
  const response = await importGuests(groupId)

  if (response.success && response.data) {
    const { created, skipped, skipped_guests } = response.data

    // Refresh stats and groups
    await loadGuestStats()
    await loadGroups()

    // Refresh the group's guest list if it's currently loaded
    const pagination = getGroupPagination(groupId)
    await loadGuestsForGroup(groupId, pagination.currentPage)

    // Refresh cash gift analytics (imported guests may have cash gifts)
    if (cashGiftAnalyticsRef.value) {
      await cashGiftAnalyticsRef.value.refresh()
    }

    // Show results
    if (skipped > 0) {
      showMessage(
        'success',
        `Imported ${created} guests. ${skipped} skipped: ${skipped_guests.map((g) => g.name).join(', ')}`,
      )
    } else {
      showMessage('success', `Successfully imported ${created} guests`)
    }

    showAddGuestModal.value = false
  } else {
    showMessage('error', response.message || 'Failed to import guests')
  }
}

const handleCloseAddGuestModal = () => {
  showAddGuestModal.value = false
  resetImportState()
}

const openEditGroupModal = (group: GuestGroup) => {
  editTargetGroup.value = group
  showEditGroupModal.value = true
}

const handleCloseEditGroupModal = () => {
  showEditGroupModal.value = false
  editTargetGroup.value = null
}

const handleUpdateGroup = async (groupId: number, data: any) => {
  if (!editTargetGroup.value) return

  isUpdatingGroup.value = true

  const response = await updateGroup(groupId, data)

  if (response.success && response.data) {
    showMessage('success', `Group "${response.data.name}" updated successfully`)
    showEditGroupModal.value = false
    editTargetGroup.value = null
    await loadGroups()
  } else {
    // Handle validation errors
    if (response.errors && typeof response.errors === 'object') {
      const hasFieldErrors = Object.keys(response.errors).some(key =>
        Array.isArray(response.errors![key])
      )

      if (hasFieldErrors && editGroupModalRef.value) {
        editGroupModalRef.value.setFieldErrors(response.errors as Record<string, string[]>)
      } else if (editGroupModalRef.value) {
        editGroupModalRef.value.setErrorMessage(response.message || 'Failed to update group')
      }
    } else if (editGroupModalRef.value) {
      editGroupModalRef.value.setErrorMessage(response.message || 'Failed to update group')
    }
    showMessage('error', response.message || 'Failed to update group')
  }

  isUpdatingGroup.value = false
}

const openDeleteGroupModal = (group: GuestGroup) => {
  deleteTargetGroup.value = group
  showDeleteGroupModal.value = true
}

const confirmDeleteGroup = async () => {
  if (!deleteTargetGroup.value) return

  deletingGroup.value = true

  const response = await deleteGroup(deleteTargetGroup.value.id)

  if (response.success) {
    showMessage(
      'success',
      `Group "${deleteTargetGroup.value.name}" and all its guests have been deleted`,
    )
    await loadGuestStats()
  } else {
    showMessage('error', response.message || 'Failed to delete group')
  }

  deletingGroup.value = false
  showDeleteGroupModal.value = false
  deleteTargetGroup.value = null
}

const cancelDeleteGroup = () => {
  if (deletingGroup.value) return
  showDeleteGroupModal.value = false
  deleteTargetGroup.value = null
}

const openDeleteGuestModal = (guest: EventGuest) => {
  deleteTargetGuest.value = guest
  showDeleteModal.value = true
}

const confirmDeleteGuest = async () => {
  if (!deleteTargetGuest.value) return
  const groupId = deleteTargetGuest.value.group

  deletingGuest.value = true

  const response = await deleteGuest(deleteTargetGuest.value.id, groupId)

  if (response.success) {
    showMessage('success', deleteTargetGuest.value.name + ' removed from guest list')
    await loadGuestStats()
    await loadGroups()

    // Refresh cash gift analytics (deleted guest may have had a gift)
    if (cashGiftAnalyticsRef.value) {
      await cashGiftAnalyticsRef.value.refresh()
    }
  } else {
    showMessage('error', response.message || 'Failed to remove guest')
  }

  deletingGuest.value = false
  showDeleteModal.value = false
  deleteTargetGuest.value = null
}

const cancelDeleteGuest = () => {
  if (deletingGuest.value) return
  showDeleteModal.value = false
  deleteTargetGuest.value = null
}

const handleMarkAsSent = async (guest: EventGuest) => {
  const response = await markGuestAsSent(guest.id, guest.group)

  if (response.success) {
    showMessage('success', `${guest.name} marked as sent`)
  } else {
    showMessage('error', response.message || 'Failed to mark guest as sent')
  }
}

const openEditGuestModal = (guest: EventGuest) => {
  editTargetGuest.value = guest
  showEditGuestModal.value = true
}

const handleCloseEditGuestModal = () => {
  showEditGuestModal.value = false
  editTargetGuest.value = null
}

const handleUpdateGuest = async (guestId: number, data: any) => {
  console.log('[EventInvitationTab] handleUpdateGuest called with:', { guestId, data })
  if (!editTargetGuest.value) {
    console.log('[EventInvitationTab] No edit target guest')
    return
  }

  const originalGroupId = editTargetGuest.value.group
  isUpdatingGuest.value = true

  const response = await updateGuest(guestId, originalGroupId, data)
  console.log('[EventInvitationTab] Update response:', response)

  if (response.success && response.data) {
    showMessage('success', `${response.data.name} updated successfully`)
    showEditGuestModal.value = false
    editTargetGuest.value = null

    // Refresh stats and groups if the group changed
    if (data.group && data.group !== originalGroupId) {
      await loadGuestStats()
      await loadGroups()
    }

    // Refresh cash gift analytics if cash gift info was updated
    if (data.cash_gift_amount !== undefined || data.cash_gift_currency !== undefined) {
      if (cashGiftAnalyticsRef.value) {
        await cashGiftAnalyticsRef.value.refresh()
      }
    }
  } else {
    // Handle validation errors
    if (response.errors && typeof response.errors === 'object') {
      // Check if errors is in the field-specific format
      const hasFieldErrors = Object.keys(response.errors).some(key =>
        Array.isArray(response.errors![key])
      )

      if (hasFieldErrors && editGuestModalRef.value) {
        editGuestModalRef.value.setFieldErrors(response.errors as Record<string, string[]>)
      } else if (editGuestModalRef.value) {
        editGuestModalRef.value.setErrorMessage(response.message || 'Failed to update guest')
      }
    } else if (editGuestModalRef.value) {
      editGuestModalRef.value.setErrorMessage(response.message || 'Failed to update guest')
    }
    showMessage('error', response.message || 'Failed to update guest')
  }

  isUpdatingGuest.value = false
}

const getGuestShowcaseUrl = (guest: EventGuest, language: 'en' | 'kh' = 'kh') => {
  return getGuestSSRMetaUrl(props.eventId, guest.name, language)
}

const getDirectGuestShowcaseUrl = (guest: EventGuest, language: 'en' | 'kh' = 'kh') => {
  const showcaseUrl = `/events/${props.eventId}/showcase?guest_name=${encodeURIComponent(guest.name)}&lang=${language}`
  return `${window.location.origin}${showcaseUrl}`
}

const copyShowcaseLink = (guest: EventGuest, language: 'en' | 'kh') => {
  const fullUrl = getGuestShowcaseUrl(guest, language)
  navigator.clipboard
    .writeText(fullUrl)
    .then(() => {
      showMessage('success', `Showcase link (${language.toUpperCase()}) copied for ${guest.name}`)
    })
    .catch(() => {
      showMessage('error', 'Failed to copy link')
    })
}

const handleBulkMarkSent = async (groupId: number) => {
  const groupCard = groupCardRefs.get(groupId)
  if (!groupCard) return

  const selectedIds = Array.from(groupCard.selectedGuestIds as Set<number>)
  if (selectedIds.length === 0) return

  // Mark each selected guest as sent
  let successCount = 0
  for (const guestId of selectedIds) {
    const response = await guestService.markInvitationSent(props.eventId, guestId)
    if (response.success) {
      successCount++
    }
  }

  if (successCount > 0) {
    showMessage('success', `Marked ${successCount} guest(s) as sent`)
    await loadGuestStats()
    await loadGroups()
    const pagination = getGroupPagination(groupId)
    await loadGuestsForGroup(groupId, pagination.currentPage)
  }

  // Clear selections
  groupCard.clearSelection()
}

const handleBulkDelete = async (groupId: number) => {
  const groupCard = groupCardRefs.get(groupId)
  if (!groupCard) return

  const selectedIds = Array.from(groupCard.selectedGuestIds as Set<number>)
  if (selectedIds.length === 0) return

  // Confirm bulk delete
  if (!confirm(`Are you sure you want to delete ${selectedIds.length} guest(s)?`)) {
    return
  }

  // Delete each selected guest
  let successCount = 0
  for (const guestId of selectedIds) {
    const response = await guestService.deleteGuest(props.eventId, guestId)
    if (response.success) {
      successCount++
    }
  }

  if (successCount > 0) {
    showMessage('success', `Deleted ${successCount} guest(s)`)
    await loadGuestStats()
    await loadGroups()
    const pagination = getGroupPagination(groupId)
    await loadGuestsForGroup(groupId, pagination.currentPage)

    // Refresh cash gift analytics (deleted guests may have had gifts)
    if (cashGiftAnalyticsRef.value) {
      await cashGiftAnalyticsRef.value.refresh()
    }
  }

  // Clear selections
  groupCard.clearSelection()
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Lifecycle
onMounted(() => {
  loadPayments()
})

// Watch for template payment status changes
watch(hasTemplatePayment, (isActivated) => {
  if (isActivated) {
    loadGroups()
    loadGuestStats()
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Ensure scrollbar-hide container enables scrolling */
.scrollbar-hide {
  overflow-x: auto;
  overflow-y: hidden;
}

/* Expand transition for collapsible sections */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 800px;
  transform: translateY(0);
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .expand-enter-active,
  .expand-leave-active {
    transition: none;
  }

  div[role='progressbar'] {
    transition: none !important;
  }
}
</style>
