export type TdsReturnForm = '26Q' | '24Q' | '27Q' | '27EQ';

export type TdsQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type TdsReturnStatus = 
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'CHALLANS_LINKED'
  | 'FVU_VALIDATED'
  | 'FILED'
  | 'OVERDUE';

export interface TdsReturn {
  id: string;
  deductorId: string;
  deductorName: string;
  tan: string;
  formType: TdsReturnForm;
  quarter: TdsQuarter;
  financialYear: string;
  assessmentYear: string;
  dueDate: string;
  filingDate?: string;
  prnReceiptNo?: string;
  tokenNo?: string;
  fvuVersion?: string;
  deducteesCount: number;
  totalPaymentAmount: number;
  totalTdsAmount: number;
  totalChallanAmount: number;
  challansLinkedCount: number;
  challansTotalCount: number;
  status: TdsReturnStatus;
  lastAuditDate?: string;
  remarks?: string;
}

export type DeducteeCategory = 
  | 'COMPANY'
  | 'NON_COMPANY_INDIVIDUAL'
  | 'HUF'
  | 'PARTNERSHIP_FIRM'
  | 'TRUST_AOP'
  | 'GOVERNMENT';

export type TdsSection = 
  | '192'        // Salary
  | '194A'       // Interest other than securities
  | '194C'       // Contractor / Sub-contractor
  | '194H'       // Commission / Brokerage
  | '194I_LAND'  // Rent of land/building/furniture (10%)
  | '194I_PLANT' // Rent of plant & machinery (2%)
  | '194J_PROF'  // Professional Fees / Royalty (10%)
  | '194J_TECH'  // Fees for Technical Services (2%)
  | '194Q';      // Purchase of goods exceeding 50L (0.1%)

export type PanStatus = 
  | 'OPERATIVE'
  | 'INOPERATIVE_AADHAAR_UNLINKED'
  | 'INVALID_FORMAT'
  | 'LOWER_RATE_CERTIFICATE';

export interface Deductee {
  id: string;
  name: string;
  pan: string;
  panStatus: PanStatus;
  category: DeducteeCategory;
  section: TdsSection;
  standardRate: number;
  appliedRate: number;
  isHigherDeduction206AA: boolean;
  lowerDeductionCertNo?: string;
  lowerDeductionValidTill?: string;
  email: string;
  phone: string;
  state: string;
  address?: string;
  ytdPayment: number;
  ytdTdsDeducted: number;
  lastDeductionDate: string;
}

export interface TdsChallan {
  id: string;
  bsrCode: string;
  challanNo: string;
  tenderDate: string;
  minorHead: '200' | '400'; // 200 = TDS Payable by Taxpayer, 400 = Regular Assessment
  section: string;
  totalAmount: number;
  allocatedAmount: number;
  unconsumedAmount: number;
  status: 'MATCHED' | 'PARTIAL' | 'UNMATCHED';
  returnId?: string;
  remarks?: string;
}

export interface Form16Certificate {
  id: string;
  certType: '16' | '16A';
  deducteeId: string;
  deducteeName: string;
  pan: string;
  deductorName: string;
  tan: string;
  quarter: TdsQuarter;
  financialYear: string;
  assessmentYear: string;
  grossPaid: number;
  taxDeducted: number;
  taxDeposited: number;
  issueDate: string;
  dispatchStatus: 'DRAFT' | 'GENERATED' | 'EMAILED';
}
