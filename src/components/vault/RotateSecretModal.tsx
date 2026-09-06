import React, { useState } from 'react';
import { RefreshCw, X, ShieldCheck, Sparkles, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import { VaultCredentialItem, User } from '../../types';

interface RotateSecretModalProps {
  credential: VaultCredentialItem;
  user: User | null;
  onClose: () => void;
  onSuccess: (updated: VaultCredentialItem) => void;
}

export function RotateSecretModal({ credential, user, onClose, onSuccess }: RotateSecretModalProps) {
  const [newSecretValue, setNewSecretValue] = useState('');
  const [reason, setReason] = useState('Periodic 90-day statutory rotation compliance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Strong password generator compliant with MCA V3 and Income Tax Portal complexity guidelines
  const generateStrongSecret = () => {
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

    // Shuffle
    const shuffled = pass.split('').sort(() => 0.5 - Math.random()).join('');
    setNewSecretValue(shuffled);
  };

  const handleRotate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecretValue || newSecretValue.length < 8) {
      setError('New secret must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/vault/credentials/${credential.id}/rotate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock_user_${user?.id || 'admin'}`
        },
        body: JSON.stringify({ newSecretValue, reason })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to rotate secret.');
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred during secret rotation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Rotate Secret (Google Secret Manager)</h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                Current Version: v{credential.currentVersion} → New Version: v{credential.currentVersion + 1}
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

        <form onSubmit={handleRotate} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Hardware KMS Key Versioning</span>
              <p className="text-indigo-800 text-[11px] leading-relaxed">
                Rotating adds a new cryptographic secret payload in Google Secret Manager while keeping the immutable version history intact. Prior version v{credential.currentVersion} will be archived.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-800">
                New Secret Value / Password <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={generateStrongSecret}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                Generate Compliant Password
              </button>
            </div>
            <input
              required
              type="text"
              value={newSecretValue}
              onChange={e => setNewSecretValue(e.target.value)}
              placeholder="Enter new portal password or generated token"
              className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <p className="text-[10px] text-zinc-400">
              Meets MCA21 & Income Tax CPC rules: 8-16 characters, uppercase, lowercase, numbers, and special symbols.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-800">
              Rotation Justification / Audit Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Periodic 90-day statutory rotation compliance"
              className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
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
              disabled={loading || !newSecretValue}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-full shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Encrypting & Storing in GSM...' : 'Commit Rotation to Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
