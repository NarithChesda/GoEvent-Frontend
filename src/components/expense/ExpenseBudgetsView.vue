<template>
  <div class="space-y-6">
    <!-- Header with Add Budget Button -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Budget Management</h3>
        <p class="text-sm text-slate-500 mt-1">Set and track spending limits for each category</p>
      </div>
      <button
        v-if="canEdit"
        @click="showAddBudgetModal = true"
        class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
      >
        <Plus class="w-4 h-4" />
        <span>Add Budget</span>
      </button>
    </div>

    <!-- Budget List -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Budget Card 1: Venue -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Building2 class="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h4 class="font-bold text-slate-900">Venue</h4>
              <p class="text-xs text-slate-500">Venue rental and facility costs</p>
            </div>
          </div>
          <div v-if="canEdit" class="flex items-center gap-1">
            <button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              <Edit2 class="w-4 h-4" />
            </button>
            <button class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <!-- Budget Amount -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">Budgeted</span>
            <span class="text-lg font-bold text-slate-900">$5,000.00</span>
          </div>

          <!-- Spent Amount -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">Spent</span>
            <span class="text-lg font-bold text-emerald-600">$4,500.00</span>
          </div>

          <!-- Remaining Amount -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <span class="text-sm text-slate-500">Remaining</span>
            <span class="text-lg font-bold text-blue-600">$500.00</span>
          </div>

          <!-- Progress Bar -->
          <div class="pt-2">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-slate-600">Budget Usage</span>
              <span class="text-xs font-bold text-emerald-600">90%</span>
            </div>
            <div class="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div class="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500" style="width: 90%"></div>
            </div>
          </div>

          <!-- Currency & Notes -->
          <div class="pt-3 border-t border-slate-200">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1 text-slate-500">
                <DollarSign class="w-3 h-3" />
                <span>USD</span>
              </div>
              <span class="text-slate-400">Maximum budget for venue rental</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Budget Card 2: Catering (Over Budget) -->
      <div class="bg-red-50/50 border border-red-200/50 rounded-2xl shadow-lg shadow-red-500/10 p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <UtensilsCrossed class="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h4 class="font-bold text-slate-900 flex items-center gap-2">
                Catering
                <span class="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">Over Budget</span>
              </h4>
              <p class="text-xs text-slate-500">Food and beverage expenses</p>
            </div>
          </div>
          <div v-if="canEdit" class="flex items-center gap-1">
            <button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              <Edit2 class="w-4 h-4" />
            </button>
            <button class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <!-- Budget Amount -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">Budgeted</span>
            <span class="text-lg font-bold text-slate-900">$8,000.00</span>
          </div>

          <!-- Spent Amount -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">Spent</span>
            <span class="text-lg font-bold text-red-600">$8,500.00</span>
          </div>

          <!-- Over Budget Amount -->
          <div class="flex items-center justify-between pb-3 border-b border-red-200">
            <span class="text-sm text-slate-500">Over Budget</span>
            <span class="text-lg font-bold text-red-600">-$500.00</span>
          </div>

          <!-- Progress Bar -->
          <div class="pt-2">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-slate-600">Budget Usage</span>
              <div class="flex items-center gap-1">
                <AlertTriangle class="w-3 h-3 text-red-600" />
                <span class="text-xs font-bold text-red-600">106%</span>
              </div>
            </div>
            <div class="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div class="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500" style="width: 100%"></div>
            </div>
          </div>

          <!-- Currency & Notes -->
          <div class="pt-3 border-t border-red-200">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1 text-slate-500">
                <DollarSign class="w-3 h-3" />
                <span>USD</span>
              </div>
              <span class="text-slate-400">Food and drinks for 200 guests</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Budget Card 3: Decoration -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 p-6 hover:shadow-xl transition-all duration-300">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Palette class="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 class="font-bold text-slate-900">Decoration</h4>
              <p class="text-xs text-slate-500">Floral arrangements, lighting, and décor</p>
            </div>
          </div>
          <div v-if="canEdit" class="flex items-center gap-1">
            <button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
              <Edit2 class="w-4 h-4" />
            </button>
            <button class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <!-- Budget Amount -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">Budgeted</span>
            <span class="text-lg font-bold text-slate-900">$3,000.00</span>
          </div>

          <!-- Spent Amount -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">Spent</span>
            <span class="text-lg font-bold text-purple-600">$2,800.00</span>
          </div>

          <!-- Remaining Amount -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <span class="text-sm text-slate-500">Remaining</span>
            <span class="text-lg font-bold text-blue-600">$200.00</span>
          </div>

          <!-- Progress Bar -->
          <div class="pt-2">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-slate-600">Budget Usage</span>
              <span class="text-xs font-bold text-purple-600">93%</span>
            </div>
            <div class="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div class="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500" style="width: 93%"></div>
            </div>
          </div>

          <!-- Currency & Notes -->
          <div class="pt-3 border-t border-slate-200">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1 text-slate-500">
                <DollarSign class="w-3 h-3" />
                <span>USD</span>
              </div>
              <span class="text-slate-400">Flowers, lighting, and table decorations</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Budget Placeholder Card -->
      <div
        v-if="canEdit"
        @click="showAddBudgetModal = true"
        class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-6 hover:bg-slate-100/50 hover:border-emerald-400 transition-all duration-300 cursor-pointer group"
      >
        <div class="flex flex-col items-center justify-center h-full min-h-[280px]">
          <div class="w-16 h-16 bg-slate-200 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
            <Plus class="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h4 class="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Add New Budget</h4>
          <p class="text-sm text-slate-400 mt-1">Set budget for another category</p>
        </div>
      </div>
    </div>

    <!-- Add Budget Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAddBudgetModal"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="showAddBudgetModal = false"
        >
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-slate-900">Add Budget</h3>
              <button
                @click="showAddBudgetModal = false"
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <form @submit.prevent="handleAddBudget" class="space-y-4">
              <!-- Category Selection -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  v-model="newBudget.category_id"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="1">Venue</option>
                  <option value="2">Catering</option>
                  <option value="3">Decoration</option>
                  <option value="4">Photography</option>
                  <option value="5">Entertainment</option>
                </select>
              </div>

              <!-- Budget Amount -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Budget Amount</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign class="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    v-model="newBudget.budgeted_amount"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <!-- Currency -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Currency</label>
                <select
                  v-model="newBudget.currency"
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="KHR">KHR - Cambodian Riel</option>
                </select>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
                <textarea
                  v-model="newBudget.notes"
                  rows="3"
                  placeholder="Add any notes about this budget..."
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                ></textarea>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  @click="showAddBudgetModal = false"
                  class="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Add Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Building2,
  UtensilsCrossed,
  Palette,
  AlertTriangle,
  X
} from 'lucide-vue-next'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

const showAddBudgetModal = ref(false)

const newBudget = ref({
  category_id: '',
  budgeted_amount: null,
  currency: 'USD',
  notes: ''
})

const handleAddBudget = () => {
  // API logic will be added by vue-api-specialist agent
  console.log('Adding budget:', newBudget.value)
  showAddBudgetModal.value = false
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9);
}
</style>
