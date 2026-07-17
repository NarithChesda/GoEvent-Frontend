<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center"
        @click="$emit('close')"
        @touchstart.passive="handleTouchStart"
        @touchend.passive="handleTouchEnd"
      >
        <!-- Close -->
        <button
          @click.stop="$emit('close')"
          class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors z-10"
          :aria-label="t('services.lightbox.close')"
        >
          <X class="w-5 h-5" />
        </button>

        <!-- Counter -->
        <div
          v-if="images.length > 1"
          class="absolute top-5 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium tabular-nums"
        >
          {{ currentIndex + 1 }} / {{ images.length }}
        </div>

        <!-- Previous -->
        <button
          v-if="images.length > 1"
          @click.stop="previous"
          class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors z-10"
          :aria-label="t('services.lightbox.previous')"
        >
          <ChevronLeft class="w-6 h-6" />
        </button>

        <!-- Image -->
        <img
          :src="images[currentIndex]"
          :alt="`${currentIndex + 1} / ${images.length}`"
          class="max-w-[92vw] max-h-[85vh] object-contain rounded-lg select-none"
          @click.stop
          draggable="false"
        />

        <!-- Next -->
        <button
          v-if="images.length > 1"
          @click.stop="next"
          class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors z-10"
          :aria-label="t('services.lightbox.next')"
        >
          <ChevronRight class="w-6 h-6" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

const props = defineProps<{
  isOpen: boolean
  images: string[]
  startIndex: number
}>()

const emit = defineEmits<{
  close: []
}>()

const currentIndex = ref(0)
const touchStartX = ref(0)

const previous = () => {
  currentIndex.value = (currentIndex.value - 1 + props.images.length) % props.images.length
}

const next = () => {
  currentIndex.value = (currentIndex.value + 1) % props.images.length
}

const handleTouchStart = (event: TouchEvent) => {
  touchStartX.value = event.touches[0].clientX
}

const handleTouchEnd = (event: TouchEvent) => {
  const deltaX = event.changedTouches[0].clientX - touchStartX.value
  if (Math.abs(deltaX) < 50 || props.images.length < 2) return
  if (deltaX > 0) previous()
  else next()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
  else if (event.key === 'ArrowLeft') previous()
  else if (event.key === 'ArrowRight') next()
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      currentIndex.value = Math.min(Math.max(props.startIndex, 0), props.images.length - 1)
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
    }
  },
)

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
