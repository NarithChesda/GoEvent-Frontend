import { ref } from 'vue'
import { guestGroupService, type ApiResponse } from '../../services/api'

export interface BulkImportResult {
  success: boolean
  message: string
  created: number
  skipped: number
  errors_count: number
  created_guests: Array<{
    id: number
    name: string
    group: string
    showcase_link: string
  }>
  skipped_guests: Array<{ name: string; reason: string }>
  errors: Array<{ name: string; error: string }>
}

/**
 * Composable for bulk importing guests from files.
 *
 * @param eventId - The event ID
 * @param onGroupCountChange - Optional callback invoked when a group's guest count changes
 * @param onStatsChange - Optional callback invoked when overall stats change
 */
export function useBulkImport(
  eventId: string,
  onGroupCountChange?: (groupId: number, delta: number) => void,
  onStatsChange?: (delta: number) => void
) {
  const selectedFile = ref<File | null>(null)
  const isDragging = ref(false)
  const isImporting = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)

  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleFileDrop = (event: DragEvent) => {
    isDragging.value = false
    const file = event.dataTransfer?.files[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    isDragging.value = true
  }

  const handleDragLeave = () => {
    isDragging.value = false
  }

  const processFile = (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ]

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls|txt)$/i)) {
      return {
        success: false,
        message: 'Please upload a CSV, Excel, or TXT file',
      }
    }

    selectedFile.value = file
    return { success: true }
  }

  const importGuests = async (groupId: number) => {
    if (!selectedFile.value) {
      return {
        success: false,
        message: 'Please select a file to import',
      } as ApiResponse<BulkImportResult>
    }

    isImporting.value = true

    try {
      // Strip BOM from CSV files if present
      let fileToUpload = selectedFile.value
      if (selectedFile.value.type === 'text/csv' || selectedFile.value.name.endsWith('.csv')) {
        const text = await selectedFile.value.text()
        // Check for BOM (U+FEFF) and remove it
        const cleanedText = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
        fileToUpload = new File([cleanedText], selectedFile.value.name, {
          type: selectedFile.value.type,
        })
      }

      const response = await guestGroupService.bulkImportToGroup(
        eventId,
        groupId,
        fileToUpload,
      )

      // Update counts reactively if import was successful
      if (response.success && response.data) {
        const createdCount = response.data.created || 0

        // Update counts via callbacks (with error handling)
        if (createdCount > 0) {
          try {
            if (onGroupCountChange) {
              onGroupCountChange(groupId, createdCount)
            }
            if (onStatsChange) {
              onStatsChange(createdCount)
            }
          } catch (error) {
            console.error('Error updating counts via callback:', error)
            // Don't throw - continue execution
          }
        }
      }

      return response
    } catch (error) {
      console.error('Error importing guests:', error)
      return {
        success: false,
        message: 'Failed to import guests',
      } as ApiResponse<BulkImportResult>
    } finally {
      isImporting.value = false
    }
  }

  const downloadTemplate = () => {
    const csvContent = 'name\nJohn Doe\nJane Smith\nMichael Johnson'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'guest_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetImportState = () => {
    selectedFile.value = null
    isDragging.value = false
    isImporting.value = false
  }

  return {
    selectedFile,
    isDragging,
    isImporting,
    fileInput,
    handleFileSelect,
    handleFileDrop,
    handleDragOver,
    handleDragLeave,
    processFile,
    importGuests,
    downloadTemplate,
    resetImportState,
  }
}
