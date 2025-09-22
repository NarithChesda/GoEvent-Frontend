<template>
  <div class="space-y-6">
    <!-- Header with Create Button -->
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Hosts</h3>
        <p class="text-lg text-slate-600 mt-1 leading-relaxed">
          Manage speakers, hosts, and featured guests for your event
        </p>
      </div>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-emerald-500/25 flex items-center space-x-2"
      >
        <Plus class="w-4 h-4" />
        <span>Add Host</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="bg-slate-200 rounded-2xl p-6">
          <div class="flex items-start space-x-4">
            <div class="w-16 h-16 bg-slate-300 rounded-full"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-slate-300 rounded w-1/3"></div>
              <div class="h-3 bg-slate-300 rounded w-1/4"></div>
              <div class="h-3 bg-slate-300 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto">
        <AlertCircle class="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p class="text-lg text-red-600 font-semibold leading-relaxed">{{ error }}</p>
        <button
          @click="fetchHosts"
          class="mt-4 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!Array.isArray(hosts) || hosts.length === 0" class="text-center py-12">
      <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 max-w-md mx-auto">
        <Users class="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h4 class="text-xl font-bold text-slate-900 mb-2 leading-tight tracking-tight">
          No Hosts Yet
        </h4>
        <p class="text-lg text-slate-600 mb-6 leading-relaxed">
          Add speakers, hosts, and featured guests to showcase your event's lineup.
        </p>
        <button
          v-if="canEdit"
          @click="showCreateModal = true"
          class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-emerald-500/25 flex items-center space-x-2 mx-auto"
        >
          <Plus class="w-4 h-4" />
          <span>Add First Host</span>
        </button>
      </div>
    </div>

    <!-- Hosts Grid -->
    <div v-else class="space-y-4">
      <div ref="sortableContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <HostCard
          v-for="host in hosts"
          :key="host.id"
          :host="host"
          :can-edit="canEdit"
          :draggable="canEdit"
          @edit="editHost"
          @delete="deleteHost"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
          class="host-item"
          :data-id="host.id"
        />
      </div>
    </div>

    <!-- Create Modal -->
    <CreateHostModal
      v-if="showCreateModal"
      :event-id="eventId"
      @close="showCreateModal = false"
      @created="handleHostCreated"
    />

    <!-- Edit Modal -->
    <EditHostModal
      v-if="showEditModal && selectedHost"
      :event-id="eventId"
      :host="selectedHost"
      @close="showEditModal = false"
      @updated="handleHostUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="deleting"
      title="Delete Host"
      :item-name="hostToDelete?.name"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Plus, Users, AlertCircle, Trash2 } from 'lucide-vue-next'
import { hostsService, type EventHost } from '../services/api'
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
const error = ref<string | null>(null)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedHost = ref<EventHost | null>(null)
const hostToDelete = ref<EventHost | null>(null)
const deleting = ref(false)

// Drag and drop state
const draggedHost = ref<EventHost | null>(null)

// Methods
const fetchHosts = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await hostsService.getHosts(props.eventId)
    if (response.success && response.data) {
      // Handle paginated response format
      if (response.data.results && Array.isArray(response.data.results)) {
        hosts.value = response.data.results
      } else if (Array.isArray(response.data)) {
        // Fallback for direct array response
        hosts.value = response.data
      } else {
        hosts.value = []
      }
    } else {
      error.value = response.message || 'Failed to load hosts'
      hosts.value = []
    }
  } catch (err) {
    error.value = 'Network error while loading hosts'
    hosts.value = []
  } finally {
    loading.value = false
  }
}

const editHost = (host: EventHost) => {
  selectedHost.value = host
  showEditModal.value = true
}

const deleteHost = (host: EventHost) => {
  hostToDelete.value = host
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!hostToDelete.value) return

  deleting.value = true
  try {
    const response = await hostsService.deleteHost(props.eventId, hostToDelete.value.id)
    if (response.success) {
      // Remove from array
      if (Array.isArray(hosts.value)) {
        hosts.value = hosts.value.filter((host) => host.id !== hostToDelete.value!.id)
      } else {
        hosts.value = []
      }
      showDeleteModal.value = false
      hostToDelete.value = null
    } else {
      error.value = response.message || 'Failed to delete host'
    }
  } catch (err) {
    error.value = 'Network error while deleting host'
  } finally {
    deleting.value = false
  }
}

const handleHostCreated = (newHost: EventHost) => {
  if (Array.isArray(hosts.value)) {
    hosts.value.push(newHost)
  } else {
    hosts.value = [newHost]
  }
  showCreateModal.value = false
}

const handleHostUpdated = (updatedHost: EventHost) => {
  if (Array.isArray(hosts.value)) {
    const index = hosts.value.findIndex((host) => host.id === updatedHost.id)
    if (index !== -1) {
      hosts.value[index] = updatedHost
    }
  } else {
    hosts.value = [updatedHost]
  }
  showEditModal.value = false
  selectedHost.value = null
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
      await fetchHosts()
      error.value = response.message || 'Failed to reorder hosts'
    } else {
      // Force a refresh from server to ensure UI is in sync
      setTimeout(async () => {
        await fetchHosts()
      }, 100)
    }
  } catch (err) {
    // Rollback on failure
    await fetchHosts()
    error.value = 'Network error while reordering hosts'
  } finally {
    draggedHost.value = null
  }
}

// Lifecycle
onMounted(() => {
  fetchHosts()
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.host-item {
  transition: transform 0.2s ease;
}

.host-item.dragging {
  transform: rotate(2deg) scale(1.02);
  z-index: 10;
}
</style>
