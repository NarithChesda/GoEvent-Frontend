<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h2 class="text-xl md:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
        Event Template
      </h2>
      <p class="text-sm text-slate-600 mt-1">
        {{
          event.event_template_enabled
            ? 'Manage your event template and styling'
            : 'Select a template for your event'
        }}
      </p>
    </div>
    <div v-if="canEdit" class="flex items-center space-x-3">
      <button
        v-if="!showTemplateSelector && !event.event_template_enabled"
        @click="$emit('open-template-selector')"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center"
      >
        <Palette class="w-4 h-4 mr-2" />
        <span class="hidden sm:inline">Browse Templates</span>
        <span class="sm:hidden">Browse</span>
      </button>
      <button
        v-if="event.event_template_enabled"
        @click="$emit('open-template-selector')"
        class="bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl p-2 hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] shadow-lg"
        title="Change Template"
      >
        <Shuffle class="w-4 h-4 text-slate-600" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Palette, Shuffle } from 'lucide-vue-next'
import type { Event } from '@/services/api'

interface Props {
  event: Event
  canEdit: boolean
  showTemplateSelector: boolean
}

defineProps<Props>()

defineEmits<{
  'open-template-selector': []
}>()
</script>
