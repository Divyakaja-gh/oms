import React, { useState } from 'react';
import { 
  Zap, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CreditCard,
  Building2,
  AlertCircle
} from 'lucide-react';
import { useCredits } from '../../context/CreditContext';

interface CreditTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToBilling?: () => void;
}

const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Starter Agent Pack',
    credits: 100,
    priceInr: 999,
    perCredit: '₹9.99',
    badge: 'Starter',
    description: 'Ideal for trial client runs and ad-hoc notice drafting',
    tasksEstimate: '~20 Onboarding or 12 Notice Triages'
  },
  {
    id: 'pro',
    name: 'Growth Pro Pack',
    credits: 500,
    priceInr: 3999,
    perCredit: '₹7.99',
    badge: 'Most Popular (Save 20%)',
    popular: true,
    description: 'Perfect for regular monthly filings & routine GST audits',
    tasksEstimate: '~100 Onboarding or ~62 Notice Triages'
  },
  {
    id: 'scale',
    name: 'Enterprise Scale Pack',
    credits: 2000,
    priceInr: 12999,
    perCredit: '₹6.50',
    badge: 'Best Value (Save 35%)',
    description: 'High-volume autonomous reconciliation for multi-partner firms',
    tasksEstimate: '~400 Onboarding or ~166 GST Recon runs'
  }
];

export function CreditTopUpModal({ isOpen, onClose, onNavigateToBilling }: CreditTopUpModalProps) {
  const { balance, grantCredits, grantTestCredits, bypassMetering, toggleBypassMetering, rates } = useCredits();
  const [selectedPack, setSelectedPack] = useState(CREDIT_PACKS[1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async (pack = selectedPack) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await grantCredits(
      pack.credits, 
      pack.name, 
      `INV-CREDIT-${Date.now().toString().slice(-6)}`
    );

    setIsProcessing(false);

    if (result.success) {
      setSuccessMessage(`Successfully added +${pack.credits} credits to your account! New Balance: ${result.newBalance} credits.`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1600);
    } else {
      setErrorMessage(result.error || 'Failed to complete credit grant.');
    }
  };

  const handleGrantTestPack = async (amount = 10000) => {
    setIsProcessing(true);
    const result = await grantTestCredits(amount);
    setIsProcessing(false);
    if (result.success) {
      setSuccessMessage(`Granted +${amount.toLocaleString()} Free Test Credits! New Balance: ${result.newBalance?.toLocaleString()} credits.`);
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2500);
    }
  };

  const handleToggleMetering = async () => {
    setIsProcessing(true);
    const nextState = !bypassMetering;
    await toggleBypassMetering(nextState);
    setIsProcessing(false);
    setSuccessMessage(
      nextState 
        ? 'AI Credit Metering STOPPED! Unlimited free testing active across all agents.'
        : 'AI Credit Metering RESUMED. Standard rate-card metering active.'
    );
    setTimeout(() => {
      setSuccessMessage(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
      <div 
        className="bg-white border border-zinc-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
              <Zap className="w-5 h-5 text-indigo-600 fill-indigo-600/20" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                Top Up Autonomous Agent Credits
                <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                  SaaS Metering
                </span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Grant and recharge credits for LLM-powered autonomous tax and audit agents.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Bar */}
        <div className="px-6 py-3 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Available Active Balance:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{balance} Credits</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-300">
            <span>Onboarding: <strong>{rates.onboarding} cr</strong></span>
            <span>•</span>
            <span>Notice Triage: <strong>{rates.notice_triage} cr</strong></span>
            <span>•</span>
            <span>GST Recon: <strong>{rates.gst_bank_recon} cr</strong></span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Credit Packs Grid */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Select an Autonomous Credit Pack
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CREDIT_PACKS.map(pack => {
                const isSelected = selectedPack.id === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPack(pack)}
                    className={`relative rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs' 
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/50'
                    }`}
                  >
                    {pack.popular && (
                      <span className="absolute -top-2.5 right-3 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-800">{pack.name}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-zinc-300'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-zinc-900 font-mono">
                          {pack.credits}
                        </span>
                        <span className="text-xs font-semibold text-zinc-500">Credits</span>
                      </div>

                      <p className="text-[11px] text-zinc-500 mt-1">
                        {pack.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-100/80">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold text-zinc-900">₹{pack.priceInr.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-zinc-500">{pack.perCredit}/cr</span>
                      </div>
                      <span className="text-[10px] text-indigo-700 font-medium block mt-1">
                        {pack.tasksEstimate}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testing & Developer Sandbox Mode with Metering Stop Control */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl flex flex-col gap-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900">Application Testing & QA Controls</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bypassMetering ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'}`}>
                      {bypassMetering ? '⚡ METERING STOPPED (FREE TESTING)' : 'METERING ACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    Stop AI credit metering to run unlimited autonomous agents or grant free test credits.
                  </p>
                </div>
              </div>

              {/* Stop / Resume Metering Toggle */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleToggleMetering}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                  bypassMetering 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{bypassMetering ? 'Resume Metering' : 'Stop AI Credit Metering'}</span>
              </button>
            </div>

            {/* Quick Test Credit Grant Buttons */}
            <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-amber-900">
                Grant instant free test credits to firm balance:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleGrantTestPack(10000)}
                  className="px-3 py-1 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 font-bold rounded-full text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                >
                  + 10,000 Test Credits
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleGrantTestPack(50000)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-full text-[11px] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  + 50,000 Test Credits
                </button>
              </div>
            </div>
          </div>

          {/* Enterprise & Security Notice */}
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All transactions are recorded in the SOC2-compliant tamper-proof audit ledger with real-time balance snapshots.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          {onNavigateToBilling ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToBilling();
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              View Full Credit Ledger in Billing →
            </button>
          ) : <div />}

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handlePurchase(selectedPack)}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isProcessing ? 'Processing Grant...' : `Grant ${selectedPack.credits} Credits (₹${selectedPack.priceInr})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
