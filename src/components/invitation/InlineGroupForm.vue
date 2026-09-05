<template>
  <!--
    Naming a group, inline.

    This was three differently-tinted boxes — a purple one to create, a blue
    one to edit, a red one to confirm a delete — each with its own bordered
    inputs and its own coloured submit square, sitting inside a plain white
    dropdown. Three palettes for one small form, and two of the hues aren't in
    the system at all (purple is the private-event accent; blue-600 is
    nothing). A form doesn't need a colour to say which mode it is in; the
    label on its button already does that.

    So: one white surface, the same grouped-row vocabulary as everywhere else,
    and the only colour on it is the group's own.
  -->

  <!-- Create / Edit -->
  <div v-if="mode !== 'delete'" class="space-y-2 rounded-xl bg-slate-50/80 p-2">
    <!-- The name field *is* a preview of the row it will become: a dot in the
         chosen colour, then the name, exactly as the group renders in the list
         above. Picking a swatch changes the dot here, so the choice is shown
         where its consequence lands rather than in an abstract swatch. -->
    <div
      class="flex items-center gap-2.5 rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-200 transition-shadow duration-150 ease-out focus-within:ring-2 focus-within:ring-sky-200"
    >
      <span
        class="h-2.5 w-2.5 flex-shrink-0 rounded-full transition-colors duration-150"
        :style="{ backgroundColor: color }"
        aria-hidden="true"
      ></span>
      <input
        ref="nameInputRef"
        v-model="name"
        type="text"
        :placeholder="namePlaceholder"
        :aria-label="namePlaceholder"
        @keydown.enter.prevent="submitCreateOrEdit"
        @keydown.esc.prevent="$emit('cancel')"
        class="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-slate-900 placeholder-slate-400 placeholder:font-normal focus:outline-none focus:ring-0"
      />
    </div>

    <input
      v-model="description"
      type="text"
      :placeholder="descriptionPlaceholder"
      :aria-label="descriptionPlaceholder"
      @keydown.enter.prevent="submitCreateOrEdit"
      @keydown.esc.prevent="$emit('cancel')"
      class="w-full rounded-lg border-0 bg-white px-2.5 py-2 text-sm text-slate-700 placeholder-slate-400 ring-1 ring-slate-200 transition-shadow duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-sky-200"
    />

    <!-- Swatches, not an OS colour picker.
         `<input type="color">` opens a full system colour panel over a 280px
         dropdown to choose a label tint that will only ever be seen as a 6px
         dot — the heaviest possible control for the lightest possible
         decision, and it looks different on every platform. A row of presets
         is one tap, and the picker survives as the last swatch for anyone who
         wants a colour that isn't offered. -->
    <div class="flex flex-wrap items-center gap-1.5 px-0.5 pt-0.5" role="radiogroup" :aria-label="colorLabel">
      <button
        v-for="preset in palette"
        :key="preset"
        type="button"
        role="radio"
        :aria-checked="isSameColor(preset, color)"
        :aria-label="preset"
        @click="color = preset"
        class="swatch h-5 w-5 flex-shrink-0 rounded-full transition-shadow duration-150 ease-out focus:outline-none"
        :class="isSameColor(preset, color) ? 'is-selected' : ''"
        :style="{ backgroundColor: preset }"
      ></button>

      <!-- Custom. A conic sweep says "any colour" without needing a label, and
           the native input rides invisibly on top of it so the OS picker is
           still one tap away. -->
      <label
        class="swatch custom-swatch relative h-5 w-5 flex-shrink-0 cursor-pointer rounded-full"
        :class="isCustom ? 'is-selected' : ''"
        :title="customColorLabel"
      >
        <input
          v-model="color"
          type="color"
          class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          :aria-label="customColorLabel"
        />
      </label>
    </div>

    <!-- Named buttons, not icon squares. A bare tick and a bare cross on a
         form give no answer to "what does this create?", and this form sits in
         a menu where a tick already means "selected". -->
    <div class="flex items-center justify-end gap-1 pt-0.5">
      <button
        type="button"
        @click="$emit('cancel')"
        class="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-200/70 hover:text-slate-900"
      >
        {{ t('management.guestGroupsView.addGuestModal.group.cancelBtn') }}
      </button>
      <button
        type="button"
        @click="submitCreateOrEdit"
        :disabled="!name.trim() || isSubmitting"
        class="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-slate-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span
          v-if="isSubmitting"
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/70 border-t-transparent"
        ></span>
        {{ submitLabel }}
      </button>
    </div>
  </div>

  <!-- Delete confirm -->
  <div v-else class="space-y-2 rounded-xl bg-slate-50/80 p-2.5">
    <p class="text-sm text-slate-900">
      {{ t('management.guestGroupsView.addGuestModal.group.deleteGroupConfirm.deleteConfirm') }}
      <span class="font-semibold">{{ group?.name }}</span>?
    </p>
    <!-- The consequence, in words, in the one place a colour is warranted: it
         is the difference between losing a label and losing twelve guests. -->
    <p v-if="(group?.guest_count ?? 0) > 0" class="text-xs leading-relaxed text-red-600">
      {{ t('management.guestGroupsView.addGuestModal.group.deleteGroupConfirm.guestWarning', { count: group?.guest_count ?? 0 }) }}
    </p>
    <div class="flex items-center justify-end gap-1">
      <button
        type="button"
        @click="$emit('cancel')"
        class="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-200/70 hover:text-slate-900"
      >
        {{ t('management.guestGroupsView.addGuestModal.group.deleteGroupConfirm.cancelBtn') }}
      </button>
      <button
        type="button"
        @click="$emit('submit')"
        :disabled="isSubmitting"
        class="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-red-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          v-if="isSubmitting"
          class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/70 border-t-transparent"
        ></span>
        {{ t('management.guestGroupsView.addGuestModal.group.deleteGroupConfirm.deleteBtn') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type { GuestGroup } from '../../services/api'
import { DEFAULT_GUEST_GROUP_COLOR, isSameColor, resolvePalette } from './guestGroupColors'

const { t } = useI18n()

/**
 * Mount fresh (v-if, not v-show) per open — fields are seeded once from
 * `group` at creation time rather than watched, matching how the parent
 * dropdown/popover already remounts this on every open.
 */
const props = withDefaults(
  defineProps<{
    mode: 'create' | 'edit' | 'delete'
    group?: GuestGroup | null
    isSubmitting?: boolean
  }>(),
  { group: null, isSubmitting: false },
)

const emit = defineEmits<{
  submit: [data?: { name: string; description?: string; color: string }]
  cancel: []
}>()

const name = ref(props.mode === 'edit' ? props.group?.name ?? '' : '')
const description = ref(props.mode === 'edit' ? props.group?.description ?? '' : '')
const color = ref(
  props.mode === 'edit' ? props.group?.color || DEFAULT_GUEST_GROUP_COLOR : DEFAULT_GUEST_GROUP_COLOR,
)

const nameInputRef = ref<HTMLInputElement | null>(null)

/** Seeded once from the colour the form opened with, so the swatch row does
 *  not reshuffle as the custom picker is dragged. */
const palette = resolvePalette(color.value)

const isCustom = computed(() => !palette.some((preset) => isSameColor(preset, color.value)))

const isEdit = computed(() => props.mode === 'edit')
const formKey = computed(() => (isEdit.value ? 'editGroupForm' : 'newGroupForm'))

const namePlaceholder = computed(() =>
  t(`management.guestGroupsView.addGuestModal.group.${formKey.value}.namePlaceholder`),
)
const descriptionPlaceholder = computed(() =>
  t(`management.guestGroupsView.addGuestModal.group.${formKey.value}.descPlaceholder`),
)
const submitLabel = computed(() =>
  isEdit.value
    ? t('management.guestGroupsView.addGuestModal.group.editGroupForm.saveBtn')
    : t('management.guestGroupsView.addGuestModal.group.newGroupForm.createBtn'),
)
const colorLabel = computed(() => t('management.guestGroupsView.addGuestModal.group.colorLabel'))
const customColorLabel = computed(() =>
  t('management.guestGroupsView.addGuestModal.group.customColorLabel'),
)

onMounted(() => {
  if (props.mode !== 'delete') {
    nextTick(() => nameInputRef.value?.focus())
  }
})

const submitCreateOrEdit = () => {
  if (!name.value.trim() || props.isSubmitting) return
  emit('submit', {
    name: name.value.trim(),
    description: description.value.trim() || undefined,
    color: color.value,
  })
}
</script>

<style scoped>
/*
  The selected swatch wears a ring, not a tick: a white check is invisible on
  amber and a dark one is invisible on slate, while a ring sits outside the
  colour entirely and reads the same on all eight. Drawn as two box-shadows —
  a white gap then the ring — so it costs no layout and nothing moves when the
  selection changes.
*/
.swatch {
  box-shadow: inset 0 0 0 1px rgb(15 23 42 / 0.08);
}

.swatch:hover {
  box-shadow:
    inset 0 0 0 1px rgb(15 23 42 / 0.08),
    0 0 0 2px #fff,
    0 0 0 3px rgb(148 163 184 / 0.6); /* slate-400 */
}

.swatch.is-selected,
.swatch.is-selected:hover {
  box-shadow:
    inset 0 0 0 1px rgb(15 23 42 / 0.08),
    0 0 0 2px #fff,
    0 0 0 3.5px rgb(15 23 42 / 0.55);
}

.swatch:focus-visible {
  outline: none;
  box-shadow:
    inset 0 0 0 1px rgb(15 23 42 / 0.08),
    0 0 0 2px #fff,
    0 0 0 4px rgb(186 230 253); /* sky-200 */
}

/* "Any colour", said without a label. */
.custom-swatch {
  background: conic-gradient(
    from 0deg,
    #e11d48,
    #f59e0b,
    #10b981,
    #14b8a6,
    #3498db,
    #6366f1,
    #8b5cf6,
    #e11d48
  );
}

@media (prefers-reduced-motion: reduce) {
  .swatch {
    transition: none;
  }
}
</style>
