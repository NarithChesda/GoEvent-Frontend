<template>
  <div class="pal" :class="{ 'pal--solo': groups.length === 1 }">
    <section
      v-for="(group, index) in groups"
      :key="group.gender"
      class="pal-set dcd-rise"
      :style="{ '--dcd-delay': `${index * 0.07}s` }"
    >
      <span v-if="showCaptions" class="dcd-caption" :style="{ fontFamily: bodyFont }">
        {{ group.genderLabel }}
      </span>

      <div class="pal-row" data-preview-safe role="group">
        <button
          v-for="(code, codeIndex) in group.codes"
          :key="code.id"
          type="button"
          class="pal-disc"
          :class="{ 'is-active': group.activeIndex === codeIndex }"
          :style="discStyle(code)"
          :aria-label="code.title || code.typeLabel"
          :aria-pressed="group.activeIndex === codeIndex"
          @click="selectCode(group.gender, codeIndex)"
        >
          <GarmentFigure
            :item="code"
            :gender="group.gender"
            :ink="primaryColor"
            :get-media-url="getMediaUrl"
            mode="line"
            :force-art="true"
          />
        </button>
      </div>

      <!-- EditableRegion wraps the copy; never a <Transition> between the two —
           EditableRegion is fragment-rooted and an out-in transition around one
           never completes its leave hook. -->
      <EditableRegion
        v-if="activeCodeOf(group)"
        :intent="{ kind: 'dressCodeItem', dressCodeId: activeCodeOf(group)!.id }"
      >
        <div class="pal-copy">
          <Transition name="dcd-copy" mode="out-in">
            <DressCodeCopy
              :key="activeCodeOf(group)!.id"
              :item="activeCodeOf(group)!"
              :display-font="displayFont"
              :body-font="bodyFont"
              :primary-color="primaryColor"
              :accent-color="accentColor"
            />
          </Transition>
        </div>
      </EditableRegion>
    </section>
  </div>
</template>

<script setup lang="ts">
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import GarmentFigure from './GarmentFigure.vue'
import DressCodeCopy from './DressCodeCopy.vue'
import { fabricColor, garmentContrast, useDressCodeDesign } from './useDressCodeDesign'
import type { DressCodeDesignItem, DressCodeDesignProps } from './types'

/**
 * `palette` — the colour is the subject. Every option is a large disc of its own
 * colour with its garment drawn *on* it as an outline, and the discs are the
 * selector: the chosen one's title and description sit beneath.
 *
 * The answer for events that instruct a palette rather than a formality —
 * birthdays, housewarmings, themed parties, anything whose dress code is
 * genuinely "wear pastels" or "come in red". The other designs show one colour
 * at a time above a separate row of chips; here the whole palette is the thing
 * on screen, which is what those events are asking guests to look at.
 *
 * **This design has no separate swatch row**, because its discs already are one.
 * Adding chips under them would be the same control drawn twice.
 *
 * **The garment is drawn in `line` mode here and in `ledger`, nowhere else.** A
 * silhouette filled with the code's colour, sitting on a disc of that same
 * colour, is an invisible silhouette — so on the disc it becomes an outline in
 * the disc's own contrast ink. A genuine second drawing mode rather than a
 * restyle: an outlined silhouette needs heavier strokes than a filled one to
 * read at the same size.
 *
 * **A photograph is ignored on the disc** (`force-art`). A disc is a colour
 * chip; cropping a full-length outfit photo into a circle gives a smear of
 * fabric that is neither a recognisable outfit nor a legible colour, and it
 * would break the row's one job — showing the palette side by side.
 */
const props = defineProps<DressCodeDesignProps>()

const { displayFont, bodyFont, showCaptions, activeCodeOf } = useDressCodeDesign(props)

const discStyle = (code: DressCodeDesignItem) => ({
  '--pal-fill': fabricColor(code, props.primaryColor),
  '--gf-on': garmentContrast(code.color),
})
</script>

<style scoped>
/* One group is the case this design is for — a palette everyone picks from —
   and it takes the full width. Two or more groups lay out side by side rather
   than stacking: a `male` set and a `female` set each holding a single 8rem
   disc, stacked, is two thirds of a phone screen spent on two circles. */
.pal {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 1.5rem 1rem;
  align-items: start;
  justify-content: center;
}

.pal--solo {
  grid-template-columns: minmax(0, 1fr);
}

.pal-set {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.pal-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

.pal-disc {
  display: block;
  width: 4.5rem;
  height: 4.5rem;
  padding: 0;
  border: none;
  border-radius: 9999px;
  background: var(--pal-fill);
  cursor: pointer;
  /* The hairline is inset rather than a border so it never changes the disc's
     size — a row of colours where the selected one is a pixel wider reads as a
     rendering bug. Selection adds a detached ring outside it. Both live inside
     `--dcd-bead`, with the highlight that makes the disc a token rather than a
     sample. */
  box-shadow: var(--dcd-bead);
  transition:
    box-shadow 0.2s var(--dcd-ease-out),
    transform 0.16s var(--dcd-ease-out);
}

/* A group with one code has no palette to compare — the disc stops being a
   selector and becomes the figure, so it takes the size a figure needs. The
   same move the agenda's tab tray makes when a schedule has a single day. */
.pal-row:has(.pal-disc:only-child) .pal-disc {
  width: 6.5rem;
  height: 6.5rem;
}

.pal-disc.is-active {
  box-shadow:
    var(--dcd-bead),
    0 0 0 2px var(--dcd-ink);
}

.pal-disc:active {
  transform: scale(0.96);
}

.pal-disc:focus-visible {
  outline: 2px solid var(--dcd-ink);
  outline-offset: 4px;
}

/* Unselected discs are dimmed by the opacity of their *outline*, never of the
   fill: fading a colour chip shows the guest a colour nobody asked them to
   wear. */
.pal-disc:not(.is-active) :deep(.gf--art) {
  opacity: 0.75;
  transition: opacity 0.2s var(--dcd-ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .pal-disc:not(.is-active):hover {
    box-shadow:
      var(--dcd-bead),
      0 0 0 2px var(--dcd-hairline);
  }

  .pal-disc:not(.is-active):hover :deep(.gf--art) {
    opacity: 1;
  }
}

.pal-copy {
  width: 100%;
}

@media (min-width: 1024px) and (max-width: 1535px) {
  .pal {
    gap: 0.75rem;
  }

  .pal-set {
    gap: 0.4375rem;
  }

  .pal-row {
    gap: 0.4375rem;
  }

  .pal-disc {
    width: 2.5rem;
    height: 2.5rem;
  }

  .pal-row:has(.pal-disc:only-child) .pal-disc {
    width: 4.5rem;
    height: 4.5rem;
  }
}
</style>
