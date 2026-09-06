<template>
  <AdminCatalogueShell
    :catalogue="fonts"
    :title="t('admin.fonts.title')"
    :description="t('admin.fonts.description')"
    :add-label="t('admin.fonts.add')"
    :search-placeholder="t('admin.fonts.search')"
    :empty-title="t('admin.fonts.emptyTitle')"
    :empty-body="t('admin.fonts.emptyBody')"
    :status-options="activeOptions"
    :ordering-options="orderingOptions"
    @create="openCreate"
    @edit="openEdit"
  >
    <template #filters>
      <div class="relative">
        <select
          v-model="source"
          class="appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          :aria-label="t('admin.fonts.sourceFilter')"
        >
          <option value="">{{ t('admin.fonts.sources.any') }}</option>
          <option value="system">{{ t('admin.fonts.sources.system') }}</option>
          <option value="partner">{{ t('admin.fonts.sources.partner') }}</option>
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
        <Type class="h-4 w-4" />
      </span>

      <span class="min-w-0 flex-1">
        <span class="flex flex-wrap items-center gap-2">
          <span
            class="min-w-0 truncate text-sm font-medium"
            :class="row.is_active ? 'text-slate-900' : 'text-slate-400 line-through'"
          >
            {{ row.name }}
          </span>
          <span
            v-if="row.source === 'partner'"
            class="flex-shrink-0 rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#1e90ff]"
          >
            {{ t('admin.fonts.sources.partner') }}
          </span>
          <!-- All four metrics null means the file could not be measured. The
               upload still succeeded, so nothing errored — but the face will
               render at the wrong size against everything else in a template
               until somebody fills them in. -->
          <span
            v-if="!isCalibrated(row)"
            class="flex-shrink-0 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700"
            :title="t('admin.fonts.uncalibratedHint')"
          >
            {{ t('admin.fonts.uncalibrated') }}
          </span>
          <AdminUsageCount
            :count="row.templates_using"
            :label="t('admin.fonts.templatesUsing', { count: row.templates_using })"
            :warning="t('admin.fonts.orphanWarning')"
          />
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ describeActor(row.created_by) ?? t('admin.fonts.curated') }}
          <template v-if="row.license_note"> · {{ row.license_note }}</template>
        </span>
      </span>
    </template>
  </AdminCatalogueShell>

  <AdminFormDrawer
    :open="drawerOpen"
    :title="editing ? form.name || t('admin.fonts.editTitle') : t('admin.fonts.createTitle')"
    :eyebrow="t('admin.fonts.eyebrow')"
    :editing="Boolean(editing)"
    :delete-warning="
      editing && editing.templates_using > 0
        ? t('admin.fonts.deleteWarningUsed', { count: editing.templates_using })
        : t('admin.fonts.deleteWarning')
    "
    :busy="fonts.saving.value"
    :form-error="formError"
    @close="drawerOpen = false"
    @submit="save"
    @delete="confirmDelete = true"
  >
    <div>
      <label for="fontName" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.fonts.name') }} *
      </label>
      <input
        id="fontName"
        v-model="form.name"
        type="text"
        maxlength="120"
        class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
        :class="inputClass('name')"
      />
      <p v-if="errorFor('name')" class="mt-1 text-xs text-red-600">{{ errorFor('name') }}</p>
    </div>

    <div>
      <label for="fontFile" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.fonts.file') }} <template v-if="!editing">*</template>
      </label>
      <input
        id="fontFile"
        ref="fileInput"
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        class="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        @change="onFilePicked"
      />
      <p class="mt-1 text-xs text-slate-500">{{ t('admin.fonts.fileHint') }}</p>
      <p v-if="errorFor('font_file')" class="mt-1 text-xs text-red-600">
        {{ errorFor('font_file') }}
      </p>
      <p v-if="editing && !pickedFile" class="mt-1 text-xs text-slate-500">
        {{ t('admin.catalogue.fileKept') }}
      </p>
    </div>

    <div>
      <label for="fontLicense" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.fonts.license') }}
      </label>
      <input
        id="fontLicense"
        v-model="form.license_note"
        type="text"
        maxlength="200"
        :placeholder="t('admin.fonts.licensePlaceholder')"
        class="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
      />
    </div>

    <!--
      The metrics. Editable here and read-only for partners on the core-data
      endpoint, because getting them wrong is what makes a design jump when the
      face swaps in — and correcting a partner's numbers is exactly the kind of
      thing staff do.

      Blank means "let the server measure it". Anything typed is kept as typed:
      the calibration does not overwrite an explicit value, which is how a
      measurement that comes out wrong gets hand-corrected.
    -->
    <div>
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {{ t('admin.fonts.metricsTitle') }}
      </p>
      <p class="mt-1 text-xs text-slate-500">{{ t('admin.fonts.metricsHint') }}</p>
      <div class="mt-3 grid grid-cols-2 gap-3">
        <div v-for="metric in METRICS" :key="metric">
          <label
            :for="`font-${metric}`"
            class="mb-1.5 block text-xs font-medium text-slate-600"
          >
            {{ t(`admin.fonts.metrics.${metric}`) }}
          </label>
          <input
            :id="`font-${metric}`"
            v-model="form[metric]"
            type="text"
            inputmode="decimal"
            :placeholder="t('admin.fonts.metricsAuto')"
            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base tabular-nums focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
          />
        </div>
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
          <span class="list-row__hint">{{ t('admin.fonts.activeHint') }}</span>
        </span>
        <span aria-hidden="true" class="switch-track" :class="form.is_active ? 'is-on' : ''">
          <span class="switch-knob" />
        </span>
      </button>
    </div>

    <p v-if="!editing" class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
      {{ t('admin.fonts.ownershipNote') }}
    </p>
  </AdminFormDrawer>

  <DeleteConfirmModal
    :show="confirmDelete"
    :title="t('admin.fonts.deleteTitle')"
    :item-name="editing?.name"
    :message="t('admin.fonts.deleteWarning')"
    :warning-message="
      editing && editing.templates_using > 0
        ? t('admin.fonts.deleteWarningUsed', { count: editing.templates_using })
        : undefined
    "
    :loading="fonts.saving.value"
    @cancel="confirmDelete = false"
    @confirm="doDelete"
  />
</template>

<script setup lang="ts">
/**
 * The shared font library, staff view.
 *
 * Wider than the core-data endpoint a partner sees: this returns **every**
 * font including other partners' uploads, because reviewing someone else's is
 * the job here. That is why `source` is a filter and a partner badge sits on
 * the row.
 *
 * **The metrics are measured from the file on upload**, and this form's four
 * fields exist to correct that measurement rather than to supply it — blank
 * means "let the server measure", and anything typed survives the calibration.
 * A font whose file cannot be measured is left uncalibrated rather than
 * rejected, so the upload succeeds and nothing errors; the row carries an
 * amber mark instead, because an uncalibrated face renders at the wrong size
 * against everything else in a template.
 *
 * `source` and `created_by` are server-set — a font added here is a system font
 * with a null `created_by`, which is the project's marker for "curated by
 * staff" and what scopes name uniqueness system-wide. Sending `source` is
 * ignored, so the form does not offer it.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, Type } from 'lucide-vue-next'
import AdminCatalogueShell from '@/components/admin/AdminCatalogueShell.vue'
import AdminFormDrawer from '@/components/admin/AdminFormDrawer.vue'
import AdminUsageCount from '@/components/admin/AdminUsageCount.vue'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import { describeActor } from '@/components/admin/adminDisplay'
import { useAdminCatalogue } from '@/composables/admin/useAdminCatalogue'
import type { AdminFontRow } from '@/services/api'

const METRICS = ['size_adjust', 'ascent_override', 'descent_override', 'line_gap_override'] as const
type FontMetric = (typeof METRICS)[number]

const { t } = useI18n()

const source = ref('')
const fonts = useAdminCatalogue<AdminFontRow>('fonts', {
  defaultOrdering: 'name',
  extraParams: () => ({ source: source.value || undefined }),
})

const drawerOpen = ref(false)
const editing = ref<AdminFontRow | null>(null)
const confirmDelete = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const pickedFile = ref<File | null>(null)
const fieldErrors = ref<Record<string, string[]> | null>(null)
const formError = ref<string | null>(null)

const blankForm = () => ({
  name: '',
  license_note: '',
  is_active: true,
  size_adjust: '',
  ascent_override: '',
  descent_override: '',
  line_gap_override: '',
})

const form = ref(blankForm())

/** All four null: the server could not read the file's own tables. */
const isCalibrated = (row: AdminFontRow): boolean =>
  Boolean(row.size_adjust || row.ascent_override || row.descent_override || row.line_gap_override)

const activeOptions = computed(() => [
  { value: '', label: t('admin.catalogue.filters.all') },
  { value: 'true', label: t('admin.catalogue.filters.active') },
  { value: 'false', label: t('admin.catalogue.filters.retired') },
])

const orderingOptions = computed(() => [
  { value: 'name', label: t('admin.ordering.name') },
  { value: '-created_at', label: t('admin.ordering.newest') },
  { value: 'source', label: t('admin.fonts.orderingSource') },
])

const errorFor = (field: string): string | null => fieldErrors.value?.[field]?.[0] ?? null
const inputClass = (field: string): string =>
  errorFor(field)
    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
    : 'border-slate-300 focus:border-sky-400 focus:ring-sky-200'

const resetForm = (): void => {
  pickedFile.value = null
  fieldErrors.value = null
  formError.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const openCreate = (): void => {
  editing.value = null
  form.value = blankForm()
  resetForm()
  drawerOpen.value = true
}

const openEdit = (row: AdminFontRow): void => {
  editing.value = row
  form.value = {
    name: row.name,
    license_note: row.license_note,
    is_active: row.is_active,
    size_adjust: row.size_adjust ?? '',
    ascent_override: row.ascent_override ?? '',
    descent_override: row.descent_override ?? '',
    line_gap_override: row.line_gap_override ?? '',
  }
  resetForm()
  drawerOpen.value = true
}

const onFilePicked = (event: Event): void => {
  pickedFile.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

const save = async (): Promise<void> => {
  fieldErrors.value = null
  formError.value = null

  if (!form.value.name.trim()) {
    fieldErrors.value = { name: [t('admin.catalogue.required')] }
    return
  }
  if (!editing.value && !pickedFile.value) {
    fieldErrors.value = { font_file: [t('admin.fonts.fileRequired')] }
    return
  }

  /**
   * A blank metric is **omitted**, not sent as an empty string: omitting is
   * what leaves the server free to measure it, and an empty string would be a
   * value it has to reject or coerce.
   */
  const metrics: Record<string, string> = {}
  METRICS.forEach((metric: FontMetric) => {
    const value = form.value[metric].trim()
    if (value) metrics[metric] = value
  })

  let body: FormData | Record<string, unknown>
  if (pickedFile.value) {
    const data = new FormData()
    data.append('name', form.value.name.trim())
    data.append('license_note', form.value.license_note.trim())
    data.append('is_active', form.value.is_active ? 'true' : 'false')
    data.append('font_file', pickedFile.value)
    Object.entries(metrics).forEach(([key, value]) => data.append(key, value))
    body = data
  } else {
    body = {
      name: form.value.name.trim(),
      license_note: form.value.license_note.trim(),
      is_active: form.value.is_active,
      ...metrics,
    }
  }

  const result = editing.value
    ? await fonts.update(editing.value.id, body, t('admin.fonts.saved'))
    : await fonts.create(body, t('admin.fonts.created'))

  if (result.outcome === 'done') {
    drawerOpen.value = false
    return
  }
  fieldErrors.value = result.fieldErrors
  if (!result.fieldErrors) formError.value = result.message
}

const doDelete = async (): Promise<void> => {
  if (!editing.value) return
  const removed = await fonts.remove(editing.value.id, t('admin.fonts.deleted'))
  confirmDelete.value = false
  if (removed) drawerOpen.value = false
}
</script>

<style scoped src="@/components/common/groupedList.css"></style>
