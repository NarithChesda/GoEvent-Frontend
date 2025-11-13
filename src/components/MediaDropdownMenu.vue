<template>
  <div class="relative">
    <button
      @click.stop="emit('toggle')"
      :disabled="disabled"
      class="text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-3 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <MoreHorizontal class="w-5 h-5" />
    </button>

    <!-- Dropdown menu -->
    <div
      v-if="show"
      @click.stop
      class="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10 min-w-[120px]"
    >
      <button
        @click="emit('replace')"
        :disabled="disabled"
        class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload class="w-4 h-4" />
        <span>Replace</span>
      </button>
      <button
        @click="emit('delete')"
        :disabled="disabled"
        class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X class="w-4 h-4" />
        <span>Delete</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MoreHorizontal, Upload, X } from 'lucide-vue-next'

interface Props {
  show: boolean
  disabled?: boolean
}

interface Emits {
  (e: 'toggle'): void
  (e: 'replace'): void
  (e: 'delete'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>
