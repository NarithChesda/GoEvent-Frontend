<template>
  <div class="spr">
    <article
      v-for="(group, index) in groups"
      :key="group.gender"
      class="spr-row dcd-rise"
      :style="{ '--dcd-delay': `${index * 0.08}s` }"
    >
      <!-- EditableRegion wraps the figure well; the well is a plain element
           inside it. Never a <Transition> between them — EditableRegion is
           fragment-rooted and an out-in transition around one never completes. -->
      <EditableRegion
        v-if="activeCodeOf(group)"
        :intent="{ kind: 'dressCodeItem', dressCodeId: activeCodeOf(group)!.id }"
      >
        <div class="spr-figure">
          <GarmentFigure
            :item="activeCodeOf(group)!"
            :gender="group.gender"
            :ink="primaryColor"
            :get-media-url="getMediaUrl"
          />
        </div>
      </EditableRegion>

      <div class="spr-body">
        <span v-if="showCaptions" class="dcd-caption" :style="{ fontFamily: bodyFont }">
          {{ group.genderLabel }}
        </span>

        <Transition name="dcd-copy" mode="out-in">
          <DressCodeCopy
            v-if="activeCodeOf(group)"
            :key="activeCodeOf(group)!.id"
            :item="activeCodeOf(group)!"
            :display-font="displayFont"
            :body-font="bodyFont"
            :primary-color="primaryColor"
            :accent-color="accentColor"
            align="start"
          />
        </Transition>

        <DressCodeSwatches
          :group="group"
          :primary-color="primaryColor"
          :select-code="selectCode"
          class="dcd-swatches--start"
        />
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import GarmentFigure from './GarmentFigure.vue'
import DressCodeCopy from './DressCodeCopy.vue'
import DressCodeSwatches from './DressCodeSwatches.vue'
import { useDressCodeDesign } from './useDressCodeDesign'
import type { DressCodeDesignProps } from './types'

/**
 * `spread` — the editorial one. Each outfit stands free at the leading edge with
 * its copy beside it, the two divided by a vertical hairline, one band per
 * person.
 *
 * **The garment has no frame here, and that is the whole design.** Every other
 * composition puts the figure in a well — a square, an arch, a disc, a badge —
 * because a frame is what makes a small drawing read as deliberate. Given the
 * full width of a band the drawing is large enough not to need one, so it stands
 * directly on the invitation's own ground with the rule beside it doing the
 * work the frame would have done. A photograph still gets a soft corner and a
 * hairline, because a raw rectangle of someone's snapshot is not the same thing
 * as a drawing standing on a page.
 *
 * The band is where the description finally has room. `portrait` and `atelier`
 * put the copy under a column that is half a phone wide, so anything past a
 * line and a half wraps into a paragraph shape that fights the figure above it;
 * here the copy gets two thirds of the width and can be a sentence a guest
 * actually reads. For events whose dress code is an instruction rather than a
 * category.
 *
 * **Bands do not alternate sides.** A mirrored pair looks handsome in a mock-up
 * with three words of copy and stops working the moment one description is
 * longer than the other — and a right-aligned paragraph is measurably harder to
 * read than a left-aligned one. Consistency is worth more than the symmetry.
 */
const props = defineProps<DressCodeDesignProps>()

const { displayFont, bodyFont, showCaptions, activeCodeOf } = useDressCodeDesign(props)
</script>

<style scoped>
.spr {
  display: flex;
  flex-direction: column;
  gap: 1.375rem;
  max-width: 30rem;
  margin-inline: auto;
}

.spr-row {
  display: grid;
  /* A fixed leading column rather than a fraction: the figure is a drawing at a
     readable size or it is nothing, and at 320px a percentage would shrink it
     to a thumbnail while the copy kept its own comfortable measure. */
  grid-template-columns: 6.25rem minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
}

.spr-figure {
  width: 100%;
  aspect-ratio: 4 / 5;
}

/* The drawing stands on the page; a photograph is given the corner and hairline
   it needs to read as placed rather than pasted. */
.spr-figure :deep(.gf--photo) {
  border-radius: 0.875rem;
  box-shadow: inset 0 0 0 1px var(--dcd-hairline-soft);
}

/* The drawing needs no padding of its own here — it is already inset by
   GarmentFigure, and doubling it against a free-standing figure wastes the
   width the band exists to give it. */
.spr-figure :deep(.gf--art) {
  padding: 2%;
}

.spr-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
  padding-inline-start: 1rem;
  border-inline-start: 1px solid var(--dcd-hairline-soft);
}

@media (min-width: 640px) {
  .spr-row {
    grid-template-columns: 7.5rem minmax(0, 1fr);
    gap: 1.25rem;
  }
}

@media (min-width: 1024px) and (max-width: 1535px) {
  .spr {
    gap: 0.75rem;
    max-width: 20rem;
  }

  .spr-row {
    grid-template-columns: 3.5rem minmax(0, 1fr);
    gap: 0.5rem;
  }

  .spr-body {
    gap: 0.25rem;
    padding-inline-start: 0.5rem;
  }
}
</style>
