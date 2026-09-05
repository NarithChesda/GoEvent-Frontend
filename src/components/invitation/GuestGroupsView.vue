<template>
  <!--
    Guest list.

    Two elements, not one panel containing everything: a bare header row
    holding the invitation ring and the tools, and one inset list surface.
    What was here before wrapped all of it in a `rounded-3xl` white card, then
    laid a faint tray inside that, then a white ringed card per guest — three
    surfaces to say "list", with the header split into a compartment by a
    vertical rule that only existed at `2xl`. Chrome is chrome and reads as
    part of the page; the list is the one object on it.

    The title lives with whoever mounts this — the management tab's header, or
    the shared link's page header — because both already name the screen and a
    third heading here was the same words a third time.
  -->
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="loadingGroups" class="flex items-center justify-center py-12">
      <div class="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
    </div>

    <!-- Empty State — no groups yet.
         On a view-only share the same dashed card would be an invitation to do
         the one thing the link forbids, so it states the fact instead: there is
         no list yet, and the person who can make one is not the viewer. -->
    <div
      v-else-if="groups.length === 0 && !canEdit"
      class="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center"
    >
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <Users class="h-6 w-6 text-slate-400" />
      </div>
      <h4 class="text-base font-semibold text-slate-900">{{ t('management.guestGroupsView.emptyState.readOnlyTitle') }}</h4>
      <p class="mt-1 text-sm text-slate-500">{{ t('management.guestGroupsView.emptyState.readOnlySubtitle') }}</p>
    </div>

    <button
      v-else-if="groups.length === 0"
      type="button"
      @click="$emit('add-guest')"
      class="w-full rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
    >
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20">
        <UserPlus class="h-6 w-6 text-[#2ecc71]" />
      </div>
      <span class="block text-base font-semibold text-slate-900">{{ t('management.guestGroupsView.emptyState.title') }}</span>
      <span class="mt-1 block text-sm text-slate-500">{{ t('management.guestGroupsView.emptyState.subtitle') }}</span>
    </button>

    <template v-else>
      <!-- One object: the list, with its own header band.

           The ring, the query and Import used to float on the page above the
           surface they act on, which left them belonging to nothing — a strip
           of controls with a card under it reads as two things, and the
           relationship between them has to be inferred from proximity alone.
           Inside the surface, hairline-separated from the rows, they are the
           list's header: the same left edge as every name, the same right edge
           as every row action, and the whole thing is one card you can point
           at. It is also what lets the header stick to the top of a phone
           screen while the rows run underneath it.

           Neither half fills a row on its own — the ring is a fixed ~170px
           object and the query was left holding several hundred pixels of
           empty — so they share one. They wrap onto two rows below `min-w` on
           the toolbar, where a field squeezed beside the ring would be
           narrower than its own placeholder. -->
      <div
        id="guests-panel"
        role="tabpanel"
        :aria-label="`${activeFilter === 'all' ? t('management.guestGroupsView.filterBar.allGroups') : groups.find(g => g.id.toString() === activeFilter)?.name || ''} ${t('management.guestGroupsView.filterBar.guestsPanelSuffix')}`"
        class="rounded-2xl bg-white ring-1 ring-slate-900/5 sm:overflow-hidden"
      >
      <!-- On a phone this band is a floating layer, not a strip at the top of a
           card you scroll away from. A guest list is the one screen here that is
           routinely hundreds of rows long, and the two controls that make it
           usable — the query and, while a selection is live, the bulk bar —
           were both several screens above the thumb by the time you needed
           them.

           It is translucent rather than opaque because the rows have to keep
           reading as one continuous list running underneath it (§12); the card
           therefore drops its own clip below `sm` so the band can leave the
           card's box, and takes the rounding onto this element instead. -->
      <!-- The slot the band came out of. It stays where the band would be if it
           were not sticky, so the distance between the two is exactly how far
           the band has been held back. -->
      <div ref="toolbarSlotRef" class="h-px" aria-hidden="true"></div>
      <div
        ref="toolbarRef"
        class="sticky top-[var(--guest-toolbar-top,0px)] z-20 -mt-px flex flex-wrap items-center gap-x-0 gap-y-0 rounded-t-2xl border-b border-slate-100 bg-white/[0.92] px-3 py-2.5 backdrop-blur-xl backdrop-saturate-150 sm:static sm:gap-x-5 sm:gap-y-3 sm:rounded-none sm:bg-white sm:px-4 sm:backdrop-blur-none"
      >
        <!-- The summary, and the one action that belongs beside it.

             On a phone this shares the band's single row with the query rather
             than taking a line of its own above it, so the whole band is one
             row tall — which is the difference between a header you can pin
             over a list and a header that eats a fifth of the screen. Paying
             for that: the legend is glyphs rather than words, and Import is the
             glyph alone.

             It folds *sideways* — you read the ring once and then work the
             list, so it collapses to nothing the moment the band pins itself or
             the query is focused, and the field, being the row's only flexible
             item, takes the width without needing to know why it arrived. On a
             pointer device neither trigger fires and this never folds. -->
        <div
          class="flex min-w-0 flex-shrink-0 items-center gap-1 overflow-hidden pr-1.5 transition-[max-width,opacity,padding] duration-300 ease-out sm:max-w-none sm:gap-3 sm:overflow-visible sm:pr-0 sm:opacity-100"
          :class="summaryFolded ? 'max-w-0 pr-0 opacity-0' : 'max-w-[15rem] opacity-100'"
          :aria-hidden="summaryFolded || undefined"
          :inert="summaryFolded || undefined"
        >
          <GuestStatsCard
            class="flex-none"
            :stats="guestStats"
            :loading="loadingStats"
            :compact="!isDesktop"
          />
          <button
            v-if="canEdit && !isDesktop"
            @click="$emit('add-guest')"
            class="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition-[background-color,transform] duration-150 ease-out after:absolute after:-inset-1.5 after:content-[''] active:scale-[0.94] active:bg-slate-100"
            :title="t('management.guestGroupsView.filterBar.addGuestAriaLabel')"
            :aria-label="t('management.guestGroupsView.filterBar.addGuestAriaLabel')"
          >
            <Upload class="h-4 w-4" />
          </button>
        </div>

        <!-- `relative`, because the selection bar sits *over* the tools at the
             same height rather than pushing them down — changing mode must not
             reflow the list under the finger that caused it. It covers only
             this half: the stats stay readable while a selection is live. -->
        <!-- The min-width is what makes the two halves wrap onto separate rows
             rather than squeezing the field below its own placeholder. It is
             `sm` and up only: a 272px floor is one a 320px phone cannot meet,
             and it does not need to — below `sm` the summary folds away rather
             than wrapping, so the field's narrow state is a deliberate ~170px
             with a placeholder cut to fit it, not a squeeze. -->
        <div class="relative flex min-w-0 flex-1 items-center sm:min-w-[17rem]">
        <div
          class="flex w-full items-center gap-2 transition-opacity duration-150 ease-out"
          :class="selectionMode ? 'pointer-events-none opacity-0' : 'opacity-100'"
          :aria-hidden="selectionMode"
          :inert="selectionMode || undefined"
        >
          <!-- Query and filter, one field. The filter narrows exactly the
               result set the query narrows, so they are one control; split
               across two rows they read as two unlabelled glyphs with a dead
               gap between them, which is what the old layout was. -->
          <div
            class="flex min-w-0 flex-1 items-center rounded-xl bg-slate-100 ring-1 ring-transparent transition-[background-color,box-shadow] duration-150 ease-out focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-200"
          >
            <!-- The magnifier stands down on a phone once there is a query to
                 read: the text in the field says what the field is, and the 36px
                 the glyph costs is the difference between a legible query and a
                 truncated one. It stays at every desktop width. -->
            <Search
              class="ml-3 mr-2 h-4 w-4 flex-shrink-0 pointer-events-none text-slate-400"
              :class="groupSearchQuery && !isDesktop ? 'hidden' : ''"
            />
            <!-- Two placeholders, because the field has two widths. Sharing the
                 row it is about 170px wide, and an input does not ellipsize its
                 placeholder — it just cuts it, so "Search guests..." would read
                 as "Search gue". The full wording comes back with the width.
                 The accessible name never changes. -->
            <input
              ref="searchInputRef"
              id="guest-search"
              type="text"
              enterkeyhint="search"
              v-model="groupSearchQuery"
              @input="handleGroupSearch"
              @focus="searchFocused = true"
              @blur="searchFocused = false"
              @keydown.enter.prevent="submitGroupSearch"
              @keydown.esc.prevent="cancelGroupSearch"
              :placeholder="isDesktop || searchFocused
                ? t('management.guestGroupsView.filterBar.searchPlaceholder')
                : t('management.guestGroupsView.filterBar.searchPlaceholderShort')"
              :aria-label="t('management.guestGroupsView.filterBar.searchAriaLabel')"
              class="min-w-0 flex-auto border-0 bg-transparent p-0 py-3 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 sm:py-2.5 sm:text-sm"
            />
            <!-- `mousedown.prevent` keeps the focus on the input, which is what
                 stops clearing a query from collapsing the field out from under
                 the thumb that is still typing in it. -->
            <button
              v-if="groupSearchQuery"
              @mousedown.prevent
              @click="clearGroupSearch"
              :aria-label="t('management.guestGroupsView.filterBar.clearSearch')"
              class="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors after:absolute after:-inset-1 after:content-[''] hover:text-slate-600 sm:after:hidden"
            >
              <X class="h-4 w-4" />
            </button>

            <!-- Hairline between the query and the filter that narrows it:
                 one field, two jobs. -->
            <div class="h-5 w-px flex-shrink-0 bg-slate-200" aria-hidden="true"></div>

            <!-- Filter Dropdown.
                 `min-w-0`, and deliberately *not* `flex-shrink-0`: with both
                 axes set this button carries a colour dot, a truncated group
                 name and an RSVP chip, and pinned at its natural width that is
                 wider than a 320px phone's whole field — which is exactly how
                 the toolbar used to push the document sideways. Shrinkable, the
                 group name gives way first (it is the one part the coloured dot
                 already states) and nothing leaves the card. -->
            <div class="relative min-w-0" ref="tabsContainer">
              <button
                @click="isDropdownOpen = !isDropdownOpen"
                class="flex h-11 w-full min-w-0 items-center gap-1.5 rounded-r-xl pl-2.5 pr-3 text-sm font-medium text-slate-600 transition-[color,background-color] duration-150 ease-out hover:bg-slate-200/60 hover:text-slate-900 sm:h-10 sm:pr-3"
                :aria-expanded="isDropdownOpen"
                :title="t('management.guestGroupsView.filterBar.filterByGroup')"
                :aria-label="t('management.guestGroupsView.filterBar.filterByGroup')"
              >
                <!-- Unfiltered: the funnel. Filtered: the group's own colour,
                     which says *which* filter without the label a phone has no
                     width for. -->
                <Filter v-if="activeFilter === 'all'" class="h-4 w-4 flex-shrink-0" />
                <span
                  v-else
                  class="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  :style="{ backgroundColor: groups.find(g => g.id.toString() === activeFilter)?.color || '#3498db' }"
                ></span>
                <span v-if="activeFilter !== 'all'" class="max-w-[5rem] truncate text-slate-900 sm:max-w-[7.5rem]">
                  {{ groups.find(g => g.id.toString() === activeFilter)?.name || t('management.guestGroupsView.filterBar.select') }}
                </span>
                <!-- RSVP status is a second, independent axis, so it gets its
                     own chip rather than replacing the group label. -->
                <span
                  v-if="activeRsvpOption"
                  class="flex min-w-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  :class="activeRsvpOption.chipClass"
                >
                  <span class="h-1.5 w-1.5 flex-shrink-0 rounded-full" :class="activeRsvpOption.dotClass" aria-hidden="true"></span>
                  <span class="max-w-[4.5rem] truncate sm:max-w-none">{{ activeRsvpOption.label }}</span>
                </span>
                <!-- No chevron on a phone: the funnel already says what the
                     button does, and the 22px it costs is the difference
                     between a field that can print "Search" and one that
                     prints "Sear". -->
                <ChevronDown class="hidden h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-150 sm:block" :class="{ 'rotate-180': isDropdownOpen }" />
              </button>

              <!-- Dropdown Menu (desktop) -->
              <Transition name="dropdown">
                <div
                  v-if="isDropdownOpen && isDesktop"
                  class="absolute right-0 top-full z-[100] mt-2 max-h-[26.25rem] w-[17.5rem] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50"
                  @click.stop
                >
                  <div class="p-1.5">
                    <!-- All Groups Option -->
                    <button
                      @click="selectFilter('all')"
                      :class="[
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                        activeFilter === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                      ]"
                    >
                      <span class="flex-1 text-left">{{ t('management.guestGroupsView.filterBar.allGroups') }}</span>
                      <span class="text-xs tabular-nums text-slate-400">{{ totalGuestCount }}</span>
                    </button>

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
                      <div v-else class="group/row flex items-center gap-0.5">
                        <button
                          @click="selectFilter(group.id.toString())"
                          class="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150"
                          :class="activeFilter === group.id.toString() ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'"
                        >
                          <div
                            class="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            :style="{ backgroundColor: group.color || '#3498db' }"
                          />
                          <span class="flex-1 truncate text-left">{{ group.name }}</span>
                          <span class="text-xs tabular-nums text-slate-400">{{ group.guest_count }}</span>
                        </button>
                        <button
                          v-if="canEdit"
                          type="button"
                          @click.stop="startEditGroup(group)"
                          :title="t('management.guestGroupsView.filterBar.editGroup')"
                          class="flex-shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Edit2 class="h-3.5 w-3.5" />
                        </button>
                        <button
                          v-if="canEdit"
                          type="button"
                          @click.stop="startDeleteGroup(group)"
                          :title="t('management.guestGroupsView.filterBar.deleteGroup')"
                          class="flex-shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 class="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </template>

                    <!-- Group management is the organizer's, so on a view-only
                         share the dropdown ends at the filters it exists for. -->
                    <div v-if="canEdit" class="my-1.5 border-t border-slate-100"></div>

                    <InlineGroupForm
                      v-if="canEdit && showCreateGroupForm"
                      mode="create"
                      @submit="submitCreateGroup"
                      @cancel="showCreateGroupForm = false"
                    />
                    <button
                      v-else-if="canEdit"
                      type="button"
                      @click.stop="showCreateGroupForm = true"
                      class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Plus class="h-3.5 w-3.5 text-slate-400" />
                      <span>{{ t('management.guestGroupsView.filterBar.newGroup') }}</span>
                    </button>

                    <!-- RSVP status: a second filter axis, combinable with the
                         group filter above -->
                    <div class="my-1.5 border-t border-slate-100"></div>
                    <p class="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {{ t('management.guestGroupsView.filterBar.rsvpStatus.header') }}
                    </p>
                    <button
                      v-for="option in rsvpStatusOptions"
                      :key="option.key ?? 'any'"
                      type="button"
                      @click="selectRsvpStatus(option.key)"
                      :class="[
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                        activeRsvpStatus === option.key ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                      ]"
                    >
                      <span class="h-2.5 w-2.5 flex-shrink-0 rounded-full" :class="option.dotClass" aria-hidden="true"></span>
                      <span class="flex-1 truncate text-left">{{ option.label }}</span>
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
                    class="flex w-full items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
                  >
                    <span
                      class="h-3 w-3 flex-shrink-0 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
                      aria-hidden="true"
                    ></span>
                    <span
                      :class="[
                        'flex-1 text-left text-sm',
                        activeFilter === 'all' ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                      ]"
                    >{{ t('management.guestGroupsView.filterBar.allGroups') }}</span>
                    <span class="flex-shrink-0 text-xs tabular-nums text-slate-400">{{ totalGuestCount }}</span>
                    <Check v-if="activeFilter === 'all'" class="h-5 w-5 flex-shrink-0 text-[#2ecc71]" />
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
                        class="flex min-w-0 flex-1 items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
                      >
                        <span
                          class="h-3 w-3 flex-shrink-0 rounded-full"
                          :style="{ backgroundColor: group.color || '#3498db' }"
                          aria-hidden="true"
                        ></span>
                        <span
                          :class="[
                            'flex-1 truncate text-left text-sm',
                            activeFilter === group.id.toString() ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                          ]"
                        >{{ group.name }}</span>
                        <span class="flex-shrink-0 text-xs tabular-nums text-slate-400">{{ group.guest_count }}</span>
                        <Check v-if="activeFilter === group.id.toString()" class="h-5 w-5 flex-shrink-0 text-[#2ecc71]" />
                      </button>
                      <button
                        v-if="canEdit"
                        type="button"
                        @click.stop="startEditGroup(group)"
                        :title="t('management.guestGroupsView.filterBar.editGroup')"
                        class="flex-shrink-0 rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Edit2 class="h-4 w-4" />
                      </button>
                      <button
                        v-if="canEdit"
                        type="button"
                        @click.stop="startDeleteGroup(group)"
                        :title="t('management.guestGroupsView.filterBar.deleteGroup')"
                        class="mr-3 flex-shrink-0 rounded-md p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </template>

                  <div v-if="canEdit" class="mx-5 my-1 border-t border-slate-100"></div>

                  <InlineGroupForm
                    v-if="canEdit && showCreateGroupForm"
                    mode="create"
                    class="mx-3 my-1"
                    @submit="submitCreateGroup"
                    @cancel="showCreateGroupForm = false"
                  />
                  <button
                    v-else-if="canEdit"
                    type="button"
                    @click.stop="showCreateGroupForm = true"
                    class="flex w-full items-center gap-3 px-5 py-3 text-sm font-medium text-slate-600 transition-colors active:bg-slate-50"
                  >
                    <Plus class="h-4 w-4 text-slate-400" />
                    <span>{{ t('management.guestGroupsView.filterBar.newGroup') }}</span>
                  </button>

                  <!-- RSVP status (mirrors the desktop dropdown section) -->
                  <div class="mx-5 my-1 border-t border-slate-100"></div>
                  <p class="px-5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {{ t('management.guestGroupsView.filterBar.rsvpStatus.header') }}
                  </p>
                  <button
                    v-for="option in rsvpStatusOptions"
                    :key="`sheet-rsvp-${option.key ?? 'any'}`"
                    type="button"
                    :aria-pressed="activeRsvpStatus === option.key"
                    @click="selectRsvpStatus(option.key)"
                    class="flex w-full items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
                  >
                    <span class="h-3 w-3 flex-shrink-0 rounded-full" :class="option.dotClass" aria-hidden="true"></span>
                    <span
                      :class="[
                        'flex-1 truncate text-left text-sm',
                        activeRsvpStatus === option.key ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                      ]"
                    >{{ option.label }}</span>
                    <span v-if="option.count !== null" class="flex-shrink-0 text-xs tabular-nums text-slate-400">
                      {{ option.count }}
                    </span>
                    <Check v-if="activeRsvpStatus === option.key" class="h-5 w-5 flex-shrink-0 text-[#2ecc71]" />
                  </button>
                </div>
              </MobileBottomSheet>
            </div>
            <!-- /filter -->
          </div>
          <!-- /query + filter field -->

          <!-- Help. Icon-only at every width now that it is the only thing
               between the field and the import control. -->
          <button
            @click="showInstructionModal = true"
            class="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors duration-150 ease-out hover:bg-slate-100 hover:text-slate-700 sm:flex"
            :title="t('management.guestGroupsView.filterBar.helpTitle')"
            :aria-label="t('management.guestGroupsView.filterBar.helpTitle')"
          >
            <Info class="h-4 w-4" />
          </button>

          <!-- Import (bulk CSV/Excel). Secondary, not the brand gradient:
               importing a spreadsheet happens roughly once per event, and
               adding a guest happens all day — that lives in the add row at
               the top of the list. On a phone it moves up to the summary line,
               which leaves this row to the query alone. -->
          <button
            v-if="canEdit && isDesktop"
            @click="$emit('add-guest')"
            class="flex h-11 w-11 flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-medium text-slate-700 transition-[background-color,transform] duration-150 ease-out hover:bg-slate-200 active:scale-[0.97] sm:h-auto sm:w-auto sm:px-3.5 sm:py-2.5"
            :aria-label="t('management.guestGroupsView.filterBar.addGuestAriaLabel')"
          >
            <Upload class="h-4 w-4" />
            <span class="hidden sm:inline">{{ t('management.guestGroupsView.filterBar.addGuest') }}</span>
          </button>
        </div>

        <!-- Selection bar.
             It takes the toolbar's place rather than stacking under it —
             selecting guests is a mode, and while you are in it the query and
             the filter are not what you want. Overlaid at the same height so
             the list never jumps.

             Select-all lives here too. As a permanent toolbar checkbox it was
             an unlabelled control that did nothing until a selection existed;
             here it reads as "extend this selection", which is the only moment
             it means anything. -->
        <Transition name="selection-bar">
          <div
            v-if="canEdit && selectionMode"
            class="absolute inset-0 flex items-center gap-1 rounded-xl bg-sky-50 pl-1 pr-1.5 ring-1 ring-sky-100 sm:pl-2"
          >
            <label
              class="flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center sm:h-10 sm:w-10"
              :title="t('management.guestGroupsView.filterBar.selectAllAriaLabel')"
            >
              <input
                type="checkbox"
                :checked="isAllCurrentPageSelected"
                :indeterminate.prop="hasSelection && !isAllCurrentPageSelected"
                @change="handleToggleSelectAll"
                :aria-label="t('management.guestGroupsView.filterBar.selectAllAriaLabel')"
                class="h-4 w-4 cursor-pointer rounded border-slate-300 text-sky-500 transition-colors focus:ring-2 focus:ring-sky-200 focus:ring-offset-0"
              />
            </label>

            <!-- Entering the mode from a hold always brings one guest with it,
                 so zero is only reachable by unpicking back down to it — where
                 the bar has to say what it is waiting for rather than count it. -->
            <span class="min-w-0 flex-1 truncate pl-1 text-sm font-medium tabular-nums text-sky-900">
              <template v-if="hasSelection">
                <span class="font-semibold">{{ totalSelectedCount }}</span>
                {{ t('management.guestGroupsView.selectionBar.selected') }}
              </template>
              <template v-else>{{ t('management.guestGroupsView.selectionBar.pickGuests') }}</template>
            </span>

            <!-- Ghost buttons, not white pills. A raised pill on a tinted field
                 reads as an object dropped onto the bar. -->
            <button
              @click="handleBulkMarkSent"
              :disabled="!hasSelection"
              class="disabled:pointer-events-none disabled:opacity-40 flex h-11 w-11 flex-shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-emerald-600 transition-[background-color,transform] duration-150 ease-out hover:bg-white active:scale-[0.92] sm:h-10 sm:w-auto sm:px-3 sm:active:scale-[0.97]"
              :aria-label="t('management.guestGroupsView.selectionBar.markSent')"
              :title="t('management.guestGroupsView.selectionBar.markSent')"
            >
              <Send class="h-4 w-4" />
              <span class="hidden sm:inline">{{ t('management.guestGroupsView.selectionBar.markSent') }}</span>
            </button>
            <button
              @click="handleBulkDelete"
              :disabled="!hasSelection"
              class="disabled:pointer-events-none disabled:opacity-40 flex h-11 w-11 flex-shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-red-600 transition-[background-color,transform] duration-150 ease-out hover:bg-white active:scale-[0.92] sm:h-10 sm:w-auto sm:px-3 sm:active:scale-[0.97]"
              :aria-label="t('management.guestGroupsView.selectionBar.delete')"
              :title="t('management.guestGroupsView.selectionBar.delete')"
            >
              <Trash2 class="h-4 w-4" />
              <span class="hidden sm:inline">{{ t('management.guestGroupsView.selectionBar.delete') }}</span>
            </button>

            <!-- Hairline before the exit. Leaving the mode sat flush against
                 Delete, which is the one control on this bar you must never
                 hit by accident. -->
            <div class="mx-0.5 h-5 w-px flex-shrink-0 bg-sky-200" aria-hidden="true"></div>

            <button
              @click="clearSelection"
              class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 ease-out hover:bg-white hover:text-slate-700 sm:h-10 sm:w-10"
              :aria-label="t('management.guestGroupsView.selectionBar.clearSelection')"
              :title="t('management.guestGroupsView.selectionBar.clearSelection')"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </Transition>
        </div>
      </div>

        <!-- Add row, pinned above the results rather than scrolling with them:
             with a few hundred guests loaded the bottom of the list is a long
             way from the intent to add one. -->
        <QuickAddGuestRow
          v-if="canEdit && groups.length > 0"
          :groups="groups"
          :default-group-id="quickAddDefaultGroupId"
          :mobile="!isDesktop"
          class="border-b border-slate-100"
          @quick-add="(name, groupId) => $emit('quick-add-guest', name, groupId)"
          @create-group="(data) => $emit('inline-create-group', data)"
        />

        <!-- Loading State -->
        <div v-if="isAnyGroupLoading && !hasAnyGuests" class="flex items-center justify-center py-14">
          <div class="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-500 border-t-transparent"></div>
        </div>

        <!-- Rows (scrollable from `sm` up; the page scrolls below that) -->
        <div
          v-else-if="hasAnyGuests"
          ref="scrollContainerRef"
          class="custom-scrollbar divide-y divide-slate-100 sm:max-h-[37.5rem] sm:overflow-y-auto"
        >
          <GuestListItem
            v-for="guest in allFilteredGuests"
            :key="guest.id"
            :guest="guest"
            :selected="isGuestSelected(guest.id)"
            :groups="groups"
            :can-edit="canEdit"
            :mobile="!isDesktop"
            :selection-mode="selectionMode"
            @copy-link="(guest, lang, silent) => $emit('copy-link', guest, lang, silent)"
            @mark-sent="$emit('mark-sent', $event)"
            @edit="$emit('edit-guest', $event)"
            @delete="$emit('delete-guest', $event)"
            @toggle-select="handleToggleSelect"
            @request-select="handleRequestSelect"
            @update-group="(guest, groupId) => $emit('update-guest-group', guest, groupId)"
          />

          <!-- Infinite Scroll Trigger -->
          <div ref="scrollTriggerRef" class="flex justify-center px-4 py-3">
            <div v-if="isLoadingMore" class="flex items-center gap-2">
              <div class="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
              <span class="text-xs text-slate-500">{{ t('management.guestGroupsView.guestList.loadingMore') }}</span>
            </div>
            <!-- How many there are, said once, at the foot of the thing it
                 counts. `matchCount` takes over the moment a query or a filter
                 makes "all of them" the wrong number. -->
            <span v-else-if="isFiltering" class="text-xs tabular-nums text-slate-400" aria-live="polite">
              {{ t('management.guestGroupsView.filterBar.matchCount', { shown: loadedGuestCount, total: guestStats?.total_guests ?? paginationTotal }) }}
            </span>
            <span v-else-if="!hasMoreToLoad && allFilteredGuests.length > 0" class="text-xs text-slate-400">
              {{ t('management.guestGroupsView.guestList.allLoaded', { count: paginationTotal }) }}
            </span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="px-6 py-12 text-center">
          <Users class="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h4 class="text-sm font-semibold text-slate-700">{{ t('management.guestGroupsView.guestList.empty.title') }}</h4>
          <p class="mt-1 text-sm text-slate-400">{{ groupSearchQuery ? t('management.guestGroupsView.guestList.empty.searchHint') : t('management.guestGroupsView.guestList.empty.emptyHint') }}</p>
        </div>
      </div>
    </template>

    <!-- Guest Management Instruction Modal.
         A plain grouped list, not six numbered steps in tinted boxes: the
         emerald blocks made a help sheet look like six warnings, and the
         numbers implied an order the tasks do not have. -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showInstructionModal"
          class="fixed inset-0 z-[1000] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          :aria-label="t('management.guestGroupsView.guideModal.title')"
          @click="showInstructionModal = false"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5" @click.stop>
              <div class="flex items-start justify-between gap-3 px-6 pb-4 pt-6">
                <div>
                  <h3 class="text-base font-semibold text-slate-900">{{ t('management.guestGroupsView.guideModal.title') }}</h3>
                  <p class="mt-0.5 text-sm text-slate-500">{{ t('management.guestGroupsView.guideModal.intro') }}</p>
                </div>
                <button
                  @click="showInstructionModal = false"
                  class="-mr-2 -mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  :aria-label="t('common.actions.close')"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>

              <div class="max-h-[60vh] overflow-y-auto px-6 pb-2">
                <div class="divide-y divide-slate-100 border-y border-slate-100">
                  <div v-for="step in guideSteps" :key="step.key" class="flex gap-3 py-3.5">
                    <span class="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <component :is="step.icon" class="h-3.5 w-3.5 text-slate-500" />
                    </span>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-slate-900">{{ step.title }}</p>
                      <p class="mt-0.5 text-sm leading-relaxed text-slate-500">{{ step.description }}</p>
                      <p v-if="step.note" class="mt-1.5 text-xs leading-relaxed text-amber-700">{{ step.note }}</p>
                    </div>
                  </div>
                </div>

                <p class="py-4 text-sm leading-relaxed text-slate-500">
                  <span class="font-medium text-slate-700">{{ t('management.guestGroupsView.guideModal.proTip.label') }}</span>
                  {{ t('management.guestGroupsView.guideModal.proTip.description') }}
                </p>
              </div>

              <div class="flex justify-end border-t border-slate-100 px-6 py-4">
                <button
                  @click="showInstructionModal = false"
                  class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-800"
                >
                  {{ t('management.guestGroupsView.guideModal.closeBtn') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMediaQuery } from '@vueuse/core'
import {
  UserPlus,
  Search,
  Filter,
  Users,
  X,
  Send,
  Trash2,
  Edit2,
  ChevronDown,
  Info,
  FileSpreadsheet,
  Link,
  Mail,
  DollarSign,
  Upload,
  Check,
  Plus,
  ListChecks,
} from 'lucide-vue-next'
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
  /**
   * Whether the viewer may change the list. `false` on a view-only guest-list
   * share, where the holder is here to *work from* the list — read it, search
   * it, copy each guest's invitation link — and not to change it.
   *
   * Everything that writes is removed rather than disabled: a panel of greyed
   * controls reads as something broken, while a panel that simply has no
   * quick-add row and no bulk bar reads as a list. Search, the group filter,
   * the RSVP filter, the stats band and the copy control all stay, because
   * none of them writes and all of them are why the link was sent.
   */
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), { canEdit: true })

const { t, te } = useI18n()

const emit = defineEmits<{
  'add-guest': []
  'toggle-group': [groupId: number]
  /** `silent` = the row already confirmed the copy in place; skip the toast. */
  'copy-link': [guest: EventGuest, language: 'en' | 'kh', silent?: boolean]
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

// One open state drives the desktop dropdown and the mobile bottom sheet —
// gate on viewport so only one is ever mounted (matches Tailwind's `sm`)
const isDesktop = useMediaQuery('(min-width: 640px)')
const showInstructionModal = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

/**
 * The help sheet's contents, as data.
 *
 * Each locale string was authored in three pieces — `descPre`, a `btnLabel`
 * that used to render as a tinted chip mid-sentence, and `descPost` — so the
 * sentence could be interrupted by a little emerald pill naming a button. The
 * pills made a help sheet read as six warnings; the pieces are joined back
 * into plain sentences here rather than re-translated, so every locale keeps
 * exactly the wording it already has.
 */
const guideStep = (key: string, icon: Component, note?: string) => {
  const base = `management.guestGroupsView.guideModal.steps.${key}`
  const description = te(`${base}.description`)
    ? t(`${base}.description`)
    : [t(`${base}.descPre`), t(`${base}.btnLabel`), t(`${base}.descPost`)].join(' ')
  return { key, icon, title: t(`${base}.title`), description, note }
}

const guideSteps = computed(() => {
  const messenger = 'management.guestGroupsView.guideModal.steps.copyLinks'
  return [
    guideStep('addGuests', UserPlus),
    guideStep('bulkImport', FileSpreadsheet),
    guideStep(
      'copyLinks',
      Link,
      [
        t(`${messenger}.messengerNoteLabel`),
        t(`${messenger}.messengerNotePre`),
        t(`${messenger}.messengerPlatformLabel`) + t(`${messenger}.messengerNoteMid`),
        t(`${messenger}.messengerAppLabel`),
        t(`${messenger}.messengerNotePost`),
      ].join(' '),
    ),
    guideStep('trackInvitations', Mail),
    guideStep('cashGift', DollarSign),
    guideStep('bulkActions', ListChecks),
  ]
})

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
  clearSelection()
  isDropdownOpen.value = false
}

// Tab container ref
const tabsContainer = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

// ---------------------------------------------------------------------------
// Is the phone toolbar pinned?
// ---------------------------------------------------------------------------

/**
 * Read off the band's own geometry rather than off a scroll offset: the pin
 * line is `--guest-toolbar-top`, which is a `calc()` over a variable another
 * component measures and publishes, and re-deriving that number here would be a
 * second source of truth for it that goes stale the moment the tab strip's
 * height changes. A sticky element that has left its slot is simply an element
 * sitting lower than the slot it came out of — which needs no numbers at all.
 */
const toolbarRef = ref<HTMLElement | null>(null)
const toolbarSlotRef = ref<HTMLElement | null>(null)
const toolbarStuck = ref(false)

let stuckFrame: number | null = null

const measureStuck = () => {
  stuckFrame = null
  const band = toolbarRef.value
  const slot = toolbarSlotRef.value
  if (!band || !slot) return
  // 2px of slack: the slot is a 1px marker and browsers round sticky offsets.
  toolbarStuck.value = band.getBoundingClientRect().top - slot.getBoundingClientRect().top > 2
}

const scheduleStuckMeasure = () => {
  if (stuckFrame !== null) return
  stuckFrame = requestAnimationFrame(measureStuck)
}

// ---------------------------------------------------------------------------
// The phone band's one row: summary, or query
// ---------------------------------------------------------------------------

/**
 * Is the query being typed into? Only ever true on a phone in practice, but it
 * is read through `summaryFolded`, which gates it on the viewport — focusing
 * the field on a pointer device must not fold a summary that has a whole row
 * of its own to sit in.
 */
const searchFocused = ref(false)

/**
 * The summary gives its width back to the field on both of the occasions the
 * field is the only thing that matters: while the band is pinned over a list
 * you are scrolling, and while you are typing. One flag, so the two states can
 * never disagree about how wide the field is.
 */
const summaryFolded = computed(
  () => !isDesktop.value && (toolbarStuck.value || searchFocused.value),
)

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
  clearSelection()
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

  // Passive, and coalesced to one measurement per frame — this runs on every
  // scroll event of a list that can be several hundred rows long.
  window.addEventListener("scroll", scheduleStuckMeasure, { passive: true })
  window.addEventListener("resize", scheduleStuckMeasure, { passive: true })
  scheduleStuckMeasure()
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

/**
 * On a pointer device the mode *is* the selection: hovering a row already
 * shows you the mark, so picking one is how you enter and unpicking the last
 * one is how you leave, and nothing else is needed.
 *
 * A phone has no hover, so the marks cannot be discovered by moving over them —
 * they exist only once the mode is declared, by holding a row or from that
 * row's own sheet. That declaration has to survive dropping to zero selected,
 * or emptying the selection would throw you out of the mode you are still
 * working in.
 */
const explicitSelectionMode = ref(false)
const selectionMode = computed(() => hasSelection.value || explicitSelectionMode.value)

/** Hold-to-select, and the sheet's "Select" entry. */
const handleRequestSelect = (guest: EventGuest) => {
  explicitSelectionMode.value = true
  selectedGuestIds.value.add(guest.id)
}

/** The way out of selection mode. Without it the only exit was deselecting
 *  every guest one at a time. */
const clearSelection = () => {
  selectedGuestIds.value.clear()
  explicitSelectionMode.value = false
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

const runGroupSearch = (term: string) => {
  if (activeFilter.value === 'all') {
    emit('search-all', term)
  } else {
    filteredGroups.value.forEach(group => {
      emit('search', group.id, term)
    })
  }
}

const handleGroupSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    searchTimeout = null
    runGroupSearch(groupSearchQuery.value)
  }, 300)
}

/**
 * Enter, which on a phone is the "search" key. It ends the typing — flushing
 * the debounce so the results are the ones the query asked for, then dropping
 * focus, which is what returns the summary to the band beside the field.
 */
const submitGroupSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
  runGroupSearch(groupSearchQuery.value)
  searchInputRef.value?.blur()
}

/** Escape backs out of the query entirely, rather than confirming an empty one. */
const cancelGroupSearch = () => {
  if (groupSearchQuery.value) {
    clearGroupSearch()
  }
  searchInputRef.value?.blur()
}

const clearGroupSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
  groupSearchQuery.value = ''
  runGroupSearch('')
}

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
  clearSelection()
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
  window.removeEventListener("scroll", scheduleStuckMeasure)
  window.removeEventListener("resize", scheduleStuckMeasure)
  if (stuckFrame !== null) cancelAnimationFrame(stuckFrame)
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
    clearSelection()
  },

  /**
   * Restore selection to a specific set of IDs
   * Used by parent to restore selection after failed bulk operations
   */
  restoreSelection: (ids: number[]) => {
    selectedGuestIds.value.clear()
    ids.forEach(id => selectedGuestIds.value.add(id))
    // Restoring a non-empty selection restores the mode it belonged to.
    explicitSelectionMode.value = ids.length > 0
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
/* The phone toolbar is a material, so it answers the transparency preference
   the way a material should: frostier, not blurrier. The blur is also
   the expensive half of it, and a device that asked for less transparency is
   often the device that can least afford to composite it every frame. */
@media (prefers-reduced-transparency: reduce) {
  .sticky {
    background-color: rgb(255 255 255);
    backdrop-filter: none;
  }
}

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
