<template>
  <AdminCatalogueShell
    :catalogue="plans"
    :title="t('admin.plans.title')"
    :description="t('admin.plans.description')"
    :add-label="t('admin.plans.add')"
    :search-placeholder="t('admin.plans.search')"
    :empty-title="t('admin.plans.emptyTitle')"
    :empty-body="t('admin.plans.emptyBody')"
    :status-options="activeOptions"
    :ordering-options="orderingOptions"
    @create="openCreate"
    @edit="openEdit"
  >
    <template #row="{ row }">
      <span
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
        :class="row.is_active ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-slate-300'"
        aria-hidden="true"
      >
        <Tag class="h-4 w-4" />
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex flex-wrap items-center gap-2">
          <span
            class="flex-shrink-0 text-sm font-semibold tabular-nums"
            :class="row.is_active ? 'text-slate-900' : 'text-slate-400'"
          >
            {{ formatMoney(row.price) }}
          </span>
          <span
            class="min-w-0 truncate text-sm"
            :class="row.is_active ? 'text-slate-700' : 'text-slate-400 line-through'"
          >
            {{ row.name }}
          </span>
          <span
            v-if="row.is_best_seller"
            class="flex-shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700"
          >
            {{ t('admin.plans.bestSeller') }}
          </span>
          <span
            v-if="!row.is_active"
            class="flex-shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500"
          >
            {{ t('admin.catalogue.retired') }}
          </span>
          <!-- On the row because a price edit changes what every template on
               the plan costs, and this is the number that says how many. -->
          <AdminUsageCount
            :count="row.templates_using"
            :label="t('admin.plans.templatesUsing', { count: row.templates_using })"
            :warning="t('admin.plans.repriceWarning')"
          />
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ t('admin.plans.commissionShort', { rate: ratePercent(row.commission) }) }}
          <template v-if="row.category_name"> · {{ row.category_name }}</template>
          <template v-if="row.features?.length">
            · {{ t('admin.plans.featureCount', { count: row.features.length }) }}
          </template>
        </span>
      </span>
    </template>
  </AdminCatalogueShell>

  <AdminFormDrawer
    :open="drawerOpen"
    :title="editing ? form.name || t('admin.plans.editTitle') : t('admin.plans.createTitle')"
    :eyebrow="t('admin.plans.eyebrow')"
    :editing="Boolean(editing)"
    :delete-warning="
      editing && editing.templates_using > 0
        ? t('admin.plans.deleteWarningUsed', { count: editing.templates_using })
        : t('admin.plans.deleteWarning')
    "
    :busy="plans.saving.value"
    :form-error="formError"
    @close="drawerOpen = false"
    @submit="save"
    @delete="confirmDelete = true"
  >
    <!-- Money, so the consequence is stated before the field rather than after
         the save. Two different consequences, and only one of them is
         retroactive. -->
    <div
      v-if="editing && editing.templates_using > 0"
      class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3"
    >
      <TriangleAlert class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden="true" />
      <p class="text-sm text-slate-700">
        {{ t('admin.plans.repriceWarningLong', { count: editing.templates_using }) }}
      </p>
    </div>

    <div>
      <label for="planName" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.plans.name') }} *
      </label>
      <input
        id="planName"
        v-model="form.name"
        type="text"
        maxlength="120"
        class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
        :class="inputClass('name')"
      />
      <p v-if="errorFor('name')" class="mt-1 text-xs text-red-600">{{ errorFor('name') }}</p>
    </div>

    <div>
      <label for="planDescription" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.plans.descriptionLabel') }}
      </label>
      <textarea
        id="planDescription"
        v-model="form.description"
        rows="2"
        maxlength="500"
        class="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
      ></textarea>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label for="planPrice" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.plans.price') }} *
        </label>
        <input
          id="planPrice"
          v-model="form.price"
          type="text"
          inputmode="decimal"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base tabular-nums focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('price')"
        />
        <p v-if="errorFor('price')" class="mt-1 text-xs text-red-600">{{ errorFor('price') }}</p>
      </div>

      <div>
        <label for="planCommission" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.plans.commission') }}
        </label>
        <input
          id="planCommission"
          v-model="form.commission"
          type="text"
          inputmode="decimal"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base tabular-nums focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('commission')"
        />
        <!-- Future payments only. Commissions already created carry their own
             rate, so this is not a retroactive edit. -->
        <p class="mt-1 text-xs text-slate-500">{{ t('admin.plans.commissionHint') }}</p>
        <p v-if="errorFor('commission')" class="mt-1 text-xs text-red-600">
          {{ errorFor('commission') }}
        </p>
      </div>
    </div>

    <div>
      <label for="planFeatures" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.plans.features') }}
      </label>
      <!-- One per line rather than a repeater. The field is a JSON list of short
           strings, and a line-per-item textarea reorders, edits and pastes in
           one gesture where a row-builder needs a control for each. -->
      <textarea
        id="planFeatures"
        v-model="featuresText"
        rows="5"
        :placeholder="t('admin.plans.featuresPlaceholder')"
        class="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base leading-relaxed focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
      ></textarea>
      <p class="mt-1 text-xs text-slate-500">{{ t('admin.plans.featuresHint') }}</p>
    </div>

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
          <span class="list-row__hint">{{ t('admin.plans.activeHint') }}</span>
        </span>
        <span aria-hidden="true" class="switch-track" :class="form.is_active ? 'is-on' : ''">
          <span class="switch-knob" />
        </span>
      </button>
      <button
        type="button"
        role="switch"
        :aria-checked="form.is_best_seller"
        class="list-row"
        @click="form.is_best_seller = !form.is_best_seller"
      >
        <span class="list-row__text">
          <span class="list-row__label">{{ t('admin.plans.bestSellerLabel') }}</span>
          <span class="list-row__hint">{{ t('admin.plans.bestSellerHint') }}</span>
        </span>
        <span aria-hidden="true" class="switch-track" :class="form.is_best_seller ? 'is-on' : ''">
          <span class="switch-knob" />
        </span>
      </button>
    </div>
  </AdminFormDrawer>

  <DeleteConfirmModal
    :show="confirmDelete"
    :title="t('admin.plans.deleteTitle')"
    :item-name="editing?.name"
    :message="t('admin.plans.deleteWarning')"
    :warning-message="
      editing && editing.templates_using > 0
        ? t('admin.plans.deleteWarningUsed', { count: editing.templates_using })
        : undefined
    "
    :loading="plans.saving.value"
    @cancel="confirmDelete = false"
    @confirm="doDelete"
  />
</template>

<script setup lang="ts">
/**
 * Pricing plans — money, so the UI states consequences before the field rather
 * than after the save.
 *
 * Two of them, and they are not the same kind:
 *
 * - **Price and deactivation are immediate and broad.** Every template on the
 *   plan changes what it costs, which is what `templates_using` is doing on the
 *   row and in the drawer's banner.
 * - **Commission is forward-only.** Editing it moves what partners earn on
 *   future payments; commissions already created carry their own rate and are
 *   untouched. Said under the field, because the natural fear is that it
 *   rewrites history.
 *
 * `price` and `commission` stay **strings** end to end. They are Django
 * `Decimal`s, and rounding a price through a JS number on the way to the server
 * is the one bug in this file nobody would notice until an invoice was wrong.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Tag, TriangleAlert } from 'lucide-vue-next'
import AdminCatalogueShell from '@/components/admin/AdminCatalogueShell.vue'
import AdminFormDrawer from '@/components/admin/AdminFormDrawer.vue'
import AdminUsageCount from '@/components/admin/AdminUsageCount.vue'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import { formatMoney, parseMoney } from '@/components/admin/adminDisplay'
import { useAdminCatalogue } from '@/composables/admin/useAdminCatalogue'
import type { AdminPricingPlanRow } from '@/services/api'

const { t } = useI18n()

const plans = useAdminCatalogue<AdminPricingPlanRow>('pricing-plans', {
  defaultOrdering: 'price',
})

const drawerOpen = ref(false)
const editing = ref<AdminPricingPlanRow | null>(null)
const confirmDelete = ref(false)
const fieldErrors = ref<Record<string, string[]> | null>(null)
const formError = ref<string | null>(null)

const blankForm = () => ({
  name: '',
  description: '',
  price: '',
  commission: '',
  is_active: true,
  is_best_seller: false,
})

const form = ref(blankForm())
/** The JSON list, edited as one line per feature. */
const featuresText = ref('')

/**
 * The rate may arrive as a fraction (`0.10`) or as whole percent (`10.00`).
 * Anything at or below 1 reads as a fraction — no plan pays 1% and none pays
 * 1000%, so the boundary is unambiguous in practice.
 */
const ratePercent = (rate: string): string => {
  const value = parseMoney(rate)
  const percent = value <= 1 ? value * 100 : value
  return `${percent.toFixed(percent % 1 === 0 ? 0 : 2)}%`
}

const activeOptions = computed(() => [
  { value: '', label: t('admin.catalogue.filters.all') },
  { value: 'true', label: t('admin.catalogue.filters.active') },
  { value: 'false', label: t('admin.catalogue.filters.retired') },
])

const orderingOptions = computed(() => [
  { value: 'price', label: t('admin.plans.orderingCheapest') },
  { value: '-price', label: t('admin.plans.orderingDearest') },
  { value: 'name', label: t('admin.ordering.name') },
  { value: '-created_at', label: t('admin.ordering.newest') },
])

const errorFor = (field: string): string | null => fieldErrors.value?.[field]?.[0] ?? null
const inputClass = (field: string): string =>
  errorFor(field)
    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
    : 'border-slate-300 focus:border-sky-400 focus:ring-sky-200'

const openCreate = (): void => {
  editing.value = null
  form.value = blankForm()
  featuresText.value = ''
  fieldErrors.value = null
  formError.value = null
  drawerOpen.value = true
}

const openEdit = (row: AdminPricingPlanRow): void => {
  editing.value = row
  form.value = {
    name: row.name,
    description: row.description,
    price: row.price,
    commission: row.commission,
    is_active: row.is_active,
    is_best_seller: row.is_best_seller,
  }
  featuresText.value = (row.features ?? []).join('\n')
  fieldErrors.value = null
  formError.value = null
  drawerOpen.value = true
}

const save = async (): Promise<void> => {
  fieldErrors.value = null
  formError.value = null

  if (!form.value.name.trim()) {
    fieldErrors.value = { name: [t('admin.catalogue.required')] }
    return
  }
  if (!form.value.price.trim()) {
    fieldErrors.value = { price: [t('admin.catalogue.required')] }
    return
  }

  const body: Record<string, unknown> = {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    // Sent as typed. Never through `Number()` — these are Decimals.
    price: form.value.price.trim(),
    features: featuresText.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    is_active: form.value.is_active,
    is_best_seller: form.value.is_best_seller,
  }
  if (form.value.commission.trim()) body.commission = form.value.commission.trim()

  const result = editing.value
    ? await plans.update(editing.value.id, body, t('admin.plans.saved'))
    : await plans.create(body, t('admin.plans.created'))

  if (result.outcome === 'done') {
    drawerOpen.value = false
    return
  }
  fieldErrors.value = result.fieldErrors
  if (!result.fieldErrors) formError.value = result.message
}

const doDelete = async (): Promise<void> => {
  if (!editing.value) return
  const removed = await plans.remove(editing.value.id, t('admin.plans.deleted'))
  confirmDelete.value = false
  if (removed) drawerOpen.value = false
}
</script>

<style scoped src="@/components/common/groupedList.css"></style>
