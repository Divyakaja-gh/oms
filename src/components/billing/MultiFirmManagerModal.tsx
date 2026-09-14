import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Check, 
  X, 
  Edit3, 
  CreditCard, 
  CheckCircle2, 
  Sparkles,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { FirmProfile } from '../../types';
import { INITIAL_FIRMS } from '../../data/practiceAutomationData';

interface MultiFirmManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFirmId: string;
  onSelectFirm: (firmId: string) => void;
  onFirmsUpdated?: (firms: FirmProfile[]) => void;
}

export function MultiFirmManagerModal({
  isOpen,
  onClose,
  selectedFirmId,
  onSelectFirm,
  onFirmsUpdated
}: MultiFirmManagerModalProps) {
  const [firms, setFirms] = useState<FirmProfile[]>(() => {
    const saved = localStorage.getItem('caoms_multi_firms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_FIRMS;
  });

  const [isAddingFirm, setIsAddingFirm] = useState(false);
  const [editingFirmId, setEditingFirmId] = useState<string | null>(null);

  const [firmForm, setFirmForm] = useState<Partial<FirmProfile>>({
    firmName: '',
    firmType: 'Partnership',
    registrationNo: '',
    pan: '',
    gstin: '',
    address: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    phone: '',
    email: '',
    bankName: '',
    bankAccountNo: '',
    bankIfsc: '',
    bankBranch: '',
    invoicePrefix: 'FIRM/26-27/'
  });

  if (!isOpen) return null;

  const handleSaveFirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmForm.firmName || !firmForm.pan || !firmForm.gstin) return;

    let updated: FirmProfile[];

    if (editingFirmId) {
      updated = firms.map(f => f.id === editingFirmId ? { ...(f as FirmProfile), ...firmForm } : f);
    } else {
      const newFirm: FirmProfile = {
        id: `firm-${Date.now()}`,
        firmName: firmForm.firmName!,
        firmType: firmForm.firmType as any || 'Partnership',
        registrationNo: firmForm.registrationNo || 'N/A',
        pan: firmForm.pan!.toUpperCase(),
        gstin: firmForm.gstin!.toUpperCase(),
        address: firmForm.address || '',
        city: firmForm.city || '',
        state: firmForm.state || '',
        pincode: firmForm.pincode || '',
        phone: firmForm.phone || '',
        email: firmForm.email || '',
        bankName: firmForm.bankName || '',
        bankAccountNo: firmForm.bankAccountNo || '',
        bankIfsc: firmForm.bankIfsc || '',
        bankBranch: firmForm.bankBranch || '',
        invoicePrefix: firmForm.invoicePrefix || 'AA/',
        isDefault: false
      };
      updated = [...firms, newFirm];
    }

    setFirms(updated);
    localStorage.setItem('caoms_multi_firms', JSON.stringify(updated));
    if (onFirmsUpdated) onFirmsUpdated(updated);

    setIsAddingFirm(false);
    setEditingFirmId(null);
  };

  const handleSetDefault = (id: string) => {
    const updated = firms.map(f => ({
      ...f,
      isDefault: f.id === id
    }));
    setFirms(updated);
    localStorage.setItem('caoms_multi_firms', JSON.stringify(updated));
    onSelectFirm(id);
    if (onFirmsUpdated) onFirmsUpdated(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Multi-Firm Billing & Entity Management</h2>
              <p className="text-xs text-zinc-500">Switch billing entities, letterheads, invoice prefixes, and bank settlement accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Configured Entities ({firms.length})
            </span>
            <button
              onClick={() => {
                setIsAddingFirm(true);
                setEditingFirmId(null);
                setFirmForm({
                  firmName: '',
                  firmType: 'Partnership',
                  registrationNo: '',
                  pan: '',
                  gstin: '',
                  address: '',
                  city: 'New Delhi',
                  state: 'Delhi',
                  pincode: '110001',
                  phone: '',
                  email: '',
                  bankName: '',
                  bankAccountNo: '',
                  bankIfsc: '',
                  bankBranch: '',
                  invoicePrefix: 'INV/26-27/'
                });
              }}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Sister Firm / Entity</span>
            </button>
          </div>

          {/* Firms Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {firms.map(firm => (
              <div 
                key={firm.id}
                className={`p-5 rounded-2xl border transition-all relative ${
                  selectedFirmId === firm.id 
                    ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-600/20' 
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-zinc-100 text-zinc-600 font-mono">
                      {firm.firmType} • Reg: {firm.registrationNo}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-900 mt-1.5">{firm.firmName}</h3>
                  </div>

                  {firm.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                      Default Firm
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">GSTIN:</span>
                    <span className="font-mono font-bold text-zinc-800">{firm.gstin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">PAN:</span>
                    <span className="font-mono font-bold text-zinc-800">{firm.pan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Invoice Series:</span>
                    <span className="font-mono font-bold text-blue-700">{firm.invoicePrefix}XXXX</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Settlement Bank:</span>
                    <span className="font-semibold text-zinc-700">{firm.bankName}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectFirm(firm.id);
                      onClose();
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                      selectedFirmId === firm.id 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {selectedFirmId === firm.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Active Billing Entity</span>
                      </>
                    ) : (
                      <span>Select For Billing</span>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    {!firm.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(firm.id)}
                        className="text-[11px] font-bold text-zinc-500 hover:text-zinc-900"
                      >
                        Set Default
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add / Edit Form */}
          {isAddingFirm && (
            <form onSubmit={handleSaveFirm} className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  {editingFirmId ? 'Edit Firm Profile' : 'Register Sister Firm / Entity'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingFirm(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Firm Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Advisory Services LLP"
                    value={firmForm.firmName}
                    onChange={e => setFirmForm({ ...firmForm, firmName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Entity Type</label>
                  <select
                    value={firmForm.firmType}
                    onChange={e => setFirmForm({ ...firmForm, firmType: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white"
                  >
                    <option value="Partnership">Partnership (CA Firm)</option>
                    <option value="Proprietorship">Proprietorship (Sole Practitioner)</option>
                    <option value="LLP">Limited Liability Partnership (LLP)</option>
                    <option value="Private Limited">Private Limited Company</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Registration / FRN No</label>
                  <input
                    type="text"
                    placeholder="ICAI FRN or LLPIN / CIN"
                    value={firmForm.registrationNo}
                    onChange={e => setFirmForm({ ...firmForm, registrationNo: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Firm PAN *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. AALFA5678B"
                    value={firmForm.pan}
                    onChange={e => setFirmForm({ ...firmForm, pan: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">GSTIN *</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="e.g. 07AALFA5678B1Z2"
                    value={firmForm.gstin}
                    onChange={e => setFirmForm({ ...firmForm, gstin: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Invoice Prefix *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ASL/26-27/"
                    value={firmForm.invoicePrefix}
                    onChange={e => setFirmForm({ ...firmForm, invoicePrefix: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. ICICI Bank"
                    value={firmForm.bankName}
                    onChange={e => setFirmForm({ ...firmForm, bankName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Bank Account No</label>
                  <input
                    type="text"
                    placeholder="Current Account Number"
                    value={firmForm.bankAccountNo}
                    onChange={e => setFirmForm({ ...firmForm, bankAccountNo: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. ICIC0000007"
                    value={firmForm.bankIfsc}
                    onChange={e => setFirmForm({ ...firmForm, bankIfsc: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsAddingFirm(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Save Firm Profile
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
