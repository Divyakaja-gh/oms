import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Key, 
  FileText, 
  UserCheck, 
  Fingerprint, 
  Eye, 
  Terminal, 
  Copy, 
  Check, 
  Server, 
  Activity, 
  ShieldAlert,
  Radio,
  Zap,
  Bell,
  BellRing,
  X,
  ShieldBan,
  Flame,
  Globe,
  Play,
  Pause,
  Clock,
  Timer
} from 'lucide-react';
import { AuditLogEntry, AuditCategory, AuditSeverity } from '../types';
import { DEFAULT_AUDIT_LOGS } from '../data/defaultAuditLogs';
import { SeverityBadge } from '../components/security/SeverityBadge';

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => DEFAULT_AUDIT_LOGS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);
  
  // Real-time Live Notification & Sentinel State
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [lastEventCount, setLastEventCount] = useState<number>(() => DEFAULT_AUDIT_LOGS.length);
  const [activeAlerts, setActiveAlerts] = useState<AuditLogEntry[]>([]);
  const [quarantinedIps, setQuarantinedIps] = useState<string[]>(['185.220.101.5']);
  const [isQuarantining, setIsQuarantining] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [newlyArrivedIds, setNewlyArrivedIds] = useState<Set<string>>(new Set());
  const [audioAlertEnabled, setAudioAlertEnabled] = useState(true);

  // Cryptographic Verification State
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const [chainVerifiedResult, setChainVerifiedResult] = useState<{
    verified: boolean;
    merkleRoot: string;
    verifiedCount: number;
    timeMs: number;
  } | null>(null);

  const prevLogsRef = useRef<AuditLogEntry[]>(DEFAULT_AUDIT_LOGS);

  // Fetch Audit Logs from backend
  const fetchAuditLogs = async (isBackgroundPoll = false) => {
    if (!isBackgroundPoll) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedSeverity !== 'ALL') params.append('severity', selectedSeverity);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: {
          'Authorization': 'Bearer mocked-soc2-jwt-token',
          'Accept': 'application/json'
        }
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const incomingLogs: AuditLogEntry[] = Array.isArray(data?.logs) ? data.logs : [];
        
        // Detect newly arrived critical/flagged logs
        if (prevLogsRef.current.length > 0 && incomingLogs.length > prevLogsRef.current.length) {
          const prevIds = new Set(prevLogsRef.current.map(l => l.id));
          const newEntries = incomingLogs.filter(l => !prevIds.has(l.id));
          
          const newCriticals = newEntries.filter(
            l => l.severity === 'CRITICAL' || l.severity === 'HIGH' || l.status === 'FLAGGED'
          );

          if (newCriticals.length > 0) {
            setActiveAlerts(prev => [...newCriticals, ...prev].slice(0, 4));
            
            // Mark new entries for row animation
            setNewlyArrivedIds(new Set(newEntries.map(e => e.id)));
            setTimeout(() => setNewlyArrivedIds(new Set()), 6000);
          }
        }

        prevLogsRef.current = incomingLogs;
        setLogs(incomingLogs);
      }
    } catch (err: any) {
      console.warn('[AuditLogs] Notice syncing audit records:', err?.message || err);
      // Keep existing or default logs
      setLogs(prev => prev.length > 0 ? prev : DEFAULT_AUDIT_LOGS);
    } finally {
      if (!isBackgroundPoll) setLoading(false);
    }
  };

  // Fetch security incident overview
  const fetchIncidentSummary = async () => {
    try {
      const res = await fetch('/api/audit-logs/security-incidents', {
        headers: { 
          'Authorization': 'Bearer mocked-soc2-jwt-token',
          'Accept': 'application/json'
        }
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setQuarantinedIps(data.quarantinedIps || []);
        
        // Populate initial active alerts if critical
        if (data.recentIncidents && activeAlerts.length === 0) {
          const initialFlagged = data.recentIncidents.filter((i: AuditLogEntry) => i.status === 'FLAGGED');
          if (initialFlagged.length > 0) {
            setActiveAlerts(initialFlagged);
          }
        }
      }
    } catch (err: any) {
      console.warn('[AuditLogs] Incident summary sync notice:', err?.message || err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAuditLogs();
    fetchIncidentSummary();
  }, [selectedCategory, selectedSeverity]);

  // Live polling interval (3 seconds)
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      fetchAuditLogs(true);
      fetchIncidentSummary();
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveActive, selectedCategory, selectedSeverity, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditLogs();
  };

  // Action: Quarantine IP on WAF
  const handleQuarantineIp = async (ipAddress: string, incidentId?: string, reason?: string) => {
    setIsQuarantining(ipAddress);
    try {
      const res = await fetch('/api/audit-logs/quarantine-ip', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mocked-soc2-jwt-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ipAddress,
          incidentId,
          reason: reason || 'Repeated failed authentication probe & security threshold breach'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setQuarantinedIps(data.quarantinedIps || []);
        
        // Remove from active floating alert queue
        setActiveAlerts(prev => prev.filter(a => a.actor.ipAddress !== ipAddress));
        
        // Refresh logs immediately to show mitigation record
        await fetchAuditLogs(true);
      }
    } catch (err) {
      console.error('Error quarantining IP:', err);
    } finally {
      setIsQuarantining(null);
    }
  };

  // Action: Simulate Live Security Incident
  const handleSimulateIncident = async (type: 'BRUTE_FORCE' | 'KMS_TAMPER' | 'DLP_EXPORT' | 'SESSION_TIMEOUT') => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/audit-logs/simulate-incident', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mocked-soc2-jwt-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      });

      if (res.ok) {
        const data = await res.json();
        const newIncident = data.incident;
        
        // Trigger immediate live alert popup
        setActiveAlerts(prev => [newIncident, ...prev.filter(p => p.id !== newIncident.id)].slice(0, 4));
        setNewlyArrivedIds(prev => new Set([...Array.from(prev), newIncident.id]));
        
        // Refresh logs immediately
        await fetchAuditLogs(true);
      }
    } catch (err) {
      console.error('Error simulating incident:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDismissAlert = (id: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleVerifyChain = async () => {
    setIsVerifyingChain(true);
    try {
      const res = await fetch('/api/audit-logs/verify-chain', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mocked-soc2-jwt-token',
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setChainVerifiedResult({
          verified: !data.tamperDetected,
          merkleRoot: data.merkleRoot,
          verifiedCount: data.verifiedCount,
          timeMs: data.verificationTimeMs
        });
      }
    } catch (err) {
      console.error('Error verifying cryptographic chain:', err);
    } finally {
      setIsVerifyingChain(false);
    }
  };

  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Event ID', 'Timestamp', 'Actor Name', 'Actor Email', 'Role', 'IP Address', 'Action', 'Category', 'Severity', 'Resource', 'Details', 'SOC2 Criterion', 'SHA256 Hash'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      `"${l.actor.name}"`,
      l.actor.email,
      l.actor.role,
      l.actor.ipAddress,
      l.action,
      l.category,
      l.severity,
      `"${l.resourceName}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.soc2Criterion}"`,
      l.integrityHash
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CAOMS_SOC2_Immutable_Audit_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper badge stylers
  const getSeverityBadge = (severity: AuditSeverity) => {
    return <SeverityBadge severity={severity} size="md" />;
  };

  const getCategoryBadge = (category: AuditCategory) => {
    switch (category) {
      case 'PRIVILEGE':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200"><UserCheck className="w-3 h-3" /> RBAC & Role</span>;
      case 'VAULT':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200"><Key className="w-3 h-3" /> Secret Vault</span>;
      case 'DATA_ACCESS':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200"><FileText className="w-3 h-3" /> File Access</span>;
      case 'AUTH':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"><Lock className="w-3 h-3" /> Authentication</span>;
      case 'BILLING':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200"><Activity className="w-3 h-3" /> Financial / Tax</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded"><Server className="w-3 h-3" /> System</span>;
    }
  };

  const categories = [
    { id: 'ALL', label: 'All Activities' },
    { id: 'AUTH', label: 'Logins & MFA' },
    { id: 'DATA_ACCESS', label: 'Vault Files & Access' },
    { id: 'PRIVILEGE', label: 'Role & Scope Changes' },
    { id: 'VAULT', label: 'Credential Reveals' },
    { id: 'BILLING', label: 'Invoicing & Tax' }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* Real-time Live Floating Alert Stack (Highlights repeated failed logins and critical threats) */}
      {activeAlerts.length > 0 && (
        <div className="fixed top-4 right-6 z-50 w-full max-w-md space-y-3 pointer-events-auto">
          {activeAlerts.map((alert) => {
            const isQuarantined = quarantinedIps.includes(alert.actor.ipAddress);
            return (
              <div 
                key={alert.id}
                className="bg-rose-950/95 text-white border-2 border-rose-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-200 flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-300 bg-rose-900/80 px-2 py-0.5 rounded border border-rose-700/50 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-400" /> LIVE THREAT DETECTED
                    </span>
                    <SeverityBadge severity={alert.severity} size="xs" showPulse={false} />
                  </div>

                  <button
                    onClick={() => handleDismissAlert(alert.id)}
                    className="text-rose-400 hover:text-white transition-colors text-xs p-1"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    {alert.action === 'LOGIN_FAILURE' 
                      ? 'Brute Force Authentication Attack' 
                      : alert.action === 'CREDENTIAL_REVEAL' 
                      ? 'Anomalous KMS Secret Decryption' 
                      : 'High-Risk Privilege / DLP Violation'}
                  </h4>
                  <p className="text-xs text-rose-200/90 mt-1 leading-relaxed line-clamp-2">
                    {alert.details}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-rose-900/60 p-2 rounded-lg border border-rose-800/40 text-rose-200 font-mono">
                  <span>IP: <strong className="text-white">{alert.actor.ipAddress}</strong></span>
                  <span>SOC2: <strong className="text-rose-300">{alert.soc2Criterion.split(' ')[0]}</strong></span>
                  <span className="text-rose-300">{new Date(alert.timestamp).toLocaleTimeString()} UTC</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-800/50">
                  <button
                    onClick={() => setSelectedLog(alert)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-900/80 text-rose-100 hover:bg-rose-800 transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> Forensics
                  </button>

                  <button
                    onClick={() => handleQuarantineIp(alert.actor.ipAddress, alert.id)}
                    disabled={isQuarantined || isQuarantining === alert.actor.ipAddress}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm ${
                      isQuarantined 
                        ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                        : 'bg-white text-rose-950 hover:bg-rose-100'
                    }`}
                  >
                    <ShieldBan className="w-3.5 h-3.5 text-rose-700" />
                    {isQuarantined 
                      ? 'IP Quarantined' 
                      : isQuarantining === alert.actor.ipAddress 
                      ? 'Applying WAF Rule...' 
                      : 'Quarantine IP on WAF'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-widest text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded uppercase border border-emerald-200">
                SOC2 Type II Compliant
              </span>
              <span className="text-[10px] font-bold tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase border border-indigo-200 flex items-center gap-1">
                <Fingerprint className="w-3 h-3" /> SHA-256 Immutable Ledger
              </span>
              <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded uppercase border flex items-center gap-1.5 ${
                isLiveActive 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isLiveActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                {isLiveActive ? 'Live Sentinel Active (3s)' : 'Live Polling Paused'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Security & SOC2 Audit Logs</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Append-only, tamper-evident forensic ledger with real-time threat detection for failed logins, KMS secret decryptions, and privilege escalations.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          
          {/* Live Stream Toggle */}
          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 shadow-sm ${
              isLiveActive 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
            }`}
            title={isLiveActive ? 'Pause real-time stream' : 'Resume real-time stream'}
          >
            {isLiveActive ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                Live Stream ON
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-zinc-600" />
                Resume Stream
              </>
            )}
          </button>

          <button
            onClick={handleVerifyChain}
            disabled={isVerifyingChain}
            className="px-3.5 py-2 text-xs font-semibold rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingChain ? 'animate-spin' : ''}`} />
            {isVerifyingChain ? 'Verifying Merkle Tree...' : 'Verify Ledger'}
          </button>
          
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold rounded-full bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Live Security Threat Simulation & Active Quarantine Toolbar */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 text-white rounded-2xl p-5 shadow-md border border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-100">Live Threat Simulator & Sentinel Testing</h3>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                Sandbox Mode
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Trigger simulated real-time attacks to test instant notifications, WAF auto-quarantines, and audit trail generation.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => handleSimulateIncident('BRUTE_FORCE')}
            disabled={isSimulating}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Flame className="w-3.5 h-3.5" />
            Simulate Brute Force Login (CC6.8)
          </button>

          <button
            onClick={() => handleSimulateIncident('KMS_TAMPER')}
            disabled={isSimulating}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Key className="w-3.5 h-3.5" />
            Simulate Geo KMS Breach (CC6.6)
          </button>

          <button
            onClick={() => handleSimulateIncident('DLP_EXPORT')}
            disabled={isSimulating}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-600/90 hover:bg-purple-500 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Simulate Bulk DLP Exfiltration (CC6.3)
          </button>

          <button
            onClick={() => handleSimulateIncident('SESSION_TIMEOUT')}
            disabled={isSimulating}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Clock className="w-3.5 h-3.5" />
            Simulate Inactivity Lock (CC6.1)
          </button>
        </div>
      </div>

      {/* Merkle Chain Verification Alert */}
      {chainVerifiedResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-950">
                Cryptographic Chain Validated: 100% Immutable ({chainVerifiedResult.verifiedCount} records verified in {chainVerifiedResult.timeMs}ms)
              </p>
              <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                Merkle Root: {chainVerifiedResult.merkleRoot}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setChainVerifiedResult(null)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SOC2 Key Control Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Recorded Events</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2">{logs.length}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Append-only immutable records</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">CC6.8 Threats & Failed Logins</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">
            {logs.filter(l => l.action === 'LOGIN_FAILURE' || l.severity === 'CRITICAL').length}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            {quarantinedIps.length} IPs quarantined on WAF
          </p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">CC6.1 Session Timeouts</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-700 mt-2">
            {logs.filter(l => l.action === 'SESSION_TIMEOUT').length}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            15m Inactivity auto-lock active
          </p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">CC6.6 KMS Secret Decrypts</span>
            <Key className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {logs.filter(l => l.category === 'VAULT').length}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Portal credentials accessed</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">WAF Protection State</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">Active</p>
          <p className="text-[11px] text-zinc-500 mt-1">Zero undetected tamper signatures</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-zinc-900 text-white font-semibold'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input & Severity Dropdown */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search actor, IP, resource, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white"
              />
            </form>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-900"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical (Immediate Review)</option>
              <option value="HIGH">Warning · High Risk</option>
              <option value="MEDIUM">Warning · Medium Risk</option>
              <option value="LOW">Low Risk</option>
              <option value="INFO">Informational (Info)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Immutable Audit Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/75 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Event ID / SOC 2 Tag</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Action & Category</th>
                <th className="py-3 px-4">Target Resource & Context</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Integrity Hash</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400 mb-2" />
                    Loading SOC2 immutable audit ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <ShieldAlert className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
                    No audit records match the selected search query or filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const date = new Date(log.timestamp);
                  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const formattedDate = date.toISOString().split('T')[0];
                  const isNewlyArrived = newlyArrivedIds.has(log.id);
                  const isQuarantined = quarantinedIps.includes(log.actor.ipAddress);

                  return (
                    <tr 
                      key={log.id} 
                      className={`transition-all duration-300 ${
                        isNewlyArrived 
                          ? 'bg-rose-50/90 font-medium' 
                          : log.severity === 'CRITICAL' || log.status === 'FLAGGED'
                          ? 'bg-rose-50/30 hover:bg-rose-50/60'
                          : log.severity === 'HIGH'
                          ? 'bg-amber-50/25 hover:bg-amber-50/50'
                          : 'hover:bg-zinc-50/80'
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-zinc-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isNewlyArrived && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                          )}
                          <span className="font-semibold text-zinc-900">{formattedDate}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500">{formattedTime} UTC</div>
                      </td>

                      {/* Event ID + SOC2 */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-zinc-800">{log.id}</span>
                          {log.status === 'FLAGGED' && (
                            <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded border border-rose-200">
                              FLAGGED
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{log.soc2Criterion}</div>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-zinc-900 truncate max-w-[180px]">
                          {log.actor.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-zinc-700">{log.actor.ipAddress}</span>
                          {isQuarantined && (
                            <span className="text-[9px] px-1 py-0.2 bg-rose-100 text-rose-700 rounded font-bold">
                              BLOCKED
                            </span>
                          )}
                          <span className="uppercase text-[9px] px-1 py-0.2 bg-zinc-100 text-zinc-600 rounded font-semibold">
                            {log.actor.role}
                          </span>
                        </div>
                      </td>

                      {/* Action & Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-zinc-900 flex items-center gap-1">
                          {log.action}
                        </div>
                        <div className="mt-1">{getCategoryBadge(log.category)}</div>
                      </td>

                      {/* Target Resource & Details */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-zinc-900 truncate" title={log.resourceName}>
                          {log.resourceName}
                        </div>
                        <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5" title={log.details}>
                          {log.details}
                        </p>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getSeverityBadge(log.severity)}
                      </td>

                      {/* Integrity Hash */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-[11px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                            {log.integrityHash.substring(0, 10)}...
                          </span>
                          <button
                            onClick={() => handleCopyHash(log.id, log.integrityHash)}
                            title="Copy SHA-256 HMAC Signature"
                            className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
                          >
                            {copiedHashId === log.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Inspect & Quick Quarantine */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {(log.severity === 'CRITICAL' || log.status === 'FLAGGED') && !isQuarantined && (
                            <button
                              onClick={() => handleQuarantineIp(log.actor.ipAddress, log.id)}
                              disabled={isQuarantining === log.actor.ipAddress}
                              title="Immediately block IP on Cloud Armor WAF"
                              className="px-2 py-1 text-[11px] font-bold rounded bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors flex items-center gap-1 border border-rose-200"
                            >
                              <ShieldBan className="w-3 h-3 text-rose-600" />
                              {isQuarantining === log.actor.ipAddress ? '...' : 'Block IP'}
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
          <span>Showing {logs.length} immutable events. Continuous monitoring active.</span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px]">Quarantined IPs: {quarantinedIps.join(', ') || 'None'}</span>
            <span className="font-mono text-[11px] text-zinc-400">|</span>
            <span className="font-mono text-[11px]">Tenant: firm_abc (Aarav Advisors)</span>
          </div>
        </div>
      </div>

      {/* Forensic Evidence Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 flex-wrap gap-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Terminal className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Forensic Evidence & SOC2 Payload: {selectedLog.id}
                </h3>
                <SeverityBadge severity={selectedLog.severity} size="sm" />
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                <div>
                  <span className="text-zinc-500 block">Event Timestamp:</span>
                  <span className="font-semibold text-zinc-900 font-mono">{selectedLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Security Severity:</span>
                  <div className="mt-1">
                    <SeverityBadge severity={selectedLog.severity} size="sm" format="category" />
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 block">SOC 2 Trust Criterion:</span>
                  <span className="font-semibold text-indigo-700">{selectedLog.soc2Criterion}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Initiating Actor:</span>
                  <span className="font-semibold text-zinc-900">{selectedLog.actor.name} ({selectedLog.actor.email})</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-zinc-500 block">Source IP & Role:</span>
                  <span className="font-semibold text-zinc-900 font-mono">{selectedLog.actor.ipAddress} [{selectedLog.actor.role.toUpperCase()}]</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1">
                  Full Context & Threat Analysis:
                </label>
                <div className="p-3 bg-zinc-100/70 border border-zinc-200 rounded-lg text-xs text-zinc-800 leading-relaxed">
                  {selectedLog.details}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1">
                  Cryptographic Integrity Signature:
                </label>
                <div className="p-2.5 bg-zinc-900 text-emerald-400 font-mono text-[11px] rounded-lg break-all border border-zinc-800 flex items-center justify-between">
                  <span>{selectedLog.integrityHash}</span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded uppercase font-sans font-bold ml-2 shrink-0">
                    HMAC Verified
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-1">
                  Raw Structured JSON Payload:
                </label>
                <pre className="p-3 bg-zinc-900 text-zinc-200 font-mono text-[11px] rounded-lg overflow-x-auto border border-zinc-800">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Immutable chain reference ID: {selectedLog.id}</span>
              <div className="flex items-center gap-2">
                {selectedLog.actor.ipAddress && !quarantinedIps.includes(selectedLog.actor.ipAddress) && (
                  <button
                    onClick={() => {
                      handleQuarantineIp(selectedLog.actor.ipAddress, selectedLog.id);
                      setSelectedLog(null);
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-colors flex items-center gap-1"
                  >
                    <ShieldBan className="w-3.5 h-3.5" /> Block {selectedLog.actor.ipAddress}
                  </button>
                )}
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
