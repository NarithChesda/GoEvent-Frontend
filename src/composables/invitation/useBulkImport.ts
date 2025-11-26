import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { guestGroupService, type ApiResponse } from '../../services/api'

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_GUEST_WARNING_THRESHOLD = 1000

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

export interface PreviewGuest {
  name: string
  isValid: boolean
  error?: string
}

export interface FilePreview {
  guests: PreviewGuest[]
  totalRows: number
  validCount: number
  invalidCount: number
  fileName: string
}

/**
 * Composable for bulk importing guests from files.
 *
 * @param eventId - The event ID
 * @param onGroupCountChange - Optional callback invoked when a group's guest count changes
 * @param onStatsChange - Optional callback invoked when overall stats change
 * @param getExistingGuestNames - Optional callback to get existing guest names for a group (for duplicate checking)
 */
export function useBulkImport(
  eventId: string,
  onGroupCountChange?: (groupId: number, delta: number) => void,
  onStatsChange?: (delta: number) => void,
  getExistingGuestNames?: (groupId: number) => string[]
) {
  const selectedFile = ref<File | null>(null)
  const isDragging = ref(false)
  const isImporting = ref(false)
  const isParsing = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)
  const filePreview = ref<FilePreview | null>(null)
  const parseError = ref<string | null>(null)

  /**
   * Parse CSV content and extract guest names
   */
  const parseCSV = (content: string): string[] => {
    const lines = content.split(/\r?\n/).filter((line) => line.trim())
    if (lines.length === 0) return []

    // Check if first line is a header (contains "name")
    const firstLine = lines[0].toLowerCase().trim()
    const hasHeader = firstLine === 'name' || firstLine.includes(',name') || firstLine.startsWith('name,')

    const startIndex = hasHeader ? 1 : 0
    const names: string[] = []

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Handle CSV with multiple columns - take the first column or the "name" column
      if (line.includes(',')) {
        // Simple CSV parsing - handle quoted values
        const parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
        if (parts && parts.length > 0) {
          // Remove quotes if present
          const name = parts[0].replace(/^"|"$/g, '').trim()
          if (name) names.push(name)
        }
      } else {
        names.push(line)
      }
    }

    return names
  }

  /**
   * Parse Excel file and extract guest names
   */
  const parseExcel = async (file: File): Promise<string[]> => {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // Get the first sheet
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    // Convert to JSON with header: 1 returns array of arrays
    const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })

    if (data.length === 0) return []

    // Find the name column (look for header "name" case-insensitive)
    const firstRow = data[0]
    let nameColumnIndex = 0

    if (Array.isArray(firstRow)) {
      const headerIndex = firstRow.findIndex(
        (cell) => typeof cell === 'string' && cell.toLowerCase().trim() === 'name'
      )
      if (headerIndex >= 0) {
        nameColumnIndex = headerIndex
      }
    }

    // Check if first row is header
    const hasHeader =
      Array.isArray(firstRow) &&
      firstRow.some(
        (cell) => typeof cell === 'string' && cell.toLowerCase().trim() === 'name'
      )

    const startIndex = hasHeader ? 1 : 0
    const names: string[] = []

    for (let i = startIndex; i < data.length; i++) {
      const row = data[i]
      if (!Array.isArray(row) || row.length === 0) continue

      const cellValue = row[nameColumnIndex]
      if (cellValue !== null && cellValue !== undefined) {
        const name = String(cellValue).trim()
        if (name) names.push(name)
      }
    }

    return names
  }

  /**
   * Parse TXT file (one name per line)
   */
  const parseTXT = (content: string): string[] => {
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  }

  /**
   * Validate a guest name
   * @param name - The guest name to validate
   * @param existingNames - Optional set of existing guest names (normalized to lowercase) for duplicate checking
   */
  const validateGuestName = (
    name: string,
    existingNames?: Set<string>
  ): { isValid: boolean; error?: string } => {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Name is empty' }
    }

    const trimmedName = name.trim()

    if (trimmedName.length < 2) {
      return { isValid: false, error: 'Name too short (min 2 characters)' }
    }

    if (trimmedName.length > 100) {
      return { isValid: false, error: 'Name too long (max 100 characters)' }
    }

    // Check for duplicates against existing guests in the group
    if (existingNames && existingNames.has(trimmedName.toLowerCase())) {
      return { isValid: false, error: 'Already exists in group' }
    }

    return { isValid: true }
  }

  // Store parsed names for re-validation when group changes
  const parsedNames = ref<string[]>([])

  /**
   * Build a set of existing guest names (normalized to lowercase) for duplicate checking
   */
  const buildExistingNamesSet = (groupId?: number): Set<string> => {
    if (!groupId || !getExistingGuestNames) {
      return new Set()
    }
    const existingNames = getExistingGuestNames(groupId)
    return new Set(existingNames.map((name) => name.toLowerCase()))
  }

  /**
   * Validate parsed names and create preview guests
   */
  const validateParsedNames = (
    names: string[],
    fileName: string,
    groupId?: number
  ): FilePreview => {
    const existingNamesSet = buildExistingNamesSet(groupId)

    // Also track names within the import file to detect duplicates within the file itself
    const seenInFile = new Set<string>()

    const guests: PreviewGuest[] = names.map((name) => {
      const trimmedName = name.trim()
      const normalizedName = trimmedName.toLowerCase()

      // First check for duplicates within the file itself
      if (seenInFile.has(normalizedName)) {
        return {
          name: trimmedName,
          isValid: false,
          error: 'Duplicate in file',
        }
      }
      seenInFile.add(normalizedName)

      // Then validate (including check against existing guests)
      const validation = validateGuestName(name, existingNamesSet)
      return {
        name: trimmedName,
        isValid: validation.isValid,
        error: validation.error,
      }
    })

    const validCount = guests.filter((g) => g.isValid).length
    const invalidCount = guests.filter((g) => !g.isValid).length

    return {
      guests,
      totalRows: guests.length,
      validCount,
      invalidCount,
      fileName,
    }
  }

  /**
   * Parse the selected file and generate preview
   * @param file - The file to parse
   * @param groupId - Optional group ID for duplicate checking against existing guests
   */
  const parseFileForPreview = async (
    file: File,
    groupId?: number
  ): Promise<FilePreview | null> => {
    isParsing.value = true
    parseError.value = null

    try {
      let names: string[] = []
      const fileName = file.name.toLowerCase()

      if (fileName.endsWith('.csv') || file.type === 'text/csv') {
        const text = await file.text()
        // Strip BOM if present
        const cleanedText = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
        names = parseCSV(cleanedText)
      } else if (
        fileName.endsWith('.xlsx') ||
        fileName.endsWith('.xls') ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel'
      ) {
        names = await parseExcel(file)
      } else if (fileName.endsWith('.txt') || file.type === 'text/plain') {
        const text = await file.text()
        names = parseTXT(text)
      } else {
        parseError.value = 'Unsupported file format'
        return null
      }

      if (names.length === 0) {
        parseError.value = 'No guest names found in the file'
        return null
      }

      // Store parsed names for re-validation when group changes
      parsedNames.value = names

      // Validate and create preview
      return validateParsedNames(names, file.name, groupId)
    } catch (error) {
      console.error('Error parsing file:', error)
      parseError.value = error instanceof Error ? error.message : 'Failed to parse file'
      return null
    } finally {
      isParsing.value = false
    }
  }

  /**
   * Re-validate the current preview against a different group's existing guests
   * Call this when the user changes the target group selection
   */
  const revalidatePreviewForGroup = (groupId: number): void => {
    if (!selectedFile.value || parsedNames.value.length === 0) {
      return
    }

    filePreview.value = validateParsedNames(
      parsedNames.value,
      selectedFile.value.name,
      groupId
    )
  }

  /**
   * Update a guest name at a specific index in the preview
   * This allows users to edit names before importing
   * @param index - The index of the guest in the preview list
   * @param newName - The new name value
   * @param groupId - Optional group ID for re-validation against existing guests
   */
  const updateGuestName = (index: number, newName: string, groupId?: number): void => {
    if (index < 0 || index >= parsedNames.value.length) {
      return
    }

    // Update the parsed names array
    parsedNames.value[index] = newName

    // Re-validate the entire preview to update duplicate detection
    if (selectedFile.value) {
      filePreview.value = validateParsedNames(
        parsedNames.value,
        selectedFile.value.name,
        groupId
      )
    }
  }

  /**
   * Delete a guest from the preview at a specific index
   * @param index - The index of the guest to delete
   * @param groupId - Optional group ID for re-validation against existing guests
   */
  const deleteGuestFromPreview = (index: number, groupId?: number): void => {
    if (index < 0 || index >= parsedNames.value.length) {
      return
    }

    // Remove the name from the parsed names array
    parsedNames.value.splice(index, 1)

    // Re-validate the entire preview to update duplicate detection
    if (selectedFile.value && parsedNames.value.length > 0) {
      filePreview.value = validateParsedNames(
        parsedNames.value,
        selectedFile.value.name,
        groupId
      )
    } else {
      // If no names left, clear the preview
      filePreview.value = null
    }
  }

  const handleFileSelect = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const handleFileDrop = async (event: DragEvent) => {
    isDragging.value = false
    const file = event.dataTransfer?.files[0]
    if (file) {
      await processFile(file)
    }
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    isDragging.value = true
  }

  const handleDragLeave = () => {
    isDragging.value = false
  }

  const processFile = async (
    file: File,
    groupId?: number
  ): Promise<{ success: boolean; message?: string; warning?: string }> => {
    // Check file size limit
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)
      parseError.value = `File too large. Maximum size is ${sizeMB}MB`
      return {
        success: false,
        message: `File too large. Maximum size is ${sizeMB}MB`,
      }
    }

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ]

    // Check by MIME type or file extension
    const isValidType =
      validTypes.includes(file.type) || file.name.match(/\.(csv|xlsx|xls|txt)$/i)

    if (!isValidType) {
      parseError.value = 'Please upload a CSV, Excel, or TXT file'
      return {
        success: false,
        message: 'Please upload a CSV, Excel, or TXT file',
      }
    }

    selectedFile.value = file

    // Generate preview with optional duplicate checking against group
    const preview = await parseFileForPreview(file, groupId)
    filePreview.value = preview

    if (!preview) {
      return {
        success: false,
        message: parseError.value || 'Failed to parse file',
      }
    }

    // Warn if importing a large number of guests
    let warning: string | undefined
    if (preview.totalRows > MAX_GUEST_WARNING_THRESHOLD) {
      warning = `You are importing ${preview.totalRows} guests. This may take a while.`
    }

    return { success: true, warning }
  }

  const importGuests = async (groupId: number) => {
    if (!selectedFile.value || !filePreview.value) {
      return {
        success: false,
        message: 'Please select a file to import',
      } as ApiResponse<BulkImportResult>
    }

    isImporting.value = true

    try {
      // Create a clean CSV from parsed preview data
      // This ensures consistent format regardless of original file type (CSV, Excel, TXT)
      // and handles Unicode filenames/content properly
      const validGuests = filePreview.value.guests.filter((g) => g.isValid)
      const csvContent = 'name\n' + validGuests.map((g) => g.name).join('\n')
      const fileToUpload = new File([csvContent], 'guests_import.csv', {
        type: 'text/csv',
      })

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
    // Clean up the object URL to prevent memory leak
    URL.revokeObjectURL(url)
  }

  const resetImportState = () => {
    selectedFile.value = null
    isDragging.value = false
    isImporting.value = false
    isParsing.value = false
    filePreview.value = null
    parseError.value = null
    parsedNames.value = []
  }

  const clearPreview = () => {
    selectedFile.value = null
    filePreview.value = null
    parseError.value = null
    parsedNames.value = []
  }

  return {
    selectedFile,
    isDragging,
    isImporting,
    isParsing,
    fileInput,
    filePreview,
    parseError,
    handleFileSelect,
    handleFileDrop,
    handleDragOver,
    handleDragLeave,
    processFile,
    importGuests,
    updateGuestName,
    deleteGuestFromPreview,
    downloadTemplate,
    resetImportState,
    clearPreview,
    revalidatePreviewForGroup,
  }
}
