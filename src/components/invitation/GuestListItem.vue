<template>
  <div class="p-4 hover:bg-slate-50/50 transition-colors group">
    <!-- Main Row -->
    <div class="flex items-start gap-3">
      <!-- Checkbox -->
      <div class="pt-1">
        <input
          type="checkbox"
          :checked="selected"
          @change="$emit('toggle-select', guest)"
          class="w-4 h-4 rounded border-slate-300 text-[#1e90ff] focus:ring-[#1e90ff] focus:ring-offset-0 cursor-pointer"
        />
      </div>

      <!-- Avatar -->
      <div
        class="w-10 h-10 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
      >
        {{ getInitials(guest.name) }}
      </div>

      <!-- Guest Info -->
      <div class="flex-1 min-w-0">
        <!-- Name and Status Row -->
        <div class="flex items-center gap-2 mb-1">
          <h4 class="text-base font-semibold text-slate-900">{{ guest.name }}</h4>

          <!-- Status Badge -->
          <span
            v-if="guest.invitation_status === 'viewed'"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
          >
            <Eye class="w-3 h-3 mr-1" />
            Viewed
          </span>
          <span
            v-else-if="guest.invitation_status === 'sent'"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            <Send class="w-3 h-3 mr-1" />
            Sent
          </span>
          <span
            v-else
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
          >
            <Clock class="w-3 h-3 mr-1" />
            Pending
          </span>
        </div>

        <!-- Contact Info Row -->
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 mb-2">
          <span v-if="guest.email" class="flex items-center gap-1">
            <Mail class="w-3.5 h-3.5" />
            {{ guest.email }}
          </span>
          <span v-if="guest.phone_number" class="flex items-center gap-1">
            <Phone class="w-3.5 h-3.5" />
            {{ guest.phone_number }}
          </span>
        </div>

        <!-- Cash Gift Info -->
        <div v-if="guest.cash_gift_amount" class="flex items-center gap-1 text-sm">
          <div class="inline-flex items-center px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            <Coins class="w-3.5 h-3.5 mr-1.5" />
            <span class="font-medium">{{ formatCurrency(guest.cash_gift_amount, guest.cash_gift_currency) }}</span>
          </div>
        </div>

        <!-- Action Buttons - Desktop -->
        <div class="hidden sm:flex items-center gap-2 mt-3">
          <button
            v-if="guest.invitation_status === 'not_sent'"
            @click.stop="$emit('mark-sent', guest)"
            class="px-3 py-1.5 text-xs rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1.5 font-medium"
          >
            <Send class="w-3.5 h-3.5" />
            Mark as Sent
          </button>

          <!-- Copy Link Dropdown -->
          <div class="relative">
            <button
              @click.stop="toggleLinkMenu"
              class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 font-medium"
            >
              <Link class="w-3.5 h-3.5" />
              Copy Link
              <ChevronUp class="w-3 h-3" />
            </button>

            <!-- Dropdown Menu -->
            <Transition name="dropdown">
              <div
                v-if="showLinkMenu"
                class="absolute left-0 bottom-full mb-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden"
                @click.stop
              >
                <button
                  @click="handleCopyLink('kh')"
                  class="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Globe class="w-4 h-4" />
                  Khmer (KH)
                </button>
                <button
                  @click="handleCopyLink('en')"
                  class="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <Globe class="w-4 h-4" />
                  English (EN)
                </button>
              </div>
            </Transition>
          </div>

          <button
            @click.stop="$emit('edit', guest)"
            class="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 font-medium"
          >
            <Edit class="w-3.5 h-3.5" />
            Edit
          </button>

          <button
            @click.stop="$emit('delete', guest)"
            class="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors flex items-center gap-1.5 font-medium"
          >
            <Trash2 class="w-3.5 h-3.5" />
            Delete
          </button>
        </div>

        <!-- Action Buttons - Mobile -->
        <div class="flex sm:hidden items-center gap-1 mt-3">
          <button
            v-if="guest.invitation_status === 'not_sent'"
            @click.stop="$emit('mark-sent', guest)"
            class="flex-1 px-2 py-1.5 text-xs rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
          >
            <Send class="w-3 h-3" />
            Sent
          </button>
          <button
            @click.stop="toggleMobileMenu"
            class="flex-1 px-2 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
          >
            <MoreHorizontal class="w-4 h-4" />
            More
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu Sheet -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showMobileMenu" class="fixed inset-0 z-50" @click="showMobileMenu = false">
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl p-6 shadow-2xl" @click.stop>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-slate-900">{{ guest.name }}</h3>
              <button @click="showMobileMenu = false" class="p-2 hover:bg-slate-100 rounded-full">
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="space-y-2">
              <button
                @click="handleMobileAction('copy-link', 'kh')"
                class="w-full px-4 py-3 text-left rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <Globe class="w-5 h-5 text-slate-600" />
                <span class="text-sm font-medium">Copy Khmer Link</span>
              </button>
              <button
                @click="handleMobileAction('copy-link', 'en')"
                class="w-full px-4 py-3 text-left rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <Globe class="w-5 h-5 text-slate-600" />
                <span class="text-sm font-medium">Copy English Link</span>
              </button>
              <button
                @click="handleMobileAction('edit')"
                class="w-full px-4 py-3 text-left rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <Edit class="w-5 h-5 text-slate-600" />
                <span class="text-sm font-medium">Edit Guest</span>
              </button>
              <button
                @click="handleMobileAction('delete')"
                class="w-full px-4 py-3 text-left rounded-xl hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
              >
                <Trash2 class="w-5 h-5" />
                <span class="text-sm font-medium">Delete Guest</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Trash2,
  Send,
  Edit,
  Eye,
  Clock,
  Mail,
  Phone,
  Coins,
  Link,
  ChevronUp,
  Globe,
  MoreHorizontal,
  X,
} from 'lucide-vue-next'
import type { EventGuest } from '../../services/api'

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
const showMobileMenu = ref(false)

// Methods
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatCurrency = (amount: string | number, currency: string = 'USD') => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return ''

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numAmount)

  return `${formatted} ${currency}`
}

const toggleLinkMenu = () => {
  showLinkMenu.value = !showLinkMenu.value
}

const handleCopyLink = (language: 'en' | 'kh') => {
  emit('copy-link', props.guest, language)
  showLinkMenu.value = false
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const handleMobileAction = (action: string, param?: string) => {
  showMobileMenu.value = false

  if (action === 'copy-link' && param) {
    emit('copy-link', props.guest, param as 'en' | 'kh')
  } else if (action === 'edit') {
    emit('edit', props.guest)
  } else if (action === 'delete') {
    emit('delete', props.guest)
  }
}

// Close dropdown when clicking outside
if (typeof window !== 'undefined') {
  window.addEventListener('click', () => {
    if (showLinkMenu.value) {
      showLinkMenu.value = false
    }
  })
}
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

/* Modal animation */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from .fixed.inset-0.bg-black\/50,
.modal-leave-to .fixed.inset-0.bg-black\/50 {
  opacity: 0;
}

.modal-enter-from .fixed.inset-x-0.bottom-0,
.modal-leave-to .fixed.inset-x-0.bottom-0 {
  transform: translateY(100%);
}
</style>
