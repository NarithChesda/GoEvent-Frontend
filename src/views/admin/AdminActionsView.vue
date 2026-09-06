<template>
  <section class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-slate-900 lg:text-2xl">{{ t('admin.actions.title') }}</h1>
      <p class="mt-1 text-sm text-slate-600">{{ t('admin.actions.description') }}</p>
    </header>

    <AdminToolbar
      v-model:search="search"
      v-model:status="actionFilter"
      v-model:ordering="ordering"
      :placeholder="t('admin.actions.search')"
      :status-options="actionOptions"
      :ordering-options="orderingOptions"
      :loading="loading"
      @refresh="load"
    >
      <template #filters>
        <div class="relative">
          <select
            v-model="targetFilter"
            class="appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            :aria-label="t('admin.actions.targetFilter')"
          >
            <option value="">{{ t('admin.actions.targets.all') }}</option>
            <option v-for="target in TARGETS" :key="target" :value="target">
              {{ t(`admin.actions.targets.${target}`) }}
            </option>
          </select>
          <ChevronDown
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
      </template>
    </AdminToolbar>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <AdminListStates
        :loading="loading"
        :error="error"
        :empty="!loading && !error && rows.length === 0"
        :filtered="Boolean(search.trim() || actionFilter || targetFilter)"
        :empty-title="t('admin.actions.emptyTitle')"
        :empty-body="t('admin.actions.emptyBody')"
        @retry="load"
      >
        <ul class="divide-y divide-slate-100">
          <li v-for="row in rows" :key="row.id" class="p-3 sm:p-4">
            <div class="flex items-start gap-3">
              <span
                class="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                :class="ACTION_TONE[row.action] ?? 'bg-slate-100 text-slate-500'"
                aria-hidden="true"
              >
                <component :is="ACTION_ICON[row.action] ?? ScrollText" class="h-4 w-4" />
              </span>

              <div class="min-w-0 flex-1">
                <p class="text-sm text-slate-900">
                  <span class="font-medium">{{ row.action_display }}</span>
                  <span class="text-slate-500"> · {{ row.target_type_display }}</span>
                </p>
                <!-- The label, never the id: it was captured at decision time
                     and survives the target being deleted, whereas the id is a
                     string for every target and resolves to nothing here. -->
                <p class="mt-0.5 truncate text-sm font-medium text-slate-700">
                  {{ row.target_label || row.target_id }}
                </p>
                <p v-if="row.note" class="mt-1 line-clamp-2 text-xs text-slate-600">
                  {{ row.note }}
                </p>
                <p v-if="payloadLine(row)" class="mt-1 text-xs text-slate-500">
                  {{ payloadLine(row) }}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  {{ row.actor_email }} · {{ formatDateTime(row.created_at) }}
                </p>
              </div>
            </div>
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
  </section>
</template>

<script setup lang="ts">
/**
 * The audit log.
 *
 * Read-only, and not by convention: `POST`/`PATCH`/`DELETE` all answer `405`
 * and Django admin cannot edit it either. So there is no drawer and no row
 * action — this page is a record, and the only thing to do with it is read it.
 *
 * Rows render `target_label`, never `target_id`. The label is captured at
 * decision time and survives the target being deleted; the id is a string for
 * every target because the models mix integer and UUID primary keys, and
 * nothing in this UI can resolve one back to a page.
 *
 * `payload` varies by action — `{field, value}` for a flag change,
 * `{issued_code, credits}` for a credit order, `{can_reapply}` for a partner
 * rejection — so it is summarised into one line per shape rather than dumped as
 * JSON. An unrecognised shape is simply not shown: a raw object in a log row is
 * noise, and everything that matters is already in the label and the note.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ArrowRightLeft,
  Ban,
  Check,
  ChevronDown,
  Coins,
  Pencil,
  Plus,
  ScrollText,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-vue-next'
import AdminToolbar from '@/components/admin/AdminToolbar.vue'
import AdminListStates from '@/components/admin/AdminListStates.vue'
import AdminPagination from '@/components/admin/AdminPagination.vue'
import { formatDateTime } from '@/components/admin/adminDisplay'
import { ADMIN_PAGE_SIZE } from '@/composables/admin/useAdminQueue'
import { adminService } from '@/services/api'
import type { AdminActionKind, AdminActionRow, AdminActionTarget, QueryParams } from '@/services/api'

const SEARCH_DEBOUNCE_MS = 300

const ACTIONS: AdminActionKind[] = [
  'approve',
  'reject',
  'confirm',
  'claim',
  'cancel',
  'flag_change',
  'create',
  'update',
  'delete',
  'status_change',
]

const TARGETS: AdminActionTarget[] = [
  'event',
  'template',
  'listing',
  'partner_request',
  'payment',
  'commission',
  'credit_order',
  'user',
  'music',
  'font',
  'icon',
  'pricing_plan',
  'team_member',
  'category',
  'application',
]

const ACTION_ICON: Partial<Record<AdminActionKind, unknown>> = {
  approve: Check,
  confirm: Check,
  reject: X,
  cancel: Ban,
  claim: Coins,
  flag_change: ToggleRight,
  status_change: ArrowRightLeft,
  create: Plus,
  update: Pencil,
  delete: Trash2,
}

/**
 * Three tones, not nine colours. Approving and rejecting are the decisions
 * worth spotting in a scroll; the catalogue edits are bookkeeping and stay
 * neutral, so a page of them does not read as a page of alarms.
 */
const ACTION_TONE: Partial<Record<AdminActionKind, string>> = {
  approve: 'bg-emerald-50 text-emerald-600',
  confirm: 'bg-emerald-50 text-emerald-600',
  reject: 'bg-red-50 text-red-600',
  cancel: 'bg-red-50 text-red-600',
  delete: 'bg-red-50 text-red-600',
  claim: 'bg-sky-50 text-[#1e90ff]',
  flag_change: 'bg-slate-100 text-slate-600',
  status_change: 'bg-sky-50 text-[#1e90ff]',
  create: 'bg-slate-100 text-slate-600',
  update: 'bg-slate-100 text-slate-600',
}

const { t } = useI18n()

const rows = ref<AdminActionRow[]>([])
const count = ref(0)
const page = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)

const search = ref('')
const actionFilter = ref('')
const targetFilter = ref('')
const ordering = ref('-created_at')

const totalPages = computed(() => Math.max(1, Math.ceil(count.value / ADMIN_PAGE_SIZE)))

const actionOptions = computed(() => [
  { value: '', label: t('admin.actions.kinds.all') },
  ...ACTIONS.map((action) => ({ value: action, label: t(`admin.actions.kinds.${action}`) })),
])

const orderingOptions = computed(() => [
  { value: '-created_at', label: t('admin.ordering.newest') },
  { value: 'created_at', label: t('admin.ordering.oldest') },
])

/**
 * The payload shapes the API documents, as one readable line each.
 *
 * Order matters: `privacy`+`status` (an event moderation) is checked before
 * `field`, because a catalogue edit also carries `field`/`value` and the two
 * would otherwise collide on whichever key was tested first.
 */
const payloadLine = (row: AdminActionRow): string | null => {
  const payload = row.payload
  if (!payload || typeof payload !== 'object') return null

  if ('privacy' in payload && 'status' in payload) {
    return t('admin.actions.payload.event', {
      privacy: String(payload.privacy),
      status: String(payload.status),
    })
  }
  if ('from' in payload && 'to' in payload) {
    return t('admin.actions.payload.move', {
      from: String(payload.from),
      to: String(payload.to),
    })
  }
  if ('fields' in payload) {
    const fields = payload.fields
    return t('admin.actions.payload.fields', {
      fields: Array.isArray(fields) ? fields.join(', ') : String(fields),
    })
  }
  if ('field' in payload) {
    return t('admin.actions.payload.flag', {
      field: String(payload.field),
      value: String(payload.value),
    })
  }
  if ('issued_code' in payload) {
    return t('admin.actions.payload.code', {
      code: String(payload.issued_code),
      credits: String(payload.credits ?? ''),
    })
  }
  if ('can_reapply' in payload) {
    return t('admin.actions.payload.reapply', {
      value: payload.can_reapply ? t('admin.yes') : t('admin.no'),
    })
  }
  return null
}

let requestToken = 0

const load = async (): Promise<void> => {
  const token = ++requestToken
  loading.value = true
  error.value = null

  const params: QueryParams = {
    page: page.value > 1 ? page.value : undefined,
    search: search.value.trim() || undefined,
    action: actionFilter.value || undefined,
    target_type: targetFilter.value || undefined,
    ordering: ordering.value || undefined,
  }

  const response = await adminService.listActions(params)
  if (token !== requestToken) return

  if (response.success && response.data) {
    rows.value = response.data.results
    count.value = response.data.count
  } else {
    rows.value = []
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
watch([actionFilter, targetFilter, ordering], resetAndLoad)

onMounted(load)
</script>
