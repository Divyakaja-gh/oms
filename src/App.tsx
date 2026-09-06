import { NotificationCenter } from './components/layout/NotificationCenter';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Menu, 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  CalendarDays, 
  MoreHorizontal,
  Bell,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { User, Role } from './types';

// Code-split heavy submodules for instant first paint and minimal bundle size
const Clients = React.lazy(() => import('./pages/Clients').then(m => ({ default: m.Clients })));
const Tasks = React.lazy(() => import('./pages/Tasks').then(m => ({ default: m.Tasks })));
const Compliance = React.lazy(() => import('./pages/Compliance').then(m => ({ default: m.Compliance })));
const Documents = React.lazy(() => import('./pages/Documents').then(m => ({ default: m.Documents })));
const Billing = React.lazy(() => import('./pages/Billing').then(m => ({ default: m.Billing })));
const Pitching = React.lazy(() => import('./pages/Pitching').then(m => ({ default: m.Pitching })));
const KnowledgeBase = React.lazy(() => import('./pages/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })));
const Vault = React.lazy(() => import('./pages/Vault').then(m => ({ default: m.Vault })));
const Reports = React.lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Support = React.lazy(() => import('./pages/Support').then(m => ({ default: m.Support })));
const AIAgent = React.lazy(() => import('./pages/AIAgent').then(m => ({ default: m.AIAgent })));
const APIKeys = React.lazy(() => import('./pages/APIKeys').then(m => ({ default: m.APIKeys })));
const Automations = React.lazy(() => import('./pages/Automations').then(m => ({ default: m.Automations })));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs').then(m => ({ default: m.AuditLogs })));
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { SessionInactivityModal } from './components/security/SessionInactivityModal';
import { TaxNewsTicker } from './components/news/TaxNewsTicker';
import { auth } from './lib/firebase';
import { signOut } from 'firebase/auth';
import { CreditProvider, useCredits } from './context/CreditContext';
import { CreditPill } from './components/credits/CreditPill';
import { CreditTopUpModal } from './components/credits/CreditTopUpModal';
import { OfflineBanner } from './components/OfflineBanner';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/layout/ThemeToggle';

const TAB_LABELS: Record<string, string> = {
  dashboard: 'Office Dashboard',
  clients: 'Client Database',
  tasks: 'Tasks & Filings',
  compliance: 'Compliance Calendar',
  statutory: 'Compliance Calendar',
  documents: 'Documents Vault',
  accounts: 'Accounts & Bills',
  vault: 'Credential Vault',
  audit: 'SOC2 Audit Logs',
  reports: 'MIS & Reports',
  pitching: 'Pitching Funnel',
  knowledge: 'Knowledge Base',
  support: 'Support & Tickets',
  agent: 'Autonomous Agents',
  apikeys: 'API & Webhooks',
  automations: 'Automations & Engine'
};

function AppInner() {
  const { isTopUpModalOpen, closeTopUpModal } = useCredits();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('caoms_session_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role && parsed.id) return parsed;
      }
    } catch (e) {}
    return null;
  });
  const [timeoutNotification, setTimeoutNotification] = useState<{
    reason: string;
    email?: string;
    role?: Role;
    timestamp?: string;
  } | null>(null);

  const handleLogout = useCallback((reason: string = 'MANUAL') => {
    try {
      localStorage.removeItem('caoms_session_user');
    } catch (e) {}
    signOut(auth).catch(() => {});

    if (user && reason === 'INACTIVITY_TIMEOUT') {
      setTimeoutNotification({
        reason: 'INACTIVITY_TIMEOUT',
        email: user.email,
        role: user.role,
        timestamp: new Date().toISOString(),
      });
    } else {
      setTimeoutNotification(null);
    }
    setUser(null);
    setActiveTab('dashboard');
  }, [user]);

  const {
    policy,
    remainingSeconds,
    isWarningOpen,
    isSimulating,
    extendSession,
    lockNow,
    simulateInactivity,
    updatePolicy,
  } = useSessionTimeout({
    user,
    onLogout: handleLogout,
  });

  const [restrictionInfo, setRestrictionInfo] = useState<{ isRestricted: boolean; reason?: string } | null>(null);

  // Check if current user is restricted in the access registry
  const checkRestriction = useCallback(() => {
    if (!user) {
      setRestrictionInfo(null);
      return;
    }
    try {
      const saved = localStorage.getItem('caoms_access_registry');
      if (saved) {
        const reg = JSON.parse(saved);
        if (Array.isArray(reg)) {
          const match = reg.find((u: any) => 
            u.email?.toLowerCase().trim() === user.email?.toLowerCase().trim() ||
            (user.role === 'partner' && u.email?.toLowerCase().includes('harikrishna')) ||
            (user.role === 'article' && u.email?.toLowerCase().includes('acc.aaravadvisors'))
          );
          if (match && match.status === 'RESTRICTED') {
            setRestrictionInfo({
              isRestricted: true,
              reason: match.restrictionReason || 'Administrative restriction applied by firm master'
            });
            return;
          }
        }
      }
      setRestrictionInfo(null);
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    checkRestriction();
    const handleRegistryChange = () => checkRestriction();
    window.addEventListener('access_registry_changed', handleRegistryChange);
    window.addEventListener('storage', handleRegistryChange);
    return () => {
      window.removeEventListener('access_registry_changed', handleRegistryChange);
      window.removeEventListener('storage', handleRegistryChange);
    };
  }, [checkRestriction]);

  const handleLogin = (newUser: User) => {
    setTimeoutNotification(null);
    setUser(newUser);
  };

  // Close mobile drawer when switching tabs
  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  if (!user) {
    return (
      <>
        <OfflineBanner />
        <Login
          onLogin={handleLogin}
          timeoutNotification={timeoutNotification}
          onDismissTimeoutNotification={() => setTimeoutNotification(null)}
        />
      </>
    );
  }

  // SOC2 Hard Access Enforcement: User is restricted
  if (restrictionInfo?.isRestricted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
              SOC2 CC6.1 Access Suspended
            </span>
            <h2 className="text-xl font-bold text-white mt-3">Portal Access Suspended</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Your portal privileges for <span className="text-zinc-200 font-semibold">{user.name}</span> ({user.email}) have been restricted by the Practice Administrator.
            </p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-left text-xs space-y-1">
            <span className="text-zinc-500 font-semibold">Restriction Justification:</span>
            <p className="text-rose-400 font-medium">{restrictionInfo.reason || 'Administrative temporary restriction'}</p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => handleLogout('MANUAL')}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow-lg transition-colors cursor-pointer"
            >
              Sign Out from Portal
            </button>
            <p className="text-[11px] text-zinc-500">
              For inquiry or reactivation, please contact <a href="mailto:info@aaravadvisors.in" className="text-indigo-400 hover:underline">info@aaravadvisors.in</a>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} setActiveTab={handleSelectTab} />;
      case 'clients':
        return <Clients />;
      case 'tasks':
        return <Tasks />;
      case 'compliance':
      case 'statutory':
        return <Compliance />;
      case 'documents':
        return <Documents />;
      case 'accounts':
        return <Billing />;
      case 'vault':
        return <Vault user={user} />;
      case 'audit':
        return <AuditLogs />;
      case 'reports':
        return <Reports />;
      case 'pitching':
        return <Pitching />;
      case 'knowledge':
        return <KnowledgeBase />;
      case 'support':
        return <Support user={user} />;
      case 'agent':
        return <AIAgent />;
      case 'apikeys':
        return <APIKeys />;
      case 'automations':
        return <Automations />;
      default:
        return (
          <div className="flex items-center justify-center h-full p-8 text-center">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 mb-2">Coming Soon</h2>
              <p className="text-zinc-500 text-sm">The {activeTab} module is under secure development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 font-sans overflow-hidden relative text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
      {/* Responsive Navigation Sidebar (Static on Desktop, Drawer on Mobile/Tablet) */}
      <Sidebar 
        currentRole={user.role} 
        activeTab={activeTab} 
        setActiveTab={handleSelectTab} 
        onLogout={() => handleLogout('MANUAL')} 
        user={user} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        sessionTimeout={{
          remainingSeconds,
          policy,
          isWarningOpen,
          onExtend: extendSession,
          onLockNow: () => lockNow('MANUAL_LOCK'),
          onSimulate: simulateInactivity,
          onUpdatePolicy: updatePolicy,
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full bg-[#FAFAFA] dark:bg-zinc-950 overflow-hidden transition-colors duration-150">
        {/* Offline Caching & Connectivity Banner */}
        <OfflineBanner />
        
        {/* Mobile & Tablet Header (< lg screens) */}
        <header className="lg:hidden h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 shrink-0 select-none transition-colors">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-1 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/60 rounded flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold text-xs shrink-0">
                AA
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">AARAV ADVISORS</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider truncate">
                  {TAB_LABELS[activeTab] || activeTab}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggle variant="compact" />
            <PWAInstallButton variant="header" />
            <CreditPill compact />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {user.role}
            </span>
            <div 
              className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800"
              title={user.name}
            >
              {user.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Real-time Tax News Ticker (Desktop only - hidden on mobile and tablet) */}
        <div className="hidden lg:block">
          <TaxNewsTicker />
        </div>

        {/* Dynamic Route View Scroll Container */}
        <div className="flex-1 overflow-y-auto pb-16 sm:pb-0">
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-64 p-8">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-zinc-500">Loading module securely...</span>
              </div>
            </div>
          }>
            {renderContent()}
          </React.Suspense>
        </div>

        {/* Mobile Handheld Bottom Navigation Bar (Quick Thumb Actions) */}
        <nav 
          className="sm:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 z-30 flex items-center justify-around px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
          aria-label="Mobile quick navigation"
        >
          <button
            type="button"
            onClick={() => handleSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('clients')}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === 'clients' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span>Clients</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('tasks')}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === 'tasks' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <CheckSquare className="w-5 h-5 mb-0.5" />
            <span>Tasks</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('compliance')}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === 'compliance' || activeTab === 'statutory' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <CalendarDays className="w-5 h-5 mb-0.5" />
            <span>Compliance</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* SOC2 Session Inactivity Warning Modal */}
      <SessionInactivityModal
        isOpen={isWarningOpen}
        remainingSeconds={remainingSeconds}
        policy={policy}
        user={user}
        onExtend={extendSession}
        onLogout={() => lockNow('USER_REQUESTED_LOCK')}
        onToggleSound={() => updatePolicy({ soundAlertEnabled: !policy.soundAlertEnabled })}
        isSimulating={isSimulating}
      />
      <NotificationCenter />

      {/* Autonomous Agent Credit Top Up Modal */}
      <CreditTopUpModal
        isOpen={isTopUpModalOpen}
        onClose={closeTopUpModal}
        onNavigateToBilling={() => handleSelectTab('accounts')}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CreditProvider>
        <AppInner />
      </CreditProvider>
    </ThemeProvider>
  );
}
