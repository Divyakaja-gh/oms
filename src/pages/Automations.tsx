import React, { useState } from 'react';
import { Workflow, Zap, BrainCircuit, Clock, CheckCircle2, Circle } from 'lucide-react';

export function Automations() {
  const [activeTab, setActiveTab] = useState<'rules' | 'agentic'>('rules');

  const ruleWorkflows = [
    { id: 'w1', name: 'W1: Invoice Lifecycle', trigger: 'invoice.created', action: 'Agentic Workflow → Email PDF + 30/60/90 Reminders', type: 'webhook', status: 'active' },
    { id: 'w2', name: 'W2: Compliance Monitor', trigger: 'Nightly Cron', action: 'Scan complianceFilings → Set Amber/Red → Slack', type: 'cron', status: 'active' },
    { id: 'w4', name: 'W4: Lead Conversion', trigger: 'lead.won', action: 'Create Client + Opening Task List + Dedupe', type: 'webhook', status: 'active' },
    { id: 'w5', name: 'W5: Client Onboarding', trigger: 'client.created', action: '7 Doc Folders → Welcome Email → Drive Link', type: 'webhook', status: 'inactive' },
    { id: 'w7', name: 'W7: Task Escalation', trigger: 'task.overdue', action: 'Notify Assignee → Manager → Partner SLA', type: 'webhook', status: 'active' },
    { id: 'w8', name: 'W8: Credential Access', trigger: 'credential.reveal', action: 'Real-time Slack / Webhook Alert', type: 'webhook', status: 'active' },
  ];

  const agenticWorkflows = [
    { id: 'a1', name: 'AI Client Intelligence Assistant', desc: 'Natural-language queries aggregating compliance, tasks, and invoices with exact citations.', status: 'active' },
    { id: 'a2', name: 'AI Task Automator', desc: 'Parses incoming emails and Slack messages into structured tasks with priority and due-date assignment.', status: 'active' },
    { id: 'a3', name: 'AI Compliance Coach', desc: 'Predicts filing slippage, suggests prep checklists, and flags missing documents.', status: 'inactive' },
    { id: 'a6', name: 'OCR Document Agent', desc: 'Extracts structured data from uploaded invoices/bank statements, runs reconciliation, and files under client.', status: 'active' },
    { id: 'a7', name: 'AI Support Triage', desc: 'Auto-categorizes tickets, routes them, and proposes resolutions from the Knowledge Base.', status: 'active' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      <div className="p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
              <Workflow className="w-6 h-6 text-indigo-600" />
              Automations & Workflow Engine
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Manage agentic workflow webhooks, background crons, and AI-driven agentic workflows.</p>
          </div>
          <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200">
            <button 
              onClick={() => setActiveTab('rules')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'rules' ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              Rules & Agentic Workflows
            </button>
            <button 
              onClick={() => setActiveTab('agentic')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'agentic' ? 'bg-white text-indigo-700 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              Agentic AI
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
        
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <span className="text-[10px] font-bold text-zinc-800 tracking-widest uppercase">CORE PLATFORM AUTOMATIONS</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  Agentic Workflow Engine Active
                </span>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-zinc-100 text-[10px] uppercase text-zinc-400 font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-4 w-12">Status</th>
                    <th className="px-6 py-4">Workflow Name</th>
                    <th className="px-6 py-4">Trigger / Event</th>
                    <th className="px-6 py-4">Execution Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {ruleWorkflows.map((flow) => (
                    <tr key={flow.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {flow.status === 'active' 
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : <Circle className="w-4 h-4 text-zinc-300" />
                        }
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900">{flow.name}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded border border-zinc-200 inline-flex">
                          {flow.type === 'cron' ? <Clock className="w-3.5 h-3.5 text-indigo-500" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                          {flow.trigger}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 text-xs font-medium">{flow.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'agentic' && (
          <div className="grid grid-cols-2 gap-6">
            {agenticWorkflows.map((agent) => (
              <div key={agent.id} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${agent.status === 'active' ? 'bg-indigo-50 border border-indigo-100' : 'bg-zinc-50 border border-zinc-200'}`}>
                      <BrainCircuit className={`w-5 h-5 ${agent.status === 'active' ? 'text-indigo-600' : 'text-zinc-400'}`} />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${agent.status === 'active' ? 'text-zinc-900' : 'text-zinc-500'}`}>{agent.name}</h3>
                      <span className={`text-[9px] font-bold tracking-widest uppercase ${agent.status === 'active' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                        {agent.status === 'active' ? '● Live Module' : '○ Pending Config'}
                      </span>
                    </div>
                  </div>
                  {/* Toggle Switch Stub */}
                  <div className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${agent.status === 'active' ? 'bg-indigo-600 justify-end' : 'bg-zinc-200 justify-start'}`}>
                    <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium mt-auto">
                  {agent.desc}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
