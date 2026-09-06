<template>
  <AdminCatalogueShell
    :catalogue="codes"
    :title="t('admin.promoCodes.title')"
    :description="t('admin.promoCodes.description')"
    :add-label="t('admin.promoCodes.add')"
    :search-placeholder="t('admin.promoCodes.search')"
    :empty-title="t('admin.promoCodes.emptyTitle')"
    :empty-body="t('admin.promoCodes.emptyBody')"
    :status-options="activeOptions"
    :ordering-options="orderingOptions"
    :extra-filtered="Boolean(kind)"
    @create="openCreate"
    @edit="openEdit"
  >
    <template #filters>
      <!-- The one filter that changes what the list *is*. A marketing code and
           a partner's prepaid balance are different objects wearing the same
           shape, and staff arrive looking for one or the other. -->
      <div class="relative">
        <select
          v-model="kind"
          class="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          :aria-label="t('admin.promoCodes.kindFilter')"
        >
          <option value="">{{ t('admin.promoCodes.kinds.all') }}</option>
          <option value="marketing">{{ t('admin.promoCodes.kinds.marketing') }}</option>
          <option value="partner_credit">{{ t('admin.promoCodes.kinds.partner_credit') }}</option>
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
        :class="row.kind === 'partner_credit' ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-500'"
        aria-hidden="true"
      >
        <Coins v-if="row.kind === 'partner_credit'" class="h-4 w-4" />
        <TicketPercent v-else class="h-4 w-4" />
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex flex-wrap items-center gap-2">
          <!-- The code, in mono, first. It is what appears in a support
               conversation; `name` is internal and is the second line. -->
          <code
            class="flex-shrink-0 font-mono text-sm font-semibold tracking-wide"
            :class="row.is_active ? 'text-slate-900' : 'text-slate-400 line-through'"
          >
            {{ row.code }}
          </code>
          <span class="flex-shrink-0 text-sm text-slate-600 tabular-nums">
            {{ discountLabel(row) }}
          </span>
          <span
            v-if="row.kind === 'partner_credit'"
            class="flex-shrink-0 rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-sky-700"
          >
            {{ t('admin.promoCodes.kinds.partner_credit') }}
          </span>
          <span
            v-if="row.template_scope === 'own_partner'"
            class="flex-shrink-0 rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600"
          >
            {{ t('admin.promoCodes.ownDesigns') }}
          </span>
          <!-- One state chip, not four. Expired, not-yet-valid, used up and
               retired are mutually exclusive in practice and a row carrying
               several of them says nothing louder than the first. -->
          <span
            v-if="stateChip(row)"
            class="flex-shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase"
            :class="stateChip(row)!.class"
          >
            {{ stateChip(row)!.label }}
          </span>
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ row.name }}
          · {{ usesLabel(row) }}
          <template v-if="row.owner_partner_detail">
            · {{ row.owner_partner_detail.email }}
          </template>
          <template v-else-if="!row.applicable_plans.length">
            · {{ t('admin.promoCodes.allPlans') }}
          </template>
        </span>
      </span>
    </template>
  </AdminCatalogueShell>

  <AdminFormDrawer
    :open="drawerOpen"
    :title="editing ? editing.code : t('admin.promoCodes.createTitle')"
    :eyebrow="editing ? form.name || t('admin.promoCodes.eyebrow') : t('admin.promoCodes.eyebrow')"
    :editing="Boolean(editing)"
    :deletable="deletable"
    :delete-warning="t('admin.promoCodes.deleteWarning')"
    :busy="codes.saving.value"
    :form-error="formError"
    @close="drawerOpen = false"
    @submit="save"
    @delete="confirmDelete = true"
  >
    <!-- A code minted by a credit pack order is money somebody already paid.
         Two of its fields are locked server-side; saying so before they are
         reached beats a 400 that names a field the form let them edit. -->
    <div
      v-if="editing?.credit_order_reference"
      class="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3"
    >
      <Lock class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1e90ff]" aria-hidden="true" />
      <p class="text-sm text-slate-700">
        {{ t('admin.promoCodes.issuedByOrder', { reference: editing.credit_order_reference }) }}
      </p>
    </div>

    <div>
      <label for="promoCode" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.promoCodes.code') }}
      </label>
      <input
        id="promoCode"
        v-model="form.code"
        type="text"
        maxlength="50"
        autocapitalize="characters"
        spellcheck="false"
        :placeholder="editing ? '' : t('admin.promoCodes.codePlaceholder')"
        class="w-full rounded-lg border bg-white px-3.5 py-2.5 font-mono text-base uppercase tracking-wide focus:outline-none focus:ring-2 sm:text-sm"
        :class="inputClass('code')"
      />
      <p class="mt-1 text-xs text-slate-500">{{ t('admin.promoCodes.codeHint') }}</p>
      <p v-if="errorFor('code')" class="mt-1 text-xs text-red-600">{{ errorFor('code') }}</p>
    </div>

    <div>
      <label for="promoName" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.promoCodes.name') }} *
      </label>
      <input
        id="promoName"
        v-model="form.name"
        type="text"
        maxlength="100"
        class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
        :class="inputClass('name')"
      />
      <p class="mt-1 text-xs text-slate-500">{{ t('admin.promoCodes.nameHint') }}</p>
      <p v-if="errorFor('name')" class="mt-1 text-xs text-red-600">{{ errorFor('name') }}</p>
    </div>

    <div>
      <label for="promoDescription" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.promoCodes.descriptionLabel') }}
      </label>
      <textarea
        id="promoDescription"
        v-model="form.description"
        rows="2"
        maxlength="500"
        class="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
      ></textarea>
    </div>

    <!-- Kind decides what half of this form means, so it comes before the
         fields it governs. Locked on an issued credit code: changing it would
         drop the account lock on credits the partner paid for. -->
    <fieldset>
      <legend id="promoKindLabel" class="mb-2 text-sm font-medium text-slate-700">
        {{ t('admin.promoCodes.kind') }}
      </legend>
      <div
        class="list-group"
        role="radiogroup"
        aria-labelledby="promoKindLabel"
        :class="lockedByOrder ? 'opacity-60' : ''"
      >
        <button
          v-for="option in KINDS"
          :key="option"
          type="button"
          role="radio"
          :aria-checked="form.kind === option"
          :disabled="lockedByOrder"
          class="list-row disabled:cursor-not-allowed"
          @click="form.kind = option"
        >
          <span
            class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200"
            :class="form.kind === option ? 'border-sky-500' : 'border-slate-300'"
            aria-hidden="true"
          >
            <span v-if="form.kind === option" class="h-2.5 w-2.5 rounded-full bg-sky-500" />
          </span>
          <span class="list-row__text min-w-0 flex-1">
            <span class="list-row__label">{{ t(`admin.promoCodes.kindOptions.${option}.label`) }}</span>
            <span class="list-row__hint">{{ t(`admin.promoCodes.kindOptions.${option}.hint`) }}</span>
          </span>
        </button>
      </div>
      <p v-if="errorFor('kind')" class="mt-1 text-xs text-red-600">{{ errorFor('kind') }}</p>
    </fieldset>

    <AdminPartnerPicker
      v-if="form.kind === 'partner_credit'"
      v-model="form.owner_partner"
      v-model:selected="ownerRow"
      :label="t('admin.promoCodes.owner')"
      required
      :disabled="lockedByOrder"
      :hint="t('admin.promoCodes.ownerHint')"
      :error-text="errorFor('owner_partner')"
    />

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label for="promoDiscountType" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.promoCodes.discountType') }}
        </label>
        <div class="relative">
          <select
            id="promoDiscountType"
            v-model="form.discount_type"
            class="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
          >
            <option value="percentage">{{ t('admin.discountTypes.percentage') }}</option>
            <option value="fixed">{{ t('admin.discountTypes.fixed') }}</option>
          </select>
          <ChevronDown
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
      </div>

      <div>
        <label for="promoDiscountValue" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.promoCodes.discountValue') }} *
        </label>
        <input
          id="promoDiscountValue"
          v-model="form.discount_value"
          type="text"
          inputmode="decimal"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base tabular-nums focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('discount_value')"
        />
        <p v-if="errorFor('discount_value')" class="mt-1 text-xs text-red-600">
          {{ errorFor('discount_value') }}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div v-if="form.discount_type === 'percentage'">
        <label for="promoMaxDiscount" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.promoCodes.maxDiscount') }}
        </label>
        <input
          id="promoMaxDiscount"
          v-model="form.max_discount_amount"
          type="text"
          inputmode="decimal"
          :placeholder="t('admin.promoCodes.noCap')"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base tabular-nums focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('max_discount_amount')"
        />
      </div>

      <div>
        <label for="promoMinPurchase" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.promoCodes.minimumPurchase') }}
        </label>
        <input
          id="promoMinPurchase"
          v-model="form.minimum_purchase_amount"
          type="text"
          inputmode="decimal"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base tabular-nums focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('minimum_purchase_amount')"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label for="promoMaxUses" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.promoCodes.maxTotalUses') }}
        </label>
        <input
          id="promoMaxUses"
          v-model="form.max_total_uses"
          type="number"
          min="1"
          step="1"
          :placeholder="t('admin.promoCodes.unlimited')"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base tabular-nums focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('max_total_uses')"
        />
        <!-- On a credit code this field is the balance itself: it is the credits
             the partner bought, and lowering it takes them away. -->
        <p v-if="form.kind === 'partner_credit'" class="mt-1 text-xs text-amber-700">
          {{ t('admin.promoCodes.maxUsesCreditHint') }}
        </p>
      </div>

      <div>
        <label for="promoPerUser" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.promoCodes.maxUsesPerUser') }}
        </label>
        <input
          id="promoPerUser"
          v-model="form.max_uses_per_user"
          type="number"
          min="1"
          step="1"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base tabular-nums focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('max_uses_per_user')"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label for="promoValidFrom" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.promoCodes.validFrom') }}
        </label>
        <input
          id="promoValidFrom"
          v-model="form.valid_from"
          type="datetime-local"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('valid_from')"
        />
      </div>

      <div>
        <label for="promoValidUntil" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.promoCodes.validUntil') }}
        </label>
        <input
          id="promoValidUntil"
          v-model="form.valid_until"
          type="datetime-local"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('valid_until')"
        />
        <p class="mt-1 text-xs text-slate-500">{{ t('admin.promoCodes.validUntilHint') }}</p>
        <p v-if="errorFor('valid_until')" class="mt-1 text-xs text-red-600">
          {{ errorFor('valid_until') }}
        </p>
      </div>
    </div>

    <AdminPlanPicker
      v-model="form.applicable_plans"
      :plans="planList.plans.value"
      :loading="planList.loading.value"
      :error="planList.error.value"
      :label="t('admin.promoCodes.plans')"
      :required="form.kind === 'partner_credit'"
      :hint="form.kind === 'partner_credit'
        ? t('admin.promoCodes.plansCreditHint')
        : t('admin.promoCodes.plansMarketingHint')"
      :error-text="errorFor('applicable_plans')"
    />

    <fieldset>
      <legend id="promoScopeLabel" class="mb-2 text-sm font-medium text-slate-700">
        {{ t('admin.promoCodes.scope') }}
      </legend>
      <div class="list-group" role="radiogroup" aria-labelledby="promoScopeLabel">
        <button
          v-for="option in SCOPES"
          :key="option"
          type="button"
          role="radio"
          :aria-checked="form.template_scope === option"
          class="list-row"
          @click="form.template_scope = option"
        >
          <span
            class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200"
            :class="form.template_scope === option ? 'border-sky-500' : 'border-slate-300'"
            aria-hidden="true"
          >
            <span v-if="form.template_scope === option" class="h-2.5 w-2.5 rounded-full bg-sky-500" />
          </span>
          <span class="list-row__text min-w-0 flex-1">
            <span class="list-row__label">{{ t(`admin.promoCodes.scopeOptions.${option}.label`) }}</span>
            <span class="list-row__hint">{{ t(`admin.promoCodes.scopeOptions.${option}.hint`) }}</span>
          </span>
        </button>
      </div>
    </fieldset>

    <div class="list-group">
      <button
        type="button"
        role="switch"
        :aria-checked="form.is_active"
        class="list-row"
        @click="form.is_active = !form.is_active"
      >
        <span class="list-row__text">
          <span class="list-row__label">{{ t('admin.catalogue.active') }}</span>
          <span class="list-row__hint">{{ t('admin.promoCodes.activeHint') }}</span>
        </span>
        <span aria-hidden="true" class="switch-track" :class="form.is_active ? 'is-on' : ''">
          <span class="switch-knob" />
        </span>
      </button>
      <button
        type="button"
        role="switch"
        :aria-checked="form.first_purchase_only"
        class="list-row"
        @click="form.first_purchase_only = !form.first_purchase_only"
      >
        <span class="list-row__text">
          <span class="list-row__label">{{ t('admin.promoCodes.firstPurchaseOnly') }}</span>
          <span class="list-row__hint">{{ t('admin.promoCodes.firstPurchaseHint') }}</span>
        </span>
        <span aria-hidden="true" class="switch-track" :class="form.first_purchase_only ? 'is-on' : ''">
          <span class="switch-knob" />
        </span>
      </button>
    </div>

    <!--
      Redemptions. Loaded on demand rather than with the drawer: most codes have
      none, and the question this answers — did the code leak, and where did it
      go — is one somebody asks deliberately.
    -->
    <div v-if="editing && editing.current_total_uses > 0" class="border-t border-slate-200 pt-4">
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {{ t('admin.promoCodes.redemptions') }}
        </p>
        <button
          v-if="!usagesOpen"
          type="button"
          class="text-xs font-medium text-[#1e90ff] transition-colors duration-200 hover:text-sky-700 focus:outline-none focus-visible:underline"
          @click="openUsages"
        >
          {{ t('admin.promoCodes.showRedemptions', { count: editing.current_total_uses }) }}
        </button>
      </div>

      <template v-if="usagesOpen">
        <div v-if="usagesLoading" class="mt-2 space-y-2">
          <div v-for="n in 3" :key="n" class="h-12 animate-pulse rounded-xl bg-slate-100" />
        </div>
        <p
          v-else-if="usagesError"
          class="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {{ usagesError }}
        </p>
        <ul
          v-else
          class="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200"
        >
          <li v-for="usage in usages" :key="usage.id" class="px-3 py-2.5">
            <p class="flex items-center justify-between gap-3 text-sm text-slate-700">
              <span class="min-w-0 truncate">
                {{ usage.user?.email ?? t('admin.unknownAuthor') }}
              </span>
              <span class="flex-shrink-0 font-semibold tabular-nums">
                −{{ formatMoney(usage.discount_applied) }}
              </span>
            </p>
            <p class="mt-0.5 truncate text-xs text-slate-500">
              <!-- Exactly one of the two references is populated; a database
                   constraint guarantees it. -->
              <template v-if="usage.payment_reference">{{ usage.payment_reference }} · </template>
              <template v-else-if="usage.ticket_order_reference">
                {{ usage.ticket_order_reference }} ·
              </template>
              {{ formatDateTime(usage.created_at) }}
            </p>
          </li>
        </ul>
        <p v-if="usagesTruncated" class="mt-1.5 text-xs text-slate-500">
          {{ t('admin.promoCodes.redemptionsTruncated', { shown: usages.length, total: usagesCount }) }}
        </p>
      </template>
    </div>

    <!-- Both refused deletes, explained where the delete control would be. The
         server answers 400 for either, so a button here would only ever
         produce an error. -->
    <div v-if="editing && !deletable" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {{ t('admin.catalogue.dangerTitle') }}
      </p>
      <p class="mt-1.5 text-sm text-slate-600">
        {{
          editing.credit_order_reference
            ? t('admin.promoCodes.deleteBlockedIssued')
            : t('admin.promoCodes.deleteBlockedRedeemed', { count: editing.current_total_uses })
        }}
      </p>
    </div>
  </AdminFormDrawer>

  <DeleteConfirmModal
    :show="confirmDelete"
    :title="t('admin.promoCodes.deleteTitle')"
    :item-name="editing?.code"
    :message="t('admin.promoCodes.deleteWarning')"
    :loading="codes.saving.value"
    @cancel="confirmDelete = false"
    @confirm="doDelete"
  />
</template>

<script setup lang="ts">
/**
 * Every promo code on the platform — public discounts and the account-locked
 * codes minted by credit pack purchases, in one list.
 *
 * **The `kind` is the whole screen.** `/api/payment/promo-codes/` predates
 * partner credits and shows only the marketing fields, so a code that reads as
 * an unremarkable discount there can be somebody's paid-for balance. Here
 * `kind`, `owner_partner` and `credit_order_reference` are on the row, in the
 * filter and at the top of the form, because every rule below follows from
 * which of the two a code is:
 *
 * - **A credit code needs an owner and needs plans.** With no owner, anyone
 *   holding the string can spend it; with no plans, an empty list means *every*
 *   plan and the credit unlocks the most expensive template on the platform.
 *   Both are a server `400` and both are checked here, so the message names the
 *   consequence rather than the field.
 * - **A code issued by an order has two locked fields.** `kind` and
 *   `owner_partner` cannot move on it — those credits were bought by that
 *   partner — so the controls are disabled and the reason is stated above them,
 *   rather than letting the form offer an edit the server will refuse.
 * - **Two deletes are refused outright**, unlike every other catalogue here
 *   where a delete quietly orphans content. A redeemed code owns its usage rows
 *   through a cascade, and an issued credit code cannot be re-minted. In both
 *   cases the delete control is *absent* and the sentence in its place offers
 *   the answer staff actually wanted, which is `is_active: false`.
 *
 * A PATCH is validated against the code as it will **end up**, not against the
 * keys sent — switching a fixed 200.00 discount to percentage is a `400` on
 * `discount_value` even though that field was not touched — which is why the
 * form always submits the complete set.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, Coins, Lock, TicketPercent } from 'lucide-vue-next'
import AdminCatalogueShell from '@/components/admin/AdminCatalogueShell.vue'
import AdminFormDrawer from '@/components/admin/AdminFormDrawer.vue'
import AdminPartnerPicker from '@/components/admin/AdminPartnerPicker.vue'
import AdminPlanPicker from '@/components/admin/AdminPlanPicker.vue'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import { formatDateTime, formatMoney, parseMoney } from '@/components/admin/adminDisplay'
import { useAdminCatalogue } from '@/composables/admin/useAdminCatalogue'
import { useAdminPricingPlans } from '@/composables/admin/useAdminPricingPlans'
import { adminService } from '@/services/api'
import type {
  AdminPromoCodeRow,
  AdminPromoCodeUsageRow,
  AdminPromoKind,
  AdminTemplateScope,
  AdminUserRow,
  QueryParams,
} from '@/services/api'

const KINDS: AdminPromoKind[] = ['marketing', 'partner_credit']
const SCOPES: AdminTemplateScope[] = ['any', 'own_partner']

const { t } = useI18n()

const kind = ref('')

const extraParams = (): QueryParams => ({ kind: kind.value || undefined })

const codes = useAdminCatalogue<AdminPromoCodeRow>('promo-codes', {
  defaultOrdering: '-created_at',
  extraParams,
})

const planList = useAdminPricingPlans()

const drawerOpen = ref(false)
const editing = ref<AdminPromoCodeRow | null>(null)
const confirmDelete = ref(false)
const fieldErrors = ref<Record<string, string[]> | null>(null)
const formError = ref<string | null>(null)

/** The picked account, kept beside the id so the picker can render it. */
const ownerRow = ref<AdminUserRow | { id: number; email: string; full_name?: string } | null>(null)

const usages = ref<AdminPromoCodeUsageRow[]>([])
const usagesCount = ref(0)
const usagesOpen = ref(false)
const usagesLoading = ref(false)
const usagesError = ref<string | null>(null)

const blankForm = () => ({
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  max_discount_amount: '',
  minimum_purchase_amount: '0',
  max_total_uses: '',
  max_uses_per_user: '1',
  valid_from: '',
  valid_until: '',
  applicable_plans: [] as number[],
  kind: 'marketing' as AdminPromoKind,
  owner_partner: null as number | null,
  template_scope: 'any' as AdminTemplateScope,
  is_active: true,
  first_purchase_only: false,
})

const form = ref(blankForm())

/** Its two locked fields, and the reason the delete is gone. */
const lockedByOrder = computed(() => Boolean(editing.value?.credit_order_reference))

const deletable = computed(() => {
  const row = editing.value
  if (!row) return true
  return !row.credit_order_reference && row.current_total_uses === 0
})

const usagesTruncated = computed(() => usagesCount.value > usages.value.length)

const activeOptions = computed(() => [
  { value: '', label: t('admin.catalogue.filters.all') },
  { value: 'true', label: t('admin.catalogue.filters.active') },
  { value: 'false', label: t('admin.catalogue.filters.retired') },
])

const orderingOptions = computed(() => [
  { value: '-created_at', label: t('admin.ordering.newest') },
  { value: 'created_at', label: t('admin.ordering.oldest') },
  { value: 'code', label: t('admin.promoCodes.orderingCode') },
  { value: '-current_total_uses', label: t('admin.promoCodes.orderingMostUsed') },
  { value: 'valid_until', label: t('admin.promoCodes.orderingExpiringSoon') },
])

const discountLabel = (row: AdminPromoCodeRow): string =>
  row.discount_type === 'percentage'
    ? t('admin.promoCodes.percentOff', { value: trimZeros(row.discount_value) })
    : t('admin.promoCodes.amountOff', { value: formatMoney(row.discount_value) })

/** `10.00%` reads as a precision the number does not have. */
const trimZeros = (value: string): string => {
  const parsed = parseMoney(value)
  return parsed % 1 === 0 ? String(parsed) : parsed.toFixed(2)
}

const usesLabel = (row: AdminPromoCodeRow): string =>
  row.max_total_uses === null
    ? t('admin.promoCodes.usesUnlimited', { used: row.current_total_uses })
    : t('admin.promoCodes.usesOf', { used: row.current_total_uses, total: row.max_total_uses })

/**
 * One chip, in the order a staff member would care. A code can be inactive
 * *and* expired *and* used up; three chips saying "unusable" three ways is
 * three pieces of furniture for one fact.
 */
const stateChip = (row: AdminPromoCodeRow): { label: string; class: string } | null => {
  if (!row.is_active) {
    return {
      label: t('admin.catalogue.retired'),
      class: 'border-slate-200 bg-slate-100 text-slate-500',
    }
  }
  if (row.is_expired) {
    return { label: t('admin.promoCodes.expired'), class: 'border-red-200 bg-red-50 text-red-700' }
  }
  if (row.is_usage_limit_reached) {
    return { label: t('admin.promoCodes.usedUp'), class: 'border-red-200 bg-red-50 text-red-700' }
  }
  if (row.is_not_yet_valid) {
    return {
      label: t('admin.promoCodes.notYetValid'),
      class: 'border-amber-200 bg-amber-50 text-amber-700',
    }
  }
  return null
}

const errorFor = (field: string): string | null => fieldErrors.value?.[field]?.[0] ?? null
const inputClass = (field: string): string =>
  errorFor(field)
    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
    : 'border-slate-300 focus:border-sky-400 focus:ring-sky-200'

/**
 * ISO → the value a `datetime-local` input takes, in **local** time.
 *
 * `toISOString()` would shift a Phnom Penh afternoon back seven hours and show
 * staff a validity window that starts on the previous day.
 */
const toLocalInput = (value: string | null): string => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Back the other way. The browser parses a bare local stamp in local time. */
const fromLocalInput = (value: string): string | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const resetUsages = (): void => {
  usages.value = []
  usagesCount.value = 0
  usagesOpen.value = false
  usagesLoading.value = false
  usagesError.value = null
}

const openCreate = (): void => {
  editing.value = null
  form.value = blankForm()
  ownerRow.value = null
  fieldErrors.value = null
  formError.value = null
  resetUsages()
  drawerOpen.value = true
}

const openEdit = (row: AdminPromoCodeRow): void => {
  editing.value = row
  form.value = {
    code: row.code,
    name: row.name,
    description: row.description,
    discount_type: row.discount_type,
    discount_value: row.discount_value,
    max_discount_amount: row.max_discount_amount ?? '',
    minimum_purchase_amount: row.minimum_purchase_amount ?? '0',
    max_total_uses: row.max_total_uses === null ? '' : String(row.max_total_uses),
    max_uses_per_user: String(row.max_uses_per_user),
    valid_from: toLocalInput(row.valid_from),
    valid_until: toLocalInput(row.valid_until),
    applicable_plans: [...row.applicable_plans],
    kind: row.kind,
    owner_partner: row.owner_partner,
    template_scope: row.template_scope ?? 'any',
    is_active: row.is_active,
    first_purchase_only: row.first_purchase_only,
  }
  ownerRow.value = row.owner_partner_detail
  fieldErrors.value = null
  formError.value = null
  resetUsages()
  drawerOpen.value = true
}

const openUsages = async (): Promise<void> => {
  if (!editing.value) return
  usagesOpen.value = true
  usagesLoading.value = true
  usagesError.value = null

  const response = await adminService.listPromoCodeUsages(editing.value.id)

  if (response.success && response.data) {
    usages.value = response.data.results
    usagesCount.value = response.data.count
  } else {
    usages.value = []
    usagesError.value = response.message ?? t('admin.states.errorTitle')
  }

  usagesLoading.value = false
}

const save = async (): Promise<void> => {
  fieldErrors.value = null
  formError.value = null

  const errors: Record<string, string[]> = {}
  if (!form.value.name.trim()) errors.name = [t('admin.catalogue.required')]
  if (!form.value.discount_value.trim()) errors.discount_value = [t('admin.catalogue.required')]

  if (form.value.discount_type === 'percentage' && parseMoney(form.value.discount_value) > 100) {
    errors.discount_value = [t('admin.percentOver100')]
  }

  const from = fromLocalInput(form.value.valid_from)
  const until = fromLocalInput(form.value.valid_until)
  if (from && until && new Date(until) <= new Date(from)) {
    errors.valid_until = [t('admin.promoCodes.validUntilTooEarly')]
  }

  // The two rules that make a credit code somebody's balance rather than a
  // string anyone can spend. Named by consequence, not by field.
  if (form.value.kind === 'partner_credit') {
    if (!form.value.owner_partner) errors.owner_partner = [t('admin.promoCodes.ownerRequired')]
    if (form.value.applicable_plans.length === 0) {
      errors.applicable_plans = [t('admin.promoCodes.plansRequiredForCredit')]
    }
  }

  if (Object.keys(errors).length) {
    fieldErrors.value = errors
    return
  }

  const maxUses = Number.parseInt(form.value.max_total_uses, 10)
  const perUser = Number.parseInt(form.value.max_uses_per_user, 10)

  const body: Record<string, unknown> = {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    // Decimals, sent as typed.
    discount_type: form.value.discount_type,
    discount_value: form.value.discount_value.trim(),
    max_discount_amount:
      form.value.discount_type === 'percentage' && form.value.max_discount_amount.trim()
        ? form.value.max_discount_amount.trim()
        : null,
    minimum_purchase_amount: form.value.minimum_purchase_amount.trim() || '0',
    max_total_uses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : null,
    max_uses_per_user: Number.isFinite(perUser) && perUser > 0 ? perUser : 1,
    valid_until: until,
    applicable_plans: form.value.applicable_plans,
    template_scope: form.value.template_scope,
    is_active: form.value.is_active,
    first_purchase_only: form.value.first_purchase_only,
  }

  // `valid_from` defaults to now server-side, so an empty field on a create is
  // left out rather than sent as null — the column is not nullable.
  if (from) body.valid_from = from

  // Omitted on create means "generate one"; uppercased here so the client and
  // the server agree about what was asked for, since the server uppercases too.
  const code = form.value.code.trim().toUpperCase()
  if (code) body.code = code

  // Refused on an issued credit code, so not sent for one at all: a PATCH that
  // repeats the current value is accepted, but not sending it cannot be wrong.
  if (!lockedByOrder.value) {
    body.kind = form.value.kind
    body.owner_partner = form.value.kind === 'partner_credit' ? form.value.owner_partner : null
  }

  const result = editing.value
    ? await codes.update(editing.value.id, body, t('admin.promoCodes.saved'))
    : await codes.create(body, t('admin.promoCodes.created'))

  if (result.outcome === 'done') {
    drawerOpen.value = false
    return
  }
  fieldErrors.value = result.fieldErrors
  if (!result.fieldErrors) formError.value = result.message
}

const doDelete = async (): Promise<void> => {
  if (!editing.value) return
  const removed = await codes.remove(editing.value.id, t('admin.promoCodes.deleted'))
  confirmDelete.value = false
  if (removed) drawerOpen.value = false
}

watch(kind, () => {
  codes.page.value = 1
  void codes.load()
})

onMounted(() => void planList.load())
</script>

<style scoped src="@/components/common/groupedList.css"></style>
