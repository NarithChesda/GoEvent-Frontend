<template>
  <AdminCatalogueShell
    :catalogue="packs"
    :title="t('admin.creditPacks.title')"
    :description="t('admin.creditPacks.description')"
    :add-label="t('admin.creditPacks.add')"
    :search-placeholder="t('admin.creditPacks.search')"
    :empty-title="t('admin.creditPacks.emptyTitle')"
    :empty-body="t('admin.creditPacks.emptyBody')"
    :status-options="activeOptions"
    :ordering-options="orderingOptions"
    :extra-filtered="Boolean(scope || visibility)"
    @create="openCreate"
    @edit="openEdit"
  >
    <template #filters>
      <div class="relative">
        <select
          v-model="scope"
          class="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          :aria-label="t('admin.creditPacks.scopeFilter')"
        >
          <option value="">{{ t('admin.creditPacks.scopes.any_filter') }}</option>
          <option value="any">{{ t('admin.creditPacks.scopes.any') }}</option>
          <option value="own_partner">{{ t('admin.creditPacks.scopes.own_partner') }}</option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
      <div class="relative">
        <select
          v-model="visibility"
          class="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          :aria-label="t('admin.creditPacks.visibilityFilter')"
        >
          <option value="">{{ t('admin.creditPacks.visibility.all') }}</option>
          <option value="true">{{ t('admin.creditPacks.visibility.public') }}</option>
          <option value="false">{{ t('admin.creditPacks.visibility.bespoke') }}</option>
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
        :class="row.is_active ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-slate-300'"
        aria-hidden="true"
      >
        <Wallet class="h-4 w-4" />
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex flex-wrap items-center gap-2">
          <span
            class="flex-shrink-0 text-sm font-semibold tabular-nums"
            :class="row.is_active ? 'text-slate-900' : 'text-slate-400'"
          >
            {{ formatMoney(row.price, row.currency) }}
          </span>
          <span
            class="min-w-0 truncate text-sm"
            :class="row.is_active ? 'text-slate-700' : 'text-slate-400 line-through'"
          >
            {{ row.name }}
          </span>
          <span
            v-if="row.is_featured"
            class="flex-shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700"
          >
            {{ t('admin.creditPacks.featured') }}
          </span>
          <!-- A bespoke rate is not on the public offer. Worth a chip: this
               list is the only place the two kinds sit side by side. -->
          <span
            v-if="!row.is_public"
            class="flex-shrink-0 rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600"
          >
            {{ t('admin.creditPacks.bespoke') }}
          </span>
          <span
            v-if="row.template_scope === 'own_partner'"
            class="flex-shrink-0 rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-sky-700"
          >
            {{ t('admin.creditPacks.ownDesigns') }}
          </span>
          <span
            v-if="!row.is_active"
            class="flex-shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500"
          >
            {{ t('admin.catalogue.retired') }}
          </span>
          <!-- On the row, like the other catalogues' usage counts, but meaning
               something stricter: non-zero makes a delete a 400 rather than a
               quiet orphaning. -->
          <AdminUsageCount
            :count="row.orders_count"
            :label="t('admin.creditPacks.ordersCount', { count: row.orders_count })"
            :warning="t('admin.creditPacks.deleteBlockedShort')"
          />
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ t('admin.creditPacks.creditsAt', {
            count: row.credit_count,
            each: formatMoney(row.price_per_credit, row.currency),
          }) }}
          <template v-if="row.applicable_plan_names.length">
            · {{ planSummary(row) }}
          </template>
          <template v-if="row.validity_days">
            · {{ t('admin.creditPacks.expiresInDays', { days: row.validity_days }) }}
          </template>
        </span>
      </span>
    </template>
  </AdminCatalogueShell>

  <AdminFormDrawer
    :open="drawerOpen"
    :title="editing ? form.name || t('admin.creditPacks.editTitle') : t('admin.creditPacks.createTitle')"
    :eyebrow="t('admin.creditPacks.eyebrow')"
    :editing="Boolean(editing)"
    :deletable="!editing || editing.orders_count === 0"
    :delete-warning="t('admin.creditPacks.deleteWarning')"
    :busy="packs.saving.value"
    :form-error="formError"
    @close="drawerOpen = false"
    @submit="save"
    @delete="confirmDelete = true"
  >
    <!-- Editing terms is safe for orders already placed — each order copied
         every term at purchase time — but a pack with confirmed orders is one
         partners have seen advertised, so a price change belongs in a
         conversation rather than in this drawer. -->
    <div
      v-if="editing && editing.confirmed_orders_count > 0"
      class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3"
    >
      <TriangleAlert class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
      <p class="text-sm text-slate-700">
        {{ t('admin.creditPacks.repriceWarning', { count: editing.confirmed_orders_count }) }}
      </p>
    </div>

    <div>
      <label for="packName" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.creditPacks.name') }} *
      </label>
      <input
        id="packName"
        v-model="form.name"
        type="text"
        maxlength="100"
        :placeholder="t('admin.creditPacks.namePlaceholder')"
        class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
        :class="inputClass('name')"
      />
      <p v-if="errorFor('name')" class="mt-1 text-xs text-red-600">{{ errorFor('name') }}</p>
    </div>

    <div>
      <label for="packDescription" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.creditPacks.descriptionLabel') }}
      </label>
      <textarea
        id="packDescription"
        v-model="form.description"
        rows="2"
        maxlength="500"
        class="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
      ></textarea>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <label for="packPrice" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.creditPacks.price') }} *
        </label>
        <input
          id="packPrice"
          v-model="form.price"
          type="text"
          inputmode="decimal"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base tabular-nums focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('price')"
        />
        <p v-if="errorFor('price')" class="mt-1 text-xs text-red-600">{{ errorFor('price') }}</p>
      </div>

      <div>
        <label for="packCurrency" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.creditPacks.currency') }}
        </label>
        <div class="relative">
          <select
            id="packCurrency"
            v-model="form.currency"
            class="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
          >
            <option v-for="code in CURRENCIES" :key="code" :value="code">{{ code }}</option>
          </select>
          <ChevronDown
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
      </div>

      <div>
        <label for="packCredits" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.creditPacks.creditCount') }} *
        </label>
        <input
          id="packCredits"
          v-model="form.credit_count"
          type="number"
          min="1"
          step="1"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base tabular-nums focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('credit_count')"
        />
        <p v-if="errorFor('credit_count')" class="mt-1 text-xs text-red-600">
          {{ errorFor('credit_count') }}
        </p>
      </div>
    </div>

    <!-- Derived here purely as a readback of the two fields above it. The
         server computes the real `price_per_credit`; this is the number that
         tells a staff member whether they typed what they meant. -->
    <p v-if="perCredit" class="-mt-1 text-xs text-slate-500">
      {{ t('admin.creditPacks.perCreditPreview', { amount: perCredit }) }}
    </p>

    <AdminPlanPicker
      v-model="form.applicable_plans"
      :plans="planList.plans.value"
      :loading="planList.loading.value"
      :error="planList.error.value"
      :label="t('admin.creditPacks.plans')"
      required
      :hint="t('admin.creditPacks.plansHint')"
      :error-text="errorFor('applicable_plans')"
    />

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label for="packDiscountType" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.creditPacks.discountType') }}
        </label>
        <div class="relative">
          <select
            id="packDiscountType"
            v-model="form.discount_type"
            class="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
          >
            <option value="fixed">{{ t('admin.discountTypes.fixed') }}</option>
            <option value="percentage">{{ t('admin.discountTypes.percentage') }}</option>
          </select>
          <ChevronDown
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
      </div>

      <div>
        <label for="packDiscountValue" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.creditPacks.discountValue') }} *
        </label>
        <input
          id="packDiscountValue"
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

    <div v-if="form.discount_type === 'percentage'">
      <label for="packMaxDiscount" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.creditPacks.maxDiscount') }}
      </label>
      <input
        id="packMaxDiscount"
        v-model="form.max_discount_amount"
        type="text"
        inputmode="decimal"
        :placeholder="t('admin.creditPacks.noCap')"
        class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base tabular-nums focus:outline-none focus:ring-2 sm:text-sm"
        :class="inputClass('max_discount_amount')"
      />
      <p class="mt-1 text-xs text-slate-500">{{ t('admin.creditPacks.maxDiscountHint') }}</p>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label for="packValidity" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.creditPacks.validityDays') }}
        </label>
        <input
          id="packValidity"
          v-model="form.validity_days"
          type="number"
          min="1"
          step="1"
          :placeholder="t('admin.creditPacks.neverExpires')"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base tabular-nums focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('validity_days')"
        />
        <p class="mt-1 text-xs text-slate-500">{{ t('admin.creditPacks.validityHint') }}</p>
      </div>

      <div>
        <label for="packOrder" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.catalogue.order') }}
        </label>
        <input
          id="packOrder"
          v-model="form.display_order"
          type="number"
          step="1"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base tabular-nums focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('display_order')"
        />
      </div>
    </div>

    <!-- Scope is a radio pair rather than a switch: `own_partner` is a
         materially different product sold at a different rate, not a setting
         turned on, and both options need their consequence spelled out. -->
    <fieldset>
      <legend id="packScopeLabel" class="mb-2 text-sm font-medium text-slate-700">
        {{ t('admin.creditPacks.scope') }}
      </legend>
      <div class="list-group" role="radiogroup" aria-labelledby="packScopeLabel">
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
            <span
              v-if="form.template_scope === option"
              class="h-2.5 w-2.5 rounded-full bg-sky-500"
            />
          </span>
          <span class="list-row__text min-w-0 flex-1">
            <span class="list-row__label">{{ t(`admin.creditPacks.scopeOptions.${option}.label`) }}</span>
            <span class="list-row__hint">{{ t(`admin.creditPacks.scopeOptions.${option}.hint`) }}</span>
          </span>
        </button>
      </div>
    </fieldset>

    <div class="list-group">
      <button
        v-for="flag in FLAGS"
        :key="flag"
        type="button"
        role="switch"
        :aria-checked="form[flag]"
        class="list-row"
        @click="form[flag] = !form[flag]"
      >
        <span class="list-row__text">
          <span class="list-row__label">{{ t(`admin.creditPacks.flags.${flag}.label`) }}</span>
          <span class="list-row__hint">{{ t(`admin.creditPacks.flags.${flag}.hint`) }}</span>
        </span>
        <span aria-hidden="true" class="switch-track" :class="form[flag] ? 'is-on' : ''">
          <span class="switch-knob" />
        </span>
      </button>
    </div>

    <!-- The delete control is hidden above rather than shown and refused: the
         server answers 400, and a button whose only outcome is an error is
         worse than the sentence explaining why it is absent. -->
    <div
      v-if="editing && editing.orders_count > 0"
      class="rounded-xl border border-slate-200 bg-slate-50 p-3"
    >
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {{ t('admin.catalogue.dangerTitle') }}
      </p>
      <p class="mt-1.5 text-sm text-slate-600">
        {{ t('admin.creditPacks.deleteBlocked', { count: editing.orders_count }) }}
      </p>
    </div>
  </AdminFormDrawer>

  <DeleteConfirmModal
    :show="confirmDelete"
    :title="t('admin.creditPacks.deleteTitle')"
    :item-name="editing?.name"
    :message="t('admin.creditPacks.deleteWarning')"
    :loading="packs.saving.value"
    @cancel="confirmDelete = false"
    @confirm="doDelete"
  />
</template>

<script setup lang="ts">
/**
 * The wholesale credit pack catalogue — the highest-leverage screen in this API.
 *
 * A pack is a promo-code template plus a price: confirming a partner's order
 * stamps these terms onto a freshly minted code. So one bad `applicable_plans`
 * does not sell one invitation cheaply, it sells the whole template catalogue
 * at the price of one — which is why the plan picker shows prices and why an
 * empty selection is stopped here as well as server-side.
 *
 * Three consequences are stated in the drawer rather than discovered:
 *
 * - **Editing terms reaches future orders only.** Each order copied price,
 *   credit count and every discount term at purchase time, so nothing here
 *   rewrites what a partner already bought. `confirmed_orders_count` is on
 *   screen before a price edit anyway, because it is how many partners have
 *   seen the old number advertised.
 * - **A pack that has been ordered cannot be deleted.** `orders_count` is on
 *   the row, and the delete control is *absent* above zero rather than present
 *   and refused — the order is the record of what each partner paid for, and
 *   `is_active: false` is what withdraws a pack from sale.
 * - **`own_partner` is a different product, not a setting.** It is drawn as a
 *   radio pair with both consequences spelled out, because a pack sold at a
 *   design-your-own rate that quietly unlocks the house catalogue is the
 *   expensive mistake this field exists to prevent.
 *
 * Money stays a **string** end to end — these are Django `Decimal`s, and
 * rounding a price through a JS number on the way to the server is the one bug
 * here nobody would notice until an invoice was wrong.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, TriangleAlert, Wallet } from 'lucide-vue-next'
import AdminCatalogueShell from '@/components/admin/AdminCatalogueShell.vue'
import AdminFormDrawer from '@/components/admin/AdminFormDrawer.vue'
import AdminPlanPicker from '@/components/admin/AdminPlanPicker.vue'
import AdminUsageCount from '@/components/admin/AdminUsageCount.vue'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import { formatMoney, parseMoney } from '@/components/admin/adminDisplay'
import { useAdminCatalogue } from '@/composables/admin/useAdminCatalogue'
import { useAdminPricingPlans } from '@/composables/admin/useAdminPricingPlans'
import type { AdminCreditPackRow, AdminTemplateScope, QueryParams } from '@/services/api'

/** What GoEvent actually collects in. Free text here would be a typo away from an unformattable pack. */
const CURRENCIES = ['USD', 'KHR'] as const

const SCOPES: AdminTemplateScope[] = ['any', 'own_partner']

/**
 * The five availability booleans, ordered by how far each reaches: on sale at
 * all, on the public offer, highlighted within it, then the two that change
 * what buying does.
 */
const FLAGS = [
  'is_active',
  'is_public',
  'is_featured',
  'requires_approval',
  'once_per_vendor',
] as const

const { t } = useI18n()

const scope = ref('')
const visibility = ref('')

const extraParams = (): QueryParams => ({
  template_scope: scope.value || undefined,
  is_public: visibility.value || undefined,
})

const packs = useAdminCatalogue<AdminCreditPackRow>('credit-packs', {
  defaultOrdering: 'display_order',
  extraParams,
})

const planList = useAdminPricingPlans()

const drawerOpen = ref(false)
const editing = ref<AdminCreditPackRow | null>(null)
const confirmDelete = ref(false)
const fieldErrors = ref<Record<string, string[]> | null>(null)
const formError = ref<string | null>(null)

const blankForm = () => ({
  name: '',
  description: '',
  price: '',
  currency: 'USD' as string,
  credit_count: '',
  applicable_plans: [] as number[],
  discount_type: 'fixed' as 'fixed' | 'percentage',
  discount_value: '',
  max_discount_amount: '',
  validity_days: '',
  display_order: '0',
  template_scope: 'any' as AdminTemplateScope,
  is_active: true,
  is_public: true,
  is_featured: false,
  requires_approval: false,
  once_per_vendor: false,
})

const form = ref(blankForm())

const activeOptions = computed(() => [
  { value: '', label: t('admin.catalogue.filters.all') },
  { value: 'true', label: t('admin.catalogue.filters.active') },
  { value: 'false', label: t('admin.catalogue.filters.retired') },
])

const orderingOptions = computed(() => [
  { value: 'display_order', label: t('admin.catalogue.ordering.manual') },
  { value: 'price', label: t('admin.creditPacks.orderingCheapest') },
  { value: '-price', label: t('admin.creditPacks.orderingDearest') },
  { value: '-credit_count', label: t('admin.creditPacks.orderingMostCredits') },
  { value: '-created_at', label: t('admin.ordering.newest') },
])

/**
 * The plan names deduped. A pack is usually one tier repeated across event
 * categories, so the raw list is "Basic, Basic, Basic" — three copies of one
 * fact, in the row's only line of secondary text.
 */
const planSummary = (row: AdminCreditPackRow): string => {
  const unique = [...new Set(row.applicable_plan_names)]
  if (unique.length <= 2) return unique.join(', ')
  return t('admin.creditPacks.planSummary', { first: unique[0], count: unique.length - 1 })
}

/** A readback of price ÷ credits while typing. The server sends the real one. */
const perCredit = computed(() => {
  const price = parseMoney(form.value.price)
  const credits = Number.parseInt(form.value.credit_count, 10)
  if (!Number.isFinite(credits) || credits < 1 || !form.value.price.trim()) return null
  return formatMoney(price / credits, form.value.currency)
})

const errorFor = (field: string): string | null => fieldErrors.value?.[field]?.[0] ?? null
const inputClass = (field: string): string =>
  errorFor(field)
    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
    : 'border-slate-300 focus:border-sky-400 focus:ring-sky-200'

const openCreate = (): void => {
  editing.value = null
  form.value = blankForm()
  fieldErrors.value = null
  formError.value = null
  drawerOpen.value = true
}

const openEdit = (row: AdminCreditPackRow): void => {
  editing.value = row
  form.value = {
    name: row.name,
    description: row.description,
    price: row.price,
    currency: row.currency || 'USD',
    credit_count: String(row.credit_count),
    applicable_plans: [...row.applicable_plans],
    discount_type: row.discount_type,
    discount_value: row.discount_value,
    max_discount_amount: row.max_discount_amount ?? '',
    validity_days: row.validity_days === null ? '' : String(row.validity_days),
    display_order: String(row.display_order),
    template_scope: row.template_scope ?? 'any',
    is_active: row.is_active,
    is_public: row.is_public,
    is_featured: row.is_featured,
    requires_approval: row.requires_approval,
    once_per_vendor: row.once_per_vendor,
  }
  fieldErrors.value = null
  formError.value = null
  drawerOpen.value = true
}

const save = async (): Promise<void> => {
  fieldErrors.value = null
  formError.value = null

  const errors: Record<string, string[]> = {}
  if (!form.value.name.trim()) errors.name = [t('admin.catalogue.required')]
  if (!form.value.price.trim()) errors.price = [t('admin.catalogue.required')]
  if (!form.value.discount_value.trim()) errors.discount_value = [t('admin.catalogue.required')]

  const credits = Number.parseInt(form.value.credit_count, 10)
  if (!Number.isFinite(credits) || credits < 1) {
    errors.credit_count = [t('admin.creditPacks.creditCountRequired')]
  }

  // Client-side because the consequence is worth naming before the round trip:
  // an empty list on the issued code means every plan, so the pack would unlock
  // the most expensive template on the platform.
  if (form.value.applicable_plans.length === 0) {
    errors.applicable_plans = [t('admin.creditPacks.plansRequired')]
  }

  if (
    form.value.discount_type === 'percentage' &&
    parseMoney(form.value.discount_value) > 100
  ) {
    errors.discount_value = [t('admin.percentOver100')]
  }

  if (Object.keys(errors).length) {
    fieldErrors.value = errors
    return
  }

  const validity = Number.parseInt(form.value.validity_days, 10)
  const order = Number.parseInt(form.value.display_order, 10)

  const body: Record<string, unknown> = {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    // Sent as typed. Never through `Number()` — these are Decimals.
    price: form.value.price.trim(),
    currency: form.value.currency,
    credit_count: credits,
    applicable_plans: form.value.applicable_plans,
    discount_type: form.value.discount_type,
    discount_value: form.value.discount_value.trim(),
    // Explicit null clears a cap; an omitted key would leave the old one.
    max_discount_amount:
      form.value.discount_type === 'percentage' && form.value.max_discount_amount.trim()
        ? form.value.max_discount_amount.trim()
        : null,
    validity_days: Number.isFinite(validity) && validity > 0 ? validity : null,
    display_order: Number.isFinite(order) ? order : 0,
    template_scope: form.value.template_scope,
    is_active: form.value.is_active,
    is_public: form.value.is_public,
    is_featured: form.value.is_featured,
    requires_approval: form.value.requires_approval,
    once_per_vendor: form.value.once_per_vendor,
  }

  const result = editing.value
    ? await packs.update(editing.value.id, body, t('admin.creditPacks.saved'))
    : await packs.create(body, t('admin.creditPacks.created'))

  if (result.outcome === 'done') {
    drawerOpen.value = false
    return
  }
  fieldErrors.value = result.fieldErrors
  if (!result.fieldErrors) formError.value = result.message
}

const doDelete = async (): Promise<void> => {
  if (!editing.value) return
  const removed = await packs.remove(editing.value.id, t('admin.creditPacks.deleted'))
  confirmDelete.value = false
  if (removed) drawerOpen.value = false
}

watch([scope, visibility], () => {
  packs.page.value = 1
  void packs.load()
})

// The picker's list is reference data rather than part of this catalogue, so it
// is fetched once here instead of on every drawer open.
onMounted(() => void planList.load())
</script>

<style scoped src="@/components/common/groupedList.css"></style>
