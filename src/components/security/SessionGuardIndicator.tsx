import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Settings, 
  Volume2, 
  VolumeX, 
  Play, 
  Lock, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Sliders,
  Shield,
  FileCheck
} from 'lucide-react';
import { User, SessionTimeoutPolicy } from '../../types';
import { useSessionRemainingSeconds } from '../../hooks/useSessionTimeout';

interface SessionGuardIndicatorProps {
  user: User;
  remainingSeconds?: number;
  policy: SessionTimeoutPolicy;
  isWarningOpen: boolean;
  onExtend: () => void;
  onLockNow: () => void;
  onSimulate: (seconds?: number) => void;
  onUpdatePolicy: (policy: Partial<SessionTimeoutPolicy>) => void;
}

function SessionGuardIndicatorComponent({
  user,
  remainingSeconds: externalRemainingSeconds,
  policy,
  isWarningOpen,
  onExtend,
  onLockNow,
  onSimulate,
  onUpdatePolicy,
}: SessionGuardIndicatorProps) {
  const liveRemainingSeconds = useSessionRemainingSeconds(externalRemainingSeconds ?? 900);
  const remainingSeconds = externalRemainingSeconds !== undefined ? liveRemainingSeconds : 900;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [tempTimeout, setTempTimeout] = useState<number>(policy.timeoutMinutes);
  const [tempWarning, setTempWarning] = useState<number>(policy.warningSeconds);
  const [tempSound, setTempSound] = useState<boolean>(policy.soundAlertEnabled);
  const [tempTestingMode, setTempTestingMode] = useState<boolean>(policy.testingMode !== false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const formatRemaining = (seconds: number) => {
    if (policy.testingMode !== false) {
      return 'Unlocked';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) {
      return `${secs}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePolicy({
      timeoutMinutes: tempTestingMode ? 1440 : Number(tempTimeout),
      warningSeconds: Number(tempWarning),
      soundAlertEnabled: tempSound,
      testingMode: tempTestingMode,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsDrawerOpen(false);
    }, 900);
  };

  const isLowTime = policy.testingMode === false && remainingSeconds <= policy.warningSeconds;

  return (
    <>
      {/* Interactive Session Pill in Sidebar / Header */}
      <div className="px-2 py-1.5">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
            isLowTime 
              ? 'bg-rose-50 border-rose-200 text-rose-800 animate-pulse shadow-sm' 
              : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-300 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
          }`}
          title="Click to view SOC 2 Session Inactivity Security Controls"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              isLowTime ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold tracking-wider text-zinc-800 uppercase">
                  SOC2 Guard
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <span className={`text-[11px] font-mono font-semibold truncate ${
                policy.testingMode !== false ? 'text-emerald-700 font-sans text-[10px]' : isLowTime ? 'text-rose-700' : 'text-zinc-500'
              }`}>
                {policy.testingMode !== false ? 'Testing Mode (Active)' : `${formatRemaining(remainingSeconds)} left`}
              </span>
            </div>
          </div>

          <div className="opacity-60 group-hover:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-zinc-700">
            <Sliders className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* SOC 2 Session Security Drawer / Settings Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden text-zinc-900 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                    SOC 2 Session Guard Controls
                  </h3>
                  <p className="text-xs text-zinc-500">
                    AICPA CC6.1 Inactivity & Logical Access Protocol
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Current Status Metric */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
                    SESSION STATUS
                  </span>
                  <p className="text-base font-bold text-emerald-950 mt-0.5">
                    Active & Monitored
                  </p>
                  <p className="text-xs text-emerald-800 font-mono mt-0.5">
                    {formatRemaining(remainingSeconds)} remaining before auto-lock
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onExtend}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full shadow-sm transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Extend (+{policy.timeoutMinutes}m)
                </button>
              </div>

              {/* Policy Configuration Form */}
              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* Testing Mode Toggle */}
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-950">
                        Testing Mode (Auto-Lock Disabled)
                      </span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-200/80 text-emerald-800 rounded">
                        RECOMMENDED FOR TESTING
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-snug">
                      Prevents unexpected session logouts and dialogs while testing firm features.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempTestingMode}
                    onChange={(e) => setTempTestingMode(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer ml-3 shrink-0"
                  />
                </div>

                {!tempTestingMode && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        Inactivity Timeout Threshold
                      </label>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        SOC2 CC6.1 Standard
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { mins: 5, label: '5 min', desc: 'Strict' },
                        { mins: 10, label: '10 min', desc: 'Standard' },
                        { mins: 15, label: '15 min', desc: 'SOC2 Ideal' },
                        { mins: 30, label: '30 min', desc: 'Extended' },
                      ].map((opt) => (
                        <button
                          key={opt.mins}
                          type="button"
                          onClick={() => setTempTimeout(opt.mins)}
                          className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                            tempTimeout === opt.mins
                              ? 'bg-indigo-50/60 border-indigo-500 text-indigo-900 font-bold shadow-sm'
                              : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                          }`}
                        >
                          <span className="text-xs font-bold">{opt.label}</span>
                          <span className="text-[9px] text-zinc-400 mt-0.5">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Interactive Warning Lead-Time
                  </label>
                  <select
                    value={tempWarning}
                    onChange={(e) => setTempWarning(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={30}>30 seconds before auto-lock</option>
                    <option value={60}>60 seconds before auto-lock (Recommended)</option>
                    <option value={120}>120 seconds before auto-lock</option>
                  </select>
                </div>

                {/* Sound Alert Toggle */}
                <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    {tempSound ? (
                      <Volume2 className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-zinc-400" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-zinc-800 block">
                        Audible Warning Chime
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Plays a gentle synthesized chime when warning triggers
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempSound}
                    onChange={(e) => setTempSound(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                  />
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Settings Saved & Applied</span>
                    </>
                  ) : (
                    <span>Save Session Policy</span>
                  )}
                </button>
              </form>

              {/* Auditor Simulation & Immediate Lock Tools */}
              <div className="pt-3 border-t border-zinc-100 space-y-2.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Audit & Fast Action Tools
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onSimulate(10);
                    }}
                    className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    title="Triggers the 10-second countdown modal to test SOC2 compliance"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-600" />
                    <span>Test Inactivity (10s)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onLockNow();
                    }}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                    <span>Lock Terminal Now</span>
                  </button>
                </div>
              </div>

              {/* Regulatory Compliance Footnote */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-[11px] text-zinc-500 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-zinc-700">
                  <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AICPA SOC 2 Type II Reference</span>
                </div>
                <p>
                  Controls CC6.1, CC6.6 & CC6.8 mandate automated session expiration for all multi-tenant accounting and tax audit workstations to protect client PII, confidential filings, and encrypted KMS keys.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const SessionGuardIndicator = React.memo(SessionGuardIndicatorComponent);

