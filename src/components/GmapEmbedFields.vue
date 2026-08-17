<template>
  <!-- The Google Maps editor body: preset picker (primary) + manual paste
       (fallback) + live preview. Lives inside GmapEmbedModal, which is the one
       editing surface for the map — both the showcase preview's map region and
       the media tab's Google Maps card open it, so there is only ever one place
       to learn. -->
  <div class="space-y-3">
    <VenueMapPresetPicker
      :current-link="previewUrl"
      :disabled="disabled"
      @select="applyPreset"
    />

    <!-- Fallback for venues that aren't in the curated list. Collapsed by
         default; auto-opened when the current link isn't a preset. -->
    <div class="border-t border-slate-100 pt-3">
      <button
        type="button"
        class="w-full flex items-center justify-between gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 rounded-lg"
        :aria-expanded="isManualOpen"
        @click="isManualOpen = !isManualOpen"
      >
        <span class="text-sm font-medium text-slate-700">
          {{ t('management.embeds.map.manual.toggle') }}
        </span>
        <ChevronDown
          class="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200"
          :class="{ 'rotate-180': isManualOpen }"
          aria-hidden="true"
        />
      </button>

      <Transition name="collapse">
        <div v-if="isManualOpen" class="grid grid-rows-[1fr]">
          <div class="min-h-0 overflow-hidden">
            <div class="pt-3">
              <textarea
                :value="modelValue"
                rows="3"
                :disabled="disabled"
                :placeholder="t('management.embeds.map.inputPlaceholder')"
                :class="[
                  'w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white resize-none transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed',
                  showInvalid
                    ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                    : 'border-slate-300 focus:ring-sky-200 focus:border-sky-400'
                ]"
                @input="onManualInput"
              ></textarea>
              <p v-if="showInvalid" class="text-xs sm:text-sm text-red-600 mt-1">
                {{ t('management.embeds.map.invalidUrl') }}
              </p>
              <p v-else class="text-xs sm:text-sm text-slate-500 mt-1">
                {{ t('management.embeds.map.hint') }}
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Framed the way the showcase itself frames the map, so what you approve
         here is the shape guests get. -->
    <div v-if="previewUrl" class="rounded-2xl border border-slate-200 overflow-hidden">
      <div class="aspect-video">
        <iframe
          :src="previewUrl"
          width="100%"
          height="100%"
          style="border: 0"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          :title="t('management.embeds.map.title')"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import VenueMapPresetPicker from '@/components/VenueMapPresetPicker.vue'
import { isPresetUrl } from '@/composables/useVenueMapPresets'
import { extractGoogleMapsEmbedUrl } from '@/utils/embedExtractor'

interface Props {
  /** The raw link/iframe text being edited. */
  modelValue: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), { disabled: false })

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useAppLanguage()

const isManualOpen = ref(false)

/** Accepts a bare URL or a full <iframe> paste; empty when neither. */
const previewUrl = computed(() => extractGoogleMapsEmbedUrl(props.modelValue))
const showInvalid = computed(() => props.modelValue.trim() !== '' && !previewUrl.value)

// A link that matches no preset was typed/pasted by hand — show it in the
// field it came from rather than hiding it behind a closed panel.
watch(
  () => props.modelValue,
  (link) => {
    const trimmed = link.trim()
    if (trimmed !== '' && !isPresetUrl(trimmed)) isManualOpen.value = true
  },
  { immediate: true },
)

const applyPreset = (embedUrl: string) => {
  if (props.disabled) return
  emit('update:modelValue', embedUrl)
  // A preset covers it — no reason to keep the paste field in the way.
  isManualOpen.value = false
}

const onManualInput = (event: globalThis.Event) => {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
</script>

<style scoped>
/* Collapse/expand via grid-template-rows 0fr↔1fr — tracks real content
   height so both directions ease evenly (no max-height dead time) */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none !important;
  }
}
</style>
