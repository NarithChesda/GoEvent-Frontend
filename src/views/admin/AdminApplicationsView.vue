<template>
  <section class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-slate-900 lg:text-2xl">
        {{ t('admin.applications.title') }}
      </h1>
      <p class="mt-1 text-sm text-slate-600">{{ t('admin.applications.description') }}</p>
    </header>

    <AdminToolbar
      v-model:search="search"
      v-model:status="status"
      v-model:ordering="ordering"
      :placeholder="t('admin.applications.search')"
      :status-options="statusOptions"
      :ordering-options="orderingOptions"
      :loading="loading"
      @refresh="load"
    />

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <AdminListStates
        :loading="loading"
        :error="error"
        :empty="!loading && !error && rows.length === 0"
        :filtered="Boolean(search.trim() || status)"
        :empty-title="t('admin.applications.emptyTitle')"
        :empty-body="t('admin.applications.emptyBody')"
        @retry="load"
      >
        <ul class="divide-y divide-slate-100">
          <li v-for="row in rows" :key="row.id">
            <button
              type="button"
              class="flex min-h-[56px] w-full items-center gap-3 p-3 text-left transition-colors duration-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-200 active:bg-slate-100 sm:p-4"
              @click="openRow(row)"
            >
              <span
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500"
                aria-hidden="true"
              >
                {{ initials(row) }}
              </span>

              <span class="min-w-0 flex-1">
                <span class="flex flex-wrap items-center gap-2">
                  <span class="min-w-0 truncate text-sm font-medium text-slate-900">
                    {{ fullName(row) }}
                  </span>
                  <span
                    class="flex-shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-medium"
                    :class="STATUS_CLASS[row.status] ?? STATUS_CLASS.new"
                  >
                    {{ row.status_display }}
                  </span>
                </span>
                <span class="mt-0.5 block truncate text-xs text-slate-500">
                  {{ row.position_title ?? t('admin.applications.noPosition') }}
                  · {{ row.email }} · {{ formatRelative(row.applied_at) }}
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

    <CheckoutDrawer
      :open="Boolean(selected)"
      :title="selected ? fullName(selected) : ''"
      :eyebrow="selected?.position_title ?? t('admin.applications.eyebrow')"
      @close="closeRow"
    >
      <template v-if="selected">
        <!-- Personal data, and the reason every move here is audited. Said once,
             at the top, rather than as a caveat under the notes field. -->
        <div class="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <ShieldAlert class="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
          <p class="text-sm text-slate-600">{{ t('admin.applications.privacyNote') }}</p>
        </div>

        <a
          v-if="selected.resume"
          :href="resolveMediaUrl(selected.resume)"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e90ff] hover:underline"
        >
          <FileText class="h-4 w-4" aria-hidden="true" />
          {{ t('admin.applications.openResume') }}
        </a>

        <AdminFacts :facts="factsFor(selected)" />

        <div v-if="selected.cover_letter" class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {{ t('admin.applications.coverLetter') }}
          </p>
          <p class="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {{ selected.cover_letter }}
          </p>
        </div>

        <!-- Private to the hiring team, and explicitly not visible to the
             applicant — drawn in the internal tone so it can never be mistaken
             for something they were sent. -->
        <AdminNote :label="t('admin.applications.teamNotes')" :note="selected.notes" internal />

        <div>
          <p class="mb-2 text-sm font-medium text-slate-700">
            {{ t('admin.applications.moveTo') }}
          </p>
          <!--
            Every state is offered, including ones "behind" the current one.
            Hiring has no fixed order — a candidate goes back to `reviewing`
            after an interview — so there is no forward-only rule to encode and
            a control that implied one would be lying about the process.
          -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="state in APPLICATION_STATES"
              :key="state"
              type="button"
              :disabled="moving"
              class="min-h-[36px] rounded-lg border px-3 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              :class="
                state === selected.status
                  ? 'cursor-default border-slate-300 bg-slate-100 text-slate-500'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              "
              :aria-current="state === selected.status ? 'true' : undefined"
              @click="move(state)"
            >
              {{ t(`admin.applications.states.${state}`) }}
            </button>
          </div>
        </div>

        <div>
          <label for="applicationNote" class="mb-2 block text-sm font-medium text-slate-700">
            {{ t('admin.applications.noteLabel') }}
          </label>
          <textarea
            id="applicationNote"
            v-model="note"
            rows="2"
            maxlength="2000"
            :placeholder="t('admin.applications.notePlaceholder')"
            class="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base leading-relaxed focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
          ></textarea>
          <p class="mt-1 text-xs text-slate-500">{{ t('admin.applications.noteHint') }}</p>
        </div>
      </template>

      <template #footer>
        <div class="pb-1">
          <button
            type="button"
            :disabled="moving"
            class="min-h-[44px] w-full rounded-xl bg-slate-100 px-4 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-200 disabled:opacity-50"
            @click="closeRow"
          >
            {{ t('common.actions.close') }}
          </button>
        </div>
      </template>
    </CheckoutDrawer>
  </section>
</template>

<script setup lang="ts">
/**
 * The hiring pipeline.
 *
 * Read-only plus one action, like the review queues — but **not** an
 * approve/reject queue, so it does not go through the decision drawer. Three
 * consequences, all of them deliberate:
 *
 * - **Moves are unguarded.** There is no `409`, no forward-only rule, and going
 *   back to `reviewing` after an interview is legitimate. Every one of the eight
 *   states is offered at every point; the audit row carrying `{from, to}` is
 *   what replaces the missing state machine.
 * - **A move to the current state writes nothing** and answers `action_id:
 *   null`. That is reported as "no change", not as success — and the current
 *   state's own button is inert rather than hidden, so the pipeline still reads
 *   as a whole.
 * - **`notes` is private and `resume` is personal data.** The notes render in
 *   the internal tone used for `admin_notes` elsewhere, so they can never be
 *   mistaken for something the applicant was sent, and the drawer says why the
 *   moves are audited.
 *
 * The list defaults to `status='new'`; `?status=all` widens it. Any other value
 * is ignored by the server in favour of the position filters, which is why this
 * offers exactly those two.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight, FileText, ShieldAlert } from 'lucide-vue-next'
import AdminToolbar from '@/components/admin/AdminToolbar.vue'
import AdminListStates from '@/components/admin/AdminListStates.vue'
import AdminPagination from '@/components/admin/AdminPagination.vue'
import AdminFacts from '@/components/admin/AdminFacts.vue'
import AdminNote from '@/components/admin/AdminNote.vue'
import CheckoutDrawer from '@/components/payment/CheckoutDrawer.vue'
import { formatDateTime, formatRelative, type AdminFact } from '@/components/admin/adminDisplay'
import { ADMIN_PAGE_SIZE } from '@/composables/admin/useAdminQueue'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import { adminService } from '@/services/api'
import type { AdminApplicationRow, AdminApplicationStatus, QueryParams } from '@/services/api'
import { useAdminStore } from '@/stores/admin'
import { useToast } from '@/composables/useToast'

const SEARCH_DEBOUNCE_MS = 300

/** Pipeline order. Presentation only — moves are not constrained by it. */
const APPLICATION_STATES: AdminApplicationStatus[] = [
  'new',
  'reviewing',
  'shortlisted',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
]

const STATUS_CLASS: Record<string, string> = {
  new: 'border-amber-200 bg-amber-50 text-amber-700',
  reviewing: 'border-sky-200 bg-sky-50 text-[#1e90ff]',
  shortlisted: 'border-sky-200 bg-sky-50 text-[#1e90ff]',
  interview: 'border-sky-200 bg-sky-50 text-[#1e90ff]',
  offer: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  hired: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-slate-200 bg-slate-100 text-slate-600',
  withdrawn: 'border-slate-200 bg-slate-100 text-slate-600',
}

const { t } = useI18n()
const adminStore = useAdminStore()
const { showSuccess, showInfo, showError } = useToast()

const rows = ref<AdminApplicationRow[]>([])
const count = ref(0)
const page = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)

const search = ref('')
const status = ref('')
const ordering = ref('-applied_at')

const selected = ref<AdminApplicationRow | null>(null)
const note = ref('')
const moving = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(count.value / ADMIN_PAGE_SIZE)))

/**
 * Only `new` (the default, sent as nothing) and `all` are offered. The server
 * ignores every other value in favour of the position filters, so listing the
 * eight states here would build a control that silently does nothing.
 */
const statusOptions = computed(() => [
  { value: '', label: t('admin.applications.filters.new') },
  { value: 'all', label: t('admin.applications.filters.all') },
])

const orderingOptions = computed(() => [
  { value: '-applied_at', label: t('admin.applications.orderingNewest') },
  { value: 'applied_at', label: t('admin.applications.orderingOldest') },
  { value: '-updated_at', label: t('admin.ordering.updated') },
  { value: 'status', label: t('admin.applications.orderingStatus') },
])

const fullName = (row: AdminApplicationRow): string =>
  [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || row.email

const initials = (row: AdminApplicationRow): string =>
  ((row.first_name?.[0] ?? '') + (row.last_name?.[0] ?? '')).toUpperCase() ||
  (row.email[0] ?? '?').toUpperCase()

const factsFor = (row: AdminApplicationRow): AdminFact[] => [
  { label: t('admin.applications.applicant'), value: fullName(row), strong: true },
  { label: t('admin.applications.email'), value: row.email },
  { label: t('admin.applications.phone'), value: row.phone },
  { label: t('admin.applications.position'), value: row.position_title },
  { label: t('admin.applications.department'), value: row.position_department },
  { label: t('admin.applications.state'), value: row.status_display, strong: true },
  { label: t('admin.applications.appliedAt'), value: formatDateTime(row.applied_at) },
  {
    label: t('admin.applications.updatedAt'),
    value: row.updated_at ? formatDateTime(row.updated_at) : null,
  },
]

let requestToken = 0

const load = async (): Promise<void> => {
  const token = ++requestToken
  loading.value = true
  error.value = null

  const params: QueryParams = {
    page: page.value > 1 ? page.value : undefined,
    search: search.value.trim() || undefined,
    status: status.value || undefined,
    ordering: ordering.value || undefined,
  }

  const response = await adminService.listApplications(params)
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
watch([status, ordering], resetAndLoad)

const openRow = (row: AdminApplicationRow): void => {
  selected.value = row
  note.value = ''
}

const closeRow = (): void => {
  if (moving.value) return
  selected.value = null
  note.value = ''
}

const move = async (next: AdminApplicationStatus): Promise<void> => {
  if (!selected.value || moving.value || next === selected.value.status) return
  moving.value = true

  const response = await adminService.moveApplication(selected.value.id, next, note.value)

  if (response.success && response.data) {
    const result = response.data
    // A no-op writes no audit row and comes back with a null action id. It is
    // not a failure and it is not a success — it is nothing happening.
    if (result.action_id === null) {
      showInfo(t('admin.applications.noChange'))
    } else {
      showSuccess(result.message || t('admin.applications.moved'))
    }
    selected.value = result.item
    note.value = ''
    // The default list is `new`, so a move usually removes the row from it —
    // and `new` is what the sidebar badge counts.
    await load()
    void adminStore.loadSummary()
  } else {
    showError(response.message ?? t('admin.applications.moveFailed'))
  }

  moving.value = false
}

void load()
</script>
