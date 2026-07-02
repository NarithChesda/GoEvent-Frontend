<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-12">
        <!-- Backdrop (hidden on mobile since modal is fullscreen) -->
        <div class="hidden lg:block absolute inset-0 bg-slate-950/60 backdrop-blur-sm" @click="handleModalClose" />

        <!-- Modal Wrapper (for positioning close button outside on desktop) -->
        <div class="relative w-full h-full lg:w-auto lg:h-auto">
          <!-- Floating Close Button (outside modal, desktop only) -->
          <button
            ref="closeButtonRef"
            @click="handleModalClose"
            class="hidden lg:flex absolute -top-3 -right-3 z-20 w-10 h-10 rounded-full bg-white text-slate-400 ring-1 ring-slate-200/80 shadow-lg shadow-slate-950/20 items-center justify-center transition-all hover:text-slate-700 hover:ring-slate-300 hover:scale-105 active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            :aria-label="t('management.browseTemplateModal.closeModal')"
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
            class="relative bg-white lg:rounded-2xl shadow-2xl shadow-slate-950/40 lg:ring-1 lg:ring-white/10 overflow-hidden flex flex-col lg:flex-row w-full h-full lg:w-[95vw] lg:max-w-[1400px] lg:h-[90vh] lg:max-h-[900px]"
            @keydown.esc="handleModalClose"
          >
            <!-- Desktop Left Sidebar (hidden on mobile) -->
            <div class="hidden lg:flex w-56 bg-slate-50/60 border-r border-slate-200/70 flex-shrink-0 flex-col">
              <!-- Sidebar Header -->
              <div class="px-6 pt-6 pb-5">
                <h2 id="browse-templates-title" class="text-xl font-bold tracking-tight text-slate-900">{{ t('management.browseTemplateModal.title') }}</h2>
              </div>

              <!-- Partner Tab (only for partner users) -->
              <div v-if="isPartner" class="px-3 mb-3">
                <div class="flex gap-1 p-1 bg-slate-200/60 rounded-xl">
                  <button
                    type="button"
                    @click="activeTab = 'browse'"
                    :class="[
                      'flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      activeTab === 'browse' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700',
                    ]"
                  >{{ t('management.browseTemplateModal.tabs.browse') }}</button>
                  <button
                    type="button"
                    @click="activeTab = 'my-templates'"
                    :class="[
                      'flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1',
                      activeTab === 'my-templates' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700',
                    ]"
                  >
                    <LayoutTemplate class="w-3 h-3" />
                    {{ t('management.browseTemplateModal.tabs.mine') }}
                  </button>
                </div>
              </div>

              <!-- Sidebar Navigation (only when on browse tab) -->
              <nav v-if="activeTab === 'browse'" class="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar" aria-label="Template filters">
                <!-- Package Filter -->
                <div class="mb-5">
                  <h3 class="px-3 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{{ t('management.browseTemplateModal.sidebar.packageLabel') }}</h3>
                  <div class="flex flex-col gap-0.5">
                    <button
                      type="button"
                      @click="setPlanFilter(null)"
                      :aria-current="selectedPlan === null ? 'page' : undefined"
                      :class="navItemClass(selectedPlan === null)"
                    >
                      <Layers :class="navIconClass(selectedPlan === null)" />
                      <span>{{ t('management.browseTemplateModal.filters.all') }}</span>
                    </button>
                    <button
                      type="button"
                      @click="setPlanFilter('basic')"
                      :aria-current="selectedPlan === 'basic' ? 'page' : undefined"
                      :class="navItemClass(selectedPlan === 'basic')"
                    >
                      <Sparkles :class="navIconClass(selectedPlan === 'basic')" />
                      <span>{{ t('management.browseTemplateModal.filters.basic') }}</span>
                    </button>
                    <button
                      type="button"
                      @click="setPlanFilter('standard')"
                      :aria-current="selectedPlan === 'standard' ? 'page' : undefined"
                      :class="navItemClass(selectedPlan === 'standard')"
                    >
                      <Crown :class="navIconClass(selectedPlan === 'standard')" />
                      <span>{{ t('management.browseTemplateModal.filters.standard') }}</span>
                    </button>
                  </div>
                </div>

                <!-- Category Filter -->
                <div>
                  <h3 class="px-3 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{{ t('management.browseTemplateModal.sidebar.categoryLabel') }}</h3>
                  <div class="flex flex-col gap-0.5">
                    <!-- All Categories -->
                    <button
                      type="button"
                      @click="selectCategory(null)"
                      :aria-current="selectedCategoryId === null ? 'page' : undefined"
                      :class="navItemClass(selectedCategoryId === null)"
                    >
                      <Sparkles :class="navIconClass(selectedCategoryId === null)" />
                      <span>{{ t('management.browseTemplateModal.filters.all') }}</span>
                    </button>

                    <!-- Dynamic Categories -->
                    <button
                      v-for="category in categories"
                      :key="category.id"
                      type="button"
                      @click="selectCategory(category.id)"
                      :aria-current="selectedCategoryId === category.id ? 'page' : undefined"
                      :class="navItemClass(selectedCategoryId === category.id)"
                    >
                      <component
                        :is="getCategoryIcon(category.name)"
                        :class="navIconClass(selectedCategoryId === category.id)"
                      />
                      <span class="truncate">{{ category.name }}</span>
                    </button>
                  </div>
                </div>
              </nav>
            </div>

            <!-- Main Content Area -->
            <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
              <!-- Mobile Search Header with Close Button (browse tab only) -->
              <div v-if="activeTab === 'browse'" class="lg:hidden px-4 pt-4 pb-2">
                <div class="flex items-center gap-3">
                  <!-- Search Input -->
                  <div class="relative flex-1">
                    <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                    <input
                      ref="searchInputRef"
                      v-model="searchQuery"
                      type="text"
                      :placeholder="t('management.browseTemplateModal.search.placeholder')"
                      :aria-label="t('management.browseTemplateModal.search.ariaLabel')"
                      class="w-full pl-10 pr-4 py-2.5 text-base bg-slate-100 border border-transparent rounded-xl transition-colors focus:outline-none focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100 placeholder:text-slate-400"
                    />
                  </div>
                  <!-- Mobile Close Button -->
                  <button
                    @click="handleModalClose"
                    class="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center transition-all hover:bg-slate-200 hover:text-slate-700 active:scale-95"
                    :aria-label="t('management.browseTemplateModal.closeModal')"
                    type="button"
                  >
                    <X class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Desktop Search Header (browse tab only) -->
              <div v-if="activeTab === 'browse'" class="hidden lg:block px-6 py-4">
                <div class="relative max-w-md">
                  <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                  <label for="template-search" class="sr-only">{{ t('management.browseTemplateModal.search.srLabel') }}</label>
                  <input
                    id="template-search"
                    v-model="searchQuery"
                    type="text"
                    :placeholder="t('management.browseTemplateModal.search.placeholder')"
                    :aria-label="t('management.browseTemplateModal.search.ariaLabel')"
                    class="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 border border-transparent rounded-xl transition-colors focus:outline-none focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <!-- Mobile Tab Switcher (partner users only) -->
              <div v-if="isPartner" class="lg:hidden px-4 pb-2" :class="activeTab === 'my-templates' ? 'pt-4' : ''">
                <div class="flex items-center gap-2">
                  <div class="flex flex-1 gap-1 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      @click="activeTab = 'browse'"
                      :class="[
                        'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all',
                        activeTab === 'browse' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500',
                      ]"
                    >{{ t('management.browseTemplateModal.tabs.browseAll') }}</button>
                    <button
                      type="button"
                      @click="activeTab = 'my-templates'"
                      :class="[
                        'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1',
                        activeTab === 'my-templates' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500',
                      ]"
                    >
                      <LayoutTemplate class="w-3 h-3" />
                      {{ t('management.browseTemplateModal.tabs.myTemplates') }}
                    </button>
                  </div>
                  <!-- Close button visible only when search bar is hidden -->
                  <button
                    v-if="activeTab === 'my-templates'"
                    @click="handleModalClose"
                    class="flex-shrink-0 w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center transition-all hover:bg-slate-200 hover:text-slate-700 active:scale-95"
                    :aria-label="t('management.browseTemplateModal.closeModal')"
                    type="button"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Mobile Filter Chips (shown only on mobile browse tab) -->
              <div v-if="activeTab === 'browse'" class="lg:hidden px-4 pb-3 space-y-2">
                <!-- Package Filter Row -->
                <div class="flex gap-2 overflow-x-auto no-scrollbar">
                  <button type="button" @click="setPlanFilter(null)" :class="chipClass(selectedPlan === null)">
                    <Layers class="w-4 h-4" />
                    <span>{{ t('management.browseTemplateModal.filters.all') }}</span>
                  </button>
                  <button type="button" @click="setPlanFilter('basic')" :class="chipClass(selectedPlan === 'basic')">
                    <Sparkles class="w-4 h-4" />
                    <span>{{ t('management.browseTemplateModal.filters.basic') }}</span>
                  </button>
                  <button type="button" @click="setPlanFilter('standard')" :class="chipClass(selectedPlan === 'standard')">
                    <Crown class="w-4 h-4" />
                    <span>{{ t('management.browseTemplateModal.filters.standard') }}</span>
                  </button>
                </div>

                <!-- Category Filter Row -->
                <div class="flex gap-2 overflow-x-auto no-scrollbar">
                  <button type="button" @click="selectCategory(null)" :class="chipClass(selectedCategoryId === null)">
                    <Sparkles class="w-4 h-4" />
                    <span>{{ t('management.browseTemplateModal.filters.all') }}</span>
                  </button>
                  <button
                    v-for="category in categories"
                    :key="'mobile-' + category.id"
                    type="button"
                    @click="selectCategory(category.id)"
                    :class="chipClass(selectedCategoryId === category.id)"
                  >
                    <component :is="getCategoryIcon(category.name)" class="w-4 h-4" />
                    <span>{{ category.name }}</span>
                  </button>
                </div>
              </div>

              <!-- My Templates Panel (partner users, my-templates tab) -->
              <PartnerTemplatesPanel
                v-if="isPartner && activeTab === 'my-templates'"
                class="flex-1 overflow-hidden"
                @template-selected="handlePartnerTemplateSelected"
                @form-opened="isPartnerFormOpen = true"
                @form-closed="isPartnerFormOpen = false"
              />

              <!-- Browse Templates Content -->
              <div v-else class="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 custom-scrollbar">
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
                  v-if="activeHasSelection"
                  class="flex items-center justify-between gap-3 px-4 lg:px-6 py-3 lg:py-4 border-t border-slate-200/70 bg-white/90 backdrop-blur-md"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Check class="w-3 h-3 text-emerald-600" />
                    </span>
                    <span class="text-sm font-medium text-slate-700 truncate">
                      {{ t('management.browseTemplateModal.footer.selected', { name: activeSelectedTemplate?.name }) }}
                    </span>
                  </div>
                  <button
                    ref="confirmButtonRef"
                    @click="handleConfirmSelection"
                    :disabled="selecting"
                    class="px-4 lg:px-6 py-2 lg:py-2.5 text-sm rounded-xl font-semibold transition-all flex items-center gap-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/35 hover:-translate-y-px active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex-shrink-0"
                    type="button"
                  >
                    <Loader2 v-if="selecting" class="w-4 h-4 animate-spin" />
                    <span class="hidden sm:inline">{{ selecting ? t('management.browseTemplateModal.footer.applying') : t('management.browseTemplateModal.footer.useTemplate') }}</span>
                    <span class="sm:hidden">{{ selecting ? t('management.browseTemplateModal.footer.applyingShort') : t('management.browseTemplateModal.footer.use') }}</span>
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
import { useI18n } from 'vue-i18n'
import type { EventTemplate } from '../services/api'
import type { PartnerTemplate } from '../services/api'
import { eventTemplateService } from '../services/api'
import { useTemplateApi } from '../composables/useTemplateApi'
import { useTemplateFiltering } from '../composables/useTemplateFiltering'
import { useTemplateSelection } from '../composables/useTemplateSelection'
import { useAuthStore } from '../stores/auth'

// Import child components
import TemplateLoadingState from './template/TemplateLoadingState.vue'
import TemplateGrid from './template/TemplateGrid.vue'
import TemplateEmptyState from './template/TemplateEmptyState.vue'
import TemplateMessage from './template/TemplateMessage.vue'
import PartnerTemplatesPanel from './template/PartnerTemplatesPanel.vue'
import {
  X,
  Check,
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
  LayoutTemplate,
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

const { t } = useI18n()

// Auth store for partner check
const authStore = useAuthStore()
const isPartner = computed(() => !!authStore.user?.is_partner)

// Active tab: 'browse' | 'my-templates'
const activeTab = ref<'browse' | 'my-templates'>('browse')

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

// Track partner template selection separately (partner templates aren't in the browse list)
const selectedPartnerTemplate = ref<PartnerTemplate | null>(null)
const isPartnerFormOpen = ref(false)

// Unified selected template: either a browse template or a partner template
const activeSelectedTemplate = computed(() => {
  if (selectedPartnerTemplate.value) return selectedPartnerTemplate.value
  return selectedTemplate.value
})

const activeHasSelection = computed(() => {
  // Hide footer when partner template form is open (editing mode)
  if (isPartnerFormOpen.value) return false
  return !!selectedPartnerTemplate.value || hasSelection.value
})

const handlePartnerTemplateSelected = (template: PartnerTemplate): void => {
  // Clear any browse template selection
  clearSelection()
  selectedPartnerTemplate.value = template
}

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

// Shared class helpers for sidebar nav items and mobile filter chips
const navItemClass = (active: boolean): string =>
  [
    'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer',
    active
      ? 'bg-white text-sky-700 shadow-sm ring-1 ring-slate-200/80'
      : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
  ].join(' ')

const navIconClass = (active: boolean): string =>
  `w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-sky-600' : 'text-slate-400'}`

const chipClass = (active: boolean): string =>
  [
    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap border',
    active
      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
      : 'bg-white text-slate-600 border-slate-200 active:bg-slate-100',
  ].join(' ')

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
  // Clear any partner template selection when selecting a browse template
  selectedPartnerTemplate.value = null
  selectTemplate(template)
}

// Constants for timeout values
const SELECTION_DELAY_SAME = 1000
const SELECTION_DELAY_NEW = 2000

const handleConfirmSelection = async (): Promise<void> => {
  const template = activeSelectedTemplate.value
  if (!template || selecting.value) return

  // Partner template: use the select-template endpoint directly
  if (selectedPartnerTemplate.value) {
    selecting.value = true
    try {
      const response = await eventTemplateService.selectEventTemplate(
        props.eventId,
        selectedPartnerTemplate.value.id,
      )
      if (response.success) {
        setTimeout(() => {
          emit('template-selected', selectedPartnerTemplate.value as unknown as EventTemplate)
          handleModalClose()
        }, SELECTION_DELAY_NEW)
      }
    } finally {
      selecting.value = false
    }
    return
  }

  // Browse template: use the existing composable flow
  if (!selectedTemplate.value) return
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
  selectedPartnerTemplate.value = null
  isPartnerFormOpen.value = false
  clearFilters()
  resetState()
  activeTab.value = 'browse'
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
.modal-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > .relative {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: center;
}

.modal-leave-active > .relative {
  transition: all 0.2s ease;
  transform-origin: center;
}

.modal-enter-from > .relative,
.modal-leave-to > .relative {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
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

/* Thin scrollbar so the modal's rounded corners stay clean */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(203 213 225 / 0.9);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
}
</style>
