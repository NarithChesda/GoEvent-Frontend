<template>
  <!-- Desktop Dropdown -->
  <div
    v-if="variant === 'dropdown'"
    class="relative category-filter-container hidden sm:block"
  >
    <button
      @click.stop="toggleMenu"
      class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/30"
      :class="
        modelValue
          ? 'bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10 text-slate-900 hover:from-[#2ecc71]/20 hover:to-[#1e90ff]/20'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
      "
    >
      <span>{{ modelValue || 'All Categories' }}</span>
      <ChevronDown
        class="w-4 h-4 transition-transform duration-200"
        :class="showMenu ? 'rotate-180' : ''"
      />
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="showMenu"
        class="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden min-w-[180px] z-[100]"
      >
        <button
          @click="selectCategory('')"
          class="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
          :class="
            !modelValue
              ? 'text-[#2ecc71] font-medium bg-[#2ecc71]/5'
              : 'text-slate-700'
          "
        >
          All Categories
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectCategory(category.name)"
          class="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
          :class="
            modelValue === category.name
              ? 'text-[#2ecc71] font-medium bg-[#2ecc71]/5'
              : 'text-slate-700'
          "
        >
          {{ category.name }}
        </button>
      </div>
    </Transition>
  </div>

  <!-- Mobile Horizontal Pills -->
  <div
    v-else
    class="sm:hidden -mx-4 px-4 mb-4 overflow-x-auto scrollbar-hide"
  >
    <div class="flex items-center gap-2 pb-1">
      <button
        @click="selectCategory('')"
        :class="[
          'flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap',
          !modelValue
            ? 'bg-slate-900 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
        ]"
      >
        All
      </button>
      <button
        v-for="category in categories"
        :key="category.id"
        @click="selectCategory(category.name)"
        :class="[
          'flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap',
          modelValue === category.name
            ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
        ]"
      >
        {{ category.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { EventCategory } from '@/services/api'

const props = withDefaults(
  defineProps<{
    modelValue: string
    categories: EventCategory[]
    variant?: 'dropdown' | 'pills'
  }>(),
  {
    variant: 'dropdown',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showMenu = ref(false)

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const selectCategory = (name: string) => {
  emit('update:modelValue', name)
  showMenu.value = false
}

// Handle click outside to close menu
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (showMenu.value && !target.closest('.category-filter-container')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Hide scrollbar for horizontal scroll on mobile */
.scrollbar-hide {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}
</style>
