import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Plus, 
  RefreshCw, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sliders, 
  Bot, 
  Sparkles, 
  FileSpreadsheet, 
  UserPlus, 
  Scale, 
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Check
} from 'lucide-react';
import { useCredits } from '../../context/CreditContext';
import { CreditTransaction } from '../../types';

export function AgentCreditsTab() {
  const { 
    balance, 
    account, 
    rates, 
    transactions, 
    isLoading, 
    refreshCredits, 
    grantCredits, 
    grantTestCredits,
    bypassMetering,
    toggleBypassMetering,
    updateSettings,
    openTopUpModal 
  } = useCredits();

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DEDUCT' | 'GRANT'>('ALL');

  // Auto-Recharge Settings Form State
  const [autoRecharge, setAutoRecharge] = useState(account?.autoRecharge ?? true);
  const [threshold, setThreshold] = useState(account?.autoRechargeThreshold ?? 50);
  const [rechargePack, setRechargePack] = useState(account?.autoRechargePackAmount ?? 200);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string | null>(null);

  // Quick grant state
  const [isGranting, setIsGranting] = useState(false);
  const [grantNotice, setGrantNotice] = useState<string | null>(null);

  const handleToggleMetering = async () => {
    setIsGranting(true);
    const nextState = !bypassMetering;
    await toggleBypassMetering(nextState);
    setIsGranting(false);
    setGrantNotice(
      nextState
        ? 'AI Credit Metering STOPPED! Autonomous agent tasks now execute with zero credit deduction.'
        : 'AI Credit Metering RESUMED. Normal rate metering active.'
    );
    setTimeout(() => setGrantNotice(null), 4000);
  };

  const handleGrantTestPack = async (amount = 10000) => {
    setIsGranting(true);
    const res = await grantTestCredits(amount);
    setIsGranting(false);
    if (res.success) {
      setGrantNotice(`Granted +${amount.toLocaleString()} Free Test Credits! Available Balance: ${res.newBalance?.toLocaleString()} credits.`);
      setTimeout(() => setGrantNotice(null), 4000);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.userName && t.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.agentType && t.agentType.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterType === 'ALL' || t.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [transactions, searchTerm, filterType]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    const success = await updateSettings({
      autoRecharge,
      autoRechargeThreshold: Number(threshold),
      autoRechargePackAmount: Number(rechargePack)
    });
    setIsSavingSettings(false);
    if (success) {
      setSettingsSavedMessage('Auto-Recharge policies updated successfully.');
      setTimeout(() => setSettingsSavedMessage(null), 3000);
    }
  };

  const handleQuickGrant = async (amount: number, packName: string) => {
    setIsGranting(true);
    const res = await grantCredits(amount, packName, `PORTAL-${Date.now()}`);
    setIsGranting(false);
    if (res.success) {
      setGrantNotice(`Granted +${amount} credits (${packName}). Available Balance: ${res.newBalance} credits.`);
      setTimeout(() => setGrantNotice(null), 4000);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Timestamp', 'Type', 'Category', 'Description', 'Agent Type', 'Tokens Used', 'Credit Delta', 'Balance After', 'Actor'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.timestamp,
      t.type,
      t.category,
      `"${t.description.replace(/"/g, '""')}"`,
      t.agentType || 'N/A',
      t.tokensUsed?.totalTokens ? t.tokensUsed.totalTokens : 'N/A',
      t.amount,
      t.balanceAfter,
      `"${t.userName || 'System'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Aarav_Advisors_Agent_Credit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banners */}
      {grantNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{grantNotice}</span>
          </div>
          <button onClick={() => setGrantNotice(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">×</button>
        </div>
      )}

      {settingsSavedMessage && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs flex items-center justify-between font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{settingsSavedMessage}</span>
          </div>
          <button onClick={() => setSettingsSavedMessage(null)} className="text-indigo-700 hover:text-indigo-900 font-bold">×</button>
        </div>
      )}

      {/* Developer Testing Sandbox & Metering Bypass Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-amber-500/10 border border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900">
                Application Testing Sandbox & Credit Metering Bypass
              </h3>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                bypassMetering 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse' 
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}>
                {bypassMetering ? '⚡ Metering Stopped (Unlimited Free Testing)' : 'Metering Active'}
              </span>
            </div>
            <p className="text-xs text-zinc-600 mt-1 max-w-2xl">
              Stop autonomous credit deductions across all AI Copilot, GST 3-Way Recon, Notice Triage, and Onboarding tasks during testing, or provision free test credits instantly.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isGranting}
            onClick={handleToggleMetering}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
              bypassMetering
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{bypassMetering ? 'Resume Metering' : 'Stop AI Credit Metering'}</span>
          </button>

          <button
            type="button"
            disabled={isGranting}
            onClick={() => handleGrantTestPack(10000)}
            className="px-3.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 font-bold rounded-full text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            +10,000 Test Credits
          </button>

          <button
            type="button"
            disabled={isGranting}
            onClick={() => handleGrantTestPack(50000)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            +50,000 Test Credits
          </button>
        </div>
      </div>

      {/* Hero Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Active Balance */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Available Credit Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Zap className="w-4 h-4 fill-indigo-600/20" />
            </div>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-zinc-900 font-mono tracking-tight">
                {balance}
              </span>
              <span className="text-xs font-semibold text-zinc-500">Credits</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Active quota ready for autonomous agent execution loops.
            </p>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">
              Lifetime used: <strong>{account?.lifetimeUsed ?? 0} cr</strong>
            </span>
            <button
              type="button"
              onClick={openTopUpModal}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Top Up
            </button>
          </div>
        </div>

        {/* Card 2: Subscription Allowance */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Monthly Plan Quota
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 uppercase">
              {account?.planType || 'Professional'} Tier
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-zinc-900 font-mono tracking-tight">
                {account?.monthlyAllowance || 500}
              </span>
              <span className="text-xs font-semibold text-zinc-500">cr / month</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Refreshes on the 1st of every calendar month with zero expiration.
            </p>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Cycle usage:</span>
            <span className="font-semibold text-zinc-800 font-mono">
              {account?.lifetimeUsed ?? 0} / {account?.monthlyAllowance || 500} cr
            </span>
          </div>
        </div>

        {/* Card 3: Estimated Autonomous Capacity */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Autonomous Work Capacity
            </span>
            <Bot className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="my-3 space-y-2 text-xs">
            <div className="flex items-center justify-between p-1.5 bg-zinc-50 rounded-lg">
              <span className="text-zinc-600 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                Client Onboarding (SA-210):
              </span>
              <strong className="text-zinc-900 font-mono">
                ~{Math.floor(balance / rates.onboarding)} runs
              </strong>
            </div>

            <div className="flex items-center justify-between p-1.5 bg-zinc-50 rounded-lg">
              <span className="text-zinc-600 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-600" />
                Notice Triage (148A/DRC-01):
              </span>
              <strong className="text-zinc-900 font-mono">
                ~{Math.floor(balance / rates.notice_triage)} runs
              </strong>
            </div>

            <div className="flex items-center justify-between p-1.5 bg-zinc-50 rounded-lg">
              <span className="text-zinc-600 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                GST 3-Way Bank Recon:
              </span>
              <strong className="text-zinc-900 font-mono">
                ~{Math.floor(balance / rates.gst_bank_recon)} runs
              </strong>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
            <span>NLQ queries: {balance} runs</span>
            <span className="text-indigo-600 font-medium">Zero-touch CA</span>
          </div>
        </div>
      </div>

      {/* Credit Packs Purchase Store */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
              Autonomous Agent Credit Packs (Add-ons)
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Instantly grant and provision additional execution credits to keep your firm's AI workflows running seamlessly.
            </p>
          </div>
          <button
            type="button"
            disabled={isGranting}
            onClick={() => handleQuickGrant(50, 'Sandbox Demo Pack')}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Grant 50 Sandbox Credits</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pack 1 */}
          <div className="border border-zinc-200 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-300 transition-colors bg-zinc-50/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800">Starter Pack</span>
                <span className="text-[10px] font-semibold text-zinc-500 bg-white px-2 py-0.5 rounded border border-zinc-200">
                  ₹9.99/cr
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-zinc-900 font-mono">100</span>
                <span className="text-xs font-semibold text-zinc-500">Credits</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Best for small practice trials and occasional notice draft triage.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-200/70 flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-900">₹999</span>
              <button
                type="button"
                disabled={isGranting}
                onClick={() => handleQuickGrant(100, 'Starter Pack (100 Credits)')}
                className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Grant Pack
              </button>
            </div>
          </div>

          {/* Pack 2: Popular */}
          <div className="border-2 border-indigo-600 rounded-xl p-4 flex flex-col justify-between bg-indigo-50/20 relative shadow-xs">
            <span className="absolute -top-2.5 right-3 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              Most Popular • Save 20%
            </span>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900">Growth Pro Pack</span>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded border border-indigo-200">
                  ₹7.99/cr
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-zinc-900 font-mono">500</span>
                <span className="text-xs font-semibold text-zinc-500">Credits</span>
              </div>
              <p className="text-[11px] text-zinc-600 mt-1">
                Tailored for multi-client monthly returns, GST reconciliations, and audit notices.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-900">₹3,999</span>
              <button
                type="button"
                disabled={isGranting}
                onClick={() => handleQuickGrant(500, 'Growth Pro Pack (500 Credits)')}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                Grant Pack
              </button>
            </div>
          </div>

          {/* Pack 3 */}
          <div className="border border-zinc-200 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-300 transition-colors bg-zinc-50/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800">Enterprise Scale</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Save 35%
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-zinc-900 font-mono">2,000</span>
                <span className="text-xs font-semibold text-zinc-500">Credits</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Heavy-duty batch execution for 500+ client firms with automated reconciliation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-200/70 flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-900">₹12,999</span>
              <button
                type="button"
                disabled={isGranting}
                onClick={() => handleQuickGrant(2000, 'Enterprise Scale Pack (2,000 Credits)')}
                className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Grant Pack
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous Metering Controls & Rate Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Auto-Recharge Policy */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-zinc-700" />
                Auto-Recharge & Overdraft Safeguards
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                Resilience Engine
              </span>
            </div>

            <p className="text-xs text-zinc-500 mb-4">
              Prevent autonomous agent tasks from failing mid-execution during monthly tax filing deadlines.
            </p>

            <div className="space-y-4">
              {/* Toggle Switch */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRecharge}
                  onChange={(e) => setAutoRecharge(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-800">
                    Enable Intelligent Auto-Recharge
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    When credit balance dips below threshold, automatically replenish with an add-on pack.
                  </p>
                </div>
              </label>

              {/* Threshold Setting */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    Trigger Threshold
                  </label>
                  <select
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    disabled={!autoRecharge}
                    className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  >
                    <option value={20}>Balance ≤ 20 Credits</option>
                    <option value={50}>Balance ≤ 50 Credits (Recommended)</option>
                    <option value={100}>Balance ≤ 100 Credits</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">
                    Replenishment Amount
                  </label>
                  <select
                    value={rechargePack}
                    onChange={(e) => setRechargePack(Number(e.target.value))}
                    disabled={!autoRecharge}
                    className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  >
                    <option value={100}>+100 Credits (₹999)</option>
                    <option value={200}>+200 Credits (₹1,599)</option>
                    <option value={500}>+500 Credits (₹3,999)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">
              Audit logged via SOC2 CC6.1
            </span>
            <button
              type="button"
              disabled={isSavingSettings}
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-full transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSavingSettings ? 'Saving...' : 'Save Policy Settings'}
            </button>
          </div>
        </div>

        {/* Right: Agent Task Unit Economics (Rate Card) */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-600" />
                Autonomous Task Pricing & Unit Economics
              </h3>
              <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Fixed Task Billing
              </span>
            </div>

            <p className="text-xs text-zinc-500 mb-3">
              Standardized cost per task outcome. No surprise token math for your partners and articles.
            </p>

            <div className="divide-y divide-zinc-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-800">Client Onboarding Agent</span>
                    <p className="text-[10px] text-zinc-400">SA-210 contract, KYC docket & automated calendar</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-zinc-900">{rates.onboarding} Credits</span>
                  <span className="block text-[10px] text-zinc-400">~₹40 per run</span>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-800">Notice Triage & Defence Agent</span>
                    <p className="text-[10px] text-zinc-400">ITD 148A & GST DRC-01 legal drafting with case citations</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-zinc-900">{rates.notice_triage} Credits</span>
                  <span className="block text-[10px] text-zinc-400">~₹64 per run</span>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-800">GST & Bank 3-Way Recon</span>
                    <p className="text-[10px] text-zinc-400">Books vs 2B vs Bank debits with vendor notice batching</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-zinc-900">{rates.gst_bank_recon} Credits</span>
                  <span className="block text-[10px] text-zinc-400">~₹96 per run</span>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-800">General Practice NLQ Copilot</span>
                    <p className="text-[10px] text-zinc-400">Statutory tax law and ICAI audit advisory queries</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-zinc-900">{rates.general_nlq} Credit</span>
                  <span className="block text-[10px] text-zinc-400">~₹8 per query</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 text-[11px] text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>If an autonomous run encounters a runtime failure, credits are auto-refunded.</span>
          </div>
        </div>
      </div>

      {/* Immutable Credit Ledger Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="px-5 py-4 border-b border-zinc-200/80 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              Autonomous Credit Metering Ledger
              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-200/70 px-2 py-0.5 rounded-full font-mono">
                {filteredTransactions.length} events
              </span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Auditable record of every grant, pack purchase, and agentic deduction.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Buttons */}
            <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${filterType === 'ALL' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('DEDUCT')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${filterType === 'DEDUCT' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Deductions
              </button>
              <button
                type="button"
                onClick={() => setFilterType('GRANT')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${filterType === 'GRANT' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Grants
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ledger..."
                className="pl-8 pr-3 py-1 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48"
              />
            </div>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-full text-zinc-700 transition-colors cursor-pointer"
              title="Export Ledger as CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => refreshCredits()}
              className="p-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 transition-colors cursor-pointer"
              title="Refresh Ledger"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ledger Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description / Agent Workflow</th>
                <th className="px-4 py-3 text-right">LLM Tokens</th>
                <th className="px-4 py-3 text-right">Credit Delta</th>
                <th className="px-4 py-3 text-right">Balance After</th>
                <th className="px-4 py-3">Actor / User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-zinc-400">
                    No credit transactions match the current filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const isGrant = txn.type === 'GRANT';
                  const dateFormatted = new Date(txn.timestamp).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <tr key={txn.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap font-mono text-[11px]">
                        {dateFormatted}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-zinc-600 font-semibold whitespace-nowrap">
                        {txn.id}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isGrant
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          }`}
                        >
                          {isGrant ? <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-600" /> : <ArrowUpRight className="w-2.5 h-2.5 text-zinc-500" />}
                          {txn.type}
                        </span>
                      </td>

                      <td className="px-4 py-3 max-w-sm">
                        <div className="font-semibold text-zinc-900 truncate" title={txn.description}>
                          {txn.description}
                        </div>
                        {txn.agentType && (
                          <span className="text-[10px] text-indigo-600 font-mono">
                            module: {txn.agentType}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-zinc-500 whitespace-nowrap">
                        {txn.tokensUsed?.totalTokens ? (
                          <span title={`Prompt: ${txn.tokensUsed.promptTokens || 0} | Completion: ${txn.tokensUsed.completionTokens || 0}`}>
                            {txn.tokensUsed.totalTokens.toLocaleString()} tok
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>

                      <td className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${isGrant ? 'text-emerald-600' : 'text-zinc-900'}`}>
                        {isGrant ? `+${txn.amount}` : txn.amount} cr
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-zinc-700 whitespace-nowrap">
                        {txn.balanceAfter} cr
                      </td>

                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                        <span className="truncate max-w-[120px] block" title={txn.userName}>
                          {txn.userName || 'System'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
