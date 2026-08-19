<template>
  <!--
    What a listing shows in place of a cover photo. Shares its vocabulary with
    [VendorCoverArt.vue] — the same brand ramp, the same corner bloom, the same
    hairline weave — so a photo-less listing and a photo-less vendor read as one
    designed family rather than two different kinds of blank.

    Two things differ, both because this renders small (96px in the mobile row,
    a card's width on desktop) rather than as a banner:
    it carries a category icon instead of a monogram — at 96px a single letter
    says nothing a listing's title does not already say, while the icon sorts
    the list visually as you scroll — and it drops the logo colour-cast bloom,
    which at this size is a smudge rather than a tint.

    Static by design: the services grid can render twenty of these at once.
  -->
  <div class="thumb-art absolute inset-0 overflow-hidden" aria-hidden="true">
    <!-- Base ramp -->
    <div class="absolute inset-0 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff]"></div>

    <!-- Bloom high and right, so the tile is never an even wash -->
    <div
      class="absolute -right-[20%] -top-[55%] w-[90%] aspect-square rounded-full bg-white/35 blur-2xl"
    ></div>
    <!-- Green pulled back over the low left, against a flat teal middle -->
    <div
      class="absolute -left-[25%] -bottom-[50%] w-[80%] aspect-square rounded-full bg-[#2ecc71]/60 blur-2xl"
    ></div>

    <!-- Hairline weave: texture at a size that stays texture on any screen -->
    <div class="absolute inset-0 thumb-art-weave"></div>

    <!-- The category mark, sized off the tile rather than the viewport: this
         renders at wildly different sizes on the row and the poster card. -->
    <div class="absolute inset-0 flex items-center justify-center">
      <component :is="icon" class="thumb-art-icon text-white/85" :stroke-width="1.5" />
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
    rgba(255, 255, 255, 0.09) 0px,
    rgba(255, 255, 255, 0.09) 1px,
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
