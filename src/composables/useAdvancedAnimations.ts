import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ANIMATION_CONSTANTS } from './useScrollAnimations'

export interface StaggerAnimationOptions {
  animationType?: 'slideUp' | 'slideLeft' | 'slideRight' | 'fadeIn' | 'scaleIn' | 'rotateIn'
  duration?: number
  delay?: number
  staggerDelay?: number
  easing?: string
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export interface EntranceAnimationOptions {
  type?: 'bounce' | 'elastic' | 'fade' | 'slide' | 'scale' | 'rotate'
  duration?: number
  delay?: number
  easing?: string
  direction?: 'up' | 'down' | 'left' | 'right'
}

export interface MomentumScrollOptions {
  friction?: number
  acceleration?: number
  maxVelocity?: number
  threshold?: number
}

// Advanced stagger animations for multiple elements
export function useStaggerAnimation(options: StaggerAnimationOptions = {}) {
  const {
    animationType = 'slideUp',
    duration = ANIMATION_CONSTANTS.DURATION.NORMAL,
    delay = ANIMATION_CONSTANTS.DELAY.NONE,
    staggerDelay = ANIMATION_CONSTANTS.DELAY.STAGGER,
    easing = ANIMATION_CONSTANTS.EASING.SMOOTH,
    threshold = ANIMATION_CONSTANTS.THRESHOLD.NORMAL,
    rootMargin = '0px 0px -50px 0px',
    once = true
  } = options

  const animatedElements = ref<Set<string>>(new Set())
  const observer = ref<IntersectionObserver | null>(null)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const createStaggerObserver = () => {
    if (observer.value) {
      observer.value.disconnect()
    }

    observer.value = new IntersectionObserver(
      (entries) => {
        // Group entries by container to stagger them together
        const containerGroups = new Map<string, HTMLElement[]>()
        
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement
            const containerId = element.getAttribute('data-stagger-container') || 'default'
            const elementId = element.getAttribute('data-stagger-id')
            
            if (elementId && (!once || !animatedElements.value.has(elementId))) {
              if (!containerGroups.has(containerId)) {
                containerGroups.set(containerId, [])
              }
              containerGroups.get(containerId)!.push(element)
            }
          }
        })

        // Animate each group with staggered timing
        containerGroups.forEach((elements, containerId) => {
          elements.forEach((element, index) => {
            const elementId = element.getAttribute('data-stagger-id')!
            animatedElements.value.add(elementId)
            triggerStaggerAnimation(element, index)
          })
        })
      },
      { threshold, rootMargin }
    )
  }

  const triggerStaggerAnimation = (element: HTMLElement, index: number) => {
    if (prefersReducedMotion) {
      element.style.opacity = '1'
      element.style.transform = 'none'
      return
    }

    // Set initial state
    element.style.opacity = '0'
    element.style.transform = getAnimationTransform(animationType, true)
    element.style.transition = `all ${duration}ms ${easing}`
    element.style.willChange = 'transform, opacity'

    // Staggered delay
    const animationDelay = delay + (index * staggerDelay)

    setTimeout(() => {
      element.style.opacity = '1'
      element.style.transform = getAnimationTransform(animationType, false)
      
      // Clean up will-change after animation
      setTimeout(() => {
        element.style.willChange = 'auto'
      }, duration)
    }, animationDelay)
  }

  const getAnimationTransform = (type: string, isInitial: boolean): string => {
    if (!isInitial) return 'none'

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
        return 'rotate(-10deg) scale(0.9)'
      case 'fadeIn':
      default:
        return 'translateY(20px)'
    }
  }

  const observeStaggerElement = (
    element: Element | { $el?: Element }, 
    id: string, 
    containerId: string = 'default'
  ) => {
    const domElement = 'tagName' in element ? element : element.$el
    
    if (domElement && domElement.setAttribute) {
      domElement.setAttribute('data-stagger-id', id)
      domElement.setAttribute('data-stagger-container', containerId)
      observer.value?.observe(domElement)
    }
  }

  const cleanup = () => {
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
    animatedElements.value.clear()
  }

  onMounted(() => {
    nextTick(() => {
      createStaggerObserver()
    })
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    observeStaggerElement,
    cleanup
  }
}

// Enhanced entrance animations for hero/cover sections
export function useEntranceAnimation(options: EntranceAnimationOptions = {}) {
  const {
    type = 'elastic',
    duration = ANIMATION_CONSTANTS.DURATION.SLOW,
    delay = ANIMATION_CONSTANTS.DELAY.MEDIUM,
    easing = ANIMATION_CONSTANTS.EASING.ELASTIC,
    direction = 'up'
  } = options

  const animatedElements = ref<Set<HTMLElement>>(new Set())
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const triggerEntrance = (element: Element | { $el?: Element }, customDelay: number = 0) => {
    const domElement = 'tagName' in element ? element : element.$el
    if (!domElement) return

    const htmlElement = domElement as HTMLElement
    if (animatedElements.value.has(htmlElement)) return

    animatedElements.value.add(htmlElement)

    if (prefersReducedMotion) {
      htmlElement.style.opacity = '1'
      htmlElement.style.transform = 'none'
      return
    }

    // Set initial state
    htmlElement.style.opacity = '0'
    htmlElement.style.transform = getEntranceTransform(type, direction, true)
    htmlElement.style.transition = `all ${duration}ms ${easing}`
    htmlElement.style.willChange = 'transform, opacity'

    setTimeout(() => {
      htmlElement.style.opacity = '1'
      htmlElement.style.transform = getEntranceTransform(type, direction, false)
      
      // Clean up will-change after animation
      setTimeout(() => {
        htmlElement.style.willChange = 'auto'
      }, duration)
    }, delay + customDelay)
  }

  const getEntranceTransform = (animType: string, dir: string, isInitial: boolean): string => {
    if (!isInitial) return 'none'

    switch (animType) {
      case 'bounce':
        return dir === 'up' ? 'translateY(100px) scale(0.8)' : 
               dir === 'down' ? 'translateY(-100px) scale(0.8)' :
               dir === 'left' ? 'translateX(100px) scale(0.8)' :
               'translateX(-100px) scale(0.8)'
      case 'elastic':
        return dir === 'up' ? 'translateY(80px) scale(0.9) rotate(5deg)' :
               dir === 'down' ? 'translateY(-80px) scale(0.9) rotate(-5deg)' :
               dir === 'left' ? 'translateX(80px) scale(0.9) rotate(5deg)' :
               'translateX(-80px) scale(0.9) rotate(-5deg)'
      case 'scale':
        return 'scale(0.5) rotate(180deg)'
      case 'rotate':
        return 'rotate(90deg) scale(0.8)'
      case 'slide':
        return dir === 'up' ? 'translateY(60px)' :
               dir === 'down' ? 'translateY(-60px)' :
               dir === 'left' ? 'translateX(60px)' :
               'translateX(-60px)'
      case 'fade':
      default:
        return 'translateY(30px) scale(0.95)'
    }
  }

  const triggerSequence = (elements: (Element | { $el?: Element })[], sequenceDelay: number = 200) => {
    elements.forEach((element, index) => {
      triggerEntrance(element, index * sequenceDelay)
    })
  }

  return {
    triggerEntrance,
    triggerSequence
  }
}

// Momentum-based smooth scrolling
export function useMomentumScroll(options: MomentumScrollOptions = {}) {
  const {
    friction = 0.92,
    acceleration = 0.1,
    maxVelocity = 50,
    threshold = 0.5
  } = options

  const velocity = ref(0)
  const isScrolling = ref(false)
  const targetScroll = ref(0)
  const currentScroll = ref(0)
  let animationFrame: number

  const updateScroll = () => {
    const diff = targetScroll.value - currentScroll.value
    
    if (Math.abs(diff) > threshold) {
      velocity.value += diff * acceleration
      velocity.value = Math.max(-maxVelocity, Math.min(maxVelocity, velocity.value))
      velocity.value *= friction
      
      currentScroll.value += velocity.value
      
      if (Math.abs(velocity.value) > 0.1) {
        animationFrame = requestAnimationFrame(updateScroll)
      } else {
        isScrolling.value = false
        currentScroll.value = targetScroll.value
      }
    } else {
      isScrolling.value = false
    }
  }

  const scrollToPosition = (position: number, smooth: boolean = true) => {
    targetScroll.value = position
    
    if (!smooth) {
      currentScroll.value = position
      velocity.value = 0
      return
    }

    if (!isScrolling.value) {
      isScrolling.value = true
      updateScroll()
    }
  }

  const scrollToElement = (element: Element | string, offset: number = 0, smooth: boolean = true) => {
    const target = typeof element === 'string' ? document.querySelector(element) : element
    if (!target) return

    const rect = target.getBoundingClientRect()
    const position = window.scrollY + rect.top + offset
    
    scrollToPosition(position, smooth)
  }

  const cleanup = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    currentScroll,
    isScrolling,
    scrollToPosition,
    scrollToElement,
    cleanup
  }
}

// CSS-based scroll-driven animations utility
export function useScrollDrivenAnimations() {
  const supportsScrollTimeline = 'scrollTimeline' in document.documentElement.style ||
                                'ScrollTimeline' in window

  const createScrollAnimation = (
    element: Element,
    keyframes: Keyframe[],
    options: {
      duration?: number
      easing?: string
      fill?: FillMode
    } = {}
  ) => {
    const {
      duration = 1000,
      easing = 'linear',
      fill = 'both'
    } = options

    if (!supportsScrollTimeline) {
      // Fallback to intersection observer
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const progress = Math.min(entry.intersectionRatio, 1)
            const animation = element.animate(keyframes, {
              duration,
              easing,
              fill
            })
            animation.currentTime = progress * duration
            animation.pause()
          })
        },
        {
          threshold: Array.from({ length: 101 }, (_, i) => i / 100)
        }
      )
      
      observer.observe(element)
      return () => observer.disconnect()
    }

    // Native scroll-driven animation (when supported)
    try {
      const animation = element.animate(keyframes, {
        duration,
        easing,
        fill,
        timeline: new (window as any).ScrollTimeline({
          source: document.scrollingElement,
          orientation: 'block',
          scrollOffsets: [0, element.offsetTop + element.offsetHeight]
        })
      })
      
      return () => animation.cancel()
    } catch (error) {
      console.warn('Scroll-driven animations not supported:', error)
      return () => {}
    }
  }

  const createParallaxAnimation = (
    element: Element,
    speed: number = 0.5,
    direction: 'vertical' | 'horizontal' = 'vertical'
  ) => {
    const keyframes: Keyframe[] = direction === 'vertical'
      ? [
          { transform: `translateY(${100 * speed}px)` },
          { transform: `translateY(${-100 * speed}px)` }
        ]
      : [
          { transform: `translateX(${100 * speed}px)` },
          { transform: `translateX(${-100 * speed}px)` }
        ]

    return createScrollAnimation(element, keyframes, {
      duration: 1000,
      easing: 'linear'
    })
  }

  return {
    supportsScrollTimeline,
    createScrollAnimation,
    createParallaxAnimation
  }
}