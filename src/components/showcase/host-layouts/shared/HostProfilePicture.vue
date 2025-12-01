<template>
  <div
    class="profile-picture-container"
    :class="{ 'bounce-in-element': animated }"
    :style="animated ? { animationDelay: `${animationDelay}s` } : undefined"
  >
    <!-- Profile image -->
    <div
      v-if="imageUrl"
      class="profile-picture-wrapper"
      :class="wrapperClass"
      :style="{ background: backgroundColor }"
    >
      <img
        :src="resolvedImageUrl"
        :alt="alt"
        class="profile-picture"
      />
    </div>
    <!-- Fallback icon -->
    <div
      v-else
      class="profile-picture-fallback"
      :class="wrapperClass"
      :style="{ background: backgroundColor }"
    >
      <User class="profile-icon" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { User } from 'lucide-vue-next'
import { getMediaUrl } from '@/composables/showcase/useHostInfoUtils'

interface Props {
  imageUrl?: string | null
  alt?: string
  backgroundColor: string
  animated?: boolean
  animationDelay?: number
  wrapperClass?: string
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  alt: 'Profile picture',
  animated: false,
  animationDelay: 0,
  wrapperClass: '',
  size: 'medium',
})

const resolvedImageUrl = computed(() => getMediaUrl(props.imageUrl))
</script>

<style scoped>
.profile-picture-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.profile-picture-wrapper {
  width: 75%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  padding: 2px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.profile-picture {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: none;
}

.profile-picture-fallback {
  width: 75%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.profile-icon {
  width: 50%;
  height: 50%;
  color: white;
}

/* Bounce In Animation */
.bounce-in-element {
  opacity: 0;
  animation: bounceInElement 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes bounceInElement {
  0% {
    opacity: 0;
    transform: translateY(15px);
  }
  30% {
    opacity: 1;
  }
  50% {
    transform: translateY(-3px);
  }
  75% {
    transform: translateY(1px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Size variants */
.profile-picture-wrapper.size-small,
.profile-picture-fallback.size-small {
  width: 60%;
}

.profile-picture-wrapper.size-large,
.profile-picture-fallback.size-large {
  width: 90%;
}

/* Responsive adjustments */
@media (min-width: 1024px) and (max-width: 1919px) {
  .profile-picture-wrapper,
  .profile-picture-fallback {
    width: 75%;
  }
}

@media (min-width: 1920px) {
  .profile-picture-wrapper,
  .profile-picture-fallback {
    width: 62%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bounce-in-element {
    animation: none;
    opacity: 1;
  }
}
</style>
