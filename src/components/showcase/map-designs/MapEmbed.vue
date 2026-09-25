<template>
  <!-- The venue's Google Map, inside the studio's edit region. One component
       because EventInfo draws it in three places — the card's own window, a
       frame inside the card, and the venue on the page — and they must never
       disagree about how the embed is loaded. -->
  <EditableRegion :intent="MAP_INTENT">
    <iframe
      :src="src"
      width="100%"
      height="100%"
      style="border: 0"
      :title="title"
      :allowfullscreen="false"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
    />
  </EditableRegion>
</template>

<script setup lang="ts">
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import type { EditIntent } from '@/components/showcase-preview/edit/editContext'

defineProps<{
  src: string
  /** The frame's accessible name — the venue, when there is one. */
  title?: string
}>()

const MAP_INTENT: EditIntent = { kind: 'gmapEmbed' }
</script>
