<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 z-[998]"
        @click="close"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="modelValue && vendor"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] lg:w-[580px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden will-change-transform"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-white border-b border-slate-100 z-10">
          <div class="flex items-center justify-between px-4 py-3">
            <!-- Left Actions -->
            <div class="flex items-center gap-2">
              <button
                @click="close"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close"
              >
                <ChevronDown class="w-5 h-5 text-slate-600 md:hidden" />
                <ChevronRight class="w-5 h-5 text-slate-600 hidden md:block" />
              </button>
            </div>

            <!-- Title -->
            <span class="font-medium text-slate-900">Vendor Profile</span>

            <!-- Spacer for alignment -->
            <div class="w-9"></div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <div class="pb-8">
            <!-- Cover & Logo -->
            <div class="h-32 bg-gradient-to-r from-[#2ecc71]/20 to-[#1e90ff]/20 relative">
              <div class="absolute -bottom-10 left-4">
                <img
                  :src="vendor.logo"
                  :alt="vendor.name"
                  class="w-20 h-20 rounded-2xl border-4 border-white object-cover shadow-lg"
                />
              </div>
            </div>

            <!-- Vendor Info -->
            <div class="px-4 py-5 space-y-5 mt-6">
              <!-- Name & Verification -->
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h1 class="text-xl font-bold text-slate-900">{{ vendor.name }}</h1>
                  <BadgeCheck class="w-5 h-5 text-[#2ecc71]" />
                </div>
                <p class="text-slate-600">{{ vendor.tagline }}</p>
              </div>

              <!-- Contact Buttons -->
              <div class="flex gap-3">
                <button class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl text-sm font-medium transition-colors">
                  <Send class="w-4 h-4" />
                  Telegram
                </button>
                <button class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors">
                  <Globe class="w-4 h-4" />
                  Website
                </button>
              </div>

              <!-- Contact Info -->
              <div class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Contact Information</h3>
                <div class="space-y-3">
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin class="w-4 h-4 text-slate-600" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-slate-900">{{ vendor.city }}, {{ vendor.country }}</p>
                      <p class="text-sm text-slate-600">Location</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail class="w-4 h-4 text-slate-600" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-slate-900">{{ vendor.email }}</p>
                      <p class="text-sm text-slate-600">Email</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone class="w-4 h-4 text-slate-600" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-slate-900">{{ vendor.phone }}</p>
                      <p class="text-sm text-slate-600">Phone</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- About -->
              <div class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">About</h3>
                <p class="text-slate-700 leading-relaxed">
                  {{ vendor.description }}
                </p>
              </div>

              <!-- Services/Listings -->
              <div class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Services ({{ vendor.listingsCount }})
                </h3>
                <div class="space-y-3">
                  <div
                    v-for="listing in listings"
                    :key="listing.id"
                    @click="$emit('listing-click', listing)"
                    class="flex gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                  >
                    <img
                      :src="listing.coverImage"
                      :alt="listing.title"
                      class="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div class="flex-1 min-w-0">
                      <h4 class="font-medium text-slate-900 text-sm truncate">{{ listing.title }}</h4>
                      <p class="text-xs text-slate-500 truncate">{{ listing.tagline }}</p>
                      <div class="text-sm font-semibold text-[#2ecc71] mt-1">{{ listing.priceDisplay }}</div>
                    </div>
                    <ChevronRightIcon class="w-5 h-5 text-slate-400 flex-shrink-0 self-center" />
                  </div>

                  <!-- Empty state if no listings -->
                  <div v-if="listings.length === 0" class="text-center py-8">
                    <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Package class="w-6 h-6 text-slate-400" />
                    </div>
                    <p class="text-slate-500 text-sm">No services listed yet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import {
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  BadgeCheck,
  Send,
  Globe,
  MapPin,
  Mail,
  Phone,
  Package
} from 'lucide-vue-next'
import type { Vendor, Listing } from './types'

const props = defineProps<{
  modelValue: boolean
  vendor: Vendor | null
  listings: Listing[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'listing-click': [listing: Listing]
}>()

const close = () => {
  emit('update:modelValue', false)
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Prevent body scroll when drawer is open
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }
)
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}
</style>
