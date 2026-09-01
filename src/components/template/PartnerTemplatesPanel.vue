<template>
  <div class="relative flex flex-col h-full overflow-hidden">
    <!-- Panel controls: the status roll-up and the one action this tab exists
         for. From `lg` these ride in the modal's own header row (they used to
         take a full-width bar of their own directly under it, which is a lot of
         chrome for two chips and a button); below that they stay in place,
         where a second row costs less than the width would. -->
    <Teleport v-if="headerSlot && useSharedHeader" :to="headerSlot">
      <div class="ml-auto flex items-center gap-2 flex-shrink-0">
        <TemplateTypeFilter
          v-if="isStaff"
          v-model="typeFilter"
          :options="typeFilterOptions"
        />
        <template v-else>
          <span v-for="stat in statusStats" :key="stat.status" :class="[STAT_CHIP, stat.class]">
            <component :is="stat.icon" class="w-3 h-3" />
            {{ stat.count }} {{ stat.label }}
          </span>
        </template>
        <button type="button" @click="openForm(null)" :class="BTN_PRIMARY_BAR">
          <Plus class="w-4 h-4" />
          {{ t('management.partnerTemplatesPanel.newTemplate') }}
        </button>
      </div>
    </Teleport>

    <!-- Deliberately `!useSharedHeader` rather than `v-else`: Vue assigns
         template refs after the subtree mounts, so on the first desktop frame
         `headerSlot` is still null. A `v-else` would render this bar for that
         one frame and then yank it away — better to show nothing until the
         teleport target lands (it happens under the modal's own enter
         transition anyway). -->
    <div v-if="!useSharedHeader" class="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white">
      <TemplateTypeFilter
        v-if="isStaff"
        v-model="typeFilter"
        :options="typeFilterOptions"
        class="flex-wrap min-w-0"
      />
      <div v-else class="flex gap-1.5 flex-wrap min-w-0">
        <span v-for="stat in statusStats" :key="stat.status" :class="[STAT_CHIP, stat.class]">
          <component :is="stat.icon" class="w-3 h-3" />
          {{ stat.count }} {{ stat.label }}
        </span>
      </div>
      <button type="button" @click="openForm(null)" :class="BTN_PRIMARY_BAR">
        <Plus class="w-4 h-4" />
        <span class="hidden sm:inline">{{ t('management.partnerTemplatesPanel.newTemplate') }}</span>
        <span class="sm:hidden">{{ t('management.partnerTemplatesPanel.newShort') }}</span>
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 custom-scrollbar">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="w-8 h-8 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle class="w-10 h-10 text-red-400 mb-3" />
        <p class="text-sm font-medium text-slate-700">{{ t('management.partnerTemplatesPanel.loadError') }}</p>
        <button type="button" @click="loadTemplates" :class="[BTN_SECONDARY, 'mt-4']">
          <RotateCcw class="w-4 h-4 text-slate-400" />
          {{ t('management.partnerTemplatesPanel.tryAgain') }}
        </button>
      </div>

      <!-- Empty State. Staff get their own copy: a system template is public
           the moment it saves, so promising review would describe a step they
           never take. -->
      <div v-else-if="templates.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <LayoutTemplate class="w-8 h-8 text-slate-400" />
        </div>
        <h4 class="text-base font-semibold text-slate-700 mb-1">{{ t('management.partnerTemplatesPanel.empty.title') }}</h4>
        <p class="text-sm text-slate-500 max-w-xs">
          {{ isStaff ? t('management.partnerTemplatesPanel.empty.staffDescription') : t('management.partnerTemplatesPanel.empty.description') }}
        </p>
        <button type="button" @click="openForm(null)" :class="[BTN_PRIMARY, 'mt-5']">
          <Plus class="w-4 h-4" />
          {{ isStaff ? t('management.partnerTemplatesPanel.empty.staffCreateFirst') : t('management.partnerTemplatesPanel.empty.createFirst') }}
        </button>
      </div>

      <!-- The filter emptied the shelf, not the catalogue -->
      <div v-else-if="visibleTemplates.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <LayoutTemplate class="w-8 h-8 text-slate-400" />
        </div>
        <h4 class="text-base font-semibold text-slate-700 mb-1">{{ t('management.partnerTemplatesPanel.empty.filteredTitle') }}</h4>
        <p class="text-sm text-slate-500 max-w-xs">
          {{ t('management.partnerTemplatesPanel.empty.filteredDescription') }}
        </p>
        <button type="button" @click="typeFilter = 'all'" :class="[BTN_SECONDARY, 'mt-5']">
          <RotateCcw class="w-4 h-4 text-slate-400" />
          {{ t('management.partnerTemplatesPanel.empty.filteredReset') }}
        </button>
      </div>

      <!-- Templates Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        <PartnerTemplateCard
          v-for="template in visibleTemplates"
          :key="template.id"
          :template="template"
          :is-selected="selectedTemplateId === template.id && template.status === 'approved'"
          :show-author="isStaff"
          @select="handleSelect"
          @edit="handleEdit"
          @submit="handleSubmit"
          @delete="handleDelete"
        />
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Transition name="fade">
      <div
        v-if="templateToDelete"
        class="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] p-6"
        @click.self="templateToDelete = null"
      >
        <div class="bg-white rounded-2xl shadow-2xl shadow-slate-950/25 ring-1 ring-slate-200/60 p-5 max-w-xs w-full">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 class="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h4 class="text-sm font-semibold text-slate-900">{{ t('management.partnerTemplatesPanel.deleteModal.title') }}</h4>
              <p class="text-xs text-slate-500">{{ t('management.partnerTemplatesPanel.deleteModal.undoneHint') }}</p>
            </div>
          </div>
          <i18n-t keypath="management.partnerTemplatesPanel.deleteModal.confirm" tag="p" class="text-sm text-slate-600 mb-4">
            <template #name><strong>{{ templateToDelete.name }}</strong></template>
          </i18n-t>
          <div class="flex gap-2">
            <button type="button" @click="templateToDelete = null" :class="[BTN_SECONDARY, 'flex-1']">
              {{ t('management.partnerTemplatesPanel.deleteModal.cancel') }}
            </button>
            <button type="button" @click="confirmDelete" :disabled="deleting" :class="[BTN_DANGER, 'flex-1']">
              <Loader2 v-if="deleting" class="w-4 h-4 animate-spin" />
              {{ deleting ? t('management.partnerTemplatesPanel.deleteModal.deleting') : t('management.partnerTemplatesPanel.deleteModal.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Create / Edit Form (slide-over) -->
    <PartnerTemplateForm
      :is-open="showForm"
      :existing-template="editingTemplate"
      :event-id="eventId"
      :event-data="eventData"
      @close="closeForm"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Plus,
  LayoutTemplate,
  AlertCircle,
  CheckCircle,
  Trash2,
  Loader2,
  Clock,
  XCircle,
  FileEdit,
  RotateCcw,
  type LucideIcon,
} from 'lucide-vue-next'
import { useToast } from '../../composables/useToast'
import { useMediaQuery } from '../../composables/useMediaQuery'
import { TEMPLATES_HEADER_SLOT } from './templatesHeaderSlot'
import { BTN_DANGER, BTN_PRIMARY, BTN_PRIMARY_BAR, BTN_SECONDARY, STAT_CHIP } from './templateUi'
import { useAuthStore } from '../../stores/auth'
import { partnerTemplateService } from '../../services/api'
import type { Event, PartnerTemplate } from '../../services/api'
import PartnerTemplateCard from './PartnerTemplateCard.vue'
import PartnerTemplateForm from './PartnerTemplateForm.vue'
import TemplateTypeFilter, { type TemplateTypeFilterOption, type TemplateTypeValue } from './TemplateTypeFilter.vue'

const { t } = useI18n()
// There is exactly one toast stack in the app (§12) — this panel used to render
// its own, which put it underneath the modal it lives in.
const { showSuccess, showError } = useToast()

interface Props {
  /**
   * The event this panel was opened from. Partner templates are only ever
   * created from inside an event's manage page, and the create/edit form uses
   * that event as the live preview's sample content — so it's passed straight
   * through rather than picked or fetched.
   */
  eventId: string
  /** That event's record, for the preview's frame-list decisions. */
  eventData?: Event | null
}

withDefaults(defineProps<Props>(), { eventData: null })

const emit = defineEmits<{
  'template-selected': [template: PartnerTemplate]
  'form-opened': []
  'form-closed': []
}>()

/**
 * Staff reach this panel through the same gate a partner does — the backend
 * permission is `IsPartnerOrStaff` and there is not one endpoint of their own —
 * but the list that comes back is a different object: every system template
 * plus every partner's work in progress, drafts included, rather than their own
 * handful. So the panel swaps its status roll-up for a filter across the two
 * authors, and names the author on partner rows, without which the two kinds
 * are indistinguishable.
 */
const authStore = useAuthStore()
const isStaff = computed(() => !!authStore.user?.is_staff)

const loading = ref(false)
const loadError = ref(false)
const deleting = ref(false)
const templates = ref<PartnerTemplate[]>([])
const selectedTemplateId = ref<number | null>(null)
const showForm = ref(false)
const editingTemplate = ref<PartnerTemplate | null>(null)
const templateToDelete = ref<PartnerTemplate | null>(null)

// From `lg` up these controls ride in the modal's header row instead of opening
// a bar of their own; the editor takes that row over while it's open, so the
// panel stands down rather than both teleporting into it at once.
const headerSlot = inject(TEMPLATES_HEADER_SLOT, ref(null))
const isDesktop = useMediaQuery('(min-width: 1024px)')
const useSharedHeader = computed(() => isDesktop.value && !showForm.value)

const typeFilter = ref<TemplateTypeValue>('all')

const visibleTemplates = computed(() =>
  typeFilter.value === 'all'
    ? templates.value
    : templates.value.filter((tpl) => tpl.template_type === typeFilter.value),
)

/**
 * The filter carries its own counts, which is why staff see it *instead of* the
 * status summary rather than beside it: one control answering both questions.
 * The summary would have little to say to them anyway — a staff template is
 * `approved` from birth, so most of their list collapses into one chip.
 */
const typeFilterOptions = computed((): TemplateTypeFilterOption[] => {
  let system = 0
  for (const tpl of templates.value) if (tpl.template_type === 'system') system++
  return [
    { value: 'all', label: t('management.partnerTemplatesPanel.filter.all'), count: templates.value.length },
    { value: 'system', label: t('management.partnerTemplatesPanel.filter.system'), count: system },
    { value: 'partner', label: t('management.partnerTemplatesPanel.filter.partner'), count: templates.value.length - system },
  ]
})

const statusStats = computed(() => {
  const counts = { draft: 0, pending_review: 0, approved: 0, rejected: 0 }
  for (const tpl of templates.value) {
    counts[tpl.status]++
  }
  const items: Array<{ status: string; count: number; label: string; class: string; icon: LucideIcon }> = []
  if (counts.approved > 0) items.push({ status: 'approved', count: counts.approved, label: t('management.partnerTemplatesPanel.status.approved'), class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle })
  if (counts.pending_review > 0) items.push({ status: 'pending_review', count: counts.pending_review, label: t('management.partnerTemplatesPanel.status.pendingReview'), class: 'bg-amber-100 text-amber-700', icon: Clock })
  if (counts.draft > 0) items.push({ status: 'draft', count: counts.draft, label: t('management.partnerTemplatesPanel.status.draft'), class: 'bg-slate-100 text-slate-600', icon: FileEdit })
  if (counts.rejected > 0) items.push({ status: 'rejected', count: counts.rejected, label: t('management.partnerTemplatesPanel.status.rejected'), class: 'bg-red-100 text-red-700', icon: XCircle })
  return items
})

async function loadTemplates(): Promise<void> {
  loading.value = true
  loadError.value = false
  try {
    // Paged to the end by the service. A partner rarely fills one page, so the
    // pagination was invisible while every caller was one; staff receive the
    // whole catalogue against a page size of 20, and reading `results` once
    // would show them the first 20 with no signal that the rest exist.
    const response = await partnerTemplateService.listEditableTemplates()
    if (response.success && response.data) {
      templates.value = response.data
    } else {
      console.warn('[PartnerTemplatesPanel] API error:', response.message)
      loadError.value = true
    }
  } catch (err) {
    console.error('[PartnerTemplatesPanel] Failed to load templates:', err)
    loadError.value = true
  } finally {
    loading.value = false
  }
}

function handleSelect(template: PartnerTemplate): void {
  if (template.status !== 'approved') return
  selectedTemplateId.value = template.id
  emit('template-selected', template)
}

function openForm(template: PartnerTemplate | null): void {
  editingTemplate.value = template
  showForm.value = true
  emit('form-opened')
}

function closeForm(): void {
  showForm.value = false
  editingTemplate.value = null
  emit('form-closed')
}

function handleEdit(template: PartnerTemplate): void {
  openForm(template)
}

async function handleSubmit(template: PartnerTemplate): Promise<void> {
  try {
    const response = await partnerTemplateService.submitForReview(template.id)
    if (response.success && response.data) {
      const idx = templates.value.findIndex((tpl) => tpl.id === template.id)
      if (idx !== -1) templates.value[idx] = response.data.template
      showSuccess(t('management.partnerTemplatesPanel.toast.submitted'))
    } else {
      showError(response.message || t('management.partnerTemplatesPanel.toast.submitFailed'))
    }
  } catch {
    showError(t('management.partnerTemplatesPanel.toast.submitError'))
  }
}

function handleDelete(template: PartnerTemplate): void {
  templateToDelete.value = template
}

async function confirmDelete(): Promise<void> {
  if (!templateToDelete.value) return
  deleting.value = true
  try {
    await partnerTemplateService.deleteTemplate(templateToDelete.value.id)
    templates.value = templates.value.filter((tpl) => tpl.id !== templateToDelete.value!.id)
    if (selectedTemplateId.value === templateToDelete.value.id) {
      selectedTemplateId.value = null
    }
    showSuccess(t('management.partnerTemplatesPanel.toast.deleted'))
    templateToDelete.value = null
  } catch {
    showError(t('management.partnerTemplatesPanel.toast.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

function handleSaved(template: PartnerTemplate): void {
  const wasEditing = !!editingTemplate.value
  // Don't save a card into a shelf that isn't showing. Staff always author
  // system templates, so anyone who left the filter on Partner would watch the
  // success toast fire over an unchanged grid.
  if (typeFilter.value !== 'all' && template.template_type !== typeFilter.value) {
    typeFilter.value = 'all'
  }
  const idx = templates.value.findIndex((tpl) => tpl.id === template.id)
  if (idx !== -1) {
    templates.value[idx] = template
  } else {
    templates.value.unshift(template)
  }
  closeForm()
  showSuccess(wasEditing ? t('management.partnerTemplatesPanel.toast.updated') : t('management.partnerTemplatesPanel.toast.created'))
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
