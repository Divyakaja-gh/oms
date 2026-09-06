import React, { useState } from 'react';
import { ShieldCheck, X, Sparkles, Key, Eye, EyeOff, Lock, AlertCircle, Building2, Globe } from 'lucide-react';
import { VaultCredentialCategory, VaultCredentialType, VaultCredentialItem, User } from '../../types';

interface AddSecretModalProps {
  user: User | null;
  onClose: () => void;
  onSuccess: (newSecret: VaultCredentialItem) => void;
}

const SYSTEM_DEFAULTS: Record<string, { category: VaultCredentialCategory; portalUrl: string; idPlaceholder: string }> = {
  'MCA21 V3 Portal': {
    category: 'MCA_LOGIN',
    portalUrl: 'https://www.mca.gov.in/content/mca/global/en/fop-portal.html',
    idPlaceholder: 'e.g. MCA_DIR_V3 or User ID (CIN: U72200KA2020PTC139821)'
  },
  'Income Tax CPC E-Filing': {
    category: 'IT_PORTAL_KEY',
    portalUrl: 'https://eportal.incometax.gov.in/iec/foservices/#/login',
    idPlaceholder: 'e.g. PAN: ABCDE1234F or TAN: BLRE12345F'
  },
  'GST Portal (GSTN / GSP)': {
    category: 'GST_PORTAL',
    portalUrl: 'https://services.gst.gov.in/services/login',
    idPlaceholder: 'e.g. GSTIN: 29ABCDE1234F1Z5 or GSP Username'
  },
  'TRACES (TDS Portal)': {
    category: 'TRACES_TDS',
    portalUrl: 'https://contents.tdscpc.gov.in/',
    idPlaceholder: 'e.g. TAN: BLRE12345F (User ID: TRACES_ADMIN)'
  },
  'EPFO / ESIC Portal': {
    category: 'EPFO_ESIC',
    portalUrl: 'https://unifiedportal-emp.epfindia.gov.in/',
    idPlaceholder: 'e.g. Est ID: BGBAN0012345000'
  },
  'Banking API / Payment Gateway': {
    category: 'BANKING_API',
    portalUrl: 'https://api.icicibank.com/corporate',
    idPlaceholder: 'e.g. Client ID / API Key ID'
  },
  'Other Corporate System': {
    category: 'OTHER',
    portalUrl: '',
    idPlaceholder: 'e.g. Login Username or Account ID'
  }
};

export function AddSecretModal({ user, onClose, onSuccess }: AddSecretModalProps) {
  const [system, setSystem] = useState('MCA21 V3 Portal');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<VaultCredentialCategory>('MCA_LOGIN');
  const [credentialType, setCredentialType] = useState<VaultCredentialType>('PORTAL_PASSWORD');
  const [identifier, setIdentifier] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [clientName, setClientName] = useState('');
  const [rotationIntervalDays, setRotationIntervalDays] = useState(90);
  const [accessTier, setAccessTier] = useState<'PARTNER_ADMIN_ONLY' | 'ARTICLE_PERMITTED' | 'ALL_STAFF'>('PARTNER_ADMIN_ONLY');
  const [notes, setNotes] = useState('');
  const [portalUrl, setPortalUrl] = useState(SYSTEM_DEFAULTS['MCA21 V3 Portal'].portalUrl);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSystemChange = (sys: string) => {
    setSystem(sys);
    const defaults = SYSTEM_DEFAULTS[sys];
    if (defaults) {
      setCategory(defaults.category);
      setPortalUrl(defaults.portalUrl);
    }
  };

  const generateStrongPassword = () => {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const symbols = '@#$%=!';
    
    let pass = '';
    pass += uppers[Math.floor(Math.random() * uppers.length)];
    pass += lowers[Math.floor(Math.random() * lowers.length)];
    pass += digits[Math.floor(Math.random() * digits.length)];
    pass += symbols[Math.floor(Math.random() * symbols.length)];

    const all = uppers + lowers + digits + symbols;
    for (let i = 0; i < 10; i++) {
      pass += all[Math.floor(Math.random() * all.length)];
    }

    const shuffled = pass.split('').sort(() => 0.5 - Math.random()).join('');
    setSecretValue(shuffled);
    setShowSecret(true);
  };

  const generateApiKey = () => {
    const chars = '0123456789abcdef';
    let key = 'sec_';
    for (let i = 0; i < 32; i++) {
      key += chars[Math.floor(Math.random() * chars.length)];
    }
    setSecretValue(key);
    setShowSecret(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !identifier.trim() || !secretValue.trim()) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/vault/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock_user_${user?.id || 'admin'}`
        },
        body: JSON.stringify({
          name,
          system,
          category,
          credentialType,
          identifier,
          secretValue,
          clientName: clientName.trim() || undefined,
          rotationIntervalDays: Number(rotationIntervalDays),
          accessTier,
          notes: notes.trim() || undefined,
          portalUrl: portalUrl.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save secret to Google Secret Manager.');
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to encrypt secret.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Provision Secret in Google Secret Manager</h3>
              <p className="text-[11px] text-zinc-500">
                AES-256-GCM Envelope Encryption & Cloud KMS CMEK Protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* System selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Target System / Portal <span className="text-red-500">*</span>
              </label>
              <select
                value={system}
                onChange={e => handleSystemChange(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {Object.keys(SYSTEM_DEFAULTS).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Credential Type <span className="text-red-500">*</span>
              </label>
              <select
                value={credentialType}
                onChange={e => setCredentialType(e.target.value as VaultCredentialType)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="PORTAL_PASSWORD">Portal Login & Password</option>
                <option value="API_ACCESS_KEY">Direct API Access Key / Bearer Token</option>
                <option value="DSC_PIN">Class-3 DSC Token PIN</option>
                <option value="OAUTH_SECRET">OAuth Client Secret</option>
                <option value="PRIVATE_KEY">Private Key / Certificate</option>
              </select>
            </div>
          </div>

          {/* Credential Name & Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Credential Title / Scope <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Acme Corp MCA V3 Director Login"
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Associated Client (Optional)
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="e.g. Acme Corp Private Limited"
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Identifier (PAN, TAN, Login ID) */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1.5">
              Account Identifier / Login ID / PAN / CIN <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder={SYSTEM_DEFAULTS[system]?.idPlaceholder || 'Enter identifier'}
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Secret Value & Generators */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800">
                Secret Value (Password / Token / Key) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  Gen MCA Password
                </button>
                <span className="text-zinc-300">|</span>
                <button
                  type="button"
                  onClick={generateApiKey}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  <Key className="w-3 h-3" />
                  Gen API Key
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                required
                type={showSecret ? 'text' : 'password'}
                value={secretValue}
                onChange={e => setSecretValue(e.target.value)}
                placeholder="Enter raw secret to encrypt at rest in Google Secret Manager"
                className="w-full px-3.5 py-2.5 pr-10 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-zinc-400">
              Payload is never logged in plaintext. Encrypted via AES-256-GCM before dispatch to Google Secret Manager.
            </p>
          </div>

          {/* Rotation Interval & Access Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Statutory Rotation Interval
              </label>
              <select
                value={rotationIntervalDays}
                onChange={e => setRotationIntervalDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value={90}>90 Days (MCA21 V3 Strict Compliance)</option>
                <option value={180}>180 Days (Semi-Annual IT Portal)</option>
                <option value={365}>365 Days (Annual DSC / API Key)</option>
                <option value={30}>30 Days (High Security)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Access Authorization Tier
              </label>
              <select
                value={accessTier}
                onChange={e => setAccessTier(e.target.value as any)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="PARTNER_ADMIN_ONLY">Partner & Admin Only</option>
                <option value="ARTICLE_PERMITTED">Article Clerk Permitted (With Audit)</option>
                <option value="ALL_STAFF">All Practice Staff</option>
              </select>
            </div>
          </div>

          {/* Portal URL & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Direct Portal Web URL
              </label>
              <input
                type="url"
                value={portalUrl}
                onChange={e => setPortalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Audit Notes / Operational Context
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Registered with Director DIN 08912345"
                className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-800 rounded-full hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-full shadow-sm transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              {loading ? 'Storing in Google Secret Manager...' : 'Provision in Google Secret Manager'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
