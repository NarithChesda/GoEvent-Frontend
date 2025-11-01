<template>
  <div
    class="flex justify-center my-8 sm:my-10 laptop-sm:my-10 laptop-md:my-12 laptop-lg:my-14 desktop:my-12"
  >
    <div class="balloon-divider">
      <!-- Extended Left Line -->
      <div class="divider-line left-line" :style="{ backgroundColor: primaryColor }"></div>

      <!-- Balloon Center -->
      <div class="balloon-center">
        <svg
          class="balloon-svg"
          :style="{ color: primaryColor }"
          viewBox="0 0 40 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Balloon body -->
          <path
            d="M20 5 C12 5, 8 12, 8 20 C8 28, 12 35, 20 38 C28 35, 32 28, 32 20 C32 12, 28 5, 20 5 Z"
            fill="currentColor"
            opacity="0.9"
          />
          <!-- Balloon highlight -->
          <ellipse cx="16" cy="15" rx="4" ry="6" fill="rgba(255, 255, 255, 0.35)" />
          <!-- Balloon tie/knot -->
          <path d="M18 38 L20 42 L22 38 Z" fill="currentColor" opacity="0.95" />
          <!-- String -->
          <path
            d="M20 42 Q18 48, 20 54"
            stroke="currentColor"
            stroke-width="0.8"
            fill="none"
            opacity="0.6"
          />
          <!-- String end -->
          <circle cx="20" cy="54" r="1.5" fill="currentColor" opacity="0.6" />
        </svg>
      </div>

      <!-- Extended Right Line -->
      <div class="divider-line right-line" :style="{ backgroundColor: primaryColor }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  primaryColor: string
}

defineProps<Props>()
</script>

<style scoped>
.balloon-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 400px;
  position: relative;
}

.divider-line {
  height: 1px;
  flex: 1;
  opacity: 0.4;
  position: relative;
}

.left-line {
  margin-right: 1rem;
}

.right-line {
  margin-left: 1rem;
}

.balloon-center {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.balloon-svg {
  width: 28px;
  height: 42px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
  animation: gentle-float 3s ease-in-out infinite;
}

@media (min-width: 640px) {
  .balloon-svg {
    width: 32px;
    height: 48px;
  }

  .left-line {
    margin-right: 1.5rem;
  }

  .right-line {
    margin-left: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .balloon-svg {
    width: 36px;
    height: 54px;
  }

  .balloon-divider {
    max-width: 500px;
  }

  .left-line {
    margin-right: 2rem;
  }

  .right-line {
    margin-left: 2rem;
  }
}

@keyframes gentle-float {
  0%,
  100% {
    transform: translateY(0px);
    opacity: 0.9;
  }
  50% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

/* Add subtle hover effect */
.balloon-divider:hover .balloon-svg {
  animation: gentle-bounce 1.5s ease-in-out infinite;
}

.balloon-divider:hover .divider-line {
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

@keyframes gentle-bounce {
  0%,
  100% {
    transform: translateY(0px) scale(1);
    opacity: 0.9;
  }
  25% {
    transform: translateY(-10px) scale(1.02);
    opacity: 1;
  }
  50% {
    transform: translateY(-5px) scale(1.01);
  }
  75% {
    transform: translateY(-8px) scale(1.02);
  }
}

/* Add elegant gradient effect to lines */
.divider-line::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  opacity: 0.3;
}

.left-line::before {
  background: linear-gradient(90deg, transparent, currentColor);
}

.right-line::before {
  background: linear-gradient(90deg, currentColor, transparent);
}
</style>
