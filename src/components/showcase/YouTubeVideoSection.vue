<template>
  <div v-if="youtubeEmbedLink" class="mb-8">
    <h2
      class="text-xl font-semibold mb-4 text-center"
      :style="{
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }"
    >
      Video
    </h2>
    <div class="aspect-video rounded-xl overflow-hidden">
      <iframe
        :src="youtubeEmbedLink"
        width="100%"
        height="100%"
        style="border:0;"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        :allowfullscreen="true"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      />
    </div>
    
    <!-- Video Section Endline -->
    <div class="flex justify-center mt-6">
      <div class="w-16 h-px opacity-30" :style="{ backgroundColor: primaryColor }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  youtubeEmbedLink?: string | null | undefined
  primaryColor: string
  secondaryColor?: string
  accentColor: string
}

defineProps<Props>()
</script>

<style scoped>
.glass-section {
  background: rgba(255, 255, 255, 0.20);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
</style>