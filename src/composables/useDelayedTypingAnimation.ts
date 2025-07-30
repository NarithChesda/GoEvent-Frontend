import { ref, onMounted } from 'vue'

export function useDelayedTypingAnimation(text: string, speed: number = 100, delay: number = 0) {
  const displayText = ref('')
  const isComplete = ref(false)
  const hasStarted = ref(false)
  
  onMounted(() => {
    setTimeout(() => {
      hasStarted.value = true
      let currentIndex = 0
      
      const typeNextCharacter = () => {
        if (currentIndex < text.length) {
          displayText.value += text[currentIndex]
          currentIndex++
          setTimeout(typeNextCharacter, speed)
        } else {
          isComplete.value = true
        }
      }
      
      typeNextCharacter()
    }, delay)
  })
  
  return {
    displayText,
    isComplete,
    hasStarted
  }
}