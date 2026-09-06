<template>
  <AdminCatalogueShell
    :catalogue="music"
    :title="t('admin.music.title')"
    :description="t('admin.music.description')"
    :add-label="t('admin.music.add')"
    :search-placeholder="t('admin.music.search')"
    :empty-title="t('admin.music.emptyTitle')"
    :empty-body="t('admin.music.emptyBody')"
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
        <Music class="h-4 w-4" />
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
            v-if="!row.is_active"
            class="flex-shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500"
          >
            {{ t('admin.catalogue.retired') }}
          </span>
          <!-- On the row, not in the drawer: this is the number that decides
               whether the delete button downstream is safe to press. -->
          <AdminUsageCount
            :count="row.events_using"
            :label="t('admin.music.eventsUsing', { count: row.events_using })"
            :warning="t('admin.music.orphanWarning')"
          />
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ row.category_display }} · {{ row.duration_display }}
          <template v-if="row.description"> · {{ row.description }}</template>
        </span>
      </span>
    </template>
  </AdminCatalogueShell>

  <AdminFormDrawer
    :open="drawerOpen"
    :title="editing ? form.name || t('admin.music.editTitle') : t('admin.music.createTitle')"
    :eyebrow="t('admin.music.eyebrow')"
    :editing="Boolean(editing)"
    :delete-warning="
      editing && editing.events_using > 0
        ? t('admin.music.deleteWarningUsed', { count: editing.events_using })
        : t('admin.music.deleteWarning')
    "
    :busy="music.saving.value"
    :form-error="formError"
    @close="drawerOpen = false"
    @submit="save"
    @delete="confirmDelete = true"
  >
    <div>
      <label for="musicName" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.music.name') }} *
      </label>
      <input
        id="musicName"
        v-model="form.name"
        type="text"
        maxlength="120"
        class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
        :class="inputClass('name')"
      />
      <p v-if="errorFor('name')" class="mt-1 text-xs text-red-600">{{ errorFor('name') }}</p>
    </div>

    <div>
      <label for="musicDescription" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.music.descriptionLabel') }}
      </label>
      <textarea
        id="musicDescription"
        v-model="form.description"
        rows="2"
        maxlength="500"
        class="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
      ></textarea>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label for="musicCategory" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.music.category') }}
        </label>
        <div class="relative">
          <select
            id="musicCategory"
            v-model="form.category"
            class="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option v-for="value in MUSIC_CATEGORIES" :key="value" :value="value">
              {{ t(`admin.music.categories.${value}`) }}
            </option>
          </select>
          <ChevronDown
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
      </div>

      <div>
        <label for="musicOrder" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.catalogue.order') }}
        </label>
        <input
          id="musicOrder"
          v-model.number="form.order"
          type="number"
          min="0"
          class="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
        />
      </div>
    </div>

    <div>
      <label for="musicFile" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.music.file') }} <template v-if="!editing">*</template>
      </label>
      <input
        id="musicFile"
        ref="fileInput"
        type="file"
        accept=".mp3,.ogg,.m4a,.webm,audio/*"
        class="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        @change="onFilePicked"
      />
      <p class="mt-1 text-xs text-slate-500">{{ t('admin.music.fileHint') }}</p>
      <p v-if="errorFor('audio_file')" class="mt-1 text-xs text-red-600">
        {{ errorFor('audio_file') }}
      </p>
      <p v-if="editing && !pickedFile" class="mt-1 text-xs text-slate-500">
        {{ t('admin.catalogue.fileKept') }}
      </p>
    </div>

    <div>
      <label for="musicDuration" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.music.duration') }} *
      </label>
      <input
        id="musicDuration"
        v-model.number="form.duration_seconds"
        type="number"
        min="1"
        class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
        :class="inputClass('duration_seconds')"
      />
      <!-- Required because nothing on the server derives it and the showcase
           sizes its player from it — a wrong number is a visibly wrong player. -->
      <p class="mt-1 text-xs text-slate-500">{{ t('admin.music.durationHint') }}</p>
      <p v-if="errorFor('duration_seconds')" class="mt-1 text-xs text-red-600">
        {{ errorFor('duration_seconds') }}
      </p>
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
          <span class="list-row__hint">{{ t('admin.music.activeHint') }}</span>
        </span>
        <span aria-hidden="true" class="switch-track" :class="form.is_active ? 'is-on' : ''">
          <span class="switch-knob" />
        </span>
      </button>
    </div>
  </AdminFormDrawer>

  <DeleteConfirmModal
    :show="confirmDelete"
    :title="t('admin.music.deleteTitle')"
    :item-name="editing?.name"
    :message="t('admin.music.deleteWarning')"
    :warning-message="
      editing && editing.events_using > 0
        ? t('admin.music.deleteWarningUsed', { count: editing.events_using })
        : undefined
    "
    :loading="music.saving.value"
    @cancel="confirmDelete = false"
    @confirm="doDelete"
  />
</template>

<script setup lang="ts">
/**
 * Background music — the library an organizer picks from when choosing a track
 * for their event.
 *
 * **Prefer retiring to deleting, and the UI is built to make that the easy
 * path.** `Event.selected_music` is `SET_NULL`, so a delete does not fail when
 * events are using the track — it silently leaves them with no music.
 * `events_using` is therefore on the row, the switch is called "Active" with a
 * hint that says what turning it off does, and the delete button carries the
 * count into its own confirmation.
 *
 * `duration_seconds` is a required field because nothing on the server derives
 * it and the showcase sizes its player from the number.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, Music } from 'lucide-vue-next'
import AdminCatalogueShell from '@/components/admin/AdminCatalogueShell.vue'
import AdminFormDrawer from '@/components/admin/AdminFormDrawer.vue'
import AdminUsageCount from '@/components/admin/AdminUsageCount.vue'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import { useAdminCatalogue } from '@/composables/admin/useAdminCatalogue'
import type { AdminMusicRow } from '@/services/api'

const MUSIC_CATEGORIES = ['wedding', 'birthday', 'corporate', 'funeral', 'general'] as const

const { t } = useI18n()

const music = useAdminCatalogue<AdminMusicRow>('music', { defaultOrdering: 'order' })

const drawerOpen = ref(false)
const editing = ref<AdminMusicRow | null>(null)
const confirmDelete = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const pickedFile = ref<File | null>(null)
const fieldErrors = ref<Record<string, string[]> | null>(null)
const formError = ref<string | null>(null)

const form = ref({
  name: '',
  description: '',
  category: 'general' as string,
  order: 0,
  duration_seconds: 0,
  is_active: true,
})

const activeOptions = computed(() => [
  { value: '', label: t('admin.catalogue.filters.all') },
  { value: 'true', label: t('admin.catalogue.filters.active') },
  { value: 'false', label: t('admin.catalogue.filters.retired') },
])

const orderingOptions = computed(() => [
  { value: 'order', label: t('admin.catalogue.ordering.manual') },
  { value: 'name', label: t('admin.ordering.name') },
  { value: '-uploaded_at', label: t('admin.ordering.newest') },
  { value: '-duration_seconds', label: t('admin.music.orderingLongest') },
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
  form.value = {
    name: '',
    description: '',
    category: 'general',
    order: 0,
    duration_seconds: 0,
    is_active: true,
  }
  resetForm()
  drawerOpen.value = true
}

const openEdit = (row: AdminMusicRow): void => {
  editing.value = row
  form.value = {
    name: row.name,
    description: row.description,
    category: row.category,
    order: row.order,
    duration_seconds: row.duration_seconds,
    is_active: row.is_active,
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
  if (!form.value.duration_seconds || form.value.duration_seconds < 1) {
    fieldErrors.value = { duration_seconds: [t('admin.music.durationRequired')] }
    return
  }
  if (!editing.value && !pickedFile.value) {
    fieldErrors.value = { audio_file: [t('admin.music.fileRequired')] }
    return
  }

  /**
   * Multipart only when there is actually a file to send. An unchanged track
   * edited through this form goes as JSON, which also sidesteps the multipart
   * boolean trap — an unchecked box submits nothing, and "nothing" would have
   * to be read as "leave it alone" rather than as `false`.
   */
  let body: FormData | Record<string, unknown>
  if (pickedFile.value) {
    const data = new FormData()
    data.append('name', form.value.name.trim())
    data.append('description', form.value.description.trim())
    data.append('category', form.value.category)
    data.append('order', String(form.value.order))
    data.append('duration_seconds', String(form.value.duration_seconds))
    data.append('is_active', form.value.is_active ? 'true' : 'false')
    data.append('audio_file', pickedFile.value)
    body = data
  } else {
    body = {
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      category: form.value.category,
      order: form.value.order,
      duration_seconds: form.value.duration_seconds,
      is_active: form.value.is_active,
    }
  }

  const result = editing.value
    ? await music.update(editing.value.id, body, t('admin.music.saved'))
    : await music.create(body, t('admin.music.created'))

  if (result.outcome === 'done') {
    drawerOpen.value = false
    return
  }
  fieldErrors.value = result.fieldErrors
  if (!result.fieldErrors) formError.value = result.message
}

const doDelete = async (): Promise<void> => {
  if (!editing.value) return
  const removed = await music.remove(editing.value.id, t('admin.music.deleted'))
  confirmDelete.value = false
  if (removed) drawerOpen.value = false
}
</script>

<style scoped src="@/components/common/groupedList.css"></style>
