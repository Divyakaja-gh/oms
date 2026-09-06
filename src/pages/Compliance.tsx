import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  RotateCw, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  CheckSquare, 
  ArrowRight, 
  Layers, 
  Workflow, 
  Calculator, 
  X, 
  Check, 
  FileText, 
  Clock, 
  Filter, 
  Building2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { StatutoryTemplatesSection } from '../components/compliance/StatutoryTemplatesSection';
import { ComplianceCalendarTab } from '../components/compliance/ComplianceCalendarTab';
import { Gstr3bWorkflowTab } from '../components/compliance/Gstr3bWorkflowTab';
import { IncomeTaxComputationTab } from '../components/compliance/IncomeTaxComputationTab';
import { TdsManagementTab } from '../components/compliance/TdsManagementTab';
import { ComplianceHealthDashboardTab } from '../components/compliance/ComplianceHealthDashboardTab';

import { ComplianceFiling } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

interface ComplianceTypeInfo {
  code: string;
  name: string;
  category: 'GST' | 'ITR' | 'TDS' | 'ROC' | 'Advance Tax';
  frequency: string;
  dueRule: string;
  description: string;
  steps: string[];
}

const COMPLIANCE_TYPES: ComplianceTypeInfo[] = [
  {
    code: 'ADV_TAX',
    name: 'Advance Tax Instalment',
    category: 'Advance Tax',
    frequency: 'Quarterly',
    dueRule: 'due 15th Jun/Sep/Dec/Mar',
    description: 'Mandatory advance tax payment for corporate & non-corporate assessees with tax liability > ₹10,000.',
    steps: [
      'Collate estimated full-year P&L and turnover projections',
      'Compute net taxable profit and advance tax instalment liability',
      'Verify TDS / TCS tax credits reflected in 26AS & AIS/TIS',
      'Generate ITNS 280 payment challan (Major Head 0021 / Minor Head 100)',
      'Process net challan payment & archive BSR Code / Challan Number'
    ]
  },
  {
    code: 'GSTR1',
    name: 'GSTR-1 (Monthly)',
    category: 'GST',
    frequency: 'Monthly',
    dueRule: 'due 11th of following month',
    description: 'Outward supplies statement reporting all B2B invoices, B2C sales, credit notes, and HSN summary.',
    steps: [
      'Export and reconcile sales register with billing software / ERP',
      'Validate active recipient GSTIN numbers and POS (Place of Supply)',
      'Review Table 4 B2B, Table 7 B2C, Table 9 Amendments, and Table 12 HSN',
      'Generate JSON payload using GSTN offline tool or direct API',
      'Upload payload to GST Portal and inspect validation error reports',
      'File return using Class-3 DSC or Authorized Signatory EVC OTP'
    ]
  },
  {
    code: 'GSTR3B',
    name: 'GSTR-3B Monthly return & payment',
    category: 'GST',
    frequency: 'Monthly',
    dueRule: 'due 20th of following month',
    description: 'Self-assessed summary return for tax payment, ITC claims, and reverse charge liability.',
    steps: [
      'Import auto-drafted GSTR-2B and match with purchase books',
      'Apply Rule 37A non-payment & Rule 42/43 exempt reversal rules',
      'Calculate Table 3.1 outward tax liability and RCM liability',
      'Offset liabilities using Electronic Credit Ledger balance',
      'Generate PMT-06 challan for net cash payable shortfall',
      'Submit and file with DSC/EVC, generating Acknowledgement Reference ARN'
    ]
  },
  {
    code: 'GSTR9',
    name: 'GSTR-9 / 9C Annual',
    category: 'GST',
    frequency: 'Annual',
    dueRule: 'due 31st December',
    description: 'Annual GST return and reconciliation statement with audited balance sheet figures.',
    steps: [
      'Compile aggregate annual turnover and reconcile GSTR-1 vs GSTR-3B',
      'Extract Table 8 ITC reconciliation against GSTR-2A / 2B portal data',
      'Identify un-reconciled outward differences and compute DRC-03 tax liability',
      'Prepare CA Reconciliation Statement Form GSTR-9C (if turnover > ₹5 Cr)',
      'Upload audited reconciliation, verify UDIN, and file return with DSC'
    ]
  },
  {
    code: 'ITR_AUDIT',
    name: 'ITR Company/Audit Cases',
    category: 'ITR',
    frequency: 'Annual',
    dueRule: 'due 31st October',
    description: 'Corporate income tax return and non-corporate entities subject to statutory tax audit u/s 44AB.',
    steps: [
      'Finalize Balance Sheet & P&L and obtain signed Auditor’s Report',
      'Prepare Form 3CA/3CB and Form 3CD Tax Audit disclosures',
      'Upload Form 3CD with valid ICAI UDIN and secure client portal approval',
      'Compute MAT u/s 115JB / corporate tax liability under Sec 115BAA/BAB',
      'Generate ITNS 280 Self-Assessment Challan (Code 300) and verify payment',
      'File ITR-6 / ITR-5 XML/JSON return signed via Director/Partner DSC'
    ]
  },
  {
    code: 'ITR_NON_AUDIT',
    name: 'ITR Individual/HUF (non-audit)',
    category: 'ITR',
    frequency: 'Annual',
    dueRule: 'due 31st July',
    description: 'Annual income tax return for salaried individuals, HUF, and businesses not subject to audit.',
    steps: [
      'Consolidate Form 16, AIS, TIS, 26AS, capital gains, and interest statements',
      'Evaluate optimal tax regime (Sec 115BAC default vs Old Regime)',
      'Compute gross total income, Chapter VI-A deductions, and rebate u/s 87A',
      'Verify advance tax/TDS prepaid credits and calculate refund or tax due',
      'Submit ITR-1/2/3/4 on Income Tax e-Filing portal and e-Verify with Aadhaar OTP'
    ]
  },
  {
    code: 'ROC_AOC4',
    name: 'Financial Statements AOC-4',
    category: 'ROC',
    frequency: 'Annual',
    dueRule: 'due 30 days from AGM',
    description: 'MCA annual filing of standalone/consolidated balance sheet, P&L, notes, and director report.',
    steps: [
      'Obtain signed Director’s Report, Auditor’s Report, Notice of AGM, and Accounts',
      'Prepare MCA V3 e-Form AOC-4 (or AOC-4 XBRL if listed/turnover criteria met)',
      'Attach audited financials, CSR reports, and secretarial notes',
      'Affix Director DSC and Practicing Chartered Accountant certification DSC',
      'Submit on MCA portal, pay statutory fees, and generate Service Request Number (SRN)'
    ]
  },
  {
    code: 'ROC_MGT7',
    name: 'ROC Annual Return MGT-7',
    category: 'ROC',
    frequency: 'Annual',
    dueRule: 'due 60 days from AGM',
    description: 'Annual return containing corporate shareholding, director appointments, and meeting minutes.',
    steps: [
      'Update shareholder registers, debentures, share transfers, and board meetings',
      'Prepare e-Form MGT-7 (or MGT-7A for Small Companies & OPCs)',
      'Obtain Form MGT-8 certification from Practicing CS if turnover > ₹50 Cr',
      'Affix DSC of Director and professional certifier',
      'Upload on MCA V3 Portal and track approval status against generated SRN'
    ]
  },
  {
    code: 'TDS_26Q',
    name: 'TDS Return 26Q/24Q',
    category: 'TDS',
    frequency: 'Quarterly',
    dueRule: 'due 31st of following month',
    description: 'Quarterly withholding tax statement for non-salary domestic payments (Sec 194C, 194J, 194I, etc.).',
    steps: [
      'Collate monthly TDS deductions and ITNS 281 payment challan details',
      'Verify deductee PANs on TRACES portal and check for inoperative status',
      'Download Challan Status File (.csi) from e-filing / TRACES',
      'Validate raw data using NSDL Return Preparation Utility (RPU)',
      'Generate verified .fvu file through File Validation Utility',
      'Upload .fvu on TRACES portal or submit at nearest TIN-FC center'
    ]
  }
];

const INITIAL_FILINGS: ComplianceFiling[] = [
  {
    id: 'f-1',
    complianceCode: 'GSTR9',
    complianceTitle: 'GSTR-9 / 9C Annual',
    clientName: 'New Client',
    period: '2026-27',
    dueDate: '2026-09-01',
    status: 'Pending',
    health: 'Red',
    totalSteps: 5,
    completedSteps: 0,
    steps: [
      { id: 's1', title: 'Compile aggregate annual turnover and reconcile GSTR-1 vs GSTR-3B', completed: false },
      { id: 's2', title: 'Extract Table 8 ITC reconciliation against GSTR-2A / 2B portal data', completed: false },
      { id: 's3', title: 'Identify un-reconciled outward differences and compute DRC-03 tax liability', completed: false },
      { id: 's4', title: 'Prepare CA Reconciliation Statement Form GSTR-9C (if turnover > ₹5 Cr)', completed: false },
      { id: 's5', title: 'Upload audited reconciliation, verify UDIN, and file return with DSC', completed: false },
    ]
  },
  {
    id: 'f-2',
    complianceCode: 'GSTR1',
    complianceTitle: 'GSTR-1 (Monthly)',
    clientName: 'New Client',
    period: '2026-27',
    dueDate: '2026-09-01',
    status: 'Filed',
    filedDate: '2026-09-01',
    health: 'Red',
    totalSteps: 6,
    completedSteps: 0,
    steps: [
      { id: 's1', title: 'Export and reconcile sales register with billing software / ERP', completed: true },
      { id: 's2', title: 'Validate active recipient GSTIN numbers and POS (Place of Supply)', completed: true },
      { id: 's3', title: 'Review Table 4 B2B, Table 7 B2C, Table 9 Amendments, and Table 12 HSN', completed: true },
      { id: 's4', title: 'Generate JSON payload using GSTN offline tool or direct API', completed: true },
      { id: 's5', title: 'Upload payload to GST Portal and inspect validation error reports', completed: true },
      { id: 's6', title: 'File return using Class-3 DSC or Authorized Signatory EVC OTP', completed: true },
    ]
  },
  {
    id: 'f-3',
    complianceCode: 'ROC_MGT7',
    complianceTitle: 'ROC Annual Return MGT-7',
    clientName: 'Acme Tech Pvt Ltd',
    period: '2026-27',
    dueDate: '2026-09-01',
    status: 'Pending',
    health: 'Red',
    totalSteps: 5,
    completedSteps: 0,
    steps: [
      { id: 's1', title: 'Update shareholder registers, debentures, share transfers, and board meetings', completed: false },
      { id: 's2', title: 'Prepare e-Form MGT-7 (or MGT-7A for Small Companies & OPCs)', completed: false },
      { id: 's3', title: 'Obtain Form MGT-8 certification from Practicing CS if turnover > ₹50 Cr', completed: false },
      { id: 's4', title: 'Affix DSC of Director and professional certifier', completed: false },
      { id: 's5', title: 'Upload on MCA V3 Portal and track approval status against generated SRN', completed: false },
    ]
  }
];

export function Compliance() {
  const [activeView, setActiveView] = useState<'overview' | 'templates' | 'calendar' | 'gstr3b' | 'incometax' | 'tds' | 'health'>('overview');
  const [filterCategory, setFilterCategory] = useState<string>('All filings');
  const [filings, setFilings] = useState<ComplianceFiling[]>(() => {
    const saved = localStorage.getItem('caoms_compliance_filings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_FILINGS; }
    }
    return INITIAL_FILINGS;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNewFilingModalOpen, setIsNewFilingModalOpen] = useState(false);
  const [activeChecklistFiling, setActiveChecklistFiling] = useState<ComplianceFiling | null>(null);
  const [activeTypeChecklist, setActiveTypeChecklist] = useState<ComplianceTypeInfo | null>(null);
  const [clientOptions, setClientOptions] = useState<string[]>(['New Client', 'Acme Tech Pvt Ltd', 'Aarav Capital', 'Apex Logistics']);

  // New filing form state
  const [selectedComplianceCode, setSelectedComplianceCode] = useState('GSTR1');
  const [selectedClientName, setSelectedClientName] = useState('New Client');
  const [filingPeriod, setFilingPeriod] = useState('2026-27');
  const [filingDueDate, setFilingDueDate] = useState('2026-09-15');

  // Load clients from Firestore if available
  useEffect(() => {
    if (auth.currentUser) {
      const q = query(collection(db, 'clients'), where('ownerId', '==', auth.currentUser.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loaded = snapshot.docs.map(doc => doc.data().name).filter(Boolean);
        if (loaded.length > 0) {
          setClientOptions(prev => Array.from(new Set([...prev, ...loaded])));
        }
      }, () => {});
      return () => unsubscribe();
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('caoms_compliance_filings', JSON.stringify(filings));
  }, [filings]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Metrics computation
  const totalFilings = filings.length;
  const onTrackCount = filings.filter(f => f.status === 'Filed' || f.health === 'Green').length;
  const dueWithin7DaysCount = filings.filter(f => f.health === 'Amber' && f.status !== 'Filed').length;
  const overdueCount = filings.filter(f => f.status === 'Pending' || f.health === 'Red').length;

  // Filtered filings
  const filteredFilings = filings.filter(f => {
    if (filterCategory === 'All filings') return true;
    if (filterCategory === 'Pending') return f.status === 'Pending';
    if (filterCategory === 'Filed') return f.status === 'Filed';
    if (filterCategory === 'Overdue') return f.health === 'Red' && f.status !== 'Filed';
    
    // Category match
    const typeInfo = COMPLIANCE_TYPES.find(t => t.code === f.complianceCode);
    if (typeInfo && typeInfo.category.toLowerCase().includes(filterCategory.toLowerCase())) return true;
    if (f.complianceCode.toLowerCase().includes(filterCategory.toLowerCase())) return true;
    return false;
  });

  // Mark as filed handler
  const handleMarkFiled = (filingId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setFilings(prev => prev.map(f => {
      if (f.id === filingId) {
        return {
          ...f,
          status: 'Filed',
          filedDate: today,
          health: 'Green',
          completedSteps: f.totalSteps,
          steps: f.steps?.map(s => ({ ...s, completed: true }))
        };
      }
      return f;
    }));
  };

  // Toggle checklist step
  const handleToggleStep = (filingId: string, stepIndex: number) => {
    setFilings(prev => prev.map(f => {
      if (f.id === filingId && f.steps) {
        const updatedSteps = [...f.steps];
        updatedSteps[stepIndex] = {
          ...updatedSteps[stepIndex],
          completed: !updatedSteps[stepIndex].completed
        };
        const completedCount = updatedSteps.filter(s => s.completed).length;
        const allDone = completedCount === f.totalSteps;
        return {
          ...f,
          steps: updatedSteps,
          completedSteps: completedCount,
          status: allDone ? 'Filed' : (completedCount > 0 ? 'In Progress' : 'Pending'),
          filedDate: allDone ? new Date().toISOString().split('T')[0] : f.filedDate,
          health: allDone ? 'Green' : f.health
        };
      }
      return f;
    }));

    if (activeChecklistFiling && activeChecklistFiling.id === filingId && activeChecklistFiling.steps) {
      const updatedSteps = [...activeChecklistFiling.steps];
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        completed: !updatedSteps[stepIndex].completed
      };
      const completedCount = updatedSteps.filter(s => s.completed).length;
      setActiveChecklistFiling({
        ...activeChecklistFiling,
        steps: updatedSteps,
        completedSteps: completedCount,
        status: completedCount === activeChecklistFiling.totalSteps ? 'Filed' : (completedCount > 0 ? 'In Progress' : 'Pending')
      });
    }
  };

  // Create new filing
  const handleCreateFiling = (e: React.FormEvent) => {
    e.preventDefault();
    const typeObj = COMPLIANCE_TYPES.find(t => t.code === selectedComplianceCode) || COMPLIANCE_TYPES[0];
    const newSteps = typeObj.steps.map((st, idx) => ({
      id: `s-${Date.now()}-${idx}`,
      title: st,
      completed: false
    }));

    const newFiling: ComplianceFiling = {
      id: `f-${Date.now()}`,
      complianceCode: typeObj.code,
      complianceTitle: typeObj.name,
      clientName: selectedClientName,
      period: filingPeriod,
      dueDate: filingDueDate,
      status: 'Pending',
      health: 'Red',
      totalSteps: newSteps.length,
      completedSteps: 0,
      steps: newSteps
    };

    setFilings(prev => [newFiling, ...prev]);
    setIsNewFilingModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA] overflow-y-auto">
      {/* Top View Selector Bar */}
      <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-3 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100/80 rounded-xl border border-zinc-200/80 shrink-0">
            <button
              onClick={() => setActiveView('overview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeView === 'overview'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Compliance Overview</span>
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeView === 'calendar'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
              <span>Calendar & Milestones</span>
            </button>
            <button
              onClick={() => setActiveView('gstr3b')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeView === 'gstr3b'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Workflow className="w-3.5 h-3.5 text-indigo-600" />
              <span>GSTR-3B Workflow</span>
            </button>
            <button
              onClick={() => setActiveView('incometax')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeView === 'incometax'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-600" />
              <span>Income Tax Computation</span>
            </button>
            <button
              onClick={() => setActiveView('tds')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeView === 'tds'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>TDS Management</span>
            </button>
            <button
              onClick={() => setActiveView('health')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeView === 'health'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Health Dashboard</span>
            </button>
            <button
              onClick={() => setActiveView('templates')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeView === 'templates'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Statutory Templates</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-zinc-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>AY 2026-27 Active</span>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {activeView === 'overview' ? (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
          
          {/* Header Bar matching IMG_8966.jpeg */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Compliance</h1>
              <p className="text-xs text-zinc-500 mt-0.5 font-medium">GST • ITR • TDS • ROC • Advance Tax</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Category Filter Dropdown */}
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-white border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg px-3 py-2 pr-8 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
                >
                  <option value="All filings">All filings</option>
                  <option value="GST">GST</option>
                  <option value="ITR">ITR</option>
                  <option value="TDS">TDS</option>
                  <option value="ROC">ROC</option>
                  <option value="Advance Tax">Advance Tax</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Filed">Filed</option>
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
                  <Filter className="w-3 h-3" />
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                title="Refresh compliance filings"
                className="p-2 bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 rounded-full shadow-sm hover:bg-zinc-50 transition-all"
              >
                <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              {/* + New Filing Button */}
              <button
                onClick={() => setIsNewFilingModalOpen(true)}
                className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Filing</span>
              </button>
            </div>
          </div>

          {/* 4 Health & Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total filings Card */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total filings</span>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-zinc-900">{totalFilings}</span>
              </div>
            </div>

            {/* On track Card */}
            <div className="bg-white border border-emerald-300/80 rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-zinc-700">On track</span>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-zinc-900">{onTrackCount}</span>
              </div>
            </div>

            {/* Due within 7 days Card */}
            <div className="bg-white border border-amber-300/80 rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-zinc-700">Due within 7 days</span>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-zinc-900">{dueWithin7DaysCount}</span>
              </div>
            </div>

            {/* Overdue Card */}
            <div className="bg-white border border-rose-300/80 rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-zinc-700">Overdue</span>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-zinc-900">{overdueCount}</span>
              </div>
            </div>

          </div>

          {/* Upcoming Deadlines Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-zinc-600" />
                <h2 className="text-sm font-bold text-zinc-900">Upcoming Deadlines</h2>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 font-medium">Next filings requiring attention (Amber + Red)</p>
            </div>

            <div className="space-y-2.5">
              {filings.filter(f => f.status !== 'Filed').length === 0 ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  All compliance filings are currently up to date!
                </div>
              ) : (
                filings.filter(f => f.status !== 'Filed').map(filing => (
                  <div 
                    key={filing.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-zinc-50/60 border border-zinc-200/80 rounded-lg gap-3 hover:bg-zinc-50 transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-zinc-900">
                        {filing.complianceCode} · {filing.period}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        Client: <span className="font-semibold text-zinc-700">{filing.clientName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-700 font-bold text-[11px] rounded-md border border-rose-200/60">
                        1d overdue
                      </span>
                      <button
                        onClick={() => handleMarkFiled(filing.id)}
                        className="px-3 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-bold text-xs rounded-md shadow-2xs transition-all flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        Mark filed
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Filings Table Card */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-zinc-200 bg-white">
              <h2 className="text-sm font-bold text-zinc-900">Filings ({filteredFilings.length})</h2>
              <p className="text-xs text-zinc-500 mt-0.5 font-medium">Click "Checklist" to see filing steps for any compliance type</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-zinc-50/70 border-b border-zinc-200 text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Compliance</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">Due</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Health</th>
                    <th className="px-5 py-3">Step progress</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-medium">
                  {filteredFilings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-zinc-400">
                        No filings match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredFilings.map((filing) => {
                      const isFiled = filing.status === 'Filed';
                      const completedCount = filing.completedSteps || 0;
                      const totalCount = filing.totalSteps || 5;
                      const progressPct = Math.round((completedCount / totalCount) * 100);

                      return (
                        <tr key={filing.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-zinc-900">{filing.complianceCode}</div>
                            <div className="text-[11px] text-zinc-500">{filing.complianceTitle}</div>
                          </td>
                          <td className="px-5 py-3.5 text-zinc-800 font-semibold">{filing.clientName}</td>
                          <td className="px-5 py-3.5 text-zinc-600">{filing.period}</td>
                          <td className="px-5 py-3.5 text-zinc-600">{filing.dueDate}</td>
                          <td className="px-5 py-3.5">
                            {isFiled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[11px]">
                                <Check className="w-3 h-3" />
                                Filed {filing.filedDate || filing.dueDate}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-md font-bold text-[11px]">
                                {filing.status}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              filing.health === 'Green' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : filing.health === 'Amber' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {filing.health}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="w-28 space-y-1">
                              <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                                <span>{completedCount}/{totalCount} steps</span>
                                <span>{progressPct}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${isFiled ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => {
                                // Find steps or build default steps for checklist modal
                                const typeObj = COMPLIANCE_TYPES.find(t => t.code === filing.complianceCode);
                                const defaultSteps = typeObj ? typeObj.steps.map((s, idx) => ({
                                  id: `s-${idx}`,
                                  title: s,
                                  completed: isFiled || false
                                })) : [];
                                setActiveChecklistFiling({
                                  ...filing,
                                  steps: filing.steps || defaultSteps
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold rounded-lg shadow-2xs transition-all"
                            >
                              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Checklist</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance Types Section */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Compliance Types</h2>
              <p className="text-xs text-zinc-500 mt-0.5 font-medium">Standard due dates per Indian regulations (PDF p.12-14)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {COMPLIANCE_TYPES.map((type) => (
                <div 
                  key={type.code}
                  className="p-4 bg-zinc-50/70 border border-zinc-200/80 rounded-xl flex flex-col justify-between hover:border-indigo-200 hover:bg-white transition-all space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-zinc-900">{type.code}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md">
                        {type.category}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-zinc-800 mt-1">{type.name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5 font-medium">{type.frequency} · {type.dueRule}</div>
                  </div>

                  <button
                    onClick={() => setActiveTypeChecklist(type)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 pt-1 self-start transition-colors"
                  >
                    <span>View checklist</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : activeView === 'calendar' ? (
        <div className="p-8 max-w-[1600px] mx-auto w-full">
          <ComplianceCalendarTab />
        </div>
      ) : activeView === 'gstr3b' ? (
        <div className="p-8 max-w-[1600px] mx-auto w-full">
          <Gstr3bWorkflowTab />
        </div>
      ) : activeView === 'incometax' ? (
        <div className="p-8 max-w-[1600px] mx-auto w-full">
          <IncomeTaxComputationTab />
        </div>
      ) : activeView === 'tds' ? (
        <div className="p-8 max-w-[1600px] mx-auto w-full">
          <TdsManagementTab />
        </div>
      ) : activeView === 'health' ? (
        <div className="p-8 max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
          <ComplianceHealthDashboardTab filings={filings} clients={clientOptions} />
        </div>
      ) : (
        <div className="p-8 max-w-[1600px] mx-auto w-full">
          <StatutoryTemplatesSection />
        </div>
      )}

      {/* MODAL: + New Filing */}
      {isNewFilingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70 shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Schedule New Compliance Filing</h3>
              </div>
              <button 
                onClick={() => setIsNewFilingModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFiling} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">Compliance Type</label>
                <select
                  value={selectedComplianceCode}
                  onChange={(e) => setSelectedComplianceCode(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg font-medium text-zinc-900 bg-white"
                >
                  {COMPLIANCE_TYPES.map(t => (
                    <option key={t.code} value={t.code}>
                      {t.code} - {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Client Name</label>
                <select
                  value={selectedClientName}
                  onChange={(e) => setSelectedClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg font-medium text-zinc-900 bg-white"
                >
                  {clientOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Period / Assessment Year</label>
                  <input
                    type="text"
                    required
                    value={filingPeriod}
                    onChange={(e) => setFilingPeriod(e.target.value)}
                    placeholder="2026-27"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg font-medium text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">Statutory Due Date</label>
                  <input
                    type="date"
                    required
                    value={filingDueDate}
                    onChange={(e) => setFilingDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg font-medium text-zinc-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Auto-Generated Filing Workflow
                </div>
                <p className="text-zinc-600 text-[11px]">
                  Standard checklist steps defined under Indian statutory guidelines will be initialized automatically.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewFilingModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 font-bold rounded-lg hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-full shadow-sm"
                >
                  Save & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Active Filing Checklist */}
      {activeChecklistFiling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-zinc-900">
                    {activeChecklistFiling.complianceCode} Checklist: {activeChecklistFiling.clientName}
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Period: {activeChecklistFiling.period} • Due: {activeChecklistFiling.dueDate}
                </p>
              </div>
              <button 
                onClick={() => setActiveChecklistFiling(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs">
                <div>
                  <span className="font-bold text-zinc-700">Completion Progress:</span>{' '}
                  <span className="font-bold text-indigo-700">
                    {activeChecklistFiling.completedSteps || 0} of {activeChecklistFiling.totalSteps || 5} steps completed
                  </span>
                </div>
                {activeChecklistFiling.status === 'Filed' && (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[11px]">
                    ✓ Return Filed
                  </span>
                )}
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {activeChecklistFiling.steps?.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    onClick={() => handleToggleStep(activeChecklistFiling.id, idx)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      step.completed 
                        ? 'bg-emerald-50/40 border-emerald-200 text-zinc-900' 
                        : 'bg-white border-zinc-200 text-zinc-700 hover:border-indigo-200'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                      step.completed ? 'bg-emerald-600 text-white' : 'border border-zinc-300 bg-white'
                    }`}>
                      {step.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="flex-1 text-xs">
                      <div className={`font-semibold ${step.completed ? 'line-through text-zinc-500' : 'text-zinc-900'}`}>
                        {step.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
                <button
                  onClick={() => {
                    handleMarkFiled(activeChecklistFiling.id);
                    setActiveChecklistFiling(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark Entire Filing Complete
                </button>
                <button
                  onClick={() => setActiveChecklistFiling(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Compliance Type Checklist Details */}
      {activeTypeChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-xl w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-zinc-900">{activeTypeChecklist.code}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md">
                    {activeTypeChecklist.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5 font-semibold">{activeTypeChecklist.name}</p>
              </div>
              <button 
                onClick={() => setActiveTypeChecklist(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                <div className="text-zinc-500 font-medium">Standard Due Date:</div>
                <div className="font-bold text-zinc-900">{activeTypeChecklist.frequency} · {activeTypeChecklist.dueRule}</div>
                <p className="text-zinc-600 text-[11px] mt-1">{activeTypeChecklist.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] mb-2.5">
                  Standard Statutory Preparation Checklist ({activeTypeChecklist.steps.length} Steps)
                </h4>
                <div className="space-y-2">
                  {activeTypeChecklist.steps.map((st, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white border border-zinc-200 rounded-lg">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-zinc-800 font-medium">{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedComplianceCode(activeTypeChecklist.code);
                    setActiveTypeChecklist(null);
                    setIsNewFilingModalOpen(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Schedule Filing for Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
