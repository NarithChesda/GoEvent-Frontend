/**
 * Events API Service
 * Handles all event-related API operations
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  Event,
  EventFilters,
  EventRegistration,
  EventCollaborator,
  MyEventsResponse,
  EventPhoto,
} from '../types'

export const eventsService = {
  // Get all events (public) with optional filters
  async getEvents(filters?: EventFilters): Promise<ApiResponse<PaginatedResponse<Event>>> {
    return apiClient.get<PaginatedResponse<Event>>('/api/events/', filters)
  },

  // Get single event by ID
  async getEvent(id: string): Promise<ApiResponse<Event>> {
    return apiClient.get<Event>(`/api/events/${id}/`)
  },

  // Create new event
  async createEvent(data: Partial<Event>): Promise<ApiResponse<Event>> {
    return apiClient.post<Event>('/api/events/', data)
  },

  // Update existing event
  async updateEvent(id: string, data: Partial<Event>): Promise<ApiResponse<Event>> {
    return apiClient.put<Event>(`/api/events/${id}/`, data)
  },

  // Partially update event
  async patchEvent(id: string, data: Partial<Event>): Promise<ApiResponse<Event>> {
    return apiClient.patch<Event>(`/api/events/${id}/`, data)
  },

  // Update event with file uploads (multipart/form-data)
  async updateEventWithFiles(id: string, data: FormData): Promise<ApiResponse<Event>> {
    return apiClient.patch<Event>(`/api/events/${id}/`, data)
  },

  // Delete event
  async deleteEvent(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${id}/`)
  },

  // Get current user's events using dedicated endpoint
  async getMyEvents(params?: {
    page?: number
    search?: string
    category?: number | string
    status?: string
    ordering?: string
  }): Promise<ApiResponse<MyEventsResponse>> {
    return apiClient.get<MyEventsResponse>('/api/events/my/', params)
  },

  // Get events the current user has registered for
  async getMyRegisteredEvents(params?: EventFilters): Promise<ApiResponse<Event[]>> {
    return apiClient.get<Event[]>('/api/events/my-registered/', params)
  },

  // Register for an event
  async registerForEvent(
    eventId: string,
    data: { guest_count?: number; notes?: string },
  ): Promise<ApiResponse<EventRegistration>> {
    return apiClient.post<EventRegistration>(`/api/events/${eventId}/register/`, data)
  },

  // Get event registrations (for organizers)
  async getEventRegistrations(
    eventId: string,
  ): Promise<ApiResponse<PaginatedResponse<EventRegistration>>> {
    return apiClient.get<PaginatedResponse<EventRegistration>>(
      `/api/events/${eventId}/registrations/`,
    )
  },

  // RSVP for an event (create or update registration)
  async rsvpForEvent(
    eventId: string,
    data: { guest_count?: number; notes?: string; status?: string },
  ): Promise<ApiResponse<EventRegistration>> {
    return apiClient.post<EventRegistration>(`/api/events/${eventId}/rsvp/`, data)
  },

  // Unregister from an event
  async unregisterFromEvent(eventId: string): Promise<ApiResponse<EventRegistration>> {
    return apiClient.post<EventRegistration>(`/api/events/${eventId}/unregister/`, {})
  },

  // Self check-in
  async selfCheckin(eventId: string): Promise<ApiResponse<EventRegistration>> {
    return apiClient.post<EventRegistration>(`/api/events/${eventId}/self-checkin/`, {})
  },

  // Admin check-in using confirmation code
  async adminCheckin(
    eventId: string,
    confirmationCode: string,
  ): Promise<ApiResponse<EventRegistration>> {
    return apiClient.post<EventRegistration>(`/api/events/${eventId}/checkin/`, {
      confirmation_code: confirmationCode,
    })
  },

  // Get current user's registration for an event
  async getMyRegistration(eventId: string): Promise<ApiResponse<EventRegistration>> {
    return apiClient.get<EventRegistration>(`/api/events/${eventId}/my-registration/`)
  },

  // Event photos management
  async getEventPhotos(eventId: string): Promise<ApiResponse<EventPhoto[]>> {
    return apiClient.get<EventPhoto[]>(`/api/events/${eventId}/photos/`)
  },

  async uploadEventPhoto(
    eventId: string,
    file: File,
    photoData: { caption?: string; order?: number; is_featured?: boolean },
    options?: { onProgress?: (progress: number) => void }
  ): Promise<ApiResponse<EventPhoto>> {
    const formData = new FormData()
    formData.append('image', file)

    if (photoData.caption) formData.append('caption', photoData.caption)
    if (photoData.order !== undefined) formData.append('order', photoData.order.toString())
    if (photoData.is_featured !== undefined)
      formData.append('is_featured', photoData.is_featured.toString())

    return apiClient.uploadFile<EventPhoto>(
      `/api/events/${eventId}/photos/`,
      formData,
      options
    )
  },

  // Update photo
  async updateEventPhoto(
    eventId: string,
    photoId: number,
    data: Partial<EventPhoto>,
  ): Promise<ApiResponse<EventPhoto>> {
    return apiClient.patch<EventPhoto>(`/api/events/${eventId}/photos/${photoId}/`, data)
  },

  // Reorder photo
  async reorderEventPhoto(
    eventId: string,
    photoId: number,
    order: number,
  ): Promise<ApiResponse<EventPhoto>> {
    return apiClient.patch<EventPhoto>(`/api/events/${eventId}/photos/${photoId}/reorder/`, {
      order,
    })
  },

  // Delete photo
  async deleteEventPhoto(eventId: string, photoId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/photos/${photoId}/`)
  },

  // Collaboration management
  async inviteCollaborator(
    eventId: string,
    data: { email: string; role: 'admin' | 'editor' | 'viewer'; message?: string },
  ): Promise<ApiResponse<EventCollaborator>> {
    return apiClient.post<EventCollaborator>(`/api/events/${eventId}/invite-collaborator/`, data)
  },

  async getCollaborators(eventId: string): Promise<ApiResponse<EventCollaborator[]>> {
    return apiClient.get<EventCollaborator[]>(`/api/events/${eventId}/collaborators/`)
  },

  // Update collaborator role
  async updateCollaborator(
    eventId: string,
    collaboratorId: number,
    data: { role: 'admin' | 'editor' | 'viewer' },
  ): Promise<ApiResponse<EventCollaborator>> {
    return apiClient.patch<EventCollaborator>(
      `/api/events/${eventId}/collaborators/${collaboratorId}/`,
      data,
    )
  },

  // Remove collaborator
  async removeCollaborator(eventId: string, collaboratorId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/collaborators/${collaboratorId}/`)
  },

  // Get event showcase data (public endpoint for invitations)
  async getEventShowcase(
    eventId: string,
    params?: { lang?: string; guest_name?: string },
  ): Promise<ApiResponse<unknown>> {
    return apiClient.getPublic<unknown>(`/api/events/${eventId}/showcase/`, params)
  },
}
