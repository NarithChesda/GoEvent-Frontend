<template>
  <V2ChapterShell
    section-id="venue-section"
    :chapter-number="chapterNumber"
    :title="title"
    :current-language="currentLanguage"
  >
    <div class="v2-venue-card">
      <!-- Google Maps embed (iframe only — no map SDK) -->
      <iframe
        v-if="embedUrl"
        class="v2-venue-map"
        :src="embedUrl"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
        title="Event venue map"
      ></iframe>

      <div class="v2-venue-info">
        <h3 v-if="locationText" class="v2-venue-name">{{ locationText }}</h3>
        <button type="button" class="v2-btn-primary" @click="$emit('openMap')">
          <MapPin class="h-4 w-4" aria-hidden="true" />
          {{ translateV2('get_directions', currentLanguage) }}
        </button>
      </div>
    </div>
  </V2ChapterShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MapPin } from 'lucide-vue-next'
import V2ChapterShell from './V2ChapterShell.vue'
import { translateV2 } from '../../../composables/showcase-v2/v2Translations'

interface Props {
  chapterNumber: number
  title: string
  locationText?: string
  googleMapEmbedLink?: string
  currentLanguage?: string
}

const props = defineProps<Props>()

defineEmits<{ openMap: [] }>()

// Only render an iframe for genuine Google Maps embed URLs
const embedUrl = computed(() => {
  const link = props.googleMapEmbedLink
  if (!link) return null
  try {
    const url = new URL(link)
    const isGoogle =
      url.hostname === 'www.google.com' || url.hostname === 'maps.google.com'
    if (isGoogle && (url.pathname.includes('/maps/embed') || url.pathname.includes('/maps'))) {
      return link
    }
  } catch {
    // fall through — invalid URL
  }
  return null
})
</script>

<style scoped>
.v2-venue-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(201, 166, 107, 0.3);
  border-radius: 16px;
  overflow: hidden;
}

.v2-venue-map {
  width: 100%;
  height: 240px;
  border: 0;
  display: block;
  background: #e7e3dc;
}

.v2-venue-info {
  padding: 20px;
  text-align: center;
}

.v2-venue-name {
  font-family: var(--v2-display);
  font-size: 22px;
  font-weight: 600;
  color: var(--v2-charcoal);
  margin-bottom: 14px;
}

.v2-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 12px 26px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-family: var(--v2-body);
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: var(--v2-charcoal);
  color: var(--v2-ivory);
  transition: opacity 0.25s;
}

.v2-btn-primary:hover,
.v2-btn-primary:focus-visible {
  opacity: 0.85;
}
</style>
