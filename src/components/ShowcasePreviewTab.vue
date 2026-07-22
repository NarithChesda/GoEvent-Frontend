<template>
  <div class="showcase-preview-tab">
    <div class="showcase-preview-tab__header">
      <div>
        <h2 class="showcase-preview-tab__title">{{ t('management.showcasePreview.title') }}</h2>
        <p class="showcase-preview-tab__subtitle">{{ t('management.showcasePreview.subtitle') }}</p>
      </div>

      <div v-if="availableLanguages.length > 1" class="showcase-preview-tab__lang-switcher">
        <button
          v-for="lang in availableLanguages"
          :key="lang.language"
          type="button"
          class="showcase-preview-tab__lang-btn"
          :class="{ 'is-active': currentLanguage === lang.language }"
          @click="currentLanguage = lang.language"
        >
          {{ lang.language_display }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="showcase-preview-tab__loading">
      <div class="showcase-preview-tab__spinner" />
      <span>{{ t('management.media.loading') }}</span>
    </div>

    <div v-else-if="error" class="showcase-preview-tab__error">{{ error }}</div>

    <div v-else-if="event?.id" class="showcase-preview-tab__frames">
      <!-- Cover & Main Content are interactive when the user can edit: clicks
           go into the frame for click-to-edit text, while the frame page
           itself neutralizes live buttons/links (RSVP, envelope, music…). -->
      <PreviewFrame :label="t('management.showcasePreview.coverLabel')">
        <InertIframe :src="frameUrl('cover')" :interactive="canEdit" />
      </PreviewFrame>

      <PreviewFrame v-if="showTransitionFrame" :label="t('management.showcasePreview.transitionLabel')">
        <!-- Click anywhere on the frozen transition to replay its animation -->
        <InertIframe :src="frameUrl('transition')" click-message="showcase-preview-replay" />
      </PreviewFrame>
      <div v-else class="showcase-preview-tab__transition-note">
        {{ t('management.showcasePreview.transitionNotUsed') }}
      </div>

      <PreviewFrame :label="t('management.showcasePreview.mainContentLabel')">
        <InertIframe :src="frameUrl('main')" :interactive="canEdit" />
      </PreviewFrame>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useEventShowcase } from '@/composables/useEventShowcase'
import PreviewFrame from './showcase-preview/PreviewFrame.vue'
import InertIframe from './showcase-preview/InertIframe.vue'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

const { t } = useAppLanguage()

// Only used here to gate the Transition frame and drive the language
// switcher/loading/error chrome — the actual stage rendering happens inside
// each <iframe>'s own ShowcasePreviewFrameView instance (each with a genuine
// 1080x1920 browsing-context viewport, since the showcase components rely on
// real vh/vw units that a plain scaled-down div can't satisfy).
const {
  loading,
  error,
  event,
  templateAssets,
  eventPhotos,
  availableLanguages,
  currentLanguage,
  loadShowcase,
} = useEventShowcase({ eventId: props.eventId, skipMetaTags: true })

const isBasicWedding = computed(() => {
  if (!templateAssets.value) return false
  const isBasicMode = !templateAssets.value.standard_cover_video
  const categoryName = (
    event.value.category_details?.name || event.value.category_name || ''
  ).toLowerCase()
  return isBasicMode && categoryName === 'wedding'
})

const hasFeaturedPhoto = computed(() => {
  return eventPhotos.value?.some((p) => p.is_featured) ?? false
})

const showTransitionFrame = computed(() => isBasicWedding.value && hasFeaturedPhoto.value)

const frameUrl = (stage: 'cover' | 'transition' | 'main') => {
  const params = new URLSearchParams({ stage, lang: currentLanguage.value })
  if (props.canEdit && stage !== 'transition') params.set('editable', '1')
  return `/events/${props.eventId}/showcase-preview-frame?${params.toString()}`
}

onMounted(() => {
  loadShowcase()
})
</script>

<style scoped>
.showcase-preview-tab {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.showcase-preview-tab__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.showcase-preview-tab__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(15 23 42);
}

.showcase-preview-tab__subtitle {
  font-size: 0.875rem;
  color: rgb(100 116 139);
  margin-top: 0.25rem;
}

.showcase-preview-tab__lang-switcher {
  display: flex;
  gap: 0.375rem;
  padding: 0.25rem;
  background: rgba(148, 163, 184, 0.12);
  border-radius: 0.75rem;
}

.showcase-preview-tab__lang-btn {
  padding: 0.375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 0.5rem;
  color: rgb(100 116 139);
  transition: all 0.2s ease;
}

.showcase-preview-tab__lang-btn.is-active {
  background: white;
  color: rgb(15 23 42);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
}

.showcase-preview-tab__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem 0;
  color: rgb(100 116 139);
  font-size: 0.875rem;
}

.showcase-preview-tab__spinner {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  border: 2px solid rgba(30, 144, 255, 0.2);
  border-bottom-color: #1e90ff;
  animation: showcase-preview-spin 0.8s linear infinite;
}

@keyframes showcase-preview-spin {
  to {
    transform: rotate(360deg);
  }
}

.showcase-preview-tab__error {
  padding: 2rem;
  text-align: center;
  color: rgb(220 38 38);
  background: rgba(254, 226, 226, 0.5);
  border-radius: 1rem;
}

.showcase-preview-tab__frames {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  padding-bottom: 2rem;
}

.showcase-preview-tab__transition-note {
  font-size: 0.8125rem;
  color: rgb(148 163 184);
  padding: 1.5rem 0;
}
</style>
