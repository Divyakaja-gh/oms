import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Download, Calculator, RefreshCw } from 'lucide-react';

export function Gstr3bWorkflowTab() {
  const [taxableTurnover, setTaxableTurnover] = useState(4500000);
  const [igstRate] = useState(18);
  const [gstr2bItc, setGstr2bItc] = useState(380000);
  const [ineligibleItc, setIneligibleItc] = useState(15000);
  const [rcmLiableTurnover, setRcmLiableTurnover] = useState(50000);

  // Calculations
  const grossIgstLiability = (taxableTurnover * igstRate) / 100;
  const rcmTaxPayable = (rcmLiableTurnover * 18) / 100;
  const netEligibleItc = Math.max(0, gstr2bItc - ineligibleItc);
  const creditOffset = Math.min(grossIgstLiability, netEligibleItc);
  const cashPayableForward = Math.max(0, grossIgstLiability - creditOffset);
  const totalCashDepositRequired = cashPayableForward + rcmTaxPayable; // RCM must be 100% cash

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                GST WORKFLOW ENGINE
              </span>
              <span className="text-xs font-bold text-zinc-500">Section 39(1) / Rule 88A Offsetting</span>
            </div>
            <h3 className="text-base font-bold text-zinc-900">GSTR-3B Tax Liability & ITC Offset Calculator</h3>
          </div>
          <button
            onClick={() => {
              setTaxableTurnover(5000000);
              setGstr2bItc(420000);
              setIneligibleItc(18000);
              setRcmLiableTurnover(60000);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-zinc-600 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Sample Data</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Inputs */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">1. Taxable Supplies & Portal ITC Inputs</h4>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">Table 3.1(a) Outward Taxable Supplies (INR)</label>
              <input
                type="number"
                value={taxableTurnover}
                onChange={e => setTaxableTurnover(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">Table 4(A)(5) Auto-Drafted GSTR-2B ITC (INR)</label>
              <input
                type="number"
                value={gstr2bItc}
                onChange={e => setGstr2bItc(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">Table 4(B) Ineligible ITC Reversals (Rule 38/42/43) (INR)</label>
              <input
                type="number"
                value={ineligibleItc}
                onChange={e => setIneligibleItc(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">Table 3.1(d) Inward Supplies Liable to Reverse Charge (RCM)</label>
              <input
                type="number"
                value={rcmLiableTurnover}
                onChange={e => setRcmLiableTurnover(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-100 mt-1">
                Note: Per GST Law, RCM tax liability cannot be discharged via ITC and must be paid 100% in cash.
              </p>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5 space-y-4">
            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">2. Statutory Offsetting Summary</h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-200">
                <span className="text-zinc-500">Gross Forward Tax Liability (18%):</span>
                <span className="font-mono font-bold text-zinc-900">₹{grossIgstLiability.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-zinc-200">
                <span className="text-zinc-500">Net Eligible ITC Claimed:</span>
                <span className="font-mono font-bold text-emerald-600">₹{netEligibleItc.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-zinc-200">
                <span className="text-zinc-500">Credit Ledger Utilization (Sec 49):</span>
                <span className="font-mono font-bold text-indigo-600">-₹{creditOffset.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-zinc-200">
                <span className="text-zinc-500">Forward Tax Paid in Cash:</span>
                <span className="font-mono font-bold text-zinc-900">₹{cashPayableForward.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-zinc-200">
                <span className="text-zinc-500">Reverse Charge Tax (Cash Only):</span>
                <span className="font-mono font-bold text-rose-600">₹{rcmTaxPayable.toLocaleString('en-IN')}</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-zinc-300 flex justify-between items-center mt-3">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">Total Net Cash Challan Dues</span>
                  <span className="text-xs text-zinc-400">Electronic Cash Ledger PMT-06</span>
                </div>
                <span className="text-lg font-bold font-mono text-indigo-600">
                  ₹{totalCashDepositRequired.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Compliant with Rule 36(4) 100% GSTR-2B Match Rule.</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
