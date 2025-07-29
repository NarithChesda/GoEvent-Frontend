import { ref, onMounted, onUnmounted } from 'vue'

export function useNavbarScroll() {
  const isScrolled = ref(false)
  const scrollY = ref(0)

  const handleScroll = () => {
    scrollY.value = window.scrollY
    // Change navbar appearance when scrolled down more than 100px
    isScrolled.value = window.scrollY > 100
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
    // Set initial state
    handleScroll()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return {
    isScrolled,
    scrollY
  }
}