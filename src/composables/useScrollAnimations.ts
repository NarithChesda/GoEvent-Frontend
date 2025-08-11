import { ref, onMounted, onUnmounted } from 'vue'
import { useThrottleFn } from '../utils/performance'

export function useScrollAnimations() {
  const isVisible = ref<{ [key: string]: boolean }>({})
  const observer = ref<IntersectionObserver | null>(null)
  const observedElements = ref<Set<Element>>(new Set())
  
  const createObserver = () => {
    if (observer.value) {
      observer.value.disconnect()
    }
    
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elementId = entry.target.getAttribute('data-scroll-id')
          if (elementId) {
            isVisible.value[elementId] = entry.isIntersecting
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )
  }
  
  const observeElement = (element: Element | { $el?: Element }, id: string) => {
    // Handle Vue component refs that have $el property
    const domElement = 'tagName' in element ? element : element.$el
    
    if (domElement && domElement.setAttribute) {
      domElement.setAttribute('data-scroll-id', id)
      observer.value?.observe(domElement)
      observedElements.value.add(domElement)
    }
  }
  
  const cleanup = () => {
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
    observedElements.value.clear()
  }
  
  onMounted(() => {
    createObserver()
  })
  
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    isVisible,
    observeElement,
    cleanup
  }
}

export function useScrollToTop() {
  const showScrollTop = ref(false)
  
  const handleScroll = useThrottleFn(() => {
    showScrollTop.value = window.scrollY > 300
  })
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
  
  const cleanup = () => {
    window.removeEventListener('scroll', handleScroll)
  }
  
  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
  })
  
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    showScrollTop,
    scrollToTop,
    cleanup
  }
}