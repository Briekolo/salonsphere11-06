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
    console.error(`[ERROR] ${message}`)
    
    if (error) {
      // Extract all possible error information
      const errorInfo: any = {
        message: error?.message || 'No message',
        code: error?.code || 'No code',
        details: error?.details || 'No details',
        hint: error?.hint || 'No hint',
        statusCode: error?.statusCode || error?.status || 'No status code',
      }
      
      // Check for Supabase/PostgreSQL specific error properties
      if (error?.error) {
        errorInfo.nestedError = {
          message: error.error?.message,
          code: error.error?.code,
          details: error.error?.details,
        }
      }
      
      // Log the full error object structure
      console.error('Error details:', errorInfo)
      
      // Also log the raw error to see all properties
      console.error('Raw error object:', error)
      
      // If error has a stack trace, log it separately
      if (error?.stack) {
        console.error('Stack trace:', error.stack)
      }
    }
  }
}