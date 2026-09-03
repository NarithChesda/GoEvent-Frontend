<template>
  <div class="ldg">
    <section v-for="group in groups" :key="group.gender" class="ldg-group">
      <span v-if="showCaptions" class="dcd-caption" :style="{ fontFamily: bodyFont }">
        {{ group.genderLabel }}
      </span>

      <EditableRegion
        v-for="entry in rowsOf(group)"
        :key="entry.code.id"
        :intent="{ kind: 'dressCodeItem', dressCodeId: entry.code.id }"
      >
        <!-- The row is a plain element INSIDE the region. Outside the manage-page
             preview EditableRegion renders a bare slot with `inheritAttrs:
             false`, so a class or a style custom property on the component is
             dropped and every row would arrive at once with no rule under it. -->
        <div
          class="ldg-row"
          :class="{ 'is-first': entry.isFirst }"
          :style="{ '--dcd-delay': `${entry.delay}s` }"
        >
          <span class="ldg-badge" :style="badgeStyle(entry.code)">
            <GarmentFigure
              :item="entry.code"
              :gender="group.gender"
              :ink="primaryColor"
              :get-media-url="getMediaUrl"
              mode="line"
              :force-art="true"
            />
          </span>

          <DressCodeCopy
            :item="entry.code"
            :display-font="displayFont"
            :body-font="bodyFont"
            :primary-color="primaryColor"
            :accent-color="accentColor"
            align="start"
            class="ldg-copy"
          />
        </div>
      </EditableRegion>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import GarmentFigure from './GarmentFigure.vue'
import DressCodeCopy from './DressCodeCopy.vue'
import { fabricColor, garmentContrast, useDressCodeDesign } from './useDressCodeDesign'
import type { DressCodeDesignItem, DressCodeDesignProps, DressCodeGenderGroup } from './types'

/**
 * `ledger` — every dress code on one line: a colour badge, the title, the full
 * description, separated by hairline rules. Nothing behind a control.
 *
 * The answer for events whose dress code needs *explaining* rather than showing
 * — housewarmings, ceremonies with a rule per part of the day, anything where
 * the description carries the actual instruction ("no white", "shoes you can
 * take off"). Every other design gives one outfit the stage and puts its
 * alternatives behind chips, which is right when they are variations of one
 * look and wrong when each is a separate rule the guest has to read.
 *
 * **The only design with no selector at all**, because a list where every item
 * is visible has nothing to select — the colour options that are chips
 * elsewhere are simply rows here. Gender becomes a caption over its own run of
 * rows rather than a label on each one: two captions instead of one per row,
 * which is the difference between a section and a form.
 *
 * **Rules, not cards.** This started as tinted cards and they were wrong for
 * the job: a card is a container, and a container around a paragraph of
 * instructions makes it look optional. A hairline between rows is enough
 * structure to separate them and leaves the copy sitting on the invitation
 * itself, which is where an instruction belongs. It also keeps the block quiet
 * next to the agenda's `stack`, which does use cards, directly below it.
 */
const props = defineProps<DressCodeDesignProps>()

const { displayFont, bodyFont, showCaptions } = useDressCodeDesign(props)

const badgeStyle = (code: DressCodeDesignItem) => ({
  '--ldg-fill': fabricColor(code, props.primaryColor),
  '--gf-on': garmentContrast(code.color),
})

/**
 * Rows cascade in on mount, with the delay counted across every group rather
 * than restarting per gender — the cascade runs down the list a guest reads,
 * and a list that restarts halfway looks like two lists.
 *
 * Capped rather than fixed: 60ms reads as a cascade, but a ten-code all-day
 * schedule at 60ms leaves the last row arriving well after the guest has
 * finished reading the first, so past ~7 rows the whole run compresses into the
 * same 0.42s.
 */
const rowDelays = computed(() => {
  const total = props.groups.reduce((sum, group) => sum + group.codes.length, 0)
  const step = Math.min(0.06, 0.42 / Math.max(1, total))
  const map = new Map<number, number>()
  let n = 0
  props.groups.forEach((group) => {
    group.codes.forEach((code) => {
      map.set(code.id, n * step)
      n += 1
    })
  })
  return map
})

/**
 * `isFirst` is carried as data rather than matched with `:first-of-type`,
 * because the row's position in the DOM is not stable: outside the manage-page
 * preview `EditableRegion` renders a bare slot and the row is a direct child of
 * the group, while inside it the row is wrapped one level deeper. A structural
 * selector would therefore drop the leading rule in one mode and not the other.
 */
const rowsOf = (group: DressCodeGenderGroup) =>
  group.codes.map((code, index) => ({
    code,
    isFirst: index === 0,
    delay: rowDelays.value.get(code.id) ?? 0,
  }))
</script>

<style scoped>
.ldg {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 30rem;
  margin-inline: auto;
}

.ldg-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ldg-group > .dcd-caption {
  align-self: center;
  margin-bottom: 0.375rem;
}

.ldg-row {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 0.8125rem 0;
  border-top: 1px solid var(--dcd-hairline-soft);
  animation: dcdRise 0.42s var(--dcd-ease-out) var(--dcd-delay, 0s) both;
}

/* The first row of each run carries no rule: a rule above the first item is a
   line under the caption, which is a different statement. */
.ldg-row.is-first {
  border-top: none;
  padding-top: 0;
}

.ldg-badge {
  display: block;
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.875rem;
  background: var(--ldg-fill);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dcd-ink) 16%, transparent);
}

.ldg-copy {
  flex: 1;
  min-width: 0;
  padding-top: 0.125rem;
}

@media (min-width: 640px) {
  .ldg-row {
    gap: 1rem;
    padding: 0.9375rem 0;
  }

  .ldg-badge {
    width: 3.25rem;
    height: 3.25rem;
    border-radius: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ldg-row {
    animation: none;
  }
}

@media (min-width: 1024px) and (max-width: 1535px) {
  .ldg {
    gap: 0.625rem;
    max-width: 20rem;
  }

  .ldg-group {
    gap: 0.125rem;
  }

  .ldg-group > .dcd-caption {
    margin-bottom: 0.1875rem;
  }

  .ldg-row {
    gap: 0.5625rem;
    padding: 0.4375rem 0;
  }

  .ldg-badge {
    width: 1.875rem;
    height: 1.875rem;
    border-radius: 0.5625rem;
  }
}
</style>
