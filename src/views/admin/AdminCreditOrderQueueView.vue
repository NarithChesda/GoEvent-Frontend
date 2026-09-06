<template>
  <AdminQueueShell
    queue-name="credit-orders"
    :title="t('admin.creditOrders.title')"
    :description="t('admin.creditOrders.description')"
    :search-placeholder="t('admin.creditOrders.search')"
    :empty-title="t('admin.creditOrders.emptyTitle')"
    :empty-body="t('admin.creditOrders.emptyBody')"
    :status-options="statusOptions"
    :ordering-options="orderingOptions"
    :extra-params="extraParams"
    :row-title="(row: AdminCreditOrderRow) => row.order_reference"
    :row-eyebrow="() => t('admin.creditOrders.eyebrow')"
    :approve-label="t('admin.creditOrders.approve')"
    :hold-result="() => true"
  >
    <template #filters>
      <div class="relative">
        <select
          v-model="scope"
          class="appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          :aria-label="t('admin.creditOrders.scopeFilter')"
        >
          <option value="">{{ t('admin.creditOrders.scopes.any_filter') }}</option>
          <option value="any">{{ t('admin.creditOrders.scopes.any') }}</option>
          <option value="own_partner">{{ t('admin.creditOrders.scopes.own_partner') }}</option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </template>

    <template #row="{ row }">
      <span
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100"
        aria-hidden="true"
      >
        <Coins class="h-4 w-4 text-slate-500" />
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2">
          <span class="flex-shrink-0 text-sm font-semibold tabular-nums text-slate-900">
            {{ formatMoney(row.amount, row.currency) }}
          </span>
          <span class="flex-shrink-0 text-sm text-slate-600">
            {{ t('admin.creditOrders.credits', { count: row.credit_count }) }}
          </span>
          <AdminStatusBadge :status="row.status" :status-display="row.status_display" />
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ row.order_reference }}
          <template v-if="describeActor(row.partner)"> · {{ describeActor(row.partner) }}</template>
          · {{ formatRelative(row.created_at) }}
        </span>
      </span>
    </template>

    <template #detail="{ row }">
      <!-- No fallback block here, unlike payments: an order with no proof is a
           normal wholesale flow rather than a red flag, so its absence is
           simply nothing on the screen. -->
      <div
        v-if="row.payment_proof"
        class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
      >
        <AdminImage
          :src="row.payment_proof"
          :alt="t('admin.creditOrders.proofAlt', { reference: row.order_reference })"
          img-class="mx-auto max-h-[24rem] w-auto"
          eager
        />
      </div>

      <!-- Approving mints a code and is not idempotent. Said before the press,
           because the safeguard against a second one is a 409, and a 409 is not
           a thing an admin should have to see to understand this. -->
      <div class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <TriangleAlert class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
        <p class="text-sm text-slate-700">{{ t('admin.creditOrders.mints') }}</p>
      </div>

      <!-- A narrowed pack is worth its own line: it is redeemable only on the
           partner's own approved designs, which is why it was sold cheaper. -->
      <div
        v-if="row.template_scope === 'own_partner'"
        class="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3"
      >
        <Ban class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1e90ff]" aria-hidden="true" />
        <p class="text-sm text-slate-700">{{ t('admin.creditOrders.ownPartnerScope') }}</p>
      </div>

      <AdminFacts :facts="factsFor(row)" />
      <AdminNote :label="t('admin.internalNotes')" :note="row.admin_notes" internal />
    </template>

    <!-- The only queue with a post-decision panel. The minted code exists
         nowhere else in this UI, and the partner will ask for it. -->
    <template #result="{ item }">
      <div v-if="item.issued_code" class="rounded-2xl border border-slate-200 bg-white p-4">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {{ t('admin.creditOrders.issuedCode') }}
        </p>
        <div class="mt-2 flex items-center gap-2">
          <code
            class="min-w-0 flex-1 select-all break-all rounded-lg bg-slate-900 px-3 py-2.5 font-mono text-base font-semibold tracking-wide text-white"
          >
            {{ item.issued_code }}
          </code>
          <button
            type="button"
            class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors duration-200 hover:bg-slate-100"
            :title="copied ? t('admin.creditOrders.copied') : t('common.actions.copy')"
            :aria-label="copied ? t('admin.creditOrders.copied') : t('common.actions.copy')"
            @click="copyCode(item.issued_code)"
          >
            <Check v-if="copied" class="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <Copy v-else class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p class="mt-2 text-xs text-slate-500">
          {{ t('admin.creditOrders.issuedHint', { count: item.credit_count }) }}
        </p>
      </div>
    </template>
  </AdminQueueShell>
</template>

<script setup lang="ts">
/**
 * Partner wholesale credit purchases.
 *
 * **The one queue whose drawer stays open after a decision.** Approving mints a
 * credit code, and that code is in the response and nowhere else this UI can
 * reach — closing on success would lose it. So `hold-result` is on, the code is
 * rendered at a size it can be read aloud from, and there is a copy button
 * beside it.
 *
 * Minting is **not idempotent**: a second confirm answers `409` rather than
 * issuing a second code, which is exactly why nothing here ever retries a
 * failed approve. The warning is on screen before the press, not only after it.
 *
 * `template_scope` is called out when it is `own_partner`, because that pack was
 * sold at a bring-your-own-design rate and its code is refused on anything but
 * the partner's own approved templates. Absent means `any` — the DB default and
 * what every credit sold before the field existed was — and is not labelled,
 * since an unrestricted credit is the normal case.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Ban, Check, ChevronDown, Coins, Copy, TriangleAlert } from 'lucide-vue-next'
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
import { useToast } from '@/composables/useToast'
import type { AdminCreditOrderRow } from '@/services/api'

const { t } = useI18n()
const { showError } = useToast()

const scope = ref('')
const extraParams = computed(() => ({ template_scope: scope.value || undefined }))

const copied = ref(false)

/**
 * The control answers for itself rather than firing a toast — the result is a
 * tick on the button the admin just pressed, which is where they are looking.
 */
const copyCode = async (code: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    // A failure has nowhere to show itself on a control that only says "done".
    showError(t('admin.creditOrders.copyFailed'))
  }
}

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
])

const factsFor = (row: AdminCreditOrderRow): AdminFact[] => [
  { label: t('admin.creditOrders.reference'), value: row.order_reference, strong: true },
  {
    label: t('admin.creditOrders.amount'),
    value: formatMoney(row.amount, row.currency),
    strong: true,
  },
  { label: t('admin.creditOrders.creditCount'), value: row.credit_count },
  { label: t('admin.creditOrders.pack'), value: row.pack_name },
  { label: t('admin.creditOrders.partner'), value: describeActor(row.partner) },
  { label: t('admin.payments.transactionRef'), value: row.transaction_reference },
  {
    label: t('admin.creditOrders.scope'),
    value:
      row.template_scope === 'own_partner' ? t('admin.creditOrders.scopes.own_partner') : null,
  },
  { label: t('admin.creditOrders.issuedCode'), value: row.issued_code },
  { label: t('admin.submitted'), value: formatDateTime(row.created_at) },
  { label: t('admin.reviewedBy'), value: describeActor(row.reviewed_by) },
  { label: t('admin.reviewedAt'), value: row.reviewed_at ? formatDateTime(row.reviewed_at) : null },
]
</script>
