import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Database, X, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { offlineStorage } from '../lib/offlineStorage';

export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline, checkConnection } = useOnlineStatus();
  const [isChecking, setIsChecking] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{
    quota: number;
    usage: number;
    usagePercent: number;
    pendingQueueCount: number;
    cachedItemsCount: number;
    draftsCount: number;
    isSupported: boolean;
  } | null>(null);

  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    await checkConnection();
    setTimeout(() => setIsChecking(false), 600);
  };

  const handleOpenDetails = async () => {
    const data = await offlineStorage.getDiagnostics();
    setDiagnostics(data);
    setShowDetails(true);
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <>
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div 
          id="offline-status-banner"
          className="bg-amber-500 text-white px-4 py-2 text-xs md:text-sm font-medium shadow-md transition-all flex items-center justify-between flex-wrap gap-2 sticky top-0 z-50 border-b border-amber-600"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> Running on IndexedDB &amp; Service Worker cache. Edits are queued locally and will sync automatically when connection restores.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="offline-diagnostics-btn"
              onClick={handleOpenDetails}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Storage Stats</span>
            </button>
            <button
              id="offline-check-btn"
              onClick={handleManualCheck}
              disabled={isChecking}
              className="flex items-center gap-1.5 bg-white text-amber-800 hover:bg-amber-100 px-2.5 py-1 rounded text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-75"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking...' : 'Check Connection'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Reconnected Toast */}
      {showReconnected && isOnline && (
        <div 
          id="reconnected-status-toast"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-500 animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <div className="p-1 bg-white/20 rounded-full">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold">Network Connectivity Restored</p>
            <p className="text-[11px] text-emerald-100">IndexedDB offline queue syncing with cloud Firestore.</p>
          </div>
          <button 
            onClick={() => setShowReconnected(false)} 
            className="p-1 text-emerald-200 hover:text-white cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Offline Storage Diagnostics Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Offline Caching &amp; Storage</h3>
                  <p className="text-xs text-zinc-500">IndexedDB + Service Worker Diagnostics</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetails(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="flex justify-between items-center text-xs text-zinc-600 mb-1.5">
                  <span className="font-semibold">Local Storage Usage</span>
                  <span className="font-mono text-zinc-800">
                    {formatBytes(diagnostics?.usage || 0)} / {formatBytes(diagnostics?.quota || 0)} ({diagnostics?.usagePercent || 0}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(2, diagnostics?.usagePercent || 0))}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-zinc-500 block">Firestore Cache</span>
                  <span className="font-bold text-zinc-900 text-sm mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    IndexedDB Multi-tab
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-zinc-500 block">Service Worker</span>
                  <span className="font-bold text-zinc-900 text-sm mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Workbox Precached
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-zinc-500 block">Pending Offline Queue</span>
                  <span className="font-bold text-zinc-900 text-sm mt-0.5">
                    {diagnostics?.pendingQueueCount || 0} actions
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-zinc-500 block">Local Drafts Preserved</span>
                  <span className="font-bold text-zinc-900 text-sm mt-0.5">
                    {diagnostics?.draftsCount || 0} drafts
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-200 leading-relaxed">
                When network drops, all queries for clients, tasks, compliance filings, and knowledge documents are served instantaneously from IndexedDB. Writes are queued and flushed when online.
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
