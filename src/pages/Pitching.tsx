import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  X, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Users, 
  Building2, 
  Send, 
  ChevronRight, 
  Eye, 
  Trash2, 
  ArrowRight,
  Printer,
  Sparkles,
  Award,
  Filter,
  Briefcase,
  Download
} from 'lucide-react';
import { downloadQuotationPDF, printQuotation } from '../utils/printAndPdfUtils';
import { collection, addDoc, onSnapshot, serverTimestamp, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Prospect, Client } from '../types';
import { 
  INDUSTRY_SECTORS, 
  PRACTICE_SERVICES, 
  CA_PARTNERS, 
  BILLING_FREQUENCIES, 
  PAYMENT_TERMS_OPTIONS, 
  PIPELINE_STAGES,
  INITIAL_PROSPECTS 
} from '../data/clientAndProposalData';

export function Pitching() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProposalForView, setSelectedProposalForView] = useState<Prospect | null>(null);
  const [proposalForQuotation, setProposalForQuotation] = useState<Prospect | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState('ALL');
  const [convertedNotice, setConvertedNotice] = useState<string | null>(null);

  // Proposals State with localStorage & seed data fallback
  const [prospects, setProspects] = useState<Prospect[]>(() => {
    const saved = localStorage.getItem('caoms_proposals_pipeline');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse cached prospects', e);
      }
    }
    return INITIAL_PROSPECTS;
  });

  // Active form tab in modal
  const [activeFormTab, setActiveFormTab] = useState<'basics' | 'services' | 'commercials' | 'governance'>('basics');

  // New Proposal Form State
  const [formData, setFormData] = useState({
    companyName: '',
    proposalTitle: '',
    industry: 'IT & Software / SaaS',
    contactPerson: '',
    designation: 'Managing Director / CEO',
    email: '',
    phone: '',
    leadSource: 'Referral from Client',
    services: ['Statutory Audit (Companies Act 2013)', 'Tax Audit (Sec 44AB) & Corporate ITR'],
    scopeNotes: '',
    value: 150000,
    billingFrequency: 'Annual Fixed Fee',
    paymentTerms: '50% Advance & 50% upon Draft Deliverables',
    outOfPocketTerms: 'Billed at actuals with pre-approval',
    stage: 'Proposal Sent',
    probability: 70,
    targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    validityDate: '30 Days from issuance',
    assignedPartner: 'CA Aarav Patel (Managing Partner)'
  });

  // Sync with Firestore if user is authenticated
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'prospects'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prospect));
        setProspects(data);
        localStorage.setItem('caoms_proposals_pipeline', JSON.stringify(data));
      }
    }, (error) => {
      console.warn('Firestore prospects query notice (offline or rules fallback):', error);
    });
    return () => unsubscribe();
  }, []);

  const updateProspectsState = (newProspects: Prospect[]) => {
    setProspects(newProspects);
    localStorage.setItem('caoms_proposals_pipeline', JSON.stringify(newProspects));
  };

  // Toggle services scope
  const handleToggleService = (service: string) => {
    setFormData(prev => {
      const current = Array.isArray(prev.services) ? prev.services : [];
      const exists = current.includes(service);
      return {
        ...prev,
        services: exists ? current.filter(s => s !== service) : [...current, service]
      };
    });
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      proposalTitle: '',
      industry: 'IT & Software / SaaS',
      contactPerson: '',
      designation: 'Managing Director / CEO',
      email: '',
      phone: '',
      leadSource: 'Referral from Client',
      services: ['Statutory Audit (Companies Act 2013)', 'Tax Audit (Sec 44AB) & Corporate ITR'],
      scopeNotes: '',
      value: 150000,
      billingFrequency: 'Annual Fixed Fee',
      paymentTerms: '50% Advance & 50% upon Draft Deliverables',
      outOfPocketTerms: 'Billed at actuals with pre-approval',
      stage: 'Proposal Sent',
      probability: 70,
      targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      validityDate: '30 Days from issuance',
      assignedPartner: 'CA Aarav Patel (Managing Partner)'
    });
    setActiveFormTab('basics');
  };

  // Submit Handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      alert('Please provide prospect company legal name.');
      return;
    }

    const newProspect: Prospect = {
      id: `prop-${Date.now()}`,
      companyName: formData.companyName.trim(),
      proposalTitle: formData.proposalTitle.trim() || `${formData.companyName} Engagement Proposal`,
      industry: formData.industry,
      contactPerson: formData.contactPerson.trim(),
      designation: formData.designation.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      leadSource: formData.leadSource,
      services: formData.services,
      scopeNotes: formData.scopeNotes.trim(),
      value: Number(formData.value) || 0,
      estimatedFees: Number(formData.value) || 0,
      billingFrequency: formData.billingFrequency,
      paymentTerms: formData.paymentTerms,
      outOfPocketTerms: formData.outOfPocketTerms,
      stage: formData.stage,
      status: formData.stage,
      probability: Number(formData.probability) || 50,
      targetDate: formData.targetDate,
      validityDate: formData.validityDate,
      assignedPartner: formData.assignedPartner,
      ownerId: auth.currentUser?.uid || 'local-user',
    };

    const updated = [newProspect, ...prospects];
    updateProspectsState(updated);

    if (auth.currentUser) {
      try {
        const docRef = await addDoc(collection(db, 'prospects'), {
          ...newProspect,
          ownerId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        newProspect.id = docRef.id;
      } catch (err) {
        console.warn('Firestore prospect write warning:', err);
      }
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Change stage directly
  const handleUpdateStage = async (prospectId: string, newStage: string) => {
    const updated = prospects.map(p => {
      if (p.id === prospectId) {
        const prob = newStage === 'Won' ? 100 : newStage === 'Lost' ? 0 : newStage === 'Negotiation' ? 85 : newStage === 'Proposal Sent' ? 70 : 30;
        return { ...p, stage: newStage, status: newStage, probability: prob };
      }
      return p;
    });
    updateProspectsState(updated);

    if (auth.currentUser && !prospectId.startsWith('prop-')) {
      try {
        await updateDoc(doc(db, 'prospects', prospectId), {
          stage: newStage,
          status: newStage
        });
      } catch (err) {
        console.warn('Firestore update warning:', err);
      }
    }
  };

  // Delete Proposal
  const handleDeleteProposal = async (prospectId: string, companyName: string) => {
    if (!window.confirm(`Delete proposal for "${companyName}" from the pipeline?`)) return;
    const updated = prospects.filter(p => p.id !== prospectId);
    updateProspectsState(updated);

    if (selectedProposalForView?.id === prospectId) setSelectedProposalForView(null);

    if (auth.currentUser && !prospectId.startsWith('prop-')) {
      try {
        await deleteDoc(doc(db, 'prospects', prospectId));
      } catch (err) {
        console.warn('Firestore delete notice:', err);
      }
    }
  };

  // Convert Won Proposal to Client
  const handleConvertToClient = async (prospect: Prospect) => {
    // 1. Mark proposal as won if not already
    handleUpdateStage(prospect.id, 'Won');

    // 2. Prepare new client entry
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: prospect.companyName,
      entityType: prospect.industry?.includes('LLP') ? 'Limited Liability Partnership (LLP)' : 'Private Limited Company (Pvt Ltd)',
      industry: prospect.industry || 'IT & Software / SaaS',
      pan: '',
      gstin: '',
      contactPerson: prospect.contactPerson || '',
      designation: prospect.designation || 'Director',
      email: prospect.email || '',
      phone: prospect.phone || '',
      status: 'Onboarding',
      partner: prospect.assignedPartner || 'CA Aarav Patel (Managing Partner)',
      engagementScope: Array.isArray(prospect.services) ? prospect.services : [String(prospect.services)],
      engagementType: prospect.billingFrequency || 'Retainer',
      agreedFee: prospect.value,
      feeBillingFrequency: prospect.billingFrequency || 'Monthly Retainer',
      notes: `Converted from Business Development Proposal. Original Scope: ${prospect.proposalTitle || 'Engagement Proposal'}. Notes: ${prospect.scopeNotes || 'None'}`,
      mfaEnabled: true,
      ownerId: auth.currentUser?.uid || 'local-user'
    };

    // 3. Save to localStorage client list
    const existingClientsRaw = localStorage.getItem('caoms_corporate_clients');
    let clientsList: Client[] = [];
    if (existingClientsRaw) {
      try { clientsList = JSON.parse(existingClientsRaw); } catch (e) {}
    }
    const updatedClients = [newClient, ...clientsList];
    localStorage.setItem('caoms_corporate_clients', JSON.stringify(updatedClients));

    // 4. Save to Firestore if connected
    if (auth.currentUser) {
      try {
        await addDoc(collection(db, 'clients'), {
          ...newClient,
          ownerId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.warn('Firestore client add warning:', e);
      }
    }

    setConvertedNotice(`Successfully converted "${prospect.companyName}" to Client Database in Onboarding status!`);
    setTimeout(() => setConvertedNotice(null), 5000);
  };

  // Filtered Proposals
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        p.companyName.toLowerCase().includes(q) ||
        (p.proposalTitle && p.proposalTitle.toLowerCase().includes(q)) ||
        (p.contactPerson && p.contactPerson.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q));

      const matchesStage = selectedStageFilter === 'ALL' || (p.stage || p.status) === selectedStageFilter;
      const matchesPartner = selectedPartnerFilter === 'ALL' || p.assignedPartner?.includes(selectedPartnerFilter);

      return matchesSearch && matchesStage && matchesPartner;
    });
  }, [prospects, searchQuery, selectedStageFilter, selectedPartnerFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = prospects.length;
    const totalPipelineValue = prospects.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
    const weightedPipelineValue = prospects.reduce((acc, p) => {
      const prob = p.probability !== undefined ? p.probability : (p.status === 'Won' ? 100 : 50);
      return acc + ((Number(p.value) || 0) * (prob / 100));
    }, 0);
    const wonValue = prospects
      .filter(p => (p.stage || p.status) === 'Won')
      .reduce((acc, p) => acc + (Number(p.value) || 0), 0);
    const activeCount = prospects.filter(p => (p.stage || p.status) !== 'Won' && (p.stage || p.status) !== 'Lost').length;

    return { totalCount, totalPipelineValue, weightedPipelineValue, wonValue, activeCount };
  }, [prospects]);

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header Bar */}
      <div className="p-6 md:p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between max-w-[1600px] mx-auto gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              <span>Business Development</span>
              <span>/</span>
              <span>Audit & Advisory Proposals</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              Proposals & Pitching Funnel
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Track client pitches, generate statutory audit proposals, negotiate commercial retainers, and convert won deals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }} 
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Create New Proposal
            </button>
          </div>
        </div>

        {/* Success Banner on Conversion */}
        {convertedNotice && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between max-w-[1600px] mx-auto animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{convertedNotice}</span>
            </div>
            <button onClick={() => setConvertedNotice(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 max-w-[1600px] mx-auto">
          <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Pipeline Value</div>
            <div className="text-2xl font-bold text-zinc-900 mt-1">₹{metrics.totalPipelineValue.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{metrics.totalCount} active & closed proposals</div>
          </div>
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/60">
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Probability-Weighted Pipeline</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">₹{Math.round(metrics.weightedPipelineValue).toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-blue-600 mt-0.5">Risk-adjusted expected fee run-rate</div>
          </div>
          <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/60">
            <div className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Active Deals in Funnel</div>
            <div className="text-2xl font-bold text-purple-900 mt-1">{metrics.activeCount}</div>
            <div className="text-[11px] text-purple-600 mt-0.5">Under discovery & negotiation</div>
          </div>
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Closed Won Engagements</div>
            <div className="text-2xl font-bold text-emerald-900 mt-1">₹{metrics.wonValue.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Won fee revenue secured</div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="px-6 md:px-8 py-4 bg-white border-b border-zinc-200 shrink-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 max-w-[1600px] mx-auto">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by prospect company, title, contact, email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Stages</option>
              {PIPELINE_STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            <select
              value={selectedPartnerFilter}
              onChange={(e) => setSelectedPartnerFilter(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All CA Partners</option>
              <option value="Aarav">CA Aarav Patel</option>
              <option value="Hari Krishna">CA Hari Krishna</option>
              <option value="Priya Nair">CA Priya Nair</option>
              <option value="Rajesh Sharma">CA Rajesh Sharma</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50">
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'board' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Kanban Board
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Proposals Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
        {filteredProspects.length === 0 ? (
          <div className="text-center py-16 bg-white border border-zinc-200 rounded-2xl p-8 shadow-xs">
            <TrendingUp className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <div className="text-base font-bold text-zinc-900">No proposals match your search criteria</div>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Clear filters or create a new proposal agreement to log deals in your practice pipeline.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStageFilter('ALL');
                setSelectedPartnerFilter('ALL');
              }}
              className="mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'board' ? (
          /* Kanban Board View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
            {PIPELINE_STAGES.filter(s => s.id !== 'Lost').map(stage => {
              const stageDeals = filteredProspects.filter(p => (p.stage || p.status) === stage.id);
              const stageValue = stageDeals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);

              return (
                <div key={stage.id} className="bg-zinc-100/70 border border-zinc-200 rounded-2xl p-4 flex flex-col max-h-[calc(100vh-320px)]">
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-800 uppercase tracking-wider">{stage.label}</span>
                      <span className="text-[11px] font-bold bg-white text-zinc-700 px-2 py-0.5 rounded-full border border-zinc-200 shadow-xs">
                        {stageDeals.length}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-700">₹{stageValue.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Deals Scrollable List */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {stageDeals.length === 0 ? (
                      <div className="text-center text-[11px] text-zinc-400 py-8 border border-dashed border-zinc-200 rounded-xl bg-white/40">
                        No active deals
                      </div>
                    ) : (
                      stageDeals.map(deal => (
                        <div 
                          key={deal.id}
                          className="p-4 bg-white border border-zinc-200 rounded-xl shadow-xs hover:shadow hover:border-indigo-300 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            {/* Industry & Win Probability */}
                            <div className="flex items-center justify-between gap-1 text-[10px]">
                              <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 truncate max-w-[140px]">
                                {deal.industry || 'Corporate'}
                              </span>
                              <span className="font-semibold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                                {deal.probability || 50}% Win Prob
                              </span>
                            </div>

                            {/* Company Name & Proposal Title */}
                            <h4 className="font-bold text-zinc-900 text-sm mt-2 group-hover:text-indigo-600 transition-colors">
                              {deal.companyName}
                            </h4>
                            <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5 font-medium">
                              {deal.proposalTitle || 'Engagement Proposal'}
                            </p>

                            {/* Services pills */}
                            {deal.services && (
                              <div className="mt-2.5 flex flex-wrap gap-1">
                                {(Array.isArray(deal.services) ? deal.services : [deal.services]).slice(0, 2).map((srv, sIdx) => (
                                  <span key={sIdx} className="text-[9px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                                    {String(srv).split('(')[0].trim()}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Contact Person */}
                            {deal.contactPerson && (
                              <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1">
                                <Users className="w-3 h-3 text-zinc-400 shrink-0" />
                                <span className="truncate">{deal.contactPerson}</span>
                              </div>
                            )}
                          </div>

                          {/* Commercials & Actions */}
                          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-zinc-900">
                                ₹{deal.value?.toLocaleString('en-IN')}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-medium">
                                {deal.billingFrequency || 'Retainer'}
                              </div>
                            </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setSelectedProposalForView(deal)}
                                  className="p-1 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    downloadQuotationPDF(deal);
                                    setConvertedNotice(`Downloaded official Quotation PDF for ${deal.companyName}`);
                                  }}
                                  className="p-1 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Save Quotation as PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setProposalForQuotation(deal)}
                                  className="p-1 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Preview & Print Quotation Letterhead"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                {deal.stage !== 'Won' && (
                                  <button
                                    onClick={() => handleConvertToClient(deal)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title="Convert to Client"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Detailed Table View */
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Prospect Company</th>
                    <th className="p-4">Proposal Scope & Services</th>
                    <th className="p-4">Contact Person</th>
                    <th className="p-4">Proposed Fee</th>
                    <th className="p-4">Stage</th>
                    <th className="p-4">Win Prob</th>
                    <th className="p-4">Lead Partner</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredProspects.map(deal => (
                    <tr key={deal.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-zinc-900">{deal.companyName}</div>
                        <div className="text-[11px] text-zinc-400">{deal.industry || 'General Corporate'}</div>
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="font-medium text-zinc-800 truncate" title={deal.proposalTitle}>
                          {deal.proposalTitle || 'Statutory Engagement'}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {Array.isArray(deal.services) ? deal.services.join(', ') : deal.services}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-zinc-800">{deal.contactPerson || '—'}</div>
                        <div className="text-[10px] text-zinc-400">{deal.email || deal.phone || ''}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-zinc-900">₹{deal.value?.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-zinc-400">{deal.billingFrequency}</div>
                      </td>
                      <td className="p-4">
                        <select
                          value={deal.stage || deal.status}
                          onChange={(e) => handleUpdateStage(deal.id, e.target.value)}
                          className="px-2 py-1 rounded text-[11px] font-semibold border border-zinc-200 bg-white"
                        >
                          {PIPELINE_STAGES.map(st => (
                            <option key={st.id} value={st.id}>{st.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-700">
                          <div className="w-12 bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full rounded-full" 
                              style={{ width: `${deal.probability || 50}%` }}
                            />
                          </div>
                          <span>{deal.probability || 50}%</span>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-700 text-[11px]">
                        {deal.assignedPartner?.split('(')[0] || 'CA Aarav Patel'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedProposalForView(deal)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Proposal Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              downloadQuotationPDF(deal);
                              setConvertedNotice(`Downloaded official Quotation PDF for ${deal.companyName}`);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Save Quotation as PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProposalForQuotation(deal)}
                            className="p-1.5 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"
                            title="Formal Quotation Preview & Print"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleConvertToClient(deal)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Convert to Client"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProposal(deal.id, deal.companyName)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Proposal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 360° PROPOSAL DETAILS MODAL                              */}
      {/* ======================================================== */}
      {selectedProposalForView && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/70 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                  {selectedProposalForView.stage || selectedProposalForView.status}
                </span>
                <h2 className="text-xl font-bold text-zinc-900 mt-1">{selectedProposalForView.companyName}</h2>
                <p className="text-xs text-zinc-500">{selectedProposalForView.proposalTitle}</p>
              </div>
              <button 
                onClick={() => setSelectedProposalForView(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Financials & Probability */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-zinc-400 font-medium">Proposed Fee:</span>
                  <div className="text-base font-bold text-zinc-900 mt-0.5">₹{selectedProposalForView.value?.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-zinc-500">{selectedProposalForView.billingFrequency}</span>
                </div>
                <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl">
                  <span className="text-blue-600 font-medium">Win Probability:</span>
                  <div className="text-base font-bold text-blue-900 mt-0.5">{selectedProposalForView.probability || 50}%</div>
                  <span className="text-[10px] text-blue-600">Expected: ₹{Math.round((selectedProposalForView.value || 0) * ((selectedProposalForView.probability || 50) / 100)).toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <span className="text-zinc-400 font-medium">Target Decision Date:</span>
                  <div className="text-sm font-bold text-zinc-900 mt-1">{selectedProposalForView.targetDate || 'Pending'}</div>
                  <span className="text-[10px] text-zinc-500">Validity: {selectedProposalForView.validityDate || '30 Days'}</span>
                </div>
              </div>

              {/* Point of Contact */}
              <div className="p-4 border border-zinc-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Prospect Decision Maker</h4>
                <div className="flex items-center gap-2 font-bold text-zinc-900 text-sm">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>{selectedProposalForView.contactPerson || 'Not Provided'}</span>
                  <span className="text-xs font-normal text-zinc-500">({selectedProposalForView.designation})</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-zinc-600">
                  <div>Email: <span className="font-semibold text-zinc-800">{selectedProposalForView.email || '—'}</span></div>
                  <div>Phone: <span className="font-semibold text-zinc-800">{selectedProposalForView.phone || '—'}</span></div>
                  <div>Lead Source: <span className="font-semibold text-zinc-800">{selectedProposalForView.leadSource || 'Inbound'}</span></div>
                  <div>Assigned CA: <span className="font-semibold text-zinc-800">{selectedProposalForView.assignedPartner || 'CA Aarav Patel'}</span></div>
                </div>
              </div>

              {/* Practice Services */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Proposed Services Scope</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(selectedProposalForView.services) ? selectedProposalForView.services : [selectedProposalForView.services]).map((s, idx) => (
                    <span key={idx} className="bg-white text-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 font-medium">
                      ✓ {String(s)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Commercial Terms & Notes */}
              <div className="p-4 border border-zinc-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Payment & Commercial Terms</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>Payment Terms: <span className="font-semibold text-zinc-900">{selectedProposalForView.paymentTerms || 'Standard'}</span></div>
                  <div>Out-of-Pocket: <span className="font-semibold text-zinc-900">{selectedProposalForView.outOfPocketTerms || 'At actuals'}</span></div>
                </div>
                {selectedProposalForView.scopeNotes && (
                  <div className="mt-2 pt-2 border-t border-zinc-100">
                    <span className="font-semibold text-zinc-700">Special Deliverables & Turnaround SLAs:</span>
                    <p className="text-zinc-600 mt-1 italic">{selectedProposalForView.scopeNotes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setProposalForQuotation(selectedProposalForView);
                    setSelectedProposalForView(null);
                  }}
                  className="px-3.5 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  Preview Quotation
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedProposalForView.stage !== 'Won' && (
                  <button
                    onClick={() => {
                      handleConvertToClient(selectedProposalForView);
                      setSelectedProposalForView(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Convert to Client
                  </button>
                )}
                <button
                  onClick={() => setSelectedProposalForView(null)}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FORMAL PROPOSAL QUOTATION PREVIEW MODAL                  */}
      {/* ======================================================== */}
      {proposalForQuotation && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-3xl max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Formal Professional Engagement Quotation</h3>
                  <p className="text-[11px] text-zinc-500 font-sans">ICAI Standards on Auditing (SA) Compliant Letterhead</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    downloadQuotationPDF(proposalForQuotation);
                    setConvertedNotice(`Downloaded official Quotation PDF for ${proposalForQuotation.companyName}`);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Save quotation as PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save as PDF
                </button>
                <button
                  onClick={() => printQuotation(proposalForQuotation)}
                  className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Print official quotation"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button 
                  onClick={() => setProposalForQuotation(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Letterhead Preview */}
            <div className="p-8 overflow-y-auto space-y-6 text-zinc-800 font-serif">
              {/* Firm Header */}
              <div className="border-b-2 border-zinc-900 pb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-zinc-900 uppercase">AARAV ADVISORS LLP</h1>
                  <p className="text-[11px] font-sans font-semibold text-indigo-600 uppercase tracking-wider mt-0.5">Chartered Accountants • Statutory Auditors • Tax Consultants</p>
                  <div className="text-xs font-sans text-zinc-600 mt-2 space-y-0.5">
                    <div><span className="font-semibold text-zinc-800">Address:</span> #102, SVS Majestic, Kukatpally, Hyderabad, Telangana – 500072</div>
                    <div><span className="font-semibold text-zinc-800">Phone:</span> +91 9701815868 &bull; <span className="font-semibold text-zinc-800">Email:</span> info@aaravadvisors.com</div>
                    <div><span className="font-semibold text-zinc-800">LinkedIn:</span> Aarav Advisors &bull; <span className="font-semibold text-zinc-800">Coverage:</span> India & Global &bull; <span className="font-semibold text-zinc-800">Reg No:</span> 014285S</div>
                  </div>
                </div>
                <div className="text-right font-sans text-xs text-zinc-500">
                  <div className="font-bold text-zinc-900">Ref: AA/PROP/2026/089</div>
                  <div>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>

              {/* Addressee */}
              <div className="font-sans text-xs space-y-1">
                <div className="font-semibold text-zinc-500 uppercase">To:</div>
                <div className="font-bold text-sm text-zinc-900">{proposalForQuotation.contactPerson || 'The Board of Directors'}</div>
                <div className="font-medium text-zinc-700">{proposalForQuotation.designation || 'Management'}</div>
                <div className="font-bold text-zinc-900 text-sm">{proposalForQuotation.companyName}</div>
                {proposalForQuotation.email && <div>Email: {proposalForQuotation.email}</div>}
              </div>

              {/* Subject */}
              <div className="p-3 bg-zinc-50 border-l-4 border-indigo-600 font-sans text-xs font-bold text-zinc-900">
                Subject: Professional Proposal & Fee Quotation for {proposalForQuotation.proposalTitle || 'Statutory & Tax Compliance'}
              </div>

              {/* Body */}
              <div className="font-sans text-xs text-zinc-700 leading-relaxed space-y-3">
                <p>Dear Sir/Madam,</p>
                <p>
                  We thank you for the opportunity to submit our proposal for providing comprehensive statutory, auditing, and tax regulatory advisory services to <strong>{proposalForQuotation.companyName}</strong>. As an established multi-disciplinary Chartered Accountancy firm, we adhere strictly to the Standards on Auditing (SAs) issued by the Institute of Chartered Accountants of India (ICAI).
                </p>

                <div className="font-bold text-zinc-900 mt-4 uppercase text-[11px] tracking-wider">1. Scope of Professional Engagement:</div>
                <ul className="list-disc pl-5 space-y-1.5">
                  {(Array.isArray(proposalForQuotation.services) ? proposalForQuotation.services : [proposalForQuotation.services]).map((s, idx) => (
                    <li key={idx} className="font-medium text-zinc-800">{String(s)}</li>
                  ))}
                </ul>

                <div className="font-bold text-zinc-900 mt-4 uppercase text-[11px] tracking-wider">2. Commercial Terms & Professional Fees:</div>
                <table className="w-full border border-zinc-200 text-left my-2">
                  <thead className="bg-zinc-100 text-zinc-700">
                    <tr>
                      <th className="p-2.5 border-b border-zinc-200">Particulars</th>
                      <th className="p-2.5 border-b border-zinc-200">Billing Model</th>
                      <th className="p-2.5 border-b border-zinc-200 text-right">Fee (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2.5 border-b border-zinc-100 font-semibold">{proposalForQuotation.proposalTitle}</td>
                      <td className="p-2.5 border-b border-zinc-100">{proposalForQuotation.billingFrequency}</td>
                      <td className="p-2.5 border-b border-zinc-100 text-right font-bold">₹{proposalForQuotation.value?.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[11px] text-zinc-500">
                  * Applicable Goods & Services Tax (GST @ 18%) shall be billed extra. Out of pocket expenses: {proposalForQuotation.outOfPocketTerms || 'At actuals'}. Payment terms: {proposalForQuotation.paymentTerms || 'Net 15 days'}.
                </p>

                <div className="font-bold text-zinc-900 mt-4 uppercase text-[11px] tracking-wider">3. Lead Engagement Partner:</div>
                <p>
                  The assignment will be personally supervised by <strong>{proposalForQuotation.assignedPartner || 'CA Aarav Patel, FCA'}</strong> with dedicated article assistants and qualified seniors.
                </p>
              </div>

              {/* Sign-off */}
              <div className="pt-6 font-sans text-xs flex justify-between items-end border-t border-zinc-200">
                <div>
                  <div className="font-bold text-zinc-900">For AARAV ADVISORS LLP</div>
                  <div className="text-zinc-500 mt-4">Authorized Partner Signatory</div>
                  <div className="text-[10px] text-zinc-400">Membership No: 512390 • FRN: 014285S</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-zinc-900">Accepted & Confirmed by Client:</div>
                  <div className="mt-8 border-t border-zinc-400 w-48 text-right text-[10px] text-zinc-500">Authorized Signature & Company Seal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* COMPREHENSIVE NEW PROPOSAL MODAL                         */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70 shrink-0">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Create New Client Engagement Proposal</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Structure fees, practice scope, SLAs, and commercial payment terms.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 py-2 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveFormTab('basics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFormTab === 'basics'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60'
                }`}
              >
                1. Prospect & Contact
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('services')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFormTab === 'services'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60'
                }`}
              >
                2. Practice Services Scope
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('commercials')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFormTab === 'commercials'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60'
                }`}
              >
                3. Fees & Payment Terms
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('governance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFormTab === 'governance'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60'
                }`}
              >
                4. Funnel Stage & Partner
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* TAB 1: PROSPECT BASICS */}
              {activeFormTab === 'basics' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Prospect / Client Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={formData.companyName} 
                      onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))} 
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600" 
                      placeholder="e.g. Nexus Robotics Technologies Pvt Ltd" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Proposal / Engagement Title <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={formData.proposalTitle} 
                      onChange={e => setFormData(p => ({ ...p, proposalTitle: e.target.value }))} 
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600" 
                      placeholder="e.g. FY 2025-26 Statutory & Tax Audit Engagement" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Industry Sector</label>
                      <select
                        value={formData.industry}
                        onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {INDUSTRY_SECTORS.map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Lead Acquisition Source</label>
                      <select
                        value={formData.leadSource}
                        onChange={e => setFormData(p => ({ ...p, leadSource: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="Referral from Client">Referral from Existing Client</option>
                        <option value="Inbound Website Inquiry">Inbound Website Inquiry</option>
                        <option value="Partner Network">Partner Network / Venture Capital</option>
                        <option value="LinkedIn Outreach">LinkedIn / Professional Outreach</option>
                        <option value="Conference / Event">Industry Seminar or Conference</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Key Decision Maker Name</label>
                      <input 
                        type="text" 
                        value={formData.contactPerson} 
                        onChange={e => setFormData(p => ({ ...p, contactPerson: e.target.value }))} 
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20" 
                        placeholder="e.g. Siddharth Rao" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Designation</label>
                      <input 
                        type="text" 
                        value={formData.designation} 
                        onChange={e => setFormData(p => ({ ...p, designation: e.target.value }))} 
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20" 
                        placeholder="Managing Director / CFO / Founder" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Official Email Address</label>
                      <input 
                        type="email" 
                        value={formData.email} 
                        onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} 
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20" 
                        placeholder="siddharth@company.com" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Mobile / Phone Number</label>
                      <input 
                        type="tel" 
                        value={formData.phone} 
                        onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} 
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20" 
                        placeholder="+91 98450 11223" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SERVICES SCOPE */}
              {activeFormTab === 'services' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Included Professional Practice Areas (Multi-Select)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {PRACTICE_SERVICES.map(srv => {
                        const checked = formData.services.includes(srv);
                        return (
                          <div
                            key={srv}
                            onClick={() => handleToggleService(srv)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-center gap-2 ${
                              checked 
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold' 
                                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={checked} 
                              onChange={() => {}} 
                              className="rounded text-indigo-600 pointer-events-none"
                            />
                            <span className="truncate">{srv}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Deliverables, Turnaround Timelines & Scope Specifics
                    </label>
                    <textarea 
                      rows={4} 
                      value={formData.scopeNotes} 
                      onChange={e => setFormData(p => ({ ...p, scopeNotes: e.target.value }))} 
                      className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20" 
                      placeholder="e.g. Scope encompasses issuance of 3CD and 3CA report before Sept 30; quarterly GSTR-2B ITC matching against client ERP; client responsible for providing bank statements by 5th of each month." 
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: COMMERCIALS & PRICING */}
              {activeFormTab === 'commercials' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Proposed Professional Engagement Fee (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        required 
                        type="number" 
                        value={formData.value} 
                        onChange={e => setFormData(p => ({ ...p, value: Number(e.target.value) || 0 }))} 
                        className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20" 
                        placeholder="150000" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Billing Model / Frequency</label>
                      <select
                        value={formData.billingFrequency}
                        onChange={e => setFormData(p => ({ ...p, billingFrequency: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {BILLING_FREQUENCIES.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Payment Schedule & Terms</label>
                    <select
                      value={formData.paymentTerms}
                      onChange={e => setFormData(p => ({ ...p, paymentTerms: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {PAYMENT_TERMS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Out-of-Pocket Expenses (OPE)</label>
                      <select
                        value={formData.outOfPocketTerms}
                        onChange={e => setFormData(p => ({ ...p, outOfPocketTerms: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="Billed at actuals with pre-approval">Billed at actuals with client pre-approval</option>
                        <option value="Fixed 5% of professional fees">Fixed 5% of professional fees</option>
                        <option value="Inclusive in fee">Inclusive in fee</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Proposal Validity Window</label>
                      <select
                        value={formData.validityDate}
                        onChange={e => setFormData(p => ({ ...p, validityDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="15 Days from issuance">15 Days from issuance</option>
                        <option value="30 Days from issuance">30 Days from issuance</option>
                        <option value="45 Days from issuance">45 Days from issuance</option>
                        <option value="End of current fiscal quarter">End of current fiscal quarter</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: GOVERNANCE & FUNNEL */}
              {activeFormTab === 'governance' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Initial Pipeline Stage</label>
                      <select
                        value={formData.stage}
                        onChange={e => setFormData(p => ({ ...p, stage: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {PIPELINE_STAGES.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Lead Engagement Partner</label>
                      <select
                        value={formData.assignedPartner}
                        onChange={e => setFormData(p => ({ ...p, assignedPartner: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {CA_PARTNERS.map(cp => (
                          <option key={cp} value={cp}>{cp}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-zinc-700">Estimated Win Probability (%):</label>
                      <span className="text-xs font-bold text-indigo-600">{formData.probability}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      step="5"
                      value={formData.probability} 
                      onChange={e => setFormData(p => ({ ...p, probability: Number(e.target.value) }))} 
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
                      <span>10% (Low / Exploratory)</span>
                      <span>50% (Proposal Reviewed)</span>
                      <span>100% (Confirmed Won)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Target Decision / Close Date</label>
                    <input 
                      type="date" 
                      value={formData.targetDate} 
                      onChange={e => setFormData(p => ({ ...p, targetDate: e.target.value }))} 
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20" 
                    />
                  </div>

                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900">
                      <span className="font-bold">Automated Client Conversion:</span> When this proposal is moved to 'Won', you can convert it into an official client entry in 1 click!
                    </div>
                  </div>
                </div>
              )}

              {/* Form Navigation and Submission */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between shrink-0">
                <div>
                  {activeFormTab !== 'basics' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFormTab === 'governance') setActiveFormTab('commercials');
                        else if (activeFormTab === 'commercials') setActiveFormTab('services');
                        else if (activeFormTab === 'services') setActiveFormTab('basics');
                      }}
                      className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-semibold hover:bg-zinc-50 transition-colors"
                    >
                      Back
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeFormTab !== 'governance' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFormTab === 'basics') setActiveFormTab('services');
                        else if (activeFormTab === 'services') setActiveFormTab('commercials');
                        else if (activeFormTab === 'commercials') setActiveFormTab('governance');
                      }}
                      className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      Next Step
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-sm hover:shadow transition-all"
                    >
                      Create & Log Proposal
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
