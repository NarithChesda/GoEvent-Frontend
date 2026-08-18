/**
 * What a ticket order's status *means* on the buyer's own screens, in one place.
 *
 * The settings list, the order detail panel and the standalone /my-tickets page
 * each carried a private copy of this switch, and the copies had already drifted:
 * `pending` rendered as a neutral slate badge directly above an amber banner
 * telling the buyer to go and pay. Tone is the message here, so it is declared
 * once and read everywhere:
 *
 *   amber   — waiting on the buyer; this is the one that should catch the eye
 *   sky     — in progress, waiting on the organizer; nothing to do but wait
 *   emerald — confirmed, tickets issued
 *   rose    — money went back
 *   slate   — closed; no tickets will come out of this order
 *
 * The organizer-side list (`TicketOrdersList.vue`) deliberately keeps its own
 * palette — the same status reads differently from behind the door.
 */

import type { Component } from 'vue'
import { Ban, CalendarX, CheckCircle2, Clock, Hourglass, RotateCcw, Undo2 } from 'lucide-vue-next'
import type { TicketOrderStatus } from '@/services/api'

export type TicketOrderTone = 'amber' | 'sky' | 'emerald' | 'rose' | 'slate'

export interface TicketOrderStatusMeta {
  icon: Component
  tone: TicketOrderTone
  /** The buyer has to do something before this order becomes a ticket. */
  actionable: boolean
  /** Terminal: this order will never produce a ticket. */
  closed: boolean
}

export const TICKET_ORDER_STATUS_META: Record<TicketOrderStatus, TicketOrderStatusMeta> = {
  pending: { icon: Clock, tone: 'amber', actionable: true, closed: false },
  awaiting_review: { icon: Hourglass, tone: 'sky', actionable: false, closed: false },
  paid: { icon: CheckCircle2, tone: 'emerald', actionable: false, closed: false },
  refund_requested: { icon: RotateCcw, tone: 'sky', actionable: false, closed: false },
  refunded: { icon: Undo2, tone: 'rose', actionable: false, closed: true },
  cancelled: { icon: Ban, tone: 'slate', actionable: false, closed: true },
  expired: { icon: CalendarX, tone: 'slate', actionable: false, closed: true },
}

const FALLBACK_META: TicketOrderStatusMeta = {
  icon: Clock,
  tone: 'slate',
  actionable: false,
  closed: false,
}

export const ticketOrderStatusMeta = (status: TicketOrderStatus): TicketOrderStatusMeta =>
  TICKET_ORDER_STATUS_META[status] ?? FALLBACK_META

/** Status pill: tinted ground + readable text. */
export const TICKET_ORDER_TONE_BADGE: Record<TicketOrderTone, string> = {
  amber: 'bg-amber-50 text-amber-700',
  sky: 'bg-sky-50 text-sky-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  rose: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
}

/** The small icon disc that leads a row/card. */
export const TICKET_ORDER_TONE_ICON: Record<TicketOrderTone, string> = {
  amber: 'bg-amber-50 text-amber-600',
  sky: 'bg-sky-50 text-sky-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-500',
}

/**
 * The tinted band a status leads the buyer's order detail with. Same tones as
 * the pill, but as a full-bleed surface: it carries a sentence of copy, so the
 * text is set for reading rather than for a two-word label.
 */
export const TICKET_ORDER_TONE_BAND: Record<TicketOrderTone, string> = {
  amber: 'bg-amber-50 text-amber-900',
  sky: 'bg-sky-50 text-sky-900',
  emerald: 'bg-emerald-50 text-emerald-900',
  rose: 'bg-rose-50 text-rose-900',
  slate: 'bg-slate-50 text-slate-700',
}

/** A plain colour, for dots in filter menus. */
export const TICKET_ORDER_TONE_DOT: Record<TicketOrderTone, string> = {
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-400',
}

export const ticketOrderBadgeClasses = (status: TicketOrderStatus): string =>
  TICKET_ORDER_TONE_BADGE[ticketOrderStatusMeta(status).tone]

export const ticketOrderIconClasses = (status: TicketOrderStatus): string =>
  TICKET_ORDER_TONE_ICON[ticketOrderStatusMeta(status).tone]

export const ticketOrderDotClasses = (status: TicketOrderStatus): string =>
  TICKET_ORDER_TONE_DOT[ticketOrderStatusMeta(status).tone]

export const ticketOrderBandClasses = (status: TicketOrderStatus): string =>
  TICKET_ORDER_TONE_BAND[ticketOrderStatusMeta(status).tone]

/** Every status, in the order a buyer's own list should offer them as filters. */
export const TICKET_ORDER_STATUS_ORDER: TicketOrderStatus[] = [
  'pending',
  'awaiting_review',
  'paid',
  'refund_requested',
  'refunded',
  'cancelled',
  'expired',
]
