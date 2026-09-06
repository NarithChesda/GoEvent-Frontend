<template>
  <AdminCatalogueShell
    :catalogue="categories"
    :title="t('admin.categories.title')"
    :description="t('admin.categories.description')"
    :add-label="t('admin.categories.add')"
    :search-placeholder="t('admin.categories.search')"
    :empty-title="t('admin.categories.emptyTitle')"
    :empty-body="t('admin.categories.emptyBody')"
    :status-options="activeOptions"
    :ordering-options="orderingOptions"
    @create="openCreate"
    @edit="openEdit"
  >
    <template #row="{ row }">
      <!-- The category's own colour, which is how it is recognised everywhere
           else in the app — a swatch says more here than a generic glyph. -->
      <span
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200"
        :style="{ backgroundColor: swatch(row.color) }"
        aria-hidden="true"
      >
        <Shapes class="h-4 w-4 text-white mix-blend-luminosity" />
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex flex-wrap items-center gap-2">
          <span
            class="min-w-0 truncate text-sm font-medium"
            :class="row.is_active ? 'text-slate-900' : 'text-slate-400 line-through'"
          >
            {{ row.name }}
          </span>
          <!-- `created_by` is how staff tell a curated entry from one somebody
               invented for a single event — any authenticated user can create
               a category through the core-data endpoint. -->
          <span
            v-if="row.created_by"
            class="flex-shrink-0 rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#1e90ff]"
            :title="t('admin.categories.userMadeHint')"
          >
            {{ t('admin.categories.userMade') }}
          </span>
          <span
            v-if="!row.is_active"
            class="flex-shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500"
          >
            {{ t('admin.catalogue.retired') }}
          </span>
          <AdminUsageCount
            :count="row.events_count"
            :label="t('admin.categories.eventsUsing', { count: row.events_count })"
            :warning="t('admin.categories.orphanWarning')"
          />
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          <template v-if="row.created_by">
            {{ describeActor(row.created_by) }} ·
          </template>
          {{ t('admin.categories.templatesCount', { count: row.templates_count }) }}
          <template v-if="row.description"> · {{ row.description }}</template>
        </span>
      </span>
    </template>
  </AdminCatalogueShell>

  <AdminFormDrawer
    :open="drawerOpen"
    :title="
      editing ? form.name || t('admin.categories.editTitle') : t('admin.categories.createTitle')
    "
    :eyebrow="t('admin.categories.eyebrow')"
    :editing="Boolean(editing)"
    :delete-warning="
      editing && editing.events_count > 0
        ? t('admin.categories.deleteWarningUsed', { count: editing.events_count })
        : t('admin.categories.deleteWarning')
    "
    :busy="categories.saving.value"
    :form-error="formError"
    @close="drawerOpen = false"
    @submit="save"
    @delete="confirmDelete = true"
  >
    <div>
      <label for="categoryName" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.categories.name') }} *
      </label>
      <input
        id="categoryName"
        v-model="form.name"
        type="text"
        maxlength="120"
        class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
        :class="inputClass('name')"
      />
      <p v-if="errorFor('name')" class="mt-1 text-xs text-red-600">{{ errorFor('name') }}</p>
    </div>

    <div>
      <label for="categoryDescription" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.categories.descriptionLabel') }}
      </label>
      <textarea
        id="categoryDescription"
        v-model="form.description"
        rows="2"
        maxlength="500"
        class="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
      ></textarea>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label for="categoryColor" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.categories.color') }}
        </label>
        <!-- A native picker and the hex beside it. The hex is what is stored
             and what a designer will paste; the picker is for choosing one. -->
        <div class="flex items-center gap-2">
          <input
            id="categoryColor"
            v-model="form.color"
            type="color"
            class="h-[42px] w-12 flex-shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
            :aria-label="t('admin.categories.color')"
          />
          <input
            v-model="form.color"
            type="text"
            maxlength="9"
            spellcheck="false"
            class="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
            :aria-label="t('admin.categories.colorHex')"
          />
        </div>
      </div>

      <div>
        <label for="categoryIcon" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.categories.icon') }}
        </label>
        <input
          id="categoryIcon"
          v-model="form.icon"
          type="text"
          maxlength="60"
          :placeholder="t('admin.categories.iconPlaceholder')"
          class="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
        />
      </div>
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
          <span class="list-row__hint">{{ t('admin.categories.activeHint') }}</span>
        </span>
        <span aria-hidden="true" class="switch-track" :class="form.is_active ? 'is-on' : ''">
          <span class="switch-knob" />
        </span>
      </button>
    </div>
  </AdminFormDrawer>

  <DeleteConfirmModal
    :show="confirmDelete"
    :title="t('admin.categories.deleteTitle')"
    :item-name="editing?.name"
    :message="t('admin.categories.deleteWarning')"
    :warning-message="
      editing && editing.events_count > 0
        ? t('admin.categories.deleteWarningUsed', { count: editing.events_count })
        : undefined
    "
    :loading="categories.saving.value"
    @cancel="confirmDelete = false"
    @confirm="doDelete"
  />
</template>

<script setup lang="ts">
/**
 * Event categories — the one partly **user-generated** list in this API.
 *
 * `/api/core-data/event-categories/` lets any authenticated user create a
 * category, so this list is not purely curated. `created_by` is how staff tell
 * the two apart, which is why it is a badge on the row rather than a field
 * buried in the drawer: it is the signal that decides whether a row is worth
 * tidying up at all.
 *
 * **Prefer retiring to deleting.** `Event.category` is `SET_NULL`, so a delete
 * silently uncategorises every event using it — `events_count` is on the row
 * and in the confirmation for exactly that reason.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Shapes } from 'lucide-vue-next'
import AdminCatalogueShell from '@/components/admin/AdminCatalogueShell.vue'
import AdminFormDrawer from '@/components/admin/AdminFormDrawer.vue'
import AdminUsageCount from '@/components/admin/AdminUsageCount.vue'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import { describeActor } from '@/components/admin/adminDisplay'
import { useAdminCatalogue } from '@/composables/admin/useAdminCatalogue'
import type { AdminCategoryRow } from '@/services/api'

const DEFAULT_COLOR = '#3B82F6'

const { t } = useI18n()

const categories = useAdminCatalogue<AdminCategoryRow>('categories', {
  defaultOrdering: 'name',
})

const drawerOpen = ref(false)
const editing = ref<AdminCategoryRow | null>(null)
const confirmDelete = ref(false)
const fieldErrors = ref<Record<string, string[]> | null>(null)
const formError = ref<string | null>(null)

const form = ref({
  name: '',
  description: '',
  color: DEFAULT_COLOR,
  icon: '',
  is_active: true,
})

/** A stored colour can be blank or malformed; the swatch must not be. */
const swatch = (color: string): string => (/^#[0-9a-f]{3,8}$/i.test(color) ? color : '#94a3b8')

const activeOptions = computed(() => [
  { value: '', label: t('admin.catalogue.filters.all') },
  { value: 'true', label: t('admin.catalogue.filters.active') },
  { value: 'false', label: t('admin.catalogue.filters.retired') },
])

const orderingOptions = computed(() => [
  { value: 'name', label: t('admin.ordering.name') },
  { value: '-events_count', label: t('admin.categories.orderingBusiest') },
])

const errorFor = (field: string): string | null => fieldErrors.value?.[field]?.[0] ?? null
const inputClass = (field: string): string =>
  errorFor(field)
    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
    : 'border-slate-300 focus:border-sky-400 focus:ring-sky-200'

const openCreate = (): void => {
  editing.value = null
  form.value = { name: '', description: '', color: DEFAULT_COLOR, icon: '', is_active: true }
  fieldErrors.value = null
  formError.value = null
  drawerOpen.value = true
}

const openEdit = (row: AdminCategoryRow): void => {
  editing.value = row
  form.value = {
    name: row.name,
    description: row.description,
    color: swatch(row.color),
    icon: row.icon,
    is_active: row.is_active,
  }
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

  const body = {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    color: form.value.color,
    icon: form.value.icon.trim(),
    is_active: form.value.is_active,
  }

  const result = editing.value
    ? await categories.update(editing.value.id, body, t('admin.categories.saved'))
    : await categories.create(body, t('admin.categories.created'))

  if (result.outcome === 'done') {
    drawerOpen.value = false
    return
  }
  fieldErrors.value = result.fieldErrors
  if (!result.fieldErrors) formError.value = result.message
}

const doDelete = async (): Promise<void> => {
  if (!editing.value) return
  const removed = await categories.remove(editing.value.id, t('admin.categories.deleted'))
  confirmDelete.value = false
  if (removed) drawerOpen.value = false
}
</script>

<style scoped src="@/components/common/groupedList.css"></style>
