<template>
  <div class="space-y-3 sm:space-y-4">
    <h4 class="text-sm font-semibold text-slate-900 flex items-center">
      <Clock class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
      Schedule
    </h4>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      <!-- Date -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Date</label>
        <input
          :value="date"
          @input="$emit('update:date', ($event.target as HTMLInputElement).value)"
          type="date"
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
        />
      </div>

      <!-- Agenda Type -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Type</label>
        <div class="relative">
          <select
            :value="agendaType"
            @input="$emit('update:agenda-type', ($event.target as HTMLSelectElement).value)"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
          >
            <option value="session">Session</option>
            <option value="keynote">Keynote</option>
            <option value="workshop">Workshop</option>
            <option value="panel">Panel Discussion</option>
            <option value="break">Break</option>
            <option value="networking">Networking</option>
            <option value="other">Other</option>
          </select>
          <ChevronDown
            class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock, ChevronDown } from 'lucide-vue-next'

interface Props {
  date: string
  agendaType: string
}

interface Emits {
  'update:date': [value: string]
  'update:agenda-type': [value: string]
}

defineProps<Props>()
defineEmits<Emits>()
</script>
