import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Eye, EyeOff, Copy, Check, Clock, ExternalLink, Key, Lock, AlertCircle } from 'lucide-react';
import { VaultCredentialItem, User } from '../../types';

interface RevealSecretModalProps {
  credential: VaultCredentialItem;
  user: User | null;
  onClose: () => void;
  onSuccessDecrypted?: () => void;
}

const JUSTIFICATION_PRESETS = [
  'Statutory ITR-6 Return E-Filing Upload',
  'MCA Form AOC-4 / MGT-7 Annual Filing',
  'GST GSP Direct API Token Refresh',
  'Class 3 DSC Token Association & Verification',
  'Income Tax Scrutiny Response Submission',
  'Statutory Audit Verification & Working Paper'
];

export function RevealSecretModal({ credential, user, onClose, onSuccessDecrypted }: RevealSecretModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [auditLogId, setAuditLogId] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [copied, setCopied] = useState(false);
  const [showPlaintext, setShowPlaintext] = useState(true);

  // Active 30-second security countdown once decrypted
  useEffect(() => {
    if (!decryptedValue) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setDecryptedValue(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [decryptedValue]);

  const handleReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a specific justification reason for SOC 2 audit compliance.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/vault/credentials/${credential.id}/access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock_user_${user?.id || 'admin'}`
        },
        body: JSON.stringify({ reason })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to decrypt credential.');
      }

      setDecryptedValue(data.secretValue);
      setAuditLogId(data.auditLogId);
      setSecondsRemaining(30);
      onSuccessDecrypted?.();
    } catch (err: any) {
      setError(err.message || 'Access denied by KMS Vault policy.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!decryptedValue) return;
    try {
      await navigator.clipboard.writeText(decryptedValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                {decryptedValue ? 'Decrypted Vault Secret' : 'Controlled Secret Decryption'}
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono truncate max-w-[320px]">
                {credential.secretManagerName}
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

        <div className="p-6 space-y-5">
          {/* Target Credential Overview */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-700">Target System:</span>
              <span className="text-zinc-900 font-medium">{credential.system}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-700">Credential Name:</span>
              <span className="text-indigo-600 font-medium">{credential.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-700">User / Identifier:</span>
              <span className="font-mono text-zinc-900 font-semibold bg-white px-2 py-0.5 rounded border border-zinc-200">
                {credential.identifier}
              </span>
            </div>
          </div>

          {!decryptedValue ? (
            /* STEP 1: Justification Form */
            <form onSubmit={handleReveal} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">SOC 2 Type II Security Protocol Active</p>
                  <p className="text-amber-800 leading-relaxed text-[11px]">
                    Accessing this secret initiates a hardware KMS decryption from Google Secret Manager. An immutable <strong className="font-mono">CREDENTIAL_REVEAL</strong> audit log will be logged under your account ({user?.email || 'actor'}).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                  Filing Justification / Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Filing annual MCA return Form AOC-4 for Acme Corp"
                  className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              {/* Preset quick buttons */}
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Standard Compliance Reasons:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {JUSTIFICATION_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReason(p)}
                      className="px-2 py-1 rounded-lg text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-800 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !reason.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-full shadow-sm transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {loading ? 'Decrypting via Cloud KMS...' : 'Authenticate & Decrypt Secret'}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Decrypted Value Display with 30s Countdown */
            <div className="space-y-4">
              {/* Ephemeral Countdown Banner */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>
                    Ephemeral lease expires in: <strong className="font-mono text-sm">{secondsRemaining}s</strong>
                  </span>
                </div>
                {auditLogId && (
                  <span className="font-mono text-[10px] bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded">
                    Audit: {auditLogId}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(secondsRemaining / 30) * 100}%` }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Decrypted Secret Value
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showPlaintext ? 'text' : 'password'}
                      readOnly
                      value={decryptedValue}
                      className="w-full px-3.5 py-3 pr-10 border border-emerald-300 rounded-xl text-sm font-mono bg-emerald-50/20 text-zinc-900 font-bold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPlaintext(!showPlaintext)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showPlaintext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Secret
                      </>
                    )}
                  </button>
                </div>
              </div>

              {credential.portalUrl && (
                <div className="pt-2">
                  <a
                    href={credential.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Open Official {credential.system} Portal in New Window
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-100 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  Close & Clear Lease
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
