<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    class="list-row"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="list-row__text">
      <span class="list-row__label">{{ label }}</span>
      <span v-if="description" class="list-row__hint">{{ description }}</span>
    </span>
    <span aria-hidden="true" class="switch-track" :class="{ 'is-on': modelValue }">
      <span class="switch-knob" />
    </span>
  </button>
</template>

<script setup lang="ts">
/**
 * A settings row whose trailing half is a switch.
 *
 * Shares its anatomy with the event drawers rather than restating it: the two
 * surfaces ask the same kind of question, and a switch that travels a different
 * distance or highlights a different colour here than it does there is two
 * systems for one control. `groupedList.css` carries both.
 *
 * The row expects to live inside a `.list-group`, which draws the border and
 * the hairlines between rows — a lone switch is a one-row group, which is
 * normal, not a special case.
 *
 * NO ICON CHIP. This component used to render the label behind a `p-2 bg-white
 * rounded-lg shadow-sm` disc, which put a card inside a row inside a bordered
 * panel; with nine switches in the editor the discs read as texture rather than
 * as nine distinct meanings, and the three that shared the `Sparkles` glyph
 * actively suggested they did the same thing. Removed here for the same reason
 * it was removed from both drawers.
 */
defineProps<{
  modelValue: boolean
  label: string
  description?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
</script>

<style scoped src="../common/groupedList.css"></style>
