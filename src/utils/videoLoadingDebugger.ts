/**
 * Video Loading Debugger Utility
 * 
 * Add this to the event showcase page to monitor video loading behavior in real-time.
 * Provides console logging and visual debugging information.
 */

interface VideoDebugInfo {
  element: HTMLVideoElement
  type: string
  src: string
  loadState: string
  networkState: number
  readyState: number
  bufferedAmount: number
  loadStartTime?: number
}

export class VideoLoadingDebugger {
  private videos: Map<HTMLVideoElement, VideoDebugInfo> = new Map()
  private logInterval?: number
  private startTime: number = Date.now()

  constructor(private enableVisualDebug = false) {
    console.log('🧪 Video Loading Debugger initialized')
    this.startPeriodicLogging()
  }

  /**
   * Register a video element for monitoring
   */
  registerVideo(video: HTMLVideoElement, type: string) {
    if (!video) return

    const info: VideoDebugInfo = {
      element: video,
      type,
      src: video.src,
      loadState: 'registered',
      networkState: video.networkState,
      readyState: video.readyState,
      bufferedAmount: 0,
      loadStartTime: Date.now()
    }

    this.videos.set(video, info)

    // Add event listeners
    video.addEventListener('loadstart', () => this.onVideoEvent(video, 'loadstart'))
    video.addEventListener('loadeddata', () => this.onVideoEvent(video, 'loadeddata'))
    video.addEventListener('canplay', () => this.onVideoEvent(video, 'canplay'))
    video.addEventListener('canplaythrough', () => this.onVideoEvent(video, 'canplaythrough'))
    video.addEventListener('progress', () => this.onVideoProgress(video))
    video.addEventListener('error', (e) => this.onVideoError(video, e))

    console.log(`📹 Registered ${type} video for monitoring`)
  }

  /**
   * Get current video loading status
   */
  getVideoStatus() {
    const status: Record<string, any> = {}
    
    this.videos.forEach((info, video) => {
      status[info.type] = {
        src: info.src ? info.src.substring(info.src.lastIndexOf('/') + 1) : 'none',
        networkState: this.getNetworkStateText(info.networkState),
        readyState: this.getReadyStateText(info.readyState),
        buffered: `${info.bufferedAmount.toFixed(1)}%`,
        loadTime: info.loadStartTime ? `${Date.now() - info.loadStartTime}ms` : 'n/a'
      }
    })

    return status
  }

  /**
   * Log current status to console
   */
  logStatus() {
    const status = this.getVideoStatus()
    const elapsed = Date.now() - this.startTime
    
    console.group(`📊 Video Status @ ${elapsed}ms`)
    Object.entries(status).forEach(([type, info]) => {
      console.log(`${type}: ${JSON.stringify(info, null, 2)}`)
    })
    console.groupEnd()
  }

  /**
   * Start periodic status logging
   */
  private startPeriodicLogging() {
    this.logInterval = window.setInterval(() => {
      if (this.videos.size > 0) {
        this.logStatus()
      }
    }, 5000) // Log every 5 seconds
  }

  /**
   * Stop monitoring and cleanup
   */
  cleanup() {
    if (this.logInterval) {
      clearInterval(this.logInterval)
    }
    this.videos.clear()
    console.log('🧪 Video Loading Debugger cleaned up')
  }

  private onVideoEvent(video: HTMLVideoElement, eventType: string) {
    const info = this.videos.get(video)
    if (!info) return

    info.loadState = eventType
    info.networkState = video.networkState
    info.readyState = video.readyState

    const elapsed = info.loadStartTime ? Date.now() - info.loadStartTime : 0
    console.log(`📹 ${info.type} - ${eventType} @ ${elapsed}ms`)
  }

  private onVideoProgress(video: HTMLVideoElement) {
    const info = this.videos.get(video)
    if (!info) return

    // Calculate buffered percentage
    if (video.buffered.length > 0 && video.duration) {
      const buffered = video.buffered.end(video.buffered.length - 1)
      info.bufferedAmount = (buffered / video.duration) * 100
    }

    info.networkState = video.networkState
    info.readyState = video.readyState
  }

  private onVideoError(video: HTMLVideoElement, error: Event) {
    const info = this.videos.get(video)
    if (!info) return

    console.error(`❌ ${info.type} video error:`, error)
  }

  private getNetworkStateText(state: number): string {
    const states = ['EMPTY', 'IDLE', 'LOADING', 'NO_SOURCE']
    return states[state] || `UNKNOWN(${state})`
  }

  private getReadyStateText(state: number): string {
    const states = [
      'HAVE_NOTHING',
      'HAVE_METADATA', 
      'HAVE_CURRENT_DATA',
      'HAVE_FUTURE_DATA',
      'HAVE_ENOUGH_DATA'
    ]
    return states[state] || `UNKNOWN(${state})`
  }
}

// Global debugger instance for console access
declare global {
  interface Window {
    videoDebugger?: VideoLoadingDebugger
  }
}

/**
 * Initialize video debugger (call this in your showcase component)
 */
export function initVideoDebugger(enableVisual = false) {
  if (typeof window !== 'undefined') {
    window.videoDebugger = new VideoLoadingDebugger(enableVisual)
    return window.videoDebugger
  }
  return null
}