<template>
  <div class="px-6 py-4 border-t border-slate-100">
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <p class="text-sm text-slate-600">
        Showing
        <span class="font-semibold">{{ paginationInfo.start }}-{{ paginationInfo.end }}</span> of
        <span class="font-semibold">{{ paginationInfo.total }}</span> commissions
      </p>
      <div class="flex items-center space-x-2">
        <button
          @click="$emit('previousPage')"
          :disabled="currentPage <= 1"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>
        <div class="flex space-x-1">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="$emit('goToPage', page)"
            :class="[
              'px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200',
              currentPage === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100',
            ]"
          >
            {{ page }}
          </button>
          <span v-if="showEllipsis" class="px-2 py-1 text-slate-400">...</span>
          <button
            v-if="showLastPage"
            @click="$emit('goToPage', totalPages)"
            :class="[
              'px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200',
              currentPage === totalPages
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100',
            ]"
          >
            {{ totalPages }}
          </button>
        </div>
        <button
          @click="$emit('nextPage')"
          :disabled="currentPage >= totalPages"
          class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface PaginationInfo {
  start: number
  end: number
  total: number
}

interface Props {
  currentPage: number
  totalPages: number
  paginationInfo: PaginationInfo
}

interface Emits {
  (e: 'goToPage', page: number): void
  (e: 'previousPage'): void
  (e: 'nextPage'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const visiblePages = computed(() => {
  const maxVisible = 5
  return Math.min(props.totalPages, maxVisible)
})

const showEllipsis = computed(() => {
  return props.totalPages > 5 && props.currentPage < props.totalPages - 2
})

const showLastPage = computed(() => {
  return props.totalPages > 5 && props.currentPage < props.totalPages - 2
})
</script>
