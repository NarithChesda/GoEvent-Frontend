<template>
  <!-- Guest Card - Clean minimalist design -->
  <div class="bg-white/80 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-white transition-all duration-200 group">
    <div class="flex items-center gap-3 px-4 py-3">
      <!-- Checkbox -->
      <input
        type="checkbox"
        :checked="selected"
        @change="$emit('toggle-select', guest)"
        class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer flex-shrink-0 transition-colors"
      />

      <!-- Guest Info (grows to fill space) -->
      <div class="flex-1 min-w-0">
        <!-- Guest Name (full width) -->
        <div class="font-semibold text-slate-900 truncate">{{ guest.name }}</div>

        <!-- Badges under name -->
        <div class="flex items-center gap-1.5 mt-1 flex-wrap">
          <!-- Group badge -->
          <div
            v-if="guest.group_details"
            class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs font-medium border"
            :style="{
              color: guest.group_details.color || '#64748b',
              borderColor: guest.group_details.color || '#64748b',
              backgroundColor: `${guest.group_details.color || '#64748b'}10`
            }"
          >
            <span class="truncate max-w-[80px]">{{ guest.group_details.name }}</span>
          </div>

          <!-- Sent status badge -->
          <div
            v-if="guest.invitation_status === 'sent' || guest.invitation_status === 'viewed'"
            class="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium"
            title="Invitation sent"
          >
            <CheckCheck class="w-3 h-3" />
            <span>Sent</span>
          </div>

          <!-- Cash Gift badge -->
          <div v-if="guest.cash_gift_amount" class="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">
            <Coins class="w-3 h-3" />
            <span>{{ formatCurrency(guest.cash_gift_amount, guest.cash_gift_currency) }}</span>
          </div>
        </div>
      </div>

      <!-- Actions (Always visible, compact) -->
      <div class="flex items-center gap-0.5 flex-shrink-0">
        <!-- Mark Sent (only if not sent) -->
        <button
          v-if="guest.invitation_status === 'not_sent'"
          @click.stop="$emit('mark-sent', guest)"
          title="Mark as sent"
          class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
        >
          <Send class="w-4 h-4" />
        </button>

        <!-- Copy Link with smart dropdown -->
        <div class="relative" ref="linkMenuContainer">
          <button
            ref="linkButton"
            @click.stop="toggleLinkMenu"
            title="Copy invitation link"
            class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            :class="{ 'bg-slate-100 text-slate-700': showLinkMenu }"
          >
            <Link class="w-4 h-4" />
          </button>
        </div>

        <!-- Edit -->
        <button
          @click.stop="$emit('edit', guest)"
          title="Edit guest"
          class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
        >
          <Edit2 class="w-4 h-4" />
        </button>

        <!-- Delete -->
        <button
          @click.stop="$emit('delete', guest)"
          title="Delete guest"
          class="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>

  <!-- Teleport dropdown to body to escape overflow constraints -->
  <Teleport to="body">
    <Transition name="dropdown">
      <div
        v-if="showLinkMenu"
        ref="dropdownMenu"
        :style="dropdownStyle"
        class="fixed w-32 bg-white border border-slate-200/60 rounded-xl shadow-lg shadow-slate-200/50 z-[9999] overflow-hidden"
        @click.stop
      >
        <div class="p-1">
          <button
            @click="handleCopyLink('kh')"
            class="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <Globe class="w-3.5 h-3.5 text-slate-400" />
            Khmer
          </button>
          <button
            @click="handleCopyLink('en')"
            class="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <Globe class="w-3.5 h-3.5 text-slate-400" />
            English
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {
  Trash2,
  Send,
  Edit2,
  Coins,
  Link,
  Globe,
  CheckCheck,
} from 'lucide-vue-next'
import type { EventGuest } from '../../services/api'

// Global state manager for dropdowns (singleton pattern)
class DropdownManager {
  private static instance: DropdownManager
  private currentOpenDropdown: { close: () => void } | null = null

  static getInstance() {
    if (!DropdownManager.instance) {
      DropdownManager.instance = new DropdownManager()
    }
    return DropdownManager.instance
  }

  register(closeCallback: () => void) {
    // Close any currently open dropdown
    if (this.currentOpenDropdown) {
      this.currentOpenDropdown.close()
    }
    this.currentOpenDropdown = { close: closeCallback }
  }

  unregister(closeCallback: () => void) {
    if (this.currentOpenDropdown?.close === closeCallback) {
      this.currentOpenDropdown = null
    }
  }

  closeAll() {
    if (this.currentOpenDropdown) {
      this.currentOpenDropdown.close()
      this.currentOpenDropdown = null
    }
  }
}

// Props
const props = defineProps<{
  guest: EventGuest
  selected?: boolean
}>()

// Emits
const emit = defineEmits<{
  'copy-link': [guest: EventGuest, language: 'en' | 'kh']
  'mark-sent': [guest: EventGuest]
  edit: [guest: EventGuest]
  delete: [guest: EventGuest]
  'toggle-select': [guest: EventGuest]
}>()

// Local state
const showLinkMenu = ref(false)
const linkMenuContainer = ref<HTMLElement | null>(null)
const linkButton = ref<HTMLElement | null>(null)
const dropdownMenu = ref<HTMLElement | null>(null)
const dropdownPosition = ref<'top' | 'bottom'>('bottom')
const dropdownStyle = ref<Record<string, string>>({})

const dropdownManager = DropdownManager.getInstance()

// Methods
const formatCurrency = (amount: string | number, currency: string = 'USD') => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return ''

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numAmount)

  return `${formatted} ${currency}`
}

const calculateDropdownPosition = () => {
  if (!linkButton.value) return

  const buttonRect = linkButton.value.getBoundingClientRect()
  const dropdownHeight = 88 // Approximate height of 2 buttons
  const dropdownWidth = 128 // 32 * 4 = 128px (w-32)

  // Calculate space below button
  const spaceBelow = window.innerHeight - buttonRect.bottom
  const spaceAbove = buttonRect.top

  // Determine if dropdown should be above or below
  const showAbove = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight

  // Calculate position
  let top: number
  let left: number

  if (showAbove) {
    // Position above button
    top = buttonRect.top - dropdownHeight - 4 // 4px gap
    dropdownPosition.value = 'top'
  } else {
    // Position below button
    top = buttonRect.bottom + 4 // 4px gap
    dropdownPosition.value = 'bottom'
  }

  // Align dropdown to the right of button
  left = buttonRect.right - dropdownWidth

  // Ensure dropdown doesn't go off-screen on the left
  if (left < 8) {
    left = 8
  }

  // Ensure dropdown doesn't go off-screen on the right
  if (left + dropdownWidth > window.innerWidth - 8) {
    left = window.innerWidth - dropdownWidth - 8
  }

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  }
}

const closeDropdown = () => {
  showLinkMenu.value = false
}

const toggleLinkMenu = () => {
  if (showLinkMenu.value) {
    // If already open, close it
    closeDropdown()
  } else {
    // Register this dropdown as the active one (closes others)
    dropdownManager.register(closeDropdown)
    showLinkMenu.value = true
    // Calculate position after menu state changes
    setTimeout(() => calculateDropdownPosition(), 0)
  }
}

const handleCopyLink = (language: 'en' | 'kh') => {
  emit('copy-link', props.guest, language)
  closeDropdown()
}

// Global click handler to close dropdown when clicking outside
const handleGlobalClick = (event: MouseEvent) => {
  if (showLinkMenu.value) {
    // Check if click is outside the button and dropdown
    const target = event.target as HTMLElement
    if (
      linkButton.value &&
      !linkButton.value.contains(target) &&
      dropdownMenu.value &&
      !dropdownMenu.value.contains(target)
    ) {
      closeDropdown()
    }
  }
}

// Setup global click listener
onMounted(() => {
  if (typeof window !== 'undefined') {
    document.addEventListener('click', handleGlobalClick)
  }
})

// Cleanup
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', handleGlobalClick)
  }
  dropdownManager.unregister(closeDropdown)
})
</script>

<style scoped>
/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
