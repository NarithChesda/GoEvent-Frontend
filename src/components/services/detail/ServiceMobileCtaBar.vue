<template>
  <!--
    Sits directly on top of the band the floating tab bar occupies, so the two
    stack flush. `bottom-20` used to be a guess at the old full-width bar's
    height and now leaves a strip of live page content showing through between
    this bar and the pill.
  -->
  <div
    class="lg:hidden fixed bottom-[var(--nav-inset)] inset-x-0 z-[60] bg-white/95 backdrop-blur-sm border-t border-slate-200 px-4 py-3"
  >
    <div class="flex items-center gap-3">
      <!-- Price -->
      <div class="flex-1 min-w-0">
        <p class="text-base font-bold text-slate-900 truncate">{{ listing.priceDisplay }}</p>
        <p class="text-[11px] text-slate-500">{{ t('services.detail.startingPrice') }}</p>
      </div>

      <!-- CTAs: up to two primary channels -->
      <a
        v-if="listing.telegramUsername"
        :href="`https://t.me/${listing.telegramUsername}`"
        target="_blank"
        rel="noopener noreferrer"
        @click="$emit('contact', 'telegram')"
        class="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl text-sm font-medium transition-colors"
      >
        <Send class="w-4 h-4" />
        <span>{{ t('services.detail.telegram') }}</span>
      </a>

      <a
        v-if="listing.phone"
        :href="`tel:${sanitizedPhone}`"
        @click="$emit('contact', 'phone')"
        class="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors"
      >
        <Phone class="w-4 h-4" />
        <span>{{ t('services.detail.call') }}</span>
      </a>

      <!-- Website only when it's the sole channel -->
      <a
        v-if="!listing.telegramUsername && !listing.phone && listing.website"
        :href="formattedWebsiteUrl"
        target="_blank"
        rel="noopener noreferrer"
        @click="$emit('contact', 'website')"
        class="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
      >
        <Globe class="w-4 h-4" />
        <span>{{ t('services.detail.website') }}</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Send, Phone, Globe } from 'lucide-vue-next'
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

const formattedWebsiteUrl = computed(() => {
  const url = props.listing.website?.trim()
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url.replace(/^\/+/, '')}`
})
</script>
