<template>
  <div class="space-y-2">
    <p class="text-xs font-medium text-slate-600">{{ t('management.partnerTemplateForm.guestFrame.cornersLabel') }}</p>

    <!-- Laid out as an actual 2x2 so the control for a corner sits where that
         corner will render — picking "top right" means clicking the top-right
         cell, with no mental mapping from a flat list of four dropdowns. -->
    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="corner in cells"
        :key="corner.id"
        class="rounded-xl ring-1 ring-slate-200 bg-white p-2.5 space-y-2"
      >
        <p class="text-[0.6875rem] font-medium text-slate-500">{{ corner.label }}</p>

        <div class="flex gap-1" role="radiogroup" :aria-label="corner.label">
          <button
            v-for="option in sourceOptions"
            :key="option.value"
            type="button"
            role="radio"
            :aria-checked="option.value === corner.value.source"
            class="flex-1 px-1.5 py-1 rounded-lg text-[0.6875rem] font-medium ring-1 transition-all duration-200"
            :class="sourceClasses(corner.value.source === option.value, option.missing)"
            :title="option.missing ? t('management.partnerTemplateForm.guestFrame.sourceMissing') : undefined"
            @click="setSource(corner.id, option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="flex gap-1">
          <button
            type="button"
            :aria-pressed="corner.value.flipX"
            class="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded-lg text-[0.6875rem] font-medium ring-1 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            :class="toggleClasses(!!corner.value.flipX)"
            :disabled="corner.value.source === 'none'"
            :title="t('management.partnerTemplateForm.guestFrame.flipX')"
            @click="toggleFlip(corner.id, 'flipX')"
          >
            <FlipHorizontal2 class="w-3 h-3" aria-hidden="true" />
            <span>{{ t('management.partnerTemplateForm.guestFrame.flipXShort') }}</span>
          </button>
          <button
            type="button"
            :aria-pressed="corner.value.flipY"
            class="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded-lg text-[0.6875rem] font-medium ring-1 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            :class="toggleClasses(!!corner.value.flipY)"
            :disabled="corner.value.source === 'none'"
            :title="t('management.partnerTemplateForm.guestFrame.flipY')"
            @click="toggleFlip(corner.id, 'flipY')"
          >
            <FlipVertical2 class="w-3 h-3" aria-hidden="true" />
            <span>{{ t('management.partnerTemplateForm.guestFrame.flipYShort') }}</span>
          </button>
        </div>
      </div>
    </div>

    <p class="text-[0.6875rem] text-slate-400 leading-snug">
      {{ t('management.partnerTemplateForm.guestFrame.cornersHint') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FlipHorizontal2, FlipVertical2 } from 'lucide-vue-next'
import { GUEST_FRAME_CORNER_IDS, GUEST_FRAME_CORNER_DEFAULTS } from '@/composables/showcase/useCoverStageLayout'
import type {
  GuestFrameCorner,
  GuestFrameCornerId,
  GuestFrameCornerSource,
  GuestFrameCorners,
} from '@/services/api/types/template.types'

/**
 * The 2x2 board that assigns each corner position an uploaded slot and its flips.
 *
 * Extracted from PartnerTemplateForm rather than inlined: that file is already
 * ~2,600 lines, and this is the one control in the cover section with real
 * per-cell state of its own.
 */
const props = defineProps<{
  modelValue: GuestFrameCorners
  /** Whether each source slot actually has art, so empty ones can be flagged. */
  hasLeft: boolean
  hasRight: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [GuestFrameCorners] }>()

const { t } = useI18n()

const cornerLabels: Record<GuestFrameCornerId, string> = {
  topLeft: 'guestFrame.cornerTopLeft',
  topRight: 'guestFrame.cornerTopRight',
  bottomLeft: 'guestFrame.cornerBottomLeft',
  bottomRight: 'guestFrame.cornerBottomRight',
}

const cells = computed(() =>
  GUEST_FRAME_CORNER_IDS.map((id) => ({
    id,
    label: t(`management.partnerTemplateForm.${cornerLabels[id]}`),
    // A corner the partner has never touched still needs a value to render from,
    // and it must be the SAME default the showcase resolves to — otherwise the
    // board would show one thing and the preview draw another.
    value: props.modelValue[id] ?? GUEST_FRAME_CORNER_DEFAULTS[id],
  })),
)

const sourceOptions = computed<
  Array<{ value: GuestFrameCornerSource; label: string; missing: boolean }>
>(() => [
  {
    value: 'left',
    label: t('management.partnerTemplateForm.guestFrame.cornerA'),
    missing: !props.hasLeft,
  },
  {
    value: 'right',
    label: t('management.partnerTemplateForm.guestFrame.cornerB'),
    missing: !props.hasRight,
  },
  { value: 'none', label: t('management.partnerTemplateForm.guestFrame.cornerOff'), missing: false },
])

/** Selected wins over missing: an empty slot is a warning, not a lock. */
const sourceClasses = (selected: boolean, missing: boolean): string => {
  if (selected) return 'bg-gradient-to-br from-[#2ecc71]/10 to-[#1e90ff]/10 ring-sky-300 text-slate-900'
  if (missing) return 'bg-white ring-slate-200 text-slate-300 hover:ring-slate-300'
  return 'bg-white ring-slate-200 text-slate-600 hover:ring-slate-300 hover:bg-slate-50'
}

const toggleClasses = (active: boolean): string =>
  active
    ? 'bg-gradient-to-br from-[#2ecc71]/10 to-[#1e90ff]/10 ring-sky-300 text-slate-900'
    : 'bg-white ring-slate-200 text-slate-500 hover:ring-slate-300 hover:bg-slate-50'

/**
 * Writes a whole new corners object rather than mutating in place: the parent
 * holds this inside `form.cover_stage_layout`, and replacing the object is what
 * makes the change land in one reactive tick for the live preview bridge.
 */
const update = (id: GuestFrameCornerId, patch: Partial<GuestFrameCorner>): void => {
  const current = props.modelValue[id] ?? GUEST_FRAME_CORNER_DEFAULTS[id]
  emit('update:modelValue', { ...props.modelValue, [id]: { ...current, ...patch } })
}

const setSource = (id: GuestFrameCornerId, source: GuestFrameCornerSource): void => {
  update(id, { source })
}

const toggleFlip = (id: GuestFrameCornerId, axis: 'flipX' | 'flipY'): void => {
  const current = props.modelValue[id] ?? GUEST_FRAME_CORNER_DEFAULTS[id]
  update(id, { [axis]: !current[axis] })
}
</script>
