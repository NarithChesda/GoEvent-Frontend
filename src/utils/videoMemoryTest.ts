/**
 * Video Memory Management Test Utilities
 *
 * This module provides utilities for testing and monitoring video memory usage
 * in the event showcase system, particularly for mobile devices.
 *
 * Usage:
 * - Import in development/test environments to monitor memory usage
 * - Use performance methods to track memory leaks
 * - Validate cleanup effectiveness
 */

interface MemoryTestResult {
  testName: string
  success: boolean
  memoryBefore: number
  memoryAfter: number
  memoryDelta: number
  videoElementsRemaining: number
  blobUrlsRemaining: number
  error?: string
}

interface VideoMemoryStats {
  usedJSHeapSize?: number
  totalJSHeapSize?: number
  jsHeapSizeLimit?: number
  videoElements: number
  blobUrls: number
  eventListeners: number
}

export class VideoMemoryTester {
  private testResults: MemoryTestResult[] = []
  private initialMemory: number = 0

  /**
   * Get current memory usage stats
   */
  private getMemoryStats(): VideoMemoryStats {
    const performance = (window as any).performance
    const memory = performance?.memory

    return {
      usedJSHeapSize: memory?.usedJSHeapSize || 0,
      totalJSHeapSize: memory?.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
      videoElements: document.querySelectorAll('video').length,
      blobUrls: this.countBlobUrls(),
      eventListeners: this.estimateEventListeners()
    }
  }

  /**
   * Count active blob URLs (estimate)
   */
  private countBlobUrls(): number {
    let count = 0
    const videos = document.querySelectorAll('video')

    videos.forEach(video => {
      const src = video.src || video.currentSrc
      if (src && src.startsWith('blob:')) {
        count++
      }
    })

    return count
  }

  /**
   * Estimate number of event listeners (rough count)
   */
  private estimateEventListeners(): number {
    // This is a rough estimate - in real scenarios we'd track this more precisely
    return document.querySelectorAll('video, audio').length * 5 // Assume ~5 listeners per element
  }

  /**
   * Initialize memory testing
   */
  public initializeTest(): void {
    const stats = this.getMemoryStats()
    this.initialMemory = stats.usedJSHeapSize || 0
    console.log('🧪 Video Memory Test Initialized:', stats)
  }

  /**
   * Test video element cleanup
   */
  public async testVideoCleanup(
    videoResourceManager: any,
    testName: string = 'Video Cleanup Test'
  ): Promise<MemoryTestResult> {
    const memoryBefore = this.getMemoryStats()

    try {
      // Force cleanup
      await videoResourceManager.cleanupAllVideos()

      // Give time for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc()
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const memoryAfter = this.getMemoryStats()

      const result: MemoryTestResult = {
        testName,
        success: memoryAfter.videoElements === 0 && memoryAfter.blobUrls === 0,
        memoryBefore: memoryBefore.usedJSHeapSize || 0,
        memoryAfter: memoryAfter.usedJSHeapSize || 0,
        memoryDelta: (memoryAfter.usedJSHeapSize || 0) - (memoryBefore.usedJSHeapSize || 0),
        videoElementsRemaining: memoryAfter.videoElements,
        blobUrlsRemaining: memoryAfter.blobUrls
      }

      this.testResults.push(result)
      this.logTestResult(result)

      return result

    } catch (error) {
      const result: MemoryTestResult = {
        testName,
        success: false,
        memoryBefore: memoryBefore.usedJSHeapSize || 0,
        memoryAfter: memoryBefore.usedJSHeapSize || 0,
        memoryDelta: 0,
        videoElementsRemaining: memoryBefore.videoElements,
        blobUrlsRemaining: memoryBefore.blobUrls,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      this.testResults.push(result)
      this.logTestResult(result)

      return result
    }
  }

  /**
   * Test memory usage over multiple showcase loads
   */
  public async testMemoryLeakDetection(
    loadShowcaseFunction: () => Promise<void>,
    iterations: number = 5
  ): Promise<MemoryTestResult[]> {
    const results: MemoryTestResult[] = []
    let previousMemory = this.getMemoryStats().usedJSHeapSize || 0

    for (let i = 0; i < iterations; i++) {
      const memoryBefore = this.getMemoryStats()

      try {
        // Load showcase
        await loadShowcaseFunction()

        // Wait for resources to load
        await new Promise(resolve => setTimeout(resolve, 2000))

        const memoryAfter = this.getMemoryStats()

        const result: MemoryTestResult = {
          testName: `Memory Leak Test - Iteration ${i + 1}`,
          success: (memoryAfter.usedJSHeapSize || 0) < previousMemory * 1.5, // Allow 50% growth
          memoryBefore: memoryBefore.usedJSHeapSize || 0,
          memoryAfter: memoryAfter.usedJSHeapSize || 0,
          memoryDelta: (memoryAfter.usedJSHeapSize || 0) - (memoryBefore.usedJSHeapSize || 0),
          videoElementsRemaining: memoryAfter.videoElements,
          blobUrlsRemaining: memoryAfter.blobUrls
        }

        results.push(result)
        this.logTestResult(result)

        previousMemory = memoryAfter.usedJSHeapSize || 0

      } catch (error) {
        const result: MemoryTestResult = {
          testName: `Memory Leak Test - Iteration ${i + 1} (Error)`,
          success: false,
          memoryBefore: memoryBefore.usedJSHeapSize || 0,
          memoryAfter: memoryBefore.usedJSHeapSize || 0,
          memoryDelta: 0,
          videoElementsRemaining: memoryBefore.videoElements,
          blobUrlsRemaining: memoryBefore.blobUrls,
          error: error instanceof Error ? error.message : 'Unknown error'
        }

        results.push(result)
        this.logTestResult(result)
      }
    }

    return results
  }

  /**
   * Log test result with proper formatting
   */
  private logTestResult(result: MemoryTestResult): void {
    const status = result.success ? '✅' : '❌'
    const memoryChange = result.memoryDelta > 0 ? `+${this.formatBytes(result.memoryDelta)}` : this.formatBytes(result.memoryDelta)

    console.log(`${status} ${result.testName}`)
    console.log(`   Memory: ${this.formatBytes(result.memoryBefore)} → ${this.formatBytes(result.memoryAfter)} (${memoryChange})`)
    console.log(`   Video Elements: ${result.videoElementsRemaining}`)
    console.log(`   Blob URLs: ${result.blobUrlsRemaining}`)

    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  }

  /**
   * Format bytes for human readable output
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  /**
   * Get summary of all test results
   */
  public getTestSummary(): {
    totalTests: number
    passedTests: number
    failedTests: number
    averageMemoryDelta: number
    totalMemoryDelta: number
  } {
    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter(r => r.success).length
    const failedTests = totalTests - passedTests
    const totalMemoryDelta = this.testResults.reduce((sum, r) => sum + r.memoryDelta, 0)
    const averageMemoryDelta = totalTests > 0 ? totalMemoryDelta / totalTests : 0

    return {
      totalTests,
      passedTests,
      failedTests,
      averageMemoryDelta,
      totalMemoryDelta
    }
  }

  /**
   * Generate detailed report
   */
  public generateReport(): string {
    const summary = this.getTestSummary()

    let report = '\n📊 Video Memory Management Test Report\n'
    report += '========================================\n\n'

    report += `Total Tests: ${summary.totalTests}\n`
    report += `Passed: ${summary.passedTests} ✅\n`
    report += `Failed: ${summary.failedTests} ❌\n`
    report += `Success Rate: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%\n\n`

    report += `Total Memory Delta: ${this.formatBytes(summary.totalMemoryDelta)}\n`
    report += `Average Memory Delta: ${this.formatBytes(summary.averageMemoryDelta)}\n\n`

    report += 'Individual Test Results:\n'
    report += '------------------------\n'

    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      report += `${index + 1}. ${status} ${result.testName}\n`
      report += `   Memory Change: ${this.formatBytes(result.memoryDelta)}\n`
      report += `   Video Elements: ${result.videoElementsRemaining}\n`
      report += `   Blob URLs: ${result.blobUrlsRemaining}\n`
      if (result.error) {
        report += `   Error: ${result.error}\n`
      }
      report += '\n'
    })

    return report
  }
}

// Export singleton instance for easy use
export const videoMemoryTester = new VideoMemoryTester()

// Utility function for quick cleanup testing
export const testVideoCleanup = async (videoResourceManager: any): Promise<void> => {
  videoMemoryTester.initializeTest()
  await videoMemoryTester.testVideoCleanup(videoResourceManager)
  console.log(videoMemoryTester.generateReport())
}