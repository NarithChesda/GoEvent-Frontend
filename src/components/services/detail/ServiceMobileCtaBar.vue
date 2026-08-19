<template>
  <!--
    This route hides the mobile tab bar — a listing's bottom edge belongs to
    the vendor's contact actions, not to app navigation — so this bar *is* the
    page's bottom chrome and is built as the pill that would otherwise be
    there: same `.glass-pill` surface, same `h-10` row, same floating inset.
    Stacking a flat white bar on top of the tab pill was the conflict: two
    dialects of bottom chrome touching, neither reading as the object on top.

    Only the primary channel carries a label; the rest are icons, which is the
    tab bar's own rule and what lets the pill hug its content and leave real
    air at both edges. Two labelled buttons plus the price do not fit a 375px
    phone once the copy is Khmer.

    The wrapper is click-through; only the pill takes taps.
  -->
  <div
    class="lg:hidden fixed inset-x-0 bottom-0 z-[70] pointer-events-none"
    role="region"
    :aria-label="t('services.detail.contactTitle')"
  >
    <div class="pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div
        class="pointer-events-auto glass-pill mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] items-center gap-1.5 rounded-full border border-white/50 p-1.5 pl-4"
      >
        <!-- Price. The one flexible part of the row: the buttons hold their
             size and this truncates, because a clipped figure still reads and
             a clipped button does not. -->
        <div class="min-w-0 pr-1">
          <p class="truncate text-sm font-bold leading-tight text-slate-900">
            {{ listing.priceDisplay }}
          </p>
          <p class="truncate text-[10px] leading-tight text-slate-500">
            {{ t('services.detail.startingPrice') }}
          </p>
        </div>

        <!-- Secondary channels, icon-only — the label is spent on the primary
             one. Rightmost is the primary, where the thumb already is. -->
        <a
          v-for="channel in secondaryChannels"
          :key="channel.key"
          :href="channel.href"
          :target="channel.external ? '_blank' : undefined"
          :rel="channel.external ? 'noopener noreferrer' : undefined"
          @click="$emit('contact', channel.key)"
          class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-200 active:scale-95"
          :class="channel.classes"
          :aria-label="channel.label"
          :title="channel.label"
        >
          <component :is="channel.icon" class="w-4 h-4" aria-hidden="true" />
        </a>

        <a
          v-if="primaryChannel"
          :href="primaryChannel.href"
          :target="primaryChannel.external ? '_blank' : undefined"
          :rel="primaryChannel.external ? 'noopener noreferrer' : undefined"
          @click="$emit('contact', primaryChannel.key)"
          class="flex h-10 flex-shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors duration-200 active:scale-95"
          :class="primaryChannel.classes"
        >
          <component :is="primaryChannel.icon" class="w-4 h-4" aria-hidden="true" />
          <span class="whitespace-nowrap">{{ primaryChannel.label }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
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

interface ContactChannel {
  key: string
  href: string
  external: boolean
  label: string
  icon: Component
  classes: string
}

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
