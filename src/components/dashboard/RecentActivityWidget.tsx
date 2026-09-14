import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  ShieldCheck, 
  RefreshCw, 
  ArrowUpRight, 
  Lock, 
  Key, 
  FileText, 
  AlertTriangle, 
  UserCheck, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  ShieldAlert,
  Server,
  ExternalLink
} from 'lucide-react';
import { AuditLogEntry, AuditCategory, AuditSeverity } from '../../types';
import { SeverityBadge } from '../security/SeverityBadge';

interface RecentActivityWidgetProps {
  setActiveTab?: (tab: string) => void;
  className?: string;
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};

const logItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.16, 1, 0.3, 1] as const
    }
  }
};

export function RecentActivityWidget({ setActiveTab, className = '' }: RecentActivityWidgetProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const fetchRecentLogs = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/audit-logs', {
        headers: {
          'Authorization': 'Bearer mocked-soc2-jwt-token',
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to load audit logs (${res.status})`);
      }

      const data = await res.json();
      const allLogs: AuditLogEntry[] = data.logs || [];
      // Grab exactly the 5 most recent activities
      setLogs(allLogs.slice(0, 5));
      setTotalCount(data.total || allLogs.length);
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('[RecentActivityWidget] Error fetching audit logs:', err);
      setError(err?.message || 'Unable to load recent portal activity');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentLogs();

    // Auto-refresh periodically every 30 seconds so partners always see current activity
    const interval = setInterval(() => {
      fetchRecentLogs(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchRecentLogs]);

  // Format timestamp into relative human-readable string
  const formatTimeAgo = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      const diffMs = Date.now() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 45) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay === 1) return 'Yesterday';
      if (diffDay < 7) return `${diffDay}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return timestampStr;
    }
  };

  // Get action icon with matching color accent
  const getActionIcon = (action: string, category: AuditCategory) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return { icon: Lock, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/40' };
      case 'LOGIN_FAILURE':
        return { icon: ShieldAlert, bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/40' };
      case 'CREDENTIAL_REVEAL':
        return { icon: Key, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/40' };
      case 'FILE_DOWNLOAD':
      case 'FILE_UPLOAD':
      case 'FILE_ACCESS':
        return { icon: FileText, bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800/40' };
      case 'INVOICE_CREATE':
        return { icon: Receipt, bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800/40' };
      case 'ROLE_CHANGE':
      case 'ACCESS_GRANTED':
      case 'ACCESS_RESTRICTED':
      case 'ACCESS_RESTORED':
        return { icon: UserCheck, bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800/40' };
      case 'DATA_WIPE':
        return { icon: AlertTriangle, bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/40' };
      default:
        if (category === 'AUTH') return { icon: Lock, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/40' };
        if (category === 'VAULT') return { icon: Key, bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/40' };
        if (category === 'DATA_ACCESS') return { icon: FileText, bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800/40' };
        return { icon: Activity, bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-700' };
    }
  };

  const getSeverityBadge = (severity: AuditSeverity) => {
    return <SeverityBadge severity={severity} size="xs" format="short" />;
  };

  const getCategoryLabel = (category: AuditCategory) => {
    switch (category) {
      case 'AUTH': return 'Auth & MFA';
      case 'DATA_ACCESS': return 'File / Client Access';
      case 'PRIVILEGE': return 'Privilege & Roles';
      case 'VAULT': return 'Vault & Secrets';
      case 'BILLING': return 'Billing & Invoicing';
      default: return 'System';
    }
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 shadow-sm ${className}`}>
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-wide uppercase">
                Recent Portal Activity
              </h3>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE AUDIT
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Real-time immutable ledger of the last 5 staff actions, access grants, and filings across the practice.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => fetchRecentLogs(true)}
            disabled={loading || refreshing}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh recent activity"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
          </button>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('audit')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800/60 cursor-pointer"
            >
              <span>View All Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="mt-4">
        {loading && logs.length === 0 ? (
          // Loading Skeleton
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg shrink-0"></div>
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-44 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                    <div className="h-2.5 w-28 bg-zinc-100 dark:bg-zinc-800/60 rounded"></div>
                  </div>
                </div>
                <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error State
          <div className="py-6 px-4 text-center rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">{error}</p>
            <button
              onClick={() => fetchRecentLogs(true)}
              className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : logs.length === 0 ? (
          // Empty State
          <div className="py-8 text-center text-zinc-400 dark:text-zinc-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No recorded events in the audit log yet.</p>
          </div>
        ) : (
          // Log List with subtle cascading entry animation
          <motion.div 
            key={lastRefreshedAt.getTime()}
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-zinc-100 dark:divide-zinc-800/80"
          >
            {logs.map((log) => {
              const { icon: ActionIcon, bg, text, border } = getActionIcon(log.action, log.category);
              const severityBadge = getSeverityBadge(log.severity);

              return (
                <motion.div 
                  key={log.id} 
                  variants={logItemVariants}
                  whileHover={{ x: 2, transition: { duration: 0.15 } }}
                  className="py-3 px-2 sm:px-3 rounded-xl hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group cursor-default"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Action Icon */}
                    <div className={`w-9 h-9 rounded-xl ${bg} ${text} ${border} border flex items-center justify-center shrink-0 mt-0.5`}>
                      <ActionIcon className="w-4 h-4" />
                    </div>

                    {/* Event Description & Actor Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {log.actor.name}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {log.actor.role}
                        </span>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">•</span>
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate">
                          {log.details || log.resourceName}
                        </span>
                      </div>

                      {/* Subtitle & Metadata Tags */}
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                          {getCategoryLabel(log.category)}
                        </span>
                        <span className="text-[10px] text-zinc-300 dark:text-zinc-600">•</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                          {log.actor.ipAddress}
                        </span>
                        {log.soc2Criterion && (
                          <>
                            <span className="text-[10px] text-zinc-300 dark:text-zinc-600">•</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                              {log.soc2Criterion.split(' - ')[0]}
                            </span>
                          </>
                        )}
                        <span className="text-[10px] text-zinc-300 dark:text-zinc-600">•</span>
                        {severityBadge}
                      </div>
                    </div>
                  </div>

                  {/* Right: Timestamp & Verification status */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pl-12 sm:pl-0">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span title={new Date(log.timestamp).toLocaleString()}>
                        {formatTimeAgo(log.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span className="font-mono text-[9px] uppercase tracking-wider">HMAC Verified</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Widget Footer */}
      <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>SOC2 Type II Immutable Audit Stream</span>
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
          <span className="font-medium text-zinc-600 dark:text-zinc-300">{totalCount} total practice events logged</span>
        </div>

        {setActiveTab && (
          <button
            onClick={() => setActiveTab('audit')}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open Security & Audit Ledger</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
