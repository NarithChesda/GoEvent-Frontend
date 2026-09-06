<template>
  <AdminCatalogueShell
    :catalogue="icons"
    :title="t('admin.icons.title')"
    :description="t('admin.icons.description')"
    :add-label="t('admin.icons.add')"
    :search-placeholder="t('admin.icons.search')"
    :empty-title="t('admin.icons.emptyTitle')"
    :empty-body="t('admin.icons.emptyBody')"
    :ordering-options="orderingOptions"
    @create="openCreate"
    @edit="openEdit"
  >
    <template #row="{ row }">
      <!-- The icon itself, rendered. A list of icon *names* would be a list
           nobody can pick from. Sanitised before it goes near `v-html`: this is
           stored markup, and stored markup is not trusted markup. -->
      <span
        class="admin-icon-swatch flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
        aria-hidden="true"
        v-html="safeSvg(row.svg_code)"
      ></span>

      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-medium text-slate-900">{{ row.name }}</span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ t('admin.icons.added', { when: formatDate(row.uploaded_at) }) }}
        </span>
      </span>
    </template>
  </AdminCatalogueShell>

  <AdminFormDrawer
    :open="drawerOpen"
    :title="editing ? form.name || t('admin.icons.editTitle') : t('admin.icons.createTitle')"
    :eyebrow="t('admin.icons.eyebrow')"
    :editing="Boolean(editing)"
    :delete-warning="t('admin.icons.deleteWarning')"
    :busy="icons.saving.value"
    :form-error="formError"
    @close="drawerOpen = false"
    @submit="save"
    @delete="confirmDelete = true"
  >
    <div>
      <label for="iconName" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.icons.name') }} *
      </label>
      <input
        id="iconName"
        v-model="form.name"
        type="text"
        maxlength="120"
        class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
        :class="inputClass('name')"
      />
      <p v-if="errorFor('name')" class="mt-1 text-xs text-red-600">{{ errorFor('name') }}</p>
    </div>

    <div>
      <label for="iconSvg" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.icons.svg') }} *
      </label>
      <textarea
        id="iconSvg"
        v-model="form.svg_code"
        rows="7"
        spellcheck="false"
        :placeholder="t('admin.icons.svgPlaceholder')"
        class="w-full resize-y rounded-lg border bg-white px-3.5 py-2.5 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2"
        :class="inputClass('svg_code')"
      ></textarea>
      <p class="mt-1 text-xs text-slate-500">{{ t('admin.icons.svgHint') }}</p>
      <p v-if="errorFor('svg_code')" class="mt-1 text-xs text-red-600">
        {{ errorFor('svg_code') }}
      </p>
    </div>

    <!-- Rendered from the sanitised markup, not the raw textarea: what is
         previewed is what will actually be drawn, including anything the
         sanitiser strips. -->
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {{ t('admin.icons.preview') }}
      </p>
      <div
        class="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
      >
        <span
          v-for="size in PREVIEW_SIZES"
          :key="size"
          class="admin-icon-swatch flex items-center justify-center text-slate-700"
          :style="{ width: `${size}px`, height: `${size}px` }"
          aria-hidden="true"
          v-html="previewSvg"
        ></span>
        <span v-if="!previewSvg" class="text-sm text-slate-400">
          {{ t('admin.icons.previewEmpty') }}
        </span>
      </div>
    </div>
  </AdminFormDrawer>

  <DeleteConfirmModal
    :show="confirmDelete"
    :title="t('admin.icons.deleteTitle')"
    :item-name="editing?.name"
    :message="t('admin.icons.deleteWarning')"
    :loading="icons.saving.value"
    @cancel="confirmDelete = false"
    @confirm="doDelete"
  />
</template>

<script setup lang="ts">
/**
 * Agenda icons.
 *
 * The only catalogue that is **plain JSON** — an icon here is inline SVG markup
 * rather than a file, so there is no multipart and no upload control, just a
 * textarea.
 *
 * That markup is rendered, in the list and in a live preview, because a list of
 * icon *names* is a list nobody can choose from. It goes through `sanitizeSvg`
 * first: it was authored by another staff member and stored, and stored markup
 * is not trusted markup — an SVG can carry script and event handlers.
 *
 * Also the only catalogue with no `is_active`, so it has no status filter and
 * deleting is the only way to retire one. Nothing reports a usage count for
 * icons, so the delete confirmation cannot say what would be orphaned.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminCatalogueShell from '@/components/admin/AdminCatalogueShell.vue'
import AdminFormDrawer from '@/components/admin/AdminFormDrawer.vue'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import { formatDate } from '@/components/admin/adminDisplay'
import { useAdminCatalogue } from '@/composables/admin/useAdminCatalogue'
import { sanitizeSvg } from '@/utils/sanitize'
import type { AdminIconRow } from '@/services/api'

const PREVIEW_SIZES = [16, 24, 40]

const { t } = useI18n()

// No `is_active` on this model, so the toolbar's status select is switched off
// rather than sending a filter the server does not have.
const icons = useAdminCatalogue<AdminIconRow>('icons', {
  defaultOrdering: 'name',
  statusParam: null,
})

const drawerOpen = ref(false)
const editing = ref<AdminIconRow | null>(null)
const confirmDelete = ref(false)
const fieldErrors = ref<Record<string, string[]> | null>(null)
const formError = ref<string | null>(null)

const form = ref({ name: '', svg_code: '' })

const safeSvg = (svg: string): string => sanitizeSvg(svg ?? '')
const previewSvg = computed(() => (form.value.svg_code.trim() ? safeSvg(form.value.svg_code) : ''))

const orderingOptions = computed(() => [
  { value: 'name', label: t('admin.ordering.name') },
  { value: '-uploaded_at', label: t('admin.ordering.newest') },
])

const errorFor = (field: string): string | null => fieldErrors.value?.[field]?.[0] ?? null
const inputClass = (field: string): string =>
  errorFor(field)
    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
    : 'border-slate-300 focus:border-sky-400 focus:ring-sky-200'

const openCreate = (): void => {
  editing.value = null
  form.value = { name: '', svg_code: '' }
  fieldErrors.value = null
  formError.value = null
  drawerOpen.value = true
}

const openEdit = (row: AdminIconRow): void => {
  editing.value = row
  form.value = { name: row.name, svg_code: row.svg_code }
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
  if (!form.value.svg_code.trim()) {
    fieldErrors.value = { svg_code: [t('admin.catalogue.required')] }
    return
  }
  // Caught here rather than by the server so the message can name the problem:
  // a paste that sanitises to nothing is markup the browser would not draw.
  if (!previewSvg.value) {
    fieldErrors.value = { svg_code: [t('admin.icons.svgInvalid')] }
    return
  }

  const body = { name: form.value.name.trim(), svg_code: form.value.svg_code.trim() }
  const result = editing.value
    ? await icons.update(editing.value.id, body, t('admin.icons.saved'))
    : await icons.create(body, t('admin.icons.created'))

  if (result.outcome === 'done') {
    drawerOpen.value = false
    return
  }
  fieldErrors.value = result.fieldErrors
  if (!result.fieldErrors) formError.value = result.message
}

const doDelete = async (): Promise<void> => {
  if (!editing.value) return
  const removed = await icons.remove(editing.value.id, t('admin.icons.deleted'))
  confirmDelete.value = false
  if (removed) drawerOpen.value = false
}
</script>

<style scoped>
/* The stored markup carries its own dimensions; the swatch decides the size and
   the colour. `currentColor` is what lets one icon read correctly on the row
   and again at three sizes in the preview. */
.admin-icon-swatch :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
  fill: currentColor;
}
</style>
