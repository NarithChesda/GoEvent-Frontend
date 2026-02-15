<template>
  <div class="relative flex flex-col h-full overflow-hidden">
    <!-- Panel Header -->
    <div class="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-slate-200 bg-white">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-semibold text-slate-900">My Templates</h3>
          <p class="text-xs text-slate-500 mt-0.5">Create and manage your custom templates</p>
        </div>
        <button
          type="button"
          @click="showForm = true; editingTemplate = null"
          class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white hover:from-[#27ae60] hover:to-[#1873cc] transition-all shadow-sm"
        >
          <Plus class="w-4 h-4" />
          <span class="hidden sm:inline">New Template</span>
          <span class="sm:hidden">New</span>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="w-8 h-8 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle class="w-10 h-10 text-red-400 mb-3" />
        <p class="text-sm font-medium text-slate-700">Failed to load templates</p>
        <button type="button" @click="loadTemplates" class="mt-3 text-sm text-sky-600 hover:underline">Try again</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="templates.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <LayoutTemplate class="w-8 h-8 text-slate-400" />
        </div>
        <h4 class="text-base font-semibold text-slate-700 mb-1">No templates yet</h4>
        <p class="text-sm text-slate-500 max-w-xs">
          Create your first custom template and submit it for review.
          Once approved, you can use it for your events.
        </p>
        <button
          type="button"
          @click="showForm = true; editingTemplate = null"
          class="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white hover:from-[#27ae60] hover:to-[#1873cc] transition-all"
        >
          <Plus class="w-4 h-4" />
          Create your first template
        </button>
      </div>

      <!-- Templates Grid -->
      <div v-else>
        <!-- Status Summary -->
        <div class="flex gap-2 mb-4 flex-wrap">
          <span
            v-for="stat in statusStats"
            :key="stat.status"
            :class="['inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', stat.class]"
          >
            <component :is="stat.icon" class="w-3 h-3" />
            {{ stat.count }} {{ stat.label }}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <PartnerTemplateCard
            v-for="template in templates"
            :key="template.id"
            :template="template"
            :is-selected="selectedTemplateId === template.id && template.status === 'approved'"
            @select="handleSelect"
            @edit="handleEdit"
            @submit="handleSubmit"
            @delete="handleDelete"
          />
        </div>
      </div>
    </div>

    <!-- Toast / feedback message -->
    <Transition name="toast">
      <div
        v-if="feedback"
        :class="[
          'absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white z-20',
          feedback.type === 'success' ? 'bg-emerald-500' : 'bg-red-500',
        ]"
      >
        <component :is="feedback.type === 'success' ? CheckCircle : AlertCircle" class="w-4 h-4" />
        {{ feedback.text }}
      </div>
    </Transition>

    <!-- Delete Confirmation Dialog -->
    <Transition name="fade">
      <div
        v-if="templateToDelete"
        class="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-6"
        @click.self="templateToDelete = null"
      >
        <div class="bg-white rounded-xl shadow-2xl p-5 max-w-xs w-full">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 class="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h4 class="text-sm font-semibold text-slate-900">Delete Template</h4>
              <p class="text-xs text-slate-500">This action cannot be undone.</p>
            </div>
          </div>
          <p class="text-sm text-slate-600 mb-4">
            Are you sure you want to delete <strong>{{ templateToDelete.name }}</strong>?
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              @click="templateToDelete = null"
              class="flex-1 px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="confirmDelete"
              :disabled="deleting"
              class="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
            >
              <Loader2 v-if="deleting" class="w-4 h-4 animate-spin" />
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Create / Edit Form (slide-over) -->
    <PartnerTemplateForm
      :is-open="showForm"
      :existing-template="editingTemplate"
      @close="showForm = false"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  type LucideComponent,
} from 'lucide-vue-next'
import { partnerTemplateService } from '../../services/api'
import type { PartnerTemplate } from '../../services/api'
import PartnerTemplateCard from './PartnerTemplateCard.vue'
import PartnerTemplateForm from './PartnerTemplateForm.vue'

const emit = defineEmits<{
  'template-selected': [template: PartnerTemplate]
}>()

const loading = ref(false)
const loadError = ref(false)
const deleting = ref(false)
const templates = ref<PartnerTemplate[]>([])
const selectedTemplateId = ref<number | null>(null)
const showForm = ref(false)
const editingTemplate = ref<PartnerTemplate | null>(null)
const templateToDelete = ref<PartnerTemplate | null>(null)
const feedback = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const statusStats = computed(() => {
  const counts = { draft: 0, pending_review: 0, approved: 0, rejected: 0 }
  for (const t of templates.value) {
    counts[t.status]++
  }
  const items: Array<{ status: string; count: number; label: string; class: string; icon: LucideComponent }> = []
  if (counts.approved > 0) items.push({ status: 'approved', count: counts.approved, label: 'approved', class: 'bg-emerald-100 text-emerald-700', icon: CheckCircle })
  if (counts.pending_review > 0) items.push({ status: 'pending_review', count: counts.pending_review, label: 'pending review', class: 'bg-amber-100 text-amber-700', icon: Clock })
  if (counts.draft > 0) items.push({ status: 'draft', count: counts.draft, label: 'draft', class: 'bg-slate-100 text-slate-600', icon: FileEdit })
  if (counts.rejected > 0) items.push({ status: 'rejected', count: counts.rejected, label: 'rejected', class: 'bg-red-100 text-red-700', icon: XCircle })
  return items
})

async function loadTemplates(): Promise<void> {
  loading.value = true
  loadError.value = false
  try {
    const response = await partnerTemplateService.listMyTemplates()
    if (response.success && response.data) {
      // Handle both flat array and paginated response formats
      const data = response.data
      if (Array.isArray(data)) {
        templates.value = data
      } else if (data && typeof data === 'object' && 'results' in data) {
        // Paginated response: { count, results: [...] }
        templates.value = (data as { results: PartnerTemplate[] }).results
      } else {
        console.warn('[PartnerTemplatesPanel] Unexpected response format:', data)
        templates.value = []
      }
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

function handleEdit(template: PartnerTemplate): void {
  editingTemplate.value = template
  showForm.value = true
}

async function handleSubmit(template: PartnerTemplate): Promise<void> {
  try {
    const response = await partnerTemplateService.submitForReview(template.id)
    if (response.success && response.data) {
      const idx = templates.value.findIndex((t) => t.id === template.id)
      if (idx !== -1) templates.value[idx] = response.data.template
      showFeedback('success', 'Template submitted for review!')
    } else {
      showFeedback('error', response.message || 'Failed to submit. Ensure a preview image is uploaded.')
    }
  } catch {
    showFeedback('error', 'Unable to submit. Please try again.')
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
    templates.value = templates.value.filter((t) => t.id !== templateToDelete.value!.id)
    if (selectedTemplateId.value === templateToDelete.value.id) {
      selectedTemplateId.value = null
    }
    showFeedback('success', 'Template deleted.')
    templateToDelete.value = null
  } catch {
    showFeedback('error', 'Failed to delete template.')
  } finally {
    deleting.value = false
  }
}

function handleSaved(template: PartnerTemplate): void {
  const wasEditing = !!editingTemplate.value
  const idx = templates.value.findIndex((t) => t.id === template.id)
  if (idx !== -1) {
    templates.value[idx] = template
  } else {
    templates.value.unshift(template)
  }
  showForm.value = false
  editingTemplate.value = null
  showFeedback('success', wasEditing ? 'Template updated!' : 'Template created!')
}

let feedbackTimer: ReturnType<typeof setTimeout> | null = null
function showFeedback(type: 'success' | 'error', text: string): void {
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedback.value = { type, text }
  feedbackTimer = setTimeout(() => {
    feedback.value = null
  }, 3000)
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
