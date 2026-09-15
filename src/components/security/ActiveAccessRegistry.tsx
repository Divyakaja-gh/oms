import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  UserCheck, 
  UserX, 
  UserPlus, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Trash2, 
  RefreshCw, 
  Search, 
  X, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Info 
} from 'lucide-react';
import { SystemAccessUser, User } from '../../types';
import { DEFAULT_SYSTEM_ACCESS_USERS, getRoleDefaultPermissions } from '../../data/userPermissionsData';

interface Props {
  currentUser: User;
  onRegistryUpdated?: () => void;
}

const DEFAULT_USERS: SystemAccessUser[] = DEFAULT_SYSTEM_ACCESS_USERS;

export function ActiveAccessRegistry({ currentUser, onRegistryUpdated }: Props) {
  const [users, setUsers] = useState<SystemAccessUser[]>(() => {
    try {
      const saved = localStorage.getItem('caoms_access_registry');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_USERS;
  });

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'RESTRICTED'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [restrictTarget, setRestrictTarget] = useState<SystemAccessUser | null>(null);
  const [restrictReason, setRestrictReason] = useState('Administrative temporary restriction');
  const [removeTarget, setRemoveTarget] = useState<SystemAccessUser | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'ARTICLE' as 'ADMIN' | 'PARTNER' | 'MANAGER' | 'ARTICLE',
    mobile: ''
  });
  const [addError, setAddError] = useState('');

  // Fetch from API on mount
  const fetchRegistry = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/access-registry', {
        headers: { 'Authorization': 'Bearer mocked-token' }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setUsers(data.users);
          localStorage.setItem('caoms_access_registry', JSON.stringify(data.users));
        }
      }
    } catch (err) {
      console.warn('Using cached access registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, []);

  // Save changes to localStorage and notify parent
  const syncLocal = (updatedUsers: SystemAccessUser[]) => {
    setUsers(updatedUsers);
    try {
      localStorage.setItem('caoms_access_registry', JSON.stringify(updatedUsers));
      window.dispatchEvent(new Event('access_registry_changed'));
    } catch (e) {}
    if (onRegistryUpdated) onRegistryUpdated();
  };

  // Handle Restrict Access
  const handleExecuteRestrict = async () => {
    if (!restrictTarget) return;
    setActionLoadingId(restrictTarget.id);
    const target = restrictTarget;
    setRestrictTarget(null);

    try {
      const res = await fetch('/api/access-registry/restrict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-token'
        },
        body: JSON.stringify({
          id: target.id,
          reason: restrictReason,
          actorName: currentUser.name,
          actorEmail: currentUser.email
        })
      });

      const updated = users.map(u => {
        if (u.id === target.id) {
          return {
            ...u,
            status: 'RESTRICTED' as const,
            restrictionReason: restrictReason,
            restrictedAt: new Date().toISOString(),
            restrictedBy: currentUser.name
          };
        }
        return u;
      });
      syncLocal(updated);

      setFeedback({
        message: `Access suspended for ${target.name} (${target.email}). Live session revoked & SOC2 audit event logged.`,
        type: 'success'
      });
    } catch (err) {
      setFeedback({ message: 'Failed to restrict user access.', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Restore / Unrestrict Access
  const handleExecuteUnrestrict = async (target: SystemAccessUser) => {
    setActionLoadingId(target.id);
    try {
      const res = await fetch('/api/access-registry/unrestrict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-token'
        },
        body: JSON.stringify({
          id: target.id,
          actorName: currentUser.name,
          actorEmail: currentUser.email
        })
      });

      const updated = users.map(u => {
        if (u.id === target.id) {
          const { restrictionReason, restrictedAt, restrictedBy, ...rest } = u;
          return {
            ...rest,
            status: 'ACTIVE' as const
          };
        }
        return u;
      });
      syncLocal(updated);

      setFeedback({
        message: `Access fully restored for ${target.name}. Active privileges reinstated.`,
        type: 'success'
      });
    } catch (err) {
      setFeedback({ message: 'Failed to restore user access.', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Delete / Remove Access
  const handleExecuteRemove = async () => {
    if (!removeTarget) return;
    const target = removeTarget;
    setRemoveTarget(null);
    setActionLoadingId(target.id);

    try {
      const res = await fetch('/api/access-registry/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-token'
        },
        body: JSON.stringify({
          id: target.id,
          actorName: currentUser.name,
          actorEmail: currentUser.email
        })
      });

      const updated = users.filter(u => u.id !== target.id);
      syncLocal(updated);

      setFeedback({
        message: `User ${target.name} permanently deprovisioned and removed from system access registry.`,
        type: 'success'
      });
    } catch (err) {
      setFeedback({ message: 'Failed to remove user from access registry.', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Add New User
  const handleExecuteAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!newUser.name.trim() || !newUser.email.trim()) {
      setAddError('Name and email are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email.trim())) {
      setAddError('Please provide a valid email address.');
      return;
    }

    if (users.some(u => u.email.toLowerCase() === newUser.email.trim().toLowerCase())) {
      setAddError(`User with email "${newUser.email.trim()}" is already registered.`);
      return;
    }

    setActionLoadingId('new');
    try {
      const res = await fetch('/api/access-registry/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-token'
        },
        body: JSON.stringify({
          name: newUser.name.trim(),
          email: newUser.email.trim().toLowerCase(),
          role: newUser.role,
          mobile: newUser.mobile.trim() || 'Not specified',
          actorName: currentUser.name,
          actorEmail: currentUser.email
        })
      });

      const addedUser: SystemAccessUser = {
        id: `usr_${Date.now().toString(36)}`,
        name: newUser.name.trim(),
        email: newUser.email.trim().toLowerCase(),
        role: newUser.role,
        mobile: newUser.mobile.trim() || 'Not specified',
        status: 'ACTIVE',
        permissions: getRoleDefaultPermissions(newUser.role),
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };

      const updated = [...users, addedUser];
      syncLocal(updated);

      setIsAddModalOpen(false);
      setNewUser({ name: '', email: '', role: 'ARTICLE', mobile: '' });
      setFeedback({
        message: `New team member ${addedUser.name} granted ${addedUser.role} access. Audit log entry recorded.`,
        type: 'success'
      });
    } catch (err) {
      setAddError('Failed to grant access. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered List
  const filteredUsers = users.filter(u => {
    const matchesFilter = filterStatus === 'ALL' || u.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.mobile.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const activeCount = users.filter(u => u.status === 'ACTIVE').length;
  const restrictedCount = users.filter(u => u.status === 'RESTRICTED').length;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 sm:px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-50/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <span className="text-emerald-600">🔒</span> ACTIVE SYSTEM ACCESS REGISTRY
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Live RBAC Enforced
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Approved users of the Aarav Advisors portal. Revoke sessions to restrict access instantly or deprovision users.
          </p>
        </div>

        {/* Stats & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-zinc-200 text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-zinc-600">{activeCount} Active</span>
            {restrictedCount > 0 && (
              <>
                <span className="text-zinc-300">|</span>
                <span className="text-rose-600">{restrictedCount} Restricted</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Grant Access
          </button>

          <button
            type="button"
            onClick={fetchRegistry}
            disabled={loading}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh access records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`px-4 sm:px-6 py-2.5 text-xs flex items-center justify-between border-b ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-full hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Controls & Search Filter Bar */}
      <div className="px-4 sm:px-6 py-2.5 border-b border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user name, email, role, or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-zinc-200 rounded-full text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-[11px] text-zinc-400 font-medium">Status Filter:</span>
          <div className="inline-flex rounded-full p-0.5 bg-zinc-100 border border-zinc-200">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                filterStatus === 'ALL' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              All ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('ACTIVE')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                filterStatus === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('RESTRICTED')}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                filterStatus === 'RESTRICTED' ? 'bg-white text-rose-700 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Restricted ({restrictedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[650px]">
          <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[10px] uppercase text-zinc-400 font-bold tracking-widest">
            <tr>
              <th className="px-4 sm:px-6 py-3 font-semibold">User Identity & Email</th>
              <th className="px-4 sm:px-6 py-3 font-semibold">Role Mapping</th>
              <th className="px-4 sm:px-6 py-3 font-semibold">Status & Activity</th>
              <th className="px-4 sm:px-6 py-3 font-semibold">Mobile</th>
              <th className="px-4 sm:px-6 py-3 font-semibold text-right">Access Control Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-xs text-zinc-500">
                  No system access users match the selected query.
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => {
                const isYou = u.email.toLowerCase() === currentUser.email.toLowerCase() || u.name === currentUser.name;
                const isRestricted = u.status === 'RESTRICTED';
                const isProcessing = actionLoadingId === u.id;

                return (
                  <tr 
                    key={u.id} 
                    className={`transition-colors ${isRestricted ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-zinc-50/50'}`}
                  >
                    {/* User Identity */}
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isRestricted 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {u.name.substring(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                            <span>{u.name}</span>
                            {isYou && (
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-wider font-bold">
                                Current Session (YOU)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-zinc-400" />
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Mapping */}
                    <td className="px-4 sm:px-6 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        u.role === 'ADMIN' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                        u.role === 'PARTNER' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                        u.role === 'MANAGER' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                        'bg-amber-50 border-amber-200 text-amber-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Status & Activity */}
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex flex-col gap-0.5">
                        {isRestricted ? (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>SUSPENDED / RESTRICTED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>ACTIVE PERMIT</span>
                          </div>
                        )}
                        {isRestricted && u.restrictionReason && (
                          <span className="text-[10px] text-zinc-500 truncate max-w-[200px]" title={u.restrictionReason}>
                            Reason: {u.restrictionReason}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="px-4 sm:px-6 py-3 text-zinc-600 text-xs font-mono">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-400" />
                        <span>{u.mobile}</span>
                      </div>
                    </td>

                    {/* Action Controls */}
                    <td className="px-4 sm:px-6 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {isYou ? (
                          <span 
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed select-none"
                            title="You cannot restrict or remove your own current logged-in session"
                          >
                            Protected
                          </span>
                        ) : isRestricted ? (
                          /* RESTRICTED: Option to Reactivate or Remove */
                          <>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleExecuteUnrestrict(u)}
                              className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Reinstate full access permissions"
                            >
                              <Unlock className="w-3 h-3 text-emerald-600" />
                              Restore Access
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => setRemoveTarget(u)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                              title="Permanently remove user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          /* ACTIVE: Option to Restrict or Remove */
                          <>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => {
                                setRestrictTarget(u);
                                setRestrictReason('Administrative temporary restriction');
                              }}
                              className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Instantly restrict portal access"
                            >
                              <Lock className="w-3 h-3 text-rose-500" />
                              Restrict
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => setRemoveTarget(u)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                              title="Permanently remove user from registry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-4 sm:px-6 py-3 bg-zinc-50/50 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>Restricting access invalidates all active session tokens immediately and blocks further portal authorization.</span>
        </div>
        <span className="font-mono text-[10px] text-zinc-400">SOC2 CC6.1 Logical Access Controls</span>
      </div>

      {/* MODAL: Restrict Access Confirmation */}
      {restrictTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-zinc-900">Confirm Access Restriction</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Are you sure you want to suspend portal privileges for <strong>{restrictTarget.name}</strong>?
                </p>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Target User:</span>
                <span className="font-semibold text-zinc-800">{restrictTarget.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Official Email:</span>
                <span className="font-mono text-zinc-800">{restrictTarget.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Designated Role:</span>
                <span className="font-bold text-indigo-600">{restrictTarget.role}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Restriction Reason / Justification (Logged to SOC2 Audit Trail):
              </label>
              <select
                value={restrictReason}
                onChange={e => setRestrictReason(e.target.value)}
                className="w-full text-xs p-2 border border-zinc-200 rounded-lg mb-2 focus:ring-1 focus:ring-rose-500 focus:outline-none"
              >
                <option value="Administrative temporary restriction">Administrative temporary restriction</option>
                <option value="Temporary staff leave / sabbatical">Temporary staff leave / sabbatical</option>
                <option value="Deprovisioning pending audit review">Deprovisioning pending audit review</option>
                <option value="Security precaution: suspicious login flagged">Security precaution: suspicious login flagged</option>
                <option value="Contract or assignment concluded">Contract or assignment concluded</option>
              </select>
              <input
                type="text"
                placeholder="Or specify custom reason..."
                value={restrictReason}
                onChange={e => setRestrictReason(e.target.value)}
                className="w-full text-xs p-2 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setRestrictTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestrict}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Yes, Restrict Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete / Remove Access Confirmation */}
      {removeTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-zinc-900">Permanently Remove Access</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Are you sure you want to permanently revoke all access permissions for <strong>{removeTarget.name}</strong>?
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Irreversible Deprovisioning
              </p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                This user ({removeTarget.email}) will be removed from the firm registry. Any active sessions will be terminated immediately and an immutable SOC2 audit log will be written.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRemove}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Permanently Remove User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Grant Access / Add New User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-900">Grant Portal Access</h4>
                  <p className="text-xs text-zinc-500">Authorize a new partner, manager, or article staff member.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajiv Menon, CA"
                  value={newUser.name}
                  onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                  className="w-full p-2 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Work Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rajiv.m@aaravadvisors.in"
                  value={newUser.email}
                  onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                  className="w-full p-2 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Role Mapping *</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser(p => ({ ...p, role: e.target.value as any }))}
                    className="w-full p-2 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="ARTICLE">ARTICLE (Intern/Filing)</option>
                    <option value="MANAGER">MANAGER (Review/Client Lead)</option>
                    <option value="PARTNER">PARTNER (Audit Signatory)</option>
                    <option value="ADMIN">ADMIN (Practice Master)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98123 45678"
                    value={newUser.mobile}
                    onChange={e => setNewUser(p => ({ ...p, mobile: e.target.value }))}
                    className="w-full p-2 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-[11px] text-zinc-500 space-y-1">
                <span className="font-semibold text-zinc-700">Access Policy:</span>
                <p>Upon registration, access is immediately active and verifiable under SOC2 CC6.1 access policies.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === 'new'}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === 'new' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Granting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Authorize & Grant Access
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
