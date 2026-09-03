<template>
  <div class="atl" :class="{ 'atl--solo': groups.length === 1 }">
    <div
      v-for="(group, index) in groups"
      :key="group.gender"
      class="atl-col dcd-rise"
      :style="{ '--dcd-delay': `${index * 0.07}s` }"
    >
      <span v-if="showCaptions" class="dcd-caption atl-caption" :style="{ fontFamily: bodyFont }">
        {{ group.genderLabel }}
      </span>

      <!-- EditableRegion wraps the arch; the arch is a plain element inside it.
           Never a <Transition> between the two — EditableRegion is fragment-
           rooted and an out-in transition around one never completes. -->
      <EditableRegion
        v-if="activeCodeOf(group)"
        :intent="{ kind: 'dressCodeItem', dressCodeId: activeCodeOf(group)!.id }"
      >
        <div class="atl-arch">
          <GarmentFigure
            :item="activeCodeOf(group)!"
            :gender="group.gender"
            :ink="primaryColor"
            :get-media-url="getMediaUrl"
          />
        </div>
      </EditableRegion>

      <span class="atl-rule" aria-hidden="true" />

      <Transition name="dcd-copy" mode="out-in">
        <DressCodeCopy
          v-if="activeCodeOf(group)"
          :key="activeCodeOf(group)!.id"
          :item="activeCodeOf(group)!"
          :display-font="displayFont"
          :body-font="bodyFont"
          :primary-color="primaryColor"
          :accent-color="accentColor"
          :show-type-label="true"
        />
      </Transition>

      <DressCodeSwatches
        :group="group"
        :primary-color="primaryColor"
        :select-code="selectCode"
        shape="tile"
      />
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
 * `atelier` — the formal one. Each outfit stands in a tall hairline arch on a
 * mount board, the dress code's type is tracked out in small caps under a short
 * rule, and the colours are squared-off tiles rather than dots.
 *
 * Weddings, ceremonies, funerals. Everything is drawn in one hairline weight in
 * the template's ink, which is the language the `calendar` / `arch` event-detail
 * designs and the `engraved` info card already speak — so a template that chose
 * those gets a dress code block that reads as part of the same sheet instead of
 * a card dropped onto it.
 *
 * **The only design that shows the type label**, because here the classification
 * *is* the composition — "BLACK TIE" tracked under an arch is the plate.
 * Anywhere else it would be an eyebrow restating the title directly beneath it.
 *
 * The arch is a portrait rectangle with a semicircular cap, not an ellipse: the
 * vertical radius is set to the exact fraction of the height that equals half
 * the width (37.5% at this 3:4 ratio), so the curve stays circular at every
 * width instead of stretching with the box.
 */
const props = defineProps<DressCodeDesignProps>()

const { displayFont, bodyFont, showCaptions, activeCodeOf } = useDressCodeDesign(props)
</script>

<style scoped>
.atl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  gap: 1.5rem 1.125rem;
  align-items: start;
  justify-content: center;
}

.atl--solo {
  grid-template-columns: minmax(0, 11rem);
}

.atl-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
}

.atl-caption {
  margin-bottom: -0.125rem;
}

.atl-arch {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 50% 50% 0.5rem 0.5rem / 37.5% 37.5% 2% 2%;
  overflow: hidden;
  background: var(--dcd-ground);
  /* Two rings with a mount between them: the outer is the frame, the inner is
     the mount board. One ring reads as a border; two read as framed. Inset
     shadows paint front to back, so the 1px hairline sits on top, the 6px wash
     paints behind it filling the band, and the 7px soft ring shows only in the
     1px the wash leaves. A `transparent` middle layer paints nothing and gives
     one thick ring instead — which is what this looked like at first.

     The mount stays the FLAT `--dcd-wash`: it is a board the arch is cut into,
     and a lit gradient inside a 6px band would only read as a smudge. The lit
     ground goes behind it, where the garment stands. */
  box-shadow:
    inset 0 0 0 1px var(--dcd-hairline),
    inset 0 0 0 6px var(--dcd-wash),
    inset 0 0 0 7px var(--dcd-hairline-soft),
    var(--dcd-plate-lift);
}

/* A short centred rule between the arch and the type name. Fixed width rather
   than a percentage so it stays a mark and never becomes a divider running the
   width of the invitation. */
.atl-rule {
  width: 2.25rem;
  height: 1px;
  background: var(--dcd-hairline);
  margin: 0.125rem 0;
}

@media (min-width: 1024px) and (max-width: 1535px) {
  .atl {
    grid-template-columns: repeat(auto-fit, minmax(4.5rem, 1fr));
    gap: 0.75rem 0.5rem;
    max-width: 14rem;
    margin-inline: auto;
  }

  .atl--solo {
    grid-template-columns: minmax(0, 7rem);
  }

  .atl-col {
    gap: 0.375rem;
  }

  .atl-arch {
    box-shadow:
      inset 0 0 0 1px var(--dcd-hairline),
      inset 0 0 0 3px var(--dcd-wash),
      inset 0 0 0 4px var(--dcd-hairline-soft);
  }

  .atl-rule {
    width: 1.375rem;
    margin: 0;
  }
}
</style>
