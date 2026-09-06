import React, { useState } from 'react';
import { CalendarDays, Filter, CheckCircle2, AlertTriangle, Clock, Search, ChevronRight } from 'lucide-react';

interface CalendarMilestone {
  id: string;
  name: string;
  category: 'GST' | 'Direct Tax' | 'TDS' | 'ROC / MCA' | 'Labor';
  freq: string;
  guide: string;
  window: string;
  status: 'Pending Action' | 'Compiled' | 'Overdue Action' | 'Ready for Signoff';
  sColor: 'amber' | 'emerald' | 'rose' | 'blue';
  assignedClientCount: number;
}

const INITIAL_MILESTONES: CalendarMilestone[] = [
  { id: 'm1', name: 'GSTR-1 Monthly outbound invoices filing', category: 'GST', freq: 'Monthly', guide: '11th of following month', window: '2026-09-11', status: 'Pending Action', sColor: 'amber', assignedClientCount: 38 },
  { id: 'm2', name: 'GSTR-3B Monthly return filing & payment', category: 'GST', freq: 'Monthly', guide: '20th of following month', window: '2026-09-20', status: 'Pending Action', sColor: 'amber', assignedClientCount: 42 },
  { id: 'm3', name: 'Income Tax Return (ITR) Filing (Non-Audit Cases)', category: 'Direct Tax', freq: 'Annual', guide: '31st July', window: '2026-07-31', status: 'Compiled', sColor: 'emerald', assignedClientCount: 65 },
  { id: 'm4', name: 'Income Tax Return (ITR) Filing (Audit Cases - Sec 44AB)', category: 'Direct Tax', freq: 'Annual', guide: '31st October', window: '2026-10-31', status: 'Pending Action', sColor: 'amber', assignedClientCount: 18 },
  { id: 'm5', name: 'Quarterly TDS Return Filing (Form 26Q & 24Q - Q1)', category: 'TDS', freq: 'Quarterly', guide: '31st of month following quarter', window: '2026-07-31', status: 'Compiled', sColor: 'emerald', assignedClientCount: 29 },
  { id: 'm6', name: 'Advance Tax 1st Instalment payment (15%)', category: 'Direct Tax', freq: 'Quarterly', guide: '15th June', window: '2026-06-15', status: 'Overdue Action', sColor: 'rose', assignedClientCount: 4 },
  { id: 'm7', name: 'Advance Tax 2nd Instalment payment (45%)', category: 'Direct Tax', freq: 'Quarterly', guide: '15th September', window: '2026-09-15', status: 'Pending Action', sColor: 'amber', assignedClientCount: 22 },
  { id: 'm8', name: 'MCA Form AOC-4 Financial Statements Filing', category: 'ROC / MCA', freq: 'Annual', guide: '30 days from AGM (30th Oct)', window: '2026-10-30', status: 'Pending Action', sColor: 'amber', assignedClientCount: 14 },
  { id: 'm9', name: 'EPF ECR & ESIC Monthly Remittance', category: 'Labor', freq: 'Monthly', guide: '15th of following month', window: '2026-09-15', status: 'Pending Action', sColor: 'amber', assignedClientCount: 31 },
];

export function ComplianceCalendarTab() {
  const [milestones, setMilestones] = useState<CalendarMilestone[]>(INITIAL_MILESTONES);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filtered = milestones.filter(m => {
    if (filterCategory !== 'ALL' && m.category !== filterCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.guide.toLowerCase().includes(q) || m.window.includes(q);
    }
    return true;
  });

  const toggleStatus = (id: string) => {
    setMilestones(prev => prev.map(m => {
      if (m.id === id) {
        const nextStatus = m.status === 'Compiled' ? 'Pending Action' : 'Compiled';
        const nextColor = nextStatus === 'Compiled' ? 'emerald' : 'amber';
        return { ...m, status: nextStatus, sColor: nextColor };
      }
      return m;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-50/50">
          <div>
            <h3 className="text-xs font-bold text-zinc-800 tracking-widest uppercase">STATUTORY COMPLIANCE CALENDAR MILESTONES</h3>
            <span className="text-[10px] font-semibold text-indigo-600">Standard Schedule AY 2026-27 / FY 2025-26</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search milestones..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="text-xs bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Authorities</option>
              <option value="GST">GST</option>
              <option value="Direct Tax">Direct Tax</option>
              <option value="TDS">TDS</option>
              <option value="ROC / MCA">ROC / MCA</option>
              <option value="Labor">Labor</option>
            </select>
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-100 text-[10px] uppercase text-zinc-500 font-bold tracking-widest bg-zinc-50/30">
            <tr>
              <th className="px-6 py-3.5">Compliance Scheme</th>
              <th className="px-6 py-3.5">Category</th>
              <th className="px-6 py-3.5">Frequency</th>
              <th className="px-6 py-3.5">Statutory Due-Date Rule</th>
              <th className="px-6 py-3.5">Hard Window Deadline</th>
              <th className="px-6 py-3.5 text-right">Status & Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-3.5">
                  <span className="font-bold text-zinc-900 block">{item.name}</span>
                  <span className="text-[10px] text-zinc-400">{item.assignedClientCount} Active Firm Clients</span>
                </td>
                <td className="px-6 py-3.5">
                  <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-zinc-600 font-medium">{item.freq}</td>
                <td className="px-6 py-3.5 text-zinc-500 font-medium">{item.guide}</td>
                <td className="px-6 py-3.5 font-bold font-mono text-zinc-800">{item.window}</td>
                <td className="px-6 py-3.5 text-right">
                  <button
                    onClick={() => toggleStatus(item.id)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      item.sColor === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' :
                      item.sColor === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                      'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {item.status}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
