<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 z-[998]"
        @click="handleClose"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[480px] lg:w-[520px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden will-change-transform"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center justify-between px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="handleClose"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <h2 class="text-base font-semibold text-white">
                {{ isEditing ? 'Edit Category' : 'Add Category' }}
              </h2>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!-- General error banner -->
          <div
            v-if="submitError"
            class="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
          >
            <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <p class="text-sm font-medium text-red-700">{{ submitError }}</p>
              <button
                type="button"
                @click="submitError = null"
                class="text-xs text-red-600 hover:text-red-700 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>

          <!-- Form -->
          <form id="category-form" @submit.prevent="handleSubmit" class="p-3 laptop-sm:p-4 space-y-4 laptop-sm:space-y-5 pb-24">
            <!-- Basic Information Section -->
            <div class="space-y-3">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category Details</h3>

              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  Category Name <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  placeholder="e.g., Instant Noodles, Bottled Water"
                  required
                />
                <p v-if="errors.name" class="mt-1.5 text-xs text-red-600">{{ errors.name }}</p>
              </div>

              <!-- Unit -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  Unit <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.unit"
                  type="text"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  placeholder="e.g., pack, case, kg, piece"
                  required
                />
                <p class="text-xs text-slate-500 mt-1">Unit of measurement for this category</p>
                <p v-if="errors.unit" class="mt-1.5 text-xs text-red-600">{{ errors.unit }}</p>
              </div>

              <!-- Target Quantity -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  Target Quantity
                </label>
                <input
                  v-model.number="form.target_quantity"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                  placeholder="e.g., 500"
                />
                <p class="text-xs text-slate-500 mt-1">Optional goal for this category (leave empty for no target)</p>
                <p v-if="errors.target_quantity" class="mt-1.5 text-xs text-red-600">{{ errors.target_quantity }}</p>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 resize-none bg-white"
                  placeholder="Describe what items count as this category..."
                ></textarea>
                <p v-if="errors.description" class="mt-1.5 text-xs text-red-600">{{ errors.description }}</p>
              </div>
            </div>

            <!-- Settings Section -->
            <div class="space-y-3 border-t border-slate-100 pt-4 laptop-sm:pt-5">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settings</h3>

              <!-- Is Active Toggle -->
              <div
                @click="form.is_active = !form.is_active"
                class="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-white rounded-lg shadow-sm">
                    <Package class="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-700">Active Category</p>
                    <p class="text-xs text-slate-500">Allow donations to this category</p>
                  </div>
                </div>
                <div
                  role="switch"
                  :aria-checked="form.is_active"
                  :class="[
                    'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                    form.is_active ? 'bg-purple-500' : 'bg-slate-200'
                  ]"
                >
                  <span
                    class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                    :style="{ transform: form.is_active ? 'translateX(20px)' : 'translateX(0)' }"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              type="submit"
              form="category-form"
              :disabled="isSubmitting || !isFormValid"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{
                isSubmitting
                  ? isEditing
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditing
                    ? 'Update Category'
                    : 'Create Category'
              }}</span>
            </button>

            <button
              type="button"
              @click="handleClose"
              :disabled="isSubmitting"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Success/Error Toast -->
        <Transition name="slide-up">
          <div v-if="toastMessage" class="absolute bottom-16 left-4 right-4 z-10">
            <div
              :class="toastMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
              class="text-white px-3 py-2.5 rounded-lg shadow-lg flex items-center"
            >
              <CheckCircle v-if="toastMessage.type === 'success'" class="w-4 h-4 mr-2 flex-shrink-0" />
              <AlertCircle v-else class="w-4 h-4 mr-2 flex-shrink-0" />
              <span class="text-xs">{{ toastMessage.text }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { ArrowRight, AlertCircle, CheckCircle, Loader2, Save, Package } from 'lucide-vue-next'
import type { DonationItemCategory, CreateDonationItemCategoryRequest } from '@/services/api/types/donation.types'

interface Props {
  modelValue: boolean
  category?: DonationItemCategory | null
}

const props = withDefaults(defineProps<Props>(), {
  category: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: CreateDonationItemCategoryRequest]
}>()

// Form state
const form = ref<CreateDonationItemCategoryRequest>({
  name: '',
  unit: 'item',
  target_quantity: undefined,
  description: '',
  is_active: true
})

const errors = ref<Record<string, string>>({})
const submitError = ref<string | null>(null)
const isSubmitting = ref(false)
const toastMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Computed
const isEditing = computed(() => !!props.category)

const isFormValid = computed(() => {
  return form.value.name.trim() !== '' && form.value.unit.trim() !== ''
})

// Watch for category changes to populate form
watch(
  () => props.category,
  (newCategory) => {
    if (newCategory) {
      form.value = {
        name: newCategory.name,
        unit: newCategory.unit,
        target_quantity: newCategory.target_quantity || undefined,
        description: newCategory.description || '',
        display_order: newCategory.display_order,
        is_active: newCategory.is_active
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for drawer open/close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      if (!props.category) {
        resetForm()
      }
      // Clear errors when drawer opens
      errors.value = {}
      submitError.value = null

      // Prevent body scroll
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      // Defer body style resets until after transition completes (350ms)
      setTimeout(() => {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }, 350)
    }
  }
)

// Cleanup body styles if component unmounts while drawer is open
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})

function resetForm() {
  form.value = {
    name: '',
    unit: 'item',
    target_quantity: undefined,
    description: '',
    is_active: true
  }
}

function handleClose() {
  if (isSubmitting.value) return
  emit('update:modelValue', false)
}

function showToast(type: 'success' | 'error', text: string) {
  toastMessage.value = { type, text }
  setTimeout(() => {
    toastMessage.value = null
  }, 4000)
}

async function handleSubmit() {
  // Validate
  errors.value = {}
  submitError.value = null

  if (!form.value.name.trim()) {
    errors.value.name = 'Category name is required'
    return
  }

  if (!form.value.unit.trim()) {
    errors.value.unit = 'Unit is required'
    return
  }

  // Prepare data
  const data: CreateDonationItemCategoryRequest = {
    name: form.value.name.trim(),
    unit: form.value.unit.trim(),
    description: form.value.description?.trim() || undefined,
    is_active: form.value.is_active
  }

  // Only include target_quantity if it's a positive number
  if (form.value.target_quantity && form.value.target_quantity > 0) {
    data.target_quantity = form.value.target_quantity
  }

  // Preserve display_order for edits
  if (props.category?.display_order !== undefined) {
    data.display_order = props.category.display_order
  }

  emit('submit', data)
}

// Expose methods for parent to control loading state
defineExpose({
  setSubmitting: (value: boolean) => {
    isSubmitting.value = value
  },
  setError: (error: string | null) => {
    submitError.value = error
  },
  setFieldErrors: (fieldErrors: Record<string, string[]>) => {
    errors.value = {}
    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages.length > 0) {
        errors.value[field] = messages[0]
      }
    }
  },
  showToast,
  close: handleClose
})
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
  transform: translateY(100%) translateZ(0);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%) translateZ(0);
  }
}

/* Slide up transition for toast */
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
