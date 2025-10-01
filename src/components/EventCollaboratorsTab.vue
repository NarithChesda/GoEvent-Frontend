<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          Team Collaboration
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">Manage your event collaborators and team members</p>
      </div>
      <button
        v-if="canInvite"
        @click="showInviteModal = true"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center text-sm sm:text-base"
      >
        <UserPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        <span class="hidden sm:inline">Invite Collaborator</span>
        <span class="sm:hidden">Invite</span>
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4">
        <div class="flex items-center space-x-2 sm:space-x-3">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Crown class="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          </div>
          <div>
            <p class="text-lg sm:text-2xl font-bold text-slate-900">1</p>
            <p class="text-xs sm:text-sm text-slate-600">Organizer</p>
          </div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4">
        <div class="flex items-center space-x-2 sm:space-x-3">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#B0E0E6] flex items-center justify-center">
            <Users class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff]" />
          </div>
          <div>
            <p class="text-lg sm:text-2xl font-bold text-slate-900">{{ collaborators.length }}</p>
            <p class="text-xs sm:text-sm text-slate-600">Collaborators</p>
          </div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4">
        <div class="flex items-center space-x-2 sm:space-x-3">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle class="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          </div>
          <div>
            <p class="text-lg sm:text-2xl font-bold text-slate-900">{{ acceptedCount }}</p>
            <p class="text-xs sm:text-sm text-slate-600">Accepted</p>
          </div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4">
        <div class="flex items-center space-x-2 sm:space-x-3">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
          </div>
          <div>
            <p class="text-lg sm:text-2xl font-bold text-slate-900">{{ pendingCount }}</p>
            <p class="text-xs sm:text-sm text-slate-600">Pending</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Organizer Card -->
    <div
      v-if="organizerDetails"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6"
    >
      <h3 class="text-base sm:text-lg font-bold text-slate-900 mb-3 sm:mb-4 flex items-center">
        <Crown class="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-1.5 sm:mr-2" />
        Event Organizer
      </h3>
      <div class="flex items-center space-x-3 sm:space-x-4">
        <div
          class="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-sky-600 flex items-center justify-center"
        >
          <img
            v-if="organizerDetails.profile_picture"
            :src="getMediaUrl(organizerDetails.profile_picture)"
            :alt="organizerDetails.first_name + ' ' + organizerDetails.last_name"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-white text-base sm:text-lg font-bold">
            {{ getInitials(organizerDetails.first_name, organizerDetails.last_name) }}
          </span>
        </div>
        <div class="flex-1">
          <h4 class="text-base sm:text-lg font-semibold text-slate-800">
            {{ organizerDetails.first_name }} {{ organizerDetails.last_name }}
          </h4>
          <p class="text-xs sm:text-sm text-slate-600">@{{ organizerDetails.username }}</p>
          <p class="text-xs sm:text-sm text-slate-500">{{ organizerDetails.email }}</p>
          <span
            class="inline-block mt-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-medium rounded-full"
          >
            Organizer
          </span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Loading collaborators...</span>
      </div>
    </div>

    <!-- Collaborators List -->
    <div
      v-else-if="collaborators.length > 0"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6"
    >
      <div class="flex items-center justify-between mb-3 sm:mb-4">
        <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center">
          <Users class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] mr-1.5 sm:mr-2" />
          Collaborators ({{ collaborators.length }})
        </h3>
        <p v-if="canUpdateRole" class="text-[10px] sm:text-xs text-slate-500 italic">Click role badges to edit</p>
      </div>
      <div class="space-y-3 sm:space-y-4">
        <div
          v-for="collaborator in collaborators"
          :key="collaborator.id"
          class="flex items-center justify-between p-3 sm:p-4 bg-slate-50/50 rounded-xl sm:rounded-2xl hover:bg-slate-100/50 transition-colors duration-200"
        >
          <div class="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <div
              class="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-sky-600 flex items-center justify-center flex-shrink-0"
            >
              <img
                v-if="collaborator.user_details?.profile_picture"
                :src="getMediaUrl(collaborator.user_details.profile_picture)"
                :alt="
                  collaborator.user_details.first_name + ' ' + collaborator.user_details.last_name
                "
                class="w-full h-full object-cover"
              />
              <span v-else class="text-white text-xs sm:text-sm font-bold">
                {{
                  getInitials(
                    collaborator.user_details?.first_name || '',
                    collaborator.user_details?.last_name || collaborator.email.charAt(0),
                  )
                }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm sm:text-base font-semibold text-slate-800 truncate">
                <span v-if="collaborator.user_details">
                  {{ collaborator.user_details.first_name }}
                  {{ collaborator.user_details.last_name }}
                </span>
                <span v-else class="text-slate-500">{{ collaborator.email }}</span>
              </h4>
              <p class="text-xs sm:text-sm text-slate-600 truncate">
                <span v-if="collaborator.user_details">
                  @{{ collaborator.user_details.username }}
                </span>
                <span v-else>{{ collaborator.email }}</span>
              </p>
              <p class="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
                Invited by {{ collaborator.invited_by_name }} •
                {{ formatDate(collaborator.invited_at) }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div class="text-center">
              <!-- Role Selection or Display -->
              <div v-if="canUpdateRole && editingRole === collaborator.id" class="min-w-[80px] sm:min-w-[100px]">
                <select
                  v-model="tempRole"
                  @change="saveRoleUpdate(collaborator)"
                  @blur="cancelRoleEdit"
                  @keydown.escape="cancelRoleEdit"
                  class="px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full border border-slate-300 focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent bg-white"
                  :class="
                    getRoleColor(tempRole)
                      .replace('bg-', 'bg-opacity-20 bg-')
                      .replace('text-', 'text-')
                  "
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div v-else class="min-w-[80px] sm:min-w-[100px]">
                <button
                  v-if="canUpdateRole"
                  @click="startRoleEdit(collaborator)"
                  class="inline-block px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full hover:ring-2 hover:ring-[#5eb3f6] transition-all duration-200"
                  :class="getRoleColor(collaborator.role)"
                  title="Click to change role"
                >
                  {{ collaborator.role }}
                </button>
                <span
                  v-else
                  class="inline-block px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full"
                  :class="getRoleColor(collaborator.role)"
                >
                  {{ collaborator.role }}
                </span>
              </div>
              <p
                class="text-[10px] sm:text-xs mt-0.5 sm:mt-1"
                :class="collaborator.is_accepted ? 'text-green-600' : 'text-orange-600'"
              >
                {{ collaborator.is_accepted ? 'Accepted' : 'Pending' }}
              </p>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center space-x-1 sm:space-x-2">
              <!-- Save/Cancel buttons for role editing -->
              <div v-if="editingRole === collaborator.id" class="flex items-center space-x-1">
                <button
                  @click="saveRoleUpdate(collaborator)"
                  :disabled="isUpdatingRole"
                  class="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-all duration-200 disabled:opacity-50"
                  title="Save role change"
                >
                  <CheckCircle class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  @click="cancelRoleEdit"
                  class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-all duration-200"
                  title="Cancel"
                >
                  <X class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              <!-- Remove button - only show for organizers/admins -->
              <button
                v-if="canRemoveCollaborator && editingRole !== collaborator.id"
                @click="confirmRemoveCollaborator(collaborator)"
                class="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Remove collaborator"
              >
                <Trash2 class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
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
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">No Collaborators Yet</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">
        Start building your team by inviting collaborators to help manage this event.
      </p>
      <button
        v-if="canInvite"
        @click="showInviteModal = true"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center mx-auto text-sm sm:text-base"
      >
        <UserPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Invite Your First Collaborator
      </button>
    </div>

    <!-- Collaboration Permissions Info -->
    <div
      class="bg-gradient-to-br from-emerald-50 to-sky-50 border border-[#87CEEB]/50 rounded-3xl p-4 sm:p-6"
    >
      <div class="flex items-center justify-between mb-3 sm:mb-4">
        <h3 class="text-sm sm:text-base font-bold text-slate-900 flex items-center">
          <Shield class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] mr-1.5 sm:mr-2" />
          Collaboration Roles
        </h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
        <div class="bg-white/70 rounded-lg sm:rounded-xl p-2 sm:p-3">
          <div class="flex items-center mb-0.5 sm:mb-1">
            <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full mr-1.5 sm:mr-2"></div>
            <span class="text-xs sm:text-sm font-semibold text-slate-700">Admin</span>
          </div>
          <p class="text-[10px] sm:text-xs text-slate-600">Full permissions, can invite other collaborators</p>
        </div>
        <div class="bg-white/70 rounded-lg sm:rounded-xl p-2 sm:p-3">
          <div class="flex items-center mb-0.5 sm:mb-1">
            <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#E6F4FF]0 rounded-full mr-1.5 sm:mr-2"></div>
            <span class="text-xs sm:text-sm font-semibold text-slate-700">Editor</span>
          </div>
          <p class="text-[10px] sm:text-xs text-slate-600">Can edit event details and manage content</p>
        </div>
        <div class="bg-white/70 rounded-lg sm:rounded-xl p-2 sm:p-3">
          <div class="flex items-center mb-0.5 sm:mb-1">
            <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-1.5 sm:mr-2"></div>
            <span class="text-xs sm:text-sm font-semibold text-slate-700">Viewer</span>
          </div>
          <p class="text-[10px] sm:text-xs text-slate-600">Read-only access to event information</p>
        </div>
      </div>
    </div>

    <!-- Invite Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showInviteModal"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          @click="closeInviteModal"
        >
          <div
            class="bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 sm:px-8 py-4 sm:py-6 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 sm:space-x-3">
                  <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <UserPlus class="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h2 class="text-lg sm:text-2xl font-bold">Invite Collaborator</h2>
                </div>
                <button
                  @click="closeInviteModal"
                  class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="p-4 sm:p-8">
              <form @submit.prevent="inviteCollaborator">
                <div class="space-y-4 sm:space-y-6">
                  <div>
                    <label class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2"
                      >Email Address</label
                    >
                    <input
                      v-model="inviteForm.email"
                      type="email"
                      required
                      class="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      placeholder="collaborator@example.com"
                    />
                  </div>

                  <div>
                    <label class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">Role</label>
                    <select
                      v-model="inviteForm.role"
                      class="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    >
                      <option value="viewer">Viewer - Read-only access</option>
                      <option value="editor">Editor - Can edit event details</option>
                      <option value="admin">Admin - Full permissions</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2"
                      >Message (Optional)</label
                    >
                    <textarea
                      v-model="inviteForm.message"
                      rows="3"
                      class="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                      placeholder="Add a personal message to your invitation..."
                    ></textarea>
                  </div>
                </div>

                <div class="flex space-x-3 sm:space-x-4 pt-4 sm:pt-6">
                  <button
                    type="button"
                    @click="closeInviteModal"
                    class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    :disabled="isInviting"
                    class="flex-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
      :item-name="
        collaboratorToRemove
          ? collaboratorToRemove.user_details
            ? `${collaboratorToRemove.user_details.first_name} ${collaboratorToRemove.user_details.last_name}`
            : collaboratorToRemove.email
          : ''
      "
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
  Trash2,
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
  message: '',
})

// Computed
const canInvite = computed(() => {
  // Organizers and admin collaborators can invite
  return (
    props.canEdit || (props.organizerDetails && authStore.user?.id === props.organizerDetails.id)
  )
})

const canRemoveCollaborator = computed(() => {
  // Organizers and admin collaborators can remove collaborators
  return (
    props.canEdit || (props.organizerDetails && authStore.user?.id === props.organizerDetails.id)
  )
})

const canUpdateRole = computed(() => {
  // Organizers and admin collaborators can update roles
  return (
    props.canEdit || (props.organizerDetails && authStore.user?.id === props.organizerDetails.id)
  )
})

const acceptedCount = computed(() => collaborators.value.filter((c) => c.is_accepted).length)

const pendingCount = computed(() => collaborators.value.filter((c) => !c.is_accepted).length)

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
      message: inviteForm.value.message || undefined,
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
    message: '',
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
      collaboratorId: collaboratorToRemove.value.id,
    })

    const response = await eventsService.removeCollaborator(
      props.eventId,
      collaboratorToRemove.value.id,
    )

    if (response.success) {
      showMessage('success', 'Collaborator removed successfully!')
      // Remove from local list
      collaborators.value = collaborators.value.filter(
        (c) => c.id !== collaboratorToRemove.value!.id,
      )
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
      newRole: tempRole.value,
    })

    const response = await eventsService.updateCollaborator(props.eventId, collaborator.id, {
      role: tempRole.value,
    })

    if (response.success && response.data) {
      showMessage('success', `Role updated to ${tempRole.value}`)
      // Update the collaborator in the local list
      const index = collaborators.value.findIndex((c) => c.id === collaborator.id)
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
      return 'bg-[#B0E0E6] text-[#1873cc]'
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
    day: 'numeric',
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
