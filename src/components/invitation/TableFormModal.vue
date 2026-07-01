<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[70] overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl ring-1 ring-slate-900/5 overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Armchair class="w-5 h-5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">
                    {{ isEditMode ? t('management.seatingView.formModal.editTitle') : t('management.seatingView.formModal.addTitle') }}
                  </h2>
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
              <!-- Table Name -->
              <div>
                <label for="tableName" class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.seatingView.formModal.nameLabel') }} <span class="text-red-500">*</span>
                </label>
                <input
                  id="tableName"
                  v-model="formData.name"
                  type="text"
                  required
                  :placeholder="t('management.seatingView.formModal.namePlaceholder')"
                  class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-200 focus:bg-white transition-all"
                  :class="{ 'border-red-300 focus:ring-red-200 focus:border-red-400': fieldErrors.name }"
                />
                <p v-if="fieldErrors.name" class="mt-1 text-xs text-red-600">{{ fieldErrors.name }}</p>
              </div>

              <!-- Capacity -->
              <div>
                <label for="tableCapacity" class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.seatingView.formModal.capacityLabel') }}
                </label>
                <input
                  id="tableCapacity"
                  v-model.number="formData.capacity"
                  type="number"
                  min="1"
                  placeholder="10"
                  class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-200 focus:bg-white transition-all"
                  :class="{ 'border-red-300 focus:ring-red-200 focus:border-red-400': fieldErrors.capacity }"
                />
                <p v-if="fieldErrors.capacity" class="mt-1 text-xs text-red-600">{{ fieldErrors.capacity }}</p>
              </div>

              <!-- Table Color -->
              <div>
                <label for="tableColor" class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.seatingView.formModal.colorLabel') }}
                </label>
                <div class="flex items-center gap-3">
                  <input
                    id="tableColor"
                    v-model="formData.color"
                    type="color"
                    class="w-16 h-10 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <input
                    v-model="formData.color"
                    type="text"
                    placeholder="#3498db"
                    class="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-200 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <!-- Notes (Optional) -->
              <div>
                <label for="tableNotes" class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.seatingView.formModal.notesLabel') }}
                </label>
                <textarea
                  id="tableNotes"
                  v-model="formData.notes"
                  rows="2"
                  :placeholder="t('management.seatingView.formModal.notesPlaceholder')"
                  class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-200 focus:bg-white transition-all resize-none"
                ></textarea>
              </div>

              <!-- Error Message -->
              <div v-if="errorMessage" class="rounded-xl bg-red-50 border border-red-200 p-3">
                <p class="text-sm text-red-800">{{ errorMessage }}</p>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                  :disabled="isSaving"
                >
                  {{ t('management.seatingView.formModal.cancel') }}
                </button>
                <button
                  type="submit"
                  :disabled="!isFormValid || isSaving"
                  class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <span
                    v-if="isSaving"
                    class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  {{ isSaving ? t('management.seatingView.formModal.saving') : isEditMode ? t('management.seatingView.formModal.updateBtn') : t('management.seatingView.formModal.addBtn') }}
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
import { useI18n } from 'vue-i18n'
import { Armchair, X } from 'lucide-vue-next'
import type { EventTable, CreateTableRequest, UpdateTableRequest } from '../../services/api'

const { t } = useI18n()

// Props
const props = defineProps<{
  show: boolean
  table: EventTable | null
  isSaving: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
  save: [tableId: number | null, data: CreateTableRequest | UpdateTableRequest]
}>()

const isEditMode = computed(() => props.table !== null)

interface FormData {
  name: string
  capacity: number
  color: string
  notes: string
}

const defaultFormData = (): FormData => ({
  name: '',
  capacity: 10,
  color: '#3498db',
  notes: '',
})

const formData = ref<FormData>(defaultFormData())
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})

// Initialize form data whenever the modal opens (create or edit)
watch(
  () => [props.show, props.table] as const,
  ([show, table]) => {
    if (!show) return
    formData.value = table
      ? {
          name: table.name,
          capacity: table.capacity,
          color: table.color || '#3498db',
          notes: table.notes || '',
        }
      : defaultFormData()
    errorMessage.value = ''
    fieldErrors.value = {}
  },
  { immediate: true },
)

const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' && formData.value.capacity > 0
})

const handleSubmit = () => {
  if (!isFormValid.value) return

  errorMessage.value = ''
  fieldErrors.value = {}

  const data: CreateTableRequest = {
    name: formData.value.name.trim(),
    capacity: formData.value.capacity,
    color: formData.value.color,
    notes: formData.value.notes.trim() || undefined,
  }

  emit('save', props.table?.id ?? null, data)
}

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
