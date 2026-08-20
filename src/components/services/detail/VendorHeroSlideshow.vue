<template>
  <!--
    A cross-fading backdrop for the storefront hero, nothing more. It carries
    no scrim and no dots of its own: the hero lays the same scrim over every
    rung of its artwork ladder, and its overlaid name block occupies the corner
    the dots used to sit in. These photos are borrowed from the vendor's own
    listing cards further down the page, so there was never anything here to
    page through deliberately.
  -->
  <div class="absolute inset-0 overflow-hidden">
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
