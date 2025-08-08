<template>
  <div v-if="agendaItems.length > 0" class="mb-8">
    <h2 
      class="text-xl font-semibold mb-6 text-center" 
      :style="{ 
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }"
    >
      Event Schedule
    </h2>
    
    <!-- Tab Navigation -->
    <div v-if="agendaTabs.length > 1" class="flex flex-wrap gap-2 mb-6 justify-center">
      <button
        v-for="date in agendaTabs"
        :key="date"
        @click="activeAgendaDate = date"
        class="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
        :class="activeAgendaDate === date ? 'glass-section-light' : 'glass-section'"
        :style="activeAgendaDate === date ? { 
          color: primaryColor,
          borderColor: primaryColor,
          borderWidth: '1px',
          borderStyle: 'solid'
        } : { 
          color: primaryColor,
          opacity: '0.7'
        }"
      >
        {{ formatAgendaDate(date) }}
      </button>
    </div>
    
    <!-- Tab Content -->
    <div class="space-y-4">
      <div
        v-for="item in agendaByDate[activeAgendaDate] || []"
        :key="item.id"
        class="ml-4 md:ml-12"
      >
        <AgendaItem
          :item="item"
          :primary-color="primaryColor"
          :accent-color="accentColor"
        />
      </div>
    </div>
    
    <!-- Agenda Section Endline -->
    <div class="flex justify-center mt-6">
      <div class="w-16 h-px opacity-30" :style="{ backgroundColor: primaryColor }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AgendaItem from './AgendaItem.vue'

interface AgendaItemIcon {
  id: number
  name: string
  svg_code: string
}

interface AgendaItemData {
  id: number
  title: string
  description?: string
  color?: string
  date?: string
  start_time_text?: string
  end_time_text?: string
  order?: number
  icon?: AgendaItemIcon
}

interface Props {
  agendaItems: AgendaItemData[]
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
}

const props = defineProps<Props>()
const activeAgendaTab = ref<string>('')

// Group agenda items by date
const agendaByDate = computed(() => {
  const grouped: Record<string, AgendaItemData[]> = {}
  
  props.agendaItems.forEach(item => {
    const date = item.date || 'No Date'
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(item)
  })
  
  // Sort items within each date by order
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => (a.order || 0) - (b.order || 0))
  })
  
  return grouped
})

// Get sorted date tabs
const agendaTabs = computed(() => {
  const dates = Object.keys(agendaByDate.value)
  return dates.sort((a, b) => {
    if (a === 'No Date') return 1
    if (b === 'No Date') return -1
    return new Date(a).getTime() - new Date(b).getTime()
  })
})

// Set active tab to first date when agenda loads
const activeAgendaDate = computed({
  get: () => activeAgendaTab.value || agendaTabs.value[0] || '',
  set: (value: string) => {
    activeAgendaTab.value = value
  }
})

const formatAgendaDate = (dateString: string): string => {
  if (dateString === 'No Date') return 'TBD'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}
</script>

<style scoped>
.glass-section {
  background: rgba(255, 255, 255, 0.20);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.glass-section-light {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
</style>