<template>
  <AdminQueueShell
    queue-name="listings"
    :title="t('admin.listings.title')"
    :description="t('admin.listings.description')"
    :search-placeholder="t('admin.listings.search')"
    :empty-title="t('admin.listings.emptyTitle')"
    :empty-body="t('admin.listings.emptyBody')"
    :status-options="statusOptions"
    :ordering-options="orderingOptions"
    :row-title="(row: AdminListingRow) => row.title"
    :row-eyebrow="(row: AdminListingRow) => row.vendor_name || t('admin.listings.eyebrow')"
    :approve-label="t('admin.listings.approve')"
  >
    <template #row="{ row }">
      <span
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100"
        aria-hidden="true"
      >
        <Store class="h-4 w-4 text-slate-500" />
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2">
          <span class="min-w-0 truncate text-sm font-medium text-slate-900">{{ row.title }}</span>
          <AdminStatusBadge :status="row.status" :status-display="row.status_display" />
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ row.vendor_name }}
          <template v-if="row.category_name"> · {{ row.category_name }}</template>
          · {{ formatRelative(row.created_at) }}
        </span>
      </span>
    </template>

    <template #detail="{ row }">
      <!-- The listing as a shopper would meet it: tagline first, then the body
           copy. Approving publishes exactly this. -->
      <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 class="text-base font-semibold text-slate-900">{{ row.title }}</h3>
        <p v-if="row.short_tagline" class="mt-1 text-sm text-slate-600">{{ row.short_tagline }}</p>
        <p
          v-if="row.description"
          class="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700"
        >
          {{ row.description }}
        </p>
      </div>

      <AdminFacts :facts="factsFor(row)" />
      <AdminNote :label="t('admin.internalNotes')" :note="row.admin_notes" internal />
    </template>
  </AdminQueueShell>
</template>

<script setup lang="ts">
/**
 * Vendor marketplace listings awaiting review.
 *
 * Approving publishes the listing, so the drawer renders the copy the way a
 * shopper will read it — title, tagline, description — rather than as another
 * row of the record table. What is being decided is whether *this text* goes
 * live.
 *
 * The docs give this queue a `?category=<id>` filter. It is deliberately not
 * offered: the category is a numeric id here and the queue holds tens of rows,
 * so an id-keyed select would be worse than the search box that already covers
 * the vendor and the title.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Store } from 'lucide-vue-next'
import AdminQueueShell from '@/components/admin/AdminQueueShell.vue'
import AdminStatusBadge from '@/components/admin/AdminStatusBadge.vue'
import AdminFacts from '@/components/admin/AdminFacts.vue'
import AdminNote from '@/components/admin/AdminNote.vue'
import {
  describeActor,
  formatDateTime,
  formatMoney,
  formatRelative,
  type AdminFact,
} from '@/components/admin/adminDisplay'
import type { AdminListingRow } from '@/services/api'

const { t } = useI18n()

const statusOptions = computed(() => [
  { value: '', label: t('admin.status.pendingReview') },
  { value: 'approved', label: t('admin.status.approved') },
  { value: 'rejected', label: t('admin.status.rejected') },
  { value: 'suspended', label: t('admin.status.suspended') },
  { value: 'draft', label: t('admin.status.draft') },
  { value: 'all', label: t('admin.status.all') },
])

const orderingOptions = computed(() => [
  { value: '-created_at', label: t('admin.ordering.newest') },
  { value: 'created_at', label: t('admin.ordering.oldest') },
  { value: 'title', label: t('admin.ordering.title') },
  { value: '-updated_at', label: t('admin.ordering.updated') },
])

/**
 * A listing prices itself in one of two ways — a range, or a free-text line
 * like "from $200/day" — and `price_display_text` is the vendor's own words
 * when they used them. Show that, and fall back to the range.
 */
const priceLabel = (row: AdminListingRow): string | null => {
  if (row.price_display_text?.trim()) return row.price_display_text
  if (row.price_min && row.price_max) {
    return `${formatMoney(row.price_min, row.currency)} – ${formatMoney(row.price_max, row.currency)}`
  }
  if (row.price_min) return formatMoney(row.price_min, row.currency)
  return null
}

const factsFor = (row: AdminListingRow): AdminFact[] => [
  { label: t('admin.listings.vendor'), value: row.vendor_name, strong: true },
  { label: t('admin.listings.vendorUser'), value: describeActor(row.vendor_user) },
  { label: t('admin.listings.category'), value: row.category_name },
  { label: t('admin.listings.price'), value: priceLabel(row) },
  { label: t('admin.listings.serviceArea'), value: row.service_area },
  { label: t('admin.listings.slug'), value: row.slug },
  { label: t('admin.submitted'), value: formatDateTime(row.created_at) },
  { label: t('admin.reviewedBy'), value: describeActor(row.reviewed_by) },
  { label: t('admin.reviewedAt'), value: row.reviewed_at ? formatDateTime(row.reviewed_at) : null },
]
</script>
