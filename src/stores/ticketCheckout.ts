/**
 * Ticket checkout cart store.
 *
 * Holds the buyer's in-progress cart between the public event drawer/page and
 * the dedicated checkout view. Persisted to `sessionStorage` so a refresh on
 * the checkout page doesn't drop the selections (the buyer may need to look
 * something up out-of-band before finishing).
 *
 * Scope: a single event at a time. Switching events overwrites the cart — the
 * UI confirms that with the user via the Tier list before pushing a new tier
 * if the existing cart belongs to a different event.
 *
 * Why session, not local: tickets typically transact in one sitting; surfacing
 * a stale cart days later would surprise users (and the cart references tier
 * IDs whose price/inventory may have changed).
 */

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { TicketCurrency, TicketType } from '@/services/api'

const STORAGE_KEY = 'goevent.ticketCheckout.v1'

export interface TicketCartItem {
  ticketTypeId: number
  quantity: number
  /** Snapshot fields kept for review UI; the server is source-of-truth at submit time. */
  name: string
  unitPrice: string
  currency: TicketCurrency
  maxPerOrder: number
}

interface PersistedState {
  eventId: string | null
  items: TicketCartItem[]
  promoCode: string
}

const blankState = (): PersistedState => ({
  eventId: null,
  items: [],
  promoCode: '',
})

const loadFromStorage = (): PersistedState => {
  if (typeof window === 'undefined') return blankState()
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return blankState()
    const parsed = JSON.parse(raw) as PersistedState
    if (!parsed || typeof parsed !== 'object') return blankState()
    return {
      eventId: typeof parsed.eventId === 'string' ? parsed.eventId : null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      promoCode: typeof parsed.promoCode === 'string' ? parsed.promoCode : '',
    }
  } catch {
    return blankState()
  }
}

export const useTicketCheckoutStore = defineStore('ticketCheckout', () => {
  const initial = loadFromStorage()
  const eventId = ref<string | null>(initial.eventId)
  const items = ref<TicketCartItem[]>(initial.items)
  const promoCode = ref<string>(initial.promoCode)

  // Persist any change to sessionStorage as a single JSON blob.
  watch(
    [eventId, items, promoCode],
    () => {
      if (typeof window === 'undefined') return
      const snapshot: PersistedState = {
        eventId: eventId.value,
        items: items.value,
        promoCode: promoCode.value,
      }
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
      } catch {
        // Quota / privacy mode — fail silently; in-memory state still works for the session.
      }
    },
    { deep: true },
  )

  const totalQuantity = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  )

  /** Subtotal (pre-promo) computed from the snapshot prices, as a string. */
  const subtotal = computed<string>(() => {
    if (items.value.length === 0) return '0'
    const sum = items.value.reduce((acc, item) => {
      const price = Number(item.unitPrice)
      if (!Number.isFinite(price)) return acc
      return acc + price * item.quantity
    }, 0)
    // KHR has no decimals in practice; use 2dp for USD.
    const currency = items.value[0]?.currency ?? 'USD'
    return sum.toFixed(currency === 'KHR' ? 0 : 2)
  })

  const cartCurrency = computed<TicketCurrency | null>(() => {
    return items.value[0]?.currency ?? null
  })

  /**
   * Mixed-currency carts are rejected server-side. Detect locally so the UI
   * can warn before submit. Should never happen in practice (tiers on one
   * event share a currency) but the safeguard is cheap.
   */
  const hasMixedCurrency = computed(() => {
    if (items.value.length < 2) return false
    const first = items.value[0].currency
    return items.value.some((it) => it.currency !== first)
  })

  /** Replace whatever was in the cart with a fresh single-event cart. */
  const startCart = (newEventId: string) => {
    eventId.value = newEventId
    items.value = []
    promoCode.value = ''
  }

  /**
   * Set the quantity for a tier in the current event's cart. 0 removes the row.
   *
   * Caller is responsible for calling `startCart(eventId)` first if the cart
   * belongs to a different event — we deliberately do NOT key off `tier.event_id`
   * here because (a) the field can be missing or named differently in the live
   * payload, and (b) auto-resetting the cart on every call would silently wipe
   * items when the field is absent. Keep the discriminator at the call site.
   */
  const setQuantity = (tier: TicketType, quantity: number) => {
    const clamped = Math.max(0, Math.min(quantity, tier.max_per_order))
    const idx = items.value.findIndex((it) => it.ticketTypeId === tier.id)
    if (clamped === 0) {
      if (idx !== -1) items.value.splice(idx, 1)
      return
    }
    const next: TicketCartItem = {
      ticketTypeId: tier.id,
      quantity: clamped,
      name: tier.name,
      unitPrice: tier.price,
      currency: tier.currency,
      maxPerOrder: tier.max_per_order,
    }
    if (idx === -1) {
      items.value.push(next)
    } else {
      items.value[idx] = next
    }
  }

  const getQuantity = (ticketTypeId: number): number => {
    return items.value.find((it) => it.ticketTypeId === ticketTypeId)?.quantity ?? 0
  }

  const setPromoCode = (code: string) => {
    promoCode.value = code.trim()
  }

  const clear = () => {
    eventId.value = null
    items.value = []
    promoCode.value = ''
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }

  return {
    eventId,
    items,
    promoCode,
    totalQuantity,
    subtotal,
    cartCurrency,
    hasMixedCurrency,
    startCart,
    setQuantity,
    getQuantity,
    setPromoCode,
    clear,
  }
})
