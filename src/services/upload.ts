import { apiService, type ApiResponse } from './api'

export interface UploadResponse {
  url?: string
  profile_picture?: string
  message?: string
}

class UploadService {
  async uploadProfilePicture(file: File): Promise<ApiResponse<UploadResponse>> {
    try {
      const formData = new FormData()
      formData.append('profile_picture', file)

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/api/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      })

      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')
      
      try {
        const data = isJson ? await response.json() : await response.text()
        
        if (!response.ok) {
          return {
            success: false,
            message: data.detail || data.message || 'Upload failed',
            errors: data.errors || data
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
    } catch (error) {
      return {
        success: false,
        message: 'Network error'
      }
    }
  }

  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
      }
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 5MB'
      }
    }

    return { valid: true }
  }
}

export const uploadService = new UploadService()