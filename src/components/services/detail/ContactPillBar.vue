<template>
  <!--
    The floating contact pill both service pages wear on phones.

    Routes that mount it hide the mobile tab bar — a listing's bottom edge
    belongs to the vendor's contact actions, not to app navigation — so this
    bar *is* the page's bottom chrome and is built as the pill that would
    otherwise be there: same `.glass-pill` surface, same `h-10` row, same
    floating inset. Stacking a flat white bar on top of the tab pill was the
    conflict: two dialects of bottom chrome touching, neither reading as the
    object on top.

    Only the primary channel carries a label; the rest are icons, which is the
    tab bar's own rule and what lets the pill hug its content and leave real
    air at both edges. Two labelled buttons plus a lead do not fit a 375px
    phone once the copy is Khmer.

    The wrapper is click-through; only the pill takes taps.
  -->
  <div
    class="lg:hidden fixed inset-x-0 bottom-0 z-[70] pointer-events-none"
    role="region"
    :aria-label="regionLabel"
  >
    <div class="pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div
        class="pointer-events-auto glass-pill mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] items-center gap-1.5 rounded-full border border-white/50 p-1.5"
        :class="$slots.lead ? 'pl-4' : ''"
      >
        <!-- Whatever qualifies the buttons — a price on a listing, nothing on
             a storefront, where the hero has already said who this is. -->
        <slot name="lead" />

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
import type { ContactChannel } from '../types'

defineProps<{
  /** The labelled button, at the thumb end of the row */
  primaryChannel: ContactChannel | null
  /** Everything else, icon-only, in order of importance */
  secondaryChannels: ContactChannel[]
  /**
   * Names the region for screen readers. Not called `ariaLabel`: that is also
   * a native attribute name, and the template type-checker binds the attribute
   * rather than the prop when the two collide.
   */
  regionLabel: string
}>()

defineEmits<{
  contact: [type: string]
}>()
</script>
