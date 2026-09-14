import { DashboardWeather } from '../components/layout/DashboardWeather';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { User } from '../types';
import { ShieldAlert, Users, CalendarDays, ArrowUpRight, TrendingUp, UserCheck, Key, MapPin, Globe, Sparkles } from 'lucide-react';
import { ActiveAccessRegistry } from '../components/security/ActiveAccessRegistry';
import { RecentActivityWidget } from '../components/dashboard/RecentActivityWidget';
import { TaskSentinelWidget } from '../components/automation/TaskSentinelWidget';
import { PortalLoginAssistantModal } from '../components/vault/PortalLoginAssistantModal';

interface Props {
  user: User;
  setActiveTab: (tab: string) => void;
}

export function Dashboard({ user, setActiveTab }: Props) {
  const [isWiping, setIsWiping] = useState(false);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [metrics, setMetrics] = useState({ clients: 0, tasks: 0, receivables: 0, pipeline: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }
    const uid = auth.currentUser.uid;
    let cLoaded = false, tLoaded = false, iLoaded = false, pLoaded = false;
    
    const checkLoaded = () => {
      if (cLoaded && tLoaded && iLoaded && pLoaded) setIsLoading(false);
    };

    const unsubC = onSnapshot(query(collection(db, 'clients'), where('ownerId', '==', uid)), snap => {
      setMetrics(p => ({ ...p, clients: snap.size }));
      cLoaded = true; checkLoaded();
    });
    const unsubT = onSnapshot(query(collection(db, 'tasks'), where('ownerId', '==', uid)), snap => {
      setMetrics(p => ({ ...p, tasks: snap.size }));
      tLoaded = true; checkLoaded();
    });
    const unsubI = onSnapshot(query(collection(db, 'invoices'), where('ownerId', '==', uid)), snap => {
      let t = 0; snap.forEach(doc => { if (doc.data().status !== 'Paid') t += Number(doc.data().amount) || 0; });
      setMetrics(p => ({ ...p, receivables: t }));
      iLoaded = true; checkLoaded();
    });
    const unsubP = onSnapshot(query(collection(db, 'prospects'), where('ownerId', '==', uid)), snap => {
      let t = 0; snap.forEach(doc => { t += Number(doc.data().value) || 0; });
      setMetrics(p => ({ ...p, pipeline: t }));
      pLoaded = true; checkLoaded();
    });

    return () => { unsubC(); unsubT(); unsubI(); unsubP(); };
  }, []);

  const handleWipeData = async () => {
    if (window.confirm("Are you sure you want to securely wipe all sample data? This action is logged and irreversible.")) {
      setIsWiping(true);
      try {
        const res = await fetch('/api/system/wipe', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mocked-token',
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          alert('Data wiped successfully.');
        } else {
          alert('Error: Only Admins can perform this action.');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsWiping(false);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg sm:text-xl shrink-0">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase border border-indigo-100">Admin Workspace</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Hello, {user.name}!</h1>
            <p className="text-xs sm:text-sm text-zinc-500">Welcome back to the portal. Coordinate statutory deadlines, compliance filings, and audits today.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <DashboardWeather />
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setActiveTab('clients')}
              className="flex-1 sm:flex-none px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-xs sm:text-sm font-semibold rounded-full hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer text-center"
            >
              + Add Client
            </button>
            <button 
              onClick={() => setActiveTab('tasks')}
              className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white text-xs sm:text-sm font-semibold rounded-full hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer text-center"
            >
              + Create Task
            </button>
            <button 
              onClick={() => setActiveTab('accounts')}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-full hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer text-center"
            >
              ₹ New Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Access Credentials Banner */}
      <div className="bg-[#FFF8F8] border border-rose-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 rounded-full shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-2">
              ACCESS CREDENTIALS REQUEST APPROVALS
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">Authorization console for new staff, partners, and corporate client portals.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {user.role === 'admin' && (
            <button 
              onClick={handleWipeData}
              disabled={isWiping}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 bg-white border border-rose-200 px-3.5 py-1.5 rounded-full shadow-sm disabled:opacity-50 cursor-pointer transition-colors hover:bg-rose-50"
            >
              {isWiping ? 'Wiping...' : 'Clear/Wipe Practice Sample Data'}
            </button>
          )}
          <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full">0 PENDING</span>
        </div>
      </div>

      {/* Active System Access Registry (SOC2 Functional Access Controls) */}
      <ActiveAccessRegistry currentUser={user} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: 'TOTAL CORPORATE CLIENTS', value: metrics.clients.toString(), link: 'Manage Database', tab: 'clients', icon: Users, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
          { title: 'PENDING / ACTIVE TASKS', value: metrics.tasks.toString(), subtitle: 'All checklists healthy', link: 'View Tasks', tab: 'tasks', icon: CalendarDays, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
          { title: 'OUTSTANDING RECEIVABLES', value: `₹ ${metrics.receivables.toLocaleString()}`, link: 'Track Invoices', tab: 'accounts', icon: TrendingUp, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          { title: 'BD PITCHING FUNNEL', value: `₹ ${metrics.pipeline.toLocaleString()}`, subtitle: `${metrics.pipeline > 0 ? 'Prospects active' : '0 prospects active'}`, link: 'View Pipeline', tab: 'pitching', icon: ArrowUpRight, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
        ].map((kpi, i) => (
          <div key={i} onClick={() => kpi.tab && setActiveTab(kpi.tab)} className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-sm flex items-center justify-between group cursor-pointer hover:border-indigo-300 transition-colors relative overflow-hidden">
            {isLoading ? (
              <div className="w-full">
                 <div className="h-3 w-32 bg-zinc-200 rounded animate-pulse mb-3"></div>
                 <div className="h-8 w-16 bg-zinc-200 rounded animate-pulse mb-2"></div>
                 <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-1">{kpi.title}</h4>
                  <div className="text-xl sm:text-2xl font-bold text-zinc-900 mb-1">{kpi.value}</div>
                  {kpi.subtitle ? (
                    <div className="text-xs text-emerald-600 font-medium">{kpi.subtitle}</div>
                  ) : (
                    <div className="text-xs text-indigo-600 font-medium flex items-center gap-1 group-hover:underline">
                      {kpi.link} <ArrowUpRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Finexo PMS Self-Operating Practice Controls Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Self-Operating CA Practice Automation Hub</h3>
              <p className="text-xs text-zinc-500">Live team operations, automated statutory logins, and proactive compliance alerts</p>
            </div>
          </div>

          <button
            onClick={() => setIsPortalModalOpen(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>1-Click Portal Login (GST / ITR / TRACES)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setActiveTab('team')}
            className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 hover:border-indigo-300 text-left transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 block">Live Team &amp; Attendance</span>
                <span className="text-[11px] text-zinc-500">Check-in, biometric logs &amp; active desks</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 transition-colors" />
          </button>

          <button
            onClick={() => setActiveTab('dsc')}
            className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 hover:border-amber-300 text-left transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 block">DSC Expiry Radar</span>
                <span className="text-[11px] text-zinc-500">Token tracking &amp; renewal alerts</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-600 transition-colors" />
          </button>

          <button
            onClick={() => setActiveTab('visits')}
            className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100 hover:border-teal-300 text-left transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 block">Client Visits &amp; Hearings</span>
                <span className="text-[11px] text-zinc-500">Statutory audits, ITO visits &amp; MoMs</span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-teal-600 transition-colors" />
          </button>
        </div>
      </div>

      {/* Task Sentinel: Task-Not-Created Real-time Alerts */}
      <TaskSentinelWidget />

      {/* Live Recent Activity Stream from AuditLogs module */}
      <RecentActivityWidget setActiveTab={setActiveTab} />

      {/* 1-Click Government Portal Login Assistant Modal */}
      <PortalLoginAssistantModal
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
      />
    </div>
  );
}
