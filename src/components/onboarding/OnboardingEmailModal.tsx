import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Receipt, 
  ShieldCheck, 
  FolderTree, 
  ExternalLink, 
  Eye, 
  Edit3, 
  Lock, 
  Check, 
  Sparkles,
  LogOut,
  RefreshCw,
  X,
  RotateCcw,
  User,
  AtSign
} from 'lucide-react';
import { 
  googleSignIn, 
  getAccessToken, 
  getConnectedGoogleUser, 
  isGoogleConnected, 
  logoutGoogle, 
  initAuth 
} from '../../lib/workspaceAuth';
import { 
  sendViaGmailApi, 
  sendViaDomainEmail, 
  generateEmailHtml, 
  calculateInvoiceBreakdown,
  STANDARD_KYC_CHECKLIST 
} from '../../services/emailService';
import { OnboardingEmailPayload, OnboardingEmailResult } from '../../types';

interface OnboardingEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientData: {
    clientName: string;
    contactEmail: string;
    contactPhone?: string;
    panNumber: string;
    gstin?: string;
    entityType?: string;
    letterRefNumber?: string;
    engagementLetterMarkdown?: string;
    annualRetainerFee?: number;
    servicesRequested?: string[];
  };
  onSentSuccess?: (result: OnboardingEmailResult) => void;
}

export const OnboardingEmailModal: React.FC<OnboardingEmailModalProps> = ({
  isOpen,
  onClose,
  clientData,
  onSentSuccess
}) => {
  // Google Auth state
  const [isGmailAuth, setIsGmailAuth] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form State
  const [recipientEmail, setRecipientEmail] = useState(clientData.contactEmail || '');
  const [recipientName, setRecipientName] = useState(clientData.clientName || '');
  const [ccEmails, setCcEmails] = useState('accounts@aaravadvisors.com');
  const [advanceAmount, setAdvanceAmount] = useState<number>(
    clientData.annualRetainerFee ? Math.round(clientData.annualRetainerFee / 4) : 45000
  );
  const [invoiceNumber, setInvoiceNumber] = useState(
    `AA/INV/2026-27/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [customMessage, setCustomMessage] = useState(
    'Please find attached our formal ICAI SA-210 engagement agreement, initial retainer invoice, and the statutory document checklist for your immediate review and execution.'
  );

  // Inclusion Toggles
  const [includeContract, setIncludeContract] = useState(true);
  const [includeKycChecklist, setIncludeKycChecklist] = useState(true);
  const [includeInvoice, setIncludeInvoice] = useState(true);
  const [includeVaultLink, setIncludeVaultLink] = useState(true);

  // Dispatch Method
  const [senderMode, setSenderMode] = useState<'gmail' | 'domain'>('gmail');

  // UI Modes: 'configure' | 'preview'
  const [viewMode, setViewMode] = useState<'configure' | 'preview'>('configure');

  // Mandatory Confirmation Dialog State (Per SKILL.md rules)
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Sending status
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<OnboardingEmailResult | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Init Google Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
        setIsGmailAuth(true);
      },
      () => {
        setGoogleUser(null);
        setIsGmailAuth(false);
      }
    );

    // Initial check
    if (isGoogleConnected()) {
      setIsGmailAuth(true);
      setGoogleUser(getConnectedGoogleUser());
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Ref to track modal open and client identity so we don't wipe manual edits during re-renders
  const lastInitializedClientIdRef = useRef<string>('');
  const prevIsOpenRef = useRef<boolean>(false);
  const recipientInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset recipient coordinates only when modal is freshly opened or client identity changes
  useEffect(() => {
    const isFreshOpen = isOpen && !prevIsOpenRef.current;
    const clientIdentifier = `${clientData.clientName}_${clientData.contactEmail}`;
    const isClientChanged = clientIdentifier !== lastInitializedClientIdRef.current;

    if (isFreshOpen || (isOpen && isClientChanged)) {
      setRecipientEmail(clientData.contactEmail || '');
      setRecipientName(clientData.clientName || '');
      if (clientData.annualRetainerFee) {
        setAdvanceAmount(Math.round(clientData.annualRetainerFee / 4));
      }
      setSendResult(null);
      setSendError(null);
      lastInitializedClientIdRef.current = clientIdentifier;
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, clientData.clientName, clientData.contactEmail, clientData.annualRetainerFee]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setIsGmailAuth(true);
        setSenderMode('gmail');
      }
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      setAuthError(err.message || 'Failed to authenticate with Google. You can still send via Firm Domain Email.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setIsGmailAuth(false);
    setGoogleUser(null);
    setSenderMode('domain');
  };

  const payload: OnboardingEmailPayload = {
    recipientEmail,
    recipientName,
    ccEmails: ccEmails ? ccEmails.split(',').map(e => e.trim()).filter(Boolean) : [],
    clientName: clientData.clientName,
    panNumber: clientData.panNumber,
    gstin: clientData.gstin,
    entityType: clientData.entityType,
    letterRefNumber: clientData.letterRefNumber || `AA/ENG/2026/${Math.floor(1000 + Math.random() * 9000)}`,
    engagementLetterMarkdown: clientData.engagementLetterMarkdown || '',
    annualRetainerFee: clientData.annualRetainerFee || 180000,
    advanceInvoiceAmount: advanceAmount,
    invoiceNumber,
    servicesRequested: clientData.servicesRequested,
    includeContract,
    includeKycChecklist,
    includeInvoice,
    includeVaultLink,
    senderMode,
    senderEmail: googleUser?.email || 'onboarding@aaravadvisors.com',
    customMessage
  };

  const invoiceCalc = calculateInvoiceBreakdown(advanceAmount);

  // Triggered when user clicks "Send" button in form
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);

    if (!recipientEmail || !recipientEmail.includes('@')) {
      setSendError('Please provide a valid recipient email address.');
      return;
    }

    if (senderMode === 'gmail' && !isGmailAuth) {
      setSendError('Please sign in with Google to send from your connected Gmail address, or switch to Firm Domain Email.');
      return;
    }

    // Opens explicit confirmation dialog as required by the Workspace integration skill
    setShowConfirmModal(true);
  };

  // Confirmed in explicit modal
  const handleExecuteSend = async () => {
    setShowConfirmModal(false);
    setSending(true);
    setSendError(null);

    try {
      let result: OnboardingEmailResult;

      if (senderMode === 'gmail') {
        const token = await getAccessToken();
        if (!token) {
          throw new Error('Gmail OAuth token expired or missing. Please sign in with Google again.');
        }
        result = await sendViaGmailApi(token, payload);
      } else {
        const token = await getAccessToken();
        result = await sendViaDomainEmail(payload, token);
      }

      setSendResult(result);
      if (onSentSuccess) {
        onSentSuccess(result);
      }
    } catch (err: any) {
      console.error('Email dispatch failed:', err);
      setSendError(err.message || 'Failed to dispatch onboarding email package.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Client Onboarding Email Dispatcher</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Gmail & Domain
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Dispatch SA-210 Engagement Contract, Statutory KYC Checklist & Retainer Tax Invoice to {clientData.clientName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="bg-zinc-800 p-1 rounded-lg flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('configure')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                  viewMode === 'configure' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Configure
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                  viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Email Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50">
          
          {sendResult ? (
            /* Success State */
            <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4 max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-zinc-900">Onboarding Package Dispatched!</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  The statutory onboarding documents, engagement contract, and retainer invoice have been successfully transmitted.
                </p>
              </div>

              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Recipient:</span>
                  <span className="font-bold text-zinc-800">{sendResult.recipient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sender Account:</span>
                  <span className="text-zinc-800">{sendResult.sender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Dispatch Channel:</span>
                  <span className="font-bold text-indigo-600 uppercase">
                    {sendResult.method === 'gmail_api' ? 'Google Gmail API (OAuth)' : 'Firm Domain SMTP'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Message ID:</span>
                  <span className="text-zinc-600 text-[11px] truncate max-w-[200px]">{sendResult.messageId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Timestamp:</span>
                  <span className="text-zinc-700">{new Date(sendResult.sentAt).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSendResult(null);
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          ) : viewMode === 'preview' ? (
            /* Live Rendered HTML Email Preview */
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span>
                      <strong>Live Client View</strong>: Transmitting to <strong className="text-zinc-900 underline">{recipientEmail}</strong> {recipientName ? `(Attn: ${recipientName})` : ''}
                    </span>
                    <p className="text-[11px] text-amber-800/80">
                      Review how the formal ICAI SA-210 contract, KYC schedule, and invoice render in the client's inbox.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('configure');
                      setTimeout(() => recipientInputRef.current?.focus(), 80);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    title="Edit recipient email address"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                    Change Recipient Email
                  </button>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl bg-white shadow-xs overflow-hidden">
                <iframe
                  title="Email Preview"
                  srcDoc={generateEmailHtml(payload)}
                  className="w-full h-[520px] border-none"
                />
              </div>
            </div>
          ) : (
            /* Configuration Form */
            <form onSubmit={handleInitiateSend} className="space-y-5">

              {/* Sender Channel Bar (Google OAuth vs Domain) */}
              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-indigo-600" />
                    Select Outbound Email Channel
                  </span>

                  {isGmailAuth ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Gmail Connected: <strong>{googleUser?.email || 'Connected'}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={handleGoogleLogout}
                        className="text-[11px] text-zinc-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                        title="Disconnect Gmail"
                      >
                        <LogOut className="w-3 h-3" /> Disconnect
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Official GSI Material Styled Sign-in Button */}
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={authLoading}
                        className="px-3 py-1.5 bg-white border border-zinc-300 hover:border-zinc-400 text-zinc-700 rounded-full text-xs font-semibold flex items-center gap-2 shadow-2xs hover:bg-zinc-50 transition-all disabled:opacity-50"
                      >
                        {authLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                        ) : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                          </svg>
                        )}
                        <span>Connect Gmail (Official OAuth)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Channel Radio Grid */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div
                    onClick={() => {
                      if (!isGmailAuth) {
                        handleGoogleLogin();
                      } else {
                        setSenderMode('gmail');
                      }
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      senderMode === 'gmail' && isGmailAuth
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-2xs'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                        Send via Gmail
                      </span>
                      {senderMode === 'gmail' && isGmailAuth && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      {isGmailAuth ? `From: ${googleUser?.email}` : 'Requires 1-click Google sign-in'}
                    </p>
                  </div>

                  <div
                    onClick={() => setSenderMode('domain')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      senderMode === 'domain'
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-2xs'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Firm Domain Email
                      </span>
                      {senderMode === 'domain' && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      From: onboarding@aaravadvisors.com
                    </p>
                  </div>
                </div>

                {authError && (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>

              {/* Recipient Coordinates */}
              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <AtSign className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Recipient Coordinates & Delivery Destination
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {recipientEmail.trim() !== (clientData.contactEmail || '').trim() ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Manually Overridden
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                        Default Profile Email
                      </span>
                    )}

                    {clientData.contactEmail && recipientEmail.trim() !== clientData.contactEmail.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setRecipientEmail(clientData.contactEmail);
                          setRecipientName(clientData.clientName);
                        }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer ml-1"
                        title="Reset to default client email"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset ({clientData.contactEmail})
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-zinc-800 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                        Recipient Primary Email <span className="text-rose-600">*</span>
                      </label>
                      <span className="text-[10px] text-zinc-400">Direct Delivery Target</span>
                    </div>
                    <div className="relative">
                      <input
                        ref={recipientInputRef}
                        type="email"
                        value={recipientEmail}
                        onChange={e => setRecipientEmail(e.target.value)}
                        required
                        placeholder="e.g. director@company.com, cfo@group.com"
                        className="w-full pl-3 pr-16 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-zinc-900 shadow-2xs"
                      />
                      {recipientEmail.trim() !== (clientData.contactEmail || '').trim() && (
                        <span 
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                          title="Custom email manually specified"
                        >
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      The onboarding package, SA-210 contract, and retainer invoice will be delivered to this address. You can change this manually anytime.
                    </p>

                    {/* Quick Recipient Selection Shortcuts */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {clientData.contactEmail && (
                        <button
                          type="button"
                          onClick={() => setRecipientEmail(clientData.contactEmail)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                            recipientEmail === clientData.contactEmail 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                          }`}
                        >
                          Default: {clientData.contactEmail}
                        </button>
                      )}
                      {googleUser?.email && googleUser.email !== recipientEmail && (
                        <button
                          type="button"
                          onClick={() => setRecipientEmail(googleUser.email)}
                          className="text-[10px] px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
                          title="Send to your authenticated Gmail account for testing"
                        >
                          Send to Me ({googleUser.email})
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-zinc-800 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-zinc-500" />
                        Recipient Name / Attention
                      </label>
                      <span className="text-[10px] text-zinc-400">Formal Salutation</span>
                    </div>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="e.g. Rajiv Sharma, CFO & Director"
                      className="w-full px-3 py-2 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-zinc-900 shadow-2xs"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Signatory or executive name addressed in the formal onboarding cover letter and engagement salutation.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    CC Distribution List (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={ccEmails}
                    onChange={e => setCcEmails(e.target.value)}
                    placeholder="partner@aaravadvisors.com, audit@aaravadvisors.com"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white"
                  />
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Carbon copy recipients will receive the statutory engagement documents and notifications.
                  </p>
                </div>
              </div>

              {/* What all are required when client onboarding (Checklist & Toggles) */}
              <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Onboarding Package Inclusions
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Select which statutory artifacts and schedules are bundled into this dispatch
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    4 Components Configured
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  
                  {/* 1. SA-210 Contract */}
                  <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition-colors ${
                    includeContract ? 'bg-indigo-50/50 border-indigo-200' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={includeContract}
                      onChange={e => setIncludeContract(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-zinc-900 block flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        ICAI SA-210 Engagement Letter
                      </span>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        Ref: {clientData.letterRefNumber || 'AA/ENG/2026/...'} • Statutory Audit & Tax Retainer terms.
                      </span>
                    </div>
                  </label>

                  {/* 2. KYC Checklist */}
                  <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition-colors ${
                    includeKycChecklist ? 'bg-indigo-50/50 border-indigo-200' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={includeKycChecklist}
                      onChange={e => setIncludeKycChecklist(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-zinc-900 block flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Statutory KYC & Document Checklist
                      </span>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        COI, MOA/AOA, REG-06, Director KYC, Board Resolution, Prior ITRs, Auditor NOC.
                      </span>
                    </div>
                  </label>

                  {/* 3. Retainer Invoice */}
                  <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition-colors ${
                    includeInvoice ? 'bg-indigo-50/50 border-indigo-200' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={includeInvoice}
                      onChange={e => setIncludeInvoice(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-zinc-900 block flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5 text-amber-600" />
                        Initial Retainer Tax Invoice
                      </span>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        SAC 9982, 18% GST calculation, RTGS/NEFT payment instructions.
                      </span>
                    </div>
                  </label>

                  {/* 4. Vault Link */}
                  <label className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition-colors ${
                    includeVaultLink ? 'bg-indigo-50/50 border-indigo-200' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={includeVaultLink}
                      onChange={e => setIncludeVaultLink(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-zinc-900 block flex items-center gap-1">
                        <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                        Encrypted Cloud Vault Link
                      </span>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">
                        Client portal direct link for uploading confidential KYC records.
                      </span>
                    </div>
                  </label>

                </div>
              </div>

              {/* Retainer & Invoice Pricing Panel */}
              {includeInvoice && (
                <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Initial Retainer Fee & GST Billing Setup
                    </h4>
                    <span className="text-xs font-mono font-bold text-zinc-600">
                      Invoice: {invoiceNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">
                        Base Retainer (INR)
                      </label>
                      <input
                        type="number"
                        value={advanceAmount}
                        onChange={e => setAdvanceAmount(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs font-mono font-bold bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">
                        18% GST (CGST 9% + SGST 9%)
                      </label>
                      <div className="px-3 py-2 text-xs font-mono font-bold bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-600">
                        ₹{invoiceCalc.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-700 block mb-1">
                        Total Invoice Payable
                      </label>
                      <div className="px-3 py-2 text-xs font-mono font-bold bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900">
                        ₹{invoiceCalc.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Partner Directive Note */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Partner Executive Note (Included in Email Header)
                </label>
                <textarea
                  rows={2}
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white"
                  placeholder="Add specific instructions for client directors..."
                />
              </div>

              {sendError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview Rendered Email
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-zinc-600 hover:text-zinc-900 text-xs font-semibold rounded-full hover:bg-zinc-100 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Onboarding Package
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>

      </div>

      {/* MANDATORY USER CONFIRMATION DIALOG (Required by Workspace Integration Skill) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-zinc-900">Confirm Email Dispatch</h4>
                <p className="text-xs text-zinc-500">Statutory communication will be dispatched</p>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-800 font-medium">Recipient Target Email:</span>
                <span className="font-bold text-zinc-900 font-mono bg-white px-2 py-0.5 rounded border border-amber-300">
                  {recipientEmail}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-600">
                <span>Client Entity:</span>
                <span className="font-semibold text-zinc-800">{clientData.clientName}</span>
              </div>
              {recipientName && (
                <div className="flex items-center justify-between text-[11px] text-zinc-600">
                  <span>Salutation / Attn:</span>
                  <span className="text-zinc-800">{recipientName}</span>
                </div>
              )}
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Sender Channel:</span>
                <span className="font-bold text-indigo-600">
                  {senderMode === 'gmail' ? `Gmail (${googleUser?.email})` : 'onboarding@aaravadvisors.com'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Contract Ref:</span>
                <span className="font-mono text-zinc-700">{payload.letterRefNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Retainer Invoice:</span>
                <span className="font-bold text-zinc-800">₹{invoiceCalc.total.toLocaleString('en-IN')} (Incl. GST)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">KYC Requirements:</span>
                <span className="text-zinc-700">9 Statutory verification items</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={sending}
                onClick={() => {
                  setShowConfirmModal(false);
                  setViewMode('configure');
                  setTimeout(() => recipientInputRef.current?.focus(), 80);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Change the recipient primary email address"
              >
                <Edit3 className="w-3 h-3" />
                Change Recipient
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={handleExecuteSend}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Transmitting Package...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Yes, Send Onboarding Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
