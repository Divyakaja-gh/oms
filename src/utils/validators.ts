/**
 * Comprehensive Statutory and Form Field Data Validators
 * Tailored for Indian CA & Corporate Advisory Practice Management
 */

import { validatePan as validatePanUtil, PanValidationResult } from './panValidator';
import { detectSqlInjection, detectNoSqlInjection, detectScriptInjection } from './securityValidators';

export { validatePanUtil as validatePan };
export type { PanValidationResult };

export interface ValidationFieldResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  metadata?: Record<string, any>;
  securityViolation?: string;
}

// Valid Indian GST State Codes
export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction'
};

/**
 * Validates a 15-character GSTIN according to statutory GST law:
 * Format: 2 digits (state code) + 10 chars (PAN) + 1 entity code + 1 'Z' + 1 check character
 */
export function validateGSTIN(gstinInput: string, correspondingPan?: string): ValidationFieldResult {
  const gstin = (gstinInput || '').trim().toUpperCase();
  if (!gstin) {
    return { isValid: true }; // Optional field if blank
  }

  const secCheck = detectSqlInjection(gstin);
  if (secCheck.isMalicious) {
    return {
      isValid: false,
      error: `Security Alert: Prohibited characters detected in GSTIN (${secCheck.patternName})`,
      securityViolation: secCheck.patternName
    };
  }

  if (gstin.length !== 15) {
    return {
      isValid: false,
      error: `GSTIN must be exactly 15 characters (currently ${gstin.length})`
    };
  }

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(gstin)) {
    return {
      isValid: false,
      error: 'Invalid statutory GSTIN structure (Expected: 2-digit State + 10-char PAN + Entity + Z + Check Digit)'
    };
  }

  const stateCode = gstin.substring(0, 2);
  const stateName = GST_STATE_CODES[stateCode];
  if (!stateName) {
    return {
      isValid: false,
      error: `Invalid GST state code "${stateCode}". Must be valid Indian state/UT code (01-38).`
    };
  }

  // Cross-verify with PAN if provided
  const embeddedPan = gstin.substring(2, 12);
  if (correspondingPan && correspondingPan.trim()) {
    const cleanPan = correspondingPan.trim().toUpperCase();
    if (cleanPan.length === 10 && cleanPan !== embeddedPan) {
      return {
        isValid: false,
        error: `GSTIN embedded PAN (${embeddedPan}) does not match client PAN (${cleanPan})`
      };
    }
  }

  return {
    isValid: true,
    metadata: {
      stateCode,
      stateName,
      embeddedPan
    }
  };
}

/**
 * Validates Tax Deduction Account Number (TAN)
 * Format: 4 letters + 5 digits + 1 letter (e.g. BLRA12345B)
 */
export function validateTAN(tanInput: string): ValidationFieldResult {
  const tan = (tanInput || '').trim().toUpperCase();
  if (!tan) {
    return { isValid: true };
  }

  const secCheck = detectSqlInjection(tan);
  if (secCheck.isMalicious) {
    return {
      isValid: false,
      error: `Security Alert: Prohibited characters detected in TAN (${secCheck.patternName})`,
      securityViolation: secCheck.patternName
    };
  }

  if (tan.length !== 10) {
    return {
      isValid: false,
      error: `TAN must be exactly 10 characters (currently ${tan.length})`
    };
  }

  const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
  if (!tanRegex.test(tan)) {
    return {
      isValid: false,
      error: 'Invalid TAN format. Must be 4 alphabets, 5 numbers, 1 alphabet (e.g., BLRA12345B)'
    };
  }

  return { isValid: true };
}

/**
 * Validates MCA Corporate Identification Number (CIN) or LLPIN
 * CIN: 21 chars e.g. U72200KA2021PTC145678
 * LLPIN: e.g. AAA-1234 or AA-1234
 */
export function validateCIN(cinInput: string): ValidationFieldResult {
  const cin = (cinInput || '').trim().toUpperCase();
  if (!cin) {
    return { isValid: true };
  }

  const secCheck = detectSqlInjection(cin);
  if (secCheck.isMalicious) {
    return {
      isValid: false,
      error: `Security Alert: Prohibited characters detected in CIN (${secCheck.patternName})`,
      securityViolation: secCheck.patternName
    };
  }

  // Check if LLPIN
  if (cin.includes('-') || cin.length <= 10) {
    const llpinRegex = /^[A-Z0-9-]{6,12}$/;
    if (!llpinRegex.test(cin)) {
      return {
        isValid: false,
        error: 'Invalid LLPIN format (e.g. AAA-1234)'
      };
    }
    return { isValid: true, metadata: { type: 'LLPIN' } };
  }

  if (cin.length !== 21) {
    return {
      isValid: false,
      error: `MCA CIN must be 21 characters (currently ${cin.length})`
    };
  }

  // CIN regex: Listing(L/U) + 5 digit Industry + 2 char State + 4 digit Year + 3 char Classification (PTC/PLC/FTC/GAP) + 6 digit sequence
  const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
  if (!cinRegex.test(cin)) {
    return {
      isValid: false,
      error: 'Invalid MCA CIN format (Expected: L/U + 5-digit Industry + State + Year + Type + 6 digits)'
    };
  }

  return { isValid: true, metadata: { type: 'CIN' } };
}

/**
 * Validates an Indian Mobile / Telephone Number
 */
export function validatePhone(phoneInput: string): ValidationFieldResult {
  const phone = (phoneInput || '').trim().replace(/[\s\-\(\)]/g, '');
  if (!phone) {
    return { isValid: true };
  }

  const secCheck = detectSqlInjection(phone);
  if (secCheck.isMalicious) {
    return {
      isValid: false,
      error: `Security Alert: Prohibited characters detected in Phone number`,
      securityViolation: secCheck.patternName
    };
  }

  // Handle +91 prefix
  const cleaned = phone.startsWith('+91') ? phone.slice(3) : phone.startsWith('0') ? phone.slice(1) : phone;

  if (cleaned.length !== 10) {
    return {
      isValid: false,
      error: `Phone number must have 10 digits (currently ${cleaned.length})`
    };
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Indian mobile numbers must begin with 6, 7, 8, or 9'
    };
  }

  return { isValid: true, metadata: { formatted: `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}` } };
}

/**
 * Validates Email Address
 */
export function validateEmail(emailInput: string): ValidationFieldResult {
  const email = (emailInput || '').trim();
  if (!email) {
    return { isValid: true };
  }

  const secCheck = detectSqlInjection(email);
  if (secCheck.isMalicious) {
    return {
      isValid: false,
      error: `Security Alert: Prohibited injection sequence in email address`,
      securityViolation: secCheck.patternName
    };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address (e.g. user@domain.com)'
    };
  }

  return { isValid: true };
}

/**
 * Validates Indian 6-digit PIN Code
 */
export function validatePincode(pincodeInput: string): ValidationFieldResult {
  const pin = (pincodeInput || '').trim();
  if (!pin) {
    return { isValid: true };
  }

  const secCheck = detectSqlInjection(pin);
  if (secCheck.isMalicious) {
    return {
      isValid: false,
      error: `Security Alert: Prohibited injection characters in PIN code`,
      securityViolation: secCheck.patternName
    };
  }

  if (pin.length !== 6) {
    return {
      isValid: false,
      error: `PIN code must be exactly 6 digits (currently ${pin.length})`
    };
  }

  const pinRegex = /^[1-9][0-9]{5}$/;
  if (!pinRegex.test(pin)) {
    return {
      isValid: false,
      error: 'Invalid PIN code. Must not start with 0 and contain only numbers.'
    };
  }

  return { isValid: true };
}

/**
 * Validates Support Ticket Fields
 */
export interface SupportTicketValidationInput {
  subject: string;
  description: string;
  category: string;
  priority: string;
  requesterEmail?: string;
  attachment?: File | null;
}

export function validateSupportTicket(input: SupportTicketValidationInput): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Security Check 1: Subject
  const secSubject = detectSqlInjection(input.subject);
  if (secSubject.isMalicious) {
    errors.subject = `Security Alert: SQL injection pattern detected in subject (${secSubject.patternName}).`;
  } else {
    const cleanSubject = (input.subject || '').trim();
    if (!cleanSubject) {
      errors.subject = 'Subject is required.';
    } else if (cleanSubject.length < 3) {
      errors.subject = 'Subject must be at least 3 characters.';
    } else if (cleanSubject.length > 200) {
      errors.subject = 'Subject cannot exceed 200 characters.';
    }
  }

  // Security Check 2: Description
  const secDesc = detectSqlInjection(input.description);
  if (secDesc.isMalicious) {
    errors.description = `Security Alert: SQL injection pattern detected in description (${secDesc.patternName}).`;
  } else {
    const cleanDescription = (input.description || '').trim();
    if (!cleanDescription) {
      errors.description = 'Description is required.';
    } else if (cleanDescription.length < 10) {
      errors.description = 'Please provide sufficient detail (at least 10 characters).';
    } else if (cleanDescription.length > 4000) {
      errors.description = 'Description cannot exceed 4000 characters.';
    }
  }

  if (!input.category || !input.category.trim()) {
    errors.category = 'Please select a ticket category.';
  }

  if (!['High', 'Medium', 'Low'].includes(input.priority)) {
    errors.priority = 'Priority must be High, Medium, or Low.';
  }

  if (input.requesterEmail && input.requesterEmail.trim()) {
    const emailRes = validateEmail(input.requesterEmail);
    if (!emailRes.isValid && emailRes.error) {
      errors.requesterEmail = emailRes.error;
    }
  }

  if (input.attachment) {
    const MAX_SIZE_MB = 10;
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'xlsx', 'xls', 'docx', 'doc', 'zip', 'csv', 'txt'];
    const extension = input.attachment.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(extension)) {
      errors.attachment = `Unsupported file type (.${extension}). Allowed: PDF, PNG, JPG, XLSX, DOCX, ZIP.`;
    } else if (input.attachment.size > MAX_SIZE_MB * 1024 * 1024) {
      errors.attachment = `File size (${(input.attachment.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${MAX_SIZE_MB}MB.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
