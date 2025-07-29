import { ref, onMounted, onUnmounted } from 'vue'

export function useScrollAnimations() {
  const isVisible = ref<{ [key: string]: boolean }>({})
  
  const observer = ref<IntersectionObserver | null>(null)
  
  const createObserver = () => {
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
    }
  }
  
  onMounted(() => {
    createObserver()
  })
  
  onUnmounted(() => {
    observer.value?.disconnect()
  })
  
  return {
    isVisible,
    observeElement
  }
}

export function useScrollToTop() {
  const showScrollTop = ref(false)
  
  const handleScroll = () => {
    showScrollTop.value = window.scrollY > 300
  }
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
  
  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
  })
  
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
  
  return {
    showScrollTop,
    scrollToTop
  }
}