import React, { useState } from 'react';
import { Calculator, CheckSquare, UploadCloud, FileText, Send, Download, CheckCircle2, Building, Home, Briefcase, Landmark, ShieldCheck } from 'lucide-react';

export function IncomeTaxComputationTab() {
  const [activeStep, setActiveStep] = useState(1);
  const [income, setIncome] = useState({
    salary: 0,
    houseProperty: 0,
    business: 0,
    capitalGains: 0,
    otherSources: 0
  });
  const [advanceTax, setAdvanceTax] = useState(0);
  const [tdsClaimed, setTdsClaimed] = useState(0);
  
  // Tax calculations
  const grossTotalIncome = income.salary + income.houseProperty + income.business + income.capitalGains + income.otherSources;
  const standardDeduction = income.salary > 0 ? Math.min(income.salary, 75000) : 0; // New regime standard deduction
  const netIncome = Math.max(0, grossTotalIncome - standardDeduction);

  const calcNewRegimeTax = (netInc: number) => {
    if (netInc <= 700000) return 0; // Rebate 87A up to 7L
    let tax = 0;
    if (netInc > 1500000) {
      tax += (netInc - 1500000) * 0.30;
      tax += 300000 * 0.20;
      tax += 300000 * 0.15;
      tax += 300000 * 0.10;
      tax += 300000 * 0.05;
    } else if (netInc > 1200000) {
      tax += (netInc - 1200000) * 0.20;
      tax += 300000 * 0.15;
      tax += 300000 * 0.10;
      tax += 300000 * 0.05;
    } else if (netInc > 900000) {
      tax += (netInc - 900000) * 0.15;
      tax += 300000 * 0.10;
      tax += 300000 * 0.05;
    } else if (netInc > 600000) {
      tax += (netInc - 600000) * 0.10;
      tax += 300000 * 0.05;
    } else if (netInc > 300000) {
      tax += (netInc - 300000) * 0.05;
    }
    const cess = tax * 0.04;
    return tax + cess;
  };

  const taxLiability = calcNewRegimeTax(netIncome);
  const netPayable = taxLiability - advanceTax - tdsClaimed;

  // Form selection logic
  let recommendedForm = 'ITR-1 (Sahaj)';
  if (income.business > 0) recommendedForm = 'ITR-3 or ITR-4 (Sugam)';
  else if (income.capitalGains > 0) recommendedForm = 'ITR-2';
  else if (grossTotalIncome > 5000000) recommendedForm = 'ITR-2';

  return (
    <div className="space-y-6 flex flex-col md:flex-row gap-6">
      {/* SOP Checklist / Stepper Sidebar */}
      <div className="w-full md:w-1/3 shrink-0 bg-white border border-zinc-200 rounded-xl p-5 shadow-sm h-fit">
        <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-indigo-600" />
          ITR Filing SOP Checklist
        </h3>
        
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent">
          {[
            { step: 1, title: 'Data Collection', desc: 'Request Form 16, Bank statements, etc.' },
            { step: 2, title: 'Income Computation', desc: 'Enter income under 5 heads.' },
            { step: 3, title: 'Tax Computation', desc: 'Auto-calculate tax & 87A rebate.' },
            { step: 4, title: 'Form Selection', desc: 'System recommends correct ITR.' },
            { step: 5, title: 'Review & Approval', desc: 'Client approves computation.' },
            { step: 6, title: 'Filing (Export/Upload)', desc: 'Generate JSON & fetch ITR-V.' },
            { step: 7, title: 'Documentation', desc: 'Save to Vault & Client Folder.' }
          ].map((s) => (
            <div 
              key={s.step} 
              onClick={() => setActiveStep(s.step)}
              className={`relative flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors ${activeStep === s.step ? 'bg-indigo-50/50' : 'hover:bg-zinc-50'}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold z-10 ${
                activeStep === s.step ? 'bg-indigo-600 text-white shadow-md' : 
                activeStep > s.step ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-zinc-200 text-zinc-400'
              }`}>
                {activeStep > s.step ? <CheckCircle2 className="w-4 h-4" /> : s.step}
              </div>
              <div>
                <h4 className={`text-xs font-bold ${activeStep === s.step ? 'text-indigo-900' : 'text-zinc-700'}`}>{s.title}</h4>
                <p className="text-[10px] text-zinc-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        {activeStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-zinc-900">Step 1: Data Collection</h3>
            <p className="text-sm text-zinc-500 mb-4">Select documents to request from the client via the secure portal.</p>
            <div className="grid grid-cols-2 gap-3">
              {['Form 16 / 16A', 'Bank Statements', 'Investment Proofs (80C, 80D)', 'Rent Receipts', 'Capital Gains Statement', 'Foreign Income Details'].map(doc => (
                <label key={doc} className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors">
                  <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-zinc-300" defaultChecked />
                  <span className="text-xs font-bold text-zinc-700">{doc}</span>
                </label>
              ))}
            </div>
            <button onClick={() => setActiveStep(2)} className="mt-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
              <Send className="w-4 h-4" /> Trigger Checklist to Client Portal
            </button>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-zinc-900">Step 2: Income Computation</h3>
            <p className="text-sm text-zinc-500 mb-4">Enter the gross income across the 5 statutory heads.</p>
            
            <div className="space-y-3 max-w-lg">
              {[
                { key: 'salary', label: 'Salary Income', icon: Building },
                { key: 'houseProperty', label: 'Income from House Property', icon: Home },
                { key: 'business', label: 'Business / Profession (PGBP)', icon: Briefcase },
                { key: 'capitalGains', label: 'Capital Gains', icon: Landmark },
                { key: 'otherSources', label: 'Other Sources (Interest, Dividend)', icon: FileText }
              ].map(head => (
                <div key={head.key} className="flex items-center justify-between gap-4 p-2">
                  <label className="text-xs font-bold text-zinc-700 flex items-center gap-2 w-1/2">
                    <head.icon className="w-4 h-4 text-indigo-500" /> {head.label}
                  </label>
                  <input 
                    type="number" 
                    value={income[head.key as keyof typeof income] || ''}
                    onChange={e => setIncome({...income, [head.key]: Number(e.target.value) || 0})}
                    className="w-1/2 px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-mono text-right"
                    placeholder="₹ 0"
                  />
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-zinc-100 mt-4 max-w-lg flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-900">Gross Total Income:</span>
              <span className="text-lg font-bold text-indigo-700 font-mono">₹{grossTotalIncome.toLocaleString('en-IN')}</span>
            </div>
            <button onClick={() => setActiveStep(3)} className="mt-6 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
              Save & Proceed to Tax Calc
            </button>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-zinc-900">Step 3: Tax Computation (New Regime)</h3>
            <p className="text-sm text-zinc-500 mb-4">System auto-computes tax liability and rebate u/s 87A.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600 font-semibold">Gross Total Income</span>
                  <span className="font-mono font-bold text-zinc-900">₹{grossTotalIncome.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600 font-semibold">Standard Deduction</span>
                  <span className="font-mono font-bold text-zinc-900 text-rose-600">- ₹{standardDeduction.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm">
                  <span className="text-zinc-900 font-bold">Net Taxable Income</span>
                  <span className="font-mono font-bold text-zinc-900">₹{netIncome.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-indigo-800 font-semibold">Tax on Total Income</span>
                  <span className="font-mono font-bold text-indigo-900">₹{taxLiability.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center mt-3 gap-2">
                   <label className="text-xs text-indigo-800 font-semibold">Less: TDS Claimed</label>
                   <input type="number" value={tdsClaimed} onChange={e => setTdsClaimed(Number(e.target.value))} className="w-24 px-2 py-1 text-xs rounded border border-indigo-200 text-right font-mono" />
                </div>
                <div className="flex justify-between items-center gap-2">
                   <label className="text-xs text-indigo-800 font-semibold">Less: Advance Tax Paid</label>
                   <input type="number" value={advanceTax} onChange={e => setAdvanceTax(Number(e.target.value))} className="w-24 px-2 py-1 text-xs rounded border border-indigo-200 text-right font-mono" />
                </div>
                
                <div className="pt-2 border-t border-indigo-200 flex justify-between text-sm items-center mt-2">
                  <span className="text-indigo-900 font-bold">{netPayable > 0 ? 'Net Tax Payable' : 'Net Tax Refundable'}</span>
                  <span className={`font-mono font-bold text-lg ${netPayable > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{Math.abs(netPayable).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
            
            <button onClick={() => setActiveStep(4)} className="mt-6 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
              Confirm & Select Form
            </button>
          </div>
        )}

        {activeStep === 4 && (
          <div className="space-y-4 animate-fade-in text-center py-10">
            <Calculator className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900">Step 4: Form Selection</h3>
            <p className="text-sm text-zinc-500 mb-6">Based on the income heads provided, the system recommends:</p>
            
            <div className="inline-block px-6 py-3 bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-black text-xl rounded-2xl shadow-sm">
              {recommendedForm}
            </div>

            <p className="text-xs text-zinc-400 mt-4 max-w-md mx-auto">
              (Auto-detected because: {income.business > 0 ? "Business Income is present" : income.capitalGains > 0 ? "Capital Gains is present" : "Only Salary/House Property/Other sources within 50L limit" })
            </p>

            <div className="mt-8">
              <button onClick={() => setActiveStep(5)} className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-sm">
                Proceed to Client Approval
              </button>
            </div>
          </div>
        )}

        {activeStep === 5 && (
          <div className="space-y-4 animate-fade-in text-center py-10">
            <Send className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900">Step 5: Review & Approval</h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">Send the draft computation to the client portal for their digital signature and approval.</p>
            
            <button onClick={() => setActiveStep(6)} className="flex items-center justify-center gap-2 mx-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-sm">
              <ShieldCheck className="w-4 h-4" /> Request Client Approval
            </button>
          </div>
        )}

        {activeStep === 6 && (
          <div className="space-y-4 animate-fade-in text-center py-10">
            <UploadCloud className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900">Step 6: Filing</h3>
            <p className="text-sm text-zinc-500 mb-6">Computation approved. Ready to generate JSON and upload to the IT portal.</p>
            
            <div className="flex justify-center gap-4">
              <button className="flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                <Download className="w-4 h-4 text-indigo-600" /> Export JSON
              </button>
              <button onClick={() => setActiveStep(7)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <CheckCircle2 className="w-4 h-4" /> Mark as Filed & Enter Ack No.
              </button>
            </div>
          </div>
        )}

        {activeStep === 7 && (
          <div className="space-y-4 animate-fade-in text-center py-10">
            <CheckSquare className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-zinc-900">Workflow Complete</h3>
            <p className="text-sm text-zinc-500 mb-6">The ITR has been filed successfully.</p>
            
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl inline-block text-left mb-6">
              <ul className="text-xs font-medium text-zinc-700 space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> ITR-V Ack Saved to Vault</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Computation sheet saved to Client Folder</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> All supporting documents archived</li>
              </ul>
            </div>

            <div>
              <button onClick={() => setActiveStep(1)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">
                Start New Workflow
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
