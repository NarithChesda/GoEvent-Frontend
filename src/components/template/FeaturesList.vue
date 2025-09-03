<template>
  <div class="space-y-2">
    <h4 class="font-medium text-slate-900">Included Features:</h4>
    <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <li 
        v-for="feature in features" 
        :key="feature"
        class="flex items-center text-sm text-slate-600"
      >
        <CheckCircle class="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
        {{ feature }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle } from 'lucide-vue-next'

interface Props {
  features: string[]
}

defineProps<Props>()
</script>