<template>
  <div>
    <!-- Team Panel: organizer + collaborators as one list.
         What was here before spent five hues on one panel — red for admin, green
         for viewer, purple for the organizer, orange for pending, powder blue for
         editor — and two of them collided with a meaning sitting inches away: red
         is the remove button in the same row, green is the acceptance line under
         the same badge. A role is not a status. It is an ordinal privilege level,
         so it is drawn as one, in slate value alone: organizer > admin > editor >
         viewer reads as a ladder because it looks like a ladder. That frees the
         single warm hue in the panel to mean the one thing that is genuinely a
         status and genuinely actionable — an invitation nobody has accepted. -->
    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
      <div class="flex items-center justify-between gap-3 mb-3">
        <div class="flex items-center gap-2 min-w-0">
          <h2 class="text-base font-semibold text-slate-900">{{ t('management.collaboratorsTab.team.title') }}</h2>
          <span class="text-sm font-normal text-slate-400">· {{ teamCount }}</span>
        </div>
        <!-- One disclosure control, and it never changes what it says — it either
             offers to invite or closes what it opened. Its label used to flip to
             "Cancel" while the form below carried a Cancel of its own, so the
             panel had two buttons with one word and one job between them. -->
        <button
          v-if="canInvite"
          type="button"
          @click="toggleInviteForm"
          class="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-sm font-medium rounded-full border border-dashed border-slate-300 text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 flex-shrink-0"
          :aria-expanded="showInviteForm"
          :aria-label="
            showInviteForm
              ? t('management.inviteDrawer.cancel')
              : t('management.collaboratorsTab.inviteCollaborator')
          "
        >
          <X v-if="showInviteForm" class="w-3.5 h-3.5 flex-shrink-0" />
          <template v-else>
            <UserPlus class="w-3.5 h-3.5 flex-shrink-0" />
            <span class="hidden sm:inline">{{ t('management.collaboratorsTab.inviteCollaborator') }}</span>
          </template>
        </button>
      </div>

      <!-- Inline Invite Form. No fill, no border, no radius of its own: a form
           disclosed inside a panel is a region of that panel, and wrapping it in a
           second rounded surface made a card inside a card. A rule and space say
           the same thing for nothing. -->
      <Transition name="collapse">
        <div v-if="showInviteForm" class="grid grid-rows-[1fr]">
          <div class="min-h-0 overflow-hidden">
            <form
              @submit.prevent="submitInvite"
              class="border-t border-slate-100 pt-4 mb-4 space-y-4"
            >
              <div>
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <label for="inviteEmail" class="block text-sm font-medium text-slate-700">
                    {{ t('management.inviteDrawer.email') }} <span class="text-red-500">*</span>
                  </label>
                  <!-- A 12px icon beside 12px text is decoration at this size; the
                       words are already the whole control. -->
                  <button
                    type="button"
                    @click="fillAdminHelp"
                    class="text-xs text-sky-700 hover:text-sky-800 font-medium transition-colors"
                  >
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
                    'w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-200 bg-white disabled:opacity-50',
                    inviteEmailError
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                      : 'border-slate-300 focus:ring-sky-200 focus:border-sky-400'
                  ]"
                />
                <p v-if="inviteEmailError" class="mt-1.5 text-xs text-red-600">{{ inviteEmailError }}</p>
              </div>

              <!-- Role is three named, ordered things, so it is a segmented control
                   and not a native select behind a drawn chevron — and the chosen
                   role explains itself right here, which is what retired the
                   separate "Collaboration Roles" panel this page used to carry. -->
              <div>
                <p id="inviteRoleLabel" class="block text-sm font-medium text-slate-700 mb-1.5">
                  {{ t('management.inviteDrawer.role') }}
                </p>
                <SegmentedField
                  :model-value="inviteRole"
                  :options="roleOptions"
                  aria-labelledby="inviteRoleLabel"
                  @update:model-value="setInviteRole"
                />
                <p class="mt-1.5 text-xs text-slate-500 leading-relaxed">{{ roleDescription(inviteRole) }}</p>
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

              <!-- No Cancel here: the X in the panel header closes this form and is
                   on screen the whole time it is open. -->
              <button
                type="submit"
                :disabled="isInviting || !inviteEmail"
                class="w-full sm:w-auto flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white text-sm font-semibold rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  v-if="isInviting"
                  class="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full"
                  aria-hidden="true"
                ></span>
                <Send v-else class="w-4 h-4" aria-hidden="true" />
                {{ isInviting ? t('management.inviteDrawer.sending') : t('management.inviteDrawer.sendInvitation') }}
              </button>
            </form>
          </div>
        </div>
      </Transition>

      <!-- Loading. A skeleton in the shape of the rows, not a spinner: the panel
           can say what is coming, and a shape that matches what arrives does not
           make the list jump when it does. -->
      <div v-if="loading" class="divide-y divide-slate-100" aria-hidden="true">
        <div v-for="n in 2" :key="n" class="flex items-center gap-3 py-3">
          <div class="w-10 h-10 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
          <div class="flex-1 min-w-0 space-y-1.5">
            <div class="h-3.5 w-32 max-w-full rounded bg-slate-200 animate-pulse" />
            <div class="h-3 w-44 max-w-full rounded bg-slate-100 animate-pulse" />
          </div>
          <div class="h-6 w-16 rounded-full bg-slate-100 animate-pulse flex-shrink-0" />
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="loadError" class="text-center py-8">
        <div class="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle class="w-6 h-6 text-red-500" />
        </div>
        <p class="mt-3 text-sm font-medium text-slate-900">{{ t('management.collaboratorsTab.error.title') }}</p>
        <p class="mt-1 text-xs text-slate-600">{{ loadError }}</p>
        <button
          type="button"
          @click="retryLoadCollaborators"
          class="mt-3 min-h-[40px] px-4 text-sm font-semibold text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors"
        >
          {{ t('management.collaboratorsTab.error.tryAgain') }}
        </button>
      </div>

      <!-- Rows. Standing is read down one column: organizer, admin, editor, viewer
           all sit in the same trailing slot, so the privilege ladder is legible in
           a single glance down the list. The organizer's crown badge is therefore
           gone — it said "organizer" a second time, an inch from the pill that
           already says it. The avatar carries one mark and only one: an amber dot
           for an invitation nobody has accepted, which is the only fact about a
           member that the role column cannot express. -->
      <div v-else class="divide-y divide-slate-100">
        <!-- Organizer row -->
        <div v-if="sanitizedOrganizerDetails" class="flex items-center gap-3 py-3">
          <div
            class="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center flex-shrink-0"
          >
            <img
              v-if="organizerAvatarUrl"
              :src="organizerAvatarUrl"
              :alt="organizerIdentity.name"
              class="w-full h-full object-cover"
              @error="organizerAvatarError = true"
            />
            <span v-else class="text-white text-sm font-semibold">{{ organizerInitials }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900 truncate">{{ organizerIdentity.name }}</p>
            <p v-if="organizerIdentity.secondary" class="text-xs text-slate-500 truncate">{{ organizerIdentity.secondary }}</p>
          </div>
          <span class="flex-shrink-0 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-full">
            {{ t('management.collaboratorsTab.organizer.badge') }}
          </span>
        </div>

        <!-- Collaborator rows -->
        <div v-for="collaborator in enrichedCollaborators" :key="collaborator.id" class="py-3">
          <div class="flex items-center gap-3">
            <div class="relative flex-shrink-0">
              <div
                class="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center"
              >
                <img
                  v-if="collaborator.profileImageUrl && !collaboratorAvatarErrors[collaborator.id]"
                  :src="collaborator.profileImageUrl"
                  :alt="collaborator.displayName"
                  class="w-full h-full object-cover"
                  @error="collaboratorAvatarErrors[collaborator.id] = true"
                />
                <span v-else class="text-white text-sm font-semibold">{{ collaborator.initials }}</span>
              </div>
              <span
                v-if="!collaborator.is_accepted"
                class="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-amber-400 border-2 border-white"
                :title="t('management.collaboratorsTab.list.pending')"
              >
                <span class="sr-only">{{ t('management.collaboratorsTab.list.pending') }}</span>
              </span>
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">{{ collaborator.displayName }}</p>
              <p v-if="collaborator.secondaryLine" class="text-xs text-slate-500 truncate">{{ collaborator.secondaryLine }}</p>
              <!-- Who invited them and when is context for chasing an invitation,
                   so it is shown on the rows that still need chasing. On an
                   accepted member it is a third line of history nobody reads. -->
              <p v-if="!collaborator.is_accepted" class="text-xs text-slate-400 truncate mt-0.5">
                {{ t('management.collaboratorsTab.list.invitedBy', { name: collaborator.invited_by_name }) }} ·
                {{ collaborator.formattedInviteDate }}
              </p>
            </div>

            <div class="flex items-center gap-1 flex-shrink-0">
              <button
                v-if="canUpdateRole"
                type="button"
                @click="toggleRoleEdit(collaborator)"
                class="px-2.5 py-1 text-xs font-medium rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                :class="roleBadgeClass(collaborator.role)"
                :aria-expanded="editingRole === collaborator.id"
                :title="t('management.collaboratorsTab.list.changeRole')"
              >
                {{ roleLabel(collaborator.role) }}
              </button>
              <span
                v-else
                class="px-2.5 py-1 text-xs font-medium rounded-full"
                :class="roleBadgeClass(collaborator.role)"
              >
                {{ roleLabel(collaborator.role) }}
              </span>

              <button
                v-if="canRemoveCollaborator"
                type="button"
                @click="confirmRemoveCollaborator(collaborator)"
                class="w-10 h-10 -mr-2 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                :title="t('management.collaboratorsTab.list.removeCollaborator')"
                :aria-label="t('management.collaboratorsTab.list.removeCollaborator')"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Role picker, disclosed in place. One tap is one decision: picking a
               segment commits it, and picking another reverses it — which is why
               there is no save/cancel pair any more. The old one was unreachable
               anyway: the select's @blur cancelled the edit and unmounted both
               buttons before either could receive its click. -->
          <Transition name="collapse">
            <div v-if="editingRole === collaborator.id" class="grid grid-rows-[1fr]">
              <div class="min-h-0 overflow-hidden">
                <div class="pt-3">
                  <SegmentedField
                    :model-value="tempRole"
                    :options="roleOptions"
                    :aria-label="t('management.collaboratorsTab.list.changeRole')"
                    @update:model-value="(role: string) => chooseRole(collaborator, role)"
                  />
                  <p class="mt-1.5 text-xs text-slate-500 leading-relaxed">{{ roleDescription(tempRole) }}</p>
                </div>
              </div>
            </div>
          </Transition>
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
  AlertCircle,
  X,
  Trash2,
  Send,
} from 'lucide-vue-next'
import { eventsService, type EventCollaborator } from '../services/api'
import { apiClient } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { inputValidator } from '@/utils/inputValidation'
import { sanitizePlainText } from '@/utils/sanitize'
import { useCollaboratorRole } from '@/composables/useCollaboratorRole'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import SegmentedField, { type SegmentedOption } from './common/SegmentedField.vue'

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

// Roles

type CollaboratorRole = 'admin' | 'editor' | 'viewer'

/** Least privileged first, so the segmented control reads as the ladder it is. */
const ROLE_ORDER: CollaboratorRole[] = ['viewer', 'editor', 'admin']

const roleLabel = (role: string): string => t(`management.collaboratorsTab.roles.${role}`)
const roleDescription = (role: string): string => t(`management.collaboratorsTab.roles.${role}Desc`)

const roleOptions = computed<SegmentedOption[]>(() =>
  ROLE_ORDER.map((value) => ({ value, label: roleLabel(value) })),
)

/**
 * A role is an ordinal privilege level, not a status, so it is drawn in slate
 * value alone — the darker the pill, the more it can do. The previous palette
 * (admin red, viewer green) collided with the two meanings sitting inches away
 * in the same row: red is the remove button, green was the acceptance state.
 */
const roleBadgeClass = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-slate-700 text-white'
    case 'editor':
      return 'bg-slate-200 text-slate-700'
    default:
      return 'bg-slate-100 text-slate-500'
  }
}

const setInviteRole = (role: string): void => {
  inviteRole.value = role as CollaboratorRole
}

const toggleRoleEdit = (collaborator: EventCollaborator): void => {
  if (editingRole.value === collaborator.id) cancelRoleEdit()
  else startRoleEdit(collaborator)
}

/**
 * One tap is one decision. `saveRoleUpdate` closes the disclosure on success and
 * on a no-op pick, so there is nothing left for a save/cancel pair to do — and
 * the pair this replaced was unreachable anyway, since the select's `@blur`
 * cancelled the edit and unmounted both buttons before either could be clicked.
 */
const chooseRole = (collaborator: EventCollaborator, role: string): void => {
  if (isUpdatingRole.value) return
  tempRole.value = role as CollaboratorRole
  void saveRoleUpdate(collaborator)
}
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
 * A profile picture that 404s is not the same as one that was never set, and the
 * template's v-if only knew about the second: a dead URL left the browser's
 * broken-image glyph sitting in the disc forever, because the initials were in
 * the v-else branch it never reached. Both avatars now fall through to initials
 * on error, the way the ones on the overview already did.
 */
const organizerAvatarError = ref(false)
const collaboratorAvatarErrors = ref<Record<number, boolean>>({})

const organizerAvatarUrl = computed(() => {
  const picture = sanitizedOrganizerDetails.value?.profile_picture
  if (!picture || organizerAvatarError.value) return null
  return apiClient.getProfilePictureUrl(picture) || null
})

const organizerInitials = computed(() => {
  const organizer = sanitizedOrganizerDetails.value
  if (!organizer) return '?'
  return getInitials(organizer.first_name, organizer.last_name, organizer.username || organizer.email)
})

/**
 * A row names a person once and then shows the next most identifying thing that
 * is not already the name. Printing "@handle · email" under a name spent two
 * lines on an account that may have neither, and repeated the email verbatim
 * under itself for one that has only that.
 */
const resolveIdentity = (parts: (string | undefined | null)[]): { name: string; secondary: string } => {
  const known = parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part))
  return { name: known[0] ?? '', secondary: known[1] ?? '' }
}

const organizerIdentity = computed(() => {
  const organizer = sanitizedOrganizerDetails.value
  if (!organizer) return { name: '', secondary: '' }
  return resolveIdentity([
    `${organizer.first_name ?? ''} ${organizer.last_name ?? ''}`,
    organizer.username ? `@${organizer.username}` : '',
    organizer.email,
  ])
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
      collaborator.user_details?.first_name,
      collaborator.user_details?.last_name,
      collaborator.user_details?.username || collaborator.email,
    )

    // Pre-compute formatted invite date
    const formattedInviteDate = formatDate(collaborator.invited_at)

    // Sanitize email (fallback for non-registered users)
    const sanitizedEmail = collaborator.email ? sanitizePlainText(collaborator.email, 254) : ''

    // An invitation sent to an address that has no account yet has no name and no
    // handle, so the same two <p>s have to hold whatever this person does have.
    const { name: displayName, secondary: secondaryLine } = resolveIdentity([
      sanitizedUserDetails
        ? `${sanitizedUserDetails.first_name ?? ''} ${sanitizedUserDetails.last_name ?? ''}`
        : '',
      sanitizedUserDetails?.username ? `@${sanitizedUserDetails.username}` : '',
      sanitizedEmail,
    ])

    return {
      ...collaborator,
      sanitizedUserDetails,
      sanitizedEmail,
      displayName,
      secondaryLine,
      profileImageUrl,
      initials,
      formattedInviteDate,
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

/**
 * Initials for the avatar placeholder.
 *
 * This returned an empty string whenever an account had neither a first nor a
 * last name — which is the common case for an account created through OAuth or
 * by email alone — so the fallback rendered as a blank gradient disc. It now
 * walks down to whatever the account does have: a username, then an email, then
 * a question mark, so the disc is never empty.
 */
const getInitials = (firstName?: string, lastName?: string, fallback?: string): string => {
  const first = firstName?.trim().charAt(0) ?? ''
  const last = lastName?.trim().charAt(0) ?? ''
  if (first || last) return `${first}${last}`.toUpperCase()

  const source = fallback?.trim() ?? ''
  return source ? source.slice(0, 2).toUpperCase() : '?'
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

