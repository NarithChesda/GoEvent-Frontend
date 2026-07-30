import { useToast, type ToastType } from './useToast'

export interface Notification {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  dismissable?: boolean
}

/**
 * Title + supporting-message flavour of the toast API.
 *
 * This is a thin adapter over `useToast` — both feed the same queue and the same
 * `ToastHost`, so it doesn't matter which one a component reaches for. Prefer
 * `useToast` in new code; this exists so the existing call sites keep working.
 */
export function useNotifications() {
  const { toasts, showToast, dismissToast, clearToasts } = useToast()

  const addNotification = (notification: Omit<Notification, 'id'>): string =>
    showToast(notification.type, notification.title, {
      description: notification.message,
      duration: notification.duration,
      dismissible: notification.dismissable,
    })

  const success = (title: string, message?: string, duration?: number): string =>
    showToast('success', title, { description: message, duration })

  const error = (title: string, message?: string, duration?: number): string =>
    showToast('error', title, { description: message, duration })

  const warning = (title: string, message?: string, duration?: number): string =>
    showToast('warning', title, { description: message, duration })

  const info = (title: string, message?: string, duration?: number): string =>
    showToast('info', title, { description: message, duration })

  return {
    notifications: toasts,
    addNotification,
    removeNotification: dismissToast,
    clearAllNotifications: clearToasts,
    success,
    error,
    warning,
    info,
  }
}
