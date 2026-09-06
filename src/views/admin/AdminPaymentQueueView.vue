<template>
  <AdminQueueShell
    queue-name="payments"
    :title="t('admin.payments.title')"
    :description="t('admin.payments.description')"
    :search-placeholder="t('admin.payments.search')"
    :empty-title="t('admin.payments.emptyTitle')"
    :empty-body="t('admin.payments.emptyBody')"
    :status-options="statusOptions"
    :ordering-options="orderingOptions"
    :extra-params="extraParams"
    :row-title="(row: AdminPaymentRow) => formatMoney(row.amount, row.currency)"
    :row-eyebrow="(row: AdminPaymentRow) => row.payment_reference"
    :approve-label="t('admin.payments.approve')"
  >
    <template #filters>
      <div class="relative">
        <select
          v-model="currency"
          class="appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          :aria-label="t('admin.payments.currencyFilter')"
        >
          <option value="">{{ t('admin.payments.currencies.any') }}</option>
          <option value="USD">USD</option>
          <option value="KHR">KHR</option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </template>

    <template #row="{ row }">
      <span
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
        :class="row.payment_proof ? 'bg-slate-100' : 'bg-amber-50'"
        :title="row.payment_proof ? undefined : t('admin.payments.noProof')"
      >
        <component
          :is="row.payment_proof ? ReceiptText : TriangleAlert"
          class="h-4 w-4"
          :class="row.payment_proof ? 'text-slate-500' : 'text-amber-600'"
          aria-hidden="true"
        />
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2">
          <span class="flex-shrink-0 text-sm font-semibold tabular-nums text-slate-900">
            {{ formatMoney(row.amount, row.currency) }}
          </span>
          <span class="min-w-0 truncate text-sm text-slate-600">{{ row.event_title }}</span>
          <AdminStatusBadge :status="row.status" :status-display="row.status_display" />
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ row.payment_reference }}
          <template v-if="row.pricing_plan_name"> · {{ row.pricing_plan_name }}</template>
          · {{ formatRelative(row.created_at) }}
        </span>
      </span>
    </template>

    <template #detail="{ row }">
      <!-- The proof beside the amount and the reference *is* the job, so it is
           first and it is big. A thumbnail here would mean opening a new tab to
           read a bank slip, on every single decision. -->
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <AdminImage
          :src="row.payment_proof"
          :alt="t('admin.payments.proofAlt', { reference: row.payment_reference })"
          img-class="mx-auto max-h-[26rem] w-auto"
          eager
        >
          <template #fallback>
            <div class="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <TriangleAlert class="h-6 w-6 text-amber-500" aria-hidden="true" />
              <p class="text-sm text-slate-600">{{ t('admin.payments.noProofBody') }}</p>
            </div>
          </template>
        </AdminImage>
      </div>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <a
          v-if="resolveMediaUrl(row.payment_proof)"
          :href="resolveMediaUrl(row.payment_proof)"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e90ff] hover:underline"
        >
          <ExternalLink class="h-4 w-4" aria-hidden="true" />
          {{ t('admin.payments.openProof') }}
        </a>
        <!-- A new tab, not a `RouterLink`: navigating in place would unmount
             the drawer and lose the queue position the reviewer is working. -->
        <a
          v-if="row.event_id"
          :href="`/events/${row.event_id}`"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e90ff] hover:underline"
        >
          <ExternalLink class="h-4 w-4" aria-hidden="true" />
          {{ t('admin.payments.openEvent') }}
        </a>
      </div>

      <!-- Confirming cascades: it creates the commission, enables the event's
           template and records promo usage. None of that needs a second call,
           and none of it is reversible from here. -->
      <div class="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
        <TriangleAlert class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1e90ff]" aria-hidden="true" />
        <p class="text-sm text-slate-700">{{ t('admin.payments.cascade') }}</p>
      </div>

      <AdminFacts :facts="factsFor(row)" />
      <AdminNote :label="t('admin.payments.payerNotes')" :note="row.user_notes" />
      <AdminNote :label="t('admin.internalNotes')" :note="row.admin_notes" internal />
    </template>
  </AdminQueueShell>
</template>

<script setup lang="ts">
/**
 * Template activation payments awaiting confirmation.
 *
 * **The proof image next to the amount and the reference is the entire job**,
 * so the drawer is built around it at a readable size rather than around the
 * record table. A payment with no proof attached is flagged on the row as well,
 * because that is a decision an admin can make without opening anything.
 *
 * Approving here *confirms*, and confirmation cascades — `confirmed_at`, the
 * commission, the event's template, promo usage. The drawer says so.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, ExternalLink, ReceiptText, TriangleAlert } from 'lucide-vue-next'
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
  parseMoney,
  type AdminFact,
} from '@/components/admin/adminDisplay'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import type { AdminPaymentRow } from '@/services/api'

const { t } = useI18n()

const currency = ref('')
const extraParams = computed(() => ({ currency: currency.value || undefined }))

const statusOptions = computed(() => [
  { value: '', label: t('admin.status.pending') },
  { value: 'confirmed', label: t('admin.status.confirmed') },
  { value: 'rejected', label: t('admin.status.rejected') },
  { value: 'cancelled', label: t('admin.status.cancelled') },
  { value: 'all', label: t('admin.status.all') },
])

const orderingOptions = computed(() => [
  { value: '-created_at', label: t('admin.ordering.newest') },
  { value: 'created_at', label: t('admin.ordering.oldest') },
  { value: '-amount', label: t('admin.ordering.amountDesc') },
  { value: 'amount', label: t('admin.ordering.amountAsc') },
])

/** Only worth a row when something was actually taken off the list price. */
const discountLabel = (row: AdminPaymentRow): string | null => {
  const total = parseMoney(row.discount_amount) + parseMoney(row.promo_discount)
  return total > 0 ? formatMoney(total, row.currency) : null
}

const factsFor = (row: AdminPaymentRow): AdminFact[] => [
  { label: t('admin.payments.amount'), value: formatMoney(row.amount, row.currency), strong: true },
  { label: t('admin.payments.reference'), value: row.payment_reference, strong: true },
  { label: t('admin.payments.transactionRef'), value: row.transaction_reference },
  {
    label: t('admin.payments.listPrice'),
    value: row.original_price ? formatMoney(row.original_price, row.currency) : null,
  },
  { label: t('admin.payments.discount'), value: discountLabel(row) },
  { label: t('admin.payments.method'), value: row.payment_method_name },
  { label: t('admin.payments.payer'), value: describeActor(row.user) },
  { label: t('admin.payments.event'), value: row.event_title },
  { label: t('admin.payments.template'), value: row.template_name },
  { label: t('admin.payments.plan'), value: row.pricing_plan_name },
  {
    label: t('admin.payments.upgrade'),
    value: row.is_upgrade ? t('admin.yes') : null,
  },
  { label: t('admin.submitted'), value: formatDateTime(row.created_at) },
  { label: t('admin.payments.confirmedBy'), value: describeActor(row.confirmed_by) },
  {
    label: t('admin.payments.confirmedAt'),
    value: row.confirmed_at ? formatDateTime(row.confirmed_at) : null,
  },
]
</script>
