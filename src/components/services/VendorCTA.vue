<template>
  <div class="mt-12 bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10 rounded-3xl p-6 sm:p-8 border border-[#2ecc71]/20">
    <div class="flex flex-col md:flex-row items-center gap-6">
      <div class="flex-shrink-0">
        <div class="w-20 h-20 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-2xl flex items-center justify-center">
          <Store class="w-10 h-10 text-white" />
        </div>
      </div>
      <div class="flex-1 text-center md:text-left">
        <h3 class="text-xl font-bold text-slate-900 mb-2">
          Are you an event vendor?
        </h3>
        <p class="text-slate-600 mb-4">
          List your services on GoEvent and reach thousands of event organizers. Get verified, showcase your work, and grow your business.
        </p>
        <div class="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
          <button
            @click="$emit('list-service')"
            class="px-6 py-3 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30"
          >
            List Your Service
          </button>
          <button
            @click="$emit('learn-more')"
            class="px-6 py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-medium transition-colors"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Store } from 'lucide-vue-next'

defineEmits<{
  'list-service': []
  'learn-more': []
}>()
</script>
