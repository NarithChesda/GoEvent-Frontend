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
    <ExpenseModal
      :show="showAddCategoryModal"
      :title="editingCategory ? 'Edit Category' : 'Create Category'"
      :icon="Palette"
      icon-bg-class="bg-purple-50 text-purple-600"
      icon-size-class="w-5 h-5"
      aria-label-id="add-category-modal-title"
      :error="modalError"
      :submitting="submitting"
      :submit-text="editingCategory ? 'Update Category' : 'Create Category'"
      z-index-class="z-[60]"
      @close="closeModal"
      @submit="handleSubmit"
    >
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
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
          required
        />
      </div>

      <!-- Description -->
      <div>
        <label for="category-description" class="block text-sm font-medium text-slate-700 mb-2">Description</label>
        <textarea
          id="category-description"
          v-model="formData.description"
          rows="3"
          placeholder="Describe what expenses this category covers..."
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 resize-none"
        ></textarea>
      </div>

      <!-- Color and Icon Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Category Color -->
        <div>
          <label for="categoryColor" class="block text-sm font-medium text-slate-700 mb-2">
            Category Color
          </label>
          <div class="flex items-center gap-3">
            <input
              id="categoryColor"
              v-model="formData.color"
              type="color"
              class="w-16 h-10 rounded-lg border border-slate-300 cursor-pointer"
            />
            <input
              id="categoryColorHex"
              v-model="formData.color"
              type="text"
              placeholder="#3498db"
              aria-label="Color hex value"
              class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
            />
          </div>
        </div>

        <!-- Icon Selection -->
        <div>
          <label for="category-icon" class="block text-sm font-medium text-slate-700 mb-2">Icon</label>
          <div class="relative">
            <select
              id="category-icon"
              v-model="formData.icon"
              class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 appearance-none pr-10"
            >
              <option value="">Select an icon</option>
              <option value="fa-building">Building</option>
              <option value="fa-utensils">Food & Catering</option>
              <option value="fa-palette">Decoration</option>
              <option value="fa-camera">Photography</option>
              <option value="fa-music">Entertainment</option>
              <option value="fa-gift">Gifts & Favors</option>
              <option value="fa-car">Transportation</option>
              <option value="fa-hotel">Venue & Lodging</option>
              <option value="fa-shirt">Attire & Costumes</option>
              <option value="fa-lightbulb">Lighting & AV</option>
              <option value="fa-clipboard">Planning & Coordination</option>
              <option value="fa-megaphone">Marketing & Promotion</option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown class="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>
      </div>
    </ExpenseModal>


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
          role="status"
          aria-live="polite"
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
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Plus,
  Edit2,
  Trash2,
  Building2,
  Palette,
  X,
  Info,
  AlertCircle,
  Check,
  ChevronDown
} from 'lucide-vue-next'
import { expenseCategoriesService, type ExpenseCategory } from '@/services/api'
import { useExpenseIcons } from '@/composables/useExpenseIcons'
import { useExpenseModal } from '@/composables/useExpenseModal'
import { useSuccessToast } from '@/composables/useSuccessToast'
import { useOptimisticUpdate } from '@/composables/useOptimisticUpdate'
import { getErrorMessage } from '@/utils/errorMessages'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import ExpenseModal from './ExpenseModal.vue'

// Emits
const emit = defineEmits<{
  'category-updated': []
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const categories = ref<ExpenseCategory[]>([])
const editingCategory = ref<ExpenseCategory | null>(null)
const deletingCategory = ref<ExpenseCategory | null>(null)

// Use composables
const { isModalOpen: showAddCategoryModal, modalRef: addModalRef, submitting, error: modalError, openModal, closeModal: closeCategoryModal } = useExpenseModal()
const { showToast: showSuccessToast, message: successMessage, showSuccess } = useSuccessToast()
const { performUpdate } = useOptimisticUpdate(categories)

// Use shared icon utilities
const { getIconComponent } = useExpenseIcons()

const formData = ref({
  name: '',
  description: '',
  icon: '',
  color: '#3498db'
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

const closeModal = () => {
  closeCategoryModal()
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
  openModal()
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
      emit('category-updated') // Notify parent that categories have changed
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
  // Clean up state to prevent memory leaks
  deletingCategory.value = null
  editingCategory.value = null
})

// Expose methods for parent component (Smart FAB)
defineExpose({
  openAddCategoryModal: () => {
    openModal()
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
