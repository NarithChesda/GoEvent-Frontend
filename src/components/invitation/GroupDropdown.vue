<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="w-full flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium transition-all duration-200 hover:border-emerald-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
    >
      <Users class="w-4 h-4 text-emerald-600 flex-shrink-0" />
      <span class="flex-1 text-left text-slate-900 truncate">
        {{ selectedGroup?.name || placeholder }}
      </span>
      <ChevronDown
        class="w-4 h-4 text-slate-400 transition-transform flex-shrink-0"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-[300px] overflow-y-auto"
      >
        <div
          v-for="group in groups"
          :key="group.id"
          class="group/item relative border-b border-slate-100 last:border-b-0"
        >
          <div
            :class="[
              'flex items-center gap-2 px-3 py-2.5 transition-all duration-200',
              modelValue === group.id
                ? 'bg-gradient-to-r from-emerald-500 to-sky-500'
                : 'hover:bg-slate-50'
            ]"
          >
            <!-- Clickable area for selection -->
            <button
              type="button"
              @click="selectGroup(group.id)"
              :class="[
                'flex-1 flex items-center gap-3 text-sm font-medium min-w-0',
                modelValue === group.id ? 'text-white' : 'text-slate-700'
              ]"
            >
              <div
                class="w-3 h-3 rounded-full flex-shrink-0"
                :style="{ backgroundColor: modelValue === group.id ? 'white' : (group.color || '#3498db') }"
              />
              <span class="flex-1 text-left truncate">{{ group.name }}</span>
              <span :class="['text-xs', modelValue === group.id ? 'text-white/80' : 'text-slate-400']">({{ group.guest_count }})</span>
            </button>
            <!-- Edit/Delete Actions - Always visible when showActions is true -->
            <div
              v-if="showActions"
              class="flex items-center gap-0.5 flex-shrink-0 ml-1"
            >
              <button
                type="button"
                @click.stop="handleEditGroup(group)"
                :title="`Edit ${group.name}`"
                :class="[
                  'p-1.5 rounded-md transition-all',
                  modelValue === group.id
                    ? 'text-white/90 hover:text-white hover:bg-white/20'
                    : 'text-slate-400 hover:text-blue-600 hover:bg-blue-100'
                ]"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                type="button"
                @click.stop="handleDeleteGroup(group)"
                :title="`Delete ${group.name}`"
                :class="[
                  'p-1.5 rounded-md transition-all',
                  modelValue === group.id
                    ? 'text-white/90 hover:text-white hover:bg-white/20'
                    : 'text-slate-400 hover:text-red-600 hover:bg-red-100'
                ]"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Users, ChevronDown, Edit2, Trash2 } from 'lucide-vue-next'
import type { GuestGroup } from '../../services/api'

const props = withDefaults(defineProps<{
  modelValue: number | null
  groups: GuestGroup[]
  placeholder?: string
  showActions?: boolean
}>(), {
  placeholder: 'Choose a group...',
  showActions: false
})

const emit = defineEmits<{
  'update:modelValue': [id: number]
  change: [id: number]
  'edit-group': [group: GuestGroup]
  'delete-group': [group: GuestGroup]
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// Close dropdown when clicking outside
onClickOutside(dropdownRef, () => {
  isOpen.value = false
})

const selectedGroup = computed(() => {
  if (!props.modelValue) return null
  return props.groups.find(g => g.id === props.modelValue)
})

const selectGroup = (groupId: number) => {
  emit('update:modelValue', groupId)
  emit('change', groupId)
  isOpen.value = false
}

const handleEditGroup = (group: GuestGroup) => {
  emit('edit-group', group)
  isOpen.value = false
}

const handleDeleteGroup = (group: GuestGroup) => {
  emit('delete-group', group)
  isOpen.value = false
}
</script>

<style scoped>
/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
