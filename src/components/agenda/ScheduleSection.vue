<template>
  <div class="space-y-3 sm:space-y-4">
    <h4 class="text-sm font-semibold text-slate-900 flex items-center">
      <Clock class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
      Schedule
    </h4>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      <!-- Date -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
        <input
          :value="date"
          @input="$emit('update:date', ($event.target as HTMLInputElement).value)"
          type="date"
          class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
        />
      </div>

      <!-- Agenda Type -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
        <div class="relative">
          <select
            :value="agendaType"
            @input="$emit('update:agenda-type', ($event.target as HTMLSelectElement).value)"
            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
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

    <!-- Order Control (Mobile Only) -->
    <div v-if="maxOrder > 0" class="sm:hidden">
      <label class="block text-sm font-medium text-slate-700 mb-2">
        <span class="flex items-center gap-1.5">
          <ArrowUpDown class="w-3.5 h-3.5" />
          Display Position
        </span>
      </label>
      <div class="flex items-center gap-2">
        <!-- Move to First -->
        <button
          type="button"
          @click="moveToFirst"
          :disabled="order <= 0"
          class="p-2 rounded-lg border transition-all duration-150"
          :class="order <= 0
            ? 'border-slate-200 text-slate-300 cursor-not-allowed'
            : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 active:bg-slate-200'"
          title="Move to first"
        >
          <ChevronsUp class="w-4 h-4" />
        </button>

        <!-- Move Up -->
        <button
          type="button"
          @click="moveUp"
          :disabled="order <= 0"
          class="p-2 rounded-lg border transition-all duration-150"
          :class="order <= 0
            ? 'border-slate-200 text-slate-300 cursor-not-allowed'
            : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 active:bg-slate-200'"
          title="Move up"
        >
          <ChevronUp class="w-4 h-4" />
        </button>

        <!-- Position Display -->
        <div class="flex-1 text-center">
          <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg">
            <span class="text-sm font-semibold text-slate-900">{{ order + 1 }}</span>
            <span class="text-xs text-slate-500">of {{ maxOrder + 1 }}</span>
          </span>
        </div>

        <!-- Move Down -->
        <button
          type="button"
          @click="moveDown"
          :disabled="order >= maxOrder"
          class="p-2 rounded-lg border transition-all duration-150"
          :class="order >= maxOrder
            ? 'border-slate-200 text-slate-300 cursor-not-allowed'
            : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 active:bg-slate-200'"
          title="Move down"
        >
          <ChevronDownIcon class="w-4 h-4" />
        </button>

        <!-- Move to Last -->
        <button
          type="button"
          @click="moveToLast"
          :disabled="order >= maxOrder"
          class="p-2 rounded-lg border transition-all duration-150"
          :class="order >= maxOrder
            ? 'border-slate-200 text-slate-300 cursor-not-allowed'
            : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 active:bg-slate-200'"
          title="Move to last"
        >
          <ChevronsDown class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  ChevronsDown,
  ChevronDown as ChevronDownIcon,
  ArrowUpDown
} from 'lucide-vue-next'

interface Props {
  date: string
  agendaType: string
  order: number
  maxOrder: number
}

interface Emits {
  'update:date': [value: string]
  'update:agenda-type': [value: string]
  'update:order': [value: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Move order control functions
const moveUp = () => {
  if (props.order > 0) {
    emit('update:order', props.order - 1)
  }
}

const moveDown = () => {
  if (props.order < props.maxOrder) {
    emit('update:order', props.order + 1)
  }
}

const moveToFirst = () => {
  emit('update:order', 0)
}

const moveToLast = () => {
  emit('update:order', props.maxOrder)
}
</script>
