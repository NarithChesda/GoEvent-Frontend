import { ref } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  dismissable?: boolean
}

const notifications = ref<Notification[]>([])

/**
 * Composable for managing app-wide notifications
 * Provides a centralized notification system to replace alert() calls
 */
export function useNotifications() {
  const addNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      id,
      duration: 5000,
      dismissable: true,
      ...notification
    }
    
    notifications.value.push(newNotification)
    
    // Auto-dismiss if duration is set
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }
  
  const removeNotification = (id: string): void => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  const clearAllNotifications = (): void => {
    notifications.value = []
  }
  
  // Convenience methods for different notification types
  const success = (title: string, message?: string, duration?: number): string => {
    return addNotification({ type: 'success', title, message, duration })
  }
  
  const error = (title: string, message?: string, duration?: number): string => {
    return addNotification({ type: 'error', title, message, duration: duration || 8000 })
  }
  
  const warning = (title: string, message?: string, duration?: number): string => {
    return addNotification({ type: 'warning', title, message, duration })
  }
  
  const info = (title: string, message?: string, duration?: number): string => {
    return addNotification({ type: 'info', title, message, duration })
  }
  
  return {
    notifications: notifications.value,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info
  }
}