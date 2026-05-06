/**
 * useTicketCheckIn
 *
 * Wraps `ticketsService.checkIn` and normalizes the always-200 response into
 * a discriminated union. Generates an idempotency key per scan attempt so a
 * timed-out request that retries doesn't double-count. Enforces the
 * cross-event guard client-side using the now-guaranteed `ticket.event_id`.
 *
 * The composable is intentionally side-effect-light — sound, haptic, counter
 * polling, and persistence live in their own composables / the view. This one
 * just turns "raw API response" into "outcome the UI can render".
 */

import { ref, type Ref, type MaybeRefOrGetter, toValue } from 'vue'
import { ticketsService } from '@/services/api/modules/tickets.service'
import type {
  CheckInRequest,
  CheckInSource,
  Ticket,
} from '@/services/api/types/ticket.types'

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
}

const RECENT_LIMIT = 10

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
  // Fallback: RFC4122-shaped string from Math.random.
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

/**
 * Build the request payload from a raw scanned/typed code. We let the caller
 * declare the source: when `qr` we send the value as `qr_code`, otherwise as
 * `check_in_code`. The manual code is uppercased + trimmed before sending.
 */
function buildPayload(
  code: string,
  source: CheckInSource,
  idempotencyKey: string,
  deviceId: string,
  allowedTierIds: number[] | null | undefined,
): CheckInRequest {
  const trimmed = code.trim()
  const payload: CheckInRequest = {
    idempotency_key: idempotencyKey,
    device_id: deviceId,
    source,
  }
  if (allowedTierIds && allowedTierIds.length > 0) {
    payload.allowed_tier_ids = allowedTierIds
  }
  if (source === 'qr') {
    payload.qr_code = trimmed
  } else {
    payload.check_in_code = trimmed.toUpperCase()
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

    isScanning.value = true
    try {
      const eventId = toValue(options.eventId)
      const deviceId = toValue(options.deviceId)
      const allowedTierIds = toValue(options.allowedTierIds) ?? null
      const idempotencyKey = generateIdempotencyKey()
      const payload = buildPayload(code, source, idempotencyKey, deviceId, allowedTierIds)

      const response = await ticketsService.checkIn(payload)

      let outcome: ScanOutcome

      if (!response.success) {
        // HTTP 400 / 403 / network — distinguish by message shape.
        // The api client surfaces network/timeout failures via a non-success
        // response with `message` set; validation errors come through the
        // same field with the field name appended.
        const message = response.message ?? 'Check-in failed.'
        const looksLikeNetworkErr = /network|offline|fetch|timeout|cancelled/i.test(message)
        outcome = looksLikeNetworkErr
          ? { kind: 'network_error', rawMessage: message }
          : { kind: 'invalid', rawMessage: message }
      } else if (!response.data) {
        outcome = { kind: 'invalid', rawMessage: 'Empty response.' }
      } else {
        const body = response.data
        const ticket = body.ticket
        const suspicious = Boolean(body.suspicious)
        const replayed = Boolean(body.replayed)

        if (body.ok && ticket) {
          // Cross-event guard — backend always populates ticket.event_id on
          // a successful entry/reentry. If the scanner is configured for a
          // different event, surface that as a hard wrong_event so staff
          // know the device is misrouted, not the ticket.
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
