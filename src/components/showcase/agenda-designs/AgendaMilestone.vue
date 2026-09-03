<template>
  <div class="mst">
    <template v-for="(item, index) in items" :key="item.id">
      <AgendaItemFrame
        :agenda-id="item.id"
        :entrance-delay="index * stagger"
        :is-first="index === 0"
        :is-last="index === items.length - 1"
      >
        <div class="mst-stop">
          <div class="mst-roundel">
            <div
              v-if="item.icon?.svg_code"
              class="agd-icon mst-glyph"
              v-html="iconSvg(item)"
            />
            <Calendar v-else class="agd-icon agd-icon--fallback mst-glyph" :stroke-width="1.25" />
          </div>

          <p class="mst-time" :style="{ fontFamily: bodyFont }">
            {{ timeText(item) || 'Time TBD' }}
          </p>

          <h3
            class="agd-title mst-title capitalize"
            :class="{ 'is-khmer': isKhmer(item) }"
            :style="{ fontFamily: displayFont }"
          >
            {{ item.title || 'Event Activity' }}
          </h3>
        </div>
      </AgendaItemFrame>

      <!-- The drop between stops: a hairline that draws downward, pinched by a
           small lozenge at its middle so a long list still has a rhythm. -->
      <div
        v-if="index < items.length - 1"
        class="mst-drop agd-draws-in"
        :style="{ '--agd-delay': `${index * stagger + 0.18}s` }"
        aria-hidden="true"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Calendar } from 'lucide-vue-next'
import AgendaItemFrame from './AgendaItemFrame.vue'
import { useAgendaDesign } from './useAgendaDesign'
import type { AgendaDesignProps } from './types'

/**
 * `milestone` — every activity centred on one axis: the roundel, the time as a
 * tracked eyebrow, then the title, with a hairline drop between stops.
 *
 * This is the design to reach for when the titles are long or the event is in
 * Khmer. Every other composition spends a fixed column on a rail, a stop or a
 * time, leaving the title 60–75% of an already-narrow phone; here nothing
 * competes for horizontal space, so a title that would wrap to three lines
 * elsewhere wraps to two, and Khmer — which sets wide, and whose coeng
 * subscripts punish tight leading — gets the whole column.
 *
 * Its signature gesture is the drop drawing downward into the next stop, which
 * is also why the drop is a separate element rather than a pseudo of the item:
 * the reveal has to belong to the *gap*, so it can run after the stop above it
 * has landed and before the one below arrives.
 */
const props = defineProps<AgendaDesignProps>()

const { displayFont, bodyFont, stagger, iconSvg, timeText, isKhmer } = useAgendaDesign(props)
const items = computed(() => props.items)
</script>

<style scoped>
.mst {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  max-width: 26rem;
  margin-inline: auto;
}

.mst-stop {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-inline: 0.5rem;
}

/* A ring, not a disc: the stop is a marker on a line, and a filled shape at
   this size reads as a tappable control. */
.mst-roundel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--agd-ink) 5%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--agd-ink) 24%, transparent);
  transition: box-shadow 0.25s var(--agd-ease-out);
}

.mst-glyph {
  width: 1.625rem;
  height: 1.625rem;
}

.mst-time {
  margin-top: 0.625rem;
  font-size: 0.625rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--agd-ink) 62%, transparent);
  white-space: nowrap;
}

.mst-title {
  margin-top: 0.25rem;
  color: var(--agd-ink);
  font-weight: 400;
  font-size: 1.0625rem;
  line-height: 1.55;
  overflow-wrap: break-word;
  text-wrap: balance;
}

.mst-title.is-khmer {
  font-size: 0.9375rem;
  line-height: 1.9;
}

/* The drop, and the lozenge pinching it */
.mst-drop {
  position: relative;
  align-self: center;
  width: 1px;
  height: 1.625rem;
  margin: 0.5rem 0;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--agd-hairline) 22%,
    var(--agd-hairline) 78%,
    transparent
  );
  transform-origin: top center;
  animation: mstDrop 0.45s var(--agd-ease-out) var(--agd-delay, 0s) both;
}

.mst-drop::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  margin: -2px 0 0 -2px;
  background: color-mix(in srgb, var(--agd-ink) 45%, transparent);
  transform: rotate(45deg);
}

/* The stops shift left by the arrow gutter inside the editable preview; the
   drop is not an item, so it has to follow them by hand or the line runs down
   beside the column instead of through it. */
.agd--editing .mst-drop {
  margin-right: var(--agd-gutter, 0);
}

@keyframes mstDrop {
  from {
    transform: scaleY(0);
    opacity: 0;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

@media (hover: hover) and (pointer: fine) {
  .mst-stop:hover .mst-roundel {
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--agd-ink) 42%, transparent),
      0 8px 20px -10px color-mix(in srgb, var(--agd-ink) 50%, transparent);
  }
}

@media (min-width: 640px) {
  .mst-roundel {
    width: 3.75rem;
    height: 3.75rem;
  }

  .mst-glyph {
    width: 1.875rem;
    height: 1.875rem;
  }

  .mst-time {
    font-size: 0.6875rem;
  }

  .mst-title {
    font-size: 1.1875rem;
  }

  .mst-title.is-khmer {
    font-size: 1.0625rem;
  }
}

@media (min-width: 1024px) and (max-width: 1535px) {
  .mst {
    max-width: 18rem;
  }

  .mst-roundel {
    width: 2.25rem;
    height: 2.25rem;
  }

  .mst-glyph {
    width: 1.125rem;
    height: 1.125rem;
  }

  .mst-time {
    margin-top: 0.375rem;
    font-size: 0.5rem;
    letter-spacing: 0.16em;
  }

  .mst-title {
    font-size: 0.75rem;
    line-height: 1.5;
  }

  .mst-title.is-khmer {
    font-size: 0.6875rem;
  }

  .mst-drop {
    height: 1rem;
    margin: 0.375rem 0;
  }
}
</style>
