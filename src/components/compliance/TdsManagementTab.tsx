import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Plus, 
  Search, 
  CheckSquare, 
  XCircle, 
  ShieldCheck, 
  AlertCircle, 
  Building2, 
  User, 
  Copy, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  Send, 
  Eye, 
  Trash2, 
  Edit3, 
  X, 
  FileCheck, 
  Info, 
  Sparkles,
  Layers,
  ArrowRight,
  Printer
} from 'lucide-react';
import { downloadTdsCertificatePDF, printTdsCertificate } from '../../utils/printAndPdfUtils';
import { 
  TdsReturn, 
  Deductee, 
  TdsChallan, 
  Form16Certificate, 
  TdsQuarter, 
  TdsReturnForm, 
  TdsSection, 
  DeducteeCategory, 
  PanStatus 
} from '../../types/tds';
import { 
  INITIAL_TDS_RETURNS, 
  INITIAL_DEDUCTEES, 
  INITIAL_CHALLANS, 
  INITIAL_CERTIFICATES 
} from '../../data/tdsData';
import { 
  validatePan, 
  getStandardTdsRate, 
  getFinalEffectiveRate, 
  ENTITY_MAP 
} from '../../utils/panValidator';

export function TdsManagementTab() {
  const [activeSubTab, setActiveSubTab] = useState<'tracker' | 'deductees' | 'challans' | 'forms'>('tracker');
  const [selectedFy, setSelectedFy] = useState<string>('2025-26');
  const [formFilter, setFormFilter] = useState<string>('ALL');
  const [searchDeductee, setSearchDeductee] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Core dynamic datasets
  const [returns, setReturns] = useState<TdsReturn[]>(INITIAL_TDS_RETURNS);
  const [deductees, setDeductees] = useState<Deductee[]>(INITIAL_DEDUCTEES);
  const [challans, setChallans] = useState<TdsChallan[]>(INITIAL_CHALLANS);
  const [certificates, setCertificates] = useState<Form16Certificate[]>(INITIAL_CERTIFICATES);

  // Dedicated PAN validation widget state
  const [panInput, setPanInput] = useState<string>('');
  const [simulateInoperative, setSimulateInoperative] = useState<boolean>(false);
  const [panValidationResult, setPanValidationResult] = useState<any>(null);

  // Modals state
  const [isAddDeducteeModalOpen, setIsAddDeducteeModalOpen] = useState<boolean>(false);
  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState<boolean>(false);
  const [isMarkFiledModalOpen, setIsMarkFiledModalOpen] = useState<boolean>(false);
  const [selectedReturnForAction, setSelectedReturnForAction] = useState<TdsReturn | null>(null);
  const [viewReturnSummary, setViewReturnSummary] = useState<TdsReturn | null>(null);
  const [previewCert, setPreviewCert] = useState<Form16Certificate | null>(null);
  const [fvuSuccessModal, setFvuSuccessModal] = useState<{ returnItem: TdsReturn; hash: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Deductee Form State
  const [newDeducteeName, setNewDeducteeName] = useState('');
  const [newDeducteePan, setNewDeducteePan] = useState('');
  const [newDeducteeCategory, setNewDeducteeCategory] = useState<DeducteeCategory>('NON_COMPANY_INDIVIDUAL');
  const [newDeducteeSection, setNewDeducteeSection] = useState<TdsSection>('194C');
  const [newDeducteeEmail, setNewDeducteeEmail] = useState('');
  const [newDeducteePhone, setNewDeducteePhone] = useState('');
  const [newDeducteeState, setNewDeducteeState] = useState('Karnataka');
  const [newDeducteeAddress, setNewDeducteeAddress] = useState('');
  const [hasLowerDeduction, setHasLowerDeduction] = useState(false);
  const [lowerCertNo, setLowerCertNo] = useState('');
  const [lowerRateVal, setLowerRateVal] = useState('1.5');

  // Mark Filed Form State
  const [filedPrn, setFiledPrn] = useState('');
  const [filedToken, setFiledToken] = useState('');
  const [filedDate, setFiledDate] = useState(new Date().toISOString().split('T')[0]);

  // Show quick toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Run standalone PAN validation tool
  const handleValidatePan = () => {
    if (!panInput.trim()) {
      showToast('Please enter a 10-digit PAN to validate.');
      return;
    }
    const result = validatePan(panInput, simulateInoperative);
    setPanValidationResult(result);
  };

  // Filtered Returns List
  const filteredReturns = useMemo(() => {
    return returns.filter(r => {
      const matchesFy = r.financialYear === selectedFy;
      const matchesForm = formFilter === 'ALL' || r.formType === formFilter;
      return matchesFy && matchesForm;
    });
  }, [returns, selectedFy, formFilter]);

  // Filtered Deductees List
  const filteredDeductees = useMemo(() => {
    return deductees.filter(d => {
      const matchesSearch = 
        d.name.toLowerCase().includes(searchDeductee.toLowerCase()) ||
        d.pan.toLowerCase().includes(searchDeductee.toLowerCase()) ||
        d.email.toLowerCase().includes(searchDeductee.toLowerCase());
      
      const matchesSection = sectionFilter === 'ALL' || d.section === sectionFilter;
      
      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'OPERATIVE' && d.panStatus === 'OPERATIVE') ||
        (statusFilter === 'INOPERATIVE' && d.panStatus === 'INOPERATIVE_AADHAAR_UNLINKED') ||
        (statusFilter === 'LOWER_RATE' && d.panStatus === 'LOWER_RATE_CERTIFICATE');

      return matchesSearch && matchesSection && matchesStatus;
    });
  }, [deductees, searchDeductee, sectionFilter, statusFilter]);

  // Summary Metrics calculations
  const totalTdsDeposited = useMemo(() => {
    return returns.reduce((acc, r) => acc + (r.totalChallanAmount || 0), 0);
  }, [returns]);

  const returnsFiledCount = useMemo(() => {
    return returns.filter(r => r.status === 'FILED').length;
  }, [returns]);

  const inoperativePanCount = useMemo(() => {
    return deductees.filter(d => d.panStatus === 'INOPERATIVE_AADHAAR_UNLINKED').length;
  }, [deductees]);

  // Handle Add Deductee Submission
  const handleSaveDeductee = (e: React.FormEvent) => {
    e.preventDefault();
    const panResult = validatePan(newDeducteePan, false);

    if (!panResult.isValid) {
      alert(`Invalid PAN format: ${panResult.error}`);
      return;
    }

    const standardRate = getStandardTdsRate(newDeducteeSection, newDeducteeCategory);
    let appliedRate = standardRate;
    let isHigher = false;
    let panStatus: PanStatus = 'OPERATIVE';

    if (hasLowerDeduction && lowerRateVal) {
      appliedRate = parseFloat(lowerRateVal);
      panStatus = 'LOWER_RATE_CERTIFICATE';
    } else if (panResult.isInoperative) {
      appliedRate = Math.max(20, standardRate * 2);
      isHigher = true;
      panStatus = 'INOPERATIVE_AADHAAR_UNLINKED';
    }

    const newEntry: Deductee = {
      id: `ded-${Date.now()}`,
      name: newDeducteeName.trim(),
      pan: newDeducteePan.trim().toUpperCase(),
      panStatus,
      category: newDeducteeCategory,
      section: newDeducteeSection,
      standardRate,
      appliedRate,
      isHigherDeduction206AA: isHigher,
      lowerDeductionCertNo: hasLowerDeduction ? lowerCertNo : undefined,
      lowerDeductionValidTill: hasLowerDeduction ? '2026-03-31' : undefined,
      email: newDeducteeEmail.trim(),
      phone: newDeducteePhone.trim(),
      state: newDeducteeState,
      address: newDeducteeAddress.trim(),
      ytdPayment: 0,
      ytdTdsDeducted: 0,
      lastDeductionDate: new Date().toISOString().split('T')[0]
    };

    setDeductees(prev => [newEntry, ...prev]);
    setIsAddDeducteeModalOpen(false);
    showToast(`Deductee "${newEntry.name}" registered successfully with ${newEntry.appliedRate}% rate!`);

    // Reset Form
    setNewDeducteeName('');
    setNewDeducteePan('');
    setNewDeducteeEmail('');
    setNewDeducteePhone('');
    setNewDeducteeAddress('');
    setHasLowerDeduction(false);
  };

  // Toggle inoperative status for testing Section 206AA
  const toggleDeducteeStatus = (id: string) => {
    setDeductees(prev => prev.map(d => {
      if (d.id === id) {
        const nextStatus: PanStatus = d.panStatus === 'OPERATIVE' 
          ? 'INOPERATIVE_AADHAAR_UNLINKED' 
          : 'OPERATIVE';
        
        const standardRate = getStandardTdsRate(d.section, d.category);
        const nextAppliedRate = nextStatus === 'INOPERATIVE_AADHAAR_UNLINKED' 
          ? Math.max(20, standardRate * 2) 
          : standardRate;
        const nextIsHigher = nextStatus === 'INOPERATIVE_AADHAAR_UNLINKED';

        return {
          ...d,
          panStatus: nextStatus,
          appliedRate: nextAppliedRate,
          isHigherDeduction206AA: nextIsHigher
        };
      }
      return d;
    }));
    showToast('Deductee PAN compliance status and Section 206AA rate recomputed.');
  };

  // Handle Mark Return as Filed
  const handleMarkAsFiled = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturnForAction) return;

    if (!filedPrn.trim()) {
      alert('Please enter PRN (Provisional Receipt Number).');
      return;
    }

    setReturns(prev => prev.map(r => {
      if (r.id === selectedReturnForAction.id) {
        return {
          ...r,
          status: 'FILED',
          prnReceiptNo: filedPrn.trim(),
          tokenNo: filedToken.trim() || `TK-${Math.floor(10000000 + Math.random() * 90000000)}`,
          filingDate: filedDate,
          fvuVersion: r.fvuVersion || 'v8.6'
        };
      }
      return r;
    }));

    setIsMarkFiledModalOpen(false);
    setSelectedReturnForAction(null);
    setFiledPrn('');
    setFiledToken('');
    showToast(`Return marked as FILED successfully! PRN: ${filedPrn}`);
  };

  // Simulate FVU Validation
  const handleValidateFvu = (ret: TdsReturn) => {
    const randomHash = `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    setReturns(prev => prev.map(r => {
      if (r.id === ret.id) {
        return {
          ...r,
          status: 'FVU_VALIDATED',
          fvuVersion: 'v8.6',
          remarks: 'File Validation Utility passed without statutory fatal errors.'
        };
      }
      return r;
    }));

    setFvuSuccessModal({ returnItem: ret, hash: randomHash });
  };

  // Bulk PAN Audit action
  const handleBulkPanAudit = () => {
    let flagged = 0;
    setDeductees(prev => prev.map(d => {
      // simulate check: if PAN ends in 'Z' or has flag, mark inoperative
      const isInop = d.pan.endsWith('Z') || d.panStatus === 'INOPERATIVE_AADHAAR_UNLINKED';
      if (isInop) flagged++;
      const stdRate = getStandardTdsRate(d.section, d.category);
      return {
        ...d,
        panStatus: isInop ? 'INOPERATIVE_AADHAAR_UNLINKED' : (d.lowerDeductionCertNo ? 'LOWER_RATE_CERTIFICATE' : 'OPERATIVE'),
        appliedRate: isInop ? Math.max(20, stdRate * 2) : (d.lowerDeductionCertNo ? d.appliedRate : stdRate),
        isHigherDeduction206AA: isInop
      };
    }));

    showToast(`Bulk PAN Audit completed! Checked ${deductees.length} deductees. ${flagged} non-compliant PAN(s) flagged under Sec 206AA.`);
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[760px]">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-zinc-900 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md transition-all">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Module Header */}
      <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-zinc-900 tracking-tight">TDS & TRACES Compliance Center</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  IT Act 1961
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Manage 26Q (Non-Salary) and 24Q (Salary) quarterly returns, Deductee Master with live PAN validation, Challan OLTAS tagging, and TRACES Form 16 dispatch.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-zinc-500 mr-2">Financial Year:</span>
            <select 
              value={selectedFy} 
              onChange={e => setSelectedFy(e.target.value)}
              className="text-xs font-bold text-zinc-900 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="2025-26">FY 2025-26 (AY 2026-27)</option>
              <option value="2024-25">FY 2024-25 (AY 2025-26)</option>
              <option value="2023-24">FY 2023-24 (AY 2024-25)</option>
            </select>
          </div>

          <button 
            onClick={() => showToast('TRACES Portal Synced: Verified Challans & AIS 26AS matching up-to-date.')}
            className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 hover:text-zinc-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sync TRACES</span>
          </button>

          <button 
            onClick={() => setIsAddDeducteeModalOpen(true)}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Deductee</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-zinc-200 bg-white">
        <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Total TDS Deposited ({selectedFy})</span>
          <div className="text-xl font-extrabold text-zinc-900">
            ₹{totalTdsDeposited.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% ITNS 281 Challan Backed
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Quarterly Returns Filed</span>
          <div className="text-xl font-extrabold text-indigo-700">
            {returnsFiledCount} <span className="text-xs text-zinc-400 font-normal">/ {returns.length} Total</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-medium mt-1 block">
            Form 26Q & 24Q tracking active
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Active Deductee Master</span>
          <div className="text-xl font-extrabold text-zinc-900">
            {deductees.length} <span className="text-xs text-zinc-400 font-normal">Vendors & Staff</span>
          </div>
          <span className="text-[11px] text-indigo-600 font-medium mt-1 block">
            Verified across 7 statutory sections
          </span>
        </div>

        <div className={`p-4 rounded-xl border ${inoperativePanCount > 0 ? 'border-amber-300 bg-amber-50/40' : 'border-zinc-200 bg-zinc-50/50'}`}>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Sec 206AA Non-Compliance Risk</span>
          <div className={`text-xl font-extrabold ${inoperativePanCount > 0 ? 'text-amber-900' : 'text-emerald-700'}`}>
            {inoperativePanCount} <span className="text-xs font-normal">Inoperative PAN(s)</span>
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> 20% Higher Rate Enforced
          </span>
        </div>
      </div>

      {/* Sub-Tabs Bar */}
      <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-200 bg-zinc-50/30 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveSubTab('tracker')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'tracker' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg' 
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Quarterly Returns (26Q & 24Q)</span>
          <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-200 text-zinc-700">
            {filteredReturns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('deductees')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'deductees' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg' 
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Deductee Master & PAN Validator</span>
          <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-200 text-zinc-700">
            {deductees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('challans')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'challans' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg' 
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Challan Reconciliation (ITNS 281)</span>
          <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-200 text-zinc-700">
            {challans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('forms')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'forms' 
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg' 
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Form 16 / 16A Certificates</span>
          <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-200 text-zinc-700">
            {certificates.length}
          </span>
        </button>
      </div>

      {/* Main Tab Views Body */}
      <div className="p-6 flex-1 bg-zinc-50/20 overflow-y-auto">

        {/* SUB-TAB 1: 26Q & 24Q QUARTERLY RETURNS TRACKER */}
        {activeSubTab === 'tracker' && (
          <div className="space-y-6">
            
            {/* Quarter Status Visual Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 border border-zinc-200 rounded-xl shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
                  <span>Q1 (Apr - Jun)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Due 31 Jul</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-sm text-zinc-900 block">26Q & 24Q Filed</span>
                    <span className="text-[10px] text-zinc-400">Ack No: 082510200192837</span>
                  </div>
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 border border-amber-300 bg-amber-50/20 rounded-xl shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                  <span>Q2 (Jul - Sep)</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">Due 31 Oct</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-sm text-amber-950 block">FVU Ready / In Progress</span>
                    <span className="text-[10px] text-amber-800 font-medium">Challans tagged & balanced</span>
                  </div>
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 border border-zinc-200 rounded-xl shadow-xs opacity-80">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
                  <span>Q3 (Oct - Dec)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Due 31 Jan</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-sm text-zinc-500 block">Upcoming Quarter</span>
                    <span className="text-[10px] text-zinc-400">Monthly challans accumulating</span>
                  </div>
                  <div className="p-2 bg-zinc-100 text-zinc-400 rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 border border-zinc-200 rounded-xl shadow-xs opacity-80">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
                  <span>Q4 (Jan - Mar)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Due 31 May</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-sm text-zinc-500 block">Final Quarter & Annexure II</span>
                    <span className="text-[10px] text-zinc-400">Salary tax reconciliations</span>
                  </div>
                  <div className="p-2 bg-zinc-100 text-zinc-400 rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Action Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-600">Form Filter:</span>
                <div className="flex bg-zinc-100 p-0.5 rounded-lg text-xs font-bold">
                  {['ALL', '26Q', '24Q'].map((ft) => (
                    <button
                      key={ft}
                      onClick={() => setFormFilter(ft)}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        formFilter === ft ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      {ft === 'ALL' ? 'All Forms' : ft === '26Q' ? '26Q (Non-Salary)' : '24Q (Salary)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium">
                  Showing <strong>{filteredReturns.length}</strong> quarterly returns for FY {selectedFy}
                </span>
              </div>
            </div>

            {/* Quarterly Returns Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Form & Quarter</th>
                      <th className="px-4 py-3">Deductor Client & TAN</th>
                      <th className="px-4 py-3">Deductees</th>
                      <th className="px-4 py-3">TDS Amount</th>
                      <th className="px-4 py-3">Challans Linked</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">PRN / Receipt</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {filteredReturns.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-zinc-500">
                          No returns found for the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredReturns.map((ret) => (
                        <tr key={ret.id} className="hover:bg-zinc-50/70 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                                ret.formType === '26Q' 
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                                  : 'bg-purple-50 text-purple-800 border border-purple-200'
                              }`}>
                                {ret.formType}
                              </span>
                              <span className="font-bold text-zinc-900">{ret.quarter}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">Due: {ret.dueDate}</span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-bold text-zinc-900 block">{ret.deductorName}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">TAN: {ret.tan}</span>
                          </td>

                          <td className="px-4 py-3.5 text-zinc-700 font-semibold">
                            {ret.deducteesCount} records
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-bold text-zinc-900 block">
                              ₹{ret.totalTdsAmount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              Gross: ₹{(ret.totalPaymentAmount / 100000).toFixed(1)}L
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ret.challansLinkedCount === ret.challansTotalCount && ret.challansTotalCount > 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {ret.challansLinkedCount} / {ret.challansTotalCount} Linked
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            {ret.status === 'FILED' && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Filed
                              </span>
                            )}
                            {ret.status === 'FVU_VALIDATED' && (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> FVU Validated
                              </span>
                            )}
                            {ret.status === 'CHALLANS_LINKED' && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold uppercase">
                                Challans Tagged
                              </span>
                            )}
                            {ret.status === 'DRAFT' && (
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded text-[10px] font-bold uppercase">
                                Draft
                              </span>
                            )}
                            {ret.status === 'NOT_STARTED' && (
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-400 border border-zinc-200 rounded text-[10px] font-medium uppercase">
                                Not Started
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            {ret.prnReceiptNo ? (
                              <div>
                                <span className="font-mono text-zinc-900 font-bold block">{ret.prnReceiptNo}</span>
                                <span className="text-[10px] text-zinc-400">Filed: {ret.filingDate}</span>
                              </div>
                            ) : (
                              <span className="text-zinc-400 italic">Not filed yet</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {ret.status !== 'FILED' && (
                                <>
                                  <button
                                    onClick={() => handleValidateFvu(ret)}
                                    title="Run File Validation Utility (FVU v8.6)"
                                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                                  >
                                    Validate FVU
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedReturnForAction(ret);
                                      setIsMarkFiledModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                                  >
                                    Mark Filed
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => setViewReturnSummary(ret)}
                                className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                title="View Return Details & Deductee List"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SUB-TAB 2: DEDUCTEE MASTER WITH REAL-TIME PAN VALIDATOR */}
        {activeSubTab === 'deductees' && (
          <div className="space-y-6">
            
            {/* Interactive PAN Validation Tool Card */}
            <div className="bg-white p-5 border border-zinc-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Live PAN Validation & Section 206AA Engine</h3>
                    <p className="text-xs text-zinc-500">Statutory 10-digit PAN syntax, entity letter breakdown, and inoperative higher rate simulation.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-zinc-600 flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={simulateInoperative} 
                      onChange={e => setSimulateInoperative(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Simulate Inoperative (Unlinked Aadhaar)</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <input 
                    type="text" 
                    placeholder="Enter 10-digit PAN (e.g. ABCDE1234F)..." 
                    value={panInput}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setPanInput(val);
                      if (val.length === 10) {
                        setPanValidationResult(validatePan(val, simulateInoperative));
                      } else {
                        setPanValidationResult(null);
                      }
                    }}
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 font-mono text-sm uppercase tracking-wider border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  {panInput && (
                    <button 
                      onClick={() => { setPanInput(''); setPanValidationResult(null); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button 
                  onClick={handleValidatePan}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  Validate Structure
                </button>

                {/* Quick Pre-fill Samples */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="text-[11px] font-semibold">Try:</span>
                  <button 
                    onClick={() => {
                      setPanInput('AACCG8821N');
                      setPanValidationResult(validatePan('AACCG8821N', false));
                    }}
                    className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-[10px] font-mono font-bold cursor-pointer"
                  >
                    Company (C)
                  </button>
                  <button 
                    onClick={() => {
                      setPanInput('ABRPC4521M');
                      setPanValidationResult(validatePan('ABRPC4521M', false));
                    }}
                    className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-[10px] font-mono font-bold cursor-pointer"
                  >
                    Individual (P)
                  </button>
                  <button 
                    onClick={() => {
                      setPanInput('AABCV7712Z');
                      setPanValidationResult(validatePan('AABCV7712Z', true));
                    }}
                    className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-[10px] font-mono font-bold cursor-pointer"
                  >
                    Inoperative (206AA)
                  </button>
                </div>
              </div>

              {/* Validation Result Box */}
              {panValidationResult && (
                <div className={`mt-4 p-4 rounded-xl border transition-all ${
                  panValidationResult.isValid
                    ? panValidationResult.isInoperative 
                      ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                      : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50/70 border-rose-300 text-rose-950'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {panValidationResult.isValid ? (
                        panValidationResult.isInoperative ? (
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        )
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-base tracking-wider">
                            {panValidationResult.pan}
                          </span>
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            panValidationResult.isValid 
                              ? panValidationResult.isInoperative 
                                ? 'bg-amber-200 text-amber-900' 
                                : 'bg-emerald-200 text-emerald-900'
                              : 'bg-rose-200 text-rose-900'
                          }`}>
                            {panValidationResult.isValid 
                              ? (panValidationResult.isInoperative ? 'INOPERATIVE (Sec 206AA)' : 'VALID & ACTIVE') 
                              : 'INVALID'}
                          </span>
                        </div>

                        <p className="text-xs font-semibold mt-1">
                          {panValidationResult.isValid 
                            ? `Entity Type Detected: ${panValidationResult.entityType}`
                            : panValidationResult.error}
                        </p>

                        {panValidationResult.breakdown && (
                          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-zinc-200/50 text-[11px] font-mono">
                            <span className="bg-white/80 px-2 py-0.5 rounded border border-zinc-200">
                              Series: <strong>{panValidationResult.breakdown.series}</strong>
                            </span>
                            <span className="bg-white/80 px-2 py-0.5 rounded border border-zinc-200">
                              4th Char (Entity): <strong>{panValidationResult.breakdown.entityLetter}</strong> ({panValidationResult.entityType.split(' ')[0]})
                            </span>
                            <span className="bg-white/80 px-2 py-0.5 rounded border border-zinc-200">
                              5th Char (Surname): <strong>{panValidationResult.breakdown.nameInitial}</strong>
                            </span>
                            <span className="bg-white/80 px-2 py-0.5 rounded border border-zinc-200">
                              Digits: <strong>{panValidationResult.breakdown.sequenceDigits}</strong>
                            </span>
                            <span className="bg-white/80 px-2 py-0.5 rounded border border-zinc-200">
                              Check Digit: <strong>{panValidationResult.breakdown.checkLetter}</strong>
                            </span>
                          </div>
                        )}

                        <p className="text-[11px] mt-2 font-medium">
                          {panValidationResult.recommendedRateNotice}
                        </p>
                      </div>
                    </div>

                    {panValidationResult.isValid && (
                      <button
                        onClick={() => {
                          setNewDeducteePan(panValidationResult.pan);
                          setNewDeducteeCategory(panValidationResult.entityCategory);
                          setIsAddDeducteeModalOpen(true);
                        }}
                        className="shrink-0 flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Master</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Deductee Search & Filtering Strip */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs">
              <div className="flex items-center gap-3 flex-1 max-w-lg">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={searchDeductee}
                    onChange={e => setSearchDeductee(e.target.value)}
                    placeholder="Search by vendor name, PAN, or email..." 
                    className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select 
                  value={sectionFilter} 
                  onChange={e => setSectionFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-300 rounded-lg bg-white font-medium text-zinc-700"
                >
                  <option value="ALL">All Sections</option>
                  <option value="194C">194C (Contractors)</option>
                  <option value="194J_PROF">194J (Professional 10%)</option>
                  <option value="194J_TECH">194J (Technical 2%)</option>
                  <option value="194I_LAND">194I (Rent Land 10%)</option>
                  <option value="194Q">194Q (Goods Purchase)</option>
                </select>

                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-zinc-300 rounded-lg bg-white font-medium text-zinc-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPERATIVE">Active Operative</option>
                  <option value="INOPERATIVE">Inoperative (206AA)</option>
                  <option value="LOWER_RATE">Sec 197 Concessional</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleBulkPanAudit}
                  className="flex items-center gap-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 px-3 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Run Bulk PAN Audit</span>
                </button>

                <button 
                  onClick={() => setIsAddDeducteeModalOpen(true)}
                  className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Deductee</span>
                </button>
              </div>
            </div>

            {/* Deductee Master Records Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Deductee Legal Name</th>
                      <th className="px-4 py-3">PAN & Status</th>
                      <th className="px-4 py-3">Entity Type</th>
                      <th className="px-4 py-3">Section</th>
                      <th className="px-4 py-3">Statutory Rate</th>
                      <th className="px-4 py-3">Applied Rate</th>
                      <th className="px-4 py-3">YTD Payments</th>
                      <th className="px-4 py-3">TDS Deducted</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {filteredDeductees.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-zinc-500">
                          No deductees found matching the search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredDeductees.map((ded) => (
                        <tr key={ded.id} className="hover:bg-zinc-50/70 transition-colors">
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-zinc-900 block">{ded.name}</span>
                            <span className="text-[10px] text-zinc-400">{ded.email || ded.phone || 'No contact provided'}</span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-zinc-900">{ded.pan}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(ded.pan);
                                  showToast(`Copied PAN ${ded.pan} to clipboard`);
                                }}
                                className="text-zinc-400 hover:text-zinc-600 p-0.5"
                                title="Copy PAN"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            {ded.panStatus === 'OPERATIVE' && (
                              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Active Operative
                              </span>
                            )}
                            {ded.panStatus === 'INOPERATIVE_AADHAAR_UNLINKED' && (
                              <span className="text-[10px] text-rose-700 font-bold flex items-center gap-1 mt-0.5">
                                <XCircle className="w-3 h-3" /> Inoperative (206AA)
                              </span>
                            )}
                            {ded.panStatus === 'LOWER_RATE_CERTIFICATE' && (
                              <span className="text-[10px] text-indigo-700 font-bold flex items-center gap-1 mt-0.5">
                                <FileCheck className="w-3 h-3" /> Sec 197 Cert
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="text-zinc-700 font-medium">
                              {ENTITY_MAP[ded.pan[3]]?.label.split(' ')[0] || ded.category}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded font-mono font-bold text-[10px]">
                              {ded.section.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-zinc-600">
                            {ded.standardRate}%
                          </td>

                          <td className="px-4 py-3.5">
                            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              ded.isHigherDeduction206AA 
                                ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                : ded.lowerDeductionCertNo 
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                                  : 'text-zinc-900'
                            }`}>
                              {ded.appliedRate}%
                              {ded.isHigherDeduction206AA && ' (206AA)'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-zinc-900 font-semibold">
                            ₹{ded.ytdPayment.toLocaleString('en-IN')}
                          </td>

                          <td className="px-4 py-3.5 text-zinc-900 font-bold">
                            ₹{ded.ytdTdsDeducted.toLocaleString('en-IN')}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => toggleDeducteeStatus(ded.id)}
                                title={ded.panStatus === 'OPERATIVE' ? 'Mark Inoperative (Test 206AA)' : 'Mark Operative'}
                                className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                {ded.panStatus === 'OPERATIVE' ? 'Test 206AA' : 'Restore'}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remove deductee ${ded.name}?`)) {
                                    setDeductees(prev => prev.filter(x => x.id !== ded.id));
                                    showToast('Deductee removed from master.');
                                  }
                                }}
                                className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                                title="Delete Deductee"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SUB-TAB 3: CHALLAN RECONCILIATION ENGINE */}
        {activeSubTab === 'challans' && (
          <div className="space-y-6">
            
            <div className="bg-white p-5 border border-zinc-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  OLTAS Challan ITNS 281 Reconciliation Engine
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Match Government bank challans against deductee line items before FVU compilation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => showToast('Simulated .CSI (Challan Status Inquiry) file imported and verified against TIN-NSDL records.')}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Upload .CSI File</span>
                </button>
              </div>
            </div>

            {/* Challans Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">BSR Code & Challan No</th>
                      <th className="px-4 py-3">Tender Date</th>
                      <th className="px-4 py-3">Minor Head</th>
                      <th className="px-4 py-3">Nature of Payment</th>
                      <th className="px-4 py-3">Total Deposited</th>
                      <th className="px-4 py-3">Allocated</th>
                      <th className="px-4 py-3">Unconsumed Balance</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {challans.map((ch) => (
                      <tr key={ch.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-zinc-900 block">
                            BSR: {ch.bsrCode} | No: {ch.challanNo}
                          </span>
                          <span className="text-[10px] text-zinc-400">{ch.remarks || 'Authorized Branch'}</span>
                        </td>

                        <td className="px-4 py-3.5 text-zinc-700 font-mono font-semibold">
                          {ch.tenderDate}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-800">
                            {ch.minorHead === '200' ? '200 (Taxpayer Payable)' : '400 (Regular Assessment)'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-zinc-800 font-semibold">
                          {ch.section}
                        </td>

                        <td className="px-4 py-3.5 font-bold text-zinc-900">
                          ₹{ch.totalAmount.toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3.5 text-emerald-700 font-bold">
                          ₹{ch.allocatedAmount.toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3.5 font-mono">
                          ₹{ch.unconsumedAmount.toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                            ch.status === 'MATCHED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {ch.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SUB-TAB 4: FORM 16 / 16A CERTIFICATES */}
        {activeSubTab === 'forms' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-extrabold uppercase">
                      Form 24Q Source
                    </span>
                    <span className="text-xs text-zinc-400">Annual Salary</span>
                  </div>
                  <h3 className="font-bold text-zinc-900 text-sm">Form 16 Generation (Salary)</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Bulk generate Part A (TRACES digital signature) & Part B (Chapter VI-A salary deductions) for corporate employees.
                  </p>
                </div>
                <button 
                  onClick={() => showToast('Generated Form 16 Part A & Part B for 42 employees from 24Q records.')}
                  className="mt-4 flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> 
                  <span>Batch Generate Form 16</span>
                </button>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase">
                      Form 26Q Source
                    </span>
                    <span className="text-xs text-zinc-400">Quarterly Non-Salary</span>
                  </div>
                  <h3 className="font-bold text-zinc-900 text-sm">Form 16A Generation (Non-Salary)</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Quarterly TDS certificates for vendors, contractors (194C), and professionals (194J) with automatic password encryption.
                  </p>
                </div>
                <button 
                  onClick={() => showToast('Generated Form 16A certificates for Q1 & Q2 active deductees.')}
                  className="mt-4 flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> 
                  <span>Batch Generate Form 16A</span>
                </button>
              </div>
            </div>

            {/* Certificates List Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  Generated Statutory Certificates
                </h4>
                <span className="text-xs text-zinc-500 font-medium">
                  {certificates.length} available
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Certificate Type</th>
                      <th className="px-4 py-3">Deductee Name & PAN</th>
                      <th className="px-4 py-3">Deductor TAN</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Gross Paid</th>
                      <th className="px-4 py-3">TDS Deducted</th>
                      <th className="px-4 py-3">Dispatch Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-medium">
                    {certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            cert.certType === '16' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            Form {cert.certType}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-bold text-zinc-900 block">{cert.deducteeName}</span>
                          <span className="font-mono text-[10px] text-zinc-500">PAN: {cert.pan}</span>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-zinc-600">
                          {cert.tan}
                        </td>

                        <td className="px-4 py-3.5 text-zinc-700">
                          {cert.quarter} (FY {cert.financialYear})
                        </td>

                        <td className="px-4 py-3.5 font-bold text-zinc-900">
                          ₹{cert.grossPaid.toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3.5 font-bold text-indigo-700">
                          ₹{cert.taxDeducted.toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                            cert.dispatchStatus === 'EMAILED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          }`}>
                            {cert.dispatchStatus === 'EMAILED' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Emailed
                              </>
                            ) : (
                              'Ready'
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewCert(cert)}
                              className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              title="Preview Statutory Certificate"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                downloadTdsCertificatePDF(cert);
                                showToast(`Downloaded Form ${cert.certType} certificate for ${cert.deducteeName}`);
                              }}
                              className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              title="Download Official Certificate PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => printTdsCertificate(cert)}
                              className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              title="Print Certificate"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => showToast(`Sent encrypted Form ${cert.certType} PDF to ${cert.deducteeName} registered email.`)}
                              className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Email to Deductee"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* MODAL 1: ADD DEDUCTEE WITH REAL-TIME PAN VALIDATOR */}
      {isAddDeducteeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Register New Deductee in Master
                </h3>
              </div>
              <button 
                onClick={() => setIsAddDeducteeModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeductee} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Deductee Legal Name *
                </label>
                <input 
                  type="text" 
                  value={newDeducteeName}
                  onChange={e => setNewDeducteeName(e.target.value)}
                  placeholder="e.g. Apex Engineering Services Pvt Ltd" 
                  className="w-full px-3.5 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Permanent Account Number (PAN) *
                  </label>
                  <input 
                    type="text" 
                    value={newDeducteePan}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      setNewDeducteePan(val);
                      if (val.length === 10) {
                        const res = validatePan(val, false);
                        if (res.isValid) {
                          setNewDeducteeCategory(res.entityCategory);
                        }
                      }
                    }}
                    placeholder="e.g. ABCDE1234F" 
                    maxLength={10}
                    className="w-full px-3.5 py-2 text-xs font-mono uppercase tracking-wider border border-zinc-300 rounded-lg focus:outline-none focus:border-indigo-500 font-bold"
                    required 
                  />
                  {newDeducteePan.length === 10 && (
                    <div className="mt-1">
                      {validatePan(newDeducteePan).isValid ? (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Valid Entity: {validatePan(newDeducteePan).entityType.split(' ')[0]}
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> {validatePan(newDeducteePan).error}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Entity Category
                  </label>
                  <select 
                    value={newDeducteeCategory}
                    onChange={e => setNewDeducteeCategory(e.target.value as DeducteeCategory)}
                    className="w-full px-3.5 py-2 text-xs border border-zinc-300 rounded-lg bg-white font-medium"
                  >
                    <option value="NON_COMPANY_INDIVIDUAL">Individual / Proprietorship</option>
                    <option value="COMPANY">Company (Domestic / Foreign)</option>
                    <option value="PARTNERSHIP_FIRM">Partnership Firm / LLP</option>
                    <option value="HUF">Hindu Undivided Family (HUF)</option>
                    <option value="TRUST_AOP">Trust / AOP / BOI</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Statutory Section *
                  </label>
                  <select 
                    value={newDeducteeSection}
                    onChange={e => setNewDeducteeSection(e.target.value as TdsSection)}
                    className="w-full px-3.5 py-2 text-xs border border-zinc-300 rounded-lg bg-white font-medium"
                  >
                    <option value="194C">194C - Contractor (1% / 2%)</option>
                    <option value="194J_PROF">194J - Professional Fees (10%)</option>
                    <option value="194J_TECH">194J - Technical Services (2%)</option>
                    <option value="194I_LAND">194I - Rent Land/Building (10%)</option>
                    <option value="194I_PLANT">194I - Rent Plant/Machinery (2%)</option>
                    <option value="194H">194H - Commission / Brokerage (2%)</option>
                    <option value="194Q">194Q - Purchase of Goods (0.1%)</option>
                    <option value="192">192 - Salaries</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Standard TDS Rate
                  </label>
                  <div className="px-3.5 py-2 text-xs bg-zinc-100 border border-zinc-200 rounded-lg font-bold text-zinc-800">
                    {getStandardTdsRate(newDeducteeSection, newDeducteeCategory)}%
                  </div>
                </div>
              </div>

              {/* Lower deduction certificate under Sec 197 */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={hasLowerDeduction}
                    onChange={e => setHasLowerDeduction(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-zinc-800">
                    Has Lower / Nil Deduction Certificate (Section 197)
                  </span>
                </label>

                {hasLowerDeduction && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 mb-0.5">Certificate Number</label>
                      <input 
                        type="text" 
                        value={lowerCertNo}
                        onChange={e => setLowerCertNo(e.target.value)}
                        placeholder="CERT-197-2025-XXXX"
                        className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded font-mono"
                        required={hasLowerDeduction}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 mb-0.5">Concessional Rate (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={lowerRateVal}
                        onChange={e => setLowerRateVal(e.target.value)}
                        placeholder="1.5"
                        className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded"
                        required={hasLowerDeduction}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Contact Email</label>
                  <input 
                    type="email" 
                    value={newDeducteeEmail}
                    onChange={e => setNewDeducteeEmail(e.target.value)}
                    placeholder="accounts@vendor.com" 
                    className="w-full px-3.5 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={newDeducteePhone}
                    onChange={e => setNewDeducteePhone(e.target.value)}
                    placeholder="+91 98765 43210" 
                    className="w-full px-3.5 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Address & State</label>
                <input 
                  type="text" 
                  value={newDeducteeAddress}
                  onChange={e => setNewDeducteeAddress(e.target.value)}
                  placeholder="Registered commercial office address" 
                  className="w-full px-3.5 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddDeducteeModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Deductee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MARK AS FILED MODAL */}
      {isMarkFiledModalOpen && selectedReturnForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Record Filing PRN Receipt
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsMarkFiledModalOpen(false);
                  setSelectedReturnForAction(null);
                }}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMarkAsFiled} className="p-6 space-y-4">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-zinc-900 block">
                  Form {selectedReturnForAction.formType} - {selectedReturnForAction.quarter} ({selectedReturnForAction.financialYear})
                </span>
                <span className="text-zinc-500 block">
                  Deductor: {selectedReturnForAction.deductorName} (TAN: {selectedReturnForAction.tan})
                </span>
                <span className="text-indigo-700 font-bold block">
                  TDS Amount: ₹{selectedReturnForAction.totalTdsAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Provisional Receipt Number (PRN / Ack No.) *
                </label>
                <input 
                  type="text" 
                  value={filedPrn}
                  onChange={e => setFiledPrn(e.target.value)}
                  placeholder="e.g. 082510200192837" 
                  className="w-full px-3.5 py-2 font-mono text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-indigo-500 font-bold"
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Token Number / NSDL Reference
                </label>
                <input 
                  type="text" 
                  value={filedToken}
                  onChange={e => setFiledToken(e.target.value)}
                  placeholder="e.g. TK-88912301" 
                  className="w-full px-3.5 py-2 font-mono text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Filing Date
                </label>
                <input 
                  type="date" 
                  value={filedDate}
                  onChange={e => setFiledDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                  required 
                />
              </div>

              <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsMarkFiledModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Filing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FVU VALIDATION SUCCESS MODAL */}
      {fvuSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-md w-full overflow-hidden text-center p-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-zinc-900">
              FVU v8.6 Validation Passed!
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              File Validation Utility successfully validated {fvuSuccessModal.returnItem.formType} for {fvuSuccessModal.returnItem.quarter}. Zero critical errors found.
            </p>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 my-4 text-left text-xs font-mono space-y-1">
              <div className="text-zinc-500 text-[10px]">TIN-NSDL Checksum Hash:</div>
              <div className="text-zinc-900 font-bold break-all">{fvuSuccessModal.hash}</div>
              <div className="text-zinc-500 text-[10px] pt-1">
                Deductee PANs: {fvuSuccessModal.returnItem.deducteesCount} Verified | Challan Matches: 100%
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  showToast('Downloaded .fvu and .html validation report file.');
                  setFvuSuccessModal(null);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white py-2 rounded-lg text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download .FVU File
              </button>
              <button
                onClick={() => setFvuSuccessModal(null)}
                className="px-4 py-2 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: RETURN SUMMARY & DETAIL MODAL */}
      {viewReturnSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Return Dossier: Form {viewReturnSummary.formType} ({viewReturnSummary.quarter})
                </h3>
                <p className="text-xs text-zinc-500">{viewReturnSummary.deductorName} - TAN: {viewReturnSummary.tan}</p>
              </div>
              <button 
                onClick={() => setViewReturnSummary(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Status</span>
                  <span className="font-bold text-zinc-900 text-sm mt-0.5 block">{viewReturnSummary.status}</span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Total TDS</span>
                  <span className="font-bold text-indigo-700 text-sm mt-0.5 block">
                    ₹{viewReturnSummary.totalTdsAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Challans Linked</span>
                  <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                    {viewReturnSummary.challansLinkedCount} / {viewReturnSummary.challansTotalCount}
                  </span>
                </div>
              </div>

              {viewReturnSummary.prnReceiptNo && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="font-bold text-emerald-900">Provisional Receipt No (PRN): {viewReturnSummary.prnReceiptNo}</div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Token: {viewReturnSummary.tokenNo} | Filed Date: {viewReturnSummary.filingDate} | FVU: {viewReturnSummary.fvuVersion}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-bold text-zinc-900 uppercase tracking-wider mb-2 text-[11px]">
                  Linked Deductee Sample Line Items ({viewReturnSummary.deducteesCount} records)
                </h4>
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 font-bold text-zinc-500">
                      <tr>
                        <th className="px-3 py-2">Deductee</th>
                        <th className="px-3 py-2">PAN</th>
                        <th className="px-3 py-2">Section</th>
                        <th className="px-3 py-2 text-right">Tax Deducted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 font-medium">
                      {deductees.slice(0, 4).map((d) => (
                        <tr key={d.id}>
                          <td className="px-3 py-2 text-zinc-800">{d.name}</td>
                          <td className="px-3 py-2 font-mono text-zinc-600">{d.pan}</td>
                          <td className="px-3 py-2">{d.section.replace('_', ' ')}</td>
                          <td className="px-3 py-2 text-right font-bold text-zinc-900">
                            ₹{Math.round(d.ytdTdsDeducted / 2).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/70 flex justify-end">
              <button
                onClick={() => setViewReturnSummary(null)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: STATUTORY CERTIFICATE PREVIEW (FORM 16 / 16A) */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Certificate Preview: Form {previewCert.certType}
                </h3>
              </div>
              <button 
                onClick={() => setPreviewCert(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formal Government Layout Preview */}
            <div className="p-8 space-y-6 overflow-y-auto flex-1 font-serif bg-white text-zinc-900 border-b border-zinc-200">
              <div className="text-center border-b pb-4 border-zinc-300">
                <h2 className="text-base font-bold uppercase tracking-wide">FORM NO. {previewCert.certType === '16' ? '16' : '16A'}</h2>
                <p className="text-xs italic text-zinc-600 mt-1">[See rule 31(1)(a) of Income-tax Rules, 1962]</p>
                <p className="text-xs font-bold mt-1">Certificate under section 203 of the Income-tax Act, 1961 for tax deducted at source</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans border border-zinc-300 p-3 rounded">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Deductor (Tax Deductor):</span>
                  <strong className="block text-zinc-900 mt-0.5">{previewCert.deductorName}</strong>
                  <span className="font-mono text-zinc-600 block">TAN: {previewCert.tan}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Deductee (Payee):</span>
                  <strong className="block text-zinc-900 mt-0.5">{previewCert.deducteeName}</strong>
                  <span className="font-mono text-zinc-600 block">PAN: {previewCert.pan}</span>
                </div>
              </div>

              <div className="text-xs font-sans space-y-2">
                <div className="flex justify-between py-1 border-b border-zinc-200">
                  <span className="text-zinc-600">Financial Year:</span>
                  <strong>{previewCert.financialYear}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200">
                  <span className="text-zinc-600">Assessment Year:</span>
                  <strong>{previewCert.assessmentYear}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200">
                  <span className="text-zinc-600">Quarter / Period:</span>
                  <strong>{previewCert.quarter}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200">
                  <span className="text-zinc-600">Gross Amount Credited / Paid:</span>
                  <strong>₹{previewCert.grossPaid.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200">
                  <span className="text-zinc-600">Total Tax Deducted at Source (TDS):</span>
                  <strong className="text-indigo-700">₹{previewCert.taxDeducted.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200">
                  <span className="text-zinc-600">Total Tax Deposited to Central Govt (OLTAS):</span>
                  <strong className="text-emerald-700">₹{previewCert.taxDeposited.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 italic border-t pt-3">
                Certified that the tax deducted has been deposited to the credit of the Central Government via OLTAS ITNS 281 Challan. This certificate is digitally authenticated under the TRACES framework.
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50/70 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Password: First 4 letters of TAN (lowercase) + deductee PAN (lowercase)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    downloadTdsCertificatePDF(previewCert);
                    showToast(`Official Form ${previewCert.certType} certificate downloaded as PDF.`);
                  }}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button
                  onClick={() => printTdsCertificate(previewCert)}
                  className="flex items-center gap-1.5 border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Certificate
                </button>
                <button
                  onClick={() => setPreviewCert(null)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
