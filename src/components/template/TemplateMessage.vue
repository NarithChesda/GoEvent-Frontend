<template>
  <div class="mt-4 p-4 rounded-lg" :class="messageClasses">
    <div class="flex items-center">
      <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2 flex-shrink-0" />
      <X v-else class="w-5 h-5 mr-2 flex-shrink-0" />
      <span>{{ message.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, X } from 'lucide-vue-next'
import type { Message } from '../../composables/useTemplateApi'

interface Props {
  message: Message
}

const props = defineProps<Props>()

const messageClasses = computed(() => {
  return props.message.type === 'error'
    ? 'bg-red-50 text-red-800 border border-red-200'
    : 'bg-green-50 text-green-800 border border-green-200'
})
</script>
