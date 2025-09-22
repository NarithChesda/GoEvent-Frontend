import { Clock, FileText, CheckCircle, X } from 'lucide-vue-next'
import { sanitizePlainText } from './sanitize'
import type { Commission } from '../services/commission'

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid Date'

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'Invalid Date'
  }
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return '1 day ago'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`

  return formatDate(dateString)
}

export function getStatusClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'requested':
      return 'bg-purple-50 text-purple-700 border border-purple-200'
    case 'claimed':
      return 'bg-green-50 text-green-700 border border-green-200'
    case 'rejected':
      return 'bg-red-50 text-red-700 border border-red-200'
    case 'cancelled':
      return 'bg-slate-50 text-slate-700 border border-slate-200'
    default:
      return 'bg-slate-50 text-slate-700 border border-slate-200'
  }
}

export function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
      return Clock
    case 'requested':
      return FileText
    case 'claimed':
      return CheckCircle
    case 'rejected':
      return X
    case 'cancelled':
      return X
    default:
      return Clock
  }
}

export function getStatusDotClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-500'
    case 'requested':
      return 'bg-purple-500'
    case 'claimed':
      return 'bg-green-500'
    case 'rejected':
      return 'bg-red-500'
    case 'cancelled':
      return 'bg-slate-400'
    default:
      return 'bg-slate-400'
  }
}

export function getStatusConfig(status: string) {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending',
        class: 'bg-amber-50 text-amber-700 border border-amber-200',
        dotClass: 'bg-amber-500',
        icon: Clock,
        description: 'Available for claim request',
      }
    case 'requested':
      return {
        label: 'Under Review',
        class: 'bg-purple-50 text-purple-700 border border-purple-200',
        dotClass: 'bg-purple-500',
        icon: FileText,
        description: 'Claim request under review',
      }
    case 'claimed':
      return {
        label: 'Claimed',
        class: 'bg-green-50 text-green-700 border border-green-200',
        dotClass: 'bg-green-500',
        icon: CheckCircle,
        description: 'Commission has been paid',
      }
    case 'rejected':
      return {
        label: 'Rejected',
        class: 'bg-red-50 text-red-700 border border-red-200',
        dotClass: 'bg-red-500',
        icon: X,
        description: 'Claim request was rejected',
      }
    case 'cancelled':
      return {
        label: 'Cancelled',
        class: 'bg-slate-50 text-slate-700 border border-slate-200',
        dotClass: 'bg-slate-400',
        icon: X,
        description: 'Commission was cancelled',
      }
    default:
      return {
        label: 'Unknown',
        class: 'bg-slate-50 text-slate-700 border border-slate-200',
        dotClass: 'bg-slate-400',
        icon: Clock,
        description: 'Status unknown',
      }
  }
}

/**
 * Sanitizes user-generated content in commission data
 * Prevents XSS attacks from notes and comments
 */
export function sanitizeCommissionContent(commission: Commission): Commission {
  return {
    ...commission,
    requested_notes: sanitizePlainText(commission.requested_notes || '', 1000),
    claim_notes: sanitizePlainText(commission.claim_notes || '', 1000),
    rejection_reason: sanitizePlainText(commission.rejection_reason || '', 1000),
    admin_notes: sanitizePlainText(commission.admin_notes || '', 1000),
  }
}

/**
 * Validates commission notes before submission
 */
export function validateCommissionNotes(
  notes: string,
  maxLength = 1000,
): { isValid: boolean; error?: string } {
  if (!notes) {
    return { isValid: true }
  }

  const trimmed = notes.trim()

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `Notes cannot exceed ${maxLength} characters (currently ${trimmed.length})`,
    }
  }

  // Basic check for suspicious content
  const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i]
  if (suspiciousPatterns.some((pattern) => pattern.test(trimmed))) {
    return {
      isValid: false,
      error: 'Notes contain invalid characters or content',
    }
  }

  return { isValid: true }
}
