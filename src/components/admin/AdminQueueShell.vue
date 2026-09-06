<template>
  <section class="space-y-4">
    <header>
      <h1 class="text-xl font-bold text-slate-900 lg:text-2xl">{{ title }}</h1>
      <p class="mt-1 text-sm text-slate-600">{{ description }}</p>
    </header>

    <AdminToolbar
      v-model:search="queue.search.value"
      v-model:status="queue.status.value"
      v-model:ordering="queue.ordering.value"
      :placeholder="searchPlaceholder"
      :status-options="statusOptions"
      :ordering-options="orderingOptions"
      :loading="queue.loading.value"
      @refresh="queue.refresh"
    >
      <template #filters><slot name="filters" /></template>
    </AdminToolbar>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <AdminListStates
        :loading="queue.loading.value"
        :error="queue.error.value"
        :empty="queue.isEmpty.value"
        :filtered="isFiltered"
        :empty-title="emptyTitle"
        :empty-body="emptyBody"
        @retry="queue.refresh"
      >
        <ul class="divide-y divide-slate-100">
          <li v-for="row in queue.rows.value" :key="row.id">
            <button
              type="button"
              class="flex min-h-[56px] w-full items-center gap-3 p-3 text-left transition-colors duration-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-200 active:bg-slate-100 sm:p-4"
              @click="openRow(row)"
            >
              <slot name="row" :row="row" />
              <ChevronRight class="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </AdminListStates>
    </div>

    <AdminPagination
      :page="queue.page.value"
      :total-pages="queue.totalPages.value"
      :count="queue.count.value"
      :loading="queue.loading.value"
      @change="queue.goToPage"
    />

    <AdminDecisionDrawer
      :open="Boolean(selected)"
      :title="selected ? rowTitle(selected) : ''"
      :eyebrow="selected && rowEyebrow ? rowEyebrow(selected) : eyebrow"
      :decidable="isDecidable"
      :busy="queue.deciding.value"
      :note-field-error="noteFieldError"
      :result="result"
      :approve-label="approveLabel"
      @approve="onApprove"
      @reject="onReject"
      @close="closeRow"
    >
      <slot v-if="selected" name="detail" :row="selected" />
      <template #decision-extra><slot name="decision-extra" /></template>
      <template #result>
        <slot v-if="decidedItem" name="result" :item="decidedItem" />
      </template>
    </AdminDecisionDrawer>
  </section>
</template>

<script setup lang="ts" generic="T extends { id: string | number; status: string }">
/**
 * The scaffolding every review queue shares: toolbar, list, the four states,
 * pagination, and the decision drawer wired to `useAdminQueue`.
 *
 * A queue view is then only the two things that genuinely differ — what a row
 * looks like, and what evidence the drawer shows — supplied as slots. Six
 * hand-rolled copies of this plumbing is how one queue ends up without the
 * `409` handling, or refetching a list the others refresh.
 *
 * The row is a real `<button>`, not a card with a click handler: a queue is
 * worked with a keyboard as often as with a mouse.
 */
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import AdminToolbar from './AdminToolbar.vue'
import AdminListStates from './AdminListStates.vue'
import AdminPagination from './AdminPagination.vue'
import AdminDecisionDrawer from './AdminDecisionDrawer.vue'
import { statusTone, type AdminSelectOption } from './adminDisplay'
import { useAdminQueue } from '@/composables/admin/useAdminQueue'
import type { AdminQueue, AdminRejectExtra, QueryParams } from '@/services/api'

const props = withDefaults(
  defineProps<{
    queueName: AdminQueue
    title: string
    description: string
    searchPlaceholder: string
    emptyTitle: string
    emptyBody: string
    statusOptions?: AdminSelectOption[]
    orderingOptions?: AdminSelectOption[]
    /** Queue-specific list filters, e.g. `{ template_type: 'partner' }`. */
    extraParams?: QueryParams
    defaultOrdering?: string
    /** How a row names itself in the drawer header. */
    rowTitle: (row: T) => string
    rowEyebrow?: ((row: T) => string | null) | null
    eyebrow?: string | null
    approveLabel?: string | null
    /**
     * Extra body fields on reject. Only `partner-requests` sends one
     * (`can_reapply`), and it is owned by that view because the control that
     * sets it lives in its `#decision-extra` slot.
     */
    rejectExtra?: AdminRejectExtra
    /**
     * Whether an approved row leaves something behind that must be read before
     * the drawer closes. True only for credit orders, whose approve mints a
     * code that is not recoverable from anywhere else in this UI.
     */
    holdResult?: ((item: T) => boolean) | null
    /**
     * Which field carries the state **this queue decides**, when it is not
     * `status`.
     *
     * Six queues have one status and it is the one being decided. `events` has
     * two, owned by two different people: `status` is the organizer's
     * draft/published lifecycle and `moderation_status` is staff's. Reading
     * `status` there would call a published event "already decided" and hide
     * both buttons on every row worth reviewing.
     */
    decisionStatus?: ((row: T) => string) | null
  }>(),
  {
    statusOptions: () => [],
    orderingOptions: () => [],
    extraParams: () => ({}),
    defaultOrdering: '-created_at',
    rowEyebrow: null,
    eyebrow: null,
    approveLabel: null,
    rejectExtra: () => ({}),
    holdResult: null,
    decisionStatus: null,
  },
)

defineSlots<{
  filters?: () => unknown
  row: (props: { row: T }) => unknown
  detail: (props: { row: T }) => unknown
  'decision-extra'?: () => unknown
  result?: (props: { item: T }) => unknown
}>()

const queue = useAdminQueue<T>(props.queueName, {
  extraParams: () => props.extraParams,
  defaultOrdering: props.defaultOrdering,
})

// `shallowRef`, not `ref`: these hold whole API rows, which need no deep
// reactivity and whose `UnwrapRef` under a generic `T` is not worth arguing with.
const selected = shallowRef<T | null>(null)
const decidedItem = shallowRef<T | null>(null)
const result = ref<string | null>(null)
const noteFieldError = ref<string | null>(null)

/**
 * "Empty" reads very differently depending on why. A cleared queue is good
 * news; an empty search result is not, and saying "nothing to review" to
 * someone who has just typed into the box is actively misleading.
 */
const isFiltered = computed(() => Boolean(queue.search.value.trim() || queue.status.value))

/**
 * Only a row still in a pending state can be acted on. Derived from the status
 * tone rather than a per-queue list of verbs, because the six queues spell
 * their pending state four different ways (`pending`, `pending_review`,
 * `requested`) and a seventh would arrive without this file knowing.
 */
const isDecidable = computed(() => {
  const row = selected.value
  if (!row) return false
  return statusTone(props.decisionStatus ? props.decisionStatus(row) : row.status) === 'pending'
})

const openRow = (row: T): void => {
  selected.value = row
  decidedItem.value = null
  result.value = null
  noteFieldError.value = null
}

const closeRow = (): void => {
  selected.value = null
  decidedItem.value = null
  result.value = null
  noteFieldError.value = null
}

const settle = (outcome: Awaited<ReturnType<typeof queue.approve>>, held: boolean): void => {
  if (outcome.outcome === 'done') {
    if (held) {
      decidedItem.value = outcome.item
      result.value = outcome.message || null
    } else {
      closeRow()
    }
    return
  }

  if (outcome.outcome === 'conflict') {
    // The list has already been refreshed and the informational message shown.
    // Nothing here is worth keeping open — the row the admin was looking at is
    // no longer theirs to decide.
    closeRow()
    return
  }

  noteFieldError.value = outcome.fieldErrors?.note?.[0] ?? null
}

const onApprove = async (note: string): Promise<void> => {
  if (!selected.value) return
  const row = selected.value
  const outcome = await queue.approve(row.id, note)
  const held = outcome.outcome === 'done' && Boolean(props.holdResult?.(outcome.item))
  settle(outcome, held)
}

const onReject = async (note: string): Promise<void> => {
  if (!selected.value) return
  settle(await queue.reject(selected.value.id, note, props.rejectExtra), false)
}

// The filters a view owns live outside this component's own refs, so a change
// to them has to be picked up here. Serialised rather than watched deeply: the
// object is rebuilt on every render, and a deep watch would refetch each time.
watch(
  () => JSON.stringify(props.extraParams ?? {}),
  () => {
    queue.page.value = 1
    void queue.load()
  },
)

onMounted(queue.load)
</script>
