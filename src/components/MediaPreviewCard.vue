<template>
  <div class="relative group">
    <slot name="media">
      <!-- Default slot for media content (img, video, audio, etc.) -->
    </slot>
    <div
      class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center"
    >
      <p class="text-white font-medium">{{ label }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
}

defineProps<Props>()
</script>
