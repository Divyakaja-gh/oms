import React from 'react';
import { Clock, Calendar, ArrowRight, ShieldAlert, Sparkles, Filter } from 'lucide-react';

export interface StatutoryDeadline {
  id: string;
  title: string;
  form: string;
  client?: string;
  dueDate: string;
  daysRemaining: number;
  urgency: 'high' | 'medium' | 'low';
}

interface StatutoryDeadlineTickerProps {
  deadlines?: StatutoryDeadline[];
  selectedFilter?: string | null;
  onSelectDeadline?: (deadline: StatutoryDeadline | null) => void;
  onQuickCreateTask?: (deadline: StatutoryDeadline) => void;
}

const DEFAULT_DEADLINES: StatutoryDeadline[] = [
  {
    id: 'gstr1-apex',
    title: 'GSTR-1 Outbound Invoices (Client Apex)',
    form: 'GSTR-1',
    client: 'Client Apex',
    dueDate: '2026-06-11',
    daysRemaining: 5,
    urgency: 'high'
  },
  {
    id: 'adv-tax-q1',
    title: 'Advance Tax 1st Installment (Quarterly)',
    form: 'Advance Tax',
    client: 'All Corporate Clients',
    dueDate: '2026-06-15',
    daysRemaining: 9,
    urgency: 'medium'
  },
  {
    id: 'gstr3b-monthly',
    title: 'GSTR-3B Monthly Return Filed',
    form: 'GSTR-3B',
    client: 'Monthly Filers Pool',
    dueDate: '2026-06-20',
    daysRemaining: 14,
    urgency: 'medium'
  }
];

export function StatutoryDeadlineTicker({
  deadlines = DEFAULT_DEADLINES,
  selectedFilter,
  onSelectDeadline,
  onQuickCreateTask
}: StatutoryDeadlineTickerProps) {
  return (
    <div 
      id="statutory-deadline-ticker"
      className="bg-[#FFF9F5] border border-[#FDE6D2] rounded-2xl p-4 sm:p-5 shadow-xs transition-all"
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-100/80 flex items-center justify-center text-rose-600 shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold tracking-wider text-[#991B1B] uppercase flex items-center gap-2">
              <span>STATUTORY DEADLINE TICKER</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Automated prompt monitoring for Indian CA tax schedules.
            </p>
          </div>
        </div>

        {selectedFilter && (
          <button
            onClick={() => onSelectDeadline && onSelectDeadline(null)}
            className="self-start sm:self-auto text-xs text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            Clear Filter: "{selectedFilter}"
          </button>
        )}
      </div>

      {/* Deadline Cards Grid / Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {deadlines.map((item) => {
          const isSelected = selectedFilter === item.title || selectedFilter === item.form;
          return (
            <div
              key={item.id}
              onClick={() => onSelectDeadline && onSelectDeadline(isSelected ? null : item)}
              className={`bg-white rounded-xl border p-3.5 sm:p-4 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10'
                  : 'border-zinc-200/90 hover:border-amber-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs sm:text-[13px] font-semibold text-zinc-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 tracking-tight whitespace-nowrap ${
                    item.daysRemaining <= 5
                      ? 'bg-rose-100 text-rose-800'
                      : item.daysRemaining <= 10
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-amber-100/80 text-amber-800'
                  }`}
                >
                  {item.daysRemaining} d remaining
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-sm sm:text-base tracking-tight">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{item.dueDate}</span>
                </div>
                {onQuickCreateTask && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickCreateTask(item);
                    }}
                    className="text-[11px] text-zinc-400 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors"
                    title="Generate team task from this deadline"
                  >
                    <span>Track</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
