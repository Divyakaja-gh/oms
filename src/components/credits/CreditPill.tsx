import React, { useState } from 'react';
import { Zap, Plus, ChevronDown } from 'lucide-react';
import { useCredits } from '../../context/CreditContext';

interface CreditPillProps {
  compact?: boolean;
  onOpenBilling?: () => void;
}

export function CreditPill({ compact = false, onOpenBilling }: CreditPillProps) {
  const { balance, openTopUpModal, rates, account, bypassMetering } = useCredits();
  const [showTooltip, setShowTooltip] = useState(false);

  // Status colors: green for healthy, amber for low, rose for depleted
  const getBadgeStyle = () => {
    if (bypassMetering) {
      return 'bg-amber-100/80 text-amber-900 border-amber-300 hover:bg-amber-200/80';
    }
    if (balance > 50) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70';
    }
    if (balance > 15) {
      return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70';
    }
    return 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/70 animate-pulse';
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={openTopUpModal}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-colors cursor-pointer ${getBadgeStyle()}`}
        title={bypassMetering ? 'AI Metering Stopped - Free Testing Active' : `AI Agent Balance: ${balance} Credits. Click to Top Up.`}
      >
        <Zap className="w-3 h-3 fill-current shrink-0" />
        <span className="font-mono">{bypassMetering ? 'FREE' : balance}</span>
      </button>
    );
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div 
        onClick={openTopUpModal}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${getBadgeStyle()}`}
      >
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
          <span className="font-bold font-mono text-xs">
            {bypassMetering ? '🧪 Test Mode' : balance}
          </span>
          <span className="text-[11px] font-medium opacity-85 hidden sm:inline">
            {bypassMetering ? '(Unmetered)' : 'Credits'}
          </span>
        </div>

        <span className="w-px h-3.5 bg-current opacity-20" />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openTopUpModal();
          }}
          className="flex items-center gap-0.5 text-[11px] font-bold underline-offset-2 hover:underline cursor-pointer"
        >
          <Plus className="w-3 h-3 stroke-[2.5]" />
          <span>{bypassMetering ? 'Test Controls' : 'Top Up'}</span>
        </button>
      </div>

      {/* Hover Rates Popover */}
      {showTooltip && (
        <div className="absolute right-0 mt-1.5 w-64 p-3 bg-zinc-900 text-white rounded-xl shadow-xl z-50 text-xs border border-zinc-800 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
            <span className="font-bold text-zinc-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Autonomous Agent Metering
            </span>
            <span className="text-[10px] text-zinc-400">{account?.planType || 'Pro'} Plan</span>
          </div>

          <div className="space-y-1.5 text-[11px] text-zinc-300">
            <div className="flex justify-between">
              <span>Client Onboarding Agent:</span>
              <strong className="text-white font-mono">{rates.onboarding} cr</strong>
            </div>
            <div className="flex justify-between">
              <span>Notice Triage & Defence:</span>
              <strong className="text-white font-mono">{rates.notice_triage} cr</strong>
            </div>
            <div className="flex justify-between">
              <span>GST & Bank Reconciliation:</span>
              <strong className="text-white font-mono">{rates.gst_bank_recon} cr</strong>
            </div>
            <div className="flex justify-between">
              <span>General NLQ Copilot:</span>
              <strong className="text-white font-mono">{rates.general_nlq} cr</strong>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
            <span>Click pill to purchase credits</span>
            {account?.autoRecharge && <span className="text-emerald-400 font-semibold">Auto-Recharge Active</span>}
          </div>
        </div>
      )}
    </div>
  );
}
