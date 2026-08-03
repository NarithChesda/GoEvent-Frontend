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
            :aria-label="t('management.browseTemplateModal.title')"
            class="relative bg-white lg:rounded-2xl shadow-2xl shadow-slate-950/40 lg:ring-1 lg:ring-white/10 overflow-hidden flex flex-col lg:flex-row w-full h-full lg:w-[95vw] lg:max-w-[1400px] lg:h-[90vh] lg:max-h-[900px]"
            @keydown.esc="handleEscapeKey"
          >
            <!-- Desktop Left Sidebar (hidden on mobile). Filters only, and only
                 on the browse tab — it used to also carry the title and the
                 Browse/Mine switch, which meant the "Mine" tab stared at a
                 224px column holding two buttons and a thousand pixels of
                 nothing. Those moved into the content header; the rail now
                 collapses to zero width when it has nothing to say. -->
            <div
              class="hidden lg:flex flex-col flex-shrink-0 bg-slate-50/60 overflow-hidden transition-[width] duration-300 ease-out"
              :class="activeTab === 'browse' ? 'w-56 border-r border-slate-200/70' : 'w-0'"
              :inert="activeTab !== 'browse'"
            >
              <nav class="w-56 h-full overflow-y-auto px-3 py-4 custom-scrollbar" :aria-label="t('management.browseTemplateModal.sidebar.filtersLabel')">
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
              <!-- Mobile Header -->
              <div class="lg:hidden">
                <!-- Tab Switcher Row (partner users only): sliding gradient thumb, close button never moves.
                     Hidden while the template editor is open — it has its own
                     header, and tab switching mid-edit isn't a thing. -->
                <div v-if="isPartner && !isPartnerFormOpen" class="flex items-center gap-3 px-4 pt-4 pb-2">
                  <div class="relative flex flex-1 p-1 bg-slate-100 rounded-full">
                    <span
                      aria-hidden="true"
                      class="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] shadow-md shadow-[#2ecc71]/20 transition-transform duration-300 ease-out"
                      :class="activeTab === 'my-templates' ? 'translate-x-full' : ''"
                    />
                    <button
                      type="button"
                      @click="setActiveTab('browse')"
                      :class="[
                        'relative flex-1 py-2 rounded-full text-[13px] font-semibold transition-colors duration-300',
                        activeTab === 'browse' ? 'text-white' : 'text-slate-600 active:text-slate-800',
                      ]"
                    >{{ t('management.browseTemplateModal.tabs.browseAll') }}</button>
                    <button
                      type="button"
                      @click="setActiveTab('my-templates')"
                      :class="[
                        'relative flex-1 py-2 rounded-full text-[13px] font-semibold transition-colors duration-300 flex items-center justify-center gap-1.5',
                        activeTab === 'my-templates' ? 'text-white' : 'text-slate-600 active:text-slate-800',
                      ]"
                    >
                      <LayoutTemplate class="w-3.5 h-3.5" />
                      {{ t('management.browseTemplateModal.tabs.myTemplates') }}
                    </button>
                  </div>
                  <button
                    @click="handleModalClose"
                    class="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center transition-all hover:bg-slate-200 hover:text-slate-700 active:scale-95"
                    :aria-label="t('management.browseTemplateModal.closeModal')"
                    type="button"
                  >
                    <X class="w-5 h-5" />
                  </button>
                </div>

                <!-- Search + Filters (collapse smoothly when leaving the browse tab) -->
                <div
                  class="overflow-hidden transition-all duration-300 ease-in-out"
                  :class="activeTab === 'browse' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'"
                >
                  <!-- Search Row: search input + package/category filter icon buttons -->
                  <div class="flex items-center gap-2 px-4 pb-3" :class="isPartner ? 'pt-1' : 'pt-4'">
                    <div class="relative flex-1">
                      <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                      <input
                        ref="searchInputRef"
                        v-model="searchQuery"
                        type="text"
                        :placeholder="t('management.browseTemplateModal.search.placeholder')"
                        :aria-label="t('management.browseTemplateModal.search.ariaLabel')"
                        class="w-full h-10 pl-11 pr-4 text-base bg-slate-100 border border-transparent rounded-full transition-colors focus:outline-none focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100 placeholder:text-slate-400"
                      />
                    </div>

                    <!-- Package Filter Icon Button (opens bottom sheet) -->
                    <button
                      type="button"
                      @click="isPlanSheetOpen = true"
                      aria-haspopup="dialog"
                      :aria-expanded="isPlanSheetOpen"
                      :aria-label="planChipLabel"
                      class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-sky-300"
                      :class="
                        selectedPlan !== null
                          ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-[#2ecc71]/20'
                          : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                      "
                    >
                      <component :is="currentPlanOption.icon" class="w-[18px] h-[18px]" />
                    </button>

                    <!-- Category Filter Icon Button (opens bottom sheet) -->
                    <button
                      type="button"
                      @click="isCategorySheetOpen = true"
                      aria-haspopup="dialog"
                      :aria-expanded="isCategorySheetOpen"
                      :aria-label="categoryChipLabel"
                      class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-sky-300"
                      :class="
                        selectedCategoryId !== null
                          ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-[#2ecc71]/20'
                          : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                      "
                    >
                      <component :is="currentCategoryIcon" class="w-[18px] h-[18px]" />
                    </button>

                    <!-- Close button lives here only when there is no tab row above -->
                    <button
                      v-if="!isPartner"
                      @click="handleModalClose"
                      class="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center transition-all hover:bg-slate-200 hover:text-slate-700 active:scale-95"
                      :aria-label="t('management.browseTemplateModal.closeModal')"
                      type="button"
                    >
                      <X class="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Desktop header: one row for everything. Title, the
                   Browse/Mine switch and search live here, and the panes
                   rendered below teleport their own controls into
                   `headerSlotEl` rather than each opening a second full-width
                   bar of their own. When the template editor is open it owns
                   the whole row — you can't switch tabs mid-edit anyway. -->
              <div class="hidden lg:flex items-center gap-4 px-6 py-3 border-b border-slate-200/70 min-h-[3.5rem]">
                <h2
                  v-if="!isPartnerFormOpen"
                  class="text-lg font-bold tracking-tight text-slate-900 flex-shrink-0"
                >
                  {{ t('management.browseTemplateModal.title') }}
                </h2>

                <!-- Sliding gradient thumb, same control as the mobile row -->
                <div v-if="isPartner && !isPartnerFormOpen" class="relative flex p-1 bg-slate-100 rounded-full flex-shrink-0">
                  <span
                    aria-hidden="true"
                    class="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] shadow-md shadow-[#2ecc71]/20 transition-transform duration-300 ease-out"
                    :class="activeTab === 'my-templates' ? 'translate-x-full' : ''"
                  />
                  <button
                    type="button"
                    @click="setActiveTab('browse')"
                    :class="[
                      'relative w-24 py-1.5 rounded-full text-xs font-semibold transition-colors duration-300',
                      activeTab === 'browse' ? 'text-white' : 'text-slate-600 hover:text-slate-800',
                    ]"
                  >{{ t('management.browseTemplateModal.tabs.browse') }}</button>
                  <button
                    type="button"
                    @click="setActiveTab('my-templates')"
                    :class="[
                      'relative w-24 py-1.5 rounded-full text-xs font-semibold transition-colors duration-300 flex items-center justify-center gap-1.5',
                      activeTab === 'my-templates' ? 'text-white' : 'text-slate-600 hover:text-slate-800',
                    ]"
                  >
                    <LayoutTemplate class="w-3.5 h-3.5" />
                    {{ t('management.browseTemplateModal.tabs.mine') }}
                  </button>
                </div>

                <div v-if="activeTab === 'browse' && !isPartnerFormOpen" class="relative ml-auto w-full max-w-xs">
                  <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                  <label for="template-search" class="sr-only">{{ t('management.browseTemplateModal.search.srLabel') }}</label>
                  <input
                    id="template-search"
                    v-model="searchQuery"
                    type="text"
                    :placeholder="t('management.browseTemplateModal.search.placeholder')"
                    :aria-label="t('management.browseTemplateModal.search.ariaLabel')"
                    class="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 border border-transparent rounded-xl transition-colors focus:outline-none focus:bg-white focus:border-sky-300 focus:ring-4 focus:ring-sky-100 placeholder:text-slate-400"
                  />
                </div>

                <!-- Teleport target. `display: contents` so whatever a pane
                     sends up sits directly in this flex row. -->
                <div ref="headerSlotEl" class="contents" />
              </div>

              <!-- Package Bottom Sheet (mobile only) -->
              <Transition name="fade">
                <div
                  v-if="isPlanSheetOpen"
                  class="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
                  @click="isPlanSheetOpen = false"
                />
              </Transition>
              <Transition name="sheet">
                <div
                  v-if="isPlanSheetOpen"
                  role="dialog"
                  aria-modal="true"
                  :aria-label="t('management.browseTemplateModal.sidebar.packageLabel')"
                  class="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-2xl pb-[max(env(safe-area-inset-bottom),0.75rem)]"
                >
                  <div class="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-3" aria-hidden="true" />
                  <h3 class="px-5 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {{ t('management.browseTemplateModal.sidebar.packageLabel') }}
                  </h3>
                  <div class="py-1">
                    <button
                      v-for="option in planOptions"
                      :key="option.value ?? 'all'"
                      type="button"
                      :aria-pressed="selectedPlan === option.value"
                      @click="selectPlan(option.value)"
                      class="w-full flex items-center gap-3 px-5 py-2.5 transition-colors active:bg-slate-50"
                    >
                      <span
                        :class="[
                          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                          selectedPlan === option.value
                            ? 'bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20'
                            : 'bg-slate-100',
                        ]"
                      >
                        <component
                          :is="option.icon"
                          :class="['w-[18px] h-[18px]', selectedPlan === option.value ? 'text-[#2ecc71]' : 'text-slate-500']"
                        />
                      </span>
                      <span
                        :class="[
                          'flex-1 text-left text-sm',
                          selectedPlan === option.value ? 'font-semibold text-slate-900' : 'font-medium text-slate-700',
                        ]"
                      >{{ option.label }}</span>
                      <Check v-if="selectedPlan === option.value" class="w-5 h-5 text-[#2ecc71] flex-shrink-0" />
                    </button>
                  </div>
                </div>
              </Transition>

              <!-- Category Bottom Sheet (mobile only) -->
              <Transition name="fade">
                <div
                  v-if="isCategorySheetOpen"
                  class="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
                  @click="isCategorySheetOpen = false"
                />
              </Transition>
              <Transition name="sheet">
                <div
                  v-if="isCategorySheetOpen"
                  role="dialog"
                  aria-modal="true"
                  :aria-label="t('management.browseTemplateModal.sidebar.categoryLabel')"
                  class="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-2xl pb-[max(env(safe-area-inset-bottom),0.75rem)]"
                >
                  <div class="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-3" aria-hidden="true" />
                  <h3 class="px-5 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {{ t('management.browseTemplateModal.sidebar.categoryLabel') }}
                  </h3>
                  <div class="py-1 max-h-[60vh] overflow-y-auto overscroll-contain">
                    <button
                      type="button"
                      :aria-pressed="selectedCategoryId === null"
                      @click="selectCategoryMobile(null)"
                      class="w-full flex items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
                    >
                      <span
                        class="w-3 h-3 rounded-full flex-shrink-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
                        aria-hidden="true"
                      />
                      <span
                        :class="[
                          'flex-1 text-left text-sm',
                          selectedCategoryId === null ? 'font-semibold text-slate-900' : 'font-medium text-slate-700',
                        ]"
                      >{{ t('management.browseTemplateModal.filters.all') }}</span>
                      <Check v-if="selectedCategoryId === null" class="w-5 h-5 text-[#2ecc71] flex-shrink-0" />
                    </button>
                    <button
                      v-for="category in categories"
                      :key="'sheet-' + category.id"
                      type="button"
                      :aria-pressed="selectedCategoryId === category.id"
                      @click="selectCategoryMobile(category.id)"
                      class="w-full flex items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
                    >
                      <span
                        class="w-3 h-3 rounded-full flex-shrink-0"
                        :style="{ backgroundColor: category.color || '#3B82F6' }"
                        aria-hidden="true"
                      />
                      <span
                        :class="[
                          'flex-1 text-left text-sm truncate',
                          selectedCategoryId === category.id ? 'font-semibold text-slate-900' : 'font-medium text-slate-700',
                        ]"
                      >{{ category.name }}</span>
                      <Check
                        v-if="selectedCategoryId === category.id"
                        class="w-5 h-5 text-[#2ecc71] flex-shrink-0"
                      />
                    </button>
                  </div>
                </div>
              </Transition>

              <!-- Tab content: direction-aware slide between browse and my-templates -->
              <Transition :name="tabTransitionName" mode="out-in">
                <!-- My Templates Panel (partner users, my-templates tab) -->
                <PartnerTemplatesPanel
                  v-if="isPartner && activeTab === 'my-templates'"
                  class="flex-1 overflow-hidden"
                  :event-id="eventId"
                  :event-data="eventData"
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
              </Transition>

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
                    class="px-5 lg:px-6 py-2.5 text-sm rounded-full lg:rounded-xl font-semibold transition-all flex items-center gap-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white shadow-md shadow-[#2ecc71]/20 hover:shadow-sky-500/35 hover:-translate-y-px active:translate-y-0 active:scale-95 lg:active:scale-100 disabled:opacity-70 disabled:hover:translate-y-0 flex-shrink-0"
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
import { watch, onMounted, onUnmounted, ref, nextTick, computed, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Event, EventTemplate } from '../services/api'
import type { PartnerTemplate } from '../services/api'
import { eventTemplateService } from '../services/api'
import type { TemplateAssets } from '../composables/useEventShowcase'
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
import { TEMPLATES_HEADER_SLOT } from './template/templatesHeaderSlot'
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
  /**
   * The full event record. `eventCategory` above is a category *id*, which is
   * enough to filter the browse grid but not enough for the partner form's live
   * preview — that needs the category name (which stages a template has) and
   * the event video. Passed through to PartnerTemplatesPanel.
   */
  eventData?: Event | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  'template-selected': [template: EventTemplate]
  /** A browse-grid card was picked — callers with a live preview surface
   *  (Design Studio) can broadcast these assets non-destructively before the
   *  user confirms. Not emitted for partner template selection. */
  'preview-stage': [templateData: TemplateAssets]
  /** Selection was cleared without confirming (cancel/close/escape/backdrop),
   *  or a confirmed selection just finished applying — either way, any
   *  active preview-stage should revert to real data. */
  'preview-clear': []
}>()

const { t } = useI18n()

// Auth store for partner check
const authStore = useAuthStore()
const isPartner = computed(() => !!authStore.user?.is_partner)

// Active tab: 'browse' | 'my-templates'
const activeTab = ref<'browse' | 'my-templates'>('browse')

// Direction-aware tab content transition: forward slides left, back slides right
const tabDirection = ref<'forward' | 'back'>('forward')

const tabTransitionName = computed(() =>
  tabDirection.value === 'forward' ? 'tab-forward' : 'tab-back',
)

const setActiveTab = (tab: 'browse' | 'my-templates'): void => {
  if (tab === activeTab.value) return
  tabDirection.value = tab === 'my-templates' ? 'forward' : 'back'
  activeTab.value = tab
}

// The desktop header row the panes below teleport their own controls into, so
// each one doesn't open a second full-width bar. See templatesHeaderSlot.ts.
const headerSlotEl = ref<HTMLElement | null>(null)
provide(TEMPLATES_HEADER_SLOT, headerSlotEl)

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

// Mobile category bottom sheet
const isCategorySheetOpen = ref(false)

const selectCategoryMobile = (categoryId: number | null): void => {
  selectCategory(categoryId)
  isCategorySheetOpen.value = false
}

const currentCategoryIcon = computed((): LucideIcon => {
  if (selectedCategoryId.value === null) return Sparkles
  const category = categories.value.find((c) => c.id === selectedCategoryId.value)
  return category ? getCategoryIcon(category.name) : Sparkles
})

// Chip reads "Category" when unfiltered so it doesn't duplicate the "All" option
const categoryChipLabel = computed(() => {
  if (selectedCategoryId.value === null) {
    return t('management.browseTemplateModal.sidebar.categoryLabel')
  }
  const category = categories.value.find((c) => c.id === selectedCategoryId.value)
  return category ? category.name : t('management.browseTemplateModal.filters.all')
})

// Mobile package bottom sheet
type PlanValue = null | 'basic' | 'standard'

const isPlanSheetOpen = ref(false)

const planOptions = computed(
  (): Array<{ value: PlanValue; label: string; icon: LucideIcon }> => [
    { value: null, label: t('management.browseTemplateModal.filters.all'), icon: Layers },
    { value: 'basic', label: t('management.browseTemplateModal.filters.basic'), icon: Sparkles },
    { value: 'standard', label: t('management.browseTemplateModal.filters.standard'), icon: Crown },
  ],
)

const currentPlanOption = computed(
  () => planOptions.value.find((option) => option.value === selectedPlan.value) ?? planOptions.value[0],
)

// Chip reads "Package" when unfiltered so it doesn't duplicate the categories' "All" chip
const planChipLabel = computed(() =>
  selectedPlan.value === null
    ? t('management.browseTemplateModal.sidebar.packageLabel')
    : currentPlanOption.value.label,
)

const selectPlan = (plan: PlanValue): void => {
  setPlanFilter(plan)
  isPlanSheetOpen.value = false
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

// Escape dismisses the package sheet first; only closes the modal when no sheet is open
const handleEscapeKey = (): void => {
  if (isPlanSheetOpen.value) {
    isPlanSheetOpen.value = false
    return
  }
  if (isCategorySheetOpen.value) {
    isCategorySheetOpen.value = false
    return
  }
  handleModalClose()
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
  void stagePreview(template.id)
}

// Non-destructive live try-on: fetch the template's public assets and let
// callers with a live preview surface (Design Studio) broadcast them into
// the preview before the user confirms. Non-fatal on failure — selecting
// still works, it just won't show live this time.
const stagePreview = async (templateId: number): Promise<void> => {
  try {
    const response = await eventTemplateService.getPublicTemplateAssets(templateId)
    // Wire shape is `{ template_data: {...} }`, not the flat TemplateAssets
    // the service's declared return type implies (matches the unwrap already
    // used in ShowcasePreviewFrameView.vue's pre-payment fallback).
    const templateData = (response.data as unknown as { template_data?: TemplateAssets } | null)?.template_data
    if (response.success && templateData) {
      emit('preview-stage', templateData)
    }
  } catch {
    // Non-fatal.
  }
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
  if (hasSelection.value) emit('preview-clear')
  clearSelection()
  selectedPartnerTemplate.value = null
  isPartnerFormOpen.value = false
  isPlanSheetOpen.value = false
  isCategorySheetOpen.value = false
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

/* Package bottom sheet: backdrop fade + panel slide-up */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sheet-enter-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}

/* Tab content switch: outgoing panel slips away, incoming slides in from the tab's direction */
.tab-forward-enter-active,
.tab-back-enter-active {
  transition:
    opacity 0.25s ease-out,
    transform 0.25s ease-out;
}

.tab-forward-leave-active,
.tab-back-leave-active {
  transition:
    opacity 0.15s ease-in,
    transform 0.15s ease-in;
}

.tab-forward-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.tab-forward-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}

.tab-back-enter-from {
  opacity: 0;
  transform: translateX(-24px);
}

.tab-back-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active,
  .fade-enter-active,
  .fade-leave-active,
  .tab-forward-enter-active,
  .tab-forward-leave-active,
  .tab-back-enter-active,
  .tab-back-leave-active {
    transition: none;
  }
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
