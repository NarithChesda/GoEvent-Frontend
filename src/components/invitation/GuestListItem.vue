<template>
  <!-- A row in a grouped list, not a card in a tray.
       Every guest used to be its own `rounded-2xl` white card, ringed and
       lifting on hover, stacked on a faint tray inside the panel's own white
       card — three surfaces deep, which is the card-in-card failure the taste
       skill names: nothing is separable from its own parent. A guest list is
       a list, so the rows are hairline-divided by the surface that holds them
       and carry no elevation of their own. Selection tints the row; hover
       tints it more faintly. -->
  <div
    class="group relative flex items-center gap-2.5 px-3 py-2.5 sm:px-4 transition-colors duration-150"
    :class="[
      selected ? 'bg-sky-50' : 'hover:bg-slate-50',
      canEdit ? 'cursor-pointer' : '',
    ]"
    @click="handleRowPress"
  >
    <!-- Selection, and nothing else.
         There is no avatar here any more. It held two-letter initials of the
         name printed 12px to its right, on a disc tinted with the group colour
         that the value column states again — so it spent 36px and a hue per
         row to repeat two things the row already said, and a column of forty
         differently-tinted discs was the loudest thing on the screen. A guest
         list is a list of names typed by the organiser; no photograph will
         ever arrive to fill that disc, so it was never a placeholder for
         anything.

         Nor is there a checkbox on every row any more. A box that is empty on
         every row until a mode exists is forty unlabelled controls that all
         mean nothing, and the mode has a much larger target available to it:
         the row itself. Pressing the free space — beside the name, around the
         values — selects; pressing the name opens the guest.

         What sits here is the *state*, not the control: blank while the row is
         idle, an outline on hover so a pointer user learns what the press
         does, a filled tick once picked. It keeps its width in every state so
         no name moves when a row is chosen. It is a real button as well, which
         is what gives the row a keyboard path to the same action. -->
    <button
      v-if="canEdit"
      type="button"
      role="checkbox"
      :aria-checked="selected"
      @click.stop="$emit('toggle-select', guest)"
      class="relative flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full transition-[background-color,border-color,opacity] duration-150 ease-out after:absolute after:-inset-2.5 after:content-[''] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
      :class="selected
        ? 'border border-sky-500 bg-sky-500 text-white'
        : 'border border-slate-300 opacity-0 group-hover:opacity-100 focus-visible:opacity-100'"
      :title="t('management.guestGroupsView.guestListItem.selectHint')"
      :aria-label="`${t('management.guestGroupsView.guestListItem.selectHint')} - ${guest.name}`"
    >
      <Check v-if="selected" class="h-3 w-3" />
    </button>

    <!-- Name, and the value column beside it.
         Two lines on a phone, where the name needs the full width; one line
         from `lg`, where the values park against the actions so every row's
         cluster shares a right edge to scan down. -->
    <div class="min-w-0 flex-1 lg:flex lg:items-center lg:gap-3">
      <!-- The name opens the guest; the space around it selects.
           Two behaviours in one region only works if the boundary between them
           is drawn, so the name underlines on its own hover — the row is
           already tinting at that moment, and the underline is what says the
           press will land on *this* rather than on the row. Without it the two
           targets would be indistinguishable, which is the reason the name was
           inert for one iteration. -->
      <component
        :is="canEdit ? 'button' : 'span'"
        :type="canEdit ? 'button' : undefined"
        @click.stop="canEdit && $emit('edit', guest)"
        class="block w-full min-w-0 truncate rounded text-left text-sm font-medium text-slate-900 decoration-slate-300 underline-offset-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 lg:w-auto lg:flex-shrink"
        :class="canEdit ? 'hover:underline' : ''"
        :title="canEdit ? t('management.guestGroupsView.guestListItem.editGuest') : undefined"
      >
        {{ guest.name }}
      </component>

      <!-- Value column: muted facts, one accent.
           These were five filled pills — group, Sent, RSVP, gift, table — so a
           well-filled row rendered as a run of coloured lozenges with the name
           lost at the left of it. Only the RSVP reply keeps colour, being the
           one genuinely semantic status here; the rest are quiet text with a
           leading glyph, which is what a value column is. -->
      <div
        class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs lg:mt-0 lg:ml-auto lg:flex-nowrap lg:justify-end"
      >
        <!-- Group (press to reassign) -->
        <component
          :is="canEdit ? 'button' : 'span'"
          v-if="guest.group_details"
          ref="groupBadgeRef"
          :type="canEdit ? 'button' : undefined"
          @click.stop="canEdit && toggleGroupPopover()"
          class="relative -mx-1 inline-flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-slate-500 transition-colors after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] md:after:hidden"
          :class="canEdit ? 'hover:bg-slate-200/60 hover:text-slate-700' : ''"
          :title="canEdit ? t('management.guestGroupsView.guestListItem.changeGroupHint') : undefined"
        >
          <span
            class="h-1.5 w-1.5 flex-shrink-0 rounded-full"
            :style="{ backgroundColor: guest.group_details.color || '#64748b' }"
          ></span>
          <span class="truncate">{{ guest.group_details.name }}</span>
          <ChevronDown v-if="canEdit" class="h-2.5 w-2.5 flex-shrink-0 text-slate-400" />
        </component>

        <!-- RSVP reply — the one coloured thing on the row. -->
        <span
          v-if="rsvpBadge"
          class="inline-flex items-center gap-1 font-medium"
          :class="rsvpBadge.textClass"
          :title="rsvpBadge.title"
        >
          {{ rsvpBadge.label }}
          <span v-if="rsvpBadge.plusOnes" class="tabular-nums opacity-70">+{{ rsvpBadge.plusOnes }}</span>
        </span>

        <!-- Seat -->
        <span
          v-if="guest.table_details"
          class="inline-flex min-w-0 items-center gap-1 text-slate-500"
          :title="guest.seat_number
            ? t('management.guestGroupsView.guestListItem.seatedAtWithSeat', { table: guest.table_details.name, seat: guest.seat_number })
            : t('management.guestGroupsView.guestListItem.seatedAt', { table: guest.table_details.name })"
        >
          <Armchair class="h-3 w-3 flex-shrink-0 text-slate-400" />
          <span class="truncate">{{ guest.table_details.name }}<template v-if="guest.seat_number"> · {{ guest.seat_number }}</template></span>
        </span>

        <!-- Cash gift -->
        <span v-if="guest.cash_gift_amount" class="inline-flex items-center gap-1 tabular-nums text-slate-500">
          <Coins class="h-3 w-3 flex-shrink-0 text-slate-400" />
          {{ formatCurrency(guest.cash_gift_amount, guest.cash_gift_currency) }}
        </span>
      </div>
    </div>

    <!-- Invitation status, in its own fixed slot rather than as a dot on the
         avatar that is no longer there.

         Shape, not colour. Three coloured dots meant a column of forty green
         circles once the invitations were out — a mark that is identical on
         nine rows in ten carries no information and is only weight. A single
         tick for sent and a double tick for opened is the receipt idiom the
         organiser is already living in, since these links go out over
         Messenger; drawn in the same slate as the seat and gift glyphs beside
         them, they read as a quiet column you can scan for the gaps.

         The slot keeps its width when there is nothing to draw, so the ticks
         line up down the list instead of drifting with each row's values. -->
    <div
      class="flex w-4 flex-shrink-0 items-center justify-center"
      :title="invitationState.label"
    >
      <component
        :is="invitationState.icon"
        v-if="invitationState.icon"
        class="h-4 w-4 text-slate-400"
        aria-hidden="true"
      />
      <span class="sr-only">{{ invitationState.label }}</span>
    </div>

    <!-- Trailing accessories: the row's one action, and everything else.
         Four icons that faded in on hover meant a desktop row looked inert
         until the mouse crossed it, and a phone got a different set entirely.
         Copying a link is what this screen is *for*, so it stays visible at
         every width; the rest — mark sent, edit, delete, the other language —
         disclose from one button, so the trailing rail is two fixed slots on
         every row instead of a variable run of icons. -->
    <div class="flex flex-shrink-0 items-center gap-0.5">
      <button
        @click.stop="handleQuickCopy"
        :title="showCopiedFeedback
          ? t('management.guestGroupsView.guestListItem.copied')
          : t('management.guestGroupsView.guestListItem.copyLink')"
        :aria-label="t('management.guestGroupsView.guestListItem.copyLink')"
        class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150"
        :class="showCopiedFeedback
          ? 'bg-emerald-50 text-emerald-600'
          : 'text-slate-400 hover:bg-slate-200/60 hover:text-slate-700'"
      >
        <Check v-if="showCopiedFeedback" class="h-4 w-4" />
        <Link v-else class="h-4 w-4" />
      </button>

      <button
        ref="menuButton"
        @click.stop="toggleActionMenu"
        :title="t('management.guestGroupsView.guestListItem.moreActions')"
        :aria-label="`${t('management.guestGroupsView.guestListItem.moreActions')} - ${guest.name}`"
        :aria-expanded="showActionMenu"
        class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150"
        :class="showActionMenu ? 'bg-slate-200/70 text-slate-700' : 'text-slate-400 hover:bg-slate-200/60 hover:text-slate-700'"
      >
        <MoreHorizontal class="h-4 w-4" />
      </button>
    </div>
  </div>

  <!-- Action menu, teleported out of the list's own overflow -->
  <Teleport to="body">
    <Transition name="dropdown">
      <div
        v-if="showActionMenu"
        ref="menuEl"
        :style="menuStyle"
        class="fixed z-[9999] overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-lg shadow-slate-200/50"
        role="menu"
        @click.stop
      >
        <div class="p-1">
          <button
            v-for="action in menuActions"
            :key="action.key"
            type="button"
            role="menuitem"
            @click="action.run()"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors"
            :class="action.destructive ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'"
          >
            <component
              :is="action.icon"
              class="h-3.5 w-3.5 flex-shrink-0"
              :class="action.destructive ? '' : 'text-slate-400'"
            />
            <span class="truncate">{{ action.label }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Group-reassignment popover, teleported for the same reason -->
  <Teleport to="body">
    <Transition name="dropdown">
      <div
        v-if="showGroupPopover"
        ref="groupPopoverMenu"
        :style="groupPopoverStyle"
        class="fixed z-[9999] overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-lg shadow-slate-200/50"
        @click.stop
      >
        <div class="custom-scrollbar max-h-64 overflow-y-auto p-1">
          <button
            v-for="group in groups"
            :key="group.id"
            type="button"
            @click="selectGroup(group.id)"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors"
            :class="group.id === guest.group ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-700 hover:bg-slate-50'"
          >
            <span
              class="h-2 w-2 flex-shrink-0 rounded-full"
              :style="{ backgroundColor: group.color || '#64748b' }"
            ></span>
            <span class="min-w-0 flex-1 truncate">{{ group.name }}</span>
            <Check v-if="group.id === guest.group" class="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Trash2,
  Send,
  Edit2,
  Coins,
  Link,
  Globe,
  Check,
  CheckCheck,
  Armchair,
  ChevronDown,
  MoreHorizontal,
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
}

const props = withDefaults(
  defineProps<{
    guest: EventGuest
    selected?: boolean
    groups: GuestGroup[]
    /**
     * Whether this row may be changed. `false` on a view-only share link,
     * where the holder is working *from* the list rather than on it: the name
     * stays readable, the copy control stays (that is the whole point of a
     * view link), and everything that writes is gone rather than disabled —
     * a row of dead icons reads as a bug, not as a permission.
     */
    canEdit?: boolean
  }>(),
  { canEdit: true },
)

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

const { confirmed: showCopiedFeedback, confirm: flashCopied } = useActionConfirmation()

// Action menu state
const showActionMenu = ref(false)
const menuButton = ref<HTMLElement | null>(null)
const menuEl = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

// Inline group-reassignment popover state
const showGroupPopover = ref(false)
const groupBadgeRef = ref<HTMLElement | null>(null)
const groupPopoverMenu = ref<HTMLElement | null>(null)
const groupPopoverStyle = ref<Record<string, string>>({})

const dropdownManager = DropdownManager.getInstance()

/**
 * Pressing the row's free space selects it — the row *is* the checkbox, which
 * is why there is no longer one on each of them. Everything with a meaning of
 * its own (the name, the group chip, copy, the ⋯ menu) stops the event first.
 *
 * The guard is for the one case where a click is not a press: dragging across
 * a guest's name to copy it ends in a click event, and without this that
 * gesture would silently put the guest into a selection. A collapsed selection
 * means nothing was highlighted, so a plain click still passes.
 */
const handleRowPress = () => {
  if (!props.canEdit) return
  const selection = typeof window !== 'undefined' ? window.getSelection() : null
  if (selection && !selection.isCollapsed) return
  emit('toggle-select', props.guest)
}

/**
 * Invitation status, as a receipt tick rather than a coloured dot.
 *
 * `not_sent` draws nothing — it is the state the whole list starts in, and a
 * mark on every row at that point says only "this is a guest list". The glyph
 * is always accompanied by its `sr-only` label, and the empty state has a
 * label too, so nothing here depends on seeing the tick.
 */
const invitationState = computed(() => {
  if (props.guest.invitation_status === 'viewed') {
    return {
      icon: CheckCheck,
      label: t('management.guestGroupsView.guestListItem.invitationViewed'),
    }
  }
  if (props.guest.invitation_status === 'sent') {
    return {
      icon: Check,
      label: t('management.guestGroupsView.guestListItem.invitationSent'),
    }
  }
  return {
    icon: null,
    label: t('management.guestGroupsView.guestListItem.invitationNotSent'),
  }
})

// RSVP reply — hidden for `pending` (the default), where the absence of a value
// already says "no response yet".
const rsvpBadge = computed(() => {
  const status = props.guest.rsvp_status
  if (!status || status === 'pending') return null

  const plusOnes = props.guest.plus_ones_count ?? 0
  const baseTitle = props.guest.rsvp_status_display || status

  if (status === 'attending') {
    return {
      label: t('management.guestGroupsView.guestListItem.rsvp.going'),
      textClass: 'text-emerald-600',
      title: baseTitle,
      plusOnes,
    }
  }

  if (status === 'maybe') {
    return {
      label: t('management.guestGroupsView.guestListItem.rsvp.maybe'),
      textClass: 'text-amber-600',
      title: baseTitle,
      plusOnes,
    }
  }

  return {
    label: t('management.guestGroupsView.guestListItem.rsvp.declined'),
    textClass: 'text-rose-600',
    title: baseTitle,
    plusOnes: 0,
  }
})

interface MenuAction {
  key: string
  label: string
  icon: Component
  destructive?: boolean
  run: () => void
}

/**
 * Everything the row can do that isn't the copy button.
 *
 * The two languages are explicit entries here because the visible button copies
 * the default one straight away — it is the most repeated action on the screen
 * and should not cost a menu — while the menu is where you go for the other one.
 */
const menuActions = computed<MenuAction[]>(() => {
  const actions: MenuAction[] = [
    {
      key: 'copy-kh',
      label: t('management.guestGroupsView.guestListItem.copyLinkKh'),
      icon: Globe,
      run: () => copyAndClose('kh'),
    },
    {
      key: 'copy-en',
      label: t('management.guestGroupsView.guestListItem.copyLinkEn'),
      icon: Globe,
      run: () => copyAndClose('en'),
    },
  ]

  if (!props.canEdit) return actions

  if (props.guest.invitation_status === 'not_sent') {
    actions.push({
      key: 'mark-sent',
      label: t('management.guestGroupsView.guestListItem.markAsSent'),
      icon: Send,
      run: () => {
        closeActionMenu()
        emit('mark-sent', props.guest)
      },
    })
  }

  actions.push(
    {
      key: 'edit',
      label: t('management.guestGroupsView.guestListItem.editGuest'),
      icon: Edit2,
      run: () => {
        closeActionMenu()
        emit('edit', props.guest)
      },
    },
    {
      key: 'delete',
      label: t('management.guestGroupsView.guestListItem.deleteGuest'),
      icon: Trash2,
      destructive: true,
      run: () => {
        closeActionMenu()
        emit('delete', props.guest)
      },
    },
  )

  return actions
})

/**
 * Copying a guest link is the most repeated action on this screen, and the
 * answer people need — "it went in" — belongs under their finger, not in a bar
 * somewhere else on the page. Both call sites therefore emit `silent`.
 */
const handleQuickCopy = () => {
  emit('copy-link', props.guest, 'kh', true)
  flashCopied()
}

const copyAndClose = (language: 'en' | 'kh') => {
  closeActionMenu()
  emit('copy-link', props.guest, language, true)
  flashCopied()
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

/** Places a teleported popover against its trigger, flipping above when the
 *  space below is short and clamping to the viewport on both edges. */
const positionAgainst = (
  anchor: HTMLElement | null,
  width: number,
  height: number,
  align: 'left' | 'right',
) => {
  if (!anchor) return null

  const rect = anchor.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const showAbove = spaceBelow < height && rect.top > height

  const top = showAbove ? rect.top - height - 4 : rect.bottom + 4
  let left = align === 'right' ? rect.right - width : rect.left

  if (left < 8) left = 8
  if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8

  return { top: `${top}px`, left: `${left}px`, width: `${width}px` }
}

const closeActionMenu = () => {
  showActionMenu.value = false
}

const toggleActionMenu = () => {
  if (showActionMenu.value) {
    closeActionMenu()
    return
  }
  dropdownManager.register(closeActionMenu)
  showActionMenu.value = true
  setTimeout(() => {
    const style = positionAgainst(menuButton.value, 200, menuActions.value.length * 36 + 8, 'right')
    if (style) menuStyle.value = style
  }, 0)
}

const closeGroupPopover = () => {
  showGroupPopover.value = false
}

const toggleGroupPopover = () => {
  if (showGroupPopover.value) {
    closeGroupPopover()
    return
  }
  dropdownManager.register(closeGroupPopover)
  showGroupPopover.value = true
  setTimeout(() => {
    const height = Math.min(props.groups.length * 36 + 8, 272)
    const style = positionAgainst(groupBadgeRef.value, 220, height, 'left')
    if (style) groupPopoverStyle.value = style
  }, 0)
}

const selectGroup = (groupId: number) => {
  closeGroupPopover()
  if (groupId === props.guest.group) return
  emit('update-group', props.guest, groupId)
}

const handleGlobalClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement

  if (
    showActionMenu.value &&
    !menuButton.value?.contains(target) &&
    !menuEl.value?.contains(target)
  ) {
    closeActionMenu()
  }

  if (
    showGroupPopover.value &&
    !groupBadgeRef.value?.contains(target) &&
    !groupPopoverMenu.value?.contains(target)
  ) {
    closeGroupPopover()
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  closeActionMenu()
  closeGroupPopover()
}

onMounted(() => {
  if (typeof window === 'undefined') return
  document.addEventListener('click', handleGlobalClick)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', handleGlobalClick)
    document.removeEventListener('keydown', handleEscape)
  }
  dropdownManager.unregister(closeActionMenu)
  dropdownManager.unregister(closeGroupPopover)
})
</script>

<style scoped>
/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease-out,
    transform 0.15s ease-out;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: opacity 0.01ms;
  }
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
