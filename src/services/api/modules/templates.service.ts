/**
 * Event Templates API Service
 * Handles event template browsing and selection
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  EventTemplate,
  TemplateAssets,
  BrowseTemplatesResponse,
  Event,
} from '../types'

export const eventTemplateService = {
  // Browse available templates (requires auth)
  async browseTemplates(): Promise<ApiResponse<BrowseTemplatesResponse>> {
    return apiClient.get<BrowseTemplatesResponse>(
      '/api/core-data/event-templates/browse_templates/',
    )
  },

  // Get public template assets (no auth required)
  async getPublicTemplateAssets(templateId: number): Promise<ApiResponse<TemplateAssets>> {
    return apiClient.get<TemplateAssets>(
      `/api/core-data/event-templates/${templateId}/public_template_assets/`,
    )
  },

  // Get event template info
  async getEventTemplateInfo(eventId: string): Promise<ApiResponse<EventTemplate>> {
    return apiClient.get<EventTemplate>(`/api/events/${eventId}/template_info/`)
  },

  // Select template for event
  async selectEventTemplate(eventId: string, templateId: number): Promise<ApiResponse<Event>> {
    return apiClient.patch<Event>(`/api/events/${eventId}/`, {
      event_template: templateId,
    })
  },
}
