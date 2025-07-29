import { ref, onMounted } from 'vue'

export function useTypingAnimation(text: string, speed: number = 100) {
  const displayText = ref('')
  const isComplete = ref(false)
  
  onMounted(() => {
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
    
    // Start typing after a short delay
    setTimeout(typeNextCharacter, 500)
  })
  
  return {
    displayText,
    isComplete
  }
}