<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          Event Invitations
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">Manage invitations and track your guest list</p>
      </div>
    </div>

    <!-- Social Media Preview -->
    <SocialMediaPreview :event-data="event" />
    <!-- Loading State -->
    <div
      v-if="loadingPayments"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Checking template status...</span>
      </div>
    </div>

    <!-- No Template Selected -->
    <div
      v-else-if="!props.event?.event_template"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <Mail class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">No Template Selected</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        You need to select an event template before you can send invitations.
      </p>
      <button
        @click="redirectToTemplateTab"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm sm:text-base"
      >
        <Mail class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Select Template
      </button>
    </div>

    <!-- Template Payment Check -->
    <div
      v-else-if="!hasTemplatePayment"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <Lock class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">Template Payment Required</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        Your template {{ props.event.event_template_details?.name || 'Selected Template' }}
        requires payment before you can send invitations.
      </p>
      <button
        @click="redirectToPaymentTab"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm sm:text-base"
      >
        <CreditCard class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Complete Payment
      </button>
    </div>

    <!-- Invitation Management Section -->
    <div v-else class="space-y-6">
      <!-- Guest Groups Header and Stats -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
        <div class="flex flex-col gap-3 sm:gap-2 mb-3 sm:mb-4">
          <div class="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
            <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center">
              <Users class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] mr-1.5 sm:mr-2" />
              Guest Groups
            </h3>
            <div class="ml-auto flex items-center gap-2">
              <span class="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-1 text-xs">
                <CheckCircle class="w-3 h-3 mr-1 text-green-600" />
                <span>{{ loadingStats ? '...' : acceptedInvitations }}</span>
                <span class="ml-1 hidden md:inline">Viewed</span>
              </span>
              <span class="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-1 text-xs">
                <Users class="w-3 h-3 mr-1 text-slate-600" />
                <span>{{ loadingStats ? '...' : totalGuests }}</span>
                <span class="ml-1 hidden md:inline">Total</span>
              </span>
              <button @click="showCreateGroupModal = true" class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-2 px-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg inline-flex items-center text-xs sm:text-sm">
                <UserPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                <span class="hidden sm:inline">Create Group</span>
                <span class="sm:hidden">Group</span>
              </button>
              <button @click="showAddGuestModal = true" class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-xs sm:text-sm">
                <UserPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                <span class="hidden sm:inline">Add Guest</span>
                <span class="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
        <!-- Guest Groups Display -->
        <div v-if="loadingGroups" class="text-center py-6 sm:py-8">
          <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff] mx-auto"></div>
          <p class="text-xs sm:text-sm text-slate-600 mt-2">Loading guest groups...</p>
        </div>

        <div v-else-if="groups.length === 0" class="text-center py-8 sm:py-12">
          <Users class="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
          <p class="text-sm sm:text-base text-slate-500">No guest groups yet</p>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">
            Create a group before adding guests
          </p>
        </div>

        <!-- Group List (Accordion) -->
        <div v-else class="space-y-3">
          <div
            v-for="group in groups"
            :key="group.id"
            class="bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <!-- Group Header -->
            <div
              @click="toggleGroupExpansion(group.id)"
              class="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  :style="{ backgroundColor: group.color || '#3498db' }"
                >
                  {{ group.guest_count }}
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm sm:text-base font-semibold text-slate-900 truncate">{{ group.name }}</h4>
                  <p v-if="group.description" class="text-xs text-slate-500 truncate">{{ group.description }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <button
                  @click.stop="openDeleteGroupModal(group)"
                  class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Group"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
                <svg
                  class="w-5 h-5 text-slate-400 transition-transform"
                  :class="{ 'rotate-180': expandedGroups.has(group.id) }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <!-- Group Guests (Expanded) -->
            <div v-if="expandedGroups.has(group.id)" class="border-t border-slate-200">
              <!-- Guest loading state -->
              <div v-if="loading" class="p-4 text-center">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1e90ff] mx-auto"></div>
              </div>

              <!-- Guest list -->
              <div v-else-if="guests.filter(g => g.group === group.id).length > 0" class="divide-y divide-slate-100">
                <div
                  v-for="guest in guests.filter(g => g.group === group.id)"
                  :key="guest.id"
                  class="p-3 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  @click="viewGuestShowcase(guest)"
                >
                  <div class="flex items-center gap-2">
                    <!-- Avatar -->
                    <div
                      class="w-8 h-8 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
                    >
                      {{ getInitials(guest.name) }}
                    </div>

                    <!-- Guest Info -->
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">{{ guest.name }}</p>
                    </div>

                    <!-- Status Badge -->
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                      :class="getStatusClass(guest.invitation_status)"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full mr-1.5"
                        :class="getStatusDotClass(guest.invitation_status)"
                      ></span>
                      <span class="hidden sm:inline">{{ getStatusDisplay(guest) }}</span>
                    </span>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-1 flex-shrink-0">
                      <button
                        @click.stop="copyShowcaseLink(guest, 'en')"
                        class="px-2 py-1 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Copy EN link"
                      >
                        EN
                      </button>
                      <button
                        @click.stop="copyShowcaseLink(guest, 'kh')"
                        class="px-2 py-1 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Copy KH link"
                      >
                        KH
                      </button>
                      <button
                        @click.stop="openDeleteGuestModal(guest)"
                        class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Guest"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- No guests in group -->
              <div v-else class="p-4 text-center">
                <p class="text-sm text-slate-500">No guests in this group yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Delete Guest Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      title="Delete Guest"
      :item-name="(deleteTargetGuest && deleteTargetGuest.name) || ''"
      :loading="deletingGuest"
      @confirm="confirmDeleteGuest"
      @cancel="cancelDeleteGuest"
    />

    <!-- Delete Group Modal -->
    <DeleteConfirmModal
      :show="showDeleteGroupModal"
      title="Delete Group"
      :item-name="(deleteTargetGroup && deleteTargetGroup.name) || ''"
      :loading="deletingGroup"
      :warning-message="`This will delete all ${deleteTargetGroup?.guest_count || 0} guests in this group!`"
      @confirm="confirmDeleteGroup"
      @cancel="cancelDeleteGroup"
    />

    <!-- Create Group Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCreateGroupModal" class="fixed inset-0 z-50 overflow-y-auto">
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="closeCreateGroupModal"></div>

          <div class="flex min-h-full items-center justify-center p-4">
            <div
              class="relative w-full max-w-md bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
              @click.stop
            >
              <!-- Header -->
              <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Users class="w-5 h-5" />
                    </div>
                    <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Create Guest Group</h2>
                  </div>
                  <button
                    @click="closeCreateGroupModal"
                    class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                    aria-label="Close"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Form -->
              <div class="p-6 space-y-5">
                <!-- Group Name -->
                <div>
                  <label for="groupName" class="block text-sm font-medium text-slate-700 mb-2">
                    Group Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="groupName"
                    v-model="newGroupName"
                    type="text"
                    required
                    placeholder="e.g., VIP Guests, Family, Friends"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                  />
                </div>

                <!-- Group Description (Optional) -->
                <div>
                  <label for="groupDescription" class="block text-sm font-medium text-slate-700 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    id="groupDescription"
                    v-model="newGroupDescription"
                    type="text"
                    placeholder="e.g., Close family members"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                  />
                </div>

                <!-- Group Color -->
                <div>
                  <label for="groupColor" class="block text-sm font-medium text-slate-700 mb-2">
                    Group Color
                  </label>
                  <div class="flex items-center gap-3">
                    <input
                      id="groupColor"
                      v-model="newGroupColor"
                      type="color"
                      class="w-16 h-10 rounded-lg border border-slate-300 cursor-pointer"
                    />
                    <input
                      v-model="newGroupColor"
                      type="text"
                      placeholder="#3498db"
                      class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                    />
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                  <button
                    type="button"
                    @click="closeCreateGroupModal"
                    class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    @click="createGroup"
                    :disabled="!newGroupName.trim() || isCreatingGroup"
                    class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <span
                      v-if="isCreatingGroup"
                      class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                    ></span>
                    {{ isCreatingGroup ? 'Creating...' : 'Create Group' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Add Guest Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAddGuestModal" class="fixed inset-0 z-50 overflow-y-auto">
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="closeAddGuestModal"></div>

          <div class="flex min-h-full items-center justify-center p-4">
            <div
              class="relative w-full max-w-md bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
              @click.stop
            >
              <!-- Header (neutral style) -->
              <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                      <UserPlus class="w-5 h-5" />
                    </div>
                    <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Add Guest</h2>
                  </div>
                  <button
                    @click="closeAddGuestModal"
                    class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                    aria-label="Close"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Form -->
              <div class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                <!-- Mode Toggle -->
                <div class="space-y-3 sm:space-y-4">
                  <div class="flex gap-2">
                    <button
                      type="button"
                      @click="switchMode('single')"
                      :class="[
                        'flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-200',
                        importMode === 'single'
                          ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      ]"
                    >
                      <UserPlus class="w-4 h-4 inline-block mr-1.5" />
                      Single Guest
                    </button>
                    <button
                      type="button"
                      @click="switchMode('bulk')"
                      :class="[
                        'flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-200',
                        importMode === 'bulk'
                          ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      ]"
                    >
                      <Upload class="w-4 h-4 inline-block mr-1.5" />
                      Bulk Import
                    </button>
                  </div>
                </div>

                <!-- Single Guest Mode -->
                <div v-if="importMode === 'single'" class="space-y-5">
                  <!-- Group Selection -->
                  <div>
                    <label for="guestGroup" class="block text-sm font-medium text-slate-700 mb-2">
                      Select Group <span class="text-red-500">*</span>
                    </label>
                    <select
                      id="guestGroup"
                      v-model="selectedGroupForNewGuest"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                    >
                      <option :value="null" disabled>Choose a group...</option>
                      <option v-for="group in groups" :key="group.id" :value="group.id">
                        {{ group.name }} ({{ group.guest_count }} guests)
                      </option>
                    </select>
                    <p v-if="groups.length === 0" class="mt-2 text-xs text-red-600">
                      Please create a group first before adding guests.
                    </p>
                  </div>

                  <!-- Guest Name -->
                  <div>
                    <label for="guestName" class="block text-sm font-medium text-slate-700 mb-2">
                      Guest Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="guestName"
                      v-model="newGuestName"
                      type="text"
                      required
                      placeholder="Enter guest's full name"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                    />
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                    <button
                      type="button"
                      @click="closeAddGuestModal"
                      class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      @click="addGuest"
                      :disabled="!newGuestName.trim() || !selectedGroupForNewGuest || isAddingGuest"
                      class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <span
                        v-if="isAddingGuest"
                        class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                      ></span>
                      {{ isAddingGuest ? 'Adding...' : 'Add Guest' }}
                    </button>
                  </div>
                </div>

                <!-- Bulk Import Mode -->
                <div v-else class="space-y-5">
                  <!-- Group Selection -->
                  <div>
                    <label for="importGroup" class="block text-sm font-medium text-slate-700 mb-2">
                      Select Group <span class="text-red-500">*</span>
                    </label>
                    <select
                      id="importGroup"
                      v-model="selectedGroupForImport"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                    >
                      <option :value="null" disabled>Choose a group...</option>
                      <option v-for="group in groups" :key="group.id" :value="group.id">
                        {{ group.name }} ({{ group.guest_count }} guests)
                      </option>
                    </select>
                    <p v-if="groups.length === 0" class="mt-2 text-xs text-red-600">
                      Please create a group first before importing guests.
                    </p>
                  </div>

                  <!-- Download Template Button -->
                  <button
                    type="button"
                    @click="downloadTemplate"
                    class="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    <Download class="w-4 h-4" />
                    Download Template (CSV)
                  </button>

                  <!-- File Upload Area -->
                  <div class="space-y-4">
                    <div>
                      <div
                        @drop.prevent="handleFileDrop"
                        @dragover.prevent="handleDragOver"
                        @dragleave.prevent="handleDragLeave"
                        :class="[
                          'border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-200 cursor-pointer',
                          isDragging
                            ? 'border-sky-400 bg-sky-50'
                            : 'border-slate-300 hover:border-slate-400 bg-slate-50',
                        ]"
                        @click="fileInput?.click()"
                      >
                        <Upload
                          :class="['w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3', isDragging ? 'text-sky-500' : 'text-slate-400']"
                        />
                        <p class="text-sm font-medium text-slate-700 mb-1">
                          {{ selectedFile ? selectedFile.name : 'Drop your file here or click to browse' }}
                        </p>
                        <p class="text-xs text-slate-500">
                          Supported formats: CSV, Excel (.xlsx, .xls), TXT
                        </p>
                        <input
                          ref="fileInput"
                          type="file"
                          accept=".csv,.xlsx,.xls,.txt,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                          @change="handleFileSelect"
                          class="hidden"
                        />
                      </div>
                    </div>

                    <div class="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-slate-600">
                      <FileText class="w-4 h-4 inline-block mr-1.5 text-sky-600" />
                      <strong>Format:</strong> CSV must have "name" as the header in the first row. Excel/TXT: one guest name per line.
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                      <button
                        type="button"
                        @click="closeAddGuestModal"
                        class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        @click="confirmBulkImport"
                        :disabled="!selectedFile || !selectedGroupForImport || isImporting"
                        class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <span
                          v-if="isImporting"
                          class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                        ></span>
                        {{ isImporting ? 'Importing...' : 'Import Guests' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 left-4 sm:left-auto z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center text-sm sm:text-base"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <AlertCircle v-else class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <span class="flex-1">{{ message.text }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  CheckCircle,
  Users,
  Lock,
  CreditCard,
  Mail,
  UserPlus,
  X,
  AlertCircle,
  Trash2,
  Upload,
  FileText,
  Download,
} from 'lucide-vue-next'
import { usePaymentTemplateIntegration } from '../composables/usePaymentTemplateIntegration'
import {
  guestService,
  guestGroupService,
  type EventGuest,
  type GuestStats,
  type Event,
  type GuestGroup,
  type CreateGuestGroupRequest,
} from '../services/api'
import { getGuestSSRMetaUrl } from '../utils/metaUtils'
import SocialMediaPreview from './SocialMediaPreview.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

// Props
const props = defineProps<{
  eventId: string
  event: Event
  canEdit: boolean
}>()

// Emits
const emit = defineEmits<{
  'tab-change': [tab: string]
}>()

// State
const loading = ref(false)
const showAddGuestModal = ref(false)
const newGuestName = ref('')
const isAddingGuest = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const searchTerm = ref('')
const loadingStats = ref(false)
// Delete modal state
const showDeleteModal = ref(false)
const deletingGuest = ref(false)
const deleteTargetGuest = ref<EventGuest | null>(null)

// Guest Group state
const groups = ref<GuestGroup[]>([])
const loadingGroups = ref(false)
const selectedGroupForImport = ref<number | null>(null)
const selectedGroupForNewGuest = ref<number | null>(null)
const showCreateGroupModal = ref(false)
const newGroupName = ref('')
const newGroupDescription = ref('')
const newGroupColor = ref('#3498db')
const isCreatingGroup = ref(false)
const expandedGroups = ref<Set<number>>(new Set())
const showDeleteGroupModal = ref(false)
const deleteTargetGroup = ref<GuestGroup | null>(null)
const deletingGroup = ref(false)

// Bulk import state
const importMode = ref<'single' | 'bulk'>('single')
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const isImporting = ref(false)
const importPreview = ref<{ name: string; status: 'valid' | 'duplicate' }[]>([])
const showImportPreview = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Guest data from API
const guests = ref<EventGuest[]>([])
const guestStats = ref<GuestStats | null>(null)

// Pagination state
const currentPage = ref(1)
const PAGE_SIZE = 20  // Fixed page size
const totalCount = ref(0)

// Use payment template integration composable
const { isTemplateActivated, loadPayments, loadingPayments } = usePaymentTemplateIntegration(
  props.event,
)

// Computed properties
const hasTemplatePayment = computed(() => {
  // Check if template is selected first
  if (!props.event?.event_template) return false

  // Use the same logic as template tab - check if template is activated
  return isTemplateActivated.value
})

const sentInvitations = computed(() => {
  return guestStats.value?.sent || 0
})

const acceptedInvitations = computed(() => {
  return guestStats.value?.viewed || 0
})

const pendingInvitations = computed(() => {
  return guestStats.value?.not_sent || 0
})

const totalGuests = computed(() => {
  return guestStats.value?.total_guests || 0
})

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(totalCount.value / PAGE_SIZE)
})

const showingFrom = computed(() => {
  if (totalCount.value === 0) return 0
  return (currentPage.value - 1) * PAGE_SIZE + 1
})

const showingTo = computed(() => {
  const to = currentPage.value * PAGE_SIZE
  return Math.min(to, totalCount.value)
})

const hasNextPage = computed(() => {
  return currentPage.value < totalPages.value
})

const hasPreviousPage = computed(() => {
  return currentPage.value > 1
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const maxVisible = 5

  if (totalPages.value <= maxVisible) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    // Calculate range around current page
    let start = Math.max(2, currentPage.value - 1)
    let end = Math.min(totalPages.value - 1, currentPage.value + 1)

    // Adjust range if at the beginning or end
    if (currentPage.value <= 3) {
      end = 4
    } else if (currentPage.value >= totalPages.value - 2) {
      start = totalPages.value - 3
    }

    // Add ellipsis if needed
    if (start > 2) {
      pages.push('...')
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add ellipsis if needed
    if (end < totalPages.value - 1) {
      pages.push('...')
    }

    // Always show last page
    pages.push(totalPages.value)
  }

  return pages
})

// Methods
const redirectToPaymentTab = () => {
  emit('tab-change', 'payment')
}

const redirectToTemplateTab = () => {
  emit('tab-change', 'template')
}

const viewEventShowcase = () => {
  const showcaseUrl = `/events/${props.eventId}/showcase`
  window.open(showcaseUrl, '_blank')
}

// Guest Group Management Methods
const loadGroups = async () => {
  loadingGroups.value = true
  try {
    const response = await guestGroupService.getGroups(props.eventId)
    if (response.success && response.data) {
      groups.value = response.data.sort((a, b) => a.order - b.order)
    } else {
      showMessage('error', response.message || 'Failed to load guest groups')
    }
  } catch (error) {
    console.error('Error loading groups:', error)
    showMessage('error', 'Failed to load guest groups')
  } finally {
    loadingGroups.value = false
  }
}

const createGroup = async () => {
  if (!newGroupName.value.trim()) return

  isCreatingGroup.value = true

  try {
    const data: CreateGuestGroupRequest = {
      name: newGroupName.value.trim(),
      description: newGroupDescription.value.trim() || undefined,
      color: newGroupColor.value,
      order: groups.value.length + 1,
    }

    const response = await guestGroupService.createGroup(props.eventId, data)

    if (response.success && response.data) {
      groups.value.push(response.data)
      groups.value.sort((a, b) => a.order - b.order)
      showMessage('success', `Group "${response.data.name}" created`)
      closeCreateGroupModal()
      // Auto-expand the new group
      expandedGroups.value.add(response.data.id)
    } else {
      showMessage('error', response.message || 'Failed to create group')
    }
  } catch (error) {
    console.error('Error creating group:', error)
    showMessage('error', 'Failed to create group')
  } finally {
    isCreatingGroup.value = false
  }
}

const openDeleteGroupModal = (group: GuestGroup) => {
  deleteTargetGroup.value = group
  showDeleteGroupModal.value = true
}

const confirmDeleteGroup = async () => {
  if (!deleteTargetGroup.value) return

  deletingGroup.value = true

  try {
    const response = await guestGroupService.deleteGroup(props.eventId, deleteTargetGroup.value.id)

    if (response.success) {
      groups.value = groups.value.filter((g) => g.id !== deleteTargetGroup.value!.id)
      showMessage(
        'success',
        `Group "${deleteTargetGroup.value.name}" and all its guests have been deleted`,
      )
      loadGuestStats()
    } else {
      showMessage('error', response.message || 'Failed to delete group')
    }
  } catch (error) {
    console.error('Error deleting group:', error)
    showMessage('error', 'Failed to delete group')
  } finally {
    deletingGroup.value = false
    showDeleteGroupModal.value = false
    deleteTargetGroup.value = null
  }
}

const cancelDeleteGroup = () => {
  if (deletingGroup.value) return
  showDeleteGroupModal.value = false
  deleteTargetGroup.value = null
}

const closeCreateGroupModal = () => {
  showCreateGroupModal.value = false
  newGroupName.value = ''
  newGroupDescription.value = ''
  newGroupColor.value = '#3498db'
}

const toggleGroupExpansion = (groupId: number) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
}

const addGuest = async () => {
  if (!newGuestName.value.trim()) return

  // Check if a group is selected
  if (!selectedGroupForNewGuest.value) {
    showMessage('error', 'Please select a group for the guest')
    return
  }

  isAddingGuest.value = true

  try {
    const response = await guestService.createGuest(props.eventId, {
      name: newGuestName.value.trim(),
      group: selectedGroupForNewGuest.value,
    })

    if (response.success && response.data) {
      // Add guest to the guests array
      guests.value.unshift(response.data)
      showMessage('success', `${response.data.name} added to guest list`)
      newGuestName.value = ''
      selectedGroupForNewGuest.value = null
      closeAddGuestModal()
      // Refresh stats and groups to get updated guest counts
      loadGuestStats()
      loadGroups()
    } else {
      showMessage('error', response.message || 'Failed to add guest')
    }
  } catch (error) {
    console.error('Error adding guest:', error)
    showMessage('error', 'Failed to add guest')
  } finally {
    isAddingGuest.value = false
  }
}




const openDeleteGuestModal = (guest: EventGuest) => {
  deleteTargetGuest.value = guest
  showDeleteModal.value = true
}

const confirmDeleteGuest = async () => {
  if (!deleteTargetGuest.value) return
  try {
    deletingGuest.value = true
    const response = await guestService.deleteGuest(props.eventId, deleteTargetGuest.value.id)
    if (response.success) {
      guests.value = guests.value.filter((g) => g.id !== deleteTargetGuest.value!.id)
      showMessage('success', deleteTargetGuest.value.name + ' removed from guest list')
      loadGuestStats()
    } else {
      showMessage('error', response.message || 'Failed to remove guest')
    }
  } catch (error) {
    console.error('Error removing guest:', error)
    showMessage('error', 'Failed to remove guest')
  } finally {
    deletingGuest.value = false
    showDeleteModal.value = false
    deleteTargetGuest.value = null
  }
}

const cancelDeleteGuest = () => {
  if (deletingGuest.value) return
  showDeleteModal.value = false
  deleteTargetGuest.value = null
}

const closeAddGuestModal = () => {
  showAddGuestModal.value = false
  newGuestName.value = ''
  selectedGroupForNewGuest.value = null
  selectedGroupForImport.value = null
  resetImportState()
}

const resetImportState = () => {
  importMode.value = 'single'
  selectedFile.value = null
  isDragging.value = false
  importPreview.value = []
  showImportPreview.value = false
  selectedGroupForImport.value = null
}

const switchMode = (mode: 'single' | 'bulk') => {
  importMode.value = mode
  if (mode === 'single') {
    resetImportState()
  }
}

// File handling methods
const handleFileSelect = (event: globalThis.Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleFileDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    processFile(file)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const processFile = async (file: File) => {
  const validTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ]

  if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|txt)$/i)) {
    showMessage('error', 'Please upload a CSV, Excel, or TXT file')
    return
  }

  selectedFile.value = file
}

const confirmBulkImport = async () => {
  if (!selectedFile.value) {
    showMessage('error', 'Please select a file to import')
    return
  }

  if (!selectedGroupForImport.value) {
    showMessage('error', 'Please select a group for the import')
    return
  }

  isImporting.value = true

  try {
    const response = await guestGroupService.bulkImportToGroup(
      props.eventId,
      selectedGroupForImport.value,
      selectedFile.value,
    )

    if (response.success && response.data) {
      const { created, skipped, created_guests, skipped_guests } = response.data

      // Refresh guests and stats
      await loadGuests()
      await loadGuestStats()
      await loadGroups()

      // Show results
      if (skipped > 0) {
        showMessage(
          'success',
          `Imported ${created} guests. ${skipped} skipped: ${skipped_guests.map((g) => g.name).join(', ')}`,
        )
      } else {
        showMessage('success', `Successfully imported ${created} guests`)
      }

      closeAddGuestModal()
    } else {
      showMessage('error', response.message || 'Failed to import guests')
    }
  } catch (error) {
    console.error('Error importing guests:', error)
    showMessage('error', 'Failed to import guests')
  } finally {
    isImporting.value = false
  }
}

const downloadTemplate = () => {
  const csvContent = 'name\nJohn Doe\nJane Smith\nMichael Johnson'
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'guest_import_template.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'viewed':
      return 'bg-green-100 text-green-800'
    case 'sent':
      return 'bg-orange-100 text-orange-800'
    case 'not_sent':
      return 'bg-slate-100 text-slate-800'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

const getStatusDotClass = (status: string) => {
  switch (status) {
    case 'viewed':
      return 'bg-green-500'
    case 'sent':
      return 'bg-orange-500'
    case 'not_sent':
      return 'bg-slate-400'
    default:
      return 'bg-slate-400'
  }
}

const getStatusDisplay = (guest: EventGuest) => {
  return guest.invitation_status_display || guest.invitation_status
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getGuestShowcaseUrl = (guest: EventGuest, language: 'en' | 'kh' = 'kh') => {
  // Use SSR meta URL for personalized guest invitations
  return getGuestSSRMetaUrl(props.eventId, guest.name, language)
}

const getDirectGuestShowcaseUrl = (guest: EventGuest, language: 'en' | 'kh' = 'kh') => {
  // Direct URL for opening in browser (non-SSR)
  const showcaseUrl = `/events/${props.eventId}/showcase?guest_name=${encodeURIComponent(guest.name)}&lang=${language}`
  return `${window.location.origin}${showcaseUrl}`
}

const viewGuestShowcase = (guest: EventGuest) => {
  // Use direct URL for viewing (non-SSR) so it opens immediately
  const fullUrl = getDirectGuestShowcaseUrl(guest, 'kh')
  window.open(fullUrl, '_blank')
}

const copyShowcaseLink = (guest: EventGuest, language: 'en' | 'kh') => {
  const fullUrl = getGuestShowcaseUrl(guest, language)
  navigator.clipboard
    .writeText(fullUrl)
    .then(() => {
      showMessage('success', `Showcase link (${language.toUpperCase()}) copied for ${guest.name}`)
    })
    .catch(() => {
      showMessage('error', 'Failed to copy link')
    })
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const loadGuests = async () => {
  loading.value = true
  try {
    const response = await guestService.getGuests(props.eventId, {
      search: searchTerm.value,
      ordering: 'name',
      page: currentPage.value,
    })

    if (response.success && response.data) {
      guests.value = response.data.results
      totalCount.value = response.data.count
    } else {
      showMessage('error', response.message || 'Failed to load guests')
    }
  } catch (error) {
    console.error('Error loading guests:', error)
    showMessage('error', 'Failed to load guest list')
  } finally {
    loading.value = false
  }
}

const loadGuestStats = async () => {
  loadingStats.value = true
  try {
    const response = await guestService.getGuestStats(props.eventId)
    if (response.success && response.data) {
      guestStats.value = response.data
    }
  } catch (error) {
    console.error('Error loading guest stats:', error)
  } finally {
    loadingStats.value = false
  }
}

// Pagination methods
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadGuests()
}

const nextPage = () => {
  if (hasNextPage.value) {
    goToPage(currentPage.value + 1)
  }
}

const previousPage = () => {
  if (hasPreviousPage.value) {
    goToPage(currentPage.value - 1)
  }
}


// Watch for search term changes
let searchTimeout: ReturnType<typeof setTimeout>
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1 // Reset to first page on search
    loadGuests()
  }, 300)
}

// Lifecycle
onMounted(() => {
  // Load payments to check template activation status
  loadPayments()
})

// Watch for template payment status changes
watch(hasTemplatePayment, (isActivated) => {
  if (isActivated) {
    loadGroups()
    loadGuests()
    loadGuestStats()
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Custom scrollbar for modal content */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

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
</style>








































