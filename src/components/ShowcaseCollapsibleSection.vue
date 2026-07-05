<template>
  <section>
    <!-- Header card (click to expand/collapse) -->
    <button
      type="button"
      class="w-full flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-5 text-left transition-colors duration-200 hover:bg-white/90 active:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
      :aria-expanded="expanded"
      @click="toggle"
    >
      <div
        class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2ecc71]/15 to-[#1e90ff]/15 flex items-center justify-center flex-shrink-0"
        aria-hidden="true"
      >
        <component :is="icon" class="w-5 h-5 text-[#2ecc71]" />
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h5 class="font-semibold text-slate-900 truncate">{{ title }}</h5>
          <span
            v-if="count !== undefined"
            class="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0"
          >
            {{ count }}
          </span>
        </div>
        <p class="text-sm text-slate-600 line-clamp-1">{{ subtitle }}</p>
      </div>

      <ChevronDown
        class="w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200"
        :class="{ 'rotate-180': expanded }"
        aria-hidden="true"
      />
    </button>

    <!-- Lazy-mounted body: children mount on first expand and stay mounted after -->
    <Transition name="section-fade">
      <div v-if="hasExpanded" v-show="expanded" class="mt-4">
        <slot />
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { ref, type Component } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

interface Props {
  title: string
  subtitle: string
  icon: Component
  count?: number
}

defineProps<Props>()

const expanded = ref(false)
const hasExpanded = ref(false)

const toggle = () => {
  expanded.value = !expanded.value
  if (expanded.value) hasExpanded.value = true
}
</script>

<style scoped>
.section-fade-enter-active {
  transition: all 0.25s ease-out;
}

.section-fade-leave-active {
  transition: all 0.2s ease-in;
}

.section-fade-enter-from,
.section-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
