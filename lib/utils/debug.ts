/**
 * Debug utility for conditional logging in development environment
 */

export const debugLog = (message: string, data?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, data)
  }
}

export const debugWarn = (message: string, data?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[WARN] ${message}`, data)
  }
}

export const debugError = (message: string, error?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${message}`, error)
  }
}