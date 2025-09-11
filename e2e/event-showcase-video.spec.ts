import { test, expect, type Page } from '@playwright/test'

test.describe('Event Showcase Video Loading', () => {
  test('should preload background video during event video stage', async ({ page }) => {
    // Track network requests
    const networkRequests: Array<{ url: string, timestamp: number, type: string }> = []
    
    page.on('request', request => {
      const url = request.url()
      if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
        networkRequests.push({
          url,
          timestamp: Date.now(),
          type: 'video'
        })
        console.log(`📹 Video request: ${url.substring(url.lastIndexOf('/') + 1)}`)
      }
    })

    // Listen for console logs from the video composable
    page.on('console', msg => {
      if (msg.text().includes('🎬') || msg.text().includes('📹') || msg.text().includes('✅')) {
        console.log(`Console: ${msg.text()}`)
      }
    })

    // Navigate to an event showcase page
    // Replace 'your-event-id' with an actual event ID from your system
    const eventId = 'your-event-id'
    await page.goto(`/events/${eventId}/showcase`)

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check if cover stage elements are present
    await expect(page.locator('[data-video-type="cover"]')).toBeVisible({ timeout: 10000 })

    // Wait for event video to start loading
    await page.waitForFunction(() => {
      const eventVideo = document.querySelector('[data-video-type="event"]')
      return eventVideo && eventVideo.getAttribute('src')
    }, { timeout: 15000 })

    // Check if background video element exists and gets src
    await page.waitForFunction(() => {
      const backgroundVideo = document.querySelector('[data-video-type="background"]')
      return backgroundVideo && backgroundVideo.getAttribute('src')
    }, { timeout: 20000 })

    // Verify video loading order
    const videoRequests = networkRequests.filter(req => req.type === 'video')
    
    if (videoRequests.length >= 2) {
      const eventVideoRequest = videoRequests.find(req => req.url.includes('event') || req.url.includes('video'))
      const backgroundVideoRequest = videoRequests.find(req => req.url.includes('background') || req.url.includes('template'))
      
      if (eventVideoRequest && backgroundVideoRequest) {
        // Background video should start loading after event video
        expect(backgroundVideoRequest.timestamp).toBeGreaterThan(eventVideoRequest.timestamp)
        console.log('✅ Background video started loading after event video')
      }
    }

    // Test envelope opening (if applicable)
    const openEnvelopeButton = page.locator('button:has-text("Open"), [data-testid="open-envelope"]')
    if (await openEnvelopeButton.isVisible({ timeout: 5000 })) {
      await openEnvelopeButton.click()
      
      // Wait for event video phase
      await page.waitForTimeout(2000)
      
      // Check if we can find video elements in different phases
      const eventVideoVisible = await page.locator('[data-video-type="event"]').isVisible()
      const backgroundVideoExists = await page.locator('[data-video-type="background"]').count() > 0
      
      expect(backgroundVideoExists).toBeTruthy()
      console.log('✅ Background video element exists during event video phase')
    }

    // Print network request summary
    console.log('\n📊 Video Loading Summary:')
    videoRequests.forEach((req, index) => {
      const filename = req.url.substring(req.url.lastIndexOf('/') + 1)
      console.log(`${index + 1}. ${filename} (${new Date(req.timestamp).toISOString()})`)
    })
  })

  test('should handle video loading without errors', async ({ page }) => {
    const consoleErrors: string[] = []
    const networkErrors: string[] = []

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Capture network errors
    page.on('requestfailed', request => {
      networkErrors.push(`Failed: ${request.url()}`)
    })

    const eventId = 'your-event-id'
    await page.goto(`/events/${eventId}/showcase`)

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(10000) // Wait for video loading

    // Check for errors
    const videoRelatedErrors = consoleErrors.filter(error => 
      error.toLowerCase().includes('video') || 
      error.toLowerCase().includes('media') ||
      error.toLowerCase().includes('playback')
    )

    expect(videoRelatedErrors.length).toBe(0)
    expect(networkErrors.length).toBe(0)

    console.log('✅ No video-related errors detected')
  })
})

// Helper function to run a quick manual test
test('manual video loading test', async ({ page }) => {
  // This test is for manual inspection - replace with actual event ID
  console.log('🧪 Manual Video Loading Test')
  console.log('1. Replace "your-event-id" with a real event ID')
  console.log('2. Run: npm run test:e2e -- event-showcase-video.spec.ts')
  console.log('3. Watch console logs for video loading sequence')
  console.log('4. Check Network tab in browser for video downloads')
  
  // Skip this test by default
  test.skip()
})