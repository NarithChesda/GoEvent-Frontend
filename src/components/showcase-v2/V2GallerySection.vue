<template>
  <V2ChapterShell
    section-id="gallery-section"
    :chapter-number="chapterNumber"
    :title="title"
    :current-language="currentLanguage"
    :self-revealing-body="true"
  >
    <div ref="rootEl" class="v2-gallery">
      <button
        v-for="(photo, index) in photos"
        :key="photo.id"
        type="button"
        class="v2-g-item"
        :aria-label="photo.caption || `Photo ${index + 1}`"
        @click="$emit('openPhoto', photo)"
      >
        <img
          :src="getMediaUrl(photo.image)"
          :alt="photo.caption || ''"
          loading="lazy"
          @load="onImageLoad"
        />
        <span v-if="photo.caption" class="v2-g-caption">{{ photo.caption }}</span>
      </button>
    </div>
  </V2ChapterShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import V2ChapterShell from './V2ChapterShell.vue'
import { useScrollStory, refreshScrollTriggers } from '../../composables/showcase-v2/useScrollStory'
import type { EventPhoto } from '../../composables/useEventShowcase'

interface Props {
  chapterNumber: number
  title: string
  photos: EventPhoto[]
  getMediaUrl: (url: string) => string
  currentLanguage?: string
}

defineProps<Props>()

defineEmits<{ openPhoto: [photo: EventPhoto] }>()

const rootEl = ref<HTMLElement | null>(null)
const { createStory } = useScrollStory(rootEl)

// Lazy images change layout height as they land — keep trigger positions honest
const onImageLoad = () => refreshScrollTriggers()

onMounted(() => {
  createStory(({ gsap, ScrollTrigger }) => {
    if (!rootEl.value) return
    const items = gsap.utils.toArray<HTMLElement>('.v2-g-item', rootEl.value)
    // GSAP handles the reveal stagger only — layout is pure CSS
    ScrollTrigger.batch(items, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) =>
        gsap.from(batch, {
          opacity: 0,
          y: 30,
          scale: 0.96,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power2.out',
        }),
    })
  })
})
</script>

<style scoped>
/* Mobile: horizontal snap strip · Desktop: 3-column grid */
.v2-gallery {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 10px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--v2-blush) transparent;
}

.v2-gallery::-webkit-scrollbar {
  height: 5px;
}

.v2-gallery::-webkit-scrollbar-thumb {
  background: var(--v2-blush);
  border-radius: 99px;
}

.v2-g-item {
  position: relative;
  flex: 0 0 72%;
  scroll-snap-align: center;
  height: 230px;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  border: none;
  padding: 0;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 12px 26px rgba(62, 58, 54, 0.14);
}

.v2-g-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.v2-g-item:hover img,
.v2-g-item:focus-visible img {
  transform: scale(1.05);
}

.v2-g-caption {
  position: absolute;
  left: 12px;
  bottom: 10px;
  font-family: var(--v2-display);
  font-style: italic;
  font-size: 14px;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
}

@media (min-width: 700px) {
  .v2-gallery {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    overflow: visible;
  }

  .v2-g-item {
    flex: none;
    height: 200px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .v2-g-item img {
    transition: none;
  }
}
</style>
