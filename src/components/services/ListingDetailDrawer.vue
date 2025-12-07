<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="close"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="modelValue && listing"
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

            <!-- Right Actions -->
            <div class="flex items-center gap-1">
              <button
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Save"
              >
                <Heart class="w-5 h-5 text-slate-600" />
              </button>
              <button
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Share"
              >
                <Share2 class="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <div class="pb-24">
            <!-- Cover Image -->
            <div class="relative w-full" style="aspect-ratio: 16 / 9;">
              <img
                :src="listing.coverImage"
                :alt="listing.title"
                class="w-full h-full object-cover"
              />
              <div v-if="listing.isFeatured" class="absolute top-4 left-4">
                <div class="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-full flex items-center gap-1">
                  <Sparkles class="w-4 h-4" />
                  Featured
                </div>
              </div>
            </div>

            <!-- Listing Info -->
            <div class="px-4 py-5 space-y-5">
              <!-- Title & Category -->
              <div>
                <div class="flex items-start justify-between gap-3 mb-3">
                  <h1 class="text-xl font-bold text-slate-900 leading-tight">
                    {{ listing.title }}
                  </h1>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-full flex-shrink-0">
                    <span class="text-slate-400">#</span>
                    {{ listing.category }}
                  </span>
                </div>

                <!-- Vendor Info -->
                <div class="flex items-center gap-2 text-sm text-slate-600">
                  <div class="flex items-center gap-2">
                    <img
                      :src="listing.vendorLogo"
                      :alt="listing.vendorName"
                      class="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                    <span>{{ listing.vendorName }}</span>
                    <BadgeCheck v-if="listing.vendorVerified" class="w-4 h-4 text-[#2ecc71]" />
                  </div>
                </div>
              </div>

              <!-- Price -->
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign class="w-5 h-5 text-slate-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-900">{{ listing.priceDisplay }}</p>
                  <p class="text-sm text-slate-600">Starting price</p>
                </div>
              </div>

              <!-- Service Area -->
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin class="w-5 h-5 text-slate-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-900">{{ listing.serviceArea }}</p>
                  <p class="text-sm text-slate-600">Service Area</p>
                </div>
              </div>

              <!-- Stats -->
              <div class="flex items-center gap-6">
                <div class="flex items-center gap-2 text-sm text-slate-600">
                  <Eye class="w-4 h-4 text-slate-400" />
                  <span>{{ listing.views }} views</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-slate-600">
                  <MessageCircle class="w-4 h-4 text-slate-400" />
                  <span>{{ listing.contactClicks }} inquiries</span>
                </div>
              </div>

              <!-- About Service -->
              <div class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">About This Service</h3>
                <p class="text-slate-700 leading-relaxed">
                  {{ listing.tagline }}
                </p>
                <p class="text-slate-700 leading-relaxed mt-3">
                  {{ listing.description }}
                </p>
              </div>

              <!-- Tags -->
              <div class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Tags</h3>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in listing.tags"
                    :key="tag"
                    class="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-full"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <!-- Gallery -->
              <div v-if="listing.gallery && listing.gallery.length > 0" class="border-t border-slate-100 pt-5">
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Gallery</h3>
                <div class="grid grid-cols-3 gap-2">
                  <div
                    v-for="(image, index) in listing.gallery"
                    :key="index"
                    class="aspect-square rounded-xl overflow-hidden bg-slate-100"
                  >
                    <img
                      :src="image"
                      alt="Gallery"
                      class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Fixed Bottom CTA -->
        <div class="flex-shrink-0 bg-white border-t border-slate-100 p-4">
          <div class="flex gap-3">
            <button
              @click="$emit('contact', 'telegram')"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl font-medium transition-colors"
            >
              <Send class="w-5 h-5" />
              <span>Telegram</span>
            </button>
            <button
              @click="$emit('contact', 'phone')"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
            >
              <Phone class="w-5 h-5" />
              <span>Call</span>
            </button>
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
  Heart,
  Share2,
  Sparkles,
  BadgeCheck,
  MapPin,
  DollarSign,
  Eye,
  MessageCircle,
  Send,
  Phone
} from 'lucide-vue-next'
import type { Listing } from './types'

const props = defineProps<{
  modelValue: boolean
  listing: Listing | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'contact': [type: string]
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
