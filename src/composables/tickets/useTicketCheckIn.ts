/**
 * useTicketCheckIn
 *
 * Wraps `ticketsService.checkIn` and normalizes the always-200 response into
 * a discriminated union. Generates an idempotency key per scan attempt so a
 * timed-out request that retries doesn't double-count. Enforces the
 * cross-event guard client-side using the now-guaranteed `ticket.event_id`.
 *
 * Offline path: when a `queue` is provided, every scan is **pre-enqueued**
 * before the live request fires. On success the row is dropped from the
 * queue. On a network/timeout failure (or when `navigator.onLine === false`)
 * the row stays — the parent surfaces a "queued" outcome so staff let the
 * attendee through, and the queue's flusher syncs later via batchSync.
 *
 * The composable is intentionally side-effect-light — sound, haptic, counter
 * polling, and persistence live in their own composables / the view. This
 * one just turns "raw API response" into "outcome the UI can render".
 */

import { ref, type Ref, type MaybeRefOrGetter, toValue } from 'vue'
import { ticketsService } from '@/services/api/modules/tickets.service'
import type {
  CheckInRequest,
  CheckInSource,
  Ticket,
} from '@/services/api/types/ticket.types'
import type { ScanQueue } from './useScanQueue'

export type ScanRejectionReason =
  | 'already_checked_in'
  | 'refunded'
  | 'cancelled'
  | 'event_not_running'
  | 'wrong_tier'
  | 'unknown'

interface SuccessOutcomeBase {
  ticket: Ticket
  checkInCount: number
  auditId: string
  suspicious: boolean
  replayed: boolean
}

export type ScanOutcome =
  | ({ kind: 'entry' } & SuccessOutcomeBase)
  | ({ kind: 'reentry' } & SuccessOutcomeBase)
  | {
      kind: 'rejected'
      ticket?: Ticket
      reason: ScanRejectionReason
      rawMessage: string
      auditId?: string
      suspicious: boolean
    }
  | { kind: 'wrong_event'; ticket: Ticket; rawMessage: string }
  | { kind: 'invalid'; rawMessage: string }
  | { kind: 'network_error'; rawMessage: string }
  | {
      kind: 'queued'
      /** Normalized code that was stored in the offline queue. */
      code: string
      idempotencyKey: string
      /** ISO 8601 — same value persisted to the queue row. */
      scannedAt: string
    }

export interface RecentScan {
  outcome: ScanOutcome
  scannedAt: number
  source: CheckInSource
}

export interface UseTicketCheckInOptions {
  eventId: MaybeRefOrGetter<string>
  /** Free-text scanner identifier; threaded into every request + audit row. */
  deviceId: MaybeRefOrGetter<string>
  /** Optional tier-id allow-list for per-gate scanners. */
  allowedTierIds?: MaybeRefOrGetter<number[] | null | undefined>
  /**
   * Optional offline queue. When provided, scans are pre-enqueued before the
   * live request fires and removed only when the server confirms (or the
   * error is a non-network validation failure). Without a queue the flow is
   * "best-effort online only" and network errors surface a red banner.
   */
  queue?: ScanQueue
}

const RECENT_LIMIT = 10
const NETWORK_ERR_PATTERN = /network|offline|fetch|timeout|cancelled|connect/i

/**
 * Generate a v4-ish UUID. Uses crypto.randomUUID when available (modern
 * browsers, HTTPS or localhost contexts) and falls back to a Math.random
 * variant otherwise. Idempotency keys don't need cryptographic strength —
 * they just need to be unique enough not to collide across a session.
 */
export function generateIdempotencyKey(): string {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Map a raw rejection message to a stable enum reason. */
function rejectionReasonFor(message: string, wrongTier: boolean): ScanRejectionReason {
  if (wrongTier) return 'wrong_tier'
  const lower = message.toLowerCase()
  if (lower.includes('already checked in')) return 'already_checked_in'
  if (lower.includes('refund')) return 'refunded'
  if (lower.includes('cancel')) return 'cancelled'
  if (lower.includes('not currently running') || lower.includes('not running')) {
    return 'event_not_running'
  }
  return 'unknown'
}

/** Normalize the raw scanned/typed code: trim always, uppercase for manual. */
function normalizeCode(code: string, source: CheckInSource): string {
  const trimmed = code.trim()
  return source === 'manual' ? trimmed.toUpperCase() : trimmed
}

function buildPayload(
  normalizedCode: string,
  source: CheckInSource,
  idempotencyKey: string,
  deviceId: string,
  allowedTierIds: number[] | null | undefined,
): CheckInRequest {
  const payload: CheckInRequest = {
    idempotency_key: idempotencyKey,
    device_id: deviceId,
    source,
  }
  if (allowedTierIds && allowedTierIds.length > 0) {
    payload.allowed_tier_ids = allowedTierIds
  }
  if (source === 'qr') {
    payload.qr_code = normalizedCode
  } else {
    payload.check_in_code = normalizedCode
  }
  return payload
}

export function useTicketCheckIn(options: UseTicketCheckInOptions) {
  const isScanning = ref(false)
  const lastOutcome: Ref<ScanOutcome | null> = ref(null)
  const recent: Ref<RecentScan[]> = ref([])

  function pushRecent(outcome: ScanOutcome, source: CheckInSource) {
    recent.value = [
      { outcome, scannedAt: Date.now(), source },
      ...recent.value,
    ].slice(0, RECENT_LIMIT)
  }

  async function scan(code: string, source: CheckInSource): Promise<ScanOutcome> {
    if (!code || !code.trim()) {
      const outcome: ScanOutcome = {
        kind: 'invalid',
        rawMessage: 'Empty code.',
      }
      lastOutcome.value = outcome
      return outcome
    }

    const eventId = toValue(options.eventId)
    const deviceId = toValue(options.deviceId)
    const allowedTierIds = toValue(options.allowedTierIds) ?? null
    const idempotencyKey = generateIdempotencyKey()
    const scannedAt = new Date().toISOString()
    const normalizedCode = normalizeCode(code, source)
    const queue = options.queue

    // Pre-enqueue so a crash / nav between request send and response doesn't
    // lose the scan. Idempotency keys make this safe — the eventual flush
    // will get a `replayed: true` if the server actually processed it.
    if (queue) {
      queue.enqueue({
        idempotencyKey,
        code: normalizedCode,
        source,
        scannedAt,
        deviceId,
        allowedTierIds,
      })
    }

    // Always try the live endpoint first per the API doc's recommended
    // offline-queue pattern. We don't short-circuit on `navigator.onLine`
    // because (a) it can lie on captive portals, and (b) when truly offline
    // the browser fails fetch fast anyway — the queue path triggers from
    // the catch / network-error branch below. A retry-storm is prevented by
    // not retrying *this scan* on failure; the queue's flusher handles sync
    // on its own cadence.
    isScanning.value = true
    try {
      const payload = buildPayload(
        normalizedCode,
        source,
        idempotencyKey,
        deviceId,
        allowedTierIds,
      )
      const response = await ticketsService.checkIn(payload)

      let outcome: ScanOutcome

      if (!response.success) {
        const message = response.message ?? 'Check-in failed.'
        const looksLikeNetworkErr = NETWORK_ERR_PATTERN.test(message)
        if (looksLikeNetworkErr && queue) {
          // Stay in queue — the flusher will retry.
          outcome = {
            kind: 'queued',
            code: normalizedCode,
            idempotencyKey,
            scannedAt,
          }
        } else if (looksLikeNetworkErr) {
          // No queue configured — show the old red banner so staff know the
          // scan didn't make it through.
          outcome = { kind: 'network_error', rawMessage: message }
        } else {
          // Validation / permission error — drop from queue and surface
          // invalid so staff retry / look up the attendee.
          queue?.removeByKey(idempotencyKey)
          outcome = { kind: 'invalid', rawMessage: message }
        }
      } else if (!response.data) {
        queue?.removeByKey(idempotencyKey)
        outcome = { kind: 'invalid', rawMessage: 'Empty response.' }
      } else {
        // Server processed it — drop from queue.
        queue?.removeByKey(idempotencyKey)

        const body = response.data
        const ticket = body.ticket
        const suspicious = Boolean(body.suspicious)
        const replayed = Boolean(body.replayed)

        if (body.ok && ticket) {
          if (ticket.event_id && ticket.event_id !== eventId) {
            outcome = {
              kind: 'wrong_event',
              ticket,
              rawMessage: body.message ?? 'Ticket belongs to a different event.',
            }
          } else {
            const base: SuccessOutcomeBase = {
              ticket,
              checkInCount: ticket.check_in_count ?? 0,
              auditId: body.audit_id ?? '',
              suspicious,
              replayed,
            }
            outcome = body.was_reentry
              ? { kind: 'reentry', ...base }
              : { kind: 'entry', ...base }
          }
        } else {
          const reason = rejectionReasonFor(body.message ?? '', Boolean(body.wrong_tier))
          outcome = {
            kind: 'rejected',
            ticket: ticket ?? undefined,
            reason,
            rawMessage: body.message ?? 'Rejected.',
            auditId: body.audit_id || undefined,
            suspicious,
          }
        }
      }

      lastOutcome.value = outcome
      pushRecent(outcome, source)
      return outcome
    } catch (err) {
      // Thrown errors (e.g. an exception bubbling out of fetch) are treated
      // like network errors: keep in queue, surface "queued".
      const message = err instanceof Error ? err.message : 'Network error.'
      let outcome: ScanOutcome
      if (queue) {
        outcome = {
          kind: 'queued',
          code: normalizedCode,
          idempotencyKey,
          scannedAt,
        }
      } else {
        outcome = { kind: 'network_error', rawMessage: message }
      }
      lastOutcome.value = outcome
      pushRecent(outcome, source)
      return outcome
    } finally {
      isScanning.value = false
    }
  }

  function clearLast() {
    lastOutcome.value = null
  }

  return {
    scan,
    isScanning,
    lastOutcome,
    recent,
    clearLast,
  }
}
