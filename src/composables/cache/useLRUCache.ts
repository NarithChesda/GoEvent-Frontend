import { ref, onUnmounted } from 'vue'

/**
 * LRU Cache composable with memory management
 * Provides efficient caching with automatic eviction based on size and memory limits
 */
export function useLRUCache<T = any>(maxSize: number = 50, maxMemoryMB: number = 100) {
  const cache = ref<Map<string, T>>(new Map())
  const accessOrder = ref<string[]>([])
  const maxMemory = maxMemoryMB * 1024 * 1024 // Convert MB to bytes
  let currentMemory = 0

  /**
   * Estimates memory usage of cached item
   */
  const estimateMemoryUsage = (item: T): number => {
    if (item instanceof HTMLImageElement) {
      return (item.naturalWidth || 100) * (item.naturalHeight || 100) * 4
    }
    if (item instanceof HTMLVideoElement) {
      return 10 * 1024 // 10KB for metadata
    }
    if (item instanceof HTMLAudioElement) {
      return 5 * 1024 // 5KB for audio metadata
    }
    if (item instanceof FontFace) {
      return 50 * 1024 // 50KB average font size
    }
    // For objects, try to estimate based on JSON size
    try {
      return JSON.stringify(item).length * 2 // Rough estimate
    } catch {
      return 1024 // Default 1KB
    }
  }

  /**
   * Updates cache access order for LRU tracking
   */
  const updateAccessOrder = (key: string) => {
    // Remove from current position
    const currentIndex = accessOrder.value.indexOf(key)
    if (currentIndex > -1) {
      accessOrder.value.splice(currentIndex, 1)
    }

    // Add to end (most recently used)
    accessOrder.value.push(key)
  }

  /**
   * Evicts least recently used cache item
   */
  const evictLeastRecentlyUsed = () => {
    if (accessOrder.value.length === 0) return

    const lruKey = accessOrder.value.shift()
    if (lruKey && cache.value.has(lruKey)) {
      const item = cache.value.get(lruKey)!
      const itemSize = estimateMemoryUsage(item)

      cache.value.delete(lruKey)
      currentMemory = Math.max(0, currentMemory - itemSize)

      console.log(`🗑️ Evicted LRU cache item: ${lruKey} (${itemSize} bytes)`)
    }
  }

  /**
   * Sets cache item with automatic eviction if needed
   */
  const set = (key: string, item: T): void => {
    const itemSize = estimateMemoryUsage(item)

    // Check if adding this item would exceed memory limits
    while (currentMemory + itemSize > maxMemory && accessOrder.value.length > 0) {
      evictLeastRecentlyUsed()
    }

    // Check if adding this item would exceed count limits
    while (cache.value.size >= maxSize && accessOrder.value.length > 0) {
      evictLeastRecentlyUsed()
    }

    // Remove existing item if updating
    if (cache.value.has(key)) {
      const existingItem = cache.value.get(key)!
      currentMemory -= estimateMemoryUsage(existingItem)
    }

    // Add to cache
    cache.value.set(key, item)
    currentMemory += itemSize

    // Update access order
    updateAccessOrder(key)
  }

  /**
   * Gets cache item and updates access order
   */
  const get = (key: string): T | undefined => {
    if (cache.value.has(key)) {
      updateAccessOrder(key)
      return cache.value.get(key)
    }
    return undefined
  }

  /**
   * Checks if key exists in cache
   */
  const has = (key: string): boolean => {
    return cache.value.has(key)
  }

  /**
   * Deletes specific cache item
   */
  const delete_ = (key: string): boolean => {
    if (cache.value.has(key)) {
      const item = cache.value.get(key)!
      const itemSize = estimateMemoryUsage(item)

      cache.value.delete(key)
      currentMemory = Math.max(0, currentMemory - itemSize)

      // Remove from access order
      const index = accessOrder.value.indexOf(key)
      if (index > -1) {
        accessOrder.value.splice(index, 1)
      }

      return true
    }
    return false
  }

  /**
   * Clears entire cache
   */
  const clear = () => {
    cache.value.clear()
    accessOrder.value = []
    currentMemory = 0
  }

  /**
   * Gets cache statistics
   */
  const stats = () => ({
    size: cache.value.size,
    maxSize,
    memoryUsage: currentMemory,
    maxMemory,
    memoryPercentage: Math.round((currentMemory / maxMemory) * 100),
    accessOrder: [...accessOrder.value],
  })

  /**
   * Force eviction of old items based on age
   */
  const evictOldItems = (maxAge: number = 300000) => {
    // 5 minutes default
    const now = Date.now()
    const keysToEvict: string[] = []

    // This would require tracking creation time, which we can add if needed
    // For now, just evict half the items if we're at capacity
    if (cache.value.size >= maxSize) {
      const evictCount = Math.floor(cache.value.size / 2)
      keysToEvict.push(...accessOrder.value.slice(0, evictCount))
    }

    keysToEvict.forEach((key) => delete_(key))

    return keysToEvict.length
  }

  // Cleanup on unmount
  onUnmounted(() => {
    clear()
  })

  return {
    set,
    get,
    has,
    delete: delete_,
    clear,
    stats,
    evictOldItems,
    // Expose readonly refs for reactivity
    size: () => cache.value.size,
    keys: () => Array.from(cache.value.keys()),
    values: () => Array.from(cache.value.values()),
  }
}
