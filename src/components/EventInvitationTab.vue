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
      <!-- Guest List Management -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
        <div class="flex flex-col gap-3 sm:gap-2 mb-3 sm:mb-4">
          <div class="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
            <div class="flex items-center gap-3 min-w-0">
              <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center">
                <Users class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] mr-1.5 sm:mr-2" />
                Guest List
              </h3>
              <div class="relative w-60 sm:w-64 md:w-72">
                <input
                  v-model="searchTerm"
                  @input="handleSearch"
                  type="text"
                  placeholder="Search guests..."
                  class="w-full pr-3 pl-8 py-2 rounded-lg border border-slate-200 focus:border-[#1e90ff] focus:ring-2 focus:ring-[#1e90ff]/20 text-sm text-slate-900 placeholder-slate-400"
                />
                <svg class="absolute left-2 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
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
              <button @click="showAddGuestModal = true" class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-xs sm:text-sm">
                <UserPlus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                <span class="hidden sm:inline">Add Guest</span>
                <span class="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
        <!-- Guest List Table -->
        <div v-if="loading" class="text-center py-6 sm:py-8">
          <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff] mx-auto"></div>
          <p class="text-xs sm:text-sm text-slate-600 mt-2">Loading guest list...</p>
        </div>

        <div v-else-if="guests.length === 0" class="text-center py-8 sm:py-12">
          <Users class="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
          <p class="text-sm sm:text-base text-slate-500">No guests added yet</p>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">
            Click "Add Guest" to start building your guest list
          </p>
        </div>

        <!-- Desktop Table View -->
        <div v-else class="hidden md:block overflow-hidden rounded-2xl">
          <table class="min-w-full">
            <thead>
              <tr class="bg-slate-50/50">
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                >
                  Guest Name
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white/50 divide-y divide-slate-100">
              <tr
                v-for="guest in guests"
                :key="guest.id"
                class="hover:bg-slate-50/50 transition-colors cursor-pointer" @click="viewGuestShowcase(guest)"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      class="w-8 h-8 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-semibold text-sm"
                    >
                      {{ getInitials(guest.name) }}
                    </div>
                    <span class="ml-3 text-sm font-medium text-slate-900">{{ guest.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    :class="getStatusClass(guest.invitation_status)"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full mr-1.5"
                      :class="getStatusDotClass(guest.invitation_status)"
                    ></span>
                    {{ getStatusDisplay(guest) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button @click.stop="copyShowcaseLink(guest, 'en')" class="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" :title="`Copy EN link for ${guest.name}`">EN</button>
                    <button @click.stop="copyShowcaseLink(guest, 'kh')" class="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" :title="`Copy KH link for ${guest.name}`">KH</button>
                    <button
                      @click.stop="openDeleteGuestModal(guest)"
                      class="text-red-600 hover:text-red-700"
                      title="Remove Guest"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div v-if="!loading && guests.length > 0" class="md:hidden space-y-2">
          <div
            v-for="guest in guests"
            :key="guest.id"
            class="bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer" @click="viewGuestShowcase(guest)">
            <!-- Single Row Layout -->
            <div class="flex items-center gap-2">
              <!-- Avatar -->
              <div
                class="w-8 h-8 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
              >
                {{ getInitials(guest.name) }}
              </div>

              <!-- Guest Info -->
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-slate-900 truncate leading-tight">{{ guest.name }}</p>
              </div>

              <!-- Status Badge -->
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                :class="getStatusClass(guest.invitation_status)"
              >
                <span
                  class="w-1 h-1 rounded-full mr-1"
                  :class="getStatusDotClass(guest.invitation_status)"
                ></span>
                <span class="hidden xs:inline">{{ getStatusDisplay(guest) }}</span>
              </span>

              <!-- Action Buttons -->
              <div class="flex items-center gap-1 flex-shrink-0">
                <button @click.stop="copyShowcaseLink(guest, 'en')" class="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" :title="`Copy EN link for ${guest.name}`">EN</button>
                    <button @click.stop="copyShowcaseLink(guest, 'kh')" class="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50" :title="`Copy KH link for ${guest.name}`">KH</button>
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

        <!-- Pagination Controls -->
        <div v-if="!loading && guests.length > 0" class="mt-6 space-y-4">
          <!-- Desktop Pagination -->
          <div class="hidden md:flex items-center justify-between">
            <!-- Left: Showing info -->
            <p class="text-sm text-slate-600">
              Showing <span class="font-semibold text-slate-900">{{ showingFrom }}</span> to
              <span class="font-semibold text-slate-900">{{ showingTo }}</span> of
              <span class="font-semibold text-slate-900">{{ totalCount }}</span> guests
            </p>

            <!-- Right: Page navigation -->
            <div class="flex items-center gap-1">
              <!-- Previous Button -->
              <button
                @click="previousPage"
                :disabled="!hasPreviousPage"
                class="px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 text-slate-700"
                :class="{ 'opacity-50 cursor-not-allowed': !hasPreviousPage }"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <!-- Page Numbers -->
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="typeof page === 'number' && goToPage(page)"
                :disabled="page === '...'"
                class="min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                :class="
                  page === currentPage
                    ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md'
                    : page === '...'
                      ? 'cursor-default text-slate-400'
                      : 'hover:bg-slate-100 text-slate-700'
                "
              >
                {{ page }}
              </button>

              <!-- Next Button -->
              <button
                @click="nextPage"
                :disabled="!hasNextPage"
                class="px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 text-slate-700"
                :class="{ 'opacity-50 cursor-not-allowed': !hasNextPage }"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Mobile Pagination -->
          <div class="md:hidden space-y-3">
            <!-- Showing info -->
            <p class="text-xs text-slate-600 text-center">
              Showing {{ showingFrom }}-{{ showingTo }} of {{ totalCount }} guests
            </p>

            <!-- Navigation -->
            <div class="flex items-center justify-between gap-2">
              <!-- Previous Button -->
              <button
                @click="previousPage"
                :disabled="!hasPreviousPage"
                class="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <!-- Page indicator -->
              <div class="px-3 py-2 text-xs font-medium text-slate-700 whitespace-nowrap">
                Page {{ currentPage }} of {{ totalPages }}
              </div>

              <!-- Next Button -->
              <button
                @click="nextPage"
                :disabled="!hasNextPage"
                class="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1"
              >
                Next
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
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
                  <div>
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
                      :disabled="!newGuestName.trim() || isAddingGuest"
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
                  <!-- Download Template Button -->
                  <button
                    type="button"
                    @click="downloadTemplate"
                    class="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    <Download class="w-4 h-4" />
                    Download Template (CSV)
                  </button>

                  <!-- File Upload Area (Before Preview) -->
                  <div v-if="!showImportPreview" class="space-y-4">
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
                      <strong>Format:</strong> One guest name per line. First column for CSV, or entire line for TXT files.
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
                    </div>
                  </div>

                  <!-- Import Preview -->
                  <div v-else class="space-y-4">
                    <div class="space-y-3 sm:space-y-4">
                      <div class="flex items-center justify-between">
                        <h4 class="text-sm font-semibold text-slate-900">Preview Import</h4>
                        <span class="text-xs text-slate-500">
                          {{ importPreview.filter((g) => g.status === 'valid').length }} new guests
                        </span>
                      </div>
                      <div class="max-h-60 overflow-y-auto border border-slate-200 rounded-lg bg-white/90">
                        <div
                          v-for="(guest, idx) in importPreview"
                          :key="idx"
                          :class="[
                            'px-3.5 py-2.5 text-sm flex items-center justify-between',
                            guest.status === 'duplicate' ? 'bg-red-50 text-red-700' : 'bg-white text-slate-700',
                            idx !== importPreview.length - 1 && 'border-b border-slate-100',
                          ]"
                        >
                          <span class="truncate">{{ guest.name }}</span>
                          <span
                            v-if="guest.status === 'duplicate'"
                            class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                          >
                            Duplicate
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                      <button
                        type="button"
                        @click="resetImportState"
                        class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        @click="confirmBulkImport"
                        :disabled="
                          importPreview.filter((g) => g.status === 'valid').length === 0 || isImporting
                        "
                        class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <span
                          v-if="isImporting"
                          class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                        ></span>
                        {{ isImporting ? 'Importing...' : `Import ${importPreview.filter((g) => g.status === 'valid').length} Guests` }}
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
import { guestService, type EventGuest, type GuestStats, type Event } from '../services/api'
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

const addGuest = async () => {
  if (!newGuestName.value.trim()) return

  isAddingGuest.value = true

  try {
    const response = await guestService.createGuest(props.eventId, {
      name: newGuestName.value.trim(),
    })

    if (response.success && response.data) {
      guests.value.unshift(response.data) // Add to beginning of list
      showMessage('success', `${response.data.name} added to guest list`)
      newGuestName.value = ''
      closeAddGuestModal()
      // Refresh stats
      loadGuestStats()
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
  resetImportState()
}

const resetImportState = () => {
  importMode.value = 'single'
  selectedFile.value = null
  isDragging.value = false
  importPreview.value = []
  showImportPreview.value = false
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
  await parseFile(file)
}

const parseFile = async (file: File) => {
  try {
    const text = await file.text()
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    // Parse CSV/TXT - assume first column is name, or entire line if single column
    const parsedGuests: { name: string; status: 'valid' | 'duplicate' }[] = []
    const existingNames = new Set(guests.value.map((g) => g.name.toLowerCase()))

    for (const line of lines) {
      // Skip header row if it looks like a header
      if (
        line.toLowerCase().includes('name') &&
        line.toLowerCase().includes('guest') &&
        lines.indexOf(line) === 0
      ) {
        continue
      }

      // Parse CSV (handle quoted strings)
      let name = ''
      if (line.includes(',')) {
        // Simple CSV parsing - take first column
        const match = line.match(/^"([^"]*)"|^([^,]*)/)
        name = (match?.[1] || match?.[2] || '').trim()
      } else {
        // Single column or TXT file
        name = line.trim()
      }

      if (name.length > 0) {
        const isDuplicate = existingNames.has(name.toLowerCase())
        parsedGuests.push({
          name,
          status: isDuplicate ? 'duplicate' : 'valid',
        })
      }
    }

    if (parsedGuests.length === 0) {
      showMessage('error', 'No valid guest names found in file')
      selectedFile.value = null
      return
    }

    importPreview.value = parsedGuests
    showImportPreview.value = true
  } catch (error) {
    console.error('Error parsing file:', error)
    showMessage('error', 'Failed to parse file. Please check the format.')
    selectedFile.value = null
  }
}

const confirmBulkImport = async () => {
  if (importPreview.value.length === 0) return

  // Filter out duplicates
  const validGuests = importPreview.value
    .filter((g) => g.status === 'valid')
    .map((g) => ({ name: g.name }))

  if (validGuests.length === 0) {
    showMessage('error', 'No new guests to import (all are duplicates)')
    return
  }

  isImporting.value = true

  try {
    // Try bulk import endpoint first
    try {
      const response = await guestService.bulkImportGuests(props.eventId, validGuests)

      if (response.success && response.data) {
        const { created, failed } = response.data

        // Add created guests to the list
        if (created.length > 0) {
          guests.value.unshift(...created)
          loadGuestStats()
        }

        // Show results
        if (failed.length > 0) {
          showMessage(
            'error',
            `Imported ${created.length} guests. ${failed.length} failed: ${failed.map((f) => f.name).join(', ')}`,
          )
        } else {
          showMessage('success', `Successfully imported ${created.length} guests`)
        }

        closeAddGuestModal()
        return
      }
    } catch (_bulkError) {
      console.warn('Bulk import endpoint not available, falling back to individual imports')
    }

    // Fallback: Import one by one using existing endpoint
    const created: EventGuest[] = []
    const failed: { name: string; error: string }[] = []

    for (const guest of validGuests) {
      try {
        const response = await guestService.createGuest(props.eventId, guest)
        if (response.success && response.data) {
          created.push(response.data)
        } else {
          failed.push({
            name: guest.name,
            error: response.message || 'Unknown error',
          })
        }
      } catch (error) {
        failed.push({
          name: guest.name,
          error: 'Failed to create guest',
        })
      }
    }

    // Add created guests to the list
    if (created.length > 0) {
      guests.value.unshift(...created)
      loadGuestStats()
    }

    // Show results
    if (failed.length > 0) {
      showMessage(
        'error',
        `Imported ${created.length} guests. ${failed.length} failed: ${failed.map((f) => f.name).join(', ')}`,
      )
    } else {
      showMessage('success', `Successfully imported ${created.length} guests`)
    }

    closeAddGuestModal()
  } catch (error) {
    console.error('Error importing guests:', error)
    showMessage('error', 'Failed to import guests')
  } finally {
    isImporting.value = false
  }
}

const downloadTemplate = () => {
  const csvContent = 'Guest Name\nJohn Doe\nJane Smith\nMichael Johnson'
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








































