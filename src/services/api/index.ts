/**
 * Main API exports
 * This file serves as the primary entry point for the refactored API
 */

// Re-export core infrastructure
export { apiClient, ApiClient } from './core/ApiClient'
export { networkManager, NetworkManager } from './core/NetworkManager'
export { SecureLogger } from './core/SecureLogger'

// Re-export all types
export * from './types'

// Re-export all service modules
export * from './modules'
