import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Send, 
  RefreshCw, 
  Building, 
  Mail, 
  ShieldAlert, 
  Layers,
  ArrowRight,
  TrendingDown,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { GstBankReconInput, GstBankReconResult, ReconMismatchItem } from '../../types';

export function GstBankReconAgentView() {
  const [formData, setFormData] = useState<GstBankReconInput>({
    clientName: 'Apex Precision Engineering Pvt Ltd',
    clientGstin: '27AABCA4412L1Z9',
    reconPeriod: 'August 2026',
    materialityThresholdInr: 500
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GstBankReconResult | null>(null);
  const [activeTab, setActiveTab] = useState<'mismatches' | 'dunning' | 'jv' | 'trace'>('mismatches');
  const [selectedItem, setSelectedItem] = useState<ReconMismatchItem | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [creditsUsedInfo, setCreditsUsedInfo] = useState<{ deducted: number; balance: number } | null>(null);

  const handleRunAgent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setResult(null);
    setSelectedItem(null);

    try {
      const res = await fetch('/api/agent/gst-recon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-soc2-jwt-token'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data: GstBankReconResult & { creditBalance?: number; creditsDeducted?: number } = await res.json();
        setResult(data);
        setCreditError(null);
        if (data.creditBalance !== undefined) {
          setCreditsUsedInfo({
            deducted: data.creditsDeducted ?? 12,
            balance: data.creditBalance
          });
          window.dispatchEvent(new CustomEvent('credits_updated', {
            detail: { creditBalance: data.creditBalance, creditsDeducted: data.creditsDeducted }
          }));
        }
        if (data.fallbackUsed) {
          window.dispatchEvent(new CustomEvent('ai_fallback', { detail: { message: 'Primary model unavailable. Defaulted to fallback model.' } }));
        }
        if (data.items.length > 0) {
          setSelectedItem(data.items[1]); // Default to a mismatch item
        }
      } else if (res.status === 402) {
        const errData = await res.json();
        setCreditError(errData.message || 'Insufficient credits to run GST & Bank Recon agent.');
      } else {
        const errData = await res.json().catch(() => ({}));
        setCreditError(errData.message || 'Failed to execute GST & Bank Recon agent.');
      }
    } catch (err) {
      console.error('Failed to run GST Bank Recon agent:', err);
      setCreditError('Network error executing autonomous GST & Bank Recon agent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-950 text-white p-6 rounded-2xl border border-emerald-900/40 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/20">
                Agentic Workflow 03
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Autonomous GST & Bank Reconciliation Agent</h2>
            <p className="text-xs text-emerald-200/90 mt-0.5 max-w-2xl">
              Triangulates ERP Purchase Registers against GSTR-2B Portal JSON and Bank Account Statement debits. Flags Rule 36(4) at-risk ITC, creates adjustment Journal Vouchers, and prepares statutory vendor dunning batches.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={() => handleRunAgent()}
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-400 text-zinc-950 hover:bg-emerald-300 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                Triangulating 2B, Books & Bank...
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-4 h-4 text-zinc-950" />
                Run Triangulation Agent
              </>
            )}
          </button>
          <div className="flex items-center gap-2 text-[11px] text-emerald-200">
            <span className="bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.5 rounded text-emerald-300 font-mono font-bold">
              ⚡ 12 Credits
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
              Autonomous triangulation successful! Deducted <strong>{creditsUsedInfo.deducted} credits</strong>. Current balance: <strong>{creditsUsedInfo.balance.toLocaleString()} credits</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Parameters */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              Reconciliation Ingestion
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Triangulation
            </span>
          </div>

          <form onSubmit={handleRunAgent} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Target Enterprise Client</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Client GSTIN</label>
              <input
                type="text"
                value={formData.clientGstin}
                onChange={e => setFormData({ ...formData, clientGstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Tax Period</label>
                <input
                  type="text"
                  value={formData.reconPeriod}
                  onChange={e => setFormData({ ...formData, reconPeriod: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Tolerance (INR)</label>
                <input
                  type="number"
                  value={formData.materialityThresholdInr || 500}
                  onChange={e => setFormData({ ...formData, materialityThresholdInr: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] space-y-1">
                <div className="flex items-center justify-between font-semibold text-zinc-700">
                  <span>1. Purchase Register CSV (ERP)</span>
                  <span className="text-emerald-600">Attached (24 rows)</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-zinc-700">
                  <span>2. GSTR-2B Statement (GSTN Portal)</span>
                  <span className="text-emerald-600">Connected (Auto-Sync)</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-zinc-700">
                  <span>3. HDFC Bank Current A/c Statement</span>
                  <span className="text-emerald-600">Matched via Open Banking</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-bold rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Triangulating Portals & Generating Dunning...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Execute Autonomous Reconciliation
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Reconciliation Results */}
        <div className="lg:col-span-8 space-y-4">
          
          {result ? (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[550px]">
              
              {/* Summary Metrics Bar */}
              <div className="p-4 bg-zinc-900 text-white grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-zinc-800">
                <div className="bg-zinc-800/80 p-3 rounded-xl border border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-medium block">Total Book ITC</span>
                  <span className="text-base font-bold text-white">INR {result.summaryMetrics.totalBookItc.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-zinc-800/80 p-3 rounded-xl border border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-medium block">Portal GSTR-2B ITC</span>
                  <span className="text-base font-bold text-emerald-400">INR {result.summaryMetrics.totalPortal2bItc.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-zinc-800/80 p-3 rounded-xl border border-zinc-700">
                  <span className="text-[10px] text-zinc-400 font-medium block">Matched & Safe Claim</span>
                  <span className="text-base font-bold text-indigo-400">INR {result.summaryMetrics.matchedItcEligible.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-rose-950/60 p-3 rounded-xl border border-rose-800">
                  <span className="text-[10px] text-rose-300 font-medium block">At-Risk Blocked ITC</span>
                  <span className="text-base font-bold text-rose-400">INR {result.summaryMetrics.atRiskItcBlocked.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="px-6 py-2.5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('mismatches')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'mismatches' ? 'bg-emerald-700 text-white' : 'text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Triangulated Ledger Items ({result.items.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('dunning')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'dunning' ? 'bg-emerald-700 text-white' : 'text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Vendor Dunning Notices ({result.vendorDunningBatch.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('jv')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'jv' ? 'bg-emerald-700 text-white' : 'text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    ERP Journal Vouchers
                  </button>
                  <button
                    onClick={() => setActiveTab('trace')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'trace' ? 'bg-emerald-700 text-white' : 'text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    ADK Trace
                  </button>
                </div>
              </div>

              {/* Tab 1: Line Item Mismatch Ledger */}
              {activeTab === 'mismatches' && (
                <div className="p-6 overflow-y-auto max-h-[500px] space-y-3">
                  <div className="text-xs text-zinc-600 flex items-center justify-between">
                    <span>Click any row to inspect triangulation variance:</span>
                    <span className="text-[11px] font-semibold text-indigo-700">
                      Match Rate: {result.summaryMetrics.reconciliationMatchRatePct}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    {result.items.map((item) => {
                      const isMismatch = item.mismatchType !== 'EXACT_MATCH';
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            selectedItem?.id === item.id 
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-sm' 
                              : 'border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900">{item.supplierName}</span>
                              <span className="font-mono text-[10px] text-zinc-500">({item.supplierGstin})</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              item.mismatchType === 'EXACT_MATCH'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.mismatchType === 'MISSING_IN_2B'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.mismatchType.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-zinc-200/60 text-[11px]">
                            <div>
                              <span className="text-zinc-400 block text-[10px]">Invoice No</span>
                              <span className="font-mono font-medium text-zinc-800">{item.invoiceNumber}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block text-[10px]">Books ITC</span>
                              <span className="font-semibold text-zinc-900">INR {item.taxAmountInBooks.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block text-[10px]">2B Portal ITC</span>
                              <span className="font-semibold text-zinc-900">INR {item.taxAmountInGstr2b.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 block text-[10px]">Bank Debits</span>
                              <span className={`font-semibold ${item.bankMatchStatus === 'MATCHED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {item.bankMatchStatus}
                              </span>
                            </div>
                          </div>

                          {item.suggestedVendorNotice && (
                            <div className="mt-2 text-[11px] text-rose-900 bg-rose-50/80 p-2 rounded border border-rose-200 flex items-center justify-between">
                              <span className="truncate pr-2">Action: <strong>{item.agentActionRecommendation}</strong> — {item.suggestedVendorNotice}</span>
                              <span className="text-[10px] uppercase font-bold text-rose-700 shrink-0">Dunning Queued</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Vendor Dunning Batch */}
              {activeTab === 'dunning' && (
                <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                  <p className="text-xs text-zinc-600">
                    Autonomous statutory dunning notices generated for delinquent suppliers:
                  </p>

                  <div className="space-y-4">
                    {result.vendorDunningBatch.map((batch, idx) => (
                      <div key={idx} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                          <div>
                            <span className="font-bold text-zinc-900 text-sm">{batch.vendorName}</span>
                            <span className="text-[11px] text-zinc-500 block">Recipient: {batch.vendorEmail}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                              Blocked ITC: INR {batch.totalAtRiskItc.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-zinc-200 text-zinc-800 text-[11px] whitespace-pre-wrap leading-relaxed font-sans">
                          {batch.emailBodyMarkdown}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(batch.emailBodyMarkdown);
                              alert('Notice copied to clipboard!');
                            }}
                            className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Email Body
                          </button>
                          <button
                            onClick={() => alert(`Statutory email dispatched to ${batch.vendorEmail} via SendGrid/SMTP relay.`)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" /> Dispatch Dunning Notice
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Journal Vouchers */}
              {activeTab === 'jv' && (
                <div className="p-6 space-y-4">
                  <p className="text-xs text-zinc-600">
                    Automated Journal Voucher adjustment entries synthesized for Tally/Zoho Books/SAP:
                  </p>

                  <div className="space-y-2">
                    {result.automatedJournalVoucherProposals.map((jv, idx) => (
                      <div key={idx} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-zinc-900">{jv.accountHead}</div>
                          <div className="text-[11px] text-zinc-500 italic">{jv.narration}</div>
                        </div>
                        <div className="text-right font-mono">
                          {jv.debitAmount > 0 && (
                            <span className="text-indigo-700 font-bold">Dr: INR {jv.debitAmount.toLocaleString('en-IN')}</span>
                          )}
                          {jv.creditAmount > 0 && (
                            <span className="text-emerald-700 font-bold">Cr: INR {jv.creditAmount.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
                    <span>Push entries directly to ERP General Ledger via OAuth connector:</span>
                    <button
                      onClick={() => alert('Journal Vouchers synced with ERP General Ledger successfully.')}
                      className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg text-xs hover:bg-emerald-800 transition-colors"
                    >
                      Post to Accounting Engine
                    </button>
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
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Autonomous GST & Bank Reconciliation Agent</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md">
                Triangulates GSTR-2B against books of accounts and bank statement records, identifying ineligible ITC and drafting automated vendor dunning letters.
              </p>
              <button
                onClick={() => handleRunAgent()}
                className="mt-5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Run August 2026 Sample Triangulation
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
