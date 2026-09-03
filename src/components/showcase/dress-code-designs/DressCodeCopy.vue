<template>
  <div class="dcd-copy" :class="align === 'start' ? 'dcd-copy--start' : 'dcd-copy--center'">
    <span
      v-if="showTypeLabel && item.typeLabel"
      class="dcd-eyebrow"
      :style="{ fontFamily: bodyFont }"
      >{{ item.typeLabel }}</span
    >

    <InlineEditableText
      :value="item.title"
      :target="{ kind: 'dressCode', dressCodeId: item.id, field: 'title' }"
      :input-style="{ fontFamily: displayFont, color: primaryColor }"
    >
      <h4
        class="dcd-title"
        :class="{ 'is-khmer': isKhmerText(item.title) }"
        :style="{ fontFamily: displayFont }"
      >
        {{ item.title }}
      </h4>
    </InlineEditableText>

    <InlineEditableText
      v-if="item.description"
      :value="item.description"
      :target="{ kind: 'dressCode', dressCodeId: item.id, field: 'description' }"
      :multiline="true"
      :input-style="{ fontFamily: bodyFont, color: accentColor }"
    >
      <p
        class="dcd-desc"
        :class="{ 'is-khmer': isKhmerText(item.description) }"
        :style="{ fontFamily: bodyFont }"
      >
        {{ item.description }}
      </p>
    </InlineEditableText>
  </div>
</template>

<script setup lang="ts">
import InlineEditableText from '@/components/showcase-preview/edit/InlineEditableText.vue'
import { isKhmerText } from './useDressCodeDesign'
import type { DressCodeDesignItem } from './types'

/**
 * The title and description of one dress code, with the inline-edit wiring
 * every design would otherwise repeat.
 *
 * **Keep this a single root element.** Four of the five designs put it directly
 * inside a `<Transition mode="out-in">` to crossfade the copy when a colour
 * option changes, and a transition around a fragment-rooted component never
 * completes its leave hook — the block disappears on the first switch and never
 * returns. That is exactly the bug `EditableRegion` (two branches, therefore a
 * fragment) caused when it sat inside one.
 *
 * Shared for the same reason `AgendaItemFrame` is: a sixth design should cost
 * no edit-mode plumbing, and five hand-written copies of the same
 * `InlineEditableText` target is five chances to typo a field name into a
 * silently unsaveable field.
 *
 * The type label is an **option**, not a default. Most designs already say
 * which code they are showing through the title the organizer wrote, and
 * repeating "Black Tie" above a heading that reads "Black Tie" is the kind of
 * eyebrow that makes a section look like a form. Only `plate` — where the
 * tracked type name IS the composition — turns it on.
 */
interface Props {
  item: DressCodeDesignItem
  displayFont: string
  bodyFont: string
  primaryColor: string
  accentColor: string
  align?: 'center' | 'start'
  showTypeLabel?: boolean
}

withDefaults(defineProps<Props>(), { align: 'center', showTypeLabel: false })
</script>
