import { ref } from 'vue'
import { commissionService, type Commission, type CommissionDetail } from '../services/commission'
import { useNotifications } from './useNotifications'
import { validateCommissionNotes } from '../utils/commissionHelpers'

export function useCommissionActions() {
  const { success, error } = useNotifications()

  // Modal state
  const showRequestClaimModal = ref(false)
  const showDetailsModal = ref(false)
  const showClaimModal = ref(false)
  const showBulkClaimModal = ref(false)
  const selectedCommission = ref<CommissionDetail | null>(null)
  const selectedCommissionForClaim = ref<Commission | null>(null)
  const selectedCommissionForApproval = ref<Commission | null>(null)
  const selectedCommissionsForBulkAction = ref<Commission[]>([])
  const requestClaimNotes = ref('')
  const claimNotes = ref('')
  const bulkClaimNotes = ref('')
  const isRequestingClaim = ref(false)
  const isClaimingCommission = ref(false)
  const isBulkActioning = ref(false)
  const isLoadingDetails = ref(false)

  async function openRequestClaimModal(commission: Commission) {
    if (commission.status !== 'pending') {
      error('Cannot request claim', 'This commission is not eligible for claim request')
      return
    }

    selectedCommissionForClaim.value = commission
    requestClaimNotes.value = ''
    showRequestClaimModal.value = true
  }

  async function requestClaim(onSuccess?: (updatedCommission?: CommissionDetail) => void) {
    if (!selectedCommissionForClaim.value) {
      error('Invalid Commission', 'No commission selected for claim request')
      return
    }

    // Validate commission state
    if (selectedCommissionForClaim.value.status !== 'pending') {
      error('Cannot Request Claim', 'This commission is not eligible for claim request')
      return
    }

    // Validate notes content and length
    const notes = requestClaimNotes.value.trim()
    const validation = validateCommissionNotes(notes, 1000)
    if (!validation.isValid) {
      error('Invalid Notes', validation.error || 'Notes validation failed')
      return
    }

    isRequestingClaim.value = true
    try {
      const response = await commissionService.requestClaim(selectedCommissionForClaim.value.id, {
        requested_notes: notes || undefined,
      })

      if (response.success && response.data) {
        success('Claim request submitted successfully', 'Your request is now under review')
        closeRequestClaimModal()
        onSuccess?.(response.data)
      } else {
        error('Failed to submit claim request', response.message || 'Unknown error occurred')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred'
      error('Failed to submit claim request', errorMessage)
    } finally {
      isRequestingClaim.value = false
    }
  }

  async function viewCommissionDetails(commission: Commission) {
    isLoadingDetails.value = true
    try {
      const response = await commissionService.getCommission(commission.id)
      if (response.success && response.data) {
        selectedCommission.value = response.data
        showDetailsModal.value = true
      } else {
        error('Failed to load commission details', response.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred'
      error('Failed to load commission details', errorMessage)
    } finally {
      isLoadingDetails.value = false
    }
  }

  function closeRequestClaimModal() {
    showRequestClaimModal.value = false
    selectedCommissionForClaim.value = null
    requestClaimNotes.value = ''
  }

  function closeDetailsModal() {
    showDetailsModal.value = false
    selectedCommission.value = null
  }

  // Claim commission (admin approve)
  async function openClaimModal(commission: Commission) {
    if (!commission.can_be_claimed) {
      error('Cannot claim commission', 'This commission is not eligible for claiming')
      return
    }

    selectedCommissionForApproval.value = commission
    claimNotes.value = ''
    showClaimModal.value = true
  }

  async function claimCommission(onSuccess?: (updatedCommission?: CommissionDetail) => void) {
    if (!selectedCommissionForApproval.value) {
      error('Invalid Commission', 'No commission selected for approval')
      return
    }

    // Validate commission state
    if (!selectedCommissionForApproval.value.can_be_claimed) {
      error('Cannot Claim Commission', 'This commission is not eligible for claiming')
      return
    }

    // Validate notes content and length
    const notes = claimNotes.value.trim()
    const validation = validateCommissionNotes(notes, 1000)
    if (!validation.isValid) {
      error('Invalid Notes', validation.error || 'Notes validation failed')
      return
    }

    isClaimingCommission.value = true
    try {
      const response = await commissionService.approveClaim(
        selectedCommissionForApproval.value.id,
        { claim_notes: notes || undefined },
      )

      if (response.success && response.data) {
        success(
          'Commission claimed successfully',
          'The commission has been approved and marked as paid',
        )
        closeClaimModal()
        onSuccess?.(response.data)
      } else {
        error('Failed to claim commission', response.message || 'Unknown error occurred')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred'
      error('Failed to claim commission', errorMessage)
    } finally {
      isClaimingCommission.value = false
    }
  }

  function closeClaimModal() {
    showClaimModal.value = false
    selectedCommissionForApproval.value = null
    claimNotes.value = ''
  }

  // Bulk claim functionality
  async function openBulkClaimModal(commissions: Commission[]) {
    const claimableCommissions = commissions.filter((c) => c.can_be_claimed)

    if (claimableCommissions.length === 0) {
      error('No claimable commissions', 'None of the selected commissions can be claimed')
      return
    }

    selectedCommissionsForBulkAction.value = claimableCommissions
    bulkClaimNotes.value = ''
    showBulkClaimModal.value = true
  }

  async function bulkClaimCommissions(onSuccess?: (updatedCommissions?: Commission[]) => void) {
    if (selectedCommissionsForBulkAction.value.length === 0) return

    // Validate notes if provided
    const notes = bulkClaimNotes.value.trim()
    if (notes) {
      const validation = validateCommissionNotes(notes, 1000)
      if (!validation.isValid) {
        error('Invalid Notes', validation.error || 'Notes validation failed')
        return
      }
    }

    isBulkActioning.value = true
    try {
      const commissionIds = selectedCommissionsForBulkAction.value.map((c) => c.id)
      const response = await commissionService.bulkApproveClaims({
        commission_ids: commissionIds,
        claim_notes: notes || undefined,
      })

      if (response.success && response.data) {
        const count = selectedCommissionsForBulkAction.value.length
        success(
          `${count} commission${count > 1 ? 's' : ''} claimed successfully`,
          'The commissions have been approved and marked as paid',
        )
        closeBulkClaimModal()
        onSuccess?.(response.data)
      } else {
        error('Failed to claim commissions', response.message || 'Unknown error occurred')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred'
      error('Failed to claim commissions', errorMessage)
    } finally {
      isBulkActioning.value = false
    }
  }

  function closeBulkClaimModal() {
    showBulkClaimModal.value = false
    selectedCommissionsForBulkAction.value = []
    bulkClaimNotes.value = ''
  }

  return {
    // State
    showRequestClaimModal,
    showDetailsModal,
    showClaimModal,
    showBulkClaimModal,
    selectedCommission,
    selectedCommissionForClaim,
    selectedCommissionForApproval,
    selectedCommissionsForBulkAction,
    requestClaimNotes,
    claimNotes,
    bulkClaimNotes,
    isRequestingClaim,
    isClaimingCommission,
    isBulkActioning,
    isLoadingDetails,

    // Methods
    openRequestClaimModal,
    requestClaim,
    openClaimModal,
    claimCommission,
    openBulkClaimModal,
    bulkClaimCommissions,
    viewCommissionDetails,
    closeRequestClaimModal,
    closeDetailsModal,
    closeClaimModal,
    closeBulkClaimModal,
  }
}
