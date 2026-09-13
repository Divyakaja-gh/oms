import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Search, Filter, FileText, Download, Send, CreditCard, Receipt, FilePlus, ChevronRight, AlertCircle, Building, Hash, Printer, Zap, ScanText, Trash2, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { downloadInvoicePDF, printHtmlDocument } from '../utils/printAndPdfUtils';
import { collection, addDoc, onSnapshot, serverTimestamp, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AgentCreditsTab } from '../components/credits/AgentCreditsTab';

const SAC_CODES = [

  { service: 'Accounting / Bookkeeping', sac: '998222', rate: 18 },
  { service: 'Statutory Audit', sac: '998221', rate: 18 },
  { service: 'Tax Return Filing (ITR)', sac: '998231', rate: 18 },
  { service: 'GST Compliance Services', sac: '998231', rate: 18 },
  { service: 'ROC / Company Law', sac: '998212', rate: 18 },
  { service: 'Financial Advisory', sac: '998313', rate: 18 },
  { service: 'Payroll Processing', sac: '998511', rate: 18 },
];

const INVOICE_TYPES = ['Tax Invoice', 'Proforma Invoice', 'Credit Note', 'Debit Note', 'Receipt'];

interface BillingProps {
  onNavigateToOcr?: () => void;
}

export function Billing({ onNavigateToOcr }: BillingProps = {}) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'retainers' | 'credits'>('invoices');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRetainerModalOpen, setIsRetainerModalOpen] = useState(false);
  const [retainers, setRetainers] = useState<any[]>([]);
  const [retainerData, setRetainerData] = useState({ clientId: '', amount: '', cycle: 'Monthly', startDate: '', serviceScope: '', autoInvoice: false, billingDay: '1st of month' });

  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  
  // Form State
  const [invoiceType, setInvoiceType] = useState('Tax Invoice');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [supplyType, setSupplyType] = useState('Intra-State (CGST + SGST)');
  const [lineItems, setLineItems] = useState([{ service: '', sac: '', amount: 0, rate: 18 }]);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 15');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);
  const [cleanSuccessMsg, setCleanSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    // Fetch Invoices
    const unsubInvoices = onSnapshot(query(collection(db, 'invoices'), where('ownerId', '==', uid)), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setInvoices(data);
    });

    // Fetch Clients
    const unsubClients = onSnapshot(query(collection(db, 'clients'), where('ownerId', '==', uid)), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubRetainers = onSnapshot(query(collection(db, 'retainers'), where('ownerId', '==', uid)), (snapshot) => {
      setRetainers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubInvoices(); unsubClients(); unsubRetainers(); };
  }, []);

  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);

  // Detect duplicate invoices by invoiceNumber to guarantee zero duplicacy
  const duplicateInvoiceGroups = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    invoices.forEach(inv => {
      const key = (inv.invoiceNumber || '').trim().toLowerCase();
      if (key) {
        if (!groups[key]) groups[key] = [];
        groups[key].push(inv);
      }
    });
    return Object.values(groups).filter(g => g.length > 1);
  }, [invoices]);

  const totalDuplicatesCount = useMemo(() => {
    return duplicateInvoiceGroups.reduce((acc, g) => acc + (g.length - 1), 0);
  }, [duplicateInvoiceGroups]);

  const handleCleanDuplicates = async () => {
    setCleaningDuplicates(true);
    try {
      let deleted = 0;
      for (const group of duplicateInvoiceGroups) {
        // Keep the latest record (by updatedAt or createdAt)
        const sorted = [...group].sort((a, b) => {
          const timeA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
          const timeB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        // Delete all except the primary record
        for (let i = 1; i < sorted.length; i++) {
          await deleteDoc(doc(db, 'invoices', sorted[i].id));
          deleted++;
        }
      }
      setCleanSuccessMsg(`Cleaned up ${deleted} duplicate invoice entries. All records are now uniquely preserved!`);
    } catch (err) {
      console.error('Error cleaning duplicates:', err);
    } finally {
      setCleaningDuplicates(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice #${invoiceNumber || 'INV'} from billing records?`)) return;
    try {
      await deleteDoc(doc(db, 'invoices', invoiceId));
      setCleanSuccessMsg(`Invoice #${invoiceNumber || 'INV'} removed.`);
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    }
  };

  // Auto-detect supply type naive logic (if client state matches firm state, but we don't have firm state, so we just toggle based on a dummy logic or leave it manual)
  useEffect(() => {
    if (selectedClient && selectedClient.gstin) {
      // Very basic assumption: if GSTIN starts with a specific state code. We'll default to Intra-State and let user change it.
      setSupplyType('Intra-State (CGST + SGST)');
    }
  }, [selectedClientId]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { service: '', sac: '', amount: 0, rate: 18 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleServiceSelect = (index: number, sacCodeObj: any) => {
    const newItems = [...lineItems];
    newItems[index] = {
      ...newItems[index],
      service: sacCodeObj.service,
      sac: sacCodeObj.sac,
      rate: sacCodeObj.rate
    };
    setLineItems(newItems);
  };

  const calculateTotals = () => {
    const taxableAmount = lineItems.reduce((sum, item) => sum + Number(item.amount), 0) + Number(additionalCharges);
    // Assuming uniform 18% for simplicity on total, or calculate per item
    const totalGst = lineItems.reduce((sum, item) => sum + (Number(item.amount) * (item.rate / 100)), 0) + (Number(additionalCharges) * 0.18);
    
    return {
      taxableAmount,
      totalGst,
      cgst: supplyType.includes('Intra-State') ? totalGst / 2 : 0,
      sgst: supplyType.includes('Intra-State') ? totalGst / 2 : 0,
      igst: supplyType.includes('Inter-State') ? totalGst : 0,
      grandTotal: taxableAmount + totalGst
    };
  };

  const totals = calculateTotals();

  const handleCreateRetainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !retainerData.clientId) return;
    const selected = clients.find(c => c.id === retainerData.clientId);
    try {
      await addDoc(collection(db, 'retainers'), {
        ...retainerData,
        clientName: selected?.name,
        status: 'Active',
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setIsRetainerModalOpen(false);
      setRetainerData({ clientId: '', amount: '', cycle: 'Monthly', startDate: '', serviceScope: '', autoInvoice: false, billingDay: '1st of month' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedClient) return;
    setIsSubmitting(true);
    
    // Generate Invoice Number
    const year = new Date().getFullYear();
    const shortYear = year.toString().slice(-2);
    const nextYear = (year + 1).toString().slice(-2);
    const invoiceNum = `INV-${year}-${nextYear}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await addDoc(collection(db, 'invoices'), {
        invoiceNumber: invoiceNum,
        type: invoiceType,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientGstin: selectedClient.gstin || '',
        clientPan: selectedClient.pan || '',
        supplyType,
        lineItems,
        additionalCharges: Number(additionalCharges),
        taxableAmount: totals.taxableAmount,
        cgstAmount: totals.cgst,
        sgstAmount: totals.sgst,
        igstAmount: totals.igst,
        totalGst: totals.totalGst,
        amount: totals.grandTotal, // backward compatibility
        grandTotal: totals.grandTotal,
        dueDate,
        paymentTerms,
        status: 'Unpaid',
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      alert('Failed to generate invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setInvoiceType('Tax Invoice');
    setSelectedClientId('');
    setLineItems([{ service: '', sac: '', amount: 0, rate: 18 }]);
    setAdditionalCharges(0);
    setDueDate('');
    setPaymentTerms('Net 15');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid': return <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">PAID</span>;
      case 'Overdue': return <span className="px-2 py-1 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">OVERDUE</span>;
      default: return <span className="px-2 py-1 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">UNPAID</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Credit Note': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'Receipt': return <Receipt className="w-4 h-4 text-emerald-500" />;
      default: return <FileText className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      <div className="p-4 sm:p-6 lg:p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between max-w-[1200px] mx-auto gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-indigo-600 font-bold text-base sm:text-lg">₹</span>
              </div>
              <span>Billing, Invoicing, & GST</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">Generate Tax Invoices, Proformas, Credit Notes, and Track Receivables.</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {onNavigateToOcr && (
              <button 
                onClick={onNavigateToOcr} 
                className="flex-1 sm:flex-initial justify-center flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <ScanText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Extract Invoice (OCR)</span>
              </button>
            )}
            <button 
                onClick={() => setIsRetainerModalOpen(true)} 
              className="flex-1 sm:flex-initial justify-center flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Retainer
            </button>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="flex-1 sm:flex-initial justify-center flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 bg-white border-b border-zinc-200 flex gap-4 sm:gap-6 shrink-0 overflow-x-auto">
        <button onClick={() => setActiveTab('invoices')} className={`pb-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'invoices' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>Invoices</button>
        <button onClick={() => setActiveTab('retainers')} className={`pb-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'retainers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>Retainers / Subscriptions</button>
        <button onClick={() => setActiveTab('credits')} className={`pb-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === 'credits' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>AI Agent Credits & Metering</span>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
            Autonomous
          </span>
        </button>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1200px] mx-auto w-full space-y-4 sm:space-y-6">
        {activeTab === 'credits' ? (
          <AgentCreditsTab />
        ) : activeTab === 'invoices' ? (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">

          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50">
            <div className="flex items-center gap-2.5">
              <h2 className="font-bold text-xs sm:text-sm text-zinc-900 uppercase tracking-widest">Billing Registry</h2>
              <span className="text-xs text-zinc-500 font-medium">({invoices.length} {invoices.length === 1 ? 'record' : 'records'})</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search invoices..." className="pl-9 pr-4 py-1.5 sm:py-2 border border-zinc-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-64" />
              </div>
              <button className="p-2 border border-zinc-200 rounded-full text-zinc-600 hover:bg-zinc-50 shrink-0 cursor-pointer">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DEDUPLICATION GUARANTEE BANNER */}
          {totalDuplicatesCount > 0 && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Duplicate Entries Detected:</strong> Found {totalDuplicatesCount} redundant {totalDuplicatesCount === 1 ? 'copy' : 'copies'} across {duplicateInvoiceGroups.length} invoice {duplicateInvoiceGroups.length === 1 ? 'number' : 'numbers'}.
                </span>
              </div>
              <button
                onClick={handleCleanDuplicates}
                disabled={cleaningDuplicates}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{cleaningDuplicates ? 'Deduplicating...' : 'Deduplicate Invoices Now'}</span>
              </button>
            </div>
          )}

          {cleanSuccessMsg && (
            <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between gap-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{cleanSuccessMsg}</span>
              </div>
              <button onClick={() => setCleanSuccessMsg(null)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="divide-y divide-zinc-100">
            {invoices.length === 0 ? (
              <div className="text-center text-zinc-500 py-12 sm:py-16 px-4">
                <FilePlus className="w-10 sm:w-12 h-10 sm:h-12 text-zinc-300 mx-auto mb-3 sm:mb-4" />
                <p className="font-medium text-zinc-900 text-sm sm:text-base">No invoices generated yet</p>
                <p className="text-xs sm:text-sm mt-1">Click New Invoice to raise your first bill.</p>
              </div>
            ) : (
              invoices.map(i => (
                <div key={i.id} className="p-3.5 sm:p-4 hover:bg-zinc-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                       {getTypeIcon(i.type || 'Tax Invoice')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 sm:mb-1 flex-wrap">
                        <span className="font-bold text-zinc-900 text-sm">{i.invoiceNumber || 'INV-XXX'}</span>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">{i.type || 'Tax Invoice'}</span>
                        {(i.source === 'OCR_DEV_TOOL' || i.ocrId) && (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ScanText className="w-2.5 h-2.5" />
                            OCR Extracted
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium truncate">{i.clientName || i.client}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pl-12 sm:pl-0">
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-bold text-zinc-900">₹{Number(i.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-zinc-400 font-medium">Due: {i.dueDate || 'N/A'}</div>
                    </div>
                    <div className="w-20 text-right">
                      {getStatusBadge(i.status)}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => downloadInvoicePDF(i)}
                        className="p-1.5 sm:p-2 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer" 
                        title="Download Tax Invoice as PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          const baseAmount = Number(i.amount) || 25000;
                          const taxableVal = Math.round(baseAmount / 1.18);
                          const gstVal = baseAmount - taxableVal;
                          const html = `
                            <div class="header-wrap sans">
                              <div>
                                <h1 class="firm-name">AARAV ADVISORS LLP</h1>
                                <div class="firm-sub">Chartered Accountants &bull; Tax Invoice</div>
                                <div class="firm-reg">
                                  <strong>Address:</strong> #102, SVS Majestic, Kukatpally, Hyderabad, Telangana – 500072<br/>
                                  <strong>Phone:</strong> +91 9701815868 &bull; <strong>Email:</strong> info@aaravadvisors.com<br/>
                                  <strong>LinkedIn:</strong> Aarav Advisors &bull; <strong>Coverage:</strong> India & Global &bull; <strong>ICAI Reg:</strong> 014285S
                                </div>
                              </div>
                              <div class="meta-block">
                                <div><strong>Invoice No:</strong> ${i.invoiceNumber || i.id}</div>
                                <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
                                <div><strong>Due Date:</strong> ${i.dueDate || 'Upon Receipt'}</div>
                              </div>
                            </div>
                            <div class="recipient-block sans">
                              <div style="font-size: 8.5pt; color: #64748b; font-weight: bold;">BILLED TO:</div>
                              <div style="font-size: 11pt; font-weight: bold; color: #0f172a;">${i.clientName || i.client}</div>
                              <div style="font-size: 9pt; color: #475569;">Status: ${i.status || 'Pending'}</div>
                            </div>
                            <table>
                              <thead>
                                <tr>
                                  <th>Description</th>
                                  <th>SAC</th>
                                  <th class="text-right">Taxable</th>
                                  <th class="text-right">GST (18%)</th>
                                  <th class="text-right">Total (INR)</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td><strong>${i.description || 'Statutory Audit & Tax Retainer'}</strong></td>
                                  <td>${i.sac || '998221'}</td>
                                  <td class="text-right">INR ${taxableVal.toLocaleString('en-IN')}</td>
                                  <td class="text-right">INR ${gstVal.toLocaleString('en-IN')}</td>
                                  <td class="text-right"><strong>INR ${baseAmount.toLocaleString('en-IN')}</strong></td>
                                </tr>
                              </tbody>
                            </table>
                          `;
                          printHtmlDocument(`Invoice_${i.invoiceNumber || i.id}`, html);
                        }}
                        className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer" 
                        title="Print Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer" title="Send to Client">
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(i.id, i.invoiceNumber)}
                        className="p-1.5 sm:p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                        title="Delete invoice from records"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="font-bold text-sm text-zinc-900 uppercase tracking-widest">Active Retainers</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {retainers.length === 0 ? (
                <div className="text-center text-zinc-500 py-16">
                  <p className="font-medium text-zinc-900">No active retainers</p>
                  <p className="text-sm mt-1">Set up recurring billing subscriptions for your clients.</p>
                </div>
              ) : (
                retainers.map(r => (
                  <div key={r.id} className="p-4 flex items-center justify-between group">
                    <div>
                      <div className="font-bold text-zinc-900 flex items-center gap-2">
                        {r.clientName}
                        {r.autoInvoice && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wider">Auto-Invoice</span>}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                        <span className="font-medium text-zinc-700">{r.serviceScope || 'Standard Retainer'}</span> • Started: {r.startDate} • {r.cycle} on {r.billingDay || '1st'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-indigo-600">₹{Number(r.amount).toLocaleString()}/{r.cycle === 'Monthly' ? 'mo' : r.cycle === 'Quarterly' ? 'qtr' : 'yr'}</div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 mt-1 inline-block">ACTIVE</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-3xl my-8">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70 sticky top-0 z-10">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-indigo-600" />
                Generate New Document
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              
              {/* Top Row: Type & Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Document Type</label>
                    <select value={invoiceType} onChange={e => setInvoiceType(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                      {INVOICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Select Client</label>
                    <select required value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                      <option value="">-- Choose a client --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Client Preview Card */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col justify-center">
                  {selectedClient ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-zinc-900 font-bold">
                        <Building className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="truncate">{selectedClient.name}</span>
                      </div>
                      <div className="text-xs text-zinc-600 flex items-center gap-2">
                        <span className="font-semibold w-12">GSTIN:</span> <span className="truncate">{selectedClient.gstin || <span className="text-rose-500 italic">Missing</span>}</span>
                      </div>
                      <div className="text-xs text-zinc-600 flex items-center gap-2">
                        <span className="font-semibold w-12">PAN:</span> {selectedClient.pan || <span className="text-rose-500 italic">Missing</span>}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-400 text-center italic">
                      Select a client to auto-fill details.
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Row: GST Type & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 border-t border-zinc-100 pt-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Supply Type (GST)</label>
                  <select value={supplyType} onChange={e => setSupplyType(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    <option value="Intra-State (CGST + SGST)">Intra-State (CGST + SGST)</option>
                    <option value="Inter-State (IGST)">Inter-State (IGST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Payment Terms</label>
                  <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Due Date</label>
                  <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t border-zinc-100 pt-6 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">Line Items (Services Provided)</label>
                  <button type="button" onClick={handleAddLineItem} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 bg-white border border-zinc-200 p-3 rounded-lg relative group">
                    <div className="flex-1 space-y-3">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <select 
                              className="w-full px-3 py-2 border border-zinc-200 rounded text-sm focus:ring-2 focus:ring-indigo-500/20 bg-zinc-50"
                              onChange={(e) => {
                                const selected = SAC_CODES.find(s => s.sac === e.target.value);
                                if (selected) handleServiceSelect(idx, selected);
                              }}
                              value={item.sac}
                            >
                              <option value="">-- Quick Select SAC Code --</option>
                              {SAC_CODES.map(sac => (
                                <option key={sac.sac} value={sac.sac}>{sac.sac} - {sac.service}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-500">SAC:</span>
                            <input required type="text" value={item.sac} onChange={e => { const newItems = [...lineItems]; newItems[idx].sac = e.target.value; setLineItems(newItems); }} className="w-full sm:w-24 px-2 py-1.5 border border-zinc-200 rounded text-sm focus:ring-2 focus:ring-indigo-500/20" placeholder="998XXX" />
                          </div>
                       </div>
                       <div>
                         <input required type="text" value={item.service} onChange={e => { const newItems = [...lineItems]; newItems[idx].service = e.target.value; setLineItems(newItems); }} className="w-full px-3 py-2 border border-zinc-200 rounded text-sm focus:ring-2 focus:ring-indigo-500/20" placeholder="Service Description..." />
                       </div>
                    </div>
                    <div className="w-full sm:w-32 flex sm:block items-center justify-between gap-3">
                       <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase">Amount (₹)</label>
                       <input required type="number" value={item.amount || ''} onChange={e => { const newItems = [...lineItems]; newItems[idx].amount = Number(e.target.value); setLineItems(newItems); }} className="w-32 sm:w-full px-3 py-2 border border-zinc-200 rounded text-sm focus:ring-2 focus:ring-indigo-500/20 text-right" placeholder="0.00" />
                    </div>
                    {lineItems.length > 1 && (
                      <button type="button" onClick={() => handleRemoveLineItem(idx)} className="self-end sm:self-auto sm:mt-6 p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-opacity cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals Section */}
              <div className="border-t border-zinc-100 pt-6 flex flex-col sm:flex-row justify-between gap-4">
                <div className="w-full sm:w-1/3">
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5 uppercase tracking-wider">Additional Charges (₹)</label>
                  <p className="text-[10px] text-zinc-500 mb-2">Out-of-pocket expenses, courier, filing fees, etc.</p>
                  <input type="number" value={additionalCharges || ''} onChange={e => setAdditionalCharges(Number(e.target.value))} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="0.00" />
                </div>
                
                <div className="w-full sm:w-1/2 bg-zinc-50 border border-zinc-200 rounded-xl p-4 sm:p-5 space-y-2 text-sm">
                  <div className="flex justify-between font-medium text-zinc-600">
                    <span>Taxable Amount</span>
                    <span>₹{totals.taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  
                  {supplyType.includes('Intra-State') ? (
                    <>
                      <div className="flex justify-between font-medium text-zinc-500 text-xs">
                        <span>CGST (9%)</span>
                        <span>₹{totals.cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-medium text-zinc-500 text-xs border-b border-zinc-200 pb-2">
                        <span>SGST (9%)</span>
                        <span>₹{totals.sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between font-medium text-zinc-500 text-xs border-b border-zinc-200 pb-2">
                      <span>IGST (18%)</span>
                      <span>₹{totals.igst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-zinc-900 text-lg pt-1">
                    <span>Grand Total</span>
                    <span>₹{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-6 border-t border-zinc-100 flex gap-3 justify-end sticky bottom-0 bg-white pb-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-full text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRetainerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-md">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">New Retainer</h3>
              <button onClick={() => setIsRetainerModalOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateRetainer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Select Client</label>
                <select required value={retainerData.clientId} onChange={e => setRetainerData({...retainerData, clientId: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20">
                  <option value="">-- Choose a client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Retainer Amount (₹) / Monthly Fee</label>
                <input required type="number" value={retainerData.amount} onChange={e => setRetainerData({...retainerData, amount: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Service Scope</label>
                <input required type="text" value={retainerData.serviceScope} onChange={e => setRetainerData({...retainerData, serviceScope: e.target.value})} placeholder="e.g. GST + Accounting + TDS" className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Billing Cycle</label>
                  <select value={retainerData.cycle} onChange={e => setRetainerData({...retainerData, cycle: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20">
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Billing Day</label>
                  <select value={retainerData.billingDay} onChange={e => setRetainerData({...retainerData, billingDay: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20">
                    <option value="1st of month">1st of month</option>
                    <option value="Last day of month">Last day of month</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Start Date</label>
                <input required type="date" value={retainerData.startDate} onChange={e => setRetainerData({...retainerData, startDate: e.target.value})} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                <input type="checkbox" id="autoInvoice" checked={retainerData.autoInvoice} onChange={e => setRetainerData({...retainerData, autoInvoice: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-zinc-300" />
                <label htmlFor="autoInvoice" className="text-xs font-bold text-zinc-700 cursor-pointer">Auto-Invoice Generation</label>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-indigo-700 transition-colors">
                Setup Retainer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
