<template>
  <!--
    Back and share over hero artwork. Shared by the listing hero and the vendor
    storefront banner so the same two controls never drift into two designs.

    Built as PublicEventDrawer's header row: dark glass that inverts over the
    artwork rather than white pucks sitting on it, under a short scrim that
    guarantees the icons read on a pale or busy cover. Full 40px targets on
    touch, a size down on desktop, per §17.
  -->
  <div class="absolute inset-x-0 top-0 z-10">
    <div
      class="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent pointer-events-none"
      aria-hidden="true"
    ></div>

    <div
      class="relative flex items-center justify-between gap-1.5 sm:gap-2 px-3 py-2.5"
      style="padding-top: max(env(safe-area-inset-top), 0.625rem)"
    >
      <button
        type="button"
        @click="$emit('back')"
        class="w-10 h-10 sm:w-9 sm:h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-sm text-white transition-colors"
        :title="t('services.detail.back')"
        :aria-label="t('services.detail.back')"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <button
        type="button"
        @click="$emit('share')"
        class="w-10 h-10 sm:w-9 sm:h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-sm text-white transition-colors"
        :title="t('services.detail.share')"
        :aria-label="t('services.detail.share')"
      >
        <Share2 class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Share2 } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

defineEmits<{
  back: []
  share: []
}>()
</script>
