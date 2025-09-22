import { ref, onMounted, onUnmounted } from 'vue'
import { useThrottleFn } from '../utils/performance'

export function useNavbarScroll() {
  const isScrolled = ref(false)
  const scrollY = ref(0)

  const handleScroll = useThrottleFn(() => {
    scrollY.value = window.scrollY
    // Change navbar appearance when scrolled down more than 100px
    isScrolled.value = window.scrollY > 100
  })

  const cleanup = () => {
    window.removeEventListener('scroll', handleScroll)
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Set initial state
    handleScroll()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    isScrolled,
    scrollY,
    cleanup,
  }
}
