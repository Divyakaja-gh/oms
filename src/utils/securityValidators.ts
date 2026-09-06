/**
 * Enterprise Data Validation & Anti-Injection Defense Suite
 * SOC2 CC6.6 & CC6.8 Compliant
 * 
 * Protects against:
 * 1. SQL Injection (Tautologies, UNION-based, Stacked/Piggybacked queries, Blind/Time-based, System Stored Procedures)
 * 2. NoSQL / Object Injection ($where, $regex, $gt, $ne operator injection)
 * 3. Cross-Site Scripting (XSS / Stored HTML script tags)
 * 4. Formula / CSV Injection (=, +, -, @ prefix execution)
 * 5. Data integrity violations across all CAOMS field blocks
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: any;
  securityViolation?: 'SQL_INJECTION' | 'NOSQL_INJECTION' | 'XSS_SCRIPT' | 'FORMULA_INJECTION' | 'MALFORMED_INPUT';
  detectedPattern?: string;
}

// ---------------------------------------------------------------------------
// 1. SQL INJECTION REGEX PATTERNS (Case-insensitive, multiline, comment-aware)
// ---------------------------------------------------------------------------

const SQL_INJECTION_PATTERNS: { name: string; regex: RegExp }[] = [
  // Classic boolean tautologies: ' OR '1'='1', " or ""="", ' or 1=1 --
  {
    name: 'Boolean Tautology Injection',
    regex: /(?:'|"|`)\s*(?:or|and)\s*(?:'|"|`|true|1|2|\d+)\s*=\s*(?:'|"|`|true|1|2|\d+)/i
  },
  {
    name: 'Classic Numeric OR 1=1 Injection',
    regex: /\b(?:or|and)\s+(?:1\s*=\s*1|0\s*=\s*0|true|false)\b(?:\s*--|\s*\/\*|\s*#|\s*$)/i
  },
  // UNION SELECT queries
  {
    name: 'UNION SELECT Vector',
    regex: /\bunion\s+(?:all\s+)?select\b/i
  },
  // Stacked dangerous DDL/DML statements following quotes or semicolons: ; DROP TABLE, ; DELETE FROM, ; TRUNCATE
  {
    name: 'Stacked DDL/DML Command Injection',
    regex: /;\s*(?:drop\s+(?:table|database|schema|view)|truncate\s+table|delete\s+from|alter\s+table|grant\s+all|insert\s+into)\b/i
  },
  // In-line destructive SQL statements starting with quote: ' ; DROP TABLE
  {
    name: 'Destructive DDL Command Pattern',
    regex: /(?:'|"|`)\s*;\s*(?:drop|delete|truncate|update|insert)\b/i
  },
  // Comment markers used to truncate queries: --, /* */, #
  {
    name: 'SQL Comment Delimiter Injection',
    regex: /(?:'|"|`)\s*(?:--|\/\*|#)/i
  },
  // System stored procedures: xp_cmdshell, sp_executesql
  {
    name: 'System Stored Procedure Execution',
    regex: /\b(?:xp_cmdshell|sp_executesql|sp_oacreate|xp_regread)\b/i
  },
  // Time-based blind SQL injection: WAITFOR DELAY, BENCHMARK, PG_SLEEP, SLEEP(
  {
    name: 'Time-based Blind SQL Injection',
    regex: /\b(?:waitfor\s+delay|benchmark\s*\(|pg_sleep\s*\(|sleep\s*\()\b/i
  },
  // Information schema & database metadata extraction
  {
    name: 'Schema Reconnaissance Vector',
    regex: /\b(?:information_schema\.(?:tables|columns|schemata)|sys\.objects|sys\.tables|sysobjects)\b/i
  },
  // File read/write injection: LOAD_FILE, INTO OUTFILE, INTO DUMPFILE
  {
    name: 'File System SQL Outfile Vector',
    regex: /\b(?:load_file\s*\(|into\s+(?:outfile|dumpfile))\b/i
  },
  // SQL Execution functions
  {
    name: 'Direct EXEC SQL Vector',
    regex: /\b(?:exec|execute)\s*\(\s*(?:'|"|@)/i
  }
];

// ---------------------------------------------------------------------------
// 2. NOSQL & SCRIPT INJECTION PATTERNS
// ---------------------------------------------------------------------------

const NOSQL_INJECTION_PATTERNS: { name: string; regex: RegExp }[] = [
  {
    name: 'NoSQL Operator Injection ($where, $regex, $gt, $ne)',
    regex: /(?:^|[^\w])\$(?:where|regex|gt|gte|lt|lte|ne|nin|in|exists|all|elemMatch|expr)\b/i
  },
  {
    name: 'NoSQL JavaScript Evaluation ($where function)',
    regex: /\$where\s*:\s*(?:function|['"`])/i
  }
];

const SCRIPT_INJECTION_PATTERNS: { name: string; regex: RegExp }[] = [
  {
    name: 'HTML Script Tag',
    regex: /<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/i
  },
  {
    name: 'Inline Event Handler (onload, onerror, onclick)',
    regex: /<[^>]+on\w+\s*=\s*(?:'|")[^'"]*(?:'|")[^>]*>/i
  },
  {
    name: 'JavaScript URI Scheme',
    regex: /javascript\s*:[^'"]*/i
  }
];

// ---------------------------------------------------------------------------
// 3. CORE INJECTION DETECTION ENGINES
// ---------------------------------------------------------------------------

/**
 * Inspects any text input for SQL injection patterns
 */
export function detectSqlInjection(input: unknown): { isMalicious: boolean; patternName?: string; matched?: string } {
  if (typeof input !== 'string') return { isMalicious: false };
  const raw = input.trim();
  if (!raw) return { isMalicious: false };

  // URL-decode if needed to prevent obfuscation bypass (e.g. %27%20OR%201=1)
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Keep original if not URI encoded
  }

  // Check normalized strings (both original and decoded)
  const targets = [raw, decoded];

  for (const target of targets) {
    for (const rule of SQL_INJECTION_PATTERNS) {
      const match = rule.regex.exec(target);
      if (match) {
        return {
          isMalicious: true,
          patternName: rule.name,
          matched: match[0]
        };
      }
    }
  }

  return { isMalicious: false };
}

/**
 * Inspects any input for NoSQL / MongoDB operator injection
 */
export function detectNoSqlInjection(input: unknown): { isMalicious: boolean; patternName?: string } {
  if (typeof input !== 'string') return { isMalicious: false };
  const raw = input.trim();
  if (!raw) return { isMalicious: false };

  for (const rule of NOSQL_INJECTION_PATTERNS) {
    if (rule.regex.test(raw)) {
      return { isMalicious: true, patternName: rule.name };
    }
  }
  return { isMalicious: false };
}

/**
 * Inspects any input for Cross-Site Scripting (XSS)
 */
export function detectScriptInjection(input: unknown): { isMalicious: boolean; patternName?: string } {
  if (typeof input !== 'string') return { isMalicious: false };
  const raw = input.trim();
  if (!raw) return { isMalicious: false };

  for (const rule of SCRIPT_INJECTION_PATTERNS) {
    if (rule.regex.test(raw)) {
      return { isMalicious: true, patternName: rule.name };
    }
  }
  return { isMalicious: false };
}

/**
 * Strips dangerous control chars, null bytes, and escapes formula triggers
 */
export function sanitizeInputString(value: unknown): string {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // Strip null bytes and non-printable control characters (except newline \n and tab \t)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Strip formula injection prefixes for CSV/Excel safety (=, +, -, @, \t, \r)
  // If a user entered "=SUM(A1:A10)", prepend a single quote to neutralize formula execution in spreadsheets
  if (/^[=\+\-@\t\r]/.test(str.trim())) {
    str = `'${str}`;
  }

  return str.trim();
}

/**
 * Master Security Sanity Check on any string input
 */
export function verifySecurityIntegrity(input: unknown, fieldLabel: string = 'Field'): ValidationResult {
  if (typeof input !== 'string') {
    return { isValid: true, sanitizedValue: input };
  }

  const sanitized = sanitizeInputString(input);

  // Check 1: SQL Injection
  const sqlCheck = detectSqlInjection(sanitized);
  if (sqlCheck.isMalicious) {
    return {
      isValid: false,
      error: `Security Alert: SQL injection pattern detected in ${fieldLabel}. (${sqlCheck.patternName})`,
      securityViolation: 'SQL_INJECTION',
      detectedPattern: sqlCheck.patternName
    };
  }

  // Check 2: NoSQL Injection
  const noSqlCheck = detectNoSqlInjection(sanitized);
  if (noSqlCheck.isMalicious) {
    return {
      isValid: false,
      error: `Security Alert: Unauthorized NoSQL operator detected in ${fieldLabel}. (${noSqlCheck.patternName})`,
      securityViolation: 'NOSQL_INJECTION',
      detectedPattern: noSqlCheck.patternName
    };
  }

  // Check 3: Script / XSS Injection
  const xssCheck = detectScriptInjection(sanitized);
  if (xssCheck.isMalicious) {
    return {
      isValid: false,
      error: `Security Alert: Script tag / executable markup detected in ${fieldLabel}.`,
      securityViolation: 'XSS_SCRIPT',
      detectedPattern: xssCheck.patternName
    };
  }

  return {
    isValid: true,
    sanitizedValue: sanitized
  };
}

// ---------------------------------------------------------------------------
// 4. FIELD-SPECIFIC STRICT VALIDATORS
// ---------------------------------------------------------------------------

/**
 * Validates Entity Name / Business Legal Name
 */
export function validateEntityName(name: unknown): ValidationResult {
  const sec = verifySecurityIntegrity(name, 'Entity Name');
  if (!sec.isValid) return sec;

  const val = (name as string || '').trim();
  if (!val) {
    return { isValid: false, error: 'Entity/Client legal name is required.' };
  }
  if (val.length < 2) {
    return { isValid: false, error: 'Entity name must be at least 2 characters long.' };
  }
  if (val.length > 200) {
    return { isValid: false, error: 'Entity name cannot exceed 200 characters.' };
  }
  // Whitelist standard Indian business entity characters: letters, numbers, spaces, periods, ampersands, hyphens, brackets, slashes, commas
  const legalNameRegex = /^[a-zA-Z0-9\s.,&'()\/\-#]+$/;
  if (!legalNameRegex.test(val)) {
    return { isValid: false, error: 'Entity name contains invalid characters. Only alphanumeric, spaces, and standard corporate symbols (&, ., /, -, (), #) are permitted.' };
  }

  return { isValid: true, sanitizedValue: val };
}

/**
 * Validates Contact Person Name
 */
export function validatePersonName(name: unknown, fieldLabel: string = 'Contact Person'): ValidationResult {
  const sec = verifySecurityIntegrity(name, fieldLabel);
  if (!sec.isValid) return sec;

  const val = (name as string || '').trim();
  if (!val) {
    return { isValid: false, error: `${fieldLabel} name is required.` };
  }
  if (val.length < 2) {
    return { isValid: false, error: `${fieldLabel} must be at least 2 characters.` };
  }
  if (val.length > 100) {
    return { isValid: false, error: `${fieldLabel} cannot exceed 100 characters.` };
  }
  // Allow letters, dots, spaces, hyphens, single quotes (e.g. CA Aarav Patel, Dr. K. K. Tej, O'Connor)
  const nameRegex = /^[a-zA-Z\s.'\-]+$/;
  if (!nameRegex.test(val)) {
    return { isValid: false, error: `${fieldLabel} must contain only letters, dots, and hyphens.` };
  }

  return { isValid: true, sanitizedValue: val };
}

/**
 * Validates Designation (e.g. Director, Partner, CFO, Managing Director)
 */
export function validateDesignation(desig: unknown): ValidationResult {
  const sec = verifySecurityIntegrity(desig, 'Designation');
  if (!sec.isValid) return sec;

  const val = (desig as string || '').trim();
  if (!val) return { isValid: true, sanitizedValue: '' };
  if (val.length > 80) return { isValid: false, error: 'Designation cannot exceed 80 characters.' };
  if (!/^[a-zA-Z0-9\s.,\/\-()]+$/.test(val)) {
    return { isValid: false, error: 'Designation contains invalid characters.' };
  }
  return { isValid: true, sanitizedValue: val };
}

/**
 * Validates Udyam Registration Number (e.g. UDYAM-KR-03-0012345)
 */
export function validateUdyamNumber(udyam: unknown): ValidationResult {
  const sec = verifySecurityIntegrity(udyam, 'Udyam Registration Number');
  if (!sec.isValid) return sec;

  const val = (udyam as string || '').trim().toUpperCase();
  if (!val) return { isValid: true, sanitizedValue: '' }; // Optional

  // Format: UDYAM-XX-00-0000000 (UDYAM followed by 2-letter state code, 2-digit district code, 7-digit sequential number)
  const udyamRegex = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;
  if (!udyamRegex.test(val)) {
    return {
      isValid: false,
      error: 'Invalid Udyam Number format. Expected format: UDYAM-XX-00-0000000 (e.g. UDYAM-KR-03-0012345)'
    };
  }

  return { isValid: true, sanitizedValue: val };
}

/**
 * Validates Agreed Fee / Financial Amount (Must be numeric and non-negative)
 */
export function validateMonetaryAmount(amount: unknown, fieldLabel: string = 'Amount', min: number = 0, max: number = 1000000000): ValidationResult {
  if (amount === '' || amount === null || amount === undefined) {
    return { isValid: false, error: `${fieldLabel} is required.` };
  }

  // Security check in case passed as string
  const sec = verifySecurityIntegrity(amount, fieldLabel);
  if (!sec.isValid) return sec;

  const num = Number(amount);
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldLabel} must be a valid numeric amount.` };
  }
  if (num < min) {
    return { isValid: false, error: `${fieldLabel} cannot be less than ₹${min.toLocaleString()}.` };
  }
  if (num > max) {
    return { isValid: false, error: `${fieldLabel} exceeds maximum allowed value of ₹${max.toLocaleString()}.` };
  }

  return { isValid: true, sanitizedValue: num };
}

/**
 * Validates Task Title / Statutory Filing Name
 */
export function validateTaskTitle(title: unknown): ValidationResult {
  const sec = verifySecurityIntegrity(title, 'Task Title');
  if (!sec.isValid) return sec;

  const val = (title as string || '').trim();
  if (!val) {
    return { isValid: false, error: 'Task title is required.' };
  }
  if (val.length < 3) {
    return { isValid: false, error: 'Task title must be at least 3 characters.' };
  }
  if (val.length > 200) {
    return { isValid: false, error: 'Task title cannot exceed 200 characters.' };
  }
  if (!/^[a-zA-Z0-9\s.,\-_()&/#'":]+$/.test(val)) {
    return { isValid: false, error: 'Task title contains invalid characters.' };
  }

  return { isValid: true, sanitizedValue: val };
}

/**
 * Validates Secret / Credential Name
 */
export function validateSecretName(name: unknown): ValidationResult {
  const sec = verifySecurityIntegrity(name, 'Secret Name');
  if (!sec.isValid) return sec;

  const val = (name as string || '').trim();
  if (!val) {
    return { isValid: false, error: 'Secret name / label is required.' };
  }
  if (val.length < 3) {
    return { isValid: false, error: 'Secret name must be at least 3 characters.' };
  }
  if (val.length > 150) {
    return { isValid: false, error: 'Secret name cannot exceed 150 characters.' };
  }
  if (!/^[a-zA-Z0-9\s.,\-_()&/#'"]+$/.test(val)) {
    return { isValid: false, error: 'Secret name contains invalid characters.' };
  }

  return { isValid: true, sanitizedValue: val };
}

/**
 * Validates Credential Secret Value / Password / Token
 */
export function validateSecretValue(val: unknown): ValidationResult {
  if (typeof val !== 'string' || !val.trim()) {
    return { isValid: false, error: 'Secret credential value cannot be empty.' };
  }
  const clean = val.trim();
  if (clean.length < 6) {
    return { isValid: false, error: 'Secret value must be at least 6 characters long.' };
  }
  if (clean.length > 4096) {
    return { isValid: false, error: 'Secret value exceeds maximum storage buffer of 4096 characters.' };
  }
  // Strip null bytes
  const sanitized = clean.replace(/\x00/g, '');
  return { isValid: true, sanitizedValue: sanitized };
}

/**
 * Validates Portal URL (e.g. GST portal, MCA, Income Tax e-filing)
 */
export function validatePortalUrl(url: unknown): ValidationResult {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { isValid: true, sanitizedValue: '' }; // Optional
  }
  const sec = verifySecurityIntegrity(url, 'Portal URL');
  if (!sec.isValid) return sec;

  const clean = url.trim();
  if (clean.length > 500) {
    return { isValid: false, error: 'URL cannot exceed 500 characters.' };
  }
  try {
    const parsed = new URL(clean);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, error: 'URL protocol must be HTTP or HTTPS.' };
    }
  } catch {
    return { isValid: false, error: 'Please enter a valid URL (e.g. https://eportal.incometax.gov.in).' };
  }

  return { isValid: true, sanitizedValue: clean };
}

/**
 * Validates Freeform Text / Notes / Descriptions with Anti-SQL-Injection enforcement
 */
export function validateSafeText(
  text: unknown,
  fieldLabel: string = 'Description',
  options: { required?: boolean; minLength?: number; maxLength?: number } = {}
): ValidationResult {
  const { required = false, minLength = 0, maxLength = 5000 } = options;
  const sec = verifySecurityIntegrity(text, fieldLabel);
  if (!sec.isValid) return sec;

  const val = (text as string || '').trim();
  if (!val && required) {
    return { isValid: false, error: `${fieldLabel} is required.` };
  }
  if (val && val.length < minLength) {
    return { isValid: false, error: `${fieldLabel} must be at least ${minLength} characters.` };
  }
  if (val.length > maxLength) {
    return { isValid: false, error: `${fieldLabel} cannot exceed ${maxLength} characters (currently ${val.length}).` };
  }

  return { isValid: true, sanitizedValue: val };
}

/**
 * Validates Search Query Inputs
 * Prevents attackers from using search bars as SQL/NoSQL injection reconnaissance vectors
 */
export function validateSearchQuery(query: unknown): ValidationResult {
  if (!query || typeof query !== 'string') {
    return { isValid: true, sanitizedValue: '' };
  }

  const sec = verifySecurityIntegrity(query, 'Search Query');
  if (!sec.isValid) return sec;

  const val = query.trim();
  if (val.length > 200) {
    return { isValid: false, error: 'Search query is too long (maximum 200 characters).' };
  }

  return { isValid: true, sanitizedValue: val };
}

// ---------------------------------------------------------------------------
// 5. MASTER FORM BLOCK VALIDATOR
// ---------------------------------------------------------------------------

export interface ClientFormFields {
  name: string;
  entityType: string;
  industry: string;
  pan: string;
  gstin?: string;
  tan?: string;
  cin?: string;
  udyamNo?: string;
  contactPerson: string;
  designation: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  agreedFee: number | string;
  notes?: string;
}

export function validateCompleteClientForm(form: ClientFormFields): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: Record<string, any>;
} {
  const errors: Record<string, string> = {};
  const sanitized: Record<string, any> = {};

  // 1. Legal Name
  const nameRes = validateEntityName(form.name);
  if (!nameRes.isValid) errors.name = nameRes.error!;
  else sanitized.name = nameRes.sanitizedValue;

  // 2. Contact Person
  const contactRes = validatePersonName(form.contactPerson, 'Contact Person');
  if (!contactRes.isValid) errors.contactPerson = contactRes.error!;
  else sanitized.contactPerson = contactRes.sanitizedValue;

  // 3. Designation
  const desigRes = validateDesignation(form.designation);
  if (!desigRes.isValid) errors.designation = desigRes.error!;
  else sanitized.designation = desigRes.sanitizedValue;

  // 4. Email
  const emailSec = verifySecurityIntegrity(form.email, 'Email');
  if (!emailSec.isValid) {
    errors.email = emailSec.error!;
  } else {
    const email = (form.email || '').trim();
    if (!email) {
      errors.email = 'Email address is required.';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      errors.email = 'Please enter a valid corporate email address.';
    } else {
      sanitized.email = email.toLowerCase();
    }
  }

  // 5. Phone
  const phoneSec = verifySecurityIntegrity(form.phone, 'Phone');
  if (!phoneSec.isValid) {
    errors.phone = phoneSec.error!;
  } else {
    const rawPhone = (form.phone || '').trim().replace(/[\s\-\(\)]/g, '');
    const cleanPhone = rawPhone.startsWith('+91') ? rawPhone.slice(3) : rawPhone.startsWith('0') ? rawPhone.slice(1) : rawPhone;
    if (!cleanPhone) {
      errors.phone = 'Mobile number is required.';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.';
    } else {
      sanitized.phone = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
    }
  }

  // 6. PAN
  const panSec = verifySecurityIntegrity(form.pan, 'PAN');
  if (!panSec.isValid) {
    errors.pan = panSec.error!;
  } else {
    const pan = (form.pan || '').trim().toUpperCase();
    if (!pan) {
      errors.pan = 'PAN is mandatory for corporate registration.';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      errors.pan = 'Invalid PAN format. Must be 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F).';
    } else {
      sanitized.pan = pan;
    }
  }

  // 7. GSTIN (Optional, but if provided, must be statutory)
  if (form.gstin && form.gstin.trim()) {
    const gstinSec = verifySecurityIntegrity(form.gstin, 'GSTIN');
    if (!gstinSec.isValid) {
      errors.gstin = gstinSec.error!;
    } else {
      const gstin = form.gstin.trim().toUpperCase();
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
        errors.gstin = 'Invalid statutory GSTIN structure (15 alphanumeric characters).';
      } else {
        sanitized.gstin = gstin;
      }
    }
  }

  // 8. TAN (Optional)
  if (form.tan && form.tan.trim()) {
    const tanSec = verifySecurityIntegrity(form.tan, 'TAN');
    if (!tanSec.isValid) {
      errors.tan = tanSec.error!;
    } else {
      const tan = form.tan.trim().toUpperCase();
      if (!/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(tan)) {
        errors.tan = 'Invalid TAN format (e.g. BLRA12345B).';
      } else {
        sanitized.tan = tan;
      }
    }
  }

  // 9. CIN / LLPIN (Optional)
  if (form.cin && form.cin.trim()) {
    const cinSec = verifySecurityIntegrity(form.cin, 'CIN / LLPIN');
    if (!cinSec.isValid) {
      errors.cin = cinSec.error!;
    } else {
      const cin = form.cin.trim().toUpperCase();
      const isCin = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(cin);
      const isLlpin = /^[A-Z0-9-]{6,12}$/.test(cin);
      if (!isCin && !isLlpin) {
        errors.cin = 'Invalid MCA Corporate Identification Number (CIN) or LLPIN format.';
      } else {
        sanitized.cin = cin;
      }
    }
  }

  // 10. Udyam (Optional)
  if (form.udyamNo && form.udyamNo.trim()) {
    const udyamRes = validateUdyamNumber(form.udyamNo);
    if (!udyamRes.isValid) errors.udyamNo = udyamRes.error!;
    else sanitized.udyamNo = udyamRes.sanitizedValue;
  }

  // 11. Address & City
  const addrRes = validateSafeText(form.address, 'Street Address', { required: true, minLength: 5, maxLength: 300 });
  if (!addrRes.isValid) errors.address = addrRes.error!;
  else sanitized.address = addrRes.sanitizedValue;

  const cityRes = validatePersonName(form.city, 'City');
  if (!cityRes.isValid) errors.city = cityRes.error!;
  else sanitized.city = cityRes.sanitizedValue;

  // 12. Pincode
  const pinSec = verifySecurityIntegrity(form.pincode, 'Pincode');
  if (!pinSec.isValid) {
    errors.pincode = pinSec.error!;
  } else {
    const pin = (form.pincode || '').trim();
    if (!pin) {
      errors.pincode = 'PIN Code is required.';
    } else if (!/^[1-9][0-9]{5}$/.test(pin)) {
      errors.pincode = 'Invalid 6-digit Indian PIN code.';
    } else {
      sanitized.pincode = pin;
    }
  }

  // 13. Agreed Fee
  const feeRes = validateMonetaryAmount(form.agreedFee, 'Agreed Fee', 0, 50000000);
  if (!feeRes.isValid) errors.agreedFee = feeRes.error!;
  else sanitized.agreedFee = feeRes.sanitizedValue;

  // 14. Notes (Optional)
  if (form.notes) {
    const notesRes = validateSafeText(form.notes, 'Notes', { required: false, maxLength: 2000 });
    if (!notesRes.isValid) errors.notes = notesRes.error!;
    else sanitized.notes = notesRes.sanitizedValue;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized
  };
}
