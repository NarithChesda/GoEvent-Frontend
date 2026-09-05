<template>
  <!-- A row in a grouped list, not a card in a tray.
       Every guest used to be its own `rounded-2xl` white card, ringed and
       lifting on hover, stacked on a faint tray inside the panel's own white
       card — three surfaces deep, which is the card-in-card failure the taste
       skill names: nothing is separable from its own parent. A guest list is
       a list, so the rows are hairline-divided by the surface that holds them
       and carry no elevation of their own. Selection tints the row; hover
       tints it more faintly.

       On a phone the row is also a swipe host: the tray of actions is laid
       *under* the row, and the row itself carries an opaque background so that
       at rest the tray is simply occluded rather than hidden by a clip. That
       matters because two of this row's touch targets grow their hit area with
       negative-inset pseudo-elements, and an `overflow: hidden` here would
       shave them back off.

       `overflow-x: clip` is what keeps a swiped row inside the card. `hidden`
       cannot: setting it on one axis forces the other to `auto`, which would
       trim exactly those hit areas — `clip` is the one value that leaves the
       cross axis genuinely visible. The card itself cannot do this job any
       more, because below `sm` it has given up its own clip so that its header
       can stick. -->
  <div class="relative" :class="mobile ? 'overflow-x-clip bg-white' : ''">
    <!-- The swipe tray. Two actions, always the same two, because a tray whose
         contents depend on the guest cannot be learned — the muscle memory for
         "second block is delete" is the entire value of the gesture. Everything
         else this row can do lives in the sheet a tap opens.

         It exists only while the row is actually off its mark. Kept mounted at
         rest it is two more buttons on every one of several hundred rows, and —
         because a row's height is rarely a whole number of device pixels — the
         half-pixel the row's own background fails to cover showed as a rose
         hairline under every row in the list. -->
    <div
      v-if="mobile && canEdit && (swipe.dragging.value || swipe.offset.value !== 0)"
      class="absolute inset-y-0 right-0 flex"
      :class="swipe.isOpen.value ? '' : 'pointer-events-none'"
      aria-hidden="true"
    >
      <button
        v-for="action in trayActions"
        :key="action.key"
        type="button"
        tabindex="-1"
        @click.stop="action.run()"
        class="flex w-[4.5rem] flex-col items-center justify-center gap-1 text-[11px] font-medium text-white transition-[filter] duration-150 active:brightness-90"
        :class="action.surface"
      >
        <component :is="action.icon" class="h-[1.125rem] w-[1.125rem]" />
        {{ action.label }}
      </button>
    </div>

    <div
      class="group relative flex items-center gap-2.5 px-3 py-3 transition-colors duration-150 sm:px-4 sm:py-2.5"
      :class="[
        selected ? 'bg-sky-50' : mobile ? 'bg-white' : 'hover:bg-slate-50',
        canEdit || mobile ? 'cursor-pointer' : '',
        mobile ? 'select-none' : '',
        !selected && mobile && canEdit ? 'active:bg-slate-100' : '',
      ]"
      :style="rowStyle"
      @click="handleRowPress"
      @contextmenu="handleContextMenu"
      v-on="pointerHandlers"
    >
      <!-- Selection, and nothing else.
           There is no avatar here any more. It held two-letter initials of the
           name printed 12px to its right, on a disc tinted with the group colour
           that the value column states again — so it spent 36px and a hue per
           row to repeat two things the row already said, and a column of forty
           differently-tinted discs was the loudest thing on the screen.

           Nor is there a permanent checkbox. What sits here is the *state*, not
           the control: blank while the row is idle, an outline on hover so a
           pointer user learns what the press does, a filled tick once picked.

           A phone has no hover to learn from, so on touch the slot collapses to
           nothing until selection is actually a mode — entered by holding a row
           or from the row's own sheet — and then opens on every row at once,
           which is the moment the marks mean something. It animates its own
           width rather than fading in place, so the names slide over as one
           and the list visibly changes mode. -->
      <div
        v-if="canEdit"
        class="flex-shrink-0 transition-[width,opacity] duration-[240ms] ease-out"
        :class="[
          showSelectionSlot ? 'w-4 opacity-100' : 'w-0 opacity-0',
          mobile ? 'overflow-hidden' : '',
        ]"
      >
        <button
          type="button"
          role="checkbox"
          :aria-checked="selected"
          :tabindex="showSelectionSlot ? 0 : -1"
          @click.stop="$emit('toggle-select', guest)"
          class="relative flex h-4 w-4 items-center justify-center rounded-full transition-[background-color,border-color,opacity] duration-150 ease-out after:absolute after:-inset-2.5 after:content-[''] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          :class="selected
            ? 'border border-sky-500 bg-sky-500 text-white'
            : selectionMode
              ? 'border border-slate-300'
              : 'border border-slate-300 opacity-0 group-hover:opacity-100 focus-visible:opacity-100'"
          :title="t('management.guestGroupsView.guestListItem.selectHint')"
          :aria-label="`${t('management.guestGroupsView.guestListItem.selectHint')} - ${guest.name}`"
        >
          <Check v-if="selected" class="h-3 w-3" />
        </button>
      </div>

      <!-- Name, and the value column beside it.
           Two lines on a phone, where the name needs the full width; one line
           from `lg`, where the values park against the actions so every row's
           cluster shares a right edge to scan down. -->
      <div class="min-w-0 flex-1 lg:flex lg:items-center lg:gap-3">
        <!-- The name opens the guest; the space around it selects.
             Two behaviours in one region only works if the boundary between them
             is drawn, so the name underlines on its own hover — the row is
             already tinting at that moment, and the underline is what says the
             press will land on *this* rather than on the row.

             None of that applies on a phone, where there is no hover to draw the
             boundary with and the row has one unambiguous meaning of its own. So
             on touch the name is not a separate target: it is text, and the row
             beneath it is the button. -->
        <component
          :is="canEdit && !mobile ? 'button' : 'span'"
          :type="canEdit && !mobile ? 'button' : undefined"
          @click="!mobile && canEdit && onNameClick($event)"
          class="block w-full min-w-0 truncate rounded text-left text-[0.9375rem] font-medium leading-tight text-slate-900 sm:leading-5 decoration-slate-300 underline-offset-[3px] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:text-sm lg:w-auto lg:flex-shrink"
          :class="canEdit && !mobile ? 'hover:underline' : ''"
          :title="canEdit && !mobile ? t('management.guestGroupsView.guestListItem.editGuest') : undefined"
        >
          {{ guest.name }}
        </component>

        <!-- Value column: muted facts, one accent.
             These were five filled pills — group, Sent, RSVP, gift, table — so a
             well-filled row rendered as a run of coloured lozenges with the name
             lost at the left of it. Only the RSVP reply keeps colour, being the
             one genuinely semantic status here; the rest are quiet text with a
             leading glyph, which is what a value column is.

             On a phone this line never wraps. Wrapping made a row's height a
             function of how much happened to be known about that guest — a
             guest with a gift stood three lines tall next to a neighbour's two —
             and a list whose rows are all different heights cannot be scanned.
             So the line clips, and the *group* is the one thing allowed to
             truncate: it is already stated by the colour of its own dot, while
             a half-printed reply or a half-printed amount is just wrong. -->
        <div
          class="mt-1 flex items-center gap-x-2.5 gap-y-1 text-xs lg:mt-0 lg:ml-auto lg:flex-nowrap lg:justify-end"
          :class="mobile ? 'flex-nowrap overflow-hidden' : 'flex-wrap'"
        >
          <!-- Group (press to reassign) -->
          <component
            :is="canEdit ? 'button' : 'span'"
            v-if="guest.group_details"
            ref="groupBadgeRef"
            :type="canEdit ? 'button' : undefined"
            @click.stop="canEdit && toggleGroupPopover()"
            class="relative -mx-1 inline-flex min-w-0 flex-shrink items-center gap-1.5 rounded-md px-1 py-0.5 text-slate-500 transition-colors after:absolute after:inset-x-0 after:-inset-y-2 after:content-[''] md:after:hidden"
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
            class="inline-flex flex-shrink-0 items-center gap-1 font-medium"
            :class="rsvpBadge.textClass"
            :title="rsvpBadge.title"
          >
            {{ rsvpBadge.label }}
            <span v-if="rsvpBadge.plusOnes" class="tabular-nums opacity-70">+{{ rsvpBadge.plusOnes }}</span>
          </span>

          <!-- Seat. Not on a phone: four facts do not fit ~300px, and the one
               that gave way was the group — crushed to a single letter and an
               ellipsis, which is not a shorter label but a broken one. The seat
               is the fact to drop because it is the only one with a whole screen
               of its own (Table Seating), and it is still stated in full on the
               guest's own sheet. -->
          <span
            v-if="guest.table_details && !mobile"
            class="inline-flex min-w-0 flex-shrink-0 items-center gap-1 text-slate-500"
            :title="guest.seat_number
              ? t('management.guestGroupsView.guestListItem.seatedAtWithSeat', { table: guest.table_details.name, seat: guest.seat_number })
              : t('management.guestGroupsView.guestListItem.seatedAt', { table: guest.table_details.name })"
          >
            <Armchair class="h-3 w-3 flex-shrink-0 text-slate-400" />
            <span class="truncate">{{ guest.table_details.name }}<template v-if="guest.seat_number"> · {{ guest.seat_number }}</template></span>
          </span>

          <!-- Cash gift -->
          <span v-if="guest.cash_gift_amount" class="inline-flex flex-shrink-0 items-center gap-1 tabular-nums text-slate-500">
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

      <!-- Trailing accessories.
           Copying a link is what this screen is *for*, so it stays visible at
           every width. Everything else discloses from the ⋯ button — except on
           a phone, where the ⋯ is gone: two 44px targets side by side at the
           edge of a 360px row is most of the space the name needs, and the row
           itself is a far larger target for the same menu. So on touch the rail
           is one button, the row opens the sheet, and the swipe is the shortcut
           past it. -->
      <div class="flex flex-shrink-0 items-center gap-0.5">
        <button
          @click.stop="handleQuickCopy"
          :title="showCopiedFeedback
            ? t('management.guestGroupsView.guestListItem.copied')
            : t('management.guestGroupsView.guestListItem.copyLink')"
          :aria-label="t('management.guestGroupsView.guestListItem.copyLink')"
          class="flex h-11 w-11 items-center justify-center rounded-xl transition-[background-color,color,transform] duration-150 active:scale-[0.92] sm:h-9 sm:w-9 sm:rounded-lg sm:active:scale-100"
          :class="showCopiedFeedback
            ? 'bg-emerald-50 text-emerald-600'
            : 'text-slate-400 hover:bg-slate-200/60 hover:text-slate-700'"
        >
          <Check v-if="showCopiedFeedback" class="h-4 w-4" />
          <Link v-else class="h-4 w-4" />
        </button>

        <button
          v-if="!mobile"
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
  </div>

  <!-- Action menu, teleported out of the list's own overflow -->
  <Teleport to="body">
    <Transition name="dropdown">
      <div
        v-if="showActionMenu && !mobile"
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

  <!-- The same menu as an action sheet, which is what a phone gets instead.
       A 200px popover pinned to a 36px glyph is a desktop object: it lands
       wherever the row happens to be, its rows are half a thumb tall, and it
       has to be dismissed by hitting the sliver of page around it. The sheet
       comes from the bottom of the screen, names the guest it is acting on,
       and puts every row under the thumb that opened it. -->
  <MobileBottomSheet
    :show="showActionMenu && mobile"
    :title="guest.name"
    prominent-title
    @close="closeActionMenu"
  >
    <div class="pb-2 pt-1">
      <!-- What is known about this guest, said once and in full — including the
           seat, which the row itself gives up to keep the group legible. The
           sheet's own title is the name, so this is everything else. -->
      <p v-if="sheetFacts.length" class="px-5 pb-2.5 text-[13px] leading-relaxed text-slate-500">
        <template v-for="(fact, i) in sheetFacts" :key="fact">
          <span v-if="i > 0" aria-hidden="true"> · </span>{{ fact }}
        </template>
      </p>

      <template v-for="(action, index) in menuActions" :key="action.key">
        <div v-if="action.destructive && index > 0" class="mx-5 my-1 border-t border-slate-100"></div>
        <button
          type="button"
          @click="action.run()"
          class="flex w-full items-center gap-3.5 px-5 py-3.5 text-left text-[0.9375rem] transition-colors active:bg-slate-50"
          :class="action.destructive ? 'text-red-600' : 'text-slate-800'"
        >
          <component
            :is="action.icon"
            class="h-[1.125rem] w-[1.125rem] flex-shrink-0"
            :class="action.destructive ? '' : 'text-slate-400'"
          />
          <span class="min-w-0 flex-1 truncate font-medium">{{ action.label }}</span>
        </button>
      </template>
    </div>
  </MobileBottomSheet>

  <!-- Group-reassignment popover, teleported for the same reason -->
  <Teleport to="body">
    <Transition name="dropdown">
      <div
        v-if="showGroupPopover && !mobile"
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

  <!-- …and its phone form. -->
  <MobileBottomSheet
    :show="showGroupPopover && mobile"
    :title="t('management.guestGroupsView.guestListItem.changeGroupTitle')"
    @close="closeGroupPopover"
  >
    <div class="pb-2 pt-1">
      <button
        v-for="group in groups"
        :key="`sheet-${group.id}`"
        type="button"
        :aria-pressed="group.id === guest.group"
        @click="selectGroup(group.id)"
        class="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors active:bg-slate-50"
      >
        <span
          class="h-3 w-3 flex-shrink-0 rounded-full"
          :style="{ backgroundColor: group.color || '#64748b' }"
        ></span>
        <span
          class="min-w-0 flex-1 truncate text-[0.9375rem]"
          :class="group.id === guest.group ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'"
        >{{ group.name }}</span>
        <Check v-if="group.id === guest.group" class="h-5 w-5 flex-shrink-0 text-[#2ecc71]" />
      </button>
    </div>
  </MobileBottomSheet>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, type Component } from 'vue'
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
  ListChecks,
  Users,
} from 'lucide-vue-next'
import type { EventGuest, GuestGroup } from '../../services/api'
import { useActionConfirmation } from '../../composables/useActionConfirmation'
import { useSwipeRowActions } from '../../composables/useSwipeRowActions'
import { haptic } from '../../utils/haptics'
import MobileBottomSheet from '../common/MobileBottomSheet.vue'

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
    /**
     * Small-viewport form. Passed down rather than measured per row: this list
     * routinely holds several hundred of these, and several hundred
     * `matchMedia` listeners for one boolean the parent already knows is a real
     * cost on the device that can least afford it.
     */
    mobile?: boolean
    /**
     * Whether the list is currently in selection mode. On a phone it is what
     * makes the selection marks exist at all, and while it is on the row's tap
     * means "pick this" rather than "open this".
     */
    selectionMode?: boolean
  }>(),
  { canEdit: true, mobile: false, selectionMode: false },
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
  /** Enter selection mode with this guest already picked (hold, or the sheet). */
  'request-select': [guest: EventGuest]
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

// ---------------------------------------------------------------------------
// Touch gestures
// ---------------------------------------------------------------------------

/** One tray slot. Two of them, so the tray is 144px wide. */
const TRAY_ACTION_WIDTH = 72
/** How long a press has to last before it means "select", not "open". */
const LONG_PRESS_MS = 420
/** How far it may drift in that time and still count as a press. */
const LONG_PRESS_SLOP_PX = 10

const swipe = useSwipeRowActions({
  width: () => trayActions.value.length * TRAY_ACTION_WIDTH,
  enabled: () => props.mobile && props.canEdit && !props.selectionMode,
  onOpen: () => haptic('tick'),
})

/**
 * The tray is drawn from the same transform the finger is writing, so there is
 * no second animation to keep in step with it. `will-change` is only claimed
 * while a gesture is live — a permanent compositor layer per row is a real cost
 * on a list this long.
 */
const rowStyle = computed(() => {
  const x = swipe.offset.value
  if (x === 0 && !swipe.dragging.value) {
    return props.mobile && props.canEdit ? { touchAction: 'pan-y' } : undefined
  }
  return {
    transform: `translate3d(${x}px, 0, 0)`,
    touchAction: 'pan-y',
    willChange: 'transform',
  }
})

const trayActions = computed(() => [
  {
    key: 'edit',
    label: t('management.guestGroupsView.guestListItem.trayEdit'),
    icon: Edit2,
    surface: 'bg-slate-500',
    run: () => {
      swipe.close()
      emit('edit', props.guest)
    },
  },
  {
    key: 'delete',
    label: t('management.guestGroupsView.guestListItem.trayDelete'),
    icon: Trash2,
    surface: 'bg-rose-500',
    run: () => {
      swipe.close()
      haptic('commit')
      emit('delete', props.guest)
    },
  },
])

let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressFired = false
let pressOrigin: { x: number; y: number } | null = null

const cancelLongPress = () => {
  if (longPressTimer) clearTimeout(longPressTimer)
  longPressTimer = null
  pressOrigin = null
}

const onPointerDown = (event: PointerEvent) => {
  swipe.handlers.onPointerdown(event)
  longPressFired = false
  if (!props.mobile || !props.canEdit || props.selectionMode) return
  if (event.pointerType === 'mouse') return

  pressOrigin = { x: event.clientX, y: event.clientY }
  cancelLongPressTimerOnly()
  longPressTimer = setTimeout(() => {
    longPressTimer = null
    longPressFired = true
    // Same frame as the mode change, so the pulse and the marks arrive together.
    haptic('select')
    swipe.close(false)
    emit('request-select', props.guest)
  }, LONG_PRESS_MS)
}

const cancelLongPressTimerOnly = () => {
  if (longPressTimer) clearTimeout(longPressTimer)
  longPressTimer = null
}

const onPointerMove = (event: PointerEvent) => {
  swipe.handlers.onPointermove(event)
  if (!pressOrigin || !longPressTimer) return
  const dx = Math.abs(event.clientX - pressOrigin.x)
  const dy = Math.abs(event.clientY - pressOrigin.y)
  if (dx > LONG_PRESS_SLOP_PX || dy > LONG_PRESS_SLOP_PX) cancelLongPress()
}

const onPointerUp = () => {
  swipe.handlers.onPointerup()
  cancelLongPress()
}

const onPointerCancel = () => {
  swipe.handlers.onPointercancel()
  cancelLongPress()
}

const pointerHandlers = {
  pointerdown: onPointerDown,
  pointermove: onPointerMove,
  pointerup: onPointerUp,
  pointercancel: onPointerCancel,
}

/** A hold that has become a selection must not also raise the OS text menu. */
const handleContextMenu = (event: Event) => {
  if (props.mobile && props.canEdit) event.preventDefault()
}

/** The marks are permanent on desktop hover; on touch they exist only in mode. */
const showSelectionSlot = computed(
  () => !props.mobile || props.selectionMode || props.selected,
)

// Leaving selection mode closes anything that only made sense inside it, and
// entering it retires an open tray — the row cannot be in two modes at once.
watch(
  () => props.selectionMode,
  (on) => {
    if (on) swipe.close(false)
  },
)

/**
 * Pressing the row.
 *
 * On a pointer device this is unchanged: the free space selects, and the name
 * beside it opens the guest. On a phone there is no hover to tell those two
 * targets apart, so the row has exactly one meaning — it opens the guest's
 * sheet — until selection mode is on, where it means "pick this".
 *
 * The guards are for the three ways a click arrives without being a press:
 * dragging across a name to copy it, releasing a swipe, and the click that
 * follows a hold that has already been answered with selection mode.
 */
const handleRowPress = (event: MouseEvent) => {
  if (!props.canEdit && !props.mobile) return

  if (longPressFired) {
    longPressFired = false
    event.stopPropagation()
    return
  }
  if (swipe.dragging.value || swipe.isDisplaced()) {
    swipe.close()
    return
  }

  const selection = typeof window !== 'undefined' ? window.getSelection() : null
  if (selection && !selection.isCollapsed) return

  // A view-only share keeps the sheet — it is where the second language's link
  // lives, and copying links is the entire reason that link was sent. The sheet
  // itself already drops every entry that writes.
  if (props.mobile && (!props.canEdit || !props.selectionMode)) {
    openActionMenu()
    return
  }
  emit('toggle-select', props.guest)
}

const onNameClick = (event: MouseEvent) => {
  event.stopPropagation()
  emit('edit', props.guest)
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

/** The row's facts in words, for the head of its sheet. */
const sheetFacts = computed(() => {
  const facts: string[] = []
  if (props.guest.group_details) facts.push(props.guest.group_details.name)
  if (rsvpBadge.value) {
    facts.push(
      rsvpBadge.value.plusOnes
        ? `${rsvpBadge.value.label} +${rsvpBadge.value.plusOnes}`
        : rsvpBadge.value.label,
    )
  }
  if (props.guest.table_details) {
    facts.push(
      props.guest.seat_number
        ? t('management.guestGroupsView.guestListItem.seatedAtWithSeat', {
            table: props.guest.table_details.name,
            seat: props.guest.seat_number,
          })
        : t('management.guestGroupsView.guestListItem.seatedAt', {
            table: props.guest.table_details.name,
          }),
    )
  }
  if (props.guest.cash_gift_amount) {
    facts.push(formatCurrency(props.guest.cash_gift_amount, props.guest.cash_gift_currency))
  }
  facts.push(invitationState.value.label)
  return facts
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
 *
 * On a phone this list is longer, because the row's own sheet is the *only*
 * menu: the group chip and the hold-to-select gesture both have entries here so
 * that neither is a thing you have to already know about.
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

  if (props.mobile && props.groups.length > 0) {
    actions.push({
      key: 'group',
      label: t('management.guestGroupsView.guestListItem.changeGroupTitle'),
      icon: Users,
      run: () => {
        closeActionMenu()
        // Let the sheet finish leaving before the next one arrives — two sheets
        // crossing on the same edge reads as a glitch, not as a transition.
        setTimeout(() => openGroupPopover(), 240)
      },
    })
  }

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

  actions.push({
    key: 'edit',
    label: t('management.guestGroupsView.guestListItem.editGuest'),
    icon: Edit2,
    run: () => {
      closeActionMenu()
      emit('edit', props.guest)
    },
  })

  if (props.mobile) {
    actions.push({
      key: 'select',
      label: t('management.guestGroupsView.guestListItem.selectGuests'),
      icon: ListChecks,
      run: () => {
        closeActionMenu()
        emit('request-select', props.guest)
      },
    })
  }

  actions.push({
    key: 'delete',
    label: t('management.guestGroupsView.guestListItem.deleteGuest'),
    icon: Trash2,
    destructive: true,
    run: () => {
      closeActionMenu()
      emit('delete', props.guest)
    },
  })

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
  haptic('tick')
}

const copyAndClose = (language: 'en' | 'kh') => {
  closeActionMenu()
  emit('copy-link', props.guest, language, true)
  flashCopied()
  haptic('tick')
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

const openActionMenu = () => {
  dropdownManager.register(closeActionMenu)
  showActionMenu.value = true
  if (props.mobile) return
  setTimeout(() => {
    const style = positionAgainst(menuButton.value, 200, menuActions.value.length * 36 + 8, 'right')
    if (style) menuStyle.value = style
  }, 0)
}

const toggleActionMenu = () => {
  if (showActionMenu.value) {
    closeActionMenu()
    return
  }
  openActionMenu()
}

const closeGroupPopover = () => {
  showGroupPopover.value = false
}

const openGroupPopover = () => {
  dropdownManager.register(closeGroupPopover)
  showGroupPopover.value = true
  if (props.mobile) return
  setTimeout(() => {
    const height = Math.min(props.groups.length * 36 + 8, 272)
    const style = positionAgainst(groupBadgeRef.value, 220, height, 'left')
    if (style) groupPopoverStyle.value = style
  }, 0)
}

const toggleGroupPopover = () => {
  if (showGroupPopover.value) {
    closeGroupPopover()
    return
  }
  openGroupPopover()
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
    !props.mobile &&
    !menuButton.value?.contains(target) &&
    !menuEl.value?.contains(target)
  ) {
    closeActionMenu()
  }

  if (
    showGroupPopover.value &&
    !props.mobile &&
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
  swipe.close()
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
  cancelLongPress()
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
