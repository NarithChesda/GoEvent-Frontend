<template>
  <AdminQueueShell
    queue-name="partner-requests"
    :title="t('admin.partnerRequests.title')"
    :description="t('admin.partnerRequests.description')"
    :search-placeholder="t('admin.partnerRequests.search')"
    :empty-title="t('admin.partnerRequests.emptyTitle')"
    :empty-body="t('admin.partnerRequests.emptyBody')"
    :status-options="statusOptions"
    :ordering-options="orderingOptions"
    :extra-params="extraParams"
    :row-title="(row: AdminPartnerRequestRow) => row.business_name"
    :row-eyebrow="(row: AdminPartnerRequestRow) => row.user?.email ?? null"
    :approve-label="t('admin.partnerRequests.approve')"
    :reject-extra="rejectExtra"
  >
    <template #filters>
      <div class="relative">
        <select
          v-model="volume"
          class="appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          :aria-label="t('admin.partnerRequests.volumeFilter')"
        >
          <option value="">{{ t('admin.partnerRequests.volumes.any') }}</option>
          <option v-for="option in VOLUMES" :key="option" :value="option">
            {{ t(`admin.partnerRequests.volumes.${option}`) }}
          </option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </template>

    <template #row="{ row }">
      <span
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100"
        aria-hidden="true"
      >
        <UserRoundPlus class="h-4 w-4 text-slate-500" />
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2">
          <span class="min-w-0 truncate text-sm font-medium text-slate-900">
            {{ row.business_name }}
          </span>
          <AdminStatusBadge :status="row.status" :status-display="row.status_display" />
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ row.user?.email }}
          <template v-if="row.expected_monthly_events_display">
            · {{ row.expected_monthly_events_display }}
          </template>
          · {{ formatRelative(row.created_at) }}
        </span>
      </span>
    </template>

    <template #detail="{ row }">
      <!-- Approving grants `is_partner`, which is the only route to a partner
           account outside Django admin — so the warning is on the screen where
           the decision is made, not in a doc. -->
      <div class="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
        <BadgeCheck class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1e90ff]" aria-hidden="true" />
        <p class="text-sm text-slate-700">{{ t('admin.partnerRequests.grantsFlag') }}</p>
      </div>

      <div v-if="row.message" class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {{ t('admin.partnerRequests.theirMessage') }}
        </p>
        <p class="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {{ row.message }}
        </p>
      </div>

      <AdminFacts :facts="factsFor(row)" />

      <!-- Two notes, drawn differently on purpose: `review_note` is what the
           applicant was sent, `admin_notes` is internal and must never be
           quoted to them. -->
      <AdminNote :label="t('admin.partnerRequests.reviewNote')" :note="row.review_note" />
      <AdminNote :label="t('admin.internalNotes')" :note="row.admin_notes" internal />
    </template>

    <!-- The one deviation from the shared decision contract. Three answers, not
         two: omitting the field is the 30-day cooling-off period, and it is the
         reasonable default — "never" should feel like a deliberate choice. -->
    <template #decision-extra>
      <div>
        <p class="mb-2 text-sm font-medium text-slate-700">
          {{ t('admin.partnerRequests.reapplyLabel') }}
        </p>
        <SegmentedField
          v-model="reapply"
          :options="reapplyOptions"
          :aria-label="t('admin.partnerRequests.reapplyLabel')"
        />
        <p class="mt-1.5 text-xs text-slate-500">{{ t('admin.partnerRequests.reapplyHint') }}</p>
      </div>
    </template>
  </AdminQueueShell>
</template>

<script setup lang="ts">
/**
 * Applications for the `is_partner` flag.
 *
 * Approving **grants the flag**, and there is no undo here — removing partner
 * access means clearing it on the user, in the user directory. An approved
 * request cannot be rejected either; the API answers `409`.
 *
 * This is the only queue whose reject carries an extra field. `can_reapply` has
 * three answers and the control offers all three, because the third — omitting
 * it, meaning the 30-day cooling-off period — is the sensible default and would
 * otherwise be unreachable from a two-state control. `false` is final, and it
 * should take a deliberate press to choose.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { BadgeCheck, ChevronDown, UserRoundPlus } from 'lucide-vue-next'
import AdminQueueShell from '@/components/admin/AdminQueueShell.vue'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge.vue'
import AdminFacts from '@/components/admin/AdminFacts.vue'
import AdminNote from '@/components/admin/AdminNote.vue'
import SegmentedField from '@/components/common/SegmentedField.vue'
import {
  describeActor,
  formatDateTime,
  formatRelative,
  type AdminFact,
} from '@/components/admin/adminDisplay'
import type { AdminPartnerRequestRow, AdminPartnerRequestVolume } from '@/services/api'

const VOLUMES: AdminPartnerRequestVolume[] = ['1_5', '6_20', '21_50', '50_plus']

const { t } = useI18n()

const volume = ref('')
const extraParams = computed(() => ({ expected_monthly_events: volume.value || undefined }))

/**
 * `cooldown` is the *absence* of the field, which is why this is a local
 * vocabulary rather than a nullable boolean: `false` and "not sent" are
 * genuinely different answers, and a tri-state boolean in a `v-model` is how
 * one silently becomes the other.
 */
const reapply = ref<'immediately' | 'cooldown' | 'never'>('cooldown')

const rejectExtra = computed(() => ({
  can_reapply:
    reapply.value === 'immediately' ? true : reapply.value === 'never' ? false : undefined,
}))

const reapplyOptions = computed(() => [
  { value: 'immediately', label: t('admin.partnerRequests.reapply.immediately') },
  { value: 'cooldown', label: t('admin.partnerRequests.reapply.cooldown') },
  { value: 'never', label: t('admin.partnerRequests.reapply.never') },
])

const statusOptions = computed(() => [
  { value: '', label: t('admin.status.pending') },
  { value: 'approved', label: t('admin.status.approved') },
  { value: 'rejected', label: t('admin.status.rejected') },
  { value: 'all', label: t('admin.status.all') },
])

const orderingOptions = computed(() => [
  { value: '-created_at', label: t('admin.ordering.newest') },
  { value: 'created_at', label: t('admin.ordering.oldest') },
  { value: '-updated_at', label: t('admin.ordering.updated') },
])

const factsFor = (row: AdminPartnerRequestRow): AdminFact[] => [
  { label: t('admin.partnerRequests.business'), value: row.business_name, strong: true },
  { label: t('admin.partnerRequests.applicant'), value: describeActor(row.user) },
  { label: t('admin.partnerRequests.email'), value: row.user?.email },
  { label: t('admin.partnerRequests.phone'), value: row.contact_phone },
  { label: t('admin.partnerRequests.telegram'), value: row.contact_telegram },
  { label: t('admin.partnerRequests.volume'), value: row.expected_monthly_events_display },
  { label: t('admin.submitted'), value: formatDateTime(row.created_at) },
  { label: t('admin.reviewedBy'), value: describeActor(row.reviewed_by) },
  { label: t('admin.reviewedAt'), value: row.reviewed_at ? formatDateTime(row.reviewed_at) : null },
  {
    label: t('admin.partnerRequests.canReapply'),
    value:
      row.status === 'rejected' ? (row.can_reapply ? t('admin.yes') : t('admin.no')) : null,
  },
]
</script>
