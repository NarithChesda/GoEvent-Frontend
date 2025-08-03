<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Hosts & Speakers</h2>
        <p class="text-sm text-slate-600 mt-1">Manage event hosts, speakers, and moderators</p>
      </div>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 flex items-center"
      >
        <UserPlus class="w-4 h-4 mr-2" />
        Add Host
      </button>
    </div>

    <!-- Stats Cards -->
    

    <!-- Loading State -->
    <div v-if="loading" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8">
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-slate-600">Loading hosts...</span>
      </div>
    </div>

    <!-- Hosts Grid -->
    <div v-else-if="hosts.length > 0" class="space-y-6">
      <!-- All Hosts -->
      <div class="space-y-4">
        <h3 class="text-lg font-bold text-slate-900 flex items-center">
          <Users class="w-5 h-5 text-purple-600 mr-2" />
          All Hosts ({{ hosts.length }})
        </h3>
        <div 
          ref="sortableContainer"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <HostCard
            v-for="host in hosts"
            :key="host.id"
            :host="host"
            :can-edit="canEdit"
            :draggable="canEdit"
            @edit="editHost"
            @delete="confirmDeleteHost"
            @drag-start="handleDragStart"
            @drag-end="handleDragEnd"
            class="host-item"
            :data-id="host.id"
          />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12 text-center">
      <Users class="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-slate-900 mb-2">No Hosts Added Yet</h3>
      <p class="text-slate-600 mb-6">Add hosts and speakers to showcase your event team.</p>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 flex items-center mx-auto"
      >
        <UserPlus class="w-4 h-4 mr-2" />
        Add Your First Host
      </button>
    </div>

    <!-- Host Roles Info -->
    <div class="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200/50 rounded-3xl p-6">
      <h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center">
        <Info class="w-5 h-5 text-blue-600 mr-2" />
        Host Roles
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white/70 rounded-2xl p-4">
          <div class="flex items-center mb-2">
            <Users class="w-5 h-5 text-purple-600 mr-2" />
            <span class="font-semibold text-slate-900">Host</span>
          </div>
          <p class="text-sm text-slate-600">Manages and facilitates the event</p>
        </div>
        <div class="bg-white/70 rounded-2xl p-4">
          <div class="flex items-center mb-2">
            <Users class="w-5 h-5 text-orange-600 mr-2" />
            <span class="font-semibold text-slate-900">Featured</span>
          </div>
          <p class="text-sm text-slate-600">Highlighted event personalities</p>
        </div>
      </div>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  Users,
  UserPlus,
  Shield,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-vue-next'
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
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const selectedHost = ref<EventHost | null>(null)
const hostToDelete = ref<EventHost | null>(null)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const draggedHost = ref<EventHost | null>(null)

// Host roles configuration
// Removed hostRoles array since we're no longer categorizing by roles

// Computed
const totalHosts = computed(() => hosts.value.length)

// Removed speakersCount since we removed the speakers section

const moderatorsCount = computed(() => 
  // Placeholder - no role field available yet
  0
)

const featuredCount = computed(() => 
  // Placeholder - no is_featured field available yet
  0
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
      hosts.value = hosts.value.filter(host => host.id !== hostToDelete.value!.id)
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
  const index = hosts.value.findIndex(host => host.id === updatedHost.id)
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
  const draggedIndex = hosts.value.findIndex(host => host.id === draggedHost.value!.id)
  const targetIndex = hosts.value.findIndex(host => host.id === targetHost.id)
  
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
    order: index
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
onMounted(() => {
  loadHosts()
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