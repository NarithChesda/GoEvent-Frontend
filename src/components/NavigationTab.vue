<template>
  <button @click="$emit('click')" :class="buttonClasses">
    <component :is="iconComponent" class="w-4 h-4" :class="{ 'lg:w-5 lg:h-5': !isMobile }" />
    <span>{{ displayLabel }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Calendar,
  FileText,
  Users,
  UserPlus,
  ImageIcon,
  Monitor,
  CreditCard,
} from 'lucide-vue-next'
import type { TabConfig } from './EventNavigationTabs.vue'

interface Props {
  tab: TabConfig
  isActive: boolean
  isMobile: boolean
}

interface Emits {
  click: []
}

const props = defineProps<Props>()
defineEmits<Emits>()

const iconComponent = computed(() => {
  const iconMap = {
    calendar: Calendar,
    'file-text': FileText,
    users: Users,
    'user-plus': UserPlus,
    image: ImageIcon,
    monitor: Monitor,
    'credit-card': CreditCard,
  }
  return iconMap[props.tab.icon as keyof typeof iconMap] || Calendar
})

const displayLabel = computed(() => {
  if (props.isMobile && props.tab.mobileLabel) {
    return props.tab.mobileLabel
  }
  return props.tab.label
})

const buttonClasses = computed(() => {
  const baseClasses = 'flex items-center font-medium text-sm transition-all duration-200'
  const activeClasses = 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-lg'
  const inactiveClasses = 'text-slate-600 hover:bg-[#E6F4FF] hover:text-[#1873cc]'

  if (props.isMobile) {
    return `${baseClasses} space-x-2 px-4 py-2 rounded-xl whitespace-nowrap flex-shrink-0 ${
      props.isActive ? activeClasses : inactiveClasses
    }`
  } else {
    return `${baseClasses} space-x-3 w-full px-4 py-3 text-left rounded-xl ${
      props.isActive ? activeClasses : inactiveClasses
    }`
  }
})
</script>
