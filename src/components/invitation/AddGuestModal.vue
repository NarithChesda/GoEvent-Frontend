<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-md bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <UserPlus class="w-5 h-5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Add Guest</h2>
                </div>
                <button
                  @click="$emit('close')"
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
                    @click="localMode = 'single'"
                    :class="[
                      'flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-200',
                      localMode === 'single'
                        ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md'
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
              <div v-if="localMode === 'single'" class="space-y-5">
                <!-- Group Selection -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label for="guestGroup" class="block text-sm font-medium text-slate-700">
                      Select Group <span class="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      @click="$emit('create-group')"
                      class="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
                    >
                      + Create Group
                    </button>
                  </div>
                  <div class="relative">
                    <button
                      type="button"
                      @click="isGroupDropdownOpen = !isGroupDropdownOpen"
                      class="w-full flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium transition-all duration-200 hover:border-emerald-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <Users class="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span class="flex-1 text-left text-slate-900 truncate">
                        {{ localSelectedGroup ? groups.find(g => g.id === localSelectedGroup)?.name : 'Choose a group...' }}
                      </span>
                      <ChevronDown class="w-4 h-4 text-slate-400 transition-transform flex-shrink-0" :class="{ 'rotate-180': isGroupDropdownOpen }" />
                    </button>

                    <!-- Dropdown Menu -->
                    <Transition name="dropdown">
                      <div
                        v-if="isGroupDropdownOpen"
                        class="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-[300px] overflow-y-auto"
                        @click.stop
                      >
                        <button
                          v-for="group in groups"
                          :key="group.id"
                          type="button"
                          @click="selectGroup(group.id)"
                          :class="[
                            'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200',
                            localSelectedGroup === group.id
                              ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white'
                              : 'text-slate-700 hover:bg-slate-50'
                          ]"
                        >
                          <div
                            class="w-3 h-3 rounded-full flex-shrink-0"
                            :style="{ backgroundColor: localSelectedGroup === group.id ? 'white' : (group.color || '#3498db') }"
                          />
                          <span class="flex-1 text-left truncate">{{ group.name }}</span>
                          <span class="text-xs opacity-75">({{ group.guest_count }})</span>
                        </button>
                      </div>
                    </Transition>

                    <!-- Click outside to close dropdown -->
                    <div
                      v-if="isGroupDropdownOpen"
                      @click="isGroupDropdownOpen = false"
                      class="fixed inset-0 z-[90]"
                    ></div>
                  </div>
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
                    v-model="localGuestName"
                    type="text"
                    required
                    placeholder="Enter guest's full name"
                    class="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-white transition-all duration-200 hover:border-emerald-300"
                  />
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                  <button
                    type="button"
                    @click="$emit('close')"
                    class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    @click="handleAddGuest"
                    :disabled="!localGuestName.trim() || !localSelectedGroup || isAdding"
                    class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <span
                      v-if="isAdding"
                      class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                    ></span>
                    {{ isAdding ? 'Adding...' : 'Add Guest' }}
                  </button>
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
                      @click="$emit('create-group')"
                      class="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
                    >
                      + Create Group
                    </button>
                  </div>
                  <div class="relative">
                    <button
                      type="button"
                      @click="isImportGroupDropdownOpen = !isImportGroupDropdownOpen"
                      class="w-full flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium transition-all duration-200 hover:border-emerald-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <Users class="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span class="flex-1 text-left text-slate-900 truncate">
                        {{ localSelectedGroupForImport ? groups.find(g => g.id === localSelectedGroupForImport)?.name : 'Choose a group...' }}
                      </span>
                      <ChevronDown class="w-4 h-4 text-slate-400 transition-transform flex-shrink-0" :class="{ 'rotate-180': isImportGroupDropdownOpen }" />
                    </button>

                    <!-- Dropdown Menu -->
                    <Transition name="dropdown">
                      <div
                        v-if="isImportGroupDropdownOpen"
                        class="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-[300px] overflow-y-auto"
                        @click.stop
                      >
                        <button
                          v-for="group in groups"
                          :key="group.id"
                          type="button"
                          @click="selectImportGroup(group.id)"
                          :class="[
                            'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200',
                            localSelectedGroupForImport === group.id
                              ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white'
                              : 'text-slate-700 hover:bg-slate-50'
                          ]"
                        >
                          <div
                            class="w-3 h-3 rounded-full flex-shrink-0"
                            :style="{ backgroundColor: localSelectedGroupForImport === group.id ? 'white' : (group.color || '#3498db') }"
                          />
                          <span class="flex-1 text-left truncate">{{ group.name }}</span>
                          <span class="text-xs opacity-75">({{ group.guest_count }})</span>
                        </button>
                      </div>
                    </Transition>

                    <!-- Click outside to close dropdown -->
                    <div
                      v-if="isImportGroupDropdownOpen"
                      @click="isImportGroupDropdownOpen = false"
                      class="fixed inset-0 z-[90]"
                    ></div>
                  </div>
                  <p v-if="groups.length === 0" class="mt-2 text-xs text-red-600">
                    Please create a group first before importing guests.
                  </p>
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
                      @click="triggerFileSelect"
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
                        ref="fileInputRef"
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
                      @click="$emit('close')"
                      class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      @click="handleImport"
                      :disabled="!selectedFile || !localSelectedGroupForImport || isImporting"
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
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { UserPlus, X, Upload, Download, FileText, ChevronDown, Users } from 'lucide-vue-next'
import type { GuestGroup } from '../../services/api'

// Props
const props = defineProps<{
  show: boolean
  groups: GuestGroup[]
  isAdding: boolean
  isImporting: boolean
  selectedFile: File | null
  isDragging: boolean
  pendingGroupId?: number | null
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
  'create-group': []
}>()

// Local state
const localMode = ref<'single' | 'bulk'>('single')
const localGuestName = ref('')
const localSelectedGroup = ref<number | null>(null)
const localSelectedGroupForImport = ref<number | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const isGroupDropdownOpen = ref(false)
const isImportGroupDropdownOpen = ref(false)

// Reset form when modal is closed
watch(() => props.show, (newShow) => {
  if (!newShow) {
    localMode.value = 'single'
    localGuestName.value = ''
    localSelectedGroup.value = null
    localSelectedGroupForImport.value = null
    isGroupDropdownOpen.value = false
    isImportGroupDropdownOpen.value = false
  } else if (newShow && props.pendingGroupId) {
    // Auto-select the pending group when modal opens
    localSelectedGroup.value = props.pendingGroupId
    localSelectedGroupForImport.value = props.pendingGroupId
  }
})

// Methods for dropdown
const selectGroup = (groupId: number) => {
  localSelectedGroup.value = groupId
  isGroupDropdownOpen.value = false
}

const selectImportGroup = (groupId: number) => {
  localSelectedGroupForImport.value = groupId
  isImportGroupDropdownOpen.value = false
}

const handleAddGuest = () => {
  if (!localGuestName.value.trim() || !localSelectedGroup.value) return
  emit('add-guest', localGuestName.value.trim(), localSelectedGroup.value)
}

const handleImport = () => {
  if (!props.selectedFile || !localSelectedGroupForImport.value) return
  emit('import', localSelectedGroupForImport.value)
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

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
