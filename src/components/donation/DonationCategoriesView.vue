<template>
  <div class="space-y-4">
    <!-- Header Card -->
    <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
      <div class="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Item Categories</p>
          <p class="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 transition-all duration-300">
            {{ totalItemsDonated }}
          </p>
          <p class="mt-1 text-xs sm:text-sm text-slate-500">
            items donated across {{ totalCategories }} {{ totalCategories === 1 ? 'category' : 'categories' }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold ring-1 bg-purple-50 text-purple-600 ring-purple-200">
            <Users class="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            <span>{{ totalItemDonors }} donor{{ totalItemDonors !== 1 ? 's' : '' }}</span>
          </div>
          <button
            v-if="canEdit"
            @click="$emit('add-category')"
            class="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all duration-200"
          >
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">Add Category</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Categories List -->
    <div v-if="categories.length > 0" class="space-y-3">
      <div
        v-for="category in categories"
        :key="category.id"
        class="bg-white/80 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-white overflow-hidden transition-all duration-200"
      >
        <!-- Category Card -->
        <div class="px-4 py-3 sm:p-4">
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-100"
            >
              <Package class="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>

            <!-- Info Section -->
            <div class="flex-1 min-w-0">
              <!-- Top Row: Name + Badge + Actions -->
              <div class="flex items-start justify-between gap-2 mb-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <h4 class="font-semibold text-slate-900 truncate">{{ category.name }}</h4>
                  <span
                    v-if="!category.is_active"
                    class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wide flex-shrink-0"
                  >
                    Inactive
                  </span>
                </div>
                <div v-if="canEdit" class="flex items-center gap-1 flex-shrink-0">
                  <button
                    @click.stop="$emit('edit-category', category)"
                    class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit category"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click.stop="$emit('delete-category', category)"
                    class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete category"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Progress Bar (if target exists) -->
              <div v-if="category.target_quantity" class="mb-2">
                <div class="flex items-baseline justify-between mb-1">
                  <span class="font-bold text-slate-900 tabular-nums">
                    {{ category.total_quantity }} / {{ category.target_quantity }} {{ category.unit }}
                  </span>
                  <span class="text-xs font-semibold text-purple-600 tabular-nums">
                    {{ category.progress_percentage ?? 0 }}%
                  </span>
                </div>
                <div class="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                  <div
                    class="h-full transition-all duration-700 ease-out bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600"
                    :style="{ width: `${Math.min(category.progress_percentage ?? 0, 100)}%` }"
                  ></div>
                </div>
              </div>

              <!-- No target - just show count -->
              <div v-else class="font-bold text-slate-900 tabular-nums mb-2">
                {{ category.total_quantity }} {{ category.unit }}
              </div>

              <!-- Description -->
              <p v-if="category.description" class="text-sm text-slate-600 line-clamp-1">
                {{ category.description }}
              </p>

              <!-- Stats Row -->
              <div class="flex items-center gap-4 mt-2 text-xs text-slate-500">
                <span class="flex items-center gap-1">
                  <Users class="w-3 h-3" />
                  {{ category.donation_count }} donor{{ category.donation_count !== 1 ? 's' : '' }}
                </span>
                <span class="flex items-center gap-1">
                  <Boxes class="w-3 h-3" />
                  {{ category.total_quantity }} {{ category.unit }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="rounded-3xl border border-white/70 bg-white p-8 sm:p-12 shadow-lg shadow-slate-200/60 text-center">
      <Boxes class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
      <h4 class="text-lg font-semibold text-slate-900 mb-1">No item categories yet</h4>
      <p class="text-sm text-slate-500 mb-4 max-w-md mx-auto">
        Create categories to organize item donations (e.g., "Instant Noodles", "Bottled Water")
      </p>
      <button
        v-if="canEdit"
        @click="$emit('add-category')"
        class="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all duration-200 mx-auto"
      >
        <Plus class="w-4 h-4" />
        Add First Category
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Package, Plus, Pencil, Trash2, Users, Boxes } from 'lucide-vue-next'
import type { DonationItemCategory } from '@/services/api/types/donation.types'

interface Props {
  categories: DonationItemCategory[]
  canEdit: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'add-category': []
  'edit-category': [category: DonationItemCategory]
  'delete-category': [category: DonationItemCategory]
}>()

// Computed stats
const totalCategories = computed(() => props.categories.length)

const totalItemsDonated = computed(() =>
  props.categories.reduce((sum, cat) => sum + cat.total_quantity, 0)
)

const totalItemDonors = computed(() =>
  props.categories.reduce((sum, cat) => sum + cat.donation_count, 0)
)
</script>
