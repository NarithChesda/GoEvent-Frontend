<template>
  <span 
    class="text-xs px-2 py-1 rounded text-white truncate flex-shrink-0"
    :style="{ backgroundColor: category.color || '#64748b' }"
  >
    {{ category.name }}
  </span>
</template>

<script setup lang="ts">
interface CategoryInfo {
  id: number
  name: string
  color: string
}

interface Props {
  category: CategoryInfo
}

defineProps<Props>()
</script>