import React, { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Briefcase, 
  User, 
  Search, 
  FileText, 
  DollarSign, 
  X,
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { ClientVisit, Client } from '../../types';
import { INITIAL_CLIENT_VISITS } from '../../data/practiceAutomationData';

interface ClientVisitTrackerProps {
  clients?: Client[];
}

export function ClientVisitTracker({ clients = [] }: ClientVisitTrackerProps) {
  const [visits, setVisits] = useState<ClientVisit[]>(() => {
    const saved = localStorage.getItem('caoms_client_visits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_CLIENT_VISITS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Scheduled' | 'Completed'>('ALL');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [viewingVisit, setViewingVisit] = useState<ClientVisit | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New visit form state
  const [newVisit, setNewVisit] = useState<Partial<ClientVisit>>({
    clientName: '',
    visitorName: 'CA Aarav Sharma',
    visitorRole: 'Partner',
    visitDate: '2026-09-15',
    startTime: '11:00',
    purpose: 'Statutory Audit',
    location: '',
    contactPerson: '',
    minutesOfMeeting: '',
    actionItems: [''],
    expenseClaimed: 0,
    status: 'Scheduled'
  });

  const filteredVisits = visits.filter(v => {
    const matchesSearch = v.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSaveVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisit.clientName || !newVisit.location) return;

    const created: ClientVisit = {
      id: `vis-${Date.now()}`,
      clientId: `c-${Date.now()}`,
      clientName: newVisit.clientName!,
      visitorId: 'u-1',
      visitorName: newVisit.visitorName || 'CA Aarav Sharma',
      visitorRole: newVisit.visitorRole || 'Partner',
      visitDate: newVisit.visitDate || '2026-09-15',
      startTime: newVisit.startTime || '10:00',
      purpose: newVisit.purpose as any || 'Statutory Audit',
      location: newVisit.location!,
      contactPerson: newVisit.contactPerson || 'Management Team',
      minutesOfMeeting: newVisit.minutesOfMeeting || 'Scheduled hearing/audit meeting.',
      actionItems: (newVisit.actionItems || []).filter(item => item && item.trim().length > 0),
      expenseClaimed: Number(newVisit.expenseClaimed) || 0,
      status: 'Scheduled'
    };

    const updated = [created, ...visits];
    setVisits(updated);
    localStorage.setItem('caoms_client_visits', JSON.stringify(updated));
    setIsScheduleModalOpen(false);
    setToastMessage(`Visit scheduled for ${created.clientName} on ${created.visitDate}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleMarkCompleted = (id: string) => {
    const updated = visits.map(v => v.id === id ? { ...v, status: 'Completed' as const } : v);
    setVisits(updated);
    localStorage.setItem('caoms_client_visits', JSON.stringify(updated));
    setToastMessage('Visit marked as Completed.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900">
              Client Visit & Meeting Tracker
            </h2>
            <p className="text-xs text-zinc-500">
              Track physical hearings at Income Tax / GST offices, statutory stock audits, and board meetings
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Visit / Hearing</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Field Visits</div>
          <div className="text-xl font-bold text-zinc-900 mt-1">{visits.length}</div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Physical hearings & audits</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Completed</div>
          <div className="text-xl font-bold text-teal-700 mt-1">
            {visits.filter(v => v.status === 'Completed').length}
          </div>
          <div className="text-[11px] text-teal-600 mt-0.5">With documented MoMs</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Scheduled Ahead</div>
          <div className="text-xl font-bold text-blue-700 mt-1">
            {visits.filter(v => v.status === 'Scheduled').length}
          </div>
          <div className="text-[11px] text-blue-600 mt-0.5">Upcoming team commitments</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Travel Expenses</div>
          <div className="text-xl font-bold text-amber-700 mt-1">
            ₹{visits.reduce((sum, v) => sum + (v.expenseClaimed || 0), 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5">Claimable audit travel</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search visits by Client, Visitor, ITO Office, or Purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Visits Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVisits.map(visit => (
          <div
            key={visit.id}
            className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                    visit.purpose === 'Scrutiny Hearing' ? 'bg-red-100 text-red-800' :
                    visit.purpose === 'Statutory Audit' ? 'bg-indigo-100 text-indigo-800' :
                    visit.purpose === 'Stock Verification' ? 'bg-amber-100 text-amber-800' :
                    'bg-teal-100 text-teal-800'
                  }`}>
                    {visit.purpose}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900 mt-1.5">{visit.clientName}</h3>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  visit.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {visit.status}
                </span>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-4 text-xs text-zinc-600 mb-3">
                <div className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{visit.visitDate}</span>
                </div>
                <div className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{visit.startTime} {visit.endTime ? `- ${visit.endTime}` : ''}</span>
                </div>
                <div className="flex items-center gap-1 font-medium text-teal-700">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span>{visit.visitorName}</span>
                </div>
              </div>

              {/* Location Address */}
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 text-xs space-y-1 mb-3">
                <div className="flex items-start gap-1.5 text-zinc-700">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="font-medium">{visit.location}</span>
                </div>
                <div className="text-[11px] text-zinc-500 pl-5">
                  Contact: <strong className="text-zinc-700">{visit.contactPerson}</strong>
                </div>
              </div>

              {/* Minutes of Meeting Snippet */}
              <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed italic">
                "{visit.minutesOfMeeting}"
              </p>

              {/* Action items badge */}
              {visit.actionItems && visit.actionItems.length > 0 && (
                <div className="mt-3 text-[11px] text-zinc-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{visit.actionItems.length} Action Items pending post-visit</span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-600">
                Claim: ₹{visit.expenseClaimed || 0}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingVisit(visit)}
                  className="px-2.5 py-1 text-xs font-bold text-zinc-700 hover:text-teal-700 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View MoM &amp; Actions</span>
                </button>

                {visit.status === 'Scheduled' && (
                  <button
                    type="button"
                    onClick={() => handleMarkCompleted(visit.id)}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Minutes of Meeting Modal */}
      {viewingVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase font-mono">
                  {viewingVisit.purpose}
                </span>
                <h3 className="text-base font-bold text-zinc-900 mt-1">{viewingVisit.clientName}</h3>
              </div>
              <button
                onClick={() => setViewingVisit(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Date & Time</span>
                  <span className="font-semibold text-zinc-800">{viewingVisit.visitDate} at {viewingVisit.startTime}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Attendee</span>
                  <span className="font-semibold text-teal-700">{viewingVisit.visitorName} ({viewingVisit.visitorRole})</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Venue / Authority</span>
                  <span className="font-semibold text-zinc-800">{viewingVisit.location}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
                  Minutes of Meeting (MoM)
                </h4>
                <div className="text-xs text-zinc-700 bg-white p-3.5 rounded-xl border border-zinc-200 leading-relaxed whitespace-pre-line">
                  {viewingVisit.minutesOfMeeting}
                </div>
              </div>

              {viewingVisit.actionItems && viewingVisit.actionItems.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
                    Action Items & Deliverables
                  </h4>
                  <div className="space-y-1.5">
                    {viewingVisit.actionItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-zinc-800 bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-200 bg-zinc-50 text-right">
              <button
                onClick={() => setViewingVisit(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Visit Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-zinc-900">Schedule Client Visit / Tax Hearing</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVisit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Client Entity *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bharat Infrastructure Ltd"
                    value={newVisit.clientName}
                    onChange={e => setNewVisit({ ...newVisit, clientName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Purpose *</label>
                    <select
                      value={newVisit.purpose}
                      onChange={e => setNewVisit({ ...newVisit, purpose: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white"
                    >
                      <option value="Statutory Audit">Statutory Audit</option>
                      <option value="Scrutiny Hearing">Scrutiny Hearing (ITO / Faceless)</option>
                      <option value="GST Assessment">GST Assessment / Summons</option>
                      <option value="Stock Verification">Physical Stock Verification</option>
                      <option value="Client Review Meeting">Client Review Meeting</option>
                      <option value="Document Collection">Document Collection</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Attending Staff</label>
                    <input
                      type="text"
                      value={newVisit.visitorName}
                      onChange={e => setNewVisit({ ...newVisit, visitorName: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={newVisit.visitDate}
                      onChange={e => setNewVisit({ ...newVisit, visitDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={newVisit.startTime}
                      onChange={e => setNewVisit({ ...newVisit, startTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Venue / Office Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 304, CR Building, ITO, New Delhi"
                    value={newVisit.location}
                    onChange={e => setNewVisit({ ...newVisit, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Contact Officer / Person</label>
                  <input
                    type="text"
                    placeholder="e.g. ACIT Circle 7(1) or Managing Director"
                    value={newVisit.contactPerson}
                    onChange={e => setNewVisit({ ...newVisit, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Agenda / Meeting Brief</label>
                  <textarea
                    rows={3}
                    placeholder="Key items to discuss or paperbook submissions to present..."
                    value={newVisit.minutesOfMeeting}
                    onChange={e => setNewVisit({ ...newVisit, minutesOfMeeting: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Estimated Travel Expense (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={newVisit.expenseClaimed}
                    onChange={e => setNewVisit({ ...newVisit, expenseClaimed: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                >
                  Schedule Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
