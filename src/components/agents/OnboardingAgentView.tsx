import React, { useState } from 'react';
import { 
  UserPlus, 
  FileText, 
  FolderTree, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Building,
  RefreshCw,
  Mail,
  Phone,
  FileSpreadsheet,
  Printer,
  Receipt,
  CheckSquare,
  MailCheck
} from 'lucide-react';
import { OnboardingAgentInput, OnboardingAgentResult, OnboardingEmailResult } from '../../types';
import { printEngagementLetter, downloadEngagementLetterPDF } from '../../utils/printAndPdfUtils';
import { OnboardingEmailModal } from '../onboarding/OnboardingEmailModal';
import { STANDARD_KYC_CHECKLIST, calculateInvoiceBreakdown } from '../../services/emailService';

export function OnboardingAgentView() {
  const [formData, setFormData] = useState<OnboardingAgentInput>({
    clientName: 'NexGen Cloud Technologies Pvt Ltd',
    entityType: 'Private Limited',
    contactEmail: 'director@nexgencloud.in',
    contactPhone: '+91 98450 12345',
    panNumber: 'AAACN9142K',
    gstin: '29AAACN9142K1Z5',
    cin: 'U72200KA2021PTC145890',
    turnoverRange: 'INR 15 Cr - 25 Cr',
    servicesRequested: [
      'Statutory Audit & Companies Act 2013 Compliance',
      'Monthly GST (GSTR-1 & GSTR-3B) & Annual GSTR-9/9C',
      'Quarterly TDS Statements (Form 24Q & 26Q)',
      'Corporate Direct Tax Assessment & Advance Tax Computation'
    ],
    rawTextNotes: 'Client is an enterprise SaaS export provider with SEZ unit registration in Bangalore. Wants seamless monthly auto-reconciliation and zero-touch statutory calendar setup.'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OnboardingAgentResult | null>(null);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [activeTab, setActiveTab] = useState<'letter' | 'checklist' | 'invoice' | 'workspace' | 'tasks' | 'trace'>('letter');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [lastEmailSentResult, setLastEmailSentResult] = useState<OnboardingEmailResult | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [creditsUsedInfo, setCreditsUsedInfo] = useState<{ deducted: number; balance: number } | null>(null);


  const availableServices = [
    'Statutory Audit & Companies Act 2013 Compliance',
    'Monthly GST (GSTR-1 & GSTR-3B) & Annual GSTR-9/9C',
    'Quarterly TDS Statements (Form 24Q & 26Q)',
    'Corporate Direct Tax Assessment & Advance Tax Computation',
    'Transfer Pricing Audit (Form 3CEB)',
    'Internal Financial Controls (IFC) Review',
    'Payroll Tax Compliance & Form 16 Generation'
  ];

  const toggleService = (srv: string) => {
    setFormData(prev => {
      const exists = prev.servicesRequested.includes(srv);
      return {
        ...prev,
        servicesRequested: exists 
          ? prev.servicesRequested.filter(s => s !== srv)
          : [...prev.servicesRequested, srv]
      };
    });
  };

  const handleRunAgent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/agent/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-soc2-jwt-token'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data: OnboardingAgentResult & { creditBalance?: number; creditsDeducted?: number } = await res.json();
        setResult(data);
        setCreditError(null);
        if (data.creditBalance !== undefined) {
          setCreditsUsedInfo({
            deducted: data.creditsDeducted ?? 5,
            balance: data.creditBalance
          });
          window.dispatchEvent(new CustomEvent('credits_updated', {
            detail: { creditBalance: data.creditBalance, creditsDeducted: data.creditsDeducted }
          }));
        }
        if (data.fallbackUsed) {
          window.dispatchEvent(new CustomEvent('ai_fallback', { detail: { message: 'Primary model unavailable. Defaulted to fallback model.' } }));
        }
      } else if (res.status === 402) {
        const errData = await res.json();
        setCreditError(errData.message || 'Insufficient credits to run onboarding agent.');
      } else {
        const errData = await res.json().catch(() => ({}));
        setCreditError(errData.message || 'Failed to execute onboarding agent.');
      }
    } catch (err) {
      console.error('Failed to run onboarding agent:', err);
      setCreditError('Network error executing autonomous onboarding agent.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLetter = () => {
    if (!result?.draftEngagementLetter.fullLetterMarkdown) return;
    navigator.clipboard.writeText(result.draftEngagementLetter.fullLetterMarkdown);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    const blob = new Blob([result.draftEngagementLetter.fullLetterMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ICAI_SA210_Engagement_${result.clientSummary.legalName.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-zinc-900 text-white p-6 rounded-2xl border border-indigo-850 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/20">
                Agentic Workflow 01
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Client Onboarding & Zero-Touch Engagement Agent</h2>
            <p className="text-xs text-indigo-200 mt-0.5 max-w-2xl">
              Autonomously extracts registry metadata, validates PAN & GSTIN formatting, provisions cloud vault directory structures, drafts ICAI SA-210 compliant Engagement Letters, and schedules statutory onboarding timelines.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={() => handleRunAgent()}
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                Running Agentic Pipeline...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Execute Zero-Touch Onboarding
              </>
            )}
          </button>
          <div className="flex items-center gap-2 text-[11px] text-indigo-200">
            <span className="bg-indigo-950/70 border border-indigo-750/70 px-2 py-0.5 rounded text-amber-300 font-mono font-bold">
              ⚡ 5 Credits
            </span>
            <span>Pre-checked & auto-deducted</span>
          </div>
        </div>
      </div>

      {/* Credit Alerts */}
      {creditError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{creditError}</span>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open_topup_modal'))}
            className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            + Top Up Credits
          </button>
        </div>
      )}

      {creditsUsedInfo && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Autonomous execution successful! Deducted <strong>{creditsUsedInfo.deducted} credits</strong>. Current balance: <strong>{creditsUsedInfo.balance.toLocaleString()} credits</strong>.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Configuration */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              Client Profile & Mandate Input
            </h3>
            <span className="text-[11px] text-zinc-400 font-medium">Tenant: firm_abc</span>
          </div>

          <form onSubmit={handleRunAgent} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Legal Entity Name</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Entity Constitution</label>
                <select
                  value={formData.entityType}
                  onChange={e => setFormData({ ...formData, entityType: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="Private Limited">Private Limited (Co)</option>
                  <option value="LLP">Limited Liability Partnership (LLP)</option>
                  <option value="Partnership">Partnership Firm</option>
                  <option value="Proprietorship">Sole Proprietorship</option>
                  <option value="Individual">Individual (HNI)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Turnover Range</label>
                <input
                  type="text"
                  value={formData.turnoverRange}
                  onChange={e => setFormData({ ...formData, turnoverRange: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Permanent Account No (PAN)</label>
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={e => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={formData.gstin || ''}
                  onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                Scope of Retainer Services ({formData.servicesRequested.length} selected)
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {availableServices.map((srv) => {
                  const isSelected = formData.servicesRequested.includes(srv);
                  return (
                    <div
                      key={srv}
                      onClick={() => toggleService(srv)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium cursor-pointer border transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <span className="truncate pr-2">{srv}</span>
                      {isSelected ? <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> : <div className="w-3.5 h-3.5 rounded border border-zinc-300 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Special Directives & Notes</label>
              <textarea
                rows={2}
                value={formData.rawTextNotes || ''}
                onChange={e => setFormData({ ...formData, rawTextNotes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                placeholder="E.g. Exemption status, special SEZ rules, billing preferences..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-bold rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Synthesizing SA-210 Contract & Vault...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Run Autonomous Onboarding Pipeline
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Execution Output & Artifacts */}
        <div className="lg:col-span-7 space-y-4">
          
          {result ? (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[550px]">
              
              {/* Top Action & Status Bar */}
              <div className="px-5 py-3 border-b border-zinc-200 bg-white flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-zinc-900 truncate">
                        {result.clientSummary.legalName}
                      </h4>
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        SA-210 Ready
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate font-mono">
                      Ref: {result.draftEngagementLetter.letterRefNumber}
                    </p>
                  </div>
                </div>

                {/* Right: Clean Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id="send-onboarding-package-btn"
                    onClick={() => setShowEmailModal(true)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 whitespace-nowrap"
                    title="Send Onboarding Documentation, Contract & Invoice via Gmail or Domain Email"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>Send Package (Gmail / Email)</span>
                  </button>

                  {/* Document Utilities Group */}
                  <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-200 shrink-0">
                    <button
                      onClick={() => {
                        if (!result) return;
                        downloadEngagementLetterPDF(
                          result.clientSummary.legalName,
                          result.draftEngagementLetter.letterRefNumber,
                          result.draftEngagementLetter.fullLetterMarkdown
                        );
                      }}
                      className="px-2.5 py-1 text-zinc-700 hover:bg-white hover:text-zinc-900 hover:shadow-xs rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Save Engagement Letter as PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-500" />
                      <span>PDF</span>
                    </button>

                    <div className="w-[1px] h-3.5 bg-zinc-200" />

                    <button
                      onClick={() => {
                        if (!result) return;
                        printEngagementLetter(
                          result.clientSummary.legalName,
                          result.draftEngagementLetter.letterRefNumber,
                          result.draftEngagementLetter.fullLetterMarkdown
                        );
                      }}
                      className="px-2.5 py-1 text-zinc-700 hover:bg-white hover:text-zinc-900 hover:shadow-xs rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Print Official Letter"
                    >
                      <Printer className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Print</span>
                    </button>

                    <div className="w-[1px] h-3.5 bg-zinc-200" />

                    <button
                      onClick={handleCopyLetter}
                      className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white hover:shadow-xs rounded-lg transition-colors"
                      title="Copy Markdown"
                    >
                      {copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={handleDownloadMarkdown}
                      className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-white hover:shadow-xs rounded-lg transition-colors"
                      title="Download Letter (.md)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Output Tabs Navigation Strip */}
              <div className="px-5 py-2 border-b border-zinc-200 bg-zinc-50/80 flex items-center gap-1.5 overflow-x-auto shrink-0">
                <button
                  onClick={() => setActiveTab('letter')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === 'letter' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-200/70'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  ICAI SA-210 Engagement Letter
                </button>
                <button
                  onClick={() => setActiveTab('checklist')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === 'checklist' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-200/70'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                  KYC Checklist ({STANDARD_KYC_CHECKLIST.length})
                </button>
                <button
                  onClick={() => setActiveTab('invoice')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === 'invoice' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-200/70'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5 shrink-0" />
                  Retainer Invoice
                </button>
                <button
                  onClick={() => setActiveTab('workspace')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === 'workspace' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-200/70'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5 shrink-0" />
                  Provisioned Vault
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-200/70'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  Statutory Tasks ({result.suggestedTasks.length})
                </button>
                <button
                  onClick={() => setActiveTab('trace')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    activeTab === 'trace' ? 'bg-indigo-600 text-white shadow-xs' : 'text-zinc-600 hover:bg-zinc-200/70'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  ADK Trace ({result.executionTrace.length} Steps)
                </button>
              </div>

              {/* Email Sent Banner if dispatched */}
              {lastEmailSentResult && (
                <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <MailCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Onboarding Package successfully dispatched to <strong>{lastEmailSentResult.recipient}</strong> via <strong>{lastEmailSentResult.method === 'gmail_api' ? 'Gmail API' : 'Domain Mail'}</strong>. Ref ID: <span className="font-mono">{lastEmailSentResult.messageId}</span>
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowEmailModal(true)} 
                    className="underline text-[11px] font-bold text-emerald-800 hover:text-emerald-950"
                  >
                    Resend / View Package
                  </button>
                </div>
              )}

              {/* Tab 1: Engagement Letter */}
              {activeTab === 'letter' && (
                <div className="p-6 overflow-y-auto flex-1 max-h-[500px] space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>ICAI SA-210 Compliant</strong> • Ref: <span className="font-mono">{result.draftEngagementLetter.letterRefNumber}</span> • Retainer: <strong>INR {result.draftEngagementLetter.annualRetainerFee.toLocaleString('en-IN')}/yr</strong>
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
                      Ready For Signature
                    </span>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-xs text-zinc-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {result.draftEngagementLetter.fullLetterMarkdown}
                  </div>
                </div>
              )}

              {/* Tab: KYC & Document Checklist */}
              {activeTab === 'checklist' && (
                <div className="p-6 overflow-y-auto flex-1 max-h-[500px] space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        <strong>Statutory Onboarding Requirements Checklist</strong> • {STANDARD_KYC_CHECKLIST.length} Verification Items mandated by ICAI & PMLA Guidelines.
                      </span>
                    </div>
                    <button
                      onClick={() => setShowEmailModal(true)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email Checklist
                    </button>
                  </div>

                  <div className="space-y-3">
                    {STANDARD_KYC_CHECKLIST.map((item) => (
                      <div key={item.id} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900">{item.title}</span>
                            {item.mandatory && (
                              <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                Mandatory
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-200/60 px-1.5 py-0.5 rounded">
                              {item.category}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-zinc-500">Formats: {item.acceptedFormats}</span>
                        </div>
                        <p className="text-[11px] text-zinc-600">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Retainer Tax Invoice */}
              {activeTab === 'invoice' && (
                <div className="p-6 overflow-y-auto flex-1 max-h-[500px] space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Initial Retainer Tax Invoice (Pro-Forma)</strong> • SAC 9982 (Statutory Audit & Tax Compliance Services)
                      </span>
                    </div>
                    <button
                      onClick={() => setShowEmailModal(true)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" /> Send via Email
                    </button>
                  </div>

                  {(() => {
                    const advance = Math.round(result.draftEngagementLetter.annualRetainerFee / 4);
                    const breakdown = calculateInvoiceBreakdown(advance);
                    return (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-5">
                        {/* Invoice Header */}
                        <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
                          <div>
                            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Aarav Advisors</span>
                            <h3 className="text-base font-bold text-zinc-900">Chartered Accountants</h3>
                            <p className="text-xs text-zinc-500">FRN: 014892N | GSTIN: 07AAACA1234F1Z8</p>
                            <p className="text-xs text-zinc-500">Connaught Place, New Delhi - 110001</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-zinc-500 block">TAX INVOICE</span>
                            <span className="text-xs font-mono font-bold text-zinc-800">INV/2026-27/0412</span>
                            <span className="text-xs text-zinc-500 block mt-1">Date: {new Date().toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Bill To */}
                        <div className="text-xs space-y-1">
                          <span className="text-zinc-500 font-semibold block uppercase text-[10px]">Billed To:</span>
                          <strong className="text-zinc-900 text-sm">{result.clientSummary.legalName}</strong>
                          <div className="text-zinc-600">
                            PAN: <span className="font-mono">{result.clientSummary.pan}</span> | GSTIN: <span className="font-mono">{result.clientSummary.gstin || 'Unregistered'}</span>
                          </div>
                        </div>

                        {/* Table */}
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-200 text-zinc-500 font-semibold">
                              <th className="py-2">Description</th>
                              <th className="py-2">SAC Code</th>
                              <th className="py-2 text-right">Amount (INR)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            <tr>
                              <td className="py-2.5 text-zinc-800">
                                Professional Retainer (Quarterly Advance) for Statutory Audit & Regulatory Compliance
                              </td>
                              <td className="py-2.5 text-zinc-600 font-mono">9982</td>
                              <td className="py-2.5 text-right font-mono font-bold text-zinc-800">
                                ₹{breakdown.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={2} className="py-2 text-right text-zinc-500">CGST @ 9.00%</td>
                              <td className="py-2 text-right font-mono text-zinc-700">₹{breakdown.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td colSpan={2} className="py-2 text-right text-zinc-500">SGST @ 9.00%</td>
                              <td className="py-2 text-right font-mono text-zinc-700">₹{breakdown.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="font-bold border-t border-zinc-300">
                              <td colSpan={2} className="py-2.5 text-right text-zinc-900">Total Payable Amount</td>
                              <td className="py-2.5 text-right font-mono text-indigo-700 text-sm">
                                ₹{breakdown.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Payment Details */}
                        <div className="bg-white p-4 rounded-xl border border-zinc-200 text-xs space-y-1">
                          <span className="font-bold text-zinc-900 block">Bank Remittance Instructions (RTGS / NEFT):</span>
                          <p className="text-zinc-600">Account Name: Aarav Advisors | Bank: HDFC Bank Ltd</p>
                          <p className="text-zinc-600">A/C No: 50200041892104 | IFSC: HDFC0000003</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab 2: Provisioned Workspace Vault */}
              {activeTab === 'workspace' && (
                <div className="p-6 space-y-4">
                  <div className="text-xs text-zinc-600">
                    The agent has automatically provisioned <strong>4 encrypted vault directories</strong> with tenant-level isolation for <strong>{result.clientSummary.legalName}</strong>:
                  </div>

                  <div className="space-y-2">
                    {result.provisionedFolders.map((f, i) => (
                      <div key={i} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 text-zinc-800">
                          <FolderTree className="w-4 h-4 text-indigo-600" />
                          <span>{f}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          AES-256 Encrypted
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <p className="font-bold">SOC2 Row-Level Security Rules Applied</p>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        Access is restricted strictly to assigned Engagement Partners and Articles under tenant firm_abc.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Tasks */}
              {activeTab === 'tasks' && (
                <div className="p-6 space-y-3">
                  <p className="text-xs text-zinc-600">
                    Automated calendar engine generated the following initial tasks for client kickoff:
                  </p>

                  <div className="space-y-2">
                    {result.suggestedTasks.map((t, idx) => (
                      <div key={idx} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900">{t.title}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              t.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {t.priority}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Due Date: <strong className="text-zinc-700">{t.dueDate}</strong> • Assigned Role: <strong className="uppercase text-indigo-600">{t.assigneeRole}</strong>
                          </div>
                        </div>

                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enqueued
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Execution Trace */}
              {activeTab === 'trace' && (
                <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
                  <div className="text-xs text-zinc-500 mb-2">
                    Google ADK Agent Execution Graph & Audit Trail:
                  </div>

                  <div className="space-y-3">
                    {result.executionTrace.map((trace, idx) => (
                      <div key={trace.id} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-zinc-900">{trace.stepName}</span>
                          </div>
                          <span className="font-mono text-[10px] text-zinc-400">{trace.latencyMs}ms</span>
                        </div>

                        <div className="text-[11px] text-zinc-600 pl-7">
                          {trace.details}
                        </div>

                        {trace.outputSummary && (
                          <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded ml-7 border border-emerald-200 flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-emerald-600" />
                            {trace.outputSummary}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center h-full min-h-[550px] flex flex-col items-center justify-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <UserPlus className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Zero-Touch Onboarding Agent Ready</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md">
                Configure the client entity details on the left and trigger the agent. The AI Agent Engine will synthesize an ICAI SA-210 contract, validate PAN/GSTIN, and establish filing schedules.
              </p>
              <button
                onClick={() => handleRunAgent()}
                className="mt-5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Run Default Sample Client (NexGen Cloud)
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Onboarding Email Modal */}
      {result && (
        <OnboardingEmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          clientData={{
            clientName: result.clientSummary.legalName,
            contactEmail: formData.contactEmail,
            contactPhone: formData.contactPhone,
            panNumber: result.clientSummary.pan,
            gstin: result.clientSummary.gstin,
            entityType: formData.entityType,
            letterRefNumber: result.draftEngagementLetter.letterRefNumber,
            engagementLetterMarkdown: result.draftEngagementLetter.fullLetterMarkdown,
            annualRetainerFee: result.draftEngagementLetter.annualRetainerFee,
            servicesRequested: formData.servicesRequested,
          }}
          onSentSuccess={(res) => {
            setLastEmailSentResult(res);
          }}
        />
      )}

    </div>
  );
}
