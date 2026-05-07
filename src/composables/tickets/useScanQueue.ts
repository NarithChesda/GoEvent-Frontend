/**
 * useScanQueue
 *
 * Persistent (localStorage) queue of pending check-ins so the door scanner
 * keeps working when the venue wifi drops. Each row carries its own
 * idempotency_key + client-claimed scanned_at so:
 *
 *   - Replays via batchSync return the original outcome (no double-count).
 *   - Audit rows preserve actual door-time, not sync-time.
 *
 * Trust model: the parent surfaces a "queued" outcome banner immediately on
 * enqueue so staff let attendees through during connectivity loss. The
 * audit log is the source of truth — invalid scans that get queued will be
 * flagged on the post-event report, but no one is blocked at the door.
 *
 * Storage is per-event (`scan:queue:{eventId}`) so multi-event devices
 * don't cross-contaminate. Stale rows past the server's 7-day cutoff are
 * pruned locally before each flush.
 */

import {
  computed,
  ref,
  toValue,
  onScopeDispose,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue'
import { ticketsService } from '@/services/api/modules/tickets.service'
import type {
  BatchScanItem,
  BatchSyncResultItem,
  CheckInSource,
} from '@/services/api/types/ticket.types'

export interface QueuedScan {
  idempotencyKey: string
  eventId: string
  /** Already normalized: trimmed for QR, uppercased + trimmed for manual. */
  code: string
  source: CheckInSource
  /** ISO 8601 — preserved across the round-trip so the audit row reflects door-time. */
  scannedAt: string
  deviceId: string
  allowedTierIds: number[] | null
  attempts: number
  lastError?: string
}

const STORAGE_KEY_PREFIX = 'scan:queue:'
const STALE_DAYS = 7
const FLUSH_INTERVAL_MS = 60_000
const BATCH_LIMIT = 200

function storageKeyFor(eventId: string): string {
  return `${STORAGE_KEY_PREFIX}${eventId}`
}

function loadFromStorage(eventId: string): QueuedScan[] {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(eventId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as QueuedScan[]).filter(
      (s) =>
        typeof s?.idempotencyKey === 'string' &&
        typeof s?.code === 'string' &&
        typeof s?.scannedAt === 'string',
    )
  } catch {
    return []
  }
}

function saveToStorage(eventId: string, queue: QueuedScan[]): void {
  try {
    if (queue.length === 0) {
      window.localStorage.removeItem(storageKeyFor(eventId))
    } else {
      window.localStorage.setItem(storageKeyFor(eventId), JSON.stringify(queue))
    }
  } catch {
    // Storage full / private mode / blocked — non-fatal.
  }
}

export interface UseScanQueueOptions {
  eventId: MaybeRefOrGetter<string>
  /**
   * Notified per result row when a flush completes. Useful for the view to
   * refresh the live counter once a batch lands. Receives the same
   * `result.idempotency_key` that the row was enqueued with so callers can
   * reconcile against any in-memory state.
   */
  onResultProcessed?: (key: string, result: BatchSyncResultItem) => void
}

export function useScanQueue(options: UseScanQueueOptions) {
  const queue: Ref<QueuedScan[]> = ref([])
  const isFlushing = ref(false)
  const lastFlushAt: Ref<number | null> = ref(null)
  const lastFlushError: Ref<string | null> = ref(null)
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

  let flushTimer: number | null = null

  function refresh() {
    queue.value = loadFromStorage(toValue(options.eventId))
  }
  refresh()

  function persist() {
    saveToStorage(toValue(options.eventId), queue.value)
  }

  function pruneStale(): boolean {
    const cutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000
    const before = queue.value.length
    queue.value = queue.value.filter((s) => Date.parse(s.scannedAt) >= cutoff)
    if (queue.value.length !== before) {
      persist()
      return true
    }
    return false
  }

  function enqueue(entry: Omit<QueuedScan, 'eventId' | 'attempts'>) {
    queue.value = [
      ...queue.value,
      { ...entry, eventId: toValue(options.eventId), attempts: 0 },
    ]
    persist()
  }

  function removeByKey(key: string) {
    const before = queue.value.length
    queue.value = queue.value.filter((s) => s.idempotencyKey !== key)
    if (queue.value.length !== before) persist()
  }

  async function flush(): Promise<void> {
    if (isFlushing.value) return
    if (queue.value.length === 0) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    pruneStale()
    if (queue.value.length === 0) return

    isFlushing.value = true
    lastFlushError.value = null

    try {
      const eventId = toValue(options.eventId)
      const batch = queue.value.slice(0, BATCH_LIMIT)
      const scans: BatchScanItem[] = batch.map((s) => ({
        idempotency_key: s.idempotencyKey,
        device_id: s.deviceId,
        scanned_at: s.scannedAt,
        source: s.source,
        ...(s.source === 'qr'
          ? { qr_code: s.code }
          : { check_in_code: s.code }),
        ...(s.allowedTierIds && s.allowedTierIds.length > 0
          ? { allowed_tier_ids: s.allowedTierIds }
          : {}),
      }))

      const response = await ticketsService.batchSync(eventId, { scans })

      if (response.success && response.data) {
        // Drop every key that came back, regardless of ok/false. The audit
        // row is permanent either way and re-syncing would just hit the
        // idempotency cache.
        const seenKeys = new Set<string>()
        for (const result of response.data.results) {
          options.onResultProcessed?.(result.idempotency_key, result)
          seenKeys.add(result.idempotency_key)
        }
        queue.value = queue.value.filter((s) => !seenKeys.has(s.idempotencyKey))
        persist()
        lastFlushAt.value = Date.now()
      } else {
        // Treat as transient — bump attempt counts so we can surface a
        // "stuck" warning later if the same row keeps failing.
        const message = response.message ?? 'Sync failed'
        const keysInBatch = new Set(batch.map((s) => s.idempotencyKey))
        queue.value = queue.value.map((s) =>
          keysInBatch.has(s.idempotencyKey)
            ? { ...s, attempts: s.attempts + 1, lastError: message }
            : s,
        )
        persist()
        lastFlushError.value = message
      }
    } catch (err) {
      lastFlushError.value = err instanceof Error ? err.message : 'Sync failed'
    } finally {
      isFlushing.value = false
    }
  }

  function startAutoFlush() {
    stopAutoFlush()
    if (typeof window === 'undefined') return
    flushTimer = window.setInterval(() => void flush(), FLUSH_INTERVAL_MS)
    // One immediate attempt so a freshly opened drawer drains quickly.
    void flush()
  }

  function stopAutoFlush() {
    if (flushTimer !== null) {
      window.clearInterval(flushTimer)
      flushTimer = null
    }
  }

  function handleOnline() {
    isOnline.value = true
    void flush()
  }
  function handleOffline() {
    isOnline.value = false
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  onScopeDispose(() => {
    stopAutoFlush()
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  })

  const pendingCount = computed(() => queue.value.length)

  return {
    queue,
    pendingCount,
    isFlushing,
    isOnline,
    lastFlushAt,
    lastFlushError,
    refresh,
    enqueue,
    removeByKey,
    flush,
    pruneStale,
    startAutoFlush,
    stopAutoFlush,
  }
}

export type ScanQueue = ReturnType<typeof useScanQueue>
