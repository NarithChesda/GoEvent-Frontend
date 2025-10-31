<template>
  <div class="space-y-6">
    <!-- Header with Add Group Button -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Guest Groups</h3>
        <p class="text-sm text-slate-500 mt-1">Create and manage guest groups for better organization</p>
      </div>
      <button
        @click="showAddGroupModal = true"
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
        @click="showAddGroupModal = true"
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

    <!-- Add/Edit Group Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAddGroupModal"
          class="fixed inset-0 z-50 overflow-y-auto"
          @click.self="closeModal"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

          <div class="flex min-h-full items-center justify-center p-4">
            <div
              ref="addModalRef"
              role="dialog"
              aria-labelledby="add-group-modal-title"
              aria-modal="true"
              class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
              @click.stop
            >
              <!-- Header -->
              <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Users class="w-4.5 h-4.5" />
                    </div>
                    <h2 id="add-group-modal-title" class="text-lg sm:text-xl font-semibold text-slate-900">
                      {{ editingGroup ? 'Edit Group' : 'Create Group' }}
                    </h2>
                  </div>
                  <button
                    @click="closeModal"
                    aria-label="Close dialog"
                    class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Form -->
              <form @submit.prevent="handleSubmit" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                <!-- Error Message -->
                <div v-if="formError" class="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p class="text-sm text-red-600">{{ formError }}</p>
                </div>

                <!-- Group Name -->
                <div>
                  <label for="group-name" class="block text-sm font-medium text-slate-700 mb-2">
                    Group Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="group-name"
                    type="text"
                    v-model="formData.name"
                    placeholder="E.g., Family, Friends, Colleagues..."
                    maxlength="100"
                    aria-required="true"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                    required
                  />
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    v-model="formData.description"
                    rows="3"
                    placeholder="Describe this group of guests..."
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
                  ></textarea>
                </div>

                <!-- Color Picker -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Color</label>
                  <div class="grid grid-cols-8 gap-2">
                    <button
                      v-for="color in colorOptions"
                      :key="color"
                      type="button"
                      @click="formData.color = color"
                      :class="[
                        'w-10 h-10 rounded-lg transition-all',
                        formData.color === color ? 'ring-2 ring-sky-500 ring-offset-2 scale-110' : 'hover:scale-105'
                      ]"
                      :style="{ backgroundColor: color }"
                    ></button>
                  </div>
                  <div class="flex items-center gap-2 mt-3">
                    <input
                      type="text"
                      v-model="formData.color"
                      placeholder="#3498db"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                    />
                    <div class="w-10 h-10 rounded-lg border-2 border-slate-200" :style="{ backgroundColor: formData.color }"></div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                  <button
                    type="button"
                    @click="closeModal"
                    class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    :disabled="submitting"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    :disabled="submitting"
                  >
                    <span
                      v-if="submitting"
                      class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                    ></span>
                    {{ submitting ? 'Saving...' : (editingGroup ? 'Update Group' : 'Create Group') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
import { ref, watch, nextTick } from 'vue'
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  X,
  Info,
  AlertCircle,
  Check,
} from 'lucide-vue-next'
import type { GuestGroup } from '@/services/api'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'

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
const showAddGroupModal = ref(false)
const showSuccessToast = ref(false)
const successMessage = ref('')
const submitting = ref(false)
const editingGroup = ref<GuestGroup | null>(null)
const deletingGroup = ref<GuestGroup | null>(null)
const formError = ref<string | null>(null)

// Focus trap for modals (accessibility)
const addModalRef = ref<HTMLElement>()
const { activate: activateAddModal, deactivate: deactivateAddModal } = useFocusTrap(addModalRef, {
  immediate: false,
  escapeDeactivates: true
})

const formData = ref({
  name: '',
  description: '',
  color: '#3498db'
})

const colorOptions = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#9b59b6', // Purple
  '#f1c40f', // Yellow
  '#e67e22', // Orange
  '#1abc9c', // Turquoise
  '#2ecc71', // Green
  '#95a5a6', // Gray
  '#34495e', // Dark Blue
  '#e91e63', // Pink
  '#00bcd4', // Cyan
  '#ff9800', // Amber
  '#8bc34a', // Light Green
  '#ff5722', // Deep Orange
  '#607d8b', // Blue Gray
  '#673ab7', // Deep Purple
]

// Activate/deactivate focus trap when modals open/close
watch(showAddGroupModal, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    activateAddModal()
  } else {
    deactivateAddModal()
  }
})

const showSuccess = (message: string) => {
  successMessage.value = message
  showSuccessToast.value = true
  setTimeout(() => {
    showSuccessToast.value = false
  }, 3000)
}

const closeModal = () => {
  showAddGroupModal.value = false
  editingGroup.value = null
  formError.value = null
  formData.value = {
    name: '',
    description: '',
    color: '#3498db'
  }
}

const editGroup = (group: GuestGroup) => {
  editingGroup.value = group
  formData.value = {
    name: group.name,
    description: group.description || '',
    color: group.color
  }
  showAddGroupModal.value = true
}

const handleSubmit = async () => {
  const isEditing = !!editingGroup.value
  formError.value = null
  submitting.value = true

  try {
    const requestData = {
      name: formData.value.name,
      description: formData.value.description || undefined,
      color: formData.value.color,
    }

    if (isEditing && editingGroup.value) {
      emit('update-group', editingGroup.value.id, requestData)
      showSuccess('Group updated successfully!')
    } else {
      emit('create-group', requestData)
      showSuccess('Group created successfully!')
    }

    closeModal()
  } catch (err) {
    formError.value = isEditing ? 'Failed to update group' : 'Failed to create group'
    console.error('Error saving group:', err)
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
    showAddGroupModal.value = true
  }
})
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

/* Custom scrollbar for modal content */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

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
