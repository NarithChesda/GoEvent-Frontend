/**
 * Shareable guest-list link types.
 *
 * A *guest-list share* is a link the organizer hands to someone who has no
 * GoEvent account — a family member collecting names, a wedding planner, the
 * shop's own staff — so they can open the guest list, copy each guest's
 * personalised invitation link, and (when the share allows it) add and correct
 * guests themselves.
 *
 * The credential is the code in the URL, exactly like the guest shortcode that
 * already authenticates RSVP and guestbook writes on a private event
 * (`?g=<shortcode>`). The difference is which side of the invitation it stands
 * on: `g=` identifies **one guest** to the showcase, a share code identifies
 * **one delegated helper** to the guest list.
 */

import type { QueryParams } from './api.types'

/**
 * What the holder of the link may do.
 *
 * Deliberately two values and not a permission matrix: the organizer's actual
 * question is "can this person change the list, or only work from it?", and a
 * third level would be a setting nobody can hold in their head while sending a
 * link from a phone.
 */
export type GuestShareAccess = 'view' | 'edit'

/** One share link, as the **organizer** sees it in the manage screen. */
export interface GuestListShare {
  id: number
  event: string
  /** Opaque URL-safe code. The credential itself — treat it as a secret. */
  code: string
  /** Full shareable URL, built by the backend (`{FRONTEND_URL}/guest-list/{code}`). */
  url: string
  access: GuestShareAccess
  access_display: string
  /** Optional human label so a list of links is readable ("Mum", "Planner"). */
  label?: string
  /** `false` once revoked. A revoked share is kept for the audit trail. */
  is_active: boolean
  /** ISO timestamp, or null for a link that never expires. */
  expires_at: string | null
  /** Server-computed: `expires_at` is in the past. */
  is_expired: boolean
  /** Server-computed: usable right now (`is_active && !is_expired`). */
  is_usable: boolean
  /** How many times the link has been opened, and when it last was. */
  access_count: number
  last_accessed_at: string | null
  created_by?: number
  created_by_details?: {
    id: number
    username: string
    email: string
    profile?: {
      full_name: string
      profile_picture: string | null
    }
  }
  created_at: string
  updated_at: string
}

export interface CreateGuestListShareRequest {
  access: GuestShareAccess
  label?: string
  /** ISO timestamp. Omit or send `null` for a link that never expires. */
  expires_at?: string | null
}

export interface UpdateGuestListShareRequest {
  access?: GuestShareAccess
  label?: string
  expires_at?: string | null
  /** Set `false` to revoke without deleting the record. */
  is_active?: boolean
}

/**
 * What the **holder** of the link is told when they open it, before any guest
 * data is fetched.
 *
 * The event block is deliberately a thin summary rather than the full event:
 * the page needs enough to say *which* event's list this is, and a share code
 * is not an entitlement to everything the organizer can see.
 */
export interface GuestShareContext {
  code: string
  access: GuestShareAccess
  event: {
    id: string
    title: string
    start_date: string
    end_date?: string | null
    location?: string | null
    banner_image?: string | null
  }
  /** Who shared it, so the recipient can tell a real link from a stray one. */
  shared_by: {
    name: string
    profile_picture?: string | null
  }
  label?: string
  expires_at: string | null
  /**
   * Derived from `access`, spelled out so a future third access level does not
   * mean re-deriving permissions in the client.
   */
  permissions: {
    can_view_guests: boolean
    can_copy_links: boolean
    can_edit_guests: boolean
    can_manage_groups: boolean
    can_import_guests: boolean
  }
}

/**
 * Why a share link did not open. The page shows a different sentence for each,
 * because the recipient's next move differs: an expired or revoked link means
 * "ask for a new one", an unknown code usually means a truncated paste.
 */
export type GuestShareErrorReason = 'not_found' | 'revoked' | 'expired' | 'network'

/** Guest filters as accepted on the share-scoped guest list endpoint. */
export interface SharedGuestListFilters extends QueryParams {
  search?: string
  group?: number
  ordering?: string
  page?: number
  page_size?: number
}
