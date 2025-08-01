// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T = any> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

class ApiService {
  private baseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
  }

  // Utility method to get full URL for profile pictures
  getProfilePictureUrl(profilePictureUrl: string | null | undefined): string | null {
    if (!profilePictureUrl) return null
    
    // If it's already a full URL (starts with http/https), return as is
    if (profilePictureUrl.startsWith('http://') || profilePictureUrl.startsWith('https://')) {
      return profilePictureUrl
    }
    
    // If it's a relative URL, prepend the API base URL
    if (profilePictureUrl.startsWith('/')) {
      return `${this.baseURL}${profilePictureUrl}`
    }
    
    // If it doesn't start with /, assume it needs /media/ prefix
    return `${this.baseURL}/media/${profilePictureUrl}`
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')
    
    try {
      const data = isJson ? await response.json() : await response.text()
      
      if (!response.ok) {
        // Handle different HTTP status codes
        let message = 'An error occurred'
        
        switch (response.status) {
          case 400:
            console.error('400 Bad Request - Full error response:', data)
            // Try to extract detailed validation errors
            if (data.translations && Array.isArray(data.translations)) {
              console.error('Translation validation errors:', data.translations)
            }
            if (typeof data === 'object' && data !== null) {
              console.error('All validation errors:', Object.keys(data).map(key => `${key}: ${JSON.stringify(data[key])}`))
            }
            message = data.detail || data.message || 'Invalid request data'
            break
          case 401:
            message = 'Authentication required'
            break
          case 403:
            message = 'You do not have permission to perform this action'
            break
          case 404:
            message = 'Resource not found'
            break
          case 409:
            message = data.detail || data.message || 'Conflict with existing data'
            break
          case 422:
            message = 'Validation failed'
            break
          case 500:
            message = 'Server error. Please try again later'
            break
          default:
            message = data.detail || data.message || `HTTP ${response.status} error`
        }
        
        return {
          success: false,
          message,
          errors: data.errors || (isJson ? data : undefined)
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        message: 'Network error or invalid response format'
      }
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        }
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        message: 'Network error'
      }
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: data ? JSON.stringify(data) : undefined
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        message: 'Network error'
      }
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: data ? JSON.stringify(data) : undefined
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        message: 'Network error'
      }
    }
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const isFormData = data instanceof FormData
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          // Don't set Content-Type for FormData, let the browser handle it
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...this.getAuthHeaders()
        },
        body: data ? (isFormData ? data : JSON.stringify(data)) : undefined
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        message: 'Network error'
      }
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        }
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      return {
        success: false,
        message: 'Network error'
      }
    }
  }
}

export const apiService = new ApiService()

// Team Member Types
export interface TeamMember {
  id: number
  name: string
  role: string
  bio: string
  profile_picture: string | null
  email: string
  linkedin_url: string
  twitter_url: string
  github_url: string
  order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Team Members API Service
export const teamMembersService = {
  async getTeamMembers(): Promise<ApiResponse<PaginatedResponse<TeamMember>>> {
    return apiService.get<PaginatedResponse<TeamMember>>('/api/core-data/team-members/')
  },

  async getTeamMember(id: number): Promise<ApiResponse<TeamMember>> {
    return apiService.get<TeamMember>(`/api/core-data/team-members/${id}/`)
  }
}

// Event Types and Interfaces
export interface EventCategory {
  id: number
  name: string
  color: string
  icon: string
  description: string
  is_active: boolean
}

export interface Event {
  id: string
  title: string
  slug?: string
  description: string
  short_description: string
  start_date: string
  end_date: string
  timezone?: string
  location: string | null
  virtual_link: string | null
  is_virtual: boolean
  privacy: 'public' | 'private'
  status: 'draft' | 'published' | 'cancelled' | 'completed'
  organizer: number
  organizer_name?: string
  organizer_email?: string
  organizer_details?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    profile_picture: string | null
  }
  category: number | null
  category_name?: string | null
  category_color?: string | null
  category_details?: {
    id: number
    name: string
    description: string
    color: string
    icon: string
  }
  max_attendees: number | null
  registration_required?: boolean
  registration_deadline?: string | null
  banner_image: string | null
  logo_one?: string | null
  logo_two?: string | null
  event_video?: string | null
  google_map_embed_link?: string | null
  youtube_embed_link?: string | null
  event_template?: number | null
  event_template_enabled?: boolean
  collaborators_count: number
  registrations_count: number
  is_ongoing: boolean
  is_upcoming: boolean
  is_past: boolean
  can_edit?: boolean
  can_delete?: boolean
  is_registered?: boolean
  created_at: string
  updated_at: string
  // Additional fields from detailed event response
  hosts?: EventHost[]
  agenda_items?: EventAgendaItem[]
  photos?: EventPhoto[]
  collaborators_details?: EventCollaborator[]
  registrations_details?: EventRegistrationDetail[]
}

export interface HostTranslation {
  id?: number
  host?: number
  language: string
  name: string
  parent_a_name: string
  parent_b_name: string
  title: string
  bio: string
  created_at?: string
  updated_at?: string
}

export interface EventHost {
  id: number
  name: string
  parent_a_name: string
  parent_b_name: string
  title: string
  bio: string
  profile_image: string | null
  email: string
  linkedin_url: string
  twitter_url: string
  website_url: string
  order: number
  translations: HostTranslation[]
}

export interface CreateHostRequest {
  name: string
  parent_a_name?: string
  parent_b_name?: string
  title?: string
  bio?: string
  email?: string
  linkedin_url?: string
  twitter_url?: string
  website_url?: string
  order?: number
  translations?: Omit<HostTranslation, 'id' | 'host' | 'created_at' | 'updated_at'>[]
}

export interface BulkReorderHostsRequest {
  updates: { id: number; order: number }[]
}

export interface AgendaTranslation {
  id?: number
  agenda?: number
  language: string
  title: string
  description: string
  date_text: string
  start_time_text: string
  end_time_text: string
  speaker: string
  created_at?: string
  updated_at?: string
}

export interface EventAgendaItem {
  id: number
  title: string
  description: string
  agenda_type: 'session' | 'break' | 'networking' | 'keynote' | 'workshop' | 'panel' | 'other'
  date: string | null
  date_text: string
  start_time_text: string
  end_time_text: string
  speaker: string
  location: string
  virtual_link: string
  order: number
  is_featured: boolean
  color: string
  translations: AgendaTranslation[]
}

export interface CreateAgendaRequest {
  title: string
  description?: string
  agenda_type: 'session' | 'break' | 'networking' | 'keynote' | 'workshop' | 'panel' | 'other'
  date?: string | null
  date_text?: string
  start_time_text?: string
  end_time_text?: string
  speaker?: string
  location?: string
  virtual_link?: string
  order?: number
  is_featured?: boolean
  color?: string
  translations?: Omit<AgendaTranslation, 'id' | 'agenda' | 'created_at' | 'updated_at'>[]
}

export interface BulkReorderRequest {
  updates: { id: number; order: number }[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface EventRegistrationDetail {
  id: number
  user: number
  user_details: {
    id: number
    username: string
    email: string
    first_name?: string
    last_name?: string
  }
  status: string
  guest_count: number
  total_attendees: number
  confirmation_code: string
}

export interface EventFilters {
  search?: string
  category?: number | string
  organizer?: number | string
  start_date_after?: string
  start_date_before?: string
  is_virtual?: boolean
  status?: string
  privacy?: string
  ordering?: string
  is_registered?: boolean
  page?: number
}

export interface EventRegistration {
  id: number
  event: string
  user: number
  guest_count: number
  registered_at: string
  notes: string
}

export interface MyEventsResponse {
  organized: Event[]
  collaborated: Event[]
}

// Events API Service - Updated to match API documentation
export const eventsService = {
  // Get all events (public) with optional filters
  async getEvents(filters?: EventFilters): Promise<ApiResponse<PaginatedResponse<Event>>> {
    return apiService.get<PaginatedResponse<Event>>('/api/events/', filters)
  },

  // Get single event by ID
  async getEvent(id: string): Promise<ApiResponse<Event>> {
    return apiService.get<Event>(`/api/events/${id}/`)
  },

  // Create new event
  async createEvent(data: Partial<Event>): Promise<ApiResponse<Event>> {
    return apiService.post<Event>('/api/events/', data)
  },

  // Update existing event
  async updateEvent(id: string, data: Partial<Event>): Promise<ApiResponse<Event>> {
    return apiService.put<Event>(`/api/events/${id}/`, data)
  },

  // Partially update event
  async patchEvent(id: string, data: Partial<Event>): Promise<ApiResponse<Event>> {
    return apiService.patch<Event>(`/api/events/${id}/`, data)
  },

  // Update event with file uploads (multipart/form-data)
  async updateEventWithFiles(id: string, data: FormData): Promise<ApiResponse<Event>> {
    return apiService.patch<Event>(`/api/events/${id}/`, data)
  },

  // Delete event
  async deleteEvent(id: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/api/events/${id}/`)
  },

  // Get current user's events using dedicated endpoint
  // Supports pagination and filtering: page, search, category, status, ordering
  async getMyEvents(params?: { page?: number; search?: string; category?: number | string; status?: string; ordering?: string }): Promise<ApiResponse<MyEventsResponse>> {
    return apiService.get<MyEventsResponse>('/api/events/my/', params)
  },

  // Get events the current user has registered for
  async getMyRegisteredEvents(params?: EventFilters): Promise<ApiResponse<Event[]>> {
    return apiService.get<Event[]>('/api/events/my-registered/', params)
  },

  // Register for an event
  async registerForEvent(eventId: string, data: { guest_count?: number; notes?: string }): Promise<ApiResponse<EventRegistration>> {
    return apiService.post<EventRegistration>(`/api/events/${eventId}/register/`, data)
  },

  // Get event registrations (for organizers)
  async getEventRegistrations(eventId: string): Promise<ApiResponse<PaginatedResponse<EventRegistration>>> {
    return apiService.get<PaginatedResponse<EventRegistration>>(`/api/events/${eventId}/registrations/`)
  },

  // Event photos management
  async getEventPhotos(eventId: string): Promise<ApiResponse<EventPhoto[]>> {
    return apiService.get<EventPhoto[]>(`/api/events/${eventId}/photos/`)
  },

  async uploadEventPhoto(eventId: string, file: File, photoData: { caption?: string; order?: number; is_featured?: boolean }): Promise<ApiResponse<EventPhoto>> {
    const formData = new FormData()
    formData.append('image', file)
    if (photoData.caption) formData.append('caption', photoData.caption)
    if (photoData.order) formData.append('order', photoData.order.toString())
    if (photoData.is_featured !== undefined) formData.append('is_featured', photoData.is_featured.toString())

    try {
      const response = await fetch(`${apiService['baseURL']}/api/events/${eventId}/photos/`, {
        method: 'POST',
        headers: {
          ...apiService['getAuthHeaders']()
        },
        body: formData
      })

      return apiService['handleResponse']<EventPhoto>(response)
    } catch (error) {
      return {
        success: false,
        message: 'Network error'
      }
    }
  },

  // Update photo
  async updateEventPhoto(eventId: string, photoId: number, data: Partial<EventPhoto>): Promise<ApiResponse<EventPhoto>> {
    return apiService.patch<EventPhoto>(`/api/events/${eventId}/photos/${photoId}/`, data)
  },

  // Reorder photo
  async reorderEventPhoto(eventId: string, photoId: number, order: number): Promise<ApiResponse<EventPhoto>> {
    return apiService.patch<EventPhoto>(`/api/events/${eventId}/photos/${photoId}/reorder/`, { order })
  },

  // Delete photo
  async deleteEventPhoto(eventId: string, photoId: number): Promise<ApiResponse<any>> {
    return apiService.delete(`/api/events/${eventId}/photos/${photoId}/`)
  },

  // Collaboration management
  async inviteCollaborator(eventId: string, data: { user_email: string; role: 'admin' | 'editor' | 'viewer'; message?: string }): Promise<ApiResponse<any>> {
    return apiService.post(`/api/events/${eventId}/invite-collaborator/`, data)
  },

  async getCollaborators(eventId: string): Promise<ApiResponse<EventCollaborator[]>> {
    return apiService.get<EventCollaborator[]>(`/api/events/${eventId}/collaborators/`)
  },

  async acceptCollaboration(collaborationId: string): Promise<ApiResponse<any>> {
    return apiService.post(`/api/events/collaborations/${collaborationId}/accept/`)
  },

  async getCollaborationInvites(): Promise<ApiResponse<EventCollaborator[]>> {
    return apiService.get<EventCollaborator[]>('/api/events/collaboration-invites/')
  }
}

// Additional interfaces for event photos and collaboration
export interface EventPhoto {
  id: number
  event: string
  image: string
  caption: string
  order: number
  is_featured: boolean
  created_at: string
}

export interface EventCollaborator {
  id: number
  event: string
  user: number
  user_details: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
  role: 'admin' | 'editor' | 'viewer'
  invited_by: number
  invited_by_name: string
  invited_at: string
  accepted_at: string | null
  is_accepted: boolean
}

// Event Agenda API Service
export const agendaService = {
  // List all agenda items for an event
  async getAgendaItems(eventId: string): Promise<ApiResponse<PaginatedResponse<EventAgendaItem>>> {
    return apiService.get<PaginatedResponse<EventAgendaItem>>(`/api/events/${eventId}/agenda/`)
  },

  // Get a specific agenda item
  async getAgendaItem(eventId: string, agendaId: number): Promise<ApiResponse<EventAgendaItem>> {
    return apiService.get<EventAgendaItem>(`/api/events/${eventId}/agenda/${agendaId}/`)
  },

  // Create a new agenda item
  async createAgendaItem(eventId: string, data: CreateAgendaRequest): Promise<ApiResponse<EventAgendaItem>> {
    return apiService.post<EventAgendaItem>(`/api/events/${eventId}/agenda/`, data)
  },

  // Update an agenda item (full update)
  async updateAgendaItem(eventId: string, agendaId: number, data: Partial<CreateAgendaRequest>): Promise<ApiResponse<EventAgendaItem>> {
    return apiService.put<EventAgendaItem>(`/api/events/${eventId}/agenda/${agendaId}/`, data)
  },

  // Partially update an agenda item
  async patchAgendaItem(eventId: string, agendaId: number, data: Partial<CreateAgendaRequest>): Promise<ApiResponse<EventAgendaItem>> {
    return apiService.patch<EventAgendaItem>(`/api/events/${eventId}/agenda/${agendaId}/`, data)
  },

  // Delete an agenda item
  async deleteAgendaItem(eventId: string, agendaId: number): Promise<ApiResponse<void>> {
    return apiService.delete(`/api/events/${eventId}/agenda/${agendaId}/`)
  },

  // Bulk reorder agenda items
  async bulkReorderAgendaItems(eventId: string, data: BulkReorderRequest): Promise<ApiResponse<{ status: string; count: number }>> {
    return apiService.patch<{ status: string; count: number }>(`/api/events/${eventId}/agenda/bulk-reorder/`, data)
  }
}

// Event Categories API Service
export const eventCategoriesService = {
  async getCategories(): Promise<ApiResponse<PaginatedResponse<EventCategory>>> {
    return apiService.get<PaginatedResponse<EventCategory>>('/api/core-data/event-categories/')
  },

  async getCategory(id: number): Promise<ApiResponse<EventCategory>> {
    return apiService.get<EventCategory>(`/api/core-data/event-categories/${id}/`)
  }
}

// Event Text Types and Interfaces
export interface EventText {
  id: number
  text_type: string
  language: string
  title: string
  content: string
  order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateEventTextRequest {
  text_type: string
  language: string
  title?: string
  content: string
  order?: number
  is_active?: boolean
}

// Event Texts API Service
export const eventTextsService = {
  // List all texts for an event
  async getEventTexts(eventId: string): Promise<ApiResponse<PaginatedResponse<EventText>>> {
    return apiService.get<PaginatedResponse<EventText>>(`/api/events/${eventId}/texts/`)
  },

  // Get a specific text
  async getEventText(eventId: string, textId: number): Promise<ApiResponse<EventText>> {
    return apiService.get<EventText>(`/api/events/${eventId}/texts/${textId}/`)
  },

  // Create a new text
  async createEventText(eventId: string, data: CreateEventTextRequest): Promise<ApiResponse<EventText>> {
    return apiService.post<EventText>(`/api/events/${eventId}/texts/`, data)
  },

  // Update a text (full update)
  async updateEventText(eventId: string, textId: number, data: Partial<CreateEventTextRequest>): Promise<ApiResponse<EventText>> {
    return apiService.put<EventText>(`/api/events/${eventId}/texts/${textId}/`, data)
  },

  // Partially update a text
  async patchEventText(eventId: string, textId: number, data: Partial<CreateEventTextRequest>): Promise<ApiResponse<EventText>> {
    return apiService.patch<EventText>(`/api/events/${eventId}/texts/${textId}/`, data)
  },

  // Delete a text
  async deleteEventText(eventId: string, textId: number): Promise<ApiResponse<void>> {
    return apiService.delete(`/api/events/${eventId}/texts/${textId}/`)
  }
}

// Event Media API Service
export const mediaService = {
  // List all media/photos for an event
  async getEventMedia(eventId: string): Promise<ApiResponse<EventPhoto[]>> {
    return apiService.get<EventPhoto[]>(`/api/events/${eventId}/photos/`)
  },

  // Upload new media/photo
  async uploadEventMedia(eventId: string, file: File, mediaData: { caption?: string; order?: number; is_featured?: boolean }): Promise<ApiResponse<EventPhoto>> {
    const formData = new FormData()
    formData.append('image', file)
    if (mediaData.caption) formData.append('caption', mediaData.caption)
    if (mediaData.order !== undefined) formData.append('order', mediaData.order.toString())
    if (mediaData.is_featured !== undefined) formData.append('is_featured', mediaData.is_featured.toString())

    try {
      const response = await fetch(`${apiService['baseURL']}/api/events/${eventId}/photos/`, {
        method: 'POST',
        headers: {
          ...apiService['getAuthHeaders']()
        },
        body: formData
      })

      return apiService['handleResponse']<EventPhoto>(response)
    } catch (error) {
      return {
        success: false,
        message: 'Network error while uploading media'
      }
    }
  },

  // Update media/photo
  async updateEventMedia(eventId: string, mediaId: number, data: Partial<EventPhoto>): Promise<ApiResponse<EventPhoto>> {
    return apiService.patch<EventPhoto>(`/api/events/${eventId}/photos/${mediaId}/`, data)
  },

  // Delete media/photo
  async deleteEventMedia(eventId: string, mediaId: number): Promise<ApiResponse<void>> {
    return apiService.delete(`/api/events/${eventId}/photos/${mediaId}/`)
  },

  // Bulk reorder media/photos
  async bulkReorderEventMedia(eventId: string, data: { updates: { id: number; order: number }[] }): Promise<ApiResponse<{ status: string; count: number }>> {
    return apiService.patch<{ status: string; count: number }>(`/api/events/${eventId}/photos/bulk-reorder/`, data)
  }
}

// Event Hosts API Service
export const hostsService = {
  // List all hosts for an event
  async getHosts(eventId: string): Promise<ApiResponse<PaginatedResponse<EventHost>>> {
    return apiService.get<PaginatedResponse<EventHost>>(`/api/events/${eventId}/hosts/`)
  },

  // Get a specific host
  async getHost(eventId: string, hostId: number): Promise<ApiResponse<EventHost>> {
    return apiService.get<EventHost>(`/api/events/${eventId}/hosts/${hostId}/`)
  },

  // Create a new host
  async createHost(eventId: string, data: CreateHostRequest): Promise<ApiResponse<EventHost>> {
    return apiService.post<EventHost>(`/api/events/${eventId}/hosts/`, data)
  },

  // Update a host (full update)
  async updateHost(eventId: string, hostId: number, data: Partial<CreateHostRequest>): Promise<ApiResponse<EventHost>> {
    return apiService.put<EventHost>(`/api/events/${eventId}/hosts/${hostId}/`, data)
  },

  // Partially update a host
  async patchHost(eventId: string, hostId: number, data: Partial<CreateHostRequest>): Promise<ApiResponse<EventHost>> {
    return apiService.patch<EventHost>(`/api/events/${eventId}/hosts/${hostId}/`, data)
  },

  // Delete a host
  async deleteHost(eventId: string, hostId: number): Promise<ApiResponse<void>> {
    return apiService.delete(`/api/events/${eventId}/hosts/${hostId}/`)
  },

  // Bulk reorder hosts
  async bulkReorderHosts(eventId: string, data: BulkReorderHostsRequest): Promise<ApiResponse<{ status: string; count: number }>> {
    return apiService.patch<{ status: string; count: number }>(`/api/events/${eventId}/hosts/bulk-reorder/`, data)
  }
}