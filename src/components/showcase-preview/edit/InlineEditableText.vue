<template>
  <!-- Editable mode: only when the preview frame provides the edit context -->
  <div
    v-if="ctx"
    class="inline-editable"
    :class="{ 'is-saving': saving }"
  >
    <div
      v-if="!isEditing"
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
      :style="inputStyle"
      rows="3"
      @keydown.esc.stop.prevent="cancel"
      @keydown.enter.stop
      @click.stop
      @blur="commit"
    ></textarea>
    <input
      v-else
      :ref="setInputRef"
      v-model="draft"
      class="inline-edit-control inline-editable__input"
      :style="inputStyle"
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
import { inject, ref } from 'vue'
import { InlineEditKey, type InlineEditTarget } from './editContext'

interface Props {
  /** The current raw value editing starts from (usually the displayed text,
   *  including any fallback, so click-to-edit feels WYSIWYG). */
  value?: string | null
  target: InlineEditTarget
  multiline?: boolean
  /** Style carried onto the input so it visually matches the display text
   *  (font family / color); size and alignment come from CSS. */
  inputStyle?: Record<string, string>
}

const props = defineProps<Props>()

const ctx = inject(InlineEditKey, undefined)

const isEditing = ref(false)
const saving = ref(false)
const draft = ref('')

const editHint = 'Click to edit'

const start = () => {
  if (saving.value) return
  draft.value = props.value ?? ''
  isEditing.value = true
}

const cancel = () => {
  isEditing.value = false
}

const commit = async () => {
  if (!isEditing.value || !ctx) return
  isEditing.value = false
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
  if (input && document.activeElement !== input) {
    input.focus()
    input.select()
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

/* iOS auto-zooms the whole frame when a focused field computes under 16px,
   which on a transform-scaled preview leaves the caret nowhere near the
   finger. The showcase's own type is often larger than this anyway, so the
   floor only bites on the small strings. */
@media (pointer: coarse) {
  .inline-editable__input {
    font-size: max(1em, 16px);
  }
}

.inline-editable__input {
  display: block;
  width: 100%;
  background: rgba(255, 255, 255, 0.85);
  border: 1.5px solid rgba(30, 144, 255, 0.7);
  border-radius: 8px;
  padding: 0.25em 0.5em;
  text-align: center;
  font-size: 1em;
  line-height: 1.4;
  color: inherit;
  outline: none;
  box-shadow: 0 2px 12px rgba(30, 144, 255, 0.18);
}

.inline-editable__input--multiline {
  resize: vertical;
  min-height: 3.5em;
  white-space: pre-wrap;
}
</style>
