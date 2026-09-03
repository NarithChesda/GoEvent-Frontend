<template>
  <div v-if="group.codes.length > 1" class="dcd-swatches" data-preview-safe role="group">
    <button
      v-for="(code, index) in group.codes"
      :key="code.id"
      type="button"
      class="dcd-swatch"
      :class="[`dcd-swatch--${shape}`, { 'is-active': group.activeIndex === index }]"
      :style="swatchStyle(code)"
      :aria-label="code.title || code.typeLabel"
      :aria-pressed="group.activeIndex === index"
      @click="selectCode(group.gender, index)"
    >
      <span class="dcd-swatch__pip" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { fabricColor, garmentContrast } from './useDressCodeDesign'
import type { DressCodeDesignItem, DressCodeGenderGroup } from './types'

/**
 * The colour options for one outfit: one chip per dress code in the group.
 *
 * **This is the only selector left in the section**, and it earns that because
 * it is the only axis where the guest has a decision rather than a fact — black
 * tie *or* midnight blue, pick one. Time periods and genders are conjunctive
 * and are laid out instead.
 *
 * **It hides itself at one code.** A single chip is not a selector, it is a dot
 * — and a dot under a garment already drawn in that exact colour states the
 * same fact twice. The block this replaced always drew the row, so the common
 * case (one option per gender) had a lonely circle floating under it.
 *
 * Small and tightly spaced on purpose: at 2rem with a 0.625rem gap these read
 * as a row of buttons, which made the section look like a form. At 1.625rem
 * with a 0.4375rem gap the same chips read as a colour *set* belonging to the
 * garment above them.
 *
 * Selection is a detached ring plus a pip, never a size change. The block this
 * replaced scaled the active chip to 1.1 and dropped the rest to 60% opacity,
 * which on a pale palette made every unselected colour read as a *different,
 * paler* colour — the one thing a colour chip must never do. The pip is drawn
 * in the chip's own contrast ink (the same function the garments use), so it
 * stays visible on white and on black without a blend mode.
 */
interface Props {
  group: DressCodeGenderGroup
  primaryColor: string
  selectCode: (gender: string, index: number) => void
  /** `disc` everywhere except `atelier`, whose whole language is squared off. */
  shape?: 'disc' | 'tile'
}

const props = withDefaults(defineProps<Props>(), { shape: 'disc' })

const swatchStyle = (code: DressCodeDesignItem) => ({
  '--dcd-swatch-fill': fabricColor(code, props.primaryColor),
  '--dcd-swatch-pip': garmentContrast(code.color),
})
</script>
