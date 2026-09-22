<template>
  <!-- The mark between two host names. One element whatever it draws, so the
       names block lays out the same box for "&", a word, a drawn motif or the
       template's own artwork, and only its contents change. -->
  <span class="hsm" :style="rootStyle">
    <img
      v-if="imageUrl"
      :src="imageUrl"
      alt=""
      class="hsm-image"
      draggable="false"
      v-bind="protectionAttrs"
    />
    <!-- Set in the names' own face and finish: an "&" that stays flat beside
         two gilded names reads as a mistake, not as a contrast. -->
    <span
      v-else-if="kind === 'ampersand'"
      class="hsm-glyph"
      :class="finishClass"
      :style="{ fontFamily }"
    ><span class="tfx-ink">&amp;</span></span>
    <span
      v-else-if="kind === 'word'"
      class="hsm-word"
      :class="[finishClass, { 'hsm-caps': capitals, 'hsm-khmer': hasKhmerScript(word) }]"
      :style="{ fontFamily }"
    ><span class="tfx-ink">{{ word }}</span></span>
    <CoupleOrnamentMark
      v-else-if="kind !== 'none'"
      :ornament="kind"
      :color="iconColor"
      class="hsm-icon"
    />
    <!-- `none` still spaces the names apart — two names touching read as one
         long name, not as two people. -->
    <span v-else class="hsm-space" aria-hidden="true" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CoverHostSeparator } from '@/services/api/types/template.types'
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
import CoupleOrnamentMark from '../host-layouts/shared/frames/CoupleOrnamentMark.vue'
import { hasKhmerScript } from './coverDetails'

interface Props {
  kind: CoverHostSeparator
  /** The template's own mark. When present it replaces `kind` outright. */
  imageUrl?: string | null
  /** The localized "and", for `word`. */
  word?: string
  /** The mark's colour — a CSS value, usually a palette-slot `var()`. */
  color: string
  /**
   * What a drawn motif is stroked in. The same as `color` unless the names carry
   * a metallic finish, which an SVG stroke can't take — then it is that metal's
   * flat mark ink (see useTextEffectMarkInk).
   */
  iconColor: string
  /** The names' font, for the `&` and the word. */
  fontFamily: string
  /** The names' finish classes, for the `&` and the word. */
  finishClass?: string[]
  capitals?: boolean
  /** Multiplier on the mark's size, relative to the names. */
  scale?: number
}

const props = withDefaults(defineProps<Props>(), {
  imageUrl: null,
  word: '',
  finishClass: () => [],
  capitals: false,
  scale: 1,
})

const { protectionAttrs } = useAssetProtection()

const rootStyle = computed(() => ({
  color: props.color,
  '--hsm-scale': `${props.scale}`,
}))
</script>

<style scoped>
/* Sized in em of the names beside it, so the mark scales with them — the block's
   font scale, the host-count step-down and the partner's own scale all reach it
   without a single extra rule. */
.hsm {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  font-size: calc(1em * var(--hsm-scale, 1));
  line-height: 1;
  /* The drawn motif reads this; see CoupleOrnamentMark. */
  --ornament-size: 1.05em;
}

.hsm-glyph {
  font-size: 0.95em;
  line-height: 1;
}

/* A word set this small between two capitals-sized names has to be quiet or it
   competes with them; the reference card's "and" is a whisper. */
.hsm-word {
  font-size: 0.4em;
  line-height: 1.2;
}

/* Khmer's stacked vowels and subscripts turn to smudge at the Latin word's
   size, so the Khmer word is set larger. Still well under the names. */
.hsm-word.hsm-khmer {
  font-size: 0.58em;
  line-height: 1.6;
}

.hsm-word.hsm-caps {
  text-transform: uppercase;
  letter-spacing: 0.3em;
  /* Tracking adds space AFTER the last letter too, which pulls centred text
     left by half of it. Paying it back on the left re-centres the ink. */
  padding-inline-start: 0.3em;
}

.hsm-image {
  display: block;
  height: 1.15em;
  width: auto;
  max-width: 4em;
  object-fit: contain;
}

.hsm-icon {
  opacity: 0.9;
}

.hsm-space {
  display: block;
  width: 0.5em;
  height: 0.3em;
}
</style>
