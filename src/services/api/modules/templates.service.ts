/**
 * Event Templates API Service
 * Handles event template browsing and selection
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  EventTemplate,
  PublicEventTemplate,
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
  CustomFontQuery,
  CreateCustomFontPayload,
  UpdateCustomFontPayload,
} from '../types'

export const eventTemplateService = {
  // Browse available templates (requires auth)
  async browseTemplates(): Promise<ApiResponse<BrowseTemplatesResponse>> {
    return apiClient.get<BrowseTemplatesResponse>(
      '/api/core-data/event-templates/browse_templates/',
    )
  },

  /**
   * The approved template catalogue, without auth.
   *
   * `browse_templates/` above is the signed-in organizer's list and answers 401
   * to everyone else; this is the plain list endpoint, which is public. Used by
   * the partner programme page, whose whole audience is people with no account
   * yet. The rows are the template records themselves — colours and fonts are
   * NOT included, so anything rendering one still fetches
   * `getPublicTemplateAssets` for it.
   */
  async listPublicTemplates(
    params?: { page?: number },
  ): Promise<ApiResponse<PaginatedResponse<PublicEventTemplate>>> {
    return apiClient.getPublic<PaginatedResponse<PublicEventTemplate>>(
      '/api/core-data/event-templates/',
      params?.page ? { page: params.page } : undefined,
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

/**
 * Every file field a partner template carries, in one place because create and
 * update must agree on it — they didn't: `sample_logo_1`, `sample_logo_2` and
 * `header_text_image` were declared on the payload type and set by the form,
 * but missing from both loops, so those three uploads were silently dropped on
 * the floor and never reached the server.
 *
 * A `File` uploads. An empty string is the explicit "delete what's stored"
 * instruction (Django clears a FileField on a blank value). Anything absent is
 * left untouched — which is what makes "I didn't edit this" different from
 * "remove this".
 */
const TEMPLATE_FILE_FIELDS: Array<keyof PartnerTemplateCreatePayload> = [
  'preview_image', 'basic_background_photo', 'basic_decoration_photo',
  'top_decoration', 'bottom_decoration',
  'left_decoration', 'right_decoration', 'cover_top_decoration',
  'cover_bottom_decoration', 'cover_left_decoration', 'cover_right_decoration',
  'guest_title_frame_left', 'guest_title_frame_mid', 'guest_title_frame_right',
  'standard_cover_video', 'standard_transition_video', 'standard_background_video',
  'sample_logo_1', 'sample_logo_2', 'header_text_image',
  'open_envelope_button',
]

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
    for (const field of TEMPLATE_FILE_FIELDS) {
      const file = payload[field]
      if (file instanceof File) {
        formData.append(field, file)
      } else if (file === '') {
        // Explicit removal — see TEMPLATE_FILE_FIELDS.
        formData.append(field, '')
      }
    }
    if (payload.cover_stage_layout) {
      formData.append('cover_stage_layout', JSON.stringify(payload.cover_stage_layout))
    }
    if (payload.falling_effect !== undefined) {
      formData.append('falling_effect', JSON.stringify(payload.falling_effect))
    }
    if (payload.ambient_creatures !== undefined) {
      formData.append('ambient_creatures', JSON.stringify(payload.ambient_creatures))
    }
    if (payload.sparks !== undefined) {
      formData.append('sparks', JSON.stringify(payload.sparks))
    }
    if (payload.event_details_design !== undefined) {
      formData.append('event_details_design', JSON.stringify(payload.event_details_design))
    }
    if (payload.host_info_design !== undefined) {
      formData.append('host_info_design', JSON.stringify(payload.host_info_design))
    }
    if (payload.info_card_design !== undefined) {
      formData.append('info_card_design', JSON.stringify(payload.info_card_design))
    }
    if (payload.save_the_date_design !== undefined) {
      formData.append('save_the_date_design', JSON.stringify(payload.save_the_date_design))
    }
    if (payload.stage_modes !== undefined) {
      formData.append('stage_modes', JSON.stringify(payload.stage_modes))
    }
    if (payload.falling_effect_custom_image instanceof File) {
      formData.append('falling_effect_custom_image', payload.falling_effect_custom_image)
    } else if (payload.falling_effect_custom_image === '') {
      formData.append('falling_effect_custom_image', '')
    }
    if (payload.spark_custom_image instanceof File) {
      formData.append('spark_custom_image', payload.spark_custom_image)
    } else if (payload.spark_custom_image === '') {
      formData.append('spark_custom_image', '')
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
    for (const field of TEMPLATE_FILE_FIELDS) {
      const file = payload[field]
      if (file instanceof File) {
        formData.append(field, file)
      } else if (file === '') {
        // Explicit removal — see TEMPLATE_FILE_FIELDS.
        formData.append(field, '')
      }
    }
    if (payload.cover_stage_layout) {
      formData.append('cover_stage_layout', JSON.stringify(payload.cover_stage_layout))
    }
    if (payload.falling_effect !== undefined) {
      formData.append('falling_effect', JSON.stringify(payload.falling_effect))
    }
    if (payload.ambient_creatures !== undefined) {
      formData.append('ambient_creatures', JSON.stringify(payload.ambient_creatures))
    }
    if (payload.sparks !== undefined) {
      formData.append('sparks', JSON.stringify(payload.sparks))
    }
    if (payload.event_details_design !== undefined) {
      formData.append('event_details_design', JSON.stringify(payload.event_details_design))
    }
    if (payload.host_info_design !== undefined) {
      formData.append('host_info_design', JSON.stringify(payload.host_info_design))
    }
    if (payload.info_card_design !== undefined) {
      formData.append('info_card_design', JSON.stringify(payload.info_card_design))
    }
    if (payload.save_the_date_design !== undefined) {
      formData.append('save_the_date_design', JSON.stringify(payload.save_the_date_design))
    }
    if (payload.stage_modes !== undefined) {
      formData.append('stage_modes', JSON.stringify(payload.stage_modes))
    }
    if (payload.falling_effect_custom_image instanceof File) {
      formData.append('falling_effect_custom_image', payload.falling_effect_custom_image)
    } else if (payload.falling_effect_custom_image === '') {
      formData.append('falling_effect_custom_image', '')
    }
    if (payload.spark_custom_image instanceof File) {
      formData.append('spark_custom_image', payload.spark_custom_image)
    } else if (payload.spark_custom_image === '') {
      formData.append('spark_custom_image', '')
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

/**
 * The shared font library.
 *
 * One list holds both staff-curated `system` fonts and partner uploads, and the
 * API scopes the read to the caller: anonymous and ordinary users see the active
 * system fonts, a partner also sees their own uploads, staff see everything. So
 * there is no "my fonts" endpoint to call separately — `listFonts()` already
 * returns the right set, and `source` / `mine` only narrow it further.
 *
 * Write access is narrower than read access: a partner may only modify fonts they
 * uploaded. A system font answers `403` and another partner's font answers `404`,
 * since it was never in their library to begin with.
 */
export const customFontsService = {
  async listFonts(params?: CustomFontQuery): Promise<ApiResponse<CustomFont[]>> {
    return apiClient.get<CustomFont[]>('/api/core-data/custom-fonts/', {
      ...(params?.source ? { source: params.source } : {}),
      // Only sent when true — the endpoint reads the parameter's presence, and
      // `mine=false` would be a string the server has no reason to interpret.
      ...(params?.mine ? { mine: 'true' } : {}),
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.ordering ? { ordering: params.ordering } : {}),
    })
  },

  /**
   * Uploads a font file to the library.
   *
   * Multipart, always. The server stamps `source` and `created_by` from the
   * caller's account, so a partner's upload becomes a partner font visible only
   * to them, and there is nothing the client can send to change that.
   */
  async uploadFont(payload: CreateCustomFontPayload): Promise<ApiResponse<CustomFont>> {
    const formData = new FormData()
    formData.append('name', payload.name)
    formData.append('font_file', payload.font_file)
    if (payload.license_note !== undefined) {
      formData.append('license_note', payload.license_note)
    }
    if (payload.is_active !== undefined) {
      formData.append('is_active', String(payload.is_active))
    }
    return apiClient.postFormData<CustomFont>('/api/core-data/custom-fonts/', formData)
  },

  /**
   * Edits a font the caller uploaded.
   *
   * Sent as multipart only when the file itself is being replaced; a rename or a
   * licence-note edit goes as JSON so an omitted `font_file` unambiguously means
   * "leave the stored file alone" rather than "an empty file field".
   */
  async updateFont(
    fontId: number,
    payload: UpdateCustomFontPayload,
  ): Promise<ApiResponse<CustomFont>> {
    const endpoint = `/api/core-data/custom-fonts/${fontId}/`

    if (payload.font_file) {
      const formData = new FormData()
      formData.append('font_file', payload.font_file)
      if (payload.name !== undefined) formData.append('name', payload.name)
      if (payload.license_note !== undefined) formData.append('license_note', payload.license_note)
      if (payload.is_active !== undefined) formData.append('is_active', String(payload.is_active))
      return apiClient.patchFormData<CustomFont>(endpoint, formData)
    }

    const { font_file: _file, ...rest } = payload
    return apiClient.patch<CustomFont>(endpoint, rest)
  },

  /**
   * Permanently removes a font the caller uploaded, file included.
   *
   * Templates still pointing at it are not blocked or cascaded away — their font
   * row survives with `font` set to `null`, which the showcase reads as "use the
   * system default for this language". So a delete degrades a template's type
   * rather than breaking it, and the row stays there to be reassigned.
   */
  async deleteFont(fontId: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/core-data/custom-fonts/${fontId}/`)
  },
}
