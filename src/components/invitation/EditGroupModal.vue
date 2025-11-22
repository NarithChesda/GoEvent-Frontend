<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[70] overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>

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
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Edit Group</h2>
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
            <form @submit.prevent="handleSubmit" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <!-- Group Name -->
              <div>
                <label for="editGroupName" class="block text-sm font-medium text-slate-700 mb-2">
                  Group Name <span class="text-red-500">*</span>
                </label>
                <input
                  id="editGroupName"
                  v-model="formData.name"
                  type="text"
                  required
                  placeholder="e.g., Family, Friends, Colleagues"
                  class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                  :class="{ 'border-red-300 focus:ring-red-200 focus:border-red-400': fieldErrors.name }"
                />
                <p v-if="fieldErrors.name" class="mt-1 text-xs text-red-600">{{ fieldErrors.name }}</p>
              </div>

              <!-- Group Description (Optional) -->
              <div>
                <label for="editGroupDescription" class="block text-sm font-medium text-slate-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  id="editGroupDescription"
                  v-model="formData.description"
                  type="text"
                  placeholder="e.g., Close family members"
                  class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                  :class="{ 'border-red-300 focus:ring-red-200 focus:border-red-400': fieldErrors.description }"
                />
                <p v-if="fieldErrors.description" class="mt-1 text-xs text-red-600">{{ fieldErrors.description }}</p>
              </div>

              <!-- Group Color -->
              <div>
                <label for="editGroupColor" class="block text-sm font-medium text-slate-700 mb-2">
                  Group Color
                </label>
                <div class="flex items-center gap-3">
                  <input
                    id="editGroupColor"
                    v-model="formData.color"
                    type="color"
                    class="w-16 h-10 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <input
                    v-model="formData.color"
                    type="text"
                    placeholder="#3498db"
                    class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                  />
                </div>
              </div>

              <!-- Error Message -->
              <div v-if="errorMessage" class="rounded-lg bg-red-50 border border-red-200 p-3">
                <p class="text-sm text-red-800">{{ errorMessage }}</p>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  :disabled="isUpdating"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="!isFormValid || isUpdating"
                  class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-purple-500/25 hover:shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <span
                    v-if="isUpdating"
                    class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  {{ isUpdating ? 'Updating...' : 'Update Group' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Users, X } from 'lucide-vue-next'
import type { GuestGroup } from '../../services/api'

// Props
const props = defineProps<{
  show: boolean
  group: GuestGroup | null
  isUpdating: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
  'update-group': [groupId: number, data: any]
}>()


// Form data
interface FormData {
  name: string
  description: string
  color: string
}

const formData = ref<FormData>({
  name: '',
  description: '',
  color: '#3498db',
})

const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})

// Initialize form data when group prop changes
watch(() => props.group, (newGroup) => {
  if (newGroup) {
    formData.value = {
      name: newGroup.name || '',
      description: newGroup.description || '',
      color: newGroup.color || '#3498db',
    }
    errorMessage.value = ''
    fieldErrors.value = {}
  }
}, { immediate: true })

// Reset form when modal is closed
watch(() => props.show, (newShow) => {
  if (!newShow) {
    errorMessage.value = ''
    fieldErrors.value = {}
  }
})

// Form validation
const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.color !== ''
})

// Handle form submission
const handleSubmit = () => {
  if (!props.group || !isFormValid.value) {
    return
  }

  // Clear previous errors
  errorMessage.value = ''
  fieldErrors.value = {}

  // Prepare update data
  const updateData: any = {
    name: formData.value.name.trim(),
    color: formData.value.color,
  }

  // Add description if provided
  if (formData.value.description && formData.value.description.trim()) {
    updateData.description = formData.value.description.trim()
  } else {
    // Send empty string to clear description
    updateData.description = ''
  }

  emit('update-group', props.group.id, updateData)
}

// Expose method to set field errors from parent
const setFieldErrors = (errors: Record<string, string[]>) => {
  fieldErrors.value = {}
  Object.entries(errors).forEach(([field, messages]) => {
    if (messages && messages.length > 0) {
      fieldErrors.value[field] = messages[0]
    }
  })
}

const setErrorMessage = (message: string) => {
  errorMessage.value = message
}

// Expose methods for parent component
defineExpose({
  setFieldErrors,
  setErrorMessage,
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
</style>
