<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[70] overflow-y-auto">
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
                  <div class="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users class="w-5 h-5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Create Guest Group</h2>
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
            <div class="p-6 space-y-5">
              <!-- Group Name -->
              <div>
                <label for="groupName" class="block text-sm font-medium text-slate-700 mb-2">
                  Group Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="groupName"
                  v-model="localGroupName"
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
                  v-model="localGroupDescription"
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
                    v-model="localGroupColor"
                    type="color"
                    class="w-16 h-10 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <input
                    v-model="localGroupColor"
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
                  @click="$emit('close')"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  @click="handleCreate"
                  :disabled="!localGroupName.trim() || isCreating"
                  class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <span
                    v-if="isCreating"
                    class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  {{ isCreating ? 'Creating...' : 'Create Group' }}
                </button>
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
import { Users, X } from 'lucide-vue-next'

// Props
const props = defineProps<{
  show: boolean
  isCreating: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
  create: [data: { name: string; description?: string; color: string }]
}>()

// Local state
const localGroupName = ref('')
const localGroupDescription = ref('')
const localGroupColor = ref('#3498db')

// Reset form when modal is closed
watch(() => props.show, (newShow) => {
  if (!newShow) {
    localGroupName.value = ''
    localGroupDescription.value = ''
    localGroupColor.value = '#3498db'
  }
})

const handleCreate = () => {
  if (!localGroupName.value.trim()) return

  emit('create', {
    name: localGroupName.value.trim(),
    description: localGroupDescription.value.trim() || undefined,
    color: localGroupColor.value,
  })
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
</style>
