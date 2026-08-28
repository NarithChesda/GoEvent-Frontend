<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">{{ t('management.guestGroupsView.header.title') }}</h2>
      <p class="text-xs sm:text-sm text-slate-600 mt-1">{{ t('management.guestGroupsView.header.subtitle') }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loadingGroups" class="flex justify-center items-center py-12">
      <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Empty State - Add Guest Card -->
    <div
      v-else-if="groups.length === 0"
      @click="$emit('add-guest')"
      class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-3xl p-12 hover:bg-slate-100/50 hover:border-emerald-400 transition-all duration-300 cursor-pointer group"
    >
      <div class="flex flex-col items-center justify-center">
        <div class="w-16 h-16 bg-slate-200 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
          <UserPlus class="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </div>
        <h4 class="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{{ t('management.guestGroupsView.emptyState.title') }}</h4>
        <p class="text-sm text-slate-400 mt-1">{{ t('management.guestGroupsView.emptyState.subtitle') }}</p>
      </div>
    </div>

    <!-- Guest List -->
    <div
      v-else
      id="guests-panel"
      role="tabpanel"
      :aria-label="`${activeFilter === 'all' ? t('management.guestGroupsView.filterBar.allGroups') : groups.find(g => g.id.toString() === activeFilter)?.name || ''} ${t('management.guestGroupsView.filterBar.guestsPanelSuffix')}`"
      class="rounded-3xl bg-white ring-1 ring-slate-900/5 shadow-sm"
    >
      <!-- Panel header.
           Two stacked bands until `2xl`, where the panel is ~960px and both
           bands were half-empty; there they sit side by side as one row —
           status on the left, tools on the right — and the horizontal rule
           between them becomes a vertical one. The two blocks stay siblings
           rather than being merged into one, so nothing is duplicated and the
           selection bar keeps covering only the tools. -->
      <div class="2xl:flex 2xl:items-stretch">
      <!-- Guest Statistics band (meter + legend) -->
      <section
        class="border-b border-slate-100 2xl:flex-none 2xl:border-b-0 2xl:border-r"
        :aria-label="t('management.guestGroupsView.statsCard.invitedGuests')"
      >
        <GuestStatsCard :stats="guestStats" :loading="loadingStats" />
      </section>

      <!-- Filter and Actions Header.
           The ring is a fixed-size object, so the stats take their natural
           width and the tools take everything left over — the reverse of the
           split the meter needed, and it hands the search field back the room
           a fixed 27rem column had been holding. -->
      <div class="2xl:min-w-0 2xl:flex-1">
          <!-- Toolbar.
               One row, and the group filter lives *inside* the search field
               rather than on a row of its own. The filter narrows exactly the
               result set the query narrows, so they are one control; split
               across two rows they read as two unlabelled glyphs with a dead
               gap between them, which is what the old layout was.

               `relative`, because the selection bar sits *over* this row at
               the same height rather than pushing it down — changing mode
               must not reflow the panel under the finger that caused it. -->
          <!-- `sm:p-4` matches the stats band above (`sm:px-4`) and the list
               below (`p-3 sm:p-4`). At `p-3` alone the toolbar sat 3px inside
               every other row in the panel, so the search field's left edge
               missed the donut's and the guest cards' by the same 3px — the
               kind of misalignment you feel as "off" before you can name it. -->
          <div class="relative p-3 sm:p-4">
            <div
              class="flex items-center gap-2 transition-opacity duration-150 ease-out"
              :class="hasSelection ? 'opacity-0 pointer-events-none' : 'opacity-100'"
              :aria-hidden="hasSelection"
              :inert="hasSelection || undefined"
            >
              <!-- Query and filter, one field. It fills the row rather than
                   sitting at a fixed measure: the page caps the panel at
                   `max-w-5xl`, so there is no runaway width to guard against,
                   and a capped field just moved the emptiness from the field's
                   inside to the gap beside it. -->
              <div
                class="flex-1 min-w-0 flex items-center rounded-xl bg-slate-50 ring-1 ring-transparent transition-[background-color,box-shadow] duration-150 ease-out focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-200"
              >
                <Search class="ml-3 mr-2 w-4 h-4 text-slate-400 flex-shrink-0 pointer-events-none" />
                <input
                  ref="searchInputRef"
                  id="guest-search"
                  type="text"
                  v-model="groupSearchQuery"
                  @input="handleGroupSearch"
                  :placeholder="t('management.guestGroupsView.filterBar.searchPlaceholder')"
                  :aria-label="t('management.guestGroupsView.filterBar.searchAriaLabel')"
                  class="min-w-0 flex-1 bg-transparent border-0 p-0 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
                />
                <button
                  v-if="groupSearchQuery"
                  @click="clearGroupSearch"
                  :aria-label="t('management.guestGroupsView.filterBar.clearSearch')"
                  class="flex items-center justify-center w-11 h-11 sm:w-9 sm:h-9 flex-shrink-0 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X class="w-4 h-4" />
                </button>

                <!-- Hairline between the query and the filter that narrows it:
                     one field, two jobs. -->
                <div class="w-px h-5 bg-slate-200 flex-shrink-0" aria-hidden="true"></div>

                <!-- Filter Dropdown -->
                <div class="relative flex-shrink-0" ref="tabsContainer">
                  <button
                    @click="isDropdownOpen = !isDropdownOpen"
                    class="flex items-center gap-1.5 h-11 sm:h-10 pl-2.5 pr-2.5 sm:pr-3 rounded-r-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 active:scale-[0.98] transition-[color,background-color,transform] duration-150 ease-out"
                    :aria-expanded="isDropdownOpen"
                    :title="t('management.guestGroupsView.filterBar.filterByGroup')"
                    :aria-label="t('management.guestGroupsView.filterBar.filterByGroup')"
                  >
                    <!-- Unfiltered: the funnel. Filtered: the group's own
                         colour, which says *which* filter without the label
                         a phone has no width for. -->
                    <Filter v-if="activeFilter === 'all'" class="w-4 h-4 flex-shrink-0" />
                    <span
                      v-else
                      class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      :style="{ backgroundColor: groups.find(g => g.id.toString() === activeFilter)?.color || '#3498db' }"
                    ></span>
                    <span v-if="activeFilter !== 'all'" class="hidden sm:inline truncate max-w-[7.5rem] text-slate-900">
                      {{ groups.find(g => g.id.toString() === activeFilter)?.name || t('management.guestGroupsView.filterBar.select') }}
                    </span>
                    <!-- RSVP status is a second, independent axis, so it gets
                         its own chip rather than replacing the group label. -->
                    <span
                      v-if="activeRsvpOption"
                      class="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold flex-shrink-0"
                      :class="activeRsvpOption.chipClass"
                    >
                      <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="activeRsvpOption.dotClass" aria-hidden="true"></span>
                      <span class="hidden sm:inline">{{ activeRsvpOption.label }}</span>
                    </span>
                    <ChevronDown class="w-4 h-4 text-slate-400 transition-transform duration-150 flex-shrink-0" :class="{ 'rotate-180': isDropdownOpen }" />
                  </button>

              <!-- Dropdown Menu (desktop) -->
              <Transition name="dropdown">
                <div
                  v-if="isDropdownOpen && isDesktop"
                  class="absolute top-full left-0 mt-2 w-[17.5rem] bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-[100] max-h-[26.25rem] overflow-y-auto"
                  @click.stop
                >
                  <div class="p-1.5">
                    <!-- All Groups Option -->
                    <button
                      @click="selectFilter('all')"
                      :class="[
                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                        activeFilter === 'all'
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-700 hover:bg-slate-50'
                      ]"
                    >
                      <span class="flex-1 text-left">{{ t('management.guestGroupsView.filterBar.allGroups') }}</span>
                      <span class="text-xs text-slate-400 tabular-nums">{{ totalGuestCount }}</span>
                    </button>

                    <!-- Divider -->
                    <div v-if="groups.length > 0" class="my-1.5 border-t border-slate-100"></div>

                    <!-- Individual Groups -->
                    <template v-for="group in groups" :key="group.id">
                      <!-- Inline edit form (replaces the row while editing) -->
                      <InlineGroupForm
                        v-if="editingGroupId === group.id"
                        mode="edit"
                        :group="group"
                        class="my-1"
                        @submit="(data) => submitEditGroup(group, data)"
                        @cancel="cancelEditGroup"
                      />

                      <!-- Inline delete confirm (replaces the row while confirming) -->
                      <InlineGroupForm
                        v-else-if="deletingGroupId === group.id"
                        mode="delete"
                        :group="group"
                        class="my-1"
                        @submit="submitDeleteGroup(group)"
                        @cancel="cancelDeleteGroup"
                      />

                      <!-- Normal selectable row + edit/delete actions -->
                      <div v-else class="flex items-center gap-0.5">
                        <button
                          @click="selectFilter(group.id.toString())"
                          class="flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150"
                          :class="activeFilter === group.id.toString() ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'"
                        >
                          <div
                            class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            :style="{ backgroundColor: group.color || '#3498db' }"
                          />
                          <span class="flex-1 text-left truncate">{{ group.name }}</span>
                          <span class="text-xs tabular-nums text-slate-400">{{ group.guest_count }}</span>
                        </button>
                        <button
                          type="button"
                          @click.stop="startEditGroup(group)"
                          :title="t('management.guestGroupsView.filterBar.editGroup')"
                          class="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-100 transition-all flex-shrink-0"
                        >
                          <Edit2 class="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          @click.stop="startDeleteGroup(group)"
                          :title="t('management.guestGroupsView.filterBar.deleteGroup')"
                          class="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-100 transition-all flex-shrink-0"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </template>

                    <!-- Divider before create-group -->
                    <div class="my-1.5 border-t border-slate-100"></div>

                    <!-- Inline create-group form -->
                    <InlineGroupForm
                      v-if="showCreateGroupForm"
                      mode="create"
                      @submit="submitCreateGroup"
                      @cancel="showCreateGroupForm = false"
                    />
                    <button
                      v-else
                      type="button"
                      @click.stop="showCreateGroupForm = true"
                      class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-lg hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                    >
                      <Users class="w-3.5 h-3.5" />
                      <span>{{ t('management.guestGroupsView.filterBar.newGroup') }}</span>
                    </button>

                    <!-- RSVP status: a second filter axis, combinable with
                         the group filter above -->
                    <div class="my-1.5 border-t border-slate-100"></div>
                    <p class="px-3 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {{ t('management.guestGroupsView.filterBar.rsvpStatus.header') }}
                    </p>
                    <button
                      v-for="option in rsvpStatusOptions"
                      :key="option.key ?? 'any'"
                      type="button"
                      @click="selectRsvpStatus(option.key)"
                      :class="[
                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                        activeRsvpStatus === option.key
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-700 hover:bg-slate-50'
                      ]"
                    >
                      <span
                        class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        :class="option.dotClass"
                        aria-hidden="true"
                      ></span>
                      <span class="flex-1 text-left truncate">{{ option.label }}</span>
                      <span v-if="option.count !== null" class="text-xs tabular-nums text-slate-400">
                        {{ option.count }}
                      </span>
                    </button>
                  </div>
                </div>
              </Transition>

              <!-- Click outside to close dropdown -->
              <div
                v-if="isDropdownOpen && isDesktop"
                @click="isDropdownOpen = false"
                class="fixed inset-0 z-[90]"
              ></div>

              <!-- Mobile Group Filter Bottom Sheet (swipe down to close) -->
              <MobileBottomSheet
                :show="isDropdownOpen && !isDesktop"
                :title="t('management.guestGroupsView.filterBar.filterByGroup')"
                @close="isDropdownOpen = false"
              >
                <div class="py-1">
                  <!-- All Groups -->
                  <button
                    type="button"
                    :aria-pressed="activeFilter === 'all'"
                    @click="selectFilter('all')"
                    class="w-full flex items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
                  >
                    <span
                      class="w-3 h-3 rounded-full flex-shrink-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
                      aria-hidden="true"
                    ></span>
                    <span
                      :class="[
                        'flex-1 text-left text-sm',
                        activeFilter === 'all' ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                      ]"
                    >{{ t('management.guestGroupsView.filterBar.allGroups') }}</span>
                    <span class="text-xs text-slate-400 tabular-nums flex-shrink-0">{{ totalGuestCount }}</span>
                    <Check v-if="activeFilter === 'all'" class="w-5 h-5 text-[#2ecc71] flex-shrink-0" />
                  </button>

                  <div class="mx-5 my-1 border-t border-slate-100"></div>

                  <!-- Groups (with the same inline management as the desktop dropdown) -->
                  <template v-for="group in groups" :key="`sheet-${group.id}`">
                    <InlineGroupForm
                      v-if="editingGroupId === group.id"
                      mode="edit"
                      :group="group"
                      class="mx-3 my-1"
                      @submit="(data) => submitEditGroup(group, data)"
                      @cancel="cancelEditGroup"
                    />
                    <InlineGroupForm
                      v-else-if="deletingGroupId === group.id"
                      mode="delete"
                      :group="group"
                      class="mx-3 my-1"
                      @submit="submitDeleteGroup(group)"
                      @cancel="cancelDeleteGroup"
                    />
                    <div v-else class="flex items-center">
                      <button
                        type="button"
                        :aria-pressed="activeFilter === group.id.toString()"
                        @click="selectFilter(group.id.toString())"
                        class="flex-1 min-w-0 flex items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
                      >
                        <span
                          class="w-3 h-3 rounded-full flex-shrink-0"
                          :style="{ backgroundColor: group.color || '#3498db' }"
                          aria-hidden="true"
                        ></span>
                        <span
                          :class="[
                            'flex-1 text-left text-sm truncate',
                            activeFilter === group.id.toString() ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                          ]"
                        >{{ group.name }}</span>
                        <span class="text-xs text-slate-400 tabular-nums flex-shrink-0">{{ group.guest_count }}</span>
                        <Check v-if="activeFilter === group.id.toString()" class="w-5 h-5 text-[#2ecc71] flex-shrink-0" />
                      </button>
                      <button
                        type="button"
                        @click.stop="startEditGroup(group)"
                        :title="t('management.guestGroupsView.filterBar.editGroup')"
                        class="p-2 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-100 transition-all flex-shrink-0"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        @click.stop="startDeleteGroup(group)"
                        :title="t('management.guestGroupsView.filterBar.deleteGroup')"
                        class="p-2 mr-3 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-100 transition-all flex-shrink-0"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </template>

                  <div class="mx-5 my-1 border-t border-slate-100"></div>

                  <!-- Inline create-group -->
                  <InlineGroupForm
                    v-if="showCreateGroupForm"
                    mode="create"
                    class="mx-3 my-1"
                    @submit="submitCreateGroup"
                    @cancel="showCreateGroupForm = false"
                  />
                  <button
                    v-else
                    type="button"
                    @click.stop="showCreateGroupForm = true"
                    class="mx-3 my-2 w-[calc(100%-1.5rem)] flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-lg hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
                  >
                    <Users class="w-3.5 h-3.5" />
                    <span>{{ t('management.guestGroupsView.filterBar.newGroup') }}</span>
                  </button>

                  <!-- RSVP status (mirrors the desktop dropdown section) -->
                  <div class="mx-5 my-1 border-t border-slate-100"></div>
                  <p class="px-5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {{ t('management.guestGroupsView.filterBar.rsvpStatus.header') }}
                  </p>
                  <button
                    v-for="option in rsvpStatusOptions"
                    :key="`sheet-rsvp-${option.key ?? 'any'}`"
                    type="button"
                    :aria-pressed="activeRsvpStatus === option.key"
                    @click="selectRsvpStatus(option.key)"
                    class="w-full flex items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
                  >
                    <span
                      class="w-3 h-3 rounded-full flex-shrink-0"
                      :class="option.dotClass"
                      aria-hidden="true"
                    ></span>
                    <span
                      :class="[
                        'flex-1 text-left text-sm truncate',
                        activeRsvpStatus === option.key ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                      ]"
                    >{{ option.label }}</span>
                    <span v-if="option.count !== null" class="text-xs text-slate-400 tabular-nums flex-shrink-0">
                      {{ option.count }}
                    </span>
                    <Check v-if="activeRsvpStatus === option.key" class="w-5 h-5 text-[#2ecc71] flex-shrink-0" />
                  </button>
                </div>
                  </MobileBottomSheet>
                </div>
                <!-- /filter -->
              </div>
              <!-- /query + filter field -->

              <!-- How many the query and filter left, and *only* then. The old
                   toolbar showed "8 / 8" permanently, which restates the stats
                   band two rows above; the number is worth saying exactly when
                   it stops matching the total. -->
              <span
                v-if="isFiltering"
                class="flex-shrink-0 text-xs font-medium text-slate-500 tabular-nums"
                aria-live="polite"
              >{{ t('management.guestGroupsView.filterBar.matchCount', { shown: loadedGuestCount, total: guestStats?.total_guests ?? paginationTotal }) }}</span>

              <!-- Help. Icon-only at every width now that it is the only
                   thing between the field and the primary action. -->
              <button
                @click="showInstructionModal = true"
                class="hidden sm:flex items-center justify-center w-10 h-10 flex-shrink-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors duration-150 ease-out"
                :title="t('management.guestGroupsView.filterBar.helpTitle')"
                :aria-label="t('management.guestGroupsView.filterBar.helpTitle')"
              >
                <Info class="w-4 h-4" />
              </button>

              <!-- Import Guests (bulk CSV/Excel).
                   Secondary, not the brand gradient. Importing a spreadsheet
                   happens roughly once per event; adding a guest happens all
                   day, and that lives in the dashed quick-add row directly
                   below. Spending the loudest treatment in the design system
                   on the rarer of the two inverted the emphasis — the eye
                   landed on Import before it found the list. DESIGN.md
                   reserves the gradient for submit/save/create, and the
                   sibling expense tab spends it on its *inline* quick-add
                   for exactly this reason. -->
              <button
                @click="$emit('add-guest')"
                class="flex items-center justify-center gap-2 w-12 h-12 sm:w-auto sm:h-auto sm:px-3.5 sm:py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.97] text-slate-700 text-sm font-medium rounded-xl transition-[background-color,transform] duration-150 ease-out flex-shrink-0"
                :aria-label="t('management.guestGroupsView.filterBar.addGuestAriaLabel')"
              >
                <Upload class="w-4 h-4" />
                <span class="hidden sm:inline">{{ t('management.guestGroupsView.filterBar.addGuest') }}</span>
              </button>
            </div>

            <!-- Selection bar.
                 It takes the toolbar's place rather than stacking under it —
                 selecting guests is a mode, and while you are in it the query
                 and the filter are not what you want. Overlaid at the same
                 height so the list never jumps.

                 Select-all lives here too. As a permanent toolbar checkbox it
                 was an unlabelled control that did nothing until a selection
                 existed; here it reads as "extend this selection", which is
                 the only moment it means anything. -->
            <Transition name="selection-bar">
              <div
                v-if="hasSelection"
                class="absolute inset-x-3 top-3 bottom-3 sm:inset-x-4 sm:top-4 sm:bottom-4 flex items-center gap-1 rounded-xl bg-sky-50 ring-1 ring-sky-100 pl-2 pr-1.5"
              >
                <label
                  class="flex items-center justify-center cursor-pointer flex-shrink-0 w-10 h-10"
                  :title="t('management.guestGroupsView.filterBar.selectAllAriaLabel')"
                >
                  <input
                    type="checkbox"
                    :checked="isAllCurrentPageSelected"
                    :indeterminate.prop="!isAllCurrentPageSelected"
                    @change="handleToggleSelectAll"
                    :aria-label="t('management.guestGroupsView.filterBar.selectAllAriaLabel')"
                    class="w-4 h-4 text-sky-500 border-slate-300 rounded focus:ring-2 focus:ring-sky-200 focus:ring-offset-0 cursor-pointer transition-colors"
                  />
                </label>

                <span class="min-w-0 flex-1 truncate pl-1 text-sm font-medium text-sky-900 tabular-nums">
                  <span class="font-semibold">{{ totalSelectedCount }}</span>
                  {{ t('management.guestGroupsView.selectionBar.selected') }}
                </span>

                <!-- Ghost buttons, not white pills. A raised pill on a tinted
                     field reads as an object dropped onto the bar; the row
                     actions two rows below are already ghost icons in these
                     exact two colours, so the bar borrows their idiom. -->
                <button
                  @click="handleBulkMarkSent"
                  class="flex items-center justify-center gap-1.5 h-10 w-10 sm:w-auto sm:px-3 text-sm font-semibold text-emerald-600 hover:bg-white active:scale-[0.97] rounded-lg transition-[background-color,transform] duration-150 ease-out flex-shrink-0"
                  :aria-label="t('management.guestGroupsView.selectionBar.markSent')"
                  :title="t('management.guestGroupsView.selectionBar.markSent')"
                >
                  <Send class="w-4 h-4" />
                  <span class="hidden sm:inline">{{ t('management.guestGroupsView.selectionBar.markSent') }}</span>
                </button>
                <button
                  @click="handleBulkDelete"
                  class="flex items-center justify-center gap-1.5 h-10 w-10 sm:w-auto sm:px-3 text-sm font-semibold text-red-600 hover:bg-white active:scale-[0.97] rounded-lg transition-[background-color,transform] duration-150 ease-out flex-shrink-0"
                  :aria-label="t('management.guestGroupsView.selectionBar.delete')"
                  :title="t('management.guestGroupsView.selectionBar.delete')"
                >
                  <Trash2 class="w-4 h-4" />
                  <span class="hidden sm:inline">{{ t('management.guestGroupsView.selectionBar.delete') }}</span>
                </button>

                <!-- Hairline before the exit. Leaving the mode sat flush
                     against Delete, which is the one control on this bar you
                     must never hit by accident. -->
                <div class="w-px h-5 bg-sky-200 flex-shrink-0 mx-0.5" aria-hidden="true"></div>

                <!-- The way out of the mode. Without it the only exit was
                     deselecting every guest one at a time. -->
                <button
                  @click="clearSelection"
                  class="flex items-center justify-center w-10 h-10 flex-shrink-0 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors duration-150 ease-out"
                  :aria-label="t('management.guestGroupsView.selectionBar.clearSelection')"
                  :title="t('management.guestGroupsView.selectionBar.clearSelection')"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </Transition>
          </div>
      </div>
      </div>

      <!-- Content Area -->
      <div class="border-t border-slate-100 bg-slate-50/50 rounded-b-3xl">
        <!-- Loading State -->
        <div v-if="isAnyGroupLoading && !hasAnyGuests" class="flex justify-center items-center py-12">
          <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Guest List Items (Scrollable) -->
        <div
          v-else-if="hasAnyGuests"
          ref="scrollContainerRef"
          class="space-y-2 p-3 sm:p-4 sm:max-h-[37.5rem] sm:overflow-y-auto custom-scrollbar"
        >
          <QuickAddGuestRow
            v-if="groups.length > 0"
            :groups="groups"
            :default-group-id="quickAddDefaultGroupId"
            @quick-add="(name, groupId) => $emit('quick-add-guest', name, groupId)"
          />

          <GuestListItem
            v-for="guest in allFilteredGuests"
            :key="guest.id"
            :guest="guest"
            :selected="isGuestSelected(guest.id)"
            :groups="groups"
            @copy-link="(guest, lang) => $emit('copy-link', guest, lang)"
            @mark-sent="$emit('mark-sent', $event)"
            @edit="$emit('edit-guest', $event)"
            @delete="$emit('delete-guest', $event)"
            @toggle-select="handleToggleSelect"
            @update-group="(guest, groupId) => $emit('update-guest-group', guest, groupId)"
          />

          <!-- Infinite Scroll Trigger -->
          <div
            ref="scrollTriggerRef"
            class="py-4 flex justify-center"
          >
            <!-- Loading more indicator -->
            <div v-if="isLoadingMore" class="flex items-center gap-2">
              <div class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-sm text-slate-500">{{ t('management.guestGroupsView.guestList.loadingMore') }}</span>
            </div>
            <!-- End of list indicator -->
            <div v-else-if="!hasMoreToLoad && allFilteredGuests.length > 0" class="text-sm text-slate-400">
              {{ t('management.guestGroupsView.guestList.allLoaded', { count: paginationTotal }) }}
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="p-4 sm:p-6">
          <QuickAddGuestRow
            v-if="groups.length > 0"
            :groups="groups"
            :default-group-id="quickAddDefaultGroupId"
            class="mb-4"
            @quick-add="(name, groupId) => $emit('quick-add-guest', name, groupId)"
          />
          <div class="text-center py-8">
            <Users class="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h4 class="font-semibold text-slate-600 mb-1">{{ t('management.guestGroupsView.guestList.empty.title') }}</h4>
            <p class="text-sm text-slate-400">{{ groupSearchQuery ? t('management.guestGroupsView.guestList.empty.searchHint') : t('management.guestGroupsView.guestList.empty.emptyHint') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Guest Management Instruction Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showInstructionModal"
          class="fixed inset-0 z-[70] overflow-y-auto"
          @click="showInstructionModal = false"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative bg-white rounded-3xl shadow-2xl ring-1 ring-slate-900/5 p-6 max-w-lg w-full" @click.stop>
              <!-- Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Users class="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 class="text-lg font-semibold text-slate-900">{{ t('management.guestGroupsView.guideModal.title') }}</h3>
                </div>
                <button
                  @click="showInstructionModal = false"
                  class="text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>

              <!-- Content -->
              <div class="space-y-4">
                <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p class="text-sm text-emerald-900 mb-3 font-medium">
                    {{ t('management.guestGroupsView.guideModal.intro') }}
                  </p>

                  <div class="space-y-3">
                    <div>
                      <h4 class="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs">1</span>
                        {{ t('management.guestGroupsView.guideModal.steps.addGuests.title') }}
                      </h4>
                      <p class="text-sm text-emerald-800 ml-7">
                        {{ t('management.guestGroupsView.guideModal.steps.addGuests.descPre') }} <span class="inline-flex items-center gap-1 bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-700 font-medium"><UserPlus class="w-3 h-3" /> {{ t('management.guestGroupsView.guideModal.steps.addGuests.btnLabel') }}</span> {{ t('management.guestGroupsView.guideModal.steps.addGuests.descPost') }}
                      </p>
                    </div>

                    <div>
                      <h4 class="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs">2</span>
                        {{ t('management.guestGroupsView.guideModal.steps.bulkImport.title') }}
                      </h4>
                      <p class="text-sm text-emerald-800 ml-7">
                        {{ t('management.guestGroupsView.guideModal.steps.bulkImport.descPre') }} <span class="inline-flex items-center gap-1 bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-700 font-medium"><FileSpreadsheet class="w-3 h-3" /> {{ t('management.guestGroupsView.guideModal.steps.bulkImport.btnLabel') }}</span> {{ t('management.guestGroupsView.guideModal.steps.bulkImport.descPost') }}
                      </p>
                    </div>

                    <div>
                      <h4 class="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs">3</span>
                        {{ t('management.guestGroupsView.guideModal.steps.copyLinks.title') }}
                      </h4>
                      <p class="text-sm text-emerald-800 ml-7">
                        {{ t('management.guestGroupsView.guideModal.steps.copyLinks.descPre') }} <span class="inline-flex items-center gap-1 bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-700 font-medium"><Link class="w-3 h-3" /> {{ t('management.guestGroupsView.guideModal.steps.copyLinks.btnLabel') }}</span> {{ t('management.guestGroupsView.guideModal.steps.copyLinks.descPost') }}
                      </p>
                      <!-- Facebook Messenger Note -->
                      <div class="ml-7 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <p class="text-xs text-amber-800">
                          <span class="font-semibold">{{ t('management.guestGroupsView.guideModal.steps.copyLinks.messengerNoteLabel') }}</span> {{ t('management.guestGroupsView.guideModal.steps.copyLinks.messengerNotePre') }} <span class="font-semibold text-amber-900 bg-amber-100 px-1 rounded">{{ t('management.guestGroupsView.guideModal.steps.copyLinks.messengerPlatformLabel') }}</span>{{ t('management.guestGroupsView.guideModal.steps.copyLinks.messengerNoteMid') }} <span class="font-semibold text-amber-900 bg-amber-100 px-1 rounded">{{ t('management.guestGroupsView.guideModal.steps.copyLinks.messengerAppLabel') }}</span> {{ t('management.guestGroupsView.guideModal.steps.copyLinks.messengerNotePost') }}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 class="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs">4</span>
                        {{ t('management.guestGroupsView.guideModal.steps.trackInvitations.title') }}
                      </h4>
                      <p class="text-sm text-emerald-800 ml-7">
                        {{ t('management.guestGroupsView.guideModal.steps.trackInvitations.descPre') }} <span class="inline-flex items-center gap-1 bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-700 font-medium"><Mail class="w-3 h-3" /> {{ t('management.guestGroupsView.guideModal.steps.trackInvitations.btnLabel') }}</span> {{ t('management.guestGroupsView.guideModal.steps.trackInvitations.descPost') }}
                      </p>
                    </div>

                    <div>
                      <h4 class="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs">5</span>
                        {{ t('management.guestGroupsView.guideModal.steps.cashGift.title') }}
                      </h4>
                      <p class="text-sm text-emerald-800 ml-7">
                        {{ t('management.guestGroupsView.guideModal.steps.cashGift.descPre') }} <span class="inline-flex items-center gap-1 bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-700 font-medium"><DollarSign class="w-3 h-3" /> {{ t('management.guestGroupsView.guideModal.steps.cashGift.btnLabel') }}</span> {{ t('management.guestGroupsView.guideModal.steps.cashGift.descPost') }}
                      </p>
                    </div>

                    <div>
                      <h4 class="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs">6</span>
                        {{ t('management.guestGroupsView.guideModal.steps.bulkActions.title') }}
                      </h4>
                      <p class="text-sm text-emerald-800 ml-7">
                        {{ t('management.guestGroupsView.guideModal.steps.bulkActions.description') }}
                      </p>
                    </div>

                    <div class="pt-3 border-t border-emerald-200">
                      <h4 class="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-1.5">
                        <span>💡</span>
                        <span>{{ t('management.guestGroupsView.guideModal.proTip.label') }}</span>
                      </h4>
                      <p class="text-sm text-emerald-800">
                        {{ t('management.guestGroupsView.guideModal.proTip.description') }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Close Button -->
                <div class="flex justify-end pt-2">
                  <button
                    @click="showInstructionModal = false"
                    class="px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-200"
                  >
                    {{ t('management.guestGroupsView.guideModal.closeBtn') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMediaQuery } from '@vueuse/core'
import { UserPlus, Search, Filter, Users, X, Send, Trash2, Edit2, ChevronDown, Info, FileSpreadsheet, Link, Mail, DollarSign, Upload, Check } from 'lucide-vue-next'
import GuestListItem from './GuestListItem.vue'
import GuestStatsCard from './GuestStatsCard.vue'
import InlineGroupForm from './InlineGroupForm.vue'
import QuickAddGuestRow from './QuickAddGuestRow.vue'
import MobileBottomSheet from '../common/MobileBottomSheet.vue'
import type {
  GuestGroup,
  EventGuest,
  GuestStats,
  GuestRsvpStatusValue,
  GuestRsvpSummary,
} from '../../services/api'

interface GroupPaginationData {
  currentPage: number
  totalCount: number
  guests: EventGuest[]
  loading: boolean
  loadingMore: boolean
  searchTerm: string
  hasLoaded: boolean
  hasMore: boolean
}

interface Props {
  groups: GuestGroup[]
  loadingGroups: boolean
  pageSize: number
  getGroupGuests: (groupId: number) => EventGuest[]
  isGroupLoading: (groupId: number) => boolean
  isGroupExpanded: (groupId: number) => boolean
  getGroupPagination: (groupId: number) => GroupPaginationData
  // All Groups pagination - now accepts the data directly instead of a getter function
  allGuestsPagination: GroupPaginationData
  isAllGuestsLoading: () => boolean
  loadAllGuests: (page: number, silent: boolean) => Promise<any>
  // Guest statistics
  guestStats: GuestStats | null
  loadingStats: boolean
  // RSVP summary — sources the per-status counts in the filter dropdown.
  // The stats themselves live in the Analytics tab, not here.
  rsvpSummary: GuestRsvpSummary | null
}

const props = defineProps<Props>()

const { t } = useI18n()

const emit = defineEmits<{
  'add-guest': []
  'toggle-group': [groupId: number]
  'copy-link': [guest: EventGuest, language: 'en' | 'kh']
  'mark-sent': [guest: EventGuest]
  'edit-guest': [guest: EventGuest]
  'delete-guest': [guest: EventGuest]
  'update-guest-group': [guest: EventGuest, groupId: number]
  'quick-add-guest': [name: string, groupId: number]
  'inline-create-group': [data: { name: string; description?: string; color: string }]
  'inline-update-group': [groupId: number, data: { name: string; description?: string; color: string }]
  'inline-delete-group': [groupId: number]
  'search': [groupId: number, searchTerm: string]
  'search-all': [searchTerm: string]
  'load-more-all': []
  'load-more-group': [groupId: number]
  'bulk-mark-sent': [groupId: number, selectedIds: number[]]
  'bulk-delete': [groupId: number, selectedIds: number[]]
  'register-group-card': [groupId: number, el: any]
}>()

// Inline group-management state (filter dropdown)
const editingGroupId = ref<number | null>(null)
const deletingGroupId = ref<number | null>(null)
const showCreateGroupForm = ref(false)

// Local state
const activeFilter = ref('all')
const activeRsvpStatus = ref<GuestRsvpStatusValue | null>(null)
const groupSearchQuery = ref('')
const selectedGuestIds = ref<Set<number>>(new Set())
const isDropdownOpen = ref(false)
const isSearchExpanded = ref(false)

// One open state drives the desktop dropdown and the mobile bottom sheet —
// gate on viewport so only one is ever mounted (matches Tailwind's `sm`)
const isDesktop = useMediaQuery('(min-width: 640px)')
const showInstructionModal = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Reset any in-progress inline group forms whenever the filter dropdown closes
watch(isDropdownOpen, (open) => {
  if (!open) {
    editingGroupId.value = null
    deletingGroupId.value = null
    showCreateGroupForm.value = false
  }
})

const startEditGroup = (group: GuestGroup) => {
  deletingGroupId.value = null
  showCreateGroupForm.value = false
  editingGroupId.value = group.id
}

const cancelEditGroup = () => {
  editingGroupId.value = null
}

const submitEditGroup = (group: GuestGroup, data?: { name: string; description?: string; color: string }) => {
  if (!data) return
  emit('inline-update-group', group.id, data)
  editingGroupId.value = null
}

const startDeleteGroup = (group: GuestGroup) => {
  editingGroupId.value = null
  showCreateGroupForm.value = false
  deletingGroupId.value = group.id
}

const cancelDeleteGroup = () => {
  deletingGroupId.value = null
}

const submitDeleteGroup = (group: GuestGroup) => {
  emit('inline-delete-group', group.id)
  deletingGroupId.value = null
  if (activeFilter.value === group.id.toString()) {
    activeFilter.value = 'all'
  }
}

const submitCreateGroup = (data?: { name: string; description?: string; color: string }) => {
  if (!data) return
  emit('inline-create-group', data)
  showCreateGroupForm.value = false
}

/**
 * RSVP status is the filter dropdown's second axis, combinable with the
 * group filter. Counts come from the server-side summary because the guest
 * list is paginated — tallying loaded rows would under-report.
 */
const rsvpStatusOptions = computed(() => {
  const counts = props.rsvpSummary?.status_counts
  return [
    {
      key: null as GuestRsvpStatusValue | null,
      label: t('management.guestGroupsView.filterBar.rsvpStatus.any'),
      count: props.rsvpSummary?.total_invited ?? null,
      dotClass: 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]',
      chipClass: 'bg-slate-100 text-slate-600',
    },
    {
      key: 'attending' as GuestRsvpStatusValue | null,
      label: t('management.rsvpStatuses.going'),
      count: counts?.attending ?? null,
      dotClass: 'bg-emerald-500',
      chipClass: 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'maybe' as GuestRsvpStatusValue | null,
      label: t('management.rsvpStatuses.maybe'),
      count: counts?.maybe ?? null,
      dotClass: 'bg-amber-400',
      chipClass: 'bg-amber-50 text-amber-700',
    },
    {
      key: 'not_attending' as GuestRsvpStatusValue | null,
      label: t('management.rsvpStatuses.declined'),
      count: counts?.not_attending ?? null,
      dotClass: 'bg-rose-400',
      chipClass: 'bg-rose-50 text-rose-700',
    },
    {
      key: 'pending' as GuestRsvpStatusValue | null,
      label: t('management.rsvpStatuses.pending'),
      count: counts?.pending ?? null,
      dotClass: 'bg-slate-400',
      chipClass: 'bg-slate-100 text-slate-600',
    },
  ]
})

/** The chip shown on the trigger — null while "Any status" is selected. */
const activeRsvpOption = computed(() =>
  activeRsvpStatus.value
    ? rsvpStatusOptions.value.find((o) => o.key === activeRsvpStatus.value) ?? null
    : null,
)

/** Drives the mobile trigger's active (gradient) treatment. */
const hasActiveFilter = computed(
  () => activeFilter.value !== 'all' || activeRsvpStatus.value !== null,
)

/** Any narrowing at all — a group, an RSVP status, or a typed query. Drives
 *  the match count, which is only worth showing once the list stops being
 *  the whole list. */
const isFiltering = computed(
  () => hasActiveFilter.value || groupSearchQuery.value.trim().length > 0,
)

const selectRsvpStatus = (status: GuestRsvpStatusValue | null) => {
  activeRsvpStatus.value = status
  selectedGuestIds.value.clear()
  isDropdownOpen.value = false
}

// Tab container ref
const tabsContainer = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

// Function to trigger group data loading based on active filter
const triggerGroupExpansion = () => {
  if (activeFilter.value === 'all') {
    // Load all guests without group filter
    props.loadAllGuests(1, false)
  } else {
    const groupId = parseInt(activeFilter.value)
    // Always emit toggle-group to ensure guests are loaded for this group
    // The parent handler will check if guests need to be loaded
    emit('toggle-group', groupId)
  }
}

// Watch for active filter changes - clear selections and trigger group expansion
watch(activeFilter, (newFilter) => {
  selectedGuestIds.value.clear()
  // Sync the search input with the actual search term from the composable
  if (newFilter === 'all') {
    groupSearchQuery.value = props.allGuestsPagination.searchTerm
  } else {
    const groupId = parseInt(newFilter)
    const pagination = props.getGroupPagination(groupId)
    groupSearchQuery.value = pagination.searchTerm
  }
  triggerGroupExpansion()
})

// Watch for groups prop changes - trigger expansion when groups are loaded
watch(() => props.groups, (newGroups, oldGroups) => {
  // Only trigger if groups were just loaded (went from empty to having groups)
  if (oldGroups && oldGroups.length === 0 && newGroups.length > 0) {
    triggerGroupExpansion()
  }
}, { immediate: false })

// On mount, trigger expansion and sync search input
onMounted(() => {
  // Sync search input with current search state
  if (activeFilter.value === 'all') {
    groupSearchQuery.value = props.allGuestsPagination.searchTerm
  } else if (props.groups.length > 0) {
    const groupId = parseInt(activeFilter.value)
    const pagination = props.getGroupPagination(groupId)
    groupSearchQuery.value = pagination.searchTerm
  }

  // Always trigger expansion on mount to ensure initial data load
  // This handles both cases: when there are groups and when starting fresh
  triggerGroupExpansion()
})

// Computed properties
const totalGuestCount = computed(() => {
  return props.groups.reduce((sum, group) => sum + group.guest_count, 0)
})

// Pre-fills the quick-add row's group picker when a specific group is
// filtered; forces an explicit pick when viewing "All Groups".
const quickAddDefaultGroupId = computed(() => {
  if (activeFilter.value === 'all') return null
  const groupId = parseInt(activeFilter.value)
  return Number.isNaN(groupId) ? null : groupId
})

const filteredGroups = computed(() => {
  if (activeFilter.value === 'all') {
    return props.groups
  }
  return props.groups.filter(group => group.id.toString() === activeFilter.value)
})

const allFilteredGuests = computed(() => {
  let guests: EventGuest[]
  if (activeFilter.value === 'all') {
    // Return guests from allGroupsPagination
    // Now properly reactive since it's a prop, not a function call
    guests = props.allGuestsPagination.guests
  } else {
    // For specific group filter, return guests from that group
    guests = []
    filteredGroups.value.forEach(group => {
      const groupGuests = props.getGroupGuests(group.id)
      guests.push(...groupGuests)
    })
  }

  // Apply RSVP-status filter client-side over already-loaded guests.
  // (Server-side filter would require a backend query-param the docs
  // don't yet promise — keeping it local avoids that dependency.)
  if (activeRsvpStatus.value) {
    const target = activeRsvpStatus.value
    guests = guests.filter((g) => (g.rsvp_status ?? 'pending') === target)
  }

  return guests
})

const hasAnyGuests = computed(() => {
  return allFilteredGuests.value.length > 0
})


const isAnyGroupLoading = computed(() => {
  if (activeFilter.value === 'all') {
    return props.isAllGuestsLoading()
  }
  return filteredGroups.value.some(group => props.isGroupLoading(group.id))
})

const totalSelectedCount = computed(() => selectedGuestIds.value.size)

/** Selecting guests is a mode: while it is on, the toolbar becomes the
 *  selection bar. Everything that swaps between the two reads this one flag. */
const hasSelection = computed(() => totalSelectedCount.value > 0)

/** The way out of selection mode. Without it the only exit was deselecting
 *  every guest one at a time. */
const clearSelection = () => {
  selectedGuestIds.value.clear()
}

// Pagination computed properties
const activePagination = computed(() => {
  if (activeFilter.value === 'all') {
    return props.allGuestsPagination
  }
  // For specific group filter
  if (filteredGroups.value.length === 0) return null
  return props.getGroupPagination(filteredGroups.value[0].id)
})

const paginationTotal = computed(() => activePagination.value?.totalCount || 0)
const loadedGuestCount = computed(() => allFilteredGuests.value.length)

// Methods
const selectFilter = (filterId: string) => {
  activeFilter.value = filterId
  isDropdownOpen.value = false
}

const handleGroupSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    if (activeFilter.value === 'all') {
      emit('search-all', groupSearchQuery.value)
    } else {
      filteredGroups.value.forEach(group => {
        emit('search', group.id, groupSearchQuery.value)
      })
    }
  }, 300)
}

const clearGroupSearch = () => {
  groupSearchQuery.value = ''
  if (activeFilter.value === 'all') {
    emit('search-all', '')
  } else {
    filteredGroups.value.forEach(group => {
      emit('search', group.id, '')
    })
  }
}

// Watch for search expansion to auto-focus
watch(isSearchExpanded, (newValue) => {
  if (newValue && searchInputRef.value) {
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 100)
  }
})

// Watch for guest list changes to remove deleted guest IDs from selection (Issue 2)
watch(
  () => allFilteredGuests.value,
  (newGuests) => {
    const validGuestIds = new Set(newGuests.map(g => g.id))
    selectedGuestIds.value.forEach(id => {
      if (!validGuestIds.has(id)) {
        selectedGuestIds.value.delete(id)
      }
    })
  },
  { deep: true }
)

// Watch for search query changes to clear selections (Issue 3)
watch(groupSearchQuery, () => {
  selectedGuestIds.value.clear()
})

const handleToggleSelect = (guest: EventGuest) => {
  if (selectedGuestIds.value.has(guest.id)) {
    selectedGuestIds.value.delete(guest.id)
  } else {
    selectedGuestIds.value.add(guest.id)
  }
}

const isGuestSelected = (guestId: number) => {
  return selectedGuestIds.value.has(guestId)
}

const isAllCurrentPageSelected = computed(() => {
  if (allFilteredGuests.value.length === 0) return false
  return allFilteredGuests.value.every(guest => selectedGuestIds.value.has(guest.id))
})

const handleToggleSelectAll = () => {
  if (isAllCurrentPageSelected.value) {
    // Deselect all on current page
    allFilteredGuests.value.forEach((guest: EventGuest) => {
      selectedGuestIds.value.delete(guest.id)
    })
  } else {
    // Select all on current page
    allFilteredGuests.value.forEach((guest: EventGuest) => {
      selectedGuestIds.value.add(guest.id)
    })
  }
}

const handleBulkMarkSent = () => {
  // Get selected IDs as array
  const selectedIds = Array.from(selectedGuestIds.value)

  if (activeFilter.value === 'all') {
    // For "All Groups" view, emit once with a special groupId (0 or -1) and all selected IDs
    // The parent will handle the bulk operation directly without needing group context
    emit('bulk-mark-sent', 0, selectedIds)
  } else {
    // For specific group filter, emit event for each group that has selected guests
    filteredGroups.value.forEach(group => {
      const groupGuests = props.getGroupGuests(group.id)
      const groupSelectedIds = selectedIds.filter(id =>
        groupGuests.some(g => g.id === id)
      )

      if (groupSelectedIds.length > 0) {
        emit('bulk-mark-sent', group.id, groupSelectedIds)
      }
    })
  }

  // DON'T clear selection here - let parent control it after operation completes
}

const handleBulkDelete = () => {
  // Get selected IDs as array
  const selectedIds = Array.from(selectedGuestIds.value)

  if (activeFilter.value === 'all') {
    // For "All Groups" view, emit once with a special groupId (0 or -1) and all selected IDs
    // The parent will handle the bulk operation directly without needing group context
    emit('bulk-delete', 0, selectedIds)
  } else {
    // For specific group filter, emit event for each group that has selected guests
    filteredGroups.value.forEach(group => {
      const groupGuests = props.getGroupGuests(group.id)
      const groupSelectedIds = selectedIds.filter(id =>
        groupGuests.some(g => g.id === id)
      )

      if (groupSelectedIds.length > 0) {
        emit('bulk-delete', group.id, groupSelectedIds)
      }
    })
  }

  // DON'T clear selection here - let parent control it after operation completes
}

// Infinite scroll trigger element ref
const scrollTriggerRef = ref<HTMLElement | null>(null)
const scrollContainerRef = ref<HTMLElement | null>(null)

// Computed properties for infinite scroll state
const isLoadingMore = computed(() => {
  if (activeFilter.value === 'all') {
    return props.allGuestsPagination.loadingMore
  }
  return filteredGroups.value.some(group => props.getGroupPagination(group.id).loadingMore)
})

const hasMoreToLoad = computed(() => {
  if (activeFilter.value === 'all') {
    return props.allGuestsPagination.hasMore
  }
  return filteredGroups.value.some(group => props.getGroupPagination(group.id).hasMore)
})

// Handle load more for infinite scroll
const handleLoadMore = () => {
  if (isLoadingMore.value || !hasMoreToLoad.value) return

  if (activeFilter.value === 'all') {
    emit('load-more-all')
  } else {
    filteredGroups.value.forEach(group => {
      emit('load-more-group', group.id)
    })
  }
}

// IntersectionObserver for infinite scroll
let intersectionObserver: IntersectionObserver | null = null

const setupIntersectionObserver = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMoreToLoad.value && !isLoadingMore.value) {
        handleLoadMore()
      }
    },
    {
      // The list is only its own scroll region from `sm` up — below that the
      // page scrolls (see the container's classes). Handing a non-scrolling
      // element to `root` would make the trigger permanently intersect its
      // own root and fire load-more on a loop, so mobile observes the
      // viewport instead.
      root: isDesktop.value ? scrollContainerRef.value : null,
      rootMargin: '100px', // Trigger 100px before reaching the bottom
      threshold: 0.1,
    }
  )

  if (scrollTriggerRef.value) {
    intersectionObserver.observe(scrollTriggerRef.value)
  }
}

// Watch for scroll trigger element to be available
watch(scrollTriggerRef, (newRef) => {
  if (newRef) {
    setupIntersectionObserver()
  }
})

// Crossing the `sm` breakpoint swaps which element scrolls, so the observer
// has to be rebuilt against the new root — a rotated phone or a resized
// window otherwise keeps observing the wrong one.
watch(isDesktop, async () => {
  await nextTick()
  setupIntersectionObserver()
})

// Re-setup observer when filter changes (content changes)
watch(activeFilter, async () => {
  // Wait for next tick to ensure DOM has updated with new content
  await nextTick()
  setupIntersectionObserver()
})

// Cleanup observer on unmount
onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
})

// ============================================================================
// EXPOSE METHODS FOR PARENT CONTROL
// ============================================================================

/**
 * Expose methods to allow parent component to control selection state
 * This enables proper parent-child communication for bulk operations
 */
defineExpose({
  /**
   * Clear all selected guest IDs
   * Used by parent after successful bulk operations
   */
  clearSelection: () => {
    selectedGuestIds.value.clear()
  },

  /**
   * Restore selection to a specific set of IDs
   * Used by parent to restore selection after failed bulk operations
   */
  restoreSelection: (ids: number[]) => {
    selectedGuestIds.value.clear()
    ids.forEach(id => selectedGuestIds.value.add(id))
  },

  /**
   * Get current selection as an array
   * Used by parent to capture selection before bulk operations
   */
  getSelection: (): number[] => {
    return Array.from(selectedGuestIds.value)
  }
})
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Visible scrollbar for tabs container */
.scrollbar-visible {
  scrollbar-width: auto;
  scrollbar-color: rgb(203 213 225) rgb(241 245 249);
}

.scrollbar-visible::-webkit-scrollbar {
  height: 8px;
}

.scrollbar-visible::-webkit-scrollbar-track {
  background: rgb(241 245 249);
  border-radius: 4px;
}

.scrollbar-visible::-webkit-scrollbar-thumb {
  background: rgb(203 213 225);
  border-radius: 4px;
  transition: background 0.2s;
}

.scrollbar-visible::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
}

/* Custom scrollbar for guest list */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(203 213 225);
  border-radius: 4px;
  transition: background 0.2s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
}

/* Fade transition for loading overlay and scroll buttons */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Dropdown transition - See DROPDOWN_STYLING_GUIDE.md for full documentation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Selection bar transition */
/* The selection bar is overlaid on the toolbar, so it crossfades in place —
   no translate, because there is nowhere for it to travel from and a slide
   would read as a second row arriving. Exit is quicker than entry: entering
   the mode is the user's decision, leaving it is the system getting out of
   the way. */
.selection-bar-enter-active {
  transition:
    opacity 0.18s cubic-bezier(0.23, 1, 0.32, 1),
    transform 0.18s cubic-bezier(0.23, 1, 0.32, 1);
}

.selection-bar-leave-active {
  transition:
    opacity 0.12s cubic-bezier(0.23, 1, 0.32, 1),
    transform 0.12s cubic-bezier(0.23, 1, 0.32, 1);
}

.selection-bar-enter-from,
.selection-bar-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child > div:last-child,
.modal-leave-to > div:last-child > div:last-child {
  transform: scale(0.9);
}
</style>
