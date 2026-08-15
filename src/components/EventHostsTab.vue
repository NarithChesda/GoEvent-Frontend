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
          <h5 class="font-semibold text-slate-900">{{ t('management.hosts.title') }}</h5>
          <p class="text-sm text-slate-600">
            {{ canEdit ? t('management.hosts.subtitleEdit') : t('management.hosts.subtitleView') }}
          </p>
          <!-- Drag and Drop Hint (Desktop Only) -->
          <div
            v-if="canEdit && hosts.length > 1"
            class="hidden sm:flex items-center gap-1.5 mt-1.5 text-xs text-slate-400"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
            </svg>
            <span>{{ t('management.hosts.reorderHint') }}</span>
          </div>
        </button>
        <div class="flex items-center gap-1 flex-shrink-0">
          <!-- Action pills only exist while the section is open — a collapsed
               card shows nothing but its chevron. -->
          <button
            v-if="isExpanded && canEdit"
            @click="showCreateModal = true"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-full hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 transition-all"
            :title="t('management.hosts.addBtn')"
          >
            <UserPlus class="w-3.5 h-3.5" aria-hidden="true" />
            <span>{{ t('management.hosts.addBtn') }}</span>
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
      <div v-if="loading" class="space-y-2" aria-hidden="true">
        <div class="h-3 w-24 bg-slate-200 rounded animate-pulse"></div>
        <div class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          <div v-for="r in 3" :key="r" class="p-3 sm:p-4 flex items-center gap-3">
            <div class="w-10 h-10 bg-slate-200 rounded-full animate-pulse flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 w-32 bg-slate-200 rounded animate-pulse"></div>
              <div class="h-3 w-48 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="hosts.length === 0"
        @click="canEdit ? (showCreateModal = true) : undefined"
        class="border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300"
        :class="canEdit
          ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group'
          : 'border-slate-300 bg-slate-50'"
      >
        <Users
          class="w-8 h-8 text-slate-400 mx-auto mb-3"
          :class="{ 'group-hover:text-emerald-600 transition-colors': canEdit }"
        />
        <p class="font-semibold text-slate-600" :class="{ 'group-hover:text-slate-900 transition-colors': canEdit }">
          {{ canEdit ? t('management.hosts.empty.titleEdit') : t('management.hosts.empty.titleView') }}
        </p>
        <p class="text-sm text-slate-500 mt-1">
          {{ canEdit ? t('management.hosts.empty.descriptionEdit') : t('management.hosts.empty.descriptionView') }}
        </p>
      </div>

      <!-- Host Rows -->
      <div v-else class="space-y-2">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {{ canEdit ? t('management.hosts.allHosts') : t('management.hosts.hostsLabel') }}
          <span class="text-slate-400">· {{ sortedHosts.length }}</span>
        </p>
        <div class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          <button
            v-for="host in sortedHosts"
            :key="host.id"
            type="button"
            :disabled="!canEdit"
            :draggable="canEdit"
            @click="editHost(host)"
            @dragstart="onRowDragStart($event, host)"
            @dragover.prevent="onRowDragOver($event)"
            @dragenter.prevent="onRowDragEnter(host)"
            @dragleave="onRowDragLeave($event, host)"
            @drop.prevent="onRowDrop(host)"
            @dragend="onRowDragEnd"
            class="w-full flex items-center gap-3 p-3 sm:p-4 min-h-[56px] text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-inset"
            :class="[
              canEdit ? 'hover:bg-slate-50 active:bg-slate-100' : 'cursor-default',
              draggedHost?.id === host.id ? 'opacity-50' : '',
              dragOverHostId === host.id ? 'bg-sky-50' : '',
            ]"
          >
            <!-- Avatar -->
            <div class="w-10 h-10 rounded-full overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
              <img
                v-if="host.profile_image"
                :src="apiService.getProfilePictureUrl(host.profile_image) || undefined"
                :alt="getLocalizedHost(host).name"
                class="w-full h-full object-cover"
              />
              <Users v-else class="w-4 h-4 text-slate-400" aria-hidden="true" />
            </div>

            <!-- Name + chips + role -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-medium text-slate-900 truncate">
                  {{ getLocalizedHost(host).name }}
                </p>
                <span
                  v-if="hostLanguages.length > 1"
                  class="flex items-center gap-1 flex-shrink-0"
                >
                  <span
                    v-for="lang in hostLanguages"
                    :key="lang"
                    class="text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase"
                    :class="hostLanguageChipClasses(host, lang)"
                  >
                    {{ lang }}
                  </span>
                </span>
              </div>
              <p
                v-if="getHostPreview(host)"
                class="text-xs sm:text-sm text-slate-500 line-clamp-1 mt-0.5"
              >
                {{ getHostPreview(host) }}
              </p>
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
      </Transition>
    </div>

    <!-- Standalone tab mode -->
    <div v-else class="space-y-6">
    <!-- Header + Toolbar -->
    <div class="flex flex-col gap-4">
      <div class="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
            {{ t('management.hosts.title') }}
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">
            {{ canEdit ? t('management.hosts.subtitleEdit') : t('management.hosts.subtitleView') }}
          </p>
        </div>
        <button
          v-if="canEdit"
          @click="showCreateModal = true"
          class="hidden sm:flex bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 items-center text-sm sm:text-base"
          :aria-label="t('management.hosts.addBtn')"
        >
          <UserPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          <span class="hidden sm:inline">{{ t('management.hosts.addBtn') }}</span>
        </button>
      </div>

      <!-- Controls -->
      <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div class="flex-1 flex gap-2">
          <div class="relative w-full sm:max-w-xs">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('management.hosts.searchPlaceholder')"
              class="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-10 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              :aria-label="t('management.hosts.searchPlaceholder')"
            />
            <svg class="absolute left-3 top-2.5 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          </div>

          <div class="relative">
            <select
              v-model="sortBy"
              class="appearance-none rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm pl-3 pr-9 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
              :aria-label="t('management.hosts.sortLabel')"
            >
              <option value="order">{{ t('management.hosts.sortOrder') }}</option>
              <option value="name_asc">{{ t('management.hosts.sortNameAsc') }}</option>
              <option value="name_desc">{{ t('management.hosts.sortNameDesc') }}</option>
            </select>
            <svg class="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
          </div>
        </div>

        <div class="flex items-center justify-between sm:justify-end gap-2">
          <span class="text-xs sm:text-sm text-slate-500">{{ filteredCount }} {{ filteredCount === 1 ? t('management.hosts.count.one') : t('management.hosts.count.many') }}</span>
          <div class="hidden sm:block h-4 w-px bg-slate-200"></div>
          <div class="inline-flex rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm p-1">
            <button
              class="px-3 py-1.5 rounded-lg text-sm transition-colors"
              :class="viewMode === 'grid' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'"
              @click="userChangedViewMode = true; viewMode = 'grid'"
              :aria-label="t('management.hosts.viewGrid')"
            >{{ t('management.hosts.viewGrid') }}</button>
            <button
              class="px-3 py-1.5 rounded-lg text-sm transition-colors"
              :class="viewMode === 'list' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'"
              @click="userChangedViewMode = true; viewMode = 'list'"
              :aria-label="t('management.hosts.viewList')"
            >{{ t('management.hosts.viewList') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading: skeletons -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div v-for="i in 6" :key="i" class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow animate-pulse">
        <div class="flex flex-col items-center text-center gap-4">
          <div class="w-20 h-20 rounded-full bg-slate-200"></div>
          <div class="w-32 h-4 bg-slate-200 rounded"></div>
          <div class="w-24 h-3 bg-slate-200 rounded"></div>
          <div class="w-full h-12 bg-slate-100 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="sortedHosts.length > 0" class="space-y-6">

      <!-- Hosts Grid/List -->
      <div class="space-y-4">
        <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center">
          <Users class="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-1.5 sm:mr-2" />
          {{ canEdit ? t('management.hosts.allHosts') : t('management.hosts.hostsLabel') }} ({{ visibleHostsCount }})
        </h3>

        <!-- Admin tip when reordering disabled by sort/list -->
        <div v-if="canEdit && (sortBy !== 'order' || viewMode !== 'grid')" class="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-3 sm:p-4 flex items-start gap-2">
          <Info class="w-4 h-4 sm:w-5 sm:h-5 mt-0.5" />
          <p class="text-xs sm:text-sm">{{ t('management.hosts.reorderTip') }}</p>
        </div>

        <div
          v-if="viewMode === 'grid'"
          ref="sortableContainer"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          <HostCard
            v-for="host in sortedHosts"
            :key="host.id"
            :host="host"
            :can-edit="canEdit"
            :draggable="canEdit && sortBy === 'order'"
            @edit="editHost"
            @delete="confirmDeleteHost"
            @drag-start="handleDragStart"
            @drag-end="handleDragEnd"
            class="host-item"
            :data-id="host.id"
          />
        </div>

        <!-- List view -->
        <div v-else class="space-y-3">
          <div
            v-for="host in sortedHosts"
            :key="host.id"
            class="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-4 flex items-center gap-3"
          >
            <div class="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
              <img v-if="host.profile_image" :src="apiService.getProfilePictureUrl(host.profile_image) || undefined" :alt="host.name" class="w-full h-full object-cover" />
              <Users v-else class="w-6 h-6 text-slate-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 truncate">{{ getLocalizedHost(host).name }}</p>
              <p v-if="getLocalizedHost(host).title" class="text-xs text-sky-700 truncate">{{ getLocalizedHost(host).title }}</p>
            </div>
            <div class="flex items-center gap-1" v-if="canEdit">
              <button @click="editHost(host)" class="px-2 py-1 text-slate-500 hover:text-sky-700 rounded-lg hover:bg-slate-50 text-xs">{{ t('management.hosts.listEdit') }}</button>
              <button @click="confirmDeleteHost(host)" class="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs">{{ t('management.hosts.listDelete') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!loading"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <Users class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">{{ canEdit ? t('management.hosts.empty.titleEdit') : t('management.hosts.empty.titleView') }}</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">
        {{ canEdit ? t('management.hosts.empty.descriptionEdit') : t('management.hosts.empty.descriptionView') }}
      </p>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center mx-auto text-sm sm:text-base"
      >
        <UserPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        {{ t('management.hosts.empty.addBtn') }}
      </button>
    </div>

    </div>

    <!-- Overlays shared by both modes -->
    <!-- Unified Create/Edit Drawer -->
    <EditHostDrawer
      v-model="showCreateModal"
      :event-id="eventId"
      :event-category="eventCategory"
      :existing-hosts="hosts"
      @created="handleHostCreated"
    />

    <EditHostDrawer
      v-model="showEditModal"
      :event-id="eventId"
      :event-category="eventCategory"
      :host="selectedHost || undefined"
      :existing-hosts="hosts"
      @updated="handleHostUpdated"
      @delete="confirmDeleteHost"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="isDeleting"
      :title="t('management.hosts.deleteModal.title')"
      :item-name="hostToDelete?.name || ''"
      :message="t('management.hosts.deleteModal.message')"
      @confirm="deleteHost"
      @cancel="closeDeleteModal"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Users, UserPlus, Info, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { useToast } from '../composables/useToast'
import { hostsService, type EventHost, apiService } from '../services/api'
import HostCard from './HostCard.vue'
import EditHostDrawer from './EditHostDrawer.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCollapsibleSection } from '@/composables/useCollapsibleSection'
import { sortEventTextLanguages } from '@/utils/eventTextSlots'

const { locale, t } = useAppLanguage()
const { isExpanded, toggle: toggleExpanded } = useCollapsibleSection('hosts')

const getLocalizedHost = (host: EventHost) => {
  const translation = host.translations?.find((tr) => tr.language === locale.value)
  const pick = (translated: string | undefined, fallback: string | undefined) =>
    translated?.trim() ? translated : (fallback ?? '')
  return {
    name: pick(translation?.name, host.name),
    title: pick(translation?.title, host.title ?? ''),
  }
}

interface Props {
  eventId: string
  canEdit: boolean
  eventCategory?: string
  /** Render as an EventTextTab-style section panel inside the Showcase tab instead of a standalone page */
  embedded?: boolean
}

const props = defineProps<Props>()

// State
const hosts = ref<EventHost[]>([])
const loading = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const selectedHost = ref<EventHost | null>(null)
const hostToDelete = ref<EventHost | null>(null)
const { showToast } = useToast()
const draggedHost = ref<EventHost | null>(null)
// Controls state
const searchQuery = ref('')
const sortBy = ref<'order' | 'name_asc' | 'name_desc'>('order')
const viewMode = ref<'grid' | 'list'>('grid')
const userChangedViewMode = ref(false)

// Host roles configuration
// Removed hostRoles array since we're no longer categorizing by roles

// Computed
const totalHosts = computed(() => hosts.value.length)
const filteredHosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return hosts.value
  return hosts.value.filter((h) => {
    return (
      h.name?.toLowerCase().includes(q) ||
      h.title?.toLowerCase().includes(q) ||
      h.bio?.toLowerCase().includes(q)
    )
  })
})
const sortedHosts = computed(() => {
  const arr = [...filteredHosts.value]
  if (sortBy.value === 'name_asc') {
    return arr.sort((a, b) => a.name.localeCompare(b.name))
  }
  if (sortBy.value === 'name_desc') {
    return arr.sort((a, b) => b.name.localeCompare(a.name))
  }
  return arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
})
const filteredCount = computed(() => sortedHosts.value.length)
const visibleHostsCount = computed(() => sortedHosts.value.length)

// Removed speakersCount since we removed the speakers section

const moderatorsCount = computed(
  () =>
    // Placeholder - no role field available yet
    0,
)

const featuredCount = computed(
  () =>
    // Placeholder - no is_featured field available yet
    0,
)

const loadHosts = async () => {
  loading.value = true
  try {
    const response = await hostsService.getHosts(props.eventId)
    if (response.success && response.data) {
      hosts.value = response.data.results || []
    } else {
      showMessage('error', response.message || t('management.hosts.toast.loadError'))
    }
  } catch (error) {
    console.error('Error loading hosts:', error)
    showMessage('error', t('management.hosts.toast.loadErrorGeneric'))
  } finally {
    loading.value = false
  }
}

const editHost = (host: EventHost) => {
  selectedHost.value = host
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  // Clear selectedHost after a short delay to allow drawer close animation
  setTimeout(() => {
    selectedHost.value = null
  }, 300)
}

const confirmDeleteHost = (host: EventHost) => {
  hostToDelete.value = host
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  hostToDelete.value = null
}

const deleteHost = async () => {
  if (!hostToDelete.value) return

  isDeleting.value = true
  try {
    const response = await hostsService.deleteHost(props.eventId, hostToDelete.value.id)
    if (response.success) {
      showMessage('success', t('management.hosts.toast.deleteSuccess'))
      hosts.value = hosts.value.filter((host) => host.id !== hostToDelete.value!.id)
      closeDeleteModal()
    } else {
      showMessage('error', response.message || t('management.hosts.toast.deleteFailed'))
    }
  } catch (error) {
    console.error('Error deleting host:', error)
    showMessage('error', t('management.hosts.toast.deleteErrorGeneric'))
  } finally {
    isDeleting.value = false
  }
}

const handleHostCreated = async () => {
  // Reload hosts to pick up any reordering triggered by a manual position pick
  await loadHosts()
  // Drawer shows its own success message and closes itself
}

const handleHostUpdated = async () => {
  // Reload hosts to pick up any reordering triggered by a manual position pick
  await loadHosts()
  // Drawer shows its own success message and closes itself
  // Clear selectedHost after animation
  setTimeout(() => {
    selectedHost.value = null
  }, 300)
}

const showMessage = (type: 'success' | 'error', text: string) => {
  showToast(type, text)
}

// --- Embedded (Showcase section) presentation helpers ---

// Languages in play across all hosts: English (base fields) plus any translation languages
const hostLanguages = computed(() => {
  const langs = new Set<string>(['en'])
  hosts.value.forEach((host) =>
    host.translations?.forEach((entry) => langs.add(entry.language)),
  )
  return sortEventTextLanguages([...langs])
})

const hostLanguageChipClasses = (host: EventHost, lang: string): string => {
  const filled =
    lang === 'en'
      ? !!host.name
      : host.translations?.some((entry) => entry.language === lang && entry.name)
  return filled
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-white text-slate-400 border-dashed border-slate-200'
}

// Preview line: role/title, else parent names
const getHostPreview = (host: EventHost): string => {
  const localized = getLocalizedHost(host)
  if (localized.title) return localized.title
  return [host.parent_a_name, host.parent_b_name].filter(Boolean).join(' · ')
}

// Row-level drag & drop (drop on a target row reorders the dragged host relative to it)
const dragOverHostId = ref<number | null>(null)

const onRowDragStart = (event: DragEvent, host: EventHost) => {
  if (!props.canEdit) return
  handleDragStart(host)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', host.id.toString())
  }
}

const onRowDragOver = (event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onRowDragEnter = (host: EventHost) => {
  if (draggedHost.value && draggedHost.value.id !== host.id) {
    dragOverHostId.value = host.id
  }
}

const onRowDragLeave = (event: DragEvent, host: EventHost) => {
  // Only reset when actually leaving the row (not entering a child element)
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const { clientX: x, clientY: y } = event
  if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
    if (dragOverHostId.value === host.id) {
      dragOverHostId.value = null
    }
  }
}

const onRowDrop = (host: EventHost) => {
  dragOverHostId.value = null
  handleDragEnd(host)
}

const onRowDragEnd = () => {
  dragOverHostId.value = null
  draggedHost.value = null
}

// Drag and drop handlers
const handleDragStart = (host: EventHost) => {
  draggedHost.value = host
}

const handleDragEnd = async (targetHost: EventHost | null) => {
  if (!draggedHost.value || !targetHost || draggedHost.value.id === targetHost.id) {
    draggedHost.value = null
    return
  }

  // Ensure hosts.value is an array
  if (!Array.isArray(hosts.value)) {
    draggedHost.value = null
    return
  }

  // Find both hosts in the current array
  const draggedIndex = hosts.value.findIndex((host) => host.id === draggedHost.value!.id)
  const targetIndex = hosts.value.findIndex((host) => host.id === targetHost.id)

  if (draggedIndex === -1 || targetIndex === -1) {
    draggedHost.value = null
    return
  }

  // Create new array with reordered hosts
  const newHosts = [...hosts.value]
  const [draggedHostData] = newHosts.splice(draggedIndex, 1)
  newHosts.splice(targetIndex, 0, draggedHostData)

  // Update the order values for all hosts
  newHosts.forEach((host, index) => {
    host.order = index
  })

  const updates = newHosts.map((host, index) => ({
    id: host.id,
    order: index,
  }))

  // Optimistic update - force reactivity by creating new array reference
  hosts.value = [...newHosts]

  // Force Vue to update
  await nextTick()

  try {
    const response = await hostsService.bulkReorderHosts(props.eventId, { updates })
    if (!response.success) {
      // Rollback on failure
      await loadHosts()
      showMessage('error', response.message || t('management.hosts.toast.reorderFailed'))
    } else {
      showMessage('success', t('management.hosts.toast.reorderSuccess'))
      // Force a refresh from server to ensure UI is in sync
      setTimeout(async () => {
        await loadHosts()
      }, 100)
    }
  } catch (err) {
    // Rollback on failure
    await loadHosts()
    showMessage('error', t('management.hosts.toast.reorderFailed'))
  } finally {
    draggedHost.value = null
  }
}

// Lifecycle
let mqListener: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null = null

onMounted(() => {
  if (typeof window !== 'undefined') {
    const mql = window.matchMedia('(max-width: 640px)')
    const applyResponsive = () => {
      if (userChangedViewMode.value) return
      viewMode.value = mql.matches ? 'list' : 'grid'
    }
    applyResponsive()
    mqListener = () => applyResponsive()
    if ('addEventListener' in mql) {
      mql.addEventListener('change', mqListener)
    } else if ('addListener' in mql) {
      // @ts-ignore - Safari
      mql.addListener(mqListener)
    }
  }
  loadHosts()
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    const mql = window.matchMedia('(max-width: 640px)')
    if (mqListener) {
      if ('removeEventListener' in mql) {
        mql.removeEventListener('change', mqListener)
      } else if ('removeListener' in mql) {
        // @ts-ignore - Safari
        mql.removeListener(mqListener)
      }
    }
  }
})

// Expose method for parent component (Smart FAB)
defineExpose({
  openAddModal: () => {
    showCreateModal.value = true
  }
})
</script>

<style scoped>
.host-item {
  transition: transform 0.2s ease;
}

.host-item.dragging {
  transform: rotate(2deg) scale(1.02);
  z-index: 10;
}

/* Collapse/expand via grid-template-rows 0fr↔1fr — tracks real content
   height so both directions ease evenly (no max-height dead time) */
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
    transition: none !important;
  }
}
</style>
