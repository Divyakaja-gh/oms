import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  RefreshCw, 
  Search, 
  X, 
  Edit3, 
  Sliders, 
  FileSpreadsheet, 
  CheckSquare, 
  Square, 
  Building2, 
  Phone, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  Info,
  UserCheck,
  UserX,
  Layers,
  Sparkles
} from 'lucide-react';
import { User, SystemAccessUser, SystemRole } from '../types';
import { 
  SYSTEM_PERMISSIONS, 
  PERMISSION_CATEGORIES, 
  DEFAULT_ROLE_PERMISSIONS, 
  DEFAULT_SYSTEM_ACCESS_USERS,
  getRoleDefaultPermissions 
} from '../data/userPermissionsData';
import { INITIAL_CLIENTS } from '../data/clientAndProposalData';

interface UserManagementProps {
  currentUser: User;
  onSimulateLogin?: (targetUser: User) => void;
}

export function UserManagement({ currentUser, onSimulateLogin }: UserManagementProps) {
  // If not admin, block with SOC2 CC6.1 access denial
  if (currentUser.role !== 'admin') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-8 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              SOC 2 CC6.1 Logical Access Control
            </span>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-3 font-serif">
              Administrative Access Restricted
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-md mx-auto">
              The User Management & Permissions Matrix is restricted strictly to the <strong>Practice Master (Admin)</strong>. Your current role is <strong className="uppercase text-amber-600 dark:text-amber-400">{currentUser.role}</strong>.
            </p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 max-w-md mx-auto text-left text-xs text-zinc-500 space-y-1">
            <p><span className="font-semibold text-zinc-700 dark:text-zinc-300">Policy:</span> Aarav Advisors Practice Security Standard § 4.2</p>
            <p><span className="font-semibold text-zinc-700 dark:text-zinc-300">Requirement:</span> Only the single master company administrator account may provision partners, article staff, and clients.</p>
          </div>
        </div>
      </div>
    );
  }

  // State
  const [users, setUsers] = useState<SystemAccessUser[]>(() => {
    try {
      const saved = localStorage.getItem('caoms_access_registry');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure each has permissions array
          return parsed.map((u: any) => ({
            ...u,
            permissions: Array.isArray(u.permissions) ? u.permissions : getRoleDefaultPermissions(u.role)
          }));
        }
      }
    } catch (e) {}
    return DEFAULT_SYSTEM_ACCESS_USERS;
  });

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<SystemAccessUser | null>(null);
  const [restrictTarget, setRestrictTarget] = useState<SystemAccessUser | null>(null);
  const [restrictReason, setRestrictReason] = useState('Administrative temporary restriction');
  const [deleteTarget, setDeleteTarget] = useState<SystemAccessUser | null>(null);

  // Form State for Add User
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'ARTICLE' as SystemRole,
    mobile: '',
    passcode: Math.floor(1000 + Math.random() * 9000).toString(),
    assignedClientId: '',
    permissions: getRoleDefaultPermissions('ARTICLE')
  });
  const [formError, setFormError] = useState('');

  // Fetch from backend on mount
  const fetchRegistry = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/access-registry', {
        headers: { 
          'Authorization': 'Bearer mocked-token',
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users) && data.users.length > 0) {
          const formatted: SystemAccessUser[] = data.users.map((u: any) => ({
            ...u,
            permissions: Array.isArray(u.permissions) && u.permissions.length > 0
              ? u.permissions 
              : getRoleDefaultPermissions(u.role)
          }));
          setUsers(formatted);
          localStorage.setItem('caoms_access_registry', JSON.stringify(formatted));
        }
      }
    } catch (err) {
      console.warn('Backend registry sync note:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, []);

  // Save to local storage and broadcast
  const syncLocal = (updated: SystemAccessUser[]) => {
    setUsers(updated);
    try {
      localStorage.setItem('caoms_access_registry', JSON.stringify(updated));
      window.dispatchEvent(new Event('access_registry_changed'));
    } catch (e) {}
  };

  // Role change in Add Form -> auto update permission defaults
  const handleRoleChange = (newRole: SystemRole) => {
    const defaults = getRoleDefaultPermissions(newRole);
    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: [...defaults],
      assignedClientId: newRole === 'CLIENT' ? (INITIAL_CLIENTS[0]?.id || '') : ''
    }));
  };

  // Toggle permission checkbox in Add Form
  const toggleAddPermission = (permId: string) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(permId);
      const updated = exists 
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: updated };
    });
  };

  // Toggle permission checkbox in Edit Modal
  const toggleEditPermission = (permId: string) => {
    if (!editingPermissionsUser) return;
    const exists = editingPermissionsUser.permissions.includes(permId);
    const updated = exists
      ? editingPermissionsUser.permissions.filter(p => p !== permId)
      : [...editingPermissionsUser.permissions, permId];
    setEditingPermissionsUser({
      ...editingPermissionsUser,
      permissions: updated
    });
  };

  // Submit Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim().toLowerCase();

    if (!cleanName) {
      setFormError('Please provide the user full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Please enter a valid business email address.');
      return;
    }
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      setFormError(`User with email "${cleanEmail}" already exists in the company registry.`);
      return;
    }
    if (formData.permissions.length === 0) {
      setFormError('Please select at least one permission checkbox for this user.');
      return;
    }

    const assignedClient = formData.role === 'CLIENT' 
      ? INITIAL_CLIENTS.find(c => c.id === formData.assignedClientId) 
      : undefined;

    setLoading(true);
    try {
      const payload = {
        name: cleanName,
        email: cleanEmail,
        role: formData.role,
        mobile: formData.mobile.trim() || 'Not specified',
        permissions: formData.permissions,
        passcode: formData.passcode || Math.floor(1000 + Math.random() * 9000).toString(),
        assignedClientId: assignedClient?.id,
        assignedClientName: assignedClient?.name,
        actorName: currentUser.name,
        actorEmail: currentUser.email
      };

      const res = await fetch('/api/access-registry/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-token'
        },
        body: JSON.stringify(payload)
      });

      const newUser: SystemAccessUser = {
        id: `usr_${Date.now().toString(36)}`,
        name: cleanName,
        email: cleanEmail,
        role: formData.role,
        mobile: formData.mobile.trim() || 'Not specified',
        status: 'ACTIVE',
        permissions: formData.permissions,
        passcode: formData.passcode,
        assignedClientId: assignedClient?.id,
        assignedClientName: assignedClient?.name,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };

      if (res.ok) {
        const data = await res.json();
        if (data.user?.id) newUser.id = data.user.id;
      }

      const updated = [...users, newUser];
      syncLocal(updated);

      setIsAddUserModalOpen(false);
      setFormData({
        name: '',
        email: '',
        role: 'ARTICLE',
        mobile: '',
        passcode: Math.floor(1000 + Math.random() * 9000).toString(),
        assignedClientId: '',
        permissions: getRoleDefaultPermissions('ARTICLE')
      });

      setFeedback({
        message: `User ${newUser.name} (${newUser.role}) provisioned successfully with ${newUser.permissions.length} granular permissions.`,
        type: 'success'
      });
    } catch (err: any) {
      setFormError('Failed to save user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save Modified Permissions in Edit Modal
  const handleSaveEditedPermissions = async () => {
    if (!editingPermissionsUser) return;
    setLoading(true);

    try {
      await fetch('/api/access-registry/update-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-token'
        },
        body: JSON.stringify({
          id: editingPermissionsUser.id,
          permissions: editingPermissionsUser.permissions,
          role: editingPermissionsUser.role,
          actorName: currentUser.name,
          actorEmail: currentUser.email
        })
      });

      const updated = users.map(u => 
        u.id === editingPermissionsUser.id 
          ? { ...u, permissions: editingPermissionsUser.permissions, role: editingPermissionsUser.role }
          : u
      );
      syncLocal(updated);

      setFeedback({
        message: `Permissions updated for ${editingPermissionsUser.name}: ${editingPermissionsUser.permissions.length} capabilities now active.`,
        type: 'success'
      });
      setEditingPermissionsUser(null);
    } catch (err) {
      setFeedback({
        message: 'Could not sync permission update to server.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle Restrict / Unrestrict
  const handleToggleStatus = async (user: SystemAccessUser) => {
    if (user.status === 'ACTIVE') {
      setRestrictTarget(user);
      setRestrictReason('Administrative temporary restriction');
    } else {
      // Unrestrict directly
      setLoading(true);
      try {
        await fetch('/api/access-registry/unrestrict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mocked-token'
          },
          body: JSON.stringify({
            id: user.id,
            actorName: currentUser.name,
            actorEmail: currentUser.email
          })
        });

        const updated = users.map(u => {
          if (u.id === user.id) {
            const copy = { ...u, status: 'ACTIVE' as const };
            delete copy.restrictionReason;
            delete copy.restrictedAt;
            delete copy.restrictedBy;
            return copy;
          }
          return u;
        });
        syncLocal(updated);

        setFeedback({
          message: `Access restored for ${user.name}. Account is now Active.`,
          type: 'success'
        });
      } catch (err) {
        setFeedback({ message: 'Failed to restore access.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmRestrict = async () => {
    if (!restrictTarget) return;
    setLoading(true);
    try {
      await fetch('/api/access-registry/restrict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-token'
        },
        body: JSON.stringify({
          id: restrictTarget.id,
          reason: restrictReason,
          actorName: currentUser.name,
          actorEmail: currentUser.email
        })
      });

      const updated = users.map(u => {
        if (u.id === restrictTarget.id) {
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
        message: `Access suspended for ${restrictTarget.name}. Portal access blocked.`,
        type: 'success'
      });
      setRestrictTarget(null);
    } catch (err) {
      setFeedback({ message: 'Failed to restrict user.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Delete User
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await fetch('/api/access-registry/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mocked-token'
        },
        body: JSON.stringify({
          id: deleteTarget.id,
          actorName: currentUser.name,
          actorEmail: currentUser.email
        })
      });

      const updated = users.filter(u => u.id !== deleteTarget.id);
      syncLocal(updated);

      setFeedback({
        message: `User ${deleteTarget.name} permanently removed from access registry.`,
        type: 'success'
      });
      setDeleteTarget(null);
    } catch (err) {
      setFeedback({ message: 'Failed to remove user.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Copy PIN
  const handleCopyPin = (user: SystemAccessUser) => {
    const pin = user.passcode || '9001';
    navigator.clipboard?.writeText(pin);
    setCopiedPinId(user.id);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.mobile && u.mobile.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
      const matchStatus = selectedStatusFilter === 'ALL' || u.status === selectedStatusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'ACTIVE').length,
      restricted: users.filter(u => u.status === 'RESTRICTED').length,
      partners: users.filter(u => u.role === 'PARTNER').length,
      articles: users.filter(u => u.role === 'ARTICLE').length,
      clients: users.filter(u => u.role === 'CLIENT').length
    };
  }, [users]);

  // Export Matrix
  const handleExportMatrix = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(users, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Aarav_Advisors_Access_Matrix_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      
      {/* Top Banner: Single Company Login Architecture Context */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-zinc-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none bg-[radial-gradient(#6366F1_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Single Company Master Login
              </span>
              <span className="text-[10px] font-semibold text-zinc-400">
                FRN: 014892N • Aarav Advisors
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-amber-400" />
              Company User & Access Management
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              One master login authenticates the practice. From this control module, the Practice Master provisions team members, partners, and corporate clients, assigning granular access permissions via customizable checkboxes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
            <button
              onClick={handleExportMatrix}
              title="Download SOC 2 Matrix"
              className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Matrix</span>
            </button>
            <button
              onClick={fetchRegistry}
              disabled={loading}
              title="Refresh Registry"
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Users</span>
          <div className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{stats.total}</div>
          <span className="text-[10px] text-zinc-500">Under firm master</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active</span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.active}</div>
          <span className="text-[10px] text-zinc-500">Full login access</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Suspended</span>
          <div className="text-xl font-bold text-rose-500 mt-0.5">{stats.restricted}</div>
          <span className="text-[10px] text-zinc-500">SOC2 CC6.1 locked</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Partners</span>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{stats.partners}</div>
          <span className="text-[10px] text-zinc-500">Audit sign-off leads</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Articles</span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.articles}</div>
          <span className="text-[10px] text-zinc-500">Filing trainees</span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Clients</span>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{stats.clients}</div>
          <span className="text-[10px] text-zinc-500">Portal accounts</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-zinc-400 mr-1 hidden md:inline">Role:</span>
            {['ALL', 'ADMIN', 'PARTNER', 'ARTICLE', 'CLIENT', 'MANAGER'].map(role => (
              <button
                key={role}
                onClick={() => setSelectedRoleFilter(role)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedRoleFilter === role
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            {['ALL', 'ACTIVE', 'RESTRICTED'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedStatusFilter === st
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Users Registry Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-4">User & Contact</th>
                <th className="py-3 px-4">Role & Scope</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Granted Capabilities</th>
                <th className="py-3 px-4">Quick PIN</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <Users className="w-8 h-8 mx-auto text-zinc-400 mb-2 opacity-60" />
                    <p className="font-medium">No users match the selected filters.</p>
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedRoleFilter('ALL'); setSelectedStatusFilter('ALL'); }}
                      className="text-amber-600 dark:text-amber-400 text-xs mt-1 hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const roleUpper = u.role.toUpperCase();
                  const isCurrentUser = u.email.toLowerCase() === currentUser.email.toLowerCase() || u.you;
                  const permsCount = u.permissions?.length || 0;

                  return (
                    <tr key={u.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            roleUpper === 'ADMIN' ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300' :
                            roleUpper === 'PARTNER' ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300' :
                            roleUpper === 'ARTICLE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            roleUpper === 'CLIENT' ? 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/60 dark:text-purple-300' :
                            'bg-zinc-100 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200'
                          }`}>
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {u.name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 text-zinc-400" />
                                {u.email}
                              </span>
                              {u.mobile && u.mobile !== 'Not specified' && (
                                <span className="flex items-center gap-1 hidden sm:flex">
                                  <Phone className="w-3 h-3 text-zinc-400" />
                                  {u.mobile}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Scope */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                            roleUpper === 'ADMIN' ? 'bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300' :
                            roleUpper === 'PARTNER' ? 'bg-blue-50 text-blue-800 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-300' :
                            roleUpper === 'ARTICLE' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300' :
                            roleUpper === 'CLIENT' ? 'bg-purple-50 text-purple-800 border border-purple-300 dark:bg-purple-950/40 dark:text-purple-300' :
                            'bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}>
                            {u.role}
                          </span>
                          {u.assignedClientName && (
                            <div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1 truncate max-w-[150px]">
                              <Building2 className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{u.assignedClientName}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {u.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                            <Lock className="w-2.5 h-2.5" />
                            SUSPENDED
                          </span>
                        )}
                      </td>

                      {/* Capabilities with Quick Edit */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingPermissionsUser(u)}
                            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-zinc-700 dark:text-zinc-300 hover:text-amber-800 dark:hover:text-amber-300 border border-zinc-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors cursor-pointer text-xs"
                            title="Click to customize capabilities with checkboxes"
                          >
                            <Sliders className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                            <span className="font-semibold">{permsCount} / {SYSTEM_PERMISSIONS.length}</span>
                            <span className="text-[10px] text-zinc-400">Perms</span>
                          </button>
                        </div>
                      </td>

                      {/* Passcode / PIN */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                            {u.passcode || '9001'}
                          </span>
                          <button
                            onClick={() => handleCopyPin(u)}
                            title="Copy PIN"
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded cursor-pointer"
                          >
                            {copiedPinId === u.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Checkboxes */}
                          <button
                            onClick={() => setEditingPermissionsUser(u)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Permissions with Checkboxes"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Restrict / Restore Access */}
                          {!isCurrentUser && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                u.status === 'ACTIVE' 
                                  ? 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40' 
                                  : 'text-rose-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                              title={u.status === 'ACTIVE' ? 'Suspend / Restrict Access' : 'Reactivate User'}
                            >
                              {u.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Authenticate As / Simulate */}
                          {onSimulateLogin && (
                            <button
                              onClick={() => {
                                const targetSimUser: User = {
                                  id: u.id,
                                  name: u.name,
                                  email: u.email,
                                  role: (u.role.toLowerCase() as any),
                                  tenantId: 'firm_abc',
                                  firmName: 'Aarav Advisors',
                                  permissions: u.permissions,
                                  assignedClientId: u.assignedClientId,
                                  mobile: u.mobile
                                };
                                onSimulateLogin(targetSimUser);
                              }}
                              className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                              title={`Authenticate as ${u.name} to test assigned permissions`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete */}
                          {!isCurrentUser && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Revoke & Deprovision"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      </div>

      {/* Info Callout explaining the single company authentication model */}
      <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Company Delegated Access Rule:</strong> Partners, article clerks, and clients authenticated under Aarav Advisors can only execute actions permitted by their marked checkboxes.
          </span>
        </div>
        <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 shrink-0">
          SOC2 CC6.1 & DPDP Act 2023 Compliant
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD NEW USER MODAL (With Checkboxes) */}
      {/* ========================================================================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-950/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 font-serif">
                    Provision New Company User
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Create credentials and assign granular permissions with checkboxes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateUser} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Work Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rajesh.partner@aaravadvisors.in"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Role Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => handleRoleChange(e.target.value as SystemRole)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="PARTNER">Partner (Senior Audit Lead)</option>
                    <option value="ARTICLE">Article Staff (Filing Trainee)</option>
                    <option value="CLIENT">Client (Corporate External User)</option>
                    <option value="MANAGER">Manager (Audit Oversight)</option>
                    <option value="ADMIN">Admin (Practice Master)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mobile / WhatsApp Contact
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* If Client, show client entity picker */}
                {formData.role === 'CLIENT' && (
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Assigned Client Company Entity
                    </label>
                    <select
                      value={formData.assignedClientId}
                      onChange={e => setFormData({ ...formData, assignedClientId: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      {INITIAL_CLIENTS.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.pan || 'PAN N/A'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Station Quick PIN (4 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.passcode}
                    onChange={e => setFormData({ ...formData, passcode: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Capability Matrix with Checkboxes */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      Granular Permission Checkboxes
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Toggle specific functional permissions granted to this user
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, permissions: getRoleDefaultPermissions(prev.role) }))}
                      className="px-2 py-1 text-[11px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium cursor-pointer"
                    >
                      Reset Defaults
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, permissions: SYSTEM_PERMISSIONS.map(p => p.id) }))}
                      className="px-2 py-1 text-[11px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, permissions: [] }))}
                      className="px-2 py-1 text-[11px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Categorized Permissions */}
                <div className="space-y-4">
                  {PERMISSION_CATEGORIES.map(category => {
                    const permsInCategory = SYSTEM_PERMISSIONS.filter(p => p.category === category.id);
                    if (permsInCategory.length === 0) return null;

                    return (
                      <div key={category.id} className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            {category.label}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {permsInCategory.filter(p => formData.permissions.includes(p.id)).length} of {permsInCategory.length} enabled
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {permsInCategory.map(perm => {
                            const isChecked = formData.permissions.includes(perm.id);
                            return (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none ${
                                  isChecked 
                                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80' 
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-70 hover:opacity-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleAddPermission(perm.id)}
                                  className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">
                                    {perm.name}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                                    {perm.description}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                <div className="text-[11px] text-zinc-400">
                  Total enabled: <strong className="text-zinc-700 dark:text-zinc-200">{formData.permissions.length}</strong> capabilities
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    <span>Provision User</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT PERMISSIONS MODAL (Checkboxes for Existing User) */}
      {/* ========================================================================= */}
      {editingPermissionsUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-950/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 font-serif">
                    Modify Assigned Permissions: {editingPermissionsUser.name}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {editingPermissionsUser.email} • {editingPermissionsUser.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingPermissionsUser(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Target Role:</span>
                  <select
                    value={editingPermissionsUser.role}
                    onChange={e => {
                      const newRole = e.target.value as SystemRole;
                      setEditingPermissionsUser({
                        ...editingPermissionsUser,
                        role: newRole
                      });
                    }}
                    className="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="PARTNER">PARTNER</option>
                    <option value="ARTICLE">ARTICLE</option>
                    <option value="CLIENT">CLIENT</option>
                    <option value="MANAGER">MANAGER</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPermissionsUser({
                        ...editingPermissionsUser,
                        permissions: getRoleDefaultPermissions(editingPermissionsUser.role)
                      });
                    }}
                    className="px-2 py-1 text-[11px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium cursor-pointer"
                  >
                    Role Defaults
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPermissionsUser({
                        ...editingPermissionsUser,
                        permissions: SYSTEM_PERMISSIONS.map(p => p.id)
                      });
                    }}
                    className="px-2 py-1 text-[11px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPermissionsUser({
                        ...editingPermissionsUser,
                        permissions: []
                      });
                    }}
                    className="px-2 py-1 text-[11px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Categorized Checkbox List */}
              <div className="space-y-4">
                {PERMISSION_CATEGORIES.map(category => {
                  const permsInCategory = SYSTEM_PERMISSIONS.filter(p => p.category === category.id);
                  if (permsInCategory.length === 0) return null;

                  return (
                    <div key={category.id} className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          {category.label}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {permsInCategory.filter(p => editingPermissionsUser.permissions.includes(p.id)).length} of {permsInCategory.length} enabled
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {permsInCategory.map(perm => {
                          const isChecked = editingPermissionsUser.permissions.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none ${
                                isChecked 
                                  ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80' 
                                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleEditPermission(perm.id)}
                                className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">
                                  {perm.name}
                                </div>
                                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                                  {perm.description}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-950/70 shrink-0">
              <div className="text-[11px] text-zinc-500">
                Enabled: <strong className="text-zinc-800 dark:text-zinc-200">{editingPermissionsUser.permissions.length}</strong> / {SYSTEM_PERMISSIONS.length} capabilities
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPermissionsUser(null)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedPermissions}
                  disabled={loading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Permissions</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESTRICT / SUSPEND MODAL */}
      {/* ========================================================================= */}
      {restrictTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                Suspend Portal Access
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                You are about to suspend access for <strong className="text-zinc-900 dark:text-zinc-200">{restrictTarget.name}</strong> ({restrictTarget.email}). The user will immediately be blocked from logging into the practice.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                SOC2 Justification / Reason:
              </label>
              <textarea
                rows={2}
                value={restrictReason}
                onChange={e => setRestrictReason(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRestrictTarget(null)}
                className="w-1/2 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestrict}
                disabled={loading}
                className="w-1/2 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE / DEPROVISION MODAL */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-rose-500 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                Revoke & Deprovision Account
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Are you sure you want to permanently deprovision <strong className="text-zinc-900 dark:text-zinc-200">{deleteTarget.name}</strong> ({deleteTarget.email})? This action is immutably logged.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="w-1/2 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="w-1/2 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Permanently Revoke
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
