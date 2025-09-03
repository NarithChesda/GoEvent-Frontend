<template>
  <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12 text-center">
    <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <Palette class="w-10 h-10 text-slate-400" />
    </div>
    <h3 class="text-lg font-semibold text-slate-900 mb-2">No Template Selected</h3>
    <p class="text-slate-600 mb-6 max-w-md mx-auto">
      Choose a professional template to enhance your event's visual appeal and provide a better experience for your attendees.
    </p>
    <button
      v-if="canEdit"
      @click="$emit('open-selector')"
      class="btn-gradient flex items-center mx-auto"
    >
      <Palette class="w-5 h-5 mr-2" />
      Browse Templates
    </button>
  </div>
</template>

<script setup lang="ts">
import { Palette } from 'lucide-vue-next'

interface Props {
  canEdit: boolean
}

defineProps<Props>()

defineEmits<{
  'open-selector': []
}>()
</script>

<style scoped>
.btn-gradient {
  @apply bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
         text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 
         hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30;
}
</style>