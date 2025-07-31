export interface SubdomainCheckResult {
  available: boolean;
  error?: string;
}

export interface DomainVerificationResult {
  verified: boolean;
  cnameCorrect: boolean;
  dnsRecords?: DNSRecord[];
  error?: string;
  suggestions?: string[];
}

export interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl?: number;
}

export class DomainService {
  /**
   * Check if a subdomain is available
   */
  static async checkSubdomainAvailability(
    subdomain: string, 
    currentTenantId?: string
  ): Promise<SubdomainCheckResult> {
    if (!subdomain || subdomain.length < 3) {
      return { 
        available: false, 
        error: 'Subdomain moet minimaal 3 karakters bevatten' 
      };
    }

    try {
      const response = await fetch('/api/domain/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subdomain: subdomain.toLowerCase(),
          excludeTenantId: currentTenantId 
        }),
      });

      if (!response.ok) {
        throw new Error('Network error tijdens subdomain check');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error checking subdomain availability:', error);
      return {
        available: false,
        error: 'Kon subdomain beschikbaarheid niet controleren'
      };
    }
  }

  /**
   * Verify domain DNS configuration
   */
  static async verifyDomainConfiguration(
    domain: string,
    expectedTarget: string
  ): Promise<DomainVerificationResult> {
    if (!domain) {
      return {
        verified: false,
        cnameCorrect: false,
        error: 'Geen domein opgegeven'
      };
    }

    try {
      const response = await fetch('/api/domain/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          domain: domain.toLowerCase(),
          expectedTarget: expectedTarget.toLowerCase()
        }),
      });

      if (!response.ok) {
        throw new Error('Network error tijdens domein verificatie');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error verifying domain:', error);
      return {
        verified: false,
        cnameCorrect: false,
        error: 'Kon domein niet verifiëren',
        suggestions: [
          'Controleer of de DNS records correct zijn ingesteld',
          'Wacht 24-48 uur voor DNS propagatie',
          'Neem contact op met uw domein provider'
        ]
      };
    }
  }

  /**
   * Generate expected DNS records for domain setup
   */
  static generateDNSInstructions(customDomain: string, subdomain: string) {
    const target = `${subdomain}.salonsphere.nl`;
    
    return {
      cname: {
        name: customDomain.startsWith('www.') ? customDomain : `www.${customDomain}`,
        target: target,
        type: 'CNAME'
      },
      // For apex domain (if not www)
      ...(customDomain.startsWith('www.') ? {} : {
        apex: {
          name: customDomain,
          target: target,
          type: 'CNAME'
        }
      })
    };
  }

  /**
   * Format domain for display (ensure consistent formatting)
   */
  static formatDomain(domain: string): string {
    if (!domain) return '';
    
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, '') // Remove protocol
      .replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Validate domain format (more comprehensive than ValidationService)
   */
  static validateDomainFormat(domain: string): { valid: boolean; error?: string } {
    if (!domain) {
      return { valid: true }; // Optional field
    }

    const formatted = this.formatDomain(domain);
    
    // Check for valid domain format
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!domainRegex.test(formatted)) {
      return {
        valid: false,
        error: 'Voer een geldig domein in (bijv. www.mijnsalon.nl of mijnsalon.nl)'
      };
    }

    // Must have at least one dot (TLD required)
    if (!formatted.includes('.')) {
      return {
        valid: false,
        error: 'Domein moet een geldige extensie hebben (bijv. .nl, .com)'
      };
    }

    // Check for common mistakes
    if (formatted.includes('..')) {
      return {
        valid: false,
        error: 'Domein mag geen dubbele punten bevatten'
      };
    }

    return { valid: true };
  }

  /**
   * Get user-friendly status message
   */
  static getVerificationStatusMessage(
    domain: string,
    verified: boolean,
    verificationResult?: DomainVerificationResult
  ): { message: string; type: 'success' | 'warning' | 'error' | 'info' } {
    if (!domain) {
      return {
        message: 'Voer een eigen domein in om te beginnen met verificatie',
        type: 'info'
      };
    }

    if (verified) {
      return {
        message: 'Domein is geverifieerd en actief',
        type: 'success'
      };
    }

    if (verificationResult?.error) {
      return {
        message: verificationResult.error,
        type: 'error'
      };
    }

    return {
      message: 'Domein verificatie is nog bezig. Dit kan tot 48 uur duren.',
      type: 'warning'
    };
  }
}