<template>
  <div
    :class="[
      'group relative bg-white border rounded-xl overflow-hidden transition-all duration-200',
      isApproved
        ? 'cursor-pointer hover:shadow-lg hover:scale-[1.01] border-white/40 hover:border-sky-300'
        : 'cursor-default border-slate-200',
      isSelected && isApproved ? 'border-[#1e90ff] ring-2 ring-[#87CEEB] shadow-lg' : '',
    ]"
    @click="isApproved ? emit('select', template) : undefined"
    :role="isApproved ? 'button' : undefined"
    :tabindex="isApproved ? 0 : undefined"
    @keydown.enter.prevent="isApproved ? emit('select', template) : undefined"
    @keydown.space.prevent="isApproved ? emit('select', template) : undefined"
  >
    <!-- Preview Image -->
    <div class="relative w-full aspect-[9/16] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
      <img
        v-if="template.preview_image && !imageError"
        :src="template.preview_image"
        :alt="`${template.name} preview`"
        class="w-full h-full object-cover transition-opacity duration-300"
        :class="{ 'opacity-0': imageLoading, 'opacity-100': !imageLoading }"
        loading="lazy"
        @load="imageLoading = false"
        @error="imageError = true; imageLoading = false"
      />
      <div
        v-if="imageLoading && template.preview_image && !imageError"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="w-8 h-8 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
      </div>
      <div
        v-if="!template.preview_image || imageError"
        class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2"
      >
        <ImageOff class="w-10 h-10 opacity-40" />
        <span class="text-xs font-medium text-center px-3">{{ template.name }}</span>
        <span class="text-[10px] text-slate-400">No preview yet</span>
      </div>

      <!-- Status Badge -->
      <div class="absolute top-2 left-2 z-10">
        <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-lg', statusClass]">
          <component :is="statusIcon" class="w-3 h-3" />
          {{ template.status_display }}
        </span>
      </div>

      <!-- Selected check (only for approved) -->
      <div v-if="isSelected && isApproved" class="absolute top-2 right-2 z-10">
        <div class="w-6 h-6 bg-[#1e90ff] rounded-full flex items-center justify-center shadow-lg">
          <Check class="w-4 h-4 text-white" />
        </div>
      </div>

      <!-- Dim overlay for non-selectable states -->
      <div v-if="!isApproved" class="absolute inset-0 bg-slate-900/20" />

      <!-- Info overlay -->
      <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <h4 class="font-semibold text-white text-xs truncate">{{ template.name }}</h4>
        <p v-if="template.package_plan" class="text-[10px] text-white/70">
          {{ template.package_plan.name }}
        </p>
      </div>
    </div>

    <!-- Card Actions Footer -->
    <div class="p-2 flex items-center justify-between gap-1 bg-white">
      <button
        type="button"
        @click.stop="emit('edit', template)"
        class="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        title="Edit template"
      >
        <Pencil class="w-3 h-3" />
        Edit
      </button>

      <button
        v-if="canSubmit"
        type="button"
        @click.stop="emit('submit', template)"
        class="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-sky-600 hover:bg-sky-50 transition-colors"
        title="Submit for review"
      >
        <Send class="w-3 h-3" />
        Submit
      </button>

      <button
        type="button"
        @click.stop="emit('delete', template)"
        class="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-500 hover:bg-red-50 transition-colors ml-auto"
        title="Delete template"
      >
        <Trash2 class="w-3 h-3" />
      </button>
    </div>

    <!-- Admin notes for rejected -->
    <div v-if="template.status === 'rejected' && template.admin_notes" class="px-2 pb-2">
      <p class="text-[10px] text-red-600 bg-red-50 rounded-md px-2 py-1.5 leading-snug">
        <span class="font-semibold">Admin note: </span>{{ template.admin_notes }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ImageOff, Check, Pencil, Send, Trash2, Clock, CheckCircle, XCircle, FileEdit, type LucideComponent } from 'lucide-vue-next'
import type { PartnerTemplate } from '../../services/api'

interface Props {
  template: PartnerTemplate
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), { isSelected: false })

const emit = defineEmits<{
  select: [template: PartnerTemplate]
  edit: [template: PartnerTemplate]
  submit: [template: PartnerTemplate]
  delete: [template: PartnerTemplate]
}>()

const imageLoading = ref(true)
const imageError = ref(false)

const isApproved = computed(() => props.template.status === 'approved')
const canSubmit = computed(() =>
  props.template.status === 'draft' || props.template.status === 'rejected'
)

const statusClass = computed(() => {
  switch (props.template.status) {
    case 'approved': return 'bg-emerald-500 text-white'
    case 'pending_review': return 'bg-amber-500 text-white'
    case 'rejected': return 'bg-red-500 text-white'
    default: return 'bg-slate-500 text-white'
  }
})

const statusIcon = computed((): LucideComponent => {
  switch (props.template.status) {
    case 'approved': return CheckCircle
    case 'pending_review': return Clock
    case 'rejected': return XCircle
    default: return FileEdit
  }
})
</script>
