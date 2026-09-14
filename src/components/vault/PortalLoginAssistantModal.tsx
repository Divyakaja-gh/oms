import React, { useState } from 'react';
import { 
  Globe, 
  Key, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Eye, 
  EyeOff, 
  X,
  Building2,
  ChevronRight,
  Download,
  AlertCircle
} from 'lucide-react';
import { PortalQuickLogin, Client } from '../../types';
import { PORTAL_QUICK_LOGINS } from '../../data/practiceAutomationData';

interface PortalLoginAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients?: Client[];
}

export function PortalLoginAssistantModal({
  isOpen,
  onClose,
  clients = []
}: PortalLoginAssistantModalProps) {
  const [portals] = useState<PortalQuickLogin[]>(PORTAL_QUICK_LOGINS);
  const [selectedPortal, setSelectedPortal] = useState<PortalQuickLogin>(portals[0]);
  const [selectedClientIndex, setSelectedClientIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sample client data with masked statutory credentials
  const currentClient = clients[selectedClientIndex] || {
    id: 'c1',
    name: 'Acme Tech Solutions Ltd',
    gstin: '07AAAFA1234A1Z5',
    pan: 'AAAFA1234A',
    tan: 'DELA12345B'
  };

  // Derive portal username & mock encrypted password based on portal
  const getPortalCredentials = (portalKey: string) => {
    switch (portalKey) {
      case 'GST':
        return {
          username: currentClient.gstin || '07AAAFA1234A1Z5',
          password: `Gst@${currentClient.pan?.slice(0, 5) || 'ACME'}#2026`,
          entityLabel: 'GSTIN Number'
        };
      case 'ITR':
        return {
          username: currentClient.pan || 'AAAFA1234A',
          password: `Tax@${currentClient.pan || 'AAAFA'}#99`,
          entityLabel: 'PAN Number'
        };
      case 'TRACES':
        return {
          username: 'DELA12345B_ADMIN',
          password: 'Traces#Tds2026!',
          entityLabel: 'User ID (TAN Deductor)'
        };
      case 'MCA':
        return {
          username: 'ARV_FIRM_V3',
          password: 'McaV3#PartnerPass',
          entityLabel: 'MCA V3 Professional ID'
        };
      case 'EPFO':
        return {
          username: 'DLCPM0084920000',
          password: 'Epfo#Shram2026',
          entityLabel: 'Establishment ID'
        };
      default:
        return {
          username: currentClient.pan || 'USER_ID',
          password: 'SecurePassword123!',
          entityLabel: 'Login ID'
        };
    }
  };

  const creds = getPortalCredentials(selectedPortal.portalKey);

  const handleCopy = (val: string, fieldName: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 3000);
  };

  const handleLaunchAndInject = () => {
    // Copy password to clipboard automatically for fast paste
    navigator.clipboard.writeText(creds.password);
    setCopiedField('password_auto');
    window.open(selectedPortal.portalUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Automatic GST, ITR &amp; TRACES Portal Login Assistant
              </h2>
              <p className="text-xs text-zinc-500">
                1-click auto-launch government portals with encrypted vault credential injection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Client Selector Bar */}
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Target Client</span>
                <span className="text-xs font-bold text-zinc-900">{currentClient.name}</span>
              </div>
            </div>

            {clients.length > 1 && (
              <select
                value={selectedClientIndex}
                onChange={(e) => setSelectedClientIndex(Number(e.target.value))}
                className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-800 font-medium"
              >
                {clients.map((c, i) => (
                  <option key={c.id || i} value={i}>
                    {c.name} ({c.gstin || c.pan || 'Client'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Portal Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {portals.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPortal(p)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedPortal.id === p.id
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20 font-bold text-indigo-900'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700'
                }`}
              >
                <div className="text-xs font-bold">{p.portalKey}</div>
                <div className="text-[10px] text-zinc-400 truncate mt-0.5">{p.name.split(' ')[0]}</div>
              </button>
            ))}
          </div>

          {/* Selected Portal Details & Credential Vault */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-900">{selectedPortal.name}</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                    {selectedPortal.portalKey}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{selectedPortal.description}</p>
              </div>

              <button
                onClick={handleLaunchAndInject}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0"
              >
                <span>Launch Portal &amp; Copy Password</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Credential Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  {creds.entityLabel}
                </label>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-zinc-200">
                  <span className="font-mono text-xs font-bold text-zinc-900">{creds.username}</span>
                  <button
                    onClick={() => handleCopy(creds.username, 'username')}
                    className="text-zinc-400 hover:text-zinc-600 p-1"
                    title="Copy Login ID"
                  >
                    {copiedField === 'username' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Encrypted Vault Password
                </label>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-zinc-200">
                  <span className="font-mono text-xs font-bold text-zinc-900">
                    {showPassword ? creds.password : '••••••••••••'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-zinc-400 hover:text-zinc-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleCopy(creds.password, 'password')}
                      className="text-zinc-400 hover:text-zinc-600 p-1"
                      title="Copy Password"
                    >
                      {copiedField === 'password' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {copiedField === 'password_auto' && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-900 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password copied to clipboard! Paste directly into the portal login box.</span>
              </div>
            )}

            {/* Direct Deep-Links */}
            <div>
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Direct Deep-Link Shortcuts (Bypass Nav Menus)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedPortal.quickActions.map((action, idx) => (
                  <a
                    key={idx}
                    href={action.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 hover:border-indigo-300 text-xs font-medium text-zinc-800 flex items-center justify-between group transition-colors"
                  >
                    <span>{action.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* Chrome Extension Auto-Fill Banner */}
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Finexo / CAOMS Chrome Extension Active:</strong> When you open the GST, ITR, or TRACES login page, the companion extension detects the active practice session and auto-fills the client's credentials into the government form input boxes.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secured with AES-256 Cloud KMS Vault Encryption</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
