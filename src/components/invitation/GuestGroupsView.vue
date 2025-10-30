<template>
  <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
      <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center">
        <Users class="w-5 h-5 text-[#1e90ff] mr-2" />
        Guests
      </h3>
      <div class="flex items-center gap-2">
        <button
          @click="$emit('add-guest')"
          class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center text-sm"
        >
          <UserPlus class="w-4 h-4 mr-1.5 sm:mr-2" />
          <span class="hidden sm:inline">Add Guest</span>
          <span class="sm:hidden">Add</span>
        </button>
      </div>
    </div>

    <!-- Guest Groups Display -->
    <div v-if="loadingGroups" class="text-center py-6 sm:py-8">
      <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:h-8 border-b-2 border-[#1e90ff] mx-auto"></div>
      <p class="text-xs sm:text-sm text-slate-600 mt-2">Loading guest groups...</p>
    </div>

    <div v-else-if="groups.length === 0" class="text-center py-8 sm:py-12">
      <Users class="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-2 sm:mb-3" />
      <p class="text-sm sm:text-base text-slate-500">No guests yet</p>
      <p class="text-xs sm:text-sm text-slate-400 mt-1">
        Add your first guest to get started
      </p>
    </div>

    <!-- Group List -->
    <div v-else class="space-y-3">
      <GuestGroupCard
        v-for="group in groups"
        :key="group.id"
        :ref="(el: any) => $emit('register-group-card', group.id, el)"
        :group="group"
        :guests="getGroupGuests(group.id)"
        :loading="isGroupLoading(group.id)"
        :is-expanded="isGroupExpanded(group.id)"
        :current-page="getGroupPagination(group.id).currentPage"
        :total-count="getGroupPagination(group.id).totalCount"
        :page-size="pageSize"
        :search-term="getGroupPagination(group.id).searchTerm"
        @toggle="$emit('toggle-group', group.id)"
        @edit="$emit('edit-group', group)"
        @delete="$emit('delete-group', group)"
        @copy-link="(guest, language) => $emit('copy-link', guest, language)"
        @mark-sent="(guest) => $emit('mark-sent', guest)"
        @edit-guest="(guest) => $emit('edit-guest', guest)"
        @delete-guest="(guest) => $emit('delete-guest', guest)"
        @next-page="$emit('next-page', group.id)"
        @previous-page="$emit('previous-page', group.id)"
        @search="(searchTerm) => $emit('search', group.id, searchTerm)"
        @bulk-mark-sent="$emit('bulk-mark-sent', group.id)"
        @bulk-delete="$emit('bulk-delete', group.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Users, UserPlus } from 'lucide-vue-next'
import GuestGroupCard from './GuestGroupCard.vue'
import type { GuestGroup, EventGuest } from '../../services/api'

interface Props {
  groups: GuestGroup[]
  loadingGroups: boolean
  pageSize: number
  getGroupGuests: (groupId: number) => EventGuest[]
  isGroupLoading: (groupId: number) => boolean
  isGroupExpanded: (groupId: number) => boolean
  getGroupPagination: (groupId: number) => {
    currentPage: number
    totalCount: number
    searchTerm: string
  }
}

defineProps<Props>()

defineEmits<{
  'add-guest': []
  'toggle-group': [groupId: number]
  'edit-group': [group: GuestGroup]
  'delete-group': [group: GuestGroup]
  'copy-link': [guest: EventGuest, language: 'en' | 'kh']
  'mark-sent': [guest: EventGuest]
  'edit-guest': [guest: EventGuest]
  'delete-guest': [guest: EventGuest]
  'next-page': [groupId: number]
  'previous-page': [groupId: number]
  'search': [groupId: number, searchTerm: string]
  'bulk-mark-sent': [groupId: number]
  'bulk-delete': [groupId: number]
  'register-group-card': [groupId: number, el: any]
}>()
</script>
