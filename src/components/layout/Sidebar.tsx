import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  FileSpreadsheet, 
  CalendarDays, 
  TrendingUp, 
  BookOpen,
  Key,
  BarChart3,
  LifeBuoy,
  Bot,
  Webhook,
  Workflow,
  ShieldCheck,
  Folder,
  LogOut,
  X,
  Zap,
  Bell,
  ScanText,
  UserCheck,
  ShieldAlert,
  MapPin,
  UserPlus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Role, User, SessionTimeoutPolicy } from '../../types';
import { SessionGuardIndicator } from '../security/SessionGuardIndicator';
import { useCredits } from '../../context/CreditContext';
import { PWAInstallButton } from '../PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';


interface SidebarProps {
  currentRole: Role;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  user: User;
  sessionTimeout?: {
    remainingSeconds: number;
    policy: SessionTimeoutPolicy;
    isWarningOpen: boolean;
    onExtend: () => void;
    onLockNow: () => void;
    onSimulate: (seconds?: number) => void;
    onUpdatePolicy: (policy: Partial<SessionTimeoutPolicy>) => void;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ currentRole, activeTab, setActiveTab, onLogout, user, sessionTimeout, isOpen = false, onClose }: SidebarProps) {
  const { account, openTopUpModal } = useCredits();
  const allNavItems = [
    { id: 'dashboard', label: 'Office Dashboard', icon: LayoutDashboard, roles: ['admin', 'partner', 'article', 'client'] },
    { id: 'users', label: 'User Management', icon: UserPlus, roles: ['admin'] },
    { id: 'team', label: 'Live Team & Attendance', icon: UserCheck, roles: ['admin', 'partner', 'article'] },
    { id: 'clients', label: 'Client Database', icon: Users, roles: ['admin', 'partner', 'article'] },
    { id: 'tasks', label: 'Tasks & Filings', icon: CheckSquare, roles: ['admin', 'partner', 'article'] },
    { id: 'compliance', label: 'Compliance', icon: CalendarDays, roles: ['admin', 'partner', 'article', 'client'] },
    { id: 'dsc', label: 'DSC Expiry Hub', icon: ShieldAlert, roles: ['admin', 'partner'] },
    { id: 'visits', label: 'Client Visits & Meetings', icon: MapPin, roles: ['admin', 'partner', 'article'] },
    { id: 'documents', label: 'Documents', icon: Folder, roles: ['admin', 'partner', 'article', 'client'] },
    { id: 'accounts', label: 'Accounts & Bills', icon: FileSpreadsheet, roles: ['admin', 'partner', 'client'] },
    { id: 'ocr', label: 'Invoice OCR Tool', icon: ScanText, roles: ['admin', 'partner', 'article', 'client'] },
    { id: 'vault', label: 'Credential Vault', icon: Key, roles: ['admin', 'partner'] },
    { id: 'audit', label: 'SOC2 Audit Logs', icon: ShieldCheck, roles: ['admin', 'partner'] },
    { id: 'reports', label: 'MIS & Reports', icon: BarChart3, roles: ['admin', 'partner'] },
    { id: 'pitching', label: 'Pitching Funnel', icon: TrendingUp, roles: ['admin', 'partner'] },
    { id: 'automations', label: 'Automations & Drips', icon: Workflow, roles: ['admin', 'partner'] },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, roles: ['admin', 'partner', 'article', 'client'] },
    { id: 'support', label: 'Support & Tickets', icon: LifeBuoy, roles: ['admin', 'partner', 'article', 'client'] },
    { id: 'agent', label: 'Autonomous Agents', icon: Bot, roles: ['admin', 'partner', 'article'] },
    // Temporarily disabled in navigation; functionality preserved in src/pages/APIKeys.tsx
    { id: 'apikeys', label: 'API & Webhooks', icon: Webhook, roles: ['admin'], disabled: true },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(currentRole) && !item.disabled);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile / Tablet Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-zinc-950/50 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      <aside 
        className={cn(
          "bg-[#F8F9FA] dark:bg-zinc-900 flex flex-col h-screen border-r border-zinc-200 dark:border-zinc-800 shrink-0 select-none transition-colors duration-150",
          // Desktop: permanently positioned
          "lg:static lg:w-64 lg:translate-x-0 lg:z-auto lg:shadow-none",
          // Mobile & Tablet: responsive slide-out drawer
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-5 sm:p-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 lg:border-b-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/60 rounded flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold">
              AA
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">AARAV ADVISORS</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold tracking-widest uppercase">Office System</span>
            </div>
          </div>

          {/* Close button on Mobile/Tablet */}
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 lg:hidden cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-5 sm:px-6 py-2">
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Primary Workspace</span>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer",
                  isActive 
                    ? "bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 shadow-xs font-semibold" 
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-200 font-medium"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500")} />
                  <span>{item.label}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
              </button>
            );
          })}
        </nav>

        {sessionTimeout && (
          <div className="px-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <SessionGuardIndicator
              user={user}
              remainingSeconds={sessionTimeout.remainingSeconds}
              policy={sessionTimeout.policy}
              isWarningOpen={sessionTimeout.isWarningOpen}
              onExtend={sessionTimeout.onExtend}
              onLockNow={sessionTimeout.onLockNow}
              onSimulate={sessionTimeout.onSimulate}
              onUpdatePolicy={sessionTimeout.onUpdatePolicy}
            />
          </div>
        )}

        {/* Agent Credit Balance Widget */}
        <div className="px-3 pt-2">
          <div className="bg-gradient-to-r from-indigo-50/80 to-indigo-100/50 dark:from-zinc-800 dark:to-zinc-800/80 border border-indigo-200/80 dark:border-zinc-700/80 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                <Zap className="w-3.5 h-3.5 fill-current" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-indigo-700/80 dark:text-indigo-400 block tracking-wider leading-none">AI Credits</span>
                <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-mono">
                  {account ? account.balance.toLocaleString() : '...'} <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">cr</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                if (onClose) onClose();
                openTopUpModal();
              }}
              className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-zinc-700 hover:bg-indigo-50 dark:hover:bg-zinc-600 px-2 py-1 rounded-md border border-indigo-200 dark:border-zinc-600 shadow-2xs transition-all cursor-pointer"
            >
              + Top Up
            </button>
          </div>
        </div>

        {/* PWA Offline Installation Button */}
        <div className="px-3 pt-2">
          <PWAInstallButton variant="header" />
        </div>

        {/* System Notifications Action */}
        <div className="px-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              window.dispatchEvent(new CustomEvent('open_notifications'));
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/90 hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/70 transition-all text-xs font-medium cursor-pointer shadow-2xs"
            aria-label="Open System Notifications"
          >
            <div className="flex items-center gap-2.5">
              <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Notifications & Status</span>
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">Open</span>
          </button>
        </div>

        {/* User-Accessible Theme Toggle */}
        <div className="px-3 pt-2">
          <ThemeToggle />
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center">
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">{user.name.substring(0, 2).toUpperCase()}</span>
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{user.name}</span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase">{user.role} SCOPE</span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (onClose) onClose();
              onLogout();
            }}
            className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors w-full cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Secure Logout
          </button>
        </div>
      </aside>
    </>
  );
}
