import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  UploadCloud, 
  Search, 
  X, 
  FileText, 
  Download, 
  Eye, 
  Copy, 
  Check, 
  Trash2, 
  Tag, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  FileCheck, 
  Shield, 
  Filter, 
  Layers, 
  FileSpreadsheet, 
  FileType, 
  Landmark,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { collection, addDoc, onSnapshot, serverTimestamp, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface SopStep {
  stepNumber: number;
  title: string;
  detail: string;
  mandatory: boolean;
}

export interface PracticeMaterial {
  id: string;
  title: string;
  category: 
    | 'Standard Operating Procedure (SOP)' 
    | 'Statutory Audit Checklist' 
    | 'GST & Tax Litigation Format' 
    | 'Income Tax Precedent' 
    | 'MCA / Corporate Law Guide' 
    | 'Advisory Note & Memorandum' 
    | 'Firm Policy & HR Manual';
  department: 'Direct Tax' | 'GST & Indirect Tax' | 'Statutory Audit' | 'Corporate Law & ROC' | 'Forensic & Valuation' | 'General Practice';
  version: string;
  fileType: 'PDF' | 'DOCX' | 'XLSX' | 'TXT' | 'SOP_DOC';
  fileName: string;
  fileSize: string;
  fileDataUrl?: string; // base64 or text preview for download and reading
  description: string;
  tags: string[];
  author: string;
  confidentiality: 'Firm-Wide (All Staff)' | 'Qualified CAs & Managers' | 'Partners Only';
  effectiveDate: string;
  sopSteps?: SopStep[];
  sopGuidelines?: string;
  sourceType: 'file_upload' | 'sop_editor' | 'statutory_template';
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'aarav_practice_knowledge_base_v2';

// 6 Authentic, production-grade practice materials and SOPs
const INITIAL_MATERIALS: PracticeMaterial[] = [
  {
    id: 'mat-1',
    title: 'GST SCN DRC-01 Reply & Litigation Defense SOP (Rule 142)',
    category: 'Standard Operating Procedure (SOP)',
    department: 'GST & Indirect Tax',
    version: 'v3.2 (FY 2026-27)',
    fileType: 'PDF',
    fileName: 'GST_DRC01_Litigation_Defense_SOP_v3.pdf',
    fileSize: '1.8 MB',
    description: 'Comprehensive practice standard for triaging DRC-01 notices, segregating Section 73 vs 74 issues, demanding personal hearing under 75(4), and drafting High Court grounded rejoinders.',
    tags: ['DRC-01', 'Rule 142', 'Section 73/74', 'Personal Hearing', 'ITC Disallowance'],
    author: 'Adv. Suresh Mehta (Litigation Partner)',
    confidentiality: 'Firm-Wide (All Staff)',
    effectiveDate: '2026-04-01',
    sourceType: 'statutory_template',
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: '2026-08-15T10:00:00.000Z',
    sopGuidelines: 'Ensure all submissions cite jurisdictional High Court precedents. Never submit without unconditional request for personal hearing under Section 75(4). Verify DIN on CBIC portal prior to responding.',
    sopSteps: [
      { stepNumber: 1, title: 'Notice Ingestion & DIN Verification', detail: 'Download complete Form GST DRC-01 alongside annexures from the GST portal. Verify 20-digit DIN validity on cbic.gov.in.', mandatory: true },
      { stepNumber: 2, title: 'Three-Way Quantitative Reconciliation', detail: 'Cross-reconcile GSTR-1 outward supplies vs GSTR-3B tax paid vs GSTR-2B eligible ITC for the disputed periods.', mandatory: true },
      { stepNumber: 3, title: 'Charge Analysis (Section 73 vs 74)', detail: 'Examine whether Department has discharged primary burden of establishing intentional suppression or fraud for invocation of extended 5-year period.', mandatory: true },
      { stepNumber: 4, title: 'Statutory Personal Hearing Request', detail: 'Mandatorily incorporate paragraph invoking Section 75(4) of CGST Act for personal appearance before any adverse order is pronounced.', mandatory: true },
      { stepNumber: 5, title: 'Partner Review & Form DRC-06 E-filing', detail: 'Secure Tax Partner sign-off on factual annexures, execute Vakalatnama/Form GST PCT-01, and upload point-wise reply via DRC-06.', mandatory: true }
    ]
  },
  {
    id: 'mat-2',
    title: 'Income Tax Audit Form 3CD Preparation & Verification Workpaper SOP',
    category: 'Statutory Audit Checklist',
    department: 'Direct Tax',
    version: 'v2.4 (AY 2026-27)',
    fileType: 'XLSX',
    fileName: 'Form_3CD_Comprehensive_Verification_Workpaper.xlsx',
    fileSize: '2.4 MB',
    description: 'Clause-by-clause standard operating checklist for Section 44AB audits, covering ICDS compliance, 40(a)(ia) disallowances, 43B(h) MSME due dates, and Clause 44 GST spendings.',
    tags: ['44AB', 'Form 3CD', 'Clause 44', 'MSME 43B(h)', 'ICDS', 'TDS 194Q'],
    author: 'CA Rajesh Sharma (Tax Audit Partner)',
    confidentiality: 'Qualified CAs & Managers',
    effectiveDate: '2026-07-01',
    sourceType: 'statutory_template',
    createdAt: '2026-08-20T11:30:00.000Z',
    updatedAt: '2026-08-20T11:30:00.000Z',
    sopGuidelines: 'Special focus required on MSME vendor classification under Section 43B(h). All payments beyond 15/45 days must be disallowed and reported in Clause 22.',
    sopSteps: [
      { stepNumber: 1, title: 'Turnover & Audit Applicability Check', detail: 'Confirm turnover limits (₹10 Cr limit if cash receipts & payments <= 5%; otherwise ₹1 Cr standard threshold).', mandatory: true },
      { stepNumber: 2, title: 'Clause 13 ICDS Compliance Matrix', detail: 'Check accounting standards AS/Ind AS deviations and compute required ICDS additions/deductions.', mandatory: true },
      { stepNumber: 3, title: 'Clause 22 MSME 43B(h) Verification', detail: 'Extract MSME registration Udyam certificates from all vendor accounts. Match payment dates against Section 15 of MSMED Act 2006.', mandatory: true },
      { stepNumber: 4, title: 'Clause 34 TDS/TCS Return Reconciliation', detail: 'Reconcile total payments subject to TDS with Form 26Q/24Q quarterly returns filed. Highlight late deduction/deposit interest.', mandatory: true },
      { stepNumber: 5, title: 'Clause 44 GST Expenditure Breakdown', detail: 'Segregate total expenditure into: entities registered under GST vs entities not registered under GST with reason codes.', mandatory: true }
    ]
  },
  {
    id: 'mat-3',
    title: 'Statutory Bank Branch Audit LFAR & NPA Verification SOP',
    category: 'Statutory Audit Checklist',
    department: 'Statutory Audit',
    version: 'v4.0 (RBI Master Norms)',
    fileType: 'DOCX',
    fileName: 'RBI_Bank_Branch_Audit_LFAR_Checklist.docx',
    fileSize: '980 KB',
    description: 'Step-by-step branch audit procedure covering 90-day overdue IRAC asset classification, Drawing Power computation against stock statements, and LFAR reporting.',
    tags: ['Bank Audit', 'LFAR', 'NPA', 'IRAC Norms', 'Drawing Power', 'MOC'],
    author: 'CA Ananya Deshmukh (Assurance Partner)',
    confidentiality: 'Firm-Wide (All Staff)',
    effectiveDate: '2026-03-15',
    sourceType: 'statutory_template',
    createdAt: '2026-08-10T09:00:00.000Z',
    updatedAt: '2026-08-10T09:00:00.000Z',
    sopGuidelines: 'Verify whether Drawing Power is refreshed strictly on monthly stock statements. Outdated statements older than 90 days render accounts vulnerable to NPA classification.',
    sopSteps: [
      { stepNumber: 1, title: 'Initial Branch System Walkthrough', detail: 'Obtain CBS audit access, trial balance, outstanding advances portfolio, and previous year inspection/concurrent audit reports.', mandatory: true },
      { stepNumber: 2, title: 'Large Advances & Drawing Power Audit', detail: 'Verify top 20% or accounts over ₹1 Cr. Re-calculate Drawing Power considering DP margin, paid stock, and debtors < 90 days.', mandatory: true },
      { stepNumber: 3, title: 'IRAC Prudential Asset Classification', detail: 'Check continuous 90-day interest/principal overdue status. Verify SMA-0, SMA-1, and SMA-2 flagging in CBS.', mandatory: true },
      { stepNumber: 4, title: 'Revenue Leakage & Concession Testing', detail: 'Sample inspect interest subvention, processing charge waivers, and penal interest application on non-renewed limits.', mandatory: false },
      { stepNumber: 5, title: 'Memorandum of Changes (MOC) & LFAR', detail: 'Quantify audit adjustments in Form MOC for provision adjustments and compile comprehensive answers to all LFAR queries.', mandatory: true }
    ]
  },
  {
    id: 'mat-4',
    title: 'Companies Act 2013 Annual Secretarial Filing SOP (AOC-4 & MGT-7)',
    category: 'MCA / Corporate Law Guide',
    department: 'Corporate Law & ROC',
    version: 'v2.1 (MCA21 V3)',
    fileType: 'PDF',
    fileName: 'MCA_Annual_Filing_AOC4_MGT7_SOP.pdf',
    fileSize: '1.4 MB',
    description: 'Protocol for conducting Annual General Meeting (AGM), Director Report statutory disclosures, Form AOC-4 XBRL/Non-XBRL preparation, and Form MGT-7 annual return filing.',
    tags: ['MCA21', 'AOC-4', 'MGT-7', 'AGM', 'Companies Act', 'Director KYC'],
    author: 'CS Priyanka Agarwal (Secretarial Practice Lead)',
    confidentiality: 'Firm-Wide (All Staff)',
    effectiveDate: '2026-06-01',
    sourceType: 'statutory_template',
    createdAt: '2026-08-25T14:20:00.000Z',
    updatedAt: '2026-08-25T14:20:00.000Z',
    sopGuidelines: 'Ensure Director DIN KYC is active and DSC is registered on MCA21 V3 portal with 2-Factor Authentication prior to filing attempts.',
    sopSteps: [
      { stepNumber: 1, title: 'Financial Statement Adoption & AGM Notice', detail: 'Review Board approval of standalone & consolidated balance sheet. Ensure AGM notice issued with 21 clear days.', mandatory: true },
      { stepNumber: 2, title: 'Auditor Report & CARO Verification', detail: 'Confirm statutory auditor report includes clean CARO 2020 annexure and internal financial controls (IFCoFR) certification.', mandatory: true },
      { stepNumber: 3, title: 'Form AOC-4 Preparation & Upload', detail: 'Draft Form AOC-4 within 30 days of AGM. Attach financial statements, board report, and corporate social responsibility (CSR) annexure.', mandatory: true },
      { stepNumber: 4, title: 'Form MGT-7 Annual Return Drafting', detail: 'File MGT-7/MGT-7A within 60 days of AGM with shareholder registers, director changes, and share transfer details.', mandatory: true }
    ]
  },
  {
    id: 'mat-5',
    title: 'Income Tax Section 148 Reassessment Notice Triage & Writ Guide',
    category: 'Income Tax Precedent',
    department: 'Direct Tax',
    version: 'v1.9 (Finance Act Regime)',
    fileType: 'PDF',
    fileName: 'Section148_Reassessment_Quashing_Precedents.pdf',
    fileSize: '3.1 MB',
    description: 'Authoritative defense workflow against reassessment notices under Section 148/148A. Covers statutory time limitations under Section 149 and jurisdictional challenge precedents.',
    tags: ['Section 148', 'Section 148A', 'Writ Petition', 'Section 149', 'Reassessment'],
    author: 'CA & Adv. Suresh Mehta (Litigation Partner)',
    confidentiality: 'Partners Only',
    effectiveDate: '2026-05-10',
    sourceType: 'statutory_template',
    createdAt: '2026-08-12T16:45:00.000Z',
    updatedAt: '2026-08-12T16:45:00.000Z',
    sopGuidelines: 'Verify whether the approval under Section 151 was accorded by the designated authority (Pr. CCIT/CCIT) or an incompetent officer. Lack of sanction renders notice void ab initio.',
    sopSteps: [
      { stepNumber: 1, title: 'Section 148A(b) Notice Analysis', detail: 'Check if notice provides information suggesting escaped income. Verify minimum 7-day to 30-day response window is provided.', mandatory: true },
      { stepNumber: 2, title: 'Statutory Approval Sanction Check (Sec 151)', detail: 'Examine approval sheet. For cases beyond 3 years, sanction must be granted by Principal Chief Commissioner of Income Tax.', mandatory: true },
      { stepNumber: 3, title: 'Monetary Threshold Verification (Sec 149)', detail: 'If assessment year is older than 3 years, confirm alleged income escaping assessment strictly exceeds ₹50 Lakhs.', mandatory: true },
      { stepNumber: 4, title: 'Jurisdictional Objection Submission', detail: 'Submit factual objections detailing non-applicability and request drop of proceedings under Section 148A(d).', mandatory: true }
    ]
  },
  {
    id: 'mat-6',
    title: 'Firm Quality Control SOP: Client Onboarding, KYC & SQC-1 Engagement',
    category: 'Firm Policy & HR Manual',
    department: 'General Practice',
    version: 'v1.6 (ICAI SQC 1 Compliant)',
    fileType: 'DOCX',
    fileName: 'Client_Onboarding_and_SQC1_Checklist.docx',
    fileSize: '720 KB',
    description: 'Mandatory standard operating procedure governing new client risk evaluation, NOC from retiring auditor (ICAI Code of Ethics Clause 8), CKYC collection, and Engagement Letters.',
    tags: ['SQC 1', 'Client Onboarding', 'KYC', 'NOC Auditor', 'Engagement Letter'],
    author: 'Managing Partner (Practice Quality Committee)',
    confidentiality: 'Firm-Wide (All Staff)',
    effectiveDate: '2026-04-01',
    sourceType: 'statutory_template',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z',
    sopGuidelines: 'Under no circumstances should field work commence without a counter-signed Engagement Letter and written evidence of communication with the previous auditor under Clause 8.',
    sopSteps: [
      { stepNumber: 1, title: 'Integrity & Independence Assessment', detail: 'Evaluate client risk profile, PEP status, and confirm Aarav Advisors independence from any conflict of interest.', mandatory: true },
      { stepNumber: 2, title: 'Previous Auditor Communication (Clause 8)', detail: 'Send formal communication via registered post/speed post/acknowledged email to predecessor auditor seeking professional clearance.', mandatory: true },
      { stepNumber: 3, title: 'KYC & Beneficial Ownership Documentation', detail: 'Collect PAN, Aadhaar of Key Management Personnel, COI, MOA/AOA, and GST certificates. Verify active status on MCA portal.', mandatory: true },
      { stepNumber: 4, title: 'Formal Engagement Letter Execution', detail: 'Draft and countersign bilateral Engagement Letter conforming to SA 210 detailing fee schedule and scope.', mandatory: true }
    ]
  }
];

// Quick Import Templates
const STATUTORY_QUICK_TEMPLATES = [
  {
    title: 'GSTR-9 & GSTR-9C Annual Return Audit Reconciliation SOP',
    category: 'Standard Operating Procedure (SOP)' as const,
    department: 'GST & Indirect Tax' as const,
    version: 'v2.0 (FY 2025-26 / 2026-27)',
    fileName: 'GSTR9_9C_Annual_Reconciliation_SOP.pdf',
    fileSize: '1.9 MB',
    fileType: 'PDF' as const,
    description: 'Step-by-step SOP for Table 5 outward supplies turnover reconciliation, Table 8 ITC reconciliation vs GSTR-2B, and Table 14 differential tax liabilities.',
    tags: ['GSTR-9', 'GSTR-9C', 'Table 8 ITC', 'Table 5 Turnover', 'Annual Return'],
    author: 'CA Rajesh Sharma (Tax Partner)',
    confidentiality: 'Firm-Wide (All Staff)' as const,
    effectiveDate: '2026-08-01',
    guidelines: 'Verify that all DRC-03 voluntary payments for earlier tax periods are properly accounted in Table 9 and not counted twice in audited financials.',
    steps: [
      { stepNumber: 1, title: 'Source Data Consolidation', detail: 'Download GSTR-1, GSTR-3B summary, and auto-populated Table 8A/8B JSON files from GST common portal.', mandatory: true },
      { stepNumber: 2, title: 'Turnover & Rate-wise Reconciliation', detail: 'Match audited financial statement revenue with GSTR-1 Table 4, 5, 6, 7. Account for unbilled revenue adjustments.', mandatory: true },
      { stepNumber: 3, title: 'ITC Eligibility & Reversal Reconciliation', detail: 'Cross-check GSTR-2B vs 3B Table 4(A) vs Table 4(B) reversals under Rule 38, 42, and 43.', mandatory: true },
      { stepNumber: 4, title: 'Discrepancy Reporting & DRC-03 Generation', detail: 'Quantify unresolved tax liabilities and generate Form GST DRC-03 under voluntary cause code.', mandatory: true }
    ]
  },
  {
    title: 'TDS Section 194Q & TCS Section 206C(1H) Goods Transaction SOP',
    category: 'Standard Operating Procedure (SOP)' as const,
    department: 'Direct Tax' as const,
    version: 'v1.5 (High Turnover Vendors)',
    fileName: 'TDS_194Q_TCS_206C1H_Mutual_Exclusion_SOP.docx',
    fileSize: '840 KB',
    fileType: 'DOCX' as const,
    description: 'Clear decision-tree protocol resolving statutory hierarchy between buyer TDS under 194Q (0.1%) vs seller TCS under 206C(1H), including higher rates under 206AB/206CCA.',
    tags: ['194Q', '206C(1H)', '206AB', 'TDS on Goods', 'High Value Purchases'],
    author: 'Direct Tax Practice Group',
    confidentiality: 'Firm-Wide (All Staff)' as const,
    effectiveDate: '2026-05-01',
    guidelines: 'Section 194Q takes statutory precedence over Section 206C(1H). If buyer deducts TDS under 194Q, seller must NOT collect TCS.',
    steps: [
      { stepNumber: 1, title: 'Turnover Applicability Threshold', detail: 'Verify if buyer turnover in preceding FY exceeded ₹10 Crore and purchase value from single seller exceeds ₹50 Lakhs.', mandatory: true },
      { stepNumber: 2, title: 'Statutory Hierarchy Enforcement', detail: 'Apply 194Q deduction at 0.1% at the time of credit or payment, whichever is earlier.', mandatory: true },
      { stepNumber: 3, title: 'Specified Person Check (Sec 206AB)', detail: 'Run seller PAN through Income Tax Compliance Check portal to ensure non-filer higher rate (5%) is not triggered.', mandatory: true }
    ]
  },
  {
    title: 'Transfer Pricing Local File & Form 3CEB Statutory Audit SOP',
    category: 'Statutory Audit Checklist' as const,
    department: 'Direct Tax' as const,
    version: 'v3.0 (International & Specified Domestic)',
    fileName: 'Transfer_Pricing_LocalFile_Form3CEB_SOP.pdf',
    fileSize: '2.8 MB',
    fileType: 'PDF' as const,
    description: 'Arm’s length price benchmarking procedure, selection of Most Appropriate Method (TNMM/CUP), search strategy in Prowess/Capitaline databases, and Form 3CEB sign-off.',
    tags: ['Transfer Pricing', '3CEB', 'Arm Length Price', 'TNMM', 'Local File'],
    author: 'International Tax Practice Committee',
    confidentiality: 'Qualified CAs & Managers' as const,
    effectiveDate: '2026-07-01',
    guidelines: 'Always ensure contemporaneous documentation is compiled before Form 3CEB filing date (October 31).',
    steps: [
      { stepNumber: 1, title: 'Associated Enterprise (AE) Identification', detail: 'Map shareholding and management controls under Section 92A(1) & (2) to identify all related entities.', mandatory: true },
      { stepNumber: 2, title: 'Transaction Quantitation & FAR Analysis', detail: 'Prepare detailed Functions, Assets, and Risks (FAR) profile for each category of international transaction.', mandatory: true },
      { stepNumber: 3, title: 'Benchmarking & Comparable Search', detail: 'Execute quantitative search filters on database. Compute 35th to 65th percentile range under Rule 10CA.', mandatory: true },
      { stepNumber: 4, title: 'Form 3CEB Accountant Report Sign-off', detail: 'Verify accountant certificate and upload Form 3CEB via CA portal with partner digital signature.', mandatory: true }
    ]
  }
];

export function KnowledgeBase() {
  const [materials, setMaterials] = useState<PracticeMaterial[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_MATERIALS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<PracticeMaterial | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Form States
  const [activeTab, setActiveTab] = useState<'upload' | 'draft_sop' | 'templates'>('upload');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PracticeMaterial['category']>('Standard Operating Procedure (SOP)');
  const [department, setDepartment] = useState<PracticeMaterial['department']>('Direct Tax');
  const [version, setVersion] = useState('v1.0 (FY 2026-27)');
  const [confidentiality, setConfidentiality] = useState<PracticeMaterial['confidentiality']>('Firm-Wide (All Staff)');
  const [author, setAuthor] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['SOP', 'Practice Guide']);
  
  // File Upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SOP Builder states
  const [sopGuidelines, setSopGuidelines] = useState('');
  const [sopSteps, setSopSteps] = useState<SopStep[]>([
    { stepNumber: 1, title: 'Initial Document Triage & Verification', detail: 'Inspect client records, verify statutory portal credentials, and cross-check basic PAN/GST details.', mandatory: true },
    { stepNumber: 2, title: 'Data Reconciliation & Discrepancy Matrix', detail: 'Compare books of accounts with statutory 2B/26AS/AIS disclosures and compile reconciliation sheet.', mandatory: true },
    { stepNumber: 3, title: 'Supervisory Review & Partner Sign-off', detail: 'Submit draft workpaper to the Engagement Partner for quality audit review and electronic filing clearance.', mandatory: true }
  ]);

  // Sync to local storage whenever materials update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }
  }, [materials]);

  // Firestore background listener (graceful)
  useEffect(() => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, 'materials'), where('ownerId', '==', auth.currentUser.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const remoteDocs = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              title: d.title || 'Untitled Material',
              category: d.category || 'Standard Operating Procedure (SOP)',
              department: d.department || 'General Practice',
              version: d.version || 'v1.0',
              fileType: d.fileType || 'PDF',
              fileName: d.fileName || `${d.title || 'doc'}.pdf`,
              fileSize: d.fileSize || '1.2 MB',
              fileDataUrl: d.fileDataUrl || '',
              description: d.description || 'Practice document attached to firm knowledge base.',
              tags: d.tags || ['Practice Material'],
              author: d.author || 'Aarav Advisors Team',
              confidentiality: d.confidentiality || 'Firm-Wide (All Staff)',
              effectiveDate: d.effectiveDate || new Date().toISOString().split('T')[0],
              sopSteps: d.sopSteps || [],
              sopGuidelines: d.sopGuidelines || '',
              sourceType: d.sourceType || 'file_upload',
              createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } as PracticeMaterial;
          });

          // Merge without overwriting local detailed items
          setMaterials(prev => {
            const map = new Map(prev.map(m => [m.id, m]));
            remoteDocs.forEach(r => map.set(r.id, r));
            return Array.from(map.values());
          });
        }
      }, (error) => {
        console.warn('Firestore materials sync:', error.message);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore initialization exception:', e);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle Drag & Drop / File Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setFileError(null);
    setUploadedFile(file);

    // Auto-populate title if empty
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Auto-detect category & department from filename
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('gst') || lowerName.includes('drc') || lowerName.includes('gstr')) {
      setDepartment('GST & Indirect Tax');
      setCategory('GST & Tax Litigation Format');
    } else if (lowerName.includes('audit') || lowerName.includes('3cd') || lowerName.includes('44ab')) {
      setDepartment('Direct Tax');
      setCategory('Statutory Audit Checklist');
    } else if (lowerName.includes('mca') || lowerName.includes('roc') || lowerName.includes('aoc') || lowerName.includes('mgt')) {
      setDepartment('Corporate Law & ROC');
      setCategory('MCA / Corporate Law Guide');
    }

    // Read content as Base64 Data URL so download and preview works seamlessly
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result as string);
    };
    reader.onerror = () => {
      setFileError('Could not read the uploaded file.');
    };
    reader.readAsDataURL(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileExtensionType = (filename: string): PracticeMaterial['fileType'] => {
    const ext = filename.split('.').pop()?.toUpperCase() || '';
    if (['XLS', 'XLSX', 'CSV'].includes(ext)) return 'XLSX';
    if (['DOC', 'DOCX'].includes(ext)) return 'DOCX';
    if (['TXT', 'MD', 'JSON'].includes(ext)) return 'TXT';
    return 'PDF';
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddSopStep = () => {
    setSopSteps([
      ...sopSteps,
      {
        stepNumber: sopSteps.length + 1,
        title: `Step ${sopSteps.length + 1}: Required Action`,
        detail: 'Specify explicit statutory verification check, responsible team member, and documentation required.',
        mandatory: true
      }
    ]);
  };

  const handleRemoveSopStep = (index: number) => {
    if (sopSteps.length <= 1) return;
    const updated = sopSteps
      .filter((_, i) => i !== index)
      .map((step, idx) => ({ ...step, stepNumber: idx + 1 }));
    setSopSteps(updated);
  };

  const handleUpdateStep = (index: number, field: keyof SopStep, val: any) => {
    const updated = [...sopSteps];
    updated[index] = { ...updated[index], [field]: val };
    setSopSteps(updated);
  };

  const resetForm = () => {
    setTitle('');
    setCategory('Standard Operating Procedure (SOP)');
    setDepartment('Direct Tax');
    setVersion('v1.0 (FY 2026-27)');
    setConfidentiality('Firm-Wide (All Staff)');
    setAuthor('');
    setDescription('');
    setTags(['SOP', 'Practice Guide']);
    setUploadedFile(null);
    setFileDataUrl('');
    setFileError(null);
    setSopGuidelines('');
    setSopSteps([
      { stepNumber: 1, title: 'Initial Document Triage & Verification', detail: 'Inspect client records, verify statutory portal credentials, and cross-check basic PAN/GST details.', mandatory: true },
      { stepNumber: 2, title: 'Data Reconciliation & Discrepancy Matrix', detail: 'Compare books of accounts with statutory 2B/26AS/AIS disclosures and compile reconciliation sheet.', mandatory: true },
      { stepNumber: 3, title: 'Supervisory Review & Partner Sign-off', detail: 'Submit draft workpaper to the Engagement Partner for quality audit review and electronic filing clearance.', mandatory: true }
    ]);
  };

  // Submit Handler: Saves locally + syncs to Firestore
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a document title');
      return;
    }

    const matId = `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();

    let computedFileName = uploadedFile?.name || `${title.replace(/[^a-zA-Z0-9]/g, '_')}_SOP.pdf`;
    let computedFileType: PracticeMaterial['fileType'] = uploadedFile ? getFileExtensionType(uploadedFile.name) : 'SOP_DOC';
    let computedFileSize = uploadedFile ? formatFileSize(uploadedFile.size) : '450 KB';

    const newMaterial: PracticeMaterial = {
      id: matId,
      title: title.trim(),
      category,
      department,
      version: version.trim() || 'v1.0',
      fileType: computedFileType,
      fileName: computedFileName,
      fileSize: computedFileSize,
      fileDataUrl: fileDataUrl || undefined,
      description: description.trim() || `Authoritative ${category} document for ${department} engagements.`,
      tags: tags.length > 0 ? tags : ['General SOP'],
      author: author.trim() || (auth.currentUser?.displayName || 'Tax & Audit Practice Team'),
      confidentiality,
      effectiveDate: effectiveDate || nowIso.split('T')[0],
      sopSteps: activeTab === 'draft_sop' ? sopSteps : (sopSteps.length > 0 ? sopSteps : undefined),
      sopGuidelines: sopGuidelines.trim() || undefined,
      sourceType: activeTab === 'upload' ? 'file_upload' : 'sop_editor',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // 1. Immediately save to Local Materials state & LocalStorage
    setMaterials(prev => [newMaterial, ...prev]);

    // 2. Attempt Firestore sync if user is logged in
    if (auth.currentUser) {
      try {
        await addDoc(collection(db, 'materials'), {
          title: newMaterial.title.slice(0, 190),
          category: newMaterial.category.slice(0, 48),
          ownerId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
      } catch (err: any) {
        console.warn('Firestore optional sync note (local storage safely preserved):', err.message);
      }
    }

    setIsModalOpen(false);
    resetForm();
    showToast(`"${newMaterial.title}" attached successfully to Practice Knowledge Base!`);
  };

  // 1-Click Import from Statutory Template
  const handleImportTemplate = async (tmpl: typeof STATUTORY_QUICK_TEMPLATES[0]) => {
    const matId = `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newMaterial: PracticeMaterial = {
      id: matId,
      title: tmpl.title,
      category: tmpl.category,
      department: tmpl.department,
      version: tmpl.version,
      fileType: tmpl.fileType,
      fileName: tmpl.fileName,
      fileSize: tmpl.fileSize,
      description: tmpl.description,
      tags: tmpl.tags,
      author: tmpl.author,
      confidentiality: tmpl.confidentiality,
      effectiveDate: tmpl.effectiveDate,
      sopSteps: tmpl.steps,
      sopGuidelines: tmpl.guidelines,
      sourceType: 'statutory_template',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    setMaterials(prev => [newMaterial, ...prev]);

    if (auth.currentUser) {
      try {
        await addDoc(collection(db, 'materials'), {
          title: newMaterial.title.slice(0, 190),
          category: newMaterial.category.slice(0, 48),
          ownerId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
      } catch (err: any) {
        console.warn('Firestore note:', err.message);
      }
    }

    setIsModalOpen(false);
    showToast(`Template "${tmpl.title}" imported into Knowledge Base!`);
  };

  const handleDeleteMaterial = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this practice material from the Knowledge Base?')) {
      setMaterials(prev => prev.filter(m => m.id !== id));
      if (selectedMaterial?.id === id) setSelectedMaterial(null);
      showToast('Material removed from Knowledge Base');
    }
  };

  const handleCopySopText = (mat: PracticeMaterial, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let text = `${mat.title.toUpperCase()}\n`;
    text += `Department: ${mat.department} | Category: ${mat.category} | Version: ${mat.version}\n`;
    text += `Effective Date: ${mat.effectiveDate} | Author: ${mat.author}\n\n`;
    text += `SCOPE & PURPOSE:\n${mat.description}\n\n`;
    if (mat.sopGuidelines) {
      text += `REGULATORY GUIDELINES:\n${mat.sopGuidelines}\n\n`;
    }
    if (mat.sopSteps && mat.sopSteps.length > 0) {
      text += `STANDARD OPERATING PROCEDURES (STEP-BY-STEP):\n`;
      mat.sopSteps.forEach(s => {
        text += `[Step ${s.stepNumber}] ${s.title}${s.mandatory ? ' (MANDATORY)' : ''}\n${s.detail}\n\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopiedId(mat.id);
    setTimeout(() => setCopiedId(null), 2500);
    showToast('SOP instructions copied to clipboard');
  };

  // Download Trigger
  const handleDownloadMaterial = (mat: PracticeMaterial, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (mat.fileDataUrl) {
      const a = document.createElement('a');
      a.href = mat.fileDataUrl;
      a.download = mat.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Generate formatted text file download
      let content = `=========================================================\n`;
      content += `AARAV ADVISORS LLP - PRACTICE KNOWLEDGE BASE\n`;
      content += `DOCUMENT: ${mat.title}\n`;
      content += `CATEGORY: ${mat.category} | DEPT: ${mat.department}\n`;
      content += `VERSION: ${mat.version} | EFFECTIVE: ${mat.effectiveDate}\n`;
      content += `AUTHOR: ${mat.author} | ACCESS: ${mat.confidentiality}\n`;
      content += `=========================================================\n\n`;
      content += `DESCRIPTION & PURPOSE:\n${mat.description}\n\n`;
      if (mat.sopGuidelines) {
        content += `STATUTORY GUIDELINES:\n${mat.sopGuidelines}\n\n`;
      }
      if (mat.sopSteps && mat.sopSteps.length > 0) {
        content += `CHECKLIST / PROCEDURE STEPS:\n`;
        mat.sopSteps.forEach(s => {
          content += `\n[STEP ${s.stepNumber}] ${s.title} ${s.mandatory ? '[MANDATORY]' : ''}\n`;
          content += `${s.detail}\n`;
        });
      }
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mat.fileName.endsWith('.txt') ? mat.fileName : `${mat.fileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    showToast(`Downloaded "${mat.fileName}"`);
  };

  // Filtering
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      !searchQuery.trim() ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategoryFilter === 'ALL' || m.category === selectedCategoryFilter;
    const matchesDept = selectedDepartmentFilter === 'ALL' || m.department === selectedDepartmentFilter;

    return matchesSearch && matchesCategory && matchesDept;
  });

  const categoriesList = [
    'ALL',
    'Standard Operating Procedure (SOP)',
    'Statutory Audit Checklist',
    'GST & Tax Litigation Format',
    'Income Tax Precedent',
    'MCA / Corporate Law Guide',
    'Firm Policy & HR Manual'
  ];

  const departmentsList = [
    'ALL',
    'Direct Tax',
    'GST & Indirect Tax',
    'Statutory Audit',
    'Corporate Law & ROC',
    'Forensic & Valuation',
    'General Practice'
  ];

  const getFileBadge = (type: PracticeMaterial['fileType']) => {
    switch (type) {
      case 'PDF':
        return <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><FileText className="w-3 h-3 text-red-600" /> PDF</span>;
      case 'XLSX':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><FileSpreadsheet className="w-3 h-3 text-emerald-600" /> EXCEL</span>;
      case 'DOCX':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><FileCheck className="w-3 h-3 text-blue-600" /> WORD</span>;
      case 'SOP_DOC':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><Layers className="w-3 h-3 text-purple-600" /> SOP WORKPAPER</span>;
      default:
        return <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><FileType className="w-3 h-3" /> DOC</span>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F9FAFB]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-8 z-[150] bg-zinc-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-zinc-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-4 sm:p-6 md:p-8 border-b border-zinc-200 bg-white shrink-0 shadow-xs">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2.5">
                  Practice Knowledge Base & SOPs
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Institutional repository for standard operating procedures, statutory audit workpapers, GST/IT litigation formats, and quality checklists.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }} 
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm cursor-pointer hover:shadow-md"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document/SOP</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Ribbon */}
        <div className="max-w-[1600px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-zinc-100">
          <div className="bg-zinc-50 border border-zinc-200/70 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Total Practice Files</div>
            <div className="text-xl font-extrabold text-zinc-900 mt-0.5">{materials.length} Documents</div>
          </div>
          <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">Standard Operating Procedures</div>
            <div className="text-xl font-extrabold text-indigo-950 mt-0.5">
              {materials.filter(m => m.category === 'Standard Operating Procedure (SOP)').length} SOPs
            </div>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Statutory Audit Checklists</div>
            <div className="text-xl font-extrabold text-emerald-950 mt-0.5">
              {materials.filter(m => m.category === 'Statutory Audit Checklist').length} Checklists
            </div>
          </div>
          <div className="bg-purple-50/50 border border-purple-100 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">Tax & MCA Defense Precedents</div>
            <div className="text-xl font-extrabold text-purple-950 mt-0.5">
              {materials.filter(m => m.category.includes('Litigation') || m.category.includes('Precedent') || m.category.includes('Corporate')).length} Formats
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full space-y-6">
        {/* Search and Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SOPs, sections, authors, tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-zinc-50/50"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categoriesList.map(c => (
                  <option key={c} value={c}>{c === 'ALL' ? 'All Document Categories' : c}</option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="shrink-0">
              <select
                value={selectedDepartmentFilter}
                onChange={e => setSelectedDepartmentFilter(e.target.value)}
                className="text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {departmentsList.map(d => (
                  <option key={d} value={d}>{d === 'ALL' ? 'All Practice Depts' : d}</option>
                ))}
              </select>
            </div>

            {(selectedCategoryFilter !== 'ALL' || selectedDepartmentFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategoryFilter('ALL');
                  setSelectedDepartmentFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 shrink-0"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center shadow-xs">
            <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-800">No practice materials match your search</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              Try modifying your search terms or filters, or click "Upload Document/SOP" to add a new standard operating procedure.
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-indigo-700"
            >
              <UploadCloud className="w-4 h-4" />
              Attach First Material
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMaterials.map(mat => (
              <div 
                key={mat.id}
                onClick={() => setSelectedMaterial(mat)}
                className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all p-5 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Top Metadata Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getFileBadge(mat.fileType)}
                      <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">
                        {mat.department}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200">
                      {mat.version}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                    {mat.title}
                  </h3>

                  {/* Category */}
                  <div className="text-[11px] font-semibold text-indigo-700 mt-1">
                    {mat.category}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-500 mt-2 line-clamp-3 leading-relaxed">
                    {mat.description}
                  </p>

                  {/* Checklist steps badge preview if SOP */}
                  {mat.sopSteps && mat.sopSteps.length > 0 && (
                    <div className="mt-3 bg-indigo-50/60 border border-indigo-100 rounded-lg p-2 text-[11px] text-indigo-900 flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                        {mat.sopSteps.length} Standard Operating Steps
                      </span>
                      <span className="text-[10px] text-indigo-600 font-mono">
                        {mat.sopSteps.filter(s => s.mandatory).length} Mandatory
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  {mat.tags && mat.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-3">
                      {mat.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[9px] font-medium bg-zinc-50 text-zinc-600 border border-zinc-200 px-1.5 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                      {mat.tags.length > 3 && (
                        <span className="text-[9px] text-zinc-400">+{mat.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Controls & Info */}
                <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-zinc-400">
                    <div>{mat.fileName}</div>
                    <div className="text-[10px] text-zinc-400">{mat.fileSize} • {mat.author.split(' ')[0]}</div>
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleCopySopText(mat, e)}
                      title="Copy SOP text"
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      {copiedId === mat.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={(e) => handleDownloadMaterial(mat, e)}
                      title="Download attached file"
                      className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleDeleteMaterial(mat.id, e)}
                      title="Delete material"
                      className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setSelectedMaterial(mat)}
                      className="ml-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-0.5"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POPUP MODAL: Upload document / Upload SOP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-3xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                    Upload document to Practice Knowledge Base
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Upload regulatory circulars, audit workpapers, or draft institutional CA SOPs.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center border-b border-zinc-200 px-6 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Physical File</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('draft_sop')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'draft_sop'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Draft SOP & Checklist</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'templates'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Statutory Practice Templates</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* TAB 3: Instant Templates */}
              {activeTab === 'templates' ? (
                <div className="space-y-4">
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Instant Practice Library:</span> Select any pre-configured Indian statutory standard operating procedure or checklist below to add it directly to your firm's repository.
                    </div>
                  </div>

                  <div className="space-y-3">
                    {STATUTORY_QUICK_TEMPLATES.map((tmpl, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-zinc-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/20 transition-all flex items-start justify-between gap-4 bg-white shadow-2xs"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">
                              {tmpl.department}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">{tmpl.version}</span>
                          </div>

                          <h4 className="text-sm font-bold text-zinc-900">{tmpl.title}</h4>
                          <p className="text-xs text-zinc-500">{tmpl.description}</p>

                          <div className="flex items-center gap-1.5 pt-1">
                            {tmpl.tags.map(t => (
                              <span key={t} className="text-[9px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleImportTemplate(tmpl)}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Import SOP</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* TAB 1 & 2 FORM */
                <form onSubmit={handleSaveMaterial} className="space-y-5">
                  {/* File Upload Zone (For Tab 1) */}
                  {activeTab === 'upload' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-zinc-700">Attach Document / Workpaper File</label>
                      
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            processFile(e.dataTransfer.files[0]);
                          }
                        }}
                        className="border-2 border-dashed border-zinc-300 hover:border-indigo-500 bg-zinc-50/70 hover:bg-indigo-50/20 rounded-2xl p-6 text-center transition-all cursor-pointer group"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.json,.png,.jpg"
                          className="hidden"
                        />

                        {uploadedFile ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <FileCheck className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-bold text-zinc-900">{uploadedFile.name}</div>
                              <div className="text-xs text-zinc-500">
                                {formatFileSize(uploadedFile.size)} • Click or drop another to replace
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-indigo-600 mx-auto transition-colors" />
                            <div className="text-xs font-bold text-zinc-700">
                              Click to browse or drag and drop file here
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              Supports PDF, Excel (.xlsx/.xls), Word (.docx/.doc), Text, Markdown (up to 25MB)
                            </div>
                          </div>
                        )}
                      </div>

                      {fileError && (
                        <div className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{fileError}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Core Classification Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Document Title */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Document / SOP Title <span className="text-red-500">*</span>
                      </label>
                      <input 
                        required 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        className="w-full px-3.5 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                        placeholder="e.g. GST Input Tax Credit Reversal Rule 42 & 43 SOP" 
                      />
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Document Category</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value as any)}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs bg-white text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Standard Operating Procedure (SOP)">Standard Operating Procedure (SOP)</option>
                        <option value="Statutory Audit Checklist">Statutory Audit Checklist</option>
                        <option value="GST & Tax Litigation Format">GST & Tax Litigation Format</option>
                        <option value="Income Tax Precedent">Income Tax Precedent</option>
                        <option value="MCA / Corporate Law Guide">MCA / Corporate Law Guide</option>
                        <option value="Advisory Note & Memorandum">Advisory Note & Memorandum</option>
                        <option value="Firm Policy & HR Manual">Firm Policy & HR Manual</option>
                      </select>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Practice Department</label>
                      <select
                        value={department}
                        onChange={e => setDepartment(e.target.value as any)}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs bg-white text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Direct Tax">Direct Tax & Litigation</option>
                        <option value="GST & Indirect Tax">GST & Indirect Tax</option>
                        <option value="Statutory Audit">Statutory Audit & Assurance</option>
                        <option value="Corporate Law & ROC">Corporate Law & Secretarial (ROC)</option>
                        <option value="Forensic & Valuation">Forensic & Valuation</option>
                        <option value="General Practice">General Practice & Management</option>
                      </select>
                    </div>

                    {/* Version */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Version / Applicable Period</label>
                      <input 
                        type="text" 
                        value={version} 
                        onChange={e => setVersion(e.target.value)} 
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                        placeholder="v1.0 (AY 2026-27)" 
                      />
                    </div>

                    {/* Confidentiality / Access Level */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Confidentiality & Access Level</label>
                      <select
                        value={confidentiality}
                        onChange={e => setConfidentiality(e.target.value as any)}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs bg-white text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="Firm-Wide (All Staff)">Firm-Wide (All Staff & Articles)</option>
                        <option value="Qualified CAs & Managers">Qualified CAs & Managers</option>
                        <option value="Partners Only">Partners Only (Confidential)</option>
                      </select>
                    </div>

                    {/* Author */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Author / Reviewing Partner</label>
                      <input 
                        type="text" 
                        value={author} 
                        onChange={e => setAuthor(e.target.value)} 
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                        placeholder="e.g. CA Ananya Deshmukh (Audit Lead)" 
                      />
                    </div>

                    {/* Effective Date */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Effective Date</label>
                      <input 
                        type="date" 
                        value={effectiveDate} 
                        onChange={e => setEffectiveDate(e.target.value)} 
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                      />
                    </div>
                  </div>

                  {/* Summary / Scope */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Summary / Objective</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Brief overview of the material, applicability scope, and regulatory compliance objectives..."
                    />
                  </div>

                  {/* Step-by-Step SOP Builder (Active when Tab 2 or user wants structured steps) */}
                  {activeTab === 'draft_sop' && (
                    <div className="space-y-3 pt-2 border-t border-zinc-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                            Standard Operating Steps & Checklist
                          </h4>
                          <p className="text-[11px] text-zinc-500">
                            Configure mandatory sequential execution steps for team members.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddSopStep}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Step</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {sopSteps.map((step, idx) => (
                          <div key={idx} className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-indigo-600">
                                Step {step.stepNumber}
                              </span>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1 text-[11px] text-zinc-600 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={step.mandatory}
                                    onChange={e => handleUpdateStep(idx, 'mandatory', e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span>Mandatory</span>
                                </label>
                                {sopSteps.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSopStep(idx)}
                                    className="text-zinc-400 hover:text-red-600 p-1"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <input
                              type="text"
                              value={step.title}
                              onChange={e => handleUpdateStep(idx, 'title', e.target.value)}
                              placeholder="Step title (e.g. Verify DIN on portal)"
                              className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />

                            <textarea
                              rows={2}
                              value={step.detail}
                              onChange={e => handleUpdateStep(idx, 'detail', e.target.value)}
                              placeholder="Detailed instruction on how to execute this step..."
                              className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Regulatory Guidelines */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          Key Statutory Circulars / Precedent References (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={sopGuidelines}
                          onChange={e => setSopGuidelines(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          placeholder="e.g. CBIC Circular 170/02/2022-GST; Supreme Court decision in Mohit Minerals; Section 43B(h) amendments..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Tags & Keywords</label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Add tag and press Enter (e.g. Section 148, DRC-01, 44AB)"
                        className="flex-1 px-3 py-1.5 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full text-xs font-semibold"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {tags.map(t => (
                        <span key={t} className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1">
                          #{t}
                          <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-indigo-900">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>

                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Attach to Knowledge Base</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: Read SOP / Inspect Document */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 bg-zinc-50/80 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {getFileBadge(selectedMaterial.fileType)}
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-200/80 text-zinc-800 px-2 py-0.5 rounded">
                    {selectedMaterial.department}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 bg-white border border-zinc-200 px-2 py-0.5 rounded">
                    {selectedMaterial.version}
                  </span>
                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                    {selectedMaterial.confidentiality}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-zinc-900 mt-1">
                  {selectedMaterial.title}
                </h2>
                <p className="text-xs text-zinc-500">
                  {selectedMaterial.category} • Author: <span className="font-semibold text-zinc-700">{selectedMaterial.author}</span> • Effective: {selectedMaterial.effectiveDate}
                </p>
              </div>

              <button
                onClick={() => setSelectedMaterial(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description Box */}
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4">
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Purpose & Applicability Scope
                </h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {selectedMaterial.description}
                </p>
              </div>

              {/* Guidelines / Circular References if any */}
              {selectedMaterial.sopGuidelines && (
                <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-4 text-xs text-amber-950">
                  <h4 className="font-bold text-amber-900 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-700" />
                    Statutory Directives & Jurisdictional Notes
                  </h4>
                  <p className="leading-relaxed">{selectedMaterial.sopGuidelines}</p>
                </div>
              )}

              {/* Sequential SOP Steps & Checklists */}
              {selectedMaterial.sopSteps && selectedMaterial.sopSteps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Standard Operating Steps & Execution Checklist
                    </h4>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {selectedMaterial.sopSteps.length} Steps
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedMaterial.sopSteps.map((step) => (
                      <div 
                        key={step.stepNumber}
                        className="p-3.5 border border-zinc-200 rounded-xl bg-white shadow-2xs space-y-1 hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold flex items-center justify-center">
                              {step.stepNumber}
                            </span>
                            {step.title}
                          </span>
                          {step.mandatory && (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded">
                              Mandatory
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 pl-7 leading-relaxed">
                          {step.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedMaterial.tags && selectedMaterial.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-700 mb-2">Subject Matter Tags</h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedMaterial.tags.map(t => (
                      <span key={t} className="text-xs bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-lg border border-zinc-200 font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/70 flex items-center justify-between">
              <div className="text-xs text-zinc-500">
                <span>File: <strong className="text-zinc-800">{selectedMaterial.fileName}</strong> ({selectedMaterial.fileSize})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopySopText(selectedMaterial)}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  {copiedId === selectedMaterial.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy SOP</span>
                </button>

                <button
                  onClick={() => handleDownloadMaterial(selectedMaterial)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File / Workpaper</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
