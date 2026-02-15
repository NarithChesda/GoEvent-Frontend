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
  PackagePlan,
  PartnerTemplate,
  PartnerTemplateCreatePayload,
  SubmitForReviewResponse,
  Event,
  EventTemplateColor,
  EventTemplateLanguageFont,
  CreateTemplateColorPayload,
  UpdateTemplateColorPayload,
  CreateTemplateFontPayload,
  UpdateTemplateFontPayload,
  CustomFont,
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

// Package plan service
export const packagePlanService = {
  async listPlans(): Promise<ApiResponse<PackagePlan[]>> {
    return apiClient.get<PackagePlan[]>('/api/core-data/pricing-plans/')
  },
}

// Partner template service (requires is_partner=true)
export const partnerTemplateService = {
  // List the authenticated partner's own templates
  async listMyTemplates(): Promise<ApiResponse<PartnerTemplate[]>> {
    return apiClient.get<PartnerTemplate[]>('/api/core-data/partner-templates/')
  },

  // Get a single partner template
  async getTemplate(templateId: number): Promise<ApiResponse<PartnerTemplate>> {
    return apiClient.get<PartnerTemplate>(`/api/core-data/partner-templates/${templateId}/`)
  },

  // Create a new partner template (draft status)
  async createTemplate(payload: PartnerTemplateCreatePayload): Promise<ApiResponse<PartnerTemplate>> {
    const formData = new FormData()
    formData.append('name', payload.name)
    if (payload.package_plan_id != null) {
      formData.append('package_plan_id', String(payload.package_plan_id))
    }
    if (payload.display_liquid_glass_background != null) {
      formData.append('display_liquid_glass_background', String(payload.display_liquid_glass_background))
    }
    if (payload.youtube_preview_url) {
      formData.append('youtube_preview_url', payload.youtube_preview_url)
    }
    const fileFields: Array<keyof PartnerTemplateCreatePayload> = [
      'preview_image', 'basic_background_photo', 'basic_decoration_photo',
      'top_decoration', 'bottom_decoration',
      'left_decoration', 'right_decoration', 'cover_top_decoration',
      'cover_bottom_decoration', 'cover_left_decoration', 'cover_right_decoration',
      'guest_title_frame_left', 'guest_title_frame_mid', 'guest_title_frame_right',
      'standard_cover_video', 'standard_background_video',
      'open_envelope_button',
    ]
    for (const field of fileFields) {
      const file = payload[field]
      if (file instanceof File) {
        formData.append(field, file)
      }
    }
    if (payload.cover_stage_layout) {
      formData.append('cover_stage_layout', JSON.stringify(payload.cover_stage_layout))
    }
    return apiClient.postFormData<PartnerTemplate>('/api/core-data/partner-templates/', formData)
  },

  // Update a partner template
  async updateTemplate(
    templateId: number,
    payload: Partial<PartnerTemplateCreatePayload>,
  ): Promise<ApiResponse<PartnerTemplate>> {
    const formData = new FormData()
    if (payload.name) formData.append('name', payload.name)
    if (payload.package_plan_id != null) {
      formData.append('package_plan_id', String(payload.package_plan_id))
    }
    if (payload.display_liquid_glass_background != null) {
      formData.append('display_liquid_glass_background', String(payload.display_liquid_glass_background))
    }
    if (payload.youtube_preview_url !== undefined) {
      formData.append('youtube_preview_url', payload.youtube_preview_url)
    }
    const fileFields: Array<keyof PartnerTemplateCreatePayload> = [
      'preview_image', 'basic_background_photo', 'basic_decoration_photo',
      'top_decoration', 'bottom_decoration',
      'left_decoration', 'right_decoration', 'cover_top_decoration',
      'cover_bottom_decoration', 'cover_left_decoration', 'cover_right_decoration',
      'guest_title_frame_left', 'guest_title_frame_mid', 'guest_title_frame_right',
      'standard_cover_video', 'standard_background_video',
      'open_envelope_button',
    ]
    for (const field of fileFields) {
      const file = payload[field]
      if (file instanceof File) {
        formData.append(field, file)
      }
    }
    if (payload.cover_stage_layout) {
      formData.append('cover_stage_layout', JSON.stringify(payload.cover_stage_layout))
    }
    return apiClient.patchFormData<PartnerTemplate>(
      `/api/core-data/partner-templates/${templateId}/`,
      formData,
    )
  },

  // Delete a partner template
  async deleteTemplate(templateId: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/core-data/partner-templates/${templateId}/`)
  },

  // Submit template for admin review
  async submitForReview(templateId: number): Promise<ApiResponse<SubmitForReviewResponse>> {
    return apiClient.post<SubmitForReviewResponse>(
      `/api/core-data/partner-templates/${templateId}/submit-for-review/`,
      {},
    )
  },

  // --- Template Colors CRUD ---
  async listColors(templateId: number): Promise<ApiResponse<EventTemplateColor[]>> {
    return apiClient.get<EventTemplateColor[]>(
      `/api/core-data/partner-templates/${templateId}/colors/`,
    )
  },

  async createColor(
    templateId: number,
    payload: CreateTemplateColorPayload,
  ): Promise<ApiResponse<EventTemplateColor>> {
    return apiClient.post<EventTemplateColor>(
      `/api/core-data/partner-templates/${templateId}/colors/`,
      { ...payload, event_template: templateId },
    )
  },

  async updateColor(
    templateId: number,
    colorId: number,
    payload: UpdateTemplateColorPayload,
  ): Promise<ApiResponse<EventTemplateColor>> {
    return apiClient.patch<EventTemplateColor>(
      `/api/core-data/partner-templates/${templateId}/colors/${colorId}/`,
      payload,
    )
  },

  async deleteColor(templateId: number, colorId: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(
      `/api/core-data/partner-templates/${templateId}/colors/${colorId}/`,
    )
  },

  // --- Template Fonts CRUD ---
  async listFonts(templateId: number): Promise<ApiResponse<EventTemplateLanguageFont[]>> {
    return apiClient.get<EventTemplateLanguageFont[]>(
      `/api/core-data/partner-templates/${templateId}/fonts/`,
    )
  },

  async createFont(
    templateId: number,
    payload: CreateTemplateFontPayload,
  ): Promise<ApiResponse<EventTemplateLanguageFont>> {
    return apiClient.post<EventTemplateLanguageFont>(
      `/api/core-data/partner-templates/${templateId}/fonts/`,
      { ...payload, event_template: templateId },
    )
  },

  async updateFont(
    templateId: number,
    fontId: number,
    payload: UpdateTemplateFontPayload,
  ): Promise<ApiResponse<EventTemplateLanguageFont>> {
    return apiClient.patch<EventTemplateLanguageFont>(
      `/api/core-data/partner-templates/${templateId}/fonts/${fontId}/`,
      payload,
    )
  },

  async deleteFont(templateId: number, fontId: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(
      `/api/core-data/partner-templates/${templateId}/fonts/${fontId}/`,
    )
  },
}

// Custom fonts service (core data endpoint)
export const customFontsService = {
  async listFonts(): Promise<ApiResponse<CustomFont[]>> {
    return apiClient.get<CustomFont[]>('/api/core-data/custom-fonts/')
  },
}
