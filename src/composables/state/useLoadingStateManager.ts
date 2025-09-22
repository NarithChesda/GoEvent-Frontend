import { ref, reactive, computed } from 'vue'
import { useErrorHandler } from '../error/useErrorHandler'

/**
 * Loading state manager composable
 * Provides race condition safe loading state management with automatic cleanup
 */

export interface LoadingState {
  id: string
  context: string
  startTime: number
  progress?: number
  stage?: string
  dependencies?: string[]
}

export interface LoadingStats {
  activeLoading: number
  completedLoading: number
  failedLoading: number
  averageLoadTime: number
}

export function useLoadingStateManager() {
  const { handleError, createRaceConditionSafeState } = useErrorHandler()

  const activeLoading = ref<Map<string, LoadingState>>(new Map())
  const completedLoading = ref<
    Map<string, { state: LoadingState; endTime: number; success: boolean }>
  >(new Map())
  const loadingSequence = ref(0)

  const stats = reactive<LoadingStats>({
    activeLoading: 0,
    completedLoading: 0,
    failedLoading: 0,
    averageLoadTime: 0,
  })

  /**
   * Starts a loading operation with race condition protection
   */
  const startLoading = (context: string, dependencies: string[] = [], stage?: string): string => {
    const id = `loading_${++loadingSequence.value}_${Date.now()}`

    const loadingState: LoadingState = {
      id,
      context,
      startTime: Date.now(),
      progress: 0,
      stage,
      dependencies,
    }

    // Check if dependencies are still loading
    const unmetDependencies = dependencies.filter((dep) =>
      Array.from(activeLoading.value.values()).some((state) => state.context === dep),
    )

    if (unmetDependencies.length > 0) {
      console.warn(`Starting ${context} with unmet dependencies: ${unmetDependencies.join(', ')}`)
    }

    activeLoading.value.set(id, loadingState)
    stats.activeLoading = activeLoading.value.size

    console.log(`🔄 Loading started: ${context} (${id})`)

    return id
  }

  /**
   * Updates loading progress
   */
  const updateLoadingProgress = (loadingId: string, progress: number, stage?: string): boolean => {
    const state = activeLoading.value.get(loadingId)
    if (!state) {
      console.warn(`Attempted to update non-existent loading state: ${loadingId}`)
      return false
    }

    state.progress = Math.max(0, Math.min(100, progress))
    if (stage) {
      state.stage = stage
    }

    return true
  }

  /**
   * Completes a loading operation
   */
  const completeLoading = (loadingId: string, success: boolean = true, error?: Error): boolean => {
    const state = activeLoading.value.get(loadingId)
    if (!state) {
      console.warn(`Attempted to complete non-existent loading state: ${loadingId}`)
      return false
    }

    const endTime = Date.now()
    const loadTime = endTime - state.startTime

    // Move to completed
    completedLoading.value.set(loadingId, {
      state: { ...state, progress: success ? 100 : state.progress },
      endTime,
      success,
    })

    // Remove from active
    activeLoading.value.delete(loadingId)

    // Update stats
    stats.activeLoading = activeLoading.value.size
    if (success) {
      stats.completedLoading++
    } else {
      stats.failedLoading++
      if (error) {
        handleError(error, 'resource', `Loading failed: ${state.context}`)
      }
    }

    // Update average load time
    const totalCompleted = stats.completedLoading + stats.failedLoading
    const currentAverage = stats.averageLoadTime
    stats.averageLoadTime = (currentAverage * (totalCompleted - 1) + loadTime) / totalCompleted

    const status = success ? '✅' : '❌'
    console.log(`${status} Loading completed: ${state.context} (${loadTime}ms)`)

    return true
  }

  /**
   * Cancels a loading operation
   */
  const cancelLoading = (loadingId: string): boolean => {
    const state = activeLoading.value.get(loadingId)
    if (!state) {
      return false
    }

    activeLoading.value.delete(loadingId)
    stats.activeLoading = activeLoading.value.size
    stats.failedLoading++

    console.log(`🚫 Loading cancelled: ${state.context}`)

    return true
  }

  /**
   * Creates a stage-based loading manager for complex operations
   */
  const createStageManager = (context: string, stages: string[]) => {
    const stageManager = {
      context,
      stages,
      currentStage: 0,
      loadingId: '',

      start(): string {
        this.currentStage = 0
        this.loadingId = startLoading(context, [], stages[0])
        return this.loadingId
      },

      nextStage(): boolean {
        if (this.currentStage < stages.length - 1) {
          this.currentStage++
          const progress = (this.currentStage / stages.length) * 100
          return updateLoadingProgress(this.loadingId, progress, stages[this.currentStage])
        }
        return false
      },

      complete(success: boolean = true, error?: Error): boolean {
        return completeLoading(this.loadingId, success, error)
      },

      cancel(): boolean {
        return cancelLoading(this.loadingId)
      },

      getCurrentStage(): string {
        return stages[this.currentStage] || 'Unknown'
      },

      getProgress(): number {
        return (this.currentStage / stages.length) * 100
      },
    }

    return stageManager
  }

  /**
   * Creates a dependency-aware loading operation
   */
  const createDependencyAwareLoader = <T>(context: string, dependencies: string[] = []) => {
    return createRaceConditionSafeState<T | null>(null)
  }

  /**
   * Waits for specific loading operations to complete
   */
  const waitForLoading = (loadingIds: string[], timeoutMs: number = 10000): Promise<boolean[]> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      const results: boolean[] = new Array(loadingIds.length).fill(false)
      let completedCount = 0

      const checkCompletion = () => {
        loadingIds.forEach((id, index) => {
          if (results[index]) return // Already completed

          const completed = completedLoading.value.get(id)
          if (completed) {
            results[index] = completed.success
            completedCount++
          } else if (!activeLoading.value.has(id)) {
            // Loading ID doesn't exist - consider it failed
            results[index] = false
            completedCount++
          }
        })

        if (completedCount === loadingIds.length) {
          resolve(results)
          return
        }

        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
          reject(new Error(`Loading timeout after ${timeoutMs}ms`))
          return
        }

        // Continue checking
        setTimeout(checkCompletion, 100)
      }

      checkCompletion()
    })
  }

  /**
   * Gets loading states by context
   */
  const getLoadingByContext = (context: string) => {
    return Array.from(activeLoading.value.values()).filter((state) => state.context === context)
  }

  /**
   * Checks if specific context is currently loading
   */
  const isLoading = (context?: string): boolean => {
    if (!context) {
      return activeLoading.value.size > 0
    }

    return Array.from(activeLoading.value.values()).some((state) => state.context === context)
  }

  /**
   * Gets overall loading progress for a context
   */
  const getContextProgress = (context: string): number => {
    const contextLoads = getLoadingByContext(context)
    if (contextLoads.length === 0) return 0

    const totalProgress = contextLoads.reduce((sum, load) => sum + (load.progress || 0), 0)
    return totalProgress / contextLoads.length
  }

  /**
   * Cleans up old completed loading states
   */
  const cleanup = (olderThanMs: number = 5 * 60 * 1000) => {
    // 5 minutes default
    const cutoffTime = Date.now() - olderThanMs
    const toDelete: string[] = []

    for (const [id, completed] of completedLoading.value) {
      if (completed.endTime < cutoffTime) {
        toDelete.push(id)
      }
    }

    toDelete.forEach((id) => completedLoading.value.delete(id))

    return toDelete.length
  }

  // Computed properties
  const isAnyLoading = computed(() => activeLoading.value.size > 0)

  const loadingSummary = computed(() => ({
    active: activeLoading.value.size,
    completed: completedLoading.value.size,
    stats: { ...stats },
  }))

  return {
    // Loading management
    startLoading,
    updateLoadingProgress,
    completeLoading,
    cancelLoading,

    // Stage management
    createStageManager,

    // Dependency management
    createDependencyAwareLoader,
    waitForLoading,

    // Queries
    getLoadingByContext,
    isLoading,
    getContextProgress,

    // Cleanup
    cleanup,

    // State
    activeLoading: activeLoading.value,
    completedLoading: completedLoading.value,
    stats,

    // Computed
    isAnyLoading,
    loadingSummary,
  }
}
