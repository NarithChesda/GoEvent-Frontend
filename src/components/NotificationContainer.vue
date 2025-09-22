<template>
  <div class="fixed bottom-8 right-8 z-50 space-y-4 max-w-sm">
    <TransitionGroup name="notification" tag="div" class="space-y-4">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="getNotificationClasses(notification.type)"
        class="rounded-xl shadow-lg p-4 backdrop-blur-sm border relative overflow-hidden"
      >
        <!-- Progress bar for auto-dismiss -->
        <div
          v-if="notification.duration && notification.duration > 0"
          class="absolute top-0 left-0 h-1 bg-white/30 animate-pulse"
          :style="{ animationDuration: `${notification.duration}ms` }"
        ></div>

        <div class="flex items-start">
          <!-- Icon -->
          <div class="flex-shrink-0">
            <CheckCircle v-if="notification.type === 'success'" class="w-5 h-5 text-white" />
            <AlertCircle v-else-if="notification.type === 'error'" class="w-5 h-5 text-white" />
            <AlertTriangle v-else-if="notification.type === 'warning'" class="w-5 h-5 text-white" />
            <Info v-else-if="notification.type === 'info'" class="w-5 h-5 text-white" />
          </div>

          <!-- Content -->
          <div class="ml-3 flex-1">
            <h4 class="text-sm font-semibold text-white">
              {{ notification.title }}
            </h4>
            <p v-if="notification.message" class="text-sm text-white/90 mt-1">
              {{ notification.message }}
            </p>
          </div>

          <!-- Dismiss button -->
          <button
            v-if="notification.dismissable"
            @click="removeNotification(notification.id)"
            class="flex-shrink-0 ml-3 text-white/70 hover:text-white transition-colors"
            :aria-label="`Dismiss ${notification.title}`"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useNotifications, type Notification } from '../composables/useNotifications'

const { notifications, removeNotification } = useNotifications()

const getNotificationClasses = (type: Notification['type']): string => {
  const baseClasses = 'border-white/20'

  switch (type) {
    case 'success':
      return `${baseClasses} bg-green-500/90`
    case 'error':
      return `${baseClasses} bg-red-500/90`
    case 'warning':
      return `${baseClasses} bg-yellow-500/90`
    case 'info':
      return `${baseClasses} bg-[#E6F4FF]0/90`
    default:
      return `${baseClasses} bg-gray-500/90`
  }
}
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.animate-pulse {
  animation: progress linear;
}
</style>
