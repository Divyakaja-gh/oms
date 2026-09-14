import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  X, 
  Building2, 
  FileText, 
  CreditCard, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  Eye,
  Trash2,
  FileSpreadsheet,
  Download,
  Building,
  Sliders
} from 'lucide-react';
import { collection, addDoc, onSnapshot, serverTimestamp, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Client } from '../types';
import { OnboardingEmailModal } from '../components/onboarding/OnboardingEmailModal';
import { CustomFieldConfigModal } from '../components/settings/CustomFieldConfigModal';
import { 
  INDIAN_STATES_WITH_GST_CODES, 
  ENTITY_TYPES, 
  INDUSTRY_SECTORS, 
  PRACTICE_SERVICES, 
  CA_PARTNERS, 
  BILLING_FREQUENCIES,
  INITIAL_CLIENTS 
} from '../data/clientAndProposalData';
import { 
  validatePan, 
  validateGSTIN, 
  validateTAN, 
  validateCIN, 
  validatePhone, 
  validateEmail, 
  validatePincode 
} from '../utils/validators';
import { 
  validateCompleteClientForm, 
  detectSqlInjection 
} from '../utils/securityValidators';

export function Clients() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomFieldsModalOpen, setIsCustomFieldsModalOpen] = useState(false);
  const [selectedClientForView, setSelectedClientForView] = useState<Client | null>(null);
  const [clientForEmail, setClientForEmail] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPartner, setSelectedPartner] = useState('ALL');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Client list state with localStorage & seed data fallback
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('caoms_corporate_clients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse cached clients', e);
      }
    }
    return INITIAL_CLIENTS;
  });

  // Modal form tab
  const [activeFormTab, setActiveFormTab] = useState<'entity' | 'statutory' | 'contact' | 'engagement'>('entity');

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    entityType: 'Private Limited Company (Pvt Ltd)',
    industry: 'IT & Software / SaaS',
    pan: '',
    gstin: '',
    tan: '',
    cin: '',
    udyamNo: '',
    contactPerson: '',
    designation: 'Managing Director',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Karnataka',
    pincode: '',
    status: 'Active',
    partner: 'CA Aarav Patel (Managing Partner)',
    articleAssigned: 'T. Varsha (Article Staff)',
    engagementScope: ['Statutory Audit (Companies Act 2013)', 'Monthly GST Advisory & GSTR-1/3B/9C'],
    engagementType: 'Monthly Retainer',
    agreedFee: 35000,
    feeBillingFrequency: 'Monthly Retainer',
    accountingSoftware: 'Zoho Books',
    notes: ''
  });

  const [panValidationState, setPanValidationState] = useState<{
    isValid: boolean;
    entityCategory?: string;
    error?: string;
  }>({ isValid: false });

  // Sync with Firestore if user is authenticated
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'clients'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        setClients(data);
        localStorage.setItem('caoms_corporate_clients', JSON.stringify(data));
      }
    }, (error) => {
      console.warn('Firestore clients query notice (offline or rules fallback):', error);
    });
    return () => unsubscribe();
  }, []);

  // Save to localStorage whenever clients changes
  const updateClientsState = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem('caoms_corporate_clients', JSON.stringify(newClients));
  };

  // Real-time PAN validation
  const handlePanChange = (panVal: string) => {
    const upper = panVal.toUpperCase().trim();
    setFormData(prev => ({ ...prev, pan: upper }));
    if (upper.length === 10) {
      const res = validatePan(upper);
      setPanValidationState({
        isValid: res.isValid,
        entityCategory: res.entityType,
        error: res.error
      });
    } else {
      setPanValidationState({ isValid: false });
    }
  };

  // Reset form to defaults
  const resetForm = () => {
    setFormData({
      name: '',
      entityType: 'Private Limited Company (Pvt Ltd)',
      industry: 'IT & Software / SaaS',
      pan: '',
      gstin: '',
      tan: '',
      cin: '',
      udyamNo: '',
      contactPerson: '',
      designation: 'Managing Director',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: 'Karnataka',
      pincode: '',
      status: 'Active',
      partner: 'CA Aarav Patel (Managing Partner)',
      articleAssigned: 'T. Varsha (Article Staff)',
      engagementScope: ['Statutory Audit (Companies Act 2013)', 'Monthly GST Advisory & GSTR-1/3B/9C'],
      engagementType: 'Monthly Retainer',
      agreedFee: 35000,
      feeBillingFrequency: 'Monthly Retainer',
      accountingSoftware: 'Zoho Books',
      notes: ''
    });
    setFormErrors({});
    setActiveFormTab('entity');
    setPanValidationState({ isValid: false });
  };

  const handleToggleScope = (service: string) => {
    setFormData(prev => {
      const exists = prev.engagementScope.includes(service);
      return {
        ...prev,
        engagementScope: exists
          ? prev.engagementScope.filter(s => s !== service)
          : [...prev.engagementScope, service]
      };
    });
  };

  // Submit Handler with Comprehensive Validation & SQL Injection Defense
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateCompleteClientForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      // Auto-navigate to tab containing the earliest error
      const errorFields = Object.keys(validation.errors);
      if (errorFields.some(k => ['name', 'entityType', 'industry'].includes(k))) {
        setActiveFormTab('entity');
      } else if (errorFields.some(k => ['pan', 'gstin', 'tan', 'cin', 'udyamNo'].includes(k))) {
        setActiveFormTab('statutory');
      } else if (errorFields.some(k => ['contactPerson', 'designation', 'email', 'phone', 'address', 'city', 'state', 'pincode'].includes(k))) {
        setActiveFormTab('contact');
      } else {
        setActiveFormTab('engagement');
      }
      return;
    }

    setFormErrors({});

    const newClientPayload: Client = {
      id: `client-${Date.now()}`,
      name: validation.sanitized.name,
      entityType: formData.entityType,
      industry: formData.industry,
      pan: validation.sanitized.pan,
      gstin: validation.sanitized.gstin || '',
      tan: validation.sanitized.tan || '',
      cin: validation.sanitized.cin || '',
      udyamNo: validation.sanitized.udyamNo || '',
      contactPerson: validation.sanitized.contactPerson,
      designation: validation.sanitized.designation,
      email: validation.sanitized.email,
      phone: validation.sanitized.phone,
      address: validation.sanitized.address,
      city: validation.sanitized.city,
      state: formData.state,
      pincode: validation.sanitized.pincode,
      status: formData.status,
      partner: formData.partner,
      articleAssigned: formData.articleAssigned,
      engagementScope: formData.engagementScope,
      engagementType: formData.engagementType,
      agreedFee: validation.sanitized.agreedFee,
      feeBillingFrequency: formData.feeBillingFrequency,
      accountingSoftware: formData.accountingSoftware,
      notes: validation.sanitized.notes || '',
      mfaEnabled: true,
      ownerId: auth.currentUser?.uid || 'local-user',
    };

    // 1. Always update local state immediately for instant responsive UI
    const updated = [newClientPayload, ...clients];
    updateClientsState(updated);

    // 2. Persist to Firestore if online & logged in
    if (auth.currentUser) {
      try {
        const docRef = await addDoc(collection(db, 'clients'), {
          ...newClientPayload,
          ownerId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        newClientPayload.id = docRef.id;
      } catch (error) {
        console.warn('Firestore write warning, saved locally in session:', error);
      }
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Tab Error Aggregator for real-time form feedback
  const tabErrorCounts = useMemo(() => {
    const entity = ['name', 'entityType', 'industry'].filter(k => !!formErrors[k]).length;
    const statutory = ['pan', 'gstin', 'tan', 'cin', 'udyamNo'].filter(k => !!formErrors[k]).length;
    const contact = ['contactPerson', 'designation', 'email', 'phone', 'address', 'city', 'state', 'pincode'].filter(k => !!formErrors[k]).length;
    const engagement = ['agreedFee', 'notes'].filter(k => !!formErrors[k]).length;
    return { entity, statutory, contact, engagement, total: Object.keys(formErrors).length };
  }, [formErrors]);

  const handleSearchChange = (val: string) => {
    const sec = detectSqlInjection(val);
    if (sec.isMalicious) {
      setSearchError(`Prohibited SQL injection pattern "${sec.patternName}" blocked.`);
      return;
    }
    setSearchError(null);
    setSearchQuery(val);
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${clientName}" from the client directory?`)) {
      return;
    }

    const updated = clients.filter(c => c.id !== clientId);
    updateClientsState(updated);

    if (selectedClientForView?.id === clientId) {
      setSelectedClientForView(null);
    }

    if (auth.currentUser && !clientId.startsWith('client-')) {
      try {
        await deleteDoc(doc(db, 'clients', clientId));
      } catch (err) {
        console.error('Firestore delete notice:', err);
      }
    }
  };

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        c.name.toLowerCase().includes(query) ||
        (c.pan && c.pan.toLowerCase().includes(query)) ||
        (c.gstin && c.gstin.toLowerCase().includes(query)) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(query)) ||
        (c.city && c.city.toLowerCase().includes(query));

      const matchesEntity = selectedEntityType === 'ALL' || c.entityType === selectedEntityType;
      const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
      const matchesPartner = selectedPartner === 'ALL' || c.partner?.includes(selectedPartner);

      return matchesSearch && matchesEntity && matchesStatus && matchesPartner;
    });
  }, [clients, searchQuery, selectedEntityType, selectedStatus, selectedPartner]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'Active').length;
    const corporate = clients.filter(c => 
      c.entityType?.includes('Pvt Ltd') || 
      c.entityType?.includes('Ltd') || 
      c.entityType?.includes('LLP')
    ).length;
    const totalMonthlyFees = clients.reduce((acc, c) => {
      if (c.feeBillingFrequency === 'Monthly Retainer' && c.agreedFee) {
        return acc + c.agreedFee;
      }
      return acc;
    }, 0);

    return { total, active, corporate, totalMonthlyFees };
  }, [clients]);

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header Bar */}
      <div className="p-4 sm:p-6 lg:p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between max-w-[1600px] mx-auto gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              <span>Practice Master</span>
              <span>/</span>
              <span>Statutory KYC</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
              <span>Corporate Clients Master Directory</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Maintain statutory KYC, PAN & GSTIN validations, MCA CIN records, engagement scopes, and partner assignments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCustomFieldsModalOpen(true)}
              className="w-full sm:w-auto justify-center flex items-center gap-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-2xs cursor-pointer"
              title="Configure practice custom fields for clients"
            >
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Custom Fields</span>
            </button>

            <button 
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }} 
              className="w-full sm:w-auto justify-center flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Client
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6 max-w-[1600px] mx-auto">
          <div className="p-3.5 sm:p-4 bg-zinc-50 rounded-xl border border-zinc-200/80">
            <div className="text-[11px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Onboarded Clients</div>
            <div className="text-xl sm:text-2xl font-bold text-zinc-900 mt-1">{metrics.total}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">Under CA firm oversight</div>
          </div>
          <div className="p-3.5 sm:p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
            <div className="text-[11px] sm:text-xs font-semibold text-emerald-700 uppercase tracking-wider">Active Compliances</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-900 mt-1">{metrics.active}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Regular monthly / annual filings</div>
          </div>
          <div className="p-3.5 sm:p-4 bg-blue-50/50 rounded-xl border border-blue-200/60">
            <div className="text-[11px] sm:text-xs font-semibold text-blue-700 uppercase tracking-wider">Corporate & LLPs</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-900 mt-1">{metrics.corporate}</div>
            <div className="text-[11px] text-blue-600 mt-0.5">Companies Act / MCA Scope</div>
          </div>
          <div className="p-3.5 sm:p-4 bg-amber-50/50 rounded-xl border border-amber-200/60">
            <div className="text-[11px] sm:text-xs font-semibold text-amber-700 uppercase tracking-wider">Monthly Retainer Base</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-900 mt-1">₹{metrics.totalMonthlyFees.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-amber-600 mt-0.5">Recurring monthly run-rate</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white border-b border-zinc-200 shrink-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 max-w-[1600px] mx-auto">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by client name, PAN, GSTIN, city, contact..." 
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm transition-all ${
                searchError 
                  ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600' 
                  : 'border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
              }`}
            />
            {searchError && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {searchError}
              </p>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Entity Types</option>
              {ENTITY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Onboarding">Onboarding / KYC</option>
              <option value="Review">Under Review</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
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
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
        {filteredClients.length === 0 ? (
          <div className="text-center py-16 bg-white border border-zinc-200 rounded-2xl p-8 shadow-xs">
            <Building2 className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <div className="text-base font-bold text-zinc-900">No clients match your filter criteria</div>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search query or clear the active entity filters to see registered clients.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedEntityType('ALL');
                setSelectedStatus('ALL');
                setSelectedPartner('ALL');
              }}
              className="mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredClients.map(client => (
              <div 
                key={client.id}
                className="bg-white border border-zinc-200 rounded-2xl p-5 hover:border-indigo-300 transition-all shadow-xs hover:shadow group flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Entity Type and Status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                      {client.entityType || 'Corporate Client'}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                      client.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : client.status === 'Onboarding'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}>
                      {client.status}
                    </span>
                  </div>

                  {/* Company Name */}
                  <div className="mt-3">
                    <h3 className="font-bold text-zinc-900 text-base group-hover:text-indigo-600 transition-colors">
                      {client.name}
                    </h3>
                    <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{client.industry || 'General Corporate'}</span>
                      {client.city && <span>• {client.city}, {client.state}</span>}
                    </div>
                  </div>

                  {/* Statutory Badges */}
                  <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">PAN:</span>
                      <span className="font-mono font-semibold text-zinc-900">{client.pan || '—'}</span>
                    </div>
                    {client.gstin && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 font-medium">GSTIN:</span>
                        <span className="font-mono text-zinc-800 text-[11px]">{client.gstin}</span>
                      </div>
                    )}
                    {client.cin && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 font-medium">CIN:</span>
                        <span className="font-mono text-zinc-700 text-[11px]">{client.cin}</span>
                      </div>
                    )}
                    {client.tan && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 font-medium">TAN:</span>
                        <span className="font-mono text-zinc-700 text-[11px]">{client.tan}</span>
                      </div>
                    )}
                  </div>

                  {/* Primary Contact Person */}
                  {client.contactPerson && (
                    <div className="mt-3 text-xs text-zinc-600 flex items-center justify-between">
                      <span className="text-zinc-400">Key Contact:</span>
                      <span className="font-medium text-zinc-800">{client.contactPerson} ({client.designation || 'Director'})</span>
                    </div>
                  )}

                  {/* Engagement Partner */}
                  {client.partner && (
                    <div className="mt-1.5 text-xs text-zinc-600 flex items-center justify-between">
                      <span className="text-zinc-400">Engagement Lead:</span>
                      <span className="text-indigo-700 font-medium text-[11px]">{client.partner.split('(')[0]}</span>
                    </div>
                  )}

                  {/* Scope Badges */}
                  {client.engagementScope && client.engagementScope.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {client.engagementScope.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200">
                          {s.split('(')[0].trim()}
                        </span>
                      ))}
                      {client.engagementScope.length > 3 && (
                        <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                          +{client.engagementScope.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <div className="text-xs">
                    {client.agreedFee ? (
                      <span className="font-bold text-zinc-900">
                        ₹{client.agreedFee.toLocaleString('en-IN')}
                        <span className="font-normal text-zinc-400 text-[10px]"> / {client.feeBillingFrequency === 'Monthly Retainer' ? 'mo' : 'yr'}</span>
                      </span>
                    ) : (
                      <span className="text-zinc-400">Standard Scope</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setClientForEmail(client)}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      title="Send Onboarding Package via Gmail / Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email Package
                    </button>
                    <button
                      onClick={() => setSelectedClientForView(client)}
                      className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id, client.name)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Client"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">Entity & Legal Name</th>
                    <th className="p-4">PAN / GSTIN</th>
                    <th className="p-4">Entity Constitution</th>
                    <th className="p-4">Key Contact Person</th>
                    <th className="p-4">Assigned Partner</th>
                    <th className="p-4">Agreed Retainer</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-zinc-900">{client.name}</div>
                        <div className="text-[11px] text-zinc-400">{client.city || 'India'} {client.industry ? `• ${client.industry}` : ''}</div>
                      </td>
                      <td className="p-4 font-mono">
                        <div className="font-semibold text-zinc-900">{client.pan || '—'}</div>
                        <div className="text-[10px] text-zinc-500">{client.gstin || 'No GSTIN'}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-[11px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200">
                          {client.entityType?.split('(')[0] || 'Company'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-zinc-800">{client.contactPerson || '—'}</div>
                        <div className="text-[10px] text-zinc-400">{client.email || client.phone || ''}</div>
                      </td>
                      <td className="p-4 text-zinc-700 text-[11px]">
                        {client.partner?.split('(')[0] || 'CA Aarav Patel'}
                      </td>
                      <td className="p-4 font-semibold text-zinc-900">
                        {client.agreedFee ? `₹${client.agreedFee.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          client.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setClientForEmail(client)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Send Onboarding Package via Gmail / Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedClientForView(client)}
                            className="p-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                            title="View KYC Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id, client.name)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove Client"
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
      {/* 360° CLIENT PROFILE VIEW MODAL / DRAWER                  */}
      {/* ======================================================== */}
      {selectedClientForView && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/70 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    {selectedClientForView.entityType}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {selectedClientForView.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mt-1">{selectedClientForView.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedClientForView(null)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Statutory Registrations Box */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Statutory Tax & MCA Registrations</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Permanent Account No.</span>
                    <div className="font-mono font-bold text-zinc-900 mt-0.5 text-sm">{selectedClientForView.pan || '—'}</div>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">GSTIN</span>
                    <div className="font-mono font-bold text-zinc-900 mt-0.5 text-xs truncate" title={selectedClientForView.gstin}>{selectedClientForView.gstin || '—'}</div>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">TAN (TDS)</span>
                    <div className="font-mono font-bold text-zinc-900 mt-0.5 text-sm">{selectedClientForView.tan || '—'}</div>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">CIN / LLPIN</span>
                    <div className="font-mono font-bold text-zinc-900 mt-0.5 text-xs truncate" title={selectedClientForView.cin}>{selectedClientForView.cin || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Point of Contact & Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-zinc-200 rounded-2xl space-y-2.5">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Primary KYC Contact</h4>
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>{selectedClientForView.contactPerson || 'Not Specified'}</span>
                    <span className="text-xs font-normal text-zinc-500">({selectedClientForView.designation})</span>
                  </div>
                  {selectedClientForView.email && (
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <Mail className="w-4 h-4 text-zinc-400" />
                      <a href={`mailto:${selectedClientForView.email}`} className="text-indigo-600 hover:underline">{selectedClientForView.email}</a>
                    </div>
                  )}
                  {selectedClientForView.phone && (
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <Phone className="w-4 h-4 text-zinc-400" />
                      <span>{selectedClientForView.phone}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 border border-zinc-200 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Registered Address</h4>
                  <div className="flex items-start gap-2 text-xs text-zinc-700">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <div>{selectedClientForView.address || 'Address not logged'}</div>
                      <div className="font-semibold mt-1">
                        {selectedClientForView.city && `${selectedClientForView.city}, `}
                        {selectedClientForView.state} {selectedClientForView.pincode && `- ${selectedClientForView.pincode}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement & Practice Scope */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Practice Governance & Scope</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500">Engagement Partner:</span>
                    <div className="font-semibold text-zinc-900 mt-0.5">{selectedClientForView.partner || 'CA Aarav Patel'}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Article Assistant:</span>
                    <div className="font-semibold text-zinc-900 mt-0.5">{selectedClientForView.articleAssigned || 'T. Varsha'}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Agreed Professional Fee:</span>
                    <div className="font-bold text-zinc-900 mt-0.5">
                      ₹{selectedClientForView.agreedFee?.toLocaleString('en-IN') || '0'} ({selectedClientForView.feeBillingFrequency})
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Accounting Software:</span>
                    <div className="font-semibold text-zinc-900 mt-0.5">{selectedClientForView.accountingSoftware || 'Tally Prime'}</div>
                  </div>
                  <div>
                    <span className="text-zinc-500">Engagement Type:</span>
                    <div className="font-semibold text-zinc-900 mt-0.5">{selectedClientForView.engagementType || 'Retainer'}</div>
                  </div>
                </div>

                {/* Scope items */}
                {selectedClientForView.engagementScope && selectedClientForView.engagementScope.length > 0 && (
                  <div className="pt-2 border-t border-zinc-200/60">
                    <span className="text-[11px] font-semibold text-zinc-500">Subscribed Statutory Services:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedClientForView.engagementScope.map((s, idx) => (
                        <span key={idx} className="text-xs bg-white text-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 font-medium">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedClientForView.notes && (
                  <div className="pt-2 border-t border-zinc-200/60 text-xs">
                    <span className="font-semibold text-zinc-600">Audit & Filing Special Notes:</span>
                    <p className="text-zinc-600 italic mt-0.5">{selectedClientForView.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
              <button
                onClick={() => setClientForEmail(selectedClientForView)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Onboarding Package (Gmail / Email)</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">SOC2 Encrypted Client Record</span>
                <button
                  onClick={() => setSelectedClientForView(null)}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* COMPREHENSIVE ADD NEW CLIENT MODAL                       */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70 shrink-0">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Add New Corporate / Statutory Client</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Register legal entity with PAN, GSTIN, and compliance scope.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step / Section Navigation Tabs */}
            <div className="px-6 py-2 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveFormTab('entity')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeFormTab === 'entity'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60'
                }`}
              >
                <span>1. Entity Details</span>
                {tabErrorCounts.entity > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {tabErrorCounts.entity}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('statutory')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeFormTab === 'statutory'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60'
                }`}
              >
                <span>2. Statutory Identifiers (PAN/GST)</span>
                {tabErrorCounts.statutory > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {tabErrorCounts.statutory}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('contact')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeFormTab === 'contact'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60'
                }`}
              >
                <span>3. Primary KYC & Address</span>
                {tabErrorCounts.contact > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {tabErrorCounts.contact}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('engagement')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeFormTab === 'engagement'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-200/60'
                }`}
              >
                <span>4. Practice Scope & Fees</span>
                {tabErrorCounts.engagement > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {tabErrorCounts.engagement}
                  </span>
                )}
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Validation & Security Overview Banner */}
              {tabErrorCounts.total > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Data Validation & Security: </span>
                    {tabErrorCounts.total} field requirement(s) or prohibited patterns detected. Review highlighted tabs and fields before registering client.
                  </div>
                </div>
              )}

              {/* TAB 1: ENTITY DETAILS */}
              {activeFormTab === 'entity' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Client Legal Entity Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={formData.name} 
                      onChange={e => {
                        setFormData(p => ({ ...p, name: e.target.value }));
                        if (formErrors.name) setFormErrors(p => ({ ...p, name: '' }));
                      }} 
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm transition-all ${
                        formErrors.name 
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600' 
                          : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
                      }`}
                      placeholder="e.g. Apex Global Technologies Pvt Ltd" 
                    />
                    {formErrors.name ? (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> {formErrors.name}
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-400 mt-1">As registered with Registrar of Companies (ROC) or Income Tax</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Entity Constitution / Type</label>
                      <select
                        value={formData.entityType}
                        onChange={e => setFormData(p => ({ ...p, entityType: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {ENTITY_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

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
                  </div>

                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-900">
                      <span className="font-bold">ICAI Practice Code Compliance:</span> Registering an entity enables automated statutory calendar generation for MCA ROC, Income Tax 44AB audits, and GST monthly cycles.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STATUTORY IDENTIFIERS */}
              {activeFormTab === 'statutory' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-zinc-700">
                        Permanent Account Number (PAN) <span className="text-rose-500">*</span>
                      </label>
                      {panValidationState.isValid && (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Valid: {panValidationState.entityCategory}
                        </span>
                      )}
                    </div>
                    <input 
                      required 
                      type="text" 
                      value={formData.pan} 
                      onChange={e => {
                        handlePanChange(e.target.value);
                        if (formErrors.pan) setFormErrors(p => ({ ...p, pan: '' }));
                      }} 
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono uppercase transition-all ${
                        formErrors.pan 
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600' 
                          : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
                      }`}
                      placeholder="e.g. ABCDE1234F" 
                      maxLength={10} 
                    />
                    {formErrors.pan ? (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> {formErrors.pan}
                      </p>
                    ) : formData.pan && !panValidationState.isValid && formData.pan.length === 10 ? (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {panValidationState.error || 'Invalid statutory PAN format'}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">GSTIN (15 Digits)</label>
                      <input 
                        type="text" 
                        value={formData.gstin} 
                        onChange={e => {
                          setFormData(p => ({ ...p, gstin: e.target.value.toUpperCase() }));
                          if (formErrors.gstin) setFormErrors(p => ({ ...p, gstin: '' }));
                        }} 
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-mono uppercase transition-all ${
                          formErrors.gstin 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20' 
                            : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                        placeholder="e.g. 29ABCDE1234F1Z5" 
                        maxLength={15} 
                      />
                      {formErrors.gstin && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {formErrors.gstin}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">TAN (Tax Deduction Account No)</label>
                      <input 
                        type="text" 
                        value={formData.tan} 
                        onChange={e => {
                          setFormData(p => ({ ...p, tan: e.target.value.toUpperCase() }));
                          if (formErrors.tan) setFormErrors(p => ({ ...p, tan: '' }));
                        }} 
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-mono uppercase transition-all ${
                          formErrors.tan 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20' 
                            : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                        placeholder="e.g. BLRA12345B" 
                        maxLength={10} 
                      />
                      {formErrors.tan && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {formErrors.tan}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">CIN / LLPIN (MCA Registration)</label>
                      <input 
                        type="text" 
                        value={formData.cin} 
                        onChange={e => {
                          setFormData(p => ({ ...p, cin: e.target.value.toUpperCase() }));
                          if (formErrors.cin) setFormErrors(p => ({ ...p, cin: '' }));
                        }} 
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-mono uppercase transition-all ${
                          formErrors.cin 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20' 
                            : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                        placeholder="e.g. U72200KA2021PTC145678" 
                        maxLength={21} 
                      />
                      {formErrors.cin && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {formErrors.cin}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">MSME / Udyam Registration No</label>
                      <input 
                        type="text" 
                        value={formData.udyamNo} 
                        onChange={e => {
                          setFormData(p => ({ ...p, udyamNo: e.target.value.toUpperCase() }));
                          if (formErrors.udyamNo) setFormErrors(p => ({ ...p, udyamNo: '' }));
                        }} 
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-mono uppercase transition-all ${
                          formErrors.udyamNo 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20' 
                            : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                        placeholder="e.g. UDYAM-KR-03-0012345" 
                      />
                      {formErrors.udyamNo && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {formErrors.udyamNo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CONTACT & REGISTERED ADDRESS */}
              {activeFormTab === 'contact' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Primary KYC Contact Name</label>
                      <input 
                        type="text" 
                        value={formData.contactPerson} 
                        onChange={e => {
                          setFormData(p => ({ ...p, contactPerson: e.target.value }));
                          if (formErrors.contactPerson) setFormErrors(p => ({ ...p, contactPerson: '' }));
                        }} 
                        className={`w-full px-3 py-2 border rounded-xl text-xs transition-all ${
                          formErrors.contactPerson 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20' 
                            : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                        placeholder="e.g. Ramesh Kumar" 
                      />
                      {formErrors.contactPerson && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {formErrors.contactPerson}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Designation</label>
                      <input 
                        type="text" 
                        value={formData.designation} 
                        onChange={e => {
                          setFormData(p => ({ ...p, designation: e.target.value }));
                          if (formErrors.designation) setFormErrors(p => ({ ...p, designation: '' }));
                        }} 
                        className={`w-full px-3 py-2 border rounded-xl text-xs transition-all ${
                          formErrors.designation 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20' 
                            : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                        placeholder="Managing Director / CFO / Partner" 
                      />
                      {formErrors.designation && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {formErrors.designation}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Official Email for Notices & Returns</label>
                      <input 
                        type="email" 
                        value={formData.email} 
                        onChange={e => {
                          setFormData(p => ({ ...p, email: e.target.value }));
                          if (formErrors.email) setFormErrors(p => ({ ...p, email: '' }));
                        }} 
                        className={`w-full px-3 py-2 border rounded-xl text-xs transition-all ${
                          formErrors.email 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20' 
                            : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                        placeholder="ramesh@company.in" 
                      />
                      {formErrors.email && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Phone / WhatsApp Number</label>
                      <input 
                        type="tel" 
                        value={formData.phone} 
                        onChange={e => {
                          setFormData(p => ({ ...p, phone: e.target.value }));
                          if (formErrors.phone) setFormErrors(p => ({ ...p, phone: '' }));
                        }} 
                        className={`w-full px-3 py-2 border rounded-xl text-xs transition-all ${
                          formErrors.phone 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20' 
                            : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                        placeholder="+91 98450 12345" 
                      />
                      {formErrors.phone && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {formErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Registered Premises Address</label>
                    <input 
                      type="text" 
                      value={formData.address} 
                      onChange={e => {
                        setFormData(p => ({ ...p, address: e.target.value }));
                        if (formErrors.address) setFormErrors(p => ({ ...p, address: '' }));
                      }} 
                      className={`w-full px-3 py-2 border rounded-xl text-xs transition-all ${
                        formErrors.address 
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20' 
                          : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20'
                      }`}
                      placeholder="Plot No, Industrial Area, Main Road" 
                    />
                    {formErrors.address && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> {formErrors.address}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">City / Town</label>
                      <input 
                        type="text" 
                        value={formData.city} 
                        onChange={e => {
                          setFormData(p => ({ ...p, city: e.target.value }));
                          if (formErrors.city) setFormErrors(p => ({ ...p, city: '' }));
                        }} 
                        className={`w-full px-3 py-2 border rounded-xl text-xs transition-all ${
                          formErrors.city 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20' 
                            : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                        placeholder="Bengaluru" 
                      />
                      {formErrors.city && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {formErrors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">State (GST Jurisdiction)</label>
                      <select
                        value={formData.state}
                        onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {INDIAN_STATES_WITH_GST_CODES.map(st => (
                          <option key={st.code} value={st.name}>{st.code} - {st.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">PIN Code</label>
                      <input 
                        type="text" 
                        value={formData.pincode} 
                        onChange={e => {
                          setFormData(p => ({ ...p, pincode: e.target.value }));
                          if (formErrors.pincode) setFormErrors(p => ({ ...p, pincode: '' }));
                        }} 
                        className={`w-full px-3 py-2 border rounded-xl text-xs transition-all ${
                          formErrors.pincode 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20' 
                            : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                        placeholder="560100" 
                        maxLength={6}
                      />
                      {formErrors.pincode && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {formErrors.pincode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PRACTICE ENGAGEMENT & SCOPE */}
              {activeFormTab === 'engagement' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Assigned Engagement Partner</label>
                      <select
                        value={formData.partner}
                        onChange={e => setFormData(p => ({ ...p, partner: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {CA_PARTNERS.map(cp => (
                          <option key={cp} value={cp}>{cp}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Client Status</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="Active">Active</option>
                        <option value="Onboarding">Onboarding / KYC Verification</option>
                        <option value="Review">Under Review</option>
                        <option value="Inactive">Inactive / Suspended</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Subscribed Statutory Services Scope
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {PRACTICE_SERVICES.map(srv => {
                        const checked = formData.engagementScope.includes(srv);
                        return (
                          <div
                            key={srv}
                            onClick={() => handleToggleScope(srv)}
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Commercial Model</label>
                      <select
                        value={formData.feeBillingFrequency}
                        onChange={e => setFormData(p => ({ ...p, feeBillingFrequency: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {BILLING_FREQUENCIES.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Agreed Professional Fee (₹)</label>
                      <input 
                        type="number" 
                        value={formData.agreedFee} 
                        onChange={e => {
                          setFormData(p => ({ ...p, agreedFee: Number(e.target.value) || 0 }));
                          if (formErrors.agreedFee) setFormErrors(p => ({ ...p, agreedFee: '' }));
                        }} 
                        className={`w-full px-3 py-2 border rounded-xl text-xs font-medium transition-all ${
                          formErrors.agreedFee 
                            ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20' 
                            : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20'
                        }`}
                        placeholder="35000" 
                      />
                      {formErrors.agreedFee && (
                        <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {formErrors.agreedFee}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Accounting Software</label>
                      <select
                        value={formData.accountingSoftware}
                        onChange={e => setFormData(p => ({ ...p, accountingSoftware: e.target.value }))}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="Zoho Books">Zoho Books</option>
                        <option value="Tally Prime">Tally Prime</option>
                        <option value="QuickBooks">QuickBooks</option>
                        <option value="SAP ERP">SAP ERP</option>
                        <option value="Busy">Busy</option>
                        <option value="Excel / Manual">Excel / Manual</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Filing Notes / Special Instructions</label>
                    <textarea 
                      rows={2} 
                      value={formData.notes} 
                      onChange={e => {
                        setFormData(p => ({ ...p, notes: e.target.value }));
                        if (formErrors.notes) setFormErrors(p => ({ ...p, notes: '' }));
                      }} 
                      className={`w-full px-3 py-2 border rounded-xl text-xs transition-all ${
                        formErrors.notes 
                          ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20' 
                          : 'border-zinc-200 focus:ring-2 focus:ring-indigo-500/20'
                      }`}
                      placeholder="e.g. Dual partner sign-off required prior to GSTR-3B submission; quarterly stock audit in March." 
                    />
                    {formErrors.notes && (
                      <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> {formErrors.notes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Form Navigation and Submission */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between shrink-0">
                <div>
                  {activeFormTab !== 'entity' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFormTab === 'engagement') setActiveFormTab('contact');
                        else if (activeFormTab === 'contact') setActiveFormTab('statutory');
                        else if (activeFormTab === 'statutory') setActiveFormTab('entity');
                      }}
                      className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-semibold hover:bg-zinc-50 transition-colors"
                    >
                      Back
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {activeFormTab !== 'engagement' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFormTab === 'entity') setActiveFormTab('statutory');
                        else if (activeFormTab === 'statutory') setActiveFormTab('contact');
                        else if (activeFormTab === 'contact') setActiveFormTab('engagement');
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
                      Register & Save Client
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Onboarding Email Modal for selected client */}
      {clientForEmail && (
        <OnboardingEmailModal
          isOpen={!!clientForEmail}
          onClose={() => setClientForEmail(null)}
          clientData={{
            clientName: clientForEmail.name,
            contactEmail: clientForEmail.email || '',
            contactPhone: clientForEmail.phone || '',
            panNumber: clientForEmail.pan || 'PAN_PENDING',
            gstin: clientForEmail.gstin || '',
            entityType: clientForEmail.entityType,
            annualRetainerFee: clientForEmail.agreedFee || 180000,
            servicesRequested: clientForEmail.engagementScope || [
              'Statutory Audit & Companies Act Compliance',
              'Monthly GST & Annual Return Filings',
              'Quarterly TDS Statements'
            ],
            letterRefNumber: `AA/ENG/2026/${Math.floor(1000 + Math.random() * 9000)}`
          }}
        />
      )}

      {/* Custom Field Configuration Modal */}
      <CustomFieldConfigModal
        isOpen={isCustomFieldsModalOpen}
        onClose={() => setIsCustomFieldsModalOpen(false)}
      />
    </div>
  );
}
