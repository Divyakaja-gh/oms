import React, { useEffect } from 'react';
import { ShieldAlert, Clock, RefreshCw, Lock, AlertTriangle, ShieldCheck, Volume2, VolumeX } from 'lucide-react';
import { User, SessionTimeoutPolicy } from '../../types';
import { useSessionRemainingSeconds } from '../../hooks/useSessionTimeout';

interface SessionInactivityModalProps {
  isOpen: boolean;
  remainingSeconds?: number;
  policy: SessionTimeoutPolicy;
  user: User;
  onExtend: () => void;
  onLogout: () => void;
  onToggleSound?: () => void;
  isSimulating?: boolean;
}

function SessionInactivityModalComponent({
  isOpen,
  remainingSeconds: externalRemainingSeconds,
  policy,
  user,
  onExtend,
  onLogout,
  onToggleSound,
  isSimulating,
}: SessionInactivityModalProps) {
  const liveRemainingSeconds = useSessionRemainingSeconds(externalRemainingSeconds ?? 60);
  const remainingSeconds = externalRemainingSeconds !== undefined ? liveRemainingSeconds : 60;
  // Listen for Space or Enter key to quickly extend session
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        // Prevent default space scroll
        e.preventDefault();
        onExtend();
      } else if (e.key === 'Escape') {
        // Escape locks immediately for security
        onLogout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onExtend, onLogout]);

  if (!isOpen) return null;

  const totalWarningSeconds = policy.warningSeconds || 60;
  const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / totalWarningSeconds) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isUrgent = remainingSeconds <= 15;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-timeout-title"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden text-zinc-900 transition-all scale-100"
      >
        {/* Top Warning Accent Bar with Dynamic Progress Drain */}
        <div className="w-full h-2 bg-zinc-100 relative overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${
              isUrgent ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isUrgent ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>SOC 2 Type II Inactivity Control (CC6.1)</span>
              </span>
              {isSimulating && (
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  Simulation Active
                </span>
              )}
            </div>

            {onToggleSound && (
              <button
                type="button"
                onClick={onToggleSound}
                title={policy.soundAlertEnabled ? 'Sound alert enabled' : 'Sound alert muted'}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-100 transition-colors"
              >
                {policy.soundAlertEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Main Counter & Headline */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Circular Timer Visual */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-zinc-100"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className={`transition-all duration-1000 ease-linear ${
                    isUrgent ? 'stroke-rose-600' : 'stroke-amber-500'
                  }`}
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-xl font-black font-mono tracking-tight ${
                  isUrgent ? 'text-rose-600 animate-pulse' : 'text-zinc-900'
                }`}>
                  {formatTime(remainingSeconds)}
                </span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                  Remaining
                </span>
              </div>
            </div>

            {/* Explanatory Text */}
            <div className="space-y-1 text-center sm:text-left">
              <h3 id="session-timeout-title" className="text-lg font-extrabold text-zinc-900">
                Are you still working, {user.name.split(' ')[0]}?
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                No active input detected for <span className="font-bold text-zinc-900">{policy.timeoutMinutes} minutes</span>. Your session will automatically terminate to protect client data and prevent unauthorized terminal access.
              </p>
            </div>
          </div>

          {/* Security & Regulatory Info Card */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs space-y-2.5">
            <div className="flex items-center justify-between text-zinc-700">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protected Account:</span>
              </div>
              <span className="font-mono text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200">
                {user.email} ({user.role.toUpperCase()})
              </span>
            </div>
            
            <div className="flex items-start gap-2 text-[11px] text-zinc-500 leading-relaxed pt-1 border-t border-zinc-200/60">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>SOC2 Policy CC6.1 Requirement:</strong> Active terminal sessions must be terminated upon inactivity to prevent exposure of client PAN, GST credentials, audit working papers, and bank statements.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onExtend}
              className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 group active:scale-98"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <span>I'm Still Working (Extend Session)</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="w-full sm:w-auto py-3 px-4 bg-zinc-100 hover:bg-rose-50 hover:text-rose-700 text-zinc-700 rounded-full text-sm font-semibold border border-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Lock Now</span>
            </button>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-zinc-400">
              Tip: Press <kbd className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-300 rounded text-zinc-600 font-mono text-[9px] font-bold">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-300 rounded text-zinc-600 font-mono text-[9px] font-bold">Enter</kbd> to keep working immediately.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const SessionInactivityModal = React.memo(SessionInactivityModalComponent);

