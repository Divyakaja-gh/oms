import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  Lock,
  RefreshCw,
  Eye,
  ExternalLink,
  Search,
  Filter,
  Clock,
  Building2,
  Server,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sparkles,
  Plus,
  Shield,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { VaultCredentialItem, VaultStatusResponse, User, VaultCredentialCategory } from '../types';
import { VaultStatusBanner } from '../components/vault/VaultStatusBanner';
import { AddSecretModal } from '../components/vault/AddSecretModal';
import { RevealSecretModal } from '../components/vault/RevealSecretModal';
import { RotateSecretModal } from '../components/vault/RotateSecretModal';

export function Vault({ user }: { user?: User | null }) {
  const [credentials, setCredentials] = useState<VaultCredentialItem[]>([]);
  const [vaultStatus, setVaultStatus] = useState<VaultStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [revealingCred, setRevealingCred] = useState<VaultCredentialItem | null>(null);
  const [rotatingCred, setRotatingCred] = useState<VaultCredentialItem | null>(null);

  // Load Vault status and credentials from the backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, credsRes] = await Promise.all([
        fetch('/api/vault/status', {
          headers: { Authorization: `Bearer mock_user_${user?.id || 'admin'}` }
        }),
        fetch('/api/vault/credentials', {
          headers: { Authorization: `Bearer mock_user_${user?.id || 'admin'}` }
        })
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setVaultStatus(sData);
      }

      if (credsRes.ok) {
        const cData = await credsRes.json();
        setCredentials(cData);
      }
    } catch (error) {
      console.error('Failed to load vault data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/vault/test-connection', {
        method: 'POST',
        headers: { Authorization: `Bearer mock_user_${user?.id || 'admin'}` }
      });
      if (res.ok) {
        const updatedStatus = await fetch('/api/vault/status', {
          headers: { Authorization: `Bearer mock_user_${user?.id || 'admin'}` }
        });
        if (updatedStatus.ok) {
          setVaultStatus(await updatedStatus.json());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke and archive secret "${name}" from the vault?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/vault/credentials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer mock_user_${user?.id || 'admin'}` }
      });
      if (res.ok) {
        setCredentials(prev => prev.filter(c => c.id !== id));
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered credentials list
  const filteredCredentials = credentials.filter(c => {
    // Category match
    if (selectedCategory !== 'ALL') {
      if (selectedCategory === 'MCA_LOGIN' && c.category !== 'MCA_LOGIN') return false;
      if (selectedCategory === 'IT_PORTAL_KEY' && c.category !== 'IT_PORTAL_KEY') return false;
      if (selectedCategory === 'GST_PORTAL' && c.category !== 'GST_PORTAL') return false;
      if (selectedCategory === 'OTHER' && !['TRACES_TDS', 'EPFO_ESIC', 'BANKING_API', 'OTHER'].includes(c.category)) return false;
    }

    // Status match
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.name.toLowerCase().includes(q) ||
        c.system.toLowerCase().includes(q) ||
        c.identifier.toLowerCase().includes(q) ||
        (c.clientName && c.clientName.toLowerCase().includes(q)) ||
        c.secretManagerName.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Metric counts
  const countMca = credentials.filter(c => c.category === 'MCA_LOGIN').length;
  const countIt = credentials.filter(c => c.category === 'IT_PORTAL_KEY').length;
  const countGst = credentials.filter(c => c.category === 'GST_PORTAL').length;
  const countOther = credentials.filter(c => ['TRACES_TDS', 'EPFO_ESIC', 'BANKING_API', 'OTHER'].includes(c.category)).length;
  const countRequiresRotation = credentials.filter(c => c.status === 'Requires Rotation').length;

  return (
    <div className="min-h-full flex flex-col bg-[#FAFAFA]">
      {/* Top Header */}
      <div className="p-4 sm:p-6 lg:p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
                  Secure KMS & Google Secret Manager Vault
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Hardware Security Module (HSM) protected credentials for MCA21 V3, Income Tax CPC, and GSTN portal keys.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Secret to Vault
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
        {/* Google Secret Manager Live Diagnostics Banner */}
        <VaultStatusBanner
          status={vaultStatus}
          onRefresh={fetchData}
          onTestConnection={handleTestConnection}
          isTesting={isTesting}
        />

        {/* Search, Tabs, and Filter Bar */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-3">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                selectedCategory === 'ALL'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
              }`}
            >
              <span>All Credentials</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${selectedCategory === 'ALL' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-600'}`}>
                {credentials.length}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('MCA_LOGIN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                selectedCategory === 'MCA_LOGIN'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
              }`}
            >
              <span>MCA21 V3 Logins</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${selectedCategory === 'MCA_LOGIN' ? 'bg-indigo-700 text-indigo-200' : 'bg-zinc-200 text-zinc-600'}`}>
                {countMca}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('IT_PORTAL_KEY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                selectedCategory === 'IT_PORTAL_KEY'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
              }`}
            >
              <span>IT Portal Access Keys</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${selectedCategory === 'IT_PORTAL_KEY' ? 'bg-blue-700 text-blue-200' : 'bg-zinc-200 text-zinc-600'}`}>
                {countIt}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('GST_PORTAL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                selectedCategory === 'GST_PORTAL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
              }`}
            >
              <span>GST Portal Keys</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${selectedCategory === 'GST_PORTAL' ? 'bg-emerald-700 text-emerald-200' : 'bg-zinc-200 text-zinc-600'}`}>
                {countGst}
              </span>
            </button>

            <button
              onClick={() => setSelectedCategory('OTHER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                selectedCategory === 'OTHER'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600'
              }`}
            >
              <span>TRACES / TDS & Others</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${selectedCategory === 'OTHER' ? 'bg-purple-700 text-purple-200' : 'bg-zinc-200 text-zinc-600'}`}>
                {countOther}
              </span>
            </button>

            {countRequiresRotation > 0 && (
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'Requires Rotation' ? 'ALL' : 'Requires Rotation')}
                className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  selectedStatus === 'Requires Rotation'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>{countRequiresRotation} Require Rotation</span>
              </button>
            )}
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search credentials by system, client name, PAN, CIN, or username..."
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-zinc-200 rounded-xl text-xs bg-white text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-auto"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Requires Rotation">Requires Rotation</option>
                <option value="Expired">Expired</option>
              </select>

              <button
                onClick={fetchData}
                className="p-2 rounded-full border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors shrink-0"
                title="Refresh Vault Records"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-xs text-zinc-500">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-3" />
            Decrypting vault metadata from Google Secret Manager...
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 mx-auto">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">No credentials found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No vault entries match your filter criteria. Add a new credential to store it in Google Secret Manager.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Credential Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCredentials.map(cred => {
              const isRotationDue = cred.status === 'Requires Rotation';
              const isMca = cred.category === 'MCA_LOGIN';
              const isIt = cred.category === 'IT_PORTAL_KEY';

              return (
                <div
                  key={cred.id}
                  className={`bg-white rounded-2xl border p-5 transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                    isRotationDue
                      ? 'border-amber-300 bg-amber-50/10'
                      : 'border-zinc-200 hover:border-indigo-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isMca
                              ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                              : isIt
                              ? 'bg-blue-50 text-blue-600 border border-blue-100'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          <Key className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
                              {cred.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-700">
                              v{cred.currentVersion}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-zinc-500 font-medium">
                              {cred.system}
                            </span>
                            {cred.clientName && (
                              <>
                                <span className="text-zinc-300">•</span>
                                <span className="text-xs text-indigo-600 font-medium">
                                  {cred.clientName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 ${
                          isRotationDue
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isRotationDue && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                        {cred.status}
                      </span>
                    </div>

                    {/* Metadata specs */}
                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Identifier / User:</span>
                        <span className="font-mono text-zinc-900 font-bold bg-white px-2 py-0.5 rounded border border-zinc-200">
                          {cred.identifier}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Google Secret Manager ID:</span>
                        <span
                          className="font-mono text-[11px] text-zinc-600 truncate max-w-[220px]"
                          title={cred.secretManagerName}
                        >
                          {cred.secretManagerName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Access Tier:</span>
                        <span className="text-[11px] font-semibold text-zinc-700">
                          {cred.accessTier === 'PARTNER_ADMIN_ONLY'
                            ? 'Partner & Admin Only'
                            : 'Article Permitted (Audited)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 text-[11px]">
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          Rotation Cadence:
                        </span>
                        <span className={`font-semibold ${isRotationDue ? 'text-amber-700' : 'text-zinc-700'}`}>
                          {cred.rotationIntervalDays} Days ({isRotationDue ? 'Rotation Due!' : 'Compliant'})
                        </span>
                      </div>
                    </div>

                    {/* Masked Secret Preview */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-mono text-xs tracking-widest text-zinc-400 select-none">
                          ••••••••••••••••
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                          AES-256-GCM
                        </span>
                      </div>

                      {cred.portalUrl && (
                        <a
                          href={cred.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          Official Portal
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-4 mt-2 border-t border-zinc-100">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setRevealingCred(cred)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Reveal Secret
                      </button>

                      <button
                        onClick={() => setRotatingCred(cred)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                        title="Increment version in Google Secret Manager"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Rotate
                      </button>
                    </div>

                    <button
                      onClick={() => handleDelete(cred.id, cred.name)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Revoke & Archive Credential"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Add Secret to Google Secret Manager */}
      {isAddModalOpen && (
        <AddSecretModal
          user={user || null}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={newSecret => {
            setCredentials(prev => [newSecret, ...prev]);
            fetchData();
          }}
        />
      )}

      {/* MODAL 2: Reveal Decrypted Secret with SOC2 Justification & 30s Countdown */}
      {revealingCred && (
        <RevealSecretModal
          credential={revealingCred}
          user={user || null}
          onClose={() => setRevealingCred(null)}
          onSuccessDecrypted={() => {
            // Optional callback
          }}
        />
      )}

      {/* MODAL 3: Rotate Secret (New version in Google Secret Manager) */}
      {rotatingCred && (
        <RotateSecretModal
          credential={rotatingCred}
          user={user || null}
          onClose={() => setRotatingCred(null)}
          onSuccess={updated => {
            setCredentials(prev => prev.map(c => (c.id === updated.id ? updated : c)));
            fetchData();
          }}
        />
      )}
    </div>
  );
}
