/**
 * Guest-list share links, organizer side.
 *
 * Holds the list of links minted for one event and the four things the manage
 * screen does to them: fetch, mint, revoke, delete. Kept out of the guest
 * management store deliberately — that store is the guest *list*, and a share
 * link is a fact about who may reach it, loaded only when the Share panel opens.
 */

import { computed, ref } from 'vue'
import { guestListShareService } from '@/services/api'
import type {
  CreateGuestListShareRequest,
  GuestListShare,
  GuestShareAccess,
} from '@/services/api'

/** Presets the mint form offers instead of a date picker. */
export type ShareExpiryPreset = 'never' | '7d' | '30d'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * A preset to an absolute ISO timestamp.
 *
 * Resolved on the client and sent as a date, not as "7 days": the organizer's
 * intent is a moment, and a duration would silently re-start if the backend
 * ever re-saved the row.
 */
export function resolveExpiry(preset: ShareExpiryPreset): string | null {
  if (preset === 'never') return null
  const days = preset === '7d' ? 7 : 30
  return new Date(Date.now() + days * DAY_MS).toISOString()
}

export function useGuestListShares(eventId: string) {
  const shares = ref<GuestListShare[]>([])
  const loading = ref(false)
  const creating = ref(false)
  /** Id of the share a revoke/delete is in flight for, so one row can spin. */
  const busyShareId = ref<number | null>(null)
  const errorMessage = ref('')
  const hasLoaded = ref(false)

  /**
   * Live links first, then the dead ones. Both are shown: a revoked row is the
   * only record that a link was ever handed out, and the organizer's real
   * question after revoking is "is it definitely off now?".
   */
  const activeShares = computed(() => shares.value.filter((s) => s.is_usable))
  const inactiveShares = computed(() => shares.value.filter((s) => !s.is_usable))

  async function loadShares() {
    loading.value = true
    errorMessage.value = ''
    try {
      const response = await guestListShareService.listShares(eventId)
      if (response.success && response.data) {
        const raw = response.data
        shares.value = Array.isArray(raw) ? raw : (raw.results ?? [])
        hasLoaded.value = true
      } else {
        errorMessage.value = response.message || ''
      }
      return response
    } finally {
      loading.value = false
    }
  }

  async function createShare(data: CreateGuestListShareRequest) {
    creating.value = true
    errorMessage.value = ''
    try {
      const response = await guestListShareService.createShare(eventId, data)
      if (response.success && response.data) {
        shares.value = [response.data, ...shares.value]
      } else {
        errorMessage.value = response.message || ''
      }
      return response
    } finally {
      creating.value = false
    }
  }

  /**
   * Turn a link off without losing it. The row stays, so the audit trail —
   * who it was labelled for, how many times it was opened — survives.
   */
  async function revokeShare(shareId: number) {
    busyShareId.value = shareId
    try {
      const response = await guestListShareService.updateShare(eventId, shareId, {
        is_active: false,
      })
      if (response.success && response.data) {
        const index = shares.value.findIndex((s) => s.id === shareId)
        if (index !== -1) shares.value[index] = response.data
      }
      return response
    } finally {
      busyShareId.value = null
    }
  }

  async function updateAccess(shareId: number, access: GuestShareAccess) {
    busyShareId.value = shareId
    try {
      const response = await guestListShareService.updateShare(eventId, shareId, { access })
      if (response.success && response.data) {
        const index = shares.value.findIndex((s) => s.id === shareId)
        if (index !== -1) shares.value[index] = response.data
      }
      return response
    } finally {
      busyShareId.value = null
    }
  }

  async function deleteShare(shareId: number) {
    busyShareId.value = shareId
    try {
      const response = await guestListShareService.deleteShare(eventId, shareId)
      if (response.success) {
        shares.value = shares.value.filter((s) => s.id !== shareId)
      }
      return response
    } finally {
      busyShareId.value = null
    }
  }

  return {
    shares,
    activeShares,
    inactiveShares,
    loading,
    creating,
    busyShareId,
    errorMessage,
    hasLoaded,
    loadShares,
    createShare,
    revokeShare,
    updateAccess,
    deleteShare,
  }
}
