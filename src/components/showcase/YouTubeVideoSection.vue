<template>
  <div v-if="youtubeEmbedLink" class="mb-8">
    <!-- Video Header -->
    <div class="text-center laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
      <h2
        class="leading-relaxed py-2 text-lg sm:text-xl md:text-2xl font-medium sm:mb-4 md:mb-6 uppercase"
        :style="{
          fontFamily: primaryFont || currentFont,
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }"
      >
        Video
      </h2>
    </div>
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
    
  </div>
</template>

<script setup lang="ts">
interface Props {
  youtubeEmbedLink?: string | null | undefined
  primaryColor: string
  secondaryColor?: string
  accentColor: string
  currentFont?: string
  primaryFont?: string
  secondaryFont?: string
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