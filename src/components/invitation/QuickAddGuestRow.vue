<template>
  <!-- The add row is a row, not a mode.
       This was a dashed pill that swapped itself for a sky-ringed card taller
       than any guest in the list — a form wearing a row's place, with a
       collapsed state whose dashed border reads as a drop zone rather than as
       "type here". A list you add to should let you add on the same line the
       results appear on: the `+` sits in the guest rows' selection slot, the
       field starts on the same vertical as every name, the group sits in the
       value column, and Enter commits and keeps the caret so several guests go
       in back to back. -->
  <div
    class="flex items-center gap-2.5 px-3 py-2.5 transition-colors duration-150 sm:px-4"
    :class="isFocused ? 'bg-sky-50/70' : ''"
  >
    <!-- The leading slot is the guest rows' checkbox slot, at the same width,
         so the field below starts on the same vertical as every name. It was a
         36px tinted disc back when each guest led with an avatar of that size;
         with the avatars gone it would be the only round object in the list. -->
    <span
      class="flex h-4 w-4 flex-shrink-0 items-center justify-center transition-colors duration-150"
      :class="isFocused ? 'text-sky-500' : 'text-slate-400'"
      aria-hidden="true"
    >
      <Plus class="h-4 w-4" />
    </span>

    <!-- Never disabled for want of a group. The row can make one — that is what
         "New group" in its own picker is for — so refusing the name is
         refusing the only thing the person came here to type, and the group it
         will go in is a question this row can ask afterwards. -->
    <input
      ref="nameInputRef"
      v-model="name"
      type="text"
      :disabled="groups.length === 0 && !canCreate"
      :placeholder="groups.length === 0 && !canCreate
        ? t('management.guestGroupsView.quickAdd.noGroupsHint')
        : t('management.guestGroupsView.quickAdd.namePlaceholder')"
      :aria-label="t('management.guestGroupsView.quickAdd.namePlaceholder')"
      @focus="isFocused = true"
      @blur="isFocused = false"
      @keydown.enter.prevent="submit"
      @keydown.esc.prevent="reset"
      class="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed sm:text-sm"
    />

    <!-- Group picker, in the value column the rows below put their group in.
         It stays on an event that has no groups at all, where it is the only
         way to make the first one. -->
    <div v-if="groups.length > 0 || canCreate" class="relative flex-shrink-0" ref="groupPickerRef">
      <button
        type="button"
        @click="showGroupDropdown = !showGroupDropdown"
        :aria-expanded="showGroupDropdown"
        class="flex h-9 max-w-[7rem] items-center gap-1.5 rounded-lg px-2 text-xs transition-colors hover:bg-slate-200/60 sm:h-auto sm:max-w-[9rem] sm:py-1"
        :class="selectedGroup ? 'text-slate-600' : 'text-slate-400'"
      >
        <span
          v-if="selectedGroup"
          class="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          :style="{ backgroundColor: selectedGroup.color || '#64748b' }"
        ></span>
        <span class="truncate">{{
          selectedGroup ? selectedGroup.name : t('management.guestGroupsView.quickAdd.pickGroup')
        }}</span>
        <ChevronDown class="h-2.5 w-2.5 flex-shrink-0 text-slate-400" />
      </button>

      <!-- Teleported and positioned against the trigger, for the same reason
           the filter's own menu is: this row sits inside a panel that clips
           its rounded corners, so an `absolute` menu was cut off at the card's
           edge — which on a short list is most of it, including the "new
           group" form. -->
      <Teleport to="body">
        <Transition name="dropdown">
          <!-- `@click.stop`: the create form swaps itself in for the "New group"
               row, so by the time the document-level click-outside handler sees
               the event the element it fired on can already be gone from the
               tree — and a `contains()` test on a detached node says "outside",
               closing the picker on the very press that opened the form. The
               menu answering for its own clicks is the fix, and it is what the
               row's other popovers already do. -->
          <div
            v-if="showGroupDropdown && !mobile"
            ref="groupMenuRef"
            :style="menuStyle"
            @click.stop
            class="custom-scrollbar fixed z-[9999] overflow-y-auto rounded-xl border border-slate-200/60 bg-white shadow-lg shadow-slate-200/50"
          >
          <div class="p-1">
            <button
              v-for="group in groups"
              :key="group.id"
              type="button"
              @click="selectGroup(group.id)"
              class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors"
              :class="group.id === selectedGroupId
                ? 'bg-slate-100 font-medium text-slate-900'
                : 'text-slate-700 hover:bg-slate-50'"
            >
              <span
                class="h-2 w-2 flex-shrink-0 rounded-full"
                :style="{ backgroundColor: group.color || '#64748b' }"
              ></span>
              <span class="min-w-0 flex-1 truncate">{{ group.name }}</span>
              <Check v-if="group.id === selectedGroupId" class="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            </button>

            <!-- Creating a group without leaving the guest you are adding.
                 The one group a guest needs is routinely the one that doesn't
                 exist yet, and the only place to make it was the filter's own
                 dropdown at the other end of the toolbar — so adding "Bride's
                 colleagues" meant abandoning a half-typed name, going up to
                 the filter, making the group, coming back and starting again.
                 It is the same form the filter uses, and the group it makes is
                 selected here the moment it arrives. -->
            <template v-if="canCreate">
              <div class="my-1 border-t border-slate-100"></div>

              <InlineGroupForm
                v-if="showCreateGroupForm"
                mode="create"
                :is-submitting="isCreatingGroup"
                class="m-0.5"
                @submit="handleCreateGroup"
                @cancel="showCreateGroupForm = false"
              />
              <button
                v-else
                type="button"
                @click="showCreateGroupForm = true"
                class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <Plus class="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                <span>{{ t('management.guestGroupsView.filterBar.newGroup') }}</span>
              </button>
            </template>
          </div>
          </div>
        </Transition>
      </Teleport>

      <!-- The same picker as a sheet on a phone. A 272px popover hung off a
           chip near the right edge of the row lands wherever that chip happens
           to be, and its rows are half a thumb tall; worse, it opens *inside*
           the list's own scroll area, so the first flick that was meant to
           reach a group scrolls the guests behind it instead. -->
      <MobileBottomSheet
        :show="showGroupDropdown && mobile"
        :title="t('management.guestGroupsView.quickAdd.pickGroup')"
        @close="closeGroupDropdown"
      >
        <div class="pb-2 pt-1">
          <button
            v-for="group in groups"
            :key="`sheet-${group.id}`"
            type="button"
            :aria-pressed="group.id === selectedGroupId"
            @click="selectGroup(group.id)"
            class="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors active:bg-slate-50"
          >
            <span
              class="h-3 w-3 flex-shrink-0 rounded-full"
              :style="{ backgroundColor: group.color || '#64748b' }"
            ></span>
            <span
              class="min-w-0 flex-1 truncate text-[0.9375rem]"
              :class="group.id === selectedGroupId ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'"
            >{{ group.name }}</span>
            <Check v-if="group.id === selectedGroupId" class="h-5 w-5 flex-shrink-0 text-[#2ecc71]" />
          </button>

          <template v-if="canCreate">
            <div class="mx-5 my-1 border-t border-slate-100"></div>

            <InlineGroupForm
              v-if="showCreateGroupForm"
              mode="create"
              :is-submitting="isCreatingGroup"
              class="mx-3 my-1"
              @submit="handleCreateGroup"
              @cancel="showCreateGroupForm = false"
            />
            <button
              v-else
              type="button"
              @click="showCreateGroupForm = true"
              class="flex w-full items-center gap-3.5 px-5 py-3.5 text-left text-[0.9375rem] font-medium text-slate-600 transition-colors active:bg-slate-50"
            >
              <Plus class="h-[1.125rem] w-[1.125rem] flex-shrink-0 text-slate-400" />
              <span>{{ t('management.guestGroupsView.filterBar.newGroup') }}</span>
            </button>
          </template>
        </div>
      </MobileBottomSheet>
    </div>

    <!-- The commit appears only once there is something to commit, so the idle
         row is a field and a group and nothing else. It occupies the trailing
         rail the guest rows use — their status slot plus the copy button — so
         nothing shifts sideways when it arrives. -->
    <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center sm:h-9 sm:w-[3.25rem]">
      <Transition name="commit">
        <button
          v-if="name.trim().length > 0"
          type="button"
          @click="submit"
          :disabled="!canSubmit"
          :title="t('management.guestGroupsView.quickAdd.save')"
          :aria-label="t('management.guestGroupsView.quickAdd.save')"
          class="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.92] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9 sm:rounded-lg sm:active:scale-100"
        >
          <Check class="h-4 w-4" />
        </button>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, ChevronDown, Check } from 'lucide-vue-next'
import InlineGroupForm from './InlineGroupForm.vue'
import MobileBottomSheet from '../common/MobileBottomSheet.vue'
import { useAnchoredMenu } from '../../composables/useAnchoredMenu'
import type { GuestGroup } from '../../services/api'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    groups: GuestGroup[]
    defaultGroupId: number | null
    /** Whether the viewer may make a new group from inside this picker. */
    canCreate?: boolean
    /** Small-viewport form — the group picker becomes a sheet. */
    mobile?: boolean
  }>(),
  { canCreate: true, mobile: false },
)

const emit = defineEmits<{
  'quick-add': [name: string, groupId: number]
  'create-group': [data: { name: string; description?: string; color: string }]
}>()

const name = ref('')
const isFocused = ref(false)
const selectedGroupId = ref<number | null>(props.defaultGroupId)
const showGroupDropdown = ref(false)
const showCreateGroupForm = ref(false)
const isCreatingGroup = ref(false)
const pendingGroupName = ref<string | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)
const groupPickerRef = ref<HTMLElement | null>(null)
const groupMenuRef = ref<HTMLElement | null>(null)

// Aligned to the trigger's right edge, which is the edge it shares with the
// guest rows' own group chips below it.
const { menuStyle } = useAnchoredMenu(showGroupDropdown, groupPickerRef, {
  width: 272,
  align: 'right',
  gap: 4,
})

/** How long to keep the create form spinning before assuming it failed. */
const CREATE_TIMEOUT_MS = 8000
let createTimeout: ReturnType<typeof setTimeout> | null = null

// Keep the picker in sync with the active filter, but never while something is
// half-typed — the group would change under the name being composed.
watch(
  () => props.defaultGroupId,
  (id) => {
    if (name.value.trim().length === 0) selectedGroupId.value = id
  },
)

/**
 * A group made from inside this picker selects itself when it arrives.
 *
 * The creation is the parent's — it owns the service call and the toast — so
 * this waits for the new record to come back down through `groups` rather than
 * being handed an id. Matching on the name is enough: it is the name that was
 * just typed here, seconds ago, and the alternative (diffing ids against a
 * snapshot) breaks the moment two creations overlap.
 */
watch(
  () => props.groups,
  (groups) => {
    if (!pendingGroupName.value) return
    const created = groups.find((g) => g.name === pendingGroupName.value)
    if (!created) return

    selectedGroupId.value = created.id
    settleCreate()
    showGroupDropdown.value = false
    nextTick(() => nameInputRef.value?.focus())
  },
  { deep: true },
)

/** Puts the picker back in a usable state, whichever way the create ended. */
const settleCreate = () => {
  if (createTimeout) clearTimeout(createTimeout)
  createTimeout = null
  pendingGroupName.value = null
  isCreatingGroup.value = false
  showCreateGroupForm.value = false
}

const handleCreateGroup = (data?: { name: string; description?: string; color: string }) => {
  if (!data) return
  pendingGroupName.value = data.name
  isCreatingGroup.value = true
  // The form stays mounted and spinning; the watcher above closes it once the
  // record comes back down. The parent reports a failure with a toast and has
  // no way to tell this component about it, so a lapsed create releases the
  // form rather than leaving it spinning at something that already failed.
  if (createTimeout) clearTimeout(createTimeout)
  createTimeout = setTimeout(settleCreate, CREATE_TIMEOUT_MS)
  emit('create-group', data)
}

const selectedGroup = computed(
  () => props.groups.find((g) => g.id === selectedGroupId.value) ?? null,
)
const canSubmit = computed(
  () => name.value.trim().length >= 2 && selectedGroupId.value !== null,
)

const reset = () => {
  name.value = ''
  showGroupDropdown.value = false
  nameInputRef.value?.blur()
}

const selectGroup = (groupId: number) => {
  selectedGroupId.value = groupId
  closeGroupDropdown()
  nextTick(() => nameInputRef.value?.focus())
}

/** Closing the picker also abandons a half-typed new group — reopening it
 *  should show the list, not a form somebody walked away from. */
const closeGroupDropdown = () => {
  showGroupDropdown.value = false
  if (!isCreatingGroup.value) showCreateGroupForm.value = false
}

const submit = () => {
  // A typed name with no group picked is the one case where the row cannot
  // finish the job by itself: open the picker rather than failing silently.
  // With no groups at all the picker has nothing to offer but the create
  // form, so it opens on that rather than on an empty list.
  if (name.value.trim().length >= 2 && selectedGroupId.value === null) {
    if (props.groups.length === 0 && props.canCreate) showCreateGroupForm.value = true
    showGroupDropdown.value = true
    return
  }
  if (!canSubmit.value || selectedGroupId.value === null) return

  emit('quick-add', name.value.trim(), selectedGroupId.value)
  // Keep the caret so several guests can be added back to back.
  name.value = ''
  nextTick(() => nameInputRef.value?.focus())
}

const handleClickOutside = (event: MouseEvent) => {
  // The sheet is teleported to `body`, so every press inside it reads as
  // "outside" this row — it dismisses itself on its own backdrop instead.
  if (props.mobile) return
  // The menu is teleported to `body`, so a press inside it is "outside" the
  // picker by containment. It stops its own clicks, and this is the belt to
  // that brace.
  const target = event.target as Node
  if (
    showGroupDropdown.value &&
    groupPickerRef.value &&
    !groupPickerRef.value.contains(target) &&
    !groupMenuRef.value?.contains(target)
  ) {
    closeGroupDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  if (createTimeout) clearTimeout(createTimeout)
})
</script>

<style scoped>
/* The picker scrolls once the room under the trigger runs out, so it gets the
   same thin bar the guest list itself uses. */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(203 213 225);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
}

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

/* The commit fades and settles in place; it never grows from nothing. */
.commit-enter-active,
.commit-leave-active {
  transition:
    opacity 0.15s ease-out,
    transform 0.15s ease-out;
}

.commit-enter-from,
.commit-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@media (prefers-reduced-motion: reduce) {
  .dropdown-enter-active,
  .dropdown-leave-active,
  .commit-enter-active,
  .commit-leave-active {
    transition: opacity 0.01ms;
  }
}
</style>
