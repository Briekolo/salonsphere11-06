import DOMPurify from 'dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks while preserving safe formatting
 * Used for email template previews and other user-generated HTML content
 */
export function sanitizeHtml(html: string): string {
  // Only run DOMPurify on the client side
  if (typeof window === 'undefined') {
    // On server-side, return empty string for safety
    // Email templates are only previewed on client side
    return ''
  }

  // Configure DOMPurify for email template context
  const config = {
    // Allow common HTML tags used in emails
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'div', 'span', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'u', 'mark',
      'a', 'img',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'blockquote', 'code', 'pre',
      'style'
    ],
    // Allow safe attributes
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title',
      'class', 'id', 'style',
      'width', 'height',
      'align', 'valign',
      'colspan', 'rowspan',
      'target', 'rel'
    ],
    // Allow data URIs for images (base64 encoded images)
    ALLOW_DATA_ATTR: false,
    // Keep styles for email formatting
    KEEP_CONTENT: true,
    // Don't allow any script tags or event handlers
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  }

  return DOMPurify.sanitize(html, config)
}

/**
 * Sanitize HTML for search highlighting
 * More restrictive - only allows mark tags for highlighting
 */
export function sanitizeSearchHighlight(html: string): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const config = {
    // Only allow mark tags for search highlighting
    ALLOWED_TAGS: ['mark'],
    ALLOWED_ATTR: ['class'],
    KEEP_CONTENT: true
  }

  return DOMPurify.sanitize(html, config)
}