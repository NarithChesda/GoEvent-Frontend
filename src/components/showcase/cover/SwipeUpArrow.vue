<template>
  <div class="swipe-up-arrow animation-delay-800" :style="positionStyle">
    <div class="arrow-stack">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        :stroke="color"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="arrow-icon arrow-1"
      >
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        :stroke="color"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="arrow-icon arrow-2"
      >
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  color: string
  bottom?: number
}

const props = withDefaults(defineProps<Props>(), {
  bottom: 5,
})

const positionStyle = computed(() => ({
  bottom: `${props.bottom}vh`,
}))
</script>

<style scoped>
.swipe-up-arrow {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.animation-delay-800 {
  animation-delay: 800ms;
}

.arrow-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: -32px;
}

.arrow-icon {
  width: 48px;
  height: 48px;
  display: block;
  stroke-width: 3;
  margin-top: -28px;
}

.arrow-icon:first-child {
  margin-top: 0;
}

.arrow-1 {
  animation: arrowFloat1 1.5s ease-in-out infinite;
}

.arrow-2 {
  animation: arrowFloat2 1.5s ease-in-out infinite;
}

@keyframes arrowFloat1 {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-12px);
    opacity: 1;
  }
}

@keyframes arrowFloat2 {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-12px);
    opacity: 1;
  }
}

/* Responsive arrow size */
@media (max-width: 640px) {
  .arrow-icon {
    width: 40px;
    height: 40px;
    margin-top: -24px;
  }

  .arrow-icon:first-child {
    margin-top: 0;
  }

  .swipe-up-arrow {
    bottom: 3vh;
  }

  .arrow-stack {
    margin-top: -28px;
  }
}

@media (min-width: 1024px) {
  .arrow-icon {
    width: 56px;
    height: 56px;
    margin-top: -32px;
  }

  .arrow-icon:first-child {
    margin-top: 0;
  }

  .arrow-stack {
    margin-top: -36px;
  }
}

/* Laptop only - smaller arrow icons */
@media (min-width: 1024px) and (max-width: 1535px) {
  .arrow-icon {
    width: 36px;
    height: 36px;
    margin-top: -22px;
  }

  .arrow-icon:first-child {
    margin-top: 0;
  }

  .arrow-stack {
    margin-top: -26px;
  }
}
</style>
