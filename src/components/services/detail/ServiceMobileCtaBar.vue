<template>
  <!--
    A listing's bottom chrome: the shared contact pill, led by the price.
    The channel rules live here; the pill itself is ContactPillBar, so this bar
    and the storefront's can never drift into two designs.
  -->
  <ContactPillBar
    :primary-channel="primaryChannel"
    :secondary-channels="secondaryChannels"
    :region-label="t('services.detail.contactTitle')"
    @contact="$emit('contact', $event)"
  >
    <!-- Price. The one flexible part of the row: the buttons hold their size
         and this truncates, because a clipped figure still reads and a clipped
         button does not. -->
    <template #lead>
      <div class="min-w-0 pr-1">
        <p class="truncate text-sm font-bold leading-tight text-slate-900">
          {{ listing.priceDisplay }}
        </p>
        <p class="truncate text-[10px] leading-tight text-slate-500">
          {{ t('services.detail.startingPrice') }}
        </p>
      </div>
    </template>
  </ContactPillBar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Send, Phone, Globe } from 'lucide-vue-next'
import type { ContactChannel, Listing } from '../types'
import ContactPillBar from './ContactPillBar.vue'
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

/**
 * The channels this listing offers, most important first — the same order and
 * the same "website only when it is the sole channel" rule as the desktop
 * contact card. The first one is the labelled button, the rest are icons.
 */
const channels = computed<ContactChannel[]>(() => {
  const list: ContactChannel[] = []

  if (props.listing.telegramUsername) {
    list.push({
      key: 'telegram',
      href: `https://t.me/${props.listing.telegramUsername}`,
      external: true,
      label: t('services.detail.telegram'),
      icon: Send,
      classes: 'bg-[#0088cc] hover:bg-[#0077b5] text-white',
    })
  }

  if (props.listing.phone) {
    list.push({
      key: 'phone',
      href: `tel:${sanitizedPhone.value}`,
      external: false,
      label: t('services.detail.call'),
      icon: Phone,
      classes: 'bg-slate-900 hover:bg-slate-800 text-white',
    })
  }

  if (list.length === 0 && formattedWebsiteUrl.value) {
    list.push({
      key: 'website',
      href: formattedWebsiteUrl.value,
      external: true,
      label: t('services.detail.website'),
      icon: Globe,
      classes: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    })
  }

  return list
})

const primaryChannel = computed(() => channels.value[0] ?? null)
const secondaryChannels = computed(() => channels.value.slice(1))
</script>
