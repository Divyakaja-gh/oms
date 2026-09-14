import { 
  FirmProfile, 
  AttendanceRecord, 
  LiveTeamMember, 
  DscRecord, 
  TaskSentinelAlert, 
  DripEmailCampaign, 
  CustomFieldDefinition, 
  ClientVisit, 
  PortalQuickLogin 
} from '../types';

export const INITIAL_FIRMS: FirmProfile[] = [
  {
    id: 'firm-1',
    firmName: 'Aarav & Associates, Chartered Accountants',
    firmType: 'Partnership',
    registrationNo: '018492N',
    pan: 'AAAFA1234A',
    gstin: '07AAAFA1234A1Z5',
    address: '402-404, Barakhamba Chambers, 19 Barakhamba Road, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    phone: '+91 11 4355 8900',
    email: 'contact@aaravadvisors.com',
    bankName: 'HDFC Bank Ltd',
    bankAccountNo: '50200084920112',
    bankIfsc: 'HDFC0000003',
    bankBranch: 'Connaught Circus, New Delhi',
    invoicePrefix: 'AA/26-27/',
    isDefault: true,
  },
  {
    id: 'firm-2',
    firmName: 'Aarav Advisory Services LLP',
    firmType: 'LLP',
    registrationNo: 'AAR-8831',
    pan: 'AALFA5678B',
    gstin: '07AALFA5678B1Z2',
    address: 'Level 6, Two Horizon Center, Golf Course Road, DLF Phase 5',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    phone: '+91 124 492 7800',
    email: 'consulting@aaravllp.in',
    bankName: 'ICICI Bank',
    bankAccountNo: '000705018892',
    bankIfsc: 'ICIC0000007',
    bankBranch: 'Golf Course Road, Gurugram',
    invoicePrefix: 'ASL/26-27/',
    isDefault: false,
  },
  {
    id: 'firm-3',
    firmName: 'Aarav Corporate Tax Solutions Pvt Ltd',
    firmType: 'Private Limited',
    registrationNo: 'U74140DL2021PTC384920',
    pan: 'AATCA9988C',
    gstin: '07AATCA9988C1Z9',
    address: 'B-12, Okhla Industrial Area Phase-I',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110020',
    phone: '+91 11 2681 4455',
    email: 'billing@aaravtax.com',
    bankName: 'Kotak Mahindra Bank',
    bankAccountNo: '8849201938',
    bankIfsc: 'KKBK0000195',
    bankBranch: 'Okhla Phase-I, New Delhi',
    invoicePrefix: 'ACT/26-27/',
    isDefault: false,
  }
];

export const INITIAL_LIVE_TEAM: LiveTeamMember[] = [
  {
    id: 'tm-1',
    name: 'CA Aarav Sharma',
    role: 'partner',
    status: 'active',
    currentTask: 'Reviewing GSTR-9C Annual Audit Report',
    clientName: 'Acme Tech Solutions Ltd',
    clockInTime: '09:15 AM',
    lastActive: 'Just now',
    location: 'Head Office (Room 402)'
  },
  {
    id: 'tm-2',
    name: 'CA Meera Nair',
    role: 'partner',
    status: 'in_meeting',
    currentTask: 'Income Tax Scrutiny Hearing 143(3)',
    clientName: 'Bharat Infrastructure Ltd',
    clockInTime: '09:30 AM',
    lastActive: '12m ago',
    location: 'ITO Tax Office, Delhi'
  },
  {
    id: 'tm-3',
    name: 'Rahul Gupta',
    role: 'article',
    status: 'active',
    currentTask: 'Reconciling GSTR-2B with Purchase Register',
    clientName: 'Zenith Solar Energy LLP',
    clockInTime: '09:45 AM',
    lastActive: '3m ago',
    location: 'Head Office (Audit Bay 2)'
  },
  {
    id: 'tm-4',
    name: 'Sneha Verma',
    role: 'admin',
    status: 'on_site',
    currentTask: 'Physical Stock Verification & Asset Tagging',
    clientName: 'Stellar Lifestyle Brands',
    clockInTime: '10:00 AM',
    lastActive: '25m ago',
    location: 'Noida Warehouse Unit 4'
  },
  {
    id: 'tm-5',
    name: 'Amit Patel',
    role: 'article',
    status: 'break',
    currentTask: 'TDS 26Q Form Preparation',
    clientName: 'Apex Health Systems',
    clockInTime: '09:50 AM',
    lastActive: '45m ago',
    location: 'Office Cafeteria'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    userId: 'u-1',
    userName: 'CA Aarav Sharma',
    userRole: 'partner',
    date: '2026-09-14',
    checkInTime: '09:15:00',
    checkOutTime: undefined,
    workLocation: 'Office',
    status: 'Present',
    totalHours: 5.5,
    notes: 'Partner review & sign-offs',
    ipAddress: '103.21.124.89'
  },
  {
    id: 'att-2',
    userId: 'u-2',
    userName: 'CA Meera Nair',
    userRole: 'partner',
    date: '2026-09-14',
    checkInTime: '09:30:00',
    checkOutTime: undefined,
    workLocation: 'Client Site',
    clientVisited: 'Bharat Infrastructure Ltd / ITO',
    status: 'Present',
    totalHours: 5.25,
    notes: 'Scrutiny hearing attendance before ACIT Ward 7(1)',
    ipAddress: '157.34.201.12'
  },
  {
    id: 'att-3',
    userId: 'u-3',
    userName: 'Rahul Gupta',
    userRole: 'article',
    date: '2026-09-14',
    checkInTime: '09:45:00',
    checkOutTime: undefined,
    workLocation: 'Office',
    status: 'Present',
    totalHours: 5.0,
    notes: 'GST 2B matching and draft queries',
    ipAddress: '103.21.124.89'
  },
  {
    id: 'att-4',
    userId: 'u-4',
    userName: 'Sneha Verma',
    userRole: 'admin',
    date: '2026-09-14',
    checkInTime: '10:00:00',
    checkOutTime: undefined,
    workLocation: 'Client Site',
    clientVisited: 'Stellar Lifestyle Brands (Noida)',
    status: 'Present',
    totalHours: 4.75,
    notes: 'Stock audit verification',
    ipAddress: '182.72.19.45'
  },
  {
    id: 'att-5',
    userId: 'u-5',
    userName: 'Amit Patel',
    userRole: 'article',
    date: '2026-09-14',
    checkInTime: '09:50:00',
    checkOutTime: undefined,
    workLocation: 'Office',
    status: 'Present',
    totalHours: 4.9,
    notes: 'TDS Challan ITNS-281 verification',
    ipAddress: '103.21.124.89'
  },
  {
    id: 'att-6',
    userId: 'u-3',
    userName: 'Rahul Gupta',
    userRole: 'article',
    date: '2026-09-13',
    checkInTime: '09:40:00',
    checkOutTime: '18:35:00',
    workLocation: 'Office',
    status: 'Present',
    totalHours: 8.9,
    notes: 'Completed Acme Tech reconciliation',
    ipAddress: '103.21.124.89'
  },
  {
    id: 'att-7',
    userId: 'u-4',
    userName: 'Sneha Verma',
    userRole: 'admin',
    date: '2026-09-13',
    checkInTime: '09:30:00',
    checkOutTime: '18:15:00',
    workLocation: 'Office',
    status: 'Present',
    totalHours: 8.75,
    notes: 'Invoice preparation & vendor receipts',
    ipAddress: '103.21.124.89'
  }
];

export const INITIAL_DSC_RECORDS: DscRecord[] = [
  {
    id: 'dsc-1',
    clientId: 'c1',
    clientName: 'Acme Tech Solutions Ltd',
    holderName: 'Vikramaditya Singhania',
    holderDesignation: 'Managing Director',
    pan: 'ABVPS9981K',
    din: '00291844',
    issuingAuthority: 'e-Mudhra CA',
    certificateClass: 'Class 3',
    validFrom: '2024-09-22',
    validUntil: '2026-09-22',
    daysRemaining: 8,
    status: 'expiring_soon',
    tokenLocation: 'Office Safe',
    tokenPin: '••••••••',
    lastRenewalAlertSent: '2026-09-10'
  },
  {
    id: 'dsc-2',
    clientId: 'c2',
    clientName: 'Bharat Infrastructure Ltd',
    holderName: 'Rajeshwari Iyer',
    holderDesignation: 'Whole Time Director & CFO',
    pan: 'AAIPR1122J',
    din: '01849201',
    issuingAuthority: 'Capricorn CA',
    certificateClass: 'Class 3',
    validFrom: '2024-10-05',
    validUntil: '2026-10-05',
    daysRemaining: 21,
    status: 'expiring_soon',
    tokenLocation: 'Partner Desk',
    tokenPin: '••••••••',
    lastRenewalAlertSent: '2026-09-08'
  },
  {
    id: 'dsc-3',
    clientId: 'c3',
    clientName: 'Zenith Solar Energy LLP',
    holderName: 'Kunal Malhotra',
    holderDesignation: 'Designated Partner',
    pan: 'AGKPM4455Q',
    din: '07194820',
    issuingAuthority: 'VSign CA',
    certificateClass: 'Class 3',
    validFrom: '2025-04-10',
    validUntil: '2027-04-10',
    daysRemaining: 208,
    status: 'active',
    tokenLocation: 'Office Safe',
    tokenPin: '••••••••'
  },
  {
    id: 'dsc-4',
    clientId: 'c4',
    clientName: 'Stellar Lifestyle Brands',
    holderName: 'Pooja Agarwal',
    holderDesignation: 'Director',
    pan: 'AYUPA3322M',
    din: '08392110',
    issuingAuthority: 'Sify CA',
    certificateClass: 'Class 3',
    validFrom: '2024-08-30',
    validUntil: '2026-08-30',
    daysRemaining: -15,
    status: 'expired',
    tokenLocation: 'With Client',
    tokenPin: '••••••••',
    lastRenewalAlertSent: '2026-09-01'
  },
  {
    id: 'dsc-5',
    clientId: 'c5',
    clientName: 'Quantum Robotics Pvt Ltd',
    holderName: 'Dr. Arjun Roy',
    holderDesignation: 'Director & CEO',
    pan: 'ABQPR7788P',
    din: '09283741',
    issuingAuthority: 'e-Mudhra CA',
    certificateClass: 'Class 3',
    validFrom: '2025-11-15',
    validUntil: '2027-11-15',
    daysRemaining: 427,
    status: 'active',
    tokenLocation: 'Office Safe',
    tokenPin: '••••••••'
  }
];

export const INITIAL_TASK_SENTINEL_ALERTS: TaskSentinelAlert[] = [
  {
    id: 'tsa-1',
    clientId: 'c1',
    clientName: 'Acme Tech Solutions Ltd',
    clientPan: 'AAAFA1234A',
    clientGstin: '07AAAFA1234A1Z5',
    complianceCategory: 'GST',
    reason: 'Active Regular GSTIN registered in Delhi, but no GSTR-3B Monthly Return task exists for current period (September 2026).',
    suggestedTaskTitle: 'GSTR-3B Monthly Return Filing (Sept 2026)',
    dueDate: '2026-10-20',
    priority: 'High',
    severity: 'critical'
  },
  {
    id: 'tsa-2',
    clientId: 'c2',
    clientName: 'Bharat Infrastructure Ltd',
    clientPan: 'AAIPR1122J',
    complianceCategory: 'TDS',
    reason: 'Active Corporate TAN recorded with vendor deductions, but no Q2 Form 26Q TDS Return filing task scheduled.',
    suggestedTaskTitle: 'Form 26Q Quarterly Corporate TDS Filing (Q2 FY 26-27)',
    dueDate: '2026-10-31',
    priority: 'High',
    severity: 'critical'
  },
  {
    id: 'tsa-3',
    clientId: 'c4',
    clientName: 'Stellar Lifestyle Brands',
    clientPan: 'AYUPA3322M',
    complianceCategory: 'MCA',
    reason: 'Private Limited company with active CIN U74140DL2021PTC, but no ROC Annual Filing AOC-4 / MGT-7 task scheduled before AGM deadline.',
    suggestedTaskTitle: 'ROC Annual Filing AOC-4 Financial Statements (FY 25-26)',
    dueDate: '2026-10-29',
    priority: 'Medium',
    severity: 'warning'
  },
  {
    id: 'tsa-4',
    clientId: 'c5',
    clientName: 'Quantum Robotics Pvt Ltd',
    clientPan: 'ABQPR7788P',
    complianceCategory: 'ITR',
    reason: 'Corporate Entity with Turnover > 2 Cr subject to Sec 44AB, but no Form 3CA/3CD Tax Audit task created.',
    suggestedTaskTitle: 'Form 3CA/3CD Statutory Tax Audit Report (AY 26-27)',
    dueDate: '2026-09-30',
    priority: 'High',
    severity: 'critical'
  }
];

export const INITIAL_DRIP_CAMPAIGNS: DripEmailCampaign[] = [
  {
    id: 'drip-1',
    name: 'GST Monthly Compliance Drip (GSTR-1 & 3B)',
    triggerEvent: 'gst_filing_due',
    active: true,
    frequency: 'Monthly (Days 4, 8, 10 & 12)',
    recipientCount: 42,
    lastTriggered: '2026-09-08',
    steps: [
      {
        dayOffset: -7,
        title: 'Step 1: Outward Sales Invoices & GSTR-1 Request',
        subject: 'Reminder: Request for Sales Register & B2B Invoices for [Month]',
        templateBody: 'Dear [ClientName],\n\nTo ensure timely reconciliation and avoid interest, please share your outward sales register and e-invoices by [DueMinus5]. Our audit desk has commenced 2B reconciliation.\n\nWarm regards,\nAarav & Associates',
        channel: 'both'
      },
      {
        dayOffset: -3,
        title: 'Step 2: 2B Mismatch & Document Nudge',
        subject: 'Action Required: GSTR-2B ITC Mismatch Reconciliation for [ClientName]',
        templateBody: 'Dear [ClientName],\n\nWe have identified Rs. [MismatchAmount] in ITC pending supplier upload. Kindly review the attached mismatch worksheet and confirm invoice payments.\n\nCompliance Desk,\nAarav Advisors',
        channel: 'both'
      },
      {
        dayOffset: -1,
        title: 'Step 3: Final Tax Challan & Approval Request',
        subject: 'URGENT: Net GST Payable Challan for [Month] - Due Tomorrow',
        templateBody: 'Dear [ClientName],\n\nThe final net tax payable for GSTR-3B is Rs. [NetPayable]. Please approve the challan or remit via NetBanking before 6 PM tomorrow to avoid portal congestion.\n\nRegards,\nPartner in Charge',
        channel: 'both'
      },
      {
        dayOffset: 1,
        title: 'Step 4: Overdue Alert & Late Fee Warning',
        subject: 'OVERDUE: Statutory GSTR-3B Filing Pending - Late Fee Accruing',
        templateBody: 'Dear [ClientName],\n\nYour GSTR-3B return was due yesterday. Daily statutory late fee under Sec 47 is now accruing. Please sign off immediately.\n\nUrgent Notice,\nAarav & Associates',
        channel: 'both'
      }
    ]
  },
  {
    id: 'drip-2',
    name: 'Class-3 DSC Token Expiry Drip',
    triggerEvent: 'dsc_expiry',
    active: true,
    frequency: 'Automated 30/15/7/1 Days Prior to Expiry',
    recipientCount: 8,
    lastTriggered: '2026-09-12',
    steps: [
      {
        dayOffset: -30,
        title: '30 Days Prior: Renewal Notice & KYC Refresh',
        subject: 'Notice: Class-3 Digital Signature (DSC) Expiring in 30 Days for [HolderName]',
        templateBody: 'Dear [HolderName] / [ClientName],\n\nYour Class-3 DSC token issued by [IssuingCA] is scheduled to expire on [ExpiryDate]. To prevent interruption in MCA/GST filings, we have initiated renewal paperwork.\n\nBest regards,\nAarav Compliance Desk',
        channel: 'email'
      },
      {
        dayOffset: -10,
        title: '10 Days Prior: Video KYC Link & Aadhaar Verification',
        subject: 'Action Needed: Complete 2-Min Video KYC for DSC Token Renewal',
        templateBody: 'Dear [HolderName],\n\nPlease click the secure e-Mudhra portal link below to complete Aadhaar OTP & 10-second video recording for your renewed Class-3 token:\n[KycPortalLink]\n\nWarm regards,\nAarav Secretarial Team',
        channel: 'both'
      },
      {
        dayOffset: -2,
        title: '2 Days Prior: Urgent Escalation & Statutory Freeze Warning',
        subject: 'CRITICAL: DSC Expires in 48 Hours - Filing Signatures at Risk',
        templateBody: 'Dear [ClientName] Directors,\n\nWithout an active DSC after [ExpiryDate], statutory filings cannot be uploaded. Please complete the pending verification today.\n\nPartner Escalation,\nCA Aarav Sharma',
        channel: 'both'
      }
    ]
  },
  {
    id: 'drip-3',
    name: 'Advance Tax Instalment Reminder Drip',
    triggerEvent: 'advance_tax_due',
    active: true,
    frequency: 'Quarterly (June 15, Sept 15, Dec 15, Mar 15)',
    recipientCount: 65,
    lastTriggered: '2026-09-05',
    steps: [
      {
        dayOffset: -10,
        title: '10 Days: P&L Estimation & Projected Tax Demand',
        subject: 'Notice: 2nd Advance Tax Instalment (45%) Due on 15th September',
        templateBody: 'Dear [ClientName],\n\nUnder Section 208/211 of the Income Tax Act, 45% of total estimated annual tax is payable by September 15. Please review the attached computation sheet.\n\nDirect Tax Team,\nAarav Advisors',
        channel: 'email'
      },
      {
        dayOffset: -2,
        title: '2 Days: Challan 280 ITNS Pre-Filled Link',
        subject: 'Reminder: Remit Advance Tax Challan via e-Filing Portal',
        templateBody: 'Dear [ClientName],\n\nYour pre-filled Challan 280 (Major Head 0021 / Minor Head 100) is ready for Rs. [Amount]. Pay online to avoid Sec 234B/C interest.\n\nRegards,\nAarav & Associates',
        channel: 'both'
      }
    ]
  }
];

export const INITIAL_CUSTOM_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'cf-1',
    targetEntity: 'client',
    label: 'Internal File Number',
    fieldKey: 'internal_file_no',
    fieldType: 'text',
    placeholder: 'e.g. DEL-CORP-2026-088',
    required: true,
    defaultValue: 'DEL-CORP-'
  },
  {
    id: 'cf-2',
    targetEntity: 'client',
    label: 'Assessing Officer Ward / Circle',
    fieldKey: 'ao_ward',
    fieldType: 'text',
    placeholder: 'e.g. Ward 7(1), Civic Centre, New Delhi',
    required: false
  },
  {
    id: 'cf-3',
    targetEntity: 'client',
    label: 'Annual Turnover Slab',
    fieldKey: 'turnover_slab',
    fieldType: 'select',
    options: ['Micro (< Rs. 5 Cr)', 'Small (Rs. 5 - 50 Cr)', 'Medium (Rs. 50 - 250 Cr)', 'Corporate (> Rs. 250 Cr)'],
    required: true,
    defaultValue: 'Small (Rs. 5 - 50 Cr)'
  },
  {
    id: 'cf-4',
    targetEntity: 'client',
    label: 'UDIN Pre-approval Required',
    fieldKey: 'udin_preapproval',
    fieldType: 'boolean',
    required: false,
    defaultValue: 'true'
  },
  {
    id: 'cf-5',
    targetEntity: 'task',
    label: 'Challan BSR Code & Ref',
    fieldKey: 'challan_bsr_code',
    fieldType: 'text',
    placeholder: '7-digit BSR + 5-digit Challan No',
    required: false
  },
  {
    id: 'cf-6',
    targetEntity: 'task',
    label: 'Client Approval Sign-off Date',
    fieldKey: 'client_signoff_date',
    fieldType: 'date',
    required: false
  }
];

export const INITIAL_CLIENT_VISITS: ClientVisit[] = [
  {
    id: 'vis-1',
    clientId: 'c1',
    clientName: 'Acme Tech Solutions Ltd',
    visitorId: 'u-1',
    visitorName: 'CA Aarav Sharma',
    visitorRole: 'Senior Partner',
    visitDate: '2026-09-12',
    startTime: '14:30',
    endTime: '17:00',
    purpose: 'Statutory Audit',
    location: 'Cyber City, Tower B, 8th Floor, Gurugram',
    contactPerson: 'Vikramaditya Singhania (MD) & Priya Rao (CFO)',
    minutesOfMeeting: 'Reviewed internal financial controls over R&D capitalization (Ind AS 38). Discussed SEZ unit tax holiday under Section 10AA. Agreed on schedule of fixed assets impairment review before next board meeting.',
    actionItems: [
      'Collect third-party software valuation certificate by Sept 18',
      'Verify physical delivery challans for imported testing hardware',
      'Provide draft transfer pricing form 3CEB benchmark study'
    ],
    expenseClaimed: 850,
    status: 'Completed'
  },
  {
    id: 'vis-2',
    clientId: 'c2',
    clientName: 'Bharat Infrastructure Ltd',
    visitorId: 'u-2',
    visitorName: 'CA Meera Nair',
    visitorRole: 'Tax Partner',
    visitDate: '2026-09-14',
    startTime: '11:00',
    endTime: '13:30',
    purpose: 'Scrutiny Hearing',
    location: 'Office of ACIT Circle 7(1), Room 304, CR Building, ITO, New Delhi',
    contactPerson: 'Mr. Arvind Saxena, IRS (Assessing Officer)',
    minutesOfMeeting: 'Attended personal hearing for AY 2024-25 faceless scrutiny reassessment notice under Sec 148. Submitted paperbook containing bank reconciliation for EPC subcontract payments and TDS proof under Sec 194C.',
    actionItems: [
      'Submit ledger extract of top 5 sub-contractors on e-Filing portal',
      'Draft response clarifying difference between Form 26AS and Audited P&L'
    ],
    expenseClaimed: 450,
    status: 'Completed'
  },
  {
    id: 'vis-3',
    clientId: 'c4',
    clientName: 'Stellar Lifestyle Brands',
    visitorId: 'u-4',
    visitorName: 'Sneha Verma',
    visitorRole: 'Audit Senior',
    visitDate: '2026-09-14',
    startTime: '10:00',
    endTime: undefined,
    purpose: 'Stock Verification',
    location: 'Central Warehouse, Sector 63, Noida',
    contactPerson: 'Sanjay Rawat (Warehouse Manager)',
    minutesOfMeeting: 'Conducting sample physical count of high-value designer apparel and leather accessories against SAP ERP inventory balances. Checking damaged goods write-off policy.',
    actionItems: [
      'Reconcile physical variance in Bin 42 vs ERP stock ledger',
      'Obtain signed stock confirmation sheet from warehouse head'
    ],
    expenseClaimed: 600,
    status: 'Scheduled'
  },
  {
    id: 'vis-4',
    clientId: 'c3',
    clientName: 'Zenith Solar Energy LLP',
    visitorId: 'u-3',
    visitorName: 'Rahul Gupta',
    visitorRole: 'Article Clerk',
    visitDate: '2026-09-16',
    startTime: '15:00',
    endTime: undefined,
    purpose: 'Document Collection',
    location: 'Udyog Vihar Phase IV, Gurugram',
    contactPerson: 'Kunal Malhotra (Partner)',
    minutesOfMeeting: 'Scheduled visit to collect physical vendor agreements, EPC invoices, and original loan sanction letters for bank debt compliance certification.',
    actionItems: [
      'Take signature on Form 3CA/3CD representation letter',
      'Collect physical bank statement stamp from SBI Commercial branch'
    ],
    expenseClaimed: 350,
    status: 'Scheduled'
  }
];

export const PORTAL_QUICK_LOGINS: PortalQuickLogin[] = [
  {
    id: 'portal-gst',
    portalKey: 'GST',
    name: 'Goods & Services Tax Network (GSTN)',
    portalUrl: 'https://services.gst.gov.in/services/login',
    description: 'Official GST Common Portal for GSTR-1, GSTR-3B, GSTR-9/9C filing, ITC-04 and refund processing.',
    suggestedCredentialsCategory: 'GST_PORTAL',
    quickActions: [
      { label: 'GSTR-2B Auto-Drafted ITC Statement', url: 'https://return.gst.gov.in/returns/auth/gstr2b' },
      { label: 'Create Tax Payment Challan (PMT-06)', url: 'https://payment.gst.gov.in/payment/otc/challan' },
      { label: 'Search Taxpayer by GSTIN/UIN', url: 'https://services.gst.gov.in/services/searchtp' }
    ]
  },
  {
    id: 'portal-itr',
    portalKey: 'ITR',
    name: 'Income Tax e-Filing Portal 2.0',
    portalUrl: 'https://eportal.incometax.gov.in/iec/foservices/#/login',
    description: 'Government e-Filing system for ITR-1 through 7, Form 3CA/3CD Tax Audits, 10E, 15CA/CB and Scrutiny responses.',
    suggestedCredentialsCategory: 'INCOME_TAX',
    quickActions: [
      { label: 'View Form 26AS (Tax Credit Statement)', url: 'https://eportal.incometax.gov.in/iec/foservices/#/dashboard/tax-credit' },
      { label: 'Annual Information Statement (AIS / TIS)', url: 'https://ais.insight.gov.in/compliance' },
      { label: 'e-Verify Pending Return (Aadhaar OTP / DSC)', url: 'https://eportal.incometax.gov.in/iec/foservices/#/e-verify' },
      { label: 'File Statutory CA Forms (3CA/3CD, 10B)', url: 'https://eportal.incometax.gov.in/iec/foservices/#/dashboard/file-statutory-forms' }
    ]
  },
  {
    id: 'portal-traces',
    portalKey: 'TRACES',
    name: 'TDS Reconciliation Analysis and Correction Enabling System (TRACES)',
    portalUrl: 'https://contents.tdscpc.gov.in/',
    description: 'CPC TDS portal for Form 16/16A generation, Conso file downloads, justification reports and online TDS corrections.',
    suggestedCredentialsCategory: 'TRACES',
    quickActions: [
      { label: 'Download Form 16A (Non-Salary TDS)', url: 'https://www.tdscpc.gov.in/app/ded/form16a.xhtml' },
      { label: 'Request Consolidated Conso File', url: 'https://www.tdscpc.gov.in/app/ded/consofile.xhtml' },
      { label: 'Download Justification Report for Defaults', url: 'https://www.tdscpc.gov.in/app/ded/justification.xhtml' },
      { label: 'TDS Online Challan Correction', url: 'https://www.tdscpc.gov.in/app/ded/onlinecorrection.xhtml' }
    ]
  },
  {
    id: 'portal-mca',
    portalKey: 'MCA',
    name: 'Ministry of Corporate Affairs (MCA21 V3)',
    portalUrl: 'https://www.mca.gov.in/content/mca/global/en/foportal/fologin.html',
    description: 'V3 portal for DIN KYC (DIR-3 KYC), Annual Returns (AOC-4, MGT-7), Company Incorporations (SPICe+) and Charge Filings (CHG-1/4).',
    suggestedCredentialsCategory: 'MCA_V3',
    quickActions: [
      { label: 'DIR-3 KYC Web / e-Form Filing', url: 'https://www.mca.gov.in/mcafoportal/showDir3Kyc.do' },
      { label: 'View Company / LLP Master Data', url: 'https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do' },
      { label: 'Check Director DIN Status', url: 'https://www.mca.gov.in/mcafoportal/showEnquireDIN.do' },
      { label: 'Track SRN Payment & Challan Status', url: 'https://www.mca.gov.in/mcafoportal/trackPaymentStatus.do' }
    ]
  },
  {
    id: 'portal-epfo',
    portalKey: 'EPFO',
    name: 'EPFO & ESIC Shram Suvidha Portal',
    portalUrl: 'https://unifiedportal-emp.epfindia.gov.in/epfo/',
    description: 'Unified statutory compliance portal for Monthly PF ECR filing, Challan generation, and ESIC contribution payments.',
    suggestedCredentialsCategory: 'EPFO_ESIC',
    quickActions: [
      { label: 'ECR Monthly Return Upload (EPFO)', url: 'https://unifiedportal-emp.epfindia.gov.in/epfo/ecr' },
      { label: 'Generate Electronic Challan cum Return', url: 'https://unifiedportal-emp.epfindia.gov.in/epfo/challan' },
      { label: 'ESIC Monthly Contribution Filing', url: 'https://www.esic.in/EmployerPortal/ESICInsurancePortal/PortalLogin.aspx' }
    ]
  }
];
