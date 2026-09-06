<template>
  <AdminQueueShell
    queue-name="commissions"
    :title="t('admin.commissions.title')"
    :description="t('admin.commissions.description')"
    :search-placeholder="t('admin.commissions.search')"
    :empty-title="t('admin.commissions.emptyTitle')"
    :empty-body="t('admin.commissions.emptyBody')"
    :status-options="statusOptions"
    :ordering-options="orderingOptions"
    default-ordering="-requested_at"
    :row-title="(row: AdminCommissionRow) => formatMoney(row.commission_amount)"
    :row-eyebrow="(row: AdminCommissionRow) => row.commission_reference"
    :approve-label="t('admin.commissions.approve')"
  >
    <template #row="{ row }">
      <span
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100"
        aria-hidden="true"
      >
        <Percent class="h-4 w-4 text-slate-500" />
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2">
          <span class="flex-shrink-0 text-sm font-semibold tabular-nums text-slate-900">
            {{ formatMoney(row.commission_amount) }}
          </span>
          <span class="min-w-0 truncate text-sm text-slate-600">
            {{ describeActor(row.referrer) ?? row.event_title }}
          </span>
          <AdminStatusBadge :status="row.status" :status-display="row.status_display" />
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ row.commission_reference }}
          · {{ t('admin.commissions.requestedRelative', { when: formatRelative(row.requested_at ?? row.created_at) }) }}
        </span>
      </span>
    </template>

    <template #detail="{ row }">
      <!-- The claim in one line: what was paid, the rate, what is owed. Three
           numbers that have to agree, so they sit together rather than three
           rows apart in the record list. -->
      <div class="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
        <div class="bg-white p-3 text-center">
          <p class="text-xs text-slate-500">{{ t('admin.commissions.paymentAmount') }}</p>
          <p class="mt-1 text-sm font-semibold tabular-nums text-slate-900">
            {{ formatMoney(row.payment_amount) }}
          </p>
        </div>
        <div class="bg-white p-3 text-center">
          <p class="text-xs text-slate-500">{{ t('admin.commissions.rate') }}</p>
          <p class="mt-1 text-sm font-semibold tabular-nums text-slate-900">
            {{ ratePercent(row.commission_rate) }}
          </p>
        </div>
        <div class="bg-white p-3 text-center">
          <p class="text-xs text-slate-500">{{ t('admin.commissions.payout') }}</p>
          <p class="mt-1 text-sm font-semibold tabular-nums text-slate-900">
            {{ formatMoney(row.commission_amount) }}
          </p>
        </div>
      </div>

      <AdminFacts :facts="factsFor(row)" />
      <AdminNote :label="t('admin.commissions.requestNotes')" :note="row.requested_notes" />
      <AdminNote :label="t('admin.commissions.rejectionReason')" :note="row.rejection_reason" />
      <AdminNote :label="t('admin.internalNotes')" :note="row.admin_notes" internal />
    </template>
  </AdminQueueShell>
</template>

<script setup lang="ts">
/**
 * Referrer payout claims.
 *
 * **This queue opens on `requested`, not `pending`** — a pending commission is
 * one the referrer has not asked to be paid out yet, so there is nothing to
 * decide about it. It is still reachable from the status filter, where it reads
 * as "not claimed yet" rather than as work.
 *
 * The commission system itself was retired in August 2026 and the frontend's
 * partner-facing side of it went with it; this queue exists because the
 * historical claims do, and because `payments`' confirm still creates a
 * commission row. Do not read it as a live product surface.
 *
 * `reject` records the note as `rejection_reason`, which is why a rejected row
 * shows that field back rather than only the internal notes.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Percent } from 'lucide-vue-next'
import AdminQueueShell from '@/components/admin/AdminQueueShell.vue'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge.vue'
import AdminFacts from '@/components/admin/AdminFacts.vue'
import AdminNote from '@/components/admin/AdminNote.vue'
import {
  describeActor,
  formatDateTime,
  formatMoney,
  formatRelative,
  parseMoney,
  type AdminFact,
} from '@/components/admin/adminDisplay'
import type { AdminCommissionRow } from '@/services/api'

const { t } = useI18n()

const statusOptions = computed(() => [
  { value: '', label: t('admin.status.requested') },
  { value: 'pending', label: t('admin.status.notClaimed') },
  { value: 'approved', label: t('admin.status.approved') },
  { value: 'rejected', label: t('admin.status.rejected') },
  { value: 'all', label: t('admin.status.all') },
])

const orderingOptions = computed(() => [
  { value: '-requested_at', label: t('admin.commissions.orderingRequested') },
  { value: '-created_at', label: t('admin.ordering.newest') },
  { value: '-commission_amount', label: t('admin.ordering.amountDesc') },
  { value: 'commission_amount', label: t('admin.ordering.amountAsc') },
])

/**
 * The rate is a `Decimal` string, and the backend may express it either as a
 * fraction (`0.10`) or as whole percent (`10.00`). Anything at or below 1 is
 * read as a fraction — no commission scheme pays 1% and none pays 1000%, so the
 * boundary is unambiguous in practice.
 */
const ratePercent = (rate: string): string => {
  const value = parseMoney(rate)
  const percent = value <= 1 ? value * 100 : value
  return `${percent.toFixed(percent % 1 === 0 ? 0 : 2)}%`
}

const factsFor = (row: AdminCommissionRow): AdminFact[] => [
  { label: t('admin.commissions.reference'), value: row.commission_reference, strong: true },
  { label: t('admin.commissions.referrer'), value: describeActor(row.referrer), strong: true },
  { label: t('admin.commissions.event'), value: row.event_title },
  {
    label: t('admin.commissions.requestedAt'),
    value: row.requested_at ? formatDateTime(row.requested_at) : null,
  },
  {
    label: t('admin.commissions.claimedAt'),
    value: row.claimed_at ? formatDateTime(row.claimed_at) : null,
  },
  {
    label: t('admin.commissions.rejectedAt'),
    value: row.rejected_at ? formatDateTime(row.rejected_at) : null,
  },
  { label: t('admin.commissions.processedBy'), value: describeActor(row.processed_by) },
  { label: t('admin.submitted'), value: formatDateTime(row.created_at) },
]
</script>
