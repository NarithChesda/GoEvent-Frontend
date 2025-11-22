<template>
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
    <TemplateCard
      v-for="template in templates"
      :key="template.id"
      :template="template"
      :is-selected="selectedTemplateId === template.id"
      @select="handleTemplateSelect"
    />
  </div>
</template>

<script setup lang="ts">
import type { EventTemplate } from '../../services/api'
import TemplateCard from './TemplateCard.vue'

interface Props {
  templates: EventTemplate[]
  selectedTemplateId: number | null
}

defineProps<Props>()

const emit = defineEmits<{
  selectTemplate: [template: EventTemplate]
}>()

const handleTemplateSelect = (template: EventTemplate): void => {
  emit('selectTemplate', template)
}
</script>
