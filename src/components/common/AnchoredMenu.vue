<template>
  <Teleport to="body">
    <!-- Click-catcher. Under the menu, over everything else. -->
    <div v-if="open" class="anchored-menu__scrim" @click="$emit('close')" @wheel.prevent></div>
    <Transition name="anchored-menu">
      <div
        v-if="open"
        ref="menuEl"
        class="anchored-menu"
        :style="style"
        role="menu"
        :aria-label="ariaLabel"
        @keydown.esc="$emit('close')"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * A menu that opens against a trigger element and is rendered at the document
 * root, so no ancestor's `overflow` can clip it.
 *
 * That is the whole reason it exists. The Showcase tab's sections are rows in a
 * group card that clips (`overflow-hidden`, which is what hides the leading
 * hairline — see ShowcaseSectionRow), and the two menus that live in those rows
 * were being cut off at the card's edge. Absolute positioning inside the row
 * cannot escape that; a teleport can.
 *
 * Position is `fixed` and recomputed from the trigger's own rect on open, on
 * scroll and on resize, so the menu tracks its trigger while the panel scrolls
 * rather than detaching from it. It flips above the trigger when there is more
 * room there, and its `transform-origin` follows that decision so it always
 * grows *out of* the control that opened it.
 */
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    /** The element to measure against — usually a template ref on the trigger. */
    anchor?: HTMLElement | null
    /** Which edge of the trigger the menu lines up with. */
    align?: 'start' | 'end'
    /** Minimum width in px; the menu also never narrows below its trigger. */
    minWidth?: number
    ariaLabel?: string
  }>(),
  { anchor: null, align: 'start', minWidth: 200, ariaLabel: undefined },
)

defineEmits<{ (e: 'close'): void }>()

const menuEl = ref<HTMLElement | null>(null)
const style = ref<Record<string, string>>({})

/** Gap between trigger and menu, and the margin kept from the viewport edge. */
const GAP = 6
const EDGE = 8

const place = () => {
  const anchor = props.anchor
  if (!anchor) return
  const r = anchor.getBoundingClientRect()
  const menuH = menuEl.value?.offsetHeight ?? 0
  const width = Math.max(props.minWidth, r.width)

  // Below unless the space above is genuinely better — a menu that flips on a
  // few pixels of difference feels twitchy, so below wins ties.
  const below = window.innerHeight - r.bottom - GAP - EDGE
  const above = r.top - GAP - EDGE
  const flip = menuH > below && above > below

  const left = props.align === 'end' ? r.right - width : r.left
  const clampedLeft = Math.min(Math.max(EDGE, left), window.innerWidth - width - EDGE)

  style.value = {
    left: `${Math.round(clampedLeft)}px`,
    width: `${Math.round(width)}px`,
    maxHeight: `${Math.round(Math.max(flip ? above : below, 120))}px`,
    ...(flip
      ? { bottom: `${Math.round(window.innerHeight - r.top + GAP)}px`, top: 'auto' }
      : { top: `${Math.round(r.bottom + GAP)}px`, bottom: 'auto' }),
    transformOrigin: `${props.align === 'end' ? 'right' : 'left'} ${flip ? 'bottom' : 'top'}`,
  }
}

// `true` for the capture phase: the panel that scrolls is an inner element, and
// its scroll events do not bubble to window.
const onViewportChange = () => place()

watch(
  () => props.open,
  async (open) => {
    if (open) {
      place()
      await nextTick()
      place() // again with the menu measured, so a flip knows its real height
      window.addEventListener('scroll', onViewportChange, true)
      window.addEventListener('resize', onViewportChange)
    } else {
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onViewportChange, true)
  window.removeEventListener('resize', onViewportChange)
})
</script>

<style scoped>
.anchored-menu__scrim {
  position: fixed;
  inset: 0;
  z-index: 120;
}

.anchored-menu {
  position: fixed;
  z-index: 121;
  overflow-y: auto;
  padding: 0.25rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgb(226 232 240);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.06),
    0 8px 24px -6px rgba(15, 23, 42, 0.18);
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.5) transparent;
}

/* Enters from just under full size — never from scale(0), which reads as
   appearing out of nothing — and leaves faster than it arrives. */
.anchored-menu-enter-active {
  transition:
    opacity 140ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 140ms cubic-bezier(0.23, 1, 0.32, 1);
}

.anchored-menu-leave-active {
  transition:
    opacity 100ms ease-out,
    transform 100ms ease-out;
}

.anchored-menu-enter-from,
.anchored-menu-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .anchored-menu-enter-active,
  .anchored-menu-leave-active {
    transition: opacity 120ms ease;
  }

  .anchored-menu-enter-from,
  .anchored-menu-leave-to {
    transform: none;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .anchored-menu {
    background: #fff;
    backdrop-filter: none;
  }
}
</style>
