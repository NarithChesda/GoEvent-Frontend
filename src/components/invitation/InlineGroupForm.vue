<template>
  <!-- Create -->
  <div v-if="mode === 'create'" class="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
    <div class="flex items-center gap-2 text-purple-700 mb-2">
      <Users class="w-4 h-4" />
      <span class="text-sm font-medium">{{ t('management.guestGroupsView.addGuestModal.group.newGroupForm.title') }}</span>
    </div>
    <input
      ref="nameInputRef"
      v-model="name"
      type="text"
      :placeholder="t('management.guestGroupsView.addGuestModal.group.newGroupForm.namePlaceholder')"
      class="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
    />
    <input
      v-model="description"
      type="text"
      :placeholder="t('management.guestGroupsView.addGuestModal.group.newGroupForm.descPlaceholder')"
      class="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
    />
    <div class="flex items-center gap-3">
      <input
        v-model="color"
        type="color"
        class="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer flex-shrink-0"
        :aria-label="t('management.guestGroupsView.addGuestModal.group.colorLabel')"
      />
      <input
        v-model="color"
        type="text"
        placeholder="#3498db"
        pattern="^#[0-9A-Fa-f]{6}$"
        maxlength="7"
        class="flex-1 min-w-0 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white font-mono"
      />
    </div>
    <div class="flex justify-end gap-2">
      <button
        type="button"
        @click="$emit('cancel')"
        :title="t('management.guestGroupsView.addGuestModal.group.cancelBtn')"
        :aria-label="t('management.guestGroupsView.addGuestModal.group.cancelBtn')"
        class="flex items-center justify-center w-9 h-9 text-purple-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="submitCreateOrEdit"
        :disabled="!name.trim() || isSubmitting"
        :title="t('management.guestGroupsView.addGuestModal.group.newGroupForm.createBtn')"
        :aria-label="t('management.guestGroupsView.addGuestModal.group.newGroupForm.createBtn')"
        class="flex items-center justify-center w-9 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isSubmitting" class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
        <Check v-else class="w-4 h-4" />
      </button>
    </div>
  </div>

  <!-- Edit -->
  <div v-else-if="mode === 'edit'" class="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-blue-700">
        <Edit2 class="w-4 h-4" />
        <span class="text-sm font-medium">{{ t('management.guestGroupsView.addGuestModal.group.editGroupForm.title') }}</span>
      </div>
      <button
        type="button"
        @click="$emit('cancel')"
        class="p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
    <input
      ref="nameInputRef"
      v-model="name"
      type="text"
      :placeholder="t('management.guestGroupsView.addGuestModal.group.editGroupForm.namePlaceholder')"
      class="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
    />
    <input
      v-model="description"
      type="text"
      :placeholder="t('management.guestGroupsView.addGuestModal.group.editGroupForm.descPlaceholder')"
      class="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
    />
    <div class="flex items-center gap-3">
      <input
        v-model="color"
        type="color"
        class="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer flex-shrink-0"
        :aria-label="t('management.guestGroupsView.addGuestModal.group.colorLabel')"
      />
      <input
        v-model="color"
        type="text"
        placeholder="#3498db"
        pattern="^#[0-9A-Fa-f]{6}$"
        maxlength="7"
        class="flex-1 min-w-0 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white font-mono"
      />
    </div>
    <div class="flex justify-end gap-2">
      <button
        type="button"
        @click="$emit('cancel')"
        :title="t('management.guestGroupsView.addGuestModal.group.editGroupForm.cancelBtn')"
        :aria-label="t('management.guestGroupsView.addGuestModal.group.editGroupForm.cancelBtn')"
        class="flex items-center justify-center w-9 h-9 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="submitCreateOrEdit"
        :disabled="!name.trim() || isSubmitting"
        :title="t('management.guestGroupsView.addGuestModal.group.editGroupForm.saveBtn')"
        :aria-label="t('management.guestGroupsView.addGuestModal.group.editGroupForm.saveBtn')"
        class="flex items-center justify-center w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isSubmitting" class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
        <Check v-else class="w-4 h-4" />
      </button>
    </div>
  </div>

  <!-- Delete confirm -->
  <div v-else-if="mode === 'delete'" class="p-3 bg-red-50 border border-red-200 rounded-xl space-y-3">
    <div class="flex items-center gap-2 text-red-700">
      <Trash2 class="w-4 h-4" />
      <span class="text-sm font-medium">{{ t('management.guestGroupsView.addGuestModal.group.deleteGroupConfirm.title') }}</span>
    </div>
    <p class="text-sm text-red-800">
      {{ t('management.guestGroupsView.addGuestModal.group.deleteGroupConfirm.deleteConfirm') }} "<span class="font-semibold">{{ group?.name }}</span>"?
    </p>
    <p v-if="(group?.guest_count ?? 0) > 0" class="text-xs text-red-600 bg-red-100 px-2 py-1.5 rounded-md">
      {{ t('management.guestGroupsView.addGuestModal.group.deleteGroupConfirm.guestWarning', { count: group?.guest_count ?? 0 }) }}
    </p>
    <div class="flex justify-end gap-2">
      <button
        type="button"
        @click="$emit('cancel')"
        :title="t('management.guestGroupsView.addGuestModal.group.deleteGroupConfirm.cancelBtn')"
        :aria-label="t('management.guestGroupsView.addGuestModal.group.deleteGroupConfirm.cancelBtn')"
        class="flex items-center justify-center w-9 h-9 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="$emit('submit')"
        :disabled="isSubmitting"
        :title="t('management.guestGroupsView.addGuestModal.group.deleteGroupConfirm.deleteBtn')"
        :aria-label="t('management.guestGroupsView.addGuestModal.group.deleteGroupConfirm.deleteBtn')"
        class="flex items-center justify-center w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isSubmitting" class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
        <Trash2 v-else class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Users, Edit2, Trash2, X, Check } from 'lucide-vue-next'
import type { GuestGroup } from '../../services/api'
import { DEFAULT_GUEST_GROUP_COLOR } from './guestGroupColors'

const { t } = useI18n()

/**
 * Mount fresh (v-if, not v-show) per open — fields are seeded once from
 * `group` at creation time rather than watched, matching how the parent
 * dropdown/popover already remounts this on every open.
 */
const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit' | 'delete'
    group?: GuestGroup | null
    isSubmitting?: boolean
  }>(),
  { group: null, isSubmitting: false },
)

const emit = defineEmits<{
  submit: [data?: { name: string; description?: string; color: string }]
  cancel: []
}>()

const name = ref(props.mode === 'edit' ? props.group?.name ?? '' : '')
const description = ref(props.mode === 'edit' ? props.group?.description ?? '' : '')
const color = ref(props.mode === 'edit' ? props.group?.color || DEFAULT_GUEST_GROUP_COLOR : DEFAULT_GUEST_GROUP_COLOR)

const nameInputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  if (props.mode !== 'delete') {
    nextTick(() => nameInputRef.value?.focus())
  }
})

const submitCreateOrEdit = () => {
  if (!name.value.trim()) return
  emit('submit', {
    name: name.value.trim(),
    description: description.value.trim() || undefined,
    color: color.value,
  })
}
</script>
