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

export function useBulkImport(eventId: string) {
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
      const response = await guestGroupService.bulkImportToGroup(
        eventId,
        groupId,
        selectedFile.value,
      )

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
