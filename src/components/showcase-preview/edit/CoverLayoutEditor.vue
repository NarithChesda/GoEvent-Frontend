<template>
  <!-- Sits over the whole cover stage and takes every pointer event, which is
       also what shields the showcase underneath (its own open-envelope handler
       is already disabled in preview frames, but a stray tap on an inline-edit
       affordance while dragging a block would still be wrong).

       Coordinates need no measurement or conversion: the boxes here are the
       SAME numbers the cover blocks render from — % of this stage, centre
       anchored — so a handle is always exactly on the thing it moves, at any
       preview scale. -->
  <div
    ref="stageRef"
    class="cly"
    @pointerdown.self="clearSelection"
  >
    <div
      v-for="id in renderedIds"
      :key="id"
      class="cly-box"
      :class="{ 'is-selected': id === selected, 'is-dragging': drag?.id === id }"
      :style="boxStyle(id)"
      @pointerdown.stop="startMove(id, $event)"
    >
      <span class="cly-box__label">{{ labels[id] }}</span>

      <template v-if="id === selected">
        <span
          v-for="handle in HANDLES"
          :key="handle.key"
          class="cly-handle"
          :class="`cly-handle--${handle.key}`"
          @pointerdown.stop="startResize(id, handle, $event)"
        />
      </template>

      <!-- Type controls, hung off the selected block so the text and the thing
           changing it are in the same glance. `pointerdown.stop` is what keeps
           a button press from also starting a drag of the block underneath. -->
      <div
        v-if="id === toolbarId"
        class="cly-tools"
        :class="{ 'is-above': toolbarAbove }"
        @pointerdown.stop
      >
        <div class="cly-tools__group">
          <button
            type="button"
            class="cly-tool"
            :aria-label="t('management.coverLayoutEditor.text.smaller')"
            @click="bumpFontScale(-FONT_SCALE_STEP)"
          >
            <span class="cly-tool__a cly-tool__a--sm">A</span>
          </button>
          <span class="cly-tools__value">{{ fontScalePercent }}%</span>
          <button
            type="button"
            class="cly-tool"
            :aria-label="t('management.coverLayoutEditor.text.larger')"
            @click="bumpFontScale(FONT_SCALE_STEP)"
          >
            <span class="cly-tool__a">A</span>
          </button>
        </div>

        <div v-if="swatches.length" class="cly-tools__group">
          <button
            v-for="swatch in swatches"
            :key="swatch.source ?? 'auto'"
            type="button"
            class="cly-swatch"
            :class="{
              'is-auto': !swatch.source,
              'is-active': (toolbarBox?.colorSource ?? null) === swatch.source,
            }"
            :style="swatch.hex ? { background: swatch.hex } : undefined"
            :title="swatch.label"
            :aria-label="swatch.label"
            @click="setColorSource(swatch.source)"
          />
        </div>
      </div>
    </div>

    <!-- Alignment guides, drawn only while they're actually holding an edge. -->
    <div
      v-for="x in guides.x"
      :key="`gx-${x}`"
      class="cly-guide cly-guide--v"
      :style="{ left: `${x}%` }"
    />
    <div
      v-for="y in guides.y"
      :key="`gy-${y}`"
      class="cly-guide cly-guide--h"
      :style="{ top: `${y}%` }"
    />

    <!-- Live readout, pinned bottom-centre so it never sits under the cursor.
         The frame is scaled down by the parent, so this deliberately runs a
         couple of sizes larger than it would in normal app chrome. -->
    <div v-if="drag" class="cly-readout">
      {{ readout }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type {
  CoverElementBoxes,
  CoverElementColorSource,
  CoverElementId,
} from '@/services/api/types/template.types'
import {
  COVER_ELEMENT_IDS,
  type CoverTextPalette,
  type ResolvedCoverElementBox,
  type ResolvedCoverElements,
} from '@/composables/showcase/useCoverStageLayout'

interface Props {
  /** Every block's current box — already reflects any in-flight drag. */
  elements: ResolvedCoverElements
  /** Blocks the cover is actually rendering; the rest get no handles. */
  visible: Record<CoverElementId, boolean>
  selected: CoverElementId | null
  /**
   * The template's palette, resolved to hex. Drives the selected block's colour
   * swatches; omit it and the toolbar shows text size only.
   */
  palette?: CoverTextPalette
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [CoverElementId | null]
  /** Full map, not a single block: the first drag should persist a complete
   *  free layout rather than one explicit block plus three that would still
   *  shift if someone later nudged a row-model number. */
  change: [elements: CoverElementBoxes, commit: boolean]
  dragging: [boolean]
}>()

const { t } = useAppLanguage()

const labels = computed<Record<CoverElementId, string>>(() => ({
  header: t('management.coverLayoutEditor.blocks.header'),
  logo: t('management.coverLayoutEditor.blocks.logo'),
  invite: t('management.coverLayoutEditor.blocks.invite'),
  guest: t('management.coverLayoutEditor.blocks.guest'),
}))

const renderedIds = computed(() => COVER_ELEMENT_IDS.filter((id) => props.visible[id]))

const boxStyle = (id: CoverElementId) => {
  const box = props.elements[id]
  return {
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
  }
}

// ---------------------------------------------------------------------------
// Handles. `dx`/`dy` are which edges a handle owns: -1 = the leading edge moves,
// 1 = the trailing edge, 0 = that axis is untouched.
// ---------------------------------------------------------------------------
interface HandleSpec {
  key: string
  dx: -1 | 0 | 1
  dy: -1 | 0 | 1
}

const HANDLES: HandleSpec[] = [
  { key: 'nw', dx: -1, dy: -1 },
  { key: 'n', dx: 0, dy: -1 },
  { key: 'ne', dx: 1, dy: -1 },
  { key: 'e', dx: 1, dy: 0 },
  { key: 'se', dx: 1, dy: 1 },
  { key: 's', dx: 0, dy: 1 },
  { key: 'sw', dx: -1, dy: 1 },
  { key: 'w', dx: -1, dy: 0 },
]

// ---------------------------------------------------------------------------
// Drag state. The anchor is the box as it was at pointerdown, and every move
// applies the TOTAL delta to it — accumulating per-frame deltas instead would
// compound the rounding applied on each emit into visible drift over a long
// drag.
// ---------------------------------------------------------------------------
interface DragState {
  id: CoverElementId
  handle: HandleSpec | null
  startBox: ResolvedCoverElementBox
  pointerX: number
  pointerY: number
  /** Stage size in px, captured once — it can't change mid-drag. */
  width: number
  height: number
}

const stageRef = ref<HTMLElement | null>(null)
const drag = ref<DragState | null>(null)
const guides = ref<{ x: number[]; y: number[] }>({ x: [], y: [] })

const MIN_WIDTH = 3
const MIN_HEIGHT = 2
/** Pointer distance at which an edge is considered "on" a guide. */
const SNAP_PX = 5

// Text scale, in the same 40–250% range the editor pane's number field offers.
const FONT_SCALE_MIN = 0.4
const FONT_SCALE_MAX = 2.5
const FONT_SCALE_STEP = 0.05

const round = (value: number): number => Math.round(value * 10) / 10
const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

const readout = computed(() => {
  if (!drag.value) return ''
  const box = props.elements[drag.value.id]
  return drag.value.handle
    ? `${round(box.width)} × ${round(box.height)}`
    : `${round(box.x)} , ${round(box.y)}`
})

// ---------------------------------------------------------------------------
// Snapping. Candidates are the stage's own edges and centre plus every other
// visible block's edges and centre — the lines a person actually aligns to.
// Hold Alt to place something a hair off one of them.
// ---------------------------------------------------------------------------
function guideValues(axis: 'x' | 'y', exclude: CoverElementId): number[] {
  const values = [0, 50, 100]
  for (const id of renderedIds.value) {
    if (id === exclude) continue
    const box = props.elements[id]
    const centre = axis === 'x' ? box.x : box.y
    const size = axis === 'x' ? box.width : box.height
    values.push(centre - size / 2, centre, centre + size / 2)
  }
  return values
}

/**
 * Nudges `edges` (the block's own anchor positions on one axis) onto the nearest
 * guide, returning the shift to apply and the guide that caught it. Picking the
 * single closest pair across all anchors — rather than the first one under the
 * threshold — is what stops a full-width block's left edge from winning over its
 * centre when both are in range.
 */
function snapAxis(
  edges: number[],
  guidesForAxis: number[],
  threshold: number,
): { shift: number; guide: number | null } {
  let best: { shift: number; guide: number; distance: number } | null = null
  for (const edge of edges) {
    for (const guide of guidesForAxis) {
      const distance = Math.abs(guide - edge)
      if (distance > threshold) continue
      if (!best || distance < best.distance) {
        best = { shift: guide - edge, guide, distance }
      }
    }
  }
  return best ? { shift: best.shift, guide: best.guide } : { shift: 0, guide: null }
}

function applyDrag(event: PointerEvent): void {
  const state = drag.value
  if (!state) return

  // A release that happened outside this iframe never delivers pointerup here,
  // and the drag would stay live until the next click. The first move with no
  // button held is the tell.
  if (event.buttons === 0) {
    endDrag()
    return
  }

  const pctX = ((event.clientX - state.pointerX) / state.width) * 100
  const pctY = ((event.clientY - state.pointerY) / state.height) * 100
  const thresholdX = (SNAP_PX / state.width) * 100
  const thresholdY = (SNAP_PX / state.height) * 100
  const snapping = !event.altKey

  const start = state.startBox
  const next: ResolvedCoverElementBox = { ...start }
  const activeGuides: { x: number[]; y: number[] } = { x: [], y: [] }

  if (!state.handle) {
    next.x = start.x + pctX
    next.y = start.y + pctY

    if (snapping) {
      const half = { w: start.width / 2, h: start.height / 2 }
      const x = snapAxis(
        [next.x - half.w, next.x, next.x + half.w],
        guideValues('x', state.id),
        thresholdX,
      )
      const y = snapAxis(
        [next.y - half.h, next.y, next.y + half.h],
        guideValues('y', state.id),
        thresholdY,
      )
      next.x += x.shift
      next.y += y.shift
      if (x.guide !== null) activeGuides.x.push(round(x.guide))
      if (y.guide !== null) activeGuides.y.push(round(y.guide))
    }
  } else {
    // Resize works on edges, then converts back to centre + size, so a handle
    // always leaves the opposite edge exactly where it was.
    let left = start.x - start.width / 2
    let right = start.x + start.width / 2
    let top = start.y - start.height / 2
    let bottom = start.y + start.height / 2

    if (state.handle.dx === -1) left += pctX
    if (state.handle.dx === 1) right += pctX
    if (state.handle.dy === -1) top += pctY
    if (state.handle.dy === 1) bottom += pctY

    if (snapping) {
      if (state.handle.dx === -1) {
        const snap = snapAxis([left], guideValues('x', state.id), thresholdX)
        left += snap.shift
        if (snap.guide !== null) activeGuides.x.push(round(snap.guide))
      } else if (state.handle.dx === 1) {
        const snap = snapAxis([right], guideValues('x', state.id), thresholdX)
        right += snap.shift
        if (snap.guide !== null) activeGuides.x.push(round(snap.guide))
      }
      if (state.handle.dy === -1) {
        const snap = snapAxis([top], guideValues('y', state.id), thresholdY)
        top += snap.shift
        if (snap.guide !== null) activeGuides.y.push(round(snap.guide))
      } else if (state.handle.dy === 1) {
        const snap = snapAxis([bottom], guideValues('y', state.id), thresholdY)
        bottom += snap.shift
        if (snap.guide !== null) activeGuides.y.push(round(snap.guide))
      }
    }

    // Dragging an edge past its opposite would invert the box; hold it at the
    // minimum instead, anchored on the edge that isn't moving.
    if (right - left < MIN_WIDTH) {
      if (state.handle.dx === -1) left = right - MIN_WIDTH
      else if (state.handle.dx === 1) right = left + MIN_WIDTH
    }
    if (bottom - top < MIN_HEIGHT) {
      if (state.handle.dy === -1) top = bottom - MIN_HEIGHT
      else if (state.handle.dy === 1) bottom = top + MIN_HEIGHT
    }

    next.x = (left + right) / 2
    next.y = (top + bottom) / 2
    next.width = right - left
    next.height = bottom - top
  }

  guides.value = activeGuides
  commitBox(state.id, next, false)
}

/** Rounds, clamps to a recoverable range, and publishes the whole map. */
function commitBox(id: CoverElementId, box: ResolvedCoverElementBox, commit: boolean): void {
  const normalized: ResolvedCoverElementBox = {
    // Spread first so every field this function doesn't know about — the type
    // and colour slots, and anything added later — survives a drag. Naming each
    // field individually silently dropped whatever wasn't listed.
    ...box,
    // Centres stay on-stage so a block can hang half off an edge by design but
    // can never be dragged somewhere with no handle left to grab.
    x: round(clamp(box.x, 0, 100)),
    y: round(clamp(box.y, 0, 100)),
    width: round(clamp(box.width, MIN_WIDTH, 200)),
    height: round(clamp(box.height, MIN_HEIGHT, 200)),
    fontScale: round(clamp(box.fontScale, FONT_SCALE_MIN, FONT_SCALE_MAX) * 100) / 100,
  }

  const elements: CoverElementBoxes = {}
  for (const key of COVER_ELEMENT_IDS) {
    elements[key] = key === id ? normalized : { ...props.elements[key] }
  }
  emit('change', elements, commit)
}

function beginDrag(id: CoverElementId, handle: HandleSpec | null, event: PointerEvent): void {
  const rect = stageRef.value?.getBoundingClientRect()
  if (!rect || !rect.width || !rect.height) return

  event.preventDefault()
  if (props.selected !== id) emit('select', id)

  drag.value = {
    id,
    handle,
    startBox: { ...props.elements[id] },
    pointerX: event.clientX,
    pointerY: event.clientY,
    width: rect.width,
    height: rect.height,
  }
  emit('dragging', true)

  // Window listeners rather than pointer capture: the pointer routinely leaves
  // the small box being dragged, and capture on an element that Vue may
  // re-render mid-drag is the fragile version of the same thing.
  window.addEventListener('pointermove', applyDrag)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
}

function endDrag(): void {
  const state = drag.value
  window.removeEventListener('pointermove', applyDrag)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
  guides.value = { x: [], y: [] }
  drag.value = null
  // One final publish with commit set, so a parent can treat the whole gesture
  // as a single edit. The values are already whatever the last move produced.
  // Sent BEFORE clearing `dragging`, so the frame can't drop its local override
  // in the window between the two.
  if (state) commitBox(state.id, { ...props.elements[state.id] }, true)
  emit('dragging', false)
}

const startMove = (id: CoverElementId, event: PointerEvent): void => beginDrag(id, null, event)
const startResize = (id: CoverElementId, handle: HandleSpec, event: PointerEvent): void =>
  beginDrag(id, handle, event)

const clearSelection = (): void => emit('select', null)

// ---------------------------------------------------------------------------
// Type controls for the selected block.
//
// Deliberately not folded into the eight resize handles: those change the
// block's BOX, which is a different thing from the size of the text inside it —
// a partner routinely wants a bigger word in the same rectangle. So text size
// gets its own affordance, and it lives on the block rather than in the editor
// pane because judging type size is the thing you do by looking, not by typing
// a number and waiting to see what happened.
//
// The logo block is excluded throughout: it has no text, and its size IS its
// box. Same rule the editor pane's font-size field already follows.
// ---------------------------------------------------------------------------
const hasText = (id: CoverElementId): boolean => id !== 'logo'

/** The block whose toolbar is showing: the selection, unless it's mid-drag. */
const toolbarId = computed<CoverElementId | null>(() => {
  const id = props.selected
  if (!id || drag.value || !props.visible[id] || !hasText(id)) return null
  return id
})

const toolbarBox = computed(() => (toolbarId.value ? props.elements[toolbarId.value] : null))

/**
 * Flip the toolbar above the block when hanging it below would put it off the
 * bottom of the stage. Cheap threshold rather than a measured collision: the
 * bar is a known ~34px tall against a stage that is always the full viewport.
 */
const toolbarAbove = computed(() => {
  const box = toolbarBox.value
  return !!box && box.y + box.height / 2 > 84
})

const fontScalePercent = computed(() => Math.round((toolbarBox.value?.fontScale ?? 1) * 100))

function setFontScale(id: CoverElementId, value: number): void {
  commitBox(id, { ...props.elements[id], fontScale: value }, true)
}

function bumpFontScale(delta: number): void {
  const id = toolbarId.value
  if (!id) return
  setFontScale(id, (props.elements[id].fontScale ?? 1) + delta)
}

/**
 * Colour swatches, built from whatever palette slots this template actually
 * fills. `null` is the "auto" chip — it clears the block's own choice so the
 * text goes back to the colour that block has always used.
 */
interface SwatchSpec {
  source: CoverElementColorSource | null
  hex: string | null
  label: string
}

const swatches = computed<SwatchSpec[]>(() => {
  const palette = props.palette
  if (!palette) return []
  const slots: Array<Exclude<CoverElementColorSource, 'custom'>> = [
    'primary',
    'secondary',
    'accent',
    'guestname',
  ]
  const chips: SwatchSpec[] = [
    { source: null, hex: null, label: t('management.coverLayoutEditor.colorSources.auto') },
  ]
  for (const slot of slots) {
    const hex = palette[slot]
    if (!hex) continue
    // A template that reuses one hex across slots would otherwise show the same
    // dot several times over, with nothing to tell them apart.
    if (chips.some((chip) => chip.hex?.toLowerCase() === hex.toLowerCase())) continue
    chips.push({ source: slot, hex, label: t(`management.coverLayoutEditor.colorSources.${slot}`) })
  }
  return chips.length > 1 ? chips : []
})

function setColorSource(source: CoverElementColorSource | null): void {
  const id = toolbarId.value
  if (!id) return
  commitBox(id, { ...props.elements[id], colorSource: source ?? undefined }, true)
}

// ---------------------------------------------------------------------------
// Keyboard. Arrow keys are the precision half of "direct manipulation" — a
// pixel-perfect nudge is not something a pointer can do at preview scale.
// ---------------------------------------------------------------------------
const NUDGE = 0.5
const NUDGE_FAST = 2

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('select', null)
    return
  }
  const id = props.selected
  if (!id || !props.visible[id]) return

  // Ctrl/Cmd + up/down scales the text instead of moving the block — the
  // precision counterpart to the toolbar's A−/A+, and the pairing people
  // already expect from every other editor.
  if ((event.ctrlKey || event.metaKey) && hasText(id)) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    const direction = event.key === 'ArrowUp' ? 1 : -1
    setFontScale(id, (props.elements[id].fontScale ?? 1) + direction * FONT_SCALE_STEP)
    return
  }

  const step = event.shiftKey ? NUDGE_FAST : NUDGE
  const box = { ...props.elements[id] }
  switch (event.key) {
    case 'ArrowLeft': box.x -= step; break
    case 'ArrowRight': box.x += step; break
    case 'ArrowUp': box.y -= step; break
    case 'ArrowDown': box.y += step; break
    default: return
  }
  event.preventDefault()
  commitBox(id, box, true)
}

// The frame is its own document, so this only ever fires while the preview
// iframe itself has focus — it can't swallow arrow keys from the form beside it.
onMounted(() => window.addEventListener('keydown', onKeydown))

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pointermove', applyDrag)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
})
</script>

<style scoped>
.cly {
  position: absolute;
  inset: 0;
  /* Above the cover content (z-30) and its decorations, below nothing else —
     the cover stage is the top layer in a preview frame. */
  z-index: 60;
  touch-action: none;
  cursor: default;
  /* Faintly tints the stage so it reads as a mode, not a stray outline. */
  background: rgba(15, 23, 42, 0.06);
}

.cly-box {
  position: absolute;
  transform: translate(-50%, -50%);
  border: 1.5px dashed rgba(30, 144, 255, 0.55);
  border-radius: 4px;
  background: rgba(30, 144, 255, 0.05);
  cursor: grab;
  touch-action: none;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.cly-box:hover {
  border-color: rgba(30, 144, 255, 0.9);
  background: rgba(30, 144, 255, 0.1);
}

.cly-box.is-selected {
  border-style: solid;
  border-color: #1e90ff;
  background: rgba(30, 144, 255, 0.12);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7);
  /* Each box is its own stacking context (they're all transformed), so without
     this the blocks rendered after the selected one paint over its handles and
     its toolbar — which hang outside the box's own bounds. */
  z-index: 2;
}

.cly-box.is-dragging {
  cursor: grabbing;
}

.cly-box__label {
  position: absolute;
  top: 0;
  left: 0;
  transform: translateY(-100%);
  padding: 2px 6px;
  border-radius: 4px 4px 0 0;
  background: #1e90ff;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.cly-box:hover .cly-box__label,
.cly-box.is-selected .cly-box__label {
  opacity: 1;
}

/* Handles are generously sized for a frame that gets scaled down by ~25% in
   the editor's preview column. */
.cly-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border: 2px solid #1e90ff;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.3);
  touch-action: none;
}

.cly-handle--nw { top: 0; left: 0; cursor: nwse-resize; }
.cly-handle--n { top: 0; left: 50%; cursor: ns-resize; }
.cly-handle--ne { top: 0; left: 100%; cursor: nesw-resize; }
.cly-handle--e { top: 50%; left: 100%; cursor: ew-resize; }
.cly-handle--se { top: 100%; left: 100%; cursor: nwse-resize; }
.cly-handle--s { top: 100%; left: 50%; cursor: ns-resize; }
.cly-handle--sw { top: 100%; left: 0; cursor: nesw-resize; }
.cly-handle--w { top: 50%; left: 0; cursor: ew-resize; }

/* Type controls. Sized like the handles above — generously, because the whole
   frame is scaled down by ~25% in the editor's preview column. */
.cly-tools {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, 8px);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.35);
  white-space: nowrap;
  cursor: default;
  z-index: 2;
}

.cly-tools.is-above {
  top: auto;
  bottom: 100%;
  transform: translate(-50%, -8px);
}

.cly-tools__group {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 2px;
}

.cly-tools__group + .cly-tools__group {
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  margin-left: 2px;
  padding-left: 6px;
}

.cly-tool {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.cly-tool:hover {
  background: rgba(255, 255, 255, 0.18);
}

.cly-tool__a {
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
}

.cly-tool__a--sm {
  font-size: 10px;
}

.cly-tools__value {
  min-width: 34px;
  text-align: center;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.cly-swatch {
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.cly-swatch:hover {
  transform: scale(1.15);
}

.cly-swatch.is-active {
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
}

/* The "leave it as it was" chip. A slashed circle rather than a colour, because
   it isn't one — it's the absence of a choice. */
.cly-swatch.is-auto {
  position: relative;
  background: transparent;
  overflow: hidden;
}

.cly-swatch.is-auto::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -20%;
  width: 140%;
  height: 1.5px;
  background: rgba(255, 255, 255, 0.75);
  transform: rotate(-45deg);
}

.cly-guide {
  position: absolute;
  background: #ec4899;
  pointer-events: none;
  z-index: 1;
}

.cly-guide--v {
  top: 0;
  bottom: 0;
  width: 1px;
  transform: translateX(-0.5px);
}

.cly-guide--h {
  left: 0;
  right: 0;
  height: 1px;
  transform: translateY(-0.5px);
}

.cly-readout {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.85);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .cly-box,
  .cly-box__label,
  .cly-tool,
  .cly-swatch {
    transition: none;
  }

  .cly-swatch:hover {
    transform: none;
  }
}
</style>
