<template>
  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-6">
    <div class="flex items-start space-x-4">
      <div
        class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"
      >
        <Package class="w-6 h-6 text-blue-600" />
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-slate-900">Template Selected</h3>
        <p class="text-slate-600 mt-1">
          You have selected template ID {{ templateId }}. The template is ready to be activated.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Package } from 'lucide-vue-next'

interface Props {
  templateId: string
}

defineProps<Props>()
</script>
