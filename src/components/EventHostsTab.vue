<template>
  <div class="space-y-6">
    <!-- Header + Toolbar -->
    <div class="flex flex-col gap-4">
      <div class="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
            Hosts & Speakers
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">
            {{ canEdit ? 'Add and manage your event lineup. Drag to reorder when using Display Order.' : 'Meet the people behind this event.' }}
          </p>
        </div>
        <button
          v-if="canEdit"
          @click="showCreateModal = true"
          class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center text-sm sm:text-base"
          aria-label="Add host"
        >
          <UserPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          <span class="hidden sm:inline">Add Host</span>
          <span class="sm:hidden">Add</span>
        </button>
      </div>

      <!-- Controls -->
      <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div class="flex-1 flex gap-2">
          <div class="relative w-full sm:max-w-xs">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search hosts..."
              class="w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-10 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              aria-label="Search hosts"
            />
            <svg class="absolute left-3 top-2.5 h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          </div>

          <div class="relative">
            <select
              v-model="sortBy"
              class="appearance-none rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm pl-3 pr-9 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
              aria-label="Sort hosts"
            >
              <option value="order">Display Order</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
            </select>
            <svg class="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
          </div>
        </div>

        <div class="flex items-center justify-between sm:justify-end gap-2">
          <span class="text-xs sm:text-sm text-slate-500">{{ filteredCount }} {{ filteredCount === 1 ? 'Host' : 'Hosts' }}</span>
          <div class="hidden sm:block h-4 w-px bg-slate-200"></div>
          <div class="inline-flex rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm p-1">
            <button
              class="px-3 py-1.5 rounded-lg text-sm transition-colors"
              :class="viewMode === 'grid' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'"
              @click="userChangedViewMode = true; viewMode = 'grid'"
              aria-label="Grid view"
            >Grid</button>
            <button
              class="px-3 py-1.5 rounded-lg text-sm transition-colors"
              :class="viewMode === 'list' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'"
              @click="userChangedViewMode = true; viewMode = 'list'"
              aria-label="List view"
            >List</button>
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
      <!-- Featured (public grid view only) -->
      <div v-if="!canEdit && viewMode === 'grid' && featuredHost" class="relative">
        <div class="bg-gradient-to-br from-emerald-50 to-sky-50 border border-[#87CEEB]/50 rounded-3xl p-4 sm:p-6">
          <div class="flex items-center mb-3 sm:mb-4">
            <span class="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><path d="M9 5l12-2"/><path d="M9 3L3 5v13l6-2"/><path d="M9 12l12-2"/></svg>
              Featured Host
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div class="sm:col-span-1">
              <HostCard
                :host="featuredHost"
                :can-edit="canEdit"
                :draggable="false"
                @edit="editHost"
                @delete="confirmDeleteHost"
              />
            </div>
            <div class="sm:col-span-2 flex items-center">
              <p class="text-sm sm:text-base text-slate-700 leading-relaxed">
                {{ featuredHost.bio || 'Learn more about our lead host.' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Hosts Grid/List -->
      <div class="space-y-4">
        <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center">
          <Users class="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-1.5 sm:mr-2" />
          {{ canEdit ? 'All Hosts' : 'Hosts' }} ({{ restOrAllCount }})
        </h3>

        <!-- Admin tip when reordering disabled by sort/list -->
        <div v-if="canEdit && (sortBy !== 'order' || viewMode !== 'grid')" class="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-3 sm:p-4 flex items-start gap-2">
          <Info class="w-4 h-4 sm:w-5 sm:h-5 mt-0.5" />
          <p class="text-xs sm:text-sm">Drag-to-reorder is available only in Grid view with Sort set to Display Order.</p>
        </div>

        <div
          v-if="viewMode === 'grid'"
          ref="sortableContainer"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          <HostCard
            v-for="host in gridHosts"
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
              <p class="text-sm font-semibold text-slate-900 truncate">{{ host.name }}</p>
              <p v-if="host.title" class="text-xs text-sky-700 truncate">{{ host.title }}</p>
            </div>
            <div class="flex items-center gap-1" v-if="canEdit">
              <button @click="editHost(host)" class="px-2 py-1 text-slate-500 hover:text-sky-700 rounded-lg hover:bg-slate-50 text-xs">Edit</button>
              <button @click="confirmDeleteHost(host)" class="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs">Delete</button>
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
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">{{ canEdit ? 'No Hosts Added Yet' : 'No Hosts Available' }}</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">
        {{ canEdit ? 'Add hosts and speakers to showcase your event team.' : 'Hosts will appear here once added by the organizers.' }}
      </p>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center mx-auto text-sm sm:text-base"
      >
        <UserPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Add Your First Host
      </button>
    </div>

    <!-- Create/Edit Modal -->
    <CreateHostModal
      v-if="showCreateModal"
      :event-id="eventId"
      @close="showCreateModal = false"
      @created="handleHostCreated"
    />

    <EditHostModal
      v-if="showEditModal && selectedHost"
      :host="selectedHost"
      :event-id="eventId"
      @close="closeEditModal"
      @updated="handleHostUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="isDeleting"
      title="Remove Host"
      :item-name="hostToDelete?.name || ''"
      message="This will remove this person from your event hosts."
      @confirm="deleteHost"
      @cancel="closeDeleteModal"
    />

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-8 right-8 z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
          <AlertCircle v-else class="w-5 h-5 mr-2" />
          {{ message.text }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Users, UserPlus, Info, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { hostsService, type EventHost, apiService } from '../services/api'
import HostCard from './HostCard.vue'
import CreateHostModal from './CreateHostModal.vue'
import EditHostModal from './EditHostModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventId: string
  canEdit: boolean
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
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
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
const featuredHost = computed(() => (sortedHosts.value.length > 0 ? sortedHosts.value[0] : null))
const restHosts = computed(() => (sortedHosts.value.length > 1 ? sortedHosts.value.slice(1) : []))
const gridHosts = computed(() => {
  if (!props.canEdit && viewMode.value === 'grid') return restHosts.value
  return sortedHosts.value
})
const filteredCount = computed(() => sortedHosts.value.length)
const restOrAllCount = computed(() => (props.canEdit || viewMode.value === 'list' ? sortedHosts.value.length : gridHosts.value.length))

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
      showMessage('error', response.message || 'Failed to load hosts')
    }
  } catch (error) {
    console.error('Error loading hosts:', error)
    showMessage('error', 'An error occurred while loading hosts')
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
  selectedHost.value = null
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
      showMessage('success', 'Host removed successfully')
      hosts.value = hosts.value.filter((host) => host.id !== hostToDelete.value!.id)
      closeDeleteModal()
    } else {
      showMessage('error', response.message || 'Failed to remove host')
    }
  } catch (error) {
    console.error('Error deleting host:', error)
    showMessage('error', 'An error occurred while removing the host')
  } finally {
    isDeleting.value = false
  }
}

const handleHostCreated = (newHost: EventHost) => {
  hosts.value.push(newHost)
  showMessage('success', 'Host added successfully')
  showCreateModal.value = false
}

const handleHostUpdated = (updatedHost: EventHost) => {
  const index = hosts.value.findIndex((host) => host.id === updatedHost.id)
  if (index !== -1) {
    hosts.value[index] = updatedHost
  }
  showMessage('success', 'Host updated successfully')
  closeEditModal()
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
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
      showMessage('error', response.message || 'Failed to reorder hosts')
    } else {
      showMessage('success', 'Hosts reordered successfully')
      // Force a refresh from server to ensure UI is in sync
      setTimeout(async () => {
        await loadHosts()
      }, 100)
    }
  } catch (err) {
    // Rollback on failure
    await loadHosts()
    showMessage('error', 'Failed to reorder hosts')
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

.host-item {
  transition: transform 0.2s ease;
}

.host-item.dragging {
  transform: rotate(2deg) scale(1.02);
  z-index: 10;
}
</style>
