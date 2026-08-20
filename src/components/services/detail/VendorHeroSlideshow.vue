<template>
  <div class="absolute inset-0 overflow-hidden">
    <!-- Cross-fading image stack with Ken Burns drift -->
    <div
      v-for="(image, index) in images"
      :key="image"
      class="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
      :class="index === currentIndex ? 'opacity-100' : 'opacity-0'"
      aria-hidden="true"
    >
      <img
        :src="image"
        alt=""
        class="w-full h-full object-cover"
        :class="{ 'kenburns': index === currentIndex && images.length > 1 }"
      />
    </div>

    <!-- Legibility scrim for the avatar that overlaps the bottom edge. The top
         edge has none: ServiceHeroActions carries its own scrim, so a second
         one here only stacked with it and took the photo to near-black. -->
    <div
      class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/30 to-transparent pointer-events-none"
      aria-hidden="true"
    ></div>

    <!-- Dots indicator -->
    <div
      v-if="images.length > 1"
      class="absolute bottom-3 right-4 flex items-center gap-1.5"
    >
      <button
        v-for="(image, index) in images"
        :key="`dot-${index}`"
        @click="goTo(index)"
        class="rounded-full transition-all duration-300"
        :class="index === currentIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75'"
        :aria-label="`${index + 1} / ${images.length}`"
      ></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  images: string[]
  /** Milliseconds between slides (default 5000) */
  interval?: number
}>()

const currentIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const startTimer = () => {
  stopTimer()
  if (props.images.length < 2) return
  timer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % props.images.length
  }, props.interval ?? 5000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const goTo = (index: number) => {
  currentIndex.value = index
  startTimer() // reset the cadence after a manual jump
}

onMounted(startTimer)
onUnmounted(stopTimer)
</script>

<style scoped>
/* Slow Ken Burns drift on the active slide; runs slightly longer than the
   slide interval so motion carries through the cross-fade. */
.kenburns {
  animation: kenburns-drift 7s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}

@keyframes kenburns-drift {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.12) translate(-1%, 1%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kenburns {
    animation: none;
  }
}
</style>
