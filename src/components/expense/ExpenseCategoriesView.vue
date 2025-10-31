<template>
  <div class="space-y-6">
    <!-- Header with Add Category Button -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Expense Categories</h3>
        <p class="text-sm text-slate-500 mt-1">Create and manage reusable expense categories</p>
      </div>
      <button
        @click="showAddCategoryModal = true"
        class="hidden sm:flex flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 whitespace-nowrap"
      >
        <Plus class="w-4 h-4" />
        <span>Create Category</span>
      </button>
    </div>

    <!-- Info Banner -->
    <div class="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-4">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Info class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 class="font-semibold text-blue-900 mb-1">Global Categories</h4>
          <p class="text-sm text-blue-700">Categories you create here can be reused across all your events. They're shared across your account.</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50/50 border border-red-200/50 rounded-2xl p-6">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertCircle class="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h4 class="font-semibold text-red-900 mb-1">Error Loading Categories</h4>
          <p class="text-sm text-red-700">{{ error }}</p>
          <button @click="loadCategories" class="mt-3 text-sm font-medium text-red-600 hover:text-red-700">
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Categories Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Category Cards -->
      <div
        v-for="category in categories"
        :key="category.id"
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 p-6 hover:shadow-xl transition-all duration-300 group"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
              :style="{ backgroundColor: `${category.color}20` }"
            >
              <component
                v-if="getIconComponent(category.icon)"
                :is="getIconComponent(category.icon)"
                class="w-6 h-6"
                :style="{ color: category.color }"
              />
              <Building2 v-else class="w-6 h-6" :style="{ color: category.color }" />
            </div>
            <div>
              <h4 class="font-bold text-slate-900">{{ category.name }}</h4>
              <p class="text-xs text-slate-500">{{ category.is_active ? 'Active' : 'Inactive' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              @click="editCategory(category)"
              :aria-label="`Edit category: ${category.name}`"
              title="Edit category"
              class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <Edit2 class="w-4 h-4" />
            </button>
            <button
              @click="confirmDeleteCategory(category)"
              :aria-label="`Delete category: ${category.name}`"
              title="Delete category"
              class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p class="text-sm text-slate-600">{{ category.description || 'No description' }}</p>
        <div class="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
          <div class="w-4 h-4 rounded" :style="{ backgroundColor: category.color }"></div>
          <span class="text-xs text-slate-500">{{ category.color }}</span>
          <span class="text-xs text-slate-300">•</span>
          <span class="text-xs text-slate-500">{{ category.icon || 'No icon' }}</span>
        </div>
      </div>

      <!-- Add Category Placeholder -->
      <div
        @click="showAddCategoryModal = true"
        class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-6 hover:bg-slate-100/50 hover:border-emerald-400 transition-all duration-300 cursor-pointer group min-h-[180px] flex items-center justify-center"
      >
        <div class="text-center">
          <div class="w-12 h-12 bg-slate-200 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all">
            <Plus class="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h4 class="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Create Category</h4>
          <p class="text-sm text-slate-400 mt-1">Add a new expense category</p>
        </div>
      </div>
    </div>

    <!-- Add/Edit Category Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAddCategoryModal"
          class="fixed inset-0 z-50 overflow-y-auto"
          @click.self="closeModal"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

          <div class="flex min-h-full items-center justify-center p-4">
            <div
              ref="addModalRef"
              role="dialog"
              aria-labelledby="add-category-modal-title"
              aria-modal="true"
              class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
              @click.stop
            >
              <!-- Header -->
              <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Palette class="w-4.5 h-4.5" />
                    </div>
                    <h2 id="add-category-modal-title" class="text-lg sm:text-xl font-semibold text-slate-900">
                      {{ editingCategory ? 'Edit Category' : 'Create Category' }}
                    </h2>
                  </div>
                  <button
                    @click="closeModal"
                    aria-label="Close dialog"
                    class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Form -->
              <form @submit.prevent="handleSubmit" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                <!-- Error Message -->
                <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p class="text-sm text-red-600">{{ error }}</p>
                </div>

                <!-- Category Name -->
                <div>
                  <label for="category-name" class="block text-sm font-medium text-slate-700 mb-2">
                    Category Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="category-name"
                    type="text"
                    v-model="formData.name"
                    placeholder="E.g., Venue, Catering, Photography..."
                    maxlength="100"
                    aria-required="true"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                    required
                  />
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    v-model="formData.description"
                    rows="3"
                    placeholder="Describe what expenses this category covers..."
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
                  ></textarea>
                </div>

                <!-- Color Picker -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Color</label>
                  <div class="grid grid-cols-8 gap-2">
                    <button
                      v-for="color in colorOptions"
                      :key="color"
                      type="button"
                      @click="formData.color = color"
                      :class="[
                        'w-10 h-10 rounded-lg transition-all',
                        formData.color === color ? 'ring-2 ring-sky-500 ring-offset-2 scale-110' : 'hover:scale-105'
                      ]"
                      :style="{ backgroundColor: color }"
                    ></button>
                  </div>
                  <div class="flex items-center gap-2 mt-3">
                    <input
                      type="text"
                      v-model="formData.color"
                      placeholder="#3498db"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                    />
                    <div class="w-10 h-10 rounded-lg border-2 border-slate-200" :style="{ backgroundColor: formData.color }"></div>
                  </div>
                </div>

                <!-- Icon Selection -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Icon</label>
                  <div class="relative">
                    <select
                      v-model="formData.icon"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                    >
                      <option value="">Select an icon</option>
                      <option value="fa-building">Building (fa-building)</option>
                      <option value="fa-utensils">Utensils (fa-utensils)</option>
                      <option value="fa-palette">Palette (fa-palette)</option>
                      <option value="fa-camera">Camera (fa-camera)</option>
                      <option value="fa-music">Music (fa-music)</option>
                      <option value="fa-gift">Gift (fa-gift)</option>
                      <option value="fa-car">Car (fa-car)</option>
                      <option value="fa-hotel">Hotel (fa-hotel)</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown class="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                  <button
                    type="button"
                    @click="closeModal"
                    class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    :disabled="submitting"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    :disabled="submitting"
                  >
                    <span
                      v-if="submitting"
                      class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                    ></span>
                    {{ submitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="!!deletingCategory"
      :loading="submitting"
      title="Delete Category"
      :item-name="deletingCategory?.name"
      warning-message="Categories with existing budgets or expenses cannot be deleted."
      @confirm="handleDelete"
      @cancel="deletingCategory = null"
    />

    <!-- Success Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="showSuccessToast"
          class="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[200]"
        >
          <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <Check class="w-4 h-4" />
          </div>
          <span class="font-medium">{{ successMessage }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Plus,
  Edit2,
  Trash2,
  Building2,
  UtensilsCrossed,
  Palette,
  Camera,
  Music,
  X,
  Info,
  AlertCircle,
  Check,
  ChevronDown
} from 'lucide-vue-next'
import { expenseCategoriesService, type ExpenseCategory } from '@/services/api'
import { useExpenseIcons } from '@/composables/useExpenseIcons'
import { getErrorMessage } from '@/utils/errorMessages'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'

const loading = ref(false)
const error = ref<string | null>(null)
const categories = ref<ExpenseCategory[]>([])
const showAddCategoryModal = ref(false)
const showSuccessToast = ref(false)
const successMessage = ref('')
const submitting = ref(false)
const editingCategory = ref<ExpenseCategory | null>(null)
const deletingCategory = ref<ExpenseCategory | null>(null)

// Focus trap for modals (accessibility)
const addModalRef = ref<HTMLElement>()
const { activate: activateAddModal, deactivate: deactivateAddModal } = useFocusTrap(addModalRef, {
  immediate: false,
  escapeDeactivates: true
})

// Use shared icon utilities
const { getIconComponent } = useExpenseIcons()

const formData = ref({
  name: '',
  description: '',
  icon: '',
  color: '#3498db'
})

const colorOptions = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#9b59b6', // Purple
  '#f1c40f', // Yellow
  '#e67e22', // Orange
  '#1abc9c', // Turquoise
  '#2ecc71', // Green
  '#95a5a6', // Gray
  '#34495e', // Dark Blue
  '#e91e63', // Pink
  '#00bcd4', // Cyan
  '#ff9800', // Amber
  '#8bc34a', // Light Green
  '#ff5722', // Deep Orange
  '#607d8b', // Blue Gray
  '#673ab7', // Deep Purple
]

// Activate/deactivate focus trap when modals open/close
watch(showAddCategoryModal, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    activateAddModal()
  } else {
    deactivateAddModal()
  }
})

const loadCategories = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await expenseCategoriesService.getCategories()

    if (response.success && response.data) {
      categories.value = response.data.results
    } else {
      error.value = response.message || 'Failed to load categories'
    }
  } catch (err) {
    error.value = getErrorMessage(err, 'load categories')
    console.error('Error loading categories:', err)
  } finally {
    loading.value = false
  }
}

const showSuccess = (message: string) => {
  successMessage.value = message
  showSuccessToast.value = true
  setTimeout(() => {
    showSuccessToast.value = false
  }, 3000)
}

const closeModal = () => {
  showAddCategoryModal.value = false
  editingCategory.value = null
  formData.value = {
    name: '',
    description: '',
    icon: '',
    color: '#3498db'
  }
}

const editCategory = (category: ExpenseCategory) => {
  editingCategory.value = category
  formData.value = {
    name: category.name,
    description: category.description || '',
    icon: category.icon || '',
    color: category.color
  }
  showAddCategoryModal.value = true
}

const handleSubmit = async () => {
  const isEditing = !!editingCategory.value

  const requestData = {
    name: formData.value.name,
    description: formData.value.description || undefined,
    icon: formData.value.icon || undefined,
    color: formData.value.color,
    is_active: true
  }

  // OPTIMISTIC UPDATE: Update UI immediately
  const backup = [...categories.value]

  if (isEditing && editingCategory.value) {
    // Update existing category in the list
    const index = categories.value.findIndex(c => c.id === editingCategory.value!.id)
    if (index !== -1) {
      categories.value[index] = {
        ...editingCategory.value,
        ...requestData
      } as ExpenseCategory
    }
    showSuccess('Category updated successfully!')
  } else {
    // Add temporary category
    const tempCategory: ExpenseCategory = {
      id: Date.now(), // Use timestamp as temporary numeric ID
      ...requestData,
      description: requestData.description || '',
      icon: requestData.icon || '',
      created_by: 0, // Temporary value, will be replaced by server response
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    categories.value = [tempCategory, ...categories.value]
    showSuccess('Category created successfully!')
  }

  submitting.value = true

  try {
    let response
    if (isEditing && editingCategory.value) {
      response = await expenseCategoriesService.patchCategory(editingCategory.value.id, requestData)
    } else {
      response = await expenseCategoriesService.createCategory(requestData)
    }

    if (response.success) {
      // Replace with real data from server
      await loadCategories()
      closeModal() // Close modal only on success
    } else {
      // ROLLBACK: Restore original data on error
      categories.value = backup
      error.value = response.message || 'Failed to save category'
    }
  } catch (err) {
    // ROLLBACK: Restore original data on error
    categories.value = backup
    error.value = getErrorMessage(err, isEditing ? 'update category' : 'create category')
    console.error('Error saving category:', err)
  } finally {
    submitting.value = false
  }
}

const confirmDeleteCategory = (category: ExpenseCategory) => {
  deletingCategory.value = category
}

const handleDelete = async () => {
  if (!deletingCategory.value) return

  // OPTIMISTIC UPDATE: Remove from UI immediately
  const backup = [...categories.value]
  const deletedId = deletingCategory.value.id
  const deletedName = deletingCategory.value.name

  categories.value = categories.value.filter(category => category.id !== deletedId)
  deletingCategory.value = null
  showSuccess('Category deleted successfully!')

  submitting.value = true

  try {
    const response = await expenseCategoriesService.deleteCategory(deletedId)

    if (!response.success) {
      // ROLLBACK: Restore on error
      categories.value = backup
      error.value = response.message || `Failed to delete "${deletedName}"`
    }
  } catch (err) {
    // ROLLBACK: Restore on error
    categories.value = backup
    error.value = getErrorMessage(err, 'delete category')
    console.error('Error deleting category:', err)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCategories()
})

onUnmounted(() => {
  // Clean up modals and toasts to prevent memory leaks
  showAddCategoryModal.value = false
  deletingCategory.value = null
  showSuccessToast.value = false
  editingCategory.value = null
})

// Expose methods for parent component (Smart FAB)
defineExpose({
  openAddCategoryModal: () => {
    showAddCategoryModal.value = true
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

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}
</style>
