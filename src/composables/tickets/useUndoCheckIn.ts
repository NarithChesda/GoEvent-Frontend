/**
 * useUndoCheckIn
 *
 * Tracks the most recent successful scan (entry / re-entry) and exposes a
 * time-gated `undo()` that calls `ticketsService.undo`. The 5-minute soft cap
 * is a UI rule only — backend has no time limit, so a future "undo any past
 * scan" surface (audit log row → undo) can reuse the service directly.
 *
 * State is in-memory only by design: the undo button shouldn't survive a
 * page reload, since staff identity context is lost across sessions.
 */

import { computed, onScopeDispose, ref, watch } from 'vue'
import { ticketsService } from '@/services/api/modules/tickets.service'
import type {
  Ticket,
  UndoCheckInRequest,
} from '@/services/api/types/ticket.types'
import { generateIdempotencyKey } from './useTicketCheckIn'

const DEFAULT_WINDOW_MS = 5 * 60 * 1000

export interface UndoableScan {
  /** QR token or short check-in code — whatever was originally used. */
  code: string
  ticket: Ticket
  scannedAt: number
}

export type UndoOutcome =
  | { kind: 'success'; ticket: Ticket }
  | { kind: 'expired' }
  | { kind: 'no_target' }
  | { kind: 'error'; rawMessage: string }

export function useUndoCheckIn(deviceId: () => string, windowMs = DEFAULT_WINDOW_MS) {
  const lastScan = ref<UndoableScan | null>(null)
  const isUndoing = ref(false)
  const now = ref(Date.now())

  // Recompute `canUndo` once a second — but only while there is a scan to
  // undo. Stops when `lastScan` clears or the window expires, and cleans up
  // on scope dispose so the scanner view can be torn down without leaks.
  let interval: number | null = null
  function startTicker() {
    if (interval !== null || typeof window === 'undefined') return
    interval = window.setInterval(() => {
      now.value = Date.now()
      if (lastScan.value && now.value > lastScan.value.scannedAt + windowMs) {
        stopTicker()
      }
    }, 1000)
  }
  function stopTicker() {
    if (interval !== null) {
      clearInterval(interval)
      interval = null
    }
  }

  watch(lastScan, (next) => {
    if (next) {
      now.value = Date.now()
      startTicker()
    } else {
      stopTicker()
    }
  })

  onScopeDispose(() => stopTicker())

  const remainingMs = computed(() => {
    if (!lastScan.value) return 0
    return Math.max(0, lastScan.value.scannedAt + windowMs - now.value)
  })

  const canUndo = computed(() => Boolean(lastScan.value) && remainingMs.value > 0)

  function record(scan: UndoableScan) {
    lastScan.value = scan
  }

  function clear() {
    lastScan.value = null
  }

  async function undo(reason?: string): Promise<UndoOutcome> {
    if (!lastScan.value) return { kind: 'no_target' }
    if (remainingMs.value <= 0) return { kind: 'expired' }

    isUndoing.value = true
    try {
      const target = lastScan.value
      const payload: UndoCheckInRequest = {
        idempotency_key: generateIdempotencyKey(),
        device_id: deviceId(),
      }
      if (reason && reason.trim()) {
        payload.reason = reason.trim()
      }

      const response = await ticketsService.undo(target.code, payload)
      if (!response.success || !response.data) {
        return {
          kind: 'error',
          rawMessage: response.message ?? 'Undo failed.',
        }
      }

      // Clear the recorded scan so the button hides immediately even if the
      // 5-min window hasn't lapsed.
      lastScan.value = null
      return { kind: 'success', ticket: response.data.ticket }
    } finally {
      isUndoing.value = false
    }
  }

  return {
    record,
    clear,
    undo,
    canUndo,
    isUndoing,
    remainingMs,
    lastScan,
  }
}
