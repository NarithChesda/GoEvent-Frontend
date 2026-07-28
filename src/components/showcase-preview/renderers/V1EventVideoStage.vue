<template>
  <!-- Standard templates have no transition stage: between the cover and the
       main content, guests watch the organizer's own event video full screen.
       Visually that stage is exactly this — CoverStage's primary-colour
       backdrop with the event video filling the frame — because for a standard
       template every other VideoContainer layer is gated off
       (`!templateAssets?.standard_cover_video`), the looping cover video is
       stopped, and the cover/main overlays are both hidden.

       Reproduced here rather than driven through CoverStage on purpose: that
       pipeline only ever starts the event video from the envelope tap, i.e.
       from a real user gesture, which is also what lets it play unmuted and
       what makes "video ended" mean "advance to the main content". A preview
       frame has neither — with no gesture the video must be muted to autoplay
       at all, and ending it would hand the screen over to the background video
       and main content, which is the *next* frame's job. So it loops instead. -->
  <div class="event-video-stage" :style="{ backgroundColor: primaryColor }">
    <video
      v-if="eventVideoUrl"
      :key="`${eventVideoUrl}|${replayKey}`"
      v-bind="videoProtectionAttrs"
      :src="eventVideoUrl"
      class="event-video-stage__video"
      autoplay
      loop
      muted
      playsinline
      preload="auto"
    />
  </div>
</template>

<script setup lang="ts">
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'

interface Props {
  /** Full media URL of the event video (already resolved by useEventShowcase). */
  eventVideoUrl: string | null
  /** CoverStage's own backdrop colour, so the frame matches the stages around it. */
  primaryColor: string
  /** Bumped by the frame shell on a bridge `replay` command — remounts the
   *  <video> so a click restarts it from the beginning. */
  replayKey: number
}

defineProps<Props>()

const { videoProtectionAttrs } = useAssetProtection()
</script>

<style scoped>
.event-video-stage {
  position: absolute;
  inset: 0;
  z-index: 10;
  overflow: hidden;
}

/* `cover` rather than VideoContainer's viewport-dependent contain/cover split:
   every preview surface is phone-width (390px studio frames, the device's own
   viewport in the mobile sheet), which is squarely inside that component's
   `max-width: 768px` branch — where it also uses cover. */
.event-video-stage__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  pointer-events: none;
}
</style>
