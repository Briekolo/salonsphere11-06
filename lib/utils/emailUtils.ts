/**
 * Enhanced email handling utility for desktop and mobile browsers
 * Provides multiple fallback methods to ensure email functionality works across different environments
 */

type ToastFunction = (message: string, type: 'success' | 'error' | 'info' | 'warning') => void

interface EmailHandlerOptions {
  showToast: ToastFunction
  debugMode?: boolean
}

/**
 * Detects if the user is on a desktop or mobile device
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  const mobileKeywords = ['mobile', 'iphone', 'ipad', 'android', 'blackberry', 'windows phone']
  
  return !mobileKeywords.some(keyword => userAgent.includes(keyword))
}

/**
 * Detects the browser type for specific handling
 */
export function getBrowserType(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  
  if (userAgent.includes('chrome')) return 'chrome'
  if (userAgent.includes('firefox')) return 'firefox'
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari'
  if (userAgent.includes('edge')) return 'edge'
  
  return 'unknown'
}

/**
 * Attempts to open an email client using multiple fallback methods
 * Specifically optimized for desktop browser compatibility
 */
export async function handleEmailClick(email: string, options: EmailHandlerOptions): Promise<void> {
  const { showToast, debugMode = false } = options
  
  if (!email || !email.trim()) {
    showToast('Deze klant heeft geen e-mailadres', 'warning')
    return
  }
  
  const cleanEmail = email.trim()
  const desktop = isDesktop()
  const browser = getBrowserType()
  
  if (debugMode) {
    console.log('Email handler called:', {
      email: cleanEmail,
      desktop,
      browser,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
    })
  }
  
  // Method 1: Invisible anchor element (most reliable for desktop)
  try {
    if (debugMode) console.log('Trying Method 1: Invisible anchor element')
    
    const link = document.createElement('a')
    link.href = `mailto:${cleanEmail}`
    link.style.display = 'none'
    link.style.position = 'absolute'
    link.style.left = '-9999px'
    
    // Add to DOM
    document.body.appendChild(link)
    
    // Create and dispatch click event
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
    
    link.dispatchEvent(clickEvent)
    
    // Clean up
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link)
      }
    }, 100)
    
    if (debugMode) console.log('Method 1 completed successfully')
    return
    
  } catch (error) {
    if (debugMode) console.error('Method 1 failed:', error)
  }
  
  // Method 2: window.location.assign (good for some desktop browsers)
  try {
    if (debugMode) console.log('Trying Method 2: window.location.assign')
    
    window.location.assign(`mailto:${cleanEmail}`)
    
    if (debugMode) console.log('Method 2 completed successfully')
    return
    
  } catch (error) {
    if (debugMode) console.error('Method 2 failed:', error)
  }
  
  // Method 3: window.open with different parameters
  try {
    if (debugMode) console.log('Trying Method 3: window.open with _blank')
    
    const popup = window.open(`mailto:${cleanEmail}`, '_blank', 'noopener,noreferrer')
    
    // Check if popup was blocked
    if (popup === null || typeof popup === 'undefined') {
      throw new Error('Popup blocked')
    }
    
    // Try to close the popup immediately (it should have opened the email client)
    setTimeout(() => {
      try {
        if (popup && !popup.closed) {
          popup.close()
        }
      } catch (e) {
        // Ignore errors when closing popup
      }
    }, 100)
    
    if (debugMode) console.log('Method 3 completed successfully')
    return
    
  } catch (error) {
    if (debugMode) console.error('Method 3 failed:', error)
  }
  
  // Method 4: window.location.href (traditional fallback)
  try {
    if (debugMode) console.log('Trying Method 4: window.location.href')
    
    window.location.href = `mailto:${cleanEmail}`
    
    if (debugMode) console.log('Method 4 completed successfully')
    return
    
  } catch (error) {
    if (debugMode) console.error('Method 4 failed:', error)
  }
  
  // Method 5: Copy to clipboard as final fallback
  try {
    if (debugMode) console.log('Trying Method 5: Copy to clipboard')
    
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(cleanEmail)
      showToast(`E-mailadres gekopieerd: ${cleanEmail}`, 'info')
      if (debugMode) console.log('Method 5 (modern clipboard) successful')
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea')
      textArea.value = cleanEmail
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      textArea.style.top = '-9999px'
      
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        showToast(`E-mailadres gekopieerd: ${cleanEmail}`, 'info')
        if (debugMode) console.log('Method 5 (legacy clipboard) successful')
      } else {
        throw new Error('Copy command failed')
      }
    }
    
  } catch (error) {
    if (debugMode) console.error('Method 5 failed:', error)
    
    // Final fallback: show the email address to user
    showToast(`E-mailadres: ${cleanEmail} (handmatig kopiëren)`, 'error')
  }
}

/**
 * Handles phone number clicks (kept for consistency)
 */
export function handlePhoneClick(phone: string, options: EmailHandlerOptions): void {
  const { showToast, debugMode = false } = options
  
  if (!phone || !phone.trim()) {
    showToast('Deze klant heeft geen telefoonnummer', 'warning')
    return
  }
  
  const cleanPhone = phone.trim()
  
  if (debugMode) {
    console.log('Phone handler called:', {
      phone: cleanPhone,
      desktop: isDesktop(),
      browser: getBrowserType()
    })
  }
  
  try {
    // Use the same invisible anchor method for consistency
    const link = document.createElement('a')
    link.href = `tel:${cleanPhone}`
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link)
      }
    }, 100)
    
    if (debugMode) console.log('Phone handler completed successfully')
    
  } catch (error) {
    if (debugMode) console.error('Phone handler failed:', error)
    
    // Fallback to window.open
    try {
      window.open(`tel:${cleanPhone}`, '_self')
    } catch (fallbackError) {
      showToast('Kon telefoonnummer niet bellen', 'error')
    }
  }
}