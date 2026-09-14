import React, { useState } from 'react';
import { 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Send, 
  MessageSquare, 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  ShieldCheck, 
  Building2, 
  User, 
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { DscRecord } from '../../types';
import { INITIAL_DSC_RECORDS } from '../../data/practiceAutomationData';

export function DscManagementHub() {
  const [dscList, setDscList] = useState<DscRecord[]>(() => {
    const saved = localStorage.getItem('caoms_dsc_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_DSC_RECORDS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'expiring_soon' | 'active' | 'expired'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [alertSuccessToast, setAlertSuccessToast] = useState<string | null>(null);

  // Form state for adding new DSC
  const [newDsc, setNewDsc] = useState({
    clientName: '',
    holderName: '',
    holderDesignation: 'Director',
    pan: '',
    din: '',
    issuingAuthority: 'e-Mudhra CA',
    certificateClass: 'Class 3' as const,
    validFrom: '2025-09-01',
    validUntil: '2027-09-01',
    tokenLocation: 'Office Safe' as const,
    tokenPin: ''
  });

  const filteredDscs = dscList.filter(d => {
    const matchesSearch = d.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.holderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.pan.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.din && d.din.includes(searchQuery));
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalDscs = dscList.length;
  const criticalDscs = dscList.filter(d => d.status === 'expiring_soon' && d.daysRemaining <= 10).length;
  const warningDscs = dscList.filter(d => d.status === 'expiring_soon' && d.daysRemaining > 10).length;
  const expiredDscs = dscList.filter(d => d.status === 'expired').length;

  // Zero-cost WhatsApp reminder via deep-link
  const handleWhatsAppReminder = (dsc: DscRecord) => {
    const text = `*Statutory Notice from Aarav Advisors (Chartered Accountants)*\n\nDear ${dsc.holderName} (${dsc.holderDesignation}),\n\nYour Class-3 Digital Signature Certificate (DSC) registered for *${dsc.clientName}* is expiring on *${dsc.validUntil}* (${dsc.daysRemaining > 0 ? `${dsc.daysRemaining} days remaining` : 'EXPIRED'}).\n\nTo prevent disruptions in MCA ROC returns, Income Tax e-filing, or GST invoices, please verify your Aadhaar OTP and video KYC for timely token renewal.\n\n_Contact our secretarial desk at +91 11 4355 8900 for immediate assistance._`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    setAlertSuccessToast(`WhatsApp reminder prepared for ${dsc.holderName}`);
    setTimeout(() => setAlertSuccessToast(null), 4000);
  };

  // Direct Email reminder
  const handleEmailReminder = (dsc: DscRecord) => {
    const subject = `Urgent: Class-3 DSC Token Expiry Alert for ${dsc.holderName} (${dsc.clientName})`;
    const body = `Dear ${dsc.holderName},\n\nThis is an automated compliance alert from Aarav & Associates, Chartered Accountants.\n\nYour Class-3 Digital Signature (DSC) issued by ${dsc.issuingAuthority} for ${dsc.clientName} (DIN: ${dsc.din || 'N/A'}, PAN: ${dsc.pan}) will expire on ${dsc.validUntil} (${dsc.daysRemaining} days remaining).\n\nPlease authorize renewal processing to ensure smooth statutory compliance.\n\nWarm regards,\nPractice Compliance Cell\nAarav Advisors`;

    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    setAlertSuccessToast(`Email draft opened for ${dsc.holderName}`);
    setTimeout(() => setAlertSuccessToast(null), 4000);
  };

  const handleAddDsc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDsc.clientName || !newDsc.holderName || !newDsc.pan) return;

    // Calculate days remaining
    const until = new Date(newDsc.validUntil);
    const now = new Date();
    const diffTime = until.getTime() - now.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const item: DscRecord = {
      id: `dsc-${Date.now()}`,
      clientId: `c-${Date.now()}`,
      clientName: newDsc.clientName,
      holderName: newDsc.holderName,
      holderDesignation: newDsc.holderDesignation,
      pan: newDsc.pan.toUpperCase(),
      din: newDsc.din || undefined,
      issuingAuthority: newDsc.issuingAuthority,
      certificateClass: newDsc.certificateClass,
      validFrom: newDsc.validFrom,
      validUntil: newDsc.validUntil,
      daysRemaining: days,
      status: days <= 0 ? 'expired' : days <= 30 ? 'expiring_soon' : 'active',
      tokenLocation: newDsc.tokenLocation,
      tokenPin: newDsc.tokenPin || '••••••••'
    };

    const updated = [item, ...dscList];
    setDscList(updated);
    localStorage.setItem('caoms_dsc_records', JSON.stringify(updated));
    setIsAddModalOpen(false);
    setAlertSuccessToast(`DSC token for ${item.holderName} registered in database.`);
    setTimeout(() => setAlertSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900">
              Class-3 Digital Signature (DSC) Registry & Expiry Alerts
            </h2>
            <p className="text-xs text-zinc-500">
              Track client directors' USB tokens, Class-3 validity countdown, and automated renewal reminders
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New DSC Token</span>
        </button>
      </div>

      {alertSuccessToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{alertSuccessToast}</span>
        </div>
      )}

      {/* Expiry Alert Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'ALL' ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20' : 'bg-white border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Registered DSCs</div>
          <div className="text-xl font-bold text-zinc-900 mt-1">{totalDscs}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Physical & Cloud Tokens</div>
        </div>

        <div 
          onClick={() => setStatusFilter('expiring_soon')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'expiring_soon' ? 'border-red-600 bg-red-50/40 ring-2 ring-red-600/20' : 'bg-white border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>Critical (&le; 10 Days)</span>
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          </div>
          <div className="text-xl font-bold text-red-700 mt-1">{criticalDscs} Tokens</div>
          <div className="text-[11px] text-red-600 mt-0.5">Immediate renewal needed</div>
        </div>

        <div 
          onClick={() => setStatusFilter('expiring_soon')}
          className="p-4 rounded-xl border bg-white border-zinc-200 hover:border-zinc-300 cursor-pointer transition-all"
        >
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Expiring in 30 Days</div>
          <div className="text-xl font-bold text-amber-700 mt-1">{warningDscs} Tokens</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Send early renewal notice</div>
        </div>

        <div 
          onClick={() => setStatusFilter('expired')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'expired' ? 'border-zinc-800 bg-zinc-100 ring-2 ring-zinc-800/20' : 'bg-white border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <div className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">Expired DSCs</div>
          <div className="text-xl font-bold text-zinc-800 mt-1">{expiredDscs} Tokens</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Statutory filings blocked</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Client, Director Name, DIN or PAN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-700 font-medium"
          >
            <option value="ALL">All DSC Statuses</option>
            <option value="expiring_soon">Expiring Soon (&lt; 30 Days)</option>
            <option value="active">Active &amp; Valid</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* DSC Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDscs.map(dsc => (
          <div 
            key={dsc.id}
            className={`bg-white rounded-2xl border p-5 shadow-xs transition-all relative overflow-hidden ${
              dsc.status === 'expired' ? 'border-red-300 bg-red-50/20' :
              dsc.daysRemaining <= 10 ? 'border-red-300 ring-1 ring-red-300/60' :
              dsc.daysRemaining <= 30 ? 'border-amber-300 bg-amber-50/20' :
              'border-zinc-200 hover:border-zinc-300'
            }`}
          >
            {/* Countdown Badge */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 uppercase font-mono tracking-wider">
                  {dsc.certificateClass} • {dsc.issuingAuthority}
                </span>
                <h3 className="text-sm font-bold text-zinc-900 mt-1.5">{dsc.holderName}</h3>
                <div className="text-xs text-zinc-500 font-medium">{dsc.holderDesignation} • <strong className="text-zinc-800">{dsc.clientName}</strong></div>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                  dsc.status === 'expired' ? 'bg-red-100 text-red-800' :
                  dsc.daysRemaining <= 10 ? 'bg-red-600 text-white animate-pulse' :
                  dsc.daysRemaining <= 30 ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  <Clock className="w-3 h-3" />
                  <span>
                    {dsc.status === 'expired' ? 'EXPIRED' : `${dsc.daysRemaining} Days Left`}
                  </span>
                </span>
              </div>
            </div>

            {/* Technical Identifiers */}
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 my-3">
              <div>
                <span className="text-zinc-400 font-medium">Director DIN:</span>
                <span className="font-mono font-bold text-zinc-800 ml-1">{dsc.din || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-medium">PAN:</span>
                <span className="font-mono font-bold text-zinc-800 ml-1">{dsc.pan}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-medium">Valid Until:</span>
                <span className="font-mono font-bold text-zinc-800 ml-1">{dsc.validUntil}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-medium">Token Location:</span>
                <span className="font-semibold text-indigo-700 ml-1">{dsc.tokenLocation}</span>
              </div>
            </div>

            {/* Quick Actions (WhatsApp & Email) */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100">
              <div className="text-[11px] text-zinc-400">
                {dsc.lastRenewalAlertSent ? `Last alert: ${dsc.lastRenewalAlertSent}` : 'No alert sent yet'}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleWhatsAppReminder(dsc)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Send Free WhatsApp Notice (No API cost)"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => handleEmailReminder(dsc)}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Draft Renewal Email"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Notice</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Register New DSC Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <Key className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-zinc-900">Register Client Director DSC</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDsc} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Client Entity Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech Solutions Ltd"
                    value={newDsc.clientName}
                    onChange={e => setNewDsc({ ...newDsc, clientName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Director / Holder Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Singhania"
                    value={newDsc.holderName}
                    onChange={e => setNewDsc({ ...newDsc, holderName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Managing Director"
                    value={newDsc.holderDesignation}
                    onChange={e => setNewDsc({ ...newDsc, holderDesignation: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Director PAN *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. ABVPS9981K"
                    value={newDsc.pan}
                    onChange={e => setNewDsc({ ...newDsc, pan: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Director DIN (If MCA)</label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="e.g. 00291844"
                    value={newDsc.din}
                    onChange={e => setNewDsc({ ...newDsc, din: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Issuing Authority</label>
                  <select
                    value={newDsc.issuingAuthority}
                    onChange={e => setNewDsc({ ...newDsc, issuingAuthority: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white"
                  >
                    <option value="e-Mudhra CA">e-Mudhra CA</option>
                    <option value="Capricorn CA">Capricorn CA</option>
                    <option value="VSign CA">VSign CA</option>
                    <option value="Sify CA">Sify CA</option>
                    <option value="IDSign CA">IDSign CA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Token Location</label>
                  <select
                    value={newDsc.tokenLocation}
                    onChange={e => setNewDsc({ ...newDsc, tokenLocation: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white"
                  >
                    <option value="Office Safe">Office Safe (Custody)</option>
                    <option value="Partner Desk">Partner Desk</option>
                    <option value="With Client">With Client</option>
                    <option value="In Use">In Use (Audit Desk)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Valid From</label>
                  <input
                    type="date"
                    value={newDsc.validFrom}
                    onChange={e => setNewDsc({ ...newDsc, validFrom: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Valid Until (Expiry) *</label>
                  <input
                    type="date"
                    required
                    value={newDsc.validUntil}
                    onChange={e => setNewDsc({ ...newDsc, validUntil: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Save DSC Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
