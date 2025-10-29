<template>
  <div class="space-y-6">
    <!-- Header with Add Expense Button -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Expense Records</h3>
        <p class="text-sm text-slate-500 mt-1">Track all expenses with receipt uploads</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Search & Filter -->
        <div class="relative flex-1 sm:flex-initial">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search expenses..."
            class="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
          />
        </div>
        <button
          v-if="canEdit"
          @click="showAddExpenseModal = true"
          class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 whitespace-nowrap"
        >
          <Plus class="w-4 h-4" />
          <span class="hidden sm:inline">Add Expense</span>
        </button>
      </div>
    </div>

    <!-- Filter Pills -->
    <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
      <button
        v-for="filter in categoryFilters"
        :key="filter.id"
        @click="activeFilter = filter.id"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap',
          activeFilter === filter.id
            ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
            : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
        ]"
      >
        <component :is="filter.icon" class="w-4 h-4" />
        <span>{{ filter.label }}</span>
      </button>
    </div>

    <!-- Expense List -->
    <div class="space-y-3">
      <!-- Expense Item 1 -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 p-6 hover:shadow-xl transition-all duration-300 group">
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          <!-- Category Icon -->
          <div class="flex items-start gap-4 flex-1 min-w-0">
            <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 class="w-6 h-6 text-red-600" />
            </div>

            <!-- Expense Details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4 mb-2">
                <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-slate-900 mb-1">Grand Ballroom rental for wedding reception</h4>
                  <div class="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <div class="flex items-center gap-1">
                      <Calendar class="w-3.5 h-3.5" />
                      <span>Oct 15, 2025</span>
                    </div>
                    <span class="text-slate-300">•</span>
                    <div class="flex items-center gap-1">
                      <Building2 class="w-3.5 h-3.5" />
                      <span>Luxury Hotel Group</span>
                    </div>
                    <span class="text-slate-300">•</span>
                    <div class="flex items-center gap-1">
                      <CreditCard class="w-3.5 h-3.5" />
                      <span>Bank Transfer</span>
                    </div>
                  </div>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-2xl font-bold text-slate-900">$4,500</p>
                  <p class="text-xs text-slate-500">USD</p>
                </div>
              </div>

              <!-- Notes -->
              <div class="mb-3 p-3 bg-slate-50 rounded-lg">
                <p class="text-sm text-slate-600">Includes setup, teardown, and audio-visual equipment</p>
              </div>

              <!-- Receipt & Actions -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    <Paperclip class="w-3.5 h-3.5" />
                    <span class="text-xs font-medium">Receipt Attached</span>
                  </div>
                  <button class="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Eye class="w-3.5 h-3.5" />
                    <span class="text-xs font-medium">View</span>
                  </button>
                </div>

                <div v-if="canEdit" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Expense Item 2 -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 p-6 hover:shadow-xl transition-all duration-300 group">
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          <div class="flex items-start gap-4 flex-1 min-w-0">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed class="w-6 h-6 text-blue-600" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4 mb-2">
                <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-slate-900 mb-1">Catering service for 200 guests</h4>
                  <div class="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <div class="flex items-center gap-1">
                      <Calendar class="w-3.5 h-3.5" />
                      <span>Oct 20, 2025</span>
                    </div>
                    <span class="text-slate-300">•</span>
                    <div class="flex items-center gap-1">
                      <Building2 class="w-3.5 h-3.5" />
                      <span>Premium Catering Co.</span>
                    </div>
                    <span class="text-slate-300">•</span>
                    <div class="flex items-center gap-1">
                      <CreditCard class="w-3.5 h-3.5" />
                      <span>Credit Card</span>
                    </div>
                  </div>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-2xl font-bold text-slate-900">$8,500</p>
                  <p class="text-xs text-slate-500">USD</p>
                </div>
              </div>

              <div class="mb-3 p-3 bg-slate-50 rounded-lg">
                <p class="text-sm text-slate-600">Menu includes appetizers, main course, desserts, and beverages</p>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    <Paperclip class="w-3.5 h-3.5" />
                    <span class="text-xs font-medium">Receipt Attached</span>
                  </div>
                  <button class="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Eye class="w-3.5 h-3.5" />
                    <span class="text-xs font-medium">View</span>
                  </button>
                </div>

                <div v-if="canEdit" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Expense Item 3 (No Receipt) -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 p-6 hover:shadow-xl transition-all duration-300 group">
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          <div class="flex items-start gap-4 flex-1 min-w-0">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Palette class="w-6 h-6 text-purple-600" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4 mb-2">
                <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-slate-900 mb-1">Floral arrangements</h4>
                  <div class="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <div class="flex items-center gap-1">
                      <Calendar class="w-3.5 h-3.5" />
                      <span>Oct 22, 2025</span>
                    </div>
                    <span class="text-slate-300">•</span>
                    <div class="flex items-center gap-1">
                      <Building2 class="w-3.5 h-3.5" />
                      <span>Blooming Creations</span>
                    </div>
                    <span class="text-slate-300">•</span>
                    <div class="flex items-center gap-1">
                      <CreditCard class="w-3.5 h-3.5" />
                      <span>Cash</span>
                    </div>
                  </div>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-2xl font-bold text-slate-900">$1,200</p>
                  <p class="text-xs text-slate-500">USD</p>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg">
                    <AlertCircle class="w-3.5 h-3.5" />
                    <span class="text-xs font-medium">No Receipt</span>
                  </div>
                </div>

                <div v-if="canEdit" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Expense Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAddExpenseModal"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          @click.self="showAddExpenseModal = false"
        >
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8 transform transition-all">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-slate-900">Add Expense</h3>
              <button
                @click="showAddExpenseModal = false"
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <form @submit.prevent="handleAddExpense" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Category -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                  <select
                    v-model="newExpense.category_id"
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

                <!-- Description -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-slate-700 mb-2">Description *</label>
                  <input
                    type="text"
                    v-model="newExpense.description"
                    placeholder="E.g., Venue rental, Catering service..."
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <!-- Amount -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Amount *</label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <DollarSign class="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      v-model="newExpense.amount"
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <!-- Currency -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Currency *</label>
                  <select
                    v-model="newExpense.currency"
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="KHR">KHR - Cambodian Riel</option>
                  </select>
                </div>

                <!-- Date -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Date *</label>
                  <input
                    type="date"
                    v-model="newExpense.date"
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <!-- Payment Method -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Payment Method *</label>
                  <select
                    v-model="newExpense.payment_method"
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select payment method</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="mobile_payment">Mobile Payment</option>
                    <option value="check">Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <!-- Paid To -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-slate-700 mb-2">Paid To (Vendor/Recipient)</label>
                  <input
                    type="text"
                    v-model="newExpense.paid_to"
                    placeholder="E.g., Luxury Hotel Group, Premium Catering Co."
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <!-- Receipt Upload -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-slate-700 mb-2">Receipt/Invoice (Optional)</label>
                  <div class="relative">
                    <input
                      type="file"
                      ref="receiptInput"
                      @change="handleFileChange"
                      accept="image/*,.pdf"
                      class="hidden"
                    />
                    <button
                      type="button"
                      @click="$refs.receiptInput.click()"
                      class="w-full px-4 py-8 bg-slate-50 border-2 border-slate-200 border-dashed rounded-xl hover:bg-slate-100 hover:border-emerald-400 transition-all group"
                    >
                      <div class="flex flex-col items-center">
                        <div class="w-12 h-12 bg-slate-200 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center mb-3 transition-all">
                          <Upload class="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <p class="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                          {{ selectedFile ? selectedFile.name : 'Click to upload receipt' }}
                        </p>
                        <p class="text-xs text-slate-400 mt-1">PDF, PNG, JPG (max 5MB)</p>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- Notes -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
                  <textarea
                    v-model="newExpense.notes"
                    rows="3"
                    placeholder="Add any additional notes about this expense..."
                    class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  @click="showAddExpenseModal = false"
                  class="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Add Expense
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
  Search,
  Calendar,
  CreditCard,
  Building2,
  UtensilsCrossed,
  Palette,
  Paperclip,
  Eye,
  Edit2,
  Trash2,
  X,
  DollarSign,
  Upload,
  AlertCircle,
  Filter
} from 'lucide-vue-next'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

const searchQuery = ref('')
const activeFilter = ref('all')
const showAddExpenseModal = ref(false)
const selectedFile = ref<File | null>(null)
const receiptInput = ref<HTMLInputElement | null>(null)

const categoryFilters = [
  { id: 'all', label: 'All Categories', icon: Filter },
  { id: 'venue', label: 'Venue', icon: Building2 },
  { id: 'catering', label: 'Catering', icon: UtensilsCrossed },
  { id: 'decoration', label: 'Decoration', icon: Palette },
]

const newExpense = ref({
  category_id: '',
  description: '',
  amount: null,
  currency: 'USD',
  date: '',
  payment_method: '',
  paid_to: '',
  notes: ''
})

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

const handleAddExpense = () => {
  // API logic will be added by vue-api-specialist agent
  console.log('Adding expense:', newExpense.value, 'File:', selectedFile.value)
  showAddExpenseModal.value = false
}
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

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
