<template>
  <div class="flex justify-center my-8 sm:my-10 laptop-sm:my-10 laptop-md:my-12 laptop-lg:my-14 desktop:my-12">
    <div class="bow-tie-divider">
      <!-- Extended Left Line -->
      <div 
        class="divider-line left-line" 
        :style="{ backgroundColor: primaryColor }"
      ></div>
      
      <!-- Bow Tie Center -->
      <div class="bow-tie-center">
        <svg 
          class="bow-tie-svg" 
          :style="{ color: primaryColor }"
          viewBox="0 0 40 20" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Left bow -->
          <path 
            d="M5 10 Q12 5 18 10 Q12 15 5 10 Z" 
            fill="currentColor"
            opacity="0.8"
          />
          <!-- Right bow -->
          <path 
            d="M35 10 Q28 5 22 10 Q28 15 35 10 Z" 
            fill="currentColor"
            opacity="0.8"
          />
          <!-- Center knot -->
          <ellipse 
            cx="20" 
            cy="10" 
            rx="3" 
            ry="6" 
            fill="currentColor"
          />
          <!-- Center highlight -->
          <ellipse 
            cx="20" 
            cy="10" 
            rx="1.5" 
            ry="4" 
            fill="rgba(255, 255, 255, 0.3)"
          />
        </svg>
      </div>
      
      <!-- Extended Right Line -->
      <div 
        class="divider-line right-line" 
        :style="{ backgroundColor: primaryColor }"
      ></div>
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
.bow-tie-divider {
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

.bow-tie-center {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.bow-tie-svg {
  width: 32px;
  height: 16px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
  animation: gentle-glow 4s ease-in-out infinite alternate;
}

@media (min-width: 640px) {
  .bow-tie-svg {
    width: 40px;
    height: 20px;
  }
  
  .left-line {
    margin-right: 1.5rem;
  }
  
  .right-line {
    margin-left: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .bow-tie-svg {
    width: 48px;
    height: 24px;
  }
  
  .bow-tie-divider {
    max-width: 500px;
  }
  
  .left-line {
    margin-right: 2rem;
  }
  
  .right-line {
    margin-left: 2rem;
  }
}

@keyframes gentle-glow {
  0% {
    opacity: 0.8;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1.02);
  }
}

/* Add subtle hover effect */
.bow-tie-divider:hover .bow-tie-svg {
  animation: gentle-pulse 2s ease-in-out infinite;
}

.bow-tie-divider:hover .divider-line {
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

@keyframes gentle-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
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