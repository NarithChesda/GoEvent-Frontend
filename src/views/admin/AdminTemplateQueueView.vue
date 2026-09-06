<template>
  <AdminQueueShell
    queue-name="templates"
    :title="t('admin.templates.title')"
    :description="t('admin.templates.description')"
    :search-placeholder="t('admin.templates.search')"
    :empty-title="t('admin.templates.emptyTitle')"
    :empty-body="t('admin.templates.emptyBody')"
    :status-options="statusOptions"
    :ordering-options="orderingOptions"
    :extra-params="extraParams"
    :row-title="(row: AdminTemplateRow) => row.name"
    :row-eyebrow="() => t('admin.templates.eyebrow')"
    :approve-label="t('admin.templates.approve')"
  >
    <template #filters>
      <div class="relative">
        <select
          v-model="templateType"
          class="appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          :aria-label="t('admin.templates.typeFilter')"
        >
          <option value="">{{ t('admin.templates.types.all') }}</option>
          <option value="partner">{{ t('admin.templates.types.partner') }}</option>
          <option value="system">{{ t('admin.templates.types.system') }}</option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </template>

    <template #row="{ row }">
      <!-- 9:16, because that is what an invitation is. A square crop of a
           portrait design shows its middle and hides the two ends the reviewer
           is judging. -->
      <span
        class="flex h-14 w-[2.1875rem] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
      >
        <AdminImage :src="row.preview_image" alt="" img-class="h-full w-full object-cover">
          <template #fallback>
            <ImageOff class="h-4 w-4 text-slate-400" aria-hidden="true" />
          </template>
        </AdminImage>
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2">
          <span class="min-w-0 truncate text-sm font-medium text-slate-900">{{ row.name }}</span>
          <AdminStatusBadge :status="row.status" :status-display="row.status_display" />
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ describeActor(row.created_by) ?? t('admin.unknownAuthor') }}
          <template v-if="row.package_plan_name"> · {{ row.package_plan_name }}</template>
          · {{ formatRelative(row.created_at) }}
        </span>
      </span>
    </template>

    <template #detail="{ row }">
      <!-- The preview is the evidence, so it gets the room. The design blobs
           are deliberately not in this serializer — a reviewer decides from the
           artwork, and the layout fields are Django admin's business. -->
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <AdminImage
          :src="row.preview_image"
          :alt="t('admin.templates.previewAlt', { name: row.name })"
          img-class="mx-auto max-h-[22rem] w-auto"
          eager
        >
          <template #fallback>
            <div class="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <ImageOff class="h-6 w-6 text-slate-400" aria-hidden="true" />
              <p class="text-sm text-slate-500">{{ t('admin.templates.noPreview') }}</p>
            </div>
          </template>
        </AdminImage>
      </div>

      <a
        v-if="resolveMediaUrl(row.preview_image)"
        :href="resolveMediaUrl(row.preview_image)"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e90ff] hover:underline"
      >
        <ExternalLink class="h-4 w-4" aria-hidden="true" />
        {{ t('admin.templates.openFullSize') }}
      </a>

      <AdminFacts :facts="factsFor(row)" />
      <AdminNote :label="t('admin.internalNotes')" :note="row.admin_notes" internal />
    </template>
  </AdminQueueShell>
</template>

<script setup lang="ts">
/**
 * Partner designs awaiting review.
 *
 * The drawer shows the preview image and the record, and nothing else, because
 * that is all this serializer carries: `cover_stage_layout`, the `*_design`
 * fields and `stage_modes` are deliberately excluded — they would dominate the
 * response and a reviewer decides from the artwork.
 *
 * The API docs suggest deep-linking a reviewer into the partner template editor
 * for the internals. **There is no such link to make today**: that editor lives
 * inside `BrowseTemplateModal` → `PartnerTemplatesPanel`, reachable only from an
 * event's template picker, and it has no route of its own. Until it does, the
 * full-size preview is the closest thing, and it opens in a new tab rather than
 * inside a drawer whose whole width is 580px.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, ExternalLink, ImageOff } from 'lucide-vue-next'
import AdminQueueShell from '@/components/admin/AdminQueueShell.vue'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge.vue'
import AdminFacts from '@/components/admin/AdminFacts.vue'
import AdminImage from '@/components/admin/AdminImage.vue'
import AdminNote from '@/components/admin/AdminNote.vue'
import {
  describeActor,
  formatDateTime,
  formatMoney,
  formatRelative,
  type AdminFact,
} from '@/components/admin/adminDisplay'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import type { AdminTemplateRow } from '@/services/api'

const { t } = useI18n()

const templateType = ref('')
const extraParams = computed(() => ({ template_type: templateType.value || undefined }))

const statusOptions = computed(() => [
  { value: '', label: t('admin.status.pendingReview') },
  { value: 'approved', label: t('admin.status.approved') },
  { value: 'rejected', label: t('admin.status.rejected') },
  { value: 'draft', label: t('admin.status.draft') },
  { value: 'all', label: t('admin.status.all') },
])

const orderingOptions = computed(() => [
  { value: '-created_at', label: t('admin.ordering.newest') },
  { value: 'created_at', label: t('admin.ordering.oldest') },
  { value: 'name', label: t('admin.ordering.name') },
  { value: '-updated_at', label: t('admin.ordering.updated') },
])

const factsFor = (row: AdminTemplateRow): AdminFact[] => [
  { label: t('admin.templates.author'), value: describeActor(row.created_by), strong: true },
  { label: t('admin.templates.authorEmail'), value: row.created_by?.email },
  { label: t('admin.templates.type'), value: t(`admin.templates.types.${row.template_type}`) },
  { label: t('admin.templates.plan'), value: row.package_plan_name },
  {
    label: t('admin.templates.planPrice'),
    value: row.package_plan_price ? formatMoney(row.package_plan_price) : null,
  },
  { label: t('admin.templates.colors'), value: row.colors_count },
  { label: t('admin.templates.fonts'), value: row.fonts_count },
  { label: t('admin.submitted'), value: formatDateTime(row.created_at) },
  { label: t('admin.reviewedBy'), value: describeActor(row.reviewed_by) },
  { label: t('admin.reviewedAt'), value: row.reviewed_at ? formatDateTime(row.reviewed_at) : null },
]
</script>
