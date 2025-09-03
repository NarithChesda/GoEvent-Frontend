<template>
  <div class="p-6 border-t border-slate-200">
    <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
      <PlayCircle class="w-5 h-5 mr-2 text-red-600" />
      Video Preview
    </h4>
    <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div class="aspect-video">
        <iframe
          :src="youtubeUrl"
          class="w-full h-full"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlayCircle } from 'lucide-vue-next'

interface Props {
  youtubeUrl: string
}

defineProps<Props>()
</script>