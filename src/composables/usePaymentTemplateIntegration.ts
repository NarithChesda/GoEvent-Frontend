import { ref, computed, watch } from 'vue'
import { apiService } from '../services/api'

interface Payment {
  readonly id: string
  readonly payment_reference: string
  readonly user_email: string
  readonly event: string
  readonly event_title: string
  readonly template_name: string | null
  readonly plan_name: string
  readonly payment_method_name: string
  readonly amount: string
  readonly original_price: string
  readonly discount_amount: string
  readonly currency: string
  readonly status: 'pending' | 'confirmed' | 'failed' | 'cancelled' | 'refunded'
  readonly status_display: string
  readonly transaction_reference: string
  readonly created_at: string
  readonly is_confirmed: boolean
  readonly is_upgrade: boolean
  readonly payment_proof?: string
  readonly user_notes?: string
  readonly updated_at?: string
}

interface Event {
  id: string
  event_template?: number | null
  event_template_details?: {
    name: string
    package_plan: {
      id: number
      name: string
      description?: string
      price: string
      features: string[]
    }
  } | null
}

/**
 * Composable for managing payment-template integration state
 * Provides centralized state management for template activation status
 */
export function usePaymentTemplateIntegration(event: Event) {
  
  // Shared state
  const payments = ref<readonly Payment[]>([])
  const loadingPayments = ref(false)
  const lastUpdated = ref<Date | null>(null)
  const error = ref<string | null>(null)
  
  // Cache duration (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000
  
  // Computed properties
  const currentTemplateName = computed(() => {
    return event.event_template_details?.name || null
  })
  
  const isTemplateActivated = computed(() => {
    if (!event.event_template || !currentTemplateName.value) {
      return false
    }
    
    return payments.value.some(payment => 
      payment.status === 'confirmed' && 
      payment.event === event.id &&
      payment.template_name === currentTemplateName.value
    )
  })
  
  const confirmedPayments = computed(() => {
    return payments.value.filter(p => 
      p.status === 'confirmed' && 
      p.event === event.id
    )
  })
  
  const pendingPayments = computed(() => {
    return payments.value.filter(p => 
      p.status === 'pending' && 
      p.event === event.id
    )
  })
  
  // Helper to check if cache is valid
  const isCacheValid = (): boolean => {
    if (!lastUpdated.value) return false
    return Date.now() - lastUpdated.value.getTime() < CACHE_DURATION
  }
  
  // Load payments with caching
  const loadPayments = async (forceRefresh = false): Promise<void> => {
    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid() && payments.value.length > 0) {
      return
    }
    
    if (loadingPayments.value) return
    
    loadingPayments.value = true
    error.value = null
    
    try {
      const response = await apiService.get<Payment[]>('/api/payment/payments/event_payments/', {
        event_id: event.id
      })
      
      if (response.success && response.data) {
        const paymentData = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).results || []
        
        payments.value = Object.freeze(paymentData)
        lastUpdated.value = new Date()
        
        // console.log(`Loaded ${payments.value.length} payments for event ${event.id}`)
      } else {
        throw new Error(response.message || 'Failed to load payments')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load payment data'
      console.error('Error loading payments:', err)
      error.value = errorMessage
      payments.value = []
    } finally {
      loadingPayments.value = false
    }
  }
  
  // Refresh payments (force reload)
  const refreshPayments = async (): Promise<void> => {
    await loadPayments(true)
  }
  
  // Check if a specific template is activated
  const isTemplateActivatedByName = (templateName: string): boolean => {
    return payments.value.some(payment => 
      payment.status === 'confirmed' && 
      payment.event === event.id &&
      payment.template_name === templateName
    )
  }
  
  // Get payment for specific template
  const getPaymentForTemplate = (templateName: string): Payment | null => {
    return payments.value.find(payment => 
      payment.event === event.id &&
      payment.template_name === templateName
    ) || null
  }
  
  // Auto-refresh when template changes
  watch(
    () => event.event_template,
    (newTemplate, oldTemplate) => {
      if (newTemplate !== oldTemplate && newTemplate) {
        // Template changed, refresh payments
        refreshPayments()
      }
    }
  )
  
  return {
    // State
    payments: computed(() => payments.value),
    loadingPayments: computed(() => loadingPayments.value),
    error: computed(() => error.value),
    lastUpdated: computed(() => lastUpdated.value),
    
    // Computed properties
    currentTemplateName,
    isTemplateActivated,
    confirmedPayments,
    pendingPayments,
    
    // Methods
    loadPayments,
    refreshPayments,
    isTemplateActivatedByName,
    getPaymentForTemplate,
    
    // Cache info
    isCacheValid
  }
}