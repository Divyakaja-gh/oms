import React, { useState } from 'react';
import { Download, Filter, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Search, Check } from 'lucide-react';
import { ComplianceFiling } from '../../types';
import { downloadComplianceHealthPDF, exportComplianceHealthExcel } from '../../utils/printAndPdfUtils';

export function ComplianceHealthDashboardTab({ filings, clients }: { filings: ComplianceFiling[], clients: string[] }) {
  const [filterType, setFilterType] = useState('All');
  const [filterClient, setFilterClient] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const filtered = filings.filter(f => {
    if (filterType !== 'All' && !f.complianceCode.includes(filterType)) return false;
    if (filterClient !== 'All' && f.clientName !== filterClient) return false;
    if (filterStatus !== 'All' && f.health !== filterStatus) return false;
    return true;
  });

  const greenCount = filtered.filter(f => f.health === 'Green').length;
  const amberCount = filtered.filter(f => f.health === 'Amber').length;
  const redCount = filtered.filter(f => f.health === 'Red').length;

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
      <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            Compliance Health Dashboard
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Bird's-eye view of your entire client portfolio's compliance status.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {feedbackNotice && (
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-medium animate-fade-in flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {feedbackNotice}
            </span>
          )}
          <button
            onClick={() => {
              downloadComplianceHealthPDF({ greenCount, amberCount, redCount }, filtered);
              setFeedbackNotice(`Downloaded PDF report (${filtered.length} filings)`);
              setTimeout(() => setFeedbackNotice(null), 3500);
            }}
            className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer"
            title="Download complete compliance health report as PDF"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            Export PDF
          </button>
          <button
            onClick={() => {
              exportComplianceHealthExcel(filtered, { greenCount, amberCount, redCount });
              setFeedbackNotice(`Exported Excel workbook (${filtered.length} records)`);
              setTimeout(() => setFeedbackNotice(null), 3500);
            }}
            className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer"
            title="Export complete compliance schedule to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="p-6 border-b border-zinc-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Up To Date</div>
            <div className="text-2xl font-extrabold text-zinc-900">{greenCount}</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
        </div>
        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Due in 7 Days</div>
            <div className="text-2xl font-extrabold text-zinc-900">{amberCount}</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500 opacity-80" />
        </div>
        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">Overdue / Notices</div>
            <div className="text-2xl font-extrabold text-zinc-900">{redCount}</div>
          </div>
          <XCircle className="w-8 h-8 text-rose-500 opacity-80" />
        </div>
      </div>

      <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-bold text-zinc-600">Filters:</span>
        </div>
        
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 focus:ring-2 focus:ring-indigo-500/20">
          <option value="All">All Health Status</option>
          <option value="Green">Green (Up to date)</option>
          <option value="Amber">Amber (Due soon)</option>
          <option value="Red">Red (Overdue)</option>
        </select>

        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 focus:ring-2 focus:ring-indigo-500/20">
          <option value="All">All Clients</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 focus:ring-2 focus:ring-indigo-500/20">
          <option value="All">All Compliance Types</option>
          <option value="GSTR">GST Returns</option>
          <option value="ITR">Income Tax</option>
          <option value="TDS">TDS</option>
          <option value="ROC">ROC</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-white border-b border-zinc-200 text-zinc-500 font-bold uppercase sticky top-0">
            <tr>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Compliance Type</th>
              <th className="px-6 py-4">Period</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Status / Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 font-medium">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-zinc-400">No filings match the current filters.</td></tr>
            ) : (
              filtered.map(f => (
                <tr key={f.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4 text-zinc-900 font-bold">{f.clientName}</td>
                  <td className="px-6 py-4">
                    <div className="text-zinc-900 font-bold">{f.complianceCode}</div>
                    <div className="text-zinc-500 text-[11px]">{f.complianceTitle}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600">{f.period}</td>
                  <td className="px-6 py-4 text-zinc-600">{f.dueDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        f.health === 'Green' ? 'bg-emerald-500' :
                        f.health === 'Amber' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}></span>
                      <span className="font-bold text-zinc-700">{f.status}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
