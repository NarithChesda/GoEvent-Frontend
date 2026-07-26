<template>
  <!-- Editable mode: only when the preview frame provides the edit context -->
  <div
    v-if="ctx"
    ref="rootRef"
    class="inline-editable"
    :class="{ 'is-saving': saving }"
  >
    <div
      v-if="!isEditing"
      ref="displayRef"
      class="inline-editable__display inline-edit-control"
      role="button"
      tabindex="0"
      :title="editHint"
      @click.stop.prevent="start"
      @keydown.enter.stop.prevent="start"
    >
      <slot />
    </div>
    <textarea
      v-else-if="multiline"
      :ref="setInputRef"
      v-model="draft"
      class="inline-edit-control inline-editable__input inline-editable__input--multiline"
      :style="editStyle"
      rows="1"
      @input="autoGrow"
      @keydown.esc.stop.prevent="cancel"
      @keydown.enter.stop="onMultilineEnter"
      @click.stop
      @blur="commit"
    ></textarea>
    <input
      v-else
      :ref="setInputRef"
      v-model="draft"
      class="inline-edit-control inline-editable__input"
      :style="editStyle"
      type="text"
      @keydown.enter.stop.prevent="commit"
      @keydown.esc.stop.prevent="cancel"
      @click.stop
      @blur="commit"
    />
  </div>

  <!-- Production / read-only preview: bare slot, no wrapper element at all -->
  <slot v-else />
</template>

<script setup lang="ts">
import { computed, inject, nextTick, ref } from 'vue'
import { InlineEditKey, type InlineEditTarget } from './editContext'

interface Props {
  /** The current raw value editing starts from (usually the displayed text,
   *  including any fallback, so click-to-edit feels WYSIWYG). */
  value?: string | null
  target: InlineEditTarget
  multiline?: boolean
  /** Fallback style for the field, used only for whatever the live measurement
   *  below can't resolve (font family / color). */
  inputStyle?: Record<string, string>
}

const props = defineProps<Props>()

const ctx = inject(InlineEditKey, undefined)

const isEditing = ref(false)
const saving = ref(false)
const draft = ref('')

const rootRef = ref<HTMLElement | null>(null)
const displayRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)

/** Typography + geometry copied off the rendered text at edit time. */
const mirrored = ref<Record<string, string>>({})

const editStyle = computed(() => ({ ...(props.inputStyle ?? {}), ...mirrored.value }))

const editHint = 'Click to edit'

// ---------------------------------------------------------------------------
// Mirroring the rendered text
//
// The field used to be styled in `em`, which resolves against this wrapper's
// inherited font size — not the showcase type inside the slot — so editing a
// 13px location line or a 24px host name both produced the same ~16px box, and
// the text re-wrapped at completely different points than the invitation it was
// editing. Everything that affects a line box is instead read straight off the
// live element the moment editing starts, so the caret sits in a box that wraps
// character-for-character like the rendered text.
// ---------------------------------------------------------------------------

/** Read off the element that actually paints the glyphs. */
const TYPE_PROPS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'fontVariant',
  'letterSpacing',
  'wordSpacing',
  'lineHeight',
  'textTransform',
  'color',
] as const

/** Read off the block box that text wraps inside. */
const BOX_PROPS = [
  'textAlign',
  'textIndent',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'overflowWrap',
  'wordBreak',
  'hyphens',
] as const

const BLOCK_DISPLAYS = new Set(['block', 'flex', 'grid', 'flow-root', 'list-item', 'table'])

const hasOwnText = (el: Element) =>
  Array.from(el.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '',
  )

/** The block box the text occupies — width, padding and alignment come from
 *  here, so the field gets the same line box to wrap inside. Descends through
 *  pure wrapper elements but stops at inline boxes (a one-word paragraph's
 *  single `<span>` is only as wide as the word, not the line). */
const findTextBox = (root: HTMLElement): HTMLElement => {
  let el: HTMLElement = root
  for (let depth = 0; depth < 4; depth++) {
    const kids = Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement)
    const only = kids.length === 1 ? kids[0] : null
    if (!only || hasOwnText(el) || !BLOCK_DISPLAYS.has(getComputedStyle(only).display)) break
    el = only
  }
  return el
}

/** The element whose computed type the glyphs are painted with — often a
 *  descendant of the box: the animated showcase text wraps every word in its
 *  own `<span>`, and AutoFitText writes its fitted font-size onto an inner span
 *  rather than the container. Hidden measurement nodes (AutoFitText keeps one
 *  at the unfitted base size) are skipped. */
const findTypeSource = (box: HTMLElement): HTMLElement => {
  for (const el of Array.from(box.querySelectorAll<HTMLElement>('*'))) {
    if (!hasOwnText(el)) continue
    if (el.closest('[aria-hidden="true"]')) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none') continue
    return el
  }
  return box
}

// iOS Safari zooms the page whenever a focused field computes under 16px, and
// this preview is a transform-scaled iframe — that zoom parks the caret nowhere
// near the finger. It's the only engine that does this, so it's the only one
// that trades an exact match for a usable caret.
const isIOS =
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

const clampFontSize = (raw: string) => {
  if (!isIOS) return raw
  const px = Number.parseFloat(raw)
  return Number.isFinite(px) && px < 16 ? '16px' : raw
}

// The field needs a backing plate to stay legible over a patterned invitation,
// but the plate can't be a fixed colour once the text colour is mirrored: the
// calendar design's location header is white-on-map, and white text on a white
// plate is an invisible field. Pick the plate from the text's own luminance so
// light type gets a dark backing and everything else keeps the light one.
const PLATE_LIGHT = 'rgba(255, 255, 255, 0.88)'
const PLATE_DARK = 'rgba(17, 24, 39, 0.86)'

const relativeLuminance = (color: string): number | null => {
  const channels = color.match(/rgba?\(([^)]+)\)/)?.[1]?.split(',').map(Number.parseFloat)
  if (!channels || channels.length < 3 || !channels.slice(0, 3).every(Number.isFinite)) return null
  const [r, g, b] = channels
  const linear = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

const plateFor = (color: string) => {
  const luminance = relativeLuminance(color)
  return luminance !== null && luminance > 0.6 ? PLATE_DARK : PLATE_LIGHT
}

const measureDisplay = (): Record<string, string> => {
  const root = rootRef.value
  const display = displayRef.value
  if (!root || !display) return {}

  const box = findTextBox(display)
  const typeSource = findTypeSource(box)
  const boxStyle = getComputedStyle(box)
  const typeStyle = getComputedStyle(typeSource)

  const style: Record<string, string> = {}
  for (const prop of TYPE_PROPS) style[prop] = typeStyle[prop]
  for (const prop of BOX_PROPS) style[prop] = boxStyle[prop]
  style.fontSize = clampFontSize(typeStyle.fontSize)
  style.backgroundColor = plateFor(typeStyle.color)

  // Match the box's exact width and horizontal position, not just the wrapper's
  // — a centred or inset text box wraps at different points than its container.
  const boxRect = box.getBoundingClientRect()
  const rootRect = root.getBoundingClientRect()
  if (boxRect.width > 0) {
    style.width = `${boxRect.width}px`
    style.marginLeft = `${boxRect.left - rootRect.left}px`
  }

  return style
}

/** Grow the textarea to its content so the editable block occupies the same
 *  space — and breaks across the same number of lines — as the rendered text. */
const autoGrow = () => {
  const el = inputRef.value
  if (!(el instanceof HTMLTextAreaElement)) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

const start = () => {
  if (saving.value) return
  mirrored.value = measureDisplay()
  draft.value = props.value ?? ''
  isEditing.value = true
}

const cancel = () => {
  isEditing.value = false
}

/** Enter inserts a line break (that's the whole point of the multiline field);
 *  Ctrl/Cmd+Enter is the explicit "done" for anyone who'd rather not click away. */
const onMultilineEnter = (event: KeyboardEvent) => {
  if (!event.ctrlKey && !event.metaKey) return
  event.preventDefault()
  commit()
}

const commit = async () => {
  if (!isEditing.value || !ctx) return
  isEditing.value = false
  // Only the outer whitespace goes — the line breaks the author typed are the
  // layout they asked for, and the showcase renders them verbatim.
  const newValue = draft.value.trim()
  if (newValue === (props.value ?? '').trim()) return
  saving.value = true
  try {
    await ctx.save(props.target, newValue)
  } finally {
    saving.value = false
  }
}

const setInputRef = (el: unknown) => {
  const input = el as HTMLInputElement | HTMLTextAreaElement | null
  inputRef.value = input
  if (input && document.activeElement !== input) {
    input.focus()
    if (props.multiline) {
      // A composed paragraph — its line breaks are the author's layout, so it
      // opens ready to amend (caret at the end) rather than one keystroke away
      // from being wiped. Short single-line fields still select-to-replace.
      input.setSelectionRange(input.value.length, input.value.length)
    } else {
      input.select()
    }
    nextTick(autoGrow)
    // Touch: the on-screen keyboard covers roughly the bottom half of the
    // frame, and the frame itself is a fixed-height viewport that can't shrink
    // to make room — so anything below the fold is edited blind unless it's
    // pulled to the middle first.
    if (window.matchMedia?.('(pointer: coarse)').matches) {
      input.scrollIntoView({ block: 'center' })
    }
  }
}
</script>

<style scoped>
.inline-editable {
  position: relative;
  width: 100%;
}

.inline-editable__display {
  cursor: text;
  border-radius: 6px;
  outline: 1.5px dashed transparent;
  outline-offset: 3px;
  transition: outline-color 0.15s ease;
  position: relative;
}

.inline-editable__display:hover,
.inline-editable__display:focus-visible {
  outline-color: rgba(30, 144, 255, 0.65);
}

.inline-editable__display:hover::after {
  content: '✎';
  position: absolute;
  top: -0.4em;
  right: -0.2em;
  font-size: 0.7em;
  line-height: 1;
  color: #1e90ff;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 0.22em;
  pointer-events: none;
}

.is-saving .inline-editable__display {
  opacity: 0.55;
  pointer-events: none;
}

/* The persistent "hints mode" variant of the hover affordances above lives in
   ShowcasePreviewFrameView's scoped block (it owns the `.preview-hints-on`
   root class and reaches in with :deep()) — see the note in EditableRegion.vue
   for why it must not be written here as `:global(.preview-hints-on) .x`. */

/* Everything typographic here is a FALLBACK for the rare case measurement
   can't resolve the text box; the inline style from measureDisplay() normally
   wins on every one of these. The edit affordance is drawn with `outline`
   rather than `border` on purpose: a border would eat into the content box and
   shift where the text wraps, which is exactly what this component is trying
   to keep identical. */
.inline-editable__input {
  display: block;
  box-sizing: border-box;
  width: 100%;
  background: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 6px;
  padding: 0;
  text-align: center;
  font-size: 1em;
  line-height: 1.4;
  color: inherit;
  outline: 1.5px solid rgba(30, 144, 255, 0.7);
  outline-offset: 2px;
  box-shadow: 0 2px 12px rgba(30, 144, 255, 0.18);
}

.inline-editable__input--multiline {
  /* Height is driven by autoGrow(), so the field never scrolls internally and
     never leaves a manual resize handle out of sync with the content. */
  resize: none;
  overflow: hidden;
  white-space: pre-wrap;
}
</style>
