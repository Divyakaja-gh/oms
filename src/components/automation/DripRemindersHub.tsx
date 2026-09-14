import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  Play, 
  Calendar, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  Eye, 
  X,
  ToggleLeft,
  ToggleRight,
  Filter
} from 'lucide-react';
import { DripEmailCampaign, DripEmailStep } from '../../types';
import { INITIAL_DRIP_CAMPAIGNS } from '../../data/practiceAutomationData';

export function DripRemindersHub() {
  const [campaigns, setCampaigns] = useState<DripEmailCampaign[]>(() => {
    const saved = localStorage.getItem('caoms_drip_campaigns');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return INITIAL_DRIP_CAMPAIGNS;
  });

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id || '');
  const [previewStep, setPreviewStep] = useState<DripEmailStep | null>(null);
  const [broadcastNotification, setBroadcastNotification] = useState<string | null>(null);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];

  const handleToggleCampaign = (id: string) => {
    const updated = campaigns.map(c => {
      if (c.id === id) {
        return { ...c, active: !c.active };
      }
      return c;
    });
    setCampaigns(updated);
    localStorage.setItem('caoms_drip_campaigns', JSON.stringify(updated));
  };

  const handleTriggerStep = (step: DripEmailStep) => {
    setBroadcastNotification(
      `Drip sequence triggered: "${step.title}" dispatched to ${selectedCampaign?.recipientCount || 25} clients via ${step.channel === 'both' ? 'Email & WhatsApp' : step.channel.toUpperCase()}.`
    );
    setTimeout(() => setBroadcastNotification(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900">
              Automated Drip Email & WhatsApp Reminders
            </h2>
            <p className="text-xs text-zinc-500">
              Self-operating multi-stage nudges for GST filings, advance tax, and DSC token renewals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500">
            Active Campaigns: {campaigns.filter(c => c.active).length} of {campaigns.length}
          </span>
        </div>
      </div>

      {broadcastNotification && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs font-bold text-purple-900 flex items-center gap-3 shadow-xs animate-fadeIn">
          <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
          <span>{broadcastNotification}</span>
        </div>
      )}

      {/* Main Grid: Campaigns List & Visual Sequence Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Campaigns Selector */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
            Configured Drip Sequences
          </h3>

          <div className="space-y-2.5">
            {campaigns.map(camp => (
              <div
                key={camp.id}
                onClick={() => setSelectedCampaignId(camp.id)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedCampaign?.id === camp.id
                    ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-zinc-900">{camp.name}</h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCampaign(camp.id);
                    }}
                    className="shrink-0 text-zinc-500 hover:text-zinc-800"
                    title={camp.active ? 'Disable sequence' : 'Enable sequence'}
                  >
                    {camp.active ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-zinc-400" />
                    )}
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-zinc-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Frequency:</span>
                    <span className="font-semibold text-zinc-700">{camp.frequency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Recipients:</span>
                    <span className="font-semibold text-purple-700">{camp.recipientCount || 20} Active Clients</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Steps:</span>
                    <span className="font-semibold text-zinc-700">{camp.steps.length} Automated Nudges</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Visual Steps Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-5">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase font-mono">
                  {selectedCampaign?.triggerEvent.replace(/_/g, ' ')}
                </span>
                <h3 className="text-sm font-bold text-zinc-900 mt-1">{selectedCampaign?.name}</h3>
              </div>

              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                selectedCampaign?.active ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {selectedCampaign?.active ? 'Status: Active & Polling' : 'Status: Paused'}
              </span>
            </div>

            {/* Sequence Timeline Steps */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-purple-200">
              {selectedCampaign?.steps.map((step, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-purple-600 border-2 border-white shadow-sm flex items-center justify-center text-white text-[9px] font-bold">
                    {idx + 1}
                  </div>

                  <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 hover:border-purple-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          step.dayOffset < 0 ? 'bg-amber-100 text-amber-800' :
                          step.dayOffset === 0 ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {step.dayOffset < 0 ? `${Math.abs(step.dayOffset)} Days Before Due` :
                           step.dayOffset === 0 ? 'On Due Date' :
                           `${step.dayOffset} Day(s) Overdue`}
                        </span>
                        <span className="text-xs font-bold text-zinc-900">{step.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200/80 text-zinc-700 capitalize flex items-center gap-1">
                          {step.channel === 'both' ? (
                            <>
                              <Mail className="w-2.5 h-2.5" />
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>Email + WhatsApp</span>
                            </>
                          ) : step.channel === 'whatsapp' ? (
                            <>
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>WhatsApp</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-2.5 h-2.5" />
                              <span>Email</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-zinc-600">
                      <span className="font-semibold text-zinc-800">Subject:</span> {step.subject}
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-200/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setPreviewStep(step)}
                        className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Template & Variables</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTriggerStep(step)}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Play className="w-3 h-3" />
                        <span>Trigger Broadcast Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step Preview Modal */}
      {previewStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-zinc-900">Drip Template Preview</h3>
              </div>
              <button 
                onClick={() => setPreviewStep(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Email Subject</label>
                <div className="text-xs font-bold text-zinc-900 mt-1 p-2.5 bg-zinc-100 rounded-lg border border-zinc-200">
                  {previewStep.subject}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Message Body</label>
                <div className="text-xs text-zinc-800 whitespace-pre-line mt-1 p-3 bg-zinc-50 rounded-lg border border-zinc-200 font-mono leading-relaxed">
                  {previewStep.templateBody}
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-[11px] text-purple-900">
                <strong>Dynamic Replacements:</strong> [ClientName], [Month], [DueMinus5], [ExpiryDate], [KycPortalLink] are automatically substituted per client record prior to transmission.
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 bg-zinc-50 text-right">
              <button
                onClick={() => setPreviewStep(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200 rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
