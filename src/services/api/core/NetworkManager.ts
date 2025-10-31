/**
 * Network state management for handling offline/online scenarios
 */

interface NetworkState {
  isOnline: boolean
  retryQueue: (() => Promise<void>)[]
  isRetrying: boolean
}

export class NetworkManager {
  private state: NetworkState = {
    isOnline: navigator.onLine,
    retryQueue: [],
    isRetrying: false,
  }

  constructor() {
    this.initializeListeners()
  }

  /**
   * Initialize network state listeners
   */
  private initializeListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.state.isOnline = true
        console.info('Network connection restored')
        this.processRetryQueue()
      })

      window.addEventListener('offline', () => {
        this.state.isOnline = false
        console.warn('Network connection lost')
      })
    }
  }

  /**
   * Process queued requests when network is restored
   */
  private async processRetryQueue(): Promise<void> {
    if (this.state.isRetrying || this.state.retryQueue.length === 0) {
      return
    }

    this.state.isRetrying = true
    const queue = [...this.state.retryQueue]
    this.state.retryQueue = []

    try {
      for (const retryFn of queue) {
        try {
          await retryFn()
        } catch (error) {
          console.warn('Retry failed:', error)
        }
      }
    } finally {
      this.state.isRetrying = false
    }
  }

  /**
   * Check if the service is currently online
   */
  public isOnline(): boolean {
    return this.state.isOnline
  }

  /**
   * Update network state
   */
  public updateOnlineStatus(): void {
    this.state.isOnline = navigator.onLine
  }

  /**
   * Add a request to the retry queue
   */
  public addToRetryQueue(retryFn: () => Promise<void>): void {
    this.state.retryQueue.push(retryFn)
  }
}

// Singleton instance
export const networkManager = new NetworkManager()
