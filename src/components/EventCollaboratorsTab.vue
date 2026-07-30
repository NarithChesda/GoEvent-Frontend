<template>
  <div>
    <!-- Team Panel: stats + organizer + collaborators unified -->
    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
      <div class="flex items-center justify-between gap-3 mb-3">
        <div class="flex items-center gap-2 min-w-0">
          <h2 class="text-base font-semibold text-slate-900">{{ t('management.collaboratorsTab.team.title') }}</h2>
          <span class="text-sm font-normal text-slate-400">· {{ teamCount }}</span>
        </div>
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            @click="showRolesInfo = !showRolesInfo"
            class="p-1.5 text-slate-400 hover:text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors"
            :aria-label="t('management.collaboratorsTab.roles.title')"
            :aria-expanded="showRolesInfo"
          >
            <Shield class="w-4 h-4" />
          </button>
          <button
            v-if="canInvite"
            type="button"
            @click="toggleInviteForm"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full border border-dashed transition-all"
            :class="
              showInviteForm
                ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                : 'border-slate-300 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
            "
            :aria-expanded="showInviteForm"
            :aria-label="t('management.collaboratorsTab.inviteCollaborator')"
          >
            <X v-if="showInviteForm" class="w-3.5 h-3.5 flex-shrink-0" />
            <UserPlus v-else class="w-3.5 h-3.5 flex-shrink-0" />
            <span class="hidden sm:inline">
              {{ showInviteForm ? t('management.inviteDrawer.cancel') : t('management.collaboratorsTab.inviteCollaborator') }}
            </span>
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:flex sm:items-center gap-x-4 gap-y-2 sm:gap-y-1 text-xs sm:text-sm text-slate-600 pb-3 mb-3 border-b border-slate-100">
        <span class="inline-flex items-center gap-1.5">
          <Crown class="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
          <span class="font-semibold text-slate-900">1</span> {{ t('management.collaboratorsTab.stats.organizer') }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <Users class="w-3.5 h-3.5 text-[#1e90ff] flex-shrink-0" />
          <span class="font-semibold text-slate-900">{{ collaborators.length }}</span> {{ t('management.collaboratorsTab.stats.collaborators') }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <CheckCircle class="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
          <span class="font-semibold text-slate-900">{{ acceptedCount }}</span> {{ t('management.collaboratorsTab.stats.accepted') }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <Clock class="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
          <span class="font-semibold text-slate-900">{{ pendingCount }}</span> {{ t('management.collaboratorsTab.stats.pending') }}
        </span>
      </div>

      <!-- Inline Invite Form -->
      <Transition name="collapse">
        <div v-if="showInviteForm" class="grid grid-rows-[1fr] mb-3">
          <div class="min-h-0 overflow-hidden">
            <form
              @submit.prevent="submitInvite"
              class="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
            >
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label for="inviteEmail" class="block text-sm font-medium text-slate-700">
                    {{ t('management.inviteDrawer.email') }} <span class="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    @click="fillAdminHelp"
                    class="text-xs text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    <LifeBuoy class="w-3 h-3" />
                    {{ t('management.inviteDrawer.askAdminHelp') }}
                  </button>
                </div>
                <input
                  id="inviteEmail"
                  v-model="inviteEmail"
                  type="email"
                  required
                  :disabled="isInviting"
                  @blur="validateInviteEmail"
                  :placeholder="t('management.inviteDrawer.emailPlaceholder')"
                  :class="[
                    'w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 bg-white disabled:opacity-50',
                    inviteEmailError
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-slate-300 focus:ring-sky-200 focus:border-sky-400'
                  ]"
                />
                <p v-if="inviteEmailError" class="mt-1.5 text-xs text-red-600">{{ inviteEmailError }}</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="inviteRole" class="block text-sm font-medium text-slate-700 mb-1.5">
                    {{ t('management.inviteDrawer.role') }}
                  </label>
                  <div class="relative">
                    <select
                      id="inviteRole"
                      v-model="inviteRole"
                      :disabled="isInviting"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 appearance-none bg-white pr-10 disabled:opacity-50"
                    >
                      <option value="viewer">{{ t('management.inviteDrawer.roles.viewer') }}</option>
                      <option value="editor">{{ t('management.inviteDrawer.roles.editor') }}</option>
                      <option value="admin">{{ t('management.inviteDrawer.roles.admin') }}</option>
                    </select>
                    <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label for="inviteMessage" class="block text-sm font-medium text-slate-700 mb-1.5">
                    {{ t('management.inviteDrawer.message') }}
                  </label>
                  <input
                    id="inviteMessage"
                    v-model="inviteMessage"
                    type="text"
                    maxlength="500"
                    :disabled="isInviting"
                    :placeholder="t('management.inviteDrawer.messagePlaceholder')"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white disabled:opacity-50"
                  />
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="submit"
                  :disabled="isInviting || !inviteEmail"
                  class="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white text-sm font-semibold rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span
                    v-if="isInviting"
                    class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  <Send v-else class="w-4 h-4" />
                  {{ isInviting ? t('management.inviteDrawer.sending') : t('management.inviteDrawer.sendInvitation') }}
                </button>
                <button
                  type="button"
                  @click="closeInviteForm"
                  :disabled="isInviting"
                  class="flex-1 sm:flex-none text-center px-4 py-2 text-slate-600 hover:bg-slate-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {{ t('management.inviteDrawer.cancel') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1e90ff]"></div>
        <span class="ml-3 text-sm text-slate-600">{{ t('management.collaboratorsTab.loading') }}</span>
      </div>

      <!-- Error State -->
      <div v-else-if="loadError" class="text-center py-6">
        <AlertCircle class="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p class="text-sm font-medium text-slate-900 mb-1">{{ t('management.collaboratorsTab.error.title') }}</p>
        <p class="text-xs text-slate-600 mb-3">{{ loadError }}</p>
        <button
          @click="retryLoadCollaborators"
          class="text-sm font-semibold text-[#1e90ff] hover:underline"
        >
          {{ t('management.collaboratorsTab.error.tryAgain') }}
        </button>
      </div>

      <!-- Rows -->
      <div v-else class="space-y-2">
        <!-- Organizer row -->
        <div v-if="sanitizedOrganizerDetails" class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <div class="relative flex-shrink-0">
            <div
              class="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-sky-600 flex items-center justify-center"
            >
              <img
                v-if="sanitizedOrganizerDetails.profile_picture"
                :src="apiClient.getProfilePictureUrl(sanitizedOrganizerDetails.profile_picture ?? undefined) || undefined"
                :alt="sanitizedOrganizerDetails.first_name + ' ' + sanitizedOrganizerDetails.last_name"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-white text-sm font-bold">
                {{ getInitials(sanitizedOrganizerDetails.first_name, sanitizedOrganizerDetails.last_name) }}
              </span>
            </div>
            <div
              class="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full bg-purple-500 border-2 border-white flex items-center justify-center"
            >
              <Crown class="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm sm:text-base font-semibold text-slate-900 truncate">
              {{ sanitizedOrganizerDetails.first_name }} {{ sanitizedOrganizerDetails.last_name }}
            </p>
            <p class="text-xs sm:text-sm text-slate-500 truncate">
              @{{ sanitizedOrganizerDetails.username }} · {{ sanitizedOrganizerDetails.email }}
            </p>
          </div>
          <span
            class="flex-shrink-0 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-medium rounded-full"
          >
            {{ t('management.collaboratorsTab.organizer.badge') }}
          </span>
        </div>

        <!-- Collaborator rows -->
        <div
          v-for="collaborator in enrichedCollaborators"
          :key="collaborator.id"
          class="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200"
        >
          <div class="flex items-center space-x-3 flex-1 min-w-0">
            <div
              class="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-sky-600 flex items-center justify-center flex-shrink-0"
            >
              <img
                v-if="collaborator.profileImageUrl"
                :src="collaborator.profileImageUrl"
                :alt="
                  collaborator.sanitizedUserDetails
                    ? collaborator.sanitizedUserDetails.first_name + ' ' + collaborator.sanitizedUserDetails.last_name
                    : collaborator.sanitizedEmail
                "
                class="w-full h-full object-cover"
              />
              <span v-else class="text-white text-xs sm:text-sm font-bold">
                {{ collaborator.initials }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm sm:text-base font-semibold text-slate-800 truncate">
                <span v-if="collaborator.sanitizedUserDetails">
                  {{ collaborator.sanitizedUserDetails.first_name }}
                  {{ collaborator.sanitizedUserDetails.last_name }}
                </span>
                <span v-else class="text-slate-500">{{ collaborator.sanitizedEmail }}</span>
              </h4>
              <p class="text-xs sm:text-sm text-slate-500 truncate">
                <span v-if="collaborator.sanitizedUserDetails">
                  @{{ collaborator.sanitizedUserDetails.username }}
                </span>
                <span v-else>{{ collaborator.sanitizedEmail }}</span>
              </p>
              <p class="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                {{ t('management.collaboratorsTab.list.invitedBy', { name: collaborator.invited_by_name }) }} ·
                {{ collaborator.formattedInviteDate }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2 flex-shrink-0">
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
                  :class="collaborator.roleColorClass"
                  :title="t('management.collaboratorsTab.list.changeRole')"
                >
                  {{ collaborator.role }}
                </button>
                <span
                  v-else
                  class="inline-block px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full"
                  :class="collaborator.roleColorClass"
                >
                  {{ collaborator.role }}
                </span>
              </div>
              <p
                class="text-[10px] sm:text-xs mt-0.5 sm:mt-1"
                :class="collaborator.is_accepted ? 'text-green-600' : 'text-orange-600'"
              >
                {{ collaborator.is_accepted ? t('management.collaboratorsTab.list.accepted') : t('management.collaboratorsTab.list.pending') }}
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
                  :title="t('management.collaboratorsTab.list.saveRole')"
                >
                  <CheckCircle class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  @click="cancelRoleEdit"
                  class="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-all duration-200"
                  :title="t('management.collaboratorsTab.list.cancelEdit')"
                >
                  <X class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              <!-- Remove button - only show for organizers/admins -->
              <button
                v-if="canRemoveCollaborator && editingRole !== collaborator.id"
                @click="confirmRemoveCollaborator(collaborator)"
                class="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                :title="t('management.collaboratorsTab.list.removeCollaborator')"
              >
                <Trash2 class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state (editable) -->
        <button
          v-if="!loading && enrichedCollaborators.length === 0 && canInvite && !showInviteForm"
          type="button"
          @click="openInviteForm"
          class="w-full border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 rounded-2xl p-4 sm:p-6 text-center transition-colors group"
        >
          <UserPlus class="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-slate-400 group-hover:text-emerald-500 transition-colors" />
          <p class="mt-1.5 sm:mt-2 text-sm font-medium text-slate-700">{{ t('management.collaboratorsTab.empty.inviteFirst') }}</p>
          <p class="mt-0.5 text-xs text-slate-500">{{ t('management.collaboratorsTab.empty.title') }}</p>
        </button>

        <!-- Empty state (read-only) -->
        <div
          v-else-if="!loading && enrichedCollaborators.length === 0"
          class="w-full border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-4 sm:p-6 text-center"
        >
          <Users class="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-slate-300" />
          <p class="mt-1.5 sm:mt-2 text-sm text-slate-500">{{ t('management.collaboratorsTab.empty.title') }}</p>
        </div>
      </div>

      <!-- Collapsible Roles Info -->
      <Transition name="collapse">
        <div v-if="showRolesInfo" class="grid grid-rows-[1fr]">
          <div class="min-h-0 overflow-hidden">
            <div class="pt-3 sm:pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3">
                <div class="flex items-center mb-0.5 sm:mb-1">
                  <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full mr-1.5 sm:mr-2"></div>
                  <span class="text-xs sm:text-sm font-semibold text-slate-700">{{ t('management.collaboratorsTab.roles.admin') }}</span>
                </div>
                <p class="text-[10px] sm:text-xs text-slate-600">{{ t('management.collaboratorsTab.roles.adminDesc') }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3">
                <div class="flex items-center mb-0.5 sm:mb-1">
                  <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#1e90ff] rounded-full mr-1.5 sm:mr-2"></div>
                  <span class="text-xs sm:text-sm font-semibold text-slate-700">{{ t('management.collaboratorsTab.roles.editor') }}</span>
                </div>
                <p class="text-[10px] sm:text-xs text-slate-600">{{ t('management.collaboratorsTab.roles.editorDesc') }}</p>
              </div>
              <div class="bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3">
                <div class="flex items-center mb-0.5 sm:mb-1">
                  <div class="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-1.5 sm:mr-2"></div>
                  <span class="text-xs sm:text-sm font-semibold text-slate-700">{{ t('management.collaboratorsTab.roles.viewer') }}</span>
                </div>
                <p class="text-[10px] sm:text-xs text-slate-600">{{ t('management.collaboratorsTab.roles.viewerDesc') }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Remove Confirmation Modal -->
    <DeleteConfirmModal
      :show="showRemoveModal"
      :loading="isRemoving"
      :title="t('management.collaboratorsTab.removeModal.title')"
      :item-name="
        collaboratorToRemove
          ? collaboratorToRemove.user_details
            ? sanitizePlainText(`${collaboratorToRemove.user_details.first_name} ${collaboratorToRemove.user_details.last_name}`, 100)
            : sanitizePlainText(collaboratorToRemove.email, 254)
          : ''
      "
      :message="t('management.collaboratorsTab.removeModal.message')"
      @confirm="removeCollaborator"
      @cancel="closeRemoveModal"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '@/composables/useToast'
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
  ChevronDown,
  LifeBuoy,
  Send,
} from 'lucide-vue-next'
import { eventsService, type EventCollaborator } from '../services/api'
import { apiClient } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { inputValidator } from '@/utils/inputValidation'
import { sanitizePlainText } from '@/utils/sanitize'
import { useCollaboratorRole } from '@/composables/useCollaboratorRole'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventId: string
  eventTitle: string
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
const { t } = useAppLanguage()
const authStore = useAuthStore()

// State
const collaborators = ref<EventCollaborator[]>([])
const loading = ref(false)
const loadError = ref<string | null>(null)
const showInviteForm = ref(false)
const showRolesInfo = ref(false)
const showRemoveModal = ref(false)
const isInviting = ref(false)
const isRemoving = ref(false)
const collaboratorToRemove = ref<EventCollaborator | null>(null)
const { showToast } = useToast()

// Inline invite form state
const inviteEmail = ref('')
const inviteRole = ref<'admin' | 'editor' | 'viewer'>('editor')
const inviteMessage = ref('')
const inviteEmailError = ref<string | null>(null)

/**
 * Show a temporary message to the user via the app-wide toast stack
 *
 * @param type - Message type (success or error)
 * @param text - Message text to display
 */
const showMessage = (type: 'success' | 'error', text: string): void => {
  showToast(type, text)
}

// Use the role management composable
const {
  editingRole,
  tempRole,
  isUpdatingRole,
  startRoleEdit,
  cancelRoleEdit,
  saveRoleUpdate,
} = useCollaboratorRole({
  eventId: props.eventId,
  onMessage: showMessage,
  onRoleUpdated: (updatedCollaborator) => {
    const index = collaborators.value.findIndex((c) => c.id === updatedCollaborator.id)
    if (index !== -1) {
      collaborators.value[index] = updatedCollaborator
    }
  },
})

// Computed

/**
 * Determine the current user's role in this event
 * Returns 'organizer' if user is the event organizer, or their collaborator role if they are a collaborator
 */
const userCollaboratorRole = computed<'organizer' | 'admin' | 'editor' | 'viewer' | null>(() => {
  // Check if user is the organizer
  if (props.organizerDetails && authStore.user?.id === props.organizerDetails.id) {
    return 'organizer'
  }

  // Check if user is a collaborator
  const userCollaborator = collaborators.value.find(
    (c) => c.user_details?.id === authStore.user?.id
  )
  return userCollaborator?.role || null
})

/**
 * Only organizers and admin collaborators can invite new collaborators
 */
const canInvite = computed(() => {
  const role = userCollaboratorRole.value
  return role === 'organizer' || role === 'admin'
})

/**
 * Only organizers and admin collaborators can remove collaborators
 */
const canRemoveCollaborator = computed(() => {
  const role = userCollaboratorRole.value
  return role === 'organizer' || role === 'admin'
})

/**
 * Only organizers and admin collaborators can update roles
 */
const canUpdateRole = computed(() => {
  const role = userCollaboratorRole.value
  return role === 'organizer' || role === 'admin'
})

const acceptedCount = computed(() => collaborators.value.filter((c) => c.is_accepted).length)

const pendingCount = computed(() => collaborators.value.filter((c) => !c.is_accepted).length)

const teamCount = computed(() => collaborators.value.length + (props.organizerDetails ? 1 : 0))

/**
 * Sanitized organizer details for safe display
 * Prevents XSS attacks from user-provided content
 */
const sanitizedOrganizerDetails = computed(() => {
  if (!props.organizerDetails) return null

  return {
    ...props.organizerDetails,
    first_name: sanitizePlainText(props.organizerDetails.first_name, 50),
    last_name: sanitizePlainText(props.organizerDetails.last_name, 50),
    username: sanitizePlainText(props.organizerDetails.username, 30),
    email: sanitizePlainText(props.organizerDetails.email, 254),
  }
})

/**
 * Enriched collaborators with pre-computed display values
 * Improves performance by avoiding recalculation in v-for loop
 */
const enrichedCollaborators = computed(() => {
  return collaborators.value.map((collaborator) => {
    // Sanitize user details
    const sanitizedUserDetails = collaborator.user_details
      ? {
          ...collaborator.user_details,
          first_name: sanitizePlainText(collaborator.user_details.first_name, 50),
          last_name: sanitizePlainText(collaborator.user_details.last_name, 50),
          username: sanitizePlainText(collaborator.user_details.username, 30),
          email: sanitizePlainText(collaborator.user_details.email, 254),
        }
      : null

    // Pre-compute profile image URL
    const profileImageUrl = collaborator.user_details?.profile_picture
      ? apiClient.getProfilePictureUrl(collaborator.user_details.profile_picture)
      : null

    // Pre-compute initials
    const initials = getInitials(
      collaborator.user_details?.first_name || '',
      collaborator.user_details?.last_name || (collaborator.email ? collaborator.email.charAt(0) : '')
    )

    // Pre-compute formatted invite date
    const formattedInviteDate = formatDate(collaborator.invited_at)

    // Pre-compute role color class
    const roleColorClass = getRoleColor(collaborator.role)

    // Sanitize email (fallback for non-registered users)
    const sanitizedEmail = collaborator.email ? sanitizePlainText(collaborator.email, 254) : ''

    return {
      ...collaborator,
      sanitizedUserDetails,
      sanitizedEmail,
      profileImageUrl,
      initials,
      formattedInviteDate,
      roleColorClass,
    }
  })
})

// Methods

/**
 * Load collaborators from the API
 * Includes error handling and sets appropriate error state
 */
const loadCollaborators = async (): Promise<void> => {
  loading.value = true
  loadError.value = null

  try {
    const response = await eventsService.getCollaborators(props.eventId)
    if (response.success && response.data) {
      collaborators.value = response.data
      loadError.value = null
    } else {
      loadError.value = response.message || t('management.collaboratorsTab.error.loadFailed')
      showMessage('error', loadError.value)
    }
  } catch (error) {
    console.error('Error loading collaborators:', error)
    loadError.value = t('management.collaboratorsTab.error.networkError')
    showMessage('error', loadError.value)
  } finally {
    loading.value = false
  }
}

/**
 * Retry loading collaborators after a failed attempt
 */
const retryLoadCollaborators = async (): Promise<void> => {
  await loadCollaborators()
}

/**
 * Open the inline invite form, resetting its fields
 */
const openInviteForm = (): void => {
  inviteEmail.value = ''
  inviteRole.value = 'editor'
  inviteMessage.value = ''
  inviteEmailError.value = null
  showInviteForm.value = true
}

/**
 * Close the inline invite form
 */
const closeInviteForm = (): void => {
  showInviteForm.value = false
}

const toggleInviteForm = (): void => {
  if (showInviteForm.value) {
    closeInviteForm()
  } else {
    openInviteForm()
  }
}

const validateInviteEmail = (): void => {
  if (!inviteEmail.value) {
    inviteEmailError.value = null
    return
  }
  const validation = inputValidator.validateEmail(inviteEmail.value)
  inviteEmailError.value = validation.isValid ? null : validation.errors[0]
}

/**
 * Prefill the form to ask the GoEvent admin for help managing this event
 */
const fillAdminHelp = (): void => {
  inviteEmail.value = 'admin@goevent.com'
  inviteRole.value = 'admin'
  inviteMessage.value = props.eventTitle
    ? `${props.eventTitle} asks admin for help`
    : 'Event asks admin for help'
  inviteEmailError.value = null
}

/**
 * Submit the inline invite form
 * Validates and sanitizes data before sending to API
 */
const submitInvite = async (): Promise<void> => {
  validateInviteEmail()
  if (inviteEmailError.value || !inviteEmail.value.trim()) {
    return
  }

  const emailValidation = inputValidator.validateEmail(inviteEmail.value)
  if (!emailValidation.isValid) {
    showMessage('error', emailValidation.errors[0])
    return
  }

  // Sanitize message if provided
  const sanitizedMessage = inviteMessage.value
    ? sanitizePlainText(inviteMessage.value, 500)
    : ''

  // Check message length after sanitization
  if (sanitizedMessage.length > 500) {
    showMessage('error', t('management.collaboratorsTab.toast.messageTooLong'))
    return
  }

  isInviting.value = true
  try {
    const response = await eventsService.inviteCollaborator(props.eventId, {
      email: emailValidation.sanitizedValue!,
      role: inviteRole.value,
      message: sanitizedMessage || undefined,
    })

    if (response.success && response.data) {
      showMessage('success', t('management.collaboratorsTab.toast.invited'))
      collaborators.value.push(response.data)

      // Send Telegram notification if this is an admin help request
      if (emailValidation.sanitizedValue === 'admin@goevent.com' && sanitizedMessage.includes('asks admin for help')) {
        try {
          await apiClient.post('/api/notifications/telegram/', {
            type: 'admin_help',
            event_id: props.eventId,
            message: sanitizedMessage,
          })
        } catch (telegramError) {
          console.error('Failed to send Telegram notification:', telegramError)
        }
      }

      closeInviteForm()
    } else {
      showMessage('error', response.message || t('management.collaboratorsTab.toast.inviteFailed'))
    }
  } catch (error) {
    console.error('Error inviting collaborator:', error)
    showMessage('error', t('management.collaboratorsTab.toast.inviteError'))
  } finally {
    isInviting.value = false
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

/**
 * Remove a collaborator from the event
 * Removes sensitive data logging for security
 */
const removeCollaborator = async (): Promise<void> => {
  if (!collaboratorToRemove.value) return

  isRemoving.value = true
  try {
    const response = await eventsService.removeCollaborator(
      props.eventId,
      collaboratorToRemove.value.id,
    )

    if (response.success) {
      showMessage('success', t('management.collaboratorsTab.toast.removed'))
      // Remove from local list
      collaborators.value = collaborators.value.filter(
        (c) => c.id !== collaboratorToRemove.value!.id,
      )
      closeRemoveModal()
    } else {
      showMessage('error', response.message || t('management.collaboratorsTab.toast.removeFailed'))
    }
  } catch (error) {
    console.error('Error removing collaborator:', error)
    showMessage('error', t('management.collaboratorsTab.toast.removeError'))
  } finally {
    isRemoving.value = false
  }
}

// Role management methods are now handled by the useCollaboratorRole composable

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

/**
 * Get initials from first and last name
 * Used for avatar placeholder when profile picture is not available
 */
const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Lifecycle
onMounted(async () => {
  try {
    await loadCollaborators()
  } catch (error) {
    console.error('Failed to initialize collaborators:', error)
  }
})

// Expose methods for parent component (Smart FAB)
defineExpose({
  openInviteModal: openInviteForm,
  retryLoadCollaborators,
})
</script>

<style scoped>
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
    transition: opacity 0.2s ease;
  }
}
</style>

