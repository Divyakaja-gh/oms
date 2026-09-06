import React, { useState } from 'react';
import { 
  Bot, 
  UserPlus, 
  Scale, 
  FileSpreadsheet, 
  MessageSquare, 
  Sparkles, 
  Send, 
  ShieldCheck, 
  Zap,
  CheckCircle2,
  Workflow
} from 'lucide-react';
import { OnboardingAgentView } from '../components/agents/OnboardingAgentView';
import { NoticeTriageAgentView } from '../components/agents/NoticeTriageAgentView';
import { GstBankReconAgentView } from '../components/agents/GstBankReconAgentView';
import { CreditPill } from '../components/credits/CreditPill';
import { AgentModuleId } from '../types';

export function AIAgent() {
  const [activeModule, setActiveModule] = useState<AgentModuleId>('onboarding');

  // General NLQ State
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'agent', text: string}[]>([
    { 
      role: 'agent', 
      text: 'Greetings! I am the CAOMS Autonomous Agent Orchestrator for Aarav Advisors. I am connected to your client vaults, statutory filing calendars, and tax jurisprudence knowledge bases. You can ask me natural language queries or switch to one of the dedicated autonomous agents above.' 
    }
  ]);
  const [loadingNlq, setLoadingNlq] = useState(false);

  const handleSendNlq = async () => {
    if (!query.trim()) return;
    
    const userMsg = query;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setLoadingNlq(true);

    try {
      const res = await fetch('/api/agent/query', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer mocked-soc2-jwt-token' 
        },
        body: JSON.stringify({ prompt: userMsg })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'agent', text: data.response }]);
        if (data.creditBalance !== undefined) {
          window.dispatchEvent(new CustomEvent('credits_updated', {
            detail: { creditBalance: data.creditBalance, creditsDeducted: data.creditsDeducted }
          }));
        }
        if (data.fallbackUsed) {
          window.dispatchEvent(new CustomEvent('ai_fallback', { detail: { message: 'Primary model unavailable. Defaulted to fallback model.' } }));
        }
      } else if (res.status === 402) {
        const errData = await res.json();
        setMessages(prev => [...prev, { 
          role: 'agent', 
          text: `⚠️ **Insufficient AI Credits**: ${errData.message || 'You have run out of autonomous credits.'}\n\nPlease click **Top Up** in the header or visit **Accounts & Bills → AI Agent Credits & Metering** to add credits.` 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'agent', text: 'Error: Could not complete query with the agent.' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', text: 'Error: Could not reach the agentic execution backend.' }]);
    } finally {
      setLoadingNlq(false);
    }
  };

  const agentTabs = [
    {
      id: 'onboarding' as AgentModuleId,
      name: 'Client Onboarding Agent',
      subtitle: 'Zero-touch engagement & SA-210',
      icon: UserPlus,
      cost: '5 Credits',
      color: 'indigo'
    },
    {
      id: 'notice_triage' as AgentModuleId,
      name: 'Notice Triage & Defence',
      subtitle: 'ITD 148A / GST DRC-01 reply',
      icon: Scale,
      cost: '8 Credits',
      color: 'amber'
    },
    {
      id: 'gst_bank_recon' as AgentModuleId,
      name: 'GST & Bank Reconciliation',
      subtitle: 'Books vs 2B vs Bank debits',
      icon: FileSpreadsheet,
      cost: '12 Credits',
      color: 'emerald'
    },
    {
      id: 'general_nlq' as AgentModuleId,
      name: 'Firm Natural Language Query',
      subtitle: 'ICAI audit & database Copilot',
      icon: MessageSquare,
      cost: '1 Credit / query',
      color: 'zinc'
    }
  ];

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA] overflow-y-auto">
      
      {/* Top Header */}
      <div className="p-4 sm:p-6 lg:p-8 border-b border-zinc-200 bg-white shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between max-w-[1600px] mx-auto gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-widest flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-600" />
                Autonomous ADK Engine Active
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-widest">
                Tenant: firm_abc
              </span>
            </div>
            <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-3 mt-1.5">
              <Bot className="w-7 h-7 text-indigo-600" />
              Autonomous AI Agents & Agentic Workflows
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-3xl">
              Automate client onboarding contracts, direct/indirect tax litigation defence drafts, and 3-way GST bank reconciliations.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Autonomous Credit Balance Pill */}
            <CreditPill />

            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600 bg-zinc-100 px-3 py-2 rounded-xl border border-zinc-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ICAI & SOC2 Safe</span>
            </div>
          </div>
        </div>

        {/* Workflow Switcher Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-[1600px] mx-auto mt-6">
          {agentTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeModule === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveModule(tab.id)}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  isActive 
                    ? 'bg-white border-indigo-600 ring-2 ring-indigo-600/10 shadow-sm' 
                    : 'bg-zinc-50/70 border-zinc-200 hover:bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-zinc-200/70 text-zinc-700'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-zinc-900 block truncate">{tab.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 block truncate">{tab.subtitle}</span>
                    <span className="text-[10px] font-bold text-indigo-600 font-mono mt-0.5 block">
                      ⚡ {tab.cost}
                    </span>
                  </div>
                </div>

                {isActive && (
                  <div className="absolute top-0 right-0 w-2 h-2 rounded-bl bg-indigo-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Agent Content Area */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {activeModule === 'onboarding' && <OnboardingAgentView />}
        {activeModule === 'notice_triage' && <NoticeTriageAgentView />}
        {activeModule === 'gst_bank_recon' && <GstBankReconAgentView />}

        {/* Tab 4: General NLQ Copilot */}
        {activeModule === 'general_nlq' && (
          <div className="max-w-[1000px] mx-auto bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col h-[650px] overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-zinc-900">Enterprise CA Natural Language Copilot</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-xs font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-800'
                  }`}>
                    {msg.role === 'agent' && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">CAOMS Practice Assistant</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              ))}
              {loadingNlq && (
                <div className="flex justify-start">
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3.5 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
              <div className="relative">
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendNlq()}
                  placeholder="Ask about clients, overdue filings, Advance Tax rules, or ICAI auditing standards..." 
                  className="w-full pl-4 pr-12 py-3 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm font-medium"
                />
                <button 
                  onClick={handleSendNlq}
                  disabled={loadingNlq || !query.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
