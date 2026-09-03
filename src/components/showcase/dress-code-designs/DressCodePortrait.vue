<template>
  <div class="prt" :class="{ 'prt--solo': groups.length === 1 }">
    <div
      v-for="(group, index) in groups"
      :key="group.gender"
      class="prt-col dcd-rise"
      :style="{ '--dcd-delay': `${index * 0.07}s` }"
    >
      <span v-if="showCaptions" class="dcd-caption prt-caption" :style="{ fontFamily: bodyFont }">
        {{ group.genderLabel }}
      </span>

      <!-- EditableRegion wraps the frame; the frame is a plain element inside
           it. Never the reverse, and never a <Transition> between them —
           EditableRegion is a two-branch template, so it is fragment-rooted,
           and a Transition around one of those never finishes its leave hook.
           That is what made the figure vanish on a colour tap and stay gone. -->
      <EditableRegion
        v-if="activeCodeOf(group)"
        :intent="{ kind: 'dressCodeItem', dressCodeId: activeCodeOf(group)!.id }"
      >
        <div class="prt-figure">
          <GarmentFigure
            :item="activeCodeOf(group)!"
            :gender="group.gender"
            :ink="primaryColor"
            :get-media-url="getMediaUrl"
          />
        </div>
      </EditableRegion>

      <Transition name="dcd-copy" mode="out-in">
        <DressCodeCopy
          v-if="activeCodeOf(group)"
          :key="activeCodeOf(group)!.id"
          :item="activeCodeOf(group)!"
          :display-font="displayFont"
          :body-font="bodyFont"
          :primary-color="primaryColor"
          :accent-color="accentColor"
        />
      </Transition>

      <DressCodeSwatches :group="group" :primary-color="primaryColor" :select-code="selectCode" />
    </div>
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
 * `portrait` — the default. Every outfit in this time period stands in its own
 * soft square, side by side, captioned with who wears it.
 *
 * **What changed and why.** This used to be one figure with a row of gender
 * pills under it, so a couple's two outfits were two taps apart and the second
 * one was invisible until you found the control. Laying them out is both fewer
 * elements and more information: at two groups they sit side by side, which is
 * how a guest actually reads them ("what do we wear?"), and at one group the
 * column widens and the caption disappears, because a caption over the only
 * figure on screen labels nothing.
 *
 * Solo is a 1:1 square — the shape this block has always had — and columns are
 * 4:5, which buys the gown and the tunic the height they need without making
 * two figures side by side taller than a phone.
 *
 * `auto-fit` on a fixed minimum rather than a fixed count: three groups wrap to
 * 2 + 1 instead of squeezing to a third of a phone, and the same rule covers
 * whatever the backend's `gender` enum grows into.
 */
const props = defineProps<DressCodeDesignProps>()

const { displayFont, bodyFont, showCaptions, activeCodeOf } = useDressCodeDesign(props)
</script>

<style scoped>
.prt {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: 1.5rem 1rem;
  align-items: start;
  justify-content: center;
}

/* One group is almost always `all` — one instruction for everyone. Left on the
   auto-fit track it would stretch a lone column the full width and the figure
   with it, which is wider than this block has ever drawn a single outfit. */
.prt--solo {
  grid-template-columns: minmax(0, 13rem);
}

.prt-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}

.prt-caption {
  margin-bottom: -0.125rem;
}

/* The ground is a wash of the template's ink, never of the dress code's colour:
   a pale garment needs a ground it contrasts with, and a ground tinted by the
   garment is the one colour guaranteed not to give it one. `--dcd-ground` is
   that wash lit from above with a contact pool at the hem — see the note on it
   in dress-code-base.css. */
.prt-figure {
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 1.125rem;
  overflow: hidden;
  background: var(--dcd-ground);
  box-shadow:
    var(--dcd-plate-edge),
    inset 0 0 0 1px var(--dcd-hairline-soft),
    var(--dcd-plate-lift);
}

.prt--solo .prt-figure {
  aspect-ratio: 1;
  border-radius: 1.375rem;
}

@media (min-width: 1024px) and (max-width: 1535px) {
  .prt {
    grid-template-columns: repeat(auto-fit, minmax(4.75rem, 1fr));
    gap: 0.75rem 0.5rem;
    max-width: 15rem;
    margin-inline: auto;
  }

  .prt--solo {
    grid-template-columns: minmax(0, 8.5rem);
  }

  .prt-col {
    gap: 0.375rem;
  }

  .prt-figure {
    border-radius: 0.625rem;
  }

  .prt--solo .prt-figure {
    border-radius: 0.75rem;
  }
}
</style>
