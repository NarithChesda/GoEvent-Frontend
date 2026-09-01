<template>
  <div
    :class="[
      'group relative bg-white rounded-2xl overflow-hidden transition-[box-shadow,transform] duration-200 ease-out',
      isApproved
        ? 'cursor-pointer active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50'
        : 'cursor-default',
      isSelected && isApproved
        ? 'ring-2 ring-[#1e90ff] ring-offset-2 ring-offset-slate-50 shadow-xl shadow-sky-500/10'
        : isApproved
          ? 'ring-1 ring-slate-200/80 hover:ring-slate-300 hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-0.5'
          : 'ring-1 ring-slate-200/80',
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
        class="w-full h-full object-cover transition-[transform,opacity] duration-500 ease-out"
        :class="{
          'opacity-0': imageLoading,
          'opacity-100': !imageLoading,
          'group-hover:scale-[1.04]': isApproved,
        }"
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
        v-if="!hasImage"
        class="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2"
      >
        <ImageOff class="w-10 h-10" />
        <span class="text-[0.625rem] font-medium text-slate-400">{{ t('management.partnerTemplatesPanel.card.noPreview') }}</span>
      </div>

      <!-- Type / status badge. A system template is born approved and stays
           there, so its status badge would read the same word on every card and
           tell a staff author nothing; the useful fact is that it is the public
           catalogue they're looking at. Partner rows keep the status badge,
           which is the one thing that does vary across them. -->
      <div class="absolute top-2 left-2 z-10">
        <span
          v-if="isSystem"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-bold shadow-lg bg-slate-900/85 text-white backdrop-blur-sm"
        >
          <Globe class="w-3 h-3" />
          {{ t('management.partnerTemplatesPanel.card.systemBadge') }}
        </span>
        <span v-else :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-bold shadow-lg', statusClass]">
          <component :is="statusIcon" class="w-3 h-3" />
          {{ template.status_display }}
        </span>
      </div>

      <!-- Selected check (only for approved) -->
      <div v-if="isSelected && isApproved" class="absolute top-2 right-2 z-10">
        <div class="w-6 h-6 bg-[#1e90ff] rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/90">
          <Check class="w-4 h-4 text-white" />
        </div>
      </div>

      <!-- Dim overlay for non-selectable states (only over imagery) -->
      <div v-if="!isApproved && hasImage" class="absolute inset-0 bg-slate-900/20" />

      <!-- Info footer: dark scrim over imagery, light strip on placeholders -->
      <div
        :class="[
          'absolute inset-x-0 bottom-0 px-2 pb-2 sm:px-2.5 sm:pb-2.5',
          hasImage
            ? 'bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10'
            : 'bg-white/85 backdrop-blur-sm border-t border-slate-200/70 pt-2 sm:pt-2.5',
        ]"
      >
        <h4
          :class="[
            'font-semibold text-[0.6875rem] sm:text-xs truncate',
            hasImage ? 'text-white drop-shadow-sm' : 'text-slate-900',
          ]"
        >
          {{ template.name }}
        </h4>
        <!-- Whose work this is. Only staff ever see a list holding more than
             one author's templates, and only partner rows have an author worth
             naming — a system template's is the staff account itself. -->
        <p
          v-if="showAuthor && !isSystem && template.created_by_name"
          :class="[
            'text-[0.625rem] truncate',
            hasImage ? 'text-white/75' : 'text-slate-500',
          ]"
        >
          {{ t('management.partnerTemplatesPanel.card.byAuthor', { name: template.created_by_name }) }}
        </p>
        <!-- Same plan chip the browse grid uses, so a partner's own templates
             and the catalogue read as one shelf. It was plain grey text here
             and a coloured pill there. -->
        <span
          v-if="template.package_plan"
          :class="[
            'inline-flex items-center gap-1 mt-1 text-[0.625rem] sm:text-[0.6875rem] font-medium px-2 py-0.5 rounded-full',
            hasImage ? 'bg-white/20 text-white/95 backdrop-blur-sm' : 'bg-slate-100 text-slate-600',
          ]"
        >
          <component :is="isStandardPlan ? Crown : Sparkles" class="w-3 h-3 flex-shrink-0" />
          {{ template.package_plan.name }}
        </span>
      </div>
    </div>

    <!-- Card Actions Footer -->
    <div class="p-1.5 flex items-center gap-1 bg-white border-t border-slate-100">
      <button
        type="button"
        @click.stop="emit('edit', template)"
        :class="BTN_GHOST_SM"
        :title="t('management.partnerTemplatesPanel.card.editTitle')"
      >
        <Pencil class="w-3.5 h-3.5" />
        {{ t('management.partnerTemplatesPanel.card.edit') }}
      </button>

      <button
        v-if="canSubmit"
        type="button"
        @click.stop="emit('submit', template)"
        :class="[BTN_GHOST_SM, 'text-sky-600 hover:text-sky-700 hover:bg-sky-50']"
        :title="t('management.partnerTemplatesPanel.card.submitTitle')"
      >
        <Send class="w-3.5 h-3.5" />
        {{ t('management.partnerTemplatesPanel.card.submit') }}
      </button>

      <button
        type="button"
        @click.stop="emit('delete', template)"
        :class="[BTN_ICON_MICRO, 'ml-auto hover:text-red-600 hover:bg-red-50']"
        :title="t('management.partnerTemplatesPanel.card.deleteTitle')"
        :aria-label="t('management.partnerTemplatesPanel.card.deleteTitle')"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Admin notes for rejected -->
    <div v-if="template.status === 'rejected' && template.admin_notes" class="px-2 pb-2">
      <p class="text-[0.625rem] text-red-600 bg-red-50 ring-1 ring-red-100 rounded-lg px-2 py-1.5 leading-snug">
        <span class="font-semibold">{{ t('management.partnerTemplatesPanel.card.adminNote') }} </span>{{ template.admin_notes }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ImageOff, Check, Crown, Globe, Pencil, Send, Sparkles, Trash2, Clock, CheckCircle, XCircle, FileEdit, type LucideIcon } from 'lucide-vue-next'
import type { PartnerTemplate } from '../../services/api'
import { BTN_GHOST_SM, BTN_ICON_MICRO } from './templateUi'

interface Props {
  template: PartnerTemplate
  isSelected?: boolean
  /**
   * Name the author on partner rows. Set by the panel when the viewer is
   * staff, whose list mixes the system catalogue with every partner's work in
   * progress; a partner's own list is all theirs, so the line would be noise.
   */
  showAuthor?: boolean
}

const props = withDefaults(defineProps<Props>(), { isSelected: false, showAuthor: false })

const emit = defineEmits<{
  select: [template: PartnerTemplate]
  edit: [template: PartnerTemplate]
  submit: [template: PartnerTemplate]
  delete: [template: PartnerTemplate]
}>()

const { t } = useI18n()

const imageLoading = ref(true)
const imageError = ref(false)

const hasImage = computed(() => !!props.template.preview_image && !imageError.value)

const isApproved = computed(() => props.template.status === 'approved')
const isSystem = computed(() => props.template.template_type === 'system')
const isStandardPlan = computed(() =>
  (props.template.package_plan?.name ?? '').toLowerCase().includes('standard'),
)
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

const statusIcon = computed((): LucideIcon => {
  switch (props.template.status) {
    case 'approved': return CheckCircle
    case 'pending_review': return Clock
    case 'rejected': return XCircle
    default: return FileEdit
  }
})
</script>
