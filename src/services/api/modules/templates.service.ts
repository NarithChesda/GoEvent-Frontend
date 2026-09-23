/**
 * Event Templates API Service
 * Handles event template browsing and selection
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  QueryParams,
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
  'open_envelope_button', 'host_divider_image', 'cover_host_separator_image',
]

/**
 * Every JSON config block a partner template carries, for exactly the reason
 * TEMPLATE_FILE_FIELDS exists: create and update must agree on it, and when the
 * list was written out by hand in both methods there was nothing making them.
 * A config added to one and forgotten in the other saves on a new template and
 * silently does nothing on every edit of an existing one — the same failure the
 * three dropped logo uploads above were.
 *
 * `undefined` means the caller isn't touching this config, so it is left alone.
 * Every other value — including `null`, which is how a config is switched off —
 * is serialized and sent.
 */
const TEMPLATE_JSON_CONFIG_FIELDS = [
  'cover_stage_layout',
  'falling_effect',
  'ambient_creatures',
  'sparks',
  'event_details_design',
  'host_info_design',
  'info_card_design',
  'agenda_design',
  'dress_code_design',
  'save_the_date_design',
  'text_effects',
  'stage_modes',
] as const satisfies ReadonlyArray<keyof PartnerTemplateCreatePayload>

/**
 * The config-owned images, which are neither normal file fields nor JSON: they
 * live inside a config block on the server but travel as their own multipart
 * part. Same three states as TEMPLATE_FILE_FIELDS.
 */
const TEMPLATE_CONFIG_IMAGE_FIELDS = [
  'falling_effect_custom_image',
  'spark_custom_image',
] as const satisfies ReadonlyArray<keyof PartnerTemplateCreatePayload>

/**
 * Everything create and update append identically: the files, the JSON configs
 * and the config-owned images. Only the four scalar fields above differ between
 * them (create requires a name, update patches whatever it was given), so those
 * stay with their own method.
 */
function appendTemplateAssetsAndConfigs(
  formData: FormData,
  payload: Partial<PartnerTemplateCreatePayload>,
): void {
  for (const field of TEMPLATE_FILE_FIELDS) {
    const file = payload[field]
    if (file instanceof File) {
      formData.append(field, file)
    } else if (file === '') {
      // Explicit removal — see TEMPLATE_FILE_FIELDS.
      formData.append(field, '')
    }
  }
  for (const field of TEMPLATE_JSON_CONFIG_FIELDS) {
    const config = payload[field]
    if (config !== undefined) {
      formData.append(field, JSON.stringify(config))
    }
  }
  for (const field of TEMPLATE_CONFIG_IMAGE_FIELDS) {
    const image = payload[field]
    if (image instanceof File) {
      formData.append(field, image)
    } else if (image === '') {
      formData.append(field, '')
    }
  }
}

/** How many pages `listEditableTemplates` will walk before giving up.
 *  A guard against a server that keeps answering with a `next`, not a real
 *  ceiling — at PAGE_SIZE 20 this is 1000 templates. */
const TEMPLATE_PAGE_LIMIT = 50

// Partner template editor service. Reaching it needs `is_partner` OR
// `is_staff` — the backend gate is `IsPartnerOrStaff`. What the caller gets
// back differs by role: a partner sees only templates they created, staff see
// the whole catalogue (every system template and every partner's work,
// drafts included), and creating one stamps `system`/`approved` for staff
// against `partner`/`draft` for a partner. No endpoint differs.
export const partnerTemplateService = {
  // One page of the templates this account may edit.
  async listMyTemplates(
    params?: QueryParams,
  ): Promise<ApiResponse<PaginatedResponse<PartnerTemplate> | PartnerTemplate[]>> {
    return apiClient.get<PaginatedResponse<PartnerTemplate> | PartnerTemplate[]>(
      '/api/core-data/partner-templates/',
      params,
    )
  },

  /**
   * Every template this account may edit, pages followed to the end.
   *
   * The list endpoint is paginated at PAGE_SIZE 20. That was invisible while
   * every caller was a partner with a handful of drafts, but staff receive the
   * entire catalogue — so reading `results` once shows the first 20 with no
   * signal that the rest exist. Paged by number rather than by following
   * `next` verbatim: `next` is an absolute URL built from the server's own
   * host, which need not match the configured API base (and `apiClient` takes
   * paths, not URLs).
   */
  async listEditableTemplates(): Promise<ApiResponse<PartnerTemplate[]>> {
    const all: PartnerTemplate[] = []
    for (let page = 1; page <= TEMPLATE_PAGE_LIMIT; page++) {
      const response = await this.listMyTemplates(page === 1 ? undefined : { page })
      if (!response.success || !response.data) {
        // A later page failing is still worth surfacing — a partial catalogue
        // silently missing its tail is the bug this method exists to fix.
        return { success: false, message: response.message, status: response.status }
      }
      const body = response.data
      // A server that answers with a bare array has no pages to follow.
      if (Array.isArray(body)) {
        all.push(...body)
        break
      }
      all.push(...body.results)
      if (!body.next) break
    }
    return { success: true, data: all }
  },

  // Get a single partner template
  async getTemplate(templateId: number): Promise<ApiResponse<PartnerTemplate>> {
    return apiClient.get<PartnerTemplate>(`/api/core-data/partner-templates/${templateId}/`)
  },

  // Create a new partner template (draft status)
  async createTemplate(payload: PartnerTemplateCreatePayload): Promise<ApiResponse<PartnerTemplate>> {
    const formData = new FormData()
    formData.append('name', payload.name)
    // Menu position. `0` is a legitimate value — the top of the menu — so this
    // tests for null/undefined rather than falsiness.
    if (payload.order != null) {
      formData.append('order', String(payload.order))
    }
    if (payload.package_plan_id != null) {
      formData.append('package_plan_id', String(payload.package_plan_id))
    }
    if (payload.display_liquid_glass_background != null) {
      formData.append('display_liquid_glass_background', String(payload.display_liquid_glass_background))
    }
    if (payload.youtube_preview_url) {
      formData.append('youtube_preview_url', payload.youtube_preview_url)
    }
    appendTemplateAssetsAndConfigs(formData, payload)
    return apiClient.postFormData<PartnerTemplate>('/api/core-data/partner-templates/', formData)
  },

  // Update a partner template
  async updateTemplate(
    templateId: number,
    payload: Partial<PartnerTemplateCreatePayload>,
  ): Promise<ApiResponse<PartnerTemplate>> {
    const formData = new FormData()
    if (payload.name) formData.append('name', payload.name)
    // Menu position. `0` is a legitimate value — the top of the menu — so this
    // tests for null/undefined rather than falsiness.
    if (payload.order != null) {
      formData.append('order', String(payload.order))
    }
    if (payload.package_plan_id != null) {
      formData.append('package_plan_id', String(payload.package_plan_id))
    }
    if (payload.display_liquid_glass_background != null) {
      formData.append('display_liquid_glass_background', String(payload.display_liquid_glass_background))
    }
    if (payload.youtube_preview_url !== undefined) {
      formData.append('youtube_preview_url', payload.youtube_preview_url)
    }
    appendTemplateAssetsAndConfigs(formData, payload)
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
