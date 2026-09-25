<template>
  <!-- One root, and the caller's classes land on it — which is how the stage's
       scoped `animate-reveal` reaches a child component at all. The bands in
       one slot therefore reveal together, as one section. Renders nothing at
       all for a slot without bands. -->
  <div v-if="bands.length" class="photo-band-slot">
    <div v-for="band in bands" :key="band.id" :class="bleedClass" :data-photo-band="band.id">
      <!-- The outline is drawn inside: at full bleed the card clips anything
           drawn outside the band's sides. -->
      <EditableRegion :intent="{ kind: 'photoBand', photoId: band.id }" style="outline-offset: -3px">
        <PhotoBand :photo="band.photo" :blend-color="band.blendColor" :crop="band.crop" />
      </EditableRegion>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EventPhoto } from '@/composables/useEventShowcase'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import PhotoBand from './PhotoBand.vue'
import type { ResolvedPhotoBand } from './photoBand'

/**
 * The photo bands the organizer placed after one section, in gallery order.
 * The stage renders one of these at every position in its section
 * order, whether or not the section before it renders, so a band always has a
 * place to be.
 */
defineProps<{
  bands: ResolvedPhotoBand<EventPhoto>[]
  /** The card's negative inline margins, so the bands run edge to edge. */
  bleedClass: string
}>()
</script>

<style scoped>
.photo-band-slot {
  display: flex;
  flex-direction: column;
  /* Two bands in one slot sit fade to fade; a little air keeps them two
     photographs rather than one smeared one. */
  gap: 1.5rem;
}
</style>
