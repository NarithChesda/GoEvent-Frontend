<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-12">
        <!-- Backdrop (hidden on mobile since modal is fullscreen) -->
        <div class="hidden lg:block absolute inset-0 bg-black/30" @click="handleModalClose" />

        <!-- Modal Wrapper (for positioning close button outside on desktop) -->
        <div class="relative w-full h-full lg:w-auto lg:h-auto">
          <!-- Floating Close Button (outside modal, desktop only) -->
          <button
            ref="closeButtonRef"
            @click="handleModalClose"
            class="hidden lg:flex absolute -top-3 -right-3 z-20 w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 text-white items-center justify-center transition-all hover:scale-105 shadow-xl"
            aria-label="Close modal"
            type="button"
          >
            <X class="w-5 h-5" />
          </button>

          <!-- Modal Content -->
          <div
            ref="modalRef"
            role="dialog"
            aria-modal="true"
            aria-labelledby="browse-templates-title"
            class="relative bg-white lg:rounded-xl shadow-2xl overflow-hidden flex flex-col lg:flex-row w-full h-full lg:w-[95vw] lg:max-w-[1400px] lg:h-[90vh] lg:max-h-[900px]"
            @keydown.esc="handleModalClose"
          >
            <!-- Desktop Left Sidebar (hidden on mobile) -->
            <div class="hidden lg:flex w-52 bg-white flex-shrink-0 flex-col">
              <!-- Sidebar Header -->
              <div class="px-6 py-6">
                <h2 id="browse-templates-title" class="text-2xl font-bold text-slate-900">Browse Templates</h2>
              </div>

              <!-- Sidebar Navigation -->
              <nav class="flex-1 overflow-y-auto px-3 pb-4" aria-label="Template filters">
                <!-- Package Filter -->
                <div class="mb-4">
                  <h3 class="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Package</h3>
                  <div class="flex flex-col gap-0.5">
                    <button
                      type="button"
                      @click="setPlanFilter(null)"
                      :aria-current="selectedPlan === null ? 'page' : undefined"
                      :class="[
                        'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer',
                        selectedPlan === null
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      ]"
                    >
                      <Layers :class="['w-5 h-5 flex-shrink-0', selectedPlan === null ? 'text-sky-500' : 'text-slate-400']" />
                      <span>All</span>
                    </button>
                    <button
                      type="button"
                      @click="setPlanFilter('basic')"
                      :aria-current="selectedPlan === 'basic' ? 'page' : undefined"
                      :class="[
                        'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer',
                        selectedPlan === 'basic'
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      ]"
                    >
                      <Sparkles :class="['w-5 h-5 flex-shrink-0', selectedPlan === 'basic' ? 'text-sky-500' : 'text-slate-400']" />
                      <span>Basic</span>
                    </button>
                    <button
                      type="button"
                      @click="setPlanFilter('standard')"
                      :aria-current="selectedPlan === 'standard' ? 'page' : undefined"
                      :class="[
                        'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer',
                        selectedPlan === 'standard'
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      ]"
                    >
                      <Crown :class="['w-5 h-5 flex-shrink-0', selectedPlan === 'standard' ? 'text-sky-500' : 'text-slate-400']" />
                      <span>Standard</span>
                    </button>
                  </div>
                </div>

                <!-- Category Filter -->
                <div>
                  <h3 class="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</h3>
                  <div class="flex flex-col gap-0.5">
                    <!-- All Categories -->
                    <button
                      type="button"
                      @click="selectCategory(null)"
                      :aria-current="selectedCategoryId === null ? 'page' : undefined"
                      :class="[
                        'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer',
                        selectedCategoryId === null
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      ]"
                    >
                      <Sparkles :class="['w-5 h-5 flex-shrink-0', selectedCategoryId === null ? 'text-sky-500' : 'text-slate-400']" />
                      <span>All</span>
                    </button>

                    <!-- Dynamic Categories -->
                    <button
                      v-for="category in categories"
                      :key="category.id"
                      type="button"
                      @click="selectCategory(category.id)"
                      :aria-current="selectedCategoryId === category.id ? 'page' : undefined"
                      :class="[
                        'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer',
                        selectedCategoryId === category.id
                          ? 'bg-sky-50 text-sky-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      ]"
                    >
                      <component
                        :is="getCategoryIcon(category.name)"
                        :class="['w-5 h-5 flex-shrink-0', selectedCategoryId === category.id ? 'text-sky-500' : 'text-slate-400']"
                      />
                      <span>{{ category.name }}</span>
                    </button>
                  </div>
                </div>
              </nav>
            </div>

            <!-- Main Content Area -->
            <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
              <!-- Mobile Search Header with Close Button -->
              <div class="lg:hidden px-4 pt-4 pb-2">
                <div class="flex items-center gap-3">
                  <!-- Search Input -->
                  <div class="relative flex-1">
                    <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                    <input
                      ref="searchInputRef"
                      v-model="searchQuery"
                      type="text"
                      placeholder="Search templates..."
                      aria-label="Search templates by name or category"
                      class="w-full pl-12 pr-4 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 bg-white placeholder:text-slate-400"
                    />
                  </div>
                  <!-- Mobile Close Button -->
                  <button
                    @click="handleModalClose"
                    class="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all"
                    aria-label="Close modal"
                    type="button"
                  >
                    <X class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Desktop Search Header -->
              <div class="hidden lg:block px-6 py-4">
                <div class="relative">
                  <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                  <label for="template-search" class="sr-only">Search templates</label>
                  <input
                    id="template-search"
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search templates..."
                    aria-label="Search templates by name or category"
                    class="w-full pl-12 pr-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 bg-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <!-- Mobile Filter Chips (shown only on mobile) -->
              <div class="lg:hidden px-4 pb-2 space-y-2">
                <!-- Package Filter Row -->
                <div class="flex gap-2 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    @click="setPlanFilter(null)"
                    :class="[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border',
                      selectedPlan === null
                        ? 'bg-sky-500 text-white border-sky-500'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400',
                    ]"
                  >
                    <Layers class="w-4 h-4" />
                    <span>All</span>
                  </button>
                  <button
                    type="button"
                    @click="setPlanFilter('basic')"
                    :class="[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border',
                      selectedPlan === 'basic'
                        ? 'bg-sky-500 text-white border-sky-500'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400',
                    ]"
                  >
                    <Sparkles class="w-4 h-4" />
                    <span>Basic</span>
                  </button>
                  <button
                    type="button"
                    @click="setPlanFilter('standard')"
                    :class="[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border',
                      selectedPlan === 'standard'
                        ? 'bg-sky-500 text-white border-sky-500'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400',
                    ]"
                  >
                    <Crown class="w-4 h-4" />
                    <span>Standard</span>
                  </button>
                </div>

                <!-- Category Filter Row -->
                <div class="flex gap-2 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    @click="selectCategory(null)"
                    :class="[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border',
                      selectedCategoryId === null
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400',
                    ]"
                  >
                    <Sparkles class="w-4 h-4" />
                    <span>All</span>
                  </button>
                  <button
                    v-for="category in categories"
                    :key="'mobile-' + category.id"
                    type="button"
                    @click="selectCategory(category.id)"
                    :class="[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border',
                      selectedCategoryId === category.id
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400',
                    ]"
                  >
                    <component :is="getCategoryIcon(category.name)" class="w-4 h-4" />
                    <span>{{ category.name }}</span>
                  </button>
                </div>
              </div>

              <!-- Templates Content -->
              <div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
                <!-- Loading State -->
                <TemplateLoadingState v-if="loading" />

                <!-- Templates Grid -->
                <div v-else>
                  <TemplateGrid
                    v-if="filteredTemplates.length > 0"
                    :templates="filteredTemplates"
                    :selected-template-id="selectedTemplateId"
                    :owned-template-ids="ownedTemplateIds"
                    @select-template="handleTemplateSelection"
                  />

                  <TemplateEmptyState
                    v-else
                    :has-filters="Boolean(searchQuery || selectedCategoryId || selectedPlan)"
                    @clear-filters="clearFilters"
                  />
                </div>

                <!-- Messages -->
                <TemplateMessage v-if="message" :message="message" />
              </div>

              <!-- Footer (only when template selected) -->
              <Transition name="footer">
                <div
                  v-if="hasSelection"
                  class="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-t border-slate-200 bg-white"
                >
                  <div class="text-sm text-slate-600 truncate mr-2">
                    <span class="font-medium">{{ selectedTemplate?.name }}</span> selected
                  </div>
                  <button
                    ref="confirmButtonRef"
                    @click="handleConfirmSelection"
                    :disabled="selecting"
                    class="px-4 lg:px-6 py-2 lg:py-2.5 text-sm rounded-lg font-semibold transition-all flex items-center gap-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white shadow-md disabled:opacity-70 flex-shrink-0"
                    type="button"
                  >
                    <Loader2 v-if="selecting" class="w-4 h-4 animate-spin" />
                    <span class="hidden sm:inline">{{ selecting ? 'Applying...' : 'Use this template' }}</span>
                    <span class="sm:hidden">{{ selecting ? '...' : 'Use' }}</span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted, ref, nextTick, computed } from 'vue'
import type { EventTemplate } from '../services/api'
import { useTemplateApi } from '../composables/useTemplateApi'
import { useTemplateFiltering } from '../composables/useTemplateFiltering'
import { useTemplateSelection } from '../composables/useTemplateSelection'

// Import child components
import TemplateLoadingState from './template/TemplateLoadingState.vue'
import TemplateGrid from './template/TemplateGrid.vue'
import TemplateEmptyState from './template/TemplateEmptyState.vue'
import TemplateMessage from './template/TemplateMessage.vue'
import {
  X,
  Search,
  Loader2,
  Sparkles,
  Heart,
  Briefcase,
  GraduationCap,
  Music,
  Utensils,
  Users,
  Calendar,
  PartyPopper,
  Building2,
  Cake,
  Layers,
  Crown,
  type LucideIcon,
} from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  eventId: string
  eventCategory?: number
  ownedTemplateNames?: Set<string>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'template-selected': [template: EventTemplate]
}>()

// Template refs for focus management
const modalRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()
const closeButtonRef = ref<HTMLButtonElement>()
const confirmButtonRef = ref<HTMLButtonElement>()

// Track initialization state to prevent race condition
const isInitializing = ref(false)

// Store previous active element to restore focus on close
let previousActiveElement: HTMLElement | null = null

// Composables
const {
  loading,
  selecting,
  templates,
  message,
  loadTemplates,
  selectTemplate: selectTemplateApi,
  resetState,
} = useTemplateApi()

/**
 * Compute owned template IDs by matching template names from payment history.
 * Uses normalized names (lowercase, trimmed) for robust matching.
 */
const ownedTemplateIds = computed(() => {
  if (!props.ownedTemplateNames || props.ownedTemplateNames.size === 0) {
    return new Set<number>()
  }
  const ids = new Set<number>()
  for (const template of templates.value) {
    // Normalize template name the same way as payment names
    const normalizedName = template.name.trim().toLowerCase()
    if (props.ownedTemplateNames.has(normalizedName)) {
      ids.add(template.id)
    }
  }
  return ids
})

const {
  searchQuery,
  selectedCategoryId,
  selectedPlan,
  categories,
  filteredTemplates: baseFilteredTemplates,
  clearFilters,
  setCategoryFilter,
  setPlanFilter,
} = useTemplateFiltering(templates)

// Sort filtered templates: owned templates first
const filteredTemplates = computed(() => {
  if (ownedTemplateIds.value.size === 0) {
    return baseFilteredTemplates.value
  }
  return [...baseFilteredTemplates.value].sort((a, b) => {
    const aOwned = ownedTemplateIds.value.has(a.id)
    const bOwned = ownedTemplateIds.value.has(b.id)
    if (aOwned && !bOwned) return -1
    if (!aOwned && bOwned) return 1
    return 0
  })
})

const { selectedTemplateId, selectedTemplate, hasSelection, selectTemplate, clearSelection } =
  useTemplateSelection(templates)

// Category icon mapping with cache for performance
const categoryIcons: Record<string, LucideIcon> = {
  Wedding: Heart,
  Corporate: Briefcase,
  Education: GraduationCap,
  Concert: Music,
  Food: Utensils,
  Social: Users,
  Conference: Calendar,
  Party: PartyPopper,
  Business: Building2,
  Birthday: Cake,
}

const categoryIconCache = new Map<string, LucideIcon>()

const getCategoryIcon = (categoryName: string): LucideIcon => {
  const cacheKey = categoryName.toLowerCase()

  if (categoryIconCache.has(cacheKey)) {
    return categoryIconCache.get(cacheKey)!
  }

  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (cacheKey.includes(key.toLowerCase())) {
      categoryIconCache.set(cacheKey, icon)
      return icon
    }
  }

  categoryIconCache.set(cacheKey, Calendar)
  return Calendar
}

// Category selection
const selectCategory = (categoryId: number | null): void => {
  setCategoryFilter(categoryId)
}

// Focus trap implementation
const handleKeyDown = (event: KeyboardEvent): void => {
  if (!props.isOpen || !modalRef.value) return

  if (event.key === 'Tab') {
    const focusableElements = modalRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Include close button in focus trap
    const closeBtn = closeButtonRef.value

    if (event.shiftKey) {
      // Shift + Tab: going backwards
      if (document.activeElement === firstElement || document.activeElement === closeBtn) {
        event.preventDefault()
        lastElement?.focus()
      }
    } else {
      // Tab: going forwards
      if (document.activeElement === lastElement) {
        event.preventDefault()
        if (closeBtn) {
          closeBtn.focus()
        } else {
          firstElement?.focus()
        }
      }
    }
  }
}

// Event handlers
const handleModalClose = (): void => {
  emit('close')
  resetModalState()

  // Restore focus to previous element
  nextTick(() => {
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus()
    }
    previousActiveElement = null
  })
}

const handleTemplateSelection = (template: EventTemplate): void => {
  selectTemplate(template)
}

// Constants for timeout values
const SELECTION_DELAY_SAME = 1000
const SELECTION_DELAY_NEW = 2000

const handleConfirmSelection = async (): Promise<void> => {
  if (!selectedTemplate.value || selecting.value) return

  const result = await selectTemplateApi(props.eventId, selectedTemplate.value.id)

  if (result.success && result.template) {
    const delay = result.template === selectedTemplate.value ? SELECTION_DELAY_SAME : SELECTION_DELAY_NEW
    setTimeout(() => {
      emit('template-selected', result.template!)
      handleModalClose()
    }, delay)
  }
}

const resetModalState = (): void => {
  clearSelection()
  clearFilters()
  resetState()
  isInitializing.value = false
}

const initializeModal = async (): Promise<void> => {
  // Prevent race condition - don't initialize if already in progress
  if (isInitializing.value) return

  isInitializing.value = true

  try {
    // Store current active element for focus restoration
    previousActiveElement = document.activeElement as HTMLElement

    await loadTemplates()

    if (props.eventCategory && !selectedCategoryId.value) {
      setCategoryFilter(props.eventCategory)
    }

    // Focus search input when modal opens (desktop only to prevent mobile keyboard)
    nextTick(() => {
      // Only focus on desktop (screen width >= 1024px / lg breakpoint)
      if (window.innerWidth >= 1024) {
        searchInputRef.value?.focus()
      }
    })
  } finally {
    isInitializing.value = false
  }
}

// Setup keyboard event listener for focus trap
const setupFocusTrap = (): void => {
  document.addEventListener('keydown', handleKeyDown)
}

const cleanupFocusTrap = (): void => {
  document.removeEventListener('keydown', handleKeyDown)
}

// Watchers
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      initializeModal()
      setupFocusTrap()
    } else {
      resetModalState()
      cleanupFocusTrap()
    }
  },
)

// Lifecycle
onMounted(() => {
  if (props.isOpen) {
    initializeModal()
    setupFocusTrap()
  }
})

onUnmounted(() => {
  // Cleanup on unmount to prevent memory leaks
  cleanupFocusTrap()
  resetModalState()
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
}

.modal-enter-active > .relative,
.modal-leave-active > .relative {
  transition: all 0.3s ease;
  transform-origin: center;
}

.modal-enter-from > .relative,
.modal-leave-to > .relative {
  opacity: 0;
  transform: scale(0.95);
}

/* Footer slide animation */
.footer-enter-active,
.footer-leave-active {
  transition: all 0.2s ease;
}

.footer-enter-from,
.footer-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Hide scrollbar for category navigation */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
