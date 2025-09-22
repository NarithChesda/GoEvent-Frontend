<template>
  <div class="flex items-center space-x-4">
    <div :class="iconContainerClasses">
      <Calendar v-if="icon === 'calendar'" class="w-5 h-5 text-[#1e90ff]" />
      <MapPin v-else-if="icon === 'map-pin'" class="w-5 h-5 text-green-600" />
      <Monitor v-else-if="icon === 'monitor'" class="w-5 h-5 text-[#1e90ff]" />
      <Users v-else-if="icon === 'users'" class="w-5 h-5 text-purple-600" />
      <Clock v-else-if="icon === 'clock'" class="w-5 h-5 text-orange-600" />
    </div>
    <div class="flex-1">
      <p class="text-lg font-semibold text-slate-800 mb-1 leading-snug">{{ title }}</p>
      <p class="text-base text-slate-600 leading-relaxed">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar, MapPin, Monitor, Users, Clock } from 'lucide-vue-next'

interface Props {
  icon: 'calendar' | 'map-pin' | 'monitor' | 'users' | 'clock'
  title: string
  subtitle: string
}

const props = defineProps<Props>()

const iconContainerClasses = computed(() => {
  const baseClasses = 'w-12 h-12 rounded-xl flex items-center justify-center'

  switch (props.icon) {
    case 'calendar':
      return `${baseClasses} bg-[#B0E0E6]`
    case 'map-pin':
      return `${baseClasses} bg-green-100`
    case 'monitor':
      return `${baseClasses} bg-[#B0E0E6]`
    case 'users':
      return `${baseClasses} bg-purple-100`
    case 'clock':
      return `${baseClasses} bg-orange-100`
    default:
      return `${baseClasses} bg-slate-100`
  }
})
</script>
