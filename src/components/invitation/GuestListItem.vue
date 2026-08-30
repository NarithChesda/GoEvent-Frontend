<template>
  <!-- Guest Card - Clean minimalist design. On mobile the whole card is
       tappable (opens details); the avatar doubles as the selection toggle. -->
  <div
    class="bg-white rounded-2xl transition-all duration-200 group"
    :class="selected
      ? 'ring-2 ring-sky-300 shadow-sm'
      : 'ring-1 ring-slate-900/5 hover:ring-slate-900/10 hover:shadow-sm'"
  >
    <div
      class="flex items-center gap-3 px-4 py-3 rounded-2xl active:bg-slate-50 md:active:bg-transparent transition-colors"
      @click="handleCardTap"
    >
      <!-- Checkbox (desktop only — mobile selects via the avatar) -->
      <input
        type="checkbox"
        :checked="selected"
        @change="$emit('toggle-select', guest)"
        @click.stop
        class="hidden md:block w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-2 focus:ring-sky-200 focus:ring-offset-0 cursor-pointer flex-shrink-0 transition-colors"
      />

      <!-- Initials avatar tinted with the guest's group color. Below `md` it
           doubles as the selection toggle and flips to a checkmark, because
           there is no checkbox at that width. From `md` up the checkbox is
           back, and flipping here too put *two* ticks on one row — so the
           avatar keeps its initials and the checkbox alone carries the state.
           ::after pad extends the touch target to ~44px. -->
      <button
        type="button"
        @click.stop="$emit('toggle-select', guest)"
        class="relative flex w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center text-[11px] sm:text-xs font-bold flex-shrink-0 select-none transition-[background-color,color] duration-150 ease-out after:absolute after:-inset-1.5 after:content-[''] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        :style="{ backgroundColor: `${avatarColor}1a`, color: avatarColor }"
        :class="selected ? 'max-md:!bg-sky-500 max-md:!text-white' : ''"
        :aria-pressed="selected"
        :title="t('management.guestGroupsView.guestListItem.selectHint')"
        :aria-label="`${t('management.guestGroupsView.guestListItem.selectHint')} - ${guest.name}`"
      >
        <Check v-if="selected" class="w-4 h-4 md:hidden" />
        <span :class="selected ? 'hidden md:inline' : ''">{{ guestInitials }}</span>

        <!-- Invitation status, mobile only. The pill this replaces cost ~83px
             of a ~260px badge row and pushed most rows onto a second line; as
             a corner dot it costs nothing and says *more* — the pill collapsed
             sent and viewed into one "Sent" label and drew nothing at all for
             not-yet-sent. The three colours are the ones GuestStatsCard's
             donut legend already teaches at the top of this panel, so the key
             is on screen. Hidden while selected: the avatar is a checkmark
             then, and a status dot on it reads as a second control. -->
        <span
          v-if="!selected"
          class="md:hidden absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white"
          :class="invitationDot.dotClass"
          aria-hidden="true"
        ></span>
      </button>

      <!-- Guest Info (grows to fill space; part of the card's tap target —
           renaming happens in the edit modal).

           Two lines on a phone, where the name needs the full width. From `lg`
           up it becomes one line and the badges move out onto the row's own
           axis: the panel is ~1024px there, so a stacked card left everything
           bunched at the left edge with a few hundred pixels of nothing before
           the actions. `lg:ml-auto` on the badge cluster parks it against the
           actions, which also gives every row's badges a common right edge to
           scan down. -->
      <div class="flex-1 min-w-0 lg:flex lg:items-center lg:gap-3">
        <p class="font-semibold text-slate-900 truncate lg:flex-shrink lg:min-w-0">{{ guest.name }}</p>

        <!-- The dot's meaning in words, so the state is never colour-only.
             It lives here rather than inside the avatar button because that
             button carries an explicit `aria-label`, which would override
             any text nested in it. Mobile only: from `md` up the visible
             "Sent" pill below already says it, and both would be read out. -->
        <span class="md:hidden sr-only">{{ invitationDot.label }}</span>

        <!-- Badges: under the name on a phone, on the same line from `lg` -->
        <div class="flex items-center gap-1.5 mt-1 flex-wrap lg:mt-0 lg:ml-auto lg:flex-nowrap lg:flex-shrink-0">
          <!-- Group badge (click/tap to reassign) -->
          <button
            v-if="guest.group_details"
            ref="groupBadgeRef"
            type="button"
            @click.stop="toggleGroupPopover"
            class="relative inline-flex items-center gap-1.5 px-2 py-1 md:py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors after:absolute after:-inset-y-2.5 after:inset-x-0 after:content-[''] md:after:hidden"
            :title="t('management.guestGroupsView.guestListItem.changeGroupHint')"
          >
            <span
              class="w-1.5 h-1.5 rounded-full flex-shrink-0"
              :style="{ backgroundColor: guest.group_details.color || '#64748b' }"
            ></span>
            <!-- Tighter cap below `md`, where the badge row has ~217px to
                 hold the group and the RSVP reply on one line. -->
            <span class="truncate max-w-[72px] md:max-w-[80px]">{{ guest.group_details.name }}</span>
            <ChevronDown class="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
          </button>

          <!-- Sent status badge. Desktop only — on mobile this is the avatar's
               corner dot above, which is what keeps the badge row to one line. -->
          <div
            v-if="guest.invitation_status === 'sent' || guest.invitation_status === 'viewed'"
            class="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium"
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
            <!-- The glyph is redundant with the label it sits beside — the
                 badge is never colour-only — so mobile spends those ~16px on
                 keeping the row to one line instead. -->
            <component :is="rsvpBadge.icon" class="hidden md:block w-3 h-3" />
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
            <span class="truncate max-w-[6.25rem]">{{ guest.table_details.name }}<template v-if="guest.seat_number"> · {{ guest.seat_number }}</template></span>
          </div>
        </div>
      </div>

      <!-- Mobile Copy Link Button (right side) -->
      <button
        @click.stop="handleMobileCopyLink"
        class="md:hidden relative px-3 py-1.5 text-xs font-semibold flex-shrink-0 rounded-full transition-all duration-200 after:absolute after:-inset-y-2 after:inset-x-0 after:content-['']"
        :class="showCopiedFeedback
          ? 'text-green-700 bg-green-100'
          : 'text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300'"
      >
        {{ showCopiedFeedback ? t('management.guestGroupsView.guestListItem.copied') : t('management.guestGroupsView.guestListItem.copy') }}
      </button>

      <!-- Actions (hidden on mobile; revealed on row hover / keyboard focus on desktop) -->
      <div
        class="hidden md:flex items-center gap-0.5 flex-shrink-0 transition-opacity duration-150"
        :class="showLinkMenu || showCopiedFeedback ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'"
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

        <!-- Copy Link with smart dropdown. After a copy the icon flips to a
             tick for a beat — the confirmation lands on the control that was
             pressed instead of as a toast on the far side of the screen. -->
        <div class="relative" ref="linkMenuContainer">
          <button
            ref="linkButton"
            @click.stop="toggleLinkMenu"
            :title="showCopiedFeedback
              ? t('management.guestGroupsView.guestListItem.copied')
              : t('management.guestGroupsView.guestListItem.copyLink')"
            class="p-2 rounded-xl transition-colors duration-150"
            :class="showCopiedFeedback
              ? 'text-green-600 bg-green-50'
              : showLinkMenu
                ? 'bg-slate-100 text-slate-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'"
          >
            <Check v-if="showCopiedFeedback" class="w-4 h-4" />
            <Link v-else class="w-4 h-4" />
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
} from 'lucide-vue-next'
import type { EventGuest, GuestGroup } from '../../services/api'
import { useActionConfirmation } from '../../composables/useActionConfirmation'

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
  /**
   * `silent` suppresses the parent's success toast — this row confirms the copy
   * in place, on the control that was pressed, and a toast on top of that is the
   * same news twice. Failures still toast: an in-place tick can't report one.
   */
  'copy-link': [guest: EventGuest, language: 'en' | 'kh', silent?: boolean]
  'mark-sent': [guest: EventGuest]
  edit: [guest: EventGuest]
  delete: [guest: EventGuest]
  'toggle-select': [guest: EventGuest]
  'update-group': [guest: EventGuest, groupId: number]
}>()

// Local state
const showLinkMenu = ref(false)
const linkMenuContainer = ref<HTMLElement | null>(null)
const linkButton = ref<HTMLElement | null>(null)
const dropdownMenu = ref<HTMLElement | null>(null)
const dropdownPosition = ref<'top' | 'bottom'>('bottom')
const dropdownStyle = ref<Record<string, string>>({})
const { confirmed: showCopiedFeedback, confirm: flashCopied } = useActionConfirmation()

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

// Mobile: tapping the card (outside the inline-edit/badge/copy targets, which
// stop propagation) opens the full edit modal — replaces the old chevron button.
// Desktop keeps its hover action icons, so the card itself stays inert there.
const handleCardTap = () => {
  if (window.matchMedia('(min-width: 768px)').matches) return
  emit('edit', props.guest)
}

/**
 * Copying a guest link is the most repeated action on this screen, and the
 * answer people need — "it went in" — belongs under their finger, not in a bar
 * somewhere else on the page. Both call sites therefore emit `silent`.
 */
const handleMobileCopyLink = () => {
  emit('copy-link', props.guest, 'kh', true)
  flashCopied()
}

/**
 * Invitation status as the avatar's corner dot (mobile).
 *
 * The three colours are deliberately the ones GuestStatsCard uses for its
 * donut legend — emerald `viewed`, sky `awaiting`, slate `pending` — so the
 * band at the top of the panel doubles as this dot's key and nothing has to
 * be learned twice. The dot is `aria-hidden`; the label beside it carries the
 * meaning for assistive tech, so the state is never colour-only.
 */
const invitationDot = computed(() => {
  if (props.guest.invitation_status === 'viewed') {
    return {
      dotClass: 'bg-emerald-600',
      label: t('management.guestGroupsView.guestListItem.invitationViewed'),
    }
  }
  if (props.guest.invitation_status === 'sent') {
    return {
      dotClass: 'bg-sky-600',
      label: t('management.guestGroupsView.guestListItem.invitationSent'),
    }
  }
  return {
    dotClass: 'bg-slate-300',
    label: t('management.guestGroupsView.guestListItem.invitationNotSent'),
  }
})

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
  emit('copy-link', props.guest, language, true)
  closeDropdown()
  flashCopied()
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
