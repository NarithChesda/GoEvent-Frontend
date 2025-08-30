import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useThrottleFn } from '../utils/performance'

// Animation constants for consistent timing
export const ANIMATION_CONSTANTS = {
  DURATION: {
    FAST: 300,
    NORMAL: 500,
    SLOW: 800,
    EXTRA_SLOW: 1200
  },
  DELAY: {
    NONE: 0,
    SHORT: 100,
    MEDIUM: 200,
    LONG: 300,
    STAGGER: 150
  },
  EASING: {
    SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',
    BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    ELASTIC: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    EXPO: 'cubic-bezier(0.19, 1, 0.22, 1)'
  },
  THRESHOLD: {
    MINIMAL: 0.05,
    NORMAL: 0.1,
    HALF: 0.5,
    FULL: 1.0
  }
}

interface RevealAnimationOptions {
  threshold?: number
  rootMargin?: string
  animationType?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'rotateIn'
  duration?: number
  delay?: number
  easing?: string
  stagger?: boolean
  staggerDelay?: number
}

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
        threshold: ANIMATION_CONSTANTS.THRESHOLD.NORMAL,
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

export function useRevealAnimations(options: RevealAnimationOptions = {}) {
  const {
    threshold = ANIMATION_CONSTANTS.THRESHOLD.NORMAL,
    rootMargin = '0px 0px -50px 0px',
    animationType = 'fadeIn',
    duration = ANIMATION_CONSTANTS.DURATION.NORMAL,
    delay = ANIMATION_CONSTANTS.DELAY.NONE,
    easing = ANIMATION_CONSTANTS.EASING.SMOOTH,
    stagger = false,
    staggerDelay = ANIMATION_CONSTANTS.DELAY.STAGGER
  } = options

  const isVisible = ref<{ [key: string]: boolean }>({})
  const animatedElements = ref<{ [key: string]: boolean }>({})
  const observer = ref<IntersectionObserver | null>(null)
  const observedElements = ref<Set<Element>>(new Set())

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const createRevealObserver = () => {
    if (observer.value) {
      observer.value.disconnect()
    }

    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          const elementId = entry.target.getAttribute('data-reveal-id')
          if (elementId) {
            isVisible.value[elementId] = entry.isIntersecting
            
            if (entry.isIntersecting && !animatedElements.value[elementId]) {
              animatedElements.value[elementId] = true
              triggerRevealAnimation(entry.target as HTMLElement, index)
            }
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )
  }

  const triggerRevealAnimation = (element: HTMLElement, index: number = 0) => {
    if (prefersReducedMotion) {
      element.style.opacity = '1'
      element.style.transform = 'none'
      return
    }

    // Set initial state
    element.style.opacity = '0'
    element.style.transform = getInitialTransform(animationType)
    element.style.transition = `all ${duration}ms ${easing}`
    element.style.willChange = 'transform, opacity'

    // Calculate delay for staggered animations
    const animationDelay = stagger ? delay + (index * staggerDelay) : delay

    // Trigger animation after delay
    setTimeout(() => {
      element.style.opacity = '1'
      element.style.transform = 'none'
      
      // Clean up will-change after animation
      setTimeout(() => {
        element.style.willChange = 'auto'
      }, duration)
    }, animationDelay)
  }

  const getInitialTransform = (type: string): string => {
    switch (type) {
      case 'slideUp':
        return 'translateY(60px)'
      case 'slideLeft':
        return 'translateX(-60px)'
      case 'slideRight':
        return 'translateX(60px)'
      case 'scaleIn':
        return 'scale(0.8)'
      case 'rotateIn':
        return 'rotate(-10deg) scale(0.8)'
      case 'fadeIn':
      default:
        return 'translateY(20px)'
    }
  }

  const observeRevealElement = (element: Element | { $el?: Element }, id: string, elementIndex: number = 0) => {
    const domElement = 'tagName' in element ? element : element.$el
    
    if (domElement && domElement.setAttribute) {
      domElement.setAttribute('data-reveal-id', id)
      domElement.setAttribute('data-element-index', elementIndex.toString())
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
    createRevealObserver()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    isVisible,
    observeRevealElement,
    cleanup
  }
}

export function useParallaxScroll() {
  const scrollY = ref(0)
  const parallaxElements = ref<Map<string, HTMLElement>>(new Map())

  const updateParallax = useThrottleFn(() => {
    scrollY.value = window.scrollY
    
    parallaxElements.value.forEach((element, id) => {
      const speed = parseFloat(element.getAttribute('data-parallax-speed') || '0.5')
      const direction = element.getAttribute('data-parallax-direction') || 'up'
      const offset = scrollY.value * speed
      
      let transform = ''
      switch (direction) {
        case 'up':
          transform = `translateY(-${offset}px)`
          break
        case 'down':
          transform = `translateY(${offset}px)`
          break
        case 'left':
          transform = `translateX(-${offset}px)`
          break
        case 'right':
          transform = `translateX(${offset}px)`
          break
      }
      
      element.style.transform = transform
    })
  }, 16) // ~60fps

  const addParallaxElement = (element: Element | { $el?: Element }, id: string, speed: number = 0.5, direction: string = 'up') => {
    const domElement = 'tagName' in element ? element : element.$el
    
    if (domElement) {
      const htmlElement = domElement as HTMLElement
      htmlElement.setAttribute('data-parallax-speed', speed.toString())
      htmlElement.setAttribute('data-parallax-direction', direction)
      htmlElement.style.willChange = 'transform'
      
      parallaxElements.value.set(id, htmlElement)
    }
  }

  const removeParallaxElement = (id: string) => {
    const element = parallaxElements.value.get(id)
    if (element) {
      element.style.willChange = 'auto'
      element.style.transform = 'none'
      parallaxElements.value.delete(id)
    }
  }

  const cleanup = () => {
    window.removeEventListener('scroll', updateParallax)
    parallaxElements.value.forEach((element) => {
      element.style.willChange = 'auto'
      element.style.transform = 'none'
    })
    parallaxElements.value.clear()
  }

  onMounted(() => {
    window.addEventListener('scroll', updateParallax, { passive: true })
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    scrollY,
    addParallaxElement,
    removeParallaxElement,
    cleanup
  }
}

export function useSmoothScroll() {
  const isScrolling = ref(false)
  
  const smoothScrollTo = (target: string | Element, options: ScrollIntoViewOptions = {}) => {
    const element = typeof target === 'string' ? document.querySelector(target) : target
    
    if (!element) return

    isScrolling.value = true
    
    const defaultOptions: ScrollIntoViewOptions = {
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
      ...options
    }

    element.scrollIntoView(defaultOptions)

    // Reset scrolling state after animation
    setTimeout(() => {
      isScrolling.value = false
    }, 1000)
  }

  const smoothScrollToTop = () => {
    isScrolling.value = true
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })

    setTimeout(() => {
      isScrolling.value = false
    }, 1000)
  }

  return {
    isScrolling,
    smoothScrollTo,
    smoothScrollToTop
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