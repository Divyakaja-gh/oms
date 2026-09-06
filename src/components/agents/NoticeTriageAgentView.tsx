import React, { useState } from 'react';
import { 
  FileText, 
  Scale, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  BookOpen, 
  Send, 
  RefreshCw,
  CheckCircle2,
  Calendar,
  Building,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { NoticeTriageInput, NoticeTriageResult } from '../../types';

export function NoticeTriageAgentView() {
  const [formData, setFormData] = useState<NoticeTriageInput>({
    noticeNumber: 'ITD/AST/2026-27/148A/908124',
    issuingAuthority: 'Income Tax Department (CPC / Faceless AO)',
    sectionCode: 'Section 148A(b) of Income Tax Act, 1961',
    financialYearOrPeriod: 'AY 2023-24 (FY 2022-23)',
    demandAmountInr: 1450000,
    noticeDate: '2026-08-28',
    statutoryDeadline: '2026-09-12',
    clientPanOrGst: 'AAACA5512P',
    clientName: 'Acme Global Ventures LLP',
    rawNoticeContent: `Sub: Notice under Section 148A(b) of the Income-tax Act, 1961 - Inquiry on alleged income escaping assessment.
Whereas information is flagged in the Insight portal indicating that during FY 2022-23 the assessee received unexplained credits amounting to INR 14,50,000 from M/s Radiant Holdings. The assessee is requested to show cause within 14 days why a notice under Section 148 should not be issued.`,
    penaltySectionCited: 'Section 270A (Under-reporting of Income)'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NoticeTriageResult | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [activeTab, setActiveTab] = useState<'reply' | 'precedents' | 'checklist' | 'trace'>('reply');
  const [creditError, setCreditError] = useState<string | null>(null);
  const [creditsUsedInfo, setCreditsUsedInfo] = useState<{ deducted: number; balance: number } | null>(null);

  const handleRunAgent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/agent/notice-triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-soc2-jwt-token'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data: NoticeTriageResult & { creditBalance?: number; creditsDeducted?: number } = await res.json();
        setResult(data);
        setCreditError(null);
        if (data.creditBalance !== undefined) {
          setCreditsUsedInfo({
            deducted: data.creditsDeducted ?? 8,
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
        setCreditError(errData.message || 'Insufficient credits to run Notice Triage agent.');
      } else {
        const errData = await res.json().catch(() => ({}));
        setCreditError(errData.message || 'Failed to execute notice triage agent.');
      }
    } catch (err) {
      console.error('Failed to run notice triage agent:', err);
      setCreditError('Network error executing autonomous notice triage agent.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDraft = () => {
    if (!result?.draftDefenceReplyMarkdown) return;
    navigator.clipboard.writeText(result.draftDefenceReplyMarkdown);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    const blob = new Blob([result.draftDefenceReplyMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Defence_Reply_${result.id}_${formData.clientName.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-zinc-900 to-zinc-950 text-white p-6 rounded-2xl border border-amber-900/40 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded border border-amber-400/20">
                Agentic Workflow 02
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Statutory Notice Triage & Defence Draft Agent</h2>
            <p className="text-xs text-amber-200/90 mt-0.5 max-w-2xl">
              Triages faceless ITD (Sec 148A/143(2)) & GST (ASMT-10/DRC-01) notices, performs statutory limitation checks, cites high-authority Supreme Court/High Court case laws, and generates formal written legal submissions.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={() => handleRunAgent()}
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                Synthesizing Defence & Case Laws...
              </>
            ) : (
              <>
                <Scale className="w-4 h-4 text-zinc-950" />
                Triage Notice & Draft Defence
              </>
            )}
          </button>
          <div className="flex items-center gap-2 text-[11px] text-amber-200">
            <span className="bg-amber-950/70 border border-amber-700/60 px-2 py-0.5 rounded text-amber-300 font-mono font-bold">
              ⚡ 8 Credits
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
              Autonomous triage completed! Deducted <strong>{creditsUsedInfo.deducted} credits</strong>. Current balance: <strong>{creditsUsedInfo.balance.toLocaleString()} credits</strong>.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Notice Ingestion Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Statutory Notice Metadata & Body
            </h3>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              Direct Tax / GST
            </span>
          </div>

          <form onSubmit={handleRunAgent} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Target Client Name</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Issuing Authority</label>
                <select
                  value={formData.issuingAuthority}
                  onChange={e => setFormData({ ...formData, issuingAuthority: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                >
                  <option value="Income Tax Department (CPC / Faceless AO)">Income Tax (Faceless AO / CPC)</option>
                  <option value="GST Department (State / DGGI)">GST Department (State / DGGI)</option>
                  <option value="MCA / ROC">MCA / Registrar of Companies</option>
                  <option value="Customs / FEMA">Customs & FEMA Authority</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Notice DIN / Ref Number</label>
                <input
                  type="text"
                  value={formData.noticeNumber}
                  onChange={e => setFormData({ ...formData, noticeNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Statutory Section Code</label>
                <input
                  type="text"
                  value={formData.sectionCode}
                  onChange={e => setFormData({ ...formData, sectionCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Tax Period / AY</label>
                <input
                  type="text"
                  value={formData.financialYearOrPeriod}
                  onChange={e => setFormData({ ...formData, financialYearOrPeriod: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Demand / Amount</label>
                <input
                  type="number"
                  value={formData.demandAmountInr || ''}
                  onChange={e => setFormData({ ...formData, demandAmountInr: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Notice Date</label>
                <input
                  type="date"
                  value={formData.noticeDate}
                  onChange={e => setFormData({ ...formData, noticeDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-rose-700 block mb-1 font-bold">Hard Deadline</label>
                <input
                  type="date"
                  value={formData.statutoryDeadline}
                  onChange={e => setFormData({ ...formData, statutoryDeadline: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-rose-50 border border-rose-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-600 font-bold text-rose-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Full Statutory Notice Text / Allegations</label>
              <textarea
                rows={4}
                value={formData.rawNoticeContent}
                onChange={e => setFormData({ ...formData, rawNoticeContent: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-600 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-bold rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating Legal Precedents & Draft...
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  Run Autonomous Notice Triage
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: AI Defence Output */}
        <div className="lg:col-span-7 space-y-4">
          
          {result ? (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[550px]">
              
              {/* Header metrics */}
              <div className="px-6 py-3.5 border-b border-zinc-200 bg-zinc-50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border flex items-center gap-1 ${
                    result.riskLevel === 'CRITICAL' 
                      ? 'bg-rose-100 text-rose-800 border-rose-200' 
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    <AlertTriangle className="w-3 h-3" /> Risk: {result.riskLevel}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-800">
                    Category: <span className="text-indigo-700">{result.classifiedCategory}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right text-[11px]">
                    <span className="text-zinc-500">Statutory Clock: </span>
                    <strong className="text-rose-700">{result.statutoryTimelineSummary.daysRemaining} days remaining</strong>
                  </div>
                  <button
                    onClick={handleCopyDraft}
                    className="p-1.5 text-zinc-600 hover:text-zinc-900 rounded-full hover:bg-zinc-200 transition-colors"
                    title="Copy Draft"
                  >
                    {copiedDraft ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleDownloadMarkdown}
                    className="p-1.5 text-zinc-600 hover:text-zinc-900 rounded-full hover:bg-zinc-200 transition-colors"
                    title="Download Written Submission (.md)"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Output Sub-Tabs */}
              <div className="px-6 py-2 border-b border-zinc-100 bg-white flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('reply')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'reply' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Written Submission Draft
                </button>
                <button
                  onClick={() => setActiveTab('precedents')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'precedents' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Binding Jurisprudence ({result.statutoryPrecedents.length})
                </button>
                <button
                  onClick={() => setActiveTab('checklist')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'checklist' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Evidence Checklist
                </button>
                <button
                  onClick={() => setActiveTab('trace')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'trace' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  ADK Trace
                </button>
              </div>

              {/* Tab 1: Defence Reply Draft */}
              {activeTab === 'reply' && (
                <div className="p-6 overflow-y-auto flex-1 max-h-[500px] space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      Assigned Strategy: {result.taxPositionDefenceStrategy.primaryGround}
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Alternative ground reserved: {result.taxPositionDefenceStrategy.alternativeGround}
                    </p>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-xs text-zinc-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {result.draftDefenceReplyMarkdown}
                  </div>
                </div>
              )}

              {/* Tab 2: Precedents */}
              {activeTab === 'precedents' && (
                <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
                  <p className="text-xs text-zinc-600">
                    Precedents extracted and cited in support of assessee's position:
                  </p>

                  <div className="space-y-3">
                    {result.statutoryPrecedents.map((prec, idx) => (
                      <div key={idx} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-900 text-sm">{prec.citation}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {prec.applicabilityRating}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-zinc-600">
                          Forum: {prec.courtOrTribunal}
                        </div>
                        <p className="text-xs text-zinc-800 italic bg-white p-2.5 rounded border border-zinc-200">
                          "{prec.caseRatio}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Checklist */}
              {activeTab === 'checklist' && (
                <div className="p-6 space-y-3">
                  <p className="text-xs text-zinc-600">
                    Mandatory evidence and reconciliation exhibits required to annex with the submission:
                  </p>

                  <div className="space-y-2">
                    {result.requiredEvidenceChecklist.map((ev, idx) => (
                      <div key={idx} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">{ev.item}</span>
                          {ev.mandatory && (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded uppercase">
                              Mandatory
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                          ev.collected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ev.collected ? 'Verified in Vault' : 'Pending From Client'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Trace */}
              {activeTab === 'trace' && (
                <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
                  {result.executionTrace.map((trace, idx) => (
                    <div key={trace.id} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900">{idx + 1}. {trace.stepName}</span>
                        <span className="font-mono text-[10px] text-zinc-400">{trace.latencyMs}ms</span>
                      </div>
                      <p className="text-[11px] text-zinc-600">{trace.details}</p>
                      {trace.outputSummary && (
                        <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {trace.outputSummary}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center h-full min-h-[550px] flex flex-col items-center justify-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <Scale className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Notice Triage & Defence Agent Ready</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md">
                Load a statutory notice on the left and execute the agent. The AI Agent Engine will analyze jurisdiction, search precedent rulings, and draft a high-impact written submission.
              </p>
              <button
                onClick={() => handleRunAgent()}
                className="mt-5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Run Default Section 148A Notice Test
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
