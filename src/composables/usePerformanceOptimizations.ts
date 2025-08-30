import { ref, onMounted, onUnmounted, nextTick } from 'vue'

export interface PerformanceMetrics {
  fps: number
  memoryUsage?: number
  renderTime: number
  animationCount: number
}

// Performance monitoring and optimization utilities
export function usePerformanceOptimizations() {
  const performanceMetrics = ref<PerformanceMetrics>({
    fps: 60,
    renderTime: 0,
    animationCount: 0
  })
  
  const isHighPerformanceDevice = ref(true)
  const prefersReducedMotion = ref(false)
  const prefersHighContrast = ref(false)
  
  // Performance monitoring
  let lastFrameTime = performance.now()
  let frameCount = 0
  let fpsCalculationInterval: number
  
  const calculateFPS = () => {
    const now = performance.now()
    const delta = now - lastFrameTime
    
    if (delta >= 1000) {
      performanceMetrics.value.fps = Math.round((frameCount * 1000) / delta)
      frameCount = 0
      lastFrameTime = now
      
      // Adjust performance settings based on FPS
      if (performanceMetrics.value.fps < 30) {
        isHighPerformanceDevice.value = false
      } else if (performanceMetrics.value.fps > 55) {
        isHighPerformanceDevice.value = true
      }
    } else {
      frameCount++
    }
    
    fpsCalculationInterval = requestAnimationFrame(calculateFPS)
  }
  
  // Memory usage monitoring (if available)
  const checkMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      performanceMetrics.value.memoryUsage = memory.usedJSHeapSize / 1048576 // MB
    }
  }
  
  // Device capability detection
  const detectDeviceCapabilities = () => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mediaQuery.matches
    
    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)')
    prefersHighContrast.value = contrastQuery.matches
    
    // Listen for changes
    mediaQuery.addEventListener('change', (e) => {
      prefersReducedMotion.value = e.matches
    })
    
    contrastQuery.addEventListener('change', (e) => {
      prefersHighContrast.value = e.matches
    })
    
    // Check hardware acceleration support
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    
    if (!gl) {
      isHighPerformanceDevice.value = false
    } else {
      // Check for specific GPU capabilities
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        // Basic check for integrated graphics (often lower performance)
        if (renderer.includes('Intel') && renderer.includes('HD')) {
          isHighPerformanceDevice.value = false
        }
      }
    }
  }
  
  // Animation optimization utilities
  const optimizeAnimations = () => {
    if (!isHighPerformanceDevice.value || prefersReducedMotion.value) {
      // Disable heavy animations
      document.documentElement.style.setProperty('--animation-duration-fast', '0.1s')
      document.documentElement.style.setProperty('--animation-duration-normal', '0.2s')
      document.documentElement.style.setProperty('--animation-duration-slow', '0.3s')
      
      // Disable particles and complex effects
      const particles = document.querySelectorAll('.particle')
      particles.forEach(particle => {
        (particle as HTMLElement).style.display = 'none'
      })
    }
  }
  
  // CSS containment for performance
  const applyCSSContainment = () => {
    const containers = [
      '.liquid-glass-card',
      '.comment-card-liquid',
      '.agenda-card-container',
      '.photo-card',
      '.enhanced-photo-card'
    ]
    
    containers.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(element => {
        (element as HTMLElement).style.contain = 'layout style paint'
      })
    })
  }
  
  // Intersection observer with performance optimizations
  const createOptimizedObserver = (
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ) => {
    const defaultOptions: IntersectionObserverInit = {
      rootMargin: isHighPerformanceDevice.value ? '50px' : '100px',
      threshold: isHighPerformanceDevice.value ? [0.1, 0.5] : [0.2],
      ...options
    }
    
    return new IntersectionObserver(callback, defaultOptions)
  }
  
  // Debounced scroll handler
  const createOptimizedScrollHandler = (
    callback: () => void,
    delay: number = 16
  ) => {
    let ticking = false
    
    return () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          callback()
          ticking = false
        })
        ticking = true
      }
    }
  }
  
  // Memory cleanup utilities
  const cleanupAnimations = () => {
    // Remove will-change properties after animations complete
    const animatedElements = document.querySelectorAll('[style*="will-change"]')
    animatedElements.forEach(element => {
      const htmlElement = element as HTMLElement
      if (!htmlElement.style.willChange.includes('transform')) {
        htmlElement.style.willChange = 'auto'
      }
    })
  }
  
  // Preload critical resources
  const preloadCriticalResources = (urls: string[]) => {
    urls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = url
      
      if (url.includes('.woff2')) {
        link.as = 'font'
        link.type = 'font/woff2'
        link.crossOrigin = 'anonymous'
      } else if (url.includes('.css')) {
        link.as = 'style'
      } else if (url.includes('.js')) {
        link.as = 'script'
      }
      
      document.head.appendChild(link)
    })
  }
  
  // Initialize performance monitoring
  onMounted(() => {
    nextTick(() => {
      detectDeviceCapabilities()
      optimizeAnimations()
      applyCSSContainment()
      
      // Start FPS monitoring
      calculateFPS()
      
      // Check memory usage periodically
      setInterval(checkMemoryUsage, 5000)
      
      // Cleanup animations after 5 seconds
      setTimeout(cleanupAnimations, 5000)
    })
  })
  
  // Cleanup
  onUnmounted(() => {
    if (fpsCalculationInterval) {
      cancelAnimationFrame(fpsCalculationInterval)
    }
    cleanupAnimations()
  })
  
  return {
    performanceMetrics,
    isHighPerformanceDevice,
    prefersReducedMotion,
    prefersHighContrast,
    createOptimizedObserver,
    createOptimizedScrollHandler,
    preloadCriticalResources,
    cleanupAnimations
  }
}

// Utility for automatic performance adjustments
export function useAutoPerformanceAdjustment() {
  const { performanceMetrics, isHighPerformanceDevice } = usePerformanceOptimizations()
  
  // Automatically adjust animation quality based on performance
  const adjustAnimationQuality = () => {
    const fps = performanceMetrics.value.fps
    
    if (fps < 30) {
      // Low performance: minimal animations
      document.documentElement.classList.add('low-performance')
      document.documentElement.style.setProperty('--animation-duration-multiplier', '0.5')
    } else if (fps < 45) {
      // Medium performance: reduced animations
      document.documentElement.classList.add('medium-performance')
      document.documentElement.style.setProperty('--animation-duration-multiplier', '0.75')
    } else {
      // High performance: full animations
      document.documentElement.classList.remove('low-performance', 'medium-performance')
      document.documentElement.style.setProperty('--animation-duration-multiplier', '1')
    }
  }
  
  // Monitor and adjust performance every 2 seconds
  onMounted(() => {
    const interval = setInterval(adjustAnimationQuality, 2000)
    
    onUnmounted(() => {
      clearInterval(interval)
    })
  })
  
  return {
    performanceMetrics,
    isHighPerformanceDevice,
    adjustAnimationQuality
  }
}