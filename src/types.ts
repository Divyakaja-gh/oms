export type Role = 'admin' | 'partner' | 'article' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  firmName: string;
  permissions?: string[];
  department?: string;
  assignedClientId?: string;
  mobile?: string;
}

export interface Client {
  id: string;
  tenantId?: string;
  name: string;
  pan: string;
  type?: string;
  entityType?: string;
  gstin?: string;
  tan?: string;
  cin?: string;
  udyamNo?: string;
  industry?: string;
  contactPerson?: string;
  designation?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status: string; // 'Active' | 'Onboarding' | 'Review' | 'Inactive'
  partner?: string;
  articleAssigned?: string;
  engagementScope?: string[];
  engagementType?: string;
  agreedFee?: number;
  feeBillingFrequency?: string;
  accountingSoftware?: string;
  notes?: string;
  mfaEnabled?: boolean;
  ownerId?: string;
  createdAt?: any;
}

export type TaskStatus = 'Not Started' | 'In Progress' | 'Pending Info' | 'Under Review' | 'Completed';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskType = 'Statutory' | 'Client' | 'Internal' | 'Recurring' | 'Audit' | 'Tax' | 'GST' | 'ROC';

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType | string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee?: string;
  assigneeRole?: string;
  client?: string;
  statutoryForm?: string;
  description?: string;
  subtasks?: TaskSubtask[];
  recurrence?: 'One-time' | 'Monthly' | 'Quarterly' | 'Annually';
  isOverdue?: boolean;
  ownerId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Prospect {
  id: string;
  companyName: string;
  name?: string;
  proposalTitle?: string;
  contactPerson?: string;
  designation?: string;
  email?: string;
  phone?: string;
  industry?: string;
  services: string[] | string;
  value: number;
  estimatedFees?: number;
  billingFrequency?: string;
  paymentTerms?: string;
  outOfPocketTerms?: string;
  stage?: string;
  status: string; // 'Lead' | 'Discovery' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost'
  probability?: number;
  targetDate?: string;
  validityDate?: string;
  assignedPartner?: string;
  leadSource?: string;
  scopeNotes?: string;
  ownerId?: string;
  createdAt?: any;
}

export interface Material {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
}

export type AuditActionType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'FILE_ACCESS'
  | 'FILE_DOWNLOAD'
  | 'FILE_UPLOAD'
  | 'ROLE_CHANGE'
  | 'CREDENTIAL_REVEAL'
  | 'DATA_WIPE'
  | 'INVOICE_CREATE'
  | 'COMPLIANCE_STATUS_UPDATE'
  | 'PERMISSION_OVERRIDE'
  | 'SESSION_TIMEOUT'
  | 'SESSION_EXTENDED'
  | 'SESSION_POLICY_UPDATE'
  | 'ACCESS_RESTRICTED'
  | 'ACCESS_RESTORED'
  | 'ACCESS_REVOKED'
  | 'ACCESS_GRANTED'
  | 'SECURITY_ALERT';

export type AccessStatus = 'ACTIVE' | 'RESTRICTED';

export type SystemRole = 'ADMIN' | 'PARTNER' | 'MANAGER' | 'ARTICLE' | 'CLIENT';

export type PermissionCategory = 
  | 'AUDIT_SECURITY' 
  | 'STATUTORY_FILINGS' 
  | 'CLIENT_VAULT' 
  | 'AI_AUTOMATION' 
  | 'BILLING_OPERATIONS';

export interface PermissionDefinition {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

export interface SystemAccessUser {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  mobile: string;
  status: AccessStatus;
  permissions: string[];
  passcode?: string;
  assignedClientId?: string;
  assignedClientName?: string;
  restrictionReason?: string;
  restrictedAt?: string;
  restrictedBy?: string;
  createdAt: string;
  lastActive?: string;
  you?: boolean;
}

export interface SessionTimeoutPolicy {
  timeoutMinutes: number;
  warningSeconds: number;
  soundAlertEnabled: boolean;
  autoLockOnTabBlur: boolean;
  enforceSoc2Strict: boolean;
  testingMode?: boolean;
}

export type AuditCategory = 'AUTH' | 'DATA_ACCESS' | 'PRIVILEGE' | 'VAULT' | 'SYSTEM' | 'BILLING' | 'NETWORK';

export type AuditSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: Role;
    ipAddress: string;
    userAgent?: string;
  };
  action: AuditActionType;
  category: AuditCategory;
  severity: AuditSeverity;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  details: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
  soc2Criterion: string;
  integrityHash: string;
  status: 'VERIFIED' | 'FLAGGED';
}

// ==========================================
// STANDARDIZED STATUTORY FILING TEMPLATE TYPES
// ==========================================

export type StatutoryCategory = 'GST' | 'Direct Tax & TDS' | 'MCA & Corporate Law' | 'Labor & Payroll' | 'Audit & Assurance' | 'FEMA & International';

export type StatutoryFilingFrequency = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'Event-Based' | 'Per-Transaction';

export interface TemplateFieldSchema {
  id: string;
  label: string;
  key: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'select' | 'boolean' | 'pan' | 'gstin' | 'hsn' | 'textarea';
  required: boolean;
  description?: string;
  defaultValue?: string | number | boolean;
  validationRule?: string;
  options?: string[];
  helpText?: string;
}

export interface StatutoryValidationRule {
  id: string;
  checkName: string;
  severity: 'BLOCKING_ERROR' | 'WARNING' | 'COMPLIANCE_ADVISORY';
  ruleDescription: string;
}

export interface StatutoryFilingTemplate {
  id: string;
  templateCode: string;
  title: string;
  authority: 'Goods & Services Tax Network (GSTN)' | 'Income Tax Department (CPC)' | 'Ministry of Corporate Affairs (MCA)' | 'EPFO & ESIC' | 'Reserve Bank of India (RBI)' | 'ICAI';
  category: StatutoryCategory;
  frequency: StatutoryFilingFrequency;
  applicableLaw: string;
  standardDueDateDescription: string;
  penaltyAndLateFeeProvisions: string;
  description: string;
  version: string;
  isStandardized: boolean;
  isFavorite?: boolean;
  tags: string[];
  mandatoryAttachments: string[];
  fieldSchemas: TemplateFieldSchema[];
  validationChecklist: StatutoryValidationRule[];
  jsonSampleSchema: string;
  guidelinesNotes: string;
  lastUpdated: string;
}


export type AgentModuleId = 'onboarding' | 'notice_triage' | 'gst_bank_recon' | 'general_nlq';

export type AgentExecutionStatus = 'IDLE' | 'ANALYZING' | 'EXECUTING' | 'WAITING_HUMAN_APPROVAL' | 'COMPLETED' | 'ERROR';

export interface AgentStepTrace {
  id: string;
  timestamp: string;
  stepName: string;
  toolInvoked?: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  details: string;
  latencyMs?: number;
  outputSummary?: string;
}

// 1. Onboarding & Zero-Touch Engagement Agent Types
export interface OnboardingAgentInput {
  clientName: string;
  entityType: 'Private Limited' | 'LLP' | 'Partnership' | 'Proprietorship' | 'Individual';
  contactEmail: string;
  contactPhone: string;
  panNumber: string;
  gstin?: string;
  cin?: string;
  turnoverRange?: string;
  servicesRequested: string[];
  uploadedDocuments?: string[];
  rawTextNotes?: string;
}

export interface OnboardingAgentResult {  fallbackUsed?: boolean;
  id: string;
  timestamp: string;
  clientSummary: {
    legalName: string;
    pan: string;
    gstin?: string;
    riskCategory: 'Low' | 'Medium' | 'High';
    kycStatus: 'VERIFIED' | 'NEEDS_PHYSICAL_CHECK' | 'REJECTED';
  };
  extractedPanData: {
    pan: string;
    validFormat: boolean;
    nameOnRecord: string;
    dateOfIncorporationOrBirth: string;
    status: 'ACTIVE_AND_OPERATIONAL' | 'SUSPENDED';
  };
  extractedGstData?: {
    gstin: string;
    jurisdiction: string;
    filingFrequency: 'Monthly (GSTR-1/3B)' | 'Quarterly (QRMP)';
    aggregateTurnoverBucket: string;
  };
  draftEngagementLetter: {
    letterRefNumber: string;
    annualRetainerFee: number;
    billingCadence: 'Monthly Retainer' | 'Quarterly Advance' | 'Per-Filing Milestone';
    scopeOfServices: string[];
    statutoryDisclaimer: string;
    fullLetterMarkdown: string;
  };
  provisionedFolders: string[];
  suggestedTasks: Array<{
    title: string;
    type: 'Statutory' | 'Client' | 'Internal';
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    assigneeRole: 'partner' | 'article';
  }>;
  executionTrace: AgentStepTrace[];
  status: 'READY_FOR_DISPATCH' | 'APPROVED' | 'DISPATCHED';
}

// 2. Statutory Notice Triage & Defence Draft Agent Types
export interface NoticeTriageInput {
  noticeNumber: string;
  issuingAuthority: 'Income Tax Department (CPC / Faceless AO)' | 'GST Department (State / DGGI)' | 'MCA / ROC' | 'Customs / FEMA';
  sectionCode: string;
  financialYearOrPeriod: string;
  demandAmountInr?: number;
  noticeDate: string;
  statutoryDeadline: string;
  clientPanOrGst: string;
  clientName: string;
  rawNoticeContent: string;
  penaltySectionCited?: string;
}

export interface NoticeTriageResult {  fallbackUsed?: boolean;
  id: string;
  timestamp: string;
  classifiedCategory: 'Scrutiny Assessment' | 'Defective Return (Sec 139(9))' | 'GST ITC Mismatch (DRC-01 / ASMT-10)' | 'Penalty Notice (Sec 270A/271AAC)' | 'High Value Transaction Query (SFT)' | 'TDS Demand / Defaults';
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  keyAllegations: string[];
  statutoryPrecedents: Array<{
    citation: string;
    courtOrTribunal: string;
    caseRatio: string;
    applicabilityRating: 'Directly on Point' | 'Persuasive' | 'Distinguishable';
  }>;
  taxPositionDefenceStrategy: {
    primaryGround: string;
    alternativeGround: string;
    proceduralDefences: string[];
  };
  draftDefenceReplyMarkdown: string;
  statutoryTimelineSummary: {
    daysRemaining: number;
    hardExpiryDate: string;
    recommendedSubmissionDate: string;
  };
  requiredEvidenceChecklist: Array<{
    item: string;
    mandatory: boolean;
    collected: boolean;
  }>;
  executionTrace: AgentStepTrace[];
  status: 'DRAFT_READY' | 'PARTNER_APPROVED' | 'SUBMITTED_TO_PORTAL';
}

// 3. Autonomous GST & Bank Reconciliation Agent Types
export interface GstBankReconInput {
  clientName: string;
  clientGstin: string;
  reconPeriod: string;
  gstr2bJsonOrText?: string;
  purchaseRegisterCsvOrText?: string;
  bankStatementCsvOrText?: string;
  materialityThresholdInr?: number;
}

export interface ReconMismatchItem {
  id: string;
  supplierGstin: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  taxAmountInBooks: number;
  taxAmountInGstr2b: number;
  bankMatchStatus: 'MATCHED' | 'UNMATCHED_IN_BANK' | 'PARTIAL_PAYMENT';
  varianceAmount: number;
  mismatchType: 'MISSING_IN_2B' | 'MISSING_IN_BOOKS' | 'TAX_RATE_VARIANCE' | 'INVOICE_NUMBER_TYPO' | 'TIMING_DIFFERENCE' | 'EXACT_MATCH';
  agentActionRecommendation: 'CLAIM_ITC_NOW' | 'DEFER_ITC' | 'SEND_VENDOR_COMMUNICATION' | 'AMEND_PURCHASE_REGISTER' | 'REVERSE_RULE_42';
  suggestedVendorNotice?: string;
}

export interface GstBankReconResult {  fallbackUsed?: boolean;
  id: string;
  timestamp: string;
  clientGstin: string;
  reconPeriod: string;
  summaryMetrics: {
    totalBookItc: number;
    totalPortal2bItc: number;
    matchedItcEligible: number;
    atRiskItcBlocked: number;
    reconciliationMatchRatePct: number;
    bankDebitMatchRatePct: number;
  };
  items: ReconMismatchItem[];
  automatedJournalVoucherProposals: Array<{
    accountHead: string;
    debitAmount: number;
    creditAmount: number;
    narration: string;
  }>;
  vendorDunningBatch: Array<{
    vendorName: string;
    vendorEmail: string;
    invoicesCount: number;
    totalAtRiskItc: number;
    emailBodyMarkdown: string;
  }>;
  executionTrace: AgentStepTrace[];
  status: 'RECONCILED' | 'APPLIED_TO_ERP' | 'VENDOR_NOTIFIED';
}

export interface ComplianceFiling {
  id: string;
  complianceCode: string;
  complianceTitle: string;
  clientName: string;
  period: string;
  dueDate: string;
  status: 'Pending' | 'Filed' | 'In Progress' | 'Overdue';
  filedDate?: string;
  health: 'Green' | 'Amber' | 'Red';
  totalSteps: number;
  completedSteps: number;
  steps?: Array<{ id: string; title: string; completed: boolean; note?: string }>;
}

export interface ClientDocument {
  id: string;
  clientName: string;
  clientPanOrGst?: string;
  folder: string;
  name: string;
  version: string;
  size: string;
  tags: string[];
  uploadedAt: string;
  sharedStatus: 'Internal Only' | 'Shared with Client' | 'Portal Sync';
  fileType?: string;
  encrypted: boolean;
  notes?: string;
}

// ============================================================================
// GOOGLE SECRET MANAGER & SECURE KMS CREDENTIAL VAULT TYPES
// ============================================================================

export type VaultCredentialCategory =
  | 'MCA_LOGIN'
  | 'IT_PORTAL_KEY'
  | 'GST_PORTAL'
  | 'TRACES_TDS'
  | 'EPFO_ESIC'
  | 'BANKING_API'
  | 'OTHER';

export type VaultCredentialType =
  | 'PORTAL_PASSWORD'
  | 'API_ACCESS_KEY'
  | 'DSC_PIN'
  | 'OAUTH_SECRET'
  | 'PRIVATE_KEY';

export interface VaultCredentialItem {
  id: string;
  name: string;
  system: string;
  category: VaultCredentialCategory;
  credentialType: VaultCredentialType;
  identifier: string; // PAN, TAN, MCA V3 User ID, or Login ID
  clientName?: string;
  clientId?: string;
  secretManagerName: string; // Google Secret Manager resource identifier
  kmsKeyArn: string; // Google Cloud KMS CryptoKey ARN
  currentVersion: number;
  status: 'Active' | 'Requires Rotation' | 'Expired' | 'Revoked';
  lastAccessed?: string;
  lastRotated?: string;
  expiryDate?: string;
  rotationIntervalDays: number;
  accessTier: 'PARTNER_ADMIN_ONLY' | 'ARTICLE_PERMITTED' | 'ALL_STAFF';
  notes?: string;
  portalUrl?: string;
  hasSecretValue?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface VaultStatusResponse {
  status: 'HEALTHY' | 'DEGRADED' | 'DISCONNECTED';
  gsmIntegration: {
    provider: string;
    apiVersion: string;
    projectId: string;
    kmsKeyRing: string;
    encryptionAlgorithm: string;
    connected: boolean;
    mode: string;
    fipsCompliance: string;
  };
  metrics: {
    totalSecrets: number;
    activeSecrets: number;
    requiresRotation: number;
    mcaLogins: number;
    itPortalKeys: number;
    gstPortalKeys: number;
    rotationComplianceScore: string;
  };
  lastChecked: string;
}

export interface SupportTicketReply {
  id: string;
  sender: string;
  role?: string;
  message: string;
  timestamp: string;
}

export interface KycDocumentRequirement {
  id: string;
  category: 'Entity Proof' | 'Signatory KYC' | 'Financial & Tax' | 'Auditor & Legal' | 'Portal Credentials';
  title: string;
  description: string;
  mandatory: boolean;
  acceptedFormats: string;
}

export interface OnboardingEmailPayload {
  recipientEmail: string;
  recipientName: string;
  ccEmails?: string[];
  clientName: string;
  panNumber: string;
  gstin?: string;
  entityType?: string;
  letterRefNumber: string;
  engagementLetterMarkdown: string;
  annualRetainerFee: number;
  billingCadence?: string;
  advanceInvoiceAmount: number;
  invoiceNumber?: string;
  servicesRequested?: string[];
  includeContract: boolean;
  includeKycChecklist: boolean;
  includeInvoice: boolean;
  includeVaultLink: boolean;
  senderMode: 'gmail' | 'domain';
  senderEmail?: string;
  customMessage?: string;
}

export interface OnboardingEmailResult {
  success: boolean;
  messageId?: string;
  sentAt: string;
  sender: string;
  recipient: string;
  subject: string;
  error?: string;
  method: 'gmail_api' | 'domain_email';
}

export interface SupportTicket {
  id: string;
  ticketNumber?: string;
  subject: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  requesterName?: string;
  requesterEmail?: string;
  attachmentName?: string;
  attachmentSize?: string;
  replies?: SupportTicketReply[];
  ownerId?: string;
  createdAt?: any;
  updatedAt?: any;
}

// ============================================================================
// AUTONOMOUS AGENT CREDIT METERING & BILLING TYPES
// ============================================================================

export type CreditTransactionType = 'GRANT' | 'DEDUCT' | 'REFUND';
export type CreditCategory = 'PURCHASE' | 'SUBSCRIPTION_ALLOWANCE' | 'AGENT_EXECUTION' | 'SYSTEM_REFUND' | 'PROMO_CREDIT' | 'TEST_CREDIT';

export interface CreditTokensInfo {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface CreditTransaction {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  type: CreditTransactionType;
  category: CreditCategory;
  amount: number;
  balanceAfter: number;
  description: string;
  agentType?: string;
  taskId?: string;
  tokensUsed?: CreditTokensInfo;
  timestamp: string;
}

export interface CreditAccount {
  tenantId: string;
  balance: number;
  lifetimeUsed: number;
  lifetimeGranted: number;
  planType: 'Starter' | 'Professional' | 'Enterprise';
  monthlyAllowance: number;
  autoRecharge: boolean;
  autoRechargeThreshold: number;
  autoRechargePackAmount: number;
  lastRefreshedAt: string;
  bypassMetering?: boolean;
  isTestMode?: boolean;
}

export interface CreditRates {
  onboarding: number;
  notice_triage: number;
  gst_bank_recon: number;
  general_nlq: number;
}

// ==========================================
// OCR INVOICE EXTRACTION TYPES (ocr.dev suite)
// ==========================================

export interface ExtractedInvoiceLineItem {
  id?: string;
  slNo?: number | string;
  description: string;
  hsnSac?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  discount?: number;
  discountPercent?: number;
  taxableAmount: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  totalAmount: number;
}

export interface ExtractedInvoiceTaxSummary {
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  roundOff: number;
  grandTotal: number;
  totalInWords?: string;
  currency?: string;
}

export interface ExtractedInvoiceParty {
  name: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  pincode?: string;
  phone?: string;
  email?: string;
}

export interface ExtractedInvoiceBankDetails {
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  upiId?: string;
  paymentTerms?: string;
  paymentMode?: string;
}

export interface ExtractedInvoiceMetadata {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  poNumber?: string;
  poDate?: string;
  invoiceType?: string;
  placeOfSupply?: string;
  reverseCharge?: string;
  currency?: string;
}

export interface ExtractedInvoiceHandwrittenNotes {
  hasHandwriting: boolean;
  handwrittenItems: Array<{
    location: string;
    text: string;
    confidence: number;
  }>;
  hasSignature: boolean;
  signatureSignee?: string;
  hasStamp: boolean;
  stampDetails?: string;
  remarksAndNotes?: string[];
  termsAndConditions?: string[];
}

export interface ExtractedInvoiceResult {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'scanned';
  fileSize: number;
  processedAt: string;
  processingTimeMs: number;
  confidenceScore: number;
  documentQuality: 'High' | 'Medium' | 'Low / Scanned' | 'Handwritten';
  detectedLanguage?: string;
  metadata: ExtractedInvoiceMetadata;
  vendor: ExtractedInvoiceParty;
  customer: ExtractedInvoiceParty;
  lineItems: ExtractedInvoiceLineItem[];
  taxSummary: ExtractedInvoiceTaxSummary;
  bankDetails: ExtractedInvoiceBankDetails;
  annotations: ExtractedInvoiceHandwrittenNotes;
  rawTextTranscript: string;
  status: 'preview' | 'verified' | 'committed';
}

// ----------------------------------------------------
// PRACTICE MANAGEMENT AUTOMATION & FINEXO PMS EXTENSIONS
// ----------------------------------------------------

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:MM:SS
  checkOutTime?: string;
  workLocation: 'Office' | 'Client Site' | 'WFH';
  clientVisited?: string;
  status: 'Present' | 'Late' | 'Half-day' | 'On Leave';
  totalHours?: number;
  notes?: string;
  ipAddress?: string;
}

export interface LiveTeamMember {
  id: string;
  name: string;
  role: Role;
  status: 'active' | 'in_meeting' | 'on_site' | 'break' | 'offline';
  currentTask?: string;
  clientName?: string;
  clockInTime?: string;
  lastActive: string;
  location: string;
}

export interface DscRecord {
  id: string;
  clientId: string;
  clientName: string;
  holderName: string;
  holderDesignation: string;
  pan: string;
  din?: string;
  issuingAuthority: string; // e-Mudhra, Capricorn, VSign, Sify
  certificateClass: 'Class 3' | 'Class 2';
  validFrom: string;
  validUntil: string;
  daysRemaining: number;
  status: 'active' | 'expiring_soon' | 'expired';
  tokenLocation: 'Office Safe' | 'With Client' | 'Partner Desk' | 'In Use';
  tokenPin?: string;
  lastRenewalAlertSent?: string;
}

export interface TaskSentinelAlert {
  id: string;
  clientId: string;
  clientName: string;
  clientPan: string;
  clientGstin?: string;
  complianceCategory: 'GST' | 'ITR' | 'TDS' | 'MCA';
  reason: string;
  suggestedTaskTitle: string;
  dueDate: string;
  priority: 'High' | 'Medium';
  severity: 'critical' | 'warning';
}

export interface DripEmailStep {
  dayOffset: number; // e.g. -7, -3, -1, +1
  title: string;
  subject: string;
  templateBody: string;
  channel: 'email' | 'whatsapp' | 'both';
}

export interface DripEmailCampaign {
  id: string;
  name: string;
  triggerEvent: 'gst_filing_due' | 'advance_tax_due' | 'audit_documents_pending' | 'dsc_expiry' | 'custom';
  active: boolean;
  frequency: string;
  steps: DripEmailStep[];
  recipientCount?: number;
  lastTriggered?: string;
}

export interface CustomFieldDefinition {
  id: string;
  targetEntity: 'client' | 'task';
  label: string;
  fieldKey: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: string[];
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}

export interface FirmProfile {
  id: string;
  firmName: string;
  firmType: 'Proprietorship' | 'Partnership' | 'LLP' | 'Private Limited';
  registrationNo: string; // ICAI FRN
  pan: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankBranch: string;
  invoicePrefix: string; // e.g. "AA/25-26/"
  isDefault: boolean;
  logoUrl?: string;
}

export interface ClientVisit {
  id: string;
  clientId: string;
  clientName: string;
  visitorId: string;
  visitorName: string;
  visitorRole: string;
  visitDate: string;
  startTime: string;
  endTime?: string;
  purpose: 'Statutory Audit' | 'Scrutiny Hearing' | 'GST Assessment' | 'Stock Verification' | 'Client Review Meeting' | 'Document Collection';
  location: string;
  contactPerson: string;
  minutesOfMeeting: string;
  actionItems: string[];
  expenseClaimed?: number;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface PortalQuickLogin {
  id: string;
  portalKey: 'GST' | 'ITR' | 'TRACES' | 'MCA' | 'EPFO';
  name: string;
  portalUrl: string;
  description: string;
  suggestedCredentialsCategory: string;
  quickActions: { label: string; url: string }[];
}
