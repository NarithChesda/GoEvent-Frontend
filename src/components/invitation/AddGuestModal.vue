<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="show"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[580px] lg:w-[640px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="$emit('close')"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-semibold text-white">Add Guest</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <div class="p-4 space-y-5 pb-24">
            <!-- Mode Toggle -->
            <div class="space-y-3 sm:space-y-4">
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="localMode = 'single'"
                  :class="[
                    'flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-200',
                    localMode === 'single'
                      ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  ]"
                >
                  <UserPlus class="w-4 h-4 inline-block mr-1.5" />
                  Single Guest
                </button>
                <button
                  type="button"
                  @click="localMode = 'bulk'"
                  :class="[
                    'flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-200',
                    localMode === 'bulk'
                      ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  ]"
                >
                  <Upload class="w-4 h-4 inline-block mr-1.5" />
                  Bulk Import
                </button>
              </div>
            </div>

            <!-- Single Guest Mode -->
            <div v-if="localMode === 'single'" class="space-y-5">
              <!-- Group Selection -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label for="guestGroup" class="block text-sm font-medium text-slate-700">
                    Select Group <span class="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    @click="showCreateGroupForm = !showCreateGroupForm"
                    class="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
                  >
                    {{ showCreateGroupForm ? 'Cancel' : '+ Create Group' }}
                  </button>
                </div>

                <!-- Inline Create Group Form -->
                <Transition name="slide-down">
                  <div v-if="showCreateGroupForm" class="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
                    <div class="flex items-center gap-2 text-purple-700 mb-2">
                      <Users class="w-4 h-4" />
                      <span class="text-sm font-medium">New Group</span>
                    </div>
                    <input
                      v-model="newGroupName"
                      type="text"
                      placeholder="Group name *"
                      class="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
                    />
                    <input
                      v-model="newGroupDescription"
                      type="text"
                      placeholder="Description (optional)"
                      class="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
                    />
                    <div class="flex items-center gap-2">
                      <input
                        v-model="newGroupColor"
                        type="color"
                        class="w-10 h-8 rounded border border-purple-200 cursor-pointer"
                      />
                      <div class="flex-1 flex flex-wrap gap-1.5">
                        <button
                          v-for="color in colorPresets"
                          :key="color"
                          type="button"
                          @click="newGroupColor = color"
                          :class="[
                            'w-6 h-6 rounded-md border transition-all',
                            newGroupColor === color ? 'border-slate-900 ring-1 ring-offset-1 ring-slate-400' : 'border-transparent'
                          ]"
                          :style="{ backgroundColor: color }"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      @click="handleCreateGroup"
                      :disabled="!newGroupName.trim() || isCreatingGroup"
                      class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span v-if="isCreatingGroup" class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
                      <span>{{ isCreatingGroup ? 'Creating...' : 'Create Group' }}</span>
                    </button>
                  </div>
                </Transition>

                <GroupDropdown
                  v-model="localSelectedGroup"
                  :groups="groups"
                  placeholder="Choose a group..."
                  :show-actions="true"
                  @edit-group="openInlineEditGroup"
                  @delete-group="openInlineDeleteGroup"
                />
                <p v-if="groups.length === 0 && !showCreateGroupForm" class="mt-2 text-xs text-red-600">
                  Please create a group first before adding guests.
                </p>

                <!-- Inline Edit Group Form -->
                <Transition name="slide-down">
                  <div v-if="showEditGroupForm && editingGroup" class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 text-blue-700">
                        <Edit2 class="w-4 h-4" />
                        <span class="text-sm font-medium">Edit Group</span>
                      </div>
                      <button
                        type="button"
                        @click="closeInlineEditGroup"
                        class="p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      v-model="editGroupName"
                      type="text"
                      placeholder="Group name *"
                      class="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                    />
                    <input
                      v-model="editGroupDescription"
                      type="text"
                      placeholder="Description (optional)"
                      class="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                    />
                    <div class="flex items-center gap-2">
                      <input
                        v-model="editGroupColor"
                        type="color"
                        class="w-10 h-8 rounded border border-blue-200 cursor-pointer"
                      />
                      <div class="flex-1 flex flex-wrap gap-1.5">
                        <button
                          v-for="color in colorPresets"
                          :key="color"
                          type="button"
                          @click="editGroupColor = color"
                          :class="[
                            'w-6 h-6 rounded-md border transition-all',
                            editGroupColor === color ? 'border-slate-900 ring-1 ring-offset-1 ring-slate-400' : 'border-transparent'
                          ]"
                          :style="{ backgroundColor: color }"
                        />
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        @click="closeInlineEditGroup"
                        class="flex-1 px-3 py-2 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        @click="submitInlineEditGroup"
                        :disabled="!editGroupName.trim() || isUpdatingGroup"
                        class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span v-if="isUpdatingGroup" class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
                        <span>{{ isUpdatingGroup ? 'Saving...' : 'Save Changes' }}</span>
                      </button>
                    </div>
                  </div>
                </Transition>

                <!-- Inline Delete Group Confirmation -->
                <Transition name="slide-down">
                  <div v-if="showDeleteGroupConfirm && deletingGroup" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl space-y-3">
                    <div class="flex items-center gap-2 text-red-700">
                      <Trash2 class="w-4 h-4" />
                      <span class="text-sm font-medium">Delete Group</span>
                    </div>
                    <p class="text-sm text-red-800">
                      Are you sure you want to delete "<span class="font-semibold">{{ deletingGroup.name }}</span>"?
                    </p>
                    <p v-if="deletingGroup.guest_count > 0" class="text-xs text-red-600 bg-red-100 px-2 py-1.5 rounded-md">
                      ⚠️ This will also delete {{ deletingGroup.guest_count }} guest(s) in this group!
                    </p>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        @click="closeInlineDeleteGroup"
                        class="flex-1 px-3 py-2 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        @click="submitInlineDeleteGroup"
                        :disabled="isDeletingGroup"
                        class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span v-if="isDeletingGroup" class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
                        <span>{{ isDeletingGroup ? 'Deleting...' : 'Delete Group' }}</span>
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Guest Name -->
              <div>
                <label for="guestName" class="block text-sm font-medium text-slate-700 mb-2">
                  Guest Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="guestName"
                  v-model="localGuestName"
                  type="text"
                  required
                  placeholder="Enter guest's full name"
                  @blur="guestNameTouched = true"
                  :class="[
                    'w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200',
                    showGuestNameError
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                      : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-400 hover:border-emerald-300'
                  ]"
                />
                <p v-if="showGuestNameError" class="mt-1.5 text-xs text-red-600">
                  {{ guestNameErrorMessage }}
                </p>
              </div>
            </div>

            <!-- Bulk Import Mode -->
            <div v-else class="space-y-5">
              <!-- Group Selection -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label for="importGroup" class="block text-sm font-medium text-slate-700">
                    Select Group <span class="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    @click="showCreateGroupForm = !showCreateGroupForm"
                    class="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
                  >
                    {{ showCreateGroupForm ? 'Cancel' : '+ Create Group' }}
                  </button>
                </div>

                <!-- Inline Create Group Form -->
                <Transition name="slide-down">
                  <div v-if="showCreateGroupForm" class="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
                    <div class="flex items-center gap-2 text-purple-700 mb-2">
                      <Users class="w-4 h-4" />
                      <span class="text-sm font-medium">New Group</span>
                    </div>
                    <input
                      v-model="newGroupName"
                      type="text"
                      placeholder="Group name *"
                      class="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
                    />
                    <input
                      v-model="newGroupDescription"
                      type="text"
                      placeholder="Description (optional)"
                      class="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
                    />
                    <div class="flex items-center gap-2">
                      <input
                        v-model="newGroupColor"
                        type="color"
                        class="w-10 h-8 rounded border border-purple-200 cursor-pointer"
                      />
                      <div class="flex-1 flex flex-wrap gap-1.5">
                        <button
                          v-for="color in colorPresets"
                          :key="color"
                          type="button"
                          @click="newGroupColor = color"
                          :class="[
                            'w-6 h-6 rounded-md border transition-all',
                            newGroupColor === color ? 'border-slate-900 ring-1 ring-offset-1 ring-slate-400' : 'border-transparent'
                          ]"
                          :style="{ backgroundColor: color }"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      @click="handleCreateGroup"
                      :disabled="!newGroupName.trim() || isCreatingGroup"
                      class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span v-if="isCreatingGroup" class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
                      <span>{{ isCreatingGroup ? 'Creating...' : 'Create Group' }}</span>
                    </button>
                  </div>
                </Transition>

                <GroupDropdown
                  v-model="localSelectedGroupForImport"
                  :groups="groups"
                  placeholder="Choose a group..."
                  :show-actions="true"
                  @change="handleImportGroupChange"
                  @edit-group="openInlineEditGroup"
                  @delete-group="openInlineDeleteGroup"
                />
                <p v-if="groups.length === 0 && !showCreateGroupForm" class="mt-2 text-xs text-red-600">
                  Please create a group first before importing guests.
                </p>

                <!-- Inline Edit Group Form (Bulk Import Mode) -->
                <Transition name="slide-down">
                  <div v-if="showEditGroupForm && editingGroup" class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 text-blue-700">
                        <Edit2 class="w-4 h-4" />
                        <span class="text-sm font-medium">Edit Group</span>
                      </div>
                      <button
                        type="button"
                        @click="closeInlineEditGroup"
                        class="p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      v-model="editGroupName"
                      type="text"
                      placeholder="Group name *"
                      class="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                    />
                    <input
                      v-model="editGroupDescription"
                      type="text"
                      placeholder="Description (optional)"
                      class="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                    />
                    <div class="flex items-center gap-2">
                      <input
                        v-model="editGroupColor"
                        type="color"
                        class="w-10 h-8 rounded border border-blue-200 cursor-pointer"
                      />
                      <div class="flex-1 flex flex-wrap gap-1.5">
                        <button
                          v-for="color in colorPresets"
                          :key="color"
                          type="button"
                          @click="editGroupColor = color"
                          :class="[
                            'w-6 h-6 rounded-md border transition-all',
                            editGroupColor === color ? 'border-slate-900 ring-1 ring-offset-1 ring-slate-400' : 'border-transparent'
                          ]"
                          :style="{ backgroundColor: color }"
                        />
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        @click="closeInlineEditGroup"
                        class="flex-1 px-3 py-2 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        @click="submitInlineEditGroup"
                        :disabled="!editGroupName.trim() || isUpdatingGroup"
                        class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span v-if="isUpdatingGroup" class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
                        <span>{{ isUpdatingGroup ? 'Saving...' : 'Save Changes' }}</span>
                      </button>
                    </div>
                  </div>
                </Transition>

                <!-- Inline Delete Group Confirmation (Bulk Import Mode) -->
                <Transition name="slide-down">
                  <div v-if="showDeleteGroupConfirm && deletingGroup" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl space-y-3">
                    <div class="flex items-center gap-2 text-red-700">
                      <Trash2 class="w-4 h-4" />
                      <span class="text-sm font-medium">Delete Group</span>
                    </div>
                    <p class="text-sm text-red-800">
                      Are you sure you want to delete "<span class="font-semibold">{{ deletingGroup.name }}</span>"?
                    </p>
                    <p v-if="deletingGroup.guest_count > 0" class="text-xs text-red-600 bg-red-100 px-2 py-1.5 rounded-md">
                      ⚠️ This will also delete {{ deletingGroup.guest_count }} guest(s) in this group!
                    </p>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        @click="closeInlineDeleteGroup"
                        class="flex-1 px-3 py-2 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        @click="submitInlineDeleteGroup"
                        :disabled="isDeletingGroup"
                        class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span v-if="isDeletingGroup" class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
                        <span>{{ isDeletingGroup ? 'Deleting...' : 'Delete Group' }}</span>
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Download Template Button -->
              <button
                type="button"
                @click="$emit('download-template')"
                class="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                <Download class="w-4 h-4" />
                Download Template (CSV)
              </button>

              <!-- File Upload Area (shown when no preview) -->
              <div v-if="!filePreview" class="space-y-4">
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
                    @click="triggerFileSelect"
                  >
                    <!-- Parsing Indicator -->
                    <div v-if="isParsing" class="flex flex-col items-center">
                      <div class="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 animate-spin border-4 border-sky-500 border-t-transparent rounded-full"></div>
                      <p class="text-sm font-medium text-slate-700">Parsing file...</p>
                    </div>
                    <template v-else>
                      <Upload
                        :class="['w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3', isDragging ? 'text-sky-500' : 'text-slate-400']"
                      />
                      <p class="text-sm font-medium text-slate-700 mb-1">
                        {{ selectedFile ? selectedFile.name : 'Drop your file here or click to browse' }}
                      </p>
                      <p class="text-xs text-slate-500">
                        Supported formats: CSV, Excel (.xlsx, .xls), TXT
                      </p>
                    </template>
                    <input
                      ref="fileInputRef"
                      type="file"
                      accept=".csv,.xlsx,.xls,.txt,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                      @change="handleFileSelect"
                      class="hidden"
                    />
                  </div>
                </div>

                <!-- Parse Error -->
                <div v-if="parseError" class="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                  <AlertCircle class="w-4 h-4 inline-block mr-1.5 text-red-600" />
                  {{ parseError }}
                </div>

                <div class="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-slate-600">
                  <FileText class="w-4 h-4 inline-block mr-1.5 text-sky-600" />
                  <strong>Format:</strong> CSV must have "name" as the header in the first row. Excel/TXT: one guest name per line.
                </div>
              </div>

              <!-- File Preview Section -->
              <div v-if="filePreview" class="space-y-4">
                <!-- File Info Header -->
                <div class="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                  <div class="flex items-center gap-2">
                    <FileSpreadsheet class="w-5 h-5 text-emerald-600" />
                    <div>
                      <p class="text-sm font-medium text-slate-900 truncate max-w-[200px]">{{ filePreview.fileName }}</p>
                      <p class="text-xs text-slate-500">{{ filePreview.totalRows }} guest(s) found</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="$emit('clear-preview')"
                    class="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                    title="Remove file"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>

                <!-- Preview Stats -->
                <div class="grid grid-cols-3 gap-3">
                  <div class="bg-slate-50 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-slate-900">{{ filePreview.totalRows }}</p>
                    <p class="text-xs text-slate-500">Total</p>
                  </div>
                  <div class="bg-emerald-50 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-emerald-600">{{ filePreview.validCount }}</p>
                    <p class="text-xs text-emerald-600">Valid</p>
                  </div>
                  <div class="bg-red-50 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-red-600">{{ filePreview.invalidCount }}</p>
                    <p class="text-xs text-red-600">Invalid</p>
                  </div>
                </div>

                <!-- Preview Table -->
                <div class="border border-slate-200 rounded-xl overflow-hidden">
                  <div class="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
                    <p class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Preview (click name to edit)</p>
                  </div>
                  <div class="max-h-[250px] overflow-y-auto">
                    <table class="w-full">
                      <thead class="bg-slate-50 sticky top-0">
                        <tr>
                          <th class="px-4 py-2 text-left text-xs font-semibold text-slate-600 w-12">#</th>
                          <th class="px-4 py-2 text-left text-xs font-semibold text-slate-600">Name</th>
                          <th class="px-4 py-2 text-left text-xs font-semibold text-slate-600 w-24">Status</th>
                          <th class="px-2 py-2 text-center text-xs font-semibold text-slate-600 w-10"></th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        <tr
                          v-for="(guest, index) in filePreview.guests"
                          :key="index"
                          :class="guest.isValid ? '' : 'bg-red-50/50'"
                        >
                          <td class="px-4 py-2.5 text-xs text-slate-500">{{ index + 1 }}</td>
                          <td class="px-4 py-2.5 text-sm">
                            <input
                              type="text"
                              :value="guest.name"
                              @input="handleGuestNameChange(index, $event)"
                              :class="[
                                'w-full px-2 py-1 text-sm border rounded-md transition-colors',
                                guest.isValid
                                  ? 'border-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20'
                                  : 'border-red-300 bg-red-50 text-red-700 focus:border-red-400 focus:ring-1 focus:ring-red-400/20'
                              ]"
                              placeholder="Enter name"
                            />
                            <span v-if="guest.error" class="block text-xs text-red-500 mt-0.5">{{ guest.error }}</span>
                          </td>
                          <td class="px-4 py-2.5">
                            <span
                              v-if="guest.isValid"
                              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"
                            >
                              <CheckCircle class="w-3 h-3" />
                              Valid
                            </span>
                            <span
                              v-else
                              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"
                            >
                              <AlertCircle class="w-3 h-3" />
                              Invalid
                            </span>
                          </td>
                          <td class="px-2 py-2.5 text-center">
                            <button
                              type="button"
                              @click="handleDeleteGuest(index)"
                              class="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Remove from list"
                            >
                              <Trash2 class="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Warning for invalid entries -->
                <div v-if="filePreview.invalidCount > 0" class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  <AlertCircle class="w-4 h-4 inline-block mr-1.5 text-amber-600" />
                  {{ filePreview.invalidCount }} invalid entries will be skipped during import.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <!-- Single Guest Mode Actions -->
            <template v-if="localMode === 'single'">
              <button
                type="button"
                @click="handleAddGuest"
                :disabled="!canAddGuest"
                class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  v-if="isAdding"
                  class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
                ></span>
                <UserPlus v-else class="w-4 h-4" />
                <span>{{ isAdding ? 'Adding...' : 'Add Guest' }}</span>
              </button>
            </template>

            <!-- Bulk Import Mode Actions -->
            <template v-else>
              <button
                type="button"
                @click="handleImport"
                :disabled="!filePreview || filePreview.validCount === 0 || !localSelectedGroupForImport || isImporting"
                class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  v-if="isImporting"
                  class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
                ></span>
                <Upload v-else class="w-4 h-4" />
                <span>{{ isImporting ? 'Importing...' : `Import ${filePreview?.validCount || 0} Guest(s)` }}</span>
              </button>
            </template>

            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { UserPlus, X, Upload, Download, FileText, FileSpreadsheet, CheckCircle, AlertCircle, Trash2, ArrowRight, Users, Edit2 } from 'lucide-vue-next'
import GroupDropdown from './GroupDropdown.vue'
import type { GuestGroup } from '../../services/api'
import type { FilePreview } from '../../composables/invitation/useBulkImport'

// Props
const props = defineProps<{
  show: boolean
  groups: GuestGroup[]
  isAdding: boolean
  isImporting: boolean
  isParsing: boolean
  selectedFile: File | null
  isDragging: boolean
  filePreview: FilePreview | null
  parseError: string | null
  pendingGroupId?: number | null
  isCreatingGroup?: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
  'add-guest': [name: string, groupId: number]
  import: [groupId: number]
  'download-template': []
  'file-select': [event: Event]
  'file-drop': [event: DragEvent]
  'drag-over': [event: DragEvent]
  'drag-leave': []
  'create-group': [data: { name: string; description?: string; color: string }]
  'clear-preview': []
  'group-change': [groupId: number]
  'update-guest-name': [index: number, newName: string, groupId: number | null]
  'delete-guest': [index: number, groupId: number | null]
  'edit-group': [group: GuestGroup]
  'delete-group': [group: GuestGroup]
}>()

// Color presets for quick selection
const colorPresets = [
  '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f39c12',
  '#1abc9c', '#e91e63', '#00bcd4', '#ff5722', '#607d8b'
]

// Local state
const localMode = ref<'single' | 'bulk'>('single')
const localGuestName = ref('')
const localSelectedGroup = ref<number | null>(null)
const localSelectedGroupForImport = ref<number | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const guestNameTouched = ref(false)

// Create group form state
const showCreateGroupForm = ref(false)
const newGroupName = ref('')
const newGroupDescription = ref('')
const newGroupColor = ref('#3498db')

// Edit group form state
const showEditGroupForm = ref(false)
const editingGroup = ref<GuestGroup | null>(null)
const editGroupName = ref('')
const editGroupDescription = ref('')
const editGroupColor = ref('#3498db')
const isUpdatingGroup = ref(false)

// Delete group confirmation state
const showDeleteGroupConfirm = ref(false)
const deletingGroup = ref<GuestGroup | null>(null)
const isDeletingGroup = ref(false)

// Validation computed properties
const guestNameErrorMessage = computed(() => {
  const name = localGuestName.value.trim()
  if (!name) return 'Guest name is required'
  if (name.length < 2) return 'Name must be at least 2 characters'
  if (name.length > 100) return 'Name must be less than 100 characters'
  return ''
})

const showGuestNameError = computed(() => {
  return guestNameTouched.value && guestNameErrorMessage.value !== ''
})

const canAddGuest = computed(() => {
  const name = localGuestName.value.trim()
  return (
    name.length >= 2 &&
    name.length <= 100 &&
    localSelectedGroup.value !== null &&
    !props.isAdding
  )
})

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Reset form when drawer is closed
watch(() => props.show, (newShow) => {
  if (!newShow) {
    localMode.value = 'single'
    localGuestName.value = ''
    localSelectedGroup.value = null
    localSelectedGroupForImport.value = null
    guestNameTouched.value = false
    // Reset create group form
    showCreateGroupForm.value = false
    newGroupName.value = ''
    newGroupDescription.value = ''
    newGroupColor.value = '#3498db'
    // Reset edit group form
    showEditGroupForm.value = false
    editingGroup.value = null
    editGroupName.value = ''
    editGroupDescription.value = ''
    editGroupColor.value = '#3498db'
    isUpdatingGroup.value = false
    // Reset delete group confirmation
    showDeleteGroupConfirm.value = false
    deletingGroup.value = null
    isDeletingGroup.value = false
    // Clear file input to allow re-selecting the same file
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
    // Restore body scroll
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  } else {
    // Lock body scroll when drawer opens
    const scrollbarWidth = getScrollbarWidth()
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    // Auto-select the pending group when drawer opens
    if (props.pendingGroupId) {
      localSelectedGroup.value = props.pendingGroupId
      localSelectedGroupForImport.value = props.pendingGroupId
    }
  }
})

// Watch for successful group creation to auto-select the new group
watch(() => props.groups.length, (newLength, oldLength) => {
  if (newLength > oldLength && showCreateGroupForm.value) {
    // A new group was added, select it
    const newGroup = props.groups[props.groups.length - 1]
    if (newGroup) {
      if (localMode.value === 'single') {
        localSelectedGroup.value = newGroup.id
      } else {
        localSelectedGroupForImport.value = newGroup.id
      }
    }
    // Close the create group form and reset fields
    showCreateGroupForm.value = false
    newGroupName.value = ''
    newGroupDescription.value = ''
    newGroupColor.value = '#3498db'
  }
})

// Handle import group change to re-validate preview
const handleImportGroupChange = (groupId: number) => {
  emit('group-change', groupId)
}

const handleAddGuest = () => {
  if (!canAddGuest.value) return
  emit('add-guest', localGuestName.value.trim(), localSelectedGroup.value!)
}

const handleImport = () => {
  if (!props.filePreview || props.filePreview.validCount === 0 || !localSelectedGroupForImport.value) return
  emit('import', localSelectedGroupForImport.value)
}

const handleCreateGroup = () => {
  if (!newGroupName.value.trim()) return

  emit('create-group', {
    name: newGroupName.value.trim(),
    description: newGroupDescription.value.trim() || undefined,
    color: newGroupColor.value,
  })
}

const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  emit('file-select', event)
}

const handleFileDrop = (event: DragEvent) => {
  emit('file-drop', event)
}

const handleDragOver = (event: DragEvent) => {
  emit('drag-over', event)
}

const handleDragLeave = () => {
  emit('drag-leave')
}

const handleGuestNameChange = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update-guest-name', index, target.value, localSelectedGroupForImport.value)
}

const handleDeleteGuest = (index: number) => {
  emit('delete-guest', index, localSelectedGroupForImport.value)
}

// Inline edit group handlers
const openInlineEditGroup = (group: GuestGroup) => {
  // Close other forms
  showCreateGroupForm.value = false
  showDeleteGroupConfirm.value = false

  // Set up edit form
  editingGroup.value = group
  editGroupName.value = group.name
  editGroupDescription.value = group.description || ''
  editGroupColor.value = group.color || '#3498db'
  showEditGroupForm.value = true
}

const closeInlineEditGroup = () => {
  showEditGroupForm.value = false
  editingGroup.value = null
  editGroupName.value = ''
  editGroupDescription.value = ''
  editGroupColor.value = '#3498db'
}

const submitInlineEditGroup = () => {
  if (!editingGroup.value || !editGroupName.value.trim()) return

  isUpdatingGroup.value = true

  emit('edit-group', {
    ...editingGroup.value,
    name: editGroupName.value.trim(),
    description: editGroupDescription.value.trim() || undefined,
    color: editGroupColor.value,
  } as GuestGroup)

  // Note: Parent will handle the API call and close the form on success
  // We'll reset the form state after a short delay to allow parent to process
  setTimeout(() => {
    isUpdatingGroup.value = false
    closeInlineEditGroup()
  }, 500)
}

// Inline delete group handlers
const openInlineDeleteGroup = (group: GuestGroup) => {
  // Close other forms
  showCreateGroupForm.value = false
  showEditGroupForm.value = false

  deletingGroup.value = group
  showDeleteGroupConfirm.value = true
}

const closeInlineDeleteGroup = () => {
  showDeleteGroupConfirm.value = false
  deletingGroup.value = null
}

const submitInlineDeleteGroup = () => {
  if (!deletingGroup.value) return

  isDeletingGroup.value = true

  emit('delete-group', deletingGroup.value)

  // Note: Parent will handle the API call
  setTimeout(() => {
    isDeletingGroup.value = false
    closeInlineDeleteGroup()
  }, 500)
}
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}

/* Slide down transition for inline form */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Custom scrollbar */
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
</style>
