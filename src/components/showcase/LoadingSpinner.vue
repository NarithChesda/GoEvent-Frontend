<template>
  <div class="showcase-container flex items-center justify-center bg-black">
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
        :style="{ borderBottomColor: primaryColor || '#3B82F6' }"
      />
      <p class="text-xl font-medium" :style="{ color: primaryColor || '#FFFFFF' }">
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  primaryColor?: string
  message?: string
}

withDefaults(defineProps<Props>(), {
  primaryColor: '#3B82F6',
  message: 'Loading...',
})
</script>

<style scoped>
/* `dvh` alongside each `vh` fallback: `100vh` is the chrome-hidden height on
   mobile, which overflowed the visible area. Matches `.showcase-container` in
   EventShowcaseRefactored.vue so the spinner and the stage are the same size. */
.showcase-container {
  width: 100%;
  max-width: 1080px;
  height: 100vh;
  height: 100dvh;
  max-height: 1920px;
  position: relative;
  overflow: hidden;
  background: #000;
  margin: 0 auto;
}

/* For desktop screens, maintain aspect ratio */
@media (min-aspect-ratio: 1080/1920) {
  .showcase-container {
    width: calc(100vh * 1080 / 1920);
    width: calc(100dvh * 1080 / 1920);
    height: 100vh;
    height: 100dvh;
  }
}
</style>
