<template>
  <footer ref="rootEl" class="v2-footer relative z-10 px-6 pb-28 pt-16 text-center">
    <div class="mx-auto max-w-md">
      <p class="v2-monogram">{{ monogram }}</p>
      <p class="v2-footer-thanks">{{ thankYouText }}</p>
      <p class="v2-footer-credit">
        {{ translateV2('made_with', currentLanguage) }} ♥ {{ translateV2('on_goevent', currentLanguage) }}
        ·
        <a
          href="https://www.goevent.online"
          target="_blank"
          rel="noopener noreferrer"
          class="v2-footer-link"
        >
          www.goevent.online
        </a>
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useScrollStory } from '../../../composables/showcase-v2/useScrollStory'
import { translateV2 } from '../../../composables/showcase-v2/v2Translations'

interface Props {
  thankYouText: string
  monogram: string
  currentLanguage?: string
}

defineProps<Props>()

const rootEl = ref<HTMLElement | null>(null)
const { createStory } = useScrollStory(rootEl)

onMounted(() => {
  createStory(({ gsap }) => {
    // Simple fade-in — no scroll pinning needed for the closing page
    gsap.from(rootEl.value, {
      opacity: 0,
      y: 20,
      duration: 1,
      scrollTrigger: { trigger: rootEl.value, start: 'top 90%', toggleActions: 'play none none none' },
    })
  })
})
</script>

<style scoped>
.v2-footer {
  font-family: var(--v2-body);
}

.v2-monogram {
  font-family: var(--v2-display);
  font-size: 38px;
  font-style: italic;
  color: var(--v2-gold);
}

.v2-footer-thanks {
  font-family: var(--v2-display);
  font-size: 19px;
  font-style: italic;
  color: var(--v2-charcoal);
  margin: 10px 0 6px;
}

.v2-footer-credit {
  font-size: 13px;
  letter-spacing: 0.05em;
  color: var(--v2-sage-deep);
}

.v2-footer-link {
  color: var(--v2-gold);
  text-decoration: none;
}

.v2-footer-link:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
