import { StatutoryFilingTemplate } from '../types';

export const INITIAL_STATUTORY_TEMPLATES: StatutoryFilingTemplate[] = [
  {
    id: 'tpl-gst-3b',
    templateCode: 'GST-GSTR3B-V3.2',
    title: 'GSTR-3B Monthly Summary Return & ITC Settlement',
    authority: 'Goods & Services Tax Network (GSTN)',
    category: 'GST',
    frequency: 'Monthly',
    applicableLaw: 'Section 39(1) of CGST Act 2017 read with Rule 61(5)',
    standardDueDateDescription: '20th of the subsequent month (for monthly filers) or 22nd/24th under QRMP',
    penaltyAndLateFeeProvisions: 'Late fee: ₹50/day (₹20/day for Nil returns) capped at ₹5,000 under Sec 47 + Interest @ 18% p.a. on net tax liability under Sec 50(1)',
    description: 'Standardized monthly self-assessment return for declaring summary values of outward supplies, inter-State supplies, reverse charge liability, eligible ITC, exempt inward supplies, and statutory payment of tax.',
    version: 'v3.2 (AY 2026-27 Compliant)',
    isStandardized: true,
    isFavorite: true,
    tags: ['GST', 'Monthly Return', 'ITC', 'Rule 36(4)', 'Section 39'],
    mandatoryAttachments: [
      'GSTR-2B Auto-Drafted ITC Statement for the tax period',
      'Electronic Liability Register Part I & II summary',
      'Electronic Credit Ledger Balance Certificate'
    ],
    fieldSchemas: [
      { id: 'f1', label: 'GSTIN of Taxpayer', key: 'gstin', type: 'gstin', required: true, description: '15-digit Goods & Services Tax Identification Number', helpText: 'Format: 2 digits State Code + 10 chars PAN + 1 Entity + 1 Z + 1 Checksum' },
      { id: 'f2', label: 'Legal Name / Trade Name', key: 'legalName', type: 'text', required: true, description: 'Registered Legal Business Entity Name' },
      { id: 'f3', label: 'Return Period (Month & Year)', key: 'returnPeriod', type: 'text', required: true, description: 'Format: MM-YYYY (e.g., 08-2026)' },
      { id: 'f4', label: 'Table 3.1(a) Outward Taxable Supplies (Other than Zero/Nil/Exempt)', key: 'outwardTaxableSupplies', type: 'currency', required: true, description: 'Total taxable value of standard outward supplies' },
      { id: 'f5', label: 'Table 3.1(a) Integrated Tax (IGST)', key: 'igstLiability', type: 'currency', required: true, description: 'IGST payable on inter-State outward supplies' },
      { id: 'f6', label: 'Table 3.1(a) Central Tax (CGST)', key: 'cgstLiability', type: 'currency', required: true, description: 'CGST payable on intra-State outward supplies' },
      { id: 'f7', label: 'Table 3.1(a) State/UT Tax (SGST)', key: 'sgstLiability', type: 'currency', required: true, description: 'SGST payable on intra-State outward supplies' },
      { id: 'f8', label: 'Table 3.1(d) Inward Supplies Liable to Reverse Charge (RCM)', key: 'rcmInwardValue', type: 'currency', required: false, description: 'Taxable value of supplies received subject to Reverse Charge Sec 9(3)/9(4)' },
      { id: 'f9', label: 'Table 4(A)(5) All Other ITC from GSTR-2B', key: 'allOtherItc', type: 'currency', required: true, description: 'Eligible input tax credit auto-matched with GSTR-2B' },
      { id: 'f10', label: 'Table 4(B)(1) ITC Reversal under Rule 38, 42 & 43', key: 'itcReversalPermanent', type: 'currency', required: false, description: 'Permanent reversal of ineligible/exempt-attributable credit' },
      { id: 'f11', label: 'Table 4(B)(2) Others ITC Reversal (Rule 37 - 180 Days Non-payment)', key: 'itcReversalTemporary', type: 'currency', required: false, description: 'Temporary reversal reclaimable upon vendor settlement' },
      { id: 'f12', label: 'Table 6.1 Tax Paid through ITC Utilization (IGST/CGST/SGST)', key: 'taxPaidThroughCredit', type: 'currency', required: true, description: 'Offset of liability as per Sec 49 / Rule 88A set-off hierarchy' },
      { id: 'f13', label: 'Table 6.1 Tax Paid in Cash (Electronic Cash Ledger)', key: 'taxPaidInCash', type: 'currency', required: true, description: 'Challan CPIN deposit net cash settlement' }
    ],
    validationChecklist: [
      { id: 'v1', checkName: 'GSTR-2B vs Table 4(A) ITC Parity', severity: 'BLOCKING_ERROR', ruleDescription: 'Total ITC claimed under Table 4(A)(5) must not exceed 100% of auto-drafted GSTR-2B ITC under Rule 36(4).' },
      { id: 'v2', checkName: 'GSTR-1 vs GSTR-3B Taxable Turnover Match', severity: 'WARNING', ruleDescription: 'Table 3.1 outward tax liability must align within +/- 0.5% tolerance of filed GSTR-1 Table 4/5/7.' },
      { id: 'v3', checkName: 'Rule 88A ITC Set-Off Sequence', severity: 'BLOCKING_ERROR', ruleDescription: 'IGST credit must be completely exhausted before utilizing CGST and SGST credits.' },
      { id: 'v4', checkName: 'RCM Cash Payment Enforceability', severity: 'BLOCKING_ERROR', ruleDescription: 'Reverse Charge tax liability (Table 3.1(d)) cannot be settled via ITC and must be discharged 100% in cash.' }
    ],
    jsonSampleSchema: JSON.stringify({
      gstin: "27AABCU9603R1ZM",
      legalName: "Apex Global Infotech Pvt Ltd",
      returnPeriod: "08-2026",
      table31: {
        outwardTaxableSupplies: 8450000.00,
        igstLiability: 420000.00,
        cgstLiability: 547250.00,
        sgstLiability: 547250.00,
        rcmInwardTaxableValue: 120000.00,
        rcmTaxPayable: 21600.00
      },
      table4ITC: {
        allOtherItcGstr2b: 684000.00,
        itcReversalRule42_43: 15400.00,
        itcReversalRule37_180Days: 8200.00,
        netItcAvailable: 660400.00
      },
      table6Payment: {
        creditUtilized: 660400.00,
        cashPaid: 875700.00,
        challanCpin: "26082700984124"
      }
    }, null, 2),
    guidelinesNotes: 'Ensure adherence to CBIC Circular No. 170/02/2022-GST regarding mandatory reporting of gross ITC and subsequent reversals under Table 4(B)(1) vs Table 4(B)(2). Always verify E-way bill synchronization with Table 3.1.',
    lastUpdated: '2026-08-15'
  },
  {
    id: 'tpl-gst-1',
    templateCode: 'GST-GSTR1-V4.0',
    title: 'GSTR-1 Statement of Outward Supplies & HSN Summary',
    authority: 'Goods & Services Tax Network (GSTN)',
    category: 'GST',
    frequency: 'Monthly',
    applicableLaw: 'Section 37 of CGST Act 2017 read with Rule 59',
    standardDueDateDescription: '11th of the following month for monthly filers (13th for QRMP IFF)',
    penaltyAndLateFeeProvisions: 'Late fee: ₹50/day (₹20/day for Nil) under Sec 47. Non-filing blocks GSTR-3B generation and E-Way bill generation.',
    description: 'Statutory outward invoice register detailing B2B taxable sales, B2C Large, B2C Small, Exports (with/without payment), Credit/Debit Notes, and 6-digit/8-digit HSN-wise summary.',
    version: 'v4.0 (Mandatory 6-digit HSN Rule)',
    isStandardized: true,
    isFavorite: true,
    tags: ['GST', 'Outward Supplies', 'E-Invoice', 'HSN', 'B2B'],
    mandatoryAttachments: [
      'IRN / QR Code Verified E-Invoice Register',
      'Export Invoices with Shipping Bill / Bill of Export details',
      'HSN / SAC Master Reconciliation Register'
    ],
    fieldSchemas: [
      { id: 'f1', label: 'GSTIN', key: 'gstin', type: 'gstin', required: true, description: 'Taxpayer 15-digit GSTIN' },
      { id: 'f2', label: 'Tax Period', key: 'taxPeriod', type: 'text', required: true, description: 'MM-YYYY' },
      { id: 'f3', label: 'Table 4: B2B Invoices Count & Gross Value', key: 'b2bCount', type: 'number', required: true, description: 'Number of recipient-tagged B2B invoices' },
      { id: 'f4', label: 'Table 4: Total B2B Taxable Value', key: 'b2bTaxableValue', type: 'currency', required: true, description: 'Aggregate value of sales to registered entities' },
      { id: 'f5', label: 'Table 6A: Exports (Zero Rated Supplies)', key: 'exportTaxableValue', type: 'currency', required: false, description: 'Direct exports with/without IGST payment' },
      { id: 'f6', label: 'Table 7: B2C (Small) Net Taxable Value', key: 'b2cSmallValue', type: 'currency', required: false, description: 'Intra-state and inter-state supplies below ₹2.5 Lakhs to unregistered consumers' },
      { id: 'f7', label: 'Table 9: Credit / Debit Notes (Registered)', key: 'cdnrValue', type: 'currency', required: false, description: 'Adjustments to previously reported B2B invoices' },
      { id: 'f8', label: 'Table 12: HSN Summary Total Quantity & Value', key: 'hsnSummaryGross', type: 'currency', required: true, description: 'Mandatory 6-digit HSN code summary for aggregate turnover > ₹5 Cr' }
    ],
    validationChecklist: [
      { id: 'v1', checkName: 'E-Invoice IRN Auto-Population Reconciliation', severity: 'BLOCKING_ERROR', ruleDescription: 'All B2B invoices above threshold must match with IRP Portal IRN hashes.' },
      { id: 'v2', checkName: 'HSN Summary Tax vs Rate Grid Parity', severity: 'BLOCKING_ERROR', ruleDescription: 'Total tax across Table 12 HSN summary must exactly match sum of Tables 4, 5, 6, 7 & 9.' },
      { id: 'v3', checkName: 'Place of Supply (POS) Rule Alignment', severity: 'WARNING', ruleDescription: 'State code in POS must match recipient GSTIN state code for standard domestic supplies.' }
    ],
    jsonSampleSchema: JSON.stringify({
      gstin: "27AABCU9603R1ZM",
      period: "08-2026",
      table4_b2b: [
        {
          recipientGstin: "29AABCB1234Q1Z1",
          invoiceNo: "INV-2026-0891",
          invoiceDate: "2026-08-14",
          taxableValue: 450000.00,
          pos: "29-Karnataka",
          rate: 18,
          igst: 81000.00,
          irn: "9f8b4c2e1a3d5e7f0b9a8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f"
        }
      ],
      table12_hsn: [
        { hsnCode: "998313", description: "IT Consulting and Support Services", uqc: "OTH", totalQty: 1, totalValue: 450000.00, taxableValue: 450000.00, igst: 81000.00 }
      ]
    }, null, 2),
    guidelinesNotes: 'Per Rule 48(4), any B2B supply made without IRN by a mandated entity shall not be treated as a valid tax invoice. Ensure recipient GSTIN active status is validated via the sandbox API before generation.',
    lastUpdated: '2026-08-20'
  },
  {
    id: 'tpl-it-26q',
    templateCode: 'IT-FORM26Q-TDS-V6.1',
    title: 'Form 26Q Quarterly TDS Statement (Non-Salary Deductions)',
    authority: 'Income Tax Department (CPC)',
    category: 'Direct Tax & TDS',
    frequency: 'Quarterly',
    applicableLaw: 'Section 200(3) of Income Tax Act, 1961 read with Rule 31A',
    standardDueDateDescription: '31st July (Q1), 31st October (Q2), 31st January (Q3), 31st May (Q4)',
    penaltyAndLateFeeProvisions: 'Late fee: ₹200/day under Section 234E until default continues, capped at TDS amount + Penalty under Section 271H (₹10,000 to ₹1,00,000)',
    description: 'Statutory quarterly filing for tax deducted at source from domestic resident payees under Chapter XVII-B (Sections 194C Contractor, 194J Professional, 194I Rent, 194Q Purchase of Goods, 194H Commission).',
    version: 'v6.1 (FY 2026-27 FVU 8.4)',
    isStandardized: true,
    isFavorite: true,
    tags: ['TDS', 'Form 26Q', 'Income Tax', 'TRACES', 'Section 194J', 'Section 194Q'],
    mandatoryAttachments: [
      'Challan ITNS 281 Payment Receipts (CIN / BSR Code + Date + Challan Serial)',
      'Deductee PAN Master Verification Log (Active & Aadhaar Linked)',
      'Lower/Nil Deduction Certificates under Section 197 (if applicable)'
    ],
    fieldSchemas: [
      { id: 'f1', label: 'TAN of Deductor', key: 'tan', type: 'text', required: true, description: '10-digit Tax Deduction and Collection Account Number (e.g., MUMB12345E)', validationRule: 'regex:^[A-Z]{4}[0-9]{5}[A-Z]{1}$' },
      { id: 'f2', label: 'PAN of Deductor Entity', key: 'pan', type: 'pan', required: true, description: '10-digit Permanent Account Number of Deductor' },
      { id: 'f3', label: 'Financial Year & Quarter', key: 'quarter', type: 'select', options: ['Q1 (Apr-Jun)', 'Q2 (Jul-Sep)', 'Q3 (Oct-Dec)', 'Q4 (Jan-Mar)'], required: true, description: 'Filing quarter' },
      { id: 'f4', label: 'Challan Count & Total Deposit', key: 'challanTotalDeposit', type: 'currency', required: true, description: 'Sum of all BSR-verified ITNS 281 Challan payments' },
      { id: 'f5', label: 'Section 194C (Payments to Contractors) TDS', key: 'sec194cTds', type: 'currency', required: false, description: 'TDS @ 1% (Ind/HUF) or 2% (Corporate)' },
      { id: 'f6', label: 'Section 194J (Fees for Professional / Tech Services)', key: 'sec194jTds', type: 'currency', required: false, description: 'TDS @ 2% (Technical/FTS) or 10% (Professional)' },
      { id: 'f7', label: 'Section 194I (Rent on Land, Building & Machinery)', key: 'sec194iTds', type: 'currency', required: false, description: 'TDS @ 2% (Plant/Machinery) or 10% (Land/Building)' },
      { id: 'f8', label: 'Section 194Q (TDS on Purchase of Goods > ₹50L)', key: 'sec194qTds', type: 'currency', required: false, description: 'TDS @ 0.1% on purchase turnover exceeding threshold' },
      { id: 'f9', label: 'Higher Rate TDS under Section 206AB (Non-filers)', key: 'sec206abApplied', type: 'boolean', required: true, description: 'Whether 206AB compliance check was run on TRACES for non-filing deductees' }
    ],
    validationChecklist: [
      { id: 'v1', checkName: 'PAN Operative & Aadhaar Linkage Validation', severity: 'BLOCKING_ERROR', ruleDescription: 'Inoperative PANs must be subjected to higher TDS @ 20% under Section 206AA to avoid TRACES default notices.' },
      { id: 'v2', checkName: 'Challan Balance Over-consumption Check', severity: 'BLOCKING_ERROR', ruleDescription: 'Deductee-allocated TDS cannot exceed total available challan deposit amount in ITNS 281.' },
      { id: 'v3', checkName: 'Section 197 Certificate Quoting & Threshold', severity: 'WARNING', ruleDescription: 'Valid 10-digit certificate number and flag "A" or "B" must be specified for concessional rates.' }
    ],
    jsonSampleSchema: JSON.stringify({
      tan: "MUMA09124E",
      pan: "AABCU9603R",
      financialYear: "2026-2027",
      quarter: "Q1",
      challans: [
        {
          bsrCode: "0210045",
          challanDate: "2026-07-06",
          challanSerialNo: "00492",
          minorHead: "200 (TDS Payable by Taxpayer)",
          tdsAmount: 185000.00,
          interest: 0,
          fee234E: 0,
          totalDeposit: 185000.00
        }
      ],
      deducteeRecordsCount: 24,
      totalDeductionAmount: 185000.00
    }, null, 2),
    guidelinesNotes: 'Validate Section 194J(a) vs 194J(b) distinction carefully (2% for technical services vs 10% for professional services) to prevent short-deduction intimation under Section 200A.',
    lastUpdated: '2026-07-28'
  },
  {
    id: 'tpl-it-3cd',
    templateCode: 'IT-FORM3CD-AUDIT-V5',
    title: 'Form 3CD Tax Audit Statement of Particulars (Section 44AB)',
    authority: 'Income Tax Department (CPC)',
    category: 'Direct Tax & TDS',
    frequency: 'Annual',
    applicableLaw: 'Section 44AB of Income Tax Act 1961 read with Rule 6G(1)(b)',
    standardDueDateDescription: '30th September (or 31st October for specified entities) of the Assessment Year',
    penaltyAndLateFeeProvisions: 'Penalty under Section 271B: 0.5% of total turnover / gross receipts, capped at ₹1,50,000 for failure to get accounts audited and furnished.',
    description: 'Comprehensive 44-clause statutory statement of particulars to be furnished by a practicing Chartered Accountant for businesses exceeding statutory turnover thresholds (₹10 Cr for digital business, ₹1 Cr standard, ₹75L for professionals).',
    version: 'v5.2 (Includes Section 43B(h) MSME 45-day Rule Clauses)',
    isStandardized: true,
    isFavorite: true,
    tags: ['Tax Audit', 'Form 3CD', 'Section 44AB', 'MSME 43B(h)', 'Depreciation Sec 32'],
    mandatoryAttachments: [
      'Audited Financial Statements (Balance Sheet, P&L, Notes, Cash Flow)',
      'Form 3CA / Form 3CB Auditor Report signed with UDIN',
      'Clause 44 Break-up of Total Expenditure in respect of GST registered/unregistered entities',
      'Clause 22 MSME Interest & Overdue Calculation Schedule'
    ],
    fieldSchemas: [
      { id: 'f1', label: 'Assessee Legal Name', key: 'assesseeName', type: 'text', required: true, description: 'Name of audited business entity' },
      { id: 'f2', label: 'Assessee PAN', key: 'pan', type: 'pan', required: true, description: '10-digit PAN of assessee' },
      { id: 'f3', label: 'Assessment Year', key: 'ay', type: 'text', required: true, description: 'e.g., AY 2026-27' },
      { id: 'f4', label: 'Clause 8: Relevant Sub-clause of Section 44AB', key: 'clause8Subclause', type: 'select', options: ['Clause (a) - Business Turnover > ₹10 Cr / ₹1 Cr', 'Clause (b) - Professional Receipts > ₹75L', 'Clause (c) - Section 44AE / 44BB / 44BBB lower profit', 'Clause (d) - Section 44ADA lower profit', 'Clause (e) - Section 44AD(4) audit'], required: true, description: 'Statutory basis of audit' },
      { id: 'f5', label: 'Clause 13: Method of Accounting Employed', key: 'clause13Accounting', type: 'select', options: ['Mercantile System', 'Cash System (only for specified professions)'], required: true, description: 'Accounting method compliant with ICDS' },
      { id: 'f6', label: 'Clause 21(a): Disallowances under Section 40(a)(ia) (TDS Non-deduction/Non-payment)', key: 'clause21aDisallowance', type: 'currency', required: false, description: '30% disallowance for default in TDS payment' },
      { id: 'f7', label: 'Clause 22: Disallowance under Section 43B(h) for MSME Dues (>15/45 Days)', key: 'clause22MsmeDisallowance', type: 'currency', required: false, description: 'Payments due to Micro/Small enterprises unpaid within mandated period' },
      { id: 'f8', label: 'Clause 33: Section 269SS / 269ST / 269T Loan / Deposit Transactions in Cash', key: 'clause33CashViolations', type: 'currency', required: false, description: 'Acceptance or repayment of loan/deposit > ₹20,000 in cash' },
      { id: 'f9', label: 'Auditor UDIN (Unique Document Identification Number)', key: 'udin', type: 'text', required: true, description: '18-digit mandatory ICAI UDIN generated before e-filing signature' }
    ],
    validationChecklist: [
      { id: 'v1', checkName: 'ICAI Mandatory UDIN Generation & Verification', severity: 'BLOCKING_ERROR', ruleDescription: 'UDIN must be generated on icai.org within 60 days and quoted on e-filing portal to avoid invalidation.' },
      { id: 'v2', checkName: 'Section 43B(h) MSME Udyam Categorization Check', severity: 'BLOCKING_ERROR', ruleDescription: 'Ensure vendors classified as Micro/Small are verified against Udyam Portal. Medium enterprises are excluded.' },
      { id: 'v3', checkName: 'ICDS Deviation Reporting Parity (Clause 13(d))', severity: 'WARNING', ruleDescription: 'Reconciliation between books profit and ICDS computation must be fully balanced.' }
    ],
    jsonSampleSchema: JSON.stringify({
      assesseePan: "AABCU9603R",
      assessmentYear: "2026-27",
      turnoverGrossReceipts: 48200000.00,
      clause21a_tdsDisallowance: 120000.00,
      clause22_msmeDisallowance43Bh: 450000.00,
      clause34_tdsFurnishingDiscrepancies: 0.00,
      auditorDetails: {
        firmName: "K. K. & Associates, Chartered Accountants",
        frn: "109842W",
        signingPartner: "CA Rajiv Sharma, FCA",
        membershipNo: "049812",
        udin: "26049812BGHYTU8921"
      }
    }, null, 2),
    guidelinesNotes: 'Special emphasis required for Clause 44 (GST expenditure break-up). Even if the assessee is not registered under GST, expenditure incurred from registered vs unregistered entities must be reported.',
    lastUpdated: '2026-08-10'
  },
  {
    id: 'tpl-mca-aoc4',
    templateCode: 'MCA-AOC4-XBRL-V2026',
    title: 'MCA Form AOC-4 / AOC-4 XBRL (Filing of Financial Statements)',
    authority: 'Ministry of Corporate Affairs (MCA)',
    category: 'MCA & Corporate Law',
    frequency: 'Annual',
    applicableLaw: 'Section 137 of Companies Act 2013 read with Rule 12 of Companies (Accounts) Rules 2014',
    standardDueDateDescription: 'Within 30 days from the date of Annual General Meeting (AGM) (Typically 30th October)',
    penaltyAndLateFeeProvisions: 'Additional fee: ₹100 per day of delay under Section 403 with no upper cap + Company fine up to ₹10,000 + ₹100/day and Director fine up to ₹1,00,000 + ₹100/day.',
    description: 'Statutory electronic form for filing audited balance sheet, profit and loss account, cash flow statement, directors report, corporate social responsibility report, and secretarial audit report with the Registrar of Companies (ROC).',
    version: 'v2026.1 (V3 Portal Taxonomy)',
    isStandardized: true,
    isFavorite: false,
    tags: ['MCA', 'ROC', 'AOC-4', 'XBRL', 'Financial Statements', 'Companies Act 2013'],
    mandatoryAttachments: [
      'Duly certified Copy of Audited Financial Statements (including Notes to Accounts)',
      'Independent Auditors Report with CARO 2020 annexures',
      'Board of Directors Report under Section 134 with MGT-9 / Extracts',
      'Notice of AGM and Extract of AGM Minutes adopting accounts',
      'XBRL Validated XML Instance Document (for mandated companies)'
    ],
    fieldSchemas: [
      { id: 'f1', label: 'Corporate Identification Number (CIN)', key: 'cin', type: 'text', required: true, description: '21-digit CIN registered with MCA', validationRule: 'regex:^[LU]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$' },
      { id: 'f2', label: 'Company Name', key: 'companyName', type: 'text', required: true, description: 'Registered Company Name as per MCA V3 Master Data' },
      { id: 'f3', label: 'Financial Year End Date', key: 'fyEndDate', type: 'date', required: true, description: 'Closing date of financial year (e.g. 2026-03-31)' },
      { id: 'f4', label: 'Date of AGM', key: 'agmDate', type: 'date', required: true, description: 'Date on which Annual General Meeting was held' },
      { id: 'f5', label: 'Whether Accounts were Adopted at AGM', key: 'accountsAdopted', type: 'boolean', required: true, description: 'Confirm adoption by shareholders' },
      { id: 'f6', label: 'Paid-Up Share Capital (in ₹)', key: 'paidUpCapital', type: 'currency', required: true, description: 'Total paid-up equity & preference capital' },
      { id: 'f7', label: 'Revenue from Operations (in ₹)', key: 'revenueOps', type: 'currency', required: true, description: 'Topline net sales/services' },
      { id: 'f8', label: 'Profit / Loss After Tax (PAT) (in ₹)', key: 'pat', type: 'currency', required: true, description: 'Net profit or loss after current & deferred tax' },
      { id: 'f9', label: 'CARO 2020 Applicability', key: 'caroApplicable', type: 'boolean', required: true, description: 'Whether Companies (Auditor Report) Order 2020 is applicable' }
    ],
    validationChecklist: [
      { id: 'v1', checkName: 'MCA V3 Master Data CIN Check', severity: 'BLOCKING_ERROR', ruleDescription: 'CIN and active director DINs must be validated in MCA V3 portal before form pre-scrutiny.' },
      { id: 'v2', checkName: 'CARO 2020 Reporting Completeness', severity: 'BLOCKING_ERROR', ruleDescription: 'All 21 clauses of CARO 2020 must have explicit positive/negative auditor affirmations.' },
      { id: 'v3', checkName: 'Director DSC & Auditor DSC Affixation', severity: 'BLOCKING_ERROR', ruleDescription: 'Must be signed by managing director/director and certified by practicing CA/CS/CWA with valid DSC.' }
    ],
    jsonSampleSchema: JSON.stringify({
      cin: "U72200MH2018PTC309142",
      companyName: "Nexus Zenith Cloudworks Private Limited",
      financialYearEnding: "2026-03-31",
      dateOfBoardMeeting: "2026-08-22",
      dateOfAgm: "2026-09-25",
      financialMetrics: {
        paidUpCapital: 5000000.00,
        reservesAndSurplus: 18450000.00,
        borrowings: 6200000.00,
        revenueFromOperations: 54100000.00,
        profitAfterTax: 7890000.00
      },
      caro2020Applicable: true,
      auditorDetails: {
        auditorFirmName: "R. K. Mehta & Co.",
        frn: "112345W",
        udin: "26099124AHJYKO4912"
      }
    }, null, 2),
    guidelinesNotes: 'Companies with paid-up capital of ₹5 Cr+ or turnover of ₹100 Cr+ must file AOC-4 in XBRL format using MCA taxonomy. Ensure all ratios under Schedule III Division I/II are calculated.',
    lastUpdated: '2026-08-01'
  },
  {
    id: 'tpl-mca-mgt7',
    templateCode: 'MCA-MGT7-ANNUAL-V3',
    title: 'MCA Form MGT-7 / MGT-7A (Annual Return of Company)',
    authority: 'Ministry of Corporate Affairs (MCA)',
    category: 'MCA & Corporate Law',
    frequency: 'Annual',
    applicableLaw: 'Section 92 of Companies Act 2013 read with Rule 11 of Companies (Management and Administration) Rules 2014',
    standardDueDateDescription: 'Within 60 days from the date of Annual General Meeting (Typically 29th November)',
    penaltyAndLateFeeProvisions: 'Additional fee: ₹100 per day of delay under Section 403 without upper ceiling + Penalty under Section 92(5).',
    description: 'Annual return containing statutory particulars of registered office, principal business activities, holding/subsidiary/associate companies, shares, debentures, shareholding pattern, directors/KMP remuneration, and meetings held.',
    version: 'v3.1 (MCA V3 portal compliant)',
    isStandardized: true,
    isFavorite: false,
    tags: ['MCA', 'MGT-7', 'Annual Return', 'Shareholding Pattern', 'Directors'],
    mandatoryAttachments: [
      'List of Shareholders and Debenture Holders as on financial year closing',
      'Form MGT-8 Certificate by Practicing Company Secretary (if applicable)',
      'Details of Penalties / Punishments imposed on company / directors (if any)'
    ],
    fieldSchemas: [
      { id: 'f1', label: 'CIN of Company', key: 'cin', type: 'text', required: true, description: '21-character Corporate Identification Number' },
      { id: 'f2', label: 'Filing Category', key: 'filingCategory', type: 'select', options: ['Form MGT-7 (Standard Company)', 'Form MGT-7A (Small Company / OPC)'], required: true, description: 'Form variant based on Small Company threshold' },
      { id: 'f3', label: 'Total Number of Board Meetings Held', key: 'boardMeetingsCount', type: 'number', required: true, description: 'Count of valid board meetings during the FY' },
      { id: 'f4', label: 'Promoter Shareholding Percentage (%)', key: 'promoterHoldingPct', type: 'number', required: true, description: 'Percentage of shares held by promoters' },
      { id: 'f5', label: 'Public / Institutional Shareholding (%)', key: 'publicHoldingPct', type: 'number', required: true, description: 'Percentage held by non-promoters' }
    ],
    validationChecklist: [
      { id: 'v1', checkName: 'Board Meeting Gap Compliance (Sec 173(1))', severity: 'WARNING', ruleDescription: 'Interval between two consecutive board meetings must not exceed 120 days.' },
      { id: 'v2', checkName: 'Shareholding Sum 100% Verification', severity: 'BLOCKING_ERROR', ruleDescription: 'Total of promoter, public, and institutional shareholding percentages must equal 100%.' }
    ],
    jsonSampleSchema: JSON.stringify({
      cin: "U72200MH2018PTC309142",
      type: "MGT-7",
      financialYear: "2025-2026",
      agmDate: "2026-09-25",
      shareCapital: {
        authorizedCapital: 10000000.00,
        issuedPaidUpCapital: 5000000.00
      },
      shareholdersCount: 4,
      boardMeetingsHeld: 5,
      mgt8Required: false
    }, null, 2),
    guidelinesNotes: 'For Small Companies (Paid-up capital <= ₹4 Cr and Turnover <= ₹40 Cr), file Form MGT-7A which does not require Company Secretary certification.',
    lastUpdated: '2026-08-05'
  },
  {
    id: 'tpl-it-advtax',
    templateCode: 'IT-ADVTAX-SEC208-V2',
    title: 'Advance Tax Computation & Section 234B/C Interest Optimizer',
    authority: 'Income Tax Department (CPC)',
    category: 'Direct Tax & TDS',
    frequency: 'Quarterly',
    applicableLaw: 'Sections 208, 209, 210, 211, 234B and 234C of Income Tax Act 1961',
    standardDueDateDescription: '15th June (15%), 15th September (45%), 15th December (75%), 15th March (100%)',
    penaltyAndLateFeeProvisions: 'Mandatory interest @ 1% per month under Section 234C for deferment of installments + Interest @ 1% per month under Section 234B if total advance tax < 90% of assessed tax.',
    description: 'Standardized computational schedule for estimating annual business income, applying direct tax slabs/concessional rates (Sec 115BAA 22% for corporates), deducting projected TDS/TCS credits, and determining exact quarterly installment dues.',
    version: 'v2.4 (AY 2026-27 Slabs)',
    isStandardized: true,
    isFavorite: true,
    tags: ['Advance Tax', 'Section 208', 'Section 234B', 'Section 234C', 'Direct Tax'],
    mandatoryAttachments: [
      'Year-to-date Profit & Loss Account and Revenue Forecast',
      'Form 26AS / AIS / TIS TDS Credit statement',
      'Prior Year Assessment Orders affecting carry forward business loss/depreciation'
    ],
    fieldSchemas: [
      { id: 'f1', label: 'Assessee Tax Regime & Category', key: 'taxRegime', type: 'select', options: ['Domestic Company (Sec 115BAA - 22% Flat)', 'Domestic Company (Standard 25%/30%)', 'Partnership Firm / LLP (30% Flat)', 'Individual / HUF (New Regime Sec 115BAC)', 'Individual / HUF (Old Regime)'], required: true, description: 'Applicable tax regime' },
      { id: 'f2', label: 'Estimated Total Gross Income for FY', key: 'estimatedIncome', type: 'currency', required: true, description: 'Projected taxable business profit & other sources' },
      { id: 'f3', label: 'Applicable Base Tax Rate (%)', key: 'taxRatePct', type: 'number', required: true, description: 'Base tax rate percentage' },
      { id: 'f4', label: 'Surcharge & Health and Education Cess (4%)', key: 'cessAmount', type: 'currency', required: true, description: 'Surcharge + 4% mandatory cess' },
      { id: 'f5', label: 'Estimated TDS / TCS Credits Receivable', key: 'projectedTdsTcs', type: 'currency', required: true, description: 'Projected credit reflecting in Form 26AS / AIS' },
      { id: 'f6', label: 'Net Assessed Tax Payable (Sec 209)', key: 'netAssessedTax', type: 'currency', required: true, description: 'Gross tax liability minus TDS/TCS' },
      { id: 'f7', label: 'Current Installment Target Quarter', key: 'installmentQuarter', type: 'select', options: ['1st Installment (15% by Jun 15)', '2nd Installment (45% by Sep 15)', '3rd Installment (75% by Dec 15)', '4th Installment (100% by Mar 15)'], required: true, description: 'Target milestone' }
    ],
    validationChecklist: [
      { id: 'v1', checkName: 'Section 208 Minimum ₹10,000 Threshold', severity: 'COMPLIANCE_ADVISORY', ruleDescription: 'Advance tax obligation arises only if net assessed tax after TDS/TCS is ₹10,000 or more.' },
      { id: 'v2', checkName: 'Section 234C Safe Harbor Check (12% and 36%)', severity: 'WARNING', ruleDescription: 'For Q1 and Q2, safe harbor exemption applies if paid tax is at least 12% and 36% respectively of assessed tax.' }
    ],
    jsonSampleSchema: JSON.stringify({
      assesseeName: "Horizon Dynamics LLP",
      pan: "AABFH8912P",
      financialYear: "2026-2027",
      estimatedPbt: 14500000.00,
      taxComputation: {
        baseTax30Pct: 4350000.00,
        surcharge12Pct: 522000.00,
        cess4Pct: 194880.00,
        grossTaxPayable: 5066880.00,
        projectedTdsCredits: 1200000.00,
        netAdvanceTaxPayable: 3866880.00
      },
      quarterlySchedule: {
        q1_15Pct_Jun15: 580032.00,
        q2_45Pct_Sep15: 1740096.00,
        q3_75Pct_Dec15: 2900160.00,
        q4_100Pct_Mar15: 3866880.00
      }
    }, null, 2),
    guidelinesNotes: 'Capital gains income or lottery/windfall income cannot be estimated beforehand; pay installment in remaining quarters without 234C penalty if incurred post due-date.',
    lastUpdated: '2026-08-25'
  },
  {
    id: 'tpl-epf-ecr',
    templateCode: 'LABOR-EPF-ECR-V2',
    title: 'EPF Electronic Challan cum Return (ECR Monthly Wage Return)',
    authority: 'EPFO & ESIC',
    category: 'Labor & Payroll',
    frequency: 'Monthly',
    applicableLaw: 'Employees Provident Funds and Miscellaneous Provisions Act, 1952 read with EPF Scheme 1952',
    standardDueDateDescription: '15th of the following month',
    penaltyAndLateFeeProvisions: 'Damages under Section 14B (up to 25% per annum) + Interest under Section 7Q @ 12% p.a. for delayed remittance.',
    description: 'Standardized monthly electronic challan statement detailing member Universal Account Numbers (UAN), gross wages, EPF wages, EPS wages, EDLI wages, employee 12% deduction, and employer statutory contribution splits (A/c 1, A/c 2, A/c 10, A/c 21, A/c 22).',
    version: 'v2.0 (UAN Portal 2.0 Text Specification)',
    isStandardized: true,
    isFavorite: false,
    tags: ['EPF', 'ECR', 'Payroll', 'Labor Law', 'UAN'],
    mandatoryAttachments: [
      'Monthly Payroll Wage Register & Attendance Summary',
      'New Joiner Form 11 Declarations & UAN Allotment Slips',
      'Bank TRRN Payment Authorization Receipt'
    ],
    fieldSchemas: [
      { id: 'f1', label: 'EPF Establishment Code', key: 'estCode', type: 'text', required: true, description: 'Unique alphanumeric establishment code (e.g. MHBAN0012345000)' },
      { id: 'f2', label: 'Wage Month & Year', key: 'wageMonth', type: 'text', required: true, description: 'Format: MM-YYYY' },
      { id: 'f3', label: 'Total Contributing Employees Count', key: 'empCount', type: 'number', required: true, description: 'Active eligible members' },
      { id: 'f4', label: 'Total EPF Wages (in ₹)', key: 'epfWagesTotal', type: 'currency', required: true, description: 'Sum of basic + DA subject to ₹15,000 ceiling or actual' },
      { id: 'f5', label: 'Employee Share (12% A/c 1)', key: 'employeeShare', type: 'currency', required: true, description: '12% deducted from employees' },
      { id: 'f6', label: 'Employer Share - Pension Scheme (8.33% A/c 10)', key: 'employerEpsShare', type: 'currency', required: true, description: '8.33% capped at ₹1,250/member' },
      { id: 'f7', label: 'Employer Share - EPF Difference (3.67% A/c 1)', key: 'employerEpfDiffShare', type: 'currency', required: true, description: 'Balance of 12% employer contribution' },
      { id: 'f8', label: 'EPF Admin Charges (0.50% A/c 2) & EDLI (0.50% A/c 21)', key: 'adminEdliCharges', type: 'currency', required: true, description: 'Statutory administrative levies' }
    ],
    validationChecklist: [
      { id: 'v1', checkName: 'Member UAN Active Status & KYC Parity', severity: 'BLOCKING_ERROR', ruleDescription: 'All member UANs must be seeded with Aadhaar and active on unified portal.' },
      { id: 'v2', checkName: 'Wage Ceiling Capping Check (₹15,000)', severity: 'WARNING', ruleDescription: 'EPS wage must not exceed ₹15,000 unless joint option under Para 11(3)/11(4) is approved.' }
    ],
    jsonSampleSchema: JSON.stringify({
      establishmentId: "MHBAN0091245000",
      wageMonth: "08-2026",
      memberCount: 48,
      grossWages: 3240000.00,
      epfWages: 720000.00,
      epsWages: 720000.00,
      contributions: {
        ac1_employeeShare12: 86400.00,
        ac1_employerShare3_67: 26424.00,
        ac10_employerEps8_33: 59976.00,
        ac2_adminCharges0_50: 3600.00,
        ac21_edli0_50: 3600.00,
        totalRemittanceChallan: 180000.00
      }
    }, null, 2),
    guidelinesNotes: 'Generate the standardized `#~#` separated text file as per EPFO ECR 2.0 file format for direct portal upload and TRRN challan generation.',
    lastUpdated: '2026-08-12'
  },
  {
    id: 'tpl-gst-drc03',
    templateCode: 'GST-DRC03-VOLUNTARY-V2',
    title: 'Form GST DRC-03 / DRC-01A (Voluntary Tax Payment & SCN Response)',
    authority: 'Goods & Services Tax Network (GSTN)',
    category: 'GST',
    frequency: 'Event-Based',
    applicableLaw: 'Section 73(5) or Section 74(5) / Section 74A of CGST Act 2017 read with Rule 142',
    standardDueDateDescription: 'Within 30 days of receiving DRC-01A intimation or voluntary discovery before notice issuance',
    penaltyAndLateFeeProvisions: 'Zero penalty under Section 73(5) / Sec 74A if tax + interest is paid voluntarily prior to SCN; 15% penalty if paid within 30 days of SCN under Section 74(5).',
    description: 'Standard statutory declaration form for making voluntary tax settlements, discharging liabilities discovered during audit/reconciliation, or responding to Form GST DRC-01A pre-show-cause intimations.',
    version: 'v2.1 (AY 2026-27 Update)',
    isStandardized: true,
    isFavorite: false,
    tags: ['GST', 'DRC-03', 'Voluntary Payment', 'Audit Settlement', 'Section 73'],
    mandatoryAttachments: [
      'Detailed computational statement of tax liability with invoice breakdown',
      'Electronic Cash Ledger / Credit Ledger payment reference',
      'Formal written representation letter addressed to Jurisdictional Proper Officer'
    ],
    fieldSchemas: [
      { id: 'f1', label: 'GSTIN', key: 'gstin', type: 'gstin', required: true, description: 'Taxpayer GSTIN' },
      { id: 'f2', label: 'Cause of Payment', key: 'causeOfPayment', type: 'select', options: ['Voluntary Discovery (Audit / Reconciliation)', 'In response to DRC-01A Pre-SCN Intimation', 'In response to Form GST ASMT-10 Notice', 'Annual Return GSTR-9 / 9C Discrepancy', 'Others'], required: true, description: 'Statutory ground' },
      { id: 'f3', label: 'Section under which Payment is Made', key: 'sectionGround', type: 'select', options: ['Section 73(5) - No Fraud/Suppression', 'Section 74(5) - Fraud/Willful Misstatement', 'Section 74A - Unified Determination (AY 2024+)', 'Section 129 / 130 - E-Way Bill / Detention'], required: true, description: 'Governing statutory provision' },
      { id: 'f4', label: 'Financial Year & Period', key: 'taxPeriod', type: 'text', required: true, description: 'e.g. FY 2025-26 (04-2025 to 03-2026)' },
      { id: 'f5', label: 'Tax Amount Discharged (IGST+CGST+SGST)', key: 'taxAmount', type: 'currency', required: true, description: 'Principal tax payable' },
      { id: 'f6', label: 'Interest Calculated under Section 50(1)', key: 'interestAmount', type: 'currency', required: true, description: 'Interest @ 18% p.a. calculated from due date to payment date' },
      { id: 'f7', label: 'Penalty Amount (if applicable)', key: 'penaltyAmount', type: 'currency', required: false, description: 'Voluntary penalty or 15% as applicable' }
    ],
    validationChecklist: [
      { id: 'v1', checkName: 'Mandatory Section 50(1) Interest Calculation Check', severity: 'BLOCKING_ERROR', ruleDescription: 'Voluntary settlement under Sec 73(5) is legally incomplete unless accompanied by exact statutory interest.' },
      { id: 'v2', checkName: 'PRN & ARN Generation Verification', severity: 'COMPLIANCE_ADVISORY', ruleDescription: 'Ensure ARN is submitted to Proper Officer to obtain final acknowledgement in Form GST DRC-04.' }
    ],
    jsonSampleSchema: JSON.stringify({
      gstin: "27AABCU9603R1ZM",
      cause: "Voluntary Discovery (Audit / Reconciliation)",
      section: "Section 73(5)",
      financialYear: "2025-2026",
      settlementBreakup: {
        taxIgst: 145000.00,
        taxCgst: 0.00,
        taxSgst: 0.00,
        interestSec50: 18450.00,
        penalty: 0.00,
        totalPaid: 163450.00
      },
      paymentMode: "Electronic Cash Ledger (Challan CIN 26081290124)"
    }, null, 2),
    guidelinesNotes: 'Upon filing DRC-03, insist on issuance of Form GST DRC-04 (Acknowledgement of acceptance) by the jurisdictional tax officer to bring finality to the proceedings.',
    lastUpdated: '2026-08-18'
  }
];
