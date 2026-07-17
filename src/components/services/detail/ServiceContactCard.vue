<template>
  <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 sm:p-6">
    <!-- Price -->
    <div class="mb-5">
      <p class="text-2xl font-bold text-slate-900">{{ listing.priceDisplay }}</p>
      <p class="text-sm text-slate-500">{{ t('services.detail.startingPrice') }}</p>
    </div>

    <div class="border-t border-slate-100 pt-5">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        {{ t('services.detail.contactTitle') }}
      </h3>

      <div class="space-y-2.5">
        <a
          v-if="listing.telegramUsername"
          :href="`https://t.me/${listing.telegramUsername}`"
          target="_blank"
          rel="noopener noreferrer"
          @click="$emit('contact', 'telegram')"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl font-medium transition-colors"
        >
          <Send class="w-5 h-5" />
          <span>{{ t('services.detail.telegram') }}</span>
        </a>

        <a
          v-if="listing.phone"
          :href="`tel:${sanitizedPhone}`"
          @click="$emit('contact', 'phone')"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
        >
          <Phone class="w-5 h-5" />
          <span>{{ t('services.detail.call') }}</span>
        </a>

        <a
          v-if="listing.website"
          :href="formattedWebsiteUrl"
          target="_blank"
          rel="noopener noreferrer"
          @click="$emit('contact', 'website')"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
        >
          <Globe class="w-5 h-5" />
          <span>{{ t('services.detail.website') }}</span>
        </a>
      </div>
    </div>

    <!-- Social proof -->
    <div class="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between text-xs text-slate-400">
      <span class="flex items-center gap-1.5">
        <Eye class="w-4 h-4" />
        {{ t('services.detail.views', { count: listing.views }) }}
      </span>
      <span class="flex items-center gap-1.5">
        <MessageCircle class="w-4 h-4" />
        {{ t('services.detail.inquiries', { count: listing.contactClicks }) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Send, Phone, Globe, Eye, MessageCircle } from 'lucide-vue-next'
import type { Listing } from '../types'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

const props = defineProps<{
  listing: Listing
}>()

defineEmits<{
  contact: [type: string]
}>()

const sanitizedPhone = computed(() => props.listing.phone.replace(/[\s\-()]/g, ''))

/**
 * Format website URL properly — trims whitespace and ensures a protocol.
 */
const formattedWebsiteUrl = computed(() => {
  const url = props.listing.website?.trim()
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url.replace(/^\/+/, '')}`
})
</script>
