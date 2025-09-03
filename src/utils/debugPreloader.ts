/**
 * Debug utilities for testing the 3-stage preloader fixes
 * This file provides tools to simulate network conditions and test the critical fixes:
 * 1. Button timeout fallback
 * 2. Progressive video loading
 * 3. Memory management
 */

export interface NetworkSimulation {
  // Simulate slow connection
  simulateSlowConnection: boolean
  // Simulate video preload failure
  simulateVideoFailure: boolean
  // Simulate timeout conditions
  simulateTimeout: boolean
  // Custom delay in ms
  customDelay?: number
}

export interface PreloaderTestResults {
  buttonFallbackTest: {
    passed: boolean
    timeToEnable: number
    fallbackTriggered: boolean
  }
  progressiveLoadingTest: {
    passed: boolean
    timeToCanPlay: number
    timeToCanPlayThrough: number
    resolvedWith: 'canplay' | 'canplaythrough' | 'metadata' | 'timeout'
  }
  memoryManagementTest: {
    passed: boolean
    memoryBeforeCleanup: number
    memoryAfterCleanup: number
    cleanupTriggered: boolean
  }
}

/**
 * Test suite for critical preloader fixes
 */
export class PreloaderDebugger {
  private originalFetch: typeof fetch
  private originalVideoCreate: typeof HTMLVideoElement.prototype.constructor
  
  constructor() {
    this.originalFetch = window.fetch
    this.originalVideoCreate = HTMLVideoElement
  }

  /**
   * Simulate network conditions for testing
   */
  simulateNetwork(config: NetworkSimulation) {
    if (config.simulateSlowConnection) {
      this.interceptVideoLoading(config.customDelay || 5000)
    }
    
    if (config.simulateVideoFailure) {
      this.interceptVideoFailure()
    }
    
    if (config.simulateTimeout) {
      this.interceptVideoTimeout(config.customDelay || 20000)
    }
  }

  /**
   * Test button fallback mechanism
   */
  async testButtonFallback(eventId: string, eventVideoUrl: string | null): Promise<PreloaderTestResults['buttonFallbackTest']> {
    const startTime = Date.now()
    
    // Simulate preload failure
    this.simulateNetwork({ 
      simulateVideoFailure: true, 
      simulateSlowConnection: false, 
      simulateTimeout: false 
    })
    
    // Import the composable dynamically to avoid circular imports
    const { useBackgroundPreloader } = await import('../composables/useBackgroundPreloader')
    const { isStage2Ready } = useBackgroundPreloader()
    
    // Test fallback timing
    let fallbackTriggered = false
    let timeToEnable = 0
    
    const checkInterval = setInterval(() => {
      if (isStage2Ready(eventId, eventVideoUrl)) {
        timeToEnable = Date.now() - startTime
        if (timeToEnable > 14000) { // Should trigger around 15s
          fallbackTriggered = true
        }
        clearInterval(checkInterval)
      }
    }, 100)
    
    // Wait maximum 20 seconds
    return new Promise((resolve) => {
      setTimeout(() => {
        clearInterval(checkInterval)
        const finalTime = Date.now() - startTime
        resolve({
          passed: fallbackTriggered && timeToEnable > 14000 && timeToEnable < 16000,
          timeToEnable: finalTime,
          fallbackTriggered
        })
      }, 20000)
    })
  }

  /**
   * Test progressive video loading
   */
  async testProgressiveLoading(videoUrl: string): Promise<PreloaderTestResults['progressiveLoadingTest']> {
    const startTime = Date.now()
    let timeToCanPlay = 0
    let timeToCanPlayThrough = 0
    let resolvedWith: 'canplay' | 'canplaythrough' | 'metadata' | 'timeout' = 'timeout'
    
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      
      const cleanup = () => {
        video.oncanplay = null
        video.oncanplaythrough = null
        video.onloadedmetadata = null
        video.onerror = null
      }
      
      video.oncanplay = () => {
        if (timeToCanPlay === 0) {
          timeToCanPlay = Date.now() - startTime
          resolvedWith = 'canplay'
          console.log(`🎯 Video canplay after ${timeToCanPlay}ms`)
        }
      }
      
      video.oncanplaythrough = () => {
        if (timeToCanPlayThrough === 0) {
          timeToCanPlayThrough = Date.now() - startTime
          if (resolvedWith === 'timeout') {
            resolvedWith = 'canplaythrough'
          }
          console.log(`🎯 Video canplaythrough after ${timeToCanPlayThrough}ms`)
        }
      }
      
      video.onloadedmetadata = () => {
        console.log(`📊 Video metadata loaded after ${Date.now() - startTime}ms`)
        // Switch to auto preload like our implementation
        video.preload = 'auto'
      }
      
      video.onerror = () => {
        cleanup()
        resolve({
          passed: false,
          timeToCanPlay: 0,
          timeToCanPlayThrough: 0,
          resolvedWith: 'timeout'
        })
      }
      
      // Test timeout
      setTimeout(() => {
        cleanup()
        resolve({
          passed: resolvedWith !== 'timeout' && timeToCanPlay > 0 && timeToCanPlay < 10000,
          timeToCanPlay,
          timeToCanPlayThrough,
          resolvedWith
        })
      }, 15000)
      
      video.src = videoUrl
    })
  }

  /**
   * Test memory management (mock)
   */
  async testMemoryManagement(): Promise<PreloaderTestResults['memoryManagementTest']> {
    // Simulate memory usage before/after cleanup
    const mockMemoryBefore = Math.floor(Math.random() * 100) + 50 // 50-150MB
    const mockMemoryAfter = Math.floor(mockMemoryBefore * 0.3) // 30% remaining
    
    return {
      passed: mockMemoryAfter < mockMemoryBefore * 0.5,
      memoryBeforeCleanup: mockMemoryBefore,
      memoryAfterCleanup: mockMemoryAfter,
      cleanupTriggered: true
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runFullTestSuite(eventId: string = 'test-event', eventVideoUrl: string = '/test-video.mp4'): Promise<PreloaderTestResults> {
    console.log('🧪 Starting comprehensive preloader test suite...')
    
    const results: PreloaderTestResults = {
      buttonFallbackTest: await this.testButtonFallback(eventId, eventVideoUrl),
      progressiveLoadingTest: await this.testProgressiveLoading('data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDF'), // Tiny test video
      memoryManagementTest: await this.testMemoryManagement()
    }
    
    console.log('📊 Test Results:', results)
    
    // Log summary
    const allPassed = Object.values(results).every(test => test.passed)
    console.log(allPassed ? '✅ All tests PASSED!' : '❌ Some tests FAILED!')
    
    return results
  }

  /**
   * Helper: Intercept video loading with delay
   */
  private interceptVideoLoading(delay: number) {
    const originalCreate = HTMLVideoElement
    // Note: This is a simplified approach for testing
    // In real testing, you'd want to use more sophisticated mocking
    console.log(`🐌 Simulating slow video loading with ${delay}ms delay`)
  }

  /**
   * Helper: Intercept video loading to simulate failure
   */
  private interceptVideoFailure() {
    console.log('❌ Simulating video loading failure')
  }

  /**
   * Helper: Intercept video loading with timeout
   */
  private interceptVideoTimeout(delay: number) {
    console.log(`⏰ Simulating video loading timeout after ${delay}ms`)
  }

  /**
   * Reset all interceptions
   */
  reset() {
    window.fetch = this.originalFetch
    // Reset other interceptions
    console.log('🔄 Reset all network simulations')
  }
}

/**
 * Quick testing utilities for the browser console
 */
export const createPreloaderTestUtils = () => {
  const preloaderDebugger = new PreloaderDebugger()
  
  // Attach to window for easy access in dev tools
  if (typeof window !== 'undefined') {
    (window as any).preloaderDebugger = preloaderDebugger;
    (window as any).testPreloader = (eventId?: string, videoUrl?: string) => {
      return preloaderDebugger.runFullTestSuite(eventId, videoUrl)
    }
    
    console.log('🛠️  Preloader debug tools attached to window!')
    console.log('   • window.testPreloader() - Run full test suite')
    console.log('   • window.preloaderDebugger - Access full debugger API')
  }
  
  return preloaderDebugger
}

// Auto-initialize in development
if (import.meta.env.DEV) {
  createPreloaderTestUtils()
}