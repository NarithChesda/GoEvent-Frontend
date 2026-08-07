<template>
  <div>
    <!-- Collapsed dashed pill -->
    <button
      v-if="!isExpanded"
      type="button"
      @click="expand"
      :disabled="groups.length === 0"
      class="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 border-2 border-dashed border-slate-300 rounded-2xl hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <UserPlus class="w-4 h-4" />
      <span>{{ groups.length === 0 ? t('management.guestGroupsView.quickAdd.noGroupsHint') : t('management.guestGroupsView.quickAdd.addGuestPill') }}</span>
    </button>

    <!-- Expanded inline form -->
    <div v-else class="bg-white rounded-2xl ring-1 ring-sky-200 p-2.5 flex items-center gap-2">
      <input
        ref="nameInputRef"
        v-model="name"
        type="text"
        :placeholder="t('management.guestGroupsView.quickAdd.namePlaceholder')"
        @keydown.enter.prevent="submit"
        @keydown.esc.prevent="collapse"
        class="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
      />

      <!-- Compact group picker -->
      <div class="relative flex-shrink-0" ref="groupPickerRef">
        <button
          type="button"
          @click="showGroupDropdown = !showGroupDropdown"
          class="flex items-center gap-1.5 px-2.5 py-2 text-sm border border-slate-200 rounded-lg hover:border-slate-300 bg-white transition-colors"
        >
          <span
            v-if="selectedGroup"
            class="w-2 h-2 rounded-full flex-shrink-0"
            :style="{ backgroundColor: selectedGroup.color || '#64748b' }"
          ></span>
          <span class="truncate max-w-[90px]">{{ selectedGroup ? selectedGroup.name : t('management.guestGroupsView.quickAdd.pickGroup') }}</span>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        </button>

        <Transition name="dropdown">
          <div
            v-if="showGroupDropdown"
            class="absolute top-full right-0 mt-1 min-w-[11.25rem] bg-white border border-slate-200 rounded-xl shadow-lg z-[100] max-h-64 overflow-y-auto"
          >
            <div class="p-1.5">
              <button
                v-for="group in groups"
                :key="group.id"
                type="button"
                @click="selectGroup(group.id)"
                :class="[
                  'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-left transition-colors',
                  group.id === selectedGroupId ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white' : 'text-slate-700 hover:bg-slate-50',
                ]"
              >
                <span
                  class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: group.id === selectedGroupId ? 'white' : (group.color || '#64748b') }"
                ></span>
                <span class="flex-1 truncate">{{ group.name }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <button
        type="button"
        @click="submit"
        :disabled="!canSubmit"
        class="flex items-center justify-center w-9 h-9 flex-shrink-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:opacity-90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        :title="t('management.guestGroupsView.quickAdd.save')"
      >
        <Check class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="collapse"
        class="flex items-center justify-center w-9 h-9 flex-shrink-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        :title="t('management.guestGroupsView.quickAdd.cancel')"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { UserPlus, ChevronDown, Check, X } from 'lucide-vue-next'
import type { GuestGroup } from '../../services/api'

const { t } = useI18n()

const props = defineProps<{
  groups: GuestGroup[]
  defaultGroupId: number | null
}>()

const emit = defineEmits<{
  'quick-add': [name: string, groupId: number]
}>()

const isExpanded = ref(false)
const name = ref('')
const selectedGroupId = ref<number | null>(props.defaultGroupId)
const showGroupDropdown = ref(false)
const nameInputRef = ref<HTMLInputElement | null>(null)
const groupPickerRef = ref<HTMLElement | null>(null)

// Keep the picker in sync with the active filter, but only while collapsed
// so we don't yank the group out from under someone mid-compose.
watch(
  () => props.defaultGroupId,
  (id) => {
    if (!isExpanded.value) selectedGroupId.value = id
  },
)

const selectedGroup = computed(() => props.groups.find((g) => g.id === selectedGroupId.value) ?? null)
const canSubmit = computed(() => name.value.trim().length >= 2 && selectedGroupId.value !== null)

const expand = () => {
  if (props.groups.length === 0) return
  isExpanded.value = true
  nextTick(() => nameInputRef.value?.focus())
}

const collapse = () => {
  isExpanded.value = false
  name.value = ''
  showGroupDropdown.value = false
}

const selectGroup = (groupId: number) => {
  selectedGroupId.value = groupId
  showGroupDropdown.value = false
}

const submit = () => {
  if (!canSubmit.value || selectedGroupId.value === null) return
  emit('quick-add', name.value.trim(), selectedGroupId.value)
  // Stay expanded and refocus so several guests can be added back-to-back.
  name.value = ''
  nextTick(() => nameInputRef.value?.focus())
}

const handleClickOutside = (event: MouseEvent) => {
  if (showGroupDropdown.value && groupPickerRef.value && !groupPickerRef.value.contains(event.target as Node)) {
    showGroupDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
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
</style>
