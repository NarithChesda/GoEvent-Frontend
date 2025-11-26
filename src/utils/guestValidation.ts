/**
 * Guest Validation Utilities
 *
 * Centralized validation logic for guest names and related data.
 * Used across both single guest creation and bulk import flows.
 */

// Validation constants
export const GUEST_NAME_MIN_LENGTH = 2
export const GUEST_NAME_MAX_LENGTH = 100

// Validation result type
export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate a guest name
 *
 * @param name - The guest name to validate
 * @param existingNames - Optional set of existing guest names (normalized to lowercase) for duplicate checking
 * @returns Validation result with isValid flag and optional error message
 */
export function validateGuestName(
  name: string,
  existingNames?: Set<string>
): ValidationResult {
  // Check for empty name
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is empty' }
  }

  const trimmedName = name.trim()

  // Check minimum length
  if (trimmedName.length < GUEST_NAME_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Name too short (min ${GUEST_NAME_MIN_LENGTH} characters)`,
    }
  }

  // Check maximum length
  if (trimmedName.length > GUEST_NAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Name too long (max ${GUEST_NAME_MAX_LENGTH} characters)`,
    }
  }

  // Check for duplicates against existing guests
  if (existingNames && existingNames.has(trimmedName.toLowerCase())) {
    return { isValid: false, error: 'Already exists in group' }
  }

  return { isValid: true }
}

/**
 * Sanitize a guest name
 *
 * @param name - The guest name to sanitize
 * @returns Sanitized name with trimmed whitespace and normalized spacing
 */
export function sanitizeGuestName(name: string): string {
  if (!name) return ''

  return name
    .trim()
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
}

/**
 * Build a set of existing guest names for duplicate checking
 *
 * @param names - Array of existing guest names
 * @returns Set of normalized (lowercase) names
 */
export function buildExistingNamesSet(names: string[]): Set<string> {
  return new Set(names.map((name) => name.toLowerCase().trim()))
}

/**
 * Validate multiple guest names (for bulk import)
 *
 * @param names - Array of guest names to validate
 * @param existingNames - Optional set of existing guest names for duplicate checking
 * @returns Array of validation results with name and validation status
 */
export function validateGuestNames(
  names: string[],
  existingNames?: Set<string>
): Array<{ name: string; isValid: boolean; error?: string }> {
  // Track names seen within this batch to detect duplicates within the import
  const seenInBatch = new Set<string>()

  return names.map((name) => {
    const trimmedName = sanitizeGuestName(name)
    const normalizedName = trimmedName.toLowerCase()

    // Check for duplicates within the batch
    if (seenInBatch.has(normalizedName)) {
      return {
        name: trimmedName,
        isValid: false,
        error: 'Duplicate in file',
      }
    }
    seenInBatch.add(normalizedName)

    // Validate the name
    const validation = validateGuestName(name, existingNames)
    return {
      name: trimmedName,
      isValid: validation.isValid,
      error: validation.error,
    }
  })
}

/**
 * Count valid and invalid names in a validation result
 *
 * @param results - Array of validation results
 * @returns Object with validCount and invalidCount
 */
export function countValidationResults(
  results: Array<{ isValid: boolean }>
): { validCount: number; invalidCount: number } {
  const validCount = results.filter((r) => r.isValid).length
  const invalidCount = results.filter((r) => !r.isValid).length
  return { validCount, invalidCount }
}
