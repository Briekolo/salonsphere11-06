export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class ValidationService {
  // Email validation
  static validateEmail(email: string): ValidationResult {
    if (!email) {
      return { isValid: false, error: 'Email is verplicht' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Voer een geldig emailadres in' };
    }
    
    return { isValid: true };
  }

  // Phone validation (Dutch format)
  static validatePhone(phone: string): ValidationResult {
    if (!phone) {
      return { isValid: true }; // Phone is optional
    }
    
    // Remove all spaces, dashes, and parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Dutch phone number formats: +31, 0031, or 06
    const phoneRegex = /^(\+31|0031|0)[1-9]\d{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return { isValid: false, error: 'Voer een geldig Nederlands telefoonnummer in' };
    }
    
    return { isValid: true };
  }

  // VAT number validation (Dutch format)
  static validateVATNumber(vatNumber: string): ValidationResult {
    if (!vatNumber) {
      return { isValid: true }; // VAT number is optional
    }
    
    // Remove spaces and convert to uppercase
    const cleanVAT = vatNumber.replace(/\s/g, '').toUpperCase();
    
    // Dutch VAT format: NL + 9 digits + B + 2 digits
    const vatRegex = /^NL\d{9}B\d{2}$/;
    if (!vatRegex.test(cleanVAT)) {
      return { isValid: false, error: 'BTW nummer moet het formaat NL123456789B01 hebben' };
    }
    
    return { isValid: true };
  }

  // Chamber of Commerce validation (Dutch KvK)
  static validateKvKNumber(kvkNumber: string): ValidationResult {
    if (!kvkNumber) {
      return { isValid: true }; // KvK number is optional
    }
    
    // Remove spaces
    const cleanKvK = kvkNumber.replace(/\s/g, '');
    
    // Dutch KvK format: 8 digits
    const kvkRegex = /^\d{8}$/;
    if (!kvkRegex.test(cleanKvK)) {
      return { isValid: false, error: 'KvK nummer moet 8 cijfers bevatten' };
    }
    
    return { isValid: true };
  }

  // Postal code validation (Dutch format)
  static validatePostalCode(postalCode: string): ValidationResult {
    if (!postalCode) {
      return { isValid: true }; // Postal code is optional
    }
    
    // Remove spaces and convert to uppercase
    const cleanCode = postalCode.replace(/\s/g, '').toUpperCase();
    
    // Dutch postal code format: 4 digits + 2 letters
    const postalRegex = /^\d{4}[A-Z]{2}$/;
    if (!postalRegex.test(cleanCode)) {
      return { isValid: false, error: 'Postcode moet het formaat 1234AB hebben' };
    }
    
    return { isValid: true };
  }

  // Subdomain validation
  static validateSubdomain(subdomain: string): ValidationResult {
    if (!subdomain) {
      return { isValid: false, error: 'Subdomain is verplicht' };
    }
    
    // Subdomain rules: alphanumeric + hyphens, 3-63 chars, no consecutive hyphens
    const subdomainRegex = /^[a-z0-9]([a-z0-9\-]{1,61}[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain.toLowerCase())) {
      return { isValid: false, error: 'Subdomain mag alleen letters, cijfers en streepjes bevatten (3-63 karakters)' };
    }
    
    // Check for consecutive hyphens
    if (subdomain.includes('--')) {
      return { isValid: false, error: 'Subdomain mag geen opeenvolgende streepjes bevatten' };
    }
    
    return { isValid: true };
  }

  // Domain validation
  static validateDomain(domain: string): ValidationResult {
    if (!domain) {
      return { isValid: true }; // Custom domain is optional
    }
    
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domain)) {
      return { isValid: false, error: 'Voer een geldig domein in (bijv. www.mijnsalon.nl)' };
    }
    
    return { isValid: true };
  }

  // Time validation
  static validateTime(startTime: string, endTime: string): ValidationResult {
    if (!startTime || !endTime) {
      return { isValid: false, error: 'Begin- en eindtijd zijn verplicht' };
    }
    
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    if (start >= end) {
      return { isValid: false, error: 'Eindtijd moet na begintijd liggen' };
    }
    
    // Check for realistic business hours
    const startHour = start.getHours();
    const endHour = end.getHours();
    
    if (startHour < 6) {
      return { isValid: false, error: 'Openingstijd voor 06:00 lijkt onrealistisch vroeg' };
    }
    
    if (endHour > 23) {
      return { isValid: false, error: 'Sluitingstijd na 23:00 lijkt onrealistisch laat' };
    }
    
    // Check for overly long business hours (more than 16 hours)
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours > 16) {
      return { isValid: false, error: 'Meer dan 16 uur open per dag lijkt onrealistisch lang' };
    }
    
    return { isValid: true };
  }

  // Break time validation
  static validateBreakTime(breakStart: string, breakEnd: string, businessStart: string, businessEnd: string): ValidationResult {
    if (!breakStart || !breakEnd) {
      return { isValid: false, error: 'Pauze begin- en eindtijd zijn verplicht' };
    }
    
    const breakStartTime = new Date(`2000-01-01T${breakStart}:00`);
    const breakEndTime = new Date(`2000-01-01T${breakEnd}:00`);
    const businessStartTime = new Date(`2000-01-01T${businessStart}:00`);
    const businessEndTime = new Date(`2000-01-01T${businessEnd}:00`);
    
    if (breakStartTime >= breakEndTime) {
      return { isValid: false, error: 'Pauze eindtijd moet na begintijd liggen' };
    }
    
    if (breakStartTime < businessStartTime || breakEndTime > businessEndTime) {
      return { isValid: false, error: 'Pauze moet binnen openingstijden vallen' };
    }
    
    // Check minimum break duration (15 minutes)
    const breakDuration = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60);
    if (breakDuration < 15) {
      return { isValid: false, error: 'Pauze moet minimaal 15 minuten duren' };
    }
    
    // Check maximum break duration (4 hours)
    if (breakDuration > 240) {
      return { isValid: false, error: 'Pauze mag maximaal 4 uur duren' };
    }
    
    return { isValid: true };
  }

  // Validate overlapping breaks
  static validateBreakOverlaps(breaks: Array<{start: string, end: string}>): ValidationResult {
    for (let i = 0; i < breaks.length; i++) {
      for (let j = i + 1; j < breaks.length; j++) {
        const break1Start = new Date(`2000-01-01T${breaks[i].start}:00`);
        const break1End = new Date(`2000-01-01T${breaks[i].end}:00`);
        const break2Start = new Date(`2000-01-01T${breaks[j].start}:00`);
        const break2End = new Date(`2000-01-01T${breaks[j].end}:00`);
        
        // Check for overlap
        if (break1Start < break2End && break2Start < break1End) {
          return { isValid: false, error: 'Pauzes mogen niet overlappen' };
        }
      }
    }
    
    return { isValid: true };
  }

  // VAT rate validation
  static validateVATRate(rate: number): ValidationResult {
    if (rate < 0 || rate > 100) {
      return { isValid: false, error: 'BTW tarief moet tussen 0% en 100% liggen' };
    }
    
    return { isValid: true };
  }

  // Overhead amount validation
  static validateOverheadAmount(amount: number): ValidationResult {
    if (amount < 0) {
      return { isValid: false, error: 'Overhead kosten kunnen niet negatief zijn' };
    }
    
    if (amount > 1000000) {
      return { isValid: false, error: 'Overhead kosten lijken onrealistisch hoog' };
    }
    
    return { isValid: true };
  }
}