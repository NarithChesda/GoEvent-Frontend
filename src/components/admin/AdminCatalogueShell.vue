<template>
  <section class="space-y-4">
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <h1 class="text-xl font-bold text-slate-900 lg:text-2xl">{{ title }}</h1>
        <p class="mt-1 text-sm text-slate-600">{{ description }}</p>
      </div>
      <!-- A catalogue's primary action is "add one", so it is the page's one
           gradient object and it sits in the title row rather than as a FAB —
           this is a desk tool, not a phone-first list. -->
      <button
        type="button"
        class="flex min-h-[40px] flex-shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2"
        @click="emit('create')"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />
        <span class="hidden sm:inline">{{ addLabel }}</span>
      </button>
    </header>

    <AdminToolbar
      v-model:search="search"
      v-model:status="status"
      v-model:ordering="ordering"
      :placeholder="searchPlaceholder"
      :status-options="statusOptions"
      :ordering-options="orderingOptions"
      :loading="loading"
      @refresh="refresh"
    >
      <template #filters><slot name="filters" /></template>
    </AdminToolbar>

    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <AdminListStates
        :loading="loading"
        :error="error"
        :empty="isEmpty"
        :filtered="isFiltered"
        :empty-title="emptyTitle"
        :empty-body="emptyBody"
        @retry="refresh"
      >
        <ul class="divide-y divide-slate-100">
          <li v-for="row in rows" :key="row.id">
            <button
              type="button"
              class="flex min-h-[56px] w-full items-center gap-3 p-3 text-left transition-colors duration-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-200 active:bg-slate-100 sm:p-4"
              @click="emit('edit', row)"
            >
              <slot name="row" :row="row" />
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
  </section>
</template>

<script setup lang="ts" generic="T extends { id: string | number }">
/**
 * The scaffolding every managed catalogue shares: an add button, the toolbar,
 * the four states, the list and pagination.
 *
 * Sibling of `AdminQueueShell` and deliberately not the same component. A queue
 * has no add button and its rows open a *decision*; a catalogue has one and its
 * rows open a *form*. Merging them would mean a shell whose every second prop
 * is inert, which is how the two drift.
 *
 * The composable is passed in rather than created here so a view can reach the
 * same instance for its own writes — the `is_active` toggle on a row, say,
 * which the shell has no business knowing about.
 */
import { computed, onMounted } from 'vue'
import { ChevronRight, Plus } from 'lucide-vue-next'
import AdminToolbar from './AdminToolbar.vue'
import AdminListStates from './AdminListStates.vue'
import AdminPagination from './AdminPagination.vue'
import type { AdminSelectOption } from './adminDisplay'
import type { useAdminCatalogue } from '@/composables/admin/useAdminCatalogue'

const props = withDefaults(
  defineProps<{
    /** The live composable instance, owned by the view. */
    catalogue: ReturnType<typeof useAdminCatalogue<T>>
    title: string
    description: string
    addLabel: string
    searchPlaceholder: string
    emptyTitle: string
    emptyBody: string
    statusOptions?: AdminSelectOption[]
    orderingOptions?: AdminSelectOption[]
    /**
     * Whether a filter the *view* owns is narrowing the list — the `#filters`
     * slot's own selects, which this component passes through without reading.
     *
     * Without it, a catalogue whose defining axis is one of those (promo codes
     * are filtered by `kind` before anything else) answers an empty filtered
     * result with "there aren't any yet" instead of "nothing matches", which
     * reads as a platform with no promo codes rather than as a filter with no
     * hits.
     */
    extraFiltered?: boolean
  }>(),
  { statusOptions: () => [], orderingOptions: () => [], extraFiltered: false },
)

const emit = defineEmits<{ create: []; edit: [row: T] }>()

defineSlots<{
  filters?: () => unknown
  row: (props: { row: T }) => unknown
}>()

/**
 * Destructured once, and safe to: these are refs, so pulling them out of the
 * prop keeps the binding live rather than copying a value. It also keeps the
 * template writing to a ref it holds directly instead of reaching through a
 * prop to do it — which is the same write, but only one of the two reads as a
 * component mutating something it was handed.
 *
 * The instance never changes for the life of this component, so there is
 * nothing to re-destructure on.
 */
const { rows, count, page, totalPages, loading, error, isEmpty, search, status, ordering } =
  props.catalogue
const { load, refresh, goToPage } = props.catalogue

/** "Empty" means "no matches" once anything is narrowing the list. */
const isFiltered = computed(() =>
  Boolean(search.value.trim() || status.value || props.extraFiltered),
)

// The shell owns the first fetch because it owns the list — a view that had to
// remember to call this itself would be six chances to forget, and forgetting
// looks exactly like an empty catalogue rather than like a bug.
onMounted(load)
</script>
