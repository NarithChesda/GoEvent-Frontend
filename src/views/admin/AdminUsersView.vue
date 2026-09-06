<template>
  <section class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-slate-900 lg:text-2xl">{{ t('admin.users.title') }}</h1>
      <p class="mt-1 text-sm text-slate-600">{{ t('admin.users.description') }}</p>
    </header>

    <AdminToolbar
      v-model:search="search"
      v-model:status="flagFilter"
      v-model:ordering="ordering"
      :placeholder="t('admin.users.search')"
      :status-options="flagOptions"
      :ordering-options="orderingOptions"
      :loading="loading"
      @refresh="load"
    />

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <AdminListStates
        :loading="loading"
        :error="error"
        :empty="!loading && !error && users.length === 0"
        :filtered="Boolean(search.trim() || flagFilter)"
        :empty-title="t('admin.users.emptyTitle')"
        :empty-body="t('admin.users.emptyBody')"
        @retry="load"
      >
        <ul class="divide-y divide-slate-100">
          <li v-for="user in users" :key="user.id">
            <button
              type="button"
              class="flex min-h-[56px] w-full items-center gap-3 p-3 text-left transition-colors duration-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-200 active:bg-slate-100 sm:p-4"
              @click="selectedId = user.id"
            >
              <span
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100"
              >
                <img
                  v-if="resolveMediaUrl(user.profile_picture)"
                  :src="resolveMediaUrl(user.profile_picture)"
                  alt=""
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
                <span v-else class="text-sm font-semibold text-slate-500" aria-hidden="true">
                  {{ initial(user) }}
                </span>
              </span>

              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <span class="min-w-0 truncate text-sm font-medium text-slate-900">
                    {{ displayName(user) }}
                  </span>
                  <!-- Only the flags that are *on* are drawn. A row of "not a
                       partner, not staff, not verified" chips on every account
                       is three pieces of furniture per row saying nothing. -->
                  <span
                    v-for="chip in chipsFor(user)"
                    :key="chip.key"
                    class="flex-shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                    :class="chip.class"
                  >
                    {{ chip.label }}
                  </span>
                </span>
                <span class="mt-0.5 block truncate text-xs text-slate-500">
                  {{ user.email }} · {{ t('admin.users.joinedRelative', { when: formatRelative(user.date_joined) }) }}
                </span>
              </span>

              <ChevronRight class="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </AdminListStates>
    </div>

    <AdminPagination
      :page="page"
      :total-pages="totalPages"
      :count="count"
      :loading="loading"
      @change="goToPage"
    />

    <AdminUserDrawer
      :open="selectedId !== null"
      :user-id="selectedId"
      @close="selectedId = null"
      @updated="load"
    />
  </section>
</template>

<script setup lang="ts">
/**
 * Account lookup, and the three flags staff may change.
 *
 * Not built on `AdminQueueShell`, deliberately: this is not a queue. There is no
 * pending state, no approve/reject, and no decision drawer — the contract that
 * makes the other six one component does not reach here, and forcing it to
 * would mean bending both.
 *
 * The one filter is a **flag** rather than a status, so it reuses the toolbar's
 * status select rather than growing a fourth control: the API's four boolean
 * filters are mutually compatible in principle, but a staff member looking for
 * "the partners" or "the deactivated accounts" wants one of them at a time.
 *
 * This is also where partner access is *removed*: an approved partner request
 * cannot be un-approved (the API answers `409`), so clearing `is_partner` here
 * is the only route.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight } from 'lucide-vue-next'
import AdminToolbar from '@/components/admin/AdminToolbar.vue'
import AdminListStates from '@/components/admin/AdminListStates.vue'
import AdminPagination from '@/components/admin/AdminPagination.vue'
import AdminUserDrawer from '@/components/admin/AdminUserDrawer.vue'
import { formatRelative } from '@/components/admin/adminDisplay'
import { ADMIN_PAGE_SIZE } from '@/composables/admin/useAdminQueue'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import { adminService } from '@/services/api'
import type { AdminUserRow, QueryParams } from '@/services/api'

const SEARCH_DEBOUNCE_MS = 300

const { t } = useI18n()

const users = ref<AdminUserRow[]>([])
const count = ref(0)
const page = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)

const search = ref('')
/** One of the API's boolean filters, encoded as `field:value`. */
const flagFilter = ref('')
const ordering = ref('-date_joined')
const selectedId = ref<number | null>(null)

const totalPages = computed(() => Math.max(1, Math.ceil(count.value / ADMIN_PAGE_SIZE)))

const flagOptions = computed(() => [
  { value: '', label: t('admin.users.filters.all') },
  { value: 'is_partner:true', label: t('admin.users.filters.partners') },
  { value: 'is_staff:true', label: t('admin.users.filters.staff') },
  { value: 'is_verified:false', label: t('admin.users.filters.unverified') },
  { value: 'is_active:false', label: t('admin.users.filters.deactivated') },
])

const orderingOptions = computed(() => [
  { value: '-date_joined', label: t('admin.users.ordering.newest') },
  { value: 'date_joined', label: t('admin.users.ordering.oldest') },
  { value: '-last_login', label: t('admin.users.ordering.lastLogin') },
  { value: 'email', label: t('admin.users.ordering.email') },
])

let requestToken = 0

const load = async (): Promise<void> => {
  const token = ++requestToken
  loading.value = true
  error.value = null

  const params: QueryParams = {
    page: page.value > 1 ? page.value : undefined,
    search: search.value.trim() || undefined,
    ordering: ordering.value || undefined,
  }

  if (flagFilter.value) {
    const [field, value] = flagFilter.value.split(':')
    params[field] = value
  }

  const response = await adminService.listUsers(params)
  if (token !== requestToken) return

  if (response.success && response.data) {
    users.value = response.data.results
    count.value = response.data.count
  } else {
    users.value = []
    count.value = 0
    error.value = response.message ?? null
  }

  loading.value = false
}

const goToPage = (next: number): void => {
  const target = Math.min(Math.max(1, next), totalPages.value)
  if (target === page.value) return
  page.value = target
  void load()
}

const resetAndLoad = (): void => {
  page.value = 1
  void load()
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(resetAndLoad, SEARCH_DEBOUNCE_MS)
})
watch([flagFilter, ordering], resetAndLoad)

const displayName = (user: AdminUserRow): string =>
  [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
  user.full_name?.trim() ||
  user.username ||
  user.email

const initial = (user: AdminUserRow): string =>
  (displayName(user).trim()[0] ?? '?').toUpperCase()

const chipsFor = (user: AdminUserRow) => {
  const chips: { key: string; label: string; class: string }[] = []
  if (user.is_staff) {
    chips.push({
      key: 'staff',
      label: t('admin.users.chips.staff'),
      class: 'border-slate-300 bg-slate-100 text-slate-700',
    })
  }
  if (user.is_partner) {
    chips.push({
      key: 'partner',
      label: t('admin.users.chips.partner'),
      class: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    })
  }
  if (!user.is_active) {
    chips.push({
      key: 'inactive',
      label: t('admin.users.chips.inactive'),
      class: 'border-red-200 bg-red-50 text-red-700',
    })
  }
  return chips
}

onMounted(load)
</script>
