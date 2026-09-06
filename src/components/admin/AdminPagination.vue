<template>
  <nav
    v-if="totalPages > 1"
    class="flex items-center justify-between gap-3 border-t border-slate-200 px-1 pt-3"
    :aria-label="t('admin.pagination.label')"
  >
    <p class="min-w-0 truncate text-xs text-slate-500">
      {{ t('admin.pagination.showing', { from: rangeFrom, to: rangeTo, total: count }) }}
    </p>

    <div class="flex flex-shrink-0 items-center gap-1">
      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors duration-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        :disabled="page <= 1 || loading"
        :aria-label="t('admin.pagination.previous')"
        @click="emit('change', page - 1)"
      >
        <ChevronLeft class="h-4 w-4" aria-hidden="true" />
      </button>

      <span class="px-2 text-xs font-medium tabular-nums text-slate-600">
        {{ t('admin.pagination.page', { page, total: totalPages }) }}
      </span>

      <button
        type="button"
        class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors duration-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        :disabled="page >= totalPages || loading"
        :aria-label="t('admin.pagination.next')"
        @click="emit('change', page + 1)"
      >
        <ChevronRight class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
/**
 * Page-number pagination, because that is what the API does — 20 per page with
 * no `page_size` override, so there is no page-size control to offer.
 *
 * Two arrows and a count rather than a numbered strip: these queues are worked
 * front to back, and a reviewer who needs page 7 reaches for search instead.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { ADMIN_PAGE_SIZE } from '@/composables/admin/useAdminQueue'

const props = defineProps<{
  page: number
  totalPages: number
  count: number
  loading?: boolean
}>()

const emit = defineEmits<{ change: [page: number] }>()

const { t } = useI18n()

const rangeFrom = computed(() => (props.count === 0 ? 0 : (props.page - 1) * ADMIN_PAGE_SIZE + 1))
const rangeTo = computed(() => Math.min(props.page * ADMIN_PAGE_SIZE, props.count))
</script>
