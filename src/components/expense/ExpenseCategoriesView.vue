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
        class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 whitespace-nowrap"
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
              class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <Edit2 class="w-4 h-4" />
            </button>
            <button
              @click="confirmDeleteCategory(category)"
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
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="closeModal"
        >
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-slate-900">
                {{ editingCategory ? 'Edit Category' : 'Create Category' }}
              </h3>
              <button
                @click="closeModal"
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-4">
              <!-- Category Name -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Category Name *</label>
                <input
                  type="text"
                  v-model="formData.name"
                  placeholder="E.g., Venue, Catering, Photography..."
                  maxlength="100"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
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
                      formData.color === color ? 'ring-2 ring-emerald-500 ring-offset-2 scale-110' : 'hover:scale-105'
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
                    class="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                  />
                  <div class="w-10 h-10 rounded-lg border-2 border-slate-200" :style="{ backgroundColor: formData.color }"></div>
                </div>
              </div>

              <!-- Icon Selection -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Icon (Font Awesome class)</label>
                <select
                  v-model="formData.icon"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  @click="closeModal"
                  class="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all"
                  :disabled="submitting"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="submitting"
                >
                  {{ submitting ? 'Saving...' : (editingCategory ? 'Update' : 'Create') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="deletingCategory"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="deletingCategory = null"
        >
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div class="flex items-start gap-4 mb-6">
              <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle class="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 class="text-xl font-bold text-slate-900 mb-2">Delete Category?</h3>
                <p class="text-sm text-slate-600">
                  Are you sure you want to delete <strong>{{ deletingCategory.name }}</strong>?
                  This action cannot be undone. Categories with existing budgets or expenses cannot be deleted.
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="deletingCategory = null"
                class="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all"
                :disabled="submitting"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="handleDelete"
                class="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="submitting"
              >
                {{ submitting ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
import { ref, onMounted, onUnmounted } from 'vue'
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
  Check
} from 'lucide-vue-next'
import { expenseCategoriesService, type ExpenseCategory } from '@/services/api'
import { useExpenseIcons } from '@/composables/useExpenseIcons'

const loading = ref(false)
const error = ref<string | null>(null)
const categories = ref<ExpenseCategory[]>([])
const showAddCategoryModal = ref(false)
const showSuccessToast = ref(false)
const successMessage = ref('')
const submitting = ref(false)
const editingCategory = ref<ExpenseCategory | null>(null)
const deletingCategory = ref<ExpenseCategory | null>(null)

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
    error.value = 'An unexpected error occurred while loading categories'
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
  submitting.value = true

  try {
    const requestData = {
      name: formData.value.name,
      description: formData.value.description || undefined,
      icon: formData.value.icon || undefined,
      color: formData.value.color,
      is_active: true
    }

    let response
    if (editingCategory.value) {
      response = await expenseCategoriesService.patchCategory(editingCategory.value.id, requestData)
      if (response.success) {
        showSuccess('Category updated successfully!')
      }
    } else {
      response = await expenseCategoriesService.createCategory(requestData)
      if (response.success) {
        showSuccess('Category created successfully!')
      }
    }

    if (response.success) {
      closeModal()
      await loadCategories()
    } else {
      error.value = response.message || 'Failed to save category'
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
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

  submitting.value = true

  try {
    const response = await expenseCategoriesService.deleteCategory(deletingCategory.value.id)

    if (response.success) {
      showSuccess('Category deleted successfully!')
      deletingCategory.value = null
      await loadCategories()
    } else {
      error.value = response.message || 'Failed to delete category'
    }
  } catch (err) {
    error.value = 'An unexpected error occurred'
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
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9);
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
