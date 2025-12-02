/**
 * Collaborator Invitations API Service
 * Handles collaborator invitation validation and acceptance
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  CollaboratorInvitationData,
  AcceptInvitationResponse,
} from '../types'

export const invitationsService = {
  /**
   * Validate an invitation token
   * This is a public endpoint - no authentication required
   *
   * @param token - The invitation token from the URL
   * @returns Promise resolving to invitation data with validation status, event details, and inviter info
   */
  async validateInvitation(token: string): Promise<ApiResponse<CollaboratorInvitationData>> {
    return apiClient.getPublic<CollaboratorInvitationData>(
      `/api/events/collaborator-invitations/${token}/validate/`
    )
  },

  /**
   * Accept an invitation
   * Requires authentication - the authenticated user will be linked as collaborator
   *
   * @param token - The invitation token from the URL
   * @returns Promise resolving to acceptance confirmation with event ID and assigned role
   */
  async acceptInvitation(token: string): Promise<ApiResponse<AcceptInvitationResponse>> {
    return apiClient.post<AcceptInvitationResponse>(
      `/api/events/collaborator-invitations/${token}/accept/`,
      {}
    )
  },
}
