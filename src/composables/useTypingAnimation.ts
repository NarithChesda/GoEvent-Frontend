import { ref, onMounted, onUnmounted } from 'vue'
import { TimeoutManager } from '../utils/performance'

export function useTypingAnimation(text: string, speed: number = 100) {
  const displayText = ref('')
  const isComplete = ref(false)
  const timeoutManager = new TimeoutManager()
  
  const cleanup = () => {
    timeoutManager.clearAll()
  }
  
  onMounted(() => {
    let currentIndex = 0
    
    const typeNextCharacter = () => {
      if (currentIndex < text.length) {
        displayText.value += text[currentIndex]
        currentIndex++
        timeoutManager.setTimeout(typeNextCharacter, speed)
      } else {
        isComplete.value = true
      }
    }
    
    // Start typing after a short delay
    timeoutManager.setTimeout(typeNextCharacter, 500)
  })
  
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    displayText,
    isComplete,
    cleanup
  }
}