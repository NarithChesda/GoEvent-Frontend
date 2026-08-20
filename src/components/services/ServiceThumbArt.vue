<template>
  <!--
    What a listing shows in place of a cover photo. Shares its vocabulary with
    [VendorCoverArt.vue] — the same brand ramp, the same corner bloom, the same
    hairline weave, the same direction of light — so a photo-less listing and a
    photo-less vendor read as one designed family rather than two different
    kinds of blank.

    What differs is saturation, and it is not a matter of taste but of how many
    of each the visitor sees at once. The vendor cover is a banner: one per
    viewport, so it can be a brand *object* and carry the gradient at full
    strength. This is a placeholder in a list twenty rows long, so it has to be
    brand *texture* — at full strength it was the loudest thing on a card whose
    least informative field it happens to be, which inverts the hierarchy
    (taste §3) and turns a scroll through the catalogue into a gradient wall
    that the page's real gradient object, the vendor spotlight, then has to
    compete with. Same ramp, same blooms, roughly a third of the alpha; the
    titles carry the page and these keep the rhythm.

    A third is the floor, not a direction to keep going in — at ~15% the tile
    stopped reading as a tile at all and became a hole in the white row beside
    it, which is a worse failure than being loud. It has to sit clearly *on* the
    card while staying quieter than the title next to it.

    Two other things differ from the vendor cover, both because this renders
    small (96px in the mobile row, a card's width on desktop) rather than as a
    banner: it carries a category icon instead of a monogram — at 96px a single
    letter says nothing a listing's title does not already say, while the icon
    sorts the list visually as you scroll — and it drops the logo colour-cast
    bloom, which at this size is a smudge rather than a tint.

    Static by design: the services grid can render twenty of these at once.
  -->
  <div class="thumb-art absolute inset-0 overflow-hidden" aria-hidden="true">
    <!-- Base ramp, pale enough to sit under a title rather than beside it -->
    <div class="absolute inset-0 bg-gradient-to-br from-[#2ecc71]/30 to-[#1e90ff]/40"></div>

    <!-- Bloom high and right, so the tile is never an even wash -->
    <div
      class="absolute -right-[20%] -top-[55%] w-[90%] aspect-square rounded-full bg-white/45 blur-2xl"
    ></div>
    <!-- Green pulled back over the low left, against a flat middle -->
    <div
      class="absolute -left-[25%] -bottom-[50%] w-[80%] aspect-square rounded-full bg-[#2ecc71]/30 blur-2xl"
    ></div>

    <!-- Hairline weave: texture at a size that stays texture on any screen.
         Drawn in slate rather than white — on the saturated ramp this replaced,
         white lines were the highlight; on a pale one they are invisible. -->
    <div class="absolute inset-0 thumb-art-weave"></div>

    <!-- The category mark, sized off the tile rather than the viewport: this
         renders at wildly different sizes on the row and the poster card. Kept
         at a brand tint rather than slate so the tile still reads as ours. -->
    <div class="absolute inset-0 flex items-center justify-center">
      <component :is="icon" class="thumb-art-icon text-[#1873cc]/60" :stroke-width="1.5" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getCategoryIcon } from '@/utils/serviceCategoryIcons'

const props = defineProps<{
  /** The listing's category — picks the mark, nothing else */
  category?: string
}>()

const icon = computed(() => getCategoryIcon(props.category))
</script>

<style scoped>
.thumb-art {
  /* Lets the icon size itself off the tile; the row and the poster card are
     very different widths and a fixed px icon is wrong in one of them. */
  container-type: size;
}

.thumb-art-weave {
  background-image: repeating-linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.05) 0px,
    rgba(15, 23, 42, 0.05) 1px,
    transparent 1px,
    transparent 14px
  );
}

.thumb-art-icon {
  /* Fallback where container units are unsupported */
  width: 2rem;
  height: 2rem;
  width: 34cqmin;
  height: 34cqmin;
}
</style>
