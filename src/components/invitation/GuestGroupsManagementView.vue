<template>
  <div class="space-y-6">
    <!-- Header with Add Group Button -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Guest Groups</h3>
        <p class="text-sm text-slate-500 mt-1">Create and manage guest groups for better organization</p>
      </div>
      <button
        @click="showCreateGroupModal = true"
        class="hidden sm:flex flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 whitespace-nowrap"
      >
        <Plus class="w-4 h-4" />
        <span>Create Group</span>
      </button>
    </div>

    <!-- Info Banner -->
    <div class="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-4">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Info class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 class="font-semibold text-blue-900 mb-1">Event-Specific Groups</h4>
          <p class="text-sm text-blue-700">Groups you create here are specific to this event and help you organize your guests by family, friends, colleagues, etc.</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loadingGroups" class="flex justify-center items-center py-12">
      <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50/50 border border-red-200/50 rounded-2xl p-6">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertCircle class="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h4 class="font-semibold text-red-900 mb-1">Error Loading Groups</h4>
          <p class="text-sm text-red-700">{{ error }}</p>
          <button @click="emit('reload-groups')" class="mt-3 text-sm font-medium text-red-600 hover:text-red-700">
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Groups Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Group Cards -->
      <div
        v-for="group in groups"
        :key="group.id"
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 p-6 hover:shadow-xl transition-all duration-300 group"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
              :style="{ backgroundColor: `${group.color}20` }"
            >
              <Users class="w-6 h-6" :style="{ color: group.color }" />
            </div>
            <div>
              <h4 class="font-bold text-slate-900">{{ group.name }}</h4>
              <p class="text-xs text-slate-500">{{ group.guest_count }} {{ group.guest_count === 1 ? 'guest' : 'guests' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              @click="editGroup(group)"
              :aria-label="`Edit group: ${group.name}`"
              title="Edit group"
              class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <Edit2 class="w-4 h-4" />
            </button>
            <button
              @click="confirmDeleteGroup(group)"
              :aria-label="`Delete group: ${group.name}`"
              title="Delete group"
              class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p class="text-sm text-slate-600">{{ group.description || 'No description' }}</p>
        <div class="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
          <div class="w-4 h-4 rounded" :style="{ backgroundColor: group.color }"></div>
          <span class="text-xs text-slate-500">{{ group.color }}</span>
        </div>
      </div>

      <!-- Add Group Placeholder -->
      <div
        @click="showCreateGroupModal = true"
        class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-6 hover:bg-slate-100/50 hover:border-emerald-400 transition-all duration-300 cursor-pointer group min-h-[180px] flex items-center justify-center"
      >
        <div class="text-center">
          <div class="w-12 h-12 bg-slate-200 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all">
            <Plus class="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h4 class="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Create Group</h4>
          <p class="text-sm text-slate-400 mt-1">Add a new guest group</p>
        </div>
      </div>
    </div>

    <!-- Create Group Modal -->
    <CreateGroupModal
      :show="showCreateGroupModal"
      :is-creating="submitting"
      @close="showCreateGroupModal = false"
      @create="handleCreate"
    />

    <!-- Edit Group Modal -->
    <EditGroupModal
      :show="showEditGroupModal"
      :group="editingGroup"
      :is-updating="submitting"
      @close="closeEditModal"
      @update-group="handleUpdate"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="!!deletingGroup"
      :loading="submitting"
      title="Delete Group"
      :item-name="deletingGroup?.name"
      :warning-message="`This will delete all ${deletingGroup?.guest_count || 0} guests in this group!`"
      @confirm="handleDelete"
      @cancel="deletingGroup = null"
    />

    <!-- Success Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="showSuccessToast"
          class="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[200]"
        >
          <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <Check class="w-4 h-4" />
          </div>
          <span class="font-medium">{{ successMessage }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Info,
  AlertCircle,
  Check,
} from 'lucide-vue-next'
import type { GuestGroup } from '@/services/api'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import CreateGroupModal from './CreateGroupModal.vue'
import EditGroupModal from './EditGroupModal.vue'

interface Props {
  groups: GuestGroup[]
  loadingGroups: boolean
}

interface Emits {
  'create-group': [data: { name: string; description?: string; color: string }]
  'update-group': [groupId: number, data: { name: string; description?: string; color: string }]
  'delete-group': [groupId: number]
  'reload-groups': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const error = ref<string | null>(null)
const showCreateGroupModal = ref(false)
const showEditGroupModal = ref(false)
const showSuccessToast = ref(false)
const successMessage = ref('')
const submitting = ref(false)
const editingGroup = ref<GuestGroup | null>(null)
const deletingGroup = ref<GuestGroup | null>(null)

const showSuccess = (message: string) => {
  successMessage.value = message
  showSuccessToast.value = true
  setTimeout(() => {
    showSuccessToast.value = false
  }, 3000)
}

const editGroup = (group: GuestGroup) => {
  editingGroup.value = group
  showEditGroupModal.value = true
}

const closeEditModal = () => {
  showEditGroupModal.value = false
  editingGroup.value = null
}

const handleCreate = (data: { name: string; description?: string; color: string }) => {
  submitting.value = true
  try {
    emit('create-group', data)
    showSuccess('Group created successfully!')
    showCreateGroupModal.value = false
  } catch (err) {
    console.error('Error creating group:', err)
  } finally {
    submitting.value = false
  }
}

const handleUpdate = (groupId: number, data: { name: string; description?: string; color: string }) => {
  submitting.value = true
  try {
    emit('update-group', groupId, data)
    showSuccess('Group updated successfully!')
    showEditGroupModal.value = false
    editingGroup.value = null
  } catch (err) {
    console.error('Error updating group:', err)
  } finally {
    submitting.value = false
  }
}

const confirmDeleteGroup = (group: GuestGroup) => {
  deletingGroup.value = group
}

const handleDelete = async () => {
  if (!deletingGroup.value) return

  submitting.value = true
  const deletedName = deletingGroup.value.name

  try {
    emit('delete-group', deletingGroup.value.id)
    showSuccess('Group deleted successfully!')
    deletingGroup.value = null
  } catch (err) {
    error.value = `Failed to delete "${deletedName}"`
    console.error('Error deleting group:', err)
  } finally {
    submitting.value = false
  }
}

// Expose methods for parent component (Smart FAB)
defineExpose({
  openAddGroupModal: () => {
    showCreateGroupModal.value = true
  }
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}
</style>
