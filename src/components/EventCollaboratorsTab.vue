<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Team Collaboration</h2>
        <p class="text-sm text-slate-600 mt-1">Manage your event collaborators and team members</p>
      </div>
      <button
        v-if="canInvite"
        @click="showInviteModal = true"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 flex items-center"
      >
        <UserPlus class="w-4 h-4 mr-2" />
        Invite Collaborator
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Crown class="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-900">1</p>
            <p class="text-sm text-slate-600">Organizer</p>
          </div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Users class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-900">{{ collaborators.length }}</p>
            <p class="text-sm text-slate-600">Collaborators</p>
          </div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-900">{{ acceptedCount }}</p>
            <p class="text-sm text-slate-600">Accepted</p>
          </div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Clock class="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-slate-900">{{ pendingCount }}</p>
            <p class="text-sm text-slate-600">Pending</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Organizer Card -->
    <div v-if="organizerDetails" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6">
      <h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center">
        <Crown class="w-5 h-5 text-purple-600 mr-2" />
        Event Organizer
      </h3>
      <div class="flex items-center space-x-4">
        <div class="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
          <img
            v-if="organizerDetails.profile_picture"
            :src="getMediaUrl(organizerDetails.profile_picture)"
            :alt="organizerDetails.first_name + ' ' + organizerDetails.last_name"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-white text-lg font-bold">
            {{ getInitials(organizerDetails.first_name, organizerDetails.last_name) }}
          </span>
        </div>
        <div class="flex-1">
          <h4 class="text-lg font-semibold text-slate-800">
            {{ organizerDetails.first_name }} {{ organizerDetails.last_name }}
          </h4>
          <p class="text-sm text-slate-600">@{{ organizerDetails.username }}</p>
          <p class="text-sm text-slate-500">{{ organizerDetails.email }}</p>
          <span class="inline-block mt-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
            Organizer
          </span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8">
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-slate-600">Loading collaborators...</span>
      </div>
    </div>

    <!-- Collaborators List -->
    <div v-else-if="collaborators.length > 0" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-slate-900 flex items-center">
          <Users class="w-5 h-5 text-blue-600 mr-2" />
          Collaborators ({{ collaborators.length }})
        </h3>
        <p v-if="canUpdateRole" class="text-xs text-slate-500 italic">Click role badges to edit</p>
      </div>
      <div class="space-y-4">
        <div
          v-for="collaborator in collaborators"
          :key="collaborator.id"
          class="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-slate-100/50 transition-colors duration-200"
        >
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <img
                v-if="collaborator.user_details?.profile_picture"
                :src="getMediaUrl(collaborator.user_details.profile_picture)"
                :alt="collaborator.user_details.first_name + ' ' + collaborator.user_details.last_name"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-white text-sm font-bold">
                {{ getInitials(collaborator.user_details?.first_name || '', collaborator.user_details?.last_name || collaborator.email.charAt(0)) }}
              </span>
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-slate-800">
                <span v-if="collaborator.user_details">
                  {{ collaborator.user_details.first_name }} {{ collaborator.user_details.last_name }}
                </span>
                <span v-else class="text-slate-500">{{ collaborator.email }}</span>
              </h4>
              <p class="text-sm text-slate-600">
                <span v-if="collaborator.user_details">
                  @{{ collaborator.user_details.username }}
                </span>
                <span v-else>{{ collaborator.email }}</span>
              </p>
              <p class="text-xs text-slate-500 mt-1">
                Invited by {{ collaborator.invited_by_name }} • {{ formatDate(collaborator.invited_at) }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <div class="text-center">
              <!-- Role Selection or Display -->
              <div v-if="canUpdateRole && editingRole === collaborator.id" class="min-w-[100px]">
                <select
                  v-model="tempRole"
                  @change="saveRoleUpdate(collaborator)"
                  @blur="cancelRoleEdit"
                  @keydown.escape="cancelRoleEdit"
                  class="px-2 py-1 text-xs font-medium rounded-full border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  :class="getRoleColor(tempRole).replace('bg-', 'bg-opacity-20 bg-').replace('text-', 'text-')"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div v-else class="min-w-[100px]">
                <button
                  v-if="canUpdateRole"
                  @click="startRoleEdit(collaborator)"
                  class="inline-block px-3 py-1 text-xs font-medium rounded-full hover:ring-2 hover:ring-blue-300 transition-all duration-200"
                  :class="getRoleColor(collaborator.role)"
                  title="Click to change role"
                >
                  {{ collaborator.role }}
                </button>
                <span
                  v-else
                  class="inline-block px-3 py-1 text-xs font-medium rounded-full"
                  :class="getRoleColor(collaborator.role)"
                >
                  {{ collaborator.role }}
                </span>
              </div>
              <p class="text-xs mt-1" :class="collaborator.is_accepted ? 'text-green-600' : 'text-orange-600'">
                {{ collaborator.is_accepted ? 'Accepted' : 'Pending' }}
              </p>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center space-x-2">
              <!-- Save/Cancel buttons for role editing -->
              <div v-if="editingRole === collaborator.id" class="flex items-center space-x-1">
                <button
                  @click="saveRoleUpdate(collaborator)"
                  :disabled="isUpdatingRole"
                  class="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-all duration-200 disabled:opacity-50"
                  title="Save role change"
                >
                  <CheckCircle class="w-3 h-3" />
                </button>
                <button
                  @click="cancelRoleEdit"
                  class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-all duration-200"
                  title="Cancel"
                >
                  <X class="w-3 h-3" />
                </button>
              </div>

              <!-- Remove button - only show for organizers/admins -->
              <button
                v-if="canRemoveCollaborator && editingRole !== collaborator.id"
                @click="confirmRemoveCollaborator(collaborator)"
                class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Remove collaborator"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12 text-center">
      <Users class="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-slate-900 mb-2">No Collaborators Yet</h3>
      <p class="text-slate-600 mb-6">Start building your team by inviting collaborators to help manage this event.</p>
      <button
        v-if="canInvite"
        @click="showInviteModal = true"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 flex items-center mx-auto"
      >
        <UserPlus class="w-4 h-4 mr-2" />
        Invite Your First Collaborator
      </button>
    </div>

    <!-- Collaboration Permissions Info -->
    <div class="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200/50 rounded-3xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-slate-900 flex items-center">
          <Shield class="w-5 h-5 text-blue-600 mr-2" />
          Collaboration Roles
        </h3>

      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white/70 rounded-2xl p-4">
          <div class="flex items-center mb-2">
            <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span class="font-semibold text-slate-900">Admin</span>
          </div>
          <p class="text-sm text-slate-600">Full permissions, can invite other collaborators</p>
        </div>
        <div class="bg-white/70 rounded-2xl p-4">
          <div class="flex items-center mb-2">
            <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span class="font-semibold text-slate-900">Editor</span>
          </div>
          <p class="text-sm text-slate-600">Can edit event details and manage content</p>
        </div>
        <div class="bg-white/70 rounded-2xl p-4">
          <div class="flex items-center mb-2">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span class="font-semibold text-slate-900">Viewer</span>
          </div>
          <p class="text-sm text-slate-600">Read-only access to event information</p>
        </div>
      </div>
    </div>

    <!-- Invite Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showInviteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" @click="closeInviteModal">
          <div 
            class="bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <UserPlus class="w-5 h-5" />
                  </div>
                  <h2 class="text-2xl font-bold">Invite Collaborator</h2>
                </div>
                <button
                  @click="closeInviteModal"
                  class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="p-8">

              <form @submit.prevent="inviteCollaborator">
                <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input
                  v-model="inviteForm.email"
                  type="email"
                  required
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  placeholder="collaborator@example.com"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <select
                  v-model="inviteForm.role"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                >
                  <option value="viewer">Viewer - Read-only access</option>
                  <option value="editor">Editor - Can edit event details</option>
                  <option value="admin">Admin - Full permissions</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Message (Optional)</label>
                <textarea
                  v-model="inviteForm.message"
                  rows="3"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                  placeholder="Add a personal message to your invitation..."
                ></textarea>
              </div>
            </div>

                <div class="flex space-x-4 pt-6">
                  <button
                    type="button"
                    @click="closeInviteModal"
                    class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="isInviting"
                    class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ isInviting ? 'Inviting...' : 'Send Invitation' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Remove Confirmation Modal -->
    <DeleteConfirmModal
      :show="showRemoveModal"
      :loading="isRemoving"
      title="Remove Collaborator"
      :item-name="collaboratorToRemove ? (collaboratorToRemove.user_details ? `${collaboratorToRemove.user_details.first_name} ${collaboratorToRemove.user_details.last_name}` : collaboratorToRemove.email) : ''"
      message="They will lose access to manage this event."
      @confirm="removeCollaborator"
      @cancel="closeRemoveModal"
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
import { ref, computed, onMounted } from 'vue'
import {
  Users,
  UserPlus,
  Crown,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  X,
  Trash2
} from 'lucide-vue-next'
import { eventsService, type EventCollaborator } from '../services/api'
import { useAuthStore } from '../stores/auth'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventId: string
  canEdit: boolean
  organizerDetails?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    profile_picture: string | null
  }
}

const props = defineProps<Props>()
const authStore = useAuthStore()

// State
const collaborators = ref<EventCollaborator[]>([])
const loading = ref(false)
const showInviteModal = ref(false)
const showRemoveModal = ref(false)
const isInviting = ref(false)
const isRemoving = ref(false)
const isUpdatingRole = ref(false)
const editingRole = ref<number | null>(null)
const tempRole = ref<'admin' | 'editor' | 'viewer'>('editor')
const collaboratorToRemove = ref<EventCollaborator | null>(null)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
// All CRUD endpoints are now working - no need to track availability

const inviteForm = ref({
  email: '',
  role: 'editor' as 'admin' | 'editor' | 'viewer',
  message: ''
})

// Computed
const canInvite = computed(() => {
  // Organizers and admin collaborators can invite
  return props.canEdit || (props.organizerDetails && authStore.user?.id === props.organizerDetails.id)
})

const canRemoveCollaborator = computed(() => {
  // Organizers and admin collaborators can remove collaborators
  return props.canEdit || (props.organizerDetails && authStore.user?.id === props.organizerDetails.id)
})

const canUpdateRole = computed(() => {
  // Organizers and admin collaborators can update roles
  return props.canEdit || (props.organizerDetails && authStore.user?.id === props.organizerDetails.id)
})

const acceptedCount = computed(() =>
  collaborators.value.filter(c => c.is_accepted).length
)

const pendingCount = computed(() =>
  collaborators.value.filter(c => !c.is_accepted).length
)

// Methods
const loadCollaborators = async () => {
  loading.value = true
  try {
    const response = await eventsService.getCollaborators(props.eventId)
    if (response.success && response.data) {
      collaborators.value = response.data
    } else {
      showMessage('error', response.message || 'Failed to load collaborators')
    }
  } catch (error) {
    console.error('Error loading collaborators:', error)
    showMessage('error', 'An error occurred while loading collaborators')
  } finally {
    loading.value = false
  }
}

const inviteCollaborator = async () => {
  if (!inviteForm.value.email) return

  isInviting.value = true
  try {
    const response = await eventsService.inviteCollaborator(props.eventId, {
      email: inviteForm.value.email,
      role: inviteForm.value.role,
      message: inviteForm.value.message || undefined
    })

    if (response.success && response.data) {
      showMessage('success', 'Collaborator invited successfully!')
      collaborators.value.push(response.data)
      closeInviteModal()
    } else {
      showMessage('error', response.message || 'Failed to invite collaborator')
    }
  } catch (error) {
    console.error('Error inviting collaborator:', error)
    showMessage('error', 'An error occurred while sending the invitation')
  } finally {
    isInviting.value = false
  }
}

const closeInviteModal = () => {
  showInviteModal.value = false
  inviteForm.value = {
    email: '',
    role: 'editor',
    message: ''
  }
}

const confirmRemoveCollaborator = (collaborator: EventCollaborator) => {
  collaboratorToRemove.value = collaborator
  showRemoveModal.value = true
}

const closeRemoveModal = () => {
  showRemoveModal.value = false
  collaboratorToRemove.value = null
}

const removeCollaborator = async () => {
  if (!collaboratorToRemove.value) return

  isRemoving.value = true
  try {
    console.log('Attempting to remove collaborator:', {
      eventId: props.eventId,
      collaboratorId: collaboratorToRemove.value.id
    })

    const response = await eventsService.removeCollaborator(props.eventId, collaboratorToRemove.value.id)

    if (response.success) {
      showMessage('success', 'Collaborator removed successfully!')
      // Remove from local list
      collaborators.value = collaborators.value.filter(c => c.id !== collaboratorToRemove.value!.id)
      closeRemoveModal()
    } else {
      console.error('Remove collaborator API response:', response)
      showMessage('error', response.message || 'Failed to remove collaborator')
    }
  } catch (error) {
    console.error('Error removing collaborator:', error)
    showMessage('error', 'Failed to remove collaborator. Please try again.')
  } finally {
    isRemoving.value = false
  }
}

const startRoleEdit = (collaborator: EventCollaborator) => {
  editingRole.value = collaborator.id
  tempRole.value = collaborator.role
}

const cancelRoleEdit = () => {
  editingRole.value = null
  tempRole.value = 'editor'
}

const saveRoleUpdate = async (collaborator: EventCollaborator) => {
  if (tempRole.value === collaborator.role) {
    cancelRoleEdit()
    return
  }

  isUpdatingRole.value = true
  try {
    console.log('Attempting to update collaborator:', {
      eventId: props.eventId,
      collaboratorId: collaborator.id,
      newRole: tempRole.value
    })

    const response = await eventsService.updateCollaborator(props.eventId, collaborator.id, {
      role: tempRole.value
    })

    if (response.success && response.data) {
      showMessage('success', `Role updated to ${tempRole.value}`)
      // Update the collaborator in the local list
      const index = collaborators.value.findIndex(c => c.id === collaborator.id)
      if (index !== -1) {
        collaborators.value[index] = response.data
      }
      cancelRoleEdit()
    } else {
      console.error('Update collaborator API response:', response)
      showMessage('error', response.message || 'Failed to update collaborator role')
    }
  } catch (error) {
    console.error('Error updating collaborator role:', error)
    showMessage('error', 'Failed to update collaborator role. Please try again.')
  } finally {
    isUpdatingRole.value = false
  }
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-700'
    case 'editor':
      return 'bg-blue-100 text-blue-700'
    case 'viewer':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}

const getMediaUrl = (mediaUrl: string | null): string | undefined => {
  if (!mediaUrl) return undefined

  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl
  }

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (mediaUrl.startsWith('/')) {
    return `${API_BASE_URL}${mediaUrl}`
  }

  return `${API_BASE_URL}/media/${mediaUrl}`
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Lifecycle
onMounted(() => {
  loadCollaborators()
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

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: all 0.3s ease;
  transform-origin: center;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}
</style>
