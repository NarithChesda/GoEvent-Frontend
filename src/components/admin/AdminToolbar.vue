<template>
  <div class="flex flex-wrap items-center gap-2">
    <!-- Search takes the row and yields to the selects, because the queues that
         need it most (payments, credit orders) are searched by reference. -->
    <div class="relative order-1 min-w-[10rem] flex-1">
      <Search
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        :value="search"
        type="search"
        :placeholder="placeholder"
        :aria-label="placeholder"
        class="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-base focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 sm:text-sm"
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!--
      Ordered, not just wrapped. On a phone the four controls cannot share a
      row, and plain `flex-wrap` left this button alone on a third line looking
      like an action rather than a refinement. `order` puts it beside the search
      there and back at the end of the row from `sm`, without a second copy in
      the DOM for a screen reader to find.
    -->
    <button
      type="button"
      class="order-2 flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors duration-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:order-5"
      :disabled="loading"
      :title="t('admin.toolbar.refresh')"
      :aria-label="t('admin.toolbar.refresh')"
      @click="emit('refresh')"
    >
      <RefreshCw class="h-4 w-4" :class="loading && 'animate-spin'" aria-hidden="true" />
    </button>

    <!-- The queue's own filters. Full width below `sm`, sharing the row above
         it; the arbitrary child selector is what lets a view hand over a plain
         `<select>` wrapper without also having to know about this layout. -->
    <div
      v-if="$slots.filters"
      class="order-3 flex basis-full gap-2 [&>*]:min-w-0 [&>*]:flex-1 sm:basis-auto sm:[&>*]:flex-none"
    >
      <slot name="filters" />
    </div>

    <div
      v-if="statusOptions.length || orderingOptions.length"
      class="order-4 flex basis-full gap-2 sm:basis-auto"
    >
      <div v-if="statusOptions.length" class="relative min-w-0 flex-1 sm:flex-none">
        <select
          :value="status"
          :aria-label="t('admin.toolbar.status')"
          class="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          @change="emit('update:status', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>

      <div v-if="orderingOptions.length" class="relative min-w-0 flex-1 sm:flex-none">
        <select
          :value="ordering"
          :aria-label="t('admin.toolbar.ordering')"
          class="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          @change="emit('update:ordering', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="option in orderingOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The controls above a queue: search, status, ordering, and a manual refresh.
 *
 * The refresh button is not decoration. Two admins on one queue is the expected
 * case here, and the alternative to a button someone can press is a poll —
 * which the shared 2000/hour budget makes the wrong default.
 *
 * Plain `<select>`s rather than the app's dropdown menus (§9): this is one row
 * of secondary refinements on a staff tool, the option lists are short and
 * flat, and the native control is the one that already works with a keyboard on
 * every platform.
 */
import { useI18n } from 'vue-i18n'
import { ChevronDown, RefreshCw, Search } from 'lucide-vue-next'
import type { AdminSelectOption } from './adminDisplay'

withDefaults(
  defineProps<{
    search: string
    status: string
    ordering: string
    placeholder: string
    statusOptions?: AdminSelectOption[]
    orderingOptions?: AdminSelectOption[]
    loading?: boolean
  }>(),
  { statusOptions: () => [], orderingOptions: () => [], loading: false },
)

const emit = defineEmits<{
  'update:search': [value: string]
  'update:status': [value: string]
  'update:ordering': [value: string]
  refresh: []
}>()

const { t } = useI18n()
</script>
