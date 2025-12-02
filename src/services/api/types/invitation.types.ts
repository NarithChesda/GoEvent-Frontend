/**
 * Collaborator invitation type definitions
 */

/**
 * Event details included in invitation data
 */
export interface InvitationEventDetails {
  id: string
  title: string
  start_date: string
  location: string
  banner_image: string | null
}

/**
 * Inviter details included in invitation data
 */
export interface InvitationInviterDetails {
  name: string
}

/**
 * Response data from invitation validation endpoint
 */
export interface CollaboratorInvitationData {
  /** Whether the invitation is valid and can be accepted */
  valid: boolean
  /** Reason for invalid invitation */
  reason?: 'expired' | 'used' | 'not_found'
  /** Event details if invitation is valid */
  event?: InvitationEventDetails
  /** Who sent the invitation */
  invited_by?: InvitationInviterDetails
  /** Email the invitation was sent to */
  email?: string
  /** Role the user will have after accepting */
  role?: 'Admin' | 'Editor' | 'Viewer'
  /** When the invitation expires */
  expires_at?: string
}

/**
 * Response data from accepting an invitation
 */
export interface AcceptInvitationResponse {
  message: string
  event_id: string
  event_title: string
  role: string
}
