<template>
  <div v-if="expenses.length > 0" class="border-t border-slate-100 pt-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Spending Transparency
        </h3>
        <div class="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full">
          <ShieldCheck class="w-3 h-3 text-emerald-600" />
          <span class="text-[10px] font-medium text-emerald-700">Verified</span>
        </div>
      </div>
      <button
        v-if="expenses.length > maxVisibleItems"
        @click="showAllExpenses = !showAllExpenses"
        class="text-xs font-medium text-blue-600 hover:text-blue-700"
      >
        {{ showAllExpenses ? 'Show Less' : 'See All' }}
      </button>
    </div>

    <!-- Total Spent Card -->
    <div class="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 mb-4 text-white">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-slate-300 mb-1">Total Funds Used</p>
          <p class="text-2xl font-bold">{{ formattedTotal }}</p>
        </div>
        <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
          <Receipt class="w-6 h-6 text-white/80" />
        </div>
      </div>
      <p class="text-xs text-slate-400 mt-3">
        {{ expenses.length }} expense{{ expenses.length === 1 ? '' : 's' }} across {{ categoryCount }} categor{{ categoryCount === 1 ? 'y' : 'ies' }}
      </p>
    </div>

    <!-- Category Breakdown -->
    <div class="mb-4">
      <p class="text-xs font-medium text-slate-500 mb-2">By Category</p>
      <div class="space-y-2">
        <div
          v-for="category in categoryBreakdown"
          :key="category.id"
          class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
        >
          <!-- Category Icon -->
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            :style="{ backgroundColor: category.color + '20' }"
          >
            <component
              :is="getCategoryIcon(category.icon || category.name)"
              class="w-5 h-5"
              :style="{ color: category.color }"
            />
          </div>

          <!-- Category Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900 truncate">{{ category.name }}</p>
            <p class="text-xs text-slate-500">
              {{ category.count }} expense{{ category.count === 1 ? '' : 's' }}
            </p>
          </div>

          <!-- Amount -->
          <div class="text-right flex-shrink-0">
            <span class="text-sm font-semibold text-slate-900">
              {{ formatCurrency(category.total, category.currency) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Expenses List -->
    <div>
      <p class="text-xs font-medium text-slate-500 mb-2">Recent Expenses</p>
      <div class="space-y-2">
        <div
          v-for="expense in displayedExpenses"
          :key="expense.id"
          class="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl"
        >
          <!-- Category Color Indicator -->
          <div
            class="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
            :style="{ backgroundColor: expense.category_info.color }"
          />

          <!-- Expense Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900">{{ expense.description }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span
                class="text-xs px-1.5 py-0.5 rounded"
                :style="{
                  backgroundColor: expense.category_info.color + '15',
                  color: expense.category_info.color,
                }"
              >
                {{ expense.category_info.name }}
              </span>
              <span class="text-xs text-slate-400">{{ formatDate(expense.date) }}</span>
            </div>
            <p v-if="expense.source_donation_display" class="text-xs text-emerald-600 mt-1">
              From: {{ expense.source_donation_display }}
            </p>
          </div>

          <!-- Amount -->
          <div class="text-right flex-shrink-0">
            <span class="text-sm font-bold text-slate-900">
              {{ formatCurrency(parseFloat(expense.amount), expense.currency) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Trust Badge -->
    <div class="mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 rounded-xl">
      <Eye class="w-4 h-4 text-blue-600" />
      <p class="text-xs text-blue-700">
        All expenses are publicly disclosed for full transparency
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Receipt,
  ShieldCheck,
  Eye,
  Package,
  Truck,
  Home,
  Heart,
  Utensils,
  BookOpen,
  Shirt,
  Droplets,
  Zap,
  Baby,
  Scissors,
  Box,
  Users,
  Music,
  Camera,
  Palette,
  Building,
  Briefcase,
  type LucideIcon,
} from 'lucide-vue-next'
import type { PublicExpenseRecord } from '@/services/api/types/expense.types'

interface Props {
  expenses: PublicExpenseRecord[]
  maxVisibleItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisibleItems: 5,
})

const showAllExpenses = ref(false)

// Calculate total spent
const totalSpent = computed(() => {
  return props.expenses.reduce((sum, expense) => {
    return sum + parseFloat(expense.amount)
  }, 0)
})

// Get primary currency (most common)
const primaryCurrency = computed(() => {
  if (props.expenses.length === 0) return 'USD'
  const currencies = props.expenses.map((e) => e.currency)
  const counts = currencies.reduce(
    (acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
})

const formattedTotal = computed(() => {
  return formatCurrency(totalSpent.value, primaryCurrency.value)
})

// Count unique categories
const categoryCount = computed(() => {
  const uniqueCategories = new Set(props.expenses.map((e) => e.category_info.id))
  return uniqueCategories.size
})

// Category breakdown with totals
const categoryBreakdown = computed(() => {
  const breakdown: Record<
    number,
    {
      id: number
      name: string
      icon?: string
      color: string
      total: number
      count: number
      currency: string
    }
  > = {}

  props.expenses.forEach((expense) => {
    const catId = expense.category_info.id
    if (!breakdown[catId]) {
      breakdown[catId] = {
        id: catId,
        name: expense.category_info.name,
        icon: expense.category_info.icon,
        color: expense.category_info.color,
        total: 0,
        count: 0,
        currency: expense.currency,
      }
    }
    breakdown[catId].total += parseFloat(expense.amount)
    breakdown[catId].count++
  })

  return Object.values(breakdown).sort((a, b) => b.total - a.total)
})

// Displayed expenses (limited or all)
const displayedExpenses = computed(() => {
  if (showAllExpenses.value) {
    return props.expenses
  }
  return props.expenses.slice(0, props.maxVisibleItems)
})

// Format currency
const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Icon mapping for expense categories
const iconMap: Record<string, LucideIcon> = {
  package: Package,
  truck: Truck,
  home: Home,
  heart: Heart,
  utensils: Utensils,
  book: BookOpen,
  shirt: Shirt,
  droplets: Droplets,
  zap: Zap,
  baby: Baby,
  scissors: Scissors,
  box: Box,
  users: Users,
  music: Music,
  camera: Camera,
  palette: Palette,
  building: Building,
  briefcase: Briefcase,
}

const getCategoryIcon = (iconOrName: string): LucideIcon => {
  // First check if it's a known icon
  const iconKey = iconOrName.toLowerCase()
  if (iconMap[iconKey]) {
    return iconMap[iconKey]
  }

  // Otherwise try to match by category name
  const name = iconOrName.toLowerCase()

  if (name.includes('relief') || name.includes('supply') || name.includes('supplies')) {
    return Package
  }
  if (name.includes('transport') || name.includes('vehicle') || name.includes('fuel')) {
    return Truck
  }
  if (name.includes('shelter') || name.includes('housing') || name.includes('home')) {
    return Home
  }
  if (name.includes('medical') || name.includes('health') || name.includes('medicine')) {
    return Heart
  }
  if (name.includes('food') || name.includes('meal') || name.includes('catering')) {
    return Utensils
  }
  if (name.includes('education') || name.includes('book') || name.includes('school')) {
    return BookOpen
  }
  if (name.includes('cloth') || name.includes('dress') || name.includes('wear')) {
    return Shirt
  }
  if (name.includes('water') || name.includes('drink') || name.includes('beverage')) {
    return Droplets
  }
  if (name.includes('electric') || name.includes('power') || name.includes('energy')) {
    return Zap
  }
  if (name.includes('venue') || name.includes('location') || name.includes('hall')) {
    return Building
  }
  if (name.includes('entertainment') || name.includes('music') || name.includes('sound')) {
    return Music
  }
  if (name.includes('photo') || name.includes('video') || name.includes('media')) {
    return Camera
  }
  if (name.includes('decor') || name.includes('decoration') || name.includes('flower')) {
    return Palette
  }
  if (name.includes('staff') || name.includes('labor') || name.includes('service')) {
    return Users
  }

  // Default icon
  return Package
}
</script>
