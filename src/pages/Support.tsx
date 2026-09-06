import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LifeBuoy, 
  Plus, 
  X, 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  Paperclip, 
  ChevronRight, 
  Activity,
  AlertCircle,
  CheckCircle2,
  Send,
  FileText,
  Trash2,
  ShieldCheck,
  Zap,
  HelpCircle,
  ExternalLink,
  User as UserIcon,
  RefreshCw
} from 'lucide-react';
import { collection, addDoc, onSnapshot, serverTimestamp, query, where, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { User, SupportTicket, SupportTicketReply } from '../types';
import { validateSupportTicket } from '../utils/validators';

interface SupportProps {
  user?: User | null;
}

const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-104921',
    ticketNumber: 'TKT-104921',
    subject: 'Reconciliation Engine: Large GSTR-2B JSON Import Parsing Threshold',
    description: 'When processing purchase daybooks exceeding 25,000 invoice lines in the practice recon tool, the client-side parsing stalls at 94%. Need server-side batch chunking or memory streaming.',
    category: 'Platform Bug / Defect',
    priority: 'High',
    status: 'In Progress',
    requesterName: 'CA Hari Krishna',
    requesterEmail: 'partner@aaravadvisors.in',
    attachmentName: 'gstr2b_parse_trace.json',
    attachmentSize: '412 KB',
    ownerId: 'usr_partner',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    replies: [
      {
        id: 'rep-1',
        sender: 'SaaS Platform Engineering',
        role: 'DevOps Lead',
        message: 'Resolved in patch v2.4.1 by offloading JSON parsing to streaming web workers. Up to 75,000 rows now parse smoothly without UI freeze.',
        timestamp: new Date(Date.now() - 1 * 3600000).toISOString()
      }
    ]
  },
  {
    id: 'tkt-104885',
    ticketNumber: 'TKT-104885',
    subject: 'Role Permission: Request Access to Client Secrets Vault & Key Rotation',
    description: 'Requesting elevated permission in Aarav Advisors Practice OS to view client credentials vault and trigger automated OAuth secret rotations for assigned tax clients.',
    category: 'Access & Role Permissions',
    priority: 'Medium',
    status: 'Open',
    requesterName: 'T. Varsha (Article Staff)',
    requesterEmail: 'article@aaravadvisors.in',
    ownerId: 'usr_article',
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    replies: []
  },
  {
    id: 'tkt-104710',
    ticketNumber: 'TKT-104710',
    subject: 'SaaS Subscription: Add 5 Concurrent Staff User Seats to Annual Plan',
    description: 'Firm onboarding 5 new trainee article assistants for upcoming tax audit season. Need license allocation expanded from 20 to 25 seats with single sign-on enabled.',
    category: 'Billing & SaaS Subscription',
    priority: 'Low',
    status: 'Resolved',
    requesterName: 'CA Aarav Patel',
    requesterEmail: 'admin@aaravadvisors.in',
    ownerId: 'usr_admin',
    createdAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    replies: [
      {
        id: 'rep-2',
        sender: 'SaaS Account Operations',
        role: 'Billing Specialist',
        message: 'Provisioned 5 additional active seats under Annual Enterprise Plan. Seat invitations are now ready to be sent from User Settings.',
        timestamp: new Date(Date.now() - 20 * 3600000).toISOString()
      }
    ]
  }
];

export function Support({ user }: SupportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [submissionSuccessTicket, setSubmissionSuccessTicket] = useState<SupportTicket | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Reply state in detailed view
  const [replyMessage, setReplyMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'Platform Bug / Defect',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    requesterName: user?.name || 'Aarav Advisors Team Member',
    requesterEmail: user?.email || 'admin@aaravadvisors.in',
  });

  const [attachment, setAttachment] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tickets State with localStorage cache & seed defaults
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('caoms_support_tickets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached support tickets', e);
    }
    return INITIAL_SUPPORT_TICKETS;
  });

  // Save tickets helper
  const saveTickets = (newTickets: SupportTicket[]) => {
    setTickets(newTickets);
    try {
      localStorage.setItem('caoms_support_tickets', JSON.stringify(newTickets));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  };

  // Sync with user prop if it changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        requesterName: user.name || prev.requesterName,
        requesterEmail: user.email || prev.requesterEmail,
      }));
    }
  }, [user]);

  // Firestore Realtime Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) return;

      try {
        const q = query(
          collection(db, 'support_tickets'),
          where('ownerId', '==', firebaseUser.uid)
        );

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const firestoreData: SupportTicket[] = snapshot.docs.map(d => {
              const data = d.data();
              return {
                id: d.id,
                ticketNumber: data.ticketNumber || `TKT-${d.id.slice(0, 6).toUpperCase()}`,
                subject: data.subject || 'Support Ticket',
                description: data.description || '',
                category: data.category || 'General',
                priority: data.priority || 'Medium',
                status: data.status || 'Open',
                requesterName: data.requesterName,
                requesterEmail: data.requesterEmail,
                attachmentName: data.attachmentName,
                replies: data.replies || [],
                ownerId: data.ownerId,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
              };
            });

            // Merge with local tickets preserving any client additions
            setTickets(prev => {
              const map = new Map<string, SupportTicket>();
              // Put local ones first
              prev.forEach(t => map.set(t.id, t));
              // Overwrite or add from Firestore
              firestoreData.forEach(t => map.set(t.id, t));
              const merged = Array.from(map.values());
              try {
                localStorage.setItem('caoms_support_tickets', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        }, (error) => {
          console.warn('Firestore support tickets listener notice:', error);
        });

        return () => unsubscribeSnapshot();
      } catch (err) {
        console.warn('Firestore subscription notice:', err);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Form Field Change Handlers with real-time validation clearing
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachment(file);
      if (validationErrors.attachment) {
        setValidationErrors(prev => {
          const copy = { ...prev };
          delete copy.attachment;
          return copy;
        });
      }
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Run rigorous validation across all fields
    const validation = validateSupportTicket({
      subject: formData.subject,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      requesterEmail: formData.requesterEmail,
      attachment
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);

    try {
      const generatedNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      const newTicketId = `tkt-${Date.now()}`;
      const ownerId = auth.currentUser?.uid || user?.id || 'local-user';

      const newTicket: SupportTicket = {
        id: newTicketId,
        ticketNumber: generatedNumber,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        status: 'Open',
        requesterName: formData.requesterName.trim() || user?.name || 'Aarav Advisors Professional',
        requesterEmail: formData.requesterEmail.trim() || user?.email || 'admin@aaravadvisors.in',
        attachmentName: attachment ? attachment.name : undefined,
        attachmentSize: attachment ? `${(attachment.size / 1024).toFixed(0)} KB` : undefined,
        ownerId,
        createdAt: new Date().toISOString(),
        replies: [
          {
            id: `rep-${Date.now()}`,
            sender: 'IT Helpdesk Automation',
            role: 'System Bot',
            message: `Ticket received and registered under SLA Tier (${formData.priority}). Expected initial response within ${
              formData.priority === 'High' ? '2 hours' : formData.priority === 'Medium' ? '6 hours' : '24 hours'
            }. Assigned to Practice IT & DevOps support team.`,
            timestamp: new Date().toISOString()
          }
        ]
      };

      // 1. Save to local state and persistent storage immediately
      const updatedTickets = [newTicket, ...tickets];
      saveTickets(updatedTickets);

      // 2. Seamlessly sync with Firestore
      if (auth.currentUser) {
        try {
          const docRef = await addDoc(collection(db, 'support_tickets'), {
            ticketNumber: newTicket.ticketNumber,
            subject: newTicket.subject,
            description: newTicket.description,
            category: newTicket.category,
            priority: newTicket.priority,
            status: 'Open',
            requesterName: newTicket.requesterName,
            requesterEmail: newTicket.requesterEmail,
            attachmentName: newTicket.attachmentName || null,
            ownerId: auth.currentUser.uid,
            createdAt: serverTimestamp()
          });
          newTicket.id = docRef.id;
        } catch (firebaseErr) {
          console.warn('Firestore write warning, saved locally in session:', firebaseErr);
        }
      }

      // 3. Reset form and show success notification
      setIsModalOpen(false);
      setSubmissionSuccessTicket(newTicket);
      setFormData({
        subject: '',
        description: '',
        category: 'Platform Bug / Defect',
        priority: 'Medium',
        requesterName: user?.name || 'Aarav Advisors Team Member',
        requesterEmail: user?.email || 'admin@aaravadvisors.in',
      });
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Ticket submission error:', err);
      setValidationErrors({ form: 'An unexpected error occurred while saving the ticket. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a reply to selected ticket
  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    const newReply: SupportTicketReply = {
      id: `rep-${Date.now()}`,
      sender: user?.name || 'Firm Member',
      role: user?.role?.toUpperCase() || 'PRACTICE STAFF',
      message: replyMessage.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedTicket: SupportTicket = {
      ...selectedTicket,
      replies: [...(selectedTicket.replies || []), newReply]
    };

    setSelectedTicket(updatedTicket);
    const updatedList = tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t);
    saveTickets(updatedList);
    setReplyMessage('');

    // Attempt Firestore update
    if (auth.currentUser && !selectedTicket.id.startsWith('tkt-')) {
      try {
        await updateDoc(doc(db, 'support_tickets', selectedTicket.id), {
          replies: updatedTicket.replies
        });
      } catch (err) {
        console.warn('Firestore reply update notice:', err);
      }
    }
  };

  // Update ticket status
  const handleUpdateStatus = async (ticketId: string, newStatus: 'Open' | 'In Progress' | 'Resolved' | 'Closed') => {
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: newStatus };
      }
      return t;
    });
    saveTickets(updated);

    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
    }

    if (auth.currentUser && !ticketId.startsWith('tkt-')) {
      try {
        await updateDoc(doc(db, 'support_tickets', ticketId), {
          status: newStatus
        });
      } catch (err) {
        console.warn('Firestore status update notice:', err);
      }
    }
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (t.ticketNumber && t.ticketNumber.toLowerCase().includes(q)) ||
        t.subject.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q) ||
        (t.requesterName && t.requesterName.toLowerCase().includes(q));

      const matchesStatus = selectedStatusFilter === 'ALL' || t.status === selectedStatusFilter;
      const matchesPriority = selectedPriorityFilter === 'ALL' || t.priority === selectedPriorityFilter;
      const matchesCategory = selectedCategoryFilter === 'ALL' || t.category === selectedCategoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tickets, searchQuery, selectedStatusFilter, selectedPriorityFilter, selectedCategoryFilter]);

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'Medium': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Low': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default: return 'text-zinc-700 bg-zinc-50 border-zinc-200';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Open': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'In Progress': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Resolved': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Closed': return 'text-zinc-600 bg-zinc-100 border-zinc-200';
      default: return 'text-zinc-700 bg-zinc-50 border-zinc-200';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Top Banner Header */}
      <div className="p-6 md:p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between max-w-[1600px] mx-auto gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              <span>Aarav Advisors</span>
              <span>/</span>
              <span>SaaS Platform & Application Helpdesk</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <LifeBuoy className="w-6 h-6 text-indigo-600" />
              IT, Systems & Operations Support
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Dedicated helpdesk strictly resolving issues related to the Aarav Advisors Practice OS SaaS web application.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              id="new-support-ticket-btn"
              onClick={() => {
                setValidationErrors({});
                setIsModalOpen(true);
              }} 
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              New SaaS Platform Request
            </button>
          </div>
        </div>

        {/* SaaS Platform Scope Banner */}
        <div className="mt-6 max-w-[1600px] mx-auto p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-3.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">SaaS Application Scope Only</span>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Practice OS Helpdesk</span>
            </div>
            <p className="text-zinc-700 leading-relaxed">
              This support tab <strong>exclusively addresses and resolves issues within the Aarav Advisors SaaS web application</strong> (including software bugs, UI defects, user role permissions, calculation tools, data exports, integrations, and SaaS subscription billing).
            </p>
            <p className="text-zinc-500 text-[11px]">
              Note: External government statutory portals (MCA V3, Income Tax e-Filing, GSTN) or local office hardware (printers, physical USB DSC dongles) are not serviced here.
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 max-w-[1600px] mx-auto">
          <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Open Tickets</p>
              <h3 className="text-xl font-bold text-zinc-900">{tickets.filter(t => t.status === 'Open').length}</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">In Progress</p>
              <h3 className="text-xl font-bold text-zinc-900">{tickets.filter(t => t.status === 'In Progress').length}</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Resolved</p>
              <h3 className="text-xl font-bold text-zinc-900">{tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length}</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Average SLA Response</p>
              <h3 className="text-xl font-bold text-zinc-900">2.8 hrs</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 md:px-8 py-3.5 bg-white border-b border-zinc-200 shrink-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 max-w-[1600px] mx-auto">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              id="search-tickets-input"
              type="text" 
              placeholder="Search by ticket #, subject, requester..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg text-sm bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Platform Bug / Defect">Platform Bug / Defect</option>
              <option value="Access & Role Permissions">Access & Role Permissions</option>
              <option value="Data Sync & Export">Data Sync & Export</option>
              <option value="SaaS Integrations & Webhooks">SaaS Integrations & Webhooks</option>
              <option value="Billing & SaaS Subscription">Billing & SaaS Subscription</option>
              <option value="Feature Request / Enhancement">Feature Request / Enhancement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Support Tickets List */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full space-y-4">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h2 className="font-bold text-xs text-zinc-900 uppercase tracking-widest flex items-center gap-2">
              <span>Support Request History</span>
              <span className="bg-zinc-200/80 text-zinc-700 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                {filteredTickets.length}
              </span>
            </h2>
          </div>

          <div className="divide-y divide-zinc-100">
            {filteredTickets.length === 0 ? (
              <div className="text-center text-zinc-500 py-16 px-4">
                <LifeBuoy className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <p className="font-bold text-zinc-900">No support requests match your criteria</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  {searchQuery ? 'Try modifying your search keywords or clearing active filters.' : 'Click "New SaaS Platform Request" above to log an issue with our SaaS platform team.'}
                </p>
              </div>
            ) : (
              filteredTickets.map(t => (
                <div 
                  key={t.id} 
                  id={`ticket-card-${t.id}`}
                  onClick={() => setSelectedTicket(t)}
                  className="p-5 hover:bg-zinc-50/70 transition-colors flex items-start justify-between group cursor-pointer"
                >
                  <div className="space-y-2 flex-1 pr-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {t.ticketNumber || `#${t.id.slice(0, 8)}`}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wider ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wider ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                      <span className="text-xs font-medium text-zinc-400 flex items-center gap-1 ml-auto">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-zinc-900 text-base group-hover:text-indigo-600 transition-colors">
                        {t.subject}
                      </h4>
                      <p className="text-xs text-zinc-600 mt-1 line-clamp-2 leading-relaxed">
                        {t.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500 pt-1">
                      <span className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-700 text-[11px]">
                        {t.category}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                        <UserIcon className="w-3.5 h-3.5" />
                        {t.requesterName || 'Firm Professional'}
                      </span>
                      {t.attachmentName && (
                        <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                          {t.attachmentName}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {(t.replies || []).length} Updates
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-600 self-center shrink-0 transition-transform group-hover:translate-x-1" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* NEW SUPPORT TICKET MODAL WITH DATA VALIDATION            */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">New SaaS Platform Support Request</h3>
                  <p className="text-xs text-zinc-500">Report an application bug, request role permissions, or submit SaaS platform queries.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-4">
              {validationErrors.form && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationErrors.form}</span>
                </div>
              )}

              {/* Scope Guidance Pill */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Notice: This helpdesk only addresses Aarav Advisors SaaS application and platform issues.</span>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Request Category <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    id="ticket-category-select"
                    value={formData.category} 
                    onChange={e => handleInputChange('category', e.target.value)} 
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 ${
                      validationErrors.category ? 'border-rose-400 focus:ring-rose-200' : 'border-zinc-200 focus:ring-indigo-500/20'
                    }`}
                  >
                    <option value="Platform Bug / Defect">Platform Bug / Defect</option>
                    <option value="Access & Role Permissions">Access & Role Permissions</option>
                    <option value="Data Sync & Export">Data Sync & Export</option>
                    <option value="SaaS Integrations & Webhooks">SaaS Integrations & Webhooks</option>
                    <option value="Billing & SaaS Subscription">Billing & SaaS Subscription</option>
                    <option value="Feature Request / Enhancement">Feature Request / Enhancement</option>
                  </select>
                  {validationErrors.category && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Priority Level <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    id="ticket-priority-select"
                    value={formData.priority} 
                    onChange={e => handleInputChange('priority', e.target.value)} 
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="High">High - Critical audit or filing blocked</option>
                    <option value="Medium">Medium - Normal operational task</option>
                    <option value="Low">Low - General query or non-urgent</option>
                  </select>
                </div>
              </div>

              {/* SLA Notice */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Target SLA Response:
                </span>
                <span className="font-bold">
                  {formData.priority === 'High' ? '⚡ Within 2 Hours (Critical Priority)' : formData.priority === 'Medium' ? '⏱️ Within 6 Hours (Standard SLA)' : '🌱 Within 24 Hours'}
                </span>
              </div>

              {/* Requester Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Requester Name</label>
                  <input 
                    type="text" 
                    value={formData.requesterName} 
                    onChange={e => handleInputChange('requesterName', e.target.value)} 
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20" 
                    placeholder="Full Name" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Requester Email</label>
                  <input 
                    type="email" 
                    value={formData.requesterEmail} 
                    onChange={e => handleInputChange('requesterEmail', e.target.value)} 
                    className={`w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 ${
                      validationErrors.requesterEmail ? 'border-rose-400 focus:ring-rose-200' : 'border-zinc-200 focus:ring-indigo-500/20'
                    }`}
                    placeholder="name@aaravadvisors.in" 
                  />
                  {validationErrors.requesterEmail && (
                    <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.requesterEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-zinc-700">
                    Subject Summary <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] ${formData.subject.length > 200 ? 'text-rose-500 font-bold' : 'text-zinc-400'}`}>
                    {formData.subject.length}/200
                  </span>
                </div>
                <input 
                  id="ticket-subject-input"
                  type="text" 
                  value={formData.subject} 
                  onChange={e => handleInputChange('subject', e.target.value)} 
                  maxLength={200}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                    validationErrors.subject ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20' : 'border-zinc-200 focus:ring-indigo-500/20 focus:border-indigo-600'
                  }`} 
                  placeholder="e.g. Reconciliation engine timeout on large GSTR-2B JSON import" 
                />
                {validationErrors.subject && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.subject}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-zinc-700">
                    Detailed Description & Steps to Reproduce <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] ${formData.description.length > 4000 ? 'text-rose-500 font-bold' : 'text-zinc-400'}`}>
                    {formData.description.length}/4000
                  </span>
                </div>
                <textarea 
                  id="ticket-description-input"
                  rows={4} 
                  value={formData.description} 
                  onChange={e => handleInputChange('description', e.target.value)} 
                  maxLength={4000}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 ${
                    validationErrors.description ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20' : 'border-zinc-200 focus:ring-indigo-500/20 focus:border-indigo-600'
                  }`} 
                  placeholder="Describe the SaaS application issue, steps to reproduce, affected module, or specific role permissions required in Practice OS..."
                />
                {validationErrors.description && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.description}
                  </p>
                )}
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Attachment (Optional)</label>
                <div className="flex items-center gap-3">
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    id="support-attachment-input"
                    accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.zip,.csv,.txt"
                  />
                  <label 
                    htmlFor="support-attachment-input"
                    className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                    Browse Screenshot / File
                  </label>
                  <span className="text-[11px] text-zinc-400">PDF, PNG, JPG, XLSX, ZIP up to 10MB</span>
                </div>

                {attachment && (
                  <div className="mt-2 flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-medium text-zinc-800 truncate">{attachment.name}</span>
                      <span className="text-[11px] text-zinc-400 shrink-0">({(attachment.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={removeAttachment} 
                      className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 rounded transition-colors ml-2 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {validationErrors.attachment && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {validationErrors.attachment}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  id="submit-support-ticket-btn"
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TICKET SUBMISSION SUCCESS CONFIRMATION MODAL             */}
      {/* ======================================================== */}
      {submissionSuccessTicket && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 w-full max-w-md text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4 border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Support Ticket Registered!</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Your request has been successfully assigned to the SaaS Platform Engineering & Support team.
            </p>

            <div className="my-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Ticket Reference:</span>
                <span className="font-mono font-bold text-indigo-700">{submissionSuccessTicket.ticketNumber}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Subject:</span>
                <span className="font-medium text-zinc-900 truncate max-w-[200px]">{submissionSuccessTicket.subject}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Priority:</span>
                <span className="font-bold text-zinc-800">{submissionSuccessTicket.priority}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Target Resolution:</span>
                <span className="font-semibold text-emerald-700">
                  {submissionSuccessTicket.priority === 'High' ? 'Within 2 Hours' : submissionSuccessTicket.priority === 'Medium' ? 'Within 6 Hours' : 'Within 24 Hours'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setSubmissionSuccessTicket(null)}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors"
            >
              View Ticket in Board
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DETAILED TICKET VIEW SLIDE-OVER / MODAL                  */}
      {/* ======================================================== */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-2xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                  {selectedTicket.ticketNumber}
                </span>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">{selectedTicket.subject}</h3>
                <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                  <span>Category: <strong>{selectedTicket.category}</strong></span>
                  <span>Requester: <strong>{selectedTicket.requesterName}</strong></span>
                  <span>Logged: <strong>{new Date(selectedTicket.createdAt).toLocaleString('en-IN')}</strong></span>
                </div>
              </div>

              {/* Description Block */}
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/70 text-xs leading-relaxed text-zinc-800 whitespace-pre-wrap">
                {selectedTicket.description}
              </div>

              {/* Attachment if present */}
              {selectedTicket.attachmentName && (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-indigo-950 font-medium">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    <span>{selectedTicket.attachmentName}</span>
                    {selectedTicket.attachmentSize && (
                      <span className="text-zinc-400">({selectedTicket.attachmentSize})</span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    Attached Asset
                  </span>
                </div>
              )}

              {/* Status Update Quick Buttons */}
              <div className="pt-2 border-t border-zinc-100">
                <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-2">Change Status:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'Open')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${selectedTicket.status === 'Open' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-zinc-700 hover:bg-zinc-50'}`}
                  >
                    Open
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'In Progress')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${selectedTicket.status === 'In Progress' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-zinc-700 hover:bg-zinc-50'}`}
                  >
                    In Progress
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${selectedTicket.status === 'Resolved' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-zinc-700 hover:bg-zinc-50'}`}
                  >
                    Mark as Resolved
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'Closed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${selectedTicket.status === 'Closed' ? 'bg-zinc-800 text-white border-zinc-800' : 'bg-white text-zinc-700 hover:bg-zinc-50'}`}
                  >
                    Close Ticket
                  </button>
                </div>
              </div>

              {/* Activity / Replies Timeline */}
              <div className="pt-3 border-t border-zinc-100">
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3">
                  Resolution Log & Updates ({selectedTicket.replies?.length || 0})
                </h4>

                <div className="space-y-3 mb-4">
                  {(selectedTicket.replies || []).map(r => (
                    <div key={r.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-zinc-500">
                        <span className="font-bold text-zinc-800">{r.sender} <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-mono">{r.role}</span></span>
                        <span className="text-[10px]">{new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-zinc-700 leading-relaxed">{r.message}</p>
                    </div>
                  ))}
                </div>

                {/* Add Reply */}
                <form onSubmit={handleAddReply} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Add an update or note to this ticket..." 
                    value={replyMessage} 
                    onChange={e => setReplyMessage(e.target.value)}
                    className="flex-1 px-3 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button 
                    type="submit" 
                    disabled={!replyMessage.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    Post Note
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
