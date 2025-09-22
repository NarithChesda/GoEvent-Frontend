import { ref, computed, watch, type ComputedRef } from 'vue'

export function useCommissionPagination<T>(data: ComputedRef<T[]>, initialPageSize = 10) {
  const currentPage = ref(1)
  const pageSize = ref(initialPageSize)

  const totalPages = computed(() => {
    return Math.ceil(data.value.length / pageSize.value)
  })

  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return data.value.slice(start, end)
  })

  const paginationInfo = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value + 1
    const end = Math.min(currentPage.value * pageSize.value, data.value.length)
    return {
      start,
      end,
      total: data.value.length,
    }
  })

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  function goToPreviousPage() {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  function goToNextPage() {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  function resetToFirstPage() {
    currentPage.value = 1
  }

  // Watch for data changes and reset to first page if current page is out of bounds
  watch(
    () => data.value.length,
    () => {
      if (currentPage.value > totalPages.value && totalPages.value > 0) {
        currentPage.value = 1
      }
    },
  )

  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    paginationInfo,
    goToPage,
    goToPreviousPage,
    goToNextPage,
    resetToFirstPage,
  }
}
