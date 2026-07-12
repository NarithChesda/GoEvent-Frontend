<template>
  <!-- Guest Card - Clean minimalist design -->
  <div
    class="bg-white rounded-2xl ring-1 ring-slate-900/5 hover:ring-slate-900/10 hover:shadow-sm transition-all duration-200 group"
  >
    <div class="flex items-center gap-3 px-4 py-3">
      <!-- Checkbox -->
      <input
        type="checkbox"
        :checked="selected"
        @change="$emit('toggle-select', guest)"
        @click.stop
        class="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-2 focus:ring-sky-200 focus:ring-offset-0 cursor-pointer flex-shrink-0 transition-colors"
      />

      <!-- Initials avatar tinted with the guest's group color -->
      <div
        class="flex w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center text-[11px] sm:text-xs font-bold flex-shrink-0 select-none"
        :style="{ backgroundColor: `${avatarColor}1a`, color: avatarColor }"
      >
        {{ guestInitials }}
      </div>

      <!-- Guest Info (grows to fill space) -->
      <div class="flex-1 min-w-0">
        <!-- Guest Name (click/tap to rename inline) -->
        <input
          v-if="isEditingName"
          ref="nameInputRef"
          v-model="draftName"
          type="text"
          @click.stop
          @keydown.enter.prevent="commitNameEdit"
          @keydown.esc.prevent="cancelNameEdit"
          @blur="commitNameEdit"
          class="w-full -mx-1 px-1 py-0 font-semibold text-slate-900 bg-white border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        <button
          v-else
          type="button"
          @click.stop="startNameEdit"
          class="block w-full text-left font-semibold text-slate-900 truncate rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          :title="t('management.guestGroupsView.guestListItem.renameHint')"
        >
          {{ guest.name }}
        </button>

        <!-- Badges under name -->
        <div class="flex items-center gap-1.5 mt-1 flex-wrap">
          <!-- Group badge (click/tap to reassign) -->
          <button
            v-if="guest.group_details"
            ref="groupBadgeRef"
            type="button"
            @click.stop="toggleGroupPopover"
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            :title="t('management.guestGroupsView.guestListItem.changeGroupHint')"
          >
            <span
              class="w-1.5 h-1.5 rounded-full flex-shrink-0"
              :style="{ backgroundColor: guest.group_details.color || '#64748b' }"
            ></span>
            <span class="truncate max-w-[80px]">{{ guest.group_details.name }}</span>
            <ChevronDown class="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
          </button>

          <!-- Sent status badge -->
          <div
            v-if="guest.invitation_status === 'sent' || guest.invitation_status === 'viewed'"
            class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium"
            :title="t('management.guestGroupsView.guestListItem.invitationSent')"
          >
            <CheckCheck class="w-3 h-3" />
            <span>{{ t('management.guestGroupsView.guestListItem.sent') }}</span>
          </div>

          <!-- RSVP status badge (private-event response) -->
          <div
            v-if="rsvpBadge"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            :class="rsvpBadge.classes"
            :title="rsvpBadge.title"
          >
            <component :is="rsvpBadge.icon" class="w-3 h-3" />
            <span>{{ rsvpBadge.label }}</span>
            <span
              v-if="rsvpBadge.plusOnes"
              class="ml-0.5 px-1 rounded-full bg-white/60 text-[10px] tabular-nums"
            >+{{ rsvpBadge.plusOnes }}</span>
          </div>

          <!-- Cash Gift badge -->
          <div v-if="guest.cash_gift_amount" class="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[11px] font-medium">
            <Coins class="w-3 h-3" />
            <span>{{ formatCurrency(guest.cash_gift_amount, guest.cash_gift_currency) }}</span>
          </div>

          <!-- Table seating badge -->
          <div
            v-if="guest.table_details"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            :style="{
              color: guest.table_details.color || '#0ea5e9',
              backgroundColor: `${guest.table_details.color || '#0ea5e9'}14`
            }"
            :title="guest.seat_number
              ? t('management.guestGroupsView.guestListItem.seatedAtWithSeat', { table: guest.table_details.name, seat: guest.seat_number })
              : t('management.guestGroupsView.guestListItem.seatedAt', { table: guest.table_details.name })"
          >
            <Armchair class="w-3 h-3" />
            <span class="truncate max-w-[100px]">{{ guest.table_details.name }}<template v-if="guest.seat_number"> · {{ guest.seat_number }}</template></span>
          </div>
        </div>
      </div>

      <!-- Mobile Copy Link Button (right side) -->
      <button
        @click.stop="handleMobileCopyLink"
        class="md:hidden px-3 py-1.5 text-xs font-semibold flex-shrink-0 rounded-full transition-all duration-200"
        :class="showCopiedFeedback
          ? 'text-emerald-700 bg-emerald-100'
          : 'text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300'"
      >
        {{ showCopiedFeedback ? t('management.guestGroupsView.guestListItem.copied') : t('management.guestGroupsView.guestListItem.copy') }}
      </button>

      <!-- Mobile "more details" button — opens the full edit modal (RSVP, cash gift, contact info) -->
      <button
        type="button"
        @click.stop="$emit('edit', guest)"
        class="md:hidden flex items-center justify-center w-10 h-10 flex-shrink-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        :title="t('management.guestGroupsView.guestListItem.moreDetails')"
        :aria-label="t('management.guestGroupsView.guestListItem.moreDetails')"
      >
        <ChevronRight class="w-5 h-5" />
      </button>

      <!-- Actions (hidden on mobile; revealed on row hover / keyboard focus on desktop) -->
      <div
        class="hidden md:flex items-center gap-0.5 flex-shrink-0 transition-opacity duration-150"
        :class="showLinkMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'"
      >
        <!-- Mark Sent (only if not sent) -->
        <button
          v-if="guest.invitation_status === 'not_sent'"
          @click.stop="$emit('mark-sent', guest)"
          :title="t('management.guestGroupsView.guestListItem.markAsSent')"
          class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
        >
          <Send class="w-4 h-4" />
        </button>

        <!-- Copy Link with smart dropdown -->
        <div class="relative" ref="linkMenuContainer">
          <button
            ref="linkButton"
            @click.stop="toggleLinkMenu"
            :title="t('management.guestGroupsView.guestListItem.copyLink')"
            class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            :class="{ 'bg-slate-100 text-slate-700': showLinkMenu }"
          >
            <Link class="w-4 h-4" />
          </button>
        </div>

        <!-- Edit -->
        <button
          @click.stop="$emit('edit', guest)"
          :title="t('management.guestGroupsView.guestListItem.editGuest')"
          class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
        >
          <Edit2 class="w-4 h-4" />
        </button>

        <!-- Delete -->
        <button
          @click.stop="$emit('delete', guest)"
          :title="t('management.guestGroupsView.guestListItem.deleteGuest')"
          class="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>

  <!-- Teleport dropdown to body to escape overflow constraints -->
  <Teleport to="body">
    <Transition name="dropdown">
      <div
        v-if="showLinkMenu"
        ref="dropdownMenu"
        :style="dropdownStyle"
        class="fixed w-32 bg-white border border-slate-200/60 rounded-xl shadow-lg shadow-slate-200/50 z-[9999] overflow-hidden"
        @click.stop
      >
        <div class="p-1">
          <button
            @click="handleCopyLink('kh')"
            class="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <Globe class="w-3.5 h-3.5 text-slate-400" />
            {{ t('management.guestGroupsView.guestListItem.languageKhmer') }}
          </button>
          <button
            @click="handleCopyLink('en')"
            class="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <Globe class="w-3.5 h-3.5 text-slate-400" />
            {{ t('management.guestGroupsView.guestListItem.languageEnglish') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Teleport group-reassignment popover to body to escape overflow constraints -->
  <Teleport to="body">
    <Transition name="dropdown">
      <div
        v-if="showGroupPopover"
        ref="groupPopoverMenu"
        :style="groupPopoverStyle"
        class="fixed bg-white border border-slate-200/60 rounded-xl shadow-lg shadow-slate-200/50 z-[9999] overflow-hidden"
        @click.stop
      >
        <div class="p-1.5 max-h-64 overflow-y-auto custom-scrollbar">
          <button
            v-for="group in groups"
            :key="group.id"
            type="button"
            @click="selectGroup(group.id)"
            :class="[
              'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 text-left',
              group.id === guest.group
                ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white'
                : 'text-slate-700 hover:bg-slate-50',
            ]"
          >
            <span
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              :style="{ backgroundColor: group.id === guest.group ? 'white' : (group.color || '#64748b') }"
            ></span>
            <span class="flex-1 truncate">{{ group.name }}</span>
            <span :class="['text-xs tabular-nums flex-shrink-0', group.id === guest.group ? 'text-white/80' : 'text-slate-400']">{{ group.guest_count }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Trash2,
  Send,
  Edit2,
  Coins,
  Link,
  Globe,
  CheckCheck,
  Check,
  HelpCircle,
  X as XIcon,
  Armchair,
  ChevronDown,
  ChevronRight,
} from 'lucide-vue-next'
import type { EventGuest, GuestGroup } from '../../services/api'

const { t } = useI18n()

// Global state manager for dropdowns (singleton pattern)
class DropdownManager {
  private static instance: DropdownManager
  private currentOpenDropdown: { close: () => void } | null = null

  static getInstance() {
    if (!DropdownManager.instance) {
      DropdownManager.instance = new DropdownManager()
    }
    return DropdownManager.instance
  }

  register(closeCallback: () => void) {
    // Close any currently open dropdown
    if (this.currentOpenDropdown) {
      this.currentOpenDropdown.close()
    }
    this.currentOpenDropdown = { close: closeCallback }
  }

  unregister(closeCallback: () => void) {
    if (this.currentOpenDropdown?.close === closeCallback) {
      this.currentOpenDropdown = null
    }
  }

  closeAll() {
    if (this.currentOpenDropdown) {
      this.currentOpenDropdown.close()
      this.currentOpenDropdown = null
    }
  }
}

// Props
const props = defineProps<{
  guest: EventGuest
  selected?: boolean
  groups: GuestGroup[]
}>()

// Emits
const emit = defineEmits<{
  'copy-link': [guest: EventGuest, language: 'en' | 'kh']
  'mark-sent': [guest: EventGuest]
  edit: [guest: EventGuest]
  delete: [guest: EventGuest]
  'toggle-select': [guest: EventGuest]
  'update-name': [guest: EventGuest, name: string]
  'update-group': [guest: EventGuest, groupId: number]
}>()

// Local state
const showLinkMenu = ref(false)
const linkMenuContainer = ref<HTMLElement | null>(null)
const linkButton = ref<HTMLElement | null>(null)
const dropdownMenu = ref<HTMLElement | null>(null)
const dropdownPosition = ref<'top' | 'bottom'>('bottom')
const dropdownStyle = ref<Record<string, string>>({})
const showCopiedFeedback = ref(false)

// Inline name-edit state
const isEditingName = ref(false)
const draftName = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)

// Inline group-reassignment popover state
const showGroupPopover = ref(false)
const groupBadgeRef = ref<HTMLElement | null>(null)
const groupPopoverMenu = ref<HTMLElement | null>(null)
const groupPopoverStyle = ref<Record<string, string>>({})

const dropdownManager = DropdownManager.getInstance()

const avatarColor = computed(() => props.guest.group_details?.color || '#64748b')

/** First letters of up to two name words, e.g. "Sok Dara" → "SD". */
const guestInitials = computed(() =>
  props.guest.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase(),
)

// Mobile copy link handler with feedback
const handleMobileCopyLink = () => {
  emit('copy-link', props.guest, 'kh')
  showCopiedFeedback.value = true
  setTimeout(() => {
    showCopiedFeedback.value = false
  }, 1500)
}

// RSVP badge config — drives the badge rendered next to the existing
// group / sent / cash-gift badges. Hidden for `pending` (default state)
// to avoid noise; the absence of a badge already implies "no response yet".
type RsvpBadgeConfig = {
  label: string
  classes: string
  icon: typeof Check | typeof HelpCircle | typeof XIcon
  title: string
  plusOnes: number
}

const rsvpBadge = computed<RsvpBadgeConfig | null>(() => {
  const status = props.guest.rsvp_status
  if (!status || status === 'pending') return null

  const plusOnes = props.guest.plus_ones_count ?? 0
  const baseTitle = props.guest.rsvp_status_display || status

  if (status === 'attending') {
    return {
      label: t('management.guestGroupsView.guestListItem.rsvp.going'),
      classes: 'bg-emerald-50 text-emerald-700',
      icon: Check,
      title: baseTitle,
      plusOnes,
    }
  }

  if (status === 'maybe') {
    return {
      label: t('management.guestGroupsView.guestListItem.rsvp.maybe'),
      classes: 'bg-amber-50 text-amber-700',
      icon: HelpCircle,
      title: baseTitle,
      plusOnes,
    }
  }

  // not_attending
  return {
    label: t('management.guestGroupsView.guestListItem.rsvp.declined'),
    classes: 'bg-rose-50 text-rose-700',
    icon: XIcon,
    title: baseTitle,
    plusOnes: 0,
  }
})

// Methods

// Inline name-edit handlers
const startNameEdit = () => {
  draftName.value = props.guest.name
  isEditingName.value = true
  nextTick(() => {
    nameInputRef.value?.focus()
    nameInputRef.value?.select()
  })
}

const cancelNameEdit = () => {
  isEditingName.value = false
}

const commitNameEdit = () => {
  if (!isEditingName.value) return
  const trimmed = draftName.value.trim()
  isEditingName.value = false
  if (!trimmed || trimmed === props.guest.name) return
  emit('update-name', props.guest, trimmed)
}

// Inline group-reassignment popover handlers
const calculateGroupPopoverPosition = () => {
  if (!groupBadgeRef.value) return

  const buttonRect = groupBadgeRef.value.getBoundingClientRect()
  const menuWidth = 220
  const menuHeight = Math.min(props.groups.length * 40 + 16, 280)

  const spaceBelow = window.innerHeight - buttonRect.bottom
  const spaceAbove = buttonRect.top
  const showAbove = spaceBelow < menuHeight && spaceAbove > menuHeight

  const top = showAbove ? buttonRect.top - menuHeight - 4 : buttonRect.bottom + 4
  let left = buttonRect.left

  if (left < 8) {
    left = 8
  }
  if (left + menuWidth > window.innerWidth - 8) {
    left = window.innerWidth - menuWidth - 8
  }

  groupPopoverStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${menuWidth}px`,
  }
}

const closeGroupPopover = () => {
  showGroupPopover.value = false
}

const toggleGroupPopover = () => {
  if (showGroupPopover.value) {
    closeGroupPopover()
  } else {
    dropdownManager.register(closeGroupPopover)
    showGroupPopover.value = true
    setTimeout(() => calculateGroupPopoverPosition(), 0)
  }
}

const selectGroup = (groupId: number) => {
  closeGroupPopover()
  if (groupId === props.guest.group) return
  emit('update-group', props.guest, groupId)
}

const formatCurrency = (amount: string | number, currency: string = 'USD') => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return ''

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numAmount)

  return `${formatted} ${currency}`
}

const calculateDropdownPosition = () => {
  if (!linkButton.value) return

  const buttonRect = linkButton.value.getBoundingClientRect()
  const dropdownHeight = 88 // Approximate height of 2 buttons
  const dropdownWidth = 128 // 32 * 4 = 128px (w-32)

  // Calculate space below button
  const spaceBelow = window.innerHeight - buttonRect.bottom
  const spaceAbove = buttonRect.top

  // Determine if dropdown should be above or below
  const showAbove = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight

  // Calculate position
  let top: number
  let left: number

  if (showAbove) {
    // Position above button
    top = buttonRect.top - dropdownHeight - 4 // 4px gap
    dropdownPosition.value = 'top'
  } else {
    // Position below button
    top = buttonRect.bottom + 4 // 4px gap
    dropdownPosition.value = 'bottom'
  }

  // Align dropdown to the right of button
  left = buttonRect.right - dropdownWidth

  // Ensure dropdown doesn't go off-screen on the left
  if (left < 8) {
    left = 8
  }

  // Ensure dropdown doesn't go off-screen on the right
  if (left + dropdownWidth > window.innerWidth - 8) {
    left = window.innerWidth - dropdownWidth - 8
  }

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  }
}

const closeDropdown = () => {
  showLinkMenu.value = false
}

const toggleLinkMenu = () => {
  if (showLinkMenu.value) {
    // If already open, close it
    closeDropdown()
  } else {
    // Register this dropdown as the active one (closes others)
    dropdownManager.register(closeDropdown)
    showLinkMenu.value = true
    // Calculate position after menu state changes
    setTimeout(() => calculateDropdownPosition(), 0)
  }
}

const handleCopyLink = (language: 'en' | 'kh') => {
  emit('copy-link', props.guest, language)
  closeDropdown()
}

// Global click handler to close dropdowns/popovers when clicking outside
const handleGlobalClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement

  if (showLinkMenu.value) {
    if (
      linkButton.value &&
      !linkButton.value.contains(target) &&
      dropdownMenu.value &&
      !dropdownMenu.value.contains(target)
    ) {
      closeDropdown()
    }
  }

  if (showGroupPopover.value) {
    if (
      groupBadgeRef.value &&
      !groupBadgeRef.value.contains(target) &&
      groupPopoverMenu.value &&
      !groupPopoverMenu.value.contains(target)
    ) {
      closeGroupPopover()
    }
  }
}

// Setup global click listener
onMounted(() => {
  if (typeof window !== 'undefined') {
    document.addEventListener('click', handleGlobalClick)
  }
})

// Cleanup
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', handleGlobalClick)
  }
  dropdownManager.unregister(closeDropdown)
  dropdownManager.unregister(closeGroupPopover)
})
</script>

<style scoped>
/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Thin scrollbar for the group-reassignment popover */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(203 213 225);
  border-radius: 3px;
}
</style>
