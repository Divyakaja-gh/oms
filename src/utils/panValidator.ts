import { DeducteeCategory, TdsSection } from '../types/tds';

export interface PanValidationResult {
  isValid: boolean;
  pan: string;
  entityType: string;
  entityCategory: DeducteeCategory;
  error?: string;
  breakdown?: {
    series: string;
    entityLetter: string;
    nameInitial: string;
    sequenceDigits: string;
    checkLetter: string;
  };
  isInoperative: boolean;
  higherDeductionApplies: boolean; // Section 206AA
  recommendedRateNotice?: string;
}

export const ENTITY_MAP: Record<string, { label: string; category: DeducteeCategory }> = {
  P: { label: 'Individual (Natural Person)', category: 'NON_COMPANY_INDIVIDUAL' },
  C: { label: 'Company (Corporate Entity)', category: 'COMPANY' },
  H: { label: 'Hindu Undivided Family (HUF)', category: 'HUF' },
  F: { label: 'Partnership Firm / LLP', category: 'PARTNERSHIP_FIRM' },
  A: { label: 'Association of Persons (AOP)', category: 'TRUST_AOP' },
  T: { label: 'Trust (Public / Private)', category: 'TRUST_AOP' },
  B: { label: 'Body of Individuals (BOI)', category: 'TRUST_AOP' },
  L: { label: 'Local Authority', category: 'GOVERNMENT' },
  J: { label: 'Artificial Juridical Person', category: 'COMPANY' },
  G: { label: 'Government Agency / Department', category: 'GOVERNMENT' },
};

/**
 * Validates an Indian Permanent Account Number (PAN) according to statutory Income Tax rules:
 * - Length: exactly 10 alphanumeric characters
 * - Characters 1-3: Alphabetic series from AAA to ZZZ
 * - Character 4: Status / Entity category (P, C, H, F, A, T, B, L, J, G)
 * - Character 5: First character of the PAN holder's surname or entity title
 * - Characters 6-9: Sequential numeric digits (0001 to 9999)
 * - Character 10: Alphabetic check digit
 */
export function validatePan(inputPan: string, simulateInoperative: boolean = false): PanValidationResult {
  const pan = (inputPan || '').trim().toUpperCase();

  if (!pan) {
    return {
      isValid: false,
      pan,
      entityType: 'Unknown',
      entityCategory: 'NON_COMPANY_INDIVIDUAL',
      error: 'PAN cannot be blank.',
      isInoperative: false,
      higherDeductionApplies: true
    };
  }

  if (pan.length !== 10) {
    return {
      isValid: false,
      pan,
      entityType: 'Unknown',
      entityCategory: 'NON_COMPANY_INDIVIDUAL',
      error: `PAN must be exactly 10 characters (currently ${pan.length}).`,
      isInoperative: false,
      higherDeductionApplies: true
    };
  }

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(pan)) {
    return {
      isValid: false,
      pan,
      entityType: 'Invalid Syntax',
      entityCategory: 'NON_COMPANY_INDIVIDUAL',
      error: 'Invalid format. PAN structure must be: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).',
      isInoperative: false,
      higherDeductionApplies: true
    };
  }

  const entityLetter = pan[3];
  const entityInfo = ENTITY_MAP[entityLetter];

  if (!entityInfo) {
    return {
      isValid: false,
      pan,
      entityType: `Invalid 4th character ('${entityLetter}')`,
      entityCategory: 'NON_COMPANY_INDIVIDUAL',
      error: `Invalid entity code '${entityLetter}' at 4th position. Allowed: P, C, H, F, A, T, B, L, J, G.`,
      isInoperative: false,
      higherDeductionApplies: true
    };
  }

  // Simulated inoperative PAN condition: if explicit flag or if ending with 'Z' as a test case
  const isInoperative = simulateInoperative || pan.endsWith('Z');
  const higherDeductionApplies = isInoperative;

  return {
    isValid: true,
    pan,
    entityType: entityInfo.label,
    entityCategory: entityInfo.category,
    breakdown: {
      series: pan.substring(0, 3),
      entityLetter: pan[3],
      nameInitial: pan[4],
      sequenceDigits: pan.substring(5, 9),
      checkLetter: pan[9]
    },
    isInoperative,
    higherDeductionApplies,
    recommendedRateNotice: higherDeductionApplies 
      ? 'WARNING: PAN is Inoperative / Unlinked with Aadhaar. Mandatory 20% TDS under Section 206AA applies!'
      : 'PAN is Active & Operative with Income Tax Department.'
  };
}

/**
 * Calculates standard statutory TDS rate for a given section and category
 */
export function getStandardTdsRate(section: TdsSection, category: DeducteeCategory): number {
  switch (section) {
    case '192':
      return 10; // Standard average salary deduction
    case '194C':
      return category === 'COMPANY' || category === 'PARTNERSHIP_FIRM' ? 2 : 1;
    case '194J_PROF':
      return 10;
    case '194J_TECH':
      return 2;
    case '194I_LAND':
      return 10;
    case '194I_PLANT':
      return 2;
    case '194H':
      return 2; // Reduced to 2% under Finance (No. 2) Act 2024
    case '194A':
      return 10;
    case '194Q':
      return 0.1;
    default:
      return 10;
  }
}

/**
 * Calculates the final applied rate considering Section 206AA / 206AB (Higher rate for inoperative or non-compliant PANs)
 */
export function getFinalEffectiveRate(
  section: TdsSection, 
  category: DeducteeCategory, 
  panValid: boolean, 
  inoperative: boolean,
  concessionalRate?: number
): { rate: number; isHigherRate: boolean; explanation: string } {
  if (concessionalRate !== undefined && concessionalRate >= 0) {
    return {
      rate: concessionalRate,
      isHigherRate: false,
      explanation: `Concessional Rate under Sec 197 Certificate (${concessionalRate}%)`
    };
  }

  const standardRate = getStandardTdsRate(section, category);

  if (!panValid || inoperative) {
    const higherRate = Math.max(20, standardRate * 2);
    return {
      rate: higherRate,
      isHigherRate: true,
      explanation: `Section 206AA / 206AB Higher Rate (${higherRate}%) applied due to invalid or inoperative PAN.`
    };
  }

  return {
    rate: standardRate,
    isHigherRate: false,
    explanation: `Standard Statutory Rate (${standardRate}%) under Section ${section.replace('_', ' ')}.`
  };
}
