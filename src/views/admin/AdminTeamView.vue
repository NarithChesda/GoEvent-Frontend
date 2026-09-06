<template>
  <AdminCatalogueShell
    :catalogue="team"
    :title="t('admin.team.title')"
    :description="t('admin.team.description')"
    :add-label="t('admin.team.add')"
    :search-placeholder="t('admin.team.search')"
    :empty-title="t('admin.team.emptyTitle')"
    :empty-body="t('admin.team.emptyBody')"
    :status-options="activeOptions"
    :ordering-options="orderingOptions"
    @create="openCreate"
    @edit="openEdit"
  >
    <template #row="{ row }">
      <span
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100"
      >
        <AdminImage :src="row.profile_picture" alt="" img-class="h-full w-full object-cover">
          <template #fallback>
            <span class="text-sm font-semibold text-slate-500" aria-hidden="true">
              {{ initial(row.name) }}
            </span>
          </template>
        </AdminImage>
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
            {{ t('admin.team.hidden') }}
          </span>
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">
          {{ row.role }}
          <template v-if="row.email"> · {{ row.email }}</template>
        </span>
      </span>
    </template>
  </AdminCatalogueShell>

  <AdminFormDrawer
    :open="drawerOpen"
    :title="editing ? form.name || t('admin.team.editTitle') : t('admin.team.createTitle')"
    :eyebrow="t('admin.team.eyebrow')"
    :editing="Boolean(editing)"
    :delete-warning="t('admin.team.deleteWarning')"
    :busy="team.saving.value"
    :form-error="formError"
    @close="drawerOpen = false"
    @submit="save"
    @delete="confirmDelete = true"
  >
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label for="teamName" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.team.name') }} *
        </label>
        <input
          id="teamName"
          v-model="form.name"
          type="text"
          maxlength="120"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('name')"
        />
        <p v-if="errorFor('name')" class="mt-1 text-xs text-red-600">{{ errorFor('name') }}</p>
      </div>

      <div>
        <label for="teamRole" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t('admin.team.role') }} *
        </label>
        <input
          id="teamRole"
          v-model="form.role"
          type="text"
          maxlength="120"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass('role')"
        />
        <p v-if="errorFor('role')" class="mt-1 text-xs text-red-600">{{ errorFor('role') }}</p>
      </div>
    </div>

    <div>
      <label for="teamBio" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.team.bio') }}
      </label>
      <textarea
        id="teamBio"
        v-model="form.bio"
        rows="3"
        maxlength="1000"
        class="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base leading-relaxed focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
      ></textarea>
    </div>

    <div>
      <label for="teamPhoto" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.team.photo') }}
      </label>
      <div class="flex items-center gap-3">
        <span
          class="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100"
        >
          <img
            v-if="photoPreview"
            :src="photoPreview"
            alt=""
            class="h-full w-full object-cover"
          />
          <AdminImage
            v-else
            :src="editing?.profile_picture"
            alt=""
            img-class="h-full w-full object-cover"
          >
            <template #fallback>
              <UserRound class="h-5 w-5 text-slate-400" aria-hidden="true" />
            </template>
          </AdminImage>
        </span>
        <input
          id="teamPhoto"
          ref="fileInput"
          type="file"
          accept="image/*"
          class="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          @change="onFilePicked"
        />
      </div>
      <p v-if="editing && !pickedFile" class="mt-1 text-xs text-slate-500">
        {{ t('admin.catalogue.fileKept') }}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div v-for="field in LINK_FIELDS" :key="field">
        <label :for="`team-${field}`" class="mb-2 block text-sm font-medium text-slate-700">
          {{ t(`admin.team.${field}`) }}
        </label>
        <input
          :id="`team-${field}`"
          v-model="form[field]"
          :type="field === 'email' ? 'email' : 'url'"
          maxlength="300"
          class="w-full rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 sm:text-sm"
          :class="inputClass(field)"
        />
        <p v-if="errorFor(field)" class="mt-1 text-xs text-red-600">{{ errorFor(field) }}</p>
      </div>
    </div>

    <div>
      <label for="teamOrder" class="mb-2 block text-sm font-medium text-slate-700">
        {{ t('admin.catalogue.order') }}
      </label>
      <input
        id="teamOrder"
        v-model.number="form.order"
        type="number"
        min="0"
        class="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
      />
      <p class="mt-1 text-xs text-slate-500">{{ t('admin.team.orderHint') }}</p>
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
          <span class="list-row__label">{{ t('admin.team.showOnAbout') }}</span>
          <span class="list-row__hint">{{ t('admin.team.showOnAboutHint') }}</span>
        </span>
        <span aria-hidden="true" class="switch-track" :class="form.is_active ? 'is-on' : ''">
          <span class="switch-knob" />
        </span>
      </button>
    </div>
  </AdminFormDrawer>

  <DeleteConfirmModal
    :show="confirmDelete"
    :title="t('admin.team.deleteTitle')"
    :item-name="editing?.name"
    :message="t('admin.team.deleteWarning')"
    :loading="team.saving.value"
    @cancel="confirmDelete = false"
    @confirm="doDelete"
  />
</template>

<script setup lang="ts">
/**
 * The team on the public About page.
 *
 * The only catalogue whose content is purely presentational — nothing in the
 * product reads it, so there is no usage count and no orphaning risk. Even so
 * the switch is called **"Show on the About page"** rather than "Active": the
 * word that matters here is where it appears, and "active" would be describing
 * a person rather than a page section.
 *
 * `order` is the About page's own sequence, which is why it has a hint — it is
 * the field most likely to be edited and least likely to be guessed.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { UserRound } from 'lucide-vue-next'
import AdminCatalogueShell from '@/components/admin/AdminCatalogueShell.vue'
import AdminFormDrawer from '@/components/admin/AdminFormDrawer.vue'
import AdminImage from '@/components/admin/AdminImage.vue'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import { useAdminCatalogue } from '@/composables/admin/useAdminCatalogue'
import type { AdminTeamRow } from '@/services/api'

const LINK_FIELDS = ['email', 'linkedin_url', 'twitter_url', 'github_url'] as const
type LinkField = (typeof LINK_FIELDS)[number]

const { t } = useI18n()

const team = useAdminCatalogue<AdminTeamRow>('team', { defaultOrdering: 'order' })

const drawerOpen = ref(false)
const editing = ref<AdminTeamRow | null>(null)
const confirmDelete = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const pickedFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const fieldErrors = ref<Record<string, string[]> | null>(null)
const formError = ref<string | null>(null)

const blankForm = () => ({
  name: '',
  role: '',
  bio: '',
  email: '',
  linkedin_url: '',
  twitter_url: '',
  github_url: '',
  order: 0,
  is_active: true,
})

const form = ref(blankForm())

const initial = (name: string): string => (name.trim()[0] ?? '?').toUpperCase()

const activeOptions = computed(() => [
  { value: '', label: t('admin.catalogue.filters.all') },
  { value: 'true', label: t('admin.team.filters.shown') },
  { value: 'false', label: t('admin.team.filters.hidden') },
])

const orderingOptions = computed(() => [
  { value: 'order', label: t('admin.catalogue.ordering.manual') },
  { value: 'name', label: t('admin.ordering.name') },
  { value: '-created_at', label: t('admin.ordering.newest') },
])

const errorFor = (field: string): string | null => fieldErrors.value?.[field]?.[0] ?? null
const inputClass = (field: string): string =>
  errorFor(field)
    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
    : 'border-slate-300 focus:border-sky-400 focus:ring-sky-200'

/** The object URL is revoked when it is replaced or the drawer closes. */
const setPreview = (file: File | null): void => {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = file ? URL.createObjectURL(file) : null
}

const resetForm = (): void => {
  pickedFile.value = null
  setPreview(null)
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

const openEdit = (row: AdminTeamRow): void => {
  editing.value = row
  form.value = {
    name: row.name,
    role: row.role,
    bio: row.bio,
    email: row.email,
    linkedin_url: row.linkedin_url,
    twitter_url: row.twitter_url,
    github_url: row.github_url,
    order: row.order,
    is_active: row.is_active,
  }
  resetForm()
  drawerOpen.value = true
}

const onFilePicked = (event: Event): void => {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  pickedFile.value = file
  setPreview(file)
}

watch(drawerOpen, (open) => {
  if (!open) setPreview(null)
})

const save = async (): Promise<void> => {
  fieldErrors.value = null
  formError.value = null

  if (!form.value.name.trim()) {
    fieldErrors.value = { name: [t('admin.catalogue.required')] }
    return
  }
  if (!form.value.role.trim()) {
    fieldErrors.value = { role: [t('admin.catalogue.required')] }
    return
  }

  const scalars: Record<string, string | number | boolean> = {
    name: form.value.name.trim(),
    role: form.value.role.trim(),
    bio: form.value.bio.trim(),
    order: form.value.order,
    is_active: form.value.is_active,
  }
  LINK_FIELDS.forEach((field: LinkField) => {
    scalars[field] = form.value[field].trim()
  })

  // Multipart only when a photo is actually being sent, so an edit that leaves
  // the picture alone goes as JSON and cannot be read as clearing it.
  let body: FormData | Record<string, unknown>
  if (pickedFile.value) {
    const data = new FormData()
    Object.entries(scalars).forEach(([key, value]) => data.append(key, String(value)))
    data.append('profile_picture', pickedFile.value)
    body = data
  } else {
    body = scalars
  }

  const result = editing.value
    ? await team.update(editing.value.id, body, t('admin.team.saved'))
    : await team.create(body, t('admin.team.created'))

  if (result.outcome === 'done') {
    drawerOpen.value = false
    return
  }
  fieldErrors.value = result.fieldErrors
  if (!result.fieldErrors) formError.value = result.message
}

const doDelete = async (): Promise<void> => {
  if (!editing.value) return
  const removed = await team.remove(editing.value.id, t('admin.team.deleted'))
  confirmDelete.value = false
  if (removed) drawerOpen.value = false
}
</script>

<style scoped src="@/components/common/groupedList.css"></style>
