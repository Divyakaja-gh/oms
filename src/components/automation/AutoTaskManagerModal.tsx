import React, { useState } from 'react';
import { 
  CheckSquare, 
  X, 
  Zap, 
  Calendar, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  RotateCcw,
  Sparkles,
  Users
} from 'lucide-react';
import { Task, Client } from '../../types';

interface AutoTaskManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients?: Client[];
  onTasksGenerated: (newTasks: Partial<Task>[]) => void;
}

export function AutoTaskManagerModal({
  isOpen,
  onClose,
  clients = [],
  onTasksGenerated,
}: AutoTaskManagerModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [includeGst, setIncludeGst] = useState(true);
  const [includeTds, setIncludeTds] = useState(true);
  const [includeIncomeTax, setIncludeIncomeTax] = useState(true);
  const [includeMca, setIncludeMca] = useState(true);
  const [includeAdvanceTax, setIncludeAdvanceTax] = useState(true);
  const [targetMonth, setTargetMonth] = useState('September 2026');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSummary, setGenerationSummary] = useState<{
    count: number;
    tasks: string[];
  } | null>(null);

  if (!isOpen) return null;

  // Resolve active clients either from prop or fallback to localStorage
  const activeClientsList: Client[] = clients.length > 0 ? clients : (() => {
    try {
      const saved = localStorage.getItem('caoms_corporate_clients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      { id: 'c1', name: 'Tata Steel Processing Ltd', entityType: 'Private Limited', gstin: '27AABCT2345Q1Z8', tan: 'MUMT12345A' },
      { id: 'c2', name: 'Infosys BPM Solutions LLP', entityType: 'LLP', gstin: '29AABCI5678R1ZX', tan: 'BLRI67890B' },
      { id: 'c3', name: 'Reliance Retail Ventures', entityType: 'Public Limited', gstin: '27AABCR9988P1Z2', tan: 'MUMR44556C' }
    ] as Client[];
  })();

  const targetClients = selectedClientId === 'ALL' 
    ? activeClientsList 
    : activeClientsList.filter(c => c.id === selectedClientId);

  // Template definitions for recurring statutory compliance in India
  const generateStatutoryTasks = () => {
    setIsGenerating(true);
    const newTasks: Partial<Task>[] = [];
    const taskTitles: string[] = [];

    targetClients.forEach(client => {
      const isCorporate = client.entityType === 'Private Limited' || client.entityType === 'Public Limited' || client.type === 'Private Limited';
      const isLlp = client.entityType === 'LLP';
      const hasGst = Boolean(client.gstin && client.gstin.length >= 15);
      const hasTan = Boolean(client.tan && client.tan.length >= 10);

      // 1. GST Recurring Filings
      if (includeGst && hasGst) {
        newTasks.push({
          id: `auto-gst3b-${client.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: `GSTR-3B Monthly Return Filing - ${targetMonth}`,
          client: client.name,
          type: 'GST',
          priority: 'High',
          status: 'Not Started',
          dueDate: '2026-10-20',
          statutoryForm: 'GSTR-3B',
          description: `Auto-scheduled monthly summary return filing for GSTIN ${client.gstin}. Reconcile 2B ITC and pay net liability.`,
          recurrence: 'Monthly',
          subtasks: [
            { id: 'st1', title: 'Download GSTR-2B ITC from portal', completed: false },
            { id: 'st2', title: 'Reconcile Purchase Register with 2B', completed: false },
            { id: 'st3', title: 'Generate PMT-06 tax payment challan', completed: false },
            { id: 'st4', title: 'Sign & file with DSC / EVC OTP', completed: false }
          ]
        });
        taskTitles.push(`${client.name}: GSTR-3B (${targetMonth})`);

        newTasks.push({
          id: `auto-gst1-${client.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: `GSTR-1 Outward Supplies Filing - ${targetMonth}`,
          client: client.name,
          type: 'GST',
          priority: 'Medium',
          status: 'Not Started',
          dueDate: '2026-10-11',
          statutoryForm: 'GSTR-1',
          description: `Upload B2B, B2C, and export sales invoices for ${targetMonth}. Verify HSN summary.`,
          recurrence: 'Monthly',
          subtasks: [
            { id: 'st1', title: 'Extract sales register from ERP', completed: false },
            { id: 'st2', title: 'Validate HSN codes & tax rates', completed: false },
            { id: 'st3', title: 'Upload JSON and file GSTR-1', completed: false }
          ]
        });
        taskTitles.push(`${client.name}: GSTR-1 (${targetMonth})`);
      }

      // 2. TDS Recurring Filings
      if (includeTds && hasTan) {
        newTasks.push({
          id: `auto-tds-challan-${client.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: `Monthly TDS Challan 281 Deposit - ${targetMonth}`,
          client: client.name,
          type: 'Tax',
          priority: 'High',
          status: 'Not Started',
          dueDate: '2026-10-07',
          statutoryForm: 'ITNS-281',
          description: `Deposit tax deducted at source under Sec 194C, 194J, 194I for ${targetMonth} via TIN-NSDL / e-Filing.`,
          recurrence: 'Monthly',
          subtasks: [
            { id: 'st1', title: 'Verify TDS deductions across expenses', completed: false },
            { id: 'st2', title: 'Generate Challan ITNS-281', completed: false },
            { id: 'st3', title: 'Record BSR Code and CIN in ledger', completed: false }
          ]
        });
        taskTitles.push(`${client.name}: Monthly TDS Challan Deposit`);
      }

      // 3. Advance Tax Instalment
      if (includeAdvanceTax) {
        newTasks.push({
          id: `auto-advtax-${client.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: `Advance Tax 2nd Instalment (45%) Due - FY 26-27`,
          client: client.name,
          type: 'Tax',
          priority: 'High',
          status: 'Not Started',
          dueDate: '2026-09-15',
          statutoryForm: 'Challan 280',
          description: `Estimate cumulative net profit through Q2 and deposit 45% of total projected tax liability under Sec 208.`,
          recurrence: 'Quarterly',
          subtasks: [
            { id: 'st1', title: 'Obtain provisional 6-month P&L', completed: false },
            { id: 'st2', title: 'Compute MAT / Section 115BAA tax', completed: false },
            { id: 'st3', title: 'Pay Challan 280 (Minor Head 100)', completed: false }
          ]
        });
        taskTitles.push(`${client.name}: 2nd Advance Tax Instalment`);
      }

      // 4. MCA / ROC Annual Filings for Companies & LLPs
      if (includeMca && (isCorporate || isLlp)) {
        newTasks.push({
          id: `auto-roc-${client.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: isCorporate ? `MCA Form AOC-4 Financial Statements Filing` : `LLP Form 8 Statement of Account & Solvency`,
          client: client.name,
          type: 'ROC',
          priority: 'Medium',
          status: 'Not Started',
          dueDate: isCorporate ? '2026-10-29' : '2026-10-30',
          statutoryForm: isCorporate ? 'AOC-4' : 'LLP Form 8',
          description: `Annual statutory filing with Registrar of Companies. Affix Director & Practicing CA Class-3 DSC.`,
          recurrence: 'Annually',
          subtasks: [
            { id: 'st1', title: 'Draft Board Report & AGM Notice', completed: false },
            { id: 'st2', title: 'Audit sign-off with UDIN', completed: false },
            { id: 'st3', title: 'Upload e-Form on MCA21 V3 Portal', completed: false }
          ]
        });
        taskTitles.push(`${client.name}: MCA Annual Filing (${isCorporate ? 'AOC-4' : 'Form 8'})`);
      }

      // 5. Income Tax Audit & Return
      if (includeIncomeTax) {
        newTasks.push({
          id: `auto-itr-${client.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: isCorporate ? `ITR-6 Corporate Income Tax Return (AY 26-27)` : `ITR-5 Partnership / LLP Tax Return`,
          client: client.name,
          type: 'Tax',
          priority: 'High',
          status: 'Not Started',
          dueDate: '2026-10-31',
          statutoryForm: isCorporate ? 'ITR-6' : 'ITR-5',
          description: `Annual Income Tax return upload with audited balance sheet schedules and Section 80 deductions.`,
          recurrence: 'Annually',
          subtasks: [
            { id: 'st1', title: 'Finalize Schedule BP & Depreciation', completed: false },
            { id: 'st2', title: 'Match 26AS, AIS and TIS credits', completed: false },
            { id: 'st3', title: 'Generate JSON & sign with Partner DSC', completed: false }
          ]
        });
        taskTitles.push(`${client.name}: Annual Income Tax Filing`);
      }
    });

    setTimeout(() => {
      onTasksGenerated(newTasks);
      setGenerationSummary({
        count: newTasks.length,
        tasks: taskTitles
      });
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Auto Task Management Engine</h2>
              <p className="text-xs text-zinc-500">Auto-schedule recurring statutory filings for clients with zero manual entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {generationSummary ? (
            <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950">
                  {generationSummary.count} Tasks Successfully Auto-Created!
                </h3>
                <p className="text-xs text-emerald-700 mt-1">
                  All statutory deadlines, subtasks, forms, and due dates have been scheduled on your Kanban board.
                </p>
              </div>
              <div className="max-h-48 overflow-y-auto bg-white rounded-lg p-3 border border-emerald-200 text-left text-xs text-zinc-700 space-y-1.5 font-mono">
                {generationSummary.tasks.map((taskName, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{taskName}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setGenerationSummary(null);
                  onClose();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Done & Return to Task Board
              </button>
            </div>
          ) : (
            <>
              {/* Client Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Target Clients
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedClientId('ALL')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      selectedClientId === 'ALL' 
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20' 
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <Users className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-zinc-900">All Active Clients ({clients.length})</div>
                      <div className="text-[11px] text-zinc-500">Auto-roll tasks for the whole firm database</div>
                    </div>
                  </button>

                  <div className="relative">
                    <select
                      value={selectedClientId === 'ALL' ? '' : selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value || 'ALL')}
                      className="w-full h-full p-3 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
                    >
                      <option value="">Or Select Single Client...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.entityType || c.type || 'Entity'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Target Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Filing Cycle / Month
                  </label>
                  <select
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-800 font-medium focus:ring-2 focus:ring-indigo-600/20"
                  >
                    <option value="September 2026">September 2026 (Due Oct 2026)</option>
                    <option value="October 2026">October 2026 (Due Nov 2026)</option>
                    <option value="November 2026">November 2026 (Due Dec 2026)</option>
                    <option value="Q2 FY 2026-27">Q2 FY 2026-27 (Quarterly TDS / Advance Tax)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Target Clients Count
                  </label>
                  <div className="px-3 py-2 text-xs rounded-lg bg-zinc-100 text-zinc-700 font-mono font-bold flex items-center justify-between">
                    <span>{targetClients.length} Entities</span>
                    <span className="text-zinc-500 font-normal">~{targetClients.length * 4} Estimated Tasks</span>
                  </div>
                </div>
              </div>

              {/* Statutory Categories to Generate */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Select Recurring Statutory Disciplines
                </label>
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={includeGst}
                        onChange={(e) => setIncludeGst(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-zinc-900">GST Monthly Returns (GSTR-1 & GSTR-3B)</div>
                        <div className="text-[11px] text-zinc-500">Auto-schedules GSTR-1 (11th) and GSTR-3B (20th) with 2B matching checklists</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">GST</span>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={includeTds}
                        onChange={(e) => setIncludeTds(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-zinc-900">TDS Monthly Challans (ITNS-281) & Returns</div>
                        <div className="text-[11px] text-zinc-500">Schedules 7th of every month Challan 281 deposits for TAN registered entities</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">TDS</span>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={includeAdvanceTax}
                        onChange={(e) => setIncludeAdvanceTax(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-zinc-900">Advance Tax Instalments (Section 208/211)</div>
                        <div className="text-[11px] text-zinc-500">Auto-schedules June 15, Sept 15, Dec 15, and March 15 estimation & payments</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Direct Tax</span>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={includeMca}
                        onChange={(e) => setIncludeMca(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-zinc-900">MCA / ROC Annual Filings (AOC-4, MGT-7, Form 8)</div>
                        <div className="text-[11px] text-zinc-500">Restricted to Private Limited, Public Limited & LLP entities with active CIN</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">ROC / MCA</span>
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={includeIncomeTax}
                        onChange={(e) => setIncludeIncomeTax(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-zinc-900">Income Tax Returns (ITR-5, ITR-6, Tax Audit 3CA/3CD)</div>
                        <div className="text-[11px] text-zinc-500">Creates corporate tax return prep and audit reconciliation workflows</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">ITR</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!generationSummary && (
          <div className="p-6 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Zero manual entry • Self-operating recurring engine</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-200/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGenerating || (!includeGst && !includeTds && !includeAdvanceTax && !includeMca && !includeIncomeTax)}
                onClick={generateStatutoryTasks}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/20"
              >
                {isGenerating ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    Generating Statutory Tasks...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Auto-Generate Tasks Now
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
