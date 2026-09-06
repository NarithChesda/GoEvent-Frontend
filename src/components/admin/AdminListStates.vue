<template>
  <!-- Loading: the row chrome with its content greyed out, so the list does not
       jump when the real rows land. -->
  <div v-if="loading" class="divide-y divide-slate-100" aria-busy="true">
    <div v-for="n in rowCount" :key="n" class="flex items-center gap-3 p-3 sm:p-4">
      <div class="h-10 w-10 flex-shrink-0 animate-pulse rounded-lg bg-slate-200" />
      <div class="min-w-0 flex-1 space-y-2">
        <div class="h-3.5 w-2/5 animate-pulse rounded bg-slate-200" />
        <div class="h-3 w-3/5 animate-pulse rounded bg-slate-100" />
      </div>
      <div class="hidden h-5 w-20 flex-shrink-0 animate-pulse rounded-lg bg-slate-100 sm:block" />
    </div>
  </div>

  <!-- Error: the service layer's own message, never a raw exception. -->
  <div v-else-if="error" class="px-4 py-12 text-center">
    <div
      class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100"
      aria-hidden="true"
    >
      <TriangleAlert class="h-6 w-6 text-red-600" />
    </div>
    <h3 class="mt-4 text-base font-semibold text-slate-900">{{ t('admin.states.errorTitle') }}</h3>
    <p class="mx-auto mt-1 max-w-sm text-sm text-slate-600">{{ error }}</p>
    <button
      type="button"
      class="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-800"
      @click="emit('retry')"
    >
      <RefreshCw class="h-4 w-4" aria-hidden="true" />
      {{ t('common.actions.retry') }}
    </button>
  </div>

  <!-- Empty: a cleared queue is good news, so it is not drawn as a failure. -->
  <div v-else-if="empty" class="px-4 py-12 text-center">
    <div
      class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20"
      aria-hidden="true"
    >
      <component :is="filtered ? SearchX : CheckCheck" class="h-7 w-7 text-[#2ecc71]" />
    </div>
    <h3 class="mt-4 text-base font-semibold text-slate-900">
      {{ filtered ? t('admin.states.noMatchesTitle') : emptyTitle }}
    </h3>
    <p class="mx-auto mt-1 max-w-sm text-sm text-slate-600">
      {{ filtered ? t('admin.states.noMatchesBody') : emptyBody }}
    </p>
  </div>

  <slot v-else />
</template>

<script setup lang="ts">
/**
 * The three non-content states every queue list needs, in one place so all nine
 * admin lists cannot disagree about what an empty one looks like.
 *
 * The empty state distinguishes **cleared** from **no matches**: an admin who
 * has just typed a search into a queue and sees "nothing to review" would read
 * it as the queue being done, which is the opposite of true.
 */
import { useI18n } from 'vue-i18n'
import { CheckCheck, RefreshCw, SearchX, TriangleAlert } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    loading?: boolean
    error?: string | null
    empty?: boolean
    /** A search or filter is narrowing the list, so "empty" means "no matches". */
    filtered?: boolean
    emptyTitle: string
    emptyBody: string
    rowCount?: number
  }>(),
  { loading: false, error: null, empty: false, filtered: false, rowCount: 4 },
)

const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()
</script>
