<template>
  <div v-if="hasPresets">
    <label class="block text-sm font-medium text-slate-700 mb-2">
      {{ t('management.embeds.map.presets.label') }}
    </label>

    <SelectField
      :model-value="activePresetId"
      :options="options"
      :placeholder="t('management.embeds.map.presets.placeholder')"
      :title="t('management.embeds.map.presets.label')"
      :disabled="disabled"
      :searchable="isSearchable"
      :search-placeholder="t('management.embeds.map.presets.searchPlaceholder')"
      :no-results-text="t('management.embeds.map.presets.noResults')"
      @update:model-value="onSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useVenueMapPresets } from '@/composables/useVenueMapPresets'
import SelectField, { type SelectFieldOption } from '@/components/common/SelectField.vue'

/** Below this, a filter box is more chrome than help. */
const SEARCH_THRESHOLD = 8

interface Props {
  /** The link currently on the event — used to preselect a matching preset. */
  currentLink?: string | null
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), { currentLink: '', disabled: false })

const emit = defineEmits<{ select: [embedUrl: string] }>()

const { t } = useAppLanguage()
const { presets, activePresetId, hasPresets } = useVenueMapPresets(toRef(props, 'currentLink'))

const isSearchable = computed(() => presets.value.length >= SEARCH_THRESHOLD)

const options = computed<SelectFieldOption[]>(() =>
  presets.value.map((preset) => ({
    value: preset.id,
    label: preset.displayName,
    description: preset.displayCity || undefined,
    // Keep the other language searchable: a Khmer-locale user may still type
    // the venue's Latin name, and vice versa.
    keywords: [preset.name, preset.nameKh, preset.city, preset.cityKh]
      .filter(Boolean)
      .join(' '),
  })),
)

const onSelect = (value: string | number) => {
  if (props.disabled) return
  const preset = presets.value.find((item) => item.id === value)
  if (preset) emit('select', preset.embedUrl)
}
</script>
